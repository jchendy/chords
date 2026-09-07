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
  let hihatGain = null;
  let bassGain = null;
  let drumGain = null;
  let noiseBuffer = null;
  let pianoWave = null;
  let guitarGain = null;
  let driveCurve = null;

  function ensureAudio(){
    if(!audioCtx){
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

  function playNote(freq, time, duration, velocity){
    // A struck string doesn't fade evenly: it drops fast at first, then rings
    // on quietly. Two ramps give that shape instead of one straight decay.
    const peak = 0.425 * velocity;      // halved: the two oscillators below sum
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

    // two copies a few cents apart, for the shimmer of real strings per note
    [-3, 3].forEach(detune => {
      const osc = audioCtx.createOscillator();
      osc.setPeriodicWave(pianoWave);
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(tone);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  function playChord(chord, time, duration, velocity){
    chordFrequencies(chord).forEach(freq => playNote(freq, time, duration, velocity));
  }

  // ---- extra voices for the genre styles ----

  function pcFreq(pc, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + pc - 69) / 12);
  }
  // absolute frequency `off` semitones above the root pitch-class in `octave`
  function bassFreqAt(rootPc, off, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + rootPc + off - 69) / 12);
  }

  // Triad plus a 7th; `rootless` drops the low root and voices it higher.
  // A chord that carries its own 7th — one the practice tab's shape picker
  // set — is played as written. A plain triad still gets the style's 7th,
  // since that's the style's sound: a blues comps in dominants.
  function playChord7(chord, time, duration, velocity, rootless){
    const r = SEMITONE[chord.note], third = SEMITONE[chord.third], fifth = SEMITONE[chord.fifth];
    const isDom = chord.numeral === 'V' || chord.numeral === 'VII' || chord.numeral === 'v';
    const seventh = chord.seventh
      ? SEMITONE[chord.seventh] % 12
      : (r + (isDom || chord.quality !== 'maj' ? 10 : 11)) % 12;
    const pcs = rootless ? [third, fifth, seventh, r] : [r, third, fifth, seventh];
    let octave = rootless ? 4 : 3, prev = -1;
    pcs.forEach(pc => {
      if (pc <= prev) octave++;
      prev = pc;
      playNote(pcFreq(pc, octave), time, duration, velocity);
    });
  }

  function playBass(freq, time, duration, velocity){
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
    osc.start(time);
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
    src.start(time);
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
    osc.start(time);
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
    osc.start(time);
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
    src.start(time);
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
    osc.start(time);
    osc.stop(time + 0.13);
  }

  function playStyleVoice(voice, chord, time, duration, velocity){
    if (voice === 'dom7') return playChord7(chord, time, duration, velocity, false);
    if (voice === 'jazz') return playChord7(chord, time, duration, velocity, true);
    return playChord(chord, time, duration, velocity);   // 'triad'
  }

  // A plucked-string voice for the genre examples. Sawtooth pairs give the
  // reedy edge of a wound string; the tone decides how bright it is, how long
  // it rings, and whether it goes through the overdrive.
  //   clean  — hollowbody/ringing, for rockabilly, jazz, surf
  //   muted  — palm-muted chug, short and thumpy
  //   drive  — overdriven and sustaining, for punk and metal
  const GUITAR_TONES = {
    clean: { cutoff: 3400, close: 0.5, ring: 1,    level: 0.30, drive: false },
    muted: { cutoff: 1100, close: 0.3, ring: 0.16, level: 0.34, drive: false },
    drive: { cutoff: 2600, close: 0.6, ring: 1,    level: 0.20, drive: true },
  };

  function playGuitar(freq, time, duration, velocity = 1, tone = 'clean'){
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

    let head = filter;
    if (spec.drive){
      const shaper = audioCtx.createWaveShaper();
      shaper.curve = driveCurve;
      shaper.oversample = '2x';
      shaper.connect(filter);
      head = shaper;
    }
    filter.connect(env);
    env.connect(guitarGain);

    [-4, 4].forEach(detune => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(head);
      osc.start(time);
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
    if (pos === 0) return bassFreqAt(r, 0, 2);                 // root
    if (pos === 1) return bassFreqAt(r, 7, 2);                 // fifth
    if (pos === 2) return bassFreqAt(r, isMin ? 15 : 16, 2);   // third, up an octave
    const targetPc = approachNext ? SEMITONE[nextChord.note] % 12 : r;
    return bassFreqAt(targetPc, -1, 2);                        // chromatic approach from below
  }

  GT.audio = {
    ctx: () => audioCtx,               // live handle; null until ensureAudio() runs
    pianoWaveFor, PIANO_PARTIALS,      // exposed so the tests can render a note offline
    ensureAudio, noteFreq, chordFrequencies, pcFreq, bassFreqAt, walkBassFreq, ROOT_OCTAVE,
    playNote, playChord, playChord7, playBass, playGuitar,
    playHiHat, playRide, playKick, playSnare, playStyleVoice,
    STYLES,
  };
})();
