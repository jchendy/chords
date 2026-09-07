// The fretboard panel on the CAGED practice tab: the five views (roots, chord
// positions, CAGED triads/pentatonic/scales), their legend, the hover spotlight
// and the follow-playback highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { SEMITONE, MAJOR_KEYS, MINOR_KEYS, displayName, degreeLabel } = GT.theory;
  const {
    STRING_TUNING, STRING_LABELS, FRET_COUNT,
    CAGED_MAJOR, CAGED_MINOR, CAGED_ORDER, CAGED_COLORS, ROOT_PALETTE,
    cagedPlacements, seventhCells, pentaBoxPlacements, scaleBoxPlacements,
    cagedTriadBoard,
  } = GT.fretboard;

  // Everything the view needs to know about the practice tab's state arrives
  // through this host object, so the view never reaches into it directly.
  let host = {
    progression: () => [],
    isPlaying: () => false,
    mode: () => 'major',
    tonic: () => 'C',
    activeChord: () => null,
  };

  let fretMode = 'caged';        // 'roots' | 'caged' | 'penta' | 'scale' | 'positions'
  let cagedChordIdx = 0;
  let cagedShapesShown = [];
  let rootLegendData = [];
  let posLegendData = [];
  let chordPosIndex = 0;         // which clustered position "Chord positions" mode is showing
  let chordPosFollow = true;     // highlight the currently-playing chord in Chord positions (on by default)
  let activePosChordIdx = 0;     // index (within the non-dim chords shown) currently highlighted
  let stuckShape = null;         // shape name pinned by a tap on its legend entry
  let cagedFollow = true;        // selected CAGED chord tracks the playing chord (on by default)
  let activeRootPc = null;       // pitch class of the currently-playing chord's root, for Root notes mode
  let scaleTheory = 'parallel';  // 'parallel' (chord's own major/minor) | 'modal' (key's mode)
  // pentatonic / scale views: one box at a time, and whether that stretch of
  // frets stays put when the chord changes
  let singleBox = false;
  let holdPosition = false;
  let boxIndex = 0;              // which box, low to high, when showing one
  let heldWindow = null;         // { min, max } of frets kept while holding position
  let shownWindow = null;        // what the legend reports
  let fretRange = 'all';         // 'all' | 'fit' | 'from-to' — how much neck to draw
  let colorBy = 'shape';         // 'shape' (which CAGED box) | 'interval' (what the note is)
  let voiceLead = false;         // Chord positions: follow the previous shape, not one fret
  let shapeRanges = {};          // per shape: the frets it spans, for the legend

  // What each note *is* in the chord it's being read against. Colouring by
  // this rather than by CAGED box is what you want when playing over changes:
  // the roots, 3rds and 7ths are the notes that spell the chord. The roles
  // come from the chord itself, so a ♭5 reads as the 5th it is while a ♭6 in
  // the scale around it doesn't.
  const ROLE_COLORS = { root: '#e6733a', '3rd': '#2fbccb', '5th': '#5f8ce8', '7th': '#e069a6', other: '#8ec93f' };
  const ROLE_ORDER = ['root', '3rd', '5th', '7th', 'other'];

  function rolesOf(chord){
    const rootPc = SEMITONE[chord.note] % 12;
    const at = n => ((SEMITONE[n] - rootPc) % 12 + 12) % 12;
    const roles = { 0: 'root' };
    if (chord.third) roles[at(chord.third)] = '3rd';
    if (chord.fifth) roles[at(chord.fifth)] = '5th';
    if (chord.seventh) roles[at(chord.seventh)] = '7th';
    return { rootPc, roles };
  }

  // recolour a finished marker list, keeping everything else about it
  function applyColorBy(markers, chord){
    if (colorBy !== 'interval' || !chord) return markers;
    const { rootPc, roles } = rolesOf(chord);
    return markers.map(m => {
      const iv = (((STRING_TUNING[m.string] + m.fret) % 12) - rootPc + 12) % 12;
      const { split, ...rest } = m;      // one note, one role — nothing to split
      return { ...rest, color: ROLE_COLORS[roles[iv] || 'other'] };
    });
  }

  const fretModeGroup = document.getElementById('fretModeGroup');
  const cagedChordRow = document.getElementById('cagedChordRow');
  const cagedChordGroup = document.getElementById('cagedChordGroup');
  const cagedFollowToggle = document.getElementById('cagedFollowToggle');
  const scaleTheoryRow = document.getElementById('scaleTheoryRow');
  const chordPosRow = document.getElementById('chordPosRow');
  const chordPosFollowToggle = document.getElementById('chordPosFollowToggle');
  const cagedLegend = document.getElementById('cagedLegend');
  const fretboardSvg = document.getElementById('fretboard');

  fretModeGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      fretModeGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fretMode = btn.dataset.value;
      heldWindow = null;
      updateFretUI();
      renderFretboard();
    });
  });

  document.getElementById('chordPosNext').addEventListener('click', () => {
    chordPosIndex++;
    renderFretboard();
  });

  document.querySelectorAll('#scaleTheoryGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#scaleTheoryGroup .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scaleTheory = btn.dataset.value;
      renderFretboard();
    });
  });

  const boxRow = document.getElementById('boxRow');
  const singleBoxToggle = document.getElementById('singleBoxToggle');
  const holdPositionToggle = document.getElementById('holdPositionToggle');
  const fretRangeSelect = document.getElementById('fretRangeSelect');
  const colorByGroup = document.getElementById('colorByGroup');
  const colorByLabel = document.getElementById('colorByLabel');
  const voiceLeadToggle = document.getElementById('voiceLeadToggle');

  function updateFretUI(){
    const singleChordModes = fretMode === 'caged' || fretMode === 'penta' || fretMode === 'scale';
    cagedChordRow.hidden = !singleChordModes;
    scaleTheoryRow.hidden = fretMode !== 'scale';
    chordPosRow.hidden = fretMode !== 'positions';
    boxRow.hidden = !(fretMode === 'penta' || fretMode === 'scale');
    // stepping and holding only mean something once you're looking at one box
    document.getElementById('boxStep').classList.toggle('locked', !singleBox);
    holdPositionToggle.closest('.inline-check').classList.toggle('off', !singleBox);
    // Roots is already coloured by root and Chord positions by chord, so
    // there's nothing for the interval colouring to say in those
    colorByGroup.hidden = !singleChordModes;
    colorByLabel.hidden = !singleChordModes;
  }

  fretRangeSelect.addEventListener('change', () => {
    fretRange = fretRangeSelect.value;
    renderFretboard();
  });
  colorByGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      colorByGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      colorBy = btn.dataset.value;
      renderFretboard();
    });
  });
  voiceLeadToggle.addEventListener('change', () => {
    voiceLead = voiceLeadToggle.checked;
    renderFretboard();
  });

  // Which slice of neck to draw. "Fit to box" follows whatever single box is
  // on screen, with a fret of room either side; the rest are fixed stretches.
  function currentGeometry(){
    if (fretRange === 'fit' && shownWindow){
      return GT.neck.geometry(Math.max(0, shownWindow.min - 1), Math.min(FRET_COUNT, shownWindow.max + 1));
    }
    const m = /^(\d+)-(\d+)$/.exec(fretRange);
    return m ? GT.neck.geometry(Number(m[1]), Number(m[2])) : GT.neck.geometry();
  }

  // Where each shape sits, for the legend. A shape can appear twice on a
  // 15-fret neck (an octave apart), so gather contiguous runs rather than one
  // span — "0–3 · 12–15" is useful where "0–15" would be a lie.
  function collectShapeRanges(markers){
    const fretsByShape = {};
    markers.forEach(m => {
      (m.shapes || []).forEach(n => (fretsByShape[n] = fretsByShape[n] || new Set()).add(m.fret));
    });
    shapeRanges = {};
    Object.entries(fretsByShape).forEach(([n, set]) => {
      const frets = [...set].sort((a, b) => a - b);
      const runs = [];
      frets.forEach(f => {
        const last = runs[runs.length - 1];
        // a CAGED shape spans four frets, so a bigger gap is a second one
        if (last && f - last.max <= 4) last.max = f;
        else runs.push({ min: f, max: f });
      });
      shapeRanges[n] = runs;
    });
  }

  singleBoxToggle.addEventListener('change', () => {
    singleBox = singleBoxToggle.checked;
    heldWindow = null;
    updateFretUI();
    renderFretboard();
  });
  holdPositionToggle.addEventListener('change', () => {
    holdPosition = holdPositionToggle.checked;
    heldWindow = null;
    renderFretboard();
  });
  document.getElementById('boxPrev').addEventListener('click', () => { boxIndex--; heldWindow = null; renderFretboard(); });
  document.getElementById('boxNext').addEventListener('click', () => { boxIndex++; heldWindow = null; renderFretboard(); });

  // The pentatonic and scale views draw every box on the neck; with "Single
  // box" on, cut that down to one — the box at `boxIndex`, low to high — or,
  // while holding position, to whatever stretch of frets was on screen when
  // the chord changed, so the new chord's notes appear under the same hand.
  function applyBoxWindow(markers, lines, boxes){
    shownWindow = null;
    if (!singleBox || !boxes.length) return { markers, lines };
    const sorted = boxes.slice().sort((a, b) => a.anchor - b.anchor);
    const box = sorted[((boxIndex % sorted.length) + sorted.length) % sorted.length];
    const frets = box.cells.map(c => c.fret);
    let win = { min: Math.min(...frets), max: Math.max(...frets) };
    if (holdPosition){
      if (!heldWindow) heldWindow = win;
      win = heldWindow;
    }
    shownWindow = win;
    const inWin = f => f >= win.min && f <= win.max;
    return {
      markers: markers.filter(m => inWin(m.fret)),
      lines: lines.filter(l => l.cells.every(c => inWin(c.fret))),
    };
  }

  // the notes of the chord itself, so the scale views can set the rest back
  function chordTonePcs(chord){
    return new Set([chord.note, chord.third, chord.fifth, chord.seventh]
      .filter(Boolean).map(n => SEMITONE[n] % 12));
  }

  function updateCagedLock(){
    cagedChordGroup.classList.toggle('locked', cagedFollow && host.isPlaying());
  }

  // while "follows playback" is on, jump the CAGED chord picker to whatever
  // chord is currently sounding
  function followPlayingChord(force){
    if (!cagedFollow || fretMode === 'roots' || fretMode === 'positions') return;
    const active = host.activeChord();
    if (!active) return;
    const chord = host.progression()[active.idx];
    if (!chord || chord.quality === 'dim') return;   // no CAGED shapes for a diminished chord
    let ci = 0;
    for (let k = 0; k < active.idx; k++){
      if (host.progression()[k] && host.progression()[k].quality !== 'dim') ci++;
    }
    if (ci === cagedChordIdx && !force) return;
    cagedChordIdx = ci;
    cagedChordGroup.querySelectorAll('.seg-btn').forEach((b, k) => b.classList.toggle('active', k === ci));
    renderFretboard();
  }

  cagedFollowToggle.addEventListener('change', () => {
    cagedFollow = cagedFollowToggle.checked;
    updateCagedLock();
    if (cagedFollow) followPlayingChord(true);
  });

  // ---- Chord positions: a cell shared by two chords labels itself
  // differently depending on which of them is currently in focus (root for
  // one, some other degree for another) ----
  function setDotLabel(g, tag){
    const raw = g.getAttribute('data-labels');
    if (!raw) return;
    const textEl = g.querySelector('text');
    if (!textEl) return;
    for (const pair of raw.split(',')){
      const i = pair.indexOf(':');
      if (i === -1) continue;
      if (pair.slice(0, i) === tag){ textEl.textContent = pair.slice(i + 1); return; }
    }
    textEl.textContent = g.getAttribute('data-default-label') || textEl.textContent;
  }
  function resetDotLabel(g){
    if (!g.hasAttribute('data-labels')) return;
    const textEl = g.querySelector('text');
    if (textEl) textEl.textContent = g.getAttribute('data-default-label') || textEl.textContent;
  }

  // ---- Chord positions: "Follow playback" highlights the sounding chord,
  // half-lights the next one, and dims the rest ----
  function paintPositionsFollow(){
    const active = fretMode === 'positions' && chordPosFollow && host.isPlaying();
    fretboardSvg.classList.toggle('pos-follow', active);
    if (!active){
      fretboardSvg.querySelectorAll('.pos-current, .pos-next, .suppress-ring')
        .forEach(el => el.classList.remove('pos-current', 'pos-next', 'suppress-ring'));
      fretboardSvg.querySelectorAll('.note-dot[data-labels]').forEach(resetDotLabel);
      cagedLegend.querySelectorAll('.legend-current').forEach(el => el.classList.remove('legend-current'));
      return;
    }
    const total = posLegendData.length;
    const nextIdx = total ? (activePosChordIdx + 1) % total : -1;
    const cur = String(activePosChordIdx), next = String(nextIdx);
    fretboardSvg.querySelectorAll('.note-dot').forEach(g => {
      const tags = (g.getAttribute('data-shapes') || '').split(',').filter(Boolean);
      const isCurrent = tags.includes(cur);
      const isNext = !isCurrent && tags.includes(next);
      g.classList.toggle('pos-current', isCurrent);
      g.classList.toggle('pos-next', isNext);
      // a note that's only a root for some *other* chord shouldn't wear the
      // root ring while it's lit up as part of the current chord's shape
      const rootFor = (g.getAttribute('data-rootfor') || '').split(',').filter(Boolean);
      g.classList.toggle('suppress-ring', isCurrent && rootFor.length > 0 && !rootFor.includes(cur));
      // and it should read as whichever degree it is *for* the chord that's
      // actually lighting it up right now, not whichever chord happened to
      // render its label first
      if (isCurrent) setDotLabel(g, cur);
      else if (isNext) setDotLabel(g, next);
      else resetDotLabel(g);
    });
    fretboardSvg.querySelectorAll('.shape-line').forEach(l => {
      const tag = l.getAttribute('data-shape');
      l.classList.toggle('pos-current', tag === cur);
      l.classList.toggle('pos-next', tag === next);
    });
    cagedLegend.querySelectorAll('[data-shape]').forEach(el => {
      el.classList.toggle('legend-current', el.getAttribute('data-shape') === cur);
    });
  }

  // while "follow playback" is on, track which chord in the cluster is sounding
  function followPositionsChord(active, force){
    if (fretMode !== 'positions' || !chordPosFollow) return;
    const chord = host.progression()[active.idx];
    if (!chord || chord.quality === 'dim') return;   // keep showing the last real chord
    let ci = 0;
    for (let k = 0; k < active.idx; k++){
      if (host.progression()[k] && host.progression()[k].quality !== 'dim') ci++;
    }
    if (ci === activePosChordIdx && !force) return;
    activePosChordIdx = ci;
    renderFretboard();
  }

  chordPosFollowToggle.addEventListener('change', () => {
    chordPosFollow = chordPosFollowToggle.checked;
    if (chordPosFollow && host.isPlaying() && host.activeChord()) followPositionsChord(host.activeChord(), true);
    else renderFretboard();
  });

  // ---- spotlight one CAGED shape (or, in Chord positions, one chord) when
  // its legend entry is hovered / tapped ----
  function paintShapeSpotlight(shape){
    fretboardSvg.classList.toggle('shape-focus', !!shape);
    if (shape) fretboardSvg.classList.remove('pos-follow');   // manual spotlight always wins
    fretboardSvg.querySelectorAll('.note-dot').forEach(g => {
      const list = (g.getAttribute('data-shapes') || '').split(',').filter(Boolean);
      const isHot = !!shape && list.includes(shape);
      g.classList.toggle('hot', isHot);
      // a shared cell reads as whatever degree it is *for* the spotlighted
      // chord, not whichever chord happened to render its label first
      if (isHot) setDotLabel(g, shape);
      else resetDotLabel(g);
    });
    fretboardSvg.querySelectorAll('.shape-line').forEach(l => {
      l.classList.toggle('hot', !!shape && l.getAttribute('data-shape') === shape);
    });
  }
  function refreshShapeSpotlight(hoverShape){
    const shape = hoverShape || stuckShape;
    paintShapeSpotlight(shape);
    if (!shape) paintPositionsFollow();   // restore the live follow-highlight once released
  }

  cagedLegend.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-shape]');
    if (el) refreshShapeSpotlight(el.dataset.shape);
  });
  cagedLegend.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-shape]');
    if (!el) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return; // moved within the same entry
    refreshShapeSpotlight(null);
  });
  cagedLegend.addEventListener('focusin', e => {
    const el = e.target.closest('[data-shape]');
    if (el) refreshShapeSpotlight(el.dataset.shape);
  });
  cagedLegend.addEventListener('focusout', e => {
    const el = e.target.closest('[data-shape]');
    if (el) refreshShapeSpotlight(null);
  });
  cagedLegend.addEventListener('click', e => {
    const el = e.target.closest('[data-shape]');
    if (!el) return;
    e.stopPropagation();
    stuckShape = stuckShape === el.dataset.shape ? null : el.dataset.shape;
    refreshShapeSpotlight(null);
  });
  cagedLegend.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-shape]');
    if (!el) return;
    e.preventDefault();
    stuckShape = stuckShape === el.dataset.shape ? null : el.dataset.shape;
    refreshShapeSpotlight(null);
  });
  // tapping / clicking anywhere else releases a pinned shape
  document.addEventListener('click', () => {
    if (stuckShape !== null) stuckShape = null;
    refreshShapeSpotlight(null);
  });

  function rebuildCagedPicker(){
    const cands = host.progression().filter(c => c.quality !== 'dim');
    if (cagedChordIdx >= cands.length) cagedChordIdx = 0;
    cagedChordGroup.innerHTML = '';
    cands.forEach((chord, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === cagedChordIdx ? ' active' : '');
      b.textContent = displayName(chord);
      b.addEventListener('click', () => {
        cagedChordIdx = i;
        cagedChordGroup.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderFretboard();
      });
      cagedChordGroup.appendChild(b);
    });
  }

  function computeFretData(){
    if (!host.progression().length) return { markers: [], lines: [] };

    if (fretMode === 'positions'){
      const chords = host.progression().filter(c => c.quality !== 'dim');
      if (!chords.length) return { markers: [], lines: [] };

      // every CAGED placement available to each chord, cheapest-fret first —
      // the G-shape is only realistically playable in its open-chord form
      // (barring it up the neck is a stretch few players use), so drop every
      // G-shape placement except that one
      const perChordPlacements = chords.map(chord => {
        const rootPc = SEMITONE[chord.note] % 12;
        const shapeSet = chord.quality === 'min' ? CAGED_MINOR : CAGED_MAJOR;
        return cagedPlacements(rootPc, shapeSet)
          .filter(p => p.name !== 'G' || p.fretMin === 0)
          .sort((a, b) => a.meanFret - b.meanFret);
      });

      // "Next" cycles through the first chord's own positions (low to high,
      // wrapping back to the lowest); every other chord picks whichever of
      // its own placements sits closest to that same fret, so the whole set
      // stays clustered together horizontally
      const refPlacements = perChordPlacements.find(p => p.length) || [];
      if (!refPlacements.length) return { markers: [], lines: [] };
      const idx = ((chordPosIndex % refPlacements.length) + refPlacements.length) % refPlacements.length;
      const targetFret = refPlacements[idx].meanFret;
      // With voice leading on, each chord aims at wherever the *previous* one
      // landed rather than at one fixed fret, so the shapes walk from one to
      // the next the way a hand does instead of all crowding one position.
      let aimFret = targetFret;

      const lines = [];
      const cellMap = new Map();
      posLegendData = [];

      chords.forEach((chord, i) => {
        const placements = perChordPlacements[i];
        if (!placements.length) return;
        const placement = placements.reduce((best, p) =>
          Math.abs(p.meanFret - aimFret) < Math.abs(best.meanFret - aimFret) ? p : best);
        if (voiceLead) aimFret = placement.meanFret;
        const color = ROOT_PALETTE[i % ROOT_PALETTE.length];
        const tag = String(i);   // reuses the shape-spotlight mechanism, keyed by chord index
        posLegendData.push({ name: displayName(chord), numeral: chord.numeral, color, tag, shapeLetter: placement.name });

        const rootPc = SEMITONE[chord.note] % 12;
        const thirdPc = SEMITONE[chord.third] % 12;
        const fifthPc = SEMITONE[chord.fifth] % 12;
        const nameOf = pc =>
          pc === rootPc ? chord.note : pc === thirdPc ? degreeLabel(chord, 'third') :
          pc === fifthPc ? degreeLabel(chord, 'fifth') : degreeLabel(chord, 'seventh');

        const cellsToShow = chord.seventh
          ? seventhCells(placement, rootPc, SEMITONE[chord.seventh] % 12)
          : placement.cells.slice();

        // the "lowest root" is the root-note cell closest to the low E string
        // (highest string index) — the one a player would actually anchor on
        const rootCells = cellsToShow.filter(c => (STRING_TUNING[c.string] + c.fret) % 12 === rootPc);
        const lowestRootCell = rootCells.length
          ? rootCells.reduce((a, b) => (b.string > a.string ? b : a))
          : null;

        cellsToShow.forEach(c => {
          const key = c.string + ':' + c.fret;
          const pc = (STRING_TUNING[c.string] + c.fret) % 12;
          if (!cellMap.has(key)) cellMap.set(key, { string: c.string, fret: c.fret, contribs: [] });
          const isLowestRoot = !!lowestRootCell && c.string === lowestRootCell.string && c.fret === lowestRootCell.fret;
          cellMap.get(key).contribs.push({ color, tag, label: nameOf(pc), isRoot: pc === rootPc, isLowestRoot });
        });
      });

      const markers = [...cellMap.values()].map(m => {
        const isRoot = m.contribs.some(c => c.isRoot);
        const isLowestRoot = m.contribs.some(c => c.isLowestRoot);
        // which chord(s) this cell is actually a root note *for* — used to
        // suppress the root ring, while following playback, on a note that
        // only happens to sit on some *other* chord's root
        const rootShapes = [...new Set(m.contribs.filter(c => c.isRoot).map(c => c.tag))];
        const shapes = [...new Set(m.contribs.map(c => c.tag))];
        // this cell's label depends on which chord it's being read as (root
        // for one chord, some other degree for another) — keep every
        // chord's own label so the fretboard can show the right one once a
        // specific chord is spotlighted or currently playing
        const labelsByTag = {};
        m.contribs.forEach(c => { if (!(c.tag in labelsByTag)) labelsByTag[c.tag] = c.label; });
        const seenColors = new Set();
        const uniqueContribs = m.contribs.filter(c => {
          if (seenColors.has(c.color)) return false;
          seenColors.add(c.color);
          return true;
        });
        if (uniqueContribs.length === 1){
          return { string: m.string, fret: m.fret, color: uniqueContribs[0].color, label: uniqueContribs[0].label, isRoot, isLowestRoot, shapes, rootShapes, labelsByTag };
        }
        // two different chords share this exact fret — split the dot between them
        const two = uniqueContribs.slice(0, 2);
        return { string: m.string, fret: m.fret, split: two.map(c => c.color), label: two[0].label, isRoot, isLowestRoot, shapes, rootShapes, labelsByTag };
      });

      return { markers, lines };
    }

    if (fretMode === 'penta'){
      const cands = host.progression().filter(c => c.quality !== 'dim');
      const chord = cands[Math.min(cagedChordIdx, cands.length - 1)];
      if (!chord) return { markers: [], lines: [] };
      const rootPc = SEMITONE[chord.note] % 12;
      const isMinor = chord.quality === 'min';
      const scale = isMinor
        ? [[0, '1'], [3, '♭3'], [5, '4'], [7, '5'], [10, '♭7']]   // minor pentatonic
        : [[0, '1'], [2, '2'], [4, '3'], [7, '5'], [9, '6']];               // major pentatonic
      const degByPc = {};
      scale.forEach(([off, deg]) => { degByPc[(rootPc + off) % 12] = deg; });

      const placements = pentaBoxPlacements(rootPc, isMinor);
      cagedShapesShown = CAGED_ORDER.filter(n => placements.some(p => p.name === n));
      const tones = chordTonePcs(chord);

      // lines trace each CAGED chord shape (root / 3rd / 5th), one note per
      // string, following the actual fingering — same as "CAGED chords" mode
      const lines = cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR)
        .filter(p => p.cells.length > 1)
        .map(p => ({ color: CAGED_COLORS[p.name], shape: p.name, cells: p.cells.map(c => ({ string: c.string, fret: c.fret })) }));

      // every pentatonic note is coloured by the CAGED box(es) that actually
      // contain it: notes shared by two adjacent boxes get a split dot
      // (left half = lower box, right half = higher box)
      const markers = [];
      for (let s = 0; s < 6; s++){
        for (let f = 0; f <= FRET_COUNT; f++){
          const pc = (STRING_TUNING[s] + f) % 12;
          if (!(pc in degByPc)) continue;
          const owners = placements.filter(p => p.cells.some(c => c.string === s && c.fret === f));
          const ownerNames = [...new Set(owners.map(o => o.name))];
          const base = { string: s, fret: f, label: degByPc[pc], isRoot: pc === rootPc, shapes: ownerNames,
            passing: !tones.has(pc) };
          if (owners.length >= 2){
            const two = owners.slice()
              .sort((a, b) => Math.abs(f - a.anchor) - Math.abs(f - b.anchor))
              .slice(0, 2)
              .sort((a, b) => a.anchor - b.anchor);
            markers.push({ ...base, split: [CAGED_COLORS[two[0].name], CAGED_COLORS[two[1].name]] });
          } else if (owners.length === 1){
            markers.push({ ...base, color: CAGED_COLORS[owners[0].name] });
          } else {
            let best = null, bd = Infinity;
            placements.forEach(p => { const d = Math.abs(f - p.anchor); if (d < bd){ bd = d; best = p; } });
            markers.push({ ...base, shapes: best ? [best.name] : [], color: best ? CAGED_COLORS[best.name] : '#6b655b' });
          }
        }
      }
      const onNeck = placements.filter(p => p.anchor >= 0 && p.anchor <= FRET_COUNT);
      const shown = applyBoxWindow(markers, lines, onNeck);
      return { markers: applyColorBy(shown.markers, chord), lines: shown.lines };
    }

    if (fretMode === 'scale'){
      const cands = host.progression().filter(c => c.quality !== 'dim');
      const chord = cands[Math.min(cagedChordIdx, cands.length - 1)];
      if (!chord) return { markers: [], lines: [] };
      const rootPc = SEMITONE[chord.note] % 12;
      const isMinor = chord.quality === 'min';

      let degByPc, scalePcs;
      if (scaleTheory === 'modal'){
        // chord-scale theory: the mode of the progression's key rooted on
        // this chord (e.g. the IV chord of a major key reads as Lydian)
        const parentNotes = host.mode() === 'major' ? MAJOR_KEYS[host.tonic()] : MINOR_KEYS[host.tonic()];
        const pcs = new Set(parentNotes.map(n => SEMITONE[n] % 12));
        [chord.note, chord.third, chord.fifth].forEach(n => pcs.add(SEMITONE[n] % 12));
        const degNames = isMinor
          ? ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']
          : ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];
        degByPc = {};
        pcs.forEach(pc => { degByPc[pc] = degNames[(pc - rootPc + 12) % 12]; });
        scalePcs = pcs;
      } else {
        // parallel scale: the scale matching the chord's own quality, rooted
        // on the chord — a major chord gets the major (Ionian) scale, a minor
        // chord the natural minor (Aeolian) scale — independent of the key.
        // A dominant chord gets Mixolydian, so its own ♭7 is in the scale
        // rather than sitting outside it.
        const flat7 = chord.seventh && (SEMITONE[chord.seventh] - rootPc + 12) % 12 === 10;
        const scaleDeg = isMinor
          ? [[0, '1'], [2, '2'], [3, '♭3'], [5, '4'], [7, '5'], [8, '♭6'], [10, '♭7']]
          : flat7
            ? [[0, '1'], [2, '2'], [4, '3'], [5, '4'], [7, '5'], [9, '6'], [10, '♭7']]
            : [[0, '1'], [2, '2'], [4, '3'], [5, '4'], [7, '5'], [9, '6'], [11, '7']];
        degByPc = {};
        scaleDeg.forEach(([off, d]) => { degByPc[(rootPc + off) % 12] = d; });
        scalePcs = new Set(Object.keys(degByPc).map(Number));
      }

      const boxes = scaleBoxPlacements(rootPc, isMinor, scalePcs);
      const onNeck = b => b.anchor >= 0 && b.anchor <= FRET_COUNT;
      cagedShapesShown = CAGED_ORDER.filter(n => boxes.some(b => b.name === n && onNeck(b)));
      const tones = chordTonePcs(chord);

      const lines = cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR)
        .filter(p => p.cells.length > 1)
        .map(p => ({ color: CAGED_COLORS[p.name], shape: p.name, cells: p.cells.map(c => ({ string: c.string, fret: c.fret })) }));

      const markers = [];
      for (let s = 0; s < 6; s++){
        for (let f = 0; f <= FRET_COUNT; f++){
          const pc = (STRING_TUNING[s] + f) % 12;
          if (!scalePcs.has(pc)) continue;
          // only boxes that genuinely sit on the neck can share a note; a
          // partial box poking past the nut / 15th fret doesn't create a split
          const owners = boxes.filter(b => onNeck(b) && b.cells.some(c => c.string === s && c.fret === f));
          const ownerNames = [...new Set(owners.map(o => o.name))];
          const base = { string: s, fret: f, label: degByPc[pc],
            isRoot: pc === rootPc, shapes: ownerNames, passing: !tones.has(pc) };
          if (ownerNames.length >= 2){
            const two = owners.slice()
              .sort((a, b) => Math.abs(f - a.anchor) - Math.abs(f - b.anchor))
              .slice(0, 2)
              .sort((a, b) => a.anchor - b.anchor);
            markers.push({ ...base, split: [CAGED_COLORS[two[0].name], CAGED_COLORS[two[1].name]] });
          } else if (ownerNames.length === 1){
            markers.push({ ...base, color: CAGED_COLORS[ownerNames[0]] });
          } else {
            let best = null, bd = Infinity;
            boxes.forEach(b => { const d = Math.abs(f - b.anchor); if (d < bd){ bd = d; best = b; } });
            markers.push({ ...base, shapes: best ? [best.name] : [], color: best ? CAGED_COLORS[best.name] : '#6b655b' });
          }
        }
      }
      const shown = applyBoxWindow(markers, lines, boxes.filter(onNeck));
      return { markers: applyColorBy(shown.markers, chord), lines: shown.lines };
    }

    if (fretMode === 'roots'){
      const pcName = {};
      const pcNum = {};
      const order = [];
      host.progression().forEach(c => {
        const pc = SEMITONE[c.note] % 12;
        if (!(pc in pcName)){ pcName[pc] = c.note; pcNum[pc] = c.numeral; order.push(pc); }
      });
      const pcColor = {};
      order.forEach((pc, i) => { pcColor[pc] = ROOT_PALETTE[i % ROOT_PALETTE.length]; });
      rootLegendData = order.map(pc => ({ name: pcName[pc], num: pcNum[pc], color: pcColor[pc] }));

      const markers = [];
      for (let s = 0; s < 6; s++){
        for (let f = 0; f <= FRET_COUNT; f++){
          const pc = (STRING_TUNING[s] + f) % 12;
          if (pc in pcName){
            markers.push({ string: s, fret: f, color: pcColor[pc], label: pcName[pc],
              isRoot: pc === activeRootPc, pc });
          }
        }
      }
      return { markers, lines: [] };
    }

    const cands = host.progression().filter(c => c.quality !== 'dim');
    const chord = cands[Math.min(cagedChordIdx, cands.length - 1)];
    if (!chord) return { markers: [], lines: [] };
    // a chord carrying a 7th shows its 7th-chord shapes, the 7th as a hollow dot
    const board = cagedTriadBoard(SEMITONE[chord.note] % 12, chord.quality === 'min', chord.note,
      chord.seventh ? SEMITONE[chord.seventh] % 12 : null);
    cagedShapesShown = board.shapesShown;
    const { markers, lines } = board;
    return { markers: applyColorBy(markers, chord), lines };
  }

  // the chord the single-chord views are showing
  function currentChord(){
    const cands = host.progression().filter(c => c.quality !== 'dim');
    return cands[Math.min(cagedChordIdx, cands.length - 1)] || null;
  }

  function renderFretLegend(){
    if (fretMode === 'roots'){
      cagedLegend.innerHTML = rootLegendData
        .map(r => `<span><i style="background:${r.color}"></i>${r.name}<em>${r.num}</em></span>`)
        .join('');
      return;
    }
    // each entry says where on the neck that shape sits, so you can find it
    // without hunting for the colour
    const range = n => {
      const runs = shapeRanges[n];
      if (!runs || !runs.length) return '';
      return `<em class="range">${runs.map(r => `${r.min}–${r.max}`).join(' · ')}</em>`;
    };
    if (fretMode === 'positions'){
      cagedLegend.innerHTML = posLegendData
        .map(c => `<span data-shape="${c.tag}" tabindex="0" role="button" aria-label="Highlight ${c.name}"><i style="background:${c.color}"></i>${c.name}<em>${c.numeral}</em><small class="pos-shape-tag">${c.shapeLetter}</small>${range(c.tag)}</span>`)
        .join('');
      return;
    }
    const parts = [];
    if (colorBy === 'interval'){
      // the dots are coloured by what each note is in the chord, so that's
      // what the legend has to explain — the shape outlines still trace boxes
      const chord = currentChord();
      const names = ['root', '3rd', '5th'];
      if (chord && chord.seventh) names.push('7th');
      if (fretMode === 'penta' || fretMode === 'scale') names.push('other');
      ROLE_ORDER.filter(n => names.includes(n)).forEach(n =>
        parts.push(`<span><i style="background:${ROLE_COLORS[n]}"></i>${n === 'other' ? 'scale tone' : n}</span>`));
    } else {
      // only the shapes actually on screen get an entry — a single box, or a
      // zoomed-in stretch of neck, leaves the others out
      const drawn = new Set([...fretboardSvg.querySelectorAll('.note-dot[data-shapes]')]
        .flatMap(g => g.getAttribute('data-shapes').split(',')));
      cagedShapesShown.filter(n => drawn.has(n)).forEach(n =>
        parts.push(`<span data-shape="${n}" tabindex="0" role="button" aria-label="Highlight ${n} shape"><i style="background:${CAGED_COLORS[n]}"></i>${n} shape${range(n)}</span>`));
    }
    // colouring by interval, the swatches already name the root and the 7th —
    // saying it twice reads as two different things
    if (colorBy !== 'interval'){
      parts.push(`<span><i class="ring"></i>root</span>`);
      if (fretMode === 'caged') parts.push(`<span><i class="hollow"></i>7th</span>`);
    }
    if (fretMode === 'penta' || fretMode === 'scale') parts.push(`<span><i class="passing"></i>passing note</span>`);
    if (shownWindow) parts.push(`<span><em>box: frets ${shownWindow.min}–${shownWindow.max}</em></span>`);
    cagedLegend.innerHTML = parts.join('');
  }

  function renderFretboard(){
    const { markers, lines } = computeFretData();
    // computeFretData decides what to draw; the geometry decides how much of
    // the neck it's drawn on, and skips anything off the end
    const geo = currentGeometry();
    collectShapeRanges(markers.filter(m => geo.inRange(m.fret)));
    fretboardSvg.setAttribute('viewBox', geo.viewBox);
    fretboardSvg.style.maxWidth = geo.maxWidth + 'px';
    fretboardSvg.style.minWidth = geo.minWidth + 'px';
    fretboardSvg.innerHTML = geo.buildSVG(markers, lines);
    renderFretLegend();
    fretboardSvg.classList.toggle('positions-mode', fretMode === 'positions');

    if (fretMode === 'roots' && activeRootPc != null){
      // highlight the root(s) of whichever chord is currently playing
      fretboardSvg.classList.add('shape-focus');
      fretboardSvg.querySelectorAll('.note-dot[data-rootpc]').forEach(g => {
        g.classList.toggle('hot', g.getAttribute('data-rootpc') === String(activeRootPc));
      });
    } else if (fretMode === 'positions'){
      stuckShape = null;
      fretboardSvg.classList.remove('shape-focus');
      paintPositionsFollow();
    } else {
      // a rebuilt board otherwise drops any active spotlight
      stuckShape = null;
      fretboardSvg.classList.remove('shape-focus');
    }
  }

  // in Root notes mode, ring + spotlight the root(s) of whichever chord is playing
  function followRootHighlight(active){
    if (fretMode !== 'roots') return;
    const chord = host.progression()[active.idx];
    if (!chord) return;
    const rootPc = SEMITONE[chord.note] % 12;
    if (rootPc === activeRootPc) return;
    activeRootPc = rootPc;
    renderFretboard();
  }

  // Everything a fretboard change goes through while a progression plays.
  function followChord(active){
    if (cagedFollow) followPlayingChord(false);
    followRootHighlight(active);
    followPositionsChord(active);
  }

  function resetFollow(){
    activeRootPc = null;
    activePosChordIdx = 0;
  }

  function onPlaybackStarted(){
    updateCagedLock();
    if (fretMode === 'positions') renderFretboard();   // paint the follow tiers from beat one
  }

  function onPlaybackStopped(){
    updateCagedLock();
    if (activeRootPc != null){
      activeRootPc = null;
      if (fretMode === 'roots') renderFretboard();
    }
    if (fretMode === 'positions') renderFretboard();   // drop the follow highlight
  }

  GT.fretboardView = {
    init(hostImpl){ host = hostImpl; updateFretUI(); },
    render: renderFretboard,
    updateVisibility: updateFretUI,
    rebuildChordPicker: rebuildCagedPicker,
    resetPosition(){ chordPosIndex = 0; },   // a fresh progression starts at the lowest cluster
    resetFollow, followChord, onPlaybackStarted, onPlaybackStopped,
  };
})();
