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

  GT.sound = { peak, rms, dB, seeded, withVoices, loudestBar };
  GT.soundSuites = [
    ['Sound: the mix stays under full scale', testTheMixStaysUnderFullScale],
  ];
})();
