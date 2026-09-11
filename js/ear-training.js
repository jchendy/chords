// Ear training tab: something on the neck, and a drill over the notes in it.
//
// Three things can be on the neck — a chord shape, a pentatonic box or a
// scale box — and the drill is the same for all three: it sounds one of the
// notes you can see, and you say which one it was. That's why everything
// below the picture is shared; only the picture, the notes it holds and the
// words for them differ.
//
// A note sounds where it actually sits rather than at some neutral octave: a
// 3rd on the top string and a 3rd buried in the middle are different things
// to hear, and telling them apart is the point.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { parseChordName, pick, SEMITONE } = GT.theory;
  const { STRING_TUNING, STRING_MIDI, pentaBoxPlacements, scaleBoxPlacements,
          boxColouredNotes, gripOutlines } = GT.fretboard;

  const $ = id => document.getElementById(id);
  const modeGroup = $('earModeGroup');
  const chordRow = $('earChordRow'), scaleRow = $('earScaleRow'), octaveRow = $('earOctaveRow');
  const input = $('earInput'), errorEl = $('earError');
  const keySelect = $('earKey'), scaleSelect = $('earScale'), octaveGroup = $('earOctaveGroup');
  const shapeEl = $('earShape'), shapeRow = $('earShapeRow'), shapePick = $('earShapePick');
  const backBtn = $('earBack');
  const setupEl = $('earSetup'), goEl = $('earGo'), briefEl = $('earBrief');
  const runBar = $('earRunBar'), runWhat = $('earRunWhat'), runDots = $('earRunDots');
  const resultEl = $('earResult'), resultScore = $('earResultScore'), resultDetail = $('earResultDetail');
  const qualityRow = $('earQualityRow'), qualityGroup = $('earQualityGroup');
  const octaveStep = $('earOctaveStep');
  const sheet = $('earShapeSheet'), scrim = $('earScrim'), choicesEl = $('earShapeChoices');
  const quizEl = $('earQuiz'), answersEl = $('earAnswers'), verdictEl = $('earVerdict');
  const rootFirst = $('earRootFirst');

  // HOW AN ANSWER IS GIVEN. A note drill is answered by pointing at the dot
  // on the neck, because where a note is is what the answer is made of.
  // Pointing is exact by nature — you can't point vaguely at a C — so a
  // shape's three Gs are three different answers, and picking the wrong one
  // is a miss of its own kind rather than a wrong note.
  //
  // The quality drill is the exception, and not by omission: "what kind of
  // chord is this" has no place on the neck to point at, so it keeps buttons.
  const pointing = () => !!subject && subject.kind !== 'quality';
  const scoreEl = $('earScore');

  // The chords worth drilling: the everyday triads and sevenths, and the
  // colours you meet soon after. Not every formula the finder knows — picking
  // the flat 9th out of a 7♭9 is nobody's first ear-training exercise.
  const TYPES = ['', 'm', '7', 'maj7', 'm7', '6', 'm6', 'sus2', 'sus4', 'add9', '9', 'm7b5', 'dim7'];
  const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // The seven modes, by the intervals that define them — which is also how
  // fretboard.js keys the boxes it draws, so asking for a scale here and
  // getting its shapes there is one lookup and no translating. The two
  // pentatonics aren't modes and have boxes of their own.
  const SCALES = [
    { id: 'major',      name: 'Major',           ivs: [0, 2, 4, 5, 7, 9, 11], minor: false },
    { id: 'dorian',     name: 'Dorian',          ivs: [0, 2, 3, 5, 7, 9, 10], minor: true },
    { id: 'phrygian',   name: 'Phrygian',        ivs: [0, 1, 3, 5, 7, 8, 10], minor: true },
    { id: 'lydian',     name: 'Lydian',          ivs: [0, 2, 4, 6, 7, 9, 11], minor: false },
    { id: 'mixolydian', name: 'Mixolydian',      ivs: [0, 2, 4, 5, 7, 9, 10], minor: false },
    { id: 'minor',      name: 'Minor (Aeolian)', ivs: [0, 2, 3, 5, 7, 8, 10], minor: true },
    { id: 'locrian',    name: 'Locrian',         ivs: [0, 1, 3, 5, 6, 8, 10], minor: true },
  ];
  const PENTAS = [
    { id: 'majorpenta', name: 'Major pentatonic', ivs: [0, 2, 4, 7, 9],  minor: false },
    { id: 'minorpenta', name: 'Minor pentatonic', ivs: [0, 3, 5, 7, 10], minor: true },
  ];

  // A scale's degrees are counted from 1, where a chord's are counted from
  // its root: the 2nd of a scale is a 2, not the 9th it would be over a chord.
  const SCALE_DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];

  // What the quality drill can ask. The five on by default are the ones you
  // have to be able to tell apart before any of the others are worth trying;
  // the rest are there to be switched on as they become worth it. `id` is the
  // suffix as the chord finder parses it, so a quality is a chord name away
  // from being a shape.
  const QUALITIES = [
    { id: '',     name: 'Major', on: true },
    { id: 'm',    name: 'Minor', on: true },
    { id: 'maj7', name: 'maj7',  on: true },
    { id: 'm7',   name: 'm7',    on: true },
    { id: '7',    name: '7',     on: true },
    { id: '6',    name: '6' },
    { id: 'm6',   name: 'm6' },
    { id: 'sus2', name: 'sus2' },
    { id: 'sus4', name: 'sus4' },
    { id: 'dim',  name: 'dim' },
    { id: 'aug',  name: 'aug' },
    { id: 'm7b5', name: 'm7♭5' },
    { id: 'dim7', name: 'dim7' },
    { id: 'add9', name: 'add9' },
    { id: '9',    name: '9' },
    { id: 'm9',   name: 'm9' },
    { id: 'maj9', name: 'maj9' },
    { id: '13',   name: '13' },
    { id: '69',   name: '6/9' },
  ];
  const allowedQualities = new Set(QUALITIES.filter(q => q.on).map(q => q.id));

  let mode = 'chord';            // 'chord' | 'quality' | 'penta' | 'scale'
  let quiz = null;               // in quality mode: the chord you're placing
  let chord = null;              // in chord mode: what parseChordName gave back
  let keyName = 'C';             // in the other two: the root, spelled
  let scaleId = 'minorpenta';
  let wholeShape = false;        // one octave of the box, or all of it
  let octaveIdx = 0;             // ...and which octave, when it's one of them
  let shapes = [];               // voicings, or box placements
  let shapeIdx = 0;
  let subject = null;            // what's on show: cells, root, notes, names
  let asked = null, askedCell = null, rootCell = null;
  let missed = false;            // has this question been got wrong already?
  let nextRound = null;          // the pause between a right answer and the next note
  let right = 0, tries = 0;      // the running tally, while practising

  // Setting up an exercise and doing one are different jobs, and the tab is
  // in one state or the other. A run is ten questions with a result at the
  // end — something you can finish, and therefore something you can do well
  // or badly at, which an endless tally never was. Practice keeps the endless
  // version, because sometimes you do just want to noodle.
  const RUN_LENGTH = 10;
  let phase = 'ready';           // 'ready' | 'running' | 'done'
  let runLength = RUN_LENGTH;    // 0 while practising
  let runAsked = 0, runRight = 0;
  let runMarks = [];             // true/false per question answered
  let runMisses = new Map();     // what was got wrong, and how often

  const grip = cells => {
    const at = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => at.has(s) ? at.get(s) : 'x').join('-');
  };
  const midiOf = c => STRING_MIDI[c.string] + c.fret;
  const pcOf = c => (STRING_TUNING[c.string] + c.fret) % 12;
  const scaleById = id => SCALES.concat(PENTAS).find(s => s.id === id) || PENTAS[1];

  // ---- the notes of what's on show, as the quiz offers them ---------------
  // One answer per note, not per string: a shape with its root on two strings
  // is still one answer, and offering it twice would make the row a lie.
  //
  // The row reads the way the thing is spelled — for a chord: root, 3rd, 5th,
  // 7th, then whatever sits above the octave, rather than by raw distance
  // from the root, which would file a C9's 9th between the root and the 3rd
  // because a D is two semitones up. A scale is already in that order.
  const aboveTheOctave = degree => /^(9|11|13)$/.test(degree);

  function notesOf(cells, rootPc, formula, rootName, scaleFlavoured){
    const { degreeNameFor, noteNameFor } = GT.chordFinder;
    const byPc = new Map();
    cells.forEach(c => {
      const pc = pcOf(c);
      if (!byPc.has(pc)) byPc.set(pc, { pc, interval: (pc - rootPc + 12) % 12, cells: [] });
      byPc.get(pc).cells.push(c);
    });
    return [...byPc.values()]
      .map(n => {
        const degree = scaleFlavoured ? SCALE_DEGREES[n.interval] : degreeNameFor(n.interval, formula);
        return Object.assign({}, n, { degree, name: noteNameFor(n.pc, degree, rootName) });
      })
      .sort((a, b) => (a.interval + (aboveTheOctave(a.degree) ? 12 : 0))
                    - (b.interval + (aboveTheOctave(b.degree) ? 12 : 0)));
  }

  // The octaves a box holds: one from each of its roots up to the next. An
  // octave is the span a player runs while they're learning a shape, and
  // eight notes at a time is a fairer drill than eighteen spread over five
  // frets and three octaves. A box with no root in it at all — the partial
  // ones at either end of the neck can be like that — holds no octave, and
  // the whole thing is played instead.
  function octavesOf(cells, rootPc){
    const roots = cells.filter(c => pcOf(c) === rootPc).sort((a, b) => midiOf(a) - midiOf(b));
    const octs = roots.map(r => {
      const low = midiOf(r);
      return cells.filter(c => midiOf(c) >= low && midiOf(c) <= low + 12);
    });
    // ...and the tail below the lowest root, which every octave above reaches
    // past. Built downward to a root rather than up from one, it's the only
    // way those notes are ever in play: a box that starts on the 6th and 7th
    // of the scale would otherwise never ask about them, while the partial
    // octave at the *top* of the same box has been reachable all along.
    if (roots.length){
      const top = midiOf(roots[0]);
      const below = cells.filter(c => midiOf(c) >= top - 12 && midiOf(c) <= top);
      if (below.some(c => midiOf(c) < top)) octs.unshift(below);
    }
    return octs.filter(oct => oct.length > 2);
  }

  // Which one to start on. The lowest is the obvious answer and usually the
  // right one, but not always: a box clipped by the nut can have its lowest
  // root so high that the octave above it runs off the top of the shape,
  // while the octave above the next root is whole. So take the one holding
  // the most of the scale, and where two hold as many, the one that begins on
  // a root — the tail below the lowest root is somewhere to step to, not
  // somewhere to start. Three boxes in 582 turn on the first rule; A major
  // pentatonic's A box has three of its five notes above the lowest root and
  // all five above the next.
  function fullestOctave(octs, rootPc){
    const held = oct => new Set(oct.map(pcOf)).size;
    const fromRoot = oct => pcOf(oct.reduce((a, b) => (midiOf(b) < midiOf(a) ? b : a))) === rootPc;
    let best = 0;
    octs.forEach((oct, i) => {
      const by = held(oct) - held(octs[best]);
      if (by > 0 || (by === 0 && fromRoot(oct) && !fromRoot(octs[best]))) best = i;
    });
    return best;
  }

  // what the drill and the tests ask for: one octave, the fullest one
  function oneOctave(cells, rootPc){
    const octs = octavesOf(cells, rootPc);
    return octs.length ? octs[fullestOctave(octs, rootPc)] : cells;
  }

  // a run up a box is played string by string, low to high, and up each
  // string as you cross it — which is also the order strum() sounds cells in
  const upTheBox = cells => cells.slice().sort((a, b) => b.string - a.string || a.fret - b.fret);

  // ---- a chord to place by ear --------------------------------------------
  // Root, quality and shape all rolled: the root is shown, the quality is the
  // question, and the shape is rolled too so the same quality doesn't arrive
  // sounding identical every time — voicing is part of what you have to hear
  // past.
  function rollQuality(){
    const pool = QUALITIES.filter(q => allowedQualities.has(q.id));
    let parsed = null, quality = null, voicing = null;
    for (let tries = 0; tries < 12 && !voicing; tries++){
      quality = pick(pool);
      parsed = parseChordName(pick(ROOTS) + quality.id);
      if (!parsed) continue;
      const shapes = GT.chordFinder.findChordVoicings(parsed.rootPc, parsed.formula)
        .filter(v => v.cells.some(c => pcOf(c) === parsed.rootPc));   // the root has to be in it to be shown
      if (shapes.length) voicing = shapes[Math.floor(Math.random() * Math.min(6, shapes.length))];
    }
    if (!voicing) return;
    // the lowest root of the shape: the one note the drill gives you
    const rootCell = voicing.cells.filter(c => pcOf(c) === parsed.rootPc)
      .sort((a, b) => b.string - a.string)[0];
    // "Eb major" rather than the bare "Eb" a major chord is written as: the
    // verdict is naming the thing you were asked to hear, and the answer you
    // pressed said Major.
    quiz = { parsed, quality, voicing, rootCell,
             label: parsed.rootName + (parsed.formula.name || ' major') };
  }

  // ---- what's on show -----------------------------------------------------
  function rebuild(){
    if (mode === 'chord'){
      shapes = chord
        ? GT.chordFinder.findChordVoicings(chord.rootPc, chord.formula, { bassPc: chord.bassPc })
        : [];
      return;
    }
    const scale = scaleById(scaleId);
    const rootPc = SEMITONE[keyName] % 12;
    const placements = mode === 'penta'
      ? pentaBoxPlacements(rootPc, scale.minor)
      : scaleBoxPlacements(rootPc, scale.minor, scale.ivs.map(i => (rootPc + i) % 12));
    // Every box the neck can hold, including the stubs hanging off either
    // end. A stub isn't a box anyone practises, so keep the ones that are
    // nearly whole — measured against the fullest, since a five-note
    // pentatonic box and a seven-note scale box aren't the same size.
    const fullest = Math.max(...placements.map(p => p.cells.length), 0);
    shapes = placements.filter(p => p.cells.length >= fullest - 2)
      .sort((a, b) => Math.min(...a.cells.map(c => c.fret)) - Math.min(...b.cells.map(c => c.fret)));
  }

  // The thing being drilled, whichever of the three it is. Everything past
  // this point works from what it returns and never asks which mode is on.
  function describe(i){
    if (mode === 'quality'){
      if (!quiz) return null;
      return {
        kind: 'quality',
        label: quiz.label,
        cells: quiz.voicing.cells,          // what sounds
        shown: [quiz.rootCell],             // ...and all you get to see of it
        rootPc: quiz.parsed.rootPc,
        rootName: quiz.parsed.rootName,
        notes: [],
        choices: QUALITIES.filter(q => allowedQualities.has(q.id))
          .map(q => ({ key: q.id, name: q.name, degree: '' })),
        answer: quiz.quality.id,
        shapeName: '',
        tip: 'The root is all you get to see — the rest is the question',
      };
    }
    const shape = shapes[i];
    if (!shape) return null;
    if (mode === 'chord'){
      return {
        shape,
        label: chord.label,
        cells: shape.cells,
        shown: shape.cells,
        octaves: 0,
        rootPc: chord.rootPc,
        rootName: chord.rootName,
        notes: notesOf(shape.cells, chord.rootPc, chord.formula, chord.rootName, false),
        shapeName: shape.caged ? `${shape.caged} shape` : '',
        tip: GT.chordFinder.voicingTip(shape),
      };
    }
    const scale = scaleById(scaleId);
    const rootPc = SEMITONE[keyName] % 12;
    const octs = octavesOf(shape.cells, rootPc);
    // The whole box is always drawn — a box is a shape you're learning the
    // look of, and cutting five frets out of the picture to show one octave
    // would teach the wrong thing. Only what's in play narrows.
    const cells = (wholeShape || !octs.length) ? shape.cells
      : octs[Math.min(octaveIdx, octs.length - 1)];
    const frets = shape.cells.map(c => c.fret);
    return {
      shape,
      label: `${keyName} ${scale.name.toLowerCase()}`,
      cells,
      shown: shape.cells,
      octaves: octs.length,
      rootPc,
      rootName: keyName,
      notes: notesOf(cells, rootPc, null, keyName, true),
      shapeName: `${shape.name} shape`,
      tip: `${shape.name} shape, frets ${Math.min(...frets)}–${Math.max(...frets)}`,
    };
  }

  // The buttons the drill offers. A note mode answers with the notes of what's
  // on the neck; the quality mode answers with the qualities you've switched
  // on. Same shape of thing either way, so the drill below never asks which.
  // Where a note is, said in the shortest way that tells it from its twins:
  // the octave it's in, and the string as well when two of them are the same
  // pitch played in two places. Sorted low to high, so the buttons read the
  // way the neck does rather than by which came first out of the map.
  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
  const octaveOf = c => Math.floor(midiOf(c) / 12) - 1;

  function placeOf(cell, siblings){
    const octave = octaveOf(cell);
    const sameOctave = siblings.filter(c => octaveOf(c) === octave);
    return sameOctave.length > 1
      ? `${octave} · ${STRING_NAMES[cell.string]} string`
      : String(octave);
  }

  const choicesOf = s => {
    if (s.choices) return s.choices;                       // the quality drill answers with qualities
    // One answer per place the note is played, rather than one per note:
    // the same note in two octaves is two answers.
    const all = s.notes.reduce((cells, n) => cells.concat(n.cells), []);
    return s.notes
      .reduce((out, n) => out.concat(n.cells.map(cell => ({
        key: `${cell.string}:${cell.fret}`, name: n.name, degree: n.degree, note: n, cell,
        where: placeOf(cell, all.filter(c => pcOf(c) === n.pc)),
        says: `${n.name}${octaveOf(cell)} · ${n.degree}`,
      }))), [])
      .sort((a, b) => midiOf(a.cell) - midiOf(b.cell));
  };

  // ---- drawing ------------------------------------------------------------
  // A chord shape is drawn as a chord diagram, because that's how a chord is
  // written down. A box is drawn across the whole neck, because that's where
  // it lives and half of learning one is knowing where it sits. Both carry
  // the same clickable notes.
  function drawSubject(s){
    if (s.kind === 'quality'){
      return `<div class="fret-scroll">${rootOnlySVG(s)}</div>`;
    }
    if (mode === 'chord'){
      return `
        <div class="diagram-card" role="button" tabindex="0" data-voicing="0"
             aria-label="Play ${s.label}" title="${s.tip}">
          ${GT.chordFinder.buildDiagramSVG(s.cells, s.rootPc, s.shape.fingering, 'fingers', chord.formula, s.rootName)}
          <p class="diagram-caption">${s.label}${s.shapeName ? `<span class="diagram-shape">${s.shapeName}</span>` : ''}</p>
        </div>`;
    }
    return `<div class="fret-scroll">${neckSVG(s)}</div>`;
  }

  // The picture the practice tab draws, from the code the practice tab draws
  // it with: every note coloured by the CAGED box it belongs to, and the chord
  // shape inside that box traced through it. Knowing which chord shape a box
  // sits on is most of what makes a box worth learning, so it's drawn rather
  // than described.
  // The stretch of neck worth drawing: the box, and a fret either side so it
  // doesn't sit against the edge. A box is four or five frets, and drawing it
  // on a 15-fret neck spent three quarters of the width on neck nobody is
  // being asked about — and made every dot a third of the size it could be,
  // which matters when the dot is the thing you tap.
  function boxGeometry(cells){
    const frets = cells.map(c => c.fret).filter(f => f > 0);
    if (!frets.length) return GT.neck.geometry(0, 5);        // all open strings
    const lo = Math.min(...frets), hi = Math.max(...frets);
    // open strings belong to the box as much as anything else, so the nut
    // comes with them
    const from = cells.some(c => c.fret === 0) ? 0 : Math.max(0, lo - 1);
    return GT.neck.geometry(from, hi + 1);
  }

  function neckSVG(s){
    const key = c => `${c.string}:${c.fret}`;
    const inPlay = new Set(s.cells.map(key));
    const inBox = new Set(s.shown.map(key));
    const scalePcs = new Set(s.shown.map(pcOf));
    const degreeFor = pc => SCALE_DEGREES[(pc - s.rootPc + 12) % 12];
    // Every note of the box says which degree it is — reading the shape is
    // half of what a box is for — and the ones outside the octave in play are
    // drawn quiet, so you can see the whole shape and see which part of it
    // you're being asked about. boxColouredNotes draws a pitch class wherever
    // it falls on the neck, which for one box means everywhere the scale
    // reaches; this is the box, so it keeps the box's own cells.
    const markers = boxColouredNotes([s.shape], {
      labelOf: pc => (scalePcs.has(pc) ? degreeFor(pc) : null),
      rootPc: s.rootPc,
    }).filter(m => inBox.has(key(m)))
      .map(m => Object.assign({}, m, { passing: !inPlay.has(key(m)) }));
    // ...and the grips whose every note this box holds, which is the one it's
    // built on. A scale with no perfect 5th — Locrian — has no such grip, and
    // the filter says so without being told.
    const lines = gripOutlines(s.rootPc, scaleById(scaleId).minor)
      .filter(ln => ln.cells.every(c => inBox.has(key(c))));
    const geo = boxGeometry(s.shown);
    return `<svg viewBox="${geo.viewBox}" role="img" aria-label="${s.label}, ${s.shapeName}"`
      + ` style="max-width:${geo.maxWidth}px;min-width:${geo.minWidth}px">`
      + geo.buildSVG(markers, lines) + hitsFor(s.shown, geo) + '</svg>';
  }

  // All you get to see: where the root is, and what it's called. The quality
  // is the question, so nothing else of the chord is drawn.
  function rootOnlySVG(s){
    const c = s.shown[0];
    const markers = [{ string: c.string, fret: c.fret, label: s.rootName,
                       color: '#bfb7a8', isRoot: true }];
    // A lone root wants more neck around it than a box does — where it sits is
    // most of what you're being shown — but not fifteen frets of it.
    const geo = GT.neck.geometry(Math.max(0, c.fret - 3), c.fret + 3);
    return `<svg viewBox="${geo.viewBox}" role="img" aria-label="The root, ${s.rootName}"`
      + ` style="max-width:${geo.maxWidth}px;min-width:${geo.minWidth}px">`
      + geo.buildSVG(markers, []) + hitsFor(s.shown, geo) + '</svg>';
  }

  // the click targets that go over a drawing, one per note, in the same
  // groups a chord diagram uses so they light and sound the same way
  // Drawn in whatever geometry the neck above them was drawn in, or the taps
  // land a fret or two from the dots they belong to.
  function hitsFor(cells, geo = GT.neck){
    return cells.map(c => {
      const x = geo.fretX(c.fret), y = geo.stringY(c.string);
      return `<g class="note-hit" data-string="${c.string}" data-fret="${c.fret}">`
        + `<circle class="note-ring" cx="${x}" cy="${y}" r="10.5"/>`
        + `<circle class="note-tap" cx="${x}" cy="${y}" r="10.5"/></g>`;
    }).join('');
  }

  function render(keep){
    subject = describe(shapeIdx);
    if (!subject){
      shapeEl.innerHTML = '<p class="diagram-empty">Nothing playable here within a comfortable stretch.</p>';
      shapeRow.hidden = true;
      quizEl.hidden = true;
      return;
    }
    shapeRow.hidden = mode === 'quality' || shapes.length < 2;
    // which of the five it is, not just where it is in the list: the CAGED
    // letter is how a player knows a box, and "3 of 6" says nothing about it
    if (!shapeRow.hidden){
      shapePick.textContent = (subject.shapeName ? `${subject.shapeName} · ` : '')
        + `${shapeIdx + 1} of ${shapes.length}`;
    }
    octaveStep.hidden = wholeShape || subject.octaves < 2;
    $('earOctaveDown').disabled = octaveIdx <= 0;
    $('earOctaveUp').disabled = octaveIdx >= subject.octaves - 1;
    shapeEl.className = 'ear-shape' + (mode === 'chord' ? '' : ' ear-shape-neck');
    shapeEl.innerHTML = drawSubject(subject);

    // The root as this shape plays it, lowest first: it's the note everything
    // else is heard against, so it's worth a button of its own. A rootless
    // chord voicing hasn't got one, and there the button goes rather than
    // sounding a root the shape doesn't contain.
    const root = subject.kind === 'quality'
      ? { cells: subject.shown }
      : subject.notes.find(n => n.interval === 0);
    rootCell = root ? root.cells.slice().sort((a, b) => b.string - a.string)[0] : null;
    $('earPlayRoot').hidden = !rootCell;
    // sounding the root before the question only means something when the
    // question is a note; a chord already has its root in it
    rootFirst.parentElement.hidden = !rootCell || subject.kind === 'quality';
    $('earPlayNote').hidden = subject.kind === 'quality';
    $('earPlayChord').hidden = false;
    $('earPlayChord').textContent = mode === 'scale' || mode === 'penta'
      ? 'Play the scale' : 'Play the chord';
    $('earPlayArp').hidden = mode === 'scale' || mode === 'penta';
    $('earQuizTitle').textContent = subject.kind === 'quality'
      ? 'What kind of chord is this?'
      : mode === 'chord' ? 'Which note of the chord is this?' : 'Which note of the scale is this?';

    // ...and where the answer is given. Pointing hides the buttons entirely:
    // two ways to answer the same question on screen at once is one too many.
    answersEl.hidden = pointing();
    $('earNeckHint').hidden = !answersEl.hidden;
    answersEl.innerHTML = choicesOf(subject).map(c =>
      `<button type="button" class="ear-answer" data-key="${c.key}">`
      + `<span class="ear-answer-name">${c.name}</span>`
      + (c.degree ? `<span class="ear-answer-degree">${c.degree}</span>` : '')
      + `</button>`).join('');
    if (keep) resetRound();      // the same question, put back as it was
    else ask();
    showPhase();
    scrollToShape();
    writeState();
  }

  // A neck is wider than a phone and what's drawn on it can be anywhere along
  // it — a box at the twelfth fret, or the single root the quality drill
  // shows, which was landing off the right-hand edge of the scroller. Put the
  // middle of what's drawn in the middle of what can be seen.
  function scrollToShape(){
    const scroller = shapeEl.querySelector('.fret-scroll');
    const dots = scroller && scroller.querySelectorAll('.note-dot');
    if (!dots || !dots.length || scroller.scrollWidth <= scroller.clientWidth) return;
    const rects = [...dots].map(d => d.getBoundingClientRect());
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));
    if (right <= left) return;                       // hidden page: nothing measured
    const mid = (left + right) / 2 - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    scroller.scrollLeft = Math.max(0, mid - scroller.clientWidth / 2);
  }

  // ---- choosing what to drill ---------------------------------------------
  function loadChord(name, opts = {}){
    const parsed = parseChordName(name || '');
    if (!parsed){
      errorEl.textContent = `Couldn't recognize "${(name || '').trim()}" as a chord name.`;
      return false;
    }
    errorEl.textContent = '';
    chord = Object.assign({}, parsed, {
      label: parsed.rootName + parsed.formula.name + (parsed.bassName ? '/' + parsed.bassName : ''),
    });
    mode = 'chord';
    syncMode();
    rebuild();
    shapeIdx = 0;
    if (opts.voicing){
      // handed a shape by the chord finder: show that one. Its own search
      // usually holds the same grip, but the finder may have been filtered to
      // something this list doesn't reach — in which case the shape still
      // belongs here, at the front.
      const want = grip(opts.voicing.cells);
      const i = shapes.findIndex(v => grip(v.cells) === want);
      if (i === -1) shapes.unshift(opts.voicing);
      else shapeIdx = i;
    } else if (opts.rollShape && shapes.length > 1){
      shapeIdx = Math.floor(Math.random() * Math.min(5, shapes.length));
    }
    octaveIdx = 0;
    input.value = chord.label;
    asked = null;                       // a new subject asks a fresh question
    render();
    return true;
  }

  function loadScale(opts = {}){
    rebuild();
    shapeIdx = opts.rollShape && shapes.length > 1 ? Math.floor(Math.random() * shapes.length) : 0;
    asked = null;
    resetOctave();
    render();
  }

  // a new box starts on its fullest octave; stepping from there is by hand
  function resetOctave(){
    const shape = shapes[shapeIdx];
    if (mode === 'chord' || !shape){ octaveIdx = 0; return; }
    const rootPc = SEMITONE[keyName] % 12;
    const octs = octavesOf(shape.cells, rootPc);
    octaveIdx = octs.length ? fullestOctave(octs, rootPc) : 0;
  }

  function stepOctave(by){
    const shape = shapes[shapeIdx];
    if (!shape) return;
    const octs = octavesOf(shape.cells, SEMITONE[keyName] % 12);
    const next = octaveIdx + by;
    if (next < 0 || next >= octs.length) return;
    octaveIdx = next;
    asked = null;
    render();
  }

  function randomSubject(){
    if (mode === 'quality' && phase === 'running'){ nextQuestion(); playAsked(); return; }
    if (mode === 'chord'){
      let name;
      do { name = pick(ROOTS) + pick(TYPES); } while (chord && name === chord.label);
      loadChord(name, { rollShape: true });
      return;
    }
    const pool = mode === 'penta' ? PENTAS : SCALES;
    keyName = pick(ROOTS);
    scaleId = pick(pool).id;
    keySelect.value = keyName;
    scaleSelect.value = scaleId;
    loadScale({ rollShape: true });
  }

  // which controls belong to the mode that's on
  function syncMode(){
    modeGroup.querySelectorAll('.seg-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.value === mode));
    chordRow.hidden = mode !== 'chord';
    scaleRow.hidden = mode === 'chord' || mode === 'quality';
    octaveRow.hidden = mode === 'chord' || mode === 'quality';
    qualityRow.hidden = mode !== 'quality';
    if (mode === 'chord' || mode === 'quality') return;
    const pool = mode === 'penta' ? PENTAS : SCALES;
    if (!pool.some(s => s.id === scaleId)) scaleId = pool[0].id;
    scaleSelect.innerHTML = pool.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    scaleSelect.value = scaleId;
  }

  function setMode(next){
    if (next === mode) return;
    mode = next;
    phase = 'ready';
    syncMode();
    if (mode === 'chord'){
      if (chord) loadChord(chord.label);
      else randomSubject();
    } else if (mode === 'quality'){
      rollQuality();
      render();
    } else {
      loadScale({ rollShape: true });
    }
  }

  // ---- picking a shape ----------------------------------------------------
  // Stepping through thirty grips one arrow-press at a time is no way to find
  // the one you want, and the thing that tells them apart is the picture. So
  // the picker is the pictures: every shape at once, the one on show marked,
  // and a click is a choice rather than a sound — in here the drawings aren't
  // instruments, they're the menu.
  function openSheet(on){
    sheet.hidden = !on;
    scrim.hidden = !on;
    shapePick.setAttribute('aria-expanded', String(on));
    if (!on) return;
    $('earSheetTitle').textContent = mode === 'chord' ? 'Every way to play' : 'Every box for';
    $('earSheetChord').textContent = subject ? subject.label : '';
    choicesEl.className = mode === 'chord' ? 'diagram-grid' : 'box-choices';
    choicesEl.innerHTML = shapes.map((shape, i) => {
      const s = describe(i);
      return `
      <div class="diagram-card${i === shapeIdx ? ' current' : ''}" role="button" tabindex="0"
           data-choice="${i}" aria-label="Shape ${i + 1} of ${shapes.length}"
           aria-current="${i === shapeIdx}" title="${s.tip}">
        ${mode === 'chord'
          ? GT.chordFinder.buildDiagramSVG(s.cells, s.rootPc, shape.fingering, 'fingers', chord.formula, s.rootName)
          : `<div class="fret-scroll">${neckSVG(s)}</div>`}
        <p class="diagram-caption">${s.shapeName || '&nbsp;'}<span class="shape-choice-num">${i + 1} of ${shapes.length}</span></p>
      </div>`;
    }).join('');
    // Open at the top, and only scroll if the shape on show is below the fold.
    // Focusing the Done button has to be told not to scroll: it's sticky, so
    // the browser scrolls to where it would sit unstuck, which is not where
    // it is — that alone had the sheet opening a row down.
    $('earSheetClose').focus({ preventScroll: true });
    sheet.scrollTop = 0;
    const current = choicesEl.querySelector('.current');
    if (current && current.offsetTop + current.offsetHeight > sheet.clientHeight){
      current.scrollIntoView({ block: 'center' });
    }
  }

  function choose(i){
    if (!shapes[i]) return;
    shapeIdx = i;
    resetOctave();
    openSheet(false);
    render();
  }

  // the arrows: the same list the sheet shows, one step at a time, for when
  // you want the next box rather than a particular one
  function stepShape(by){
    if (shapes.length < 2) return;
    choose((shapeIdx + by + shapes.length) % shapes.length);
  }

  // ---- the exercise in the address bar ------------------------------------
  // The setup, not the question: which drill, and what it's drilling. Pinning
  // the note being asked would make a bookmark a single question rather than
  // an exercise, and there's a Random button for wanting another one anyway.
  function writeState(){
    const p = new URLSearchParams();
    p.set('m', mode);
    if (mode === 'chord'){
      if (!chord) return;
      p.set('c', chord.label);
      if (shapeIdx) p.set('i', shapeIdx);
    } else if (mode === 'quality'){
      p.set('q', QUALITIES.filter(q => allowedQualities.has(q.id)).map(q => q.id || 'maj').join('.'));
    } else {
      p.set('k', keyName);
      p.set('s', scaleId);
      if (shapeIdx) p.set('i', shapeIdx);
      if (wholeShape) p.set('w', '1');
      else if (octaveIdx) p.set('o', octaveIdx);
    }
    if (!rootFirst.checked) p.set('r', '0');
    GT.tabs.setState('ear', p);
  }

  function readState(){
    const p = GT.tabs.stateParams();
    const want = p.get('m');
    if (!['chord', 'quality', 'penta', 'scale'].includes(want)) return false;
    mode = want;
    rootFirst.checked = p.get('r') !== '0';
    syncMode();
    if (mode === 'chord'){
      if (!loadChord(p.get('c') || 'C')) return false;
    } else if (mode === 'quality'){
      // Only when the link actually carries a list. Splitting an absent one
      // gives a single empty string, which is the id of Major — a link with
      // no qualities in it switched every other quality off.
      const ids = (p.get('q') ? p.get('q').split('.') : []).map(id => (id === 'maj' ? '' : id))
        .filter(id => QUALITIES.some(q => q.id === id));
      if (ids.length){
        allowedQualities.clear();
        ids.forEach(id => allowedQualities.add(id));
        qualityGroup.querySelectorAll('.quality-btn')
          .forEach(b => b.classList.toggle('active', allowedQualities.has(b.dataset.value)));
      }
      rollQuality();
      render();
      return true;
    } else {
      if (p.get('k')) keyName = p.get('k');
      if (p.get('s')) scaleId = p.get('s');
      keySelect.value = keyName;
      scaleSelect.value = scaleId;
      wholeShape = p.get('w') === '1';
      octaveGroup.querySelectorAll('.seg-btn').forEach(b =>
        b.classList.toggle('active', (b.dataset.value === 'whole') === wholeShape));
      rebuild();
      shapeIdx = Math.min(Number(p.get('i')) || 0, Math.max(0, shapes.length - 1));
      resetOctave();
      if (!wholeShape && p.get('o')) octaveIdx = Number(p.get('o')) || octaveIdx;
      render();
      return true;
    }
    // a chord drill's shape, once its list exists
    const i = Number(p.get('i')) || 0;
    if (i && i < shapes.length){ shapeIdx = i; render(); }
    return true;
  }

  // ---- the three states ---------------------------------------------------
  // What each drill is for, in a sentence, because the tab used to open
  // mid-exercise with nothing anywhere saying what it wanted from you.
  const BRIEFS = {
    chord: 'One note of the shape sounds; say which note of the chord it was.',
    quality: 'A whole chord sounds and you see only its root; say what kind of chord it was.',
    penta: 'One note of the box sounds; say which note of the pentatonic it was.',
    scale: 'One note of the box sounds; say which note of the scale it was.',
  };

  function showPhase(){
    const running = phase === 'running';
    // The setup is the whole page until you start, a line while you're going,
    // and out of the way while you're reading how it went — the result is
    // what that screen is for, and Change the exercise brings it back.
    setupEl.hidden = phase !== 'ready';
    goEl.hidden = phase !== 'ready';
    runBar.hidden = !running;
    quizEl.hidden = !running || !asked;
    resultEl.hidden = phase !== 'done';
    briefEl.textContent = BRIEFS[mode] || '';
    if (running){
      // What you're drilling, not what's currently sounding: in the quality
      // drill the subject's own label is the chord, answer and all, and the
      // header would have been giving the game away every question.
      runWhat.textContent = mode === 'quality'
        ? `Chord quality · ${allowedQualities.size} kinds`
        : subject ? subject.label + (subject.shapeName ? ` · ${subject.shapeName}` : '') : '';
      drawProgress();
    }
  }

  // A run's shape, drawn as it fills: what you got, what you missed, and how
  // much is left. While practising there's nothing to fill, so the tally
  // stands in its place.
  function drawProgress(){
    if (!runLength){
      runDots.innerHTML = '';
      scoreEl.textContent = tries ? `${right} of ${tries} · ${Math.round(right / tries * 100)}%` : '';
      return;
    }
    runDots.innerHTML = Array.from({ length: runLength }, (_, i) => {
      const cls = i < runMarks.length ? (runMarks[i] ? 'hit' : 'miss') : (i === runMarks.length ? 'now' : '');
      return `<i class="${cls}"></i>`;
    }).join('');
    // The question you're on, which is the one after everything answered —
    // until the last one is answered, when you're still on it and the result
    // is a beat away. Without the clamp the tenth answer reads "11 of 10"
    // for as long as the pause lasts.
    scoreEl.textContent = `${Math.min(runAsked + 1, runLength)} of ${runLength}`;
  }

  function begin(length){
    runLength = length;
    runAsked = 0; runRight = 0; runMarks = []; runMisses = new Map();
    if (!length){ right = 0; tries = 0; }
    phase = 'running';
    render();
    playAsked();
  }

  function finish(){
    phase = 'done';
    const missed = [...runMisses.entries()].sort((a, b) => b[1] - a[1]);
    resultScore.textContent = `${runRight} of ${runLength}`;
    resultDetail.textContent = !missed.length
      ? 'Every one first time.'
      : 'Went wrong on ' + missed.map(([name, n]) => n > 1 ? `${name} (${n}×)` : name).join(', ') + '.';
    showPhase();
  }

  function stopRun(){
    phase = 'ready';
    clearTimeout(nextRound);
    nextRound = null;
    showPhase();
  }

  // ---- what came before ---------------------------------------------------
  // Back puts the last question on again and plays it, for when a chord went
  // past before you'd placed it. A question is remembered as everything it
  // takes to restore it, not just the note asked: the drill moves on to
  // another chord or another box as readily as to another note of the same
  // one, so the thing on the neck is part of the question.
  const HISTORY = 40;
  const history = [];

  function remember(){
    history.push(mode === 'quality'
      ? { mode, quiz }
      : { mode, chord, keyName, scaleId, wholeShape, shapeIdx, octaveIdx, asked, askedCell });
    if (history.length > HISTORY) history.shift();
    backBtn.disabled = history.length < 2;
  }

  function goBack(){
    if (history.length < 2) return;
    history.pop();                                  // the one we're on
    const was = history[history.length - 1];        // ...and the one before it
    mode = was.mode;
    syncMode();
    if (mode === 'quality'){
      quiz = was.quiz;
      render(true);
      const choice = choicesOf(subject).find(c => c.key === subject.answer);
      asked = choice ? Object.assign({}, choice, { says: subject.label }) : null;
      askedCell = null;
    } else {
      chord = was.chord; keyName = was.keyName; scaleId = was.scaleId;
      wholeShape = was.wholeShape;
      keySelect.value = keyName;
      scaleSelect.value = scaleId;
      octaveGroup.querySelectorAll('.seg-btn').forEach(b =>
        b.classList.toggle('active', (b.dataset.value === 'whole') === wholeShape));
      rebuild();
      shapeIdx = Math.min(was.shapeIdx, Math.max(0, shapes.length - 1));
      octaveIdx = was.octaveIdx;
      render(true);
      asked = was.asked;
      askedCell = was.askedCell;
    }
    backBtn.disabled = history.length < 2;
    showPhase();
    playAsked();
  }

  // ---- the drill ----------------------------------------------------------
  function say(text, kind){
    verdictEl.textContent = text;
    verdictEl.className = 'ear-verdict' + (kind ? ' ' + kind : '');
  }

  // A question got right or wrong, not a button pressed: three wrong guesses
  // at one note is one question missed, which is the honest measure of
  // whether you heard it. The score runs for as long as the tab is open —
  // rolling a new chord or box doesn't reset it, since it's the same drill
  // and a run you can't interrupt isn't a run worth keeping.
  function scored(won){
    if (runLength){
      runAsked++;
      runMarks.push(won);
      if (won) runRight++;
      else runMisses.set(asked.name, (runMisses.get(asked.name) || 0) + 1);
    } else {
      tries++;
      if (won) right++;
    }
    drawProgress();
  }

  // A note to find. Never the one just answered: hearing the same note twice
  // running teaches nothing, and it reads as though the drill has stalled.
  // a round starts clean whether the question is new or one being heard again
  function resetRound(){
    clearTimeout(nextRound);
    nextRound = null;
    missed = false;
    answersEl.querySelectorAll('.ear-answer').forEach(b => b.classList.remove('right', 'wrong'));
    say('', '');
  }

  function ask(){
    resetRound();
    // The question is always one of the choices the buttons were built from.
    // Working it out separately is how the two came to disagree about what a
    // key was, and every answer read as wrong.
    const choices = subject ? choicesOf(subject) : [];
    if (subject && subject.kind === 'quality'){
      // the chord was rolled before it was drawn; the question is what it is
      const choice = choices.find(c => c.key === subject.answer);
      asked = choice ? Object.assign({}, choice, { says: subject.label }) : null;
      askedCell = null;
      if (asked) remember();
      return;
    }
    // two notes is the fewest that can be told apart; below that there's no
    // question to ask
    if (choices.length < 2){ asked = askedCell = null; return; }
    let pool = asked ? choices.filter(c => c.key !== asked.key) : choices;
    // When the root has already sounded as the reference, don't then ask for
    // the very note that just played: the same pitch twice is no question at
    // all, where root against its own octave is one worth being able to hear.
    // The answer is a place, so that means not asking about that place.
    if (rootFirst.checked && rootCell){
      const elsewhere = pool.filter(c => c.cell !== rootCell);
      if (elsewhere.length) pool = elsewhere;
    }
    asked = pick(pool.length ? pool : choices);
    askedCell = asked.cell;
    remember();
  }

  // every note that sounds lights where it sits, whether it was pressed or
  // played for you
  const lightUp = c => GT.chordFinder.flashAt(shapeEl, c.string, c.fret);

  // A note on its own is a hard thing to place; heard against the root it's
  // an interval, which is the thing the ear can actually learn. So the drill
  // sounds the root first by default, and the toggle turns that off once you
  // don't want the help.
  //
  // The root plays even when the root *is* the answer. It would be easier to
  // skip it there, and it would also give the game away: a question that
  // played one note instead of two could only ever be the root.
  const ROOT_GAP = 0.75;         // long enough to hear the root land and settle

  // The note being asked never lights. Everything else that sounds does —
  // the root, the chord, the run up the scale — but lighting the question
  // would be answering it. Only the root of the pair gets a light, and it
  // gets one whichever note follows it, so a question where the answer is
  // the root looks like every other question.
  // What happens after a right answer: the next question, or the result if
  // that was the tenth. One path, whether the pause ran it or a test did.
  function advance(sound){
    if (runLength && runAsked >= runLength){ finish(); return; }
    nextQuestion();
    if (sound) playAsked();
  }

  // a fresh question: in the note drills another note of the same shape, in
  // the quality drill another chord altogether
  function nextQuestion(){
    if (mode === 'quality'){ rollQuality(); render(); }
    else ask();
  }

  function playAsked(){
    if (mode === 'quality'){
      if (subject) GT.chordFinder.strum(subject.cells, 0.018, lightUp);
      return;
    }
    if (!askedCell) return;
    if (rootFirst.checked && rootCell){
      let first = true;
      GT.chordFinder.playRun([rootCell, askedCell], ROOT_GAP,
        c => { if (first){ lightUp(c); first = false; } });
    } else {
      GT.chordFinder.playOne(askedCell.string, askedCell.fret);
    }
  }

  // One judgement, whichever surface gave the answer: a button that names a
  // note, or a dot on the neck. `marks` is only the names of the classes each
  // surface wears, since a button and a fret dot say "no" differently.
  function respond(choice, el, marks){
    if (!asked || nextRound) return;         // the round is won; the next one is coming
    if (!choice || String(choice.key) !== String(asked.key)){
      // Told the note but not the place: a different mistake from hearing the
      // wrong note, and the one this drill exists to train, so it's named as
      // such rather than lumped in with a plain miss. It still costs the
      // question — the answer was the other one.
      const nearly = choice && choice.note && asked.note && choice.note.pc === asked.note.pc;
      const mark = nearly ? marks.close : marks.wrong;
      if (el){
        el.classList.add(mark);
        setTimeout(() => el.classList.remove(mark), 700);
      }
      say(nearly ? `That's the ${asked.degree}, but not that one — listen again`
                 : 'Not that one — listen again', '');
      missed = true;
      return;
    }
    if (el) el.classList.add(marks.right);
    scored(!missed);
    // now it can light: the round is over, and where the note was is the
    // thing worth taking away from it
    if (askedCell) lightUp(askedCell);
    say(`Yes — ${asked.says}`, 'good');
    // the next question plays itself, so the drill keeps going without a
    // button press between every one — unless that was the tenth, and there
    // is a result to look at instead
    nextRound = setTimeout(() => { nextRound = null; advance(true); }, 1300);
  }

  const BUTTON_MARKS = { right: 'right', close: 'close', wrong: 'wrong' };
  const DOT_MARKS = { right: 'ear-right', close: 'ear-close', wrong: 'ear-wrong' };

  function answer(btn){
    respond(choicesOf(subject).find(c => String(c.key) === btn.dataset.key), btn, BUTTON_MARKS);
  }

  // Pointing at the neck. The dot answers rather than sounds: clicking round
  // the shape until one matches what you heard is a way to get every question
  // right without hearing anything, which is not the drill. Between questions
  // — and in the phases where there is no question — the dots play as they
  // always did, because then it's a shape to explore rather than a test.
  function answerAt(hit){
    const key = `${hit.dataset.string}:${hit.dataset.fret}`;
    const choice = choicesOf(subject).find(c => String(c.key) === key);
    // A box is drawn whole even when one octave of it is in play, so there
    // are dots on screen that aren't among the answers. Clicking one isn't a
    // wrong answer, it's a misclick: say which part of the shape is being
    // asked about and let the question stand.
    if (!choice){
      hit.classList.add('ear-outside');
      setTimeout(() => hit.classList.remove('ear-outside'), 700);
      say('That one is outside the octave in play', '');
      return;
    }
    respond(choice, hit, DOT_MARKS);
  }

  GT.earTraining = {
    init(){
      // The picture plays like the finder's diagrams, from the finder's own
      // code: a note on its own wherever it's drawn, and — for a chord shape,
      // which is the only one of the three that is a chord — the whole thing
      // three ways over when you click past the notes.
      // Ahead of the finder's own play-on-click, and in the capture phase so
      // it gets there first: while a question is live and the answer is given
      // by pointing, a dot answers instead of sounding.
      shapeEl.addEventListener('click', e => {
        if (!pointing() || !asked || nextRound || phase === 'ready') return;
        const hit = e.target.closest('.note-hit');
        if (!hit) return;
        e.preventDefault();
        e.stopPropagation();
        answerAt(hit);
      }, true);
      GT.chordFinder.soundOnClick(shapeEl,
        () => (mode === 'chord' && shapes[shapeIdx] ? [shapes[shapeIdx]] : []));
      modeGroup.querySelectorAll('.seg-btn').forEach(btn =>
        btn.addEventListener('click', () => setMode(btn.dataset.value)));
      $('earRandom').addEventListener('click', randomSubject);
      $('earShapePrev').addEventListener('click', () => stepShape(-1));
      $('earShapeNext').addEventListener('click', () => stepShape(1));
      $('earOctaveDown').addEventListener('click', () => stepOctave(-1));
      $('earOctaveUp').addEventListener('click', () => stepOctave(1));
      shapePick.addEventListener('click', () => openSheet(sheet.hidden));
      $('earSheetClose').addEventListener('click', () => openSheet(false));
      scrim.addEventListener('click', () => openSheet(false));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') openSheet(false); });
      const pickFrom = e => {
        const card = e.target.closest('.diagram-card');
        if (card) choose(Number(card.dataset.choice));
      };
      choicesEl.addEventListener('click', pickFrom);
      choicesEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pickFrom(e); }
      });

      // Which qualities the drill may ask. At least one has to stay on, so the
      // last one can't be switched off — a drill with nothing to ask is not a
      // state worth being able to reach.
      qualityGroup.innerHTML = QUALITIES.map(q =>
        `<button type="button" class="seg-btn quality-btn${q.on ? ' active' : ''}" data-value="${q.id}">${q.name}</button>`).join('');
      qualityGroup.addEventListener('click', e => {
        const btn = e.target.closest('.quality-btn');
        if (!btn) return;
        const id = btn.dataset.value;
        if (allowedQualities.has(id)){
          if (allowedQualities.size < 2) return;
          allowedQualities.delete(id);
        } else {
          allowedQualities.add(id);
        }
        btn.classList.toggle('active', allowedQualities.has(id));
        // a chord already rolled from a quality you've just switched off is
        // no longer a fair question
        if (mode === 'quality' && (!quiz || !allowedQualities.has(quiz.quality.id))) nextQuestion();
        else if (mode === 'quality') render();
        else writeState();
      });

      keySelect.innerHTML = ROOTS.map(r => `<option value="${r}">${r}</option>`).join('');
      keySelect.value = keyName;
      keySelect.addEventListener('change', () => { keyName = keySelect.value; loadScale(); });
      scaleSelect.addEventListener('change', () => { scaleId = scaleSelect.value; loadScale(); });
      octaveGroup.querySelectorAll('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
        octaveGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
        wholeShape = btn.dataset.value === 'whole';
        asked = null;
        resetOctave();
        render();
      }));

      backBtn.addEventListener('click', goBack);
      $('earStart').addEventListener('click', () => begin(RUN_LENGTH));
      $('earPractice').addEventListener('click', () => begin(0));
      $('earStop').addEventListener('click', stopRun);
      $('earAgain').addEventListener('click', () => begin(runLength || RUN_LENGTH));
      $('earChange').addEventListener('click', stopRun);
      $('earRandomScale').addEventListener('click', randomSubject);
      rootFirst.addEventListener('change', writeState);
      $('earPlayNote').addEventListener('click', playAsked);
      $('earPlayRoot').addEventListener('click', () => {
        if (rootCell) GT.chordFinder.playOne(rootCell.string, rootCell.fret, lightUp);
      });
      // the chord struck, or the scale run up — the plain version of either;
      // the diagram is there for the long one
      $('earPlayChord').addEventListener('click', () => {
        if (!subject) return;
        if (mode === 'scale' || mode === 'penta') GT.chordFinder.playRun(upTheBox(subject.cells), 0.19, lightUp);
        else GT.chordFinder.strum(subject.cells, 0.018, lightUp);
      });
      $('earPlayArp').addEventListener('click', () => {
        if (subject) GT.chordFinder.strum(subject.cells, GT.chordFinder.ARPEGGIO_GAP, lightUp);
      });
      answersEl.addEventListener('click', e => {
        const btn = e.target.closest('.ear-answer');
        if (btn) answer(btn);
      });
      // on Enter or on leaving the field, not on every keystroke: a chord
      // half-typed isn't a chord, and re-rolling the question under you as
      // you type would lose the one you're in the middle of
      input.addEventListener('change', () => loadChord(input.value));
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ loadChord(input.value); input.blur(); }
      });
      syncMode();
    },
    // Arriving with nothing on: roll something rather than showing an empty
    // page. Coming back to a drill already in progress leaves it alone.
    refresh(){
      if (readState()) return;
      if (!subject) randomSubject();
      else { showPhase(); scrollToShape(); }
    },
    QUALITIES,
    // leaving the tab shouldn't leave a question about to answer itself, or a
    // sheet open over a page you can't see
    stop(){ clearTimeout(nextRound); nextRound = null; openSheet(false); },
    // exposed so a link can drop you straight into a run
    begin,
    // ...and so the tests need no patience for the pause between questions
    tick(){ if (nextRound){ clearTimeout(nextRound); nextRound = null; advance(false); } },
    // Which dot the drill is asking about. Nothing on screen says so — that
    // would be the answer — so a test that wants to press a particular wrong
    // dot on purpose has no way to find it. Guessing is what it did before,
    // and a test that has to guess passes and fails by luck.
    askedAt(){ return askedCell ? { string: askedCell.string, fret: askedCell.fret } : null; },
    // the chord finder handing over one of its shapes
    show(name, v){
      GT.tabs.goTo('ear');
      loadChord(name, { voicing: v });
    },
    // exposed for the tests, which have no page to click
    notesOf, oneOctave, octavesOf, fullestOctave, SCALES, PENTAS, SCALE_DEGREES,
  };
})();
