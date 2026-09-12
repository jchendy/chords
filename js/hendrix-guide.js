// The Hendrix deep dive (hendrix.html): the grips drawn, the examples,
// exercises and studies realised from the Hendrix genre's parts and played
// through the example player, each with a link into the Jam tab that
// opens the same key, progression, feel, part and roll — and the songs and
// the sources written out. Nothing here is played from a recording: every
// tab on the page is the engine realising a part of the library.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, chordPcs, SEMITONE, MINOR_KEYS } = GT.theory;
  const { partsFor, realise, palette } = GT.parts;
  const { STRING_MIDI, CAGED_COLORS, CAGED_MAJOR, CAGED_MINOR, cagedPlacements, arpeggioCells, pentaBoxPlacements, scaleBoxPlacements } = GT.fretboard;
  const { DEG, pcOf, cellKey, pcs, neckGeometry, chordNeck, scaleNeck, boxMarkers, neckSVG, figure } = GT.neckFollow;
  const { STYLES } = GT.audio;
  const { drawTab, play, stop, playing, seekable } = GT.examplePlayer;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const STYLE = 'hendrix';
  const feels = STYLES[STYLE].variants;
  const feelByLabel = label => feels.find(f => f.label === label);
  const feelIndex = label => feels.findIndex(f => f.label === label);

  // ---- where the hand sits: the E shape at the key's root on the low E ----
  // The window is the box whose root is on the low E string — the thumb
  // chord's box — four frets wide. E is the open position (the same shape
  // as the 12th fret, which the app's fifteen-fret neck can't hold with a
  // box above it); the fuzz grips sit at the 7th-fret root on the A string.
  function eShapeWindow(key){
    const pc = SEMITONE[key] % 12;
    const f = (pc - 4 + 12) % 12;       // the root's fret on the low E
    return { min: f, max: f + 3 };
  }
  const windowAt = (min, span = 3) => ({ min, max: min + span });

  // ---- a link into the jam tab ----
  // The jam tab's share format: k = mode:tonic, n = the chords by name
  // with bars (or pr = the preset they came from, which a part written for
  // one progression needs), t = tempo, s = style.variant, p =
  // part.scale.seed(.e)(.l|.r), f = the neck's reading, theory and box.
  function jamLink({ key, mode, chords, tempo, feel, part, seed, blend, reading, preset, easy, window: win }){
    const p = new URLSearchParams();
    p.set('k', `${mode || 'major'}:${key}`);
    if (preset) p.set('pr', `${preset.name}|${preset.variant || ''}`);
    else p.set('n', chords.map(c => `${c.name}.${c.bars || 1}`).join(','));
    p.set('t', String(tempo));
    p.set('s', `${STYLE}.${feelIndex(feel)}`);
    if (part){
      const idx = partsFor(STYLE, feel).findIndex(x => x.name === part);
      p.set('p', `${Math.max(0, idx)}.f.${seed}${easy ? '.e' : ''}${blend === 'lead' ? '.l' : blend === 'rhythm' ? '.r' : ''}`);
    }
    const first = chordFromName(chords[0].name, SEMITONE[key] % 12, mode || 'major');
    const box = boxIndexFor({ key, mode, reading, window: win }, first);
    p.set('f', `m:${reading || 'penta'}${mode === 'minor' ? '.t:modal' : ''}${box ? `.b:${box}` : ''}`);
    return `index.html#jam?${p.toString()}`;
  }
  // The box the link opens the neck on: of the boxes the neck lists for the
  // first chord, low to high, the one nearest the example's window — the
  // higher of two equally near, so a grip at the top of the window is in.
  // The neck's boxes are the shapes' own frets, so the window in Jam
  // can differ from the example's by a fret; the arrows step it from there.
  function boxIndexFor(ex, chord){
    const fb = GT.fretboard;
    const rootPc = SEMITONE[chord.note] % 12;
    const isMinor = chord.quality === 'min';
    const win = ex.window || eShapeWindow(ex.key);
    let boxes;
    if ((ex.reading || 'penta') === 'scale'){
      const flat7 = chord.seventh && (SEMITONE[chord.seventh] - rootPc + 12) % 12 === 10;
      const pcs = ex.mode === 'minor'
        ? MINOR_KEYS[ex.key].map(n => SEMITONE[n] % 12)      // modal theory: the key's own notes
        : (isMinor ? [0, 2, 3, 5, 7, 8, 10] : flat7 ? [0, 2, 4, 5, 7, 9, 10] : [0, 2, 4, 5, 7, 9, 11]).map(i => (rootPc + i) % 12);
      boxes = fb.scaleBoxPlacements(rootPc, isMinor, new Set(pcs));
    } else boxes = fb.pentaBoxPlacements(rootPc, isMinor);
    const sorted = boxes.filter(b => b.anchor >= 0 && b.anchor <= fb.FRET_COUNT).sort((a, b) => a.anchor - b.anchor);
    // the box that covers most of the window; of two that cover the same,
    // the one starting nearer; of two of those, the higher
    let best = 0, bestScore = -Infinity;
    sorted.forEach((b, i) => {
      const frets = b.cells.map(c => c.fret), lo = Math.min(...frets), hi = Math.max(...frets);
      const overlap = Math.max(0, Math.min(hi, win.max) - Math.max(lo, win.min) + 1);
      const score = overlap * 100 - Math.abs(lo - win.min);
      if (score >= bestScore){ bestScore = score; best = i; }
    });
    return best;
  }
  const finderLink = chord => `index.html#chord-finder?c=${encodeURIComponent(chord)}`;
  // ---- a link into the drills tab ----
  // The drills tab's own format (js/drills.js): d = the kind, k =
  // mode:tonic, t = tempo, then the kind's fields — sc/b/p for a scale and
  // its box, ch/pos/bt/st for chord changes. An example says which with
  // `drills`; the scale drills and the chord changes open there, the parts
  // in the jam tab.
  function drillsLink(ex){
    const p = new URLSearchParams();
    const d = ex.drills;
    p.set('d', d.d);
    p.set('k', `${d.k || `${ex.mode || 'major'}:${ex.key}`}`);
    p.set('t', String(ex.tempo));
    Object.entries(d).forEach(([k, v]) => { if (k !== 'd' && k !== 'k' && v != null) p.set(k, String(v)); });
    // the changes keep the part's rhythm: its figure's strums — the thumb's
    // bass note, the split chord, the stabs — go along as the pattern
    if (d.d === 'changes' && ex.part && GT.drills){
      const part = partsFor(STYLE, ex.feel).find(x => x.name === ex.part);
      const feel = feelByLabel(ex.feel);
      const pt = part ? GT.drills.encodeStrums(part.figure || [], feel ? feel.grid : 16) : '';
      if (pt){ p.set('pt', pt); p.delete('st'); }
    }
    return `index.html#drills?${p.toString()}`;
  }
  const openLink = ex => ex.drills ? drillsLink(ex) : jamLink(ex);
  const openText = ex => ex.drills ? 'Open in drills' : 'Open in jam';

  // ---- realising an example ----
  const optsFor = ex => ({ reading: ex.reading || 'penta', window: ex.window || eShapeWindow(ex.key), scaleTheory: ex.mode === 'minor' ? 'modal' : 'parallel',
                           stringSet: 2, stayOnKey: false, key: { tonic: ex.key, mode: ex.mode || 'major' }, tech: null });
  function chordsOf(ex){
    const tonicPc = SEMITONE[ex.key] % 12;
    const chords = [];
    ex.chords.forEach(c => { const ch = chordFromName(c.name, tonicPc, ex.mode || 'major'); for (let k = 0; k < (c.bars || 1); k++) chords.push(ch); });
    return chords;
  }
  // The hand moving with the chords: an example's `positions` give the fret
  // the hand sits at for each chord (the thumb barre walking Em open, G at
  // the 3rd, Am at the 5th), and each bar is realised in its own window;
  // a lead part stays in its box.
  function barsOf(ex, chords){
    const moving = ex.positions && ex.blend !== 'lead' && !ex.build;
    return chords.map(chord => {
      const at = moving ? ex.positions[displayName(chord)] : null;
      return at != null ? { chord, window: windowAt(at) } : { chord };
    });
  }
  const windowOfBar = (ex, bars, b) => (bars && bars[b] && bars[b].window) || ex.window || eShapeWindow(ex.key);
  const unionWindow = (ex, bars) => {
    const wins = (bars || []).map((b, i) => windowOfBar(ex, bars, i));
    if (!wins.length) return ex.window || eShapeWindow(ex.key);
    return { min: Math.min(...wins.map(w => w.min)), max: Math.max(...wins.map(w => w.max)) };
  };
  // what a realisation shows, for choosing a seed that shows what the
  // blurb promises: the devices by name
  const SHOWS = {
    hammer: ns => ns.some(n => n.tech === 'h'), pull: ns => ns.some(n => n.tech === 'p'),
    double: ns => ns.some(n => n.tech === 'double'), bend: ns => ns.some(n => n.bend && !n.unison),
    slide: ns => ns.some(n => n.slide != null), unison: ns => ns.some(n => n.unison),
    trill: ns => ns.some(n => n.trill), wah: ns => ns.some(n => n.wah), rake: ns => ns.some(n => n.rake),
    lead: ns => (ns.roles || []).includes('lead'), stop: ns => (ns.roles || []).includes('stop-time'),
    turnaround: ns => (ns.roles || []).includes('turnaround'), vib: ns => ns.some(n => n.vib),
  };
  function realiseExample(ex){
    const feel = feelByLabel(ex.feel);
    if (!feel) return null;
    const chords = chordsOf(ex);
    // a drill writes its own notes — a scale up and down — rather than
    // realising a part; its last chord holds for as many bars as the run needs
    if (ex.build){
      const notes = ex.build(chords, feel);
      const bars = 1 + Math.max(0, ...notes.map(n => n.bar));
      while (chords.length < bars) chords.push(chords[chords.length - 1]);
      return { feel, chords, notes, bars: chords.map(chord => ({ chord })), seed: 0 };
    }
    let part = partsFor(STYLE, ex.feel).find(p => p.name === ex.part);
    if (!part) return null;
    // a chord-change drill is the chords alone: the figure and its variants
    // in every bar, no fills, no runs — only the strums, whole and partial
    if (ex.chordsOnly) part = { name: part.name, figure: part.figure, variants: part.variants || [], fills: [part.figure], figureMode: part.figureMode, fingers: part.fingers };
    const bars = barsOf(ex, chords);
    const feat = { grid: feel.grid, blend: ex.blend || 'mixed', easy: !!ex.easy };
    const run = seed => {
      let notes = realise(part, bars, seed, optsFor(ex), feat);
      if (ex.chordsOnly){ const kept = notes.filter(n => n.strum); kept.stopBars = notes.stopBars; kept.roles = (notes.roles || []).map(r => r === 'fill' ? 'figure' : r); notes = kept; }
      return notes;
    };
    // the seed: the example's own, unless the blurb names devices — then
    // the first seed whose six bars show every one of them (found once)
    let seed = ex.seed || 7;
    if (ex.wants && ex.wants.length && ex._seed == null){
      const shows = ns => ex.wants.every(w => SHOWS[w] && SHOWS[w](ns));
      let found = null;
      for (let k = 0; k < 120 && found == null; k++){ const sd = (seed + k - 1) % 997 + 1; if (shows(run(sd))) found = sd; }
      ex._seed = found == null ? seed : found;
    }
    if (ex._seed != null) seed = ex._seed;
    const notes = run(seed);
    return { feel, part, chords, notes, bars, seed };
  }
  // how hard a realisation is to play, from what is in it
  function difficultyOf(notes, ex){
    if (ex.build) return ex.drills && ex.drills.p && ex.drills.p !== 'updown' ? 'intermediate' : 'beginner';
    if (notes.some(n => n.unison || n.trill || n.rake || n.wah || (n.bend && n.bend >= 3) || (n.bend && n.vib))) return 'advanced';
    if (notes.some(n => n.bend || n.tech === 'h' || n.tech === 'p' || n.slide != null || n.tech === 'double')) return 'intermediate';
    return 'beginner';
  }
  const practiceTempo = ex => Math.max(40, Math.round(ex.tempo * 0.7 / 2) * 2);

  // the neck a card opens with: what the reader last chose anywhere on the
  // page, else the card's own default (chords for the changes, the scale for
  // a drill), else off
  // ...and whether the fingering is shown over the tab: a chord diagram at
  // each change of grip, a finger number over each single note
  const FINGERS_KEY = 'gt.hendrixFingers';
  const fingersPref = () => { try { return localStorage.getItem(FINGERS_KEY) === '1'; } catch (e) { return false; } };
  const saveFingersPref = v => { try { localStorage.setItem(FINGERS_KEY, v ? '1' : '0'); } catch (e) { /* no storage */ } };
  const NECK_KEY = 'gt.hendrixNeck';
  const neckPref = () => { try { return localStorage.getItem(NECK_KEY) || ''; } catch (e) { return ''; } };
  const saveNeckPref = v => { try { localStorage.setItem(NECK_KEY, v); } catch (e) { /* no storage */ } };
  function card(host, ex, cfg = {}){
    const art = document.createElement('article');
    art.className = 'ex' + (cfg.big ? ' big' : '');
    art.id = ex.id;
    const r = realiseExample(ex);
    const exForLink = { ...ex, tempo: practiceTempo(ex), seed: r ? r.seed : ex.seed };
    const link = openLink(exForLink);
    const kind = ex.build ? 'drill' : ex.blend === 'lead' ? 'lead' : ex.blend === 'rhythm' ? 'rhythm' : 'mixed';
    const mode0 = cfg.neck || neckPref() || ex.neckDefault || 'off';
    const show = { fingers: cfg.fingers != null ? !!cfg.fingers : fingersPref() };
    const level = r ? difficultyOf(r.notes, ex) : '';
    const swung = r && r.feel.swing ? `<span>${r.feel.grid === 12 ? 'triplet feel' : 'sixteenths swung'}</span>` : '';
    art.innerHTML = `
      <div class="ex-head"><div><h4>${esc(ex.title)}</h4>
        <div class="meta"><span>${esc(ex.feel)}</span>${ex.part ? `<span>${esc(ex.part)}</span>` : ''}<span>${esc(ex.key)} ${ex.mode === 'minor' ? 'minor' : 'major'}</span><span>${ex.tempo} BPM · start at ${practiceTempo(ex)}</span>${swung}<span>${kind}</span>${level ? `<span class="chip ${level}">${level}</span>` : ''}</div></div>
        <span class="btns"><span class="seg neck-seg" role="group" aria-label="Neck"><span class="lbl">Neck</span>${['off', 'chords', 'scale'].map(v => `<button type="button" data-value="${v}"${v === mode0 ? ' class="active"' : ''}>${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</span><span class="seg fingers-seg"><button type="button" class="fingers${show.fingers ? ' active' : ''}" aria-pressed="${show.fingers}" title="A chord diagram at each change of grip, a finger number over each note">Fingering</button></span><button type="button" class="play">Play</button><a class="drill" href="${link}">${openText(ex)} →</a>${cfg.big ? '<button type="button" class="drill close-big">Close ✕</button>' : '<button type="button" class="drill expand" title="The example large, tab and neck side by side">Expand ⤢</button>'}</span></div>
      <p class="blurb">${ex.blurb}</p>
      <div class="body"><div class="tab"></div><div class="neck" hidden></div></div>
      ${ex.refs ? `<p class="refs">${ex.refs}</p>` : ''}`;
    host.appendChild(art);
    if (!r){ art.querySelector('.tab').innerHTML = `<p class="missing">This example's part is missing: ${esc(ex.feel)} / ${esc(ex.part)}</p>`; return; }
    const tabHost = art.querySelector('.tab');
    // the fingering, when shown, is the thumb-over hand: the page's
    const tabOpts = () => ({ fingering: show.fingers ? { thumb: true, windowOf: b => windowOfBar(ex, r.bars, b) } : null });
    let metrics = drawTab(tabHost, r.feel, r.chords, r.notes, tabOpts());
    // the tab is drawn to its width, which changes when the neck opens
    // beside it; redrawn then, and the player told, so the playhead keeps
    // its place
    const redrawTab = () => { metrics = drawTab(tabHost, r.feel, r.chords, r.notes, tabOpts()); if (playing() && playing().card === art) playing().metrics = metrics; };
    art.querySelector('.fingers-seg button').addEventListener('click', e => {
      show.fingers = !show.fingers;
      saveFingersPref(show.fingers);
      e.currentTarget.classList.toggle('active', show.fingers);
      e.currentTarget.setAttribute('aria-pressed', String(show.fingers));
      redrawTab();
    });
    // the neck: what each chord's bars play, so a fill note has a dot to light
    const playedByChord = new Map();
    r.notes.forEach(n => {
      const name = displayName(r.chords[n.bar]);
      if (!playedByChord.has(name)) playedByChord.set(name, new Map());
      playedByChord.get(name).set(cellKey(n), { string: n.string, fret: n.fret });
    });
    // ...and the grip a chord's bars strum when it is no CAGED shape (the
    // 7♯9 grip, a power chord), from the first bar that strums it, so a
    // lead bar over the same chord shows the hand it came from
    const gripByChord = new Map(), struckByChord = new Map();
    r.chords.forEach((c, b) => {
      const name = displayName(c);
      const strums = r.notes.filter(n => n.bar === b && n.strum);
      if (!strums.length || struckByChord.has(name)) return;
      struckByChord.set(name, [...new Map(strums.map(n => [n.string, { string: n.string, fret: n.fret }])).values()]);
      const g = GT.examplePlayer.gripOfBar(c, r.notes.filter(n => n.bar === b));
      if (g) gripByChord.set(name, g);
    });
    const neckHost = art.querySelector('.neck');
    const state = { mode: mode0, geo: null, drawn: null };
    // the neck's scale is the part's palette: a part marked blues plays the
    // minor pentatonic over the major chords, and the neck shows that
    const exN = { ...ex, blues: !!(ex.blues || (r.part && r.part.blues)) };
    const allWin = unionWindow(ex, r.bars);
    const body = art.querySelector('.body');
    const draw = bar => {
      if (state.mode === 'off'){
        if (!neckHost.hidden){ neckHost.hidden = true; body.classList.remove('with-neck'); redrawTab(); }
        state.drawn = null; return;
      }
      if (neckHost.hidden){ neckHost.hidden = false; body.classList.add('with-neck'); redrawTab(); }
      const b = (((bar || 0) % r.chords.length) + r.chords.length) % r.chords.length;
      const chord = r.chords[b];
      const name = displayName(chord);
      const win = windowOfBar(ex, r.bars, b);
      if (state.drawn === `${state.mode}|${name}|${win.min}`) return;
      state.drawn = `${state.mode}|${name}|${win.min}`;
      if (!state.geo) state.geo = neckGeometry(allWin, r.notes);
      const played = [...(playedByChord.get(name) || new Map()).values()];
      const { markers, lines, what } = state.mode === 'chords' ? chordNeck(chord, win, played, gripByChord.get(name) || null, struckByChord.get(name) || null)
        : scaleNeck(chord, { opts: { ...optsFor(exN), blues: exN.blues }, scale: ex.scale }, win, played);
      neckHost.innerHTML = `<p class="neck-title">${esc(what)}</p>${neckSVG(state.geo, markers, lines, cfg.big ? 1.8 : 1)}`;
    };
    const barNow = () => (playing() && playing().card === art && playing().shownBar != null) ? playing().shownBar : 0;
    art.querySelector('.neck-seg').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      state.mode = b.dataset.value;
      saveNeckPref(state.mode);
      art.querySelectorAll('.neck-seg button').forEach(x => x.classList.toggle('active', x === b));
      draw(barNow());
    });
    art.querySelector('.play').addEventListener('click', () => {
      if (playing() && playing().card === art){ stop(); return; }
      play(art, STYLE, r.feel, r.chords, r.notes, ex.tempo, metrics, { onBar: draw, onStop: () => draw(0), countIn: countInOn() ? GT.band.beatsOf(r.feel) : 0 });
    });
    if (cfg.big) art.querySelector('.close-big').addEventListener('click', () => big.close());
    else art.querySelector('.expand').addEventListener('click', () => openBig(ex));
    // a click on the tab sets where it plays from, the neck following
    seekable(art, () => ({ feel: r.feel, chords: r.chords, notes: r.notes, metrics }), { onSeek: bar => draw(bar) });
    draw(0);
  }

  // ---- an example, large ----
  // A full-window view of one card: the tab drawn to the window's width and
  // the neck beside it, on from the start. Esc, the backdrop or Close shuts
  // it, and whatever it was playing stops.
  const big = document.createElement('dialog');
  big.className = 'big';
  document.body.appendChild(big);
  let bigEx = null;
  function openBig(ex){
    stop();
    bigEx = ex;
    big.innerHTML = '';
    if (!big.open) big.showModal();          // open first: the tab is drawn to its width
    card(big, { ...ex, id: `${ex.id}-big` }, { big: true, neck: ex.build || ex.blend === 'lead' ? 'scale' : 'chords' });
    big.scrollTop = 0;
  }
  big.addEventListener('close', () => { stop(); if (!big.open){ big.innerHTML = ''; bigEx = null; } });   // (the event comes late; not if it has reopened)
  big.addEventListener('click', e => { if (e.target === big) big.close(); });

  // ---- the count-in, for every example on the page ----
  const COUNT_KEY = 'gt.hendrixCountIn';
  const countInOn = () => { try { return localStorage.getItem(COUNT_KEY) === '1'; } catch (e) { return false; } };
  function bindCountIn(){
    const box = document.getElementById('countInToggle');
    if (!box) return;
    box.checked = countInOn();
    box.addEventListener('change', () => { try { localStorage.setItem(COUNT_KEY, box.checked ? '1' : '0'); } catch (e) { /* no storage */ } });
  }

  // ---- the grips ----
  // pattern low string to high, relative to the lowest fret; `at` is the
  // fret the pattern's 0 sits at for the chord named; `fingers` the hand,
  // string by string — T the thumb over the neck, 1 to 4 the fingers
  // Most of the grips are one hand: the thumb-over E shape, and what the
  // free fingers add to it. So the shapes are grouped — a core shape, and
  // its variations under it — and the finder tags them all.
  const E_SHAPE = { name: 'E-shape barre, thumb over the bass', chord: 'G', pattern: '0-2-2-1-0-0', at: 3, fingers: 'T-3-4-2-1-1', basis: 'in the sources [8] [12] [6b]', what: 'The thumb frets the low E; the index lies over the top two strings and the others are free. The chord every ballad is built on, and the hand every variation below starts from.' };
  const GRIP_GROUPS = [
    { core: E_SHAPE, variations: [
      { name: 'The split chord', basis: 'in the sources [8] [9]', chord: 'G', pattern: 'x-x-2-1-0-x', at: 3, fingers: 'x-x-4-2-1-x', what: 'The same hand, striking only the D, G and B strings after the thumb’s bass note.' },
      { name: 'The 4th hammered on (sus4)', basis: 'in the sources [8]; the ring finger across A and D is the usual way', chord: 'Gsus4', pattern: '0-2-2-2-0-0', at: 3, fingers: 'T-3-3-4-1-1', what: 'The ring finger covers the A and D strings so the pinky is free to hammer the 4th onto the G string and let it go.' },
      { name: 'The 6th (The Wind Cries Mary)', basis: 'in the sources [8] [15c]; the pinky is the usual way', chord: 'G6', pattern: '0-2-2-1-2-0', at: 3, fingers: 'T-3-3-2-4-1', what: 'The pinky hammers the 6th onto the 5th on the B string — the embellishment that drives that record’s rhythm part.' },
      { name: 'The 9th on top (add9)', basis: 'in the sources [8]; the pinky is the usual way', chord: 'Gadd9', pattern: '0-2-2-1-0-2', at: 3, fingers: 'T-3-3-2-1-4', what: 'The pinky hammers the 9th onto the octave on the top string.' },
    ] },
    { core: { name: 'E-shape minor', basis: 'in the sources [11] [3]', chord: 'Em', pattern: '0-2-2-0-0-0', at: 0, fingers: '0-2-3-0-0-0', what: 'The same hand on a minor chord: Little Wing’s Em, Am and Bm. Up the neck the thumb takes the bass and the index the top strings, and the hammered 4th and 9th work here too.' }, variations: [] },
    { core: { name: 'The Hendrix chord, 7♯9', basis: 'in the sources [5] [20] [1]', chord: 'E7#9', pattern: 'x-1-0-1-2-x', at: 6, fingers: 'x-2-1-3-4-x', what: 'Root on the A string at the 7th fret, 3rd, ♭7, ♯9: x-7-6-7-8-x. Both thirds at once.' }, variations: [
      { name: 'The 9th chord (Red House)', basis: 'in the sources [16b]; the ring-finger bar is the usual way', chord: 'B9', pattern: 'x-1-0-1-1-1', at: 1, fingers: 'x-2-1-3-3-3', what: 'The same root, 3rd and ♭7 with the 9th and the 5th on top instead of the ♯9, the ring finger laid across three strings: the T-Bone and B.B. King comp chord, slid in from a fret below.' },
    ] },
    { core: { name: 'A-shape barre, the ring finger across D, G and B', basis: 'the usual way — the sources don\'t settle which barre he used', chord: 'A', pattern: 'x-0-2-2-2-x', at: 5, fingers: 'x-1-3-3-3-x', what: 'The 5th-string-root barre the way rock players hold it: the index on the root, the ring finger laid across three strings, the top string left out or caught under the index. The everyday grip, and the one to slide into the E shape from.' }, variations: [
      { name: 'A shape with the fingers freed', basis: 'the embellishments are in the sources [11] [7b]; the fingering is the usual way', chord: 'A', pattern: 'x-0-2-2-2-0', at: 5, fingers: 'x-1-2-3-4-1', what: 'The same chord with a finger to each string, for the hammered 4th on the B string and the 9th on the top string — the embellishments the lessons describe on this shape, which a barred ring finger can’t play.' },
    ] },
    { core: { name: 'C shape with the 3rd in the bass', basis: 'in the sources [11] [7b]; the fingering is the usual way', chord: 'C/E', pattern: '0-3-2-0-1-0', at: 0, fingers: '0-3-2-0-1-0', what: 'The C shape voiced from its 3rd — the inversions the ballads move through.' }, variations: [] },
    { core: { name: 'Stacked fifths (Castles Made of Sand)', basis: 'in the sources [1] [13]; the fingering is the usual way', chord: 'Dsus2', pattern: 'x-x-0-2-5-x', at: 0, fingers: 'x-x-0-1-4-x', what: 'Root, 5th and 9th on the D, G and B strings, index and pinky, slid along the neck.' }, variations: [] },
  ];
  const GRIPS = GRIP_GROUPS.flatMap(g => [g.core, ...g.variations]);
  function gripSVG(pattern, at, fingers){
    const frets = pattern.split('-').map(f => f === 'x' ? null : Number(f) + at);
    const hand = (fingers || '').split('-');
    const lo = Math.max(0, Math.min(...frets.filter(f => f != null)));
    const start = lo <= 1 ? 0 : lo;             // draw from the nut, or from the lowest fret
    const W = 150, H = 120, x0 = 24, y0 = 22, sx = 18, sy = 19, n = 5;
    const parts = [];
    for (let s = 0; s < 6; s++) parts.push(`<line x1="${x0 + s * sx}" y1="${y0}" x2="${x0 + s * sx}" y2="${y0 + n * sy}" stroke="#6f675b" stroke-width="1"/>`);
    for (let f = 0; f <= n; f++) parts.push(`<line x1="${x0}" y1="${y0 + f * sy}" x2="${x0 + 5 * sx}" y2="${y0 + f * sy}" stroke="${f === 0 && start === 0 ? '#ece7dc' : '#3a3631'}" stroke-width="${f === 0 && start === 0 ? 3 : 1}"/>`);
    // the first row of the grid is fret 1 from the nut, or the fret the
    // diagram starts at; only an open string sits above the chart
    const rowY = f => y0 + ((start === 0 ? f : f - start + 1) - 0.5) * sy;
    // one finger across neighbouring strings at one fret is a barre: a bar
    // behind the dots
    for (let a = 0; a < 6; a++){
      const finger = hand[a];
      if (!finger || finger === '0' || finger === 'x' || finger === 'T' || !frets[a]) continue;
      let b = a;
      while (b + 1 < 6 && hand[b + 1] === finger && frets[b + 1] === frets[a]) b++;
      if (b > a) parts.push(`<rect x="${x0 + a * sx - 7}" y="${rowY(frets[a]) - 7}" width="${(b - a) * sx + 14}" height="14" rx="7" fill="#e0a84a" opacity=".55"/>`);
      a = b;
    }
    frets.forEach((f, s) => {
      const x = x0 + s * sx;
      if (f == null){ parts.push(`<text x="${x}" y="${y0 - 8}" text-anchor="middle" fill="#6f675b" font-size="11">x</text>`); return; }
      if (f === 0){ parts.push(`<circle cx="${x}" cy="${y0 - 10}" r="4" fill="none" stroke="#a49a8a" stroke-width="1.3"/>`); return; }
      const cy = rowY(f);
      parts.push(`<circle cx="${x}" cy="${cy}" r="7" fill="#e0a84a"/>`);
      const finger = hand[s];
      if (finger && finger !== '0' && finger !== 'x') parts.push(`<text x="${x}" y="${cy + 3.4}" text-anchor="middle" fill="#0c0b0a" font-size="9.5" font-weight="700" font-family="Inter,system-ui,sans-serif">${finger}</text>`);
    });
    if (start > 0) parts.push(`<text x="${x0 - 8}" y="${y0 + sy * 0.5 + 4}" text-anchor="end" fill="#a49a8a" font-size="11">${start}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
  }
  const gripCard = (g, cls = 'grip') => `
      <div class="${cls}">${gripSVG(g.pattern, g.at, g.fingers)}
        <div class="name">${esc(g.name)}</div>
        <div class="what">${esc(g.what)}</div>
        ${g.basis ? `<div class="basis">${esc(g.basis)}</div>` : ''}
        <a href="${finderLink(g.chord)}">${esc(g.chord)} in the finder →</a></div>`;
  function renderGrips(){
    $('grips').innerHTML = GRIP_GROUPS.map(({ core, variations }) => `
      <div class="grip-group${variations.length ? ' has-vars' : ''}">
        <div class="grip-core"><p class="grip-kicker">Core shape</p>${gripCard(core)}</div>
        ${variations.length ? `<div class="grip-vars"><p class="grip-kicker">Variations — the same hand, one finger moved</p><div class="grips">${variations.map(v => gripCard(v, 'grip var')).join('')}</div></div>` : ''}
      </div>`).join('');
  }

  // ---- the scales, drawn ----
  const PENTA_MINOR = [0, 3, 5, 7, 10], PENTA_MAJOR = [0, 2, 4, 7, 9];
  const DORIAN = [0, 2, 3, 5, 7, 9, 10], MIXO = [0, 2, 4, 5, 7, 9, 10];
  const boxAt = (boxes, name, anchor) => boxes.find(b => b.name === name && b.anchor === anchor);
  // the left hand for a box: one finger a fret from the index at its lowest
  // fret, the pinky stretching where a shape spans five
  function fingersOf(cells){
    const frets = cells.map(c => c.fret).filter(f => f > 0);
    if (!frets.length) return 'Open strings, and the first finger.';
    const lo = Math.min(...frets), hi = Math.max(...frets), open = cells.some(c => c.fret === 0);
    const span = hi - lo + 1;
    if (open) return `<b>Fingers:</b> the open strings as they come, then index at fret ${lo}, one finger a fret${span > 3 ? ', the pinky at ' + hi : ''}.`;
    return span <= 4 ? `<b>Fingers:</b> index at fret ${lo}, one finger a fret to the pinky at ${hi}.` : `<b>Fingers:</b> index at fret ${lo}, one finger a fret, the pinky stretching to ${hi}.`;
  }
  function renderScaleNecks(){
    const E = 4, B = 11, G = 7;
    const figs = [];
    const eMin = pentaBoxPlacements(E, true), eMaj = pentaBoxPlacements(E, false);
    const blue = boxAt(eMin, 'E', 12);
    figs.push(figure('E minor pentatonic: the E-shape box at the 12th fret', 10, 15,
      boxMarkers(blue, E, pcs(E, [0, 3, 7, 10])),
      `Root on the low E under the thumb, the fret the thumb chord sits on — so the box is under the hand that holds the chord. Over E7 or Em7 the 1, ♭3, 5 and ♭7 are chord tones; the 4th is the note that bends up to the 5th. The solos on "Hey Joe", "Purple Haze" and "Voodoo Child (Slight Return)" live here. ${fingersOf(blue.cells)} The 15th-fret notes are the ring finger's on the outer strings and the pinky's where the box is four frets wide.`));
    // the box under the 7♯9 grip: the C and A shapes of the same pentatonic, around the 7th fret
    const under = [boxAt(eMin, 'C', 5), boxAt(eMin, 'A', 7)];
    const underMarkers = new Map();
    under.forEach(b => boxMarkers(b, E, pcs(E, [0, 4, 7, 10])).forEach(m => { if (!underMarkers.has(cellKey(m))) underMarkers.set(cellKey(m), m); }));
    const gripCells = [{ string: 4, fret: 7, label: '1' }, { string: 3, fret: 6, label: '3' }, { string: 2, fret: 7, label: '♭7' }, { string: 1, fret: 8, label: '♯9' }];
    gripCells.forEach(c => underMarkers.set(cellKey(c), { string: c.string, fret: c.fret, color: '#d8d1c4', hollow: true, label: c.label, isRoot: c.label === '1' }));
    figs.push(figure('The box under the 7♯9 grip', 3, 11,
      [...underMarkers.values()],
      `The Hendrix chord at the 7th fret (hollow: root on the A string, 3rd, ♭7, ♯9) with the E minor pentatonic around it — the C shape (cyan) below and the A shape (orange) above, sharing the 7th-fret notes. The riff under "Purple Haze" and the fills between the stabs come from here, not from the box at the 12th. ${fingersOf(under[0].cells)} For the grip itself: middle on the root, index on the D string, ring and pinky above.`,
      [{ color: '#d8d1c4', shape: '7♯9', cells: gripCells.map(c => ({ string: c.string, fret: c.fret })) }]));
    const low = boxAt(eMin, 'E', 0), above = boxAt(eMin, 'D', 3);
    figs.push(figure('The same box at the nut, and the box above it', 0, 6,
      [...boxMarkers(low, E, null), ...boxMarkers(above, E, null).filter(m => !low.cells.some(c => c.string === m.string && c.fret === m.fret))],
      `The E shape (blue) with its open strings, and the D shape (green) two frets up, sharing the notes on the seam. A phrase goes up the first box, slides on the top string from the 3rd fret to the 5th into the second, and comes back down — the move the lead parts make between the box at the 12th and the one above it, where this drawing's neck runs out. ${fingersOf(low.cells)} In the D shape: index at 2, ring at 4, pinky at 5.`));
    // the hand moving: the thumb-over E shape walking up the neck with a ballad's changes
    const walk = [['Em', 0], ['G', 3], ['Am', 5], ['Bm', 7]].map(([name, fret]) => {
      const chord = chordFromName(name, E, 'minor');
      const rootPc = pcOf({ string: 5, fret }), isMinor = chord.quality === 'min';
      const placement = cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR).find(p => p.name === 'E' && p.fretMin === fret);
      return placement ? chordNeck(chord, { min: fret, max: fret + 3 }, [], placement) : null;
    }).filter(Boolean);
    figs.push(figure('The hand moving: the thumb barre walking up the neck', 0, 10,
      walk.flatMap(w => w.markers), 
      `Em open, then the same E shape with the thumb over the low E at the 3rd fret for G, the 5th for Am, the 7th for Bm — the first bars of the Little Wing form as one hand moving. Every chord is fingered the same way: thumb on the root, ring on A, pinky on D, middle on G (index across G for a minor), index across B and e. The fills between them come from the box under whichever chord the hand is on.`,
      walk.flatMap(w => w.lines)));
    const flat5 = arpeggioCells(11, 15, new Set([(E + 6) % 12])).map(c => ({ string: c.string, fret: c.fret, color: CAGED_COLORS.E, hollow: true, label: '♭5' }));
    figs.push(figure('The blues scale: the ♭5 in the box', 10, 15,
      [...boxMarkers(blue, E, pcs(E, [0, 3, 7, 10])), ...flat5],
      `The B♭, hollow: a passing note between the 4th and the 5th on the A string and the G string, and on the B string a fret below the box. Slid or bent through, never sat on. ${fingersOf(blue.cells)} The ♭5 on the A string is the ring finger sliding up a fret; on the B string, the index reaching back.`));
    figs.push(figure('Minor over major: the E minor pentatonic against E7♯9', 10, 15,
      boxMarkers(blue, E, pcs(E, [0, 4, 7, 10])),
      `The same box over a major chord. The 1, 5 and ♭7 sit inside E7♯9; the ♭3 (G) is the ♯9, played against the chord’s G♯ — the tension the fuzz feels keep on purpose — and the 4th is the note that bends. The major 3rd is let in as a passing colour, a hammer-on from the ♭3. ${fingersOf(blue.cells)}`));
    const dor = scaleBoxPlacements(E, true, pcs(E, DORIAN));
    figs.push(figure('E Dorian in the E shape: the 6th and the 9th let in', 10, 15,
      boxMarkers(boxAt(dor, 'E', 12), E, pcs(E, [0, 3, 7, 10])),
      `The minor pentatonic with the 2nd (F♯, the 9th) and the major 6th (C♯) — the scale Mermikides hears in the "Purple Haze" solo over E5, F♯5 and D5. The 6th against a minor chord is the Dorian colour; the parts write it as a free note. ${fingersOf(boxAt(dor, 'E', 12).cells)}`));
    figs.push(figure('E major pentatonic: the sweet register of the R&B fills', 10, 15,
      boxMarkers(boxAt(eMaj, 'E', 12), E, pcs(E, [0, 4, 7])),
      `The 2nd, the 3rd and the 6th instead of the ♭3 and the ♭7: the scale of the double stops and hammer-ons between the chords on "Wait Until Tomorrow", and of the Mayfield ballads. The 2nd bends to the 3rd here, where the minor box bends the 4th to the 5th. ${fingersOf(boxAt(eMaj, 'E', 12).cells)}`));
    const bMin = boxAt(pentaBoxPlacements(B, true), 'E', 7), bMaj = boxAt(pentaBoxPlacements(B, false), 'E', 7);
    const minSet = pcs(B, PENTA_MINOR), majSet = pcs(B, PENTA_MAJOR);
    // both boxes are the E shape, so both are blue elsewhere on the page;
    // here the major side is drawn light, only to tell the two apart
    const LIGHT = '#d8d1c4';
    const mixed = new Map();
    [...bMin.cells, ...bMaj.cells].forEach(c => {
      const pc = pcOf(c), inMin = minSet.has(pc), inMaj = majSet.has(pc);
      mixed.set(cellKey(c), { string: c.string, fret: c.fret, label: DEG[(pc - B + 12) % 12], isRoot: pc === B,
        ...(inMin && inMaj ? { split: [CAGED_COLORS.E, LIGHT] } : { color: inMin ? CAGED_COLORS.E : LIGHT }) });
    });
    figs.push(figure('B: the minor and the major pentatonic at the 7th fret, mixed', 5, 11,
      [...mixed.values()],
      `Blue is the minor pentatonic (B D E F♯ A), light the major (B C♯ D♯ F♯ G♯), split where they share a note. Both are the E shape — blue everywhere else on this page; the major side is drawn light here only so the two can be told apart. The slow blues layers both over B7: the ♭3 bent up towards the 3rd, the 6th and the 9th from the major side, the 4th and ♭7 from the minor — "the B7 chord voicing, B minor pentatonic, and B major pentatonic" of "Red House". <b>Fingers:</b> index at 7 for both, the major side's 6th-fret notes the index reaching back, its 9th-fret notes the ring.`));
    const mixo = scaleBoxPlacements(G, false, pcs(G, MIXO));
    figs.push(figure('G Mixolydian at the nut, over G–D–F–C', 0, 5,
      boxMarkers(boxAt(mixo, 'G', 0), G, pcs(G, [0, 4, 7, 10])),
      `The major scale with a ♭7 (F): the key of the "Castles Made of Sand" chorus, whose F chord is the ♭VII. Over G the F is the passing colour; over the F chord it is the root. ${fingersOf(boxAt(mixo, 'G', 0).cells)}`));
    $('scaleNecks').innerHTML = figs.join('');
  }

  // ---- the scales, played ----
  // A drill is written as notes, not as a part: the box's cells in pitch
  // order, up and down, in eighths (two slots on a sixteen grid, one on a
  // twelve), each `dur` the space to the next — what the player and the tab
  // want from a realised part.
  const midiOf = c => STRING_MIDI[c.string] + c.fret;
  const byPitch = cells => cells.slice().sort((a, b) => midiOf(a) - midiOf(b) || b.string - a.string);
  const upAndDown = cells => { const up = byPitch(cells); return [...up, ...up.slice(0, -1).reverse()]; };
  function drill(cellsInOrder, { grid = 16, step = grid === 12 ? 1 : 2, vel = 0.82 } = {}){
    const notes = [];
    cellsInOrder.forEach((c, i) => {
      const at = i * step, bar = Math.floor(at / grid);
      notes.push({ bar, at: at - bar * grid, dur: step, vel, string: c.string, fret: c.fret, midi: midiOf(c), ...(c.fx || {}) });
    });
    const last = notes[notes.length - 1];
    if (last) last.dur = grid - last.at;
    return notes;
  }
  const withFx = (c, fx) => ({ ...c, fx });
  const cell = (string, fret) => ({ string, fret });
  const DRILLS = [
    { id: 'sc1', neckDefault: 'scale', drills: { d: 'scale', sc: 'minorpenta', b: 'E@12', p: 'updown', v: 2 }, title: 'The box at the 12th, up and down', feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 76, chords: [{ name: 'E7', bars: 3 }], window: windowAt(12), reading: 'penta', blues: true,
      scale: { root: 4, pcs: pcs(4, PENTA_MINOR), name: 'E minor pentatonic' },
      build: () => drill([...upAndDown(boxAt(pentaBoxPlacements(4, true), 'E', 12).cells), cell(5, 12)]),
      blurb: 'Two notes a string, twelve frets up: the E minor pentatonic in the E shape, alternate-picked in eighths over the band. Get it even before you get it fast; the box under the thumb is the one every solo starts from.' },
    { id: 'sc2', neckDefault: 'scale', drills: { d: 'scale', sc: 'blues', b: 'E@12', p: 'updown', v: 2 }, title: 'The blue note on the way down', feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 76, chords: [{ name: 'E7', bars: 3 }], window: windowAt(12), reading: 'scale', blues: true,
      scale: { root: 4, pcs: pcs(4, [0, 3, 5, 6, 7, 10]), name: 'the E blues scale' },
      build: () => {
        const up = byPitch(boxAt(pentaBoxPlacements(4, true), 'E', 12).cells);
        // down again with the ♭5 slid through on the G string and the A string
        const down = [cell(0, 15), cell(0, 12), cell(1, 15), cell(1, 12), cell(2, 15), withFx(cell(2, 14), { slide: 15 }), cell(2, 12), cell(3, 14), cell(3, 12), cell(4, 14), withFx(cell(4, 13), { slide: 14 }), cell(4, 12), cell(5, 15), cell(5, 12)];
        return drill([...up, ...down]);
      },
      blurb: 'Up the box as before; on the way down the B♭ is slid into between the 5th and the 4th — on the G string at the 15th fret, on the A string at the 13th. A note to pass through, not to stop on.' },
    { id: 'sc3', neckDefault: 'scale', drills: { d: 'scale', sc: 'minorpenta', b: 'E@0', p: 'boxes', v: 2 }, title: 'Up the box, into the box above, and back', feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 76, chords: [{ name: 'Em7', bars: 4 }], window: { min: 0, max: 5 }, reading: 'penta',
      scale: { root: 4, pcs: pcs(4, PENTA_MINOR), name: 'E minor pentatonic' },
      build: () => {
        const boxes = pentaBoxPlacements(4, true);
        const low = byPitch(boxAt(boxes, 'E', 0).cells), high = byPitch(boxAt(boxes, 'D', 3).cells);
        // up the first box, a slide on the top string into the second, and down it
        const top = high[high.length - 1];
        return drill([...low, withFx(top, { slide: 3 }), ...high.slice(0, -1).reverse(), cell(5, 0)]);
      },
      blurb: 'The E shape at the nut, then the slide on the top string from the 3rd fret to the 5th — the seam between the boxes — and down the D shape to the open E. The same move connects the box at the 12th to the one above it.' },
    { id: 'sc4', neckDefault: 'scale', drills: { d: 'scale', sc: 'minorpenta', b: 'E@12', p: 'updown', v: 2 }, title: 'Minor over major, then major over major', feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 76, chords: [{ name: 'E', bars: 4 }], window: windowAt(11), reading: 'penta',
      scale: { root: 4, pcs: new Set([...pcs(4, PENTA_MINOR), ...pcs(4, PENTA_MAJOR)]), name: 'E minor and E major pentatonic' },
      build: () => {
        const minor = byPitch(boxAt(pentaBoxPlacements(4, true), 'E', 12).cells).slice(0, 12);
        const major = byPitch(boxAt(pentaBoxPlacements(4, false), 'E', 12).cells).slice(0, 12);
        const pad = cells => { while (cells.length < 16) cells.push(cells[cells.length - 1]); return cells; };
        return drill([...pad([...minor, ...minor.slice(-4).reverse()]), ...pad([...major, ...major.slice(-4).reverse()])]);
      },
      blurb: 'Two bars of the minor pentatonic over a plain E major, two bars of the major pentatonic over the same chord. Hear what the ♭3 and the ♭7 do against a major triad, and then what the 2nd, 3rd and 6th do: the blues and the sweet side, the two colours he mixes within one phrase.' },
    { id: 'sc5', neckDefault: 'scale', drills: { d: 'scale', k: 'minor:E', sc: 'dorian', b: 'E@12', p: 'updown', v: 2 }, title: 'E Dorian: the 6th and the 9th on the way up', feel: 'Soul ballad (chord melody)', key: 'E', mode: 'minor', tempo: 74, chords: [{ name: 'Em7', bars: 4 }], window: windowAt(11), reading: 'scale',
      scale: { root: 4, pcs: pcs(4, DORIAN), name: 'E Dorian' },
      build: () => drill([...upAndDown(boxAt(scaleBoxPlacements(4, true, pcs(4, DORIAN)), 'E', 12).cells), cell(5, 12)]),
      blurb: 'The minor pentatonic with F♯ and C♯ let in, up and down the E shape over Em7 with the rim click. The C♯ is the Dorian note: a major 6th against a minor chord.' },
    { id: 'sc6', neckDefault: 'scale', drills: { d: 'scale', sc: 'minorpenta', b: 'E@7', p: 'updown', v: 3 }, title: 'B: minor up, major down, in triplets', feel: 'Slow blues in 12/8 (Red House way)', key: 'B', tempo: 60, chords: [{ name: 'B7', bars: 2 }], window: windowAt(6), reading: 'penta',
      scale: { root: 11, pcs: new Set([...pcs(11, PENTA_MINOR), ...pcs(11, PENTA_MAJOR)]), name: 'B minor and B major pentatonic' },
      build: () => {
        const minor = byPitch(boxAt(pentaBoxPlacements(11, true), 'E', 7).cells);
        const major = byPitch(boxAt(pentaBoxPlacements(11, false), 'E', 7).cells);
        return drill([...minor, ...major.reverse()], { grid: 12 });
      },
      blurb: 'Twelve notes up the minor box and twelve down the major one, an eighth each in 12/8 over B7 — the two scales the slow blues lead draws on, one after the other before they are mixed.' },
    { id: 'sc7', neckDefault: 'scale', drills: { d: 'scale', sc: 'mixolydian', b: 'G@0', p: 'updown', v: 2 }, title: 'G Mixolydian over G–D–F–C', feel: 'Rhythm & blues (Wait Until Tomorrow way)', key: 'G', tempo: 92, chords: [{ name: 'G' }, { name: 'D' }, { name: 'F' }, { name: 'C' }], window: { min: 0, max: 3 }, reading: 'scale',
      scale: { root: 7, pcs: pcs(7, MIXO), name: 'G Mixolydian' },
      build: () => {
        const box = byPitch(boxAt(scaleBoxPlacements(7, false, pcs(7, MIXO)), 'G', 0).cells);
        const up = box.slice(0, 16), down = box.slice(0, 16).reverse();
        return drill([...up, ...down]);
      },
      blurb: 'The scale in open position, up over G and D, down over F and C: the "Castles Made of Sand" chorus with the ♭7 that makes it Mixolydian. Listen for the F as a colour over G and as home over the F chord.' },
  ];

  // ---- the examples ----
  const E_FUZZ = windowAt(5);        // the 7♯9 grip's home: the E on the A string at the 7th fret
  // `positions`: the fret the hand sits at for each chord — the thumb barre
  // walking up the neck with the changes, as the lessons describe it — so
  // each bar is realised where the hand is
  const soul = { feel: 'Soul ballad (chord melody)', key: 'E', mode: 'minor', tempo: 70, chords: [{ name: 'Em' }, { name: 'G' }, { name: 'Am' }, { name: 'Em' }, { name: 'Bm' }, { name: 'C' }], window: windowAt(0), reading: 'scale',
                 positions: { Em: 0, G: 3, Am: 5, Bm: 7, C: 8, Bb: 6, F: 1, D: 5 } };
  const fuzz = { feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 108, chords: [{ name: 'E7#9', bars: 2 }, { name: 'G' }, { name: 'A' }, { name: 'E7#9', bars: 2 }], window: E_FUZZ, reading: 'penta',
                 positions: { 'E7♯9': 5, G: 3, A: 5 } };
  const blues = { feel: 'Slow blues in 12/8 (Red House way)', key: 'B', tempo: 60, chords: [{ name: 'B7', bars: 2 }, { name: 'E9', bars: 2 }, { name: 'B7' }, { name: 'F#7' }], window: windowAt(7), reading: 'penta',
                  positions: { B7: 1, E9: 6, 'F#7': 8 } };
  const funk = { feel: 'Funk rock (Band of Gypsys)', key: 'C', tempo: 104, chords: [{ name: 'C' }, { name: 'Eb' }, { name: 'C7' }, { name: 'F7' }, { name: 'C' }, { name: 'Eb' }], window: windowAt(8), reading: 'penta',
                 positions: { C: 8, Eb: 6, C7: 8, F7: 8 } };
  const cycle = { feel: 'Cycle of fourths (Hey Joe way)', key: 'E', tempo: 82, chords: [{ name: 'C' }, { name: 'G' }, { name: 'D' }, { name: 'A' }, { name: 'E', bars: 2 }], window: windowAt(0), reading: 'penta' };
  const voodoo = { feel: 'One-chord voodoo (wah and pentatonic)', key: 'E', tempo: 88, chords: [{ name: 'E7#9', bars: 6 }], window: E_FUZZ, reading: 'penta' };
  const rnb = { feel: 'Rhythm & blues (Wait Until Tomorrow way)', key: 'E', tempo: 118, chords: [{ name: 'E' }, { name: 'G' }, { name: 'A' }, { name: 'E' }, { name: 'G' }, { name: 'A' }], window: windowAt(0), reading: 'scale',
                positions: { E: 0, G: 3, A: 5 } };
  const waltz = { feel: 'Rolling waltz (Manic Depression way)', key: 'A', tempo: 140, chords: [{ name: 'A' }, { name: 'G' }, { name: 'D' }, { name: 'D#' }, { name: 'E' }, { name: 'A' }], window: windowAt(5), reading: 'penta',
                  positions: { A: 5, G: 3, D: 5, 'D#': 6, E: 7 } };

  const HEY_JOE = { name: 'Hendrix', variant: 'Cycle of fourths (Hey Joe)' };
  const preset = variant => ({ name: 'Hendrix', variant });
  const tab = (song, url) => `<a href="${url}">${esc(song)} tab</a>`;
  const UG = 'https://tabs.ultimate-guitar.com/tab/jimi-hendrix/';

  const CHANGES = [
    { ...soul, id: 'c-wing', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'Em,G,Am,Em', pos: 0, bt: 4, st: 'quarters' }, title: 'Em–G–Am–Em: the minor key’s own chords', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 4, chords: [{ name: 'Em' }, { name: 'G' }, { name: 'Am' }, { name: 'Em' }],
      blurb: 'The first four bars of the Little Wing form: i, III, iv, i — Em open, then the thumb-over E-shape barre walking to G at the 3rd fret and Am at the 5th, the split chord on the "and". The neck shows the grip, and the hand moving with the chords.' },
    { ...fuzz, id: 'c-haze', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'E7#9,E7#9,G,A,E7#9,E7#9', pos: 5, bt: 4, st: 'quarters' }, title: 'E7♯9–G–A: the Hendrix chord, the ♭III and the IV', part: '7♯9 stabs and the riff', blend: 'rhythm', seed: 9,
      blurb: 'The Purple Haze verse: the 7♯9 at the 7th fret as home, then G and A as thumb-over E-shape barres at the 3rd and the 5th. The grip is x-7-6-7-8-x; see it on the neck, and the hand drop to the barres and back.' },
    { ...cycle, id: 'c-joe', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'C,G,D,A,E,E', pos: 0, bt: 4, st: 'quarters' }, title: 'C–G–D–A–E: each chord a fourth below the last', part: 'Thumb chords and the walk-up', blend: 'rhythm', seed: 2, preset: HEY_JOE,
      blurb: 'The cycle of Hey Joe in open chords, the walk-up on the low strings landing on each new root. The neck shows why the bass line works: the 5th of every chord is the root of the next.' },
    { ...blues, id: 'c-house', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'B7,B7,E9,E9,B7,F#7', pos: 2, bt: 4, st: 'halves' }, title: 'B7–E9: the I and the IV of the slow blues', part: '9th chords with the trill', blend: 'rhythm', seed: 6,
      blurb: 'The 7th and 9th grips with the root on the A string, slid in from a fret below on the way to the IV. On the neck, the 9th sits where the octave would in the 7th grip.' },
    { ...soul, id: 'c-bold', chordsOnly: true, neckDefault: 'chords', positions: { A: 5, E: 0, 'F#m': 2, D: 5 }, drills: { d: 'changes', ch: 'A,E,F#m,D', pos: 5, bt: 4, st: 'quarters' }, title: 'A–E–F♯m–D: the Bold as Love verse', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 3, key: 'A', mode: 'major', tempo: 84, chords: [{ name: 'A' }, { name: 'E' }, { name: 'F#m' }, { name: 'D' }], window: windowAt(5), reading: 'scale',
      blurb: 'I–V–vi–IV in A: the thumb-over E shape at the 5th fret for the A, E open, F♯m as the thumb barre at the 2nd, D as the A shape at the 5th — the thumb\'s bass note and the split chord on each. The parallel scale under each chord is on the neck.' },
    { ...soul, id: 'c-castles', chordsOnly: true, neckDefault: 'chords', positions: { G: 3, D: 5, F: 1, C: 3 }, drills: { d: 'changes', ch: 'G,D,F,C', pos: 3, bt: 4, st: 'quarters' }, title: 'G–D–F–C: the ♭VII in the chorus', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 8, key: 'G', mode: 'major', tempo: 76, chords: [{ name: 'G' }, { name: 'D' }, { name: 'F' }, { name: 'C' }], window: windowAt(3), reading: 'scale',
      blurb: 'The Castles Made of Sand chorus: I, V, ♭VII, IV — G as the thumb barre at the 3rd, D as the A shape at the 5th, F as the barre at the 1st, C as the A shape at the 3rd. The F is the chord the key doesn’t own, and the neck shows the scale following it.' },
  ];

  const RHYTHM = [
    { ...soul, id: 'r-split', wants: ['hammer', 'double'], title: 'Thumb bass and the split chord', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7,
      blurb: 'The root under the thumb on one, the D–G–B triad on the "and", the 4th hammered on the G string, the 9th on the top string, a double stop coming down the box. The band is a rim click and a bass on roots; the sixteenths bounce a little, the way Mermikides measures them moving on the record.',
      refs: `As heard in ${tab('Little Wing', UG + 'little-wing-tabs-31788')} and ${tab('Castles Made of Sand', UG + 'castles-made-of-sand-tabs-982787')} (Ultimate Guitar); the device is set out in Happy Bluesman’s three steps [8] and Blackstar’s lesson [9].` },
    { ...soul, id: 'r-sixths', wants: ['slide', 'hammer', 'double'], title: 'Sliding 6ths and rolling hammer-ons', part: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)', blend: 'rhythm', seed: 3,
      blurb: 'What Mayfield and Cropper play: 6ths on the D and B strings slid into from a fret below, the 2nd rolling onto the 3rd and the 4th onto the 5th, two notes at a time.',
      refs: `The Cropper devices from a university lesson [29]; Mayfield’s sliding 6ths and rolling hammer-ons from Premier Guitar [7]. As heard in ${tab('The Wind Cries Mary', UG + 'the-wind-cries-mary-tabs-64118')}.` },
    { ...fuzz, id: 'r-stabs', title: '7♯9 stabs and the riff', part: '7♯9 stabs and the riff', blend: 'rhythm', seed: 5,
      blurb: 'The Hendrix chord on one, left to ring, then the riff on the low strings in the E minor pentatonic with the ♭5 passing, muted between the notes and doubled with the bass. The chord sits at the 7th fret on the A string; the box is the one below it.',
      refs: `As heard in ${tab('Purple Haze', UG + 'purple-haze-tabs-25')} and ${tab('Foxy Lady', UG + 'foxy-lady-tabs-28416')}; the chord’s theory in [1], [5] and [20].` },
    { ...fuzz, id: 'r-power', wants: ['slide'], title: 'Power chords with the open strings', part: 'Power chords with the open strings', blend: 'rhythm', seed: 11,
      blurb: 'Root-and-5th chords hit hard, slid into from a fret below, the riff between them in the pentatonic with a muted scratch.',
      refs: `As heard in ${tab('Spanish Castle Magic', UG + 'spanish-castle-magic-tabs-83455')}; Wikipedia on the unison of guitar and bass there [13b].` },
    { ...blues, id: 'r-ninths', wants: ['trill', 'slide'], title: '9th chords with the trill', part: '9th chords with the trill', blend: 'rhythm', seed: 2,
      blurb: 'The 9th grip on one, muted on the third triplet, slid in from a fret below on three, the 3rd trilled against the 4th into the change; the turnaround walks the 6ths down.',
      refs: `The form and the 7th/9th voicings from guitarclub.io’s Red House lesson [16b]; as heard in ${tab('Red House', UG + 'red-house-tabs-14113')}.` },
    { ...funk, id: 'r-scratch', wants: ['wah'], title: 'Sixteenth scratch with the wah', part: 'Sixteenth scratch with the wah', blend: 'rhythm', seed: 4,
      blurb: 'The pick moving in sixteenths whether the strings ring or not, the wah rocking with every stroke, the chord on the "and of 2" and the "and of 4".',
      refs: `Guitar Player’s rule of the funk figures [6b]; as heard in ${tab('Freedom', UG + 'freedom-tabs-395814')} and ${tab('Izabella', UG + 'izabella-tabs-160070')}.` },
    { ...funk, id: 'r-riff', wants: ['slide', 'trill'], title: 'Single-note funk riff with muted ghosts', part: 'Single-note funk riff with muted ghosts', blend: 'rhythm', seed: 6,
      blurb: 'Root and octave, the ♭7 and the 5th on the low strings, dead sixteenths between the notes, a slide into the ♭3 and a trill on the 4th — the syncopations "articulated with muting, slurs, trills and bends" [6b].',
      refs: `As heard in ${tab('Ezy Ryder', 'https://www.songsterr.com/a/wsa/jimi-hendrix-ezy-ryder-chords-s9423')} (Songsterr) and ${tab('Freedom', UG + 'freedom-tabs-395814')}.` },
    { ...cycle, id: 'r-walk', title: 'Thumb chords and the walk-up', part: 'Thumb chords and the walk-up', blend: 'rhythm', seed: 1, preset: HEY_JOE,
      blurb: 'Written for the cycle of fourths and only for it: the chord on one, then root, 3rd, 4th, 5th on the low strings — and the 5th is the next chord’s root because the next chord is a fourth below. In Jam this part opens only with the "Cycle of fourths" progression loaded.',
      refs: `The bass line as an arpeggio whose 5th becomes the new root, from the lesson pages [15] and the search summaries on Hey Joe; as heard in ${tab('Hey Joe', UG + 'hey-joe-tabs-59')}.` },
    { ...cycle, id: 'r-answers', wants: ['double'], title: 'Double-stop answers between the chords', part: 'Double-stop answers between the chords', blend: 'rhythm', seed: 9,
      blurb: 'The same slow backbeat over any progression: the thumb chord, then 3rds and 4ths out of the box under the shape answering the vocal.' },
    { ...voodoo, id: 'r-wah', wants: ['bend', 'pull'], title: 'Wah scratch (the intro)', part: 'Wah scratch (the intro)', blend: 'rhythm', seed: 3,
      blurb: 'Dead strings and the pedal: sixteen muted strokes a bar, the beats harder, and every second bar the riff — the bend from the 4th, the pull-off, the 7♯9 stab.',
      refs: `The intro’s muted wah rhythm from Riff Ninja [17] and Wikipedia [4]; as heard in ${tab('Voodoo Child (Slight Return)', UG + 'voodoo-child-slight-return-tabs-326654')}.` },
    { ...rnb, id: 'r-hammered', wants: ['hammer'], title: 'Hammered double stops between the chords', part: 'Hammered double stops between the chords', blend: 'rhythm', seed: 8,
      blurb: 'The chord on one, then the hand rolling through the E shape in sixteenths: the 2nd onto the 3rd, the 4th onto the 5th, the 6th down to the 5th.',
      refs: `As heard in ${tab('Wait Until Tomorrow', UG + 'wait-until-tomorrow-tabs-11764')}; the record’s Cropper likeness noted on Wikipedia [14].` },
    { ...rnb, id: 'r-chucks', wants: ['slide'], title: 'Cropper chucks and 6ths', part: 'Cropper chucks and 6ths', blend: 'rhythm', seed: 2,
      blurb: 'The Stax job: a 6th slid into on one, the chord muted on two, the 6th on three, muted on four.', refs: 'From the Cropper lesson [29].' },
    { ...waltz, id: 'r-waltz', title: 'Unison riff with the bass (3/4)', part: 'Unison riff with the bass', blend: 'rhythm', seed: 5,
      blurb: 'Three to the bar and three to the beat: the riff on the low strings the bass doubles, a chromatic step into each chord, the middle of the beat left empty.',
      refs: `Mitchell’s jazz-waltz feel from DRUM! [22] and Wikipedia [12b]; the 3/4 riff from Guitar Control [18]; as heard in ${tab('Manic Depression', UG + 'manic-depression-tabs-11736')}.` },
  ];

  const LEAD = [
    { ...soul, id: 'l-leslie', wants: ['double', 'slide', 'unison'], title: 'Chord-melody lead (the Leslie lead)', part: 'Chord-melody lead (the Leslie lead)', blend: 'lead', seed: 7, reading: 'penta',
      blurb: 'The minor pentatonic on the top three strings with the 9th and the major 3rd let in, double stops between phrases, a slide into the box above and back, wide vibrato, a unison bend at the top.',
      refs: 'The solo’s Leslie speaker and the chord-melody basis from Wikipedia [3].' },
    { ...fuzz, id: 'l-fuzz', wants: ['unison', 'trill', 'rake', 'bend'], title: 'Fuzz lead over the vamp', part: 'Fuzz lead over the vamp', blend: 'lead', seed: 12, window: windowAt(12),
      blurb: 'The box at the 12th fret: the minor pentatonic with the Dorian 6th and the major 3rd free against it, the unison bend, the trill, the rake, the step-and-a-half bend shaken.',
      refs: 'Mermikides on the Dorian solo of Purple Haze [1]; MusicRadar on unison bends, catch bends and the wrist vibrato [10].' },
    { ...blues, id: 'l-vocal', wants: ['bend', 'pull'], title: 'Vocal blues lead (major and minor mixed)', part: 'Vocal blues lead (major and minor mixed)', blend: 'lead', seed: 4,
      blurb: 'The box at the 7th fret in B: the 4th bent to the 5th and shaken, Albert King’s step-and-a-half, the major 3rd against the minor pentatonic, triplet pull-offs, and a beat of silence.',
      refs: 'Red House’s major-and-minor mix from [16b]; its Albert King and Elmore James roots from [6].' },
    { ...funk, id: 'l-funk', wants: ['trill', 'wah'], title: 'Funk lead with the wah', part: 'Funk lead with the wah', blend: 'lead', seed: 3,
      blurb: 'The pedal following the phrase, the Dorian colour, double-stop chucks between phrases, the trill, a climb into the box above.' },
    { ...cycle, id: 'l-twelfth', wants: ['bend'], title: 'Blues-scale lead at the 12th', part: 'Blues-scale lead at the 12th', blend: 'lead', seed: 6, window: windowAt(12),
      blurb: 'The E minor blues scale from the box at the 12th fret over the cycle’s major chords: the B string bent a full step and shaken, the ♭5 passing.',
      refs: 'The 12th-fret blues scale and the full-step bend on the 15th fret of the B string, from Jon MacLennan’s lesson [15].' },
    { ...voodoo, id: 'l-machine', wants: ['bend'], title: 'Machine-gun lead', part: 'Machine-gun lead', blend: 'lead', seed: 9, window: windowAt(12),
      blurb: 'The note repeated like a rifle, the step-and-a-half bend held, notes that last a bar, the climb into the box above and the drop back.',
      refs: 'Machine Gun’s battlefield of feedback and percussive riffs, from Wikipedia [11b]; Hanford on Band of Gypsys [2].' },
    { ...rnb, id: 'l-rnb', wants: ['bend', 'double'], title: 'R&B fills in the major pentatonic', part: 'R&B fills in the major pentatonic', blend: 'lead', seed: 2, reading: 'penta',
      blurb: 'The sweet register: the major pentatonic from the shape, the 6th and the 9th on top, 3rds coming down, the 2nd bent to the 3rd.' },
    { ...waltz, id: 'l-waltz', wants: ['bend'], title: 'Rolling lead in triplets', part: 'Rolling lead in triplets', blend: 'lead', seed: 5,
      blurb: 'Pentatonic triplets alternate-picked, ghost notes in the middle of the beat, a whole-step bend on the downbeat, a run up into the box above.' },
  ];

  const MIXED = [
    { ...soul, id: 'm-split', wants: ['lead'], title: 'The split chord, with its lead lines', part: 'Thumb bass and the split chord', blend: 'mixed', seed: 21,
      blurb: 'The rhythm part with the blend on Mixed: the figure, and in about half the fill bars the melody the chord already had.' },
    { ...fuzz, id: 'm-stabs', wants: ['lead'], title: 'The Hendrix chord, with its lead lines', part: '7♯9 stabs and the riff', blend: 'mixed', seed: 17,
      blurb: 'The stabs and the riff, and the fuzz lines — a unison bend, a rake into the high root — in the fill bars.' },
    { ...blues, id: 'm-call', wants: ['lead'], title: 'Call and answer (stabs and licks)', part: 'Call and answer (stabs and licks)', blend: 'mixed', seed: 5,
      blurb: 'Both jobs in one hand, as he comped his own blues: the 9th chord as a stab, a lick in the box answering, silence.' },
    { ...funk, id: 'm-scratch', wants: ['lead'], title: 'The scratch, with its lead lines', part: 'Sixteenth scratch with the wah', blend: 'mixed', seed: 13,
      blurb: 'The wah scratch, and a wah line in the fill bars.' },
    { ...rnb, id: 'm-hammered', wants: ['lead'], title: 'Hammered double stops, with its lead lines', part: 'Hammered double stops between the chords', blend: 'mixed', seed: 19,
      blurb: 'The R&B rhythm with the fills a sideman plays between the singer’s lines.' },
    { ...cycle, id: 'm-walk', wants: ['lead'], title: 'The walk-up, with its lead lines', part: 'Thumb chords and the walk-up', blend: 'mixed', seed: 4, preset: HEY_JOE,
      blurb: 'The cycle with the walk-up in the figure bars and, in about half the fill bars, a line out of the box under the chord.' },
    { ...voodoo, id: 'm-wah', wants: ['lead'], title: 'The wah scratch, with its lead lines', part: 'Wah scratch (the intro)', blend: 'mixed', seed: 6,
      blurb: 'The scratch and, in the fill bars, the riff and a wah line over the one chord — the intro turning into the song.' },
    { ...waltz, id: 'm-waltz', wants: ['lead'], title: 'The unison riff, with its lead lines', part: 'Unison riff with the bass', blend: 'mixed', seed: 7,
      blurb: 'Three to the bar: the riff with the bass in the figure bars, a rolling line in the fills.' },
  ];

  const EXERCISES = [
    { ...soul, id: 'x1', title: '1. The thumb and the split chord, plain', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7, easy: true, tempo: 60,
      blurb: 'The beginner’s version: the bass note under the thumb on one and three, the D–G–B triad on the "and". Get the two strokes to sound like one hand before adding anything.' },
    { ...soul, id: 'x2', wants: ['hammer'], title: '2. The hammered colours', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7, tempo: 62,
      blurb: 'Now the 4th on the G string, the 9th on the top string, the 6th on the B — hammered, with the chord still ringing under them. Slow, and clean.' },
    { ...soul, id: 'x3', wants: ['slide'], title: '3. Sliding 6ths', part: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)', blend: 'rhythm', seed: 3, tempo: 64,
      blurb: 'Two strings a string apart, the lower note slid into from a fret below. The 6th is the sound of Stax and of Mayfield; the roll (2nd to 3rd, 4th to 5th) comes after.' },
    { ...fuzz, id: 'x4', title: '4. The Hendrix chord', part: '7♯9 stabs and the riff', blend: 'rhythm', seed: 5, easy: true, tempo: 90,
      blurb: 'x-7-6-7-8-x with the thumb free to mute the low E. Strike it on one, let it ring, play the riff in eighths under your palm.' },
    { ...voodoo, id: 'x5', wants: ['bend', 'pull'], title: '5. Minor over major', part: 'Pentatonic riff with the octave drop', blend: 'rhythm', seed: 3, tempo: 76,
      blurb: 'The E minor pentatonic over E7♯9: bend the 4th to the 5th and let it back, pull off to the ♭3, land on the root. The ♭3 against the chord’s major 3rd is the point.' },
    { ...blues, id: 'x6', wants: ['trill'], title: '6. The 9th chord and the trill', part: '9th chords with the trill', blend: 'rhythm', seed: 2, tempo: 54,
      blurb: 'The grip slid in from a fret below on three, the 3rd trilled against the 4th on the way to the IV. Keep the triplets lazy.' },
    { ...blues, id: 'x7', wants: ['bend'], title: '7. The bends: a step, a step and a half', part: 'Vocal blues lead (major and minor mixed)', blend: 'lead', seed: 4, tempo: 52,
      blurb: 'The 4th to the 5th (a whole step) shaken; the 4th to the 6th (a step and a half). Match the pitch to the fretted note first, then add the wrist.' },
    { ...fuzz, id: 'x8', wants: ['unison', 'slide'], title: '8. The unison bend and the climb', part: 'Fuzz lead over the vamp', blend: 'lead', seed: 12, window: windowAt(12), tempo: 84,
      blurb: 'The B string bent a whole tone to the note held on the E string, rough then smooth; then the slide up into the box above and the drop back.' },
    { ...funk, id: 'x9', wants: ['wah'], title: '9. The wah with the pick', part: 'Sixteenth scratch with the wah', blend: 'rhythm', seed: 4, tempo: 88,
      blurb: 'Sixteen muted strokes a bar, toe down on the downstrokes, heel on the upstrokes; the chord lands on the "and of 2".' },
    { ...cycle, id: 'x10', title: '10. The walk-up, root to root', part: 'Thumb chords and the walk-up', blend: 'rhythm', seed: 1, tempo: 66, preset: HEY_JOE,
      blurb: 'Root, 3rd, 4th, 5th on the low strings into each new chord. Say the next root as you land on it.' },
  ];

  // whole forms: the changes from the songs, a part realised over them
  const STUDIES = [
    { id: 'st1', wants: ['lead'], title: 'Study in E minor: the ballad', feel: 'Soul ballad (chord melody)', part: 'Thumb bass and the split chord', key: 'E', mode: 'minor', tempo: 70, blend: 'mixed', seed: 31, window: windowAt(0), reading: 'scale', preset: preset('Soul ballad (Little Wing)'),
      chords: ['Em', 'G', 'Am', 'Em', 'Bm', 'Bb', 'Am', 'C', 'G', 'F', 'C', 'D'].map(name => ({ name })),
      blurb: 'The twelve bars Little Wing runs on — the minor key’s own chords, the B♭ a tritone from the tonic, the ♭II — with the split-chord part over them and its lead lines rolled in. Follow the thumb.' },
    { id: 'st2', wants: ['lead'], title: 'Study in E: the fuzz vamp', feel: 'Fuzz riff (the Hendrix chord)', part: '7♯9 stabs and the riff', key: 'E', tempo: 108, blend: 'mixed', seed: 17, window: E_FUZZ, reading: 'penta', preset: preset('Fuzz vamp (Purple Haze)'),
      chords: [{ name: 'E7#9', bars: 2 }, { name: 'G' }, { name: 'A' }],
      blurb: 'I7♯9–♭III–IV, twice: the Hendrix chord as home, the two major chords a minor third and a fourth above it.' },
    { id: 'st3', wants: ['lead'], title: 'Study in B: twelve slow bars', feel: 'Slow blues in 12/8 (Red House way)', part: 'Call and answer (stabs and licks)', key: 'B', tempo: 60, blend: 'mixed', seed: 5, window: windowAt(7), reading: 'penta', preset: preset('Slow blues in 12/8 (Red House)'),
      chords: [{ name: 'B7', bars: 4 }, { name: 'E9', bars: 2 }, { name: 'B7', bars: 2 }, { name: 'F#7' }, { name: 'E9' }, { name: 'B7' }, { name: 'F#7' }],
      blurb: 'The Red House form, the IV as a 9th, the turnaround on the last two bars. Stabs, licks and room.' },
    { id: 'st4', wants: ['lead'], title: 'Study in E: the cycle', feel: 'Cycle of fourths (Hey Joe way)', part: 'Thumb chords and the walk-up', key: 'E', tempo: 82, blend: 'mixed', seed: 1, window: windowAt(0), reading: 'penta', preset: HEY_JOE,
      chords: [{ name: 'C' }, { name: 'G' }, { name: 'D' }, { name: 'A' }, { name: 'E', bars: 2 }],
      blurb: 'C–G–D–A–E and round again, the walk-up landing on every new root.' },
    { id: 'st5', wants: ['lead'], title: 'Study in C: the funk', feel: 'Funk rock (Band of Gypsys)', part: 'Single-note funk riff with muted ghosts', key: 'C', tempo: 104, blend: 'mixed', seed: 6, window: windowAt(8), reading: 'penta', preset: preset('Funk (Freedom)'),
      chords: [{ name: 'C' }, { name: 'Eb' }, { name: 'C7' }, { name: 'F7' }],
      blurb: 'The Freedom changes, the riff doubling the bass, the lead lines in the fill bars.' },
    { id: 'st6', wants: ['lead'], title: 'Study in A: the R&B ballad', feel: 'Rhythm & blues (Wait Until Tomorrow way)', part: 'Hammered double stops between the chords', key: 'A', tempo: 84, blend: 'mixed', seed: 12, window: windowAt(5), reading: 'scale', preset: preset('R&B ballad (Bold as Love)'),
      positions: { A: 5, E: 0, 'F#m': 2, D: 5, 'F#': 2, G: 3 },
      chords: [{ name: 'A' }, { name: 'E' }, { name: 'F#m' }, { name: 'D' }, { name: 'E' }, { name: 'F#' }, { name: 'G' }, { name: 'A' }],
      blurb: 'The Bold as Love verse and its way into the chorus — the VI major and the ♭VII — with the hand rolling through each shape between the chords, and fills in the fill bars.' },
    { id: 'st7', wants: ['lead'], title: 'Study in A: the waltz', feel: 'Rolling waltz (Manic Depression way)', part: 'Unison riff with the bass', key: 'A', tempo: 140, blend: 'mixed', seed: 9, window: windowAt(5), reading: 'penta', preset: preset('Waltz riff (Manic Depression)'),
      positions: { A: 5, G: 3, D: 5, 'D#': 6, E: 7 },
      chords: [{ name: 'A' }, { name: 'G' }, { name: 'D' }, { name: 'D#' }, { name: 'E' }, { name: 'A' }, { name: 'G' }, { name: 'D' }, { name: 'D#' }, { name: 'E' }],
      blurb: 'The Manic Depression climb — A, G, D, the chromatic step to E — twice round, the riff in unison with the bass and the triplet lines rolled in.' },
    { id: 'st8', wants: ['lead'], title: 'Study in E: the one-chord vamp', feel: 'One-chord voodoo (wah and pentatonic)', part: 'Pentatonic riff with the octave drop', key: 'E', tempo: 88, blend: 'mixed', seed: 5, window: E_FUZZ, reading: 'penta', preset: preset('One-chord vamp (Voodoo Child)'),
      chords: [{ name: 'E7#9', bars: 8 }],
      blurb: 'Eight bars on the one chord: the riff with the octave drop, the 7♯9 stabs, the machine-gun lines in the fill bars. The band is the whole harmony; the guitar is free to be the voice.' },
    { id: 'st9', wants: ['lead'], title: 'Study in F: chromatic soul', feel: 'Soul ballad (chord melody)', part: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)', key: 'F', tempo: 78, blend: 'mixed', seed: 14, window: windowAt(1), reading: 'scale', preset: preset('Chromatic soul (The Wind Cries Mary)'),
      positions: { C: 3, Bb: 1, F: 1, G: 3, Db: 4 },
      chords: [{ name: 'C' }, { name: 'Bb' }, { name: 'F', bars: 2 }, { name: 'G' }, { name: 'Bb' }, { name: 'Db' }, { name: 'F' }],
      blurb: 'The Wind Cries Mary verse — C, B♭, F, the G and the B♭ on the way round, the D♭ — with the 6ths slid in and the hammer-ons rolling through each shape.' },
    { id: 'st10', wants: ['lead'], title: 'Study in G: the Mixolydian ballad', feel: 'Soul ballad (chord melody)', part: 'Thumb bass and the split chord', key: 'G', tempo: 76, blend: 'mixed', seed: 8, window: windowAt(3), reading: 'scale', preset: preset('Mixolydian ballad (Castles Made of Sand)'),
      positions: { G: 3, D: 5, F: 1, C: 3 },
      chords: [{ name: 'G' }, { name: 'D' }, { name: 'F' }, { name: 'C' }, { name: 'G' }, { name: 'D' }, { name: 'F' }, { name: 'C' }],
      blurb: 'The Castles Made of Sand chorus twice round: the thumb chords and the split chord over I, V, ♭VII and IV, the F the key doesn’t own, the fills rolled in.' },
    { id: 'st11', wants: ['lead'], title: 'Study in C♯ minor: minor rock', feel: 'Soul ballad (chord melody)', part: 'Thumb bass and the split chord', key: 'C#', mode: 'minor', tempo: 112, blend: 'mixed', seed: 11, window: windowAt(9), reading: 'scale', preset: preset('Minor rock (All Along the Watchtower)'),
      positions: { 'C#m': 9, B: 7, A: 5 },
      chords: [{ name: 'C#m' }, { name: 'B' }, { name: 'A' }, { name: 'B' }, { name: 'C#m' }, { name: 'B' }, { name: 'A' }, { name: 'B' }],
      blurb: 'The Watchtower changes — i, VII, VI, VII — as thumb barres walking down from the 9th fret, the split chord and its colours over each, the lines from the C♯ minor box in the fill bars.' },
  ];

  // ---- the songs ----
  const SONGS = [
    { title: 'Little Wing', listen: ['The intro: the thumb bass on one, the D–G–B triad after it, and the hammered 4th and 9th', 'Where the sixteenths swing and where they straighten, phrase to phrase', 'The bar of 2/4 that shortens the form', 'The Leslie on the solo, a speaker turning'], linkKey: 'E', linkMode: 'minor', bpm: 70, album: 'Axis: Bold as Love, 1967', key: 'E minor (fingered), 70–72 BPM, 4/4 with one bar of 2/4', preset: 'Soul ballad (Little Wing)',
      what: 'Em–G–Am–Em–Bm–B♭–Am–C–G–Fadd9–C–D: the minor key’s chords with a B♭ a tritone from the tonic and an F a semitone above it. The intro is the chord-melody at its purest — thumb bass, the split chord, the hammered 4ths and 9ths, double stops from the pentatonic, and a swing that moves phrase to phrase (Mermikides measures it between even and heavily swung). Recorded in E♭; the rhythm guitar with the pickup between neck and middle, the lead through a Leslie; Hendrix called it "a very, very simple Indian style".',
      cites: '[1] [3] [8]', tab: UG + 'little-wing-tabs-31788', tab2: 'https://www.songsterr.com/a/wsa/jimi-hendrix-little-wing-tab-s22572' },
    { title: 'The Wind Cries Mary', listen: ['The 6th hammered onto the 5th on the B string, through every chord of the verse', 'The chromatic climb of the intro, E♭ to E to F', 'The solo in the F major pentatonic at the 12th, with double stops'], linkKey: 'F', bpm: 78, album: 'Are You Experienced, 1967', key: 'F major (fingered)', preset: 'Chromatic soul (The Wind Cries Mary)',
      what: 'E♭5–E5–F5 up the neck a fret at a time to open, then C–B♭–F in the verse, G and B♭ on the way round, A♭ and D♭ in the solo. The 6th embellishment on the E shape is the rhythm part; the solo is the F major pentatonic in 12th position with double stops. Billy Cox names Mayfield as the influence.',
      cites: '[15c] [16c] [10b]', tab: UG + 'the-wind-cries-mary-tabs-64118' },
    { title: 'Castles Made of Sand', listen: ['The intro shape of stacked fifths sliding along the neck', 'The F in the chorus — the ♭VII — and how the melody sits on it', 'The backwards guitar in the solo'], linkKey: 'G', bpm: 76, album: 'Axis: Bold as Love, 1967', key: 'G major (Mixolydian), fingered', preset: 'Mixolydian ballad (Castles Made of Sand)',
      what: 'G–D–F–C in the chorus — the F is the ♭VII, so the key is G Mixolydian — with F, Am and Em7 in the verses. The intro slides a shape of stacked fifths along the neck; the last chord of the intro is only Gs and Ds, doubled, and reads as more than its two pitch classes. The solo is backwards guitar. Cox and the critics hear Mayfield in it.',
      cites: '[1] [13] [7]', tab: UG + 'castles-made-of-sand-tabs-982787' },
    { title: 'Bold as Love', listen: ['The E shape embellished with the thumb over, chord by chord', 'The VI major and the ♭VII on the way into the chorus', 'The phased drums of the coda'], linkKey: 'A', bpm: 84, album: 'Axis: Bold as Love, 1967', key: 'A major (fingered), heard in A♭', preset: 'R&B ballad (Bold as Love)',
      what: 'A–E–F♯m–D in the verse, E–F♯–G–A into the chorus with a VI major and a ♭VII, a "masterclass in chordal embellishment" on the E shape with the thumb. The coda is the first phased drums on a record.',
      cites: '[32] [11] [9b]', tab: UG + 'bold-as-love-tabs-718945', tab2: 'https://www.songsterr.com/a/wsa/jimi-hendrix-bold-as-love-chords-s22542' },
    { title: 'Hey Joe', listen: ['The bass walking root, 3rd, 4th, 5th into every new chord, and the 5th becoming the next root', 'The guitar doubling that walk, and the double stops answering the voice', 'The solo from the E minor blues scale at the 12th'], linkKey: 'E', bpm: 82, album: 'single, 1966', key: 'E major with borrowed chords, about 82 BPM', preset: 'Cycle of fourths (Hey Joe)',
      what: 'C–G–D–A–E, each chord a fourth below the last, the circle of fifths read backwards, two bars of E at the end. The bass walks root, 3rd, 4th, 5th into each new chord and the 5th is the new root; the guitar doubles that walk in places and answers the vocal with double stops. The solo is the E minor blues scale at the 12th fret. Modelled on Tim Rose’s slow arrangement of Billy Roberts’ song.',
      cites: '[15] [9c]', tab: UG + 'hey-joe-tabs-59' },
    { title: 'Purple Haze', listen: ['The intro: E against B♭, a tritone repeated, not resolved', 'The E7♯9 as home in the verse', 'The solo in E Dorian over the power chords, through the Octavia', 'The riff doubled with the bass, muted between the notes'], linkKey: 'E', bpm: 108, album: 'Are You Experienced, 1967', key: 'E (fingered), about 108 BPM', preset: 'Fuzz vamp (Purple Haze)',
      what: 'The intro locks E against B♭ — a tritone, repeated rather than resolved; the verse is E7♯9–G–A; the solo runs Dorian over E5, F♯5 and D5 through the Octavia. The E7♯9 is an all-interval tetrachord: every interval class in four notes. The riff is the E minor pentatonic with the ♭5, muted, doubled with the bass.',
      cites: '[1] [4b] [15b]', tab: UG + 'purple-haze-tabs-25' },
    { title: 'Foxy Lady', listen: ['The feedback the song opens on, from vibrato alone', 'The 7♯9 riff played without its major 3rd', 'The solo: bends and slides in the blues scale'], linkKey: 'Gb', bpm: 116, album: 'Are You Experienced, 1967', key: 'F♯ (fingered), F♯ Dorian by one analysis', preset: 'One-chord vamp (Voodoo Child)',
      what: 'Feedback summoned "from thin air by just vibrato alone", then the F♯7♯9 riff — played without its major 3rd here — and a solo of bent notes and slides in the blues scale. The ending’s IV chord was Noel Redding’s idea.',
      cites: '[16] [1]', tab: UG + 'foxy-lady-tabs-28416' },
    { title: 'Voodoo Child (Slight Return)', listen: ['The intro: dead strings and the wah, clean, before the fuzz', 'The riff: the 4th on the G string bent to the 5th and released, the pull-off to the open G', 'The 7♯9 stabs between phrases', 'The pinch harmonic held on a fixed wah while the pickup selector is toggled'], linkKey: 'E', bpm: 88, album: 'Electric Ladyland, 1968', key: 'E (fingered), about 88 BPM', preset: 'One-chord vamp (Voodoo Child)',
      what: 'A wah-wah intro of muted strings on a clean tone ("a West African even-before-Bo-Diddley beat"), then the fuzz and the riff: the 4th on the G string bent to the 5th and released, the pull-off to the open G, the E7♯9 stabs. All the lead work is E minor pentatonic over E major and E7♯9. Mermikides: a pinch harmonic held on a fixed wah gliding through the blue 5th while the pickup selector is toggled in rhythm.',
      cites: '[4] [17] [1]', tab: UG + 'voodoo-child-slight-return-tabs-326654' },
    { title: 'Red House', listen: ['The diminished chord it opens on', 'The 7th and 9th grips in the comp, slid in from a fret below', 'The lead: bends, glissandos, jumps and drops, in 12/8', 'The IV as a 9th chord'], linkKey: 'B', bpm: 66, album: 'Are You Experienced, 1967', key: 'B (fingered; heard in B♭), 12/8, 66 BPM', preset: 'Slow blues in 12/8 (Red House)',
      what: 'A twelve-bar slow blues opening on a diminished 7th, the IV as E9, the V as F♯7; the comp is the 7th and 9th grips, the lead "packed solid with vocalisms" — bends, glissandos, jumps, drops. Written from Albert King’s "Travelin’ to California" and Elmore James’s "The Sky Is Crying"; Noel Redding played a tuned-down hollow-body as the bass.',
      cites: '[6] [16b] [19]', tab: UG + 'red-house-tabs-14113' },
    { title: 'Machine Gun', listen: ['One descending riff and bass line, held for a jam', 'The feedback shaped into helicopters and shellfire', 'The Uni-Vibe riff that is the machine gun'], album: 'Band of Gypsys, 1970 (live, Fillmore East)', key: 'E minor, a core descending riff', preset: null,
      what: 'A jam on one descending riff and bass line, the guitar through wah, Fuzz Face, Uni-Vibe and Octavia, feedback shaped into helicopters and shellfire, the Uni-Vibe riff a machine gun. Hanford’s dissertation reads it as "a unique fusion of traditional blues and electronic sound painting".',
      cites: '[11b] [2] [21]', tab: UG + 'machine-gun-tabs-372266' },
    { title: 'Manic Depression', listen: ['Three to the bar with a triplet inside each beat', 'The riff in unison with the bass, up the A string in quarters and then eighths', 'The chromatic step from D♯ to E'], linkKey: 'A', bpm: 140, album: 'Are You Experienced, 1967', key: 'A (fingered), 3/4 with a triplet feel', preset: 'Waltz riff (Manic Depression)',
      what: 'A–G–D–D♯–E with a parallel guitar and bass line; Mitchell built the drum part on Ronnie Stephenson’s "African Waltz", a churning triplet feel "that could just as easily be transcribed in 9/8". The riff runs quarter notes up the A string, then eighths.',
      cites: '[12b] [22] [18]', tab: UG + 'manic-depression-tabs-11736' },
    { title: 'All Along the Watchtower', listen: ['The intro slide from the 10th to the 12th fret and the whole-tone bends with vibrato', 'The C♯m voiced as C♯m7 to free the pinky', 'The solos from the C♯ minor blues scale at the 9th with Dorian notes, unison bends among them'], linkKey: 'C#', linkMode: 'minor', bpm: 112, album: 'Electric Ladyland, 1968', key: 'C♯ minor (fingered; heard in C minor)', preset: 'Minor rock (All Along the Watchtower)',
      what: 'C♯m–B–A–B, two beats each, the C♯m often voiced as C♯m7 to free the pinky; the intro slides from the 10th to the 12th fret and bends whole tones with vibrato; the solos come from the C♯ minor blues scale at the 9th with Dorian notes, unison bends, half-, whole- and step-and-a-half bends and a "floaty" vibrato.',
      cites: '[15d] [10]', tab: UG + 'all-along-the-watchtower-tabs-49' },
    { title: 'Wait Until Tomorrow', listen: ['The licks between the chords — hammer-ons and pull-offs at the 9th to 11th frets', 'The bass-and-guitar duet that is the core riff', 'The Cropper likeness: the chord on the beat, the fill after it'], linkKey: 'E', bpm: 118, album: 'Axis: Bold as Love, 1967', key: 'E (fingered; heard in E♭), about 118 BPM', preset: 'Fuzz vamp (Purple Haze)',
      what: 'A/E and G/E in the intro, E–G–A in the chorus, "lots of licks in between the chords" — hammer-ons and pull-offs at the 9th to 11th frets — a bass-and-guitar duet as the core riff, "stylistically similar to Steve Cropper".',
      cites: '[14] [11]', tab: UG + 'wait-until-tomorrow-tabs-11764' },
    { title: 'Freedom', listen: ['The intro: two chords and a walking lick on the low E and A strings', 'C to E♭, the ♭III, and the 7ths of C7 and F7', 'The jazz colour in the solo'], linkKey: 'C', bpm: 104, album: 'The Cry of Love, 1971', key: 'C (fingered), E♭ tuning', preset: 'Funk (Freedom)',
      what: 'C, E♭, C7 and F7; the intro is two chords and a walking lick on the low E and A strings; the solo shows "jazz harmonic sensibility". The last year’s funk, with Billy Cox on bass.',
      cites: '[19] [3]', tab: UG + 'freedom-tabs-395814' },
    { title: 'Spanish Castle Magic', listen: ['Guitar and bass in unison on the riff', 'The open strings inside the power chords', 'The bends in the solo, and the double stop it ends on'], album: 'Axis: Bold as Love, 1967', key: 'descending power chords, heard a half-step down', preset: null,
      what: 'Guitar and bass in unison on the riff — which "locks up a song in a strong rhythmic voice" — open strings inside the power chords, jazz chords overdubbed on piano, a solo of "a large number of note bends" ending on "a crazy double-stop".',
      cites: '[13b]', tab: UG + 'spanish-castle-magic-tabs-83455' },
  ];
  // the song's changes in Jam: the preset by name, in the song's key
  const presetLink = s => {
    const hendrix = GT.progressionPresets.find(p => p.name === 'Hendrix');
    const v = hendrix && hendrix.variants.find(x => x.name === s.preset);
    if (!v || !s.linkKey) return '';
    const p = new URLSearchParams();
    p.set('k', `${s.linkMode || 'major'}:${s.linkKey}`);
    p.set('pr', `Hendrix|${s.preset}`);
    if (s.bpm) p.set('t', String(s.bpm));
    return `index.html#jam?${p.toString()}`;
  };
  function renderSongs(){
    $('songs').innerHTML = SONGS.map(s => `
      <div class="song"><h4>${esc(s.title)}</h4>
        <p class="facts">${esc(s.album)} · ${esc(s.key)}</p>
        <p>${esc(s.what)} <span class="cite">${esc(s.cites)}</span></p>
        ${s.listen ? `<p class="listen-lbl">What to listen for</p><ul class="listen">${s.listen.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <p class="links">${s.tab ? `<a href="${s.tab}">Ultimate Guitar tab</a>` : ''}${s.tab2 ? ` · <a href="${s.tab2}">Songsterr</a>` : ''}${presetLink(s) ? ` · <a href="${presetLink(s)}">the changes in Jam →</a>` : ''}</p>
      </div>`).join('');
  }

  // ---- the sources ----
  const SOURCES = [
    ['src-gresham', '1', 'Mermikides, M. (2025). <b>"Just Ask the Axis: Jimi Hendrix Unpicked"</b>, Gresham College lecture transcript, 20 March 2025. Read.', 'https://www.gresham.ac.uk/sites/default/files/transcript/2025-02-25_1307_Mermikides-T.pdf'],
    ['src-hanford', '2', 'Hanford, J. C. (2003). <b>"With the power of soul: Jimi Hendrix in Band of Gypsys"</b>, PhD dissertation, University of Washington. Abstract and description read; the full text (51 MB) was downloaded but had no extractable text.', 'https://digital.lib.washington.edu/researchworks/items/98cb7e1f-4526-46cf-aaf3-ed28a1ecf35f'],
    ['src-storey', '3', 'Storey, A. (2014). <b>Jimi Hendrix playing analysis</b> (Licentiate thesis, London College of Music). Read. Also: Wikipedia, <b>"Little Wing"</b> (key, tempo, form, Leslie, the Mayfield blueprint). Read.', 'https://arronstorey.com/jimi-hendrix-playing-analysis/'],
    ['src-wiki-voodoo', '4', 'Wikipedia, <b>"Voodoo Child (Slight Return)"</b>. Read. [4b] Wikipedia, <b>"Purple Haze"</b> (the tritone intro, E7♯9, the verse chords, the Octavia). Read.', 'https://en.wikipedia.org/wiki/Voodoo_Child_(Slight_Return)'],
    ['src-wiki-7s9', '5', 'Wikipedia, <b>"Dominant seventh sharp ninth chord"</b>. Read.', 'https://en.wikipedia.org/wiki/Dominant_seventh_sharp_ninth_chord'],
    ['src-red-house', '6', 'Wikipedia, <b>"Red House (song)"</b> (key, 12/8, the tuning, the opening chord, Albert King and Elmore James). Read. [6b] Guitar Player, <b>"Jimi Hendrix: The Five Rules of His Powerful Rhythm Style"</b>. Two rules read; the rest truncated.', 'https://en.wikipedia.org/wiki/Red_House_(song)'],
    ['src-pg-mayfield', '7', 'Premier Guitar, <b>"Digging Deeper: Curtis Mayfield"</b> and <b>"Forgotten Heroes: Curtis Mayfield"</b> (the F♯ tuning, sliding 6ths and 4ths, rolling hammer-ons, Cox on Hendrix). Read. [7b] Premier Guitar, <b>"Hendrix Rhythms Made Easy"</b>. Read.', 'https://www.premierguitar.com/digging-deeper-curtis-mayfield'],
    ['src-happy', '8', 'Happy Bluesman, <b>"Jimi Hendrix Rhythm Guitar: 3 Steps to Blur the Lines Between Rhythm and Lead"</b> (the D–G–B triad, the pinky’s sus4, 6 and add9, the thumb). Read.', 'https://happybluesman.com/jimi-hendrix-rhythm-guitar-3-steps-mix-rhythm-and-lead/'],
    ['src-blackstar', '9', 'Blackstar Amps, <b>"Mixing Rhythm &amp; Lead — Hendrix Style Embellishments"</b> (the chords as triads on D, G and B with the thumb; each chord’s pentatonic box). Read. [9b] Wikipedia, <b>"Bold as Love (song)"</b>. Read. [9c] Wikipedia, <b>"Hey Joe"</b>. Read.', 'https://blackstaramps.com/lessons/mixing-rhythm-lead-hendrix-style-embellishments/'],
    ['src-musicradar-lead', '10', 'MusicRadar, <b>"The ultimate Jimi Hendrix lead guitar lesson"</b> (unison bends, staccato and catch bends, the wrist vibrato, the E Dorian drone, the wah). Read. [10b] MusicRadar, <b>"Learn the ultimate Jimi Hendrix rhythm guitar chord lesson"</b>. Read.', 'https://www.musicradar.com/how-to/the-ultimate-jimi-hendrix-lead-guitar-lesson'],
    ['src-pickup', '11', 'Pickup Music, <b>"Hendrix CAGED"</b> (the course’s shape-by-shape map to the records). Read. [11b] Wikipedia, <b>"Machine Gun (Jimi Hendrix song)"</b>. Read.', 'https://www.pickupmusic.com/guitar/guitar-classes/hendrix-caged'],
    ['src-thumb', '12', 'guitarwiz.app, <b>"Thumb-Over Guitar Technique: The Hendrix Approach to Chord Grips"</b>. Read. [12b] Wikipedia, <b>"Manic Depression (song)"</b>. Read.', 'https://guitarwiz.app/articles/thumb-over-guitar-technique/'],
    ['src-castles', '13', 'Wikipedia, <b>"Castles Made of Sand (song)"</b>. Read. [13b] Wikipedia, <b>"Spanish Castle Magic"</b>. Read.', 'https://en.wikipedia.org/wiki/Castles_Made_of_Sand_(song)'],
    ['src-wait', '14', 'Wikipedia, <b>"Wait Until Tomorrow"</b>. Read.', 'https://en.wikipedia.org/wiki/Wait_Until_Tomorrow'],
    ['src-mac-heyjoe', '15', 'MacLennan, J., <b>Hey Joe guitar lesson</b> (the open chords, the walk, the E minor blues scale at the 12th). Read. [15b] <b>Purple Haze guitar lesson</b>. Read. [15c] <b>Wind Cries Mary guitar lesson</b>. Read. [15d] <b>All Along the Watchtower guitar lesson</b>. Read.', 'https://www.jonmaclennan.com/blog/hey-joe-guitar-lesson'],
    ['src-wiki-foxy', '16', 'Wikipedia, <b>"Foxy Lady"</b>. Read. [16b] guitarclub.io, <b>"Red House"</b> lesson (the twelve bars with 7ths and 9ths, B minor and major pentatonic layered). Read. [16c] guitarclub.io, <b>"The Wind Cries Mary"</b> lesson. Read.', 'https://en.wikipedia.org/wiki/Foxy_Lady'],
    ['src-riffninja', '17', 'Riff Ninja, <b>"Voodoo Child Guitar Lesson"</b> (E♭ tuning, the minor-third lick, the bend-release-pull-off, Eaug9, E minor pentatonic over major chords). Read. [17b] Ultimate Guitar wiki, <b>Voodoo Child (Slight Return)</b>. Summary.', 'https://www.riffninja.com/voodoo-child-guitar-lesson/'],
    ['src-guitarcontrol', '18', 'Guitar Control, <b>"How to Play Manic Depression"</b> (3/4, the riff up the A string, the picking). Read.', 'https://guitarcontrol.com/how-to-play-manic-depression/'],
    ['src-wiki-jimi', '19', 'Wikipedia, <b>"Jimi Hendrix"</b> (the Isley Brothers, Little Richard, Don Covay, King Curtis, the effects). Read. Also Texas Blues Alley, <b>Red House 3:01</b>, <b>Killing Floor intro</b> and <b>Freedom intro chords</b> lesson pages (key and tuning notes). Read.', 'https://en.wikipedia.org/wiki/Jimi_Hendrix'],
    ['src-fender', '20', 'Fender, <b>"Purple Reign: The Hendrix Chord"</b>. Summary only (the page refused the tools); the Isleys’ "Testify" and "Taxman" history is also in [5].', 'https://www.fender.com/articles/chords/purple-reign-the-hendrix-chord'],
    ['src-cox', '21', 'Rock Cellar Magazine, <b>"Remembering Jimi Hendrix and the Band of Gypsys: Q&amp;A with Billy Cox"</b>. Read. Mitchell’s Mayfield remark is quoted in the search summary of the Vintage Guitar Curtis Mayfield feature and Guitar World’s Woodstock piece (summary).', 'https://rockcellarmagazine.com/billy-cox-interview-jimi-hendrix-band-of-gypsys-woodstock/'],
    ['src-drum', '22', 'DRUM! Magazine, <b>"Mitch Mitchell: Transcription &amp; Analysis"</b>. Read. Also PS Audio, <b>"The Jimi Hendrix Experience: The Other Two Guys"</b>. Read.', 'https://drummagazine.com/mitch-mitchell-transcription-analysis/'],
    ['src-osu', '23', 'The Ohio State University, AAEP 1600, <b>"Jimi Hendrix"</b> chapter. Read. Berklee College of Music, <b>ENRK-204 The Music of Jimi Hendrix</b>, course page. Read.', 'https://aaep1600.osu.edu/book/09_Hendrix.php'],
    ['src-cambridge', '24', 'Herbst, J.-P. and Waksman, S. (eds.) (2024). <b>The Cambridge Companion to the Electric Guitar</b>, Part III "Musical Style and Technique". Abstract only.', 'https://www.cambridge.org/core/books/abs/cambridge-companion-to-the-electric-guitar/musical-style-and-technique/3E904834A028EA69A785CD7F1C46FA99'],
    ['src-obrecht', '25', 'Obrecht, J., <b>"How Jimi Learned to Play Guitar Pt. 1"</b>, Line 6 blog. Read.', 'https://blog.line6.com/2022/06/01/jas-obrecht-how-jimi-learned-to-play-guitar-pt-1-earliest-music-first-guitars/'],
    ['src-kramer', '26', 'Best Classic Bands, <b>"Jimi Hendrix Engineer Eddie Kramer Remembers"</b>. Read.', 'https://bestclassicbands.com/eddie-kramer-jimi-hendrix-interview-9-21-22/'],
    ['src-aadl', '27', 'Ann Arbor District Library, <b>"Interview: Jimi Hendrix"</b>, Ann Arbor Sun, September 1967. Read.', 'https://aadl.org/node/192571'],
    ['src-truefire', '28', 'TrueFire blog, <b>"Jimi Hendrix: All the Way to Ladyland"</b> and <b>"Mastering Hendrix Guitar Techniques"</b>. Read. Also learningtoplaytheguitar.net, <b>"7 Essential Jimi Hendrix Guitar Techniques"</b>. Read.', 'https://blog.truefire.com/guitar-lessons/jimi-hendrix-ladyland/'],
    ['src-cropper', '29', '<b>"How to Play Like Steve Cropper"</b>, Guitar Player feature as a lesson PDF on the Savonia University of Applied Sciences course blog. Read.', 'https://blogi.savonia.fi/afroblues/wp-content/uploads/sites/7040/2019/11/Steve-Cropper.pdf'],
    ['src-gwu', '30', 'George Washington University Law School, Music Copyright Infringement Resource, <b>"Chord"</b>. Read. [30b] Structured Asset Sales v. Sheeran, Second Circuit 2024, via Rolling Stone and Copyright Lately (summaries); Local 802 AFM, <b>"Can you copyright a chord progression?"</b>. Read.', 'https://blogs.law.gwu.edu/mcir/2018/12/20/chord/'],
    ['src-hein', '31', 'Hein, E., <b>"Jimi Hendrix, electronic musician"</b>. Read.', 'https://ethanhein.substack.com/p/jimi-hendrix-electronic-musician'],
    ['src-songsterr', '32', 'Songsterr, <b>Bold as Love</b> (chords by section) and <b>Ezy Ryder</b> (chords). Read. Ultimate Guitar tab pages: linked; the tool could not read them.', 'https://www.songsterr.com/a/wsa/jimi-hendrix-bold-as-love-chords-s22542'],
    ['src-hooktheory', '33', 'Hooktheory, <b>Crosstown Traffic</b> analysis (C Dorian, 115 BPM). Summary only; the page refused the tools. Guitar World’s lessons on Hendrix’s rhythm and lead playing were likewise behind a wall and are not relied on.', 'https://www.hooktheory.com/theorytab/view/jimi-hendrix/crosstown-traffic'],
  ];
  function renderSources(){
    $('sources').innerHTML = SOURCES.map(([id, num, text, url]) => `<li id="${id}" value="${num}">${text} <a href="${url}">${url}</a></li>`).join('');
  }

  // ---- the page ----
  const LISTS = { changes: () => CHANGES, scales: () => DRILLS, rhythm: () => RHYTHM, lead: () => LEAD, mixed: () => MIXED, exercises: () => EXERCISES, studies: () => STUDIES };
  function renderCards(){
    Object.keys(LISTS).forEach(id => { $(id).innerHTML = ''; LISTS[id]().forEach(ex => card($(id), ex)); });
  }
  // The contents, in the margin. The section on screen is marked as you
  // go, and opens to list what's in it — its sub-headings and the names of
  // its examples — with the one nearest the top marked too.
  // the contents fold away for a wider tab and neck; remembered
  const TOC_KEY = 'gt.hendrixToc';
  function bindTocFold(){
    const btn = document.getElementById('tocFold');
    const page = document.querySelector('.page');
    if (!btn || !page) return;
    const apply = folded => {
      page.classList.toggle('toc-folded', folded);
      btn.textContent = folded ? '›' : '‹';
      btn.title = folded ? 'Show the contents' : 'Fold the contents away for a wider tab';
      btn.setAttribute('aria-expanded', String(!folded));
    };
    let folded = false;
    try { folded = localStorage.getItem(TOC_KEY) === '1'; } catch (e) { /* no storage */ }
    apply(folded);
    btn.addEventListener('click', () => {
      folded = !folded;
      try { localStorage.setItem(TOC_KEY, folded ? '1' : '0'); } catch (e) { /* no storage */ }
      apply(folded);
      if (playing()) stop();
      renderCards();                   // the tabs are drawn to their width, which just changed
    });
  }
  function renderToc(){
    const sections = [...document.querySelectorAll('section.part')];
    const html = sections.map(s => {
      const items = [...s.querySelectorAll('h3, article.ex > .ex-head h4, .neck-fig h4')].map(h => {
        const holder = h.closest('article.ex') || h.closest('.neck-fig') || h;
        if (!holder.id) holder.id = `${s.id}-${h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 60);
        return `<a class="sub${h.tagName === 'H3' ? ' head' : ''}" href="#${holder.id}">${esc(h.textContent.replace(/^\d+\.\s*/, ''))}</a>`;
      }).join('');
      return `<div class="entry" data-for="${s.id}"><a href="#${s.id}">${esc(s.querySelector('h2').textContent.replace(/^\d+\.\s*/, ''))}</a>${items ? `<div class="subs">${items}</div>` : ''}</div>`;
    }).join('');
    $('toc').innerHTML = html;
    const entries = new Map([...$('toc').querySelectorAll('.entry')].map(e => [e.dataset.for, e]));
    let ticking = false;
    const mark = () => {
      ticking = false;
      const line = Math.min(160, window.innerHeight * 0.3);
      let current = sections[0];
      sections.forEach(s => { if (s.getBoundingClientRect().top <= line) current = s; });
      entries.forEach((e, id) => e.classList.toggle('active', id === current.id));
      // ...and within it, the item nearest the top
      const entry = entries.get(current.id);
      const subs = [...entry.querySelectorAll('.sub')];
      let near = null;
      subs.forEach(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t && t.getBoundingClientRect().top <= line + 40) near = a; });
      subs.forEach(a => a.classList.toggle('active', a === near));
      // keep the marked item in view in the column
      const lit = near || entry.querySelector('a');
      const col = $('toc').closest('.side');
      if (lit && col && col.scrollHeight > col.clientHeight){
        const r = lit.getBoundingClientRect(), cr = col.getBoundingClientRect();
        if (r.top < cr.top + 20 || r.bottom > cr.bottom - 20) col.scrollTop += r.top - cr.top - cr.height / 2;
      }
    };
    window.addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(mark); } }, { passive: true });
    mark();
  }
  function render(){
    renderGrips();
    renderScaleNecks();
    renderCards();
    renderSongs();
    renderSources();
  }
  // the space bar: in the full-window view it plays and stops that example;
  // on the page it stops whatever is playing
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat || /input|select|textarea/i.test(e.target.tagName)) return;
    e.preventDefault();
    const bigPlay = big.open && big.querySelector('article.ex .play');
    if (bigPlay){ bigPlay.click(); return; }
    if (playing()){ stop(); return; }
    // nothing playing: the example with the most of itself on screen
    const vh = window.innerHeight;
    let best = null, most = 0;
    document.querySelectorAll('article.ex').forEach(art => {
      const r = art.getBoundingClientRect();
      const seen = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (seen > most){ most = seen; best = art; }
    });
    if (best) best.querySelector('.play').click();
  });
  render();
  renderToc();
  bindTocFold();
  bindCountIn();
  // the tab is built to the width; redrawn when that changes, and not on a
  // resize that changed nothing, since a redraw stops what's playing
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; if (playing()) stop(); renderCards(); if (bigEx) openBig(bigEx); } }, 200);
  });

  GT.hendrixGuide = { CHANGES, DRILLS, RHYTHM, LEAD, MIXED, EXERCISES, STUDIES, SONGS, SOURCES, GRIPS, jamLink, drillsLink, openLink, realiseExample, chordNeck, scaleNeck, gripSVG };
})();
