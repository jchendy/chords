// The machinery every style deep dive shares (hendrix.html, psychobilly.html
// — js/hendrix-guide.js and js/psychobilly-guide.js hold the pages' own
// data): the links into the jam and drills tabs, the examples realised from
// a genre's parts and drawn as cards with their neck, fingering, count-in,
// expand and print, the grips drawn, the scale figures and drills, the songs
// and sources rendered, the contents in the margin and its fold, the space
// bar. A page calls GT.deepDive.create(config) with its style, its lists and
// its data; the helpers a page's figures and drills are written with come
// back on the api, and so do the card builder and the examples by id, which
// the course view (js/course.js) draws its pieces with. Nothing here is played from a recording: every tab on a
// deep dive is the engine realising a part of the library.
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
  const windowAt = (min, span = 3) => ({ min, max: min + span });

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
  const helpers = { figure, boxMarkers, pcs, DEG, pcOf, cellKey, chordNeck, scaleNeck, neckSVG, boxAt, fingersOf, PENTA_MINOR, PENTA_MAJOR, DORIAN, MIXO,
                    pentaBoxPlacements, scaleBoxPlacements, cagedPlacements, arpeggioCells, CAGED_MAJOR, CAGED_MINOR, CAGED_COLORS, STRING_MIDI, SEMITONE,
                    chordFromName, displayName, chordPcs, drill, upAndDown, byPitch, withFx, cell, midiOf, esc };
  // config: { style, presetName, prefix, homeWindow(key), gripGroups, figures(helpers), lists, songs, sources }
  function create(config){
  const STYLE = config.style;
  const feels = STYLES[STYLE].variants;
  const feelByLabel = label => feels.find(f => f.label === label);
  const feelIndex = label => feels.findIndex(f => f.label === label);
  const homeWindow = config.homeWindow;
  // what the reader chose is remembered per page: the neck, the fingering,
  // the count-in, the contents fold
  const prefKey = k => `gt.${config.prefix}${k[0].toUpperCase()}${k.slice(1)}`;
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
    const win = ex.window || homeWindow(ex.key);
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
    // the hand moving with the chords goes along: an example with `positions`
    // sends the drills tab one position for each chord of the drill (the
    // thumb barre walking Em open, G at the 3rd, Am at the 5th), which it
    // reads as `pos=0,3,5,0` — not the one position the drill was written
    // with (B81)
    if (d.d === 'changes' && ex.positions && d.ch){
      const tonicPc = SEMITONE[ex.key] % 12;
      const list = String(d.ch).split(',').map(raw => {
        const n = raw.trim();
        let at = positionOf(ex, displayName(chordFromName(n, tonicPc, ex.mode || 'major')));
        if (at == null) at = positionOf(ex, n);
        return at != null ? at : (d.pos != null ? d.pos : (ex.window || homeWindow(ex.key)).min);
      });
      p.set('pos', list.every(x => x === list[0]) ? String(list[0]) : list.join(','));
    }
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
  const optsFor = ex => ({ reading: ex.reading || 'penta', window: ex.window || homeWindow(ex.key), scaleTheory: ex.mode === 'minor' ? 'modal' : 'parallel',
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
  // a lead part stays in its box. A position is looked up by the chord's
  // name with its accidentals read either way (B♭7 and Bb7 are one chord).
  const plainName = n => String(n).replace(/♭/g, 'b').replace(/♯/g, '#');
  function positionOf(ex, name){
    if (!ex.positions) return null;
    const want = plainName(name);
    const key = Object.keys(ex.positions).find(k => plainName(k) === want);
    return key == null ? null : ex.positions[key];
  }
  function barsOf(ex, chords){
    const moving = ex.positions && ex.blend !== 'lead' && !ex.build;
    return chords.map(chord => {
      const at = moving ? positionOf(ex, displayName(chord)) : null;
      return at != null ? { chord, window: windowAt(at) } : { chord };
    });
  }
  const windowOfBar = (ex, bars, b) => (bars && bars[b] && bars[b].window) || ex.window || homeWindow(ex.key);
  const unionWindow = (ex, bars) => {
    const wins = (bars || []).map((b, i) => windowOfBar(ex, bars, i));
    if (!wins.length) return ex.window || homeWindow(ex.key);
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
  const FINGERS_KEY = prefKey('fingers');
  const fingersPref = () => { try { return localStorage.getItem(FINGERS_KEY) === '1'; } catch (e) { return false; } };
  const saveFingersPref = v => { try { localStorage.setItem(FINGERS_KEY, v ? '1' : '0'); } catch (e) { /* no storage */ } };
  const NECK_KEY = prefKey('neck');
  const neckPref = () => { try { return localStorage.getItem(NECK_KEY) || ''; } catch (e) { return ''; } };
  const saveNeckPref = v => { try { localStorage.setItem(NECK_KEY, v); } catch (e) { /* no storage */ } };
  function card(host, ex, cfg = {}){
    const art = document.createElement('article');
    art.className = 'ex' + (cfg.big ? ' big' : '');
    art.id = ex.id;
    const r = realiseExample(ex);
    // the link opens at the card's own tempo — what its Play plays — with
    // the practice tempo said beside it, to slow down to
    const exForLink = { ...ex, seed: r ? r.seed : ex.seed };
    const link = openLink(exForLink);
    const kind = ex.build ? 'drill' : ex.blend === 'lead' ? 'lead' : ex.blend === 'rhythm' ? 'rhythm' : 'mixed';
    const mode0 = cfg.neck || neckPref() || ex.neckDefault || 'off';
    const show = { fingers: cfg.fingers != null ? !!cfg.fingers : fingersPref() };
    const level = r ? difficultyOf(r.notes, ex) : '';
    const swung = r && r.feel.swing ? `<span>${r.feel.grid === 12 ? 'triplet feel' : 'sixteenths swung'}</span>` : '';
    art.innerHTML = `
      <div class="ex-head"><div><h4>${esc(ex.title)}</h4>
        <div class="meta"><span>${esc(ex.feel)}</span>${ex.part ? `<span>${esc(ex.part)}</span>` : ''}<span>${esc(ex.key)} ${ex.mode === 'minor' ? 'minor' : 'major'}</span><span>${ex.tempo} BPM · start at ${practiceTempo(ex)}</span>${swung}<span>${kind}</span>${level ? `<span class="chip ${level}">${level}</span>` : ''}</div></div>
        <span class="btns"><span class="seg neck-seg" role="group" aria-label="Neck"><span class="lbl">Neck</span>${['off', 'chords', 'scale'].map(v => `<button type="button" data-value="${v}"${v === mode0 ? ' class="active"' : ''}>${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</span><span class="seg fingers-seg"><button type="button" class="fingers${show.fingers ? ' active' : ''}" aria-pressed="${show.fingers}" title="A chord diagram at each change of grip, a finger number over each note">Fingering</button></span><button type="button" class="play">Play</button><a class="drill" href="${link}">${openText(ex)} →</a><button type="button" class="drill print" title="Just the tab, with its title, in a new tab for printing">Print</button>${cfg.big ? '<button type="button" class="drill close-big">Close ✕</button>' : '<button type="button" class="drill expand" title="The example large, tab and neck side by side">Expand ⤢</button>'}${GT.favourites ? '<button type="button" class="drill star" aria-pressed="false">☆</button>' : ''}</span></div>
      <p class="blurb">${ex.blurb}</p>
      <div class="body"><div class="tab"></div><div class="neck" hidden></div></div>
      ${ex.refs ? `<p class="refs">${ex.refs}</p>` : ''}`;
    host.appendChild(art);
    // the star: this card, by its id on its page, whichever copy of it was starred
    if (GT.favourites){
      const baseId = ex.id.replace(/-(course|big)$/, '');
      GT.favourites.star(art.querySelector('.star'), () => ({ id: `dive:${config.prefix}:${baseId}`, kind: 'dive', title: ex.title.replace(/^\d+\.\s*/, ''),
        sub: `${config.presetName} · ${ex.feel} · ${ex.key} ${ex.mode === 'minor' ? 'minor' : 'major'} · ${ex.tempo} BPM`, href: `${config.prefix}.html#${baseId}` }));
    }
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
    art.querySelector('.print').addEventListener('click', () => GT.tabPrint.open({ title: ex.title, meta: [...art.querySelectorAll('.meta span')].map(s => s.textContent).join(' · '), example: tabHost._tabExample }));
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
  const COUNT_KEY = prefKey('countIn');
  const countInOn = () => { try { return localStorage.getItem(COUNT_KEY) === '1'; } catch (e) { return false; } };
  const setCountIn = v => { try { localStorage.setItem(COUNT_KEY, v ? '1' : '0'); } catch (e) { /* no storage */ } const box = document.getElementById('countInToggle'); if (box) box.checked = !!v; };
  function bindCountIn(){
    const box = document.getElementById('countInToggle');
    if (!box) return;
    box.checked = countInOn();
    box.addEventListener('change', () => setCountIn(box.checked));
  }

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
    $('grips').innerHTML = config.gripGroups.map(({ core, variations }) => `
      <div class="grip-group${variations.length ? ' has-vars' : ''}">
        <div class="grip-core"><p class="grip-kicker">Core shape</p>${gripCard(core)}</div>
        ${variations.length ? `<div class="grip-vars"><p class="grip-kicker">Variations — the same hand, one finger moved</p><div class="grips">${variations.map(v => gripCard(v, 'grip var')).join('')}</div></div>` : ''}
      </div>`).join('');
  }

  // the song's changes in Jam: the preset by name, in the song's key
  const presetLink = s => {
    const hendrix = GT.progressionPresets.find(p => p.name === config.presetName);
    const v = hendrix && hendrix.variants.find(x => x.name === s.preset);
    if (!v || !s.linkKey) return '';
    const p = new URLSearchParams();
    p.set('k', `${s.linkMode || 'major'}:${s.linkKey}`);
    p.set('pr', `${config.presetName}|${s.preset}`);
    if (s.bpm) p.set('t', String(s.bpm));
    return `index.html#jam?${p.toString()}`;
  };
  function renderSongs(){
    $('songs').innerHTML = config.songs.map(s => `
      <div class="song"><h4>${esc(s.title)}</h4>
        <p class="facts">${esc(s.album)} · ${esc(s.key)}</p>
        <p>${esc(s.what)} <span class="cite">${esc(s.cites)}</span></p>
        ${s.listen ? `<p class="listen-lbl">What to listen for</p><ul class="listen">${s.listen.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <p class="links">${s.tab ? `<a href="${s.tab}">Ultimate Guitar tab</a>` : ''}${s.tab2 ? ` · <a href="${s.tab2}">Songsterr</a>` : ''}${presetLink(s) ? ` · <a href="${presetLink(s)}">the changes in Jam →</a>` : ''}</p>
      </div>`).join('');
  }

  function renderSources(){
    $('sources').innerHTML = config.sources.map(([id, num, text, url]) => `<li id="${id}" value="${num}">${text} <a href="${url}">${url}</a></li>`).join('');
  }

  // ---- the page ----
  const LISTS = config.lists;
  // the examples by id, the same objects each time (an example remembers
  // the seed it found for its blurb), for the page and for the course
  const EXAMPLES = new Map();
  Object.keys(LISTS).forEach(id => LISTS[id]().forEach(ex => EXAMPLES.set(ex.id, ex)));
  const exampleById = id => EXAMPLES.get(id) || null;
  function renderCards(){
    Object.keys(LISTS).forEach(id => { $(id).innerHTML = ''; LISTS[id]().forEach(ex => card($(id), EXAMPLES.get(ex.id) || ex)); });
  }
  // The contents, in the margin. The section on screen is marked as you
  // go, and opens to list what's in it — its sub-headings and the names of
  // its examples — with the one nearest the top marked too.
  // the contents fold away for a wider tab and neck; remembered
  const TOC_KEY = prefKey('toc');
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
    $('scaleNecks').innerHTML = config.figures(helpers).join('');
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
  // the tab is built to the width; redrawn when that changes, and not on a
  // resize that changed nothing, since a redraw stops what's playing
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; if (playing()) stop(); renderCards(); if (bigEx) openBig(bigEx); } }, 200);
  });


  return { helpers, jamLink, drillsLink, openLink, realiseExample, chordNeck, scaleNeck, gripSVG, feelByLabel, feelIndex,
           windowAt, card, exampleById, renderCards, countInOn, setCountIn, prefKey,
           init(){
             render(); renderToc(); bindTocFold(); bindCountIn();
             if (GT.sync){ const top = document.querySelector('.top'); if (top){ const wrap = document.createElement('span'); wrap.id = 'signWrap'; wrap.hidden = true; top.appendChild(wrap); GT.sync.signButton(wrap); } }
             if (GT.favourites){
               GT.favourites.linkFromPage();
               // a card starred in one place (the course's copy, the large view) is starred in every copy
               GT.favourites.onChange(() => document.querySelectorAll('article.ex .star').forEach(b => { if (b._paintStar) b._paintStar(); }));
             }
           } };
  }

  GT.deepDive = { create, helpers };
})();
