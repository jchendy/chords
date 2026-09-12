// One small player for a page of examples: a tab drawn from a realised
// part (tab.js), and one part at a time played over its style's band —
// the kit, the comp and the bass through band.js, the part on the guitar
// on its own bus through audio.playPartNotes — looping over its bars,
// queued ahead the way the practice tab does it, the playhead and the
// sounding notes lit as it goes. The parts page and the Hendrix page both
// play through this; the practice tab has its own scheduler, wound round
// its controls. A card is any element holding a `.tab` (the drawing), a
// `.play` button and, once drawn, the `.tab-playhead` inside the SVG.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { displayName, SEMITONE } = GT.theory;
  const audio = GT.audio;

  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  // A window for a key: the box round the root on the A string, or on the
  // low E when the A-string one would be open or off the top — four frets,
  // the size of a hand, above the first fret so bends have somewhere to go.
  function windowFor(keyName){
    const pc = SEMITONE[keyName] % 12;
    const onA = (pc - 9 + 12) % 12, onE = (pc - 4 + 12) % 12;
    const f = [onA, onE, onA + 12, onE + 12].find(x => x >= 2 && x <= 10);
    return { min: f, max: f + 4 };
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

  GT.examplePlayer = { windowFor, drawTab, play, stop, playing: () => playing };
})();
