// Proposals, part 2: rock, rockabilly, psychobilly, surf.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { n, nx, s, g, d, b, h, p, sl, chug } = GT.reviewHelpers;
  const sn = (at, dur, vel, voicing, mute, x) => ({ ...s(at, dur, vel, voicing, mute, x), next: true });
  const genres = GT.review.genres;

  // =========================================================================
  genres.push({
    id: 'rock', name: 'Rock',
    research: `
      <p><b>What the players actually do.</b> Rock rhythm guitar is the low strings and the space between the chords. Chuck Berry ("Johnny B. Goode", "Roll Over Beethoven") plays the boogie in straight eighths — root-5th, root-6th on two strings — and answers it with double stops in 3rds and 4ths slid into and bent. Malcolm Young (AC/DC's "Highway to Hell", "Back in Black") plays open chords and power chords, all downstrokes, hit hard and left to ring, with air between them: the chord on one, the "and of two", and four, nothing on the eighths between. Keith Richards (the Stones' "Brown Sugar", "Start Me Up") hangs a suspended 4th on the chord and pulls it off — the chord with a note that moves. Tom Petty and Mike Campbell ("Refugee", "Free Fallin'") sit mid-tempo on a backbeat with a 12-string jangle; Johnny Marr and the Byrds arpeggiate open chords with the open strings ringing through; Neil Young with Crazy Horse strums four heavy quarters a bar and solos on one note; Lynyrd Skynyrd hammers double stops over a major-pentatonic riff; the Ramones downstroke barre chords on every eighth and never fill; Bo Diddley strums the clave on one chord.</p>
      <p><b>The upper register.</b> Rock rhythm players answer the low chord from the top of the neck. Chuck Berry's double stops sit on the first two strings — the same fret on both (4ths), slid in, the lower note bent and released, staccato — and his breaks live at the 8th to 12th frets in A. Angus Young's fills between Malcolm's chords are the unison bend (the B string bent a tone up to the note held on the E string), the pentatonic riff said an octave up, and a rake into the high root with the shake; the Allman Brothers' and Lynyrd Skynyrd's harmonised lines run major pentatonic from the 6th above the octave; Keith Richards' fragments are 4ths and 3rds on the top two strings. In the parts, this is the octave and above: 17 the 4th, 19 the 5th, 22 the ♭7, 24 the root, with the unison bend written as a double stop whose lower note bends.</p>
      <p><b>What the app has now, and what is off about it.</b> The Rock figure chugs every eighth on three low strings — that is the Ramones, not most rock; the "Rock" default should have Malcolm's space. The fills are single-note pentatonic lines every two bars, where rock rhythm players fill with chord moves (the sus4 pull-off, hammered double stops) and riffs that repeat. Half-time is fine but thin. And the straight boogie that is filed under jump blues belongs here as rock 'n' roll.</p>`,
    existing: [
      {
        style: 'rock', label: 'Rock',
        verdict: `<p>Band: an open hi-hat on the "and of 4", the kick on 1, the "and of 2" and 3 as now, a ghost on the "e of 4"; the bass approaches changes. Guitar: the figure gets Malcolm's space — the chord on one, the and of two, and four, muted eighths between — and the fills are chord moves: the sus4 pulled off, a double stop hammered, a riff said twice. The change fill walks; the stay fill pushes the and of 4.</p>`,
        band: { hatOpen: [14], ghost: [13], bassApproach: true, fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Chords with space (Young-inspired)', replaces: 'Driving eighths',
            why: 'The chord on one, the and of two, and four — downstroked, left to ring — with a muted chug on the eighths that are empty, and nothing on the ones that are not. The sus4 pull-off is the fill.',
            figure: [s(0, 5, 0.95, 'low'), g(5, 1, 0.3, 'low'), s(6, 5, 0.85, 'low'), s(12, 3, 0.9, 'low'), g(15, 1, 0.3, 'low')],
            variants: [
              [s(0, 3, 0.95, 'low'), s(3, 1, 0.5, 'low', 'mute'), s(4, 2, 0.8, 'low'), s(6, 5, 0.85, 'low'), s(12, 3, 0.9), g(15, 1, 0.3, 'low')],
              [s(0, 6, 0.95), s(6, 2, 0.8, 'low'), s(8, 4, 0.85, 'low'), s(12, 2, 0.85, 'low'), s(14, 2, 0.6, 'low', 'mute')],
            ],
            fills: [[s(0, 4, 0.95, 'low'), p(4, 5, 4, 2, 0.8), s(6, 5, 0.85, 'low'), h(12, 3, 4, 2, 0.85), n(14, 0, 2, 0.8)]],
            fillsOnChange: [[s(0, 4, 0.95, 'low'), s(6, 4, 0.85, 'low'), n(10, 10, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })],
                            [s(0, 5, 0.95, 'low'), s(6, 4, 0.85, 'low'), d(10, 0, 7, 2, 0.8), nx(12, 7, 2, 0.8, { pm: true }), nx(14, 7, 2, 0.6, { pm: true })]],
            fillsOnStay: [[s(0, 4, 0.95, 'low'), p(4, 5, 4, 2, 0.8), s(6, 5, 0.85, 'low'), s(12, 2, 0.85, 'low'), s(14, 2, 0.9, 'low')]],
          },
          {
            name: 'Stabs on the and', replaces: 'Stabs on the and',
            why: 'Kept; the fills become riffs that repeat — root, root, ♭7, root — with a rake into the ♭7 and the octave bent (the "unison" sound). The change fill walks up under the next chord.',
            figure: [s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), s(12, 3, 0.85, 'low')],
            variants: [[s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), s(12, 2, 0.85, 'low'), s(14, 1, 0.5, 'high')], [s(0, 3, 0.9), s(4, 2, 0.7, 'low'), s(6, 2, 0.8, 'low'), s(12, 3, 0.85, 'low')]],
            fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 1, 0.5, { pm: true }), n(3, 10, 1, 0.8, { rake: true }), n(4, 12, 2, 0.85), n(6, 0, 2, 0.75, { pm: true }), n(8, 0, 1, 0.5, { pm: true }), n(9, 10, 1, 0.8), n(10, 12, 2, 0.85), b(12, 10, 2, 4, 0.9, { vib: true })]],
            fillsOnChange: [[s(0, 4, 0.9, 'low'), n(6, 10, 2, 0.85, { rake: true }), n(8, 10, 2, 0.5, { pm: true }), n(10, 7, 2, 0.8), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[n(0, 7, 2, 0.85), n(2, 10, 2, 0.8), n(4, 12, 6, 0.9, { vib: true }), n(10, 10, 2, 0.7), s(12, 3, 0.85, 'low')]],
          },
        ],
      },
      {
        style: 'rock', label: 'Straight rock', rename: 'Straight rock (eighth-note)',
        verdict: `<p>Band: a crash-like open hat on one, ghost 16ths on the snare before 2 and 4, bass approaching changes. Guitar: the chug stays but with the chord opened on 1 and 3 and the muted eighths between palm-muted rather than just quiet; the "chords and a riff" part gets a riff that repeats and bends.</p>`,
        band: { hatOpen: [0], ghost: [3, 11], bassApproach: true, fill: { snare: [8, 9, 10, 11, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Eighth-note chug, muted', replaces: 'Eighth-note chug',
            why: 'The same eight eighths, but the six that are not on 1 or 3 are palm-muted — which is what the chug is. Fills: a riff said twice, and the ♭7-to-octave bend.',
            figure: [s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), s(8, 1.8, 0.9), s(10, 1.8, 0.55, 'low', 'mute'), s(12, 1.8, 0.7, 'low', 'mute'), s(14, 1.8, 0.55, 'low', 'mute')],
            variants: [chug('low', 'mute', 0.9, 0.55), [s(0, 4, 0.95), s(4, 1.8, 0.6, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), s(8, 4, 0.9), s(12, 1.8, 0.6, 'low', 'mute'), s(14, 1.8, 0.55, 'low', 'mute')]],
            fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), h(4, 3, 5, 4, 0.85), n(8, 0, 2, 0.9, { pm: true }), n(10, 0, 2, 0.6, { pm: true }), h(12, 3, 5, 2, 0.85), n(14, 0, 2, 0.8, { pm: true })]],
            fillsOnChange: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), n(8, 12, 2, 0.9), n(10, 10, 2, 0.75), n(12, 7, 2, 0.8), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), b(8, 10, 2, 6, 0.9, { vib: true }), s(14, 1.8, 0.6, 'low', 'mute')]],
          },
          {
            name: 'Chords and a riff', replaces: 'Chords and a riff',
            why: 'Kept, with the riff palm-muted and a rake into its last note; the change fill is the riff walking up to the next chord.',
            figure: [s(0, 4, 0.9), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'), n(8, 0, 2, 0.85, { pm: true }), n(10, 3, 2, 0.75, { pm: true }), n(12, 5, 2, 0.8, { pm: true }), n(14, 7, 2, 0.85, { rake: true })],
            variants: [[n(0, 0, 2, 0.85, { pm: true }), n(2, 3, 2, 0.75, { pm: true }), n(4, 5, 2, 0.8, { pm: true }), n(6, 7, 2, 0.85), s(8, 4, 0.9), s(12, 2, 0.7, 'low', 'mute'), s(14, 2, 0.6, 'low', 'mute')],
                       [s(0, 6, 0.9), n(6, 7, 2, 0.75, { pm: true }), s(8, 4, 0.85), n(12, 10, 2, 0.75, { pm: true }), n(14, 12, 2, 0.85)]],
            fills: [[n(0, 12, 2, 0.9), n(2, 10, 2, 0.75), n(4, 12, 2, 0.85), n(6, 10, 2, 0.75), n(8, 7, 4, 0.85, { vib: true }), s(12, 4, 0.9)]],
            fillsOnChange: [[s(0, 4, 0.9), n(4, 0, 2, 0.85, { pm: true }), n(6, 3, 2, 0.75, { pm: true }), n(8, 5, 2, 0.8, { pm: true }), n(10, 7, 2, 0.85, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 4, 0.9), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'), b(8, 5, 2, 4, 0.85, { vib: true }), n(12, 7, 2, 0.75), n(14, 10, 2, 0.8)]],
          },
        ],
      },
      {
        style: 'rock', label: 'Half-time rock', rename: 'Half-time (Levee-style)',
        verdict: `<p>Band: the kick doubles on the "and of 2", the snare on 3 hits harder, open hat on the "and of 4", the bass a semitone under every change. Guitar: a low-string riff with a pedal on the open root (palm-muted eighths) under stabs, and a bend with vibrato as the fill — what half-time rock guitar does in the space the drums leave.</p>`,
        band: { kick: [0, 6, 10], snareVel: 0.95, hatOpen: [14], bassApproach: true, fill: { snare: [12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Pedal and stab', replaces: 'Low riff',
            why: 'The root palm-muted on every eighth, a power-chord stab on the "and of 2" and on 4, and the ♭7 or the ♭3 hammered in where the riff turns.',
            figure: [n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), n(4, 0, 2, 0.7, { pm: true }), s(6, 2, 0.95, 'low'), n(8, 0, 2, 0.85, { pm: true }), n(10, 0, 2, 0.6, { pm: true }), s(12, 4, 0.95, 'low')],
            variants: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), h(4, 3, 5, 2, 0.8), s(6, 2, 0.95, 'low'), n(8, 0, 2, 0.85, { pm: true }), n(10, 10, 2, 0.75), s(12, 4, 0.95, 'low')],
                       [s(0, 6, 0.95, 'low'), n(6, 0, 2, 0.6, { pm: true }), s(8, 6, 0.9, 'low'), n(14, 10, 2, 0.75, { rake: true })]],
            fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), b(4, 3, 2, 4, 0.9, { vib: true }), n(8, 0, 2, 0.85, { pm: true }), n(10, 0, 2, 0.6, { pm: true }), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)]],
            fillsOnChange: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), s(4, 4, 0.95, 'low'), n(8, 7, 2, 0.8, { pm: true }), n(10, 10, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 8, 0.95, 'low'), b(8, 10, 2, 8, 0.9, { vib: true })]],
          },
        ],
      },
    ],
    additions: [
      {
        label: "Rock 'n' roll", inspired: 'Chuck Berry ("Johnny B. Goode", "Maybellene"), Little Richard\'s band', style: 'rock',
        progression: ['A', 'A', 'D', 'D', 'A', 'E'], key: 'A', tempo: 164,
        why: `<p>The straight boogie — root-5th, root-6th on two strings in eighths, the bass walking the same — with double stops in 3rds and 4ths slid into and bent between. The app's current "Jump blues" is this, minus the double stops; it moves here and jump blues goes back to swinging.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [4, 12], snareVel: 0.9, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'dom7',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map((k, i) => ({ slot: k, off: [0, 4, 7, 9, 10, 9, 7, 4][i], dur: 1.9, vel: i % 2 ? 0.8 : 0.95 })),
                chord: [{ slot: 4, dur: 1.5, vel: 0.7 }, { slot: 12, dur: 1.5, vel: 0.7 }], bassApproach: true, fill: { snare: [8, 10, 12, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Straight boogie',
            why: 'Root-5th, root-5th, root-6th, root-6th, in eighths, palm-muted; the ♭7 on beat three of the variant.',
            figure: [d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 7, 2, 0.9, { pm: true }), d(10, 0, 7, 2, 0.6, { pm: true }), d(12, 0, 9, 2, 0.85, { pm: true }), d(14, 0, 9, 2, 0.6, { pm: true })],
            variants: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 10, 2, 0.9, { pm: true }), d(10, 0, 10, 2, 0.6, { pm: true }), d(12, 0, 9, 2, 0.85, { pm: true }), d(14, 0, 9, 2, 0.6, { pm: true })],
                       [s(0, 2, 0.95), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 7, 2, 0.9, { pm: true }), d(10, 0, 7, 2, 0.6, { pm: true }), d(12, 0, 9, 2, 0.85, { pm: true }), d(14, 0, 9, 2, 0.6, { pm: true })]],
            fills: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 4, 7, 2, 0.85, { up: 1 }), d(10, 4, 7, 2, 0.6), d(12, 3, 7, 2, 0.85), d(14, 0, 4, 2, 0.8)]],
            fillsOnChange: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), nx(8, -5, 2, 0.85, { pm: true }), nx(10, -3, 2, 0.7, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 10, 2, 0.9, { pm: true }), d(10, 0, 9, 2, 0.6, { pm: true }), d(12, 0, 7, 2, 0.85, { pm: true }), d(14, 0, 9, 2, 0.6, { pm: true })]],
            turnaround: [d(0, 10, 12, 2, 0.85), d(2, 10, 12, 2, 0.5), d(4, 9, 12, 2, 0.8), d(6, 9, 12, 2, 0.5), d(8, 7, 12, 2, 0.8), d(10, 7, 12, 2, 0.5), nx(12, 1, 2, 0.8), nx(14, 0, 2, 0.9)],
          },
          {
            name: 'Double stops (Berry-inspired)',
            why: 'The answer to the boogie: 3rds and 4ths on the top strings, slid into, the lower note bent, said twice. Needs double-stop bends.',
            figure: [d(0, 4, 7, 2, 0.9, { up: 1 }), d(2, 4, 7, 2, 0.6), d(4, 4, 7, 2, 0.85), d(6, 3, 7, 2, 0.7), d(8, 0, 4, 2, 0.85), d(10, 0, 4, 2, 0.6), d(12, 0, 7, 4, 0.85)],
            variants: [[d(0, 7, 12, 2, 0.9), d(2, 7, 12, 2, 0.6), d(4, 7, 12, 2, 0.85), d(6, 7, 12, 2, 0.6), d(8, 4, 7, 2, 0.85, { up: 1 }), d(10, 4, 7, 2, 0.6), d(12, 0, 4, 4, 0.85)],
                       [n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), n(4, 0, 2, 0.7, { pm: true }), n(6, 0, 2, 0.6, { pm: true }), d(8, 4, 7, 2, 0.9, { up: 1 }), d(10, 4, 7, 2, 0.6), d(12, 4, 7, 2, 0.85), d(14, 3, 7, 2, 0.7)]],
            fills: [[d(0, 10, 14, 2, 0.9), d(2, 10, 14, 2, 0.6), d(4, 9, 12, 2, 0.85), d(6, 7, 10, 2, 0.75), d(8, 4, 7, 4, 0.85, { up: 1 }), n(12, 3, 2, 0.75), n(14, 4, 2, 0.8)]],
            fillsOnChange: [[d(0, 4, 7, 2, 0.9, { up: 1 }), d(2, 4, 7, 2, 0.6), d(4, 4, 7, 2, 0.85), n(8, 10, 2, 0.8), n(10, 7, 2, 0.75), nx(12, 4, 4, 0.85, { vib: true })]],
            fillsOnStay: [[d(0, 4, 7, 2, 0.9, { up: 1 }), d(2, 4, 7, 2, 0.6), d(4, 4, 7, 2, 0.85), d(6, 4, 7, 2, 0.6), d(8, 4, 7, 2, 0.9, { up: 1 }), d(10, 4, 7, 2, 0.6), d(12, 4, 7, 4, 0.85)]],
            turnaround: [d(0, 10, 12, 2, 0.85), d(2, 10, 12, 2, 0.5), d(4, 9, 12, 2, 0.8), d(6, 9, 12, 2, 0.5), d(8, 7, 12, 2, 0.8), d(10, 7, 12, 2, 0.5), nx(12, 1, 2, 0.8), nx(14, 0, 2, 0.9)],
          },
        ],
      },
      {
        label: 'Bo Diddley beat', inspired: 'Bo Diddley ("Bo Diddley", "Mona"), Buddy Holly ("Not Fade Away"), the Stones', style: 'rock',
        progression: ['E', 'E', 'E', 'E', 'A', 'E'], key: 'E', tempo: 120,
        why: `<p>The clave — 1, the "and of 2", 4 | 2, 3 — strummed on one chord with muted scratches on every other eighth, the drums on the same figure. Mostly one chord; the IV comes and goes. Needs ghost strums.</p>`,
        band: { grid: 16, kick: [0, 6, 12], snare: [4, 8, 12], snareVel: 0.7, hat: [0, 2, 4, 6, 8, 10, 12, 14], rim: [3, 6, 10], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 6, off: 0, dur: 2, vel: 0.8 }, { slot: 12, off: 7, dur: 2, vel: 0.8 }], chord: [{ slot: 0, dur: 2, vel: 0.6 }, { slot: 6, dur: 2, vel: 0.6 }, { slot: 12, dur: 2, vel: 0.6 }] },
        parts: [
          {
            name: 'The clave strum',
            why: 'The chord on the clave hits, a muted scratch on every eighth between, so the hand never stops. The second bar of the two-bar clave is the variant.',
            figure: [s(0, 2, 0.9), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 2, 0.85), g(8, 1, 0.3), g(10, 1, 0.3), s(12, 2, 0.85), g(14, 1, 0.3)],
            variants: [[g(0, 1, 0.3), g(2, 1, 0.3), s(4, 2, 0.85), g(6, 1, 0.3), s(8, 2, 0.85), g(10, 1, 0.3), g(12, 1, 0.3), g(14, 1, 0.3)],
                       [s(0, 2, 0.9, 'low'), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 2, 0.85, 'low'), g(8, 1, 0.3), g(10, 1, 0.3), s(12, 2, 0.85, 'high'), s(14, 1, 0.5, 'high')]],
            fills: [[s(0, 2, 0.9), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 2, 0.85), n(8, 10, 2, 0.8), n(10, 12, 2, 0.8), s(12, 2, 0.85), g(14, 1, 0.3)]],
            fillsOnChange: [[s(0, 2, 0.9), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 2, 0.85), g(8, 1, 0.3), n(10, 7, 2, 0.8), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
          },
        ],
      },
      {
        label: 'Jangle', inspired: 'Johnny Marr (the Smiths), the Byrds, R.E.M.\'s Peter Buck', style: 'rock',
        progression: ['C', 'G', 'Am', 'F', 'C', 'G'], key: 'C', tempo: 126,
        why: `<p>Open chords arpeggiated in continuous sixteenths with the open strings ringing through the changes — the chord broken over its octave with the 9th and the 6th as colour, never a flat strum. The kit stays light, the bass on eighths. Realised in Scales so the colour tones are there.</p>`,
        band: { grid: 16, kick: [0, 8, 10], snare: [4, 12], snareVel: 0.7, hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: 0, dur: 1.9, vel: k % 4 ? 0.7 : 0.85 })), chord: [{ slot: 0, dur: 8, vel: 0.35 }, { slot: 8, dur: 8, vel: 0.35 }] },
        parts: [
          {
            name: 'Ringing arpeggio',
            why: 'Sixteenths across the chord — root, 5th, octave, 9th, octave, 5th — the way a Rickenbacker rings; the 6th appears on the way down. The change fill lands on the next chord\'s 3rd.',
            figure: [n(0, 0, 4, 0.8), n(1, 7, 4, 0.6), n(2, 12, 4, 0.7), n(3, 14, 4, 0.6), n(4, 12, 4, 0.65), n(5, 7, 4, 0.55), n(6, 12, 4, 0.65), n(7, 14, 4, 0.6),
                     n(8, 0, 4, 0.8), n(9, 7, 4, 0.6), n(10, 12, 4, 0.7), n(11, 14, 4, 0.6), n(12, 12, 4, 0.65), n(13, 9, 4, 0.55), n(14, 7, 4, 0.65), n(15, 4, 4, 0.6)],
            variants: [[n(0, 0, 4, 0.8), n(1, 4, 4, 0.6), n(2, 7, 4, 0.65), n(3, 12, 4, 0.7), n(4, 14, 4, 0.6), n(5, 12, 4, 0.6), n(6, 7, 4, 0.55), n(7, 4, 4, 0.55), n(8, 0, 4, 0.8), n(9, 4, 4, 0.6), n(10, 7, 4, 0.65), n(11, 12, 4, 0.7), n(12, 14, 4, 0.6), n(13, 12, 4, 0.6), n(14, 9, 4, 0.55), n(15, 7, 4, 0.55)],
                       [s(0, 4, 0.7, 'high'), n(4, 12, 4, 0.7), n(5, 14, 4, 0.6), n(6, 12, 4, 0.6), n(7, 7, 4, 0.55), s(8, 4, 0.65, 'high'), n(12, 12, 4, 0.7), n(13, 14, 4, 0.6), n(14, 12, 4, 0.6), n(15, 9, 4, 0.55)]],
            fills: [[n(0, 12, 4, 0.8), n(1, 14, 4, 0.6), n(2, 12, 4, 0.65), n(3, 9, 4, 0.6), n(4, 7, 4, 0.7), n(5, 9, 4, 0.6), n(6, 7, 4, 0.6), n(7, 4, 4, 0.6), n(8, 0, 8, 0.8), n(12, 4, 2, 0.7), n(14, 7, 2, 0.7)]],
            fillsOnChange: [[n(0, 0, 4, 0.8), n(1, 7, 4, 0.6), n(2, 12, 4, 0.7), n(3, 14, 4, 0.6), n(4, 12, 4, 0.65), n(5, 7, 4, 0.55), n(6, 12, 4, 0.65), n(7, 14, 4, 0.6), n(8, 12, 2, 0.7), n(10, 9, 2, 0.65), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.75)]],
          },
        ],
      },
      {
        label: 'Southern rock', inspired: 'Lynyrd Skynyrd ("Sweet Home Alabama"-style hammered double stops), the Allman Brothers ("Ramblin\' Man")', style: 'rock',
        progression: ['D', 'C', 'G', 'G', 'D', 'C'], key: 'G', tempo: 100,
        why: `<p>Major-pentatonic riffs with hammered double stops over a straight kit with ghost sixteenths; the chord on one, then the hammer-on inside it — a 2nd to the 3rd on top of the root and 5th — and the ♭3-to-3. The bass walks up into every change.</p>`,
        band: { grid: 16, kick: [0, 7, 8, 10], snare: [4, 12], ghost: [2, 7, 11, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 6, off: 7, dur: 1.6, vel: 0.7 }, { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 12, off: 7, dur: 1.6, vel: 0.7 }, { slot: 14, off: 12, dur: 1.6, vel: 0.7 }],
                bassApproach: true, chord: [{ slot: 0, dur: 3, vel: 0.65 }, { slot: 6, dur: 2, vel: 0.5 }, { slot: 8, dur: 3, vel: 0.6 }, { slot: 14, dur: 2, vel: 0.5 }], fill: { snare: [10, 11, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Hammered double stops',
            why: 'The chord on one, then the 2nd hammered to the 3rd over the root, the 4th to the 5th, the ♭3 to the 3 — on the way to the next chord.',
            figure: [s(0, 2, 0.9), h(2, 2, 4, 2, 0.8), d(4, 4, 7, 2, 0.8), h(6, 5, 7, 2, 0.75), s(8, 2, 0.85), h(10, 3, 4, 2, 0.8), d(12, 0, 4, 2, 0.8), d(14, 4, 7, 2, 0.7)],
            variants: [[s(0, 4, 0.9), d(4, 0, 7, 2, 0.75), h(6, 2, 4, 2, 0.8), s(8, 4, 0.85), d(12, 4, 7, 2, 0.75), h(14, 5, 7, 2, 0.75)],
                       [n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), h(4, 2, 4, 2, 0.8), d(6, 4, 7, 2, 0.75), n(8, 0, 2, 0.85, { pm: true }), n(10, 0, 2, 0.6, { pm: true }), h(12, 3, 4, 2, 0.8), d(14, 4, 7, 2, 0.75)]],
            fills: [[n(0, 12, 2, 0.9), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 9, 2, 0.75), h(8, 3, 4, 2, 0.85), n(10, 0, 2, 0.8), d(12, 0, 4, 4, 0.85)]],
            fillsOnChange: [[s(0, 2, 0.9), h(2, 2, 4, 2, 0.8), d(4, 4, 7, 2, 0.8), n(8, 7, 2, 0.8), n(10, 9, 2, 0.75), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)],
                            [s(0, 4, 0.9), d(4, 4, 7, 2, 0.8), d(6, 4, 7, 2, 0.6), n(8, 9, 2, 0.8), n(10, 7, 2, 0.75), nx(12, 5, 2, 0.7), nx(14, 4, 2, 0.8)]],
            fillsOnStay: [[s(0, 2, 0.9), h(2, 2, 4, 2, 0.8), d(4, 4, 7, 2, 0.8), h(6, 5, 7, 2, 0.75), n(8, 9, 2, 0.8), n(10, 7, 2, 0.75), n(12, 4, 2, 0.8), n(14, 0, 2, 0.8)]],
          },
        ],
      },
      {
        label: 'Punk', inspired: 'the Ramones ("Blitzkrieg Bop"), the Clash, Green Day', style: 'rock',
        progression: ['A', 'D', 'E', 'A', 'D', 'E'], key: 'A', tempo: 176,
        why: `<p>Barre chords downstroked on every eighth, nothing left out, no fills — the fill is the chord — with the kick on every beat and the snare on 2 and 4. The one variation is the palm-muted verse. The app had a "Punk drive" that was deleted; this is the part it never had.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [4, 12], snareVel: 0.95, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [0, 8], voice: 'triad',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: 0, dur: 1.8, vel: 0.9 })), chord: [], fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Downstrokes',
            why: 'Every eighth downstroked on a power chord — root, 5th, octave on the low strings, no 3rd — which is what punk barre chords are. The variant is the palm-muted verse; the "fill" opens the chord on the last two eighths before a change. Needs a power-chord voicing.',
            figure: chug('power', null, 0.95, 0.85),
            variants: [chug('power', 'mute', 0.9, 0.7), [s(0, 4, 0.95, 'power'), s(4, 1.8, 0.85, 'power'), s(6, 1.8, 0.85, 'power'), s(8, 4, 0.95, 'power'), s(12, 1.8, 0.85, 'power'), s(14, 1.8, 0.85, 'power')]],
            fills: [chug('power', null, 0.95, 0.85)],
            fillsOnChange: [[s(0, 1.8, 0.95, 'power'), s(2, 1.8, 0.85, 'power'), s(4, 1.8, 0.85, 'power'), s(6, 1.8, 0.85, 'power'), s(8, 1.8, 0.95, 'power'), s(10, 1.8, 0.85, 'power'), sn(12, 2, 0.95, 'power', null, { chordSlide: -1 }), sn(14, 2, 0.9, 'power')]],
            fillsOnStay: [chug('power', 'mute', 0.9, 0.7)],
          },
        ],
      },
      {
        label: 'Crazy Horse stomp', inspired: 'Neil Young with Crazy Horse ("Cinnamon Girl", "Down by the River")', style: 'rock',
        progression: ['D', 'A', 'C', 'G', 'D', 'A'], key: 'D', tempo: 92,
        why: `<p>Four heavy quarter-note strums a bar, the drums the same, the bass on the root and nothing clever — and the fill is one note, bent, repeated. Slow, big, and a little behind the beat (turn Humanize on).</p>`,
        band: { grid: 16, kick: [0, 8], snare: [4, 12], snareVel: 0.9, hat: [], ride: [0, 4, 8, 12], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.8, vel: 0.9 }, { slot: 4, off: 0, dur: 3.8, vel: 0.8 }, { slot: 8, off: 0, dur: 3.8, vel: 0.85 }, { slot: 12, off: 7, dur: 3.8, vel: 0.8 }], chord: [{ slot: 0, dur: 8, vel: 0.5 }, { slot: 8, dur: 8, vel: 0.5 }] },
        parts: [
          {
            name: 'Four quarters',
            why: 'The whole chord on every beat, hard. The variant opens the and of two. The fill: one note, bent up a tone and shaken, said again.',
            figure: [s(0, 3.5, 0.95), s(4, 3.5, 0.9), s(8, 3.5, 0.95), s(12, 3.5, 0.9)],
            variants: [[s(0, 3.5, 0.95), s(4, 2, 0.9), s(6, 2, 0.75, 'high'), s(8, 3.5, 0.95), s(12, 3.5, 0.9)], [s(0, 6, 0.95), s(6, 2, 0.8, 'low'), s(8, 3.5, 0.95), s(12, 3.5, 0.9)]],
            fills: [[b(0, 10, 2, 4, 0.95, { vib: true }), b(4, 10, 2, 4, 0.9, { vib: true }), b(8, 10, 2, 8, 0.95, { vib: true })]],
            fillsOnChange: [[s(0, 3.5, 0.95), s(4, 3.5, 0.9), b(8, 5, 2, 4, 0.95, { vib: true }), nx(12, 0, 4, 0.9, { chordSlide: -2 })]],
            fillsOnStay: [[s(0, 3.5, 0.95), s(4, 3.5, 0.9), s(8, 3.5, 0.95), s(12, 2, 0.9), s(14, 2, 0.9)]],
          },
        ],
      },
      {
        label: 'Heartland', inspired: 'Tom Petty and the Heartbreakers ("Free Fallin\'", "Refugee"), John Mellencamp', style: 'rock',
        progression: ['D', 'G', 'A', 'D', 'G', 'A'], key: 'D', tempo: 112,
        why: `<p>Mid-tempo on a backbeat: the acoustic strums down-down-up-up-down-up with the sus2 and sus4 hammered on and off the chord shape, the electric answers with double stops; the bass sits on the root and walks up into changes.</p>`,
        band: { grid: 16, kick: [0, 6, 8], snare: [4, 12], snareVel: 0.85, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.6, vel: 0.9 }, { slot: 6, off: 0, dur: 1.6, vel: 0.7 }, { slot: 8, off: 0, dur: 3.6, vel: 0.85 }, { slot: 14, off: 7, dur: 1.6, vel: 0.7 }], bassApproach: true,
                chord: [{ slot: 0, dur: 3.6, vel: 0.6 }, { slot: 6, dur: 2, vel: 0.5 }, { slot: 8, dur: 3.6, vel: 0.55 }, { slot: 14, dur: 2, vel: 0.5 }] },
        parts: [
          {
            name: 'Sus strum',
            why: 'The strum with the 4th hammered onto the chord and pulled off again — the chord shape with one moving finger — and a muted chuck on 2 and 4.',
            figure: [s(0, 4, 0.85), s(4, 2, 0.55, 'high', 'mute'), s(6, 2, 0.6, 'high'), h(8, 4, 5, 2, 0.75), p(10, 5, 4, 2, 0.75), s(12, 2, 0.55, 'high', 'mute'), s(14, 2, 0.65, 'high')],
            variants: [[s(0, 4, 0.85), s(4, 2, 0.75), s(6, 4, 0.55, 'high'), s(10, 2, 0.55, 'high'), s(12, 2, 0.75), s(14, 2, 0.55, 'high')],
                       [s(0, 2, 0.85), h(2, 2, 4, 2, 0.7), s(4, 2, 0.55, 'high', 'mute'), s(6, 2, 0.6, 'high'), s(8, 4, 0.8), s(12, 2, 0.55, 'high', 'mute'), p(14, 5, 4, 2, 0.7)]],
            fills: [[s(0, 4, 0.85), d(4, 4, 7, 2, 0.8), d(6, 4, 7, 2, 0.6), d(8, 2, 5, 2, 0.75), d(10, 0, 4, 4, 0.8), s(14, 2, 0.65, 'high')]],
            fillsOnChange: [[s(0, 4, 0.85), s(4, 2, 0.55, 'high', 'mute'), s(6, 2, 0.6, 'high'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.75), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
            fillsOnStay: [[s(0, 4, 0.85), s(4, 2, 0.55, 'high', 'mute'), h(6, 2, 4, 2, 0.75), s(8, 4, 0.8), s(12, 2, 0.55, 'high', 'mute'), p(14, 5, 4, 2, 0.7)]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'rockabilly', name: 'Rockabilly',
    research: `
      <p><b>What the players actually do.</b> Scotty Moore ("Mystery Train", "That's All Right") plays a thinned-out Travis pattern: the thumb keeps a dead, muted root on every beat while the fingers play double stops and licks on top, with slapback echo on everything. Carl Perkins ("Blue Suede Shoes", "Honey Don't") walks the boogie on the low strings and answers in 6ths and the ♭3-to-3. Cliff Gallup (Gene Vincent's "Race with the Devil") runs fast, jazzy, chromatic lines. Brian Setzer brings swing-band 6th and 9th chords to it. The drums are a brushed shuffle with the snare on 2 and 4; the slap bass plays root and 5th on the beats with its click on the upbeats.</p>
      <p><b>What the app has now, and what is off about it.</b> The Boom-chick alternates bass note and chord per beat; the idiom is bass on the beat and chord on the <em>and</em> — twice a beat — and the bass alternates root and 5th. No dead thumb, no slapback, no 6ths chords, no slap click in the band.</p>`,
    existing: [
      {
        style: 'rockabilly', label: 'Rockabilly',
        verdict: `<p>Band: the slap bass's click as a ghost snare on the upbeats, a ride shuffle over brushed snare, the bass approaching changes, slapback on the guitar. Guitar: the boom-chick corrected — root on 1, chord on the and, 5th on 2, chord on the and — and two new parts: the dead thumb with licks on top (Moore), and the 6ths-and-boogie (Perkins). Needs slapback, palm-muted notes, rakes, double-stop bends.</p>`,
        band: { ghost: [2, 5, 8, 11], ride: [0, 2, 3, 5, 6, 8, 9, 11], hat: [3, 9], bassApproach: true, slapback: true, fill: { snare: [6, 8, 9, 10, 11], kick: [0, 3] } },
        parts: [
          {
            name: 'Boom-chick, corrected', replaces: 'Boom-chick',
            why: 'Root, chord, 5th, chord — the bass on every beat, alternating, and the chord on every upbeat, palm-muted. The change fill walks the bass up chromatically.',
            figure: [s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high', 'mute'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high', 'mute'), s(6, 1.4, 0.9, 'bass', 'mute'), s(8, 0.8, 0.6, 'high', 'mute'), s(9, 1.4, 0.8, 'fifth', 'mute'), s(11, 0.8, 0.6, 'high', 'mute')],
            variants: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high'), s(6, 1.4, 0.9, 'bass', 'mute'), s(8, 0.8, 0.6, 'high'), s(9, 1.4, 0.8, 'fifth', 'mute'), s(11, 0.8, 0.6, 'high')],
                       [n(0, 0, 1.4, 0.9, { pm: true }), s(2, 0.8, 0.6, 'high', 'mute'), n(3, 4, 1.4, 0.8, { pm: true }), s(5, 0.8, 0.6, 'high', 'mute'), n(6, 7, 1.4, 0.9, { pm: true }), s(8, 0.8, 0.6, 'high', 'mute'), n(9, 9, 1.4, 0.8, { pm: true }), s(11, 0.8, 0.6, 'high', 'mute')]],
            fills: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high', 'mute'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high', 'mute'), h(6, 3, 4, 1.6, 0.85), d(8, 4, 12, 0.8, 0.75), d(9, 9, 14, 2.4, 0.8)]],
            fillsOnChange: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high', 'mute'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high', 'mute'), nx(6, -5, 1.4, 0.9, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.4, 0.85, { pm: true }), nx(11, -1, 0.8, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high', 'mute'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high', 'mute'), n(6, 10, 0.8, 0.85), n(7, 9, 0.8, 0.7), n(8, 7, 0.8, 0.75), n(9, 9, 0.8, 0.7), n(10, 10, 0.8, 0.8), n(11, 12, 0.8, 0.85)]],
            turnaround: [s(0, 1.4, 0.9, 'bass', 'mute'), d(2, 10, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 9, 12, 0.8, 0.7), s(6, 1.4, 0.9, 'bass', 'mute'), d(8, 7, 12, 0.8, 0.7), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.9)],
          },
          {
            name: 'Dead thumb and licks (Moore-inspired)',
            why: 'The root muted on every beat by the thumb, and on top of it double stops in 3rds and 4ths, a bend with the other note held, a rake into the ♭3. This is the Sun-records rhythm guitar.',
            figure: [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.65), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 3, 7, 0.8, 0.7, { up: 1 }), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 4, 7, 0.8, 0.6)],
            variants: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(2, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), n(5, 10, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), n(8, 9, 0.8, 0.65), s(9, 1.4, 0.8, 'bass', 'mute'), h(11, 3, 4, 0.8, 0.7)],
                       [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 7, 10, 0.8, 0.65), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 7, 10, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 4, 9, 0.8, 0.65), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 4, 9, 0.8, 0.6)]],
            fills: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(1, 12, 0.8, 0.8, { rake: true }), n(2, 10, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), n(4, 9, 0.8, 0.7), n(5, 7, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), h(7, 3, 4, 1.6, 0.8), s(9, 1.4, 0.8, 'bass', 'mute'), n(10, 4, 0.8, 0.7), n(11, 0, 0.8, 0.7)]],
            fillsOnChange: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.65), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), n(8, 9, 0.8, 0.7), n(9, 10, 0.8, 0.75), nx(10, -2, 0.8, 0.75), nx(11, -1, 0.8, 0.8)]],
            fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 12, 0.8, 0.6), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 2, 11, 0.8, 0.7), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 0, 9, 0.8, 0.7)]],
            turnaround: [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 10, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 9, 12, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 7, 12, 0.8, 0.7), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.9)],
          },
          {
            name: 'Boogie and 6ths (Perkins-inspired)', replaces: 'Walking boogie',
            why: 'The boogie walk on the low strings, palm-muted — root, 3, 5, 6, ♭7, 6, 5, 3 — with the fills in 6ths on the top strings and the ♭3 hammered.',
            figure: [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), n(6, 10, 1.6, 0.85, { pm: true }), n(8, 9, 0.8, 0.7, { pm: true }), n(9, 7, 1.6, 0.85, { pm: true }), n(11, 4, 0.8, 0.7, { pm: true })],
            variants: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.5, { pm: true }), n(3, 4, 1.6, 0.85, { pm: true }), n(5, 4, 0.8, 0.5, { pm: true }), n(6, 7, 1.6, 0.85, { pm: true }), n(8, 7, 0.8, 0.5, { pm: true }), n(9, 9, 1.6, 0.85, { pm: true }), n(11, 9, 0.8, 0.5, { pm: true })],
                       [n(0, 0, 1.6, 0.9, { pm: true }), s(3, 1.6, 0.75, 'high'), n(6, 7, 1.6, 0.85, { pm: true }), s(9, 1.6, 0.75, 'high')]],
            fills: [[d(0, 4, 12, 1.6, 0.85), d(2, 4, 12, 0.8, 0.5), d(3, 2, 11, 1.6, 0.8), d(5, 2, 11, 0.8, 0.5), d(6, 0, 9, 1.6, 0.8), h(9, 3, 4, 1.6, 0.85), n(11, 0, 0.8, 0.7)]],
            fillsOnChange: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), nx(6, -5, 1.6, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.6, 0.8, { pm: true }), nx(11, -1, 0.8, 0.85, { pm: true })]],
            fillsOnStay: [[h(0, 3, 4, 2.4, 0.85), h(3, 3, 4, 2.4, 0.85), d(6, 4, 12, 2.4, 0.85), n(9, 12, 2.4, 0.9, { vib: true })]],
            turnaround: [n(0, 12, 1.6, 0.9), n(2, 10, 0.8, 0.7), n(3, 9, 1.6, 0.8), n(5, 8, 0.8, 0.7), n(6, 7, 1.6, 0.8), n(8, 3, 0.8, 0.7), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.9)],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Western swing', inspired: 'Bob Wills and His Texas Playboys, Eldon Shamblin, Junior Barnard', style: 'rockabilly',
        progression: ['G', 'G', 'C', 'C', 'D7', 'G'], key: 'G', tempo: 150,
        why: `<p>Swing band in cowboy hats: a walking bass in quarters, a brushed kit, and the rhythm guitar playing four to the bar on 6th and 9th chords — jazz voicings, country tune — with steel-guitar-like double-stop bends in the fills. Needs shell voicings, colour tones and double-stop bends.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.5, snare: [3, 9], snareVel: 0.6, hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'jazz',
                bass: [{ slot: 0, walk: 0, dur: 2.6, vel: 0.9 }, { slot: 3, walk: 2, dur: 2.6, vel: 0.8 }, { slot: 6, walk: 1, dur: 2.6, vel: 0.85 }, { slot: 9, walk: 3, dur: 2.6, vel: 0.8 }],
                chord: [{ slot: 0, dur: 1.2, vel: 0.45 }, { slot: 3, dur: 1.2, vel: 0.6 }, { slot: 6, dur: 1.2, vel: 0.45 }, { slot: 9, dur: 1.2, vel: 0.6 }], slapback: true },
        parts: [
          {
            name: 'Four to the bar, 6ths and 9ths',
            why: 'Short chords on every beat with the 6th on top of the I and the 9th on top of the V, 2 and 4 leaning; the fills are steel-like — a 3rd held while the note under it bends up.',
            figure: [s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), s(6, 1.2, 0.6, 'shell', null, { add: 9 }), s(9, 1.2, 0.8, 'shell', null, { add: 9 })],
            variants: [[s(0, 1.2, 0.6, 'shell', null, { add: 14 }), s(3, 1.2, 0.8, 'shell', null, { add: 14 }), s(6, 1.2, 0.6, 'shell', null, { add: 14 }), s(9, 1.2, 0.8, 'shell', null, { add: 14 })],
                       [s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9, chordSlide: 1 }), s(6, 1.2, 0.6, 'shell', null, { add: 9 }), s(8, 0.5, 0.35, 'high'), s(9, 1.2, 0.8, 'shell', null, { add: 9 })]],
            fills: [[d(0, 2, 7, 2.4, 0.85, { up: 2 }), d(3, 4, 7, 2.4, 0.8), d(6, 2, 7, 2.4, 0.85, { up: 2 }), n(9, 9, 1.6, 0.8), n(11, 12, 0.8, 0.8)]],
            fillsOnChange: [[s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), n(6, 9, 0.8, 0.8), n(8, 10, 0.8, 0.75), n(9, 12, 0.8, 0.85), nx(10, 5, 0.8, 0.7), nx(11, 4, 0.8, 0.85)]],
            fillsOnStay: [[d(0, 4, 9, 2.4, 0.85), d(3, 4, 9, 1.6, 0.6), d(5, 2, 7, 0.8, 0.7, { up: 2 }), d(6, 4, 9, 2.4, 0.85), s(9, 1.2, 0.8, 'shell', null, { add: 9 })]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'psychobilly', name: 'Psychobilly',
    research: `
      <p><b>What the players actually do.</b> Punk speed with rockabilly hands: the Cramps' Poison Ivy plays fuzzy, primitive two-note riffs with a lot of space; the Meteors play fast muted chugs and chromatic runs; Reverend Horton Heat's Jim Heath plays Travis picking and surf runs at tempo. The band is a slap bass pumping eighths on root and 5th with its click on every upbeat, drums in a fast two (kick 1 and 3, snare 2 and 4), not four on the floor.</p>
      <p><b>What the app has now, and what is off about it.</b> The kick on every beat makes it a stomp, not a two; there is no slap click; and the parts are metal-ish chugs where the idiom is dead-thumb picking and riffs with space.</p>`,
    existing: [
      {
        style: 'psychobilly', label: 'Psychobilly',
        verdict: `<p>Band: kick on 1 and 3, the slap click as a ghost snare on every upbeat, snare hard on 2 and 4, open hat on 4's "and". Guitar: the chug stays as a variant; a Travis-at-speed part (Heath) and a two-note fuzz riff with space (Ivy) join it. Slapback on.</p>`,
        band: { kick: [0, 8], ghost: [2, 6, 10, 14], hatOpen: [14], bassApproach: true, slapback: true, fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Travis at speed (Heath-inspired)', replaces: 'Chug and stab',
            why: 'The thumb on root and 5th every beat, palm-muted, the fingers on a top-string riff in the sixteenths between — rockabilly picking with the tempo turned up.',
            figure: [s(0, 2, 0.9, 'bass', 'mute'), n(2, 12, 2, 0.7), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 10, 2, 0.65), s(8, 2, 0.9, 'bass', 'mute'), n(10, 12, 1, 0.7), n(11, 10, 1, 0.65), s(12, 2, 0.8, 'fifth', 'mute'), n(14, 7, 2, 0.7)],
            variants: [[s(0, 2, 0.9, 'bass', 'mute'), d(2, 4, 7, 2, 0.65), s(4, 2, 0.8, 'fifth', 'mute'), d(6, 4, 7, 2, 0.65), s(8, 2, 0.9, 'bass', 'mute'), d(10, 3, 7, 2, 0.7), s(12, 2, 0.8, 'fifth', 'mute'), h(14, 3, 4, 2, 0.75)],
                       chug('low', 'mute', 0.9, 0.6)],
            fills: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 12, 1, 0.8), n(3, 10, 1, 0.7), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 7, 1, 0.7), n(7, 6, 1, 0.65), s(8, 2, 0.9, 'bass', 'mute'), n(10, 5, 1, 0.7), n(11, 3, 1, 0.7), s(12, 2, 0.8, 'fifth', 'mute'), n(14, 0, 2, 0.8)]],
            fillsOnChange: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 12, 2, 0.7), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 10, 2, 0.65), nx(8, -4, 2, 0.85, { pm: true }), nx(10, -3, 2, 0.7, { pm: true }), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
            fillsOnStay: [[s(0, 2, 0.9, 'bass', 'mute'), sl(2, 10, 12, 2, 0.8), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 12, 2, 0.7), s(8, 2, 0.9, 'bass', 'mute'), p(10, 12, 10, 2, 0.75), s(12, 2, 0.8, 'fifth', 'mute'), n(14, 7, 2, 0.7)]],
          },
          {
            name: 'Two-note riff with space (Ivy-inspired)', replaces: 'Low riff',
            why: 'A riff of two or three notes — root, ♭3, ♭7 — with rests, fuzzed, stated and left alone; the chug comes back for the fill.',
            figure: [n(0, 0, 2, 0.95), n(2, 0, 1, 0.5), n(3, 3, 3, 0.9), n(8, 10, 2, 0.9), n(10, 0, 4, 0.85)],
            variants: [[n(0, 0, 3, 0.95), n(3, 3, 1, 0.8), n(4, 0, 4, 0.9), n(10, 6, 2, 0.85), n(12, 7, 4, 0.9)], [n(0, 12, 2, 0.95), n(2, 12, 1, 0.5), n(3, 10, 3, 0.9), n(8, 7, 2, 0.85), n(10, 10, 2, 0.8), n(12, 12, 4, 0.9, { vib: true })]],
            fills: [chug('low', 'mute', 0.95, 0.65)],
            fillsOnChange: [[n(0, 0, 2, 0.95), n(2, 0, 1, 0.5), n(3, 3, 3, 0.9), n(8, 5, 2, 0.85), nx(10, -3, 2, 0.8), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.9)]],
            fillsOnStay: [[n(0, 0, 2, 0.95, { trem: 4 }), n(2, 0, 1, 0.5), n(3, 3, 3, 0.9), n(8, 10, 2, 0.9, { trem: 4 }), n(10, 0, 4, 0.85)]],
          },
        ],
      },
    ],
    additions: [],
  });

  // =========================================================================
  genres.push({
    id: 'surf', name: 'Surf rock',
    research: `
      <p><b>What the players actually do.</b> Dick Dale ("Misirlou") tremolo-picks — every note picked as fast as the hand goes — close to the bridge, on scales with the ♭2 and the raised 7th borrowed from the Middle East, through drenched spring reverb. The Ventures ("Walk, Don't Run") and the Shadows ("Apache") play clean, melodic, vibrato-armed lines over a picked eighth-note bass; the Chantays ("Pipeline") open with a glissando down the low string. The drums are the "surf beat": kick on 1 and 3 with a pickup, snare cracking 2 and 4, a tom fill every few bars.</p>
      <p><b>What the app has now, and what is off about it.</b> No tremolo picking, no glissando, no ♭2 unless a chord supplies it, no drum fills. The parts are fine as far as they go; the sound is not surf without the picking.</p>`,
    existing: [
      {
        style: 'surf', label: 'Surf rock',
        verdict: `<p>Band: the surf beat with a tom-and-snare fill at the top of the form, open hat on the pickup, bass approaching changes, slapback. Guitar: tremolo-picked melody, the glissando from the top of the neck, and the ♭2 got honestly — the progression moves E–F so the "♭2" is the next chord's root. Needs tremolo picking (sub-slot timing), slides from outside the window, slapback.</p>`,
        entry: { progression: ['E', 'F', 'E', 'F', 'E', 'E'], key: 'E', tempo: 168 },
        band: { kick: [0, 6, 8, 14], snare: [4, 12], snareVel: 0.9, hatOpen: [14], bassApproach: true, slapback: true, fill: { snare: [8, 9, 10, 11], kick: [12, 13, 14, 15] } },
        parts: [
          {
            name: 'Tremolo melody (Dale-inspired)',
            why: 'Every note tremolo-picked: the root, the ♭2 (the F chord\'s root), the 3rd, the 4th, the 5th, coming down the double-harmonic shape by way of the changes. Needs tremolo picking.',
            figure: [n(0, 0, 4, 0.9, { trem: 8 }), n(4, 4, 4, 0.85, { trem: 8 }), n(8, 5, 2, 0.85, { trem: 4 }), n(10, 7, 2, 0.85, { trem: 4 }), nx(12, 0, 4, 0.9, { trem: 8 })],
            variants: [[n(0, 12, 4, 0.9, { trem: 8 }), n(4, 11, 2, 0.85, { trem: 4 }), n(6, 12, 2, 0.85, { trem: 4 }), n(8, 7, 4, 0.85, { trem: 8 }), n(12, 4, 2, 0.8, { trem: 4 }), n(14, 0, 2, 0.85, { trem: 4 })],
                       [n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), s(4, 2, 0.85, 'high'), n(6, 0, 2, 0.7, { pm: true }), n(8, 7, 2, 0.85, { pm: true }), n(10, 7, 2, 0.7, { pm: true }), s(12, 2, 0.85, 'high'), n(14, 7, 2, 0.7, { pm: true })]],
            fills: [[sl(0, 14, 12, 4, 0.95), n(4, 10, 2, 0.8), n(6, 7, 2, 0.85), n(8, 5, 2, 0.8), n(10, 3, 2, 0.85), n(12, 0, 4, 0.9, { trem: 8 })]],
            fillsOnChange: [[n(0, 7, 4, 0.9, { trem: 8 }), n(4, 5, 2, 0.8, { trem: 4 }), n(6, 4, 2, 0.8, { trem: 4 }), n(8, 3, 2, 0.8, { trem: 4 }), n(10, 0, 2, 0.85, { trem: 4 }), nx(12, 0, 4, 0.9, { trem: 8 })]],
            fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), n(4, 0, 2, 0.8, { pm: true }), n(6, 0, 2, 0.7, { pm: true }), n(8, 12, 8, 0.95, { trem: 16 })]],
          },
          {
            name: 'Glissando riff (Chantays-inspired)', replaces: 'Stabs and runs',
            why: 'The slide down from the top of the neck into the root, the minor riff under the changes, the stab on 2 and 4.',
            figure: [sl(0, 14, 0, 4, 0.95), s(4, 2, 0.85, 'high'), n(8, 0, 2, 0.85, { pm: true }), n(10, 3, 2, 0.8), s(12, 2, 0.85, 'high'), n(14, 0, 2, 0.75, { pm: true })],
            variants: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), s(4, 2, 0.85, 'high'), n(6, 0, 2, 0.7, { pm: true }), sl(8, 12, 7, 4, 0.9), s(12, 2, 0.85, 'high'), n(14, 5, 2, 0.75)],
                       [sl(0, 14, 12, 2, 0.95), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85, { trem: 8 }), s(12, 2, 0.85, 'high'), n(14, 0, 2, 0.8)]],
            fills: [[n(0, 12, 2, 0.9, { trem: 4 }), n(2, 9, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), p(8, 3, 0, 4, 0.85), s(12, 2, 0.85, 'high'), n(14, 0, 2, 0.8)]],
            fillsOnChange: [[sl(0, 14, 0, 4, 0.95), s(4, 2, 0.85, 'high'), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), nx(12, 1, 2, 0.8), nx(14, 0, 2, 0.9)]],
            fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), n(4, 0, 2, 0.8, { pm: true }), n(6, 0, 2, 0.7, { pm: true }), n(8, 0, 2, 0.85, { pm: true }), n(10, 0, 2, 0.7, { pm: true }), n(12, 7, 2, 0.8, { pm: true }), n(14, 7, 2, 0.7, { pm: true })]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Instrumental rock', inspired: 'The Shadows ("Apache"), the Ventures ("Walk, Don\'t Run"), Duane Eddy', style: 'surf',
        progression: ['Am', 'G', 'F', 'E', 'Am', 'E'], key: 'A', mode: 'minor', tempo: 140,
        why: `<p>The clean, melodic side: a picked eighth-note bass line on the low strings (Duane Eddy's twang), a melody in single notes with vibrato and slides, the chords stabbed short behind. Slapback echo is the sound. Realised in the minor key.</p>`,
        band: { grid: 16, kick: [0, 8, 10], snare: [4, 12], snareVel: 0.8, hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map((k, i) => ({ slot: k, off: [0, 0, 7, 7, 0, 0, 12, 7][i], dur: 1.8, vel: i % 2 ? 0.7 : 0.9 })), bassApproach: true,
                chord: [{ slot: 2, dur: 1.5, vel: 0.5 }, { slot: 6, dur: 1.5, vel: 0.5 }, { slot: 10, dur: 1.5, vel: 0.5 }, { slot: 14, dur: 1.5, vel: 0.5 }], slapback: true },
        parts: [
          {
            name: 'Twang melody',
            why: 'The melody on the low strings, picked, with a slide into the root and vibrato on the long notes; the changes are approached from a step above.',
            figure: [sl(0, -2, 0, 4, 0.9, { vib: true }), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), n(8, 7, 6, 0.9, { vib: true }), n(14, 5, 2, 0.75)],
            variants: [[n(0, 7, 4, 0.9, { vib: true }), n(4, 5, 2, 0.8), n(6, 3, 2, 0.8), sl(8, -2, 0, 8, 0.9, { vib: true })], [n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), n(4, 3, 2, 0.8, { pm: true }), n(6, 0, 2, 0.7, { pm: true }), n(8, 5, 2, 0.85, { pm: true }), n(10, 3, 2, 0.75, { pm: true }), n(12, 0, 4, 0.85, { vib: true })]],
            fills: [[n(0, 12, 2, 0.9, { trem: 4 }), n(2, 10, 2, 0.8), n(4, 7, 4, 0.85, { vib: true }), n(8, 5, 2, 0.8), n(10, 3, 2, 0.8), n(12, 0, 4, 0.9, { vib: true })]],
            fillsOnChange: [[sl(0, -2, 0, 4, 0.9, { vib: true }), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), n(8, 7, 4, 0.85), nx(12, 2, 2, 0.8), nx(14, 0, 2, 0.9)]],
            fillsOnStay: [[n(0, 0, 4, 0.9, { vib: true }), n(4, 0, 2, 0.7, { pm: true }), n(6, 3, 2, 0.8), n(8, 5, 4, 0.85, { vib: true }), n(12, 3, 2, 0.8), n(14, 0, 2, 0.8)]],
          },
        ],
      },
    ],
  });
})();
