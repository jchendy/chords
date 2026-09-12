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
  // what the app played before the proposals were merged in: the base data
  const BASE = GT.styles.base, BASE_LIBRARY = BASE.LIBRARY;
  const GUIDE = GT.styles.base.GUIDE;   // the guide as it was: the existing side is what the app played before
  const R = GT.review;                       // the proposals (review/proposals.js)

  const $ = id => document.getElementById(id);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- page options ----
  const opt = { reading: 'scale', tech: true, humanize: false, phrase: 2, seed: 1, slapback: true, easy: false, fast: false };

  // ---- easy mode ----
  // A part with an `easy` block plays that (its author's simplification);
  // any other part is simplified by rule: ghost notes go, so do rakes,
  // tremolo, chord slides and colour tones; bends, hammer-ons, pull-offs and
  // slides play plain (double stops stay — they are not the hard part);
  // sixteenths move back onto the eighth before them (and drop if that
  // eighth already has a note), the middle of a triplet drops, and nothing
  // is shorter than an eighth. Tails, pickups and stop-time are left out.
  const EASY_TECH = { double: true, bend: false, hammer: false, pull: false, slide: false };
  function simplify(written, grid){
    const per = grid % 3 === 0 ? 3 : 4;
    const out = [];
    (written || []).forEach(w => {
      if (w.ghost) return;
      const x = { ...w };
      delete x.rake; delete x.trem; delete x.chordSlide; delete x.add; delete x.up;
      if (per === 4 && x.at % 2 === 1) x.at = x.at - 1;
      if (per === 3 && x.at % 3 === 1) return;
      if (per === 4 && x.dur < 2) x.dur = 2;
      if (per === 3 && x.dur < 1.5) x.dur = 1.5;
      out.push(x);
    });
    const seen = new Set();
    // a moved sixteenth that lands on a note, or on a strum of the same
    // voicing, is dropped; a bass strum under a chord on the same slot (the
    // batida's thumb and fingers) is two voicings and stays
    return out.filter(x => { const k = `${x.at}${x.strum ? 's' + (x.voicing || 'full') : 'n'}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function easyVersion(part, grid){
    // tails, pickups and stop-time stay in the part with their chance at zero,
    // so the seed draws the same fills as it does with easy mode off: the same
    // roll, simplified, not another roll
    const off = { tailChance: 0, pickupChance: 0, stopChance: 0 };
    if (part.easy) return { ...part, ...off, turnarounds: null, turnaround: null, ...part.easy, easyKind: 'written' };
    const lists = {};
    ['figure', 'turnaround'].forEach(k => { if (part[k]) lists[k] = simplify(part[k], grid); });
    ['variants', 'fills', 'fillsOnChange', 'fillsOnStay', 'turnarounds', 'leads'].forEach(k => { if (part[k]) lists[k] = part[k].map(bar => simplify(bar, grid)); });
    return { ...part, ...lists, ...off, easyKind: 'auto' };
  }

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
  //   strum with next:true — the NEXT chord, struck early (the "and of 4" push)
  // and, on the part, the ways of mixing the figure and the fills that the
  // second pass added (see proposals-more.js):
  //   part.turnarounds — several turnarounds, one rolled per pass
  //   part.tails (+ tailChance) — two-beat licks that replace the second half
  //       of a figure bar, some of the time: the figure with a lick tagged on
  //   part.pickups (+ pickupChance) — one-beat lead-ins into a change, on the
  //       last beat of the figure bar before it
  //   part.stops (+ stopChance) — stop-time: a bar where the band drops out on
  //       the One and the guitar fills the silence
  //   part.figureMode 'roll' — the figure and its variants rolled, not cycled
  function realiseAdvanced(part, bars, opts, feat = {}){
    const roll = rng(feat.seed || 1);
    const phrase = feat.phrase || 2;
    const grid = feat.grid || 16;
    const out = [];
    const stopBars = new Set();
    const pick = list => list[Math.floor(roll() * list.length)];
    const cells = parts.cellsIn(opts.window);
    // a lead roll: some rolls of a chord part put its lead lines in the fill
    // bars, so the same part is rhythm on one roll and lead on another
    const leadRoll = !!(part.leads && part.leads.length) && roll() < (part.leadChance == null ? 0.35 : part.leadChance);
    let figureTurn = 0;
    bars.forEach((bar, b) => {
      if (!bar.chord) return;
      const next = bars[(b + 1) % bars.length].chord;
      const changing = displayName(next) !== displayName(bar.chord);
      const last = b === bars.length - 1;
      const fillBar = (b % phrase) === phrase - 1;
      let written;
      const turnarounds = part.turnarounds || (part.turnaround ? [part.turnaround] : null);
      if (last && turnarounds) written = pick(turnarounds);
      else if (fillBar){
        if (part.stops && part.stops.length && roll() < (part.stopChance == null ? 0.2 : part.stopChance)){
          written = pick(part.stops);
          stopBars.add(b);
        } else if (leadRoll){
          written = pick(part.leads);
        } else {
          // the fills for the situation, and the plain ones with them — a
          // plain fill fits either way, and was never heard here while a
          // change or stay list existed
          const situation = (changing ? part.fillsOnChange : part.fillsOnStay) || [];
          const list = situation.concat(part.fills || []);
          written = pick(list.length ? list : part.fills);
        }
      } else {
        const figures = [part.figure, ...(part.variants || [])];
        written = part.figureMode === 'roll' ? pick(figures) : figures[figureTurn++ % figures.length];
        // a lick tagged on the end of the figure bar, some of the time
        if (part.tails && part.tails.length && roll() < (part.tailChance == null ? 0.5 : part.tailChance)){
          written = written.filter(w => w.at < grid / 2).concat(pick(part.tails));
        }
        // a lead-in to the next chord on the last beat, when it changes
        if (changing && part.pickups && part.pickups.length && roll() < (part.pickupChance == null ? 0.5 : part.pickupChance)){
          written = written.filter(w => w.at < grid * 3 / 4).concat(pick(part.pickups));
        }
      }
      // strums with a shell voicing, a colour tone or on the next chord are
      // placed here; the rest goes through parts.js
      const plain = [], extra = [], pairs = [];
      const doubleOk = !(opts.tech && opts.tech.double === false);
      written.forEach(w => {
        if (w.strum && (w.voicing === 'shell' || w.voicing === 'power' || w.voicing === 'bass' || w.voicing === 'fifth' || w.add || w.next)) extra.push(w);
        else if (w.tech === 'double' && doubleOk) pairs.push(w);
        else plain.push(w);
      });
      let notes = parts.realiseBar(plain, bar.chord, opts, next);
      // double stops placed the way a hand plays them: the written interval
      // kept, 2nds to 5ths on adjacent strings, 6ths and octaves skipping
      // one, 10ths skipping two (the app places each note by pitch alone)
      const pal = parts.palette(bar.chord, opts), nextPal = parts.palette(next, opts);
      pairs.forEach(w => {
        const placed = placePair(w, cells, w.next ? nextPal : pal, homeMidi(cells, (w.next ? nextPal : pal).root));
        if (!placed){ notes = notes.concat(parts.realiseBar([w], w.next ? next : bar.chord, opts, next)); return; }
        const mk = (c, more) => ({ at: w.at, dur: w.dur, vel: w.vel, string: c.string, fret: c.fret, midi: c.midi, iv: w.iv, next: !!w.next, tech: 'double', ...more });
        notes.push(mk(placed.c1, {}), mk(placed.c2, { pair: true, iv: w.iv2 }));
      });
      extra.forEach(w => {
        const on = w.next ? next : bar.chord;
        let grip = w.voicing === 'shell' ? shellVoicing(on, opts) : w.voicing === 'power' ? powerVoicing(on, opts)
                 : (w.voicing === 'bass' || w.voicing === 'fifth') ? (thumbCell(on, opts, w.voicing) || parts.strumCells(on, opts, w.voicing))
                 : parts.strumCells(on, opts, w.voicing || 'full');
        if (!grip) return;
        grip = grip.slice().sort((a, b) => a.midi - b.midi);
        if (w.add){
          const top = grip[grip.length - 1].midi;
          const c = placeIv(on, opts, w.add, top);
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
    out.stopBars = stopBars;
    out.leadRoll = leadRoll;
    return out;
  }

  // where the part's root sits in the window, as parts.js finds it
  function homeMidi(cells, root){
    const roots = cells.filter(c => c.midi % 12 === root).sort((a, b) => a.midi - b.midi);
    const low = roots.filter(c => c.string >= 3);
    if (low.length) return low[0].midi;
    if (roots.length) return roots[0].midi;
    return cells.length ? Math.min(...cells.map(c => c.midi)) : 40;
  }
  // two notes at once, on the strings a hand would use: the written interval
  // first, then the string gap the shape has — adjacent for anything up to a
  // 5th, one string skipped for 6ths, 7ths and octaves, two for 10ths — and
  // the root with its 6th (the boogie) adjacent, a stretch, not the 6ths shape
  function placePair(w, cells, pal, base){
    const s1 = parts.snap(pal.root, w.iv, pal.allowed), s2 = parts.snap(pal.root, w.iv2, pal.allowed);
    if (!s1 || !s2) return null;
    const want1 = base + w.iv + s1.shift, semis = (w.iv2 + s2.shift) - (w.iv + s1.shift);
    const span = Math.abs(semis);
    const boogie = span >= 8 && span <= 9 && ((w.iv % 12) + 12) % 12 === 0;
    const pref = span <= 7 || boogie ? [1, 2] : span <= 12 ? [2, 1, 3] : [3, 2];
    // the interval may invert (a 3rd voiced as a 6th, the same two notes)
    // when that is what keeps the pair on the treble strings the box has —
    // not when the lower note bends, since the bend needs the shape
    const want2 = want1 + semis;
    let best = null;
    cells.filter(c => c.midi % 12 === s1.pc).forEach(c1 => {
      cells.filter(c => c.midi % 12 === s2.pc && c.string !== c1.string).forEach(c2 => {
        const diff = (c2.midi - c1.midi) - semis;
        const interval = diff === 0 ? 0 : (Math.abs(diff) === 12 && !w.up) ? 6 : Math.abs(diff) * 10;
        const rank = pref.indexOf(Math.abs(c2.string - c1.string));
        const score = interval + (rank < 0 ? 30 : rank * 8) + Math.abs(c1.midi - want1) + Math.abs(c2.midi - want2) / 2;
        if (!best || score < best.score) best = { c1, c2, score };
      });
    });
    return best;
  }
  // the thumb's note: "bass" is the lowest root on a bass string (E, A or D),
  // "fifth" the 5th on the bass string next to it — where an alternating
  // thumb goes — never a note up on the treble strings
  function thumbCell(chord, opts, voicing){
    const pal = parts.palette(chord, opts);
    const cells = parts.cellsIn(opts.window).filter(c => c.string >= 3);
    const roots = cells.filter(c => c.midi % 12 === pal.root).sort((a, b) => a.midi - b.midi);
    if (!roots.length) return null;
    const r = roots[0];
    if (voicing === 'bass') return [r];
    const pc = (pal.root + 7) % 12;
    const byNearness = (a, b) => Math.abs(a.midi - r.midi) - Math.abs(b.midi - r.midi);
    const beside = cells.filter(c => c.midi % 12 === pc && Math.abs(c.string - r.string) === 1).sort(byNearness);
    if (beside.length) return [beside[0]];
    const any = cells.filter(c => c.midi % 12 === pc).sort(byNearness);
    return any.length ? [any[0]] : null;
  }
  // a power chord: the root on the lowest string that has it, the 5th on the
  // next string up, the octave above that
  function powerVoicing(chord, opts){
    const pal = parts.palette(chord, opts);
    const cells = parts.cellsIn(opts.window);
    const roots = cells.filter(c => c.midi % 12 === pal.root && c.string >= 2).sort((a, b) => b.string - a.string || a.midi - b.midi);
    for (const r of roots){
      const fifth = cells.find(c => c.string === r.string - 1 && c.midi === r.midi + 7);
      if (!fifth) continue;
      const oct = cells.find(c => c.string === r.string - 2 && c.midi === r.midi + 12);
      return oct ? [r, fifth, oct] : [r, fifth];
    }
    return parts.strumCells(chord, opts, 'low');
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
    const spb = 60 / (tempo * (opt.fast ? 2 : 1)), barLen = spb * beats, grid = p.grid, slotDur = barLen / grid;
    // swung sixteenths: the second of each pair of 16ths late by this much of a 16th
    const swingOf = slot => GT.band.swingOffset(p, slot, slotDur);
    for (let skip = audio.stepsToSkip(nextBarTime, ctx.currentTime, barLen); skip > 0; skip--){ nextBarTime += barLen; bar = (bar + 1) % chords.length; }
    while (nextBarTime < ctx.currentTime + AHEAD){
      const t0 = nextBarTime;
      const chord = chords[bar], next = chords[(bar + 1) % chords.length];
      const changing = displayName(next) !== displayName(chord);
      const lastBar = bar === chords.length - 1;
      // the band through band.js — the same rules the app plays by
      const stopped = !!(notes.stopBars && notes.stopBars.has(bar));
      if (style === 'simple' && !stopped){
        for (let beat = 0; beat < 4; beat++){
          audio.playChord(chord, t0 + beat * spb, spb, beat === 0 ? 0.86 : 0.68, 'piano');
          audio.playHiHat(t0 + beat * spb, 0.4);
        }
      } else if (style !== 'simple'){
        const bctx = { chord, next, audio, voice: 'piano', changing, fillNow: lastBar && !!p.fill, stopped, jit: jitter };
        for (let slot = 0; slot < grid; slot++) GT.band.scheduleSlot(p, slot, t0 + slot * slotDur + swingOf(slot) + jitter(0.006), slotDur, bctx);
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
  // `seed` is the card's own roll: the existing parts roll their fills the
  // way the app does (rollFills, one pick a phrase), the proposed ones
  // through realiseAdvanced — so "New fills" on a card shows how much
  // variety each version actually has.
  function realiseCard(part, entry, style, advanced, seed, grid){
    const chords = chordsOf(entry);
    const bars = chords.map(chord => ({ chord }));
    if (opt.easy) part = easyVersion(part, grid);
    const opts = {
      reading: opt.reading, window: windowFor(entry.key), scaleTheory: entry.scaleTheory || 'parallel', stringSet: 2,
      stayOnKey: false, key: { tonic: entry.key, mode: entry.mode || 'major' },
      tech: !opt.tech ? { double: false, bend: false, hammer: false, pull: false, slide: false } : opt.easy ? EASY_TECH : null,
    };
    const notes = advanced
      ? realiseAdvanced(part, bars, opts, { seed: seed || opt.seed, phrase: opt.phrase, grid })
      : parts.realise(part, bars, seed || opt.seed, opts, { grid });
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
  const feelOf = (style, label) => style === 'simple' ? parts.SIMPLE_FEEL : BASE.STYLES[style].variants.find(v => v.label === label);
  const basePartsFor = (style, label) => (BASE_LIBRARY[style] && BASE_LIBRARY[style][label]) || [];
  const guideFor = (style, label) => GUIDE[`${style}/${label}`] || (GUIDE[style] && GUIDE[style].feel === label ? GUIDE[style] : null);

  let cardCount = 0;
  function partCard(host, part, entry, style, pattern, advanced, tag){
    const id = `c${++cardCount}`;
    const card = document.createElement('div');
    card.className = 'partcard';
    const flags = [];
    const allWritten = [part.figure, ...(part.variants || []), ...(part.fills || []), ...(part.fillsOnChange || []), ...(part.fillsOnStay || []),
                        ...(part.turnaround ? [part.turnaround] : []), ...(part.turnarounds || []), ...(part.tails || []), ...(part.pickups || []), ...(part.stops || [])];
    const has = k => allWritten.some(bar => bar.some(n => n[k]));
    if (part.fillsOnChange || part.fillsOnStay) flags.push('change-aware fills');
    if (part.turnarounds && part.turnarounds.length > 1) flags.push(`${part.turnarounds.length} turnarounds`);
    else if (part.turnaround || part.turnarounds) flags.push('turnaround');
    if (part.tails) flags.push('tails');
    if (part.pickups) flags.push('pickups');
    if (part.stops) flags.push('stop-time');
    if (part.figureMode === 'roll') flags.push('rolled figures');
    if (part.leads) flags.push('lead rolls');
    const counts = ['fills', 'fillsOnChange', 'fillsOnStay'].map(k => (part[k] || []).length);
    // bars that go above the box's middle octave: the upper-register lines
    const high = w => !w.strum && Math.max(w.iv, w.iv2 == null ? -99 : w.iv2) >= 17;
    const highBars = ['variants', 'fills', 'fillsOnChange', 'fillsOnStay', 'tails', 'turnarounds', 'stops', 'leads'].reduce((a, k) => a + (part[k] || []).filter(bar => bar.some(high)).length, 0) + ((part.turnaround || []).some(high) ? 1 : 0);
    ['ghost', 'rake', 'trem', 'vib', 'stacc', 'pm', 'chordSlide', 'add'].forEach(k => { if (has(k)) flags.push({ ghost: 'ghost notes', rake: 'rakes', trem: 'tremolo picking', vib: 'vibrato', stacc: 'staccato', pm: 'palm-muted notes', chordSlide: 'chord slides', add: 'colour tones' }[k]); });
    if (allWritten.some(bar => bar.some(n => n.strum && n.voicing === 'shell'))) flags.push('shell voicings');
    if (allWritten.some(bar => bar.some(n => n.tech === 'double' && n.up))) flags.push('double-stop bends');
    card.innerHTML = `
      <div class="part-head"><h4>${esc(part.name)}${tag ? ` <span class="tag">${esc(tag)}</span>` : ''}</h4>
        <span class="btns"><span class="easytag" hidden></span><button type="button" class="reroll" title="Roll the fills again, as New fills does in the app">New fills</button><span class="roll"></span><button type="button" class="play">Play</button></span></div>
      ${part.why ? `<p class="why">${part.why}</p>` : ''}
      ${advanced ? `<p class="counts">${(part.variants || []).length + 1} figures · fills ${counts[0]} plain, ${counts[1]} into a change, ${counts[2]} staying put${part.tails ? ` · ${part.tails.length} tails` : ''}${part.pickups ? ` · ${part.pickups.length} pickups` : ''}${part.stops ? ` · ${part.stops.length} stop-time` : ''}${highBars ? ` · ${highBars} up high` : ''}${part.leads ? ` · ${part.leads.length} leads` : ''}</p>` : `<p class="counts">${(part.variants || []).length + 1} figures · ${(part.fills || []).length} fills</p>`}
      ${flags.length ? `<p class="flags">Needs: ${flags.map(f => `<span>${esc(f)}</span>`).join(' ')}</p>` : ''}
      <div class="tab"></div>`;
    host.appendChild(card);
    const tabHost = card.querySelector('.tab');
    let state = null, seed = 0, rolls = 0;
    const build = () => {
      try {
        const { chords, notes } = realiseCard(part, entry, style, advanced, seed, pattern.grid);
        const metrics = drawTab(tabHost, pattern.grid, chords, notes);
        state = { chords, notes, metrics };
        card.querySelector('.roll').textContent = [rolls ? `roll ${rolls}` : '', notes.leadRoll ? 'lead roll' : ''].filter(Boolean).join(' · ');
        const tag = card.querySelector('.easytag');
        tag.hidden = !opt.easy;
        tag.textContent = !opt.easy ? '' : part.easy ? 'easy · written for it' : 'easy · simplified by rule';
        tag.classList.toggle('written', !!part.easy);
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
    card.querySelector('.reroll').addEventListener('click', () => {
      // the same roll the app makes on "New fills", with this card's own seed;
      // what was playing starts again on the new roll
      const wasPlaying = playing && playing.host === card;
      seed = Math.floor(Math.random() * 1e6) + 1; rolls++;
      if (wasPlaying) stop();
      build();
      if (wasPlaying && state) play(card, card.querySelector('.play'), { pattern, style, chords: state.chords, tempo: entry.tempo, notes: state.notes, metrics: state.metrics, tabHost });
    });
    card.rebuild = () => { if (playing && playing.host === card) stop(); build(); };
    card.getState = () => state;   // for measuring from the console
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
        basePartsFor(ex.style, ex.label).forEach(part => partCard(exCol.querySelector('.parts'), part, entry, ex.style, feel, false));
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
  // double speed takes hold from the next bar; the stop button stops whatever plays
  $('fastToggle').addEventListener('change', () => { opt.fast = $('fastToggle').checked; });
  $('stopBtn').addEventListener('click', stop);
  $('easyToggle').addEventListener('change', () => { opt.easy = $('easyToggle').checked; document.body.classList.toggle('easy', opt.easy); rebuildAll(); });
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
  GT.reviewPage = { realiseAdvanced, describeBand, simplify, easyVersion, decisions: () => decisions, stop };
})();
