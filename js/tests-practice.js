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
  add('input', 'chordText', { type: 'text' });
  add('div', 'chordTextNote');
  add('button', 'chordTextApply', { type: 'button' });
  ['tempoVal', 'keyReadout', 'measureReadout', 'chordCountValue', 'styleLabel']
    .forEach(id => add('span', id));
  ['chords', 'chordSlots', 'presetVariantGroup', 'presetVariantRow',
   'clickRow', 'rootOnlyRow'].forEach(id => add('div', id));
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
  segGroup('voiceGroup', ['piano', 'guitar'], 'seg-btn');
  segGroup('chartViewGroup', ['chart', 'part'], 'seg-btn');
  segGroup('partScaleGroup', ['follow', 'key'], 'seg-btn');
  add('input', 'partVolume', { type: 'range', min: '0', max: '100', value: '70' });
  add('button', 'partMute', { type: 'button' });
  add('input', 'bandVolume', { type: 'range', min: '0', max: '100', value: '100' });
  add('button', 'bandMute', { type: 'button' });
  {
    const g = add('span', 'partTechGroup');
    ['double', 'bend', 'hammer', 'pull', 'slide'].forEach(tech => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tech-btn'; b.dataset.tech = tech; b.setAttribute('aria-pressed', 'true');
      g.appendChild(b);
    });
  }
  ['partPanel', 'partControls', 'partTab', 'partNote'].forEach(id => add('div', id));
  add('span', 'partName');
  ['partPrev', 'partNext', 'partReroll'].forEach(id => add('button', id, { type: 'button' }));
  add('input', 'partEasy', { type: 'checkbox' });
  add('input', 'partHumanize', { type: 'checkbox' });
  add('span', 'partLead');
  add('span', 'styleGroup');          // practice.js fills the list itself
  add('input', 'styleSearch', { type: 'search' });
  add('div', 'styleRecentRow'); add('span', 'styleRecent');
  ['tempoDown', 'tempoUp', 'tempoTap'].forEach(id => add('button', id, { type: 'button' }));
  add('div', 'barEditor').appendChild(root.querySelector('#chordSlots'));   // the rows live inside the editor, as on the page
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

    // Stop has two jobs, and until the recordings arrived only one of them
    // showed: a note still queued must never sound, and a note already
    // sounding must be taken away rather than left to ring. The synthesized
    // piano fell away by itself, so nobody noticed the second; a recorded one
    // rings for seconds, and pause stopped meaning stop. This drives both:
    // one note scheduled now, one well ahead, and stop has to treat them
    // differently. The context is never resumed, so nothing is audible.
    GT.audio.ensureAudio();
    const ctx = GT.audio.ctx();
    if (!ctx){
      bad.push('no audio context to test stopping with');
    } else {
      GT.audio.playNote(220, ctx.currentTime, 4, 0.4);         // sounding
      GT.audio.playNote(330, ctx.currentTime + 5, 4, 0.4);     // still queued
      const did = GT.audio.cancelScheduled();
      if (!did || typeof did.faded !== 'number'){
        bad.push('stopping says nothing about what it did');
      } else {
        if (did.stopped < 1) bad.push('a note queued five seconds out was not called off');
        if (did.faded < 1) bad.push('a note already sounding was left to ring out');
      }
    }
    t.equal(bad.join('; '), '', 'Stopping calls off what is queued and takes away what is sounding');
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

  // A chord in the Simple style must not still be sounding when the next one
  // is struck. It used to ring 2.3 beats, which the synthesized piano got
  // away with and the recorded one did not — a bar of quarter notes came out
  // as one chord smeared over the whole bar. This is the rule rather than the
  // number: whatever the tempo and whatever the note value, a hit ends by the
  // time the next begins.
  function testAHitEndsWhenTheNextBegins(t){
    const bad = [];
    [40, 60, 90, 120, 160, 208].forEach(bpm => {
      const secondsPerBeat = 60 / bpm;
      [1, 2, 4].forEach(noteBeats => {
        const gap = secondsPerBeat * noteBeats;
        const rings = GT.practice.simpleHitSeconds(secondsPerBeat, noteBeats);
        if (rings > gap + 1e-9) bad.push(`at ${bpm} BPM a ${noteBeats}-beat hit rings ${(rings / gap).toFixed(2)}x the gap`);
        if (rings <= 0) bad.push(`at ${bpm} BPM a ${noteBeats}-beat hit lasts ${rings}s`);
      });
    });
    t.equal(bad.join('; '), '', 'A Simple-style chord ends as the next one is struck');
  }

  // The downbeat should be an accent, and an accent is a couple of decibels.
  // It used to be 4.4 dB, and — because the two velocities fell either side
  // of the sample layers' split — it also changed which strike was playing,
  // so every bar went hard-soft-soft-soft between two different recordings
  // of the instrument. That reads as a jolt, not as time. Two things are
  // pinned here: the size of the accent, and that both velocities land in the
  // layers' overlap, where the cross-fade means neither is a switch.
  function testTheDownbeatIsAnAccentNotAnInstrument(t){
    const bad = [];
    const { SIMPLE_ACCENT } = GT.practice;
    const { pianoLayerMix } = GT.audio;
    const dB = 20 * Math.log10(SIMPLE_ACCENT.downbeat / SIMPLE_ACCENT.other);
    if (!(dB > 0)) bad.push('the downbeat is not the louder of the two');
    if (dB > 3.5) bad.push(`the downbeat is ${dB.toFixed(1)} dB above the rest, which is a jolt rather than an accent`);

    const down = pianoLayerMix(SIMPLE_ACCENT.downbeat);
    const other = pianoLayerMix(SIMPLE_ACCENT.other);
    // they have to share a layer: if one is pure hard and the other pure
    // soft, the cross-fade never happens and the bar changes instrument
    const shares = Math.min(down.hard, other.hard) > 0.3 || Math.min(down.soft, other.soft) > 0.3;
    if (!shares) bad.push('the downbeat and the other beats come from different layers with nothing in common');

    // ...and the fade itself has to be a fade: continuous, and equal-power
    // through the middle so the note doesn't dip as it crosses
    let last = pianoLayerMix(0);
    for (let v = 0; v <= 1.0001; v += 0.01){
      const m = pianoLayerMix(v);
      if (Math.abs(m.hard - last.hard) > 0.08 || Math.abs(m.soft - last.soft) > 0.08){
        bad.push(`the layer mix jumps at velocity ${v.toFixed(2)}`);
        break;
      }
      const power = m.hard * m.hard + m.soft * m.soft;
      if (power < 0.99 || power > 1.01){ bad.push(`the mix at ${v.toFixed(2)} is ${power.toFixed(2)} of full power`); break; }
      last = m;
    }
    t.equal(bad.join('; '), '', 'The downbeat is an accent, and the layers cross-fade rather than switch');
  }

  // The transport's picker is a short list of feels, not of styles: most
  // styles put up one entry, but the two blues feels are different music and
  // both belong there, and "Rock" means the quarter-note one. What it must
  // never do is say one thing while another plays — including when the feel
  // was chosen in the Set up sheet, which the picker doesn't list.
  // One list of styles, the same everywhere it's offered: the sheet's row of
  // buttons and the bar's picker carry every feel the engine has, each named
  // once, and choosing on either puts the same thing on. The sheet used to
  // ask for a genre and then a feel within it while the bar kept a shortlist
  // of its own, so the same music had different names in different places.
  function testTheStyleListIsOneList(t){
    const bad = [];
    const { STYLES } = GT.audio;
    const picker = q('#quickStyle');
    const buttons = () => [...document.querySelectorAll('#styleGroup .genre-btn')];
    const options = [...picker.options];

    // everything the engine has, once, in the same order in both places
    const expect = ['simple.1', 'simple.2', 'simple.4'];
    Object.keys(STYLES).forEach(style => STYLES[style].variants.forEach((v, i) => expect.push(`${style}.${i}`)));
    const sheet = buttons().map(b => b.dataset.value), bar = options.map(o => o.value);
    if (sheet.join() !== expect.join()) bad.push(`the sheet lists ${sheet.join(' ')}`);
    if (bar.join() !== expect.join()) bad.push(`the bar lists ${bar.join(' ')}`);
    buttons().forEach((b, i) => {
      if (b.textContent !== options[i].text) bad.push(`"${b.textContent}" in the sheet is "${options[i].text}" in the bar`);
    });
    // every name is its own — no genre-then-feel dressing, no two alike
    const names = options.map(o => o.text);
    if (new Set(names).size !== names.length) bad.push('two entries share a name');
    if (names.some(n => n.indexOf('·') >= 0)) bad.push('an entry is still named genre · feel');
    ['Simple quarter note', 'Straight rock (eighth-note)', 'Rock', 'Half-time (Levee-style)', 'Blues shuffle', 'Slow blues (12/8)', 'Jump blues (swung)',
     'Swing', 'Bossa nova', 'Pop (four on the floor)', 'Classic funk (Nolen-inspired)', 'Disco (Rodgers-inspired)', "Rock 'n' roll", 'Texas shuffle', 'Punk'].forEach(n => {
      if (!names.includes(n)) bad.push(`no entry called "${n}"`);
    });

    // the default is named rather than left inline, and it is a feel that exists
    const { DEFAULT_FEEL } = GT.practice;
    if (!DEFAULT_FEEL || DEFAULT_FEEL.style !== 'rock'){
      bad.push(`a fresh page opens on ${DEFAULT_FEEL && DEFAULT_FEEL.style}, not rock`);
    } else if (!STYLES.rock.variants.some(v => v.label === DEFAULT_FEEL.variant)){
      bad.push(`the default names a feel rock hasn't got: ${DEFAULT_FEEL.variant}`);
    }

    // choosing on either side puts the same thing on everywhere
    const active = () => { const b = buttons().find(x => x.classList.contains('active')); return b && b.dataset.value; };
    options.forEach(opt => {
      picker.value = opt.value;
      picker.dispatchEvent(new Event('change'));
      if (active() !== opt.value) bad.push(`the bar chose "${opt.text}" and the sheet shows ${active()}`);
      // the bar names the feel with its genre in front (Rock › Punk); Simple's note values stand alone
      const style = opt.value.split('.')[0];
      const want = style === 'simple' ? opt.text : `${GT.audio.STYLES[style].label} › ${opt.text}`;
      if (q('#styleLabel').textContent !== want) bad.push(`the bar names "${q('#styleLabel').textContent}" for ${opt.text}`);
    });
    buttons().forEach(b => {
      b.click();
      if (picker.value !== b.dataset.value) bad.push(`the sheet chose "${b.textContent}" and the bar sits on ${picker.value}`);
    });
    // Simple's note value is part of the choice, and rides in the link
    q('#styleGroup .genre-btn[data-value="simple.2"]').click();
    q('#shareBtn').click();
    if (!/[#&]s=simple\.2(&|$)/.test(location.hash)) bad.push(`the link carries Simple half notes as "${(location.hash.match(/s=[^&]*/) || [''])[0]}"`);
    q('#styleGroup .genre-btn[data-value="simple.1"]').click();
    q('#shareBtn').click();
    if (/[#&]s=/.test(location.hash)) bad.push('Simple on quarters is written into the link');
    // a link for a feel that has gone falls back rather than breaking
    picker.value = 'rock.1'; picker.dispatchEvent(new Event('change'));
    location.hash = '#practice?k=major%3AC&c=0.2.&s=jazz.7';
    if (!active() || active().split('.')[0] !== 'jazz') bad.push(`a link to a jazz feel that has gone put on ${active()}`);
    picker.value = 'rock.1'; picker.dispatchEvent(new Event('change'));
    history.replaceState(null, '', location.pathname);
    t.equal(bad.join('; '), '', 'The styles are one list, the same in the sheet and the bar');
  }

  // Typing a progression: one chord per bar, so a chord held for four bars is
  // written four times. The point of typing is to reach what the dice can't,
  // so the chords set the key rather than being read against it — and a line
  // with a word it can't read is refused whole, because a progression with a
  // hole in it isn't what anyone meant.
  function testTypingAProgression(t){
    const bad = [];
    const field = q('#chordText'), apply = q('#chordTextApply'), note = q('#chordTextNote');
    const chart = () => [...document.querySelectorAll('#chordSlots .chord-row')].length;
    const set = text => { field.value = text; apply.click(); };
    const bars = () => [...document.querySelectorAll('#chordSlots .chord-degree')]
      .map(sel => (sel.selectedOptions[0] || {}).textContent).join(' ');

    set('E E E E A7 A7 E E Bm7 Bm7');
    const after = field.value.trim().split(/\s+/);
    if (after.length !== 10) bad.push(`ten bars went in and ${after.length} came back: "${field.value}"`);
    if (after[0] !== 'E' || after[4] !== 'A7' || after[8] !== 'Bm7'){
      bad.push(`the bars came back in the wrong order: "${field.value}"`);
    }
    // E A7 E Bm7 — four runs, not three: the E comes back after the A7
    if (chart() !== 4) bad.push(`ten bars of four chords filled ${chart()} slots`);

    // bar lines and commas are how people write these
    set('A | D | E | A');
    if (field.value.trim().split(/\s+/).length !== 4) bad.push(`bar lines confused it: "${field.value}"`);
    set('C, Am, F, G');
    if (field.value.trim().split(/\s+/).length !== 4) bad.push(`commas confused it: "${field.value}"`);

    // a word it can't read refuses the line and says which word
    set('C, Am, F, G');
    const before = bars();
    set('A D Q7 E');
    if (note.hidden || !/Q7/.test(note.textContent)) bad.push(`a chord it can't read went unnamed: "${note.textContent}"`);
    // the field keeps what was typed — nothing is more annoying than having
    // your line rewritten under you — so what must be unchanged is the chart
    if (chart() !== 4 || bars() !== before) bad.push(`a line with an unreadable chord was applied anyway: ${bars()}`);

    // more chord changes than there are slots is refused, not truncated
    set('C D E F G A B C D E F G A B');
    if (note.hidden || !/room/.test(note.textContent)){
      bad.push(`too many chords was not reported: "${note.textContent}"`);
    }

    // and typing sets the key rather than reading against it
    set('F Bb C F');
    if (!/F/.test(q('#keyReadout').textContent)) bad.push(`typing F Bb C F left the key reading "${q('#keyReadout').textContent}"`);
    t.equal(bad.join('; '), '', 'A typed progression goes in a bar at a time, and a bad word refuses the line');
  }

  // A suggested part stays put until you move it. The neck follows the
  // playing chord, and in one position that re-picks the box on every
  // change — so a part that followed the window came out as different notes
  // on every chord and read as changing every time round. The window the
  // part was set in is the window it stays in: the neck moving by itself
  // must leave it alone, and only your own moves — the arrows, a new part,
  // new fills — may change it.
  function testThePartStaysPut(t){
    start();
    const bad = [];
    const view = GT.fretboardView;
    const notesOf = () => JSON.stringify(GT.practice.partState().notes);

    // a blues feel in one position, so there is a part to have
    q('#styleGroup .genre-btn[data-value="blues.0"]').click();
    view.applyViewState('m:penta.p:position');
    q('#chartViewGroup .seg-btn[data-value="part"]').click();
    const first = notesOf();
    if (first === '[]'){ bad.push('turning the part on gave no notes'); }
    else {
      // the neck re-picking its box, as it does on every chord while playing:
      // a different window, no hand on the arrows
      const before = GT.practice.partState().window;
      view.applyViewState('m:penta.p:position.b:2');
      const moved = JSON.stringify(view.positionView().window) !== JSON.stringify(before);
      if (!moved) bad.push('could not move the neck to test against (box 2 is where it already was)');
      if (notesOf() !== first) bad.push('the neck moving by itself re-realised the part');
      if (JSON.stringify(GT.practice.partState().window) !== JSON.stringify(before)){
        bad.push('the part followed the neck to a new window');
      }

      // ...whereas stepping the box yourself moves it into the new window
      q('#boxNext').click();
      const after = GT.practice.partState().window;
      if (JSON.stringify(after) === JSON.stringify(before)) bad.push('stepping the box left the part in the old window');

      // and new fills are a new seed in the same window: the figures may
      // roll too now (a part can roll its figures, tag tails on them, put a
      // lead in the fill bars), but the part and where it sits do not move
      const was = GT.practice.partState();
      q('#partReroll').click();
      const now = GT.practice.partState();
      if (now.seed === was.seed) bad.push('re-rolling the fills kept the seed');
      if (JSON.stringify(now.window) !== JSON.stringify(was.window)) bad.push('re-rolling the fills moved the part');
    }
    q('#chartViewGroup .seg-btn[data-value="chart"]').click();
    if (notesOf() !== '[]') bad.push('going back to the chart left notes behind');
    if (q('#chords').hidden) bad.push('the chart did not come back');

    // The part view chosen while the neck has no position yet — which is
    // how a link opens — has to come good once the neck settles, without
    // anyone pressing anything. It stayed on "switch to one position" while
    // looking at one, because the window wasn't a reason to look again.
    // In position, but with no window: the box readings skip diminished
    // chords, so a progression of nothing else gives the neck no box to be
    // in — the same state a link is in before its chords have loaded.
    view.applyViewState('m:penta.p:position');
    const type = text => { q('#chordText').value = text; q('#chordTextApply').click(); };
    type('Bdim Bdim Bdim Bdim');
    q('#chartViewGroup .seg-btn[data-value="part"]').click();
    if (q('#partNote').hidden) bad.push('with no box to be in, the part view gave no reason for being empty');
    if (view.positionView().window) bad.push('(the diminished progression still had a window, so this proves nothing)');
    type('C F G C');                                // now there is a box, and nothing else changed
    if (!q('#partNote').hidden || notesOf() === '[]') bad.push('the part view did not come good once the neck had a box');
    q('#chartViewGroup .seg-btn[data-value="chart"]').click();
    view.applyViewState('');
    t.equal(bad.join('; '), '', 'A part stays in the window it was set in until you move it');
  }

  // The tab names a chord where it arrives and not over the bars it holds
  // through, so the follower has fewer names than bars. Walked bar by bar it
  // has to light the name the bar is under and, above all, get to the end:
  // it once threw at the first bar past the last name, and the tab stood
  // still from there while the band played on.
  function testTheTabFollowsHeldBars(t){
    start();
    const bad = [];
    const view = GT.fretboardView;
    q('#styleGroup .genre-btn[data-value="blues.0"]').click();
    view.applyViewState('m:penta.p:position');
    // A held for three bars, D for two, then E, D, A: eight bars, five names
    GT.practice.loadProgression({ chords: ['A', 'A', 'A', 'D', 'D', 'E', 'D', 'A'], key: 'A' });
    q('#chartViewGroup .seg-btn[data-value="part"]').click();
    const names = [...document.querySelectorAll('#partTab .tab-chord')].map(el => `${el.dataset.bar}:${el.textContent}`);
    t.equal(names.join(' '), '0:A 3:D 5:E 6:D 7:A', 'The tab names a chord where it arrives, tagged with its bar');
    const expect = ['A', 'A', 'A', 'D', 'D', 'E', 'D', 'A'];
    for (let bar = 0; bar < 8; bar++){
      try {
        GT.practice.showPartBar(bar);
        const lit = GT.practice.partState().named;
        if (lit.join() !== expect[bar]) bad.push(`bar ${bar} lit ${JSON.stringify(lit)}, wanted ${expect[bar]}`);
      } catch (err){ bad.push(`bar ${bar} threw: ${err.message}`); }
    }
    // The bars a chord lasts, changed in Set up, are bars the part has to
    // cover: it once redrew the chart and left the tab as it was until the
    // view was switched away and back.
    // ...taken off with the editor, a bar at a time: the first chord's
    // second bar deleted twice, three bars down to one
    for (let k = 0; k < 2; k++){
      document.querySelectorAll('#chords .bar')[1].click();
      q('#chordSlots .chord-row:not([hidden]) .remove').click();
    }
    const now = [...document.querySelectorAll('#partTab .tab-chord')].map(el => `${el.dataset.bar}:${el.textContent}`);
    t.equal(now.join(' '), '0:A 1:D 3:E 4:D 5:A', 'The tab follows a change to how long a chord lasts');
    q('#chartViewGroup .seg-btn[data-value="chart"]').click();
    view.applyViewState('');
    t.equal(bad.join('; '), '', 'Every bar of a held progression lights the name it is under');
  }


  // The tab as the audit left it: the tempo tapped in or nudged, the chart's
  // bars edited where they are (a tap opens one chord's row, + bar adds a
  // chord, × removes one), and the style picker grouped by genre with a
  // search that keeps a group while any of its feels matches.
  function testTheTabsControls(t){
    start();
    const bad = [];
    const { tapTempo, setTempo, getTempo } = GT.practice;
    setTempo(100);
    if (getTempo() !== 100) bad.push(`set to 100, read ${getTempo()}`);
    // three taps half a second apart: 120 BPM, whatever it was
    tapTempo(1000); tapTempo(1500); tapTempo(2000);
    if (getTempo() !== 120) bad.push(`three taps at 500ms gave ${getTempo()} BPM`);
    // a long pause starts a new count: one tap after it changes nothing
    tapTempo(9000);
    if (getTempo() !== 120) bad.push(`a lone tap after a pause changed the tempo to ${getTempo()}`);
    tapTempo(9400);
    if (getTempo() !== 150) bad.push(`taps 400ms apart gave ${getTempo()} BPM, not 150`);
    q('#tempoUp').click();
    if (getTempo() !== 155) bad.push(`+ gave ${getTempo()}`);
    q('#tempoDown').click(); q('#tempoDown').click();
    if (getTempo() !== 145) bad.push(`− − gave ${getTempo()}`);
    setTempo(5000);
    if (getTempo() > Number(q('#tempo').max)) bad.push(`the tempo went past the slider's top: ${getTempo()}`);

    // the chart's bars: one row a chord, shown for the bar tapped
    while (Number(q('#chordCountValue').textContent) > 1) q('#chordCountDown').click();
    const rows = () => [...document.querySelectorAll('#chordSlots .chord-row')];
    const bars = () => [...document.querySelectorAll('#chords .bar')];
    if (rows().length !== 1) bad.push(`one chord has ${rows().length} editor rows`);
    const wasBars = bars().length, lastName = bars()[bars().length - 1].querySelector('.chord-name').textContent;
    q('#chords .add-bar').click();
    if (rows().length !== 2 || Number(q('#chordCountValue').textContent) !== 2) bad.push(`+ bar left ${rows().length} rows and a count of ${q('#chordCountValue').textContent}`);
    // one bar, of the chord before it, and the control has moved to the new last bar
    if (bars().length !== wasBars + 1) bad.push(`+ bar added ${bars().length - wasBars} bars`);
    if (bars()[bars().length - 1].querySelector('.chord-name').textContent !== lastName) bad.push('the added bar is not the last chord again');
    if (!bars()[bars().length - 1].querySelector('.add-bar')) bad.push('the + did not move to the new last bar');
    bars()[bars().length - 1].click();
    const shown = rows().filter(r => !r.hidden).map(r => r.dataset.chord);
    if (shown.join() !== '1') bad.push(`tapping the last bar showed rows ${shown.join(',') || 'none'}`);
    if (q('#barEditor').hidden) bad.push('tapping a bar did not open its editor');
    rows()[1].querySelector('.remove').click();
    if (rows().length !== 1) bad.push(`× left ${rows().length} rows`);
    if (!q('#barEditor').hidden) bad.push('the editor stayed open after the chord went');
    // a chord held for two: editing its second bar splits it, and × takes one bar only
    q('#chordCountUp').click();                                  // a second chord, two bars long
    const barsNow = bars().length;
    bars()[barsNow - 1].click();                                 // its second bar
    q('#chordSlots .chord-row:not([hidden]) .bar-type-field').value = 'Bbm7';
    q('#chordSlots .chord-row:not([hidden]) .bar-type-set').click();
    if (rows().length !== 3) bad.push(`naming a held chord's second bar left ${rows().length} slots, not 3`);
    if (bars()[barsNow - 1].querySelector('.chord-name').textContent !== 'Bbm7') bad.push(`the named bar reads ${bars()[barsNow - 1].querySelector('.chord-name').textContent}`);
    if (bars()[barsNow - 2].querySelector('.chord-name').textContent === 'Bbm7') bad.push('naming one bar renamed the bar before it');
    bars()[barsNow - 2].click();                                 // the held chord's remaining bar
    q('#chordSlots .chord-row:not([hidden]) .remove').click();
    if (bars().length !== barsNow - 1) bad.push(`× on a bar took ${barsNow - bars().length} bars`);
    for (let guard = 0; bars().length > 1 && guard < 20; guard++){ bars()[bars().length - 1].click(); q('#chordSlots .chord-row:not([hidden]) .remove').click(); }
    if (bars().length !== 1) bad.push(`deleting bar by bar stopped at ${bars().length}`);
    if (!rows()[0].querySelector('.remove').disabled) bad.push('the last bar can be removed');

    // the picker: a group a genre, the same buttons the bar's select has
    const groups = [...document.querySelectorAll('#styleGroup .style-genre')];
    const wantGroups = 1 + Object.keys(GT.audio.STYLES).length;
    if (groups.length !== wantGroups) bad.push(`${groups.length} genre groups, not ${wantGroups}`);
    groups.forEach(g => {
      const n = Number((g.querySelector('h4 small') || {}).textContent);
      if (n !== g.querySelectorAll('.genre-btn').length) bad.push(`${g.dataset.genre} says ${n} but lists ${g.querySelectorAll('.genre-btn').length}`);
    });
    const search = q('#styleSearch');
    search.value = 'waltz'; search.dispatchEvent(new Event('input'));
    const seen = [...document.querySelectorAll('#styleGroup .genre-btn')].filter(b => !b.hidden).map(b => b.textContent);
    if (seen.some(n => !/waltz/i.test(n)) || seen.length < 2) bad.push(`searching "waltz" shows ${seen.join(', ')}`);
    if ([...document.querySelectorAll('#styleGroup .style-genre')].filter(g => !g.hidden).some(g => !g.querySelector('.genre-btn:not([hidden])'))) bad.push('an empty group stayed after the search');
    search.value = ''; search.dispatchEvent(new Event('input'));
    if ([...document.querySelectorAll('#styleGroup .genre-btn')].some(b => b.hidden)) bad.push('clearing the search left a feel hidden');
    t.equal(bad.join('; '), '', 'The tempo taps in, the chart edits in place, the picker is grouped and searchable');
  }

  // The band has a volume of its own — one gain on its bus in the engine —
  // beside the part's, and it travels in the link like the rest.
  function testTheBandHasAVolume(t){
    start();
    const bad = [];
    const slider = q('#bandVolume'), mute = q('#bandMute');
    const set = v => { slider.value = String(v); slider.dispatchEvent(new Event('input', { bubbles: true })); };
    set(40);
    if (Math.abs(GT.audio.bandLevel() - 0.4) > 1e-9) bad.push(`slider at 40 gave the engine ${GT.audio.bandLevel()}`);
    mute.click();
    if (GT.audio.bandLevel() !== 0) bad.push(`muted, the engine still has ${GT.audio.bandLevel()}`);
    if (mute.getAttribute('aria-pressed') !== 'true') bad.push('the mute button does not show as pressed');
    if (slider.value !== '40') bad.push(`muting moved the slider to ${slider.value}`);
    q('#shareBtn').click();
    const link = location.hash;
    if (!/[#&]b=40\.m(&|$)/.test(link)) bad.push(`the link carries the band as "${(link.match(/b=[^&]*/) || [''])[0]}"`);
    mute.click(); set(100);                    // back to nothing to say
    q('#shareBtn').click();
    if (/[#&]b=/.test(location.hash)) bad.push('at its default the band is still in the link');
    location.hash = '#practice-elsewhere';
    location.hash = link;                      // and the link brings it back
    if (GT.audio.bandLevel() !== 0 || slider.value !== '40') bad.push(`the link brought back level ${GT.audio.bandLevel()}, slider ${slider.value}`);
    set(60);                                   // moving the slider unmutes, as the part's does
    if (Math.abs(GT.audio.bandLevel() - 0.6) > 1e-9 || mute.getAttribute('aria-pressed') !== 'false') bad.push('moving the slider did not unmute');
    set(100);
    // the link this left in the address bar would be the next run's starting
    // state — a page loaded on a link doesn't round-trip that same link
    history.replaceState(null, '', location.pathname);
    t.equal(bad.join('; '), '', 'The band has a volume of its own that the link remembers');
  }

  // The tab was "CAGED practice" for its first year and its links carry that
  // name. Renamed, the old slug still opens it, and the state after the
  // question mark comes through the rename rather than being dropped when
  // the address is rewritten to the new name.
  function testTheOldTabNameStillOpensIt(t){
    const bad = [];
    const tabs = document.createElement('div');
    tabs.innerHTML = '<button type="button" class="site-tab active" data-tab="caged">Practice</button>'
      + '<button type="button" class="site-tab" data-tab="finder">Chord finder</button>';
    document.body.appendChild(tabs);
    const page = document.getElementById('page-caged');
    page.classList.add('tab-page');
    const other = document.createElement('div'); other.className = 'tab-page'; other.id = 'page-finder';
    document.body.appendChild(other);
    history.replaceState(null, '', '#caged-practice?k=major%3AD&c=0.2.');
    GT.tabs.init({});
    if (page.hidden) bad.push('the old name did not open the practice tab');
    if (location.hash !== '#practice?k=major%3AD&c=0.2.') bad.push(`the address became ${location.hash}`);
    // wired up, the tabs would go on writing the practice tab's state into
    // this page's address — which the next run would then open on
    GT.tabs.setState = () => {};
    GT.tabs.goTo = () => {};
    history.replaceState(null, '', location.pathname);
    t.equal(bad.join('; '), '', 'A link to "CAGED practice" opens Practice with its state intact');
  }

  GT.practiceSuites = [
    ['Practice: a shared link round-trips', testShareLinkRoundTrips],
    ['Practice: the styles are one list', testTheStyleListIsOneList],
    ['Practice: a hit ends when the next begins', testAHitEndsWhenTheNextBegins],
    ['Practice: the downbeat is an accent, not another instrument', testTheDownbeatIsAnAccentNotAnInstrument],
    ['Practice: every root is on the picker', testEveryRootIsOnThePicker],
    ['Practice: a root outside the key travels with it', testAnOutsideRootTravels],
    ['Practice: a variant the mode drops takes its preset with it', testModeLockedVariantDropsItsPreset],
    ['Practice: a hidden variant row is empty', testHiddenVariantRowIsEmpty],
    ['Practice: the transports stay in step', testTransportsStayInStep],
    ['Practice: a stall slips the progression, it does not pile up notes', testTheSchedulerNeverQueuesThePast],
    ['Practice: stopping calls off the queue and mutes what is ringing', testStoppingCallsOffWhatIsQueued],
    // last: it types a progression of its own in, and the fixture is shared
    ['Practice: typing a progression', testTypingAProgression],
    ['Practice: a part stays put until you move it', testThePartStaysPut],
    ['Practice: the tab follows held bars', testTheTabFollowsHeldBars],
    ['Practice: the tempo taps in, the chart edits in place, the picker is grouped', testTheTabsControls],
    ['Practice: the band has a volume', testTheBandHasAVolume],
    ['Practice: the old tab name still opens it', testTheOldTabNameStillOpensIt],
  ];
})();
