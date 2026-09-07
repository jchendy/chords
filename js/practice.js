// The CAGED practice tab: rolling a progression, the chord display and its
// settings, and the playback transport that drives both the audio and the
// on-screen highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_COMMON, MINOR_COMMON, LEADING_TONE, SEMITONE,
    pick, buildDiatonicChords, displayName, chordFromName, parseChordName, NOTE_NAMES_SHARP, SUFFIX,
  } = GT.theory;
  const audio = GT.audio;
  const {
    ensureAudio, noteFreq, chordFrequencies, bassFreqAt, walkBassFreq, STYLES, ROOT_OCTAVE,
    playNote, playChord, playBass, playHiHat, playRide, playKick, playSnare, playStyleVoice,
  } = GT.audio;
  const view = GT.fretboardView;

  let currentProgression = [];
  let chordCount = 3;
  const MAX_CHORDS = 12;        // enough to hold a twelve-bar blues once repeats are merged
  // The key and every chord are always something concrete you can read off the
  // pickers; randomness is a button you press, not a state a slot sits in. A
  // slot holds the scale degree it's on — or null, which means only that this
  // chord isn't a degree of the key at all (one loaded from a genre example),
  // and its picker names the chord itself instead.
  let slotChoices = [0, 0, 0];          // per slot: the diatonic degree it's on
  let slotMeasures = [];                // per slot: how many measures that chord lasts
  let slotShapes = [];                // per slot: the shape you chose, or null to follow the key
  let loadedLabel = null;               // set when a progression came in from elsewhere
  let currentMode = 'major';
  let currentTonic = 'C';
  let currentDiatonic = [];             // the chord choices available for the current key

  const keySelect = document.getElementById('keySelect');
  // The chart carries a copy of the two pickers you reach for while playing.
  // They're views onto the same state, not a second copy of it: each mirrors
  // the real picker's options and forwards a change straight to it.
  const quickKey = document.getElementById('quickKey');
  const quickPreset = document.getElementById('quickPreset');
  const mirror = (from, to) => { to.innerHTML = from.innerHTML; to.value = from.value; };
  const forward = (from, to) => { to.value = from.value; to.dispatchEvent(new Event('change')); };
  const chordSlotsEl = document.getElementById('chordSlots');

  // chords a manual slot can be set to: the 7 diatonic triads, plus the
  // harmonic-minor V (degree 7) in minor keys
  function keyChordChoices(){
    const base = buildDiatonicChords(currentMode, currentTonic).map((c, i) => ({ ...c, deg: i }));
    if (currentMode === 'minor'){
      const five = base[4];
      base.push({
        note: five.note, third: LEADING_TONE[currentTonic], fifth: five.fifth, seventh: five.seventh,
        quality: 'maj', numeral: 'V', name: five.note, deg: 7,
      });
    }
    return base;
  }

  function randomDegreePool(){
    const common = currentMode === 'major' ? MAJOR_COMMON : MINOR_COMMON;
    return commonToggle.checked ? common.slice() : [0, 1, 2, 3, 4, 5, 6];
  }

  function rollDegree(prevDeg){
    const pool = randomDegreePool();
    let d = pick(pool);
    if (pool.length > 1 && d === prevDeg) d = pick(pool.filter(x => x !== prevDeg));
    if (currentMode === 'minor' && d === 4 && Math.random() < 0.5) d = 7;  // harmonic V
    return d;
  }

  // Name the shape a chord is currently in — the key a slot stores.
  function shapeOf(chord){
    if (!chord.seventh) return chord.quality === 'min' ? 'min' : chord.quality === 'dim' ? 'dim' : 'maj';
    const iv = ((SEMITONE[chord.seventh] - SEMITONE[chord.note]) % 12 + 12) % 12;
    if (chord.quality === 'dim') return iv === 9 ? 'dim7' : 'm7♭5';
    if (chord.quality === 'min') return 'm7';
    return iv === 11 ? 'maj7' : '7';
  }

  // The seventh a key's own scale puts on a degree — what "use 7ths" rolls.
  // Read from the diatonic list, since a chord built as a triad has none.
  function diatonicSeventhFor(deg){
    const c = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0];
    return shapeOf(c);
  }

  // the flat-7 that keeps the triad it's built on
  function flatSeventh(quality){
    return quality === 'dim' ? 'm7♭5' : quality === 'min' ? 'm7' : '7';
  }

  // Every shape a slot can be set to, as a triad plus an optional seventh
  // (semitones above the root). A slot isn't limited to the chord its key
  // gives that degree — this is how you get a secondary dominant on the ii, a
  // borrowed minor iv, or a major III.
  const CHORD_SHAPES = {
    maj:    { triad: 'maj', seventh: null, label: 'Major' },
    min:    { triad: 'min', seventh: null, label: 'Minor' },
    dim:    { triad: 'dim', seventh: null, label: 'dim'   },
    '7':    { triad: 'maj', seventh: 10,   label: '7'     },
    maj7:   { triad: 'maj', seventh: 11,   label: 'maj7'  },
    m7:     { triad: 'min', seventh: 10,   label: 'm7'    },
    'm7♭5': { triad: 'dim', seventh: 10,   label: 'm7♭5'  },
    dim7:   { triad: 'dim', seventh: 9,    label: 'dim7'  },
  };

  // The five everyday shapes, plus the diminished ones on the one degree whose
  // own chord is diminished — otherwise the vii° couldn't be spelled at all.
  function shapeOptions(quality){
    const dim = quality === 'dim';
    return ['maj', 'min', ...(dim ? ['dim'] : []), '7', 'maj7', 'm7',
            ...(dim ? ['m7♭5', 'dim7'] : [])];
  }

  const triadShapeOf = quality => quality === 'min' ? 'min' : quality === 'dim' ? 'dim' : 'maj';

  // The shape a slot should take: whatever you set it to, otherwise the key's
  // own triad — or the key's own seventh, if random slots are set to come up
  // as sevenths. Leaving that last case implicit rather than writing it into
  // `slotShapes` is what lets the checkbox turn triads into sevenths and
  // back without disturbing anything else about the progression.
  // Two of the stored shapes are relative to the key rather than fixed, so a
  // preset keeps its meaning when the key changes mode: `dia7` is the key's
  // own seventh on that degree (the ii of a ii–V–I is m7 in major, m7♭5 in
  // minor), `flat7` is the key's triad with a flat 7 (a blues I is I7 in
  // major, i7 in minor).
  function resolveShape(shape, deg){
    if (shape === 'dia7') return diatonicSeventhFor(deg);
    if (shape === 'flat7') return flatSeventh(chordForDegree(deg).quality);
    return shape;
  }

  function shapeFor(i, deg){
    if (slotShapes[i]) return resolveShape(slotShapes[i], deg);
    // A chord whose shape you haven't set follows the key — as its triad, or
    // as the seventh the key puts on that degree when "Use 7ths" is on. That's
    // what lets the checkbox swap triads for sevenths where they stand without
    // disturbing a single root, degree or bar length.
    if (randomSeventhsToggle.checked) return diatonicSeventhFor(deg);
    return null;
  }

  // the two shapes the key itself puts on a degree: its triad and its 7th
  function diatonicShapesFor(deg){
    const c = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0] || {};
    return [triadShapeOf(c.quality), diatonicSeventhFor(deg)];
  }

  // Re-cast a roman numeral for a quality the key doesn't give that degree —
  // a borrowed iv, a secondary V7 sitting on the ii, a diminished vii°.
  function recaseNumeral(numeral, triad){
    const plain = numeral.replace('°', '');
    if (triad === 'maj') return plain.toUpperCase();
    if (triad === 'min') return plain.toLowerCase();
    return plain.toLowerCase() + '°';
  }

  // Build a degree's chord in whichever shape that slot asks for. Passing
  // nothing gives the key's own triad, which is what lets an untouched slot
  // follow along when the key or the mode changes.
  function chordForDegree(deg, shape){
    const c = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0];
    const chord = { ...c, _deg: c.deg, _shape: shape || null };
    const spec = CHORD_SHAPES[shape];

    if (!spec){ chord.seventh = null; return chord; }

    const at = semis => NOTE_NAMES_SHARP[((SEMITONE[chord.note] + semis) % 12 + 12) % 12];
    if (spec.triad !== chord.quality){
      chord.third = at(spec.triad === 'maj' ? 4 : 3);
      chord.fifth = at(spec.triad === 'dim' ? 6 : 7);
      chord.quality = spec.triad;
      chord.name = chord.note + SUFFIX[spec.triad];
      chord.numeral = recaseNumeral(chord.numeral, spec.triad);
    }
    chord.seventh = spec.seventh == null ? null : at(spec.seventh);
    return chord;
  }

  // Roll every chord afresh. The key stays where it is — that's the other
  // button's job — so this is only ever "give me different chords in this key".
  function randomizeChords(){
    const degs = [];
    for (let i = 0; i < chordCount; i++){
      degs.push(rollDegree(degs.length ? degs[degs.length - 1] : -1));
    }
    // a progression that never touches its tonic doesn't sound like it's in a
    // key at all, so plant one somewhere
    if (!degs.includes(0)) degs[Math.floor(Math.random() * degs.length)] = 0;

    slotChoices = degs;
    slotShapes = degs.map(() => null);   // freshly rolled chords follow the key
    rebuildProgression();
  }

  // Build the chords from what the pickers say. Everything that changes a
  // degree, a shape or the key comes back through here.
  function rebuildProgression(){
    currentProgression = slotChoices.map((deg, i) =>
      deg == null ? currentProgression[i] : chordForDegree(deg, shapeFor(i, deg)));
  }

  // A whole progression, chosen for you: how many chords, how long each one
  // holds, and then the chords themselves. Short and squarish on purpose —
  // two to four chords of a bar or two is the shape of most things worth
  // practising over, and anything longer is better built by hand.
  function randomizeProgression(){
    setSlotCount(2 + Math.floor(Math.random() * 3));          // 2, 3 or 4
    slotMeasures = slotChoices.map(() => 1 + Math.floor(Math.random() * 2));
    randomizeChords();   // degrees and shapes, honouring the two roll settings
  }

  // A different key, chosen for you — the same progression lands in it, since
  // each chord keeps its degree.
  function randomizeKey(){
    const mode = Math.random() < 0.5 ? 'major' : 'minor';
    const keys = Object.keys(mode === 'major' ? MAJOR_KEYS : MINOR_KEYS)
      .filter(t => !(mode === currentMode && t === currentTonic));
    transposeToKey(mode, pick(keys));
  }

  function buildKeySelect(){
    const grp = (label, obj, mode) =>
      `<optgroup label="${label}">` +
      Object.keys(obj).slice().sort().map(t => `<option value="${mode}:${t}">${t} ${mode}</option>`).join('') +
      `</optgroup>`;
    // one picker for all 24 keys, major and minor side by side; it always names
    // the key you're actually in, and the dice beside it picks a new one
    keySelect.innerHTML = grp('Major keys', MAJOR_KEYS, 'major') + grp('Minor keys', MINOR_KEYS, 'minor');
    keySelect.value = `${currentMode}:${currentTonic}`;
    mirror(keySelect, quickKey);
  }

  // ---- ready-made progressions -------------------------------------------
  const presetSelect = document.getElementById('presetSelect');
  const presetVariantRow = document.getElementById('presetVariantRow');
  const presetVariantGroup = document.getElementById('presetVariantGroup');
  let presetIdx = null;      // which preset is showing, if any
  let variantIdx = 0;

  // Put the tab in a key: the state, the diatonic chord list, and the key
  // picker that shows it. Doesn't touch the progression — callers rebuild or
  // transpose that themselves.
  function setKey(mode, tonic){
    currentMode = mode;
    currentTonic = tonic;
    currentDiatonic = keyChordChoices();
    buildKeySelect();
  }

  // the same tonic in the other mode when that key exists, else any key there
  function tonicIn(mode, tonic){
    const keys = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;
    return keys[tonic] ? tonic : pick(Object.keys(keys));
  }

  function applyPreset(preset, variant){
    // a preset written for one mode takes the key there first
    const mode = variant.mode || preset.mode;
    if (mode && mode !== currentMode) setKey(mode, tonicIn(mode, currentTonic));
    const chords = variant.chords.slice(0, MAX_CHORDS);
    setSlotCount(chords.length);
    // pinning each slot to its degree is what keeps the shape put — and what
    // leaves every chord editable from its own picker afterwards
    slotChoices = chords.map(c => c.deg);
    slotMeasures = chords.map(c => c.bars);
    // `maj` asks for a real dominant; `dom` keeps whatever triad the key gives
    // the degree and just flattens its 7th; `dia` takes the key's own 7th.
    // The last two are stored relative to the key, so they follow a change of
    // mode rather than freezing as whatever they were when the preset landed.
    slotShapes = chords.map(c => {
      if (c.dia) return 'dia7';
      if (!c.dom) return null;
      return c.maj ? '7' : 'flat7';
    });
    currentProgression = chords.map((c, i) => chordForDegree(c.deg, shapeFor(i, c.deg)));
    loadedLabel = null;
    renderAll();
  }

  // a preset or variant written for one mode only shows up in that mode
  const fitsMode = item => !item.mode || item.mode === currentMode;

  function renderPresetVariants(){
    // A variant written for one mode can't survive the key moving to the other.
    // Its degrees still transpose — the chart keeps playing — but what's on it
    // is no longer any variant this preset lists, so the selection has to go,
    // the way buildPresetSelect already drops a preset the mode has no room
    // for. Left alone the row sat there with nothing marked, still claiming a
    // preset while the chords underneath had come from somewhere else.
    if (presetIdx != null){
      const chosen = GT.progressionPresets[presetIdx].variants[variantIdx];
      if (!chosen || !fitsMode(chosen)){
        presetIdx = null;
        presetSelect.value = '';
        mirror(presetSelect, quickPreset);
      }
    }
    const preset = presetIdx == null ? null : GT.progressionPresets[presetIdx];
    const shown = preset ? preset.variants.map((v, i) => [v, i]).filter(([v]) => fitsMode(v)) : [];
    const many = shown.length > 1;
    presetVariantRow.hidden = !many;
    // Empty it even when the row is about to hide: leaving the last preset's
    // buttons behind means the group holds controls for a preset that isn't
    // selected any more, still carrying their click handlers.
    presetVariantGroup.innerHTML = '';
    if (!many) return;
    shown.forEach(([v, i]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === variantIdx ? ' active' : '');
      b.textContent = v.name;
      b.addEventListener('click', () => {
        variantIdx = i;
        renderPresetVariants();
        applyPreset(preset, preset.variants[i]);
      });
      presetVariantGroup.appendChild(b);
    });
  }

  // One picker, each entry named the way people name it, with the numerals
  // beside it — twelve buttons of roman numerals all looked the same. The
  // list follows the key: a major key offers the doo-wop and the canon, a
  // minor one the Andalusian cadence and the minor four-chord, and the ones
  // that work in both read with the numerals of the mode they're in.
  function buildPresetSelect(){
    const options = GT.progressionPresets
      .map((p, i) => [p, i])
      .filter(([p]) => fitsMode(p))
      .map(([p, i]) => {
        const numerals = currentMode === 'minor' && p.numeralsMinor ? p.numeralsMinor : p.numerals;
        return `<option value="${i}">${p.name}${numerals ? ' · ' + numerals : ''}</option>`;
      });
    presetSelect.innerHTML = `<option value="">None</option>` + options.join('');
    // a preset that doesn't exist in this mode is no longer the one showing
    if (presetIdx != null && !fitsMode(GT.progressionPresets[presetIdx])) presetIdx = null;
    presetSelect.value = presetIdx == null ? '' : String(presetIdx);
    mirror(presetSelect, quickPreset);
  }

  function loadPreset(i){
    presetIdx = i;
    const preset = GT.progressionPresets[presetIdx];
    variantIdx = preset.variants.findIndex(fitsMode);
    renderPresetVariants();
    applyPreset(preset, preset.variants[variantIdx]);
  }

  presetSelect.addEventListener('change', () => {
    if (presetSelect.value === ''){ clearPreset(); return; }
    loadPreset(Number(presetSelect.value));
  });

  // once you've changed something by hand it isn't that preset any more
  function clearPreset(){
    if (presetIdx == null) return;
    presetIdx = null;
    presetSelect.value = '';
    renderPresetVariants();
  }

  // Rolls every chord in the progression at once. Randomness is an action
  // here rather than a state a slot sits in, so this always has something to
  // do and the pickers always show what it came up with.
  const genBtn = document.getElementById('genBtn');
  const randomKeyBtn = document.getElementById('randomKeyBtn');

  // Which degree of the current key a slot is sitting on. Chords generated
  // here carry their degree; one loaded from a genre example doesn't, so match
  // it by root and fall back to the tonic.
  function degreeOf(i){
    if (slotChoices[i] != null) return slotChoices[i];
    const chord = currentProgression[i];
    if (!chord) return currentDiatonic[0].deg;
    if (chord._deg != null) return chord._deg;
    const rootPc = SEMITONE[chord.note] % 12;
    const match = currentDiatonic.find(c => SEMITONE[c.note] % 12 === rootPc);
    return match ? match.deg : currentDiatonic[0].deg;
  }

  function renderChordSlots(){
    chordSlotsEl.innerHTML = '';
    for (let i = 0; i < chordCount; i++){
      const slot = document.createElement('div');
      slot.className = 'chord-row';
      // the row number, so a chord can be talked about by position
      const num = document.createElement('span');
      num.className = 'chord-num';
      num.textContent = i + 1;
      slot.appendChild(num);

      const sel = document.createElement('select');
      sel.className = 'mini-select chord-degree';
      sel.setAttribute('aria-label', `Chord ${i + 1}`);
      // Just which degree of the key this is — the shape picker beside it says
      // whether it's a triad or a seventh, so naming one here would only
      // contradict the other. There's no "Random" entry: the picker always
      // names the chord that's actually sounding, and the dice roll the whole
      // progression at once.
      const degOptions = currentDiatonic
        .map(o => `<option value="${o.deg}">${o.name} · ${o.numeral}</option>`);
      // a chord loaded from a genre example may be no degree of this key at
      // all; it still gets to name itself, and picking anything else replaces it
      if (slotChoices[i] == null && currentProgression[i]){
        degOptions.unshift(`<option value="off">${displayName(currentProgression[i])}</option>`);
      }
      sel.innerHTML = degOptions.join('');
      sel.value = slotChoices[i] == null ? 'off' : String(slotChoices[i]);
      sel.addEventListener('change', () => {
        if (sel.value === 'off') return;         // it's already that chord
        slotChoices[i] = Number(sel.value);
        // a chord picked by hand starts from the key's own shape for it,
        // unless a shape was already set on this slot
        currentProgression[i] = chordForDegree(slotChoices[i], shapeFor(i, slotChoices[i]));
        loadedLabel = null;
        clearPreset();
        renderAll();
      });
      slot.appendChild(sel);

      // how long this particular chord lasts, so a progression can hold one
      // chord for four bars and the next for one
      const bars = document.createElement('select');
      bars.className = 'mini-select bars-select';
      bars.setAttribute('aria-label', `Measures for chord ${i + 1}`);
      bars.innerHTML = [1, 2, 3, 4, 6, 8]
        .map(n => `<option value="${n}">${n}</option>`).join('');
      bars.value = String(measuresFor(i));
      bars.addEventListener('change', () => {
        slotMeasures[i] = Number(bars.value) || DEFAULT_MEASURES;
        clearPreset();      // once the bar lengths change it isn't that preset any more
        renderChordDisplay();
        resetPlaybackCursor();
      });
      slot.appendChild(bars);

      // what shape the chord takes — free to leave the key, with a ✓ on the
      // two shapes the key itself gives this degree
      const sev = document.createElement('select');
      sev.className = 'mini-select seventh-select';
      sev.setAttribute('aria-label', `Chord quality for chord ${i + 1}`);
      sev.title = '✓ marks the shapes this key gives that degree';
      const deg = degreeOf(i);
      const dia = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0] || {};
      const inKey = diatonicShapesFor(deg);
      const options = shapeOptions(dia.quality);
      // whatever is actually sounding is always on the list, even a shape a
      // key change carried in from the other mode
      const sounding = shapeFor(i, deg);
      if (sounding && !options.includes(sounding)) options.push(sounding);
      sev.innerHTML = options.map(tok =>
        `<option value="${tok}">${CHORD_SHAPES[tok].label}${inKey.includes(tok) ? ' ✓' : ''}</option>`
      ).join('');
      // what this slot would be showing if you'd never touched it
      const implied = randomSeventhsToggle.checked ? diatonicSeventhFor(deg) : inKey[0];
      sev.value = shapeFor(i, deg) || inKey[0];
      sev.addEventListener('change', () => {
        // leaving the untouched choice unrecorded is what lets a slot follow
        // the key when you transpose or flip Major/Minor
        slotShapes[i] = sev.value === implied ? null : sev.value;
        currentProgression[i] = chordForDegree(deg, shapeFor(i, deg));
        clearPreset();
        renderAll();
      });
      slot.appendChild(sev);

      chordSlotsEl.appendChild(slot);
    }
  }

  // ---- hearing one chord on its own ---------------------------------------
  // Click a bar and just that chord sounds, whether or not the progression is
  // playing — for checking a shape against what it's supposed to sound like.
  function auditionBar(bar){
    const chord = currentProgression[Number(bar.dataset.chord)];
    if (!chord) return;
    ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    playChord(chord, audio.ctx().currentTime + 0.02, 1.8, 0.85);
    bar.classList.remove('rang');
    void bar.offsetWidth;            // restart the flash
    bar.classList.add('rang');
  }

  const chordsRoot = document.getElementById('chords');
  chordsRoot.addEventListener('click', e => {
    const bar = e.target.closest('.bar');
    if (bar) auditionBar(bar);
  });
  chordsRoot.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const bar = e.target.closest('.bar');
    if (!bar) return;
    // on a focused bar the space bar means "hear this one", not play/pause
    e.preventDefault();
    e.stopPropagation();
    auditionBar(bar);
  });

  // The display is laid out a bar at a time, the way a chart reads: a chord
  // held for three bars is written out three times. Four bars to a line.
  function barCells(){
    const cells = [];
    currentProgression.forEach((chord, i) => {
      for (let b = 0; b < measuresFor(i); b++){
        cells.push({ chord, chordIndex: i, bar: cells.length, held: b > 0 });
      }
    });
    return cells;
  }

  function barOffset(chordIndex){
    let bars = 0;
    for (let i = 0; i < chordIndex; i++) bars += measuresFor(i);
    return bars;
  }

  function renderChordDisplay(){
    const chordsEl = document.getElementById('chords');
    const cells = barCells();
    // seventh-chord names ("Bm7♭5") run much longer than triads ("Am"), so the
    // font follows the longest name as well as how many bars share the line
    const maxLen = Math.max(1, ...cells.map(c => displayName(c.chord).length));
    chordsEl.style.setProperty('--cols', Math.min(4, Math.max(1, cells.length)));
    chordsEl.style.setProperty('--len', maxLen);
    chordsEl.innerHTML = '';
    cells.forEach((cell, i) => {
      const item = document.createElement('div');
      item.className = 'bar' + (cell.held ? ' held' : '');
      item.dataset.bar = cell.bar;
      item.dataset.chord = cell.chordIndex;
      // each bar is a button that plays its own chord
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.title = `Play ${displayName(cell.chord)}`;
      item.style.animationDelay = `${Math.min(i, 8) * 55}ms`;
      item.innerHTML = `
        <span class="chord-name">${displayName(cell.chord)}</span>
        <span class="chord-numeral">${cell.chord.numeral}</span>
      `;
      chordsEl.appendChild(item);
    });
  }

  // render everything from the current progression WITHOUT re-rolling it
  function renderAll(){
    document.getElementById('keyReadout').textContent =
      loadedLabel || (currentMode === 'major' ? `${currentTonic} major` : `${currentTonic}m`);
    renderChordDisplay();
    renderChordSlots();
    buildPresetSelect();          // the list follows whichever mode the key is in
    renderPresetVariants();
    view.rebuildChordPicker();
    view.render();
    resetPlaybackCursor();
  }

  // roll a whole new set of chords, then render
  function render(){
    loadedLabel = null;
    clearPreset();
    randomizeChords();
    view.resetPosition();   // a newly-rolled progression starts at the lowest cluster
    renderAll();
  }

  genBtn.addEventListener('click', render);
  const randomKey = () => { clearPreset(); randomizeKey(); };
  randomKeyBtn.addEventListener('click', randomKey);
  document.getElementById('quickKeyDice').addEventListener('click', randomKey);
  document.getElementById('quickRandomChords').addEventListener('click', () => {
    loadedLabel = null;
    clearPreset();
    randomizeProgression();
    view.resetPosition();
    renderAll();
  });
  quickKey.addEventListener('change', () => forward(quickKey, keySelect));
  quickPreset.addEventListener('change', () => forward(quickPreset, presetSelect));

  keySelect.addEventListener('change', () => {
    const [m, t] = keySelect.value.split(':');
    const known = (m === 'major' && MAJOR_KEYS[t]) || (m === 'minor' && MINOR_KEYS[t]);
    if (!known){          // the option list changed under us
      buildKeySelect();
      return;
    }
    // Same progression, other key: each chord keeps its degree, so picking C
    // minor from C major turns I–V–vi–IV into i–v–VI–iv rather than rolling
    // something unrelated.
    transposeToKey(m, t);
  });

  // Move the progression to another key rather than rolling a new one: each
  // chord keeps its scale degree, so a I–V–vi–IV in A becomes the I–V–vi–IV of
  // wherever you land. Chords that aren't degrees of the old key — a
  // progression loaded from a genre example — are shifted by the same interval.
  function transposeToKey(mode, tonic){
    const shift = ((SEMITONE[tonic] - SEMITONE[currentTonic]) % 12 + 12) % 12;
    currentMode = mode;
    currentTonic = tonic;
    currentDiatonic = keyChordChoices();
    const validDegs = new Set(currentDiatonic.map(c => c.deg));

    currentProgression = currentProgression.map((chord, i) => {
      if (chord._deg != null && validDegs.has(chord._deg)){
        return chordForDegree(chord._deg, shapeFor(i, chord._deg));
      }
      const moved = transposeChord(chord, shift);
      // A pin the new key has no degree for — the harmonic-minor V, on the way
      // out of a minor key — still lands on a chord the new key does contain.
      // Re-pin it there rather than handing the slot back to Random, which
      // would leave the picker saying "Random" over a chord that never moves.
      const rootPc = SEMITONE[moved.note] % 12;
      const match = chord._deg != null
        ? currentDiatonic.find(c => SEMITONE[c.note] % 12 === rootPc) : null;
      if (match){
        slotChoices[i] = match.deg;
        slotShapes[i] = shapeOf(moved);
        return chordForDegree(match.deg, slotShapes[i]);
      }
      // Otherwise it's a chord of no degree at all (one loaded from a genre
      // example). Spell its shape out, so its picker describes what's sounding.
      slotShapes[i] = shapeOf(moved);
      return moved;
    });

    // a degree the new key has no chord for is re-pinned above, or else the
    // chord stays as a plain transposition and its picker names it
    slotChoices = slotChoices.map(s => (s == null || validDegs.has(s)) ? s : null);
    loadedLabel = null;      // it's no longer the key that progression came in
    buildKeySelect();        // the picker always names the key you're in
    renderAll();
  }

  // spell a note the way the current key does, so moving to Eb gives Bb, not A#
  function noteNameInKey(pc){
    const scale = (currentMode === 'major' ? MAJOR_KEYS : MINOR_KEYS)[currentTonic] || [];
    return scale.find(n => SEMITONE[n] % 12 === pc) || NOTE_NAMES_SHARP[pc];
  }

  function transposeChord(chord, shift){
    const move = note => note == null ? null
      : noteNameInKey(((SEMITONE[note] + shift) % 12 + 12) % 12);
    const note = move(chord.note);
    return Object.assign({}, chord, {
      note,
      third: move(chord.third),
      fifth: move(chord.fifth),
      seventh: move(chord.seventh),
      name: note + (chord.name || '').slice((chord.note || '').length),
      // Shifted by an interval rather than rebuilt from a degree: whatever
      // degree it used to be, it isn't one of this key's, so saying so would
      // only mislead the pickers that read it.
      _deg: null,
      _shape: null,
    });
  }

  const tempoInput = document.getElementById('tempo');
  const tempoVal = document.getElementById('tempoVal');
  // Two of them: one floating clear of the page so it's always in reach, one
  // in the transport list where the rest of the playback controls are. They
  // are the same control, so they carry the same label and state.
  const playBtns = [...document.querySelectorAll('.play-btn')];
  const commonToggle = document.getElementById('commonToggle');
  const randomSeventhsToggle = document.getElementById('randomSeventhsToggle');
  const clickToggle = document.getElementById('clickToggle');
  const countInToggle = document.getElementById('countInToggle');
  const rootOnlyToggle = document.getElementById('rootOnlyToggle');
  const measureReadout = document.getElementById('measureReadout');

  const chordCountValue = document.getElementById('chordCountValue');

  const DEFAULT_MEASURES = 2;   // what a freshly rolled chord lasts
  let noteBeats = 1;
  let currentStyle = 'simple';   // 'simple' | a key of STYLES
  let currentVariant = 0;        // index into STYLES[currentStyle].variants

  const noteValueRow = document.getElementById('noteValueRow');
  const rootOnlyRow = document.getElementById('rootOnlyRow');
  const clickRow = document.getElementById('clickRow');
  const styleVariantRow = document.getElementById('styleVariantRow');
  const styleVariantGroup = document.getElementById('styleVariantGroup');

  function renderVariantButtons(){
    styleVariantGroup.innerHTML = '';
    if (currentStyle === 'simple') return;
    STYLES[currentStyle].variants.forEach((variant, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === currentVariant ? ' active' : '');
      b.textContent = variant.label;
      b.addEventListener('click', () => {
        currentVariant = i;
        renderVariantButtons();
      });
      styleVariantGroup.appendChild(b);
    });
  }

  function updatePlaybackUI(){
    const simple = currentStyle === 'simple';
    noteValueRow.hidden = !simple;
    rootOnlyRow.hidden = !simple;
    clickRow.hidden = !simple;
    styleVariantRow.hidden = simple;
  }

  document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.genre-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
      currentStyle = btn.dataset.value;
      currentVariant = 0;
      renderVariantButtons();
      updatePlaybackUI();
    });
  });

  // Swaps triads for sevenths in place: the roots, the degrees, the bar
  // lengths and any chord you've set yourself all stay exactly as they are.
  randomSeventhsToggle.addEventListener('change', () => {
    currentProgression = currentProgression.map((chord, i) => {
      if (chord._deg == null) return chord;    // loaded from elsewhere; not ours to change
      return chordForDegree(chord._deg, shapeFor(i, chord._deg));
    });
    renderAll();
  });

  // resize the per-slot arrays to match; kept separate from setChordCount so a
  // loaded progression can set its own length without re-rolling itself away
  function setSlotCount(n){
    chordCount = Math.max(1, Math.min(MAX_CHORDS, n));
    chordCountValue.textContent = chordCount;
    // a slot added by the stepper comes up on a rolled degree, since every
    // slot always holds a real chord
    while (slotChoices.length < chordCount){
      slotChoices.push(rollDegree(slotChoices[slotChoices.length - 1]));
    }
    slotChoices.length = chordCount;
    while (slotMeasures.length < chordCount) slotMeasures.push(DEFAULT_MEASURES);
    slotMeasures.length = chordCount;
    while (slotShapes.length < chordCount) slotShapes.push(null);
    slotShapes.length = chordCount;
  }

  // Changing the count adds or drops a chord and leaves the rest alone —
  // there's no reason for it to throw away chords you chose.
  function setChordCount(n){
    setSlotCount(n);
    clearPreset();
    loadedLabel = null;
    rebuildProgression();
    renderAll();
  }
  document.getElementById('chordCountDown').addEventListener('click', () => {
    if (chordCount <= 1) return;
    setChordCount(chordCount - 1);
  });
  document.getElementById('chordCountUp').addEventListener('click', () => {
    if (chordCount >= MAX_CHORDS) return;
    setChordCount(chordCount + 1);
  });


  document.querySelectorAll('#noteValueGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#noteValueGroup .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      noteBeats = Number(btn.dataset.value);
    });
  });

  function getTempo(){ return Number(tempoInput.value); }
  // how many measures a given chord in the progression lasts, and the beats
  // that works out to (4/4 throughout)
  function measuresFor(i){ return slotMeasures[i] || DEFAULT_MEASURES; }
  function beatsForChord(i){ return measuresFor(i) * 4; }
  function getNoteBeats(){ return noteBeats; } // 1 = quarter, 2 = half, 4 = whole

  tempoInput.addEventListener('input', () => {
    tempoVal.textContent = `${getTempo()} BPM`;
    document.querySelectorAll('.bpm-preset')
      .forEach(b => b.classList.toggle('active', Number(b.dataset.bpm) === getTempo()));
  });

  document.querySelectorAll('.bpm-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      tempoInput.value = btn.dataset.bpm;
      tempoInput.dispatchEvent(new Event('input'));
    });
  });

  let isPlaying = false;
  let schedulerId = null;
  let nextNoteTime = 0;
  let chordIdx = 0;
  let beatInChord = 0;
  let scheduledLog = []; // {idx, time} for syncing the visual highlight
  let playbackStartTime = 0; // audioCtx time of the first chord (after any count-in)
  let countInFrom = null;    // audioCtx time of the first count-in click, or null for no count-in
  let countInSpb = 0;        // seconds per beat during the count-in

  const ICON_PLAY = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M3.5 2.2v11.6c0 .78.85 1.26 1.52.86l9.3-5.8c.65-.4.65-1.32 0-1.72l-9.3-5.8c-.67-.4-1.52.08-1.52.86Z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3.2" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/><rect x="9.4" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/></svg>';

  function setPlayLabel(text){
    const icon = text === 'Pause' ? ICON_PAUSE : ICON_PLAY;
    playBtns.forEach(b => {
      b.innerHTML = `${icon}<span>${text}</span>`;
      b.setAttribute('aria-label', text);
    });
  }

  function resetPlaybackCursor(){
    chordIdx = 0;
    beatInChord = 0;
    scheduledLog = [];
    view.resetFollow();
    document.querySelectorAll('#chords .bar').forEach(el => el.classList.remove('dim', 'active'));
    measureReadout.textContent = '';
  }


  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD_SEC = 0.12;

  function scheduleSimpleBeat(chord, secondsPerBeat, beatInMeasure, isDownbeat){
    const noteBeats = getNoteBeats();
    const shouldTrigger = beatInMeasure % noteBeats === 0;
    if (chord && shouldTrigger){
      const interval = secondsPerBeat * noteBeats;
      const duration = Math.min(interval * 2.3, 2.6 * noteBeats);
      const velocity = isDownbeat ? 1 : 0.62;
      if (rootOnlyToggle.checked){
        // boost the lone root so it sits at a similar loudness to a full triad
        playNote(noteFreq(chord.note, ROOT_OCTAVE), nextNoteTime, duration, velocity * 1.9);
      } else {
        playChord(chord, nextNoteTime, duration, velocity);
      }
      scheduledLog.push({
        idx: chordIdx, time: nextNoteTime,
        measure: Math.floor(beatInChord / 4) + 1,
        beat: (beatInChord % 4) + 1,
      });
    }
    if (clickToggle.checked) playHiHat(nextNoteTime);
  }

  function scheduleStyleBeat(style, chord, secondsPerBeat, beatInMeasure){
    const subPerBeat = style.grid / 4;
    const slotDur = secondsPerBeat / subPerBeat;
    const nextChord = currentProgression[(chordIdx + 1) % currentProgression.length];
    const approachNext = Math.floor(beatInChord / 4) === measuresFor(chordIdx) - 1;
    const accentEvery = style.grid / 4;

    for (let k = 0; k < subPerBeat; k++){
      const slot = beatInMeasure * subPerBeat + k;
      const t = nextNoteTime + k * slotDur;

      if (style.kick && style.kick.includes(slot)) playKick(t, style.kickVel || 0.9);
      if (style.snare && style.snare.includes(slot)) playSnare(t, style.snareVel || 0.85);
      if (style.hat && style.hat.includes(slot)){
        playHiHat(t, slot % accentEvery === 0 ? 0.55 : 0.32);
      }
      if (style.ride && style.ride.includes(slot)) playRide(t, 0.55);

      if (chord){
        const ce = style.chord && style.chord.find(e => e.slot === slot);
        if (ce) playStyleVoice(style.voice, chord, t, ce.dur * slotDur, ce.vel);

        const be = style.bass && style.bass.find(e => e.slot === slot);
        if (be){
          const freq = 'walk' in be
            ? walkBassFreq(chord, nextChord, be.walk, approachNext)
            : bassFreqAt(SEMITONE[chord.note] % 12, be.off, 2);
          playBass(freq, t, be.dur * slotDur, be.vel);
        }
      }
    }

    if (chord){
      scheduledLog.push({
        idx: chordIdx, time: nextNoteTime,
        measure: Math.floor(beatInChord / 4) + 1,
        beat: (beatInChord % 4) + 1,
      });
    }
  }

  function scheduler(){
    while (nextNoteTime < audio.ctx().currentTime + SCHEDULE_AHEAD_SEC){
      const chord = currentProgression[chordIdx];
      const secondsPerBeat = 60 / getTempo();
      const beatInMeasure = beatInChord % 4;

      if (currentStyle === 'simple'){
        scheduleSimpleBeat(chord, secondsPerBeat, beatInMeasure, beatInMeasure === 0);
      } else {
        scheduleStyleBeat(STYLES[currentStyle].variants[currentVariant], chord, secondsPerBeat, beatInMeasure);
      }

      nextNoteTime += secondsPerBeat;
      beatInChord++;
      if (beatInChord >= beatsForChord(chordIdx)){
        beatInChord = 0;
        chordIdx = (chordIdx + 1) % currentProgression.length;
      }
    }
    schedulerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function syncHighlight(){
    if (!isPlaying) return;
    const now = audio.ctx().currentTime;

    // during the count-in, show the running beat number where the
    // measure.beat readout normally sits
    if (countInFrom != null && now < playbackStartTime - 0.0005){
      const b = Math.min(4, Math.max(1, Math.floor((now - countInFrom) / countInSpb) + 1));
      measureReadout.textContent = String(b);
      requestAnimationFrame(syncHighlight);
      return;
    }

    while (scheduledLog.length > 1 && scheduledLog[1].time <= now){
      scheduledLog.shift();
    }
    const active = scheduledLog[0];
    if (active){
      const currentBar = barOffset(active.idx) + Math.min(active.measure, measuresFor(active.idx)) - 1;
      document.querySelectorAll('#chords .bar').forEach(el => {
        const isActive = Number(el.dataset.bar) === currentBar;
        el.classList.toggle('active', isActive);
        el.classList.toggle('dim', !isActive);
      });
      measureReadout.textContent =
        `${Math.min(active.measure, measuresFor(active.idx))}.${active.beat}`;
      view.followChord(active);
    }
    requestAnimationFrame(syncHighlight);
  }

  function stopPlayback(){ if (isPlaying) togglePlay(); }

  function togglePlay(){
    ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();

    if (!isPlaying){
      isPlaying = true;
      resetPlaybackCursor();
      nextNoteTime = audio.ctx().currentTime + 0.05;
      countInSpb = 60 / getTempo();
      // null when there's no count-in to show. The first chord is scheduled
      // 50ms out either way, and reading that gap as a count-in printed a
      // clamped "1" in the measure readout for those 50ms before the real
      // measure.beat took over.
      countInFrom = countInToggle.checked ? nextNoteTime : null;
      if (countInToggle.checked){
        for (let i = 0; i < 4; i++) playHiHat(nextNoteTime + i * countInSpb);
        nextNoteTime += 4 * countInSpb;
      }
      playbackStartTime = nextNoteTime;
      scheduler();
      requestAnimationFrame(syncHighlight);
      setPlayLabel('Pause');
      view.onPlaybackStarted();
    } else {
      isPlaying = false;
      clearTimeout(schedulerId);
      document.querySelectorAll('#chords .bar').forEach(el => el.classList.remove('dim', 'active'));
      measureReadout.textContent = '';
      setPlayLabel('Play');
      view.onPlaybackStopped();
    }
  }

  playBtns.forEach(b => b.addEventListener('click', togglePlay));
  // space bar starts and stops, unless you're typing somewhere
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat) return;
    if (document.getElementById('page-caged').hidden) return;
    if (GT.keys.typing(e.target)) return;
    e.preventDefault();
    togglePlay();
  });

  // ---- sharing a progression by link ---------------------------------------
  // The state rides in the URL fragment after the tab name:
  //   #caged-practice?k=major:C&c=0.2.maj7,3.1,4.1.7&t=90&s=blues.0
  // k = mode:tonic; c = one entry per chord as degree.bars.shape (shape blank
  // for the key's own triad); t = tempo; s = style.variant. A progression that
  // came in as chord names (from a genre example) is written as n = name.bars
  // instead, since its chords aren't degrees of anything.
  function shareState(){
    const p = new URLSearchParams();
    p.set('k', `${currentMode}:${currentTonic}`);
    if (currentProgression.every(c => c._deg != null)){
      p.set('c', currentProgression.map((c, i) => [c._deg, measuresFor(i), c._shape || ''].join('.')).join(','));
    } else {
      p.set('n', currentProgression.map((c, i) => `${displayName(c)}.${measuresFor(i)}`).join(','));
      if (loadedLabel) p.set('l', loadedLabel);
    }
    p.set('t', String(getTempo()));
    if (currentStyle !== 'simple') p.set('s', `${currentStyle}.${currentVariant}`);
    return p;
  }

  // Bring a shared link's state in. Returns false if there wasn't one, so the
  // caller can roll a progression as usual.
  function applyShareState(p){
    if (!p.get('k') || !(p.get('c') || p.get('n'))) return false;
    const [mode, tonic] = p.get('k').split(':');
    const table = mode === 'major' ? MAJOR_KEYS : mode === 'minor' ? MINOR_KEYS : null;
    if (!table || !table[tonic]) return false;
    setKey(mode, tonic);

    if (p.get('t')){
      tempoInput.value = p.get('t');
      tempoInput.dispatchEvent(new Event('input'));
    }
    if (p.get('s')){
      const [style, variant] = p.get('s').split('.');
      const btn = document.querySelector(`#styleGroup .genre-btn[data-value="${style}"]`);
      if (btn && STYLES[style]){
        btn.click();
        currentVariant = Math.min(Number(variant) || 0, STYLES[style].variants.length - 1);
        renderVariantButtons();
      }
    }

    if (p.get('n')){
      const entries = p.get('n').split(',').map(e => e.split('.'));
      const chords = [];
      entries.forEach(([name, bars]) => { for (let b = 0; b < (Number(bars) || 1); b++) chords.push(name); });
      loadProgression({ chords, label: p.get('l') || null, key: tonic });
      return true;
    }
    const entries = p.get('c').split(',').map(e => e.split('.'));
    const valid = new Set(currentDiatonic.map(c => c.deg));
    const kept = entries.filter(([deg]) => valid.has(Number(deg))).slice(0, MAX_CHORDS);
    if (!kept.length) return false;
    setSlotCount(kept.length);
    slotChoices = kept.map(([deg]) => Number(deg));
    slotMeasures = kept.map(([, bars]) => Math.max(1, Number(bars) || 1));
    slotShapes = kept.map(([, , shape]) => CHORD_SHAPES[shape] ? shape : null);
    currentProgression = kept.map(([deg], i) => chordForDegree(Number(deg), slotShapes[i]));
    renderAll();
    return true;
  }

  const shareBtn = document.getElementById('shareBtn');
  const shareOut = document.getElementById('shareOut');
  shareBtn.addEventListener('click', async () => {
    const slug = location.hash.slice(1).split('?')[0] || 'caged-practice';
    const url = `${location.href.split('#')[0]}#${slug}?${shareState()}`;
    try { history.replaceState(null, '', `#${slug}?${shareState()}`); } catch (e) { /* file:// can refuse */ }
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch (e) { /* no clipboard here */ }
    shareOut.value = url;
    shareOut.hidden = copied;
    if (!copied){ shareOut.focus(); shareOut.select(); }
    shareBtn.textContent = copied ? 'Link copied ✓' : 'Copy the link above';
    clearTimeout(shareBtn._reset);
    shareBtn._reset = setTimeout(() => { shareBtn.textContent = 'Copy link to this progression'; }, 2200);
  });

  // Take a progression from somewhere else in the app — a genre example, say —
  // and set the practice tab up to play it. Runs of the same chord collapse
  // into one chord held for that many measures, which is how a twelve-bar
  // blues fits into seven slots.
  function loadProgression({ chords, label, tempo, key }){
    if (!chords || !chords.length) return;
    stopPlayback();

    const runs = [];
    chords.forEach(name => {
      const last = runs[runs.length - 1];
      if (last && last.name === name) last.bars++;
      else runs.push({ name, bars: 1 });
    });
    const kept = runs.slice(0, MAX_CHORDS);

    // The progression's own key decides the roman numerals; without one, read
    // the first chord as the tonic. Nothing says which mode it's in, so read
    // that off the chord sitting on the tonic — a minor one means a minor
    // key, and its VI and VII are then written plainly, not as ♭VI and ♭VII.
    const tonicPc = key !== undefined && SEMITONE[key] !== undefined
      ? SEMITONE[key]
      : (SEMITONE[(chordFromName(kept[0].name) || {}).note] || 0);
    const tonicChord = kept.map(r => parseChordName(r.name)).find(p => p && p.rootPc % 12 === tonicPc % 12);
    const mode = tonicChord && tonicChord.formula.intervals.includes(3) ? 'minor' : 'major';
    const built = kept.map(r => chordFromName(r.name, tonicPc, mode)).filter(Boolean);
    if (!built.length) return;

    setSlotCount(built.length);
    // Move to the key it came in, so changing key from here shifts by the right
    // interval rather than from whatever was last generated — and so the chord
    // pickers rate its chords against the right scale.
    if (key && SEMITONE[key] !== undefined){
      const table = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;
      if (table[key]) setKey(mode, key);
      else currentTonic = key;
    }
    currentProgression = built;
    // A loaded chord that happens to be a degree of the key it came in gets
    // pinned to it, so its picker reads as a degree like every other slot;
    // one that isn't (a borrowed ♭VII, a secondary dominant) keeps null and
    // names itself instead.
    slotChoices = built.map(c => {
      const rootPc = SEMITONE[c.note] % 12;
      const match = currentDiatonic.find(d => SEMITONE[d.note] % 12 === rootPc
        && d.quality === c.quality);
      return match ? match.deg : null;
    });
    slotMeasures = kept.slice(0, built.length).map(r => r.bars);
    // spelled out rather than left to the key: a loaded progression is whatever
    // it is, so its pickers should show the chord that's actually sounding
    slotShapes = built.map(shapeOf);
    loadedLabel = label || null;
    if (tempo){
      tempoInput.value = tempo;
      tempoInput.dispatchEvent(new Event('input'));
    }
    renderAll();
  }

  GT.practice = {
    // leaving the tab shouldn't leave a progression playing behind you
    stop(){ if (isPlaying) togglePlay(); },
    loadProgression,
    init(){
      view.init({
        progression: () => currentProgression,
        isPlaying:   () => isPlaying,
        mode:        () => currentMode,
        tonic:       () => currentTonic,
        activeChord: () => scheduledLog[0],
      });
      updatePlaybackUI();
      setPlayLabel('Play');
      // A shared link doesn't only arrive on a cold page: it gets pasted into
      // the bar of a tab already open here, and back/forward walks between two
      // of them. tabs.js hears those, but it only switches tabs — the state
      // half of the fragment went unread, so the link quietly did nothing.
      // Our own writes go through history.replaceState, which fires neither
      // event, so this can't loop.
      ['hashchange', 'popstate'].forEach(e =>
        window.addEventListener(e, () => {
          if (isPlaying) togglePlay();      // don't leave the old one playing
          applyShareState(GT.tabs.stateParams());
        }));
      // A shared link opens on its progression; otherwise open on something
      // recognisable rather than a random roll — the first preset the key's
      // own mode offers, with the picker showing which one it is. The dice
      // are right there for a random one.
      if (!applyShareState(GT.tabs.stateParams())){
        const mode = Math.random() < 0.5 ? 'major' : 'minor';
        setKey(mode, pick(Object.keys(mode === 'major' ? MAJOR_KEYS : MINOR_KEYS)));
        const first = GT.progressionPresets.findIndex(fitsMode);
        if (first === -1) render();          // no preset for this mode: roll one
        else {
          loadPreset(first);
          buildPresetSelect();               // ...and show which one it is
          presetSelect.value = String(first);
        }
      }
    },
  };
})();
