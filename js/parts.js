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
  const n = (at, iv, dur, vel) => ({ at, iv, dur, vel });

  const LIBRARY = {
    blues: {
      // A straight-shuffle boogie: the figure walks 1-5-6-b7 the way the bass
      // does, an octave up and with the swing, and the fills answer it.
      'Shuffle': [
        {
          name: 'Boogie line',
          figure: [n(0, 0, 1.6, 0.95), n(2, 7, 0.8, 0.7), n(3, 9, 1.6, 0.85), n(5, 10, 0.8, 0.7),
                   n(6, 9, 1.6, 0.85), n(8, 7, 0.8, 0.7), n(9, 0, 1.6, 0.85), n(11, 7, 0.8, 0.7)],
          fills: [
            // a walk down from the octave to the root
            [n(0, 12, 1.6, 0.9), n(2, 10, 0.8, 0.7), n(3, 9, 1.6, 0.8), n(5, 7, 0.8, 0.7),
             n(6, 5, 1.6, 0.8), n(8, 4, 0.8, 0.7), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            // a pentatonic answer that climbs and falls back
            [n(0, 3, 1.6, 0.9), n(2, 5, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(6, 10, 1.6, 0.85),
             n(8, 12, 0.8, 0.8), n(9, 10, 1.6, 0.8), n(11, 7, 0.8, 0.7)],
            // space on the one, then a push up to the octave
            [n(3, 7, 1.6, 0.8), n(5, 10, 0.8, 0.7), n(6, 12, 2.4, 0.9), n(9, 10, 1.6, 0.8), n(11, 7, 0.8, 0.7)],
          ],
        },
        {
          name: 'Box lick',
          figure: [n(0, 12, 1.6, 0.95), n(2, 10, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(5, 5, 0.8, 0.7),
                   n(6, 7, 2.4, 0.85), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
          fills: [
            [n(0, 0, 1.6, 0.9), n(2, 3, 0.8, 0.7), n(3, 5, 1.6, 0.8), n(5, 6, 0.8, 0.7),
             n(6, 7, 2.4, 0.9), n(9, 10, 1.6, 0.8), n(11, 12, 0.8, 0.75)],
            [n(0, 7, 2.4, 0.9), n(3, 10, 1.6, 0.8), n(5, 7, 0.8, 0.7), n(6, 5, 1.6, 0.8),
             n(8, 3, 0.8, 0.7), n(9, 0, 2.4, 0.85)],
            [n(2, 3, 0.8, 0.7), n(3, 4, 1.6, 0.85), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.7), n(9, 12, 2.4, 0.9)],
          ],
        },
      ],
      // 12/8 and sparse: long notes that land on chord tones, and a fill
      // that takes its time coming down.
      'Slow blues': [
        {
          name: 'Long notes',
          figure: [n(0, 7, 3, 0.9), n(6, 10, 2, 0.8), n(9, 12, 3, 0.85)],
          fills: [
            [n(0, 10, 3, 0.85), n(3, 7, 3, 0.8), n(6, 5, 3, 0.8), n(9, 3, 3, 0.8)],
            [n(3, 12, 2, 0.85), n(6, 10, 1, 0.7), n(8, 7, 1, 0.7), n(9, 5, 3, 0.8)],
            [n(0, 3, 6, 0.85), n(9, 0, 3, 0.8)],
          ],
        },
        {
          name: 'Answering the bass',
          figure: [n(3, 3, 2, 0.85), n(6, 4, 1, 0.75), n(8, 7, 4, 0.9)],
          fills: [
            [n(0, 12, 2, 0.9), n(3, 10, 2, 0.8), n(6, 7, 2, 0.8), n(9, 10, 3, 0.85)],
            [n(0, 5, 1, 0.75), n(2, 6, 1, 0.75), n(3, 7, 3, 0.9), n(9, 3, 3, 0.8)],
            [n(6, 7, 1, 0.75), n(8, 10, 1, 0.75), n(9, 12, 3, 0.9)],
          ],
        },
      ],
      // Straight eighths: the drive is the backbeat, so the figure sits on
      // and around it rather than filling every eighth.
      'Jump blues': [
        {
          name: 'Jump riff',
          figure: [n(0, 7, 2, 0.9), n(2, 9, 2, 0.75), n(4, 10, 2, 0.85), n(8, 9, 2, 0.8),
                   n(10, 7, 2, 0.75), n(12, 4, 4, 0.9)],
          fills: [
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), n(6, 10, 2, 0.75),
             n(8, 7, 2, 0.8), n(10, 4, 2, 0.75), n(12, 0, 4, 0.9)],
            [n(4, 10, 2, 0.8), n(6, 12, 2, 0.85), n(8, 10, 2, 0.8), n(10, 7, 2, 0.75), n(12, 9, 4, 0.85)],
            [n(0, 3, 2, 0.85), n(2, 4, 2, 0.75), n(4, 7, 4, 0.9), n(8, 3, 2, 0.8), n(10, 4, 2, 0.75), n(12, 7, 4, 0.9)],
          ],
        },
        {
          name: 'Backbeat stabs',
          figure: [n(4, 7, 2, 0.9), n(6, 10, 1, 0.6), n(12, 7, 2, 0.9), n(14, 4, 1, 0.6)],
          fills: [
            [n(0, 12, 1, 0.8), n(2, 10, 1, 0.75), n(4, 7, 2, 0.85), n(8, 10, 1, 0.75), n(10, 7, 1, 0.75), n(12, 4, 4, 0.9)],
            [n(4, 7, 2, 0.9), n(8, 9, 1, 0.75), n(10, 10, 1, 0.75), n(12, 12, 4, 0.9)],
            [n(2, 3, 1, 0.75), n(4, 4, 2, 0.9), n(8, 7, 1, 0.8), n(10, 3, 1, 0.75), n(12, 0, 4, 0.9)],
          ],
        },
      ],
      // Busy: a root-fifth chug on every shuffled eighth, and fills that
      // run rather than sing.
      'Train beat': [
        {
          name: 'Train chug',
          figure: [n(0, 0, 0.8, 0.9), n(2, 0, 0.8, 0.6), n(3, 7, 0.8, 0.85), n(5, 7, 0.8, 0.6),
                   n(6, 0, 0.8, 0.9), n(8, 0, 0.8, 0.6), n(9, 7, 0.8, 0.85), n(11, 7, 0.8, 0.6)],
          fills: [
            [n(0, 10, 0.8, 0.9), n(2, 9, 0.8, 0.7), n(3, 7, 0.8, 0.8), n(5, 5, 0.8, 0.7),
             n(6, 4, 0.8, 0.8), n(8, 3, 0.8, 0.7), n(9, 0, 2.4, 0.9)],
            [n(3, 3, 0.8, 0.8), n(5, 5, 0.8, 0.7), n(6, 6, 0.8, 0.8), n(8, 7, 0.8, 0.7),
             n(9, 10, 0.8, 0.8), n(11, 12, 0.8, 0.85)],
            [n(0, 12, 2.4, 0.9), n(3, 10, 2.4, 0.8), n(6, 7, 2.4, 0.8), n(9, 5, 2.4, 0.8)],
          ],
        },
        {
          name: 'Off the top',
          figure: [n(0, 12, 1.6, 0.9), n(2, 12, 0.8, 0.6), n(3, 10, 1.6, 0.85), n(5, 10, 0.8, 0.6),
                   n(6, 7, 1.6, 0.85), n(8, 7, 0.8, 0.6), n(9, 5, 1.6, 0.85), n(11, 3, 0.8, 0.7)],
          fills: [
            [n(0, 0, 2.4, 0.9), n(3, 3, 0.8, 0.75), n(5, 5, 0.8, 0.75), n(6, 7, 2.4, 0.9), n(9, 10, 2.4, 0.8)],
            [n(0, 7, 0.8, 0.85), n(2, 10, 0.8, 0.7), n(3, 12, 1.6, 0.9), n(6, 10, 0.8, 0.8),
             n(8, 7, 0.8, 0.7), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            [n(3, 5, 0.8, 0.75), n(5, 6, 0.8, 0.75), n(6, 7, 1.6, 0.9), n(9, 3, 0.8, 0.75), n(11, 0, 0.8, 0.8)],
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

  // Realise one written bar against one chord: a list of playable notes.
  function realiseBar(written, chord, opts){
    const { root, allowed } = palette(chord, opts);
    const cells = cellsIn(opts.window);
    const home = homeMidi(cells, root);
    const out = [];
    let prev = null;
    written.forEach(w => {
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

  GT.parts = { LIBRARY, partsFor, palette, snap, realiseBar, realise, rollFills, cellsIn, homeMidi };
})();
