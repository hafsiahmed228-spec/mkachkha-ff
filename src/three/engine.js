// Renderer, camera, post-processing, world system, render loop
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createWorlds } from './worlds.js';

export function createEngine(canvas, ctx) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  const quality = ctx.quality || 'high';
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? 1 : quality === 'mid' ? 1.4 : 1.8));
  renderer.shadowMap.enabled = quality !== 'low'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xd6ecff, 22, 60);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 220); camera.position.set(0, 1.6, 4.5);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 0.6; controls.maxDistance = 18; controls.maxPolarAngle = 1.55; controls.target.set(0, 1, 0);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.5, 1.35); composer.addPass(bloom); composer.addPass(new OutputPass());
  const hemi = new THREE.HemisphereLight(0xffffff, 0xc8ab86, 1); scene.add(hemi);
  const charLight = new THREE.PointLight(0xffd59a, 0, 8, 1.6); scene.add(charLight);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2); sun.castShadow = true; sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  const worlds = createWorlds({ scene, renderer, hemi, sun, charLight, bloom, ...ctx.worldCtx });
  let running = true, hooks = [];
  const clock = new THREE.Clock();
  function fitDist(halfW, halfH) { const v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect); return Math.max(halfH / Math.tan(v), halfW / Math.tan(h)); }
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(canvas); addEventListener('resize', resize);
  function loop() {
    requestAnimationFrame(loop);
    if (!running) { clock.getDelta(); return; }
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    for (const h of hooks) h(dt, t);
    worlds.updateWorld(dt, t);
    controls.update();
    composer.render();
  }
  function capture() { composer.render(); return renderer.domElement; }
  function followLight(p) { sun.position.set(p.x + 6, 11, p.z + 5); sun.target.position.set(p.x, 0, p.z); charLight.position.set(p.x, 2.4, p.z + 1.2); }
  resize(); loop();
  return { renderer, scene, camera, controls, composer, bloom, worlds, fitDist, resize, capture, followLight,
    onFrame: f => hooks.push(f), setRunning: v => { running = v; }, get running() { return running; } };
}
