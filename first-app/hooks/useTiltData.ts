import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { SMOOTHING } from '../lib/constants';

export type TiltSource = 'phone' | 'esp32' | 'joystick';

export interface TiltData {
  pitch: number; // -1 to 1, forward/backward
  roll: number;  // -1 to 1, left/right
}

export function useTiltData(
  source: TiltSource,
  deviceId?: string
): TiltData {
  const smoothedPitch = useRef(0);
  const smoothedRoll = useRef(0);
  const [tilt, setTilt] = useState<TiltData>({ pitch: 0, roll: 0 });

  // Joystick values are set externally via setJoystick
  const joystickRef = useRef<TiltData>({ pitch: 0, roll: 0 });

  useEffect(() => {
    if (source === 'phone') {
      Accelerometer.setUpdateInterval(16); // ~60Hz

      const subscription = Accelerometer.addListener((data) => {
        // Map accelerometer to -1..1 range
        // data.x = left/right tilt, data.y = forward/backward tilt
        const rawRoll = Math.max(-1, Math.min(1, data.x * 2));
        // Invert phone Y so up/down tilt direction matches gameplay expectation.
        const rawPitch = Math.max(-1, Math.min(1, -data.y * 2));

        // Apply smoothing
        smoothedPitch.current += SMOOTHING * (rawPitch - smoothedPitch.current);
        smoothedRoll.current += SMOOTHING * (rawRoll - smoothedRoll.current);

        setTilt({
          pitch: smoothedPitch.current,
          roll: smoothedRoll.current,
        });
      });

      return () => subscription.remove();
    }

    if (source === 'esp32' && deviceId) {
      const tiltRef = ref(rtdb, `/controllers/${deviceId}/tilt`);
      const unsubscribe = onValue(tiltRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const rawPitch = val.pitch ?? 0;
          const rawRoll = val.roll ?? 0;

          smoothedPitch.current += SMOOTHING * (rawPitch - smoothedPitch.current);
          smoothedRoll.current += SMOOTHING * (rawRoll - smoothedRoll.current);

          setTilt({
            pitch: smoothedPitch.current,
            roll: smoothedRoll.current,
          });
        }
      });

      return () => unsubscribe();
    }

    if (source === 'joystick') {
      // Joystick mode: poll from ref at 60Hz
      const interval = setInterval(() => {
        const raw = joystickRef.current;
        smoothedPitch.current += SMOOTHING * (raw.pitch - smoothedPitch.current);
        smoothedRoll.current += SMOOTHING * (raw.roll - smoothedRoll.current);

        setTilt({
          pitch: smoothedPitch.current,
          roll: smoothedRoll.current,
        });
      }, 16);

      return () => clearInterval(interval);
    }
  }, [source, deviceId]);

  return tilt;
}

/**
 * Ref-based version for the render loop — avoids re-render overhead.
 * The game loop reads from the returned ref directly.
 */
export function useTiltRef(source: TiltSource, deviceId?: string) {
  const tiltRef = useRef<TiltData>({ pitch: 0, roll: 0 });
  const smoothedPitch = useRef(0);
  const smoothedRoll = useRef(0);

  useEffect(() => {
    if (source === 'phone') {
      Accelerometer.setUpdateInterval(16);

      const subscription = Accelerometer.addListener((data) => {
        const rawRoll = Math.max(-1, Math.min(1, data.x * 2));
        const rawPitch = Math.max(-1, Math.min(1, -data.y * 2));

        smoothedPitch.current += SMOOTHING * (rawPitch - smoothedPitch.current);
        smoothedRoll.current += SMOOTHING * (rawRoll - smoothedRoll.current);

        tiltRef.current = {
          pitch: smoothedPitch.current,
          roll: smoothedRoll.current,
        };
      });

      return () => subscription.remove();
    }

    if (source === 'esp32' && deviceId) {
      const dbRef = ref(rtdb, `/controllers/${deviceId}/tilt`);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          smoothedPitch.current += SMOOTHING * ((val.pitch ?? 0) - smoothedPitch.current);
          smoothedRoll.current += SMOOTHING * ((val.roll ?? 0) - smoothedRoll.current);

          tiltRef.current = {
            pitch: smoothedPitch.current,
            roll: smoothedRoll.current,
          };
        }
      });

      return () => unsubscribe();
    }
  }, [source, deviceId]);

  return tiltRef;
}
