// Storage, native bridge, AI (Gemini + Claude), helpers
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const h = (tag, attrs = {}, ...kids) => { const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'html') el.innerHTML = v; else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k)); return el; };
export function toast(msg, ms = 2000) { let t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- local settings ---------- */
const LS = { get(k, d) { try { const v = localStorage.getItem('mkff4.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mkff4.' + k, JSON.stringify(v)); } catch (e) {} } };
export { LS };

/* ---------- IndexedDB (gallery + custom models) ---------- */
let dbP = null;
function db() { return dbP ||= new Promise((ok, ko) => { const r = indexedDB.open('mkachkha-ff', 1);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('media', { keyPath: 'id' }); d.createObjectStore('models', { keyPath: 'id' }); };
  r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
async function tx(store, mode, fn) { const d = await db(); return new Promise((ok, ko) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const res = fn(s); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res); t.onerror = () => ko(t.error); }); }
export const media = {
  async add(item) { item.id ||= uid(); item.t ||= Date.now(); await tx('media', 'readwrite', s => s.put(item)); return item; },
  async all() { const d = await db(); return new Promise(ok => { const out = []; const c = d.transaction('media').objectStore('media').openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else ok(out.sort((a, b) => b.t - a.t)); }; c.onerror = () => ok([]); }); },
  async del(id) { await tx('media', 'readwrite', s => s.delete(id)); },
};
export const models = {
  async add(item) { item.id ||= uid(); await tx('models', 'readwrite', s => s.put(item)); return item; },
  async all() { const d = await db(); return new Promise(ok => { const out = []; const c = d.transaction('models').objectStore('models').openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else ok(out); }; c.onerror = () => ok([]); }); },
  async del(id) { await tx('models', 'readwrite', s => s.delete(id)); },
};

/* ---------- native / platform ---------- */
export const CAP = window.Capacitor, isNative = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const claudeUse = n => (window.claude && window.claude.use) ? window.claude.use(n).catch(() => null) : Promise.resolve(null);
let _dl, _sm, _tts; const getDL = () => _dl ||= claudeUse('downloads'), getSample = () => _sm ||= claudeUse('sample'), getTTS = () => _tts ||= claudeUse('tts');
export const blobToB64 = b => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = ko; r.readAsDataURL(b); });
export const dataURLtoBlob = async u => (await fetch(u)).blob();
export async function saveBlob(blob, name, share = false) {
  if (isNative) { try { const FS = CAP.Plugins.Filesystem, SH = CAP.Plugins.Share; const data = await blobToB64(blob); let uri;
      try { const w = await FS.writeFile({ path: 'MKACHKHA_FF/' + name, data, directory: 'DOCUMENTS', recursive: true }); uri = w.uri; if (!share) toast('تسجّلت في Documents/MKACHKHA_FF ✅'); }
      catch (e) { const w = await FS.writeFile({ path: name, data, directory: 'CACHE' }); uri = w.uri; share = true; }
      if (share && SH) await SH.share({ title: 'MKACHKHA FF', files: [uri] }).catch(() => {}); } catch (e) { toast('ما تسجّلتش'); } return; }
  const dl = await getDL(); if (dl) { try { await dl.save({ filename: name, data: blob }); toast('تسجّلت ✅'); } catch (e) { toast('ما تسجّلتش'); } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function stamp() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
export function openLink(url) { if (isNative && CAP.Plugins.Browser) CAP.Plugins.Browser.open({ url }); else window.open(url, '_blank'); }

/* ---------- TTS ---------- */
export async function speak(text, voice = {}) {
  const ar = /[؀-ۿ]/.test(text), pitch = voice.pitch ?? 1, rate = voice.rate ?? 1;
  try {
    if (isNative && CAP.Plugins.TextToSpeech) { await CAP.Plugins.TextToSpeech.speak({ text, lang: ar ? 'ar-SA' : 'fr-FR', rate, pitch, volume: 1, category: 'ambient' }); return; }
    const T = await getTTS(); if (T) { await T.speak(text, { voice: pitch > 1.15 ? 'airy' : pitch < 0.85 ? 'rounded' : 'buttery', rate: Math.max(0.7, Math.min(1.5, rate)), ...(ar ? { language: 'ar' } : {}) }); return; }
    if (window.speechSynthesis) await new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.lang = ar ? 'ar-SA' : 'fr-FR'; u.pitch = pitch; u.rate = rate;
      const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(ar ? 'ar' : 'fr')); if (v) u.voice = v; u.onend = res; u.onerror = res; setTimeout(res, 1500 + text.length * 120); speechSynthesis.speak(u); });
  } catch (e) { await new Promise(r => setTimeout(r, 800 + text.length * 50)); }
}

/* ---------- AI ---------- */
export const IMAGE_MODELS = [['gemini-3.1-flash-image', 'Nano Banana 2 (سريع)'], ['gemini-3-pro-image', 'Nano Banana Pro (أعلى جودة)'], ['gemini-2.5-flash-image', 'Nano Banana 1']];
export const geminiKey = () => LS.get('gemini', '');
export async function hasAI() { return !!(await getSample()) || !!geminiKey(); }
async function gemini(model, parts, cfg) {
  const k = geminiKey(); if (!k) throw { code: 'nokey' };
  let r; try { r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': k }, body: JSON.stringify({ contents: [{ role: 'user', parts }], ...(cfg ? { generationConfig: cfg } : {}) }) }); }
  catch (e) { throw { code: 'net' }; }
  if (!r.ok) { let msg = ''; try { msg = (await r.json()).error?.message || ''; } catch (e) {} throw { code: 'http', status: r.status, msg }; }
  return r.json();
}
export async function aiText(prompt, onText) {
  const sm = await getSample();
  if (sm) { const r = await sm(prompt, { modelTier: 'default', onText: onText ? ({ text }) => onText(text) : undefined }); return r.text || ''; }
  const j = await gemini('gemini-flash-latest', [{ text: prompt }]); const t = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(''); onText && onText(t); return t;
}
export async function aiJSON(prompt) { const t = await aiText(prompt + '\nReturn ONLY JSON, no markdown.'); const m = t.match(/\{[\s\S]*\}/); if (!m) throw { code: 'parse' }; return JSON.parse(m[0]); }
export async function aiImage({ prompt, images = [], aspect = '9:16', model }) {
  const parts = [{ text: prompt }, ...images.map(im => ({ inlineData: { mimeType: im.mime || 'image/jpeg', data: im.data } }))];
  const cfg = { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: aspect } };
  let j; try { j = await gemini(model || LS.get('imgModel', IMAGE_MODELS[0][0]), parts, cfg); }
  catch (e) { if (e.code === 'http' && e.status === 400 && /imageConfig|aspect/i.test(e.msg || '')) j = await gemini(model || LS.get('imgModel', IMAGE_MODELS[0][0]), parts, { responseModalities: ['IMAGE', 'TEXT'] }); else throw e; }
  const ps = j.candidates?.[0]?.content?.parts || []; const im = ps.find(p => p.inlineData || p.inline_data);
  if (!im) { const txt = ps.map(p => p.text || '').join(' ').trim(); throw { code: 'noimage', msg: txt || j.promptFeedback?.blockReason || '' }; }
  const d = im.inlineData || im.inline_data; return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
}
export function aiErr(e) {
  if (!e) return 'صار مشكل';
  if (e.code === 'nokey') return 'لازم تحط مفتاح Gemini في ⚙️ الإعدادات.';
  if (e.code === 'net') return 'ما فماش انترنت ولا الطلب تسكّر هنا (في المعاينة متاع claude.ai التصاور بالـ IA ما يخدموش، يخدمو في الأبليكاسيون).';
  if (e.code === 'http') { if (e.status === 429) return 'كمّلت الكوطا متاع Gemini، استنّى شوية ولا ثبّت في الـ billing.'; if (e.status === 403 || e.status === 401) return 'المفتاح غالط ولا ما عندوش صلاحية.'; if (e.status === 404) return 'الموديل هذا موش متوفّر لمفتاحك، بدّل الموديل من الإعدادات.'; return 'Gemini رجّع غلطة ' + e.status + (e.msg ? ': ' + e.msg.slice(0, 140) : ''); }
  if (e.code === 'noimage') return 'Gemini ما رجّعش تصويرة' + (e.msg ? ': ' + e.msg.slice(0, 160) : '.');
  if (e.code === 'not_granted') return 'ما عطيتش الإذن للـ IA.';
  return 'صار مشكل، عاود جرّب.';
}
