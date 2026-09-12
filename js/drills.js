// The drills tab: exercises for the hands — chord changes, scale shapes,
// picking speed, string crossing, arpeggios — each written for the key,
// tempo, scale, shapes and position you choose, drawn as tab with the neck
// following, and played over a click. Built from what the jam tab plays
// with: fretboard.js for the shapes and boxes, neck.js and neck-follow.js
// for the neck, tab.js for the tab, the example player for the sound and
// the follower. The generators are pure and exported, so the tests can
// realise a drill and count.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, chordPcs, SEMITONE, MAJOR_KEYS, MINOR_KEYS, buildDiatonicChords } = GT.theory;
  const { realise } = GT.parts;
  const F = GT.fretboard;
  const { STRING_MIDI, CAGED_ORDER, cagedPlacements, seventhCells, susCells, pentaBoxPlacements, scaleBoxPlacements, arpeggioCells, FRET_COUNT } = F;
  const NF = GT.neckFollow;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---- what can be drilled ----
  const SCALES = [
    { id: 'minorpenta', name: 'Minor pentatonic', ivs: [0, 3, 5, 7, 10], minor: true, penta: true, chord: 'm' },
    { id: 'majorpenta', name: 'Major pentatonic', ivs: [0, 2, 4, 7, 9], minor: false, penta: true, chord: '' },
    { id: 'blues',      name: 'Blues',            ivs: [0, 3, 5, 6, 7, 10], minor: true, penta: true, extra: [6], chord: '7' },
    { id: 'major',      name: 'Major',            ivs: [0, 2, 4, 5, 7, 9, 11], minor: false, chord: '' },
    { id: 'minor',      name: 'Minor (Aeolian)',  ivs: [0, 2, 3, 5, 7, 8, 10], minor: true, chord: 'm' },
    { id: 'dorian',     name: 'Dorian',           ivs: [0, 2, 3, 5, 7, 9, 10], minor: true, chord: 'm7' },
    { id: 'mixolydian', name: 'Mixolydian',       ivs: [0, 2, 4, 5, 7, 9, 10], minor: false, chord: '7' },
    { id: 'phrygian',   name: 'Phrygian',         ivs: [0, 1, 3, 5, 7, 8, 10], minor: true, chord: 'm' },
    { id: 'lydian',     name: 'Lydian',           ivs: [0, 2, 4, 6, 7, 9, 11], minor: false, chord: 'maj7' },
  ];
  const KINDS = {
    changes:  { name: 'Chord changes',  what: 'the grips of a progression, struck in time, so the hand learns to land each change on the beat' },
    scale:    { name: 'Scale shapes',   what: 'a box of a scale up and down, or in a sequence, so the shape goes into the fingers' },
    picking:  { name: 'Picking speed',  what: 'a few notes a string, alternate-picked, up the box and down it — the speed comes from the evenness' },
    crossing: { name: 'String crossing', what: 'one note a string in a pattern that jumps strings, so the pick finds the next string without looking' },
    arpeggio: { name: 'Arpeggios',      what: 'the chord tones of each shape up and down, one chord after another, so the changes are heard as notes' },
  };
  const PATTERNS = { updown: 'Up and down', threes: 'In threes', fours: 'In fours', thirds: 'In thirds', boxes: 'Into the next box' };
  const CROSSINGS = { adjacent: 'String to string', skip: 'Skip one', outside: 'Outside in', pedal: 'Off the low string' };
  // The strumming patterns a change can be drilled with, written the way
  // the parts are (a strum: its slot on a sixteen grid, its length, its
  // weight, the part of the grip it wants — see docs/STYLES.md) and
  // realised by the same engine, so the thumb's bass note, the split chord
  // and a chord slid in from below come out as they do in a part. A page
  // can hand over a pattern of its own in the link (`pt`), which is how the
  // Hendrix deep dive keeps a part's rhythm when its changes open here.
  const st = (at, dur, vel, voicing = 'full', mute = null, x = {}) => ({ at, dur, vel, strum: true, voicing, mute: mute === 'mute', ...x });
  const STRUMS = {
    whole:     { name: 'Once a bar',        strums: [st(0, 16, 0.9)] },
    halves:    { name: 'Twice a bar',       strums: [st(0, 8, 0.9), st(8, 8, 0.8)] },
    quarters:  { name: 'Every beat',        strums: [st(0, 4, 0.9), st(4, 4, 0.75), st(8, 4, 0.85), st(12, 4, 0.75)] },
    eighths:   { name: 'Every eighth',      strums: [0, 2, 4, 6, 8, 10, 12, 14].map(at => st(at, 2, at % 4 ? 0.65 : 0.85)) },
    thumb:     { name: 'Thumb and split chord', strums: [st(0, 2, 0.9, 'bass'), st(2, 2, 0.8, 'mid'), st(4, 2, 0.85, 'bass'), st(6, 2, 0.8, 'mid'), st(8, 2, 0.9, 'bass'), st(10, 2, 0.8, 'mid'), st(12, 2, 0.85, 'bass'), st(14, 2, 0.8, 'mid')] },
    boomchick: { name: 'Boom-chick',        strums: [st(0, 4, 0.9, 'bass'), st(4, 4, 0.75, 'high'), st(8, 4, 0.85, 'fifth'), st(12, 4, 0.75, 'high')] },
    stabs:     { name: 'Stabs',             strums: [st(0, 3, 0.95), st(3, 1, 0.5, 'full', 'mute'), st(10, 2, 0.9), st(12, 4, 0.5, 'full', 'mute')] },
    chuck:     { name: 'Chuck (muted backbeat)', strums: [st(0, 2, 0.9, 'low'), st(4, 2, 0.7, 'high', 'mute'), st(8, 2, 0.9, 'low'), st(12, 2, 0.7, 'high', 'mute')] },
    slide:     { name: 'Slid in from below', strums: [st(0, 4, 0.9, 'full', null, { chordSlide: 1 }), st(6, 2, 0.7, 'high'), st(8, 4, 0.9, 'full', null, { chordSlide: 1 }), st(14, 2, 0.7, 'high')] },
  };
  // a pattern in a link: strums as at-voicing-length-weight, a suffix each
  // for muted (x), slid in (s), the next chord (n), an upstroke (u), and a
  // colour tone on top (a14), joined by commas
  const VOICING_LETTERS = { full: 'f', bass: 'b', fifth: '5', low: 'l', high: 'h', mid: 'm', power: 'p', shell: 's', ninth: '9', sharp9: '#' };
  const LETTER_VOICINGS = Object.fromEntries(Object.entries(VOICING_LETTERS).map(([k, v]) => [v, k]));
  function encodeStrums(strums){
    return strums.filter(w => w.strum).map(w => `${w.at}-${VOICING_LETTERS[w.voicing || 'full'] || 'f'}-${w.dur}-${Math.round((w.vel == null ? 0.8 : w.vel) * 10)}${w.mute ? 'x' : ''}${w.chordSlide ? 's' : ''}${w.next ? 'n' : ''}${w.stroke === 'up' ? 'u' : ''}${w.add ? 'a' + w.add : ''}`).join(',');
  }
  function decodeStrums(text){
    const out = [];
    String(text || '').split(',').forEach(tok => {
      const m = tok.match(/^(\d+)-([a-z0-9#])-(\d+)-(\d+)(x?)(s?)(n?)(u?)(?:a(\d+))?$/);
      if (!m) return;
      const w = { at: Number(m[1]), dur: Number(m[3]), vel: Math.min(1, Number(m[4]) / 10), strum: true, voicing: LETTER_VOICINGS[m[2]] || 'full', mute: !!m[5] };
      if (m[6]) w.chordSlide = 1;
      if (m[7]) w.next = true;
      if (m[8]) w.stroke = 'up';
      if (m[9]) w.add = Number(m[9]);
      if (w.at >= 0 && w.at < 16 && w.dur > 0) out.push(w);
    });
    return out.sort((a, b) => a.at - b.at);
  }
  const STRING_SETS = { all: 'All six', low: 'Bottom four', high: 'Top four', mid: 'Middle four' };
  const POSITIONS = [0, 2, 3, 5, 7, 9, 12];

  const pc = name => SEMITONE[name] % 12;
  const pcsOf = (root, ivs) => new Set(ivs.map(i => (root + i) % 12));
  const midiOf = c => STRING_MIDI[c.string] + c.fret;
  const byPitch = cells => cells.slice().sort((a, b) => midiOf(a) - midiOf(b) || b.string - a.string);
  const windowOf = cells => { const f = cells.map(c => c.fret); return { min: Math.min(...f), max: Math.max(...f) }; };
  const boxId = b => `${b.name}@${b.anchor}`;

  // The boxes a scale has on the neck, low to high: the pentatonic family's
  // from the pentatonic shapes (the blues scale's ♭5 added inside each box),
  // the seven-note scales' from the scale shapes. `shapes` narrows them to
  // some CAGED letters.
  function boxesFor(rootPc, scale, shapes){
    let boxes = scale.penta ? pentaBoxPlacements(rootPc, scale.minor) : scaleBoxPlacements(rootPc, scale.minor, pcsOf(rootPc, scale.ivs));
    boxes = boxes.filter(b => b.anchor >= 0 && b.anchor <= FRET_COUNT && b.cells.length >= 5 && (!shapes || shapes.has(b.name))).sort((a, b) => a.anchor - b.anchor);
    if (scale.extra){
      boxes = boxes.map(b => {
        const { min, max } = windowOf(b.cells);
        const extra = arpeggioCells(min, max, pcsOf(rootPc, scale.extra)).filter(c => !b.cells.some(x => x.string === c.string && x.fret === c.fret));
        return { ...b, cells: [...b.cells, ...extra] };
      });
    }
    return boxes;
  }

  // ---- the notes of a drill ----
  // `div` is notes a beat: 1, 2 and 4 on a sixteen grid (four, two and one
  // slots each), 3 on a twelve (one slot each — triplets).
  const gridFor = div => div === 3 ? 12 : 16;
  const stepFor = div => div === 3 ? 1 : 4 / div;
  // cells in order → notes `step` slots apart, each lasting to the next;
  // the last rings to the end of its bar
  function lay(cells, div, vel = 0.82){
    const grid = gridFor(div), step = stepFor(div);
    const notes = cells.map((c, i) => {
      const at = i * step, bar = Math.floor(at / grid);
      return { bar, at: at - bar * grid, dur: step, vel, string: c.string, fret: c.fret, midi: midiOf(c), ...(c.fx || {}) };
    });
    const last = notes[notes.length - 1];
    if (last) last.dur = grid - last.at;
    return notes;
  }
  const barsOf = notes => 1 + Math.max(0, ...notes.map(n => n.bar));
  const hold = (chord, bars) => Array.from({ length: bars }, () => chord);

  // sequence patterns over cells in pitch order, up and then down
  function sequence(up, pattern){
    const n = up.length, down = up.slice().reverse();
    if (pattern === 'threes' || pattern === 'fours'){
      const k = pattern === 'threes' ? 3 : 4, out = [];
      for (let i = 0; i + k <= n; i++) for (let j = 0; j < k; j++) out.push(up[i + j]);
      for (let i = 0; i + k <= n; i++) for (let j = 0; j < k; j++) out.push(down[i + j]);
      return out;
    }
    if (pattern === 'thirds'){
      const out = [];
      for (let i = 0; i + 2 < n; i++) out.push(up[i], up[i + 2]);
      for (let i = 0; i + 2 < n; i++) out.push(down[i], down[i + 2]);
      return out;
    }
    return [...up, ...down.slice(1)];
  }

  // the chord a scale drill sits on: the scale's own root chord
  const scaleChord = (o, scale) => chordFromName(o.tonic + scale.chord, o.tonicPc, o.mode);
  const chosenBox = (o, scale) => {
    const boxes = boxesFor(o.tonicPc, scale, o.shapes);
    if (!boxes.length) return { boxes, box: null, idx: -1 };
    let idx = boxes.findIndex(b => boxId(b) === o.box);
    if (idx < 0) idx = boxes.findIndex(b => b.name === String(o.box || '').split('@')[0]);
    if (idx < 0) idx = 0;
    return { boxes, box: boxes[idx], idx };
  };

  function scaleDrill(o){
    const scale = SCALES.find(s => s.id === o.scale) || SCALES[0];
    const { boxes, box, idx } = chosenBox(o, scale);
    if (!box) return null;
    const up = byPitch(box.cells);
    let cells, cellsShown = box.cells;
    if (o.pattern === 'boxes'){
      // up this box, a slide on the top string into the next one, and down it
      const next = boxes[idx + 1] || boxes[idx - 1];
      if (next){
        const there = byPitch(next.cells);
        const top = there[there.length - 1];
        cells = [...up, { ...top, fx: { slide: up[up.length - 1].fret } }, ...there.slice(0, -1).reverse(), up[0]];
        cellsShown = [...box.cells, ...next.cells];
      } else cells = sequence(up, 'updown');
    } else cells = sequence(up, o.pattern);
    const notes = lay(cells, o.div);
    const chord = scaleChord(o, scale);
    return { notes, chords: hold(chord, barsOf(notes)), window: windowOf(cellsShown), grid: gridFor(o.div),
             neck: { mode: 'scale', scale: { root: o.tonicPc, pcs: pcsOf(o.tonicPc, scale.ivs), name: `${o.tonic} ${scale.name.toLowerCase()}` } },
             brief: `${o.tonic} ${scale.name.toLowerCase()}, the ${box.name} shape at frets ${windowOf(box.cells).min}–${windowOf(box.cells).max}, ${PATTERNS[o.pattern] ? PATTERNS[o.pattern].toLowerCase() : 'up and down'}, ${o.div} ${o.div === 1 ? 'note' : 'notes'} a beat.` };
  }

  function pickingDrill(o){
    const scale = SCALES.find(s => s.id === o.scale) || SCALES[0];
    const { box } = chosenBox(o, scale);
    if (!box) return null;
    const perString = o.perString || 4;
    const byString = new Map();
    byPitch(box.cells).forEach(c => { if (!byString.has(c.string)) byString.set(c.string, []); byString.get(c.string).push(c); });
    const strings = [...byString.keys()].sort((a, b) => b - a);            // the low E first
    const run = s => { const cs = byString.get(s), out = []; for (let i = 0; i < perString; i++) out.push(cs[i % cs.length]); return out; };
    const upCells = strings.flatMap(run);
    const downCells = strings.slice().reverse().flatMap(s => run(s).slice().reverse());
    const cells = o.direction === 'up' ? upCells : o.direction === 'down' ? downCells : [...upCells, ...downCells];
    const notes = lay(cells, o.div);
    const chord = scaleChord(o, scale);
    return { notes, chords: hold(chord, barsOf(notes)), window: windowOf(box.cells), grid: gridFor(o.div),
             neck: { mode: 'scale', scale: { root: o.tonicPc, pcs: pcsOf(o.tonicPc, scale.ivs), name: `${o.tonic} ${scale.name.toLowerCase()}` } },
             brief: `${perString} notes a string, alternate-picked, ${o.direction === 'up' ? 'up' : o.direction === 'down' ? 'down' : 'up and down'} the ${box.name} shape of ${o.tonic} ${scale.name.toLowerCase()}, ${o.div} a beat. Down-up-down-up, and no louder on the way down.` };
  }

  // one note a string, in the pattern's order over the strings chosen
  // (each written so no string comes twice running, the loop's seam included)
  const CROSS_ORDER = {
    adjacent: n => { const o = []; for (let i = 0; i < n; i++) o.push(i); for (let i = n - 2; i > 0; i--) o.push(i); return o; },
    // 0 2 1 3 2 4 3 5, then 4 2 3 1 2 0 1
    skip:     n => { const o = []; for (let i = 0; i + 2 < n; i++) o.push(i, i + 2); for (let i = n - 2; i >= 2; i--) o.push(i, i - 2); if (n > 1) o.push(1); return o; },
    // 0 5 1 4 2 3, then the pairs back out but the innermost
    outside:  n => { const pairs = []; for (let i = 0, j = n - 1; i < j; i++, j--) pairs.push([i, j]); const o = pairs.flat(); if (n % 2) o.push((n - 1) / 2); pairs.slice(0, -1).reverse().forEach(pr => o.push(...pr)); return o; },
    pedal:    n => { const o = []; for (let i = 1; i < n; i++) o.push(0, i); for (let i = n - 2; i > 0; i--) o.push(0, i); return o; },
  };
  const STRINGS_OF = { all: [5, 4, 3, 2, 1, 0], low: [5, 4, 3, 2], high: [3, 2, 1, 0], mid: [4, 3, 2, 1] };
  function crossingDrill(o){
    const scale = SCALES.find(s => s.id === o.scale) || SCALES[0];
    const { box } = chosenBox(o, scale);
    if (!box) return null;
    const strings = STRINGS_OF[o.strings] || STRINGS_OF.all;
    // the lowest note the box has on each string
    const one = strings.map(s => byPitch(box.cells.filter(c => c.string === s))[0]).filter(Boolean);
    const order = (CROSS_ORDER[o.cross] || CROSS_ORDER.skip)(one.length);
    const cells = order.map(i => one[i]);
    const notes = lay(cells, o.div);
    const chord = scaleChord(o, scale);
    return { notes, chords: hold(chord, barsOf(notes)), window: windowOf(box.cells), grid: gridFor(o.div),
             neck: { mode: 'scale', scale: { root: o.tonicPc, pcs: pcsOf(o.tonicPc, scale.ivs), name: `${o.tonic} ${scale.name.toLowerCase()}` } },
             brief: `One note a string from the ${box.name} shape of ${o.tonic} ${scale.name.toLowerCase()}, ${(CROSSINGS[o.cross] || CROSSINGS.skip).toLowerCase()}, ${STRING_SETS[o.strings] ? STRING_SETS[o.strings].toLowerCase() : 'all six'} strings, ${o.div} a beat. Keep the pick moving the same way whatever string it lands on.` };
  }

  // ---- chords: the grips ----
  // the chords typed, or the key's own I–IV–V–I (i–iv–VII–i in minor)
  function chordsOf(o){
    const names = String(o.chords || '').split(/[\s,|]+/).filter(Boolean);
    let chords = names.map(n => chordFromName(n, o.tonicPc, o.mode)).filter(Boolean);
    if (!chords.length){
      const dia = buildDiatonicChords(o.mode, o.tonic);
      const picks = o.mode === 'major' ? [0, 3, 4, 0] : [0, 3, 6, 0];
      chords = picks.map(i => chordFromName(dia[i].name, o.tonicPc, o.mode));
    }
    return chords.slice(0, 12);
  }
  // the CAGED shape for a chord nearest the position asked for, among the
  // shapes allowed, with its 7th and its sus note
  function gripFor(chord, o){
    const rootPc = pc(chord.note), isMinor = chord.quality === 'min';
    // a 7♯9 or a 9th is its own grip (x-7-6-7-8-x, x-7-6-7-7-7), root on
    // the A string near the position: the one the parts engine plays
    if (!isMinor && chord.ext && (chord.ext.includes(3) || chord.ext.includes(2) || chord.ext.includes(14)) && (!o.shapes || o.shapes.has('A'))){
      const ninth = !chord.ext.includes(3);
      const g = GT.parts.sharp9Voicing(chord, { window: { min: Math.max(0, o.position - 1), max: Math.min(FRET_COUNT, o.position + 4) } }, ninth);
      if (g && g.length >= 4 && g.every(c => c.midi % 12 !== undefined)){
        const cells = g.map(c => ({ string: c.string, fret: c.fret })), fs = cells.map(c => c.fret);
        return { placement: { name: 'A', cells, given: true, meanFret: fs.reduce((a, b) => a + b, 0) / fs.length, fretMin: Math.min(...fs), fretMax: Math.max(...fs) }, cells };
      }
    }
    const all = cagedPlacements(rootPc, isMinor ? F.CAGED_MINOR : F.CAGED_MAJOR).filter(p => p.cells.length > 2 && (!o.shapes || o.shapes.has(p.name)));
    if (!all.length) return null;
    const placement = all.reduce((b, p) => Math.abs(p.meanFret - o.position) < Math.abs(b.meanFret - o.position) ? p : b);
    let cells = chord.seventh ? seventhCells(placement, rootPc, pc(chord.seventh)) : placement.cells.slice();
    if (chord.sus) cells = susCells(cells, rootPc, chord.sus);
    return { placement, cells: cells.map(c => ({ string: c.string, fret: c.fret })) };
  }
  // The changes: the pattern's strums realised by the parts engine over
  // the chords, in the chords reading with the hand at the position asked
  // for (four frets from it, the size of a hand) and only the shapes
  // allowed — so a bass note is the thumb's, a split chord the D, G and B
  // strings, a 7♯9 its own grip, a chord slid in from a fret below.
  function changesDrill(o){
    const chords = chordsOf(o);
    const grid = 16, barsEach = Math.max(1, Math.round((o.beats || 4) / 4));
    const strums = (o.custom && o.custom.length) ? o.custom : (STRUMS[o.strum] || STRUMS.quarters).strums;
    const part = { name: 'changes', figure: strums, variants: [], fills: [strums] };
    const bars = [];
    chords.forEach(chord => { for (let b = 0; b < barsEach; b++) bars.push({ chord }); });
    const win = { min: o.position, max: Math.min(FRET_COUNT, o.position + 3) };
    const opts = { reading: 'caged', window: win, scaleTheory: 'parallel', stayOnKey: false, key: { tonic: o.tonic, mode: o.mode }, tech: null, shapes: o.shapes };
    const notes = realise(part, bars, 1, opts, { grid }).filter(n => n.strum);
    if (!notes.length) return null;
    // for the neck: what each bar strikes, as the shape it is
    const grips = bars.map(({ chord }, bar) => {
      const struck = [...new Map(notes.filter(n => n.bar === bar).map(n => [`${n.string}:${n.fret}`, { string: n.string, fret: n.fret }])).values()];
      const named = gripFor(chord, o);
      const fs = struck.map(c => c.fret);
      return { placement: { name: named ? named.placement.name : 'E', cells: struck, given: true, meanFret: fs.length ? fs.reduce((a, b) => a + b, 0) / fs.length : o.position, fretMin: Math.min(...fs), fretMax: Math.max(...fs) }, cells: struck };
    });
    const all = windowOf(notes.map(n => ({ string: n.string, fret: n.fret })));
    const names = bars.map(b => displayName(b.chord)).filter((n, i, a) => i === 0 || n !== a[i - 1]).join(' – ');
    const how = o.custom && o.custom.length ? 'in the pattern the page sent' : (STRUMS[o.strum] ? STRUMS[o.strum].name.toLowerCase() : 'every beat');
    return { notes, chords: bars.map(b => b.chord), grips, window: { min: Math.min(win.min, all.min), max: Math.max(win.max, all.max) }, grid,
             neck: { mode: 'chords' },
             brief: `${names}, ${barsEach === 1 ? 'a bar' : barsEach + ' bars'} each, ${how}, the hand at fret ${o.position}. Land each change on the beat; the strum can be soft, the change can't be late.` };
  }

  function arpeggioDrill(o){
    const chords = chordsOf(o);
    const notes = [], out = [], grips = [];
    let bar = 0;
    chords.forEach(chord => {
      const grip = gripFor(chord, o);
      if (!grip) return;
      const p = grip.placement;
      const cells = byPitch(arpeggioCells(p.fretMin, Math.max(p.fretMax, p.fretMin + 3), new Set(chordPcs(chord))));
      const run = lay([...cells, ...cells.slice(0, -1).reverse()], o.div);
      const bars = barsOf(run);
      run.forEach(n => notes.push({ ...n, bar: n.bar + bar }));
      for (let b = 0; b < bars; b++){ out.push(chord); grips[bar + b] = grip; }
      bar += bars;
    });
    if (!out.length) return null;
    const win = windowOf(notes.map(n => ({ string: n.string, fret: n.fret })));
    return { notes, chords: out, grips, window: win, grid: gridFor(o.div), neck: { mode: 'chords' },
             brief: `The chord tones of each shape up and down — ${out.filter((c, i) => i === 0 || displayName(c) !== displayName(out[i - 1])).map(displayName).join(', ')} — around fret ${o.position}, ${o.div} a beat. Hear the change as the notes that move.` };
  }

  const GENERATORS = { changes: changesDrill, scale: scaleDrill, picking: pickingDrill, crossing: crossingDrill, arpeggio: arpeggioDrill };
  // everything a drill is made from, in one object the generators read
  function realiseDrill(state){
    const o = { ...state, tonicPc: pc(state.tonic), shapes: state.shapes && state.shapes.size < 5 ? state.shapes : null };
    const gen = GENERATORS[state.kind] || scaleDrill;
    const d = gen(o);
    if (!d) return null;
    d.feel = { label: KINDS[state.kind].name, grid: d.grid, beats: 4 };
    return d;
  }

  // ---- the page ----
  const state = { kind: 'scale', mode: 'major', tonic: 'A', tempo: 80, div: 2, scale: 'minorpenta', pattern: 'updown', shapes: new Set(CAGED_ORDER), box: '',
                  chords: '', beats: 4, strum: 'quarters', custom: null, cross: 'skip', strings: 'all', perString: 4, direction: 'updown', position: 5, comp: false, neck: true };
  const KEYS = { d: 'kind', k: null, t: 'tempo', v: 'div', sc: 'scale', p: 'pattern', sh: null, b: 'box', ch: 'chords', bt: 'beats', st: 'strum', cr: 'cross', ss: 'strings', ps: 'perString', dir: 'direction', pos: 'position', comp: null, nk: null };
  function shareState(){
    const p = new URLSearchParams();
    p.set('d', state.kind);
    p.set('k', `${state.mode}:${state.tonic}`);
    p.set('t', String(state.tempo));
    if (state.div !== 2) p.set('v', String(state.div));
    if (state.kind === 'scale' || state.kind === 'picking' || state.kind === 'crossing'){
      p.set('sc', state.scale);
      if (state.box) p.set('b', state.box);
      if (state.kind === 'scale' && state.pattern !== 'updown') p.set('p', state.pattern);
      if (state.kind === 'picking'){ if (state.perString !== 4) p.set('ps', String(state.perString)); if (state.direction !== 'updown') p.set('dir', state.direction); }
      if (state.kind === 'crossing'){ if (state.cross !== 'skip') p.set('cr', state.cross); if (state.strings !== 'all') p.set('ss', state.strings); }
    } else {
      if (state.chords.trim()) p.set('ch', state.chords.trim().split(/[\s,|]+/).join(','));
      if (state.kind === 'changes'){
        if (state.beats !== 4) p.set('bt', String(state.beats));
        if (state.custom && state.custom.length) p.set('pt', encodeStrums(state.custom));
        else if (state.strum !== 'quarters') p.set('st', state.strum);
      }
      if (state.position !== 5) p.set('pos', String(state.position));
    }
    if (state.shapes.size < 5) p.set('sh', CAGED_ORDER.filter(n => state.shapes.has(n)).join(''));
    if (state.comp) p.set('comp', '1');
    if (!state.neck) p.set('nk', '0');
    return p;
  }
  function applyState(p){
    if (!p.get('d') && !p.get('k')) return false;
    if (KINDS[p.get('d')]) state.kind = p.get('d');
    const [mode, tonic] = (p.get('k') || '').split(':');
    if ((mode === 'major' && MAJOR_KEYS[tonic]) || (mode === 'minor' && MINOR_KEYS[tonic])){ state.mode = mode; state.tonic = tonic; }
    if (p.get('t')) state.tempo = Math.max(40, Math.min(208, Number(p.get('t')) || 80));
    // a field the link leaves out is at its default — a link lands the same
    // way on a fresh page and on one somebody has been playing with
    const num = (k, allowed, def) => allowed.includes(Number(p.get(k))) ? Number(p.get(k)) : def;
    const one = (k, allowed, def) => allowed.includes(p.get(k)) ? p.get(k) : def;
    state.div = num('v', [1, 2, 3, 4], 2);
    state.scale = one('sc', SCALES.map(s => s.id), 'minorpenta');
    state.pattern = one('p', Object.keys(PATTERNS), 'updown');
    state.box = p.get('b') || '';
    state.chords = (p.get('ch') || '').split(',').join(' ');
    state.beats = num('bt', [4, 8, 16], 4);
    state.strum = one('st', Object.keys(STRUMS), 'quarters');
    state.custom = p.get('pt') ? decodeStrums(p.get('pt')) : null;
    if (state.custom && !state.custom.length) state.custom = null;
    state.cross = one('cr', Object.keys(CROSSINGS), 'skip');
    state.strings = one('ss', Object.keys(STRING_SETS), 'all');
    state.perString = num('ps', [2, 3, 4, 6], 4);
    state.direction = one('dir', ['up', 'down', 'updown'], 'updown');
    state.position = num('pos', POSITIONS, 5);
    state.shapes = new Set(p.get('sh') ? CAGED_ORDER.filter(n => p.get('sh').includes(n)) : CAGED_ORDER);
    if (!state.shapes.size) state.shapes = new Set(CAGED_ORDER);
    state.comp = p.get('comp') === '1';
    state.neck = p.get('nk') !== '0';
    return true;
  }
  const writeState = () => GT.tabs.setState('drills', shareState().toString());

  let drill = null, metrics = null, card = null, neckState = { geo: null, drawn: null };
  let big = null, expanded = false, cardHome = null;      // the full-window view, and where the card came from
  const player = () => GT.examplePlayer;
  const playingHere = () => player().playing() && player().playing().card === card;

  function buildKeys(){
    const grp = (label, table, mode) => `<optgroup label="${label}">${Object.keys(table).map(t => `<option value="${mode}:${t}">${t}${mode === 'minor' ? ' minor' : ''}</option>`).join('')}</optgroup>`;
    $('drillKey').innerHTML = grp('Major keys', MAJOR_KEYS, 'major') + grp('Minor keys', MINOR_KEYS, 'minor');
  }
  function buildBoxes(){
    const scale = SCALES.find(s => s.id === state.scale) || SCALES[0];
    const boxes = boxesFor(pc(state.tonic), scale, state.shapes.size < 5 ? state.shapes : null);
    const sel = $('drillBox');
    const wanted = state.box;
    sel.innerHTML = boxes.map(b => { const w = windowOf(b.cells); return `<option value="${boxId(b)}">${b.name} shape · frets ${w.min}–${w.max}</option>`; }).join('');
    // the same box if it is still there, else the same shape letter, else the first
    let pick = boxes.find(b => boxId(b) === wanted) || boxes.find(b => b.name === String(wanted).split('@')[0]) || boxes[0];
    state.box = pick ? boxId(pick) : '';
    sel.value = state.box;
  }
  function syncUI(){
    const seg = (id, value) => $(id).querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.value === String(value)));
    seg('drillKindGroup', state.kind);
    $('drillKey').value = `${state.mode}:${state.tonic}`;
    $('drillTempo').value = String(state.tempo); $('drillTempoOut').textContent = String(state.tempo);
    seg('drillDivGroup', state.div);
    $('drillScale').value = state.scale;
    seg('drillPatternGroup', state.pattern);
    $('drillShapesGroup').querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', state.shapes.has(b.dataset.value)));
    buildBoxes();
    $('drillPos').value = String(state.position);
    $('drillChords').value = state.chords;
    $('drillBeats').value = String(state.beats);
    const strumSel = $('drillStrum');
    strumSel.innerHTML = (state.custom ? '<option value="custom">From the page</option>' : '') + Object.entries(STRUMS).map(([id, x]) => `<option value="${id}">${x.name}</option>`).join('');
    strumSel.value = state.custom ? 'custom' : state.strum;
    seg('drillCrossGroup', state.cross);
    $('drillStrings').value = state.strings;
    seg('drillPerStringGroup', state.perString);
    seg('drillDirGroup', state.direction);
    $('drillComp').checked = state.comp;
    $('drillNeckToggle').checked = state.neck;
    // the rows a kind uses
    const k = state.kind, scaleKind = k === 'scale' || k === 'picking' || k === 'crossing';
    $('drillChordsRow').hidden = scaleKind;
    $('drillBeatsField').hidden = k !== 'changes'; $('drillStrumField').hidden = k !== 'changes';
    $('drillDivField').hidden = k === 'changes';
    $('drillScaleRow').hidden = !scaleKind;
    $('drillPatternField').hidden = k !== 'scale';
    $('drillPickRow').hidden = k !== 'picking';
    $('drillCrossRow').hidden = k !== 'crossing';
    $('drillBoxField').hidden = !scaleKind;
    $('drillPosField').hidden = scaleKind;
    $('drillKindWhat').textContent = KINDS[k].what;
  }

  function drawNeck(bar){
    const host = $('drillNeck');
    if (!drill || !state.neck){ host.hidden = true; neckState.drawn = null; return; }
    const chord = drill.chords[((bar || 0) % drill.chords.length + drill.chords.length) % drill.chords.length];
    const key = `${displayName(chord)}|${bar in (drill.grips || {}) ? boxId(drill.grips[bar].placement) : ''}`;
    if (neckState.drawn === key) return;
    neckState.drawn = key;
    if (!neckState.geo) neckState.geo = NF.neckGeometry(drill.window, drill.notes);
    const played = [...new Map(drill.notes.filter(n => n.bar === bar).map(n => [NF.cellKey(n), { string: n.string, fret: n.fret }])).values()];
    const { markers, lines, what } = drill.neck.mode === 'chords'
      ? NF.chordNeck(chord, drill.window, played, drill.grips && drill.grips[bar] ? drill.grips[bar].placement : null)
      : NF.scaleNeck(chord, { scale: drill.neck.scale }, drill.window, played);
    host.hidden = false;
    host.innerHTML = `<p class="neck-title">${esc(what)}</p>${NF.neckSVG(neckState.geo, markers, lines, expanded ? 1.8 : 1)}`;
  }
  // the same drill drawn again to its width — the card moved into the
  // full-window view or back — without stopping what's playing
  function redraw(){
    if (!drill) return;
    metrics = player().drawTab($('drillTab'), drill.feel, drill.chords, drill.notes);
    if (playingHere()) player().playing().metrics = metrics;
    neckState = { geo: null, drawn: null };
    drawNeck(playingHere() ? (player().playing().shownBar || 0) : 0);
  }
  // ---- the drill, large ----
  // The card itself moves into a full-window dialog — its buttons, the
  // player's hold on it and all — and moves back when the view closes.
  function expand(){
    if (expanded || !card) return;
    if (!big){
      big = document.createElement('dialog');
      big.className = 'big';
      document.body.appendChild(big);
      big.addEventListener('close', collapse);
      big.addEventListener('click', e => { if (e.target === big) big.close(); });
    }
    cardHome = { parent: card.parentNode, next: card.nextSibling };
    expanded = true;
    big.appendChild(card);
    $('drillExpand').hidden = true; $('drillClose').hidden = false;
    if (!big.open) big.showModal();
    redraw();
  }
  function collapse(){
    if (!expanded) return;
    expanded = false;
    if (big && big.open) big.close();
    if (cardHome) cardHome.parent.insertBefore(card, cardHome.next);
    $('drillExpand').hidden = false; $('drillClose').hidden = true;
    redraw();
  }
  function render(){
    if (playingHere()) player().stop();
    drill = realiseDrill(state);
    neckState = { geo: null, drawn: null };
    const tabHost = $('drillTab');
    if (!drill){ tabHost.innerHTML = '<p class="drill-empty">Nothing to play here: no shape of that kind fits. Allow more shapes, or pick another key.</p>'; $('drillBrief').textContent = ''; $('drillNeck').hidden = true; return; }
    metrics = player().drawTab(tabHost, drill.feel, drill.chords, drill.notes);
    $('drillBrief').textContent = drill.brief;
    drawNeck(0);
  }
  function togglePlay(){
    if (playingHere()){ player().stop(); return; }
    if (!drill) return;
    player().play(card, 'click', drill.feel, drill.chords, drill.notes, state.tempo, metrics, { onBar: drawNeck, onStop: () => drawNeck(0), comp: state.comp });
  }

  function bind(){
    const onSeg = (id, key, parse = v => v) => $(id).addEventListener('click', e => {
      const b = e.target.closest('.seg-btn'); if (!b) return;
      state[key] = parse(b.dataset.value); syncUI(); writeState(); render();
    });
    onSeg('drillKindGroup', 'kind');
    onSeg('drillDivGroup', 'div', Number);
    onSeg('drillPatternGroup', 'pattern');

    onSeg('drillCrossGroup', 'cross');
    onSeg('drillPerStringGroup', 'perString', Number);
    onSeg('drillDirGroup', 'direction');
    $('drillShapesGroup').addEventListener('click', e => {
      const b = e.target.closest('.seg-btn'); if (!b) return;
      const name = b.dataset.value;
      if (state.shapes.has(name)){ if (state.shapes.size > 1) state.shapes.delete(name); } else state.shapes.add(name);
      syncUI(); writeState(); render();
    });
    const onSel = (id, key, parse = v => v) => $(id).addEventListener('change', () => { state[key] = parse($(id).value); syncUI(); writeState(); render(); });
    $('drillKey').addEventListener('change', () => { const [mode, tonic] = $('drillKey').value.split(':'); state.mode = mode; state.tonic = tonic; syncUI(); writeState(); render(); });
    onSel('drillScale', 'scale'); onSel('drillBox', 'box'); onSel('drillPos', 'position', Number); onSel('drillBeats', 'beats', Number); onSel('drillStrings', 'strings');
    // choosing a pattern of the tab's own lets go of the one the page sent
    $('drillStrum').addEventListener('change', () => { const v = $('drillStrum').value; if (v !== 'custom'){ state.strum = v; state.custom = null; } syncUI(); writeState(); render(); });
    $('drillChords').addEventListener('change', () => { state.chords = $('drillChords').value; writeState(); render(); });
    $('drillTempo').addEventListener('input', () => { state.tempo = Number($('drillTempo').value); $('drillTempoOut').textContent = String(state.tempo); if (playingHere()) player().playing().tempo = state.tempo; });
    $('drillTempo').addEventListener('change', writeState);
    $('drillComp').addEventListener('change', () => { state.comp = $('drillComp').checked; if (playingHere()) player().playing().hooks.comp = state.comp; writeState(); });
    $('drillNeckToggle').addEventListener('change', () => { state.neck = $('drillNeckToggle').checked; writeState(); drawNeck(playingHere() ? player().playing().shownBar || 0 : 0); });
    card.querySelector('.play').addEventListener('click', togglePlay);
    $('drillExpand').addEventListener('click', expand);
    $('drillClose').addEventListener('click', collapse);
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || e.repeat || $('page-drills').hidden || GT.keys.typing(e.target)) return;
      e.preventDefault(); togglePlay();
    });
    $('drillShare').addEventListener('click', async () => {
      writeState();
      try { await navigator.clipboard.writeText(location.href); $('drillShare').textContent = 'Copied'; setTimeout(() => { $('drillShare').textContent = 'Copy link'; }, 1200); } catch (e) { /* nothing to copy to */ }
    });
    // a link followed, or back/forward: the state in the fragment
    ['hashchange', 'popstate'].forEach(ev => window.addEventListener(ev, () => {
      if (location.hash.slice(1).split('?')[0] !== 'drills') return;
      if (applyState(GT.tabs.stateParams())){ syncUI(); render(); }
    }));
  }

  let drawnWidth = 0;
  function init(){
    card = $('drillCard');
    if (!card) return;
    buildKeys();
    $('drillScale').innerHTML = SCALES.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    $('drillBox').innerHTML = '';
    $('drillPos').innerHTML = POSITIONS.map(f => `<option value="${f}">${f === 0 ? 'Open position' : `Around fret ${f}`}</option>`).join('');
    applyState(GT.tabs.stateParams());
    bind();
    syncUI();
    render();
    drawnWidth = window.innerWidth;
    window.addEventListener('resize', () => { if (!$('page-drills').hidden && window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; render(); } });
  }
  // the tab is drawn to its width, so a page shown after a resize redraws
  function refresh(){ if (window.innerWidth !== drawnWidth || !metrics){ drawnWidth = window.innerWidth; render(); } }
  function stop(){ if (playingHere()) player().stop(); }

  GT.drills = { init, refresh, stop, expand, collapse, isExpanded: () => expanded, realiseDrill, SCALES, KINDS, PATTERNS, CROSSINGS, STRUMS, STRING_SETS, POSITIONS, boxesFor, boxId, windowOf, shareState, applyState, state, encodeStrums, decodeStrums };
})();
