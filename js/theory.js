// Music theory: keys, scale degrees, chord formulas, naming and chord identification.
// Pure data and functions — no DOM, no audio, no app state.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const MAJOR_KEYS = {
    'C':  ['C','D','E','F','G','A','B'],
    'G':  ['G','A','B','C','D','E','F#'],
    'D':  ['D','E','F#','G','A','B','C#'],
    'A':  ['A','B','C#','D','E','F#','G#'],
    'E':  ['E','F#','G#','A','B','C#','D#'],
    'B':  ['B','C#','D#','E','F#','G#','A#'],
    'Gb': ['Gb','Ab','Bb','Cb','Db','Eb','F'],
    'Db': ['Db','Eb','F','Gb','Ab','Bb','C'],
    'Ab': ['Ab','Bb','C','Db','Eb','F','G'],
    'Eb': ['Eb','F','G','Ab','Bb','C','D'],
    'Bb': ['Bb','C','D','Eb','F','G','A'],
    'F':  ['F','G','A','Bb','C','D','E'],
  };

  const MINOR_KEYS = {
    'A':  ['A','B','C','D','E','F','G'],
    'E':  ['E','F#','G','A','B','C','D'],
    'B':  ['B','C#','D','E','F#','G','A'],
    'F#': ['F#','G#','A','B','C#','D','E'],
    'C#': ['C#','D#','E','F#','G#','A','B'],
    'G#': ['G#','A#','B','C#','D#','E','F#'],
    'Eb': ['Eb','F','Gb','Ab','Bb','Cb','Db'],
    'Bb': ['Bb','C','Db','Eb','F','Gb','Ab'],
    'F':  ['F','G','Ab','Bb','C','Db','Eb'],
    'C':  ['C','D','Eb','F','G','Ab','Bb'],
    'G':  ['G','A','Bb','C','D','Eb','F'],
    'D':  ['D','E','F','G','A','Bb','C'],
  };

  const MAJOR_QUALITY  = ['maj','min','min','maj','maj','min','dim'];
  const MAJOR_NUMERALS = ['I','ii','iii','IV','V','vi','vii°'];
  const MINOR_QUALITY  = ['min','dim','maj','min','min','maj','maj'];
  const MINOR_NUMERALS = ['i','ii°','III','iv','v','VI','VII'];
  const SUFFIX = { maj: '', min: 'm', dim: '°' };

  // raised 7th (leading tone) of each minor key, used to turn v into V
  const LEADING_TONE = {
    'A': 'G#', 'E': 'D#', 'B': 'A#', 'F#': 'E#', 'C#': 'B#', 'G#': 'G',
    'Eb': 'D', 'Bb': 'A', 'F': 'E', 'C': 'B', 'G': 'F#', 'D': 'C#',
  };

  // scale-degree indices kept when "common chords only" is on
  const MAJOR_COMMON = [0, 1, 3, 4, 5];   // I, ii, IV, V, vi
  const MINOR_COMMON = [0, 3, 4, 5, 6];   // i, iv, v/V, VI, VII

  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffle(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildDiatonicChords(mode, tonic){
    const scale = mode === 'major' ? MAJOR_KEYS[tonic] : MINOR_KEYS[tonic];
    const qualities = mode === 'major' ? MAJOR_QUALITY : MINOR_QUALITY;
    const numerals = mode === 'major' ? MAJOR_NUMERALS : MINOR_NUMERALS;
    return scale.map((note, i) => ({
      note,
      third: scale[(i + 2) % 7],
      fifth: scale[(i + 4) % 7],
      seventh: scale[(i + 6) % 7],
      quality: qualities[i],
      numeral: numerals[i],
      name: note + SUFFIX[qualities[i]],
    }));
  }

  // seventh-chord suffix implied by a diatonic triad + its diatonic 7th
  // (always the harmonically "correct" one: maj7, dominant 7, m7, or m7b5)
  function seventhSuffix(chord){
    const rootPc = SEMITONE[chord.note] % 12;
    const seventhPc = SEMITONE[chord.seventh] % 12;
    const interval = (seventhPc - rootPc + 12) % 12;
    if (chord.quality === 'dim') return interval === 9 ? 'dim7' : 'm7♭5';
    if (chord.quality === 'min') return 'm7';
    return interval === 11 ? 'maj7' : '7';
  }

  // What to call a chord: its triad name, or the seventh-chord name when it
  // carries a 7th. Each chord decides for itself — there's no global switch.
  function displayName(chord){
    if (!chord.seventh) return chord.name;
    return chord.note + seventhSuffix(chord);
  }

  // scale-degree label for a chord tone other than the root — used by
  // "Chord positions" and "CAGED triads", which label every other note by
  // degree instead of by note name
  function degreeLabel(chord, role){
    if (role === 'third') return chord.quality === 'min' ? '♭3' : '3';
    if (role === 'fifth') return '5';
    if (role === 'seventh'){
      const rootPc = SEMITONE[chord.note] % 12;
      const seventhPc = SEMITONE[chord.seventh] % 12;
      const interval = (seventhPc - rootPc + 12) % 12;
      return interval === 11 ? '7' : '♭7';
    }
    return '';
  }

  const SEMITONE = {
    C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, 'E#':5, F:5,
    'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11, 'B#':0, Cb:11,
  };

  const NOTE_NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  // every chord type this app knows how to name/find, in a fixed rank order
  // (used as a tiebreaker so simpler chords are preferred when several match)
  const CHORD_FORMULAS = [
    { aliases: ['', 'maj', 'major'],                 name: '',        intervals: [0,4,7],        essential: [0,4] },
    { aliases: ['m', 'min', '-', 'minor'],            name: 'm',       intervals: [0,3,7],        essential: [0,3] },
    { aliases: ['5'],                                 name: '5',       intervals: [0,7],          essential: [0,7] },
    { aliases: ['dim', 'o', 'diminished'],            name: 'dim',     intervals: [0,3,6],        essential: [0,3,6] },
    { aliases: ['aug', '+', 'augmented'],             name: 'aug',     intervals: [0,4,8],        essential: [0,4,8] },
    { aliases: ['sus2'],                              name: 'sus2',    intervals: [0,2,7],        essential: [0,2] },
    { aliases: ['sus4', 'sus'],                       name: 'sus4',    intervals: [0,5,7],        essential: [0,5] },
    { aliases: ['6', 'maj6'],                         name: '6',       intervals: [0,4,7,9],      essential: [0,4,9] },
    { aliases: ['m6', 'min6'],                        name: 'm6',      intervals: [0,3,7,9],      essential: [0,3,9] },
    { aliases: ['69', '6/9'],                         name: '6/9',     intervals: [0,4,7,9,2],    essential: [0,4,9,2] },
    { aliases: ['7', 'dom7'],                         name: '7',       intervals: [0,4,7,10],     essential: [0,4,10] },
    { aliases: ['maj7', 'ma7', 'major7'],             name: 'maj7',    intervals: [0,4,7,11],     essential: [0,4,11] },
    { aliases: ['m7', 'min7', '-7'],                  name: 'm7',      intervals: [0,3,7,10],     essential: [0,3,10] },
    { aliases: ['m7b5', 'min7b5', 'm7-5', 'ø', 'ø7', 'halfdim', 'halfdim7'],
                                                       name: 'm7♭5',    intervals: [0,3,6,10],     essential: [0,3,6,10] },
    { aliases: ['dim7', 'o7', 'diminished7'],         name: 'dim7',    intervals: [0,3,6,9],      essential: [0,3,6,9] },
    { aliases: ['mmaj7', 'minmaj7', 'm/maj7', 'm(maj7)'],
                                                       name: 'm(maj7)', intervals: [0,3,7,11],     essential: [0,3,11] },
    { aliases: ['9', 'dom9'],                         name: '9',       intervals: [0,4,7,10,2],   essential: [0,4,10,2] },
    { aliases: ['maj9', 'ma9'],                       name: 'maj9',    intervals: [0,4,7,11,2],   essential: [0,4,11,2] },
    { aliases: ['m9', 'min9'],                        name: 'm9',      intervals: [0,3,7,10,2],   essential: [0,3,10,2] },
    { aliases: ['add9'],                              name: 'add9',    intervals: [0,4,7,2],      essential: [0,4,2] },
    { aliases: ['madd9', 'minadd9'],                  name: 'm(add9)', intervals: [0,3,7,2],      essential: [0,3,2] },
    { aliases: ['7sus4', '7sus'],                     name: '7sus4',   intervals: [0,5,7,10],     essential: [0,5,10] },
    { aliases: ['7b9'],                                name: '7♭9',    intervals: [0,4,7,10,1],   essential: [0,4,10,1] },
    { aliases: ['7#9', '7+9'],                         name: '7♯9',    intervals: [0,4,7,10,3],   essential: [0,4,10,3] },
    { aliases: ['7#5', '7+5', 'aug7'],                 name: '7♯5',    intervals: [0,4,8,10],     essential: [0,4,8,10] },
    { aliases: ['7b5'],                                name: '7♭5',    intervals: [0,4,6,10],     essential: [0,4,6,10] },
    { aliases: ['11', 'dom11'],                        name: '11',     intervals: [0,4,7,10,2,5], essential: [0,10,5] },
    { aliases: ['m11', 'min11'],                       name: 'm11',    intervals: [0,3,7,10,2,5], essential: [0,3,10,5] },
    { aliases: ['13', 'dom13'],                        name: '13',     intervals: [0,4,7,10,2,9], essential: [0,4,10,9] },
  ].map((f, i) => ({ ...f, rank: i }));

  const CHORD_ALIAS_MAP = {};
  CHORD_FORMULAS.forEach(f => f.aliases.forEach(a => { CHORD_ALIAS_MAP[a] = f; }));

  function normalizeSuffix(s){
    // Case matters in exactly one place: a capital M before a number (or on its
    // own) is the "major" shorthand, so CM7 is a major 7th while Cm7 is a minor
    // one. Spell it out before folding the rest of the suffix to lower case.
    return s.trim()
      .replace(/^M(?=\d|$)/, 'maj')
      .toLowerCase().replace(/\s+/g, '')
      .replace(/♭/g, 'b').replace(/♯/g, '#').replace(/δ/g, 'maj');
  }

  // parse a typed chord name like "G#9" or "Dm7b5" into { rootPc, rootName, formula }
  function parseChordName(input){
    const m = (input || '').trim().match(/^([A-Ga-g])([#♯b♭]?)(.*)$/);
    if (!m) return null;
    let acc = m[2];
    if (acc === '♯') acc = '#';
    if (acc === '♭') acc = 'b';
    const rootName = m[1].toUpperCase() + acc;
    const rootPc = SEMITONE[rootName];
    if (rootPc === undefined) return null;
    const formula = CHORD_ALIAS_MAP[normalizeSuffix(m[3])];
    if (!formula) return null;
    return { rootPc, rootName, formula };
  }

  function identifyChords(pcs){
    const matches = [];
    pcs.forEach(rootPc => {
      const intervals = new Set(pcs.map(pc => (pc - rootPc + 12) % 12));
      CHORD_FORMULAS.forEach(formula => {
        const full = new Set(formula.intervals);
        const hasAllEssential = formula.essential.every(iv => intervals.has(iv));
        const noForeignTones = [...intervals].every(iv => full.has(iv));
        if (hasAllEssential && noForeignTones) matches.push({ rootPc, formula });
      });
    });
    matches.sort((a, b) => a.formula.rank - b.formula.rank);
    return matches;
  }

  // Roman numeral for a chord sitting some interval above a tonic — used when a
  // progression arrives as bare chord names with no key attached.
  const DEGREE_NUMERALS = {
    0: 'I', 1: '\u266dII', 2: 'II', 3: '\u266dIII', 4: 'III', 5: 'IV',
    6: '\u266fIV', 7: 'V', 8: '\u266dVI', 9: 'VI', 10: '\u266dVII', 11: 'VII',
  };
  function numeralFor(rootPc, tonicPc, quality){
    const numeral = DEGREE_NUMERALS[((rootPc - tonicPc) % 12 + 12) % 12] || '';
    if (quality === 'maj') return numeral;
    return numeral.toLowerCase() + (quality === 'dim' ? '\u00b0' : '');
  }

  // Build the chord object the rest of the app works with from a written name
  // like "A7" or "Dm7". The app's model is a triad plus an optional 7th, so
  // richer chords come through as the nearest triad-and-7th: a 9th keeps its
  // dominant 7th, a 6th or diminished 7th drops to its triad, and a power
  // chord (no 3rd at all) is read as major.
  function chordFromName(name, tonicPc){
    const parsed = parseChordName(name);
    if (!parsed) return null;
    const ivs = parsed.formula.intervals;
    const thirdIv = [3, 4].find(i => ivs.includes(i));
    const fifthIv = [6, 7, 8].find(i => ivs.includes(i));
    // only a real 7th counts — the app's model is "triad plus 7th", so a 6th
    // chord comes through as its plain triad rather than being mislabelled
    const seventhIv = [10, 11].find(i => ivs.includes(i));
    const quality = thirdIv === 3 ? (fifthIv === 6 ? 'dim' : 'min') : 'maj';
    const at = iv => NOTE_NAMES_SHARP[(parsed.rootPc + iv) % 12];
    return {
      note: parsed.rootName,
      third: at(thirdIv === undefined ? 4 : thirdIv),
      fifth: at(fifthIv === undefined ? 7 : fifthIv),
      seventh: seventhIv === undefined ? null : at(seventhIv),
      quality,
      name: parsed.rootName + SUFFIX[quality],
      numeral: numeralFor(parsed.rootPc, tonicPc === undefined ? parsed.rootPc : tonicPc, quality),
    };
  }

  GT.theory = {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_QUALITY, MAJOR_NUMERALS, MINOR_QUALITY, MINOR_NUMERALS,
    SUFFIX, LEADING_TONE, MAJOR_COMMON, MINOR_COMMON, SEMITONE, NOTE_NAMES_SHARP, CHORD_FORMULAS,
    pick, shuffle, buildDiatonicChords, seventhSuffix, displayName, degreeLabel,
    parseChordName, identifyChords, chordFromName, numeralFor,
  };
})();
