// Chord finder tab: turns a typed chord name into playable shapes on the neck,
// works out a fingering for each, and draws them as chord diagrams.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { parseChordName } = GT.theory;
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
  let labelMode = 'fingers';        // 'fingers' | 'degrees'
  const MAX_VOICINGS = 16;          // enough for the whole neck plus a few alternatives
  const EXTRA_VOICINGS = 6;         // room for grips the containment rule would otherwise hide

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
  function computeFingering(cells, allowedPcs){
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
    const shell = opts.shellOnly ? shellIntervals(formula) : null;
    const shellPcs = shell ? new Set(shell.map(iv => (rootPc + iv) % 12)) : null;
    const threeNoteOnly = !!opts.threeNoteOnly && !shell;
    const isMinorTriad = formula.intervals.includes(3);
    // the chord's own 5th — flat for a diminished chord, sharp for augmented
    const fifthPc = (rootPc + ([6, 7, 8].find(iv => formula.intervals.includes(iv)) || 7)) % 12;
    const essentialPcs = new Set(formula.essential.map(iv => (rootPc + iv) % 12));
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
            for (const pc of essentialPcs) if (!playedPcs.has(pc)) return;
          }
          const frettedOnly = played.map(p => p.fret).filter(f => f > 0);
          const maxFret = frettedOnly.length ? Math.max(...frettedOnly) : 0;
          const span = frettedOnly.length ? maxFret - Math.min(...frettedOnly) : 0;
          if (span > 3) return;

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
                         caged: match ? match.name : null,
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
    // that happen to contain them.
    const isThinnerCopyOf = (a, b) => {
      if (!isSubsetOf(a, b)) return false;
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
    // in, as long as they're grips in their own right: root underneath, no
    // string skipped or left open in the middle, and not merely a picked
    // shape with open strings left off. A power chord is exempt from that
    // last test — its cut-down form *is* the grip.
    const isPower = formula.name === '5';
    if (!shell){
      const extras = [];
      // compact ones first — those are what the rules above hide
      passedOver.sort((a, b) => a.cells.length - b.cells.length || b.rank - a.rank);
      for (const r of passedOver){
        if (extras.length >= EXTRA_VOICINGS) break;
        if (!r.rootInBass || r.innerMutes || r.innerOpens || r.cells.length > 5) continue;
        const all = chosen.concat(extras);
        if (!isPower && all.some(c => isThinnerCopyOf(r, c) || isThinnerCopyOf(c, r))) continue;
        extras.push(r);
      }
      chosen.push(...extras);
    }

    // Walk up the neck, everyday grip first within each position. Everything
    // within reach of the nut counts as one position — otherwise a shape
    // that happens to be all open strings sorts ahead of the real open chord.
    // A power chord is all about its bottom: fewest strings, root and 5th on
    // the two lowest of them, as low as they go, fretted rather than open.
    const position = r => r.startFret <= 3 ? 0 : r.startFret;
    return chosen.sort((a, b) => position(a) - position(b)
      || (isPower && (a.cells.length - b.cells.length || b.powerShape - a.powerShape
                      || b.bassString - a.bassString || a.openCount - b.openCount))
      || b.rank - a.rank);
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

  // small chord-diagram SVG for one voicing (same visual language as the main fretboard)
  // `labelMode` is 'fingers' (1-4) or 'degrees' (R, 3, 5, ♭7 ...)
  function buildDiagramSVG(cells, rootPc, fingering, labelMode = 'fingers', formula = null){
    const frettedPositives = cells.map(c => c.fret).filter(f => f > 0);
    const maxFret = frettedPositives.length ? Math.max(...frettedPositives) : 0;
    const minFret = frettedPositives.length ? Math.min(...frettedPositives) : 0;
    const openPosition = maxFret <= 4;
    const startFret = openPosition ? 1 : minFret;
    const numFrets = 4;
    const cellByString = new Map(cells.map(c => [c.string, c]));

    const W = 150, H = 155;
    const padL = 26, padR = 12, padT = 30, padB = 8;
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
      if (c.fret === 0){
        els.push(`<circle class="diagram-open${isRoot ? ' diagram-root' : ''}" cx="${openX}" cy="${stringY(s)}" r="6"/>`);
        if (labelMode === 'degrees'){
          els.push(`<text class="diagram-open-degree" x="${openX}" y="${stringY(s) - 9}" text-anchor="middle">${degree}</text>`);
        }
        continue;
      }
      const cx = colX(c.fret), cy = stringY(s);
      els.push(`<circle class="${isRoot ? 'diagram-root' : 'diagram-note'}" cx="${cx}" cy="${cy}" r="8"/>`);
      const label = labelMode === 'degrees' ? degree : fingerByString[s];
      if (label){
        const small = String(label).length > 1;
        els.push(`<text class="diagram-finger${small ? ' small' : ''}" x="${cx}" y="${cy + 3.2}" text-anchor="middle">${label}</text>`);
      }
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
      return;
    }
    labelModeRow.hidden = false;
    const parsed = parseChordName(raw);
    if (!parsed){
      chordFinderError.textContent = `Couldn't recognize "${raw.trim()}" as a chord name.`;
      chordFinderResults.innerHTML = '';
      cagedOverviewEl.innerHTML = '';
      triadOnlyRow.hidden = true;
      shellOnlyRow.hidden = true;
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
      bassPc: parsed.bassPc,
    });
    const chordLabel = parsed.rootName + parsed.formula.name + (parsed.bassName ? '/' + parsed.bassName : '');
    if (!voicings.length){
      const what = shellOnly ? `shell voicing for ${chordLabel}` : `shape for ${chordLabel}`;
      chordFinderResults.innerHTML = `<p class="diagram-empty">No playable ${what} within a comfortable stretch.</p>`;
      return;
    }
    shownVoicings = voicings;
    chordFinderResults.innerHTML = voicings.map((v, i) => `
      <div class="diagram-card" role="button" tabindex="0" data-voicing="${i}" aria-label="Play ${chordLabel}, shape ${i + 1}">
        ${buildDiagramSVG(v.cells, parsed.rootPc, v.fingering, labelMode, parsed.formula)}
        <p class="diagram-caption">${chordLabel}${v.caged ? `<span class="diagram-shape">${v.caged} shape</span>` : ''}</p>
      </div>
    `).join('');
  }

  // ---- hearing a shape ----------------------------------------------------
  const OPEN_MIDI = [64, 59, 55, 50, 45, 40];     // high e down to low E
  const freqOf = (string, fret) => 440 * Math.pow(2, (OPEN_MIDI[string] + fret - 69) / 12);

  // Sound the shape low string to high. The gap between the notes is the
  // difference between a chord and an arpeggio: a pick's sweep is fast enough
  // that the notes arrive as one, and spacing them out is the same notes heard
  // one at a time.
  function strum(cells, gap = 0.018){
    const audio = GT.audio;
    audio.ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    const t0 = audio.ctx().currentTime + 0.03;
    const ordered = cells.slice().sort((a, b) => b.string - a.string);
    // an arpeggio's notes have to ring past the ones after them to add up to
    // the chord, so a slower roll holds each note longer
    const hold = Math.max(1.6, 0.9 + gap * ordered.length * 1.6);
    ordered.forEach((c, i) => audio.playGuitar(freqOf(c.string, c.fret), t0 + i * gap, hold, 0.9, 'clean'));
  }
  const ARPEGGIO_GAP = 0.28;

  function onCardActivate(e){
    const card = e.target.closest('.diagram-card');
    if (!card) return;
    const v = shownVoicings[Number(card.dataset.voicing)];
    if (!v) return;
    e.preventDefault();
    strum(v.cells);
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
      chordFinderResults.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') onCardActivate(e);
      });
      labelModeGroup.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          labelModeGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
          labelMode = btn.dataset.value;
          runChordFinder();
        });
      });
    },
    // Arriving on the tab with nothing typed, the field is the only thing to
    // do — so put the cursor in it. A field with a chord in it is left alone.
    focus(){
      if (!chordFinderInput.value.trim()) chordFinderInput.focus();
    },
    // exposed for reuse and for checking shapes outside the UI
    computeFingering, findChordVoicings, buildDiagramSVG, shellIntervals, strum, ARPEGGIO_GAP,
  };
})();
