// Regression tests. Open tests.html to run them.
//
// The chord finder's results are a judgement call — scoring, ranking, which
// shapes are playable — so the guard here is a snapshot: whatever it returned
// when these were written must keep coming back. Tuning may add shapes, and
// that's fine; it must not quietly drop one.
(function(){
  'use strict';
  const GT = window.GT;
  const { parseChordName, identifyChords, chordFromName, seventhSuffix, NOTE_NAMES_SHARP } = GT.theory;
  const { STRING_TUNING, FRET_COUNT, seventhCells, cagedPlacements, CAGED_MAJOR } = GT.fretboard;
  const { findChordVoicings } = GT.chordFinder;
  const { voiceChord, midiFor } = GT.genres;

  const CHORDS = ["C", "A", "G", "E", "D", "Cm", "Am", "Gm", "Em", "Dm", "Ab", "Gb", "C#", "A9", "E9", "C7", "D7", "Cm7", "CM7"];

  // low E first, 'x' for a muted string, e.g. 'x-3-2-0-1-0' is an open C
  function grip(cells){
    const byString = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => byString.has(s) ? byString.get(s) : 'x').join('-');
  }

  const BASELINE = {
      "C": [
          "x-3-2-0-1-0",
          "x-3-2-0-1-3",
          "x-3-2-0-5-0",
          "x-3-2-0-5-3",
          "x-3-5-5-5-3",
          "x-3-5-0-5-0",
          "8-7-5-5-5-8",
          "8-7-5-0-5-0",
          "8-7-x-9-8-8",
          "8-7-10-x-8-8",
          "8-10-10-9-8-8",
          "x-x-10-9-x-12",
          "x-x-10-12-13-12",
          "x-15-14-12-13-12",
          "x-15-14-x-13-15",
          "15-15-14-x-x-15"
      ],
      "A": [
          "x-0-2-2-2-0",
          "5-4-2-2-2-5",
          "5-4-x-6-5-0",
          "5-4-x-6-5-5",
          "5-7-7-6-5-5",
          "5-0-7-6-5-0",
          "x-x-7-6-x-9",
          "x-x-7-9-10-9",
          "9-7-7-9-x-9",
          "x-12-11-9-10-9",
          "x-12-11-9-x-12",
          "x-12-11-x-10-12",
          "x-12-11-14-14-12",
          "12-12-11-14-14-x",
          "x-12-14-14-14-12",
          "12-12-14-14-14-x"
      ],
      "G": [
          "3-2-0-0-0-3",
          "3-2-0-0-3-3",
          "3-5-5-4-3-3",
          "3-5-0-0-0-3",
          "x-x-5-4-0-x",
          "x-x-5-7-8-7",
          "x-x-5-7-0-7",
          "x-10-9-7-8-7",
          "x-10-9-7-x-10",
          "x-10-9-x-8-10",
          "x-10-9-12-12-10",
          "10-10-9-12-12-x",
          "x-10-12-12-12-10",
          "10-10-12-12-12-x",
          "15-14-12-12-12-15",
          "15-14-12-12-15-15"
      ],
      "E": [
          "0-2-2-1-0-0",
          "0-2-2-1-0-4",
          "0-2-2-4-0-4",
          "x-x-2-4-5-4",
          "x-7-6-4-5-4",
          "0-7-6-4-0-0",
          "0-7-6-x-5-0",
          "0-7-6-x-5-7",
          "x-7-6-9-9-7",
          "x-7-9-9-9-7",
          "7-7-9-9-9-x",
          "12-11-9-9-9-12",
          "12-11-9-9-12-12",
          "12-11-x-13-12-12",
          "12-11-14-x-12-12",
          "12-14-14-13-12-12"
      ],
      "D": [
          "x-x-0-2-3-2",
          "x-5-4-2-3-2",
          "x-5-4-x-3-5",
          "x-5-4-7-7-5",
          "x-0-4-7-7-5",
          "x-5-7-7-7-5",
          "x-5-0-7-7-5",
          "10-9-7-7-7-10",
          "10-9-7-7-10-10",
          "10-9-x-11-10-10",
          "10-9-12-x-10-10",
          "10-12-12-11-10-10",
          "x-x-12-11-x-14",
          "x-x-12-14-15-14",
          "14-12-12-14-x-14",
          "14-x-x-14-15-14"
      ],
      "Cm": [
          "x-3-1-0-1-3",
          "x-3-1-0-4-3",
          "x-3-5-5-4-3",
          "x-3-5-0-4-3",
          "x-6-5-5-4-x",
          "8-6-5-5-8-8",
          "8-6-5-8-8-8",
          "8-10-10-8-8-8",
          "8-10-10-8-8-11",
          "x-x-10-12-13-11",
          "11-10-10-12-x-11",
          "x-x-13-12-13-11",
          "11-x-13-12-13-x",
          "x-15-13-12-13-x",
          "x-15-13-12-x-15",
          "x-15-13-x-13-15"
      ],
      "Am": [
          "x-0-2-2-1-0",
          "0-3-2-2-1-0",
          "5-0-2-5-5-0",
          "5-3-2-2-5-5",
          "5-3-x-5-5-5",
          "5-3-x-5-5-0",
          "5-7-7-5-5-5",
          "5-0-7-5-5-0",
          "x-x-7-9-10-8",
          "x-x-10-9-10-8",
          "x-12-10-9-10-x",
          "x-12-10-9-x-12",
          "x-12-10-x-10-12",
          "x-12-10-x-13-12",
          "x-12-14-14-13-12",
          "12-15-14-14-13-12"
      ],
      "Gm": [
          "3-1-0-0-3-3",
          "3-1-0-3-3-x",
          "3-5-5-3-3-3",
          "3-x-0-3-3-3",
          "x-x-5-7-8-6",
          "x-x-5-0-8-6",
          "x-x-8-7-8-6",
          "6-x-8-7-8-x",
          "x-10-8-7-8-x",
          "x-10-8-7-x-10",
          "x-10-8-x-8-10",
          "x-10-8-x-11-10",
          "x-10-12-12-11-10",
          "10-13-12-12-11-10",
          "15-13-12-12-15-15",
          "15-13-12-15-15-15"
      ],
      "Em": [
          "0-2-2-0-0-0",
          "0-2-2-0-0-3",
          "0-x-5-0-0-3",
          "0-x-5-4-0-3",
          "0-7-5-4-0-0",
          "0-7-5-4-5-0",
          "0-7-5-0-0-0",
          "0-7-5-0-0-7",
          "x-7-9-9-8-7",
          "7-10-9-9-8-7",
          "12-10-9-9-12-12",
          "12-10-9-12-12-12",
          "12-14-14-12-12-12",
          "12-14-14-12-12-15",
          "15-14-14-x-x-15"
      ],
      "Dm": [
          "x-x-0-2-3-1",
          "1-0-0-2-x-1",
          "x-5-3-2-3-x",
          "x-5-3-2-x-5",
          "x-5-3-x-3-5",
          "x-5-3-x-6-5",
          "x-5-7-7-6-5",
          "x-5-0-7-6-5",
          "x-8-7-7-6-x",
          "10-8-7-7-10-10",
          "10-8-7-10-10-10",
          "10-12-12-10-10-10",
          "10-12-12-10-10-13",
          "x-x-12-14-15-13",
          "13-12-12-14-x-13",
          "x-x-15-14-15-13"
      ],
      "Ab": [
          "4-3-1-1-1-4",
          "4-3-1-1-4-4",
          "4-3-x-5-4-4",
          "4-3-6-x-4-4",
          "4-6-6-5-4-4",
          "x-x-6-5-x-8",
          "x-x-6-8-9-8",
          "8-6-6-8-x-8",
          "x-11-10-8-9-8",
          "x-11-10-8-x-11",
          "x-11-10-x-9-11",
          "x-11-10-13-13-11",
          "11-11-10-13-13-x",
          "x-11-13-13-13-11",
          "11-11-13-13-13-x",
          "x-15-13-13-13-x"
      ],
      "Gb": [
          "2-1-x-3-2-2",
          "2-1-4-x-2-2",
          "2-4-4-3-2-2",
          "x-x-4-3-x-6",
          "x-x-4-6-7-6",
          "6-4-4-6-x-6",
          "x-9-8-6-7-6",
          "x-9-8-6-x-9",
          "x-9-8-x-7-9",
          "x-9-8-11-11-9",
          "9-9-8-11-11-x",
          "x-9-11-11-11-9",
          "9-9-11-11-11-x",
          "14-13-11-11-11-14",
          "14-13-11-11-14-14",
          "14-13-x-15-14-14"
      ],
      "C#": [
          "x-4-3-1-2-1",
          "x-4-3-1-x-4",
          "x-4-3-x-2-4",
          "x-4-3-6-6-4",
          "4-4-3-6-6-x",
          "x-4-6-6-6-4",
          "4-4-6-6-6-x",
          "9-8-6-6-6-9",
          "9-8-6-6-9-9",
          "9-8-x-10-9-9",
          "9-8-11-x-9-9",
          "9-11-11-10-9-9",
          "x-x-11-10-x-13",
          "x-x-11-13-14-13",
          "13-11-11-13-x-13",
          "x-x-15-13-14-13"
      ],
      "A9": [
          "5-4-2-0-0-0",
          "5-2-2-2-2-3",
          "5-4-5-0-0-3",
          "5-0-5-6-0-3",
          "5-4-5-0-0-0",
          "5-4-5-4-5-5",
          "5-0-5-6-0-0",
          "5-0-5-6-0-5",
          "x-x-7-6-8-7",
          "7-7-7-9-8-9",
          "x-12-9-12-10-9",
          "x-12-11-12-12-9",
          "x-12-11-12-12-12",
          "15-14-14-14-14-12",
          "12-14-14-14-14-15",
          "15-14-14-14-14-15"
      ],
      "E9": [
          "0-2-0-1-0-2",
          "0-2-0-1-3-2",
          "0-2-4-x-3-4",
          "0-x-4-4-3-4",
          "0-5-4-4-0-4",
          "0-7-0-4-7-4",
          "0-5-6-7-7-0",
          "0-5-6-x-7-7",
          "x-7-6-7-7-7",
          "10-9-9-9-9-7",
          "12-9-9-9-9-10",
          "12-9-9-11-9-10",
          "12-11-x-11-x-10",
          "12-11-12-11-12-12",
          "12-14-12-13-12-14",
          "x-x-14-13-15-14"
      ],
      "C7": [
          "x-3-2-3-1-0",
          "0-1-2-0-1-0",
          "x-3-2-3-5-0",
          "x-3-5-3-5-3",
          "x-3-5-3-5-0",
          "8-7-8-0-5-0",
          "8-7-5-5-5-6",
          "8-7-x-x-8-6",
          "8-7-8-x-8-8",
          "8-10-8-9-8-8",
          "8-10-8-9-11-8",
          "x-x-10-9-11-12",
          "x-x-10-12-11-12",
          "12-13-14-12-13-12",
          "x-15-14-15-13-x",
          "x-15-14-15-x-15"
      ],
      "D7": [
          "x-x-0-2-1-2",
          "x-5-0-5-3-2",
          "2-3-4-2-3-2",
          "x-5-4-5-3-x",
          "x-5-4-5-x-5",
          "x-5-7-5-7-5",
          "x-5-0-5-7-5",
          "10-9-7-7-7-8",
          "10-9-10-7-7-x",
          "10-9-x-x-10-8",
          "10-9-10-x-10-10",
          "10-12-10-11-10-10",
          "10-12-10-11-13-10",
          "x-x-12-11-13-14",
          "x-x-12-14-13-14",
          "x-15-x-14-15-14"
      ],
      "Cm7": [
          "x-3-1-3-1-3",
          "3-1-1-3-1-3",
          "x-3-5-3-4-3",
          "x-3-5-0-4-6",
          "6-6-5-5-4-6",
          "8-6-5-0-x-6",
          "8-6-5-5-x-6",
          "8-6-8-8-8-6",
          "8-6-8-8-8-8",
          "8-10-8-8-8-8",
          "8-10-8-8-11-8",
          "x-x-10-12-11-11",
          "11-13-13-12-13-11",
          "15-13-13-12-13-x",
          "x-15-13-15-13-15",
          "15-13-13-15-13-15"
      ],
      "CM7": [
          "0-2-2-0-1-0",
          "x-3-2-4-1-0",
          "x-3-2-0-0-0",
          "x-3-2-0-0-3",
          "x-3-5-0-0-0",
          "x-3-5-5-0-0",
          "8-7-5-0-0-0",
          "8-7-5-5-0-0",
          "8-7-9-9-8-7",
          "8-7-9-9-8-8",
          "8-10-9-9-8-8",
          "x-x-10-9-12-12",
          "x-x-10-12-12-12",
          "x-15-14-12-12-12",
          "x-15-14-12-12-15",
          "15-14-14-x-13-15"
      ]
  };

  // ---- 1. every shape these chords produced before is still produced ----
  function testBaselineShapesSurvive(t){
    CHORDS.forEach(name => {
      const parsed = parseChordName(name);
      t.ok(!!parsed, `${name} parses`);
      if (!parsed) return;
      const current = findChordVoicings(parsed.rootPc, parsed.formula).map(v => grip(v.cells));
      const missing = BASELINE[name].filter(g => !current.includes(g));
      t.equal(missing.join(' '), '', `${name}: keeps all ${BASELINE[name].length} known shapes`
        + (missing.length ? ` (lost ${missing.length})` : ''));
    });
  }

  // ---- 2. what the chord finder draws, the reverse finder can name ----
  function testFinderOutputIsIdentifiable(t){
    CHORDS.forEach(name => {
      const parsed = parseChordName(name);
      if (!parsed) return;
      const voicings = findChordVoicings(parsed.rootPc, parsed.formula);
      const unnamed = [];
      voicings.forEach(v => {
        const pcs = [...new Set(v.cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12))];
        const matched = identifyChords(pcs).some(m =>
          m.rootPc === parsed.rootPc && m.formula.name === parsed.formula.name);
        if (!matched) unnamed.push(grip(v.cells));
      });
      t.equal(unnamed.join(' '), '', `${name}: all ${voicings.length} shapes read back as ${name}`
        + (unnamed.length ? ` (${unnamed.length} did not)` : ''));
    });
  }

  // ---- 3. the everyday grips a method book teaches come back, and first ----
  // (low E → high e, as above). The baseline keeps old shapes from vanishing;
  // this keeps the textbook ones from being buried under oddities.
  const CANON = {
    'C': 'x-3-2-0-1-0', 'G': '3-2-0-0-0-3', 'D': 'x-x-0-2-3-2', 'E': '0-2-2-1-0-0', 'A': 'x-0-2-2-2-0',
    'F': '1-3-3-2-1-1', 'Bb': 'x-1-3-3-3-1', 'B': 'x-2-4-4-4-2', 'Bm': 'x-2-4-4-3-2', 'F#m': '2-4-4-2-2-2',
    'Am': 'x-0-2-2-1-0', 'Em': '0-2-2-0-0-0', 'Dm': 'x-x-0-2-3-1',
    'A7': 'x-0-2-0-2-0', 'B7': 'x-2-1-2-0-2', 'C7': 'x-3-2-3-1-0', 'D7': 'x-x-0-2-1-2', 'E7': '0-2-0-1-0-0', 'G7': '3-2-0-0-0-1',
    'Am7': 'x-0-2-0-1-0', 'Dm7': 'x-x-0-2-1-1', 'Em7': '0-2-0-0-0-0', 'Amaj7': 'x-0-2-1-2-0', 'Cmaj7': 'x-3-2-0-0-0',
    'Dsus2': 'x-x-0-2-3-0', 'G6': '3-2-0-0-0-0', 'Am6': 'x-0-2-2-1-2', 'Caug': 'x-3-2-1-1-0',
    'E5': '0-2-2-x-x-x', 'A5': 'x-0-2-2-x-x', 'D5': 'x-x-0-2-3-x', 'G5': '3-5-5-x-x-x',
  };
  // present, though another everyday grip may reasonably read first
  const CANON_PRESENT = {
    'Fmaj7': 'x-x-3-2-1-0', 'Dsus4': 'x-x-0-2-3-3', 'Asus2': 'x-0-2-2-0-0', 'Esus4': '0-2-2-2-0-0',
    'Cadd9': 'x-3-2-0-3-0', 'A9': 'x-0-2-4-2-3', 'E9': 'x-7-6-7-7-7', 'C9': 'x-3-2-3-3-3', 'D9': 'x-5-4-5-5-5',
    'Bdim': 'x-2-3-4-3-x', 'Bm7b5': 'x-2-3-2-3-x', 'Bdim7': 'x-2-3-1-3-x', 'Eaug': '0-3-2-1-1-0',
    'F#m7': '2-4-2-2-2-2', 'Gm7': '3-5-3-3-3-3', 'Bbmaj7': 'x-1-3-2-3-1', 'C#m7': 'x-4-6-4-5-4', 'Eb7': 'x-6-8-6-8-6',
  };
  function testCanonicalGrips(t){
    const shown = name => {
      const p = parseChordName(name);
      return p ? findChordVoicings(p.rootPc, p.formula, { bassPc: p.bassPc }).map(v => grip(v.cells)) : [];
    };
    // slash chords: the named bass note has to be the lowest string played
    // (D/F# with the A string muted is the open-A version minus an open
    // string, so the list carries the fuller one)
    const SLASH = { 'D/F#': '2-0-0-2-3-2', 'C/E': '0-3-2-0-1-0', 'G/B': 'x-2-0-0-0-3', 'Am/G': '3-0-2-2-1-0', 'C/G': '3-3-2-0-1-0' };
    const SLASH_FIRST = ['C/E', 'G/B'];    // the others have an equally everyday open-string twin
    Object.entries(SLASH).forEach(([name, canon]) => {
      const grips = shown(name);
      if (SLASH_FIRST.includes(name)) t.equal(grips[0], canon, `${name}: ${canon} reads first`);
      else t.ok(grips.includes(canon), `${name}: ${canon} is shown`);
      const p = parseChordName(name);
      const wrongBass = grips.filter(g => {
        const low = g.split('-').find(f => f !== 'x');
        const lowIdx = g.split('-').findIndex(f => f !== 'x');
        return (STRING_TUNING[5 - lowIdx] + Number(low)) % 12 !== p.bassPc;
      });
      t.equal(wrongBass.join(' '), '', `${name}: every shape has ${p.bassName} underneath`);
    });
    Object.entries(CANON).forEach(([name, canon]) => {
      const grips = shown(name);
      t.equal(grips[0], canon, `${name}: ${canon} reads first`);
    });
    Object.entries(CANON_PRESENT).forEach(([name, canon]) => {
      const grips = shown(name);
      t.ok(grips.includes(canon), `${name}: ${canon} is shown` + (grips.includes(canon) ? '' : ` (got ${grips.slice(0, 4).join(' ')} …)`));
    });
  }

  // ---- 4. naming: what the app writes, it can read back ----
  function testTheory(t){
    const parses = (name, formula, root) => {
      const p = parseChordName(name);
      t.equal(p && p.formula.name + '@' + p.rootName, formula + '@' + root, `"${name}" parses as ${root} ${formula || 'major'}`);
    };
    parses('CM7', 'maj7', 'C');
    parses('Cm7', 'm7', 'C');
    parses('CmM7', 'm(maj7)', 'C');
    parses('B°', 'dim', 'B');
    parses('B°7', 'dim7', 'B');
    parses('Bø', 'm7♭5', 'B');
    parses('F#dim7', 'dim7', 'F#');
    parses('Bbmaj9', 'maj9', 'Bb');
    parses('e7b9', '7♭9', 'E');
    parses('Cadd9', 'add9', 'C');
    parses('A5', '5', 'A');
    // slash chords: the same chord with a named note underneath
    const slash = parseChordName('D/F#');
    t.equal(slash && `${slash.rootName}${slash.formula.name}/${slash.bassName}`, 'D/F#', '"D/F#" parses as D over F#');
    t.equal(slash && slash.bassPc, 6, '"D/F#" puts F# in the bass');
    t.equal(parseChordName('Am7/G').bassName, 'G', '"Am7/G" parses');
    t.equal(parseChordName('C/H'), null, '"C/H" is rejected');
    t.equal(parseChordName('H7'), null, '"H7" is rejected');
    t.equal(parseChordName('Cxyz'), null, '"Cxyz" is rejected');

    const am6 = chordFromName('Am6');
    t.equal(am6 && am6.seventh, null, 'Am6 comes through as a triad, not an m7');
    const cm7 = chordFromName('Cm7');
    t.equal(cm7 && cm7.seventh, 'A#', 'Cm7 keeps its flat 7th');
    // the numeral a loaded chord gets depends on the mode of its key
    t.equal(chordFromName('F', 9, 'minor').numeral, 'VI', 'F in A minor is VI');
    t.equal(chordFromName('G', 9, 'minor').numeral, 'VII', 'G in A minor is VII');
    t.equal(chordFromName('F', 9, 'major').numeral, '♭VI', 'F in A major is ♭VI');
    t.equal(chordFromName('E7', 9, 'minor').numeral, 'V', 'E7 in A minor is V');
    t.equal(chordFromName('G#dim', 9, 'minor').numeral, '♯vii°', 'G#dim in A minor is ♯vii°');
    t.equal(seventhSuffix({ note: 'B', quality: 'dim', seventh: 'G#' }), 'dim7', 'B + dim + G# is a dim7');
    t.equal(seventhSuffix({ note: 'B', quality: 'dim', seventh: 'A' }), 'm7♭5', 'B + dim + A is an m7♭5');

    const names = pcs => identifyChords(pcs).map(m => NOTE_NAMES_SHARP[m.rootPc] + m.formula.name);
    t.equal(names([0, 4, 7])[0], 'C', 'C E G reads as C first');
    t.ok(names([0, 3, 7, 10]).includes('Cm7'), 'C D# G A# includes Cm7');
    t.ok(names([0, 4, 7, 9]).includes('Am7') && names([0, 4, 7, 9]).includes('C6'), 'C E G A reads as both C6 and Am7');

    // the open C7 in Progression: the dropped root would fall below the
    // nut, so the 5th is raised instead
    const cShape = cagedPlacements(0, CAGED_MAJOR).find(p => p.name === 'C' && p.fretMin === 0);
    t.equal(grip(seventhCells(cShape, 0, 10)), 'x-3-2-3-1-0', 'open C-shape C7 raises the 5th to the flat 7th');
    t.equal(grip(seventhCells(cShape, 0, 11)), 'x-3-2-0-0-0', 'open C-shape Cmaj7 flattens the doubled root');
  }

  // ---- 5. the genre library and the presets are well-formed ----
  function testData(t){
    GT.genreData.forEach(g => {
      const tag = `[${g.name}]`;
      const issues = [];
      g.progressions.forEach(p => {
        if (!p.key) issues.push(`"${p.name}" has no key`);
        p.chords.forEach(c => { if (!parseChordName(c)) issues.push(`"${p.name}": "${c}" doesn't parse`); });
        if (/twelve|12|quick.change/i.test(p.name) && p.chords.length !== 12)
          issues.push(`"${p.name}" is a twelve-bar form with ${p.chords.length} bars`);
        const m = p.name.match(/in ([A-G][b#]?)/);
        if (m && m[1] !== p.key) issues.push(`"${p.name}" names ${m[1]} but its key is ${p.key}`);
      });
      g.rhythms.forEach(r => {
        if (![6, 8, 12, 16].includes(r.grid)) issues.push(`rhythm "${r.name}" has grid ${r.grid}`);
        if (r.grid === 6 && r.beats !== 3) issues.push(`rhythm "${r.name}" is six to the bar but doesn't say it's in 3`);
        r.hits.forEach(h => { if (h.at < 0 || h.at >= r.grid) issues.push(`rhythm "${r.name}" hits slot ${h.at} of ${r.grid}`); });
        if (r.drums) Object.entries(r.drums).forEach(([k, arr]) =>
          (arr || []).forEach(at => { if (at >= r.grid) issues.push(`rhythm "${r.name}" ${k} at ${at} of ${r.grid}`); }));
        g.progressions.forEach(p => p.chords.forEach(c => {
          const v = voiceChord(c, r.voicing);
          if (!v) issues.push(`"${c}" can't be voiced as ${r.voicing} for "${r.name}"`);
        }));
      });
      g.leads.forEach(l => {
        const total = l.bars * l.grid;
        const pcs = new Set();
        l.notes.forEach(n => {
          if (n.at + (n.dur || 1) > total) issues.push(`lead "${l.name}" runs past its ${l.bars} bars`);
          if (n.f < 0 || n.f > FRET_COUNT) issues.push(`lead "${l.name}" uses fret ${n.f}`);
          pcs.add(midiFor(n.s, n.f) % 12);
        });
        if (/pentatonic/i.test(l.name) && pcs.size > 5) issues.push(`lead "${l.name}" says pentatonic but uses ${pcs.size} notes`);
      });
      t.equal(issues.join('; '), '', `${tag} data is well-formed`);
    });

    GT.progressionPresets.forEach(p => p.variants.forEach(v => {
      const label = p.name + (v.name ? ' / ' + v.name : '');
      const bars = v.chords.reduce((a, c) => a + c.bars, 0);
      const badDeg = v.chords.filter(c => c.deg < 0 || c.deg > 7);
      // degree 7 (the harmonic-minor V) only exists in a minor key
      const usesMinorV = v.chords.some(c => c.deg === 7) && (v.mode || p.mode) !== 'minor';
      t.ok(!badDeg.length && !usesMinorV && bars > 0 && bars <= 16, `preset ${label}: ${bars} bars, degrees in range`);
      if (/blues/i.test(p.name) && !/8-bar/.test(v.name)) t.equal(bars, 12, `preset ${label} is twelve bars`);
    }));
  }

  // ---- a very small test runner ----
  function run(){
    const results = [];
    const t = {
      ok(cond, what){ results.push({ pass: !!cond, what }); },
      equal(actual, expected, what){
        const pass = actual === expected;
        results.push({ pass, what, detail: pass ? '' : `got "${actual}", expected "${expected}"` });
      },
    };
    const suites = [
      ['Chord finder keeps its known shapes', testBaselineShapesSurvive],
      ['Chord finder output is identifiable in reverse', testFinderOutputIsIdentifiable],
      ['Chord finder shows the everyday grips', testCanonicalGrips],
      ['Theory: naming and identification', testTheory],
      ['Genre library and presets are well-formed', testData],
    ];
    const out = [];
    suites.forEach(([title, fn]) => {
      const from = results.length;
      fn(t);
      out.push({ title, cases: results.slice(from) });
    });
    const failed = results.filter(r => !r.pass);
    window.TEST_RESULTS = {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      failures: failed.map(f => `${f.what}${f.detail ? ' — ' + f.detail : ''}`),
    };
    render(out, results.length - failed.length, failed.length);
  }

  function render(suites, passed, failed){
    const el = document.getElementById('results');
    if (!el) return;
    const summary = failed
      ? `<p class="summary bad">${failed} failed, ${passed} passed</p>`
      : `<p class="summary good">All ${passed} checks passed</p>`;
    el.innerHTML = summary + suites.map(s => `
      <section>
        <h2>${s.title}</h2>
        <ul>${s.cases.map(c => `
          <li class="${c.pass ? 'pass' : 'fail'}">
            <span class="mark">${c.pass ? '\u2713' : '\u2717'}</span>${c.what}
            ${c.detail ? `<br><small>${c.detail}</small>` : ''}
          </li>`).join('')}</ul>
      </section>`).join('');
  }

  run();
})();
