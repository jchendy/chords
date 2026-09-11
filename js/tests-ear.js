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
  segs('earExactGroup', ['name', 'exact', 'neck']);
  add('span', 'earQualityGroup', 'segmented');
  ['earChordRow', 'earScaleRow', 'earOctaveRow', 'earQualityRow', 'earShapeRow', 'earExactRow',
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

  // Naming the exact note: a shape holds the same note two or three times
  // over, and by default any of them answers, because the question is what
  // you heard. Turned on, the question becomes which one — and the button
  // that names the right note in the wrong place is a near miss rather than
  // a wrong answer, since it is a different mistake and the one this drill
  // is for.
  function testNamingTheExactNote(t){
    start();
    const bad = [];
    setMode('scale');
    const names = () => [...document.querySelectorAll('#earAnswers .ear-answer')]
      .map(b => b.querySelector('.ear-answer-name').textContent);
    const keys = () => [...document.querySelectorAll('#earAnswers .ear-answer')].map(b => b.dataset.key);

    const byName = keys().length;
    if (new Set(names()).size !== byName) bad.push('the ordinary drill offers a button per note, but some repeat');

    q('#earExactGroup .seg-btn[data-value="exact"]').click();
    const exact = keys().length;
    if (exact <= byName) bad.push(`naming the exact note offered ${exact} buttons where naming it offered ${byName}`);
    if (new Set(keys()).size !== exact) bad.push('two buttons carry the same answer');
    // ...and the extra ones are the repeats: the same note in another place
    const repeated = names().filter((n, i) => names().indexOf(n) !== i);
    if (!repeated.length) bad.push('no note appears twice, so nothing was told apart');
    const where = [...document.querySelectorAll('#earAnswers .ear-answer-where')];
    if (!where.length) bad.push('the buttons never say where the note is');

    // the twin is refused, and told apart from a plain wrong answer
    const btns = [...document.querySelectorAll('#earAnswers .ear-answer')];
    const right = btns.find(b => { b.click(); return b.classList.contains('right'); });
    if (!right){ bad.push('no button was accepted at all'); }
    else {
      const name = right.querySelector('.ear-answer-name').textContent;
      const twin = btns.find(b => b !== right && b.querySelector('.ear-answer-name').textContent === name);
      if (twin && !twin.classList.contains('close') && !twin.classList.contains('wrong')){
        bad.push('the twin was neither accepted nor refused');
      }
    }

    q('#earExactGroup .seg-btn[data-value="name"]').click();
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'Naming the exact note asks which one, not just which note');
  }

  // Pointing at the neck instead of pressing a button. The same question, the
  // same judgement — what changes is the surface, and one thing that must
  // change with it: a dot answers rather than sounds while a question is
  // live. Clicking round a shape until one matches what you heard would be a
  // way to get every question right without hearing anything.
  function testPointingAtTheNeck(t){
    start();
    const bad = [];
    setMode('scale');
    q('#earExactGroup .seg-btn[data-value="neck"]').click();

    if (!q('#earAnswers').hidden) bad.push('the buttons stayed up when the answer is given on the neck');
    if (q('#earNeckHint').hidden) bad.push('nothing said to click the neck');

    const read = () => {
      const m = (q('#earScore').textContent || '').match(/^(\d+) of (\d+)/);
      return m ? { right: Number(m[1]), of: Number(m[2]) } : null;
    };
    const dots = () => [...document.querySelectorAll('#earShape .note-hit')];
    if (!dots().length){ bad.push('the shape has no dots to point at'); }
    else {
      // the drill knows which dot it asked for; anything else is refused
      const before = read() || { right: 0, of: 0 };
      let hit = null;
      for (const d of dots()){
        d.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        if (d.classList.contains('ear-right')){ hit = d; break; }
      }
      if (!hit) bad.push('no dot was ever accepted');
      const after = read() || { right: 0, of: 0 };
      if (after.of !== before.of + 1) bad.push(`pointing at the neck moved the count by ${after.of - before.of}`);
    }

    // ...and pointing is an exact answer by nature: one button per place
    const keys = [...document.querySelectorAll('#earAnswers .ear-answer')].map(b => b.dataset.key);
    if (keys.some(k => k.indexOf(':') < 0)) bad.push('pointing offered answers that name a note rather than a place');

    q('#earExactGroup .seg-btn[data-value="name"]').click();
    if (q('#earAnswers').hidden) bad.push('the buttons never came back');
    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'Pointing at the neck answers the question, and the dots stop sounding while it stands');
  }

  GT.earSuites = [
    ['Ear: naming the exact note', testNamingTheExactNote],
    ['Ear: pointing at the neck', testPointingAtTheNeck],
    ['Ear trainer: every question has exactly one answer', testEveryQuestionHasExactlyOneAnswer],
    ['Ear trainer: the score counts questions', testTheScoreCountsQuestions],
    ['Ear trainer: Back restores the question', testBackRestoresTheQuestion],
    ['Ear trainer: an exercise survives the URL', testTheExerciseSurvivesTheUrl],
    ['Ear trainer: a run is ten questions', testARunIsTenQuestions],
  ];
})();
