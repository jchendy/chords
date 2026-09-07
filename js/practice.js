// The CAGED practice tab: rolling a progression, the chord display and its
// settings, and the playback transport that drives both the audio and the
// on-screen highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_COMMON, MINOR_COMMON, LEADING_TONE, SEMITONE,
    pick, buildDiatonicChords, displayName,
  } = GT.theory;
  const audio = GT.audio;
  const {
    ensureAudio, noteFreq, chordFrequencies, bassFreqAt, walkBassFreq, STYLES,
    playNote, playChord, playBass, playHiHat, playRide, playKick, playSnare, playStyleVoice,
  } = GT.audio;
  const view = GT.fretboardView;

  let currentProgression = [];
  let chordCount = 3;
  let modeSetting = 'random';           // 'major' | 'minor' | 'random'
  let keyChoice = null;                 // null = random, else { mode, tonic }
  let slotChoices = [null, null, null]; // per slot: null = random, else a diatonic degree
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

  function chordForDegree(deg){
    const c = currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0];
    return { ...c, _deg: c.deg };
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

  function renderChordSlots(){
    chordSlotsEl.innerHTML = '';
    for (let i = 0; i < chordCount; i++){
      const sel = document.createElement('select');
      sel.className = 'mini-select';
      sel.setAttribute('aria-label', `Chord ${i + 1}`);
      sel.innerHTML = `<option value="random">Random</option>` +
        currentDiatonic.map(o => `<option value="${o.deg}">${displayName(o, useSevenths)} · ${o.numeral}</option>`).join('');
      sel.value = slotChoices[i] == null ? 'random' : String(slotChoices[i]);
      sel.addEventListener('change', () => {
        slotChoices[i] = sel.value === 'random' ? null : Number(sel.value);
        currentProgression[i] = chordForDegree(slotChoices[i] != null ? slotChoices[i] : rollDegree(-1));
        renderAll();
      });
      chordSlotsEl.appendChild(sel);
    }
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
      currentMode === 'major' ? `${currentTonic} major` : `${currentTonic}m`;
    renderChordDisplay();
    renderChordSlots();
    view.rebuildChordPicker();
    view.render();
    resetPlaybackCursor();
  }

  // re-roll the random slots, then render (New progression, key / mode / count changes)
  function render(){
    rollProgression();
    view.resetPosition();   // a newly-rolled progression starts at the lowest cluster
    renderAll();
  }

  document.getElementById('genBtn').addEventListener('click', render);

  keySelect.addEventListener('change', () => {
    if (keySelect.value === 'random'){
      keyChoice = null;
    } else {
      const [m, t] = keySelect.value.split(':');
      keyChoice = { mode: m, tonic: t };
      modeSetting = m;
      document.querySelectorAll('#modeGroup .seg-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.value === m));
      buildKeySelect();
    }
    render();
  });

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
  const measuresValue = document.getElementById('measuresValue');

  let measuresPerChord = 2;
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

  function setChordCount(n){
    chordCount = Math.max(1, Math.min(7, n));
    chordCountValue.textContent = chordCount;
    while (slotChoices.length < chordCount) slotChoices.push(null);
    slotChoices.length = chordCount;
    render();
  }
  document.getElementById('chordCountDown').addEventListener('click', () => {
    if (chordCount <= 1) return;
    setChordCount(chordCount - 1);
  });
  document.getElementById('chordCountUp').addEventListener('click', () => {
    if (chordCount >= 7) return;
    setChordCount(chordCount + 1);
  });

  function setMeasures(n){
    measuresPerChord = Math.max(1, Math.min(8, n));
    measuresValue.textContent = measuresPerChord;
  }
  document.getElementById('measuresDown').addEventListener('click', () => setMeasures(measuresPerChord - 1));
  document.getElementById('measuresUp').addEventListener('click', () => setMeasures(measuresPerChord + 1));

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
      // a pinned key that doesn't match the new mode no longer applies
      if (modeSetting === 'random' || (keyChoice && keyChoice.mode !== modeSetting)){
        keyChoice = null;
      }
      buildKeySelect();
      render();
    });
  });

  function getTempo(){ return Number(tempoInput.value); }
  function getBeatsPerChord(){ return measuresPerChord * 4; } // assumes 4/4 time
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
    const approachNext = Math.floor(beatInChord / 4) === measuresPerChord - 1;
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
      if (beatInChord >= getBeatsPerChord()){
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
        `${Math.min(active.measure, measuresPerChord)}.${active.beat}`;
      view.followChord(active);
    }
    requestAnimationFrame(syncHighlight);
  }

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

  GT.practice = {
    // leaving the tab shouldn't leave a progression playing behind you
    stop(){ if (isPlaying) togglePlay(); },
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
      updatePlaybackUI();
      setPlayLabel('Play');
      render();
    },
  };
})();
