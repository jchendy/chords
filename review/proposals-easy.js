// Easy mode: the beginner's version of a part, where a rule wouldn't get
// there. The page's rule (review.js: simplify) drops ghost notes, rakes,
// tremolo, chord slides and color tones, plays bends, hammer-ons, pull-offs
// and slides plain, moves sixteenths back onto eighths and drops the middle
// of a triplet. That is enough for most parts. The ones here have a
// beginner's form of their own that a rule can't find — the first way a
// teacher would show the style — and it is written out: fewer notes, on the
// beat, the same idea.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { n, nx, s, d } = GT.reviewHelpers;

  const parts = {};
  GT.review.genres.forEach(genre => {
    (genre.existing || []).forEach(e => (e.parts || []).forEach(pt => { parts[`${genre.id}|${e.label}|${pt.name}`] = pt; }));
    (genre.additions || []).forEach(a => (a.parts || []).forEach(pt => { parts[`${genre.id}|${a.label}|${pt.name}`] = pt; }));
  });
  const missing = [];
  const easy = (key, block) => { const pt = parts[key]; if (!pt){ missing.push(key); return; } pt.easy = block; };

  // ---- blues (twelve to the bar) ----
  easy('blues|Blues shuffle|5–6 boogie', {
    // root-5th on every beat, no upstroke, no mute yet; the 6th on 2 and 4
    figure: [d(0, 0, 7, 2.6, 0.85), d(3, 0, 9, 2.6, 0.8), d(6, 0, 7, 2.6, 0.85), d(9, 0, 9, 2.6, 0.8)],
    variants: [[d(0, 0, 7, 2.6, 0.85), d(3, 0, 7, 2.6, 0.75), d(6, 0, 7, 2.6, 0.85), d(9, 0, 7, 2.6, 0.75)]],
    fills: [[d(0, 0, 7, 2.6, 0.85), d(3, 0, 9, 2.6, 0.8), n(6, 10, 2.6, 0.85), n(9, 0, 2.6, 0.85)]],
    fillsOnChange: [[d(0, 0, 7, 2.6, 0.85), d(3, 0, 9, 2.6, 0.8), nx(6, -3, 2.6, 0.85), nx(9, -1, 2.6, 0.85)]],
    fillsOnStay: [[d(0, 0, 7, 2.6, 0.85), d(3, 0, 9, 2.6, 0.8), d(6, 0, 10, 2.6, 0.85), d(9, 0, 9, 2.6, 0.8)]],
  });
  easy('blues|Blues shuffle|Stabs and licks', {
    figure: [s(0, 5, 0.85, 'high'), s(6, 3, 0.8, 'high'), n(9, 10, 3, 0.8)],
    variants: [[s(0, 5, 0.85, 'high'), s(6, 3, 0.8, 'high'), n(9, 7, 3, 0.8)]],
    fills: [[n(0, 0, 3, 0.85), n(3, 3, 3, 0.8), n(6, 7, 3, 0.85), n(9, 10, 3, 0.8)]],
    fillsOnChange: [[s(0, 5, 0.85, 'high'), n(6, 10, 3, 0.85), nx(9, 4, 3, 0.85)]],
    fillsOnStay: [[n(0, 7, 6, 0.85), n(6, 7, 3, 0.7), n(9, 5, 3, 0.75)]],
  });
  easy('blues|Slow blues|9th-chord comp (Walker-inspired)', {
    figure: [s(0, 6, 0.8, 'high'), n(6, 7, 6, 0.75)],
    variants: [[s(0, 6, 0.8, 'high'), s(6, 6, 0.65, 'high')]],
    fills: [[n(0, 3, 3, 0.8), n(3, 0, 3, 0.8), n(6, 10, 3, 0.8), n(9, 7, 3, 0.75)]],
    fillsOnChange: [[s(0, 6, 0.8, 'high'), n(6, 10, 3, 0.8), nx(9, 4, 3, 0.85)]],
    fillsOnStay: [[s(0, 9, 0.8, 'high'), n(9, 0, 3, 0.8)]],
  });
  easy('blues|Jump blues|Boogie walk under the stabs', {
    // the walk in quarter notes: root, 3, 5, 6
    figure: [n(0, 0, 2.6, 0.9), n(3, 4, 2.6, 0.8), n(6, 7, 2.6, 0.85), n(9, 9, 2.6, 0.8)],
    variants: [[n(0, 0, 2.6, 0.9), n(3, 4, 2.6, 0.8), n(6, 7, 2.6, 0.85), n(9, 10, 2.6, 0.8)]],
    fills: [[n(0, 12, 2.6, 0.9), n(3, 10, 2.6, 0.8), n(6, 7, 2.6, 0.85), n(9, 4, 2.6, 0.8)]],
    fillsOnChange: [[n(0, 0, 2.6, 0.9), n(3, 4, 2.6, 0.8), nx(6, -3, 2.6, 0.85), nx(9, -1, 2.6, 0.85)]],
    fillsOnStay: [[n(0, 0, 2.6, 0.9), n(3, 7, 2.6, 0.8), n(6, 10, 2.6, 0.85), n(9, 7, 2.6, 0.8)]],
  });
  easy('blues|Texas shuffle|Everything at once', {
    // the shuffle strum on the low strings, down and up, before the rakes
    figure: [s(0, 1.6, 0.85, 'low'), s(2, 0.8, 0.5, 'low'), s(3, 1.6, 0.75, 'low'), s(5, 0.8, 0.5, 'low'), s(6, 1.6, 0.85, 'low'), s(8, 0.8, 0.5, 'low'), s(9, 1.6, 0.75, 'low'), s(11, 0.8, 0.5, 'low')],
    variants: [[s(0, 2.6, 0.85, 'low'), s(3, 2.6, 0.75, 'low'), s(6, 2.6, 0.85, 'low'), s(9, 2.6, 0.75, 'low')]],
    fills: [[n(0, 12, 2.6, 0.9), n(3, 10, 2.6, 0.8), n(6, 7, 2.6, 0.85), n(9, 0, 2.6, 0.85)]],
    fillsOnChange: [[s(0, 2.6, 0.85, 'low'), s(3, 2.6, 0.75, 'low'), nx(6, -3, 2.6, 0.85), nx(9, -1, 2.6, 0.85)]],
    fillsOnStay: [[s(0, 2.6, 0.85, 'low'), s(3, 2.6, 0.75, 'low'), s(6, 2.6, 0.85, 'low'), n(9, 10, 2.6, 0.8)]],
  });
  easy('blues|Texas shuffle|Texas triplets', {
    figure: [s(0, 2.6, 0.85, 'low'), s(3, 2.6, 0.75, 'low'), n(6, 12, 2.6, 0.85), n(9, 10, 2.6, 0.8)],
    variants: [[s(0, 2.6, 0.85, 'low'), s(3, 2.6, 0.75, 'low'), n(6, 7, 2.6, 0.85), n(9, 5, 2.6, 0.8)]],
    fills: [[n(0, 12, 2.6, 0.9), n(3, 10, 2.6, 0.8), n(6, 7, 2.6, 0.85), n(9, 3, 2.6, 0.85)]],
    fillsOnChange: [[n(0, 7, 2.6, 0.85), n(3, 5, 2.6, 0.8), n(6, 3, 2.6, 0.8), nx(9, 4, 2.6, 0.85)]],
    fillsOnStay: [[n(0, 7, 2.6, 0.85), n(3, 5, 2.6, 0.8), n(6, 3, 2.6, 0.8), n(9, 0, 2.6, 0.9)]],
  });

  // ---- rock (sixteen to the bar) ----
  easy('rock|Straight rock|Eighth-note chug, muted', {
    // quarter-note strums first; the chug comes later
    figure: [s(0, 3.6, 0.95, 'low'), s(4, 3.6, 0.7, 'low'), s(8, 3.6, 0.9, 'low'), s(12, 3.6, 0.7, 'low')],
    variants: [[s(0, 7.6, 0.95, 'low'), s(8, 7.6, 0.9, 'low')]],
    fills: [[n(0, 0, 4, 0.9), n(4, 3, 4, 0.8), n(8, 5, 4, 0.85), n(12, 7, 4, 0.85)]],
    fillsOnChange: [[s(0, 3.6, 0.95, 'low'), s(4, 3.6, 0.7, 'low'), nx(8, -3, 4, 0.85), nx(12, -1, 4, 0.9)]],
    fillsOnStay: [[s(0, 3.6, 0.95, 'low'), s(4, 3.6, 0.7, 'low'), n(8, 12, 4, 0.9), n(12, 10, 4, 0.8)]],
  });
  easy("rock|Rock 'n' roll|Straight boogie", {
    figure: [d(0, 0, 7, 3.6, 0.9), d(4, 0, 7, 3.6, 0.7), d(8, 0, 9, 3.6, 0.85), d(12, 0, 9, 3.6, 0.7)],
    variants: [[d(0, 0, 7, 3.6, 0.9), d(4, 0, 9, 3.6, 0.8), d(8, 0, 10, 3.6, 0.85), d(12, 0, 9, 3.6, 0.8)]],
    fills: [[d(0, 0, 7, 3.6, 0.9), d(4, 0, 9, 3.6, 0.8), n(8, 10, 4, 0.85), n(12, 0, 4, 0.85)]],
    fillsOnChange: [[d(0, 0, 7, 3.6, 0.9), d(4, 0, 9, 3.6, 0.8), nx(8, -3, 4, 0.85), nx(12, -1, 4, 0.9)]],
    fillsOnStay: [[d(0, 0, 7, 3.6, 0.9), d(4, 0, 9, 3.6, 0.8), d(8, 0, 10, 3.6, 0.85), d(12, 0, 9, 3.6, 0.8)]],
  });

  // ---- rockabilly / western swing (twelve) ----
  easy('rockabilly|Western swing|Four to the bar, 6ths and 9ths', {
    figure: [s(0, 1.2, 0.6, 'low'), s(3, 1.2, 0.8, 'low'), s(6, 1.2, 0.6, 'low'), s(9, 1.2, 0.8, 'low')],
    variants: [[s(0, 2.6, 0.7, 'low'), s(6, 2.6, 0.7, 'low')]],
    fills: [[s(0, 1.2, 0.6, 'low'), s(3, 1.2, 0.8, 'low'), n(6, 4, 3, 0.8), n(9, 7, 3, 0.8)]],
    fillsOnChange: [[s(0, 1.2, 0.6, 'low'), s(3, 1.2, 0.8, 'low'), n(6, 9, 3, 0.8), nx(9, 4, 3, 0.85)]],
    fillsOnStay: [[s(0, 1.2, 0.6, 'low'), s(3, 1.2, 0.8, 'low'), s(6, 1.2, 0.6, 'low'), n(9, 9, 3, 0.8)]],
  });

  // ---- country / bluegrass (sixteen) ----
  easy('country|Country|Travis picking (Travis/Atkins-inspired)', {
    // the thumb on the beats, one melody note on each "and" — the first Travis exercise
    figure: [s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 12, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 4, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 7, 2, 0.6)],
    variants: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 12, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 12, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 12, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 12, 2, 0.6)]],
    fills: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 7, 2, 0.65), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 9, 2, 0.65), s(8, 2, 0.85, 'bass', 'mute'), n(10, 7, 2, 0.65), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 4, 2, 0.65)]],
    fillsOnChange: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 7, 2, 0.6), nx(8, -3, 4, 0.85, { pm: true }), nx(12, -1, 4, 0.85, { pm: true })]],
    fillsOnStay: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 12, 2, 0.65), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 9, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 7, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 4, 2, 0.6)]],
  });
  easy('country|Hot country|Banjo rolls', {
    // the roll in eighths: root, 5th, octave, 5th
    figure: [n(0, 0, 2, 0.85), n(2, 7, 2, 0.6), n(4, 12, 2, 0.7), n(6, 7, 2, 0.6), n(8, 0, 2, 0.85), n(10, 7, 2, 0.6), n(12, 12, 2, 0.7), n(14, 7, 2, 0.6)],
    variants: [[n(0, 0, 2, 0.85), n(2, 4, 2, 0.6), n(4, 7, 2, 0.7), n(6, 12, 2, 0.7), n(8, 0, 2, 0.85), n(10, 4, 2, 0.6), n(12, 7, 2, 0.7), n(14, 12, 2, 0.7)]],
    fills: [[n(0, 12, 2, 0.9), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), n(8, 2, 2, 0.8), n(10, 0, 2, 0.8), n(12, 7, 4, 0.85)]],
    fillsOnChange: [[n(0, 0, 2, 0.85), n(2, 7, 2, 0.6), n(4, 12, 2, 0.7), n(6, 7, 2, 0.6), n(8, 9, 4, 0.8), nx(12, -1, 4, 0.85)]],
    fillsOnStay: [[n(0, 4, 2, 0.85), n(2, 7, 2, 0.6), n(4, 9, 2, 0.7), n(6, 12, 2, 0.7), n(8, 9, 2, 0.8), n(10, 7, 2, 0.7), n(12, 4, 2, 0.75), n(14, 0, 2, 0.75)]],
  });
  easy('bluegrass|Bluegrass|Crosspicking (Watson/White-inspired)', {
    figure: [n(0, 0, 2, 0.85), n(2, 7, 2, 0.6), n(4, 12, 2, 0.7), n(6, 4, 2, 0.6), n(8, 7, 2, 0.8), n(10, 12, 2, 0.6), n(12, 0, 2, 0.75), n(14, 7, 2, 0.6)],
    variants: [[n(0, 0, 2, 0.85), n(2, 4, 2, 0.6), n(4, 7, 2, 0.7), n(6, 12, 2, 0.6), n(8, 7, 2, 0.8), n(10, 4, 2, 0.6), n(12, 0, 2, 0.75), n(14, 4, 2, 0.6)]],
    fills: [[n(0, 12, 2, 0.9), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), n(8, 2, 2, 0.8), n(10, 0, 2, 0.8), n(12, 7, 2, 0.85), n(14, 9, 2, 0.85)]],
    fillsOnChange: [[n(0, 0, 2, 0.85), n(2, 7, 2, 0.6), n(4, 12, 2, 0.7), n(6, 4, 2, 0.6), nx(8, -5, 2, 0.9), nx(10, -3, 2, 0.8), nx(12, -2, 2, 0.85), nx(14, -1, 2, 0.9)]],
    fillsOnStay: [[n(0, 0, 2, 0.85), n(2, 7, 2, 0.6), n(4, 12, 2, 0.7), n(6, 4, 2, 0.6), n(8, 7, 2, 0.8), n(10, 9, 2, 0.6), n(12, 12, 2, 0.85), n(14, 9, 2, 0.6)]],
  });

  // ---- jazz ----
  easy('jazz|Bossa nova|The batida, two bars', {
    // one bar: bass on 1, chord on the and of 2; bass on 3, chord on 4
    figure: [s(0, 4, 0.85, 'bass'), s(6, 2, 0.55, 'high'), s(8, 4, 0.8, 'bass'), s(12, 2, 0.55, 'high')],
    variants: [[s(0, 4, 0.85, 'bass'), s(4, 2, 0.55, 'high'), s(8, 4, 0.8, 'fifth'), s(12, 2, 0.55, 'high')]],
    fills: [[s(0, 4, 0.85, 'bass'), n(4, 4, 4, 0.65), n(8, 7, 4, 0.7), n(12, 9, 4, 0.65)]],
    fillsOnChange: [[s(0, 4, 0.85, 'bass'), s(6, 2, 0.55, 'high'), n(8, 9, 4, 0.65), nx(12, 4, 4, 0.7)]],
    fillsOnStay: [[s(0, 4, 0.85, 'bass'), s(6, 2, 0.55, 'high'), s(8, 4, 0.8, 'bass'), n(12, 12, 4, 0.65)]],
  });
  easy('jazz|Gypsy jazz|Pompe and diminished runs', {
    // four downstrokes, no lift; the run in quarter notes — 3rd, 5th, ♭7, root above
    figure: [s(0, 1.2, 0.55), s(3, 1, 0.8), s(6, 1.2, 0.55), s(9, 1, 0.8)],
    variants: [[s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 4, 2.6, 0.85), n(9, 7, 2.6, 0.8)],
               [n(0, 0, 2.6, 0.85), n(3, 4, 2.6, 0.8), s(6, 1.2, 0.55), s(9, 1, 0.8)]],
    fills: [[n(0, 4, 2.6, 0.85), n(3, 7, 2.6, 0.8), n(6, 10, 2.6, 0.85), n(9, 12, 2.6, 0.85)]],
    fillsOnChange: [[s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 10, 2.6, 0.85), nx(9, 1, 2.6, 0.8)]],
    fillsOnStay: [[s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 12, 2.6, 0.85), n(9, 9, 2.6, 0.8)]],
  });
  easy('jazz|Bebop|Bebop line', {
    // the guide tones in quarter notes: 3rd, 5th, 7th, root
    figure: [n(0, 4, 2.6, 0.85), n(3, 7, 2.6, 0.75), n(6, 10, 2.6, 0.85), n(9, 12, 2.6, 0.75)],
    variants: [[n(0, 10, 2.6, 0.85), n(3, 7, 2.6, 0.75), n(6, 4, 2.6, 0.85), n(9, 0, 2.6, 0.75)]],
    fills: [[n(0, 0, 2.6, 0.85), n(3, 2, 2.6, 0.75), n(6, 4, 2.6, 0.85), n(9, 7, 2.6, 0.75)]],
    fillsOnChange: [[n(0, 4, 2.6, 0.85), n(3, 7, 2.6, 0.75), n(6, 10, 2.6, 0.85), nx(9, 4, 2.6, 0.85)]],
    fillsOnStay: [[n(0, 4, 2.6, 0.85), n(3, 5, 2.6, 0.75), n(6, 7, 2.6, 0.85), n(9, 4, 2.6, 0.75)]],
  });
  easy('jazz|Samba|Partido alto', {
    figure: [s(0, 4, 0.8, 'bass'), s(6, 2, 0.55, 'high'), s(8, 4, 0.75, 'bass'), s(12, 2, 0.55, 'high')],
    variants: [[s(0, 4, 0.8, 'bass'), s(4, 2, 0.55, 'high'), s(8, 4, 0.75, 'fifth'), s(14, 2, 0.5, 'high')]],
    fills: [[s(0, 4, 0.8, 'bass'), n(4, 4, 4, 0.65), n(8, 7, 4, 0.7), n(12, 9, 4, 0.65)]],
    fillsOnChange: [[s(0, 4, 0.8, 'bass'), s(6, 2, 0.55, 'high'), n(8, 9, 4, 0.65), nx(12, 4, 4, 0.7)]],
    fillsOnStay: [[s(0, 4, 0.8, 'bass'), s(6, 2, 0.55, 'high'), s(8, 4, 0.75, 'bass'), n(12, 12, 4, 0.65)]],
  });
  easy('jazz|Son montuno|Montuno', {
    // the arpeggio on beats 2, 3 and 4 — the offbeats come later
    figure: [d(4, 0, 4, 4, 0.8), d(8, 4, 7, 4, 0.75), d(12, 7, 12, 4, 0.8)],
    variants: [[d(4, 7, 12, 4, 0.8), d(8, 4, 7, 4, 0.75), d(12, 0, 4, 4, 0.8)]],
    fills: [[n(4, 0, 4, 0.8), n(8, 4, 4, 0.75), n(12, 7, 4, 0.8)]],
    fillsOnChange: [[d(4, 0, 4, 4, 0.8), d(8, 4, 7, 4, 0.75), nx(12, 0, 4, 0.8)]],
  });

  // ---- soul ----
  easy('soul|Neo-soul|Swung arpeggios', {
    figure: [n(0, 0, 4, 0.7), n(4, 7, 4, 0.6), n(8, 10, 4, 0.65), n(12, 14, 4, 0.65)],
    variants: [[n(0, 3, 4, 0.7), n(4, 7, 4, 0.6), n(8, 12, 4, 0.65), n(12, 10, 4, 0.6)]],
    fills: [[n(0, 12, 4, 0.7), n(4, 10, 4, 0.6), n(8, 7, 4, 0.65), n(12, 3, 4, 0.65)]],
    fillsOnChange: [[n(0, 0, 4, 0.7), n(4, 7, 4, 0.6), n(8, 10, 4, 0.65), nx(12, 3, 4, 0.7)]],
    fillsOnStay: [[s(0, 8, 0.55, 'high'), n(8, 12, 4, 0.65), n(12, 10, 4, 0.6)]],
  });

  // ---- funk / disco ----
  easy('funk|Classic funk|Chicken scratch', {
    // the chord on the One and the and of 2, a muted chuck on 3 — before the sixteenths
    figure: [s(0, 2, 0.85, 'high'), s(6, 2, 0.7, 'high'), s(8, 1, 0.5, 'high', 'mute'), s(12, 1, 0.5, 'high', 'mute')],
    variants: [[s(0, 2, 0.85, 'high'), s(4, 1, 0.5, 'high', 'mute'), s(8, 2, 0.75, 'high'), s(12, 1, 0.5, 'high', 'mute')]],
    fills: [[s(0, 2, 0.85, 'high'), n(8, 0, 2, 0.8), n(10, 10, 2, 0.75), n(12, 12, 4, 0.8)]],
    fillsOnChange: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.7, 'high'), n(12, 10, 2, 0.75), nx(14, 0, 2, 0.85)]],
    fillsOnStay: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.7, 'high'), s(8, 1, 0.5, 'high', 'mute'), s(10, 2, 0.7, 'high'), s(12, 1, 0.5, 'high', 'mute')]],
  });
  easy('funk|Disco|The chuck', {
    // the chords on the ands, nothing between
    figure: [s(2, 2, 0.8, 'high'), s(6, 2, 0.8, 'high'), s(10, 2, 0.8, 'high'), s(14, 2, 0.8, 'high')],
    variants: [[s(2, 2, 0.8, 'high'), s(6, 2, 0.8, 'high'), s(8, 1, 0.5, 'high', 'mute'), s(10, 2, 0.8, 'high'), s(14, 2, 0.8, 'high')]],
    fills: [[s(2, 2, 0.8, 'high'), s(6, 2, 0.8, 'high'), n(8, 0, 2, 0.8), n(10, 12, 2, 0.7), n(12, 0, 2, 0.8), n(14, 12, 2, 0.7)]],
    fillsOnChange: [[s(2, 2, 0.8, 'high'), s(6, 2, 0.8, 'high'), s(10, 2, 0.8, 'high'), nx(14, 0, 2, 0.85)]],
    fillsOnStay: [[s(2, 2, 0.8, 'high'), s(6, 2, 0.8, 'high'), s(10, 2, 0.8, 'high'), s(12, 1, 0.5, 'high', 'mute'), s(14, 2, 0.8, 'high')]],
  });
  easy('funk|Minneapolis|Triad stabs', {
    figure: [s(0, 2, 0.85, 'high'), s(6, 2, 0.8, 'high'), s(12, 2, 0.8, 'high')],
    variants: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.8, 'high'), s(10, 2, 0.75, 'high')]],
    fills: [[s(0, 2, 0.85, 'high'), n(8, 12, 2, 0.8), n(10, 10, 2, 0.7), n(12, 7, 4, 0.75)]],
    fillsOnChange: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.8, 'high'), nx(12, 3, 2, 0.7), nx(14, 4, 2, 0.8)]],
  });
  easy('funk|Steady motor|Rhythm within the rhythm', {
    // the chords on the beats, then on 1 and 3 — the motor is what comes after
    figure: [s(0, 2, 0.85, 'high'), s(4, 2, 0.7, 'high'), s(8, 2, 0.8, 'high'), s(12, 2, 0.7, 'high')],
    variants: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.7, 'high'), s(8, 2, 0.8, 'high'), s(14, 2, 0.7, 'high')]],
    fills: [[s(0, 2, 0.85, 'high'), s(4, 2, 0.7, 'high'), s(8, 2, 0.8, 'high'), s(10, 2, 0.6, 'high'), s(12, 2, 0.7, 'high')]],
    fillsOnChange: [[s(0, 2, 0.85, 'high'), s(4, 2, 0.7, 'high'), s(8, 2, 0.8, 'high'), nx(12, 0, 4, 0.8)]],
    fillsOnStay: [[s(0, 2, 0.85, 'high'), s(6, 2, 0.7, 'high'), s(8, 2, 0.8, 'high'), s(12, 2, 0.7, 'high'), s(14, 2, 0.6, 'high')]],
  });

  // ---- metal ----
  easy('metal|Metal|Pedal riff (♭2 and ♭5)', {
    // the pedal in eighths, palm-muted, each riff note held a beat; the chord opened on one
    figure: [s(0, 2, 0.95, 'low'), s(2, 1.8, 0.55, 'bass', 'mute'), n(4, 1, 4, 0.85, { pm: true }), s(8, 1.8, 0.9, 'bass', 'mute'), s(10, 1.8, 0.55, 'bass', 'mute'), n(12, 6, 4, 0.85, { pm: true })],
    variants: [[s(0, 2, 0.95, 'low'), s(2, 1.8, 0.55, 'bass', 'mute'), s(4, 1.8, 0.8, 'bass', 'mute'), s(6, 1.8, 0.55, 'bass', 'mute'), n(8, 1, 4, 0.9, { pm: true }), n(12, 3, 4, 0.85, { pm: true })],
               [s(0, 1.8, 0.9, 'bass', 'mute'), s(2, 1.8, 0.55, 'bass', 'mute'), s(4, 1.8, 0.8, 'bass', 'mute'), s(6, 1.8, 0.55, 'bass', 'mute'), s(8, 4, 0.95, 'low'), s(12, 4, 0.9, 'low')]],
    fills: [[n(0, 12, 4, 0.9), n(4, 7, 4, 0.85, { pm: true }), n(8, 6, 4, 0.85, { pm: true }), n(12, 1, 2, 0.85, { pm: true }), n(14, 0, 2, 0.9, { pm: true })]],
    fillsOnChange: [[s(0, 2, 0.95, 'low'), s(2, 1.8, 0.55, 'bass', 'mute'), n(4, 1, 4, 0.85, { pm: true }), n(8, 6, 4, 0.85, { pm: true }), nx(12, 1, 4, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 4, 0.95, 'low'), s(4, 1.8, 0.8, 'bass', 'mute'), s(6, 1.8, 0.55, 'bass', 'mute'), s(8, 4, 0.95, 'low'), n(12, 6, 4, 0.9)]],
  });

  const written = Object.keys(parts).filter(k => parts[k].easy).length;
  GT.review.engine.unshift({
    id: 'easy', title: 'Easy mode: a simpler version of every part', demo: true,
    why: `<p>One switch that plays every part the way a teacher would show it first: fewer notes, on the beat, no bends, hammer-ons, pull-offs, slides, rakes, tremolo or ghost notes (double stops stay — they are not the hard part), sixteenths back on the eighths, and no tails, pickups or stop-time. ${written} parts have an easy version written for them where a rule couldn't find the beginner's form (the boogie in quarter notes, la pompe without the lift, the batida in one bar, bebop as guide tones, the scratch as the chord on the One); the rest are simplified by rule. The "Easy mode" checkbox above does it here. In the app it would be a toggle in the part view, and a third reading of the same part rather than a second library.</p>`,
  });

  if (missing.length) console.warn('proposals-easy: no part for', missing);
  GT.reviewEasy = { missing, written };
})();
