// The CAGED practice tab: rolling a progression, the chord display and its
// settings, and the playback transport that drives both the audio and the
// on-screen highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_COMMON, MINOR_COMMON, LEADING_TONE, SEMITONE,
    pick, buildDiatonicChords, displayName, chordFromName, NOTE_NAMES_SHARP,
  } = GT.theory;
  const audio = GT.audio;
  const {
    ensureAudio, noteFreq, chordFrequencies, bassFreqAt, walkBassFreq, STYLES,
    playNote, playChord, playBass, playHiHat, playRide, playKick, playSnare, playStyleVoice,
  } = GT.audio;
  const view = GT.fretboardView;

  let currentProgression = [];
  let chordCount = 3;
  const MAX_CHORDS = 12;        // enough to hold a twelve-bar blues once repeats are merged
  let modeSetting = 'random';           // 'major' | 'minor' | 'random'
  let keyChoice = null;                 // null = random, else { mode, tonic }
  let slotChoices = [null, null, null]; // per slot: null = random, else a diatonic degree
  let slotMeasures = [];                // per slot: how many measures that chord lasts
  let loadedLabel = null;               // set when a progression came in from elsewhere
  let currentMode = 'major';
  let currentTonic = 'C';
  let currentDiatonic = [];             // the chord choices available for the current key

  const keySelect = document.getElementById('keySelect');
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

  // `opts.dom` flattens the 7th, so a degree reads as a dominant while keeping
  // the triad the key gives it — that's what makes a blues in a minor key come
  // out minor. `opts.maj` also raises the 3rd, for a genuine secondary
  // dominant like the VI7 in a jazz blues.
  function chordForDegree(deg, opts){
    const c = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0];
    const chord = { ...c, _deg: c.deg };
    const at = semis => NOTE_NAMES_SHARP[((SEMITONE[chord.note] + semis) % 12 + 12) % 12];
    if (opts && opts.maj){
      chord.third = at(4);
      chord.quality = 'maj';
      chord.name = chord.note;
      chord.numeral = chord.numeral.replace('°', '').toUpperCase();
      chord._maj = true;
    }
    if (opts && opts.dom){
      chord.seventh = at(10);
      chord._dom = true;
    }
    return chord;
  }

  // rebuild the whole progression: pinned slots keep their choice, random slots re-roll
  function rollProgression(){
    if (keyChoice){
      currentMode = keyChoice.mode;
      currentTonic = keyChoice.tonic;
    } else {
      currentMode = modeSetting === 'random' ? (Math.random() < 0.5 ? 'major' : 'minor') : modeSetting;
      currentTonic = pick(Object.keys(currentMode === 'major' ? MAJOR_KEYS : MINOR_KEYS));
    }
    currentDiatonic = keyChordChoices();

    // drop any pin that no longer exists in this key (e.g. the minor-only V)
    const validDegs = new Set(currentDiatonic.map(c => c.deg));
    slotChoices = slotChoices.map(s => (s == null || validDegs.has(s)) ? s : null);

    const prog = [];
    for (let i = 0; i < chordCount; i++){
      const deg = slotChoices[i] != null ? slotChoices[i]
        : rollDegree(prog.length ? prog[prog.length - 1]._deg : -1);
      prog.push(chordForDegree(deg));
    }
    // keep fully-random progressions grounded on the tonic
    if (slotChoices.some(s => s == null) && !prog.some(c => c._deg === 0)){
      const i = slotChoices.findIndex(s => s == null);
      prog[i] = chordForDegree(0);
    }
    currentProgression = prog;
  }

  function buildKeySelect(){
    const grp = (label, obj, mode) =>
      `<optgroup label="${label}">` +
      Object.keys(obj).slice().sort().map(t => `<option value="${mode}:${t}">${t} ${mode}</option>`).join('') +
      `</optgroup>`;
    // only offer keys that match the current Major/Minor/Random setting
    let groups = '';
    if (modeSetting !== 'minor') groups += grp('Major keys', MAJOR_KEYS, 'major');
    if (modeSetting !== 'major') groups += grp('Minor keys', MINOR_KEYS, 'minor');
    keySelect.innerHTML = `<option value="random">Random</option>` + groups;
    keySelect.value = keyChoice ? `${keyChoice.mode}:${keyChoice.tonic}` : 'random';
  }

  // ---- ready-made progressions -------------------------------------------
  const presetGroup = document.getElementById('presetGroup');
  const presetVariantRow = document.getElementById('presetVariantRow');
  const presetVariantGroup = document.getElementById('presetVariantGroup');
  let presetIdx = null;      // which preset is showing, if any
  let variantIdx = 0;

  function applyPreset(preset, variant){
    const chords = variant.chords.slice(0, MAX_CHORDS);
    setSlotCount(chords.length);
    // pinning each slot to its degree is what keeps the shape put — and what
    // leaves every chord editable from its own picker afterwards
    slotChoices = chords.map(c => c.deg);
    slotMeasures = chords.map(c => c.bars);
    currentProgression = chords.map(c => chordForDegree(c.deg, c));
    loadedLabel = null;
    if (chords.some(c => c.dom) && !useSevenths){
      useSevenths = true;
      seventhToggle.checked = true;
    }
    renderAll();
  }

  function renderPresetVariants(){
    const preset = presetIdx == null ? null : GT.progressionPresets[presetIdx];
    const many = preset && preset.variants.length > 1;
    presetVariantRow.hidden = !many;
    if (!many) return;
    presetVariantGroup.innerHTML = '';
    preset.variants.forEach((v, i) => {
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

  function renderPresets(){
    presetGroup.innerHTML = '';
    GT.progressionPresets.forEach((preset, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === presetIdx ? ' active' : '');
      b.textContent = preset.name;
      b.addEventListener('click', () => {
        presetIdx = i;
        variantIdx = 0;
        renderPresets();
        renderPresetVariants();
        applyPreset(preset, preset.variants[0]);
      });
      presetGroup.appendChild(b);
    });
  }

  // once you've changed something by hand it isn't that preset any more
  function clearPreset(){
    if (presetIdx == null) return;
    presetIdx = null;
    renderPresets();
    renderPresetVariants();
  }

  function renderChordSlots(){
    chordSlotsEl.innerHTML = '';
    for (let i = 0; i < chordCount; i++){
      const slot = document.createElement('span');
      slot.className = 'chord-slot';

      const sel = document.createElement('select');
      sel.className = 'mini-select chord-degree';
      sel.setAttribute('aria-label', `Chord ${i + 1}`);
      sel.innerHTML = `<option value="random">Random</option>` +
        currentDiatonic.map(o => `<option value="${o.deg}">${displayName(o, useSevenths)} · ${o.numeral}</option>`).join('');
      sel.value = slotChoices[i] == null ? 'random' : String(slotChoices[i]);
      // a preset can make a degree dominant, which the key's own diatonic
      // chord list doesn't know about — label that option with what's actually
      // sounding so the picker doesn't contradict the display
      const current = currentProgression[i];
      if (current && (current._dom || current._maj)){
        const opt = [...sel.options].find(o => o.value === String(current._deg));
        if (opt) opt.textContent = `${displayName(current, useSevenths)} · ${current.numeral}`;
      }
      sel.addEventListener('change', () => {
        slotChoices[i] = sel.value === 'random' ? null : Number(sel.value);
        currentProgression[i] = chordForDegree(slotChoices[i] != null ? slotChoices[i] : rollDegree(-1));
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
      bars.title = 'Measures on this chord';
      bars.innerHTML = [1, 2, 3, 4, 6, 8]
        .map(n => `<option value="${n}">\u00d7${n}</option>`).join('');
      bars.value = String(measuresFor(i));
      bars.addEventListener('change', () => {
        slotMeasures[i] = Number(bars.value) || DEFAULT_MEASURES;
        clearPreset();      // once the bar lengths change it isn't that preset any more
        refreshBarLabels();
        resetPlaybackCursor();
      });
      slot.appendChild(bars);

      chordSlotsEl.appendChild(slot);
    }
  }

  function barsLabel(i){
    const n = measuresFor(i);
    return n === 1 ? '1 bar' : `${n} bars`;
  }

  // update the bar counts in place, so changing one doesn't replay the
  // chord display's entrance animation
  function refreshBarLabels(){
    document.querySelectorAll('#chords .chord').forEach((item, i) => {
      const el = item.querySelector('.chord-bars');
      if (el) el.textContent = barsLabel(i);
    });
  }

  function renderChordDisplay(){
    const chordsEl = document.getElementById('chords');
    const names = currentProgression.map(c => displayName(c, useSevenths));
    const n = currentProgression.length;
    // seventh-chord names (e.g. "Bm7♭5") run much longer than triad names
    // ("Am", "B°") — shrink the font to fit the longest one, not just the count
    const maxLen = Math.max(1, ...names.map(name => name.length));
    chordsEl.style.setProperty('--n', Math.max(n, n * maxLen / 3));
    chordsEl.classList.toggle('tight', currentProgression.length === 2);
    chordsEl.innerHTML = '';
    currentProgression.forEach((chord, i) => {
      const item = document.createElement('div');
      item.className = 'chord';
      item.style.animationDelay = `${i * 70}ms`;
      item.innerHTML = `
        <span class="chord-name">${names[i]}</span>
        <span class="chord-numeral">${chord.numeral}</span>
        <span class="chord-bars">${barsLabel(i)}</span>
      `;
      chordsEl.appendChild(item);
    });
  }

  // update chord name labels in place (no re-roll, no re-triggering the
  // entrance animation) — used when a display-only setting like "7" flips
  function refreshChordNames(){
    const chordsEl = document.getElementById('chords');
    const names = currentProgression.map(c => displayName(c, useSevenths));
    const n = currentProgression.length;
    const maxLen = Math.max(1, ...names.map(name => name.length));
    chordsEl.style.setProperty('--n', Math.max(n, n * maxLen / 3));
    [...chordsEl.querySelectorAll('.chord')].forEach((item, i) => {
      const nameEl = item.querySelector('.chord-name');
      if (nameEl) nameEl.textContent = names[i];
    });
    renderChordSlots();
    view.rebuildChordPicker();
  }

  // render everything from the current progression WITHOUT re-rolling it
  function renderAll(){
    document.getElementById('keyReadout').textContent =
      loadedLabel || (currentMode === 'major' ? `${currentTonic} major` : `${currentTonic}m`);
    renderChordDisplay();
    renderChordSlots();
    view.rebuildChordPicker();
    view.render();
    resetPlaybackCursor();
  }

  // re-roll the random slots, then render (New progression, key / mode / count changes)
  function render(){
    loadedLabel = null;
    clearPreset();
    rollProgression();
    view.resetPosition();   // a newly-rolled progression starts at the lowest cluster
    renderAll();
  }

  document.getElementById('genBtn').addEventListener('click', render);

  keySelect.addEventListener('change', () => {
    if (keySelect.value === 'random'){
      keyChoice = null;
      render();
      return;
    }
    const [m, t] = keySelect.value.split(':');
    const known = (m === 'major' && MAJOR_KEYS[t]) || (m === 'minor' && MINOR_KEYS[t]);
    if (!known){          // the option list changed under us — fall back to random
      keyChoice = null;
      buildKeySelect();
      render();
      return;
    }
    keyChoice = { mode: m, tonic: t };
    modeSetting = m;
    document.querySelectorAll('#modeGroup .seg-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.value === m));
    buildKeySelect();
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

    currentProgression = currentProgression.map(chord =>
      (chord._deg != null && validDegs.has(chord._deg))
        ? chordForDegree(chord._deg, { dom: chord._dom, maj: chord._maj })
        : transposeChord(chord, shift));

    // a pin that has no chord in the new key falls back to random
    slotChoices = slotChoices.map(s => (s == null || validDegs.has(s)) ? s : null);
    loadedLabel = null;      // it's no longer the key that progression came in
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
    });
  }

  const tempoInput = document.getElementById('tempo');
  const tempoVal = document.getElementById('tempoVal');
  const playBtn = document.getElementById('playBtn');
  const playBtn2 = document.getElementById('playBtn2');
  const commonToggle = document.getElementById('commonToggle');
  const seventhToggle = document.getElementById('seventhToggle');
  let useSevenths = false;   // triads vs seventh chords (root/3rd/5th/7th), naming + playback
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

  commonToggle.addEventListener('change', render);
  seventhToggle.addEventListener('change', () => {
    useSevenths = seventhToggle.checked;
    refreshChordNames();   // same chords, just relabel/replay them as triads or 7ths
  });

  // resize the per-slot arrays to match; kept separate from setChordCount so a
  // loaded progression can set its own length without re-rolling itself away
  function setSlotCount(n){
    chordCount = Math.max(1, Math.min(MAX_CHORDS, n));
    chordCountValue.textContent = chordCount;
    while (slotChoices.length < chordCount) slotChoices.push(null);
    slotChoices.length = chordCount;
    while (slotMeasures.length < chordCount) slotMeasures.push(DEFAULT_MEASURES);
    slotMeasures.length = chordCount;
  }

  function setChordCount(n){
    setSlotCount(n);
    render();
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

  document.querySelectorAll('#modeGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modeGroup .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modeSetting = btn.dataset.value;
      if (modeSetting === 'random'){
        keyChoice = null;
        buildKeySelect();
        render();
        return;
      }
      // Same progression, other mode: hold the tonic if that key exists in the
      // new mode, so I–V–vi–IV in C major becomes i–v–VI–IV in C minor rather
      // than something unrelated.
      const keys = modeSetting === 'major' ? MAJOR_KEYS : MINOR_KEYS;
      const tonic = keys[currentTonic] ? currentTonic : pick(Object.keys(keys));
      keyChoice = { mode: modeSetting, tonic };
      buildKeySelect();
      transposeToKey(modeSetting, tonic);
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
  let countInFrom = 0;       // audioCtx time of the first count-in click
  let countInSpb = 0;        // seconds per beat during the count-in

  const ICON_PLAY = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M3.5 2.2v11.6c0 .78.85 1.26 1.52.86l9.3-5.8c.65-.4.65-1.32 0-1.72l-9.3-5.8c-.67-.4-1.52.08-1.52.86Z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3.2" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/><rect x="9.4" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/></svg>';

  function setPlayLabel(text){
    const icon = text === 'Pause' ? ICON_PAUSE : ICON_PLAY;
    playBtn.innerHTML = icon;
    playBtn.setAttribute('aria-label', text);
    playBtn2.innerHTML = icon;
    playBtn2.setAttribute('aria-label', text);
  }

  function resetPlaybackCursor(){
    chordIdx = 0;
    beatInChord = 0;
    scheduledLog = [];
    view.resetFollow();
    document.querySelectorAll('.chord').forEach(el => el.classList.remove('dim', 'active'));
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
        playChord(chord, nextNoteTime, duration, velocity, useSevenths);
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
        if (ce) playStyleVoice(style.voice, chord, t, ce.dur * slotDur, ce.vel, useSevenths);

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
    if (now < playbackStartTime - 0.0005){
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
      document.querySelectorAll('.chord').forEach((el, i) => {
        const isActive = i === active.idx;
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
      countInFrom = nextNoteTime;
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
      document.querySelectorAll('.chord').forEach(el => el.classList.remove('dim', 'active'));
      measureReadout.textContent = '';
      setPlayLabel('Play');
      view.onPlaybackStopped();
    }
  }

  playBtn.addEventListener('click', togglePlay);
  playBtn2.addEventListener('click', togglePlay);

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

    // the progression's own key decides the roman numerals; without one, read
    // the first chord as the tonic
    const tonicPc = key !== undefined && SEMITONE[key] !== undefined
      ? SEMITONE[key]
      : (SEMITONE[(chordFromName(kept[0].name) || {}).note] || 0);
    const built = kept.map(r => chordFromName(r.name, tonicPc)).filter(Boolean);
    if (!built.length) return;

    setSlotCount(built.length);
    // remember the key it came in, so changing key from here shifts by the
    // right interval rather than from whatever was last generated
    if (key && SEMITONE[key] !== undefined) currentTonic = key;
    currentProgression = built;
    slotChoices = built.map(() => null);
    slotMeasures = kept.slice(0, built.length).map(r => r.bars);
    loadedLabel = label || null;

    // a progression written with 7th chords should sound like one
    if (built.some(c => c.seventh) && !useSevenths){
      useSevenths = true;
      seventhToggle.checked = true;
    }
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
        useSevenths: () => useSevenths,
        isPlaying:   () => isPlaying,
        mode:        () => currentMode,
        tonic:       () => currentTonic,
        activeChord: () => scheduledLog[0],
      });
      buildKeySelect();
      renderPresets();
      updatePlaybackUI();
      setPlayLabel('Play');
      render();
    },
  };
})();
