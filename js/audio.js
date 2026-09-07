// Web Audio engine: the synth voices (piano, bass, drums) and the groove patterns
// each genre plays. Owns the AudioContext; knows nothing about the UI.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { SEMITONE, shuffle } = GT.theory;

  const ROOT_OCTAVE = 3;

  function noteFreq(name, octave){
    const midi = (octave + 1) * 12 + SEMITONE[name];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function chordFrequencies(chord, useSevenths){
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

    if (useSevenths && chord.seventh){
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

  function ensureAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3;
      const tone = audioCtx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 3200;
      tone.Q.value = 0.7;
      masterGain.connect(tone);
      tone.connect(audioCtx.destination);

      // separate percussion chain so the hi-hat's high end isn't
      // swallowed by the piano voice's lowpass filter
      hihatGain = audioCtx.createGain();
      hihatGain.gain.value = 0.4;
      hihatGain.connect(audioCtx.destination);

      // bass and kick/snare buses for the genre styles
      bassGain = audioCtx.createGain();
      bassGain.gain.value = 0.42;
      bassGain.connect(audioCtx.destination);

      drumGain = audioCtx.createGain();
      drumGain.gain.value = 0.55;
      drumGain.connect(audioCtx.destination);

      const bufferSize = Math.floor(audioCtx.sampleRate * 0.5);
      noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++){
        data[i] = Math.random() * 2 - 1;
      }
    }
  }

  // simple additive "piano" tone: a handful of decaying harmonics
  const HARMONICS = [
    { mult: 1, gain: 0.50 },
    { mult: 2, gain: 0.28 },
    { mult: 3, gain: 0.13 },
    { mult: 4, gain: 0.06 },
    { mult: 5, gain: 0.03 },
  ];

  function playNote(freq, time, duration, velocity){
    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(0.85 * velocity, time + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    envelope.connect(masterGain);

    HARMONICS.forEach(h => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * h.mult;
      const hGain = audioCtx.createGain();
      hGain.gain.value = h.gain;
      osc.connect(hGain).connect(envelope);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  function playChord(chord, time, duration, velocity, useSevenths){
    chordFrequencies(chord, useSevenths).forEach(freq => playNote(freq, time, duration, velocity));
  }

  // ---- extra voices for the genre styles ----

  function pcFreq(pc, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + pc - 69) / 12);
  }
  // absolute frequency `off` semitones above the root pitch-class in `octave`
  function bassFreqAt(rootPc, off, octave){
    return 440 * Math.pow(2, ((octave + 1) * 12 + rootPc + off - 69) / 12);
  }

  // triad plus a 7th; `rootless` drops the low root and voices it higher
  function playChord7(chord, time, duration, velocity, rootless){
    const r = SEMITONE[chord.note], third = SEMITONE[chord.third], fifth = SEMITONE[chord.fifth];
    const isDom = chord.numeral === 'V' || chord.numeral === 'VII' || chord.numeral === 'v';
    const seventh = (r + (isDom || chord.quality === 'min' ? 10 : 11)) % 12;
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

  function playStyleVoice(voice, chord, time, duration, velocity, useSevenths){
    if (voice === 'dom7') return playChord7(chord, time, duration, velocity, false);
    if (voice === 'jazz') return playChord7(chord, time, duration, velocity, true);
    return playChord(chord, time, duration, velocity, useSevenths);   // 'triad'
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
    const isMin = chord.quality === 'min';
    if (pos === 0) return bassFreqAt(r, 0, 2);                 // root
    if (pos === 1) return bassFreqAt(r, 7, 2);                 // fifth
    if (pos === 2) return bassFreqAt(r, isMin ? 15 : 16, 2);   // third, up an octave
    const targetPc = approachNext ? SEMITONE[nextChord.note] % 12 : r;
    return bassFreqAt(targetPc, -1, 2);                        // chromatic approach from below
  }

  GT.audio = {
    ctx: () => audioCtx,               // live handle; null until ensureAudio() runs
    ensureAudio, noteFreq, chordFrequencies, pcFreq, bassFreqAt, walkBassFreq,
    playNote, playChord, playChord7, playBass,
    playHiHat, playRide, playKick, playSnare, playStyleVoice,
    STYLES,
  };
})();
