// What is proposed for every style, and what is proposed to add — the
// content the review page plays beside what the app has now. Nothing here
// runs in the app. The band patterns take the same shape as audio.js's
// STYLES variants, plus the fields the page's player understands (ghost,
// hatOpen, rim, fill, bassApproach, compAnticipate, swing, beats, slapback,
// snareVels/kickVels, bass entries with next:true); the parts take the same
// shape as parts.js's, plus the flags the page's realiser understands
// (fillsOnChange, fillsOnStay, turnaround; ghost, stacc, pm, vib, trem,
// rake, chordSlide, add, voicing 'shell', a bend on a double stop).
//
// Every artist and record named is a reference point for the STYLE — how
// its players place the weight, which strings and which notes — and no
// part is a transcription or a paraphrase of a line anyone owns. Where a
// sub-style is "inspired by" a player, that means their way of playing, in
// the general terms a method book would use for it.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const n  = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, ...(x || {}) });
  const nx = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, next: true, ...(x || {}) });
  const s  = (at, dur, vel, voicing, mute, x) => ({ at, dur, vel, strum: true, voicing: voicing || 'full', mute: mute === 'mute', ...(x || {}) });
  const g  = (at, dur, vel, voicing) => s(at, dur, vel, voicing || 'high', null, { ghost: true });   // a muted scratch
  const d  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'double', ...(x || {}) });
  const b  = (at, iv, up, dur, vel, x) => ({ at, iv, up, dur, vel, tech: 'bend', ...(x || {}) });
  const h  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'hammer', ...(x || {}) });
  const p  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'pull', ...(x || {}) });
  const sl = (at, from, iv, dur, vel, x) => ({ at, iv, from, dur, vel, tech: 'slide', ...(x || {}) });
  // an eighth-note chug for a 16 grid: slots 0,2,4...14, accents on the beats
  const chug = (voicing, mute, on = 0.85, off = 0.55) => [0, 2, 4, 6, 8, 10, 12, 14].map(k => s(k, 1.8, k % 4 === 0 ? on : off, voicing, mute));
  // a shuffle chug for a 12 grid: down on the first triplet, up on the third
  const shuffle = (fn) => [0, 2, 3, 5, 6, 8, 9, 11].map(k => fn(k, k % 3 === 0));

  const genres = [];

  // =========================================================================
  genres.push({
    id: 'blues', name: 'Blues',
    research: `
      <p><b>What the players actually do.</b> The Chicago shuffle is a two-guitar music: Jimmy Reed's records ("Baby What You Want Me to Do", "Bright Lights, Big City") and Muddy Waters' band with Jimmy Rogers put one guitar on the low-string <em>5–6 boogie</em> — the root with the 5th, then the root with the 6th, two strings, palm-muted — and the other on short chord chops on the shuffle upbeats. The Texas shuffle (Stevie Ray Vaughan's "Pride and Joy", Freddie King's "Hide Away") does both at once in one hand: the bass note on the beat, a muted rake across the chord on the upbeat, dynamic and hard. Slow blues in 12/8 (B.B. King's "The Thrill Is Gone" and "Sweet Little Angel", Albert King's "As the Years Go Passing By", T-Bone Walker's "Stormy Monday") is one idea a bar — a note bent and shaken with vibrato, a 9th chord slid in from a half-step below, a triplet pickup into the change, and silence. Jump blues (Louis Jordan's "Caldonia" and "Choo Choo Ch'Boogie", T-Bone's "T-Bone Shuffle") <em>swings</em>: a walking bass, a hard 2 and 4, 9th-chord stabs punched like a horn section and pushed on the "and of 4". John Lee Hooker ("Boogie Chillen", "Boom Boom") is one chord, a foot stomp and a root pedal with the ♭3 hammered on top; Delta blues (Robert Johnson, Son House) is a thumb keeping a dead, muted bass on every beat while the fingers play the fills and the descending turnaround.</p>
      <p><b>The upper register.</b> The lines in a blues band's guitar live as much on the top strings as on the low ones, and the players who defined them went high. B.B. King's box is the top three strings around the root on the B string: the 9th bent up to the ♭3 and the ♭3 to the 3rd, the 6th as the sweet note, the root held with the shake — the box that "The Thrill Is Gone" and "Sweet Little Angel" are played from. Albert King's box is the pentatonic shape above the root, and what he does in it is bend: a step, a step and a half, two whole steps from one finger, bends stacked one after another ("Born Under a Bad Sign", "Crosscut Saw"). Freddie King plays in the treble with a thumb pick and a finger pick — sixths walked down the top strings, pre-bends released, short vocal phrases with space ("Hide Away", "The Stumble") — and Stevie Ray Vaughan runs the Texas box down from its top string. In the parts, this is the octave and above: 17 the 4th, 19 the 5th, 22 the ♭7, 24 the root, 26 and 27 the 9th and ♭3 above it, bent to the 3rd.</p>
      <p><b>What the app has now, and what is off about it.</b> The shuffle comp strums three strings on every shuffle eighth — a strum, where the idiom is a two-note boogie. The fills are single-note lines every other bar; a rhythm player fills at the <em>changes</em> and the <em>turnaround</em>, and mostly with the ♭3-to-3, repeated notes and space. Slow blues has no 9th-chord slides and no vibrato. Jump blues is written straight, and it swings. Nothing knows whether the next bar changes chord.</p>`,
    existing: [
      {
        style: 'blues', label: 'Blues shuffle',
        verdict: `<p>Band: the kit gets a ride shuffle with the hi-hat foot on 2 and 4 and a ghost snare on the swung upbeat before 4; the bass approaches every change from a semitone below; a drum fill leads back to the top of the form. Guitar: the 5–6 boogie in double stops replaces the three-string strums, the upbeat chops become a part of their own (the second guitar), and every fill knows whether the chord is changing — a walk-up into a change, the ♭7 push when it isn't — with a proper turnaround on the last bar.</p>`,
        band: { ride: [0, 2, 3, 5, 6, 8, 9, 11], hat: [3, 9], ghost: [8], bassApproach: true, fill: { snare: [6, 8, 9, 10, 11], kick: [0, 3] } },
        parts: [
          {
            name: '5–6 boogie', replaces: 'Shuffle comp',
            why: 'The root with the 5th, the root with the 6th — two strings, the way Reed and Rogers play it — with the ♭7 on the way back down. Palm-muted. In the Chords reading the 6th snaps to the 5th and it becomes the root-5th chug; in Pentatonic the ♭7 arrives.',
            figure: [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
                     d(6, 0, 7, 1.6, 0.85, { pm: true }), d(8, 0, 7, 0.8, 0.5, { pm: true }), d(9, 0, 9, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
            variants: [
              // up to the ♭7 and back: 5 5 6 6 ♭7 ♭7 6 6
              [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
               d(6, 0, 10, 1.6, 0.85, { pm: true }), d(8, 0, 10, 0.8, 0.5, { pm: true }), d(9, 0, 9, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
              // the whole chord on one, then the boogie
              [s(0, 1.6, 0.9), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
               d(6, 0, 7, 1.6, 0.85, { pm: true }), d(8, 0, 7, 0.8, 0.5, { pm: true }), d(9, 0, 9, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
            ],
            fills: [
              [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
               h(6, 3, 4, 2.4, 0.85), n(9, 0, 1.6, 0.8), n(11, 0, 0.8, 0.5)],
            ],
            // into a change: half a bar of boogie, then the bass walks up to the next root
            fillsOnChange: [
              [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
               nx(6, -5, 1.6, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.6, 0.8, { pm: true }), nx(11, -1, 0.8, 0.8, { pm: true })],
              [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(6, 0, 10, 1.6, 0.85, { pm: true }),
               nx(9, 4, 1.6, 0.8), nx(11, 7, 0.8, 0.7)],
            ],
            // staying put: the ♭7 pushed, or the ♭3 hammered on top of the boogie
            fillsOnStay: [
              [d(0, 0, 7, 1.6, 0.85, { pm: true }), d(2, 0, 7, 0.8, 0.5, { pm: true }), d(3, 0, 9, 1.6, 0.8, { pm: true }), d(5, 0, 9, 0.8, 0.5, { pm: true }),
               d(6, 0, 10, 1.6, 0.85, { pm: true }), d(8, 0, 9, 0.8, 0.6, { pm: true }), d(9, 0, 7, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
              [h(0, 3, 4, 1.6, 0.85), n(2, 0, 0.8, 0.6), h(3, 3, 4, 1.6, 0.85), n(5, 0, 0.8, 0.6),
               d(6, 0, 7, 1.6, 0.85, { pm: true }), d(8, 0, 7, 0.8, 0.5, { pm: true }), d(9, 0, 9, 1.6, 0.8, { pm: true }), d(11, 0, 9, 0.8, 0.5, { pm: true })],
            ],
            // the last bar of the form: the walk-down in 6ths over the root, then the V from above
            turnaround: [d(0, 10, 12, 1.6, 0.85), d(2, 10, 12, 0.8, 0.5), d(3, 9, 12, 1.6, 0.8), d(5, 9, 12, 0.8, 0.5),
                         d(6, 7, 12, 1.6, 0.8), n(8, 7, 0.8, 0.5), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.85)],
          },
          {
            name: 'Upbeat chops (the second guitar)',
            why: 'What the other guitar in a Reed band plays: the chord on the shuffle upbeats only, on the top strings, short. One fill is the T-Bone move — a 9th chord slid in from a half-step below — which needs chord slides and a colour tone on a strum.',
            figure: [s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), s(8, 0.8, 0.65, 'high'), s(11, 0.8, 0.65, 'high')],
            variants: [
              [g(0, 0.5, 0.3), s(2, 0.8, 0.65, 'high'), g(3, 0.5, 0.3), s(5, 0.8, 0.65, 'high'), g(6, 0.5, 0.3), s(8, 0.8, 0.65, 'high'), g(9, 0.5, 0.3), s(11, 0.8, 0.65, 'high')],
              [s(0, 1.6, 0.8, 'high'), s(2, 0.8, 0.5, 'high'), s(5, 0.8, 0.65, 'high'), s(8, 0.8, 0.65, 'high'), s(11, 0.8, 0.65, 'high')],
            ],
            fills: [
              [s(0, 2.4, 0.85, 'high', null, { chordSlide: 1, add: 14 }), s(5, 0.8, 0.6, 'high'), s(8, 0.8, 0.6, 'high'), s(11, 0.8, 0.6, 'high')],
            ],
            fillsOnChange: [
              [s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), n(6, 10, 0.8, 0.8), n(8, 10, 0.8, 0.5), nx(9, 4, 1.6, 0.8, { vib: true }), nx(11, 7, 0.8, 0.6)],
            ],
            fillsOnStay: [
              [s(2, 0.8, 0.65, 'high'), s(5, 0.8, 0.65, 'high'), s(8, 0.8, 0.65, 'high'), n(9, 3, 0.8, 0.75), n(10, 4, 0.8, 0.8), n(11, 7, 0.8, 0.75)],
            ],
            turnaround: [s(0, 1.6, 0.8, 'high'), s(2, 0.8, 0.5, 'high'), s(3, 1.6, 0.75, 'high'), s(6, 2.4, 0.8, 'high', null, { chordSlide: -1 }), nx(9, 0, 2.4, 0.85, { chordSlide: 1 })],
          },
          {
            name: 'Stabs and licks', replaces: 'Stabs and licks',
            why: 'Kept, but the licks are now blues licks: the ♭3 hammered to the 3, a note said twice with a rake into it, the 4th bent to the 5th and shaken, the ♭5 as a passing note — and space. The change fill resolves the ♭7 onto the next 3rd; the turnaround is the walk-down.',
            figure: [s(0, 2.4, 0.85, 'high'), h(3, 3, 4, 1.6, 0.8), n(5, 0, 0.8, 0.6), s(6, 2.4, 0.8, 'high'), n(9, 7, 1.6, 0.8, { rake: true }), n(11, 5, 0.8, 0.6)],
            variants: [
              [s(0, 2.4, 0.85, 'high'), b(3, 5, 2, 2.4, 0.85, { vib: true }), s(6, 2.4, 0.8, 'high'), n(9, 3, 0.8, 0.7), n(10, 4, 0.8, 0.75), n(11, 0, 0.8, 0.7)],
              [n(0, 0, 1.6, 0.8), s(3, 2.4, 0.85, 'high'), n(6, 7, 0.8, 0.8), n(8, 7, 0.8, 0.5), s(9, 2.4, 0.8, 'high')],
            ],
            fills: [
              [n(0, 7, 0.8, 0.85), n(1, 6, 0.8, 0.7), n(2, 5, 0.8, 0.75), n(3, 3, 1.6, 0.85), n(5, 0, 0.8, 0.6), n(6, 0, 3, 0.85, { vib: true }), n(9, 10, 1.6, 0.75), n(11, 12, 0.8, 0.7)],
            ],
            fillsOnChange: [
              [b(0, 5, 2, 2.4, 0.9, { vib: true }), n(3, 7, 1.6, 0.8), n(5, 7, 0.8, 0.5), n(6, 10, 2.4, 0.85), nx(9, 4, 2.4, 0.85, { vib: true })],
              [s(0, 1.6, 0.8, 'high'), n(3, 3, 0.8, 0.75), n(4, 4, 0.8, 0.75), n(5, 7, 0.8, 0.8), n(6, 10, 1.6, 0.85, { rake: true }), nx(9, -2, 1.6, 0.75), nx(11, -1, 0.8, 0.8)],
            ],
            fillsOnStay: [
              [n(0, 12, 1.6, 0.9, { rake: true }), n(2, 10, 0.8, 0.7), n(3, 12, 1.6, 0.85), n(5, 10, 0.8, 0.7), n(6, 7, 3, 0.85, { vib: true }), s(9, 2.4, 0.8, 'high')],
            ],
            turnaround: [n(0, 12, 0.8, 0.85), n(1, 10, 0.8, 0.75), n(2, 9, 0.8, 0.75), n(3, 8, 0.8, 0.7), n(4, 7, 0.8, 0.75), n(5, 3, 0.8, 0.7), n(6, 0, 2.4, 0.85), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.85)],
          },
        ],
      },
      {
        style: 'blues', label: 'Slow blues', rename: 'Slow blues (12/8)',
        verdict: `<p>Band: the ride plays all twelve, softly; ghost snare on the last triplet before 2 and 4; the bass climbs root–3–5–6 through the bar and approaches each change; a triplet snare fill at the top of the form. Guitar: two new parts — the T-Bone/B.B. comp, a 9th chord slid in from below and a single note shaken, and a "call" part that is mostly silence — plus vibrato, which the engine does not have yet.</p>`,
        band: { ride: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], hat: [3, 9], ghost: [2, 8], kick: [0, 6, 8], kickVel: 0.6,
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 3, off: 4, dur: 3, vel: 0.7 }, { slot: 6, off: 7, dur: 3, vel: 0.8 }, { slot: 9, off: 9, dur: 3, vel: 0.7 }],
                bassApproach: true, fill: { snare: [9, 10, 11], kick: [0, 6] } },
        parts: [
          {
            name: '9th-chord comp (Walker-inspired)',
            why: 'The chord on one, slid in from a half-step below with the 9th on top, let ring; a single note shaken on three; the triplet into the next chord. This is the slow-blues comp of T-Bone Walker and B.B. King\'s band.',
            figure: [s(0, 6, 0.8, 'high', null, { chordSlide: 1, add: 14 }), n(6, 7, 3, 0.75, { vib: true }), n(9, 10, 1, 0.65), n(10, 9, 1, 0.65), n(11, 7, 1, 0.65)],
            variants: [
              [s(0, 5, 0.8, 'high', null, { add: 14 }), s(5, 1, 0.45, 'high'), s(6, 3, 0.7, 'high', null, { chordSlide: -1 }), n(9, 12, 3, 0.75, { vib: true })],
              [n(0, 0, 3, 0.8, { pm: true }), s(3, 3, 0.75, 'high', null, { add: 14 }), n(6, 0, 3, 0.8, { pm: true }), s(9, 3, 0.7, 'high', null, { chordSlide: 1 })],
            ],
            fills: [[b(0, 5, 2, 4, 0.9, { vib: true }), n(4, 7, 2, 0.7), n(6, 10, 3, 0.8, { vib: true }), n(9, 7, 1, 0.65), n(10, 5, 1, 0.65), n(11, 3, 1, 0.7)]],
            fillsOnChange: [[s(0, 3, 0.8, 'high', null, { add: 14 }), n(3, 10, 3, 0.8, { vib: true }), n(6, 7, 1, 0.65), n(7, 10, 1, 0.65), n(8, 12, 1, 0.7), nx(9, 4, 3, 0.85, { vib: true })]],
            fillsOnStay: [[s(0, 6, 0.8, 'high', null, { chordSlide: 1, add: 14 }), n(6, 3, 1, 0.7), n(7, 4, 2, 0.8), n(9, 0, 3, 0.85, { vib: true })]],
            turnaround: [d(0, 10, 12, 3, 0.85), d(3, 9, 12, 3, 0.8), d(6, 7, 12, 3, 0.8), nx(9, 1, 1.5, 0.8), nx(10.5, 0, 1.5, 0.85, { vib: true })],
          },
          {
            name: 'The call (King-inspired)',
            why: 'A phrase and then nothing: one bent note with vibrato on two, a three-note answer on four, the rest of the bar empty, the way B.B. King answers his own singing. Space is the part.',
            figure: [b(3, 5, 2, 3, 0.9, { vib: true }), n(9, 7, 1, 0.7), n(10, 5, 1, 0.7), n(11, 3, 1, 0.75)],
            variants: [
              [n(0, 12, 1, 0.85, { rake: true }), n(1, 10, 1, 0.7), n(2, 7, 4, 0.85, { vib: true }), n(9, 3, 1, 0.7), n(10, 4, 2, 0.8)],
              [n(3, 10, 3, 0.85, { vib: true }), n(6, 7, 1, 0.7), n(7, 5, 1, 0.65), n(8, 3, 1, 0.65), n(9, 0, 3, 0.85, { vib: true })],
            ],
            fills: [[n(0, 0, 3, 0.8, { vib: true }), n(6, 3, 1, 0.7), n(7, 4, 1, 0.75), n(8, 7, 1, 0.8), n(9, 10, 3, 0.85, { vib: true })]],
            fillsOnChange: [[b(0, 10, 2, 4, 0.9, { vib: true }), n(6, 7, 1, 0.7), n(7, 5, 1, 0.65), n(8, 3, 1, 0.65), nx(9, 4, 3, 0.85, { vib: true })]],
            fillsOnStay: [[n(3, 7, 3, 0.85, { vib: true }), n(9, 7, 1, 0.6), n(10, 6, 1, 0.6), n(11, 5, 1, 0.65)]],
            turnaround: [n(0, 12, 1, 0.85), n(1, 10, 1, 0.75), n(2, 9, 1, 0.7), n(3, 8, 1, 0.7), n(4, 7, 1, 0.75), n(5, 5, 1, 0.7), n(6, 3, 1, 0.75), n(7, 4, 2, 0.8), nx(9, 7, 1.5, 0.75), nx(10.5, 0, 1.5, 0.85, { vib: true })],
          },
        ],
      },
      {
        style: 'blues', label: 'Jump blues', rename: 'Jump blues (swung)',
        verdict: `<p>The one big change: jump blues swings. Louis Jordan, T-Bone Walker, Big Joe Turner — a swing band with a backbeat, not straight eighths. The band moves to the twelve-slot grid: walking bass in quarters, ride swing, snare hard on 2 and 4, the comp punched like a horn section and pushed on the "and of 4" into every change. The straight version the app has now is really early rock 'n' roll — see the Rock genre, where it is proposed as "Rock 'n' roll (Berry-inspired)". Guitar: 9th-chord stabs slid in, the boogie walk under the stabs, horn-riff fills.</p>`,
        entry: { tempo: 168 },
        band: { grid: 12, kick: [0, 6], snare: [3, 9], snareVel: 0.9, hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'dom7',
                bass: [{ slot: 0, walk: 0, dur: 2.6, vel: 0.95 }, { slot: 3, walk: 2, dur: 2.6, vel: 0.8 }, { slot: 6, walk: 1, dur: 2.6, vel: 0.9 }, { slot: 9, walk: 3, dur: 2.6, vel: 0.8 }],
                chord: [{ slot: 3, dur: 1.2, vel: 0.75 }, { slot: 9, dur: 1.2, vel: 0.7 }], compAnticipate: true, fill: { snare: [6, 8, 9, 11], kick: [0, 3] } },
        parts: [
          {
            name: '9th stabs (Walker-inspired)', replaces: 'Jump comp',
            why: 'Stabs on 2 and 4 on the top strings with the 9th on top, slid in from a half-step below, and the push on the "and of 4" into the change — the horn section\'s job, on a guitar.',
            figure: [s(3, 1.6, 0.85, 'high', null, { add: 14, chordSlide: 1 }), s(9, 1.6, 0.85, 'high', null, { add: 14 })],
            variants: [
              [s(3, 1.6, 0.85, 'high', null, { add: 14 }), s(5, 0.8, 0.45, 'high'), s(9, 1.6, 0.85, 'high', null, { add: 14 }), s(11, 0.8, 0.45, 'high')],
              [s(0, 0.8, 0.7, 'bass', 'mute'), s(3, 1.6, 0.85, 'high', null, { add: 14, chordSlide: 1 }), s(6, 0.8, 0.7, 'bass', 'mute'), s(9, 1.6, 0.85, 'high', null, { add: 14 })],
            ],
            fills: [[s(3, 1.6, 0.85, 'high', null, { add: 14 }), n(6, 9, 0.8, 0.8), n(8, 10, 0.8, 0.75), n(9, 12, 1.6, 0.9), n(11, 10, 0.8, 0.7)]],
            fillsOnChange: [
              [s(3, 1.6, 0.85, 'high', null, { add: 14 }), s(9, 1.6, 0.8, 'high', null, { add: 14 }), nx(11, 0, 0.8, 0.85, { chordSlide: 1 })],
              [s(3, 1.6, 0.85, 'high', null, { add: 14 }), n(6, 7, 0.8, 0.8), n(8, 9, 0.8, 0.75), n(9, 10, 0.8, 0.8), nx(10, -2, 0.8, 0.75), nx(11, -1, 0.8, 0.8)],
            ],
            fillsOnStay: [[s(3, 1.6, 0.85, 'high', null, { add: 14, chordSlide: 1 }), h(6, 3, 4, 1.6, 0.85), n(8, 7, 0.8, 0.7), s(9, 1.6, 0.85, 'high', null, { add: 14 })]],
            turnaround: [s(0, 1.6, 0.8, 'high', null, { add: 14 }), s(3, 1.6, 0.8, 'high', null, { chordSlide: -1, add: 14 }), s(6, 1.6, 0.8, 'high', null, { chordSlide: -1 }), nx(9, 0, 2.4, 0.85, { chordSlide: 1, add: 14 })],
          },
          {
            name: 'Boogie walk under the stabs', replaces: 'Riff and stab',
            why: 'The bass line on the guitar — root, 3, 5, 6, ♭7, 6, 5, 3 in swung eighths, palm-muted — with the stab on 2 and 4 on top of it. A change gets the chromatic walk-up; the turnaround walks down in 6ths.',
            figure: [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), s(3, 1.2, 0.8, 'high', null, { add: 14 }), n(5, 9, 0.8, 0.7, { pm: true }),
                     n(6, 10, 1.6, 0.85, { pm: true }), n(8, 9, 0.8, 0.7, { pm: true }), s(9, 1.2, 0.8, 'high', null, { add: 14 }), n(11, 4, 0.8, 0.7, { pm: true })],
            variants: [
              [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), n(6, 10, 1.6, 0.85, { pm: true }), n(8, 9, 0.8, 0.7, { pm: true }), n(9, 7, 1.6, 0.85, { pm: true }), n(11, 4, 0.8, 0.7, { pm: true })],
              [d(0, 0, 12, 1.6, 0.9), n(2, 4, 0.8, 0.7, { pm: true }), s(3, 1.2, 0.8, 'high', null, { add: 14 }), n(5, 7, 0.8, 0.7, { pm: true }), d(6, 0, 12, 1.6, 0.85), n(8, 10, 0.8, 0.7, { pm: true }), s(9, 1.2, 0.8, 'high', null, { add: 14 }), n(11, 9, 0.8, 0.7, { pm: true })],
            ],
            fills: [[n(0, 12, 0.8, 0.9, { rake: true }), n(1, 10, 0.8, 0.75), n(2, 9, 0.8, 0.75), n(3, 7, 1.6, 0.85), n(5, 7, 0.8, 0.5), n(6, 10, 1.6, 0.85), n(8, 9, 0.8, 0.7), n(9, 7, 2.4, 0.85, { vib: true })]],
            fillsOnChange: [[n(0, 0, 1.6, 0.9, { pm: true }), n(2, 4, 0.8, 0.7, { pm: true }), n(3, 7, 1.6, 0.85, { pm: true }), n(5, 9, 0.8, 0.7, { pm: true }), nx(6, -5, 1.6, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.6, 0.8, { pm: true }), nx(11, -1, 0.8, 0.8, { pm: true })]],
            fillsOnStay: [[n(0, 0, 0.8, 0.9), n(1, 3, 0.8, 0.7), n(2, 4, 0.8, 0.8), n(3, 7, 1.6, 0.85), n(5, 7, 0.8, 0.5), n(6, 9, 0.8, 0.8), n(7, 10, 0.8, 0.8), n(8, 12, 0.8, 0.85), n(9, 10, 1.6, 0.8), n(11, 9, 0.8, 0.7)]],
            turnaround: [d(0, 10, 12, 1.6, 0.85), d(2, 10, 12, 0.8, 0.5), d(3, 9, 12, 1.6, 0.8), d(5, 9, 12, 0.8, 0.5), d(6, 7, 12, 1.6, 0.8), n(8, 7, 0.8, 0.5), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.85)],
          },
        ],
      },
    ],
    additions: [
      {
        label: 'Texas shuffle', inspired: 'Stevie Ray Vaughan ("Pride and Joy"), Freddie King ("Hide Away")', style: 'blues',
        progression: ['E7', 'E7', 'A7', 'A7', 'E7', 'B7'], key: 'E', tempo: 124,
        why: `<p>Both guitars in one hand: the bass note on the beat, a muted rake across the whole chord on the upbeat, hard; the drummer plays the shuffle on the snare with ghost notes. Fills are the "Texas triplets" — three-note groups down the box — and the ♭3 bent and shaken. Needs rakes, palm-muted notes and vibrato.</p>`,
        band: { grid: 12, kick: [0, 6, 8], snare: [3, 9], snareVel: 0.95, ghost: [2, 5, 8, 11], hat: [0, 3, 6, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 2.6, vel: 0.95 }, { slot: 3, off: 4, dur: 2.6, vel: 0.8 }, { slot: 6, off: 7, dur: 2.6, vel: 0.9 }, { slot: 9, off: 9, dur: 2.6, vel: 0.8 }],
                bassApproach: true, chord: [{ slot: 2, dur: 1, vel: 0.4 }, { slot: 5, dur: 1, vel: 0.4 }, { slot: 8, dur: 1, vel: 0.4 }, { slot: 11, dur: 1, vel: 0.4 }],
                fill: { snare: [6, 7, 8, 9, 10, 11], kick: [0, 3] } },
        parts: [
          {
            name: 'Everything at once',
            why: 'Root-5th on the beat, the whole chord raked and muted on the upbeat, the 6th on beats 2 and 4 — the shuffle and the chords from one hand.',
            figure: [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'),
                     d(6, 0, 7, 1.6, 0.9, { pm: true }), s(8, 0.8, 0.5, 'full', 'mute'), d(9, 0, 9, 1.6, 0.85, { pm: true }), s(11, 0.8, 0.5, 'full', 'mute')],
            variants: [
              [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), s(3, 1.6, 0.95, 'full', null, { rake: true }), s(5, 0.8, 0.5, 'full', 'mute'),
               d(6, 0, 7, 1.6, 0.9, { pm: true }), s(8, 0.8, 0.5, 'full', 'mute'), s(9, 1.6, 0.95, 'full', null, { rake: true }), s(11, 0.8, 0.5, 'full', 'mute')],
              [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'),
               d(6, 0, 10, 1.6, 0.9, { pm: true }), s(8, 0.8, 0.5, 'full', 'mute'), d(9, 0, 9, 1.6, 0.85, { pm: true }), h(11, 3, 4, 0.8, 0.7)],
            ],
            fills: [[n(0, 12, 0.8, 0.9), n(1, 10, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 10, 0.8, 0.85), n(4, 7, 0.8, 0.75), n(5, 5, 0.8, 0.75), n(6, 7, 0.8, 0.85), n(7, 5, 0.8, 0.75), n(8, 3, 0.8, 0.75), b(9, 3, 1, 2.4, 0.9, { vib: true })]],
            fillsOnChange: [
              [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'),
               n(6, 10, 0.8, 0.85), n(7, 9, 0.8, 0.7), n(8, 7, 0.8, 0.75), nx(9, -3, 0.8, 0.75), nx(10, -2, 0.8, 0.75), nx(11, -1, 0.8, 0.8)],
            ],
            fillsOnStay: [[d(0, 7, 12, 1.6, 0.9, { vib: true }), d(2, 7, 12, 0.8, 0.6), d(3, 7, 12, 1.6, 0.85), n(5, 10, 0.8, 0.7), n(6, 7, 2.4, 0.85, { vib: true }), s(9, 1.6, 0.9, 'full', null, { rake: true }), s(11, 0.8, 0.5, 'full', 'mute')]],
            turnaround: [n(0, 12, 0.8, 0.9), n(1, 12, 0.8, 0.5), n(2, 10, 0.8, 0.8), n(3, 9, 0.8, 0.8), n(4, 8, 0.8, 0.7), n(5, 7, 0.8, 0.8), n(6, 0, 2.4, 0.9, { vib: true }), nx(9, 1, 1.6, 0.8, { rake: true }), nx(11, 0, 0.8, 0.9)],
          },
          {
            name: 'Texas triplets',
            why: 'The lines between: groups of three down the box, a bend shaken at the end, and the muted chug back in the gaps. The change fill runs down onto the next chord\'s 3rd.',
            figure: [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'),
                     n(6, 12, 0.8, 0.85), n(7, 10, 0.8, 0.75), n(8, 7, 0.8, 0.8), n(9, 10, 0.8, 0.8), n(10, 7, 0.8, 0.75), n(11, 5, 0.8, 0.75)],
            variants: [
              [n(0, 7, 0.8, 0.85), n(1, 5, 0.8, 0.75), n(2, 3, 0.8, 0.75), n(3, 0, 2.4, 0.9, { vib: true }), d(6, 0, 7, 1.6, 0.9, { pm: true }), s(8, 0.8, 0.5, 'full', 'mute'), d(9, 0, 9, 1.6, 0.85, { pm: true }), s(11, 0.8, 0.5, 'full', 'mute')],
              [d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'), b(6, 3, 1, 3, 0.9, { vib: true }), n(9, 0, 1.6, 0.8), n(11, 0, 0.8, 0.5)],
            ],
            fills: [[n(0, 12, 0.8, 0.9, { rake: true }), n(1, 10, 0.8, 0.75), n(2, 7, 0.8, 0.8), n(3, 12, 0.8, 0.85), n(4, 10, 0.8, 0.75), n(5, 7, 0.8, 0.8), n(6, 10, 0.8, 0.85), n(7, 7, 0.8, 0.75), n(8, 5, 0.8, 0.75), b(9, 3, 1, 2.4, 0.9, { vib: true })]],
            fillsOnChange: [[n(0, 7, 0.8, 0.85), n(1, 5, 0.8, 0.75), n(2, 3, 0.8, 0.75), n(3, 0, 1.6, 0.85), n(5, 3, 0.8, 0.7), n(6, 5, 0.8, 0.8), n(7, 6, 0.8, 0.75), n(8, 7, 0.8, 0.8), nx(9, 5, 0.8, 0.75), nx(10, 4, 1.6, 0.85, { vib: true })]],
            fillsOnStay: [[d(0, 0, 7, 1.6, 0.9, { pm: true }), s(2, 0.8, 0.5, 'full', 'mute'), d(3, 0, 9, 1.6, 0.85, { pm: true }), s(5, 0.8, 0.5, 'full', 'mute'), n(6, 12, 0.8, 0.85), n(7, 12, 0.8, 0.5), n(8, 10, 0.8, 0.8), n(9, 12, 2.4, 0.9, { vib: true })]],
            turnaround: [n(0, 12, 0.8, 0.9), n(1, 10, 0.8, 0.75), n(2, 9, 0.8, 0.75), n(3, 8, 0.8, 0.7), n(4, 7, 0.8, 0.75), n(5, 5, 0.8, 0.7), n(6, 3, 0.8, 0.75), n(7, 4, 0.8, 0.8), n(8, 0, 0.8, 0.85), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.9)],
          },
        ],
      },
      {
        label: 'One-chord boogie', inspired: 'John Lee Hooker ("Boogie Chillen", "Boom Boom"), Canned Heat', style: 'blues',
        progression: ['E7', 'E7', 'E7', 'E7', 'E7', 'E7'], key: 'E', tempo: 128,
        why: `<p>One chord, a foot stomping every beat, and the root pedalled on the low string with the ♭3 hammered onto the 3 above it. There is no change to fill toward, so the fills are the riff opening up and closing again; the "turnaround" is a stop.</p>`,
        band: { grid: 12, kick: [0, 3, 6, 9], kickVel: 0.8, snare: [], hat: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'dom7',
                bass: [0, 2, 3, 5, 6, 8, 9, 11].map(k => ({ slot: k, off: k === 5 || k === 11 ? 7 : 0, dur: 0.9, vel: k % 3 === 0 ? 0.9 : 0.65 })), chord: [] },
        parts: [
          {
            name: 'Boogie pedal',
            why: 'The root on every shuffle eighth, palm-muted, and the ♭3-to-3 hammered on top of it on 2 and 4. One idea, worn in.',
            figure: [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), h(3, 3, 4, 1.6, 0.8), n(5, 0, 0.8, 0.6, { pm: true }), n(6, 0, 1.6, 0.9, { pm: true }), n(8, 0, 0.8, 0.6, { pm: true }), h(9, 3, 4, 1.6, 0.8), n(11, 0, 0.8, 0.6, { pm: true })],
            variants: [
              [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), n(3, 0, 1.6, 0.85, { pm: true }), n(5, 10, 0.8, 0.7), n(6, 12, 1.6, 0.85), n(8, 10, 0.8, 0.7), n(9, 0, 1.6, 0.85, { pm: true }), n(11, 0, 0.8, 0.6, { pm: true })],
              [d(0, 0, 7, 1.6, 0.9, { pm: true }), d(2, 0, 7, 0.8, 0.6, { pm: true }), d(3, 0, 9, 1.6, 0.85, { pm: true }), d(5, 0, 9, 0.8, 0.6, { pm: true }), d(6, 0, 7, 1.6, 0.9, { pm: true }), d(8, 0, 7, 0.8, 0.6, { pm: true }), h(9, 3, 4, 1.6, 0.8), n(11, 0, 0.8, 0.6, { pm: true })],
            ],
            fills: [
              [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), n(3, 12, 0.8, 0.85), n(4, 10, 0.8, 0.75), n(5, 7, 0.8, 0.8), n(6, 0, 1.6, 0.9, { pm: true }), n(8, 0, 0.8, 0.6, { pm: true }), h(9, 3, 4, 1.6, 0.8), n(11, 7, 0.8, 0.7)],
              [s(0, 2.4, 0.9, 'low', null, { rake: true }), n(3, 0, 1.6, 0.85, { pm: true }), n(5, 0, 0.8, 0.6, { pm: true }), n(6, 0, 1.6, 0.9, { pm: true }), n(8, 0, 0.8, 0.6, { pm: true }), n(9, 10, 1.6, 0.8), n(11, 12, 0.8, 0.8)],
            ],
            turnaround: [n(0, 0, 1.6, 0.9, { pm: true }), n(2, 0, 0.8, 0.6, { pm: true }), h(3, 3, 4, 1.6, 0.85), n(5, 0, 0.8, 0.6, { pm: true }), s(6, 6, 0.95)],
          },
        ],
      },
      {
        label: 'Delta fingerstyle', inspired: 'Robert Johnson, Son House, Mississippi John Hurt', style: 'blues',
        progression: ['E7', 'E7', 'A7', 'A7', 'E7', 'B7'], key: 'E', tempo: 100,
        why: `<p>No band at all: the thumb keeps a muted bass on every beat (the "dead thumb") while the fingers play double stops in 3rds on the upbeats, the ♭3 hammered onto the 3, and the turnaround walking down. The alternating-thumb version moves between the root and the 5th. This is the one style where the band pattern is empty on purpose.</p>`,
        band: { grid: 12, kick: [], snare: [], hat: [], voice: 'dom7', bass: [], chord: [], slapback: false },
        parts: [
          {
            name: 'Dead thumb and fills',
            why: 'The root on every beat, muted; 3rds on the upbeats; the ♭3 hammer on four. The change walks the thumb up; the turnaround comes down the top strings.',
            figure: [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.6), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.6), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 3, 7, 0.8, 0.6), s(9, 1.4, 0.8, 'bass', 'mute'), h(11, 3, 4, 0.8, 0.7)],
            variants: [
              [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 7, 10, 0.8, 0.6), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 7, 10, 0.8, 0.6), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 4, 7, 0.8, 0.6), s(9, 1.4, 0.8, 'bass', 'mute'), d(11, 4, 7, 0.8, 0.6)],
              [s(0, 1.4, 0.85, 'bass', 'mute'), n(2, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'fifth', 'mute'), n(5, 10, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), n(8, 7, 0.8, 0.65), s(9, 1.4, 0.8, 'fifth', 'mute'), h(11, 3, 4, 0.8, 0.7)],
            ],
            fills: [[s(0, 1.4, 0.85, 'bass', 'mute'), n(1, 12, 0.8, 0.75), n(2, 10, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), n(4, 7, 0.8, 0.7), n(5, 3, 0.8, 0.65), s(6, 1.4, 0.85, 'bass', 'mute'), h(7, 3, 4, 1.6, 0.75), s(9, 1.4, 0.8, 'bass', 'mute'), n(11, 0, 0.8, 0.6)]],
            fillsOnChange: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.6), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 4, 7, 0.8, 0.6), nx(6, -5, 1.4, 0.85, { pm: true }), nx(8, -3, 0.8, 0.7, { pm: true }), nx(9, -2, 1.4, 0.8, { pm: true }), nx(11, -1, 0.8, 0.8, { pm: true })]],
            fillsOnStay: [[s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 4, 7, 0.8, 0.6), s(3, 1.4, 0.8, 'bass', 'mute'), n(5, 10, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), n(7, 7, 0.8, 0.65), n(8, 10, 0.8, 0.7), s(9, 1.4, 0.8, 'bass', 'mute'), n(10, 12, 0.8, 0.75), n(11, 10, 0.8, 0.65)]],
            turnaround: [s(0, 1.4, 0.85, 'bass', 'mute'), d(2, 10, 12, 0.8, 0.7), s(3, 1.4, 0.8, 'bass', 'mute'), d(5, 9, 12, 0.8, 0.7), s(6, 1.4, 0.85, 'bass', 'mute'), d(8, 7, 12, 0.8, 0.7), nx(9, 1, 1.6, 0.8), nx(11, 0, 0.8, 0.85)],
          },
        ],
      },
      {
        label: 'Minor blues', inspired: 'B.B. King ("The Thrill Is Gone"), Gary Moore, Otis Rush', style: 'blues',
        progression: ['Am7', 'Am7', 'Dm7', 'Dm7', 'Fmaj7', 'E7'], key: 'A', mode: 'minor', tempo: 80, scaleTheory: 'modal',
        why: `<p>12/8 and minor: the 4th bent up to the 5th and shaken, the natural 6th over the iv (Dorian), the ♭VI–V turnaround. The comp is minor-7th shells; the bass climbs root–♭3–5–♭7. Realised with the modal palette so the V7's ♭9 is available.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.6, snare: [3, 9], snareVel: 0.6, ghost: [2, 8], hat: [3, 9], ride: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], voice: 'jazz',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 3, off: 3, dur: 3, vel: 0.7 }, { slot: 6, off: 7, dur: 3, vel: 0.8 }, { slot: 9, off: 10, dur: 3, vel: 0.7 }],
                bassApproach: true, chord: [{ slot: 0, dur: 6, vel: 0.5 }, { slot: 6, dur: 5, vel: 0.45 }] },
        parts: [
          {
            name: 'Minor call',
            why: 'A bend from the 4th to the 5th with vibrato, the ♭3 answered by the root, and the 6th where the chord allows it; the change fill lands on the next chord\'s ♭3 or 3rd.',
            figure: [b(0, 5, 2, 4, 0.9, { vib: true }), n(6, 3, 1, 0.75), n(7, 0, 2, 0.8), n(9, 10, 3, 0.8, { vib: true })],
            variants: [
              [n(0, 12, 1, 0.85), n(1, 10, 1, 0.75), n(2, 7, 4, 0.85, { vib: true }), n(9, 9, 1, 0.7), n(10, 7, 2, 0.8)],
              [s(0, 6, 0.6, 'shell'), n(6, 7, 1, 0.7), n(7, 10, 1, 0.75), n(8, 12, 1, 0.8), n(9, 10, 3, 0.85, { vib: true })],
            ],
            fills: [[n(0, 7, 1, 0.8), n(1, 5, 1, 0.7), n(2, 3, 1, 0.75), n(3, 0, 3, 0.85, { vib: true }), n(6, 3, 1, 0.7), n(7, 5, 1, 0.7), n(8, 7, 1, 0.8), b(9, 5, 2, 3, 0.9, { vib: true })]],
            fillsOnChange: [[b(0, 5, 2, 3, 0.9, { vib: true }), n(3, 3, 3, 0.8), n(6, 0, 1, 0.7), n(7, 3, 1, 0.7), n(8, 5, 1, 0.75), nx(9, 3, 3, 0.85, { vib: true })]],
            fillsOnStay: [[n(3, 10, 3, 0.85, { vib: true }), n(6, 7, 1, 0.7), n(7, 5, 1, 0.7), n(8, 3, 1, 0.7), n(9, 0, 3, 0.85, { vib: true })]],
            turnaround: [n(0, 12, 2, 0.85), n(2, 10, 1, 0.75), n(3, 8, 3, 0.8, { vib: true }), n(6, 7, 3, 0.8), nx(9, 1, 1.5, 0.8), nx(10.5, 0, 1.5, 0.85, { vib: true })],
          },
          {
            name: 'Minor comp',
            why: 'Minor-7th shells (root, ♭3, ♭7) on one and three, an answer in the space. Needs shell voicings.',
            figure: [s(0, 5, 0.75, 'shell'), s(6, 3, 0.6, 'shell'), n(9, 10, 1.5, 0.7), n(10.5, 12, 1.5, 0.7)],
            variants: [[s(0, 3, 0.75, 'shell'), s(3, 3, 0.5, 'shell'), s(6, 5, 0.65, 'shell', null, { chordSlide: 1 }), n(11, 12, 1, 0.7)], [n(0, 0, 3, 0.8, { pm: true }), s(3, 3, 0.7, 'shell'), n(6, 0, 3, 0.8, { pm: true }), s(9, 3, 0.65, 'shell')]],
            fills: [[s(0, 3, 0.75, 'shell'), n(3, 3, 3, 0.8, { vib: true }), n(6, 5, 1, 0.7), n(7, 7, 1, 0.75), n(8, 10, 1, 0.8), n(9, 12, 3, 0.85, { vib: true })]],
            fillsOnChange: [[s(0, 6, 0.75, 'shell'), n(6, 10, 1, 0.7), n(7, 7, 1, 0.7), n(8, 5, 1, 0.7), nx(9, 3, 3, 0.85, { vib: true })]],
            turnaround: [s(0, 3, 0.75, 'shell'), s(3, 3, 0.6, 'shell'), nx(6, 0, 3, 0.75, { chordSlide: -1 }), nx(9, 0, 3, 0.8, { chordSlide: 1 })],
          },
        ],
      },
    ],
  });

  GT.review = { genres, engine: [] };
  GT.reviewHelpers = { n, nx, s, g, d, b, h, p, sl, chug, shuffle };
})();
