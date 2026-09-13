// The Hendrix genre: eight feels, each a way he played, with rhythm parts,
// lead parts and parts that do both, written from the idiom the sources
// describe — the thumb over the neck on the bass note, the E-shape barre and
// its D–G–B triad struck on its own, the 4th, the 6th and the 9th hammered
// onto the shape, the 7♯9 grip, the minor pentatonic over a major chord,
// the box at the 12th fret and the one above it, unison bends, wide vibrato,
// the wah rocking with the pick — and never from a recording: no line here
// is a transcription or a paraphrase of one, and the songs named are named
// as reference points for the way of playing. What was read, and how the
// content was made, is set out on hendrix.html ("How this was made") with
// every source cited; the method is docs/STYLES.md.
//
// The engine features these parts use, and what they mean (parts.js):
//   free: true      the note keeps its chromatic pitch in every reading —
//                   the 4th hammered onto a chord, the ♭5, the major 3rd
//                   against a minor pentatonic line
//   reach: n        the note may sit up to n frets past the position: the
//                   hand climbing into the next box for a phrase
//   blues: true     (on the part) the minor pentatonic over a major chord in
//                   the pentatonic reading, the blues scale in the scale one
//   voicing 'sharp9' / 'ninth' / 'mid' / 'bass'
//                   the Hendrix chord, the 9th grip, the D–G–B triad of the
//                   E shape, the thumb's bass note
//   unison: true    on a double stop of one note twice: one fretted, one
//                   bent up a tone to it on the next string
//   trill: iv       the note trilled against the interval above it
//   wah: true       the pedal on that strike, rocking with the pick
//   needs: { preset, variant }
//                   a part that only makes sense over one progression
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const genres = GT.review.genres;

  const n  = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, ...(x || {}) });
  const nx = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, next: true, ...(x || {}) });
  const s  = (at, dur, vel, voicing, mute, x) => ({ at, dur, vel, strum: true, voicing: voicing || 'full', mute: mute === 'mute', ...(x || {}) });
  const sn = (at, dur, vel, voicing, x) => s(at, dur, vel, voicing, null, { next: true, ...(x || {}) });
  const g  = (at, dur, vel, voicing, x) => s(at, dur, vel, voicing || 'high', null, { ghost: true, ...(x || {}) });   // a muted scratch
  const d  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'double', ...(x || {}) });
  const un = (at, iv, dur, vel, x) => d(at, iv, iv, dur, vel, { unison: true, ...(x || {}) });   // the unison bend
  const b  = (at, iv, up, dur, vel, x) => ({ at, iv, up, dur, vel, tech: 'bend', ...(x || {}) });
  const h  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'hammer', ...(x || {}) });
  const p  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'pull', ...(x || {}) });
  const sl = (at, from, iv, dur, vel, x) => ({ at, iv, from, dur, vel, tech: 'slide', ...(x || {}) });
  const F = { free: true }, V = { vib: true }, FV = { free: true, vib: true }, W = { wah: true }, PM = { pm: true };
  // a hammer-on or pull-off with one note the chord's own and the other free:
  // F2 the first snapped and the second free (the 3rd hammered to a sus4 that
  // stays a sus4), F1 the reverse (the sus4 pulled off to the chord's 3rd), R2F
  // the 9th on the top string hammered to the 3rd a fret past the window
  const F2 = { free2: true }, F1 = { free: true, free2: false }, R2F = { free: true, free2: false, reach: 1 };
  // WHERE THE NOTES SIT. The thumb-over feels put the root under the thumb on
  // the low E string, and a part's intervals are measured from that root
  // (parts.js, homeMidi), so the E shape's strings are: 0 the root (E), 5
  // and 7 the 4th and 5th (A), 10 and 12 the ♭7 and the octave (D), 15 to
  // 17 the 3rd and the 4th (G), 19 and 21 the 5th and the 6th (B), 24 and
  // 26 the octave and the 9th (e). The embellishments of the split chord,
  // the 6ths and the R&B fills are written in that register — the fingers'
  // strings, over the thumb — and the walk-ups below the root (B83).
  // a bar of wah scratches: sixteen muted strokes, the beats a shade harder
  const scratch = (vel = 0.45) => [...Array(16).keys()].map(k => g(k, 0.9, k % 4 === 0 ? vel + 0.15 : vel, 'high', W));

  // =========================================================================
  genres.push({
    id: 'hendrix', name: 'Hendrix', engine: true,
    research: `
      <p><b>What he actually does.</b> Jimi Hendrix's rhythm playing is the R&amp;B guitar of the chitlin' circuit — Curtis Mayfield's, Steve Cropper's, the Isley Brothers' band he played in — with the chord opened up: the thumb over the neck takes the bass note of an E-shape barre, so the fingers are free to strike the D–G–B triad on its own (the "split chord") and to hammer the 4th onto the 3rd, the 6th onto the 5th and the 9th onto the octave, to slide 6ths on the third and fifth strings and 4ths on the top two, and to answer a chord with a double stop out of the pentatonic box that sits under the same shape (Guitar Player's "Five rules", Premier Guitar's "Hendrix rhythms made easy", Happy Bluesman's three steps, Blackstar's rhythm-and-lead lesson, the Pickup Music CAGED course, the Gresham College lecture by Milton Mermikides). "Little Wing", "Castles Made of Sand", "The Wind Cries Mary", "Bold as Love", "Angel" and "Wait Until Tomorrow" are the records that show it; Billy Cox and Mitch Mitchell both name Mayfield as where it came from. The other side is the fuzz: the E7♯9 — the "Hendrix chord", root on the A string, x-7-6-7-8-x — as a tonic that never resolves ("Purple Haze", "Foxy Lady", "Crosstown Traffic", "Spanish Castle Magic"), single-note riffs in the E minor pentatonic with the ♭5 doubled with the bass and muted between the notes ("Voodoo Child (Slight Return)", "Manic Depression", "Freedom", "Izabella"), and a lead language that is the blues of Albert King, B.B. King and Buddy Guy — the box at the 12th fret and the box above it, bends of a step and a step and a half, the unison bend, B.B. King's wrist vibrato, rakes, trills — with the minor pentatonic played over major and dominant chords, chromatic passing notes and Dorian and Mixolydian colour (the Wikipedia articles on "Red House", "Purple Haze" and the 7♯9 chord; MusicRadar's lead lesson; Jon MacLennan's and Riff Ninja's lessons; Hanford's University of Washington dissertation on Band of Gypsys; Storey's London College of Music analysis).</p>
      <p><b>Where the notes sit.</b> Everything is played in the E shape and the shape above it: a thumb-over barre with its root on the low E string, the pentatonic box that shares that root (the "E shape" box in the app's reading), and the box a fourth up when a phrase climbs (the "D shape"). The 7♯9 and the 9th are 5th-string-root grips. Fills answer the chord from the top three strings of the same position; a lead line goes up a box and comes back. He tuned a half-step down; the parts are written in the fingered key, so what reads as E was heard as E♭.</p>
      <p><b>The feels.</b> The soul ballad at 70 (the chord-melody way, with a swing that moves phrase to phrase); the fuzz riff at 108 (the Hendrix chord as home, the ♭III and the IV); the slow blues in 12/8 (9th chords with the trill, the vocal lead); the funk of the last year (sixteenth scratches with the wah, the muted single-note riff); the cycle of fourths at 82 (thumb chords and the walk-up from root to root); the one-chord voodoo vamp (the wah intro, the pentatonic riff, the machine-gun lead); the R&amp;B up-tempo (hammered double stops between chords); and the rolling waltz (the riff in unison with the bass under a triplet feel).</p>`,
    existing: [],
    additions: [
      // ---------------------------------------------------------------------
      {
        label: 'Soul ballad (chord melody)', inspired: '"Little Wing", "Castles Made of Sand", "Angel", "The Wind Cries Mary" — the Mayfield way, opened up', style: 'hendrix',
        progression: ['Em', 'G', 'Am', 'Em', 'Bm', 'C'], key: 'E', mode: 'minor', tempo: 70, scaleTheory: 'modal',
        why: `<p>The chord is the melody. The thumb takes the root on the low E, the fingers strike the D–G–B triad on the "and", and the hand keeps moving inside the shape: the 3rd hammered up to the 4th on the G string, the 5th to the 6th on the B, the octave to the 9th on the top string; a double stop out of the pentatonic box answering; sixths and fourths slid between chords. The band is soft — a rim click on 2 and 4, the bass on roots, the hat with a little bounce — and the sixteenths swing a shade, the way the record's do.</p>`,
        band: { grid: 16, kick: [0, 10], kickVel: 0.55, rim: [4, 12], snare: [], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], swing: 0.3, voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 7.5, vel: 0.8 }, { slot: 8, off: 0, dur: 5.5, vel: 0.7 }, { slot: 14, off: 7, dur: 1.6, vel: 0.55 }], bassApproach: true,
                chord: [{ slot: 0, dur: 7, vel: 0.35 }, { slot: 8, dur: 7, vel: 0.3 }] },
        parts: [
          {
            name: 'Thumb bass and the split chord',
            why: 'The thumb-over shape as one hand plays it: the root alone on one, the D–G–B triad on the "and", then the embellishments that live inside the E shape — the 4th hammered on the G string, the 9th on the top string, the 6th on the B — written as the notes they are (free), so a sus4 stays a sus4 whatever the reading. The change fills walk down the pentatonic into the next root; the lead lines are the melody the chord already had.',
            figure: [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), h(4, 16, 17, 2, 0.7, F2), s(6, 2, 0.55, 'mid'),
                     s(8, 2, 0.8, 'bass'), d(10, 19, 24, 2, 0.65), h(12, 24, 26, 2, 0.7, F), n(14, 19, 2, 0.55)],
            variants: [
              // the 6th hammered onto the 5th on the B string, and the triad answered by its top pair
              [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), h(4, 19, 21, 2, 0.7, F), d(6, 16, 19, 2, 0.55),
               s(8, 2, 0.8, 'bass'), s(10, 2, 0.65, 'mid'), p(12, 17, 16, 2, 0.7, F1), n(14, 12, 2, 0.55)],
              // the whole chord on one, then the bass note and the pentatonic pair
              [s(0, 4, 0.85), s(4, 2, 0.55, 'mid'), n(6, 24, 2, 0.6), s(8, 2, 0.8, 'bass'), d(10, 22, 26, 2, 0.6, F), h(12, 15, 17, 2, 0.65, F), n(14, 19, 2, 0.55)],
            ],
            figureMode: 'roll',
            fills: [
              [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), n(4, 24, 2, 0.7), n(6, 22, 2, 0.65), n(8, 19, 2, 0.7), h(10, 15, 17, 2, 0.65, F), n(12, 12, 4, 0.75, V)],
            ],
            fillsOnChange: [
              // down the box and onto the next root
              [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), n(6, 24, 2, 0.7), n(8, 22, 2, 0.65), n(10, 19, 2, 0.7), n(12, 17, 2, 0.65, F), nx(14, 0, 2, 0.8)],
              // the sliding 4ths on the top strings, then the next chord's 3rd and root
              [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), sl(6, 17, 19, 2, 0.65), n(8, 24, 2, 0.65), d(10, 19, 24, 2, 0.6), nx(12, 16, 2, 0.65), nx(14, 0, 2, 0.75)],
            ],
            fillsOnStay: [
              // the 3rds down the shape
              [s(0, 2, 0.85, 'bass'), s(2, 2, 0.7, 'mid'), d(6, 21, 24, 2, 0.6, F), d(8, 17, 21, 2, 0.65, F), d(10, 16, 19, 2, 0.6), d(12, 12, 16, 4, 0.7)],
              // the 9th said twice and let go
              [s(0, 2, 0.85, 'bass'), h(2, 24, 26, 2, 0.7, F), n(6, 26, 2, 0.6, F), n(8, 24, 2, 0.7), s(10, 2, 0.6, 'mid'), n(12, 19, 4, 0.7, V)],
            ],
            tails: [[n(8, 24, 2, 0.7), n(10, 26, 1, 0.6, F), n(11, 24, 1, 0.6), n(12, 22, 2, 0.65), n(14, 19, 2, 0.6)]], tailChance: 0.35,
            pickups: [[nx(12, 17, 2, 0.6, F), nx(14, 16, 2, 0.7)]], pickupChance: 0.4,
            leads: [
              // the melody the chord had: the pentatonic on the top strings, a double stop on the way down
              [n(0, 24, 2, 0.8, V), n(2, 26, 1, 0.65, F), n(3, 24, 1, 0.6), n(4, 22, 2, 0.75), d(6, 19, 24, 2, 0.65), n(8, 19, 2, 0.7), b(10, 17, 2, 4, 0.8, V), n(14, 12, 2, 0.6)],
              [d(0, 24, 28, 3, 0.8), n(3, 26, 1, 0.6, F), n(4, 24, 2, 0.75), n(6, 22, 2, 0.7), n(8, 24, 4, 0.75, V), n(12, 19, 2, 0.65), n(14, 22, 2, 0.6)],
              [sl(0, 22, 24, 2, 0.8), n(2, 26, 2, 0.65, F), n(4, 24, 2, 0.75), n(6, 19, 2, 0.65), d(8, 16, 19, 2, 0.65), d(10, 12, 16, 2, 0.6), n(12, 12, 4, 0.7, V)],
            ],
            leadChance: 0.5,
            easy: { figure: [s(0, 4, 0.85, 'bass'), s(4, 4, 0.7, 'mid'), s(8, 4, 0.8, 'bass'), s(12, 4, 0.65, 'mid')] },
          },
                    {
            name: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)',
            why: 'What Mayfield and Cropper play and Hendrix took: 6ths on the D and B strings slid into from a fret below, the 2nd rolling onto the 3rd and the 4th onto the 5th in double stops, a 4th on the top two strings slid up to it. Two notes at a time, restraint between them. In Chords the hammered notes are free, so the roll keeps its sus.',
            figure: [sl(0, 15, 16, 2, 0.75), d(2, 16, 24, 2, 0.75), n(4, 24, 2, 0.5), h(6, 26, 28, 2, 0.7, R2F), d(8, 12, 21, 2, 0.75, F), n(10, 16, 2, 0.5), h(12, 17, 19, 2, 0.7, F), d(14, 16, 24, 2, 0.6)],
            variants: [
              [d(0, 16, 24, 3, 0.8), d(3, 17, 26, 1, 0.55, F), d(4, 16, 24, 2, 0.7), h(8, 26, 28, 2, 0.7, R2F), n(10, 19, 2, 0.55), h(12, 17, 19, 2, 0.7, F), n(14, 24, 2, 0.55)],
              [d(0, 12, 21, 2, 0.75, F), d(2, 16, 24, 2, 0.7), d(4, 17, 26, 2, 0.7, F), s(6, 2, 0.5, 'mid'), h(8, 26, 28, 2, 0.7, R2F), h(10, 17, 19, 2, 0.65, F), d(12, 19, 24, 4, 0.7)],
            ],
            fills: [
              [d(0, 16, 24, 2, 0.75), d(2, 17, 26, 2, 0.6, F), d(4, 12, 21, 2, 0.7, F), n(8, 24, 2, 0.7, V), n(10, 22, 2, 0.6), n(12, 19, 4, 0.7)],
            ],
            fillsOnChange: [
              [d(0, 16, 24, 2, 0.75), h(4, 26, 28, 2, 0.7, R2F), n(6, 19, 2, 0.55), n(8, 22, 2, 0.65), n(10, 19, 2, 0.6), nx(12, 17, 2, 0.6), nx(14, 16, 2, 0.75)],
              [sl(0, 14, 16, 2, 0.75), d(2, 16, 24, 2, 0.7), n(6, 24, 2, 0.6), d(8, 17, 26, 2, 0.6, F), nx(12, 15, 2, 0.6), nx(14, 0, 2, 0.75)],
            ],
            fillsOnStay: [
              [d(0, 16, 24, 2, 0.75), n(4, 24, 2, 0.55), h(6, 26, 28, 2, 0.7, R2F), h(8, 17, 19, 2, 0.7, F), n(10, 24, 2, 0.55), d(12, 16, 24, 4, 0.7)],
            ],
            leads: [
              [d(0, 19, 24, 2, 0.75), n(2, 26, 2, 0.6, F), n(4, 24, 2, 0.75), n(6, 22, 2, 0.65), n(8, 24, 4, 0.75, V), d(12, 16, 19, 2, 0.6), n(14, 19, 2, 0.6)],
              [h(0, 17, 19, 2, 0.75, F), n(2, 24, 2, 0.6), h(4, 21, 22, 2, 0.7, F), n(6, 24, 2, 0.6), n(8, 19, 2, 0.7), d(10, 16, 24, 2, 0.65), n(12, 12, 4, 0.7, V)],
            ],
            leadChance: 0.5,
          },
                    {
            name: 'Chord-melody lead (the Leslie lead)',
            why: 'A lead part, the way the solo on a ballad of his goes: the minor pentatonic on the top three strings with the 9th and the major 3rd let in as passing colour, double stops out of the shape between the phrases, a slide up into the box above and back, wide vibrato on the held note, a unison bend at the top. Every line is written against the chord it sits on, so it follows the changes.',
            figure: [n(0, 12, 2, 0.8, V), n(2, 14, 1, 0.65, F), n(3, 12, 1, 0.6), n(4, 10, 2, 0.75), n(6, 7, 2, 0.7), d(8, 7, 12, 2, 0.7), n(10, 12, 2, 0.7), b(12, 10, 2, 4, 0.85, V)],
            variants: [
              // up into the box above for a phrase, then home
              [sl(0, 12, 17, 2, 0.8, { reach: 5 }), n(2, 19, 2, 0.75, { reach: 5 }), n(4, 17, 2, 0.7, { reach: 5 }), n(6, 16, 2, 0.65, { free: true, reach: 5 }), n(8, 12, 2, 0.75), n(10, 10, 2, 0.7), n(12, 7, 4, 0.75, V)],
              [un(0, 24, 4, 0.85, V), n(4, 22, 2, 0.7), n(6, 19, 2, 0.7), d(8, 16, 19, 2, 0.65), n(10, 14, 2, 0.6, F), n(12, 12, 4, 0.75, V)],
              [d(0, 12, 16, 2, 0.75), d(2, 10, 14, 2, 0.65, F), d(4, 7, 12, 2, 0.7), n(6, 12, 2, 0.65), n(8, 14, 1, 0.6, F), n(9, 12, 1, 0.6), n(10, 10, 2, 0.7), n(12, 12, 4, 0.75, V)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 7, 2, 0.75), n(2, 10, 2, 0.7), n(4, 12, 2, 0.75), n(6, 14, 2, 0.65, F), n(8, 12, 4, 0.8, V), p(12, 10, 7, 2, 0.7), n(14, 5, 2, 0.6)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.8, V), n(4, 10, 2, 0.7), n(6, 7, 2, 0.7), n(8, 5, 2, 0.65), n(10, 3, 2, 0.65), nx(12, 4, 2, 0.7), nx(14, 7, 2, 0.75, V)],
              [b(0, 10, 2, 4, 0.85, V), n(4, 7, 2, 0.7), d(6, 4, 7, 2, 0.65), n(8, 3, 2, 0.65), n(10, 0, 2, 0.7), nx(12, 12, 2, 0.7), nx(14, 10, 2, 0.65)],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.8), n(1, 12, 1, 0.5), n(2, 12, 2, 0.75), n(4, 10, 2, 0.7), b(6, 7, 2, 2, 0.8, V), n(8, 7, 2, 0.65), d(10, 4, 7, 2, 0.6), n(12, 0, 4, 0.7, V)],
            ],
            tails: [[n(12, 14, 1, 0.6, F), n(13, 12, 1, 0.6), n(14, 10, 2, 0.65)]], tailChance: 0.3,
            easy: { figure: [n(0, 12, 4, 0.8), n(4, 10, 4, 0.75), n(8, 7, 4, 0.7), n(12, 12, 4, 0.75)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Fuzz riff (the Hendrix chord)', inspired: '"Purple Haze", "Foxy Lady", "Spanish Castle Magic", "Stone Free"', style: 'hendrix',
        progression: ['E7#9', 'G', 'A', 'E7#9', 'G', 'A'], key: 'E', tempo: 108,
        why: `<p>The E7♯9 as home — major 3rd and ♯9 (the ♭3) in one grip, a tritone inside it, a chord that never resolves, so tension is the state of the song (Mermikides). Around it the ♭III and the IV, and a riff in the E minor pentatonic with the ♭5 let in, doubled with the bass and muted between the notes. The band drives: kick on 1, the "and of 2" and 3, the snare hard, the bass in eighths on the root.</p>`,
        band: { grid: 16, kick: [0, 6, 8, 10], kickVel: 0.95, snare: [4, 12], snareVel: 0.95, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'dom7',
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: 0, dur: 1.8, vel: k % 4 === 0 ? 0.95 : 0.75 })), bassApproach: true,
                chord: [{ slot: 0, dur: 3, vel: 0.45 }], fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: '7♯9 stabs and the riff',
            blues: true,
            why: 'The Hendrix chord struck on one and left to ring, then the riff on the low strings: root, ♭3, root, the 4th, the ♭5 as a passing note (free, so it stays a ♭5 in every reading) up to the 5th, in eighths, muted between. The variant says the riff in octaves the way the Octavia would. The fills climb the box and land on the next root.',
            figure: [s(0, 3, 0.95, 'sharp9', null, { stroke: 'down' }), n(6, 0, 2, 0.85, PM), n(8, 3, 2, 0.85, PM), n(10, 0, 2, 0.8, PM), n(12, 5, 2, 0.85, PM), n(14, 6, 1, 0.8, { free: true, pm: true }), n(15, 7, 1, 0.85, PM)],
            variants: [
              [d(0, 0, 12, 2, 0.9), d(2, 0, 12, 2, 0.7), d(4, 3, 15, 2, 0.85), d(6, 0, 12, 2, 0.7), d(8, 5, 17, 2, 0.85), d(10, 6, 18, 1, 0.8, F), d(11, 7, 19, 1, 0.85), s(12, 3, 0.9, 'sharp9', null, { stroke: 'down' })],
              [s(0, 1.5, 0.95, 'sharp9', null, { stroke: 'down' }), s(2, 1.5, 0.7, 'sharp9', 'mute'), s(4, 3, 0.9, 'sharp9', null, { stroke: 'down' }), n(8, 0, 2, 0.85, PM), n(10, 3, 2, 0.8, PM), n(12, 5, 2, 0.85, PM), n(14, 7, 2, 0.85, PM)],
            ],
            fills: [
              [s(0, 3, 0.95, 'sharp9', null, { stroke: 'down' }), n(6, 12, 2, 0.85), n(8, 10, 2, 0.8), n(10, 7, 2, 0.8), n(12, 6, 1, 0.75, F), n(13, 5, 1, 0.8), n(14, 3, 2, 0.85)],
            ],
            fillsOnChange: [
              [n(0, 0, 2, 0.9, PM), n(2, 3, 2, 0.85, PM), n(4, 5, 2, 0.85, PM), n(6, 7, 2, 0.85, PM), n(8, 10, 2, 0.85), n(10, 12, 2, 0.85), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9)],
              [s(0, 3, 0.95, 'sharp9', null, { stroke: 'down' }), n(6, 7, 2, 0.85), n(8, 6, 1, 0.75, F), n(9, 5, 1, 0.8), n(10, 3, 2, 0.85), nx(12, -2, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
            ],
            fillsOnStay: [
              [s(0, 3, 0.95, 'sharp9', null, { stroke: 'down' }), b(6, 10, 2, 4, 0.9, V), n(10, 7, 2, 0.8), n(12, 5, 2, 0.8), n(14, 3, 2, 0.85)],
            ],
            leads: [
              [un(0, 24, 4, 0.9, V), n(4, 22, 2, 0.8), n(6, 19, 2, 0.8), n(8, 17, 2, 0.75), n(10, 15, 2, 0.8), n(12, 12, 4, 0.85, V)],
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 12, 1, 0.6), n(2, 15, 2, 0.85), b(4, 17, 2, 4, 0.9, V), n(8, 15, 2, 0.8), n(10, 12, 2, 0.8), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85, V)],
              [n(0, 19, 2, 0.85, { trill: 22 }), n(2, 19, 2, 0.6), n(4, 17, 2, 0.8), n(6, 15, 2, 0.8), n(8, 16, 1, 0.75, F), n(9, 15, 1, 0.8), n(10, 12, 2, 0.85), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85, V)],
            ],
            leadChance: 0.5,
            stops: [[s(0, 2, 1, 'sharp9', null, { stroke: 'down' }), n(8, 12, 2, 0.9, { rake: true }), n(10, 10, 2, 0.85), n(12, 7, 2, 0.85), n(14, 3, 2, 0.9)]], stopChance: 0.15,
            easy: { figure: [s(0, 4, 0.9, 'sharp9', null, { stroke: 'down' }), n(8, 0, 2, 0.85), n(10, 3, 2, 0.8), n(12, 5, 2, 0.85), n(14, 7, 2, 0.85)] },
          },
          {
            name: 'Power chords with the open strings',
            blues: true,
            why: 'The other fuzz rhythm: root-and-5th chords hit hard, the low strings ringing open where the shape lets them, the ♭III and the IV slid into from a fret below, the riff between them in the pentatonic with a muted scratch on the "e". What Spanish Castle Magic and Stone Free are built from.',
            figure: [s(0, 2, 0.95, 'power'), s(2, 1, 0.55, 'power', 'mute'), s(3, 1, 0.5, 'power', 'mute'), s(4, 2, 0.85, 'power'), s(6, 2, 0.8, 'power', null, { chordSlide: 1 }), s(8, 2, 0.95, 'power'), n(10, 10, 2, 0.8, PM), n(12, 7, 2, 0.8, PM), n(14, 5, 1, 0.75, PM), n(15, 3, 1, 0.75, PM)],
            variants: [
              [s(0, 2, 0.95, 'power'), g(2, 1, 0.4, 'low'), s(3, 1, 0.8, 'power'), g(5, 1, 0.4, 'low'), s(6, 2, 0.85, 'power'), s(8, 2, 0.95, 'power'), g(10, 1, 0.4, 'low'), s(11, 1, 0.8, 'power'), s(12, 4, 0.9, 'power')],
              [s(0, 4, 0.95, 'power'), n(4, 0, 2, 0.85, PM), n(6, 3, 2, 0.8, PM), s(8, 2, 0.95, 'power'), s(10, 2, 0.8, 'power', null, { chordSlide: -1 }), n(12, 5, 2, 0.8, PM), n(14, 7, 2, 0.85, PM)],
            ],
            fills: [
              [s(0, 2, 0.95, 'power'), s(2, 2, 0.7, 'power', 'mute'), n(4, 12, 2, 0.85), n(6, 10, 2, 0.8), n(8, 12, 2, 0.85), n(10, 15, 2, 0.8), b(12, 17, 2, 4, 0.9, V)],
            ],
            fillsOnChange: [
              [s(0, 2, 0.95, 'power'), s(2, 2, 0.7, 'power', 'mute'), s(4, 2, 0.85, 'power'), n(8, 7, 2, 0.8, PM), n(10, 5, 2, 0.8, PM), nx(12, -2, 2, 0.85, PM), nx(14, -1, 2, 0.85, PM)],
              [s(0, 4, 0.95, 'power'), n(6, 3, 2, 0.8, PM), n(8, 5, 2, 0.8, PM), n(10, 6, 1, 0.75, { free: true, pm: true }), n(11, 7, 1, 0.8, PM), sn(12, 4, 0.9, 'power')],
            ],
            fillsOnStay: [
              [s(0, 2, 0.95, 'power'), n(4, 0, 1, 0.85, PM), n(5, 0, 1, 0.6, PM), n(6, 3, 2, 0.8, PM), n(8, 0, 2, 0.85, PM), n(10, 5, 2, 0.8, PM), n(12, 6, 1, 0.75, { free: true, pm: true }), n(13, 5, 1, 0.75, PM), n(14, 3, 2, 0.8, PM)],
            ],
            leads: [
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 2, 0.8), n(10, 0, 2, 0.85), d(12, 0, 12, 4, 0.85)],
              [n(0, 12, 2, 0.85, { rake: true }), n(2, 15, 2, 0.8), n(4, 17, 2, 0.8), un(6, 24, 4, 0.9, V), n(10, 19, 2, 0.8), n(12, 15, 2, 0.8), n(14, 12, 2, 0.85)],
            ],
            leadChance: 0.4,
          },
          {
            name: 'Fuzz lead over the vamp',
            blues: true,
            why: 'A lead part in the language of the fuzz solos: the minor pentatonic from the box at the root, the Dorian 6th and the major 3rd against it as free notes, a run up into the box above, the unison bend on the top two strings, the trill, a rake into the high root, the step-and-a-half bend held with vibrato. Phrases answer each other two bars at a time.',
            figure: [n(0, 12, 2, 0.85, { rake: true }), n(2, 15, 2, 0.8), b(4, 17, 2, 4, 0.9, V), n(8, 15, 2, 0.8), n(10, 12, 2, 0.8), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85, V)],
            variants: [
              [sl(0, 15, 19, 2, 0.85, { reach: 5 }), n(2, 22, 2, 0.8, { reach: 5 }), n(4, 24, 2, 0.85, { reach: 5 }), b(6, 22, 2, 4, 0.9, { vib: true, reach: 5 }), n(10, 19, 2, 0.8, { reach: 5 }), n(12, 17, 2, 0.75), n(14, 15, 2, 0.8)],
              [un(0, 24, 4, 0.9, V), n(4, 22, 2, 0.8), n(6, 19, 2, 0.8), n(8, 21, 1, 0.75, F), n(9, 19, 1, 0.8), n(10, 17, 2, 0.8), n(12, 15, 2, 0.8), n(14, 12, 2, 0.85)],
              [n(0, 19, 3, 0.85, { trill: 22 }), n(3, 17, 1, 0.75), n(4, 15, 2, 0.8), n(6, 16, 1, 0.75, F), n(7, 15, 1, 0.8), b(8, 10, 3, 4, 0.9, V), n(12, 7, 2, 0.8), n(14, 5, 2, 0.8)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 12, 1, 0.6), n(2, 12, 2, 0.85), n(4, 10, 2, 0.8), n(6, 7, 2, 0.8), n(8, 6, 1, 0.75, F), n(9, 5, 1, 0.8), n(10, 3, 2, 0.8), n(12, 0, 4, 0.85, V)],
            ],
            fillsOnChange: [
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9, V)],
              [n(0, 15, 2, 0.85), n(2, 12, 2, 0.8), n(4, 10, 2, 0.8), n(6, 12, 2, 0.8), n(8, 15, 2, 0.8), n(10, 17, 2, 0.8), nx(12, 15, 2, 0.8), nx(14, 12, 2, 0.9, V)],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.85, { stacc: true }), n(1, 12, 1, 0.6, { stacc: true }), n(2, 12, 1, 0.85, { stacc: true }), n(3, 12, 1, 0.6, { stacc: true }), n(4, 15, 2, 0.85), n(6, 12, 2, 0.8), b(8, 10, 2, 6, 0.9, V), n(14, 7, 2, 0.8)],
            ],
            easy: { figure: [n(0, 12, 4, 0.85), n(4, 15, 4, 0.8), n(8, 17, 4, 0.85), n(12, 12, 4, 0.85)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Slow blues in 12/8 (Red House way)', inspired: '"Red House", "Hear My Train A Comin\'", Albert King\'s and B.B. King\'s slow blues', style: 'hendrix',
        progression: ['B7', 'E9', 'B7', 'F#7', 'E9', 'B7'], key: 'B', tempo: 60,
        why: `<p>The twelve-bar in 12/8 he played in B (a half-step down on the record), the IV as a 9th chord. The comp is the T-Bone/B.B. grip — the 9th chord with the root on the A string, slid in from a fret below, the 3rd trilled against the 4th — and the lead is a voice: major and minor pentatonic mixed over the dominant chords, bends of a step and a step and a half, the shake, rakes, triplet pull-offs, and silence. The band lays back: the ride on every triplet, the bass climbing root–3–5–6.</p>`,
        band: { grid: 12, kick: [0, 6, 8], kickVel: 0.6, snare: [3, 9], snareVel: 0.85, ghost: [2, 8], hat: [3, 9], ride: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 3, vel: 0.9 }, { slot: 3, off: 4, dur: 3, vel: 0.7 }, { slot: 6, off: 7, dur: 3, vel: 0.8 }, { slot: 9, off: 9, dur: 3, vel: 0.7 }], bassApproach: true,
                chord: [{ slot: 0, dur: 2.5, vel: 0.5 }, { slot: 6, dur: 2.5, vel: 0.45 }], fill: { snare: [9, 10, 11], kick: [0, 6] } },
        parts: [
          {
            name: '9th chords with the trill',
            why: 'The 9th grip on one, muted on the third triplet, slid in from a fret below on three; the 3rd trilled against the 4th on the way to the change; a chromatic step up under the next root. The turnaround walks the 6ths down over the root the way a blues band does.',
            figure: [s(0, 2.5, 0.8, 'ninth'), s(2, 0.8, 0.45, 'ninth', 'mute'), s(3, 2.5, 0.75, 'ninth'), s(6, 2.5, 0.8, 'ninth', null, { chordSlide: 1 }), n(9, 4, 2, 0.75, { trill: 5 }), n(11, 0, 1, 0.6)],
            variants: [
              [s(0, 2.5, 0.8, 'ninth'), s(3, 0.8, 0.5, 'ninth', 'mute'), n(4, 3, 1, 0.65), h(5, 3, 4, 2, 0.75), n(7, 7, 1, 0.6), s(8, 0.8, 0.5, 'ninth', 'mute'), s(9, 2.5, 0.8, 'ninth', null, { chordSlide: 1 })],
              [s(0, 5, 0.8, 'ninth'), n(6, 10, 2, 0.75, V), n(8, 7, 1, 0.6), s(9, 2.5, 0.8, 'ninth', null, { chordSlide: 1 })],
            ],
            fills: [
              [s(0, 2.5, 0.8, 'ninth'), b(3, 5, 2, 3, 0.85, V), n(6, 3, 1, 0.7), n(7, 0, 1, 0.65), n(8, 10, 1, 0.65), n(9, 7, 3, 0.75, V)],
            ],
            fillsOnChange: [
              [s(0, 2.5, 0.8, 'ninth'), s(3, 2.5, 0.75, 'ninth'), n(6, 10, 2, 0.75), n(8, 9, 1, 0.65, F), nx(9, -2, 1.5, 0.75), nx(10, -1, 1.5, 0.8), nx(11, 0, 1, 0.85)],
              [s(0, 2.5, 0.8, 'ninth'), n(3, 4, 2, 0.75, { trill: 5 }), n(5, 7, 1, 0.65), n(6, 10, 2, 0.75, V), nx(9, 4, 1.5, 0.75), nx(11, 7, 1, 0.7)],
            ],
            fillsOnStay: [
              [s(0, 2.5, 0.8, 'ninth'), s(3, 0.8, 0.45, 'ninth', 'mute'), h(4, 3, 4, 2, 0.75), n(6, 0, 1, 0.6), n(7, 3, 1, 0.65), n(8, 4, 1, 0.65), s(9, 2.5, 0.8, 'ninth', null, { chordSlide: 1 })],
            ],
            turnaround: [d(0, 10, 12, 1.5, 0.8), d(2, 10, 12, 0.8, 0.5), d(3, 9, 12, 1.5, 0.8), d(5, 9, 12, 0.8, 0.5), d(6, 7, 12, 1.5, 0.8), n(8, 7, 0.8, 0.5), nx(9, 1, 1.5, 0.8), nx(11, 0, 1, 0.85)],
            leads: [
              [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(2, 10, 1, 0.7), n(3, 7, 2, 0.75), b(5, 5, 3, 4, 0.9, V), n(9, 3, 1, 0.7), n(10, 4, 1, 0.7, F), n(11, 0, 1, 0.75)],
              [b(0, 10, 2, 3, 0.9, V), p(3, 10, 7, 1, 0.75), n(4, 5, 1, 0.7), n(5, 3, 1, 0.7), n(6, 0, 3, 0.8, V), n(9, 7, 2, 0.7), n(11, 10, 1, 0.65)],
            ],
            leadChance: 0.5,
            easy: { figure: [s(0, 3, 0.8, 'ninth'), s(3, 3, 0.7, 'ninth'), s(6, 3, 0.8, 'ninth'), s(9, 3, 0.7, 'ninth')] },
          },
          {
            name: 'Vocal blues lead (major and minor mixed)',
            blues: true,
            why: 'The lead as a voice, in the box at the root: the 4th bent a whole step to the 5th and shaken; the ♭3 bent a quarter, then a step and a half from the 4th up to the 6th (Albert King\'s bend); the major 3rd against the minor pentatonic as a free note; triplet pull-offs from the ♭3 to the root; a rake into the high root; and a whole beat of nothing. The change fills land on the next chord\'s 3rd or come up under its root; the turnaround is the classic walk-down.',
            figure: [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(2, 10, 1, 0.7), n(3, 7, 3, 0.75), b(6, 5, 2, 4, 0.9, V), n(10, 3, 1, 0.7), n(11, 0, 1, 0.75)],
            variants: [
              [b(0, 5, 3, 3, 0.9, V), n(3, 7, 1, 0.7), n(4, 4, 1, 0.7, F), n(5, 3, 1, 0.7), n(6, 0, 3, 0.8, V), p(9, 15, 12, 1, 0.75), n(10, 10, 1, 0.65), n(11, 7, 1, 0.7)],
              [n(0, 19, 2, 0.85, { reach: 5, vib: true }), n(2, 17, 1, 0.7, { reach: 5 }), b(3, 15, 2, 3, 0.9, { reach: 5, vib: true }), n(6, 12, 2, 0.8), n(8, 10, 1, 0.7), n(9, 7, 3, 0.8, V)],
              [n(0, 12, 1, 0.85, { stacc: true }), n(1, 12, 1, 0.6, { stacc: true }), n(2, 12, 1, 0.85), n(3, 10, 1, 0.75), n(4, 7, 1, 0.7), n(5, 5, 1, 0.7), n(6, 6, 1, 0.7, F), n(7, 5, 1, 0.7), n(8, 3, 1, 0.75), n(9, 0, 3, 0.85, V)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 7, 1, 0.75), n(1, 10, 1, 0.75), b(2, 10, 2, 4, 0.9, V), n(6, 7, 1, 0.7), n(7, 5, 1, 0.7), n(8, 3, 1, 0.7), n(9, 0, 3, 0.85, V)],
            ],
            fillsOnChange: [
              [b(0, 5, 2, 3, 0.9, V), n(3, 3, 1, 0.7), n(4, 4, 1, 0.7, F), n(5, 0, 1, 0.75), n(6, 10, 2, 0.75), nx(8, 4, 1, 0.75), nx(9, 7, 3, 0.85, V)],
              [n(0, 12, 3, 0.85, { rake: true, vib: true }), n(3, 10, 1, 0.7), n(4, 7, 1, 0.7), n(5, 3, 1, 0.7), n(6, 0, 3, 0.8), nx(9, -2, 1.5, 0.75), nx(11, -1, 1, 0.8)],
            ],
            fillsOnStay: [
              [n(0, 3, 1, 0.75), n(1, 4, 1, 0.75, F), n(2, 7, 1, 0.8), n(3, 7, 3, 0.8, V), p(6, 15, 12, 1, 0.75), n(7, 10, 1, 0.7), n(8, 7, 1, 0.7), b(9, 5, 2, 3, 0.9, V)],
            ],
            turnaround: [n(0, 12, 1, 0.85), n(1, 10, 1, 0.75), n(2, 9, 1, 0.75, F), n(3, 7, 3, 0.8, V), n(6, 6, 1, 0.7, F), n(7, 5, 1, 0.7), n(8, 3, 1, 0.75), nx(9, 1, 1.5, 0.8), nx(11, 0, 1, 0.85)],
            tails: [[p(9, 15, 12, 1, 0.75), n(10, 10, 1, 0.7), n(11, 7, 1, 0.7)]], tailChance: 0.3,
            easy: { figure: [n(0, 12, 3, 0.85), n(3, 10, 3, 0.75), n(6, 7, 3, 0.8), n(9, 0, 3, 0.8)] },
          },
          {
            name: 'Call and answer (stabs and licks)',
            blues: true,
            why: 'Both jobs in one hand, the way he comped his own blues: the 9th chord as a stab on one and three, a lick in the box answering it — the ♭3 hammered to the 3rd, the 5th bent from the 4th, the ♭7 pushed onto the next chord — and room to breathe. With the blend on Lead it is the vocal lead; on Rhythm the stabs alone.',
            figure: [s(0, 2, 0.85, 'ninth', null, { stroke: 'down' }), h(3, 3, 4, 2, 0.75), n(5, 0, 1, 0.6), s(6, 2, 0.8, 'ninth', null, { stroke: 'down' }), n(9, 7, 2, 0.75, { rake: true }), n(11, 5, 1, 0.6)],
            variants: [
              [s(0, 2, 0.85, 'ninth', null, { stroke: 'down' }), b(3, 5, 2, 3, 0.85, V), s(6, 2, 0.8, 'ninth', null, { stroke: 'down' }), n(9, 3, 1, 0.7), n(10, 4, 1, 0.7, F), n(11, 0, 1, 0.7)],
              [n(0, 0, 2, 0.8), s(3, 2, 0.85, 'ninth', null, { chordSlide: 1 }), n(6, 7, 1, 0.8), n(8, 7, 1, 0.5), s(9, 2.5, 0.8, 'ninth', null, { stroke: 'down' })],
            ],
            fills: [
              [n(0, 7, 1, 0.85), n(1, 6, 1, 0.7, F), n(2, 5, 1, 0.75), n(3, 3, 2, 0.85), n(5, 0, 1, 0.6), n(6, 0, 3, 0.85, V), n(9, 10, 2, 0.75), n(11, 12, 1, 0.7)],
            ],
            fillsOnChange: [
              [b(0, 5, 2, 3, 0.9, V), n(3, 7, 2, 0.8), n(5, 7, 1, 0.5), n(6, 10, 3, 0.85), nx(9, 4, 3, 0.85, V)],
              [s(0, 2, 0.8, 'ninth', null, { stroke: 'down' }), n(3, 3, 1, 0.75), n(4, 4, 1, 0.75, F), n(5, 7, 1, 0.8), n(6, 10, 2, 0.85, { rake: true }), nx(9, -2, 1.5, 0.75), nx(11, -1, 1, 0.8)],
            ],
            fillsOnStay: [
              [s(0, 2, 0.85, 'ninth', null, { stroke: 'down' }), n(3, 10, 2, 0.8, V), n(5, 7, 1, 0.6), s(6, 2, 0.8, 'ninth', null, { stroke: 'down' }), p(9, 15, 12, 1, 0.75), n(10, 10, 1, 0.7), n(11, 7, 1, 0.7)],
            ],
            turnaround: [d(0, 10, 12, 1.5, 0.8), d(3, 9, 12, 1.5, 0.8), d(6, 7, 12, 1.5, 0.8), n(8, 7, 0.8, 0.5), nx(9, 1, 1.5, 0.8), nx(11, 0, 1, 0.85)],
            leads: [
              [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(2, 10, 1, 0.7), n(3, 7, 3, 0.75), b(6, 5, 2, 4, 0.9, V), n(10, 3, 1, 0.7), n(11, 0, 1, 0.75)],
              [b(0, 5, 3, 3, 0.9, V), n(3, 7, 1, 0.7), n(4, 4, 1, 0.7, F), n(5, 3, 1, 0.7), n(6, 0, 3, 0.8, V), p(9, 15, 12, 1, 0.75), n(10, 10, 1, 0.65), n(11, 7, 1, 0.7)],
            ],
            leadChance: 0.5,
            stops: [[s(0, 3, 0.95, 'ninth', null, { stroke: 'down' }), n(6, 12, 2, 0.9, { rake: true }), n(8, 10, 1, 0.8), n(9, 7, 3, 0.85, V)]], stopChance: 0.2,
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Funk rock (Band of Gypsys)', inspired: '"Freedom", "Izabella", "Ezy Ryder", "Who Knows", "Power of Soul"', style: 'hendrix',
        progression: ['C', 'Eb', 'C7', 'F7', 'C', 'Eb'], key: 'C', tempo: 104,
        why: `<p>The funk of the last year: sixteenth-note scratches with the wah rocking under them, the 9th and the 7♯9 punched on the "and of 2", a single-note riff on the low strings with muted ghost notes between the notes, doubled with the bass (Guitar Player's "five rules": syncopations articulated with muting, slurs, trills and bends). The kit is tight — kick on 1 and the "and of 2", ghost snares, the hat in sixteenths with a bark on the "and of 4".</p>`,
        band: { grid: 16, kick: [0, 3, 8, 11], kickVel: 0.9, snare: [4, 12], snareVel: 0.85, ghost: [7, 10, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatOpen: [6, 14], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 1.8, vel: 0.95 }, { slot: 3, off: 0, dur: 0.9, vel: 0.6 }, { slot: 6, off: 12, dur: 1.5, vel: 0.75 }, { slot: 8, off: 0, dur: 1.8, vel: 0.9 }, { slot: 11, off: 10, dur: 0.9, vel: 0.65 }, { slot: 14, off: 12, dur: 1.5, vel: 0.7 }], bassApproach: true,
                chord: [{ slot: 6, dur: 1.5, vel: 0.4 }, { slot: 14, dur: 1.5, vel: 0.4 }] },
        parts: [
          {
            name: 'Sixteenth scratch with the wah',
            blues: true,
            why: 'The pick moving in sixteenths whether or not the strings ring — the muted scratch with the wah rocking on every stroke — and the chord on the "and of 2" and the "and of 4", the 9th grip on the "and of 4" in the variant. The fills are the pentatonic riff in place of the last two scratches.',
            figure: [g(0, 0.9, 0.55, 'high', W), g(1, 0.9, 0.4, 'high', W), g(2, 0.9, 0.45, 'high', W), g(3, 0.9, 0.4, 'high', W), g(4, 0.9, 0.55, 'high', W), g(5, 0.9, 0.4, 'high', W), s(6, 1.5, 0.85, 'high', null, W), g(8, 0.9, 0.55, 'high', W), g(9, 0.9, 0.4, 'high', W), g(10, 0.9, 0.45, 'high', W), g(11, 0.9, 0.4, 'high', W), g(12, 0.9, 0.55, 'high', W), g(13, 0.9, 0.4, 'high', W), s(14, 1.5, 0.85, 'high', null, W)],
            variants: [
              [...scratch(0.42).filter(x => ![6, 7, 14, 15].includes(x.at)), s(6, 2, 0.85, 'sharp9', null, { stroke: 'down' }), s(14, 2, 0.85, 'ninth', null, { stroke: 'down' })],
              [s(0, 1.5, 0.85, 'high', null, W), g(2, 0.9, 0.45, 'high', W), g(3, 0.9, 0.4, 'high', W), s(4, 1.5, 0.75, 'high', 'mute', W), g(6, 0.9, 0.45, 'high', W), s(7, 1, 0.8, 'high', null, W), g(8, 0.9, 0.5, 'high', W), g(9, 0.9, 0.4, 'high', W), s(10, 1.5, 0.8, 'high', null, W), g(12, 0.9, 0.5, 'high', W), g(13, 0.9, 0.4, 'high', W), s(14, 1.5, 0.8, 'high', null, W)],
            ],
            fills: [
              [g(0, 0.9, 0.55, 'high', W), g(1, 0.9, 0.4, 'high', W), s(2, 1.5, 0.8, 'high', null, W), g(4, 0.9, 0.55, 'high', W), g(5, 0.9, 0.4, 'high', W), s(6, 1.5, 0.85, 'high', null, W), n(8, 12, 2, 0.85), n(10, 10, 2, 0.8), n(12, 7, 2, 0.8), n(14, 5, 1, 0.75), n(15, 3, 1, 0.8)],
            ],
            fillsOnChange: [
              [g(0, 0.9, 0.55, 'high', W), g(1, 0.9, 0.4, 'high', W), s(2, 1.5, 0.8, 'high', null, W), g(4, 0.9, 0.55, 'high', W), g(5, 0.9, 0.4, 'high', W), s(6, 1.5, 0.85, 'high', null, W), n(8, 0, 2, 0.85, PM), n(10, 3, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
              [...scratch(0.42).filter(x => x.at < 12), nx(12, 12, 2, 0.8), sn(14, 2, 0.85, 'sharp9', { stroke: 'down' })],
            ],
            fillsOnStay: [
              [...scratch(0.42).filter(x => ![4, 5, 6, 7].includes(x.at)), s(4, 1, 0.85, 'sharp9', null, { stroke: 'down' }), s(6, 1, 0.7, 'sharp9', 'mute', W), s(7, 1, 0.8, 'sharp9', null, { stroke: 'up' })],
            ],
            leads: [
              [n(0, 12, 2, 0.85, W), n(2, 10, 2, 0.8, W), n(4, 12, 2, 0.85, W), n(6, 15, 2, 0.8, W), b(8, 17, 2, 4, 0.9, { wah: true, vib: true }), n(12, 15, 2, 0.8, W), n(14, 12, 2, 0.85, W)],
              [n(0, 7, 1, 0.85, { trill: 10 }), n(2, 7, 2, 0.6), n(4, 10, 2, 0.8), n(6, 12, 2, 0.85, W), n(8, 14, 1, 0.7, F), n(9, 12, 1, 0.75), n(10, 10, 2, 0.8, W), n(12, 7, 4, 0.85, { wah: true, vib: true })],
            ],
            leadChance: 0.4,
            easy: { figure: [s(0, 2, 0.85, 'high'), s(4, 2, 0.7, 'high', 'mute'), s(6, 2, 0.85, 'high'), s(8, 2, 0.85, 'high'), s(12, 2, 0.7, 'high', 'mute'), s(14, 2, 0.85, 'high')] },
          },
          {
            name: 'Single-note funk riff with muted ghosts',
            blues: true,
            why: 'The riff the bass doubles: root and octave, the ♭7 and the 5th on the low strings, sixteenth ghost notes (dead, muted) between the notes so the line has the pick\'s motion in it, a slide into the ♭3, a trill on the 4th. Syncopated: the second note on the "e", the chord tone on the "and".',
            figure: [n(0, 0, 1, 0.9, PM), n(1, 0, 1, 0.35, { ghost: true }), n(3, 12, 1, 0.8), n(4, 10, 2, 0.85, PM), n(6, 7, 1, 0.8, PM), n(7, 7, 1, 0.35, { ghost: true }), n(8, 0, 1, 0.9, PM), n(9, 0, 1, 0.35, { ghost: true }), sl(10, 1, 3, 2, 0.85), n(12, 5, 1, 0.8), n(13, 5, 1, 0.35, { ghost: true }), n(14, 3, 1, 0.8), n(15, 0, 1, 0.85, PM)],
            variants: [
              [n(0, 0, 1, 0.9, PM), n(1, 0, 1, 0.35, { ghost: true }), n(2, 0, 1, 0.8, PM), n(3, 12, 1, 0.8), n(6, 10, 2, 0.85), n(8, 0, 1, 0.9, PM), n(9, 0, 1, 0.35, { ghost: true }), n(10, 5, 2, 0.85, { trill: 7 }), n(12, 3, 1, 0.8), n(13, 3, 1, 0.35, { ghost: true }), n(14, 0, 2, 0.85, PM)],
              [d(0, 0, 12, 2, 0.9), n(2, 0, 1, 0.35, { ghost: true }), n(3, 10, 1, 0.8), d(4, 0, 12, 2, 0.85), n(7, 7, 1, 0.8), n(8, 0, 1, 0.9, PM), n(9, 0, 1, 0.35, { ghost: true }), n(10, 3, 2, 0.85), n(12, 5, 1, 0.8), n(13, 6, 1, 0.75, F), n(14, 7, 2, 0.85)],
            ],
            fills: [
              [n(0, 0, 1, 0.9, PM), n(1, 0, 1, 0.35, { ghost: true }), n(2, 3, 2, 0.85), n(4, 5, 1, 0.8), n(5, 6, 1, 0.75, F), n(6, 7, 2, 0.85), n(8, 10, 2, 0.85), n(10, 12, 2, 0.85), n(12, 10, 2, 0.8), n(14, 7, 2, 0.8)],
            ],
            fillsOnChange: [
              [n(0, 0, 1, 0.9, PM), n(1, 0, 1, 0.35, { ghost: true }), n(3, 12, 1, 0.8), n(4, 10, 2, 0.85, PM), n(6, 7, 2, 0.8, PM), n(8, 5, 2, 0.8, PM), n(10, 3, 2, 0.8, PM), nx(12, -3, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
              [n(0, 0, 2, 0.9, PM), sl(2, 1, 3, 2, 0.85), n(4, 5, 1, 0.8), n(5, 5, 1, 0.35, { ghost: true }), n(6, 7, 2, 0.85), n(8, 10, 2, 0.85), n(10, 12, 2, 0.85), nx(12, 12, 2, 0.8), nx(14, 10, 2, 0.8)],
            ],
            fillsOnStay: [
              [n(0, 0, 1, 0.9, PM), n(1, 0, 1, 0.35, { ghost: true }), n(2, 0, 1, 0.8, PM), n(3, 0, 1, 0.35, { ghost: true }), n(4, 3, 1, 0.85), n(5, 4, 1, 0.8, F), n(6, 5, 2, 0.85), n(8, 0, 1, 0.9, PM), n(9, 0, 1, 0.35, { ghost: true }), n(10, 10, 2, 0.85), n(12, 12, 1, 0.85), n(13, 12, 1, 0.35, { ghost: true }), n(14, 10, 2, 0.8)],
            ],
            leads: [
              [n(0, 12, 2, 0.85, { rake: true }), n(2, 15, 2, 0.8), n(4, 17, 2, 0.85), b(6, 17, 2, 4, 0.9, V), n(10, 15, 2, 0.8), n(12, 12, 2, 0.85), n(14, 10, 2, 0.8)],
              [un(0, 24, 4, 0.9, V), n(4, 22, 1, 0.8), n(5, 22, 1, 0.5), n(6, 19, 2, 0.8), n(8, 21, 1, 0.75, F), n(9, 19, 1, 0.8), n(10, 17, 2, 0.8), n(12, 15, 2, 0.8), n(14, 12, 2, 0.85, V)],
            ],
            leadChance: 0.4,
            easy: { figure: [n(0, 0, 2, 0.9), n(4, 10, 2, 0.85), n(6, 7, 2, 0.8), n(8, 0, 2, 0.9), n(10, 3, 2, 0.85), n(12, 5, 2, 0.8), n(14, 0, 2, 0.85)] },
          },
          {
            name: 'Funk lead with the wah',
            blues: true,
            why: 'A lead part over the groove: the pedal following the phrase — a sweep on the held note, the pick and the pedal together on the short ones — in the Dorian colour the funk sits in, the 6th and the 9th free against the minor pentatonic, double-stop chucks between phrases, the trill, the octave. Phrases start on the "and" and end on the beat.',
            figure: [n(2, 12, 2, 0.85, W), n(4, 15, 2, 0.8, W), n(6, 14, 1, 0.7, F), n(7, 12, 1, 0.75), b(8, 10, 2, 4, 0.9, { wah: true, vib: true }), d(12, 7, 12, 1, 0.65), d(13, 7, 12, 1, 0.5), n(14, 7, 2, 0.75, W)],
            variants: [
              [n(0, 12, 1, 0.85, { stacc: true, wah: true }), n(1, 12, 1, 0.5, { stacc: true }), n(2, 12, 1, 0.85, { stacc: true, wah: true }), n(3, 15, 1, 0.8), n(4, 17, 2, 0.85, W), n(6, 21, 1, 0.7, F), n(7, 19, 1, 0.8), n(8, 17, 2, 0.85, W), n(10, 15, 2, 0.8), n(12, 12, 4, 0.9, { wah: true, vib: true })],
              [d(0, 12, 16, 2, 0.8, W), d(2, 12, 16, 1, 0.5), n(4, 10, 2, 0.8, W), n(6, 7, 2, 0.8), n(8, 7, 2, 0.85, { trill: 10 }), n(10, 7, 2, 0.6), n(12, 10, 2, 0.8, W), n(14, 12, 2, 0.85, { wah: true, vib: true })],
              [sl(0, 12, 17, 2, 0.85, { reach: 5, wah: true }), n(2, 19, 2, 0.8, { reach: 5 }), n(4, 22, 2, 0.85, { reach: 5, wah: true }), n(6, 24, 2, 0.85, { reach: 5 }), b(8, 22, 2, 4, 0.9, { reach: 5, vib: true, wah: true }), n(12, 19, 2, 0.8, { reach: 5 }), n(14, 17, 2, 0.8)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.85, W), n(2, 10, 2, 0.8), n(4, 7, 2, 0.8, W), n(6, 5, 2, 0.8), n(8, 6, 1, 0.75, F), n(9, 5, 1, 0.8), n(10, 3, 2, 0.8, W), n(12, 0, 4, 0.85, { wah: true, vib: true })],
            ],
            fillsOnChange: [
              [b(0, 10, 2, 4, 0.9, { wah: true, vib: true }), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8, W), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8, W), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9, { wah: true, vib: true })],
              [n(0, 15, 2, 0.85, W), n(2, 12, 2, 0.8), n(4, 10, 2, 0.8, W), n(6, 12, 2, 0.8), n(8, 15, 2, 0.85, W), n(10, 17, 2, 0.8), nx(12, 15, 2, 0.8, W), nx(14, 12, 2, 0.9, { vib: true })],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.85, { stacc: true, wah: true }), n(1, 12, 1, 0.5, { stacc: true }), n(2, 12, 1, 0.85, { stacc: true, wah: true }), n(3, 12, 1, 0.5, { stacc: true }), n(4, 15, 2, 0.85, W), n(6, 12, 2, 0.8), b(8, 10, 2, 6, 0.9, { wah: true, vib: true }), n(14, 7, 2, 0.8, W)],
            ],
            easy: { figure: [n(0, 12, 4, 0.85), n(4, 15, 4, 0.8), n(8, 10, 4, 0.85), n(12, 7, 4, 0.8)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Cycle of fourths (Hey Joe way)', inspired: '"Hey Joe" — Tim Rose\'s slow arrangement of Billy Roberts\' song, as the Experience played it', style: 'hendrix',
        progression: ['C', 'G', 'D', 'A', 'E', 'E'], key: 'E', tempo: 82,
        why: `<p>Five major chords each a fourth below the last — C, G, D, A, E — and two bars of E to land on. The guitar holds thumb-over chords and walks from root to root on the low strings between them (root, 3rd, 4th, 5th, and the 5th is the next chord's root, which is only true because the chords move in fourths), with double stops out of the E-shape box answering the vocal. The lead is the E minor blues scale at the 12th fret. The band is a slow backbeat, the bass walking up into every change.</p>`,
        band: { grid: 16, kick: [0, 8, 10], kickVel: 0.85, snare: [4, 12], snareVel: 0.85, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 5.5, vel: 0.9 }, { slot: 6, off: 0, dur: 1.5, vel: 0.6 }, { slot: 8, off: 4, dur: 2, vel: 0.75 }, { slot: 10, off: 5, dur: 2, vel: 0.7 }, { slot: 12, next: true, off: -2, dur: 2, vel: 0.75 }, { slot: 14, next: true, off: -1, dur: 2, vel: 0.8 }],
                chord: [{ slot: 0, dur: 6, vel: 0.5 }, { slot: 8, dur: 4, vel: 0.4 }] },
        parts: [
          {
            name: 'Thumb chords and the walk-up',
            needs: { preset: 'Hendrix', variant: 'Cycle of fourths (Hey Joe)' },
            why: 'Written for the cycle and only the cycle: the chord on one with the thumb on the bass, the top strings on the "and", then the walk on the low strings — root, 3rd, 4th, 5th — that lands on the next chord\'s root because the next chord is a fourth below. Over any other progression the walk lands on the wrong note, so this part opens only with the "Cycle of fourths" progression loaded. The chromatic variant walks root, 2nd, ♭3, 3rd, 4th, ♭5, 5th.',
            figure: [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(4, 2, 0.55, 'high'), s(6, 2, 0.55, 'high'), n(8, 0, 2, 0.85, PM), n(10, 4, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), n(14, 7, 2, 0.85, PM)],
            variants: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(4, 2, 0.55, 'high'), s(6, 2, 0.55, 'high'), n(8, 0, 1, 0.85, PM), n(9, 2, 1, 0.8, PM), n(10, 3, 1, 0.8, { free: true, pm: true }), n(11, 4, 1, 0.8, PM), n(12, 5, 1, 0.8, PM), n(13, 6, 1, 0.8, { free: true, pm: true }), n(14, 7, 2, 0.85, PM)],
              [s(0, 2, 0.9, 'bass'), s(2, 2, 0.75, 'mid'), s(4, 2, 0.6, 'mid'), s(6, 2, 0.6, 'high'), n(8, 0, 2, 0.85, PM), n(10, 4, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), n(14, 7, 2, 0.85, PM)],
            ],
            fills: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), d(4, 7, 12, 2, 0.7), d(6, 4, 7, 2, 0.65), n(8, 0, 2, 0.85, PM), n(10, 4, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), n(14, 7, 2, 0.85, PM)],
            ],
            fillsOnChange: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(4, 2, 0.55, 'high'), n(6, 12, 2, 0.65), n(8, 0, 2, 0.85, PM), n(10, 4, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), nx(14, 0, 2, 0.9, PM)],
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), h(4, 7, 9, 2, 0.7, F), d(6, 4, 7, 2, 0.65), nx(8, -5, 2, 0.85, PM), nx(10, -3, 2, 0.8, PM), nx(12, -2, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
            ],
            fillsOnStay: [
              // the two bars of E at the end: the chord, then the pentatonic answer
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), n(6, 12, 2, 0.7), n(8, 10, 2, 0.7), n(10, 7, 2, 0.7), d(12, 4, 7, 2, 0.65), d(14, 0, 4, 2, 0.65)],
            ],
            leads: [
              [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), b(6, 5, 2, 4, 0.9, V), n(10, 3, 2, 0.75), n(12, 0, 4, 0.85, V)],
            ],
            leadChance: 0.3,
            easy: { figure: [s(0, 4, 0.9), s(4, 2, 0.55, 'high'), n(8, 0, 2, 0.85), n(10, 4, 2, 0.8), n(12, 5, 2, 0.8), n(14, 7, 2, 0.85)] },
          },
          {
            name: 'Double-stop answers between the chords',
            why: 'The same slow backbeat over any progression: the thumb chord on one, the top strings on the "and" of two, and the answer on the top three strings — 3rds and 4ths out of the pentatonic box under the shape, the 4th hammered onto the 5th, a 6th slid down — the way he answered his own vocal line.',
            figure: [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(6, 2, 0.55, 'high'), d(8, 7, 12, 2, 0.7), d(10, 4, 7, 2, 0.65), h(12, 5, 7, 2, 0.7, F), n(14, 12, 2, 0.6)],
            variants: [
              [s(0, 2, 0.9, 'bass'), s(2, 2, 0.75, 'mid'), s(6, 2, 0.55, 'high'), d(8, 4, 12, 2, 0.7), d(10, 2, 10, 2, 0.6, F), d(12, 0, 9, 2, 0.65, F), s(14, 2, 0.55, 'high')],
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(4, 2, 0.55, 'high'), s(6, 2, 0.55, 'high'), n(8, 12, 2, 0.7), n(10, 14, 1, 0.6, F), n(11, 12, 1, 0.6), n(12, 10, 2, 0.65), n(14, 7, 2, 0.65)],
            ],
            fills: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), n(6, 12, 2, 0.7), b(8, 10, 2, 4, 0.85, V), n(12, 7, 2, 0.7), n(14, 5, 2, 0.65)],
            ],
            fillsOnChange: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(6, 2, 0.55, 'high'), d(8, 7, 12, 2, 0.7), d(10, 4, 7, 2, 0.65), nx(12, 4, 2, 0.65), nx(14, 0, 2, 0.8)],
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), n(6, 7, 2, 0.65), nx(8, -5, 2, 0.8, PM), nx(10, -3, 2, 0.75, PM), nx(12, -2, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
            ],
            fillsOnStay: [
              [s(0, 4, 0.9, 'full', null, { stroke: 'down' }), s(6, 2, 0.55, 'high'), h(8, 3, 5, 2, 0.7, F), n(10, 7, 2, 0.65), d(12, 4, 7, 2, 0.65), d(14, 0, 4, 2, 0.65)],
            ],
            leads: [
              [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(2, 10, 2, 0.75), n(4, 7, 2, 0.8), b(6, 5, 2, 4, 0.9, V), n(10, 3, 2, 0.75), n(12, 0, 4, 0.85, V)],
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.75), n(8, 3, 2, 0.75), n(10, 0, 2, 0.8), d(12, 0, 12, 4, 0.8)],
            ],
            leadChance: 0.4,
          },
          {
            name: 'Blues-scale lead at the 12th',
            blues: true,
            why: 'The lead the song is remembered for, as a part: the E minor blues scale from the box at the root, the B string bent a full step and shaken, a quick run up the box and back, the ♭5 as a passing note, phrases that start after the chord lands and rest before the next. Over a major progression the minor pentatonic is the point.',
            figure: [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.75), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8), n(12, 12, 4, 0.85, V)],
            variants: [
              [n(0, 12, 1, 0.85, { rake: true }), n(1, 12, 1, 0.5), n(2, 15, 2, 0.8), n(4, 17, 2, 0.85), n(6, 18, 1, 0.75, F), n(7, 19, 1, 0.8), b(8, 17, 2, 4, 0.9, V), n(12, 15, 2, 0.8), n(14, 12, 2, 0.85)],
              [n(2, 7, 2, 0.8), n(4, 10, 2, 0.8), n(6, 12, 2, 0.85), b(8, 10, 2, 4, 0.9, V), p(12, 15, 12, 2, 0.8), n(14, 10, 2, 0.75)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.85, V), n(2, 10, 2, 0.8), n(4, 7, 2, 0.8), n(6, 6, 1, 0.75, F), n(7, 5, 1, 0.8), n(8, 3, 2, 0.8), n(10, 0, 2, 0.8), n(12, 0, 4, 0.85, V)],
            ],
            fillsOnChange: [
              [b(0, 5, 2, 4, 0.9, V), n(4, 3, 2, 0.8), n(6, 0, 2, 0.8), n(8, 10, 2, 0.8), n(10, 12, 2, 0.8), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9, V)],
              [n(0, 15, 2, 0.85), n(2, 12, 2, 0.8), n(4, 10, 2, 0.8), n(6, 12, 2, 0.8), b(8, 10, 2, 4, 0.9, V), nx(12, 4, 2, 0.8), nx(14, 7, 2, 0.85)],
            ],
            fillsOnStay: [
              [n(0, 12, 2, 0.85, { rake: true, vib: true }), n(4, 15, 2, 0.8), n(6, 12, 2, 0.8), b(8, 10, 2, 6, 0.9, V), n(14, 7, 2, 0.8)],
            ],
            easy: { figure: [n(0, 12, 4, 0.85), n(4, 10, 4, 0.8), n(8, 7, 4, 0.8), n(12, 12, 4, 0.85)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'One-chord voodoo (wah and pentatonic)', inspired: '"Voodoo Child (Slight Return)", "Machine Gun", "Voodoo Chile"', style: 'hendrix',
        progression: ['E7#9', 'E7#9', 'E7#9', 'E7#9', 'E7#9', 'E7#9'], key: 'E', tempo: 88,
        why: `<p>One chord, and everything happens on it: the intro of muted sixteenths with the wah rocking (the "West African even-before-Bo-Diddley beat", as Wikipedia has it), then the riff in the E minor pentatonic — the 4th bent to the 5th and released, the pull-off to the ♭3, the octave, the 7♯9 stab — and a lead that is the box at the root, the box above it, the machine-gun repeated note, the step-and-a-half bend held with vibrato, feedback-length notes. Straight sixteenths in a heavy pocket, the kick doubling the riff, the hat barking.</p>`,
        band: { grid: 16, kick: [0, 6, 8, 11], kickVel: 0.95, snare: [4, 12], snareVel: 0.9, ghost: [10, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatOpen: [2, 10], voice: 'dom7',
                bass: [{ slot: 0, off: 0, dur: 1.8, vel: 0.95 }, { slot: 2, off: 0, dur: 1.8, vel: 0.7 }, { slot: 4, off: 12, dur: 1.8, vel: 0.8 }, { slot: 6, off: 0, dur: 1.8, vel: 0.75 }, { slot: 8, off: 0, dur: 1.8, vel: 0.95 }, { slot: 10, off: 10, dur: 1.8, vel: 0.75 }, { slot: 12, off: 12, dur: 1.8, vel: 0.8 }, { slot: 14, off: 0, dur: 1.8, vel: 0.75 }],
                chord: [{ slot: 0, dur: 2, vel: 0.4 }] },
        parts: [
          {
            name: 'Wah scratch (the intro)',
            blues: true,
            why: 'Dead strings and the pedal: sixteen muted strokes a bar, the beats a shade harder, the wah rocking with the pick, and every second bar the riff arriving — the bend from the 4th, the pull-off, the 7♯9 stab. The intro, as a rhythm part you can keep playing.',
            figure: scratch(0.45),
            variants: [
              [...scratch(0.42).filter(x => x.at < 12), s(12, 2, 0.85, 'sharp9', null, { stroke: 'down', wah: true }), s(14, 2, 0.7, 'sharp9', 'mute', W)],
              [...scratch(0.42).filter(x => ![0, 1, 8, 9].includes(x.at)), s(0, 2, 0.9, 'sharp9', null, { stroke: 'down' }), s(8, 2, 0.85, 'sharp9', null, { stroke: 'down' })],
            ],
            fills: [
              [...scratch(0.42).filter(x => x.at < 8), b(8, 5, 2, 2, 0.9, W), p(10, 5, 3, 2, 0.8), n(12, 0, 2, 0.9, PM), d(14, 0, 12, 2, 0.85)],
            ],
            fillsOnChange: [
              [...scratch(0.42).filter(x => x.at < 8), n(8, 12, 2, 0.85, W), n(10, 10, 2, 0.8, W), n(12, 7, 2, 0.8, W), nx(14, 0, 2, 0.9, PM)],
              [...scratch(0.42).filter(x => x.at < 12), nx(12, -2, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
            ],
            fillsOnStay: [
              [...scratch(0.42).filter(x => x.at < 4 || x.at >= 12), b(4, 5, 2, 2, 0.9, V), p(6, 5, 3, 1, 0.8), n(7, 0, 1, 0.85, PM), s(8, 3, 0.95, 'sharp9', null, { stroke: 'down' })],
            ],
            leads: [
              [b(0, 5, 2, 2, 0.9, V), p(2, 5, 3, 2, 0.8), n(4, 0, 2, 0.9, PM), d(6, 0, 12, 2, 0.85), n(8, 12, 2, 0.85, { rake: true, wah: true }), n(10, 15, 2, 0.8), b(12, 17, 2, 4, 0.9, { vib: true, wah: true })],
            ],
            leadChance: 0.5,
            easy: { figure: [s(0, 2, 0.7, 'high', 'mute'), s(4, 2, 0.6, 'high', 'mute'), s(8, 2, 0.7, 'high', 'mute'), s(12, 2, 0.6, 'high', 'mute')] },
          },
          {
            name: 'Pentatonic riff with the octave drop',
            blues: true,
            why: 'The riff idiom the vamp runs on: the 4th bent a whole step to the 5th and let back, a pull-off down to the ♭3, the root on the low string, the same note an octave up (the Octavia\'s doubling written as a double stop), the Hendrix chord punched on three. Minor pentatonic over a dominant chord: the ♭3 against the major 3rd is the sound.',
            figure: [b(0, 5, 2, 2, 0.9, V), p(2, 5, 3, 2, 0.8), n(4, 0, 2, 0.9, PM), d(6, 0, 12, 2, 0.85), s(8, 3, 0.95, 'sharp9', null, { stroke: 'down' }), n(12, 10, 2, 0.8, PM), n(14, 12, 2, 0.85)],
            variants: [
              [n(0, 0, 2, 0.9, PM), n(2, 3, 2, 0.85, PM), n(4, 5, 1, 0.85), n(5, 6, 1, 0.8, F), n(6, 7, 2, 0.85), d(8, 0, 12, 2, 0.9), d(10, 0, 12, 2, 0.7), s(12, 3, 0.95, 'sharp9', null, { stroke: 'down' })],
              [b(0, 5, 2, 3, 0.9, V), n(3, 3, 1, 0.8), n(4, 0, 2, 0.9, PM), n(6, 12, 2, 0.85, { rake: true }), n(8, 10, 2, 0.8), n(10, 7, 2, 0.8), b(12, 5, 2, 4, 0.9, V)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.9, { rake: true }), n(2, 10, 2, 0.8), n(4, 7, 2, 0.8), n(6, 6, 1, 0.75, F), n(7, 5, 1, 0.8), n(8, 3, 2, 0.85), n(10, 0, 2, 0.9, PM), d(12, 0, 12, 4, 0.9)],
            ],
            fillsOnChange: [
              [b(0, 5, 2, 2, 0.9, V), p(2, 5, 3, 2, 0.8), n(4, 0, 2, 0.9, PM), n(6, 3, 2, 0.85), n(8, 5, 2, 0.85), n(10, 7, 2, 0.85), nx(12, 3, 2, 0.85), nx(14, 0, 2, 0.9, PM)],
              [d(0, 0, 12, 2, 0.9), d(2, 0, 12, 2, 0.7), n(4, 10, 2, 0.85), n(6, 12, 2, 0.85), n(8, 15, 2, 0.85), n(10, 17, 2, 0.85), sn(12, 4, 0.95, 'sharp9', { stroke: 'down' })],
            ],
            fillsOnStay: [
              [s(0, 3, 0.95, 'sharp9', null, { stroke: 'down' }), n(6, 12, 2, 0.85, { rake: true }), b(8, 10, 2, 4, 0.9, V), n(12, 7, 2, 0.8), n(14, 5, 2, 0.8)],
            ],
            leads: [
              [n(0, 12, 1, 0.9, { stacc: true }), n(1, 12, 1, 0.6, { stacc: true }), n(2, 12, 1, 0.9, { stacc: true }), n(3, 12, 1, 0.6, { stacc: true }), n(4, 15, 2, 0.85), b(6, 17, 3, 6, 0.95, V), n(12, 15, 2, 0.8), n(14, 12, 2, 0.85)],
              [sl(0, 12, 17, 2, 0.85, { reach: 5 }), n(2, 19, 2, 0.85, { reach: 5 }), un(4, 24, 4, 0.9, { reach: 5, vib: true }), n(8, 22, 2, 0.8, { reach: 5 }), n(10, 19, 2, 0.8, { reach: 5 }), n(12, 17, 2, 0.8), n(14, 15, 2, 0.8)],
            ],
            leadChance: 0.5,
            stops: [[s(0, 2, 1, 'sharp9', null, { stroke: 'down' }), b(6, 5, 2, 2, 0.9, V), p(8, 5, 3, 2, 0.8), n(10, 0, 2, 0.9, PM), d(12, 0, 12, 4, 0.9)]], stopChance: 0.2,
            easy: { figure: [n(0, 5, 2, 0.85), n(2, 3, 2, 0.8), n(4, 0, 2, 0.9), n(8, 12, 2, 0.85), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)] },
          },
          {
            name: 'Machine-gun lead',
            blues: true,
            why: 'A lead part for the long jam: the note repeated like a rifle in staccato sixteenths, the step-and-a-half bend held and shaken, notes that last a whole bar (feedback, on the record), the slide up into the box above for a phrase and the drop back, the trill, the wah opening on the held note. The E minor pentatonic with the ♭5 and the Dorian 6th let in.',
            figure: [n(0, 12, 1, 0.9, { stacc: true }), n(1, 12, 1, 0.55, { stacc: true }), n(2, 12, 1, 0.9, { stacc: true }), n(3, 12, 1, 0.55, { stacc: true }), n(4, 12, 1, 0.9, { stacc: true }), n(5, 12, 1, 0.55, { stacc: true }), n(6, 15, 2, 0.85), b(8, 17, 3, 8, 0.95, { vib: true, wah: true })],
            variants: [
              [n(0, 19, 8, 0.95, { vib: true, wah: true }), n(8, 17, 2, 0.8), n(10, 15, 2, 0.8), n(12, 12, 4, 0.9, V)],
              [sl(0, 12, 17, 2, 0.85, { reach: 5 }), n(2, 19, 2, 0.85, { reach: 5 }), n(4, 22, 2, 0.85, { reach: 5 }), n(6, 24, 2, 0.85, { reach: 5 }), b(8, 22, 2, 4, 0.9, { reach: 5, vib: true }), n(12, 19, 2, 0.8, { reach: 5 }), n(14, 17, 2, 0.8)],
              [n(0, 7, 4, 0.85, { trill: 10 }), n(4, 10, 2, 0.8), n(6, 12, 2, 0.85), n(8, 14, 1, 0.75, F), n(9, 12, 1, 0.8), n(10, 10, 2, 0.8), n(12, 6, 1, 0.75, F), n(13, 5, 1, 0.8), n(14, 3, 2, 0.85)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.9, { rake: true, vib: true }), n(4, 10, 2, 0.8), n(6, 7, 2, 0.8), b(8, 5, 2, 4, 0.9, V), n(12, 3, 2, 0.8), n(14, 0, 2, 0.85)],
            ],
            fillsOnChange: [
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 2, 0.8), n(10, 0, 2, 0.85), nx(12, 12, 2, 0.85), nx(14, 10, 2, 0.8)],
              [n(0, 12, 1, 0.9, { stacc: true }), n(1, 12, 1, 0.55, { stacc: true }), n(2, 12, 1, 0.9, { stacc: true }), n(3, 12, 1, 0.55, { stacc: true }), n(4, 15, 2, 0.85), n(6, 17, 2, 0.85), n(8, 15, 2, 0.8), n(10, 12, 2, 0.8), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9, V)],
            ],
            fillsOnStay: [
              [un(0, 24, 4, 0.9, V), n(4, 22, 2, 0.8), n(6, 19, 2, 0.8), n(8, 21, 1, 0.75, F), n(9, 19, 1, 0.8), n(10, 17, 2, 0.8), n(12, 15, 2, 0.8), n(14, 12, 2, 0.9, V)],
            ],
            easy: { figure: [n(0, 12, 2, 0.9), n(2, 12, 2, 0.6), n(4, 12, 2, 0.9), n(6, 15, 2, 0.85), n(8, 17, 8, 0.9)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Rhythm & blues (Wait Until Tomorrow way)', inspired: '"Wait Until Tomorrow", "Remember", the Isley Brothers\' "Testify" and the Cropper and Mayfield records behind them', style: 'hendrix',
        progression: ['E', 'G', 'A', 'E', 'G', 'A'], key: 'E', tempo: 118,
        why: `<p>The up-tempo R&amp;B of his sideman years, as he kept playing it: the chord on one, then the licks between the chords — double stops hammered in the E shape (the 2nd rolling onto the 3rd, the 4th onto the 5th), 6ths on the backbeat, a Stax chuck on 2 and 4 — over a bass on the root and octave and a drummer on the backbeat. The chorus changes E–G–A are the ♭III and the IV again, clean this time.</p>`,
        band: { grid: 16, kick: [0, 6, 8, 10], kickVel: 0.85, snare: [4, 12], snareVel: 0.85, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 3.5, vel: 0.9 }, { slot: 4, off: 12, dur: 1.5, vel: 0.65 }, { slot: 6, off: 0, dur: 1.5, vel: 0.7 }, { slot: 8, off: 0, dur: 3.5, vel: 0.85 }, { slot: 12, off: 7, dur: 1.5, vel: 0.65 }, { slot: 14, off: 12, dur: 1.5, vel: 0.65 }], bassApproach: true,
                chord: [{ slot: 4, dur: 1.5, vel: 0.5 }, { slot: 12, dur: 1.5, vel: 0.5 }] },
        parts: [
          {
            name: 'Hammered double stops between the chords',
            why: 'The chord struck on one and left, then the hand rolling through the shape in sixteenths — the 2nd onto the 3rd, the 4th onto the 5th, the 6th onto the 5th coming down — double stops with one note hammered, and a slide up into the next chord\'s shape. Free notes, so the sus4 and the 6th sound in every reading.',
            figure: [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), h(4, 26, 28, 2, 0.75, R2F), n(6, 19, 2, 0.6), h(8, 17, 19, 2, 0.75, F), n(10, 24, 2, 0.6), p(12, 21, 19, 2, 0.7, F), d(14, 16, 19, 2, 0.6)],
            variants: [
              [s(0, 2, 0.9, 'bass'), s(2, 2, 0.75, 'mid'), h(4, 26, 28, 2, 0.75, R2F), d(6, 16, 19, 2, 0.6), s(8, 2, 0.85, 'bass'), s(10, 2, 0.7, 'mid'), h(12, 17, 19, 2, 0.75, F), d(14, 19, 24, 2, 0.6)],
              [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), d(4, 16, 19, 2, 0.7), d(6, 17, 21, 2, 0.6, F), d(8, 12, 16, 2, 0.7), h(10, 19, 21, 2, 0.7, F), n(12, 24, 2, 0.65), h(14, 24, 26, 2, 0.65, F)],
            ],
            fills: [
              [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), n(4, 24, 2, 0.75), n(6, 26, 1, 0.6, F), n(7, 24, 1, 0.6), n(8, 21, 2, 0.7), n(10, 19, 2, 0.7), n(12, 16, 2, 0.7), n(14, 12, 2, 0.75)],
            ],
            fillsOnChange: [
              [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), h(4, 26, 28, 2, 0.75, R2F), n(6, 19, 2, 0.6), n(8, 21, 2, 0.7), n(10, 24, 2, 0.7), nx(12, 16, 2, 0.7), nx(14, 19, 2, 0.75)],
              [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), d(4, 16, 19, 2, 0.7), d(6, 19, 24, 2, 0.65), nx(8, -5, 2, 0.8, PM), nx(10, -3, 2, 0.75, PM), nx(12, -2, 2, 0.8, PM), nx(14, -1, 2, 0.85, PM)],
            ],
            fillsOnStay: [
              [s(0, 3, 0.9, 'full', null, { stroke: 'down' }), h(4, 17, 19, 2, 0.75, F), n(6, 24, 2, 0.6), h(8, 26, 28, 2, 0.75, R2F), n(10, 19, 2, 0.6), d(12, 16, 24, 2, 0.7), d(14, 16, 24, 2, 0.5)],
            ],
            tails: [[h(12, 17, 19, 2, 0.75, F), n(14, 21, 2, 0.6, F)]], tailChance: 0.35,
            pickups: [[nx(12, 17, 2, 0.6, F), nx(14, 16, 2, 0.75)]], pickupChance: 0.4,
            leads: [
              [n(0, 24, 2, 0.85), n(2, 26, 1, 0.65, F), n(3, 24, 1, 0.65), n(4, 21, 2, 0.75), n(6, 19, 2, 0.75), d(8, 16, 19, 2, 0.7), d(10, 19, 24, 2, 0.7), n(12, 24, 4, 0.8, V)],
              [h(0, 17, 19, 2, 0.8, F), n(2, 21, 2, 0.7), n(4, 24, 2, 0.8), n(6, 21, 2, 0.7), b(8, 17, 2, 4, 0.85, V), n(12, 16, 2, 0.7), n(14, 12, 2, 0.75)],
            ],
            leadChance: 0.5,
            easy: { figure: [s(0, 4, 0.9), s(4, 2, 0.6, 'mid'), s(8, 4, 0.85), s(12, 2, 0.6, 'mid')] },
          },
                    {
            name: 'Cropper chucks and 6ths',
            why: 'The Stax job: a 6th on the D and B strings slid into on one, the chord muted on two, the 6th on three, muted on four — two notes at a time and a chuck between them — and one-note fills outlining the chord. The change fill walks the bass up.',
            figure: [d(0, 4, 12, 3, 0.8), s(4, 1, 0.6, 'high', 'mute'), d(8, 2, 11, 3, 0.75, F), s(12, 1, 0.6, 'high', 'mute'), n(14, 0, 2, 0.6)],
            variants: [
              [d(0, 4, 12, 3, 0.8), s(4, 1, 0.6, 'high', 'mute'), d(8, 0, 9, 3, 0.75, F), s(12, 1, 0.6, 'high', 'mute'), d(14, 4, 12, 2, 0.6)],
              [s(2, 2, 0.65, 'high'), s(4, 1, 0.6, 'high', 'mute'), s(6, 2, 0.65, 'high'), d(8, 4, 12, 3, 0.75), s(12, 1, 0.6, 'high', 'mute'), s(14, 2, 0.65, 'high')],
            ],
            fills: [
              [d(0, 4, 12, 3, 0.8), s(4, 1, 0.6, 'high', 'mute'), sl(8, 3, 4, 4, 0.8), s(12, 1, 0.6, 'high', 'mute'), n(14, 7, 2, 0.65)],
            ],
            fillsOnChange: [
              [d(0, 4, 12, 3, 0.8), s(4, 1, 0.6, 'high', 'mute'), n(8, 7, 2, 0.75), n(10, 9, 2, 0.7), nx(12, 5, 2, 0.65), nx(14, 4, 2, 0.8)],
            ],
            fillsOnStay: [
              [d(0, 4, 12, 3, 0.8), s(4, 1, 0.6, 'high', 'mute'), h(8, 5, 7, 4, 0.8, F), s(12, 1, 0.6, 'high', 'mute'), n(14, 0, 2, 0.65)],
            ],
            leads: [
              [n(0, 12, 2, 0.85), n(2, 9, 2, 0.75), n(4, 7, 2, 0.8), n(6, 4, 2, 0.75), n(8, 7, 2, 0.8), d(10, 4, 12, 2, 0.7), n(12, 12, 4, 0.8, V)],
            ],
            leadChance: 0.3,
          },
          {
            name: 'R&B fills in the major pentatonic',
            why: 'A lead part in the sweet register: the major pentatonic from the shape, the 6th and the 9th on the top strings, double stops in 3rds coming down, a slide up to the octave, the 2nd bent to the 3rd. What a sideman plays between the singer\'s lines.',
            figure: [sl(0, 10, 12, 2, 0.8), n(2, 14, 2, 0.7), n(4, 16, 2, 0.8), n(6, 14, 2, 0.7), d(8, 7, 12, 2, 0.7), d(10, 4, 9, 2, 0.65), n(12, 7, 4, 0.75, V)],
            variants: [
              [b(0, 14, 2, 4, 0.85, V), n(4, 12, 2, 0.75), n(6, 9, 2, 0.7), n(8, 7, 2, 0.75), d(10, 4, 9, 2, 0.65), d(12, 0, 7, 4, 0.7)],
              [n(0, 12, 1, 0.8), n(1, 14, 1, 0.7), n(2, 16, 2, 0.8), n(4, 19, 2, 0.8), n(6, 16, 2, 0.75), n(8, 14, 2, 0.7), n(10, 12, 2, 0.75), n(12, 9, 4, 0.75, V)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 16, 2, 0.8), n(2, 14, 2, 0.7), n(4, 12, 2, 0.8), n(6, 9, 2, 0.7), n(8, 7, 2, 0.75), n(10, 4, 2, 0.7), n(12, 0, 4, 0.8, V)],
            ],
            fillsOnChange: [
              [sl(0, 10, 12, 2, 0.8), n(2, 14, 2, 0.7), n(4, 16, 2, 0.8), n(6, 12, 2, 0.7), n(8, 9, 2, 0.75), n(10, 7, 2, 0.7), nx(12, 4, 2, 0.7), nx(14, 0, 2, 0.8)],
              [d(0, 7, 12, 2, 0.75), d(2, 4, 9, 2, 0.7), d(4, 0, 7, 2, 0.7), n(8, 9, 2, 0.75), n(10, 12, 2, 0.75), nx(12, 5, 2, 0.7), nx(14, 4, 2, 0.8)],
            ],
            fillsOnStay: [
              [b(0, 14, 2, 4, 0.85, V), n(4, 12, 2, 0.75), n(6, 14, 1, 0.65), n(7, 12, 1, 0.65), n(8, 9, 2, 0.7), n(10, 7, 2, 0.75), d(12, 4, 7, 2, 0.65), d(14, 0, 4, 2, 0.65)],
            ],
            easy: { figure: [n(0, 12, 4, 0.8), n(4, 14, 4, 0.7), n(8, 12, 4, 0.8), n(12, 7, 4, 0.75)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Rolling waltz (Manic Depression way)', inspired: '"Manic Depression" — Mitch Mitchell\'s jazz waltz under a riff in unison with the bass', style: 'hendrix',
        progression: ['A', 'G', 'D', 'D#', 'E', 'A'], key: 'A', tempo: 140,
        why: `<p>Three to the bar and three to the beat — the churning triplet feel Mitchell took from a jazz waltz — with the guitar and bass in unison on a riff that climbs to each chord's root by step and half-step, and a chromatic walk from the IV through the ♯IV to the V. The lead rolls in triplets from the pentatonic, alternate-picked, with ghost notes. The kit rolls: ride on every triplet, the snare on two, the kick on one and three.</p>`,
        band: { grid: 9, beats: 3, kick: [0, 6], kickVel: 0.85, snare: [3], snareVel: 0.8, ghost: [5, 8], hat: [3], ride: [0, 1, 2, 3, 4, 5, 6, 7, 8], voice: 'triad',
                bass: [{ slot: 0, off: 0, dur: 2.5, vel: 0.9 }, { slot: 3, off: 10, dur: 2.5, vel: 0.75 }, { slot: 6, off: 0, dur: 1.5, vel: 0.8 }, { slot: 8, off: 7, dur: 1, vel: 0.65 }], bassApproach: true,
                chord: [{ slot: 0, dur: 2.5, vel: 0.5 }] },
        parts: [
          {
            name: 'Unison riff with the bass',
            blues: true,
            why: 'The riff on the low strings the bass doubles: the root on one, the ♭7 on two, the root again and the 5th, a chromatic step from below into the next chord — in threes, the middle of the beat left empty so the riff swings. Palm-muted, hard.',
            figure: [n(0, 0, 2, 0.95, PM), n(2, 0, 1, 0.6, PM), n(3, 10, 2, 0.9, PM), n(5, 10, 1, 0.6, PM), n(6, 0, 1, 0.9, PM), n(7, 7, 1, 0.8, PM), n(8, 5, 1, 0.8, PM)],
            variants: [
              [n(0, 0, 2, 0.95, PM), n(2, 3, 1, 0.75, PM), n(3, 5, 2, 0.9, PM), n(5, 6, 1, 0.75, { free: true, pm: true }), n(6, 7, 2, 0.9, PM), n(8, 10, 1, 0.8, PM)],
              [d(0, 0, 12, 2, 0.95), n(2, 0, 1, 0.6, PM), d(3, 10, 22, 2, 0.9), n(5, 10, 1, 0.6, PM), n(6, 0, 2, 0.9, PM), n(8, 7, 1, 0.8, PM)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.9), n(2, 10, 1, 0.8), n(3, 7, 2, 0.85), n(5, 6, 1, 0.75, F), n(6, 5, 1, 0.8), n(7, 3, 1, 0.8), n(8, 0, 1, 0.9, PM)],
            ],
            fillsOnChange: [
              [n(0, 0, 2, 0.95, PM), n(2, 0, 1, 0.6, PM), n(3, 10, 2, 0.9, PM), n(5, 7, 1, 0.8, PM), nx(6, -2, 1, 0.85, PM), nx(7, -1, 1, 0.85, PM), nx(8, 0, 1, 0.95, PM)],
              [n(0, 0, 2, 0.95, PM), n(2, 3, 1, 0.8, PM), n(3, 5, 2, 0.9, PM), n(5, 7, 1, 0.85, PM), n(6, 10, 1, 0.85), nx(7, 3, 1, 0.8), nx(8, 0, 1, 0.95, PM)],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.95, PM), n(2, 0, 1, 0.6, PM), b(3, 5, 2, 3, 0.9, V), n(6, 3, 1, 0.8), n(7, 0, 1, 0.85, PM), n(8, 10, 1, 0.8, PM)],
            ],
            leads: [
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 15, 1, 0.8), n(2, 17, 1, 0.85), b(3, 17, 2, 3, 0.95, V), n(6, 15, 1, 0.8), n(7, 12, 1, 0.8), n(8, 10, 1, 0.8)],
            ],
            leadChance: 0.4,
            easy: { figure: [n(0, 0, 3, 0.95), n(3, 10, 3, 0.9), n(6, 0, 2, 0.9), n(8, 7, 1, 0.8)] },
          },
          {
            name: 'Rolling lead in triplets',
            blues: true,
            why: 'A lead part that rolls with the kit: pentatonic triplets alternate-picked up and down the box, ghost notes in the middle of the beat, a whole-step bend on the downbeat held through the beat, a run up into the box above, the ♭5 between the 4th and the 5th on the way down.',
            figure: [n(0, 12, 1, 0.9), n(1, 10, 1, 0.75), n(2, 7, 1, 0.8), n(3, 10, 1, 0.85), n(4, 12, 1, 0.75), n(5, 15, 1, 0.8), b(6, 17, 2, 3, 0.95, V)],
            variants: [
              [n(0, 7, 1, 0.9), n(1, 7, 1, 0.4, { ghost: true }), n(2, 10, 1, 0.85), n(3, 12, 1, 0.9), n(4, 12, 1, 0.4, { ghost: true }), n(5, 15, 1, 0.85), n(6, 17, 1, 0.9, { reach: 5 }), n(7, 19, 1, 0.85, { reach: 5 }), n(8, 22, 1, 0.9, { reach: 5 })],
              [b(0, 10, 2, 3, 0.95, V), n(3, 7, 1, 0.85), n(4, 6, 1, 0.75, F), n(5, 5, 1, 0.8), n(6, 3, 1, 0.85), n(7, 0, 1, 0.85), n(8, 12, 1, 0.9)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 19, 1, 0.9, { reach: 5 }), n(1, 17, 1, 0.8, { reach: 5 }), n(2, 15, 1, 0.8), n(3, 12, 1, 0.85), n(4, 10, 1, 0.8), n(5, 7, 1, 0.8), n(6, 5, 1, 0.8), n(7, 3, 1, 0.8), n(8, 0, 1, 0.9, V)],
            ],
            fillsOnChange: [
              [n(0, 12, 1, 0.9), n(1, 10, 1, 0.8), n(2, 7, 1, 0.8), n(3, 5, 1, 0.8), n(4, 6, 1, 0.75, F), n(5, 7, 1, 0.85), nx(6, 3, 1, 0.8), nx(7, 0, 1, 0.9), nx(8, 12, 1, 0.85)],
              [b(0, 10, 2, 3, 0.95, V), n(3, 7, 1, 0.85), n(4, 3, 1, 0.8), n(5, 0, 1, 0.85), nx(6, -2, 1, 0.85, PM), nx(7, -1, 1, 0.85, PM), nx(8, 0, 1, 0.95, PM)],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 12, 1, 0.4, { ghost: true }), n(2, 12, 1, 0.9), n(3, 15, 1, 0.85), n(4, 12, 1, 0.8), n(5, 10, 1, 0.8), b(6, 10, 2, 3, 0.95, V)],
            ],
            easy: { figure: [n(0, 12, 3, 0.9), n(3, 10, 3, 0.85), n(6, 7, 3, 0.85)] },
          },
        ],
      },
    ],
  });
})();
