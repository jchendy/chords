// A neck that follows a part — what the jam tab's fretboard does for a
// suggested part, for any page that plays one: the chord as it's fretted
// (the CAGED grip nearest the hand, its 7th, its colour tones hollow) or the
// notes the part may play (its palette in the position window), drawn with
// neck.js so the example player can light each note as it sounds. Shared
// by the Hendrix deep dive and the drills tab.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { displayName, chordPcs, SEMITONE } = GT.theory;
  const { STRING_TUNING, FRET_COUNT, CAGED_MAJOR, CAGED_MINOR, CAGED_COLORS,
          cagedPlacements, seventhCells, susCells, arpeggioCells } = GT.fretboard;
  const { palette } = GT.parts;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const DEG = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];
  // the label a chord gives an interval: its colours read as 9, ♯9 and 6
  function labelFor(iv, chord){
    iv = ((iv % 12) + 12) % 12;
    const ext = (chord && chord.ext) || [];
    if (iv === 3 && ext.includes(3)) return '♯9';
    if (iv === 2 && (ext.includes(2) || ext.includes(14))) return '9';
    if (iv === 9 && ext.includes(9)) return '6';
    return DEG[iv];
  }
  const pcOf = c => (STRING_TUNING[c.string] + c.fret) % 12;
  const cellKey = c => `${c.string}:${c.fret}`;
  const pcs = (root, ivs) => new Set(ivs.map(i => (root + i) % 12));
  const SCALE_COLOR = '#5f8ce8', DIM = '#6b655b';
  // the neck's stretch: the window, widened to any note the part reaches
  // past it, a fret either side
  function neckGeometry(win, notes){
    const frets = notes.map(n => n.fret).filter(f => f > 0);
    const lo = Math.min(win.min, ...frets), hi = Math.max(win.max, ...frets);
    return GT.neck.geometry(Math.max(0, lo - 1), Math.min(FRET_COUNT, hi + 1));
  }
  // a note the part plays that the drawing hasn't got — a fill note, one
  // past the window — is added hollow, so it can light
  function addPlayed(markers, played, chord, rootPc){
    const have = new Set(markers.map(cellKey));
    played.forEach(c => {
      if (have.has(cellKey(c))) return;
      have.add(cellKey(c));
      markers.push({ string: c.string, fret: c.fret, color: DIM, hollow: true, passing: true, label: labelFor(pcOf(c) - rootPc, chord), isRoot: pcOf(c) === rootPc });
    });
  }
  // the chord as it's fretted: the CAGED grip nearest the window (inside it
  // if one is), with its 7th and its sus note, the chord's other colours in
  // the window hollow, and whatever the part plays besides
  // (`given` is a placement already chosen — a drill that picked its own
  // shape draws that one)
  function chordNeck(chord, win, played = [], given = null){
    const rootPc = SEMITONE[chord.note] % 12;
    const isMinor = chord.quality === 'min';
    const mid = (win.min + win.max) / 2;
    const all = cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR).filter(p => p.cells.length > 2);
    const inWin = all.filter(p => p.fretMin >= win.min - 1 && p.fretMax <= win.max + 1);
    const placement = given || (inWin.length ? inWin : all).reduce((b, p) => Math.abs(p.meanFret - mid) < Math.abs(b.meanFret - mid) ? p : b);
    // a grip handed over whole (`given.given`) is drawn as it is; a CAGED
    // placement gets its 7th and its sus note the way the neck fingers them
    let cells = placement.given ? placement.cells.slice() : chord.seventh ? seventhCells(placement, rootPc, SEMITONE[chord.seventh] % 12) : placement.cells.slice();
    if (chord.sus && !placement.given) cells = susCells(cells, rootPc, chord.sus);
    const color = CAGED_COLORS[placement.name];
    const markers = cells.map(c => ({ string: c.string, fret: c.fret, color, label: labelFor(pcOf(c) - rootPc, chord), isRoot: pcOf(c) === rootPc, shapes: [placement.name] }));
    const have = new Set(markers.map(cellKey));
    arpeggioCells(win.min, win.max, new Set(chordPcs(chord))).forEach(c => {
      if (have.has(cellKey(c))) return;
      have.add(cellKey(c));
      markers.push({ string: c.string, fret: c.fret, color, hollow: true, label: labelFor(pcOf(c) - rootPc, chord), isRoot: pcOf(c) === rootPc });
    });
    addPlayed(markers, played, chord, rootPc);
    const lines = [{ color, shape: placement.name, cells: cells.map(c => ({ string: c.string, fret: c.fret })) }];
    const coloured = chord.seventh || chord.sus || (chord.ext && chord.ext.length);
    return { markers, lines, placement, what: `${displayName(chord)} — the ${placement.name} shape${coloured ? ', with its colour hollow' : ''}` };
  }
  // what the notes on the neck are, in words: the scale given, or the
  // palette the reading gives the chord (`opts` as realise takes them)
  function paletteName(chord, spec){
    if (spec.scale) return spec.scale.name;
    const o = spec.opts || {};
    const root = chord.note;
    const isMinor = chord.quality === 'min';
    const blues = !!o.blues;
    const reading = o.reading || 'penta';
    if (reading === 'penta') return `${root} ${isMinor || blues ? 'minor' : 'major'} pentatonic`;
    if (reading === 'scale'){
      if (blues && !isMinor) return `the ${root} blues scale`;
      if (o.scaleTheory === 'modal') return `the key's notes from ${root}`;
      const flat7 = chord.seventh && (SEMITONE[chord.seventh] - SEMITONE[chord.note] + 12) % 12 === 10;
      return `${root} ${isMinor ? 'natural minor' : flat7 ? 'Mixolydian' : 'major scale'}`;
    }
    return `${displayName(chord)} chord tones`;
  }
  // the notes the part may play in the window: a scale given outright
  // (`spec.scale` = { root, pcs, name }) or the chord's palette in the
  // reading (`spec.opts`), chord tones full, the rest dimmed
  function scaleNeck(chord, spec, win, played = []){
    const pal = spec.scale ? { root: spec.scale.root, allowed: spec.scale.pcs } : palette(chord, spec.opts);
    const rootPc = pal.root;
    const tones = new Set(chordPcs(chord));
    const markers = arpeggioCells(win.min, win.max, pal.allowed).map(c => {
      const pc = pcOf(c);
      return { string: c.string, fret: c.fret, color: SCALE_COLOR, label: labelFor(pc - rootPc, chord), isRoot: pc === rootPc, passing: !tones.has(pc) };
    });
    addPlayed(markers, played, chord, rootPc);
    return { markers, lines: [], what: `${displayName(chord)} — ${paletteName(chord, spec)} in the position` };
  }
  // a box's own cells as markers: the shape's colour, degrees from the root,
  // roots ringed, notes outside the chord dimmed
  function boxMarkers(box, rootPc, tones, color){
    return box.cells.map(c => {
      const pc = pcOf(c);
      return { string: c.string, fret: c.fret, color: color || CAGED_COLORS[box.name], label: DEG[(pc - rootPc + 12) % 12], isRoot: pc === rootPc, passing: tones ? !tones.has(pc) : false, shapes: [box.name] };
    });
  }
  const neckSVG = (geo, markers, lines, scale = 1) => `<div class="fret-scroll"><svg viewBox="${geo.viewBox}" style="max-width:${Math.round(geo.maxWidth * scale)}px;min-width:${geo.minWidth}px" role="img">${geo.buildSVG(markers, lines)}</svg></div>`;
  // a titled neck drawing with a caption, for a page's text
  function figure(title, from, to, markers, caption, lines = []){
    const geo = GT.neck.geometry(from, to);
    return `<div class="neck-fig"><h4>${esc(title)}</h4>${neckSVG(geo, markers, lines)}<p class="cap">${caption}</p></div>`;
  }

  GT.neckFollow = { DEG, labelFor, pcOf, cellKey, pcs, neckGeometry, addPlayed, chordNeck, scaleNeck, paletteName, boxMarkers, neckSVG, figure, SCALE_COLOR, DIM };
})();
