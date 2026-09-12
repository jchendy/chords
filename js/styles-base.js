// The band patterns the app started with: one entry per style, each with its
// feels (variants) — a kit, a comp and a bass on a 12- or 16-slot grid. These
// are the BASE patterns; js/styles.js merges the proposals from
// review/proposals*.js over them at load, and what the app plays is the
// result (GT.styles.STYLES). Kept as written so the review page can still
// show what the app played before.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const STYLES = {
    // Hendrix: no base feels — every one of his is an addition in
    // review/proposals-hendrix.js, merged in by styles.js
    hendrix: { label: 'Hendrix', variants: [] },
    rock: {
      label: 'Rock',
      variants: [
        {
          label: 'Straight rock',
          grid: 16,
          kick:  [0, 8, 10],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, dur: 1.8, vel: s % 4 === 0 ? 0.95 : 0.6 })),
          bass:  [0, 4, 8, 12].map((s, i) => ({ slot: s, off: 0, dur: 3.4, vel: [0.95, 0.8, 0.88, 0.8][i] })),
        },
        {
          // Between the other two: Straight rock strums eight chords a bar,
          // Half-time holds two and puts the snare on 3 alone. This keeps the
          // full backbeat and the eighth-note hats — which is where the drive
          // and the motion come from — and thins out what's above them: a
          // chord on each quarter rather than each eighth, each one ending as
          // the next lands. The bass does the rest of the work: roots on 1
          // and 3, a pickup on the "and" of 2, and the fifth on the "and" of
          // 4 leading back round. Plain "Rock" in the list: the one you'd
          // expect when you ask for rock, and what a fresh page plays.
          label: 'Rock',
          grid: 16,
          kick:  [0, 6, 8],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [
            { slot: 0,  dur: 3.6, vel: 0.9 },  { slot: 4,  dur: 3.6, vel: 0.68 },
            { slot: 8,  dur: 3.6, vel: 0.82 }, { slot: 12, dur: 3.6, vel: 0.68 },
          ],
          bass: [
            { slot: 0,  off: 0, dur: 3.4, vel: 0.9 },  { slot: 6,  off: 0, dur: 1.6, vel: 0.7 },
            { slot: 8,  off: 0, dur: 3.4, vel: 0.85 }, { slot: 14, off: 7, dur: 1.6, vel: 0.72 },
          ],
        },
        {
          label: 'Half-time rock',     // snare only on 3, sustained power chords
          grid: 16,
          kick:  [0, 6],
          snare: [8],
          hat:   [0, 4, 8, 12],
          voice: 'triad',
          chord: [{ slot: 0, dur: 7.5, vel: 0.9 }, { slot: 8, dur: 7.5, vel: 0.85 }],
          bass:  [{ slot: 0, off: 0, dur: 7.5, vel: 0.95 }, { slot: 8, off: 0, dur: 7.5, vel: 0.85 }],
        },
      ],
    },
    rockabilly: {
      label: 'Rockabilly',
      variants: [
        {
          // Swung and quick: the slap bass walking root and fifth on every
          // beat with its click on the upbeats (the hat carries the click),
          // the snare on 2 and 4, the comp chanking on the shuffle upbeats
          // and leaning on 2 and 4 — a dominant-7th boogie sound.
          label: 'Rockabilly',
          grid: 12,
          kick:  [0, 6],
          snare: [3, 9],
          hat:   [2, 5, 8, 11],
          voice: 'dom7',
          chord: [
            { slot: 2, dur: 1, vel: 0.5 }, { slot: 3, dur: 1.6, vel: 0.72 }, { slot: 5, dur: 1, vel: 0.5 },
            { slot: 8, dur: 1, vel: 0.5 }, { slot: 9, dur: 1.6, vel: 0.72 }, { slot: 11, dur: 1, vel: 0.5 },
          ],
          bass: [
            { slot: 0, off: 0, dur: 1.3, vel: 0.95 }, { slot: 3, off: 7, dur: 1.3, vel: 0.8 },
            { slot: 6, off: 0, dur: 1.3, vel: 0.9 },  { slot: 9, off: 7, dur: 1.3, vel: 0.8 },
          ],
        },
      ],
    },
    psychobilly: {
      label: 'Psychobilly',
      variants: [
        {
          // Straight and faster: the kick on every beat, the snare hard on 2
          // and 4, the bass pumping eighths on root and fifth with an octave
          // leap into three and one, and the chords chugging every eighth.
          label: 'Psychobilly',
          grid: 16,
          kick:  [0, 4, 8, 12],
          snare: [4, 12],
          snareVel: 0.95,
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, dur: 1.2, vel: s % 8 === 0 ? 0.9 : 0.62 })),
          bass:  [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ slot: s, off: [0, 7, 0, 12, 0, 7, 0, 12][i], dur: 1.6, vel: i % 2 ? 0.8 : 0.9 })),
        },
      ],
    },
    surf: {
      label: 'Surf rock',
      variants: [
        {
          // Straight, fast and dry: the kick on 1 and 3 with a push into
          // each, the snare cracking 2 and 4, eighth-note hats, the bass
          // pumping eighths on the root with the fifth under beat three, and
          // the chords on every eighth, short.
          label: 'Surf rock',
          grid: 16,
          kick:  [0, 6, 8, 14],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, dur: 1.4, vel: s % 4 === 0 ? 0.8 : 0.55 })),
          bass:  [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ slot: s, off: [0, 0, 0, 0, 7, 7, 0, 0][i], dur: 1.7, vel: i % 2 ? 0.75 : 0.9 })),
        },
      ],
    },
    country: {
      label: 'Country',
      variants: [
        {
          // A two-feel with a train under it: the bass alternating root and
          // fifth on the beat, the snare on 2 and 4 with the hat on the
          // eighths, and the comp chanking on 2 and 4 with a lighter one on
          // the ands — the guitar's boom-chick, in the piano's hands.
          label: 'Country',
          grid: 16,
          kick:  [0, 8],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [
            { slot: 2, dur: 1.2, vel: 0.35 }, { slot: 4, dur: 2.5, vel: 0.7 }, { slot: 6, dur: 1.2, vel: 0.35 },
            { slot: 10, dur: 1.2, vel: 0.35 }, { slot: 12, dur: 2.5, vel: 0.7 }, { slot: 14, dur: 1.2, vel: 0.35 },
          ],
          bass: [
            { slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 4, off: 7, dur: 3.6, vel: 0.75 },
            { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 12, off: 7, dur: 3.6, vel: 0.75 },
          ],
        },
      ],
    },
    bluegrass: {
      label: 'Bluegrass',
      variants: [
        {
          // No drums: the bass in two — root on one, fifth on three — and
          // the chop on 2 and 4, short, which is the mandolin's job and here
          // the comp's. Quick, and everything on the beat.
          label: 'Bluegrass',
          grid: 16,
          kick: [], snare: [], hat: [],
          voice: 'triad',
          chord: [{ slot: 4, dur: 1, vel: 0.8 }, { slot: 12, dur: 1, vel: 0.8 }],
          bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 8, off: 7, dur: 3.6, vel: 0.8 }],
        },
      ],
    },
    blues: {
      label: 'Blues',
      variants: [
        {
          label: 'Blues shuffle',      // straight-shuffle boogie: 1st & 3rd triplet of each beat
          grid: 12,
          kick:  [0, 6],
          snare: [3, 9],
          hat:   [0, 2, 3, 5, 6, 8, 9, 11],
          voice: 'dom7',
          // walking boogie bass: 1 3 5 6 b7 6 5 3
          bass: [
            { slot: 0, off: 0,  dur: 1.7, vel: 0.95 }, { slot: 2,  off: 4, dur: 0.8, vel: 0.8 },
            { slot: 3, off: 7,  dur: 1.7, vel: 0.9 },  { slot: 5,  off: 9, dur: 0.8, vel: 0.8 },
            { slot: 6, off: 10, dur: 1.7, vel: 0.9 },  { slot: 8,  off: 9, dur: 0.8, vel: 0.8 },
            { slot: 9, off: 7,  dur: 1.7, vel: 0.9 },  { slot: 11, off: 4, dur: 0.8, vel: 0.8 },
          ],
          // chord on the downbeat, light stabs on the shuffle upbeats —
          // each let ring well past the next hit for a fuller sustain
          chord: [
            { slot: 0, dur: 6, vel: 0.8 },
            { slot: 2, dur: 2.2, vel: 0.4 }, { slot: 5, dur: 2.2, vel: 0.4 },
            { slot: 8, dur: 2.2, vel: 0.4 }, { slot: 11, dur: 2.2, vel: 0.4 },
          ],
        },
        {
          label: 'Slow blues',   // sparse 12/8 ballad: just the turnaround bass and a held chord
          grid: 12,
          kick:  [0, 6],
          kickVel: 0.55,
          snare: [9],
          hat:   [0, 3, 6, 9],
          voice: 'dom7',
          bass: [{ slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 6, off: 7, dur: 5, vel: 0.8 }],
          chord: [{ slot: 0, dur: 11, vel: 0.7 }],
        },
        {
          // T51: the one blues here that isn't swung. Every other variant is
          // built on triplets, so all three shuffle; this is the jump / rock
          // and roll side of the music — even eighths, quicker, with the
          // drive coming from the bass figure and the backbeat rather than
          // from the lilt. A 16-slot grid, so an eighth is two slots and the
          // eighths land square instead of on the 1st and 3rd of a triplet.
          label: 'Jump blues',
          grid: 16,
          kick:  [0, 6, 8, 14],
          snare: [4, 12],              // backbeat, hard: this is where it drives from
          snareVel: 0.9,
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'dom7',
          // the boogie figure, straight: 1 3 5 6 - b7 6 5 3, two slots a note
          bass: [
            { slot: 0,  off: 0,  dur: 1.9, vel: 0.95 }, { slot: 2,  off: 4,  dur: 1.9, vel: 0.8 },
            { slot: 4,  off: 7,  dur: 1.9, vel: 0.9 },  { slot: 6,  off: 9,  dur: 1.9, vel: 0.8 },
            { slot: 8,  off: 10, dur: 1.9, vel: 0.9 },  { slot: 10, off: 9,  dur: 1.9, vel: 0.8 },
            { slot: 12, off: 7,  dur: 1.9, vel: 0.9 },  { slot: 14, off: 4,  dur: 1.9, vel: 0.8 },
          ],
          // Two stabs a bar, on the backbeat, and nothing else. A jump band
          // doesn't comp through this — the bass boogie is the engine and
          // the horns punch 2 and 4 — and six hits a bar left no room to
          // hear either. Short, so they're punches rather than pads.
          chord: [
            { slot: 4, dur: 1.5, vel: 0.75 }, { slot: 12, dur: 1.5, vel: 0.7 },
          ],
        },
      ],
    },
    jazz: {
      label: 'Jazz',
      variants: [
        {
          label: 'Swing',        // spang-a-lang ride + walking bass + Charleston comping
          grid: 12,
          kick:  [0, 6],
          kickVel: 0.3,
          snare: [],
          hat:   [3, 9],                       // foot hi-hat on 2 & 4
          ride:  [0, 3, 5, 6, 9, 11],          // spang-a-lang
          voice: 'jazz',
          bass: [
            { slot: 0, walk: 0, dur: 2.6, vel: 0.9 },
            { slot: 3, walk: 1, dur: 2.6, vel: 0.78 },
            { slot: 6, walk: 2, dur: 2.6, vel: 0.78 },
            { slot: 9, walk: 3, dur: 2.6, vel: 0.78 },
          ],
          chord: [
            { slot: 0, dur: 1.5, vel: 0.5 }, { slot: 5, dur: 2.2, vel: 0.55 },
            { slot: 6, dur: 1.5, vel: 0.5 }, { slot: 11, dur: 2.2, vel: 0.55 },
          ],
        },
        {
          label: 'Bossa nova',   // straight (unswung) samba-derived bass, syncopated comp
          grid: 16,
          kick:  [0, 6, 10],
          kickVel: 0.45,
          snareVel: 0.5,
          snare: [4, 14],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'jazz',
          bass: [
            { slot: 0, off: 0, dur: 5.5, vel: 0.9 },
            { slot: 6, off: 7, dur: 3.5, vel: 0.7 },
            { slot: 10, off: 0, dur: 5.5, vel: 0.8 },
          ],
          chord: [{ slot: 6, dur: 3, vel: 0.5 }, { slot: 12, dur: 3, vel: 0.5 }],
        },
      ],
    },
    gypsy: {
      label: 'Gypsy jazz',
      variants: [
        {
          // No drums: the rhythm guitar is the drums. La pompe — four short
          // chords to the bar with a lift into 2 and 4 that lands harder —
          // over a bass in two, root on one and the fifth on three. The
          // lines swing, so the grid is in threes.
          label: 'Gypsy jazz',
          grid: 12,
          kick: [], snare: [], hat: [],
          voice: 'jazz',
          chord: [
            { slot: 0, dur: 1.2, vel: 0.5 }, { slot: 2, dur: 0.6, vel: 0.3 }, { slot: 3, dur: 1, vel: 0.75 },
            { slot: 6, dur: 1.2, vel: 0.5 }, { slot: 8, dur: 0.6, vel: 0.3 }, { slot: 9, dur: 1, vel: 0.75 },
          ],
          bass: [{ slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 6, off: 7, dur: 5, vel: 0.8 }],
        },
      ],
    },
    ballad: {
      label: '6/8 ballad',
      variants: [
        {
          // Slow, in twelve: four beats of three. The kick on 1 and 3, the
          // snare on 2 and 4, the ride on every one of the twelve, the bass
          // holding the root and moving to the fifth under three, and the
          // chord on each beat, softer on the off ones — the piano rolling
          // where a guitar would arpeggiate.
          label: '6/8 ballad',
          grid: 12,
          kick:  [0, 6],
          snare: [3, 9],
          snareVel: 0.6,
          ride:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          hat:   [],
          voice: 'triad',
          chord: [{ slot: 0, dur: 3, vel: 0.7 }, { slot: 3, dur: 3, vel: 0.5 }, { slot: 6, dur: 3, vel: 0.65 }, { slot: 9, dur: 3, vel: 0.5 }],
          bass:  [{ slot: 0, off: 0, dur: 6, vel: 0.9 }, { slot: 6, off: 7, dur: 3, vel: 0.75 }, { slot: 9, off: 0, dur: 3, vel: 0.7 }],
        },
      ],
    },
    reggae: {
      label: 'Reggae',
      variants: [
        {
          // One drop: nothing on one, the kick and the rim together on
          // three, the hat on the eighths, the skank on every and, short —
          // and the bass in the space, root on one, off it by three.
          label: 'Reggae',
          grid: 16,
          kick:  [8],
          snare: [8],
          snareVel: 0.5,
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [2, 6, 10, 14].map(s => ({ slot: s, dur: 1.2, vel: 0.7 })),
          bass: [
            { slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 6, off: 0, dur: 2, vel: 0.6 },
            { slot: 8, off: 7, dur: 4, vel: 0.8 }, { slot: 12, off: 0, dur: 4, vel: 0.8 },
          ],
        },
      ],
    },
    ska: {
      label: 'Ska',
      variants: [
        {
          // Quick and straight: the kick on 1 and 3, the snare on 2 and 4,
          // the hat on the eighths, every and an upstroke, short — and a
          // walking bass in eighths, root, 3rd, 5th, 6th and back.
          label: 'Ska',
          grid: 16,
          kick:  [0, 8],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [2, 6, 10, 14].map(s => ({ slot: s, dur: 1, vel: 0.75 })),
          bass:  [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ slot: s, off: [0, 4, 7, 9, 12, 9, 7, 4][i], dur: 1.8, vel: i % 2 ? 0.75 : 0.9 })),
        },
      ],
    },
    soul: {
      label: 'Soul',
      variants: [
        {
          // A pocket: the kick on 1, the and of 2 and 3, the snare on 2 and
          // 4, eighth-note hats, 7th-chord shells off the beat, and a bass
          // line that walks root, octave, fifth, ♭7 back to the root.
          label: 'Soul',
          grid: 16,
          kick:  [0, 6, 8],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'jazz',
          chord: [{ slot: 2, dur: 2, vel: 0.55 }, { slot: 6, dur: 2, vel: 0.6 }, { slot: 10, dur: 2, vel: 0.55 }, { slot: 12, dur: 3, vel: 0.65 }],
          bass: [
            { slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 6, off: 12, dur: 1.6, vel: 0.7 },
            { slot: 8, off: 7, dur: 3.6, vel: 0.85 }, { slot: 12, off: 10, dur: 1.6, vel: 0.7 }, { slot: 14, off: 0, dur: 1.6, vel: 0.75 },
          ],
        },
      ],
    },
    pop: {
      label: 'Pop',
      variants: [
        {
          label: 'Pop',
          grid: 16,
          kick:  [0, 4, 8, 12],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 4, 8, 12].map(s => ({ slot: s, dur: 3.6, vel: 0.8 })),
          bass:  [0, 4, 8, 12].map(s => ({ slot: s, off: 0, dur: 3.6, vel: 0.85 })),
        },
      ],
    },
    funk: {
      label: 'Funk',
      variants: [
        {
          label: 'Classic funk', // hit "the One", syncopated ghost kicks, constant 16th hats
          grid: 16,
          kick:  [0, 3, 7, 10],
          kickVel: 1,
          snare: [4, 12],
          hat:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          voice: 'dom7',
          chord: [2, 6, 9, 14].map(s => ({ slot: s, dur: 2.4, vel: 0.65 })),
          bass:  [0, 3, 7, 10, 14].map(s => ({ slot: s, off: 0, dur: 1.7, vel: 0.85 })),
        },
        {
          label: 'Disco',
          grid: 16,
          kick:  [0, 4, 8, 12],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [2, 6, 10, 14].map(s => ({ slot: s, dur: 3, vel: 0.7 })),
          // octave-jumping disco bass
          bass: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ slot: s, off: i % 2 === 0 ? 0 : 12, dur: 1.85, vel: 0.85 })),
        },
      ],
    },
    metal: {
      label: 'Metal',
      variants: [
        {
          // Straight and hard: the kick on every eighth, the snare on 2 and
          // 4, the hat on the eighths, and the chords and the bass chugging
          // together on every eighth, the downbeats leaning.
          label: 'Metal',
          grid: 16,
          kick:  [0, 2, 4, 6, 8, 10, 12, 14],
          snare: [4, 12],
          snareVel: 0.95,
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, dur: 1.3, vel: s % 8 === 0 ? 0.9 : 0.6 })),
          bass:  [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, off: 0, dur: 1.6, vel: s % 8 === 0 ? 0.95 : 0.8 })),
        },
      ],
    },
  };


  GT.stylesBase = { STYLES };
})();
