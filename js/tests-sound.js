// The measured tests: the mix rendered offline through a graph of its own
// (audio.renderOffline) and read as numbers — a peak, an RMS, a ratio —
// rather than listened to and guessed at. Each holds something the sound
// promises: nothing clips, a strum is a sweep, the part doesn't duck the
// band. On http:// the recordings play and are measured; on file:// the
// synthesized voices are, and the label says which, so a number is never
// mistaken for a measurement of a voice that wasn't there.
(function(){
  'use strict';
  const GT = window.GT;
  const audio = GT.audio;
  const { chordFromName } = GT.theory;

  // ---- reading a render ----
  const peak = buf => { let p = 0; for (let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if (a > p) p = a; } } return p; };
  const rms = (buf, from = 0, to = buf.duration) => {
    let sum = 0, n = 0;
    const i0 = Math.max(0, Math.floor(from * buf.sampleRate)), i1 = Math.min(buf.length, Math.floor(to * buf.sampleRate));
    for (let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for (let i = i0; i < i1; i++){ sum += d[i] * d[i]; n++; } }
    return n ? Math.sqrt(sum / n) : 0;
  };
  const dB = x => 20 * Math.log10(Math.max(x, 1e-9));
  const fmt = x => dB(x).toFixed(1) + ' dB';

  // a seeded random, so a render is the same render twice
  function seeded(seed){
    let x = (seed * 9301 + 49297) % 233280;
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  }

  // The voices as this page can have them: the recordings when the banks
  // are reachable, the synthesized voices when they aren't. Warms what it
  // can and says which was measured.
  let voicesPromise = null;
  function withVoices(){
    if (voicesPromise) return voicesPromise;
    audio.ensureAudio();
    voicesPromise = Promise.all([audio.warmGuitar(), audio.warmPiano(), audio.warmBass()])
      .then(([g, p, b]) => ({ guitar: !!g, piano: !!p, bass: !!b, label: g && p && b ? 'recorded voices' : 'synthesized voices — recordings not reachable here' }))
      .catch(() => ({ guitar: false, piano: false, bass: false, label: 'synthesized voices — recordings not reachable here' }));
    return voicesPromise;
  }

  // ---- what to render ----
  // The loudest thing the practice tab can do: the busiest resolved style
  // with the guitar voice, and a six-string part strum on every beat at the
  // part's default level, together.
  function loudestBar(a, opts = {}){
    const S = a.STYLES;
    const style = S.metal.variants[0];
    const chord = chordFromName('E'), next = chordFromName('A');
    const spb = 0.5, slotDur = spb * 4 / style.grid;
    for (let bar = 0; bar < 2; bar++){
      const t0 = 0.05 + bar * spb * 4;
      for (let slot = 0; slot < style.grid; slot++){
        GT.band.scheduleSlot(style, slot, t0 + slot * slotDur, slotDur, { audio: a, chord, next, voice: 'guitar', changing: bar === 1, fillNow: false, stopped: false });
      }
      if (!opts.noPart){
        [0, 4, 8, 12].forEach(slot => {
          const grip = [40, 47, 52, 56, 59, 64];      // an open E, low to high
          grip.forEach((m, k) => a.playPluck(440 * Math.pow(2, (m - 69) / 12), t0 + slot * slotDur + k * 0.016, slotDur * 3.6, 0.9 * 2.4 * Math.min(1, 1.45 / Math.sqrt(6)), 'part', null));
        });
      }
    }
  }

  async function testTheMixStaysUnderFullScale(t){
    const v = await withVoices();
    const buf = await audio.renderOffline(4.2, a => loudestBar(a), { random: seeded(1) });
    const p = peak(buf);
    t.ok(p < 0.99, `the loudest bar the tab can play peaks at ${p.toFixed(3)} (${fmt(p)}), under full scale (${v.label})`);
    t.ok(rms(buf, 0.2, 4) > 0.01, 'and it made a sound');
  }

  // T70's third question: what does a six-string strum sum to on the bus?
  // Six strings struck together and the same six swept, rendered bare (no
  // limiter) to read what would go into it, and through the limiter to
  // read what comes out.
  async function testWhatASixStringStrumSumsTo(t){
    const v = await withVoices();
    const grip = [40, 45, 50, 55, 59, 64].map(m => 440 * Math.pow(2, (m - 69) / 12));   // an open E-shape, low to high
    const one = (a, sweep) => [0, 0.6, 1.2].forEach(at => a.strum(grip, 0.05 + at, 0.5, 0.9 * a.PART_LEVEL, { bus: 'part', sweep }));
    const flat = await audio.renderOffline(2, a => one(a, 0), { limiter: false, random: seeded(3) });
    const swept = await audio.renderOffline(2, a => one(a), { limiter: false, random: seeded(3) });
    const out = await audio.renderOffline(2, a => one(a), { random: seeded(3) });
    const pf = peak(flat), ps = peak(swept), po = peak(out);
    t.ok(ps <= pf * 1.02, `six strings swept peak at ${ps.toFixed(3)} into the limiter, struck together ${pf.toFixed(3)} — the sweep does not add to the peak (${v.label})`);
    t.ok(po < 0.99, `and out of the limiter the strum peaks at ${po.toFixed(3)} (${fmt(po)})`);
    t.ok(rms(swept, 0.05, 0.5) > 0.005, 'and it sounded');
  }

  // The part and the band meet at the output. What the band loses when the
  // part plays over it — the same two bars rendered band only, part only,
  // and both, the loss read as the power the sum should have had against
  // the power it has — is the ducking. It should be nothing anyone hears.
  function rockBars(a, { part = true, band = true } = {}){
    const style = a.STYLES.rock.variants[1];        // plain Rock: the fresh page's feel
    const chord = chordFromName('A'), next = chordFromName('D');
    const spb = 0.5, slotDur = spb * 4 / style.grid;
    for (let bar = 0; bar < 2; bar++){
      const t0 = 0.05 + bar * spb * 4;
      if (band) for (let slot = 0; slot < style.grid; slot++){
        GT.band.scheduleSlot(style, slot, t0 + slot * slotDur, slotDur, { audio: a, chord, next, voice: 'piano', changing: bar === 1, fillNow: false, stopped: false });
      }
      // the part on a chord a tritone from the band's, so the two share no
      // pitches and the power of their sum is the sum of their powers —
      // what is measured is the dynamics, not the harmony
      if (part) [0, 4, 8, 12].forEach(slot => {
        const grip = [51, 58, 63, 67, 70].map(m => 440 * Math.pow(2, (m - 69) / 12));   // an E♭ shape, five strings
        a.strum(grip, t0 + slot * slotDur, slotDur * 3.6, 0.9 * a.PART_LEVEL, { bus: 'part' });
      });
    }
  }
  const power = (buf, from, to) => Math.pow(rms(buf, from, to), 2);
  // ...through a chain: 'split' (each bus its own compressor, a soft clipper
  // shared) or 'shared' (the one compressor both buses met at until the
  // split — the reference)
  async function measureDucking(dynamics){
    const opts = seed => ({ random: seeded(seed), dynamics });
    const band = await audio.renderOffline(4.2, a => rockBars(a, { part: false }), opts(5));
    const part = await audio.renderOffline(4.2, a => rockBars(a, { band: false }), opts(5));
    const both = await audio.renderOffline(4.2, a => rockBars(a), opts(5));
    const from = 0.2, to = 4.0;
    const lossOver = (a, b) => 10 * Math.log10((power(band, a, b) + power(part, a, b)) / power(both, a, b));
    // over the whole stretch; at each strum's attack (the first 40 ms,
    // where a clipper bends the peak — instantaneous, not heard as a level);
    // and after it (40 to 150 ms), where a shared compressor's gain stays
    // down and lets go — the pumping
    const mean = lossOver(from, to);
    const onsets = []; for (let bar = 0; bar < 2; bar++) [0, 4, 8, 12].forEach(slot => onsets.push(0.05 + bar * 2 + slot * 0.125));
    const atPeak = Math.max(...onsets.map(o => lossOver(o, o + 0.04)));
    const pump = Math.max(...onsets.map(o => lossOver(o + 0.04, o + 0.15)));
    return { duck: mean, pump, atPeak, peak: peak(both), bandRms: rms(band, from, to), partRms: rms(part, from, to) };
  }
  async function testThePartDoesNotDuckTheBand(t){
    const v = await withVoices();
    const was = await measureDucking('shared');
    const m = await measureDucking('split');
    t.ok(m.pump < 0.5, `after a strum lands the band loses at most ${m.pump.toFixed(2)} dB (40 to 150 ms on) — it was ${was.pump.toFixed(2)} dB with the one shared compressor; at the peak itself ${m.atPeak.toFixed(2)} dB (was ${was.atPeak.toFixed(2)}), over the whole ${m.duck.toFixed(2)} (was ${was.duck.toFixed(2)}) (${v.label})`);
    t.ok(m.pump < was.pump, 'and less than it was');
    t.ok(m.peak < 0.99, `and together they peak at ${m.peak.toFixed(3)}`);
    // ...and each bus alone sits within a decibel of where the old chain put it
    t.ok(Math.abs(dB(m.bandRms) - dB(was.bandRms)) < 1, `the band alone is within a decibel of where it was (${fmt(m.bandRms)} against ${fmt(was.bandRms)})`);
    t.ok(Math.abs(dB(m.partRms) - dB(was.partRms)) < 1, `the part alone too (${fmt(m.partRms)} against ${fmt(was.partRms)})`);
  }

  // The techniques, heard: a palm-muted pluck is over in a fifth of a
  // second where an open one rings; a note that takes a string over silences
  // the one before it; the slapback is one darkened repeat, not a second pick.
  const E3 = 440 * Math.pow(2, (52 - 69) / 12);
  async function testTheTechniquesAreHeard(t){
    const v = await withVoices();
    const one = (fx, who) => a => a.playPluck(E3, 0.05, 1.2, 0.9, 'part', fx, who || {});
    const open = await audio.renderOffline(1.5, one(null), { random: seeded(7), dry: true });
    const muted = await audio.renderOffline(1.5, one({ mute: true }), { random: seeded(7), dry: true });
    const tailOpen = rms(open, 0.3, 0.45), tailMuted = rms(muted, 0.3, 0.45), frontMuted = rms(muted, 0.05, 0.08);
    t.ok(dB(tailMuted) - dB(frontMuted) < -30, `a palm-muted pluck is ${(dB(frontMuted) - dB(tailMuted)).toFixed(0)} dB down a quarter of a second on — over, where an open one is ${(dB(rms(open, 0.05, 0.08)) - dB(tailOpen)).toFixed(0)} dB down (${v.label})`);
    // a long note, then a short muted one 0.3 s on — on the same string, and
    // on another — read after the short one has gone, where only the long
    // note's ring can remain: on the same string it was taken over
    const two = strings => a => { a.playPluck(E3, 0.05, 1.2, 0.9, 'part', null, { string: strings[0] }); a.playPluck(E3 * Math.pow(2, 3 / 12), 0.35, 0.1, 0.9, 'part', { mute: true }, { string: strings[1] }); };
    const same = await audio.renderOffline(1.5, two(['part:3', 'part:3']), { random: seeded(8), dry: true });
    const apart = await audio.renderOffline(1.5, two(['part:3', 'part:2']), { random: seeded(8), dry: true });
    const pSame = power(same, 0.65, 0.9), pApart = power(apart, 0.65, 0.9);
    t.ok(pSame < pApart * 0.1, `the next note on a string takes it over: ${dB(pSame / pApart).toFixed(1)} dB of the first note's ring left, against a note on another string`);
    // the slapback: energy arrives 110 ms after a short pluck that had none there
    const dry = await audio.renderOffline(1, a => a.playPluck(E3, 0.05, 0.08, 0.9, 'part', null, {}), { random: seeded(9) });
    const slap = await audio.renderOffline(1, a => a.playPluck(E3, 0.05, 0.08, 0.9, 'part', null, { slap: true }), { random: seeded(9) });
    const at = audio.SLAP.time;
    t.ok(rms(slap, 0.05 + at, 0.1 + at) > rms(dry, 0.05 + at, 0.1 + at) * 2, `the slapback repeats the pluck ${(at * 1000).toFixed(0)} ms on (${fmt(rms(slap, 0.05 + at, 0.1 + at))} against ${fmt(rms(dry, 0.05 + at, 0.1 + at))} dry)`);
    t.ok(rms(slap, 0.05 + at, 0.1 + at) < rms(slap, 0.05, 0.1), 'quieter than the pluck');
  }

  // ---- the kit ----
  // the power below a cutoff: a two-pole one-pole lowpass over the samples,
  // enough to say whether a hit has a body or only a knock
  function lowPower(buf, cutoff, from, to){
    const d = buf.getChannelData(0), sr = buf.sampleRate;
    const k = 1 - Math.exp(-2 * Math.PI * cutoff / sr);
    let y1 = 0, y2 = 0, sum = 0;
    const i0 = Math.floor(from * sr), i1 = Math.min(d.length, Math.floor(to * sr));
    for (let i = 0; i < i1; i++){
      y1 += k * (d[i] - y1); y2 += k * (y1 - y2);
      if (i >= i0) sum += y2 * y2;
    }
    return sum / Math.max(1, i1 - i0);
  }
  // how far two stretches of a render differ, sample for sample
  function maxDiff(buf, t0, t1, len){
    const d = buf.getChannelData(0), sr = buf.sampleRate;
    const a = Math.floor(t0 * sr), b = Math.floor(t1 * sr), n = Math.floor(len * sr);
    let m = 0;
    for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(d[a + i] - d[b + i]));
    return m;
  }

  async function testTheKitIsNeverTheSameHitTwice(t){
    // two hats half a second apart, in one render: the same call, and not
    // the same waveform (the moments are whole render quanta apart — 6144
    // and 30720 samples — since the browser samples a frequency ramp per
    // quantum and two hits on different footings would differ regardless)
    const t1 = 6144 / 48000, t2 = 30720 / 48000;
    const hats = await audio.renderOffline(1.2, a => { a.playHiHat(t1, 0.55); a.playHiHat(t2, 0.55); }, { random: seeded(11), dry: true });
    const diff = maxDiff(hats, t1, t2, 0.05), level = peak(hats);
    t.ok(diff > level * 0.2, `two hi-hat hits differ by ${diff.toFixed(3)} at most against a peak of ${level.toFixed(3)}: no two the same`);
    const snares = await audio.renderOffline(1.2, a => { a.playSnare(t1, 0.85); a.playSnare(t2, 0.85); }, { random: seeded(11), dry: true });
    t.ok(maxDiff(snares, t1, t2, 0.05) > peak(snares) * 0.2, 'nor two snares');
    // an open hat, then a closed one a tenth of a second on: the open one chokes
    const lone = await audio.renderOffline(0.6, a => a.playHiHat(0.05, 0.55, 0.28), { random: seeded(12), dry: true });
    const choked = await audio.renderOffline(0.6, a => { a.playHiHat(0.05, 0.55, 0.28); a.playHiHat(0.15, 0.32, 0.06); }, { random: seeded(12), dry: true });
    const ringLone = rms(lone, 0.22, 0.3), ringChoked = rms(choked, 0.22, 0.3);
    t.ok(ringChoked < ringLone * 0.1, `a closed hat chokes the open one: ${dB(ringChoked / ringLone).toFixed(1)} dB of its ring left after the choke`);
    // the rim is a knock, not a quiet snare: next to nothing below 800 Hz
    const snare = await audio.renderOffline(0.5, a => a.playSnare(0.05, 0.85), { random: seeded(13), dry: true });
    const rim = await audio.renderOffline(0.5, a => a.playSnare(0.05, 0.85, 'rim'), { random: seeded(13), dry: true });
    const bodySnare = lowPower(snare, 800, 0.05, 0.3), bodyRim = lowPower(rim, 800, 0.05, 0.3);
    t.ok(bodyRim < bodySnare * 0.2, `the rim has ${(100 * bodyRim / bodySnare).toFixed(1)}% of the snare's energy below 800 Hz`);
    t.ok(rms(rim, 0.05, 0.1) > 0.005, 'and is heard');
    // the ghost is the snare barely: the same stroke, well under it
    const ghost = await audio.renderOffline(0.5, a => a.playSnare(0.05, 0.85, 'ghost'), { random: seeded(13), dry: true });
    t.ok(rms(ghost, 0.05, 0.3) < rms(snare, 0.05, 0.3) * 0.7, `a ghost at the snare's velocity is ${(dB(rms(snare, 0.05, 0.3)) - dB(rms(ghost, 0.05, 0.3))).toFixed(1)} dB under it`);
    // the kick has its beater: energy above 3 kHz in the first two milliseconds
    const kick = await audio.renderOffline(0.5, a => a.playKick(0.05, 0.9), { random: seeded(14), dry: true });
    // (from where it lands: the band's compressor looks ahead, so a hit
    // comes out some milliseconds after it was struck)
    const on = kick.getChannelData(0).findIndex(v => Math.abs(v) > 1e-4) / kick.sampleRate;
    const high = Math.sqrt(Math.max(0, rms(kick, on, on + 0.003) ** 2 - lowPower(kick, 3000, on, on + 0.003)));
    t.ok(high > 0.015, `the kick's beater: ${fmt(high)} above 3 kHz in the first three milliseconds, before the drum speaks`);
  }

  // ---- the room ----
  // The impulse itself, read as a room: nothing before the first
  // reflection, reflections denser than the tail around them, the tail
  // dying monotonically, each wall on a side.
  async function testTheRoomHasWalls(t){
    // built inside a seeded render, so the noise is the same noise each run
    let buf;
    await audio.renderOffline(0.1, (a, ctx) => { buf = a.roomImpulse(ctx, 1.8); }, { random: seeded(61) });
    const L = buf.getChannelData(0), R = buf.getChannelData(1), sr = buf.sampleRate;
    const energy = (from, to) => { let s = 0; for (let i = Math.floor(from * sr); i < Math.floor(to * sr); i++) s += L[i] * L[i] + R[i] * R[i]; return s / Math.max(1, (to - from) * sr); };
    t.equal(energy(0, 0.010), 0, 'silence for the first ten milliseconds: the direct sound arrives first');
    let tap = 0; for (let i = Math.floor(0.010 * sr); i < Math.floor(0.045 * sr); i++) tap = Math.max(tap, Math.abs(L[i]), Math.abs(R[i]));
    const tail = Math.sqrt(energy(0.06, 0.1) / 2);
    t.ok(tap > tail * 1.7, `the early reflections stand out of the tail beside them (a reflection peaks at ${dB(tap).toFixed(1)} dB, the tail runs at ${dB(tail).toFixed(1)} dB)`);
    const windows = []; for (let a = 0.1; a + 0.2 <= 1.8; a += 0.2) windows.push(energy(a, a + 0.2));
    t.ok(windows.every((w, i) => i === 0 || w < windows[i - 1]), `the tail dies away: ${windows.map(w => dB(w).toFixed(0)).join(', ')} dB by fifths of a second`);
    t.ok(windows[windows.length - 1] < windows[0] * 0.001, 'and is gone by the end');
    // each reflection is louder on one side; the sides alternate
    const sides = audio.ROOM.early.map(([at, , side]) => { const k = Math.floor(at * sr), n = Math.floor(0.001 * sr); let l = 0, r = 0; for (let j = 0; j < n; j++){ l += L[k + j] ** 2; r += R[k + j] ** 2; } return (l > r ? 0 : 1) === side; });
    t.ok(sides.every(Boolean), 'each reflection lands on the wall it was given');
    t.ok(audio.ROOM.early.some(e => e[2] === 0) && audio.ROOM.early.some(e => e[2] === 1), 'and the walls are on both sides');
  }

  // ---- two levels pinned ----
  // A root alone (the practice tab's roots-only mode) sits where the triad
  // sat; the guitar comp sits where the piano comp does, so switching the
  // voice doesn't move the band.
  async function testTheLevelsAreMatched(t){
    const v = await withVoices();
    const o = { random: seeded(31), dry: true };
    let gapRoot = 0, gapVoice = 0, n = 0;
    for (const name of ['A', 'C', 'E', 'G']){
      const ch = chordFromName(name);
      const triad = await audio.renderOffline(1.2, a => a.playChord(ch, 0.05, 0.5, 0.8, 'piano'), o);
      const root = await audio.renderOffline(1.2, a => a.playNote(a.noteFreq(ch.note, a.ROOT_OCTAVE), 0.05, 0.5, 0.8 * a.ROOT_ALONE), o);
      const gtr = await audio.renderOffline(1.2, a => a.playChord(ch, 0.05, 0.5, 0.8, 'guitar'), o);
      gapRoot += dB(rms(root, 0.05, 0.65)) - dB(rms(triad, 0.05, 0.65));
      gapVoice += dB(rms(gtr, 0.05, 0.65)) - dB(rms(triad, 0.05, 0.65));
      n++;
    }
    t.ok(Math.abs(gapRoot / n) < 1, `a root alone at ${audio.ROOT_ALONE}× sits ${(gapRoot / n).toFixed(1)} dB from the triad over four roots (${v.label})`);
    t.ok(Math.abs(gapVoice / n) < 2, `the guitar comp at ${audio.GUITAR_COMP}× sits ${(gapVoice / n).toFixed(1)} dB from the piano comp over four chords`);
  }

  // ---- the guitar's own fallback ----
  // A part note whose recording isn't here plays the engine's string on the
  // part bus — never the piano on the band bus — at the recording's level,
  // with the techniques.
  async function testTheFallbackIsAGuitarOnItsOwnBus(t){
    const v = await withVoices();
    const one = (fx, who) => a => a._withoutGuitar(() => a.playPluck(E3, 0.05, 1.0, 0.9, 'part', fx, who || {}));
    const partOnly = await audio.renderOffline(1.3, one(null), { random: seeded(51), dry: true, mute: ['band'] });
    const bandOnly = await audio.renderOffline(1.3, one(null), { random: seeded(51), dry: true, mute: ['part'] });
    t.ok(rms(partOnly, 0.05, 0.5) > 0.01, `with no recording a part note is heard on the part bus (${fmt(rms(partOnly, 0.05, 0.5))})`);
    t.equal(peak(bandOnly), 0, 'and nothing of it reaches the band bus');
    // at the recording's level, when the recording is here to compare
    if (v.guitar){
      const real = await audio.renderOffline(1.3, a => a.playPluck(E3, 0.05, 1.0, 0.9, 'part', null, {}), { random: seeded(51), dry: true });
      const gap = dB(rms(partOnly, 0.05, 0.35)) - dB(rms(real, 0.05, 0.35));
      t.ok(Math.abs(gap) < 1.5, `and within a decibel and a half of the recording over its first 0.3 s (${gap.toFixed(1)} dB)`);
    }
    // the techniques hold on it: a mute is over, a bend moves
    const muted = await audio.renderOffline(1.3, one({ mute: true }), { random: seeded(52), dry: true });
    t.ok(dB(rms(muted, 0.3, 0.45)) - dB(rms(muted, 0.05, 0.08)) < -30, 'a palm mute is over a quarter of a second on');
    const bent = await audio.renderOffline(1.3, one({ bend: 2 }), { random: seeded(52), dry: true });
    const plain = await audio.renderOffline(1.3, one(null), { random: seeded(52), dry: true });
    t.ok(zeroCrossings(bent, 0.3, 0.5) > zeroCrossings(plain, 0.3, 0.5) * 1.05, `a bend of a tone raises the pitch (${zeroCrossings(bent, 0.3, 0.5)} crossings against ${zeroCrossings(plain, 0.3, 0.5)} unbent over 0.2 s)`);
    // and the registry: the next note on the string takes it over
    const two = strings => a => a._withoutGuitar(() => { a.playPluck(E3, 0.05, 1.2, 0.9, 'part', null, { string: strings[0] }); a.playPluck(E3 * Math.pow(2, 3 / 12), 0.35, 0.1, 0.9, 'part', { mute: true }, { string: strings[1] }); });
    const same = await audio.renderOffline(1.5, two(['part:3', 'part:3']), { random: seeded(53), dry: true });
    const apart = await audio.renderOffline(1.5, two(['part:3', 'part:2']), { random: seeded(53), dry: true });
    t.ok(power(same, 0.65, 0.9) < power(apart, 0.65, 0.9) * 0.1, 'and the next note on the string takes it over');
  }
  const zeroCrossings = (buf, from, to) => { const d = buf.getChannelData(0), sr = buf.sampleRate; let n = 0; for (let i = Math.floor(from * sr) + 1; i < Math.floor(to * sr); i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) n++; return n; };

  GT.sound = { peak, rms, dB, seeded, withVoices, loudestBar, rockBars, measureDucking };
  GT.soundSuites = [
    ['Sound: the mix stays under full scale', testTheMixStaysUnderFullScale],
    ['Sound: what a six-string strum sums to', testWhatASixStringStrumSumsTo],
    ['Sound: the part does not duck the band', testThePartDoesNotDuckTheBand],
    ['Sound: the techniques are heard', testTheTechniquesAreHeard],
    ['Sound: the kit is never the same hit twice', testTheKitIsNeverTheSameHitTwice],
    ['Sound: the room has walls', testTheRoomHasWalls],
    ['Sound: two levels pinned by measurement', testTheLevelsAreMatched],
    ['Sound: the fallback is a guitar on its own bus', testTheFallbackIsAGuitarOnItsOwnBus],
  ];
})();
