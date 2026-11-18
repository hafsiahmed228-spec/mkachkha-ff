import * as THREE from 'three';
import { $, $$, h, toast, uid, LS, media, models, isNative, saveBlob, stamp, openLink, speak, aiText, aiJSON, aiImage, aiErr, IMAGE_MODELS, geminiKey, dataURLtoBlob, blobToB64 } from './core.js';
import { createEngine } from './three/engine.js';
import { Cast } from './three/cast.js';
import { BODIES, loadGLB } from './three/avatar.js';
import { POSES } from './three/poses.js';

const BASE = './models/';
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9zM5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
};
const CONTACT = [['💬 WhatsApp', 'https://wa.me/21698151297'], ['📘 Facebook', 'https://www.facebook.com/ahmedhfsi'], ['📸 Instagram', 'https://instagram.com/ahmed.hafsii']];
const PAL = { top: ['#d62828', '#ffcc00', '#111111', '#f2f2f2', '#1d3557', '#2a9d8f', '#6c3fc4', '#ff6fa8'], skin: ['#ffe0c4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'],
  hat: ['#c1121f', '#111111', '#ffcc00', '#1d3557', '#f2f2f2', '#2a9d8f'], mask: ['#111111', '#f2f2f2', '#d62828', '#ffcc00', '#1d3557', '#6c3fc4'] };
const MAPLIST = [['paris', '🗼', 'باريس', 1], ['london', '🎡', 'لندن', 1], ['newyork', '🗽', 'نيويورك', 1], ['ibiza', '🏝️', 'إيبيزا', 1], ['tunis', '🕰️', 'تونس', 1], ['dubai', '🏙️', 'دبي', 1],
  ['neon', '🌃', 'مدينة نيون'], ['stade', '🏟️', 'الملعب'], ['sidi', '🏘️', 'سيدي بوسعيد'], ['plage', '🏖️', 'البحر'], ['souk', '🛍️', 'السوق'], ['studio', '📸', 'ستوديو']];
const MAPART = { paris: ['#1d2b5a', '#c94b6b'], london: ['#2c3440', '#8a1c2c'], newyork: ['#101a3a', '#d4a017'], ibiza: ['#ff7a59', '#5a2a8a'], tunis: ['#c1121f', '#f2c14e'], dubai: ['#c9862f', '#1d2b5a'],
  neon: ['#2a0f45', '#ff2fa0'], stade: ['#0e3d1e', '#d62828'], sidi: ['#1d5fbf', '#f4f1ea'], plage: ['#1aa7c9', '#f0dcae'], souk: ['#7a3d12', '#e9b44c'], studio: ['#2a1450', '#ffb020'] };
const FLAG = { paris: '🇫🇷', london: '🇬🇧', newyork: '🇺🇸', ibiza: '🇪🇸', tunis: '🇹🇳', dubai: '🇦🇪' };

/* ---------- state ---------- */
function newChar(body = 'ahmed', name = '') {
  return { id: uid(), name, body, height: 1, width: 1, tints: {}, toggles: {}, acc: { hat: 'none', hatColor: '#c1121f', mask: 'none', maskColor: '#111111', glasses: 'none' },
    showBack: false, number: 10, backName: '', backColor: '#ffffff', voice: { pitch: 1, rate: 1 }, aiDesc: '', refs: [] };
}
let chars = LS.get('chars', null);
if (!chars || !chars.length) { const a = newChar('ahmed', 'أحمد'); const b = newChar('michelle', 'ميشال'); chars = [a, b]; }
let activeId = LS.get('active', chars[0].id); if (!chars.find(c => c.id === activeId)) activeId = chars[0].id;
const saveChars = () => { LS.set('chars', chars); LS.set('active', activeId); };
let E, cast, screen = 'home', bodyThumbs = {}, customBodies = {};

/* ---------- boot ---------- */
async function boot() {
  const bar = $('#splashBar'), txt = $('#splashTxt'); const step = (p, t) => { bar.style.width = p + '%'; if (t) txt.textContent = t; };
  try {
    for (const m of await models.all()) registerCustom(m);
    E = createEngine($('#c3d'), { quality: LS.get('quality', 'high'), worldCtx: { chars: () => cast ? cast.list : [], active: () => cast ? cast.active : 0, toast, onGoal: () => { const a = cast.cur; if (a) { a.pose = 'cheer'; setTimeout(() => { if (a.pose === 'cheer') a.pose = null; }, 2500); } }, onMapChanged } });
    cast = new Cast(E, { base: BASE, customBodies });
    step(15, 'قاعد نحمّل الموديلات و الحركات…');
    let i = 0; for (const s of chars) { await cast.add(s); step(15 + (++i / chars.length) * 60); }
    cast.active = Math.max(0, chars.findIndex(c => c.id === activeId));
    step(80, 'قاعد نبني الدنيا…'); E.worlds.night = LS.get('night', false); E.worlds.setMap('studio', true);
    step(92, 'آخر لمسات…'); await makeBodyThumbs();
  } catch (err) { console.error(err); txt.textContent = 'صار مشكل في التحميل 😕 ' + (err && err.message || ''); return; }
  buildWorldHUD(); go('home'); setInterval(lobbyTick, 6500);
  step(100); setTimeout(() => $('#splash').classList.add('out'), 250);
}
function onMapChanged(id) { if (!cast) return; const z = E.worlds.MAPS[id].spawnZ; cast.spawnAll(z); if (screen === 'world') cast.frameWorld(); else if (screen === 'chars') cast.frameEditor(); else if (screen === 'home') cast.arrangeLobby(); }
const ensureMap = id => { if (E.worlds.mapId !== id) E.worlds.setMap(id, true); };
const destMap = () => LS.get('map', 'paris');
async function makeBodyThumbs() { for (const k of Object.keys(BODIES).concat(Object.keys(customBodies))) { if (bodyThumbs[k]) continue; try { const tmp = { state: newChar(k), av: await cast.makeAvatar(newChar(k)) }; cast.thumb(tmp); bodyThumbs[k] = tmp.thumb; cast.dispose(tmp.av); } catch (e) {} } }
function registerCustom(m) { const key = 'custom:' + m.id; customBodies[key] = { url: URL.createObjectURL(m.blob), label: m.name, gender: 'm', custom: true, desc: m.desc || 'custom 3D character',
  tints: [{ id: 'all', label: 'الألوان', meshes: ['*'], soft: true }], toggles: [], acc: { r: 0.1, up: 0.09, fwd: 0.01, eyeUp: 0.075, eyeFwd: 0.09, eyeGap: 0.033 }, back: 0.12 }; return key; }
const bodyDef = k => BODIES[k] || customBodies[k] || BODIES.ahmed;
const curState = () => chars.find(c => c.id === activeId) || chars[0];
const entryOf = s => cast.list.find(e => e.state === s);

/* ---------- navigation ---------- */
function buildTabbar() {
  const tb = $('#tabbar'); tb.innerHTML = '';
  [['home', ICON.home, 'الرئيسية'], ['chars', ICON.user, 'شخصياتي'], ['world', ICON.globe, 'العالم', true], ['studio', ICON.spark, 'ستوديو IA'], ['gallery', ICON.image, 'تصاوري']].forEach(([id, ic, lb, mid]) => {
    const b = h('button', { 'data-s': id, class: mid ? 'mid' : '', onclick: () => go(id) }); b.innerHTML = mid ? `<div class="bub">${ic}</div><span>${lb}</span>` : `${ic}<span>${lb}</span>`; tb.append(b); });
}
function go(s) {
  screen = s; $('#app').dataset.screen = s; closeLayer(); $('#app').classList.remove('hidehud');
  const live = s === 'home' || s === 'chars' || s === 'world'; E.setRunning(live);
  if (s === 'home') { ensureMap('studio'); cast.setMode('lobby'); cast.arrangeLobby(); lobbyTick(true); requestAnimationFrame(() => { E.resize(); cast.arrangeLobby(); }); renderLobby(); }
  if (s === 'chars') { ensureMap('studio'); cast.list.forEach(c => c.pose = null); cast.setMode('edit'); cast.spawnAll(0); requestAnimationFrame(() => { E.resize(); cast.frameEditor(); }); renderChars(); }
  if (s === 'world') { const d = destMap(); const enter = () => { cast.list.forEach(c => c.pose = null); cast.setMode('world'); requestAnimationFrame(() => { E.resize(); cast.frameWorld(); }); updateRoster(); };
    if (E.worlds.mapId !== d) loading(d, () => { E.worlds.setMap(d, true); enter(); }); else enter(); }
  if (s === 'studio') renderStudio(); if (s === 'gallery') renderGallery();
}
function loading(id, fn) { const m = MAPLIST.find(x => x[0] === id) || ['', '🌍', '']; const a = MAPART[id] || ['#222', '#555'];
  const ov = h('div', { class: 'loader', style: `background:linear-gradient(160deg,${a[0]},${a[1]})` }, h('div', { class: 'em' }, m[1]), h('div', { class: 'logo big' }, 'MKACHKHA', h('b', {}, 'FF')), h('h2', {}, (FLAG[id] || '') + ' ' + m[2]), h('div', { class: 'bar' }, h('i')), h('small', {}, ['💡 اضغط 👯 باش تعمل لقطة مع صحابك', '💡 🎬 يبدّل الكادر متاع التصويرة', '💡 ✨ ستوديو IA يرد التصويرة واقعية', '💡 🌙 ردّ الدنيا ليل'][Math.floor(Math.random() * 4)]));
  $('#app').append(ov); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { try { fn(); } finally { ov.classList.add('out'); setTimeout(() => ov.remove(), 450); } }, 60))); }
function setActive(id) { activeId = id; saveChars(); cast.active = Math.max(0, cast.list.findIndex(e => e.state.id === id)); if (screen === 'home') { cast.arrangeLobby(); } if (screen === 'chars') { cast.setMode('edit'); cast.frameEditor(); renderChars(); } if (screen === 'world') { cast.duo = null; updateRoster(); } }

/* ---------- layer (sheets) ---------- */
function closeLayer() { $('#layer').innerHTML = ''; }
function sheet(title, content, light) {
  closeLayer(); const L = $('#layer'); const bd = h('div', { class: 'backdrop' + (light ? ' light' : ''), onclick: closeLayer });
  const sh = h('div', { class: 'sheet' }, h('div', { class: 'grab' }), title ? h('h3', {}, title) : null, content); L.append(bd, sh); return sh;
}

/* ---------- LOBBY (home) ---------- */
const LOBBY_POSES = ['crossed', 'hips', 'peace', null, 'thumbs', 'shh', 'flex', 'salute'];
function lobbyTick(force) { if (screen !== 'home' || !cast) return; cast.list.forEach((c, i) => { if (!c.av.root.visible) return; if (force || Math.random() < 0.7) c.pose = LOBBY_POSES[Math.floor(Math.random() * LOBBY_POSES.length)]; }); }
async function renderLobby() {
  const S = $('#s-home'); const st = curState(); const n = (await media.all()).length; const lv = 1 + Math.floor(n / 5), xp = (n % 5) / 5;
  const d = destMap(), dm = MAPLIST.find(x => x[0] === d) || MAPLIST[0], art = MAPART[d] || ['#333', '#555'];
  S.innerHTML = '';
  S.append(h('div', { class: 'lb-top' },
    h('div', { class: 'prof glass', onclick: () => go('chars') }, h('div', { class: 'pic' }, entryOf(st)?.thumbHead ? h('img', { src: entryOf(st).thumbHead }) : '👤'),
      h('div', {}, h('b', {}, st.name || bodyDef(st.body).label), h('div', { class: 'lv' }, h('span', {}, 'LV ' + lv), h('div', { class: 'xp' }, h('i', { style: `width:${Math.max(6, xp * 100)}%` }))))),
    h('div', { class: 'row' }, h('div', { class: 'cur glass' }, '📸 ', String(n)), h('button', { class: 'icon-btn glass', html: ICON.gear, onclick: openSettings }))));
  S.append(h('div', { class: 'logo lb-logo' }, 'MKACHKHA', h('b', {}, 'FF')));
  const menu = [['👤', 'الشخصيات', () => go('chars')], ['🤖', 'IA تصنع', () => openAICmd()], ['✨', 'ستوديو IA', () => go('studio')], ['🖼️', 'تصاوري', () => go('gallery')], ['📞', 'تواصل', openContact]];
  S.append(h('div', { class: 'lb-menu' }, menu.map(([ic, lb, fn]) => h('button', { class: 'lbm glass', onclick: fn }, h('span', {}, ic), h('small', {}, lb)))));
  S.append(h('div', { class: 'lb-switch' }, h('button', { class: 'icon-btn glass', onclick: () => cycleChar(1) }, '›'), h('div', { class: 'nm' }, st.name || bodyDef(st.body).label), h('button', { class: 'icon-btn glass', onclick: () => cycleChar(-1) }, '‹')));
  S.append(h('div', { class: 'lb-bottom' },
    h('button', { class: 'mapcard', style: `background:linear-gradient(135deg,${art[0]},${art[1]})`, onclick: () => openMaps() }, h('span', { class: 'em' }, dm[1]), h('div', {}, h('small', {}, 'الماب'), h('b', {}, (FLAG[d] || '') + ' ' + dm[2])), h('i', {}, 'بدّل')),
    h('button', { class: 'start', onclick: () => go('world') }, h('span', {}, 'ابدا'), h('small', {}, 'START'))));
}
function cycleChar(dir) { const i = chars.findIndex(c => c.id === activeId); const n = chars[(i + dir + chars.length) % chars.length]; setActive(n.id); cast.setMode('lobby'); cast.arrangeLobby(); lobbyTick(true); renderLobby(); }
function openContact() { sheet('📞 تواصل معانا', h('div', { class: 'contact' }, CONTACT.map(([l, u]) => h('a', { href: u, onclick: ev => { ev.preventDefault(); openLink(u); } }, l)))); }
async function addCharacter() {
  const s = newChar('ahmed', ''); chars.push(s); saveChars(); toast('قاعد نزيد الشخصية…'); await cast.add(s); seg = 'body'; setActive(s.id); go('chars');
}

/* ---------- CHARACTERS (editor) ---------- */
let seg = 'body', rebuildT = null;
function changed(full) { saveChars(); clearTimeout(rebuildT); rebuildT = setTimeout(async () => { const e = entryOf(curState()); if (e) { await cast.rebuild(e); if (full) cast.frameEditor(); updateEdRoster(); } }, full ? 0 : 250); }
function renderChars() {
  const S = $('#s-chars'); const st = curState(); S.innerHTML = '';
  const tools = h('div', { class: 'ed-tools' },
    h('button', { class: 'icon-btn', title: 'رجوع', html: ICON.back, onclick: () => go('home') }),
    h('button', { class: 'icon-btn', title: 'دوّر', onclick: () => { const e = entryOf(st); e.yaw += Math.PI; e.targetYaw = e.yaw; } }, '🔄'),
    h('button', { class: 'icon-btn', title: 'الوجه', onclick: () => { cast.duo = null; cast.frame('close'); } }, '🔍'),
    h('button', { class: 'icon-btn', title: 'كامل', onclick: () => cast.frameEditor() }, '🧍'));
  S.append(h('div', { class: 'ed-top' }, tools));
  const sheetEl = h('div', { class: 'ed-sheet' }, h('div', { class: 'grab' }));
  sheetEl.append(h('div', { class: 'ed-roster scroller', id: 'edRoster' }));
  const name = h('input', { class: 'inp', value: st.name || '', placeholder: 'اسم الشخصية', maxlength: 24, oninput: ev => { st.name = ev.target.value; changed(); } });
  sheetEl.append(h('div', { class: 'ed-head' }, name,
    h('button', { class: 'icon-btn', title: 'العب', onclick: () => go('world') }, '▶'),
    h('button', { class: 'icon-btn', title: 'فسخ', onclick: () => delCharacter(st) }, '🗑️')));
  const segs = [['cmd', '🤖 IA'], ['body', '🧍 البدن'], ['colors', '🎨 الألوان'], ['acc', '🎩 زيادات'], ['shirt', '👕 المريول'], ['ai', '✨ وصف IA'], ['voice', '🗣️ الصوت']];
  sheetEl.append(h('div', { class: 'segs' }, segs.map(([id, lb]) => h('button', { class: 'seg' + (seg === id ? ' on' : ''), onclick: () => { seg = id; renderChars(); } }, lb))));
  const body = h('div', { class: 'ed-body' }); sheetEl.append(body); S.append(sheetEl);
  updateEdRoster();
  const def = bodyDef(st.body);
  if (seg === 'body') {
    const grid = h('div', { class: 'bodies' });
    for (const k of Object.keys(BODIES).concat(Object.keys(customBodies))) { const d = bodyDef(k);
      const card = h('div', { class: 'body-card' + (st.body === k ? ' on' : ''), onclick: () => { if (st.body === k) return; st.body = k; st.tints = {}; st.toggles = {}; changed(true); renderChars(); } }, h('img', { src: bodyThumbs[k] || '' }), h('b', {}, d.label));
      if (d.custom) card.append(h('button', { class: 'x', onclick: async ev => { ev.stopPropagation(); if (!confirmBox()) return; await models.del(k.slice(7)); delete customBodies[k]; renderChars(); } }, '✕'));
      grid.append(card); }
    body.append(h('div', { class: 'sec' }, grid));
    const fi = h('input', { type: 'file', accept: '.glb,model/gltf-binary', style: 'display:none', onchange: ev => importGLB(ev.target.files[0]) });
    body.append(fi, h('button', { class: 'btn ghost block', onclick: () => fi.click() }, '📥 زيد شخصية من تليفونك (.glb)'));
    body.append(h('p', { class: 'muted' }, 'تنجم تجيب شخصيات واقعية (Mixamo / Ready Player Me) بصيغة GLB، و تخدم بنفس الحركات.'));
    body.append(rangeRow('الطول', 'قصير', 'طويل', st.height, 0.86, 1.12, v => { st.height = v; changed(); }));
    body.append(rangeRow('العرض', 'ضعيف', 'عريض', st.width, 0.88, 1.3, v => { st.width = v; changed(); }));
  }
  if (seg === 'cmd') body.append(aiCmdBox(st));
  if (seg === 'colors') {
    if (!def.tints.length && !(def.toggles || []).length) body.append(h('div', { class: 'empty' }, 'الشخصية هذي ما فيهاش ألوان تتبدّل.'));
    for (const t of def.tints) body.append(h('label', { class: 'lbl' }, t.label), swatches(t.id === 'skin' ? PAL.skin : PAL.top, st.tints[t.id] || null, c => { if (c) st.tints[t.id] = c; else delete st.tints[t.id]; changed(); }, true));
    for (const t of def.toggles || []) { const on = st.toggles[t.id] !== false; body.append(h('div', { class: 'toggle' }, h('b', {}, t.label), h('button', { class: 'switch' + (on ? ' on' : ''), onclick: ev => { st.toggles[t.id] = !on; ev.target.classList.toggle('on'); changed(); renderChars(); } }))); }
  }
  if (seg === 'acc') {
    body.append(h('label', { class: 'lbl' }, 'على الراس'), chipRow([['none', 'بلاش'], ['chechia', 'شاشية'], ['cap', 'كاسكيت'], ['beanie', 'بونية']], st.acc.hat, v => { st.acc.hat = v; changed(); }));
    body.append(swatches(PAL.hat, st.acc.hatColor, c => { st.acc.hatColor = c; changed(); }));
    body.append(h('label', { class: 'lbl' }, 'الماسك'), chipRow([['none', 'بلاش'], ['cloth', 'ماسك']], st.acc.mask, v => { st.acc.mask = v; changed(); }));
    body.append(swatches(PAL.mask, st.acc.maskColor, c => { st.acc.maskColor = c; changed(); }));
    body.append(h('label', { class: 'lbl' }, 'النظارات'), chipRow([['none', 'بلاش'], ['round', 'مدوّرة'], ['square', 'مربّعة'], ['sun', 'شمس']], st.acc.glasses, v => { st.acc.glasses = v; changed(); }));
  }
  if (seg === 'shirt') {
    body.append(h('div', { class: 'toggle' }, h('b', {}, 'نومرو و اسم على الضهر'), h('button', { class: 'switch' + (st.showBack ? ' on' : ''), onclick: ev => { st.showBack = !st.showBack; ev.target.classList.toggle('on'); changed(); if (st.showBack) { const e = entryOf(st); e.yaw = Math.PI; e.targetYaw = Math.PI; } } })));
    body.append(h('label', { class: 'lbl' }, 'النومرو'), h('input', { class: 'inp', type: 'number', min: 0, max: 99, value: st.number, oninput: ev => { st.number = Math.max(0, Math.min(99, parseInt(ev.target.value) || 0)); changed(); } }));
    body.append(h('label', { class: 'lbl' }, 'الاسم على الضهر'), h('input', { class: 'inp', maxlength: 12, value: st.backName, oninput: ev => { st.backName = ev.target.value; changed(); } }));
    body.append(h('label', { class: 'lbl' }, 'لون الكتيبة'), swatches(['#ffffff', '#ffcc00', '#d62828', '#111111', '#3de1ff'], st.backColor, c => { st.backColor = c; changed(); }));
  }
  if (seg === 'ai') {
    body.append(h('p', { class: 'muted' }, 'اكتب كيفاش تحب الشخصية تبان في تصاور الـ IA (بالدارجة ولا أي لغة). مثال: «شاب تونسي، شعر أسود قصير fade، ماسك أسود، جاكيتة varsity صفراء و حمراء، sneakers بيض».'));
    body.append(h('textarea', { class: 'inp', placeholder: 'وصف الشخصية…', oninput: ev => { st.aiDesc = ev.target.value; saveChars(); } }, st.aiDesc || ''));
    body.append(h('label', { class: 'lbl' }, 'تصاور مرجعية للوجه (اختياري)'), refsBox(st.refs, saveChars));
    body.append(h('p', { class: 'muted' }, 'كي تحط تصويرتك، الـ IA تحاول تخلّي الوجه يشبهلك.'));
  }
  if (seg === 'voice') {
    body.append(rangeRow('الصوت', 'خشين', 'رقيق', st.voice.pitch, 0.5, 1.6, v => { st.voice.pitch = v; saveChars(); }));
    body.append(rangeRow('السرعة', 'بالشوية', 'بالزربة', st.voice.rate, 0.7, 1.4, v => { st.voice.rate = v; saveChars(); }));
    body.append(h('button', { class: 'btn block', onclick: () => talk(entryOf(st), `عسلامة، أنا ${st.name || 'صاحبك'}!`) }, '🔊 جرّب الصوت'));
  }
}
function updateEdRoster() {
  const R = $('#edRoster'); if (!R) return; R.innerHTML = '';
  chars.forEach(c => { const en = entryOf(c); R.append(h('div', { class: 'av' + (c.id === activeId ? ' on' : ''), onclick: () => setActive(c.id) }, h('div', { class: 'ph' }, en?.thumbHead ? h('img', { src: en.thumbHead }) : '👤'), h('small', {}, c.name || bodyDef(c.body).label))); });
  R.append(h('div', { class: 'av add', onclick: addCharacter }, h('div', { class: 'ph' }, '+'), h('small', {}, 'جديدة')));
}
function confirmBox() { return true; }
async function delCharacter(st) {
  if (chars.length < 2) return toast('لازم تخلّي شخصية وحدة على الأقل');
  const sh = sheet('تفسخ «' + (st.name || bodyDef(st.body).label) + '»؟', h('div', { class: 'row' },
    h('button', { class: 'btn red', style: 'flex:1', onclick: () => { const i = chars.indexOf(st); cast.remove(cast.list.findIndex(e => e.state === st)); chars.splice(i, 1); activeId = chars[0].id; saveChars(); closeLayer(); setActive(activeId); toast('تفسخت'); } }, 'إيه افسخ'),
    h('button', { class: 'btn ghost', style: 'flex:1', onclick: closeLayer }, 'لا')));
}
async function importGLB(file) {
  if (!file) return; toast('قاعد نثبّت في الملف…');
  try { const url = URL.createObjectURL(file); const g = await loadGLB(url); let ok = false; g.scene.traverse(o => { if (o.isBone && /LeftArm$/.test(o.name)) ok = true; });
    if (!ok) { toast('الملف هذا ما فيهش skeleton متاع Mixamo / RPM 😕', 3500); return; }
    const m = await models.add({ name: file.name.replace(/\.glb$/i, '').slice(0, 18), blob: file }); const key = registerCustom(m); cast.customBodies[key] = customBodies[key];
    await makeBodyThumbs(); const st = curState(); st.body = key; st.tints = {}; changed(true); renderChars(); toast('تزادت ✅'); }
  catch (e) { console.error(e); toast('ما نجمتش نقرا الملف'); }
}
function rangeRow(label, a, b, v, mn, mx, fn) { const inp = h('input', { type: 'range', min: mn, max: mx, step: 0.01, value: v, oninput: ev => fn(parseFloat(ev.target.value)) });
  return h('div', {}, h('label', { class: 'lbl' }, label), h('div', { class: 'range' }, h('span', {}, a), inp, h('span', {}, b))); }
function chipRow(opts, v, fn) { const box = h('div', { class: 'chips' }); opts.forEach(([id, lb]) => box.append(h('button', { class: 'chip' + (v === id ? ' on' : ''), onclick: ev => { $$('.chip', box).forEach(x => x.classList.remove('on')); ev.target.classList.add('on'); fn(id); } }, lb))); return box; }
function swatches(cols, v, fn, allowNone) { const box = h('div', { class: 'sw' }); const mark = el => { $$('.dot', box).forEach(x => x.classList.remove('on')); el && el.classList.add('on'); };
  if (allowNone) box.append(h('div', { class: 'dot none' + (!v ? ' on' : ''), title: 'الأصلي', onclick: ev => { mark(ev.target); fn(null); } }));
  cols.forEach(c => box.append(h('div', { class: 'dot' + (v && v.toLowerCase() === c ? ' on' : ''), style: `background:${c}`, onclick: ev => { mark(ev.target); fn(c); } })));
  box.append(h('input', { type: 'color', value: v || '#888888', onchange: ev => { mark(null); fn(ev.target.value); } })); return box; }
function refsBox(arr, onChange) {
  const box = h('div', { class: 'refs' }); const fi = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; arr.push(await shrinkImage(f, 768)); onChange(); draw(); } });
  const draw = () => { box.innerHTML = ''; arr.forEach((src, i) => box.append(h('div', { class: 'r' }, h('img', { src }), h('button', { onclick: () => { arr.splice(i, 1); onChange(); draw(); } }, '✕'))));
    if (arr.length < 3) box.append(h('div', { class: 'r add', onclick: () => fi.click() }, '+')); box.append(fi); };
  draw(); return box;
}
function shrinkImage(file, max) { return new Promise(ok => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.85)); }; img.src = URL.createObjectURL(file); }); }


/* ---------- AI character control ---------- */
function aiSchema() {
  const bodies = Object.keys(BODIES).concat(Object.keys(customBodies)).map(k => { const d = bodyDef(k); return `- ${k}: "${d.label}" (${d.desc || 'custom'}); tints=[${d.tints.map(t => t.id).join(',')}]; toggles=[${(d.toggles || []).map(t => t.id).join(',')}]`; }).join('\n');
  return `Available bodies:\n${bodies}\nEditable fields: name (string), body (one key above), height 0.86-1.12, width 0.88-1.3, tints {tintId:"#rrggbb"} (only tint ids of the chosen body), toggles {id:true|false}, acc {hat:"none"|"chechia"|"cap"|"beanie", hatColor:"#rrggbb", mask:"none"|"cloth", maskColor:"#rrggbb", glasses:"none"|"round"|"square"|"sun"}, showBack (bool, shows number+name on the back), number 0-99, backName (<=12 chars), backColor "#rrggbb", voice {pitch 0.5-1.6, rate 0.7-1.4}, aiDesc (rich ENGLISH appearance description used for realistic AI photos: hair style and color, face, skin tone, beard, outfit, shoes, accessories, vibe - include everything the 3D model cannot show).`;
}
function sanitizePatch(st, p) {
  const o = {}, num = (v, a, b) => { v = parseFloat(v); return isNaN(v) ? undefined : Math.max(a, Math.min(b, v)); }, hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined;
  if (typeof p.name === 'string') o.name = p.name.slice(0, 24);
  if (p.body && (BODIES[p.body] || customBodies[p.body])) o.body = p.body;
  if (p.height != null) o.height = num(p.height, 0.86, 1.12); if (p.width != null) o.width = num(p.width, 0.88, 1.3);
  const d = bodyDef(o.body || st.body);
  if (p.tints && typeof p.tints === 'object') { o.tints = {}; for (const t of d.tints) { const c = hex(p.tints[t.id]); if (c) o.tints[t.id] = c; } }
  if (p.toggles && typeof p.toggles === 'object') { o.toggles = {}; for (const t of d.toggles || []) if (typeof p.toggles[t.id] === 'boolean') o.toggles[t.id] = p.toggles[t.id]; }
  if (p.acc && typeof p.acc === 'object') { const a = p.acc; o.acc = { ...st.acc };
    if (['none', 'chechia', 'cap', 'beanie'].includes(a.hat)) o.acc.hat = a.hat; if (hex(a.hatColor)) o.acc.hatColor = a.hatColor;
    if (['none', 'cloth'].includes(a.mask)) o.acc.mask = a.mask; if (hex(a.maskColor)) o.acc.maskColor = a.maskColor;
    if (['none', 'round', 'square', 'sun'].includes(a.glasses)) o.acc.glasses = a.glasses; }
  if (typeof p.showBack === 'boolean') o.showBack = p.showBack; if (p.number != null && !isNaN(parseInt(p.number))) o.number = Math.max(0, Math.min(99, parseInt(p.number)));
  if (typeof p.backName === 'string') o.backName = p.backName.slice(0, 12); if (hex(p.backColor)) o.backColor = p.backColor;
  if (p.voice && typeof p.voice === 'object') { o.voice = { ...st.voice }; if (p.voice.pitch != null) o.voice.pitch = num(p.voice.pitch, 0.5, 1.6) ?? st.voice.pitch; if (p.voice.rate != null) o.voice.rate = num(p.voice.rate, 0.7, 1.4) ?? st.voice.rate; }
  if (typeof p.aiDesc === 'string') o.aiDesc = p.aiDesc.slice(0, 900);
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return o;
}
async function runAICmd(st, text, asNew) {
  const cur = { ...st }; delete cur.refs; delete cur.id;
  const res = await aiJSON(`You control the character editor of a 3D mobile game.\n${asNew ? 'Create a NEW character from the user description.' : 'Current character JSON: ' + JSON.stringify(cur)}\n${aiSchema()}\nUser request (may be Tunisian Darija, Arabic, French or English): "${text}"\nReturn JSON {"patch":{...only fields to set...},"message":"one short friendly sentence in Tunisian Darija (Arabic script) saying what you did"}. Pick the body that best matches. Always include a rich aiDesc that matches the request.`);
  const patch = sanitizePatch(st, res.patch || {});
  if (asNew) { const s = newChar(patch.body || 'ahmed', patch.name || ''); Object.assign(s, patch); chars.push(s); saveChars(); await cast.add(s); setActive(s.id); }
  else { if (patch.body && patch.body !== st.body) { st.tints = {}; st.toggles = {}; } if (patch.tints && !(patch.body && patch.body !== st.body)) patch.tints = { ...st.tints, ...patch.tints }; if (patch.toggles) patch.toggles = { ...st.toggles, ...patch.toggles };
    Object.assign(st, patch); saveChars(); const e = entryOf(st); if (e) await cast.rebuild(e); }
  return res.message || 'تمّ ✅';
}
function aiCmdBox(st) {
  const ta = h('textarea', { class: 'inp', placeholder: 'قلّي شنوّة تحب… مثال: «ردّو لابس ماسك أسود و شاشية حمراء، طويل شوية، و حطّ النومرو 7 و اسمو HAMMA على ضهرو»' });
  const msg = h('p', { class: 'muted', style: 'min-height:20px' });
  const ex = ['ردّو كيف بطل لعبة: ماسك أسود و نظارات شمس', 'بنت ستايل ستريت، ألوان وردي و أبيض', 'لابس مريول الترجي أحمر و أصفر نومرو 10', 'روبو ذهبي و أسود', 'زيدو سمّنو شوية و قصّرو'];
  const run = async (asNew, btn) => { if (!ta.value.trim()) return toast('اكتب شنوّة تحب'); const t = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try { msg.textContent = '🤖 ' + await runAICmd(st, ta.value.trim(), asNew); if (screen === 'chars') renderChars(); if (screen === 'home') renderLobby(); } catch (e) { msg.textContent = aiErr(e); } btn.disabled = false; btn.innerHTML = t; };
  const b1 = h('button', { class: 'btn', onclick: () => run(false, b1) }, '✨ طبّق على هذي'), b2 = h('button', { class: 'btn ghost', onclick: () => run(true, b2) }, '➕ شخصية جديدة');
  return h('div', {}, h('p', { class: 'muted' }, 'الـ IA تتحكّم في كل تفصيلة: البدن، الطول، الألوان، الماسك، الشاشية، النومرو، الصوت، و تكتب وصف كامل للتصاور الواقعية.'), ta,
    h('div', { class: 'chips', style: 'margin:8px 0' }, ex.map(x => h('button', { class: 'chip', onclick: () => ta.value = x }, x))), h('div', { class: 'grid2' }, b1, b2), msg);
}
function openAICmd() { sheet('🤖 الـ IA تصنعلك الشخصية', aiCmdBox(curState())); }

/* ---------- WORLD ---------- */
const FRAMES = [['full', 'كامل'], ['medium', 'نصّ'], ['close', 'قريب'], ['hero', 'من لوطا']]; let frameIdx = 0;
function buildWorldHUD() {
  const S = $('#s-world'); S.innerHTML = '';
  S.append(h('div', { class: 'hud-top' }, h('div', { class: 'row' }, h('button', { class: 'icon-btn glass', html: ICON.back, onclick: () => go('home') }), h('div', { class: 'roster', id: 'roster' }))));
  const side = h('div', { class: 'side' },
    sideBtn('🗺️', 'البلاصة', openMaps), sideBtn(E.worlds.night ? '☀️' : '🌙', 'ليل/نهار', ev => { E.worlds.night = !E.worlds.night; LS.set('night', E.worlds.night); ev.currentTarget.textContent = E.worlds.night ? '☀️' : '🌙'; }),
    sideBtn('🎬', 'الكادر', () => { frameIdx = (frameIdx + 1) % FRAMES.length; cast.frame(FRAMES[frameIdx][0]); toast('🎬 ' + FRAMES[frameIdx][1]); }),
    sideBtn('🔄', 'قدّام', () => { cast.duo = null; const e = cast.cur; const f = new THREE.Vector3(Math.sin(e.yaw), 0, Math.cos(e.yaw)); E.controls.target.set(e.pos.x, e.av.height * 0.55, e.pos.z); E.camera.position.copy(E.controls.target).addScaledVector(f, E.fitDist(0.6, e.av.height * 0.62) * 1.1); }),
    sideBtn('🏷️', 'الأسامي', ev => { cast.showTags = !cast.showTags; ev.currentTarget.classList.toggle('on', cast.showTags); }, true),
    sideBtn('🗣️', 'احكي', openTalk), sideBtn('👁️', 'خبّي', () => { $('#app').classList.add('hidehud'); toast('اضغط 👁️ باش ترجّع'); }));
  S.append(side, h('button', { class: 'icon-btn glass showhud', onclick: () => $('#app').classList.remove('hidehud') }, '👁️'));
  const joy = h('div', { class: 'joy' }, h('div', { class: 'knob' })); S.append(joy); wireJoy(joy);
  S.append(h('div', { class: 'pills' }, h('button', { class: 'pill', id: 'recBtn', onclick: toggleRec }, '🎥 فيديو'), h('button', { class: 'pill', onclick: () => go('studio') }, '✨ IA')));
  S.append(h('button', { class: 'shutter', onclick: takePhoto }));
  S.append(h('div', { class: 'acts' }, hb('🕺', 'بوزات', openPoses), hb('⤴️', 'نقّز', () => cast.jump()), hb('👯', 'لقطة', () => { if (cast.list.length < 2) { toast('زيد صاحبك بالـ ＋'); return openAddFriend(); } cast.lineUp(false); toast('📸 لقطة! صوّر'); }), hb('🤳', 'سيلفي', () => { cast.lineUp(true); })));
  addEventListener('keydown', ev => { if (/INPUT|TEXTAREA/.test(ev.target.tagName)) return; cast.keys[ev.key.toLowerCase()] = true; if (ev.key === ' ' && screen === 'world') { cast.jump(); ev.preventDefault(); } });
  addEventListener('keyup', ev => { cast.keys[ev.key.toLowerCase()] = false; });
}
function sideBtn(ic, t, fn, on) { return h('button', { class: 'icon-btn' + (on ? ' on' : ''), title: t, onclick: fn }, ic); }
function hb(ic, lb, fn) { return h('button', { class: 'hb', onclick: fn }, ic, h('small', {}, lb)); }
function wireJoy(J) { const knob = J.firstChild; let id = null;
  const mv = ev => { const r = J.getBoundingClientRect(); let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2); const mx = r.width / 2 - 14, l = Math.hypot(dx, dy); if (l > mx) { dx *= mx / l; dy *= mx / l; } cast.joy.x = dx / mx; cast.joy.y = dy / mx; knob.style.transform = `translate(${dx}px,${dy}px)`; };
  J.addEventListener('pointerdown', ev => { id = ev.pointerId; J.setPointerCapture(id); mv(ev); }); J.addEventListener('pointermove', ev => { if (ev.pointerId === id) mv(ev); });
  const end = ev => { if (ev.pointerId !== id) return; id = null; cast.joy.x = cast.joy.y = 0; knob.style.transform = ''; }; J.addEventListener('pointerup', end); J.addEventListener('pointercancel', end); }
function updateRoster() { const R = $('#roster'); if (!R) return; R.innerHTML = '';
  cast.list.forEach((e, i) => R.append(h('div', { class: 'ra' + (i === cast.active ? ' on' : ''), onclick: () => i === cast.active && cast.list.length > 1 ? openCharMenu(e) : setActive(e.state.id) }, e.thumbHead ? h('img', { src: e.thumbHead }) : '👤')));
  if (cast.list.length < 4) R.append(h('div', { class: 'ra add', onclick: openAddFriend }, '＋')); }
function openCharMenu(e) { sheet(e.state.name || bodyDef(e.state.body).label, h('div', { class: 'grid2' },
  h('button', { class: 'btn', onclick: () => go('chars') }, '✏️ بدّلو'), h('button', { class: 'btn ghost', onclick: () => { closeLayer(); e.hidden = !e.av.root.visible; e.av.root.visible = !e.av.root.visible; } }, '🙈 خبّيه/بيّنو'))); }
function openAddFriend() {
  const box = h('div', {}); box.append(h('p', { class: 'muted' }, 'اختار شكون يجي معاك للّقطة:'));
  const grid = h('div', { class: 'bodies' });
  for (const k of Object.keys(BODIES).concat(Object.keys(customBodies))) grid.append(h('div', { class: 'body-card', onclick: async () => { closeLayer(); const s = newChar(k, bodyDef(k).label); chars.push(s); saveChars(); toast('جاي…');
    const a = cast.cur; const right = new THREE.Vector3(Math.cos(a.yaw), 0, -Math.sin(a.yaw)); const e = await cast.add(s, a.pos.clone().addScaledVector(right, (cast.list.length % 2 ? 1 : -1) * 0.8 * Math.ceil(cast.list.length / 2))); e.yaw = e.targetYaw = a.yaw; updateRoster(); toast('جا صاحبك 👋'); } }, h('img', { src: bodyThumbs[k] || '' }), h('b', {}, bodyDef(k).label)));
  box.append(grid); sheet('👥 زيد صاحبك', box);
}
function openMaps() {
  const box = h('div', {}); const cur = screen === 'world' ? E.worlds.mapId : destMap();
  const card = ([id, em, lb, city]) => { const a = MAPART[id] || ['#333', '#555'];
    return h('button', { class: 'mapc2' + (cur === id ? ' on' : ''), style: `background:linear-gradient(150deg,${a[0]},${a[1]})`, onclick: () => { LS.set('map', id); closeLayer();
      if (screen === 'world') loading(id, () => { E.worlds.setMap(id, true); cast.setMode('world'); cast.frameWorld(); }); else renderLobby(); } },
      h('span', { class: 'em' }, em), h('b', {}, lb), h('small', {}, city ? (FLAG[id] + ' مدينة') : '🎮 بلاصة')); };
  box.append(h('div', { class: 'h2' }, '🌍 مدن العالم'), h('div', { class: 'maps2' }, MAPLIST.filter(m => m[3]).map(card)));
  box.append(h('div', { class: 'h2' }, '🎮 بلايص اللعبة'), h('div', { class: 'maps2' }, MAPLIST.filter(m => !m[3]).map(card)));
  box.append(h('div', { class: 'toggle', style: 'margin-top:10px' }, h('b', {}, '🌙 الليل'), h('button', { class: 'switch' + (E.worlds.night ? ' on' : ''), onclick: ev => { E.worlds.night = !E.worlds.night; LS.set('night', E.worlds.night); ev.target.classList.toggle('on'); } })));
  sheet('🗺️ اختار الماب', box);
}
function openPoses() {
  const e = cast.cur; let all = false; const g = h('div', { class: 'pgrid' });
  POSES.forEach(([id, em, lb]) => g.append(h('button', { class: 'pc' + ((e.pose || 'idle') === id ? ' on' : ''), onclick: ev => { (all ? cast.list : [e]).forEach(c => { c.pose = id === 'idle' ? null : id; c.hug = null; }); $$('.pc', g).forEach(x => x.classList.remove('on')); ev.currentTarget.classList.add('on'); } }, h('span', {}, em), h('small', {}, lb))));
  sheet(null, h('div', {}, g, h('div', { class: 'chips', style: 'margin-top:12px' },
    h('button', { class: 'chip' + (e.look ? ' on' : ''), onclick: ev => { const v = !e.look; (all ? cast.list : [e]).forEach(c => c.look = v); ev.target.classList.toggle('on', v); } }, '👀 يخزر للكاميرا'),
    h('button', { class: 'chip', onclick: ev => { all = !all; ev.target.classList.toggle('on', all); } }, '👥 للكل')),
    h('button', { class: 'btn block', style: 'margin-top:12px', onclick: closeLayer }, '✅ تمّ')), true);
}
/* photos & video */
function watermark(g, w, hgt) {
  const fs = Math.round(Math.max(18, hgt * 0.042)); g.save(); g.textBaseline = 'bottom'; g.textAlign = 'right'; g.direction = 'ltr'; g.font = `${fs}px Lalezar, Cairo, sans-serif`;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = fs * 0.3; const gr = g.createLinearGradient(0, hgt - fs * 1.6, 0, hgt - fs * 0.4); gr.addColorStop(0, '#fff1b8'); gr.addColorStop(1, '#ff9f1c'); g.fillStyle = gr;
  const m = fs * 0.6, bw = g.measureText('FF').width + fs * 0.5; g.fillText('MKACHKHA', w - m - bw - fs * 0.2, hgt - m);
  g.shadowBlur = 0; g.fillStyle = '#d9001f'; g.beginPath(); (g.roundRect ? g.roundRect(w - m - bw, hgt - m - fs * 1.05, bw, fs * 1.05, fs * 0.2) : g.rect(w - m - bw, hgt - m - fs * 1.05, bw, fs * 1.05)); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('FF', w - m - bw / 2, hgt - m + fs * 0.08); g.restore(); }
function grab(wm = true) { const was = cast.ring.visible; cast.ring.visible = false; const src = E.capture(); cast.ring.visible = was; const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0); if (wm) watermark(g, c.width, c.height); return c; }
async function takePhoto() {
  const c = grab(); const fl = $('#flash'); fl.classList.add('go'); requestAnimationFrame(() => requestAnimationFrame(() => fl.classList.remove('go')));
  const m = await media.add({ type: 'photo', src: c.toDataURL('image/jpeg', 0.92) }); viewMedia(m);
}
let rec = null, recCv, recG, recChunks = [], recTimer, recType;
function toggleRec() {
  const btn = $('#recBtn'); if (rec) { rec.stop(); return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return toast('الفيديو مش متوفّر هنا');
  recType = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)); if (!recType) return toast('الفيديو مش متوفّر هنا');
  recCv = document.createElement('canvas'); recG = recCv.getContext('2d');
  const draw = () => { if (!rec) return; const s = E.renderer.domElement; if (recCv.width !== s.width) { recCv.width = s.width; recCv.height = s.height; } recG.drawImage(s, 0, 0); watermark(recG, recCv.width, recCv.height); requestAnimationFrame(draw); };
  try { rec = new MediaRecorder(recCv.captureStream(30), { mimeType: recType, videoBitsPerSecond: 6e6 }); } catch (e) { rec = null; return toast('ما نجمتش نسجّل'); }
  recChunks = []; rec.ondataavailable = ev => ev.data.size && recChunks.push(ev.data);
  rec.onstop = async () => { clearInterval(recTimer); btn.classList.remove('live'); btn.textContent = '🎥 فيديو'; const blob = new Blob(recChunks, { type: recType.split(';')[0] }); rec = null;
    const m = await media.add({ type: 'video', blob, ext: recType.includes('mp4') ? 'mp4' : 'webm' }); viewMedia(m); };
  recCv.width = E.renderer.domElement.width; recCv.height = E.renderer.domElement.height; rec.start(250); draw(); let sec = 0; btn.classList.add('live'); btn.textContent = '⏹ 0s';
  recTimer = setInterval(() => { sec++; btn.textContent = `⏹ ${sec}s`; if (sec >= 30 && rec) rec.stop(); }, 1000);
}
/* talking */
let talkTok = 0;
async function talk(e, text) { if (!e || !text) return; const my = ++talkTok; cast.list.forEach(c => cast.bubbleOff(c)); cast.bubbleOn(e, text); if (!e.pose) { e.pose = 'agree'; }
  await speak(text, e.state.voice); if (my === talkTok) { setTimeout(() => { if (my === talkTok) cast.bubbleOff(e); }, 600); if (e.pose === 'agree') e.pose = null; } }
function openTalk() {
  const e = cast.cur; const ta = h('textarea', { class: 'inp', placeholder: 'شنوّة يقول؟' }); const msg = h('p', { class: 'muted' }, 'الكلام يبان في فقاعة فوق راسو و يتسجّل في الفيديو.');
  const quick = h('div', { class: 'chips', style: 'margin:8px 0' }, ['عسلامة يا جماعة! 👋', 'شنيّا الأحوال؟', 'صوّرني مليح!', 'هيا نلعبو كورة ⚽'].map(q => h('button', { class: 'chip', onclick: () => ta.value = q }, q)));
  const aiB = h('button', { class: 'btn ghost', onclick: async () => { aiB.disabled = true; aiB.innerHTML = '<span class="spin"></span>'; try { ta.value = (await aiText(`Character: ${describeChar(e.state)}. Place: ${mapName()}. Write ONE short funny line (max 14 words) this character would say, in Tunisian Darija (Arabic script). Only the line.`)).trim().replace(/^["«]|["»]$/g, ''); } catch (err) { msg.textContent = aiErr(err); } aiB.disabled = false; aiB.textContent = '✨ IA تكتب'; } }, '✨ IA تكتب');
  const dlg = cast.list.length > 1 ? h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: async () => { dlg.disabled = true; dlg.innerHTML = '<span class="spin"></span> قاعد نكتب…';
    try { const cs = cast.list.map((c, i) => ({ id: i, name: c.state.name || bodyDef(c.state.body).label })); const res = await aiJSON(`Characters: ${JSON.stringify(cs)}. Place: ${mapName()}.${ta.value ? ' Topic: ' + ta.value : ''} Write a short funny dialogue (4-6 lines) in Tunisian Darija (Arabic script) for a YouTube Short. Each line max 14 words. JSON: {"lines":[{"who":id,"text":"..."}]}`);
      closeLayer(); cast.lineUp(false); for (const ln of (res.lines || []).slice(0, 8)) { const c = cast.list[ln.who]; if (c) { await talk(c, ln.text); await new Promise(r => setTimeout(r, 250)); } } }
    catch (err) { msg.textContent = aiErr(err); dlg.disabled = false; dlg.textContent = '💬 حوار بيناتهم (IA)'; } } }, '💬 حوار بيناتهم (IA)') : null;
  sheet('🗣️ خلّي ' + (e.state.name || 'الشخصية') + ' يحكي', h('div', {}, ta, quick, h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: () => { closeLayer(); talk(e, ta.value.trim()); } }, '🔊 احكي'), aiB), dlg, msg));
}
const mapName = () => (MAPLIST.find(m => m[0] === E.worlds.mapId) || [, , ''])[2] + (E.worlds.night ? ' (ليل)' : '');

/* ---------- AI description ---------- */
function colorName(hex) { if (!hex) return ''; const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl); const { h: hh, s, l } = hsl;
  if (l < 0.12) return 'black'; if (l > 0.9) return 'white'; if (s < 0.15) return l < 0.5 ? 'dark grey' : 'light grey';
  const names = [[0.03, 'red'], [0.08, 'orange-red'], [0.11, 'orange'], [0.17, 'yellow'], [0.25, 'lime'], [0.42, 'green'], [0.52, 'teal'], [0.6, 'blue'], [0.72, 'indigo'], [0.8, 'purple'], [0.92, 'pink'], [1.01, 'red']];
  const n = names.find(x => hh <= x[0])[1]; return (l < 0.3 ? 'dark ' : l > 0.7 ? 'light ' : '') + n; }
function describeChar(s) {
  const d = bodyDef(s.body); const parts = [d.desc || 'person'];
  for (const t of d.tints) if (s.tints[t.id]) parts.push(`${t.id === 'skin' ? 'skin tone' : t.id === 'all' ? 'outfit colors tinted' : t.id} ${colorName(s.tints[t.id])}`);
  for (const t of d.toggles || []) if (s.toggles[t.id] === false) parts.push('no ' + t.id);
  const a = s.acc; if (a.hat === 'chechia') parts.push(`wearing a ${colorName(a.hatColor)} Tunisian chechia hat`); if (a.hat === 'cap') parts.push(`wearing a ${colorName(a.hatColor)} baseball cap`); if (a.hat === 'beanie') parts.push(`wearing a ${colorName(a.hatColor)} beanie`);
  if (a.mask !== 'none') parts.push(`${colorName(a.maskColor)} cloth face mask covering nose and mouth`); if (a.glasses !== 'none') parts.push(a.glasses === 'sun' ? 'dark sunglasses' : a.glasses + ' glasses');
  if (s.showBack) parts.push(`shirt with number ${s.number}${s.backName ? ' and the name "' + s.backName + '"' : ''} printed on the back`);
  if (s.height > 1.05) parts.push('tall'); if (s.height < 0.94) parts.push('short'); if (s.width > 1.15) parts.push('heavy build'); if (s.width < 0.94) parts.push('slim build');
  let out = parts.join(', '); if (s.aiDesc) out += `. Extra details from the user (follow them, they override the above): ${s.aiDesc}`; return out;
}

/* ---------- STUDIO (AI photos) ---------- */
const PLACES = [['paris', '🗼 باريس', 'Paris, France: elegant street with Haussmann buildings, cafe terrace, the Eiffel Tower in the background'],
  ['london', '🎡 لندن', 'London, UK: street near Big Ben and Westminster, red double-decker bus, red phone booth, soft overcast light'],
  ['newyork', '🗽 نيويورك', 'Times Square, New York at night: giant glowing billboards, yellow taxis, skyscrapers'],
  ['ibiza', '🏝️ إيبيزا', 'Ibiza beach club at sunset: infinity pool, white villa, palm trees, DJ booth, party lights, turquoise sea'],
  ['tunis', '🕰️ تونس', 'Avenue Habib Bourguiba in Tunis: the clock tower, the cathedral, ficus trees, colonial white buildings with blue shutters, Tunisian flags'],
  ['dubai', '🏙️ دبي', 'Dubai downtown at golden hour: Burj Khalifa, luxury supercars, fountain lake, palm trees'],
  ['studio', '📸 لوبي', 'premium game lobby studio, dark purple backdrop with bokeh lights, glowing golden circular platform, dramatic rim lights'],
  ['neon', '🌃 نيون', 'futuristic neon city street at night, wet reflective asphalt, pink and cyan neon signs with Arabic and Latin letters, a sports motorbike with neon underglow, falling sparks'],
  ['stade', '🏟️ ملعب', 'packed football stadium at night in Tunisia, crowd in red and yellow waving flags, red flares and smoke, bright floodlights, live broadcast feel'],
  ['sidi', '🏘️ سيدي بوسعيد', 'Sidi Bou Said in Tunisia, white houses with blue doors and windows, bougainvillea, sunny Mediterranean light'],
  ['plage', '🏖️ بحر', 'Mediterranean beach in Tunisia at golden hour, turquoise sea, umbrellas'], ['souk', '🛍️ سوق', 'old Tunisian medina souk, lanterns, carpets and spices, warm light'], ['custom', '✍️ وحدي', '']];
const STYLES = [['game', '🎮 لعبة', 'high-end battle royale mobile game character render, stylized realistic 3D, glossy materials, dramatic lighting, lobby poster quality'],
  ['photo', '📷 واقعي', 'ultra realistic photograph, 50mm lens, natural skin texture, cinematic lighting, high detail'],
  ['cine', '🎬 سينما', 'cinematic movie still, anamorphic lens, film grain, moody color grading'], ['poster', '🔥 بوستر', 'epic promotional poster, bold composition, particles, glow and smoke']];
const ASPECTS = [['9:16', 'ستوري 9:16'], ['1:1', 'مربّع'], ['16:9', 'عريض 16:9'], ['3:4', '3:4']];
let studio = LS.get('studio', { picks: [], place: 'paris', custom: '', style: 'game', aspect: '9:16', scene: '', use3d: true, last: null });
const saveStudio = () => LS.set('studio', { ...studio, last: null });
function renderStudio() {
  const S = $('#s-studio'); S.innerHTML = ''; const pad = h('div', { class: 'pad' });
  if (!studio.picks.length || !studio.picks.every(id => chars.find(c => c.id === id))) studio.picks = [activeId];
  pad.append(h('div', { class: 'between', style: 'margin-bottom:10px' }, h('button', { class: 'icon-btn', html: ICON.back, onclick: () => go('home') }), h('div', { class: 'logo' }, 'MKACHKHA', h('b', {}, 'FF')), h('button', { class: 'icon-btn', html: ICON.gear, onclick: openSettings })));
  pad.append(h('div', { class: 'st-hero' }, h('h2', {}, '✨ ستوديو التصاور الواقعية'), h('div', { class: 'muted' }, 'اختار الشخصيات و البلاصة و الستيل، و الـ IA (Gemini) تعملك تصويرة كيف الألعاب و الأفيشات.')));
  if (!geminiKey()) pad.append(h('div', { class: 'card', style: 'margin-top:12px;border-color:#ffc83d55' }, h('b', {}, '🔑 لازمك مفتاح Gemini'), h('p', { class: 'muted' }, 'خوذو بلاش من aistudio.google.com/apikey و حطّو في الإعدادات. (تصاور Gemini تنجم تطلب تفعيل الـ billing.)'), h('button', { class: 'btn', onclick: openSettings }, 'حطّ المفتاح')));
  pad.append(h('div', { class: 'h2' }, '1. شكون في التصويرة؟', h('small', {}, 'حتى 4')));
  const pick = h('div', { class: 'pick' });
  chars.forEach(c => { const en = entryOf(c); const on = studio.picks.includes(c.id);
    pick.append(h('div', { class: 'av' + (on ? ' on' : ''), onclick: () => { if (on) studio.picks = studio.picks.filter(x => x !== c.id); else if (studio.picks.length < 4) studio.picks.push(c.id); saveStudio(); renderStudio(); } }, h('div', { class: 'ph' }, en?.thumbHead ? h('img', { src: en.thumbHead }) : '👤'), h('small', {}, c.name || bodyDef(c.body).label))); });
  pad.append(pick);
  pad.append(h('div', { class: 'h2' }, '2. وين؟'), chipRow(PLACES.map(p => [p[0], p[1]]), studio.place, v => { studio.place = v; saveStudio(); renderStudio(); }));
  if (studio.place === 'custom') pad.append(h('input', { class: 'inp', style: 'margin-top:8px', placeholder: 'وصف البلاصة…', value: studio.custom, oninput: ev => { studio.custom = ev.target.value; saveStudio(); } }));
  pad.append(h('div', { class: 'h2' }, '3. شنوّة يعملو؟'), h('textarea', { class: 'inp', placeholder: 'مثال: واقفين جنب بعضهم، واحد مكتّف و الآخر يدّو على كتف صاحبو، يخزرو للكاميرا', oninput: ev => { studio.scene = ev.target.value; saveStudio(); } }, studio.scene || ''));
  pad.append(h('div', { class: 'toggle' }, h('div', {}, h('b', {}, '🧍 خوذ البوز و الكادر من العالم 3D'), h('div', { class: 'muted' }, 'يستعمل آخر كادر في العالم كمرجع')), h('button', { class: 'switch' + (studio.use3d ? ' on' : ''), onclick: ev => { studio.use3d = !studio.use3d; ev.target.classList.toggle('on'); saveStudio(); } })));
  pad.append(h('div', { class: 'h2' }, '4. الستيل'), chipRow(STYLES.map(s => [s[0], s[1]]), studio.style, v => { studio.style = v; saveStudio(); }));
  pad.append(h('div', { style: 'height:8px' }), chipRow(ASPECTS, studio.aspect, v => { studio.aspect = v; saveStudio(); }));
  const out = h('div', { id: 'stOut' });
  const gen = h('button', { class: 'btn block', style: 'margin-top:16px;padding:14px;font-size:16px', onclick: () => generate(out, gen) }, '✨ اعمل التصويرة');
  pad.append(gen, out);
  if (studio.last) showResult(out, studio.last);
  S.append(pad);
}
function buildPrompt(edit) {
  const sel = studio.picks.map(id => chars.find(c => c.id === id)).filter(Boolean);
  const place = studio.place === 'custom' ? studio.custom : PLACES.find(p => p[0] === studio.place)[2];
  const style = STYLES.find(s => s[0] === studio.style)[2];
  let p = `Create ONE high quality image. Style: ${style}.\nSetting: ${place || 'stylish location'}.\n`;
  p += `Characters (${sel.length}):\n` + sel.map((c, i) => `${i + 1}) "${c.name || 'character ' + (i + 1)}": ${describeChar(c)}`).join('\n') + '\n';
  if (studio.scene) p += `Action / pose (user request, may be in Tunisian Arabic): ${studio.scene}\n`;
  p += 'Make every character look like a real premium game hero: detailed clothes and fabric, natural proportions, expressive confident poses, sharp focus, beautiful lighting. No watermark, no UI, no brand logos.';
  return { p, sel };
}
async function generate(out, btn) {
  const { p, sel } = buildPrompt(); if (!sel.length) return toast('اختار شخصية على الأقل');
  btn.disabled = true; out.innerHTML = ''; out.append(h('div', { class: 'genbox' }, h('div', { class: 'orb' }), h('b', {}, 'الـ IA قاعدة ترسم…'), h('small', {}, 'تاخو بين 10 و 40 ثانية')));
  try {
    const images = []; let prompt = p;
    if (studio.use3d && cast) { const prev = screen; E.setRunning(true); const c = grab(false); const small = document.createElement('canvas'); const k = Math.min(1, 1024 / Math.max(c.width, c.height)); small.width = c.width * k; small.height = c.height * k; small.getContext('2d').drawImage(c, 0, 0, small.width, small.height); E.setRunning(prev === 'chars' || prev === 'world');
      images.push({ mime: 'image/jpeg', data: small.toDataURL('image/jpeg', 0.85).split(',')[1] }); prompt += '\nThe FIRST attached image is a rough 3D layout: copy the camera angle, positions and body poses of the characters from it, but re-create everything with the requested style (do not keep the low-detail 3D look).'; }
    sel.forEach((c, i) => (c.refs || []).forEach(r => { images.push({ mime: 'image/jpeg', data: r.split(',')[1] }); prompt += `\nAn attached photo is a face reference for character ${i + 1} ("${c.name}"): keep that person's facial identity.`; }));
    const url = await aiImage({ prompt, images, aspect: studio.aspect });
    const m = await media.add({ type: 'ai', src: url, prompt: p }); studio.last = m; showResult(out, m);
  } catch (e) { console.error(e); out.innerHTML = ''; out.append(h('div', { class: 'card', style: 'margin-top:12px;border-color:#ff3d5555' }, '😕 ' + aiErr(e))); }
  btn.disabled = false;
}
function showResult(out, m) {
  out.innerHTML = ''; const editIn = h('input', { class: 'inp', placeholder: 'تعديل: مثال «ردّ الليل و زيد دخان أحمر»' });
  const editB = h('button', { class: 'btn ghost', onclick: async () => { if (!editIn.value.trim()) return; editB.disabled = true; editB.innerHTML = '<span class="spin"></span>';
    try { const url = await aiImage({ prompt: `Edit this image: ${editIn.value}. Keep the same characters, faces and composition unless asked otherwise. No watermark.`, images: [{ mime: m.src.slice(5, m.src.indexOf(';')), data: m.src.split(',')[1] }], aspect: studio.aspect });
      const nm = await media.add({ type: 'ai', src: url, prompt: editIn.value }); studio.last = nm; showResult(out, nm); } catch (e) { toast(aiErr(e), 4000); editB.disabled = false; editB.textContent = '✏️ عدّل'; } } }, '✏️ عدّل');
  out.append(h('div', { class: 'result' }, h('img', { src: m.src, onclick: () => viewMedia(m) })),
    h('div', { class: 'grid2', style: 'margin-top:10px' }, h('button', { class: 'btn', onclick: () => saveMedia(m) }, '⬇️ سجّل'), h('button', { class: 'btn ghost', onclick: () => saveMedia(m, true) }, '📤 بارتاجي')),
    h('div', { class: 'row', style: 'margin-top:10px' }, editIn, editB));
}

/* ---------- GALLERY ---------- */
let galFilter = 'all';
async function renderGallery() {
  const S = $('#s-gallery'); S.innerHTML = ''; const pad = h('div', { class: 'pad' });
  pad.append(h('div', { class: 'between' }, h('button', { class: 'icon-btn', html: ICON.back, onclick: () => go('home') }), h('h1', { class: 'h1' }, '🖼️ تصاوري'), h('button', { class: 'icon-btn', html: ICON.gear, onclick: openSettings })));
  pad.append(h('div', { style: 'height:10px' }), chipRow([['all', 'الكل'], ['photo', '📸 تصاور'], ['ai', '✨ IA'], ['video', '🎥 فيديو']], galFilter, v => { galFilter = v; renderGallery(); }));
  const all = (await media.all()).filter(m => galFilter === 'all' || m.type === galFilter);
  pad.append(h('div', { style: 'height:12px' }));
  if (!all.length) pad.append(h('div', { class: 'card empty' }, 'ما فما شي هنا. صوّر في العالم ولا اعمل تصويرة بالـ IA ✨'));
  else pad.append(h('div', { class: 'mgrid' }, all.map(m => mediaThumb(m))));
  S.append(pad);
}
function mediaThumb(m) { const el = h('div', { class: 'm', onclick: () => viewMedia(m) });
  if (m.type === 'video') { const v = h('video', { muted: true, playsinline: true, preload: 'metadata' }); v.src = URL.createObjectURL(m.blob); el.append(v, h('i', {}, '🎥')); }
  else el.append(h('img', { src: m.src, loading: 'lazy' }), m.type === 'ai' ? h('i', {}, '✨') : null); return el; }
function viewMedia(m) {
  closeLayer(); const L = $('#layer'); const src = m.type === 'video' ? URL.createObjectURL(m.blob) : m.src;
  const el = m.type === 'video' ? h('video', { src, controls: true, autoplay: true, loop: true, playsinline: true }) : h('img', { src });
  L.append(h('div', { class: 'viewer' }, el, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => saveMedia(m) }, '⬇️ سجّل'), h('button', { class: 'btn ghost', onclick: () => saveMedia(m, true) }, '📤')),
    h('div', { class: 'row' }, m.type !== 'video' ? h('button', { class: 'btn ghost', onclick: () => { studio.last = m; go('studio'); } }, '✨ عدّلها بالـ IA') : null,
      h('button', { class: 'btn ghost', onclick: async () => { await media.del(m.id); closeLayer(); toast('تفسخت'); if (screen === 'gallery') renderGallery(); if (screen === 'home') renderLobby(); } }, '🗑️'),
      h('button', { class: 'btn ghost', onclick: closeLayer }, 'رجوع'))));
}
async function saveMedia(m, share) { const blob = m.type === 'video' ? m.blob : await dataURLtoBlob(m.src); const ext = m.type === 'video' ? m.ext : (m.src.startsWith('data:image/png') ? 'png' : 'jpg'); await saveBlob(blob, `mkachkha_ff_${stamp()}.${ext}`, share); }

/* ---------- SETTINGS ---------- */
function openSettings() {
  const key = h('input', { class: 'inp', type: 'password', placeholder: 'AIza…', value: geminiKey() });
  const box = h('div', {},
    h('label', { class: 'lbl' }, '🔑 مفتاح Gemini API'), key,
    h('p', { class: 'muted' }, 'خوذو من aistudio.google.com/apikey · يتسجّل كان في تليفونك.'),
    h('label', { class: 'lbl' }, '🖼️ موديل التصاور'), chipRow(IMAGE_MODELS, LS.get('imgModel', IMAGE_MODELS[0][0]), v => LS.set('imgModel', v)),
    h('label', { class: 'lbl' }, '⚡ جودة الـ 3D (تتطبّق كي تعاود تحلّ)'), chipRow([['low', 'خفيفة'], ['mid', 'متوسّطة'], ['high', 'عالية']], LS.get('quality', 'high'), v => { LS.set('quality', v); toast('سكّر و حلّ الأبليكاسيون من جديد'); }),
    h('button', { class: 'btn block', style: 'margin-top:16px', onclick: () => { LS.set('gemini', key.value.trim()); closeLayer(); toast('تسجّل ✅'); if (screen === 'studio') renderStudio(); } }, '💾 سجّل'),
    h('div', { class: 'h2' }, 'تواصل معانا'), h('div', { class: 'contact' }, CONTACT.map(([l, u]) => h('a', { href: u, onclick: ev => { ev.preventDefault(); openLink(u); } }, l))),
    h('p', { class: 'muted', style: 'margin-top:14px' }, 'الموديلات 3D: Mixamo / Ready Player Me (أمثلة three.js). الحركات: Mixamo.'));
  sheet('⚙️ الإعدادات', box);
}

boot();
