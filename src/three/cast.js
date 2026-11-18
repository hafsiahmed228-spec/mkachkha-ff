// Characters in the 3D scene: spawning, movement, animation, poses, camera framing, labels
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BODIES, loadGLB, clipsFor, Avatar } from './avatar.js';
import { applyPose, CLIP_POSES } from './poses.js';

const lerpAng = (a, b, t) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };

export class Cast {
  constructor(engine, opts) {
    this.E = engine; this.base = opts.base; this.list = []; this.active = 0; this.mode = 'edit'; this.duo = null;
    this.joy = { x: 0, y: 0 }; this.keys = {}; this.showTags = true; this.customBodies = opts.customBodies || {};
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.44, 48), new THREE.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.02; engine.scene.add(this.ring);
    engine.onFrame((dt, t) => this.update(dt, t));
    // thumbnails
    this.tr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); this.tr.setSize(240, 300);
    this.tr.outputColorSpace = THREE.SRGBColorSpace; this.tr.toneMapping = THREE.ACESFilmicToneMapping;
    this.ts = new THREE.Scene(); this.ts.environment = new THREE.PMREMGenerator(this.tr).fromScene(new RoomEnvironment(), 0.04).texture;
    const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(1.5, 3, 4); this.ts.add(dl, new THREE.HemisphereLight(0xffffff, 0x444455, 0.4));
    this.tc = new THREE.PerspectiveCamera(26, 240 / 300, 0.05, 30);
  }
  get cur() { return this.list[this.active]; }
  bodyDef(key) { return BODIES[key] || this.customBodies[key] || BODIES.ahmed; }
  async load(key) { const def = this.bodyDef(key); const url = def.url || (this.base + def.file); const g = await loadGLB(url); const clips = await clipsFor(key, g, this.base); return { def, g, clips }; }
  async makeAvatar(state) { const { def, g, clips } = await this.load(state.body); const av = new Avatar(def, g, state); av.clips = clips; av.play('idle', 0); av.mixer.update(Math.random() * 2); return av; }
  async add(state, pos) {
    const av = await this.makeAvatar(state);
    const e = { state, av, pos: pos ? pos.clone() : new THREE.Vector3(), yaw: 0, targetYaw: 0, moving: 0, y: 0, vy: 0, pose: null, look: true, hug: null, hugSide: 1, seed: Math.random() * 6 };
    this.E.scene.add(av.root); this.place(e); this.list.push(e); this.makeTag(e); this.thumb(e); return e;
  }
  async rebuild(e) {
    if (!e) return;
    if (e.av.def !== this.bodyDef(e.state.body)) { const old = e.av; const av = await this.makeAvatar(e.state); this.E.scene.remove(old.root); this.dispose(old); e.av = av; this.E.scene.add(av.root); }
    else { e.av.state = e.state; e.av.applyState(); e.av.buildExtras(); }
    e.av.ikState = null; this.place(e); this.makeTag(e); this.thumb(e);
  }
  dispose(av) { av.root.traverse(o => { if (o.isMesh) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } }); }
  remove(i) { const e = this.list[i]; if (!e) return; this.E.scene.remove(e.av.root); if (e.tag) this.E.scene.remove(e.tag); if (e.bubble) this.E.scene.remove(e.bubble); this.dispose(e.av); this.list.splice(i, 1); this.active = Math.min(this.active, this.list.length - 1); }
  place(e) { e.av.root.position.set(e.pos.x, e.y, e.pos.z); e.av.root.rotation.y = e.yaw; }
  makeTag(e) {
    if (e.tag) { this.E.scene.remove(e.tag); e.tag.material.map.dispose(); e.tag.material.dispose(); e.tag = null; }
    const name = (e.state.name || '').trim(); if (!name) return;
    const c = document.createElement('canvas'); c.width = 512; c.height = 112; const g = c.getContext('2d');
    g.font = '800 54px Cairo, sans-serif'; const w = Math.min(500, g.measureText(name).width + 60);
    g.fillStyle = 'rgba(10,13,24,.7)'; g.beginPath(); (g.roundRect ? g.roundRect((512 - w) / 2, 14, w, 84, 40) : g.rect((512 - w) / 2, 14, w, 84)); g.fill();
    g.fillStyle = '#ffc83d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.fillText(name, 256, 58);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    e.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true, toneMapped: false })); e.tag.scale.set(0.8, 0.175, 1); this.E.scene.add(e.tag);
  }
  bubbleOn(e, text) {
    this.bubbleOff(e);
    const c = document.createElement('canvas'); c.width = 640; c.height = 240; const g = c.getContext('2d');
    g.font = '700 40px Cairo, sans-serif'; g.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr';
    const words = text.split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const tl = cur ? cur + ' ' + w : w; if (g.measureText(tl).width > 560 && cur) { lines.push(cur); cur = w; } else cur = tl; } if (cur) lines.push(cur);
    const L = lines.slice(0, 3), h = L.length * 50 + 36, top = 200 - h;
    g.fillStyle = '#fff'; g.strokeStyle = '#14141c'; g.lineWidth = 6; g.beginPath(); (g.roundRect ? g.roundRect(20, top, 600, h, 30) : g.rect(20, top, 600, h)); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(290, top + h - 3); g.lineTo(320, 236); g.lineTo(350, top + h - 3); g.fill();
    g.fillStyle = '#14141c'; g.textAlign = 'center'; g.textBaseline = 'middle'; L.forEach((l, i) => g.fillText(l, 320, top + 43 + i * 50));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    e.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, depthTest: false, transparent: true, toneMapped: false })); e.bubble.renderOrder = 10; e.bubble.scale.set(1.2, 0.45, 1); this.E.scene.add(e.bubble);
  }
  bubbleOff(e) { if (e.bubble) { this.E.scene.remove(e.bubble); e.bubble.material.map.dispose(); e.bubble.material.dispose(); e.bubble = null; } }
  thumb(e) {
    const av = e.av, r = av.root, par = r.parent, p = r.position.clone(), ry = r.rotation.y;
    this.ts.add(r); r.position.set(0, 0, 0); r.rotation.y = 0; av.mixer.update(0); r.updateMatrixWorld(true);
    const h = av.height; this.tc.position.set(0, h * 0.82, 1.55 * h * 0.62); this.tc.lookAt(0, h * 0.78, 0);
    this.tr.render(this.ts, this.tc); e.thumbHead = this.tr.domElement.toDataURL('image/png');
    this.tc.position.set(0, h * 0.55, h * 2.25); this.tc.lookAt(0, h * 0.5, 0); this.tr.render(this.ts, this.tc); e.thumb = this.tr.domElement.toDataURL('image/png');
    if (par) par.add(r); else this.ts.remove(r); r.position.copy(p); r.rotation.y = ry;
  }
  setMode(m) { this.mode = m; this.duo = null; this.list.forEach((c, i) => { c.av.root.visible = m !== 'edit' || i === this.active; c.pose = m === 'edit' ? null : c.pose; c.hug = null; }); }
  frameEditor() { const e = this.cur; if (!e) return; const h = e.av.height, E = this.E; const tgt = new THREE.Vector3(e.pos.x, h * 0.52, e.pos.z);
    const f = new THREE.Vector3(Math.sin(e.yaw), 0, Math.cos(e.yaw)); E.controls.target.copy(tgt); E.camera.position.copy(tgt).addScaledVector(f, E.fitDist(0.55, h * 0.58) * 1.05).add(new THREE.Vector3(0, 0.1, 0)); }
  frameWorld() { const e = this.cur; if (!e) return; const h = e.av.height, E = this.E; const back = new THREE.Vector3(Math.sin(e.yaw), 0, Math.cos(e.yaw));
    E.controls.target.set(e.pos.x, h * 0.55, e.pos.z); E.camera.position.set(e.pos.x, h * 0.55 + 0.7, e.pos.z).addScaledVector(back, E.fitDist(1.4, h * 1.1) * 1.05); }
  spawnAll(z) { this.list.forEach((c, i) => { c.pos.set((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.85, 0, z); c.y = 0; c.vy = 0; c.yaw = 0; c.targetYaw = 0; c.pose = null; c.hug = null; this.place(c); }); this.duo = null; }
  lineUp(selfie) {
    const a = this.cur, E = this.E; if (!a) return;
    const toCam = new THREE.Vector3().subVectors(E.camera.position, a.pos).setY(0).normalize();
    const yaw = Math.atan2(toCam.x, toCam.z), right = new THREE.Vector3(toCam.z, 0, -toCam.x);
    a.yaw = a.targetYaw = yaw;
    this.list.forEach(c => { c.hug = null; c.look = true; });
    const others = this.list.filter(c => c !== a); let offR = 0, offL = 0; const placed = [];
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    others.forEach((c, k) => { const side = k % 2 === 0 ? 1 : -1; const sp = (a.av.width + c.av.width) / 2 + 0.08;
      if (side > 0) offR += sp; else offL += sp; c.pos.copy(a.pos).addScaledVector(right, side > 0 ? offR : -offL); c.yaw = c.targetYaw = yaw; c.y = 0; c.vy = 0; placed.push({ c, side, k }); });
    a.pose = selfie ? 'selfie' : pick(['peace', 'crossed', 'hips', 'shh']);
    placed.forEach(p => { if (p.k < 2) { p.c.pose = pick(['peace', 'idle', 'thumbs', 'crossed']); p.c.hug = a; p.c.hugSide = -p.side; } else p.c.pose = pick(['peace', 'cheer', 'wave', 'crossed', 'flex']); });
    const r1 = placed.find(p => p.k === 0); if (!selfie && r1 && a.pose !== 'crossed') { a.hug = r1.c; a.hugSide = r1.side; if (a.pose === 'peace' && r1.side < 0) a.pose = 'hips'; }
    const mid = a.pos.clone().addScaledVector(right, (offR - offL) / 2);
    const maxH = Math.max(...this.list.map(c => c.av.height)), maxW = Math.max(...this.list.map(c => c.av.width)), halfW = (offR + offL) / 2 + maxW / 2 + 0.2;
    this.duo = { target: new THREE.Vector3(mid.x, selfie ? maxH * 0.8 : maxH * 0.52, mid.z), group: true };
    const dist = selfie ? E.fitDist(halfW, maxH * 0.24) * 1.05 : E.fitDist(halfW, maxH * 0.6) * 1.08;
    E.controls.target.copy(this.duo.target); E.camera.position.copy(this.duo.target).addScaledVector(toCam, dist).add(new THREE.Vector3(0, selfie ? 0.3 : 0.12, 0));
  }
  frame(kind) {
    const E = this.E, isG = !!(this.duo && this.duo.group), group = isG ? this.list : [this.cur];
    const cx = group.reduce((s, c) => s + c.pos.x, 0) / group.length, cz = group.reduce((s, c) => s + c.pos.z, 0) / group.length;
    const maxH = Math.max(...group.map(c => c.av.height)); let halfW = 0.3; group.forEach(c => halfW = Math.max(halfW, Math.hypot(c.pos.x - cx, c.pos.z - cz) + c.av.width / 2 + 0.12));
    const dir = E.camera.position.clone().sub(E.controls.target).setY(0).normalize(); let ty, dist, up = 0.1;
    if (kind === 'full') { ty = maxH * 0.52; dist = E.fitDist(halfW, maxH * 0.6) * 1.08; }
    if (kind === 'medium') { ty = maxH * 0.74; dist = E.fitDist(halfW, maxH * 0.3) * 1.05; }
    if (kind === 'close') { ty = maxH * 0.9; dist = E.fitDist(group.length > 1 ? halfW : Math.min(halfW, 0.3), maxH * 0.12) * 1.1; }
    if (kind === 'hero') { ty = maxH * 0.6; dist = E.fitDist(halfW, maxH * 0.68) * 1.02; up = -maxH * 0.45; }
    this.duo = { target: new THREE.Vector3(cx, ty, cz), group: isG }; E.controls.target.copy(this.duo.target); E.camera.position.copy(this.duo.target).addScaledVector(dir, dist).add(new THREE.Vector3(0, up, 0));
  }
  jump() { const e = this.cur; if (e && e.y === 0 && e.vy === 0) e.vy = 4.2; }
  update(dt, t) {
    const E = this.E, a = this.cur; if (!a) return;
    // movement
    let jx = this.joy.x, jy = this.joy.y; const K = this.keys;
    if (K.w || K.arrowup) jy = -1; if (K.s || K.arrowdown) jy = 1; if (K.a || K.arrowleft) jx = -1; if (K.d || K.arrowright) jx = 1;
    const mag = Math.min(1, Math.hypot(jx, jy));
    this.list.forEach(c => { if (c !== a) c.moving += (0 - c.moving) * Math.min(1, dt * 10); });
    if (this.mode === 'world' && mag > 0.12) {
      const f = new THREE.Vector3(); E.camera.getWorldDirection(f); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x);
      const mv = f.multiplyScalar(-jy).addScaledVector(r, jx).normalize();
      a.targetYaw = Math.atan2(mv.x, mv.z); a.moving += (mag - a.moving) * Math.min(1, dt * 8);
      const sp = (mag > 0.8 ? 4.2 : 1.7) * Math.max(0.5, mag);
      const before = a.pos.clone(); a.pos.addScaledVector(mv, sp * dt);
      for (const c of E.worlds.colliders) { const dx = a.pos.x - c.x, dz = a.pos.z - c.z, d = Math.hypot(dx, dz), mn = c.r + 0.3; if (d < mn && d > 1e-4) { a.pos.x = c.x + dx / d * mn; a.pos.z = c.z + dz / d * mn; } }
      E.worlds.clampBounds(a.pos);
      a.pose = null; a.hug = null;
      if (this.duo) { this.duo = null; this.list.forEach(c => { c.pose = null; c.hug = null; }); }
      const dl = a.pos.clone().sub(before); E.camera.position.add(dl); E.controls.target.add(dl);
    } else a.moving += (0 - a.moving) * Math.min(1, dt * 10);
    for (const c of this.list) {
      const av = c.av;
      let clip = c.moving > 0.62 ? 'run' : c.moving > 0.08 ? 'walk' : (CLIP_POSES[c.pose] || 'idle');
      av.play(clip, 0.25);
      if (c.y > 0 || c.vy !== 0) { c.vy -= dt * 13; c.y += c.vy * dt; if (c.y <= 0) { c.y = 0; c.vy = 0; } }
      c.yaw = lerpAng(c.yaw, c.targetYaw, Math.min(1, dt * 12));
      av.root.position.set(c.pos.x, c.y, c.pos.z); av.root.rotation.y = c.yaw;
      av.mixer.update(dt * (c.moving > 0.62 ? 1 : c.moving > 0.08 ? Math.max(0.7, c.moving * 1.4) : 1));
      av.root.updateMatrixWorld(true);
      if (!c.moving || c.moving < 0.08) applyPose(c, dt, t, E.camera); else av.ikState = null;
      const h = av.height;
      if (c.tag) { c.tag.position.set(c.pos.x, c.y + h + 0.16, c.pos.z); c.tag.visible = this.showTags && this.mode !== 'edit' && av.root.visible; }
      if (c.bubble) c.bubble.position.set(c.pos.x, c.y + h + (c.tag && c.tag.visible ? 0.5 : 0.36), c.pos.z);
    }
    this.ring.position.set(a.pos.x, 0.02, a.pos.z); this.ring.visible = this.mode === 'world' && this.list.length > 1;
    if (this.mode === 'world' && !this.duo) { const want = new THREE.Vector3(a.pos.x, a.av.height * 0.55 + a.y * 0.5, a.pos.z); const d = want.sub(E.controls.target).multiplyScalar(Math.min(1, dt * 6)); E.controls.target.add(d); E.camera.position.add(d); }
    E.followLight(a.pos);
  }
}
