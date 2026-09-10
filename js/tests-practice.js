// Regression tests for the practice tab's own state — the progression, the
// key and preset pickers, and the share link.
//
// Like the fretboard tests, this builds the controls the tab binds to rather
// than copying markup out of index.html: the module only ever asks for ids and
// element types, so that's all a fixture owes it, and a control added to the
// real page and forgotten here fails loudly on the next run.
//
// It must load *before* js/practice.js, which binds these as it loads, and its
// suites run last — GT.practice.init() hands the fretboard view a new host, so
// anything asking that view questions has to have asked them already.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const root = document.createElement('div');
  root.id = 'practice-fixture';
  root.hidden = true;

  const add = (tag, id, attrs = {}) => {
    const el = document.createElement(tag);
    if (id) el.id = id;
    Object.entries(attrs).forEach(([k, v]) => { el[k] = v; });
    root.appendChild(el);
    return el;
  };

  add('div', 'page-caged');
  ['keySelect', 'presetSelect', 'quickKey', 'quickPreset', 'quickStyle'].forEach(id => add('select', id));
  add('input', 'tempo', { type: 'range', min: '40', max: '208', value: '60' });
  add('input', 'shareOut', { type: 'text' });
  ['tempoVal', 'keyReadout', 'measureReadout', 'chordCountValue', 'styleLabel']
    .forEach(id => add('span', id));
  ['chords', 'chordSlots', 'presetVariantGroup', 'presetVariantRow',
   'styleVariantGroup', 'styleVariantRow', 'clickRow', 'noteValueRow',
   'rootOnlyRow'].forEach(id => add('div', id));
  ['genBtn', 'randomKeyBtn', 'quickKeyDice', 'quickRandomChords',
   'chordCountUp', 'chordCountDown', 'shareBtn'].forEach(id => add('button', id, { type: 'button' }));
  // the tab reaches for the label wrapping a checkbox to grey it out
  ['commonToggle', 'randomSeventhsToggle', 'clickToggle', 'countInToggle',
   'rootOnlyToggle'].forEach(id => {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = id;
    if (id === 'countInToggle') box.checked = true;
    label.appendChild(box);
    root.appendChild(label);
  });
  // the transport: two copies, as the real page has, so "they stay in step"
  // is something the tests can actually see
  [0, 1].forEach(() => add('button', null, { type: 'button', className: 'primary play-btn' }));
  [60, 90, 120, 150, 180].forEach(bpm => {
    const b = add('button', null, { type: 'button', className: 'seg-btn bpm-preset' });
    b.dataset.bpm = String(bpm);
    if (bpm === 60) b.classList.add('active');
  });
  const segGroup = (id, values, cls) => {
    const g = document.createElement('div');
    g.id = id;
    values.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls + (i === 0 ? ' active' : '');
      b.dataset.value = v;
      g.appendChild(b);
    });
    root.appendChild(g);
  };
  segGroup('noteValueGroup', ['1', '2', '4'], 'seg-btn');
  segGroup('voiceGroup', ['piano', 'guitar'], 'seg-btn');
  segGroup('styleGroup', Object.keys(GT.audio.STYLES), 'genre-btn');
  document.body.appendChild(root);

  // ---- driving it ----------------------------------------------------------
  const q = s => document.querySelector(s);
  const setSel = (el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const setKey = k => setSel(q('#keySelect'), k);
  const setTempo = t => {
    q('#tempo').value = String(t);
    q('#tempo').dispatchEvent(new Event('input', { bubbles: true }));
  };
  const chart = () => [...q('#chords').querySelectorAll('.bar')]
    .map(b => b.textContent.replace(/\s+/g, ' ').trim()).join(' | ');
  const state = () => ({ key: q('#keySelect').value, tempo: q('#tempo').value, chart: chart() });
  const variantButtons = () => [...q('#presetVariantGroup').querySelectorAll('button')];

  let started = false;
  function start(){
    if (started) return;
    started = true;
    GT.practice.init();
  }

  // ---- the suites ----------------------------------------------------------

  // The share link is one format written by shareState() and read back by
  // applyShareState(), and nothing checked that the two still agree. A link is
  // the only way to keep a progression at all, so a drift here loses work.
  function testShareLinkRoundTrips(t){
    start();
    const cases = [['major:C', 60], ['minor:A', 96], ['major:Eb', 132], ['minor:F#', 72]];
    const lost = [];
    cases.forEach(([key, tempo]) => {
      setKey(key);
      setTempo(tempo);
      const want = state();
      q('#shareBtn').click();              // writes the state into the fragment
      const link = location.hash;
      // disturb every field the link carries, then follow it back
      setKey(key === 'major:C' ? 'minor:G' : 'major:C');
      setTempo(111);
      location.hash = '#practice-elsewhere';
      location.hash = link;
      const got = state();
      Object.keys(want).forEach(f => {
        if (want[f] !== got[f]) lost.push(`${key}: ${f} came back "${got[f]}" not "${want[f]}"`);
      });
    });
    t.equal(lost.join('; '), '', `A shared link brings its progression back (${cases.length} round trips)`);
  }

  // B11 — a variant written for one mode can't survive the key moving to the
  // other, and the row used to sit there with nothing marked, still claiming a
  // preset the chords no longer came from.
  function testModeLockedVariantDropsItsPreset(t){
    start();
    const problems = [];
    GT.progressionPresets.forEach((preset, idx) => {
      const locked = preset.variants.findIndex(v => v.mode);
      if (locked === -1) return;                    // nothing mode-locked to lose
      const mode = preset.variants[locked].mode;
      setKey(mode === 'minor' ? 'minor:A' : 'major:C');
      if (![...q('#presetSelect').options].some(o => o.value === String(idx))) return;
      setSel(q('#presetSelect'), String(idx));
      const btn = variantButtons().find(b => b.textContent.trim() === preset.variants[locked].name);
      if (!btn) return;
      btn.click();
      const chordsBefore = chart();
      setKey(mode === 'minor' ? 'major:C' : 'minor:A');   // into the other mode
      const marked = variantButtons().filter(b => b.classList.contains('active')).length;
      if (q('#presetSelect').value !== '')
        problems.push(`${preset.name}/${preset.variants[locked].name}: still selected in the other mode`);
      if (!q('#presetVariantRow').hidden && marked !== 1)
        problems.push(`${preset.name}: variant row shown with ${marked} marked`);
      if (!chart())
        problems.push(`${preset.name}: the chart emptied`);
      if (chart() === chordsBefore)
        problems.push(`${preset.name}: the chords didn't transpose`);
    });
    t.equal(problems.join('; '), '', 'A variant the mode cannot show gives up its preset');
  }

  // B31 — the row hides before it empties, so it kept the previous preset's
  // buttons, handlers and all. Out of a pointer's reach, but a stale one was
  // live enough to be clicked by a test and move the key underneath it.
  function testHiddenVariantRowIsEmpty(t){
    start();
    const left = [];
    ['major:C', 'minor:A'].forEach(key => {
      setKey(key);
      [...q('#presetSelect').options].filter(o => o.value !== '').forEach(o => {
        setSel(q('#presetSelect'), o.value);
        setKey(key);                                  // a mode-locked variant may have moved it
        if (q('#presetVariantRow').hidden && variantButtons().length)
          left.push(`${key} "${o.text.split(' ·')[0]}": ${variantButtons().length} buttons in a hidden row`);
      });
    });
    t.equal(left.join('; '), '', 'A hidden variant row holds no buttons');
  }

  // every transport copy shows the same thing, whichever one you press
  function testTransportsStayInStep(t){
    start();
    const btns = [...document.querySelectorAll('#practice-fixture .play-btn')];
    const labels = () => btns.map(b => b.textContent.trim());
    const out = [];
    btns.forEach((b, i) => {
      b.click();
      if (new Set(labels()).size !== 1) out.push(`after pressing copy ${i}: ${labels().join(' / ')}`);
      b.click();
      if (new Set(labels()).size !== 1) out.push(`after releasing copy ${i}: ${labels().join(' / ')}`);
    });
    t.equal(out.join('; '), '', `Every Play button reads the same (${btns.length} copies)`);
  }

  // Both players queue notes ahead of the sound against the same clock. If a
  // stall — a background tab's throttled timer, most of all — leaves the
  // cursor behind that clock, the beats it missed must be stepped over rather
  // than queued: a time in the past doesn't play late, it starts every note of
  // that beat at once, which is heard as popping. So: after skipping, the
  // cursor is never behind the clock, and never further ahead than it has to
  // be.
  function testTheSchedulerNeverQueuesThePast(t){
    const bad = [];
    const skip = GT.audio.stepsToSkip;
    const spb = 60 / 180;                       // the tempo this went wrong at

    // nothing to skip while the cursor is still ahead of the clock
    [[10.5, 10], [10, 10], [10.0001, 10]].forEach(([cursor, now]) => {
      if (skip(cursor, now, spb) !== 0) bad.push(`skipped ${skip(cursor, now, spb)} beats while ${cursor} >= ${now}`);
    });

    // a stall of each of these lengths, at 180 and at 60
    [0.4, 1, 2.5, 9].forEach(stall => {
      [60, 180].forEach(bpm => {
        const beat = 60 / bpm;
        const now = 100, cursor = now - stall;
        const n = skip(cursor, now, beat);
        const landed = cursor + n * beat;
        if (landed < now) bad.push(`${stall}s stall at ${bpm}bpm left the cursor ${(now - landed).toFixed(3)}s in the past`);
        if (landed - now >= beat) bad.push(`${stall}s stall at ${bpm}bpm overshot by ${(landed - now).toFixed(3)}s, a whole beat or more`);
      });
    });

    // the case from the bug: a second of throttled timer at 180bpm is three
    // beats gone, not three beats of notes piled onto one instant
    if (skip(0, 1, spb) !== 3) bad.push(`a 1s stall at 180bpm skipped ${skip(0, 1, spb)} beats, not 3`);
    // a tempo of zero can't be stepped through; it must not spin
    if (skip(0, 5, 0) !== 0) bad.push('a zero-length beat asked for a skip');

    t.equal(bad.join('; '), '', 'A stall makes the progression slip, not the notes pile up');
  }

  // Notes are queued ahead of the sound, so stopping has to call off the ones
  // that haven't started — otherwise the queue plays on past the button.
  function testStoppingCallsOffWhatIsQueued(t){
    const bad = [];
    if (typeof GT.audio.cancelScheduled !== 'function'){
      bad.push('audio exposes no way to call off queued notes');
    }
    // the cushion has to cover a throttled timer, which browsers clamp to a
    // second: too short and a stall becomes a burst instead of a slip
    const spb = 60 / 180;
    if (GT.audio.stepsToSkip(0, 0.3, spb) === 0){
      bad.push('a 0.3s stall was treated as no stall at all');
    }
    t.equal(bad.join('; '), '', 'Playback can be called off without waiting for the queue');
  }

  // T41 — a progression isn't limited to the seven chords the key hands you:
  // the ♭VII a rock song falls off the end into, the borrowed ♭VI, the ♯IV
  // under a secondary dominant. All twelve roots are on the picker, and the
  // two kinds have to stay told apart: a root the key owns reads as its
  // degree, and one it doesn't reads as itself under a heading that says so.
  function testEveryRootIsOnThePicker(t){
    start();
    const bad = [];
    const rootOf = txt => (txt.match(/^[A-G][b#]?/) || [''])[0];
    const pcOf = txt => GT.theory.SEMITONE[rootOf(txt)];
    ['major:C', 'minor:A', 'major:Eb', 'minor:F#'].forEach(key => {
      setKey(key);
      const sel = q('#chordSlots .chord-degree');
      const groups = [...sel.querySelectorAll('optgroup')];
      if (groups.length !== 2){ bad.push(`${key}: ${groups.length} option groups, not 2`); return; }
      const [inKey, outside] = groups;
      if (!/outside/i.test(outside.label)) bad.push(`${key}: the second group is labelled "${outside.label}"`);
      const pcs = g => [...g.children].map(o => pcOf(o.textContent));
      const own = new Set(pcs(inKey)), out = new Set(pcs(outside));
      // the two together are the twelve, with nothing in both
      if (own.size + out.size !== 12){
        bad.push(`${key}: ${own.size} in the key and ${out.size} outside it`);
      }
      [...own].filter(pc => out.has(pc)).forEach(pc =>
        bad.push(`${key}: pitch ${pc} is offered both inside and outside the key`));
      // ...and every option, either side, names a chord and the degree it is
      [...inKey.children, ...outside.children].forEach(o => {
        const [name, numeral] = o.textContent.split(' · ');
        if (!numeral) bad.push(`${key}: "${o.textContent}" doesn't say which degree it is`);
        if (pcOf(name) === undefined) bad.push(`${key}: "${o.textContent}" doesn't name a chord`);
      });
      // A root outside the key is always an altered degree, and where it needs
      // an accidental at all it takes the one its own numeral gives it: the
      // ♭VII of C is Bb, never A#. (Plenty of them need none — the ♭II of Eb
      // is a plain E, and no one writes Fb.)
      [...outside.children].forEach(o => {
        const [name, numeral] = o.textContent.split(' · ');
        if (!/[\u266d\u266f]/.test(numeral || '')){
          bad.push(`${key}: "${o.textContent}" sits outside the key with a plain numeral`);
          return;
        }
        const wrong = numeral.includes('\u266d') ? '#' : 'b';
        if (rootOf(name).slice(1) === wrong) bad.push(`${key}: ${numeral} is spelled "${rootOf(name)}"`);
      });
    });
    t.equal(bad.join('; '), '', 'All twelve roots are offered, and the key\'s own are still named as degrees');
  }

  // A root outside the key is held as an interval above the tonic, like a
  // degree is, so that everything a degree survives it survives too: moving
  // the key takes it along, a mode that turns out to own it hands it back to
  // that degree, and a shared link brings it home.
  function testAnOutsideRootTravels(t){
    start();
    const bad = [];
    const bar = () => chart().split(' | ')[0];
    // What the slot's own picker says it's on. A chord that's merely sounding
    // isn't the same as one the picker is still holding: the first survives a
    // key change by accident, the second is what "Use 7ths", a shared link and
    // the next key change all read.
    const pinned = () => {
      const sel = q('#chordSlots .chord-degree');
      const opt = sel.selectedOptions[0];
      if (!opt) return 'nothing';
      const group = opt.parentElement.tagName === 'OPTGROUP' ? opt.parentElement.label : 'no group';
      return `${opt.textContent} (${group})`;
    };
    const outsideOption = numeral => {
      const sel = q('#chordSlots .chord-degree');
      const outside = [...sel.querySelectorAll('optgroup')][1];
      const opt = [...outside.children].find(o => o.textContent.split(' · ')[1] === numeral);
      if (opt) setSel(sel, opt.value);
      return !!opt;
    };

    setKey('major:C');
    if (!outsideOption('\u266dVII')) bad.push('C major offers no ♭VII');
    if (bar() !== 'Bb \u266dVII') bad.push(`the ♭VII of C came out "${bar()}"`);
    // nothing about the key narrows a borrowed chord, so it's offered every
    // shape — plain major first, as everywhere else
    const shapes = [...q('#chordSlots .seventh-select').options].map(o => o.textContent);
    if (shapes.length !== 8 || shapes[0] !== 'Major')
      bad.push(`a borrowed root is offered ${shapes.length} shapes, starting "${shapes[0]}"`);

    // the same chord in another key: still the ♭VII, now spelled from D, and
    // still held as the ♭VII rather than left behind as a chord of no degree
    setKey('major:D');
    if (bar() !== 'C \u266dVII') bad.push(`moved to D major, the ♭VII came out "${bar()}"`);
    if (pinned() !== 'C · \u266dVII (Outside the key)')
      bad.push(`moved to D major, the picker holds ${pinned()}`);

    // a link brings it back rather than dropping it for a diatonic chord
    q('#shareBtn').click();
    const link = location.hash;
    setKey('minor:G');
    location.hash = '#practice-elsewhere';
    location.hash = link;
    if (bar() !== 'C \u266dVII') bad.push(`a shared ♭VII came back as "${bar()}"`);
    if (pinned() !== 'C · \u266dVII (Outside the key)')
      bad.push(`a shared ♭VII came back held as ${pinned()}`);

    // a mode that does own the root takes it back as a degree
    setKey('major:C');
    if (!outsideOption('\u266dIII')) bad.push('C major offers no ♭III');
    if (bar() !== 'Eb \u266dIII') bad.push(`the ♭III of C came out "${bar()}"`);
    setKey('minor:C');
    if (bar() !== 'Eb III') bad.push(`in C minor the same chord reads "${bar()}", not its degree III`);
    if (pinned() !== 'Eb · III (In this key)')
      bad.push(`in C minor the picker holds ${pinned()}, not the degree the key owns`);

    // don't leave a link in the address bar: reloading the page would boot the
    // tab into this progression rather than a fresh one
    location.hash = '';
    t.equal(bad.join('; '), '', 'A root outside the key moves with the key, and is given back when a key owns it');
  }

  GT.practiceSuites = [
    ['Practice: a shared link round-trips', testShareLinkRoundTrips],
    ['Practice: every root is on the picker', testEveryRootIsOnThePicker],
    ['Practice: a root outside the key travels with it', testAnOutsideRootTravels],
    ['Practice: a variant the mode drops takes its preset with it', testModeLockedVariantDropsItsPreset],
    ['Practice: a hidden variant row is empty', testHiddenVariantRowIsEmpty],
    ['Practice: the transports stay in step', testTransportsStayInStep],
    ['Practice: a stall slips the progression, it does not pile up notes', testTheSchedulerNeverQueuesThePast],
    ['Practice: stopping calls off what is queued', testStoppingCallsOffWhatIsQueued],
  ];
})();
