// Chord finder tab: turns a typed chord name into playable shapes on the neck,
// works out a fingering for each, and draws them as chord diagrams.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { parseChordName, NOTE_NAMES_SHARP, NOTE_NAMES_FLAT } = GT.theory;
  const { STRING_TUNING, FRET_COUNT, CAGED_COLORS, cagedShapeMatch, cagedTriadBoard } = GT.fretboard;

  const chordFinderInput = document.getElementById('chordFinderInput');
  const chordFinderError = document.getElementById('chordFinderError');
  const chordFinderResults = document.getElementById('chordFinderResults');
  const cagedOverviewEl = document.getElementById('chordFinderCaged');
  const triadOnlyRow = document.getElementById('triadOnlyRow');
  const triadOnlyToggle = document.getElementById('triadOnlyToggle');
  const shellOnlyRow = document.getElementById('shellOnlyRow');
  const shellOnlyToggle = document.getElementById('shellOnlyToggle');
  const labelModeGroup = document.getElementById('labelModeGroup');
  const labelModeRow = document.getElementById('labelModeRow');
  const shapesGroup = document.getElementById('shapesGroup');
  const shapesRow = document.getElementById('shapesRow');
  let labelMode = 'fingers';        // 'fingers' | 'degrees'
  let shapeFilter = 'all';          // 'all' | 'open' | 'movable'
  const MAX_VOICINGS = 16;          // enough for the whole neck plus a few alternatives
  const EXTRA_VOICINGS = 6;         // room for grips the containment rule would otherwise hide
  const EXTRAS_PER_KIND = 4;        // ...and for each kind of everyday grip it hid

  // Work out a left-hand fingering for a voicing, or null when there isn't a
  // playable one. Fingers run 1 (index) to 4 (pinky); open and muted strings
  // need none.
  //
  // The model is one "unit" per finger. Every fretted note starts as its own
  // unit, and if that needs more than four fingers we flatten runs of notes
  // that share a fret into a barre — the index across the lowest fret, or a
  // higher finger laid over neighbouring strings (the ring-finger barre in
  // shapes like C9 and Em9). `allowedPcs` is the chord's own set of notes: an
  // index barre presses every string it crosses, so whatever it sounds has to
  // belong to the chord.
  // A few open shapes are fingered by convention rather than by the rule
  // below, and the convention comes from the chord they are lifted from
  // rather than from anything about the frets. Em is E major with the index
  // taken off, so it keeps E major's middle and ring — while Asus2, the same
  // two-notes-on-one-fret shape, is A major with the ring taken off and keeps
  // A major's index and middle. Nothing in the geometry tells those two
  // apart, which is why this is a table and not a rule.
  //
  // Keyed by the grip, low E first; the value gives the finger for each
  // fretted string, by string index (0 = high e).
  const CONVENTIONAL_FINGERING = {
    '0-2-2-0-0-0': { 4: 2, 3: 3 },     // Em — E major with the index lifted
  };

  const gripOf = cells => {
    const at = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => at.has(s) ? at.get(s) : 'x').join('-');
  };

  function computeFingering(cells, allowedPcs){
    const known = CONVENTIONAL_FINGERING[gripOf(cells)];
    if (known){
      return { fingerByString: { ...known }, barre: null, barres: [],
               fingerCount: new Set(Object.values(known)).size, barredExtras: [] };
    }

    const fretted = cells.filter(c => c.fret > 0);
    const openStrings = new Set(cells.filter(c => c.fret === 0).map(c => c.string));
    if (!fretted.length) return { fingerByString: {}, barre: null, barres: [], fingerCount: 0 };

    const frets = fretted.map(c => c.fret);
    const minFret = Math.min(...frets), maxFret = Math.max(...frets);
    if (maxFret - minFret > 3) return null;      // wider than a four-fret hand span

    const played = new Set(cells.map(c => c.string));
    const byFret = new Map();
    fretted.forEach(c => {
      if (!byFret.has(c.fret)) byFret.set(c.fret, []);
      byFret.get(c.fret).push(c);
    });

    const barredExtras = [];
    // The index barre spans from the lowest to the highest string of the
    // lowest fret, sounding everything in between whether asked to or not.
    function indexBarreUnit(){
      const low = byFret.get(minFret);
      if (low.length < 2) return null;
      const from = Math.min(...low.map(c => c.string));
      const to = Math.max(...low.map(c => c.string));
      const extras = [];
      for (let s = from; s <= to; s++){
        if (openStrings.has(s)) return null;     // the barre would stop an open string
        if (played.has(s)) continue;
        const pc = (STRING_TUNING[s] + minFret) % 12;
        if (!allowedPcs.has(pc)) return null;    // ...and it would be a wrong note
        extras.push({ string: s, fret: minFret });
      }
      const strings = [];
      for (let s = from; s <= to; s++) strings.push(s);
      return { unit: { fret: minFret, strings, barre: true }, extras };
    }

    // A higher finger can only lie flat across strings that are next to each
    // other and all stopped at that same fret.
    function longestRun(group){
      const sorted = group.map(c => c.string).sort((a, b) => a - b);
      let best = [], run = [sorted[0]];
      for (let i = 1; i < sorted.length; i++){
        if (sorted[i] === sorted[i - 1] + 1) run.push(sorted[i]);
        else { if (run.length > best.length) best = run; run = [sorted[i]]; }
      }
      if (run.length > best.length) best = run;
      return best;
    }

    // start with a finger per note, then flatten runs until the hand fits
    let units = fretted.map(c => ({ fret: c.fret, strings: [c.string], barre: false }));
    let indexBarre = null;

    if (units.length > 4){
      const attempt = indexBarreUnit();
      if (attempt){
        barredExtras.push(...attempt.extras);
        units = units.filter(u => u.fret !== minFret);
        units.push(attempt.unit);
        indexBarre = { finger: 1, fret: minFret, fromString: attempt.unit.strings[0],
                       toString: attempt.unit.strings[attempt.unit.strings.length - 1] };
      }
    }
    while (units.length > 4){
      // flatten the longest run of neighbouring notes sharing a fret
      let target = null;
      [...byFret.entries()].forEach(([fret, group]) => {
        if (fret === minFret && indexBarre) return;       // already barred
        if (group.length < 2) return;
        const run = longestRun(group);
        if (run.length >= 2 && (!target || run.length > target.run.length)) target = { fret, run };
      });
      if (!target) return null;                           // no hand shape fits
      const runSet = new Set(target.run);
      units = units.filter(u => !(u.fret === target.fret && runSet.has(u.strings[0])));
      units.push({ fret: target.fret, strings: target.run, barre: true });
      byFret.set(target.fret, byFret.get(target.fret).filter(c => !runSet.has(c.string)));
    }

    // fingers go on in order: lowest fret first, and on a shared fret the
    // lower-pitched (higher-index) string takes the lower finger
    units.sort((a, b) => a.fret - b.fret || Math.max(...b.strings) - Math.max(...a.strings));
    const fingerByString = {};
    const barres = [];
    units.forEach((u, i) => {
      const finger = i + 1;
      u.strings.forEach(s => { fingerByString[s] = finger; });
      if (u.barre){
        barres.push({ finger, fret: u.fret,
                      fromString: Math.min(...u.strings), toString: Math.max(...u.strings) });
      }
    });

    return {
      fingerByString,
      barres,
      barre: barres[0] || null,      // the practice-diagram renderer draws these
      fingerCount: units.length,
      barredExtras,
    };
  }

  // A shell voicing is the chord stripped to what actually names it: the root,
  // the note that makes it major/minor (or the sus note standing in for it),
  // and the 7th. The plain 5th is dropped — it carries no information — but an
  // altered one (\u266d5 / \u266f5) stays, since without it a m7\u266d5 is just a m7.
  function shellIntervals(formula){
    const ivs = formula.intervals;
    const quality = [3, 4].find(i => ivs.includes(i));
    const sus = [2, 5].find(i => ivs.includes(i));
    const seventh = [10, 11, 9].find(i => ivs.includes(i));
    const alteredFifth = ivs.includes(7) ? undefined : [6, 8].find(i => ivs.includes(i));
    const core = [0];
    if (quality !== undefined) core.push(quality);
    else if (sus !== undefined) core.push(sus);
    if (alteredFifth !== undefined) core.push(alteredFifth);
    if (seventh !== undefined) core.push(seventh);
    return core.length > 1 ? core : null;      // a power chord has nothing to strip
  }

  // every reasonably-common way to play this chord within a 4-fret span,
  // scored by how playable/idiomatic the shape is
  function findChordVoicings(rootPc, formula, opts = {}){
    // Which shapes to look for at all. A shape with no open strings is
    // movable — the same grip slides up the neck to any root — and one with
    // an open string is not, so this is a filter on the search rather than on
    // its results: asked for open shapes, the list should be full of them
    // rather than showing the two or three that survived the general ranking.
    const wantOpen = opts.strings === 'open', wantMovable = opts.strings === 'movable';
    const shell = opts.shellOnly ? shellIntervals(formula) : null;
    const shellPcs = shell ? new Set(shell.map(iv => (rootPc + iv) % 12)) : null;
    const threeNoteOnly = !!opts.threeNoteOnly && !shell;
    const isMinorTriad = formula.intervals.includes(3);
    // the chord's own 5th — flat for a diminished chord, sharp for augmented
    const fifthPc = (rootPc + ([6, 7, 8].find(iv => formula.intervals.includes(iv)) || 7)) % 12;
    const essentialPcs = new Set(formula.essential.map(iv => (rootPc + iv) % 12));
    // the notes that name the chord without its root — what a rootless voicing has to carry
    const guide = shellIntervals(formula);
    const guidePcs = guide ? new Set(guide.filter(iv => iv !== 0).map(iv => (rootPc + iv) % 12)) : null;
    const chordThird = [3, 4].find(iv => formula.intervals.includes(iv));
    const ninthPcs = formula.intervals.filter(iv => iv >= 1 && iv <= 3 && iv !== chordThird).map(iv => (rootPc + iv) % 12);
    const allowedPcs = shellPcs || new Set(formula.intervals.map(iv => (rootPc + iv) % 12));
    // a slash chord names the note that has to be underneath — usually one of
    // the chord's own (D/F#), occasionally not (C/D), so it's allowed either way
    const wantBass = opts.bassPc === undefined ? rootPc : opts.bassPc;
    if (opts.bassPc !== undefined) allowedPcs.add(opts.bassPc);
    const seen = new Set();
    const results = [];

    for (let w = 0; w <= FRET_COUNT - 3; w++){
      const options = [];
      for (let s = 0; s < 6; s++){
        const stringOptions = [null];              // null = this string stays muted
        const candidates = new Set([0, w, w + 1, w + 2, w + 3]);
        candidates.forEach(f => {
          if (f < 0 || f > FRET_COUNT) return;
          const pc = (STRING_TUNING[s] + f) % 12;
          if (allowedPcs.has(pc)) stringOptions.push({ fret: f, pc });
        });
        options.push(stringOptions);
      }

      const combo = new Array(6).fill(null);
      (function rec(i){
        if (i === 6){
          const played = [];
          for (let s = 0; s < 6; s++) if (combo[s]) played.push({ string: s, fret: combo[s].fret, pc: combo[s].pc });
          if (played.length < (shell ? shell.length : 3)) return;
          if (threeNoteOnly && played.length !== 3) return;
          const playedPcs = new Set(played.map(p => p.pc));
          if (shell){
            // Exactly the shell tones, one note each, with the root underneath
            // on the 6th or 5th string — that bass-note-plus-guide-tones grip
            // is what "shell voicing" means in practice.
            if (played.length !== shell.length) return;
            for (const pc of shellPcs) if (!playedPcs.has(pc)) return;
            const low = played.reduce((a, b) => (b.string > a.string ? b : a));
            if (low.pc !== rootPc || low.string < 4) return;
          } else {
            // An extended chord may go without its root — the bass has it —
            // in the one form that's meant: four different notes on the top
            // four strings, under the hand, with the guide tones (the 3rd
            // and the 7th) among them and the 9th standing in for the root.
            // x-x-5-6-7-7 is the A13 a jazz or funk player reaches for;
            // identifyChords names such shapes by the same rule, so what's
            // drawn can be read back.
            const rootless = !playedPcs.has(rootPc) && formula.intervals.length >= 5;
            if (rootless){
              if (played.length !== 4 || playedPcs.size !== 4 || played.some(p => p.string > 3 || p.fret === 0)) return;
              if (!guidePcs || ![...guidePcs].every(pc => playedPcs.has(pc))) return;
              if (!ninthPcs.some(pc => playedPcs.has(pc))) return;
            }
            for (const pc of essentialPcs) if (!playedPcs.has(pc) && !(rootless && pc === rootPc)) return;
            // the 6/9's rule: its 3rd is optional, but not both the 3rd and the 5th
            if (formula.anyOf && !formula.anyOf.some(iv => playedPcs.has((rootPc + iv) % 12))) return;
          }
          const frettedOnly = played.map(p => p.fret).filter(f => f > 0);
          const maxFret = frettedOnly.length ? Math.max(...frettedOnly) : 0;
          const span = frettedOnly.length ? maxFret - Math.min(...frettedOnly) : 0;
          if (span > 3) return;
          if (!playedPcs.has(rootPc) && span > 2) return;    // a rootless grip sits under the hand

          let cells = played.map(p => ({ string: p.string, fret: p.fret }));
          const fingering = computeFingering(cells, allowedPcs);
          if (!fingering) return;                       // no hand can play this
          // Open chords are played with separate fingers; a shape that needs a
          // barre *and* leaves strings open isn't something anyone reaches for.
          if (fingering.barres.length && cells.some(c => c.fret === 0)) return;
          // strings the barre sounds anyway belong to the shape
          if (fingering.barredExtras && fingering.barredExtras.length){
            cells = cells.concat(fingering.barredExtras).sort((a, b) => a.string - b.string);
          }

          const key = cells.map(c => `${c.string}:${c.fret}`).join(',');
          if (seen.has(key)) return;
          seen.add(key);

          const allPcs = new Set(cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12));
          const bass = cells.reduce((a, b) => (b.string > a.string ? b : a));
          const bassPc = (STRING_TUNING[bass.string] + bass.fret) % 12;
          if (opts.bassPc !== undefined && bassPc !== opts.bassPc) return;   // not the slash chord asked for
          const openCount = cells.filter(c => c.fret === 0).length;
          if (wantOpen && !openCount) return;
          if (wantMovable && openCount) return;
          const startFretEarly = frettedOnly.length ? Math.min(...frettedOnly) : 0;
          // open strings only really belong to grips down near the nut —
          // higher up they're a specialty voicing, not an everyday shape
          if (openCount && startFretEarly > 5) return;
          const playedStrings = cells.map(c => c.string);
          const innerMutes = (Math.max(...playedStrings) - Math.min(...playedStrings) + 1) - cells.length;
          const score = cells.length * 3                        // fuller chords ring better
            - span * 1.5                                         // ...but keep the stretch small
            - fingering.fingerCount * 0.75                        // ...and the grip simple
            + (bassPc === wantBass ? 8 : 0)                       // root in the bass = the everyday voicing
            + (allPcs.has(fifthPc) ? 1 : 0)                       // a 5th in there fills it out
            + openCount * 0.25                                    // open strings are free and ring out
            - innerMutes;                                         // skipping a string mid-chord is fiddly
          const startFret = frettedOnly.length ? Math.min(...frettedOnly) : 0;
          // the textbook CAGED grip for this chord beats an ad-hoc shape that
          // merely happens to sit in the same place
          const match = cagedShapeMatch(cells, rootPc, isMinorTriad);
          const shapeBonus = match ? (match.exact ? 6 : 1) : 0;
          // open strings with fretted strings either side of them, once the
          // hand has moved up the neck — a specialty voicing, not an everyday one
          const strung = new Set(playedStrings);
          const innerOpens = maxFret >= 4 ? cells.filter(c => c.fret === 0
            && [...strung].some(s => s < c.string) && [...strung].some(s => s > c.string)).length : 0;
          // How the list is ordered once chosen. The score above decides which
          // shapes make the cut; this decides which reads first at a position,
          // and there the everyday grip should win: extra strings past four
          // count for little, a barre costs, and open strings buried inside a
          // shape up the neck cost more.
          // how much the fingers zigzag from string to string: x-3-5-3-5-0
          // spans the same two frets as x-3-2-3-1-0 but is far more awkward
          const frettedCells = cells.filter(c => c.fret > 0).sort((a, b) => a.string - b.string);
          let zigzag = 0;
          for (let k = 1; k < frettedCells.length; k++) zigzag += Math.abs(frettedCells[k].fret - frettedCells[k - 1].fret);
          const rank = score + shapeBonus
            - Math.max(0, cells.length - 4) * 2
            - fingering.barres.length
            - innerOpens * 2
            - zigzag * 0.5
            - maxFret * 0.1;                 // all else equal, the hand nearer the nut
          results.push({ cells, fingering, score: score + shapeBonus, rank, startFret, key,
                         caged: match ? match.name : null, cagedExact: !!(match && match.exact),
                         rootless: !allPcs.has(rootPc),
                         rootInBass: bassPc === wantBass, innerMutes, innerOpens, openCount,
                         bassString: bass.string,
                         // the power-chord layout: root on the bottom string, the 5th right above it
                         powerShape: cells.length >= 2 && cells[cells.length - 2].string === bass.string - 1
                           && (STRING_TUNING[bass.string - 1] + cells[cells.length - 2].fret) % 12 === fifthPc });
          return;
        }
        for (const opt of options[i]){ combo[i] = opt; rec(i + 1); }
      })(0);
    }

    // Each shape is told what kind of grip it is — an open chord, a barre, a
    // jazz grip, a top-string voicing — and whether that's a common way to
    // play this chord. The selection below leans on it, and the tab shows
    // the common ones in their own section.
    results.forEach(r => Object.assign(r, describeVoicing(r, formula)));

    // The best shape at each position on the neck, walking up from the nut —
    // so every place you could actually play this chord gets a look in, rather
    // than the easy open-position shapes taking every slot. A shape that's just
    // a thinner copy of one already picked is skipped.
    results.sort((a, b) => b.score - a.score || a.startFret - b.startFret);
    const cellKeys = r => new Set(r.cells.map(c => `${c.string}:${c.fret}`));
    const isSubsetOf = (a, b) => { const inB = cellKeys(b); return a.cells.every(c => inB.has(`${c.string}:${c.fret}`)); };
    // `a` is a thinner copy of `b` when it's the same grip minus some strings
    // — but only if what it leaves out is open strings. Dropping a *fretted*
    // note changes the hand: the three-string power chord and the four-string
    // Fmaj7 are their own grips, not cut-down versions of the six-string ones
    // that happen to contain them. And a shape left with no open strings at
    // all is a different animal from the one it came out of: it can slide to
    // any root, where the open-string version works at one fret only. The
    // Hendrix chord is x-3-2-3-4-x, not x-3-2-3-4-0 with the top string
    // thrown in because it happens to be in the chord.
    const isThinnerCopyOf = (a, b) => {
      if (!isSubsetOf(a, b)) return false;
      if (!a.openCount && a.cells.length >= 4) return false;
      const inA = cellKeys(a);
      return b.cells.every(c => inA.has(`${c.string}:${c.fret}`) || c.fret === 0);
    };

    // Pass one: the best grip at every position gets a place, so the list
    // covers the whole neck; the leftover room goes to the strongest
    // runners-up, since a position often has both a full barre shape and a
    // compact grip worth knowing. Anything contained in a shape already picked
    // is left out here. Shells are already a short, focused list — no need to
    // thin them out by position the way the full voicing list is.
    const perPosition = shell ? Infinity : 2;
    const best = [], runnersUp = [], passedOver = [], taken = new Map();
    for (const r of results){
      // rootless voicings have a place of their own in pass two; letting
      // them take positions here would push the everyday shapes about
      if (r.rootless){ passedOver.push(r); continue; }
      const count = taken.get(r.startFret) || 0;
      const swallowed = [...best, ...runnersUp].some(c => isSubsetOf(r, c) || isSubsetOf(c, r));
      if (swallowed || count >= perPosition){ passedOver.push(r); continue; }
      const pool = count === 0 ? best : runnersUp;
      taken.set(r.startFret, count + 1);
      pool.push(r);
    }
    const chosen = best.concat(runnersUp.slice(0, Math.max(0, MAX_VOICINGS - best.length)));

    // Pass two: the rules above are too eager. Containment throws away the
    // four-string Fmaj7 and the three-string power chord because a bigger
    // shape happens to contain them, and two slots per fret isn't enough at
    // the nut, where an A9 has a dozen variants. Let a few compact grips back
    // in, as long as they're grips in their own right. A movable shape of a
    // known kind — a barre, a root-6 or root-5 grip, a top-string voicing, a
    // shell — is one by definition, skipped string or no: 5-x-4-4-5-5 is how
    // a 6/9 is played, and x-x-4-4-5-5 is the same chord with the root on
    // top. Anything else has to have its root underneath and no string
    // skipped or left open in the middle, and not merely be a picked shape
    // with open strings left off. A power chord is exempt from that last
    // test — its cut-down form *is* the grip.
    // The same hand, with a string left off — the E-shape barre minus its
    // top string — is not a grip of its own, whichever note went. What makes
    // a cut-down shape its own grip is that the fingers change (the
    // four-string Fmaj7 is fingered nothing like the six-string one) or that
    // it becomes movable where its parent wasn't (the Hendrix chord).
    // A barre across the neck and a single finger are different hands too:
    // x-3-5-4-5-x is the four-finger Cmaj7 grip, not the A-shape barre with
    // a string off. A finger laid over two strings inside a shape isn't
    // that kind of difference — 5-x-4-4-5-5 and 5-x-4-4-5-x are one hand.
    const wideBarre = r => r.fingering.barres.some(b => Math.abs(b.toString - b.fromString) >= 2);
    const sameHand = (a, b) => {
      if (!isSubsetOf(a, b) || !a.openCount !== !b.openCount) return false;
      if (wideBarre(a) !== wideBarre(b)) return false;
      const fa = a.fingering.fingerByString, fb = b.fingering.fingerByString;
      return a.cells.every(c => c.fret === 0 || fa[c.string] === fb[c.string]);
    };
    const isPower = formula.name === '5';
    if (!shell){
      const extras = [];
      const knownKind = r => ['barre', 'grip', 'upper', 'triad', 'shell'].includes(r.family);
      const admit = r => {
        if (!knownKind(r) && (!r.rootInBass || r.innerMutes || r.innerOpens || r.cells.length > 5)) return;
        const all = chosen.concat(extras);
        if (!isPower && all.some(c => isThinnerCopyOf(r, c) || isThinnerCopyOf(c, r))) return;
        // Of two shapes that are one hand, show one: the one that's a known
        // grip, and between two of those the fuller — the E-shape barre with
        // all six strings, not with the top one off. A grip is the exception:
        // it wants one string per note of the chord, no more, so the
        // four-note 3-x-3-4-3-x is the G7 grip and 3-x-3-4-3-3 the variant,
        // while for a 6/9, a chord of five notes, it's five-string
        // 5-x-4-4-5-5 that's the grip and 5-x-4-4-5-x that's the variant.
        const twin = isPower ? null : all.find(c => sameHand(r, c) || sameHand(c, r));
        if (twin){
          const tones = formula.intervals.length;
          const fuller = r.family === 'grip' && twin.family === 'grip'
            ? Math.abs(r.cells.length - tones) < Math.abs(twin.cells.length - tones)
            : r.cells.length > twin.cells.length;
          const better = r.common && !twin.common || (r.common === twin.common && fuller);
          if (!better) return;
          const pool = chosen.includes(twin) ? chosen : extras;
          pool.splice(pool.indexOf(twin), 1, r);
          return;
        }
        extras.push(r);
      };
      // The everyday grips the rules hid come back first: the kinds in the
      // order a player meets them, and within a kind the fullest shape — a
      // 6/9's five-string barre lost its slot to two open-string variants of
      // itself, and would lose again to anything with fewer strings, so this
      // goes by the score that chose shapes rather than the rank that orders
      // them. A power chord has no such problem — its cut-down form is the
      // grip, so the compact ones lead as they always did.
      // Each kind gets a few places of its own rather than sharing one
      // budget, or the barres would use it all before a top-string shape
      // got a look in. What makes a shape the best of its kind differs too:
      // a barre is the fuller the better, so it goes by the score that
      // chose shapes; a grip is a four-note thing, so it goes by the rank
      // that orders them, which asks for nothing past four strings; and a
      // top-string voicing is judged without the credit for a root in the
      // bass, since putting the root on top is what those are for.
      const everyday = isPower ? [] : passedOver.filter(r => r.common && !r.rootless);
      const worth = r => r.family === 'barre' ? r.score
        : r.family === 'upper' ? r.rank - (r.rootInBass ? 8 : 0) : r.rank;
      const byKind = new Map();
      everyday.forEach(r => byKind.set(r.family, (byKind.get(r.family) || []).concat(r)));
      [...byKind.keys()].sort((a, b) => FAMILY_TIER[a] - FAMILY_TIER[b]).forEach(kind => {
        let placed = 0;
        for (const r of byKind.get(kind).sort((a, b) => worth(b) - worth(a))){
          if (placed >= EXTRAS_PER_KIND) break;
          const before = extras.length;
          admit(r);
          if (extras.length > before) placed++;
        }
      });
      // and the two best rootless voicings, which are all of a kind — by
      // rank, since what separates them is the hand rather than the sound
      const rootless = passedOver.filter(r => r.rootless).sort((a, b) => b.rank - a.rank).slice(0, 2);
      rootless.forEach(admit);
      // then the compact ones — those are what the rules above hide
      const others = passedOver.filter(r => !everyday.includes(r) && !r.rootless)
        .sort((a, b) => a.cells.length - b.cells.length || b.rank - a.rank);
      const room = extras.length + EXTRA_VOICINGS;
      others.forEach(r => { if (extras.length < room) admit(r); });
      chosen.push(...extras);
    }

    // Common shapes first, and within that the kinds of grip in the order a
    // player meets them — the open chord before the barre before the jazz
    // grip. Then walk up the neck, everyday grip first within each position.
    // Everything within reach of the nut counts as one position — otherwise
    // a shape that happens to be all open strings sorts ahead of the real
    // open chord. A power chord is all about its bottom: fewest strings,
    // root and 5th on the two lowest of them, as low as they go, fretted
    // rather than open.
    const position = r => r.startFret <= 3 ? 0 : r.startFret;
    return chosen.sort((a, b) => b.common - a.common
      || FAMILY_TIER[a.family] - FAMILY_TIER[b.family]
      || position(a) - position(b)
      || (isPower && (a.cells.length - b.cells.length || b.powerShape - a.powerShape
                      || b.bassString - a.bassString || a.openCount - b.openCount))
      || b.rank - a.rank);
  }

  // ---- what kind of grip a shape is -----------------------------------------
  // Chord shapes come in families that players know by feel — the open
  // chords of a first songbook, the E- and A-shape barres, the four-note
  // grips with the root on the 6th or 5th string that jazz is comped with,
  // the top-string voicings funk and reggae are played on. The family says
  // which genres a shape is at home in, and whether it's a common way to play
  // this particular chord: a barre is the common way to play a triad, and a
  // top-four-string shape is the common way to play a 6/9 or a 13th.
  //
  // Each family is a test on the shape's geometry, tried in order; the first
  // that fits names it. Genres are the family's own plus the chord type's —
  // a dominant 7th belongs to the blues whichever shape it's in.
  const FAMILIES = {
    power: { label: 'Power chord',        genres: ['rock', 'punk', 'metal'] },
    open:  { label: 'Open chord',         genres: ['folk', 'country', 'pop', 'rock'] },
    barre: { label: 'Barre chord',        genres: ['rock', 'pop', 'punk', 'reggae'] },
    grip:  { label: 'Compact grip',       genres: ['jazz', 'blues', 'bossa nova'] },
    upper: { label: 'Top-string voicing', genres: ['funk', 'R&B', 'reggae', 'neo-soul'] },
    triad: { label: 'Three-note triad',   genres: ['R&B', 'gospel', 'neo-soul', 'country'] },
    shell: { label: 'Shell voicing',      genres: ['jazz', 'bossa nova', 'swing'] },
    caged: { label: 'CAGED form',         genres: ['country', 'pop', 'rock'] },
    other: { label: 'Alternative voicing', genres: [] },
  };
  // The order the kinds read in. Open and barre chords share a tier: which
  // of the two is the everyday grip for a chord is the ranking's call (the
  // open C, but the barre Bb), and a tier of their own would overrule it.
  const FAMILY_TIER = { power: 0, open: 1, barre: 1, grip: 2, upper: 3, triad: 4, shell: 5, caged: 6, other: 7 };

  // the genres a chord type carries with it, whatever the shape
  function typeGenres(formula){
    const n = formula.name;
    if (n === '7') return ['blues', "rock 'n' roll", 'country'];
    if (['maj7', 'm7', 'm(maj7)', '6', 'm6', 'm7\u266d5', 'dim7', 'aug'].includes(n)) return ['jazz', 'bossa nova'];
    if (/9|11|13/.test(n)) return n.startsWith('add') || n.startsWith('m(add') ? ['pop', 'rock', 'folk'] : ['funk', 'soul', 'jazz'];
    if (/sus/.test(n)) return ['pop', 'rock', 'folk'];
    if (n === '7\u266f5' || n === '7\u266d5') return ['jazz', 'blues'];
    return [];
  }

  function describeVoicing(v, formula){
    const cells = v.cells;
    const strings = cells.map(c => c.string);
    const n = cells.length;
    const maxFret = Math.max(...cells.map(c => c.fret));
    const tones = formula.intervals.length;      // 2 power, 3 triad, 4 seventh, 5+ extended
    // the barre chord's barre: the index across the strings from the bass
    // note up — not a first finger laid across two strings somewhere inside
    // a shape
    const fullBarre = v.fingering.barres.some(b => b.finger === 1 && b.toString === v.bassString);
    const onTop = Math.max(...strings) <= 3;     // nothing below the D string
    const rootLow = v.rootInBass && v.bassString >= 4;   // root on the 6th or 5th string
    const movable = !v.openCount;                // a shape that can slide to any root
    const hasSeventh = [9, 10, 11].some(iv => formula.intervals.includes(iv)) && tones >= 4;
    const fretted = cells.map(c => c.fret).filter(f => f > 0);
    const span = fretted.length ? maxFret - Math.min(...fretted) : 0;
    // one skipped string, the one right above the bass note
    const skipsAboveBass = v.innerMutes === 1 && !strings.includes(v.bassString - 1);

    let family;
    if (formula.name === '5') family = 'power';
    // an open chord in the songbook sense: down at the nut, four strings or
    // more ringing all the way up to the top string, root underneath, no
    // open string buried between fretted ones, every finger its own — not
    // merely a shape with an open string somewhere in it
    else if (v.openCount && maxFret <= 4 && n >= 4 && v.rootInBass && !v.innerMutes && !v.innerOpens
             && Math.min(...strings) === 0 && !v.fingering.barres.length) family = 'open';
    else if (rootLow && fullBarre && !v.innerMutes && n >= 4 && span <= 2) family = 'barre';
    // the movable four- and five-note grips with the root on the 6th or 5th
    // string — x-3-5-4-5-x, 1-x-2-2-1-x, x-7-6-7-7-7 — one skipped string at most
    // — within two frets, since those grips sit under the hand, and with the
    // skipped string, if any, right above the root: from the 6th string the
    // grip always skips the 5th (3-x-3-4-3-x, 5-x-4-4-5-5), from the 5th it
    // skips the 4th or nothing (x-5-x-5-7-7, x-3-5-4-5-x). The bottom four
    // strings of a barre chord are the barre chord, not a grip.
    else if (rootLow && movable && n >= 4 && n <= 5 && hasSeventh && span <= 2
             && ((v.bassString === 5 && skipsAboveBass) || (v.bassString === 4 && (skipsAboveBass || !v.innerMutes)))) family = 'grip';
    else if (rootLow && movable && n === 3 && hasSeventh && skipsAboveBass && span <= 2) family = 'shell';
    else if (onTop && movable && n === 3 && tones === 3) family = 'triad';
    else if (onTop && movable && n <= 4) family = 'upper';
    else if (v.cagedExact) family = 'caged';
    else family = 'other';

    // A common way to play *this* chord: the shapes a method book teaches for
    // a triad, the root-6 and root-5 grips for a seventh, and the compact
    // top-string shape for anything extended past the 7th, which is how a
    // 6/9 or a 13th is nearly always played.
    const common = family === 'power' || family === 'open' || family === 'barre'
      || (family === 'grip' && tones >= 4)
      || (family === 'upper' && tones >= 5);

    // a rootless voicing belongs to the styles that leave the root to the bass
    const genres = [...new Set([...(v.rootless ? ['jazz', 'funk'] : []), ...FAMILIES[family].genres, ...typeGenres(formula)])].slice(0, 5);
    return { family, common, genres };
  }

  // What to call an interval above the root, in the context of this chord —
  // a 9th chord's 2nd is a "9", a plain sus2's is just a "2".
  const DEGREE_NAMES = ['R', '\u266d9', '2', '\u266d3', '3', '4', '\u266d5', '5', '\u266f5', '6', '\u266d7', '7'];
  function degreeNameFor(interval, formula){
    const n = formula ? formula.name : '';
    if (interval === 2 && n.includes('9')) return '9';
    if (interval === 5 && n.includes('11')) return '11';
    if (interval === 9 && n.includes('13')) return '13';
    return DEGREE_NAMES[interval];
  }

  // Spell a chord tone the way its own degree writes it: the ♭7 of C7 is Bb,
  // not A#, and the ♭3 of Cm is Eb. A degree with no accidental of its own —
  // the 6 of a 6/9, the 9 — follows however the root is spelled.
  function noteNameFor(pc, degree, rootName){
    const flat = degree.includes('\u266d') || (!degree.includes('\u266f') && (rootName || '').includes('b'));
    return (flat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[pc]
      .replace('#', '\u266f').replace('b', '\u266d');
  }

  // small chord-diagram SVG for one voicing (same visual language as the main fretboard)
  // `labelMode` is 'fingers' (1-4) or 'degrees' (R, 3, 5, ♭7 ...)
  // Anything you can click to hear one note: the dot on the neck and the name
  // beside it are two ways at the same string, and carry the same handle.
  const noteHit = (string, fret, inner) =>
    `<g class="note-hit" data-string="${string}" data-fret="${fret}">${inner}</g>`;

  function buildDiagramSVG(cells, rootPc, fingering, labelMode = 'fingers', formula = null, rootName = ''){
    const frettedPositives = cells.map(c => c.fret).filter(f => f > 0);
    const maxFret = frettedPositives.length ? Math.max(...frettedPositives) : 0;
    const minFret = frettedPositives.length ? Math.min(...frettedPositives) : 0;
    const openPosition = maxFret <= 4;
    const startFret = openPosition ? 1 : minFret;
    const numFrets = 4;
    const cellByString = new Map(cells.map(c => [c.string, c]));

    // The right margin is wide because every sounding string is named there.
    const W = 180, H = 155;
    const padL = 26, padR = 40, padT = 30, padB = 8;
    // The name ends where the degree begins, five units apart, so the pair
    // reads as one label however long either half is — "C R" sits as close
    // together as "B♭ ♭7".
    const nameX = 156, degreeX = nameX + 5;
    const nutX = padL;
    const colW = (W - padL - padR) / numFrets;
    const rowH = (H - padT - padB) / 5;
    const stringY = s => padT + s * rowH;
    const openX = nutX - 12;

    const els = [];
    for (let s = 0; s < 6; s++){
      els.push(`<line class="fret-string" x1="${nutX}" y1="${stringY(s)}" x2="${W - padR}" y2="${stringY(s)}"/>`);
    }
    if (openPosition){
      els.push(`<line class="fret-nut" x1="${nutX}" y1="${stringY(0)}" x2="${nutX}" y2="${stringY(5)}"/>`);
    } else {
      els.push(`<text class="fret-num" x="${nutX - 2}" y="${padT - 12}" text-anchor="start">${startFret}fr</text>`);
    }
    for (let rf = 1; rf < numFrets; rf++){
      const x = nutX + rf * colW;
      els.push(`<line class="fret-wire" x1="${x}" y1="${stringY(0)}" x2="${x}" y2="${stringY(5)}"/>`);
    }

    const fingerByString = (fingering && fingering.fingerByString) || {};
    const barres = (fingering && fingering.barres) || (fingering && fingering.barre ? [fingering.barre] : []);
    const colX = fret => nutX + (fret - (startFret - 1) - 0.5) * colW;

    // each barre reads as one bar behind the dots that finger holds down
    barres.forEach(barre => {
      const x = colX(barre.fret);
      const y1 = stringY(Math.min(barre.fromString, barre.toString));
      const y2 = stringY(Math.max(barre.fromString, barre.toString));
      els.push(`<rect class="diagram-barre" x="${x - 7}" y="${y1 - 7}" width="14" height="${y2 - y1 + 14}" rx="7"/>`);
    });

    for (let s = 0; s < 6; s++){
      const c = cellByString.get(s);
      if (!c){
        els.push(`<text class="diagram-mute" x="${openX}" y="${stringY(s) + 4}" text-anchor="middle">×</text>`);
        continue;
      }
      const pc = (STRING_TUNING[s] + c.fret) % 12;
      const isRoot = pc === rootPc;
      const degree = degreeNameFor((pc - rootPc + 12) % 12, formula);
      const open = c.fret === 0;
      const cx = open ? openX : colX(c.fret), cy = stringY(s), r = open ? 9 : 11;
      const dot = [];
      if (open){
        dot.push(`<circle class="diagram-open${isRoot ? ' diagram-root' : ''}" cx="${cx}" cy="${cy}" r="6"/>`);
        if (labelMode === 'degrees'){
          dot.push(`<text class="diagram-open-degree" x="${cx}" y="${cy - 9}" text-anchor="middle">${degree}</text>`);
        }
      } else {
        dot.push(`<circle class="${isRoot ? 'diagram-root' : 'diagram-note'}" cx="${cx}" cy="${cy}" r="8"/>`);
        const label = labelMode === 'degrees' ? degree : fingerByString[s];
        if (label){
          const small = String(label).length > 1;
          dot.push(`<text class="diagram-finger${small ? ' small' : ''}" x="${cx}" y="${cy + 3.2}" text-anchor="middle">${label}</text>`);
        }
      }
      // the ring first, so it sits behind the dot; the tap circle last, so it
      // catches the click wherever in the dot it lands
      els.push(noteHit(s, c.fret,
        `<circle class="note-ring" cx="${cx}" cy="${cy}" r="${r}"/>`
        + dot.join('')
        + `<circle class="note-tap" cx="${cx}" cy="${cy}" r="${r}"/>`));
    }

    // Every sounding string named off the end of the neck: the note it plays,
    // and what that note is in this chord. The dots can only carry one of the
    // two at a time, and which note is under a finger is the thing a chord
    // diagram otherwise leaves you to work out. Each label is a target of its
    // own — clicking it sounds that one note — and lights up with its dot.
    for (let s = 0; s < 6; s++){
      const c = cellByString.get(s);
      if (!c) continue;
      const pc = (STRING_TUNING[s] + c.fret) % 12;
      const degree = degreeNameFor((pc - rootPc + 12) % 12, formula);
      const y = stringY(s) + 3.5;
      els.push(noteHit(s, c.fret,
        `<text class="diagram-note-name" x="${nameX}" y="${y}" text-anchor="end">${noteNameFor(pc, degree, rootName)}</text>`
        + `<text class="diagram-note-degree" x="${degreeX}" y="${y}">${degree}</text>`
        + `<rect class="note-tap" x="${W - padR - 2}" y="${stringY(s) - 9}" width="${padR + 2}" height="18"/>`));
    }

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${els.join('')}</svg>`;
  }

  // A plain triad also gets the whole-neck CAGED picture at the top — the same
  // five shapes, colours and labels the practice tab draws.
  function buildCagedOverview(parsed){
    const isMinor = parsed.formula.name === 'm';
    const { markers, lines, shapesShown } = cagedTriadBoard(parsed.rootPc, isMinor, parsed.rootName);
    const legend = shapesShown
      .map(n => `<span><i style="background:${CAGED_COLORS[n]}"></i>${n} shape</span>`)
      .join('') + '<span><i class="ring"></i>root</span>';
    return `
      <div class="caged-overview">
        <p class="caged-overview-title">CAGED shapes for ${parsed.rootName}${parsed.formula.name}</p>
        <div class="fret-scroll">
          <svg viewBox="${GT.neck.viewBox}" role="img" aria-label="CAGED shapes across the neck">${GT.neck.buildSVG(markers, lines)}</svg>
        </div>
        <div class="caged-legend">${legend}</div>
      </div>`;
  }

  // What the last search drew, in the order the cards show it — runChordFinder
  // fills it and a click on a card reads it back to strum the right shape.
  let shownVoicings = [];

  function runChordFinder(){
    const raw = chordFinderInput.value;
    if (!raw.trim()){
      chordFinderError.textContent = '';
      chordFinderResults.innerHTML = '';
      cagedOverviewEl.innerHTML = '';
      triadOnlyRow.hidden = true;
      shellOnlyRow.hidden = true;
      labelModeRow.hidden = true;
      shapesRow.hidden = true;
      return;
    }
    labelModeRow.hidden = false;
    shapesRow.hidden = false;
    const parsed = parseChordName(raw);
    if (!parsed){
      chordFinderError.textContent = `Couldn't recognize "${raw.trim()}" as a chord name.`;
      chordFinderResults.innerHTML = '';
      cagedOverviewEl.innerHTML = '';
      triadOnlyRow.hidden = true;
      shellOnlyRow.hidden = true;
      shapesRow.hidden = true;
      return;
    }
    chordFinderError.textContent = '';

    const isTriad = parsed.formula.intervals.length === 3;
    const isPlainTriad = parsed.formula.name === '' || parsed.formula.name === 'm';
    const hasShell = !!shellIntervals(parsed.formula);
    shellOnlyRow.hidden = !hasShell;
    const shellOnly = hasShell && shellOnlyToggle.checked;
    // shells are already pared to the bone, so the triad filter has nothing to do
    triadOnlyRow.hidden = !isTriad || shellOnly;
    cagedOverviewEl.innerHTML = (isPlainTriad && !shellOnly) ? buildCagedOverview(parsed) : '';

    const voicings = findChordVoicings(parsed.rootPc, parsed.formula, {
      threeNoteOnly: isTriad && triadOnlyToggle.checked,
      shellOnly,
      strings: shapeFilter,
      bassPc: parsed.bassPc,
    });
    const chordLabel = parsed.rootName + parsed.formula.name + (parsed.bassName ? '/' + parsed.bassName : '');
    if (!voicings.length){
      const what = shellOnly ? 'shell voicing'
        : shapeFilter === 'open' ? 'shape using open strings'
        : shapeFilter === 'movable' ? 'movable shape' : 'shape';
      chordFinderResults.innerHTML =
        `<p class="diagram-empty">No playable ${what} for ${chordLabel} within a comfortable stretch.</p>`;
      return;
    }
    shownVoicings = voicings;
    // Two sections: the common ways to play this chord, then the rest. The
    // list is already sorted that way, so the headings go in where the
    // sections meet; a section nobody is in gets no heading.
    // The card says only what's true of this shape and not of the others —
    // the whole page is one chord, so its name on every diagram is noise.
    const card = (v, i) => {
      const notes = [v.caged ? `${v.caged} shape` : '', v.rootless ? 'no root' : ''].filter(Boolean);
      return `
      <div class="diagram-card" role="button" tabindex="0" data-voicing="${i}"
           aria-label="Play ${chordLabel}, shape ${i + 1}" title="${voicingTip(v)}">
        ${buildDiagramSVG(v.cells, parsed.rootPc, v.fingering, labelMode, parsed.formula, parsed.rootName)}
        ${notes.length ? `<p class="diagram-caption">${notes.map(n => `<span class="diagram-shape">${n}</span>`).join('')}</p>` : ''}
      </div>`;
    };
    const heading = (text, n) => `<h3 class="diagram-section">${text} <span>${n}</span></h3>`;
    const common = voicings.filter(v => v.common), rare = voicings.filter(v => !v.common);
    chordFinderResults.innerHTML =
      (common.length ? heading('Common', common.length) : '')
      + voicings.map((v, i) => v.common ? card(v, i) : '').join('')
      + (rare.length ? heading('Less common', rare.length) : '')
      + voicings.map((v, i) => v.common ? '' : card(v, i)).join('');
  }

  // the tooltip on a shape: what kind of grip it is, and where it's at home
  function voicingTip(v){
    const label = FAMILIES[v.family].label;
    const kind = v.rootless ? `Rootless ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label;
    if (!v.genres.length) return `${kind} \u2014 not a shape any style reaches for by habit`;
    return `${kind} \u2014 common in ${v.genres.join(', ')}`;
  }

  // ---- hearing a shape ----------------------------------------------------
  const OPEN_MIDI = [64, 59, 55, 50, 45, 40];     // high e down to low E
  const freqOf = (string, fret) => 440 * Math.pow(2, (OPEN_MIDI[string] + fret - 69) / 12);

  // The piano voice, not the guitar one. Six guitar strings struck together
  // are six sawtooth pairs through one clipping stage, and a chord with a
  // 9th and a 13th in it turns to mud there; the piano's notes are cleaner
  // and stay separate however many of them land at once. It's the voice the
  // practice tab plays chords with, so the two tabs now sound the same.
  function beginSound(){
    const audio = GT.audio;
    audio.ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    // a second click calls off whatever the first one still had coming
    audio.cancelScheduled();
    return audio.ctx().currentTime + 0.03;
  }

  // Sound the shape low string to high, starting at `t0`. The gap between the
  // notes is the difference between a chord and an arpeggio: a pick's sweep
  // is fast enough that the notes arrive as one, and spacing them out is the
  // same notes heard one at a time.
  function sound(cells, t0, gap, hold){
    const ordered = cells.slice().sort((a, b) => b.string - a.string);
    ordered.forEach((c, i) => GT.audio.playNote(freqOf(c.string, c.fret), t0 + i * gap, hold, 0.9));
    return t0 + gap * Math.max(0, ordered.length - 1);
  }

  function strum(cells, gap = 0.018){
    // an arpeggio's notes have to ring past the ones after them to add up to
    // the chord, so a slower roll holds each note longer
    sound(cells, beginSound(), gap, Math.max(1.6, 0.9 + gap * cells.length * 1.6));
  }
  const ARPEGGIO_GAP = 0.28;

  // What you want to hear when you point at a shape: the chord, then its
  // notes one at a time up and back down, then the chord again — how it
  // sounds, what's in it, then how it sounds with those notes in your ear.
  // The top note isn't struck twice at the turn, so the run reads as one
  // line rather than stalling at the top.
  const TOUR_GAP = 0.28;      // as slow as the reverse finder's own arpeggio
  function tour(cells){
    const t0 = beginSound();
    const low = cells.slice().sort((a, b) => b.string - a.string);
    const run = low.concat(low.slice(0, -1).reverse());
    const arpAt = t0 + 0.85;
    run.forEach((c, i) => GT.audio.playNote(freqOf(c.string, c.fret), arpAt + i * TOUR_GAP, 1.3, 0.85));
    sound(cells, t0, 0.018, 1.7);
    sound(cells, arpAt + run.length * TOUR_GAP + 0.08, 0.018, 2.4);
  }

  // one note of the shape, on its own
  function playOne(string, fret){
    GT.audio.playNote(freqOf(string, fret), beginSound(), 1.8, 0.95);
  }

  // Lighting a note lights every way in to it — the dot on the neck and the
  // name beside it — so it's plain they're the same note and that either
  // will sound it.
  const twinsOf = hit => [...hit.closest('svg')
    .querySelectorAll(`.note-hit[data-string="${hit.dataset.string}"]`)];

  function litFromEvent(e, on){
    const hit = e.target.closest && e.target.closest('.note-hit');
    if (hit) twinsOf(hit).forEach(g => g.classList.toggle('lit', on));
  }

  function onCardActivate(e){
    const card = e.target.closest('.diagram-card');
    if (!card) return;
    const v = shownVoicings[Number(card.dataset.voicing)];
    if (!v) return;
    e.preventDefault();
    // a note of the shape, if that's what was pressed — otherwise the shape
    const hit = e.target.closest && e.target.closest('.note-hit');
    if (hit){
      playOne(Number(hit.dataset.string), Number(hit.dataset.fret));
      twinsOf(hit).forEach(g => {
        g.classList.remove('struck');
        void g.getBoundingClientRect();     // restart the flash
        g.classList.add('struck');
      });
      return;
    }
    tour(v.cells);
    card.classList.remove('rang');
    void card.offsetWidth;            // restart the flash animation
    card.classList.add('rang');
  }

  GT.chordFinder = {
    init(){
      chordFinderInput.addEventListener('input', runChordFinder);
      // the examples fill the field rather than being prose about it
      document.querySelectorAll('#chordExamples .seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          chordFinderInput.value = btn.dataset.chord;
          runChordFinder();
        });
      });
      runChordFinder();          // draw the empty state
      triadOnlyToggle.addEventListener('change', runChordFinder);
      shellOnlyToggle.addEventListener('change', runChordFinder);
      chordFinderResults.addEventListener('click', onCardActivate);
      chordFinderResults.addEventListener('mouseover', e => litFromEvent(e, true));
      chordFinderResults.addEventListener('mouseout', e => litFromEvent(e, false));
      chordFinderResults.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') onCardActivate(e);
      });
      const segmented = (group, set) => group.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
          set(btn.dataset.value);
          runChordFinder();
        });
      });
      segmented(labelModeGroup, v => { labelMode = v; });
      segmented(shapesGroup, v => { shapeFilter = v; });
    },
    // Arriving on the tab with nothing typed, the field is the only thing to
    // do — so put the cursor in it. A field with a chord in it is left alone.
    focus(){
      if (!chordFinderInput.value.trim()) chordFinderInput.focus();
    },
    // Somewhere else has named a chord — the reverse finder, where you've just
    // been told what the notes you picked add up to — and wants this tab to
    // show every way of playing it.
    show(name){
      chordFinderInput.value = name;
      GT.tabs.goTo('finder');
      runChordFinder();
    },
    // exposed for reuse and for checking shapes outside the UI
    computeFingering, findChordVoicings, buildDiagramSVG, shellIntervals, strum, ARPEGGIO_GAP,
    describeVoicing, FAMILIES,
  };
})();
