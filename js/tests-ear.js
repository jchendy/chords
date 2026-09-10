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
   'earQuiz', 'earAnswers'].forEach(id => add('div', id));
  ['earError', 'earVerdict', 'earScore', 'earQuizTitle', 'earSheetTitle', 'earSheetChord']
    .forEach(id => add('p', id));
  ['earRandom', 'earShapePick', 'earShapePrev', 'earShapeNext', 'earOctaveDown',
   'earOctaveUp', 'earSheetClose', 'earPlayNote', 'earPlayRoot', 'earPlayChord',
   'earPlayArp', 'earBack'].forEach(id => {
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
  const setMode = m => q(`#earModeGroup .seg-btn[data-value="${m}"]`).click();

  let started = false;
  function start(){
    if (started) return;
    started = true;
    GT.earTraining.init();
    GT.earTraining.refresh();
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

    // one answered first time
    let btns = answers();
    let hits = 0;
    btns.forEach(b => { b.click(); if (b.classList.contains('right')) hits++; });
    q('#earRandom').click();

    // ...and one answered after every other button has been tried
    btns = answers();
    btns.forEach(b => b.click());
    const after = read();
    if (!after){ bad.push('the score never appeared'); }
    else {
      if (after.of !== before.of + 2) bad.push(`two questions moved the count by ${after.of - before.of}`);
      // the second was got wrong first, so at most one of the two counts
      if (after.right > before.right + 1) bad.push('a question got wrong first still counted as right');
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
    // back through the drills it came from
    q('#earBack').click();
    if (q('#earModeGroup .seg-btn.active').dataset.value !== 'scale')
      bad.push('Back did not return to the drill the question came from');

    GT.earTraining.stop();
    t.equal(bad.join('; '), '', 'Back puts the whole question on again, neck and all');
  }

  GT.earSuites = [
    ['Ear trainer: every question has exactly one answer', testEveryQuestionHasExactlyOneAnswer],
    ['Ear trainer: the score counts questions', testTheScoreCountsQuestions],
    ['Ear trainer: Back restores the question', testBackRestoresTheQuestion],
  ];
})();
