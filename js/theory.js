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
  // carries a 7th — or the name it was given, when it carries colour the
  // triad-and-7th model can't spell (a 7♯9, a 9th, an add9, a sus, a 6th).
  // Each chord decides for itself — there's no global switch.
  function displayName(chord){
    if (chord.suffix != null) return chord.note + chord.suffix;
    if (!chord.seventh) return chord.name;
    return chord.note + seventhSuffix(chord);
  }

  // scale-degree label for a chord tone other than the root — used by
  // Progression and Chords, which label every other note by
  // degree instead of by note name
  function degreeLabel(chord, role){
    if (role === 'third') return chord.sus ? String(chord.sus) : chord.quality === 'min' ? '♭3' : '3';
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
  // the same twelve spelled the other way, for a note a flat numeral names —
  // the ♭VII of C is Bb, not A#
  const NOTE_NAMES_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  // Every chord type this app knows how to name/find, in a fixed rank order
  // (used as a tiebreaker so simpler chords are preferred when several match).
  // `intervals` is the whole chord; `essential` is what a shape has to sound
  // to still deserve the name — the plain 5th is nearly always optional, the
  // way players drop it. `anyOf`, where present, asks for at least one of the
  // listed tones on top of that: a rule for the one chord whose 3rd is
  // optional but whose bare skeleton isn't enough on its own.
  const CHORD_FORMULAS = [
    { aliases: ['', 'maj', 'major'],                 name: '',        intervals: [0,4,7],        essential: [0,4] },
    { aliases: ['m', 'min', '-', 'minor'],            name: 'm',       intervals: [0,3,7],        essential: [0,3] },
    { aliases: ['5'],                                 name: '5',       intervals: [0,7],          essential: [0,7] },
    { aliases: ['dim', 'o', 'diminished'],            name: 'dim',     intervals: [0,3,6],        essential: [0,3,6] },
    { aliases: ['aug', '+', 'augmented'],             name: 'aug',     intervals: [0,4,8],        essential: [0,4,8] },
    // A triad can lose its 5th and still be a triad — root and 3rd say major
    // or minor on their own. A sus chord can't: the sus note is heard against
    // the 5th, and root plus 4th alone is a bare fourth that reads as a power
    // chord on the note above (D and G is G5 before it is Dsus4, which is what
    // this app's own reverse finder calls it). So the 5th stays essential here.
    { aliases: ['sus2'],                              name: 'sus2',    intervals: [0,2,7],        essential: [0,2,7] },
    { aliases: ['sus4', 'sus'],                       name: 'sus4',    intervals: [0,5,7],        essential: [0,5,7] },
    { aliases: ['6', 'maj6'],                         name: '6',       intervals: [0,4,7,9],      essential: [0,4,9] },
    { aliases: ['m6', 'min6'],                        name: 'm6',      intervals: [0,3,7,9],      essential: [0,3,9] },
    // The 6/9 is the one chord guitarists name without its 3rd as a matter of
    // course: x-x-2-2-3-3 is "G6/9" on every chord chart and in every method
    // book, third or no third, and the top-four-string shape it comes from is
    // the everyday way to play the chord. So the 3rd is optional here — but a
    // bare root, 6th and 9th (A, F#, B) isn't a 6/9 yet, so one of the 3rd
    // and the 5th has to be there to fill it out.
    { aliases: ['69', '6/9', '6add9', 'add6/9'],       name: '6/9',     intervals: [0,4,7,9,2],    essential: [0,9,2], anyOf: [4,7] },
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
    // add2 and add9 are the same chord on a chart — the 2nd sits an octave up
    // in nearly every guitar shape anyway
    { aliases: ['add9', 'add2'],                      name: 'add9',    intervals: [0,4,7,2],      essential: [0,4,2] },
    { aliases: ['madd9', 'minadd9', 'madd2'],         name: 'm(add9)', intervals: [0,3,7,2],      essential: [0,3,2] },
    { aliases: ['7sus4', '7sus'],                     name: '7sus4',   intervals: [0,5,7,10],     essential: [0,5,10] },
    // a 7sus4 with the 9th on top — what a chart writes for the shape an 11
    // chord is nearly always played as, once the 3rd is left out
    { aliases: ['9sus4', '9sus'],                     name: '9sus4',   intervals: [0,5,7,10,2],   essential: [0,5,10,2] },
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
      .replace(/^mM(?=\d)/, 'mmaj')
      .replace(/^M(?=\d|$)/, 'maj')
      .toLowerCase().replace(/\s+/g, '')
      .replace(/[()]/g, '')        // C7(#9), Cm7(b5), C(add9): the brackets are punctuation
      .replace(/♭/g, 'b').replace(/♯/g, '#').replace(/δ/g, 'maj')
      .replace(/°/g, 'dim');       // the app writes diminished chords this way itself
  }

  function parseNote(letter, acc){
    if (acc === '♯') acc = '#';
    if (acc === '♭') acc = 'b';
    const name = letter.toUpperCase() + acc;
    return SEMITONE[name] === undefined ? null : { name, pc: SEMITONE[name] };
  }

  // Parse a typed chord name like "G#9" or "Dm7b5" into { rootPc, rootName,
  // formula }. A slash chord ("D/F#", "C/E") adds bassPc and bassName: the
  // same chord, with that note underneath.
  function parseChordName(input){
    const m = (input || '').trim().match(/^([A-Ga-g])([#♯b♭]?)(.*)$/);
    if (!m) return null;
    const root = parseNote(m[1], m[2]);
    if (!root) return null;
    const tail = m[3];
    // A slash usually separates the chord from the note under it — but not
    // always: "6/9" and "m/maj7" are suffixes with a slash inside them. Give
    // the whole tail its chance to name a chord before reading a trailing
    // "/G" as a bass note, or those two spellings can never be parsed at all.
    const whole = CHORD_ALIAS_MAP[normalizeSuffix(tail)];
    if (whole) return { rootPc: root.pc, rootName: root.name, formula: whole };

    const slash = tail.match(/^(.*)\/([A-Ga-g])([#♯b♭]?)$/);
    if (!slash) return null;
    const formula = CHORD_ALIAS_MAP[normalizeSuffix(slash[1])];
    if (!formula) return null;
    const bass = parseNote(slash[2], slash[3] || '');
    if (!bass) return null;
    return { rootPc: root.pc, rootName: root.name, formula,
             bassPc: bass.pc, bassName: bass.name };
  }

  // Name a set of notes. Every note is tried as the root; a match is a
  // formula whose essential tones are all there and which accounts for every
  // note played. Then the roots that *aren't* there: an extended chord is
  // routinely played without its root, which the bass has — x-x-5-6-7-7 is
  // G C♯ F♯ B, the ♭7, 3, 13 and 9 of A, and any jazz or funk player calls
  // it A13. Such a match is flagged `rootless`, and listed after the chords
  // that do contain their root, since those are the plainer reading. Only
  // chords of five tones or more are named that way, and only when the 9th
  // is sounding — that's what a rootless voicing is, the 9th standing in
  // for the root. A rootless 7th would be just a triad, and would name
  // every Em a Cmaj7; and C E G D is Cadd9, not an Am11 with two notes gone.
  function identifyChords(pcs){
    const matches = [];
    const fits = (rootPc, formula, rootless) => {
      const intervals = new Set(pcs.map(pc => (pc - rootPc + 12) % 12));
      const full = new Set(formula.intervals);
      const essential = rootless ? formula.essential.filter(iv => iv !== 0) : formula.essential;
      const hasAllEssential = essential.every(iv => intervals.has(iv));
      const hasOneOf = !formula.anyOf || formula.anyOf.some(iv => intervals.has(iv));
      const noForeignTones = [...intervals].every(iv => full.has(iv));
      // the 9th, flat or sharp — but not a minor 3rd wearing a ♯9's clothes
      const third = [3, 4].find(iv => full.has(iv));
      const hasNinth = !rootless || [1, 2, 3].some(iv => iv !== third && full.has(iv) && intervals.has(iv));
      return hasAllEssential && hasOneOf && noForeignTones && hasNinth;
    };
    pcs.forEach(rootPc => {
      CHORD_FORMULAS.forEach(formula => {
        if (fits(rootPc, formula, false)) matches.push({ rootPc, formula, rootless: false });
      });
    });
    matches.sort((a, b) => a.formula.rank - b.formula.rank);
    const rootless = [];
    if (pcs.length >= 4){
      for (let rootPc = 0; rootPc < 12; rootPc++){
        if (pcs.includes(rootPc)) continue;
        CHORD_FORMULAS.forEach(formula => {
          if (formula.intervals.length >= 5 && fits(rootPc, formula, true)) rootless.push({ rootPc, formula, rootless: true });
        });
      }
    }
    rootless.sort((a, b) => a.formula.rank - b.formula.rank);
    return matches.concat(rootless);
  }

  // Roman numeral for a chord sitting some interval above a tonic — used when a
  // progression arrives as bare chord names. Which notes are "in the key" and
  // so get a plain numeral depends on the mode: in A minor, F and G are VI and
  // VII; in A major they'd be \u266dVI and \u266dVII.
  const DEGREE_NUMERALS = {
    major: {
      0: 'I', 1: '\u266dII', 2: 'II', 3: '\u266dIII', 4: 'III', 5: 'IV',
      6: '\u266fIV', 7: 'V', 8: '\u266dVI', 9: 'VI', 10: '\u266dVII', 11: 'VII',
    },
    minor: {
      0: 'I', 1: '\u266dII', 2: 'II', 3: 'III', 4: '\u266fIII', 5: 'IV',
      6: '\u266fIV', 7: 'V', 8: 'VI', 9: '\u266fVI', 10: 'VII', 11: '\u266fVII',
    },
  };
  function numeralFor(rootPc, tonicPc, quality, mode){
    const table = DEGREE_NUMERALS[mode === 'minor' ? 'minor' : 'major'];
    const numeral = table[((rootPc - tonicPc) % 12 + 12) % 12] || '';
    if (quality === 'maj') return numeral;
    return numeral.toLowerCase() + (quality === 'dim' ? '\u00b0' : '');
  }

  // Build the chord object the rest of the app works with from a written name
  // like "A7" or "Dm7". The app's model is a triad plus an optional 7th, and
  // on top of that the colour a name carries beyond them:
  //   ext  — the extra tones as semitones above the root (2 the 9th, 3 the
  //          ♯9, 9 the 6th or 13th, 5 the 11th), which the comp voices on
  //          top and the parts count as chord tones
  //   sus  — 4 or 2 when the chord has no 3rd but a sus note in its place;
  //          `third` then holds the sus note, so every place that voices or
  //          labels the "3rd" voices the 4th (or 2nd) instead
  //   suffix — the name as written ("7♯9", "sus4", "add9"), kept when the
  //          model can't spell the chord from its triad and 7th alone
  // A 6th chord keeps its triad and carries the 6th as colour; a power chord
  // (no 3rd at all) is read as major.
  const PLAIN_SUFFIXES = new Set(['', 'm', 'dim', '7', 'maj7', 'm7', 'm7♭5', 'dim7']);
  function chordFromName(name, tonicPc, mode){
    const parsed = parseChordName(name);
    if (!parsed) return null;
    const ivs = parsed.formula.intervals;
    // the major 3rd first: a 7♯9 has both, and its 3 is the ♯9, not the 3rd
    const thirdIv = ivs.includes(4) ? 4 : ivs.includes(3) ? 3 : undefined;
    const fifthIv = [6, 7, 8].find(i => ivs.includes(i));
    // only a real 7th counts — a 6th chord comes through as its triad with
    // the 6th as colour rather than being mislabelled
    const seventhIv = [10, 11].find(i => ivs.includes(i));
    const susIv = thirdIv === undefined ? [5, 2].find(i => ivs.includes(i)) : undefined;
    const ext = ivs.filter(i => i !== 0 && i !== thirdIv && i !== fifthIv && i !== seventhIv && i !== susIv);
    const quality = thirdIv === 3 ? (fifthIv === 6 ? 'dim' : 'min') : 'maj';
    const at = iv => NOTE_NAMES_SHARP[(parsed.rootPc + iv) % 12];
    const chord = {
      note: parsed.rootName,
      third: at(thirdIv !== undefined ? thirdIv : susIv !== undefined ? susIv : 4),
      fifth: at(fifthIv === undefined ? 7 : fifthIv),
      seventh: seventhIv === undefined ? null : at(seventhIv),
      quality,
      name: parsed.rootName + SUFFIX[quality],
      numeral: numeralFor(parsed.rootPc, tonicPc === undefined ? parsed.rootPc : tonicPc, quality, mode),
    };
    if (ext.length) chord.ext = ext;
    if (susIv !== undefined) chord.sus = susIv === 5 ? 4 : 2;
    if (!PLAIN_SUFFIXES.has(parsed.formula.name)) chord.suffix = parsed.formula.name;
    return chord;
  }
  // the pitch classes a chord sounds: root, 3rd (or sus note), 5th, 7th and
  // whatever colour it carries
  function chordPcs(chord){
    const root = SEMITONE[chord.note] % 12;
    const pcs = [chord.note, chord.third, chord.fifth, chord.seventh].filter(Boolean).map(n => SEMITONE[n] % 12);
    (chord.ext || []).forEach(iv => pcs.push((root + iv) % 12));
    return [...new Set(pcs)];
  }

  GT.theory = {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_QUALITY, MAJOR_NUMERALS, MINOR_QUALITY, MINOR_NUMERALS,
    SUFFIX, LEADING_TONE, MAJOR_COMMON, MINOR_COMMON, SEMITONE, NOTE_NAMES_SHARP, NOTE_NAMES_FLAT, CHORD_FORMULAS,
    pick, shuffle, buildDiatonicChords, seventhSuffix, displayName, degreeLabel,
    parseChordName, identifyChords, chordFromName, chordPcs, numeralFor,
  };
})();
