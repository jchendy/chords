// Regression tests. Open tests.html to run them.
//
// The chord finder's results are a judgement call — scoring, ranking, which
// shapes are playable — so the guard here is a snapshot: whatever it returned
// when these were written must keep coming back. Tuning may add shapes, and
// that's fine; it must not quietly drop one.
(function(){
  'use strict';
  const GT = window.GT;
  const { parseChordName, identifyChords, chordFromName, seventhSuffix, NOTE_NAMES_SHARP,
          degreeLabel, SEMITONE } = GT.theory;
  const { STRING_TUNING, STRING_MIDI, FRET_COUNT, seventhCells, cagedPlacements, CAGED_MAJOR,
          cagedTriadBoard, scaleBoxPlacements, pentaBoxPlacements,
          cagedArpeggioBoxes, stringSetTriads, CAGED_MINOR } = GT.fretboard;
  const { findChordVoicings } = GT.chordFinder;
  const { voiceChord, midiFor } = GT.genres;

  const CHORDS = ["C", "A", "G", "E", "D", "Cm", "Am", "Gm", "Em", "Dm", "Ab", "Gb", "C#", "A9", "E9", "C7", "D7", "Cm7", "CM7"];

  // low E first, 'x' for a muted string, e.g. 'x-3-2-0-1-0' is an open C
  function grip(cells){
    const byString = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => byString.has(s) ? byString.get(s) : 'x').join('-');
  }

  // One entry has been changed by hand since the snapshot was taken: Cm7's
  // 8-6-8-8-8-6 became 8-x-8-8-8-6, the same hand with the 5th string muted
  // instead of barred, when the finder learned to show one of two shapes
  // that are one hand and to prefer the one that's a recognised grip.
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
          "8-x-8-8-8-6",
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
    'Dsus2': 'x-x-0-2-3-0', 'Dsus4': 'x-x-0-2-3-3', 'G6': '3-2-0-0-0-0', 'Am6': 'x-0-2-2-1-2', 'Caug': 'x-3-2-1-1-0',
    'E5': '0-2-2-x-x-x', 'A5': 'x-0-2-2-x-x', 'D5': 'x-x-0-2-3-x', 'G5': '3-5-5-x-x-x',
  };
  // present, though another everyday grip may reasonably read first
  const CANON_PRESENT = {
    'Fmaj7': 'x-x-3-2-1-0', 'Asus2': 'x-0-2-2-0-0', 'Esus4': '0-2-2-2-0-0',
    'Cadd9': 'x-3-2-0-3-0', 'A9': 'x-0-2-4-2-3', 'E9': 'x-7-6-7-7-7', 'C9': 'x-3-2-3-3-3', 'D9': 'x-5-4-5-5-5',
    'Bdim': 'x-2-3-4-3-x', 'Bm7b5': 'x-2-3-2-3-x', 'Bdim7': 'x-2-3-1-3-x', 'Eaug': '0-3-2-1-1-0',
    'F#m7': '2-4-2-2-2-2', 'Gm7': '3-5-3-3-3-3', 'Bbmaj7': 'x-1-3-2-3-1', 'C#m7': 'x-4-6-4-5-4', 'Eb7': 'x-6-8-6-8-6',
    // the 6/9 shapes every chart shows, third or no third; the Hendrix
    // chord, which is x-3-2-3-4-x and not x-3-2-3-4-0; the jazz grips; and
    // the rootless 13th (x-x-5-6-7-7 has no A in it — the bass has that)
    'A6/9': 'x-x-4-4-5-5', 'G6/9': 'x-x-2-2-3-3', 'C6/9': 'x-3-2-2-3-3', 'F6/9': 'x-x-3-2-3-3',
    'C7#9': 'x-3-2-3-4-x', 'Cmaj7': 'x-3-5-4-5-x', 'G7': '3-x-3-4-3-x',
    'A13': 'x-x-5-6-7-7', 'D13': 'x-5-x-5-7-7',
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

  // ---- 3b. every shape says what kind of grip it is, and the common ones
  // read first ----
  // The finder sorts its shapes into the common ways to play a chord and the
  // rest, and each carries the family it belongs to and the styles it's at
  // home in. What "common" means depends on the chord: the barre for a
  // triad, the root-6 and root-5 grips for a seventh, the top-string shape
  // for anything extended. These are the calls a method book would make.
  const KINDS = [
    // chord, grip, family, common?
    ['C',     'x-3-2-0-1-0', 'open',  true],
    ['G7',    '3-2-0-0-0-1', 'open',  true],
    ['F',     '1-3-3-2-1-1', 'barre', true],
    ['Bm',    'x-2-4-4-3-2', 'barre', true],
    ['E5',    '0-2-2-x-x-x', 'power', true],
    ['Cmaj7', 'x-3-5-4-5-x', 'grip',  true],
    ['G7',    '3-x-3-4-3-x', 'grip',  true],
    ['E9',    'x-7-6-7-7-7', 'grip',  true],
    ['D13',   'x-5-x-5-7-7', 'grip',  true],
    ['A6/9',  'x-x-4-4-5-5', 'upper', true],
    ['A13',   'x-x-5-6-7-7', 'upper', true],     // rootless
    ['C',     'x-x-x-5-5-3', 'triad', false],
    ['G7',    '3-x-3-4-x-x', 'shell', false],
    ['C',     '8-7-5-5-5-8', 'caged', false],    // the G-form barre
    ['C',     'x-x-10-12-13-12', 'upper', false], // a top-string triad is not the everyday C
    ['A6/9',  '5-4-4-4-x-x', 'other', false],    // the bottom of a barre is not a grip
  ];
  function testShapesAreSortedAndNamed(t){
    const { describeVoicing, FAMILIES } = GT.chordFinder;
    const bad = [];
    const seen = new Map();
    const voicingsOf = name => {
      if (!seen.has(name)){ const p = parseChordName(name); seen.set(name, findChordVoicings(p.rootPc, p.formula)); }
      return seen.get(name);
    };
    KINDS.forEach(([name, g, family, common]) => {
      const v = voicingsOf(name).find(x => grip(x.cells) === g);
      if (!v){ bad.push(`${name} ${g}: not offered`); return; }
      if (v.family !== family) bad.push(`${name} ${g}: called ${v.family}, not ${family}`);
      if (!!v.common !== common) bad.push(`${name} ${g}: ${v.common ? 'common' : 'less common'}, expected ${common ? 'common' : 'less common'}`);
    });
    // the split is real: every common shape reads before every other one
    [...seen.entries()].concat(CHORDS.map(n => [n, voicingsOf(n)])).forEach(([name, vs]) => {
      const firstRare = vs.findIndex(v => !v.common);
      if (firstRare !== -1 && vs.slice(firstRare).some(v => v.common)) bad.push(`${name}: a common shape sits after a less common one`);
      vs.forEach(v => {
        if (!FAMILIES[v.family]) bad.push(`${name} ${grip(v.cells)}: unknown family "${v.family}"`);
        if (!Array.isArray(v.genres)) bad.push(`${name} ${grip(v.cells)}: no genres`);
        // a rootless shape says so, and is only ever an extended chord
        if (v.rootless && parseChordName(name).formula.intervals.length < 5) bad.push(`${name} ${grip(v.cells)}: rootless, for a chord with no extension`);
      });
      // the common section stays a short list, or it isn't a list of common shapes
      const n = vs.filter(v => v.common).length;
      if (n > 18) bad.push(`${name}: ${n} shapes called common`);
    });
    // the styles come from the kind of grip and the kind of chord
    const tip = (name, g) => { const v = voicingsOf(name).find(x => grip(x.cells) === g); return v ? v.genres : []; };
    if (!tip('F', '1-3-3-2-1-1').includes('rock')) bad.push('the F barre is not at home in rock');
    if (!tip('G7', '3-2-0-0-0-1').includes('blues')) bad.push('the open G7 is not at home in the blues');
    if (!tip('Cmaj7', 'x-3-5-4-5-x').includes('jazz')) bad.push('the Cmaj7 grip is not at home in jazz');
    if (!tip('A13', 'x-x-5-6-7-7').includes('funk')) bad.push('the rootless A13 is not at home in funk');
    t.equal(bad.join('; '), '', `Shapes are sorted common-first and told what they are (${KINDS.length} named grips)`);
  }

  // ---- 3c. the movable / open filter ----
  // A shape with no open strings is movable: the grip slides to any root. One
  // with an open string is tied to where it sits. Asking for either is a
  // filter on the search rather than on its results, so the list comes back
  // full of that kind rather than showing the few that survived the general
  // ranking — which is the whole point of asking.
  const FILTERED = [
    ['C',    'x-3-2-0-1-0', 'open'],       // the open C
    ['F',    '1-3-3-2-1-1', 'movable'],    // the F barre
    ['G7',   '3-2-0-0-0-1', 'open'],
    ['A6/9', '5-x-4-4-5-5', 'movable'],
    ['E5',   '0-2-2-x-x-x', 'open'],
    ['Am7',  'x-12-14-12-13-12', 'movable'],
  ];
  function testTheShapeFilter(t){
    const bad = [];
    const opens = v => v.cells.some(c => c.fret === 0);
    const listed = (name, strings) => {
      const p = parseChordName(name);
      return findChordVoicings(p.rootPc, p.formula, { strings, bassPc: p.bassPc });
    };
    ['C', 'F', 'Bm', 'G7', 'Cmaj7', 'A6/9', 'E9', 'A5', 'Bb', 'F#m7'].forEach(name => {
      const open = listed(name, 'open'), movable = listed(name, 'movable');
      open.filter(v => !opens(v)).forEach(v =>
        bad.push(`${name}: "open" offered ${grip(v.cells)}, which has no open string`));
      movable.filter(v => opens(v)).forEach(v =>
        bad.push(`${name}: "movable" offered ${grip(v.cells)}, which does`));
      if (!movable.length) bad.push(`${name}: no movable shape at all`);
      // every shape is still a real shape of the chord, however it was filtered
      [...open, ...movable].forEach(v => {
        const pcs = [...new Set(v.cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12))];
        const p = parseChordName(name);
        if (!identifyChords(pcs).some(m => m.rootPc === p.rootPc && m.formula.name === p.formula.name)){
          bad.push(`${name}: ${grip(v.cells)} doesn't read back as ${name}`);
        }
      });
    });
    // and the filter really is one: an everyday shape shows under its own
    // heading, under "all", and not under the other
    FILTERED.forEach(([name, g, strings]) => {
      const other = strings === 'open' ? 'movable' : 'open';
      const has = s => listed(name, s).some(v => grip(v.cells) === g);
      if (!has(strings)) bad.push(`${name} ${g}: missing from "${strings}"`);
      if (!has('all')) bad.push(`${name} ${g}: missing from "all"`);
      if (has(other)) bad.push(`${name} ${g}: offered as "${other}"`);
    });
    t.equal(bad.join('; '), '', `Open and movable are told apart (${FILTERED.length} named shapes)`);
  }

  // ---- 3d. a name the app writes can be typed back into the finder ----
  // The reverse finder's matches are buttons that hand their chord to the
  // chord finder, so every name it can write has to parse — including the
  // spellings with a slash inside them (6/9, m/maj7), the symbols (m7♭5,
  // 7♯9) and the brackets (m(add9)).
  function testEveryChordNameParsesBack(t){
    const bad = [];
    GT.theory.CHORD_FORMULAS.forEach(f => {
      ['C', 'F#', 'Bb'].forEach(root => {
        const written = root + f.name;
        const p = parseChordName(written);
        if (!p){ bad.push(`"${written}" doesn't parse`); return; }
        if (p.rootName !== root || p.formula.name !== f.name){
          bad.push(`"${written}" came back as ${p.rootName}${p.formula.name}`);
        }
      });
    });
    t.equal(bad.join('; '), '', `Every chord name the app writes reads back (${GT.theory.CHORD_FORMULAS.length} types)`);
  }

  // ---- 3e. the ear trainer's answers cover its shape ----
  // The drill offers one button per note of the shape and sounds a note from
  // somewhere inside it, so the two halves have to agree: every note is
  // answerable, none is offered twice, the row reads root upwards, and every
  // answer says what the diagram says beside the same string.
  function testTheEarTrainerCoversItsShape(t){
    const bad = [];
    const { notesOf } = GT.earTraining;
    const { degreeNameFor } = GT.chordFinder;
    const pcOf = c => (STRING_TUNING[c.string] + c.fret) % 12;
    ['C', 'Am7', 'G7', 'F', 'A6/9', 'E5', 'Bb', 'D13', 'A13'].forEach(name => {
      const p = parseChordName(name);
      findChordVoicings(p.rootPc, p.formula).slice(0, 8).forEach(v => {
        const g = grip(v.cells);
        const notes = notesOf(v.cells, p.rootPc, p.formula, p.rootName);
        const pcs = new Set(v.cells.map(pcOf));
        if (notes.length !== pcs.size) bad.push(`${name} ${g}: ${notes.length} answers for ${pcs.size} notes`);
        if (new Set(notes.map(n => n.pc)).size !== notes.length) bad.push(`${name} ${g}: a note is offered twice`);
        pcs.forEach(pc => { if (!notes.some(n => n.pc === pc)) bad.push(`${name} ${g}: no answer for pitch ${pc}`); });
        // the row reads as the chord is spelled: root, then the tones in
        // order, then whatever sits above the octave
        if (notes.some(n => n.interval === 0) && notes[0].interval !== 0)
          bad.push(`${name} ${g}: the root doesn't read first`);
        const ext = n => /^(9|11|13)$/.test(n.degree);
        for (let i = 1; i < notes.length; i++){
          const a = notes[i - 1], b = notes[i];
          if (ext(a) && !ext(b)) bad.push(`${name} ${g}: the ${b.degree} reads after the ${a.degree}`);
          else if (ext(a) === ext(b) && b.interval < a.interval) bad.push(`${name} ${g}: ${b.degree} reads before ${a.degree}`);
        }
        const root = notes.find(n => n.interval === 0);
        if (root && root.degree !== 'R') bad.push(`${name} ${g}: the root reads "${root.degree}"`);
        notes.forEach(n => {
          if (!n.cells.length){ bad.push(`${name} ${g}: ${n.name} has nowhere to sound from`); return; }
          n.cells.forEach(c => {
            if (pcOf(c) !== n.pc) bad.push(`${name} ${g}: ${n.name} points at a fret that isn't it`);
          });
          if (n.degree !== degreeNameFor(n.interval, p.formula)) bad.push(`${name} ${g}: ${n.name} is labelled ${n.degree}`);
        });
        // and every string of the shape is inside one of the answers, so the
        // note the drill sounds is always one you can name
        v.cells.forEach(c => {
          if (!notes.some(n => n.cells.some(x => x.string === c.string && x.fret === c.fret)))
            bad.push(`${name} ${g}: string ${c.string} belongs to no answer`);
        });
      });
    });
    // An extension names the ones below it: the 2nd of a 13th chord is its
    // 9th, and reading it as a 2 made a B♭13 offer "C 2" beside "G 13".
    const spelled = name => {
      const p = parseChordName(name);
      const v = findChordVoicings(p.rootPc, p.formula)[0];
      return v ? notesOf(v.cells, p.rootPc, p.formula, p.rootName).map(n => n.degree).join(' ') : '(none)';
    };
    const thirteenth = spelled('Bb13');
    if (thirteenth.includes(' 2')) bad.push(`Bb13 reads its 9th as a 2 ("${thirteenth}")`);
    if (spelled('Csus2') !== 'R 2 5') bad.push(`Csus2 reads "${spelled('Csus2')}", not its plain 2`);
    // ...and the 9th of a 9th chord reads last, not second
    if (spelled('C9') !== 'R 3 ♭7 9') bad.push(`C9 reads "${spelled('C9')}"`);

    // the shape everyone knows, spelled out
    const c = parseChordName('C');
    const open = findChordVoicings(c.rootPc, c.formula).find(v => grip(v.cells) === 'x-3-2-0-1-0');
    const answers = open ? notesOf(open.cells, c.rootPc, c.formula, c.rootName)
      .map(n => `${n.name} ${n.degree}`).join(', ') : '(no open C)';
    if (answers !== 'C R, E 3, G 5') bad.push(`the open C offers "${answers}"`);
    t.equal(bad.join('; '), '', 'Every note of a shape is exactly one answer in the drill');
  }

  // ---- 3f. the scales the ear trainer offers have boxes to draw ----
  // The trainer names its scales by the intervals that define them, and
  // fretboard.js keys its written-out boxes the same way — which works only
  // as long as the two lists agree. They meet nowhere else: ask for a scale
  // whose signature isn't in the table and scaleBoxPlacements quietly hands
  // back the parallel major or minor instead, and the drill would be showing
  // one scale while calling it another. So: every scale offered has boxes of
  // its own, made of its own notes, and a full box holds all of them.
  function testEveryScaleHasItsBoxes(t){
    const { SCALES, PENTAS } = GT.earTraining;
    const bad = [];
    [...SCALES, ...PENTAS].forEach(scale => {
      [0, 3, 6, 10].forEach(rootPc => {           // C, Eb, F#, Bb
        const want = new Set(scale.ivs.map(i => (rootPc + i) % 12));
        const boxes = scale.ivs.length === 5
          ? pentaBoxPlacements(rootPc, scale.minor)
          : scaleBoxPlacements(rootPc, scale.minor, [...want]);
        if (!boxes.length){ bad.push(`${scale.name} on ${rootPc}: no boxes at all`); return; }
        const fullest = Math.max(...boxes.map(b => b.cells.length));
        boxes.forEach(b => {
          const pcs = new Set(b.cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12));
          [...pcs].filter(pc => !want.has(pc)).forEach(pc =>
            bad.push(`${scale.name} on ${rootPc}, ${b.name} box: holds pitch ${pc}, which isn't in the scale`));
          // a whole box has every note of the scale in it; the stubs at
          // either end of the neck are allowed to be short
          if (b.cells.length >= fullest - 2 && pcs.size !== want.size)
            bad.push(`${scale.name} on ${rootPc}, ${b.name} box: ${pcs.size} of the ${want.size} notes`);
        });
      });
    });
    t.equal(bad.join('; '), '', `Every scale the drill offers has boxes of its own notes (${SCALES.length + PENTAS.length} scales)`);
  }

  // ---- 3g. one octave of a box is one octave of it ----
  // The drill can narrow a box to a single octave, which is the span a player
  // runs while learning the shape. It has to be a real octave — an octave
  // span with one of the box's own roots at one end of it — and the fullest
  // one the box has: a narrowing that dropped a degree it could have kept
  // would quietly change what the drill is asking about. (Some boxes can't
  // offer a complete octave at all. The one clipped by the nut in C Lydian
  // holds six of the seven notes above its lowest root and five above the
  // next, and six is then the right answer.)
  //
  // Every octave a box has is one built up from a root, or the tail built
  // down to its lowest root — the notes below that root belong to nothing
  // else, and the drill can step to them the same way it can step to the
  // partial octave at the top. This works those out for itself rather than
  // asking the module, so the two can disagree.
  function testOneOctaveOfABox(t){
    const { oneOctave, SCALES, PENTAS } = GT.earTraining;
    const bad = [];
    const midi = c => STRING_MIDI[c.string] + c.fret;
    const pcOf = c => (STRING_TUNING[c.string] + c.fret) % 12;
    // All twelve roots, because the case this is guarding is rare: of the 582
    // boxes here, three have a higher root whose octave beats the lowest's —
    // A major pentatonic's A box holds three of its five notes above the
    // lowest root and all five above the next. Two roots wouldn't meet one.
    [...SCALES, ...PENTAS].forEach(scale => {
      for (let rootPc = 0; rootPc < 12; rootPc++){
        const boxes = (scale.ivs.length === 5
          ? pentaBoxPlacements(rootPc, scale.minor)
          : scaleBoxPlacements(rootPc, scale.minor, scale.ivs.map(i => (rootPc + i) % 12)));
        const fullest = Math.max(...boxes.map(b => b.cells.length));
        boxes.filter(b => b.cells.length >= fullest - 2).forEach(b => {
          const oct = oneOctave(b.cells, rootPc);
          const where = `${scale.name} on ${rootPc}, ${b.name} box`;
          if (!oct.length){ bad.push(`${where}: nothing left`); return; }
          if (oct.length > b.cells.length) bad.push(`${where}: the octave has more notes than the box`);
          if (!oct.some(c => pcOf(c) === rootPc)){ bad.push(`${where}: no root in the octave`); return; }
          const low = Math.min(...oct.map(midi)), high = Math.max(...oct.map(midi));
          if (high - low > 12) bad.push(`${where}: spans more than an octave`);
          const onARoot = m => b.cells.some(c => pcOf(c) === rootPc && midi(c) === m);
          if (!onARoot(low) && !onARoot(high))
            bad.push(`${where}: neither end of it is a root of the box`);
          // ...and it's the fullest octave the box has to offer: from each
          // root upwards, or down to the lowest one
          const roots = b.cells.filter(c => pcOf(c) === rootPc).map(midi).sort((x, y) => x - y);
          const spans = roots.map(r => [r, r + 12]);
          if (roots.length) spans.push([roots[0] - 12, roots[0]]);
          const best = Math.max(...spans.map(([lo, hi]) =>
            new Set(b.cells.filter(c => midi(c) >= lo && midi(c) <= hi).map(pcOf)).size));
          const got = new Set(oct.map(pcOf)).size;
          if (got !== best) bad.push(`${where}: ${got} notes where an octave of it holds ${best}`);
        });
      }
    });
    t.equal(bad.join('; '), '', 'One octave of a box starts on a root and is the fullest octave it has');
  }

  // ---- 3h. every chord quality the drill can ask is one it can play ----
  // The quality drill rolls a root and a quality and needs a shape to sound
  // and a root to show. A quality whose suffix the finder can't parse, or one
  // with no shape holding its own root, would leave the drill rolling in
  // silence — so each has to survive being written out, found, and voiced
  // with its root in the voicing. Three roots rather than twelve: each one is
  // a full search of the neck, and a quality that works on C, F# and Bb isn't
  // going to fail on D.
  function testEveryQualityCanBeAsked(t){
    const { QUALITIES } = GT.earTraining;
    const bad = [];
    const defaults = QUALITIES.filter(q => q.on).map(q => q.name).join(', ');
    if (defaults !== 'Major, Minor, maj7, m7, 7') bad.push(`the drill starts on "${defaults}"`);
    if (new Set(QUALITIES.map(q => q.id)).size !== QUALITIES.length) bad.push('two qualities share an id');
    if (new Set(QUALITIES.map(q => q.name)).size !== QUALITIES.length) bad.push('two qualities share a name');
    QUALITIES.forEach(q => {
      ['C', 'F#', 'Bb'].forEach(root => {
        const p = parseChordName(root + q.id);
        if (!p){ bad.push(`"${root}${q.id}" doesn't parse`); return; }
        const rooted = findChordVoicings(p.rootPc, p.formula)
          .filter(v => v.cells.some(c => (STRING_TUNING[c.string] + c.fret) % 12 === p.rootPc));
        if (!rooted.length) bad.push(`${root}${q.id}: no shape with its own root in it`);
      });
    });
    t.equal(bad.join('; '), '', `Every quality the drill can ask can be played (${QUALITIES.length} qualities)`);
  }

  // ---- 3i. every chord the practice tab plays is inside the recordings ----
  // The piano has no range to run out of; fifteen recordings do. The practice
  // tab stacks a chord upward from the third octave, so a 13th in a high key
  // reaches further than anything the neck can play — and a note past the top
  // sample would come out pitched a long way from anything a guitar sounds
  // like. So every note of every chord it can build has to land inside the
  // map, and near enough to a sample to still be that instrument.
  function testEveryChordFitsTheRecordings(t){
    const { GUITAR_SAMPLES, sampleFor, chordFrequencies } = GT.audio;
    const bad = [];
    const midiOf = f => Math.round(69 + 12 * Math.log2(f / 440));
    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const suffixes = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '6', '9', '13', 'sus4', 'add9'];
    let checked = 0;
    roots.forEach(root => suffixes.forEach(suffix => {
      const chord = chordFromName(root + suffix);
      if (!chord){ bad.push(`${root}${suffix} doesn't build`); return; }
      chordFrequencies(chord).forEach(freq => {
        checked++;
        const midi = midiOf(freq);
        const spec = sampleFor(midi);
        if (midi < GUITAR_SAMPLES[0].lo || midi > GUITAR_SAMPLES[GUITAR_SAMPLES.length - 1].hi){
          bad.push(`${root}${suffix}: MIDI ${midi} is outside every sample's range`);
        } else if (Math.abs(midi - spec.key) > 3){
          bad.push(`${root}${suffix}: MIDI ${midi} is ${Math.abs(midi - spec.key)} semitones from ${spec.file}`);
        }
      });
    }));
    t.equal(bad.join('; '), '', `Every chord the practice tab plays has recordings for it (${checked} notes)`);
  }

  // ---- 3i-bis. the piano map says what the .sfz says ----
  // Sixty-six file names were transcribed out of the upstream .sfz into
  // audio.js, and a wrong one is invisible: the fetch 404s, the bank goes
  // quiet, and the synthesized voice plays as though nothing happened. So the
  // map is held to the shape the .sfz has — two layers, each covering the
  // whole keyboard end to end with no gap and no note claimed twice, each
  // sample near enough to the notes it covers to still be that note. The
  // layers differ on purpose (the soft one is minor thirds, the hard one adds
  // a B in most octaves and is missing A2 and C4), so they're checked apart
  // rather than assumed to match.
  function testThePianoMapIsWhole(t){
    const { PIANO_SOFT, PIANO_HARD, pianoSampleFor, chordFrequencies, PIANO_SPLIT } = GT.audio;
    const bad = [];
    const midiOf = f => Math.round(69 + 12 * Math.log2(f / 440));
    [['soft', PIANO_SOFT, 1], ['hard', PIANO_HARD, 3]].forEach(([name, map, reach]) => {
      if (map[0].lo !== 21 || map[map.length - 1].hi !== 108){
        bad.push(`the ${name} layer covers ${map[0].lo}-${map[map.length - 1].hi}, not the 88 keys`);
      }
      const seen = new Set();
      map.forEach((spec, i) => {
        if (i && map[i - 1].hi !== spec.lo - 1) bad.push(`${name}: ${spec.file} leaves a gap or overlap under it`);
        if (spec.key < spec.lo || spec.key > spec.hi) bad.push(`${name}: ${spec.file} is mapped outside its own range`);
        if (Math.max(spec.key - spec.lo, spec.hi - spec.key) > reach){
          bad.push(`${name}: ${spec.file} is stretched further than ${reach} semitones`);
        }
        if (seen.has(spec.file)) bad.push(`${name}: ${spec.file} is claimed twice`);
        seen.add(spec.file);
      });
    });
    // and the notes the app actually plays land on a layer either side of the split
    let checked = 0;
    ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].forEach(root =>
      ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '6', '9', '13', 'sus4', 'add9'].forEach(suffix => {
        const chord = chordFromName(root + suffix);
        if (!chord) return;
        chordFrequencies(chord).forEach(freq => {
          const midi = midiOf(freq);
          [true, false].forEach(hard => {
            checked++;
            const spec = pianoSampleFor(midi, hard);
            if (!spec || midi < spec.lo || midi > spec.hi){
              bad.push(`${root}${suffix}: MIDI ${midi} has no ${hard ? 'hard' : 'soft'} sample`);
            }
          });
        });
      }));
    if (!(PIANO_SPLIT > 0 && PIANO_SPLIT < 1)) bad.push('the velocity split is outside 0..1');
    // ...and every note any style can voice is inside the stretch that gets
    // warmed before playback. A voice that reached above it would still
    // sound — on the synthesized piano, one voice out of an otherwise
    // sampled arrangement — which is exactly how the jazz comp went
    // unnoticed. Every style in the library is walked rather than the three
    // voice names known today, so a style added later is held to the same
    // line: either it voices inside the warmed range or this fails.
    const { PIANO_RANGE, STYLE_VOICES, STYLES, ROOT_OCTAVE, noteFreq } = GT.audio;
    const declared = new Set();
    Object.keys(STYLES).forEach(key => (STYLES[key].variants || []).forEach(v => {
      declared.add(v.voice || 'triad');
      if (!STYLE_VOICES[v.voice || 'triad']){
        bad.push(`${key}/${v.label} asks for the "${v.voice}" voice, which nothing here can place`);
      }
    }));
    ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].forEach(root =>
      ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '6', '9', '13', 'sus4', 'add9'].forEach(suffix => {
        const chord = chordFromName(root + suffix);
        if (!chord) return;
        const reach = [noteFreq(chord.note, ROOT_OCTAVE)];   // the roots-only mode's lone root
        declared.forEach(voice => reach.push(...STYLE_VOICES[voice].freqs(chord)));
        reach.forEach(freq => {
          const midi = midiOf(freq);
          if (midi < PIANO_RANGE.lo || midi > PIANO_RANGE.hi){
            bad.push(`${root}${suffix} voices MIDI ${midi}, outside the warmed ${PIANO_RANGE.lo}-${PIANO_RANGE.hi}`);
          } else if (!pianoSampleFor(midi, true) || !pianoSampleFor(midi, false)){
            bad.push(`${root}${suffix}: MIDI ${midi} has no sample in one of the layers`);
          }
        });
      }));
    t.equal(bad.join('; '), '', `The piano map covers both layers end to end (${checked} notes)`);
  }

  // ---- 3j. every note the neck can play has a recording behind it ----
  // Fifteen samples cover the range by being stretched a semitone or three
  // either side of themselves. Stretch one much further and it stops sounding
  // like the guitar it was — a low E played back at double speed is a
  // different instrument — so this holds the map to what it claims: every
  // string and fret the app draws lands inside some sample's own range, and
  // near enough to it to still be that note played on that guitar.
  function testEveryNoteHasARecording(t){
    const { GUITAR_SAMPLES, sampleFor } = GT.audio;
    const bad = [];
    const OPEN_MIDI = [64, 59, 55, 50, 45, 40];       // high e down to low E
    for (let s = 0; s < 6; s++){
      for (let f = 0; f <= FRET_COUNT; f++){
        const midi = OPEN_MIDI[s] + f;
        const spec = sampleFor(midi);
        if (!spec){ bad.push(`MIDI ${midi} has no sample at all`); continue; }
        if (midi < spec.lo || midi > spec.hi) bad.push(`MIDI ${midi} got ${spec.file}, whose range is ${spec.lo}-${spec.hi}`);
        const shift = Math.abs(midi - spec.key);
        if (shift > 3) bad.push(`MIDI ${midi} is ${shift} semitones from ${spec.file}`);
      }
    }
    // and the map itself: in order, no gaps, no two samples claiming a note
    GUITAR_SAMPLES.forEach((spec, i) => {
      if (spec.lo > spec.key || spec.key > spec.hi) bad.push(`${spec.file} sits outside its own range`);
      const next = GUITAR_SAMPLES[i + 1];
      if (!next) return;
      if (next.key <= spec.key) bad.push(`${next.file} is out of order`);
      if (next.lo !== spec.hi + 1) bad.push(`${spec.file} and ${next.file} ${next.lo > spec.hi + 1 ? 'leave a gap' : 'overlap'}`);
    });
    t.equal(bad.join('; '), '', `Every note the neck can play has a recording near it (${6 * (FRET_COUNT + 1)} checked)`);
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
    // Two suffixes have a slash inside them, so the slash can't simply mean
    // "bass note follows": read that way, neither spelling parses at all.
    const named = n => { const p = parseChordName(n); return p && p.rootName + p.formula.name; };
    t.equal(named('Cm/maj7'), 'Cm(maj7)', '"Cm/maj7" names the minor-major 7th');
    t.equal(named('C6/9'), 'C6/9', '"C6/9" names the 6/9');
    // and a bass note still reads as one, including under those same chords
    t.equal(parseChordName('Cm/G').bassName, 'G', '"Cm/G" is still C minor over G');
    t.equal(parseChordName('C/'), null, '"C/" is rejected');
    t.equal(parseChordName('C/Gm'), null, '"C/Gm" is rejected');

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

    const names = pcs => identifyChords(pcs).map(m => NOTE_NAMES_SHARP[m.rootPc] + m.formula.name + (m.rootless ? ' (no root)' : ''));
    t.equal(names([0, 4, 7])[0], 'C', 'C E G reads as C first');
    t.ok(names([0, 3, 7, 10]).includes('Cm7'), 'C D# G A# includes Cm7');
    t.ok(names([0, 4, 7, 9]).includes('Am7') && names([0, 4, 7, 9]).includes('C6'), 'C E G A reads as both C6 and Am7');

    // The 6/9 is named without its 3rd as a matter of course: x-x-4-4-5-5 is
    // A E B F#, and every chord chart calls it A6/9. It used to come back as
    // B7sus4 — true, but not what anyone playing it would say.
    t.equal(names([9, 4, 11, 6])[0], 'A6/9', 'A E B F# (x-x-4-4-5-5) reads as A6/9 first');
    t.ok(names([9, 4, 11, 6]).includes('B7sus4'), '...and B7sus4 is still on the list');
    t.equal(names([9, 11, 6]).filter(n => n.includes('6/9')).join(' '), '', 'A B F# alone — no 3rd and no 5th — is not a 6/9');
    t.ok(names([0, 4, 9, 2]).includes('C6/9'), 'C E A D — the 6/9 without its 5th — is still C6/9');

    // A rootless voicing: an extended chord played without its root, which
    // the bass has. x-x-5-6-7-7 is G C# F# B — the b7, 3, 13 and 9 of A — and
    // came back as no chord at all.
    t.equal(names([11, 6, 1, 7]).join(' '), 'A13 (no root)', 'B F# C# G (x-x-5-6-7-7) is a rootless A13, and nothing else');
    t.equal(names([1, 4, 7, 11]).slice(-1)[0], 'A9 (no root)', 'C# E G B is a C#m7b5 first and a rootless A9 after');
    t.equal(names([4, 7, 11]).filter(n => n.includes('no root')).join(' '), '', 'E G B is Em, never a rootless Cmaj7: only extended chords lose their root');
    t.equal(names([0, 4, 7, 2]).filter(n => n.includes('no root')).join(' '), '', 'C E G D is Cadd9, not a rootless anything');

    // spellings a chart uses that a strict parser rejects
    parses('C7(#9)', '7♯9', 'C');
    parses('Cm7(b5)', 'm7♭5', 'C');
    parses('C(add9)', 'add9', 'C');
    parses('Cadd2', 'add9', 'C');
    parses('D9sus4', '9sus4', 'D');
    parses('G6add9', '6/9', 'G');

    // the open C7 in Progression: the dropped root would fall below the
    // nut, so the 5th is raised instead
    const cShape = cagedPlacements(0, CAGED_MAJOR).find(p => p.name === 'C' && p.fretMin === 0);
    t.equal(grip(seventhCells(cShape, 0, 10)), 'x-3-2-3-1-0', 'open C-shape C7 raises the 5th to the flat 7th');
    t.equal(grip(seventhCells(cShape, 0, 11)), 'x-3-2-0-0-0', 'open C-shape Cmaj7 flattens the doubled root');
  }

  // ---- 4v. the suggested parts ----
  // A part is written once per feel as intervals and slots, and realised
  // into whatever notes a reading offers in a position. Two things have to
  // hold whatever anyone writes later. The library has to be well-formed:
  // every part belongs to a feel that exists, sits on that feel's grid, and
  // has a figure and fills to answer it. And realisation has to keep its
  // promise — every note it produces is inside the window and is a note the
  // reading allows, so the chords reading never plays a non-chord tone and a
  // part told to stay on the I never leaves the key. A part that snapped
  // half its notes away would technically pass that, so it also has to keep
  // most of what was written when the reading is generous.
  function testTheSuggestedParts(t){
    const { LIBRARY, partsFor, palette, realise, rollFills } = GT.parts;
    const { STYLES } = GT.audio;
    const bad = [];
    let parts = 0;

    Object.keys(LIBRARY).forEach(style => {
      if (!STYLES[style]){ bad.push(`parts written for "${style}", which is not a style`); return; }
      Object.keys(LIBRARY[style]).forEach(feelName => {
        const feel = STYLES[style].variants.find(v => v.label === feelName);
        if (!feel){ bad.push(`${style} has no feel called "${feelName}"`); return; }
        LIBRARY[style][feelName].forEach(part => {
          parts++;
          const where = `${style}/${feelName}/${part.name}`;
          if (!part.figure || !part.figure.length) bad.push(`${where} has no figure`);
          if (!part.fills || part.fills.length < 2) bad.push(`${where} has fewer than two fills`);
          let strums = 0;
          [part.figure, ...(part.fills || [])].forEach(bar => (bar || []).forEach(n => {
            if (!(n.at >= 0 && n.at < feel.grid)) bad.push(`${where}: a note at slot ${n.at} on a ${feel.grid}-slot grid`);
            if (!(n.dur > 0)) bad.push(`${where}: a note lasting ${n.dur}`);
            if (n.strum) strums++;
            else if (!(n.iv >= 0 && n.iv <= 14)) bad.push(`${where}: an interval of ${n.iv}`);
            if (!(n.vel > 0 && n.vel <= 1)) bad.push(`${where}: a velocity of ${n.vel}`);
          }));
          // rhythm guitar with fills, not a lead line: every part strums somewhere
          if (!strums) bad.push(`${where} never strums the chord`);
        });
      });
    });
    if (!parts) bad.push('the library is empty');

    // realisation keeps its promise, on every reading, in every key
    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const windows = [{ min: 0, max: 3 }, { min: 5, max: 9 }, { min: 10, max: 14 }];
    const midiPc = m => ((m % 12) + 12) % 12;
    let checked = 0, written = 0, kept = 0;
    ['caged', 'triads3', 'penta', 'scale'].forEach(reading => roots.forEach(root => {
      const I = chordFromName(root), IV = chordFromName(roots[(roots.indexOf(root) + 5) % 12]),
            V7 = chordFromName(roots[(roots.indexOf(root) + 7) % 12] + '7');
      const bars = [I, I, IV, V7].map(chord => ({ chord }));
      const key = { tonic: root, mode: 'major' };
      Object.keys(LIBRARY).forEach(style => Object.keys(LIBRARY[style]).forEach(feelName => {
        partsFor(style, feelName).forEach(part => windows.forEach(window => [false, true].forEach(stayOnKey => {
          const opts = { reading, window, scaleTheory: 'parallel', stayOnKey, key };
          const picks = rollFills(part, bars.length, () => 0.5);
          const notes = realise(part, bars, picks, opts);
          const again = realise(part, bars, picks, opts);
          if (JSON.stringify(notes) !== JSON.stringify(again)) bad.push(`${part.name} realised differently twice`);
          const chordTones = chord => new Set([chord.note, chord.third, chord.fifth, chord.seventh]
            .filter(Boolean).map(n => GT.theory.SEMITONE[n] % 12));
          notes.forEach(n => {
            checked++;
            const chord = bars[n.bar].chord;
            if (n.fret < window.min || n.fret > window.max) bad.push(`${reading} ${root}: ${part.name} left the window`);
            if (n.strum){
              // a strum is the chord itself, whatever the reading: its notes
              // are chord tones by construction, and that is what's held
              if (!chordTones(chord).has(midiPc(n.midi))) bad.push(`${reading} ${root}: ${part.name} strums a note that isn't in the chord`);
              return;
            }
            const { allowed } = palette(chord, opts);
            if (!allowed.has(midiPc(n.midi))) bad.push(`${reading} ${root}: ${part.name} plays a note the reading doesn't offer`);
          });
          // a strum is three strings at the least, or it isn't a chord
          const strumsAt = {};
          notes.filter(n => n.strum).forEach(n => { const k = `${n.bar}:${n.at}`; strumsAt[k] = (strumsAt[k] || 0) + 1; });
          Object.entries(strumsAt).forEach(([k, count]) => {
            if (count < 3) bad.push(`${reading} ${root}: ${part.name} strums ${count} strings at ${k}`);
          });
          // in the scales reading nearly everything written should survive:
          // counted by moment, since a strum is one written thing that
          // comes out as several
          if (reading === 'scale' && !stayOnKey){
            written += part.figure.length * 2 + part.fills[0].length * 2;
            kept += new Set(notes.map(n => `${n.bar}:${n.at}`)).size;
          }
        })));
      }));
    }));
    if (kept < written * 0.8) bad.push(`the scales reading kept only ${kept} of ${written} written notes`);

    t.equal(bad.join('; '), '', `The suggested parts are well-formed and realise inside the reading (${parts} parts, ${checked} notes)`);
  }

  // ---- 4w. the audio engine is allowed to stop ----
  // A running AudioContext renders its graph whether or not anything is
  // audible — hundreds of blocks a second through a limiter and a reverb — so
  // one left running is a tab quietly spending battery for hours after the
  // last note. It now sleeps when nothing has sounded for a while. The rule
  // is held here rather than the timer, because the worst version of this
  // bug is an engine that sleeps in the middle of a progression.
  function testTheEngineSleepsButNotWhilePlaying(t){
    const { sleepDelay, IDLE_SLEEP_SEC, HIDDEN_SLEEP_SEC } = GT.audio;
    const bad = [];
    const now = 1000;

    // while something is playing, never
    if (sleepDelay(now, now - 999, false, true) !== null) bad.push('it would sleep while something is playing');
    if (sleepDelay(now, now, true, true) !== null) bad.push('a hidden page would sleep while something is playing');

    // The windows are measured from when the sound STOPS, so a note still
    // ringing is never cut off, however long it rings and however short the
    // window is. The worst case in the app is a whole-note chord at 40 BPM,
    // which rings for 6.06s; freezing it mid-decay and thawing it later,
    // still sounding, is the failure this guards against.
    const LONGEST_NOTE = 6.06;
    [['visible', false], ['hidden', true]].forEach(([where, hidden]) => {
      const mid = sleepDelay(now, now + LONGEST_NOTE, hidden, false);
      if (mid < LONGEST_NOTE) bad.push(`${where}: it would sleep ${(LONGEST_NOTE - mid).toFixed(2)}s before the note finished`);
    });

    // a note that has just finished holds it open for the whole window
    const fresh = sleepDelay(now, now, false, false);
    if (Math.abs(fresh - IDLE_SLEEP_SEC) > 0.001) bad.push(`a note just finished gave ${fresh}s, not the ${IDLE_SLEEP_SEC}s window`);

    // nothing for longer than the window: sleep now
    if (sleepDelay(now, now - IDLE_SLEEP_SEC - 1, false, false) !== 0) bad.push('a long-quiet engine did not sleep at once');

    // a hidden page waits barely at all: nobody is listening to it
    const hidden = sleepDelay(now, now, true, false);
    if (Math.abs(hidden - HIDDEN_SLEEP_SEC) > 0.001) bad.push(`a hidden page waits ${hidden}s, not ${HIDDEN_SLEEP_SEC}s`);
    if (!(HIDDEN_SLEEP_SEC < IDLE_SLEEP_SEC)) bad.push('a hidden page waits as long as a visible one');
    // ...but the visible window is long enough not to cycle between two
    // clicks in the finder or two questions in the ear trainer
    if (IDLE_SLEEP_SEC < 5) bad.push(`${IDLE_SLEEP_SEC}s will have it waking and sleeping under normal use`);

    t.equal(bad.join('; '), '', 'The engine sleeps when nothing is sounding, and never while something is');
  }

  // ---- 4x. every note a bass line can ask for has a recording ----
  // The bass is a double bass, and a double bass stops: the highest note
  // recorded is an A3, while a walking line's "third, up an octave" reaches a
  // D#4 in three keys. Those are folded down an octave rather than stretched
  // six semitones, and this holds the whole arrangement to that promise —
  // every bass figure in every style, on every chord, at the velocity the
  // style declares, has to come out on a sample rather than quietly falling
  // back to the synthesized bass. A style added later gets the same check,
  // which is the point: nothing here should be silently un-sampled.
  function testEveryBassNoteHasARecording(t){
    const { STYLES, BASS_BANDS, BASS_TOP, BASS_RANGE, bassSampleFor, bassFold,
            walkBassFreq, bassNote, bassWarmList } = GT.audio;
    const { SEMITONE } = GT.theory;
    const bad = [];
    const midiOfF = f => Math.round(69 + 12 * Math.log2(f / 440));

    // each band tiles the stretch a line uses, with no gap and no note twice
    BASS_BANDS.forEach(({ map, hiVel }) => {
      map.forEach((spec, i) => {
        if (i && map[i - 1].hi !== spec.lo - 1) bad.push(`band ${hiVel}: ${spec.file} leaves a gap or overlap under it`);
        if (spec.key < spec.lo || spec.key > spec.hi) bad.push(`band ${hiVel}: ${spec.file} is mapped outside its own range`);
        if (spec.hi >= 33 && spec.lo <= BASS_TOP && Math.max(spec.key - spec.lo, spec.hi - spec.key) > 4){
          bad.push(`band ${hiVel}: ${spec.file} is stretched further than 4 semitones`);
        }
      });
    });

    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const warmed = new Set(bassWarmList().map(spec => spec.file));
    let checked = 0, lowest = 128, highest = 0;
    Object.keys(STYLES).forEach(key => (STYLES[key].variants || []).forEach(v => {
      (v.bass || []).forEach(entry => {
        roots.forEach(root => roots.forEach(next => ['maj', 'min'].forEach(quality => {
          const chord = { note: root, quality, third: root, fifth: root };
          const nextChord = { note: next, quality, third: next, fifth: next };
          const raw = 'walk' in entry
            ? walkBassFreq(chord, nextChord, entry.walk, true)
            : bassNote(SEMITONE[root] % 12, entry.off);
          const midi = midiOfF(bassFold(raw));
          checked++;
          lowest = Math.min(lowest, midi); highest = Math.max(highest, midi);
          if (midi > BASS_TOP) bad.push(`${key}/${v.label}: ${root} lands on MIDI ${midi}, above the top recording`);
          // A bass part that climbs out of a bass's usual register is a
          // different complaint from one that has no sample: this pins the
          // register itself, so a new style can't quietly write a line up
          // where a player wouldn't go.
          if (midi < BASS_RANGE.lo || midi > BASS_RANGE.hi){
            bad.push(`${key}/${v.label}: ${root} reaches MIDI ${midi}, outside the bass register ${BASS_RANGE.lo}-${BASS_RANGE.hi}`);
          }
          const spec = bassSampleFor(midi, entry.vel);
          if (!spec || midi < spec.lo || midi > spec.hi){
            bad.push(`${key}/${v.label}: MIDI ${midi} at velocity ${entry.vel} has no sample`);
          } else if (!warmed.has(spec.file)){
            // ...and the sample it needs must be one the warm actually
            // fetches, or that note plays on the synthesized bass however
            // long you wait.
            bad.push(`${key}/${v.label}: MIDI ${midi} needs ${spec.file}, which the warm never loads`);
          }
        })));
      });
    }));
    t.equal(bad.join('; '), '',
      `Every bass note every style can play has a recording, and it is warmed (${checked} notes, MIDI ${lowest}-${highest})`);
  }

  // ---- 4y. the Voice control reaches every style ----
  // The practice tab's Voice control picks piano or guitar. It used to be
  // read in one place — the Simple style's own beat — so choosing Guitar
  // did nothing at all under Rock, Blues, Jazz, Pop or Funk, which all comp
  // through playStyleVoice. Nothing caught it because sound isn't testable;
  // what is testable is whether the choice arrives. Every style in the
  // library is asked to play a chord with the guitar voice, and every one of
  // them has to have carried it down to the thing that would strum it.
  function testTheVoiceReachesEveryStyle(t){
    const { STYLES, lastVoiceAsked, playStyleVoice } = GT.audio;
    const chord = chordFromName('C7');
    const bad = [];
    Object.keys(STYLES).forEach(key => (STYLES[key].variants || []).forEach(v => {
      ['guitar', 'piano'].forEach(want => {
        // The play itself needs an audio context this page hasn't got, and
        // doesn't need to succeed: the voice is recorded before a note is
        // scheduled, which is the part being checked.
        try { playStyleVoice(v.voice, chord, 0, 0.2, 0.6, want); } catch (e) { /* no audio here */ }
        const got = lastVoiceAsked();
        if (got !== want) bad.push(`${key}/${v.label} asked for ${want} and passed on ${got}`);
      });
    }));
    t.equal(bad.join('; '), '', 'Every style carries the Voice choice down to what plays the chord');
  }

  // ---- 4z. every note the genre examples play has a recording behind it ----
  // The examples are written as string and fret, so a note added to a lead
  // line or a voicing added to a rhythm reaches the guitar samples without
  // anyone thinking about it. This walks every genre, every progression,
  // every rhythm and every lead, and holds each note to the same line the
  // neck is held to: inside some sample's own range, and near enough to it
  // to still be that note played on that guitar. A pattern written outside
  // the recorded range would play — on the synthesized guitar, one voice in
  // an otherwise sampled arrangement, which is the kind of thing you only
  // notice as "something sounds off".
  function testGenreNotesHaveRecordings(t){
    const { GUITAR_SAMPLES, sampleFor } = GT.audio;
    const { voiceChord, midiFor } = GT.genres;
    const bad = [];
    let checked = 0;
    const check = (midi, where) => {
      checked++;
      const spec = sampleFor(midi);
      if (midi < GUITAR_SAMPLES[0].lo || midi > GUITAR_SAMPLES[GUITAR_SAMPLES.length - 1].hi){
        bad.push(`${where}: MIDI ${midi} is outside every sample's range`);
      } else if (midi < spec.lo || midi > spec.hi){
        bad.push(`${where}: MIDI ${midi} got ${spec.file}, whose range is ${spec.lo}-${spec.hi}`);
      } else if (Math.abs(midi - spec.key) > 3){
        bad.push(`${where}: MIDI ${midi} is ${Math.abs(midi - spec.key)} semitones from ${spec.file}`);
      }
    };
    GT.genreData.forEach(g => {
      g.rhythms.forEach(r => g.progressions.forEach(p => p.chords.forEach(chord => {
        const voiced = voiceChord(chord, r.voicing);
        if (!voiced) return;                       // testData already reports this
        voiced.cells.forEach(c => check(midiFor(c.string, c.fret), `${g.name} ${r.name} ${chord}`));
      })));
      g.leads.forEach(l => l.notes.forEach(n => check(midiFor(n.s, n.f), `${g.name} lead ${l.name}`)));
    });
    t.equal(bad.join('; '), '', `Every note the genre examples play has a recording (${checked} notes)`);
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
          if (!v){ issues.push(`"${c}" can't be voiced as ${r.voicing} for "${r.name}"`); return; }
          // A power chord or an octave holds the root, the 5th and the octave
          // and nothing else. A quality the style didn't list used to fall
          // through to the barre table, so a G7 in a power-chord riff came out
          // as a six-string dominant barre — audibly the wrong instrument part.
          if (!['power', 'octave'].includes(r.voicing)) return;
          const rootPc = parseChordName(c).rootPc;
          const stray = [...new Set(v.cells
            .map(x => (((STRING_TUNING[x.string] + x.fret) - rootPc) % 12 + 12) % 12))]
            .filter(iv => iv !== 0 && iv !== 7);
          if (stray.length) issues.push(
            `"${c}" as ${r.voicing} for "${r.name}" plays ${stray.join(',')} semitones above the root`);
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

    // A preset the key's mode offers must have a variant that mode can show.
    // Choosing one whose variants are all written for the other mode leaves
    // nothing to select, and the practice tab now drops a selection whose
    // variant the mode has no room for — so such a preset would clear itself
    // the instant you picked it.
    const fits = (item, mode) => !item.mode || item.mode === mode;
    const orphans = [];
    GT.progressionPresets.forEach(p => ['major', 'minor'].forEach(mode => {
      if (fits(p, mode) && !p.variants.some(v => fits(v, mode)))
        orphans.push(`${p.name} is offered in ${mode} with no variant for it`);
    }));
    t.equal(orphans.join('; '), '', 'every preset a mode offers has a variant that mode can show');
  }

  // ---- two answers to "what degree is this note", which must agree --------
  // cagedTriadBoard labels the notes it draws from a root pitch class and a
  // minor flag; the position reading labels the chords sitting behind the front
  // one through theory's degreeLabel, from the chord object. In one position
  // both are on screen at once — the lit chord wears the first set of labels
  // and the ghosts wear the second — so a note that is a ♭7 has to be spelled
  // the same either way, whichever of the two happened to draw it.
  function testDegreeNamesAgree(t){
    const names = ['C', 'Cm', 'C7', 'Cm7', 'Cmaj7', 'Cdim', 'Cm7b5', 'Cdim7',
                   'A', 'Am7', 'Ebmaj7', 'F#m7', 'Bb7', 'G#m'];
    const clashes = [];
    let compared = 0;
    names.forEach(n => {
      const ch = chordFromName(n, 0, 'major');
      if (!ch) { clashes.push(`${n} doesn't build`); return; }
      const rootPc = SEMITONE[ch.note] % 12;
      const sevPc = ch.seventh ? SEMITONE[ch.seventh] % 12 : null;
      // what the board writes on each pitch class
      const board = {};
      cagedTriadBoard(rootPc, ch.quality === 'min', ch.note, sevPc).markers
        .forEach(m => { if (m.label) board[(STRING_TUNING[m.string] + m.fret) % 12] = m.label; });
      // what the ghosts write on the same ones
      const ghost = { [rootPc]: ch.note,
        [SEMITONE[ch.third] % 12]: degreeLabel(ch, 'third'),
        [SEMITONE[ch.fifth] % 12]: degreeLabel(ch, 'fifth') };
      if (ch.seventh) ghost[sevPc] = degreeLabel(ch, 'seventh');
      Object.keys(ghost).forEach(pc => {
        if (board[pc] === undefined) return;
        compared++;
        if (board[pc] !== ghost[pc])
          clashes.push(`${n}: the board writes "${board[pc]}" where a ghost writes "${ghost[pc]}"`);
      });
    });
    t.equal(clashes.join('; '), '', `one note, one degree name, whoever draws it (${compared} compared)`);
  }


  // ---- what every scale box holds, exactly ---------------------------------
  // A snapshot, not a judgement: each row is one box as "shape@anchor" followed
  // by the frets it uses on each string, high e first, "." for a string it
  // doesn't touch. Scale boxes are built by a rule rather than written down, so
  // a change to that rule moves all of them at once — this is what makes such a
  // change visible and reviewable instead of silent.
  const SCALE_BOXES = {
    'C': [
      'C@0 0-1-3 0-1-3 0-2 0-2-3 0-2-3 0-1-3',
      'C@12 12-13-15 12-13-15 12-14 12-14-15 12-14-15 12-13-15',
      'A@3 3-5 3-5-6 2-4-5 2-3-5 2-3-5 3-5',
      'A@15 15 15 14 14-15 14-15 15',
      'G@5 5-7-8 5-6-8 4-5-7 5-7 5-7-8 5-7-8',
      'E@8 7-8-10 8-10 7-9-10 7-9-10 7-8-10 8-10',
      'D@-2 0 0-1 0 0 0 0-1',
      'D@10 10-12 10-12-13 9-10-12 9-10-12 10-12 10-12-13',
    ],
    'Cm': [
      'C@1 1-3 1-3-4 0-1-3 0-1-3 1-3 1-3-4',
      'C@13 13-15 13-15 12-13-15 12-13-15 13-15 13-15',
      'A@3 3-4-6 3-4-6 3-5 3-5-6 3-5-6 3-4-6',
      'A@15 15 15 15 15 15 15',
      'G@6 6-8 6-8-9 5-7-8 5-6-8 5-6-8 6-8',
      'E@8 8-10-11 8-9-11 7-8-10 8-10 8-10-11 8-10-11',
      'D@-1 1 1 0-1 0-1 1 1',
      'D@11 10-11-13 11-13 10-12-13 10-12-13 10-11-13 11-13',
    ],
    'G': [
      'C@7 7-8-10 7-8-10 7-9 7-9-10 7-9-10 7-8-10',
      'A@-2 0 0-1 0 0 0 0',
      'A@10 10-12 10-12-13 9-11-12 9-10-12 9-10-12 10-12',
      'G@0 0-2-3 0-1-3 0-2 0-2 0-2-3 0-2-3',
      'G@12 12-14-15 12-13-15 11-12-14 12-14 12-14-15 12-14-15',
      'E@3 2-3-5 3-5 2-4-5 2-4-5 2-3-5 3-5',
      'E@15 14-15 15 14 14 14-15 15',
      'D@5 5-7 5-7-8 4-5-7 4-5-7 5-7 5-7-8',
    ],
    'Gm': [
      'C@8 8-10 8-10-11 7-8-10 7-8-10 8-10 8-10-11',
      'A@-2 1 1 0 0-1 0-1 1',
      'A@10 10-11-13 10-11-13 10-12 10-12-13 10-12-13 10-11-13',
      'G@1 1-3 1-3-4 0-2-3 0-1-3 0-1-3 1-3',
      'G@13 13-15 13-15 12-14-15 12-13-15 12-13-15 13-15',
      'E@3 3-5-6 3-4-6 2-3-5 3-5 3-5-6 3-5-6',
      'E@15 15 15 14-15 15 15 15',
      'D@6 5-6-8 6-8 5-7-8 5-7-8 5-6-8 6-8',
    ],
    'A': [
      'C@-3 0 0 . 0 0 0',
      'C@9 9-10-12 9-10-12 9-11 9-11-12 9-11-12 9-10-12',
      'A@0 0-2 0-2-3 1-2 0-2 0-2 0-2',
      'A@12 12-14 12-14-15 11-13-14 11-12-14 11-12-14 12-14',
      'G@2 2-4-5 2-3-5 1-2-4 2-4 2-4-5 2-4-5',
      'G@14 14 14-15 13-14 14 14 14',
      'E@5 4-5-7 5-7 4-6-7 4-6-7 4-5-7 5-7',
      'D@7 7-9 7-9-10 6-7-9 6-7-9 7-9 7-9-10',
    ],
    'Am': [
      'C@-2 0 0-1 0 0 0 0-1',
      'C@10 10-12 10-12-13 9-10-12 9-10-12 10-12 10-12-13',
      'A@0 0-1-3 0-1-3 0-2 0-2-3 0-2-3 0-1-3',
      'A@12 12-13-15 12-13-15 12-14 12-14-15 12-14-15 12-13-15',
      'G@3 3-5 3-5-6 2-4-5 2-3-5 2-3-5 3-5',
      'G@15 15 15 14 14-15 14-15 15',
      'E@5 5-7-8 5-6-8 4-5-7 5-7 5-7-8 5-7-8',
      'D@8 7-8-10 8-10 7-9-10 7-9-10 7-8-10 8-10',
    ],
  };

  function testScaleBoxesAreUnchanged(t){
    const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
    Object.entries(SCALE_BOXES).forEach(([key, expected]) => {
      const isMinor = key.endsWith('m');
      const rootPc = SEMITONE[key.replace(/m$/, '')] % 12;
      const pcs = new Set((isMinor ? MIN : MAJ).map(o => (rootPc + o) % 12));
      const got = scaleBoxPlacements(rootPc, isMinor, pcs).map(b => {
        const byString = {};
        b.cells.forEach(c => { (byString[c.string] = byString[c.string] || []).push(c.fret); });
        const strings = [0, 1, 2, 3, 4, 5]
          .map(s => (byString[s] || []).sort((a, x) => a - x).join('-') || '.');
        return `${b.name}@${b.anchor} ${strings.join(' ')}`;
      });
      t.equal(got.join('\n'), expected.join('\n'), `${key}: its scale boxes are where they were`);
    });
  }


  // The pentatonic boxes, checked by hand and pinned here. Scale boxes are
  // grown from these, so a change meant for the scales must not reach back and
  // move the shapes they were grown from — which is exactly what this catches.
  const PENTA_BOXES = {
    'C': [
      'C@0 0-3 1-3 0-2 0-2 0-3 0-3',
      'C@12 12-15 13-15 12-14 12-14 12-15 12-15',
      'A@3 3-5 3-5 2-5 2-5 3-5 3-5',
      'A@15 15 15 14 14 15 15',
      'G@5 5-8 5-8 5-7 5-7 5-7 5-8',
      'E@8 8-10 8-10 7-9 7-10 7-10 8-10',
      'D@-2 0 1 0 0 0 0',
      'D@10 10-12 10-13 9-12 10-12 10-12 10-12',
    ],
    'Cm': [
      'C@1 1-3 1-4 0-3 1-3 1-3 1-3',
      'C@13 13-15 13 12-15 13-15 13-15 13-15',
      'A@3 3-6 4-6 3-5 3-5 3-6 3-6',
      'A@15 15 . 15 15 15 15',
      'G@6 6-8 6-8 5-8 5-8 6-8 6-8',
      'E@8 8-11 8-11 8-10 8-10 8-10 8-11',
      'D@-1 1 1 0 1 1 1',
      'D@11 11-13 11-13 10-12 10-13 10-13 11-13',
    ],
    'G': [
      'C@7 7-10 8-10 7-9 7-9 7-10 7-10',
      'A@-2 0 0 0 0 0 0',
      'A@10 10-12 10-12 9-12 9-12 10-12 10-12',
      'G@0 0-3 0-3 0-2 0-2 0-2 0-3',
      'G@12 12-15 12-15 12-14 12-14 12-14 12-15',
      'E@3 3-5 3-5 2-4 2-5 2-5 3-5',
      'E@15 15 15 14 14 14 15',
      'D@5 5-7 5-8 4-7 5-7 5-7 5-7',
    ],
    'Gm': [
      'C@8 8-10 8-11 7-10 8-10 8-10 8-10',
      'A@-2 1 1 0 0 1 1',
      'A@10 10-13 11-13 10-12 10-12 10-13 10-13',
      'G@1 1-3 1-3 0-3 0-3 1-3 1-3',
      'G@13 13-15 13-15 12-15 12-15 13-15 13-15',
      'E@3 3-6 3-6 3-5 3-5 3-5 3-6',
      'E@15 15 15 15 15 15 15',
      'D@6 6-8 6-8 5-7 5-8 5-8 6-8',
    ],
    'A': [
      'C@-3 0 0 . . 0 0',
      'C@9 9-12 10-12 9-11 9-11 9-12 9-12',
      'A@0 0-2 0-2 2 2 0-2 0-2',
      'A@12 12-14 12-14 11-14 11-14 12-14 12-14',
      'G@2 2-5 2-5 2-4 2-4 2-4 2-5',
      'G@14 14 14 14 14 14 14',
      'E@5 5-7 5-7 4-6 4-7 4-7 5-7',
      'D@7 7-9 7-10 6-9 7-9 7-9 7-9',
    ],
    'Am': [
      'C@-2 0 1 0 0 0 0',
      'C@10 10-12 10-13 9-12 10-12 10-12 10-12',
      'A@0 0-3 1-3 0-2 0-2 0-3 0-3',
      'A@12 12-15 13-15 12-14 12-14 12-15 12-15',
      'G@3 3-5 3-5 2-5 2-5 3-5 3-5',
      'G@15 15 15 14 14 15 15',
      'E@5 5-8 5-8 5-7 5-7 5-7 5-8',
      'D@8 8-10 8-10 7-9 7-10 7-10 8-10',
    ],
  };

  function testPentatonicBoxesAreUnchanged(t){
    Object.entries(PENTA_BOXES).forEach(([key, expected]) => {
      const isMinor = key.endsWith('m');
      const rootPc = SEMITONE[key.replace(/m$/, '')] % 12;
      const got = pentaBoxPlacements(rootPc, isMinor).map(b => {
        const byString = {};
        b.cells.forEach(c => { (byString[c.string] = byString[c.string] || []).push(c.fret); });
        const strings = [0, 1, 2, 3, 4, 5]
          .map(s => (byString[s] || []).sort((a, x) => a - x).join('-') || '.');
        return `${b.name}@${b.anchor} ${strings.join(' ')}`;
      });
      t.equal(got.join('\n'), expected.join('\n'), `${key}: its pentatonic boxes are where they were`);
    });
  }


  // The CAGED arpeggio boxes, pinned. Unlike the scale and pentatonic shapes
  // above these are not a judgement about where a note is best fingered —
  // the box is every chord tone inside a hand span, so there is nothing to
  // choose. What is worth holding still is where each box sits and how wide
  // it opens: those decide which stretch of neck a position covers, and the
  // position is what the readings quarrel over (B26, B28, B32).
  //
  // "shape@anchor window strings" — the frets on each string, high e first.
  const ARP_BOXES = {
    'C': [
      'C@0 0-3 0-3 1 0 2 3 0-3',
      'C@12 12-15 12-15 13 12 14 15 12-15',
      'A@3 3-6 3 5 5 5 3 3',
      'G@5 5-8 8 5-8 5 5 7 8',
      'E@8 8-11 8 8 9 10 10 8',
      'D@10 10-13 12 13 12 10 10 12',
    ],
    'Cm': [
      'C@11 11-15 11-15 13 12 13 15 11-15',
      'A@3 3-6 3 4 5 5 3-6 3',
      'G@4 4-8 8 4-8 5-8 5 6 8',
      'E@8 8-11 8-11 8 8 10 10 8-11',
      'D@10 10-13 11 13 12 10-13 10 11',
    ],
    'C7': [
      'C@0 0-3 0-3 1 0-3 2 1-3 0-3',
      'C@12 12-15 12-15 13 12-15 14 13-15 12-15',
      'A@3 3-6 3-6 5 3-5 5 3 3-6',
      'G@5 5-8 6-8 5-8 5 5-8 7 6-8',
      'E@8 8-11 8 8-11 9 8-10 10 8',
      'D@10 10-13 12 11-13 12 10 10-13 12',
    ],
    'Cm7': [
      'C@11 11-15 11-15 11-13 12-15 13 13-15 11-15',
      'A@3 3-6 3-6 4 3-5 5 3-6 3-6',
      'G@4 4-8 6-8 4-8 5-8 5-8 6 6-8',
      'E@8 8-11 8-11 8-11 8 8-10 10 8-11',
      'D@10 10-13 11 11-13 12 10-13 10-13 11',
    ],
    'G': [
      'C@7 7-10 7-10 8 7 9 10 7-10',
      'A@10 10-13 10 12 12 12 10 10',
      'G@0 0-3 3 0-3 0 0 2 3',
      'G@12 12-15 15 12-15 12 12 14 15',
      'E@3 3-6 3 3 4 5 5 3',
      'D@5 5-8 7 8 7 5 5 7',
    ],
    'Am': [
      'C@8 8-12 8-12 10 9 10 12 8-12',
      'A@0 0-3 0 1 2 2 0-3 0',
      'A@12 12-15 12 13 14 14 12-15 12',
      'G@1 1-5 5 1-5 2-5 2 3 5',
      'E@5 5-8 5-8 5 5 7 7 5-8',
      'D@7 7-10 8 10 9 7-10 7 8',
    ],
  };

  // the tones a chord is made of, which is all an arpeggio box is filled from
  function tonePcsOf(chord){
    return new Set([chord.note, chord.third, chord.fifth, chord.seventh]
      .filter(Boolean).map(n => SEMITONE[n] % 12));
  }

  function arpBoxLines(name){
    const chord = chordFromName(name, 0, 'major');
    const rootPc = SEMITONE[chord.note] % 12;
    return cagedArpeggioBoxes(rootPc, chord.quality === 'min', tonePcsOf(chord)).map(b => {
      const byString = {};
      b.cells.forEach(c => { (byString[c.string] = byString[c.string] || []).push(c.fret); });
      const strings = [0, 1, 2, 3, 4, 5]
        .map(s => (byString[s] || []).sort((a, x) => a - x).join('-') || '.');
      return `${b.name}@${b.anchor} ${b.window.min}-${b.window.max} ${strings.join(' ')}`;
    });
  }

  function testArpeggioBoxesAreUnchanged(t){
    Object.entries(ARP_BOXES).forEach(([name, expected]) => {
      t.equal(arpBoxLines(name).join('\n'), expected.join('\n'),
              `${name}: its arpeggio boxes are where they were`);
    });
  }

  // A snapshot pins whatever it was shown, so it wants an invariant beside it
  // that knows what right looks like. An arpeggio box is every chord tone
  // under the hand: nothing in reach may be left out, and nothing that isn't
  // a chord tone may be in. That holds whatever the boxes are moved to.
  function testArpeggioBoxesHoldEveryToneInReach(t){
    const bad = [];
    ['C', 'Cm', 'C7', 'Cm7', 'CM7', 'F#', 'Ebm7', 'Am'].forEach(name => {
      const chord = chordFromName(name, 0, 'major');
      const rootPc = SEMITONE[chord.note] % 12;
      const tonePcs = tonePcsOf(chord);
      cagedArpeggioBoxes(rootPc, chord.quality === 'min', tonePcs).forEach(b => {
        const where = `${name} ${b.name}@${b.anchor}`;
        const drawn = new Set(b.cells.map(c => `${c.string}:${c.fret}`));
        for (let s = 0; s < 6; s++){
          for (let f = b.window.min; f <= b.window.max; f++){
            const isTone = tonePcs.has((STRING_TUNING[s] + f) % 12);
            const has = drawn.has(`${s}:${f}`);
            if (isTone && !has) bad.push(`${where}: string ${s} fret ${f} is a chord tone left out`);
            if (!isTone && has) bad.push(`${where}: string ${s} fret ${f} is not a chord tone`);
          }
        }
        b.cells.forEach(c => {
          if (c.fret < b.window.min || c.fret > b.window.max){
            bad.push(`${where}: a note at fret ${c.fret} sits outside the box`);
          }
        });
        if (b.window.min < 0 || b.window.max > FRET_COUNT){
          bad.push(`${where}: the box runs off the neck, ${b.window.min}-${b.window.max}`);
        }
      });
    });
    t.equal(bad.slice(0, 4).join('; '), '', 'An arpeggio box holds every chord tone under the hand, and nothing else');
  }


  // The close triads the Triads view is made of, pinned. "startFret frets /bass"
  // — the frets low string to high, and which chord tone is underneath.
  // Checked against the shapes players actually use: C on the top three
  // strings runs 0-1-0, 5-5-3, 9-8-8 through its inversions, and Am runs
  // 2-1-0, 5-5-5, 9-10-8.
  const TRIAD_SETS = {
    'C set2': ['0 0-1-0 /G', '3 5-5-3 /C', '8 9-8-8 /E', '12 12-13-12 /G'],
    'C set3': ['0 2-0-1 /E', '5 5-5-5 /G', '8 10-9-8 /C', '12 14-12-13 /E'],
    'C set4': ['0 3-2-0 /C', '5 7-5-5 /E', '9 10-10-9 /G', '12 15-14-12 /C'],
    'C set5': ['2 3-3-2 /G', '5 8-7-5 /C', '10 12-10-10 /E', '14 15-15-14 /G'],
    'Am set2': ['0 2-1-0 /A', '5 5-5-5 /C', '8 9-10-8 /E', '12 14-13-12 /A'],
    'Am set5': ['2 5-3-2 /A', '7 8-7-7 /C', '10 12-12-10 /E'],
  };

  function triadSetLines(name, lowString){
    const chord = chordFromName(name, 0, 'major');
    const tonePcs = new Set([chord.note, chord.third, chord.fifth].map(n => SEMITONE[n] % 12));
    return stringSetTriads(lowString, tonePcs)
      .map(v => `${v.startFret} ${v.cells.map(c => c.fret).join('-')} /${NOTE_NAMES_SHARP[v.bassPc]}`);
  }

  function testTriadShapesAreUnchanged(t){
    Object.entries(TRIAD_SETS).forEach(([key, expected]) => {
      const [name, set] = key.split(' set');
      t.equal(triadSetLines(name, Number(set)).join('\n'), expected.join('\n'),
              `${key}: its close triads are where they were`);
    });
  }

  // What makes a close triad one: three notes on three adjacent strings, one
  // of each chord tone, rising in pitch across the set, inside an octave and
  // inside a hand's reach. Beside the snapshot because a snapshot only knows
  // what it was shown — this knows what a triad is.
  function testCloseTriadsAreCloseTriads(t){
    const bad = [];
    const HAND = 4;
    ['C', 'Am', 'F#', 'Ebm', 'Bdim'].forEach(name => {
      const chord = chordFromName(name, 0, 'major');
      const tonePcs = new Set([chord.note, chord.third, chord.fifth].map(n => SEMITONE[n] % 12));
      [2, 3, 4, 5].forEach(lowString => {
        stringSetTriads(lowString, tonePcs).forEach(v => {
          const where = `${name} set ${lowString} at ${v.startFret}`;
          const strings = v.cells.map(c => c.string);
          const frets = v.cells.map(c => c.fret);
          if (strings.join() !== [lowString, lowString - 1, lowString - 2].join()){
            bad.push(`${where}: sits on strings ${strings.join('-')} rather than three adjacent ones`);
          }
          const pcs = v.cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12);
          if (new Set(pcs).size !== 3 || pcs.some(pc => !tonePcs.has(pc))){
            bad.push(`${where}: is not one of each chord tone`);
          }
          const notes = v.cells.map(c => STRING_MIDI[c.string] + c.fret);
          if (notes[1] <= notes[0] || notes[2] <= notes[1]) bad.push(`${where}: does not rise across the set`);
          if (notes[2] - notes[0] >= 12) bad.push(`${where}: spans an octave or more, so it isn't close`);
          if (Math.max(...frets) - Math.min(...frets) > HAND) bad.push(`${where}: is wider than a hand`);
          if (frets.some(f => f < 0 || f > FRET_COUNT)) bad.push(`${where}: runs off the neck`);
          if (v.bassPc !== pcs[0]) bad.push(`${where}: names the wrong tone underneath`);
        });
      });
    });
    t.equal(bad.slice(0, 4).join('; '), '', 'Every close triad is three rising chord tones under one hand');
  }

  // Turning a CAGED triad into its 7th-chord voicing is a judgement — which
  // note a player actually flattens — so the whole matrix is pinned rather
  // than the two cases that used to stand for it. These are the everyday
  // shapes: open C7 x-3-2-3-1-0, open G7 3-2-0-0-0-1, the E-shape maj7 barre
  // 5-7-6-6-5-5, the A-shape m7 x-3-5-3-4-3.
  const SEVENTH_GRIPS = {
    'Cmaj7': [
      'C@0 x-3-2-0-1-0 -> x-3-2-0-0-0',
      'C@12 x-15-14-12-13-12 -> x-15-14-12-12-12',
      'A@3 x-3-5-5-5-3 -> x-3-5-4-5-3',
      'G@5 8-7-5-5-5-8 -> 8-7-5-5-5-7',
      'E@8 8-10-10-9-8-8 -> 8-10-9-9-8-8',
      'D@10 x-x-10-12-13-12 -> x-x-10-12-12-12',
    ],
    'C7': [
      'C@0 x-3-2-0-1-0 -> x-3-2-3-1-0',
      'C@12 x-15-14-12-13-12 -> x-15-14-12-11-12',
      'A@3 x-3-5-5-5-3 -> x-3-5-3-5-3',
      'G@5 8-7-5-5-5-8 -> 8-7-5-5-5-6',
      'E@8 8-10-10-9-8-8 -> 8-10-8-9-8-8',
      'D@10 x-x-10-12-13-12 -> x-x-10-12-11-12',
    ],
    'Cm7': [
      'C@11 x-15-13-12-13-11 -> x-15-13-12-11-11',
      'A@3 x-3-5-5-4-3 -> x-3-5-3-4-3',
      'G@4 8-6-5-5-4-8 -> 8-6-5-5-4-6',
      'E@8 8-10-10-8-8-8 -> 8-10-8-8-8-8',
      'D@10 x-x-10-12-13-11 -> x-x-10-12-11-11',
    ],
    'Gmaj7': [
      'C@7 x-10-9-7-8-7 -> x-10-9-7-7-7',
      'A@10 x-10-12-12-12-10 -> x-10-12-11-12-10',
      'G@0 3-2-0-0-0-3 -> 3-2-0-0-0-2',
      'G@12 15-14-12-12-12-15 -> 15-14-12-12-12-14',
      'E@3 3-5-5-4-3-3 -> 3-5-4-4-3-3',
      'D@5 x-x-5-7-8-7 -> x-x-5-7-7-7',
    ],
    'G7': [
      'C@7 x-10-9-7-8-7 -> x-10-9-7-6-7',
      'A@10 x-10-12-12-12-10 -> x-10-12-10-12-10',
      'G@0 3-2-0-0-0-3 -> 3-2-0-0-0-1',
      'G@12 15-14-12-12-12-15 -> 15-14-12-12-12-13',
      'E@3 3-5-5-4-3-3 -> 3-5-3-4-3-3',
      'D@5 x-x-5-7-8-7 -> x-x-5-7-6-7',
    ],
    'Am7': [
      'C@8 x-12-10-9-10-8 -> x-12-10-9-8-8',
      'A@0 x-0-2-2-1-0 -> x-0-2-0-1-0',
      'A@12 x-12-14-14-13-12 -> x-12-14-12-13-12',
      'G@1 5-3-2-2-1-5 -> 5-3-2-2-1-3',
      'E@5 5-7-7-5-5-5 -> 5-7-5-5-5-5',
      'D@7 x-x-7-9-10-8 -> x-x-7-9-8-8',
    ],
    'A7': [
      'C@9 x-12-11-9-10-9 -> x-12-11-9-8-9',
      'A@0 x-0-2-2-2-0 -> x-0-2-0-2-0',
      'A@12 x-12-14-14-14-12 -> x-12-14-12-14-12',
      'G@2 5-4-2-2-2-5 -> 5-4-2-2-2-3',
      'E@5 5-7-7-6-5-5 -> 5-7-5-6-5-5',
      'D@7 x-x-7-9-10-9 -> x-x-7-9-8-9',
    ],
  };

  function seventhGripLines(name){
    const chord = chordFromName(name, 0, 'major');
    const rootPc = SEMITONE[chord.note] % 12;
    const sevPc = SEMITONE[chord.seventh] % 12;
    const shapes = chord.quality === 'min' ? CAGED_MINOR : CAGED_MAJOR;
    return cagedPlacements(rootPc, shapes).map(p =>
      `${p.name}@${p.fretMin} ${grip(p.cells)} -> ${grip(seventhCells(p, rootPc, sevPc))}`);
  }

  function testSeventhVoicingsAreUnchanged(t){
    Object.entries(SEVENTH_GRIPS).forEach(([name, expected]) => {
      t.equal(seventhGripLines(name).join('\n'), expected.join('\n'),
              `${name}: its 7th-chord voicings are where they were`);
    });
  }

  // A 7th voicing is the triad with one note moved: the same strings, one
  // fret different, and the note that moved is now the 7th.
  function testSeventhVoicingsMoveOneNote(t){
    const bad = [];
    ['Cmaj7', 'C7', 'Cm7', 'G7', 'Am7', 'F#m7', 'Ebmaj7'].forEach(name => {
      const chord = chordFromName(name, 0, 'major');
      const rootPc = SEMITONE[chord.note] % 12;
      const sevPc = SEMITONE[chord.seventh] % 12;
      const shapes = chord.quality === 'min' ? CAGED_MINOR : CAGED_MAJOR;
      cagedPlacements(rootPc, shapes).forEach(p => {
        const after = seventhCells(p, rootPc, sevPc);
        const where = `${name} ${p.name}@${p.fretMin}`;
        if (after.length !== p.cells.length){ bad.push(`${where}: changed how many notes it has`); return; }
        if (after.map(c => c.string).sort().join() !== p.cells.map(c => c.string).sort().join()){
          bad.push(`${where}: moved to different strings`);
          return;
        }
        const moved = after.filter((c, i) => c.fret !== p.cells[i].fret);
        if (moved.length !== 1){ bad.push(`${where}: moved ${moved.length} notes, not one`); return; }
        const pc = (STRING_TUNING[moved[0].string] + moved[0].fret) % 12;
        if (pc !== sevPc) bad.push(`${where}: the note it moved landed on ${NOTE_NAMES_SHARP[pc]}, not the 7th`);
        if (moved[0].fret < 0 || moved[0].fret > FRET_COUNT) bad.push(`${where}: the moved note runs off the neck`);
      });
    });
    t.equal(bad.slice(0, 4).join('; '), '', 'A 7th voicing is the triad with one note moved onto the 7th');
  }

  // What the finder puts your fingers on, pinned — the grip, then a finger per
  // string low E first (x muted, 0 open, 1 index … 4 little).
  //
  // Checked against how these are taught rather than only against themselves:
  // C is index-middle-ring off the B string, Am the same across D, G and B,
  // G is middle-index-ring, A index-middle-ring, Dm middle-ring-index, the F
  // barre takes ring on the A string, little on the D and middle on the G,
  // the B barre is the index across the 2nd fret with middle, ring and little
  // on the 4th, and B7 goes index-middle-ring-little. Em is fingered middle
  // and ring, which is E major with the index lifted — see
  // CONVENTIONAL_FINGERING, since no rule about frets can tell it from Asus2,
  // the same shape fingered index and middle.
  const FINGERINGS = {
    'C': 'x-3-2-0-1-0  x-3-2-0-1-0',
    'G': '3-2-0-0-0-3  2-1-0-0-0-3',
    'D': 'x-x-0-2-3-2  x-x-0-1-3-2',
    'A': 'x-0-2-2-2-0  x-0-1-2-3-0',
    'E': '0-2-2-1-0-0  0-2-3-1-0-0',
    'Am': 'x-0-2-2-1-0  x-0-2-3-1-0',
    'Em': '0-2-2-0-0-0  0-2-3-0-0-0',
    'Dm': 'x-x-0-2-3-1  x-x-0-2-3-1',
    'F': '1-3-3-2-1-1  1-3-4-2-1-1  barre 1@0-5',
    'Bm': 'x-2-4-4-3-2  x-1-3-4-2-1  barre 2@0-4',
    'B': 'x-2-4-4-4-2  x-1-2-3-4-1  barre 2@0-4',
    'Bb': 'x-1-3-3-3-1  x-1-2-3-4-1  barre 1@0-4',
    'F#m': '2-4-4-2-2-2  1-2-3-1-1-1  barre 2@0-5',
    'C7': 'x-3-2-3-1-0  x-3-2-4-1-0',
    'G7': '3-2-0-0-0-1  3-2-0-0-0-1',
    'D7': 'x-x-0-2-1-2  x-x-0-2-1-3',
    'A7': 'x-0-2-0-2-0  x-0-1-0-2-0',
    'E7': '0-2-0-1-0-0  0-2-0-1-0-0',
    'B7': 'x-2-1-2-0-2  x-2-1-3-0-4',
    'Cmaj7': 'x-3-2-0-0-0  x-2-1-0-0-0',
    'Fmaj7': '1-0-2-2-1-0  1-0-3-4-2-0',
    'Am7': 'x-0-2-0-1-0  x-0-2-0-1-0',
    'Em7': '0-2-0-0-0-0  0-1-0-0-0-0',
  };

  function fingeringLine(name){
    const p = parseChordName(name);
    const v = findChordVoicings(p.rootPc, p.formula, { bassPc: p.bassPc })[0];
    if (!v) return '(no shape)';
    const at = new Map(v.cells.map(c => [c.string, c.fret]));
    const by = (v.fingering && v.fingering.fingerByString) || {};
    const cell = s => at.has(s) ? at.get(s) : 'x';
    const finger = s => !at.has(s) ? 'x' : at.get(s) === 0 ? '0' : (by[s] || '-');
    const order = [5, 4, 3, 2, 1, 0];
    const barres = ((v.fingering && v.fingering.barres) || [])
      .map(b => `${b.fret}@${b.fromString}-${b.toString}`).join(' ');
    return `${order.map(cell).join('-')}  ${order.map(finger).join('-')}` + (barres ? `  barre ${barres}` : '');
  }

  function testFingeringsAreUnchanged(t){
    Object.entries(FINGERINGS).forEach(([name, expected]) => {
      t.equal(fingeringLine(name), expected, `${name}: is fingered the way it was`);
    });
  }

  // What makes a fingering playable, whatever the shapes become: four fingers
  // at most, every stopped note has one, a finger appears at one fret only —
  // and across two frets a lower one never takes a higher finger, which is
  // the ordering a hand actually falls into. A finger on more than one string
  // has to be a barre: one fret, strings next to each other.
  function testFingeringsArePlayable(t){
    const bad = [];
    CHORDS.forEach(name => {
      const p = parseChordName(name);
      if (!p) return;
      findChordVoicings(p.rootPc, p.formula, { bassPc: p.bassPc }).forEach(v => {
        const f = v.fingering;
        if (!f) return;
        const where = `${name} ${grip(v.cells)}`;
        const by = f.fingerByString || {};
        const at = new Map(v.cells.map(c => [c.string, c.fret]));
        const fretOf = {};                            // finger -> the frets it is asked to hold
        const stringsOf = {};
        v.cells.forEach(c => {
          const finger = by[c.string];
          if (c.fret === 0){
            if (finger) bad.push(`${where}: an open string is given finger ${finger}`);
            return;
          }
          if (!finger){ bad.push(`${where}: string ${c.string} at fret ${c.fret} has no finger`); return; }
          if (finger < 1 || finger > 4) bad.push(`${where}: uses a finger numbered ${finger}`);
          (fretOf[finger] = fretOf[finger] || new Set()).add(c.fret);
          (stringsOf[finger] = stringsOf[finger] || []).push(c.string);
        });
        Object.entries(fretOf).forEach(([finger, frets]) => {
          if (frets.size > 1) bad.push(`${where}: finger ${finger} is at frets ${[...frets].join(' and ')}`);
        });
        // A finger on more than one string is a barre — it lies across a
        // range, and the strings between may be stopped higher up by other
        // fingers, so what matters is that they all fall inside its reach.
        Object.entries(stringsOf).forEach(([finger, strings]) => {
          if (strings.length < 2) return;
          const fret = [...fretOf[finger]][0];
          const barre = (f.barres || []).find(b => b.finger === Number(finger) && b.fret === fret);
          if (!barre){
            bad.push(`${where}: finger ${finger} holds ${strings.length} strings with no barre to lie across`);
            return;
          }
          const outside = strings.filter(x => x < barre.fromString || x > barre.toString);
          if (outside.length){
            bad.push(`${where}: finger ${finger} holds string ${outside[0]}, outside the barre it lies across`);
          }
        });
        // the ordering: a note further down the neck never takes a higher finger
        v.cells.filter(c => c.fret > 0).forEach(a => {
          v.cells.filter(c => c.fret > 0).forEach(b => {
            if (a.fret < b.fret && by[a.string] > by[b.string]){
              bad.push(`${where}: fret ${a.fret} takes finger ${by[a.string]} while fret ${b.fret} takes ${by[b.string]}`);
            }
          });
        });
        const used = new Set(Object.values(by).filter(Boolean));
        if (used.size > 4) bad.push(`${where}: wants ${used.size} fingers`);
      });
    });
    t.equal(bad.slice(0, 4).join('; '), '', 'Every fingering is one a hand can make');
  }

  // A triad can drop its 5th and still be itself — root and 3rd say major or
  // minor on their own, which is why the shell voicings work. A sus chord
  // can't: its sus note is heard against the 5th, and root plus 4th alone is
  // a bare fourth that reads as a power chord on the note above. This app's
  // own reverse finder calls D and G "G5" before it calls it "Dsus4". So
  // every shape offered for a sus chord has to carry all three notes.
  function testSusChordsKeepTheirFifth(t){
    const bad = [];
    ['Dsus4', 'Asus2', 'Esus4', 'Csus2', 'Gsus4', 'Dsus2', 'Fsus4', 'Bbsus2'].forEach(name => {
      const p = parseChordName(name);
      if (!p){ bad.push(`${name}: doesn't parse`); return; }
      const fifth = (p.rootPc + 7) % 12;
      const without = findChordVoicings(p.rootPc, p.formula, { bassPc: p.bassPc })
        .filter(v => !v.cells.some(c => (STRING_TUNING[c.string] + c.fret) % 12 === fifth));
      if (without.length){
        bad.push(`${name}: ${without.length} of its shapes have no 5th, such as ${grip(without[0].cells)}`);
      }
    });
    t.equal(bad.join('; '), '', 'A sus chord is never offered without its 5th');
  }

  // What a scale box is for: you can play the scale up through it without a
  // note going missing. The boxes used to be worked out from the pentatonic
  // ones by filling gaps of a minor third, which left every single box with a
  // hole in it — the 2 absent from an octave, the b6 absent from another. They
  // are written out now, so this is what keeps them honest, over all seven
  // modes and all twelve roots. A box running off the end of the neck is
  // partial by definition and is not asked to be complete.
  function testScaleBoxesHaveNoHoles(t){
    const MODES = {
      '0,2,4,5,7,9,11': 'Ionian',    '0,2,3,5,7,9,10': 'Dorian',
      '0,1,3,5,7,8,10': 'Phrygian',  '0,2,4,6,7,9,11': 'Lydian',
      '0,2,4,5,7,9,10': 'Mixolydian', '0,2,3,5,7,8,10': 'Aeolian',
      '0,1,3,5,6,8,10': 'Locrian',
    };
    const holes = [];
    let whole = 0, widest = 0;
    Object.keys(MODES).forEach(signature => {
      const steps = signature.split(',').map(Number);
      const sizes = steps.map((o, i) => ((steps[(i + 1) % 7] - o) + 12) % 12);
      for (let root = 0; root < 12; root++){
        const pcs = new Set(steps.map(o => (root + o) % 12));
        const boxes = scaleBoxPlacements(root, steps.indexOf(3) >= 0, pcs);
        const fullest = {};
        boxes.forEach(b => {
          if (!fullest[b.name] || b.cells.length > fullest[b.name]) fullest[b.name] = b.cells.length;
        });
        boxes.forEach(b => {
          if (b.anchor < 0 || b.anchor > FRET_COUNT) return;
          if (b.cells.length < fullest[b.name]) return;      // clipped by the nut or the 15th
          whole++;
          const frets = b.cells.map(c => c.fret);
          widest = Math.max(widest, Math.max(...frets) - Math.min(...frets) + 1);
          b.cells.forEach(c => {
            if (!pcs.has((STRING_TUNING[c.string] + c.fret) % 12))
              holes.push(`${MODES[signature]} ${b.name}: a note that isn't in the scale`);
          });
          const run = [...new Set(b.cells.map(c => STRING_MIDI[c.string] + c.fret))].sort((a, x) => a - x);
          for (let i = 0; i < run.length - 1; i++){
            if (!sizes.includes(run[i + 1] - run[i]))
              holes.push(`${MODES[signature]} ${b.name}@${b.anchor}: the scale skips a note`);
          }
        });
      }
    });
    t.equal([...new Set(holes)].join('; '), '',
      `Every scale box is a run you can play, in all seven modes (${whole} boxes, widest ${widest} frets)`);
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
      ['Chord finder sorts common first and names the kind', testShapesAreSortedAndNamed],
      ['Chord finder tells open shapes from movable ones', testTheShapeFilter],
      ['Every chord name the app writes parses back', testEveryChordNameParsesBack],
      ['Ear trainer: every note of a shape is one answer', testTheEarTrainerCoversItsShape],
      ['Ear trainer: every scale it offers has boxes of its own', testEveryScaleHasItsBoxes],
      ['Ear trainer: one octave of a box is one octave of it', testOneOctaveOfABox],
      ['Ear trainer: every chord quality it can ask, it can play', testEveryQualityCanBeAsked],
      ['Every note the neck can play has a recording near it', testEveryNoteHasARecording],
      ['Every chord the practice tab plays has recordings for it', testEveryChordFitsTheRecordings],
      ['The piano map covers both layers end to end', testThePianoMapIsWhole],
      ['The suggested parts realise inside the reading', testTheSuggestedParts],
      ['The engine sleeps when idle, never while playing', testTheEngineSleepsButNotWhilePlaying],
      ['Every bass note every style can play has a recording', testEveryBassNoteHasARecording],
      ['Every style carries the Voice choice', testTheVoiceReachesEveryStyle],
      ['Every note the genre examples play has a recording', testGenreNotesHaveRecordings],
      ['Theory: naming and identification', testTheory],
      ['Theory: one answer for what degree a note is', testDegreeNamesAgree],
      ['Fretboard: the pentatonic boxes are unchanged', testPentatonicBoxesAreUnchanged],
      ['Fretboard: the scale boxes are unchanged', testScaleBoxesAreUnchanged],
      ['Fretboard: every scale box is playable', testScaleBoxesHaveNoHoles],
      ['Fretboard: the arpeggio boxes are unchanged', testArpeggioBoxesAreUnchanged],
      ['Fretboard: an arpeggio box holds every tone in reach', testArpeggioBoxesHoldEveryToneInReach],
      ['Fretboard: the close triads are unchanged', testTriadShapesAreUnchanged],
      ['Fretboard: every close triad is one', testCloseTriadsAreCloseTriads],
      ['Fretboard: the 7th-chord voicings are unchanged', testSeventhVoicingsAreUnchanged],
      ['Fretboard: a 7th voicing moves one note', testSeventhVoicingsMoveOneNote],
      ['Finder: the fingerings are unchanged', testFingeringsAreUnchanged],
      ['Finder: every fingering is playable', testFingeringsArePlayable],
      ['Finder: a sus chord keeps its 5th', testSusChordsKeepTheirFifth],
      ['Genre library and presets are well-formed', testData],
    ].concat(GT.fretboardSuites || []).concat(GT.earSuites || [])
     .concat(GT.practiceSuites || []);   // added by the tests-*.js files, if they loaded
    const out = [];
    suites.forEach(([title, fn]) => {
      const from = results.length;
      // A suite that throws used to take the page down with it, and a page
      // with no results at all says less than a red line does — least of all
      // when what threw is the thing the suite was written to catch.
      try {
        fn(t);
      } catch (e){
        t.equal(String(e && e.message || e), '', `${title}: threw before it could finish`);
      }
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
