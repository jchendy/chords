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
// method-book descriptions of shuffle, jump and slow-blues rhythm playing;
// of rock eighth-note, half-time and stab rhythm guitar; of four-to-the-bar
// and Charleston-figure jazz comping and the thumb-and-fingers bossa nova
// pattern; of the down-down-up-up-down-up pop strum and broken-chord
// accompaniment; of the hit-on-one, sixteenth-note-chop and off-beat disco
// vocabulary of funk rhythm guitar. What each part takes from those is
// where the weight falls and which strings carry it, never a line.
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
  const { SEMITONE, displayName } = GT.theory;
  const { STRING_MIDI, FRET_COUNT } = GT.fretboard;

  // ---- the library ---------------------------------------------------------
  // Keyed by the style, then the feel's label as audio.js's STYLES names it.
  // `figure` is bar one; `fills` are the choices for bar two. `variants` are
  // other ways of playing bar one — the same figure with its weight moved,
  // a pickup added, a strum opened out — that the phrases take in turn, so
  // four bars on one chord don't come out as the same bar four times over.
  // They cycle rather than roll: the part stays what it was until you ask
  // for a change, and the fills are where the dice are. Slots are on
  // the feel's grid: twelve to a bar for a shuffle (three to a beat, the
  // first and third being the swung eighths), sixteen for a straight feel.
  // dur is in slots. vel is 0..1, and the downbeat leans harder.
  //   n — one note, an interval above the root
  //   s — a strum of the chord: the grip the box is built on, spread the
  //       way a pick sweeps. A part is rhythm guitar with fills, not a lead
  //       line, and the rhythm half is these. A fourth argument says how
  //       much of the grip: 'full' (the default) is every string; 'low' the
  //       bottom three, where a shuffle or a boogie keeps its weight; 'high'
  //       the top three, a stab or a chop; 'bass' the root alone, the way
  //       an alternating-bass strum puts a single low note before the
  //       chord, and 'fifth' the 5th alone, the note that bass alternates
  //       to. In the triads reading every one of these is the triad the
  //       neck is showing ('bass' and 'fifth' its lowest note), since that
  //       is the whole of what that reading offers.
  //   nx — one note measured from the NEXT bar's chord rather than this
  //       one's: how a fill points where the music is going. A player
  //       ending a bar on the ♭7 of the IV chord's 3rd, or walking up
  //       chromatically under the next root, is hearing the change coming,
  //       and these are the notes that do it. An interval below zero is
  //       below that root: -1 is the semitone under it. When the part
  //       stays on the I, "next" is the I too and these read as plain
  //       intervals above it.
  //   d — a double stop: two notes at once, the second an interval above
  //       the same root, on another string. Funk's 4ths, rockabilly's 6ths.
  //   b — a bend: the note picked and pushed up `up` semitones (1 or 2) to
  //       a note the reading allows. Blues and rock live on these.
  //   h / p — a hammer-on / pull-off: the note picked, then the second
  //       sounded on the same string without the pick, up or down.
  //   sl — a slide into the note from `from` semitones above the root,
  //       on the same string. Into a chord tone, the way jazz and funk do.
  //   Every one of these can be switched off in the part view, and then
  //   plays plain: a double stop as its first note, a bend as the note it
  //       bent to, a hammer-on or pull-off as two picked notes, a slide as
  //       the note it slid to. Where the window can't hold the technique —
  //       no higher fret on that string for the hammer-on, an open string
  //       under a bend — it plays plain too, rather than not at all.
  const n = (at, iv, dur, vel) => ({ at, iv, dur, vel });
  const nx = (at, iv, dur, vel) => ({ at, iv, dur, vel, next: true });
  //   A fifth argument to s, 'mute', is the heel of the hand on the strings:
  //       the palm-muted chug of rock and metal, short and dark.
  const s = (at, dur, vel, voicing = 'full', mute = null) => ({ at, dur, vel, strum: true, voicing, mute: mute === 'mute' });
  const d = (at, iv, iv2, dur, vel) => ({ at, iv, iv2, dur, vel, tech: 'double' });
  const b = (at, iv, up, dur, vel) => ({ at, iv, up, dur, vel, tech: 'bend' });
  const h = (at, iv, iv2, dur, vel) => ({ at, iv, iv2, dur, vel, tech: 'hammer' });
  const p = (at, iv, iv2, dur, vel) => ({ at, iv, iv2, dur, vel, tech: 'pull' });
  const sl = (at, from, iv, dur, vel) => ({ at, iv, from, dur, vel, tech: 'slide' });
  const TECHNIQUES = ['double', 'bend', 'hammer', 'pull', 'slide'];

  // Simple has no feels of its own — quarter, half and whole notes are the
  // same piano hit at three spacings — so its parts are written for this one
  // stand-in, on a sixteenth grid like the straight styles.
  const SIMPLE_FEEL = { label: 'Simple', grid: 16 };

  const LIBRARY = {
    simple: {
      // The plainest thing to play over a plain backing: the chord struck
      // whole on one, and a run through part of the scale for the rest of
      // the bar, in quarter notes or eighths. A chord only ever on the
      // first beat — the backing is already a chord a beat, and a part that
      // struck more would be doubling it. The reading decides which notes
      // the run lands on — in Chords it thins to the chord tones, in Scales
      // it is the scale.
      'Simple': [
        {
          name: 'Quarter-note run',
          figure: [s(0, 4, 0.85), n(4, 0, 4, 0.8), n(8, 2, 4, 0.75), n(12, 4, 4, 0.8)],
          variants: [
            [s(0, 4, 0.85), n(4, 4, 4, 0.8), n(8, 2, 4, 0.75), n(12, 0, 4, 0.8)],
            [s(0, 4, 0.85), n(4, 7, 4, 0.8), n(8, 5, 4, 0.75), n(12, 4, 4, 0.8)],
          ],
          fills: [
            // on up the scale
            [h(0, 5, 7, 8, 0.8), n(8, 9, 4, 0.8), n(12, 12, 4, 0.85)],
            // down from the octave, and a step below the next root to lead in
            [n(0, 12, 4, 0.85), n(4, 11, 4, 0.75), n(8, 9, 4, 0.75), nx(12, -2, 4, 0.8)],
            // the chord, then down to the next chord's fifth
            [s(0, 4, 0.85), n(4, 4, 4, 0.75), n(8, 2, 4, 0.75), nx(12, 7, 4, 0.8)],
          ],
        },
        {
          name: 'Eighth-note run',
          figure: [s(0, 4, 0.85), n(4, 0, 2, 0.8), n(6, 2, 2, 0.7), n(8, 4, 2, 0.75), n(10, 5, 2, 0.7), n(12, 7, 2, 0.75), n(14, 9, 2, 0.7)],
          variants: [
            [s(0, 4, 0.85), n(4, 4, 2, 0.8), n(6, 5, 2, 0.7), n(8, 7, 2, 0.75), n(10, 9, 2, 0.7), n(12, 11, 2, 0.75), n(14, 12, 2, 0.75)],
            [s(0, 4, 0.85), n(4, 7, 2, 0.8), n(6, 5, 2, 0.7), n(8, 4, 2, 0.75), n(10, 2, 2, 0.7), n(12, 0, 4, 0.8)],
          ],
          fills: [
            // the whole way down from the octave
            [n(0, 12, 2, 0.85), n(2, 11, 2, 0.7), n(4, 9, 2, 0.75), n(6, 7, 2, 0.7), n(8, 5, 2, 0.75), n(10, 4, 2, 0.7), n(12, 2, 2, 0.75), n(14, 0, 2, 0.8)],
            // up to the octave, then a step down onto the next root
            [n(0, 5, 2, 0.8), n(2, 7, 2, 0.7), n(4, 9, 2, 0.75), n(6, 11, 2, 0.7), n(8, 12, 4, 0.85), nx(12, 2, 2, 0.7), nx(14, -1, 2, 0.7)],
            // the chord, and a turn round the root that walks to the next one
            [s(0, 4, 0.85), p(4, 2, 0, 4, 0.75), n(8, 2, 2, 0.7), n(10, 4, 2, 0.75), nx(12, 7, 2, 0.7), nx(14, -1, 2, 0.75)],
          ],
        },
      ],
    },

    blues: {
      // What a blues player actually plays between the chords: a handful of
      // notes — the root, the ♭3 leaning on the 3, the 4th, the 5th, the ♭7
      // — said more than once rather than a scale said once, with room in
      // the bar, and the last beat pointing at the next chord: the ♭7 of
      // this one falling to the 3rd of the IV, or a chromatic step up under
      // the next root. A straight shuffle: down on the first triplet, up on
      // the third, the downbeats leaning harder.
      'Blues shuffle': [
        {
          name: 'Shuffle comp',
          // on the low strings, where a shuffle keeps its weight
          figure: [s(0, 1.6, 0.8, 'low'), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.7, 'low'), s(5, 0.8, 0.5, 'low'),
                   s(6, 1.6, 0.8, 'low'), s(8, 0.8, 0.5, 'low'), s(9, 1.6, 0.7, 'low'), s(11, 0.8, 0.5, 'low')],
          variants: [
            // the last beat walks up to the octave instead of chugging
            [s(0, 1.6, 0.8, 'low'), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.7, 'low'), s(5, 0.8, 0.5, 'low'),
             s(6, 1.6, 0.8, 'low'), s(8, 0.8, 0.5, 'low'), n(9, 10, 1.6, 0.75), n(11, 12, 0.8, 0.7)],
            // the whole chord on one, and a bass note to lead out
            [s(0, 1.6, 0.85), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.7, 'low'), s(5, 0.8, 0.5, 'low'),
             s(6, 1.6, 0.8, 'low'), s(8, 0.8, 0.5, 'low'), s(9, 1.6, 0.7, 'low'), s(11, 0.8, 0.6, 'bass')],
          ],
          fills: [
            // the ♭3 pushed at the 3rd, the root said twice, the ♭7 answering
            [h(0, 3, 4, 2.4, 0.85), n(3, 0, 1.6, 0.8), n(5, 0, 0.8, 0.6),
             n(6, 10, 1.6, 0.85), n(8, 7, 0.8, 0.7), n(9, 5, 1.6, 0.75), n(11, 3, 0.8, 0.7)],
            // up through the 4th and 5th to the ♭7, then a step below the next root
            [n(0, 0, 1.6, 0.85), b(3, 5, 2, 2.4, 0.8), n(6, 10, 2.4, 0.85),
             nx(9, -2, 1.6, 0.75), nx(11, -1, 0.8, 0.75)],
            // half a bar of chords, then the ♭7 falling to the next chord's 3rd
            [s(0, 1.6, 0.8, 'low'), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.7, 'low'), n(6, 10, 1.6, 0.85), n(8, 10, 0.8, 0.6),
             nx(9, 4, 1.6, 0.8), nx(11, 7, 0.8, 0.7)],
          ],
        },
        {
          // Stabs on the beat with a lick in the gaps: chords on one and
          // three, single notes leading into them.
          name: 'Stabs and licks',
          // the stabs on the top strings, out of the bass's way
          figure: [s(0, 2.4, 0.85, 'high'), n(3, 7, 1.6, 0.75), n(5, 10, 0.8, 0.65),
                   s(6, 2.4, 0.8, 'high'), n(9, 3, 1.6, 0.75), n(11, 0, 0.8, 0.65)],
          variants: [
            // a second, lighter stab on the and of two
            [s(0, 2.4, 0.85, 'high'), n(3, 10, 1.6, 0.75), s(5, 0.8, 0.55, 'high'),
             s(6, 2.4, 0.8, 'high'), n(9, 7, 1.6, 0.75), n(11, 5, 0.8, 0.65)],
            // the stabs on two and four, the root on one
            [n(0, 0, 1.6, 0.8), s(3, 2.4, 0.85, 'high'), n(6, 7, 1.6, 0.75), n(8, 10, 0.8, 0.65),
             s(9, 2.4, 0.8, 'high')],
          ],
          fills: [
            // the root, the ♭3 into the 3rd, and the 5th held — a bar that breathes
            [n(0, 0, 1.6, 0.9), h(2, 3, 4, 3.2, 0.8), n(6, 7, 3, 0.85), nx(9, 7, 1.6, 0.75), nx(11, 4, 0.8, 0.7)],
            // the ♭7 and 5th rocked, then down to the next root from above
            [n(0, 10, 1.6, 0.85), n(2, 7, 0.8, 0.7), n(3, 10, 1.6, 0.8), n(5, 7, 0.8, 0.7),
             n(6, 5, 1.6, 0.8), n(8, 3, 0.8, 0.7), nx(9, 2, 1.6, 0.75), nx(11, 1, 0.8, 0.7)],
            // a stab, then the 4th pushed to the 5th and the octave held
            [s(0, 1.6, 0.8, 'high'), b(3, 5, 2, 1.6, 0.8), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.75),
             n(9, 12, 2.4, 0.9)],
          ],
        },
      ],
      // 12/8 and sparse: a chord let ring, and lines that take their time —
      // one idea a bar, a note bent at (here, leaned on) and left.
      'Slow blues': [
        {
          name: 'Long chords',
          // the whole chord let ring on one, the top of it again on three
          figure: [s(0, 5, 0.8), s(6, 2.5, 0.65, 'high'), n(9, 10, 1.5, 0.75), n(11, 12, 1, 0.7)],
          variants: [
            // the line at the end comes from below instead
            [s(0, 5, 0.8), s(6, 2.5, 0.65, 'high'), n(9, 7, 1.5, 0.7), n(11, 10, 1, 0.7)],
            // the chord restruck on two, softly, and left to ring
            [s(0, 3, 0.8), s(3, 3, 0.5, 'high'), s(6, 5, 0.7, 'high'), n(11, 12, 1, 0.7)],
          ],
          fills: [
            // the ♭3 held against the chord, resolved to the root late
            [b(0, 3, 1, 5, 0.85), n(5, 0, 4, 0.85), nx(9, 7, 2, 0.7), nx(11, -1, 1, 0.7)],
            // the ♭7 answered by the 5th, twice, then the next chord's 3rd
            [n(0, 10, 2, 0.85), n(2, 7, 1, 0.7), n(3, 10, 2, 0.8), n(5, 7, 1, 0.7), n(6, 5, 3, 0.8), nx(9, 4, 3, 0.8)],
            // one note, the 5th, and the chord to close
            [n(0, 7, 6, 0.85), n(6, 5, 1, 0.65), n(7, 3, 2, 0.75), s(9, 3, 0.7)],
          ],
        },
        {
          // the chord on one, then answering the bass in the space it leaves
          name: 'Answering the bass',
          // the root alone on one, the chord's top on three
          figure: [s(0, 3, 0.8, 'bass'), n(3, 3, 2, 0.8), n(6, 4, 1, 0.7), s(8, 4, 0.85, 'high')],
          variants: [
            // the answer from the 5th up to the 7th
            [s(0, 3, 0.8, 'bass'), n(3, 7, 2, 0.8), n(6, 10, 1, 0.7), s(8, 4, 0.85, 'high')],
            // the whole chord on one, the line arriving late
            [s(0, 3, 0.85), n(6, 3, 1, 0.75), n(8, 4, 1, 0.75), n(9, 7, 3, 0.85)],
          ],
          fills: [
            // the octave down to the ♭7, sat on, then the next chord's root from below
            [n(0, 12, 2, 0.9), n(2, 10, 4, 0.85), n(6, 10, 1, 0.6), n(7, 7, 2, 0.75), nx(9, -1, 3, 0.8)],
            // the chord, and the 4th-5th-♭7 climb blues lines are made of
            [s(0, 3, 0.8), sl(3, 5, 7, 3, 0.8), n(6, 10, 3, 0.85), nx(9, 4, 3, 0.75)],
            // the root, twice, and the chord on the and of three
            [n(0, 0, 3, 0.85), n(3, 0, 1, 0.6), n(4, 3, 2, 0.75), n(6, 0, 1, 0.7), s(8, 4, 0.8, 'high')],
          ],
        },
      ],
      // Straight eighths: the chords punch the backbeat with a light upstroke
      // after each, and the fills run in between — the boogie's 6th and ♭7
      // and the ♭3/3, with the last beat walking to the next chord.
      'Jump blues': [
        {
          name: 'Jump comp',
          // backbeat stabs on the top strings, the upstroke lighter still
          figure: [s(4, 2, 0.85, 'high'), s(6, 1, 0.45, 'high'), s(12, 2, 0.85, 'high'), s(14, 1, 0.45, 'high')],
          variants: [
            // the root under one and three, the stabs as they were
            [s(0, 2, 0.7, 'bass'), s(4, 2, 0.85, 'high'), s(6, 1, 0.45, 'high'),
             s(8, 2, 0.7, 'bass'), s(12, 2, 0.85, 'high'), s(14, 1, 0.45, 'high')],
            // a push: the second stab early, on the and of three
            [s(4, 2, 0.85, 'high'), s(6, 1, 0.45, 'high'), s(10, 2, 0.8, 'high'), s(14, 1, 0.45, 'high')],
          ],
          fills: [
            // the boogie walk up — root, 3, 5, 6, ♭7 — and back down onto the next chord's 5th
            [n(0, 0, 2, 0.9), n(2, 4, 2, 0.75), n(4, 7, 2, 0.8), n(6, 9, 2, 0.75),
             n(8, 10, 2, 0.85), n(10, 9, 2, 0.7), n(12, 7, 2, 0.75), nx(14, 7, 2, 0.75)],
            // a stab, the ♭3 into the 3rd twice, then a chromatic step up under the next root
            [s(4, 2, 0.85, 'high'), h(8, 3, 4, 2, 0.75), h(10, 3, 4, 2, 0.75),
             nx(12, -2, 2, 0.75), nx(14, -1, 2, 0.8)],
            // the 5th said three times, and the chord on three
            [n(0, 7, 2, 0.85), n(2, 7, 2, 0.6), n(4, 7, 2, 0.8), n(6, 10, 2, 0.8), s(8, 4, 0.85, 'high'),
             nx(12, 4, 2, 0.7), nx(14, 7, 2, 0.7)],
          ],
        },
        {
          // a riff under the chords: the chord on the backbeat, the line on
          // the way there
          name: 'Riff and stab',
          figure: [n(0, 7, 2, 0.85), n(2, 9, 2, 0.7), s(4, 2, 0.85, 'high'), n(8, 10, 2, 0.8),
                   n(10, 9, 2, 0.7), s(12, 3, 0.85, 'high')],
          variants: [
            // the riff from the root, and an upstroke after the first stab
            [n(0, 0, 2, 0.85), n(2, 3, 2, 0.7), s(4, 2, 0.85, 'high'), s(6, 1, 0.45, 'high'),
             n(8, 10, 2, 0.8), n(10, 12, 2, 0.7), s(12, 3, 0.85, 'high')],
            // the riff held back to the second half
            [s(4, 2, 0.85, 'high'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.7), s(12, 2, 0.85, 'high'), n(14, 10, 2, 0.7)],
          ],
          fills: [
            // the octave, ♭7, 5 — the top of the boogie — and the next root from a step above
            [n(0, 12, 2, 0.85), n(2, 12, 1, 0.5), n(3, 10, 1, 0.75), n(4, 7, 2, 0.85), n(6, 7, 2, 0.6),
             n(8, 10, 2, 0.8), n(10, 7, 2, 0.75), nx(12, 2, 2, 0.7), nx(14, 0, 2, 0.8)],
            // a stab, then 6-♭7-octave and the octave held
            [s(4, 2, 0.85, 'high'), n(8, 9, 1, 0.75), n(9, 10, 1, 0.75), n(10, 12, 4, 0.9), nx(14, 7, 2, 0.7)],
            // the ♭3 into the 3rd, the 5th, and a chromatic walk up to the next chord
            [h(0, 3, 4, 4, 0.9), n(4, 7, 2, 0.8), n(6, 7, 2, 0.6), s(8, 2, 0.8, 'high'),
             nx(11, -3, 1, 0.7), nx(12, -2, 2, 0.75), nx(14, -1, 2, 0.8)],
          ],
        },
      ],
    },

    rock: {
      // Rock lines are the minor pentatonic said plainly — the root, ♭7, 5
      // and 4, in that order of how often — with a note repeated rather
      // than a scale run, and the last beat walking up to the next chord's
      // root from the ♭7 or a tone below.
      'Rock': [
        {
          name: 'Driving eighths',
          figure: [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
                   s(8, 1.8, 0.8, 'low'), s(10, 1.8, 0.55, 'low'), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.55, 'low')],
          variants: [
            // the whole chord on one, the root alone pushing into the next bar
            [s(0, 1.8, 0.9), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             s(8, 1.8, 0.8, 'low'), s(10, 1.8, 0.55, 'low'), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.7, 'bass')],
            // the chord held on one and three, chugging between
            [s(0, 3.6, 0.9), s(4, 1.8, 0.6, 'low'), s(6, 1.8, 0.55, 'low'),
             s(8, 3.6, 0.85), s(12, 1.8, 0.6, 'low'), s(14, 1.8, 0.55, 'low')],
          ],
          fills: [
            // root, root, ♭7, 5 — and the walk up to the next chord
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.65), n(4, 10, 2, 0.85), n(6, 7, 2, 0.8),
             n(8, 5, 2, 0.8), n(10, 7, 2, 0.7), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.8)],
            // half a bar of chugging, then the 4th pushed to the 5th and the ♭7
            [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             b(8, 5, 2, 4, 0.85), n(12, 10, 2, 0.85), nx(14, 7, 2, 0.75)],
            // the octave hammered, then down to the 5th and the chord on three
            [n(0, 12, 2, 0.9), n(2, 12, 2, 0.6), n(4, 10, 2, 0.8), n(6, 7, 2, 0.8),
             s(8, 3.6, 0.85), s(12, 1.8, 0.6, 'low'), s(14, 1.8, 0.55, 'low')],
          ],
        },
        {
          // the chord on one, the and of two and four — the stab pattern
          // the drums' kick-on-the-and leans on
          name: 'Stabs on the and',
          figure: [s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), s(12, 3, 0.85, 'low')],
          variants: [
            // an upstroke on the top after four
            [s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), s(12, 2, 0.85, 'low'), s(14, 1, 0.5, 'high')],
            // two in as well, the chord opened out on one
            [s(0, 3, 0.9), s(4, 2, 0.7, 'low'), s(6, 2, 0.8, 'low'), s(12, 3, 0.85, 'low')],
          ],
          fills: [
            // the root and the ♭3 into the 4th, twice — a riff, not a run
            [n(0, 0, 2, 0.9), n(2, 0, 1, 0.5), h(3, 3, 5, 3, 0.8), n(6, 0, 2, 0.75),
             n(8, 0, 1, 0.5), h(9, 3, 5, 3, 0.8), nx(12, 7, 2, 0.75), nx(14, 10, 2, 0.75)],
            // a stab, then the ♭7 falling to the 5th and the next root from a tone below
            [s(0, 4, 0.9, 'low'), n(6, 10, 2, 0.85), n(8, 10, 2, 0.6), n(10, 7, 2, 0.8), nx(12, -2, 2, 0.75), nx(14, -2, 2, 0.6)],
            // the 5th, the ♭7 and the octave held, and the chord back on four
            [n(0, 7, 2, 0.85), n(2, 10, 2, 0.8), n(4, 12, 6, 0.9), n(10, 10, 2, 0.7), s(12, 3, 0.8, 'low')],
          ],
        },
      ],
      // Busier: every eighth on the low strings, the whole chord on 1 and 3
      // — the chug rock rhythm guitar is built on — and riffs in the gaps.
      'Straight rock': [
        {
          name: 'Eighth-note chug',
          figure: [s(0, 1.8, 0.9), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
                   s(8, 1.8, 0.85), s(10, 1.8, 0.55, 'low'), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.55, 'low')],
          variants: [
            // all low, the root alone leading round
            [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             s(8, 1.8, 0.8, 'low'), s(10, 1.8, 0.55, 'low'), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.7, 'bass')],
            // the ands up top
            [s(0, 1.8, 0.9), s(2, 1.8, 0.5, 'high'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.5, 'high'),
             s(8, 1.8, 0.8, 'low'), s(10, 1.8, 0.5, 'high'), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.5, 'high')],
          ],
          fills: [
            // root, root, ♭3, 4 / 5, 4, ♭3 — and up to the next root
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), h(4, 3, 5, 4, 0.8),
             n(8, 7, 2, 0.85), n(10, 5, 2, 0.7), n(12, 3, 2, 0.8), nx(14, -1, 2, 0.8)],
            // chugging, then the octave, ♭7, 5 and the next chord's 5th
            [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             n(8, 12, 2, 0.9), n(10, 10, 2, 0.75), n(12, 7, 2, 0.8), nx(14, 7, 2, 0.75)],
            // 5, ♭7, octave, octave — then the chord on three
            [n(0, 7, 2, 0.85), n(2, 10, 2, 0.75), n(4, 12, 2, 0.85), n(6, 12, 2, 0.6),
             s(8, 3.6, 0.9), s(12, 1.8, 0.7, 'low'), s(14, 1.8, 0.55, 'low')],
          ],
        },
        {
          name: 'Chords and a riff',
          figure: [s(0, 4, 0.9), s(4, 2, 0.7, 'low'), s(6, 2, 0.6, 'low'),
                   n(8, 0, 2, 0.85), n(10, 3, 2, 0.75), n(12, 5, 2, 0.8), n(14, 7, 2, 0.8)],
          variants: [
            // the riff first, the chords answering
            [n(0, 0, 2, 0.85), n(2, 3, 2, 0.75), n(4, 5, 2, 0.8), n(6, 7, 2, 0.8),
             s(8, 4, 0.9), s(12, 2, 0.7, 'low'), s(14, 2, 0.6, 'low')],
            // the chord let ring, a note pushing into three
            [s(0, 6, 0.9), n(6, 7, 2, 0.75), s(8, 4, 0.85), n(12, 10, 2, 0.75), n(14, 12, 2, 0.8)],
          ],
          fills: [
            // the octave and ♭7 rocked, the 5th, and down onto the next root from above
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 12, 2, 0.8), n(6, 10, 2, 0.75), n(8, 7, 4, 0.85), nx(12, 2, 2, 0.75), nx(14, 0, 2, 0.8)],
            // low chords, the 4th into the 5th, low chords, the ♭7 into the octave
            [s(0, 2, 0.85, 'low'), s(2, 2, 0.55, 'low'), b(4, 5, 2, 4, 0.8),
             s(8, 2, 0.8, 'low'), s(10, 2, 0.55, 'low'), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)],
            // ♭3, 4, and the 5th held, the chord to close
            [n(0, 3, 2, 0.8), n(2, 5, 2, 0.8), n(4, 7, 6, 0.9), s(10, 2, 0.5, 'high'), s(12, 4, 0.85)],
          ],
        },
      ],
      // Half-time: the chord held long, the riff slow and low — space is the
      // point, so the fills leave it, and say a note twice rather than move.
      'Half-time rock': [
        {
          name: 'Big chords',
          figure: [s(0, 7, 0.9), s(8, 7, 0.85)],
          variants: [
            // a low chug before three, the root alone leading round
            [s(0, 6, 0.9), s(6, 2, 0.6, 'low'), s(8, 6, 0.85), s(14, 2, 0.6, 'bass')],
            // two light upstrokes after one
            [s(0, 4, 0.9), s(4, 2, 0.5, 'high'), s(6, 2, 0.5, 'high'), s(8, 8, 0.85)],
          ],
          fills: [
            // root held, ♭3 to 4, the 5th held, and the walk up to the next chord
            [n(0, 0, 4, 0.9), sl(4, 3, 5, 4, 0.8), n(8, 7, 4, 0.85), nx(12, -2, 2, 0.7), nx(14, -1, 2, 0.75)],
            // the chord for half the bar, then the octave and ♭7 and the 5th held
            [s(0, 8, 0.9), n(8, 12, 2, 0.85), n(10, 10, 2, 0.75), n(12, 7, 4, 0.8)],
            // 5, ♭7, and the octave held — three notes in a bar
            [n(0, 7, 4, 0.85), n(4, 10, 4, 0.8), n(8, 12, 8, 0.9)],
          ],
        },
        {
          name: 'Low riff',
          figure: [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8),
                   s(8, 4, 0.85, 'low'), n(12, 7, 2, 0.8), n(14, 5, 2, 0.7)],
          variants: [
            [n(0, 0, 4, 0.9), n(4, 5, 2, 0.8), n(6, 7, 2, 0.8), s(8, 4, 0.85, 'low'), n(12, 3, 2, 0.75), n(14, 0, 2, 0.75)],
            [s(0, 4, 0.85, 'low'), n(4, 0, 2, 0.8), n(6, 3, 2, 0.75), s(8, 4, 0.85, 'low'), n(12, 5, 2, 0.75), n(14, 7, 2, 0.8)],
          ],
          fills: [
            // the octave twice, ♭7, 5 — then the next root from a tone below
            [n(0, 12, 2, 0.9), n(2, 12, 2, 0.6), n(4, 10, 2, 0.8), n(6, 7, 2, 0.75), n(8, 5, 4, 0.85), nx(12, -2, 4, 0.8)],
            // two big chords
            [s(0, 8, 0.9), s(8, 8, 0.85)],
            // the root held, ♭3, then 4 and the 5th, and the next chord's 5th
            [n(0, 0, 6, 0.9), h(6, 3, 5, 6, 0.85), nx(12, 7, 4, 0.8)],
          ],
        },
      ],
    },

    rockabilly: {
      // Swung: three to a beat. The rhythm is boom-chick — the bass note on
      // the beat, the chord on the top strings on the and — and the lines
      // are the major side of the boogie: root, 3, 5, 6 and the ♭7, the ♭3
      // pushed into the 3, the octave, walked up and down the low strings
      // and walked chromatically into the next chord.
      'Rockabilly': [
        {
          name: 'Boom-chick',
          figure: [s(0, 1.6, 0.85, 'bass'), s(2, 0.8, 0.6, 'high'), s(3, 1.6, 0.8, 'bass'), s(5, 0.8, 0.6, 'high'),
                   s(6, 1.6, 0.85, 'bass'), s(8, 0.8, 0.6, 'high'), s(9, 1.6, 0.8, 'bass'), s(11, 0.8, 0.6, 'high')],
          variants: [
            // the chord on 2 and 4 hits harder, the ands lighter
            [s(0, 1.6, 0.85, 'bass'), s(2, 0.8, 0.45, 'high'), s(3, 1.6, 0.8, 'high'), s(5, 0.8, 0.45, 'high'),
             s(6, 1.6, 0.85, 'bass'), s(8, 0.8, 0.45, 'high'), s(9, 1.6, 0.8, 'high'), s(11, 0.8, 0.45, 'high')],
            // the walk-up bass under the chicks: root, 3, 5, 6
            [n(0, 0, 1.6, 0.85), s(2, 0.8, 0.6, 'high'), n(3, 4, 1.6, 0.8), s(5, 0.8, 0.6, 'high'),
             n(6, 7, 1.6, 0.85), s(8, 0.8, 0.6, 'high'), n(9, 9, 1.6, 0.8), s(11, 0.8, 0.6, 'high')],
          ],
          fills: [
            // the boogie up — root, 3, 5, 6, ♭7 — and a chromatic walk into the next chord
            [n(0, 0, 1.6, 0.9), n(2, 4, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(5, 9, 0.8, 0.7),
             n(6, 10, 1.6, 0.85), nx(8, -3, 0.8, 0.7), nx(9, -2, 1.6, 0.8), nx(11, -1, 0.8, 0.8)],
            // the ♭3 pushed into the 3, twice, and the 6th to the octave
            [h(0, 3, 4, 2.4, 0.85), h(3, 3, 4, 2.4, 0.85),
             d(6, 4, 12, 2.4, 0.85), n(9, 12, 2.4, 0.9)],
            // half a bar of boom-chick, then down the boogie to the next chord's 5th
            [s(0, 1.6, 0.85, 'bass'), s(2, 0.8, 0.6, 'high'), s(3, 1.6, 0.8, 'bass'), s(5, 0.8, 0.6, 'high'),
             n(6, 10, 1.6, 0.85), n(8, 9, 0.8, 0.7), n(9, 7, 1.6, 0.8), nx(11, 7, 0.8, 0.7)],
          ],
        },
        {
          name: 'Walking boogie',
          figure: [n(0, 0, 1.6, 0.9), n(2, 0, 0.8, 0.5), n(3, 4, 1.6, 0.85), n(5, 4, 0.8, 0.5),
                   n(6, 7, 1.6, 0.85), n(8, 7, 0.8, 0.5), n(9, 9, 1.6, 0.85), n(11, 9, 0.8, 0.5)],
          variants: [
            // up to the ♭7 and back to the 6th
            [n(0, 0, 1.6, 0.9), n(2, 0, 0.8, 0.5), n(3, 4, 1.6, 0.85), n(5, 7, 0.8, 0.6),
             n(6, 9, 1.6, 0.85), n(8, 10, 0.8, 0.7), n(9, 9, 1.6, 0.85), n(11, 7, 0.8, 0.6)],
            // the chord on 2 and 4 over the walk
            [n(0, 0, 1.6, 0.9), s(3, 1.6, 0.75, 'high'), n(6, 7, 1.6, 0.85), s(9, 1.6, 0.75, 'high')],
          ],
          fills: [
            // the octave and ♭7 rocked, 6, 5 — then the next root from a semitone below
            [n(0, 12, 1.6, 0.9), n(2, 10, 0.8, 0.7), n(3, 12, 1.6, 0.85), n(5, 10, 0.8, 0.7),
             n(6, 9, 1.6, 0.8), n(8, 7, 0.8, 0.7), nx(9, -1, 2.4, 0.85)],
            // a chord on one, then ♭3-3, 5, 6 and the chromatic walk up
            [s(0, 2.4, 0.85, 'high'), h(3, 3, 4, 2.4, 0.85), n(6, 7, 0.8, 0.8), n(7, 9, 1.6, 0.8),
             nx(9, -2, 1.6, 0.75), nx(11, -1, 0.8, 0.8)],
            // the root said and said, then up to the 5th
            [n(0, 0, 1.6, 0.9), n(2, 0, 0.8, 0.5), n(3, 0, 1.6, 0.8), n(5, 3, 0.8, 0.7), n(6, 4, 1.6, 0.85),
             n(8, 5, 0.8, 0.7), n(9, 7, 2.4, 0.9)],
          ],
        },
      ],
    },

    psychobilly: {
      // Straight and quick, on the low strings: chugged eighths with the
      // accents on the beat, minor-pentatonic riffs — root, ♭3, 4, 5, ♭7,
      // the ♭5 as a passing tone — and chromatic walks up and down into the
      // next chord, which is most of what the bass is doing too.
      'Psychobilly': [
        {
          name: 'Chug and stab',
          figure: [s(0, 1.6, 0.9, 'low'), s(2, 1.6, 0.6, 'low'), s(4, 1.6, 0.75, 'low'), s(6, 1.6, 0.6, 'low'),
                   s(8, 1.6, 0.85, 'low'), s(10, 1.6, 0.6, 'low'), s(12, 1.6, 0.75, 'low'), s(14, 1.6, 0.6, 'low')],
          variants: [
            // the stab on the and of two and the and of four
            [s(0, 1.6, 0.9, 'low'), s(2, 1.6, 0.6, 'low'), s(4, 1.6, 0.6, 'low'), s(6, 2, 0.9, 'low'),
             s(8, 1.6, 0.6, 'low'), s(10, 1.6, 0.6, 'low'), s(12, 1.6, 0.6, 'low'), s(14, 2, 0.9, 'low')],
            // the root alone under the chugs on 1 and 3
            [s(0, 1.6, 0.9, 'bass'), s(2, 1.6, 0.6, 'low'), s(4, 1.6, 0.75, 'low'), s(6, 1.6, 0.6, 'low'),
             s(8, 1.6, 0.85, 'bass'), s(10, 1.6, 0.6, 'low'), s(12, 1.6, 0.75, 'low'), s(14, 1.6, 0.6, 'low')],
          ],
          fills: [
            // the riff: root, root, ♭3, 4, ♭5, 4, ♭3 — and the walk up to the next root
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), n(8, 6, 2, 0.85), n(10, 5, 2, 0.7),
             nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)],
            // chugging, then the octave dropped to the ♭7 and the 5th
            [s(0, 1.6, 0.9, 'low'), s(2, 1.6, 0.6, 'low'), s(4, 1.6, 0.75, 'low'), s(6, 1.6, 0.6, 'low'),
             n(8, 12, 2, 0.9), n(10, 10, 2, 0.8), n(12, 7, 2, 0.8), nx(14, 7, 2, 0.75)],
            // the ♭7 hammered, the 5th, and down chromatically onto the next root
            [n(0, 10, 2, 0.9), n(2, 10, 2, 0.6), n(4, 10, 2, 0.8), n(6, 7, 2, 0.8), n(8, 7, 2, 0.6), n(10, 5, 2, 0.75),
             nx(12, 2, 2, 0.75), nx(14, 1, 2, 0.8)],
          ],
        },
        {
          name: 'Low riff',
          figure: [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 0, 2, 0.7),
                   n(8, 5, 2, 0.85), n(10, 3, 2, 0.7), n(12, 0, 2, 0.85), n(14, 10, 2, 0.75)],
          variants: [
            // through the ♭5
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8),
             n(8, 6, 2, 0.85), n(10, 5, 2, 0.7), n(12, 3, 2, 0.8), n(14, 0, 2, 0.75)],
            // the riff with a stab on the and of two
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), s(6, 2, 0.85, 'low'),
             n(8, 5, 2, 0.85), n(10, 3, 2, 0.7), n(12, 0, 2, 0.85), n(14, 10, 2, 0.75)],
          ],
          fills: [
            // a bar of chugs
            [s(0, 1.6, 0.9, 'low'), s(2, 1.6, 0.6, 'low'), s(4, 1.6, 0.75, 'low'), s(6, 1.6, 0.6, 'low'),
             s(8, 1.6, 0.85, 'low'), s(10, 1.6, 0.6, 'low'), s(12, 1.6, 0.75, 'low'), s(14, 1.6, 0.6, 'low')],
            // the octave, ♭7, 5, 4 — and the chromatic walk down to the next root
            [sl(0, 10, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.8), n(6, 5, 2, 0.75), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8),
             nx(12, 2, 2, 0.75), nx(14, 1, 2, 0.8)],
            // the root pounded, the ♭3 and 4, the chord on three
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 0, 2, 0.8), n(6, 3, 2, 0.8), s(8, 4, 0.9, 'low'), n(12, 5, 2, 0.8), nx(14, -1, 2, 0.8)],
          ],
        },
      ],
    },

    surf: {
      // Straight, picked hard and dry: eighth notes on the low root, the
      // chord stabbed short on 2 and 4, and runs that fall — the minor
      // pentatonic with the 6th and the ♭2 that surf borrowed from the
      // Mediterranean — landing on the next chord from a semitone above.
      'Surf rock': [
        {
          name: 'Low-string pulse',
          figure: [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), s(4, 2, 0.85, 'high'), n(6, 0, 2, 0.7),
                   n(8, 0, 2, 0.85), n(10, 0, 2, 0.7), s(12, 2, 0.85, 'high'), n(14, 0, 2, 0.7)],
          variants: [
            // the 5th under beat three
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), s(4, 2, 0.85, 'high'), n(6, 0, 2, 0.7),
             n(8, 7, 2, 0.85), n(10, 7, 2, 0.7), s(12, 2, 0.85, 'high'), n(14, 7, 2, 0.7)],
            // the pulse alone, the chord only on four
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), n(4, 0, 2, 0.8), n(6, 0, 2, 0.7),
             n(8, 0, 2, 0.85), n(10, 0, 2, 0.7), s(12, 4, 0.85, 'high')],
          ],
          fills: [
            // down from the octave: 12, 10, 7, 5, ♭3 — and the next root from a semitone above
            [sl(0, 14, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), p(8, 3, 0, 4, 0.85),
             nx(12, 1, 2, 0.75), nx(14, 0, 2, 0.85)],
            // the pulse, then the ♭2 leaning on the root, twice
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), n(4, 0, 2, 0.8), n(6, 0, 2, 0.7),
             n(8, 1, 2, 0.85), n(10, 0, 2, 0.8), n(12, 1, 2, 0.85), n(14, 0, 2, 0.8)],
            // a stab, and a run up the pentatonic to the octave held
            [s(0, 2, 0.85, 'high'), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), n(8, 7, 2, 0.85), n(10, 10, 2, 0.85), n(12, 12, 4, 0.9)],
          ],
        },
        {
          name: 'Stabs and runs',
          figure: [s(0, 2, 0.9, 'high'), s(4, 2, 0.8, 'high'), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), n(12, 3, 2, 0.85), n(14, 0, 2, 0.8)],
          variants: [
            // the run first, the stabs on three and four
            [n(0, 0, 2, 0.85), n(2, 3, 2, 0.8), n(4, 5, 2, 0.85), n(6, 7, 2, 0.8), s(8, 2, 0.9, 'high'), s(12, 2, 0.8, 'high')],
            // stabs on the ands
            [s(2, 2, 0.85, 'high'), s(6, 2, 0.85, 'high'), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), n(12, 3, 2, 0.85), n(14, 0, 2, 0.8)],
          ],
          fills: [
            // the octave and 6th, the 5th and 4th, down to the ♭3 — and the semitone above the next root
            [n(0, 12, 2, 0.9), p(2, 9, 7, 4, 0.85), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85), nx(12, 1, 2, 0.75), nx(14, 0, 2, 0.85)],
            // the low pulse for a bar, the 5th under four
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), n(4, 0, 2, 0.8), n(6, 0, 2, 0.7), n(8, 0, 2, 0.85), n(10, 0, 2, 0.7), n(12, 7, 2, 0.8), n(14, 7, 2, 0.7)],
            // the ♭2 to the root, the ♭3 to the root, a stab
            [n(0, 1, 2, 0.85), n(2, 0, 2, 0.8), n(4, 3, 2, 0.85), n(6, 0, 2, 0.8), s(8, 4, 0.9, 'high'), n(12, 7, 2, 0.8), nx(14, 7, 2, 0.75)],
          ],
        },
      ],
    },

    jazz: {
      // Swung: the grid is three to a beat, the eighths on the first and
      // third. Four-to-the-bar comping on the low three strings with 2 and
      // 4 leaning, and the Charleston figure — one and the and of two — on
      // the top. The lines put a chord tone on the beat — 3rd and 7th
      // before anything — a passing or chromatic note between, and arrive
      // on the next chord's 3rd or root from a semitone away.
      'Swing': [
        {
          name: 'Four to the bar',
          figure: [s(0, 2.2, 0.6, 'low'), s(3, 2.2, 0.75, 'low'), s(6, 2.2, 0.6, 'low'), s(9, 2.2, 0.75, 'low')],
          variants: [
            // a push on the and of two, up top, then back to the four
            [s(0, 2.2, 0.6, 'low'), s(3, 1.6, 0.75, 'low'), s(5, 0.8, 0.5, 'high'), s(6, 2.2, 0.6, 'low'), s(9, 2.2, 0.75, 'low')],
            // three and four opened out
            [s(0, 2.2, 0.6, 'low'), s(3, 2.2, 0.75, 'low'), s(6, 2.2, 0.65), s(9, 2.2, 0.8)],
          ],
          fills: [
            // 3rd on one, 5th on two, 7th on three, then a chromatic step down onto the next chord's 3rd
            [sl(0, 3, 4, 1.6, 0.85), n(2, 5, 0.8, 0.6), n(3, 7, 1.6, 0.8), n(5, 9, 0.8, 0.65),
             n(6, 10, 1.6, 0.85), n(8, 12, 0.8, 0.7), nx(9, 5, 1.6, 0.7), nx(11, 4, 0.8, 0.8)],
            // the 7th on one, down the chord, and the next root enclosed from above and below
            [n(0, 10, 1.6, 0.85), n(2, 9, 0.8, 0.6), n(3, 7, 1.6, 0.8), n(5, 4, 0.8, 0.65),
             n(6, 2, 1.6, 0.8), nx(8, 1, 0.8, 0.65), nx(9, -1, 1.6, 0.7), nx(11, 0, 0.8, 0.8)],
            // two chords, then the 6th to the 7th to the octave and the next chord's 3rd
            [s(0, 2.2, 0.65, 'high'), s(3, 2.2, 0.75, 'high'), n(6, 9, 1.6, 0.8), n(8, 10, 0.8, 0.65),
             n(9, 12, 1.6, 0.8), nx(11, 4, 0.8, 0.75)],
          ],
        },
        {
          name: 'Charleston comp',
          figure: [s(0, 2, 0.8, 'high'), s(5, 4, 0.7, 'high')],
          variants: [
            // anticipated: the ands of two and four
            [s(5, 3, 0.75, 'high'), s(11, 3, 0.7, 'high')],
            // the and of one and the and of three
            [s(2, 3, 0.7, 'high'), s(8, 3, 0.7, 'high')],
          ],
          fills: [
            // 5th, 6th, 7th, octave — up the chord — and the next chord's 3rd from a semitone below
            [n(0, 7, 1.6, 0.85), n(2, 9, 0.8, 0.65), n(3, 10, 1.6, 0.8), n(5, 12, 0.8, 0.7),
             n(6, 10, 1.6, 0.8), n(8, 9, 0.8, 0.65), nx(9, 3, 1.6, 0.7), nx(11, 4, 0.8, 0.8)],
            // a chord, then 9th, 3rd, 5th, 7th in swung eighths and the next root
            [s(0, 2, 0.8, 'high'), sl(3, 2, 4, 2.4, 0.8), n(6, 7, 1.6, 0.8), n(8, 10, 0.8, 0.65), nx(9, -1, 1.6, 0.7), nx(11, 0, 0.8, 0.8)],
            // a walking line on top, quarter notes, down to the next chord's 3rd
            [n(0, 12, 2.4, 0.85), n(3, 10, 2.4, 0.8), n(6, 9, 2.4, 0.8), nx(9, 5, 1.2, 0.7), nx(10.5, 4, 1.5, 0.8)],
          ],
        },
      ],
      // Straight, quiet: the thumb on one and three, the chord in the
      // fingers on the syncopations between — the bossa's own rhythm guitar
      // — with lines out of the chord scale that move by step, land on
      // chord tones, and slip into the next chord from a semitone away.
      'Bossa nova': [
        {
          name: 'Thumb and fingers',
          figure: [s(0, 4, 0.8, 'bass'), s(2, 2, 0.5, 'high'), s(6, 2, 0.55, 'high'),
                   s(8, 4, 0.75, 'bass'), s(10, 2, 0.5, 'high'), s(14, 2, 0.5, 'high')],
          variants: [
            // the chords pushed onto the "e", the bossa's syncopation
            [s(0, 4, 0.8, 'bass'), s(3, 3, 0.55, 'high'), s(6, 2, 0.5, 'high'),
             s(8, 4, 0.75, 'bass'), s(11, 3, 0.55, 'high'), s(14, 2, 0.5, 'high')],
            // fewer chords, held
            [s(0, 4, 0.8, 'bass'), s(2, 4, 0.55, 'high'), s(8, 4, 0.75, 'bass'), s(10, 2, 0.5, 'high'), s(12, 2, 0.5, 'high')],
          ],
          fills: [
            // 3rd, 5th, 7th, 9th by step, and the next chord's 3rd from above
            [n(0, 4, 2, 0.75), n(2, 5, 2, 0.6), n(4, 7, 2, 0.7), n(6, 9, 2, 0.6), n(8, 11, 2, 0.7), n(10, 14, 2, 0.7), nx(12, 5, 2, 0.6), nx(14, 4, 2, 0.7)],
            // the thumb, then down from the 9th to the 3rd and the next root from below
            [s(0, 4, 0.8, 'bass'), n(4, 14, 2, 0.7), n(6, 12, 2, 0.65), n(8, 11, 2, 0.65), n(10, 9, 2, 0.65), n(12, 7, 2, 0.65), nx(14, -1, 2, 0.7)],
            // the 6th held, the 5th, the 3rd held, and a chord
            [sl(0, 8, 9, 4, 0.75), n(4, 7, 2, 0.65), n(6, 5, 2, 0.6), n(8, 4, 4, 0.7), s(12, 4, 0.55, 'high')],
          ],
        },
        {
          name: 'Bass and answer',
          figure: [s(0, 2, 0.8, 'bass'), s(2, 4, 0.55, 'high'), s(8, 2, 0.75, 'bass'), s(11, 3, 0.55, 'high'), n(14, 7, 2, 0.55)],
          variants: [
            [s(0, 2, 0.8, 'bass'), s(3, 3, 0.55, 'high'), n(6, 4, 2, 0.55), s(8, 2, 0.75, 'bass'), s(10, 4, 0.55, 'high'), n(14, 2, 2, 0.55)],
            [s(0, 6, 0.8, 'bass'), s(6, 2, 0.55, 'high'), s(8, 6, 0.75, 'bass'), s(14, 2, 0.5, 'high')],
          ],
          fills: [
            // from the octave down the chord scale, the 7th on three, and the next chord's 3rd
            [n(0, 12, 2, 0.75), n(2, 11, 2, 0.65), n(4, 9, 2, 0.7), n(6, 7, 2, 0.65), sl(8, 3, 4, 4, 0.7), nx(12, 5, 2, 0.6), nx(14, 4, 2, 0.7)],
            // the thumb under a rising line — 3, 4, 5 / 6, 7, octave — and the next root
            [s(0, 2, 0.8, 'bass'), n(2, 4, 2, 0.65), n(4, 5, 2, 0.6), n(6, 7, 2, 0.7), s(8, 2, 0.75, 'bass'), n(10, 9, 2, 0.65), n(12, 11, 2, 0.65), nx(14, 0, 2, 0.7)],
            // the 5th held, 6th, 5th, the 3rd held, and the 9th to close
            [n(0, 7, 4, 0.75), n(4, 9, 2, 0.65), n(6, 7, 2, 0.6), n(8, 4, 4, 0.7), n(12, 2, 4, 0.65)],
          ],
        },
      ],
    },

    gypsy: {
      // Swung and quick, no drums: la pompe — a short chord on every beat
      // with a brushed lift into 2 and 4 — is the whole rhythm section, and
      // the lines are arpeggios up and down the chord with the 6th, and
      // chromatic enclosures round the next chord's root or 3rd.
      'Gypsy jazz': [
        {
          name: 'La pompe',
          figure: [s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)],
          variants: [
            // the lifts left out, the four beats alone
            [s(0, 1.2, 0.55), s(3, 1, 0.8), s(6, 1.2, 0.55), s(9, 1, 0.8)],
            // a bass note on one and three under the chords
            [s(0, 1.2, 0.7, 'bass'), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8, 'high'), s(6, 1.2, 0.7, 'bass'), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8, 'high')],
          ],
          fills: [
            // up the arpeggio — root, 3, 5, 6, octave — and the next root enclosed from above and below
            [n(0, 0, 1.6, 0.85), n(2, 4, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(5, 9, 0.8, 0.7),
             n(6, 12, 1.6, 0.85), nx(8, 1, 0.8, 0.65), nx(9, -1, 1.6, 0.75), nx(11, 0, 0.8, 0.85)],
            // two pompe beats, then down the arpeggio to the next chord's 3rd from a semitone above
            [s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 12, 0.8, 0.85), n(7, 9, 0.8, 0.75), n(8, 7, 0.8, 0.8),
             n(9, 4, 0.8, 0.8), nx(10, 5, 0.8, 0.7), nx(11, 4, 0.8, 0.85)],
            // the 6th to the 5th, twice, and the octave held
            [n(0, 9, 1.6, 0.85), n(2, 7, 0.8, 0.7), n(3, 9, 1.6, 0.8), n(5, 7, 0.8, 0.7), sl(6, 3, 4, 1.6, 0.8), n(8, 7, 0.8, 0.7), n(9, 12, 2.4, 0.9)],
          ],
        },
        {
          name: 'Pompe and arpeggio',
          figure: [s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 0, 0.8, 0.85), n(7, 4, 0.8, 0.75), n(8, 7, 0.8, 0.8), n(9, 12, 0.8, 0.85), n(10, 7, 0.8, 0.75), n(11, 4, 0.8, 0.75)],
          variants: [
            // the arpeggio first
            [n(0, 0, 0.8, 0.85), n(1, 4, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 12, 0.8, 0.85), n(4, 7, 0.8, 0.75), n(5, 4, 0.8, 0.75), s(6, 1.2, 0.55), s(9, 1, 0.8)],
            // three beats of pompe, a triplet turn on four
            [s(0, 1.2, 0.55), s(3, 1, 0.8), s(6, 1.2, 0.55), n(9, 9, 0.8, 0.8), n(10, 7, 0.8, 0.75), n(11, 4, 0.8, 0.75)],
          ],
          fills: [
            // the 6th enclosing the 5th, the 3rd, and the next root from a semitone below
            [n(0, 9, 0.8, 0.8), n(1, 7, 0.8, 0.8), h(2, 6, 7, 2.4, 0.8), n(5, 4, 0.8, 0.75), n(6, 2, 1.6, 0.8), n(8, 0, 0.8, 0.75), nx(9, -1, 1.6, 0.75), nx(11, 0, 0.8, 0.85)],
            // a bar of pompe
            [s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)],
            // up in triplets: root 3 5 / 6 octave 6 / 5 3 root, and the next chord's 3rd
            [n(0, 0, 0.8, 0.85), n(1, 4, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 9, 0.8, 0.8), n(4, 12, 0.8, 0.85), n(5, 9, 0.8, 0.75),
             n(6, 7, 0.8, 0.8), n(7, 4, 0.8, 0.75), n(8, 0, 0.8, 0.8), nx(9, 5, 1.6, 0.7), nx(11, 4, 0.8, 0.85)],
          ],
        },
      ],
    },

    pop: {
      // Straight, the chord doing most of the work: the down-down-up-up-
      // down-up strum with the ups on the top strings, broken chords out
      // of the root, 3rd, 5th and octave, and lines that are melodies —
      // chord tones held, the 9th and 6th as colour, a step into the next
      // chord's root or 3rd rather than a chromatic slide.
      'Pop': [
        {
          name: 'Down down up up down up',
          figure: [s(0, 4, 0.8), s(4, 2, 0.75), s(6, 4, 0.55, 'high'), s(10, 2, 0.55, 'high'), s(12, 2, 0.75), s(14, 2, 0.55, 'high')],
          variants: [
            // every eighth, the ups on top
            [s(0, 2, 0.8), s(2, 2, 0.5, 'high'), s(4, 2, 0.75), s(6, 2, 0.5, 'high'),
             s(8, 2, 0.75), s(10, 2, 0.5, 'high'), s(12, 2, 0.75), s(14, 2, 0.5, 'high')],
            // the root under one, the chord on the and, then the pattern
            [s(0, 2, 0.8, 'bass'), s(2, 2, 0.65, 'high'), s(4, 2, 0.75), s(6, 4, 0.55, 'high'),
             s(10, 2, 0.55, 'high'), s(12, 2, 0.75), s(14, 2, 0.55, 'high')],
          ],
          fills: [
            // the chord broken upward and back, and the next chord's 3rd from a step above
            [n(0, 0, 2, 0.85), h(2, 4, 7, 4, 0.75), n(6, 12, 2, 0.8),
             n(8, 7, 2, 0.7), n(10, 4, 2, 0.65), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.75)],
            // half the pattern, then the octave, 6th, 5th held into the next root
            [s(0, 4, 0.8), s(4, 2, 0.75), s(6, 2, 0.55, 'high'), n(8, 12, 2, 0.85), n(10, 9, 2, 0.7), n(12, 7, 2, 0.75), nx(14, 0, 2, 0.75)],
            // a melody: 3rd, 5th, 6th, octave, a beat each
            [n(0, 4, 4, 0.85), n(4, 7, 4, 0.8), n(8, 9, 4, 0.8), n(12, 12, 4, 0.9)],
          ],
        },
        {
          name: 'Broken chord and strum',
          figure: [n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 12, 2, 0.7), n(6, 7, 2, 0.6),
                   s(8, 4, 0.75), s(12, 2, 0.55, 'high'), s(14, 2, 0.5, 'high')],
          variants: [
            // through the 3rd
            [n(0, 0, 2, 0.8), n(2, 4, 2, 0.65), n(4, 7, 2, 0.7), n(6, 12, 2, 0.7),
             s(8, 4, 0.75), s(12, 2, 0.55, 'high'), s(14, 2, 0.5, 'high')],
            // the chord first, the broken chord answering
            [s(0, 4, 0.8), s(4, 2, 0.55, 'high'), s(6, 2, 0.5, 'high'),
             n(8, 0, 2, 0.8), n(10, 7, 2, 0.65), n(12, 12, 2, 0.7), n(14, 7, 2, 0.6)],
          ],
          fills: [
            // the octave twice, 6th, 5th, the 3rd held, and a step down onto the next root
            [n(0, 12, 2, 0.85), n(2, 12, 2, 0.6), n(4, 9, 2, 0.75), n(6, 7, 2, 0.7), n(8, 4, 4, 0.8), nx(12, 2, 2, 0.7), nx(14, 0, 2, 0.8)],
            // up the chord to the 9th and back
            [n(0, 0, 2, 0.8), n(2, 4, 2, 0.65), n(4, 7, 2, 0.7), n(6, 12, 2, 0.75),
             n(8, 14, 2, 0.75), n(10, 12, 2, 0.7), n(12, 7, 2, 0.65), nx(14, 4, 2, 0.7)],
            // two chords, then the 6th, 5th, and the 3rd held
            [s(0, 4, 0.8), s(4, 4, 0.7), p(8, 9, 7, 4, 0.75), n(12, 4, 4, 0.8)],
          ],
        },
      ],
    },

    funk: {
      // Sixteenths, short, with rests: the hit on one and the chops on the
      // top strings in the gaps the drums leave, and single-note lines that
      // are mostly the root and the octave with the ♭7 and ♭3 for flavour
      // — said in syncopated bursts, not runs — sliding into the next
      // chord from a semitone below.
      'Classic funk': [
        {
          name: 'The one and the chops',
          figure: [s(0, 1, 0.9, 'high'), s(3, 1, 0.5, 'high'), s(6, 1, 0.6, 'high'), s(7, 1, 0.45, 'high'),
                   s(10, 1, 0.6, 'high'), s(12, 1, 0.7, 'high'), s(14, 1, 0.5, 'high'), s(15, 1, 0.45, 'high')],
          variants: [
            // the one opened out and let ring, the chops sparser
            [s(0, 2, 0.9), s(6, 1, 0.55, 'high'), s(10, 1, 0.55, 'high'), s(11, 1, 0.4, 'high'), s(14, 1, 0.55, 'high')],
            // busier: the e and the a of the beats
            [s(0, 1, 0.9, 'high'), s(2, 1, 0.5, 'high'), s(3, 1, 0.5, 'high'), s(6, 1, 0.6, 'high'),
             s(8, 1, 0.7, 'high'), s(10, 1, 0.5, 'high'), s(11, 1, 0.5, 'high'), s(14, 1, 0.55, 'high')],
          ],
          fills: [
            // root, root, octave / ♭7 — in bursts — and the next root from a semitone below
            [n(0, 0, 1, 0.9), n(2, 0, 1, 0.6), n(3, 12, 1, 0.75), n(6, 10, 1, 0.7), n(8, 0, 2, 0.85),
             n(11, 12, 1, 0.7), n(12, 10, 2, 0.8), nx(14, -1, 2, 0.75)],
            // the hit, then the 5th, ♭7 and octave stabbed and the octave held
            [s(0, 1, 0.9, 'high'), d(4, 7, 12, 1, 0.8), n(6, 10, 1, 0.7), d(7, 7, 12, 1, 0.75), n(10, 10, 1, 0.7), n(12, 12, 4, 0.85)],
            // octaves, then a chop and the ♭3 into the next chord's 3rd
            [n(0, 0, 1, 0.9), n(2, 12, 1, 0.75), n(4, 0, 1, 0.8), n(6, 12, 1, 0.75),
             s(8, 1, 0.7, 'high'), s(10, 1, 0.5, 'high'), nx(12, 3, 2, 0.7), nx(14, 4, 2, 0.75)],
          ],
        },
        {
          name: 'Single-note groove',
          figure: [n(0, 0, 1, 0.9), n(2, 0, 1, 0.6), n(3, 10, 1, 0.7), n(6, 12, 1, 0.7), n(8, 0, 1, 0.85),
                   n(10, 7, 1, 0.6), n(11, 10, 1, 0.7), n(14, 12, 1, 0.7), n(15, 10, 1, 0.5)],
          variants: [
            // the last beat given to the chops
            [n(0, 0, 1, 0.9), n(2, 0, 1, 0.6), n(3, 10, 1, 0.7), n(6, 12, 1, 0.7), n(8, 0, 1, 0.85),
             n(10, 7, 1, 0.6), n(11, 10, 1, 0.7), s(12, 1, 0.7, 'high'), s(14, 1, 0.5, 'high')],
            // in octaves
            [n(0, 0, 1, 0.9), n(3, 12, 1, 0.7), n(6, 0, 1, 0.8), n(7, 12, 1, 0.65), n(10, 0, 1, 0.75),
             n(12, 12, 2, 0.8), n(14, 0, 1, 0.7)],
          ],
          fills: [
            // a bar of chops
            [s(0, 1, 0.85, 'high'), s(2, 1, 0.5, 'high'), s(6, 1, 0.6, 'high'), s(8, 1, 0.75, 'high'),
             s(10, 1, 0.5, 'high'), s(11, 1, 0.45, 'high'), s(14, 1, 0.55, 'high')],
            // the octave, ♭7, 5 / ♭3, root — and the next root from below
            [n(0, 12, 1, 0.85), n(2, 10, 1, 0.7), n(3, 7, 1, 0.7), n(6, 3, 1, 0.7), n(8, 0, 2, 0.8), n(11, 0, 1, 0.6), nx(12, -1, 1, 0.7), nx(14, 0, 2, 0.85)],
            // root, ♭3, 4 / 5, ♭7, octave — up in bursts — and two chops
            [sl(0, -1, 0, 1, 0.85), n(2, 3, 1, 0.7), n(3, 5, 1, 0.7), n(6, 7, 1, 0.75), n(8, 10, 1, 0.8), n(10, 12, 1, 0.75),
             s(12, 1, 0.75, 'high'), s(14, 1, 0.5, 'high')],
          ],
        },
      ],
      // Four on the floor under it, the guitar on the off-beats: short chops
      // on the top strings on the ands, and the octave line disco bass and
      // guitar share — root and octave, with the ♭7 and 5th as the way
      // from one chord to the next.
      'Disco': [
        {
          name: 'Off-beat chops',
          figure: [s(2, 2, 0.75, 'high'), s(6, 2, 0.75, 'high'), s(10, 2, 0.75, 'high'), s(14, 2, 0.75, 'high')],
          variants: [
            // a sixteenth pickup into each chop
            [s(1, 1, 0.4, 'high'), s(2, 2, 0.75, 'high'), s(5, 1, 0.4, 'high'), s(6, 2, 0.75, 'high'),
             s(9, 1, 0.4, 'high'), s(10, 2, 0.75, 'high'), s(13, 1, 0.4, 'high'), s(14, 2, 0.75, 'high')],
            // the one as well, and the chops doubled at the end
            [s(0, 1, 0.8, 'high'), s(2, 2, 0.7, 'high'), s(6, 2, 0.7, 'high'), s(10, 2, 0.7, 'high'), s(13, 1, 0.5, 'high'), s(14, 2, 0.75, 'high')],
          ],
          fills: [
            // the octave line, and the ♭7 down to the next chord's 5th
            [n(0, 0, 1, 0.85), n(2, 12, 1, 0.7), n(4, 0, 1, 0.8), n(6, 12, 1, 0.7),
             n(8, 0, 1, 0.8), n(10, 12, 1, 0.7), n(12, 10, 2, 0.75), nx(14, 7, 2, 0.75)],
            // two chops, then 5th, ♭7, octave held
            [s(2, 2, 0.75, 'high'), s(6, 2, 0.75, 'high'), n(8, 7, 2, 0.8), n(10, 10, 2, 0.75), n(12, 12, 4, 0.85)],
            // root, octave, root, octave in a burst, and the next root from a semitone below
            [n(0, 0, 1, 0.85), n(1, 12, 1, 0.7), n(2, 0, 1, 0.8), n(3, 12, 1, 0.7), n(8, 0, 2, 0.8), n(10, 12, 2, 0.75), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.8)],
          ],
        },
        {
          name: 'Octave riff',
          figure: [n(0, 0, 2, 0.85), n(2, 12, 2, 0.7), n(4, 0, 2, 0.8), n(6, 12, 2, 0.7),
                   n(8, 0, 2, 0.8), n(10, 12, 2, 0.7), n(12, 7, 2, 0.75), n(14, 10, 2, 0.7)],
          variants: [
            // the octaves on the 5th for the second half
            [n(0, 0, 2, 0.85), n(2, 12, 2, 0.7), n(4, 0, 2, 0.8), n(6, 12, 2, 0.7),
             n(8, 7, 2, 0.8), n(10, 7, 2, 0.6), n(12, 10, 2, 0.75), n(14, 12, 2, 0.75)],
            // chops in the second half
            [n(0, 0, 2, 0.85), n(2, 12, 2, 0.7), n(4, 0, 2, 0.8), n(6, 12, 2, 0.7),
             s(10, 2, 0.75, 'high'), s(13, 1, 0.5, 'high'), s(14, 2, 0.75, 'high')],
          ],
          fills: [
            // a bar of chops
            [s(2, 2, 0.75, 'high'), s(6, 2, 0.75, 'high'), s(10, 2, 0.75, 'high'), s(13, 1, 0.5, 'high'), s(14, 2, 0.75, 'high')],
            // the octave down to the root, ♭7 and 5th on the way, and the next root from below
            [sl(0, 10, 12, 1, 0.85), n(2, 10, 1, 0.7), n(4, 7, 2, 0.8), n(6, 0, 2, 0.8), n(8, 0, 2, 0.8), n(10, 12, 2, 0.75), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.85)],
            // root in a burst, ♭3 to the 5th, ♭7 and octave, two chops
            [n(0, 0, 1, 0.85), n(1, 0, 1, 0.5), n(2, 0, 1, 0.7), n(3, 3, 1, 0.7), n(4, 7, 2, 0.75), n(8, 10, 2, 0.8), n(10, 12, 2, 0.8), s(14, 2, 0.75, 'high')],
          ],
        },
      ],
    },
    country: {
      // Boom-chick: the root on one, the chord on two, the 5th on three,
      // the chord on four — and a walk up the low strings into the next
      // chord where the bass would do the same. The lines are the major
      // pentatonic with the ♭3 hammered into the 3rd and the 2nd bent to it;
      // the G-run shape (root, 2, ♭3-3, 5, 6, octave) is the idiom's own.
      'Country': [
        {
          name: 'Boom-chick',
          figure: [s(0, 4, 0.85, 'bass'), s(4, 3, 0.7, 'high'), s(8, 4, 0.8, 'fifth'), s(12, 3, 0.7, 'high')],
          variants: [
            // a walk into the next chord on four
            [s(0, 4, 0.85, 'bass'), s(4, 3, 0.7, 'high'), s(8, 4, 0.8, 'fifth'), nx(12, -4, 2, 0.7), nx(14, -2, 2, 0.75)],
            // an upstroke after each chord
            [s(0, 4, 0.85, 'bass'), s(4, 2, 0.7, 'high'), s(6, 2, 0.45, 'high'), s(8, 4, 0.8, 'fifth'), s(12, 2, 0.7, 'high'), s(14, 2, 0.45, 'high')],
          ],
          fills: [
            // the G-run: root, 2, ♭3 hammered to 3, 5, 6 — and up to the next root
            [n(0, 0, 2, 0.9), n(2, 2, 2, 0.75), h(4, 3, 4, 4, 0.85), n(8, 7, 2, 0.8), n(10, 9, 2, 0.8), nx(12, -2, 2, 0.75), nx(14, -1, 2, 0.8)],
            // the 2nd bent to the 3rd, twice, and the chord on four
            [b(0, 2, 2, 4, 0.85), n(4, 0, 2, 0.75), b(6, 2, 2, 4, 0.85), n(10, 0, 2, 0.75), s(12, 4, 0.75, 'high')],
            // down the pentatonic in 3rds — double stops — to the next chord's 5th
            [d(0, 9, 12, 2, 0.8), d(2, 7, 9, 2, 0.75), d(4, 4, 7, 4, 0.8), n(8, 2, 2, 0.75), n(10, 0, 2, 0.8), nx(12, 7, 4, 0.75)],
          ],
        },
        {
          name: 'Walk and chank',
          figure: [n(0, 0, 4, 0.85), s(4, 3, 0.7, 'high'), n(8, 4, 2, 0.8), n(10, 5, 2, 0.75), n(12, 7, 4, 0.8)],
          variants: [
            [n(0, 0, 4, 0.85), s(4, 3, 0.7, 'high'), n(8, 7, 4, 0.8), s(12, 3, 0.7, 'high')],
            [n(0, 7, 4, 0.85), s(4, 3, 0.7, 'high'), n(8, 9, 2, 0.8), n(10, 7, 2, 0.75), n(12, 0, 4, 0.8)],
          ],
          fills: [
            // the octave, 6, 5, 3 — and the walk down onto the next root from above
            [n(0, 12, 2, 0.85), n(2, 9, 2, 0.8), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), n(8, 0, 4, 0.85), nx(12, 2, 2, 0.75), nx(14, 0, 2, 0.8)],
            // a chank, then ♭3 hammered to 3 and the 5th held into the next chord's 3rd
            [s(0, 2, 0.75, 'high'), n(2, 0, 2, 0.75), h(4, 3, 4, 4, 0.85), n(8, 7, 4, 0.85), nx(12, 4, 4, 0.8)],
            // 6ths down the neck: 3rd over root, 2nd over 7th, root over 6th
            [d(0, 4, 12, 4, 0.8), d(4, 2, 11, 4, 0.75), d(8, 0, 9, 4, 0.8), nx(12, 7, 2, 0.7), nx(14, -1, 2, 0.75)],
          ],
        },
      ],
    },

    bluegrass: {
      // Quick, and everything from the wrist: the root on one, the strum
      // on two, the 5th on three, the strum on four, and the G-run — 2,
      // ♭3-3, 5, 6, octave — every time a chord change comes, in eighths,
      // landing on the next root. Hammer-ons from the 2nd and the ♭3.
      'Bluegrass': [
        {
          name: 'Bass strum bass strum',
          figure: [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), s(8, 4, 0.85, 'fifth'), s(12, 2, 0.7, 'high')],
          variants: [
            // the strum with an upstroke after it
            [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), s(6, 2, 0.45, 'high'), s(8, 4, 0.85, 'fifth'), s(12, 2, 0.7, 'high'), s(14, 2, 0.45, 'high')],
            // the bass walking up on the last beat
            [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), s(8, 4, 0.85, 'fifth'), nx(12, -4, 2, 0.75), nx(14, -2, 2, 0.8)],
          ],
          fills: [
            // the G-run, in eighths, onto the next root
            [n(0, 0, 2, 0.9), n(2, 2, 2, 0.8), h(4, 3, 4, 4, 0.85), n(8, 7, 2, 0.8), n(10, 9, 2, 0.8), n(12, 12, 2, 0.85), nx(14, 0, 2, 0.85)],
            // the 2nd hammered to the 3rd, the 5th, the 6th — and down onto the next root
            [h(0, 2, 4, 4, 0.85), n(4, 7, 2, 0.8), n(6, 9, 2, 0.8), n(8, 7, 2, 0.75), n(10, 4, 2, 0.75), nx(12, 2, 2, 0.75), nx(14, 0, 2, 0.85)],
            // a bass note and a strum, then the run from the 5th
            [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.8), h(12, 3, 4, 2, 0.85), nx(14, -1, 2, 0.8)],
          ],
        },
        {
          name: 'Runs',
          figure: [n(0, 0, 2, 0.9), n(2, 2, 2, 0.75), n(4, 4, 2, 0.8), n(6, 7, 2, 0.8), s(8, 4, 0.85, 'fifth'), s(12, 2, 0.7, 'high')],
          variants: [
            [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.8), n(12, 12, 2, 0.85), n(14, 9, 2, 0.75)],
            [n(0, 12, 2, 0.9), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), s(8, 4, 0.85, 'bass'), s(12, 2, 0.7, 'high')],
          ],
          fills: [
            [n(0, 12, 2, 0.9), n(2, 9, 2, 0.8), n(4, 7, 2, 0.8), p(6, 4, 2, 4, 0.8), n(10, 0, 2, 0.8), nx(12, 2, 2, 0.75), nx(14, 0, 2, 0.85)],
            [h(0, 3, 4, 4, 0.85), n(4, 7, 2, 0.8), n(6, 9, 2, 0.8), n(8, 12, 4, 0.85), nx(12, 7, 2, 0.75), nx(14, 9, 2, 0.75)],
            [s(0, 4, 0.9, 'bass'), s(4, 2, 0.7, 'high'), s(8, 4, 0.85, 'fifth'), s(12, 2, 0.7, 'high')],
          ],
        },
      ],
    },

    ballad: {
      // Twelve to the bar, slow: the chord broken across the beat — root,
      // 5th, octave, 3rd — with the whole chord on one, and lines that are
      // melodies: chord tones held, a slide into the 3rd, the 2nd hammered
      // to it, a step into the next chord's root or 3rd.
      '6/8 ballad': [
        {
          name: 'Broken chord',
          figure: [s(0, 3, 0.8), n(3, 7, 1, 0.55), n(4, 12, 1, 0.6), n(5, 7, 1, 0.5),
                   n(6, 4, 1, 0.65), n(7, 7, 1, 0.55), n(8, 12, 1, 0.6), n(9, 7, 1, 0.55), n(10, 4, 1, 0.55), n(11, 0, 1, 0.6)],
          variants: [
            // the whole bar broken, no strum
            [n(0, 0, 1, 0.8), n(1, 7, 1, 0.55), n(2, 12, 1, 0.6), n(3, 4, 1, 0.65), n(4, 7, 1, 0.55), n(5, 12, 1, 0.6),
             n(6, 0, 1, 0.75), n(7, 7, 1, 0.55), n(8, 12, 1, 0.6), n(9, 4, 1, 0.65), n(10, 7, 1, 0.55), n(11, 12, 1, 0.6)],
            // the chord on one and three, broken between
            [s(0, 3, 0.8), n(3, 4, 1, 0.6), n(4, 7, 1, 0.55), n(5, 12, 1, 0.6), s(6, 3, 0.7, 'high'), n(9, 12, 1, 0.6), n(10, 7, 1, 0.55), n(11, 4, 1, 0.55)],
          ],
          fills: [
            // a melody: the 3rd slid into and held, the 5th, and down onto the next chord's 3rd
            [sl(0, 3, 4, 3, 0.8), n(3, 7, 3, 0.75), n(6, 9, 2, 0.7), n(8, 7, 1, 0.65), nx(9, 5, 1.5, 0.65), nx(10.5, 4, 1.5, 0.75)],
            // the chord, then the octave, 7th, 6th and the next root from above
            [s(0, 6, 0.8), n(6, 12, 2, 0.75), n(8, 11, 1, 0.65), n(9, 9, 1.5, 0.7), nx(10.5, 2, 1.5, 0.65)],
            // the 2nd hammered to the 3rd and held, the 5th, the root
            [h(0, 2, 4, 6, 0.8), n(6, 7, 3, 0.7), n(9, 0, 3, 0.75)],
          ],
        },
        {
          name: 'Chord and answer',
          figure: [s(0, 6, 0.85), n(6, 4, 3, 0.7), n(9, 7, 3, 0.7)],
          variants: [
            [s(0, 6, 0.85), n(6, 12, 2, 0.7), n(8, 11, 1, 0.6), n(9, 9, 3, 0.7)],
            [s(0, 3, 0.85, 'bass'), s(3, 3, 0.6, 'high'), s(6, 3, 0.7, 'high'), n(9, 4, 3, 0.7)],
          ],
          fills: [
            [n(0, 7, 3, 0.8), n(3, 9, 3, 0.75), n(6, 12, 3, 0.8), nx(9, 5, 1.5, 0.65), nx(10.5, 4, 1.5, 0.75)],
            [n(0, 12, 3, 0.8), n(3, 7, 3, 0.7), sl(6, 3, 4, 3, 0.75), nx(9, -1, 3, 0.7)],
            [d(0, 4, 12, 6, 0.8), d(6, 7, 12, 3, 0.7), d(9, 4, 9, 3, 0.7)],
          ],
        },
      ],
    },

    reggae: {
      // The guitar is the skank — the chord on every and, high, short —
      // and nothing on the beat. What lines there are stay low and sparse:
      // root, 5th and ♭7, a slide up into the root, a double stop on the
      // skank, and room.
      'Reggae': [
        {
          name: 'Skank',
          figure: [s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), s(10, 1.2, 0.8, 'high'), s(14, 1.2, 0.8, 'high')],
          variants: [
            // the double skank: two sixteenths on each and
            [s(2, 1, 0.8, 'high'), s(3, 1, 0.5, 'high'), s(6, 1, 0.8, 'high'), s(7, 1, 0.5, 'high'),
             s(10, 1, 0.8, 'high'), s(11, 1, 0.5, 'high'), s(14, 1, 0.8, 'high'), s(15, 1, 0.5, 'high')],
            // the root under one and three, low
            [s(0, 2, 0.6, 'bass'), s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), s(8, 2, 0.6, 'bass'), s(10, 1.2, 0.8, 'high'), s(14, 1.2, 0.8, 'high')],
          ],
          fills: [
            // the skank, with a slide up into the root on three and the ♭7 answering
            [s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), sl(8, -2, 0, 2, 0.8), n(11, 10, 1, 0.65), n(12, 7, 2, 0.7), nx(14, 7, 2, 0.7)],
            // 3rds on the skank — double stops — and the root to close
            [d(2, 4, 7, 1.2, 0.8), d(6, 4, 7, 1.2, 0.8), d(10, 5, 9, 1.2, 0.75), d(14, 4, 7, 1.2, 0.8)],
            // a low line in the gaps: root, ♭7, 5th — and the next root from below
            [n(0, 0, 2, 0.8), s(2, 1.2, 0.8, 'high'), n(4, 10, 2, 0.7), s(6, 1.2, 0.8, 'high'), n(8, 7, 2, 0.75), s(10, 1.2, 0.8, 'high'), nx(12, -2, 2, 0.7), s(14, 1.2, 0.8, 'high')],
          ],
        },
        {
          name: 'Skank and bass line',
          figure: [n(0, 0, 2, 0.8), s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), n(8, 7, 2, 0.75), s(10, 1.2, 0.8, 'high'), n(12, 0, 2, 0.7), s(14, 1.2, 0.8, 'high')],
          variants: [
            [n(0, 0, 4, 0.8), s(6, 1.2, 0.8, 'high'), n(8, 7, 2, 0.75), s(10, 1.2, 0.8, 'high'), n(12, 10, 2, 0.7), s(14, 1.2, 0.8, 'high')],
            [s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), n(8, 0, 2, 0.8), n(10, 0, 1, 0.5), n(11, 10, 1, 0.65), n(12, 7, 2, 0.75), s(14, 1.2, 0.8, 'high')],
          ],
          fills: [
            [s(2, 1.2, 0.8, 'high'), s(6, 1.2, 0.8, 'high'), s(10, 1.2, 0.8, 'high'), s(14, 1.2, 0.8, 'high')],
            [n(0, 0, 2, 0.8), n(2, 12, 2, 0.7), n(4, 10, 2, 0.7), n(6, 7, 2, 0.7), n(8, 0, 4, 0.8), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.75)],
            [s(2, 1.2, 0.8, 'high'), sl(4, 5, 7, 2, 0.75), s(6, 1.2, 0.8, 'high'), n(8, 10, 2, 0.7), s(10, 1.2, 0.8, 'high'), nx(12, 7, 2, 0.7), s(14, 1.2, 0.8, 'high')],
          ],
        },
      ],
    },

    ska: {
      // Every and an upstroke, high and short, nothing on the beat; the
      // guitar can also take the walking line the bass has — root, 3rd,
      // 5th, 6th and back in eighths — and the fills are that walk carried
      // chromatically into the next chord, or the octave hammered.
      'Ska': [
        {
          name: 'Upstrokes',
          figure: [s(2, 1, 0.8, 'high'), s(6, 1, 0.8, 'high'), s(10, 1, 0.8, 'high'), s(14, 1, 0.8, 'high')],
          variants: [
            // sixteenth upstrokes doubled up on two and four
            [s(2, 1, 0.8, 'high'), s(5, 1, 0.5, 'high'), s(6, 1, 0.8, 'high'), s(10, 1, 0.8, 'high'), s(13, 1, 0.5, 'high'), s(14, 1, 0.8, 'high')],
            // the root under one
            [s(0, 2, 0.6, 'bass'), s(2, 1, 0.8, 'high'), s(6, 1, 0.8, 'high'), s(10, 1, 0.8, 'high'), s(14, 1, 0.8, 'high')],
          ],
          fills: [
            // the walk: root, 3, 5, 6, octave, 6, and chromatically up to the next root
            [n(0, 0, 2, 0.85), n(2, 4, 2, 0.75), n(4, 7, 2, 0.8), n(6, 9, 2, 0.75), n(8, 12, 2, 0.85), n(10, 9, 2, 0.7), nx(12, -2, 2, 0.75), nx(14, -1, 2, 0.8)],
            // upstrokes, then the octave hammered from the ♭7
            [s(2, 1, 0.8, 'high'), s(6, 1, 0.8, 'high'), h(8, 10, 12, 4, 0.85), n(12, 7, 2, 0.75), nx(14, 7, 2, 0.7)],
            // a bar of upstrokes
            [s(2, 1, 0.8, 'high'), s(6, 1, 0.8, 'high'), s(10, 1, 0.8, 'high'), s(13, 1, 0.5, 'high'), s(14, 1, 0.8, 'high')],
          ],
        },
        {
          name: 'Walking line',
          figure: [n(0, 0, 2, 0.85), n(2, 4, 2, 0.7), n(4, 7, 2, 0.8), n(6, 9, 2, 0.7), n(8, 12, 2, 0.85), n(10, 9, 2, 0.7), n(12, 7, 2, 0.8), n(14, 4, 2, 0.7)],
          variants: [
            [n(0, 0, 2, 0.85), n(2, 0, 2, 0.6), n(4, 4, 2, 0.8), n(6, 7, 2, 0.7), n(8, 9, 2, 0.85), n(10, 10, 2, 0.7), n(12, 9, 2, 0.8), n(14, 7, 2, 0.7)],
            [n(0, 0, 2, 0.85), s(2, 1, 0.7, 'high'), n(4, 7, 2, 0.8), s(6, 1, 0.7, 'high'), n(8, 12, 2, 0.85), s(10, 1, 0.7, 'high'), n(12, 7, 2, 0.8), s(14, 1, 0.7, 'high')],
          ],
          fills: [
            [s(2, 1, 0.8, 'high'), s(6, 1, 0.8, 'high'), s(10, 1, 0.8, 'high'), s(14, 1, 0.8, 'high')],
            [n(0, 12, 2, 0.85), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), n(8, 0, 2, 0.8), n(10, 7, 2, 0.7), nx(12, 2, 2, 0.75), nx(14, 1, 2, 0.8)],
            [sl(0, -2, 0, 2, 0.85), n(2, 4, 2, 0.75), n(4, 7, 2, 0.8), n(6, 12, 2, 0.8), s(10, 1, 0.8, 'high'), nx(12, 7, 2, 0.7), nx(14, -1, 2, 0.8)],
          ],
        },
      ],
    },

    soul: {
      // The pocket, and the guitar mostly staying out of it: 7th-chord
      // shells on the top strings off the beat, double stops in 6ths and
      // 3rds slid into and hammered into — the 2nd to the 3rd, the 4th to
      // the 5th — a lick on the way to the next chord's 3rd.
      'Soul': [
        {
          name: 'Stabs and double stops',
          figure: [s(2, 2, 0.6, 'high'), s(6, 2, 0.65, 'high'), d(8, 4, 12, 2, 0.75), d(10, 2, 11, 2, 0.6), s(12, 3, 0.7, 'high')],
          variants: [
            [s(2, 2, 0.6, 'high'), s(6, 2, 0.65, 'high'), s(10, 2, 0.6, 'high'), s(12, 3, 0.7, 'high')],
            [d(0, 4, 12, 2, 0.75), s(2, 2, 0.6, 'high'), s(6, 2, 0.65, 'high'), d(8, 7, 12, 2, 0.7), s(12, 3, 0.7, 'high')],
          ],
          fills: [
            // the 2nd hammered to the 3rd over the root, held; the 5th; the next chord's 3rd
            [h(0, 2, 4, 4, 0.8), n(4, 7, 2, 0.7), n(6, 4, 2, 0.65), d(8, 7, 12, 4, 0.75), nx(12, 5, 2, 0.6), nx(14, 4, 2, 0.75)],
            // 6ths slid into, down the neck
            [sl(0, 3, 4, 4, 0.8), d(4, 4, 12, 4, 0.75), d(8, 2, 11, 4, 0.7), d(12, 0, 9, 2, 0.75), nx(14, -1, 2, 0.7)],
            // a stab, the 4th hammered to the 5th, the ♭7, and the root
            [s(2, 2, 0.6, 'high'), h(4, 5, 7, 4, 0.8), n(8, 10, 2, 0.7), n(10, 12, 2, 0.75), n(12, 7, 2, 0.7), nx(14, 0, 2, 0.75)],
          ],
        },
        {
          name: 'Pocket line',
          figure: [n(0, 0, 2, 0.8), n(2, 0, 1, 0.45), n(3, 10, 1, 0.6), n(6, 12, 2, 0.7), n(8, 7, 2, 0.75), n(11, 10, 1, 0.6), n(12, 0, 2, 0.75), s(14, 2, 0.6, 'high')],
          variants: [
            [n(0, 0, 4, 0.8), s(6, 2, 0.65, 'high'), n(8, 7, 2, 0.75), n(10, 10, 2, 0.65), n(12, 12, 2, 0.75), s(14, 2, 0.6, 'high')],
            [d(0, 4, 12, 4, 0.75), s(6, 2, 0.65, 'high'), d(8, 7, 12, 2, 0.7), n(11, 10, 1, 0.6), n(12, 0, 2, 0.75), s(14, 2, 0.6, 'high')],
          ],
          fills: [
            [s(2, 2, 0.6, 'high'), s(6, 2, 0.65, 'high'), s(10, 2, 0.6, 'high'), s(12, 3, 0.7, 'high')],
            [n(0, 12, 2, 0.8), n(2, 10, 1, 0.65), n(3, 7, 1, 0.65), n(6, 4, 2, 0.7), n(8, 0, 4, 0.8), nx(12, 2, 2, 0.65), nx(14, 4, 2, 0.75)],
            [sl(0, 2, 4, 4, 0.8), d(4, 4, 12, 2, 0.7), h(8, 5, 7, 4, 0.8), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.8)],
          ],
        },
      ],
    },

    metal: {
      // Palm-muted: the root chugged on the low strings in eighths and in
      // the gallop, opened up on the accents; the riffs out of the minor
      // pentatonic with the ♭2 and the ♭5, chromatic, low; pull-offs and
      // slides. Written against the root, so a major chord's riff is
      // snapped to its tones — this is the reading's business, as ever.
      'Metal': [
        {
          name: 'Gallop chug',
          figure: [s(0, 2, 0.9, 'low', 'mute'), s(2, 1, 0.6, 'low', 'mute'), s(3, 1, 0.6, 'low', 'mute'),
                   s(4, 2, 0.8, 'low', 'mute'), s(6, 1, 0.6, 'low', 'mute'), s(7, 1, 0.6, 'low', 'mute'),
                   s(8, 2, 0.9, 'low', 'mute'), s(10, 1, 0.6, 'low', 'mute'), s(11, 1, 0.6, 'low', 'mute'),
                   s(12, 2, 0.8, 'low', 'mute'), s(14, 1, 0.6, 'low', 'mute'), s(15, 1, 0.6, 'low', 'mute')],
          variants: [
            // straight eighths, the one opened up
            [s(0, 2, 0.95, 'low'), s(2, 2, 0.6, 'low', 'mute'), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'),
             s(8, 2, 0.85, 'low', 'mute'), s(10, 2, 0.6, 'low', 'mute'), s(12, 2, 0.7, 'low', 'mute'), s(14, 2, 0.6, 'low', 'mute')],
            // the chord let ring on one, the gallop under it after
            [s(0, 4, 0.95, 'low'), s(4, 2, 0.8, 'low', 'mute'), s(6, 1, 0.6, 'low', 'mute'), s(7, 1, 0.6, 'low', 'mute'),
             s(8, 2, 0.9, 'low', 'mute'), s(10, 1, 0.6, 'low', 'mute'), s(11, 1, 0.6, 'low', 'mute'), s(12, 2, 0.8, 'low'), s(14, 2, 0.6, 'low', 'mute')],
          ],
          fills: [
            // the riff: root, root, ♭2, root / ♭3, ♭5, 4, ♭3 — and the chromatic walk up
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 1, 2, 0.85), n(6, 0, 2, 0.7), n(8, 3, 2, 0.85), n(10, 6, 2, 0.8), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)],
            // chugs, then the ♭7 pulled off to the 5th and the octave slid into
            [s(0, 2, 0.9, 'low', 'mute'), s(2, 2, 0.6, 'low', 'mute'), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'),
             p(8, 10, 7, 4, 0.85), sl(12, 10, 12, 4, 0.9)],
            // the root pounded on the low string, the ♭5 to the 5th, the ♭2 to the root
            [s(0, 1, 0.9, 'bass', 'mute'), s(1, 1, 0.5, 'bass', 'mute'), s(2, 1, 0.6, 'bass', 'mute'), s(3, 1, 0.5, 'bass', 'mute'),
             h(4, 6, 7, 4, 0.85), s(8, 1, 0.9, 'bass', 'mute'), s(9, 1, 0.5, 'bass', 'mute'), s(10, 1, 0.6, 'bass', 'mute'), s(11, 1, 0.5, 'bass', 'mute'),
             nx(12, 1, 2, 0.8), nx(14, 0, 2, 0.9)],
          ],
        },
        {
          name: 'Chug and riff',
          figure: [s(0, 2, 0.9, 'bass', 'mute'), s(2, 2, 0.6, 'bass', 'mute'), s(4, 2, 0.7, 'bass', 'mute'), s(6, 2, 0.6, 'bass', 'mute'),
                   n(8, 3, 2, 0.85), n(10, 5, 2, 0.8), n(12, 6, 2, 0.85), n(14, 7, 2, 0.8)],
          variants: [
            [s(0, 2, 0.9, 'bass', 'mute'), s(2, 2, 0.6, 'bass', 'mute'), s(4, 2, 0.7, 'bass', 'mute'), s(6, 2, 0.6, 'bass', 'mute'),
             n(8, 12, 2, 0.85), n(10, 10, 2, 0.8), n(12, 7, 2, 0.85), n(14, 6, 2, 0.75)],
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 1, 2, 0.85), n(6, 0, 2, 0.7), s(8, 2, 0.9, 'bass', 'mute'), s(10, 2, 0.6, 'bass', 'mute'), s(12, 2, 0.7, 'bass', 'mute'), s(14, 2, 0.6, 'bass', 'mute')],
          ],
          fills: [
            [s(0, 2, 0.9, 'low', 'mute'), s(2, 2, 0.6, 'low', 'mute'), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'),
             s(8, 2, 0.9, 'low', 'mute'), s(10, 2, 0.6, 'low', 'mute'), s(12, 2, 0.7, 'low', 'mute'), s(14, 2, 0.6, 'low', 'mute')],
            [n(0, 12, 2, 0.9), p(2, 10, 7, 4, 0.85), n(6, 6, 2, 0.8), n(8, 5, 2, 0.8), n(10, 3, 2, 0.8), nx(12, 1, 2, 0.8), nx(14, 0, 2, 0.9)],
            [sl(0, -2, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.85), n(6, 0, 2, 0.7), s(8, 4, 0.95, 'low'), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)],
          ],
        },
      ],
    },
  };

  // The parts written for a feel. Every feel the picker offers has some,
  // and a test says so; a feel with none would simply offer nothing.
  let LIBRARY_NOW = LIBRARY;
  function partsFor(style, feel){
    return (LIBRARY_NOW[style] && LIBRARY_NOW[style][feel]) || [];
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

  // The triad the neck is showing in this window: the close voicing of the
  // chord's root, 3rd and 5th on the chosen string set (its lowest string,
  // 5 = E-A-D up to 2 = G-B-e) that sits wholly inside the stretch. The
  // triads reading draws one shape per box, so there is one; if the window
  // were somewhere no shape fits, there is nothing to strum rather than a
  // grip from another reading.
  function triadIn(chord, window, stringSet){
    const tones = new Set([chord.note, chord.third, chord.fifth].map(pc));
    const inWin = c => c.fret >= window.min && c.fret <= window.max;
    const fits = GT.fretboard.stringSetTriads(stringSet, tones).filter(t => t.cells.every(inWin));
    if (!fits.length) return null;
    fits.sort((a, b) => a.startFret - b.startFret);
    return fits[0].cells.map(c => ({ string: c.string, fret: c.fret, midi: STRING_MIDI[c.string] + c.fret }));
  }

  // What one strum sounds, low string first: the part of the grip the
  // written strum asked for — see `s` above — or, in the triads reading,
  // the triad itself. `null` when there is no chord to be had here.
  function strumCells(chord, opts, voicing){
    const rootPc = pc(chord.note), fifthPc = pc(chord.fifth);
    if (opts.reading === 'triads3'){
      const tri = triadIn(chord, opts.window, opts.stringSet == null ? 2 : opts.stringSet);
      if (!tri) return null;
      const low = tri.sort((a, b) => a.midi - b.midi);
      return voicing === 'bass' || voicing === 'fifth' ? [low[0]] : low;
    }
    const grip = gripIn(chord, opts.window);
    if (!grip) return null;
    const low = grip.sort((a, b) => b.string - a.string);          // string 5 is the low E
    switch (voicing){
      // the root, or the 5th when the window has cut the grip's root off —
      // the other note an alternating bass goes to — or the lowest there is
      case 'bass': return [low.find(c => c.midi % 12 === rootPc) || low.find(c => c.midi % 12 === fifthPc) || low[0]];
      // the other note of an alternating bass: the lowest 5th, or the root
      case 'fifth': return [low.find(c => c.midi % 12 === fifthPc) || low.find(c => c.midi % 12 === rootPc) || low[0]];
      case 'low':  return low.slice(0, 3);
      case 'high': return low.slice(-3);
      default:     return low;
    }
  }

  // The order a pick sweeps, low string first, this far apart.
  const STRUM_SPREAD = 0.016;

  // A strum's strings share the strum's weight rather than each carrying it.
  // Six strings each at a single note's level summed to 1.27 going into the
  // limiter — over full scale — which clamped nearly 5 dB on every strum and
  // flattened the attack into something that read as a synth. Scaled by the
  // square root of the count, a strum carries about the energy of one note
  // and a half, whatever its size: full, and not a wall. Measured at this
  // setting: 1.02 into the limiter and a strum bar sitting within a decibel
  // of a fill bar, where 1.25 left the strums understated.
  const strumStringLevel = strings => Math.min(1, 1.45 / Math.sqrt(strings));

  // Realise one written bar against one chord: a list of playable notes.
  // `nextChord` is what the bar after this one holds, for the notes that
  // point at it; without one, the next chord is this one.
  function realiseBar(written, chord, opts, nextChord){
    const { root, allowed } = palette(chord, opts);
    const cells = cellsIn(opts.window);
    const home = homeMidi(cells, root);
    // the notes written against the next chord are placed from its root,
    // in its palette — where the line is going, not where it is
    const nextPal = palette(nextChord || chord, opts);
    const nextHome = homeMidi(cells, nextPal.root);
    const out = [];
    let prev = null;
    written.forEach(w => {
      if (w.strum){
        // the strings the strum asked for, low to high, spread the way a
        // pick sweeps
        const grip = strumCells(chord, opts, w.voicing || 'full');
        if (!grip) return;
        const each = w.vel * strumStringLevel(grip.length);
        grip.forEach((c, k) => {
          out.push({ at: w.at, dur: w.dur, vel: each, string: c.string, fret: c.fret, midi: c.midi,
                     strum: true, voicing: w.voicing || 'full', mute: !!w.mute, spread: k * STRUM_SPREAD });
        });
        prev = grip[grip.length - 1];
        return;
      }
      const pal = w.next ? nextPal : { root, allowed };
      const base = w.next ? nextHome : home;
      // where an interval lands: snapped to the palette, placed nearest the
      // pitch it asks for and, between two places for one pitch, on the
      // string nearest the note before, so the line stays under one hand
      const place = (iv, keep) => {
        const sn = snap(pal.root, iv, pal.allowed);
        if (!sn) return null;
        const wantMidi = base + iv + sn.shift;
        const cands = cells.filter(c => c.midi % 12 === sn.pc && (!keep || keep(c)));
        if (!cands.length) return null;
        cands.sort((a, b) => Math.abs(a.midi - wantMidi) - Math.abs(b.midi - wantMidi)
          || (prev ? Math.abs(a.string - prev.string) - Math.abs(b.string - prev.string) : 0));
        return cands[0];
      };
      const note = (c, extra) => ({ at: w.at, dur: w.dur, vel: w.vel, string: c.string, fret: c.fret, midi: c.midi,
                                    iv: w.iv, next: !!w.next, ...extra });
      const allowedTech = !w.tech || !opts.tech || opts.tech[w.tech] !== false;
      const c = place(w.iv);
      if (!c) return;

      if (w.tech === 'double' && allowedTech){
        // the second note on another string, at the same moment
        const c2 = place(w.iv2, x => x.string !== c.string && x.midi !== c.midi);
        out.push(note(c, { tech: 'double' }));
        if (c2) out.push(note(c2, { tech: 'double', pair: true }));
        prev = c;
        return;
      }
      if (w.tech === 'bend'){
        // the note it bends to has to be one the reading allows, exactly —
        // a bend to a note the ear isn't expecting is a mistake, not a bend
        // ...measured from the note as placed, since the reading may have
        // snapped it: a 4th the chords reading moved to the 3rd would bend
        // to a ♯4, which it doesn't offer, so that bend plays plain
        const target = (c.midi + w.up) % 12;
        const canBend = pal.allowed.has(target) && c.fret > 0;
        if (allowedTech && canBend){ out.push(note(c, { bend: w.up })); prev = c; return; }
        // plain: the note it would have bent to
        const t = place(w.iv + w.up) || c;
        out.push(note(t)); prev = t; return;
      }
      if (w.tech === 'hammer' || w.tech === 'pull'){
        // the second note on the same string, above or below, within the window
        const up = w.tech === 'hammer';
        const c2 = place(w.iv2, x => x.string === c.string && (up ? x.fret > c.fret : x.fret < c.fret));
        if (allowedTech && c2){
          const half = w.dur / 2;
          out.push({ ...note(c), dur: half, tech: up ? 'h' : 'p', to: c2.fret });
          out.push({ ...note(c2), at: w.at + half, dur: half, vel: w.vel * 0.75, soft: true, iv: w.iv2 });
          prev = c2; return;
        }
        // plain: both notes picked — or the first alone, held, if the
        // second has nowhere to be
        if (c2){
          const half = w.dur / 2;
          out.push({ ...note(c), dur: half });
          out.push({ ...note(c2), at: w.at + half, dur: half, vel: w.vel * 0.9, iv: w.iv2 });
          prev = c2;
        } else { out.push(note(c)); prev = c; }
        return;
      }
      if (w.tech === 'slide' && allowedTech){
        // from that many frets below or above on the same string, if the
        // neck has them
        const fromFret = c.fret + (w.from - w.iv);
        if (fromFret >= 1 && fromFret <= FRET_COUNT && fromFret !== c.fret){
          out.push(note(c, { slide: fromFret })); prev = c; return;
        }
      }
      out.push(note(c));
      prev = c;
    });
    return out;
  }

  // The whole progression: `bars` is one entry per bar in order, each with
  // the chord sounding in it. Bar b takes the figure when b is even and a
  // fill when it is odd — a two-bar call and answer that loops regardless of
  // where the chords change — and which fill is `picks[phrase]`, so the same
  // roll gives the same part until it's re-rolled on purpose.
  // The figure's variants take the phrases in turn, figure first.
  // ---- the figure this bar plays --------------------------------------------
  function figureFor(part, phrase){
    const figures = [part.figure, ...(part.variants || [])];
    return figures[phrase % figures.length];
  }

  // ---- the roll -------------------------------------------------------------
  // A part is realised from a seed: the same seed gives the same fills, the
  // same tails, the same stop-time bars, so a link or a test can hold a
  // realisation still; "New fills" is a new seed.
  function rng(seed){
    let x = (seed * 9301 + 49297) % 233280;
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  }
  const newSeed = (random = Math.random) => Math.floor(random() * 1e6) + 1;

  // ---- easy mode ------------------------------------------------------------
  // The beginner's version of a part. Where the part carries one (`easy`) it
  // is used; anywhere else the rule below does it: ghost notes go, so do
  // rakes, tremolo, chord slides and colour tones; bends, hammer-ons,
  // pull-offs and slides play plain (double stops stay — they are not the
  // hard part); sixteenths move back onto the eighths and the middle of a
  // triplet goes; tails, pickups and stop-time stay in the part with their
  // chance at zero, so the seed draws the same fills as it does with easy
  // mode off.
  const EASY_TECH = { double: true, bend: false, hammer: false, pull: false, slide: false };
  function simplify(written, grid){
    const per = grid % 3 === 0 ? 3 : 4;
    const out = [];
    (written || []).forEach(w => {
      if (w.ghost) return;
      const x = { ...w };
      delete x.rake; delete x.trem; delete x.chordSlide; delete x.add; delete x.up;
      if (per === 4 && x.at % 2 === 1) x.at = x.at - 1;
      if (per === 3 && x.at % 3 === 1) return;
      if (per === 4 && x.dur < 2) x.dur = 2;
      if (per === 3 && x.dur < 1.5) x.dur = 1.5;
      out.push(x);
    });
    // a moved sixteenth that lands on a note, or on a strum of the same
    // voicing, is dropped; a bass strum under a chord on the same slot (the
    // batida's thumb and fingers) is two voicings and stays
    const seen = new Set();
    return out.filter(x => { const k = `${x.at}${x.strum ? 's' + (x.voicing || 'full') : 'n'}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function easyVersion(part, grid){
    const off = { tailChance: 0, pickupChance: 0, stopChance: 0 };
    if (part.easy) return { ...part, ...off, turnarounds: null, turnaround: null, ...part.easy, easyKind: 'written' };
    const lists = {};
    ['figure', 'turnaround'].forEach(k => { if (part[k]) lists[k] = simplify(part[k], grid); });
    ['variants', 'fills', 'fillsOnChange', 'fillsOnStay', 'turnarounds', 'leads'].forEach(k => { if (part[k]) lists[k] = part[k].map(bar => simplify(bar, grid)); });
    return { ...part, ...lists, ...off, easyKind: 'auto' };
  }

  // ---- two notes at once, and the voicings a strum can ask for -------------
  // A double stop on the strings a hand would use: the written interval
  // first, then the string gap the shape has — adjacent for anything up to a
  // 5th, one string skipped for 6ths, 7ths and octaves, two for 10ths — and
  // the root with its 6th (the boogie) adjacent, a stretch, not the 6ths
  // shape. The interval may invert (a 3rd voiced as a 6th, the same two
  // notes) when that is what keeps the pair on the treble strings the box
  // has — not when the lower note bends, since the bend needs the shape.
  function placePair(w, cells, pal, base){
    const s1 = snap(pal.root, w.iv, pal.allowed), s2 = snap(pal.root, w.iv2, pal.allowed);
    if (!s1 || !s2) return null;
    const want1 = base + w.iv + s1.shift, semis = (w.iv2 + s2.shift) - (w.iv + s1.shift);
    const span = Math.abs(semis);
    const boogie = span >= 8 && span <= 9 && ((w.iv % 12) + 12) % 12 === 0;
    const pref = span <= 7 || boogie ? [1, 2] : span <= 12 ? [2, 1, 3] : [3, 2];
    const want2 = want1 + semis;
    let best = null;
    cells.filter(c => c.midi % 12 === s1.pc).forEach(c1 => {
      cells.filter(c => c.midi % 12 === s2.pc && c.string !== c1.string).forEach(c2 => {
        const diff = (c2.midi - c1.midi) - semis;
        const interval = diff === 0 ? 0 : (Math.abs(diff) === 12 && !w.up) ? 6 : Math.abs(diff) * 10;
        const rank = pref.indexOf(Math.abs(c2.string - c1.string));
        const score = interval + (rank < 0 ? 30 : rank * 8) + Math.abs(c1.midi - want1) + Math.abs(c2.midi - want2) / 2;
        if (!best || score < best.score) best = { c1, c2, score };
      });
    });
    return best;
  }
  // The thumb's note: "bass" is the lowest root on a bass string (E, A or
  // D), "fifth" the 5th on the bass string next to it — where an alternating
  // thumb goes — never a note up on the treble strings.
  function thumbCell(chord, opts, voicing){
    // a strum is the chord itself, whatever the reading: the chord's own
    // root and 5th, not the palette's (which is the key's when a part
    // stays on the I)
    const rootPc = pc(chord.note);
    const cells = cellsIn(opts.window).filter(c => c.string >= 3);
    const roots = cells.filter(c => c.midi % 12 === rootPc).sort((a, b) => a.midi - b.midi);
    if (!roots.length) return null;
    const r = roots[0];
    if (voicing === 'bass') return [r];
    const fifthPc = chord.fifth ? pc(chord.fifth) : (rootPc + 7) % 12;
    const byNearness = (a, b) => Math.abs(a.midi - r.midi) - Math.abs(b.midi - r.midi);
    const beside = cells.filter(c => c.midi % 12 === fifthPc && Math.abs(c.string - r.string) === 1).sort(byNearness);
    if (beside.length) return [beside[0]];
    const any = cells.filter(c => c.midi % 12 === fifthPc).sort(byNearness);
    return any.length ? [any[0]] : null;
  }
  // A power chord: the root on the lowest string that has it, the 5th on the
  // next string up, the octave above that.
  function powerVoicing(chord, opts){
    const rootPc = pc(chord.note);
    const cells = cellsIn(opts.window);
    const roots = cells.filter(c => c.midi % 12 === rootPc && c.string >= 2).sort((a, b) => b.string - a.string || a.midi - b.midi);
    for (const r of roots){
      const fifth = cells.find(c => c.string === r.string - 1 && c.midi === r.midi + 7);
      if (!fifth) continue;
      const oct = cells.find(c => c.string === r.string - 2 && c.midi === r.midi + 12);
      return oct ? [r, fifth, oct] : [r, fifth];
    }
    return strumCells(chord, opts, 'low');
  }
  // Root, 3rd and 7th (or 5th for a triad) on three strings, the 5th left
  // out — what a big-band rhythm guitar plays.
  function shellVoicing(chord, opts){
    const cells = cellsIn(opts.window);
    const pcs = [pc(chord.note), pc(chord.third), chord.seventh ? pc(chord.seventh) : pc(chord.fifth)];
    const roots = cells.filter(c => c.midi % 12 === pcs[0] && c.string >= 3).sort((a, b) => a.midi - b.midi);
    if (!roots.length) return null;
    const root = roots[0];
    const out = [root];
    let string = root.string;
    for (const want of pcs.slice(1)){
      const cand = cells.filter(c => c.midi % 12 === want && c.string < string && c.string >= string - 2 && c.midi > out[out.length - 1].midi)
        .sort((a, b) => a.string - b.string);
      const c = cand[cand.length - 1] || cells.filter(x => x.midi % 12 === want && x.string < string).sort((a, b) => b.string - a.string)[0];
      if (!c) return null;
      out.push(c); string = c.string;
    }
    return out;
  }
  // One extra note above a grip: a colour tone (the 9th, the 6th) on a strum.
  function placeIv(chord, opts, iv, above){
    const pal = palette(chord, opts);
    const sn = snap(pal.root, iv, pal.allowed);
    if (!sn) return null;
    const cells = cellsIn(opts.window).filter(c => c.midi % 12 === sn.pc && (above == null || c.midi > above));
    if (!cells.length) return null;
    cells.sort((a, b) => a.midi - b.midi);
    return cells[0];
  }

  // ---- the realiser ---------------------------------------------------------
  // The whole part over the progression's bars. A bar is a figure bar or a
  // fill bar (every `phrase` bars, the last of each pair by default); the
  // figures take the phrases in turn, or are rolled when the part says so;
  // a fill knows whether the next bar changes chord and draws from that list
  // and the plain fills together; the last bar of the form is a turnaround
  // where the part has one; tails, pickups and stop-time bars happen by
  // their chances; a lead roll puts the part's lead lines in the fill bars.
  // Then each written bar is placed on the neck: strums through the voicing
  // asked for, double stops by shape, single notes through realiseBar, and
  // the flags applied after — ghost, staccato, palm mute, vibrato, rake,
  // chord slides, colour tones, tremolo.
  //   feat: { grid, phrase, easy, seed }
  function realise(part, bars, seed, opts, feat = {}){
    const grid = feat.grid || 16;
    if (feat.easy){
      part = easyVersion(part, grid);
      const tech = { ...(opts.tech || {}) };
      Object.keys(EASY_TECH).forEach(k => { if (!EASY_TECH[k]) tech[k] = false; });
      opts = { ...opts, tech };
    }
    const roll = rng(Number(seed) || 1);
    const phrase = feat.phrase || 2;
    const out = [];
    const stopBars = new Set();
    const pick = list => list[Math.floor(roll() * list.length)];
    const cells = cellsIn(opts.window);
    const leadRoll = !!(part.leads && part.leads.length) && roll() < (part.leadChance == null ? 0.35 : part.leadChance);
    let figureTurn = 0;
    bars.forEach((bar, b) => {
      if (!bar.chord) return;
      const next = bars[(b + 1) % bars.length].chord;
      const changing = displayName(next) !== displayName(bar.chord);
      const last = b === bars.length - 1;
      const fillBar = (b % phrase) === phrase - 1;
      let written;
      const turnarounds = part.turnarounds || (part.turnaround ? [part.turnaround] : null);
      if (last && turnarounds) written = pick(turnarounds);
      else if (fillBar){
        if (part.stops && part.stops.length && roll() < (part.stopChance == null ? 0.2 : part.stopChance)){
          written = pick(part.stops);
          stopBars.add(b);
        } else if (leadRoll){
          written = pick(part.leads);
        } else {
          const situation = (changing ? part.fillsOnChange : part.fillsOnStay) || [];
          const list = situation.concat(part.fills || []);
          written = pick(list.length ? list : (part.fills || [part.figure]));
        }
      } else {
        const figures = [part.figure, ...(part.variants || [])];
        written = part.figureMode === 'roll' ? pick(figures) : figures[figureTurn++ % figures.length];
        if (part.tails && part.tails.length && roll() < (part.tailChance == null ? 0.5 : part.tailChance)){
          written = written.filter(w => w.at < grid / 2).concat(pick(part.tails));
        }
        if (changing && part.pickups && part.pickups.length && roll() < (part.pickupChance == null ? 0.5 : part.pickupChance)){
          written = written.filter(w => w.at < grid * 3 / 4).concat(pick(part.pickups));
        }
      }
      // strums with a voicing of their own, on the next chord or with a
      // colour tone, and double stops, are placed here; the rest goes
      // through realiseBar
      const plain = [], extra = [], pairs = [];
      const doubleOk = !(opts.tech && opts.tech.double === false);
      written.forEach(w => {
        if (w.strum && (w.voicing === 'shell' || w.voicing === 'power' || w.voicing === 'bass' || w.voicing === 'fifth' || w.add || w.next)) extra.push(w);
        else if (w.tech === 'double' && doubleOk) pairs.push(w);
        else plain.push(w);
      });
      let notes = realiseBar(plain, bar.chord, opts, next);
      const pal = palette(bar.chord, opts), nextPal = palette(next, opts);
      pairs.forEach(w => {
        const placed = placePair(w, cells, w.next ? nextPal : pal, homeMidi(cells, (w.next ? nextPal : pal).root));
        if (!placed){ notes = notes.concat(realiseBar([w], w.next ? next : bar.chord, opts, next)); return; }
        const mk = (c, more) => ({ at: w.at, dur: w.dur, vel: w.vel, string: c.string, fret: c.fret, midi: c.midi, iv: w.iv, next: !!w.next, tech: 'double', ...more });
        notes.push(mk(placed.c1, {}), mk(placed.c2, { pair: true, iv: w.iv2 }));
      });
      extra.forEach(w => {
        const on = w.next ? next : bar.chord;
        // in the triads reading every strum is the triad the neck shows,
        // whatever voicing was asked for; elsewhere the voicing is built
        const triads = opts.reading === 'triads3';
        let grip = triads ? strumCells(on, opts, ['shell', 'power'].includes(w.voicing) ? 'full' : (w.voicing || 'full'))
                 : w.voicing === 'shell' ? shellVoicing(on, opts) : w.voicing === 'power' ? powerVoicing(on, opts)
                 : (w.voicing === 'bass' || w.voicing === 'fifth') ? (thumbCell(on, opts, w.voicing) || strumCells(on, opts, w.voicing))
                 : strumCells(on, opts, w.voicing || 'full');
        if (!grip) return;
        grip = grip.slice().sort((a, b) => a.midi - b.midi);
        let colour = null;
        if (w.add){
          const top = grip[grip.length - 1].midi;
          colour = placeIv(on, opts, w.add, top);
          if (colour) grip.push(colour);
        }
        const each = w.vel * strumStringLevel(grip.length);
        grip.forEach((c, k) => notes.push({ at: w.at, dur: w.dur, vel: each, string: c.string, fret: c.fret, midi: c.midi,
                                             strum: true, voicing: w.voicing, mute: !!w.mute, next: !!w.next, spread: k * STRUM_SPREAD,
                                             ...(c === colour ? { colour: true } : {}) }));
      });
      // the flags, matched back to the written note by its moment
      const techOn = k => !(opts.tech && opts.tech[k] === false);
      written.forEach(w => {
        const mine = notes.filter(n => Math.abs(n.at - w.at) < 1e-9 && (!!n.strum === !!w.strum));
        if (!mine.length) return;
        mine.forEach(n => {
          if (w.ghost){ n.vel *= 0.35; n.mute = true; n.ghost = true; }
          if (w.stacc) n.dur = Math.min(n.dur, 0.5);
          if (w.pm) n.mute = true;
          if (w.vib) n.vib = true;
          if (w.rake) n.rake = true;
          // a chord slid in, and the lower note of a double stop bent — only to
          // a note the reading offers, and only with the technique switched on
          if (w.chordSlide && n.strum && techOn('slide')){ const from = n.fret - w.chordSlide; if (from >= 1 && from <= FRET_COUNT) n.slide = from; }
          if (w.tech === 'double' && w.up && !n.pair && n.fret > 0 && techOn('bend') && (w.next ? nextPal : pal).allowed.has(((n.midi + w.up) % 12 + 12) % 12)) n.bend = w.up;
        });
        if (w.trem && !w.strum){
          const n = mine[0];
          const reps = w.trem, step = n.dur / reps;
          notes = notes.filter(x => x !== n);
          for (let k = 0; k < reps; k++) notes.push({ ...n, at: n.at + k * step, dur: step * 0.9, vel: n.vel * (k % 2 ? 0.75 : 1), trem: true });
        }
      });
      notes.forEach(n => out.push({ ...n, bar: b }));
    });
    out.stopBars = stopBars;
    out.leadRoll = leadRoll;
    return out;
  }

  // A fresh roll for a part: a seed. Kept under its old name.
  const rollFills = (part, barCount, random = Math.random) => newSeed(random);

  GT.parts = { get LIBRARY(){ return LIBRARY_NOW; }, set LIBRARY(v){ LIBRARY_NOW = v; }, LIBRARY_BASE: LIBRARY,
               SIMPLE_FEEL, TECHNIQUES, EASY_TECH, partsFor, palette, snap, realiseBar, realise, rollFills, newSeed, rng, figureFor,
               simplify, easyVersion, placePair, thumbCell, powerVoicing, shellVoicing, placeIv,
               cellsIn, homeMidi, gripIn, triadIn, strumCells, strumStringLevel };
})();
