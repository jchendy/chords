// Ready-made progressions for the jam tab.
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
//   mode  a preset (or variant) that belongs to one mode says so, and the
//         picker only offers it in that mode — the doo-wop is a major-key
//         thing, the Andalusian cadence a minor-key one. Left off, it's
//         offered in both, with `numeralsMinor` for how it reads there.
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
  // a root the key doesn't own, that many semitones above the tonic — a
  // major triad there unless a shape says otherwise
  const c = (semis, bars, shape) => ({ deg: 'c' + semis, bars: bars || 1, dom: false, ...(shape ? { shape } : {}) });
  // a degree in a named shape: '7♯9', '9', 'maj' on a minor degree
  const sh = (deg, shape, bars) => ({ deg, bars: bars || 1, dom: false, shape });

  // `name` is what the picker shows; `numerals` spells the progression out
  // beside it. Where a progression has a name people use, it gets it.
  GT.progressionPresets = [
    // First in each mode's list, and so what a fresh page opens on: the
    // plainest thing you can practice over, before any of the shapes with
    // names. Major first, minor next — the picker filters by mode, so each
    // ends up at the top of its own list.
    { name: 'Three-chord', numerals: 'I–IV–V', mode: 'major', chords: [d(0,2), d(3,2), d(4,2)] },
    { name: 'Minor three-chord', numerals: 'i–iv–V', mode: 'minor', chords: [d(0,2), d(3,2), d(7,2)] },
    {
      name: 'Blues', numerals: 'I7–IV7–V7', numeralsMinor: 'i7–iv7–V7',
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
    // ---- major
    { name: 'Rock vamp', numerals: 'I–IV–V–IV', mode: 'major', chords: [d(0), d(3), d(4), d(3)] },
    { name: 'Four-chord pop', numerals: 'I–V–vi–IV', mode: 'major', chords: [d(0), d(4), d(5), d(3)] },
    { name: 'Four-chord, minor start', numerals: 'vi–IV–I–V', mode: 'major', chords: [d(5), d(3), d(0), d(4)] },
    { name: '50s doo-wop', numerals: 'I–vi–IV–V', mode: 'major', chords: [d(0), d(5), d(3), d(4)] },
    { name: 'Turnaround', numerals: 'I–vi–ii–V', mode: 'major', chords: [d(0), d(5), d(1), d(4)] },
    // the jazz turnaround: the vi made a dominant to pull into the ii
    { name: 'Jazz turnaround', numerals: 'I–VI7–ii–V7', mode: 'major', chords: [dia(0), dom7(5), dia(1), dom7(4)] },
    { name: 'Pop, IV before vi', numerals: 'I–IV–vi–V', mode: 'major', chords: [d(0), d(3), d(5), d(4)] },
    // Pachelbel's canon: I V vi iii IV I IV V
    { name: 'Canon', numerals: 'I–V–vi–iii–IV–I–IV–V', mode: 'major', chords: [d(0), d(4), d(5), d(2), d(3), d(0), d(3), d(4)] },
    // ---- both: the ii–V–I reads ii°–V–i in minor, and is the minor ii–V–i
    { name: 'Jazz cadence', numerals: 'ii–V–I', numeralsMinor: 'ii°–V–i', chords: [dia(1), dom7(4), dia(0,2)] },
    // ---- minor
    { name: 'Minor four-chord', numerals: 'i–VI–III–VII', mode: 'minor', chords: [d(0), d(5), d(2), d(6)] },
    { name: 'Minor pop', numerals: 'i–VI–VII', mode: 'minor', chords: [d(0,2), d(5), d(6)] },
    { name: 'Minor rock', numerals: 'i–VII–VI–VII', mode: 'minor', chords: [d(0), d(6), d(5), d(6)] },
    // the Andalusian cadence, with the major V a minor key borrows for it
    { name: 'Andalusian', numerals: 'i–VII–VI–V', mode: 'minor', chords: [d(0), d(6), d(5), d(7)] },
    // ---- Hendrix: the changes his songs are built on, named for where they
    // are heard. A chord progression is common stock — the US Copyright
    // Office's practice and the Second Circuit in Structured Asset Sales v.
    // Sheeran (2024) both put chord progressions outside copyright — so
    // these are given as they are, the way a method book would; the songs'
    // melodies and lines are not here (see hendrix.html, "How this was
    // made"). A chromatic root is 'c' + semitones above the tonic, as the
    // chart stores it; `shape` names the chord's quality outright.
    {
      name: 'Hendrix', numerals: 'the changes his songs run on', numeralsMinor: 'the changes his songs run on',
      variants: [
        // C–G–D–A–E: each chord a 4th below the last (a 5th above), the cycle
        // Hey Joe runs round, in E with the two bars of E at the end
        { name: 'Cycle of fourths (Hey Joe)', mode: 'major', chords: [c(8), c(3), c(10), d(3), d(0, 2)] },
        // Little Wing's twelve bars: the minor key's own chords with a ♭II
        // (F in E minor) and a chord a tritone from the tonic (B♭) slid in
        { name: 'Soul ballad (Little Wing)', mode: 'minor',
          chords: [d(0), d(2), d(3), d(0), d(4), c(6), d(3), d(5), d(2), c(1), d(5), d(6)] },
        // the Hendrix chord as home, with the ♭III and the IV — Purple Haze,
        // and the E–G–A of Wait Until Tomorrow's chorus without the ♯9
        { name: 'Fuzz vamp (Purple Haze)', mode: 'major', chords: [sh(0, '7♯9', 2), c(3), d(3)] },
        // I–V–♭VII–IV, the Mixolydian chorus of Castles Made of Sand
        { name: 'Mixolydian ballad (Castles Made of Sand)', mode: 'major', chords: [d(0), d(4), c(10), d(3)] },
        // Red House: the slow twelve in 12/8, the IV as a 9th chord
        { name: 'Slow blues in 12/8 (Red House)', mode: 'major',
          chords: [sh(0, '7', 4), sh(3, '9', 2), sh(0, '7', 2), sh(4, '7'), sh(3, '9'), sh(0, '7'), sh(4, '7')] },
        // The Wind Cries Mary's verse: C–B♭–F, with the II major and the ♭VI
        { name: 'Chromatic soul (The Wind Cries Mary)', mode: 'major',
          chords: [d(4), d(3), d(0, 2), sh(1, 'maj'), d(3), c(8), d(0)] },
        // Bold as Love: the verse and the chorus with its VI major and ♭VII
        { name: 'R&B ballad (Bold as Love)', mode: 'major',
          chords: [d(0), d(4), d(5), d(3), d(4), sh(5, 'maj'), c(10), d(0)] },
        // All Along the Watchtower: i–VII–VI–VII (also "Minor rock" above)
        { name: 'Minor rock (All Along the Watchtower)', mode: 'minor', chords: [d(0), d(6), d(5), d(6)] },
        // Freedom: C, E♭, C7, F7 — the funk of the last year
        { name: 'Funk (Freedom)', mode: 'major', chords: [d(0), c(3), sh(0, '7'), sh(3, '7')] },
        // Manic Depression's waltz: A–G–D–D♯–E, the chromatic climb to the V
        { name: 'Waltz riff (Manic Depression)', mode: 'major', chords: [d(0), c(10), d(3), c(6), d(4)] },
        // the one chord Voodoo Child and Machine Gun sit on
        { name: 'One-chord vamp (Voodoo Child)', mode: 'major', chords: [sh(0, '7♯9', 4)] },
      ],
    },
    // ---- Psychobilly, and the rockabilly under it: the forms the deep dive
    // (psychobilly.html) is built on, named for the way of playing they
    // carry, not for any one song — a twelve-bar is nobody's, and a walk
    // down a minor key by whole steps is a method-book device
    {
      name: 'Psychobilly', numerals: 'the forms the music runs on', numeralsMinor: 'the forms the music runs on',
      variants: [
        // the rockabilly twelve: I four bars, IV two, I two, V7, IV, I two
        { name: 'Rockabilly twelve (the Sun way)', mode: 'major', chords: [d(0, 4), d(3, 2), d(0, 2), sh(4, '7'), d(3), d(0, 2)] },
        // the swing side's twelve with the 6th on the I and 9ths on the IV and V
        { name: 'Jump twelve with the 6/9 (the Martini way)', mode: 'major', chords: [sh(0, '6', 4), sh(3, '9', 2), sh(0, '6', 2), sh(4, '9'), sh(3, '9'), sh(0, '6'), sh(4, '9')] },
        // i–♭VII7–♭VI7–V7: the swung walk-down of a minor key by whole steps
        { name: 'Stray descent (the Strut way)', mode: 'minor', chords: [d(0), sh(6, '7'), sh(5, '7'), sh(4, '7')] },
        // the country two-step: I, IV, I, V7, I
        { name: 'Train two-step (the Cash way)', mode: 'major', chords: [d(0, 2), d(3), d(0), sh(4, '7'), d(0)] },
        // the minor stomp: i, III, iv, i, V7, i
        { name: 'Minor stomp (the Meteors way)', mode: 'minor', chords: [d(0, 2), d(2), d(3), d(0), sh(4, '7'), d(0)] },
        // the twelve at wrecking pace, plain majors
        { name: 'Wrecking twelve (the second wave)', mode: 'major', chords: [d(0, 4), d(3, 2), d(0, 2), d(4), d(3), d(0, 2)] },
        // the surf side: I, I, I, IV, V7, IV
        { name: 'Surf-billy (the Freakout way)', mode: 'major', chords: [d(0, 3), d(3), sh(4, '7'), d(3)] },
        // the third wave's minor key: i, VI, V7, i, iv, V7
        { name: 'Horror minor (the third wave)', mode: 'minor', chords: [d(0), d(5), sh(4, '7'), d(0), d(3), sh(4, '7')] },
      ],
    },
  ];

  // every preset presented the same way, whether or not it has variants
  GT.progressionPresets.forEach(p => {
    if (!p.variants) p.variants = [{ name: '', chords: p.chords }];
    if (!p.numerals) p.numerals = '';
  });
})();
