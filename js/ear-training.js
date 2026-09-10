// Ear training tab: one chord shape on the neck, and a drill over the notes
// in it. The shape is the chord finder's own — same search, same diagram,
// same sounds — so what you drill here is what you read there. A note sounds
// where it actually sits in the shape rather than at some neutral octave: a
// 3rd on the top string and a 3rd buried in the middle are different things
// to hear, and telling them apart is the point.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { parseChordName, pick } = GT.theory;
  const { STRING_TUNING } = GT.fretboard;

  const $ = id => document.getElementById(id);
  const input = $('earInput'), errorEl = $('earError');
  const shapeEl = $('earShape'), shapeRow = $('earShapeRow'), shapePick = $('earShapePick');
  const sheet = $('earShapeSheet'), scrim = $('earScrim'), choicesEl = $('earShapeChoices');
  const quizEl = $('earQuiz'), answersEl = $('earAnswers'), verdictEl = $('earVerdict');

  // The chords worth drilling: the everyday triads and sevenths, and the
  // colours you meet soon after. Not every formula the finder knows — picking
  // the ♭9 out of a 7♭9 is nobody's first ear-training exercise.
  const TYPES = ['', 'm', '7', 'maj7', 'm7', '6', 'm6', 'sus2', 'sus4', 'add9', '9', 'm7b5', 'dim7'];
  const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  // A rolled chord starts on a shape near the nut rather than the twelfth
  // fret, but not always the first one — the open shape every time gets old.
  const ROLL_SHAPES = 5;

  let chord = null;          // what parseChordName gave back, plus its written name
  let voicings = [];
  let shapeIdx = 0;
  let notes = [];            // one answer per note of the shape
  let asked = null;          // the note being asked
  let askedCell = null;      // and where on the neck it's sounding from
  let rootCell = null;       // the shape's own root, to hear the rest against
  let nextRound = null;      // the pause between a right answer and the next note

  const voicing = () => voicings[shapeIdx];
  const grip = cells => {
    const at = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => at.has(s) ? at.get(s) : 'x').join('-');
  };

  // ---- the notes of a shape, as the quiz offers them ----------------------
  // One answer per note, not per string: a shape with its root on two strings
  // is still one answer, and offering it twice would make the row a lie.
  //
  // The row reads the way the chord is spelled — root, 3rd, 5th, 7th, then
  // whatever sits above the octave — rather than by raw distance from the
  // root, which would file a C9's 9th between the root and the 3rd because a
  // D is two semitones up. A 2nd that's a 2 (a sus2's) stays where it is.
  const aboveTheOctave = degree => /^(9|11|13)$/.test(degree);

  function notesOf(cells, rootPc, formula, rootName){
    const { degreeNameFor, noteNameFor } = GT.chordFinder;
    const byPc = new Map();
    cells.forEach(c => {
      const pc = (STRING_TUNING[c.string] + c.fret) % 12;
      if (!byPc.has(pc)) byPc.set(pc, { pc, interval: (pc - rootPc + 12) % 12, cells: [] });
      byPc.get(pc).cells.push(c);
    });
    return [...byPc.values()]
      .map(n => {
        const degree = degreeNameFor(n.interval, formula);
        return Object.assign({}, n, { degree, name: noteNameFor(n.pc, degree, rootName) });
      })
      .sort((a, b) => (a.interval + (aboveTheOctave(a.degree) ? 12 : 0))
                    - (b.interval + (aboveTheOctave(b.degree) ? 12 : 0)));
  }

  // ---- the chord on show --------------------------------------------------
  function load(name, opts = {}){
    const parsed = parseChordName(name || '');
    if (!parsed){
      errorEl.textContent = `Couldn't recognize "${(name || '').trim()}" as a chord name.`;
      return false;
    }
    errorEl.textContent = '';
    chord = Object.assign({}, parsed, {
      label: parsed.rootName + parsed.formula.name + (parsed.bassName ? '/' + parsed.bassName : ''),
    });
    voicings = GT.chordFinder.findChordVoicings(parsed.rootPc, parsed.formula, { bassPc: parsed.bassPc });
    shapeIdx = 0;
    if (opts.voicing){
      // handed a shape by the chord finder: show that one. Its own search
      // usually holds the same grip, but the finder may have been filtered to
      // something this list doesn't reach — in which case the shape still
      // belongs here, at the front.
      const want = grip(opts.voicing.cells);
      const i = voicings.findIndex(v => grip(v.cells) === want);
      if (i === -1) voicings.unshift(opts.voicing);
      else shapeIdx = i;
    } else if (opts.rollShape && voicings.length > 1){
      shapeIdx = Math.floor(Math.random() * Math.min(ROLL_SHAPES, voicings.length));
    }
    input.value = chord.label;
    asked = null;                       // a new chord asks a fresh question
    render();
    return true;
  }

  function render(){
    const v = voicing();
    if (!v){
      shapeEl.innerHTML = `<p class="diagram-empty">No playable shape for ${chord.label} within a comfortable stretch.</p>`;
      shapeRow.hidden = true;
      quizEl.hidden = true;
      return;
    }
    shapeRow.hidden = voicings.length < 2;
    shapePick.textContent = `${shapeIdx + 1} of ${voicings.length}`;
    // one card, indexed like the finder's so it can share the same wiring
    shapeEl.innerHTML = `
      <div class="diagram-card" role="button" tabindex="0" data-voicing="0"
           aria-label="Play ${chord.label}" title="${GT.chordFinder.voicingTip(v)}">
        ${GT.chordFinder.buildDiagramSVG(v.cells, chord.rootPc, v.fingering, 'fingers', chord.formula, chord.rootName)}
        <p class="diagram-caption">${chord.label}${v.caged ? `<span class="diagram-shape">${v.caged} shape</span>` : ''}</p>
      </div>`;
    notes = notesOf(v.cells, chord.rootPc, chord.formula, chord.rootName);
    // The root as this shape plays it, lowest first: it's the note everything
    // else is heard against, so it's worth a button of its own. A rootless
    // voicing hasn't got one — the bass would be holding it — and there the
    // button goes rather than sounding a root that isn't in the shape.
    const root = notes.find(n => n.interval === 0);
    rootCell = root ? root.cells.slice().sort((a, b) => b.string - a.string)[0] : null;
    $('earPlayRoot').hidden = !rootCell;
    answersEl.innerHTML = notes.map(n =>
      `<button type="button" class="ear-answer" data-pc="${n.pc}">`
      + `<span class="ear-answer-name">${n.name}</span>`
      + `<span class="ear-answer-degree">${n.degree}</span></button>`).join('');
    ask();
  }

  // ---- picking a shape ----------------------------------------------------
  // Stepping through thirty grips one arrow-press at a time is no way to find
  // the one you want, and the thing that tells them apart is the picture. So
  // the picker is the pictures: every shape at once, the one on show marked,
  // and a click is a choice rather than a sound — in here the diagrams aren't
  // instruments, they're the menu.
  function openSheet(on){
    sheet.hidden = !on;
    scrim.hidden = !on;
    shapePick.setAttribute('aria-expanded', String(on));
    if (!on) return;
    $('earSheetChord').textContent = chord ? chord.label : '';
    choicesEl.innerHTML = voicings.map((v, i) => `
      <div class="diagram-card${i === shapeIdx ? ' current' : ''}" role="button" tabindex="0"
           data-choice="${i}" aria-label="Shape ${i + 1} of ${voicings.length}"
           aria-current="${i === shapeIdx}" title="${GT.chordFinder.voicingTip(v)}">
        ${GT.chordFinder.buildDiagramSVG(v.cells, chord.rootPc, v.fingering, 'fingers', chord.formula, chord.rootName)}
        <p class="diagram-caption">${v.caged ? `${v.caged} shape` : '&nbsp;'}<span class="shape-choice-num">${i + 1} of ${voicings.length}</span></p>
      </div>`).join('');
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
    if (!voicings[i]) return;
    shapeIdx = i;
    openSheet(false);
    render();
  }

  function randomChord(){
    let name;
    do { name = pick(ROOTS) + pick(TYPES); } while (chord && name === chord.label);
    load(name, { rollShape: true });
  }

  // ---- the drill ----------------------------------------------------------
  function say(text, kind){
    verdictEl.textContent = text;
    verdictEl.className = 'ear-verdict' + (kind ? ' ' + kind : '');
  }

  // A note to find. Never the one just answered: hearing the same note twice
  // running teaches nothing, and it reads as though the drill has stalled.
  function ask(){
    clearTimeout(nextRound);
    nextRound = null;
    answersEl.querySelectorAll('.ear-answer').forEach(b => b.classList.remove('right', 'wrong'));
    say('', '');
    // two notes is the fewest that can be told apart; below that there's no
    // question to ask
    quizEl.hidden = notes.length < 2;
    if (quizEl.hidden){ asked = askedCell = null; return; }
    const pool = asked ? notes.filter(n => n.pc !== asked.pc) : notes;
    asked = pick(pool.length ? pool : notes);
    askedCell = pick(asked.cells);
  }

  const playAsked = () => { if (askedCell) GT.chordFinder.playOne(askedCell.string, askedCell.fret); };

  function answer(btn){
    if (!asked || nextRound) return;         // the round is won; the next one is coming
    if (Number(btn.dataset.pc) !== asked.pc){
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 700);
      say('Not that one — listen again', '');
      return;
    }
    btn.classList.add('right');
    say(`Yes — ${asked.name} · ${asked.degree}`, 'good');
    // the next note plays itself, so the drill keeps going without a button
    // press between every question
    nextRound = setTimeout(() => { nextRound = null; ask(); playAsked(); }, 1300);
  }

  GT.earTraining = {
    init(){
      // the diagram plays like the finder's, from the finder's own code
      GT.chordFinder.soundOnClick(shapeEl, () => [voicing()]);
      $('earRandom').addEventListener('click', randomChord);
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
      $('earPlayNote').addEventListener('click', playAsked);
      // the chord itself, plainly — the diagram is there for the long version
      $('earPlayChord').addEventListener('click', () => {
        if (voicing()) GT.chordFinder.strum(voicing().cells);
      });
      // the same notes one at a time, low string to high
      $('earPlayArp').addEventListener('click', () => {
        if (voicing()) GT.chordFinder.strum(voicing().cells, GT.chordFinder.ARPEGGIO_GAP);
      });
      $('earPlayRoot').addEventListener('click', () => {
        if (rootCell) GT.chordFinder.playOne(rootCell.string, rootCell.fret);
      });
      answersEl.addEventListener('click', e => {
        const btn = e.target.closest('.ear-answer');
        if (btn) answer(btn);
      });
      // on Enter or on leaving the field, not on every keystroke: a chord
      // half-typed isn't a chord, and re-rolling the question under you as
      // you type would lose the one you're in the middle of
      input.addEventListener('change', () => load(input.value));
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ load(input.value); input.blur(); }
      });
    },
    // Arriving with nothing on: roll something rather than showing an empty
    // page. Coming back to a drill already in progress leaves it alone.
    refresh(){ if (!chord) randomChord(); },
    // leaving the tab shouldn't leave a question about to answer itself, or a
    // sheet open over a page you can't see
    stop(){ clearTimeout(nextRound); nextRound = null; openSheet(false); },
    // the chord finder handing over one of its shapes
    show(name, v){
      GT.tabs.goTo('ear');
      load(name, { voicing: v });
    },
    // exposed for the tests, which have no page to click
    notesOf,
  };
})();
