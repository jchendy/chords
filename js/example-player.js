// One small player for a page of examples: a tab drawn from a realised
// part (tab.js), and one part at a time played over its style's band —
// the kit, the comp and the bass through band.js, the part on the guitar
// on its own bus through audio.playPartNotes — looping over its bars,
// queued ahead the way the jam tab does it, the playhead and the
// sounding notes lit as it goes. The parts page and the Hendrix page both
// play through this; the jam tab has its own scheduler, wound round
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
  // The CAGED shape a bar's chord is played in, from the strings its first
  // strum strikes — named over the tab after the chord, where it is one
  // (a lead bar with no chord struck gets nothing)
  function shapeOfBar(chord, barNotes){
    const strums = barNotes.filter(n => n.strum && !n.next);
    if (!strums.length || !chord) return '';
    // the voicing the strums were written as says what the hand holds:
    // the 7♯9 and 9th grips, a power chord, a shell — whatever the chord's
    // name; a plain strum is named by the CAGED shape its strings match
    const voicings = new Set(strums.map(n => n.voicing || 'full'));
    if (voicings.has('sharp9')) return '7♯9 grip';
    if (voicings.has('ninth')) return '9th grip';
    if (voicings.has('power') && [...voicings].every(v => v === 'power' || v === 'bass' || v === 'fifth')) return 'power chord';
    if (voicings.has('shell') && voicings.size === 1) return 'shell';
    // every string the bar's strums touch — the grip the hand holds, whether
    // a strike is the whole of it or the thumb's bass note alone
    const cells = [...new Map(strums.map(n => [`${n.string}:${n.fret}`, { string: n.string, fret: n.fret }])).values()];
    if (cells.length < 3) return '';
    if (chord.ext && (chord.ext.includes(3) || chord.ext.includes(2) || chord.ext.includes(14))){
      const strings = new Set(cells.map(c => c.string));
      if ([4, 3, 2, 1].every(x => strings.has(x)) && !strings.has(5)) return chord.ext.includes(3) ? '7♯9 grip' : '9th grip';
    }
    const name = GT.fretboard.identifyCagedShape(cells, SEMITONE[chord.note] % 12, chord.quality === 'min');
    if (!name) return '';
    // the thumb's bass note and the split chord, and nothing else: say so
    const split = [...voicings].every(v => v === 'bass' || v === 'mid' || v === 'fifth') && voicings.has('mid');
    return split ? `${name} shape, split` : `${name} shape`;
  }
  // the grip a bar's strums hold when it isn't a CAGED shape — the 7♯9 and
  // 9th grips, a power chord, a shell — as a placement the neck draws as it
  // is, named as the tab names it; a CAGED shape is left to the neck, which
  // draws the whole grip the hand holds, struck strings or not
  function gripOfBar(chord, barNotes){
    const name = shapeOfBar(chord, barNotes);
    if (!name || / shape/.test(name)) return null;
    const strums = barNotes.filter(n => n.strum && !n.next);
    const cells = [...new Map(strums.map(n => [`${n.string}:${n.fret}`, { string: n.string, fret: n.fret }])).values()];
    const frets = cells.map(c => c.fret).filter(f => f > 0);
    const meanFret = frets.length ? frets.reduce((a, b) => a + b, 0) / frets.length : 0;
    return { name, cells, given: true, grip: true, fretMin: frets.length ? Math.min(...frets) : 0, fretMax: frets.length ? Math.max(...frets) : 0, meanFret };
  }
  // the hand a bar's strums hold, fingered: the grip the neck draws for
  // the bar — the CAGED shape the strums sit in, whole, or the grip they
  // are when it is no CAGED shape — one cell a string (where the shape and
  // a strum disagree on a string, the strum wins: that is what the hand
  // frets), the finger of each cell from js/fingering.js, and which
  // strings the bar strikes. `win` is the bar's hand position; `thumb`
  // the thumb over the neck on an E-shape barre.
  function gripFor(chord, barNotes, win, { thumb = false } = {}){
    const strums = barNotes.filter(n => n.strum && !n.next);
    if (!strums.length || !chord) return null;
    const struck = new Set(strums.map(n => `${n.string}:${n.fret}`));
    const given = gripOfBar(chord, barNotes);
    const struckCells = [...new Map(strums.map(n => [n.string, { string: n.string, fret: n.fret }])).values()];
    const { markers, placement } = GT.neckFollow.chordNeck(chord, win, [], given, struckCells);
    const byString = new Map(markers.filter(m => m.shapes).map(m => [m.string, { string: m.string, fret: m.fret }]));
    struckCells.forEach(c => byString.set(c.string, c));
    const cells = [...byString.values()].sort((a, b) => b.string - a.string);
    const hand = GT.fingering.handFor(cells, { thumb, allowed: new Set(GT.theory.chordPcs(chord)) });
    const fingered = cells.map(c => ({ ...c, finger: hand.fingers.get(`${c.string}:${c.fret}`), struck: struck.has(`${c.string}:${c.fret}`) }));
    return { name: given ? given.name : `${placement.name} shape`, cells: fingered, barres: hand.barres, base: hand.base, rows: hand.rows,
             key: fingered.map(c => `${c.string}:${c.fret}:${c.finger}`).join(',') };
  }
  // `opts.fingering`, when given, puts the grips over the tab: `{ thumb,
  // windowOf }`, windowOf the hand position of a bar; a diagram is marked
  // on a bar whose grip differs from the last one shown. Single notes get
  // no finger: a run's fingering is the box it comes from, which the neck
  // shows, and a rule for every fill would be wrong as often as right.
  function drawTab(host, feel, chords, notes, opts = {}){
    const grid = feel.grid;
    const fing = opts.fingering || null;
    const barNotes = i => notes.filter(n => n.bar === i);
    const grips = fing ? chords.map((c, i) => gripFor(c, barNotes(i), fing.windowOf(i), fing)) : [];
    let lastKey = null;
    const example = {
      grid,
      fingering: !!fing,
      bars: chords.map((c, i) => {
        let grip = null;
        if (fing && grips[i] && grips[i].key !== lastKey){ grip = grips[i]; lastKey = grips[i].key; }
        return { startSlot: i * grid, chord: displayName(c), numeral: c.numeral, shape: shapeOfBar(c, barNotes(i)), role: notes.roles ? (notes.roles[i] || '') : '', grip };
      }),
      notes: notes.map(n => ({
        string: n.string, fret: n.fret, at: n.bar * grid + n.at, dur: n.dur,
        bend: n.bend, slide: n.slide, tech: n.tech, to: n.to, soft: n.soft, mute: n.mute,
        vib: n.vib, trem: n.trem, rake: n.rake, ghost: n.ghost, trill: n.trill, trillTo: n.trillTo, tabHide: n.tabHide, tabDur: n.tabDur, wah: n.wah, unison: n.unison,
        strum: n.strum, stroke: n.stroke, voicing: n.voicing,
        tone: !n.strum && (n.mute || n.ghost) ? 'muted' : undefined,
        lead: !n.strum || !notes.some(m => m.bar === n.bar && m.at === n.at && m.strum && m.spread > n.spread),
      })),
      totalSlots: chords.length * grid,
    };
    const draw = () => {
      const b = GT.tab.build(example, Math.max(320, host.clientWidth || 800));
      host.innerHTML = `<svg viewBox="${b.viewBox}" width="${b.width}" height="${b.height}" role="img">${b.markup}</svg>`;
      return b;
    };
    let built = draw();
    // a long tab scrolls in a pane of as many rows as were last asked for;
    // the pane's control takes a gutter, so a tab that gets one is drawn
    // again to the width that leaves
    if (GT.tabPane && GT.tabPane.apply(host, built.metrics)){ built = draw(); GT.tabPane.apply(host, built.metrics); }
    host._tabExample = example;                      // for the print view: the same drawing, at a page's width
    return built.metrics;
  }

  // ---- the player ----
  // One part at a time: the style's own kit, comp and bass under it, the
  // part on the guitar on its own bus, looping over the six bars, queued
  // 0.4 s ahead the way the jam tab does it.
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
    showCount(playing.card, null);
    playing.card.querySelectorAll('.note-dot.sounding').forEach(g => g.classList.remove('sounding'));
    const { hooks } = playing;
    playing = null;
    log = [];
    if (hooks.onStop) hooks.onStop();
  }

  // `hooks` is what a page wants told as the loop goes round: `onBar(bar)`
  // when the playhead enters a bar, `onStop()` when the loop ends — the
  // Hendrix page redraws a neck for the bar's chord on the first and puts
  // it back on the second.
  function play(card, style, feel, chords, notes, tempo, metrics, hooks = {}){
    stop();
    audio.ensureAudio();
    const ctx = audio.ctx();
    if (ctx.state === 'suspended') ctx.resume();
    audio.warmGuitar(); audio.warmPiano(); audio.warmBass();
    audio.keepAwake(true);
    playing = { style, feel, chords, notes, tempo, card, metrics, hooks, shownBar: null, fromSlot: 0 };
    card.classList.add('playing');
    card.querySelector('.play').textContent = 'Stop';
    // from the start, or from where a click on the tab put the playhead
    const from = card._seek != null ? card._seek : 0;
    card._seek = null;
    bar = Math.floor(from / feel.grid) % chords.length;
    playing.fromSlot = from - Math.floor(from / feel.grid) * feel.grid;
    // the moment the first slot played lands at; a bar begun part-way
    // counts its start back from it
    nextBarTime = ctx.currentTime + 0.1;
    // a count-in when the page asks (`hooks.countIn`, beats): the hat for a
    // bar, the first heavier, the beat shown on the card as it goes
    if (hooks.countIn){
      const beats = hooks.countIn, spb = 60 / tempo;
      for (let k = 0; k < beats; k++) audio.playHiHat(nextBarTime + k * spb, k === 0 ? 0.55 : 0.32);
      playing.countFrom = nextBarTime; playing.countSpb = spb; playing.countBeats = beats;
      nextBarTime += beats * spb;
    }
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
      // a bar begun part-way (after a seek): only from that slot on, the
      // bar's own start counted back from the moment that slot lands at
      const from = playing.fromSlot || 0;
      playing.fromSlot = 0;
      const t0 = nextBarTime - from * slotDur;
      const chord = chords[bar], next = chords[(bar + 1) % chords.length];
      const slotsPerBeat = grid / beats;
      if (style === 'simple'){
        for (let beat = 0; beat < 4; beat++){
          if (beat * slotsPerBeat < from) continue;
          audio.playChord(chord, t0 + beat * spb, spb, beat === 0 ? 0.86 : 0.68, 'piano');
          audio.playHiHat(t0 + beat * spb, 0.4);
        }
      } else if (style === 'click'){
        // a metronome: the hat on every beat, the first of the bar heavier,
        // and the chord once a bar under it when the page asks (`hooks.comp`)
        for (let beat = 0; beat < beats; beat++) if (beat * slotsPerBeat >= from) audio.playHiHat(t0 + beat * spb, beat === 0 ? 0.55 : 0.32);
        if (playing.hooks.comp && from === 0) audio.playChord(chord, t0, barLen, 0.6, 'piano');
      } else {
        // the band as the jam tab plays it: fills, approaches, pushes,
        // stop-time bars and all, through band.js
        const bctx = { chord, next, audio, voice: 'piano',
                       changing: displayName(next) !== displayName(chord),
                       fillNow: bar === chords.length - 1,
                       stopped: !!(notes.stopBars && notes.stopBars.has(bar)) };
        for (let slot = from; slot < grid; slot++){
          GT.band.scheduleSlot(feel, slot, t0 + slot * slotDur + GT.band.swingOffset(feel, slot, slotDur), slotDur, bctx);
        }
      }
      // the part through the engine's one player, at the jam tab's default level
      audio.playPartNotes(notes.filter(n => n.bar === bar && n.at >= from), n => t0 + n.at * slotDur + GT.band.swingOffset(feel, Math.floor(n.at), slotDur), slotDur, audio.PART_LEVEL, { slapback: !!feel.slapback })
        .forEach(({ note: n, time, until }) => log.push({ time, until, slot: bar * grid + Math.floor(n.at), where: `${n.string}:${n.fret}` }));
      for (let slot = from; slot < grid; slot++) log.push({ time: t0 + slot * slotDur, slot: bar * grid + slot, head: true });
      nextBarTime = t0 + barLen;
      bar = (bar + 1) % chords.length;
    }
    if (log.length > 400) log = log.filter(e => (e.until || e.time) > ctx.currentTime - 1);
    timer = setTimeout(tick, TICK_MS);
  }
  // going hidden, the queue is filled to the wider cushion before the timers slow
  document.addEventListener('visibilitychange', () => { if (playing && document.hidden){ clearTimeout(timer); tick(); } });

  // the count-in's beat, by the first bar of the tab; nothing there otherwise
  function showCount(card, beat){
    let el = card.querySelector('.count-in');
    if (beat == null){ if (el) el.hidden = true; return; }
    if (!el){
      const host = card.querySelector('.tab');
      const wrap = host && host.parentNode && host.parentNode.classList.contains('tab-pane-wrap') ? host.parentNode : null;
      if (!wrap) return;
      el = document.createElement('div');
      el.className = 'count-in';
      wrap.insertBefore(el, host);
    }
    el.textContent = String(beat);
    el.hidden = false;
  }
  function follow(){
    if (!playing) return;
    const now = audio.ctx().currentTime;
    const { card, metrics } = playing;
    if (playing.countFrom != null){
      if (now < playing.countFrom + playing.countBeats * playing.countSpb - 0.0005){
        showCount(card, Math.min(playing.countBeats, Math.max(1, Math.floor((now - playing.countFrom) / playing.countSpb) + 1)));
        requestAnimationFrame(follow);
        return;
      }
      showCount(card, null);
      playing.countFrom = null;
    }
    const heads = log.filter(e => e.head && e.time <= now);
    const at = heads.length ? heads[heads.length - 1].slot : null;
    const head = card.querySelector('.tab-playhead');
    if (at != null){
      const pos = GT.tab.playheadPos(at, metrics);
      head.removeAttribute('hidden');
      head.setAttribute('x', pos.x); head.setAttribute('y', pos.y);
      if (GT.tabPane) GT.tabPane.follow(head.closest('.tab-pane'), metrics, at);
    }
    const live = log.filter(e => !e.head && e.time <= now && now < e.until);
    const sounding = new Set(live.map(e => e.slot));
    card.querySelectorAll('.tab-note').forEach(g => g.classList.toggle('now', sounding.has(Number(g.dataset.slot))));
    // a neck on the card, if it has one, lights the same notes where they're fretted
    const cells = new Set(live.map(e => e.where));
    card.querySelectorAll('.neck .note-dot').forEach(g => g.classList.toggle('sounding', cells.has(`${g.dataset.string}:${g.dataset.fret}`)));
    if (at != null){
      const barNow = Math.floor(at / playing.feel.grid);
      if (barNow !== playing.shownBar){ playing.shownBar = barNow; if (playing.hooks.onBar) playing.hooks.onBar(barNow); }
    }
    requestAnimationFrame(follow);
  }

  // ---- seeking: a click on the tab ----
  // A click on the tab sets the playback position. Playing, the loop jumps
  // there — what was queued is called off and the bar is picked up from
  // that slot; paused, the playhead moves there, the notes at that slot
  // light on the tab and on the card's neck, and the next Play starts from
  // it. `getState` gives the card's { feel, chords, notes, metrics } as they
  // are now; `hooks.onSeek(bar, slot)` lets the page draw its neck for the
  // bar first.
  function seekable(card, getState, hooks = {}){
    card.addEventListener('click', e => {
      const svg = e.target.closest('.tab svg');
      if (!svg || !svg.getScreenCTM) return;
      const st = getState();
      if (!st || !st.metrics) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      seekTo(card, GT.tab.slotAt(p.x, p.y, st.metrics), getState, hooks);
    });
  }
  function seekTo(card, slot, getState, hooks = {}){
    const st = getState();
    if (!st || !st.metrics) return;
    const grid = st.feel.grid, inBar = Math.floor(slot / grid), within = slot - inBar * grid;
    if (playing && playing.card === card){
      const ctx = audio.ctx();
      audio.cancelScheduled();
      log = [];
      playing.metrics = st.metrics;
      playing.shownBar = null;
      bar = inBar % playing.chords.length;
      playing.fromSlot = within;
      nextBarTime = ctx.currentTime + 0.05;
      clearTimeout(timer);
      tick();
      return;
    }
    card._seek = slot;
    const head = card.querySelector('.tab-playhead');
    if (head){
      const pos = GT.tab.playheadPos(slot, st.metrics);
      head.removeAttribute('hidden');
      head.setAttribute('x', pos.x); head.setAttribute('y', pos.y);
      if (GT.tabPane) GT.tabPane.follow(head.closest('.tab-pane'), st.metrics, slot);
    }
    card.querySelectorAll('.tab-note').forEach(g => g.classList.toggle('now', Number(g.dataset.slot) === slot));
    if (hooks.onSeek) hooks.onSeek(inBar, slot);
    const cells = new Set(st.notes.filter(n => n.bar === inBar && Math.floor(n.at) === within).map(n => `${n.string}:${n.fret}`));
    card.querySelectorAll('.neck .note-dot').forEach(g => g.classList.toggle('sounding', cells.has(`${g.dataset.string}:${g.dataset.fret}`)));
  }

  GT.examplePlayer = { windowFor, drawTab, shapeOfBar, gripOfBar, gripFor, play, stop, seekable, seekTo, playing: () => playing };
})();
