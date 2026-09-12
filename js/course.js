// A deep dive as a course. The same page, another way through it: the
// lessons of its Start-here list, each split into pieces small enough to do
// in one sitting — a paragraph to read, a grip or a figure to look at, a
// card to play, the records to hear it in, the faults to watch for, a
// check-yourself list — shown one at a time with the lesson's other pieces
// in a rail beside them. A piece is marked complete and the place kept in
// localStorage, so the dashboard's Continue button, the dive's card on the
// front page and the Start-here list all pick up where you left off.
//
// Nothing here is new content: every piece points at something the page
// already shows (a paragraph, a grip group, a figure, a card, a song, a
// row of the players or the faults, a line of the checklist, the sources),
// and coverage() says whether anything on the page is in no lesson — a
// test holds that nothing is.
//
// The shape of it borrows from the courses people already know: a
// dashboard with a Continue card that names the lesson and the piece
// (Fender Play, Coursera's Resume), lessons as a numbered path with a
// progress ring each (JustinGuitar's modules), the pieces of a lesson
// listed with an icon for their kind and a tick when done (Khan Academy's
// unit pages), a time estimate on every piece (Coursera, edX), one thing
// on the screen at a time with Previous and a single Mark complete and
// continue (Brilliant, Duolingo), a check-yourself list to close a lesson
// (JustinGuitar's practice routine), a lesson-complete screen that names
// the next lesson, and the arrow keys to move.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const startsWith = (text, prefix) => text.replace(/\s+/g, ' ').trim().toLowerCase().startsWith(String(prefix).replace(/\s+/g, ' ').trim().toLowerCase());
  const words = el => (el.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
  const minutesText = m => m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() : `${m} min`;

  // ---- what a card is, by its id: the label it is given and the minutes ----
  const CARD_KINDS = [
    [/^x\d/, 'Exercise', 4], [/^sc\d/, 'Scale drill', 3], [/^c-/, 'The changes', 4],
    [/^r-/, 'Rhythm part', 5], [/^l-/, 'Lead part', 5], [/^m-/, 'Both at once', 5], [/^st\d/, 'Study', 8],
  ];
  const cardKind = id => CARD_KINDS.find(([re]) => re.test(id)) || [null, 'Play', 5];
  // the icons in the rail and the dashboard's piece strips, one a kind
  const ICONS = { read: '¶', text: '¶', grips: '#', figure: '♩', card: '▶', songs: '♪', players: '≡', faults: '!', check: '✓', sources: '§' };

  // The one piece written for the course rather than taken from the page:
  // what the cards' controls do, said once at the start instead of at the
  // head of every section as the page says it.
  const CARDS_GUIDE = `
    <p>Everything you play in this course is a card, and every card works the same way. <b>Play</b> loops it here over the band, and the space bar plays and stops the card on the screen. <b>Neck</b> draws the chord as it is fretted, or the scale under the line, and lights each note as it sounds. <b>Fingering</b> puts a chord diagram over each change of grip. <b>Open in jam</b> or <b>Open in drills</b> puts the same thing on the app's other tabs at the card's own tempo, where you can slow it down, change the key, and roll new fills. <b>Print</b> opens just the tab, for paper; <b>Expand</b> shows the tab and the neck side by side. <b>Count in on Play</b>, in the bar above, gives you a bar before it starts.</p>
    <p>Each card says how hard it is and the tempo to start at — about seven tenths of the record's. A card's tab is one rolled realisation of a part: the same part rolls different fills in Jam, so learn the figure from the card and the fills from the roll. The exercises come before the parts in every lesson; play each until it is clean at the starting tempo, then turn it up, then move on. Click anywhere on a tab to play from there.</p>`;

  function create(config){
    const { dive, prefix, name, lessons } = config;
    const KEY = `gt.${prefix}Course`;
    const $ = id => document.getElementById(id);
    const root = $('course');
    const readView = document.querySelector('.page');
    if (!root || !readView) return null;

    // ---- the state: what is done, the ticks of the check lists, the place kept ----
    const blank = () => ({ done: {}, ticks: {}, last: null });
    let state = blank();
    function load(){
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (s && s.v === 1) return { done: s.done || {}, ticks: s.ticks || {}, last: s.last || null };
      } catch (e){ /* no storage, or nothing kept */ }
      return blank();
    }
    function save(){
      try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ...state, summary: summary(), updated: Date.now() })); } catch (e){ /* no storage */ }
    }
    const keyOf = (lesson, piece) => `${lesson.id}/${piece.key}`;
    const isDone = (lesson, piece) => !!state.done[keyOf(lesson, piece)];
    function setDone(lesson, piece, done){
      const k = keyOf(lesson, piece);
      if (done) state.done[k] = Date.now(); else delete state.done[k];
      if (piece.type === 'check' && done) state.ticks[k] = piece.items.map(() => true);
      if (piece.type === 'check' && !done) delete state.ticks[k];
      save();
    }
    const doneCount = lesson => lesson.pieces.filter(p => isDone(lesson, p)).length;
    const lessonDone = lesson => lesson.pieces.length > 0 && doneCount(lesson) === lesson.pieces.length;

    // ---- the pieces, resolved against the page ----
    // Each entry of a lesson's list names something on the page; here it
    // becomes a piece with a title, a kind, a time and a way to draw itself,
    // and remembers the elements it took so coverage() can count them.
    const q = (sel, all = false) => all ? [...document.querySelectorAll(sel)] : document.querySelector(sel);
    const textOf = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const clone = el => { const c = el.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id')); return c; };
    const paragraphTitle = p => { const b = p.querySelector(':scope > b'); return b ? textOf(b).replace(/[.:]\s*$/, '') : null; };
    function resolve(def, lesson){
      const piece = { def, lesson, note: def.note || '', sources: [] };
      const missing = what => Object.assign(piece, { type: def.type || Object.keys(def)[0], key: `missing-${slug(what)}`, title: `Missing: ${what}`, kicker: 'Missing', minutes: 0, missing: true, render(host){ host.innerHTML = `<p class="missing">This piece points at nothing on the page: ${esc(what)}.</p>`; } });
      if (def.read){
        const p = $(def.read);
        if (!p) return missing(`paragraph #${def.read}`);
        const title = def.title || paragraphTitle(p) || textOf(p).split(/[.!?]/)[0];
        return Object.assign(piece, { type: 'read', key: `read-${def.read}`, title, kicker: 'Read', minutes: Math.max(1, Math.round(words(p) / 170)), sources: [p],
          render(host){ const c = clone(p); const b = c.querySelector(':scope > b'); if (b && !def.title) b.remove(); c.className = 'course-read'; host.appendChild(c); } });
      }
      if (def.text){
        const html = def.text === 'cards' ? CARDS_GUIDE : def.text;
        const title = def.title || (def.text === 'cards' ? 'How the cards work' : 'Read');
        return Object.assign(piece, { type: 'text', key: `text-${slug(title)}`, title, kicker: 'Read', minutes: def.minutes || 2,
          render(host){ host.innerHTML = `<div class="course-read">${html}</div>`; } });
      }
      if (def.grips){
        const group = q('#grips .grip-group', true).find(g => startsWith(textOf(g.querySelector('.grip-core .name')), def.grips));
        if (!group) return missing(`grip group "${def.grips}"`);
        const part = def.part || 'all';
        const coreName = textOf(group.querySelector('.grip-core .name'));
        const title = def.title || (part === 'vars' ? `${coreName}: the variations` : coreName);
        return Object.assign(piece, { type: 'grips', key: `grips-${slug(def.grips)}${part === 'all' ? '' : '-' + part}`, title, kicker: part === 'vars' ? 'Look: the same hand, one finger moved' : 'Look: the grip', minutes: 2, sources: [group],
          render(host){
            const c = clone(group);
            if (part === 'core'){ const v = c.querySelector('.grip-vars'); if (v) v.remove(); c.classList.remove('has-vars'); }
            if (part === 'vars'){ const core = c.querySelector('.grip-core'); if (core) core.remove(); c.classList.remove('has-vars'); }
            host.appendChild(c);
          } });
      }
      if (def.figure){
        const fig = q('#scaleNecks .neck-fig', true).find(f => startsWith(textOf(f.querySelector('h4')), def.figure));
        if (!fig) return missing(`figure "${def.figure}"`);
        return Object.assign(piece, { type: 'figure', key: `fig-${slug(def.figure)}`, title: def.title || textOf(fig.querySelector('h4')), kicker: 'Look: the notes on the neck', minutes: 2, sources: [fig],
          render(host){ const c = clone(fig); c.querySelector('h4').remove(); host.appendChild(c); } });
      }
      if (def.card){
        const ex = dive.exampleById(def.card);
        const art = $(def.card);
        if (!ex || !art) return missing(`card #${def.card}`);
        const [, label, minutes] = cardKind(def.card);
        return Object.assign(piece, { type: 'card', key: `card-${def.card}`, title: def.title || ex.title.replace(/^\d+\.\s*/, ''), kicker: label, minutes: def.minutes || minutes, sources: [art], cardId: def.card,
          render(host){ dive.card(host, { ...ex, id: `${ex.id}-course` }); } });
      }
      if (def.songs){
        const all = q('#songs .song', true);
        const found = def.songs.map(t => all.find(s => startsWith(textOf(s.querySelector('h4')), t)));
        const lost = def.songs.filter((t, i) => !found[i]);
        if (lost.length) return missing(`song${lost.length > 1 ? 's' : ''} "${lost.join('", "')}"`);
        const titles = found.map(s => textOf(s.querySelector('h4')).replace(/\s*\(.*$/, ''));
        return Object.assign(piece, { type: 'songs', key: `songs-${slug(def.songs[0])}`, title: def.title || `Hear it: ${titles.join(', ')}`, kicker: 'The records', minutes: def.minutes || 2 * found.length, sources: found,
          render(host){ const box = document.createElement('div'); box.className = 'course-songs'; found.forEach(s => box.appendChild(clone(s))); host.appendChild(box); } });
      }
      if (def.players){
        // the wave is written once, on its first row; the rows under it are its
        const table = q('#players table');
        const rows = []; let wave = '', waveOf = '';
        (table ? [...table.querySelectorAll('tbody tr')] : []).forEach(r => { const w = textOf(r.cells[0]); if (w) wave = w; if (startsWith(wave, def.players)){ rows.push(r); waveOf = wave; } });
        if (!rows.length) return missing(`players "${def.players}"`);
        return Object.assign(piece, { type: 'players', key: `players-${slug(def.players)}`, title: def.title || `The players: ${waveOf.replace(/,.*$/, '').toLowerCase()}`, kicker: 'Who played it', minutes: def.minutes || 3, sources: rows,
          render(host){
            const t = document.createElement('table'); t.className = table.className;
            t.appendChild(clone(table.querySelector('thead')));
            const body = document.createElement('tbody'); rows.forEach(r => body.appendChild(clone(r))); t.appendChild(body);
            const wide = document.createElement('div'); wide.className = 'wide'; wide.appendChild(t); host.appendChild(wide);
          } });
      }
      if (def.faults){
        const table = q('table.faults');
        const all = table ? [...table.querySelectorAll('tbody tr')] : [];
        const found = def.faults.map(d => all.find(r => textOf(r.cells[0]).toLowerCase() === String(d).toLowerCase()));
        const lost = def.faults.filter((d, i) => !found[i]);
        if (lost.length) return missing(`fault${lost.length > 1 ? 's' : ''} "${lost.join('", "')}"`);
        return Object.assign(piece, { type: 'faults', key: `faults-${slug(def.faults[0])}`, title: def.title || `Watch out for: ${found.map(r => textOf(r.cells[0]).toLowerCase()).join(', ')}`, kicker: 'What goes wrong first', minutes: 2, sources: found,
          render(host){
            const t = document.createElement('table'); t.className = 'faults course-faults';
            t.appendChild(clone(table.querySelector('thead')));
            const body = document.createElement('tbody'); found.forEach(r => body.appendChild(clone(r))); t.appendChild(body);
            const wide = document.createElement('div'); wide.className = 'wide'; wide.appendChild(t); host.appendChild(wide);
          } });
      }
      if (def.check){
        const all = q('ul.checklist li', true);
        const found = def.check.map(t => all.find(li => startsWith(textOf(li), t)));
        const lost = def.check.filter((t, i) => !found[i]);
        if (lost.length) return missing(`checklist line${lost.length > 1 ? 's' : ''} "${lost.join('", "')}"`);
        const items = found.map(textOf);
        return Object.assign(piece, { type: 'check', key: 'check', title: def.title || 'Check yourself', kicker: 'When it is learned', minutes: 2, sources: found, items,
          render(host, ctx){
            const k = keyOf(lesson, piece);
            const ticks = state.ticks[k] || items.map(() => false);
            host.innerHTML = `<p class="course-check-lead">Tick each when you can do it — the piece is complete when they all are.</p>
              <ul class="course-check">${items.map((t, i) => `<li><label><input type="checkbox" data-i="${i}"${ticks[i] ? ' checked' : ''}> <span>${esc(t)}</span></label></li>`).join('')}</ul>`;
            host.querySelectorAll('input').forEach(box => box.addEventListener('change', () => {
              const now = state.ticks[k] || items.map(() => false);
              now[Number(box.dataset.i)] = box.checked;
              state.ticks[k] = now;
              const all = now.every(Boolean);
              if (all) state.done[k] = Date.now(); else delete state.done[k];
              save();
              ctx.refresh();
            }));
          } });
      }
      if (def.sources){
        const ol = q('ol.sources');
        if (!ol) return missing('the sources');
        const intro = ol.previousElementSibling && ol.previousElementSibling.tagName === 'P' ? ol.previousElementSibling : null;
        return Object.assign(piece, { type: 'sources', key: 'sources', title: def.title || 'The sources', kicker: 'Reference', minutes: def.minutes || 2, sources: intro ? [ol, intro] : [ol],
          render(host){ if (intro) host.appendChild(clone(intro)); const c = clone(ol); c.className = 'sources course-sources'; host.appendChild(c); } });
      }
      return missing(`a piece of unknown kind (${Object.keys(def).join(', ')})`);
    }
    const course = lessons.map((l, i) => {
      const lesson = { ...l, n: i + 1, pieces: [] };
      lesson.pieces = l.pieces.map(def => resolve(def, lesson));
      // two pieces of one lesson with one key would share a tick: number the second
      const seen = new Map();
      lesson.pieces.forEach(p => { const n = (seen.get(p.key) || 0) + 1; seen.set(p.key, n); if (n > 1) p.key = `${p.key}-${n}`; });
      lesson.minutes = lesson.pieces.reduce((s, p) => s + p.minutes, 0);
      return lesson;
    });
    const allPieces = course.flatMap(l => l.pieces.map(p => [l, p]));
    const lessonAt = n => course[n - 1] || null;

    // ---- what is in no lesson ----
    function coverage(){
      const inv = [];
      const add = (kind, el, label) => inv.push({ kind, el, label });
      q('main section.part > p', true).forEach(p => { if (p.dataset.course !== 'page') add('paragraph', p, textOf(p).slice(0, 70)); });
      q('#grips .grip-group', true).forEach(g => add('grips', g, textOf(g.querySelector('.grip-core .name'))));
      q('#scaleNecks .neck-fig', true).forEach(f => add('figure', f, textOf(f.querySelector('h4'))));
      q('main article.ex', true).forEach(a => add('card', a, a.id));
      q('#songs .song', true).forEach(s => add('song', s, textOf(s.querySelector('h4'))));
      q('#players tbody tr', true).forEach(r => add('player', r, textOf(r.cells[1])));
      q('table.faults tbody tr', true).forEach(r => add('fault', r, textOf(r.cells[0])));
      q('ul.checklist li', true).forEach(li => add('checklist', li, textOf(li).slice(0, 60)));
      q('ol.sources', true).forEach(o => add('sources', o, 'the sources'));
      const covered = new Set();
      allPieces.forEach(([, p]) => p.sources.forEach(el => covered.add(el)));
      const missing = inv.filter(x => !covered.has(x.el)).map(({ kind, label }) => ({ kind, label }));
      const unresolved = allPieces.filter(([, p]) => p.missing).map(([l, p]) => `${l.title}: ${p.title}`);
      const aboutThePage = q('main section.part > p[data-course="page"]', true).length;
      return { total: inv.length, covered: inv.length - missing.length, missing, unresolved, aboutThePage, pieces: allPieces.length, lessons: course.length };
    }

    // ---- where you are, and where to go next ----
    const nextUndone = (from = 0) => {
      for (let i = 0; i < allPieces.length; i++){ const [l, p] = allPieces[(from + i) % allPieces.length]; if (!isDone(l, p)) return [l, p]; }
      return null;
    };
    const indexOf = (lesson, piece) => allPieces.findIndex(([l, p]) => l === lesson && p === piece);
    // the piece to pick up at: the one last seen if it is not done, else
    // the first not done after it; nothing when the course is complete
    function resumePoint(){
      if (state.last){
        const l = course.find(x => x.id === state.last.lesson);
        const p = l && l.pieces.find(x => x.key === state.last.piece);
        if (l && p){ if (!isDone(l, p)) return [l, p]; const n = nextUndone(indexOf(l, p)); if (n) return n; }
      }
      return nextUndone(0);
    }
    function summary(){
      const donePieces = allPieces.filter(([l, p]) => isDone(l, p)).length;
      const minutes = allPieces.reduce((s, [, p]) => s + p.minutes, 0);
      const left = allPieces.reduce((s, [l, p]) => s + (isDone(l, p) ? 0 : p.minutes), 0);
      const at = resumePoint();
      return { name, lessons: course.length, doneLessons: course.filter(lessonDone).length, pieces: allPieces.length, donePieces, minutes, minutesLeft: left,
               started: donePieces > 0 || !!state.last, complete: allPieces.length > 0 && donePieces === allPieces.length,
               next: at ? { lesson: at[0].n, title: at[0].title, piece: at[0].pieces.indexOf(at[1]) + 1, pieceTitle: at[1].title } : null };
    }

    // ---- the routes: #course, #course/3, #course/3/5, #course/3/done ----
    const parse = hash => { const m = /^#course(?:\/(\d+)(?:\/(\d+|done))?)?$/.exec(hash || ''); return m ? { lesson: m[1] ? Number(m[1]) : null, piece: m[2] === 'done' ? 'done' : m[2] ? Number(m[2]) : null } : null; };
    const hrefOf = (lesson, piece) => `#course/${lesson.n}${piece == null ? '' : '/' + (piece === 'done' ? 'done' : (typeof piece === 'number' ? piece : lesson.pieces.indexOf(piece) + 1))}`;
    const go = hash => { if (location.hash === hash) route(); else location.hash = hash; };
    let inCourse = false, current = null, resizedHidden = false;
    function enter(){
      if (inCourse) return;
      inCourse = true;
      document.body.classList.add('in-course');
      readView.hidden = true;
      root.hidden = false;
      markViews();
    }
    function leave(){
      if (!inCourse) return;
      inCourse = false;
      GT.examplePlayer.stop();
      document.body.classList.remove('in-course');
      root.hidden = true;
      readView.hidden = false;
      root.innerHTML = '';
      current = null;
      if (resizedHidden){ resizedHidden = false; dive.renderCards(); }   // the page's tabs were drawn to a width they no longer have
      markViews();
      markStartHere();
    }
    function route(){
      const r = parse(location.hash);
      if (!r){
        const was = inCourse;
        leave();
        // the browser could not scroll to an anchor that was hidden: do it now
        if (was && location.hash.length > 1){ const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
        return;
      }
      enter();
      GT.examplePlayer.stop();
      if (r.lesson == null){ renderHome(); return; }
      const lesson = lessonAt(r.lesson);
      if (!lesson){ renderHome(); return; }
      if (r.piece === 'done'){ renderLessonDone(lesson); return; }
      if (r.piece == null){
        // the lesson opens at its first piece not done, or its first
        const p = lesson.pieces.find(x => !isDone(lesson, x)) || lesson.pieces[0];
        location.replace(hrefOf(lesson, p));
        return;
      }
      const piece = lesson.pieces[r.piece - 1];
      if (!piece){ location.replace(hrefOf(lesson, null)); return; }
      renderPiece(lesson, piece);
    }

    // ---- the dashboard ----
    const ring = (frac, n, done) => {
      const r = 15, c = 2 * Math.PI * r;
      return `<svg class="ring${done ? ' done' : ''}" viewBox="0 0 40 40" aria-hidden="true"><circle class="track" cx="20" cy="20" r="${r}"/><circle class="fill" cx="20" cy="20" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}"/><text x="20" y="20" text-anchor="middle" dominant-baseline="central">${done ? '✓' : n}</text></svg>`;
    };
    const strip = lesson => `<span class="strip" aria-hidden="true">${lesson.pieces.map(p => `<i class="${p.type}${isDone(lesson, p) ? ' done' : ''}" title="${esc(p.title)}">${ICONS[p.type] || '·'}</i>`).join('')}</span>`;
    function renderHome(){
      current = null;
      const s = summary();
      const at = resumePoint();
      const frac = s.pieces ? s.donePieces / s.pieces : 0;
      const lede = document.querySelector('main .lede');
      const hero = s.complete
        ? `<div class="hero complete"><p class="kicker">Course complete</p><h2>Every piece done — ${plural(s.pieces, 'piece')} across ${plural(s.lessons, 'lesson')}.</h2><p>Go round again at the record's tempo, or take the studies into Jam and change the key.</p><p class="hero-btns"><a class="btn primary" href="${hrefOf(course[0], 1)}">Start again from lesson 1</a><a class="btn" href="#s1">Read the full page</a></p></div>`
        : at && s.started
          ? `<div class="hero"><p class="kicker">Pick up where you left off</p><h2>Lesson ${at[0].n} · ${esc(at[0].title)}</h2><p class="hero-piece"><span class="icon ${at[1].type}">${ICONS[at[1].type]}</span> ${esc(at[1].kicker)} · ${esc(at[1].title)} · piece ${at[0].pieces.indexOf(at[1]) + 1} of ${at[0].pieces.length}</p><p class="hero-btns"><a class="btn primary" href="${hrefOf(at[0], at[1])}">Continue →</a><a class="btn" href="${hrefOf(at[0], null)}">Lesson ${at[0].n} from its first piece</a></p></div>`
          : `<div class="hero"><p class="kicker">Not started</p><h2>${plural(s.lessons, 'lesson')}, ${plural(s.pieces, 'piece')}, about ${minutesText(s.minutes)} of playing.</h2><p>One piece at a time, in order. Your place is kept in this browser.</p><p class="hero-btns"><a class="btn primary" href="${hrefOf(course[0], 1)}">Start lesson 1 →</a></p></div>`;
      root.innerHTML = `
        <div class="course-home">
          <header class="course-head">
            <p class="kicker">${esc(name)} · the course</p>
            <h1>${esc(config.title || `Learn ${name} in ${plural(course.length, 'lesson')}`)}</h1>
            ${config.blurb ? `<p class="blurb">${config.blurb}</p>` : lede ? `<p class="blurb">${lede.innerHTML}</p>` : ''}
            <div class="overall" role="progressbar" aria-valuemin="0" aria-valuemax="${s.pieces}" aria-valuenow="${s.donePieces}" aria-label="Course progress"><div class="bar"><span style="width:${(frac * 100).toFixed(1)}%"></span></div>
              <p class="overall-text">${s.donePieces} of ${s.pieces} pieces done · ${s.doneLessons} of ${s.lessons} lessons${s.minutesLeft && !s.complete ? ` · about ${minutesText(s.minutesLeft)} left` : ''}</p></div>
          </header>
          ${hero}
          <ol class="lesson-list">${course.map(l => {
            const d = doneCount(l), all = lessonDone(l), started = d > 0 || (state.last && state.last.lesson === l.id);
            const status = all ? 'Done' : started ? 'In progress' : 'Not started';
            return `<li class="lesson-row${all ? ' done' : started ? ' started' : ''}">
              ${ring(l.pieces.length ? d / l.pieces.length : 0, l.n, all)}
              <div class="lesson-main">
                <a class="lesson-link" href="${hrefOf(l, null)}"><span class="lesson-kicker">Lesson ${l.n} · ${plural(l.pieces.length, 'piece')} · ${minutesText(l.minutes)}</span><span class="lesson-name">${esc(l.title)}</span></a>
                ${l.tagline ? `<p class="lesson-tagline">${esc(l.tagline)}</p>` : ''}
                ${strip(l)}
                ${l.goal ? `<p class="lesson-goal"><i>Move on when</i> ${esc(l.goal)}</p>` : ''}
              </div>
              <div class="lesson-side"><span class="status ${slug(status)}">${status}${!all && started ? ` · ${d}/${l.pieces.length}` : ''}</span><a class="btn small" href="${hrefOf(l, null)}">${all ? 'Review' : started ? 'Continue' : 'Start'} →</a></div>
            </li>`; }).join('')}</ol>
          <footer class="course-foot">
            <p>Everything on the full page is in these lessons — the reading, the grips, the figures, every card, the records, the faults, the check lists, the sources — in the order the page's Start-here list gives. Progress is kept in this browser only (nothing is sent anywhere); clearing the site's data clears it.</p>
            <p><a href="#s1">Read the full page instead</a> · <button type="button" class="linklike" id="courseReset">Reset progress</button></p>
          </footer>
        </div>`;
      const reset = root.querySelector('#courseReset');
      if (reset) reset.addEventListener('click', () => { if (confirm(`Forget every piece marked complete in the ${name} course?`)){ state = blank(); save(); renderHome(); } });
      root.scrollTop = 0; window.scrollTo(0, 0);
    }

    // ---- a lesson, one piece at a time ----
    const railItem = (lesson, p, i, cur) => `<li class="${p.type}${isDone(lesson, p) ? ' done' : ''}${p === cur ? ' current' : ''}"><a href="${hrefOf(lesson, p)}" ${p === cur ? 'aria-current="step"' : ''}><span class="icon">${isDone(lesson, p) ? '✓' : ICONS[p.type] || '·'}</span><span class="rail-title"><span class="rail-kicker">${esc(p.kicker)}</span>${esc(p.title)}</span><span class="rail-min">${p.minutes} min</span></a></li>`;
    const segments = (lesson, cur) => `<span class="segments" aria-hidden="true">${lesson.pieces.map(p => `<i class="${isDone(lesson, p) ? 'done' : ''}${p === cur ? ' current' : ''}"></i>`).join('')}</span>`;
    function lessonFrame(lesson, cur, inner){
      const d = doneCount(lesson);
      const countIn = dive.countInOn();
      root.innerHTML = `
        <div class="course-lesson">
          <div class="lesson-bar">
            <a class="back" href="#course">← All lessons</a>
            <div class="lesson-title"><span class="kicker">Lesson ${lesson.n} of ${course.length}</span><h2>${esc(lesson.title)}</h2></div>
            <div class="lesson-progress"><span class="count">${d} of ${lesson.pieces.length} done</span>${segments(lesson, cur)}</div>
            <label class="course-countin"><input type="checkbox" id="courseCountIn"${countIn ? ' checked' : ''}> Count in on Play</label>
          </div>
          <div class="lesson-body">
            <aside class="rail" aria-label="The pieces of this lesson"><ol>${lesson.pieces.map((p, i) => railItem(lesson, p, i, cur)).join('')}</ol></aside>
            <section class="piece-pane">${inner}</section>
          </div>
        </div>`;
      const box = root.querySelector('#courseCountIn');
      box.addEventListener('change', () => dive.setCountIn(box.checked));
      window.scrollTo(0, 0);
      // the current piece in view in the rail, on a narrow screen
      const cur$ = root.querySelector('.rail .current');
      if (cur$ && cur$.scrollIntoView) try { cur$.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* older browsers */ }
    }
    function renderPiece(lesson, piece){
      current = { lesson, piece };
      state.last = { lesson: lesson.id, piece: piece.key };
      save();
      const i = lesson.pieces.indexOf(piece);
      const prev = lesson.pieces[i - 1] || null, next = lesson.pieces[i + 1] || null;
      const done = isDone(lesson, piece);
      lessonFrame(lesson, piece, `
        <article class="piece ${piece.type}">
          <p class="kicker"><span class="icon ${piece.type}">${ICONS[piece.type]}</span> ${esc(piece.kicker)} · ${piece.minutes} min · piece ${i + 1} of ${lesson.pieces.length}</p>
          <h3>${esc(piece.title)}</h3>
          <div class="piece-body"></div>
          ${piece.note ? `<p class="piece-note">${piece.note}</p>` : ''}
          <div class="piece-actions">
            ${prev ? `<a class="btn" href="${hrefOf(lesson, prev)}">← Previous</a>` : `<a class="btn" href="#course">← All lessons</a>`}
            <label class="done-toggle"><input type="checkbox" id="pieceDone"${done ? ' checked' : ''}> Done</label>
            <button type="button" class="btn primary" id="pieceNext">${done ? (next ? 'Next →' : 'Finish the lesson →') : (next ? 'Mark complete and continue →' : 'Mark complete and finish →')}</button>
            ${next && !done ? `<a class="btn quiet" href="${hrefOf(lesson, next)}">Skip →</a>` : ''}
          </div>
        </article>`);
      const body = root.querySelector('.piece-body');
      const ctx = { refresh: () => refreshMarks(lesson, piece) };
      piece.render(body, ctx);
      const toggle = root.querySelector('#pieceDone');
      toggle.addEventListener('change', () => { setDone(lesson, piece, toggle.checked); if (piece.type === 'check') piece.render((body.innerHTML = '', body), ctx); refreshMarks(lesson, piece); });
      root.querySelector('#pieceNext').addEventListener('click', () => {
        if (!isDone(lesson, piece)) setDone(lesson, piece, true);
        go(next ? hrefOf(lesson, next) : hrefOf(lesson, 'done'));
      });
    }
    // the rail, the segments and the buttons follow a change of mark without redrawing the piece (a card keeps playing)
    function refreshMarks(lesson, piece){
      const done = isDone(lesson, piece);
      const i = lesson.pieces.indexOf(piece), next = lesson.pieces[i + 1] || null;
      root.querySelector('.rail ol').innerHTML = lesson.pieces.map((p, k) => railItem(lesson, p, k, piece)).join('');
      root.querySelector('.lesson-progress').innerHTML = `<span class="count">${doneCount(lesson)} of ${lesson.pieces.length} done</span>${segments(lesson, piece)}`;
      const toggle = root.querySelector('#pieceDone'); if (toggle) toggle.checked = done;
      const btn = root.querySelector('#pieceNext'); if (btn) btn.textContent = done ? (next ? 'Next →' : 'Finish the lesson →') : (next ? 'Mark complete and continue →' : 'Mark complete and finish →');
      const skip = root.querySelector('.piece-actions .quiet'); if (skip) skip.hidden = done || !next;
    }
    function renderLessonDone(lesson){
      current = null;
      const nextLesson = lessonAt(lesson.n + 1);
      const d = doneCount(lesson), all = lessonDone(lesson);
      const kinds = {};
      lesson.pieces.forEach(p => { kinds[p.type] = (kinds[p.type] || 0) + 1; });
      const names = { read: 'to read', text: 'to read', grips: 'grips', figure: 'figures', card: 'cards played', songs: 'records', players: 'players', faults: 'faults', check: 'check list', sources: 'sources' };
      lessonFrame(lesson, null, `
        <article class="piece lesson-done">
          <p class="kicker">${all ? 'Lesson complete' : 'End of the lesson'}</p>
          <h3>${all ? `Lesson ${lesson.n} done: ${esc(lesson.title)}` : `${d} of ${lesson.pieces.length} pieces done in ${esc(lesson.title)}`}</h3>
          ${lesson.goal ? `<p class="lesson-goal big"><i>Move on when</i> ${esc(lesson.goal)}</p>` : ''}
          <p class="covered">This lesson: ${Object.entries(kinds).map(([k, n]) => `${n} ${names[k] || k}`).join(' · ')}.</p>
          ${!all ? `<p class="left">Still to do: ${lesson.pieces.filter(p => !isDone(lesson, p)).map(p => `<a href="${hrefOf(lesson, p)}">${esc(p.title)}</a>`).join(' · ')}.</p>` : ''}
          <div class="piece-actions">
            ${nextLesson ? `<a class="btn primary" href="${hrefOf(nextLesson, null)}">Next: lesson ${nextLesson.n}, ${esc(nextLesson.title)} →</a>` : `<a class="btn primary" href="#course">Back to the course →</a>`}
            <a class="btn" href="${hrefOf(lesson, 1)}">Go through it again</a>
            <a class="btn quiet" href="#course">All lessons</a>
          </div>
        </article>`);
    }

    // ---- the page in Read view: the switch in the top bar, the Start-here badges ----
    function markViews(){
      const top = document.querySelector('.top');
      if (!top) return;
      let views = top.querySelector('.views');
      if (!views){
        views = document.createElement('span');
        views.className = 'views';
        views.innerHTML = `<a class="view read" href="#" title="The whole page, to read">Read</a><a class="view course" href="#course" title="The page as lessons, one piece at a time">Course</a>`;
        top.appendChild(views);
      }
      views.querySelector('.read').classList.toggle('active', !inCourse);
      views.querySelector('.course').classList.toggle('active', inCourse);
    }
    function markStartHere(){
      const start = document.querySelector('.start');
      if (!start) return;
      const s = summary();
      let callout = start.querySelector('.course-callout');
      if (!callout){ callout = document.createElement('p'); callout.className = 'course-callout'; const intro = start.querySelector(':scope > p:not(.kicker)'); (intro || start).insertAdjacentElement(intro ? 'afterend' : 'beforeend', callout); }
      const at = resumePoint();
      callout.innerHTML = s.complete
        ? `<b>The course:</b> every piece done. <a href="#course">See the course →</a>`
        : s.started && at
          ? `<b>Or take it as a course</b> — ${s.donePieces} of ${s.pieces} pieces done, ${s.doneLessons} of ${s.lessons} lessons. <a href="${hrefOf(at[0], at[1])}">Continue: lesson ${at[0].n}, ${esc(at[1].title)} →</a> · <a href="#course">all lessons</a>`
          : `<b>Or take it as a course:</b> the same ${plural(course.length, 'lesson')}, one piece at a time, your place kept. <a href="#course">Start the course →</a>`;
      const items = [...start.querySelectorAll('ol.lessons > li')];
      items.forEach((li, i) => {
        const l = course[i]; if (!l) return;
        let mark = li.querySelector('.lesson-mark');
        if (!mark){ mark = document.createElement('a'); mark.className = 'lesson-mark'; li.prepend(mark); }
        const d = doneCount(l);
        mark.href = hrefOf(l, null);
        mark.title = `Lesson ${l.n} in the course: ${d} of ${l.pieces.length} pieces done`;
        mark.textContent = lessonDone(l) ? '✓' : d ? `${d}/${l.pieces.length}` : '·';
        mark.classList.toggle('done', lessonDone(l));
        mark.classList.toggle('started', d > 0 && !lessonDone(l));
      });
    }

    // ---- links inside a piece: a card the course has goes to its piece; anything else is on the full page ----
    root.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.closest('.piece-actions, .hero-btns, .lesson-bar, .rail, .lesson-side, .lesson-link, .course-foot, .views')) return;
      const id = a.getAttribute('href').slice(1);
      if (!id || parse('#' + id)) return;
      const hit = allPieces.find(([, p]) => p.cardId === id);
      if (hit){ e.preventDefault(); go(hrefOf(hit[0], hit[1])); }
      // otherwise the hash changes to the anchor and route() leaves the course for it
    });
    // the arrow keys move between pieces; Enter marks the piece complete and moves on
    document.addEventListener('keydown', e => {
      if (!inCourse || !current || e.repeat || e.altKey || e.metaKey || e.ctrlKey) return;
      if (/^(input|select|textarea|button|a)$/i.test(e.target.tagName) || document.querySelector('dialog.big[open]')) return;
      const { lesson, piece } = current, i = lesson.pieces.indexOf(piece);
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(lesson.pieces[i + 1] ? hrefOf(lesson, lesson.pieces[i + 1]) : hrefOf(lesson, 'done')); }
      else if (e.key === 'ArrowLeft'){ e.preventDefault(); if (lesson.pieces[i - 1]) go(hrefOf(lesson, lesson.pieces[i - 1])); }
      else if (e.key === 'Enter'){ e.preventDefault(); const b = root.querySelector('#pieceNext'); if (b) b.click(); }
    });
    // a card's tab is drawn to its width: drawn again when that changes
    let resizeTimer = 0, drawnWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth === drawnWidth) return;
        drawnWidth = window.innerWidth;
        if (!inCourse) return;
        resizedHidden = true;
        if (current && current.piece.type === 'card'){ GT.examplePlayer.stop(); const body = root.querySelector('.piece-body'); if (body){ body.innerHTML = ''; current.piece.render(body, { refresh: () => refreshMarks(current.lesson, current.piece) }); } }
      }, 250);
    });
    window.addEventListener('hashchange', route);

    const api = {
      key: KEY, lessons: course, coverage, summary, resumePoint, isDone, setDone, load: () => { state = load(); return state; }, state: () => state, reset: () => { state = blank(); save(); },
      current: () => current ? { lesson: current.lesson.n, piece: current.lesson.pieces.indexOf(current.piece) + 1 } : null, route, hrefOf, inCourse: () => inCourse,
      init(){
        state = load();
        save();                      // the summary the front page reads, kept current with the lessons as they are now
        markViews();
        markStartHere();
        route();
        api.ready = true;
        return api;
      },
    };
    return api;
  }

  GT.course = { create, CARDS_GUIDE, cardKind, ICONS };
})();
