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

  GT.sound = { peak, rms, dB, seeded, withVoices, loudestBar, rockBars, measureDucking };
  GT.soundSuites = [
    ['Sound: the mix stays under full scale', testTheMixStaysUnderFullScale],
    ['Sound: what a six-string strum sums to', testWhatASixStringStrumSumsTo],
    ['Sound: the part does not duck the band', testThePartDoesNotDuckTheBand],
    ['Sound: the techniques are heard', testTheTechniquesAreHeard],
  ];
})();
