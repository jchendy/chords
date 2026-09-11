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
  const { SEMITONE } = GT.theory;
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
  //       chord. In the triads reading every one of these is the triad the
  //       neck is showing ('bass' its lowest note), since that is the whole
  //       of what that reading offers.
  const n = (at, iv, dur, vel) => ({ at, iv, dur, vel });
  const s = (at, dur, vel, voicing = 'full') => ({ at, dur, vel, strum: true, voicing });

  // Simple has no feels of its own — quarter, half and whole notes are the
  // same piano hit at three spacings — so its parts are written for this one
  // stand-in, on a sixteenth grid like the straight styles.
  const SIMPLE_FEEL = { label: 'Simple', grid: 16 };

  const LIBRARY = {
    simple: {
      // The plainest thing to play over a plain backing: the chord struck
      // whole, and a run through part of the scale between the strikes, in
      // quarter notes or eighths. The reading decides which notes the run
      // lands on — in Chords it thins to the chord tones, in Scales it is
      // the scale.
      'Simple': [
        {
          name: 'Quarter-note run',
          figure: [s(0, 4, 0.85), n(4, 0, 4, 0.8), n(8, 2, 4, 0.75), n(12, 4, 4, 0.8)],
          variants: [
            // the chord on one and three, a step between each
            [s(0, 4, 0.85), n(4, 2, 4, 0.75), s(8, 4, 0.8), n(12, 4, 4, 0.75)],
            // the run first, the chord to close
            [n(0, 0, 4, 0.8), n(4, 2, 4, 0.75), n(8, 4, 4, 0.8), s(12, 4, 0.85)],
          ],
          fills: [
            // on up the scale
            [n(0, 5, 4, 0.8), n(4, 7, 4, 0.8), n(8, 9, 4, 0.8), n(12, 12, 4, 0.85)],
            // down from the octave to the chord
            [n(0, 12, 4, 0.85), n(4, 11, 4, 0.75), n(8, 9, 4, 0.75), s(12, 4, 0.8)],
            // the chord, then three steps down to the root
            [s(0, 4, 0.85), n(4, 4, 4, 0.75), n(8, 2, 4, 0.75), n(12, 0, 4, 0.8)],
          ],
        },
        {
          name: 'Eighth-note run',
          figure: [s(0, 4, 0.85), n(4, 0, 2, 0.8), n(6, 2, 2, 0.7), n(8, 4, 2, 0.75), n(10, 5, 2, 0.7), n(12, 7, 2, 0.75), n(14, 9, 2, 0.7)],
          variants: [
            // the chord on one and three, four steps between
            [s(0, 4, 0.85), n(4, 0, 2, 0.8), n(6, 2, 2, 0.7), s(8, 4, 0.8), n(12, 4, 2, 0.75), n(14, 5, 2, 0.7)],
            // from the 3rd
            [s(0, 4, 0.85), n(4, 4, 2, 0.8), n(6, 5, 2, 0.7), n(8, 7, 2, 0.75), n(10, 9, 2, 0.7), n(12, 11, 2, 0.75), n(14, 12, 2, 0.75)],
          ],
          fills: [
            // the whole way down from the octave
            [n(0, 12, 2, 0.85), n(2, 11, 2, 0.7), n(4, 9, 2, 0.75), n(6, 7, 2, 0.7), n(8, 5, 2, 0.75), n(10, 4, 2, 0.7), n(12, 2, 2, 0.75), n(14, 0, 2, 0.8)],
            // up to the octave and the chord to land on
            [n(0, 5, 2, 0.8), n(2, 7, 2, 0.7), n(4, 9, 2, 0.75), n(6, 11, 2, 0.7), n(8, 12, 4, 0.85), s(12, 4, 0.8)],
            // the chord, and a turn round the root
            [s(0, 4, 0.85), n(4, 2, 2, 0.75), n(6, 0, 2, 0.7), n(8, 11, 2, 0.7), n(10, 0, 2, 0.75), n(12, 2, 2, 0.7), n(14, 4, 2, 0.75)],
          ],
        },
      ],
    },
    blues: {
      // A straight shuffle: down on the first triplet, up on the third, the
      // downbeats leaning harder — and a fill every other bar.
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
            // a walk down from the octave to the root
            [n(0, 12, 1.6, 0.9), n(2, 10, 0.8, 0.7), n(3, 9, 1.6, 0.8), n(5, 7, 0.8, 0.7),
             n(6, 5, 1.6, 0.8), n(8, 4, 0.8, 0.7), n(9, 3, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            // a pentatonic answer that climbs, and the chord to land on
            [n(0, 3, 1.6, 0.9), n(2, 5, 0.8, 0.7), n(3, 7, 1.6, 0.85), n(6, 10, 1.6, 0.85),
             n(8, 12, 0.8, 0.8), s(9, 2.4, 0.75)],
            // half a bar of chords, then a push up to the octave
            [s(0, 1.6, 0.8, 'low'), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.7, 'low'), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.75),
             n(9, 12, 2.4, 0.9)],
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
            [n(0, 0, 1.6, 0.9), n(2, 3, 0.8, 0.7), n(3, 5, 1.6, 0.8), n(5, 6, 0.8, 0.7),
             n(6, 7, 2.4, 0.9), n(9, 10, 1.6, 0.8), n(11, 12, 0.8, 0.75)],
            [n(0, 7, 2.4, 0.9), n(3, 10, 1.6, 0.8), n(5, 7, 0.8, 0.7), n(6, 5, 1.6, 0.8),
             n(8, 3, 0.8, 0.7), s(9, 2.4, 0.8, 'high')],
            [s(0, 1.6, 0.8, 'high'), s(2, 0.8, 0.5, 'high'), n(3, 4, 1.6, 0.85), n(6, 7, 1.6, 0.85), n(8, 10, 0.8, 0.7),
             n(9, 12, 2.4, 0.9)],
          ],
        },
      ],
      // 12/8 and sparse: a chord let ring, and lines that take their time.
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
            [n(0, 10, 3, 0.85), n(3, 7, 3, 0.8), n(6, 5, 3, 0.8), n(9, 3, 3, 0.8)],
            [n(3, 12, 2, 0.85), n(6, 10, 1, 0.7), n(8, 7, 1, 0.7), s(9, 3, 0.75)],
            [n(0, 3, 6, 0.85), s(9, 3, 0.7)],
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
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), n(6, 10, 2, 0.75),
             n(8, 7, 2, 0.8), n(10, 4, 2, 0.75), s(12, 4, 0.8)],
            [s(4, 2, 0.85, 'high'), n(8, 9, 2, 0.75), n(10, 10, 2, 0.75), n(12, 12, 2, 0.9), n(14, 10, 2, 0.75)],
            [n(0, 3, 2, 0.85), n(2, 4, 2, 0.75), n(4, 7, 4, 0.9), n(8, 3, 2, 0.8), n(10, 4, 2, 0.75), s(12, 4, 0.85)],
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
            [n(0, 12, 1, 0.8), n(2, 10, 1, 0.75), n(4, 7, 2, 0.85), n(8, 10, 1, 0.75), n(10, 7, 1, 0.75), n(12, 4, 4, 0.9)],
            [s(4, 2, 0.85, 'high'), n(8, 9, 1, 0.75), n(10, 10, 1, 0.75), n(12, 12, 4, 0.9)],
            [n(2, 3, 1, 0.75), n(4, 4, 2, 0.9), n(8, 7, 1, 0.8), n(10, 3, 1, 0.75), s(12, 4, 0.8)],
          ],
        },
      ],
    },

    rock: {
      // Straight eighths with the weight on 1 and 3, the chord kept low so
      // it sits with the bass; fills out of the root, ♭3, 4, 5 and ♭7 that
      // rock lines are made of (the reading decides what they snap to).
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
            // down from the octave to the root
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), n(6, 5, 2, 0.7),
             n(8, 3, 2, 0.8), n(10, 0, 4, 0.85), s(14, 2, 0.6, 'low')],
            // half a bar of chugging, then a climb to the fifth
            [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             n(8, 0, 2, 0.85), n(10, 3, 2, 0.75), n(12, 5, 2, 0.8), n(14, 7, 2, 0.85)],
            // the fifth hammered, the chord answering on three
            [n(0, 7, 2, 0.85), n(2, 7, 2, 0.6), n(4, 10, 2, 0.8), n(6, 12, 2, 0.8),
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
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8),
             n(8, 7, 2, 0.85), n(10, 5, 2, 0.7), n(12, 3, 2, 0.8), n(14, 0, 2, 0.85)],
            [s(0, 4, 0.9, 'low'), n(6, 12, 2, 0.85), n(8, 10, 2, 0.8), n(10, 7, 2, 0.8), n(12, 5, 4, 0.85)],
            [n(0, 5, 2, 0.85), n(2, 7, 2, 0.8), n(4, 10, 2, 0.8), n(6, 12, 6, 0.9), s(12, 3, 0.8, 'low')],
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
            [n(0, 0, 2, 0.9), n(2, 0, 2, 0.6), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8),
             n(8, 7, 2, 0.85), n(10, 5, 2, 0.7), n(12, 3, 2, 0.8), n(14, 0, 2, 0.8)],
            [s(0, 1.8, 0.85, 'low'), s(2, 1.8, 0.55, 'low'), s(4, 1.8, 0.7, 'low'), s(6, 1.8, 0.55, 'low'),
             n(8, 12, 2, 0.9), n(10, 10, 2, 0.75), n(12, 7, 2, 0.8), n(14, 5, 2, 0.75)],
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
            [n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), n(6, 5, 2, 0.75), n(8, 3, 4, 0.85), n(12, 0, 4, 0.85)],
            [s(0, 2, 0.85, 'low'), s(2, 2, 0.55, 'low'), n(4, 5, 2, 0.8), n(6, 7, 2, 0.8),
             s(8, 2, 0.8, 'low'), s(10, 2, 0.55, 'low'), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)],
            [n(0, 3, 2, 0.8), n(2, 5, 2, 0.8), n(4, 7, 6, 0.9), s(10, 2, 0.5, 'high'), s(12, 4, 0.85)],
          ],
        },
      ],
      // Half-time: the chord held long, the riff slow and low — space is the
      // point, so the fills leave it.
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
            [n(0, 0, 4, 0.9), n(4, 3, 2, 0.75), n(6, 5, 2, 0.75), n(8, 7, 4, 0.85), n(12, 5, 2, 0.7), n(14, 3, 2, 0.7)],
            [s(0, 8, 0.9), n(8, 12, 2, 0.85), n(10, 10, 2, 0.75), n(12, 7, 4, 0.8)],
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
            [n(0, 12, 2, 0.9), n(2, 12, 2, 0.6), n(4, 10, 2, 0.8), n(6, 7, 2, 0.75), n(8, 5, 4, 0.85), n(12, 3, 2, 0.75), n(14, 0, 2, 0.8)],
            [s(0, 8, 0.9), s(8, 8, 0.85)],
            [n(0, 0, 6, 0.9), n(6, 3, 2, 0.75), n(8, 5, 4, 0.85), n(12, 7, 2, 0.8), n(14, 10, 2, 0.8)],
          ],
        },
      ],
    },

    jazz: {
      // Swung: the grid is three to a beat, the eighths on the first and
      // third. Four-to-the-bar comping on the low three strings with 2 and
      // 4 leaning, and the Charleston figure — one and the and of two — on
      // the top; lines out of the chord scale, with a chromatic step where
      // the reading will take one.
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
            // a line down from the octave, swung
            [n(0, 12, 1.6, 0.85), n(2, 11, 0.8, 0.65), n(3, 9, 1.6, 0.8), n(5, 7, 0.8, 0.65),
             n(6, 5, 1.6, 0.8), n(8, 4, 0.8, 0.65), n(9, 2, 1.6, 0.8), n(11, 0, 0.8, 0.7)],
            // up to the 6th and back
            [n(0, 4, 1.6, 0.85), n(2, 5, 0.8, 0.65), n(3, 7, 1.6, 0.8), n(5, 9, 0.8, 0.7),
             n(6, 10, 1.6, 0.8), n(8, 9, 0.8, 0.65), n(9, 7, 1.6, 0.8), n(11, 4, 0.8, 0.65)],
            // two chords, then a climb to the octave
            [s(0, 2.2, 0.65, 'high'), s(3, 2.2, 0.75, 'high'), n(6, 7, 1.6, 0.8), n(8, 9, 0.8, 0.65),
             n(9, 10, 1.6, 0.8), n(11, 12, 0.8, 0.75)],
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
            [n(0, 7, 1.6, 0.85), n(2, 9, 0.8, 0.65), n(3, 10, 1.6, 0.8), n(5, 12, 0.8, 0.7),
             n(6, 10, 1.6, 0.8), n(8, 9, 0.8, 0.65), n(9, 7, 1.6, 0.8), n(11, 5, 0.8, 0.65)],
            [s(0, 2, 0.8, 'high'), n(3, 2, 1.6, 0.8), n(5, 4, 0.8, 0.65), n(6, 5, 1.6, 0.8), n(8, 7, 0.8, 0.65), n(9, 9, 2.4, 0.85)],
            // a walking line on top, quarter notes
            [n(0, 12, 2.4, 0.85), n(3, 10, 2.4, 0.8), n(6, 9, 2.4, 0.8), n(9, 7, 2.4, 0.85)],
          ],
        },
      ],

      // Straight, quiet: the thumb on one and three, the chord in the
      // fingers on the syncopations between — the bossa's own rhythm guitar
      // — with lines out of the chord scale that move by step.
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
            [n(0, 4, 2, 0.75), n(2, 5, 2, 0.65), n(4, 7, 2, 0.7), n(6, 9, 2, 0.65), n(8, 11, 2, 0.7), n(10, 12, 4, 0.75)],
            [s(0, 4, 0.8, 'bass'), n(4, 12, 2, 0.75), n(6, 11, 2, 0.65), n(8, 9, 2, 0.7), n(10, 7, 2, 0.65), n(12, 5, 2, 0.65), n(14, 4, 2, 0.65)],
            [n(0, 9, 4, 0.75), n(4, 7, 2, 0.65), n(6, 5, 2, 0.65), n(8, 4, 4, 0.7), s(12, 4, 0.55, 'high')],
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
            [n(0, 12, 2, 0.75), n(2, 11, 2, 0.65), n(4, 9, 2, 0.7), n(6, 7, 2, 0.65), n(8, 5, 4, 0.7), n(12, 4, 2, 0.65), n(14, 2, 2, 0.65)],
            [s(0, 2, 0.8, 'bass'), n(2, 4, 2, 0.65), n(4, 5, 2, 0.65), n(6, 7, 2, 0.7), s(8, 2, 0.75, 'bass'), n(10, 9, 2, 0.65), n(12, 11, 2, 0.65), n(14, 12, 2, 0.7)],
            [n(0, 7, 4, 0.75), n(4, 9, 2, 0.65), n(6, 7, 2, 0.65), n(8, 4, 4, 0.7), n(12, 2, 2, 0.65), n(14, 0, 2, 0.7)],
          ],
        },
      ],
    },

    pop: {
      // Straight, the chord doing most of the work: the down-down-up-up-
      // down-up strum with the ups on the top strings, and broken chords
      // out of the root, 3rd, 5th and octave.
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
            // the chord broken upward, and struck to close
            [n(0, 0, 2, 0.85), n(2, 4, 2, 0.7), n(4, 7, 2, 0.75), n(6, 12, 2, 0.8),
             n(8, 7, 2, 0.7), n(10, 4, 2, 0.65), s(12, 4, 0.8)],
            // half the pattern, then a line down from the octave
            [s(0, 4, 0.8), s(4, 2, 0.75), s(6, 2, 0.55, 'high'), n(8, 12, 2, 0.85), n(10, 9, 2, 0.7), n(12, 7, 2, 0.75), n(14, 4, 2, 0.7)],
            // a melody note a beat, rising
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
            [n(0, 12, 2, 0.85), n(2, 12, 2, 0.6), n(4, 9, 2, 0.75), n(6, 7, 2, 0.7), n(8, 4, 4, 0.8), n(12, 0, 4, 0.85)],
            [n(0, 0, 2, 0.8), n(2, 4, 2, 0.65), n(4, 7, 2, 0.7), n(6, 12, 2, 0.75),
             n(8, 14, 2, 0.75), n(10, 12, 2, 0.7), n(12, 7, 2, 0.65), n(14, 4, 2, 0.6)],
            [s(0, 4, 0.8), s(4, 4, 0.7), n(8, 9, 2, 0.75), n(10, 7, 2, 0.7), n(12, 4, 4, 0.8)],
          ],
        },
      ],
    },

    funk: {
      // Sixteenths, short: the hit on one and the chops on the top strings
      // in the gaps the drums leave, single-note lines out of the root, ♭3,
      // 4, 5, ♭7 and octave that funk guitar lives on.
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
            [n(0, 0, 1, 0.9), n(2, 10, 1, 0.7), n(3, 12, 1, 0.7), n(6, 10, 1, 0.7), n(8, 7, 2, 0.8),
             n(11, 5, 1, 0.6), n(12, 3, 2, 0.8), n(14, 0, 2, 0.7)],
            [s(0, 1, 0.9, 'high'), n(4, 7, 1, 0.8), n(6, 10, 1, 0.7), n(7, 12, 1, 0.75), n(10, 10, 1, 0.7), n(12, 7, 4, 0.85)],
            // octaves, then a chop and a turn
            [n(0, 0, 1, 0.9), n(2, 12, 1, 0.75), n(4, 0, 1, 0.8), n(6, 12, 1, 0.75),
             s(8, 1, 0.7, 'high'), s(10, 1, 0.5, 'high'), n(12, 10, 2, 0.75), n(14, 12, 2, 0.75)],
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
            [n(0, 12, 1, 0.85), n(2, 10, 1, 0.7), n(3, 7, 1, 0.7), n(6, 5, 1, 0.7), n(8, 3, 2, 0.8), n(11, 0, 1, 0.6), n(12, 0, 2, 0.85)],
            [n(0, 0, 1, 0.85), n(2, 3, 1, 0.7), n(3, 5, 1, 0.7), n(6, 7, 1, 0.75), n(8, 10, 1, 0.8), n(10, 12, 1, 0.75),
             s(12, 1, 0.75, 'high'), s(14, 1, 0.5, 'high')],
          ],
        },
      ],

      // Four on the floor under it, the guitar on the off-beats: short chops
      // on the top strings on the ands, and the octave line disco bass and
      // guitar share.
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
            // the octave line
            [n(0, 0, 1, 0.85), n(2, 12, 1, 0.7), n(4, 0, 1, 0.8), n(6, 12, 1, 0.7),
             n(8, 0, 1, 0.8), n(10, 12, 1, 0.7), n(12, 10, 2, 0.75), n(14, 12, 2, 0.75)],
            [s(2, 2, 0.75, 'high'), s(6, 2, 0.75, 'high'), n(8, 7, 2, 0.8), n(10, 10, 2, 0.75), n(12, 12, 4, 0.85)],
            [n(0, 0, 2, 0.85), n(2, 3, 1, 0.7), n(3, 5, 1, 0.7), n(4, 7, 2, 0.8), n(6, 10, 2, 0.75), n(8, 12, 4, 0.85), s(14, 2, 0.7, 'high')],
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
            [s(2, 2, 0.75, 'high'), s(6, 2, 0.75, 'high'), s(10, 2, 0.75, 'high'), s(13, 1, 0.5, 'high'), s(14, 2, 0.75, 'high')],
            [n(0, 12, 1, 0.85), n(2, 10, 1, 0.7), n(4, 7, 2, 0.8), n(6, 5, 2, 0.7), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8), n(12, 0, 4, 0.85)],
            [n(0, 0, 2, 0.85), n(2, 0, 1, 0.5), n(3, 3, 1, 0.7), n(4, 5, 2, 0.75), n(6, 7, 2, 0.75), n(8, 10, 2, 0.8), n(10, 12, 2, 0.8), s(14, 2, 0.75, 'high')],
          ],
        },
      ],
    },
  };

  // The parts written for a feel. Every feel the picker offers has some,
  // and a test says so; a feel with none would simply offer nothing.
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
      return voicing === 'bass' ? [low[0]] : low;
    }
    const grip = gripIn(chord, opts.window);
    if (!grip) return null;
    const low = grip.sort((a, b) => b.string - a.string);          // string 5 is the low E
    switch (voicing){
      // the root, or the 5th when the window has cut the grip's root off —
      // the other note an alternating bass goes to — or the lowest there is
      case 'bass': return [low.find(c => c.midi % 12 === rootPc) || low.find(c => c.midi % 12 === fifthPc) || low[0]];
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
  function realiseBar(written, chord, opts){
    const { root, allowed } = palette(chord, opts);
    const cells = cellsIn(opts.window);
    const home = homeMidi(cells, root);
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
                     strum: true, voicing: w.voicing || 'full', spread: k * STRUM_SPREAD });
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
  // The figure's variants take the phrases in turn, figure first.
  function figureFor(part, phrase){
    const figures = [part.figure, ...(part.variants || [])];
    return figures[phrase % figures.length];
  }

  function realise(part, bars, picks, opts){
    const notes = [];
    bars.forEach((bar, b) => {
      if (!bar.chord) return;
      const phrase = Math.floor(b / 2);
      const written = b % 2 === 0
        ? figureFor(part, phrase)
        : part.fills[Math.abs(picks[phrase] || 0) % part.fills.length];
      realiseBar(written, bar.chord, opts).forEach(note => notes.push({ ...note, bar: b }));
    });
    return notes;
  }

  // A fresh roll of fills for a progression this many bars long.
  const rollFills = (part, barCount, rng = Math.random) =>
    Array.from({ length: Math.ceil(barCount / 2) }, () => Math.floor(rng() * part.fills.length));

  GT.parts = { LIBRARY, SIMPLE_FEEL, partsFor, palette, snap, realiseBar, realise, rollFills, figureFor, cellsIn, homeMidi, gripIn, triadIn, strumCells, strumStringLevel };
})();
