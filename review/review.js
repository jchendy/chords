// The style review page: every existing style and part beside what is
// proposed for it, both playable, with a decision to record on each.
//
// Nothing here touches the app. The page loads the app's modules and adds a
// player of its own that understands a few more things than the app's does
// — the proposals need them to be heard — and a realiser that wraps
// parts.js's realiseBar with the proposed engine features (fills that know
// whether the chord is changing, turnarounds, ghost notes, rakes, tremolo,
// chord slides, colour tones, shell voicings). Everything the page can play
// that the app can't is marked as such, so a decision to adopt it is also a
// decision to build it.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, SEMITONE } = GT.theory;
  const { STRING_MIDI, FRET_COUNT } = GT.fretboard;
  const parts = GT.parts;
  const audio = GT.audio;
  const { STYLES } = audio;
  const GUIDE = GT.partsGuide.GUIDE;
  const R = GT.review;                       // the proposals (review/proposals.js)

  const $ = id => document.getElementById(id);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- page options ----
  const opt = { reading: 'scale', tech: true, humanize: false, phrase: 2, seed: 1, slapback: true };

  // ---- a seeded roll, so a proposal's fills are the same on every play until asked otherwise ----
  function rng(seed){
    let x = (seed * 9301 + 49297) % 233280;
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  }

  // ---- windows and chords, as the guide does them ----
  function windowFor(keyName){
    const pc = SEMITONE[keyName] % 12;
    const onA = (pc - 9 + 12) % 12, onE = (pc - 4 + 12) % 12;
    const f = [onA, onE, onA + 12, onE + 12].find(x => x >= 2 && x <= 10);
    return { min: f, max: f + 4 };
  }
  function chordsOf(entry){
    const tonicPc = SEMITONE[entry.key] % 12;
    return entry.progression.map(name => chordFromName(name, tonicPc, entry.mode || 'major'));
  }

  // ---- placing one extra note: a colour tone on a strum, a shell voicing ----
  function placeIv(chord, opts, iv, above){
    const pal = parts.palette(chord, opts);
    const sn = parts.snap(pal.root, iv, pal.allowed);
    if (!sn) return null;
    const cells = parts.cellsIn(opts.window).filter(c => c.midi % 12 === sn.pc && (above == null || c.midi > above));
    if (!cells.length) return null;
    cells.sort((a, b) => a.midi - b.midi);
    return cells[0];
  }
  // root, 3rd and 7th (or 5th for a triad) on three strings, the 5th left
  // out — what a big-band rhythm guitar plays
  function shellVoicing(chord, opts){
    const cells = parts.cellsIn(opts.window);
    const pc = name => SEMITONE[name] % 12;
    const pcs = [pc(chord.note), pc(chord.third), chord.seventh ? pc(chord.seventh) : pc(chord.fifth)];
    const roots = cells.filter(c => c.midi % 12 === pcs[0] && c.string >= 3).sort((a, b) => a.midi - b.midi);
    if (!roots.length) return null;
    const root = roots[0];
    const out = [root];
    let string = root.string;
    for (const want of pcs.slice(1)){
      const cand = cells.filter(c => c.midi % 12 === want && c.string < string && c.string >= string - 2 && c.midi > out[out.length - 1].midi)
        .sort((a, b) => a.string - b.string);
      const c = cand[cand.length - 1] || cells.filter(x => x.midi % 12 === want && x.string < string).sort((a, b) => b.string - a.string)[0];
      if (!c) return null;
      out.push(c); string = c.string;
    }
    return out;
  }

  // ---- the realiser: parts.js's, with the proposed features round it ----
  // features (all optional, on the part or the written note):
  //   part.fillsOnChange / part.fillsOnStay — fills for a bar before a change / before more of the same chord
  //   part.turnaround — the last bar of the form
  //   note.ghost — a muted, quiet note (or strum)
  //   note.stacc — cut short
  //   note.pm — a palm-muted single note
  //   note.vib — vibrato (tab only; the engine can't yet)
  //   note.trem — tremolo picking: this many picks across the note's length
  //   note.rake — a rake across muted strings into the note
  //   note.up (on a double stop) — bend the lower note this far
  //   note.chordSlide — a strum slid in from this many frets below (negative: above)
  //   note.add — a colour tone on a strum (9, 13, 6...)
  //   voicing 'shell' — root 3rd 7th
  function realiseAdvanced(part, bars, opts, feat = {}){
    const roll = rng(feat.seed || 1);
    const phrase = feat.phrase || 2;
    const out = [];
    const pick = list => list[Math.floor(roll() * list.length)];
    let figureTurn = 0;
    bars.forEach((bar, b) => {
      if (!bar.chord) return;
      const next = bars[(b + 1) % bars.length].chord;
      const changing = displayName(next) !== displayName(bar.chord);
      const last = b === bars.length - 1;
      const fillBar = (b % phrase) === phrase - 1;
      let written;
      if (last && part.turnaround) written = part.turnaround;
      else if (fillBar){
        const list = changing && part.fillsOnChange ? part.fillsOnChange
                   : !changing && part.fillsOnStay ? part.fillsOnStay
                   : part.fills;
        written = pick(list);
      } else {
        const figures = [part.figure, ...(part.variants || [])];
        written = figures[figureTurn++ % figures.length];
      }
      // strums with a shell voicing or a colour tone are placed here; the
      // rest goes through parts.js
      const plain = [], extra = [];
      written.forEach(w => {
        if (w.strum && (w.voicing === 'shell' || w.add)) extra.push(w); else plain.push(w);
      });
      let notes = parts.realiseBar(plain, bar.chord, opts, next);
      extra.forEach(w => {
        let grip = w.voicing === 'shell' ? shellVoicing(bar.chord, opts) : parts.strumCells(bar.chord, opts, w.voicing || 'full');
        if (!grip) return;
        grip = grip.slice().sort((a, b) => a.midi - b.midi);
        if (w.add){
          const top = grip[grip.length - 1].midi;
          const c = placeIv(bar.chord, opts, w.add, top);
          if (c) grip.push(c);
        }
        const each = w.vel * parts.strumStringLevel(grip.length);
        grip.forEach((c, k) => notes.push({ at: w.at, dur: w.dur, vel: each, string: c.string, fret: c.fret, midi: c.midi,
                                             strum: true, voicing: w.voicing, mute: !!w.mute, spread: k * 0.016 }));
      });
      // the flags, matched back to the written note by its moment
      written.forEach(w => {
        const mine = notes.filter(n => Math.abs(n.at - w.at) < 1e-9 && (!!n.strum === !!w.strum));
        if (!mine.length) return;
        mine.forEach(n => {
          if (w.ghost){ n.vel *= 0.35; n.mute = true; n.ghost = true; }
          if (w.stacc) n.dur = Math.min(n.dur, 0.5);
          if (w.pm) n.mute = true;
          if (w.vib) n.vib = true;
          if (w.rake) n.rake = true;
          if (w.chordSlide && n.strum){ const from = n.fret - w.chordSlide; if (from >= 1 && from <= FRET_COUNT) n.slide = from; }
          if (w.tech === 'double' && w.up && !n.pair && n.fret > 0) n.bend = w.up;
        });
        if (w.trem && !w.strum){
          const n = mine[0];
          const reps = w.trem, step = n.dur / reps;
          notes = notes.filter(x => x !== n);
          for (let k = 0; k < reps; k++) notes.push({ ...n, at: n.at + k * step, dur: step * 0.9, vel: n.vel * (k % 2 ? 0.75 : 1), trem: true });
        }
      });
      notes.forEach(n => out.push({ ...n, bar: b }));
    });
    return out;
  }

  // ---- the band, described from its pattern ----
  const beatsOf = (grid, slots, beats = 4) => {
    const per = grid / beats;
    return slots.map(s => { const beat = Math.floor(s / per) + 1, frac = (s % per) / per; return frac === 0 ? String(beat) : frac === 0.5 ? beat + '&' : frac < 0.5 ? beat + 'e' : beat + 'a'; }).join(' ');
  };
  function describeBand(p, style){
    if (style === 'simple') return 'Piano: the chord on every beat (or half, or whole note), a click if wanted. No bass, no kit.';
    const beats = p.beats || 4;
    const bits = [];
    if (p.kick && p.kick.length) bits.push(`Kick ${beatsOf(p.grid, p.kick, beats)}`);
    if (p.snare && p.snare.length) bits.push(`Snare ${beatsOf(p.grid, p.snare, beats)}${p.snareVel && p.snareVel < 0.7 ? ' (soft)' : ''}`);
    if (p.ghost && p.ghost.length) bits.push(`ghost snare ${beatsOf(p.grid, p.ghost, beats)}`);
    if (p.hat && p.hat.length) bits.push(`Hat ${p.hat.length >= p.grid / 2 ? (p.hat.length === p.grid ? '16ths' : '8ths') : beatsOf(p.grid, p.hat, beats)}${p.hatOpen ? ' (open ' + beatsOf(p.grid, p.hatOpen, beats) + ')' : ''}`);
    if (p.ride && p.ride.length) bits.push(`Ride ${p.ride.length === p.grid ? 'every slot' : beatsOf(p.grid, p.ride, beats)}`);
    if (p.rim && p.rim.length) bits.push(`Rim ${beatsOf(p.grid, p.rim, beats)}`);
    const has = k => p[k] && p[k].length;
    if (!has('kick') && !has('snare') && !has('hat') && !has('ride')) bits.push('No drums');
    if (p.fill) bits.push('a drum fill into the top of the form');
    if (p.bass && p.bass.length){
      const offs = p.bass.map(e => 'walk' in e ? 'walk' : e.next ? `next${e.off ? (e.off > 0 ? '+' + e.off : e.off) : ''}` : String(e.off));
      bits.push(`Bass on ${beatsOf(p.grid, p.bass.map(e => e.slot), beats)} (${offs.join(' ')})${p.bassApproach ? ', approaching each change' : ''}`);
    }
    if (p.chord && p.chord.length) bits.push(`Comp (${p.voice}) on ${beatsOf(p.grid, p.chord.map(e => e.slot), beats)}${p.compAnticipate ? ', anticipating each change' : ''}`);
    if (p.swing) bits.push(`16ths swung ${Math.round(50 + p.swing * 50)}%`);
    if (beats !== 4) bits.push(`${beats} beats to the bar`);
    return bits.join(' · ');
  }

  // ---- the player ----
  const AHEAD = 0.4, TICK_MS = 25;
  let playing = null, timer = 0, nextBarTime = 0, bar = 0, log = [];

  function stop(){
    if (!playing) return;
    clearTimeout(timer);
    audio.cancelScheduled();
    audio.keepAwake(false);
    const { host } = playing;
    host.classList.remove('playing');
    host.querySelectorAll('.tab-playhead').forEach(h => h.setAttribute('hidden', ''));
    host.querySelectorAll('.tab-note.now').forEach(g => g.classList.remove('now'));
    host.querySelectorAll('.play').forEach(b => { if (b.dataset.on) { b.textContent = b.dataset.label || 'Play'; delete b.dataset.on; } });
    playing = null; log = [];
  }

  function play(host, btn, run){
    // run: { pattern, style, chords, tempo, notes, metrics, tabHost, extras }
    stop();
    audio.ensureAudio();
    const ctx = audio.ctx();
    if (ctx.state === 'suspended') ctx.resume();
    audio.warmGuitar(); audio.warmPiano(); audio.warmBass();
    audio.keepAwake(true);
    playing = { ...run, host };
    host.classList.add('playing');
    btn.dataset.on = '1'; btn.dataset.label = btn.textContent; btn.textContent = 'Stop';
    bar = 0; nextBarTime = ctx.currentTime + 0.1; log = [];
    tick();
    requestAnimationFrame(follow);
  }

  const jitter = (amt) => opt.humanize ? (Math.random() * 2 - 1) * amt : 0;

  function tick(){
    if (!playing) return;
    const ctx = audio.ctx();
    const { pattern: p, style, chords, tempo, notes } = playing;
    const beats = p.beats || 4;
    const spb = 60 / tempo, barLen = spb * beats, grid = p.grid, slotDur = barLen / grid;
    // swung sixteenths: the second of each pair of 16ths late by this much of a 16th
    const swingOf = slot => (p.swing && grid % 4 === 0 && slot % 2 === 1) ? p.swing * slotDur * 0.5 : 0;
    for (let skip = audio.stepsToSkip(nextBarTime, ctx.currentTime, barLen); skip > 0; skip--){ nextBarTime += barLen; bar = (bar + 1) % chords.length; }
    while (nextBarTime < ctx.currentTime + AHEAD){
      const t0 = nextBarTime;
      const chord = chords[bar], next = chords[(bar + 1) % chords.length];
      const changing = displayName(next) !== displayName(chord);
      const lastBar = bar === chords.length - 1;
      if (style === 'simple'){
        for (let beat = 0; beat < 4; beat++){
          audio.playChord(chord, t0 + beat * spb, spb, beat === 0 ? 0.86 : 0.68, 'piano');
          audio.playHiHat(t0 + beat * spb, 0.4);
        }
      } else {
        const fillNow = lastBar && p.fill;
        for (let slot = 0; slot < grid; slot++){
          const t = t0 + slot * slotDur + swingOf(slot) + jitter(0.006);
          const vk = (p.kickVels && p.kickVels[slot]) || p.kickVel || 0.9;
          const vs = (p.snareVels && p.snareVels[slot]) || p.snareVel || 0.85;
          if (fillNow){
            if (p.fill.kick && p.fill.kick.includes(slot)) audio.playKick(t, vk);
            if (p.fill.snare && p.fill.snare.includes(slot)) audio.playSnare(t, 0.5 + 0.4 * (slot / grid));
            if (p.fill.hat && p.fill.hat.includes(slot)) audio.playHiHat(t, 0.5);
          } else {
            if (p.kick && p.kick.includes(slot)) audio.playKick(t, vk);
            if (p.snare && p.snare.includes(slot)) audio.playSnare(t, vs);
            if (p.ghost && p.ghost.includes(slot)) audio.playSnare(t, 0.22);
            if (p.rim && p.rim.includes(slot)) audio.playSnare(t, 0.3);
            if (p.hat && p.hat.includes(slot)){
              const open = p.hatOpen && p.hatOpen.includes(slot);
              audio.playHiHat(t, slot % (grid / beats) === 0 ? 0.55 : 0.32, open ? 0.28 : 0.06);
            }
            if (p.ride && p.ride.includes(slot)) audio.playRide(t, slot % (grid / beats) === 0 ? 0.6 : 0.45);
          }
          const ce = p.chord && p.chord.find(e => e.slot === slot);
          if (ce) audio.playStyleVoice(p.voice, chord, t, ce.dur * slotDur, ce.vel + jitter(0.06), 'piano');
          // the comp anticipating the change: the next chord on the last eighth
          if (p.compAnticipate && changing && slot === grid - grid / beats / 2){
            audio.playStyleVoice(p.voice, next, t, slotDur * (grid / beats / 2), 0.6, 'piano');
          }
          const be = p.bass && p.bass.find(e => e.slot === slot);
          if (be){
            let freq;
            if ('walk' in be) freq = audio.walkBassFreq(chord, next, be.walk, changing);
            else if (be.next) freq = audio.bassNote(SEMITONE[next.note] % 12, be.off || 0);
            else freq = audio.bassNote(SEMITONE[chord.note] % 12, be.off);
            // a chromatic approach into the change, on the last eighth
            if (p.bassApproach && changing && slot >= grid - grid / beats / 2) freq = audio.bassNote(SEMITONE[next.note] % 12, -1);
            audio.playBass(freq, t, be.dur * slotDur, be.vel + jitter(0.05));
          }
        }
        if (p.bassApproach && changing && !(p.bass || []).some(e => e.slot >= grid - grid / beats / 2)){
          const t = t0 + (grid - grid / beats / 2) * slotDur;
          audio.playBass(audio.bassNote(SEMITONE[next.note] % 12, -1), t, slotDur * (grid / beats / 2), 0.75);
        }
      }
      notes.filter(n => n.bar === bar).forEach(n => {
        const t = t0 + n.at * slotDur + swingOf(Math.floor(n.at)) + (n.spread || 0) + jitter(0.008), dur = n.dur * slotDur;
        const vel = (n.vel + jitter(0.08)) * 2.4;
        const fx = n.bend ? { bend: n.bend } : n.slide != null ? { slideFrom: hz(n.midi + (n.slide - n.fret)) }
                 : n.soft ? { soft: true } : n.mute ? { mute: true } : null;
        if (n.rake){
          // two muted strings swept into the note, the way a pick rakes
          [2, 1].forEach((k, i) => audio.playPluck(hz(n.midi - 5 * k), t - 0.028 + i * 0.012, 0.06, 0.22, 'part', { mute: true }));
        }
        audio.playPluck(hz(n.midi), t, dur, vel, 'part', fx);
        if (opt.slapback && p.slapback) audio.playPluck(hz(n.midi), t + 0.11, Math.min(dur, 0.25), vel * 0.35, 'part', fx && fx.mute ? fx : null);
        log.push({ time: t, until: t + dur, slot: bar * grid + n.at });
      });
      for (let slot = 0; slot < grid; slot++) log.push({ time: t0 + slot * slotDur, slot: bar * grid + slot, head: true });
      nextBarTime += barLen;
      bar = (bar + 1) % chords.length;
    }
    if (log.length > 600) log = log.filter(e => (e.until || e.time) > ctx.currentTime - 1);
    timer = setTimeout(tick, TICK_MS);
  }

  function follow(){
    if (!playing) return;
    const now = audio.ctx().currentTime;
    const { tabHost, metrics } = playing;
    if (tabHost && metrics){
      const heads = log.filter(e => e.head && e.time <= now);
      const at = heads.length ? heads[heads.length - 1].slot : null;
      const head = tabHost.querySelector('.tab-playhead');
      if (head && at != null){
        const pos = GT.tab.playheadPos(at, metrics);
        head.removeAttribute('hidden'); head.setAttribute('x', pos.x); head.setAttribute('y', pos.y);
      }
      const sounding = new Set(log.filter(e => !e.head && e.time <= now && now < e.until).map(e => e.slot));
      tabHost.querySelectorAll('.tab-note').forEach(g => g.classList.toggle('now', sounding.has(Number(g.dataset.slot))));
    }
    requestAnimationFrame(follow);
  }

  // ---- drawing a part ----
  function drawTab(host, grid, chords, notes){
    const example = {
      grid,
      bars: chords.map((c, i) => ({ startSlot: i * grid, chord: displayName(c), numeral: c.numeral })),
      notes: notes.map(n => ({
        string: n.string, fret: n.fret, at: n.bar * grid + n.at, dur: n.dur,
        bend: n.bend, slide: n.slide, tech: n.tech, to: n.to, soft: n.soft,
        // an "x" over a muted strum; a muted or ghosted single note is drawn dim
        mute: n.strum ? n.mute : undefined,
        tone: !n.strum && (n.mute || n.ghost) ? 'muted' : undefined,
        lead: !n.strum || !notes.some(m => m.bar === n.bar && m.at === n.at && m.strum && m.spread > n.spread),
      })),
      totalSlots: chords.length * grid,
    };
    const built = GT.tab.build(example, Math.max(300, host.clientWidth || 600));
    host.innerHTML = `<svg viewBox="${built.viewBox}" width="${built.width}" height="${built.height}" role="img">${built.markup}</svg>`;
    // marks the tab drawer doesn't know yet: vibrato and tremolo
    const svg = host.querySelector('svg');
    notes.forEach(n => {
      if (!n.vib && !n.trem) return;
      const g = [...svg.querySelectorAll('.tab-note')].find(x => Number(x.dataset.slot) === n.bar * grid + n.at);
      if (!g) return;
      const t = g.querySelector('text');
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      m.setAttribute('class', 'tab-tech'); m.setAttribute('x', t.getAttribute('x')); m.setAttribute('y', Number(t.getAttribute('y')) - 10); m.setAttribute('text-anchor', 'middle');
      m.textContent = n.vib ? '~' : '≡';
      svg.appendChild(m);
    });
    return built.metrics;
  }

  // ---- realising a part for a card ----
  function realiseCard(part, entry, style, advanced){
    const chords = chordsOf(entry);
    const bars = chords.map(chord => ({ chord }));
    const opts = {
      reading: opt.reading, window: windowFor(entry.key), scaleTheory: entry.scaleTheory || 'parallel', stringSet: 2,
      stayOnKey: false, key: { tonic: entry.key, mode: entry.mode || 'major' },
      tech: opt.tech ? null : { double: false, bend: false, hammer: false, pull: false, slide: false },
    };
    const notes = advanced
      ? realiseAdvanced(part, bars, opts, { seed: opt.seed, phrase: opt.phrase })
      : parts.realise(part, bars, [0, 1, 2, 0, 1, 2].slice(0, Math.ceil(bars.length / 2)), opts);
    return { chords, notes };
  }

  // ---- decisions ----
  const KEY = 'style-review-decisions';
  let decisions = {};
  try { decisions = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { decisions = {}; }
  let saveTimer = 0;
  function saveDecisions(){
    try { localStorage.setItem(KEY, JSON.stringify(decisions)); } catch (e) { /* private mode */ }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fetch('/review/decisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ savedAt: new Date().toISOString(), decisions }, null, 2) })
        .then(r => { $('saveNote').textContent = r.ok ? 'Saved to review/decisions.json' : 'Saved in this browser (the server did not take it)'; })
        .catch(() => { $('saveNote').textContent = 'Saved in this browser (no server) — use Copy decisions'; });
    }, 400);
    summarise();
  }
  function decisionControls(id, choices){
    const d = decisions[id] || {};
    const radios = choices.map(([value, label]) =>
      `<label class="choice"><input type="radio" name="d-${esc(id)}" value="${esc(value)}" ${d.choice === value ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('');
    return `<div class="decide" data-id="${esc(id)}">
      <div class="choices">${radios}</div>
      <textarea placeholder="Suggestions, tweaks, what you'd want different…" rows="2">${esc(d.note || '')}</textarea>
    </div>`;
  }
  function wireDecisions(root){
    root.querySelectorAll('.decide').forEach(el => {
      const id = el.dataset.id;
      el.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', () => {
        decisions[id] = { ...(decisions[id] || {}), choice: r.value }; saveDecisions();
      }));
      const ta = el.querySelector('textarea');
      ta.addEventListener('input', () => { decisions[id] = { ...(decisions[id] || {}), note: ta.value }; saveDecisions(); });
    });
  }
  function summarise(){
    const all = [...document.querySelectorAll('.decide')].map(el => el.dataset.id);
    const done = all.filter(id => decisions[id] && (decisions[id].choice || (decisions[id].note || '').trim()));
    $('summary').textContent = `${done.length} of ${all.length} decided`;
  }

  // ---- rendering ----
  const feelOf = (style, label) => style === 'simple' ? parts.SIMPLE_FEEL : STYLES[style].variants.find(v => v.label === label);
  const guideFor = (style, label) => GUIDE[`${style}/${label}`] || (GUIDE[style] && GUIDE[style].feel === label ? GUIDE[style] : null);

  let cardCount = 0;
  function partCard(host, part, entry, style, pattern, advanced, tag){
    const id = `c${++cardCount}`;
    const card = document.createElement('div');
    card.className = 'partcard';
    const flags = [];
    const allWritten = [part.figure, ...(part.variants || []), ...(part.fills || []), ...(part.fillsOnChange || []), ...(part.fillsOnStay || []), ...(part.turnaround ? [part.turnaround] : [])];
    const has = k => allWritten.some(bar => bar.some(n => n[k]));
    if (part.fillsOnChange || part.fillsOnStay) flags.push('change-aware fills');
    if (part.turnaround) flags.push('turnaround');
    ['ghost', 'rake', 'trem', 'vib', 'stacc', 'pm', 'chordSlide', 'add'].forEach(k => { if (has(k)) flags.push({ ghost: 'ghost notes', rake: 'rakes', trem: 'tremolo picking', vib: 'vibrato', stacc: 'staccato', pm: 'palm-muted notes', chordSlide: 'chord slides', add: 'colour tones' }[k]); });
    if (allWritten.some(bar => bar.some(n => n.strum && n.voicing === 'shell'))) flags.push('shell voicings');
    if (allWritten.some(bar => bar.some(n => n.tech === 'double' && n.up))) flags.push('double-stop bends');
    card.innerHTML = `
      <div class="part-head"><h4>${esc(part.name)}${tag ? ` <span class="tag">${esc(tag)}</span>` : ''}</h4><button type="button" class="play">Play</button></div>
      ${part.why ? `<p class="why">${part.why}</p>` : ''}
      ${flags.length ? `<p class="flags">Needs: ${flags.map(f => `<span>${esc(f)}</span>`).join(' ')}</p>` : ''}
      <div class="tab"></div>`;
    host.appendChild(card);
    const tabHost = card.querySelector('.tab');
    let state = null;
    const build = () => {
      try {
        const { chords, notes } = realiseCard(part, entry, style, advanced);
        const metrics = drawTab(tabHost, pattern.grid, chords, notes);
        state = { chords, notes, metrics };
      } catch (err){
        tabHost.innerHTML = `<p class="err">Could not realise: ${esc(err.message)}</p>`;
        console.error(part.name, err);
      }
    };
    build();
    card.querySelector('.play').addEventListener('click', () => {
      const btn = card.querySelector('.play');
      if (playing && playing.host === card){ stop(); return; }
      if (!state) return;
      play(card, btn, { pattern, style, chords: state.chords, tempo: entry.tempo, notes: state.notes, metrics: state.metrics, tabHost });
    });
    card.rebuild = () => { if (playing && playing.host === card) stop(); build(); };
    return card;
  }

  function bandCard(host, pattern, style, entry, label){
    const card = document.createElement('div');
    card.className = 'bandcard';
    card.innerHTML = `<div class="part-head"><h4>${esc(label)}</h4><button type="button" class="play">Play the band</button></div><p class="desc">${esc(describeBand(pattern, style))}</p>`;
    host.appendChild(card);
    card.querySelector('.play').addEventListener('click', () => {
      if (playing && playing.host === card){ stop(); return; }
      play(card, card.querySelector('.play'), { pattern, style, chords: chordsOf(entry), tempo: entry.tempo, notes: [], metrics: null, tabHost: null });
    });
    return card;
  }

  // ?only=blues,rock shows those genres alone — the page is long
  const only = (new URLSearchParams(location.search).get('only') || '').split(',').map(x => x.trim()).filter(Boolean);
  function render(){
    const main = $('genres');
    main.innerHTML = '';
    R.genres.filter(genre => !only.length || only.includes(genre.id)).forEach(genre => {
      const sec = document.createElement('section');
      sec.className = 'genre';
      sec.id = `g-${genre.id}`;
      sec.innerHTML = `<h2>${esc(genre.name)}</h2><div class="research">${genre.research}</div>`;
      // existing sub-styles with their revisions
      (genre.existing || []).forEach(ex => {
        const feel = feelOf(ex.style, ex.label);
        const guide = guideFor(ex.style, ex.label);
        if (!feel || !guide){ sec.insertAdjacentHTML('beforeend', `<p class="err">No app style ${esc(ex.style)}/${esc(ex.label)}</p>`); return; }
        const entry = { ...guide, ...(ex.entry || {}) };
        const block = document.createElement('div');
        block.className = 'compare';
        const id = `${ex.style}/${ex.label}`;
        block.innerHTML = `
          <h3>${esc(ex.label)}${ex.rename ? ` <span class="rename">→ proposed name: ${esc(ex.rename)}</span>` : ''}</h3>
          <p class="meta">${esc(entry.progression.join(' · '))} in ${esc(entry.key)} · ${entry.tempo} BPM</p>
          <div class="cols">
            <div class="col existing"><div class="colhead">Existing</div><div class="band"></div><div class="parts"></div></div>
            <div class="col proposed"><div class="colhead">Proposed</div><div class="verdict">${ex.verdict || ''}</div><div class="band"></div><div class="parts"></div></div>
          </div>
          ${decisionControls(id, [['keep', 'Keep as is'], ['proposed', 'Use the proposed version'], ['mix', 'Mix (say which bits)'], ['drop', 'Drop this style']])}`;
        sec.appendChild(block);
        const exCol = block.querySelector('.col.existing'), prCol = block.querySelector('.col.proposed');
        bandCard(exCol.querySelector('.band'), feel, ex.style, entry, 'The band now');
        parts.partsFor(ex.style, ex.label).forEach(part => partCard(exCol.querySelector('.parts'), part, entry, ex.style, feel, false));
        const proposedPattern = ex.band ? { ...feel, ...ex.band } : feel;
        bandCard(prCol.querySelector('.band'), proposedPattern, ex.style, entry, ex.band ? 'The band, revised' : 'The band, unchanged');
        (ex.parts || []).forEach(part => partCard(prCol.querySelector('.parts'), part, entry, ex.style, proposedPattern, true, part.replaces ? `replaces ${part.replaces}` : 'new'));
      });
      // new sub-styles
      (genre.additions || []).forEach(add => {
        const block = document.createElement('div');
        block.className = 'compare addition';
        const id = `add/${genre.id}/${add.label}`;
        block.innerHTML = `
          <h3>${esc(add.label)} <span class="tag new">new</span>${add.inspired ? ` <span class="rename">inspired by ${esc(add.inspired)}</span>` : ''}</h3>
          <p class="meta">${esc(add.progression.join(' · '))} in ${esc(add.key)} · ${add.tempo} BPM</p>
          <div class="verdict">${add.why || ''}</div>
          <div class="cols one"><div class="col proposed"><div class="band"></div><div class="parts"></div></div></div>
          ${decisionControls(id, [['add', 'Add it'], ['maybe', 'Add, with tweaks (say which)'], ['skip', 'Skip']])}`;
        sec.appendChild(block);
        const col = block.querySelector('.col.proposed');
        const entry = { progression: add.progression, key: add.key, tempo: add.tempo, mode: add.mode, scaleTheory: add.scaleTheory };
        bandCard(col.querySelector('.band'), add.band, add.style || genre.id, entry, 'The band');
        (add.parts || []).forEach(part => partCard(col.querySelector('.parts'), part, entry, add.style || genre.id, add.band, true));
      });
      main.appendChild(sec);
    });
    // engine proposals
    const eng = $('engineList');
    eng.innerHTML = '';
    (R.engine || []).forEach(e => {
      const el = document.createElement('div');
      el.className = 'engine-item';
      el.innerHTML = `<h3>${esc(e.title)}${e.demo ? ' <span class="tag">demo above</span>' : ' <span class="tag needs">engine work, no demo</span>'}</h3><div class="verdict">${e.why}</div>
        ${decisionControls(`engine/${e.id}`, [['yes', 'Do it'], ['later', 'Later'], ['no', 'No']])}`;
      eng.appendChild(el);
    });
    wireDecisions(document);
    summarise();
    $('toc').innerHTML = R.genres.map(g => `<a href="${only.length ? `?only=${g.id}` : `#g-${g.id}`}">${esc(g.name)}</a>`).join('')
      + (only.length ? '<a href="review.html">All genres</a>' : '<a href="#engine">Engine</a>');
  }

  function rebuildAll(){ document.querySelectorAll('.partcard').forEach(c => c.rebuild && c.rebuild()); }

  // ---- controls ----
  document.querySelectorAll('#readingGroup button').forEach(b => b.addEventListener('click', () => {
    opt.reading = b.dataset.value;
    document.querySelectorAll('#readingGroup button').forEach(x => x.classList.toggle('active', x === b));
    rebuildAll();
  }));
  $('techToggle').addEventListener('change', () => { opt.tech = $('techToggle').checked; rebuildAll(); });
  $('humanToggle').addEventListener('change', () => { opt.humanize = $('humanToggle').checked; });
  $('slapToggle').addEventListener('change', () => { opt.slapback = $('slapToggle').checked; });
  $('phraseSel').addEventListener('change', () => { opt.phrase = Number($('phraseSel').value); rebuildAll(); });
  $('rerollBtn').addEventListener('click', () => { opt.seed = Math.floor(Math.random() * 1e6); $('seedNote').textContent = `seed ${opt.seed}`; rebuildAll(); });
  $('copyBtn').addEventListener('click', async () => {
    const text = JSON.stringify({ savedAt: new Date().toISOString(), decisions }, null, 2);
    try { await navigator.clipboard.writeText(text); $('saveNote').textContent = 'Copied to the clipboard'; }
    catch (e){ $('saveNote').textContent = 'Could not copy — select the box below'; $('dump').hidden = false; $('dump').value = text; }
  });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/input|select|textarea/i.test(e.target.tagName)){ e.preventDefault(); if (playing) stop(); } });
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; rebuildAll(); } }, 200); });

  render();
  GT.reviewPage = { realiseAdvanced, describeBand, decisions: () => decisions, stop };
})();
