// Ready-made progressions for the practice tab.
//
// They're written as scale degrees rather than chord names, so a preset works
// in whatever key you're in, follows you when you change key, and still leaves
// every chord editable through the usual per-slot pickers.
//
//   deg   0 = I, 1 = ii, 2 = iii, 3 = IV, 4 = V, 5 = vi, 6 = vii°
//         (in a minor key those read i, ii°, III, iv, v, VI, VII, and 7 is
//         the harmonic-minor V — the major chord on the fifth)
//   bars  how many measures that chord holds
//   dom   force a dominant 7th — the blues is dominant all the way down,
//         which no key's own diatonic 7ths give you
//   mode  a preset that only makes sense in one mode says so, and picking it
//         moves the key there — the Andalusian cadence is a minor-key thing
//
// Pure data; no DOM.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const d = (deg, bars, dom) => ({ deg, bars: bars || 1, dom: !!dom });
  // a real dominant: major triad and a flat 7, whatever the key says — the V
  // of a minor blues, a secondary dominant on the vi
  const dom7 = (deg, bars) => ({ deg, bars: bars || 1, dom: true, maj: true });
  // takes whatever seventh the key's own scale puts on that degree
  const dia = (deg, bars) => ({ deg, bars: bars || 1, dia: true });

  // `name` is what the picker shows; `numerals` spells the progression out
  // beside it. Where a progression has a name people use, it gets it.
  GT.progressionPresets = [
    {
      name: 'Blues', numerals: 'I7–IV7–V7',
      variants: [
        { name: '12-bar',
          // I / I / I / I | IV / IV / I / I | V / IV / I / V
          chords: [d(0,4,1), d(3,2,1), d(0,2,1), dom7(4), d(3,1,1), d(0,1,1), dom7(4)] },
        { name: 'Quick change',
          // the IV arrives a bar early
          chords: [d(0,1,1), d(3,1,1), d(0,2,1), d(3,2,1), d(0,2,1), dom7(4), d(3,1,1), d(0,1,1), dom7(4)] },
        { name: 'Jazz blues',
          // a ii–V turnaround and a VI7 to set it up
          chords: [d(0,1,1), d(3,1,1), d(0,2,1), d(3,2,1), d(0,1,1), dom7(5),
                   dia(1), dom7(4), d(0,1,1), dom7(4)] },
        { name: 'Minor blues', mode: 'minor',
          // i7 / iv7 / i7, then the VI7–V7 turnaround minor blues players use
          chords: [d(0,4,1), d(3,2,1), d(0,2,1), dom7(5), dom7(4), d(0,1,1), dom7(4)] },
        { name: '8-bar',
          // I / I / IV / IV | I / V / I / V
          chords: [d(0,2,1), d(3,2,1), d(0,1,1), dom7(4), d(0,1,1), dom7(4)] },
        { name: 'Slow blues',
          // the same twelve bars, two chords per line to sit on
          chords: [d(0,4,1), d(3,2,1), d(0,2,1), dom7(4,2), d(0,2,1)] },
      ],
    },
    { name: 'Three-chord', numerals: 'I–IV–V', chords: [d(0,2), d(3,2), d(4,2)] },
    { name: 'Rock vamp', numerals: 'I–IV–V–IV', chords: [d(0), d(3), d(4), d(3)] },
    { name: 'Four-chord pop', numerals: 'I–V–vi–IV', chords: [d(0), d(4), d(5), d(3)] },
    { name: 'Four-chord, minor start', numerals: 'vi–IV–I–V', chords: [d(5), d(3), d(0), d(4)] },
    { name: '50s doo-wop', numerals: 'I–vi–IV–V', chords: [d(0), d(5), d(3), d(4)] },
    { name: 'Turnaround', numerals: 'I–vi–ii–V', chords: [d(0), d(5), d(1), d(4)] },
    { name: 'Jazz cadence', numerals: 'ii–V–I', chords: [dia(1), dom7(4), dia(0,2)] },
    // the jazz turnaround: the vi made a dominant to pull into the ii
    { name: 'Jazz turnaround', numerals: 'I–VI7–ii–V7', chords: [dia(0), dom7(5), dia(1), dom7(4)] },
    { name: 'Pop, IV before vi', numerals: 'I–IV–vi–V', chords: [d(0), d(3), d(5), d(4)] },
    // Pachelbel's canon: I V vi iii IV I IV V
    { name: 'Canon', numerals: 'I–V–vi–iii–IV–I–IV–V', chords: [d(0), d(4), d(5), d(2), d(3), d(0), d(3), d(4)] },
    // the Andalusian cadence, with the major V a minor key borrows for it
    { name: 'Andalusian', numerals: 'i–VII–VI–V', mode: 'minor', chords: [d(0), d(6), d(5), d(7)] },
  ];

  // every preset presented the same way, whether or not it has variants
  GT.progressionPresets.forEach(p => {
    if (!p.variants) p.variants = [{ name: '', chords: p.chords }];
    if (!p.numerals) p.numerals = '';
  });
})();
