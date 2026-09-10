// Fretboard geometry: tuning, CAGED and pentatonic shape templates, and the maths
// that places them on the neck. Pure — no DOM, no app state.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const STRING_TUNING = [4, 11, 7, 2, 9, 4];        // index 0 = high e (top) ... 5 = low E (bottom)
  const STRING_MIDI = [64, 59, 55, 50, 45, 40];     // the same strings as absolute pitch
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
  // fingered on guitar (used by Chords when the chord carries a 7th)
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

  // Every chord tone within one stretch of frets — the arpeggio a hand
  // sitting there can reach. `tonePcs` is the chord's pitch classes.
  function arpeggioCells(fretMin, fretMax, tonePcs){
    const lo = Math.max(0, fretMin), hi = Math.min(FRET_COUNT, fretMax);
    const cells = [];
    for (let s = 0; s < 6; s++){
      for (let f = lo; f <= hi; f++){
        if (tonePcs.has((STRING_TUNING[s] + f) % 12)) cells.push({ string: s, fret: f });
      }
    }
    return cells;
  }

  // The five CAGED arpeggio boxes for a chord: each chord shape's own
  // position, opened out to a hand span and filled with every chord tone
  // inside it. This is the CAGED arpeggio every method book teaches — the
  // chord shape you already know, plus the notes around it on each string.
  function cagedArpeggioBoxes(rootPc, isMinor, tonePcs, span = 4){
    return cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR).map(p => {
      const width = Math.max(span, p.fretMax - p.fretMin + 1);
      let lo = p.fretMin, hi = lo + width - 1;
      if (hi > FRET_COUNT){ hi = FRET_COUNT; lo = Math.max(0, hi - width + 1); }
      return {
        name: p.name, anchor: p.fretMin, meanFret: p.meanFret,
        cells: arpeggioCells(lo, hi, tonePcs),
        window: { min: lo, max: hi },
      };
    }).filter(b => b.cells.length);
  }

  // Close-voiced triads on one set of three adjacent strings, in every
  // inversion, everywhere they sit on the neck — the "triads on the top three
  // strings" study, and the shapes rhythm players comp with. `lowString` is
  // the set's lowest-pitched string (its highest index).
  //
  // A voicing qualifies when it plays one of each chord tone, one note per
  // string, rising in pitch across the set, inside an octave and inside a
  // hand span.
  //
  // Two of those four say what the other two already imply, which is worth
  // knowing before anyone reasons about them: with rising pitch and a span
  // under an octave, three chord tones can't repeat one (that needs a whole
  // octave between them) and can't reach more than a hand across (adjacent
  // strings are four or five semitones apart, so the frets can't spread far
  // before the pitches stop rising or the octave is broken). Checked over
  // every root, quality and string set — 288 combinations, 850 voicings —
  // where keeping only the close-voicing and rising rules gives exactly the
  // same shapes, while dropping either of *those* changes what comes out.
  // They're kept because each names a thing a player would say about a close
  // triad, and the golden master in the tests holds the output either way;
  // but only two of them are load-bearing.
  function stringSetTriads(lowString, tonePcs, maxSpan = 4){
    const set = [lowString, lowString - 1, lowString - 2];   // low pitch to high
    if (lowString > 5 || set[2] < 0) return [];
    const per = set.map(s => {
      const frets = [];
      for (let f = 0; f <= FRET_COUNT; f++){
        if (tonePcs.has((STRING_TUNING[s] + f) % 12)) frets.push(f);
      }
      return frets;
    });

    const out = [];
    per[0].forEach(f0 => per[1].forEach(f1 => per[2].forEach(f2 => {
      const frets = [f0, f1, f2];
      if (Math.max(...frets) - Math.min(...frets) > maxSpan) return;
      const pcs = set.map((s, i) => (STRING_TUNING[s] + frets[i]) % 12);
      if (new Set(pcs).size !== 3) return;                       // one of each tone
      const notes = set.map((s, i) => STRING_MIDI[s] + frets[i]);
      if (notes[1] <= notes[0] || notes[2] <= notes[1]) return;   // rising across the set
      if (notes[2] - notes[0] >= 12) return;                      // close voicing
      out.push({
        cells: set.map((s, i) => ({ string: s, fret: frets[i] })),
        bassPc: pcs[0],                                           // which tone is underneath
        startFret: Math.min(...frets),
      });
    })));
    return out.sort((a, b) => a.startFret - b.startFret);
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

  // The full scale in each CAGED position, written out rather than worked out.
  // These are the shapes players learn, and like the pentatonic ones above they
  // are a judgement about where a note is best fingered, not something a rule
  // derives: where a note can be had in two places, which one belongs to this
  // box is a choice. Deriving them produced boxes with holes in — a scale you
  // could not play up through the position without a note going missing.
  //
  // Keyed by the scale's own intervals from its root, so a mode is looked up by
  // what it is rather than by what it's called. Then fret offsets from the
  // anchor, per string, high e first.
  //
  // A mode has the same notes as the major scale it comes from, so it has the
  // same five boxes — you play D Dorian with C major's shapes and just count
  // from a different root. That moves the roots inside each box, which moves
  // the CAGED name with them: the shape that is C major's D shape is D Dorian's
  // E shape. Each row below says which major shape it is, so the two can be
  // checked against each other.
  const SCALE_SHAPES = {
    // Ionian — the major scale itself
    '0,2,4,5,7,9,11': {
      C: { a: 0,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      A: { a: 3,  offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
      G: { a: 5,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      E: { a: 8,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      D: { a: 10, offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
    },
    // Dorian — the parent major's boxes, rooted on its 2nd
    '0,2,3,5,7,9,10': {
      C: { a: 1,  offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
      A: { a: 3,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      G: { a: 6,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      E: { a: 8,  offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
      D: { a: 10, offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
    },
    // Phrygian — the parent major's boxes, rooted on its 3rd
    '0,1,3,5,7,8,10': {
      C: { a: 1,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      A: { a: 4,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      G: { a: 6,  offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
      E: { a: 8,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      D: { a: 11, offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
    },
    // Lydian — the parent major's boxes, rooted on its 4th
    '0,2,4,6,7,9,11': {
      C: { a: 0,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      A: { a: 3,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      G: { a: 5,  offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
      E: { a: 7,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      D: { a: 10, offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
    },
    // Mixolydian — the parent major's boxes, rooted on its 5th
    '0,2,4,5,7,9,10': {
      C: { a: 1,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      A: { a: 3,  offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
      G: { a: 5,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      E: { a: 8,  offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
      D: { a: 10, offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
    },
    // Aeolian — the parent major's boxes, rooted on its 6th — the natural minor
    '0,2,3,5,7,8,10': {
      C: { a: 1,  offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
      A: { a: 3,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      G: { a: 6,  offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
      E: { a: 8,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      D: { a: 11, offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
    },
    // Locrian — the parent major's boxes, rooted on its 7th
    '0,1,3,5,6,8,10': {
      C: { a: 1,  offs: [[0, 1, 3], [0, 1, 3], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 3]] },   // = the major scale's C shape
      A: { a: 4,  offs: [[0, 2], [0, 2, 3], [-1, 1, 2], [-1, 0, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's A shape
      G: { a: 6,  offs: [[0, 2, 3], [0, 1, 3], [-1, 0, 2], [0, 2], [0, 2, 3], [0, 2, 3]] },   // = the major scale's G shape
      E: { a: 9,  offs: [[-1, 0, 2], [0, 2], [-1, 1, 2], [-1, 1, 2], [-1, 0, 2], [0, 2]] },   // = the major scale's E shape
      D: { a: 11, offs: [[0, 2], [0, 2, 3], [-1, 0, 2], [-1, 0, 2], [0, 2], [0, 2, 3]] },   // = the major scale's D shape
    },
  };

  // the two a chord asks for when it isn't asking for a mode
  const IONIAN = '0,2,4,5,7,9,11', AEOLIAN = '0,2,3,5,7,8,10';

  function scaleBoxPlacements(rootPc, isMinor, scalePcs){
    const signature = [...scalePcs]
      .map(pc => ((pc - rootPc) % 12 + 12) % 12)
      .sort((a, b) => a - b)
      .join(',');
    // A chord borrowed from outside the key can hand us something that is no
    // mode at all; the parallel scale is the honest fallback for that.
    const set = SCALE_SHAPES[signature] || SCALE_SHAPES[isMinor ? AEOLIAN : IONIAN];
    const out = [];
    CAGED_ORDER.forEach(name => {
      const box = set[name];
      const base = (((box.a + rootPc) % 12) + 12) % 12;
      [base - 12, base, base + 12].forEach(anchor => {
        const cells = [];
        box.offs.forEach((list, s) => list.forEach(o => {
          const fret = anchor + o;
          if (fret >= 0 && fret <= FRET_COUNT) cells.push({ string: s, fret });
        }));
        if (cells.length) out.push({ name, anchor, cells });
      });
    });
    return out;
  }

  function nearestByAnchor(boxes, fret){
    let best = null, bd = Infinity;
    boxes.forEach(b => { const d = Math.abs(fret - b.anchor); if (d < bd){ bd = d; best = b; } });
    return best;
  }

  // Every note a view draws, coloured by the CAGED box that owns it: a note two
  // adjacent boxes share gets a split dot (lower box on the left, higher on the
  // right), a note in one box takes that box's colour, and a note in none takes
  // the nearest box's — an arpeggio note just outside a box still reads as
  // belonging to it.
  //
  // The practice tab's Chords, Pentatonic and Scales views all draw this same
  // picture, and so does the ear trainer's box. Each used to carry its own copy
  // of the loop; the copies had drifted. What actually differs between them is
  // only which notes they draw and what they call them, which is all `labelOf`
  // is — the degree to write on a pitch class, or nothing for a note this view
  // leaves out.
  function boxColouredNotes(boxes, { labelOf, rootPc, passingOf }){
    const markers = [];
    for (let s = 0; s < 6; s++){
      for (let f = 0; f <= FRET_COUNT; f++){
        const pc = (STRING_TUNING[s] + f) % 12;
        const label = labelOf(pc);
        if (label == null) continue;
        // Owners by name, each kept at its nearest placement. Two boxes share
        // a note or they don't; one box reaching the same note twice isn't
        // sharing it with anyone, and shouldn't split the dot with itself.
        const byName = new Map();
        boxes.forEach(b => {
          if (!b.cells.some(c => c.string === s && c.fret === f)) return;
          const held = byName.get(b.name);
          if (!held || Math.abs(f - b.anchor) < Math.abs(f - held.anchor)) byName.set(b.name, b);
        });
        const owners = [...byName.values()];
        const base = { string: s, fret: f, label, isRoot: pc === rootPc,
                       shapes: owners.map(o => o.name) };
        if (passingOf) base.passing = passingOf(pc);
        if (owners.length >= 2){
          const two = owners.slice()
            .sort((a, b) => Math.abs(f - a.anchor) - Math.abs(f - b.anchor))
            .slice(0, 2)
            .sort((a, b) => a.anchor - b.anchor);
          markers.push({ ...base, split: [CAGED_COLORS[two[0].name], CAGED_COLORS[two[1].name]] });
        } else if (owners.length === 1){
          markers.push({ ...base, color: CAGED_COLORS[owners[0].name] });
        } else {
          const near = nearestByAnchor(boxes, f);
          markers.push({ ...base, shapes: near ? [near.name] : [],
                         color: near ? CAGED_COLORS[near.name] : '#6b655b' });
        }
      }
    }
    return markers;
  }

  // The CAGED grips traced through, whatever else is drawn on top of them —
  // the chord shape you already know, under the scale or the arpeggio.
  // `allowed` narrows it to a set of shape letters, for a view that is working
  // on a few of the five at a time.
  function gripOutlines(rootPc, isMinor, allowed = null){
    return cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR)
      .filter(p => (!allowed || allowed.has(p.name)) && p.cells.length > 1)
      .map(p => ({ color: CAGED_COLORS[p.name], shape: p.name,
                   cells: p.cells.map(c => ({ string: c.string, fret: c.fret })) }));
  }

  // The five CAGED shapes for one triad, laid out across the whole neck and
  // coloured by shape (notes two shapes share get a split dot). This is the
  // data behind the practice tab's Chords view; the chord finder draws
  // the same thing, so both stay identical by construction.
  // Pass `seventhPc` and each shape turns into its 7th-chord voicing (the
  // same way the position reading does it), with the 7th drawn as a hollow dot.
  // `allowed` narrows it to a set of shape letters — the practice tab lets you
  // work on a few of the five at a time. Filtering here rather than afterwards
  // is what keeps a note two shapes share honest: with one of them switched
  // off it's a plain dot in the other's colour, not a split still half-painted
  // by a shape that isn't on the neck.
  function cagedTriadBoard(rootPc, isMinor, rootLabel, seventhPc = null, allowed = null){
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
      if (allowed && !allowed.has(name)) return;
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

  // Which CAGED shape a close three-string triad is cut from. A triad has only
  // three notes, so `cagedShapeMatch`'s three-note threshold would only ever
  // recognise one sitting entirely inside a grip — four in five do, and the
  // rest still sit squarely in a grip's position while borrowing a note from
  // outside it. Take the grip sharing the most notes, nearest one breaking a
  // tie, and require at least two so the answer means something.
  function closeTriadShape(cells, rootPc, isMinor){
    const played = new Set(cells.map(c => `${c.string}:${c.fret}`));
    const mid = cells.reduce((a, c) => a + c.fret, 0) / cells.length;
    let best = null, bestHits = 1, bestDist = Infinity;
    cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR).forEach(p => {
      const hits = p.cells.filter(c => played.has(`${c.string}:${c.fret}`)).length;
      const dist = Math.abs(mid - p.meanFret);
      if (hits > bestHits || (hits === bestHits && dist < bestDist)){
        best = p.name; bestHits = hits; bestDist = dist;
      }
    });
    return best;
  }

  function identifyCagedShape(cells, rootPc, isMinor){
    const m = cagedShapeMatch(cells, rootPc, isMinor);
    return m ? m.name : null;
  }

  GT.fretboard = {
    STRING_TUNING, STRING_MIDI, STRING_LABELS, FRET_COUNT,
    CAGED_MAJOR, CAGED_MINOR, CAGED_ORDER, CAGED_COLORS, ROOT_PALETTE,
    cagedPlacements, seventhCells, arpeggioCells, cagedArpeggioBoxes, stringSetTriads,
    pentaBoxPlacements, scaleBoxPlacements, boxColouredNotes, gripOutlines, nearestByAnchor,
    cagedTriadBoard, identifyCagedShape, cagedShapeMatch, closeTriadShape,
  };
})();
