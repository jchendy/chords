// The genre library: for each style, the chord progressions, rhythm patterns
// and lead lines that make it sound like itself, plus the code that turns a
// (progression × rhythm) pair into notes on the neck.
//
// Everything here is the generic vocabulary a method book teaches — twelve-bar
// forms, ii–V–I, pentatonic shapes, strumming patterns — not transcriptions of
// particular recordings.
//
// Pure: no DOM, no audio. Depends only on theory and fretboard.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { SEMITONE, parseChordName } = GT.theory;
  const { STRING_TUNING, FRET_COUNT } = GT.fretboard;

  // ---------------------------------------------------------------- voicings
  //
  // Fret offsets per string (index 0 = high e ... 5 = low E) relative to the
  // root's fret on string `ref`. null = string not played. These are the grips
  // themselves rather than search results, because a genre calls for a
  // particular shape — a punk power chord, a jazz shell — not just any voicing.
  const VOICINGS = {
    power6:  { ref: 5, offs: [null, null, null, 2, 2, 0] },      // root on the 6th string
    power5:  { ref: 4, offs: [null, null, 2, 2, 0, null] },      // root on the 5th
    barre6:  { ref: 5, offs: [0, 0, 1, 2, 2, 0] },               // E-shape major
    barre5:  { ref: 4, offs: [0, 2, 2, 2, 0, null] },            // A-shape major
    min6:    { ref: 5, offs: [0, 0, 0, 2, 2, 0] },               // E-shape minor
    min5:    { ref: 4, offs: [0, 1, 2, 2, 0, null] },            // A-shape minor
    dom6:    { ref: 5, offs: [0, 0, 1, 0, 2, 0] },               // E-shape 7
    dom5:    { ref: 4, offs: [0, 2, 0, 2, 0, null] },            // A-shape 7
    m7_6:    { ref: 5, offs: [0, 0, 0, 0, 2, 0] },               // E-shape m7
    m7_5:    { ref: 4, offs: [0, 1, 0, 2, 0, null] },            // A-shape m7
    maj7_6:  { ref: 5, offs: [0, 0, 1, 1, 2, 0] },               // E-shape maj7
    maj7_5:  { ref: 4, offs: [0, 2, 1, 2, 0, null] },            // A-shape maj7
    // jazz shells: root, 7th and 3rd only — the guide tones
    shell6:  { ref: 5, offs: [null, null, 1, 0, null, 0] },      // dominant, root on 6th
    shell5:  { ref: 4, offs: [null, 2, 0, null, 0, null] },      // dominant, root on 5th
    shellM6: { ref: 5, offs: [null, null, 1, 1, null, 0] },      // major 7th
    shellM5: { ref: 4, offs: [null, 2, 1, null, 0, null] },
    shellm6: { ref: 5, offs: [null, null, 0, 0, null, 0] },      // minor 7th
    shellm5: { ref: 4, offs: [null, 1, 0, null, 0, null] },
    ninth5:  { ref: 4, offs: [null, 0, 0, -1, 0, null] },        // the funk 9th grip
    m6_5:    { ref: 4, offs: [2, 1, 2, 2, 0, null] },            // m6, the gypsy-jazz staple
    dim7_5:  { ref: 4, offs: [null, 1, -1, 1, 0, null] },        // diminished 7th
  };

  // which grip a chord quality wants, with the root on the 6th or 5th string
  const STYLE_TABLE = {
    power:  { '': ['power6', 'power5'], m: ['power6', 'power5'], 5: ['power6', 'power5'] },
    barre:  { '': ['barre6', 'barre5'], m: ['min6', 'min5'], 5: ['power6', 'power5'],
              7: ['dom6', 'dom5'], m7: ['m7_6', 'm7_5'], maj7: ['maj7_6', 'maj7_5'],
              9: ['ninth5', 'ninth5'], m6: ['m6_5', 'm6_5'], dim7: ['dim7_5', 'dim7_5'] },
    shell:  { '': ['shellM6', 'shellM5'], m: ['shellm6', 'shellm5'], 7: ['shell6', 'shell5'],
              m7: ['shellm6', 'shellm5'], maj7: ['shellM6', 'shellM5'],
              '9': ['ninth5', 'ninth5'], m6: ['m6_5', 'm6_5'], 'm7♭5': ['shellm6', 'shellm5'],
              dim7: ['dim7_5', 'dim7_5'] },
  };

  // Put a grip on the neck: pick whichever root string keeps it low and in
  // reach, preferring the 6th string so the chord has a bass note under it.
  function placeVoicing(rootPc, templateName, lowestFret = 0){
    const tpl = VOICINGS[templateName];
    if (!tpl) return null;
    const openPc = STRING_TUNING[tpl.ref];
    let r = ((rootPc - openPc) % 12 + 12) % 12;
    const lowestOffset = Math.min(...tpl.offs.filter(o => o !== null && o !== undefined));
    while (r < lowestFret || r + lowestOffset < 0) r += 12;
    const cells = [];
    for (let s = 0; s < 6; s++){
      const off = tpl.offs[s];
      if (off === null || off === undefined) continue;
      const fret = r + off;
      if (fret < 0 || fret > FRET_COUNT) return null;
      cells.push({ string: s, fret });
    }
    return { cells, rootString: tpl.ref, rootFret: r };
  }

  // Voice one chord of a progression in the style the rhythm asks for.
  function voiceChord(chordName, style){
    const parsed = parseChordName(chordName);
    if (!parsed) return null;
    const table = STYLE_TABLE[style] || STYLE_TABLE.barre;
    const options = table[parsed.formula.name] || STYLE_TABLE.barre[parsed.formula.name]
      || STYLE_TABLE.barre[''];
    for (const name of options){
      // a grip that lands above the 9th fret is usually the wrong octave here
      const placed = placeVoicing(parsed.rootPc, name);
      if (placed && placed.rootFret <= 9) return placed;
    }
    for (const name of options){
      const placed = placeVoicing(parsed.rootPc, name);
      if (placed) return placed;
    }
    return null;
  }

  // which strings a strum actually catches
  const PARTS = {
    all:  s => true,
    low:  s => s >= 3,
    high: s => s <= 2,
    mid:  s => s >= 1 && s <= 3,
    bass: null,        // handled separately: the root string only
  };

  function stringsFor(part, cells, rootString){
    if (part === 'bass'){
      const root = cells.filter(c => c.string === rootString);
      return root.length ? root : cells.slice(-1);
    }
    const test = PARTS[part] || PARTS.all;
    const picked = cells.filter(c => test(c.string));
    return picked.length ? picked : cells;
  }

  // ------------------------------------------------------------------ events
  //
  // A playable example is a flat list of notes: which string and fret, which
  // slot of the pattern it lands on, and how long it rings. The tab drawing and
  // the player both read this, so what you see is what you hear.

  // open-string MIDI numbers, high e down to low E
  const STRING_MIDI = [64, 59, 55, 50, 45, 40];
  function midiFor(string, fret){ return STRING_MIDI[string] + fret; }
  function freqFor(string, fret){ return 440 * Math.pow(2, (midiFor(string, fret) - 69) / 12); }

  // Expand a progression played with a rhythm into notes, bar by bar.
  function buildRhythm(progression, rhythm){
    const grid = rhythm.grid;
    const notes = [];
    const drums = [];
    const bars = [];
    let bar = 0;
    progression.chords.forEach((chordName, i) => {
      const barsForChord = (progression.bars && progression.bars[i]) || 1;
      const voiced = voiceChord(chordName, rhythm.voicing);
      for (let b = 0; b < barsForChord; b++){
        bars.push({ chord: chordName, startSlot: bar * grid });
        if (voiced){
          rhythm.hits.forEach(hit => {
            const picked = stringsFor(hit.part || 'all', voiced.cells, voiced.rootString);
            const dur = hit.dur || (hit.mute ? 0.4 : 1);
            picked.forEach((cell, k) => {
              notes.push({
                string: cell.string,
                fret: cell.fret,
                at: bar * grid + hit.at,
                // a strum isn't instant — the pick sweeps across the strings
                spread: (hit.up ? (picked.length - 1 - k) : k) * 0.012,
                dur,
                vel: hit.vel === undefined ? 0.9 : hit.vel,
                tone: hit.mute ? 'muted' : rhythm.tone,
              });
            });
          });
        }
        if (rhythm.drums){
          ['kick', 'snare', 'hat'].forEach(kind => {
            (rhythm.drums[kind] || []).forEach(at => drums.push({ kind, at: bar * grid + at }));
          });
        }
        bar++;
      }
    });
    return { notes, drums, grid, bars, totalSlots: bar * grid };
  }

  // A lead line is already written as notes; it just needs its tone filled in.
  function buildLead(lead){
    const notes = lead.notes.map(n => ({
      string: n.s, fret: n.f, at: n.at, dur: n.dur || 1, spread: 0,
      vel: n.vel === undefined ? 0.95 : n.vel,
      tone: n.tone || lead.tone || 'clean',
    }));
    const bars = [];
    for (let b = 0; b < lead.bars; b++) bars.push({ chord: '', startSlot: b * lead.grid });
    return { notes, drums: [], grid: lead.grid, bars, totalSlots: lead.bars * lead.grid };
  }

  GT.genres = {
    VOICINGS, voiceChord, placeVoicing, buildRhythm, buildLead, freqFor, midiFor,
    list: () => GT.genreData,
  };
})();
