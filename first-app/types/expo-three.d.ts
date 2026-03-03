declare module 'expo-three' {
  import * as THREE from 'three';

  interface RendererOptions {
    gl: any;
    canvas?: any;
    width?: number;
    height?: number;
    pixelRatio?: number;
  }

  export class Renderer extends THREE.WebGLRenderer {
    constructor(options: RendererOptions);
  }

  export function loadAsync(
    res: number | string | any,
    type?: string,
    name?: string
  ): Promise<any>;
}
