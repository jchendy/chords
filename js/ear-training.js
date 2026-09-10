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
  const { STRING_TUNING, STRING_MIDI, pentaBoxPlacements, scaleBoxPlacements } = GT.fretboard;

  const $ = id => document.getElementById(id);
  const modeGroup = $('earModeGroup');
  const chordRow = $('earChordRow'), scaleRow = $('earScaleRow'), octaveRow = $('earOctaveRow');
  const input = $('earInput'), errorEl = $('earError');
  const keySelect = $('earKey'), scaleSelect = $('earScale'), octaveGroup = $('earOctaveGroup');
  const shapeEl = $('earShape'), shapeRow = $('earShapeRow'), shapePick = $('earShapePick');
  const octaveStep = $('earOctaveStep');
  const sheet = $('earShapeSheet'), scrim = $('earScrim'), choicesEl = $('earShapeChoices');
  const quizEl = $('earQuiz'), answersEl = $('earAnswers'), verdictEl = $('earVerdict');
  const rootFirst = $('earRootFirst');
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

  let mode = 'chord';            // 'chord' | 'penta' | 'scale'
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
  let right = 0, tries = 0;      // this session's score

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

  // ---- drawing ------------------------------------------------------------
  // A chord shape is drawn as a chord diagram, because that's how a chord is
  // written down. A box is drawn across the whole neck, because that's where
  // it lives and half of learning one is knowing where it sits. Both carry
  // the same clickable notes.
  function drawSubject(s){
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

  function neckSVG(s){
    const inPlay = new Set(s.cells.map(c => `${c.string}:${c.fret}`));
    // Every note of the box is drawn, and every one says which degree it is —
    // reading the shape is half of what a box is for. The ones outside the
    // octave in play are drawn quiet, the way the practice tab draws a
    // passing note, so you can see the whole shape and see which part of it
    // you're being asked about. Their degrees come from the pitch class
    // rather than from the notes in play, which on a partial octave don't
    // cover every one.
    const markers = s.shown.map(c => {
      const playing = inPlay.has(`${c.string}:${c.fret}`);
      return {
        string: c.string, fret: c.fret,
        label: SCALE_DEGREES[(pcOf(c) - s.rootPc + 12) % 12] || '',
        color: '#bfb7a8',
        passing: !playing,
        isRoot: playing && pcOf(c) === s.rootPc,
      };
    });
    // the click targets go over the drawing, one per note, in the same groups
    // a chord diagram uses so they light and sound the same way
    const hits = s.shown.map(c => {
      const x = GT.neck.fretX(c.fret), y = GT.neck.stringY(c.string);
      return `<g class="note-hit" data-string="${c.string}" data-fret="${c.fret}">`
        + `<circle class="note-ring" cx="${x}" cy="${y}" r="10.5"/>`
        + `<circle class="note-tap" cx="${x}" cy="${y}" r="10.5"/></g>`;
    }).join('');
    return `<svg viewBox="${GT.neck.viewBox}" role="img" aria-label="${s.label}, ${s.shapeName}">`
      + GT.neck.buildSVG(markers, []) + hits + '</svg>';
  }

  function render(){
    subject = describe(shapeIdx);
    if (!subject){
      shapeEl.innerHTML = '<p class="diagram-empty">Nothing playable here within a comfortable stretch.</p>';
      shapeRow.hidden = true;
      quizEl.hidden = true;
      return;
    }
    shapeRow.hidden = shapes.length < 2;
    // which of the five it is, not just where it is in the list: the CAGED
    // letter is how a player knows a box, and "3 of 6" says nothing about it
    shapePick.textContent = (subject.shapeName ? `${subject.shapeName} · ` : '')
      + `${shapeIdx + 1} of ${shapes.length}`;
    octaveStep.hidden = wholeShape || subject.octaves < 2;
    $('earOctaveDown').disabled = octaveIdx <= 0;
    $('earOctaveUp').disabled = octaveIdx >= subject.octaves - 1;
    shapeEl.className = 'ear-shape' + (mode === 'chord' ? '' : ' ear-shape-neck');
    shapeEl.innerHTML = drawSubject(subject);

    // The root as this shape plays it, lowest first: it's the note everything
    // else is heard against, so it's worth a button of its own. A rootless
    // chord voicing hasn't got one, and there the button goes rather than
    // sounding a root the shape doesn't contain.
    const root = subject.notes.find(n => n.interval === 0);
    rootCell = root ? root.cells.slice().sort((a, b) => b.string - a.string)[0] : null;
    $('earPlayRoot').hidden = !rootCell;
    rootFirst.parentElement.hidden = !rootCell;
    $('earPlayChord').textContent = mode === 'chord' ? 'Play the chord' : 'Play the scale';
    $('earPlayArp').hidden = mode !== 'chord';
    $('earQuizTitle').textContent = mode === 'chord'
      ? 'Which note of the chord is this?' : 'Which note of the scale is this?';

    answersEl.innerHTML = subject.notes.map(n =>
      `<button type="button" class="ear-answer" data-pc="${n.pc}">`
      + `<span class="ear-answer-name">${n.name}</span>`
      + `<span class="ear-answer-degree">${n.degree}</span></button>`).join('');
    ask();
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
    scaleRow.hidden = mode === 'chord';
    octaveRow.hidden = mode === 'chord';
    if (mode === 'chord') return;
    const pool = mode === 'penta' ? PENTAS : SCALES;
    if (!pool.some(s => s.id === scaleId)) scaleId = pool[0].id;
    scaleSelect.innerHTML = pool.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    scaleSelect.value = scaleId;
  }

  function setMode(next){
    if (next === mode) return;
    mode = next;
    syncMode();
    if (mode === 'chord'){
      if (chord) loadChord(chord.label);
      else randomSubject();
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
    tries++;
    if (won) right++;
    scoreEl.textContent = `${right} of ${tries} · ${Math.round(right / tries * 100)}%`;
  }

  // A note to find. Never the one just answered: hearing the same note twice
  // running teaches nothing, and it reads as though the drill has stalled.
  function ask(){
    clearTimeout(nextRound);
    nextRound = null;
    missed = false;
    answersEl.querySelectorAll('.ear-answer').forEach(b => b.classList.remove('right', 'wrong'));
    say('', '');
    const notes = subject ? subject.notes : [];
    // two notes is the fewest that can be told apart; below that there's no
    // question to ask
    quizEl.hidden = notes.length < 2;
    if (quizEl.hidden){ asked = askedCell = null; return; }
    const pool = asked ? notes.filter(n => n.pc !== asked.pc) : notes;
    asked = pick(pool.length ? pool : notes);
    // When the root is the answer and the root has already sounded as the
    // reference, ask it an octave up rather than at the very pitch just
    // played: the same note twice is no question at all, where root against
    // its own octave is one worth being able to hear.
    const spare = asked.cells.filter(c => c !== rootCell);
    askedCell = pick(rootFirst.checked && spare.length ? spare : asked.cells);
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
  function playAsked(){
    if (!askedCell) return;
    if (rootFirst.checked && rootCell){
      let first = true;
      GT.chordFinder.playRun([rootCell, askedCell], ROOT_GAP,
        c => { if (first){ lightUp(c); first = false; } });
    } else {
      GT.chordFinder.playOne(askedCell.string, askedCell.fret);
    }
  }

  function answer(btn){
    if (!asked || nextRound) return;         // the round is won; the next one is coming
    if (Number(btn.dataset.pc) !== asked.pc){
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 700);
      say('Not that one — listen again', '');
      missed = true;
      return;
    }
    btn.classList.add('right');
    scored(!missed);
    // now it can light: the round is over, and where the note was is the
    // thing worth taking away from it
    lightUp(askedCell);
    say(`Yes — ${asked.name} · ${asked.degree}`, 'good');
    // the next note plays itself, so the drill keeps going without a button
    // press between every question
    nextRound = setTimeout(() => { nextRound = null; ask(); playAsked(); }, 1300);
  }

  GT.earTraining = {
    init(){
      // The picture plays like the finder's diagrams, from the finder's own
      // code: a note on its own wherever it's drawn, and — for a chord shape,
      // which is the only one of the three that is a chord — the whole thing
      // three ways over when you click past the notes.
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

      $('earPlayNote').addEventListener('click', playAsked);
      $('earPlayRoot').addEventListener('click', () => {
        if (rootCell) GT.chordFinder.playOne(rootCell.string, rootCell.fret, lightUp);
      });
      // the chord struck, or the scale run up — the plain version of either;
      // the diagram is there for the long one
      $('earPlayChord').addEventListener('click', () => {
        if (!subject) return;
        if (mode === 'chord') GT.chordFinder.strum(subject.cells, 0.018, lightUp);
        else GT.chordFinder.playRun(upTheBox(subject.cells), 0.19, lightUp);
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
    refresh(){ if (!subject) randomSubject(); },
    // leaving the tab shouldn't leave a question about to answer itself, or a
    // sheet open over a page you can't see
    stop(){ clearTimeout(nextRound); nextRound = null; openSheet(false); },
    // the chord finder handing over one of its shapes
    show(name, v){
      GT.tabs.goTo('ear');
      loadChord(name, { voicing: v });
    },
    // exposed for the tests, which have no page to click
    notesOf, oneOctave, octavesOf, fullestOctave, SCALES, PENTAS, SCALE_DEGREES,
  };
})();
