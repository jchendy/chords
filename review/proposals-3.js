// Proposals, part 3: country, bluegrass, jazz.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { n, nx, s, g, d, b, h, p, sl, chug } = GT.reviewHelpers;
  const genres = GT.review.genres;

  // =========================================================================
  genres.push({
    id: 'country', name: 'Country',
    research: `
      <p><b>What the players actually do.</b> Luther Perkins behind Johnny Cash ("Folsom Prison Blues", "I Walk the Line") plays the boom-chicka-boom: a palm-muted bass note on the beat and a muted brush of the chord on the "and", with the snare on every eighth like a train. Merle Travis and Chet Atkins ("Cannonball Rag") alternate the thumb between root and 5th, palm-muted, with the melody in syncopated sixteenths on top. Don Rich with Buck Owens ("Act Naturally", "I've Got a Tiger by the Tail") chicken-picks a Telecaster: staccato, popped notes, double stops, and the steel-guitar bend — one note bent up to the 3rd while the note above it holds. Waylon Jennings ("Good Hearted Woman") plays a muted "chicka" on the low strings, through a phaser, over a kick on every beat. The Eagles and Tom Petty strum mid-tempo on a backbeat with a walking bass into the changes. Brad Paisley plays hybrid-picked sixteenth-note runs and banjo rolls at speed.</p>
      <p><b>What the app has now, and what is off about it.</b> One country style, and its boom-chick has no palm-mute, no brush on the "and", no train snare, no bass walk-ups — the four things that make it country. There is no chicken pickin', no Travis picking, no steel bend, no waltz.</p>`,
    existing: [
      {
        style: 'country', label: 'Country', rename: 'Train beat (Cash-inspired)',
        verdict: `<p>Band: the snare on every eighth, brushed, with the accent on 2 and 4 (per-hit velocities), the bass walking up into every change, slapback on the guitar. Guitar: the boom-chicka — palm-muted root on the beat, a muted brush of the top strings on the "and", the 5th on the next beat — and the G-run into every change; the chicken-pickin' part with the steel bend; Travis picking as its own part.</p>`,
        band: { snare: [0, 2, 4, 6, 8, 10, 12, 14], snareVels: { 0: 0.35, 2: 0.3, 4: 0.8, 6: 0.3, 8: 0.35, 10: 0.3, 12: 0.8, 14: 0.35 }, hat: [], bassApproach: true, slapback: true, fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Boom-chicka (Perkins-inspired)', replaces: 'Boom-chick',
            why: 'The root, palm-muted; a muted brush of the top strings on the "and"; the 5th; the brush again. All muted. The change fill is the walk-up in the bass; the stay fill is the G-run.',
            figure: [s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), s(8, 2, 0.9, 'bass', 'mute'), s(10, 1, 0.5, 'high', 'mute'), s(12, 2, 0.8, 'fifth', 'mute'), s(14, 1, 0.5, 'high', 'mute')],
            variants: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(3, 1, 0.4, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), s(7, 1, 0.4, 'high', 'mute'), s(8, 2, 0.9, 'bass', 'mute'), s(10, 1, 0.5, 'high', 'mute'), s(11, 1, 0.4, 'high', 'mute'), s(12, 2, 0.8, 'fifth', 'mute'), s(14, 1, 0.5, 'high', 'mute'), s(15, 1, 0.4, 'high', 'mute')],
                       [s(0, 2, 0.9, 'bass', 'mute'), s(2, 2, 0.7, 'high'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 2, 0.7, 'high'), s(8, 2, 0.9, 'bass', 'mute'), s(10, 2, 0.7, 'high'), s(12, 2, 0.8, 'fifth', 'mute'), s(14, 2, 0.7, 'high')]],
            fills: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), n(8, 0, 2, 0.85, { pm: true }), n(10, 2, 2, 0.8, { pm: true }), h(12, 3, 4, 2, 0.85), n(14, 7, 2, 0.8, { pm: true })]],
            fillsOnChange: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), nx(8, -5, 2, 0.9, { pm: true }), nx(10, -3, 2, 0.75, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })],
                            [s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), nx(8, 4, 2, 0.85, { pm: true }), nx(10, 2, 2, 0.75, { pm: true }), nx(12, 0, 4, 0.9, { pm: true })]],
            fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 2, 2, 0.75, { pm: true }), h(4, 3, 4, 2, 0.85), n(6, 7, 2, 0.8, { pm: true }), n(8, 9, 2, 0.8, { pm: true }), n(10, 12, 2, 0.85), s(12, 2, 0.8, 'fifth', 'mute'), s(14, 1, 0.5, 'high', 'mute')]],
          },
          {
            name: "Chicken pickin' (Rich-inspired)", replaces: 'Walk and chank',
            why: 'Staccato popped notes on the top strings — the 2nd, 3rd, 5th, 6th with muted ghosts between — and the steel bend: the 2nd pushed up to the 3rd while the 5th holds above it. Needs staccato, ghost notes and double-stop bends.',
            figure: [n(0, 4, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), n(2, 7, 1, 0.85, { stacc: true }), n(3, 7, 1, 0.3, { ghost: true }), d(4, 2, 7, 4, 0.85, { up: 2 }), n(8, 9, 1, 0.85, { stacc: true }), n(9, 9, 1, 0.3, { ghost: true }), n(10, 7, 1, 0.8, { stacc: true }), n(11, 7, 1, 0.3, { ghost: true }), n(12, 4, 2, 0.85, { stacc: true }), n(14, 0, 2, 0.8, { stacc: true })],
            variants: [[d(0, 2, 7, 4, 0.9, { up: 2 }), n(4, 4, 1, 0.85, { stacc: true }), n(5, 4, 1, 0.3, { ghost: true }), n(6, 2, 1, 0.8, { stacc: true }), n(7, 2, 1, 0.3, { ghost: true }), n(8, 0, 4, 0.85), d(12, 4, 9, 4, 0.8)],
                       [n(0, 0, 1, 0.9, { stacc: true }), n(1, 0, 1, 0.3, { ghost: true }), h(2, 3, 4, 2, 0.85), n(4, 7, 1, 0.85, { stacc: true }), n(5, 7, 1, 0.3, { ghost: true }), n(6, 9, 2, 0.8, { stacc: true }), n(8, 12, 1, 0.85, { stacc: true }), n(9, 12, 1, 0.3, { ghost: true }), n(10, 9, 1, 0.8, { stacc: true }), n(11, 9, 1, 0.3, { ghost: true }), n(12, 7, 4, 0.85, { vib: true })]],
            fills: [[n(0, 12, 1, 0.9, { stacc: true }), n(1, 12, 1, 0.3, { ghost: true }), n(2, 9, 1, 0.85, { stacc: true }), n(3, 9, 1, 0.3, { ghost: true }), n(4, 7, 1, 0.85, { stacc: true }), n(5, 7, 1, 0.3, { ghost: true }), h(6, 3, 4, 2, 0.85), d(8, 2, 7, 4, 0.9, { up: 2 }), n(12, 0, 4, 0.85)]],
            fillsOnChange: [[n(0, 4, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), n(2, 7, 1, 0.85, { stacc: true }), n(3, 7, 1, 0.3, { ghost: true }), n(4, 9, 2, 0.85, { stacc: true }), n(6, 12, 2, 0.85, { stacc: true }), n(8, 9, 2, 0.8), n(10, 7, 2, 0.8), nx(12, 5, 2, 0.75), nx(14, 4, 2, 0.85, { stacc: true })]],
            fillsOnStay: [[d(0, 2, 7, 4, 0.9, { up: 2 }), d(4, 2, 7, 4, 0.85, { up: 2 }), n(8, 4, 1, 0.85, { stacc: true }), n(9, 4, 1, 0.3, { ghost: true }), n(10, 2, 1, 0.8, { stacc: true }), n(11, 2, 1, 0.3, { ghost: true }), n(12, 0, 4, 0.85)]],
          },
          {
            name: 'Travis picking (Travis/Atkins-inspired)',
            why: 'The thumb alternating root and 5th on every beat, palm-muted, and the melody in the sixteenths between — a 3rd on the "e", the 5th on the "a" — with a hammer-on inside the pattern.',
            figure: [s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(5, 7, 1, 0.55), n(6, 12, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 4, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(13, 7, 1, 0.55), n(14, 9, 2, 0.6)],
            variants: [[s(0, 2, 0.85, 'bass', 'mute'), n(1, 12, 1, 0.5), n(2, 7, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 4, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), h(9, 2, 4, 2, 0.6), n(11, 7, 1, 0.5), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 12, 2, 0.6)],
                       [s(0, 2, 0.85, 'bass', 'mute'), n(2, 12, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 12, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 9, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 7, 2, 0.6)]],
            fills: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 9, 2, 0.65), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 7, 2, 0.65), s(8, 2, 0.85, 'bass', 'mute'), h(10, 3, 4, 2, 0.7), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 0, 2, 0.65)]],
            fillsOnChange: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 7, 2, 0.6), nx(8, -5, 2, 0.85, { pm: true }), nx(10, -3, 2, 0.7, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 12, 2, 0.65), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 11, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 9, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 7, 2, 0.6)]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Bakersfield', inspired: 'Buck Owens and Don Rich ("Act Naturally", "Tiger by the Tail"), Merle Haggard\'s Strangers', style: 'country',
        progression: ['A', 'A', 'D', 'A', 'E', 'A'], key: 'A', tempo: 132,
        why: `<p>A crisp two: kick on 1 and 3, the snare sharp on 2 and 4, the bass walking root–3–5–6 into every change, and a Telecaster playing double stops with the steel bend, staccato, through slapback. Brighter and quicker than the train beat.</p>`,
        band: { grid: 16, kick: [0, 8], snare: [4, 12], snareVel: 0.9, hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 4, off: 4, dur: 3.6, vel: 0.75 }, { slot: 8, off: 7, dur: 3.6, vel: 0.85 }, { slot: 12, off: 9, dur: 3.6, vel: 0.75 }], bassApproach: true,
                chord: [{ slot: 4, dur: 2, vel: 0.6 }, { slot: 12, dur: 2, vel: 0.6 }], slapback: true },
        parts: [
          {
            name: 'Steel bends and double stops',
            why: 'Double stops in 3rds on 2 and 4 with the lower note bent up to them (the steel guitar in one hand), popped single notes between.',
            figure: [n(0, 0, 2, 0.85, { stacc: true }), n(2, 2, 2, 0.75, { stacc: true }), d(4, 2, 7, 4, 0.9, { up: 2 }), n(8, 7, 2, 0.8, { stacc: true }), n(10, 9, 2, 0.75, { stacc: true }), d(12, 4, 7, 4, 0.85)],
            variants: [[d(0, 4, 9, 2, 0.85), d(2, 4, 9, 2, 0.5), d(4, 2, 7, 4, 0.9, { up: 2 }), d(8, 4, 7, 2, 0.85), d(10, 4, 7, 2, 0.5), d(12, 0, 4, 4, 0.85)],
                       [s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 1, 0.8, { stacc: true }), n(3, 4, 1, 0.3, { ghost: true }), d(4, 2, 7, 4, 0.9, { up: 2 }), s(8, 2, 0.85, 'fifth', 'mute'), n(10, 9, 1, 0.8, { stacc: true }), n(11, 9, 1, 0.3, { ghost: true }), d(12, 4, 7, 4, 0.85)]],
            fills: [[n(0, 12, 1, 0.9, { stacc: true }), n(1, 12, 1, 0.3, { ghost: true }), n(2, 9, 1, 0.85, { stacc: true }), n(3, 9, 1, 0.3, { ghost: true }), n(4, 7, 2, 0.85, { stacc: true }), h(6, 3, 4, 2, 0.85), d(8, 2, 7, 4, 0.9, { up: 2 }), n(12, 0, 4, 0.85)]],
            fillsOnChange: [[d(0, 2, 7, 4, 0.9, { up: 2 }), n(4, 7, 2, 0.8, { stacc: true }), n(6, 9, 2, 0.8, { stacc: true }), n(8, 12, 2, 0.85, { stacc: true }), n(10, 9, 2, 0.75), nx(12, 5, 2, 0.75), nx(14, 4, 2, 0.85, { stacc: true })]],
            fillsOnStay: [[n(0, 0, 1, 0.9, { stacc: true }), n(1, 0, 1, 0.3, { ghost: true }), n(2, 2, 1, 0.8, { stacc: true }), n(3, 2, 1, 0.3, { ghost: true }), h(4, 3, 4, 2, 0.85), n(6, 7, 2, 0.8, { stacc: true }), d(8, 2, 7, 4, 0.9, { up: 2 }), d(12, 4, 7, 4, 0.85)]],
          },
        ],
      },
      {
        label: 'Outlaw', inspired: 'Waylon Jennings ("Good Hearted Woman", "Luckenbach, Texas")', style: 'country',
        progression: ['E', 'E', 'A', 'E', 'B7', 'E'], key: 'E', tempo: 108,
        why: `<p>The "Waylon beat": kick on every beat, the snare on 2 and 4, and the guitar playing a palm-muted "chicka" on the low strings — root on the beat, the muted chord on the sixteenths after it — through a phaser (an engine tone proposal). Bass on root and 5th.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [4, 12], snareVel: 0.85, hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 4, off: 7, dur: 3.6, vel: 0.75 }, { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 12, off: 7, dur: 3.6, vel: 0.75 }], bassApproach: true, chord: [{ slot: 2, dur: 1.5, vel: 0.5 }, { slot: 6, dur: 1.5, vel: 0.5 }, { slot: 10, dur: 1.5, vel: 0.5 }, { slot: 14, dur: 1.5, vel: 0.5 }] },
        parts: [
          {
            name: 'Chicka',
            why: 'Root on the beat, the muted low chord on the two sixteenths after it — "boom chicka" every beat — and the walk-up into changes on the low string.',
            figure: [s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), s(8, 1, 0.9, 'bass', 'mute'), s(10, 1, 0.55, 'low', 'mute'), s(11, 1, 0.45, 'low', 'mute'), s(12, 1, 0.8, 'fifth', 'mute'), s(14, 1, 0.55, 'low', 'mute'), s(15, 1, 0.45, 'low', 'mute')],
            variants: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 4, 0.85, 'low'), s(8, 2, 0.9, 'bass', 'mute'), s(10, 1, 0.55, 'low', 'mute'), s(11, 1, 0.45, 'low', 'mute'), s(12, 4, 0.85, 'low')],
                       [n(0, 0, 1, 0.9, { pm: true }), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), n(4, 7, 1, 0.8, { pm: true }), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), n(8, 0, 1, 0.9, { pm: true }), s(10, 1, 0.55, 'low', 'mute'), s(11, 1, 0.45, 'low', 'mute'), n(12, 10, 1, 0.8, { pm: true }), n(14, 12, 2, 0.8)]],
            fills: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), n(8, 0, 2, 0.85, { pm: true }), h(10, 3, 4, 2, 0.85), n(12, 7, 2, 0.8, { pm: true }), n(14, 10, 2, 0.8, { pm: true })]],
            fillsOnChange: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), nx(8, -5, 2, 0.9, { pm: true }), nx(10, -3, 2, 0.75, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), s(8, 1, 0.9, 'bass', 'mute'), s(10, 1, 0.55, 'low', 'mute'), s(11, 1, 0.45, 'low', 'mute'), d(12, 4, 7, 4, 0.8)]],
          },
        ],
      },
      {
        label: 'Country rock', inspired: 'the Eagles ("Take It Easy"), Tom Petty, the Byrds\' "Sweetheart" era', style: 'country',
        progression: ['G', 'D', 'C', 'G', 'Em', 'D'], key: 'G', tempo: 118,
        why: `<p>Mid-tempo on a backbeat, the acoustic strumming with the bass note leading each chord and the top strings answering; the bass walks up into changes; the electric adds hammered double stops. The strum is bass-note-then-chord, not the whole grip every time.</p>`,
        band: { grid: 16, kick: [0, 6, 8], snare: [4, 12], snareVel: 0.8, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 6, off: 7, dur: 1.6, vel: 0.65 }, { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 14, off: 12, dur: 1.6, vel: 0.65 }], bassApproach: true,
                chord: [{ slot: 0, dur: 3.6, vel: 0.55 }, { slot: 6, dur: 2, vel: 0.45 }, { slot: 8, dur: 3.6, vel: 0.5 }, { slot: 14, dur: 2, vel: 0.45 }] },
        parts: [
          {
            name: 'Bass-note strum',
            why: 'The root alone on one, the chord on the and; the 5th on three, the chord after — the acoustic\'s way of leading each chord with its bass note. The change fill walks up; the stay fill hammers the double stop.',
            figure: [s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), s(4, 2, 0.6, 'high'), s(6, 2, 0.55, 'high'), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), s(12, 2, 0.6, 'high'), s(14, 2, 0.55, 'high')],
            variants: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), s(6, 2, 0.6, 'high'), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), s(12, 2, 0.55, 'high', 'mute'), s(14, 2, 0.6, 'high')],
                       [s(0, 4, 0.9), s(4, 2, 0.55, 'high', 'mute'), s(6, 2, 0.65, 'high'), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), s(12, 2, 0.55, 'high', 'mute'), s(14, 2, 0.65, 'high')]],
            fills: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), h(4, 2, 4, 2, 0.8), d(6, 4, 7, 2, 0.75), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), h(12, 3, 4, 2, 0.8), n(14, 0, 2, 0.75)]],
            fillsOnChange: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), s(4, 2, 0.6, 'high'), s(6, 2, 0.55, 'high'), nx(8, -5, 2, 0.9), nx(10, -3, 2, 0.7), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
            fillsOnStay: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), d(4, 2, 7, 2, 0.8, { up: 2 }), d(6, 4, 7, 2, 0.6), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), d(12, 4, 9, 2, 0.75), d(14, 4, 7, 2, 0.7)]],
          },
        ],
      },
      {
        label: 'Hot country', inspired: 'Brad Paisley, Brent Mason, Vince Gill', style: 'country',
        progression: ['G', 'C', 'G', 'D', 'C', 'G'], key: 'G', tempo: 124,
        why: `<p>Sixteenth-note hybrid picking: banjo rolls across three strings — root, 5th, octave, 5th in a 3-3-2 pattern — chicken-picked runs with the ♭3 hammered and pulled, and the open-string pull-off run down to the root. Fast, clean, precise. Needs staccato, ghost notes, and the tempo to be honest about how hard it is.</p>`,
        band: { grid: 16, kick: [0, 6, 8], snare: [4, 12], snareVel: 0.85, ghost: [7, 15], hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 4, off: 7, dur: 3.6, vel: 0.75 }, { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 12, off: 7, dur: 3.6, vel: 0.75 }], bassApproach: true,
                chord: [{ slot: 2, dur: 1.5, vel: 0.45 }, { slot: 6, dur: 1.5, vel: 0.45 }, { slot: 10, dur: 1.5, vel: 0.45 }, { slot: 14, dur: 1.5, vel: 0.45 }], slapback: true },
        parts: [
          {
            name: 'Banjo rolls',
            why: 'Root, 5th, octave in threes across the sixteenths — the roll crosses the beat every other time — and a pull-off run down to the root on four.',
            figure: [n(0, 0, 1, 0.85), n(1, 7, 1, 0.6), n(2, 12, 1, 0.7), n(3, 0, 1, 0.8), n(4, 7, 1, 0.6), n(5, 12, 1, 0.7), n(6, 0, 1, 0.8), n(7, 12, 1, 0.65), n(8, 4, 1, 0.85), n(9, 7, 1, 0.6), n(10, 12, 1, 0.7), n(11, 4, 1, 0.8), n(12, 7, 1, 0.6), n(13, 12, 1, 0.7), p(14, 4, 2, 1, 0.8), n(15, 0, 1, 0.75)],
            variants: [[n(0, 0, 1, 0.85), n(1, 4, 1, 0.6), n(2, 7, 1, 0.7), n(3, 12, 1, 0.8), n(4, 7, 1, 0.6), n(5, 4, 1, 0.65), n(6, 0, 1, 0.8), n(7, 4, 1, 0.6), n(8, 7, 1, 0.75), n(9, 12, 1, 0.8), n(10, 7, 1, 0.6), n(11, 4, 1, 0.65), h(12, 3, 4, 2, 0.85), n(14, 7, 1, 0.75), n(15, 9, 1, 0.7)],
                       [s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 1, 0.8, { stacc: true }), n(3, 4, 1, 0.3, { ghost: true }), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 7, 1, 0.8, { stacc: true }), n(7, 7, 1, 0.3, { ghost: true }), n(8, 9, 1, 0.85), n(9, 12, 1, 0.7), n(10, 9, 1, 0.75), n(11, 7, 1, 0.7), n(12, 4, 2, 0.85), n(14, 2, 1, 0.75), n(15, 0, 1, 0.8)]],
            fills: [[n(0, 12, 1, 0.9), n(1, 9, 1, 0.75), n(2, 7, 1, 0.8), n(3, 4, 1, 0.75), n(4, 2, 1, 0.8), p(5, 4, 2, 1, 0.75), n(6, 0, 1, 0.8), n(7, 7, 1, 0.7), h(8, 3, 4, 2, 0.85), n(10, 7, 1, 0.8), n(11, 9, 1, 0.75), n(12, 12, 4, 0.9, { vib: true })]],
            fillsOnChange: [[n(0, 0, 1, 0.85), n(1, 7, 1, 0.6), n(2, 12, 1, 0.7), n(3, 0, 1, 0.8), n(4, 7, 1, 0.6), n(5, 12, 1, 0.7), n(6, 0, 1, 0.8), n(7, 12, 1, 0.65), n(8, 9, 2, 0.85), n(10, 7, 2, 0.8), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
            fillsOnStay: [[n(0, 4, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), n(2, 7, 1, 0.85, { stacc: true }), n(3, 7, 1, 0.3, { ghost: true }), n(4, 9, 1, 0.85, { stacc: true }), n(5, 9, 1, 0.3, { ghost: true }), n(6, 12, 2, 0.85), n(8, 9, 1, 0.8), n(9, 7, 1, 0.75), n(10, 4, 1, 0.8), n(11, 2, 1, 0.75), n(12, 0, 4, 0.85)]],
          },
        ],
      },
      {
        label: 'Country waltz', inspired: '"Tennessee Waltz", "Waltz Across Texas", Hank Williams\' waltzes', style: 'country',
        progression: ['C', 'C', 'F', 'C', 'G7', 'C'], key: 'C', tempo: 96,
        why: `<p>Three beats to the bar — the first time signature the app doesn't have. The bass note on 1, the chord on 2 and 3, a walk-up on the last bar before a change; fills in the pentatonic with the ♭3-to-3. Needs 3/4 in the engine (beats per bar); here the page's player does it.</p>`,
        band: { grid: 12, beats: 3, kick: [0], snare: [4, 8], snareVel: 0.55, hat: [0, 2, 4, 6, 8, 10], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 8, off: 7, dur: 3, vel: 0.6 }], bassApproach: true, chord: [{ slot: 4, dur: 3, vel: 0.6 }, { slot: 8, dur: 3, vel: 0.55 }] },
        parts: [
          {
            name: 'Bass, chord, chord',
            why: 'Root on one (the 5th alternating on the next bar), the chord on two and three on the top strings.',
            figure: [s(0, 4, 0.9, 'bass'), s(4, 3, 0.65, 'high'), s(8, 3, 0.65, 'high')],
            variants: [[s(0, 4, 0.9, 'fifth'), s(4, 3, 0.65, 'high'), s(8, 3, 0.65, 'high')], [s(0, 4, 0.9, 'bass'), s(4, 2, 0.65, 'high'), s(6, 2, 0.45, 'high'), s(8, 2, 0.65, 'high'), s(10, 2, 0.45, 'high')]],
            fills: [[s(0, 4, 0.9, 'bass'), n(4, 2, 2, 0.75), h(6, 3, 4, 2, 0.8), n(8, 7, 2, 0.8), n(10, 9, 2, 0.75)]],
            fillsOnChange: [[s(0, 4, 0.9, 'bass'), s(4, 2, 0.65, 'high'), nx(6, -4, 2, 0.8), nx(8, -2, 2, 0.8), nx(10, -1, 2, 0.85)]],
            fillsOnStay: [[s(0, 4, 0.9, 'bass'), s(4, 3, 0.65, 'high'), n(8, 4, 2, 0.75), n(10, 2, 2, 0.75)]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'bluegrass', name: 'Bluegrass',
    research: `
      <p><b>What the players actually do.</b> Boom-chuck at speed: the bass note on 1 and 3 (alternating root and 5th), the "chuck" on the treble strings on 2 and 4 — Lester Flatt, Jimmy Martin, Del McCoury — with bass runs on the low strings connecting every change (the walk-up G–A–B into C, the walk-down into D) and the G-run to end a phrase. Doc Watson and Clarence White crosspick: sixteenths across three strings in a 3-3-2 pattern. Tony Rice turns the chuck into a percussive chop and syncopates the runs. No drums; the mandolin chops on 2 and 4 and the bass plays root–5th.</p>
      <p><b>What the app has now, and what is off about it.</b> The bass-strum part is right in outline but has no bass runs between chords — the defining move — no crosspicking, and the chuck is a full chord rather than a short chop on the treble strings.</p>`,
    existing: [
      {
        style: 'bluegrass', label: 'Bluegrass',
        verdict: `<p>Band: the mandolin chop on 2 and 4 as a short muted rim-like hit, the bass approaching changes. Guitar: the chuck shortened to the treble strings and muted; bass runs into every change (walk-up or walk-down chosen by whether the next root is above or below — here: a walk-up); the G-run at phrase ends; crosspicking as a new part; Rice-style chop rhythm.</p>`,
        band: { rim: [4, 12], bassApproach: true },
        parts: [
          {
            name: 'Boom-chuck with bass runs', replaces: 'Bass strum bass strum',
            why: 'Root, chuck, 5th, chuck — the chuck short and on the treble strings — and the run in the bass on the last two beats before every change. The turnaround is the G-run.',
            figure: [s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), s(8, 3, 0.85, 'fifth'), s(12, 1.5, 0.7, 'high', 'mute')],
            variants: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), s(6, 1, 0.4, 'high'), s(8, 3, 0.85, 'fifth'), s(12, 1.5, 0.7, 'high', 'mute'), s(14, 1, 0.4, 'high')],
                       [s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), n(8, 7, 2, 0.85, { pm: true }), n(10, 9, 2, 0.8, { pm: true }), n(12, 12, 2, 0.85), n(14, 9, 2, 0.75)]],
            fills: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), n(8, 0, 2, 0.85), n(10, 2, 2, 0.8), h(12, 3, 4, 2, 0.85), n(14, 7, 2, 0.8)]],
            fillsOnChange: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), nx(8, -5, 2, 0.9, { pm: true }), nx(10, -3, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })],
                            [s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), nx(8, 4, 2, 0.85, { pm: true }), nx(10, 2, 2, 0.8, { pm: true }), nx(12, 0, 4, 0.9, { pm: true })]],
            fillsOnStay: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), s(8, 3, 0.85, 'fifth'), n(12, 7, 1, 0.8), n(13, 9, 1, 0.75), n(14, 12, 2, 0.85)]],
            turnaround: [n(0, 0, 2, 0.9), n(2, 2, 2, 0.8), h(4, 3, 4, 4, 0.9), n(8, 7, 2, 0.85), n(10, 9, 2, 0.85), n(12, 12, 2, 0.9), nx(14, 0, 2, 0.9)],
          },
          {
            name: 'Crosspicking (Watson/White-inspired)',
            why: 'Sixteenths across three strings in threes — root, 5th, octave; 3rd, 5th, octave — the pattern crossing the beat and coming back round on four.',
            figure: [n(0, 0, 1, 0.85), n(1, 7, 1, 0.6), n(2, 12, 1, 0.7), n(3, 0, 1, 0.8), n(4, 7, 1, 0.6), n(5, 12, 1, 0.7), n(6, 4, 1, 0.8), n(7, 12, 1, 0.65), n(8, 4, 1, 0.85), n(9, 7, 1, 0.6), n(10, 12, 1, 0.7), n(11, 4, 1, 0.8), n(12, 7, 1, 0.6), n(13, 12, 1, 0.7), n(14, 0, 1, 0.8), n(15, 7, 1, 0.65)],
            variants: [[n(0, 0, 1, 0.85), n(1, 4, 1, 0.6), n(2, 7, 1, 0.7), n(3, 0, 1, 0.8), n(4, 4, 1, 0.6), n(5, 7, 1, 0.7), n(6, 12, 1, 0.8), n(7, 7, 1, 0.65), n(8, 0, 1, 0.85), n(9, 4, 1, 0.6), n(10, 7, 1, 0.7), n(11, 12, 1, 0.8), n(12, 7, 1, 0.6), n(13, 4, 1, 0.7), n(14, 0, 1, 0.8), n(15, 4, 1, 0.65)],
                       [s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), n(8, 0, 1, 0.85), n(9, 7, 1, 0.6), n(10, 12, 1, 0.7), n(11, 0, 1, 0.8), n(12, 7, 1, 0.6), n(13, 12, 1, 0.7), n(14, 4, 1, 0.8), n(15, 7, 1, 0.65)]],
            fills: [[n(0, 12, 1, 0.9), n(1, 9, 1, 0.75), n(2, 7, 1, 0.8), n(3, 4, 1, 0.75), n(4, 2, 1, 0.8), n(5, 0, 1, 0.8), n(6, 2, 1, 0.75), h(7, 3, 4, 1, 0.85), n(8, 7, 2, 0.85), n(10, 9, 2, 0.8), n(12, 12, 4, 0.9)]],
            fillsOnChange: [[n(0, 0, 1, 0.85), n(1, 7, 1, 0.6), n(2, 12, 1, 0.7), n(3, 0, 1, 0.8), n(4, 7, 1, 0.6), n(5, 12, 1, 0.7), n(6, 4, 1, 0.8), n(7, 12, 1, 0.65), nx(8, -5, 2, 0.9, { pm: true }), nx(10, -3, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })]],
            turnaround: [n(0, 0, 2, 0.9), n(2, 2, 2, 0.8), h(4, 3, 4, 4, 0.9), n(8, 7, 2, 0.85), n(10, 9, 2, 0.85), n(12, 12, 2, 0.9), nx(14, 0, 2, 0.9)],
          },
          {
            name: 'Chop rhythm (Rice-inspired)', replaces: 'Runs',
            why: 'The bass note, then a percussive chop — the chord struck and muted at once — on 2 and 4, with syncopated runs in the second half of the bar.',
            figure: [s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), s(8, 2, 0.85, 'fifth'), s(12, 0.8, 0.85, 'high', 'mute')],
            variants: [[s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), s(8, 2, 0.85, 'fifth'), s(11, 0.8, 0.6, 'high', 'mute'), s(12, 0.8, 0.85, 'high', 'mute')],
                       [s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), n(6, 12, 1, 0.8), n(7, 9, 1, 0.75), s(8, 2, 0.85, 'fifth'), n(10, 7, 1, 0.8), n(11, 4, 1, 0.75), s(12, 0.8, 0.85, 'high', 'mute'), n(14, 0, 2, 0.8)]],
            fills: [[s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), n(6, 0, 1, 0.8), n(7, 2, 1, 0.75), h(8, 3, 4, 2, 0.85), n(10, 7, 1, 0.8), n(11, 9, 1, 0.8), n(12, 12, 2, 0.9), n(14, 9, 1, 0.75), n(15, 7, 1, 0.75)]],
            fillsOnChange: [[s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), n(7, 7, 1, 0.8), nx(8, -5, 2, 0.9, { pm: true }), nx(10, -3, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })]],
            turnaround: [n(0, 0, 2, 0.9), n(2, 2, 2, 0.8), h(4, 3, 4, 4, 0.9), n(8, 7, 2, 0.85), n(10, 9, 2, 0.85), n(12, 12, 2, 0.9), nx(14, 0, 2, 0.9)],
          },
        ],
      },
    ],
    additions: [],
  });

  // =========================================================================
  genres.push({
    id: 'jazz', name: 'Jazz',
    research: `
      <p><b>What the players actually do.</b> Freddie Green with Count Basie plays four to the bar on three-note voicings — root, 3rd, 7th, no 5th, on the 6th, 4th and 3rd strings — light, dry, with 2 and 4 leaning and passing chords between the changes. Charlie Christian's lines ("Seven Come Eleven") put the chord tones on the beat with chromatic approaches between; Wes Montgomery plays the same lines in octaves with his thumb; Grant Green brings the blues to it. Jazz comping otherwise is the Charleston figure — one and the "and of 2" — anticipated on the "and of 4" into changes, with rootless voicings. A jazz waltz ("Someday My Prince Will Come", "Bluesette") comps on 1 and the and of 2 in three. Bossa nova is João Gilberto's batida: the thumb in two on 1 and 3, the fingers on a two-bar syncopated pattern, quiet; samba is the same at twice the speed with the partido-alto figure starting on the "and of 4". Gypsy jazz is la pompe — four short chords with a quick up-down brush before 2 and 4 — over arpeggios, 6ths, diminished runs and chromatic enclosures. A jazz ballad is brushes in 12/8, chord-melody with the 9th on top, and space.</p>
      <p><b>What the app has now, and what is off about it.</b> Swing's four-to-the-bar uses the grip's lowest three strings — usually root, 5th, root — not the root-3rd-7th shell that makes it Freddie Green. No octaves, no passing chords, no anticipation into changes in the comp. The bossa is one bar where the batida is two. The gypsy pompe has the brush but no diminished or ♭9 vocabulary. There is no waltz, no bebop tempo, no ballad, no samba, no Latin clave.</p>`,
    existing: [
      {
        style: 'jazz', label: 'Swing',
        verdict: `<p>Band: the comp anticipates every change on the "and of 4", the bass walks with a chromatic approach into changes (it did the walk; now the approach is guaranteed), a light snare comp on the "and of 2" every other bar. Guitar: four to the bar on shell voicings (root–3–7); lines in octaves; the Charleston with anticipations. Realised with the modal palette so the V7's ♭9 is available. Needs shell voicings, chord slides, vibrato.</p>`,
        entry: { scaleTheory: 'modal' },
        band: { compAnticipate: true, bassApproach: true, ghost: [5], fill: { snare: [6, 8, 9, 11], kick: [0] } },
        parts: [
          {
            name: 'Four to the bar (Green-inspired)', replaces: 'Four to the bar',
            why: 'Root, 3rd, 7th on the three low strings, a short chord on every beat, 2 and 4 leaning, a chromatic passing chord (the shell slid from a half-step above) on the "and of 4" into a change.',
            figure: [s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), s(6, 1.2, 0.6, 'shell'), s(9, 1.2, 0.78, 'shell')],
            variants: [[s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), s(6, 1.2, 0.6, 'shell'), s(8, 0.5, 0.35, 'shell'), s(9, 1.2, 0.78, 'shell')],
                       [s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), s(6, 1.2, 0.6, 'shell'), s(9, 1.2, 0.78, 'shell', null, { chordSlide: 1 })]],
            fills: [[s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), n(6, 4, 1.6, 0.8), n(8, 5, 0.8, 0.6), n(9, 7, 1.6, 0.8), n(11, 9, 0.8, 0.65)]],
            fillsOnChange: [[s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), s(6, 1.2, 0.6, 'shell'), s(9, 1.2, 0.78, 'shell'), nx(11, 0, 0.8, 0.7, { chordSlide: -1 })],
                            [s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), n(6, 10, 1.6, 0.8), n(8, 9, 0.8, 0.6), nx(9, 5, 1.6, 0.7), nx(11, 4, 0.8, 0.8)]],
            fillsOnStay: [[s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), s(6, 1.2, 0.6, 'shell', null, { chordSlide: 1 }), s(9, 1.2, 0.78, 'shell')]],
          },
          {
            name: 'Octaves (Montgomery-inspired)',
            why: 'The line in octaves, played with the thumb: 3rd, 5th, 7th up, the enclosure round the next root at the change. Needs octave double stops the engine already has; the thumb sound is a tone proposal.',
            figure: [d(0, 4, 16, 1.6, 0.8), d(2, 5, 17, 0.8, 0.6), d(3, 7, 19, 1.6, 0.8), d(6, 10, 22, 2.4, 0.8), d(9, 12, 24, 2.4, 0.8)],
            variants: [[d(0, 0, 12, 1.6, 0.8), d(2, 2, 14, 0.8, 0.6), d(3, 4, 16, 1.6, 0.8), d(5, 5, 17, 0.8, 0.6), d(6, 7, 19, 2.4, 0.85), d(9, 4, 16, 2.4, 0.8)],
                       [s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.78, 'shell'), d(6, 7, 19, 1.6, 0.8), d(8, 9, 21, 0.8, 0.6), d(9, 10, 22, 2.4, 0.85)]],
            fills: [[d(0, 12, 24, 1.6, 0.85), d(2, 10, 22, 0.8, 0.6), d(3, 9, 21, 1.6, 0.8), d(5, 7, 19, 0.8, 0.6), d(6, 5, 17, 1.6, 0.8), d(8, 4, 16, 0.8, 0.6), d(9, 0, 12, 2.4, 0.85, { vib: true })]],
            fillsOnChange: [[d(0, 7, 19, 1.6, 0.8), d(2, 9, 21, 0.8, 0.6), d(3, 10, 22, 1.6, 0.8), d(5, 12, 24, 0.8, 0.65), d(6, 10, 22, 1.6, 0.8), nx(8, 1, 0.8, 0.6), nx(9, -1, 1.6, 0.7), nx(11, 0, 0.8, 0.85)]],
            fillsOnStay: [[d(0, 4, 16, 2.4, 0.8), d(3, 5, 17, 0.8, 0.6), d(4, 4, 16, 0.8, 0.6), d(5, 2, 14, 0.8, 0.6), d(6, 0, 12, 3, 0.85, { vib: true }), s(9, 1.2, 0.7, 'shell')]],
          },
          {
            name: 'Charleston, anticipated', replaces: 'Charleston comp',
            why: 'One and the and of two — and, before a change, the next chord on the "and of 4", which is where the comp actually moves. Rootless shells on the top strings would be the next step (an engine proposal).',
            figure: [s(0, 2, 0.8, 'high'), s(5, 4, 0.7, 'high')],
            variants: [[s(5, 3, 0.75, 'high'), s(11, 3, 0.7, 'high')], [s(2, 3, 0.7, 'high'), s(8, 3, 0.7, 'high')]],
            fills: [[n(0, 7, 1.6, 0.85), n(2, 9, 0.8, 0.65), n(3, 10, 1.6, 0.8), n(5, 12, 0.8, 0.7), n(6, 10, 1.6, 0.8), n(8, 9, 0.8, 0.65), n(9, 7, 2.4, 0.8, { vib: true })]],
            fillsOnChange: [[s(0, 2, 0.8, 'high'), s(5, 4, 0.7, 'high'), nx(11, 0, 1, 0.75, { chordSlide: 1 })],
                            [s(0, 2, 0.8, 'high'), n(3, 4, 1.6, 0.8), n(5, 5, 0.8, 0.6), n(6, 7, 1.6, 0.8), n(8, 10, 0.8, 0.65), nx(9, 3, 1.6, 0.7), nx(11, 4, 0.8, 0.8)]],
            fillsOnStay: [[s(0, 2, 0.8, 'high'), s(5, 2, 0.7, 'high'), s(8, 0.5, 0.35, 'high'), s(9, 3, 0.7, 'high', null, { chordSlide: -1 })]],
          },
        ],
      },
      {
        style: 'jazz', label: 'Bossa nova',
        verdict: `<p>Band: the rim click plays the bossa clave (1, the and of 2, 4 | 2, the and of 3), the hat on eighths; the bass on 1 and the and of 2 with the 5th. Guitar: the batida written as the two-bar figure it is (the second bar is the variant), the thumb in two, the fingers on the syncopations; the 9th on top of the chords. Realised with the modal palette.</p>`,
        entry: { scaleTheory: 'modal' },
        band: { rim: [0, 6, 12, 4, 10], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [{ slot: 0, off: 0, dur: 5, vel: 0.85 }, { slot: 6, off: 7, dur: 2, vel: 0.6 }, { slot: 8, off: 7, dur: 5, vel: 0.75 }, { slot: 14, off: 0, dur: 2, vel: 0.6 }] },
        parts: [
          {
            name: 'The batida, two bars', replaces: 'Thumb and fingers',
            why: 'Bar one: thumb on 1 and 3, chords with it on 1, on the and of 2, and on 4. Bar two: thumb again, chords on 2 and the and of 3. The 9th sits on top. This is the pattern João Gilberto invented, not a one-bar approximation.',
            figure: [s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'bass'), s(12, 2, 0.55, 'high', null, { add: 14 })],
            variants: [[s(0, 4, 0.85, 'bass'), s(4, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'bass'), s(10, 2, 0.55, 'high', null, { add: 14 }), s(14, 2, 0.5, 'high', null, { add: 14 })],
                       [s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'fifth'), s(12, 2, 0.55, 'high', null, { add: 14 }), s(14, 2, 0.4, 'high', null, { add: 14 })]],
            fills: [[s(0, 4, 0.85, 'bass'), n(4, 4, 2, 0.65), n(6, 5, 2, 0.6), n(8, 7, 2, 0.7), n(10, 9, 2, 0.6), n(12, 11, 2, 0.65), n(14, 14, 2, 0.65)]],
            fillsOnChange: [[s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'bass'), n(12, 9, 2, 0.6), nx(14, 4, 2, 0.7)]],
            fillsOnStay: [[s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'bass'), sl(12, 3, 4, 4, 0.7)]],
          },
        ],
      },
      {
        style: 'gypsy', label: 'Gypsy jazz',
        verdict: `<p>Band: unchanged except a slightly harder 2 and 4 in the comp. Guitar: la pompe stays; the lines get the vocabulary — the diminished arpeggio off the 3rd of a dominant chord (3, 5, ♭7, ♭9), the 6th, chromatic enclosures. Realised with the modal palette so the ♭9 on the V7 exists.</p>`,
        entry: { scaleTheory: 'modal' },
        band: { chord: [{ slot: 0, dur: 1.2, vel: 0.45 }, { slot: 2, dur: 0.6, vel: 0.3 }, { slot: 3, dur: 1, vel: 0.85 }, { slot: 6, dur: 1.2, vel: 0.45 }, { slot: 8, dur: 0.6, vel: 0.3 }, { slot: 9, dur: 1, vel: 0.85 }] },
        parts: [
          {
            name: 'Pompe and diminished runs', replaces: 'Pompe and arpeggio',
            why: 'Two beats of pompe, then the diminished arpeggio — 3rd, 5th, ♭7, ♭9 — that a dominant chord asks for, resolving to the next root; the 6th enclosing the 5th on the stay fill.',
            figure: [s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), n(6, 4, 0.8, 0.85), n(7, 7, 0.8, 0.8), n(8, 10, 0.8, 0.85), n(9, 13, 0.8, 0.8), n(10, 10, 0.8, 0.8), n(11, 7, 0.8, 0.75)],
            variants: [[n(0, 0, 0.8, 0.85), n(1, 4, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 9, 0.8, 0.8), n(4, 12, 0.8, 0.85), n(5, 9, 0.8, 0.75), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)],
                       [s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)]],
            fills: [[n(0, 9, 0.8, 0.8), n(1, 7, 0.8, 0.8), n(2, 6, 0.8, 0.65), n(3, 7, 1.6, 0.85), n(5, 4, 0.8, 0.75), n(6, 2, 1.6, 0.8), n(8, 0, 0.8, 0.75), n(9, 12, 2.4, 0.85, { vib: true })]],
            fillsOnChange: [[s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 4, 0.8, 0.85), n(7, 7, 0.8, 0.8), n(8, 10, 0.8, 0.85), n(9, 13, 0.8, 0.8), nx(10, 1, 0.8, 0.7), nx(11, 0, 0.8, 0.85)]],
            fillsOnStay: [[s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), n(6, 12, 0.8, 0.85), n(7, 9, 0.8, 0.75), n(8, 7, 0.8, 0.8), n(9, 4, 0.8, 0.8), n(10, 5, 0.8, 0.7), n(11, 4, 0.8, 0.85)]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Jazz waltz', inspired: 'Bill Evans ("Someday My Prince Will Come"), "Bluesette", "Alice in Wonderland"', style: 'jazz',
        progression: ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7'], key: 'C', tempo: 150, scaleTheory: 'modal',
        why: `<p>Three swung beats to the bar: the ride on all three, the snare on 2, the bass in quarters, the comp on 1 and the and of 2 — or on 2 alone. Needs 3/4 in the engine.</p>`,
        band: { grid: 9, beats: 3, kick: [0], kickVel: 0.3, snare: [3], snareVel: 0.5, hat: [3], ride: [0, 2, 3, 5, 6, 8], voice: 'jazz',
                bass: [{ slot: 0, walk: 0, dur: 2.6, vel: 0.9 }, { slot: 3, walk: 2, dur: 2.6, vel: 0.75 }, { slot: 6, walk: 3, dur: 2.6, vel: 0.75 }],
                chord: [{ slot: 0, dur: 1.5, vel: 0.5 }, { slot: 5, dur: 2.5, vel: 0.55 }], compAnticipate: true },
        parts: [
          {
            name: 'Comp in three',
            why: 'Shells on one and the and of two; on two alone in the variant; lines in swung eighths to the next chord\'s 3rd.',
            figure: [s(0, 1.5, 0.7, 'shell'), s(5, 3, 0.65, 'shell')],
            variants: [[s(3, 2, 0.75, 'shell')], [s(0, 1.2, 0.6, 'shell'), s(3, 1.2, 0.75, 'shell'), s(6, 1.2, 0.6, 'shell')]],
            fills: [[n(0, 4, 1.6, 0.8), n(2, 5, 0.8, 0.6), n(3, 7, 1.6, 0.8), n(5, 9, 0.8, 0.65), n(6, 10, 1.6, 0.8), n(8, 12, 0.8, 0.7)]],
            fillsOnChange: [[s(0, 1.5, 0.7, 'shell'), n(3, 10, 1.6, 0.8), n(5, 9, 0.8, 0.6), nx(6, 5, 1.6, 0.7), nx(8, 4, 0.8, 0.8)]],
            fillsOnStay: [[s(0, 1.5, 0.7, 'shell'), n(3, 7, 1.6, 0.8), n(5, 9, 0.8, 0.65), n(6, 12, 3, 0.8, { vib: true })]],
          },
        ],
      },
      {
        label: 'Bebop', inspired: 'Charlie Christian, Charlie Parker\'s rhythm sections, Grant Green', style: 'jazz',
        progression: ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7'], key: 'C', tempo: 210, scaleTheory: 'modal',
        why: `<p>Up-tempo: the ride carries it, the bass walks in quarters with an approach into every change, the comp is sparse and anticipated. The guitar plays eighth-note lines built so the chord tones land on the beat and the chromatic notes between them — the bebop scale — with enclosures round the next root.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.25, snare: [], ghost: [5, 11], hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'jazz',
                bass: [{ slot: 0, walk: 0, dur: 2.6, vel: 0.9 }, { slot: 3, walk: 2, dur: 2.6, vel: 0.78 }, { slot: 6, walk: 1, dur: 2.6, vel: 0.78 }, { slot: 9, walk: 3, dur: 2.6, vel: 0.78 }],
                chord: [{ slot: 5, dur: 2, vel: 0.5 }], compAnticipate: true },
        parts: [
          {
            name: 'Bebop line',
            why: 'Eighths: root, 2, 3, 5 / 7, 9, ♭9 (on the dominant), root — the chord tones on the beats, the passing tones off — and the enclosure of the next root from above and below.',
            figure: [n(0, 0, 0.8, 0.85), n(2, 2, 0.8, 0.7), n(3, 4, 0.8, 0.8), n(5, 7, 0.8, 0.7), n(6, 10, 0.8, 0.8), n(8, 9, 0.8, 0.7), n(9, 7, 0.8, 0.8), n(11, 4, 0.8, 0.7)],
            variants: [[n(0, 4, 0.8, 0.85), n(2, 5, 0.8, 0.7), n(3, 7, 0.8, 0.8), n(5, 9, 0.8, 0.7), n(6, 10, 0.8, 0.8), n(8, 12, 0.8, 0.7), n(9, 13, 0.8, 0.75), n(11, 12, 0.8, 0.7)],
                       [s(5, 2, 0.6, 'shell'), n(9, 7, 0.8, 0.8), n(11, 9, 0.8, 0.7)]],
            fills: [[n(0, 12, 0.8, 0.85), n(2, 11, 0.8, 0.7), n(3, 9, 0.8, 0.8), n(5, 7, 0.8, 0.7), n(6, 5, 0.8, 0.8), n(8, 4, 0.8, 0.7), n(9, 2, 0.8, 0.8), n(11, 0, 0.8, 0.7)]],
            fillsOnChange: [[n(0, 7, 0.8, 0.85), n(2, 9, 0.8, 0.7), n(3, 10, 0.8, 0.8), n(5, 12, 0.8, 0.7), n(6, 10, 0.8, 0.8), nx(8, 1, 0.8, 0.65), nx(9, -1, 0.8, 0.7), nx(11, 0, 0.8, 0.85)]],
            fillsOnStay: [[n(0, 4, 0.8, 0.85), n(2, 3, 0.8, 0.65), n(3, 4, 0.8, 0.8), n(5, 7, 0.8, 0.7), n(6, 9, 0.8, 0.8), n(8, 10, 0.8, 0.7), n(9, 12, 2.4, 0.85, { vib: true })]],
          },
        ],
      },
      {
        label: 'Jazz ballad', inspired: '"Misty", "Body and Soul", Jim Hall with Bill Evans', style: 'jazz',
        progression: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'A7'], key: 'C', tempo: 60, scaleTheory: 'modal',
        why: `<p>Brushes in twelve, the bass in two, and the guitar playing chord-melody: the shell with the 9th on top on one, a single note answering with vibrato, a slide into the 3rd, and nothing hurried.</p>`,
        band: { grid: 12, kick: [0], kickVel: 0.3, snare: [3, 9], snareVel: 0.3, hat: [], ride: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], voice: 'jazz',
                bass: [{ slot: 0, walk: 0, dur: 5.5, vel: 0.85 }, { slot: 6, walk: 1, dur: 5.5, vel: 0.7 }], bassApproach: true, chord: [{ slot: 0, dur: 5, vel: 0.4 }, { slot: 6, dur: 5, vel: 0.35 }] },
        parts: [
          {
            name: 'Chord-melody',
            why: 'The shell with the 9th on one, held; the melody answering on three, slid into and shaken; the change fill steps onto the next 3rd.',
            figure: [s(0, 6, 0.75, 'shell', null, { add: 14 }), sl(6, 3, 4, 3, 0.7, { vib: true }), n(9, 7, 3, 0.65)],
            variants: [[s(0, 5, 0.75, 'shell', null, { add: 14 }), n(6, 12, 3, 0.7, { vib: true }), n(9, 11, 1.5, 0.6), n(10.5, 9, 1.5, 0.6)], [n(0, 0, 3, 0.7, { pm: true }), s(3, 3, 0.65, 'shell', null, { add: 14 }), n(6, 7, 3, 0.7, { vib: true }), s(9, 3, 0.6, 'shell', null, { add: 14, chordSlide: 1 })]],
            fills: [[n(0, 12, 3, 0.75, { vib: true }), n(3, 9, 1.5, 0.65), n(4.5, 7, 1.5, 0.65), n(6, 4, 3, 0.7, { vib: true }), n(9, 2, 1.5, 0.6), n(10.5, 0, 1.5, 0.65)]],
            fillsOnChange: [[s(0, 6, 0.75, 'shell', null, { add: 14 }), n(6, 7, 1.5, 0.65), n(7.5, 9, 1.5, 0.65), nx(9, 5, 1.5, 0.6), nx(10.5, 4, 1.5, 0.75, { vib: true })]],
            fillsOnStay: [[s(0, 3, 0.75, 'shell', null, { add: 14 }), s(3, 3, 0.5, 'shell', null, { chordSlide: 1, add: 14 }), n(6, 9, 3, 0.7, { vib: true }), n(9, 7, 3, 0.65)]],
          },
        ],
      },
      {
        label: 'Samba', inspired: 'partido alto — Jorge Ben, Baden Powell, Toninho Horta', style: 'jazz',
        progression: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7', 'B7'], key: 'G', tempo: 104, scaleTheory: 'modal',
        why: `<p>The bossa at twice the speed with the surdo under it: the bass on 1 and the and of 2, the chords in the partido-alto figure that starts on the "and of 4" and never lands on the one. Sixteenths swung a touch.</p>`,
        band: { grid: 16, kick: [0, 6, 8, 14], kickVel: 0.5, snare: [], rim: [0, 3, 6, 10, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], swing: 0.25, voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 6, off: 7, dur: 2, vel: 0.7 }, { slot: 8, off: 0, dur: 5, vel: 0.85 }, { slot: 14, off: 7, dur: 2, vel: 0.7 }],
                chord: [{ slot: 3, dur: 2, vel: 0.5 }, { slot: 6, dur: 2, vel: 0.5 }, { slot: 10, dur: 2, vel: 0.5 }, { slot: 14, dur: 2, vel: 0.5 }] },
        parts: [
          {
            name: 'Partido alto',
            why: 'Thumb on 1 and 3; the chords on the "a of 1", the and of 2, the "a of 3", and the and of 4 — off the one, always. The second bar is its answer.',
            figure: [s(0, 3, 0.8, 'bass'), s(3, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 3, 0.75, 'bass'), s(11, 2, 0.55, 'high', null, { add: 14 }), s(14, 2, 0.55, 'high', null, { add: 14 })],
            variants: [[s(0, 3, 0.8, 'bass'), s(2, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 3, 0.75, 'fifth'), s(10, 2, 0.55, 'high', null, { add: 14 }), s(14, 2, 0.5, 'high', null, { add: 14 })],
                       [s(0, 3, 0.8, 'bass'), s(3, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 3, 0.75, 'bass'), n(11, 12, 1, 0.65), n(12, 11, 1, 0.6), n(14, 9, 2, 0.65)]],
            fills: [[s(0, 3, 0.8, 'bass'), n(3, 4, 1, 0.65), n(4, 5, 1, 0.6), n(6, 7, 2, 0.7), n(8, 9, 1, 0.65), n(9, 11, 1, 0.6), n(11, 12, 1, 0.7), n(12, 14, 2, 0.7), n(14, 12, 2, 0.6)]],
            fillsOnChange: [[s(0, 3, 0.8, 'bass'), s(3, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 3, 0.75, 'bass'), n(11, 9, 1, 0.6), nx(12, 5, 1, 0.6), nx(14, 4, 2, 0.7)]],
          },
        ],
      },
      {
        label: 'Son montuno', inspired: 'Arsenio Rodríguez, the Buena Vista Social Club, the tres', style: 'jazz',
        progression: ['C', 'F', 'G7', 'C', 'F', 'G7'], key: 'C', tempo: 96, scaleTheory: 'modal',
        why: `<p>The 2-3 clave on the rim, the bass anticipating every chord (the tumbao lands on the "and of 4" and holds through the one), and the guitar playing a montuno — a two-bar arpeggiated figure in 3rds and 6ths that sits entirely on the offbeats. Nothing on the downbeat, on purpose. Needs bass notes written against the next chord.</p>`,
        band: { grid: 16, kick: [3, 8], kickVel: 0.5, snare: [], rim: [4, 12, 0, 3, 6], hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [{ slot: 6, off: 7, dur: 2, vel: 0.85 }, { slot: 8, off: 0, dur: 6, vel: 0.85 }, { slot: 14, off: 0, dur: 2, vel: 0.85, next: true }],
                chord: [{ slot: 2, dur: 1.5, vel: 0.45 }, { slot: 6, dur: 1.5, vel: 0.45 }, { slot: 10, dur: 1.5, vel: 0.45 }, { slot: 14, dur: 1.5, vel: 0.45 }] },
        parts: [
          {
            name: 'Montuno',
            why: 'Double stops in 3rds and 6ths on the offbeats — the "and of 1", the "a of 2", the and of 3, the and of 4 — arpeggiating the chord up and down over two bars; the last one is the next chord\'s.',
            figure: [d(2, 0, 4, 2, 0.8), d(5, 4, 7, 1, 0.7), d(6, 7, 12, 2, 0.8), d(10, 4, 12, 2, 0.75), d(13, 7, 12, 1, 0.7), nx(14, 0, 2, 0.8, { tech: 'double', iv2: 4 })],
            variants: [[d(2, 7, 12, 2, 0.8), d(5, 4, 9, 1, 0.7), d(6, 0, 7, 2, 0.8), d(10, 4, 7, 2, 0.75), d(13, 0, 4, 1, 0.7), d(14, 4, 9, 2, 0.75)],
                       [n(2, 0, 1, 0.8), n(3, 4, 1, 0.7), n(5, 7, 1, 0.75), n(6, 12, 2, 0.8), n(10, 7, 1, 0.75), n(11, 4, 1, 0.7), n(13, 0, 1, 0.7), n(14, 4, 2, 0.75)]],
            fills: [[d(2, 12, 16, 2, 0.8), d(5, 9, 14, 1, 0.7), d(6, 7, 12, 2, 0.8), d(10, 4, 9, 2, 0.75), d(13, 2, 7, 1, 0.7), d(14, 0, 4, 2, 0.8)]],
            fillsOnChange: [[d(2, 0, 4, 2, 0.8), d(5, 4, 7, 1, 0.7), d(6, 7, 12, 2, 0.8), d(10, 4, 12, 2, 0.75), nx(13, 7, 1, 0.7), nx(14, 4, 2, 0.8)]],
          },
        ],
      },
      {
        label: 'Soul jazz', inspired: 'Grant Green ("Idle Moments" era), George Benson, Lou Donaldson\'s bands', style: 'jazz',
        progression: ['F7', 'F7', 'Bb7', 'Bb7', 'F7', 'C7'], key: 'F', tempo: 112, scaleTheory: 'modal',
        why: `<p>The boogaloo backbeat under jazz harmony: straight eighths, a hard 2 and 4 with ghost 16ths, the bass on a syncopated root–5th–♭7 line, 9th-chord stabs, and single-note lines that put the blues in a bebop shape — with the ♭3 hammered, the 6th, and space.</p>`,
        band: { grid: 16, kick: [0, 7, 8, 10], snare: [4, 12], snareVel: 0.85, ghost: [2, 6, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 3, off: 0, dur: 1, vel: 0.6 }, { slot: 6, off: 7, dur: 2, vel: 0.8 }, { slot: 8, off: 10, dur: 2, vel: 0.8 }, { slot: 12, off: 7, dur: 2, vel: 0.8 }, { slot: 14, off: 9, dur: 2, vel: 0.7 }], bassApproach: true,
                chord: [{ slot: 2, dur: 2, vel: 0.55 }, { slot: 6, dur: 2, vel: 0.6 }, { slot: 12, dur: 2, vel: 0.6 }] },
        parts: [
          {
            name: 'Boogaloo comp and line',
            why: '9th stabs on the and of 1 and on 4, a bluesy line between — root, ♭3 hammered to 3, 5, 6, ♭7 — and the change approached from a semitone above.',
            figure: [s(2, 2, 0.7, 'high', null, { add: 14 }), h(6, 3, 4, 2, 0.8), n(8, 7, 2, 0.75), n(10, 9, 2, 0.7), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 10, 2, 0.7)],
            variants: [[s(2, 2, 0.7, 'high', null, { add: 14 }), s(6, 2, 0.7, 'high', null, { add: 14 }), n(8, 0, 2, 0.8), n(10, 3, 1, 0.7), n(11, 4, 1, 0.75), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 7, 2, 0.7)],
                       [n(0, 0, 2, 0.85), n(2, 0, 1, 0.5), n(3, 10, 1, 0.75), n(4, 12, 2, 0.8), s(6, 2, 0.7, 'high', null, { add: 14 }), n(10, 9, 2, 0.75), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 7, 2, 0.7)]],
            fills: [[n(0, 12, 2, 0.85), n(2, 10, 1, 0.7), n(3, 9, 1, 0.7), n(4, 7, 2, 0.8), h(6, 3, 4, 2, 0.8), n(8, 0, 4, 0.85, { vib: true }), s(12, 2, 0.7, 'high', null, { add: 14 })]],
            fillsOnChange: [[s(2, 2, 0.7, 'high', null, { add: 14 }), n(6, 9, 2, 0.75), n(8, 10, 2, 0.8), n(10, 12, 2, 0.8), nx(12, 5, 2, 0.7), nx(14, 4, 2, 0.8)]],
            fillsOnStay: [[s(2, 2, 0.7, 'high', null, { add: 14 }), s(6, 2, 0.7, 'high', null, { add: 14, chordSlide: 1 }), n(8, 7, 1, 0.75), n(9, 9, 1, 0.75), n(10, 10, 2, 0.8), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 0, 2, 0.75)]],
          },
        ],
      },
    ],
  });
})();
