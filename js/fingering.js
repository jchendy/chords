// The left hand: which finger goes where on a grip. One model for the
// chord finder's diagrams, the ear-training diagrams and the chord
// diagrams the tab can show over an example at each change of grip.
//
// A grip is fingered by the chord finder's model (computeFingering): one
// unit per finger, runs of notes on one fret flattened into a barre when
// the hand would need more than four, each finger the one its fret says.
// handFor puts that under a page's own rule — the Hendrix page's thumb
// over the low E, so an E-shape barre reads T on the bass string and the
// index lies over the top strings only. Single notes are not fingered
// here: a run's fingering is the box it comes from.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { STRING_TUNING } = GT.fretboard;
  const cellKey = c => `${c.string}:${c.fret}`;

  // Work out a left-hand fingering for a voicing, or null when there isn't a
  // playable one. Fingers run 1 (index) to 4 (pinky); open and muted strings
  // need none.
  //
  // The model is one "unit" per finger. Every fretted note starts as its own
  // unit, and if that needs more than four fingers we flatten runs of notes
  // that share a fret into a barre — the index across the lowest fret, or a
  // higher finger laid over neighboring strings (the ring-finger barre in
  // shapes like C9 and Em9). `allowedPcs` is the chord's own set of notes: an
  // index barre presses every string it crosses, so whatever it sounds has to
  // belong to the chord.
  // A few open shapes are fingered by convention rather than by the rule
  // below, and the convention comes from the chord they are lifted from
  // rather than from anything about the frets. Em is E major with the index
  // taken off, so it keeps E major's middle and ring — while Asus2, the same
  // two-notes-on-one-fret shape, is A major with the ring taken off and keeps
  // A major's index and middle. Nothing in the geometry tells those two
  // apart, which is why this is a table and not a rule.
  //
  // Keyed by the grip, low E first; the value gives the finger for each
  // fretted string, by string index (0 = high e).
  const CONVENTIONAL_FINGERING = {
    '0-2-2-0-0-0': { 4: 2, 3: 3 },     // Em — E major with the index lifted
  };

  const gripOf = cells => {
    const at = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => at.has(s) ? at.get(s) : 'x').join('-');
  };

  function computeFingering(cells, allowedPcs){
    const known = CONVENTIONAL_FINGERING[gripOf(cells)];
    if (known){
      return { fingerByString: { ...known }, barre: null, barres: [],
               fingerCount: new Set(Object.values(known)).size, barredExtras: [] };
    }

    const fretted = cells.filter(c => c.fret > 0);
    const openStrings = new Set(cells.filter(c => c.fret === 0).map(c => c.string));
    if (!fretted.length) return { fingerByString: {}, barre: null, barres: [], fingerCount: 0 };

    const frets = fretted.map(c => c.fret);
    const minFret = Math.min(...frets), maxFret = Math.max(...frets);
    if (maxFret - minFret > 3) return null;      // wider than a four-fret hand span

    const played = new Set(cells.map(c => c.string));
    const byFret = new Map();
    fretted.forEach(c => {
      if (!byFret.has(c.fret)) byFret.set(c.fret, []);
      byFret.get(c.fret).push(c);
    });

    const barredExtras = [];
    // The index barre spans from the lowest to the highest string of the
    // lowest fret, sounding everything in between whether asked to or not.
    function indexBarreUnit(){
      const low = byFret.get(minFret);
      if (low.length < 2) return null;
      const from = Math.min(...low.map(c => c.string));
      const to = Math.max(...low.map(c => c.string));
      const extras = [];
      for (let s = from; s <= to; s++){
        if (openStrings.has(s)) return null;     // the barre would stop an open string
        if (played.has(s)) continue;
        const pc = (STRING_TUNING[s] + minFret) % 12;
        if (!allowedPcs.has(pc)) return null;    // ...and it would be a wrong note
        extras.push({ string: s, fret: minFret });
      }
      const strings = [];
      for (let s = from; s <= to; s++) strings.push(s);
      return { unit: { fret: minFret, strings, barre: true }, extras };
    }

    // A higher finger can only lie flat across strings that are next to each
    // other and all stopped at that same fret.
    function longestRun(group){
      const sorted = group.map(c => c.string).sort((a, b) => a - b);
      let best = [], run = [sorted[0]];
      for (let i = 1; i < sorted.length; i++){
        if (sorted[i] === sorted[i - 1] + 1) run.push(sorted[i]);
        else { if (run.length > best.length) best = run; run = [sorted[i]]; }
      }
      if (run.length > best.length) best = run;
      return best;
    }

    // start with a finger per note, then flatten runs until the hand fits
    let units = fretted.map(c => ({ fret: c.fret, strings: [c.string], barre: false }));
    let indexBarre = null;

    if (units.length > 4){
      const attempt = indexBarreUnit();
      if (attempt){
        barredExtras.push(...attempt.extras);
        units = units.filter(u => u.fret !== minFret);
        units.push(attempt.unit);
        indexBarre = { finger: 1, fret: minFret, fromString: attempt.unit.strings[0],
                       toString: attempt.unit.strings[attempt.unit.strings.length - 1] };
      }
    }
    while (units.length > 4){
      // flatten the longest run of neighboring notes sharing a fret
      let target = null;
      [...byFret.entries()].forEach(([fret, group]) => {
        if (fret === minFret && indexBarre) return;       // already barred
        if (group.length < 2) return;
        const run = longestRun(group);
        if (run.length >= 2 && (!target || run.length > target.run.length)) target = { fret, run };
      });
      if (!target) return null;                           // no hand shape fits
      const runSet = new Set(target.run);
      units = units.filter(u => !(u.fret === target.fret && runSet.has(u.strings[0])));
      units.push({ fret: target.fret, strings: target.run, barre: true });
      byFret.set(target.fret, byFret.get(target.fret).filter(c => !runSet.has(c.string)));
    }

    // fingers go on in order: lowest fret first, and on a shared fret the
    // lower-pitched (higher-index) string takes the lower finger — each
    // taking the finger its fret says, one a fret from the index (the
    // minor barre's two notes two frets up are the ring and the pinky, as
    // in the major shape with the middle lifted; a power chord the same),
    // or the next finger on when that one is taken; a hand that would run
    // past the pinky that way takes the fingers in plain order instead
    units.sort((a, b) => a.fret - b.fret || Math.max(...b.strings) - Math.max(...a.strings));
    let fingersOf = [];
    let next = 1;
    units.forEach(u => { const f = Math.max(next, Math.min(4, u.fret - minFret + 1)); fingersOf.push(f); next = f + 1; });
    if (fingersOf.some(f => f > 4)) fingersOf = units.map((u, i) => i + 1);
    const fingerByString = {};
    const barres = [];
    units.forEach((u, i) => {
      const finger = fingersOf[i];
      u.strings.forEach(s => { fingerByString[s] = finger; });
      if (u.barre){
        barres.push({ finger, fret: u.fret,
                      fromString: Math.min(...u.strings), toString: Math.max(...u.strings) });
      }
    });

    return {
      fingerByString,
      barres,
      barre: barres[0] || null,      // the practice-diagram renderer draws these
      fingerCount: units.length,
      barredExtras,
    };
  }

  // ---- a hand on a grip ----
  // `cells` one a string ({ string, fret }, 0 an open string); `allowed` the
  // chord's pitch classes, for what an index barre may sound on a string
  // the grip leaves out (the grip's own notes when not given); `thumb`
  // the thumb over the neck for a barre that starts on the low E.
  // Returns the finger of each cell (T, 1–4, or 0 for an open string), the
  // barres to draw, and the diagram's first fret and how many rows it needs.
  function handFor(cells, { thumb = false, allowed = null } = {}){
    const fretted = cells.filter(c => c.fret > 0);
    const frets = fretted.map(c => c.fret);
    const lo = frets.length ? Math.min(...frets) : 0, hi = frets.length ? Math.max(...frets) : 0;
    const pcs = allowed || new Set(cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12));
    let model = fretted.length ? computeFingering(cells, pcs) : null;
    // no hand shape fits (a stretch wider than four frets): one finger a
    // fret from the index at the lowest, the pinky taking the rest
    if (!model){
      const by = {};
      fretted.forEach(c => { by[c.string] = Math.max(1, Math.min(4, c.fret - lo + 1)); });
      model = { fingerByString: by, barres: [] };
    }
    const fingers = new Map();
    cells.forEach(c => fingers.set(cellKey(c), c.fret > 0 ? model.fingerByString[c.string] || 1 : 0));
    let barres = (model.barres || []).map(b => ({ ...b }));
    // the thumb over the neck: a barre that starts on the low E at the
    // lowest fret gives that string to the thumb, and the index lies across
    // what is left of it on the top strings
    const bass = cells.find(c => c.string === 5);
    if (thumb && bass && bass.fret === lo && lo > 0 && fingers.get(cellKey(bass)) === 1 && cells.filter(c => c.fret > 0).length >= 4){
      fingers.set(cellKey(bass), 'T');
      barres = barres.map(b => {
        if (b.finger !== 1 || b.toString !== 5) return b;
        const rest = cells.filter(c => c.string < 5 && c.fret === lo && fingers.get(cellKey(c)) === 1).map(c => c.string);
        return rest.length >= 2 ? { ...b, toString: Math.max(...rest), fromString: Math.min(...rest) } : null;
      }).filter(Boolean);
    }
    // the diagram: from the nut when the grip sits low, else from its
    // lowest fret; four rows, or as many as the grip spans
    const base = hi <= 4 ? 1 : lo;
    const rows = Math.max(4, hi - base + 1);
    return { fingers, barres, base, rows };
  }
  // the hand as a string, low E first — 'T-3-4-2-1-1' — for tests and notes
  function handString(hand, cells){
    const at = new Map(cells.map(c => [c.string, c]));
    return [5, 4, 3, 2, 1, 0].map(s => at.has(s) ? String(hand.fingers.get(cellKey(at.get(s)))) : 'x').join('-');
  }

  GT.fingering = { computeFingering, handFor, handString };
})();
