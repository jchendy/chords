// The fretboard panel on the CAGED practice tab: the six views (roots, chord
// positions, Chords/pentatonic/scales), their legend, the hover spotlight
// and the follow-playback highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { SEMITONE, MAJOR_KEYS, MINOR_KEYS, displayName, degreeLabel } = GT.theory;
  const {
    STRING_TUNING, STRING_LABELS, FRET_COUNT,
    CAGED_MAJOR, CAGED_MINOR, CAGED_ORDER, CAGED_COLORS, ROOT_PALETTE,
    cagedPlacements, seventhCells, arpeggioCells, cagedArpeggioBoxes, stringSetTriads,
    pentaBoxPlacements, scaleBoxPlacements, cagedTriadBoard, closeTriadShape,
  } = GT.fretboard;

  // Which chord tone is underneath a three-string triad — the thing that
  // tells one shape from another once you're comping with them.
  const INVERSIONS = [
    { tag: 'root', label: 'root position', color: '#e6733a' },
    { tag: '1st', label: '1st inversion', color: '#2fbccb' },
    { tag: '2nd', label: '2nd inversion', color: '#8ec93f' },
  ];
  const INVERSION_COLOR = Object.fromEntries(INVERSIONS.map(i => [i.tag, i.color]));

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
  let chordPosIndex = 0;         // which clustered position Progression mode is showing
  let chordPosFollow = true;     // highlight the currently-playing chord in Progression (on by default)
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
  let voiceLead = false;         // Progression: follow the previous shape, not one fret
  let allTones = false;          // Progression: each chord's whole arpeggio, not just its grip
  let wholeArpeggio = false;     // Chords: the shapes opened out into the whole arpeggio
  let ghostOthers = false;       // Chords: the progression's other chords, ghosted in
  let stringSetLow = 2;          // Triads: lowest string of the set (2 = e-B-G)
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
  const allTonesToggle = document.getElementById('allTonesToggle');
  const stringSetRow = document.getElementById('stringSetRow');
  const cagedViewRow = document.getElementById('cagedViewRow');
  const wholeArpeggioToggle = document.getElementById('wholeArpeggioToggle');
  const ghostOthersToggle = document.getElementById('ghostOthersToggle');

  document.querySelectorAll('#stringSetGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stringSetGroup .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      stringSetLow = Number(btn.dataset.value);
      renderFretboard();
    });
  });

  function updateFretUI(){
    const singleChordModes = ['caged', 'triads3', 'penta', 'scale'].includes(fretMode);
    cagedChordRow.hidden = !singleChordModes;
    scaleTheoryRow.hidden = fretMode !== 'scale';
    chordPosRow.hidden = fretMode !== 'positions';
    stringSetRow.hidden = fretMode !== 'triads3';
    cagedViewRow.hidden = fretMode !== 'caged';
    boxRow.hidden = !['caged', 'penta', 'scale'].includes(fretMode);
    // stepping and holding only mean something once you're looking at one box
    document.getElementById('boxStep').classList.toggle('locked', !singleBox);
    holdPositionToggle.closest('.inline-check').classList.toggle('off', !singleBox);
    // Roots is already coloured by root and Progression by chord, so
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
  allTonesToggle.addEventListener('change', () => {
    allTones = allTonesToggle.checked;
    renderFretboard();
  });
  wholeArpeggioToggle.addEventListener('change', () => {
    wholeArpeggio = wholeArpeggioToggle.checked;
    heldWindow = null;      // the grips and the arpeggio don't share a window
    renderFretboard();
  });
  ghostOthersToggle.addEventListener('change', () => {
    ghostOthers = ghostOthersToggle.checked;
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
    markers.filter(m => !m.ghost).forEach(m => {
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

  // ---- Progression: a cell shared by two chords labels itself
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

  // ---- Progression: "Follow playback" highlights the sounding chord,
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

  // ---- spotlight one CAGED shape (or, in Progression, one chord) when
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
  // In Root notes mode the spotlight belongs to the chord that's sounding, not
  // to a legend entry: ring its root(s) wherever they fall on the neck.
  function paintRootSpotlight(){
    const on = fretMode === 'roots' && activeRootPc != null;
    fretboardSvg.classList.toggle('shape-focus', on);
    if (!on) return;
    fretboardSvg.querySelectorAll('.note-dot[data-rootpc]').forEach(g => {
      g.classList.toggle('hot', g.getAttribute('data-rootpc') === String(activeRootPc));
    });
  }

  function refreshShapeSpotlight(hoverShape){
    const shape = hoverShape || stuckShape;
    paintShapeSpotlight(shape);
    // put back whatever the view was highlighting on its own once released
    if (!shape){
      paintPositionsFollow();
      paintRootSpotlight();
    }
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
  // tapping / clicking anywhere else releases a pinned shape — but only when
  // one is actually pinned. Repainting on every click anywhere on the page
  // would also wipe the root spotlight Root notes puts up while it plays.
  document.addEventListener('click', () => {
    if (stuckShape === null) return;
    stuckShape = null;
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
    // Only the box views set a window, and only some of the time. Clearing it
    // here is what stops a "Fit to box" zoom — and the legend's box reading —
    // from following you into a view that has no boxes at all.
    shownWindow = null;
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

        const tonePcs = new Set([chord.note, chord.third, chord.fifth, chord.seventh]
          .filter(Boolean).map(n => SEMITONE[n] % 12));
        // the grip itself — the CAGED shape, or its 7th-chord voicing
        const gripCells = chord.seventh
          ? seventhCells(placement, rootPc, SEMITONE[chord.seventh] % 12)
          : placement.cells.slice();
        // Traced through, so each chord in the cluster reads as a shape a hand
        // makes rather than as loose dots — and so that, with "All chord tones"
        // on, you can still see where the grip sits inside its arpeggio.
        if (gripCells.length > 1){
          lines.push({ color, shape: tag, cells: gripCells.map(c => ({ string: c.string, fret: c.fret })) });
        }

        // The grip, or — with "All chord tones" on — every chord tone a hand
        // sitting on that grip can reach. That turns the cluster of shapes
        // into a map of the progression: each chord's arpeggio in its own
        // position, and you can see which notes carry over to the next chord.
        const cellsToShow = allTones
          ? arpeggioCells(placement.fretMin, Math.max(placement.fretMax, placement.fretMin + 3), tonePcs)
          : gripCells;

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
        // Showing every chord tone, the ring means "two chords share this
        // note" — the thing you're looking for — and the roots are already
        // named by their label, so it isn't needed for them as well.
        const ringed = allTones && shapes.length > 1;
        const ring = allTones ? { isRoot: false, ringed } : { isRoot };
        if (uniqueContribs.length === 1){
          return { string: m.string, fret: m.fret, color: uniqueContribs[0].color, label: uniqueContribs[0].label, ...ring, isLowestRoot, shapes, rootShapes, labelsByTag };
        }
        // two different chords share this exact fret — split the dot between them
        const two = uniqueContribs.slice(0, 2);
        return { string: m.string, fret: m.fret, split: two.map(c => c.color), label: two[0].label, ...ring, isLowestRoot, shapes, rootShapes, labelsByTag };
      });

      return { markers, lines };
    }

    // Close triads on one set of three strings, every inversion, all the way
    // up the neck — each shape outlined and coloured by what's in the bass.
    if (fretMode === 'triads3'){
      const chord = currentChord();
      if (!chord) return { markers: [], lines: [] };
      const rootPc = SEMITONE[chord.note] % 12;
      const thirdPc = SEMITONE[chord.third] % 12;
      const fifthPc = SEMITONE[chord.fifth] % 12;
      const degByPc = {
        [rootPc]: '1',
        [thirdPc]: degreeLabel(chord, 'third'),
        [fifthPc]: degreeLabel(chord, 'fifth'),
      };
      const invOf = pc => pc === rootPc ? 'root' : pc === thirdPc ? '1st' : '2nd';

      const isMinor = chord.quality === 'min';
      const triads = stringSetTriads(stringSetLow, new Set([rootPc, thirdPc, fifthPc]));
      // Each shape also says which CAGED grip it's cut from, so a triad reads
      // as somewhere you already know rather than as a shape of its own.
      const lines = triads.map(t => ({
        color: INVERSION_COLOR[invOf(t.bassPc)], shape: invOf(t.bassPc),
        letter: closeTriadShape(t.cells, rootPc, isMinor),
        cells: t.cells.slice().sort((a, b) => a.string - b.string),
      }));

      // a note can serve two neighbouring shapes; it gets a half of each
      const cellMap = new Map();
      triads.forEach(t => t.cells.forEach(c => {
        const key = c.string + ':' + c.fret;
        if (!cellMap.has(key)) cellMap.set(key, { string: c.string, fret: c.fret, invs: new Set() });
        cellMap.get(key).invs.add(invOf(t.bassPc));
      }));
      const markers = [...cellMap.values()].map(m => {
        const pc = (STRING_TUNING[m.string] + m.fret) % 12;
        const invs = INVERSIONS.map(i => i.tag).filter(t => m.invs.has(t));
        const base = { string: m.string, fret: m.fret, label: degByPc[pc], isRoot: pc === rootPc, shapes: invs };
        return invs.length >= 2
          ? { ...base, split: [INVERSION_COLOR[invs[0]], INVERSION_COLOR[invs[1]]] }
          : { ...base, color: INVERSION_COLOR[invs[0]] };
      });
      return { markers: applyColorBy(markers, chord), lines };
    }

    // The five movable CAGED shapes for one chord. "Whole arpeggio" opens each
    // shape out into every chord tone around it, boxed by the shape it sits in
    // — the same five grips either way, still traced through the middle, so
    // the toggle changes how much you see rather than what you're looking at.
    if (fretMode === 'caged'){
      const chord = currentChord();
      if (!chord) return { markers: [], lines: [] };
      const rootPc = SEMITONE[chord.note] % 12;
      const isMinor = chord.quality === 'min';
      const seventhPc = chord.seventh ? SEMITONE[chord.seventh] % 12 : null;

      // The grips, and the outlines tracing them. A chord carrying a 7th gets
      // its 7th-chord voicings, so what's traced is a shape you'd actually
      // finger rather than the plain triad underneath it.
      const board = cagedTriadBoard(rootPc, isMinor, chord.note, seventhPc);
      if (!wholeArpeggio){
        cagedShapesShown = board.shapesShown;
        // Each grip is its own box, so "Single box" walks the neck one CAGED
        // shape at a time here just as it walks one arpeggio box at a time
        // with the shapes opened out.
        const grips = board.lines.map(l => ({
          name: l.shape, anchor: Math.min(...l.cells.map(c => c.fret)), cells: l.cells,
        }));
        const one = applyBoxWindow(board.markers, board.lines, grips);
        const lit = applyColorBy(one.markers, chord);
        const ghosts = ghostOthers
          ? ghostMarkers(shownWindow, new Set(lit.map(m => m.string + ':' + m.fret)), true)
          : { markers: [], lines: [] };
        return { markers: [...ghosts.markers, ...lit], lines: [...ghosts.lines, ...one.lines] };
      }

      const degByPc = { [rootPc]: chord.note };
      degByPc[SEMITONE[chord.third] % 12] = degreeLabel(chord, 'third');
      degByPc[SEMITONE[chord.fifth] % 12] = degreeLabel(chord, 'fifth');
      if (chord.seventh) degByPc[SEMITONE[chord.seventh] % 12] = degreeLabel(chord, 'seventh');
      const tonePcs = new Set(Object.keys(degByPc).map(Number));

      const boxes = cagedArpeggioBoxes(rootPc, isMinor, tonePcs);
      cagedShapesShown = CAGED_ORDER.filter(n => boxes.some(b => b.name === n));
      const lines = board.lines;

      const markers = [];
      for (let s = 0; s < 6; s++){
        for (let f = 0; f <= FRET_COUNT; f++){
          const pc = (STRING_TUNING[s] + f) % 12;
          if (!tonePcs.has(pc)) continue;
          const owners = boxes.filter(b => b.cells.some(c => c.string === s && c.fret === f));
          const ownerNames = [...new Set(owners.map(o => o.name))];
          const base = { string: s, fret: f, label: degByPc[pc], isRoot: pc === rootPc, shapes: ownerNames };
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
      const shown = applyBoxWindow(markers, lines, boxes);
      const lit = applyColorBy(shown.markers, chord);
      const ghosts = ghostOthers
        ? ghostMarkers(shownWindow, new Set(lit.map(m => m.string + ':' + m.fret)), false)
        : { markers: [], lines: [] };
      return { markers: [...ghosts.markers, ...lit], lines: [...ghosts.lines, ...shown.lines] };
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
      // string, following the actual fingering — same as Chords mode
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

    return { markers: [], lines: [] };
  }

  // The progression's *other* chords, drawn into the box you're practising in
  // so you can see where the changes fall without moving your hand. Faint, and
  // only where the chord you're on isn't already using the fret, so it reads as
  // background rather than as competing with the shape.
  let ghostLegendData = [];
  function ghostMarkers(win, taken, useGrips){
    ghostLegendData = [];
    if (!win) return { markers: [], lines: [] };
    const cands = host.progression().filter(c => c.quality !== 'dim');
    const markers = [], lines = [];
    const seen = new Set(taken);
    const inWin = c => c.fret >= win.min && c.fret <= win.max;
    cands.forEach((c, i) => {
      if (i === Math.min(cagedChordIdx, cands.length - 1)) return;   // that's the one in front
      const rootPc = SEMITONE[c.note] % 12;
      const thirdPc = SEMITONE[c.third] % 12;
      const fifthPc = SEMITONE[c.fifth] % 12;
      const isMinor = c.quality === 'min';
      const sevPc = c.seventh ? SEMITONE[c.seventh] % 12 : null;
      // labelled the way Progression labels them: the root by name, every
      // other note by the degree it is in that chord
      const nameOf = pc =>
        pc === rootPc ? c.note : pc === thirdPc ? degreeLabel(c, 'third') :
        pc === fifthPc ? degreeLabel(c, 'fifth') : degreeLabel(c, 'seventh');

      const grips = cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR)
        .map(p => (sevPc == null ? p.cells : seventhCells(p, rootPc, sevPc)));
      // whatever the view in front is showing, the ghosts show the same of:
      // the grips, or every chord tone
      const cells = useGrips
        ? grips.flat()
        : arpeggioCells(win.min, win.max,
            new Set([c.note, c.third, c.fifth, c.seventh].filter(Boolean).map(n => SEMITONE[n] % 12)));

      const color = ROOT_PALETTE[i % ROOT_PALETTE.length];
      const tag = 'ghost' + i;
      // the anchor root — the root nearest the low E — stays lit while the
      // rest of the chord recedes, exactly as it does in Progression
      const rootsHere = cells.filter(inWin)
        .filter(cell => (STRING_TUNING[cell.string] + cell.fret) % 12 === rootPc);
      const anchor = rootsHere.length
        ? rootsHere.reduce((a, b) => (b.string > a.string ? b : a)) : null;

      let drew = false;
      cells.forEach(cell => {
        if (!inWin(cell)) return;
        const k = cell.string + ':' + cell.fret;
        if (seen.has(k)) return;
        seen.add(k);
        drew = true;
        const pc = (STRING_TUNING[cell.string] + cell.fret) % 12;
        markers.push({ string: cell.string, fret: cell.fret, color, label: nameOf(pc),
                       isRoot: pc === rootPc, shapes: [tag], ghost: true,
                       isLowestRoot: !!anchor && cell.string === anchor.string && cell.fret === anchor.fret });
      });
      // and its grip traced through, where one sits wholly inside the box
      grips.forEach(g => {
        if (g.length > 1 && g.every(inWin)){
          lines.push({ color, shape: tag, ghost: true,
                       cells: g.map(cell => ({ string: cell.string, fret: cell.fret })) });
        }
      });
      if (drew) ghostLegendData.push({ name: displayName(c), numeral: c.numeral, color });
    });
    return { markers, lines };
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
      const entries = posLegendData
        .map(c => `<span data-shape="${c.tag}" tabindex="0" role="button" aria-label="Highlight ${c.name}"><i style="background:${c.color}"></i>${c.name}<em>${c.numeral}</em><small class="pos-shape-tag">${c.shapeLetter}</small>${range(c.tag)}</span>`);
      if (allTones) entries.push(`<span><i class="ring"></i>shared with another chord</span>`);
      cagedLegend.innerHTML = entries.join('');
      return;
    }
    const parts = [];
    // The inversions are what this view is *about*, so they keep their
    // entries (and their spotlight) whichever way the dots are coloured.
    if (fretMode === 'triads3'){
      const drawn = new Set([...fretboardSvg.querySelectorAll('.note-dot[data-shapes]')]
        .flatMap(g => g.getAttribute('data-shapes').split(',')));
      // which CAGED grips this inversion's shapes are cut from, read off what
      // is actually on the neck so a zoomed-in view only names what it shows
      const lettersFor = tag => {
        const seen = [...fretboardSvg.querySelectorAll(`.shape-line[data-shape="${tag}"][data-shape-letter]`)]
          .map(l => l.getAttribute('data-shape-letter'));
        const uniq = CAGED_ORDER.filter(n => seen.includes(n));
        return uniq.length ? `<small class="pos-shape-tag">${uniq.join(' ')}</small>` : '';
      };
      INVERSIONS.filter(i => drawn.has(i.tag)).forEach(i =>
        parts.push(`<span data-shape="${i.tag}" tabindex="0" role="button" aria-label="Highlight ${i.label}"><i style="background:${i.color}"></i>${i.label}${lettersFor(i.tag)}${range(i.tag)}</span>`));
    }
    if (colorBy === 'interval'){
      // the dots are coloured by what each note is in the chord, so that's
      // what the legend has to explain — the shape outlines still trace boxes
      const chord = currentChord();
      const names = ['root', '3rd', '5th'];
      // the triad views draw no 7th, whatever the chord carries
      if (chord && chord.seventh && fretMode !== 'triads3') names.push('7th');
      if (fretMode === 'penta' || fretMode === 'scale') names.push('other');
      ROLE_ORDER.filter(n => names.includes(n)).forEach(n =>
        parts.push(`<span><i style="background:${ROLE_COLORS[n]}"></i>${n === 'other' ? 'scale tone' : n}</span>`));
    } else if (fretMode !== 'triads3'){
      // only the shapes actually on screen get an entry — a single box, or a
      // zoomed-in stretch of neck, leaves the others out
      const drawn = new Set([...fretboardSvg.querySelectorAll('.note-dot[data-shapes]')]
        .flatMap(g => g.getAttribute('data-shapes').split(',')));
      cagedShapesShown.filter(n => drawn.has(n)).forEach(n =>
        parts.push(`<span data-shape="${n}" tabindex="0" role="button" aria-label="Highlight ${n} shape"><i style="background:${CAGED_COLORS[n]}"></i>${n} shape${range(n)}</span>`));
    }
    // the other chords sit with the rest of the colour key, named the way
    // Progression names them, since they're drawn the same
    ghostLegendData.forEach(g =>
      parts.push(`<span class="ghost-entry"><i style="background:${g.color}"></i>${g.name}<em>${g.numeral}</em></span>`));
    // colouring by interval, the swatches already name the root and the 7th —
    // saying it twice reads as two different things
    if (colorBy !== 'interval'){
      parts.push(`<span><i class="ring"></i>root</span>`);
      // Only the grips draw a 7th as a hollow dot; opened out, it's just
      // another chord tone with its own label — and a plain triad has no 7th
      // to explain either way.
      if (fretMode === 'caged' && !wholeArpeggio && currentChord() && currentChord().seventh){
        parts.push(`<span><i class="hollow"></i>7th</span>`);
      }
    }
    if (fretMode === 'penta' || fretMode === 'scale') parts.push(`<span><i class="passing"></i>passing note</span>`);
    if (shownWindow) parts.push(`<span><em>box: frets ${shownWindow.min}–${shownWindow.max}</em></span>`);
    cagedLegend.innerHTML = parts.join('');
  }

  function renderFretboard(){
    ghostLegendData = [];
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

    if (fretMode === 'roots'){
      stuckShape = null;
      paintRootSpotlight();
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
