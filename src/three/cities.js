// Real-world inspired cities (stylized landmarks): Paris, London, New York, Ibiza, Tunis, Dubai
import * as THREE from 'three';

let T; // toolkit from worlds.js
const glowMat = (m, dayI = 0, nightI = 1.3) => { m.userData.glow = { day: dayI, night: nightI }; T.glowMats.push(m); return m; };
function beam(wg, a, b, w, mat, sh = true) { const len = a.distanceTo(b); const m = new THREE.Mesh(T.BOX, mat); m.scale.set(w, w, len); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.castShadow = sh; wg.add(m); return m; }
function facadeTex(style, seed = 1) {
  const W = 256, H = 256; const bays = 4, floors = 5;
  const base = T.canvasTex(W, H, (g) => {
    const bw = W / bays, fh = H / floors;
    const wall = { haus: '#e8dcc2', brick: '#8c4a36', glass: '#33405a', colonial: '#f3efe6', villa: '#fbfaf6', burj: '#9fb3c8' }[style];
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    if (style === 'brick') { g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 6) { g.fillRect(0, y, W, 1); for (let x = (y / 6 % 2) * 6; x < W; x += 12) g.fillRect(x, y, 1, 6); } }
    if (style === 'glass') { g.fillStyle = '#5d7397'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 2, H); for (let y = 0; y < H; y += 12) g.fillRect(0, y, W, 2); return; }
    if (style === 'burj') { g.fillStyle = '#d9e4ef'; for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 3, H); return; }
    for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
      const x = b * bw + bw * 0.28, y = f * fh + fh * 0.22, w = bw * 0.44, h = fh * 0.6;
      g.fillStyle = style === 'colonial' || style === 'villa' ? '#2f6db5' : '#26303d'; g.fillRect(x, y, w, h);
      if (style === 'colonial') { g.fillStyle = '#1d4f8a'; g.fillRect(x - 5, y, 4, h); g.fillRect(x + w + 1, y, 4, h); }
      if (style === 'haus' || style === 'colonial') { g.fillStyle = '#1b1b1f'; g.fillRect(x - 4, y + h - 3, w + 8, 3); for (let k = 0; k < 6; k++) g.fillRect(x - 3 + k * (w + 6) / 5, y + h - 12, 1.5, 10); }
      if (style === 'haus') { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, f * fh, W, 2); }
    }
  });
  const em = T.canvasTex(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const bw = W / bays, fh = H / floors, cols = style === 'glass' || style === 'burj' ? 16 : bays, rows = style === 'glass' || style === 'burj' ? 21 : floors;
    for (let f = 0; f < rows; f++) for (let b = 0; b < cols; b++) { const r = Math.random(); if (r < 0.45) continue;
      g.fillStyle = r < 0.8 ? '#ffd9a0' : '#bfe3ff'; g.globalAlpha = 0.55 + Math.random() * 0.45;
      if (cols === bays) g.fillRect(b * bw + bw * 0.28, f * fh + fh * 0.22, bw * 0.44, fh * 0.6); else g.fillRect(b * (W / cols) + 2, f * (H / rows) + 2, W / cols - 5, H / rows - 4); }
    g.globalAlpha = 1; });
  return { base, em };
}
function building(wg, x, z, w, h, d, style, opts = {}) {
  const { base, em } = facadeTex(style); const rx = Math.max(1, Math.round(w / 8)), ry = Math.max(1, Math.round(h / 12));
  [base, em].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); });
  const mat = glowMat(new THREE.MeshStandardMaterial({ map: base, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 0, roughness: style === 'glass' || style === 'burj' ? 0.25 : 0.85, metalness: style === 'glass' || style === 'burj' ? 0.5 : 0 }));
  const m = T.mk(new THREE.BoxGeometry(w, h, d), mat, wg, { p: [x, h / 2, z], recv: true }); if (opts.ry) m.rotation.y = opts.ry;
  if (opts.roof === 'mansard') { const r = T.mk(new THREE.CylinderGeometry(w * 0.42, w * 0.56, 3.2, 4, 1), T.PM('#3d4654', { roughness: 0.6, metalness: 0.3 }), wg, { p: [x, h + 1.6, z], r: [0, Math.PI / 4, 0] }); r.scale.set(1, 1, d / w); }
  if (opts.roof === 'flat') T.mk(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), T.PM(opts.trim || '#d8cdb8'), wg, { p: [x, h + 0.25, z] });
  T.colliders.push({ x, z, r: Math.max(w, d) * 0.55 }); return m;
}
function tree(wg, x, z, s = 1, col = '#3f8f3a') { T.mk(T.cyl(0.18 * s, 0.25 * s, 2.6 * s, 8), T.PM('#6b4a2f'), wg, { p: [x, 1.3 * s, z] });
  for (let k = 0; k < 5; k++) { const a = k * 1.3; T.mk(T.SPH, T.PM(col, { roughness: 0.95 }), wg, { p: [x + Math.cos(a) * 0.7 * s, (3 + (k % 2) * 0.6) * s, z + Math.sin(a) * 0.7 * s], s: [1.3 * s, 1.1 * s, 1.3 * s] }); }
  T.colliders.push({ x, z, r: 0.4 * s }); }
function streetLamp(wg, x, z, col = '#ffd9a0', style = 'classic') { const m = T.PM('#1d1f24', { roughness: 0.4, metalness: 0.6 });
  T.mk(T.cyl(0.07, 0.11, 4.2, 10), m, wg, { p: [x, 2.1, z] });
  if (style === 'classic') { T.mk(T.cyl(0.22, 0.12, 0.5, 6), m, wg, { p: [x, 4.45, z] }); T.lamp(wg, x, 4.4, z, col, 0.17); }
  else { T.mk(T.BOX, m, wg, { p: [x + 0.5, 4.2, z], s: [1.1, 0.08, 0.12] }); T.lamp(wg, x + 0.95, 4.12, z, col, 0.13); }
  T.colliders.push({ x, z, r: 0.25 }); }
function car(wg, x, z, ry, col, kind = 'car') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; wg.add(g);
  const paint = T.PM(col, { roughness: 0.25, metalness: 0.6 }), glass = T.PM('#1b2430', { roughness: 0.1, metalness: 0.8 }), rub = T.PM('#111', { roughness: 0.9 });
  const L = kind === 'super' ? 4.4 : 4.6, Wd = 1.9;
  T.mk(T.rbox(Wd, kind === 'super' ? 0.6 : 0.8, L, 0.25), paint, g, { p: [0, kind === 'super' ? 0.6 : 0.75, 0] });
  T.mk(T.rbox(Wd * 0.86, kind === 'super' ? 0.45 : 0.7, L * 0.48, 0.25), glass, g, { p: [0, kind === 'super' ? 1.05 : 1.45, kind === 'super' ? -0.2 : -0.1] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.mk(T.cyl(0.36, 0.36, 0.28, 18), rub, g, { p: [sx * Wd * 0.47, 0.36, sz * L * 0.32], r: [0, 0, Math.PI / 2] });
  for (const sx of [-1, 1]) { T.mk(T.SPH, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 1.5 }), g, { p: [sx * 0.65, 0.8, L / 2], s: [0.18, 0.1, 0.05], shadow: false });
    T.mk(T.BOX, new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1020, emissiveIntensity: 1.2 }), g, { p: [sx * 0.65, 0.85, -L / 2], s: [0.35, 0.1, 0.05], shadow: false }); }
  if (kind === 'taxi') { const s = T.canvasTex(128, 48, (c, w, h) => { c.fillStyle = '#fff7c2'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '800 32px sans-serif'; c.textAlign = 'center'; c.fillText('TAXI', w / 2, 36); });
    T.mk(T.rbox(0.7, 0.3, 0.3, 0.05), new THREE.MeshStandardMaterial({ map: s, emissive: 0xffffff, emissiveMap: s, emissiveIntensity: 0.6 }), g, { p: [0, 1.95, -0.1] }); }
  T.colliders.push({ x, z, r: 1.6 }); return g;
}
function flagTex(kind) { return T.canvasTex(192, 128, (g, w, h) => {
  if (kind === 'tn') { g.fillStyle = '#e70013'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 38, 0, 7); g.fill();
    g.fillStyle = '#e70013'; g.beginPath(); g.arc(w / 2 - 4, h / 2, 29, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2 + 6, h / 2, 23, 0, 7); g.fill();
    g.fillStyle = '#e70013'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; g.lineTo(w / 2 + 8 + Math.cos(a) * 15, h / 2 + Math.sin(a) * 15); } g.fill(); }
}); }
function flagPole(wg, x, z, kind, h = 7) { T.mk(T.cyl(0.05, 0.07, h, 8), T.PM('#d0d4da', { metalness: 0.8, roughness: 0.3 }), wg, { p: [x, h / 2, z] });
  const pg = new THREE.PlaneGeometry(1.8, 1.2, 12, 4); const fl = new THREE.Mesh(pg, T.PM('#fff', { map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.9 })); fl.position.set(x - 0.92, h - 0.7, z); wg.add(fl); T.addFlag(fl); }
function ground(wg, draw, rep, size = 160, color) { const t = T.canvasTex(256, 256, draw, rep); T.mk(new THREE.PlaneGeometry(size, size), T.PM(color || '#ffffff', { map: t, roughness: 0.9 }), wg, { r: [-Math.PI / 2, 0, 0], shadow: false, recv: true }); }
const tiles = (a, b, line) => (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; g.fillRect(4, 4, 120, 120); g.fillRect(132, 132, 120, 120); g.strokeStyle = line; g.lineWidth = 4; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); };
function road(wg, w, len, z0 = 0, x0 = 0) { const t = T.canvasTex(128, 512, (g, W, H) => { g.fillStyle = '#2b2d33'; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { const v = 35 + Math.random() * 20 | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } g.fillStyle = '#e8e2c8'; for (let y = 0; y < H; y += 64) g.fillRect(W / 2 - 3, y, 6, 34); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, len / 20); T.mk(new THREE.PlaneGeometry(w, len), T.PM('#ffffff', { map: t, roughness: 0.75 }), wg, { r: [-Math.PI / 2, 0, 0], p: [x0, 0.01, z0], shadow: false, recv: true }); }
function clockFace(size, col = '#f4ecd2') { const t = T.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#1e1e22'; g.fillRect(0, 0, w, h); g.fillStyle = col; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(128 + Math.cos(a) * 92 - 3, 128 + Math.sin(a) * 92 - 8, 6, 16); }
  g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.moveTo(128, 128); g.lineTo(178, 140); g.stroke(); });
  return glowMat(new THREE.MeshStandardMaterial({ map: t, emissive: 0xfff0c0, emissiveMap: t, emissiveIntensity: 0, roughness: 0.6 }), 0, 0.9); }

/* ---------------- PARIS ---------------- */
function paris(wg) {
  ground(wg, tiles('#d9cfbd', '#cfc3ad', '#b9ab92'), 40);
  road(wg, 9, 140, -20, 0);
  const iron = T.PM('#5a4330', { roughness: 0.55, metalness: 0.55 }); const E = new THREE.Group(); E.position.set(0, 0, -75); wg.add(E);
  const lvl = [[0, 15], [10, 10.2], [22, 5.2], [40, 2.6], [60, 0.9]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < lvl.length - 1; i++) { const [y1, r1] = lvl[i], [y2, r2] = lvl[i + 1]; for (const off of [-0.9, 0.9]) beam(E, new THREE.Vector3(sx * r1 + (i < 2 ? off : 0), y1, sz * r1 + (i < 2 ? -off * sx * sz : 0)), new THREE.Vector3(sx * r2, y2, sz * r2), i < 2 ? 1.1 : 0.7, iron); }
  for (let i = 1; i < lvl.length - 1; i++) { const [y, r] = lvl[i]; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) beam(E, new THREE.Vector3(a[0] * r, y, a[1] * r), new THREE.Vector3(b[0] * r, y, b[1] * r), 0.6, iron);
    if (i <= 2) T.mk(new THREE.BoxGeometry(r * 2.3, 1.2, r * 2.3), iron, E, { p: [0, y, 0] }); }
  for (let y = 26; y < 58; y += 6) { const r = 5.2 - (y - 22) / 38 * 4.3; for (const [a, b] of [[[-1, -1], [1, 1]], [[1, -1], [-1, 1]]]) beam(E, new THREE.Vector3(a[0] * r, y, a[1] * r), new THREE.Vector3(b[0] * r * 0.85, y + 6, b[1] * r * 0.85), 0.25, iron); }
  for (const sx of [-1, 1]) { const arch = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.5, 6, 24, Math.PI), iron); arch.position.set(0, 2.5, sx * 13.2); E.add(arch); const a2 = arch.clone(); a2.rotation.y = Math.PI / 2; a2.position.set(sx * 13.2, 2.5, 0); E.add(a2); }
  T.mk(T.cyl(0.25, 0.5, 8, 8), iron, E, { p: [0, 64, 0] });
  for (let i = 0; i < 40; i++) { const t = i / 40, y = t * 60, r = 15 * Math.pow(1 - t, 1.7) + 0.6, a = (i % 4) * Math.PI / 2 + Math.PI / 4; T.lamp(E, Math.cos(a) * r * 1.414, y + 1, Math.sin(a) * r * 1.414, '#ffd27a', 0.35); }
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { const z = -48 + k * 11; building(wg, sx * 15, z, 9.5, 17 + (k % 3) * 2, 10, 'haus', { roof: 'mansard' }); }
  const aw = T.stripeTex('#c1121f', '#f5efe0', 10); const caf = new THREE.Group(); caf.position.set(-8.6, 0, -6); wg.add(caf);
  T.mk(new THREE.PlaneGeometry(6, 2.2), T.PM('#fff', { map: aw, side: THREE.DoubleSide }), caf, { p: [-0.6, 3.1, 0], r: [0, Math.PI / 2, -0.5] });
  for (let i = 0; i < 4; i++) { const z = -2.2 + i * 1.5; T.mk(T.cyl(0.38, 0.38, 0.05, 16), T.PM('#2b2b2b', { metalness: 0.6 }), caf, { p: [0.8, 0.75, z] }); T.mk(T.cyl(0.04, 0.04, 0.75, 6), T.PM('#2b2b2b'), caf, { p: [0.8, 0.37, z] });
    for (const dz of [-0.45, 0.45]) T.mk(T.rbox(0.38, 0.45, 0.38, 0.05), T.PM('#7a4a2a'), caf, { p: [0.8, 0.45, z + dz] }); T.colliders.push({ x: -7.8, z: -6 + z, r: 0.6 }); }
  for (let k = 0; k < 6; k++) { tree(wg, -6.2, -40 + k * 9, 1, '#4c8a3a'); tree(wg, 6.2, -36 + k * 9, 1, '#4c8a3a'); }
  for (let k = 0; k < 5; k++) { streetLamp(wg, -5, -34 + k * 10); streetLamp(wg, 5, -29 + k * 10); }
}
/* ---------------- LONDON ---------------- */
function london(wg) {
  ground(wg, tiles('#8f9196', '#86888d', '#6f7277'), 50); road(wg, 10, 160, -20, 0);
  const stone = T.PM('#c9b07c', { roughness: 0.85 }), dark = T.PM('#32402f', { roughness: 0.6, metalness: 0.3 }), gold = T.PM('#d9a83a', { metalness: 0.9, roughness: 0.3 });
  const ribs = T.canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#c9b07c'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 4; x < w; x += 12) g.fillRect(x, 0, 3, h); for (let y = 0; y < h; y += 40) g.fillRect(0, y, w, 4); }); ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping; ribs.repeat.set(2, 6);
  const BB = new THREE.Group(); BB.position.set(-5, 0, -58); wg.add(BB); const rm = T.PM('#fff', { map: ribs, roughness: 0.85 });
  T.mk(new THREE.BoxGeometry(7, 46, 7), rm, BB, { p: [0, 23, 0] }); T.mk(new THREE.BoxGeometry(8.4, 9, 8.4), stone, BB, { p: [0, 50.5, 0] });
  const cf = clockFace(); for (const [x, z, ry] of [[0, 4.22, 0], [4.22, 0, Math.PI / 2], [0, -4.22, Math.PI], [-4.22, 0, -Math.PI / 2]]) T.mk(new THREE.PlaneGeometry(6.4, 6.4), cf, BB, { p: [x, 50.5, z], r: [0, ry, 0], shadow: false });
  T.mk(new THREE.BoxGeometry(6.6, 5, 6.6), stone, BB, { p: [0, 57.5, 0] }); T.mk(new THREE.ConeGeometry(5, 12, 4), dark, BB, { p: [0, 66, 0], r: [0, Math.PI / 4, 0] }); T.mk(T.cyl(0.15, 0.3, 4, 8), gold, BB, { p: [0, 73.5, 0] });
  for (let i = 0; i < 6; i++) { const x = 4 + i * 9; T.mk(new THREE.BoxGeometry(9, 22, 10), rm, wg, { p: [x, 11, -66] }); for (const dx of [-3.8, 3.8]) { T.mk(new THREE.BoxGeometry(1.4, 27, 1.4), stone, wg, { p: [x + dx, 13.5, -60.8] }); T.mk(new THREE.ConeGeometry(1, 3, 4), dark, wg, { p: [x + dx, 28.5, -60.8], r: [0, Math.PI / 4, 0] }); } }
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) building(wg, sx * 15.5, -38 + k * 11, 10, 14 + (k % 2) * 4, 10, 'brick', { roof: 'flat', trim: '#e8e0d0' });
  const red = T.PM('#c8102e', { roughness: 0.35, metalness: 0.2 });
  const winT = T.canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h); g.fillStyle = '#9fc7e6'; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) g.fillRect(8 + x * 26, 20 + y * 30, 20, 24); g.fillStyle = '#fff'; g.font = '700 11px sans-serif'; g.fillText('TELEPHONE', 2, 12); });
  for (const [x, z] of [[-6.4, -2], [-6.4, -3.4]]) { T.mk(new THREE.BoxGeometry(1, 2.6, 1), T.PM('#fff', { map: winT }), wg, { p: [x, 1.3, z] }); T.mk(T.cyl(0.55, 0.55, 0.3, 4), red, wg, { p: [x, 2.75, z], r: [0, Math.PI / 4, 0] }); T.colliders.push({ x, z, r: 0.7 }); }
  const bus = new THREE.Group(); bus.position.set(2.6, 0, -16); wg.add(bus);
  const busT = T.canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b2430'; for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) g.fillRect(18 + i * 68, 12 + r * 60, 56, 38); g.fillStyle = '#ffd200'; g.font = '700 16px sans-serif'; g.fillText('MKACHKHA FF  ·  LONDON', 160, 120); });
  T.mk(T.rbox(2.5, 4.2, 10.5, 0.35), T.PM('#fff', { map: busT, roughness: 0.4 }), bus, { p: [0, 2.4, 0], r: [0, Math.PI / 2, 0] });
  for (const sz of [-3.6, 3.4]) for (const sx of [-1, 1]) T.mk(T.cyl(0.5, 0.5, 0.35, 16), T.PM('#111'), bus, { p: [sx * 1.25, 0.5, sz], r: [0, 0, Math.PI / 2] });
  bus.rotation.y = Math.PI / 2; T.colliders.push({ x: 2.6, z: -18.5, r: 1.6 }, { x: 2.6, z: -16, r: 1.6 }, { x: 2.6, z: -13.5, r: 1.6 });
  car(wg, -2.6, 6, Math.PI, '#111318', 'cab');
  for (let k = 0; k < 6; k++) { streetLamp(wg, -5.5, -34 + k * 9); streetLamp(wg, 5.5, -30 + k * 9); }
}
/* ---------------- NEW YORK ---------------- */
function newyork(wg) {
  ground(wg, tiles('#6a6d73', '#626569', '#55585d'), 50); road(wg, 12, 160, -20, 0);
  for (let i = 0; i < 6; i++) T.mk(new THREE.PlaneGeometry(0.6, 3.4), T.PM('#e9e9e9', { roughness: 0.6 }), wg, { r: [-Math.PI / 2, 0, 0], p: [-3 + i * 1.2, 0.02, 7], shadow: false, recv: true });
  const ads = [['MKACHKHA FF', '#ff2fa0'], ['NEW YORK', '#ffffff'], ['SALE 50%', '#ffd23f'], ['PIZZA $1', '#ff6a3d'], ['BROADWAY', '#3de1ff'], ['PLAY NOW', '#7cff6b'], ['NEWS 24', '#ff3d4f'], ['دقدق وبيع', '#ffd23f'], ['MUSIC', '#b48cff'], ['TUNIS ✈ NYC', '#3de1ff']];
  let ai = 0;
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { const z = -52 + k * 12, h = 40 + ((k * 37) % 50), w = 11; building(wg, sx * (w / 2 + 7), z, w, h, 11, 'glass');
    for (let q = 0; q < 2; q++) { const [txt, col] = ads[ai++ % ads.length]; const bw = 8, bh = 4.5;
      const tx = T.canvasTex(512, 288, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#111'); gr.addColorStop(1, '#2a1b40'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = col; g.font = '800 84px Cairo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 20; g.fillText(txt, W / 2, H / 2, W - 30); g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20); });
      T.mk(new THREE.PlaneGeometry(bw, bh), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.6 }), wg, { p: [sx * 6.95, 6 + q * 6.5 + (k % 2) * 2, z], r: [0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0], shadow: false }); } }
  const yel = '#f7c600'; [[-3, -4, 0], [3, -14, Math.PI], [-3, -24, 0], [3, 2, Math.PI]].forEach(([x, z, r]) => car(wg, x, z, r, yel, 'taxi'));
  T.emitter(wg, 'smoke', T.V(1.5, 0.1, -8), 14); for (let k = 0; k < 5; k++) { streetLamp(wg, -6.4, -40 + k * 11, '#fff1d0', 'arm'); }
}
/* ---------------- IBIZA ---------------- */
function ibiza(wg) {
  ground(wg, (g, w, h) => { g.fillStyle = '#f0dcae'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < .5 ? '#e3cb93' : '#f9e9c4'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, 30);
  const sg = new THREE.PlaneGeometry(180, 90, 60, 30); sg.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: new THREE.Color('#1aa7c9'), roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.95 })); sea.position.set(0, 0.05, -60); wg.add(sea); sea.userData.base = sg.attributes.position.array.slice(); T.setSea(sea);
  const white = T.PM('#fbfaf6', { roughness: 0.8 }), wood = T.PM('#b98a5a', { roughness: 0.8 });
  T.mk(T.rbox(26, 0.6, 14, 0.2), T.PM('#efe7da', { roughness: 0.7 }), wg, { p: [0, 0.3, -6], recv: true });
  T.mk(new THREE.BoxGeometry(16, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x2ed3e6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 }), wg, { p: [2, 0.4, -9.5], shadow: false }); T.colliders.push({ x: -3, z: -9.5, r: 3 }, { x: 2, z: -9.5, r: 3 }, { x: 7, z: -9.5, r: 3 });
  building(wg, -16, -4, 9, 7, 10, 'villa', { roof: 'flat', trim: '#fbfaf6' }); building(wg, -11, -12, 6, 4.5, 6, 'villa', { roof: 'flat', trim: '#fbfaf6' });
  for (let i = 0; i < 6; i++) { const x = -5 + i * 2.2; T.mk(T.rbox(0.8, 0.3, 2, 0.08), white, wg, { p: [x, 0.85, -3.4], r: [0.12, 0, 0] }); T.mk(T.rbox(0.8, 0.4, 0.15, 0.05), white, wg, { p: [x, 1.05, -4.3], r: [-0.7, 0, 0] }); }
  for (const x of [-4, 3, 9]) { T.mk(T.cyl(0.04, 0.04, 2.6, 6), wood, wg, { p: [x, 1.9, -1.8] }); T.mk(new THREE.ConeGeometry(1.6, 0.6, 16, 1, true), T.PM('#ffffff', { side: THREE.DoubleSide }), wg, { p: [x, 3.2, -1.8] }); T.colliders.push({ x, z: -1.8, r: 0.25 }); }
  const dj = new THREE.Group(); dj.position.set(9, 0.6, -6); wg.add(dj);
  T.mk(T.rbox(3, 1.1, 1.2, 0.08), T.PM('#16161a', { roughness: 0.4 }), dj, { p: [0, 0.55, 0] });
  T.mk(T.BOX, new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2fa0, emissiveIntensity: 3 }), dj, { p: [0, 0.9, 0.62], s: [2.9, 0.06, 0.02], shadow: false });
  T.mk(T.BOX, new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3de1ff, emissiveIntensity: 3 }), dj, { p: [0, 0.3, 0.62], s: [2.9, 0.06, 0.02], shadow: false });
  for (const sx of [-2.3, 2.3]) T.mk(T.rbox(0.9, 2.2, 0.8, 0.08), T.PM('#111', { roughness: 0.5 }), dj, { p: [sx, 1.1, 0] }); T.colliders.push({ x: 9, z: -6, r: 2.6 });
  for (let i = 0; i < 18; i++) { const x = -12 + i * 1.5; T.lamp(wg, x, 3.6 + Math.sin(i * 0.7) * 0.25, 1.5, ['#ffd27a', '#ff6fa8', '#3de1ff'][i % 3], 0.09); }
  [[-14, 3], [-9, 6], [12, 3], [15, -1], [-18, -13], [16, -12]].forEach(([x, z], i) => T.palm(wg, x, z, i));
}
/* ---------------- TUNIS ---------------- */
function tunis(wg) {
  ground(wg, tiles('#e7dccb', '#ddd0bb', '#c5b59b'), 40); road(wg, 7, 160, -20, -9.5); road(wg, 7, 160, -20, 9.5);
  T.mk(new THREE.PlaneGeometry(10, 160), T.PM('#d6c7ad', { roughness: 0.9 }), wg, { r: [-Math.PI / 2, 0, 0], p: [0, 0.015, -20], shadow: false, recv: true });
  const C = new THREE.Group(); C.position.set(0, 0, -62); wg.add(C); const cw = T.PM('#e9ecef', { roughness: 0.4, metalness: 0.2 });
  T.mk(T.cyl(3.5, 4, 1.2, 4), T.PM('#c7ccd2'), C, { p: [0, 0.6, 0], r: [0, Math.PI / 4, 0] }); T.mk(new THREE.BoxGeometry(2.2, 22, 2.2), cw, C, { p: [0, 12, 0] });
  for (const sx of [-1, 1]) T.mk(new THREE.BoxGeometry(0.5, 20, 0.5), T.PM('#c5ccd4', { metalness: 0.5, roughness: 0.3 }), C, { p: [sx * 1.4, 11, 1.4] });
  T.mk(new THREE.BoxGeometry(3.4, 3.4, 3.4), cw, C, { p: [0, 24.5, 0] }); const cf = clockFace(3, '#f7fbff');
  for (const [x, z, ry] of [[0, 1.71, 0], [1.71, 0, Math.PI / 2], [0, -1.71, Math.PI], [-1.71, 0, -Math.PI / 2]]) T.mk(new THREE.PlaneGeometry(2.8, 2.8), cf, C, { p: [x, 24.5, z], r: [0, ry, 0], shadow: false });
  T.mk(new THREE.ConeGeometry(2.2, 3, 4), T.PM('#b8c2cc', { metalness: 0.6, roughness: 0.3 }), C, { p: [0, 27.7, 0], r: [0, Math.PI / 4, 0] }); T.colliders.push({ x: 0, z: -62, r: 3.6 });
  const cath = new THREE.Group(); cath.position.set(-17, 0, -26); cath.rotation.y = Math.PI / 2; wg.add(cath); const cs = T.PM('#e6d7bd', { roughness: 0.85 });
  T.mk(new THREE.BoxGeometry(12, 13, 9), cs, cath, { p: [0, 6.5, 0] }); for (const sx of [-1, 1]) { T.mk(new THREE.BoxGeometry(3.6, 22, 3.6), cs, cath, { p: [sx * 5.5, 11, 4] }); T.mk(new THREE.ConeGeometry(2.4, 4, 8), T.PM('#b9a37e'), cath, { p: [sx * 5.5, 24, 4] }); }
  const rose = T.canvasTex(128, 128, (g) => { g.fillStyle = '#e6d7bd'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#2b4d7a'; g.beginPath(); g.arc(64, 64, 44, 0, 7); g.fill(); g.strokeStyle = '#e6d7bd'; g.lineWidth = 5; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(i / 12 * 6.28) * 44, 64 + Math.sin(i / 12 * 6.28) * 44); g.stroke(); } });
  T.mk(new THREE.CircleGeometry(2.4, 32), glowMat(new THREE.MeshStandardMaterial({ map: rose, emissive: 0xffd9a0, emissiveMap: rose, emissiveIntensity: 0 }), 0, 0.8), cath, { p: [0, 9.5, 4.55], shadow: false });
  T.mk(new THREE.CylinderGeometry(2, 2, 0.4, 24, 1, false, 0, Math.PI), T.PM('#3a2a1a'), cath, { p: [0, 3.5, 4.6], r: [Math.PI / 2, 0, Math.PI / 2] }); T.colliders.push({ x: -17, z: -26, r: 6.5 });
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { if (sx < 0 && k >= 2 && k <= 3) continue; building(wg, sx * 19, -50 + k * 12, 10, 15 + (k % 2) * 3, 11, 'colonial', { roof: 'flat', trim: '#f3efe6' }); }
  for (let k = 0; k < 9; k++) { tree(wg, -4.2, -50 + k * 7, 1.15, '#2f7a3a'); tree(wg, 4.2, -47 + k * 7, 1.15, '#2f7a3a'); }
  for (let k = 0; k < 4; k++) { streetLamp(wg, -1.6, -48 + k * 10, '#fff1d0', 'classic'); streetLamp(wg, 1.6, -43 + k * 10, '#fff1d0', 'classic'); }
  flagPole(wg, -2.2, -56, 'tn', 8); flagPole(wg, 2.2, -56, 'tn', 8);
  const aw = T.stripeTex('#d62828', '#ffffff', 8);
  for (const z of [-8, 4]) { T.mk(new THREE.PlaneGeometry(5, 2), T.PM('#fff', { map: aw, side: THREE.DoubleSide }), wg, { p: [12.4, 3, z], r: [0, -Math.PI / 2, 0.5] }); for (let i = 0; i < 3; i++) { T.mk(T.cyl(0.35, 0.35, 0.05, 14), T.PM('#2b2b2b'), wg, { p: [12.6, 0.75, z - 1.4 + i * 1.4] }); T.colliders.push({ x: 12.6, z: z - 1.4 + i * 1.4, r: 0.5 }); } }
}
/* ---------------- DUBAI ---------------- */
function dubai(wg) {
  ground(wg, tiles('#e9dfcf', '#e1d4c0', '#cbb99d'), 40);
  const lake = new THREE.Mesh(new THREE.CircleGeometry(22, 64), new THREE.MeshStandardMaterial({ color: 0x0d6c8a, roughness: 0.05, metalness: 0.4 })); lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0.03, -34); lake.scale.set(1.6, 1, 0.8); wg.add(lake);
  T.colliders.push({ x: 0, z: -34, r: 18 }, { x: -18, z: -34, r: 10 }, { x: 18, z: -34, r: 10 });
  for (let i = 0; i < 9; i++) T.emitter(wg, 'smoke', T.V(-16 + i * 4, 0.1, -24), 8);
  const B = new THREE.Group(); B.position.set(0, 0, -120); wg.add(B);
  const { base, em } = facadeTex('burj'); [base, em].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 12); });
  const gm = glowMat(new THREE.MeshStandardMaterial({ map: base, emissive: 0xbfe3ff, emissiveMap: em, emissiveIntensity: 0, roughness: 0.18, metalness: 0.8 }), 0, 1.2);
  let y = 0; const tiers = [[16, 18], [13, 20], [11, 20], [9, 20], [7, 18], [5.5, 16], [4, 16], [2.8, 14], [1.8, 12]];
  tiers.forEach(([r, h], i) => { for (let k = 0; k < 3; k++) { const m = T.mk(new THREE.CylinderGeometry(r * 0.42, r * 0.46, h, 12), gm, B, { p: [Math.cos(k * 2.094) * r * 0.42, y + h / 2, Math.sin(k * 2.094) * r * 0.42] }); }
    T.mk(new THREE.CylinderGeometry(r * 0.55, r * 0.58, h, 16), gm, B, { p: [0, y + h / 2, 0] }); y += h; });
  T.mk(T.cyl(0.4, 1.4, 30, 10), T.PM('#dfe7ef', { metalness: 0.9, roughness: 0.2 }), B, { p: [0, y + 15, 0] }); T.lamp(B, 0, y + 30, 0, '#ff3d3d', 0.6);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) building(wg, sx * (34 + k * 9), -70 - k * 10, 10, 50 + k * 18, 10, 'glass');
  car(wg, -4, 3, 0.5, '#f2f2f2', 'super'); car(wg, 5, 1, -0.7, '#d4a017', 'super');
  [[-10, 4], [10, 5], [-14, -6], [14, -8], [-8, 10], [8, 11]].forEach(([x, z], i) => T.palm(wg, x, z, i));
  for (let k = 0; k < 6; k++) streetLamp(wg, -12 + k * 5, -12, '#fff1d0', 'arm');
}

export const CITY_MAPS = {
  paris: { name: 'باريس', emoji: '🗼', flag: '🇫🇷', build: paris, bounds: { x: 9.5, zMin: -44, zMax: 14 }, spawnZ: 4, art: ['#1d2b5a', '#c94b6b'] },
  london: { name: 'لندن', emoji: '🎡', flag: '🇬🇧', build: london, bounds: { x: 9.5, zMin: -44, zMax: 14 }, spawnZ: 4, day: 'overcast', art: ['#2c3440', '#8a1c2c'] },
  newyork: { name: 'نيويورك', emoji: '🗽', flag: '🇺🇸', build: newyork, bounds: { x: 6, zMin: -50, zMax: 18 }, spawnZ: 4, art: ['#101a3a', '#d4a017'] },
  ibiza: { name: 'إيبيزا', emoji: '🏝️', flag: '🇪🇸', build: ibiza, bounds: { x: 16, zMin: -12, zMax: 14 }, spawnZ: 2, day: 'sunset', art: ['#ff7a59', '#5a2a8a'] },
  tunis: { name: 'تونس', emoji: '🕰️', flag: '🇹🇳', build: tunis, bounds: { x: 13, zMin: -52, zMax: 16 }, spawnZ: 4, art: ['#c1121f', '#f2c14e'] },
  dubai: { name: 'دبي', emoji: '🏙️', flag: '🇦🇪', build: dubai, bounds: { x: 16, zMin: -12, zMax: 16 }, spawnZ: 4, day: 'sunset', art: ['#c9862f', '#1d2b5a'] },
};
export function initCities(toolkit) { T = toolkit; }
