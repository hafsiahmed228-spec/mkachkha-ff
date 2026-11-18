// Photo poses on real skeletons (IK + finger gestures + head look)
import * as THREE from 'three';
import { twoBoneIK, setGesture, rotWorld } from './avatar.js';

export const POSES = [
  ['idle', '🧍', 'عادي'], ['crossed', '😎', 'مكتّف'], ['shh', '🤫', 'يدّو على فمّو'], ['hips', '🦸', 'يدّيه على جنبو'],
  ['peace', '✌️', 'بيس'], ['point', '👉', 'يشاور'], ['thumbs', '👍', 'لايك'], ['salute', '🫡', 'تحيّة'],
  ['wave', '👋', 'يسلّم'], ['victory', '✊', 'ربح'], ['flex', '💪', 'عضلات'], ['heart', '🫶', 'قلب'],
  ['cheer', '🙌', 'فرحان'], ['selfie', '🤳', 'سيلفي'], ['dance', '💃', 'يشطح'], ['agree', '🙂', 'موافق'],
  ['headShake', '🙅', 'لا لا'], ['sneak', '🥷', 'متخبّي'], ['sad', '😔', 'زعفان'],
];
export const CLIP_POSES = { dance: 'dance', agree: 'agree', headShake: 'headShake', sneak: 'sneak', sad: 'sad' };

const P = (b, A, f, s, u) => b.clone().addScaledVector(A.fwd, f * A.k).addScaledVector(A.side, s * A.k).addScaledVector(A.up, u * A.k);
const pole = (A, s, u, f) => new THREE.Vector3().addScaledVector(A.side, s).addScaledVector(A.up, u).addScaledVector(A.fwd, f).normalize();

function spec(e, A, t) {
  const akL = { T: P(A.hips, A, -0.03, 0.2, 0.08), P: pole(A, 1, 0.4, -0.3), g: 'fist' }, akR = { T: P(A.hips, A, -0.03, -0.2, 0.08), P: pole(A, -1, 0.4, -0.3), g: 'fist' };
  switch (e.pose) {
    case 'crossed': return { L: { T: P(A.chest, A, 0.17, -0.07, -0.1), P: pole(A, 1, -1, -0.3), g: 'fist' }, R: { T: P(A.chest, A, 0.2, 0.08, -0.06), P: pole(A, -1, -1, -0.3), g: 'fist' } };
    case 'shh': return { R: { T: P(A.head, A, 0.13, -0.005, 0.03), P: pole(A, -1, -1.2, -0.2), g: 'point' }, L: { T: P(A.chest, A, 0.17, 0.0, -0.14), P: pole(A, 1, -1, -0.3), g: 'fist' } };
    case 'hips': return { L: akL, R: akR };
    case 'peace': return { R: { T: P(A.head, A, 0.16, -0.13, 0.08), P: pole(A, -1, -1, -0.4), g: 'peace' }, L: akL };
    case 'point': return { R: { T: P(A.shR, A, 0.62, 0.05, 0.06), P: pole(A, -0.3, -1, 0), g: 'point' }, L: akL };
    case 'thumbs': return { R: { T: P(A.chest, A, 0.33, -0.1, 0.0), P: pole(A, -1, -0.8, -0.3), g: 'thumb' } };
    case 'salute': return { R: { T: P(A.head, A, 0.1, -0.07, 0.13), P: pole(A, -1, 0.1, 0.1), g: 'open' } };
    case 'wave': return { R: { T: P(A.shR, A, 0.08, -0.22 + Math.sin(t * 8) * 0.07, 0.36), P: pole(A, -1, -1, -0.2), g: 'open' } };
    case 'victory': return { R: { T: P(A.shR, A, 0.05, -0.05, 0.62), P: pole(A, -1, 0, 0.3), g: 'fist' }, L: akL };
    case 'flex': return { L: { T: P(A.shL, A, 0.02, 0.3, 0.12), P: pole(A, 0.3, -1, -0.2), g: 'fist' }, R: { T: P(A.shR, A, 0.02, -0.3, 0.12), P: pole(A, -0.3, -1, -0.2), g: 'fist' } };
    case 'heart': return { L: { T: P(A.chest, A, 0.32, 0.035, 0.12), P: pole(A, 1, -1, -0.2), g: 'open' }, R: { T: P(A.chest, A, 0.32, -0.035, 0.12), P: pole(A, -1, -1, -0.2), g: 'open' } };
    case 'cheer': { const b = Math.abs(Math.sin(t * 6)) * 0.05; return { L: { T: P(A.shL, A, 0.06, 0.12, 0.6 - b), P: pole(A, 1, 0, 0.2), g: 'fist' }, R: { T: P(A.shR, A, 0.06, -0.12, 0.6 - b), P: pole(A, -1, 0, 0.2), g: 'fist' } }; }
    case 'selfie': return { R: { T: P(A.shR, A, 0.45, -0.1, 0.3), P: pole(A, -1, -1, 0), g: 'fist', phone: true }, L: { T: P(A.head, A, 0.16, 0.13, 0.07), P: pole(A, 1, -1, -0.4), g: 'peace' } };
    default: return {};
  }
}

const _tmp = new THREE.Vector3();
export function applyPose(e, dt, t, camera) {
  const av = e.av; const A = av.anchors();
  let S = spec(e, A, t);
  if (e.hug && e.hug.av) { // arm over the friend's shoulder
    const o = e.hug.av.anchors(); const near = o.shL.distanceToSquared(A.hips) < o.shR.distanceToSquared(A.hips) ? o.shL : o.shR;
    const T = near.clone().addScaledVector(A.up, 0.05).addScaledVector(A.fwd, -0.05);
    S[e.hugSide > 0 ? 'L' : 'R'] = { T, P: pole(A, e.hugSide, 0.5, -0.6), g: 'open' };
  }
  const k = 1 - Math.exp(-dt * 10);
  av.ikState ||= { L: { w: 0, T: null }, R: { w: 0, T: null } };
  for (const side of ['L', 'R']) {
    const st = av.ikState[side], sp = S[side];
    st.w += ((sp ? 1 : 0) - st.w) * k;
    if (sp) { st.T = st.T ? st.T.lerp(sp.T, Math.min(1, k * 1.5)) : sp.T.clone(); st.P = sp.P; st.g = sp.g; }
    if (st.w > 0.01 && st.T) {
      const pre = side === 'L' ? 'Left' : 'Right';
      twoBoneIK(av.bones[pre + 'Arm'], av.bones[pre + 'ForeArm'], av.bones[pre + 'Hand'], st.T, st.P, Math.min(1, st.w));
      if (st.w > 0.5) setGesture(av, side, st.g || 'relax');
    }
  }
  if (av.phone) av.phone.visible = !!(S.R && S.R.phone);
  // head look toward camera (photo mode)
  if (e.look && !e.moving && av.bones.Head && camera) {
    const hp = av.bones.Head.getWorldPosition(_tmp);
    const to = camera.position.clone().sub(hp); to.y = 0; to.normalize();
    const fw = A.fwd.clone(); const ang = Math.atan2(fw.x * to.z - fw.z * to.x, fw.dot(to));
    const yaw = THREE.MathUtils.clamp(-ang, -0.75, 0.75) * 0.7;
    e.lookYaw = (e.lookYaw || 0) + (yaw - (e.lookYaw || 0)) * k;
    if (av.bones.Neck) rotWorld(av.bones.Neck, new THREE.Quaternion().setFromAxisAngle(A.up, e.lookYaw * 0.45));
    rotWorld(av.bones.Head, new THREE.Quaternion().setFromAxisAngle(A.up, e.lookYaw * 0.55));
  }
  if (e.pose === 'selfie' || e.pose === 'peace') rotWorld(av.bones.Head, new THREE.Quaternion().setFromAxisAngle(A.fwd, e.pose === 'selfie' ? -0.12 : 0.1));
}
