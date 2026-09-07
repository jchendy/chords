// Genre examples tab: pick a style, pick rhythm or lead, pick which
// progression and pattern, then read the tab and hear it played.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const audio = GT.audio;
  const { buildRhythm, buildLead, freqFor } = GT.genres;

  const genreGroup = document.getElementById('genreGroup');
  const genreBlurb = document.getElementById('genreBlurb');
  const roleGroup = document.getElementById('genreRoleGroup');
  const progRow = document.getElementById('genreProgRow');
  const progGroup = document.getElementById('genreProgGroup');
  const patternLabel = document.getElementById('genrePatternLabel');
  const patternGroup = document.getElementById('genrePatternGroup');
  const tabWrap = document.getElementById('genreTabWrap');
  const playBtn = document.getElementById('genrePlayBtn');
  const loopToggle = document.getElementById('genreLoopToggle');
  const drumsToggle = document.getElementById('genreDrumsToggle');
  const tempoOut = document.getElementById('genreTempo');
  const openRow = document.getElementById('genreOpenRow');
  const openBtn = document.getElementById('genreOpenInPractice');

  let genre = null;
  let role = 'rhythm';          // 'rhythm' | 'lead'
  let progIdx = 0;
  let patternIdx = 0;
  let example = null;           // the built note list currently on screen
  let tabSvg = null;
  let tabMetrics = null;        // how the tab is currently laid out into rows

  // ------------------------------------------------------------------ player
  let playing = false;
  let startTime = 0;            // audio-clock time slot 0 was played at
  let secondsPerSlot = 0;
  let schedulerId = null;
  let nextSlot = 0;             // next slot index still to be scheduled
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD = 0.15;

  function tempo(){
    if (!genre) return 120;
    if (role === 'lead' && example && example.tempo) return example.tempo;
    return genre.tempo;
  }

  // a slot is a subdivision of a beat: grid 8 = eighths, 16 = sixteenths
  function slotSeconds(){
    const beatsPerBar = 4;
    const grid = example ? example.grid : 8;
    return (60 / tempo()) * beatsPerBar / grid;
  }

  function scheduleSlot(slot, when){
    example.notes.forEach(n => {
      if (n.at !== slot) return;
      audio.playGuitar(freqFor(n.string, n.fret), when + (n.spread || 0),
        Math.max(0.08, n.dur * secondsPerSlot), n.vel, n.tone);
    });
    if (drumsToggle.checked){
      example.drums.forEach(d => {
        if (d.at !== slot) return;
        if (d.kind === 'kick') audio.playKick(when, 0.9);
        if (d.kind === 'snare') audio.playSnare(when, 0.7);
        if (d.kind === 'hat') audio.playHiHat(when, 0.32);
      });
    }
  }

  function scheduler(){
    const now = audio.ctx().currentTime;
    while (startTime + nextSlot * secondsPerSlot < now + SCHEDULE_AHEAD){
      const slotInLoop = nextSlot % example.totalSlots;
      scheduleSlot(slotInLoop, startTime + nextSlot * secondsPerSlot);
      nextSlot++;
      if (!loopToggle.checked && nextSlot >= example.totalSlots){
        // let the last notes ring, then stop
        setTimeout(stop, (startTime + nextSlot * secondsPerSlot - now + 0.6) * 1000);
        return;
      }
    }
    schedulerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function followPlayhead(){
    if (!playing) return;
    const head = tabSvg && tabSvg.querySelector('.tab-playhead');
    if (head && tabMetrics){
      const elapsed = audio.ctx().currentTime - startTime;
      const slot = Math.max(0, elapsed / secondsPerSlot) % example.totalSlots;
      const pos = GT.tab.playheadPos(slot, tabMetrics);
      head.hidden = false;
      head.setAttribute('x', pos.x);
      head.setAttribute('y', pos.y);
      const current = Math.floor(slot);
      tabSvg.querySelectorAll('.tab-note').forEach(g => {
        g.classList.toggle('now', Number(g.dataset.slot) === current);
      });
    }
    requestAnimationFrame(followPlayhead);
  }

  function play(){
    if (!example) return;
    audio.ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    playing = true;
    secondsPerSlot = slotSeconds();
    startTime = audio.ctx().currentTime + 0.08;
    nextSlot = 0;
    scheduler();
    requestAnimationFrame(followPlayhead);
    playBtn.textContent = 'Stop';
    playBtn.classList.add('playing');
  }

  function stop(){
    playing = false;
    clearTimeout(schedulerId);
    playBtn.textContent = 'Play';
    playBtn.classList.remove('playing');
    if (tabSvg){
      const head = tabSvg.querySelector('.tab-playhead');
      if (head) head.hidden = true;
      tabSvg.querySelectorAll('.tab-note.now').forEach(g => g.classList.remove('now'));
    }
  }

  function toggle(){ playing ? stop() : play(); }

  // -------------------------------------------------------------------- view
  function segButtons(container, items, activeIndex, onPick){
    container.innerHTML = '';
    items.forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === activeIndex ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => onPick(i));
      container.appendChild(b);
    });
  }

  function currentPatterns(){
    return role === 'rhythm' ? genre.rhythms : genre.leads;
  }

  // Lay the current example out for the width we've got. Kept separate from
  // building it so a window resize can re-wrap the rows without disturbing
  // playback.
  function drawTab(){
    if (!example){ tabWrap.innerHTML = ''; tabSvg = null; tabMetrics = null; return; }
    const built = GT.tab.build(example, tabWrap.clientWidth);
    tabMetrics = built.metrics;
    tabWrap.innerHTML = `<svg id="genreTab" viewBox="${built.viewBox}" width="${built.width}" height="${built.height}"
      role="img" aria-label="Guitar tab">${built.markup}</svg>`;
    tabSvg = document.getElementById('genreTab');
  }

  function rebuildExample(){
    const patterns = currentPatterns();
    if (!genre || !patterns.length){ example = null; drawTab(); return; }
    const pattern = patterns[Math.min(patternIdx, patterns.length - 1)];
    example = role === 'rhythm'
      ? buildRhythm(genre.progressions[Math.min(progIdx, genre.progressions.length - 1)], pattern)
      : buildLead(pattern);
    example.tempo = pattern.tempo || genre.tempo;
    tempoOut.textContent = `${example.tempo} BPM`;
    drawTab();
  }

  function renderPatterns(){
    const patterns = currentPatterns();
    if (patternIdx >= patterns.length) patternIdx = 0;
    patternLabel.textContent = role === 'rhythm' ? 'Rhythm' : 'Solo line';
    segButtons(patternGroup, patterns.map(p => p.name), patternIdx, i => {
      patternIdx = i; renderPatterns(); rebuildExample();
    });
    progRow.hidden = role !== 'rhythm';
    openRow.hidden = role !== 'rhythm';
  }

  function renderProgressions(){
    if (!genre) return;
    if (progIdx >= genre.progressions.length) progIdx = 0;
    segButtons(progGroup, genre.progressions.map(p => p.name), progIdx, i => {
      progIdx = i; renderProgressions(); rebuildExample();
    });
  }

  function selectGenre(g){
    stop();
    genre = g;
    progIdx = 0;
    patternIdx = 0;
    genreBlurb.textContent = g.blurb;
    renderProgressions();
    renderPatterns();
    rebuildExample();
  }

  function renderGenres(){
    genreGroup.innerHTML = '';
    // grouped by family, so related styles sit together
    const families = [];
    GT.genreData.forEach(g => {
      let f = families.find(x => x.name === g.family);
      if (!f) families.push(f = { name: g.family, genres: [] });
      f.genres.push(g);
    });
    families.forEach(f => {
      const wrap = document.createElement('div');
      wrap.className = 'genre-family';
      wrap.innerHTML = `<span class="genre-family-name">${f.name}</span>`;
      const row = document.createElement('div');
      row.className = 'segmented';
      f.genres.forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'seg-btn genre-pick';
        b.dataset.genre = g.id;
        b.textContent = g.name;
        b.addEventListener('click', () => {
          genreGroup.querySelectorAll('.genre-pick').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          selectGenre(g);
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      genreGroup.appendChild(wrap);
    });
  }

  GT.genreExamples = {
    // the page has no width until it's shown, so lay the tab out again then
    refresh(){ drawTab(); },
    init(){
      renderGenres();
      roleGroup.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          stop();
          roleGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
          role = btn.dataset.value;
          patternIdx = 0;
          renderPatterns();
          rebuildExample();
        });
      });
      playBtn.addEventListener('click', toggle);

      // hand the selected progression over to the practice tab
      openBtn.addEventListener('click', () => {
        if (!genre) return;
        const prog = genre.progressions[Math.min(progIdx, genre.progressions.length - 1)];
        stop();
        GT.practice.loadProgression({
          chords: prog.chords,
          label: `${genre.name} · ${prog.name}`,
          tempo: genre.tempo,
          key: prog.key,
        });
        GT.tabs.goTo('caged');
      });
      // re-wrap the rows when the window changes width
      let resizeId = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeId);
        resizeId = setTimeout(drawTab, 120);
      });
      drumsToggle.addEventListener('change', () => { if (playing){ stop(); play(); } });
      // open on the first genre so the tab is never empty
      const first = genreGroup.querySelector('.genre-pick');
      if (first) first.click();
    },
    stop,
  };
})();
