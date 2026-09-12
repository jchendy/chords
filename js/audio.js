// Web Audio engine: the voices (piano, bass, drums, guitar) and the groove
// patterns each style plays. Owns the AudioContext; knows nothing about the UI.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { SEMITONE } = GT.theory;

  const ROOT_OCTAVE = 3;

  function noteFreq(name, octave){
    const midi = (octave + 1) * 12 + SEMITONE[name];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function chordFrequencies(chord){
    // stack root/third/fifth(/seventh) upward in pitch, wrapping octaves as needed
    const rootSemi = SEMITONE[chord.note];
    const thirdSemi = SEMITONE[chord.third];
    const fifthSemi = SEMITONE[chord.fifth];

    const thirdOctave = ROOT_OCTAVE + (thirdSemi <= rootSemi ? 1 : 0);
    const fifthOctave = thirdOctave + (fifthSemi <= thirdSemi ? 1 : 0);

    const freqs = [
      noteFreq(chord.note, ROOT_OCTAVE),
      noteFreq(chord.third, thirdOctave),
      noteFreq(chord.fifth, fifthOctave),
    ];

    if (chord.seventh){
      const seventhSemi = SEMITONE[chord.seventh];
      const seventhOctave = fifthOctave + (seventhSemi <= fifthSemi ? 1 : 0);
      freqs.push(noteFreq(chord.seventh, seventhOctave));
    }

    return freqs;
  }

  let audioCtx = null;
  let masterGain = null;
  // every voice that has been scheduled but hasn't sounded yet, so playback
  // can be called off without waiting for what's already in the queue
  let pending = [];
  let hihatGain = null;
  let bassGain = null;
  let drumGain = null;
  let noiseBuffer = null;
  let pianoWave = null;
  let reverb = null;
  let reverbSends = {};         // per-voice send gains into the reverb
  let bandGain = null;          // everything the band plays, before the limiter
  let partGain = null;          // the suggested part, on its own bus beside it
  let partSend = null;          // ...and its own send into its own room
  let bandLevelWanted = 1;      // the band's volume, kept for a context not yet built
  // The graph as one object, so an offline render can build its own and
  // point the module at it for the length of a schedule; `offline` keeps
  // that render off the sleep timers and the live queue. `rnd` is the
  // engine's only randomness — seedable, so a render can be reproduced.
  let G = null;
  let offline = false;
  let rnd = Math.random;

  // A room for the convolver: stereo noise dying away over `seconds`, its
  // top end rolling off as it goes, so the tail darkens the way a real one
  // does. Generated once; no sample to download.
  function roomImpulse(ctx, seconds){
    const rate = ctx.sampleRate, n = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, n, rate);
    for (let ch = 0; ch < 2; ch++){
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++){
        const t = i / n;
        const white = Math.random() * 2 - 1;
        lp += (white - lp) * (0.6 - 0.45 * t);   // a one-pole lowpass that closes over the tail
        d[i] = lp * Math.pow(1 - t, 2.2) * (i < 200 ? i / 200 : 1);
      }
    }
    return buf;
  }

  // An iPhone with the ringer switch on silent mutes web audio, which is the
  // wrong call for a practice tool: you set the phone down, work through a
  // progression, and hear nothing with no clue why. Safari lets a page say
  // what kind of audio it is, and "playback" is the category that means
  // "media the user asked for" — it plays through the silent switch, the same
  // as a music app. Safari 16.4 and up; everywhere else this isn't defined
  // and the ringer switch was never in the way to begin with.
  function claimPlaybackAudio(){
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) { /* nothing to fall back to, and nothing broken by trying */ }
  }

  // A phone propped on a music stand dims and sleeps a minute into a
  // progression, which is exactly when you're least able to reach for it.
  // Hold the screen awake while something is playing and let go the moment it
  // stops — a lock left on would keep the screen lit for as long as the tab is
  // open, and it's the user's battery.
  let wakeLock = null;
  let wantWake = false;

  async function acquireWakeLock(){
    if (!wantWake || wakeLock || !navigator.wakeLock || document.hidden) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      // the browser drops the lock itself when the tab goes away and says so
      // here, so the next visibilitychange knows there's one to ask for again
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {
      wakeLock = null;      // refused — battery saver, or the browser has no such thing
    }
  }

  function keepAwake(on){
    wantWake = on;
    if (on){ acquireWakeLock(); return; }
    const held = wakeLock;
    wakeLock = null;
    if (held) held.release().catch(() => {});
    planSleep();                 // nothing is playing now, so the engine can stop
  }

  // ---- letting the audio engine sleep ----
  // A running AudioContext renders its graph whether or not anything is
  // audible: 375 blocks a second at 48 kHz, through a limiter and a reverb
  // convolver that are wired up permanently. Left alone it does that for as
  // long as the tab is open — hours after the last note, with the screen off
  // — and on iOS an live audio session keeps the page resident besides, so
  // the tab goes on costing battery all night for nothing. So the engine
  // sleeps when nothing has sounded for a while, and wakes on the next note.
  //
  // A hidden page is given only enough time for a ringing note to finish:
  // nobody is listening to a tab they can't see, and this is the case that
  // matters — the iPad face down on the sofa with the page still open.
  // Both windows are measured from the moment the last voice STOPS, not from
  // when it started. Measured from the start you have to guess how long a
  // note might ring and wait out the worst case — and the worst case here is
  // a whole-note chord at 40 BPM, which rings for 6.06 seconds, so any window
  // shorter than that would freeze a note mid-decay and then thaw it, still
  // sounding, whenever the engine next woke. Knowing when the sound actually
  // ends means the windows only have to cover what they're for.
  //
  // Visible: long enough not to cycle between two clicks in the chord finder
  // or two questions in the ear trainer, since waking costs a few
  // milliseconds and an audio session transition is not free on a phone.
  // Hidden: nothing is going to be heard, so as soon as the sound is out.
  const IDLE_SLEEP_SEC = 10;     // ...after the last voice has finished
  const HIDDEN_SLEEP_SEC = 1;
  let busyUntil = -Infinity;     // on the audio clock: when the last voice stops
  let sleepTimer = null;

  // How long to wait before stopping the engine, or null for "don't". Pulled
  // out of the timer so the rule can be read and tested on its own: the worst
  // version of this bug would be an engine that sleeps mid-progression.
  function sleepDelay(now, endsAt, hidden, playing){
    if (playing) return null;
    const quiet = hidden ? HIDDEN_SLEEP_SEC : IDLE_SLEEP_SEC;
    return Math.max(0, endsAt + quiet - now);
  }

  function planSleep(){
    clearTimeout(sleepTimer);
    sleepTimer = null;
    if (!audioCtx) return;
    const wait = sleepDelay(audioCtx.currentTime, busyUntil, document.hidden, wantWake);
    if (wait === null) return;                    // something is playing
    sleepTimer = setTimeout(() => {
      sleepTimer = null;
      if (!audioCtx) return;
      // a note scheduled since this was armed moves the moment along
      const again = sleepDelay(audioCtx.currentTime, busyUntil, document.hidden, wantWake);
      if (again === null) return;
      if (again > 0){ planSleep(); return; }
      if (audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
    }, wait * 1000 + 50);
  }

  // Anything about to make a sound wakes the engine and puts the sleep off.
  // Resuming is asynchronous, but the clock doesn't move while suspended, so
  // a note scheduled a moment ahead is still a moment ahead when it starts.
  function wakeForVoice(time){
    if (!audioCtx) return;
    busyUntil = Math.max(busyUntil, time);      // until stop() says otherwise
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    planSleep();
  }

  // Hiding the tab releases the lock, and a released sentinel can't be reused,
  // so coming back has to ask for a new one. Going away is also when the
  // engine should be thinking about sleeping.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) acquireWakeLock();
    planSleep();
  });

  // Safari doesn't always send visibilitychange when an iPad locks or the
  // page goes into the back/forward cache, but it does send this. Nothing is
  // going to be heard from a page that's being put away, so the engine stops
  // at once rather than waiting out a window nobody is listening through.
  window.addEventListener('pagehide', () => {
    if (wantWake || !audioCtx) return;
    if (audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
  });

  function ensureAudio(){
    if (!audioCtx){
      claimPlaybackAudio();
      G = buildGraph(new (window.AudioContext || window.webkitAudioContext)());
      applyGraph(G);
    }
  }

  // The module plays through whichever graph is applied: the live one, or an
  // offline one for the length of a render.
  function applyGraph(g){
    audioCtx = g.ctx; masterGain = g.masterGain; hihatGain = g.hihatGain; bassGain = g.bassGain;
    drumGain = g.drumGain; noiseBuffer = g.noiseBuffer; pianoWave = g.pianoWave; reverb = g.reverb;
    reverbSends = g.reverbSends; bandGain = g.bandGain; partGain = g.partGain; partSend = g.partSend;
  }

  // Every bus, built on a context. `limiter: false` connects the buses to the
  // destination bare, so what goes INTO the limiter can be measured; `mute`
  // names buses ('band', 'part') to leave silent, so one can be measured alone.
  function buildGraph(ctx, { limiter: withLimiter = true, mute = [] } = {}){
    const g = { ctx };
    // Every bus meets at one limiter, so a kick, a bass note and a full
    // chord landing on the same beat can't add up past what the output
    // can carry. Gentle enough to be inaudible until it's needed.
    let out = ctx.destination;
    if (withLimiter){
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      limiter.connect(ctx.destination);
      out = limiter;
      g.limiter = limiter;
    }

    // The band — comp, bass, drums and the room they share — meets on
    // one bus before the limiter, so it has one
    // volume against the suggested part, which has a bus of its own.
    const bandGain = g.bandGain = ctx.createGain();
    bandGain.gain.value = mute.includes('band') ? 0 : bandLevelWanted;
    bandGain.connect(out);

    const masterGain = g.masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 4800;
    tone.Q.value = 0.7;
    masterGain.connect(tone);
    tone.connect(bandGain);

    // separate percussion chain so the hi-hat's high end isn't
    // swallowed by the piano voice's lowpass filter
    const hihatGain = g.hihatGain = ctx.createGain();
    hihatGain.gain.value = 0.4;
    hihatGain.connect(bandGain);

    // bass and kick/snare buses for the styles
    const bassGain = g.bassGain = ctx.createGain();
    bassGain.gain.value = 0.42;
    bassGain.connect(bandGain);

    const drumGain = g.drumGain = ctx.createGain();
    drumGain.gain.value = 0.55;
    drumGain.connect(bandGain);

    g.pianoWave = pianoWaveFor(ctx);

    // a shared reverb, with a send from each voice at its own level
    const reverb = g.reverb = ctx.createConvolver();
    reverb.buffer = roomImpulse(ctx, 1.8);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.5;
    reverb.connect(reverbOut).connect(bandGain);
    g.reverbSends = {};
    [['piano', 0.14], ['clean', 0.32], ['drums', 0.08]].forEach(([name, level]) => {
      const s = ctx.createGain();
      s.gain.value = level;
      s.connect(reverb);
      g.reverbSends[name] = s;
    });

    // The part's bus: the same tone the comp guitar has (masterGain's
    // lowpass) and the same room, but its own copies, so turning the band
    // down takes the band's reverb with it and leaves the part's alone.
    const partGain = g.partGain = ctx.createGain();
    partGain.gain.value = mute.includes('part') ? 0 : 0.3;
    const partTone = ctx.createBiquadFilter();
    partTone.type = 'lowpass';
    partTone.frequency.value = 4800;
    partTone.Q.value = 0.7;
    partGain.connect(partTone).connect(out);
    const partRoom = ctx.createConvolver();
    partRoom.buffer = reverb.buffer;
    const partRoomOut = ctx.createGain();
    partRoomOut.gain.value = 0.5;
    const partSend = g.partSend = ctx.createGain();
    partSend.gain.value = mute.includes('part') ? 0 : 0.32;           // the clean guitar's send, the same
    partSend.connect(partRoom).connect(partRoomOut).connect(out);

    const bufferSize = Math.floor(ctx.sampleRate * 0.5);
    const noise = g.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < bufferSize; i++){
      data[i] = Math.random() * 2 - 1;
    }
    return g;
  }

  // Render a schedule through a graph of its own and hand back the audio,
  // so a test can measure what the mix does rather than guess. The schedule
  // is synchronous, so pointing the module at the offline graph for its
  // duration is safe; the live graph, the sleep timers and the queue are
  // untouched. `random` seeds the engine's randomness for a render that
  // can be reproduced; sample buffers decoded on the live context play on
  // the offline one.
  async function renderOffline(seconds, schedule, { sampleRate = 48000, random, limiter = true, mute = [] } = {}){
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
    const live = G, wasOffline = offline, wasRnd = rnd;
    const g = buildGraph(ctx, { limiter, mute });
    applyGraph(g); offline = true; if (random) rnd = random;
    try { schedule(GT.audio, ctx); }
    finally {
      offline = wasOffline; rnd = wasRnd;
      if (live) applyGraph(live); else audioCtx = null;
    }
    return ctx.startRendering();
  }

  // simple additive "piano" tone: a handful of decaying harmonics
  // The piano's harmonic series, as a single wave the oscillator can play
  // directly — one oscillator does what a stack of five sines used to.
  // imag[n] is the level of the nth harmonic; index 0 is DC and stays silent.
  const PIANO_PARTIALS = [0, 0.50, 0.28, 0.13, 0.06, 0.03];

  function pianoWaveFor(ctx){
    const imag = new Float32Array(PIANO_PARTIALS);
    const real = new Float32Array(imag.length);
    // keep the partial levels literal — normalising would rescale the wave and
    // make every note noticeably louder than the rest of the mix expects
    return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
  }

  // Start a source, and remember it until its moment comes. Notes are queued
  // ahead of the sound, so stopping playback has to be able to call off the
  // ones that haven't started — otherwise the queue plays on past the button.
  function startVoice(node, time, gain, offset){
    if (offline){ node.start(time, offset || 0); return node; }
    wakeForVoice(time);
    // Every voice here is stopped explicitly, a moment after it's started, so
    // this is where the engine learns how long it will be busy. Watching the
    // call rather than asking each caller to report means a voice added later
    // is counted without anyone remembering to count it.
    const stop = node.stop.bind(node);
    node.stop = when => {
      busyUntil = Math.max(busyUntil, when == null ? audioCtx.currentTime : when);
      planSleep();
      return stop(when);
    };
    node.start(time, offset || 0);
    pending.push({ node, time, gain });
    // the list only ever needs the notes still to come
    if (pending.length > 256){
      const now = audioCtx.currentTime;
      pending = pending.filter(v => v.time > now);
    }
    return node;
  }

  // How far ahead of the clock a scheduler queues its notes. Visible, 0.4 s
  // (T36): enough to ride out a throttled timer, short enough that stop is
  // stop. Hidden, browsers clamp timers to a second, so the queue has to
  // hold more than a second or the music slips once a second; each
  // scheduler refills at once on going hidden, before the first slow tick.
  const SCHEDULE_AHEAD = { visible: 0.4, hidden: 1.25 };
  const scheduleAhead = hidden => SCHEDULE_AHEAD[hidden ? 'hidden' : 'visible'];

  // How many steps a scheduler's cursor has to jump to land on or after `now`.
  // A moment that has already passed can't be scheduled: the audio clock
  // doesn't play a past time late, it starts everything at that time at once,
  // which is heard as a burst of attacks rather than music. So a scheduler
  // steps over what a stall ate — a browser throttles the timers of a page
  // that isn't focused, to a second or more — and the run slips instead.
  // Shared by both players, since both queue against the same clock.
  function stepsToSkip(cursor, now, step){
    if (step <= 0 || cursor >= now) return 0;
    return Math.ceil((now - cursor) / step);
  }

  // Called off. A note that hasn't started yet is stopped outright — stopping
  // a source before its start time means it never plays at all. A note already
  // sounding used to be left to ring out the way it would have, which was
  // right when every voice was synthesized and fell away in a moment; a
  // recorded piano note rings for seconds, so pause stopped sounding like
  // stop. Now they're taken away over STOP_FADE — long enough not to click,
  // short enough to be the button you pressed.
  const STOP_FADE = 0.06;

  // Reports what it did — how many notes were called off before they started
  // and how many were taken away mid-ring — so the behaviour can be tested
  // without anything having to listen.
  function cancelScheduled(){
    if (!audioCtx) return { stopped: 0, faded: 0 };
    const now = audioCtx.currentTime;
    let stopped = 0, faded = 0;
    pending.forEach(v => {
      if (v.time > now){
        stopped++;
        try { v.node.stop(now); } catch (e) { /* already finished */ }
        return;
      }
      faded++;
      if (v.gain){
        try {
          const g = v.gain.gain;
          g.cancelScheduledValues(now);
          g.setValueAtTime(Math.max(g.value, 0.0001), now);
          g.exponentialRampToValueAtTime(0.0001, now + STOP_FADE);
        } catch (e) { /* a voice that has already finished has nothing to fade */ }
      }
      try { v.node.stop(now + STOP_FADE + 0.01); } catch (e) { /* already finished */ }
    });
    pending = [];
    return { stopped, faded };
  }

  // The piano, played from the recordings when they're here and synthesized
  // when they aren't. Every caller goes through this, so a page that can
  // reach audio/piano/ gets the Kawai everywhere the app plays a piano note,
  // and a page that can't never learns there was a choice.
  function playNote(freq, time, duration, velocity){
    const mix = pianoLayerMix(velocity);
    const parts = [];
    [[true, mix.hard], [false, mix.soft]].forEach(([hard, gain]) => {
      if (gain < 0.02) return;
      const spec = pianoSampleIfReady(freq, hard);
      if (spec) parts.push({ spec, gain });
    });
    if (!parts.length){ voiceUse.pianoSynth++; synthPiano(freq, time, duration, velocity); return; }
    // One note, whether it took one layer or two — and if only one of them
    // has arrived it carries the whole note rather than a share of it, so a
    // half-finished warm is quiet in nobody's ears.
    const total = Math.sqrt(parts.reduce((sum, p) => sum + p.gain * p.gain, 0));
    voiceUse.pianoSampled++;
    parts.forEach(p => playRecordedPiano(p.spec, freq, time, duration, velocity, p.gain / total));
  }

  function synthPiano(freq, time, duration, velocity){
    // A struck string doesn't fade evenly: it drops fast at first, then rings
    // on quietly. Two ramps give that shape instead of one straight decay.
    // High notes are played a little quieter and low ones a little fuller,
    // the way a piano's own strings balance across the keyboard.
    const balance = Math.min(1.25, Math.max(0.55, Math.pow(261.6 / freq, 0.3)));
    const peak = 0.425 * velocity * balance;   // halved: the two oscillators below sum
    const knee = Math.min(0.18, duration * 0.4);
    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(peak, time + 0.006);
    envelope.gain.exponentialRampToValueAtTime(peak * 0.34, time + knee);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Bright on the attack, mellowing as it rings — and harder notes open the
    // filter further, the way playing harder brings out the upper partials.
    const tone = audioCtx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.Q.value = 0.6;
    const open = Math.min(11000, freq * 7 + 2200 * velocity);
    tone.frequency.setValueAtTime(open, time);
    tone.frequency.exponentialRampToValueAtTime(
      Math.max(500, open * 0.32), time + Math.min(0.7, duration));
    tone.connect(envelope);
    envelope.connect(masterGain);
    envelope.connect(reverbSends.piano);

    // two copies a few cents apart, for the shimmer of real strings per note
    [-3, 3].forEach(detune => {
      const osc = audioCtx.createOscillator();
      osc.setPeriodicWave(pianoWave);
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(tone);
      startVoice(osc, time, envelope);
      osc.stop(time + duration + 0.05);
    });

    // the hammer: a few milliseconds of filtered noise on the front of the
    // note, which is most of what makes a piano sound struck rather than bowed
    const hammer = audioCtx.createBufferSource();
    hammer.buffer = noiseBuffer;
    const knock = audioCtx.createBiquadFilter();
    knock.type = 'bandpass';
    knock.frequency.value = Math.min(6000, freq * 6);
    knock.Q.value = 1.2;
    const knockGain = audioCtx.createGain();
    knockGain.gain.setValueAtTime(0.0001, time);
    knockGain.gain.exponentialRampToValueAtTime(0.09 * velocity, time + 0.002);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.014);
    hammer.connect(knock).connect(knockGain).connect(masterGain);
    startVoice(hammer, time, knockGain);
    hammer.stop(time + 0.02);
  }

  // ---- a real guitar, when the page can reach the recordings --------------
  //
  // Fifteen notes of a 2017 Martin HD-28, one every two or three semitones
  // from E2 to B5, pitched up or down to reach the notes in between — the
  // mapping is the one the original .sfz specifies, key range and all.
  //
  // WHERE THEY CAME FROM. Recorded and mapped by Jeff Learman for Kinwie's
  // Discord SFZ GM bank, and taken from the sfzinstruments fork of it:
  // https://github.com/sfzinstruments/Discord-SFZ-GM-Bank — the folder
  // "Discord GM/Melodic/026-Acoustic Guitar (steel)".
  //
  // WHY WE THINK WE MAY USE THEM. They are CC0 — a public domain dedication,
  // which waives copyright as far as the law allows, so there is no condition
  // to meet and not even attribution is required. We credit the author
  // anyway: it is his guitar and his work. The licence is stated by the
  // author himself in the header of the .sfz that maps these very samples —
  //
  //     // GM Acoustic Guitar
  //     // 2017 Martin HD28 Vintage Series
  //     // Author: Jeff Learman, for Kinwie's Discord SFZ GM
  //     // License: Creative Commons CC0
  //
  // — identically in the upstream repository and in the fork, repeated in a
  // second .sfz beside the samples, under a bank whose README says "Each
  // instrument is licensed by its creator... Only CC0, CC-BY, and equivalent
  // licences are allowed." Checked 2026-09-10. audio/guitar/SOURCE.md keeps
  // the full reasoning, and what was rejected and why.
  //
  // The samples are a bonus rather than a requirement: opened from a file://
  // URL the browser gives the page an opaque origin and refuses to let it
  // read its own neighbours, so the fetch fails and the synthesized voice
  // below plays instead. Nothing about the app depends on them arriving.
  const GUITAR_DIR = 'audio/guitar/';
  const GUITAR_SAMPLES = [
    { file: 'MartinGM2_040__E2_1.wav', key: 40, lo: 35, hi: 41 },
    { file: 'MartinGM2_043__G2_1.wav', key: 43, lo: 42, hi: 44 },
    { file: 'MartinGM2_046_Bb2_1.wav', key: 46, lo: 45, hi: 47 },
    { file: 'MartinGM2_049_Db3_1.wav', key: 49, lo: 48, hi: 50 },
    { file: 'MartinGM2_052__E3_1.wav', key: 52, lo: 51, hi: 53 },
    { file: 'MartinGM2_055__G3_1.wav', key: 55, lo: 54, hi: 56 },
    { file: 'MartinGM2_058_Bb3_1.wav', key: 58, lo: 57, hi: 59 },
    { file: 'MartinGM2_061_Db4_1.wav', key: 61, lo: 60, hi: 62 },
    { file: 'MartinGM2_064__E4_1.wav', key: 64, lo: 63, hi: 66 },
    { file: 'MartinGM2_068_Ab4_1.wav', key: 68, lo: 67, hi: 69 },
    { file: 'MartinGM2_071__B4_1.wav', key: 71, lo: 70, hi: 72 },
    { file: 'MartinGM2_074__D5_1.wav', key: 74, lo: 73, hi: 75 },
    { file: 'MartinGM2_077__F5_1.wav', key: 77, lo: 76, hi: 78 },
    { file: 'MartinGM2_080_Ab5_1.wav', key: 80, lo: 79, hi: 81 },
    { file: 'MartinGM2_083__B5_1.wav', key: 83, lo: 82, hi: 88 },
  ];
  // THE PIANO. The same reasoning, a different recording: a Kawai upright
  // standing in a living room, recorded in January 2017 by Gonzalo
  // <humanogonzalo@gmail.com> and Roberto <roberto@zenvoid.org> on a Zoom H1
  // at about the height a player's head would be, edited by Roberto, and
  // published by the FreePats project — Roberto's own project — under the
  // Creative Commons CC0 1.0 public domain dedication. The samples are in
  // audio/piano/, from <https://github.com/freepats/upright-piano-KW>, with
  // the dedication stated both on the project's page and in the README that
  // ships in the repository, which is kept beside them.
  //
  // WHY WE THINK WE MAY USE THEM. CC0 waives copyright as far as the law
  // allows: no condition to meet, not even attribution. We name the players
  // anyway. The test this had to pass is the one T49's Killer Bass failed —
  // the grant has to be readable where it was given, by the people entitled
  // to give it — and here the recordists published it themselves.
  // audio/piano/SOURCE.md keeps the full reasoning and what was rejected.
  //
  // The map below is the upstream .sfz, transcribed: each line is a file, the
  // note it was recorded at, and the keys it covers. TWO LAYERS, and they are
  // not sampled alike — the soft one is minor thirds all the way up, the hard
  // one adds a B in most octaves but is missing A2 and C4 — so each layer
  // gets its own list rather than one list with a suffix swapped, which is
  // the version of this that asks for files that don't exist.
  const PIANO_DIR = 'audio/piano/samples/';
  const pianoMap = text => text.trim().split('\n').map(line => {
    const [name, key, lo, hi] = line.trim().split(/\s+/);
    return { file: name + '.flac', key: +key, lo: +lo, hi: +hi };
  });
  const PIANO_SOFT = pianoMap(`
    A0vL 21 21 22
    C1vL 24 23 25
    D#1vL 27 26 28
    F#1vL 30 29 31
    A1vL 33 32 34
    C2vL 36 35 37
    D#2vL 39 38 40
    F#2vL 42 41 43
    A2vL 45 44 46
    C3vL 48 47 49
    D#3vL 51 50 52
    F#3vL 54 53 55
    A3vL 57 56 58
    C4vL 60 59 61
    D#4vL 63 62 64
    F#4vL 66 65 67
    A4vL 69 68 70
    C5vL 72 71 73
    D#5vL 75 74 76
    F#5vL 78 77 79
    A5vL 81 80 82
    C6vL 84 83 85
    D#6vL 87 86 88
    F#6vL 90 89 91
    A6vL 93 92 94
    C7vL 96 95 97
    D#7vL 99 98 100
    F#7vL 102 101 103
    A7vL 105 104 106
    C8vL 108 107 108
  `);
  const PIANO_HARD = pianoMap(`
    A0vH 21 21 22
    B0vH 23 23 23
    C1vH 24 24 25
    D#1vH 27 26 28
    F#1vH 30 29 31
    A1vH 33 32 33
    B1vH 35 34 35
    C2vH 36 36 37
    D#2vH 39 38 40
    F#2vH 42 41 45
    B2vH 47 46 47
    C3vH 48 48 49
    D#3vH 51 50 52
    F#3vH 54 53 55
    A3vH 57 56 57
    B3vH 59 58 61
    D#4vH 63 62 64
    F#4vH 66 65 67
    A4vH 69 68 69
    B4vH 71 70 71
    C5vH 72 72 73
    D#5vH 75 74 76
    F#5vH 78 77 79
    A5vH 81 80 81
    B5vH 83 82 83
    C6vH 84 84 85
    D#6vH 87 86 88
    F#6vH 90 89 91
    A6vH 93 92 93
    B6vH 95 94 95
    C7vH 96 96 97
    D#7vH 99 98 100
    F#7vH 102 101 103
    A7vH 105 104 105
    B7vH 107 106 107
    C8vH 108 108 108
  `);
  // the .sfz splits its layers at MIDI velocity 80, which is this much of the
  // 0..1 velocity everything here speaks in
  const PIANO_SPLIT = 80 / 127;
  // Set by measuring, not by ear: the same note played both ways, tapped off
  // the node that feeds the output. At 0.9 the recordings land within a
  // sixth of the synthesized voice's peak at full velocity, which is what a
  // progression needs — nothing should jump in loudness at the moment the
  // samples finish arriving.
  const PIANO_LEVEL = 0.9;

  // THE BASS. A 1958 Otto Rubner double bass, played pizzicato and mapped by
  // D. Smolken, who recorded it and who dedicated it to the public domain
  // himself: the CC0 licence in audio/bass/LICENSE.txt was committed to
  // <https://github.com/sfzinstruments/dsmolken.double-bass> by Smolken in
  // November 2022, with the message "Swapping to CC0", and the readme beside
  // it names him as the copyright holder. That is the test T49's rejected
  // Killer Bass failed and this one passes: the grant is made where it can be
  // read, by the person entitled to make it. audio/bass/SOURCE.md has the
  // reasoning, and what was left upstream.
  //
  // Three velocity bands, split where the upstream .sfz splits them — 0-74,
  // 75-120, 121-127 of MIDI velocity — and the bands are NOT sampled alike:
  // where a pitch has only two layers the .sfz fills the gap with a sample
  // from the other one, which is why the file names in a band don't share a
  // suffix. Reading the band out of a file name rather than out of the .sfz
  // is what made a forte B1 sit next to a piano A2, seventeen decibels apart.
  const BASS_DIR = 'audio/bass/samples/';
  const bassMap = text => text.trim().split('\n').map(line => {
    const [name, key, lo, hi] = line.trim().split(/\s+/);
    return { file: name + '.wav', key: +key, lo: +lo, hi: +hi };
  });
  const BASS_SOFT = bassMap(`
    pizz_c1_pa 24 12 24
    pizz_eb1_ma 27 25 27
    pizz_g1_pa 31 28 31
    pizz_bb1_pa 34 32 34
    pizz_d2_pa 38 35 38
    pizz_f2_pa 41 39 41
    pizz_a2_pa 45 42 45
    pizz_c3_pa 48 46 48
    pizz_e3_pa 52 49 52
    pizz_g3_pa 55 53 55
    pizz_a3_pa 57 56 60
  `);
  const BASS_MID = bassMap(`
    pizz_c1_ma 24 12 24
    pizz_eb1_fa 27 25 27
    pizz_g1_ma 31 28 31
    pizz_bb1_fa 34 32 34
    pizz_d2_ma 38 35 38
    pizz_f2_ma 41 39 41
    pizz_a2_ma 45 42 45
    pizz_c3_ma 48 46 48
    pizz_e3_ma 52 49 52
    pizz_g3_ma 55 53 55
    pizz_a3_ma 57 56 60
  `);
  const BASS_HARD = bassMap(`
    pizz_c1_fa 24 12 26
    pizz_g1_fa 31 27 33
    pizz_d2_fa 38 34 38
    pizz_f2_fa 41 39 41
    pizz_a2_fa 45 42 45
    pizz_c3_fa 48 46 48
    pizz_e3_fa 52 49 52
    pizz_g3_fa 55 53 55
    pizz_a3_fa 57 56 60
  `);
  // The bands in the order the .sfz has them, with the velocity each covers.
  const BASS_BANDS = [
    { map: BASS_SOFT, hiVel: 74 },
    { map: BASS_MID,  hiVel: 120 },
    { map: BASS_HARD, hiVel: 127 },
  ];
  // The highest note that was recorded reaches this far and no further. A
  // walking line can ask for more: the "third, up an octave" figure lands on
  // a D#4 in the keys of A, A# and B. Six semitones of stretch stops sounding
  // like a bass, so those notes are played an octave down — which is what a
  // player would do rather than climb to the end of the fingerboard for one
  // passing note. The fold happens whatever voice is playing, so the line is
  // the same line whether it's the recording or the synth.
  const BASS_TOP = 60;

  // ---- one bank, two instruments ----
  // Both want the same three things: fetch a file once, keep the decoded
  // buffer, and say nothing when a fetch fails. A page opened from disk can't
  // read its own neighbours at all, so failing quietly is the common case
  // rather than the exception — everything falls back to the synthesized
  // voices and the app carries on.
  const makeBank = dir => ({ dir, buffers: new Map(), loading: new Map(), reachable: true });
  const guitarBank = makeBank(GUITAR_DIR);
  const pianoBank = makeBank(PIANO_DIR);
  const bassBank = makeBank(BASS_DIR);

  const midiOf = freq => Math.round(69 + 12 * Math.log2(freq / 440));
  const inMap = (map, midi) => map.find(s => midi >= s.lo && midi <= s.hi)
    || (midi < map[0].lo ? map[0] : map[map.length - 1]);
  const sampleFor = midi => inMap(GUITAR_SAMPLES, midi);
  const pianoSampleFor = (midi, hard) => inMap(hard ? PIANO_HARD : PIANO_SOFT, midi);

  function loadInto(bank, spec){
    if (!audioCtx) return Promise.resolve(false);
    if (bank.buffers.has(spec.file)) return Promise.resolve(true);
    if (bank.loading.has(spec.file)) return bank.loading.get(spec.file);
    // the piano's file names carry a sharp, which a URL reads as the start of
    // a fragment unless it's escaped
    const job = fetch(bank.dir + encodeURIComponent(spec.file))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(bytes => audioCtx.decodeAudioData(bytes))
      .then(buf => { bank.buffers.set(spec.file, buf); return true; })
      .catch(() => { bank.reachable = false; return false; })
      .finally(() => bank.loading.delete(spec.file));
    bank.loading.set(spec.file, job);
    return job;
  }
  const loadSample = spec => loadInto(guitarBank, spec);

  // Have the recordings for these notes on hand, if they can be had at all.
  // Resolves false rather than throwing: a page that can't reach them plays
  // the synthesized voice and says nothing about it.
  function readyForPluck(freqs){
    if (!guitarBank.reachable || !audioCtx) return Promise.resolve(false);
    const wanted = [...new Set(freqs.map(f => sampleFor(midiOf(f))))];
    return Promise.all(wanted.map(loadSample)).then(all => all.every(Boolean));
  }

  const pluckReady = freq => guitarBank.buffers.has(sampleFor(midiOf(freq)).file);

  // One note of the real guitar. The sample is a whole pluck with its own
  // decay, so the envelope here only fades it out when the note's time is up
  // rather than shaping it from scratch.
  // `bus` is 'band' (the comp guitar) or 'part' (the suggested part). `fx`
  // is what the part's techniques need of one note:
  //   bend:      semitones to push the pitch up, after a moment, over ~120 ms
  //   slideFrom: a frequency to start at and slide to `freq` over ~80 ms
  //   soft:      no pick — the hammered-on or pulled-off note, eased in
  //   mute:      palm-muted: short, and the top rolled off
  // Pitch is moved by the sample's playback rate, which is what a bend or a
  // slide does to a string — the same recording, faster.
  // `who` says what the pluck is beyond its sound: { string } names the
  // string it is on (the part's realised notes know theirs; a strum's k-th
  // note from the bottom is 'strum:k'), for the players and the tests.
  function playPluck(freq, time, duration, velocity = 1, bus = 'band', fx = null, who = {}){
    const spec = sampleFor(midiOf(freq));
    const buffer = guitarBank.buffers.get(spec.file);
    if (!buffer){
      voiceUse.guitarSynth++;      // asked for a guitar, got whatever playNote has
      return playNote(freq, time, duration, velocity);
    }
    voiceUse.guitarSampled++;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    // the sample's own pitch, moved to the note asked for — and a hair off
    // it, with a hair of the recording's front skipped, so no two plucks of
    // a string are the same waveform and two voices on one pitch never
    // start in phase (the comp and the part share these recordings)
    const cents = (rnd() - 0.5) * PLUCK_DETUNE_CENTS;
    const rateFor = f => f / (440 * Math.pow(2, (spec.key - 69) / 12)) * Math.pow(2, cents / 1200);
    const rate = rateFor(freq);
    const skip = rnd() * PLUCK_SKIP;
    if (fx && fx.slideFrom){
      src.playbackRate.setValueAtTime(rateFor(fx.slideFrom), time);
      src.playbackRate.linearRampToValueAtTime(rate, time + Math.min(0.08, duration * 0.5));
    } else if (fx && fx.bend){
      const start = time + Math.min(0.06, duration * 0.2);
      src.playbackRate.setValueAtTime(rate, start);
      src.playbackRate.linearRampToValueAtTime(rate * Math.pow(2, fx.bend / 12), start + Math.min(0.14, duration * 0.5));
    } else {
      src.playbackRate.value = rate;
    }

    const env = audioCtx.createGain();
    const level = 0.9 * velocity * (fx && fx.soft ? 0.8 : 1);
    if (fx && fx.soft){
      // a hammered note has no pick on the front of it
      env.gain.setValueAtTime(0.0001, time);
      env.gain.exponentialRampToValueAtTime(level, time + 0.025);
    } else {
      env.gain.setValueAtTime(level, time);
    }
    const fade = Math.min(0.35, duration * 0.3);
    env.gain.setValueAtTime(level, time + Math.max(0.02, duration - fade));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.02);

    if (fx && fx.mute){
      // the heel of the hand on the strings: the top gone, the ring short
      const damp = audioCtx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 900;
      damp.Q.value = 0.5;
      src.connect(damp).connect(env);
    } else {
      src.connect(env);
    }
    if (bus === 'part'){
      env.connect(partGain);
      env.connect(partSend);
    } else {
      env.connect(masterGain);
      env.connect(reverbSends.clean);
    }
    startVoice(src, time, env, skip);
    src.stop(time + duration + 0.06);
  }
  const PLUCK_DETUNE_CENTS = 10;      // ±5 cents, under what an ear hears as out of tune
  const PLUCK_SKIP = 0.004;           // up to 4 ms of the recording's front

  // ---- a strum -------------------------------------------------------------
  // A strum is the strings one after another the way a pick crosses them:
  // down is the low string first and the whole sweep SWEEP.down wide, up is
  // the high string first and quicker; the strings struck later are a shade
  // lighter (SWEEP_TAPER from first to last); and the whole strum carries
  // the weight one and a half notes would whatever its size — STRUM_SHARE
  // is parts.js's strumStringLevel (B49), held equal by a test — with the
  // taper renormalised so the sweep changes the shape and not the level.
  const SWEEP = { down: 0.032, up: 0.022 };
  const SWEEP_TAPER = 0.22;
  const STRUM_SHARE = n => Math.min(1, 1.45 / Math.sqrt(n));

  // The plan: [{ freq, at, level, string }] in the order they sound. `vel`
  // is one level for the strum, or a level a string low to high (the
  // part's realised strings carry their own).
  function strumPlan(freqs, time, vel, { stroke = 'down', sweep, strings } = {}){
    const n = freqs.length;
    const order = freqs.map((f, i) => i);
    if (stroke === 'up') order.reverse();
    const width = sweep != null ? sweep : (SWEEP[stroke] != null ? SWEEP[stroke] : SWEEP.down);
    const gap = n > 1 ? width / (n - 1) : 0;
    const base = Array.isArray(vel) ? vel : freqs.map(() => vel * STRUM_SHARE(n));
    const shaped = order.map((i, k) => base[i] * (1 - SWEEP_TAPER * (n > 1 ? k / (n - 1) : 0)));
    const was = Math.sqrt(base.reduce((s, v) => s + v * v, 0));
    const is = Math.sqrt(shaped.reduce((s, v) => s + v * v, 0)) || 1;
    return order.map((i, k) => ({ freq: freqs[i], at: time + k * gap, level: shaped[k] * was / is,
                                 string: strings ? strings[i] : `strum:${i}` }));
  }

  function strum(freqs, time, duration, vel, opts = {}){
    strumPlan(freqs, time, vel, opts).forEach(s =>
      playPluck(s.freq, s.at, duration, s.level, opts.bus || 'band', opts.fx || null, { string: s.string }));
  }

  // ---- the part, played --------------------------------------------------
  // The practice tab, the parts page and the review page all play a
  // realised part; this is the one place it is turned into sound. `notes`
  // are realised notes (parts.js), `at(n)` the audio time of a note's own
  // `at` (the caller knows its grid, its swing and its humanising), `level`
  // the part's gain over the realised velocity (PART_LEVEL at the default
  // slider, B48). Strums are grouped by their moment and swept; a rake is
  // two muted strings ahead of the note; a slapback is a second, quieter
  // pluck a moment on where the style lives on it. Returns what it played,
  // for the followers.
  const PART_LEVEL = 2.4;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // what a realised note asks of the engine — all of it, not the first
  // flag that matches: a hammered note can be muted, a bend can shake
  const partFx = n => {
    const fx = {};
    if (n.bend) fx.bend = n.bend;
    if (n.slide != null) fx.slideFrom = hz(n.midi + (n.slide - n.fret));
    if (n.soft) fx.soft = true;
    if (n.mute) fx.mute = true;
    if (n.vib) fx.vib = true;
    return Object.keys(fx).length ? fx : null;
  };
  function playPartNotes(notes, at, slotDur, level, { slapback = false, jit = () => 0 } = {}){
    const played = [], strums = new Map();
    const slap = (freq, t, dur, vel, fx) => {
      if (slapback) playPluck(freq, t + 0.11, Math.min(dur, 0.25), vel * 0.35, 'part', fx && fx.mute ? { mute: true } : null);
    };
    notes.forEach(n => {
      if (n.strum){
        const key = `${n.at}|${n.voicing || 'full'}|${n.next ? 'n' : ''}`;
        if (!strums.has(key)) strums.set(key, []);
        strums.get(key).push(n);
        return;
      }
      const t = at(n) + jit(0.008), dur = n.dur * slotDur, vel = n.vel * level * (1 + jit(0.08));
      const fx = partFx(n);
      if (n.rake) [2, 1].forEach((k, i) => playPluck(hz(n.midi - 5 * k), t - 0.028 + i * 0.012, 0.06, 0.22 * level, 'part', { mute: true }, { string: `part:${n.string + k}` }));
      playPluck(hz(n.midi), t, dur, vel, 'part', fx, { string: `part:${n.string}` });
      slap(hz(n.midi), t, dur, vel, fx);
      played.push({ note: n, time: t, until: t + dur });
    });
    strums.forEach(group => {
      group.sort((a, b) => a.midi - b.midi);
      const first = group[0], t = at(first) + jit(0.008), dur = first.dur * slotDur;
      const fx = partFx(first);
      const plan = strumPlan(group.map(n => hz(n.midi)), t, group.map(n => n.vel * level * (1 + jit(0.08))),
                             { stroke: first.stroke || 'down', strings: group.map(n => `part:${n.string}`) });
      plan.forEach(s => {
        playPluck(s.freq, s.at, dur, s.level, 'part', fx, { string: s.string });
        slap(s.freq, s.at, dur, s.level, fx);
        played.push({ note: group.find(n => `part:${n.string}` === s.string), time: s.at, until: s.at + dur });
      });
    });
    return played;
  }

  // The band's volume, 0..1, as one gain on its bus — the comp, the bass,
  // the drums and their room, all at once. Held if the engine isn't built
  // yet and applied when it is; ramped, not stepped, so a slider being
  // dragged doesn't click.
  function setBandLevel(level){
    bandLevelWanted = Math.max(0, Math.min(1, level));
    if (bandGain) bandGain.gain.setTargetAtTime(bandLevelWanted, audioCtx.currentTime, 0.02);
  }
  const bandLevel = () => bandLevelWanted;

  // One layer's sample for this note, if it's here.
  function pianoSampleIfReady(freq, hard){
    if (!audioCtx || !pianoBank.reachable) return null;
    const spec = pianoSampleFor(midiOf(freq), hard);
    return pianoBank.buffers.has(spec.file) ? spec : null;
  }

  // HOW HARD THE NOTE WAS STRUCK, WITHOUT A STEP. The two layers are two
  // different strikes, not one strike at two volumes: the hard one has a
  // brighter attack and more of the hammer in it. Choosing one or the other
  // at a threshold meant a bar of quarter notes in the Simple style — a
  // downbeat either side of the split from everything after it — alternated
  // between two instruments rather than two dynamics, which is audible as a
  // jolt rather than as an accent. So velocities near the split play both,
  // with equal-power gains, and the sound moves from one to the other
  // instead of jumping.
  const PIANO_XFADE = 0.15;              // half-width of the overlap, in velocity

  // sin/cos rather than the obvious sqrt pair: both hold the power constant
  // through the middle, but sqrt has infinite slope at nought, so the layer
  // would come in with a lurch at the edge of the window — the very thing
  // this exists to remove, moved to a quieter place. A quarter-turn of sine
  // arrives and leaves flat.
  function pianoLayerMix(velocity){
    const t = (velocity - (PIANO_SPLIT - PIANO_XFADE)) / (2 * PIANO_XFADE);
    const x = Math.max(0, Math.min(1, t));
    return { hard: Math.sin(x * Math.PI / 2), soft: Math.cos(x * Math.PI / 2) };
  }

  // One note of the real piano. The sample is a whole note with its own
  // decay, so nothing here shapes it — the envelope holds it flat and then
  // takes it away when the note's time is up, and the only thing scaled by
  // velocity is the level, since which layer plays has already answered the
  // question of how hard it was struck.
  function playRecordedPiano(spec, freq, time, duration, velocity, share = 1){
    const src = audioCtx.createBufferSource();
    src.buffer = pianoBank.buffers.get(spec.file);
    // the note it was recorded at, moved to the note asked for: at most a
    // semitone for the soft layer and three for the hard one, which is the
    // upstream mapping rather than a guess
    src.playbackRate.value = freq / (440 * Math.pow(2, (spec.key - 69) / 12));

    const env = audioCtx.createGain();
    // Straight multiplication, the way the synthesized voice scales its own
    // peak, because the two layers are not level-matched to each other: the
    // soft A3 is recorded a touch louder than the hard one, so leaning on the
    // layer to carry the dynamic left soft beats louder than hard ones.
    // Uncapped for the same reason the synth is — the practice tab's
    // roots-only mode deliberately asks for more than 1 to make a lone root
    // sit where a triad did, and the limiter catches the rest.
    const level = PIANO_LEVEL * velocity * share;
    env.gain.setValueAtTime(level, time);
    const fade = Math.min(0.3, duration * 0.3);
    env.gain.setValueAtTime(level, time + Math.max(0.02, duration - fade));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.02);

    src.connect(env);
    env.connect(masterGain);
    env.connect(reverbSends.piano);
    startVoice(src, time, env);
    src.stop(time + duration + 0.06);
  }

  // The recordings a run of notes is about to need, fetched before the beat
  // that needs them. Both layers, because one progression played straight
  // through uses both: the practice tab strikes a downbeat at full velocity
  // and everything else at 0.62, which lands either side of the split.
  // Every pitch a chord can be played at, whichever voice the style picks:
  // the plain triad, the 7th, and the rootless 7th the jazz styles comp with.
  function chordVoicings(chord){
    return Object.keys(STYLE_VOICES)
      .reduce((all, name) => all.concat(STYLE_VOICES[name].freqs(chord)), []);
  }

  // WHAT GETS WARMED, AND WHY IT ISN'T THE WHOLE PIANO. Every chord this app
  // can build, voiced every way it can be voiced, lands between A2 and C5 —
  // settleVoicing above keeps the 7ths from climbing out of it — and a test
  // holds that true over every chord and every voice. That stretch is a fraction of the
  // 66 recordings: a few megabytes to fetch, tens once decoded. The whole
  // keyboard would be 33 MB to fetch, which is nothing much, and 125 MB
  // decoded, which is not — Web Audio keeps a buffer as 32-bit floats, four
  // times the size of the file, and these are long samples: 325 seconds of
  // piano altogether. So the range is the unit, not the chord: warming per
  // chord saves a few megabytes and leaves a hole the moment a style voices
  // somewhere the warm didn't look, which is exactly how the jazz comp came
  // out synthesized.
  const PIANO_RANGE = { lo: 45, hi: 72 };

  // Matched to the synthesized bass it replaces, by measurement.
  const BASS_LEVEL = 2;

  function warmPiano(){
    if (!audioCtx || !pianoBank.reachable) return Promise.resolve(false);
    const wanted = [...PIANO_SOFT, ...PIANO_HARD]
      .filter(spec => spec.hi >= PIANO_RANGE.lo && spec.lo <= PIANO_RANGE.hi);
    return Promise.all(wanted.map(spec => loadInto(pianoBank, spec)))
      .then(all => all.every(Boolean));
  }

  // The chords of a progression, on the piano by default and on the recorded
  // guitar when asked for. A guitar's strings don't arrive together, so its
  // notes are spread by a pick's sweep rather than struck at once — a chord
  // played dead flat is the thing that stops sounding like a guitar first.
  //
  // The voice falls back per chord rather than per session: a sample that
  // hasn't arrived plays as piano, which is a chord in the wrong voice
  // instead of a hole in the beat. warmGuitar() before playback makes that
  // rare — the practice tab calls it when you press Play.
  const PIANO_ROLL = 0.003;           // two hands never land dead together

  // Whatever the notes are, played the way the chosen voice plays them. Every
  // chord in the app comes through here — the plain triad, the styles' 7ths,
  // the jazz shell — so the voice can't reach one kind of chord and miss
  // another, which is what it did when only the Simple style passed it on.
  let lastVoiceAsked = null;          // what the test watches, since sound isn't testable

  // A running tally of which voices actually played: recordings or the
  // synthesized stand-ins. "Am I hearing the samples?" is otherwise a matter
  // of opinion, and the answer changes with what has finished downloading.
  const voiceUse = {
    pianoSampled: 0, pianoSynth: 0,
    bassSampled: 0, bassSynth: 0,
    guitarSampled: 0, guitarSynth: 0,
  };
  const resetVoiceUse = () => Object.keys(voiceUse).forEach(k => { voiceUse[k] = 0; });

  function playVoicedNotes(freqs, time, duration, velocity, voice, opts = {}){
    lastVoiceAsked = voice || 'piano';
    if (voice === 'guitar' && freqs.every(pluckReady)){
      strum(freqs, time, duration, velocity, { stroke: opts.stroke || 'down', bus: 'band' });
      return;
    }
    freqs.forEach((freq, i) => playNote(freq, time + i * PIANO_ROLL, duration, velocity));
  }

  function playChord(chord, time, duration, velocity, voice, opts){
    playVoicedNotes(chordFrequencies(chord), time, duration, velocity, voice, opts);
  }

  // Every recording at once, for a tab that plays to a clock and can't wait
  // for one mid-bar. Silent about failure, like everything else here: a page
  // that can't reach them simply stays on the piano.
  function warmGuitar(){
    if (!audioCtx || !guitarBank.reachable) return Promise.resolve(false);
    return Promise.all(GUITAR_SAMPLES.map(loadSample)).then(all => all.every(Boolean));
  }

  // ---- extra voices for the styles ----

  function pcFreq(pc, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + pc - 69) / 12);
  }
  // WHERE A BASS PLAYER PUTS THE ROOT. Every root used to be taken in one
  // octave, so the distance from the bottom of the instrument depended on the
  // key: a C sat four semitones up and a B sat fifteen, and a boogie figure
  // that fits comfortably in C climbed to an A3 in B — a note a bass player
  // reaches for rarely, and never for a pattern like that. A player takes the
  // lowest root they have. On a bass tuned E-A-D-G that is E1 upward, so
  // roots from E up take the low octave and C, C#, D and D# take the one
  // above it, which puts every root inside E1-D#2 whatever the key.
  const bassRootOctave = pc => (pc >= 4 ? 1 : 2);
  const bassNote = (pc, off = 0) => bassFreqAt(pc, off, bassRootOctave(pc));

  // absolute frequency `off` semitones above the root pitch-class in `octave`
  function bassFreqAt(rootPc, off, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + rootPc + off - 69) / 12);
  }

  // Triad plus a 7th; `rootless` drops the low root and voices it higher.
  // A chord that carries its own 7th — one the practice tab's shape picker
  // set — is played as written. A plain triad still gets the style's 7th,
  // since that's the style's sound: a blues comps in dominants.
  // KEEPING THE COMP IN THE MIDDLE OF THE PIANO. A voicing is built upward
  // from its lowest note, so how high it finishes depends on the key: the
  // rootless shape sits E4-C5 in C and climbs to Ab5 in Ab, a long way above
  // where a pianist actually comps, and in the sharp keys it sings out over
  // everything else. Whole octaves are taken off (or added) until it sits in
  // the stretch a comping hand uses — the shape and the spacing are kept
  // exactly, only the register moves, which is what a player does when a
  // voicing lands too high: the same grip, an octave down.
  // Around a centre rather than under a ceiling. A ceiling alone leaves
  // neighbouring keys an octave apart — a voicing that just fits stays put
  // while the one a semitone above it drops — so the register would lurch
  // whenever a progression crossed that line. Settling each voicing about the
  // same centre keeps the comp in one place whatever the key, which is also
  // what makes the movement between chords small.
  const COMP_CENTRE = 57;                        // A3, where a comping hand sits
  const COMP_DRIFT = 6;                          // ...give or take a half-octave

  function settleVoicing(freqs){
    let notes = freqs;
    // a voicing settles in a step or two; the bound is there so one that
    // somehow can't fit gives up rather than spinning
    for (let i = 0; i < 4; i++){
      const centre = notes.reduce((sum, f) => sum + midiOf(f), 0) / notes.length;
      if (centre - COMP_CENTRE > COMP_DRIFT) notes = notes.map(f => f / 2);
      else if (COMP_CENTRE - centre > COMP_DRIFT) notes = notes.map(f => f * 2);
      else break;
    }
    return notes;
  }

  // Where the notes of a 7th chord land, worked out apart from playing them:
  // the styles voice much higher than a plain triad does — the rootless one
  // starts an octave up and climbs from there — and anything wanting the
  // recordings on hand before the beat has to know that. Warming the triad
  // and hoping is what leaves a jazz comp synthesized.
  function chord7Frequencies(chord, rootless){
    const r = SEMITONE[chord.note], third = SEMITONE[chord.third], fifth = SEMITONE[chord.fifth];
    const isDom = chord.numeral === 'V' || chord.numeral === 'VII' || chord.numeral === 'v';
    const seventh = chord.seventh
      ? SEMITONE[chord.seventh] % 12
      : (r + (isDom || chord.quality !== 'maj' ? 10 : 11)) % 12;
    const pcs = rootless ? [third, fifth, seventh, r] : [r, third, fifth, seventh];
    let octave = rootless ? 4 : 3, prev = -1;
    return settleVoicing(pcs.map(pc => {
      if (pc <= prev) octave++;
      prev = pc;
      return pcFreq(pc, octave);
    }));
  }

  function playChord7(chord, time, duration, velocity, rootless, voice, opts){
    playVoicedNotes(chord7Frequencies(chord, rootless), time, duration, velocity, voice, opts);
  }

  // Which band a velocity asks for, and which sample inside it. Our velocity
  // is 0..1; the .sfz speaks MIDI, so it's scaled rather than guessed at.
  function bassSampleFor(midi, velocity){
    const vel = Math.max(0, Math.min(127, Math.round(velocity * 127)));
    const band = BASS_BANDS.find(b => vel <= b.hiVel) || BASS_BANDS[BASS_BANDS.length - 1];
    return inMap(band.map, midi);
  }

  // The band the velocity asks for if we have it, any band we do have if not.
  // Same trade as the piano: a note in the wrong dynamic beats a note in the
  // wrong instrument, and during a warm that is the choice.
  function bassSampleReady(midi, velocity){
    if (!audioCtx || !bassBank.reachable) return null;
    const asked = bassSampleFor(midi, velocity);
    if (bassBank.buffers.has(asked.file)) return asked;
    for (const band of BASS_BANDS){
      const spec = inMap(band.map, midi);
      if (bassBank.buffers.has(spec.file)) return spec;
    }
    return null;
  }

  // Down an octave at a time until the note is one the bass was recorded
  // playing. Above BASS_TOP there is nothing but stretch.
  function bassFold(freq){
    let f = freq;
    while (midiOf(f) > BASS_TOP) f /= 2;
    return f;
  }

  // The stretch a bass line uses: the lowest root a style can take, less a
  // semitone for the approach note under it, up to the top of a boogie figure
  // on the highest root. A test walks every style and fails if anything lands
  // outside it, so this can't quietly stop covering the music.
  const BASS_RANGE = { lo: 26, hi: 52 };

  // Every band, so a note is never played in the wrong dynamic for want of a
  // download — the whole range is fourteen files where the piano's is
  // twenty-five, and the difference isn't worth the hole it leaves.
  function bassWarmList(){
    return [BASS_SOFT, BASS_MID, BASS_HARD].reduce((all, map) => all.concat(
      map.filter(spec => spec.hi >= BASS_RANGE.lo && spec.lo <= BASS_RANGE.hi)), []);
  }

  function warmBass(){
    if (!audioCtx || !bassBank.reachable) return Promise.resolve(false);
    return Promise.all(bassWarmList().map(spec => loadInto(bassBank, spec)))
      .then(all => all.every(Boolean));
  }

  // One note of the real bass, the sample's own decay left alone and taken
  // away when the note's time is up — the same shape as the guitar's pluck.
  function playRecordedBass(spec, freq, time, duration, velocity){
    const src = audioCtx.createBufferSource();
    src.buffer = bassBank.buffers.get(spec.file);
    src.playbackRate.value = freq / (440 * Math.pow(2, (spec.key - 69) / 12));
    const env = audioCtx.createGain();
    const level = BASS_LEVEL * velocity;
    env.gain.setValueAtTime(level, time);
    const fade = Math.min(0.18, duration * 0.3);
    env.gain.setValueAtTime(level, time + Math.max(0.02, duration - fade));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.02);
    src.connect(env);
    env.connect(bassGain);
    startVoice(src, time, env);
    src.stop(time + duration + 0.06);
  }

  function playBass(freq, time, duration, velocity){
    const note = bassFold(freq);
    const spec = bassSampleReady(midiOf(note), velocity);
    if (spec){ voiceUse.bassSampled++; return playRecordedBass(spec, note, time, duration, velocity); }
    voiceUse.bassSynth++;
    synthBass(note, time, duration, velocity);
  }

  function synthBass(freq, time, duration, velocity){
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(velocity, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(lp).connect(env).connect(bassGain);
    startVoice(osc, time, env);
    osc.stop(time + duration + 0.05);
  }

  function playHiHat(time, velocity = 1, decay = 0.06){
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 8000;
    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(velocity, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    src.connect(highpass).connect(envelope).connect(hihatGain);
    startVoice(src, time, envelope);
    src.stop(time + decay + 0.03);
  }

  function playRide(time, velocity = 1){
    playHiHat(time, velocity * 0.5, 0.3);          // wash
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 640;
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(velocity * 0.1, time + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(env).connect(hihatGain);
    startVoice(osc, time, env);
    osc.stop(time + 0.24);
  }

  function playKick(time, velocity = 1){
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(velocity, time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    osc.connect(env).connect(drumGain);
    startVoice(osc, time, env);
    osc.stop(time + 0.32);
  }

  function playSnare(time, velocity = 1){
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 0.6;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(0.0001, time);
    ng.gain.exponentialRampToValueAtTime(velocity, time + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    src.connect(bp).connect(ng).connect(drumGain);
    ng.connect(reverbSends.drums);
    startVoice(src, time, ng);
    src.stop(time + 0.18);

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195, time);
    osc.frequency.exponentialRampToValueAtTime(130, time + 0.09);
    const og = audioCtx.createGain();
    og.gain.setValueAtTime(0.0001, time);
    og.gain.exponentialRampToValueAtTime(velocity * 0.45, time + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    osc.connect(og).connect(drumGain);
    startVoice(osc, time, og);
    osc.stop(time + 0.13);
  }

  // Where each style voice puts its notes, and how it plays them, declared
  // together. Anything that needs to know what a style will reach for — the
  // warm, and the test that holds the warmed range honest — asks `freqs`, so
  // a voice added here can't quietly start playing notes nothing warmed.
  const STYLE_VOICES = {
    triad: { freqs: chord => chordFrequencies(chord),
             play: (chord, t, d, v, voice, o) => playChord(chord, t, d, v, voice, o) },
    dom7:  { freqs: chord => chord7Frequencies(chord, false),
             play: (chord, t, d, v, voice, o) => playChord7(chord, t, d, v, false, voice, o) },
    jazz:  { freqs: chord => chord7Frequencies(chord, true),
             play: (chord, t, d, v, voice, o) => playChord7(chord, t, d, v, true, voice, o) },
  };

  // `styleVoice` is how the style spells a chord — triad, 7th, jazz shell.
  // `voice` is what plays it, piano or guitar, and it has to be carried the
  // whole way down: a style that drops it leaves the Voice control doing
  // nothing whenever that style is playing.
  // `opts.stroke` — 'down' or 'up' — is which way the pick goes when the
  // voice is the guitar; the piano has no use for it.
  function playStyleVoice(styleVoice, chord, time, duration, velocity, voice, opts){
    (STYLE_VOICES[styleVoice] || STYLE_VOICES.triad).play(chord, time, duration, velocity, voice, opts);
  }

  // ---- style rhythm patterns (one bar of 4/4) --------------------------------
  // grid = subdivisions per bar (16 = sixteenths, 12 = triplet-eighths / shuffle);
  // drum arrays list slot indices; chord/bass entries are { slot, dur (in slots),
  // vel } with bass carrying either a semitone `off` from the root or a `walk`
  // index for the walking-bass line. The feels here are exactly the ones the
  // style picker lists — one flat list, in the Set up sheet and the bar alike.
  // the patterns: the base ones from styles-base.js with the proposals merged
  // over them by styles.js — see there
  const STYLES = (GT.styles && GT.styles.STYLES) || GT.stylesBase.STYLES;

  // one note of a walking bass line for `chord`, position 0-3 within the bar
  function walkBassFreq(chord, nextChord, pos, approachNext){
    const r = SEMITONE[chord.note] % 12;
    const isMin = chord.quality !== 'maj';                     // minor and diminished both have a flat 3rd
    if (pos === 0) return bassNote(r);                         // root
    if (pos === 1) return bassNote(r, 7);                      // fifth
    if (pos === 2) return bassNote(r, isMin ? 3 : 4);          // third, in position
    const targetPc = approachNext ? SEMITONE[nextChord.note] % 12 : r;
    return bassNote(targetPc, -1);                             // chromatic approach from below
  }

  GT.audio = {
    ctx: () => audioCtx,               // live handle; null until ensureAudio() runs
    renderOffline, buildGraph,          // a render through a graph of its own, for measuring
    scheduleAhead, SCHEDULE_AHEAD,
    strum, strumPlan, STRUM_SHARE, SWEEP, SWEEP_TAPER, playPartNotes, PART_LEVEL, partFx,
    pianoWaveFor, PIANO_PARTIALS,      // exposed so the tests can render a note offline
    GUITAR_SAMPLES, sampleFor,         // ...and to check every note has a recording behind it
    ensureAudio, keepAwake, planSleep, sleepDelay, IDLE_SLEEP_SEC, HIDDEN_SLEEP_SEC, cancelScheduled, stepsToSkip, noteFreq, chordFrequencies, pcFreq, bassFreqAt, walkBassFreq, ROOT_OCTAVE,
    playNote, playChord, playChord7, playBass,
    playPluck, readyForPluck, pluckReady, warmGuitar,
    setBandLevel, bandLevel, partBus: () => partGain,
    PIANO_SOFT, PIANO_HARD, PIANO_SPLIT, PIANO_RANGE, PIANO_XFADE, pianoSampleFor, warmPiano,
    pianoLayerMix, pianoReady: (freq, velocity) => pianoSampleIfReady(freq, velocity >= PIANO_SPLIT),
    chord7Frequencies, chordVoicings, STYLE_VOICES, COMP_CENTRE, COMP_DRIFT, settleVoicing, lastVoiceAsked: () => lastVoiceAsked,
    BASS_SOFT, BASS_MID, BASS_HARD, BASS_BANDS, BASS_TOP, BASS_RANGE, bassSampleFor, bassFold,
    warmBass, bassWarmList, bassNote, bassRootOctave,
    voiceUse: () => ({ ...voiceUse }), resetVoiceUse,
    playHiHat, playRide, playKick, playSnare, playStyleVoice,
    STYLES,
  };
})();
