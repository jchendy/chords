// Favourites: a star on the things you would want to come back to — a card
// on a deep dive, the Jam tab as it is set (its key, chords, feel, part and
// tempo), a drill as it is set — and a page listing them. A favourite is
// what it names and a link that reopens it: a card by its id on its page,
// the Jam and Drills tabs by the state they already write into the address
// bar, so the link is the same one Copy link gives. The list lives in this
// browser's localStorage (`gt.favourites`); keeping it across devices is
// T75. Nothing here plays or renders a card — the pages do that.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const KEY = 'gt.favourites';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const KINDS = { dive: 'Deep dives', jam: 'Jam', drills: 'Drills' };
  const listeners = [];

  let cache = null, clock = 0;
  // two favourites added in one millisecond still have an order
  const now = () => { clock = Math.max(Date.now(), clock + 1); return clock; };
  const reload = () => { cache = null; return load(); };
  function load(){
    if (cache) return cache;
    try {
      const kept = JSON.parse(localStorage.getItem(KEY) || 'null');
      cache = Array.isArray(kept) ? kept.filter(f => f && f.id && f.href) : [];
    } catch (e) { cache = []; }
    return cache;
  }
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(cache || [])); } catch (e) { /* no storage */ }
    listeners.forEach(fn => { try { fn(list()); } catch (e) { /* a listener's own problem */ } });
  }
  // newest first
  const list = () => load().slice().sort((a, b) => (b.added || 0) - (a.added || 0));
  const has = id => load().some(f => f.id === id);
  const get = id => load().find(f => f.id === id) || null;
  function add(fav){
    if (!fav || !fav.id || !fav.href) return null;
    load();
    const entry = { id: String(fav.id), kind: KINDS[fav.kind] ? fav.kind : 'jam', title: String(fav.title || fav.id), sub: String(fav.sub || ''), href: String(fav.href), added: now() };
    const i = cache.findIndex(f => f.id === entry.id);
    if (i >= 0) cache[i] = { ...entry, added: cache[i].added };    // the same thing starred again keeps its place in time
    else cache.push(entry);
    save();
    return entry;
  }
  function remove(id){
    load();
    const before = cache.length;
    cache = cache.filter(f => f.id !== id);
    if (cache.length !== before) save();
    return cache.length !== before;
  }
  // star or unstar; says which it is now
  function toggle(fav){
    if (has(fav.id)){ remove(fav.id); return false; }
    add(fav);
    return true;
  }
  function clear(){ cache = []; save(); }
  const onChange = fn => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };
  // forget the cache when another tab changed the list
  window.addEventListener('storage', e => { if (e.key === KEY){ reload(); listeners.forEach(fn => { try { fn(list()); } catch (x) { /* theirs */ } }); } });

  // ---- a star button: the one look everywhere ----
  // `descriptor()` gives the favourite as it would be added now (the Jam
  // tab's changes as you go); the button reads the list on each refresh.
  function star(btn, descriptor, { onToggle } = {}){
    const paint = () => {
      const d = descriptor();
      const on = !!(d && has(d.id));
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '★' + (btn.dataset.label ? ' ' + btn.dataset.label : '') : '☆' + (btn.dataset.label ? ' ' + btn.dataset.label : '');
      btn.title = on ? 'In your favourites — click to take it out' : 'Keep this in your favourites';
    };
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const d = descriptor();
      if (!d) return;
      const on = toggle(d);
      paint();
      if (onToggle) onToggle(on, d);
    });
    paint();
    btn._paintStar = paint;
    return paint;
  }

  // ---- the page of favourites ----
  const when = ts => { try { return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  function renderPage(host){
    host = host || document.getElementById('favouritesList');
    if (!host) return;
    const favs = list();
    if (!favs.length){
      host.innerHTML = `<p class="favs-empty">Nothing starred yet. The <b>☆</b> on any card of the <a href="hendrix.html">Hendrix</a> and <a href="psychobilly.html">psychobilly</a> pages, in the Jam tab's Share row and in the Drills toolbar keeps it here, with a link that reopens it as it was.</p>`;
      return;
    }
    const groups = Object.keys(KINDS).map(kind => [kind, favs.filter(f => f.kind === kind)]).filter(([, fs]) => fs.length);
    host.innerHTML = groups.map(([kind, fs]) => `
      <section class="favs-group">
        <h3>${KINDS[kind]} <span class="favs-count">${fs.length}</span></h3>
        <ul class="favs">${fs.map(f => `
          <li class="fav" data-id="${esc(f.id)}">
            <a class="fav-main" href="${esc(f.href)}"><span class="fav-title">${esc(f.title)}</span>${f.sub ? `<span class="fav-sub">${esc(f.sub)}</span>` : ''}</a>
            <span class="fav-side"><span class="fav-when">${when(f.added)}</span><a class="btn small" href="${esc(f.href)}">Open →</a><button type="button" class="fav-remove" title="Take it out of your favourites" aria-label="Remove ${esc(f.title)}">✕</button></span>
          </li>`).join('')}</ul>
      </section>`).join('') + `<p class="favs-foot">${favs.length} ${favs.length === 1 ? 'favourite' : 'favourites'}, kept in this browser. <button type="button" class="linklike" id="favsClear">Clear them all</button></p>`;
    host.querySelectorAll('.fav-remove').forEach(b => b.addEventListener('click', () => { remove(b.closest('.fav').dataset.id); renderPage(host); }));
    const clearBtn = host.querySelector('#favsClear');
    if (clearBtn) clearBtn.addEventListener('click', () => { if (confirm('Forget every favourite?')){ clear(); renderPage(host); } });
  }

  // a way to the page from the pages that are not the app's tabs (the deep dives)
  function linkFromPage(){
    const top = document.querySelector('.top');
    if (!top || document.getElementById('siteTabs') || top.querySelector('.favs-link')) return;
    const a = document.createElement('a');
    a.className = 'favs-link';
    a.href = 'index.html#favourites';
    a.title = 'Your favourites';
    a.textContent = '★';
    top.appendChild(a);
  }

  GT.favourites = { KEY, KINDS, list, has, get, add, remove, toggle, clear, reload, onChange, star, renderPage, linkFromPage };
})();
