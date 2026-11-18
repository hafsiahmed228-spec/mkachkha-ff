// Realistic rigged avatars (Mixamo / Ready Player Me compatible skeletons)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const BODIES = {
  ahmed:   { file: 'rpm.glb', label: 'أحمد', gender: 'm', desc: 'adult man with dark curly hair and a full beard',
             tints: [ { id: 'top', label: 'الفوق', meshes: ['Wolf3D_Outfit_Top'] }, { id: 'bottom', label: 'السروال', meshes: ['Wolf3D_Outfit_Bottom'] },
                      { id: 'shoes', label: 'الصبّاط', meshes: ['Wolf3D_Outfit_Footwear'] }, { id: 'skin', label: 'الجلد', meshes: ['Wolf3D_Head', 'Wolf3D_Body'] } ],
             toggles: [ { id: 'beard', label: 'اللحية', meshes: ['Wolf3D_Beard'] }, { id: 'hat', label: 'الشابو', mats: ['Wolf3D_Headwear'] } ],
             acc: { r: 0.098, up: 0.085, fwd: 0.012, eyeUp: 0.075, eyeFwd: 0.088, eyeGap: 0.032 }, back: 0.115 },
  michelle:{ file: 'Michelle.glb', label: 'ميشال', gender: 'f', desc: 'young woman with dark skin, voluminous black hair buns, round orange sunglasses, red headphones, grey crop top, baggy yellow pants and sneakers',
             tints: [ { id: 'all', label: 'الألوان', meshes: ['*'], soft: true } ], toggles: [],
             acc: { r: 0.1, up: 0.09, fwd: 0.01, eyeUp: 0.075, eyeFwd: 0.09, eyeGap: 0.033 }, back: 0.1 },
  vanguard:{ file: 'Soldier.glb', label: 'فانغارد', gender: 'm', desc: 'armored soldier in a tactical sci-fi suit with a full face helmet visor',
             tints: [ { id: 'armor', label: 'الدرع', mats: ['VanguardBodyMat'] }, { id: 'visor', label: 'الفيزور', mats: ['Vanguard_VisorMat'] } ], toggles: [],
             acc: { r: 0.12, up: 0.1, fwd: 0.02, eyeUp: 0.08, eyeFwd: 0.11, eyeGap: 0.036 }, back: 0.16 },
  xbot:    { file: 'Xbot.glb', label: 'روبو', gender: 'm', desc: 'sleek humanoid mannequin robot',
             tints: [ { id: 'body', label: 'البدن', mats: ['asdf1:Beta_HighLimbsGeoSG2'] }, { id: 'joints', label: 'المفاصل', mats: ['Beta_Joints_MAT'] } ], toggles: [],
             acc: { r: 0.1, up: 0.085, fwd: 0.0, eyeUp: 0.07, eyeFwd: 0.09, eyeGap: 0.032 }, back: 0.11 },
};

const loader = new GLTFLoader();
const cache = {};
export function loadGLB(url) { return cache[url] ||= new Promise((ok, ko) => loader.load(url, ok, undefined, ko)); }
export const canon = n => n.replace(/^mixamorig[:_]?/, '');

const SOURCES = { Soldier: { Idle: 'idle', Walk: 'walk', Run: 'run' }, Xbot: { idle: 'idle2', agree: 'agree', headShake: 'headShake', sad_pose: 'sad', sneak_pose: 'sneak' }, Michelle: { SambaDance: 'dance' } };
export function prepModel(gltf) {
  const m = SkeletonUtils.clone(gltf.scene), bones = {};
  m.traverse(o => { if (o.isBone) { o.name = canon(o.name); bones[o.name] = o; } });
  const wrap = new THREE.Group(); wrap.add(m); wrap.updateMatrixWorld(true);
  const l = bones.LeftArm.getWorldPosition(new THREE.Vector3()), r = bones.RightArm.getWorldPosition(new THREE.Vector3());
  if (l.x < r.x) { m.rotation.y += Math.PI; wrap.updateMatrixWorld(true); }
  return { wrap, model: m, bones };
}
function refPose(P) {
  const B = P.bones, saved = {}; for (const n in B) saved[n] = B[n].quaternion.clone();
  const dir = (a, b, d) => { if (B[a] && B[b]) { P.wrap.updateMatrixWorld(true); aim(B[a], B[b].getWorldPosition(new THREE.Vector3()), B[a].getWorldPosition(new THREE.Vector3()).add(d)); } };
  const up = new THREE.Vector3(0, 1, 0), dn = new THREE.Vector3(0, -1, 0), L = new THREE.Vector3(1, 0, 0), R = new THREE.Vector3(-1, 0, 0);
  [['Hips', 'Spine'], ['Spine', 'Spine1'], ['Spine1', 'Spine2'], ['Spine2', 'Neck'], ['Neck', 'Head']].forEach(([a, b]) => dir(a, b, up));
  [['LeftShoulder', 'LeftArm', L], ['LeftArm', 'LeftForeArm', L], ['LeftForeArm', 'LeftHand', L], ['LeftHand', 'LeftHandMiddle1', L],
   ['RightShoulder', 'RightArm', R], ['RightArm', 'RightForeArm', R], ['RightForeArm', 'RightHand', R], ['RightHand', 'RightHandMiddle1', R],
   ['LeftUpLeg', 'LeftLeg', dn], ['LeftLeg', 'LeftFoot', dn], ['RightUpLeg', 'RightLeg', dn], ['RightLeg', 'RightFoot', dn]].forEach(([a, b, d]) => dir(a, b, d));
  P.wrap.updateMatrixWorld(true);
  const W = {}; for (const n in B) W[n] = B[n].getWorldQuaternion(new THREE.Quaternion());
  for (const n in saved) B[n].quaternion.copy(saved[n]); P.wrap.updateMatrixWorld(true);
  return W;
}
function bake(src, clip, tgt, name) {
  const Rs = src.ref ||= refPose(src), Rt = tgt.ref ||= refPose(tgt);
  const mixer = new THREE.AnimationMixer(src.model); const act = mixer.clipAction(clip); act.play();
  const fps = 30, n = Math.max(2, Math.round(clip.duration * fps) + 1);
  const order = []; tgt.model.traverse(o => { if (o.isBone && src.bones[o.name] && Rs[o.name] && Rt[o.name]) order.push(o.name); });
  tgt.wrap.updateMatrixWorld(true);
  const restPW = {}; order.forEach(k => restPW[k] = tgt.bones[k].parent.getWorldQuaternion(new THREE.Quaternion()));
  const invRs = {}; order.forEach(k => invRs[k] = Rs[k].clone().invert());
  const times = new Float32Array(n), vals = {}; order.forEach(k => vals[k] = new Float32Array(n * 4));
  const q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const t = Math.min(clip.duration, i / fps); times[i] = t; mixer.setTime(t); src.wrap.updateMatrixWorld(true);
    const Tw = {};
    for (const k of order) {
      const tw = src.bones[k].getWorldQuaternion(new THREE.Quaternion()).multiply(invRs[k]).multiply(Rt[k]); Tw[k] = tw;
      const pw = Tw[tgt.bones[k].parent.name] || restPW[k];
      q.copy(pw).invert().multiply(tw).toArray(vals[k], i * 4);
    }
  }
  act.stop(); mixer.uncacheRoot(src.model);
  for (const k in src.bones) {} // keep
  return new THREE.AnimationClip(name, clip.duration, order.map(k => new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, vals[k])));
}
let SRC = null; const CLIPCACHE = {};
async function sources(base) {
  if (SRC) return SRC; SRC = {};
  for (const f of Object.keys(SOURCES)) {
    const g = await loadGLB(base + f + '.glb'); const P = prepModel(g); P.raw = {};
    for (const [src, nm] of Object.entries(SOURCES[f])) { const c = g.animations.find(a => a.name === src); if (!c) continue;
      const cc = c.clone(); cc.tracks = cc.tracks.filter(t => /\.quaternion$/.test(t.name)).map(t => { const i = t.name.lastIndexOf('.'); t.name = canon(t.name.slice(0, i)) + t.name.slice(i); return t; });
      // reset bind pose before sampling
      P.raw[nm] = cc; }
    SRC[f] = P;
  }
  return SRC;
}
export async function clipsFor(key, gltf, base) {
  if (CLIPCACHE[key]) return CLIPCACHE[key];
  const S = await sources(base); const tgt = prepModel(gltf); const out = {};
  for (const f in S) for (const nm in S[f].raw) out[nm] = bake(S[f], S[f].raw[nm], tgt, nm);
  return CLIPCACHE[key] = out;
}
export async function loadClips() { return true; }
let CLIPS = null;
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();

export class Avatar {
  constructor(def, gltf, state) {
    this.def = def; this.state = state;
    this.root = new THREE.Group();
    const P = prepModel(gltf); this.model = P.wrap; this.bones = P.bones;
    this.root.add(this.model);
    this.meshes = [];
    this.model.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => { m.userData.baseColor = m.color ? m.color.clone() : null; if (m.map) m.map.anisotropy = 4; });
        this.meshes.push(o); }
    });
    // normalise height to ~1.75m
    this.model.updateMatrixWorld(true);
    const head = this.bones.Head, hp = head.getWorldPosition(new THREE.Vector3());
    const rawH = hp.y * 1.09; this.baseScale = 1.75 / rawH; this.model.scale.multiplyScalar(this.baseScale);
    this.model.updateMatrixWorld(true);
    this.bind = {}; for (const n of ['Head', 'Spine2', 'RightHand']) if (this.bones[n]) this.bind[n] = this.bones[n].matrixWorld.clone();
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {}; this.cur = null;
    this.ik = { L: null, R: null }; this.extraObjs = [];
    this.applyState();
    this.buildExtras();
  }
  attach(boneName, obj, pos) {
    const bone = this.bones[boneName]; if (!bone) return;
    const inv = this.bind[boneName].clone().invert();
    const m = new THREE.Matrix4().compose(pos, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)).premultiply(inv);
    m.decompose(obj.position, obj.quaternion, obj.scale); bone.add(obj); this.extraObjs.push(obj);
  }
  buildExtras() {
    (this.extraObjs || []).forEach(o => { o.parent && o.parent.remove(o); o.traverse(x => { if (x.isMesh) { x.geometry.dispose(); (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { m.map && m.map.dispose(); m.dispose(); }); } }); });
    this.extraObjs = [];
    const s = this.state, A = this.def.acc, acc = s.acc || {};
    const hb = new THREE.Vector3().setFromMatrixPosition(this.bind.Head);
    const hc = hb.clone().add(new THREE.Vector3(0, A.up, A.fwd)), r = A.r;
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.8 }, o || {}));
    const add = (g, m, p, rr, sc) => { const x = new THREE.Mesh(g, m); if (p) x.position.set(...p); if (rr) x.rotation.set(...rr); if (sc) x.scale.set(...sc); x.castShadow = true; return x; };
    const hat = acc.hat || 'none', hcol = acc.hatColor || '#c1121f';
    if (hat !== 'none') { const g = new THREE.Group();
      if (hat === 'chechia') { g.add(add(new THREE.CylinderGeometry(r * 0.8, r * 0.9, r * 0.95, 36), M(hcol, { roughness: 0.95 }), [0, r * 0.82, -r * 0.05], [-0.15, 0, 0]));
        g.add(add(new THREE.CylinderGeometry(r * 0.8, r * 0.8, r * 0.02, 36), M(new THREE.Color(hcol).multiplyScalar(0.7)), [0, r * 1.3, -r * 0.12], [-0.15, 0, 0]));
        g.add(add(new THREE.CapsuleGeometry(r * 0.06, r * 0.5, 4, 8), M('#111'), [0, r * 1.1, -r * 0.8], [0.5, 0, 0])); }
      if (hat === 'cap') { g.add(add(new THREE.SphereGeometry(r * 1.08, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), M(hcol), [0, r * 0.12, -r * 0.02], [-0.12, 0, 0]));
        g.add(add(new THREE.CylinderGeometry(r * 0.72, r * 0.72, r * 0.05, 32, 1, false, -Math.PI / 2, Math.PI), M(new THREE.Color(hcol).multiplyScalar(0.75)), [0, r * 0.3, r * 0.75], [0.12, 0, 0], [1, 1, 1.2])); }
      if (hat === 'beanie') { g.add(add(new THREE.SphereGeometry(r * 1.1, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M(hcol, { roughness: 1 }), [0, r * 0.1, -r * 0.03], [-0.1, 0, 0]));
        g.add(add(new THREE.TorusGeometry(r * 1.07, r * 0.13, 8, 36), M(new THREE.Color(hcol).multiplyScalar(0.8), { roughness: 1 }), [0, r * 0.14, -r * 0.03], [Math.PI / 2 - 0.1, 0, 0])); }
      this.attach('Head', g, hc); }
    if ((acc.mask || 'none') !== 'none') { const g = new THREE.Group(); const mm = M(acc.maskColor || '#111111', { roughness: 0.95, side: THREE.DoubleSide });
      g.add(add(new THREE.SphereGeometry(r * 1.0, 40, 20, -Math.PI * 0.08, Math.PI * 1.16, Math.PI * 0.56, Math.PI * 0.36), mm, [0, 0, r * 0.06], null, [0.98, 1.0, 1.12]));
      g.add(add(new THREE.ConeGeometry(r * 0.06, r * 0.11, 3), M('#cfd3da', { roughness: 0.3, metalness: 0.7 }), [0, -r * 0.42, r * 1.1], [Math.PI / 2, 0, 0]));
      this.attach('Head', g, hc); }
    const gl = acc.glasses || 'none';
    if (gl !== 'none') { const g = new THREE.Group(); const fr = M('#18181c', { roughness: 0.3, metalness: 0.6 }); const seg = gl === 'round' ? 24 : 4, gr = r * 0.2;
      for (const d of [1, -1]) { const x = d * A.eyeGap; const ring = add(new THREE.TorusGeometry(gr, r * 0.025, 6, seg), fr, [x, 0, 0], [0, 0, seg === 4 ? Math.PI / 4 : 0], seg === 4 ? [1.25, 1, 1] : null); g.add(ring);
        const lens = add(new THREE.CircleGeometry(gr, seg), M(gl === 'sun' ? '#0b0b10' : '#cfe8ff', { transparent: true, opacity: gl === 'sun' ? 0.9 : 0.15, roughness: 0.05, metalness: 0.5 }), [x, 0, -0.001], [0, 0, seg === 4 ? Math.PI / 4 : 0], seg === 4 ? [1.25, 1, 1] : null); g.add(lens);
        g.add(add(new THREE.BoxGeometry(r * 0.02, r * 0.02, r * 0.95), fr, [d * (A.eyeGap + gr * 1.15), 0, -r * 0.48])); }
      g.add(add(new THREE.CapsuleGeometry(r * 0.015, Math.max(0.001, A.eyeGap * 2 - gr * 2.3), 3, 6), fr, [0, r * 0.03, 0], [0, 0, Math.PI / 2]));
      this.attach('Head', g, hb.clone().add(new THREE.Vector3(0, A.eyeUp, A.eyeFwd))); }
    if (s.showBack && this.bind.Spine2) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 320; const x = c.getContext('2d');
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; const nm = (s.backName || '').toUpperCase(), col = s.backColor || '#ffffff';
      if (nm) { x.font = '800 46px Cairo, sans-serif'; x.lineWidth = 10; x.strokeStyle = '#111'; x.strokeText(nm, 128, 50, 240); x.fillStyle = col; x.fillText(nm, 128, 50, 240); }
      x.font = '800 190px Cairo, Impact, sans-serif'; x.lineWidth = 14; x.strokeStyle = '#111'; x.strokeText(String(s.number ?? 10), 128, nm ? 200 : 170); x.fillStyle = col; x.fillText(String(s.number ?? 10), 128, nm ? 200 : 170);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.325), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, roughness: 0.8 }));
      p.rotation.y = Math.PI; const sp = new THREE.Vector3().setFromMatrixPosition(this.bind.Spine2).add(new THREE.Vector3(0, -0.02, -this.def.back));
      const g = new THREE.Group(); g.add(p); this.attach('Spine2', g, sp); }
    // phone prop for selfies
    if (this.bind.RightHand) { const ph = new THREE.Group(); ph.add(add(new THREE.BoxGeometry(0.075, 0.15, 0.009), M('#111', { roughness: 0.3, metalness: 0.5 })));
      ph.add(add(new THREE.PlaneGeometry(0.068, 0.14), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x6aa8ff, emissiveIntensity: 0.6 }), [0, 0, -0.005], [0, Math.PI, 0]));
      ph.visible = false; this.phone = ph; this.attach('RightHand', ph, new THREE.Vector3().setFromMatrixPosition(this.bind.RightHand).add(new THREE.Vector3(-0.02, -0.08, 0.03))); }
  }
  play(name, fade = 0.25) {
    const C = this.clips; if (!C || !C[name]) return; if (this.cur === name) return;
    const a = this.actions[name] ||= this.mixer.clipAction(C[name]);
    a.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (this.cur && this.actions[this.cur]) this.actions[this.cur].fadeOut(fade);
    this.cur = name;
  }
  get height() { return 1.75 * (this.state.height || 1); }
  get width() { return 0.55 * (this.state.width || 1); }
  applyState() {
    const s = this.state, d = this.def;
    this.root.scale.set((s.height || 1) * (s.width || 1), s.height || 1, (s.height || 1) * (s.width || 1));
    const tints = s.tints || {};
    for (const t of d.tints) {
      const col = tints[t.id];
      this.meshes.forEach(m => {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach(mat => {
          const hit = (t.meshes && (t.meshes.includes('*') || t.meshes.includes(m.name))) || (t.mats && t.mats.includes(mat.name));
          if (!hit || !mat.color) return;
          if (col) { const c = new THREE.Color(col); mat.color.copy(t.soft ? mat.userData.baseColor.clone().lerp(c, 0.45) : c); }
          else if (mat.userData.baseColor) mat.color.copy(mat.userData.baseColor);
        });
      });
    }
    for (const t of d.toggles || []) {
      const on = (s.toggles || {})[t.id] !== false && !(t.id === 'hat' && s.acc && s.acc.hat && s.acc.hat !== 'none');
      this.meshes.forEach(m => { const mats = Array.isArray(m.material) ? m.material : [m.material];
        if ((t.meshes && t.meshes.includes(m.name)) || (t.mats && mats.some(x => t.mats.includes(x.name)))) m.visible = on; });
    }
  }
  // world-space anchors (after animation update)
  anchors() {
    const B = this.bones, g = n => (B[n] ? B[n].getWorldPosition(new THREE.Vector3()) : null);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.root.getWorldQuaternion(_q1)).setY(0).normalize();
    const up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(up, fwd).normalize(); // character's left (+x)
    return { fwd, up, side, shL: g('LeftArm'), shR: g('RightArm'), head: g('Head'), neck: g('Neck'), chest: g('Spine2'), hips: g('Hips'),
      handL: g('LeftHand'), handR: g('RightHand'), k: (this.state.height || 1) };
  }
}

/* ---------- IK on real skeleton ---------- */
function aim(bone, childW, targetW, w = 1) {
  const bp = bone.getWorldPosition(_v1);
  const from = _v2.copy(childW).sub(bp).normalize(), to = _v3.copy(targetW).sub(bp).normalize();
  _q1.setFromUnitVectors(from, to); if (w < 1) _q1.slerp(_q2.identity(), 1 - w);
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  const nq = _q1.multiply(wq);
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(nq)); bone.updateMatrixWorld(true);
}
export function twoBoneIK(upper, lower, end, target, pole, w = 1) {
  const a = upper.getWorldPosition(new THREE.Vector3()), b = lower.getWorldPosition(new THREE.Vector3()), c = end.getWorldPosition(new THREE.Vector3());
  const la = a.distanceTo(b), lb = b.distanceTo(c);
  const d = target.clone().sub(a); let dl = d.length(); const mx = (la + lb) * 0.999, mn = Math.abs(la - lb) + 0.005;
  if (dl > mx) { d.setLength(mx); dl = mx; } if (dl < mn) { d.setLength(mn); dl = mn; }
  const dn = d.clone().normalize();
  const cosA = THREE.MathUtils.clamp((la * la + dl * dl - lb * lb) / (2 * la * dl), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
  let pn = pole.clone().sub(dn.clone().multiplyScalar(pole.dot(dn))); if (pn.lengthSq() < 1e-8) pn.set(0, -1, 0); pn.normalize();
  const E = a.clone().add(dn.clone().multiplyScalar(cosA * la)).add(pn.multiplyScalar(sinA * la));
  const T = a.clone().add(d);
  aim(upper, b, E, w);
  aim(lower, end.getWorldPosition(new THREE.Vector3()), T, w);
}
// rotate a bone in world space by quaternion q (premultiply)
export function rotWorld(bone, q) {
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  const nq = q.clone().multiply(wq);
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(nq)); bone.updateMatrixWorld(true);
}
// finger curls: gesture => per finger curl amount (0 straight .. 1 fist)
const GEST = {
  relax: { Thumb: 0.15, Index: 0.2, Middle: 0.25, Ring: 0.3, Pinky: 0.35 },
  open: { Thumb: 0, Index: 0, Middle: 0, Ring: 0, Pinky: 0 },
  fist: { Thumb: 0.6, Index: 1, Middle: 1, Ring: 1, Pinky: 1 },
  point: { Thumb: 0.6, Index: 0, Middle: 1, Ring: 1, Pinky: 1 },
  peace: { Thumb: 0.7, Index: 0, Middle: 0, Ring: 1, Pinky: 1 },
  thumb: { Thumb: -0.2, Index: 1, Middle: 1, Ring: 1, Pinky: 1 },
};
export function setGesture(av, side, g) {
  const G = GEST[g] || GEST.relax, pre = side === 'L' ? 'Left' : 'Right';
  const hand = av.bones[pre + 'Hand']; if (!hand) return;
  for (const f of ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']) {
    const amt = G[f];
    for (let j = 1; j <= 3; j++) {
      const b = av.bones[pre + 'Hand' + f + j]; if (!b) continue;
      const ang = amt * (f === 'Thumb' ? 0.55 : 1.35) * (j === 1 ? 0.9 : 1);
      const axis = f === 'Thumb' ? new THREE.Vector3(0, 0, side === 'L' ? -1 : 1) : new THREE.Vector3(1, 0, 0);
      b.quaternion.multiply(_q1.setFromAxisAngle(axis, ang));
    }
  }
}
