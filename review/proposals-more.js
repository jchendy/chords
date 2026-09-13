// The second pass over the proposals: more fills where a player in the
// idiom would have more to say, and the ways of mixing the figure and the
// fills that the research turned up — tails (a lick tagged on the second
// half of a figure bar), pickups (a lead-in on the last beat before a
// change), stop-time bars, several turnarounds to choose from, and figures
// rolled rather than cycled where players vary the strum bar to bar.
//
// Nothing is added for its own sake: a part gets what its idiom has. The
// Ramones get no fills, Freddie Green gets no tails, Afrobeat's ostinato
// stays an ostinato. Each extension says why.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { n, nx, s, g, d, b, h, p, sl, chug } = GT.reviewHelpers;
  // a strum on the NEXT chord — the push on the "and of 4"
  const sn = (at, dur, vel, voicing, mute, x) => ({ ...s(at, dur, vel, voicing, mute, x), next: true });
  // a double stop written against the next chord
  const dn = (at, iv, iv2, dur, vel, x) => ({ ...d(at, iv, iv2, dur, vel, x), next: true });

  const parts = {};
  GT.review.genres.forEach(genre => {
    (genre.existing || []).forEach(e => (e.parts || []).forEach(pt => { parts[`${genre.id}|${e.label}|${pt.name}`] = pt; }));
    (genre.additions || []).forEach(a => (a.parts || []).forEach(pt => { parts[`${genre.id}|${a.label}|${pt.name}`] = pt; }));
  });
  const missing = [];
  // arrays are added to, scalars set; `why2` is appended to the card's text
  function extend(key, extra){
    const pt = parts[key];
    if (!pt){ missing.push(key); return; }
    Object.keys(extra).forEach(k => {
      if (k === 'why2'){ pt.why = (pt.why || '') + ' ' + extra[k]; return; }
      // a part written with one turnaround keeps it in the roll when more are added
      if (k === 'turnarounds' && !pt.turnarounds && pt.turnaround) pt.turnarounds = [pt.turnaround];
      if (Array.isArray(extra[k]) && Array.isArray(pt[k])) pt[k] = pt[k].concat(extra[k]);
      else pt[k] = extra[k];
    });
  }

  // =========================================================================
  // BLUES — twelve to the bar
  extend('blues|Blues shuffle|5–6 boogie', {
    why2: 'Second pass: a third change fill (the stabs pushed into the change), a third stay fill (two beats of chops before the boogie), three tails, two more turnarounds, and stop-time bars — the Chicago band drops out on the One and the guitar fills.',
    fillsOnChange: [
      [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
       s(6, 1.6, 0.85, 'high'), s(9, 1.6, 0.8, 'high'), sn(11, 0.8, 0.85, 'high', null, { chordSlide: 1 })],
    ],
    fillsOnStay: [
      [s(0, 0.8, 0.6, 'high'), s(2, 0.8, 0.6, 'high'), s(3, 0.8, 0.6, 'high'), s(5, 0.8, 0.6, 'high'),
       d(6, 0, 7, 1.6, 0.85, { pm: true }), d(8, 0, 7, 0.8, 0.5, { pm: true }), d(9, 0, 9, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
    ],
    tails: [
      [n(9, 3, 0.8, 0.8), n(10, 4, 0.8, 0.8), n(11, 7, 0.8, 0.8)],
      [n(9, 12, 1.6, 0.85), n(11, 10, 0.8, 0.7)],
      [d(9, 0, 10, 1.6, 0.85, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
    ],
    turnarounds: [
      [n(0, 0, 2.4, 0.85), n(3, 3, 0.8, 0.75), n(4, 4, 0.8, 0.8), n(5, 7, 0.8, 0.8), n(6, 10, 1.6, 0.85), n(8, 12, 0.8, 0.8), nx(9, 2, 1.6, 0.8), nx(11, 0, 0.8, 0.85)],
      [d(0, 4, 10, 1.6, 0.85), d(2, 4, 10, 0.8, 0.5), d(3, 3, 9, 1.6, 0.8), d(5, 3, 9, 0.8, 0.5), d(6, 2, 8, 1.6, 0.8), d(8, 2, 8, 0.8, 0.5), nx(9, 1, 1.6, 0.8, { chordSlide: 1 }), sn(11, 0.8, 0.85, 'high')],
    ],
    stops: [
      [s(0, 2.4, 0.9), n(3, 3, 0.8, 0.8), n(4, 4, 0.8, 0.8), n(5, 7, 0.8, 0.8), n(6, 10, 1.6, 0.85), n(8, 7, 0.8, 0.7), n(9, 3, 0.8, 0.75), n(10, 4, 0.8, 0.8), n(11, 0, 0.8, 0.85)],
      [s(0, 2.4, 0.9), n(6, 12, 0.8, 0.85, { rake: true }), n(7, 10, 0.8, 0.75), n(8, 7, 0.8, 0.8), b(9, 5, 2, 2.4, 0.9, { vib: true })],
    ],
    stopChance: 0.15,
  });
  extend('blues|Blues shuffle|Upbeat chops (the second guitar)', {
    why2: 'Second pass: the chops rolled bar to bar (a second guitarist varies the brush), one more stay fill with a ghosted rake before each chop, one more change fill with the 9th pushed early.',
    figureMode: 'roll',
    fillsOnStay: [[g(0, 0.5, 0.3), s(2, 0.8, 0.65, 'high'), g(3, 0.5, 0.3), s(5, 0.8, 0.65, 'high'), g(6, 0.5, 0.3), s(8, 0.8, 0.65, 'high'), s(9, 0.8, 0.45, 'high'), s(11, 0.8, 0.65, 'high')]],
    fillsOnChange: [[s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), s(8, 0.8, 0.65, 'high'), sn(11, 1, 0.8, 'high', null, { chordSlide: 1, add: 14 })]],
  });
  extend('blues|Blues shuffle|Stabs and licks', {
    why2: 'Second pass: two tails (a rake into the 5th; the 4th bent), one more stay fill (the 5th called twice with vibrato), one more change fill (rake into the ♭7 and walk up).',
    tails: [[n(9, 7, 1.6, 0.85, { rake: true }), n(11, 5, 0.8, 0.65)], [b(9, 5, 2, 2.4, 0.9, { vib: true })]],
    fillsOnStay: [[n(0, 7, 3, 0.9, { vib: true }), n(3, 7, 0.8, 0.5), n(4, 7, 3, 0.85, { vib: true }), s(9, 2.4, 0.8, 'high')]],
    fillsOnChange: [[n(0, 10, 1.6, 0.85, { rake: true }), n(2, 10, 0.8, 0.5), n(3, 7, 1.6, 0.8), n(5, 5, 0.8, 0.7), n(6, 3, 1.6, 0.8), n(8, 4, 0.8, 0.8), nx(9, -2, 1.6, 0.75), nx(11, -1, 0.8, 0.8)]],
  });
  extend('blues|Slow blues|9th-chord comp (Walker-inspired)', {
    why2: 'Second pass: the triplet pickup into the change as a second change fill, a stay fill that is a chord and one note, a second turnaround.',
    fillsOnChange: [[s(0, 6, 0.8, 'high', null, { chordSlide: 1, add: 14 }), n(9, 10, 1, 0.75), n(10, 12, 1, 0.8), nx(11, 4, 1, 0.85, { vib: true })]],
    fillsOnStay: [[s(0, 8, 0.8, 'high', null, { add: 14 }), n(9, 7, 3, 0.8, { vib: true })]],
    turnarounds: [[s(0, 3, 0.8, 'high', null, { add: 14 }), s(3, 3, 0.7, 'high', null, { chordSlide: -1, add: 14 }), s(6, 3, 0.7, 'high', null, { chordSlide: -1 }), sn(9, 3, 0.85, 'high', null, { chordSlide: 1, add: 14 })]],
  });
  extend('blues|Slow blues|The call (King-inspired)', {
    why2: 'Second pass: two more calls — the ♭7 bent and answered by the root; a two-note call on the 5th and ♭7.',
    fills: [[b(3, 10, 2, 3, 0.9, { vib: true }), n(9, 0, 3, 0.8, { vib: true })], [n(0, 7, 2, 0.85, { rake: true }), n(2, 10, 4, 0.85, { vib: true }), n(9, 7, 1, 0.7), n(10, 5, 1, 0.7), n(11, 3, 1, 0.75)]],
  });
  extend('blues|Jump blues|9th stabs (Walker-inspired)', {
    why2: 'Second pass: a change fill where the stabs walk down chromatically into the change (the horn arrangers\' move), a stay fill with the boogie under the stabs, and stop-time bars — a jump band\'s shout chorus.',
    fillsOnChange: [[s(3, 1.6, 0.85, 'high', null, { add: 14 }), s(6, 1.2, 0.7, 'high', null, { add: 14, chordSlide: -1 }), s(8, 1.2, 0.7, 'high', null, { add: 14, chordSlide: -2 }), sn(9, 2.4, 0.85, 'high', null, { add: 14 })]],
    fillsOnStay: [[n(0, 0, 1.6, 0.85, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), s(3, 1.6, 0.85, 'high', null, { add: 14 }), n(6, 7, 1.6, 0.85, { pm: true }), n(8, 9, 0.8, 0.7, { pm: true }), s(9, 1.6, 0.85, 'high', null, { add: 14 })]],
    stops: [[s(0, 1.6, 0.9, 'high', null, { add: 14 }), n(3, 12, 0.8, 0.85), n(4, 10, 0.8, 0.75), n(5, 9, 0.8, 0.75), n(6, 7, 1.6, 0.85), n(8, 7, 0.8, 0.5), n(9, 3, 0.8, 0.75), n(10, 4, 0.8, 0.8), n(11, 0, 0.8, 0.85)]],
    stopChance: 0.15,
  });
  extend('blues|Jump blues|Boogie walk under the stabs', {
    why2: 'Second pass: the walk in octaves into a change, the ♭3-to-3 walk when staying, and a chromatic pickup.',
    fillsOnChange: [[d(0, 0, 12, 1.6, 0.9), d(2, 4, 16, 0.8, 0.7), d(3, 7, 19, 1.6, 0.85), d(5, 9, 21, 0.8, 0.7), nx(6, -5, 1.6, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.6, 0.8, { pm: true }), nx(11, -1, 0.8, 0.85, { pm: true })]],
    fillsOnStay: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 3, 0.8, 0.7, { pm: true }), n(3, 4, 1.6, 0.85, { pm: true }), n(5, 4, 0.8, 0.5, { pm: true }), n(6, 7, 1.6, 0.85, { pm: true }), n(8, 9, 0.8, 0.7, { pm: true }), n(9, 10, 1.6, 0.85, { pm: true }), n(11, 9, 0.8, 0.7, { pm: true })]],
    pickups: [[nx(9, -3, 0.8, 0.75, { pm: true }), nx(10, -2, 0.8, 0.75, { pm: true }), nx(11, -1, 0.8, 0.85, { pm: true })]],
  });
  extend('blues|Texas shuffle|Everything at once', {
    why2: 'Second pass: the walk-down from above into a change, a stay fill of muted rakes and one bend, triplet tails, and stop-time — the Texas shuffle\'s breaks.',
    fillsOnChange: [[d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'), n(6, 12, 0.8, 0.85), n(7, 10, 0.8, 0.75), n(8, 7, 0.8, 0.8), nx(9, 3, 0.8, 0.75), nx(10, 2, 0.8, 0.75), nx(11, 1, 0.8, 0.8)]],
    fillsOnStay: [[s(0, 0.8, 0.5, 'full', 'mute'), s(2, 0.8, 0.5, 'full', 'mute'), s(3, 1.6, 0.95, 'full', null, { rake: true }), s(5, 0.8, 0.5, 'full', 'mute'), s(6, 0.8, 0.5, 'full', 'mute'), s(8, 0.8, 0.5, 'full', 'mute'), b(9, 3, 1, 2.4, 0.9, { vib: true })]],
    tails: [[n(9, 12, 0.8, 0.85), n(10, 10, 0.8, 0.75), n(11, 7, 0.8, 0.8)], [s(9, 1.6, 0.95, 'full', null, { rake: true }), s(11, 0.8, 0.5, 'full', 'mute')]],
    stops: [[s(0, 2.4, 0.95, 'full', null, { rake: true }), n(3, 12, 0.8, 0.85), n(4, 10, 0.8, 0.75), n(5, 7, 0.8, 0.8), n(6, 10, 0.8, 0.85), n(7, 7, 0.8, 0.75), n(8, 5, 0.8, 0.75), b(9, 3, 1, 2.4, 0.9, { vib: true })]],
    stopChance: 0.15,
  });
  extend('blues|Texas shuffle|Texas triplets', {
    why2: 'Second pass: a second run in threes from the octave, and a stay fill that repeats one three-note group.',
    fills: [[n(0, 12, 0.8, 0.9), n(1, 10, 0.8, 0.75), n(2, 9, 0.8, 0.75), n(3, 7, 0.8, 0.85), n(4, 5, 0.8, 0.75), n(5, 3, 0.8, 0.75), n(6, 0, 2.4, 0.9, { vib: true }), n(9, 10, 0.8, 0.75), n(10, 7, 0.8, 0.7), n(11, 3, 0.8, 0.75)]],
    fillsOnStay: [[n(0, 7, 0.8, 0.85), n(1, 5, 0.8, 0.75), n(2, 3, 0.8, 0.75), n(3, 7, 0.8, 0.85), n(4, 5, 0.8, 0.75), n(5, 3, 0.8, 0.75), n(6, 7, 0.8, 0.85), n(7, 5, 0.8, 0.75), n(8, 3, 0.8, 0.75), n(9, 0, 2.4, 0.9, { vib: true })]],
  });
  extend('blues|One-chord boogie|Boogie pedal', {
    why2: 'Second pass: the shout — root, ♭7 above, root — as a third fill, and stop-time, which is half of what a one-chord boogie is: the stomp stops and the guitar answers.',
    fills: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 12, 0.8, 0.85), n(3, 10, 1.6, 0.85), n(5, 0, 0.8, 0.6, { pm: true }), n(6, 0, 1.6, 0.9, { pm: true }), n(8, 12, 0.8, 0.85), n(9, 10, 1.6, 0.85), n(11, 0, 0.8, 0.6, { pm: true })]],
    stops: [[n(0, 0, 2.4, 0.95), n(3, 3, 0.8, 0.8), n(4, 4, 0.8, 0.8), n(5, 0, 0.8, 0.75), n(6, 10, 1.6, 0.85), n(8, 12, 0.8, 0.85), n(9, 10, 0.8, 0.8), n(10, 7, 0.8, 0.75), n(11, 0, 0.8, 0.85)]],
    stopChance: 0.25,
  });
  extend('blues|Delta fingerstyle|Dead thumb and fills', {
    why2: 'Second pass: the walk-down on the low string into the V (the change fill for a root that is above), a stay fill of thumb and the ♭3 hammer alone, and a second turnaround that walks the bass down chromatically.',
    fillsOnChange: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.6), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.6), nx(6, 5, 1.4, 0.85, { pm: true }), nx(8, 4, 0.8, 0.7, { pm: true }), nx(9, 2, 1.4, 0.8, { pm: true }), nx(11, 1, 0.8, 0.8, { pm: true })]],
    fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), h(2, 3, 4, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), s(6, 1.4, 0.85, 'bass', 'mute'), h(8, 3, 4, 0.8, 0.7), s(9, 1.4, 0.8, 'bass', 'mute'), n(11, 0, 0.8, 0.6)]],
    turnarounds: [[n(0, 12, 1.4, 0.85, { pm: true }), d(2, 4, 7, 0.8, 0.6), n(3, 10, 1.4, 0.8, { pm: true }), d(5, 4, 7, 0.8, 0.6), n(6, 9, 1.4, 0.8, { pm: true }), d(8, 4, 7, 0.8, 0.6), n(9, 8, 1.4, 0.8, { pm: true }), nx(11, 0, 0.8, 0.85, { pm: true })]],
  });
  extend('blues|Minor blues|Minor call', {
    why2: 'Second pass: the ♭7–6–5 descent onto the next chord\'s ♭3 as a second change fill; the 4-to-5 bend called twice when staying.',
    fillsOnChange: [[n(0, 10, 3, 0.85, { vib: true }), n(3, 9, 1.5, 0.7), n(4.5, 7, 1.5, 0.7), n(6, 5, 3, 0.8), nx(9, 3, 3, 0.85, { vib: true })]],
    fillsOnStay: [[b(0, 5, 2, 3, 0.9, { vib: true }), b(3, 5, 2, 3, 0.85, { vib: true }), n(6, 3, 1, 0.7), n(7, 0, 5, 0.85, { vib: true })]],
  });

  // =========================================================================
  // ROCK — sixteen to the bar
  extend('rock|Rock|Chords with space (Young-inspired)', {
    why2: 'Second pass: the figures rolled (a rhythm player varies the pattern of open chord and muted eighth from bar to bar), two tails — the sus4 pulled off; a hammered double stop — and a stay fill with the chord opened on 3.',
    figureMode: 'roll',
    tails: [[p(12, 5, 4, 2, 0.8), n(14, 0, 2, 0.8)], [d(12, 4, 7, 2, 0.8), d(14, 4, 7, 2, 0.6)]],
    fillsOnStay: [[s(0, 4, 0.95, 'low'), g(4, 1, 0.3, 'low'), g(6, 1, 0.3, 'low'), s(8, 4, 0.95), h(12, 3, 4, 2, 0.8), n(14, 0, 2, 0.8)]],
    fillsOnChange: [[s(0, 6, 0.95, 'low'), h(6, 2, 4, 2, 0.8), d(8, 4, 7, 2, 0.8), n(10, 7, 2, 0.75), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
  });
  extend('rock|Rock|Stabs on the and', {
    why2: 'Second pass: a second riff (root, ♭3, 4, ♭5), and stop-time — the band out for a bar, the riff alone, which every rock band does before a chorus.',
    fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 1, 0.5, { pm: true }), n(3, 3, 1, 0.8), n(4, 5, 2, 0.85), n(6, 6, 2, 0.8), n(8, 5, 2, 0.8), n(10, 3, 2, 0.75), n(12, 0, 4, 0.9)]],
    stops: [[n(0, 0, 2, 0.95, { pm: true }), n(2, 0, 1, 0.5, { pm: true }), n(3, 10, 1, 0.8), n(4, 12, 2, 0.9), n(6, 10, 2, 0.8), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), b(12, 3, 2, 4, 0.9, { vib: true })]],
    stopChance: 0.15,
  });
  extend('rock|Straight rock|Eighth-note chug, muted', {
    why2: 'Second pass: the chromatic walk-down into a change, and the chug with the octave stabbed on four when staying.',
    fillsOnChange: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), n(8, 12, 2, 0.9, { pm: true }), nx(10, 2, 2, 0.8, { pm: true }), nx(12, 1, 2, 0.8, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), s(8, 1.8, 0.9), s(10, 1.8, 0.55, 'low', 'mute'), d(12, 0, 12, 4, 0.9)]],
  });
  extend('rock|Straight rock|Chords and a riff', {
    why2: 'Second pass: a riff that slides into the 5th.',
    fills: [[s(0, 4, 0.9), n(4, 0, 2, 0.85, { pm: true }), n(6, 3, 2, 0.75, { pm: true }), sl(8, 5, 7, 4, 0.9, { vib: true }), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)]],
  });
  extend('rock|Half-time rock|Pedal and stab', {
    why2: 'Second pass: the pedal opened into a bend when staying; a chromatic pickup on the last beat before a change.',
    fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), n(4, 0, 2, 0.7, { pm: true }), n(6, 0, 2, 0.6, { pm: true }), b(8, 3, 2, 8, 0.95, { vib: true })]],
    pickups: [[nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
  });
  extend("rock|Rock 'n' roll|Straight boogie", {
    why2: 'Second pass: the walk in octaves into a change (the bass does it, the guitar can), the 5–6–♭7–6 boogie when staying, and stop-time — early rock \'n\' roll lives on the band stopping for a lick.',
    fillsOnChange: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 12, 2, 0.9), d(10, 2, 14, 2, 0.75), nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })]],
    fillsOnStay: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 0, 10, 2, 0.9, { pm: true }), d(10, 0, 10, 2, 0.6, { pm: true }), d(12, 0, 9, 2, 0.85, { pm: true }), d(14, 0, 9, 2, 0.6, { pm: true })]],
    stops: [[s(0, 2, 0.95), d(4, 4, 7, 2, 0.9, { up: 1 }), d(6, 4, 7, 2, 0.6), d(8, 4, 7, 2, 0.85), d(10, 3, 7, 2, 0.7), d(12, 0, 4, 2, 0.85), n(14, 0, 2, 0.8)]],
    stopChance: 0.2,
  });
  extend("rock|Rock 'n' roll|Double stops (Berry-inspired)", {
    why2: 'Second pass: the unison bend (the 4th pushed up to the 5th that holds above it), the 4ths lick, and a change fill in double stops that steps down onto the next chord\'s 3rd.',
    fills: [[d(0, 5, 7, 4, 0.9, { up: 2 }), d(4, 5, 7, 2, 0.85, { up: 2 }), d(6, 5, 7, 2, 0.6), d(8, 4, 7, 2, 0.85), d(10, 4, 7, 2, 0.6), d(12, 0, 4, 4, 0.85)],
            [d(0, 7, 12, 2, 0.9), d(2, 7, 12, 1, 0.5), d(3, 5, 10, 1, 0.75), d(4, 4, 9, 2, 0.85), d(6, 4, 9, 2, 0.6), d(8, 2, 7, 2, 0.8), d(10, 0, 5, 2, 0.75), d(12, 0, 4, 4, 0.85)]],
    fillsOnChange: [[d(0, 4, 7, 2, 0.9, { up: 1 }), d(2, 4, 7, 2, 0.6), d(4, 4, 7, 2, 0.85), d(6, 3, 7, 2, 0.7), d(8, 0, 4, 2, 0.85), d(10, 0, 4, 2, 0.6), dn(12, 5, 9, 2, 0.75), dn(14, 4, 7, 2, 0.85)]],
  });
  extend('rock|Bo Diddley beat|The clave strum', {
    why2: 'Second pass: a muted riff on the clave — root and ♭7 where the chord was — and a stay bar with the clave doubled up.',
    fills: [[n(0, 0, 2, 0.9, { pm: true }), g(2, 1, 0.3), g(4, 1, 0.3), n(6, 10, 2, 0.85, { pm: true }), g(8, 1, 0.3), g(10, 1, 0.3), n(12, 0, 2, 0.85, { pm: true }), g(14, 1, 0.3)]],
    fillsOnStay: [[s(0, 2, 0.9), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 1, 0.85), s(7, 1, 0.6, 'high'), g(8, 1, 0.3), g(10, 1, 0.3), s(12, 1, 0.85), s(13, 1, 0.6, 'high'), g(14, 1, 0.3)]],
  });
  extend('rock|Jangle|Ringing arpeggio', {
    why2: 'Second pass: the arpeggios rolled bar to bar, a third pattern that pedals the octave, and a change fill that steps down through the 9th onto the next 3rd.',
    figureMode: 'roll',
    fills: [[n(0, 12, 4, 0.8), n(1, 9, 4, 0.6), n(2, 12, 4, 0.7), n(3, 7, 4, 0.6), n(4, 12, 4, 0.7), n(5, 4, 4, 0.55), n(6, 12, 4, 0.7), n(7, 14, 4, 0.6), n(8, 12, 4, 0.8), n(9, 9, 4, 0.6), n(10, 12, 4, 0.7), n(11, 7, 4, 0.6), n(12, 12, 4, 0.7), n(13, 4, 4, 0.55), n(14, 12, 4, 0.7), n(15, 0, 4, 0.6)]],
    fillsOnChange: [[n(0, 12, 4, 0.8), n(1, 14, 4, 0.6), n(2, 12, 4, 0.7), n(3, 9, 4, 0.6), n(4, 7, 4, 0.7), n(5, 4, 4, 0.55), n(6, 7, 4, 0.6), n(7, 12, 4, 0.6), n(8, 14, 2, 0.7), n(10, 12, 2, 0.65), nx(12, 7, 2, 0.6), nx(14, 4, 2, 0.75)]],
  });
  extend('rock|Southern rock|Hammered double stops', {
    why2: 'Second pass: a major-pentatonic run with the ♭3 hammered (the twin-guitar line, one guitar), tails that hammer the double stop, and a stay bar of the 5th and 6th rocked.',
    fills: [[n(0, 0, 2, 0.9), n(2, 2, 2, 0.75), h(4, 3, 4, 2, 0.85), n(6, 7, 2, 0.8), n(8, 9, 2, 0.8), n(10, 12, 2, 0.85), n(12, 9, 2, 0.75), n(14, 7, 2, 0.8)]],
    tails: [[h(12, 3, 4, 2, 0.8), d(14, 4, 7, 2, 0.75)], [d(12, 4, 7, 2, 0.8), h(14, 2, 4, 2, 0.75)]],
    fillsOnStay: [[d(0, 7, 12, 2, 0.85), d(2, 9, 12, 2, 0.7), d(4, 7, 12, 2, 0.8), d(6, 9, 12, 2, 0.7), s(8, 4, 0.85), h(12, 3, 4, 2, 0.8), d(14, 4, 7, 2, 0.75)]],
  });
  extend('rock|Crazy Horse stomp|Four quarters', {
    why2: 'Second pass: a two-note solo — root and ♭3 bent — as a second fill.',
    fills: [[n(0, 12, 4, 0.95, { vib: true }), b(4, 3, 2, 4, 0.9, { vib: true }), n(8, 12, 4, 0.95, { vib: true }), b(12, 3, 2, 4, 0.9, { vib: true })]],
  });
  extend('rock|Heartland|Sus strum', {
    why2: 'Second pass: the sus2 hammered inside the shape as a second fill, and a change fill that walks the bass note up.',
    fills: [[s(0, 2, 0.85), h(2, 2, 4, 2, 0.7), s(4, 2, 0.55, 'high', 'mute'), p(6, 5, 4, 2, 0.7), s(8, 4, 0.8), s(12, 2, 0.55, 'high', 'mute'), h(14, 2, 4, 2, 0.7)]],
    fillsOnChange: [[s(0, 4, 0.85), s(4, 2, 0.55, 'high', 'mute'), s(6, 2, 0.6, 'high'), s(8, 2, 0.8, 'bass'), s(10, 2, 0.6, 'high'), nx(12, -2, 2, 0.8), nx(14, -1, 2, 0.85)]],
  });

  // =========================================================================
  // ROCKABILLY — twelve to the bar
  extend('rockabilly|Rockabilly|Boom-chick, corrected', {
    why2: 'Second pass: the walk-down into a change (for a root that is above), a stay bar with 6th-chord chops, two tails, and stop-time — the rockabilly break, the band out and the guitar in.',
    fillsOnChange: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.6, 'high', 'mute'), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.6, 'high', 'mute'), nx(6, 5, 1.4, 0.9, { pm: true }), nx(8, 4, 0.8, 0.7, { pm: true }), nx(9, 2, 1.4, 0.85, { pm: true }), nx(11, 1, 0.8, 0.85, { pm: true })]],
    fillsOnStay: [[s(0, 1.4, 0.9, 'bass', 'mute'), s(2, 0.8, 0.65, 'high', null, { add: 9 }), s(3, 1.4, 0.8, 'fifth', 'mute'), s(5, 0.8, 0.65, 'high', null, { add: 9 }), s(6, 1.4, 0.9, 'bass', 'mute'), s(8, 0.8, 0.65, 'high', null, { add: 9 }), s(9, 1.4, 0.8, 'fifth', 'mute'), s(11, 0.8, 0.65, 'high', null, { add: 9 })]],
    tails: [[d(9, 4, 12, 0.8, 0.8), d(10, 2, 11, 0.8, 0.75), d(11, 0, 9, 0.8, 0.8)], [n(9, 3, 0.8, 0.8), n(10, 4, 0.8, 0.8), n(11, 7, 0.8, 0.8)]],
    stops: [[s(0, 1.4, 0.9, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.8, { up: 1 }), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.7), s(6, 1.4, 0.9, 'bass', 'mute'), n(8, 3, 0.8, 0.8), n(9, 4, 0.8, 0.85), n(10, 7, 0.8, 0.8), n(11, 9, 0.8, 0.8)]],
    stopChance: 0.15,
  });
  extend('rockabilly|Rockabilly|Dead thumb and licks (Moore-inspired)', {
    why2: 'Second pass: the double-stop bend lick as a second fill, and a change fill of double stops walking chromatically down.',
    fills: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.8, { up: 1 }), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.6), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 4, 7, 0.8, 0.8, { up: 1 }), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 0, 4, 0.8, 0.7)]],
    fillsOnChange: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.65), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.65), dn(6, 6, 9, 0.8, 0.7), dn(8, 5, 8, 0.8, 0.7), dn(9, 4, 7, 1.6, 0.85), nx(11, 0, 0.8, 0.8)]],
  });
  extend('rockabilly|Rockabilly|Boogie and 6ths (Perkins-inspired)', {
    why2: 'Second pass: 6ths coming down the neck as a second fill, and the boogie with the ♭3 hammered on top when staying.',
    fills: [[d(0, 12, 16, 1.6, 0.85), d(2, 12, 16, 0.8, 0.5), d(3, 10, 14, 1.6, 0.8), d(5, 10, 14, 0.8, 0.5), d(6, 9, 12, 1.6, 0.8), d(8, 7, 11, 0.8, 0.6), d(9, 4, 9, 2.4, 0.85)]],
    fillsOnStay: [[n(0, 0, 1.6, 0.9, { pm: true }), h(2, 3, 4, 0.8, 0.75), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), n(6, 10, 1.6, 0.85, { pm: true }), h(8, 3, 4, 0.8, 0.75), n(9, 7, 1.6, 0.85, { pm: true }), n(11, 4, 0.8, 0.7, { pm: true })]],
  });
  extend('rockabilly|Western swing|Four to the bar, 6ths and 9ths', {
    why2: 'Second pass: the steel bend into the 6th, and a change fill with a chromatic passing chord on the "and of 4".',
    fills: [[s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), d(6, 7, 12, 1.6, 0.85, { up: 2 }), d(8, 7, 12, 0.8, 0.6), d(9, 4, 9, 2.4, 0.85)]],
    fillsOnChange: [[s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), s(6, 1.2, 0.6, 'shell', null, { add: 9 }), s(9, 1.2, 0.8, 'shell', null, { add: 9 }), sn(11, 1, 0.75, 'shell', null, { chordSlide: -1, add: 9 })]],
  });

  // =========================================================================
  // PSYCHOBILLY / SURF — sixteen to the bar
  extend('psychobilly|Psychobilly|Travis at speed (Heath-inspired)', {
    why2: 'Second pass: the surf run down over the thumb, and an octave jump when staying.',
    fills: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 12, 1, 0.85), n(3, 10, 1, 0.75), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 7, 1, 0.8), n(7, 5, 1, 0.75), s(8, 2, 0.9, 'bass', 'mute'), n(10, 3, 1, 0.75), n(11, 0, 1, 0.8), s(12, 2, 0.8, 'fifth', 'mute'), n(14, 12, 2, 0.85, { trem: 4 })]],
    fillsOnStay: [[s(0, 2, 0.9, 'bass', 'mute'), d(2, 0, 12, 2, 0.8), s(4, 2, 0.8, 'fifth', 'mute'), d(6, 0, 12, 2, 0.75), s(8, 2, 0.9, 'bass', 'mute'), d(10, 3, 15, 2, 0.8), s(12, 2, 0.8, 'fifth', 'mute'), d(14, 0, 12, 2, 0.75)]],
  });
  extend('psychobilly|Psychobilly|Two-note riff with space (Ivy-inspired)', {
    why2: 'Second pass: the riff tremolo-picked as a third fill.',
    fills: [[n(0, 0, 3, 0.95, { trem: 6 }), n(3, 3, 3, 0.9, { trem: 6 }), n(8, 10, 4, 0.9, { trem: 8 }), n(12, 0, 4, 0.9, { trem: 8 })]],
  });
  extend('surf|Surf rock|Tremolo melody (Dale-inspired)', {
    why2: 'Second pass: the run down tremolo-picked, and the pulse with a slide up when staying.',
    fills: [[n(0, 12, 2, 0.9, { trem: 4 }), n(2, 11, 2, 0.85, { trem: 4 }), n(4, 7, 2, 0.85, { trem: 4 }), n(6, 5, 2, 0.85, { trem: 4 }), n(8, 4, 2, 0.85, { trem: 4 }), n(10, 3, 2, 0.85, { trem: 4 }), n(12, 0, 4, 0.9, { trem: 8 })]],
    fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), n(4, 0, 2, 0.8, { pm: true }), n(6, 0, 2, 0.7, { pm: true }), sl(8, 5, 7, 4, 0.9, { vib: true }), n(12, 5, 2, 0.8), n(14, 3, 2, 0.8)]],
  });
  extend('surf|Surf rock|Glissando riff (Chantays-inspired)', {
    why2: 'Second pass: the glissando down into the next chord\'s root, and a tail that slides down onto the root.',
    fillsOnChange: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.7, { pm: true }), s(4, 2, 0.85, 'high'), n(6, 3, 2, 0.8), n(8, 5, 2, 0.8), n(10, 7, 2, 0.85), nx(12, 12, 4, 0.95, { tech: 'slide', from: 19 })]],
    tails: [[sl(12, 14, 0, 4, 0.9)], [n(12, 3, 2, 0.85), n(14, 0, 2, 0.85)]],
  });
  extend('surf|Instrumental rock|Twang melody', {
    why2: 'Second pass: a second melody and a stay bar that repeats the root with vibrato.',
    fills: [[n(0, 0, 2, 0.9), n(2, 3, 2, 0.85), n(4, 5, 4, 0.9, { vib: true }), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8), n(12, 10, 4, 0.85, { vib: true })]],
    fillsOnStay: [[n(0, 0, 6, 0.9, { vib: true }), n(6, 0, 2, 0.6, { pm: true }), n(8, 0, 6, 0.9, { vib: true }), n(14, 7, 2, 0.75)]],
  });

  // =========================================================================
  // COUNTRY — sixteen to the bar (waltz: twelve, in three)
  extend('country|Country|Boom-chicka (Perkins-inspired)', {
    why2: 'Second pass: the walk-down into a change (into the V from the I, G–F♯–E–D), the high G-run when staying, a pickup on the last beat, the chicka-only tail, and the G-run as the turnaround.',
    fillsOnChange: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), s(4, 2, 0.8, 'fifth', 'mute'), s(6, 1, 0.5, 'high', 'mute'), nx(8, 5, 2, 0.9, { pm: true }), nx(10, 4, 2, 0.75, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 2, 0.9, 'bass', 'mute'), s(2, 1, 0.5, 'high', 'mute'), n(4, 12, 2, 0.85), n(6, 14, 2, 0.8), h(8, 15, 16, 2, 0.85), n(10, 19, 2, 0.8), n(12, 21, 2, 0.8), n(14, 24, 2, 0.85)]],
    pickups: [[nx(12, -2, 2, 0.8, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
    tails: [[s(8, 2, 0.9, 'bass', 'mute'), s(10, 1, 0.5, 'high', 'mute'), s(11, 1, 0.4, 'high', 'mute'), s(12, 2, 0.8, 'fifth', 'mute'), s(14, 1, 0.5, 'high', 'mute'), s(15, 1, 0.4, 'high', 'mute')]],
    turnarounds: [[n(0, 0, 2, 0.9), n(2, 2, 2, 0.8), h(4, 3, 4, 4, 0.9), n(8, 7, 2, 0.85), n(10, 9, 2, 0.85), n(12, 12, 2, 0.9), nx(14, 0, 2, 0.9)]],
  });
  extend("country|Country|Chicken pickin' (Rich-inspired)", {
    why2: 'Second pass: the pedal-steel double-stop bends coming down, and popped 6ths when staying.',
    fills: [[d(0, 9, 12, 4, 0.9, { up: 2 }), d(4, 4, 7, 4, 0.85, { up: 2 }), d(8, 0, 4, 4, 0.85), n(12, 0, 1, 0.85, { stacc: true }), n(13, 0, 1, 0.3, { ghost: true }), n(14, 12, 2, 0.85, { stacc: true })]],
    fillsOnStay: [[d(0, 4, 12, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), d(2, 4, 12, 1, 0.85, { stacc: true }), n(3, 4, 1, 0.3, { ghost: true }), d(4, 2, 11, 2, 0.85, { stacc: true }), d(6, 0, 9, 2, 0.85, { stacc: true }), d(8, 4, 12, 4, 0.9), n(12, 0, 4, 0.85)]],
  });
  extend('country|Country|Travis picking (Travis/Atkins-inspired)', {
    why2: 'Second pass: the melody in the top voice (5, 6, 5, 3) over the thumb, and a change fill that walks the thumb up.',
    fills: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 7, 2, 0.7), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 9, 2, 0.7), s(8, 2, 0.85, 'bass', 'mute'), n(10, 7, 2, 0.7), s(12, 2, 0.75, 'fifth', 'mute'), n(14, 4, 2, 0.7)]],
    fillsOnChange: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 4, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(6, 7, 2, 0.6), nx(8, 5, 2, 0.85, { pm: true }), nx(10, 4, 2, 0.7, { pm: true }), nx(12, 2, 2, 0.8, { pm: true }), nx(14, 0, 2, 0.85, { pm: true })]],
  });
  extend('country|Bakersfield|Steel bends and double stops', {
    why2: 'Second pass: a run of 6ths down the neck, and popped 6ths when staying.',
    fills: [[d(0, 12, 16, 2, 0.9), d(2, 12, 16, 2, 0.5), d(4, 9, 14, 2, 0.85), d(6, 7, 11, 2, 0.8), d(8, 4, 9, 2, 0.85), d(10, 4, 9, 2, 0.5), d(12, 0, 4, 4, 0.85)]],
    fillsOnStay: [[d(0, 4, 12, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), d(2, 2, 11, 1, 0.85, { stacc: true }), n(3, 2, 1, 0.3, { ghost: true }), d(4, 0, 9, 4, 0.85), d(8, 2, 7, 4, 0.9, { up: 2 }), d(12, 4, 7, 4, 0.85)]],
  });
  extend('country|Outlaw|Chicka', {
    why2: 'Second pass: the chicka with the ♭3 hammered on top when staying, and a chromatic pickup on the last beat.',
    fillsOnStay: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), h(4, 3, 4, 2, 0.85), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), s(8, 1, 0.9, 'bass', 'mute'), s(10, 1, 0.55, 'low', 'mute'), s(11, 1, 0.45, 'low', 'mute'), h(12, 3, 4, 2, 0.85), s(14, 1, 0.55, 'low', 'mute'), s(15, 1, 0.45, 'low', 'mute')]],
    pickups: [[nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.85, { pm: true })]],
  });
  extend('country|Country rock|Bass-note strum', {
    why2: 'Second pass: the chord picked instead of strummed as a second fill, and the walk-down into a change.',
    fills: [[n(0, 0, 2, 0.85), n(2, 7, 2, 0.65), n(4, 12, 2, 0.7), n(6, 7, 2, 0.6), n(8, 4, 2, 0.75), n(10, 7, 2, 0.65), n(12, 12, 2, 0.7), n(14, 9, 2, 0.65)]],
    fillsOnChange: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), s(4, 2, 0.6, 'high'), s(6, 2, 0.55, 'high'), nx(8, 5, 2, 0.9), nx(10, 4, 2, 0.7), nx(12, 2, 2, 0.8), nx(14, 0, 2, 0.85)]],
  });
  extend('country|Hot country|Banjo rolls', {
    why2: 'Second pass: the open-string cascade — pull-offs down to the root — and a roll that stays on the top strings.',
    fills: [[n(0, 12, 1, 0.9), p(1, 9, 7, 2, 0.8), p(3, 5, 4, 2, 0.8), p(5, 2, 0, 2, 0.8), n(7, 7, 1, 0.7), n(8, 12, 1, 0.85), p(9, 9, 7, 2, 0.8), p(11, 4, 2, 2, 0.8), n(13, 0, 3, 0.85)]],
    fillsOnStay: [[n(0, 7, 1, 0.85), n(1, 12, 1, 0.6), n(2, 16, 1, 0.7), n(3, 7, 1, 0.8), n(4, 12, 1, 0.6), n(5, 16, 1, 0.7), n(6, 9, 1, 0.8), n(7, 16, 1, 0.65), n(8, 9, 1, 0.85), n(9, 12, 1, 0.6), n(10, 16, 1, 0.7), n(11, 9, 1, 0.8), n(12, 7, 1, 0.6), n(13, 12, 1, 0.7), n(14, 4, 1, 0.8), n(15, 0, 1, 0.75)]],
  });
  extend('country|Country waltz|Bass, chord, chord', {
    why2: 'Second pass: a walk-down in three, and a change fill that walks up the bass through beats 2 and 3.',
    fills: [[n(0, 12, 4, 0.85), n(4, 9, 4, 0.8), n(8, 7, 2, 0.8), n(10, 4, 2, 0.75)]],
    fillsOnChange: [[s(0, 4, 0.9, 'bass'), nx(4, -4, 2, 0.8), nx(6, -3, 2, 0.75), nx(8, -2, 2, 0.8), nx(10, -1, 2, 0.85)]],
  });

  // =========================================================================
  // BLUEGRASS — sixteen to the bar
  extend('bluegrass|Bluegrass|Boom-chuck with bass runs', {
    why2: 'Second pass: the walk-down into a change, a syncopated run when staying, the G-run tail (the run tagged on the end of a figure bar is exactly what a bluegrass rhythm player does), and a second turnaround at the octave.',
    fillsOnChange: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), nx(8, 5, 2, 0.9, { pm: true }), nx(10, 4, 2, 0.8, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 3, 0.95, 'bass'), s(4, 1.5, 0.7, 'high', 'mute'), n(7, 7, 1, 0.8), n(8, 9, 2, 0.85), n(11, 12, 1, 0.8), n(12, 9, 2, 0.85), n(14, 7, 2, 0.8)]],
    tails: [[n(8, 0, 2, 0.85), n(10, 2, 2, 0.8), h(12, 3, 4, 2, 0.9), n(14, 7, 2, 0.85)], [n(10, 2, 2, 0.8), h(12, 3, 4, 2, 0.9), n(14, 0, 2, 0.85)]],
    tailChance: 0.6,
    turnarounds: [[n(0, 12, 2, 0.9), n(2, 14, 2, 0.8), h(4, 15, 16, 4, 0.9), n(8, 19, 2, 0.85), n(10, 21, 2, 0.85), n(12, 24, 2, 0.9), nx(14, 12, 2, 0.9)]],
  });
  extend('bluegrass|Bluegrass|Crosspicking (Watson/White-inspired)', {
    why2: 'Second pass: a crosspicked run that comes down the chord.',
    fills: [[n(0, 12, 1, 0.85), n(1, 7, 1, 0.6), n(2, 4, 1, 0.7), n(3, 12, 1, 0.8), n(4, 7, 1, 0.6), n(5, 4, 1, 0.7), n(6, 9, 1, 0.8), n(7, 4, 1, 0.65), n(8, 7, 1, 0.85), n(9, 4, 1, 0.6), n(10, 0, 1, 0.7), n(11, 7, 1, 0.8), n(12, 4, 1, 0.6), n(13, 0, 1, 0.7), n(14, 2, 1, 0.8), n(15, 0, 1, 0.75)]],
  });
  extend('bluegrass|Bluegrass|Chop rhythm (Rice-inspired)', {
    why2: 'Second pass: a syncopated run under the chop.',
    fills: [[s(0, 2, 0.95, 'bass'), n(3, 4, 1, 0.8), s(4, 0.8, 0.85, 'high', 'mute'), n(6, 7, 1, 0.8), n(7, 9, 1, 0.8), s(8, 2, 0.85, 'fifth'), n(11, 12, 1, 0.85), s(12, 0.8, 0.85, 'high', 'mute'), n(14, 9, 1, 0.8), n(15, 7, 1, 0.8)]],
  });

  // =========================================================================
  // JAZZ
  extend('jazz|Swing|Octaves (Montgomery-inspired)', {
    why2: 'Second pass: a bluesier octave line and an octave enclosure into the change.',
    fills: [[d(0, 3, 15, 1.6, 0.85), d(2, 4, 16, 0.8, 0.7), d(3, 7, 19, 1.6, 0.8), d(6, 10, 22, 1.6, 0.85), d(8, 9, 21, 0.8, 0.6), d(9, 7, 19, 2.4, 0.85, { vib: true })]],
    fillsOnChange: [[d(0, 4, 16, 1.6, 0.8), d(2, 5, 17, 0.8, 0.6), d(3, 7, 19, 1.6, 0.8), d(5, 9, 21, 0.8, 0.6), d(6, 10, 22, 1.6, 0.8), dn(8, 1, 13, 0.8, 0.65), dn(9, -1, 11, 1.6, 0.7), dn(11, 0, 12, 0.8, 0.85)]],
  });
  extend('jazz|Swing|Charleston, anticipated', {
    why2: 'Second pass: a stay bar with a chromatic passing chord between the ands, and a line with a triplet turn.',
    fillsOnStay: [[s(5, 3, 0.75, 'high'), s(8, 0.6, 0.4, 'high', null, { chordSlide: -1 }), s(11, 2, 0.7, 'high')]],
    fills: [[n(0, 4, 1.6, 0.85), n(2, 7, 0.8, 0.65), n(3, 9, 0.8, 0.75), n(4, 10, 0.8, 0.75), n(5, 9, 0.8, 0.7), n(6, 7, 1.6, 0.8), n(8, 4, 0.8, 0.65), n(9, 2, 2.4, 0.8, { vib: true })]],
  });
  extend('jazz|Bossa nova|The batida, two bars', {
    why2: 'Second pass: a fill with the thumb walking under the chords, and a change fill where the 9th on top steps down to the next chord\'s 3rd.',
    fills: [[s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), n(4, 4, 2, 0.7, { pm: true }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'fifth'), n(12, 7, 2, 0.7, { pm: true }), s(14, 2, 0.5, 'high', null, { add: 14 })]],
    fillsOnChange: [[s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 4, 0.8, 'bass'), n(10, 14, 2, 0.65), n(12, 12, 2, 0.6), nx(14, 4, 2, 0.7)]],
  });
  extend('jazz|Gypsy jazz|Pompe and diminished runs', {
    why2: 'Second pass: an enclosure line into the change, and the 6th arpeggio when staying.',
    fillsOnChange: [[s(0, 1.2, 0.55), s(3, 1, 0.8), n(6, 9, 0.8, 0.8), n(7, 7, 0.8, 0.8), n(8, 4, 0.8, 0.8), nx(9, 2, 0.8, 0.7), nx(10, -1, 0.8, 0.7), nx(11, 0, 0.8, 0.85)]],
    fillsOnStay: [[n(0, 0, 0.8, 0.85), n(1, 4, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 9, 0.8, 0.85), n(4, 12, 0.8, 0.8), n(5, 9, 0.8, 0.75), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)]],
  });
  extend('jazz|Jazz waltz|Comp in three', {
    why2: 'Second pass: a second line in three and an enclosure into the change.',
    fills: [[n(0, 7, 0.8, 0.85), n(2, 9, 0.8, 0.7), n(3, 10, 1.6, 0.8), n(5, 12, 0.8, 0.7), n(6, 10, 0.8, 0.8), n(8, 9, 0.8, 0.7)]],
    fillsOnChange: [[s(0, 1.5, 0.7, 'shell'), n(3, 4, 0.8, 0.8), n(5, 5, 0.8, 0.6), nx(6, 1, 0.8, 0.65), nx(8, -1, 0.8, 0.7)]],
  });
  extend('jazz|Bebop|Bebop line', {
    why2: 'Second pass: two more lines — the 1-2-3-5 pattern, and the descending bebop scale — and a change fill enclosing the next root from below then above. A bebop player has a book of these.',
    fills: [[n(0, 0, 0.8, 0.85), n(2, 2, 0.8, 0.7), n(3, 4, 0.8, 0.8), n(5, 7, 0.8, 0.7), n(6, 2, 0.8, 0.8), n(8, 4, 0.8, 0.7), n(9, 5, 0.8, 0.8), n(11, 9, 0.8, 0.7)],
            [n(0, 12, 0.8, 0.85), n(2, 10, 0.8, 0.7), n(3, 9, 0.8, 0.8), n(5, 7, 0.8, 0.7), n(6, 5, 0.8, 0.8), n(8, 4, 0.8, 0.7), n(9, 2, 0.8, 0.8), n(11, 1, 0.8, 0.7)]],
    fillsOnChange: [[n(0, 4, 0.8, 0.85), n(2, 7, 0.8, 0.7), n(3, 10, 0.8, 0.8), n(5, 12, 0.8, 0.7), nx(6, -1, 0.8, 0.75), nx(8, 1, 0.8, 0.7), nx(9, 0, 1.6, 0.85), nx(11, 4, 0.8, 0.7)]],
  });
  extend('jazz|Jazz ballad|Chord-melody', {
    why2: 'Second pass: a second melody, up from the 5th.',
    fills: [[n(0, 7, 3, 0.75, { vib: true }), n(3, 9, 1.5, 0.65), n(4.5, 11, 1.5, 0.65), n(6, 12, 3, 0.75, { vib: true }), n(9, 14, 1.5, 0.6), n(10.5, 12, 1.5, 0.65)]],
  });
  extend('jazz|Samba|Partido alto', {
    why2: 'Second pass: a melody in 3rds over the thumb, and a change fill that steps to the next 3rd.',
    fills: [[s(0, 3, 0.8, 'bass'), d(3, 4, 7, 2, 0.65), d(6, 7, 11, 2, 0.65), s(8, 3, 0.75, 'bass'), d(11, 9, 12, 2, 0.65), d(14, 7, 11, 2, 0.65)]],
    fillsOnChange: [[s(0, 3, 0.8, 'bass'), s(3, 2, 0.55, 'high', null, { add: 14 }), s(6, 2, 0.55, 'high', null, { add: 14 }), s(8, 3, 0.75, 'bass'), n(11, 11, 1, 0.6), n(12, 9, 1, 0.6), nx(14, 4, 2, 0.7)]],
  });
  extend('jazz|Son montuno|Montuno', {
    why2: 'Second pass: a single-line montuno as a second fill.',
    fills: [[n(2, 0, 1, 0.8), n(3, 4, 1, 0.7), n(5, 7, 1, 0.75), n(6, 12, 2, 0.8), n(10, 9, 1, 0.75), n(11, 7, 1, 0.7), n(13, 4, 1, 0.7), n(14, 0, 2, 0.75)]],
  });
  extend('jazz|Soul jazz|Boogaloo comp and line', {
    why2: 'Second pass: the ♭3-to-3 blues line in bebop rhythm, and a stay bar of stabs with a slide.',
    fills: [[n(0, 0, 1, 0.85), n(1, 3, 1, 0.7), h(2, 3, 4, 2, 0.85), n(4, 7, 2, 0.8), n(6, 9, 1, 0.75), n(7, 10, 1, 0.8), n(8, 12, 4, 0.85, { vib: true }), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 10, 2, 0.7)]],
    fillsOnStay: [[s(2, 2, 0.7, 'high', null, { add: 14, chordSlide: 1 }), s(6, 2, 0.7, 'high', null, { add: 14 }), s(10, 2, 0.6, 'high', null, { add: 14 }), s(12, 2, 0.7, 'high', null, { add: 14, chordSlide: 1 })]],
  });

  // =========================================================================
  // 6/8 BALLAD, REGGAE, SKA
  extend('ballad|6/8 ballad|6ths and triplets (soul ballad)', {
    why2: 'Second pass: the triplet arpeggio climbing, and a change fill in 6ths stepping onto the next chord.',
    fills: [[n(0, 0, 1, 0.8), n(1, 4, 1, 0.65), n(2, 7, 1, 0.7), n(3, 12, 1, 0.75), n(4, 7, 1, 0.65), n(5, 4, 1, 0.65), n(6, 0, 1, 0.8), n(7, 4, 1, 0.65), n(8, 7, 1, 0.7), n(9, 12, 3, 0.8, { vib: true })]],
    fillsOnChange: [[d(0, 4, 12, 3, 0.8), d(3, 2, 11, 3, 0.7), d(6, 0, 9, 3, 0.75), dn(9, 5, 14, 1.5, 0.65), dn(10.5, 4, 12, 1.5, 0.8)]],
  });
  extend('reggae|Reggae|Skank, tight', {
    why2: 'Second pass: the double skank with a slide up when staying, a pickup that follows the bass into a change, and the figures rolled — a skank player varies the single and double stroke bar to bar.',
    figureMode: 'roll',
    fillsOnStay: [[s(2, 1, 0.8, 'high', 'mute'), s(3, 1, 0.5, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), sl(8, -2, 0, 2, 0.8), s(10, 1, 0.8, 'high', 'mute'), s(11, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute')]],
    pickups: [[nx(12, 7, 2, 0.75), nx(14, -1, 2, 0.75)]],
  });
  extend('reggae|Steppers|Skank over steppers', {
    why2: 'Second pass: a low line answering the bass for the whole bar.',
    fills: [[n(0, 0, 2, 0.8), s(2, 1, 0.8, 'high', 'mute'), n(4, 10, 2, 0.75), s(6, 1, 0.8, 'high', 'mute'), n(8, 7, 2, 0.75), s(10, 1, 0.8, 'high', 'mute'), n(12, 3, 2, 0.7), s(14, 1, 0.8, 'high', 'mute')]],
  });
  extend('reggae|Rocksteady|3rds on the offbeat', {
    why2: 'Second pass: the 3rds moving with the melody, up and down.',
    fills: [[d(2, 4, 7, 1.5, 0.75), d(6, 5, 9, 1.5, 0.75), d(10, 7, 11, 1.5, 0.75), d(14, 5, 9, 1.5, 0.7)]],
  });
  extend('ska|Ska|Chunk and upstroke', {
    why2: 'Second pass: a stay bar that leaves a beat out (the ska "stop"), and a change fill where the chords walk up chromatically.',
    fillsOnStay: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), s(13, 1, 0.5, 'high', 'mute'), s(14, 1, 0.8, 'high', 'mute'), s(15, 1, 0.5, 'high', 'mute')]],
    fillsOnChange: [[g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), g(4, 1, 0.3, 'low'), s(6, 1, 0.8, 'high', 'mute'), g(8, 1, 0.3, 'low'), s(10, 1, 0.8, 'high', 'mute'), sn(12, 1, 0.7, 'high', 'mute', { chordSlide: -2 }), sn(14, 1, 0.8, 'high', 'mute', { chordSlide: -1 })]],
  });
  extend('ska|Ska (Jamaican)|Swung upstrokes', {
    why2: 'Second pass: a second horn-riff fill, on the 3rd and 5th.',
    fills: [[s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), n(6, 4, 1.6, 0.8), n(8, 7, 0.8, 0.7), n(9, 4, 1.6, 0.85), n(11, 0, 0.8, 0.7)]],
  });

  // =========================================================================
  // SOUL, POP
  extend('soul|Soul|6ths and muted backbeat', {
    why2: 'Second pass: 3rds slid into as a second fill, and the 6ths walking down chromatically into the next chord — the Cropper move that ends a phrase.',
    fills: [[sl(0, 2, 4, 2, 0.8), d(2, 4, 7, 2, 0.7), s(4, 1, 0.55, 'high', 'mute'), sl(8, 5, 7, 2, 0.8), d(10, 7, 11, 2, 0.7), s(12, 1, 0.55, 'high', 'mute'), n(14, 0, 2, 0.6)]],
    fillsOnChange: [[d(0, 4, 12, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), dn(8, 6, 14, 2, 0.7), dn(10, 5, 13, 2, 0.7), dn(12, 4, 12, 4, 0.8)]],
  });
  extend('soul|Motown|Chank and octaves', {
    why2: 'Second pass: the octave riff (root, ♭7, root) in eighths, and a stay bar with the chank doubled.',
    fills: [[d(0, 0, 12, 2, 0.75), d(2, 0, 12, 1, 0.5), d(3, 10, 22, 1, 0.7), s(4, 1.5, 0.75, 'high'), d(8, 0, 12, 2, 0.75), d(10, 7, 19, 2, 0.7), s(12, 1.5, 0.75, 'high'), d(14, 0, 12, 2, 0.7)]],
    fillsOnStay: [[s(4, 1, 0.75, 'high'), s(5, 1, 0.5, 'high'), s(12, 1, 0.75, 'high'), s(13, 1, 0.5, 'high'), s(14, 1, 0.6, 'high')]],
  });
  extend('soul|Sweet soul|Rolling hammer-ons', {
    why2: 'Second pass: a 6ths line over the minor chord.',
    fills: [[d(0, 3, 12, 4, 0.75), d(4, 2, 10, 2, 0.65), d(6, 0, 9, 2, 0.65), h(8, 5, 7, 2, 0.75), n(10, 12, 2, 0.6), d(12, 3, 12, 4, 0.75)]],
  });
  extend('soul|Neo-soul|Swung arpeggios', {
    why2: 'Second pass: a second arpeggio through the 11th, and a stay bar that holds the chord and adds one note.',
    fills: [[n(0, 0, 2, 0.7), n(2, 3, 2, 0.55), n(4, 7, 2, 0.6), n(6, 10, 2, 0.55), n(8, 17, 4, 0.65), n(12, 14, 2, 0.6), n(14, 12, 2, 0.6)]],
    fillsOnStay: [[s(0, 8, 0.55, 'shell', null, { add: 14 }), n(10, 10, 2, 0.55), n(12, 12, 4, 0.65, { vib: true })]],
  });
  extend('pop|Pop|Strum with chucks', {
    why2: 'Second pass: the pattern with a hammer-on inside the shape when staying, and a bass-note walk into a change.',
    fillsOnStay: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), h(6, 4, 5, 2, 0.7), s(8, 2, 0.8), g(10, 1, 0.25), s(12, 1, 0.7, 'full', 'mute'), p(14, 5, 4, 2, 0.7)]],
    fillsOnChange: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.7, 'full', 'mute'), s(6, 2, 0.55, 'high'), s(8, 2, 0.8, 'bass'), s(10, 2, 0.55, 'high'), nx(12, 2, 2, 0.75), nx(14, 0, 2, 0.8)]],
  });
  extend('pop|Pop|The hook', {
    why2: 'Second pass: a second hook figure.',
    fills: [[n(0, 12, 2, 0.8), n(2, 12, 2, 0.6), n(4, 9, 4, 0.8), n(8, 7, 2, 0.7), n(10, 9, 2, 0.75), n(12, 12, 4, 0.8)]],
  });
  extend('pop|80s pop|Add9 arpeggio', {
    why2: 'Second pass: the arpeggio through the 6th, and a change fill that lands on the next root through the 9th.',
    fills: [[n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 9, 2, 0.7), n(6, 12, 2, 0.65), n(8, 14, 2, 0.7), n(10, 12, 2, 0.65), n(12, 9, 2, 0.7), n(14, 7, 2, 0.65)]],
    fillsOnChange: [[n(0, 0, 2, 0.8), n(2, 7, 2, 0.65), n(4, 14, 2, 0.7), n(6, 12, 2, 0.65), n(8, 7, 2, 0.7), n(10, 14, 2, 0.65), nx(12, 2, 2, 0.65), nx(14, 0, 2, 0.8)]],
  });
  extend('pop|Acoustic pop|Percussive strum', {
    why2: 'Second pass: the figures rolled, and a slap pattern with a bass run into the change.',
    figureMode: 'roll',
    fillsOnChange: [[s(0, 4, 0.85), s(4, 1, 0.75, 'full', 'mute'), s(6, 2, 0.6, 'high'), g(8, 1, 0.3), nx(10, -4, 2, 0.7, { pm: true }), nx(12, -2, 2, 0.75, { pm: true }), nx(14, -1, 2, 0.8, { pm: true })]],
  });

  // =========================================================================
  // FUNK — the accent patterns are the vocabulary
  const scratchFill = (hits, voicing = 'high', vel = 0.8) =>
    Array.from({ length: 16 }, (_, k) => hits.includes(k) ? s(k, 1, vel, voicing, null, { add: 14 }) : g(k, 1, 0.25, voicing));
  extend('funk|Classic funk|Chicken scratch', {
    why2: 'Second pass: two more accent patterns when staying (a scratch player has a dozen), the figures rolled, and a change fill where the chord slides down into the next.',
    figureMode: 'roll',
    fillsOnStay: [scratchFill([0, 3, 6, 9, 12]), scratchFill([0, 5, 10, 15])],
    fillsOnChange: [[...scratchFill([0, 7]).slice(0, 14), sn(14, 2, 0.85, 'high', null, { add: 14, chordSlide: -1 })]],
  });
  extend('funk|Classic funk|Unison riff (Nocentelli-inspired)', {
    why2: 'Second pass: the riff turned round (♭7 first), and a change fill that lands the riff on the next root.',
    fills: [[n(0, 10, 1, 0.9, { pm: true }), n(2, 12, 1, 0.55, { pm: true }), n(3, 0, 1, 0.75, { pm: true }), n(6, 3, 1, 0.75, { pm: true }), n(8, 5, 1, 0.85, { pm: true }), n(10, 3, 1, 0.7, { pm: true }), n(11, 0, 1, 0.75, { pm: true }), n(14, 10, 2, 0.8, { pm: true })]],
    fillsOnChange: [[n(0, 0, 1, 0.9, { pm: true }), n(2, 0, 1, 0.55, { pm: true }), n(3, 10, 1, 0.75, { pm: true }), n(6, 12, 1, 0.75, { pm: true }), n(8, 0, 1, 0.85, { pm: true }), n(11, 3, 1, 0.7, { pm: true }), nx(12, -2, 1, 0.75, { pm: true }), nx(14, 0, 2, 0.85, { pm: true })]],
  });
  extend('funk|Disco|The chuck', {
    why2: 'Second pass: two more accent patterns and the figures rolled — the chuck is one motor with many accents.',
    figureMode: 'roll',
    fillsOnStay: [Array.from({ length: 16 }, (_, k) => [2, 6, 9, 10, 14].includes(k) ? s(k, 1, 0.8, 'high') : g(k, 1, 0.25, 'high')),
                  Array.from({ length: 16 }, (_, k) => [1, 2, 6, 10, 13, 14].includes(k) ? s(k, 1, 0.8, 'high') : g(k, 1, 0.25, 'high'))],
  });
  extend('funk|New Orleans funk|Riff in unison with the bass', {
    why2: 'Second pass: a second riff and a stay bar with the 9th chop answering.',
    fills: [[n(0, 0, 1, 0.9, { pm: true }), n(1, 0, 1, 0.5, { pm: true }), n(3, 3, 1, 0.75, { pm: true }), n(4, 5, 2, 0.8, { pm: true }), n(7, 7, 1, 0.75, { pm: true }), n(8, 10, 2, 0.8, { pm: true }), n(11, 7, 1, 0.7, { pm: true }), n(12, 5, 1, 0.75, { pm: true }), n(14, 0, 2, 0.8, { pm: true })]],
    fillsOnStay: [[n(0, 0, 2, 0.9, { pm: true }), s(2, 1, 0.65, 'high', null, { add: 14 }), s(3, 1, 0.4, 'high', null, { add: 14 }), n(6, 12, 2, 0.75, { pm: true }), n(8, 0, 2, 0.85, { pm: true }), s(10, 1, 0.65, 'high', null, { add: 14 }), s(11, 1, 0.4, 'high', null, { add: 14 }), n(14, 0, 2, 0.8, { pm: true })]],
  });
  extend('funk|Minneapolis|Triad stabs', {
    why2: 'Second pass: a second accent pattern when staying.',
    fillsOnStay: [Array.from({ length: 16 }, (_, k) => [0, 2, 7, 10, 13].includes(k) ? s(k, 1, 0.85, 'high') : g(k, 1, 0.25, 'high'))],
  });
  extend('funk|Steady motor|Rhythm within the rhythm', {
    why2: 'Second pass: three more accent patterns when staying — this part is nothing but accent patterns, and Wong plays a different one every bar — and the figures rolled.',
    figureMode: 'roll',
    fillsOnStay: [Array.from({ length: 16 }, (_, k) => [0, 3, 6, 10, 12].includes(k) ? s(k, 1, 0.8, 'high') : g(k, 1, 0.25, 'high')),
                  Array.from({ length: 16 }, (_, k) => [1, 4, 7, 10, 13].includes(k) ? s(k, 1, 0.8, 'high') : g(k, 1, 0.25, 'high')),
                  Array.from({ length: 16 }, (_, k) => [0, 2, 3, 8, 10, 11].includes(k) ? s(k, 1, 0.8, 'high') : g(k, 1, 0.25, 'high'))],
  });

  // =========================================================================
  // METAL
  extend('metal|Metal|Pedal riff (♭2 and ♭5)', {
    why2: 'Second pass: a second riff on the ♭2 alone, and the gallop as a stay bar.',
    fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 1, 0.55, { pm: true }), n(3, 1, 1, 0.85, { pm: true }), n(4, 0, 2, 0.85, { pm: true }), n(6, 1, 2, 0.85, { pm: true }), n(8, 0, 2, 0.9, { pm: true }), n(10, 0, 1, 0.55, { pm: true }), n(11, 3, 1, 0.85, { pm: true }), n(12, 1, 2, 0.85, { pm: true }), n(14, 0, 2, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 2, 0.9, 'low', 'mute'), s(2, 1, 0.6, 'low', 'mute'), s(3, 1, 0.6, 'low', 'mute'), s(4, 2, 0.8, 'low', 'mute'), s(6, 1, 0.6, 'low', 'mute'), s(7, 1, 0.6, 'low', 'mute'), s(8, 2, 0.9, 'low', 'mute'), s(10, 1, 0.6, 'low', 'mute'), s(11, 1, 0.6, 'low', 'mute'), s(12, 4, 0.95, 'low')]],
  });
  extend('metal|Doom|Tritone riff (Iommi-inspired)', {
    why2: 'Second pass: the bend riff — the ♭3 pushed up, the ♭5 shaken — as a second fill.',
    fills: [[b(0, 3, 2, 6, 0.95, { vib: true }), n(6, 0, 2, 0.85, { pm: true }), n(8, 6, 6, 0.95, { vib: true }), n(14, 7, 2, 0.85)]],
  });
  extend('metal|Thrash|Downpicked eighths', {
    why2: 'Second pass: the chromatic riff coming down, and the gallop when staying.',
    fills: [[n(0, 7, 2, 0.95, { pm: true }), n(2, 6, 2, 0.85, { pm: true }), n(4, 5, 2, 0.85, { pm: true }), n(6, 1, 2, 0.9, { pm: true }), n(8, 0, 2, 0.95, { pm: true }), n(10, 1, 2, 0.85, { pm: true }), n(12, 0, 2, 0.9, { pm: true }), n(14, 6, 2, 0.9, { pm: true })]],
    fillsOnStay: [[s(0, 2, 0.95, 'bass', 'mute'), s(2, 1, 0.7, 'bass', 'mute'), s(3, 1, 0.7, 'bass', 'mute'), s(4, 2, 0.85, 'bass', 'mute'), s(6, 1, 0.7, 'bass', 'mute'), s(7, 1, 0.7, 'bass', 'mute'), s(8, 2, 0.95, 'bass', 'mute'), s(10, 1, 0.7, 'bass', 'mute'), s(11, 1, 0.7, 'bass', 'mute'), s(12, 2, 0.85, 'bass', 'mute'), s(14, 1, 0.7, 'bass', 'mute'), s(15, 1, 0.7, 'bass', 'mute')]],
  });
  extend('metal|Breakdown|Chords on the kick', {
    why2: 'Second pass: the chord slid up into the ♭2 and back, and a stay bar with the chord held.',
    fills: [[s(0, 2, 0.95, 'low'), s(3, 2, 0.9, 'low', null, { chordSlide: -1 }), s(6, 2, 0.9, 'low'), s(10, 4, 0.95, 'low', null, { chordSlide: 1 }), n(14, 0, 2, 0.85, { pm: true })]],
    fillsOnStay: [[s(0, 8, 0.95, 'low'), s(8, 2, 0.9, 'low'), s(10, 6, 0.95, 'low')]],
  });

  // =========================================================================
  extend('simple|Simple|Arpeggio study', {
    why2: 'Second pass: the arpeggio in sixteenths as a second fill.',
    fills: [[n(0, 0, 1, 0.8), n(1, 4, 1, 0.7), n(2, 7, 1, 0.75), n(3, 12, 1, 0.8), n(4, 7, 1, 0.7), n(5, 4, 1, 0.7), n(6, 0, 1, 0.75), n(7, 4, 1, 0.7), n(8, 7, 1, 0.75), n(9, 12, 1, 0.8), n(10, 14, 1, 0.75), n(11, 12, 1, 0.75), n(12, 7, 2, 0.75), n(14, 4, 2, 0.75)]],
  });

  // =========================================================================
  // THIRD PASS — the line parts. A bar before a change is where a player's
  // vocabulary is widest; every part that carries a line gets a second way
  // in. The groove parts (punk, Afrobeat, the clave, the pompe, Green's four
  // to the bar) are left alone on purpose: repetition is their idiom.
  extend('blues|Texas shuffle|Texas triplets', {
    why2: 'Third pass: a second way into the change — the groups climbing to the next chord\'s 5th.',
    fillsOnChange: [[n(0, 0, 0.8, 0.85), n(1, 3, 0.8, 0.75), n(2, 5, 0.8, 0.8), n(3, 3, 0.8, 0.85), n(4, 5, 0.8, 0.75), n(5, 7, 0.8, 0.8), n(6, 5, 0.8, 0.85), n(7, 7, 0.8, 0.75), n(8, 10, 0.8, 0.8), nx(9, 5, 0.8, 0.75), nx(10, 7, 1.6, 0.85, { vib: true })]],
  });
  extend('blues|Slow blues|The call (King-inspired)', {
    why2: 'And a second call into the change — the ♭7 shaken, then down onto the next 3rd — and a second when staying, the root called and answered by the ♭3.',
    fillsOnChange: [[n(3, 10, 3, 0.9, { vib: true }), n(6, 7, 1, 0.7), n(7, 5, 1, 0.65), n(8, 7, 1, 0.7), nx(9, 5, 1.5, 0.65), nx(10.5, 4, 1.5, 0.85, { vib: true })]],
    fillsOnStay: [[n(0, 12, 3, 0.85, { vib: true }), n(6, 3, 1, 0.7), n(7, 0, 5, 0.85, { vib: true })]],
  });
  extend('blues|Minor blues|Minor comp', {
    why2: 'Third pass: the shells walking down chromatically into the change, and a stay bar of the shell slid in.',
    fillsOnChange: [[s(0, 3, 0.75, 'shell'), s(3, 3, 0.6, 'shell', null, { chordSlide: -1 }), s(6, 3, 0.6, 'shell', null, { chordSlide: -2 }), sn(9, 3, 0.8, 'shell')]],
    fillsOnStay: [[s(0, 6, 0.75, 'shell', null, { chordSlide: 1 }), n(6, 3, 1, 0.7), n(7, 5, 1, 0.7), n(8, 7, 1, 0.75), n(9, 10, 3, 0.8, { vib: true })]],
  });
  extend('rock|Rock|Stabs on the and', {
    why2: 'Third pass: a second way into a change — the stabs walking up chromatically on the top strings.',
    fillsOnChange: [[s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), sn(10, 2, 0.75, 'low', null, { chordSlide: -2 }), sn(12, 4, 0.9, 'low', null, { chordSlide: -1 })]],
    fillsOnStay: [[s(0, 4, 0.9, 'low'), s(6, 2, 0.8, 'low'), s(12, 2, 0.85, 'low'), s(14, 2, 0.9, 'low', null, { chordSlide: 1 })]],
  });
  extend('rock|Straight rock|Chords and a riff', {
    why2: 'Third pass: the riff ending on the next chord\'s 5th, and a stay bar with the riff slid up.',
    fillsOnChange: [[s(0, 4, 0.9), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'), n(8, 0, 2, 0.85, { pm: true }), n(10, 3, 2, 0.75, { pm: true }), n(12, 5, 2, 0.8, { pm: true }), nx(14, 7, 2, 0.85)]],
    fillsOnStay: [[s(0, 4, 0.9), sl(4, 5, 7, 2, 0.85), n(6, 10, 2, 0.8), s(8, 4, 0.85), n(12, 12, 2, 0.85), n(14, 10, 2, 0.8, { pm: true })]],
  });
  extend('rock|Half-time rock|Pedal and stab', {
    why2: 'Third pass: the pedal walking up under the stab into a change.',
    fillsOnChange: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), s(4, 4, 0.95, 'low'), nx(8, -5, 2, 0.85, { pm: true }), nx(10, -3, 2, 0.8, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })]],
  });
  extend("rock|Rock 'n' roll|Double stops (Berry-inspired)", {
    why2: 'And a stay bar with the double stop held and shaken.',
    fillsOnStay: [[d(0, 4, 7, 4, 0.9, { up: 1 }), d(4, 4, 7, 4, 0.85), d(8, 5, 7, 4, 0.9, { up: 2 }), d(12, 4, 7, 4, 0.85)]],
  });
  extend('rock|Heartland|Sus strum', {
    why2: 'And a stay bar that hangs on the sus4.',
    fillsOnStay: [[s(0, 4, 0.85), h(4, 4, 5, 4, 0.75), s(8, 4, 0.8), p(12, 5, 4, 2, 0.75), s(14, 2, 0.6, 'high')]],
  });
  extend('rock|Crazy Horse stomp|Four quarters', {
    why2: 'Third pass: the chords walking down into a change, one quarter each.',
    fillsOnChange: [[s(0, 3.5, 0.95), s(4, 3.5, 0.9), sn(8, 3.5, 0.9, 'full', null, { chordSlide: -2 }), sn(12, 3.5, 0.95, 'full', null, { chordSlide: -1 })]],
  });
  extend('rockabilly|Rockabilly|Dead thumb and licks (Moore-inspired)', {
    why2: 'And the licks when staying: the 6ths over the thumb.',
    fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 12, 0.8, 0.6), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 2, 11, 0.8, 0.7), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 0, 9, 0.8, 0.7)]],
  });
  extend('rockabilly|Rockabilly|Boogie and 6ths (Perkins-inspired)', {
    why2: 'And a second way into the change: the boogie stopping on the ♭7 and a rake into the next root.',
    fillsOnChange: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), n(6, 10, 2.4, 0.9, { vib: true }), nx(9, 7, 1.6, 0.75), nx(11, 0, 0.8, 0.9, { rake: true })]],
  });
  extend('rockabilly|Western swing|Four to the bar, 6ths and 9ths', {
    why2: 'And a stay bar with the 6th slid into.',
    fillsOnStay: [[s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), sl(6, 8, 9, 2.4, 0.85, { vib: true }), s(9, 1.2, 0.8, 'shell', null, { add: 9 })]],
  });
  extend('psychobilly|Psychobilly|Travis at speed (Heath-inspired)', {
    why2: 'Third pass: the walk-down into a change from above.',
    fillsOnChange: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 12, 2, 0.7), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 10, 2, 0.65), nx(8, 3, 2, 0.85, { pm: true }), nx(10, 2, 2, 0.75, { pm: true }), nx(12, 1, 2, 0.8, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
  });
  extend('psychobilly|Psychobilly|Two-note riff with space (Ivy-inspired)', {
    why2: 'And a stay bar: the riff, then nothing.',
    fillsOnStay: [[n(0, 0, 2, 0.95), n(2, 0, 1, 0.5), n(3, 3, 3, 0.9)]],
  });
  extend('surf|Surf rock|Tremolo melody (Dale-inspired)', {
    why2: 'Third pass: the melody rising into the change, tremolo-picked.',
    fillsOnChange: [[n(0, 0, 4, 0.9, { trem: 8 }), n(4, 3, 2, 0.85, { trem: 4 }), n(6, 5, 2, 0.85, { trem: 4 }), n(8, 7, 4, 0.9, { trem: 8 }), nx(12, 0, 4, 0.9, { trem: 8 })]],
  });
  extend('surf|Surf rock|Glissando riff (Chantays-inspired)', {
    why2: 'And a stay bar with the glissando repeated.',
    fillsOnStay: [[sl(0, 14, 0, 4, 0.95), s(4, 2, 0.85, 'high'), sl(8, 14, 0, 4, 0.9), s(12, 2, 0.85, 'high'), n(14, 3, 2, 0.8)]],
  });
  extend('surf|Instrumental rock|Twang melody', {
    why2: 'Third pass: a second way into the change, from the ♭7 down.',
    fillsOnChange: [[n(0, 10, 4, 0.9, { vib: true }), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85, { vib: true }), nx(12, 2, 2, 0.8), nx(14, 0, 2, 0.9)]],
  });
  extend("country|Country|Chicken pickin' (Rich-inspired)", {
    why2: 'Third pass: the steel bend into the next chord\'s 3rd.',
    fillsOnChange: [[n(0, 4, 1, 0.9, { stacc: true }), n(1, 4, 1, 0.3, { ghost: true }), n(2, 2, 1, 0.85, { stacc: true }), n(3, 2, 1, 0.3, { ghost: true }), n(4, 0, 2, 0.85, { stacc: true }), n(6, 7, 2, 0.8, { stacc: true }), dn(8, 2, 7, 8, 0.9, { up: 2 })]],
  });
  extend('country|Country|Travis picking (Travis/Atkins-inspired)', {
    why2: 'And a stay bar with the melody on the 6th and 5th.',
    fillsOnStay: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 9, 2, 0.65), s(4, 2, 0.75, 'fifth', 'mute'), n(5, 7, 1, 0.55), n(6, 9, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 7, 2, 0.65), s(12, 2, 0.75, 'fifth', 'mute'), n(13, 4, 1, 0.55), n(14, 7, 2, 0.6)]],
  });
  extend('country|Bakersfield|Steel bends and double stops', {
    why2: 'Third pass: the walk-down in 6ths into the change.',
    fillsOnChange: [[d(0, 4, 12, 4, 0.85), d(4, 2, 11, 4, 0.8), dn(8, 6, 14, 2, 0.7), dn(10, 5, 13, 2, 0.7), dn(12, 4, 12, 4, 0.85)]],
  });
  extend('country|Outlaw|Chicka', {
    why2: 'Third pass: the walk-down into a change on the low string.',
    fillsOnChange: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), nx(8, 5, 2, 0.9, { pm: true }), nx(10, 4, 2, 0.75, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
  });
  extend('country|Country rock|Bass-note strum', {
    why2: 'And a stay bar with the 3rd hammered inside the strum.',
    fillsOnStay: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), h(4, 2, 4, 2, 0.75), s(6, 2, 0.55, 'high'), s(8, 2, 0.85, 'fifth'), s(10, 2, 0.7, 'high'), h(12, 3, 4, 2, 0.75), s(14, 2, 0.55, 'high')]],
  });
  extend('country|Hot country|Banjo rolls', {
    why2: 'Third pass: the roll walking down into the change.',
    fillsOnChange: [[n(0, 12, 1, 0.9), n(1, 9, 1, 0.75), n(2, 7, 1, 0.8), n(3, 12, 1, 0.75), n(4, 9, 1, 0.8), n(5, 7, 1, 0.75), n(6, 4, 1, 0.8), n(7, 7, 1, 0.7), n(8, 2, 2, 0.8), n(10, 0, 2, 0.8), nx(12, 5, 1, 0.7), nx(13, 4, 1, 0.75), nx(14, 2, 1, 0.75), nx(15, 0, 1, 0.85)]],
  });
  extend('country|Country waltz|Bass, chord, chord', {
    why2: 'And a stay bar with the ♭3 hammered on two.',
    fillsOnStay: [[s(0, 4, 0.9, 'bass'), h(4, 3, 4, 2, 0.8), n(6, 7, 2, 0.75), s(8, 3, 0.65, 'high')]],
  });
  extend('bluegrass|Bluegrass|Crosspicking (Watson/White-inspired)', {
    why2: 'Third pass: a walk-down into a change with the crosspicked pattern kept.',
    fillsOnChange: [[n(0, 0, 1, 0.85), n(1, 7, 1, 0.6), n(2, 12, 1, 0.7), n(3, 0, 1, 0.8), n(4, 7, 1, 0.6), n(5, 12, 1, 0.7), n(6, 4, 1, 0.8), n(7, 12, 1, 0.65), nx(8, 5, 2, 0.9, { pm: true }), nx(10, 4, 2, 0.8, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
  });
  extend('bluegrass|Bluegrass|Chop rhythm (Rice-inspired)', {
    why2: 'Third pass: the walk-down into a change under the chop.',
    fillsOnChange: [[s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), nx(8, 5, 2, 0.9, { pm: true }), nx(10, 4, 2, 0.8, { pm: true }), nx(12, 2, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.9, { pm: true })]],
  });
  extend('jazz|Swing|Octaves (Montgomery-inspired)', {
    why2: 'And a stay bar of octaves on the 5th and 6th.',
    fillsOnStay: [[d(0, 7, 19, 1.6, 0.85), d(2, 9, 21, 0.8, 0.65), d(3, 7, 19, 1.6, 0.8), d(5, 9, 21, 0.8, 0.65), d(6, 10, 22, 1.6, 0.85), d(8, 9, 21, 0.8, 0.65), d(9, 7, 19, 2.4, 0.85, { vib: true })]],
  });
  extend('jazz|Bossa nova|The batida, two bars', {
    why2: 'And a stay bar with a line on the 9th and 3rd.',
    fillsOnStay: [[s(0, 4, 0.85, 'bass'), s(0, 2, 0.55, 'high', null, { add: 14 }), n(4, 14, 2, 0.65), n(6, 12, 2, 0.6), s(8, 4, 0.8, 'bass'), n(10, 11, 2, 0.6), n(12, 9, 2, 0.6), s(14, 2, 0.5, 'high', null, { add: 14 })]],
  });
  extend('jazz|Jazz waltz|Comp in three', {
    why2: 'And a stay bar: the comp on two with a line into three.',
    fillsOnStay: [[s(3, 2, 0.75, 'shell'), n(6, 7, 0.8, 0.8), n(8, 9, 0.8, 0.7)]],
  });
  extend('jazz|Bebop|Bebop line', {
    why2: 'And a stay bar that repeats a three-note cell, the way a soloist worries an idea.',
    fillsOnStay: [[n(0, 4, 0.8, 0.85), n(2, 7, 0.8, 0.7), n(3, 5, 0.8, 0.8), n(5, 4, 0.8, 0.7), n(6, 7, 0.8, 0.8), n(8, 5, 0.8, 0.7), n(9, 4, 2.4, 0.85, { vib: true })]],
  });
  extend('jazz|Jazz ballad|Chord-melody', {
    why2: 'Third pass: a second way into the change, the melody rising to the next 3rd.',
    fillsOnChange: [[s(0, 3, 0.75, 'shell', null, { add: 14 }), n(3, 4, 1.5, 0.65), n(4.5, 7, 1.5, 0.65), n(6, 9, 3, 0.7, { vib: true }), nx(9, 2, 1.5, 0.6), nx(10.5, 4, 1.5, 0.8, { vib: true })]],
  });
  extend('jazz|Soul jazz|Boogaloo comp and line', {
    why2: 'Third pass: the line walking up chromatically into the change.',
    fillsOnChange: [[s(2, 2, 0.7, 'high', null, { add: 14 }), n(6, 3, 1, 0.7), n(7, 4, 1, 0.8), n(8, 7, 2, 0.8), n(10, 10, 2, 0.8), nx(12, -2, 2, 0.75), nx(14, -1, 2, 0.85)]],
  });
  extend('ballad|6/8 ballad|6ths and triplets (soul ballad)', {
    why2: 'And a stay bar with the chord and a triplet answer.',
    fillsOnStay: [[s(0, 6, 0.8), n(6, 4, 1, 0.65), n(7, 7, 1, 0.65), n(8, 12, 1, 0.7), n(9, 7, 3, 0.75, { vib: true })]],
  });
  extend('reggae|Reggae|Skank, tight', {
    why2: 'And a second way into the change: the skank with the chords sliding down into it.',
    fillsOnChange: [[s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), s(10, 1, 0.8, 'high', 'mute'), sn(14, 1, 0.8, 'high', 'mute', { chordSlide: -1 })]],
  });
  extend('reggae|Steppers|Skank over steppers', {
    why2: 'Third pass: a second way into the change, the low line walking down.',
    fillsOnChange: [[s(2, 1, 0.8, 'high', 'mute'), s(6, 1, 0.8, 'high', 'mute'), n(8, 7, 2, 0.75), s(10, 1, 0.8, 'high', 'mute'), nx(12, 2, 2, 0.7), nx(14, 0, 2, 0.75)]],
  });
  extend('reggae|Rocksteady|3rds on the offbeat', {
    why2: 'Third pass: 3rds stepping down into the change.',
    fillsOnChange: [[d(2, 4, 7, 1.5, 0.75), d(6, 4, 7, 1.5, 0.75), d(10, 2, 5, 1.5, 0.7), dn(14, 4, 7, 1.5, 0.75)]],
  });
  extend('ska|Ska (Jamaican)|Swung upstrokes', {
    why2: 'Third pass: the upstrokes walking up chromatically into the change.',
    fillsOnChange: [[s(2, 0.8, 0.8, 'high', 'mute'), s(5, 0.8, 0.8, 'high', 'mute'), sn(8, 0.8, 0.75, 'high', 'mute', { chordSlide: -2 }), sn(11, 0.8, 0.8, 'high', 'mute', { chordSlide: -1 })]],
  });
  extend('soul|Soul|6ths and muted backbeat', {
    why2: 'And a stay bar with the 6th slid up to and left.',
    fillsOnStay: [[sl(0, 3, 4, 4, 0.8), s(4, 1, 0.55, 'high', 'mute'), d(8, 4, 12, 4, 0.75), s(12, 1, 0.55, 'high', 'mute'), n(14, 7, 2, 0.6)]],
  });
  extend('soul|Motown|Chank and octaves', {
    why2: 'Third pass: the pentatonic riff climbing into the change.',
    fillsOnChange: [[s(4, 1.5, 0.75, 'high'), n(8, 0, 2, 0.8), n(10, 4, 2, 0.75), n(12, 7, 2, 0.8), nx(14, 4, 2, 0.8)]],
  });
  extend('soul|Sweet soul|Rolling hammer-ons', {
    why2: 'Third pass: the hammers rolling down into the change.',
    fillsOnChange: [[h(0, 5, 7, 2, 0.75), n(2, 3, 2, 0.6), h(4, 2, 3, 2, 0.75), n(6, 0, 2, 0.6), dn(8, 5, 10, 2, 0.65), dn(10, 3, 7, 2, 0.65), dn(12, 3, 12, 4, 0.75)]],
  });
  extend('soul|Neo-soul|Swung arpeggios', {
    why2: 'Third pass: a second way into the change, down through the 9th.',
    fillsOnChange: [[n(0, 14, 2, 0.7), n(2, 12, 2, 0.55), n(4, 10, 2, 0.6), n(6, 7, 2, 0.55), n(8, 3, 2, 0.65), n(10, 0, 2, 0.55), nx(12, 7, 2, 0.55), nx(14, 3, 2, 0.7)]],
  });
  extend('pop|Acoustic pop|Percussive strum', {
    why2: 'And a stay bar with a hammer-on inside the shape.',
    fillsOnStay: [[s(0, 4, 0.85), g(2, 1, 0.25), s(4, 1, 0.75, 'full', 'mute'), h(6, 4, 5, 2, 0.6), g(8, 1, 0.3), p(10, 5, 4, 2, 0.6), s(12, 1, 0.75, 'full', 'mute'), s(14, 2, 0.55, 'high')]],
  });
  extend('funk|New Orleans funk|Riff in unison with the bass', {
    why2: 'Third pass: the riff walking down into the change.',
    fillsOnChange: [[n(0, 0, 2, 0.9, { pm: true }), n(3, 10, 1, 0.7, { pm: true }), n(6, 12, 2, 0.75, { pm: true }), n(8, 10, 1, 0.8, { pm: true }), n(9, 7, 1, 0.75, { pm: true }), n(11, 5, 1, 0.7, { pm: true }), nx(12, 2, 1, 0.75, { pm: true }), nx(14, 0, 2, 0.85, { pm: true })]],
  });
  extend('metal|Metal|Pedal riff (♭2 and ♭5)', {
    why2: 'Third pass: a second way into the change, the riff climbing.',
    fillsOnChange: [[s(0, 1, 0.9, 'bass', 'mute'), s(1, 1, 0.55, 'bass', 'mute'), n(2, 1, 2, 0.85, { pm: true }), s(4, 1, 0.8, 'bass', 'mute'), s(5, 1, 0.55, 'bass', 'mute'), n(6, 3, 2, 0.85, { pm: true }), n(8, 5, 2, 0.85, { pm: true }), n(10, 6, 2, 0.85, { pm: true }), nx(12, -2, 2, 0.85, { pm: true }), nx(14, -1, 2, 0.9, { pm: true })]],
  });
  extend('metal|Thrash|Downpicked eighths', {
    why2: 'Third pass: a second way into the change, the chromatic riff descending onto the next root from above.',
    fillsOnChange: [[s(0, 1.6, 0.9, 'bass', 'mute'), s(2, 1.6, 0.7, 'bass', 'mute'), n(4, 6, 2, 0.9, { pm: true }), n(6, 5, 2, 0.85, { pm: true }), n(8, 3, 2, 0.85, { pm: true }), n(10, 1, 2, 0.9, { pm: true }), nx(12, 1, 2, 0.85, { pm: true }), nx(14, 0, 2, 0.95, { pm: true })]],
  });
  extend('simple|Simple|Arpeggio study', {
    why2: 'And a second way into the change, the arpeggio landing on the next chord\'s 3rd.',
    fillsOnChange: [[s(0, 4, 0.85), n(4, 0, 2, 0.75), n(6, 4, 2, 0.75), n(8, 7, 2, 0.8), n(10, 12, 2, 0.8), nx(12, 7, 2, 0.7), nx(14, 4, 2, 0.8)]],
  });

  // =========================================================================
  // FOURTH PASS — the upper register. Nothing in the blues or rock parts went
  // above the octave: every line sat on the low and middle strings of the box.
  // The players don't. B.B. King's box is the top three strings around the
  // root on the B string — the 9th and the ♭3 bent to the 3rd, the 6th, the
  // root shaken; Albert King's is the pentatonic shape above the root, bent
  // a step and a step and a half; Freddie King and Stevie Ray Vaughan run the
  // box down from its top string; rock answers the low chord with the unison
  // bend, 4ths on the top two strings, and the riff said an octave up.
  // Intervals: 12 the octave, 14 the 9th, 15 the ♭3, 16 the 3rd, 17 the 4th,
  // 19 the 5th, 21 the 6th, 22 the ♭7, 24 the double octave, 26 the 9th and
  // 27/28 the ♭3/3 above it. A five-fret box whose root sits on the low E
  // holds everything to 28 on its top string; one rooted on the A string
  // holds to 23 and folds the rest down an octave, so the parts written for
  // E-rooted styles (Texas, Hooker, Delta, Bo Diddley) peak on the ♭7.
  // ---- blues (twelve to the bar) ----
  extend('blues|Blues shuffle|5–6 boogie', {
    why2: 'Fourth pass, up the neck: the boogie answered from the top of the box — the ♭7 bent to the high root and shaken — as a fill and a tail, and a turnaround that walks down from the double octave.',
    fills: [[d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
             b(6, 22, 2, 3, 0.9, { vib: true }), n(9, 19, 1.6, 0.8), n(11, 15, 0.8, 0.7)]],
    tails: [[b(9, 22, 2, 2.4, 0.9, { vib: true })]],
    turnarounds: [[n(0, 24, 1.6, 0.9, { vib: true }), n(2, 22, 0.8, 0.7), n(3, 21, 1.6, 0.8), n(5, 19, 0.8, 0.7), n(6, 15, 0.8, 0.75), n(7, 16, 0.8, 0.8), n(8, 12, 0.8, 0.8), nx(9, 13, 1.6, 0.8), nx(11, 12, 0.8, 0.85)]],
  });
  extend('blues|Blues shuffle|Upbeat chops (the second guitar)', {
    why2: 'Fourth pass, up the neck: the second guitar answers on the top strings — the ♭7 bent to the root and the box run down, or the high root into the next chord\'s 3rd above the octave.',
    fillsOnStay: [[s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), b(6, 22, 2, 2.4, 0.85, { vib: true }), n(9, 19, 0.8, 0.7), n(10, 17, 0.8, 0.7), n(11, 15, 0.8, 0.7)]],
    fillsOnChange: [[s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), n(6, 24, 1.6, 0.85, { vib: true }), n(8, 22, 0.8, 0.7), nx(9, 16, 1.6, 0.8, { vib: true }), nx(11, 19, 0.8, 0.6)]],
  });
  extend('blues|Blues shuffle|Stabs and licks', {
    why2: 'Fourth pass, up the neck: the licks in the B.B. box — the high root said and shaken with the ♭7–5–♭7 turn, the 9th bent to the 3rd above the double octave, the 6th to the root and down the box; into a change the ♭7 bent to the root falls onto the next 3rd; staying, the high root twice with a rake and the ♭3 bent a half-step; a tail on the ♭7-to-root bend.',
    fills: [
      [n(0, 24, 2.4, 0.9, { vib: true }), n(3, 22, 0.8, 0.75), n(4, 19, 0.8, 0.7), n(5, 22, 0.8, 0.75), n(6, 24, 3, 0.85, { vib: true }), s(9, 2.4, 0.8, 'high')],
      [b(0, 26, 2, 2.4, 0.9, { vib: true }), n(3, 24, 0.8, 0.75), n(4, 21, 0.8, 0.7), n(5, 24, 1.6, 0.8), n(7, 21, 0.8, 0.7), n(8, 19, 2.4, 0.85, { vib: true })],
      [n(0, 21, 0.8, 0.8), n(1, 24, 2.4, 0.9, { vib: true }), n(5, 22, 0.8, 0.7), n(6, 19, 1.6, 0.85, { vib: true }), n(9, 17, 0.8, 0.7), n(10, 15, 0.8, 0.7), n(11, 12, 0.8, 0.8)],
    ],
    fillsOnChange: [[b(0, 22, 2, 2.4, 0.9, { vib: true }), n(3, 19, 0.8, 0.75), n(4, 17, 0.8, 0.7), n(5, 15, 0.8, 0.75), n(6, 12, 1.6, 0.8), nx(9, 16, 2.4, 0.85, { vib: true })]],
    fillsOnStay: [[n(0, 24, 1.6, 0.9, { rake: true }), n(2, 24, 0.8, 0.5), n(3, 24, 1.6, 0.85, { vib: true }), b(6, 27, 1, 2.4, 0.85, { vib: true }), s(9, 2.4, 0.8, 'high')]],
    tails: [[b(9, 22, 2, 2.4, 0.9, { vib: true })]],
  });
  extend('blues|Slow blues|9th-chord comp (Walker-inspired)', {
    why2: 'Fourth pass, up the neck: the single-note answers to the chord move to the top strings — the ♭7 bent to the root and the box walked down; the 6th to the high root, shaken.',
    fills: [[s(0, 3, 0.8, 'high', null, { add: 14 }), b(3, 22, 2, 3, 0.9, { vib: true }), n(6, 19, 1, 0.7), n(7, 17, 1, 0.7), n(8, 15, 1, 0.7), n(9, 12, 3, 0.85, { vib: true })]],
    fillsOnStay: [[s(0, 6, 0.8, 'high', null, { chordSlide: 1, add: 14 }), n(6, 21, 1, 0.7), n(7, 24, 3, 0.85, { vib: true })]],
  });
  extend('blues|Slow blues|The call (King-inspired)', {
    why2: 'Fourth pass, up the neck — where these calls live: the 9th bent to the 3rd above the double octave and answered root–6th–root; the ♭3 bent a half-step and shaken, then the root; the answer from the top of the box; into a change, the ♭7 bent to the root falling onto the next 3rd; staying, the 4th bent to the 5th an octave up, and the 5th bent a step and a half (the Albert King bend); a figure and a turnaround an octave up.',
    variants: [[n(3, 24, 3, 0.9, { vib: true }), n(9, 22, 1, 0.7), n(10, 19, 1, 0.7), n(11, 17, 1, 0.75)]],
    fills: [
      [b(3, 26, 2, 3, 0.9, { vib: true }), n(9, 24, 1, 0.7), n(10, 21, 1, 0.7), n(11, 24, 1, 0.75)],
      [b(0, 27, 1, 4, 0.9, { vib: true }), n(6, 24, 3, 0.85, { vib: true })],
      [n(0, 24, 2, 0.9, { vib: true }), n(2, 22, 1, 0.75), n(3, 19, 3, 0.85, { vib: true }), n(9, 17, 1, 0.7), n(10, 15, 1, 0.7), n(11, 12, 1, 0.8)],
    ],
    fillsOnChange: [[b(3, 22, 2, 3, 0.9, { vib: true }), n(6, 19, 1, 0.7), n(7, 17, 1, 0.65), n(8, 15, 1, 0.7), nx(9, 16, 3, 0.85, { vib: true })]],
    fillsOnStay: [
      [b(3, 17, 2, 3, 0.9, { vib: true }), n(9, 15, 1, 0.7), n(10, 12, 2, 0.85, { vib: true })],
      [b(0, 19, 3, 4, 0.9, { vib: true }), n(6, 17, 1, 0.7), n(7, 15, 2, 0.8), n(9, 12, 3, 0.85, { vib: true })],
    ],
    turnarounds: [[n(0, 24, 1, 0.9), n(1, 22, 1, 0.75), n(2, 21, 1, 0.7), n(3, 20, 1, 0.7), n(4, 19, 1, 0.75), n(5, 17, 1, 0.7), n(6, 15, 1, 0.75), n(7, 16, 2, 0.8), nx(9, 19, 1.5, 0.75), nx(10.5, 12, 1.5, 0.85, { vib: true })]],
  });
  extend('blues|Jump blues|9th stabs (Walker-inspired)', {
    why2: 'Fourth pass, up the neck: the horn riff answered an octave up — 6th, ♭7, root, ♭7 on the top strings — and the high root said twice when staying.',
    fills: [[s(3, 1.6, 0.85, 'high', null, { add: 14 }), n(6, 21, 0.8, 0.8), n(8, 22, 0.8, 0.75), n(9, 24, 1.6, 0.9), n(11, 22, 0.8, 0.7)]],
    fillsOnStay: [[s(3, 1.6, 0.85, 'high', null, { add: 14, chordSlide: 1 }), n(6, 24, 0.8, 0.85), n(8, 24, 0.8, 0.5), n(9, 22, 1.6, 0.8), n(11, 19, 0.8, 0.7)]],
  });
  extend('blues|Jump blues|Boogie walk under the stabs', {
    why2: 'Fourth pass, up the neck: half a bar of the walk, then the horn riff on the top strings.',
    fills: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), n(6, 22, 1.6, 0.85), n(8, 24, 0.8, 0.8), n(9, 22, 1.6, 0.8), n(11, 19, 0.8, 0.7)]],
  });
  extend('blues|Texas shuffle|Everything at once', {
    why2: 'Fourth pass, up the neck: the box run down from its top string with a rake into the first note and the ♭3 bent a tone at the end; staying, the 5th and ♭7 up top with the ♭7 bent to the root; a triplet tail from the top.',
    fills: [[n(0, 22, 0.8, 0.9, { rake: true }), n(1, 19, 0.8, 0.75), n(2, 17, 0.8, 0.8), n(3, 19, 0.8, 0.85), n(4, 17, 0.8, 0.75), n(5, 15, 0.8, 0.75), n(6, 17, 0.8, 0.85), n(7, 15, 0.8, 0.75), n(8, 12, 0.8, 0.75), b(9, 15, 2, 2.4, 0.9, { vib: true })]],
    fillsOnStay: [[d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'), n(6, 19, 0.8, 0.85), n(7, 22, 0.8, 0.8), b(8, 22, 2, 2.4, 0.9, { vib: true }), s(11, 0.8, 0.5, 'full', 'mute')]],
    tails: [[n(9, 22, 0.8, 0.85), n(10, 19, 0.8, 0.75), n(11, 17, 0.8, 0.8)]],
  });
  extend('blues|Texas shuffle|Texas triplets', {
    why2: 'Fourth pass, up the neck: the groups of three from the top string down, the ♭7 said twice and bent to the root when staying, and a change fill that runs down and back up to land on the next chord\'s 3rd above the octave.',
    fills: [[n(0, 22, 0.8, 0.9, { rake: true }), n(1, 19, 0.8, 0.75), n(2, 17, 0.8, 0.8), n(3, 19, 0.8, 0.85), n(4, 17, 0.8, 0.75), n(5, 15, 0.8, 0.8), n(6, 17, 0.8, 0.85), n(7, 15, 0.8, 0.75), n(8, 12, 0.8, 0.8), b(9, 15, 2, 2.4, 0.9, { vib: true })]],
    fillsOnStay: [[d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'), n(6, 22, 0.8, 0.85), n(7, 22, 0.8, 0.5), n(8, 19, 0.8, 0.8), b(9, 22, 2, 2.4, 0.9, { vib: true })]],
    fillsOnChange: [[n(0, 22, 0.8, 0.85), n(1, 19, 0.8, 0.75), n(2, 17, 0.8, 0.75), n(3, 15, 1.6, 0.85), n(5, 17, 0.8, 0.7), n(6, 19, 0.8, 0.8), n(7, 22, 0.8, 0.75), n(8, 19, 0.8, 0.8), nx(9, 17, 0.8, 0.75), nx(10, 16, 1.6, 0.85, { vib: true })]],
  });
  extend('blues|One-chord boogie|Boogie pedal', {
    why2: 'Fourth pass, up the neck: the shout on the top strings — 5th, ♭7, 5th over the pedal — and the ♭3-to-3 hammer an octave up. And when the one chord does move (the IV in a boogie that has one), the pedal walks up into it.',
    fillsOnChange: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), h(3, 3, 4, 1.6, 0.8), n(5, 0, 0.8, 0.6, { pm: true }), nx(6, -5, 1.6, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.6, 0.8, { pm: true }), nx(11, -1, 0.8, 0.8, { pm: true })]],
    fills: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), n(3, 19, 0.8, 0.85), n(4, 22, 0.8, 0.8), n(5, 19, 0.8, 0.8), n(6, 0, 1.6, 0.9, { pm: true }), n(8, 0, 0.8, 0.6, { pm: true }), h(9, 15, 16, 1.6, 0.8), n(11, 12, 0.8, 0.7)]],
  });
  extend('blues|Delta fingerstyle|Dead thumb and fills', {
    why2: 'Fourth pass, up the neck: the fingers answer on the first string over the thumb — the ♭7 and 5th in triplets, the box down to the octave — and the ♭3 hammered to the 3 up there when staying.',
    fills: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(1, 22, 0.8, 0.75), n(2, 19, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), n(4, 17, 0.8, 0.7), n(5, 15, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), n(7, 12, 1.6, 0.75), s(9, 1.4, 0.8, 'bass', 'mute'), n(11, 10, 0.8, 0.6)]],
    fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(2, 22, 0.8, 0.75), s(3, 1.4, 0.8, 'bass', 'mute'), n(4, 19, 0.8, 0.7), n(5, 22, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), n(7, 19, 0.8, 0.7), n(8, 17, 0.8, 0.7), s(9, 1.4, 0.8, 'bass', 'mute'), h(11, 15, 16, 0.8, 0.7)]],
  });
  extend('blues|Minor blues|Minor call', {
    why2: 'Fourth pass, up the neck: the calls an octave up — the 4th bent to the 5th at the top of the box, the high root shaken and the box run down, the 5th bent a step and a half to the ♭7 (Albert King\'s bend); into a change, the high bend falling onto the next chord\'s ♭3 above the octave; a figure up top.',
    variants: [[n(0, 24, 1, 0.85), n(1, 22, 1, 0.75), n(2, 19, 4, 0.85, { vib: true }), n(9, 21, 1, 0.7), n(10, 19, 2, 0.8)]],
    fills: [
      [b(0, 17, 2, 4, 0.9, { vib: true }), n(6, 15, 1, 0.75), n(7, 12, 2, 0.8), n(9, 22, 3, 0.8, { vib: true })],
      [n(0, 24, 3, 0.9, { vib: true }), n(3, 22, 1, 0.75), n(4, 19, 2, 0.8), n(6, 17, 1, 0.7), n(7, 15, 1, 0.7), n(8, 12, 4, 0.85, { vib: true })],
      [b(0, 19, 3, 4, 0.9, { vib: true }), n(6, 17, 1, 0.7), n(7, 15, 2, 0.8), n(9, 12, 3, 0.85, { vib: true })],
    ],
    fillsOnChange: [[b(3, 17, 2, 3, 0.9, { vib: true }), n(6, 15, 1, 0.7), n(7, 12, 2, 0.75), nx(9, 15, 3, 0.85, { vib: true })]],
    fillsOnStay: [[n(3, 22, 3, 0.85, { vib: true }), n(6, 19, 1, 0.7), n(7, 17, 1, 0.7), n(8, 15, 1, 0.7), n(9, 12, 3, 0.85, { vib: true })]],
  });
  extend('blues|Minor blues|Minor comp', {
    why2: 'Fourth pass, up the neck: the answer in the space climbs the top strings to the ♭7, or to the high root.',
    fills: [[s(0, 3, 0.75, 'shell'), n(3, 15, 3, 0.8, { vib: true }), n(6, 17, 1, 0.7), n(7, 19, 1, 0.75), n(8, 22, 1, 0.8), n(9, 24, 3, 0.85, { vib: true })]],
    fillsOnStay: [[s(0, 6, 0.75, 'shell'), n(6, 15, 1, 0.7), n(7, 17, 1, 0.7), n(8, 19, 1, 0.75), n(9, 22, 3, 0.8, { vib: true })]],
  });

  // ---- rock (sixteen to the bar) ----
  extend('rock|Rock|Chords with space (Young-inspired)', {
    why2: 'Fourth pass, up the neck: the low chord answered on the top two strings — 4ths (the 5th under the root, the 4th under the ♭7), the unison bend as a tail, the high root raked and shaken when staying.',
    fills: [[s(0, 4, 0.95, 'low'), s(6, 2, 0.85, 'low'), d(8, 19, 24, 2, 0.85), d(10, 19, 24, 2, 0.6), d(12, 17, 22, 2, 0.8), d(14, 19, 24, 2, 0.85)]],
    tails: [[d(12, 17, 19, 4, 0.9, { up: 2, vib: true })], [n(12, 24, 2, 0.9, { rake: true }), n(14, 22, 2, 0.8)]],
    fillsOnStay: [[s(0, 4, 0.95, 'low'), g(4, 1, 0.3, 'low'), s(6, 2, 0.85, 'low'), n(8, 24, 2, 0.9, { rake: true }), n(10, 22, 2, 0.8), n(12, 24, 4, 0.9, { vib: true })]],
  });
  extend('rock|Rock|Stabs on the and', {
    why2: 'Fourth pass, up the neck: the riff said an octave up with the ♭7 bent to the high root; two unison bends and the rake to the high root when staying; into a change, the high root down to the 5th and onto the next chord\'s ♭7 and root above the octave.',
    fills: [[n(0, 12, 2, 0.9, { pm: true }), n(2, 12, 1, 0.5, { pm: true }), n(3, 22, 1, 0.8, { rake: true }), n(4, 24, 2, 0.85), n(6, 12, 2, 0.75, { pm: true }), n(8, 12, 1, 0.5, { pm: true }), n(9, 22, 1, 0.8), n(10, 24, 2, 0.85), b(12, 22, 2, 4, 0.9, { vib: true })]],
    fillsOnStay: [[d(0, 17, 19, 4, 0.9, { up: 2 }), d(4, 17, 19, 4, 0.85, { up: 2 }), n(8, 24, 2, 0.9, { rake: true }), n(10, 22, 2, 0.8), n(12, 19, 4, 0.9, { vib: true })]],
    fillsOnChange: [[s(0, 4, 0.9, 'low'), n(6, 24, 2, 0.9, { rake: true }), n(8, 22, 2, 0.8), n(10, 19, 2, 0.8), nx(12, 22, 2, 0.8), nx(14, 24, 2, 0.9, { vib: true })]],
  });
  extend('rock|Straight rock|Eighth-note chug, muted', {
    why2: 'Fourth pass, up the neck: half a bar of chug, then the unison bend and the ♭7 raked on the first string; or the riff said on the top strings — ♭7, ♭7, 5th, 4th.',
    fills: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), d(8, 17, 19, 4, 0.9, { up: 2, vib: true }), n(12, 22, 2, 0.9, { rake: true }), n(14, 19, 2, 0.8)]],
    fillsOnStay: [[s(0, 1.8, 0.95), s(2, 1.8, 0.55, 'low', 'mute'), s(4, 1.8, 0.7, 'low', 'mute'), s(6, 1.8, 0.55, 'low', 'mute'), n(8, 22, 2, 0.9), n(10, 22, 2, 0.6), n(12, 19, 2, 0.85), n(14, 17, 2, 0.8)]],
  });
  extend('rock|Straight rock|Chords and a riff', {
    why2: 'Fourth pass, up the neck: the riff on the top strings — ♭7, 5th, ♭7, 5th, then the 4th bent to the 5th — and the same bend answered by the 5th and ♭7 when staying.',
    fills: [[n(0, 22, 2, 0.9), n(2, 19, 2, 0.75), n(4, 22, 2, 0.85), n(6, 19, 2, 0.75), b(8, 17, 2, 4, 0.85, { vib: true }), s(12, 4, 0.9)]],
    fillsOnStay: [[s(0, 4, 0.9), s(4, 2, 0.7, 'low', 'mute'), s(6, 2, 0.6, 'low', 'mute'), b(8, 17, 2, 4, 0.85, { vib: true }), n(12, 19, 2, 0.75), n(14, 22, 2, 0.8)]],
  });
  extend('rock|Half-time rock|Pedal and stab', {
    why2: 'Fourth pass, up the neck: the pedal kept low and the answer up top — the ♭3 bent a tone at the octave, the 5th and ♭7 on the first string — and the ♭7 bent to the high root, held, when staying.',
    fills: [[n(0, 0, 2, 0.9, { pm: true }), n(2, 0, 2, 0.6, { pm: true }), b(4, 15, 2, 4, 0.9, { vib: true }), n(8, 0, 2, 0.85, { pm: true }), n(10, 0, 2, 0.6, { pm: true }), n(12, 19, 2, 0.8), n(14, 22, 2, 0.85)]],
    fillsOnStay: [[s(0, 8, 0.95, 'low'), b(8, 22, 2, 8, 0.9, { vib: true })]],
  });
  extend("rock|Rock 'n' roll|Straight boogie", {
    why2: 'Fourth pass, up the neck: the boogie answered with double stops on the top strings — the 3rd bent under the 5th, the ♭3 and 5th, the root and 3rd.',
    fills: [[d(0, 0, 7, 2, 0.9, { pm: true }), d(2, 0, 7, 2, 0.6, { pm: true }), d(4, 0, 9, 2, 0.85, { pm: true }), d(6, 0, 9, 2, 0.6, { pm: true }), d(8, 16, 19, 2, 0.85, { up: 1 }), d(10, 16, 19, 2, 0.6), d(12, 15, 19, 2, 0.85), d(14, 12, 16, 2, 0.8)]],
  });
  extend("rock|Rock 'n' roll|Double stops (Berry-inspired)", {
    why2: 'Fourth pass, up the neck: the double stops where Berry plays them — on the top two strings above the octave: the ♭7 with the 9th walking down to the 3rd and 5th, the figure itself an octave up, two unison bends when staying, and the change fill from up there.',
    variants: [[d(0, 16, 19, 2, 0.9, { up: 1 }), d(2, 16, 19, 2, 0.6), d(4, 16, 19, 2, 0.85), d(6, 15, 19, 2, 0.7), d(8, 12, 16, 2, 0.85), d(10, 12, 16, 2, 0.6), d(12, 12, 19, 4, 0.85)]],
    fills: [[d(0, 22, 26, 2, 0.9), d(2, 22, 26, 2, 0.6), d(4, 21, 24, 2, 0.85), d(6, 17, 22, 2, 0.75), d(8, 16, 19, 4, 0.85, { up: 1 }), n(12, 15, 2, 0.75), n(14, 16, 2, 0.8)]],
    fillsOnStay: [[d(0, 17, 19, 4, 0.9, { up: 2 }), d(4, 17, 19, 4, 0.85, { up: 2 }), d(8, 16, 19, 2, 0.9, { up: 1 }), d(10, 16, 19, 2, 0.6), d(12, 16, 19, 4, 0.85)]],
    fillsOnChange: [[d(0, 16, 19, 2, 0.9, { up: 1 }), d(2, 16, 19, 2, 0.6), d(4, 16, 19, 2, 0.85), n(8, 22, 2, 0.8), n(10, 19, 2, 0.75), nx(12, 16, 4, 0.85, { vib: true })]],
  });
  extend('rock|Bo Diddley beat|The clave strum', {
    why2: 'Fourth pass, up the neck: the 5th up to the ♭7 on the first string where the chord was.',
    fills: [[s(0, 2, 0.9), g(2, 1, 0.3), g(4, 1, 0.3), s(6, 2, 0.85), n(8, 19, 2, 0.8), n(10, 22, 2, 0.85), s(12, 2, 0.85), g(14, 1, 0.3)]],
  });
  extend('rock|Jangle|Ringing arpeggio', {
    why2: 'Fourth pass, up the neck: the arpeggio in the chord\'s top octave — 3rd, 5th, 6th — the way the high strings of a twelve-string ring, and a change fill that comes down from there onto the next chord\'s 5th and 3rd.',
    fills: [[n(0, 12, 4, 0.8), n(1, 16, 4, 0.6), n(2, 19, 4, 0.7), n(3, 21, 4, 0.6), n(4, 19, 4, 0.65), n(5, 16, 4, 0.55), n(6, 19, 4, 0.65), n(7, 21, 4, 0.6), n(8, 12, 4, 0.8), n(9, 16, 4, 0.6), n(10, 19, 4, 0.7), n(11, 21, 4, 0.6), n(12, 19, 4, 0.65), n(13, 16, 4, 0.55), n(14, 14, 4, 0.65), n(15, 12, 4, 0.6)]],
    fillsOnChange: [[n(0, 12, 4, 0.8), n(1, 16, 4, 0.6), n(2, 19, 4, 0.7), n(3, 21, 4, 0.6), n(4, 19, 4, 0.65), n(5, 16, 4, 0.55), n(6, 19, 4, 0.65), n(7, 21, 4, 0.6), n(8, 19, 2, 0.7), n(10, 16, 2, 0.65), nx(12, 19, 2, 0.6), nx(14, 16, 2, 0.75)]],
  });
  extend('rock|Southern rock|Hammered double stops', {
    why2: 'Fourth pass, up the neck: the twin-guitar line from the 6th above the octave with the ♭3 hammered up there, the hammered double stops themselves an octave up, and a tail on the high hammer.',
    fills: [[n(0, 21, 2, 0.9), n(2, 19, 2, 0.75), n(4, 16, 2, 0.8), h(6, 15, 16, 2, 0.8), n(8, 19, 2, 0.8), n(10, 21, 2, 0.85), n(12, 19, 4, 0.85, { vib: true })]],
    fillsOnStay: [[s(0, 2, 0.9), h(2, 14, 16, 2, 0.8), d(4, 16, 19, 2, 0.8), h(6, 17, 19, 2, 0.75), s(8, 2, 0.85), h(10, 15, 16, 2, 0.8), d(12, 12, 16, 2, 0.8), d(14, 16, 19, 2, 0.7)]],
    tails: [[h(12, 15, 16, 2, 0.8), d(14, 16, 19, 2, 0.75)]],
  });
  extend('rock|Crazy Horse stomp|Four quarters', {
    why2: 'Fourth pass, up the neck: the one-note solo on the top string — the ♭7 bent to the root and shaken, said again — and the 5th answered by the ♭3 bent, up there.',
    fills: [[b(0, 22, 2, 4, 0.95, { vib: true }), b(4, 22, 2, 4, 0.9, { vib: true }), b(8, 22, 2, 8, 0.95, { vib: true })],
            [n(0, 19, 4, 0.95, { vib: true }), b(4, 15, 2, 4, 0.9, { vib: true }), n(8, 19, 4, 0.95, { vib: true }), b(12, 15, 2, 4, 0.9, { vib: true })]],
  });
  extend('rock|Heartland|Sus strum', {
    why2: 'Fourth pass, up the neck: the electric\'s answer in double stops on the top two strings — 3rd and 5th, 9th and 5th, root and 3rd.',
    fills: [[s(0, 4, 0.85), d(4, 16, 19, 2, 0.8), d(6, 16, 19, 2, 0.6), d(8, 14, 19, 2, 0.75), d(10, 12, 16, 4, 0.8), s(14, 2, 0.65, 'high')]],
  });

  // =========================================================================
  // FIFTH PASS — every other genre up the neck, and lead rolls for the chord
  // parts. The same register rule as the blues and rock pass: a box rooted on
  // the low E (the A, B♭ and G♯ entries) holds to 28 on its top string, one
  // rooted on the A string holds to 23, so lines for the latter peak on the
  // 5th, 6th and ♭7 above the octave. "leads" are bars a lead guitarist
  // would play in the fill bars; about a third of rolls use them.
  // ---- rockabilly (twelve) ----
  extend('rockabilly|Rockabilly|Boom-chick, corrected', {
    why2: 'Fifth pass, up the neck: the boom-chick with licks on the first string, and lead rolls — the Moore/Burton lines on the top strings, 6ths walking down.',
    fills: [[s(0, 1.4, 0.9, 'bass', 'mute'), n(2, 19, 0.8, 0.75), s(3, 1.4, 0.8, 'fifth', 'mute'), n(5, 22, 0.8, 0.75), s(6, 1.4, 0.9, 'bass', 'mute'), n(8, 19, 0.8, 0.75), s(9, 1.4, 0.8, 'fifth', 'mute'), n(11, 16, 0.8, 0.7)]],
    leads: [[n(0, 19, 0.8, 0.85), n(1, 22, 0.8, 0.8), n(2, 19, 0.8, 0.8), n(3, 16, 1.6, 0.85), n(5, 19, 0.8, 0.7), d(6, 12, 21, 2.4, 0.85), n(9, 22, 0.8, 0.8), n(10, 21, 0.8, 0.75), n(11, 19, 0.8, 0.8)],
            [d(0, 12, 21, 1.6, 0.85), d(2, 12, 21, 0.8, 0.6), d(3, 10, 19, 1.6, 0.8), d(5, 10, 19, 0.8, 0.6), n(6, 22, 1.6, 0.85, { vib: true }), n(8, 19, 0.8, 0.75), n(9, 17, 0.8, 0.75), n(10, 16, 0.8, 0.75), n(11, 12, 0.8, 0.8)]],
  });
  extend('rockabilly|Rockabilly|Dead thumb and licks (Moore-inspired)', {
    why2: 'Fifth pass, up the neck: the 3rds over the thumb on the top strings with the 4th bent under the 6th, and the box run down from the ♭7.',
    fills: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 16, 19, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 16, 19, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 17, 21, 0.8, 0.7, { up: 2 }), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 16, 19, 0.8, 0.7)]],
    fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(1, 22, 0.8, 0.75), n(2, 19, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), n(4, 17, 0.8, 0.7), n(5, 16, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), n(7, 12, 1.6, 0.75), s(9, 1.4, 0.8, 'bass', 'mute'), n(11, 10, 0.8, 0.6)]],
  });
  extend('rockabilly|Rockabilly|Boogie and 6ths (Perkins-inspired)', {
    why2: 'Fifth pass, up the neck: the 6ths walking down the top strings over half a bar of boogie.',
    fills: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), d(3, 12, 21, 1.6, 0.8), d(5, 12, 21, 0.8, 0.6), d(6, 10, 19, 1.6, 0.8), d(8, 10, 19, 0.8, 0.6), d(9, 7, 16, 1.6, 0.8), nx(11, 4, 0.8, 0.8)]],
  });
  extend('rockabilly|Western swing|Four to the bar, 6ths and 9ths', {
    why2: 'Fifth pass, up the neck: a swing line on the top strings after two chords, and lead rolls — the single-note line and the 6ths walking down, the way the second guitar takes a chorus.',
    fills: [[s(0, 1.2, 0.6, 'shell', null, { add: 9 }), s(3, 1.2, 0.8, 'shell', null, { add: 9 }), n(6, 19, 0.8, 0.8), n(7, 21, 0.8, 0.75), n(8, 19, 0.8, 0.8), n(9, 16, 1.6, 0.85), n(11, 12, 0.8, 0.7)]],
    leads: [[n(0, 16, 1.2, 0.8), n(2, 19, 0.8, 0.7), n(3, 21, 1.6, 0.85), n(5, 19, 0.8, 0.7), n(6, 16, 1.2, 0.8), n(8, 14, 0.8, 0.7), n(9, 12, 1.6, 0.85), n(11, 9, 0.8, 0.7)],
            [d(0, 12, 21, 1.6, 0.8), d(3, 10, 19, 1.6, 0.75), d(6, 9, 17, 1.6, 0.8), d(9, 7, 16, 1.6, 0.75)]],
  });
  // ---- psychobilly (sixteen) ----
  extend('psychobilly|Psychobilly|Travis at speed (Heath-inspired)', {
    why2: 'Fifth pass, up the neck: the melody notes on the first string over the thumb.',
    fills: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 19, 2, 0.7), s(4, 2, 0.8, 'fifth', 'mute'), n(6, 22, 2, 0.7), s(8, 2, 0.9, 'bass', 'mute'), n(10, 19, 1, 0.7), n(11, 17, 1, 0.65), s(12, 2, 0.8, 'fifth', 'mute'), n(14, 16, 2, 0.7)]],
  });
  extend('psychobilly|Psychobilly|Two-note riff with space (Ivy-inspired)', {
    why2: 'Fifth pass, up the neck: the riff an octave up, the ♭7 on the first string.',
    fills: [[n(0, 12, 2, 0.95), n(2, 12, 1, 0.5), n(3, 15, 3, 0.9), n(8, 22, 2, 0.9), n(10, 12, 4, 0.85)]],
  });
  // ---- surf (sixteen; A minor holds to 28) ----
  extend('surf|Surf rock|Tremolo melody (Dale-inspired)', {
    why2: 'Fifth pass, up the neck: the melody an octave up on the first string, and a tremolo-picked run from the ♭3 above the double octave down to the octave.',
    fills: [[n(0, 24, 4, 0.9, { trem: 8 }), n(4, 22, 4, 0.85, { trem: 8 }), n(8, 19, 2, 0.85, { trem: 4 }), n(10, 17, 2, 0.85, { trem: 4 }), nx(12, 12, 4, 0.9, { trem: 8 })],
            [n(0, 27, 2, 0.9, { trem: 4 }), n(2, 24, 2, 0.85, { trem: 4 }), n(4, 22, 2, 0.85, { trem: 4 }), n(6, 19, 2, 0.8, { trem: 4 }), n(8, 17, 2, 0.8, { trem: 4 }), n(10, 15, 2, 0.8, { trem: 4 }), n(12, 12, 4, 0.9, { trem: 8 })]],
  });
  extend('surf|Surf rock|Glissando riff (Chantays-inspired)', {
    why2: 'Fifth pass, up the neck: the glissando, then the answer on the top strings.',
    fillsOnStay: [[sl(0, 14, 0, 4, 0.95), s(4, 2, 0.85, 'high'), n(8, 24, 2, 0.85), n(10, 22, 2, 0.8), n(12, 19, 4, 0.85, { vib: true })]],
  });
  extend('surf|Instrumental rock|Twang melody', {
    why2: 'Fifth pass, up the neck: the melody an octave up — slid into the high root, the ♭3 above it, the 5th held with vibrato.',
    fills: [[sl(0, 22, 24, 4, 0.9, { vib: true }), n(4, 27, 2, 0.8), n(6, 24, 2, 0.8), n(8, 19, 6, 0.9, { vib: true }), n(14, 17, 2, 0.75)]],
  });
  // ---- country (sixteen; G holds to 23, Bakersfield in A to 28) ----
  extend('country|Country|Boom-chicka (Perkins-inspired)', {
    why2: 'Lead rolls: the Perkins lines on the top strings — the 6th to the root, the 3rds — while the train keeps going.',
    leads: [[s(0, 2, 0.9, 'bass', 'mute'), n(2, 21, 2, 0.75), n(4, 19, 2, 0.75), n(6, 16, 2, 0.7), s(8, 2, 0.9, 'bass', 'mute'), n(10, 14, 2, 0.75), n(12, 16, 2, 0.75), n(14, 12, 2, 0.75)],
            [d(0, 16, 19, 2, 0.8), d(2, 16, 19, 2, 0.6), d(4, 14, 19, 2, 0.75), d(6, 12, 16, 2, 0.75), n(8, 21, 2, 0.8), n(10, 19, 2, 0.75), n(12, 16, 4, 0.85, { vib: true })]],
  });
  extend("country|Country|Chicken pickin' (Rich-inspired)", {
    why2: 'Fifth pass, up the neck: the figure an octave up — the snapped notes and the 9th bent to the 3rd under the 5th, on the top strings.',
    fills: [[n(0, 16, 1, 0.9, { stacc: true }), n(1, 16, 1, 0.3, { ghost: true }), n(2, 19, 1, 0.85, { stacc: true }), n(3, 19, 1, 0.3, { ghost: true }), d(4, 14, 19, 4, 0.85, { up: 2 }), n(8, 21, 1, 0.85, { stacc: true }), n(9, 21, 1, 0.3, { ghost: true }), n(10, 19, 1, 0.8, { stacc: true }), n(11, 16, 1, 0.75), d(12, 12, 16, 4, 0.85)]],
  });
  extend('country|Country|Travis picking (Travis/Atkins-inspired)', {
    why2: 'Fifth pass, up the neck: the melody on the top two strings over the thumb.',
    fills: [[s(0, 2, 0.85, 'bass', 'mute'), n(2, 16, 2, 0.6), s(4, 2, 0.75, 'fifth', 'mute'), n(5, 19, 1, 0.55), n(6, 21, 2, 0.6), s(8, 2, 0.85, 'bass', 'mute'), n(10, 19, 2, 0.6), s(12, 2, 0.75, 'fifth', 'mute'), n(13, 16, 1, 0.55), n(14, 14, 2, 0.6)]],
  });
  extend('country|Bakersfield|Steel bends and double stops', {
    why2: 'Fifth pass, up the neck: the steel bends where a steel plays them — the 5th bent to the 6th under the high root, the 4th bent to the 5th under the 6th — and 3rds on the first two strings.',
    fills: [[n(0, 19, 2, 0.85, { stacc: true }), n(2, 21, 2, 0.75, { stacc: true }), d(4, 19, 24, 4, 0.9, { up: 2 }), n(8, 26, 2, 0.8, { stacc: true }), n(10, 28, 2, 0.75, { stacc: true }), d(12, 21, 24, 4, 0.85)]],
    fillsOnStay: [[d(0, 17, 21, 4, 0.9, { up: 2 }), d(4, 16, 19, 2, 0.8), d(6, 16, 19, 2, 0.6), n(8, 24, 4, 0.85, { vib: true }), n(12, 21, 2, 0.75), n(14, 19, 2, 0.75)]],
  });
  extend('country|Outlaw|Chicka', {
    why2: 'Fifth pass, up the neck: the chicka answered on the first string, and lead rolls — the muted single-note lines and 6ths that the phased Telecaster plays over the beat.',
    fills: [[s(0, 1, 0.9, 'bass', 'mute'), s(2, 1, 0.55, 'low', 'mute'), s(3, 1, 0.45, 'low', 'mute'), s(4, 1, 0.8, 'fifth', 'mute'), s(6, 1, 0.55, 'low', 'mute'), s(7, 1, 0.45, 'low', 'mute'), n(8, 19, 2, 0.8), n(10, 22, 2, 0.8), n(12, 19, 2, 0.8), n(14, 16, 2, 0.75)]],
    leads: [[n(0, 19, 2, 0.85, { pm: true }), n(2, 22, 2, 0.8, { pm: true }), n(4, 19, 2, 0.8, { pm: true }), n(6, 17, 2, 0.75, { pm: true }), n(8, 15, 2, 0.8, { pm: true }), n(10, 16, 2, 0.8, { pm: true }), n(12, 12, 4, 0.85)],
            [d(0, 12, 21, 2, 0.8), d(2, 12, 21, 2, 0.6), d(4, 10, 19, 2, 0.8), d(6, 10, 19, 2, 0.6), n(8, 22, 2, 0.85), n(10, 19, 2, 0.8), n(12, 16, 4, 0.85, { vib: true })]],
  });
  extend('country|Country rock|Bass-note strum', {
    why2: 'Fifth pass, up the neck: half a bar of strum, then the line on the top strings; lead rolls — double stops in 3rds and the major-pentatonic line, the second guitar\'s part.',
    fills: [[s(0, 2, 0.9, 'bass'), s(2, 2, 0.7, 'high'), s(4, 2, 0.6, 'high'), s(6, 2, 0.55, 'high'), n(8, 21, 2, 0.8), n(10, 19, 2, 0.75), n(12, 16, 2, 0.8), n(14, 14, 2, 0.75)]],
    leads: [[d(0, 16, 19, 2, 0.8), d(2, 16, 19, 2, 0.6), d(4, 14, 19, 2, 0.75), d(6, 12, 16, 2, 0.75), n(8, 19, 2, 0.8), n(10, 21, 2, 0.8), n(12, 19, 4, 0.85, { vib: true })],
            [n(0, 21, 2, 0.85), n(2, 19, 2, 0.75), n(4, 16, 2, 0.8), n(6, 14, 2, 0.75), n(8, 12, 2, 0.8), n(10, 14, 2, 0.75), n(12, 16, 4, 0.85, { vib: true })]],
  });
  extend('country|Hot country|Banjo rolls', {
    why2: 'Fifth pass, up the neck: the rolls in the chord\'s top octave.',
    fills: [[n(0, 12, 1, 0.85), n(1, 16, 1, 0.6), n(2, 19, 1, 0.7), n(3, 12, 1, 0.8), n(4, 16, 1, 0.6), n(5, 19, 1, 0.7), n(6, 21, 1, 0.8), n(7, 19, 1, 0.65), n(8, 16, 1, 0.85), n(9, 19, 1, 0.6), n(10, 21, 1, 0.7), n(11, 19, 1, 0.8), n(12, 16, 1, 0.85), n(13, 19, 1, 0.6), n(14, 21, 1, 0.7), n(15, 19, 1, 0.65)]],
  });
  extend('country|Country waltz|Bass, chord, chord', {
    why2: 'Fifth pass, up the neck: the bass note, then the melody on the top strings instead of the chords.',
    fills: [[s(0, 4, 0.9, 'bass'), n(4, 16, 2, 0.7), n(6, 19, 2, 0.7), n(8, 21, 2, 0.75), n(10, 19, 2, 0.7)]],
    fillsOnStay: [[s(0, 4, 0.9, 'bass'), s(4, 3, 0.65, 'high'), n(8, 21, 2, 0.75), n(10, 19, 2, 0.7)]],
  });
  // ---- bluegrass (sixteen; G holds to 23) ----
  extend('bluegrass|Bluegrass|Crosspicking (Watson/White-inspired)', {
    why2: 'Fifth pass, up the neck: the crosspicking in the top octave, down to the 6th and 9th.',
    fills: [[n(0, 12, 1, 0.85), n(1, 16, 1, 0.6), n(2, 19, 1, 0.7), n(3, 12, 1, 0.8), n(4, 16, 1, 0.6), n(5, 19, 1, 0.7), n(6, 21, 1, 0.8), n(7, 19, 1, 0.65), n(8, 16, 1, 0.85), n(9, 19, 1, 0.6), n(10, 21, 1, 0.7), n(11, 19, 1, 0.8), n(12, 16, 1, 0.85), n(13, 14, 1, 0.6), n(14, 12, 1, 0.7), n(15, 9, 1, 0.65)]],
  });
  extend('bluegrass|Bluegrass|Chop rhythm (Rice-inspired)', {
    why2: 'Fifth pass, up the neck: the chop, then a fiddle-tune line on the top strings.',
    fills: [[s(0, 2, 0.95, 'bass'), s(4, 0.8, 0.85, 'high', 'mute'), n(8, 19, 1, 0.8), n(9, 21, 1, 0.75), n(10, 19, 1, 0.8), n(11, 16, 1, 0.75), n(12, 14, 1, 0.8), n(13, 16, 1, 0.75), n(14, 12, 2, 0.85)]],
  });
  // ---- jazz ----
  extend('jazz|Swing|Charleston, anticipated', {
    why2: 'Fifth pass, up the neck: the Charleston, then a line on the top strings in the space after it.',
    fills: [[s(0, 2, 0.8, 'high'), s(5, 1, 0.7, 'high'), n(6, 16, 0.8, 0.8), n(7, 19, 0.8, 0.75), n(8, 21, 0.8, 0.8), n(9, 19, 0.8, 0.75), n(10, 16, 0.8, 0.8), n(11, 14, 0.8, 0.75)]],
  });
  extend('jazz|Bossa nova|The batida, two bars', {
    why2: 'Lead rolls: the thumb keeps the bass and a single line takes the top strings — 3rd, 5th, 6th, the major 7th — the melody a bossa guitarist hums over the batida.',
    leads: [[s(0, 4, 0.85, 'bass'), n(2, 16, 2, 0.65), n(4, 19, 2, 0.6), n(6, 21, 2, 0.65), s(8, 4, 0.8, 'bass'), n(10, 19, 2, 0.6), n(12, 16, 2, 0.65), n(14, 14, 2, 0.6)],
            [s(0, 4, 0.85, 'bass'), n(3, 23, 3, 0.65), n(6, 21, 2, 0.6), s(8, 4, 0.8, 'bass'), n(11, 19, 3, 0.65), n(14, 16, 2, 0.6)]],
  });
  extend('jazz|Gypsy jazz|Pompe and diminished runs', {
    why2: 'Fifth pass, up the neck: the diminished arpeggio an octave up to the ♭9 above the double octave, and a run from the double octave down over the pompe.',
    fills: [[s(0, 1.2, 0.55), s(2, 0.5, 0.3, 'high'), s(3, 1, 0.8), n(6, 16, 0.8, 0.85), n(7, 19, 0.8, 0.8), n(8, 22, 0.8, 0.85), n(9, 25, 0.8, 0.8), n(10, 22, 0.8, 0.8), n(11, 19, 0.8, 0.75)],
            [n(0, 24, 0.8, 0.9), n(1, 22, 0.8, 0.8), n(2, 19, 0.8, 0.8), n(3, 17, 0.8, 0.8), n(4, 15, 0.8, 0.8), n(5, 12, 0.8, 0.8), s(6, 1.2, 0.55), s(8, 0.5, 0.3, 'high'), s(9, 1, 0.8)]],
  });
  extend('jazz|Jazz waltz|Comp in three', {
    why2: 'Fifth pass, up the neck: the shell on one, then a line on the top strings through the bar.',
    fills: [[s(0, 1.5, 0.7, 'shell'), n(3, 16, 1, 0.7), n(4, 19, 1, 0.7), n(5, 21, 1.5, 0.75), n(6, 19, 1, 0.7), n(7, 16, 1, 0.7), n(8, 14, 1, 0.7)]],
  });
  extend('jazz|Bebop|Bebop line', {
    why2: 'Fifth pass, up the neck: the line an octave up, and a change fill that starts on the major 7th at the top of the box and comes down onto the next chord\'s 3rd.',
    fills: [[n(0, 12, 0.8, 0.85), n(2, 14, 0.8, 0.7), n(3, 16, 0.8, 0.8), n(5, 19, 0.8, 0.7), n(6, 22, 0.8, 0.8), n(8, 21, 0.8, 0.7), n(9, 19, 0.8, 0.8), n(11, 16, 0.8, 0.7)]],
    fillsOnChange: [[n(0, 23, 0.8, 0.85), n(2, 21, 0.8, 0.7), n(3, 19, 0.8, 0.8), n(5, 17, 0.8, 0.7), n(6, 16, 0.8, 0.8), n(8, 14, 0.8, 0.7), nx(9, 16, 0.8, 0.8), nx(11, 12, 0.8, 0.8)]],
  });
  extend('jazz|Jazz ballad|Chord-melody', {
    why2: 'Fifth pass, up the neck: the melody where a chord-melody keeps it — on the top two strings above the chord.',
    variants: [[s(0, 6, 0.75, 'shell', null, { add: 14 }), sl(6, 15, 16, 3, 0.7, { vib: true }), n(9, 19, 3, 0.65)]],
    fills: [[s(0, 3, 0.75, 'shell', null, { add: 14 }), n(3, 21, 3, 0.7, { vib: true }), n(6, 19, 1, 0.65), n(7, 16, 2, 0.65), n(9, 14, 3, 0.7, { vib: true })]],
  });
  extend('jazz|Samba|Partido alto', {
    why2: 'Fifth pass, up the neck: the bass notes kept, the chords replaced by a line on the top strings.',
    fills: [[s(0, 3, 0.8, 'bass'), n(3, 16, 2, 0.65), n(6, 19, 2, 0.65), s(8, 3, 0.75, 'bass'), n(11, 21, 2, 0.65), n(14, 19, 2, 0.6)]],
  });
  extend('jazz|Son montuno|Montuno', {
    why2: 'Fifth pass, up the neck: the montuno in the top octave, as a tres plays it.',
    fills: [[d(2, 12, 16, 2, 0.8), d(5, 16, 19, 1, 0.7), d(6, 12, 19, 2, 0.8), d(10, 16, 19, 2, 0.75), d(13, 14, 19, 1, 0.7), nx(14, 12, 2, 0.8, { tech: 'double', iv2: 16 })]],
  });
  extend('jazz|Soul jazz|Boogaloo comp and line', {
    why2: 'Fifth pass, up the neck: the line on the top strings — the ♭3 hammered up there, the 5th, 6th and ♭7 — and a run from the ♭7 down to the octave.',
    fills: [[s(2, 2, 0.7, 'high', null, { add: 14 }), h(6, 15, 16, 2, 0.8), n(8, 19, 2, 0.75), n(10, 21, 2, 0.7), s(12, 2, 0.7, 'high', null, { add: 14 }), n(14, 22, 2, 0.7)],
            [n(0, 22, 2, 0.8), n(2, 19, 2, 0.75), n(4, 22, 2, 0.8), n(6, 19, 2, 0.7), n(8, 17, 2, 0.75), n(10, 15, 2, 0.7), n(12, 12, 4, 0.8, { vib: true })]],
  });
  // ---- 6/8 ballad (twelve; C holds to 23) ----
  extend('ballad|6/8 ballad|6ths and triplets (soul ballad)', {
    why2: 'Fifth pass, up the neck: the 6ths on the top strings, and the melody up there answered by the root.',
    fills: [[d(0, 12, 21, 3, 0.8), d(3, 12, 21, 3, 0.55), d(6, 11, 19, 3, 0.75), d(9, 9, 17, 3, 0.7)],
            [n(0, 19, 3, 0.8, { vib: true }), n(3, 21, 1, 0.7), n(4, 19, 1, 0.7), n(5, 16, 1, 0.7), n(6, 14, 3, 0.75), n(9, 12, 3, 0.75, { vib: true })]],
  });
  // ---- reggae (sixteen; A holds to 28, Rocksteady in C to 23) ----
  extend('reggae|Reggae|Skank, tight', {
    why2: 'Lead rolls: the "pick" guitar\'s part — a muted counter-line on the top strings between the skanks, the way a second guitarist in a reggae band plays.',
    leads: [[n(0, 24, 2, 0.7, { pm: true }), n(2, 22, 2, 0.6, { pm: true }), n(4, 19, 2, 0.65, { pm: true }), n(6, 17, 2, 0.6, { pm: true }), n(8, 15, 2, 0.65, { pm: true }), n(10, 12, 2, 0.6, { pm: true }), n(12, 15, 2, 0.65, { pm: true }), n(14, 17, 2, 0.6, { pm: true })],
            [s(2, 1, 0.8, 'high', 'mute'), n(4, 24, 2, 0.7, { pm: true }), s(6, 1, 0.8, 'high', 'mute'), n(8, 22, 1, 0.65, { pm: true }), n(9, 24, 1, 0.65, { pm: true }), s(10, 1, 0.8, 'high', 'mute'), n(12, 19, 2, 0.7, { pm: true }), s(14, 1, 0.8, 'high', 'mute')]],
  });
  extend('reggae|Steppers|Skank over steppers', {
    why2: 'Lead rolls: the lead guitar over the steppers — the high root and ♭7, the 5th, held into the skank.',
    leads: [[n(0, 24, 2, 0.75), n(2, 22, 2, 0.65), n(4, 24, 2, 0.7), n(6, 19, 2, 0.65), n(8, 22, 4, 0.75), n(12, 19, 2, 0.7), n(14, 17, 2, 0.65)],
            [s(2, 1, 0.8, 'high', 'mute'), n(4, 19, 2, 0.7), s(6, 1, 0.8, 'high', 'mute'), n(8, 22, 2, 0.7), s(10, 1, 0.8, 'high', 'mute'), n(12, 24, 2, 0.75), s(14, 1, 0.8, 'high', 'mute')]],
  });
  extend('reggae|Rocksteady|3rds on the offbeat', {
    why2: 'Fifth pass, up the neck: the 3rds on the first two strings.',
    fills: [[d(2, 16, 19, 1.5, 0.75), d(6, 16, 19, 1.5, 0.75), d(10, 17, 21, 1.5, 0.7), d(14, 16, 19, 1.5, 0.75)],
            [d(2, 12, 16, 1.5, 0.75), d(6, 14, 17, 1.5, 0.7), d(10, 16, 19, 1.5, 0.75), d(14, 17, 21, 1.5, 0.7)]],
  });
  // ---- ska (C holds to 23) ----
  extend('ska|Ska|Chunk and upstroke', {
    why2: 'Lead rolls: the horn line on the guitar — the 5th, 6th, 3rd and 9th on the top strings — between the upstrokes.',
    leads: [[n(0, 19, 2, 0.85), n(2, 21, 2, 0.8), n(4, 19, 2, 0.8), n(6, 16, 2, 0.8), n(8, 14, 2, 0.8), n(10, 16, 2, 0.8), n(12, 12, 4, 0.85)],
            [g(0, 1, 0.3, 'low'), s(2, 1, 0.8, 'high', 'mute'), n(4, 21, 2, 0.8), n(6, 19, 2, 0.8), s(10, 1, 0.8, 'high', 'mute'), n(12, 16, 2, 0.8), n(14, 19, 2, 0.8)]],
  });
  extend('ska|Ska (Jamaican)|Swung upstrokes', {
    why2: 'Lead rolls: the Ranglin line on the top strings, swung, between the upstrokes.',
    leads: [[n(0, 19, 0.8, 0.85), n(2, 21, 0.8, 0.8), n(3, 19, 0.8, 0.8), n(5, 16, 0.8, 0.8), n(6, 14, 0.8, 0.8), n(8, 16, 0.8, 0.8), n(9, 12, 2.4, 0.85)],
            [s(2, 0.8, 0.8, 'high', 'mute'), n(3, 16, 0.8, 0.8), n(5, 19, 0.8, 0.8), s(8, 0.8, 0.8, 'high', 'mute'), n(9, 21, 0.8, 0.8), n(11, 19, 0.8, 0.8)]],
  });
  // ---- soul (A holds to 28; Neo-soul in E minor to 23) ----
  extend('soul|Soul|6ths and muted backbeat', {
    why2: 'Fifth pass, up the neck: the 6ths on the first and third strings, where Cropper slides them, up to the high root.',
    fills: [[d(0, 16, 24, 3, 0.8), s(4, 1, 0.55, 'high', 'mute'), d(8, 14, 23, 3, 0.75), s(12, 1, 0.55, 'high', 'mute'), n(14, 12, 2, 0.6)],
            [d(0, 12, 21, 3, 0.8), d(4, 14, 23, 3, 0.7), d(8, 16, 24, 4, 0.8), n(12, 22, 2, 0.7), n(14, 24, 2, 0.75)]],
  });
  extend('soul|Sweet soul|Rolling hammer-ons', {
    why2: 'Fifth pass, up the neck: the rolling hammer-ons on the top strings, up to the double octave.',
    fills: [[h(0, 14, 15, 2, 0.75), n(2, 19, 2, 0.6), h(4, 17, 19, 2, 0.75), n(6, 24, 2, 0.6), h(8, 14, 15, 2, 0.75), n(10, 19, 2, 0.6), d(12, 15, 24, 4, 0.75)]],
  });
  extend('soul|Neo-soul|Swung arpeggios', {
    why2: 'Fifth pass, up the neck: the arpeggio through the top of the box — 5th, ♭7, 4th, ♭3, 9th.',
    fills: [[n(0, 12, 2, 0.7), n(2, 19, 2, 0.55), n(3, 22, 1, 0.55), n(4, 19, 4, 0.65), n(8, 17, 2, 0.6), n(10, 15, 2, 0.55), n(11, 14, 1, 0.5), n(12, 12, 4, 0.65)]],
  });
  // ---- pop (C holds to 23; 80s in C♯ minor to 23) ----
  extend('pop|Pop|Strum with chucks', {
    why2: 'Lead rolls: the hook on the top strings over the strum, the second guitar\'s job in a pop band.',
    leads: [[n(0, 19, 2, 0.8), n(2, 21, 2, 0.7), n(4, 19, 4, 0.8), n(8, 16, 2, 0.7), n(10, 14, 2, 0.75), n(12, 12, 4, 0.75)],
            [s(0, 4, 0.85), n(4, 16, 2, 0.7), n(6, 19, 2, 0.7), n(8, 21, 4, 0.8), n(12, 19, 2, 0.7), n(14, 16, 2, 0.7)]],
  });
  extend('pop|Pop|The hook', {
    why2: 'Fifth pass, up the neck: the hook in the top octave.',
    fills: [[n(0, 16, 2, 0.8), n(2, 19, 2, 0.7), n(4, 21, 4, 0.8), n(8, 19, 2, 0.7), n(10, 16, 2, 0.75), n(12, 14, 4, 0.75)]],
  });
  extend('pop|80s pop|Add9 arpeggio', {
    why2: 'Fifth pass, up the neck: the arpeggio in the top octave with the 9th on top.',
    fills: [[n(0, 12, 2, 0.8), n(2, 19, 2, 0.65), n(4, 22, 2, 0.7), n(6, 19, 2, 0.65), n(8, 14, 2, 0.8), n(10, 19, 2, 0.65), n(12, 22, 2, 0.7), n(14, 19, 2, 0.65)]],
  });
  extend('pop|Acoustic pop|Percussive strum', {
    why2: 'Lead rolls: the hammered lines on the top strings an acoustic player puts between the strums.',
    leads: [[s(0, 4, 0.85), n(4, 16, 2, 0.7), n(6, 19, 2, 0.7), n(8, 21, 2, 0.75), n(10, 19, 2, 0.7), h(12, 14, 16, 2, 0.7), n(14, 12, 2, 0.7)],
            [n(0, 19, 2, 0.8), h(2, 14, 16, 2, 0.7), n(4, 19, 2, 0.75), n(6, 21, 2, 0.75), s(8, 4, 0.8), n(12, 16, 2, 0.7), n(14, 14, 2, 0.7)]],
  });
  // ---- funk (E holds to 23; Disco and Minneapolis in A to 28) ----
  extend('funk|Classic funk|Chicken scratch', {
    why2: 'Lead rolls: the single-note funk line on the top strings, muted, in the bar the scratch would fill.',
    leads: [[n(0, 19, 1, 0.8, { pm: true }), n(2, 22, 1, 0.75, { pm: true }), n(3, 19, 1, 0.75, { pm: true }), n(6, 17, 1, 0.75, { pm: true }), n(8, 15, 1, 0.8, { pm: true }), n(10, 12, 1, 0.7, { pm: true }), n(11, 15, 1, 0.7, { pm: true }), n(14, 17, 1, 0.75, { pm: true })],
            [s(0, 2, 0.85, 'high'), n(4, 22, 1, 0.8, { pm: true }), n(6, 19, 1, 0.75, { pm: true }), n(7, 22, 1, 0.7, { pm: true }), s(8, 1, 0.5, 'high', 'mute'), n(10, 19, 1, 0.75, { pm: true }), n(12, 17, 1, 0.75, { pm: true }), n(14, 15, 2, 0.8)]],
  });
  extend('funk|Classic funk|Unison riff (Nocentelli-inspired)', {
    why2: 'Fifth pass, up the neck: the riff an octave up.',
    fills: [[n(0, 12, 1, 0.9, { pm: true }), n(2, 12, 1, 0.55, { pm: true }), n(3, 22, 1, 0.75, { pm: true }), n(6, 19, 1, 0.75, { pm: true }), n(8, 12, 1, 0.85, { pm: true }), n(10, 15, 1, 0.7, { pm: true }), n(11, 17, 1, 0.75, { pm: true }), n(14, 22, 2, 0.8)]],
  });
  extend('funk|Disco|The chuck', {
    why2: 'Lead rolls: the single-note fills Rodgers plays between chucks — muted, on the top strings, the high root said twice.',
    leads: [[n(0, 24, 1, 0.8, { pm: true }), n(2, 24, 1, 0.6, { pm: true }), n(3, 22, 1, 0.75, { pm: true }), n(4, 24, 1, 0.8, { pm: true }), n(6, 19, 1, 0.7, { pm: true }), n(8, 22, 1, 0.8, { pm: true }), n(10, 19, 1, 0.7, { pm: true }), n(11, 17, 1, 0.7, { pm: true }), n(12, 19, 2, 0.8, { pm: true }), n(14, 15, 2, 0.75, { pm: true })],
            [s(2, 2, 0.8, 'high'), n(4, 24, 1, 0.8, { pm: true }), n(5, 22, 1, 0.7, { pm: true }), s(6, 2, 0.8, 'high'), n(8, 19, 1, 0.75, { pm: true }), n(9, 22, 1, 0.7, { pm: true }), s(10, 2, 0.8, 'high'), n(12, 24, 2, 0.8), s(14, 2, 0.8, 'high')]],
  });
  extend('funk|New Orleans funk|Riff in unison with the bass', {
    why2: 'Fifth pass, up the neck: the riff an octave up, the way the Meters answer it.',
    fills: [[n(0, 12, 2, 0.9, { pm: true }), n(3, 22, 1, 0.7, { pm: true }), n(6, 19, 2, 0.75, { pm: true }), n(8, 12, 2, 0.85, { pm: true }), n(11, 15, 1, 0.7, { pm: true }), n(12, 17, 2, 0.75, { pm: true }), n(14, 12, 2, 0.8, { pm: true })]],
  });
  extend('funk|Minneapolis|Triad stabs', {
    why2: 'Lead rolls: the lead line on the first string over the stabs — high root, the ♭3 and 9th above it.',
    leads: [[n(0, 24, 1, 0.85), n(2, 27, 1, 0.8), n(4, 24, 1, 0.8), n(6, 22, 1, 0.75), n(8, 19, 2, 0.8), n(10, 22, 2, 0.75), n(12, 24, 4, 0.85, { vib: true })],
            [s(0, 2, 0.85, 'high'), n(6, 26, 1, 0.8), n(7, 24, 1, 0.75), s(8, 2, 0.8, 'high'), n(12, 22, 2, 0.8), n(14, 19, 2, 0.75)]],
  });
  extend('funk|Afrobeat|Ostinato', {
    why2: 'Fifth pass, up the neck: the ostinato an octave up, on the top strings.',
    fills: [[n(0, 12, 1, 0.8, { pm: true }), n(3, 15, 1, 0.7, { pm: true }), n(6, 17, 1, 0.7, { pm: true }), n(9, 19, 1, 0.7, { pm: true }), n(11, 17, 1, 0.65, { pm: true }), n(14, 15, 1, 0.7, { pm: true })]],
  });
  extend('funk|Steady motor|Rhythm within the rhythm', {
    why2: 'Lead rolls: the sixteenth-note lines Wong plays between the chords, on the top strings.',
    leads: [[n(0, 16, 1, 0.8), n(1, 19, 1, 0.7), n(2, 21, 1, 0.75), n(3, 19, 1, 0.7), n(4, 16, 1, 0.8), n(6, 14, 1, 0.7), n(7, 12, 1, 0.75), n(8, 16, 1, 0.8), n(10, 19, 1, 0.75), n(11, 21, 1, 0.75), n(12, 22, 2, 0.8), n(14, 19, 2, 0.75)],
            [s(0, 2, 0.85, 'high'), n(2, 21, 1, 0.75), n(3, 19, 1, 0.7), s(4, 2, 0.7, 'high'), n(6, 16, 1, 0.75), n(7, 19, 1, 0.7), s(8, 2, 0.8, 'high'), n(10, 21, 1, 0.75), n(11, 22, 1, 0.7), s(12, 2, 0.7, 'high'), n(14, 19, 2, 0.75)]],
  });
  // ---- metal (E holds to 23) ----
  extend('metal|Metal|Pedal riff (♭2 and ♭5)', {
    why2: 'Fifth pass, up the neck: the harmony-lead melody on the top strings over the pedal — 5th, ♭7, ♭3 held, the ♭2 back down onto the root.',
    fills: [[n(0, 19, 4, 0.9, { vib: true }), n(4, 22, 2, 0.85), n(6, 19, 2, 0.8), n(8, 15, 4, 0.85, { vib: true }), n(12, 13, 2, 0.8, { pm: true }), n(14, 12, 2, 0.85, { pm: true })]],
  });
  extend('metal|Doom|Tritone riff (Iommi-inspired)', {
    why2: 'Fifth pass, up the neck: the ♭3 bent a tone and the ♭7 bent to the root, at the top of the box, shaken — the fill between riffs.',
    fills: [[b(0, 15, 2, 6, 0.95, { vib: true }), n(6, 12, 2, 0.85), b(8, 22, 2, 8, 0.95, { vib: true })]],
  });
  extend('metal|Thrash|Downpicked eighths', {
    why2: 'Lead rolls: a pentatonic run from the ♭7 at the top of the box, in sixteenths, and half a bar of chug into the high bend.',
    leads: [[n(0, 22, 1, 0.9), n(1, 19, 1, 0.8), n(2, 17, 1, 0.8), n(3, 15, 1, 0.8), n(4, 12, 1, 0.85), n(5, 15, 1, 0.8), n(6, 17, 1, 0.8), n(7, 19, 1, 0.8), n(8, 22, 1, 0.9), n(9, 19, 1, 0.8), n(10, 17, 1, 0.8), n(11, 15, 1, 0.8), n(12, 12, 4, 0.9, { vib: true })],
            [s(0, 2, 0.95, 'low'), s(2, 1.6, 0.7, 'bass', 'mute'), s(4, 1.6, 0.75, 'bass', 'mute'), s(6, 1.6, 0.7, 'bass', 'mute'), n(8, 19, 2, 0.9), n(10, 22, 2, 0.85), b(12, 22, 2, 4, 0.95, { vib: true })]],
  });
  extend('metal|Breakdown|Chords on the kick', {
    why2: 'Lead rolls: the high notes over the chugs — the ♭7 and ♭2 above the octave, the ♭5 held — the dissonance a breakdown wants on top.',
    leads: [[s(0, 2, 0.95, 'low'), s(3, 2, 0.9, 'low'), n(6, 22, 2, 0.9, { vib: true }), n(8, 25, 2, 0.85), s(10, 2, 0.9, 'low'), b(12, 22, 2, 4, 0.95, { vib: true })],
            [n(0, 19, 4, 0.9, { vib: true }), s(4, 1, 0.5, 'bass', 'mute'), s(5, 1, 0.5, 'bass', 'mute'), n(6, 22, 2, 0.9), n(8, 18, 4, 0.9, { vib: true }), s(12, 2, 0.95, 'low'), s(14, 2, 0.9, 'low')]],
  });
  // ---- simple (C holds to 23) ----
  extend('simple|Simple|Arpeggio study', {
    why2: 'Fifth pass: the scale itself, the whole box — up from the root to the octave in one bar, and down from the top of the box to the 7th below the octave in the other.',
    fills: [[n(0, 0, 2, 0.8), n(2, 2, 2, 0.75), n(4, 4, 2, 0.75), n(6, 5, 2, 0.75), n(8, 7, 2, 0.75), n(10, 9, 2, 0.75), n(12, 11, 2, 0.75), n(14, 12, 2, 0.8)],
            [n(0, 23, 2, 0.8), n(2, 21, 2, 0.75), n(4, 19, 2, 0.75), n(6, 17, 2, 0.75), n(8, 16, 2, 0.75), n(10, 14, 2, 0.75), n(12, 12, 2, 0.8), n(14, 11, 2, 0.7)]],
  });
  // ---- lead rolls for the chord parts of the earlier passes ----
  extend('blues|Blues shuffle|Upbeat chops (the second guitar)', {
    why2: 'Lead rolls: the second guitar takes a chorus in the B.B. box.',
    leads: [[n(0, 24, 2.4, 0.9, { vib: true }), n(3, 22, 0.8, 0.75), n(4, 19, 0.8, 0.7), n(5, 22, 0.8, 0.75), n(6, 24, 3, 0.85, { vib: true }), n(9, 21, 0.8, 0.7), n(10, 19, 0.8, 0.7), n(11, 17, 0.8, 0.7)],
            [b(0, 26, 2, 2.4, 0.9, { vib: true }), n(3, 24, 0.8, 0.75), n(4, 21, 0.8, 0.7), n(5, 24, 1.6, 0.8), n(7, 22, 0.8, 0.7), n(8, 19, 2.4, 0.85, { vib: true })]],
  });
  extend('rock|Rock|Chords with space (Young-inspired)', {
    why2: 'Lead rolls: the other Young — the pentatonic lead on the top strings, the unison bend, the high root shaken.',
    leads: [[n(0, 24, 2, 0.9, { rake: true }), n(2, 22, 2, 0.8), n(4, 19, 2, 0.8), n(6, 22, 2, 0.8), n(8, 24, 4, 0.9, { vib: true }), d(12, 17, 19, 4, 0.9, { up: 2, vib: true })],
            [d(0, 17, 19, 4, 0.9, { up: 2 }), n(4, 19, 2, 0.8), n(6, 17, 2, 0.8), n(8, 15, 2, 0.8), n(10, 12, 2, 0.8), b(12, 15, 2, 4, 0.9, { vib: true })]],
  });
  extend('rock|Straight rock|Eighth-note chug, muted', {
    why2: 'Lead rolls: the riff on the top strings and the high bend, where the lead guitar would double the chug.',
    leads: [[n(0, 22, 2, 0.9), n(2, 22, 2, 0.6), n(4, 19, 2, 0.85), n(6, 17, 2, 0.8), n(8, 15, 2, 0.85), n(10, 17, 2, 0.8), n(12, 19, 4, 0.9, { vib: true })],
            [d(0, 17, 19, 4, 0.9, { up: 2, vib: true }), n(4, 19, 2, 0.8), n(6, 22, 2, 0.85), b(8, 22, 2, 8, 0.9, { vib: true })]],
  });
  extend("rock|Bo Diddley beat|The clave strum", {
    why2: 'Lead rolls: the clave kept in muted scratches with the lead on the first string over it.',
    leads: [[n(0, 19, 2, 0.85), g(2, 1, 0.3), g(4, 1, 0.3), n(6, 22, 2, 0.85), g(8, 1, 0.3), g(10, 1, 0.3), n(12, 19, 2, 0.85), n(14, 17, 2, 0.8)],
            [n(0, 22, 2, 0.9, { vib: true }), g(2, 1, 0.3), n(4, 19, 2, 0.85), g(6, 1, 0.3), n(8, 17, 2, 0.85), g(10, 1, 0.3), g(12, 1, 0.3), n(14, 15, 2, 0.8)]],
  });
  extend('rock|Punk|Downstrokes', {
    why2: 'Lead rolls: the octave riff and the pentatonic lead on the top strings that the second guitar plays over the power chords.',
    leads: [[d(0, 0, 12, 2, 0.9), d(2, 0, 12, 2, 0.8), d(4, 0, 12, 2, 0.85), d(6, 0, 12, 2, 0.8), d(8, 5, 17, 2, 0.9), d(10, 5, 17, 2, 0.8), d(12, 7, 19, 2, 0.9), d(14, 7, 19, 2, 0.8)],
            [n(0, 24, 2, 0.9), n(2, 22, 2, 0.85), n(4, 19, 2, 0.85), n(6, 22, 2, 0.8), n(8, 24, 2, 0.9), n(10, 22, 2, 0.85), n(12, 19, 4, 0.9, { vib: true })]],
  });
  extend('rock|Crazy Horse stomp|Four quarters', {
    why2: 'Lead rolls: the one-note solo takes the bar — the ♭7 bent and shaken, the 5th, the 4th.',
    leads: [[b(0, 22, 2, 8, 0.95, { vib: true }), n(8, 19, 4, 0.9, { vib: true }), n(12, 17, 4, 0.85)],
            [n(0, 19, 4, 0.95, { vib: true }), b(4, 22, 2, 8, 0.95, { vib: true }), n(12, 19, 4, 0.9, { vib: true })]],
  });
  extend('rock|Heartland|Sus strum', {
    why2: 'Lead rolls: the electric\'s double stops and lines on the top strings while the acoustic keeps the strum.',
    leads: [[d(0, 16, 19, 2, 0.8), d(2, 16, 19, 2, 0.6), d(4, 14, 19, 2, 0.75), d(6, 12, 16, 4, 0.8), n(10, 19, 2, 0.8), n(12, 21, 4, 0.85, { vib: true })],
            [n(0, 21, 2, 0.85), n(2, 19, 2, 0.75), n(4, 16, 4, 0.8), n(8, 19, 2, 0.8), n(10, 21, 2, 0.75), n(12, 19, 4, 0.85, { vib: true })]],
  });

  // =========================================================================
  // SIXTH PASS — the fingerpicked parts, as a hand fingerpicks them (marked
  // `fingers`, so the realizer keeps the fingers off the thumb's strings). Measured
  // on the page, two thirds of the finger notes in these parts were landing
  // on the A and D strings, under or beside the thumb, because their
  // intervals were written in the root's octave; the fingers play the treble
  // strings, an octave up. And a dead thumb is the root on every beat, by
  // definition: no alternating 5th, no walk-up on the low string — the walk
  // moves to the fingers over the thumb.
  function liftFingers(key, grid, thumb){
    const pt = parts[key];
    if (!pt){ missing.push(key); return; }
    const beats = grid === 12 ? [0, 3, 6, 9] : [0, 4, 8, 12];
    const lift = bar => {
      const fingers = bar.filter(w => !w.strum);
      if (!fingers.length) return;
      const top = Math.max(...fingers.map(w => Math.max(w.iv, w.iv2 == null ? -99 : w.iv2)));
      if (top > 14) return;                              // written for the top strings already
      bar.forEach(w => {
        if (w.strum) return;
        if (w.iv < 0 && !thumb) return;                  // an alternating thumb's walk stays in the bass
        w.iv += 12;
        if (w.iv2 != null) w.iv2 += 12;
        if (w.from != null) w.from += 12;
      });
    };
    const steady = bar => {
      bar.forEach(w => { if (w.strum && w.voicing === 'fifth') w.voicing = 'bass'; });
      beats.forEach(b => {
        if (!bar.some(w => w.strum && Math.abs(w.at - b) < 1e-9)) bar.push({ at: b, dur: grid === 12 ? 1.4 : 2, vel: 0.8, strum: true, voicing: 'bass', mute: true });
      });
      bar.sort((a, b) => a.at - b.at);
    };
    const walk = (obj) => {
      ['figure', 'turnaround'].forEach(k => { if (obj[k]){ lift(obj[k]); if (thumb) steady(obj[k]); } });
      ['variants', 'fills', 'fillsOnChange', 'fillsOnStay', 'tails', 'pickups', 'stops', 'turnarounds', 'leads'].forEach(k => (obj[k] || []).forEach(bar => { lift(bar); if (thumb) steady(bar); }));
    };
    walk(pt);
    if (pt.easy) walk(pt.easy);
    // and the realizer keeps the fingers off whatever strings the thumb takes in a bar
    pt.fingers = true;
    pt.why = (pt.why || '') + (thumb
      ? ' Sixth pass: the thumb on the root on every beat, nothing else on the bass strings; the fingers an octave up, on the treble strings, where they are.'
      : ' Sixth pass: the fingers an octave up, on the treble strings, where a fingerpicking hand has them; the thumb alone on the bass strings.');
  }
  liftFingers('blues|Delta fingerstyle|Dead thumb and fills', 12, true);
  liftFingers('rockabilly|Rockabilly|Dead thumb and licks (Moore-inspired)', 12, true);
  liftFingers('rockabilly|Rockabilly|Boom-chick, corrected', 12, false);
  liftFingers('country|Country|Travis picking (Travis/Atkins-inspired)', 16, false);
  liftFingers('psychobilly|Psychobilly|Travis at speed (Heath-inspired)', 16, false);
  liftFingers('jazz|Bossa nova|The batida, two bars', 16, false);
  liftFingers('jazz|Samba|Partido alto', 16, false);
  liftFingers('jazz|Jazz ballad|Chord-melody', 12, false);
  liftFingers('simple|Simple|Arpeggio study', 16, false);

  // engine proposals that came out of these passes
  GT.review.engine.push(
    { id: 'pairs', title: 'Double stops placed by shape', demo: true,
      why: '<p>The app places each note of a double stop by pitch alone, so a 3rd can land two strings apart and a 6th on adjacent strings. Measured over every card, a third of the octave pairs and a scatter of 3rds and 5ths were off their shape. A hand plays 2nds to 5ths on adjacent strings, 6ths, 7ths and octaves with a string skipped, 10ths with two — and the boogie\'s root-and-6th adjacent, as a stretch. This page now keeps the written interval and picks the strings that way; the app would do the same in parts.js.</p>' },
    { id: 'power', title: 'A power-chord voicing', demo: true,
      why: '<p>"Low" takes the bottom three strings of whatever grip the box has, which for the E and A shapes is a power chord and for the C and G shapes is not. Punk, thrash, doom and half-time rock want the root, 5th and octave and no 3rd wherever the box sits. The page gives strums a "power" voicing built from the window — the root on the lowest string that has it, the 5th on the next string up, the octave above that — and the punk part uses it.</p>' },
    { id: 'leads', title: 'Lead rolls', demo: true,
      why: '<p>The chord parts — punk, the chuck, the scratch, the skank, the clave, the chops — were all rhythm on every roll. A part may now carry lead lines, and about a third of rolls put them in the fill bars, so the same part is the rhythm guitar on one roll and the lead guitar on the next; the roll counter says which. In the app, "New fills" would do the same, and a checkbox could hold it on or off.</p>' },
  );

  if (missing.length) console.warn('proposals-more: no part for', missing);
  GT.reviewMore = { missing };
})();
