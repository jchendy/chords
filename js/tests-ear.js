// Regression tests for the ear trainer's drill — the part that can only be
// tested by pressing the buttons.
//
// Like the practice tests, this builds the controls the tab binds to rather
// than copying markup out of index.html: the module only ever asks for ids,
// so that's all a fixture owes it, and a control added to the real page and
// forgotten here fails loudly on the next run.
//
// It must load *before* js/ear-training.js, which binds these as it loads.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const root = document.createElement('div');
  root.id = 'ear-fixture';
  root.hidden = true;

  const add = (tag, id, cls) => {
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (cls) el.className = cls;
    root.appendChild(el);
    return el;
  };
  const segs = (id, values) => {
    const wrap = add('span', id, 'segmented');
    values.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === 0 ? ' active' : '');
      b.dataset.value = v;
      wrap.appendChild(b);
    });
    return wrap;
  };

  segs('earModeGroup', ['chord', 'quality', 'penta', 'scale']);
  segs('earOctaveGroup', ['octave', 'whole']);
  add('span', 'earQualityGroup', 'segmented');
  ['earChordRow', 'earScaleRow', 'earOctaveRow', 'earQualityRow', 'earShapeRow',
   'earOctaveStep', 'earShape', 'earShapeSheet', 'earScrim', 'earShapeChoices',
   'earQuiz', 'earAnswers', 'earNeckHint', 'earSetup', 'earGo', 'earRunBar', 'earRunDots',
   'earResult'].forEach(id => add('div', id));
  ['earError', 'earVerdict', 'earScore', 'earQuizTitle', 'earSheetTitle', 'earSheetChord',
   'earBrief', 'earRunWhat', 'earResultScore', 'earResultDetail'].forEach(id => add('p', id));
  ['earRandom', 'earRandomScale', 'earShapePick', 'earShapePrev', 'earShapeNext',
   'earOctaveDown', 'earOctaveUp', 'earSheetClose', 'earPlayNote', 'earPlayRoot',
   'earPlayChord', 'earPlayArp', 'earBack', 'earStart', 'earPractice', 'earStop',
   'earAgain', 'earChange'].forEach(id => {
    const b = add('button', id);
    b.type = 'button';
  });
  const input = add('input', 'earInput');
  input.type = 'text';
  add('select', 'earKey');
  add('select', 'earScale');
  const rootFirst = add('input', 'earRootFirst');
  rootFirst.type = 'checkbox';
  rootFirst.checked = true;
  document.body.appendChild(root);

  const q = s => document.querySelector(s);
  const answers = () => [...document.querySelectorAll('#earAnswers .ear-answer')];
  // The tab sets up an exercise and then does one, so a test that wants to
  // answer questions has to start something first — as a player does.
  const setMode = m => { q(`#earModeGroup .seg-btn[data-value="${m}"]`).click(); q('#earPractice').click(); };

  let started = false;
  function start(){
    if (started) return;
    started = true;
    GT.earTraining.init();
    GT.earTraining.refresh();
    q('#earPractice').click();      // endless, so a test isn't cut off at ten
  }

  // ---- the suites ----------------------------------------------------------

  // Every question the drill asks has exactly one answer among the buttons it
  // offers. That sounds like nothing, and it is what broke: the buttons were
  // built from one list and the question chosen from another, the two labelled
  // their answers differently, and every press came back "not that one" — in
  // all three note drills at once, while the score sat there counting misses.
  // Pressing every button is the only way to see it, so that's what this does.
  function testEveryQuestionHasExactlyOneAnswer(t){
    start();
    const bad = [];
    const asked = { chord: 0, quality: 0, penta: 0, scale: 0 };
    ['chord', 'quality', 'penta', 'scale'].forEach(mode => {
      setMode(mode);
      for (let round = 0; round < 8; round++){
        const btns = answers();
        if (btns.length < 2){ bad.push(`${mode}: ${btns.length} answers offered`); break; }
        const keys = btns.map(b => b.dataset.key);
        if (keys.some(k => k === undefined || k === '' && mode !== 'quality'))
          bad.push(`${mode}: an answer carries no key`);
        if (new Set(keys).size !== keys.length) bad.push(`${mode}: two answers share a key (${keys})`);
        // press all of them: the ones before the right one read wrong, the
        // right one reads right, and the rest are ignored once it's won
        btns.forEach(b => b.click());
        const right = btns.filter(b => b.classList.contains('right'));
        if (right.length !== 1){
          bad.push(`${mode}: ${right.length} of ${btns.length} answers were accepted`);
          break;
        }
        asked[mode]++;
        q('#earRandom').click();      // ...and on to the next question
      }
    });
    Object.entries(asked).forEach(([mode, n]) => {
      if (n < 8) bad.push(`${mode}: only ${n} questions could be answered`);
    });
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'Every question has exactly one answer among the buttons (4 drills, 8 questions each)');
  }

  // The score counts questions, not presses: a question got wrong before it's
  // got right counts once, and it counts as a miss. Both halves matter — a
  // score that counted presses would flatter you for guessing, and one that
  // forgave the first wrong guess would flatter you for being wrong.
  function testTheScoreCountsQuestions(t){
    start();
    const bad = [];
    const read = () => {
      const m = (q('#earScore').textContent || '').match(/^(\d+) of (\d+)/);
      return m ? { right: Number(m[1]), of: Number(m[2]) } : null;
    };
    setMode('chord');
    const before = read() || { right: 0, of: 0 };

    // Answer two questions by pressing buttons until one is accepted, and
    // watch which of them came right on the first press. Which that is can't
    // be known in advance — the answer moves — so the test counts what
    // actually happened rather than assuming, or it passes and fails by luck.
    let firstTime = 0;
    for (let i = 0; i < 2; i++){
      const btns = answers();
      let pressed = 0, won = false;
      for (const b of btns){
        pressed++;
        b.click();
        if (b.classList.contains('right')){ won = true; if (pressed === 1) firstTime++; break; }
      }
      if (!won) bad.push('a question had no right answer among its buttons');
      q('#earRandom').click();
    }
    const after = read();
    if (!after){ bad.push('the score never appeared'); }
    else {
      if (after.of !== before.of + 2) bad.push(`two questions moved the count by ${after.of - before.of}`);
      if (after.right !== before.right + firstTime){
        bad.push(`${firstTime} were right first time but the score moved by ${after.right - before.right}`);
      }
    }
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'The score counts questions asked and questions got right first time');
  }

  // Back puts the last question on again — the whole question, which in these
  // drills means the thing on the neck as much as the note asked. Stepping to
  // another shape or rolling another chord is a new question, so going back
  // has to restore what was on the neck too, not only what was asked about it.
  function testBackRestoresTheQuestion(t){
    start();
    const bad = [];
    setMode('scale');
    const shown = () => q('#earShape').innerHTML;
    const buttons = () => answers().map(b => b.dataset.key).join(',');

    const wasNeck = shown(), wasButtons = buttons();
    q('#earShapeNext').click();                    // a new box: a new question
    if (shown() === wasNeck) bad.push('stepping to the next shape drew the same neck');
    q('#earBack').click();
    if (shown() !== wasNeck) bad.push('Back did not put the neck back');
    if (buttons() !== wasButtons) bad.push('Back did not put the answers back');

    // ...and the same across a change of drill
    setMode('quality');
    const qualityNeck = shown();
    q('#earRandom').click();
    q('#earBack').click();
    if (shown() !== qualityNeck) bad.push('Back did not put the rolled chord back');
    // ...and far enough back it crosses into the drill the questions came
    // from, however many of them were asked in this one
    let crossed = false;
    for (let i = 0; i < 8 && !crossed; i++){
      q('#earBack').click();
      crossed = q('#earModeGroup .seg-btn.active').dataset.value === 'scale';
    }
    if (!crossed) bad.push('Back never returned to the drill the questions came from');

    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'Back puts the whole question on again, neck and all');
  }

  // An exercise has to survive being written into the address bar and read
  // back out of it, or a bookmark is a lie. The setup only: which drill and
  // what it's drilling, never the question it happened to be asking, since a
  // bookmark should reopen the exercise rather than one moment of it.
  //
  // This stubs the two ends of tabs.js rather than touching the real URL —
  // what it's testing is the encoding, which is where the mistakes live.
  function testTheExerciseSurvivesTheUrl(t){
    start();
    const bad = [];
    const realSet = GT.tabs.setState, realParams = GT.tabs.stateParams;
    let written = '';
    GT.tabs.setState = (name, params) => { written = String(params || ''); };

    // The detour has to actually disturb what's being restored, or the test
    // proves nothing: a field left out of the URL would still read back
    // correctly from the variable nobody had touched.
    const roundTrip = (what, setUp, read, disturb) => {
      setUp();
      q('#earPractice').click();
      const url = written, before = read();
      disturb();
      if (read() === before){ bad.push(`${what}: the detour left it as it was, so the trip proves nothing`); return; }
      GT.tabs.stateParams = () => new URLSearchParams(url);
      GT.earTraining.refresh();
      q('#earPractice').click();
      const after = read();
      if (after !== before) bad.push(`${what}: came back as ${after}, not ${before}`);
      if (written !== url) bad.push(`${what}: wrote ${written} after reading ${url}`);
    };

    roundTrip('a scale box',
      () => {
        setMode('scale');
        q('#earKey').value = 'Eb';
        q('#earKey').dispatchEvent(new Event('change', { bubbles: true }));
        q('#earScale').value = 'dorian';
        q('#earScale').dispatchEvent(new Event('change', { bubbles: true }));
        q('#earShapeNext').click();
        q('#earOctaveGroup .seg-btn[data-value="whole"]').click();
      },
      () => [q('#earModeGroup .seg-btn.active').dataset.value, q('#earKey').value,
             q('#earScale').value, q('#earShapePick').textContent,
             q('#earOctaveGroup .seg-btn.active').dataset.value].join('|'),
      () => {
        setMode('penta');
        q('#earKey').value = 'A';
        q('#earKey').dispatchEvent(new Event('change', { bubbles: true }));
        q('#earScale').value = 'minorpenta';
        q('#earScale').dispatchEvent(new Event('change', { bubbles: true }));
        q('#earOctaveGroup .seg-btn[data-value="octave"]').click();
      });

    roundTrip('a chord shape',
      () => {
        setMode('chord');
        q('#earInput').value = 'Am7';
        q('#earInput').dispatchEvent(new Event('change', { bubbles: true }));
        q('#earShapeNext').click();
        q('#earShapeNext').click();
      },
      () => [q('#earInput').value, q('#earShapePick').textContent].join('|'),
      () => {
        q('#earInput').value = 'G7';
        q('#earInput').dispatchEvent(new Event('change', { bubbles: true }));
      });

    roundTrip('the qualities on offer',
      () => {
        setMode('quality');
        q('#earQualityGroup .quality-btn[data-value="13"]').click();
        q('#earQualityGroup .quality-btn[data-value="m7"]').click();
        q('#earRootFirst').checked = false;
        q('#earRootFirst').dispatchEvent(new Event('change', { bubbles: true }));
      },
      () => [...document.querySelectorAll('#earQualityGroup .quality-btn.active')]
        .map(b => b.dataset.value).join(',') + '|' + q('#earRootFirst').checked,
      () => {
        q('#earQualityGroup .quality-btn[data-value="dim7"]').click();
        q('#earQualityGroup .quality-btn[data-value="7"]').click();
        q('#earRootFirst').checked = true;
        q('#earRootFirst').dispatchEvent(new Event('change', { bubbles: true }));
      });

    GT.tabs.setState = realSet;
    GT.tabs.stateParams = realParams;
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'An exercise survives being written to the URL and read back');
  }

  // A run is ten questions and then a result — the thing that makes the drill
  // something you can finish rather than a tally that only ever grows. The
  // count has to hold whatever you do inside it: get one wrong first and it
  // still costs one question, not two.
  function testARunIsTenQuestions(t){
    start();
    const bad = [];
    q('#earModeGroup .seg-btn[data-value="scale"]').click();
    q('#earStart').click();
    if (!q('#earSetup').hidden) bad.push('the setup stayed put once the run began');
    if (q('#earRunBar').hidden) bad.push('the run bar never appeared');
    if (q('#earQuiz').hidden) bad.push('the quiz never appeared');

    let answered = 0, overCounted = '';
    for (let i = 0; i < 14 && q('#earResult').hidden; i++){
      const btns = answers();
      if (!btns.length) break;
      // get the first one wrong on purpose every other time
      if (i % 2) btns.forEach(b => b.click());
      else for (const b of btns){ b.click(); if (b.classList.contains('right')) break; }
      answered++;
      // The count is read here, between the answer and the pause that moves
      // on — which is exactly the moment the tenth answer used to read
      // "11 of 10" for as long as the pause lasted.
      const shown = Number((q('#earScore').textContent.match(/^(\d+)/) || [])[1]);
      if (shown > 10) overCounted = q('#earScore').textContent;
      GT.earTraining.tick();        // stand in for the pause between questions
    }
    if (overCounted) bad.push(`the counter read "${overCounted}" in a run of ten`);
    if (q('#earResult').hidden) bad.push(`no result after ${answered} questions`);
    else if (answered !== 10) bad.push(`the run ended after ${answered} questions, not 10`);
    const score = q('#earResultScore').textContent;
    if (!/^\d+ of 10$/.test(score)) bad.push(`the result reads "${score}"`);
    if (!q('#earRunBar').hidden) bad.push('the run bar stayed up after the result');

    // and going again starts another ten from nothing
    q('#earAgain').click();
    if (!q('#earResult').hidden) bad.push('Go again left the result up');
    if (q('#earScore').textContent !== '1 of 10') bad.push(`a fresh run opens on "${q('#earScore').textContent}"`);
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'A run is ten questions and then a result');
  }

  // A note drill is answered by pointing at the dot. Three things have to
  // hold. The answer is a place, so a shape's three Gs are three answers and
  // the twin of the right one is refused — as a near miss, since telling the
  // note but not the place is a different mistake and the one this drill is
  // for. There are no buttons, because two ways to answer the same question
  // on screen at once is one too many. And a dot answers instead of sounding
  // while a question stands: clicking round a box until one matches what you
  // heard would be a way to get every question right without hearing it.
  function testPointingAtTheNeck(t){
    start();
    const bad = [];
    setMode('scale');
    // the whole shape, so every dot on screen is one of the answers — one
    // octave of a box leaves the rest of it drawn but out of play
    q('#earOctaveGroup .seg-btn[data-value="whole"]').click();
    const read = () => {
      const m = (q('#earScore').textContent || '').match(/^(\d+) of (\d+)/);
      return m ? { right: Number(m[1]), of: Number(m[2]) } : null;
    };
    const dots = () => [...document.querySelectorAll('#earShape .note-hit')];
    const cls = d => d.getAttribute('class') || '';

    if (!q('#earAnswers').hidden) bad.push('a note drill still put buttons up');
    if (q('#earNeckHint').hidden) bad.push('nothing said to click the neck');
    if (!dots().length) bad.push('the shape has no dots to point at');

    // The drill says which dot it asked about, so the wrong ones can be
    // pressed on purpose rather than found by pressing everything and hoping.
    const asked = () => GT.earTraining.askedAt();
    const at = c => dots().find(d => Number(d.dataset.string) === c.string
                                  && Number(d.dataset.fret) === c.fret);
    const { STRING_TUNING } = GT.fretboard;
    const pcOf = d => (STRING_TUNING[Number(d.dataset.string)] + Number(d.dataset.fret)) % 12;

    const before = read() || { right: 0, of: 0 };
    const want = asked() && at(asked());
    if (!want){ bad.push('the drill asked about a dot that is not on the neck'); }
    else {
      // the twin — the same note somewhere else on the shape — is refused,
      // and refused differently, since telling the note but not the place is
      // a different mistake and the one this drill is for
      const twin = dots().find(d => d !== want && pcOf(d) === pcOf(want));
      if (twin){
        twin.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        if (cls(twin).indexOf('ear-close') < 0){
          bad.push(`the right note in the wrong place was marked "${cls(twin)}"`);
        }
      }
      // a different note is simply wrong
      const other = dots().find(d => pcOf(d) !== pcOf(want));
      if (other){
        other.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        if (cls(other).indexOf('ear-wrong') < 0) bad.push(`a wrong note was marked "${cls(other)}"`);
      }
      // ...and the dot that sounded is accepted
      want.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      if (cls(want).indexOf('ear-right') < 0) bad.push('the dot that sounded was refused');
      // its ring lasts until the next question and no longer: a run used to
      // end with a halo on every dot it had asked about
      GT.earTraining.tick();
      const haloed = dots().filter(d => /ear-(right|close|wrong)/.test(cls(d))).length;
      if (haloed) bad.push(`${haloed} dot(s) still marked once the next question was asked`);
    }
    const after = read() || { right: 0, of: 0 };
    if (after.of !== before.of + 1) bad.push(`pointing moved the count by ${after.of - before.of}`);

    // A dot that is drawn but out of play — one octave of a box leaves the
    // rest of the box on screen — is not an answer at all, so clicking it
    // says so rather than costing you the question.
    q('#earOctaveGroup .seg-btn[data-value="octave"]').click();
    const target = GT.earTraining.askedAt();
    if (target){
      const scored = read() || { right: 0, of: 0 };
      const stray = dots().find(d => !(Number(d.dataset.string) === target.string
                                    && Number(d.dataset.fret) === target.fret));
      if (stray){
        stray.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const outside = cls(stray).indexOf('ear-outside') >= 0;
        const now = read() || { right: 0, of: 0 };
        if (outside && now.of !== scored.of) bad.push('a dot outside the octave in play cost the question');
      }
    }

    // ...and the quality drill, which has no place to point at, keeps buttons
    setMode('quality');
    if (q('#earAnswers').hidden) bad.push('the quality drill lost its buttons');
    if (!q('#earNeckHint').hidden) bad.push('the quality drill was told to click the neck');
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'A note drill is answered by pointing, and only the dot that sounded will do');
  }

  GT.earSuites = [
    ['Ear: pointing at the neck', testPointingAtTheNeck],
    ['Ear trainer: every question has exactly one answer', testEveryQuestionHasExactlyOneAnswer],
    ['Ear trainer: the score counts questions', testTheScoreCountsQuestions],
    ['Ear trainer: Back restores the question', testBackRestoresTheQuestion],
    ['Ear trainer: an exercise survives the URL', testTheExerciseSurvivesTheUrl],
    ['Ear trainer: a run is ten questions', testARunIsTenQuestions],
  ];
})();
