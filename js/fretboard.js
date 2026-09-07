// Fretboard geometry: tuning, CAGED and pentatonic shape templates, and the maths
// that places them on the neck. Pure — no DOM, no app state.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const STRING_TUNING = [4, 11, 7, 2, 9, 4];        // index 0 = high e (top) ... 5 = low E (bottom)
  const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
  const FRET_COUNT = 15;

  // CAGED shape templates: fret offsets per string (index 0 = high e ... 5 = low E),
  // relative to the shape's anchor fret on string `ref`. null = string not played.
  const CAGED_MAJOR = {
    C: { ref: 4, offs: [-3, -2, -3, -1,  0, null] },
    A: { ref: 4, offs: [ 0,  2,  2,  2,  0, null] },
    G: { ref: 5, offs: [ 0, -3, -3, -3, -1,  0] },
    E: { ref: 5, offs: [ 0,  0,  1,  2,  2,  0] },
    D: { ref: 3, offs: [ 2,  3,  2,  0, null, null] },
  };
  const CAGED_MINOR = {
    C: { ref: 4, offs: [-4, -2, -3, -2,  0, null] },
    A: { ref: 4, offs: [ 0,  1,  2,  2,  0, null] },
    G: { ref: 5, offs: [ 0, -4, -3, -3, -2,  0] },
    E: { ref: 5, offs: [ 0,  0,  0,  2,  2,  0] },
    D: { ref: 3, offs: [ 1,  3,  2,  0, null, null] },
  };
  const CAGED_ORDER = ['C', 'A', 'G', 'E', 'D'];
  // hues chosen so that boxes adjacent in the C-A-G-E-D cycle (the pairs that
  // can share a split dot) are always far apart: cyan / amber / rose / blue / lime
  const CAGED_COLORS = { C: '#2fbccb', A: '#e6a13a', G: '#e069a6', E: '#5f8ce8', D: '#8ec93f' };

  // one colour per distinct chord root, assigned in progression order
  const ROOT_PALETTE = ['#2fbccb', '#e6a13a', '#e069a6', '#5f8ce8', '#8ec93f', '#b98ce8', '#e6733a'];

  // every CAGED shape placement that fits on the neck, with its played cells
  function cagedPlacements(rootPc, shapeSet){
    const out = [];
    CAGED_ORDER.forEach(name => {
      const shape = shapeSet[name];
      const r0 = ((rootPc - STRING_TUNING[shape.ref]) % 12 + 12) % 12;
      [r0, r0 + 12].forEach(r => {
        const frets = shape.offs.map(o => o === null ? null : r + o);
        if (frets.some(f => f !== null && (f < 0 || f > FRET_COUNT))) return;
        const cells = [];
        frets.forEach((f, s) => { if (f !== null) cells.push({ string: s, fret: f }); });
        const fs = cells.map(c => c.fret);
        out.push({
          name, cells,
          meanFret: fs.reduce((a, b) => a + b, 0) / fs.length,
          fretMin: Math.min(...fs),
          fretMax: Math.max(...fs),
        });
      });
    });
    return out;
  }

  // Every CAGED triad shape carries one plain octave of the root (besides
  // the shape's own reference note) — the string index below is where that
  // duplicate root falls, same for the major and minor version of each
  // shape. That's the note real players flatten to turn the triad into a
  // 7th chord (a half step for a major 7th, a whole step for a dominant
  // 7th / minor 7th), rather than reaching for an unrelated string.
  const CAGED_DUP_ROOT_STRING = { C: 1, A: 2, G: 0, E: 3, D: 1 };

  // turn a triad placement into its 7th-chord voicing the way it's actually
  // fingered on guitar (used by "Chord positions" when 7 chords is on)
  function seventhCells(placement, rootPc, seventhPc){
    const dupString = CAGED_DUP_ROOT_STRING[placement.name];
    const dup = placement.cells.find(c => c.string === dupString);
    if (!dup) return placement.cells;
    const interval = (rootPc - seventhPc + 12) % 12;   // 1 = major 7th, 2 = flat 7th
    const newFret = dup.fret - (interval === 1 ? 1 : 2);
    if (newFret >= 0) return placement.cells.map(c => c === dup ? { string: c.string, fret: newFret } : c);
    // Too close to the nut to flatten the root — the open C7 is the case: the
    // dropped root would land below fret 0. Players raise the 5th instead
    // (x-3-2-3-1-0), so do that: the 5th plus a minor 3rd is the flat 7th, a
    // major 3rd the major 7th.
    const fifthPc = (rootPc + 7) % 12;
    const fifth = placement.cells.find(c => (STRING_TUNING[c.string] + c.fret) % 12 === fifthPc);
    const raised = fifth ? fifth.fret + (interval === 1 ? 4 : 3) : -1;
    if (!fifth || raised > FRET_COUNT) return placement.cells;
    return placement.cells.map(c => c === fifth ? { string: c.string, fret: raised } : c);
  }

  // pentatonic "box" templates, one per CAGED position: two fret offsets per
  // string (index 0 = high e ... 5 = low E) relative to the box's anchor fret
  // on the low-E string. `a` is that anchor for a root pitch-class of 0.
  const PENTA_MAJOR = {
    E: { a: 8,  offs: [[0, 2], [0, 2], [-1, 1], [-1, 2], [-1, 2], [0, 2]] },
    D: { a: 10, offs: [[0, 2], [0, 3], [-1, 2], [0, 2], [0, 2], [0, 2]] },
    C: { a: 12, offs: [[0, 3], [1, 3], [0, 2], [0, 2], [0, 3], [0, 3]] },
    A: { a: 3,  offs: [[0, 2], [0, 2], [-1, 2], [-1, 2], [0, 2], [0, 2]] },
    G: { a: 5,  offs: [[0, 3], [0, 3], [0, 2], [0, 2], [0, 2], [0, 3]] },
  };
  const PENTA_MINOR = {
    E: { a: 8,  offs: [[0, 3], [0, 3], [0, 2], [0, 2], [0, 2], [0, 3]] },
    D: { a: 11, offs: [[0, 2], [0, 2], [-1, 1], [-1, 2], [-1, 2], [0, 2]] },
    C: { a: 1,  offs: [[0, 2], [0, 3], [-1, 2], [0, 2], [0, 2], [0, 2]] },
    A: { a: 3,  offs: [[0, 3], [1, 3], [0, 2], [0, 2], [0, 3], [0, 3]] },
    G: { a: 6,  offs: [[0, 2], [0, 2], [-1, 2], [-1, 2], [0, 2], [0, 2]] },
  };

  // every pentatonic box placement that touches the neck (including partial
  // boxes near the nut / 15th fret); a note may belong to two adjacent boxes
  function pentaBoxPlacements(rootPc, isMinor){
    const set = isMinor ? PENTA_MINOR : PENTA_MAJOR;
    const out = [];
    CAGED_ORDER.forEach(name => {
      const box = set[name];
      const base = (((box.a + rootPc) % 12) + 12) % 12;
      [base - 12, base, base + 12].forEach(anchor => {
        const cells = [];
        box.offs.forEach((pair, s) => {
          pair.forEach(o => {
            const fret = anchor + o;
            if (fret >= 0 && fret <= FRET_COUNT) cells.push({ string: s, fret });
          });
        });
        if (cells.length) out.push({ name, anchor, cells });
      });
    });
    return out;
  }

  // full 7-note scale box per CAGED position: each box's pentatonic notes plus
  // the diatonic passing tones (4 / 7) that sit inside its minor-third gaps
  function scaleBoxPlacements(rootPc, isMinor, scalePcs){
    return pentaBoxPlacements(rootPc, isMinor).map(p => {
      const byString = {};
      p.cells.forEach(c => { (byString[c.string] = byString[c.string] || []).push(c.fret); });
      const cells = [];
      Object.keys(byString).forEach(key => {
        const s = Number(key);
        const frets = byString[key].slice().sort((a, b) => a - b);
        frets.forEach(f => cells.push({ string: s, fret: f }));
        for (let k = 0; k < frets.length - 1; k++){
          if (frets[k + 1] - frets[k] === 3){
            for (let mid = frets[k] + 1; mid < frets[k + 1]; mid++){
              if (scalePcs.has((STRING_TUNING[s] + mid) % 12)) cells.push({ string: s, fret: mid });
            }
          }
        }
      });
      return { name: p.name, anchor: p.anchor, cells };
    });
  }

  // The five CAGED shapes for one triad, laid out across the whole neck and
  // coloured by shape (notes two shapes share get a split dot). This is the
  // data behind the practice tab's "CAGED triads" view; the chord finder draws
  // the same thing, so both stay identical by construction.
  // Pass `seventhPc` and each shape turns into its 7th-chord voicing (the
  // same way "Chord positions" does it), with the 7th drawn as a hollow dot.
  function cagedTriadBoard(rootPc, isMinor, rootLabel, seventhPc = null){
    const thirdPc = (rootPc + (isMinor ? 3 : 4)) % 12;
    const fifthPc = (rootPc + 7) % 12;
    const seventhLabel = seventhPc == null ? '' : ((seventhPc - rootPc + 12) % 12 === 11 ? '7' : '♭7');
    const nameOf = pc =>
      pc === rootPc ? rootLabel :
      pc === thirdPc ? (isMinor ? '♭3' : '3') :
      pc === fifthPc ? '5' :
      pc === seventhPc ? seventhLabel : '';
    const shapes = isMinor ? CAGED_MINOR : CAGED_MAJOR;

    const cells = new Map();
    const rendered = new Set();
    const lines = [];
    CAGED_ORDER.forEach(name => {
      const shape = shapes[name];
      const r0 = ((rootPc - STRING_TUNING[shape.ref]) % 12 + 12) % 12;
      [r0, r0 + 12].forEach(r => {
        const frets = shape.offs.map(o => o === null ? null : r + o);
        if (frets.some(f => f !== null && (f < 0 || f > FRET_COUNT))) return;
        rendered.add(name);
        let lineCells = [];
        frets.forEach((f, s) => { if (f !== null) lineCells.push({ string: s, fret: f }); });
        if (seventhPc != null) lineCells = seventhCells({ name, cells: lineCells }, rootPc, seventhPc);
        const meanFret = lineCells.reduce((a, c) => a + c.fret, 0) / lineCells.length;
        lineCells.forEach(({ string: s, fret: f }) => {
          const key = s + ':' + f;
          const pc = (STRING_TUNING[s] + f) % 12;
          if (!cells.has(key)){
            cells.set(key, { string: s, fret: f, contribs: [],
              isRoot: pc === rootPc, hollow: seventhPc != null && pc === seventhPc });
          }
          cells.get(key).contribs.push({ name, meanFret });
        });
        if (lineCells.length > 1) lines.push({ color: CAGED_COLORS[name], shape: name, cells: lineCells });
      });
    });

    const markers = [...cells.values()].map(m => {
      const label = nameOf((STRING_TUNING[m.string] + m.fret) % 12);
      const names = [...new Set(m.contribs.map(c => c.name))];
      if (names.length === 1){
        return { string: m.string, fret: m.fret, isRoot: m.isRoot, hollow: m.hollow, label, shapes: names,
          color: CAGED_COLORS[names[0]] };
      }
      // shared note: order the two shapes left-to-right by their position on the neck
      const sorted = [...m.contribs].sort((a, b) => a.meanFret - b.meanFret);
      const left = sorted[0].name;
      const right = [...sorted].reverse().find(c => c.name !== left).name;
      return { string: m.string, fret: m.fret, isRoot: m.isRoot, hollow: m.hollow, label, shapes: names,
        split: [CAGED_COLORS[left], CAGED_COLORS[right]] };
    });

    return { markers, lines, shapesShown: CAGED_ORDER.filter(n => rendered.has(n)) };
  }

  // Which CAGED shape a voicing is built on, if any — decided by how many of
  // the shape's own notes the voicing actually plays. Extended chords alter a
  // note or two of the underlying triad, so three shared notes is enough to
  // call it; anything less isn't really that shape. `exact` marks the textbook
  // grip: every note of the shape, and nothing outside it.
  function cagedShapeMatch(cells, rootPc, isMinor){
    const played = new Set(cells.map(c => `${c.string}:${c.fret}`));
    let best = null, bestHits = 0, exact = false;
    cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR).forEach(p => {
      const shapeCells = new Set(p.cells.map(c => `${c.string}:${c.fret}`));
      const hits = [...shapeCells].filter(k => played.has(k)).length;
      if (hits <= bestHits) return;
      bestHits = hits;
      best = p.name;
      exact = hits === shapeCells.size && [...played].every(k => shapeCells.has(k));
    });
    return bestHits >= 3 ? { name: best, exact } : null;
  }

  function identifyCagedShape(cells, rootPc, isMinor){
    const m = cagedShapeMatch(cells, rootPc, isMinor);
    return m ? m.name : null;
  }

  GT.fretboard = {
    STRING_TUNING, STRING_LABELS, FRET_COUNT,
    CAGED_MAJOR, CAGED_MINOR, CAGED_ORDER, CAGED_COLORS, ROOT_PALETTE,
    cagedPlacements, seventhCells, pentaBoxPlacements, scaleBoxPlacements,
    cagedTriadBoard, identifyCagedShape, cagedShapeMatch,
  };
})();
