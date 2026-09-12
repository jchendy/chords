// The parts guide: every part in the library, written out over a progression
// that suits its style, with what the rhythm and the notes are made of, who
// the idiom comes from, and a Play button. A page of its own, so the machinery
// can be read end to end: parts.js realises, tab.js draws, audio.js plays —
// this file only wires them to a page and keeps a small player of its own,
// since the practice tab's scheduler is wound round that tab's controls.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, SEMITONE } = GT.theory;
  const { SIMPLE_FEEL, partsFor, realise } = GT.parts;
  const { GUIDE } = GT.partsGuide;
  const audio = GT.audio;
  const { STYLES } = audio;

  const $ = id => document.getElementById(id);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  // ---- which feels, in the order the app lists them ----
  const FEELS = [{ style: 'simple', feel: SIMPLE_FEEL }];
  Object.keys(STYLES).forEach(style => STYLES[style].variants.forEach(v => FEELS.push({ style, feel: v })));
  const guideFor = (style, feel) => GUIDE[`${style}/${feel.label}`] || (GUIDE[style] && GUIDE[style].feel === feel.label ? GUIDE[style] : null);

  // ---- the reading the parts are shown in ----
  // A part is realised into what the neck's reading offers, so the same
  // part reads three ways; the guide lets you switch between them.
  let reading = 'scale';
  let techOn = true;

  // A window for a key: the box round the root on the A string, or on the
  // low E when the A-string one would be open or off the top — four frets,
  // the size of a hand, above the first fret so bends have somewhere to go.
  function windowFor(keyName){
    const pc = SEMITONE[keyName] % 12;
    const onA = (pc - 9 + 12) % 12, onE = (pc - 4 + 12) % 12;
    const f = [onA, onE, onA + 12, onE + 12].find(x => x >= 2 && x <= 10);
    return { min: f, max: f + 4 };
  }

  // The progression as the practice tab would hold it: chord objects with
  // numerals against the key.
  function chordsOf(entry){
    const tonicPc = SEMITONE[entry.key] % 12;
    return entry.progression.map(name => chordFromName(name, tonicPc, 'major'));
  }

  function realiseFor(style, feel, part, entry){
    const chords = chordsOf(entry);
    const bars = chords.map(chord => ({ chord }));
    const opts = {
      reading, window: windowFor(entry.key), scaleTheory: 'parallel', stringSet: 2,
      stayOnKey: false, key: { tonic: entry.key, mode: 'major' },
      tech: techOn ? null : { double: false, bend: false, hammer: false, pull: false, slide: false },
    };
    return { chords, notes: realise(part, bars, 1, opts, { grid: feel.grid }) };   // one seed, so the page reads the same each time
  }

  // ---- drawing ----
  function drawTab(host, feel, chords, notes){
    const grid = feel.grid;
    const example = {
      grid,
      bars: chords.map((c, i) => ({ startSlot: i * grid, chord: displayName(c), numeral: c.numeral })),
      notes: notes.map(n => ({
        string: n.string, fret: n.fret, at: n.bar * grid + n.at, dur: n.dur,
        bend: n.bend, slide: n.slide, tech: n.tech, to: n.to, soft: n.soft, mute: n.mute,
        vib: n.vib, trem: n.trem, rake: n.rake, ghost: n.ghost, tone: !n.strum && (n.mute || n.ghost) ? 'muted' : undefined,
        lead: !n.strum || !notes.some(m => m.bar === n.bar && m.at === n.at && m.strum && m.spread > n.spread),
      })),
      totalSlots: chords.length * grid,
    };
    const built = GT.tab.build(example, Math.max(320, host.clientWidth || 800));
    host.innerHTML = `<svg viewBox="${built.viewBox}" width="${built.width}" height="${built.height}" role="img">${built.markup}</svg>`;
    return built.metrics;
  }

  // ---- the player ----
  // One part at a time: the style's own kit, comp and bass under it, the
  // part on the guitar on its own bus, looping over the six bars, queued
  // 0.4 s ahead the way the practice tab does it.
  const TICK_MS = 25;
  const ahead = () => audio.scheduleAhead(document.hidden);   // 0.4 s visible, wider hidden
  let playing = null;                  // { style, feel, chords, notes, tempo, card, metrics }
  let timer = 0, nextBarTime = 0, bar = 0, log = [];

  function stop(){
    if (!playing) return;
    clearTimeout(timer);
    audio.cancelScheduled();
    audio.keepAwake(false);
    playing.card.classList.remove('playing');
    playing.card.querySelector('.tab-playhead').setAttribute('hidden', '');
    playing.card.querySelectorAll('.tab-note.now').forEach(g => g.classList.remove('now'));
    playing.card.querySelector('.play').textContent = 'Play';
    playing = null;
    log = [];
  }

  function play(card, style, feel, chords, notes, tempo, metrics){
    stop();
    audio.ensureAudio();
    const ctx = audio.ctx();
    if (ctx.state === 'suspended') ctx.resume();
    audio.warmGuitar(); audio.warmPiano(); audio.warmBass();
    audio.keepAwake(true);
    playing = { style, feel, chords, notes, tempo, card, metrics };
    card.classList.add('playing');
    card.querySelector('.play').textContent = 'Stop';
    bar = 0;
    nextBarTime = ctx.currentTime + 0.1;
    log = [];
    tick();
    requestAnimationFrame(follow);
  }

  function tick(){
    if (!playing) return;
    const ctx = audio.ctx();
    const { feel, chords, notes, tempo, style } = playing;
    const beats = GT.band.beatsOf(feel);
    const spb = 60 / tempo, barLen = spb * beats, grid = feel.grid, slotDur = barLen / grid;
    // a bar whose moment has passed is stepped over, not played late
    for (let skip = audio.stepsToSkip(nextBarTime, ctx.currentTime, barLen); skip > 0; skip--){ nextBarTime += barLen; bar = (bar + 1) % chords.length; }
    while (nextBarTime < ctx.currentTime + ahead()){
      const t0 = nextBarTime;
      const chord = chords[bar], next = chords[(bar + 1) % chords.length];
      if (style === 'simple'){
        for (let beat = 0; beat < 4; beat++){
          audio.playChord(chord, t0 + beat * spb, spb, beat === 0 ? 0.86 : 0.68, 'piano');
          audio.playHiHat(t0 + beat * spb, 0.4);
        }
      } else {
        // the band as the practice tab plays it: fills, approaches, pushes,
        // stop-time bars and all, through band.js
        const bctx = { chord, next, audio, voice: 'piano',
                       changing: displayName(next) !== displayName(chord),
                       fillNow: bar === chords.length - 1,
                       stopped: !!(notes.stopBars && notes.stopBars.has(bar)) };
        for (let slot = 0; slot < grid; slot++){
          GT.band.scheduleSlot(feel, slot, t0 + slot * slotDur + GT.band.swingOffset(feel, slot, slotDur), slotDur, bctx);
        }
      }
      // the part through the engine's one player, at the practice tab's default level
      audio.playPartNotes(notes.filter(n => n.bar === bar), n => t0 + n.at * slotDur + GT.band.swingOffset(feel, Math.floor(n.at), slotDur), slotDur, audio.PART_LEVEL, { slapback: !!feel.slapback })
        .forEach(({ note: n, time, until }) => log.push({ time, until, slot: bar * grid + Math.floor(n.at) }));
      for (let slot = 0; slot < grid; slot++) log.push({ time: t0 + slot * slotDur, slot: bar * grid + slot, head: true });
      nextBarTime += barLen;
      bar = (bar + 1) % chords.length;
    }
    if (log.length > 400) log = log.filter(e => (e.until || e.time) > ctx.currentTime - 1);
    timer = setTimeout(tick, TICK_MS);
  }
  // going hidden, the queue is filled to the wider cushion before the timers slow
  document.addEventListener('visibilitychange', () => { if (playing && document.hidden){ clearTimeout(timer); tick(); } });

  function follow(){
    if (!playing) return;
    const now = audio.ctx().currentTime;
    const { card, metrics } = playing;
    const heads = log.filter(e => e.head && e.time <= now);
    const at = heads.length ? heads[heads.length - 1].slot : null;
    const head = card.querySelector('.tab-playhead');
    if (at != null){
      const pos = GT.tab.playheadPos(at, metrics);
      head.removeAttribute('hidden');
      head.setAttribute('x', pos.x); head.setAttribute('y', pos.y);
    }
    const sounding = new Set(log.filter(e => !e.head && e.time <= now && now < e.until).map(e => e.slot));
    card.querySelectorAll('.tab-note').forEach(g => g.classList.toggle('now', sounding.has(Number(g.dataset.slot))));
    requestAnimationFrame(follow);
  }

  // ---- the page ----
  function render(){
    const main = $('guide');
    main.innerHTML = '';
    const missing = [];
    FEELS.forEach(({ style, feel }) => {
      const entry = guideFor(style, feel);
      const parts = partsFor(style, feel.label);
      if (!entry){ missing.push(`${style}/${feel.label}`); return; }
      const sec = document.createElement('section');
      sec.className = 'style';
      sec.id = `s-${style}-${feel.label.replace(/\W+/g, '-').toLowerCase()}`;
      const chords = chordsOf(entry);
      sec.innerHTML = `
        <h2>${feel.label}</h2>
        <p class="meta"><span>${entry.progression.join(' · ')}</span><span>in ${entry.key}</span><span>${entry.tempo} BPM</span><span>${feel.grid === 12 ? 'twelve to the bar — swung, or 12/8' : 'sixteen to the bar — straight'}</span></p>
        <p class="about">${entry.about}</p>
        <p class="influences"><b>Where it comes from.</b> ${entry.influences}</p>
        <div class="parts"></div>`;
      const holder = sec.querySelector('.parts');
      parts.forEach(part => {
        const blurb = entry.parts[part.name];
        if (!blurb) missing.push(`${style}/${feel.label}/${part.name}`);
        const card = document.createElement('article');
        card.className = 'part';
        card.innerHTML = `
          <div class="part-head">
            <h3>${part.name}</h3>
            <button type="button" class="play">Play</button>
          </div>
          <p class="blurb">${blurb || ''}</p>
          <p class="legend">Bars: figure · fill 1 · variant 1 · fill 2 · variant 2 · fill 3</p>
          <div class="tab"></div>`;
        holder.appendChild(card);
        const tabHost = card.querySelector('.tab');
        let state = null;
        const build = () => {
          const { chords: cs, notes } = realiseFor(style, feel, part, entry);
          const metrics = drawTab(tabHost, feel, cs, notes);
          state = { chords: cs, notes, metrics };
        };
        build();
        card.querySelector('.play').addEventListener('click', () => {
          if (playing && playing.card === card){ stop(); return; }
          play(card, style, feel, state.chords, state.notes, entry.tempo, state.metrics);
        });
        card.rebuild = () => { const was = playing && playing.card === card; if (was) stop(); build(); };
      });
      main.appendChild(sec);
    });
    $('missing').hidden = !missing.length;
    $('missing').textContent = missing.length ? `No guide text for: ${missing.join(', ')}` : '';
    // the contents list
    $('toc').innerHTML = FEELS.map(({ style, feel }) => {
      const id = `s-${style}-${feel.label.replace(/\W+/g, '-').toLowerCase()}`;
      return `<a href="#${id}">${feel.label}</a>`;
    }).join('');
  }

  function rebuildAll(){ document.querySelectorAll('.part').forEach(c => c.rebuild && c.rebuild()); }

  document.querySelectorAll('#readingGroup button').forEach(b => b.addEventListener('click', () => {
    reading = b.dataset.value;
    document.querySelectorAll('#readingGroup button').forEach(x => x.classList.toggle('active', x === b));
    rebuildAll();
  }));
  $('techToggle').addEventListener('change', () => { techOn = $('techToggle').checked; rebuildAll(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/input|select|textarea/i.test(e.target.tagName)){ e.preventDefault(); if (playing) stop(); } });

  render();
  // redrawn when the width changes — the tab is built to it — and not on a
  // resize event that changed nothing, since a redraw stops what's playing
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; rebuildAll(); } }, 200);
  });

  GT.partsGuideView = { FEELS, guideFor, realiseFor, stop };
})();
