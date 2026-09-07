// Ready-made progressions for the practice tab.
//
// They're written as scale degrees rather than chord names, so a preset works
// in whatever key you're in, follows you when you change key, and still leaves
// every chord editable through the usual per-slot pickers.
//
//   deg   0 = I, 1 = ii, 2 = iii, 3 = IV, 4 = V, 5 = vi, 6 = vii°
//         (in a minor key those read i, ii°, III, iv, v, VI, VII)
//   bars  how many measures that chord holds
//   dom   force a dominant 7th — the blues is dominant all the way down,
//         which no key's own diatonic 7ths give you
//
// Pure data; no DOM.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const d = (deg, bars, dom) => ({ deg, bars: bars || 1, dom: !!dom });
  // a secondary dominant: major triad and a flat 7, whatever the key says
  const dom7 = (deg, bars) => ({ deg, bars: bars || 1, dom: true, maj: true });
  // takes whatever seventh the key's own scale puts on that degree
  const dia = (deg, bars) => ({ deg, bars: bars || 1, dia: true });

  GT.progressionPresets = [
    {
      name: '12-bar blues',
      variants: [
        { name: 'Standard',
          // I / I / I / I | IV / IV / I / I | V / IV / I / V
          chords: [d(0,4,1), d(3,2,1), d(0,2,1), d(4,1,1), d(3,1,1), d(0,1,1), d(4,1,1)] },
        { name: 'Quick change',
          // the IV arrives a bar early
          chords: [d(0,1,1), d(3,1,1), d(0,2,1), d(3,2,1), d(0,2,1), d(4,1,1), d(3,1,1), d(0,1,1), d(4,1,1)] },
        { name: 'Jazz blues',
          // a ii–V turnaround and a VI7 to set it up
          chords: [d(0,1,1), d(3,1,1), d(0,2,1), d(3,2,1), d(0,1,1), dom7(5),
                   dia(1), d(4,1,1), d(0,1,1), d(4,1,1)] },
        { name: 'Slow blues',
          // the same twelve bars, two chords per line to sit on
          chords: [d(0,4,1), d(3,2,1), d(0,2,1), d(4,2,1), d(0,2,1)] },
      ],
    },
    { name: 'I–IV–V', chords: [d(0,2), d(3,2), d(4,2)] },
    { name: 'I–V–vi–IV', chords: [d(0), d(4), d(5), d(3)] },
    { name: 'vi–IV–I–V', chords: [d(5), d(3), d(0), d(4)] },
    { name: 'I–vi–IV–V', chords: [d(0), d(5), d(3), d(4)] },
    { name: 'I–vi–ii–V', chords: [d(0), d(5), d(1), d(4)] },
    { name: 'ii–V–I', chords: [dia(1), d(4,1,1), dia(0,2)] },
    { name: 'I–IV–vi–V', chords: [d(0), d(3), d(5), d(4)] },
    { name: 'Descending', chords: [d(0), d(4), d(5), d(2), d(3), d(0), d(3), d(4)] },
    { name: 'i–VII–VI–V', chords: [d(0), d(6), d(5), d(4)] },
  ];

  // every preset presented the same way, whether or not it has variants
  GT.progressionPresets.forEach(p => {
    if (!p.variants) p.variants = [{ name: '', chords: p.chords }];
  });
})();
