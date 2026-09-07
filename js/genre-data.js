// The genres themselves. Each one carries the harmonic frameworks, strumming
// patterns and lead vocabulary the style is built from — the generic material
// taught in method books, not transcriptions of particular records.
//
// Rhythm patterns are written on a grid of slots per bar (8 = eighth notes,
// 16 = sixteenths). A hit says which slot it lands on, which part of the chord
// the pick catches (`all`, `low`, `high`, `mid`, `bass`), whether it's palm
// muted, and whether it's an upstroke.
//
// Lead lines are written as notes: s = string (0 = high e ... 5 = low E),
// f = fret, at = slot, dur = length in slots.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  // shorthands, so the patterns below stay readable
  const D = (at, part, opts) => Object.assign({ at, part: part || 'all' }, opts);   // downstroke
  const U = (at, part, opts) => Object.assign({ at, part: part || 'all', up: true }, opts);
  const beats8 = [0, 1, 2, 3, 4, 5, 6, 7];
  const beats16 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

  GT.genreData = [
    // ------------------------------------------------------------- punk family
    {
      id: 'skate-punk', name: 'Skate punk', family: 'Punk', tempo: 190,
      blurb: 'Fast major-key power chords, all downstrokes, palm muted until the chorus lets go.',
      progressions: [
        { name: 'I–V–vi–IV in E', key: 'E', chords: ['E5', 'B5', 'C#5', 'A5'] },
        { name: 'I–IV–V in A', key: 'A', chords: ['A5', 'D5', 'E5', 'E5'] },
        { name: 'vi–IV–I–V in E', key: 'E', chords: ['C#5', 'A5', 'E5', 'B5'] },
      ],
      rhythms: [
        { name: 'Downstroke eighths', grid: 8, voicing: 'power', tone: 'drive',
          hits: beats8.map(at => D(at, 'low', { vel: at % 2 ? 0.75 : 1 })),
          drums: { kick: [0, 4], snare: [2, 6], hat: beats8 } },
        { name: 'Palm-muted gallop', grid: 16, voicing: 'power', tone: 'drive',
          hits: [0, 3, 4, 7, 8, 11, 12, 15].map(at => D(at, 'low', { mute: at % 4 !== 0, vel: at % 4 === 0 ? 1 : 0.7 })),
          drums: { kick: [0, 3, 8, 11], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
        { name: 'Open ringing chorus', grid: 8, voicing: 'power', tone: 'drive',
          hits: [D(0, 'all'), D(2, 'all', { vel: 0.8 }), D(4, 'all'), D(6, 'all', { vel: 0.8 })],
          drums: { kick: [0, 4], snare: [2, 6], hat: beats8 } },
      ],
      leads: [
        { name: 'Pentatonic run in E', grid: 8, bars: 2, tone: 'drive',
          notes: [
            { s: 3, f: 2, at: 0 }, { s: 3, f: 5, at: 1 }, { s: 2, f: 2, at: 2 }, { s: 2, f: 4, at: 3 },
            { s: 1, f: 3, at: 4 }, { s: 1, f: 5, at: 5 }, { s: 0, f: 3, at: 6 }, { s: 0, f: 5, at: 7 },
            { s: 0, f: 7, at: 8, dur: 2 }, { s: 0, f: 5, at: 10 }, { s: 1, f: 5, at: 11 },
            { s: 1, f: 3, at: 12 }, { s: 2, f: 4, at: 13 }, { s: 2, f: 2, at: 14 }, { s: 3, f: 2, at: 15 },
          ] },
        { name: 'Chromatic climb', grid: 8, bars: 2, tone: 'drive',
          notes: [
            { s: 5, f: 0, at: 0 }, { s: 5, f: 1, at: 1 }, { s: 5, f: 2, at: 2 }, { s: 5, f: 3, at: 3 },
            { s: 4, f: 0, at: 4 }, { s: 4, f: 1, at: 5 }, { s: 4, f: 2, at: 6 }, { s: 4, f: 3, at: 7 },
            { s: 3, f: 2, at: 8, dur: 2 }, { s: 2, f: 2, at: 10, dur: 2 },
            { s: 3, f: 2, at: 12 }, { s: 4, f: 2, at: 13 }, { s: 5, f: 0, at: 14, dur: 2 },
          ] },
      ],
    },
    {
      id: 'ska-punk', name: 'Ska punk', family: 'Punk', tempo: 165,
      blurb: 'Clean upstroke skanks on every offbeat, major chords high on the neck.',
      progressions: [
        { name: 'I–IV–V in A', key: 'A', chords: ['A', 'D', 'E', 'E'] },
        { name: 'I–vi–IV–V in C', key: 'C', chords: ['C', 'Am', 'F', 'G'] },
        { name: 'i–VI–VII in A minor', key: 'A', chords: ['Am', 'F', 'G', 'G'] },
      ],
      rhythms: [
        { name: 'Offbeat skank', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [1, 3, 5, 7].map(at => U(at, 'high', { dur: 0.35 })),
          drums: { kick: [0, 4], snare: [2, 6], hat: [1, 3, 5, 7] } },
        { name: 'Double-time skank', grid: 16, voicing: 'barre', tone: 'clean',
          hits: [2, 3, 6, 7, 10, 11, 14, 15].map(at => U(at, 'high', { dur: 0.3, vel: at % 4 === 3 ? 0.9 : 0.65 })),
          drums: { kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
        { name: 'Verse skank, chorus chug', grid: 8, voicing: 'barre', tone: 'drive',
          hits: [U(1, 'high', { dur: 0.35 }), U(3, 'high', { dur: 0.35 }),
                 D(4, 'low'), D(5, 'low', { vel: 0.7 }), D(6, 'low'), D(7, 'low', { vel: 0.7 })],
          drums: { kick: [0, 4, 6], snare: [2, 6], hat: beats8 } },
      ],
      leads: [
        { name: 'Mixolydian horn line in A', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 2, at: 0 }, { s: 1, f: 2, at: 1 }, { s: 1, f: 3, at: 2 }, { s: 1, f: 5, at: 3 },
            { s: 0, f: 2, at: 4 }, { s: 0, f: 3, at: 5 }, { s: 0, f: 5, at: 6, dur: 2 },
            { s: 0, f: 3, at: 8 }, { s: 0, f: 2, at: 9 }, { s: 1, f: 5, at: 10 }, { s: 1, f: 3, at: 11 },
            { s: 1, f: 2, at: 12 }, { s: 2, f: 4, at: 13 }, { s: 2, f: 2, at: 14, dur: 2 },
          ] },
      ],
    },
    // ---------------------------------------------------------- rockabilly etc
    {
      id: 'rockabilly', name: 'Rockabilly', family: 'Roots rock', tempo: 168,
      blurb: 'Twelve-bar shuffle, boom-chick bass under the chords, clean hollowbody twang.',
      progressions: [
        { name: 'Twelve-bar in A', key: 'A', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'] },
        { name: 'Quick-change blues in E', key: 'E', chords: ['E7', 'A7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'] },
        { name: 'I–vi–IV–V in C', key: 'C', chords: ['C', 'Am', 'F', 'G'] },
      ],
      rhythms: [
        { name: 'Boom-chick', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'bass'), D(2, 'high', { dur: 0.4 }), D(4, 'bass'), D(6, 'high', { dur: 0.4 })],
          drums: { snare: [2, 6], hat: [0, 2, 4, 6] } },
        { name: 'Shuffle chords', grid: 12, voicing: 'power', tone: 'clean',
          hits: [0, 2, 3, 5, 6, 8, 9, 11].map(at => D(at, 'low', { dur: 0.5, vel: at % 3 === 0 ? 1 : 0.7 })),
          drums: { kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11] } },
        { name: 'Slap-back stabs', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'bass'), D(1, 'high', { dur: 0.3, vel: 0.7 }), D(4, 'bass'), D(5, 'high', { dur: 0.3, vel: 0.7 }), U(7, 'high', { dur: 0.3, vel: 0.6 })],
          drums: { snare: [2, 6], hat: [0, 2, 4, 6] } },
      ],
      leads: [
        { name: 'Double-stop lick in A', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 2, at: 0 }, { s: 1, f: 2, at: 0 },
            { s: 2, f: 4, at: 2 }, { s: 1, f: 5, at: 2 },
            { s: 2, f: 2, at: 4 }, { s: 1, f: 2, at: 4 },
            { s: 3, f: 2, at: 6 }, { s: 3, f: 4, at: 7 },
            { s: 2, f: 2, at: 8, dur: 2 }, { s: 3, f: 4, at: 10 }, { s: 3, f: 2, at: 11 },
            { s: 4, f: 4, at: 12 }, { s: 4, f: 2, at: 13 }, { s: 5, f: 5, at: 14, dur: 2 },
          ] },
        { name: 'Open-string roll in E', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 0, f: 0, at: 0 }, { s: 1, f: 0, at: 1 }, { s: 2, f: 1, at: 2 }, { s: 1, f: 0, at: 3 },
            { s: 0, f: 0, at: 4 }, { s: 1, f: 3, at: 5 }, { s: 2, f: 1, at: 6 }, { s: 2, f: 0, at: 7 },
            { s: 3, f: 2, at: 8 }, { s: 3, f: 0, at: 9 }, { s: 4, f: 2, at: 10 }, { s: 4, f: 0, at: 11 },
            { s: 5, f: 2, at: 12 }, { s: 5, f: 0, at: 13, dur: 3 },
          ] },
      ],
    },
    {
      id: 'psychobilly', name: 'Psychobilly', family: 'Roots rock', tempo: 200,
      blurb: 'Rockabilly played fast and minor, with slap-bass drive and surf-flavoured menace.',
      progressions: [
        { name: 'i–VI–VII in E minor', key: 'E', chords: ['Em', 'C', 'D', 'D'] },
        { name: 'Minor twelve-bar in A', key: 'A', chords: ['Am', 'Am', 'Am', 'Am', 'Dm', 'Dm', 'Am', 'Am', 'E7', 'Dm', 'Am', 'E7'] },
        { name: 'i–bII vamp in E', key: 'E', chords: ['Em', 'F', 'Em', 'F'] },
      ],
      rhythms: [
        { name: 'Fast slap shuffle', grid: 12, voicing: 'power', tone: 'drive',
          hits: [0, 2, 3, 5, 6, 8, 9, 11].map(at => D(at, 'low', { mute: at % 3 !== 0, dur: 0.5 })),
          drums: { kick: [0, 6], snare: [3, 9], hat: [0, 3, 6, 9] } },
        { name: 'Driving eighths', grid: 8, voicing: 'power', tone: 'drive',
          hits: beats8.map(at => D(at, 'low', { mute: at % 2 === 1, vel: at % 2 ? 0.7 : 1 })),
          drums: { kick: [0, 3, 4], snare: [2, 6], hat: beats8 } },
      ],
      leads: [
        { name: 'Chromatic descent in E minor', grid: 8, bars: 2, tone: 'drive',
          notes: [
            { s: 0, f: 12, at: 0 }, { s: 0, f: 11, at: 1 }, { s: 0, f: 10, at: 2 }, { s: 0, f: 9, at: 3 },
            { s: 0, f: 8, at: 4 }, { s: 0, f: 7, at: 5 }, { s: 1, f: 8, at: 6 }, { s: 1, f: 7, at: 7 },
            { s: 1, f: 5, at: 8, dur: 2 }, { s: 2, f: 7, at: 10 }, { s: 2, f: 4, at: 11 },
            { s: 3, f: 5, at: 12 }, { s: 3, f: 2, at: 13 }, { s: 5, f: 0, at: 14, dur: 2 },
          ] },
      ],
    },
    {
      id: 'surf', name: 'Surf rock', family: 'Roots rock', tempo: 160,
      blurb: 'Wet reverb, tremolo-picked single notes on the low strings, minor keys.',
      progressions: [
        { name: 'i–VI–VII in E minor', key: 'E', chords: ['Em', 'C', 'D', 'D'] },
        { name: 'Twelve-bar in E', key: 'E', chords: ['E7', 'E7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'] },
      ],
      rhythms: [
        { name: 'Tremolo-picked roots', grid: 16, voicing: 'power', tone: 'clean',
          hits: beats16.map(at => D(at, 'bass', { dur: 0.5, vel: at % 4 === 0 ? 1 : 0.6 })),
          drums: { kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
        { name: 'Muted eighth chug', grid: 8, voicing: 'power', tone: 'clean',
          hits: beats8.map(at => D(at, 'low', { mute: true, vel: at % 2 ? 0.65 : 0.95 })),
          drums: { kick: [0, 4], snare: [2, 6], hat: beats8 } },
      ],
      leads: [
        { name: 'E minor surf run', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 5, f: 0, at: 0 }, { s: 5, f: 2, at: 1 }, { s: 5, f: 3, at: 2 }, { s: 4, f: 0, at: 3 },
            { s: 4, f: 2, at: 4 }, { s: 4, f: 3, at: 5 }, { s: 3, f: 0, at: 6 }, { s: 3, f: 2, at: 7 },
            { s: 3, f: 4, at: 8, dur: 2 }, { s: 3, f: 2, at: 10 }, { s: 3, f: 0, at: 11 },
            { s: 4, f: 3, at: 12 }, { s: 4, f: 2, at: 13 }, { s: 5, f: 0, at: 14, dur: 2 },
          ] },
      ],
    },
    // --------------------------------------------------------------- the blues
    {
      id: 'delta-blues', name: 'Delta blues', family: 'Blues', tempo: 92,
      blurb: 'Country blues in E: thumb keeping the bass going while the top strings answer.',
      progressions: [
        { name: 'Twelve-bar in E', key: 'E', chords: ['E7', 'E7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'] },
        { name: 'I–IV vamp in E', key: 'E', chords: ['E7', 'A7', 'E7', 'E7'] },
      ],
      rhythms: [
        { name: 'Alternating thumb', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'bass'), D(2, 'high', { dur: 0.5 }), D(4, 'bass', { vel: 0.8 }), D(6, 'high', { dur: 0.5 })],
          drums: null },
        { name: 'Triplet shuffle', grid: 12, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'low'), D(2, 'high', { dur: 0.4, vel: 0.7 }), D(3, 'low'), D(5, 'high', { dur: 0.4, vel: 0.7 }),
                 D(6, 'low'), D(8, 'high', { dur: 0.4, vel: 0.7 }), D(9, 'low'), D(11, 'high', { dur: 0.4, vel: 0.7 })],
          drums: null },
      ],
      leads: [
        { name: 'Open-position turnaround in E', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 2, at: 0 }, { s: 2, f: 0, at: 1 }, { s: 3, f: 2, at: 2 }, { s: 3, f: 0, at: 3 },
            { s: 4, f: 2, at: 4 }, { s: 4, f: 0, at: 5 }, { s: 5, f: 3, at: 6 }, { s: 5, f: 0, at: 7, dur: 2 },
            { s: 1, f: 3, at: 10 }, { s: 1, f: 0, at: 11 }, { s: 2, f: 1, at: 12 }, { s: 2, f: 0, at: 13 },
            { s: 5, f: 0, at: 14, dur: 2 },
          ] },
        { name: 'Blue-note phrase in E', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 1, f: 0, at: 0, dur: 2 }, { s: 2, f: 3, at: 2 }, { s: 2, f: 2, at: 3 },
            { s: 2, f: 0, at: 4, dur: 2 }, { s: 3, f: 2, at: 6, dur: 2 },
            { s: 2, f: 0, at: 8 }, { s: 2, f: 3, at: 9 }, { s: 2, f: 2, at: 10, dur: 2 },
            { s: 3, f: 2, at: 12 }, { s: 4, f: 2, at: 13 }, { s: 5, f: 0, at: 14, dur: 2 },
          ] },
      ],
    },
    {
      id: 'chicago-blues', name: 'Chicago blues', family: 'Blues', tempo: 108,
      blurb: 'The blues gone electric: shuffle riffs on the bottom strings and box-one licks on top.',
      progressions: [
        { name: 'Twelve-bar in A', key: 'A', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'] },
        { name: 'Quick change in G', key: 'G', chords: ['G7', 'C7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'] },
      ],
      rhythms: [
        { name: 'Shuffle riff (5–6)', grid: 12, voicing: 'power', tone: 'drive',
          hits: [D(0, 'low'), D(3, 'low'), D(6, 'low'), D(9, 'low')],
          drums: { kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11] } },
        { name: 'Stop-time hits', grid: 8, voicing: 'barre', tone: 'drive',
          hits: [D(0, 'all'), D(3, 'all', { vel: 0.85 })],
          drums: { kick: [0], snare: [3], hat: [0, 3] } },
        { name: 'Comping stabs', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [U(1, 'high', { dur: 0.4 }), U(3, 'high', { dur: 0.4 }), U(5, 'high', { dur: 0.4 }), U(7, 'high', { dur: 0.4 })],
          drums: { kick: [0, 4], snare: [2, 6], hat: [0, 2, 4, 6] } },
      ],
      leads: [
        { name: 'Box-one lick in A', grid: 8, bars: 2, tone: 'drive',
          notes: [
            { s: 1, f: 8, at: 0 }, { s: 1, f: 5, at: 1 }, { s: 2, f: 7, at: 2 }, { s: 2, f: 5, at: 3 },
            { s: 3, f: 7, at: 4, dur: 2 }, { s: 3, f: 5, at: 6 }, { s: 4, f: 7, at: 7 },
            { s: 4, f: 5, at: 8, dur: 2 }, { s: 3, f: 5, at: 10 }, { s: 3, f: 7, at: 11 },
            { s: 2, f: 5, at: 12 }, { s: 2, f: 7, at: 13 }, { s: 1, f: 5, at: 14, dur: 2 },
          ] },
      ],
    },
    // ----------------------------------------------------------------- jazz
    {
      id: 'bebop', name: 'Bebop', family: 'Jazz', tempo: 190,
      blurb: 'ii–V–I at speed: shell voicings under long eighth-note lines full of chromatic approach notes.',
      progressions: [
        { name: 'ii–V–I in C', key: 'C', chords: ['Dm7', 'G7', 'CM7', 'CM7'] },
        { name: 'Minor ii–V–i in C', key: 'C', chords: ['Dm7b5', 'G7', 'Cm7', 'Cm7'] },
        { name: 'Turnaround in Bb', key: 'Bb', chords: ['BbM7', 'G7', 'Cm7', 'F7'] },
      ],
      rhythms: [
        { name: 'Four to the bar', grid: 8, voicing: 'shell', tone: 'clean',
          hits: [0, 2, 4, 6].map(at => D(at, 'all', { dur: 0.45, vel: at % 4 === 2 ? 1 : 0.8 })),
          drums: { hat: [2, 6], snare: [] } },
        { name: 'Charleston comp', grid: 8, voicing: 'shell', tone: 'clean',
          hits: [D(0, 'all', { dur: 1.2 }), D(3, 'all', { dur: 1.2, vel: 0.85 })],
          drums: { hat: [2, 6] } },
      ],
      leads: [
        { name: 'ii–V–I line in C', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 4, f: 5, at: 0 }, { s: 3, f: 3, at: 1 }, { s: 3, f: 7, at: 2 }, { s: 2, f: 5, at: 3 },
            { s: 2, f: 7, at: 4 }, { s: 1, f: 6, at: 5 }, { s: 1, f: 5, at: 6 }, { s: 2, f: 7, at: 7 },
            { s: 2, f: 5, at: 8 }, { s: 2, f: 4, at: 9 }, { s: 3, f: 5, at: 10 }, { s: 3, f: 7, at: 11 },
            { s: 3, f: 5, at: 12 }, { s: 4, f: 7, at: 13 }, { s: 4, f: 3, at: 14, dur: 2 },
          ] },
        { name: 'Enclosure phrase', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 5, at: 0 }, { s: 2, f: 4, at: 1 }, { s: 2, f: 2, at: 2 }, { s: 2, f: 3, at: 3 },
            { s: 3, f: 5, at: 4 }, { s: 3, f: 7, at: 5 }, { s: 2, f: 4, at: 6 }, { s: 2, f: 5, at: 7 },
            { s: 1, f: 5, at: 8, dur: 2 }, { s: 1, f: 6, at: 10 }, { s: 1, f: 5, at: 11 },
            { s: 2, f: 7, at: 12 }, { s: 2, f: 5, at: 13 }, { s: 3, f: 5, at: 14, dur: 2 },
          ] },
      ],
    },
    {
      id: 'gypsy-jazz', name: 'Gypsy jazz', family: 'Jazz', tempo: 200,
      blurb: 'La pompe driving underneath, arpeggio-led lines with chromatic approaches on top.',
      progressions: [
        { name: 'Minor swing in Am', key: 'A', chords: ['Am6', 'Dm6', 'E7', 'Am6'] },
        { name: 'ii–V–I in G', key: 'G', chords: ['Am7', 'D7', 'GM7', 'GM7'] },
      ],
      rhythms: [
        { name: 'La pompe', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'all', { dur: 0.3, vel: 0.7 }), U(1, 'all', { dur: 0.25, vel: 0.55 }),
                 D(2, 'all', { dur: 0.5 }),
                 D(4, 'all', { dur: 0.3, vel: 0.7 }), U(5, 'all', { dur: 0.25, vel: 0.55 }),
                 D(6, 'all', { dur: 0.5 })],
          drums: null },
        { name: 'Waltz pompe', grid: 6, beats: 3, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'low', { dur: 0.4 }), D(2, 'high', { dur: 0.4, vel: 0.8 }), D(4, 'high', { dur: 0.4, vel: 0.8 })],
          drums: null },
      ],
      leads: [
        { name: 'Am6 arpeggio sweep', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 4, f: 0, at: 0 }, { s: 3, f: 2, at: 1 }, { s: 2, f: 2, at: 2 }, { s: 1, f: 5, at: 3 },
            { s: 0, f: 5, at: 4 }, { s: 0, f: 7, at: 5 }, { s: 0, f: 8, at: 6 }, { s: 0, f: 5, at: 7 },
            { s: 1, f: 5, at: 8 }, { s: 1, f: 3, at: 9 }, { s: 2, f: 2, at: 10 }, { s: 2, f: 1, at: 11 },
            { s: 3, f: 2, at: 12 }, { s: 3, f: 0, at: 13 }, { s: 4, f: 0, at: 14, dur: 2 },
          ] },
      ],
    },
    {
      id: 'bossa-nova', name: 'Bossa nova', family: 'Jazz', tempo: 132,
      blurb: 'Nylon-string comping: thumb on the bass, syncopated chord jabs that never land square.',
      progressions: [
        { name: 'ii–V–I in F', key: 'F', chords: ['Gm7', 'C7', 'FM7', 'FM7'] },
        { name: 'i–VI–ii–V in A minor', key: 'A', chords: ['Am7', 'FM7', 'Dm7', 'E7'] },
      ],
      rhythms: [
        { name: 'Bossa comp', grid: 16, voicing: 'shell', tone: 'clean',
          hits: [D(0, 'bass'), D(3, 'high', { dur: 0.7 }), D(6, 'high', { dur: 0.7, vel: 0.8 }),
                 D(8, 'bass'), D(11, 'high', { dur: 0.7 }), D(14, 'high', { dur: 0.7, vel: 0.8 })],
          drums: { hat: [0, 4, 8, 12] } },
        { name: 'Simple syncopation', grid: 8, voicing: 'shell', tone: 'clean',
          hits: [D(0, 'bass'), D(1, 'high', { dur: 0.6 }), D(4, 'bass'), D(6, 'high', { dur: 0.6 })],
          drums: { hat: [0, 2, 4, 6] } },
      ],
      leads: [
        { name: 'Chord-tone melody in F', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 5, at: 0, dur: 2 }, { s: 1, f: 6, at: 2 }, { s: 1, f: 5, at: 3 },
            { s: 2, f: 7, at: 4, dur: 2 }, { s: 2, f: 5, at: 6, dur: 2 },
            { s: 3, f: 7, at: 8, dur: 2 }, { s: 3, f: 5, at: 10 }, { s: 3, f: 3, at: 11 },
            { s: 4, f: 5, at: 12, dur: 4 },
          ] },
      ],
    },
    // ------------------------------------------------------------ groove/other
    {
      id: 'funk', name: 'Funk', family: 'Groove', tempo: 104,
      blurb: 'Sixteenth-note scratch on a single 9th chord, more muted strokes than sounded ones.',
      progressions: [
        { name: 'One-chord vamp on E9', key: 'E', chords: ['E9', 'E9', 'E9', 'E9'] },
        { name: 'i–IV in D minor', key: 'D', chords: ['Dm7', 'Dm7', 'Gm7', 'Gm7'] },
      ],
      rhythms: [
        { name: 'Sixteenth chank', grid: 16, voicing: 'barre', tone: 'clean',
          hits: beats16.map(at => {
            const sounded = [0, 3, 6, 10, 11, 14].includes(at);
            return (at % 2 ? U : D)(at, 'high', { mute: !sounded, dur: sounded ? 0.5 : 0.2, vel: sounded ? 0.95 : 0.4 });
          }),
          drums: { kick: [0, 6, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
        { name: 'One-chord stabs', grid: 16, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'all', { dur: 0.4 }), D(6, 'all', { dur: 0.4, vel: 0.85 }), D(10, 'all', { dur: 0.6 })],
          drums: { kick: [0, 6, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
      ],
      leads: [
        { name: 'Pentatonic double stops in E', grid: 16, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 0, at: 0 }, { s: 1, f: 0, at: 0 },
            { s: 2, f: 2, at: 3 }, { s: 1, f: 3, at: 3 },
            { s: 3, f: 2, at: 6, dur: 2 }, { s: 2, f: 0, at: 10 }, { s: 3, f: 2, at: 11 },
            { s: 3, f: 0, at: 14, dur: 2 },
            { s: 2, f: 0, at: 16 }, { s: 1, f: 0, at: 16 },
            { s: 1, f: 3, at: 19 }, { s: 0, f: 3, at: 19 },
            { s: 0, f: 0, at: 22, dur: 2 }, { s: 1, f: 0, at: 26 }, { s: 2, f: 2, at: 27 },
            { s: 3, f: 2, at: 30, dur: 2 },
          ] },
      ],
    },
    {
      id: 'reggae', name: 'Reggae', family: 'Groove', tempo: 76,
      blurb: 'Everything on the offbeat: short, clipped chord chops with all the space left in.',
      progressions: [
        { name: 'i–VII in A minor', key: 'A', chords: ['Am', 'G', 'Am', 'G'] },
        { name: 'I–IV–V in G', key: 'G', chords: ['G', 'C', 'D', 'D'] },
      ],
      rhythms: [
        { name: 'One-drop skank', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [1, 3, 5, 7].map(at => U(at, 'high', { dur: 0.25, vel: at === 3 ? 1 : 0.8 })),
          drums: { kick: [4], snare: [4], hat: [1, 3, 5, 7] } },
        { name: 'Double chop', grid: 16, voicing: 'barre', tone: 'clean',
          hits: [2, 3, 6, 7, 10, 11, 14, 15].map(at => U(at, 'high', { dur: 0.22, vel: at % 4 === 3 ? 0.95 : 0.6 })),
          drums: { kick: [8], snare: [8], hat: [2, 6, 10, 14] } },
      ],
      leads: [
        { name: 'A minor pentatonic phrase', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 2, f: 2, at: 0, dur: 2 }, { s: 1, f: 1, at: 2 }, { s: 1, f: 3, at: 3 },
            { s: 1, f: 5, at: 4, dur: 3 }, { s: 1, f: 3, at: 7 },
            { s: 2, f: 2, at: 8, dur: 2 }, { s: 3, f: 2, at: 10 }, { s: 3, f: 0, at: 11 },
            { s: 4, f: 0, at: 12, dur: 4 },
          ] },
      ],
    },
    {
      id: 'thrash-metal', name: 'Thrash metal', family: 'Metal', tempo: 200,
      blurb: 'Relentless downpicking on a low pedal note, chromatic riffs, palm mute welded on.',
      progressions: [
        { name: 'E pedal with bII', key: 'E', chords: ['E5', 'F5', 'E5', 'G5'] },
        { name: 'i–bVI–bVII in E', key: 'E', chords: ['E5', 'C5', 'D5', 'D5'] },
      ],
      rhythms: [
        { name: 'Downpicked sixteenths', grid: 16, voicing: 'power', tone: 'drive',
          hits: beats16.map(at => D(at, 'bass', { mute: true, dur: 0.3, vel: at % 4 === 0 ? 1 : 0.7 })),
          drums: { kick: beats16.filter(a => a % 2 === 0), snare: [4, 12], hat: [0, 4, 8, 12] } },
        { name: 'Gallop', grid: 16, voicing: 'power', tone: 'drive',
          hits: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].map(at => D(at, 'bass', { mute: true, dur: 0.3, vel: at % 4 === 0 ? 1 : 0.7 })),
          drums: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
        { name: 'Open-chord chorus', grid: 8, voicing: 'power', tone: 'drive',
          hits: [D(0, 'low', { dur: 2 }), D(4, 'low', { dur: 2 })],
          drums: { kick: [0, 2, 4, 6], snare: [2, 6], hat: beats8 } },
      ],
      leads: [
        { name: 'E harmonic minor run', grid: 16, bars: 2, tone: 'drive',
          notes: [
            { s: 5, f: 0, at: 0 }, { s: 5, f: 2, at: 1 }, { s: 5, f: 3, at: 2 }, { s: 4, f: 0, at: 3 },
            { s: 4, f: 2, at: 4 }, { s: 4, f: 3, at: 5 }, { s: 3, f: 1, at: 6 }, { s: 3, f: 2, at: 7 },
            { s: 3, f: 4, at: 8 }, { s: 2, f: 1, at: 9 }, { s: 2, f: 2, at: 10 }, { s: 2, f: 4, at: 11 },
            { s: 1, f: 3, at: 12 }, { s: 1, f: 5, at: 13 }, { s: 0, f: 3, at: 14 }, { s: 0, f: 4, at: 15 },
            { s: 0, f: 7, at: 16, dur: 4 }, { s: 0, f: 4, at: 20 }, { s: 0, f: 3, at: 21 },
            { s: 1, f: 5, at: 22 }, { s: 1, f: 3, at: 23 }, { s: 2, f: 4, at: 24 }, { s: 2, f: 2, at: 25 },
            { s: 3, f: 4, at: 26 }, { s: 3, f: 2, at: 27 }, { s: 5, f: 0, at: 28, dur: 4 },
          ] },
      ],
    },
    {
      id: 'country', name: 'Country', family: 'Roots rock', tempo: 128,
      blurb: 'Honky-tonk: bass note and chord trading off, with chicken-pickin’ double stops on top.',
      progressions: [
        { name: 'I–IV–V in G', key: 'G', chords: ['G', 'C', 'D', 'G'] },
        { name: 'I–V–IV–I in A', key: 'A', chords: ['A', 'E', 'D', 'A'] },
        { name: 'Twelve-bar in G', key: 'G', chords: ['G', 'G', 'G', 'G', 'C', 'C', 'G', 'G', 'D', 'C', 'G', 'D'] },
      ],
      rhythms: [
        { name: 'Boom-chick two-beat', grid: 8, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'bass'), D(2, 'high', { dur: 0.4 }), D(4, 'bass', { vel: 0.85 }), D(6, 'high', { dur: 0.4 })],
          drums: { kick: [0, 4], snare: [2, 6], hat: [0, 2, 4, 6] } },
        { name: 'Train beat strum', grid: 16, voicing: 'barre', tone: 'clean',
          hits: [D(0, 'bass'), D(4, 'high', { dur: 0.4 }), D(8, 'bass', { vel: 0.85 }), D(12, 'high', { dur: 0.4 }),
                 U(6, 'high', { dur: 0.3, vel: 0.6 }), U(14, 'high', { dur: 0.3, vel: 0.6 })],
          drums: { kick: [0, 8], snare: [4, 12], hat: beats16.filter(a => a % 2 === 0) } },
      ],
      leads: [
        { name: 'Double-stop lick in G', grid: 8, bars: 2, tone: 'clean',
          notes: [
            { s: 1, f: 3, at: 0 }, { s: 2, f: 4, at: 0 },
            { s: 1, f: 5, at: 2 }, { s: 2, f: 4, at: 2 },
            { s: 1, f: 3, at: 4 }, { s: 2, f: 0, at: 5 }, { s: 3, f: 2, at: 6 }, { s: 3, f: 0, at: 7 },
            { s: 4, f: 2, at: 8, dur: 2 }, { s: 3, f: 0, at: 10 }, { s: 3, f: 2, at: 11 },
            { s: 2, f: 0, at: 12 }, { s: 2, f: 2, at: 13 }, { s: 1, f: 3, at: 14, dur: 2 },
          ] },
      ],
    },
  ];
})();
