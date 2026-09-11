// Suggested guitar parts for the practice tab: a rhythm figure and its fills,
// written for a feel and realised into whatever box the neck is showing.
//
// WHERE THE PARTS COME FROM, AND WHY THEY ARE NOBODY'S. Every part here is
// written from the idiom of its feel — where a shuffle puts its weight, which
// degrees a blues line leans on, how a turnaround falls — and not from any
// recording. A boogie figure, a minor-pentatonic run, a chromatic walk down
// to the root: these are the common property of the style, the way a
// twelve-bar form is. What would be somebody's is a signature riff, and none
// is used here, however simple, because being recognisable is the whole
// point of one. Sources consulted for the idiom, not the notes: standard
// method-book descriptions of shuffle, jump and slow-blues rhythm playing.
//
// HOW A PART IS WRITTEN. Once per feel, as two bars — a figure, then a fill —
// on the feel's own grid, every note an interval above a root: 0 is the
// root, 7 the fifth, 10 the flat seventh, 12 the octave. It is not written
// for a key, a box or a reading. Those come at realisation: the interval is
// turned into a pitch class against the chord (or the key, when the part is
// told to stay on the I), snapped to a note the reading allows, and placed
// on the nearest such note inside the position window. So a part written
// once appears in the chords reading using only chord tones, in the
// pentatonic reading using only the five, and in the scales reading using
// the scale — and a note the reading can't offer within a tone is dropped
// rather than forced, so a sparse reading gives a sparser part, not a wrong
// one.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { SEMITONE } = GT.theory;
  const { STRING_MIDI, FRET_COUNT } = GT.fretboard;

  // ---- the library ---------------------------------------------------------
  // Keyed by the style, then the feel's label as audio.js's STYLES names it.
  // `figure` is bar one; `fills` are the choices for bar two. Slots are on
  // the feel's grid: twelve to a bar for a shuffle (three to a beat, the
  // first and third being the swung eighths), sixteen for a straight feel.
  // dur is in slots. vel is 0..1, and the downbeat leans harder.
  //   n — one note, an interval above the root
  //   s — a strum of the chord: the grip the box is built on, every string
  //       of it, spread the way a pick sweeps. A part is rhythm guitar with
  //       fills, not a lead line, and the rhythm half is these.
  const n = (at, iv, dur, vel) => ({ at, iv, dur, vel });
  const s = (at, dur, vel) => ({ at, dur, vel, strum: true });

  const LIBRARY = {
    blues: {
      // A straight shuffle: down on the first triplet, up on the third, the
      // downbeats leaning harder — and a fill every other bar.
      'Shuffle': [
        {
          name: 'Shuffle comp',
          figure: [s(0, 1.6, 0.8), s(2, 0.8, 0.5), s(3, 1.6, 0.7), s(5, 0.8, 0.5),
                   s(6, 1.6, 0.8), s(8, 0.8, 0.5), s(9, 1.6, 0.7), s(11, 0.8, 0.5)],
          fills: [
            // a walk down from the octave to the root
            [n(0, 12, 1.6, 0.9), n(2, 10, 0.8, 0.7), n(3, 9, 1.6, 0.8), n(5, 7, 0.8, 0.7),
             n(6, 5, 1.6, 0.8), n(8, 4, 0.8, 0.7), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            // a pentatonic answer that climbs, and the chord to land on
            [n(0, 3, 1.6, 0.9), n(2, 5, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(6, 10, 1.6, 0.85),
             n(8, 12, 0.8, 0.8), s(9, 2.4, 0.75)],
            // half a bar of chords, then a push up to the octave
            [s(0, 1.6, 0.8), s(2, 0.8, 0.5), s(3, 1.6, 0.7), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.75),
             n(9, 12, 2.4, 0.9)],
          ],
        },
        {
          // Stabs on the beat with a lick in the gaps: chords on one and
          // three, single notes leading into them.
          name: 'Stabs and licks',
          figure: [s(0, 2.4, 0.85), n(3, 7, 1.6, 0.75), n(5, 10, 0.8, 0.65),
                   s(6, 2.4, 0.8), n(9, 3, 1.6, 0.75), n(11, 0, 0.8, 0.65)],
          fills: [
            [n(0, 0, 1.6, 0.9), n(2, 3, 0.8, 0.7), n(3, 5, 1.6, 0.8), n(5, 6, 0.8, 0.7),
             n(6, 7, 2.4, 0.9), n(9, 10, 1.6, 0.8), n(11, 12, 0.8, 0.75)],
            [n(0, 7, 2.4, 0.9), n(3, 10, 1.6, 0.8), n(5, 7, 0.8, 0.7), n(6, 5, 1.6, 0.8),
             n(8, 3, 0.8, 0.7), s(9, 2.4, 0.8)],
            [s(0, 1.6, 0.8), s(2, 0.8, 0.5), n(3, 4, 1.6, 0.85), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.7),
             n(9, 12, 2.4, 0.9)],
          ],
        },
      ],
      // 12/8 and sparse: a chord let ring, and lines that take their time.
      'Slow blues': [
        {
          name: 'Long chords',
          figure: [s(0, 5, 0.8), s(6, 2.5, 0.65), n(9, 10, 1.5, 0.75), n(11, 12, 1, 0.7)],
          fills: [
            [n(0, 10, 3, 0.85), n(3, 7, 3, 0.8), n(6, 5, 3, 0.8), n(9, 3, 3, 0.8)],
            [n(3, 12, 2, 0.85), n(6, 10, 1, 0.7), n(8, 7, 1, 0.7), s(9, 3, 0.75)],
            [n(0, 3, 6, 0.85), s(9, 3, 0.7)],
          ],
        },
        {
          // the chord on one, then answering the bass in the space it leaves
          name: 'Answering the bass',
          figure: [s(0, 3, 0.8), n(3, 3, 2, 0.8), n(6, 4, 1, 0.7), n(8, 7, 4, 0.85)],
          fills: [
            [n(0, 12, 2, 0.9), n(3, 10, 2, 0.8), n(6, 7, 2, 0.8), n(9, 10, 3, 0.85)],
            [s(0, 3, 0.8), n(3, 7, 3, 0.85), n(6, 5, 1, 0.7), n(8, 6, 1, 0.7), n(9, 7, 3, 0.85)],
            [n(6, 7, 1, 0.75), n(8, 10, 1, 0.75), s(9, 3, 0.8)],
          ],
        },
      ],
      // Straight eighths: the chords punch the backbeat with a light upstroke
      // after each, and the fills run in between.
      'Jump blues': [
        {
          name: 'Jump comp',
          figure: [s(4, 2, 0.85), s(6, 1, 0.45), s(12, 2, 0.85), s(14, 1, 0.45)],
          fills: [
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), n(6, 10, 2, 0.75),
             n(8, 7, 2, 0.8), n(10, 4, 2, 0.75), s(12, 4, 0.8)],
            [s(4, 2, 0.85), n(8, 9, 2, 0.75), n(10, 10, 2, 0.75), n(12, 12, 2, 0.9), n(14, 10, 2, 0.75)],
            [n(0, 3, 2, 0.85), n(2, 4, 2, 0.75), n(4, 7, 4, 0.9), n(8, 3, 2, 0.8), n(10, 4, 2, 0.75), s(12, 4, 0.85)],
          ],
        },
        {
          // a riff under the chords: the chord on the backbeat, the line on
          // the way there
          name: 'Riff and stab',
          figure: [n(0, 7, 2, 0.85), n(2, 9, 2, 0.7), s(4, 2, 0.85), n(8, 10, 2, 0.8),
                   n(10, 9, 2, 0.7), s(12, 3, 0.85)],
          fills: [
            [n(0, 12, 1, 0.8), n(2, 10, 1, 0.75), n(4, 7, 2, 0.85), n(8, 10, 1, 0.75), n(10, 7, 1, 0.75), n(12, 4, 4, 0.9)],
            [s(4, 2, 0.85), n(8, 9, 1, 0.75), n(10, 10, 1, 0.75), n(12, 12, 4, 0.9)],
            [n(2, 3, 1, 0.75), n(4, 4, 2, 0.9), n(8, 7, 1, 0.8), n(10, 3, 1, 0.75), s(12, 4, 0.8)],
          ],
        },
      ],
      // Busy: a chug on every shuffled eighth, short, and fills that run.
      'Train beat': [
        {
          name: 'Train chug',
          figure: [s(0, 0.7, 0.75), s(2, 0.6, 0.45), s(3, 0.7, 0.65), s(5, 0.6, 0.45),
                   s(6, 0.7, 0.75), s(8, 0.6, 0.45), s(9, 0.7, 0.65), s(11, 0.6, 0.45)],
          fills: [
            [n(0, 10, 0.8, 0.9), n(2, 9, 0.8, 0.7), n(3, 7, 0.8, 0.8), n(5, 5, 0.8, 0.7),
             n(6, 4, 0.8, 0.8), n(8, 3, 0.8, 0.7), n(9, 0, 2.4, 0.9)],
            [s(0, 0.7, 0.75), s(2, 0.6, 0.45), n(3, 3, 0.8, 0.8), n(5, 5, 0.8, 0.7), n(6, 6, 0.8, 0.8),
             n(8, 7, 0.8, 0.7), n(9, 10, 0.8, 0.8), n(11, 12, 0.8, 0.85)],
            [n(0, 12, 2.4, 0.9), n(3, 10, 2.4, 0.8), n(6, 7, 2.4, 0.8), s(9, 2.4, 0.75)],
          ],
        },
        {
          // the chord held on one and three, a run off the top between
          name: 'Off the top',
          figure: [s(0, 2.4, 0.8), n(3, 10, 1.6, 0.8), n(5, 10, 0.8, 0.6),
                   s(6, 2.4, 0.8), n(9, 5, 1.6, 0.8), n(11, 3, 0.8, 0.7)],
          fills: [
            [n(0, 0, 2.4, 0.9), n(3, 3, 0.8, 0.75), n(5, 5, 0.8, 0.75), n(6, 7, 2.4, 0.9), n(9, 10, 2.4, 0.8)],
            [n(0, 7, 0.8, 0.85), n(2, 10, 0.8, 0.7), n(3, 12, 1.6, 0.9), n(6, 10, 0.8, 0.8),
             n(8, 7, 0.8, 0.7), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            [n(3, 5, 0.8, 0.75), n(5, 6, 0.8, 0.75), n(6, 7, 1.6, 0.9), s(9, 2.4, 0.8)],
          ],
        },
      ],
    },
  };

  // The parts written for a feel, or none: a feel with no parts yet simply
  // offers nothing, which is how the other styles read until theirs arrive.
  function partsFor(style, feel){
    return (LIBRARY[style] && LIBRARY[style][feel]) || [];
  }

  // ---- which notes a reading allows ----------------------------------------
  // Pitch classes, as the neck would show them. These mirror the rules in
  // fretboard-view.js rather than asking it, because the neck only ever
  // shows one chord at a time and a part is realised for the whole
  // progression at once.
  const pc = name => SEMITONE[name] % 12;
  const setOf = (root, offsets) => new Set(offsets.map(o => (root + o) % 12));

  const MAJOR_PENTA = [0, 2, 4, 7, 9], MINOR_PENTA = [0, 3, 5, 7, 10];
  const MAJOR = [0, 2, 4, 5, 7, 9, 11], MIXO = [0, 2, 4, 5, 7, 9, 10], MINOR = [0, 2, 3, 5, 7, 8, 10];

  function chordTones(chord){
    const tones = [chord.note, chord.third, chord.fifth].map(pc);
    if (chord.seventh) tones.push(pc(chord.seventh));
    return new Set(tones);
  }

  // `root` is the pitch class the part's intervals are measured from — the
  // chord's, or the key's when it stays on the I — and `allowed` the notes
  // the reading offers for this bar.
  function palette(chord, opts){
    const { reading, stayOnKey, key, scaleTheory } = opts;
    const chordRoot = pc(chord.note);
    const isMinor = chord.quality === 'min';
    const keyRoot = pc(key.tonic), keyMinor = key.mode === 'minor';

    if (reading === 'caged' || reading === 'triads3'){
      // chord tones only, whatever the scale setting says
      const tones = reading === 'triads3'
        ? new Set([chord.note, chord.third, chord.fifth].map(pc))
        : chordTones(chord);
      return { root: chordRoot, allowed: tones };
    }
    if (reading === 'penta'){
      return stayOnKey
        ? { root: keyRoot, allowed: setOf(keyRoot, keyMinor ? MINOR_PENTA : MAJOR_PENTA) }
        : { root: chordRoot, allowed: setOf(chordRoot, isMinor ? MINOR_PENTA : MAJOR_PENTA) };
    }
    // scales
    if (stayOnKey){
      return { root: keyRoot, allowed: setOf(keyRoot, keyMinor ? MINOR : MAJOR) };
    }
    if (scaleTheory === 'modal'){
      // the key's notes, plus the chord's own tones, centred on the chord
      const allowed = setOf(keyRoot, keyMinor ? MINOR : MAJOR);
      chordTones(chord).forEach(t => allowed.add(t));
      return { root: chordRoot, allowed };
    }
    const flat7 = chord.seventh && (pc(chord.seventh) - chordRoot + 12) % 12 === 10;
    return { root: chordRoot, allowed: setOf(chordRoot, isMinor ? MINOR : flat7 ? MIXO : MAJOR) };
  }

  // ---- realisation ----------------------------------------------------------
  // Snap an interval to a note the reading allows: the note itself if it's
  // there, else the nearest within a tone — downward first, since a blues
  // line resolves down more often than up — else nothing.
  const SNAP_ORDER = [0, -1, 1, -2, 2];
  function snap(root, iv, allowed){
    const want = ((root + iv) % 12 + 12) % 12;
    for (const d of SNAP_ORDER){
      const p = (want + d + 12) % 12;
      if (allowed.has(p)) return { pc: p, shift: d };
    }
    return null;
  }

  // Every note in the window: string, fret and MIDI, once.
  function cellsIn(window){
    const cells = [];
    const lo = window.min, hi = window.max;
    for (let s = 0; s < 6; s++){
      if (lo === 0) cells.push({ string: s, fret: 0, midi: STRING_MIDI[s] });
      for (let f = Math.max(1, lo); f <= Math.min(FRET_COUNT, hi); f++){
        cells.push({ string: s, fret: f, midi: STRING_MIDI[s] + f });
      }
    }
    return cells;
  }

  // Where the part's root sits in this window: the lowest root on the bottom
  // three strings if there is one, else the lowest anywhere. The part climbs
  // from there, so a box high on the neck plays a high part rather than one
  // dragged down to where a lower box would have put it.
  function homeMidi(cells, root){
    const roots = cells.filter(c => c.midi % 12 === root).sort((a, b) => a.midi - b.midi);
    const low = roots.filter(c => c.string >= 3);
    if (low.length) return low[0].midi;
    if (roots.length) return roots[0].midi;
    return cells.length ? Math.min(...cells.map(c => c.midi)) : 40;
  }

  // The chord's grip inside this window: the CAGED shape whose every note
  // sits in the stretch, and if none does, the one with most of itself in
  // it, kept to the notes that are. Three strings is the least a strum can
  // be and still be a chord. A 7th chord gets its 7th the way the chords
  // reading draws it.
  function gripIn(chord, window){
    const F = GT.fretboard;
    const rootPc = pc(chord.note);
    const isMinor = chord.quality === 'min';
    const inWin = c => c.fret >= window.min && c.fret <= window.max;
    let best = null, bestIn = 0;
    F.cagedPlacements(rootPc, isMinor ? F.CAGED_MINOR : F.CAGED_MAJOR).forEach(p => {
      const cells = chord.seventh ? F.seventhCells(p, rootPc, pc(chord.seventh)) : p.cells;
      const inside = cells.filter(inWin).length;
      if (inside > bestIn || (inside === bestIn && best && cells.length === inside && best.cells.length !== best.inside)){
        best = { cells, inside }; bestIn = inside;
      }
    });
    if (!best || best.inside < 3) return null;
    return best.cells.filter(inWin).map(c => ({ string: c.string, fret: c.fret, midi: STRING_MIDI[c.string] + c.fret }));
  }

  // The order a pick sweeps, low string first, this far apart.
  const STRUM_SPREAD = 0.016;

  // Realise one written bar against one chord: a list of playable notes.
  function realiseBar(written, chord, opts){
    const { root, allowed } = palette(chord, opts);
    const cells = cellsIn(opts.window);
    const home = homeMidi(cells, root);
    const out = [];
    let prev = null;
    written.forEach(w => {
      if (w.strum){
        // every string of the grip, low to high, spread the way a pick sweeps
        const grip = gripIn(chord, opts.window);
        if (!grip) return;
        grip.sort((a, b) => b.string - a.string).forEach((c, k) => {
          out.push({ at: w.at, dur: w.dur, vel: w.vel, string: c.string, fret: c.fret, midi: c.midi,
                     strum: true, spread: k * STRUM_SPREAD });
        });
        prev = grip[grip.length - 1];
        return;
      }
      const s = snap(root, w.iv, allowed);
      if (!s) return;
      const wantMidi = home + w.iv + s.shift;
      const cands = cells.filter(c => c.midi % 12 === s.pc);
      if (!cands.length) return;
      // nearest pitch; between two places for the same pitch, the string
      // nearest the note before, so the line stays under one hand
      cands.sort((a, b) => Math.abs(a.midi - wantMidi) - Math.abs(b.midi - wantMidi)
        || (prev ? Math.abs(a.string - prev.string) - Math.abs(b.string - prev.string) : 0));
      const c = cands[0];
      out.push({ at: w.at, dur: w.dur, vel: w.vel, string: c.string, fret: c.fret, midi: c.midi, iv: w.iv });
      prev = c;
    });
    return out;
  }

  // The whole progression: `bars` is one entry per bar in order, each with
  // the chord sounding in it. Bar b takes the figure when b is even and a
  // fill when it is odd — a two-bar call and answer that loops regardless of
  // where the chords change — and which fill is `picks[phrase]`, so the same
  // roll gives the same part until it's re-rolled on purpose.
  function realise(part, bars, picks, opts){
    const notes = [];
    bars.forEach((bar, b) => {
      if (!bar.chord) return;
      const phrase = Math.floor(b / 2);
      const written = b % 2 === 0
        ? part.figure
        : part.fills[Math.abs(picks[phrase] || 0) % part.fills.length];
      realiseBar(written, bar.chord, opts).forEach(note => notes.push({ ...note, bar: b }));
    });
    return notes;
  }

  // A fresh roll of fills for a progression this many bars long.
  const rollFills = (part, barCount, rng = Math.random) =>
    Array.from({ length: Math.ceil(barCount / 2) }, () => Math.floor(rng() * part.fills.length));

  GT.parts = { LIBRARY, partsFor, palette, snap, realiseBar, realise, rollFills, cellsIn, homeMidi, gripIn };
})();
