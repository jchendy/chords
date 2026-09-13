// Proposals, part 4: 6/8 ballad, reggae, ska, soul, pop, funk, disco, metal —
// and the engine list.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { n, nx, s, g, d, b, h, p, sl, chug } = GT.reviewHelpers;
  const genres = GT.review.genres;

  // a bar of sixteenth-note scratches with the chord on the given slots
  const scratch = (hits, voicing = 'high', vel = 0.8) =>
    Array.from({ length: 16 }, (_, k) => hits.includes(k) ? s(k, 1, vel, voicing) : g(k, 1, 0.25, voicing));

  // =========================================================================
  genres.push({
    id: 'ballad', name: '6/8 ballad',
    research: `
      <p><b>What the players actually do.</b> "Unchained Melody", "Earth Angel", "When a Man Loves a Woman", "House of the Rising Sun": twelve to the bar, the chord broken across the beat — root, 5th, octave, 3rd — with the whole chord on one; the bass in two; brushes or a light kit with the snare on 4 (or 2 and 4). The soul version (Percy Sledge, Otis Redding's "Try a Little Tenderness") adds 6ths and triplet fills that build.</p>
      <p><b>What the app has now, and what is off about it.</b> Close: the arpeggio is right. Missing are the snare on 4 alone (the slow-ballad backbeat), the 6ths, and the build.</p>`,
    existing: [
      {
        style: 'ballad', label: '6/8 ballad',
        verdict: `<p>Band: the snare on 4 alone with a ghost on the last triplet, the ride kept, the bass in two with an approach into changes. Guitar: the arpeggio kept; a 6ths part for the soul ballad added; the fills build toward the change.</p>`,
        band: { snare: [9], snareVel: 0.7, ghost: [8], bass: [{ slot: 0, off: 0, dur: 6, vel: 0.9 }, { slot: 6, off: 7, dur: 6, vel: 0.75 }], bassApproach: true },
        parts: [
          {
            name: '6ths and triplets (soul ballad)', replaces: 'Chord and answer',
            why: '6ths on one and three — the 3rd over the root, the 2nd over the 7th — slid into, with a triplet run into the next chord and the chord opened on the stay fill.',
            figure: [d(0, 4, 12, 3, 0.8), d(3, 4, 12, 3, 0.55), d(6, 2, 11, 3, 0.75), d(9, 0, 9, 3, 0.7)],
            variants: [[s(0, 6, 0.8), d(6, 4, 12, 3, 0.7), d(9, 2, 11, 3, 0.65)], [d(0, 4, 12, 6, 0.8), n(6, 12, 1, 0.65), n(7, 11, 1, 0.6), n(8, 9, 1, 0.65), d(9, 4, 12, 3, 0.7)]],
            fills: [[d(0, 4, 12, 3, 0.8), n(3, 7, 1, 0.65), n(4, 9, 1, 0.65), n(5, 12, 1, 0.7), n(6, 14, 3, 0.75), n(9, 12, 1, 0.65), n(10, 9, 1, 0.65), n(11, 7, 1, 0.7)]],
            fillsOnChange: [[d(0, 4, 12, 3, 0.8), d(3, 4, 12, 3, 0.55), n(6, 7, 1, 0.65), n(7, 9, 1, 0.7), n(8, 12, 1, 0.75), nx(9, 5, 1.5, 0.65), nx(10.5, 4, 1.5, 0.8, { vib: true })]],
            fillsOnStay: [[s(0, 9, 0.8), n(9, 4, 1, 0.65), n(10, 5, 1, 0.65), n(11, 7, 1, 0.7)]],
          },
        ],
      },
    ],
    additions: [],
  });

  // =========================================================================
  genres.push({
    id: 'reggae', name: 'Reggae',
    research: `
      <p><b>What the players actually do.</b> The skank — a short chord on every offbeat, high, muted just after — is the guitar's job (Bob Marley's own rhythm, Al Anderson and Junior Marvin in the Wailers); the keyboard "bubble" doubles it with a bounce. Ernest Ranglin invented the muted upstroke and plays melodic lines in the gaps. The drums are the one drop (nothing on one, kick and rim together on three) for roots, or steppers (kick on every beat, "Exodus") for the harder feel; rocksteady before it was slower, with a more melodic bass. The bass leaves the one alone and lands on the "and".</p>
      <p><b>What the app has now, and what is off about it.</b> One feel — the one drop — and the skank is fine; there is no steppers, no rocksteady, no double-skank sixteenths, and the bass is plainer than the idiom.</p>`,
    existing: [
      {
        style: 'reggae', label: 'Reggae', rename: 'One drop',
        verdict: `<p>Band: hat opens on the "and of 4", the bass syncopated — root on 1, the and of 2, the 5th on the and of 3 — with a rest before the one. Guitar: the skank tightened to sixteenth-length chords, the double skank as the variant, Ranglin-style lines in the gaps with slides.</p>`,
        band: { hatOpen: [14], bass: [{ slot: 0, off: 0, dur: 4, vel: 0.9 }, { slot: 6, off: 0, dur: 2, vel: 0.7 }, { slot: 10, off: 7, dur: 2, vel: 0.75 }, { slot: 12, off: 10, dur: 2, vel: 0.7 }] },
        parts: [
          {
            name: 'Skank, tight', replaces: 'Skank',
            why: 'The chord on every and, a sixteenth long, muted after; the double skank (two sixteenths) as the variant; a line in the gap — the root slid into from below — on the fill.',
            figure: [s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute')],
            variants: [[s(2, 1, 0.8, 'high', 'mute'), s(3, 1, 0.5, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(7, 1, 0.5, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(11, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute'), s(15, 1, 0.5, 'high', 'mute')],
                       [s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute'), s(15, 1, 0.5, 'high', 'mute')]],
            fills: [[s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), sl(8, -2, 0, 2, 0.8), n(11, 10, 1, 0.65), n(12, 7, 2, 0.7), s(14, 1, 0.8, 'high', 'mute')]],
            fillsOnChange: [[s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), n(12, 7, 2, 0.7), nx(14, -1, 2, 0.75)]],
            fillsOnStay: [[d(2, 4, 7, 1, 0.8), d(6, 4, 7, 1, 0.8), d(10, 5, 9, 1, 0.75), d(14, 4, 7, 1, 0.8)]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Steppers', inspired: 'Bob Marley and the Wailers ("Exodus"), Burning Spear, Sly & Robbie', style: 'reggae',
        progression: ['Am', 'Am', 'Dm', 'Am', 'Em', 'Am'], key: 'A', mode: 'minor', tempo: 78,
        why: `<p>The kick on every beat — the "four on the floor" of roots reggae — with the snare on 3, the skank on the ands and a heavier, busier bass. Minor, marching.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [8], snareVel: 0.6, rim: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 4, off: 0, dur: 1.5, vel: 0.6 }, { slot: 6, off: 7, dur: 2, vel: 0.75 }, { slot: 8, off: 10, dur: 2, vel: 0.75 }, { slot: 12, off: 0, dur: 2, vel: 0.8 }, { slot: 14, off: 3, dur: 2, vel: 0.65 }],
                chord: [2, 6, 10, 14].map(k => ({ slot: k, dur: 1.2, vel: 0.65 })) },
        parts: [
          {
            name: 'Skank over steppers',
            why: 'The same skank, with a low root-and-♭7 line answering the bass in the second half of the bar.',
            figure: [s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), n(8, 0, 2, 0.75), s(10, 1, 0.8, 'high', 'mute'), n(12, 10, 2, 0.7), s(14, 1, 0.8, 'high', 'mute')],
            variants: [[s(2, 1, 0.8, 'high', 'mute'), s(3, 1, 0.5, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(7, 1, 0.5, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(11, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute'), s(15, 1, 0.5, 'high', 'mute')],
                       [s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute')]],
            fills: [[s(2, 1, 0.8, 'high', 'mute'), n(4, 12, 2, 0.75), n(6, 10, 2, 0.7), n(8, 7, 2, 0.75), s(10, 1, 0.8, 'high', 'mute'), n(12, 3, 2, 0.7), n(14, 0, 2, 0.75)]],
            fillsOnChange: [[s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), nx(12, -3, 2, 0.7), nx(14, -1, 2, 0.75)]],
          },
        ],
      },
      {
        label: 'Rocksteady', inspired: 'Alton Ellis, the Paragons, Toots & the Maytals', style: 'reggae',
        progression: ['C', 'Am', 'F', 'G', 'C', 'G'], key: 'C', tempo: 70,
        why: `<p>Slower than ska, before reggae: the skank on the ands, a soulful melodic bass that walks, the one drop, and a guitar line that follows the vocal — 3rds on the offbeats. Doo-wop chords at a Kingston tempo.</p>`,
        band: { grid: 16, kick: [8], snare: [8], snareVel: 0.5, hat: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 4, vel: 0.85 }, { slot: 6, off: 4, dur: 2, vel: 0.65 }, { slot: 8, off: 7, dur: 4, vel: 0.8 }, { slot: 12, off: 9, dur: 2, vel: 0.65 }, { slot: 14, off: 12, dur: 2, vel: 0.65 }], bassApproach: true,
                chord: [2, 6, 10, 14].map(k => ({ slot: k, dur: 1.5, vel: 0.6 })) },
        parts: [
          {
            name: '3rds on the offbeat',
            why: 'Double stops in 3rds instead of the chord on the ands, moving with the melody, and the plain skank as the variant.',
            figure: [d(2, 4, 7, 1.5, 0.75), d(6, 4, 7, 1.5, 0.75), d(10, 5, 9, 1.5, 0.7), d(14, 4, 7, 1.5, 0.75)],
            variants: [[s(2, 1.5, 0.75, 'high', 'mute'), s(6, 1.5, 0.75, 'high', 'mute'), s(10, 1.5, 0.75, 'high', 'mute'), s(14, 1.5, 0.75, 'high', 'mute')],
                       [d(2, 7, 12, 1.5, 0.75), d(6, 7, 12, 1.5, 0.75), d(10, 9, 12, 1.5, 0.7), d(14, 7, 12, 1.5, 0.75)]],
            fills: [[d(2, 4, 7, 1.5, 0.75), d(6, 4, 7, 1.5, 0.75), n(8, 12, 2, 0.7), n(10, 9, 2, 0.65), n(12, 7, 2, 0.7), n(14, 4, 2, 0.7)]],
            fillsOnChange: [[d(2, 4, 7, 1.5, 0.75), d(6, 4, 7, 1.5, 0.75), d(10, 4, 7, 1.5, 0.7), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.75)]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'ska', name: 'Ska',
    research: `
      <p><b>What the players actually do.</b> Jamaican ska (the Skatalites, Prince Buster) swings — the upstroke on every offbeat, light, over a walking bass and a lighter kit, the horns carrying the melody. 2 Tone (the Specials, Madness, the Beat) is faster, choppier and straighter, with punk attack and the guitar more forward; third-wave is faster still. The upstroke is muted as soon as it sounds, and a muted downstroke "chunk" on the beat gives the hand its motor.</p>
      <p><b>What the app has now, and what is off about it.</b> One straight ska at a 2 Tone tempo; no swung original, no muted chunks on the beat, no walking-bass chromatics.</p>`,
    existing: [
      {
        style: 'ska', label: 'Ska', rename: 'Ska (2 Tone)',
        verdict: `<p>Band: open hat on the "and of 4", a rim on 2 and 4 with the snare, the bass approaching changes. Guitar: the upstrokes with a muted chunk on every beat so the hand is a motor; the walking line with chromatic passing notes.</p>`,
        band: { hatOpen: [14], rim: [4, 12], bassApproach: true, fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Chunk and upstroke', replaces: 'Upstrokes',
            why: 'A muted downstroke on every beat (the chunk), the chord up on every and, short. The change fill walks up chromatically.',
            figure: [g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), g(8, 1, 0.3, 'low'), s(10, 1, 0.8, 'high', 'mute'), g(12, 1, 0.3, 'low'), s(14, 1, 0.8, 'high', 'mute')],
            variants: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(5, 1, 0.5, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), g(8, 1, 0.3, 'low'), s(10, 1, 0.8, 'high', 'mute'), g(12, 1, 0.3, 'low'), s(13, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute')],
                       [s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute')]],
            fills: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), h(8, 10, 12, 4, 0.85), n(12, 7, 2, 0.75), n(14, 9, 2, 0.7)]],
            fillsOnChange: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.75), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
            fillsOnStay: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), g(8, 1, 0.3, 'low'), s(10, 1, 0.8, 'high', 'mute'), s(13, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute'), s(15, 1, 0.5, 'high', 'mute')]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Ska (Jamaican)', inspired: 'the Skatalites ("Guns of Navarone"), Prince Buster, Ernest Ranglin', style: 'ska',
        progression: ['C', 'C', 'F', 'G', 'C', 'G'], key: 'C', tempo: 128,
        why: `<p>The original, swung: a walking bass in quarters, the kit light with the snare on 2 and 4, the upstroke on every swung offbeat, a horn-like riff in the fills. Twelve to the bar.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.6, snare: [3, 9], snareVel: 0.65, hat: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'triad',
                bass: [{ slot: 0, walk: 0, dur: 2.6, vel: 0.9 }, { slot: 3, walk: 2, dur: 2.6, vel: 0.75 }, { slot: 6, walk: 1, dur: 2.6, vel: 0.85 }, { slot: 9, walk: 3, dur: 2.6, vel: 0.75 }],
                chord: [{ slot: 2, dur: 0.8, vel: 0.6 }, { slot: 5, dur: 0.8, vel: 0.6 }, { slot: 8, dur: 0.8, vel: 0.6 }, { slot: 11, dur: 0.8, vel: 0.6 }] },
        parts: [
          {
            name: 'Swung upstrokes',
            why: 'The chord on every swung upbeat, muted; the fill a riff in the horns\' place — 5, 6, octave — swung.',
            figure: [s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), s(8, 0.8, 0.8, 'high', 'mute'), s(11, 0.8, 0.8, 'high', 'mute')],
            variants: [[g(0, 0.5, 0.3, 'low'), s(2, 0.8, 0.8, 'high', 'mute'), g(3, 0.5, 0.3, 'low'), s(5, 0.8, 0.8, 'high', 'mute'), g(6, 0.5, 0.3, 'low'), s(8, 0.8, 0.8, 'high', 'mute'), g(9, 0.5, 0.3, 'low'), s(11, 0.8, 0.8, 'high', 'mute')],
                       [s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), s(8, 0.8, 0.8, 'high', 'mute'), s(11, 0.8, 0.8, 'high', 'mute'), n(9, 0, 1.6, 0.6)]],
            fills: [[s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), n(6, 7, 1.6, 0.8), n(8, 9, 0.8, 0.7), n(9, 12, 1.6, 0.85), n(11, 9, 0.8, 0.7)]],
            fillsOnChange: [[s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), n(6, 4, 1.6, 0.8), n(8, 7, 0.8, 0.7), nx(9, -2, 1.6, 0.8), nx(11, -1, 0.8, 0.85)]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'soul', name: 'Soul',
    research: `
      <p><b>What the players actually do.</b> Stax (Steve Cropper with Booker T. & the M.G.'s, Otis Redding): 6ths slid into, muted chords on the backbeat, one- and two-note fills outlining the chord, restraint. Motown (Robert White, Eddie Willis, Joe Messina — three guitars at once): a trebly "chank" on 2 and 4 with the snare on every beat, octave stabs in eighths, a pentatonic riff doubling the bass. Curtis Mayfield: hammered double stops, 6ths over minor 7ths, a rolling pattern. Cornell Dupree and the Muscle Shoals players: the pocket line. Neo-soul (D'Angelo, Erykah Badu's bands, the Isley Brothers' "Footsteps in the Dark" as the ancestor): swung sixteenths, 9th and 11th chords, arpeggios through chorus.</p>
      <p><b>What the app has now, and what is off about it.</b> One soul, Stax-ish, whose stabs are off the beat but whose 6ths are only in the fills. Nothing Motown (the snare on every beat is a different music), nothing Mayfield, nothing swung-16th.</p>`,
    existing: [
      {
        style: 'soul', label: 'Soul', rename: 'Memphis soul (Cropper-inspired)',
        verdict: `<p>Band: ghost 16ths on the snare, open hat on the "and of 4", bass approaching changes. Guitar: the 6ths slid into on 1 and 3 become the figure, with a muted chord on 2 and 4 between them; fills stay to one or two notes.</p>`,
        band: { ghost: [3, 11], hatOpen: [14], bassApproach: true, fill: { snare: [8, 10, 12, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: '6ths and muted backbeat', replaces: 'Stabs and double stops',
            why: 'A 6th slid into on one, the chord muted on two, another 6th on three, muted on four. Two notes at a time; the fill is one note.',
            figure: [d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), d(8, 2, 11, 3, 0.75), s(12, 1, 0.55, 'high', 'mute'), n(14, 0, 2, 0.6)],
            variants: [[d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), d(8, 0, 9, 3, 0.75), s(12, 1, 0.55, 'high', 'mute'), d(14, 4, 12, 2, 0.6)],
                       [s(2, 2, 0.6, 'high'), s(4, 1, 0.55, 'high', 'mute'), s(6, 2, 0.6, 'high'), d(8, 4, 12, 3, 0.75), s(12, 1, 0.55, 'high', 'mute'), s(14, 2, 0.6, 'high')]],
            fills: [[d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), sl(8, 3, 4, 4, 0.8), s(12, 1, 0.55, 'high', 'mute'), n(14, 7, 2, 0.65)]],
            fillsOnChange: [[d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), n(8, 7, 2, 0.75), n(10, 9, 2, 0.7), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.8)]],
            fillsOnStay: [[d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), h(8, 5, 7, 4, 0.8), s(12, 1, 0.55, 'high', 'mute'), n(14, 0, 2, 0.65)]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Motown', inspired: 'the Funk Brothers (Robert White, Eddie Willis, Joe Messina), James Jamerson', style: 'soul',
        progression: ['C', 'Am', 'F', 'G', 'C', 'G'], key: 'C', tempo: 120,
        why: `<p>The snare on every beat, tambourine-bright hats, a bass line that never stops moving (root, octave, chromatic approaches), and three guitar jobs in one part: the trebly chank on 2 and 4, octave stabs in eighths, and a pentatonic riff on the way to the change.</p>`,
        band: { grid: 16, kick: [0, 8], snare: [0, 4, 8, 12], snareVel: 0.75, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [2, 6, 10, 14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 2, vel: 0.9 }, { slot: 3, off: 12, dur: 1, vel: 0.6 }, { slot: 4, off: 0, dur: 2, vel: 0.8 }, { slot: 6, off: 7, dur: 2, vel: 0.7 }, { slot: 8, off: 0, dur: 2, vel: 0.85 }, { slot: 10, off: 12, dur: 2, vel: 0.7 }, { slot: 12, off: 9, dur: 2, vel: 0.7 }, { slot: 14, off: 10, dur: 2, vel: 0.7 }], bassApproach: true,
                chord: [{ slot: 4, dur: 1.5, vel: 0.6 }, { slot: 12, dur: 1.5, vel: 0.6 }] },
        parts: [
          {
            name: 'Chank and octaves',
            why: 'The trebly chord on 2 and 4, short; octave stabs in eighths on 3 in the variant; the pentatonic riff into the change.',
            figure: [s(4, 1.5, 0.75, 'high'), s(12, 1.5, 0.75, 'high')],
            variants: [[s(4, 1.5, 0.75, 'high'), d(8, 0, 12, 2, 0.7), d(10, 0, 12, 2, 0.6), s(12, 1.5, 0.75, 'high'), d(14, 0, 12, 2, 0.6)],
                       [d(0, 0, 12, 2, 0.7), d(2, 0, 12, 2, 0.6), s(4, 1.5, 0.75, 'high'), d(8, 7, 19, 2, 0.7), d(10, 7, 19, 2, 0.6), s(12, 1.5, 0.75, 'high')]],
            fills: [[s(4, 1.5, 0.75, 'high'), n(8, 0, 2, 0.8), n(10, 2, 2, 0.75), n(12, 4, 2, 0.8), n(14, 7, 2, 0.8)]],
            fillsOnChange: [[s(4, 1.5, 0.75, 'high'), n(8, 7, 2, 0.8), n(10, 9, 2, 0.75), nx(12, 5, 2, 0.7), nx(14, 4, 2, 0.8)]],
            fillsOnStay: [[s(4, 1.5, 0.75, 'high'), d(6, 0, 12, 2, 0.6), d(8, 0, 12, 2, 0.7), d(10, 0, 12, 2, 0.6), s(12, 1.5, 0.75, 'high')]],
          },
        ],
      },
      {
        label: 'Sweet soul', inspired: 'Curtis Mayfield (the Impressions, "Superfly" era), Isaac Hayes\' guitarists', style: 'soul',
        progression: ['Am7', 'Dm7', 'Am7', 'Dm7', 'Fmaj7', 'G7'], key: 'A', mode: 'minor', tempo: 88, scaleTheory: 'modal',
        why: `<p>Hammered double stops rolling through the chord — the 2nd onto the 3rd, the 4th onto the 5th — 6ths over the minor 7th, a sixteenth-note hat and a bass that sits. Quiet and busy at once.</p>`,
        band: { grid: 16, kick: [0, 6, 8], kickVel: 0.7, snare: [4, 12], snareVel: 0.6, ghost: [7, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 5, vel: 0.85 }, { slot: 6, off: 7, dur: 2, vel: 0.65 }, { slot: 8, off: 10, dur: 4, vel: 0.75 }, { slot: 12, off: 0, dur: 4, vel: 0.75 }],
                chord: [{ slot: 2, dur: 2, vel: 0.45 }, { slot: 10, dur: 2, vel: 0.45 }] },
        parts: [
          {
            name: 'Rolling hammer-ons',
            why: 'Double stops with one note hammered: the ♭3 (or 2nd) onto the 3rd over the 5th, the 4th onto the 5th over the octave; a 6th at the end of the bar.',
            figure: [h(0, 2, 3, 2, 0.75), n(2, 7, 2, 0.6), h(4, 5, 7, 2, 0.75), n(6, 12, 2, 0.6), h(8, 2, 3, 2, 0.75), n(10, 7, 2, 0.6), d(12, 3, 12, 4, 0.75)],
            variants: [[d(0, 3, 7, 2, 0.75), h(2, 5, 7, 2, 0.7), d(4, 7, 12, 2, 0.7), h(6, 9, 10, 2, 0.7), d(8, 3, 7, 2, 0.75), h(10, 5, 7, 2, 0.7), d(12, 0, 9, 4, 0.75)],
                       [s(0, 4, 0.6, 'high'), h(4, 2, 3, 2, 0.75), n(6, 7, 2, 0.6), s(8, 4, 0.6, 'high'), h(12, 5, 7, 2, 0.75), n(14, 12, 2, 0.6)]],
            fills: [[n(0, 12, 2, 0.8, { vib: true }), h(4, 9, 10, 2, 0.7), n(6, 7, 2, 0.65), h(8, 2, 3, 2, 0.75), n(10, 0, 2, 0.65), d(12, 3, 12, 4, 0.75)]],
            fillsOnChange: [[h(0, 2, 3, 2, 0.75), n(2, 7, 2, 0.6), h(4, 5, 7, 2, 0.75), n(6, 12, 2, 0.6), n(8, 10, 2, 0.7), n(10, 7, 2, 0.65), nx(12, 5, 2, 0.65), nx(14, 3, 2, 0.75)]],
          },
        ],
      },
      {
        label: 'Neo-soul', inspired: "D'Angelo's bands, Erykah Badu, the Isley Brothers (\"Footsteps in the Dark\")", style: 'soul',
        progression: ['Em7', 'Am7', 'Em7', 'Am7', 'Cmaj7', 'B7'], key: 'E', mode: 'minor', tempo: 84, scaleTheory: 'modal',
        why: `<p>Sixteenths swung hard, the kit lazy behind the beat, 9th and 11th chords arpeggiated through a chorus pedal, the bass simple. Needs swung sixteenths in the engine and — for the sound — a chorus tone.</p>`,
        band: { grid: 16, kick: [0, 7, 10], kickVel: 0.8, snare: [4, 12], snareVel: 0.65, ghost: [6, 14, 15], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [10], swing: 0.6, voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 6, vel: 0.85 }, { slot: 7, off: 0, dur: 1, vel: 0.5 }, { slot: 8, off: 7, dur: 4, vel: 0.7 }, { slot: 14, off: 10, dur: 2, vel: 0.6 }],
                chord: [{ slot: 0, dur: 6, vel: 0.4 }, { slot: 10, dur: 4, vel: 0.4 }] },
        parts: [
          {
            name: 'Swung arpeggios',
            why: 'The chord broken in swung sixteenths with the 9th and the 11th on top, the ♭7 answering, and a slide into the 3rd at the change.',
            figure: [n(0, 0, 2, 0.7), n(2, 7, 2, 0.55), n(3, 10, 1, 0.55), n(4, 14, 4, 0.65), n(8, 12, 2, 0.6), n(10, 10, 2, 0.55), n(11, 7, 1, 0.5), n(12, 3, 4, 0.65)],
            variants: [[s(0, 4, 0.55, 'shell', null, { add: 14 }), n(6, 10, 2, 0.55), n(8, 12, 2, 0.6), n(10, 14, 1, 0.55), n(11, 12, 1, 0.5), n(12, 10, 4, 0.6)],
                       [n(0, 3, 2, 0.7), n(2, 7, 2, 0.55), n(4, 10, 2, 0.6), n(6, 14, 2, 0.6), n(8, 12, 4, 0.65), n(12, 10, 2, 0.55), n(14, 7, 2, 0.55)]],
            fills: [[n(0, 12, 2, 0.7, { vib: true }), n(3, 10, 1, 0.55), n(4, 7, 2, 0.6), n(6, 5, 2, 0.55), n(8, 3, 4, 0.65, { vib: true }), n(12, 0, 4, 0.6)]],
            fillsOnChange: [[n(0, 0, 2, 0.7), n(2, 7, 2, 0.55), n(4, 10, 2, 0.6), n(6, 12, 2, 0.55), n(8, 10, 2, 0.6), n(10, 7, 2, 0.55), nx(12, 5, 2, 0.55), nx(14, 3, 2, 0.7)]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'pop', name: 'Pop',
    research: `
      <p><b>What the players actually do.</b> The acoustic pop strum is down-down-up-up-down-up with the hand muting the strings on 2 and 4 for a "chuck", and sixteenth-note ghost strums keeping the motor going (Ed Sheeran, Jason Mraz). Andy Summers with the Police ("Message in a Bottle", "Every Breath You Take") arpeggiates add9 chords in eighths through chorus and delay. Modern pop rhythm guitar is often a clean single-note hook doubled with the synth (Daft Punk / Nile Rodgers on "Get Lucky" is disco, see there). The band is four on the floor or a straight backbeat, the bass on the root.</p>
      <p><b>What the app has now, and what is off about it.</b> The strum pattern is right but has no chucks or ghost sixteenths; no add9 arpeggio style; the fills are melodies where pop guitar mostly repeats a hook.</p>`,
    existing: [
      {
        style: 'pop', label: 'Pop', rename: 'Pop (four on the floor)',
        verdict: `<p>Band: open hat on the ands, a clap-like snare ghost, bass approaching changes. Guitar: the strum with muted chucks on 2 and 4 and ghost sixteenths; a hook part — a two-bar single-note figure that repeats — instead of melodic fills.</p>`,
        band: { hatOpen: [2, 6, 10, 14], ghost: [7, 15], bassApproach: true },
        parts: [
          {
            name: 'Strum with chucks', replaces: 'Down down up up down up',
            why: 'Down, down, up, up, down, up — with the hand slapping the strings on 2 and 4 (a muted chuck) and quiet ghost sixteenths between, so the pattern breathes and drives at once.',
            figure: [s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 4, 0.55, 'high'), g(8, 1, 0.25), s(10, 2, 0.55, 'high'), s(12, 1, 0.7, 'full', 'mute'), s(14, 2, 0.55, 'high')],
            variants: [[s(0, 2, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 2, 0.55, 'high'), s(8, 2, 0.8), g(10, 1, 0.25), s(12, 1, 0.7, 'full', 'mute'), s(14, 2, 0.55, 'high'), g(15, 1, 0.25)],
                       [s(0, 2, 0.85, 'bass'), s(2, 2, 0.6, 'high'), s(4, 1, 0.7, 'full', 'mute'), s(6, 4, 0.55, 'high'), s(10, 2, 0.55, 'high'), s(12, 1, 0.7, 'full', 'mute'), s(14, 2, 0.55, 'high')]],
            fills: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 4, 0.55, 'high'), h(10, 4, 5, 2, 0.7), s(12, 1, 0.7, 'full', 'mute'), p(14, 5, 4, 2, 0.7)]],
            fillsOnChange: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 4, 0.55, 'high'), n(10, 7, 2, 0.7), nx(12, 2, 2, 0.7), nx(14, 0, 2, 0.8)]],
            fillsOnStay: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 4, 0.55, 'high'), g(10, 1, 0.25), s(11, 1, 0.5, 'high'), s(12, 1, 0.7, 'full', 'mute'), s(14, 2, 0.55, 'high'), s(15, 1, 0.5, 'high')]],
          },
          {
            name: 'The hook', replaces: 'Broken chord and strum',
            why: 'A two-bar single-note figure — 5, 6, octave, 6 / 5, 3, root — that repeats through the chords, the way a pop guitar hook does, with a strum only at the change.',
            figure: [n(0, 7, 2, 0.8), n(2, 9, 2, 0.7), n(4, 12, 4, 0.8), n(8, 9, 2, 0.7), n(10, 7, 2, 0.75), n(12, 4, 4, 0.75)],
            variants: [[n(0, 7, 2, 0.8), n(2, 9, 2, 0.7), n(4, 12, 4, 0.8), n(8, 14, 2, 0.7), n(10, 12, 2, 0.75), n(12, 7, 4, 0.75)], [n(0, 0, 2, 0.8), n(2, 4, 2, 0.7), n(4, 7, 4, 0.8), n(8, 9, 2, 0.7), n(10, 7, 2, 0.75), n(12, 4, 4, 0.75)]],
            fills: [[n(0, 7, 2, 0.8), n(2, 9, 2, 0.7), n(4, 12, 4, 0.8), n(8, 9, 2, 0.7), n(10, 7, 2, 0.75), n(12, 4, 2, 0.75), n(14, 0, 2, 0.75)]],
            fillsOnChange: [[n(0, 7, 2, 0.8), n(2, 9, 2, 0.7), n(4, 12, 4, 0.8), n(8, 9, 2, 0.7), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.8)]],
            fillsOnStay: [[n(0, 7, 2, 0.8), n(2, 9, 2, 0.7), n(4, 12, 4, 0.8), s(8, 4, 0.7), s(12, 1, 0.65, 'full', 'mute'), s(14, 2, 0.55, 'high')]],
          },
        ],
      },
    ],
    additions: [
      {
        label: '80s pop', inspired: 'Andy Summers (the Police), the Edge (U2\'s "Where the Streets Have No Name"), the Cure', style: 'pop',
        progression: ['C#m', 'A', 'B', 'F#m', 'C#m', 'A'], key: 'C#', mode: 'minor', tempo: 132, scaleTheory: 'modal',
        why: `<p>Add9 chords arpeggiated in eighths — root, 5th, 9th, octave — through chorus and delay, over a four-on-the-floor kick with eighth-note hats and a bass on eighths. The add9 is the 9 in the palette; the tone is an engine proposal.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [4, 12], snareVel: 0.8, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: 0, dur: 1.8, vel: k % 4 ? 0.7 : 0.85 })), bassApproach: true, chord: [{ slot: 0, dur: 8, vel: 0.35 }, { slot: 8, dur: 8, vel: 0.35 }] },
        parts: [
          {
            name: 'Add9 arpeggio',
            why: 'Root, 5th, 9th, octave in eighths, the 9th ringing against the root — the Summers stretch — and the 5th up to the 9th in the variant.',
            figure: [n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 14, 2, 0.7), n(6, 12, 2, 0.65), n(8, 0, 2, 0.8), n(10, 7, 2, 0.65), n(12, 14, 2, 0.7), n(14, 12, 2, 0.65)],
            variants: [[n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 12, 2, 0.7), n(6, 14, 2, 0.65), n(8, 12, 2, 0.7), n(10, 7, 2, 0.65), n(12, 14, 2, 0.7), n(14, 7, 2, 0.65)],
                       [n(0, 0, 1, 0.8), n(1, 7, 1, 0.55), n(2, 14, 1, 0.65), n(3, 12, 1, 0.6), n(4, 0, 1, 0.75), n(5, 7, 1, 0.55), n(6, 14, 1, 0.65), n(7, 12, 1, 0.6), n(8, 0, 1, 0.8), n(9, 7, 1, 0.55), n(10, 14, 1, 0.65), n(11, 12, 1, 0.6), n(12, 0, 1, 0.75), n(13, 7, 1, 0.55), n(14, 14, 1, 0.65), n(15, 12, 1, 0.6)]],
            fills: [[n(0, 12, 2, 0.8), n(2, 14, 2, 0.65), n(4, 12, 2, 0.7), n(6, 7, 2, 0.65), n(8, 3, 4, 0.75), n(12, 0, 4, 0.8)]],
            fillsOnChange: [[n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 14, 2, 0.7), n(6, 12, 2, 0.65), n(8, 7, 2, 0.7), n(10, 3, 2, 0.65), nx(12, 7, 2, 0.65), nx(14, 0, 2, 0.8)]],
          },
        ],
      },
      {
        label: 'Acoustic pop', inspired: 'Ed Sheeran, Jason Mraz, John Mayer\'s acoustic side', style: 'pop',
        progression: ['G', 'D', 'Em', 'C', 'G', 'D'], key: 'G', tempo: 100,
        why: `<p>The percussive strum: sixteenth ghosts all the time, the chord on 1 and the and of 2, a slap on 2 and 4 that is all mute, a bass-note walk into the change, and hammer-ons inside the chord shape. No kit, or a light one; the bass in two.</p>`,
        band: { grid: 16, kick: [0, 8], kickVel: 0.5, snare: [4, 12], snareVel: 0.4, ghost: [6, 14], hat: [], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 6, vel: 0.8 }, { slot: 8, off: 7, dur: 6, vel: 0.65 }], bassApproach: true, chord: [] },
        parts: [
          {
            name: 'Percussive strum',
            why: 'The chord on one and the and of two, a dead slap on two and four, ghosts everywhere else, and the 2nd hammered onto the 3rd inside the shape.',
            figure: [s(0, 4, 0.85), g(1, 1, 0.2), g(2, 1, 0.25), g(3, 1, 0.2), s(4, 1, 0.75, 'full', 'mute'), g(5, 1, 0.2), s(6, 3, 0.6, 'high'), g(7, 1, 0.2), g(8, 1, 0.3), g(9, 1, 0.2), s(10, 2, 0.55, 'high'), g(11, 1, 0.2), s(12, 1, 0.75, 'full', 'mute'), g(13, 1, 0.2), s(14, 2, 0.55, 'high'), g(15, 1, 0.2)],
            variants: [[s(0, 2, 0.85, 'bass'), s(2, 2, 0.6, 'high'), s(4, 1, 0.75, 'full', 'mute'), s(6, 2, 0.6, 'high'), h(8, 2, 4, 2, 0.6), s(10, 2, 0.55, 'high'), s(12, 1, 0.75, 'full', 'mute'), s(14, 2, 0.55, 'high')],
                       [s(0, 4, 0.85), s(4, 1, 0.75, 'full', 'mute'), s(6, 2, 0.6, 'high'), g(8, 1, 0.3), s(10, 2, 0.55, 'high'), s(12, 1, 0.75, 'full', 'mute'), g(13, 1, 0.2), s(14, 2, 0.55, 'high'), g(15, 1, 0.2)]],
            fills: [[s(0, 4, 0.85), s(4, 1, 0.75, 'full', 'mute'), s(6, 2, 0.6, 'high'), h(8, 2, 4, 2, 0.65), n(10, 7, 2, 0.6), s(12, 1, 0.75, 'full', 'mute'), p(14, 5, 4, 2, 0.6)]],
            fillsOnChange: [[s(0, 4, 0.85), s(4, 1, 0.75, 'full', 'mute'), s(6, 2, 0.6, 'high'), n(8, 7, 2, 0.7, { pm: true }), n(10, 9, 2, 0.65, { pm: true }), nx(12, -2, 2, 0.75, { pm: true }), nx(14, -1, 2, 0.8, { pm: true })]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'funk', name: 'Funk',
    research: `
      <p><b>What the players actually do.</b> Jimmy Nolen with James Brown ("Papa's Got a Brand New Bag", "Cold Sweat"): the chicken scratch — sixteenths strummed near the bridge with the fretting hand muting between the chord hits, 9th chords, the hit on the One. Leo Nocentelli with the Meters ("Cissy Strut"): single-note syncopated riffs in unison with the bass, palm-muted, second-line drums. Nile Rodgers (Chic, "Good Times", "Le Freak"): three-string chucks, sixteenths, restraint — on the disco page. Prince ("Kiss", "1999"): triads on the top strings in syncopated sixteenths, the minor-I to major-IV Dorian move. Cory Wong: the steady sixteenth motor with fret-hand mutes making the "rhythm within a rhythm". Fela's guitarists in Afrobeat: an interlocking two-bar ostinato that never changes. Tower of Power's Bruce Conte: tight 16th riffs on the One.</p>
      <p><b>What the app has now, and what is off about it.</b> The chops are eighth-and-sixteenth stabs without the continuous scratch under them — the scratch <em>is</em> funk guitar. No 9th chords in the strums, no unison bass-guitar riff, no swung sixteenths, no Dorian minor.</p>`,
    existing: [
      {
        style: 'funk', label: 'Classic funk', rename: 'Classic funk (Nolen-inspired)',
        verdict: `<p>Band: hat sixteenths with the open hat on the "and of 4", ghost snares on the "e" of 2 and the "a" of 4, the bass held to the One with sixteenth syncopations. Guitar: the chicken scratch — sixteenth ghost strums all the way through with the 9th chord on the One and the "a of 2" — replaces the chops; the unison riff (Meters) is a new part.</p>`,
        band: { hatOpen: [14], ghost: [5, 15], fill: { snare: [12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Chicken scratch', replaces: 'The one and the chops',
            why: 'Sixteenths, all sixteen, mostly muted scratches — the chord (with the 9th) sounding on the One, the "a of 2", and the and of 4. The hand never stops. Needs ghost strums and color tones.',
            figure: scratch([0, 7, 14], 'high', 0.85).map(x => x.ghost ? x : { ...x, add: 14 }),
            variants: [scratch([0, 3, 6, 10, 14], 'high', 0.75).map(x => x.ghost ? x : { ...x, add: 14 }), scratch([0, 8, 11], 'high', 0.85).map(x => x.ghost ? x : { ...x, add: 14 })],
            fills: [[...scratch([0, 7], 'high', 0.85).slice(0, 8).map(x => x.ghost ? x : { ...x, add: 14 }), n(8, 0, 1, 0.85), n(10, 10, 1, 0.75), n(11, 12, 1, 0.75), n(12, 7, 2, 0.8), n(14, 10, 1, 0.7), n(15, 12, 1, 0.75)]],
            fillsOnChange: [[...scratch([0, 7], 'high', 0.85).slice(0, 12).map(x => x.ghost ? x : { ...x, add: 14 }), nx(12, -1, 2, 0.75), nx(14, 0, 2, 0.85)]],
            fillsOnStay: [scratch([0, 2, 7, 10, 14], 'high', 0.8).map(x => x.ghost ? x : { ...x, add: 14 })],
          },
          {
            name: 'Unison riff (Nocentelli-inspired)', replaces: 'Single-note groove',
            why: 'A single-note riff the bass could be playing — root, ♭7, root, ♭3, 4, root — palm-muted, in syncopated sixteenths with rests, said the same way twice.',
            figure: [n(0, 0, 1, 0.9, { pm: true }), n(2, 0, 1, 0.55, { pm: true }), n(3, 10, 1, 0.75, { pm: true }), n(6, 12, 1, 0.75, { pm: true }), n(8, 0, 1, 0.85, { pm: true }), n(10, 3, 1, 0.7, { pm: true }), n(11, 5, 1, 0.75, { pm: true }), n(14, 0, 2, 0.8, { pm: true })],
            variants: [[n(0, 0, 1, 0.9, { pm: true }), n(3, 10, 1, 0.75, { pm: true }), n(4, 12, 1, 0.75, { pm: true }), n(7, 10, 1, 0.7, { pm: true }), n(8, 0, 1, 0.85, { pm: true }), n(11, 5, 1, 0.75, { pm: true }), n(12, 7, 1, 0.75, { pm: true }), n(14, 10, 2, 0.75, { pm: true })],
                       scratch([0, 7, 14], 'high', 0.85).map(x => x.ghost ? x : { ...x, add: 14 })],
            fills: [[n(0, 12, 1, 0.9, { pm: true }), n(2, 10, 1, 0.7, { pm: true }), n(3, 7, 1, 0.75, { pm: true }), n(6, 5, 1, 0.75, { pm: true }), n(8, 3, 2, 0.8, { pm: true }), n(11, 0, 1, 0.6, { pm: true }), n(12, 0, 2, 0.85, { pm: true }), n(15, 10, 1, 0.7, { pm: true })]],
            fillsOnChange: [[n(0, 0, 1, 0.9, { pm: true }), n(2, 0, 1, 0.55, { pm: true }), n(3, 10, 1, 0.75, { pm: true }), n(6, 12, 1, 0.75, { pm: true }), n(8, 7, 2, 0.8, { pm: true }), n(10, 10, 2, 0.75, { pm: true }), nx(12, -1, 1, 0.75, { pm: true }), nx(14, 0, 2, 0.85, { pm: true })]],
          },
        ],
      },
      {
        style: 'funk', label: 'Disco', rename: 'Disco (Rodgers-inspired)',
        verdict: `<p>Band: the open hat on every "and" (the disco hat), the bass octaves kept, a snare on 2 and 4 with a ghost on the "a of 4". Guitar: the chuck — three strings, the chord on the ands with muted sixteenths between, the whole thing a sixteenth-note motor with the chords as its accents.</p>`,
        band: { hatOpen: [2, 6, 10, 14], ghost: [15], fill: { snare: [12, 13, 14, 15], kick: [0, 4, 8] } },
        parts: [
          {
            name: 'The chuck', replaces: 'Off-beat chops',
            why: 'Sixteenths all the way, three strings, the chord sounding on the ands and on the "a of 2" — the rest muted chucks. The variant puts the accent on the "e" of each beat instead.',
            figure: scratch([2, 6, 7, 10, 14], 'high', 0.8),
            variants: [scratch([1, 5, 9, 13], 'high', 0.75), scratch([2, 6, 10, 13, 14], 'high', 0.8)],
            fills: [[...scratch([2, 6], 'high', 0.8).slice(0, 8), n(8, 0, 1, 0.8), n(10, 12, 1, 0.7), n(12, 0, 1, 0.8), n(14, 12, 1, 0.7), n(15, 10, 1, 0.65)]],
            fillsOnChange: [[...scratch([2, 6, 10], 'high', 0.8).slice(0, 12), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.8)]],
            fillsOnStay: [scratch([2, 3, 6, 10, 11, 14], 'high', 0.8)],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'New Orleans funk', inspired: 'the Meters ("Cissy Strut", "Look-Ka Py Py"), Dr. John\'s bands', style: 'funk',
        progression: ['C7', 'C7', 'C7', 'F7', 'C7', 'G7'], key: 'C', tempo: 94,
        why: `<p>Second-line drums — the kick syncopated on the "and of 2" and "a of 3", the snare on 2 and 4 with ghosts — under a bass and a guitar playing the same riff, palm-muted, with room in it. Sixteenths slightly swung.</p>`,
        band: { grid: 16, kick: [0, 6, 11], snare: [4, 12], ghost: [3, 7, 10, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [6], swing: 0.3, voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 2, vel: 0.9 }, { slot: 3, off: 10, dur: 1, vel: 0.7 }, { slot: 6, off: 12, dur: 2, vel: 0.75 }, { slot: 8, off: 0, dur: 2, vel: 0.85 }, { slot: 11, off: 3, dur: 1, vel: 0.7 }, { slot: 12, off: 5, dur: 2, vel: 0.75 }, { slot: 14, off: 0, dur: 2, vel: 0.8 }],
                chord: [{ slot: 2, dur: 1, vel: 0.5 }, { slot: 10, dur: 1, vel: 0.5 }] },
        parts: [
          {
            name: 'Riff in unison with the bass',
            why: 'The bass line on the guitar, exactly, palm-muted — root, ♭7, octave, root, ♭3, 4, root — so the two lock; a 9th chop on the "and of 1" in the variant.',
            figure: [n(0, 0, 2, 0.9, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(6, 12, 2, 0.75, { pm: true }), n(8, 0, 2, 0.85, { pm: true }), n(11, 3, 1, 0.7, { pm: true }), n(12, 5, 2, 0.75, { pm: true }), n(14, 0, 2, 0.8, { pm: true })],
            variants: [[n(0, 0, 2, 0.9, { pm: true }), s(2, 1, 0.65, 'high', null, { add: 14 }), n(3, 10, 1, 0.7, { pm: true }), n(6, 12, 2, 0.75, { pm: true }), n(8, 0, 2, 0.85, { pm: true }), s(10, 1, 0.65, 'high', null, { add: 14 }), n(11, 3, 1, 0.7, { pm: true }), n(12, 5, 2, 0.75, { pm: true }), n(14, 0, 2, 0.8, { pm: true })],
                       [n(0, 0, 1, 0.9, { pm: true }), n(1, 0, 1, 0.5, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(4, 12, 1, 0.75, { pm: true }), n(7, 10, 1, 0.7, { pm: true }), n(8, 0, 2, 0.85, { pm: true }), n(11, 3, 1, 0.7, { pm: true }), n(12, 5, 1, 0.75, { pm: true }), n(13, 6, 1, 0.7, { pm: true }), n(14, 7, 2, 0.8, { pm: true })]],
            fills: [[n(0, 12, 2, 0.9, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(6, 7, 2, 0.75, { pm: true }), n(8, 5, 2, 0.8, { pm: true }), n(11, 3, 1, 0.7, { pm: true }), n(12, 0, 4, 0.85, { pm: true })]],
            fillsOnChange: [[n(0, 0, 2, 0.9, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(6, 12, 2, 0.75, { pm: true }), n(8, 10, 2, 0.8, { pm: true }), n(11, 7, 1, 0.7, { pm: true }), nx(12, -1, 2, 0.75, { pm: true }), nx(14, 0, 2, 0.85, { pm: true })]],
          },
        ],
      },
      {
        label: 'Minneapolis', inspired: 'Prince ("Kiss", "1999"), the Time (Jesse Johnson)', style: 'funk',
        progression: ['Am7', 'D7', 'Am7', 'D7', 'Am7', 'G7'], key: 'A', mode: 'minor', tempo: 112, scaleTheory: 'modal',
        why: `<p>Triads on the top three strings in syncopated sixteenths, the minor I to the major IV (Dorian), a drum machine\'s four on the floor with the snare cracking, a synth-like bass on the root. Sparse and exact.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], snare: [4, 12], snareVel: 0.95, hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatOpen: [14], voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 6, off: 0, dur: 1, vel: 0.6 }, { slot: 8, off: 0, dur: 3, vel: 0.85 }, { slot: 14, off: 10, dur: 2, vel: 0.65 }], chord: [] },
        parts: [
          {
            name: 'Triad stabs',
            why: 'The triad on the top strings on the One, the "a of 1", the and of 2 and the "e of 4", muted scratches between, nothing else.',
            figure: scratch([0, 3, 6, 13], 'high', 0.85),
            variants: [scratch([0, 6, 10], 'high', 0.85), [...scratch([0, 3, 6], 'high', 0.85).slice(0, 8), n(8, 0, 1, 0.8, { pm: true }), n(10, 10, 1, 0.7, { pm: true }), n(11, 12, 1, 0.7, { pm: true }), n(14, 7, 2, 0.7, { pm: true })]],
            fills: [[...scratch([0, 3], 'high', 0.85).slice(0, 8), n(8, 12, 1, 0.8), n(10, 10, 1, 0.7), n(11, 7, 1, 0.7), n(12, 5, 1, 0.75), n(14, 3, 2, 0.75)]],
            fillsOnChange: [[...scratch([0, 3, 6], 'high', 0.85).slice(0, 12), nx(12, 3, 1, 0.7), nx(14, 4, 2, 0.8)]],
          },
        ],
      },
      {
        label: 'Afrobeat', inspired: 'Fela Kuti\'s Africa 70, Tony Allen', style: 'funk',
        progression: ['Em7', 'Em7', 'Em7', 'Em7', 'A7', 'Em7'], key: 'E', mode: 'minor', tempo: 120, scaleTheory: 'modal',
        why: `<p>A two-bar single-note ostinato that never changes, interlocking with the bass and the hat, over Tony Allen\'s busy, light kit — the kick and snare in conversation, the hat on sixteenths. The chord stays put for a long time; the "change" is a lift to the IV and back.</p>`,
        band: { grid: 16, kick: [0, 3, 6, 10], kickVel: 0.6, snare: [4, 12], snareVel: 0.5, ghost: [2, 7, 9, 14], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatOpen: [6, 14], voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 2, vel: 0.85 }, { slot: 3, off: 0, dur: 1, vel: 0.6 }, { slot: 6, off: 7, dur: 2, vel: 0.75 }, { slot: 10, off: 10, dur: 2, vel: 0.7 }, { slot: 12, off: 0, dur: 2, vel: 0.8 }, { slot: 14, off: 3, dur: 2, vel: 0.65 }],
                chord: [{ slot: 2, dur: 1, vel: 0.4 }, { slot: 6, dur: 1, vel: 0.4 }, { slot: 10, dur: 1, vel: 0.4 }, { slot: 14, dur: 1, vel: 0.4 }] },
        parts: [
          {
            name: 'Ostinato',
            why: 'Two bars of the same figure — root, ♭3, 4, 5 on the offbeats, the octave on the One of the second bar — repeated exactly, palm-muted, in the space the other instruments leave.',
            figure: [n(0, 0, 1, 0.8, { pm: true }), n(3, 3, 1, 0.7, { pm: true }), n(6, 5, 1, 0.7, { pm: true }), n(9, 7, 1, 0.7, { pm: true }), n(11, 5, 1, 0.65, { pm: true }), n(14, 3, 1, 0.7, { pm: true })],
            variants: [[n(0, 12, 1, 0.8, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(6, 7, 1, 0.7, { pm: true }), n(9, 5, 1, 0.7, { pm: true }), n(11, 7, 1, 0.65, { pm: true }), n(14, 10, 1, 0.7, { pm: true })],
                       [n(0, 0, 1, 0.8, { pm: true }), n(3, 3, 1, 0.7, { pm: true }), n(6, 5, 1, 0.7, { pm: true }), n(9, 7, 1, 0.7, { pm: true }), n(11, 5, 1, 0.65, { pm: true }), n(14, 3, 1, 0.7, { pm: true })]],
            fills: [[n(0, 0, 1, 0.8, { pm: true }), n(3, 3, 1, 0.7, { pm: true }), n(6, 5, 1, 0.7, { pm: true }), n(9, 7, 1, 0.7, { pm: true }), n(11, 5, 1, 0.65, { pm: true }), n(14, 3, 1, 0.7, { pm: true })]],
            fillsOnChange: [[n(0, 0, 1, 0.8, { pm: true }), n(3, 3, 1, 0.7, { pm: true }), n(6, 5, 1, 0.7, { pm: true }), n(9, 7, 1, 0.7, { pm: true }), nx(12, 7, 1, 0.65, { pm: true }), nx(14, 3, 1, 0.75, { pm: true })]],
          },
        ],
      },
      {
        label: 'Steady motor', inspired: 'Cory Wong (Vulfpeck), Tower of Power\'s Bruce Conte', style: 'funk',
        progression: ['E9', 'E9', 'A9', 'E9', 'B9', 'A9'], key: 'E', tempo: 108,
        why: `<p>The hand plays every sixteenth, down-up-down-up, and the fretting hand decides which ones sound: the chord on 1, the "e of 2", the and of 3 and the "a of 4" one time, somewhere else the next — the rhythm within the rhythm. Bright, clean, unrelenting. Needs ghost strums.</p>`,
        band: { grid: 16, kick: [0, 7, 8], snare: [4, 12], snareVel: 0.85, ghost: [10, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatOpen: [14], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 6, off: 0, dur: 1, vel: 0.6 }, { slot: 7, off: 12, dur: 1, vel: 0.6 }, { slot: 8, off: 7, dur: 3, vel: 0.8 }, { slot: 12, off: 10, dur: 2, vel: 0.7 }, { slot: 14, off: 0, dur: 2, vel: 0.75 }],
                chord: [] },
        parts: [
          {
            name: 'Rhythm within the rhythm',
            why: 'Sixteen strokes, five of them chords: 1, the e of 2, the and of 3, the a of 4 — then a different five. The bar never repeats exactly twice running.',
            figure: scratch([0, 5, 10, 15], 'high', 0.8),
            variants: [scratch([0, 3, 6, 9, 12], 'high', 0.8), scratch([2, 5, 8, 11, 14], 'high', 0.8)],
            fills: [scratch([0, 2, 5, 7, 10, 12, 15], 'high', 0.75)],
            fillsOnChange: [[...scratch([0, 5, 10], 'high', 0.8).slice(0, 12), nx(12, -1, 2, 0.7), nx(14, 0, 2, 0.8, { chordSlide: 1 })]],
            fillsOnStay: [scratch([0, 5, 8, 13], 'high', 0.8)],
          },
        ],
      },
    ],
  });

  // =========================================================================
  genres.push({
    id: 'metal', name: 'Metal',
    research: `
      <p><b>What the players actually do.</b> James Hetfield (Metallica's "Master of Puppets", "Creeping Death"): palm-muted downpicking, every note the same direction and weight, the gallop (eighth, two sixteenths), riffs out of the ♭2 and the ♭5, opened up on the accents. Iron Maiden (Steve Harris's bass, Dave Murray and Adrian Smith): the gallop as a running figure with harmonized leads. Tony Iommi (Black Sabbath's "Black Sabbath", "Iron Man"): the tritone, slow, down-tuned, with bends and vibrato — doom. Thrash is 180 and up, all downstrokes; groove metal drags the gallop behind the beat.</p>
      <p><b>What the app has now, and what is off about it.</b> One metal at 150 with a gallop; the kick is on every eighth (that is a mid-tempo blast, not most metal), there is no doom, no thrash tempo, no half-time breakdown, and — the sound — no distortion, which is an engine proposal.</p>`,
    existing: [
      {
        style: 'metal', label: 'Metal', rename: 'Gallop (Hetfield-inspired)',
        verdict: `<p>Band: the kick on 1 and 3 with the gallop doubled on the "a" sixteenths, the snare on 2 and 4 hard, the china-like open hat on 1; the bass in the gallop with the guitar. Guitar: the gallop kept and tightened; a riff part built on the ♭2 and ♭5 with the open-string pedal; the change approached chromatically from above (the metal way down).</p>`,
        band: { kick: [0, 3, 4, 7, 8, 11, 12, 15], snareVel: 0.95, hatOpen: [0], bass: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].map(k => ({ slot: k, off: 0, dur: 0.9, vel: k % 4 === 0 ? 0.95 : 0.75 })), fill: { snare: [8, 9, 10, 11, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Pedal riff (♭2 and ♭5)', replaces: 'Chug and riff',
            why: 'The open root palm-muted as a pedal, the riff above it on the ♭2, ♭3, ♭5 and 5 — chromatic, low — with the chord opened on the accent. The change comes down onto the next root from a semitone above.',
            figure: [s(0, 1, 0.9, 'bass', 'mute'), s(1, 1, 0.55, 'bass', 'mute'), n(2, 1, 2, 0.85, { pm: true }), s(4, 1, 0.8, 'bass', 'mute'), s(5, 1, 0.55, 'bass', 'mute'), n(6, 3, 2, 0.85, { pm: true }), s(8, 1, 0.9, 'bass', 'mute'), s(9, 1, 0.55, 'bass', 'mute'), n(10, 6, 2, 0.85, { pm: true }), n(12, 7, 2, 0.9), n(14, 6, 2, 0.8, { pm: true })],
            variants: [[s(0, 2, 0.95, 'low'), s(2, 1, 0.6, 'bass', 'mute'), s(3, 1, 0.6, 'bass', 'mute'), s(4, 2, 0.8, 'low', 'mute'), s(6, 1, 0.6, 'bass', 'mute'), s(7, 1, 0.6, 'bass', 'mute'), n(8, 1, 2, 0.9, { pm: true }), n(10, 0, 2, 0.8, { pm: true }), n(12, 6, 2, 0.9, { pm: true }), n(14, 7, 2, 0.85, { pm: true })],
                       [s(0, 1, 0.9, 'bass', 'mute'), s(1, 1, 0.55, 'bass', 'mute'), s(2, 1, 0.6, 'bass', 'mute'), s(3, 1, 0.55, 'bass', 'mute'), s(4, 1, 0.8, 'bass', 'mute'), s(5, 1, 0.55, 'bass', 'mute'), s(6, 1, 0.6, 'bass', 'mute'), s(7, 1, 0.55, 'bass', 'mute'), s(8, 4, 0.95, 'low'), s(12, 2, 0.9, 'low'), n(14, 1, 2, 0.85, { pm: true })]],
            fills: [[n(0, 12, 2, 0.9), n(2, 10, 2, 0.8, { pm: true }), n(4, 7, 2, 0.85, { pm: true }), n(6, 6, 2, 0.8, { pm: true }), n(8, 5, 2, 0.85, { pm: true }), n(10, 3, 2, 0.8, { pm: true }), n(12, 1, 2, 0.85, { pm: true }), n(14, 0, 2, 0.9, { pm: true })]],
            fillsOnChange: [[s(0, 1, 0.9, 'bass', 'mute'), s(1, 1, 0.55, 'bass', 'mute'), n(2, 1, 2, 0.85, { pm: true }), s(4, 1, 0.8, 'bass', 'mute'), s(5, 1, 0.55, 'bass', 'mute'), n(6, 3, 2, 0.85, { pm: true }), n(8, 6, 2, 0.85, { pm: true }), n(10, 7, 2, 0.85, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 1, 2, 0.9, { pm: true })]],
            fillsOnStay: [[s(0, 4, 0.95, 'low'), s(4, 2, 0.8, 'low', 'mute'), s(6, 1, 0.6, 'bass', 'mute'), s(7, 1, 0.6, 'bass', 'mute'), s(8, 4, 0.95, 'low'), b(12, 6, 1, 4, 0.9, { vib: true })]],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Doom', inspired: 'Black Sabbath ("Black Sabbath", "Electric Funeral"), Candlemass, Electric Wizard', style: 'metal',
        progression: ['E', 'E', 'G', 'E', 'A', 'E'], key: 'E', tempo: 68,
        why: `<p>Slow, low, half-time: the tritone riff — root, octave, ♭5 — with bends shaken and left to ring, the kick on 1, the snare on 3, the ride heavy, the bass doubling. Down-tuning and fuzz are tone proposals; the space is the point.</p>`,
        band: { grid: 16, kick: [0, 6], snare: [8], snareVel: 0.95, hat: [], ride: [0, 4, 8, 12], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 5.5, vel: 0.95 }, { slot: 6, off: 12, dur: 2, vel: 0.8 }, { slot: 8, off: 6, dur: 8, vel: 0.9 }], chord: [] },
        parts: [
          {
            name: 'Tritone riff (Iommi-inspired)',
            why: 'Root, held; the octave; the ♭5, held and shaken — the three notes doom is made of — then the ♭3 bent up into the 4th.',
            figure: [n(0, 0, 6, 0.95, { vib: true }), n(6, 12, 2, 0.85), n(8, 6, 8, 0.95, { vib: true })],
            variants: [[s(0, 6, 0.95, 'low'), n(6, 12, 2, 0.85), b(8, 3, 2, 8, 0.95, { vib: true })], [n(0, 0, 2, 0.95, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), n(4, 0, 2, 0.8, { pm: true }), n(6, 1, 2, 0.85), n(8, 6, 4, 0.95, { vib: true }), n(12, 7, 4, 0.9, { vib: true })]],
            fills: [[n(0, 12, 4, 0.95, { vib: true }), n(4, 10, 2, 0.85), n(6, 7, 2, 0.85), n(8, 6, 4, 0.95, { vib: true }), n(12, 5, 2, 0.85), n(14, 3, 2, 0.85)]],
            fillsOnChange: [[n(0, 0, 6, 0.95, { vib: true }), n(6, 12, 2, 0.85), n(8, 6, 4, 0.95, { vib: true }), nx(12, 1, 2, 0.85), nx(14, 0, 2, 0.95)]],
            fillsOnStay: [[s(0, 8, 0.95, 'low'), b(8, 3, 2, 8, 0.95, { vib: true })]],
          },
        ],
      },
      {
        label: 'Thrash', inspired: 'Metallica ("Battery"), Slayer, Exodus', style: 'metal',
        progression: ['E', 'E', 'F', 'E', 'G', 'F#'], key: 'E', tempo: 190,
        why: `<p>All downstrokes, all palm-muted, eighths at 190 with the chord opened on the accents, the riff chromatic — ♭2, ♭5, ♭6 — and the kick on every eighth (this is where that pattern belongs). The changes are semitone steps, so the "approach" is the riff itself.</p>`,
        band: { grid: 16, kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12], snareVel: 0.95, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [0], voice: 'triad',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: 0, dur: 1.4, vel: k % 8 === 0 ? 0.95 : 0.8 })), chord: [], fill: { snare: [8, 9, 10, 11, 12, 13, 14, 15], kick: [0, 2, 4, 6] } },
        parts: [
          {
            name: 'Downpicked eighths',
            why: 'The root chugged, muted, on every eighth, the power chord opened on 1 and the and of 3; the riff a chromatic step above and below the root.',
            figure: [s(0, 2, 0.95, 'low'), s(2, 1.6, 0.7, 'bass', 'mute'), s(4, 1.6, 0.75, 'bass', 'mute'), s(6, 1.6, 0.7, 'bass', 'mute'), s(8, 1.6, 0.75, 'bass', 'mute'), s(10, 2, 0.95, 'low'), s(12, 1.6, 0.75, 'bass', 'mute'), s(14, 1.6, 0.7, 'bass', 'mute')],
            variants: [[s(0, 1.6, 0.9, 'bass', 'mute'), s(2, 1.6, 0.7, 'bass', 'mute'), n(4, 1, 2, 0.9, { pm: true }), n(6, 0, 2, 0.8, { pm: true }), s(8, 1.6, 0.9, 'bass', 'mute'), s(10, 1.6, 0.7, 'bass', 'mute'), n(12, 6, 2, 0.9, { pm: true }), n(14, 5, 2, 0.8, { pm: true })],
                       chug('bass', 'mute', 0.95, 0.75)],
            fills: [[n(0, 12, 2, 0.95), n(2, 11, 2, 0.85, { pm: true }), n(4, 10, 2, 0.85, { pm: true }), n(6, 8, 2, 0.85, { pm: true }), n(8, 7, 2, 0.9, { pm: true }), n(10, 6, 2, 0.85, { pm: true }), n(12, 1, 2, 0.9, { pm: true }), n(14, 0, 2, 0.95, { pm: true })]],
            fillsOnChange: [[s(0, 2, 0.95, 'low'), s(2, 1.6, 0.7, 'bass', 'mute'), s(4, 1.6, 0.75, 'bass', 'mute'), s(6, 1.6, 0.7, 'bass', 'mute'), s(8, 1.6, 0.75, 'bass', 'mute'), s(10, 1.6, 0.7, 'bass', 'mute'), nx(12, 0, 2, 0.95, { chordSlide: -1 }), nx(14, 0, 2, 0.9)]],
            fillsOnStay: [chug('bass', 'mute', 0.95, 0.75)],
          },
        ],
      },
      {
        label: 'Breakdown', inspired: 'Pantera, Lamb of God, metalcore', style: 'metal',
        progression: ['E', 'E', 'E', 'E', 'F', 'E'], key: 'E', tempo: 84,
        why: `<p>Half-time at a groove tempo: the chord on the One and on the syncopations the kick plays, everything else muted and silent, the snare on 3 alone, the sixteenths dragged behind the beat (Humanize on). The ♭2 chord is the whole harmony.</p>`,
        band: { grid: 16, kick: [0, 3, 6, 10], snare: [8], snareVel: 0.95, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], swing: 0.15, voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 2, vel: 0.95 }, { slot: 3, off: 0, dur: 2, vel: 0.85 }, { slot: 6, off: 0, dur: 2, vel: 0.85 }, { slot: 10, off: 0, dur: 2, vel: 0.85 }], chord: [] },
        parts: [
          {
            name: 'Chords on the kick',
            why: 'The low chord, opened, on 1, the "a of 1", the and of 2 and the and of 3 — with the kick — and muted nothing between.',
            figure: [s(0, 2, 0.95, 'low'), s(3, 2, 0.9, 'low'), s(6, 2, 0.9, 'low'), s(10, 2, 0.9, 'low'), s(12, 1, 0.5, 'bass', 'mute'), s(13, 1, 0.5, 'bass', 'mute'), s(14, 1, 0.5, 'bass', 'mute'), s(15, 1, 0.5, 'bass', 'mute')],
            variants: [[s(0, 3, 0.95, 'low'), s(3, 3, 0.9, 'low'), s(6, 4, 0.9, 'low'), s(10, 2, 0.9, 'low'), n(12, 1, 2, 0.9, { pm: true }), n(14, 0, 2, 0.85, { pm: true })],
                       [s(0, 2, 0.95, 'low'), s(2, 1, 0.5, 'bass', 'mute'), s(3, 2, 0.9, 'low'), s(6, 2, 0.9, 'low'), s(8, 1, 0.5, 'bass', 'mute'), s(9, 1, 0.5, 'bass', 'mute'), s(10, 2, 0.9, 'low'), s(12, 4, 0.95, 'low')]],
            fills: [[s(0, 2, 0.95, 'low'), s(3, 2, 0.9, 'low'), s(6, 2, 0.9, 'low'), n(10, 6, 2, 0.9, { pm: true }), n(12, 1, 2, 0.9, { pm: true }), n(14, 0, 2, 0.95)]],
            fillsOnChange: [[s(0, 2, 0.95, 'low'), s(3, 2, 0.9, 'low'), s(6, 2, 0.9, 'low'), s(10, 2, 0.9, 'low'), nx(12, 0, 4, 0.95, { chordSlide: -1 })]],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // Simple: reviewed too, briefly
  genres.push({
    id: 'simple', name: 'Simple',
    research: `<p><b>What it is for.</b> A metronome with pitches. The parts are scale practice over it. Nothing here is a style, so there is no idiom to get wrong — but the parts could do more for a learner.</p>`,
    existing: [
      {
        style: 'simple', label: 'Simple',
        verdict: `<p>Keep both parts; add an arpeggio study (the triad up and down through the octave) so the reading's chord tones get practiced too, and let the fills know the change (they mostly do).</p>`,
        band: null,
        parts: [
          {
            name: 'Arpeggio study',
            why: 'The chord on one, then the triad up and down: root, 3rd, 5th, octave, 5th, 3rd. In the Chords reading this is the whole point; in Scales it is the same notes.',
            figure: [s(0, 4, 0.85), n(4, 4, 2, 0.75), n(6, 7, 2, 0.75), n(8, 12, 2, 0.8), n(10, 7, 2, 0.7), n(12, 4, 2, 0.75), n(14, 0, 2, 0.75)],
            variants: [[s(0, 4, 0.85), n(4, 12, 2, 0.8), n(6, 7, 2, 0.75), n(8, 4, 2, 0.75), n(10, 0, 2, 0.75), n(12, 4, 4, 0.8)], [s(0, 4, 0.85), n(4, 0, 1, 0.75), n(5, 4, 1, 0.7), n(6, 7, 1, 0.75), n(7, 12, 1, 0.8), n(8, 7, 1, 0.7), n(9, 4, 1, 0.7), n(10, 0, 2, 0.75), n(12, 4, 4, 0.8)]],
            fills: [[n(0, 0, 2, 0.8), n(2, 4, 2, 0.75), n(4, 7, 2, 0.8), n(6, 12, 2, 0.8), n(8, 14, 2, 0.75), n(10, 12, 2, 0.75), n(12, 7, 2, 0.75), n(14, 4, 2, 0.75)]],
            fillsOnChange: [[s(0, 4, 0.85), n(4, 4, 2, 0.75), n(6, 7, 2, 0.75), n(8, 12, 2, 0.8), n(10, 7, 2, 0.7), nx(12, 5, 2, 0.7), nx(14, 4, 2, 0.8)]],
          },
        ],
      },
    ],
    additions: [],
  });

  // =========================================================================
  GT.review.engine = [
    { id: 'change-aware', title: 'Fills that know whether the chord is changing', demo: true,
      why: '<p>Every proposed part has fills for a bar before a change (a walk-up, an approach from above, the ♭7 onto the next 3rd) and fills for a bar before more of the same chord (a push, a repeat, a chord opened out). The app picks fills blind. This is the single biggest step toward parts that sound like a player listening.</p>' },
    { id: 'turnaround', title: 'Turnarounds at the end of the form', demo: true,
      why: '<p>The last bar of the progression gets its own written bar — the blues walk-down in 6ths, the G-run, the enclosure of the V — instead of whatever fill the dice gave it. The app would need to know where the form ends (it does: the progression length).</p>' },
    { id: 'phrase', title: 'A fill every four bars, not only every two', demo: true,
      why: '<p>Many styles fill once a phrase, not once a couplet — country, pop, reggae, Afrobeat. A per-part (or per-style) phrase length, 2 or 4, and the figure and its variants take the bars between. The "Fill every" control above does this here.</p>' },
    { id: 'seed', title: 'Seeded, weighted, re-rollable randomness', demo: true,
      why: '<p>The roll that picks fills is written into the link as a seed, so a part comes back exactly; fills can carry weights (the common one twice as often as the rare one); "New fills" re-rolls the seed, and an option to vary on every pass through the form is available for practicing reaction rather than repetition. The Re-roll button above uses a seed.</p>' },
    { id: 'humanize', title: 'Humanized timing and velocity', demo: true,
      why: '<p>A few milliseconds of jitter on every note and a little velocity noise. Machines are exact; players are not, and the difference is most of what reads as "synth". The Humanize checkbox above does ±8 ms and ±10%; per style it could lean late (breakdowns, Crazy Horse) or push (punk, ska).</p>' },
    { id: 'swing16', title: 'Swung sixteenths per style', demo: true,
      why: '<p>Funk, neo-soul, New Orleans, samba and hip-hop feels swing the sixteenths — the second of each pair late by a settable amount (55–65%). The app can swing only by choosing a 12-slot grid. A swing amount on the style, applied to the band and the part alike.</p>' },
    { id: 'techniques', title: 'More techniques: ghost notes, rakes, staccato, tremolo picking, chord slides, double-stop bends, palm-muted notes', demo: true,
      why: '<p>All heard above: ghost strums are the funk scratch and the ska chunk, rakes are the blues pickup, staccato is chicken pickin\', tremolo picking is surf, chord slides are the T-Bone 9th, double-stop bends are the steel guitar and Chuck Berry, palm-muted single notes are every riff. Each is a written flag and a small rule in the realizer; tremolo needs notes between the grid slots.</p>' },
    { id: 'vibrato', title: 'Vibrato (and trills, harmonics)', demo: false,
      why: '<p>Marked "~" in the proposed tabs but not sounded: the engine would modulate the playback rate of a held note (a few Hz, a fraction of a semitone) — the one thing that would make B.B. King, Iommi and the surf melody read as guitar rather than keyboard. Trills are a hammer-on/pull-off chain and need no new sound; harmonics would need a sample or a filter trick.</p>' },
    { id: 'color', title: 'Color tones on strums (6ths, 9ths, 13ths) and shell voicings', demo: true,
      why: '<p>A strum can ask for the 9th on top (T-Bone, funk, bossa) or the 6th (western swing), placed from the reading\'s palette; a "shell" voicing is root–3rd–7th on three low strings with the 5th left out (Freddie Green). Both heard above; both are a voicing rule in strumCells.</p>' },
    { id: 'band', title: 'The band: ghost notes, open hats, rim clicks, per-hit velocities, drum fills, bass approaches, comp anticipation', demo: true,
      why: '<p>Every proposed band uses some of these. Ghost snares and open hats are what make a kit a drummer; a fill into the top of the form marks the form; the bass approaching each change from a semitone below and the comp anticipating it on the "and of 4" are what make the band sound like it knows the tune. All pattern fields, no new voices.</p>' },
    { id: 'meter', title: '3/4 and other meters', demo: true,
      why: '<p>The country waltz and the jazz waltz above run in three. The engine assumes four beats to the bar in the scheduler, the chart, the count-in and the tab; a "beats" field on the style would let the scheduler and the chart follow it.</p>' },
    { id: 'scales', title: 'Style scales for the palette', demo: false,
      why: '<p>Surf wants the double harmonic scale, metal the Phrygian, funk the Dorian on a minor I, jazz the bebop scales; the app\'s palette is major/minor/Mixolydian or the key. A style could name a scale (as the "modal" reading already adds chord tones), and the reading would honor it. The surf proposal fakes it with an E–F progression.</p>' },
    { id: 'tones', title: 'Tones: drive, fuzz, chorus, phaser, slapback, spring reverb', demo: false,
      why: '<p>Slapback echo is heard above (a second pluck 110 ms later); the rest need audio work: a drive stage for rock and metal (the one that was removed with the genre examples could come back for the part bus), a chorus for neo-soul and 80s pop, a phaser for outlaw country, spring reverb for surf, thumb-tone for octaves. Per style, on the part bus.</p>' },
    { id: 'dynamics', title: 'Dynamics over the form: verse and chorus', demo: false,
      why: '<p>Grunge, pop and rock live on quiet–loud: the same part played palm-muted and clean for eight bars, then opened out. A per-form dynamic plan (soft/loud by bar ranges) would let one part do both and the band follow it.</p>' },
    { id: 'tempo', title: 'A tempo per style', demo: false,
      why: '<p>The jam tab keeps one tempo across styles; a doom part at 120 or a thrash part at 84 is the wrong music. Each style carries its usual tempo (as the guide and this page do) and picking a style offers it.</p>' },
  ];
})();
