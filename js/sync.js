// Sync across devices (T75). Everything the site remembers lives in this
// browser's localStorage: the favourites (gt.favourites), each course's
// progress (gt.<dive>Course) and the preferences (every other gt.* key —
// the neck, fingering, count-in and contents choices on the dive pages,
// the tab rows, the recent styles). With sync on, the same things are
// kept as one small document in Firestore under the signed-in person's
// own id, and merged on every page load and on every change: what was
// done on any device is done on all of them.
//
// The merge is per item, by time. A favourite starred on one device and
// removed on another is whichever happened last; a piece marked complete
// here and un-marked there likewise; a preference is its newest value;
// a course's ticks and place are the newer side's. Nothing is ever lost
// to a race, and a page that cannot reach the cloud goes on from what it
// has. The bookkeeping that makes this possible — when a favourite was
// removed, when a piece was un-marked, when a preference last changed —
// is kept in gt.sync.meta, written by watching localStorage itself, so
// the other modules did not have to change.
//
// The backend is Firebase (Authentication with Google sign-in, Firestore),
// loaded only when sync is on and only over http(s): a page opened from
// disk, or a copy of the site with no `GT_FIREBASE` config, is the site as
// it was. Tests attach a backend of their own through `attach()`.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const META_KEY = 'gt.sync.meta', ON_KEY = 'gt.sync.on';
  const COURSE_RE = /^gt\.([a-z0-9]+)Course$/i;
  const FAV_KEY = 'gt.favourites';
  const CDN = 'https://www.gstatic.com/firebasejs/11.6.1/';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // ---- what is kept, and when it changed ----
  const isSyncKey = k => (k.startsWith('gt.') || k.startsWith('gt-')) && k !== META_KEY && k !== ON_KEY && !/^gt\.sync\./.test(k);
  const kind = k => k === FAV_KEY ? 'favourites' : COURSE_RE.test(k) ? 'course' : 'pref';
  const readJSON = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fallback : v; } catch (e) { return fallback; } };
  let meta = null;
  const loadMeta = () => { if (!meta) meta = readJSON(META_KEY, { favRemoved: {}, courseUndone: {}, prefsAt: {}, lastSync: 0, device: '' }); if (!meta.device) meta.device = Math.random().toString(36).slice(2, 10); return meta; };
  const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(loadMeta())); } catch (e) { /* no storage */ } };
  let clock = 0;
  const now = () => { clock = Math.max(Date.now(), clock + 1); return clock; };

  // the last state of each key, so a write can be read as a change
  const shadow = new Map();
  const snapshotKeys = () => { const keys = []; try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (isSyncKey(k)) keys.push(k); } } catch (e) { /* no storage */ } return keys; };
  function remember(k){ try { shadow.set(k, localStorage.getItem(k)); } catch (e) { /* no storage */ } }
  // a write to a synced key: tombstones for what went away, a time for a preference
  function noteWrite(k, value){
    if (!isSyncKey(k)) return;
    const m = loadMeta();
    const before = shadow.get(k);
    if (kind(k) === 'favourites'){
      const was = safeList(before), is = safeList(value);
      const isIds = new Set(is.map(f => f.id));
      was.forEach(f => { if (!isIds.has(f.id)) m.favRemoved[f.id] = now(); });
      is.forEach(f => { if (m.favRemoved[f.id] && (f.added || 0) >= m.favRemoved[f.id]) delete m.favRemoved[f.id]; });
    } else if (kind(k) === 'course'){
      const prefix = k.match(COURSE_RE)[1];
      const was = safeObj(before), is = safeObj(value);
      const u = (m.courseUndone[prefix] = m.courseUndone[prefix] || {});
      Object.keys(was.done || {}).forEach(key => { if (!(is.done || {})[key]) u[key] = now(); });
      Object.keys(is.done || {}).forEach(key => { if (u[key] && is.done[key] >= u[key]) delete u[key]; });
    } else {
      m.prefsAt[k] = now();
    }
    shadow.set(k, value);
    saveMeta();
    scheduleUpload();
  }
  const safeList = v => { try { const x = JSON.parse(v || 'null'); return Array.isArray(x) ? x : []; } catch (e) { return []; } };
  const safeObj = v => { try { const x = JSON.parse(v || 'null'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } };
  // the watch: every write to localStorage on this page passes here
  let applying = false;
  const origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(k, v){ origSet.call(this, k, v); if (this === localStorage && !applying) noteWrite(String(k), String(v)); };
  Storage.prototype.removeItem = function(k){ origRemove.call(this, k); if (this === localStorage && !applying && isSyncKey(String(k))) noteWrite(String(k), null); };
  snapshotKeys().forEach(remember);

  // ---- the document: the local state, with its times ----
  function collect(){
    const m = loadMeta();
    const doc = { v: 1, favourites: { items: [], removed: [] }, courses: [], prefs: [], updated: now(), device: m.device };
    doc.favourites.items = safeList(localStorage.getItem(FAV_KEY)).map(f => ({ id: f.id, kind: f.kind, title: f.title, sub: f.sub || '', href: f.href, added: f.added || 0 }));
    doc.favourites.removed = Object.entries(m.favRemoved).map(([id, at]) => ({ id, at }));
    snapshotKeys().forEach(k => {
      if (kind(k) === 'course'){
        const prefix = k.match(COURSE_RE)[1], s = safeObj(localStorage.getItem(k));
        doc.courses.push({ prefix, done: Object.entries(s.done || {}).map(([key, at]) => ({ key, at: Number(at) || 0 })),
                           undone: Object.entries((m.courseUndone || {})[prefix] || {}).map(([key, at]) => ({ key, at })),
                           ticks: Object.entries(s.ticks || {}).map(([key, ticks]) => ({ key, ticks: (ticks || []).map(Boolean) })), last: s.last || null, at: Number(s.updated) || 0 });
      } else if (kind(k) === 'pref'){
        doc.prefs.push({ key: k, value: localStorage.getItem(k), at: m.prefsAt[k] || 0 });
      }
    });
    Object.entries(m.courseUndone || {}).forEach(([prefix, u]) => { if (!doc.courses.some(c => c.prefix === prefix)) doc.courses.push({ prefix, done: [], undone: Object.entries(u).map(([key, at]) => ({ key, at })), ticks: [], last: null, at: 0 }); });
    return doc;
  }
  // The merge, by time, item by item. Pure: a test holds it.
  function merge(a, b){
    a = a || { favourites: { items: [], removed: [] }, courses: [], prefs: [] };
    b = b || { favourites: { items: [], removed: [] }, courses: [], prefs: [] };
    const out = { v: 1, favourites: { items: [], removed: [] }, courses: [], prefs: [], updated: Math.max(a.updated || 0, b.updated || 0) };
    const byId = (list, f) => Object.fromEntries((list || []).map(x => [f(x), x]));
    const fa = byId(a.favourites && a.favourites.items, x => x.id), fb = byId(b.favourites && b.favourites.items, x => x.id);
    const ra = byId(a.favourites && a.favourites.removed, x => x.id), rb = byId(b.favourites && b.favourites.removed, x => x.id);
    new Set([...Object.keys(fa), ...Object.keys(fb), ...Object.keys(ra), ...Object.keys(rb)]).forEach(id => {
      const item = [fa[id], fb[id]].filter(Boolean).sort((x, y) => (y.added || 0) - (x.added || 0))[0];
      const removedAt = Math.max(ra[id] ? ra[id].at : 0, rb[id] ? rb[id].at : 0);
      if (item && (item.added || 0) >= removedAt) out.favourites.items.push(item);
      else if (removedAt) out.favourites.removed.push({ id, at: removedAt });
    });
    const ca = byId(a.courses, c => c.prefix), cb = byId(b.courses, c => c.prefix);
    new Set([...Object.keys(ca), ...Object.keys(cb)]).forEach(prefix => {
      const x = ca[prefix] || { done: [], undone: [], ticks: [], last: null, at: 0 }, y = cb[prefix] || { done: [], undone: [], ticks: [], last: null, at: 0 };
      const dx = byId(x.done, d => d.key), dy = byId(y.done, d => d.key), ux = byId(x.undone, d => d.key), uy = byId(y.undone, d => d.key);
      const c = { prefix, done: [], undone: [], ticks: [], last: null, at: Math.max(x.at || 0, y.at || 0) };
      new Set([...Object.keys(dx), ...Object.keys(dy), ...Object.keys(ux), ...Object.keys(uy)]).forEach(key => {
        const doneAt = Math.max(dx[key] ? dx[key].at : 0, dy[key] ? dy[key].at : 0), undoneAt = Math.max(ux[key] ? ux[key].at : 0, uy[key] ? uy[key].at : 0);
        if (doneAt && doneAt >= undoneAt) c.done.push({ key, at: doneAt }); else if (undoneAt) c.undone.push({ key, at: undoneAt });
      });
      const newer = (x.at || 0) >= (y.at || 0) ? x : y;
      c.ticks = (newer.ticks || []).map(t => ({ key: t.key, ticks: (t.ticks || []).map(Boolean) }));
      c.last = newer.last || null;
      out.courses.push(c);
    });
    const pa = byId(a.prefs, p => p.key), pb = byId(b.prefs, p => p.key);
    new Set([...Object.keys(pa), ...Object.keys(pb)]).forEach(key => {
      const p = [pa[key], pb[key]].filter(Boolean).sort((x, y) => (y.at || 0) - (x.at || 0))[0];
      out.prefs.push({ key, value: p.value, at: p.at || 0 });
    });
    out.favourites.items.sort((x, y) => (x.added || 0) - (y.added || 0));
    return out;
  }
  // the same document in the same order, so two can be compared
  const canon = d => JSON.stringify({
    f: (d.favourites.items || []).map(f => [f.id, f.added, f.title, f.sub, f.href, f.kind]).sort(), r: (d.favourites.removed || []).map(x => [x.id, x.at]).sort(),
    c: (d.courses || []).map(c => [c.prefix, (c.done || []).map(x => [x.key, x.at]).sort(), (c.undone || []).map(x => [x.key, x.at]).sort(), (c.ticks || []).map(t => [t.key, t.ticks]).sort(), c.last, c.at]).sort(),
    p: (d.prefs || []).map(p => [p.key, p.value, p.at]).sort() });
  // a merged document written back into localStorage, and the modules told
  function apply(doc){
    applying = true;
    const m = loadMeta();
    const changed = new Set();
    try {
      const favs = doc.favourites.items.slice().sort((x, y) => (x.added || 0) - (y.added || 0));
      const favText = JSON.stringify(favs);
      if (localStorage.getItem(FAV_KEY) !== favText){ localStorage.setItem(FAV_KEY, favText); changed.add(FAV_KEY); }
      m.favRemoved = Object.fromEntries(doc.favourites.removed.map(x => [x.id, x.at]));
      doc.courses.forEach(c => {
        const k = `gt.${c.prefix}Course`;
        const s = safeObj(localStorage.getItem(k));
        const next = { ...s, v: 1, done: Object.fromEntries(c.done.map(d => [d.key, d.at])), ticks: Object.fromEntries(c.ticks.map(t => [t.key, t.ticks])), last: c.last, updated: c.at || s.updated || 0 };
        const text = JSON.stringify(next);
        if (localStorage.getItem(k) !== text && (c.done.length || c.ticks.length || c.last || s.done)){ localStorage.setItem(k, text); changed.add(k); }
        m.courseUndone[c.prefix] = Object.fromEntries(c.undone.map(u => [u.key, u.at]));
      });
      doc.prefs.forEach(p => {
        if (p.value == null) return;
        if (localStorage.getItem(p.key) !== p.value){ localStorage.setItem(p.key, p.value); changed.add(p.key); }
        m.prefsAt[p.key] = p.at || 0;
      });
      snapshotKeys().forEach(remember);
      saveMeta();
    } finally { applying = false; }
    if (changed.size){
      if (changed.has(FAV_KEY) && GT.favourites && GT.favourites.refresh) GT.favourites.refresh();
      [...changed].filter(k => kind(k) === 'course').forEach(k => { const prefix = k.match(COURSE_RE)[1]; const guide = GT[`${prefix}Guide`]; if (guide && guide.course && guide.course.refresh) guide.course.refresh(); });
    }
    return changed;
  }

  // ---- the backend, and the state of play ----
  let backend = null, user = null, status = { state: 'off', error: '' }, lastRemote = null, unsubscribe = null, uploadTimer = 0, lastSync = 0;
  const listeners = [];
  const emit = () => listeners.forEach(fn => { try { fn(current()); } catch (e) { /* theirs */ } });
  const onStatus = fn => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };
  const config = () => (typeof window.GT_FIREBASE === 'object' && window.GT_FIREBASE && window.GT_FIREBASE.apiKey) ? window.GT_FIREBASE : null;
  const configured = () => !!config();
  const online = () => /^https?:$/.test(location.protocol);
  const available = () => configured() && online();
  const isOn = () => { try { return localStorage.getItem(ON_KEY) === '1'; } catch (e) { return false; } };
  const setOn = v => { try { if (v) localStorage.setItem(ON_KEY, '1'); else localStorage.removeItem(ON_KEY); } catch (e) { /* no storage */ } };
  const current = () => ({ ...status, user, lastSync, configured: configured(), online: online(), available: available(), on: isOn() });
  const setStatus = (state, error = '') => { status = { state, error }; emit(); };

  function loadScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error(`could not load ${src}`));
      document.head.appendChild(s);
    });
  }
  // Firebase, through its compat builds (plain scripts, the `firebase` global)
  async function firebaseBackend(cfg){
    if (!window.firebase){
      await loadScript(CDN + 'firebase-app-compat.js');
      await loadScript(CDN + 'firebase-auth-compat.js');
      await loadScript(CDN + 'firebase-firestore-compat.js');
    }
    const fb = window.firebase;
    const app = fb.apps && fb.apps.length ? fb.app() : fb.initializeApp(cfg);
    const auth = fb.auth(app), db = fb.firestore(app);
    const asUser = u => u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null;
    const docRef = () => db.collection('users').doc(auth.currentUser.uid);
    return {
      name: 'firebase',
      user: () => asUser(auth.currentUser),
      onUser: fn => auth.onAuthStateChanged(u => fn(asUser(u))),
      async signIn(){
        const provider = new fb.auth.GoogleAuthProvider();
        try { await auth.signInWithPopup(provider); }
        catch (e) {
          if (e && /popup-blocked|popup-closed|cancelled-popup/.test(String(e.code))) await auth.signInWithRedirect(provider);
          else throw e;
        }
      },
      signOut: () => auth.signOut(),
      async read(){ const snap = await docRef().get(); return snap.exists ? snap.data() : null; },
      write: doc => docRef().set(doc),
      subscribe: fn => docRef().onSnapshot(snap => fn(snap.exists ? snap.data() : null), err => setStatus('error', String(err && err.message || err))),
      remove: () => docRef().delete(),
      deleteAccount: () => auth.currentUser.delete(),
    };
  }

  // a merge of what is here with what is there, both sides brought up to date
  async function reconcile(remote){
    const local = collect();
    const merged = merge(local, remote);
    apply(merged);
    lastRemote = remote;
    if (!remote || canon(merged) !== canon(remote)){
      const out = { ...merged, updated: now(), device: loadMeta().device };
      await backend.write(out);
      lastRemote = out;
    }
    lastSync = Date.now();
    loadMeta().lastSync = lastSync; saveMeta();
    setStatus('synced');
  }
  async function syncNow(){
    if (!backend || !user) return false;
    setStatus('syncing');
    try { await reconcile(await backend.read()); return true; }
    catch (e) { setStatus('error', String(e && e.message || e)); return false; }
  }
  function scheduleUpload(){
    if (!backend || !user) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(() => { syncNow(); }, 1200);
  }
  function watch(){
    if (unsubscribe) unsubscribe();
    unsubscribe = backend.subscribe(remote => {
      if (!remote || (lastRemote && canon(remote) === canon(lastRemote))) return;
      reconcile(remote).catch(e => setStatus('error', String(e && e.message || e)));
    });
  }
  // the session: a backend attached, the signed-in person watched
  async function attach(b){
    backend = b;
    user = b.user();
    b.onUser(u => {
      const was = user; user = u;
      if (u){ setOn(true); setStatus('syncing'); syncNow().then(() => watch()); }
      else { if (unsubscribe){ unsubscribe(); unsubscribe = null; } lastRemote = null; if (was) setOn(false); setStatus('signed-out'); }
    });
    if (user){ setOn(true); setStatus('syncing'); await syncNow(); watch(); } else setStatus('signed-out');
    return b;
  }
  async function start(){
    if (backend) return backend;
    if (!available()){ setStatus(online() ? 'unconfigured' : 'offline'); return null; }
    setStatus('loading');
    try { return await attach(await firebaseBackend(config())); }
    catch (e) { setStatus('error', String(e && e.message || e)); return null; }
  }
  async function signIn(){
    const b = backend || await start();
    if (!b) return false;
    try { await b.signIn(); return true; } catch (e) { setStatus('error', String(e && e.message || e)); return false; }
  }
  async function signOut(){ if (backend) await backend.signOut(); setOn(false); }
  async function deleteCloudData(){
    if (!backend || !user) return false;
    try {
      if (unsubscribe){ unsubscribe(); unsubscribe = null; }
      await backend.remove();
      try { await backend.deleteAccount(); } catch (e) { await backend.signOut(); }   // a stale session cannot delete the account: signed out instead
      setOn(false);
      setStatus('deleted');
      return true;
    } catch (e) { setStatus('error', String(e && e.message || e)); return false; }
  }

  // ---- the panel: one look on every page that shows it ----
  const when = ts => { try { return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  function panel(host){
    if (!host) return;
    const draw = () => {
      const s = current();
      let body;
      if (!s.configured) body = `<p class="sync-line muted">Sync across devices is not set up on this copy of the site. Your favourites, course progress and settings stay in this browser. <a href="privacy.html">What is stored</a>.</p>`;
      else if (!s.online) body = `<p class="sync-line muted">Sync needs the site served over http; a page opened from disk keeps everything in this browser.</p>`;
      else if (s.user) body = `<p class="sync-line"><b>Synced</b> as ${esc(s.user.name || s.user.email)}${s.user.name ? ` (${esc(s.user.email)})` : ''}${s.state === 'syncing' ? ' · syncing…' : s.lastSync ? ` · last synced ${when(s.lastSync)}` : ''}${s.state === 'error' ? ` · <span class="sync-err">${esc(s.error)}</span>` : ''}</p>
        <p class="sync-btns"><button type="button" class="btn small" id="syncNow">Sync now</button><button type="button" class="btn small" id="syncOut">Sign out</button><button type="button" class="linklike" id="syncDelete">Delete my data from the cloud</button> <a href="privacy.html">What is stored</a></p>`;
      else if (s.state === 'loading') body = `<p class="sync-line muted">Loading sync…</p>`;
      else if (s.state === 'deleted') body = `<p class="sync-line">Your cloud data and account are deleted. What is in this browser stays here. <button type="button" class="btn small" id="syncIn">Sign in with Google</button></p>`;
      else body = `<p class="sync-line">Keep your favourites, course progress and settings on every device you use. <button type="button" class="btn small" id="syncIn">Sign in with Google</button>${s.state === 'error' ? ` <span class="sync-err">${esc(s.error)}</span>` : ''}</p>
        <p class="sync-line muted">Google sends the site your name, email address and picture, which stay with your account; what you have starred and done is one small document only you can read. <a href="privacy.html">What is stored, and how to delete it</a>.</p>`;
      host.innerHTML = `<div class="sync-panel"><p class="kicker">Sync across devices</p>${body}</div>`;
      const on = (id, fn) => { const el = host.querySelector('#' + id); if (el) el.addEventListener('click', fn); };
      on('syncIn', () => signIn());
      on('syncNow', () => syncNow());
      on('syncOut', () => signOut());
      on('syncDelete', () => { if (confirm('Delete your synced data and your account for this site from the cloud? What is in this browser stays here.')) deleteCloudData(); });
    };
    draw();
    onStatus(draw);
  }

  GT.sync = { collect, merge, apply, canon, attach, start, signIn, signOut, syncNow, deleteCloudData, status: current, onStatus, panel, isOn, configured, available, META_KEY, ON_KEY, CDN,
              // for the tests: the bookkeeping as it stands
              meta: () => loadMeta(), resetMeta: () => { meta = null; try { localStorage.removeItem(META_KEY); } catch (e) { /* no storage */ } shadow.clear(); snapshotKeys().forEach(remember); },
              detach: () => { if (unsubscribe){ unsubscribe(); unsubscribe = null; } backend = null; user = null; lastRemote = null; clearTimeout(uploadTimer); setStatus('off'); } };

  // sync that was switched on in this browser starts by itself; anything else waits for the button
  if (isOn() && available()) start();
})();
