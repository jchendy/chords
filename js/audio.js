// Web Audio engine: the synth voices (piano, bass, drums) and the groove patterns
// each genre plays. Owns the AudioContext; knows nothing about the UI.
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
  let guitarGain = null;
  let driveCurve = null;
  let driveIn = null;           // the shared overdrive stage's input
  let reverb = null;
  let reverbSends = {};         // per-voice send gains into the reverb

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
  }

  // Hiding the tab releases the lock, and a released sentinel can't be reused,
  // so coming back has to ask for a new one.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) acquireWakeLock();
  });

  function ensureAudio(){
    if(!audioCtx){
      claimPlaybackAudio();
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Every bus meets at one limiter, so a kick, a bass note and a full
      // chord landing on the same beat can't add up past what the output
      // can carry. Gentle enough to be inaudible until it's needed.
      const limiter = audioCtx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      limiter.connect(audioCtx.destination);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3;
      const tone = audioCtx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 4800;
      tone.Q.value = 0.7;
      masterGain.connect(tone);
      tone.connect(limiter);

      // separate percussion chain so the hi-hat's high end isn't
      // swallowed by the piano voice's lowpass filter
      hihatGain = audioCtx.createGain();
      hihatGain.gain.value = 0.4;
      hihatGain.connect(limiter);

      // bass and kick/snare buses for the genre styles
      bassGain = audioCtx.createGain();
      bassGain.gain.value = 0.42;
      bassGain.connect(limiter);

      drumGain = audioCtx.createGain();
      drumGain.gain.value = 0.55;
      drumGain.connect(limiter);

      pianoWave = pianoWaveFor(audioCtx);

      // the guitar in the genre examples gets its own bus
      guitarGain = audioCtx.createGain();
      guitarGain.gain.value = 0.5;
      guitarGain.connect(limiter);

      // a soft-clipping curve — the overdrive the punk and metal tones run through
      driveCurve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++){
        const x = (i / 1023) * 2 - 1;
        driveCurve[i] = Math.tanh(x * 3.2);
      }
      // One overdrive stage shared by every 'drive' note, so the strings of a
      // chord add up *before* they clip — that intermodulation is where a
      // power chord's crunch comes from; clipping each string on its own
      // never gets there. Pre-gain sets how hard the stage is driven; the
      // filter after it takes the fizz off the top.
      driveIn = audioCtx.createGain();
      driveIn.gain.value = 2.2;
      const driveShaper = audioCtx.createWaveShaper();
      driveShaper.curve = driveCurve;
      driveShaper.oversample = '4x';
      const driveTone = audioCtx.createBiquadFilter();
      driveTone.type = 'lowpass';
      driveTone.frequency.value = 4200;
      driveTone.Q.value = 0.8;
      const driveOut = audioCtx.createGain();
      driveOut.gain.value = 0.55;
      driveIn.connect(driveShaper).connect(driveTone).connect(driveOut).connect(guitarGain);

      // a shared reverb, with a send from each voice at its own level: a
      // clean guitar sits in it, an overdriven one only touches it, and the
      // palm-muted chug stays dry
      reverb = audioCtx.createConvolver();
      reverb.buffer = roomImpulse(audioCtx, 1.8);
      const reverbOut = audioCtx.createGain();
      reverbOut.gain.value = 0.5;
      reverb.connect(reverbOut).connect(limiter);
      reverbSends = {};
      [['piano', 0.14], ['clean', 0.32], ['drive', 0.14], ['muted', 0.05], ['drums', 0.08]].forEach(([name, level]) => {
        const g = audioCtx.createGain();
        g.gain.value = level;
        g.connect(reverb);
        reverbSends[name] = g;
      });

      const bufferSize = Math.floor(audioCtx.sampleRate * 0.5);
      noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++){
        data[i] = Math.random() * 2 - 1;
      }
    }
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
  function startVoice(node, time, gain){
    node.start(time);
    pending.push({ node, time, gain });
    // the list only ever needs the notes still to come
    if (pending.length > 256){
      const now = audioCtx.currentTime;
      pending = pending.filter(v => v.time > now);
    }
    return node;
  }

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
  function playPluck(freq, time, duration, velocity = 1){
    const spec = sampleFor(midiOf(freq));
    const buffer = guitarBank.buffers.get(spec.file);
    if (!buffer){
      voiceUse.guitarSynth++;      // asked for a guitar, got whatever playNote has
      return playNote(freq, time, duration, velocity);
    }
    voiceUse.guitarSampled++;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    // the sample's own pitch, moved to the note asked for
    src.playbackRate.value = freq / (440 * Math.pow(2, (spec.key - 69) / 12));

    const env = audioCtx.createGain();
    const level = 0.9 * velocity;
    env.gain.setValueAtTime(level, time);
    const fade = Math.min(0.35, duration * 0.3);
    env.gain.setValueAtTime(level, time + Math.max(0.02, duration - fade));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.02);

    src.connect(env);
    env.connect(masterGain);
    env.connect(reverbSends.clean);
    startVoice(src, time, env);
    src.stop(time + duration + 0.06);
  }

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
  // can build, voiced every way it can be voiced, lands between C3 and G#5 —
  // 1656 notes checked, and a test holds it there. That stretch is 25 of the
  // 66 recordings: 10.6 MB to fetch and about 42 MB once decoded. The whole
  // keyboard would be 33 MB to fetch, which is nothing much, and 125 MB
  // decoded, which is not — Web Audio keeps a buffer as 32-bit floats, four
  // times the size of the file, and these are long samples: 325 seconds of
  // piano altogether. So the range is the unit, not the chord: warming per
  // chord saves a few megabytes and leaves a hole the moment a style voices
  // somewhere the warm didn't look, which is exactly how the jazz comp came
  // out synthesized.
  const PIANO_RANGE = { lo: 48, hi: 80 };

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
  const STRUM_GAP = 0.016;

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

  function playVoicedNotes(freqs, time, duration, velocity, voice){
    lastVoiceAsked = voice || 'piano';
    if (voice === 'guitar' && freqs.every(pluckReady)){
      freqs.forEach((freq, i) => playPluck(freq, time + i * STRUM_GAP, duration, velocity));
      return;
    }
    freqs.forEach(freq => playNote(freq, time, duration, velocity));
  }

  function playChord(chord, time, duration, velocity, voice){
    playVoicedNotes(chordFrequencies(chord), time, duration, velocity, voice);
  }

  // Every recording at once, for a tab that plays to a clock and can't wait
  // for one mid-bar. Silent about failure, like everything else here: a page
  // that can't reach them simply stays on the piano.
  function warmGuitar(){
    if (!audioCtx || !guitarBank.reachable) return Promise.resolve(false);
    return Promise.all(GUITAR_SAMPLES.map(loadSample)).then(all => all.every(Boolean));
  }

  // ---- extra voices for the genre styles ----

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
    return pcs.map(pc => {
      if (pc <= prev) octave++;
      prev = pc;
      return pcFreq(pc, octave);
    });
  }

  function playChord7(chord, time, duration, velocity, rootless, voice){
    playVoicedNotes(chord7Frequencies(chord, rootless), time, duration, velocity, voice);
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
             play: (chord, t, d, v, voice) => playChord(chord, t, d, v, voice) },
    dom7:  { freqs: chord => chord7Frequencies(chord, false),
             play: (chord, t, d, v, voice) => playChord7(chord, t, d, v, false, voice) },
    jazz:  { freqs: chord => chord7Frequencies(chord, true),
             play: (chord, t, d, v, voice) => playChord7(chord, t, d, v, true, voice) },
  };

  // `styleVoice` is how the style spells a chord — triad, 7th, jazz shell.
  // `voice` is what plays it, piano or guitar, and it has to be carried the
  // whole way down: a style that drops it leaves the Voice control doing
  // nothing whenever that style is playing.
  function playStyleVoice(styleVoice, chord, time, duration, velocity, voice){
    (STYLE_VOICES[styleVoice] || STYLE_VOICES.triad).play(chord, time, duration, velocity, voice);
  }

  // A plucked-string voice for the genre examples. Sawtooth pairs give the
  // reedy edge of a wound string; the tone decides how bright it is, how long
  // it rings, whether it goes through the shared overdrive, and how much of
  // it reaches the reverb.
  //   clean  — hollowbody/ringing, for rockabilly, jazz, surf
  //   muted  — palm-muted chug, short and thumpy
  //   drive  — overdriven and sustaining, for punk and metal
  const CLEAN_SAMPLE_TRIM = 1.6;
  const GUITAR_TONES = {
    clean: { cutoff: 3400, close: 0.5, ring: 1,    level: 0.30, drive: false },
    muted: { cutoff: 1100, close: 0.3, ring: 0.16, level: 0.34, drive: false },
    drive: { cutoff: 2600, close: 0.6, ring: 1,    level: 0.20, drive: true },
  };

  function playGuitar(freq, time, duration, velocity = 1, tone = 'clean'){
    // The clean tone is a string ringing undistorted, which is the one thing
    // the recordings actually are — so when they're here they play it. The
    // other two stay synthesized on purpose: a palm-muted chug and an
    // overdriven sustain are different articulations, not one note made
    // shorter or dirtier, and a struck Martin pushed through a clipping
    // stage is neither of them. CLEAN_SAMPLE_TRIM matches the recording's
    // level to the synthesized tone it replaces; measured, like the piano's.
    if (tone === 'clean' && pluckReady(freq)){
      return playPluck(freq, time, duration, velocity * CLEAN_SAMPLE_TRIM);   // counts itself
    }
    if (tone === 'clean') voiceUse.guitarSynth++;
    const spec = GUITAR_TONES[tone] || GUITAR_TONES.clean;
    const ring = Math.min(duration, duration * spec.ring + 0.02);

    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(spec.level * velocity, time + 0.004);
    env.gain.exponentialRampToValueAtTime(spec.level * velocity * 0.4, time + ring * 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, time + ring);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.1;
    const open = Math.min(9000, spec.cutoff + freq * 2);
    filter.frequency.setValueAtTime(open, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, open * spec.close), time + ring);

    filter.connect(env);
    // the overdriven tone goes through the shared stage, where the other
    // strings of the chord are waiting to be clipped together with it
    env.connect(spec.drive ? driveIn : guitarGain);
    env.connect(reverbSends[tone] || reverbSends.clean);

    [-4, 4].forEach(detune => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      startVoice(osc, time, env);
      osc.stop(time + ring + 0.05);
    });
  }

  // ---- genre rhythm patterns (one bar of 4/4) --------------------------------
  // grid = subdivisions per bar (16 = sixteenths, 12 = triplet-eighths / shuffle);
  // drum arrays list slot indices; chord/bass entries are { slot, dur (in slots),
  // vel } with bass carrying either a semitone `off` from the root or a `walk`
  // index for the walking-bass line. Each style offers three canonical "feels".
  const STYLES = {
    rock: {
      label: 'Rock',
      variants: [
        {
          label: 'Straight rock',
          grid: 16,
          kick:  [0, 8, 10],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ slot: s, dur: 1.8, vel: s % 4 === 0 ? 0.95 : 0.6 })),
          bass:  [0, 4, 8, 12].map((s, i) => ({ slot: s, off: 0, dur: 3.4, vel: [0.95, 0.8, 0.88, 0.8][i] })),
        },
        {
          // Between the other two: Straight rock strums eight chords a bar
          // over eighth-note hats, Half-time holds two and puts the snare on
          // 3 alone. This keeps the full backbeat — which is where the drive
          // comes from — and halves everything else: a chord and a hat on
          // each quarter, each chord ending as the next lands. The bass does
          // the work between: roots on 1 and 3, a pickup on the "and" of 2,
          // and the fifth on the "and" of 4 leading back round.
          label: 'Quarter drive',
          grid: 16,
          kick:  [0, 6, 8],
          snare: [4, 12],
          hat:   [0, 4, 8, 12],
          voice: 'triad',
          chord: [
            { slot: 0,  dur: 3.6, vel: 0.9 },  { slot: 4,  dur: 3.6, vel: 0.68 },
            { slot: 8,  dur: 3.6, vel: 0.82 }, { slot: 12, dur: 3.6, vel: 0.68 },
          ],
          bass: [
            { slot: 0,  off: 0, dur: 3.4, vel: 0.9 },  { slot: 6,  off: 0, dur: 1.6, vel: 0.7 },
            { slot: 8,  off: 0, dur: 3.4, vel: 0.85 }, { slot: 14, off: 7, dur: 1.6, vel: 0.72 },
          ],
        },
        {
          label: 'Half-time',     // snare only on 3, sustained power chords
          grid: 16,
          kick:  [0, 6],
          snare: [8],
          hat:   [0, 4, 8, 12],
          voice: 'triad',
          chord: [{ slot: 0, dur: 7.5, vel: 0.9 }, { slot: 8, dur: 7.5, vel: 0.85 }],
          bass:  [{ slot: 0, off: 0, dur: 7.5, vel: 0.95 }, { slot: 8, off: 0, dur: 7.5, vel: 0.85 }],
        },
        {
          label: 'Punk drive',    // 16th-note "1 & a" gallop, skipping the "e" of each beat
          grid: 16,
          kick:  [0, 3, 4, 7, 8, 11, 12, 15],       // hits the downbeat and the pickup into the next one
          snare: [4, 12],
          hat:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],   // constant 16ths
          voice: 'triad',
          // gallop strum: 1, &, a of every beat (slots 0,2,3 / 4,6,7 / 8,10,11 / 12,14,15)
          chord: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
            .map(s => ({ slot: s, dur: 0.9, vel: s % 4 === 0 ? 0.95 : 0.72 })),
          // bass follows the same gallop, jumping octaves for drive
          bass: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
            .map((s, i) => ({ slot: s, off: i % 2 === 0 ? 0 : 12, dur: 0.9, vel: 0.88 })),
        },
      ],
    },
    blues: {
      label: 'Blues',
      variants: [
        {
          label: 'Shuffle',      // straight-shuffle boogie: 1st & 3rd triplet of each beat
          grid: 12,
          kick:  [0, 6],
          snare: [3, 9],
          hat:   [0, 2, 3, 5, 6, 8, 9, 11],
          voice: 'dom7',
          // walking boogie bass: 1 3 5 6 b7 6 5 3
          bass: [
            { slot: 0, off: 0,  dur: 1.7, vel: 0.95 }, { slot: 2,  off: 4, dur: 0.8, vel: 0.8 },
            { slot: 3, off: 7,  dur: 1.7, vel: 0.9 },  { slot: 5,  off: 9, dur: 0.8, vel: 0.8 },
            { slot: 6, off: 10, dur: 1.7, vel: 0.9 },  { slot: 8,  off: 9, dur: 0.8, vel: 0.8 },
            { slot: 9, off: 7,  dur: 1.7, vel: 0.9 },  { slot: 11, off: 4, dur: 0.8, vel: 0.8 },
          ],
          // chord on the downbeat, light stabs on the shuffle upbeats —
          // each let ring well past the next hit for a fuller sustain
          chord: [
            { slot: 0, dur: 6, vel: 0.8 },
            { slot: 2, dur: 2.2, vel: 0.4 }, { slot: 5, dur: 2.2, vel: 0.4 },
            { slot: 8, dur: 2.2, vel: 0.4 }, { slot: 11, dur: 2.2, vel: 0.4 },
          ],
        },
        {
          label: 'Slow blues',   // sparse 12/8 ballad: just the turnaround bass and a held chord
          grid: 12,
          kick:  [0, 6],
          kickVel: 0.55,
          snare: [9],
          hat:   [0, 3, 6, 9],
          voice: 'dom7',
          bass: [{ slot: 0, off: 0, dur: 5, vel: 0.9 }, { slot: 6, off: 7, dur: 5, vel: 0.8 }],
          chord: [{ slot: 0, dur: 11, vel: 0.7 }],
        },
        {
          // T51: the one blues here that isn't swung. Every other variant is
          // built on triplets, so all three shuffle; this is the jump / rock
          // and roll side of the music — even eighths, quicker, with the
          // drive coming from the bass figure and the backbeat rather than
          // from the lilt. A 16-slot grid, so an eighth is two slots and the
          // eighths land square instead of on the 1st and 3rd of a triplet.
          label: 'Jump blues',
          grid: 16,
          kick:  [0, 6, 8, 14],
          snare: [4, 12],              // backbeat, hard: this is where it drives from
          snareVel: 0.9,
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'dom7',
          // the boogie figure, straight: 1 3 5 6 - b7 6 5 3, two slots a note
          bass: [
            { slot: 0,  off: 0,  dur: 1.9, vel: 0.95 }, { slot: 2,  off: 4,  dur: 1.9, vel: 0.8 },
            { slot: 4,  off: 7,  dur: 1.9, vel: 0.9 },  { slot: 6,  off: 9,  dur: 1.9, vel: 0.8 },
            { slot: 8,  off: 10, dur: 1.9, vel: 0.9 },  { slot: 10, off: 9,  dur: 1.9, vel: 0.8 },
            { slot: 12, off: 7,  dur: 1.9, vel: 0.9 },  { slot: 14, off: 4,  dur: 1.9, vel: 0.8 },
          ],
          // Two stabs a bar, on the backbeat, and nothing else. A jump band
          // doesn't comp through this — the bass boogie is the engine and
          // the horns punch 2 and 4 — and six hits a bar left no room to
          // hear either. Short, so they're punches rather than pads.
          chord: [
            { slot: 4, dur: 1.5, vel: 0.75 }, { slot: 12, dur: 1.5, vel: 0.7 },
          ],
        },
        {
          label: 'Train beat',   // busy blues-rock shuffle (Texas / boogie-rock)
          grid: 12,
          kick:  [0, 3, 6, 9],
          snare: [3, 9],
          hat:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          voice: 'dom7',
          bass: [
            { slot: 0, off: 0, dur: 1.6, vel: 0.95 }, { slot: 2, off: 7, dur: 0.8, vel: 0.8 },
            { slot: 3, off: 0, dur: 1.6, vel: 0.9 },  { slot: 5, off: 7, dur: 0.8, vel: 0.8 },
            { slot: 6, off: 0, dur: 1.6, vel: 0.95 }, { slot: 8, off: 7, dur: 0.8, vel: 0.8 },
            { slot: 9, off: 0, dur: 1.6, vel: 0.9 },  { slot: 11, off: 7, dur: 0.8, vel: 0.8 },
          ],
          chord: [0, 3, 6, 9].map(s => ({ slot: s, dur: 2.6, vel: 0.6 })),
        },
      ],
    },
    jazz: {
      label: 'Jazz',
      variants: [
        {
          label: 'Swing',        // spang-a-lang ride + walking bass + Charleston comping
          grid: 12,
          kick:  [0, 6],
          kickVel: 0.3,
          snare: [],
          hat:   [3, 9],                       // foot hi-hat on 2 & 4
          ride:  [0, 3, 5, 6, 9, 11],          // spang-a-lang
          voice: 'jazz',
          bass: [
            { slot: 0, walk: 0, dur: 2.6, vel: 0.9 },
            { slot: 3, walk: 1, dur: 2.6, vel: 0.78 },
            { slot: 6, walk: 2, dur: 2.6, vel: 0.78 },
            { slot: 9, walk: 3, dur: 2.6, vel: 0.78 },
          ],
          chord: [
            { slot: 0, dur: 1.5, vel: 0.5 }, { slot: 5, dur: 2.2, vel: 0.55 },
            { slot: 6, dur: 1.5, vel: 0.5 }, { slot: 11, dur: 2.2, vel: 0.55 },
          ],
        },
        {
          label: 'Ballad',       // slow swing: quarter-note ride, sparse bass, long comps
          grid: 12,
          kick:  [0, 6],
          kickVel: 0.18,
          snare: [],
          hat:   [3, 9],
          ride:  [0, 3, 6, 9],
          voice: 'jazz',
          bass: [{ slot: 0, off: 0, dur: 5, vel: 0.75 }, { slot: 6, off: 7, dur: 5, vel: 0.65 }],
          chord: [{ slot: 0, dur: 5.5, vel: 0.45 }, { slot: 6, dur: 5.5, vel: 0.45 }],
        },
        {
          label: 'Bossa nova',   // straight (unswung) samba-derived bass, syncopated comp
          grid: 16,
          kick:  [0, 6, 10],
          kickVel: 0.45,
          snareVel: 0.5,
          snare: [4, 14],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'jazz',
          bass: [
            { slot: 0, off: 0, dur: 5.5, vel: 0.9 },
            { slot: 6, off: 7, dur: 3.5, vel: 0.7 },
            { slot: 10, off: 0, dur: 5.5, vel: 0.8 },
          ],
          chord: [{ slot: 6, dur: 3, vel: 0.5 }, { slot: 12, dur: 3, vel: 0.5 }],
        },
      ],
    },
    pop: {
      label: 'Pop',
      variants: [
        {
          label: 'Four-on-the-floor',
          grid: 16,
          kick:  [0, 4, 8, 12],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 4, 8, 12].map(s => ({ slot: s, dur: 3.6, vel: 0.8 })),
          bass:  [0, 4, 8, 12].map(s => ({ slot: s, off: 0, dur: 3.6, vel: 0.85 })),
        },
        {
          label: 'Ballad',
          grid: 16,
          kick:  [0, 8],
          kickVel: 0.6,
          snare: [4, 12],
          snareVel: 0.6,
          hat:   [0, 4, 8, 12],
          voice: 'triad',
          chord: [{ slot: 0, dur: 7.5, vel: 0.6 }, { slot: 8, dur: 7.5, vel: 0.55 }],
          bass:  [{ slot: 0, off: 0, dur: 7.5, vel: 0.75 }, { slot: 8, off: 0, dur: 7.5, vel: 0.7 }],
        },
        {
          label: 'Syncopated',   // contemporary off-beat dance-pop groove
          grid: 16,
          kick:  [0, 6, 10],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [0, 3, 6, 10, 13].map(s => ({ slot: s, dur: 1.5, vel: 0.72 })),
          bass:  [0, 6, 10].map(s => ({ slot: s, off: 0, dur: 2.2, vel: 0.85 })),
        },
      ],
    },
    funk: {
      label: 'Funk',
      variants: [
        {
          label: 'Classic funk', // hit "the One", syncopated ghost kicks, constant 16th hats
          grid: 16,
          kick:  [0, 3, 7, 10],
          kickVel: 1,
          snare: [4, 12],
          hat:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          voice: 'dom7',
          chord: [2, 6, 9, 14].map(s => ({ slot: s, dur: 2.4, vel: 0.65 })),
          bass:  [0, 3, 7, 10, 14].map(s => ({ slot: s, off: 0, dur: 1.7, vel: 0.85 })),
        },
        {
          label: '16th-note chop', // constant chord chops, repeating syncopated bass riff
          grid: 16,
          kick:  [0, 10],
          snare: [4, 12],
          hat:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          voice: 'dom7',
          chord: Array.from({ length: 16 }, (_, s) => ({ slot: s, dur: 1.3, vel: s % 4 === 0 ? 0.6 : 0.38 })),
          bass: [
            { slot: 0, off: 0, dur: 1.7, vel: 0.85 }, { slot: 3, off: 0, dur: 1.7, vel: 0.7 },
            { slot: 6, off: 7, dur: 1.7, vel: 0.8 },  { slot: 8, off: 0, dur: 1.7, vel: 0.7 },
            { slot: 11, off: 7, dur: 1.7, vel: 0.8 }, { slot: 14, off: 0, dur: 1.7, vel: 0.7 },
          ],
        },
        {
          label: 'Disco',
          grid: 16,
          kick:  [0, 4, 8, 12],
          snare: [4, 12],
          hat:   [0, 2, 4, 6, 8, 10, 12, 14],
          voice: 'triad',
          chord: [2, 6, 10, 14].map(s => ({ slot: s, dur: 3, vel: 0.7 })),
          // octave-jumping disco bass
          bass: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ slot: s, off: i % 2 === 0 ? 0 : 12, dur: 1.85, vel: 0.85 })),
        },
      ],
    },
  };

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
    pianoWaveFor, PIANO_PARTIALS,      // exposed so the tests can render a note offline
    GUITAR_SAMPLES, sampleFor,         // ...and to check every note has a recording behind it
    ensureAudio, keepAwake, cancelScheduled, stepsToSkip, noteFreq, chordFrequencies, pcFreq, bassFreqAt, walkBassFreq, ROOT_OCTAVE,
    playNote, playChord, playChord7, playBass, playGuitar,
    playPluck, readyForPluck, pluckReady, warmGuitar,
    PIANO_SOFT, PIANO_HARD, PIANO_SPLIT, PIANO_RANGE, PIANO_XFADE, pianoSampleFor, warmPiano,
    pianoLayerMix, pianoReady: (freq, velocity) => pianoSampleIfReady(freq, velocity >= PIANO_SPLIT),
    chord7Frequencies, chordVoicings, STYLE_VOICES, lastVoiceAsked: () => lastVoiceAsked,
    BASS_SOFT, BASS_MID, BASS_HARD, BASS_BANDS, BASS_TOP, BASS_RANGE, bassSampleFor, bassFold,
    warmBass, bassWarmList, bassNote, bassRootOctave,
    voiceUse: () => ({ ...voiceUse }), resetVoiceUse,
    playHiHat, playRide, playKick, playSnare, playStyleVoice,
    STYLES,
  };
})();
