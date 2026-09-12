// The psychobilly deep dive (psychobilly.html): the page's own data — where
// the hand sits, the grips, the scale figures, the drills, the examples,
// exercises and studies realised from the Psychobilly genre (the feels the
// deep dive added to the app's psychobilly style), the players, the songs
// and the sources — on the machinery every deep dive shares
// (js/deep-dive.js). Nothing here is played from a recording: every tab on
// the page is the engine realising a part of the library.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, SEMITONE } = GT.theory;
  const { STRING_MIDI, CAGED_COLORS, CAGED_MAJOR, CAGED_MINOR, cagedPlacements, arpeggioCells, pentaBoxPlacements, scaleBoxPlacements } = GT.fretboard;
  const { DEG, pcOf, cellKey, pcs, chordNeck, boxMarkers, figure } = GT.neckFollow;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const { boxAt, PENTA_MINOR, PENTA_MAJOR, DORIAN, MIXO, drill, upAndDown, byPitch, withFx, cell } = GT.deepDive.helpers;

  const STYLE = 'psychobilly';
  // ---- where the hand sits: the open position, or the E shape at the key's root ----
  // Rockabilly lives in the open chords and their barres; the box with the
  // root on the low E string — open for E, the 5th fret for A, the 3rd for
  // G, the 8th for C — is where the parts' windows start.
  function homeWindow(key){
    const pc = SEMITONE[key] % 12;
    const f = (pc - 4 + 12) % 12;
    return { min: f, max: f + 3 };
  }
  const windowAt = (min, span = 3) => ({ min, max: min + span });

  // ---- the grips ----
  // pattern low string to high, relative to the lowest fret; `at` is the
  // fret the pattern's 0 sits at for the chord named; `fingers` the hand,
  // string by string — 1 to 4 the fingers, 0 an open string, x a string left
  // out. Grouped: a core shape, and the variations that are the same hand
  // with a finger moved.
  const GRIP_GROUPS = [
    { core: { name: 'The open E and its 6th (E6): the chicka', basis: 'in the sources [4] [5] [6]; the fingering is the usual way', chord: 'E6', pattern: '0-2-2-1-2-0', at: 0, fingers: '0-2-3-1-4-0', what: 'The open E with the pinky on the B string\'s 2nd fret: the 5th raised to the 6th. The boom-chicka strikes the top three strings of this on the "and", and lifts the pinky to make it E again — E, E6, E, E6 is the sound of the Sun records.' }, variations: [
      { name: 'The chicka alone: the top three strings', basis: 'the usual way', chord: 'E6', pattern: 'x-x-x-1-2-0', at: 0, fingers: 'x-x-x-1-2-0', what: 'What the fingers (or the pick) strike on the upbeat while the thumb has the bass strings.' },
      { name: 'E7 on the "and": the ♭7 in the chicka', basis: 'in the sources [5]; the usual way', chord: 'E7', pattern: 'x-x-x-1-3-0', at: 0, fingers: 'x-x-x-1-4-0', what: 'The pinky a fret higher: the ♭7 instead of the 6th, the chicka on the way to the IV chord.' },
      { name: 'A6: the 6th on the top string', basis: 'in the sources [4]; the usual way', chord: 'A6', pattern: 'x-0-2-2-2-2', at: 0, fingers: 'x-0-1-1-1-1', what: 'The open A with the index laid across four strings at the 2nd fret: the F♯ on top is the 6th. The IV chord\'s chicka.' },
    ] },
    { core: { name: 'The 6/9 with the root on the A string: Gallup\'s ending chord', basis: 'in the sources [7] [8]; the fingering is the usual way', chord: 'C6/9', pattern: 'x-1-0-0-1-1', at: 2, fingers: 'x-2-1-1-3-4', what: 'Root, 3rd, 6th, 9th and 5th — the chord Keith Wyatt says Cliff Gallup capped his solos with, and the one every rockabilly ending lands on. Slide it in from a fret below.' }, variations: [
      { name: 'The 9th (the jump-blues comp)', basis: 'in the sources [5] [9]; the ring-finger bar is the usual way', chord: 'B9', pattern: 'x-1-0-1-1-1', at: 1, fingers: 'x-2-1-3-3-3', what: 'The same root and 3rd with the ♭7, the 9th and the 5th on top, the ring finger laid across three strings: the comp chord of jump blues and western swing, the IV and V of the swing side.' },
      { name: 'The 13th (the Setzer stab)', basis: 'in the sources [9] [10]; the usual way', chord: 'C13', pattern: 'x-1-0-1-3-3', at: 2, fingers: 'x-2-1-3-4-4', what: 'The 9th grip with its top two strings two frets higher — the 6th and the 3rd on top — the "G13" the Premier Guitar lesson stabs and dips.' },
      { name: 'A m7♭5 grip as a rootless 9th', basis: 'in the sources [9] [10]', chord: 'Em7b5', pattern: 'x-x-0-1-1-1', at: 2, fingers: 'x-x-1-2-3-4', what: 'Setzer\'s substitution: Em7♭5 (E, B♭, D, G) is C9 without its root — play it over the bass player\'s C and the 9th is on top.' },
    ] },
    { core: { name: 'The diminished 7th: the horror chord', basis: 'in the sources [12]; the fingering is the usual way', chord: 'D#dim7', pattern: 'x-x-0-1-0-1', at: 1, fingers: 'x-x-1-3-2-4', what: 'Four minor thirds stacked, so the same grip three frets up is the same chord: slide it in threes for the B-movie stairs, or use it as the V of a minor key with the ♭9 on top.' }, variations: [] },
    { core: { name: 'The power chord with the open E: the stomp', basis: 'in the sources [1] [12]; the usual way', chord: 'E5', pattern: '0-2-2-x-x-x', at: 0, fingers: '0-1-2-x-x-x', what: 'Root, 5th and octave on the low strings, the heel of the hand on them: the psychobilly rhythm guitar\'s eighths and gallops. Moved up the neck it is any chord.' }, variations: [
      { name: 'The power chord with the root on the A string', basis: 'the usual way', chord: 'A5', pattern: 'x-0-2-2-x-x', at: 0, fingers: 'x-0-1-2-x-x', what: 'The same shape a string up: A5 open, D5 at the 5th, E5 at the 7th — the wrecking-pace changes without leaving the low strings.' },
    ] },
    { core: { name: 'The open B7: the rockabilly V', basis: 'in the sources [4] [6]; the fingering is the usual way', chord: 'B7', pattern: 'x-2-1-2-0-2', at: 0, fingers: 'x-2-1-3-0-4', what: 'The V of E in open position, the pinky on the top string for the 5th: the chord every rockabilly twelve in E turns on, its open B string ringing through the boom-chicka.' }, variations: [
      { name: 'The open E7', basis: 'the usual way', chord: 'E7', pattern: '0-2-0-1-0-0', at: 0, fingers: '0-2-0-1-0-0', what: 'The I with its ♭7 on the D string, open: the last bar before the IV.' },
      { name: 'The open A7', basis: 'the usual way', chord: 'A7', pattern: 'x-0-2-0-2-0', at: 0, fingers: 'x-0-2-0-3-0', what: 'The IV with its ♭7 on the G string, open — the alternating bass under it on the A and E strings.' },
    ] },
  ];

  // ---- the scales, drawn ----
  function scaleFigures(h){
    const { boxAt, fingersOf, PENTA_MINOR, PENTA_MAJOR, DORIAN, MIXO } = h;
    const E = 4, A = 9, G = 7, C = 0;
    const figs = [];
    const MINOR = [0, 2, 3, 5, 7, 8, 10];
    const hollow = (cells, label, color) => cells.map(c => ({ string: c.string, fret: c.fret, color, hollow: true, label }));
    // the rockabilly box: the major pentatonic at the nut with the ♭3 passing
    const eMaj = pentaBoxPlacements(E, false), eMin = pentaBoxPlacements(E, true);
    const sun = boxAt(eMaj, 'E', 0);
    figs.push(figure('E major pentatonic at the nut, with the ♭3 passing: the Sun box', 0, 5,
      [...boxMarkers(sun, E, pcs(E, [0, 4, 7, 9])), ...hollow(arpeggioCells(0, 4, new Set([(E + 3) % 12])), '♭3', '#d8d1c4')],
      `The open E chord's own notes with the 2nd and the 6th — E F♯ G♯ B C♯ — the scale of the rockabilly lines: the 6th (C♯) is the note the chicka raises the B string to, and the ♭3 (G, hollow) is hammered up to the 3rd on the G string or slid through on the way, never sat on. Scotty Moore's and Carl Perkins' fills, and the "minor-to-major hammer-on" TrueFire's licks describe, come from here. ${fingersOf(sun.cells)} The ♭3 on the G string is the index or the open string; on the low E it is the middle finger a fret below the 3rd.`));
    // the surf and stomp box: the E blues scale at the 12th
    const blue = boxAt(eMin, 'E', 12);
    figs.push(figure('E minor pentatonic at the 12th, with the ♭5: the surf and stomp box', 10, 15,
      [...boxMarkers(blue, E, pcs(E, [0, 3, 7, 10])), ...hollow(arpeggioCells(11, 15, new Set([(E + 6) % 12])), '♭5', CAGED_COLORS.E)],
      `Where the psychobilly lead and the surf lines live: E G A B D with the B♭ slid through, tremolo-picked on the top strings or the low ones. Over E, E7 and E5 alike; the stomp's riff is this box under the hand at the nut, the same notes. ${fingersOf(blue.cells)}`));
    // the jump side: A major pentatonic at the 5th with the 6th and the 9th
    const aMaj = pentaBoxPlacements(A, false);
    const jump = boxAt(aMaj, 'E', 5);
    figs.push(figure('A major pentatonic at the 5th: the jump side, with the 6th and the 9th', 3, 9,
      boxMarkers(jump, A, pcs(A, [0, 4, 7, 9])),
      `The swing side's notes over A6: the 6th (F♯) and the 9th (B) are the colours of the 6/9 chord and of Gallup's lines — the major 6th where a blues player would put the ♭7, as Keith Wyatt puts it. ${fingersOf(jump.cells)}`));
    // the bebop scale: G Mixolydian at the 3rd with the major 7th passing
    const gMixo = scaleBoxPlacements(G, false, pcs(G, MIXO));
    const bop = boxAt(gMixo, 'E', 3);
    if (bop) figs.push(figure('G Mixolydian at the 3rd over G7, with the major 7th passing: the bebop scale', 1, 7,
      [...boxMarkers(bop, G, pcs(G, [0, 4, 7, 10])), ...hollow(arpeggioCells(2, 7, new Set([(G + 11) % 12])), '7', '#d8d1c4')],
      `The Mixolydian — the major scale with the ♭7 — is the scale of a 7th chord; Guitar World hears Setzer adding the major 7th between the root and the ♭7 (hollow) so the line runs by semitones and lands on the chord tones on the beat. The Strut's lines over G7. ${fingersOf(bop.cells)}`));
    // the horror minor: E natural minor at the nut, the harmonic 7th hollow
    const eMinScale = scaleBoxPlacements(E, true, pcs(E, MINOR));
    const horror = boxAt(eMinScale, 'E', 0);
    if (horror) figs.push(figure('E natural minor at the nut, with the harmonic 7th: the horror minor', 0, 5,
      [...boxMarkers(horror, E, pcs(E, [0, 3, 7])), ...hollow(arpeggioCells(0, 4, new Set([(E + 11) % 12])), '7', '#e069a6')],
      `The minor key's own notes — E F♯ G A B C D — and, over the B7, the D♯ (hollow) that makes the V pull home: the harmonic minor, the note the third wave's minor-key leads lean on. The ♭6 (C) against the B7 is the other colour. ${fingersOf(horror.cells)}`));
    // the chicken-pickin' box: G major pentatonic at the 3rd
    const gMaj = pentaBoxPlacements(G, false);
    const chicken = boxAt(gMaj, 'E', 3);
    figs.push(figure('G major pentatonic at the 3rd, with the ♭3: the chicken-pickin\' box', 1, 7,
      [...boxMarkers(chicken, G, pcs(G, [0, 4, 7, 9])), ...hollow(arpeggioCells(2, 6, new Set([(G + 3) % 12])), '♭3', '#d8d1c4')],
      `The country side's notes over G: the 2nd bent to the 3rd (the steel), the 6th popped, the ♭3 (hollow) hammered to the 3rd. The train feel's fills. ${fingersOf(chicken.cells)}`));
    // the Strut's walk-down: the roots of i, ♭VII7, ♭VI7 and V7 on the A string
    const walk = [[3, 'i'], [1, '♭VII'], [11, '♭VI'], [10, 'V']].map(([fret, label], i) => ({ string: fret > 5 ? 5 : 4, fret: fret > 5 ? fret - 7 + 2 : fret, color: CAGED_COLORS.A, label, isRoot: i === 0 }));
    figs.push(figure('The Strut\'s walk-down: C, B♭, A♭, G on the bass strings', 0, 6,
      [{ string: 4, fret: 3, color: CAGED_COLORS.A, label: 'i', isRoot: true }, { string: 4, fret: 1, color: CAGED_COLORS.A, label: '♭VII' }, { string: 5, fret: 4, color: CAGED_COLORS.A, label: '♭VI' }, { string: 5, fret: 3, color: CAGED_COLORS.A, label: 'V' }],
      `The roots of Cm, B♭7, A♭7 and G7 as a bass line: down a whole step, down a whole step, down a semitone — the descent Jon MacLennan's lesson gives for "Stray Cat Strut" (the VII7 "in the bluesy walkdown"), and a method-book device older than the song. Play the roots on the beat and the chords on two and four.`,
      [{ color: CAGED_COLORS.A, shape: 'walk', cells: [{ string: 4, fret: 3 }, { string: 4, fret: 1 }, { string: 5, fret: 4 }, { string: 5, fret: 3 }] }]));
    // Dick Dale's colour: the ♭2 and the major 3rd hollow around the minor box
    figs.push(figure('The surf colour on E: the ♭2 and the 3rd around the minor pentatonic', 10, 15,
      [...boxMarkers(blue, E, pcs(E, [0, 3, 7, 10])), ...hollow(arpeggioCells(11, 15, new Set([(E + 1) % 12])), '♭2', '#e069a6'), ...hollow(arpeggioCells(11, 15, new Set([(E + 4) % 12])), '3', '#e069a6')],
      `The minor pentatonic box with the F (♭2) and the G♯ (3rd) let in, hollow: the double-harmonic colour of Dale's "Misirlou" — Wikipedia has the Arabic music of his family playing "a major role in his development of surf music" — and the menace the psychobilly guides call "dissonant intervals". Tremolo-picked, the ♭2 leaned on against the root. ${fingersOf(blue.cells)}`));
    return figs;
  }

  // ---- the scales, played ----
  const DRILLS = [
    { id: 'sc1', neckDefault: 'scale', drills: { d: 'scale', sc: 'majorpenta', b: 'E@0', p: 'updown', v: 2 }, title: 'The Sun box, up and down', feel: 'Boom-chicka (the Sun way)', key: 'E', tempo: 120, chords: [{ name: 'E', bars: 3 }], window: windowAt(0, 4), reading: 'penta',
      scale: { root: 4, pcs: pcs(4, PENTA_MAJOR), name: 'E major pentatonic' },
      build: () => drill([...upAndDown(boxAt(pentaBoxPlacements(4, false), 'E', 0).cells), cell(5, 0)], { grid: 12, step: 1 }),
      blurb: 'The E major pentatonic in open position, swung eighths over the boom-chicka band. The open strings as they come, the fretted notes one finger a fret; get it even before you get it fast — the fills between the chords are this box.' },
    { id: 'sc2', neckDefault: 'scale', drills: { d: 'scale', sc: 'majorpenta', b: 'E@0', p: 'updown', v: 2 }, title: 'The ♭3 slid into the 3rd', feel: 'Boom-chicka (the Sun way)', key: 'E', tempo: 120, chords: [{ name: 'E', bars: 3 }], window: windowAt(0, 4), reading: 'penta',
      scale: { root: 4, pcs: new Set([...pcs(4, PENTA_MAJOR), (4 + 3) % 12]), name: 'E major pentatonic with the ♭3' },
      build: () => {
        const up = byPitch(boxAt(pentaBoxPlacements(4, false), 'E', 0).cells);
        // the ♭3 slid into the 3rd on the way up, on the G string and the low E
        const withSlides = up.map(c => (c.string === 2 && c.fret === 1) || (c.string === 5 && c.fret === 4) ? withFx(c, { slide: c.fret - 1 }) : c);
        return drill([...withSlides, ...up.slice(0, -1).reverse(), cell(5, 0)], { grid: 12, step: 1 });
      },
      blurb: 'The same box with the G slid into the G♯ — on the G string from the open string to the 1st fret, on the low E from the 3rd fret to the 4th. The rockabilly blue note: a note to pass through on the way to the 3rd, never to land on.' },
    { id: 'sc3', neckDefault: 'scale', drills: { d: 'scale', sc: 'blues', b: 'E@12', p: 'updown', v: 2 }, title: 'The surf and stomp box at the 12th', feel: 'Surf-billy (the Freakout way)', key: 'E', tempo: 130, chords: [{ name: 'E', bars: 3 }], window: windowAt(12), reading: 'scale', blues: true,
      scale: { root: 4, pcs: pcs(4, [0, 3, 5, 6, 7, 10]), name: 'the E blues scale' },
      build: () => {
        const up = byPitch(boxAt(pentaBoxPlacements(4, true), 'E', 12).cells);
        const down = [cell(0, 15), cell(0, 12), cell(1, 15), cell(1, 12), cell(2, 15), withFx(cell(2, 14), { slide: 15 }), cell(2, 12), cell(3, 14), cell(3, 12), cell(4, 14), withFx(cell(4, 13), { slide: 14 }), cell(4, 12), cell(5, 15), cell(5, 12)];
        return drill([...up, ...down]);
      },
      blurb: 'Up the E minor pentatonic at the 12th and down it with the ♭5 slid through: the box the surf lead and the psychobilly lead both live in, over the surf-billy band. Alternate-picked, straight eighths; then tremolo-pick each note.' },
    { id: 'sc4', neckDefault: 'scale', drills: { d: 'scale', sc: 'majorpenta', b: 'E@5', p: 'updown', v: 3 }, title: 'A major pentatonic in triplets: the jump side', feel: 'Jump and swing (the Blue Caps and Martini way)', key: 'A', tempo: 120, chords: [{ name: 'A6', bars: 2 }], window: windowAt(4, 4), reading: 'penta',
      scale: { root: 9, pcs: pcs(9, PENTA_MAJOR), name: 'A major pentatonic' },
      build: () => drill(upAndDown(boxAt(pentaBoxPlacements(9, false), 'E', 5).cells), { grid: 12, step: 1 }),
      blurb: 'Three notes a beat over the swing band: the box the Gallup lines and the 6/9 chord come from, with the 6th and the 9th in it. Swing the triplets by leaving the middle one a shade lighter.' },
    { id: 'sc5', neckDefault: 'scale', drills: { d: 'scale', sc: 'mixolydian', b: 'E@3', p: 'updown', v: 3 }, title: 'G Mixolydian over G7, with the 7th passing', feel: 'Stray descent (the Strut way)', key: 'G', tempo: 108, chords: [{ name: 'G7', bars: 3 }], window: windowAt(2, 4), reading: 'scale',
      scale: { root: 7, pcs: new Set([...pcs(7, MIXO), (7 + 11) % 12]), name: 'G Mixolydian with the major 7th' },
      build: () => {
        const box = byPitch(boxAt(scaleBoxPlacements(7, false, pcs(7, MIXO)), 'E', 3).cells);
        // the major 7th slid into the octave on the way up, where the box has the root on the D string
        const withSeventh = box.map(c => c.string === 3 && c.fret === 5 ? withFx(c, { slide: 4 }) : c);
        return drill([...withSeventh, ...box.slice(0, -1).reverse()], { grid: 12, step: 1 });
      },
      blurb: 'The scale of a 7th chord, swung, with the major 7th slid into the root on the D string: the bebop colour Guitar World hears in Setzer\'s lines. Over the V of the Strut\'s key.' },
    { id: 'sc6', neckDefault: 'scale', drills: { d: 'scale', k: 'minor:E', sc: 'minor', b: 'E@0', p: 'updown', v: 2 }, title: 'E minor at the nut, the harmonic 7th over the V', feel: 'Horror-minor twang (the third wave)', key: 'E', mode: 'minor', tempo: 120, chords: [{ name: 'Em', bars: 2 }, { name: 'B7', bars: 2 }], window: windowAt(0, 4), reading: 'scale',
      scale: { root: 4, pcs: new Set([...pcs(4, [0, 2, 3, 5, 7, 8, 10]), (4 + 11) % 12]), name: 'E natural minor, with the harmonic 7th' },
      build: () => {
        const box = byPitch(boxAt(scaleBoxPlacements(4, true, pcs(4, [0, 2, 3, 5, 7, 8, 10])), 'E', 0).cells);
        const up = box.slice(0, 16), down = box.slice(0, 16).reverse().map(c => c.string === 1 && c.fret === 3 ? withFx(c, { slide: 4 }) : c);
        return drill([...up, ...down]);
      },
      blurb: 'The minor key up over Em and down over B7, the D on the B string slid down from the D♯ on the way: the harmonic minor arriving where the V wants it. The third wave\'s scale, straight eighths, clean with the echo.' },
    { id: 'sc7', neckDefault: 'scale', drills: { d: 'scale', sc: 'majorpenta', b: 'E@3', p: 'updown', v: 4 }, title: 'G major pentatonic in fours: the chicken-pickin\' box', feel: 'Train two-step (the Cash and country way)', key: 'G', tempo: 110, chords: [{ name: 'G', bars: 3 }], window: windowAt(2, 4), reading: 'penta',
      scale: { root: 7, pcs: pcs(7, PENTA_MAJOR), name: 'G major pentatonic' },
      build: () => drill([...upAndDown(boxAt(pentaBoxPlacements(7, false), 'E', 3).cells), cell(5, 3)], { step: 1 }),
      blurb: 'Four notes a beat over the train: the country box, alternate-picked, then hybrid-picked — pick on the low strings, middle and ring fingers snapping the top ones. Even first.' },
  ];

  // ---- the examples ----
  const sun = { feel: 'Boom-chicka (the Sun way)', key: 'E', tempo: 176, chords: [{ name: 'E' }, { name: 'E' }, { name: 'A' }, { name: 'E' }, { name: 'B7' }, { name: 'E' }], window: windowAt(0), reading: 'penta' };
  const jump = { feel: 'Jump and swing (the Blue Caps and Martini way)', key: 'A', tempo: 152, chords: [{ name: 'A6' }, { name: 'A6' }, { name: 'D9' }, { name: 'A6' }, { name: 'D9' }, { name: 'E9' }], window: windowAt(4), reading: 'penta',
                 positions: { A6: 4, D9: 4, E9: 6 } };
  const strut = { feel: 'Stray descent (the Strut way)', key: 'C', mode: 'minor', tempo: 108, chords: [{ name: 'Cm' }, { name: 'Bb7' }, { name: 'Ab7' }, { name: 'G7' }, { name: 'Cm' }, { name: 'G7' }], window: windowAt(3), reading: 'scale',
                  positions: { Cm: 3, 'B♭7': 1, 'A♭7': 4, G7: 3 } };
  const train = { feel: 'Train two-step (the Cash and country way)', key: 'G', tempo: 168, chords: [{ name: 'G' }, { name: 'G' }, { name: 'C' }, { name: 'G' }, { name: 'D7' }, { name: 'G' }], window: windowAt(0), reading: 'penta' };
  const stomp = { feel: 'Psychobilly stomp (the Meteors way)', key: 'E', mode: 'minor', tempo: 192, chords: [{ name: 'Em' }, { name: 'Em' }, { name: 'G' }, { name: 'Em' }, { name: 'B7' }, { name: 'Em' }], window: windowAt(0), reading: 'penta',
                  positions: { Em: 0, G: 3, B7: 0 } };
  const wreck = { feel: 'Wrecking pace (the second wave)', key: 'A', tempo: 212, chords: [{ name: 'A' }, { name: 'A' }, { name: 'D' }, { name: 'A' }, { name: 'E' }, { name: 'D' }], window: windowAt(0), reading: 'penta', blues: true };
  const surf = { feel: 'Surf-billy (the Freakout way)', key: 'E', tempo: 164, chords: [{ name: 'E' }, { name: 'E' }, { name: 'E' }, { name: 'A' }, { name: 'B7' }, { name: 'A' }], window: windowAt(0), reading: 'penta', blues: true };
  const horror = { feel: 'Horror-minor twang (the third wave)', key: 'E', mode: 'minor', tempo: 148, chords: [{ name: 'Em' }, { name: 'C' }, { name: 'B7' }, { name: 'Em' }, { name: 'Am' }, { name: 'B7' }], window: windowAt(0), reading: 'scale' };

  const preset = variant => ({ name: 'Psychobilly', variant });
  const tab = (song, url) => `<a href="${url}">${esc(song)} tab</a>`;

  const CHANGES = [
    { ...sun, id: 'c-sun', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'E,E,A,E,B7,E', pos: 0, bt: 4, st: 'quarters' }, title: 'E–A–B7: the rockabilly twelve\'s chords, boom-chicka', part: 'Boom-chicka with the 6th', blend: 'rhythm', seed: 4,
      blurb: 'The open E, A and B7 with the boom-chicka on each: the root under the thumb on one and three, the top three strings on the "and", the 6th on the B string every other time. The neck shows the open grips; the hand never leaves the first three frets.' },
    { ...jump, id: 'c-jump', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'A6,A6,D9,A6,D9,E9', pos: 4, bt: 4, st: 'quarters' }, title: 'A6–D9–E9: the swing side\'s grips', part: 'Four to the bar with the 6/9', blend: 'rhythm', seed: 6,
      blurb: 'The I as a 6th chord, the IV and the V as 9ths with the root on the A string, four to the bar and the stab on the "and of 2": the jump-blues changes. Watch the 9th grip slide from D at the 5th fret to E at the 7th.' },
    { ...strut, id: 'c-strut', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'Cm,Bb7,Ab7,G7', pos: 3, bt: 4, st: 'halves' }, title: 'Cm–B♭7–A♭7–G7: the Strut\'s walk-down', part: 'Stabs with the Bigsby dip', blend: 'rhythm', seed: 3, chords: [{ name: 'Cm' }, { name: 'Bb7' }, { name: 'Ab7' }, { name: 'G7' }],
      blurb: 'A minor key walking down by whole steps through 7th chords to the V: Cm at the 3rd fret, B♭7 at the 1st, A♭7 and G7 as barres at the 4th and 3rd. The stab on two and four, the Bigsby pressed on the way into each change.' },
    { ...train, id: 'c-train', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'G,G,C,G,D7,G', pos: 0, bt: 4, st: 'quarters' }, title: 'G–C–D7: the train two-step', part: 'Luther\'s boom-chicka, palm-muted', blend: 'rhythm', seed: 5,
      blurb: 'The open G, C and D7 with Luther Perkins\' figure on each: the root on one with the heel of the hand on it, the chord muted on the "and", the 5th on three. The neck shows the open chords the country side is played on.' },
    { ...stomp, id: 'c-stomp', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'Em,Em,G,Em,B7,Em', pos: 0, bt: 4, st: 'eighths' }, title: 'Em–G–B7: the minor stomp', part: 'Downstroke chords with the stops', blend: 'rhythm', seed: 2,
      blurb: 'The minor key\'s i, III and V7 as power chords and open chords, every eighth a downstroke: Em open, G as the barre at the 3rd, B7 open. The change the Klub Foot bands run on, at the stomp\'s pace.' },
    { ...wreck, id: 'c-wreck', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'A,A,D,A,E,D', pos: 0, bt: 4, st: 'eighths' }, title: 'A–D–E: the twelve at wrecking pace', part: 'Downstroke power chords, the gallop', blend: 'rhythm', seed: 7,
      blurb: 'I, IV and V as power chords on the low strings, palm-muted, in gallops at over two hundred: the second wave\'s changes. The neck shows the three shapes the hand moves between without leaving the bass strings.' },
    { ...horror, id: 'c-horror', chordsOnly: true, neckDefault: 'chords', drills: { d: 'changes', ch: 'Em,C,B7,Em,Am,B7', pos: 0, bt: 4, st: 'eighths' }, title: 'Em–C–B7–Am: the third wave\'s minor key', part: 'Minor arpeggios and dips', blend: 'rhythm', seed: 9,
      blurb: 'The minor key\'s own chords with the V a 7th — i, VI, V7, iv — arpeggiated in eighths and struck whole with the Bigsby pressed. The grips are the open ones; the neck shows the notes the twang line is drawn from.' },
  ];

  const RHYTHM = [
    { ...sun, id: 'r-boom', wants: ['hammer', 'double'], title: 'Boom-chicka with the 6th', part: 'Boom-chicka with the 6th', blend: 'rhythm', seed: 7,
      blurb: 'The Sun rhythm as one hand plays it: the root under the thumb on one, the top three strings short on the "and", the 5th on two, the 6th on top every other chicka. The bass walks 1–3–5–6 under it, snapped, the slap on the upbeats; the ride swings.',
      refs: 'The boom-chicka and the Travis-picked thumb from the Guitar Wiz basics [4], TrueFire\'s licks [5] and Premier Guitar\'s Scotty Moore lesson [6]; the 6th chord\'s place in the style from [5] [6].' },
    { ...sun, id: 'r-travis', title: 'Travis-picked chords, pick and fingers', part: 'Travis-picked chords, pick and fingers', blend: 'rhythm', seed: 3,
      blurb: 'The same rhythm as fingerstyle: the thumb alternating root and 5th on the bass strings, the fingers picking the treble strings between — a fingers part, so the fingers never take the thumb\'s string.',
      refs: 'Moore\'s "thumb-pick and fingers technique" from scottymoore.net [7]; Heath\'s "hybrid style using a flatpick" from Premier Guitar [13].' },
    { ...jump, id: 'r-four', wants: ['slide'], title: 'Four to the bar with the 6/9', part: 'Four to the bar with the 6/9', blend: 'rhythm', seed: 5,
      blurb: 'The Freddie Green job on a hollow-body: the top strings short on every beat with the 6th on top, the Setzer stab on the "and of 2" with the Bigsby pressed, 6ths coming down by semitones onto the next chord.',
      refs: 'The Charleston stabs and the dip from Premier Guitar\'s "Rhythm Rules" [9]; the 6/9 from TrueFire [5] and Keith Wyatt on Gallup [8].' },
    { ...jump, id: 'r-ninths', title: 'Jump-blues comp: 9ths and the walk-up', part: 'Jump-blues comp: 9ths and the walk-up', blend: 'rhythm', seed: 2,
      blurb: 'The 9th grip on the "and of 2" and on four with the bass walked up to it on the low strings: the comp behind a horn line, the swing side of the Reverend\'s records.',
      refs: 'The 9th as the jump-blues and western-swing comp chord: the Hendrix study\'s Red House lesson [see hendrix.html]; the walking pickup line from [6] [7].' },
    { ...strut, id: 'r-stabs', wants: ['slide'], title: 'Stabs with the Bigsby dip', part: 'Stabs with the Bigsby dip', blend: 'rhythm', seed: 4,
      blurb: 'The strut: the root on one, the chord short on two and four, the Bigsby dipped on the stab into a change, the bass line walking down under it.',
      refs: 'The swung eighths and the walk-down from Jon MacLennan\'s lesson [10]; the dips "in a typical Setzer fashion" from Premier Guitar [9].' },
    { ...train, id: 'r-luther', title: 'Luther\'s boom-chicka, palm-muted', part: 'Luther\'s boom-chicka, palm-muted', blend: 'rhythm', seed: 6,
      blurb: 'The Tennessee Two figure: the root on one and the 5th on three with the heel of the hand on the strings, the chord muted on the "and", a walk to the next root — under a train beat with brushes.',
      refs: 'The palm-muted boom-chicka from the Wikipedia article on Luther Perkins [11] and the Johnny Cash guitar page [11b]; the train beat from the drumming pages [16].' },
    { ...stomp, id: 'r-eighths', title: 'Palm-muted eighths with the ♭3 riff', part: 'Palm-muted eighths with the ♭3 riff', blend: 'rhythm', seed: 8,
      blurb: 'The stomp: power chords in muted eighths for two beats, then the riff on the low strings with the ♭5 passing; the kick on every beat, the bass snapped with two slaps after each note.',
      refs: '"Power chords mixed with rockabilly fingerpicking", "heavy use of minor chords and palm muting" from Wikipedia [1]; the double slap from Dr. D\'s columns [17]; the Meteors from [2] [3].' },
    { ...stomp, id: 'r-down', title: 'Downstroke chords with the stops', part: 'Downstroke chords with the stops', blend: 'rhythm', seed: 1,
      blurb: 'Every eighth a downstroke, open, and the stop-time bars psychobilly leans on: the band hitting the One and dropping out, the chord hanging with the bar pressed.',
      refs: 'The downstrokes and gallops from Riffhard\'s guide [12]; the stop-time from the genre\'s live descriptions in [2] [3].' },
    { ...wreck, id: 'r-gallop', title: 'Downstroke power chords, the gallop', part: 'Downstroke power chords, the gallop', blend: 'rhythm', seed: 5,
      blurb: 'Sixteenth, sixteenth, eighth on a muted power chord, all downstrokes, at over two hundred, the new chord slid in from a fret below on a change — and the "drag triplet" slaps under it.',
      refs: 'The gallop from Riffhard [12]; the drag triplet from Dr. D [17]; the second wave\'s tempos from the AV Club [2] and HTF [3].' },
    { ...surf, id: 'r-trem', title: 'Tremolo-picked riff on the low strings', part: 'Tremolo-picked riff on the low strings', blend: 'rhythm', seed: 3,
      blurb: 'The root tremolo-picked for two beats, then the pentatonic falling to the ♭3 on the low strings; a dive with the bar; the surf kick under it.',
      refs: 'Dale\'s tremolo picking, "the pulsation", from Wikipedia [14]; the Wipe Out bridge of "Psychobilly Freakout" from the Guitar Hero wiki [15] and Songfacts [15b].' },
    { ...horror, id: 'r-twang', title: 'Twang on the low strings with the echo', part: 'Twang on the low strings with the echo', blend: 'rhythm', seed: 6,
      blurb: 'The melody on the bass strings, clean, into the slapback: root, ♭3, 4th, 5th and back, the 5th shaken, the bar pressed at the end of the line.',
      refs: 'Nick 13 on Duane Eddy and "stylists" from the Gretsch interview [18]; echo-laden lead lines in minor keys from Guitar World [18b].' },
    { ...horror, id: 'r-arps', title: 'Minor arpeggios and dips', part: 'Minor arpeggios and dips', blend: 'rhythm', seed: 2,
      blurb: 'The minor chord picked as an arpeggio in eighths and struck whole with the Bigsby pressed on the last beat: the rhythm under a third-wave verse.' },
  ];

  const LEAD = [
    { ...sun, id: 'l-scotty', wants: ['double', 'hammer'], title: 'Scotty\'s double stops and the walk-up', part: 'Scotty\'s double stops and the walk-up', blend: 'lead', seed: 7,
      blurb: 'Double stops on the third and second strings, the ♭3 hammered to the 3rd, the 6th leaned on, a half-step bend, and the walking line on the bass strings into every change.',
      refs: 'Premier Guitar\'s "Beyond Blues" on Moore\'s double stops and chord-based note choice [6]; the walking bass pickup line from scottymoore.net [7].' },
    { ...jump, id: 'l-gallup', wants: ['pull', 'double'], title: 'Gallup lines: triplet pull-offs and chromatic octaves', part: 'Gallup lines: triplet pull-offs and chromatic octaves', blend: 'lead', seed: 4,
      blurb: 'A solo kicked off with open-string triplet pull-offs, octaves climbing by semitones, the major 6th over the ♭7, half-step bends and none wider, a cluster for a joke.',
      refs: 'Keith Wyatt\'s tribute in Guitar World [8]: the pick-and-fingerpicks hand, the Bigsby, "never bent strings more than a half step", the 6–9 chord.' },
    { ...strut, id: 'l-bebop', wants: ['pull', 'slide'], title: 'Bebop lines over the descent', part: 'Bebop lines over the descent', blend: 'lead', seed: 3,
      blurb: 'The bebop scale over each 7th chord, chromatic passing notes, pull-offs on two strings under one finger, economy-picked arpeggios.',
      refs: 'Guitar World\'s Setzer soloing lesson [9b]: the bebop scale, the two-string pull-offs, economy and hybrid picking.' },
    { ...train, id: 'l-chicken', wants: ['bend', 'pull'], title: 'Chicken-pickin\' fills', part: 'Chicken-pickin\' fills', blend: 'lead', seed: 5,
      blurb: 'Notes snapped by the fingers behind the pick, the 2nd pulled off to the open string, 6ths slid up, the 2nd bent to the 3rd under a held note — the steel imitation.',
      refs: 'Carl Perkins\' pedal-steel imitations and bends from Wikipedia [19]; Heath\'s crosspicking and "banjo-style 16th notes" from Vintage Guitar [13b].' },
    { ...stomp, id: 'l-horror', wants: ['bend'], title: 'Horror lines: the ♭2, the ♭5 and the tremolo', part: 'Horror lines: the ♭2, the ♭5 and the tremolo', blend: 'lead', seed: 6, window: windowAt(12),
      blurb: 'The minor pentatonic with the ♭2 against the root and the ♭5 slid through, tremolo-picked held notes, a chromatic descent, a dip at the end of a phrase.',
      refs: 'The "chromatic runs" and "dissonant intervals" of Riffhard\'s guide [12]; the surf side from [14].' },
    { ...wreck, id: 'l-twelve', wants: ['bend', 'pull'], title: 'Twelve bars at speed', part: 'Twelve bars at speed', blend: 'lead', seed: 9, window: windowAt(5),
      blurb: 'The blues scale over major chords in sixteenths across the strings, pull-offs in threes, a double stop with its lower note bent, the octave shaken.' },
    { ...surf, id: 'l-surf', title: 'Surf lead with the bar', part: 'Surf lead with the bar', blend: 'lead', seed: 2, window: windowAt(12),
      blurb: 'Tremolo-picked runs on the top strings, the descent by semitones, a rake into the high root, the whole-step bend shaken, the Bigsby pressed at the end.',
      refs: 'Dale from [14]; the "rapid-fire, staccato runs" from [12].' },
    { ...horror, id: 'l-minor', wants: ['slide'], title: 'Minor-key lead with the 7th', part: 'Minor-key lead with the 7th', blend: 'lead', seed: 4, window: windowAt(12),
      blurb: 'The natural minor on the top strings with the major 7th over the V, the ♭6, slides up to the octave, tremolo, wide vibrato, room for the echo to answer.' },
  ];

  const MIXED = [
    { ...sun, id: 'm-boom', wants: ['lead'], title: 'The boom-chicka, with its lead lines', part: 'Boom-chicka with the 6th', blend: 'mixed', seed: 21, blurb: 'The rhythm part with the blend on Mixed: the figure, and in about half the fill bars Moore\'s double stops.' },
    { ...jump, id: 'm-four', wants: ['lead'], title: 'Four to the bar, with its lead lines', part: 'Four to the bar with the 6/9', blend: 'mixed', seed: 17, blurb: 'The chicks and the stabs, and the Gallup lines in the fill bars.' },
    { ...strut, id: 'm-stabs', wants: ['lead'], title: 'The strut, with its lead lines', part: 'Stabs with the Bigsby dip', blend: 'mixed', seed: 13, blurb: 'The stabs and the walk-down, and the bebop lines between.' },
    { ...train, id: 'm-luther', wants: ['lead'], title: 'The train, with its lead lines', part: 'Luther\'s boom-chicka, palm-muted', blend: 'mixed', seed: 19, blurb: 'The boom-chicka under the brushes, and the chicken pickin\' in the fill bars.' },
    { ...stomp, id: 'm-eighths', wants: ['lead'], title: 'The stomp, with its lead lines', part: 'Palm-muted eighths with the ♭3 riff', blend: 'mixed', seed: 11, blurb: 'The muted eighths and the riff, and the horror lines when the fill bars come.' },
    { ...wreck, id: 'm-gallop', wants: ['lead'], title: 'The gallop, with its lead lines', part: 'Downstroke power chords, the gallop', blend: 'mixed', seed: 6, blurb: 'Gallops in the figure bars, the blues scale at speed in about half the fills.' },
    { ...surf, id: 'm-trem', wants: ['lead'], title: 'The tremolo riff, with its lead lines', part: 'Tremolo-picked riff on the low strings', blend: 'mixed', seed: 8, blurb: 'The riff on the low strings, the surf lead on the top ones in the fill bars.' },
    { ...horror, id: 'm-twang', wants: ['lead'], title: 'The twang, with its lead lines', part: 'Twang on the low strings with the echo', blend: 'mixed', seed: 7, blurb: 'The low-string melody, and the minor-key lines with the 7th in the fill bars.' },
  ];

  const EXERCISES = [
    { ...sun, id: 'x1', title: '1. Boom and chicka, plain', part: 'Boom-chicka with the 6th', blend: 'rhythm', seed: 7, easy: true, tempo: 100,
      blurb: 'The beginner\'s version: the root on one, the top three strings on two, the 5th on three, the chicka on four. Two strokes a beat apart, the bass strings under the heel of the hand, before anything moves.' },
    { ...sun, id: 'x2', title: '2. The 6th on the "and"', part: 'Boom-chicka with the 6th', blend: 'rhythm', seed: 7, tempo: 110,
      blurb: 'Now the pinky on the B string every other chicka: E, E6, E, E6. Swing the "and" late. The pinky lands with the stroke, not before it.' },
    { ...sun, id: 'x3', wants: ['double', 'hammer'], title: '3. Double stops and the walk-up', part: 'Scotty\'s double stops and the walk-up', blend: 'lead', seed: 7, tempo: 100,
      blurb: 'Two strings at a time on the third and second, the ♭3 hammered to the 3rd, and the walk — 5th, 6th, ♭7, 7 — into the next chord\'s root on the bass strings. Say the next root as you land on it.' },
    { ...sun, id: 'x4', title: '4. The thumb and the fingers', part: 'Travis-picked chords, pick and fingers', blend: 'rhythm', seed: 3, easy: true, tempo: 96,
      blurb: 'The thumb alone first: root, 5th, root, 5th, muted, dead even. Then the fingers on the upbeats. The thumb never stops.' },
    { ...jump, id: 'x5', wants: ['slide'], title: '5. The 6/9 and the dip', part: 'Four to the bar with the 6/9', blend: 'rhythm', seed: 5, tempo: 110,
      blurb: 'Four short chords a bar with the 6th on top, then the stab on the "and of 2" with the Bigsby pressed and let back before the next beat. The dip is a semitone, no more.' },
    { ...train, id: 'x6', title: '6. Luther\'s mute', part: 'Luther\'s boom-chicka, palm-muted', blend: 'rhythm', seed: 6, easy: true, tempo: 110,
      blurb: 'The heel of the hand on the bass strings so the boom is a thud, the chord on the "and" short and quiet. Boom, chick, boom, chick, under the brushes.' },
    { ...train, id: 'x7', wants: ['bend'], title: '7. The pops and the steel bend', part: 'Chicken-pickin\' fills', blend: 'lead', seed: 5, tempo: 100,
      blurb: 'Notes snapped by the middle finger behind the pick — pop, not pluck — and the 2nd bent up to the 3rd with the 5th held above it. Dry and even.' },
    { ...stomp, id: 'x8', title: '8. Muted eighths and the gallop', part: 'Palm-muted eighths with the ♭3 riff', blend: 'rhythm', seed: 8, easy: true, tempo: 130,
      blurb: 'The power chord in eighths, every stroke down, the heel on the strings; then sixteenth, sixteenth, eighth. Get the downstrokes even at 130 before the tempo goes up.' },
    { ...surf, id: 'x9', title: '9. Tremolo picking', part: 'Tremolo-picked riff on the low strings', blend: 'rhythm', seed: 3, tempo: 120,
      blurb: 'The root on the low strings picked as fast and even as the wrist goes, from the wrist, the pick shallow: the pulsation. Two beats of it, then the line falling to the ♭3.' },
    { ...wreck, id: 'x10', title: '10. Playing with the slap', part: 'Downstroke power chords, the gallop', blend: 'rhythm', seed: 5, easy: true, tempo: 150,
      blurb: 'The chords on the beat against the bass\'s note and its two slaps after it: the click is the psychobilly clock. Land the downstroke on the note, not the click.' },
  ];

  // whole forms: the presets, a part realised over them
  const STUDIES = [
    { id: 'st1', wants: ['lead'], title: 'Study in E: the rockabilly twelve', feel: 'Boom-chicka (the Sun way)', part: 'Boom-chicka with the 6th', key: 'E', tempo: 176, blend: 'mixed', seed: 31, window: windowAt(0), reading: 'penta', preset: preset('Rockabilly twelve (the Sun way)'),
      chords: [{ name: 'E', bars: 4 }, { name: 'A', bars: 2 }, { name: 'E', bars: 2 }, { name: 'B7' }, { name: 'A' }, { name: 'E', bars: 2 }],
      blurb: 'Twelve bars in E — four of the I, two of the IV, two of the I, the V, the IV, two of the I — with the boom-chicka over them, the 6th on the chicka, and Moore\'s double stops rolled into the fill bars.' },
    { id: 'st2', wants: ['lead'], title: 'Study in A: the jump twelve', feel: 'Jump and swing (the Blue Caps and Martini way)', part: 'Four to the bar with the 6/9', key: 'A', tempo: 152, blend: 'mixed', seed: 17, window: windowAt(4), reading: 'penta', preset: preset('Jump twelve with the 6/9 (the Martini way)'),
      positions: { A6: 4, D9: 4, E9: 6 },
      chords: [{ name: 'A6', bars: 4 }, { name: 'D9', bars: 2 }, { name: 'A6', bars: 2 }, { name: 'E9' }, { name: 'D9' }, { name: 'A6' }, { name: 'E9' }],
      blurb: 'The same twelve with the swing side\'s chords — the I a 6th, the IV and V 9ths — four to the bar with the stab and the dip, the Gallup lines in the fills.' },
    { id: 'st3', wants: ['lead'], title: 'Study in C minor: the strut', feel: 'Stray descent (the Strut way)', part: 'Stabs with the Bigsby dip', key: 'C', mode: 'minor', tempo: 108, blend: 'mixed', seed: 13, window: windowAt(3), reading: 'scale', preset: preset('Stray descent (the Strut way)'),
      positions: { Cm: 3, 'B♭7': 1, 'A♭7': 4, G7: 3 },
      chords: [{ name: 'Cm' }, { name: 'Bb7' }, { name: 'Ab7' }, { name: 'G7' }, { name: 'Cm' }, { name: 'Bb7' }, { name: 'Ab7' }, { name: 'G7' }],
      blurb: 'The walk-down twice round: i, ♭VII7, ♭VI7, V7, the stabs on two and four, the Bigsby on the way into each change, the bebop lines between.' },
    { id: 'st4', wants: ['lead'], title: 'Study in G: the train', feel: 'Train two-step (the Cash and country way)', part: 'Luther\'s boom-chicka, palm-muted', key: 'G', tempo: 168, blend: 'mixed', seed: 19, window: windowAt(0), reading: 'penta', preset: preset('Train two-step (the Cash way)'),
      chords: [{ name: 'G', bars: 2 }, { name: 'C' }, { name: 'G' }, { name: 'D7' }, { name: 'G' }, { name: 'G', bars: 2 }, { name: 'C' }, { name: 'G' }, { name: 'D7' }, { name: 'G' }],
      blurb: 'The two-step twice round — I, IV, I, V7, I — under the brushes, Luther\'s figure on every chord and the chicken pickin\' in the fills.' },
    { id: 'st5', wants: ['lead'], title: 'Study in E minor: the stomp', feel: 'Psychobilly stomp (the Meteors way)', part: 'Palm-muted eighths with the ♭3 riff', key: 'E', mode: 'minor', tempo: 192, blend: 'mixed', seed: 11, window: windowAt(0), reading: 'penta', preset: preset('Minor stomp (the Meteors way)'),
      positions: { Em: 0, G: 3, Am: 5, B7: 0 },
      chords: [{ name: 'Em', bars: 2 }, { name: 'G' }, { name: 'Am' }, { name: 'Em' }, { name: 'B7' }, { name: 'Em' }, { name: 'Em', bars: 2 }, { name: 'G' }, { name: 'Am' }, { name: 'Em' }, { name: 'B7' }, { name: 'Em' }],
      blurb: 'The minor stomp twice round: i, III, iv, i, V7, i — muted eighths and the ♭3 riff, the horror lines in the fills, the kick on every beat.' },
    { id: 'st6', wants: ['lead'], title: 'Study in A: the wrecking twelve', feel: 'Wrecking pace (the second wave)', part: 'Downstroke power chords, the gallop', key: 'A', tempo: 212, blend: 'mixed', seed: 6, window: windowAt(0), reading: 'penta', blues: true, preset: preset('Wrecking twelve (the second wave)'),
      chords: [{ name: 'A', bars: 4 }, { name: 'D', bars: 2 }, { name: 'A', bars: 2 }, { name: 'E' }, { name: 'D' }, { name: 'A', bars: 2 }],
      blurb: 'The twelve at two hundred and twelve, gallops on the power chords, the blues scale in the fills, the drag-triplet slaps under everything.' },
    { id: 'st7', wants: ['lead'], title: 'Study in E: surf-billy', feel: 'Surf-billy (the Freakout way)', part: 'Tremolo-picked riff on the low strings', key: 'E', tempo: 164, blend: 'mixed', seed: 8, window: windowAt(0), reading: 'penta', blues: true, preset: preset('Surf-billy (the Freakout way)'),
      chords: [{ name: 'E', bars: 3 }, { name: 'A' }, { name: 'B7' }, { name: 'A' }, { name: 'E', bars: 3 }, { name: 'A' }, { name: 'B7' }, { name: 'A' }],
      blurb: 'The surf changes twice round, the riff tremolo-picked on the low strings, the surf lead in the fill bars, the tom roll on the last bar.' },
    { id: 'st8', wants: ['lead'], title: 'Study in E minor: the horror minor', feel: 'Horror-minor twang (the third wave)', part: 'Twang on the low strings with the echo', key: 'E', mode: 'minor', tempo: 148, blend: 'mixed', seed: 7, window: windowAt(0), reading: 'scale', preset: preset('Horror minor (the third wave)'),
      chords: [{ name: 'Em' }, { name: 'C' }, { name: 'B7' }, { name: 'Em' }, { name: 'Am' }, { name: 'B7' }, { name: 'Em' }, { name: 'C' }, { name: 'B7' }, { name: 'Em' }, { name: 'Am' }, { name: 'B7' }],
      blurb: 'The third wave\'s minor key twice round — i, VI, V7, i, iv, V7 — the twang on the low strings into the echo, the minor-key lines with the 7th in the fills.' },
  ];

  // ---- the songs ----
  const SONGS = [
    { title: 'That\'s All Right (Elvis Presley, Scotty Moore, Bill Black)', listen: ['Three pieces, live to one track, no drums: the slap of the bass is the backbeat', 'The tempo — "at least twice as fast as the original" blues', 'Moore\'s fills between the lines, chord-based, with the echo on them'], album: 'Sun, 5 July 1954', key: 'A major, a fast two-feel',
      what: 'The record rockabilly is dated from: Arthur Crudup\'s blues at twice the speed, cut in a break between takes, all three parts at once onto one track — Presley\'s acoustic rhythm, Moore\'s electric lead, Black\'s string bass — with no drums, so the bass\'s slap is the drum. Moore\'s thumb-and-fingers picking and Black\'s slap are the two halves of everything on this page.',
      cites: '[20] [7] [21]' },
    { title: 'Mystery Train (Elvis Presley)', listen: ['Moore\'s figure: a country lead break and fingerstyle picking with the slapback on it', 'The Junior Parker riff and the Merle Travis "Sixteen Tons" figure inside the guitar part', 'Black\'s bass walking under the whole side'], album: 'Sun, 11 July 1955', key: 'E major, about 120 BPM by the tempo sites',
      what: 'Moore\'s "country lead break and fingerstyle picking, with a touch of slapback echo" over Black\'s bass — the arrangement draws its guitar riffs from Junior Parker\'s "Love My Baby" and Travis\'s "Sixteen Tons", which is the whole recipe: the Travis thumb, the blues riff, the echo. The EchoSonic amp with its built-in tape echo was Moore\'s from 1955.',
      cites: '[22] [7] [21]' },
    { title: 'Blue Suede Shoes (Carl Perkins)', listen: ['The stops on the first line and the chord that answers them', 'Perkins\' fills: bends, palm muting, the 6th chords', 'The twelve-bar form under a country vocal'], album: 'Sun, recorded 19 December 1955', key: 'A major, about 170 BPM by the tempo sites',
      what: 'The first Sun record to sell a million: a twelve-bar with stop-time on the verse, and the guitar Charlie Daniels says "personifies the rockabilly sound more so than anybody" — finger picking, pedal-steel imitations, palm muting, single- and double-string bending, 6th, 9th and 13th chords, crosspicking, the blue note Perkins found by bending round the knots in his re-tied strings.',
      cites: '[19] [21]' },
    { title: 'Be-Bop-A-Lula (Gene Vincent and His Blue Caps)', listen: ['Gallup\'s two solos: the triplet pull-offs, the chromatic octaves, the half-step bends', 'The "fluttering echo" on the guitar and the "spare snare"', 'The string bass slapped under a crawling tempo'], album: 'Capitol, recorded 4 May 1956 at Bradley Studios, Nashville', key: 'E major, a slow rockabilly stroll',
      what: '"Sharp guitar breaks, spare snare drums, fluttering echo" — Unterberger\'s summary of the record that put Cliff Gallup\'s hand on tape: a flatpick with fingerpicks on the middle and ring fingers, the little finger on the Bigsby, a Duo Jet with DeArmond pickups through a Standel, and solos built from triplet pull-offs, octaves climbing by semitones and the major 6th. Thirty-five tracks in nine sessions that year, then he went home.',
      cites: '[23] [8] [24]' },
    { title: 'Train Kept A-Rollin\' (The Johnny Burnette Trio)', listen: ['Burlison\'s riff: octaves in a minor key, the tube loosened for the fuzz', 'The trio\'s drive — a rockabilly record that is also the first distorted guitar on one', 'What the Yardbirds and Aerosmith kept of it'], album: 'Coral, recorded 2 July 1956 at Bradley\'s Barn', key: 'E, a three-note minor riff over an E chord',
      what: 'A three-note minor-key line repeated through the record, played as octaves against Burnette\'s E chord, through an amplifier with a power tube worked loose after a fall — "whenever I wanted to get that sound, I\'d just reach back and loosen that tube". The psychobilly guitar\'s distortion starts here; the Yardbirds\' 1965 version and Aerosmith\'s 1974 one carried it into rock.',
      cites: '[25] [26]' },
    { title: 'Folsom Prison Blues (Johnny Cash and the Tennessee Two)', listen: ['Luther Perkins\' boom-chicka: the bass strings muted with the heel of the hand, the chord on the "and"', 'Cash\'s paper under the strings for a snare sound, no drummer', 'The 1968 live version, faster, with W.S. Holland\'s train beat'], album: 'Sun, recorded 30 July 1955; the live album, Folsom Prison, 13 January 1968', key: 'a train-beat two-step',
      what: 'The country side of psychobilly\'s rhythm: Perkins muting the three low strings with the heel of his right hand — a technique inspired by Merle Travis — so the bass thumps and the chord answers it, Cash strumming with paper under his strings for the snare rhythm, Marshall Grant\'s bass in two. The live version at Folsom is the tempo the Reverend\'s country songs take.',
      cites: '[27] [11] [11b]' },
    { title: 'Rumble (Link Wray)', listen: ['A chord progression and a tremolo, and nothing else: the distortion is the song', 'The D and E power chords', 'What the Cramps took from it'], album: 'Cadence, 1958', key: 'an instrumental in D and E',
      what: 'The instrumental that was banned in New York and Boston for fear of gang fights, built from distortion and tremolo on power chords — Wray is credited with the power chord itself, and with puncturing his speaker cones for the sound. Poison Ivy\'s admiration for Wray is where the Cramps\' rockabilly comes from; Robert Gordon\'s late-1970s records put Wray beside the revival.',
      cites: '[28] [29]' },
    { title: 'Songs the Lord Taught Us (The Cramps)', listen: ['Two guitars and no bass: Ivy\'s tremoloed twang and Gregory\'s fuzz', 'The rockabilly under the horror — "Tear It Up", "Fever", "Strychnine" beside the originals', 'Sun\'s room: Phillips Recording, Memphis, Alex Chilton producing'], album: 'Illegal, 1980 (recorded 1979 at Phillips Recording, Memphis)', key: 'garage rockabilly, mostly in E and A',
      what: 'The album the AV Club calls the blueprint: rockabilly and garage covers beside originals, played by two guitars without a bass — Poison Ivy\'s Twin-Reverb twang against Bryan Gregory\'s fuzz — in Sam Phillips\' later studio with Alex Chilton at the desk. Rolling Stone heard "a psychobilly sound that went way beyond the kitschiest moments of the Ramones or Blondie". Ivy: "to us all the \'50s rockabillies were psycho to begin with … like a crazed, sped-up hillbilly boogie version of country".',
      cites: '[30] [29] [2]' },
    { title: 'In Heaven and Wreckin\' Crew (The Meteors)', listen: ['Fenech\'s "lean and limber" chords twanging under the horror lyrics', 'The pace — rockabilly at a punk tempo, straight eighths', 'The wrecking crew in the pit, and the song named for it'], album: 'Island, 1981; ID/Lost Soul, 1983', key: 'rockabilly changes in major and minor keys, fast',
      what: 'The first records to call themselves psychobilly: P. Paul Fenech (guitar, vocals), Nigel Lewis (bass) and Mark Robertson (drums) out of a rockabilly band called Raw Deal, "initially shunned for being too spooky and mean" by the neo-rockabilly clubs, playing punk rock, 1960s garage and surf, rockabilly and horror film themes at once. Fenech, forty years on: "If anyone knows what psychobilly is then it\'s me. I was there when we started it." Tunebat measures "Wreckin\' Crew" at 116 BPM in A major, which reads as a half-time count of a fast two.',
      cites: '[31] [32] [33] [34]', tab2: 'https://tunebat.com/Info/Wreckin-Crew-The-Meteors/32flSNthJ7n6O6zYI59xC2' },
    { title: 'In Sickness & In Health (Demented Are Go)', listen: ['The second wave\'s pace and its weight', 'Sparky\'s voice against a guitar that is punk in its downstrokes and rockabilly in its changes', 'The stage show the histories describe, and the record that outlives it'], album: 'ID, 1986', key: 'fast psychobilly, mostly major keys',
      what: 'The record the Wikipedia article and the AV Club both date the second wave from: "loud, ugly, infectious fun from psychobilly\'s second-wave champs", from a band formed in Penarth around 1982 — the name "Demon teds are go!" — with Mark "Sparky" Phillips singing. The idiom on this page\'s wrecking-pace feel is this record\'s and the Nekromantix\'s.',
      cites: '[35] [2] [1]' },
    { title: 'Curse of the Coffin (Nekromantix)', listen: ['Kim Nekroman\'s slap bass on the coffin — the click as the clock', 'Peter Sandorff\'s guitar under it', 'The minor keys and the horror'], album: 'Nervous, 30 July 1991, Madhouse Studio, Luton', key: 'psychobilly in minor keys',
      what: 'The Danish band\'s second album, with Nekroman (a Danish Navy submarine radio operator for eight years before) on the coffin-shaped bass he built from a child\'s coffin, Peter Sandorff on guitar and Peek on drums; the title track\'s video on MTV\'s Alternative Nation. Wikipedia names Nekroman among the players of "rapid triplet slaps combined with walking basslines" — the drag triplet this page\'s wrecking feel puts in the band. GetSongBPM measures "Gargoyles over Copenhagen" at 98 BPM in F minor, a half-time count of a fast two.',
      cites: '[36] [37] [38] [17]', tab: 'https://www.songsterr.com/a/wsa/nekromantix-gargoyles-over-copenhagen-tab-s48347t1' },
    { title: 'Tiger Army (Tiger Army)', listen: ['"Nocturnal": the low-string melody with the echo on it, the minor key', 'The Eddie Cochran cover beside the originals', 'Rob Peltier\'s slap bass and Adam Carson\'s drums under Nick 13\'s Jet'], album: 'Hellcat, 26 October 1999', key: 'minor keys; "Nocturnal" in E minor by the tab sites',
      what: 'The third wave\'s American debut, produced by Nick 13 with AFI\'s Adam Carson on drums and the Quakes\' Rob Peltier on bass, Davey Havok and Tim Armstrong on backing vocals, and a cover of Eddie Cochran\'s "Twenty Flight Rock" among thirteen tracks. Nick 13 names Duane Eddy first among his influences — "I\'m mostly attracted to stylists" — and plays a Gretsch Jet through Fender amps for lead lines the New York Times heard as among the best punk of the year on the 2007 album.',
      cites: '[39] [18] [18b] [1]', tab: 'https://tabs.ultimate-guitar.com/tab/tiger-army/nocturnal-tabs-90173' },
    { title: 'Prisoner of Society (The Living End)', listen: ['Chris Cheney\'s guitar: rockabilly changes with a punk band\'s drive', 'Scott Owen\'s upright slapped the way Lee Rocker slaps', 'The chorus'], album: 'Second Solution / Prisoner of Society EP, 1997', key: 'punk rockabilly in a major key',
      what: 'The highest-selling Australian single of the 1990s, from a trio that turned a Stray Cats-inspired cover band into "a rock \'n\' roll band based on punk ethics"; Cheney calls the song "my take of \'My Generation\' or \'Summertime Blues\'". Owen learned by "mimicking Rocker\'s right hand movements on the upright bass".',
      cites: '[40] [41]' },
    { title: 'Rock This Town and Stray Cat Strut (Stray Cats)', listen: ['Setzer\'s Gretsch 6120 through the echo, Lee Rocker\'s slap, Slim Jim Phantom\'s stand-up kit', 'The Strut: C minor walking down by whole steps through 7th chords, swung', 'The solos: the 6ths, the bebop notes, the Bigsby'], album: 'Arista, 1981 (Dave Edmunds producing)', key: '"Rock This Town" in D, "Stray Cat Strut" in C minor',
      what: 'The revival\'s two hits, cut in London with Dave Edmunds: a twelve-bar rocker (Tunebat has it at 99 BPM, a half-time count of a fast four) and a strut in C minor down Cm, B♭7, A♭7, G7 with "an eighth-note swing feel" whose solo Guitar World put at No. 92 of all time. Setzer\'s idiom — 6/9s, 13ths, a m7♭5 as a rootless 9th, Travis picking, hybrid and economy picking, whammy-bar dips on the stabs — is the swing side of this page.',
      cites: '[42] [43] [10] [9] [9b]' },
    { title: 'Psychobilly Freakout (The Reverend Horton Heat)', listen: ['The Gretsch through distortion and the whammy bar', 'No verse–chorus form: the sections come as they come', 'The "Wipe Out" drum break the bridge echoes'], album: 'Smoke \'Em If You Got \'Em, Sub Pop, 1990 (written 1989)', key: 'E; 161 BPM by GetSongBPM',
      what: 'The song that taught American alternative-rock audiences the word — rapid fretboard work, whammy bar and distortion, a bridge (from 1:36) that echoes the Surfaris\' "Wipe Out", and no traditional verse-chord-bridge structure — from a band whose leader says "We\'re not really Psychobilly … a rockabilly band that was just a little bit more turned up and more aggressive". Lux Interior and Poison Ivy named the band as the latter-day act closest to the Cramps.',
      cites: '[15b] [15] [1] [44]' },
    { title: 'Wiggle Stick, 400 Bucks and Bales of Cocaine (The Reverend Horton Heat)', listen: ['Jimbo Wallace\'s slap under "400 Bucks"', 'The country in "Bales of Cocaine": the train, the two-step', 'Gibby Haynes\' production at Ardent, Memphis'], album: 'The Full-Custom Gospel Sounds of the Reverend Horton Heat, Sub Pop, 20 April 1993 (Ardent Studios, Memphis)', key: 'E and A, the trio in full',
      what: 'The second album, produced by Gibby Haynes of the Butthole Surfers at Ardent — "Wiggle Stick" an MTV hit, "The Devil\'s Chasing Me", "Bales of Cocaine", "Nurture My Pig" among its twelve — with Heath, Wallace and Taz Bentley as the trio. AllMusic hears "dazzling high-speed guitar runs, thundering rhythms, high-profile swagger, and lyrical smirk". The country feel on this page is the side the record shows.',
      cites: '[45] [44] [1]' },
    { title: 'Big Red Rocket of Love and It\'s Martini Time (The Reverend Horton Heat)', listen: ['The swing: 6/9s and 9ths, the walking bass, the horns', 'Scott Churilla\'s first record with the trio', 'The lounge side beside the rockabilly'], album: 'It\'s Martini Time, Interscope, 2 July 1996 (Thom Panunzio producing)', key: 'the swing side, major keys',
      what: 'The fourth album and the first to chart (No. 165), recorded in Dallas and Los Angeles with Scott Churilla on drums, Wallace on upright and fiddle, and session piano, steel, sax and brass: the jump-and-swing side of the band, which the Wikipedia article on rockabilly describes as the band moving "through swing-influenced work". The jump feel on this page is that side.',
      cites: '[46] [21] [1]' },
    { title: 'Baddest of the Bad and In Your Wildest Dreams (The Reverend Horton Heat)', listen: ['Al Jourgensen\'s production: the trio heavier', 'The guitar as the whole harmony, the band a trio', '"Big Sky" and the surf; "I Can\'t Surf"'], album: 'Liquor in the Front, Sub Pop/Interscope, 5 July 1994 (Crystal Clear Studios, Dallas; Al Jourgensen producing)', key: 'guitar-heavy rockabilly with punk, surf and country in it',
      what: 'The major-label debut, produced by Ministry\'s Al Jourgensen (who also plays pedal steel and piano on it): "the band\'s guitar-heavy rockabilly style flavored with punk rock, surf rock and country elements", thirteen tracks including covers of "Jezebel" and Scott Joplin\'s "The Entertainer". Heath on the gear of the era: a Boss analog delay into a Fender Super Reverb, the Gretsch since 1989 because its Filter\'Trons "didn\'t buzz as much" than the ES-175 and the bridge pickup "sounded almost like a Tele".',
      cites: '[47] [48] [44]' },
    { title: 'Rev and Whole New Life (The Reverend Horton Heat)', listen: ['"Victory Lap", "Smell of Gasoline": the aggressive mid-1990s sound come back, by Heath\'s own account', 'The band recording itself in Dallas', 'The full-time pianist on the 2018 album'], album: 'Rev, Victory, 21 January 2014; Whole New Life, Victory, 2018', key: 'rockabilly, the trio recorded by its leader',
      what: 'The highest-charting record (No. 111), produced and engineered by Heath at Universal Rehearsal and Modern Electric Sound in Dallas — "I decided to get back to a little bit of the aggressive, edgier sound that Reverend Horton Heat was kind of known for in the mid \'90s" — and, four years on, an album with a full-time pianist. How he records the slap bass: the pickup direct, a mic on the amp, "a nice mic on the bridge … it\'s a little bit simpler than what people think".',
      cites: '[49] [50] [51] [44]' },
  ];

  // ---- the players, wave by wave (the table on the page is written from this) ----
  const PLAYERS = [
    ['The foundation, 1954–58', 'Scotty Moore (Memphis; Elvis Presley)', 'guitar', 'Gibson ES-295, L-5 and Super 400 through the Ray Butts EchoSonic; thumbpick and fingers, Travis- and Atkins-derived; the walking pickup line, 6ths and 9ths', 'That\'s All Right, Mystery Train, Baby Let\'s Play House', '[7] [21] [22]'],
    ['', 'Bill Black (Memphis; Elvis Presley)', 'upright bass', 'the slap as the drum on the first Sun sides; the rockabilly single slap', 'That\'s All Right, Mystery Train', '[20] [38]'],
    ['', 'Cliff Gallup (Norfolk, Virginia; Gene Vincent and His Blue Caps)', 'guitar', 'Gretsch Duo Jet with DeArmond pickups and a Bigsby, a Standel amp; flatpick and fingerpicks, half-step bends, triplet pull-offs, chromatic octaves, the 6/9', 'Be-Bop-A-Lula, Race with the Devil', '[8] [24] [23]'],
    ['', 'Carl Perkins (Jackson, Tennessee)', 'guitar, voice', 'finger picking, pedal-steel imitations, palm muting, bends, 6th, 9th and 13th chords, crosspicking', 'Blue Suede Shoes, Matchbox, Honey Don\'t', '[19]'],
    ['', 'Paul Burlison (Memphis; the Johnny Burnette Trio)', 'guitar', 'the first distorted guitar on a rock record — a loosened power tube — and the octave riff', 'Train Kept A-Rollin\', Honey Hush', '[25] [26]'],
    ['', 'Luther Perkins (Memphis; Johnny Cash and the Tennessee Two)', 'guitar', 'Fender Esquire, later Jazzmaster and Jaguar; the palm-muted boom-chicka, walks to the next root', 'Folsom Prison Blues, I Walk the Line', '[11] [11b] [27]'],
    ['', 'Link Wray (Washington; and with Robert Gordon)', 'guitar', 'distortion and tremolo on power chords; the punctured speaker', 'Rumble, Red Hot (with Gordon)', '[28]'],
    ['', 'Dick Dale (California)', 'guitar', 'tremolo picking — "the pulsation" — on an upside-down Stratocaster through the Showman with a 15-inch JBL; the reverb; the Arabic scales of his family', 'Misirlou', '[14]'],
    ['The precursors and the revival, 1976–83', 'Poison Ivy and Bryan Gregory (New York; the Cramps)', 'two guitars, no bass', 'Ivy\'s Twin-Reverb twang against Gregory\'s fuzz; Link Wray, Hasil Adkins, Dick Dale, the Ventures and the garage bands under the horror', 'Songs the Lord Taught Us (1980), Human Fly, Garbageman', '[29] [30] [2]'],
    ['', 'Hasil Adkins (West Virginia)', 'one-man band', 'guitar, drums and voice at once; the Cramps covered "She Said" and Norton Records revived him', 'She Said, Chicken Walk', '[52]'],
    ['', 'Brian Setzer, Lee Rocker, Slim Jim Phantom (Long Island; the Stray Cats)', 'guitar / upright / stand-up kit', 'Gretsch 6120 with the Bigsby, slapback; 6/9s, 9ths and 13ths, a m7♭5 as a 9th, Travis, hybrid and economy picking; Rocker\'s slap the model for Scott Owen', 'Rock This Town, Stray Cat Strut, Runaway Boys', '[9] [9b] [10] [42] [43] [41]'],
    ['', 'Tim Polecat and Boz Boorer (London; the Polecats)', 'voice / guitar', '"rockabilly with a punk sense of anarchy" — the name changed from the Cult Heroes to get rockabilly gigs', 'Rockabilly Guy', '[21]'],
    ['The first wave, 1980–85 (London and the Klub Foot)', 'P. Paul Fenech, Nigel Lewis, Mark Robertson (the Meteors)', 'guitar / bass / drums', 'the first band to call itself psychobilly; "lean and limber guitar chords"; punk, 1960s garage and surf, rockabilly and horror at once', 'In Heaven (1981), Wreckin\' Crew (1983), Stampede! (1984)', '[31] [32] [33]'],
    ['', 'Pip Hancox, Stuart Osborne, Sam Sardi, Dave Turner (Feltham; Guana Batz)', 'voice / guitar / upright / drums', 'the accessible, poppy end of the first wave; Nick 13 calls their 1985 album the most important release since the Meteors\' first two', 'Held Down to Vinyl at Last (1985), King Rat', '[1] [2] [53]'],
    ['', 'Sparky, Ant Thomas and Dick Thomas (Penarth; Demented Are Go)', 'voice / drums / bass', 'the second wave\'s opening record; the wild stage show', 'In Sickness & In Health (1986), Kicked Out of Hell (1988)', '[35] [1] [2]'],
    ['', 'King Kurt, the Sharks, Torment, Frenzy, Skitzo, Klingonz, the Sting-rays', 'the Klub Foot bands', '"Destination Zululand" at No. 36 in 1983 (King Kurt, Dave Edmunds producing the album); "Take a Razor to Your Head" (the Sharks); Simon Brand\'s Torment; Steve Whitehouse\'s Frenzy, thirty years touring', 'Stomping at the Klub Foot, six volumes (1984–88)', '[54] [1] [3] [55]'],
    ['The second wave, 1986–95 (Europe)', 'Jeroen Haamers, Eric Haamers, Johnny Zuidhof (Rotterdam and Breda; Batmobile)', 'guitar / double bass / drums', 'the first non-UK band at the Klub Foot (1986); "We didn\'t get into psychobilly, but that got into us" — Presley, Vincent and Berry covers played faster and faster', 'Bail Was Set at $6,000,000 (1988)', '[56] [1]'],
    ['', 'Köfte DeVille and Mad Sin (Berlin)', 'voice and band', '"a sped-up combination of rockabilly, punk, white-trash blues" with country and metal in it; street musicians in shopping malls before the clubs', 'God Save the Sin (1996), Burn and Rise (2010)', '[57] [2]'],
    ['', 'Kim Nekroman and Peter Sandorff (Copenhagen; Nekromantix)', 'coffin bass, voice / guitar', 'the coffin-shaped double bass built from a child\'s coffin; the rapid triplet slap; Hellcat from 2001', 'Curse of the Coffin (1991), Return of the Loving Dead (2002)', '[36] [37] [38]'],
    ['', 'Paul Roman and Rob Peltier (Buffalo, then London; the Quakes)', 'guitar, voice / upright', 'modern rockabilly sped up in a town with no scene to speak of, then Nervous Records in London; Peltier played on Tiger Army\'s debut', 'Voice of America (1990)', '[58] [39]'],
    ['The third wave, 1996 on (California and the world)', 'Nick 13, Geoff Kresge, Djordje Stijepovic (Berkeley; Tiger Army)', 'guitar, voice / upright / upright', 'Gretsch Jets through Fender amps; Duane Eddy, Johnny Ramone, Billy Zoom and the Shadows; echo-laden leads in minor keys; Kresge among Wikipedia\'s named slap players', 'Tiger Army (1999), Ghost Tigers Rise (2004), Music from Regions Beyond (2007)', '[39] [18] [18b] [38]'],
    ['', 'Patricia Day and Kim Nekroman (Copenhagen, then California; HorrorPops)', 'upright, voice / guitar', 'the Nekromantix\'s bassist on guitar behind Day\'s upright; Hellcat', 'Hell Yeah! (2004)', '[59]'],
    ['', 'Chris Cheney and Scott Owen (Melbourne; the Living End)', 'guitar, voice / upright', 'the rockabilly revival\'s trio at punk speed and pop scale; Owen\'s slap learned from Lee Rocker\'s right hand', 'Prisoner of Society (1997), The Living End (1998)', '[40] [41]'],
    ['', 'Jim Heath, Jimbo Wallace and their drummers (Dallas; the Reverend Horton Heat)', 'Gretsch 6120 RHH, voice / upright / drums', 'a flatpick with the fingers behind it, Travis and Atkins licks crosspicked, open strings inside the changes, the dirt from a 20-watt Gretsch on ten, the slapback; Wallace\'s tiger-striped King upright through Gallien-Krueger', 'Smoke \'Em If You Got \'Em (1990), The Full-Custom Gospel Sounds (1993), Liquor in the Front (1994), It\'s Martini Time (1996), Rev (2014)', '[13] [13b] [48] [44] [60] [49]'],
    ['', 'The Chop Tops, the Kings of Nuthin\', Koffin Kats, the Creepshow, the Gutter Demons, Os Catalépticos, Zombie Ghost Train, the Snakes, Kryptonix', 'the third wave abroad', 'California, Boston, Detroit, Ontario, Montreal, Brazil, Australia, Italy and France, on the Wikipedia article\'s roll', '', '[1]'],
  ];

  // ---- the sources ----
  const SOURCES = [
    ['src-wiki-psychobilly', '1', 'Wikipedia, <b>"Psychobilly"</b> (the definition, the instrumentation, the etymology, the waves, the bands by country, the wrecking, Nate Katz and McIntosh &amp; Leverette as quoted). Read.', 'https://en.wikipedia.org/wiki/Psychobilly'],
    ['src-avclub', '2', 'The A.V. Club, <b>"Where to start with psychobilly"</b> (the ten records, the history, Lux Interior\'s "one-half hillbilly and one-half punk"). Read.', 'https://www.avclub.com/where-to-start-with-psychobilly-1798279157'],
    ['src-htf', '3', 'Matthews, J. P. (2013). <b>"Psychobilly: The Greatest Rock &amp; Roll Story Never Told"</b>, parts 1 and 2, HTF Magazine (the bands, the labels, the wrecking, the fashion). Read.', 'https://www.hitthefloor.com/features/psychobilly-greatest-rock-roll-story-never-told-part-2/'],
    ['src-guitarwiz', '4', 'Guitar Wiz, <b>"Rockabilly Guitar for Beginners: Techniques, Licks, and Style"</b> (the boom-chicka, the pick as thumb, double stops, the slapback at 120–150 ms). Read.', 'https://guitarwiz.app/articles/rockabilly-guitar-basics/'],
    ['src-truefire', '5', 'TrueFire, <b>"Go Daddy Go: 12 Classic Rockabilly Licks"</b> (the Travis foundation, E6 and E7 chickas, Moore\'s thinned pattern and the ♭3–3 hammer-on, Burlison\'s octaves, Gallup\'s turnaround, the chromatic 6/9 run). Read.', 'https://blog.truefire.com/guitar-lessons/rockabilly-licks/'],
    ['src-pg-moore', '6', 'Premier Guitar, <b>"Beyond Blues: Scotty Moore\'s Raucous Rockabilly Licks"</b> (chord-based note choice, double stops on the third and second strings, the maj6/9 with the root on top, the thumbpick). Read.', 'https://www.premierguitar.com/lessons/beyond-blues-scotty-moores-raucous-rockabilly-licks'],
    ['src-scottymoore', '7', 'scottymoore.net, <b>"Playing Technique"</b> (thumb-pick and fingers, the Travis interpretation, the walking bass pickup line, the EchoSonic, the guitars). Read.', 'https://www.scottymoore.net/technique.html'],
    ['src-wyatt', '8', 'Wyatt, K., Guitar World, <b>"A Tribute to Cliff Gallup\'s Legendary Flash"</b> (the hybrid hand, the Bigsby, half-step bends, the 6th over the ♭7, the 6–9 chord, the Duo Jet, the Standel, the slapback). Read through a reader proxy; the page itself is behind a wall.', 'https://www.guitarworld.com/lessons/talkin-blues-keith-wyatt-tribute-cliff-gallup-s-legendary-flash'],
    ['src-pg-setzer', '9', 'Premier Guitar, <b>"Rhythm Rules: Brian Setzer\'s Rockabilly Antics"</b> (Travis picking, the m7♭5 as a rootless 9th, G13, C9, G6/9, the palm-muted riff with slapback, the dips "in a typical Setzer fashion"). Read. [9b] Guitar World, <b>"How to solo like rockabilly icon Brian Setzer"</b> (the bebop scale, chromatic notes, two-string pull-offs, economy and hybrid picking). Read through a reader proxy.', 'https://www.premierguitar.com/lessons/rhythm-rules-brian-setzers-rockabilly-antics'],
    ['src-maclennan', '10', 'MacLennan, J., <b>"Stray Cat Strut" chords and lesson</b> (C minor, the eight chords, the eighth-note swing, the Bigsby). Read.', 'https://www.jonmaclennan.com/blog/stray-cat-strut-chords'],
    ['src-luther', '11', 'Wikipedia, <b>"Luther Perkins"</b> (the heel of the hand on the low strings, "inspired by Merle Travis", the Esquire, Jazzmaster and Jaguar). Read. [11b] johnnycashguitar.weebly.com, <b>"Luther Perkins Boom-Chicka-Boom"</b>. Read.', 'https://en.wikipedia.org/wiki/Luther_Perkins'],
    ['src-riffhard', '12', 'Riffhard, <b>"How to Play Psychobilly Guitar"</b> (the chug and the gallop, power chords and diminished chords, chromatic runs, double stops, slides and bends, the hollow-body and the tube amp). Read.', 'https://www.riffhard.com/how-to-play-psychobilly-guitar/'],
    ['src-pg-rev', '13', 'Charupakorn, J. (2013). <b>"Reverend Horton Heat: Rompin\' with the Rev"</b>, Premier Guitar (the hybrid flatpick style, the Chet Atkins cover, the 6120 RHH, the 20-watt Executive on ten, the pedals, strings and pick). Read. [13b] Vintage Guitar, <b>"The Reverend Horton Heat"</b> (2007/2010: Travis and Atkins licks, crosspicking for "fast, banjo-style 16th notes", Django, the slapback he "can\'t be a rockabilly cat without", the gear). Read through a reader proxy.', 'https://www.premierguitar.com/artists/reverend-horton-heat-rompin-with-the-rev'],
    ['src-dale', '14', 'Wikipedia, <b>"Dick Dale"</b> (tremolo picking, the upside-down Stratocaster, the Showman and the JBL, the reverb, the Arabic music behind "Misirlou"). Read.', 'https://en.wikipedia.org/wiki/Dick_Dale'],
    ['src-freakout', '15', 'Guitar Hero wiki, <b>"Psychobilly Freakout"</b> (the whammy bar and distortion, the Wipe Out bridge at 1:36, the form). Read. [15b] Songfacts, <b>"Psychobilly Freakout"</b> (written 1989; "We\'re not really Psychobilly"). Read. [15c] GetSongBPM, 161 BPM. Read.', 'https://www.songfacts.com/facts/the-reverend-horton-heat/psychobilly-freakout'],
    ['src-drums', '16', 'Krash Boom Bam, <b>"Rockabilly Drumming"</b> (swing on the ride, four on the kick, 2 and 4, train beats with brushes, "spooky" tom fills); Joe the Drummer, <b>"The Train Beat"</b>; the Drum Forum thread on rockabilly drums. Read.', 'https://kermitvonmunster.wordpress.com/rockabilly-drumming/'],
    ['src-notreble', '17', 'Dr. D., No Treble, <b>"Upright Slap Bass (Rockabilly/Psychobilly etc.)"</b>, parts 1 and 2 (the snap and the slap, single, double and triple slaps, the etudes: the slap on the upbeat, the shuffle, "an eighth and two sixteenths" — the gallup rhythm; "for extremely fast slapping, like that in Psychobilly, you will definitely need to learn the drag triplet"). Read.', 'https://www.notreble.com/buzz/2010/02/01/the-lowdown-with-dr-d-upright-slap-bass-rockabillypsychobilly-etc-intro-part-1-of-3/'],
    ['src-nick13', '18', 'Gretsch, <b>"Tiger Army\'s Nick 13 on his Gretsch Guitar Collection"</b> (2017: "I\'m mostly attracted to stylists", Duane Eddy, Johnny Ramone, Billy Zoom, Ron Emory). Read. [18b] McStea, M., Guitar World (2020), <b>"Tiger Army\'s Nick 13: \'50s rock is so great…"</b> (Joe Meek, the Shadows, Dick Dale, the signature Jet). Read through a reader proxy.', 'https://blog.gretschguitars.com/2017/10/tiger-armys-nick-13-calls-gretsch-collection-rock-roll-guitars/'],
    ['src-perkins', '19', 'Wikipedia, <b>"Carl Perkins"</b> (the techniques and chords, the re-tied strings and the blue note, "Blue Suede Shoes", Charlie Daniels as quoted). Read.', 'https://en.wikipedia.org/wiki/Carl_Perkins'],
    ['src-thatsallright', '20', 'Wikipedia, <b>"That\'s All Right"</b> (5 July 1954, the live-to-one-track trio, no drums, "at least twice as fast"). Read.', 'https://en.wikipedia.org/wiki/That%27s_All_Right'],
    ['src-rockabilly', '21', 'Wikipedia, <b>"Rockabilly"</b> (the characteristics, slap bass, echo, Sun, the artists, the revival: the Stray Cats, the Polecats, Robert Gordon; psychobilly and the Reverend). Read.', 'https://en.wikipedia.org/wiki/Rockabilly'],
    ['src-mysterytrain', '22', 'Wikipedia, <b>"Mystery Train"</b> ("a country lead break and fingerstyle picking, with a touch of slapback echo"; the Parker and Travis figures). Read.', 'https://en.wikipedia.org/wiki/Mystery_Train'],
    ['src-bebopalula', '23', 'Wikipedia, <b>"Be-Bop-a-Lula"</b> (4 May 1956, Bradley Studios, the Blue Caps; Unterberger as quoted). Read.', 'https://en.wikipedia.org/wiki/Be-Bop-a-Lula'],
    ['src-gallup', '24', 'Wikipedia, <b>"Cliff Gallup"</b> (the pick and fingerpicks, the Duo Jet with DeArmonds, the Standel, the 35 tracks of 1956, the players who cite him). Read.', 'https://en.wikipedia.org/wiki/Cliff_Gallup'],
    ['src-trainkept', '25', 'Wikipedia, <b>"Train Kept A-Rollin\'"</b> (the loosened tube — "whenever I wanted to get that sound" — the octaves over the E chord, Bradley\'s Barn, 2 July 1956). Read.', 'https://en.wikipedia.org/wiki/Train_Kept_A-Rollin%27'],
    ['src-burlison', '26', 'Wikipedia, <b>"Paul Burlison"</b> (the Rock and Roll Trio, Howlin\' Wolf, the distortion credit). Read.', 'https://en.wikipedia.org/wiki/Paul_Burlison'],
    ['src-folsom', '27', 'Wikipedia, <b>"Folsom Prison Blues"</b> (30 July 1955, the paper under the strings, the 1968 Folsom version). Read.', 'https://en.wikipedia.org/wiki/Folsom_Prison_Blues'],
    ['src-wray', '28', 'Wikipedia, <b>"Link Wray"</b> ("Rumble", the bans, the power chord, the punctured cones, Robert Gordon, Townshend as quoted). Read.', 'https://en.wikipedia.org/wiki/Link_Wray'],
    ['src-cramps', '29', 'Wikipedia, <b>"The Cramps"</b> (the 1976 lineup, two guitars and no bass until 1986, the influences, Ivy on the term). Read. Also Wikipedia, <b>"Poison Ivy (musician)"</b> and Vice\'s <b>Guide to the Cramps</b> (summaries: the Twin-Reverb twang against the Superfuzz).', 'https://en.wikipedia.org/wiki/The_Cramps'],
    ['src-songsthelord', '30', 'Wikipedia, <b>"Songs the Lord Taught Us"</b> (Phillips Recording, Alex Chilton, the covers, Rolling Stone as quoted). Read.', 'https://en.wikipedia.org/wiki/Songs_the_Lord_Taught_Us'],
    ['src-meteors', '31', 'Wikipedia, <b>"The Meteors"</b> (1980, Raw Deal, the members, the albums, "too spooky and mean", Fenech\'s side projects). Read.', 'https://en.wikipedia.org/wiki/The_Meteors'],
    ['src-meteors-enc', '32', 'Encyclopedia.com, <b>"The Meteors"</b> (the Southern Boys and Rock Therapy before Raw Deal, the lineups, Mark Deming\'s "lean and limber guitar chords", the 4,500 shows). Read.', 'https://www.encyclopedia.com/education/news-wires-white-papers-and-books/meteors'],
    ['src-fenech', '33', 'Sommer, S. (2026). <b>"P Paul Fenech: Dancing at the End of the World"</b>, Louder Than War (the writing, the Meteors\' democracy, "If anyone knows what psychobilly is then it\'s me", "fulkabilly"). Read.', 'https://louderthanwar.com/p-paul-fenech-dancing-at-the-end-of-the-world-album-review-and-interview/'],
    ['src-tunebat-wreckin', '34', 'Tunebat and SongBPM, <b>"Wreckin\' Crew"</b> (116 BPM, A major — read as a half-time count). Summary only.', 'https://tunebat.com/Info/Wreckin-Crew-The-Meteors/32flSNthJ7n6O6zYI59xC2'],
    ['src-demented', '35', 'Wikipedia, <b>"Demented Are Go"</b> (Penarth, the name, the members, the albums, the influence). Read. The Wikipedia page for the album itself could not be found by the tools.', 'https://en.wikipedia.org/wiki/Demented_Are_Go'],
    ['src-nekromantix', '36', 'Wikipedia, <b>"Nekromantix"</b> (1989, the submarine years, the coffinbass, the members, the albums, Hellcat 2001). Read. [36b] Wikipedia, <b>"Kim Nekroman"</b> (summary).', 'https://en.wikipedia.org/wiki/Nekromantix'],
    ['src-curse', '37', 'Wikipedia, <b>"Curse of the Coffin"</b> (30 July 1991, Nervous, Madhouse Studio, Mickey Mutant, the video on Alternative Nation). Read. GetSongBPM, <b>"Gargoyles Over Copenhagen"</b> (98 BPM, F minor — read as a half-time count). Summary.', 'https://en.wikipedia.org/wiki/Curse_of_the_Coffin'],
    ['src-slapping', '38', 'Wikipedia, <b>"Slapping (music)"</b> (the double bass section: the string bouncing off the fingerboard, the early jazz players, Bill Black, "Kim Nekroman, Geoff Kresge, Scott Owen, and Jimbo Wallace … rapid triplet slaps combined with walking basslines"). Read.', 'https://en.wikipedia.org/wiki/Slapping_(music)'],
    ['src-tigerarmy', '39', 'Wikipedia, <b>"Tiger Army"</b> and <b>"Tiger Army (album)"</b> (1996 Berkeley, 924 Gilman, the members, the six albums, the debut\'s players and the Cochran cover, the Times on the 2007 album). Read.', 'https://en.wikipedia.org/wiki/Tiger_Army_(album)'],
    ['src-prisoner', '40', 'Wikipedia, <b>"Prisoner of Society"</b> (the 1997 EP, the charts, Cheney on "My Generation" and "Summertime Blues", Sing Sing Studios). Read.', 'https://en.wikipedia.org/wiki/Prisoner_of_Society'],
    ['src-livingend', '41', 'Wikipedia, <b>"The Living End"</b> (1994 Melbourne, the name, "a rock \'n\' roll band based on punk ethics", Owen mimicking Rocker\'s right hand, the albums). Read.', 'https://en.wikipedia.org/wiki/The_Living_End'],
    ['src-rockthistown', '42', 'Wikipedia, <b>"Rock This Town"</b> (Dave Edmunds, 30 January 1981, No. 9 UK and US, the Rock Hall\'s 500). Read. Tunebat/GetSongBPM, 99 BPM, D major (summary; a half-time count).', 'https://en.wikipedia.org/wiki/Rock_This_Town'],
    ['src-strut', '43', 'Wikipedia, <b>"Stray Cat Strut"</b> (Edmunds, the personnel, No. 3 in March 1983, Guitar World\'s No. 92 solo). Read. Wikipedia, <b>"Brian Setzer"</b> (the Tomcats, London 1980, the Orchestra). Read.', 'https://en.wikipedia.org/wiki/Stray_Cat_Strut'],
    ['src-rhh', '44', 'Wikipedia, <b>"The Reverend Horton Heat"</b> (1985 Dallas, the Deep Ellum nickname, the members and dates, the labels and albums, the influences, "godfather of modern rockabilly and psychobilly"). Read. AllMusic, Huey, S., <b>biography</b> (the albums, producers and labels; "dazzling high-speed guitar runs…"). Read through a reader proxy.', 'https://en.wikipedia.org/wiki/The_Reverend_Horton_Heat'],
    ['src-fullcustom', '45', 'Wikipedia, <b>"The Full-Custom Gospel Sounds of the Reverend Horton Heat"</b> (20 April 1993, Gibby Haynes, Ardent, the tracks, the trio). Read. Wikipedia, <b>"Smoke \'Em If You Got \'Em"</b> (1990, Sub Pop, the tracks, the guests, the reviews as quoted). Read.', 'https://en.wikipedia.org/wiki/The_Full-Custom_Gospel_Sounds_of_the_Reverend_Horton_Heat'],
    ['src-martini', '46', 'Wikipedia, <b>"It\'s Martini Time"</b> (2 July 1996, Thom Panunzio, the studios, Churilla\'s first, No. 165, the session players). Read.', 'https://en.wikipedia.org/wiki/It%27s_Martini_Time'],
    ['src-liquor', '47', 'Wikipedia, <b>"Liquor in the Front"</b> (5 July 1994, Al Jourgensen, Crystal Clear, the covers, the genre line as quoted). Read.', 'https://en.wikipedia.org/wiki/Liquor_in_the_Front'],
    ['src-gw-heath', '48', 'Guitar World (2019), <b>"Reverend Horton Heat\'s Jim Heath Talks Lemmy, Gretsch Gear and New Album, \'Whole New Life\'"</b> ("I\'m a cheater" and the open strings, the Gretsch since 1989, the Boss delay into the Super Reverb, Jerry Lee Lewis, Little Richard and Professor Longhair). Read through a reader proxy.', 'https://www.guitarworld.com/artists/reverend-horton-heats-jim-heath-talks-lemmy-gretsch-gear-and-new-album-whole-new-life'],
    ['src-rev', '49', 'Wikipedia, <b>"Rev (The Reverend Horton Heat album)"</b> (21 January 2014, Victory, Heath producing and engineering, the Dallas studios, No. 111). Read.', 'https://en.wikipedia.org/wiki/Rev_(The_Reverend_Horton_Heat_album)'],
    ['src-tvd', '50', 'Pacella, J. (2014). <b>"Reverend Horton Heat: The TVD Interview"</b>, The Vinyl District (Gene Vincent, Johnny Burnette, the Chess records, Cash\'s Folsom and Luther Perkins learned as a child, "We\'re a rock and roll band", the aggressive sound of the mid-1990s, the labels, the Jimbo Song). Read.', 'https://www.thevinyldistrict.com/storefront/reverend-horton-heat-tvd-interview/'],
    ['src-tapeop', '51', 'Tape Op #134 (2019), <b>"Jim Heath: Reverend Horton Heat\'s Studio Secrets"</b> (the drums, the upright — the pickup, the amp mic, "a nice mic on the bridge" — the flubs left in, the tape-splice edits). Read.', 'https://tapeop.com/interviews/134/jim-heath-reverend-horton-heat'],
    ['src-adkins', '52', 'Wikipedia, <b>"Hasil Adkins"</b> (the one-man band, "She Said", the Cramps\' cover, Norton Records, "I didn\'t try to be primitive"). Read.', 'https://en.wikipedia.org/wiki/Hasil_Adkins'],
    ['src-guanabatz', '53', 'Wikipedia, <b>"Guana Batz"</b> (1982, Feltham, the members, the switch back to an upright in 1984). Read; the article says it relies on a single source.', 'https://en.wikipedia.org/wiki/Guana_Batz'],
    ['src-kingkurt', '54', 'Wikipedia, <b>"King Kurt"</b> (1981, the members, "Destination Zululand" at No. 36, Ooh Wallah Wallah, the flour and eggs). Read.', 'https://en.wikipedia.org/wiki/King_Kurt'],
    ['src-klubfoot', '55', 'Wikipedia, <b>"Klub Foot"</b> (the Clarendon Hotel ballroom, 1982–88, the bands, the six live volumes, Hamish Macdonald, the reunions). Read.', 'https://en.wikipedia.org/wiki/Klub_Foot'],
    ['src-batmobile', '56', 'Wikipedia, <b>"Batmobile (band)"</b> (1983, Rotterdam and Breda, the Haamers brothers and Zuidhof, the covers sped up, the Klub Foot in 1986, the albums). Read.', 'https://en.wikipedia.org/wiki/Batmobile_(band)'],
    ['src-madsin', '57', 'Wikipedia, <b>"Mad Sin"</b> (1987 Berlin, Köfte DeVille, the street years, the description as quoted, the albums). Read.', 'https://en.wikipedia.org/wiki/Mad_Sin'],
    ['src-quakes', '58', 'Wikipedia, <b>"The Quakes"</b> (1986 Buffalo, Paul Roman and Rob Peltier, London and Nervous, "no psychobilly scene to speak of"). Read.', 'https://en.wikipedia.org/wiki/The_Quakes'],
    ['src-horrorpops', '59', 'Wikipedia, <b>"HorrorPops"</b> (1996, POPKOM, Day and Nekroman, the Hellcat albums). Read.', 'https://en.wikipedia.org/wiki/HorrorPops'],
    ['src-jimbo', '60', 'Wikipedia, <b>"Jimbo Wallace"</b> (1989, the slap technique as described, the King tiger-striped upright, Gallien-Krueger, the stunts). Read.', 'https://en.wikipedia.org/wiki/Jimbo_Wallace'],
    ['src-kattari', '61', 'Kattari, K. (2020). <b>Psychobilly: Subcultural Survival</b>, Temple University Press. The publisher\'s description read (the decade of fieldwork, the scenes, "wild energy and a fast tempo"); the reviews in Popular Music History and Project MUSE were behind walls; the book itself was not read.', 'https://tupress.temple.edu/books/psychobilly'],
    ['src-athens', '62', 'Tsangaris, M. and Agrafioti, K. (2020). <b>"Psychobilly Psychosis and the Garage Disease in Athens"</b>, IAFOR Journal of Cultural Studies 5(1). Downloaded; only the metadata could be extracted.', 'https://iafor.org/archives/journals/iafor-journal-of-cultural-studies/10.22492.ijcs.5.1.02.pdf'],
    ['src-styleweekly', '63', 'Baldwin, B. (2016). <b>"Interview: Modern Rockabilly Godfather Jim \'Reverend Horton\' Heath"</b>, Style Weekly (the Ramones in Texas, the Cramps show, "take rockabilly and express to a punk rock crowd", "I\'ve never considered Reverend Horton Heat to be a psychobilly band", the 20-watt Executives). Read through a reader proxy.', 'https://www.styleweekly.com/interview-modern-rockabilly-godfather-jim-reverend-horton-heath/'],
    ['src-juice', '64', 'Olson, S. (2002). <b>"Reverend Horton Heat"</b>, Juice Magazine #55 (Freddy King, the family music, "Rockabilly is punk rock", 1985). Read in part; the rest is in the print issue.', 'https://juicemagazine.com/home/reverend-horton-heat/'],
    ['src-wipeout', '65', 'Wikipedia, <b>"Wipe Out (instrumental)"</b> (the Surfaris, 1963, the twelve-bar form, Ron Wilson\'s drum solo). Read.', 'https://en.wikipedia.org/wiki/Wipe_Out_(instrumental)'],
    ['src-unread', '66', 'Not readable by the tools, and not relied on: Premier Guitar\'s Rig Rundown video (2010; only its caption), Gretsch\'s rig-rundown post (the video alone), the TDPRI and Gretsch-Talk threads on Heath\'s guitar.com lessons (a paywall redirect), the D for Dangerous analysis at anyonecanplayguitar.co.uk (the tab and video are on Patreon), the Bradenton Times interview (403), Kim Nekroman\'s slap-bass video with Djordje Stijepovic, Johnny Hatton\'s slap-bass lesson (video), and every YouTube lesson. No recording was listened to and no video watched.', 'https://www.premierguitar.com/gear/rig-rundown-reverend-horton-heat'],
  ];

  // ---- the players table ----
  function renderPlayers(){
    const host = document.getElementById('players');
    if (!host) return;
    let wave = '';
    host.innerHTML = `<div class="wide"><table class="players"><thead><tr><th>Wave</th><th>Who, where</th><th>What</th><th>The hand</th><th>Records</th><th>Sources</th></tr></thead><tbody>${PLAYERS.map(([w, who, what, hand, records, cites]) => {
      const cell = w && w !== wave ? `<td class="wave">${esc(w)}</td>` : '<td></td>';
      if (w) wave = w;
      return `<tr>${cell}<td>${esc(who)}</td><td>${esc(what)}</td><td>${esc(hand)}</td><td>${esc(records)}</td><td class="cite">${esc(cites)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  // ---- the page, on the shared machinery ----
  const dive = GT.deepDive.create({
    style: STYLE, presetName: 'Psychobilly', prefix: 'psychobilly', homeWindow,
    gripGroups: GRIP_GROUPS, figures: scaleFigures,
    lists: { changes: () => CHANGES, scales: () => DRILLS, rhythm: () => RHYTHM, lead: () => LEAD, mixed: () => MIXED, exercises: () => EXERCISES, studies: () => STUDIES },
    songs: SONGS, sources: SOURCES,
  });
  renderPlayers();
  dive.init();

  // ---- the course: the Start-here lessons, every piece of the page in one of them ----
  // Each entry names something on the page (js/course.js resolves it): a
  // paragraph by id, a grip group or a figure by the start of its name, a
  // card by id, songs, faults and check-list lines by the start of their
  // text, the players by their wave. A note on a card is the practice tip.
  const LESSONS = [
    { id: 'boom', title: 'The boom and the chicka',
      tagline: 'The rhythm under every Sun side: the bass note on the beat, three strings on the "and", and the 6th that makes it rockabilly.',
      goal: 'the boom is a thud and the chicka a chick, two strokes a beat apart, at 120 on E, A and B7.',
      pieces: [
        { read: 'p-rockabilly' },
        { read: 'p-boomchicka' },
        { text: 'cards' },
        { read: 'p-grips', title: 'The grips: open chords with one finger moved' },
        { grips: 'The open E and its 6th', title: 'The open E and its 6th: the chicka' },
        { card: 'x1', note: 'Two strokes a beat: the thumb or the pick on the bass string, the fingers or the pick on the top three on the swung "and". Keep the heel of the hand on the bass strings so the boom thuds. Start at the tempo on the card and turn it up only when every chicka is three strings and no more.' },
        { card: 'x2', note: 'The pinky lands on the B string\'s 2nd fret for the chicka and lifts for the next: E, E6, E, E6. If the pinky stays down, every chicka is E6; if it lands late, the chicka comes out twice.' },
        { card: 'c-sun', note: 'The chords alone, the boom-chicka on each, through the rockabilly twelve\'s changes. Open in drills puts the same changes on the Drills tab with this strumming pattern at any tempo.' },
        { card: 'r-boom' },
        { read: 'p-mixed', title: 'Both at once: the mixed blend' },
        { card: 'm-boom' },
        { read: 'p-teachers', title: 'What goes wrong first, and how to tell when it is learned' },
        { faults: ['The boom-chicka', 'The 6th'] },
        { read: 'p-players', title: 'The players, wave by wave' },
        { players: 'The foundation' },
        { read: 'p-songs', title: 'The songs, as reference points' },
        { songs: ['That\'s All Right', 'Blue Suede Shoes'] },
        { check: ['The boom-chicka steady', 'The 6th and the ♭7'] },
      ] },
    { id: 'thumb', title: 'The thumb, the fingers, and the walk-up',
      tagline: 'Travis picking at rockabilly speed, Scotty Moore\'s double stops out of the Sun box, and the walking line that pulls every chord change in.',
      goal: 'the walking line lands on every new root on the beat.',
      pieces: [
        { read: 'p-pickfingers' },
        { read: 'p-sunbox' },
        { read: 'p-figures', title: 'Reading the figures' },
        { figure: 'E major pentatonic at the nut' },
        { card: 'sc1', note: 'The Sun box up and down in eighths. Neck on the card shows each note as it sounds; Open in drills puts the same box on the Drills tab, where the pattern and the notes a beat are yours to change.' },
        { card: 'sc2', note: 'The ♭3 slid or hammered into the 3rd: the "minor-to-major" move every rockabilly line leans on. Let the ♭3 be short and the 3rd arrive on the beat.' },
        { grips: 'The open B7', title: 'The open B7, E7 and A7: the rockabilly V' },
        { card: 'x4', note: 'The thumb alone first — root, 5th, root, 5th, palm-muted, for a whole bar — then the fingers on the top strings over it. The thumb never stops when the fingers move.' },
        { card: 'r-travis' },
        { read: 'p-lead', title: 'Lead parts in each feel' },
        { card: 'x3', note: 'Double stops out of the box, then the walk-up: 5th, 6th, ♭7, 7 in the last two beats, the new root exactly on the One.' },
        { card: 'l-scotty' },
        { read: 'p-studies', title: 'The studies' },
        { card: 'st1', note: 'The whole rockabilly twelve with the band, at the card\'s tempo when it holds. Play it through twice before moving on.' },
        { faults: ['The thumb and the fingers', 'The walking pickup line'] },
        { songs: ['Mystery Train', 'Train Kept A-Rollin', 'Baddest of the Bad'] },
        { check: ['The thumb alternating', 'The walking pickup line'] },
      ] },
    { id: 'swing', title: 'The swing side',
      tagline: 'The 6/9, the 9th and the 13th four to the bar, the Bigsby dip on the stab, and Cliff Gallup\'s triplet pull-offs and chromatic octaves.',
      goal: 'the dip is a semitone and the triplet pull-offs are even.',
      pieces: [
        { read: 'p-bigsby' },
        { grips: 'The 6/9', title: 'The 6/9, the 9th and the 13th: the jazz grips with the root on the A string' },
        { figure: 'A major pentatonic at the 5th' },
        { card: 'sc4', note: 'The jump side\'s box in triplets: three notes a beat, swung, even. The 6th and the 9th are the colours to lean on.' },
        { card: 'x5', note: 'The 6/9 four to the bar, short, 2 and 4 leaning; the stab on the "and of 2" pressed a semitone down with the bar and let back within the beat. The next chord must be in tune.' },
        { card: 'c-jump' },
        { card: 'r-four' },
        { card: 'r-ninths' },
        { card: 'l-gallup', note: 'Gallup\'s triplet pull-offs: the three notes even, the pull-off as loud as the picked note. The chromatic octaves climb by semitones — index and pinky two strings apart, the string between muted by the index.' },
        { card: 'm-four' },
        { card: 'st2' },
        { faults: ['The Bigsby dip', 'The 9th and the 6/9'] },
        { songs: ['Be-Bop-A-Lula', 'Big Red Rocket of Love'] },
        { check: ['Four to the bar with the 6/9', 'Gallup\'s triplet pull-offs'] },
      ] },
    { id: 'strut', title: 'The strut',
      tagline: 'A minor key walking down by whole steps through 7th chords, the stabs on two and four, the bar on the way into each change, and the bebop scale over the top.',
      goal: 'the stabs sit on two and four with the eighths swung.',
      pieces: [
        { read: 'p-swingside' },
        { figure: 'The Strut', title: 'The Strut\'s walk-down on the bass strings' },
        { figure: 'G Mixolydian at the 3rd', title: 'G Mixolydian over G7, with the major 7th passing: the bebop scale' },
        { card: 'sc5', note: 'The Mixolydian with the major 7th let in between the ♭7 and the root, so a run by semitones lands its chord tones on the beat.' },
        { card: 'c-strut', note: 'Cm, B♭7, A♭7, G7: the same grip walking down by whole steps, the stabs on two and four. Learn the changes before the lines between them.' },
        { card: 'r-stabs' },
        { card: 'l-bebop' },
        { card: 'm-stabs' },
        { card: 'st3' },
        { songs: ['Rock This Town and Stray Cat Strut'] },
        { check: ['The strut\'s walk-down'] },
      ] },
    { id: 'train', title: 'The train',
      tagline: 'Luther Perkins\' palm-muted boom-chicka under the wire brushes, and the chicken pickin\' that answers it: the popped note and the steel bend.',
      goal: 'the popped notes are louder than the picked ones and just as even.',
      pieces: [
        { read: 'p-slapbass' },
        { card: 'x6', note: 'The heel of the hand on the three low strings right at the bridge: a thud with pitch on the boom, a chick with none. Too far from the bridge and the bass strings die instead of thudding.' },
        { card: 'c-train' },
        { card: 'r-luther' },
        { figure: 'G major pentatonic at the 3rd', title: 'G major pentatonic at the 3rd, with the ♭3: the chicken-pickin\' box' },
        { card: 'sc7', note: 'The box in fours — four notes a beat — with the ♭3 hammered to the 3rd on the way.' },
        { card: 'x7', note: 'The popped notes are snapped by the middle finger, not picked: louder and brighter than the picked notes beside them, the same length. The steel bend: hold the 3rd on the B string while the 2nd on the G string is bent up to it.' },
        { card: 'l-chicken' },
        { card: 'm-luther' },
        { card: 'st4' },
        { faults: ['Luther\'s mute', 'Chicken pickin\''] },
        { songs: ['Folsom Prison Blues', 'Wiggle Stick'] },
        { check: ['Luther\'s figure', 'Chicken-pickin\' pops'] },
      ] },
    { id: 'stomp', title: 'The stomp',
      tagline: 'Straight eighths in a minor key with the heel on the strings, the power chord, the ♭2 and the ♭5, the double slap under it: the Meteors\' way, and where it came from.',
      goal: 'the downstrokes are even at 160 with the heel on the strings.',
      pieces: [
        { read: 'p-word' },
        { read: 'p-meteors' },
        { grips: 'The power chord', title: 'The power chord with the open E: the stomp' },
        { card: 'x8', note: 'Every stroke a downstroke, the heel on the strings, the eighths dead even. The gallop — beat, two sixteenths — with the two sixteenths equal. Start slow: the mute lifts as the tempo rises if the wrist tires.' },
        { card: 'c-stomp' },
        { card: 'r-eighths' },
        { card: 'r-down' },
        { read: 'p-bluesscale' },
        { figure: 'E minor pentatonic at the 12th' },
        { card: 'sc3', note: 'The blues box at the 12th with the ♭5 let through. Slide the ♭5 into the 5th rather than landing on it.' },
        { card: 'l-horror', note: 'The ♭2 leaned on against the root for a beat and left; the ♭5 slid through; the tremolo on the held note. Menace, not mistakes: the note is left before it sounds like one.' },
        { card: 'm-eighths' },
        { card: 'st5' },
        { faults: ['The muted eighths and the gallop', 'The ♭2 and the ♭5'] },
        { players: 'The precursors' },
        { players: 'The first wave' },
        { songs: ['Rumble', 'Songs the Lord Taught Us', 'In Heaven'] },
        { check: ['Muted downstroke eighths'] },
      ] },
    { id: 'wreck', title: 'The wrecking pace and the surf',
      tagline: 'The second wave\'s downstrokes and gallops at two hundred with the drag-triplet slaps under them, and the tremolo picking and the bar the Reverend put beside them.',
      goal: 'the gallops hold at 200 and the tremolo is a pulse, not a stutter.',
      pieces: [
        { read: 'p-waves' },
        { card: 'x10', note: 'The downstroke lands on the bass note, the slap\'s clicks come after it: play on the note, not the click, and stay ahead of the beat if anything.' },
        { card: 'c-wreck' },
        { card: 'r-gallop' },
        { card: 'l-twelve' },
        { card: 'm-gallop' },
        { card: 'st6' },
        { figure: 'The surf colour on E' },
        { card: 'x9', note: 'Tremolo picking from the wrist, not the elbow, the pick shallow: an even pulse for a bar at a steady volume. From the elbow it tires and slows; too deep and it catches.' },
        { card: 'r-trem' },
        { card: 'l-surf' },
        { card: 'm-trem' },
        { card: 'st7' },
        { faults: ['Tremolo picking', 'Playing with the slap'] },
        { players: 'The second wave' },
        { songs: ['In Sickness', 'Psychobilly Freakout', 'Prisoner of Society'] },
        { check: ['A bar of tremolo picking'] },
      ] },
    { id: 'horror', title: 'The horror minor',
      tagline: 'The third wave\'s minor keys: Duane Eddy\'s twang on the low strings with the echo, the harmonic minor\'s 7th over the V, the diminished chord, the dips — and how this page was made.',
      goal: 'you can play any study on this page through twice with the band.',
      pieces: [
        { read: 'p-horrorminor' },
        { grips: 'The diminished 7th', title: 'The diminished 7th: the horror chord' },
        { figure: 'E natural minor at the nut' },
        { card: 'sc6', note: 'E natural minor at the nut, and over the B7 the D♯ — the harmonic minor\'s 7th — pulling up to E.' },
        { card: 'c-horror' },
        { card: 'r-twang', note: 'The line on the low strings, clean, into the echo; the 5th shaken; the 7th over the V. Let the echo do the work: play less than you think.' },
        { card: 'r-arps' },
        { card: 'l-minor' },
        { card: 'm-twang' },
        { card: 'st8' },
        { players: 'The third wave' },
        { songs: ['Curse of the Coffin', 'Tiger Army', 'Rev and Whole New Life'] },
        { check: ['The twang line', 'Any study on this page'] },
        { read: 'p-made1' },
        { read: 'p-made2', title: 'How the parts were written' },
        { sources: true },
      ] },
  ];
  const course = GT.course.create({ dive, prefix: 'psychobilly', name: 'Psychobilly', lessons: LESSONS,
    title: 'Learn psychobilly in eight lessons',
    blurb: 'The same page, one piece at a time: the rockabilly under it in the first two lessons, the swing side and the strut, the train, then the stomp, the wrecking pace and the surf, and the horror minor — every paragraph, grip, figure, card, record and check on the page, in the order the Start-here list gives, your place kept.' });
  if (course) course.init();

  GT.psychobillyGuide = { CHANGES, DRILLS, RHYTHM, LEAD, MIXED, EXERCISES, STUDIES, SONGS, SOURCES, PLAYERS, LESSONS, GRIPS: GRIP_GROUPS, course, jamLink: dive.jamLink, drillsLink: dive.drillsLink, openLink: dive.openLink, realiseExample: dive.realiseExample };
})();
