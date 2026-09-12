// The Psychobilly genre: eight feels, from the rockabilly the music is built
// on to the wrecking pace of the second wave and the horror-minor twang of
// the third, each with rhythm parts, lead parts and parts that do both —
// written from the idiom the sources describe: the boom-chicka of the Sun
// and Blue Caps records and its Travis-picked thumb, the 6th on the "and"
// and the walking bass into every change, Cliff Gallup's triplet pull-offs
// and chromatic octaves, Luther Perkins' palm-muted boom-chicka under the
// train beat, the swing side's 6/9 and 9th chords and the Bigsby dip on a
// stab, the Meteors' straight eighths in a minor key with the ♭2 and the
// ♭5 let in, the punk downstrokes and gallops the second wave played at
// two hundred and more, Dick Dale's tremolo picking on the low strings, the
// echo-laden low-string twang of the third wave — and never from a
// recording: no line here is a transcription or a paraphrase of one, no
// signature riff is reproduced, and the songs named are named as reference
// points for a way of playing. What was read, and how the content was
// made, is on psychobilly.html ("How this was made") with every source
// cited; the method is docs/STYLES.md.
//
// The engine features these parts use, beyond the Hendrix set (parts.js,
// audio.js, band.js):
//   dip: true | n     the Bigsby pressed and let go on a chord or a note —
//                     a semitone (or n) down over a tenth of a second and
//                     back; "dip" over the tab
//   pop: true         a note snapped by a finger rather than picked: the
//                     chicken-pickin' front, brighter for a few ms
//   add: 9, free      the 6th on a strum kept as a 6th in every reading —
//                     the E6 of the rockabilly "chicka"
//   band: bassSnap    every bass note snapped against the fingerboard
//         slap: []    the hand slapping the strings between the notes
//         brush: []   the wire brush on the snare: the train beat
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const genres = GT.review.genres;

  const n  = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, ...(x || {}) });
  const nx = (at, iv, dur, vel, x) => ({ at, iv, dur, vel, next: true, ...(x || {}) });
  const s  = (at, dur, vel, voicing, mute, x) => ({ at, dur, vel, strum: true, voicing: voicing || 'full', mute: mute === 'mute', ...(x || {}) });
  const sn = (at, dur, vel, voicing, x) => s(at, dur, vel, voicing, null, { next: true, ...(x || {}) });
  const g  = (at, dur, vel, voicing, x) => s(at, dur, vel, voicing || 'high', null, { ghost: true, ...(x || {}) });
  const d  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'double', ...(x || {}) });
  const b  = (at, iv, up, dur, vel, x) => ({ at, iv, up, dur, vel, tech: 'bend', ...(x || {}) });
  const h  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'hammer', ...(x || {}) });
  const p  = (at, iv, iv2, dur, vel, x) => ({ at, iv, iv2, dur, vel, tech: 'pull', ...(x || {}) });
  const sl = (at, from, iv, dur, vel, x) => ({ at, iv, from, dur, vel, tech: 'slide', ...(x || {}) });
  const F = { free: true }, V = { vib: true }, PM = { pm: true }, ST = { stacc: true }, PMS = { pm: true, stacc: true };
  const POP = { pop: true }, DIP = { dip: true }, DOWN = { stroke: 'down' }, PMD = { pm: true, stroke: 'down' };
  const SIX = { add: 9, free: true, stacc: true };            // the "chicka" with the 6th on top: E6
  const SEV = { add: 10, free: true, stacc: true };           // ...and with the ♭7: E7
  const TREM = { trem: 8 };                                   // tremolo picking: eight strokes to the slot count
  // a bar of palm-muted power-chord eighths on a sixteen grid, downstrokes
  const eighths = (vel = 0.9, count = 8) => [...Array(count).keys()].map(k => s(k * 2, 2, k % 2 ? vel - 0.15 : vel, 'power', null, PMD));
  // the gallop: sixteenth, sixteenth, eighth — a beat of it, four times
  const gallop = (vel = 0.9) => [0, 4, 8, 12].flatMap(k => [s(k, 1, vel, 'power', null, PMD), s(k + 1, 1, vel - 0.25, 'power', null, PMD), s(k + 2, 2, vel - 0.05, 'power', null, PMD)]);
  // the walk up to the next chord's root on the bass strings: 5th, 6th, ♭7, 7 — the walking pickup line
  const walkUp16 = (from = 8) => [nx(from, -5, 2, 0.8, PM), nx(from + 2, -3, 2, 0.75, PM), nx(from + 4, -2, 2, 0.8, PM), nx(from + 6, -1, 2, 0.85, PM)];
  const walkUp12 = (from = 6) => [nx(from, -5, 1.5, 0.8, PM), nx(from + 2, -3, 1, 0.75, PM), nx(from + 3, -2, 1.5, 0.8, PM), nx(from + 5, -1, 1, 0.85, PM)];

  // =========================================================================
  genres.push({
    id: 'psychobilly-dive', name: 'Psychobilly (the deep dive)', engine: true,
    research: `
      <p><b>What it actually is.</b> Psychobilly is rockabilly played by a punk band that has been to the horror movies: the same three pieces — an electric guitar, an upright bass slapped rather than plucked, a small kit — at a faster pace with a heavier hand, the songs about zombies, serial killers and cars (the Wikipedia article on the genre; Kattari's <i>Psychobilly: Subcultural Survival</i>, Temple, 2020; the AV Club's guide; Matthews' three-part history for HTF). The word is Johnny Cash's, from "One Piece at a Time" (1976); the Cramps put it on their flyers in New York the same year, and Poison Ivy later said they were "just using carny terms to drum up business"; the Meteors in south London (1980) were the first band to call their music by it, and their fans' dance, "wrecking", named the pit. The Klub Foot at the Clarendon Hotel, Hammersmith (1982–88) was the scene's home and the six <i>Stomping at the Klub Foot</i> records its document; Demented Are Go's <i>In Sickness &amp; In Health</i> (1986) opened a second wave that went to Europe — Batmobile in Rotterdam, Mad Sin in Berlin, the Nekromantix in Copenhagen with Kim Nekroman's coffin-shaped bass — and a third, from the mid-1990s, put it in southern California: Tiger Army, HorrorPops, Hellcat Records, and Dallas's Reverend Horton Heat, whose "Psychobilly Freakout" (1990) taught American alternative-rock audiences the word even as Jim Heath says his band is "a rockabilly band that was just a little bit more turned up and more aggressive" (Songfacts; Style Weekly, 2016).</p>
      <p><b>What the guitar does.</b> The foundation is the Sun and Blue Caps guitar of 1954–56: Scotty Moore's Merle Travis- and Chet Atkins-derived thumb-and-fingers picking, its alternating bass under chord "chicks" — the boom-chicka — its 6th chords, its double stops on the third and second strings, its walking pickup line into every change and its slapback echo from the Ray Butts EchoSonic (scottymoore.net; Premier Guitar's "Beyond Blues" lesson; TrueFire's twelve licks; the Wikipedia articles on Moore and on rockabilly); Cliff Gallup's flatpick-and-fingerpicks attack, half-step bends, the major 6th favoured over the ♭7, open-string triplet pull-offs, chromatically climbing octaves and the 6/9 chord he ended solos on (Keith Wyatt in Guitar World; the Wikipedia article); Carl Perkins' sixths, ninths, palm muting and pedal-steel bends; Paul Burlison's distorted octave riff with a loosened tube; Luther Perkins' palm-muted boom-chicka behind Johnny Cash, the train beat's guitar. The revival added Brian Setzer's jazz chords — 6/9s, 9ths, 13ths, a m7♭5 as a rootless 9th — hybrid and economy picking and the Bigsby dip on a stab (Premier Guitar's "Rhythm Rules"; Guitar World's soloing lesson; Jon MacLennan on "Stray Cat Strut", swung eighths in C minor down a walk of 7th chords). Psychobilly took that hand and pushed: power chords and palm-muted eighths in minor keys, tremolo picking from surf (Dick Dale's "pulsation", his Arabic-scale "Misirlou"), chromatic runs for menace, the tempo up (Riffhard's guide; the Wikipedia article: "power chords mixed with rockabilly fingerpicking and seventh chords", "heavy use of minor chords and palm muting"). Jim Heath's own account of his hand is the clearest: a flatpick with the fingers behind it ("hybrid style using a flatpick"), crosspicking "to emulate Merle Travis and Chet Atkins licks" for "fast, banjo-style 16th notes", open strings let ring inside chord changes ("I'm a cheater"), the dirt from a 20-watt Gretsch Executive on ten rather than a pedal, a Gretsch 6120 with a Bigsby, a slapback he can't be a rockabilly cat without — and Django's three-note voicings, Jerry Lee Lewis's and Little Richard's piano in the songwriting, Freddie King and the Chess records in the blues, the Cramps' "rockabilly licks — fuzzed-out Duane Eddy-type guitar" as the night he saw what he would do (Premier Guitar, 2013; Vintage Guitar, 2007/2010; Guitar World, 2019; Style Weekly, 2016; The Vinyl District, 2014; Juice, 2002). Nick 13 names Duane Eddy, Johnny Ramone, Billy Zoom and the Shadows, and plays a Gretsch Jet through a Fender for echo-laden lead lines in minor keys (Gretsch, 2017; Guitar World, 2020).</p>
      <p><b>What the bass and the kit do.</b> The bass is the sound: the string pulled out and let go against the fingerboard — a "snap" — and the hand slapped against the strings between the notes for a click with no pitch, the click landing with the snare. Rockabilly plays a single slap (note on the beat, slap on the "and"); psychobilly plays double and triple slaps, the "drag triplet", two clicks on the sixteenths after each note at tempos the rockabilly players never reached (Dr. D's columns for No Treble; the Wikipedia article on slapping; Bill Black, Lee Rocker, Kim Nekroman, Geoff Kresge, Scott Owen and Jimbo Wallace as the named hands). The kit is small: a swung ride with the kick on all four and the snare on two and four for the shuffle, the train beat's sixteenths on the snare with brushes or sticks for the country side, and a straight punk backbeat at speed for the stomp, with tom fills for drama (the rockabilly drumming blogs; the Wikipedia article). Recorded, the bass wants "a nice mic on the bridge" as well as its pickup (Heath in Tape Op, 2019).</p>
      <p><b>The feels.</b> The boom-chicka at 176 (the Sun way, swung, the 6th on the "and"); the jump and swing at 152 (the Blue Caps and Setzer side: 6/9s and 9ths, four to the bar, walking bass); the swung minor walk-down at 108 (the Stray Cat Strut way, stabs with the Bigsby dip); the train two-step at 168 (Luther Perkins' boom-chicka, brushes, chicken pickin'); the psychobilly stomp at 192 (the Meteors way: straight eighths, minor key, the ♭2 and the ♭5); the wrecking pace at 212 (the second wave: downstrokes, gallops, the twelve bars at speed); the surf-billy at 164 (tremolo picking and the bar); and the horror-minor twang at 148 (the third wave: echo on the low strings, the harmonic minor 7th).</p>`,
    existing: [],
    additions: [
      // ---------------------------------------------------------------------
      {
        label: 'Boom-chicka (the Sun way)', inspired: '"That\'s All Right", "Mystery Train", "Blue Suede Shoes", "Be-Bop-A-Lula" — the 1954–56 rhythm, Travis-picked, swung', style: 'psychobilly',
        progression: ['E', 'E', 'A', 'E', 'B7', 'E'], key: 'E', tempo: 176,
        why: `<p>The foundation of everything on this page. The thumb (or the pick) takes the root and the 5th on the bass strings, palm-muted, on the beats; the fingers strike the top three strings on the swung "and" — the boom and the chicka — with the 6th on the B string every other time, so E becomes E6 and back. The bass walks 1–3–5–6 under it, snapped, the slap on every upbeat; the kick on all four, the snare on two and four, the ride swung. Slapback on everything.</p>`,
        band: { grid: 12, kick: [0, 3, 6, 9], kickVel: 0.7, snare: [3, 9], snareVel: 0.75, hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'triad', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 2.6, vel: 0.9 }, { slot: 3, off: 4, dur: 2.6, vel: 0.8 }, { slot: 6, off: 7, dur: 2.6, vel: 0.85 }, { slot: 9, off: 9, dur: 2.6, vel: 0.8 }], bassApproach: true, bassSnap: true,
                slap: [2, 5, 8, 11], slapVel: 0.6,
                chord: [{ slot: 3, dur: 1, vel: 0.3 }, { slot: 9, dur: 1, vel: 0.28 }], fill: { snare: [6, 8, 9, 10, 11], kick: [0, 6] } },
        parts: [
          {
            name: 'Boom-chicka with the 6th',
            why: 'The rhythm as one hand plays it: the root under the thumb on one, the top three strings short on the "and", the 5th on two, the chicka with the 6th on top (E6 — the 6th kept as a 6th in every reading), and round again. The variants put the ♭7 in the chicka on the way to the IV and walk the bass 1–3–5–6 under it; the change fills are the walking pickup line — 5th, 6th, ♭7, 7 — into the next root, Scotty Moore\'s and Carl Perkins\' and everyone\'s since; the lead lines are Moore\'s double stops on the third and second strings with the ♭3 hammered to the 3rd.',
            figure: [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), s(3, 1.5, 0.8, 'fifth', null, PM), s(5, 1, 0.6, 'high', null, SIX),
                     s(6, 1.5, 0.85, 'bass', null, PM), s(8, 1, 0.55, 'high', null, ST), s(9, 1.5, 0.8, 'fifth', null, PM), s(11, 1, 0.6, 'high', null, SIX)],
            variants: [
              // the ♭7 in the chicka, then the 6th: E, E7, E6
              [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), s(3, 1.5, 0.8, 'fifth', null, PM), s(5, 1, 0.6, 'high', null, SEV),
               s(6, 1.5, 0.85, 'bass', null, PM), s(8, 1, 0.6, 'high', null, SIX), s(9, 1.5, 0.8, 'fifth', null, PM), s(11, 1, 0.55, 'high', null, ST)],
              // the bass walking 1–3–5–6 under the chicka
              [n(0, 0, 1.5, 0.85, PM), s(2, 1, 0.55, 'high', null, ST), n(3, 4, 1.5, 0.8, PM), s(5, 1, 0.55, 'high', null, ST),
               n(6, 7, 1.5, 0.85, PM), s(8, 1, 0.6, 'high', null, SIX), n(9, 9, 1.5, 0.8, PM), s(11, 1, 0.55, 'high', null, ST)],
            ],
            figureMode: 'roll',
            fills: [
              // the boogie on the low strings, muted
              [n(0, 0, 1.5, 0.85, PM), n(2, 4, 1, 0.7, PM), n(3, 7, 1.5, 0.85, PM), n(5, 9, 1, 0.7, PM), n(6, 10, 1.5, 0.85, PM), n(8, 9, 1, 0.7, PM), n(9, 7, 1.5, 0.8, PM), n(11, 4, 1, 0.7, PM)],
            ],
            fillsOnChange: [
              // the walking pickup line: 5th, 6th, ♭7, 7 into the next root
              [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), s(3, 1.5, 0.8, 'fifth', null, PM), s(5, 1, 0.55, 'high', null, ST), ...walkUp12(6)],
              // root, 3rd, 4th, 5th up the bass strings, then the next root
              [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), n(3, 0, 1.5, 0.8, PM), n(5, 4, 1, 0.75, PM), n(6, 5, 1.5, 0.8, PM), n(8, 7, 1, 0.8, PM), nx(9, -2, 1.5, 0.8, PM), nx(11, -1, 1, 0.85, PM)],
            ],
            fillsOnStay: [
              // E, E6, E7, E6: the chicka changing its top note every beat
              [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), s(3, 1.5, 0.8, 'fifth', null, PM), s(5, 1, 0.6, 'high', null, SIX),
               s(6, 1.5, 0.85, 'bass', null, PM), s(8, 1, 0.6, 'high', null, SEV), s(9, 1.5, 0.8, 'fifth', null, PM), s(11, 1, 0.6, 'high', null, SIX)],
            ],
            tails: [[n(9, 12, 1, 0.65), n(10, 11, 1, 0.55, F), n(11, 9, 1, 0.65)]], tailChance: 0.3,
            pickups: [[nx(8, -3, 1, 0.65, PM), nx(9, -2, 1.5, 0.7, PM), nx(11, -1, 1, 0.75, PM)]], pickupChance: 0.4,
            turnaround: [s(0, 1.5, 0.85, 'bass', null, PM), s(2, 1, 0.55, 'high', null, ST), n(3, 7, 1.5, 0.8, PM), n(5, 5, 1, 0.7, PM), n(6, 4, 1.5, 0.8, PM), n(8, 2, 1, 0.7, PM), n(9, 0, 1.5, 0.85, PM), n(11, -1, 1, 0.75, { free: true, pm: true })],
            leads: [
              // Moore's double stops on the third and second strings, the ♭3 hammered to the 3rd
              [d(0, 4, 7, 2, 0.8), d(2, 4, 7, 1, 0.6), h(3, 3, 4, 2, 0.75, F), n(5, 7, 1, 0.65), d(6, 7, 12, 2, 0.75), n(8, 9, 1, 0.65), n(9, 7, 2, 0.7), n(11, 4, 1, 0.6)],
              // a slide up to the octave, then 6ths coming down
              [sl(0, 10, 12, 2, 0.8), n(2, 14, 1, 0.65), n(3, 12, 2, 0.75), n(5, 9, 1, 0.65), d(6, 4, 12, 2, 0.75), d(8, 2, 11, 1, 0.6, F), d(9, 0, 9, 2, 0.7), n(11, 7, 1, 0.6)],
              // the major pentatonic with the 7th passing, a half-step bend
              [n(0, 12, 1, 0.8), n(1, 11, 1, 0.55, F), n(2, 9, 1, 0.7), n(3, 7, 2, 0.75), b(5, 3, 1, 1, 0.7, F), n(6, 4, 2, 0.75), n(8, 0, 1, 0.6), d(9, 4, 7, 2, 0.7), n(11, 9, 1, 0.6)],
            ],
            leadChance: 0.45,
            easy: { figure: [s(0, 3, 0.85, 'bass'), s(3, 3, 0.6, 'high'), s(6, 3, 0.85, 'fifth'), s(9, 3, 0.6, 'high')] },
          },
          {
            name: 'Travis-picked chords, pick and fingers',
            fingers: true,
            why: 'The same rhythm as fingerstyle: the thumb (or the pick, in Heath\'s hybrid hand) alternating root and 5th on the bass strings, palm-muted, while the fingers pick the treble strings between — a melody note on each upbeat, a 3rd or a pinch on the beat. What Travis and Atkins gave rockabilly, at rockabilly\'s tempo. A fingers part: the fingers never take a string the thumb is on.',
            figure: [s(0, 1.5, 0.85, 'bass', null, PM), n(2, 16, 1, 0.6), s(3, 1.5, 0.8, 'fifth', null, PM), n(5, 12, 1, 0.55), s(6, 1.5, 0.85, 'bass', null, PM), n(8, 19, 1, 0.6), s(9, 1.5, 0.8, 'fifth', null, PM), n(11, 16, 1, 0.55)],
            variants: [
              [s(0, 1.5, 0.85, 'bass', null, PM), d(2, 12, 16, 1, 0.6), s(3, 1.5, 0.8, 'fifth', null, PM), n(5, 14, 1, 0.55), s(6, 1.5, 0.85, 'bass', null, PM), d(8, 16, 19, 1, 0.6), s(9, 1.5, 0.8, 'fifth', null, PM), n(11, 12, 1, 0.55)],
              // the pinch: thumb and finger together on the beat
              [s(0, 1.5, 0.85, 'bass', null, PM), n(0, 16, 1.5, 0.6), n(2, 12, 1, 0.5), s(3, 1.5, 0.8, 'fifth', null, PM), n(3, 19, 1.5, 0.6), s(6, 1.5, 0.85, 'bass', null, PM), n(6, 16, 1.5, 0.6), n(8, 14, 1, 0.5), s(9, 1.5, 0.8, 'fifth', null, PM), n(9, 12, 1.5, 0.6)],
            ],
            figureMode: 'roll',
            fills: [
              [s(0, 1.5, 0.85, 'bass', null, PM), n(2, 16, 1, 0.6), s(3, 1.5, 0.8, 'fifth', null, PM), n(5, 17, 1, 0.55, F), s(6, 1.5, 0.85, 'bass', null, PM), n(8, 16, 1, 0.6), s(9, 1.5, 0.8, 'fifth', null, PM), n(11, 14, 1, 0.55)],
            ],
            fillsOnChange: [
              // the fingers anticipate the next chord's 3rd on the last upbeat
              [s(0, 1.5, 0.85, 'bass', null, PM), n(2, 16, 1, 0.6), s(3, 1.5, 0.8, 'fifth', null, PM), n(5, 14, 1, 0.55), s(6, 1.5, 0.85, 'bass', null, PM), n(8, 12, 1, 0.6), s(9, 1.5, 0.8, 'fifth', null, PM), nx(11, 16, 1, 0.6)],
            ],
            fillsOnStay: [
              [s(0, 1.5, 0.85, 'bass', null, PM), n(2, 12, 1, 0.55), s(3, 1.5, 0.8, 'fifth', null, PM), h(5, 14, 16, 1, 0.6), s(6, 1.5, 0.85, 'bass', null, PM), n(8, 12, 1, 0.55), s(9, 1.5, 0.8, 'fifth', null, PM), n(11, 9, 1, 0.5)],
            ],
            leads: [
              [n(0, 12, 2, 0.8), n(2, 14, 1, 0.6), n(3, 16, 2, 0.75), n(5, 14, 1, 0.6), n(6, 12, 2, 0.75), n(8, 9, 1, 0.6), d(9, 4, 12, 2, 0.7), n(11, 7, 1, 0.6)],
              [d(0, 12, 16, 2, 0.8), n(2, 19, 1, 0.65), n(3, 16, 2, 0.75), n(5, 12, 1, 0.6), n(6, 14, 2, 0.7), n(8, 12, 1, 0.65), n(9, 9, 2, 0.7), n(11, 12, 1, 0.6)],
            ],
            leadChance: 0.35,
            easy: { figure: [s(0, 3, 0.85, 'bass'), s(3, 3, 0.8, 'fifth'), s(6, 3, 0.85, 'bass'), s(9, 3, 0.8, 'fifth')] },
          },
          {
            name: 'Scotty\'s double stops and the walk-up',
            why: 'A lead part in the Sun idiom: double stops on the third and second strings out of the chord, the ♭3 hammered to the 3rd, the 6th leaned on, a half-step bend, a slide up to the octave — and between phrases the walking line on the bass strings, root, 3rd, 4th, 5th, that Moore, Perkins and Burton all play into a change. Swung, and chord-based rather than scalar, the way Premier Guitar describes his note choice.',
            figure: [d(0, 4, 7, 2, 0.85), d(2, 4, 7, 1, 0.6), h(3, 3, 4, 2, 0.8, F), n(5, 7, 1, 0.65), n(6, 9, 2, 0.8), n(8, 12, 1, 0.7), d(9, 7, 12, 2, 0.75), n(11, 4, 1, 0.6)],
            variants: [
              // the walk first, then the double stops
              [n(0, 0, 1, 0.8, PM), n(1, 4, 1, 0.75, PM), n(2, 5, 1, 0.75, PM), n(3, 7, 2, 0.85, PM), d(5, 7, 12, 1, 0.6), d(6, 7, 12, 2, 0.8), n(8, 9, 1, 0.65), n(9, 7, 2, 0.75), n(11, 4, 1, 0.65)],
              [sl(0, 2, 4, 2, 0.8), n(2, 7, 1, 0.6), sl(3, 9, 12, 2, 0.8), n(5, 12, 1, 0.6), n(6, 14, 2, 0.75), n(8, 12, 1, 0.7), n(9, 9, 2, 0.75), n(11, 7, 1, 0.6)],
            ],
            figureMode: 'roll',
            fills: [
              [b(0, 3, 1, 2, 0.8, F), n(2, 4, 1, 0.7), n(3, 7, 2, 0.75), n(5, 9, 1, 0.65), n(6, 10, 1, 0.7), n(7, 9, 1, 0.6), n(8, 7, 1, 0.7), n(9, 4, 2, 0.75), n(11, 0, 1, 0.7)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.8), n(2, 9, 1, 0.65), n(3, 7, 2, 0.75), n(5, 4, 1, 0.65), ...walkUp12(6)],
              [d(0, 4, 7, 2, 0.8), d(2, 4, 7, 1, 0.6), n(3, 0, 1.5, 0.8, PM), n(5, 4, 1, 0.75, PM), n(6, 5, 1.5, 0.8, PM), n(8, 7, 1, 0.8, PM), nx(9, 4, 1.5, 0.75), nx(11, 0, 1, 0.8)],
            ],
            fillsOnStay: [
              [d(0, 4, 12, 2, 0.8), d(2, 5, 14, 1, 0.6, F), d(3, 4, 12, 2, 0.75), n(5, 7, 1, 0.6), n(6, 9, 2, 0.75), n(8, 10, 1, 0.65, F), n(9, 9, 2, 0.75), n(11, 7, 1, 0.6)],
            ],
            tails: [[n(9, 9, 1, 0.65), n(10, 10, 1, 0.55, F), n(11, 12, 1, 0.7)]], tailChance: 0.3,
            turnaround: [d(0, 4, 12, 2, 0.8), d(2, 3, 11, 1, 0.6, F), d(3, 2, 10, 2, 0.7, F), n(5, 7, 1, 0.65), n(6, 12, 1, 0.75), n(7, 11, 1, 0.6, F), n(8, 10, 1, 0.65, F), n(9, 9, 1, 0.7), n(10, 7, 1, 0.7), n(11, 4, 1, 0.7)],
            easy: { figure: [n(0, 0, 3, 0.8), n(3, 4, 3, 0.75), n(6, 7, 3, 0.8), n(9, 9, 3, 0.75)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Jump and swing (the Blue Caps and Martini way)', inspired: '"Race with the Devil", "Rock This Town", "It\'s Martini Time", "Big Red Rocket of Love" — the swing side: 6/9s and 9ths, four to the bar, the walking bass', style: 'psychobilly',
        progression: ['A6', 'A6', 'D9', 'A6', 'D9', 'E9'], key: 'A', tempo: 152,
        why: `<p>Rockabilly's jazz side, the one Setzer and Heath both lean on: four chords to the bar on the top strings with the 6th on top, a stab on the "and of 2" with the Bigsby pressed, 9ths on the IV and the V, a walking bass in quarters under it all, the ride swung. The lead language is Cliff Gallup's — open-string triplet pull-offs, octaves climbing by semitones, the major 6th where a blues player would put the ♭7, a half-step bend and no more.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.75, snare: [3, 9], snareVel: 0.7, hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'dom7', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 2.6, vel: 0.9 }, { slot: 3, off: 4, dur: 2.6, vel: 0.8 }, { slot: 6, off: 7, dur: 2.6, vel: 0.85 }, { slot: 9, off: 9, dur: 2.6, vel: 0.8 }], bassApproach: true, bassSnap: true,
                slap: [2, 5, 8, 11], slapVel: 0.45,
                chord: [{ slot: 3, dur: 1.5, vel: 0.45 }, { slot: 9, dur: 1.5, vel: 0.4 }], fill: { snare: [6, 8, 9, 10, 11], kick: [0] } },
        parts: [
          {
            name: 'Four to the bar with the 6/9',
            why: 'The Freddie Green job on a hollow-body: the top three strings short on every beat, the 6th on top on one and three, and the Setzer stab — the chord on the "and of 2", the Bigsby dipped and let back. The change fills walk the bass up to the new root or bring 6ths down chromatically onto it; a stop-time bar hits the One with the bar and answers it alone. The lead lines are Gallup\'s: the triplet pull-off, the octaves by semitones, the 6th.',
            figure: [s(0, 1, 0.7, 'high', null, SIX), s(3, 1, 0.65, 'high', null, ST), s(6, 1, 0.7, 'high', null, SIX), s(9, 1, 0.65, 'high', null, ST)],
            variants: [
              // the Charleston: one, and the "and of 2" with the dip
              [s(0, 2, 0.8, 'high', null, SIX), s(5, 1.5, 0.75, 'high', null, { dip: true, stacc: true }), s(9, 1, 0.6, 'high', null, ST)],
              // stabs on two and four, both dipped
              [g(0, 1, 0.35, 'high'), s(3, 1.5, 0.8, 'high', null, DIP), g(6, 1, 0.35, 'high'), s(9, 1.5, 0.8, 'high', null, DIP)],
            ],
            figureMode: 'roll',
            fills: [
              // the 6/9 slid up from a fret below on one
              [s(0, 2, 0.8, 'high', null, { chordSlide: 1, add: 9, free: true }), s(3, 1, 0.65, 'high', null, ST), s(6, 1, 0.7, 'high', null, SIX), s(9, 1, 0.65, 'high', null, ST)],
            ],
            fillsOnChange: [
              [s(0, 1, 0.7, 'high', null, SIX), s(3, 1, 0.65, 'high', null, ST), ...walkUp12(6)],
              // 6ths coming down by semitones onto the next chord's 3rd
              [s(0, 1, 0.7, 'high', null, SIX), s(3, 1, 0.65, 'high', null, ST), d(6, 7, 16, 1.5, 0.7, F), d(8, 6, 15, 1, 0.65, F), d(9, 5, 14, 1.5, 0.7, F), nx(11, 4, 1, 0.7)],
            ],
            fillsOnStay: [
              // the boogie on the bass strings under the chicks
              [n(0, 0, 1.5, 0.8, PM), s(2, 1, 0.55, 'high', null, ST), n(3, 4, 1.5, 0.75, PM), s(5, 1, 0.55, 'high', null, ST), n(6, 7, 1.5, 0.8, PM), s(8, 1, 0.55, 'high', null, ST), n(9, 9, 1.5, 0.75, PM), s(11, 1, 0.55, 'high', null, ST)],
            ],
            stops: [[s(0, 2, 0.9, 'high', null, DIP), n(6, 12, 1, 0.8), n(8, 9, 1, 0.7), n(9, 7, 2, 0.75)]], stopChance: 0.15,
            leads: [
              [n(0, 12, 1, 0.8), n(1, 11, 1, 0.55, F), n(2, 9, 1, 0.7), n(3, 7, 2, 0.8), p(5, 9, 7, 1, 0.65), n(6, 4, 2, 0.75), n(8, 5, 1, 0.6, F), n(9, 7, 2, 0.75), n(11, 9, 1, 0.65)],
              // octaves climbing by semitones into the 3rd
              [d(0, 5, 17, 1, 0.75, F), d(1, 6, 18, 1, 0.75, F), d(2, 7, 19, 1, 0.8), n(3, 16, 2, 0.8), n(5, 14, 1, 0.65), n(6, 12, 2, 0.75), n(8, 9, 1, 0.65), n(9, 7, 2, 0.75), n(11, 4, 1, 0.6)],
              [b(0, 3, 1, 2, 0.8, F), n(2, 4, 1, 0.7), n(3, 9, 2, 0.8), n(5, 7, 1, 0.65), n(6, 12, 2, 0.8), n(8, 14, 1, 0.65), n(9, 16, 2, 0.8), n(11, 12, 1, 0.7)],
            ],
            leadChance: 0.45,
            easy: { figure: [s(0, 3, 0.7, 'high'), s(3, 3, 0.65, 'high'), s(6, 3, 0.7, 'high'), s(9, 3, 0.65, 'high')] },
          },
          {
            name: 'Gallup lines: triplet pull-offs and chromatic octaves',
            why: 'A lead part in Cliff Gallup\'s idiom as Keith Wyatt describes it: a solo kicked off with open-string triplet pull-offs, octaves climbing a semitone at a time, the major 6th favoured over the ♭7, half-step bends and none wider, dissonant clusters as a joke, and the 6/9 chord to end on. Swung triplets — three to the beat — alternate- and hybrid-picked.',
            figure: [p(0, 7, 5, 1, 0.8), n(1, 4, 1, 0.7), n(2, 0, 1, 0.75), p(3, 7, 5, 1, 0.8), n(4, 4, 1, 0.7), n(5, 0, 1, 0.75), n(6, 9, 2, 0.8), n(8, 12, 1, 0.7), n(9, 9, 2, 0.75), n(11, 7, 1, 0.65)],
            variants: [
              [d(0, 5, 17, 1, 0.75, F), d(1, 6, 18, 1, 0.75, F), d(2, 7, 19, 1, 0.8), n(3, 16, 2, 0.8), n(5, 14, 1, 0.65), n(6, 12, 2, 0.75), n(8, 9, 1, 0.65), n(9, 7, 2, 0.75), n(11, 4, 1, 0.6)],
              [n(0, 12, 2, 0.8), b(2, 3, 1, 1, 0.7, F), n(3, 4, 2, 0.8), n(5, 7, 1, 0.65), n(6, 9, 2, 0.8), d(8, 4, 12, 1, 0.7), d(9, 4, 12, 2, 0.75), n(11, 0, 1, 0.6)],
              // the cluster: the 6th and the ♭7 together, then let go
              [d(0, 9, 10, 2, 0.75, F), n(2, 9, 1, 0.65), n(3, 7, 2, 0.75), p(5, 7, 5, 1, 0.65), n(6, 4, 2, 0.75), n(8, 5, 1, 0.6, F), n(9, 7, 2, 0.75), n(11, 12, 1, 0.65)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 9, 2, 0.8), n(2, 12, 1, 0.65), n(3, 9, 2, 0.75), n(5, 7, 1, 0.65), n(6, 4, 2, 0.75), n(8, 5, 1, 0.6, F), n(9, 7, 2, 0.75), n(11, 9, 1, 0.65)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.8), n(2, 9, 1, 0.65), n(3, 7, 2, 0.75), n(5, 4, 1, 0.65), ...walkUp12(6)],
              [p(0, 7, 5, 1, 0.8), n(1, 4, 1, 0.7), n(2, 0, 1, 0.75), n(3, 4, 2, 0.75), n(5, 7, 1, 0.65), d(6, 7, 16, 1.5, 0.7, F), d(8, 6, 15, 1, 0.65, F), d(9, 5, 14, 1.5, 0.7, F), nx(11, 4, 1, 0.7)],
            ],
            fillsOnStay: [
              [p(0, 7, 5, 1, 0.8), n(1, 4, 1, 0.7), n(2, 0, 1, 0.75), p(3, 7, 5, 1, 0.8), n(4, 4, 1, 0.7), n(5, 0, 1, 0.75), d(6, 4, 7, 2, 0.75), d(8, 4, 7, 1, 0.6), d(9, 0, 4, 2, 0.7), n(11, 9, 1, 0.65)],
            ],
            tails: [[n(9, 9, 1, 0.65), n(10, 10, 1, 0.55, F), n(11, 12, 1, 0.7)]], tailChance: 0.3,
            turnaround: [s(0, 2, 0.85, 'high', null, { add: 9, free: true }), n(3, 12, 1, 0.75), n(4, 11, 1, 0.6, F), n(5, 10, 1, 0.6, F), n(6, 9, 2, 0.75), n(8, 7, 1, 0.65), n(9, 4, 2, 0.7), n(11, 0, 1, 0.65)],
            easy: { figure: [n(0, 0, 3, 0.8), n(3, 4, 3, 0.75), n(6, 7, 3, 0.8), n(9, 9, 3, 0.75)] },
          },
          {
            name: 'Jump-blues comp: 9ths and the walk-up',
            why: 'The other rhythm job on the swing side: the 9th grip — root on the A string, x-7-6-7-7-7 — struck on the "and of 2" and on four with a bass note walked up to it, the way a jump-blues or western-swing guitarist comps behind a horn line; the 6/9 on the I. The change fills walk the bass strings into the new chord; the stops leave the guitar alone with the grip.',
            figure: [n(0, 0, 2, 0.8, PM), s(2, 1, 0.7, 'ninth', null, ST), n(3, 4, 1.5, 0.75, PM), s(5, 1.5, 0.75, 'ninth', null, ST), n(6, 7, 2, 0.8, PM), n(8, 9, 1, 0.7, PM), s(9, 1.5, 0.75, 'ninth', null, ST), n(11, 7, 1, 0.7, PM)],
            variants: [
              [s(0, 1, 0.7, 'ninth', null, ST), n(2, 0, 1, 0.75, PM), s(3, 1, 0.7, 'ninth', null, ST), n(5, 4, 1, 0.7, PM), s(6, 1, 0.7, 'ninth', null, ST), n(8, 7, 1, 0.75, PM), s(9, 1, 0.7, 'ninth', null, ST), n(11, 9, 1, 0.7, PM)],
              [n(0, 0, 3, 0.8, PM), s(3, 1.5, 0.75, 'ninth', null, DIP), n(6, 7, 3, 0.8, PM), s(9, 1.5, 0.75, 'ninth', null, DIP)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 0, 1.5, 0.8, PM), n(2, 4, 1, 0.7, PM), n(3, 7, 1.5, 0.8, PM), n(5, 9, 1, 0.7, PM), s(6, 1.5, 0.75, 'ninth', null, ST), n(8, 9, 1, 0.7, PM), n(9, 7, 1.5, 0.8, PM), n(11, 4, 1, 0.7, PM)],
            ],
            fillsOnChange: [
              [n(0, 0, 2, 0.8, PM), s(2, 1, 0.7, 'ninth', null, ST), n(3, 4, 1.5, 0.75, PM), n(5, 7, 1, 0.7, PM), ...walkUp12(6)],
              [s(0, 1.5, 0.75, 'ninth', null, ST), n(3, 0, 1.5, 0.8, PM), n(5, 4, 1, 0.7, PM), n(6, 5, 1.5, 0.75, PM), n(8, 7, 1, 0.75, PM), sn(9, 2.5, 0.8, 'ninth', { chordSlide: 1 })],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.8, PM), s(2, 1, 0.7, 'ninth', null, ST), n(3, 4, 1.5, 0.75, PM), s(5, 1.5, 0.75, 'ninth', null, ST), n(6, 7, 1, 0.8, PM), n(7, 6, 1, 0.65, { free: true, pm: true }), n(8, 5, 1, 0.7, PM), s(9, 1.5, 0.75, 'ninth', null, ST), n(11, 4, 1, 0.7, PM)],
            ],
            stops: [[s(0, 2.5, 0.95, 'ninth', null, DIP), n(6, 12, 1, 0.8), n(7, 11, 1, 0.6, F), n(8, 9, 1, 0.7), n(9, 7, 2, 0.75)]], stopChance: 0.15,
            leads: [
              [n(0, 16, 2, 0.8), n(2, 14, 1, 0.65), n(3, 12, 2, 0.75), n(5, 9, 1, 0.65), n(6, 7, 2, 0.75), n(8, 5, 1, 0.6, F), n(9, 4, 2, 0.75), n(11, 0, 1, 0.65)],
              [d(0, 9, 16, 2, 0.8), d(2, 9, 16, 1, 0.6), n(3, 12, 2, 0.75), n(5, 14, 1, 0.65), n(6, 16, 2, 0.8), n(8, 12, 1, 0.65), n(9, 9, 2, 0.75), n(11, 7, 1, 0.6)],
            ],
            leadChance: 0.35,
            easy: { figure: [n(0, 0, 3, 0.8), s(3, 3, 0.7, 'ninth'), n(6, 7, 3, 0.8), s(9, 3, 0.7, 'ninth')] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Stray descent (the Strut way)', inspired: '"Stray Cat Strut" — the swung walk-down of 7th chords in a minor key, jazz voicings, the Bigsby', style: 'psychobilly',
        progression: ['Cm', 'Bb7', 'Ab7', 'G7', 'Cm', 'G7'], key: 'C', mode: 'minor', tempo: 108, scaleTheory: 'modal',
        why: `<p>The revival's slow one: a minor key walking down by whole steps through 7th chords to the V, in a swung eighth-note feel at a strut's pace, the chords stabbed on two and four with the Bigsby pressed on the way into the change, the bass in a two-feel with the slap on the backbeat. The lead is bebop over rockabilly — the Mixolydian with the major 7th passing, chromatic approaches, pull-offs on two strings, economy-picked arpeggios — which is what the sources hear in Setzer's lines.</p>`,
        band: { grid: 12, kick: [0, 6], kickVel: 0.8, snare: [3, 9], snareVel: 0.75, hat: [3, 9], ride: [0, 2, 3, 5, 6, 8, 9, 11], voice: 'dom7', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 2.6, vel: 0.9 }, { slot: 6, off: 7, dur: 2.6, vel: 0.8 }], bassApproach: true, bassSnap: true,
                slap: [3, 9], slapVel: 0.6,
                chord: [{ slot: 3, dur: 1, vel: 0.5 }, { slot: 9, dur: 1, vel: 0.45 }], fill: { snare: [6, 8, 9, 10, 11], kick: [0] } },
        parts: [
          {
            name: 'Stabs with the Bigsby dip',
            why: 'The strut: the root on the bass strings on one and the 5th on three, the chord short on two and four on the top strings, and the Bigsby dipped on the stab that leads into a change — the "typical Setzer fashion", as the Premier Guitar lesson puts it. The variants hold the chord and dip the whole of it, and walk it in from a fret below. The change fills are the bass line coming down by step under the stabs.',
            figure: [n(0, 0, 2, 0.75, PM), s(3, 1, 0.8, 'high', null, ST), n(6, 7, 2, 0.7, PM), s(9, 1, 0.8, 'high', null, { stacc: true, dip: true })],
            variants: [
              [s(0, 3, 0.85, 'high', null, DIP), s(6, 3, 0.8, 'high'), s(9, 1, 0.6, 'high', null, ST)],
              [n(0, 0, 2, 0.75, PM), s(2, 1, 0.55, 'high', null, { stacc: true, chordSlide: 1 }), s(3, 1, 0.8, 'high', null, ST), n(6, -5, 2, 0.7, PM), s(9, 1, 0.8, 'high', null, ST)],
            ],
            figureMode: 'roll',
            fills: [
              // the bass line walking down under the stabs
              [n(0, 0, 1.5, 0.8, PM), n(2, -1, 1, 0.65, { free: true, pm: true }), s(3, 1, 0.75, 'high', null, ST), n(5, -2, 1, 0.7, PM), n(6, -3, 1.5, 0.75, PM), n(8, -5, 1, 0.7, PM), s(9, 1, 0.75, 'high', null, ST), n(11, -4, 1, 0.7, { free: true, pm: true })],
            ],
            fillsOnChange: [
              [n(0, 0, 2, 0.75, PM), s(3, 1, 0.8, 'high', null, ST), n(6, 7, 1.5, 0.7, PM), n(8, 5, 1, 0.65, PM), s(9, 1, 0.8, 'high', null, { stacc: true, dip: true }), nx(11, -1, 1, 0.7, { free: true, pm: true })],
              [n(0, 0, 2, 0.75, PM), s(3, 1, 0.8, 'high', null, ST), ...walkUp12(6)],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.75, PM), s(2, 1, 0.6, 'high', null, ST), s(3, 1, 0.8, 'high', null, ST), n(6, 7, 2, 0.7, PM), s(8, 1, 0.6, 'high', null, ST), s(9, 1, 0.8, 'high', null, DIP)],
            ],
            stops: [[s(0, 3, 0.95, 'high', null, DIP), n(6, 12, 1, 0.8), n(8, 10, 1, 0.7), n(9, 7, 2, 0.75)]], stopChance: 0.12,
            leads: [
              // the chromatic walk down from the octave, then the arpeggio
              [n(0, 12, 1, 0.8), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.7), n(3, 9, 1, 0.65, F), n(4, 8, 1, 0.7, F), n(5, 7, 1, 0.75), n(6, 3, 2, 0.8), n(8, 5, 1, 0.6), n(9, 7, 2, 0.75), n(11, 10, 1, 0.6)],
              [p(0, 15, 12, 1, 0.8), n(1, 10, 1, 0.7), n(2, 7, 1, 0.7), n(3, 12, 2, 0.8), n(5, 10, 1, 0.65), sl(6, 5, 7, 2, 0.8), n(8, 10, 1, 0.65), b(9, 10, 2, 2, 0.8, V), n(11, 7, 1, 0.6)],
              [n(0, 7, 1, 0.75, { rake: true }), n(1, 10, 1, 0.7), n(2, 12, 1, 0.75), n(3, 15, 2, 0.8), n(5, 14, 1, 0.6, F), n(6, 12, 2, 0.8), n(8, 10, 1, 0.65), n(9, 7, 2, 0.75, V), n(11, 3, 1, 0.6)],
            ],
            leadChance: 0.5,
            easy: { figure: [n(0, 0, 3, 0.75), s(3, 3, 0.8, 'high'), n(6, 7, 3, 0.7), s(9, 3, 0.8, 'high')] },
          },
          {
            name: 'Bebop lines over the descent',
            why: 'A lead part the way Guitar World hears Setzer: the bebop scale — the Mixolydian with the major 7th added between the root and the ♭7 — over each 7th chord, chromatic passing notes in a pentatonic line, pull-offs on two strings under one finger, economy-picked arpeggios, Charlie Christian in a rockabilly band. Swung, with room between the phrases for the echo.',
            figure: [n(0, 12, 1, 0.8), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.75), n(3, 9, 2, 0.75, F), n(5, 7, 1, 0.7), n(6, 4, 1, 0.75), n(7, 5, 1, 0.65, F), n(8, 7, 1, 0.75), n(9, 10, 2, 0.8, V)],
            variants: [
              // the arpeggio up, economy-picked, and the 9th on top
              [n(0, 0, 1, 0.8), n(1, 4, 1, 0.75), n(2, 7, 1, 0.75), n(3, 10, 1, 0.8), n(4, 12, 1, 0.75), n(5, 14, 1, 0.7), n(6, 12, 2, 0.8), p(8, 10, 7, 1, 0.65), n(9, 4, 2, 0.75), n(11, 0, 1, 0.6)],
              // pull-offs on two strings: the 3rd and the octave, then the 2nd and the 7th
              [d(0, 4, 12, 1, 0.8), d(1, 2, 11, 1, 0.6, F), d(2, 4, 12, 1, 0.7), n(3, 7, 2, 0.75), n(5, 6, 1, 0.6, F), n(6, 5, 1, 0.7), n(7, 4, 1, 0.75), n(8, 0, 1, 0.7), n(9, 10, 2, 0.8, V)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 7, 1, 0.75, { rake: true }), n(1, 10, 1, 0.7), n(2, 12, 1, 0.75), n(3, 15, 2, 0.8), n(5, 14, 1, 0.6, F), n(6, 12, 1, 0.75), n(7, 11, 1, 0.6, F), n(8, 10, 1, 0.7), n(9, 7, 2, 0.75, V)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.8), n(2, 10, 1, 0.7), n(3, 7, 2, 0.75), n(5, 4, 1, 0.65), n(6, 0, 1.5, 0.75, PM), n(8, -1, 1, 0.65, { free: true, pm: true }), nx(9, 4, 1.5, 0.75), nx(11, 7, 1, 0.7)],
              [n(0, 12, 1, 0.8), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.75), n(3, 9, 1, 0.65, F), n(4, 8, 1, 0.65, F), n(5, 7, 1, 0.75), ...walkUp12(6)],
            ],
            fillsOnStay: [
              [n(0, 3, 2, 0.8), n(2, 5, 1, 0.65), n(3, 7, 2, 0.8), n(5, 10, 1, 0.7), n(6, 12, 2, 0.8, V), n(8, 10, 1, 0.65), n(9, 7, 2, 0.75), n(11, 3, 1, 0.6)],
            ],
            tails: [[n(9, 12, 1, 0.65), n(10, 11, 1, 0.55, F), n(11, 10, 1, 0.65)]], tailChance: 0.3,
            turnaround: [n(0, 12, 1, 0.8), n(1, 10, 1, 0.7), n(2, 7, 1, 0.75), n(3, 4, 2, 0.75), n(5, 3, 1, 0.65, F), n(6, 0, 2, 0.75), n(8, -1, 1, 0.6, F), n(9, -2, 1, 0.65), n(10, -3, 1, 0.65, F), n(11, -5, 1, 0.7)],
            easy: { figure: [n(0, 0, 3, 0.8), n(3, 4, 3, 0.75), n(6, 7, 3, 0.8), n(9, 10, 3, 0.75)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Train two-step (the Cash and country way)', inspired: '"Folsom Prison Blues", "Bales of Cocaine", "Cowboy Love" — Luther Perkins\' palm-muted boom-chicka, the train beat with brushes, chicken pickin\'', style: 'psychobilly',
        progression: ['G', 'G', 'C', 'G', 'D7', 'G'], key: 'G', tempo: 168,
        why: `<p>The country in the Reverend's "country-fed punkabilly": Luther Perkins' figure — the bass note on the beat with the heel of the hand on the strings, the muted chord on the "and", the 5th on the next beat — under a train beat: brushes in sixteenths on the snare with the backbeat struck, the kick on one and three, the bass in two with the slap on two and four. The fills are chicken pickin': notes snapped by the fingers, 6ths on the D and B strings, the 2nd bent to the 3rd the way a steel would.</p>`,
        band: { grid: 16, kick: [0, 8], kickVel: 0.8, snare: [4, 12], snareVel: 0.8, brush: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15], hat: [], voice: 'triad', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 3.5, vel: 0.9 }, { slot: 8, off: 7, dur: 3.5, vel: 0.85 }], bassApproach: true, bassSnap: true,
                slap: [4, 12], slapVel: 0.65,
                chord: [{ slot: 4, dur: 1, vel: 0.3 }, { slot: 12, dur: 1, vel: 0.28 }], fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0] } },
        parts: [
          {
            name: 'Luther\'s boom-chicka, palm-muted',
            why: 'The Tennessee Two figure as the pages describe it: the root on one and the 5th on three on the bass strings with the heel of the hand on them, the chord short and muted on the "and" — boom, chick, boom, chick — and a walk to the next root when the chord changes. The variants take the 3rd as the second bass note and walk 1–2–3 between the chicks; the fills play the boogie on the low strings. The lead lines are chicken pickin\' over the train.',
            figure: [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), s(6, 1, 0.4, 'high', 'mute'), s(8, 2, 0.8, 'fifth', null, PM), s(12, 1, 0.55, 'high', null, PMS), s(14, 1, 0.4, 'high', 'mute')],
            variants: [
              [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), s(6, 1, 0.4, 'high', 'mute'), n(8, 4, 2, 0.8, PM), s(12, 1, 0.55, 'high', null, PMS), s(14, 1, 0.4, 'high', 'mute')],
              // 1–2–3 walked between the chicks
              [n(0, 0, 2, 0.85, PM), s(4, 1, 0.55, 'high', null, PMS), n(6, 2, 2, 0.7, PM), n(8, 4, 2, 0.8, PM), s(12, 1, 0.55, 'high', null, PMS), n(14, 7, 2, 0.7, PM)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 0, 2, 0.85, PM), n(2, 4, 2, 0.75, PM), n(4, 7, 2, 0.8, PM), n(6, 9, 2, 0.75, PM), n(8, 10, 2, 0.8, PM), n(10, 9, 2, 0.75, PM), n(12, 7, 2, 0.8, PM), n(14, 4, 2, 0.75, PM)],
            ],
            fillsOnChange: [
              [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), s(6, 1, 0.4, 'high', 'mute'), ...walkUp16(8)],
              [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), s(6, 1, 0.4, 'high', 'mute'), s(8, 2, 0.8, 'fifth', null, PM), s(12, 1, 0.55, 'high', null, PMS), nx(14, -1, 2, 0.8, { free: true, pm: true })],
            ],
            fillsOnStay: [
              [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), n(6, 4, 1, 0.6, PM), n(7, 5, 1, 0.6, PM), s(8, 2, 0.8, 'fifth', null, PM), s(12, 1, 0.55, 'high', null, PMS), n(14, 2, 1, 0.6, PM), n(15, 4, 1, 0.6, PM)],
            ],
            pickups: [[nx(12, -3, 2, 0.7, PM), nx(14, -1, 2, 0.75, PM)]], pickupChance: 0.4,
            turnaround: [s(0, 2, 0.85, 'bass', null, PM), s(4, 1, 0.55, 'high', null, PMS), n(6, 7, 2, 0.75, PM), n(8, 5, 2, 0.75, PM), n(10, 4, 2, 0.75, PM), n(12, 2, 2, 0.75, PM), n(14, 0, 2, 0.8, PM)],
            leads: [
              [n(0, 12, 2, 0.8, POP), n(2, 9, 2, 0.7, POP), n(4, 7, 2, 0.8, POP), p(6, 4, 2, 2, 0.65), n(8, 0, 4, 0.8, V), n(12, 4, 2, 0.7, POP), n(14, 7, 2, 0.7, POP)],
              // 6ths on the D and B strings, the 2nd bent to the 3rd
              [d(0, 4, 12, 2, 0.8), d(2, 5, 14, 1, 0.6, F), d(3, 4, 12, 1, 0.7), n(4, 7, 2, 0.75, POP), b(6, 2, 2, 2, 0.8), n(8, 4, 2, 0.75), n(10, 0, 2, 0.7, POP), d(12, 0, 9, 4, 0.75)],
            ],
            leadChance: 0.4,
            easy: { figure: [s(0, 4, 0.85, 'bass'), s(4, 4, 0.55, 'high'), s(8, 4, 0.8, 'fifth'), s(12, 4, 0.55, 'high')] },
          },
          {
            name: 'Chicken-pickin\' fills',
            why: 'A lead part in the country hand Heath brings to the trio: notes popped by the middle and ring fingers behind the pick, the 2nd pulled off to the open string, 6ths on the D and B strings slid up, the 2nd bent to the 3rd and the 5th to the 6th with a note held above them — the steel imitation Carl Perkins is credited with — the major pentatonic with the ♭3 passing. Short, dry, and even.',
            figure: [n(0, 12, 1, 0.85, POP), n(1, 11, 1, 0.55, F), n(2, 9, 2, 0.75, POP), n(4, 7, 2, 0.8, POP), p(6, 9, 7, 1, 0.65), n(7, 4, 1, 0.7), n(8, 5, 2, 0.6, { free: true, pop: true }), n(10, 4, 2, 0.75, POP), n(12, 0, 4, 0.8, V)],
            variants: [
              // the 2nd pulled off to the root, twice, then the 5th popped
              [p(0, 2, 0, 1, 0.75), n(1, 4, 1, 0.7, POP), p(2, 2, 0, 1, 0.75), n(3, 4, 1, 0.7, POP), n(4, 7, 2, 0.8, POP), d(6, 4, 12, 2, 0.75), n(8, 9, 2, 0.75, POP), n(10, 7, 2, 0.7, POP), n(12, 4, 2, 0.75, POP), n(14, 0, 2, 0.7)],
              // the steel bends: the 2nd to the 3rd, the 5th to the 6th
              [b(0, 2, 2, 4, 0.85), n(4, 4, 2, 0.7, POP), b(6, 7, 2, 4, 0.85, V), n(10, 9, 2, 0.7, POP), n(12, 12, 4, 0.8, V)],
            ],
            figureMode: 'roll',
            fills: [
              [d(0, 4, 12, 2, 0.8), d(2, 5, 14, 2, 0.65, F), d(4, 7, 16, 2, 0.8), n(6, 12, 2, 0.7, POP), n(8, 9, 2, 0.75, POP), n(10, 7, 2, 0.7, POP), n(12, 4, 2, 0.75, POP), n(14, 0, 2, 0.7)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.8, POP), n(2, 9, 2, 0.7, POP), n(4, 7, 2, 0.75, POP), n(6, 4, 2, 0.7, POP), ...walkUp16(8)],
              [d(0, 4, 12, 2, 0.8), d(2, 4, 12, 2, 0.6), n(4, 9, 2, 0.75, POP), n(6, 7, 2, 0.7, POP), n(8, 4, 2, 0.75, PM), n(10, 5, 2, 0.7, PM), nx(12, 4, 2, 0.75, POP), nx(14, 0, 2, 0.8)],
            ],
            fillsOnStay: [
              [n(0, 7, 1, 0.8, POP), n(1, 6, 1, 0.55, F), n(2, 5, 1, 0.65, F), n(3, 4, 1, 0.75, POP), n(4, 0, 2, 0.75), n(6, 4, 2, 0.7, POP), n(8, 7, 2, 0.8, POP), n(10, 9, 2, 0.7, POP), n(12, 12, 4, 0.8, V)],
            ],
            tails: [[n(12, 9, 1, 0.65, POP), n(13, 10, 1, 0.55, F), n(14, 12, 2, 0.7, POP)]], tailChance: 0.3,
            turnaround: [n(0, 12, 2, 0.8, POP), n(2, 9, 2, 0.7, POP), n(4, 7, 2, 0.75, POP), n(6, 5, 2, 0.7, POP), n(8, 4, 2, 0.75, POP), n(10, 2, 2, 0.7, POP), n(12, 0, 2, 0.8), n(14, -1, 2, 0.7, { free: true, pm: true })],
            easy: { figure: [n(0, 0, 4, 0.8), n(4, 4, 4, 0.75), n(8, 7, 4, 0.8), n(12, 9, 4, 0.75)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Psychobilly stomp (the Meteors way)', inspired: '"Wreckin\' Crew", "Graveyard Stomp", the Klub Foot bands — straight eighths in a minor key, the ♭2 and the ♭5, the double slap', style: 'psychobilly',
        progression: ['Em', 'Em', 'G', 'Em', 'B7', 'Em'], key: 'E', mode: 'minor', tempo: 192, scaleTheory: 'modal',
        why: `<p>The first wave's own rhythm: rockabilly's eighths straightened out and doubled in weight, in a minor key, at a pace the Sun players never went — power chords palm-muted on the low strings, the riff underneath in the minor pentatonic with the ♭5 let through and the ♭2 leaned on for menace, the kick on every beat, the snare hard on two and four, the bass snapped on the beat with two slaps on the sixteenths after it (the psychobilly "double slap"). The lead is tremolo-picked and chromatic; a stop-time bar hits the One and leaves the guitar alone with the crowd.</p>`,
        band: { grid: 16, kick: [0, 4, 8, 12], kickVel: 0.9, snare: [4, 12], snareVel: 0.95, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 1.8, vel: 0.95 }, { slot: 4, off: 0, dur: 1.8, vel: 0.85 }, { slot: 8, off: 7, dur: 1.8, vel: 0.9 }, { slot: 12, off: 0, dur: 1.8, vel: 0.85 }], bassApproach: true, bassSnap: true,
                slap: [2, 3, 6, 7, 10, 11, 14, 15], slapVel: 0.6,
                chord: [{ slot: 4, dur: 1, vel: 0.35 }, { slot: 12, dur: 1, vel: 0.35 }], fill: { snare: [8, 9, 10, 11, 12, 13, 14, 15], kick: [0, 4] } },
        parts: [
          {
            name: 'Palm-muted eighths with the ♭3 riff',
            why: 'The stomp as the guitar plays it: root-and-5th chords in muted eighths, downstrokes, for two beats, then the riff on the low strings — root, ♭3, 4th, the ♭5 passing (free, so it stays a ♭5 whatever the reading) up to the 5th. The variants gallop the chord and walk down chromatically from the 5th; the fills tremolo-pick the ♭2 against the root; the change fills walk up to the new chord or slide it in from a fret below. The lead lines are the horror ones: the ♭2, the ♭5, the tremolo and the dip.',
            figure: [...eighths(0.9, 4), n(8, 0, 2, 0.9, PM), n(10, 3, 2, 0.85, PM), n(12, 5, 2, 0.85, PM), n(14, 6, 1, 0.8, { free: true, pm: true }), n(15, 7, 1, 0.85, PM)],
            variants: [
              gallop(0.9),
              [...eighths(0.9, 4), n(8, 7, 2, 0.85, PM), n(10, 6, 2, 0.8, { free: true, pm: true }), n(12, 5, 2, 0.85, PM), n(14, 3, 2, 0.85, PM)],
            ],
            figureMode: 'roll',
            fills: [
              [...eighths(0.9, 4), n(8, 1, 4, 0.85, { free: true, trem: 8 }), n(12, 0, 4, 0.9, TREM)],
            ],
            fillsOnChange: [
              [...eighths(0.9, 4), ...walkUp16(8)],
              [s(0, 2, 0.9, 'power', null, PMD), s(2, 2, 0.75, 'power', null, PMD), s(4, 2, 0.9, 'power', null, { pm: true, stroke: 'down', chordSlide: 1 }), s(6, 2, 0.75, 'power', null, PMD), s(8, 2, 0.9, 'power', null, PMD), s(10, 2, 0.75, 'power', null, PMD), sn(12, 4, 0.9, 'power', DOWN)],
            ],
            fillsOnStay: [
              [s(0, 2, 0.9, 'power', null, PMD), s(2, 2, 0.75, 'power', null, PMD), n(4, 12, 2, 0.85), n(6, 10, 2, 0.8), n(8, 7, 2, 0.85), n(10, 6, 1, 0.75, { free: true, pm: true }), n(11, 5, 1, 0.8, PM), n(12, 3, 2, 0.85, PM), n(14, 0, 2, 0.9, PM)],
            ],
            stops: [[s(0, 2, 1, 'power', null, DOWN), n(8, 12, 2, 0.9, { rake: true }), n(10, 10, 2, 0.85), n(12, 7, 2, 0.85), n(14, 3, 2, 0.9)]], stopChance: 0.2,
            leads: [
              [n(0, 12, 2, 0.9, { trem: 4 }), n(2, 13, 2, 0.8, { free: true, trem: 4 }), n(4, 12, 2, 0.85), n(6, 10, 2, 0.8), n(8, 7, 4, 0.85, V), n(12, 6, 1, 0.75, F), n(13, 5, 1, 0.8), n(14, 3, 2, 0.85)],
              [d(0, 12, 19, 2, 0.9), d(2, 12, 19, 2, 0.7), n(4, 15, 2, 0.85), n(6, 13, 2, 0.8, F), n(8, 12, 4, 0.9, DIP), n(12, 7, 2, 0.8), n(14, 5, 2, 0.8)],
              [b(0, 5, 2, 4, 0.9, V), n(4, 3, 2, 0.8), n(6, 0, 2, 0.85), n(8, 1, 2, 0.8, F), n(10, 0, 2, 0.85), n(12, 12, 4, 0.9, TREM)],
            ],
            leadChance: 0.5,
            easy: { figure: [s(0, 4, 0.9, 'power'), s(4, 4, 0.85, 'power'), n(8, 0, 4, 0.9, PM), n(12, 3, 4, 0.85, PM)] },
          },
          {
            name: 'Horror lines: the ♭2, the ♭5 and the tremolo',
            why: 'A lead part for the stomp: the minor pentatonic with the ♭2 leaned on against the root and the ♭5 slid through, tremolo-picked held notes, a chromatic descent, a rake into the octave, a dip at the end of a phrase — the surf and the B-movie in the guitar, as the guides describe the genre\'s "chromatic runs" and "dissonant intervals". Straight eighths and sixteenths, alternate-picked, hard.',
            figure: [n(0, 12, 4, 0.9, TREM), n(4, 13, 2, 0.8, F), n(6, 12, 2, 0.85), n(8, 10, 2, 0.8), n(10, 7, 2, 0.85), n(12, 6, 1, 0.75, F), n(13, 5, 1, 0.8), n(14, 3, 2, 0.85)],
            variants: [
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.8), n(3, 9, 1, 0.6, F), n(4, 8, 1, 0.7, F), n(5, 7, 1, 0.8), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85, TREM), n(12, 1, 2, 0.8, F), n(14, 0, 2, 0.9)],
              [d(0, 0, 12, 2, 0.9), d(2, 1, 13, 2, 0.8, F), d(4, 0, 12, 2, 0.9), d(6, 3, 15, 2, 0.85), n(8, 7, 4, 0.9, DIP), n(12, 5, 2, 0.8), n(14, 3, 2, 0.8)],
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 6, 2, 0.75, F), n(8, 5, 2, 0.8), n(10, 3, 2, 0.8), n(12, 0, 4, 0.9, TREM)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 0, 2, 0.9, PM), n(2, 1, 2, 0.8, { free: true, pm: true }), n(4, 0, 2, 0.9, PM), n(6, 3, 2, 0.85, PM), n(8, 5, 2, 0.85, PM), n(10, 6, 2, 0.8, { free: true, pm: true }), n(12, 7, 4, 0.9, TREM)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), ...walkUp16(8)],
              [n(0, 7, 4, 0.9, TREM), n(4, 6, 2, 0.75, F), n(6, 5, 2, 0.8), n(8, 3, 2, 0.85), n(10, 0, 2, 0.85), nx(12, 3, 2, 0.8), nx(14, 0, 2, 0.9)],
            ],
            fillsOnStay: [
              [n(0, 12, 2, 0.9), n(2, 12, 2, 0.7), n(4, 15, 2, 0.85), n(6, 12, 2, 0.8), n(8, 10, 2, 0.85), n(10, 7, 2, 0.8), n(12, 6, 2, 0.75, F), n(14, 7, 2, 0.85, DIP)],
            ],
            tails: [[n(12, 3, 2, 0.8), n(14, 1, 2, 0.75, F)]], tailChance: 0.3,
            turnaround: [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), n(8, 3, 2, 0.85), n(10, 1, 2, 0.8, F), n(12, 0, 4, 0.9, TREM)],
            easy: { figure: [n(0, 12, 4, 0.9), n(4, 10, 4, 0.85), n(8, 7, 4, 0.85), n(12, 3, 4, 0.85)] },
          },
          {
            name: 'Downstroke chords with the stops',
            why: 'The other rhythm job in the stomp: the chord open and struck down on every eighth, no muting, with muted sixteenths between when the crowd needs pushing, and the stop-time bars psychobilly leans on — the band hitting the One and dropping out, the guitar holding the chord with the Bigsby pressed, or answering with the riff. The change fills slide the new chord in from a fret below.',
            figure: [...Array(8).keys()].map(k => s(k * 2, 2, k % 2 ? 0.8 : 0.95, 'power', null, DOWN)),
            variants: [
              [0, 4, 8, 12].flatMap(k => [s(k, 1, 0.95, 'power', null, DOWN), s(k + 1, 1, 0.5, 'power', 'mute'), s(k + 2, 1, 0.85, 'power', null, DOWN), s(k + 3, 1, 0.5, 'power', 'mute')]),
              [s(0, 4, 0.95, 'power', null, DOWN), s(4, 2, 0.85, 'power', null, DOWN), s(6, 2, 0.8, 'power', null, DOWN), s(8, 4, 0.95, 'power', null, DOWN), s(12, 2, 0.85, 'power', null, DOWN), s(14, 2, 0.8, 'power', null, DOWN)],
            ],
            fills: [
              [s(0, 2, 0.95, 'power', null, DOWN), s(2, 2, 0.8, 'power', null, DOWN), s(4, 2, 0.95, 'power', null, DOWN), s(6, 2, 0.8, 'power', null, DOWN), n(8, 0, 2, 0.9, PM), n(10, 3, 2, 0.85, PM), n(12, 5, 2, 0.85, PM), n(14, 7, 2, 0.85, PM)],
            ],
            fillsOnChange: [
              [s(0, 2, 0.95, 'power', null, DOWN), s(2, 2, 0.8, 'power', null, DOWN), s(4, 2, 0.95, 'power', null, DOWN), s(6, 2, 0.8, 'power', null, DOWN), ...walkUp16(8)],
              [s(0, 2, 0.95, 'power', null, DOWN), s(2, 2, 0.8, 'power', null, DOWN), s(4, 2, 0.95, 'power', null, DOWN), s(6, 2, 0.8, 'power', null, DOWN), s(8, 2, 0.95, 'power', null, DOWN), s(10, 2, 0.8, 'power', null, DOWN), sn(12, 4, 0.95, 'power', { stroke: 'down', chordSlide: 1 })],
            ],
            fillsOnStay: [
              [s(0, 2, 0.95, 'power', null, DOWN), s(2, 2, 0.8, 'power', null, DOWN), s(4, 2, 0.95, 'power', null, DOWN), s(6, 2, 0.8, 'power', null, DOWN), s(8, 4, 0.95, 'power', null, { stroke: 'down', dip: true }), s(12, 2, 0.85, 'power', null, DOWN), s(14, 2, 0.8, 'power', null, DOWN)],
            ],
            stops: [
              [s(0, 4, 1, 'power', null, { stroke: 'down', dip: true })],
              [s(0, 2, 1, 'power', null, DOWN), s(4, 2, 1, 'power', null, DOWN), n(8, 0, 2, 0.9, PM), n(10, 3, 2, 0.85, PM), n(12, 5, 2, 0.85, PM), n(14, 7, 2, 0.9, PM)],
            ], stopChance: 0.3,
            leads: [
              [n(0, 12, 4, 0.9, TREM), n(4, 10, 2, 0.8), n(6, 7, 2, 0.85), n(8, 5, 2, 0.8), n(10, 3, 2, 0.85), n(12, 0, 4, 0.9, DIP)],
            ],
            leadChance: 0.3,
            easy: { figure: [s(0, 4, 0.95, 'power'), s(4, 4, 0.85, 'power'), s(8, 4, 0.95, 'power'), s(12, 4, 0.85, 'power')] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Wrecking pace (the second wave)', inspired: '"Holy Hack Jack", "Gargoyles over Copenhagen", the Klub Foot at full tilt — downstrokes, gallops, the twelve bars at two hundred, drag-triplet slaps', style: 'psychobilly',
        progression: ['A', 'A', 'D', 'A', 'E', 'D'], key: 'A', tempo: 212,
        why: `<p>Punk's tempo with rockabilly's changes: the twelve bars run at over two hundred, every chord a downstroke, palm-muted eighths that break into gallops — sixteenth, sixteenth, eighth — the kick on one and three, the snare on two and four at full weight, the bass in root and 5th with two slaps on the sixteenths after every note, the "drag triplet" the slap-bass columns say the genre needs. The lead is the blues scale in sixteenths across the strings, a double stop bent, and a dip to end.</p>`,
        band: { grid: 16, kick: [0, 8], kickVel: 0.95, snare: [4, 12], snareVel: 1, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [6, 14], voice: 'triad', slapback: true,
                bass: [{ slot: 0, off: 0, dur: 1.8, vel: 0.95 }, { slot: 4, off: 7, dur: 1.8, vel: 0.85 }, { slot: 8, off: 0, dur: 1.8, vel: 0.95 }, { slot: 12, off: 7, dur: 1.8, vel: 0.85 }], bassApproach: true, bassSnap: true,
                slap: [2, 3, 6, 7, 10, 11, 14, 15], slapVel: 0.7,
                chord: [{ slot: 4, dur: 1, vel: 0.3 }, { slot: 12, dur: 1, vel: 0.3 }], fill: { snare: [8, 10, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Downstroke power chords, the gallop',
            blues: true,
            why: 'The second wave\'s rhythm guitar: every stroke down, the chord muted with the heel of the hand, in eighths or in gallops, the new chord slid in from a fret below on a change or pushed on the "and of 4", and the stops — the band out, the chord hanging with the bar pressed. Fills drop the pentatonic down the low strings; the lead lines are the blues scale at speed.',
            figure: gallop(0.95),
            variants: [
              eighths(0.95),
              [...eighths(0.95, 4), s(8, 2, 0.95, 'power', null, { pm: true, stroke: 'down', chordSlide: 1 }), s(10, 2, 0.8, 'power', null, PMD), s(12, 2, 0.95, 'power', null, PMD), s(14, 2, 0.8, 'power', null, PMD)],
            ],
            figureMode: 'roll',
            fills: [
              [...eighths(0.95, 4), n(8, 12, 2, 0.9), n(10, 10, 2, 0.85), n(12, 7, 2, 0.85), n(14, 5, 2, 0.85)],
            ],
            fillsOnChange: [
              [...eighths(0.95, 4), ...walkUp16(8)],
              [...eighths(0.95, 7), sn(14, 2, 0.95, 'power', { stroke: 'down' })],
            ],
            fillsOnStay: [
              [...gallop(0.95).slice(0, 6), s(8, 4, 0.95, 'power', null, { stroke: 'down', dip: true }), s(12, 2, 0.9, 'power', null, PMD), s(14, 2, 0.8, 'power', null, PMD)],
            ],
            stops: [[s(0, 2, 1, 'power', null, DOWN), s(4, 2, 1, 'power', null, DOWN), s(8, 2, 1, 'power', null, DOWN), s(12, 4, 1, 'power', null, { stroke: 'down', dip: true })]], stopChance: 0.2,
            leads: [
              [n(0, 12, 1, 0.9), n(1, 10, 1, 0.8), n(2, 7, 1, 0.85), n(3, 10, 1, 0.8), n(4, 12, 1, 0.85), n(5, 10, 1, 0.8), n(6, 7, 1, 0.85), n(7, 5, 1, 0.8), n(8, 7, 2, 0.85), b(10, 10, 2, 4, 0.9, V), n(14, 7, 2, 0.8)],
              [d(0, 5, 7, 2, 0.85), d(2, 5, 7, 2, 0.7), d(4, 5, 7, 4, 0.9, { up: 2 }), n(8, 12, 2, 0.85), n(10, 10, 2, 0.8), n(12, 7, 4, 0.85, DIP)],
              [p(0, 7, 5, 1, 0.85), n(1, 3, 1, 0.8), n(2, 0, 1, 0.85), p(3, 7, 5, 1, 0.85), n(4, 3, 1, 0.8), n(5, 0, 1, 0.85), n(6, 3, 1, 0.8), n(7, 4, 1, 0.8, F), n(8, 7, 2, 0.85), n(10, 10, 2, 0.85), n(12, 12, 4, 0.9, V)],
            ],
            leadChance: 0.4,
            easy: { figure: [s(0, 4, 0.95, 'power'), s(4, 4, 0.85, 'power'), s(8, 4, 0.95, 'power'), s(12, 4, 0.85, 'power')] },
          },
          {
            name: 'Twelve bars at speed',
            blues: true,
            why: 'A lead part for the wrecking pace: the minor pentatonic and the blues scale over major chords, in sixteenths across the strings, pull-offs in threes, a double stop with its lower note bent, the major 3rd let in as a passing note, the octave shaken and the phrase ended on a dip — what a psychobilly lead does between verses when the pit is going. Alternate-picked, no slurs except the ones written.',
            figure: [n(0, 12, 1, 0.9), n(1, 10, 1, 0.8), n(2, 7, 1, 0.85), n(3, 10, 1, 0.8), n(4, 12, 1, 0.85), n(5, 15, 1, 0.8), n(6, 12, 1, 0.85), n(7, 10, 1, 0.8), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), n(12, 3, 2, 0.85), n(14, 0, 2, 0.9)],
            variants: [
              [d(0, 5, 7, 4, 0.9, { up: 2 }), n(4, 7, 2, 0.8), n(6, 10, 2, 0.85), n(8, 12, 4, 0.9, V), n(12, 10, 2, 0.8), n(14, 7, 2, 0.8)],
              [n(0, 12, 1, 0.9, { rake: true }), n(1, 15, 1, 0.8), n(2, 17, 1, 0.85), n(3, 16, 1, 0.75, F), n(4, 15, 1, 0.85), n(5, 12, 1, 0.8), n(6, 10, 1, 0.85), n(7, 7, 1, 0.8), n(8, 10, 2, 0.85), n(10, 7, 2, 0.8), n(12, 12, 4, 0.9, DIP)],
              [p(0, 7, 5, 1, 0.85), n(1, 3, 1, 0.8), n(2, 0, 1, 0.85), p(3, 7, 5, 1, 0.85), n(4, 3, 1, 0.8), n(5, 0, 1, 0.85), p(6, 7, 5, 1, 0.85), n(7, 3, 1, 0.8), n(8, 0, 2, 0.9), n(10, 3, 2, 0.85), n(12, 5, 2, 0.85), n(14, 7, 2, 0.9)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 19, 1, 0.9), n(1, 17, 1, 0.8), n(2, 15, 1, 0.85), n(3, 12, 1, 0.8), n(4, 10, 1, 0.85), n(5, 7, 1, 0.8), n(6, 5, 1, 0.85), n(7, 3, 1, 0.8), n(8, 0, 4, 0.9, V), n(12, 3, 2, 0.85), n(14, 5, 2, 0.85)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), ...walkUp16(8)],
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 2, 0.85), n(10, 0, 2, 0.85), nx(12, 4, 2, 0.8), nx(14, 7, 2, 0.85)],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.9), n(1, 12, 1, 0.6), n(2, 12, 1, 0.9), n(3, 12, 1, 0.6), n(4, 15, 2, 0.85), n(6, 12, 2, 0.8), n(8, 10, 2, 0.85), n(10, 7, 2, 0.8), n(12, 6, 1, 0.75, F), n(13, 5, 1, 0.8), n(14, 3, 2, 0.85)],
            ],
            tails: [[n(12, 3, 2, 0.8), n(14, 0, 2, 0.85)]], tailChance: 0.3,
            turnaround: [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), n(8, 3, 2, 0.85), n(10, 0, 2, 0.85), nx(12, -2, 2, 0.85, PM), nx(14, -1, 2, 0.9, PM)],
            easy: { figure: [n(0, 12, 4, 0.9), n(4, 10, 4, 0.85), n(8, 7, 4, 0.85), n(12, 0, 4, 0.9)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Surf-billy (the Freakout way)', inspired: '"Psychobilly Freakout" and its "Wipe Out" bridge, "D for Dangerous", Dick Dale — tremolo picking on the low strings, the bar', style: 'psychobilly',
        progression: ['E', 'E', 'E', 'A', 'B7', 'A'], key: 'E', tempo: 164,
        why: `<p>The surf in psychobilly, and in the Reverend's instrumentals: the picking hand as a drum — sixteenth-note tremolo on the low strings, Dick Dale's "pulsation" — with the twelve bars' changes under it, a dive on the bar at the end of a phrase, a rake into the high root, the descent by semitones surf players use for drama. The kit is the surf beat, kick on one, the "and of 2" and three, with the tom roll standing in for the drum break on the last bar; the bass in snapped eighths.</p>`,
        band: { grid: 16, kick: [0, 6, 8], kickVel: 0.9, snare: [4, 12], snareVel: 0.9, hat: [4, 12], ride: [0, 2, 4, 6, 8, 10, 12, 14], voice: 'triad', slapback: true,
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: k >= 8 && k < 12 ? 7 : 0, dur: 1.8, vel: k % 4 === 0 ? 0.95 : 0.8 })), bassApproach: true, bassSnap: true,
                slap: [3, 7, 11, 15], slapVel: 0.5,
                chord: [], fill: { snare: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], kick: [0, 8] } },
        parts: [
          {
            name: 'Tremolo-picked riff on the low strings',
            blues: true,
            why: 'The riff as a surf player writes one: the root tremolo-picked for two beats, then the minor pentatonic falling from the ♭7 to the ♭3 in eighths on the low strings, muted; a variant dives the root with the bar, another tremolos the ♭3 and passes the ♭5. The change fills walk up or tremolo the 5th and fall to the new root; the lead is the surf lead — tremolo on the top strings, the descent, the rake, the dip.',
            figure: [n(0, 0, 8, 0.9, { trem: 8, pm: true }), n(8, 10, 2, 0.85, PM), n(10, 7, 2, 0.8, PM), n(12, 5, 2, 0.8, PM), n(14, 3, 2, 0.85, PM)],
            variants: [
              [n(0, 0, 4, 0.9, { trem: 8, pm: true }), n(4, 3, 4, 0.85, { trem: 8, pm: true }), n(8, 5, 2, 0.8, PM), n(10, 6, 2, 0.75, { free: true, pm: true }), n(12, 7, 4, 0.9, { trem: 8, pm: true })],
              [n(0, 0, 8, 0.9, TREM), n(8, 0, 8, 0.9, { dip: 2 })],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 8, 0.9, TREM), n(8, 10, 2, 0.85), n(10, 7, 2, 0.8), n(12, 5, 2, 0.8), n(14, 3, 2, 0.85)],
            ],
            fillsOnChange: [
              [n(0, 0, 4, 0.9, { trem: 8, pm: true }), n(4, 3, 2, 0.85, PM), n(6, 5, 2, 0.8, PM), ...walkUp16(8)],
              [n(0, 7, 4, 0.9, TREM), n(4, 6, 2, 0.75, { free: true, pm: true }), n(6, 5, 2, 0.8, PM), n(8, 3, 2, 0.85, PM), n(10, 0, 2, 0.85, PM), nx(12, 4, 2, 0.8), nx(14, 0, 2, 0.9)],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.9, PM), n(2, 0, 2, 0.7, PM), n(4, 3, 2, 0.85), n(6, 0, 2, 0.8, PM), n(8, 5, 4, 0.9, TREM), n(12, 0, 4, 0.9, TREM)],
            ],
            stops: [[n(0, 0, 4, 1, TREM), n(4, 0, 4, 0.9, { dip: 2 })]], stopChance: 0.15,
            leads: [
              [n(0, 12, 4, 0.9, TREM), n(4, 15, 2, 0.85), n(6, 12, 2, 0.8), n(8, 10, 4, 0.85, TREM), n(12, 7, 2, 0.8), n(14, 5, 2, 0.8)],
              [n(0, 19, 1, 0.9, { rake: true }), n(1, 17, 1, 0.8), n(2, 15, 1, 0.85), n(3, 12, 1, 0.8), n(4, 15, 4, 0.9, TREM), n(8, 13, 1, 0.75, F), n(9, 12, 1, 0.8), n(10, 10, 2, 0.8), n(12, 7, 4, 0.85, DIP)],
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85, TREM), n(12, 0, 4, 0.9, TREM)],
            ],
            leadChance: 0.45,
            easy: { figure: [n(0, 0, 4, 0.9, PM), n(4, 0, 4, 0.85, PM), n(8, 10, 4, 0.85), n(12, 7, 4, 0.85)] },
          },
          {
            name: 'Surf lead with the bar',
            blues: true,
            why: 'A lead part in the surf idiom the genre borrowed: tremolo-picked runs on the top strings in the minor pentatonic over major chords, the descent by semitones, a rake into the high root, the whole-step bend shaken, and the Bigsby pressed at the end of a phrase — the "rapid-fire, staccato runs" the guides describe. Alternate-picked throughout; the tremolo is the pick, not the amp.',
            figure: [n(0, 12, 4, 0.9, TREM), n(4, 15, 2, 0.85), n(6, 14, 1, 0.7, F), n(7, 12, 1, 0.8), n(8, 10, 4, 0.85, TREM), n(12, 7, 2, 0.8), n(14, 5, 2, 0.8)],
            variants: [
              [n(0, 19, 1, 0.9, { rake: true }), n(1, 17, 1, 0.8), n(2, 15, 1, 0.85), n(3, 12, 1, 0.8), n(4, 15, 4, 0.9, TREM), n(8, 13, 1, 0.75, F), n(9, 12, 1, 0.8), n(10, 10, 2, 0.8), n(12, 7, 4, 0.85, DIP)],
              [b(0, 10, 2, 4, 0.9, V), n(4, 7, 2, 0.8), n(6, 5, 2, 0.8), n(8, 3, 4, 0.85, TREM), n(12, 0, 4, 0.9, TREM)],
              [n(0, 12, 1, 0.9), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.8), n(3, 9, 1, 0.6, F), n(4, 8, 1, 0.7, F), n(5, 7, 1, 0.85), n(6, 6, 1, 0.7, F), n(7, 5, 1, 0.8), n(8, 3, 4, 0.9, TREM), n(12, 0, 4, 0.9, DIP)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 0, 4, 0.9, TREM), n(4, 3, 2, 0.85), n(6, 5, 2, 0.8), n(8, 7, 4, 0.9, TREM), n(12, 10, 2, 0.8), n(14, 12, 2, 0.85)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), ...walkUp16(8)],
              [n(0, 15, 4, 0.9, TREM), n(4, 12, 2, 0.8), n(6, 10, 2, 0.8), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), nx(12, 4, 2, 0.8), nx(14, 0, 2, 0.9)],
            ],
            fillsOnStay: [
              [n(0, 12, 1, 0.9), n(1, 12, 1, 0.6), n(2, 12, 1, 0.9), n(3, 12, 1, 0.6), n(4, 15, 4, 0.9, TREM), n(8, 12, 2, 0.8), n(10, 10, 2, 0.8), n(12, 7, 4, 0.9, DIP)],
            ],
            tails: [[n(12, 5, 2, 0.8), n(14, 3, 2, 0.8)]], tailChance: 0.3,
            turnaround: [n(0, 12, 1, 0.9), n(1, 11, 1, 0.6, F), n(2, 10, 1, 0.8), n(3, 9, 1, 0.6, F), n(4, 8, 1, 0.7, F), n(5, 7, 1, 0.85), n(6, 5, 2, 0.8), n(8, 3, 2, 0.85), n(10, 0, 2, 0.85), nx(12, -2, 2, 0.85, PM), nx(14, -1, 2, 0.9, PM)],
            easy: { figure: [n(0, 12, 4, 0.9), n(4, 10, 4, 0.85), n(8, 7, 4, 0.85), n(12, 5, 4, 0.85)] },
          },
        ],
      },
      // ---------------------------------------------------------------------
      {
        label: 'Horror-minor twang (the third wave)', inspired: '"Nocturnal", "Cupid\'s Victim", the Nekromantix in a minor key — Duane Eddy on the low strings with the echo, the harmonic minor 7th', style: 'psychobilly',
        progression: ['Em', 'C', 'B7', 'Em', 'Am', 'B7'], key: 'E', mode: 'minor', tempo: 148, scaleTheory: 'modal',
        why: `<p>The third wave's minor key: a melody played clean on the low strings with the slapback on it — Duane Eddy's twang, which Nick 13 names first among his influences — over the minor key's own chords with the V a 7th, so the major 7th of the harmonic minor sounds against it; arpeggiated chords in eighths under the voice; the Bigsby dipped at the end of a line. The band drives straight: kick on one and three, the snare on two and four, the bass in snapped eighths with a slap here and there, no comp — a trio.</p>`,
        band: { grid: 16, kick: [0, 8], kickVel: 0.85, snare: [4, 12], snareVel: 0.85, hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [14], voice: 'triad', slapback: true,
                bass: [0, 2, 4, 6, 8, 10, 12, 14].map(k => ({ slot: k, off: k >= 8 && k < 12 ? 7 : 0, dur: 1.8, vel: k % 4 === 0 ? 0.9 : 0.75 })), bassApproach: true, bassSnap: true,
                slap: [3, 11], slapVel: 0.5,
                chord: [], fill: { snare: [8, 10, 12, 14, 15], kick: [0] } },
        parts: [
          {
            name: 'Twang on the low strings with the echo',
            why: 'The melody on the bass strings, played clean and let ring into the echo: the root, the ♭3 and the 4th up to the 5th and back, the 5th shaken, a phrase ended with the bar pressed; a variant starts from the 5th below, another from the octave and falls. The change fills walk up to the new root or hold the 5th and fall to it; the lead lines bring in the major 7th over the V — the harmonic minor colour — the ♭6, and the tremolo.',
            figure: [n(0, 0, 4, 0.9), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), n(8, 7, 4, 0.9, V), n(12, 5, 2, 0.8), n(14, 3, 2, 0.8)],
            variants: [
              [n(0, -5, 4, 0.9), n(4, 0, 2, 0.8), n(6, 3, 2, 0.8), n(8, 5, 4, 0.9, V), n(12, 3, 2, 0.8), n(14, 0, 2, 0.8)],
              [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), n(4, 12, 2, 0.85), n(6, 10, 2, 0.8), n(8, 7, 4, 0.9, DIP), n(12, 3, 2, 0.8), n(14, 0, 2, 0.8)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 4, 0.9, TREM), n(4, 10, 2, 0.8), n(6, 8, 2, 0.75, F), n(8, 7, 4, 0.9, V), n(12, 3, 2, 0.8), n(14, 0, 2, 0.8)],
            ],
            fillsOnChange: [
              [n(0, 0, 4, 0.9), n(4, 3, 2, 0.8), n(6, 5, 2, 0.8), ...walkUp16(8)],
              [n(0, 7, 4, 0.9, V), n(4, 5, 2, 0.8), n(6, 3, 2, 0.8), n(8, 0, 2, 0.85), n(10, -1, 2, 0.75, F), nx(12, 4, 2, 0.8), nx(14, 0, 2, 0.9)],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.9), n(2, 0, 2, 0.7), n(4, 3, 2, 0.85), n(6, 3, 2, 0.7), n(8, 5, 4, 0.9, TREM), n(12, 5, 2, 0.8, DIP), n(14, 3, 2, 0.8)],
            ],
            stops: [[n(0, 0, 8, 1, TREM), n(8, 0, 8, 0.9, { dip: 2 })]], stopChance: 0.12,
            leads: [
              [n(0, 12, 4, 0.9, V), n(4, 11, 2, 0.75, F), n(6, 12, 2, 0.8), n(8, 15, 4, 0.9, V), n(12, 14, 1, 0.7), n(13, 12, 1, 0.75), n(14, 10, 2, 0.8)],
              [sl(0, 10, 12, 2, 0.85), n(2, 15, 2, 0.8), n(4, 12, 4, 0.85, TREM), n(8, 10, 2, 0.8), n(10, 8, 2, 0.75, F), n(12, 7, 4, 0.9, DIP)],
              [n(0, 19, 2, 0.9, { rake: true }), n(2, 17, 2, 0.8), n(4, 15, 4, 0.85, V), n(8, 12, 2, 0.8), n(10, 11, 2, 0.75, F), n(12, 12, 4, 0.9, V)],
            ],
            leadChance: 0.5,
            easy: { figure: [n(0, 0, 4, 0.9), n(4, 3, 4, 0.8), n(8, 7, 4, 0.9), n(12, 3, 4, 0.8)] },
          },
          {
            name: 'Minor arpeggios and dips',
            why: 'The rhythm under a third-wave verse: the minor chord picked as an arpeggio in eighths — root, 5th, octave, ♭3 and back — hybrid-picked and clean, the whole chord struck and dipped on the last beat; a variant strums the low strings muted and the top strings open in eighths. The change fills arpeggiate up to the new chord\'s 3rd; the lead lines are the twang part\'s.',
            figure: [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 15, 2, 0.7), n(8, 12, 2, 0.75), n(10, 7, 2, 0.7), s(12, 4, 0.85, 'high', null, DIP)],
            variants: [
              [s(0, 2, 0.85, 'low', null, PM), s(2, 2, 0.6, 'high'), s(4, 2, 0.6, 'high'), s(6, 2, 0.6, 'high'), s(8, 2, 0.85, 'low', null, PM), s(10, 2, 0.6, 'high'), s(12, 2, 0.6, 'high'), s(14, 2, 0.6, 'high')],
              [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 7, 2, 0.7), n(8, 0, 2, 0.85), n(10, 7, 2, 0.7), n(12, 12, 2, 0.75), n(14, 15, 2, 0.7)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 15, 2, 0.7), n(8, 19, 4, 0.85, V), n(12, 15, 2, 0.75), n(14, 12, 2, 0.7)],
            ],
            fillsOnChange: [
              [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 15, 2, 0.7), ...walkUp16(8)],
              [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 7, 2, 0.7), n(8, 0, 2, 0.8), n(10, 7, 2, 0.7), nx(12, 4, 2, 0.75), nx(14, 7, 2, 0.75)],
            ],
            fillsOnStay: [
              [n(0, 0, 2, 0.85), n(2, 7, 2, 0.7), n(4, 12, 2, 0.75), n(6, 15, 2, 0.7), n(8, 12, 2, 0.75), n(10, 7, 2, 0.7), n(12, 0, 4, 0.85, DIP)],
            ],
            leads: [
              [n(0, 12, 4, 0.9, V), n(4, 11, 2, 0.75, F), n(6, 12, 2, 0.8), n(8, 15, 4, 0.9, V), n(12, 14, 1, 0.7), n(13, 12, 1, 0.75), n(14, 10, 2, 0.8)],
              [sl(0, 10, 12, 2, 0.85), n(2, 15, 2, 0.8), n(4, 12, 4, 0.85, TREM), n(8, 10, 2, 0.8), n(10, 8, 2, 0.75, F), n(12, 7, 4, 0.9, DIP)],
            ],
            leadChance: 0.4,
            easy: { figure: [n(0, 0, 4, 0.85), n(4, 7, 4, 0.7), n(8, 12, 4, 0.75), s(12, 4, 0.85, 'high')] },
          },
          {
            name: 'Minor-key lead with the 7th',
            why: 'A lead part for the third wave: the natural minor on the top strings with the major 7th brought in over the V (free, so it stays a 7th in every reading) — the harmonic minor that makes the B7 pull home — the ♭6 leaned on, slides up to the octave, tremolo-picked held notes, a rake into the top, wide vibrato, a dip at the end. Room between phrases for the echo to answer.',
            figure: [n(0, 12, 4, 0.9, V), n(4, 11, 2, 0.75, F), n(6, 12, 2, 0.8), n(8, 15, 4, 0.9, V), n(12, 14, 1, 0.7), n(13, 12, 1, 0.75), n(14, 10, 2, 0.8)],
            variants: [
              [sl(0, 10, 12, 2, 0.85), n(2, 15, 2, 0.8), n(4, 12, 4, 0.85, TREM), n(8, 10, 2, 0.8), n(10, 8, 2, 0.75, F), n(12, 7, 4, 0.9, DIP)],
              [n(0, 19, 2, 0.9, { rake: true }), n(2, 17, 2, 0.8), n(4, 15, 4, 0.85, V), n(8, 12, 2, 0.8), n(10, 11, 2, 0.75, F), n(12, 12, 4, 0.9, V)],
              [n(0, 7, 2, 0.85), n(2, 8, 2, 0.75, F), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), n(8, 3, 4, 0.9, V), n(12, 2, 2, 0.75), n(14, 0, 2, 0.85)],
            ],
            figureMode: 'roll',
            fills: [
              [n(0, 12, 2, 0.9), n(2, 14, 2, 0.75), n(4, 15, 4, 0.9, TREM), n(8, 12, 2, 0.8), n(10, 10, 2, 0.8), n(12, 7, 4, 0.9, V)],
            ],
            fillsOnChange: [
              [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 7, 2, 0.85), n(6, 5, 2, 0.8), ...walkUp16(8)],
              [n(0, 15, 4, 0.9, V), n(4, 12, 2, 0.8), n(6, 10, 2, 0.8), n(8, 7, 2, 0.85), n(10, 5, 2, 0.8), nx(12, 4, 2, 0.8), nx(14, 0, 2, 0.9)],
            ],
            fillsOnStay: [
              [n(0, 3, 2, 0.85), n(2, 5, 2, 0.8), n(4, 7, 4, 0.9, V), n(8, 8, 2, 0.75, F), n(10, 7, 2, 0.8), n(12, 3, 4, 0.9, DIP)],
            ],
            tails: [[n(12, 11, 2, 0.75, F), n(14, 12, 2, 0.85)]], tailChance: 0.3,
            turnaround: [n(0, 12, 2, 0.9), n(2, 10, 2, 0.8), n(4, 8, 2, 0.8, F), n(6, 7, 2, 0.85), n(8, 5, 2, 0.8), n(10, 3, 2, 0.8), n(12, 0, 2, 0.85), n(14, -1, 2, 0.8, F)],
            easy: { figure: [n(0, 12, 4, 0.9), n(4, 10, 4, 0.8), n(8, 7, 4, 0.9), n(12, 3, 4, 0.8)] },
          },
        ],
      },
    ],
  });
})();
