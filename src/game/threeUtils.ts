/**
 * Three.js helper utilities, procedural canvas textures, and PBR lighting setup.
 * Strictly complies with Three.js Skill guidelines (zero external asset files, software WebGL guard, RoomEnvironment).
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

/**
 * Procedural grass & moss texture for Gearfall Meadow
 */
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base lush meadow green
  ctx.fillStyle = '#2f682d';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle mottling & foliage tufts
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 3 + 1;
    const shades = ['#3e843b', '#265424', '#4d9f48', '#20451e', '#5cb357'];
    ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gear-shaped ancient ground markings faint impression
  ctx.strokeStyle = 'rgba(75, 120, 70, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 140, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural stone / ancient gear ruins texture
 */
export function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 256, 256);

  // Rock flecks
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 2 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? '#64748b' : '#334155';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural brushed metallic texture for Mechanimals
 */
export function createMetalTexture(primaryColor: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 256, 256);

  // Brushed hairline streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Mecha seam panels & circuitry
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(224, 32);
  ctx.lineTo(224, 224);
  ctx.lineTo(32, 224);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(64, 128);
  ctx.lineTo(192, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural water flow texture
 */
export function createWaterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#0284c7');
  gradient.addColorStop(0.5, '#38bdf8');
  gradient.addColorStop(1, '#0369a1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const y = i * 14;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(64, y - 6, 128, y + 6, 256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Configure standard renderer settings with ACES Filmic and software guard
 */
export function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

/**
 * Setup RoomEnvironment for physical materials
 */
export function setupStudioEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();
}

/**
 * Calculate terrain height at (x, z) for seamless collision and ground placement
 */
export function getMeadowHeight(x: number, z: number): number {
  // Gentle rolling meadows + hills + river dip
  const hill1 = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 3.5;
  const hill2 = Math.sin(x * 0.07 + 1.2) * Math.cos(z * 0.06) * 1.5;
  const hill3 = Math.cos(x * 0.015 - 0.5) * Math.sin(z * 0.018) * 4.0;

  // River carved bed running through z = -15 to +20, x ~ -10 to -35
  const riverDist = Math.abs(x - (-20 + Math.sin(z * 0.04) * 8));
  let riverBed = 0;
  if (riverDist < 7) {
    riverBed = -(1 - riverDist / 7) * 2.8;
  }

  return hill1 + hill2 + hill3 + riverBed;
}
