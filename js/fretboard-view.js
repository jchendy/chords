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
  // Which of the five CAGED shapes Chords is working on — one set per reading,
  // because the two are asking different questions. Across the neck the point
  // is where a chord lives, so all five are on: that picture is the map. In one
  // position the point is a stretch of frets you can actually hold, so it opens
  // on A, E and D, the three that fall under the hand without a stretch. Each
  // reading keeps whatever you set it to while the other stays as it was.
  const shapesByReading = {
    neck: new Set(['C', 'A', 'G', 'E', 'D']),
    position: new Set(['A', 'E', 'D']),
  };
  const enabledShapes = () => shapesByReading[inPosition ? 'position' : 'neck'];
  const shapeOn = name => enabledShapes().has(name);
  let rootLegendData = [];
  let chordPosIndex = 0;         // which cluster of the chords' own positions is showing
  let stuckShape = null;         // shape name pinned by a tap on its legend entry
  let cagedFollow = true;        // selected CAGED chord tracks the playing chord (on by default)
  let activeRootPc = null;       // pitch class of the currently-playing chord's root, for Root notes mode
  let scaleTheory = 'parallel';  // 'parallel' (chord's own major/minor) | 'modal' (key's mode)
  // Every view reads one of two ways, and the choice is shared: you're either
  // looking at the whole neck or at one hand position, whichever mode you're
  // in. Switching mode keeps the reading, so moving from a chord to its scale
  // doesn't throw you back out to the whole neck.
  let inPosition = false;
  let boxIndex = 0;              // which box, low to high, when showing one
  let shownWindow = null;        // what the legend reports
  let shownBoxName = '';         // ...and which CAGED shape that box is
  let shownBoxCells = null;      // ...and the cells that shape actually plays
  // Where the hand is, as a fret. Set when you move it yourself and left alone
  // otherwise: re-deriving it from wherever the last chord happened to land
  // makes every chord change a small step, and those accumulate into a walk up
  // or down the neck across a progression.
  let positionAnchor = null;
  let rebaseBox = false;         // re-pick the box by position rather than by index
  let fretRange = 'all';         // 'all' | 'fit' | 'from-to' — how much neck to draw
  let colorBy = 'shape';         // 'shape' (which CAGED box) | 'interval' (what the note is)
  let wholeArpeggio = false;     // Chords: the shapes opened out into the whole arpeggio
  // Chords reads two ways: one chord across the whole neck, or the whole
  // progression under one hand. Everything about choosing a position — the
  // stepper, voice leading, holding — belongs to the second; the first has no
  // position to choose, it shows them all.
  // How the position gets chosen, once you're reading one:
  //   box     — one CAGED box, every chord clipped into it
  //   cluster — each chord at its own best position, near a shared fret
  //   lead    — each chord nearest wherever the one before it landed
  let cagedPosMethod = 'box';
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

  // The cluster reading — every chord at its own placement rather than clipped
  // into one box. This is what the old Progression mode drew; it lives inside
  // Chords now, as one of the ways a position gets chosen.
  const clusterMode = () =>
    fretMode === 'caged' && inPosition && cagedPosMethod !== 'box';

  // A dot shared by several shapes is drawn once, in whichever colour got
  // there first. Remembering every owner's colour lets the spotlight repaint
  // it as the shape you're actually looking at.
  function withTagColors(markers, colorFor){
    return markers.map(m => {
      if (!m.shapes || m.shapes.length < 2) return m;
      const colorsByTag = {};
      m.shapes.forEach(t => { const c = colorFor(t); if (c) colorsByTag[t] = c; });
      return Object.keys(colorsByTag).length > 1 ? { ...m, colorsByTag } : m;
    });
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
  const cagedLegend = document.getElementById('cagedLegend');
  const fretboardSvg = document.getElementById('fretboard');

  fretModeGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      fretModeGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fretMode = btn.dataset.value;
      // Each view numbers its positions differently — a pentatonic box list
      // isn't the same length as a list of CAGED grips — so carrying the raw
      // index across a view change moves the hand for no reason. Re-pick by
      // where the hand already is, exactly as a chord change does.
      rebaseBox = true;
      updateFretUI();
      renderFretboard();
    });
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
  const fretRangeSelect = document.getElementById('fretRangeSelect');
  const colorByGroup = document.getElementById('colorByGroup');
  const colorByLabel = document.getElementById('colorByLabel');
  const stringSetRow = document.getElementById('stringSetRow');
  const cagedViewRow = document.getElementById('cagedViewRow');
  const wholeArpeggioToggle = document.getElementById('wholeArpeggioToggle');
  const cagedShapeGroup = document.getElementById('cagedShapeGroup');
  const wholeArpeggioWrap = document.getElementById('wholeArpeggioWrap');
  const cagedPosMethodGroup = document.getElementById('cagedPosMethodGroup');
  const viewGroup = document.getElementById('viewGroup');
  const cagedPosMethodWrap = document.getElementById('cagedPosMethodWrap');

  document.querySelectorAll('#stringSetGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stringSetGroup .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      stringSetLow = Number(btn.dataset.value);
      renderFretboard();
    });
  });

  // One box gathers the whole progression into a single stretch of neck. It can
  // only do that while the shapes left on are spread finely enough to meet
  // somewhere: measured on Am-Dm-E, all five shapes or the A-E-D it opens on
  // need four frets to hold one shape of every chord — a hand — and A plus E
  // need five. Take it down to a single shape and the answer is ten to twelve,
  // which is most of the neck and not a position at all. Past a hand's reach
  // the option stops meaning anything, so it greys out and Cluster takes over:
  // Cluster is already the reading that lets each chord sit where it really
  // falls instead of insisting they share a box.
  const HAND_SPAN = 6;        // index finger to little finger, generously

  // the narrowest window holding one allowed shape from every chord
  function positionSpan(){
    const cands = host && host.progression
      ? host.progression().filter(c => c.quality !== 'dim') : [];
    if (!cands.length) return 0;
    const per = cands.map(shapesForPosition);
    if (per.some(boxes => !boxes.length)) return Infinity;
    let best = Infinity;
    for (let f = 0; f <= FRET_COUNT; f++){
      let lo = f, hi = f;
      per.forEach(boxes => {
        const frets = nearestShape(boxes, f).cells.map(c => c.fret);
        lo = Math.min(lo, ...frets);
        hi = Math.max(hi, ...frets);
      });
      best = Math.min(best, hi - lo + 1);
    }
    return best;
  }

  function oneBoxPossible(){
    return enabledShapes().size > 0 && positionSpan() <= HAND_SPAN;
  }

  // the shapes a chord can sit in, in whichever reading Chords is showing
  function shapesForPosition(chord){
    if (!wholeArpeggio) return gripBoxes(chord);
    const rootPc = SEMITONE[chord.note] % 12;
    return cagedArpeggioBoxes(rootPc, chord.quality === 'min', chordTonePcs(chord))
      .filter(b => shapeOn(b.name));
  }

  // Chords and Triads are the two views that bring the whole progression into
  // the position with you, so there the button says so. Pentatonic, Scales and
  // Roots put one thing in a position rather than every chord, and keep the
  // plain name. Only the wording changes — the reading is chosen by the
  // button's data-value either way.
  function paintViewButton(){
    const btn = viewGroup.querySelector('[data-value="position"]');
    const wholeProgression = ['caged', 'triads3'].includes(fretMode);
    btn.textContent = wholeProgression ? 'All chords in one position' : 'In one position';
  }

  // the buttons show the set belonging to the reading you're in
  function paintShapeButtons(){
    const shapes = enabledShapes();
    cagedShapeGroup.querySelectorAll('.seg-btn')
      .forEach(b => b.classList.toggle('active', shapes.has(b.dataset.value)));
  }

  function updateFretUI(){
    paintViewButton();
    paintShapeButtons();
    const chordModes = ['caged', 'triads3', 'penta', 'scale'].includes(fretMode);
    // Every view but Roots is about one chord, so it picks one. Roots draws
    // every chord's roots at once and needs no chord — except in one position,
    // where the chord is what says which position that is.
    cagedChordRow.hidden = !chordModes && !inPosition;
    scaleTheoryRow.hidden = fretMode !== 'scale';
    stringSetRow.hidden = fretMode !== 'triads3';
    // Chords, Pentatonic and Scales are all built out of the CAGED shapes, so
    // all three get to choose which ones — and share the choice, so following a
    // chord into its scale doesn't put shapes back that you'd switched off.
    // Opening the shapes out into their arpeggio is Chords' alone.
    cagedViewRow.hidden = !['caged', 'penta', 'scale'].includes(fretMode);
    wholeArpeggioWrap.hidden = fretMode !== 'caged';
    // one position, one Position row — the same row whatever the mode
    boxRow.hidden = !inPosition;
    // only Chords draws several chords at once, so only Chords has a choice
    // about how they're gathered
    const cagedPos = fretMode === 'caged' && inPosition;
    cagedPosMethodWrap.hidden = !cagedPos;
    const boxBtn = cagedPosMethodGroup.querySelector('[data-value="box"]');
    const canBox = oneBoxPossible();
    boxBtn.disabled = !canBox;
    boxBtn.title = canBox ? ''
      : 'Too few CAGED shapes left to hold the whole progression under one hand';
    if (!canBox && cagedPosMethod === 'box'){
      cagedPosMethod = 'cluster';
      cagedPosMethodGroup.querySelectorAll('.seg-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.value === 'cluster'));
    }
    // Roots is already coloured by root; and in one position Chords colours by
    // chord, so there's nothing for the interval option to say in either
    const colourIsChord = inPosition && ['caged', 'triads3'].includes(fretMode);
    colorByGroup.hidden = !chordModes || colourIsChord;
    colorByLabel.hidden = !chordModes || colourIsChord;
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
  wholeArpeggioToggle.addEventListener('change', () => {
    wholeArpeggio = wholeArpeggioToggle.checked;
    renderFretboard();
  });
  viewGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      viewGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      inPosition = btn.dataset.value === 'position';
      rebaseBox = true;       // ...and coming back lands where you left off
      updateFretUI();
      renderFretboard();
    });
  });
  // Independent toggles, not a picker: you're choosing a set to work on, so
  // several are on at once and any of them can come off. The last one can't —
  // an empty set draws an empty neck, which is a state with nothing to say and
  // no control on screen that obviously undoes it.
  cagedShapeGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.value;
      const shapes = enabledShapes();
      if (shapes.has(name)){
        if (shapes.size === 1) return;
        shapes.delete(name);
      } else {
        shapes.add(name);
      }
      btn.classList.toggle('active', shapes.has(name));
      // the box the hand was in may not exist any more
      rebaseBox = true;
      updateFretUI();
      renderFretboard();
    });
  });

  cagedPosMethodGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cagedPosMethodGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      cagedPosMethod = btn.dataset.value;
      updateFretUI();
      renderFretboard();
    });
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


  // The stepper walks whichever thing the current reading is stepping: one
  // CAGED box, or one cluster of the whole progression's own positions.
  function stepPosition(d){
    if (clusterMode()) chordPosIndex += d;
    else boxIndex += d;
    renderFretboard();
  }
  document.getElementById('boxPrev').addEventListener('click', () => stepPosition(-1));
  document.getElementById('boxNext').addEventListener('click', () => stepPosition(1));

  // The pentatonic and scale views draw every box on the neck; with "Single
  // box" on, cut that down to one — the box at `boxIndex`, low to high — or,
  // while holding position, to whatever stretch of frets was on screen when
  // the chord changed, so the new chord's notes appear under the same hand.
  const midOf = box => {
    const frets = box.cells.map(c => c.fret);
    return (Math.min(...frets) + Math.max(...frets)) / 2;
  };

  // Which of a chord's shapes sits nearest a fret. Both the position landing
  // on a box and a chord behind choosing its shape go through here: two shapes
  // can be equally close, and a tie has to break the same way for both or the
  // shape you're shown isn't the one you get. Sorting first is what makes the
  // tie-break "the lower one" rather than "whichever the caller listed first".
  function nearestShape(shapes, aim){
    const sorted = shapes.slice().sort((a, b) => a.anchor - b.anchor);
    let best = sorted[0], bd = Infinity;
    sorted.forEach(g => {
      const d = Math.abs(midOf(g) - aim);
      if (d < bd){ bd = d; best = g; }
    });
    return best;
  }

  // `opts.single` overrides the shared Single box checkbox (Chords decides it
  // from which way it's reading); `opts.index` overrides the stepper.
  function applyBoxWindow(markers, lines, boxes, opts = {}){
    shownWindow = null;
    shownBoxCells = null;
    const forcedIndex = opts.index;
    const single = opts.single === undefined ? inPosition : opts.single;
    if (!single || !boxes.length) return { markers, lines };
    const sorted = boxes.slice().sort((a, b) => a.anchor - b.anchor);
    // A box index means different frets for different chords — each chord has
    // its own list of boxes — so carrying the index across a chord change
    // makes the neck jump. Re-pick by position instead: the new chord's box
    // nearest where the hand already was, which is also the one the previous
    // chord's "up next" ghost was previewing.
    // Aim at the middle of the box that was chosen, never at the middle of
    // the window drawn around it. The window is padded out to a hand's reach
    // and stretched to cover the other chords, and feeding either of those
    // back in would move the target a little further each time — which walks
    // the hand up the neck over a few chord changes.
    const rebased = forcedIndex == null && rebaseBox && positionAnchor != null;
    if (rebased) boxIndex = sorted.indexOf(nearestShape(sorted, positionAnchor));
    rebaseBox = false;
    const want = forcedIndex == null ? boxIndex : forcedIndex;
    const box = sorted[((want % sorted.length) + sorted.length) % sorted.length];
    const frets = box.cells.map(c => c.fret);
    const win = { min: Math.min(...frets), max: Math.max(...frets) };
    // A three-string triad spans two or three frets, which is tighter than a
    // hand and would let almost nothing else into the position. Open the
    // window out to a hand's reach around it, so the other chords' shapes in
    // that position can be seen alongside it.
    if (opts.minSpan && win.max - win.min + 1 < opts.minSpan){
      const grow = opts.minSpan - (win.max - win.min + 1);
      win.min = Math.max(0, win.min - Math.floor(grow / 2));
      win.max = Math.min(FRET_COUNT, win.max + Math.ceil(grow / 2));
    }
    shownWindow = win;
    shownBoxName = box.name || '';
    shownBoxCells = new Set(box.cells.map(c => c.string + ':' + c.fret));
    // The anchor is simply where the hand is — so every box follows it into
    // place, except one picked *because* the chord changed. Those are measured
    // against the anchor, and letting them move it too is what made a
    // progression walk the hand along the neck.
    if (!rebased) positionAnchor = midOf(box);
    const inWin = f => f >= win.min && f <= win.max;
    return {
      markers: markers.filter(m => inWin(m.fret)),
      lines: lines.filter(l => l.cells.every(c => inWin(c.fret))),
    };
  }

  // The box whose starting fret is nearest. Deliberately not nearestShape(),
  // which measures from a shape's middle to work out where a hand is: this one
  // answers "which box does a stray note read as belonging to", and the two
  // want different metrics. Keep them apart.
  function nearestByAnchor(boxes, fret){
    let best = null, bd = Infinity;
    boxes.forEach(b => { const d = Math.abs(fret - b.anchor); if (d < bd){ bd = d; best = b; } });
    return best;
  }

  // Every note a view draws, coloured by the CAGED box that owns it: a note two
  // adjacent boxes share gets a split dot (lower box on the left, higher on the
  // right), a note in one box takes that box's colour, and a note in none takes
  // the nearest box's — an arpeggio note just outside a box still reads as
  // belonging to it.
  //
  // Chords with the shapes opened out, Pentatonic and Scales all draw this same
  // picture, and each used to carry its own copy of this loop. The copies had
  // drifted: one counted raw owners where the others counted distinct box
  // names, and B5 was one of them colouring from a box list the others had
  // already filtered. What actually differs between the three is only which
  // notes they draw and what they call them, which is all `labelOf` is — the
  // degree to write on a pitch class, or nothing for a note this view leaves out.
  function boxColouredNotes(boxes, { labelOf, rootPc, passingOf }){
    const markers = [];
    for (let s = 0; s < 6; s++){
      for (let f = 0; f <= FRET_COUNT; f++){
        const pc = (STRING_TUNING[s] + f) % 12;
        const label = labelOf(pc);
        if (label == null) continue;
        // Owners by name, each kept at its nearest placement. Two boxes share
        // a note or they don't; one box reaching the same note twice isn't
        // sharing it with anyone, and shouldn't split the dot with itself.
        const byName = new Map();
        boxes.forEach(b => {
          if (!b.cells.some(c => c.string === s && c.fret === f)) return;
          const held = byName.get(b.name);
          if (!held || Math.abs(f - b.anchor) < Math.abs(f - held.anchor)) byName.set(b.name, b);
        });
        const owners = [...byName.values()];
        const base = { string: s, fret: f, label, isRoot: pc === rootPc,
                       shapes: owners.map(o => o.name) };
        if (passingOf) base.passing = passingOf(pc);
        if (owners.length >= 2){
          const two = owners.slice()
            .sort((a, b) => Math.abs(f - a.anchor) - Math.abs(f - b.anchor))
            .slice(0, 2)
            .sort((a, b) => a.anchor - b.anchor);
          markers.push({ ...base, split: [CAGED_COLORS[two[0].name], CAGED_COLORS[two[1].name]] });
        } else if (owners.length === 1){
          markers.push({ ...base, color: CAGED_COLORS[owners[0].name] });
        } else {
          const near = nearestByAnchor(boxes, f);
          markers.push({ ...base, shapes: near ? [near.name] : [],
                         color: near ? CAGED_COLORS[near.name] : '#6b655b' });
        }
      }
    }
    return markers;
  }

  // A nearest shape can sit a fret or two outside the box it was measured
  // against, so the position readout covers what's actually on the neck rather
  // than the window it started from.
  function windowCovering(markers){
    if (!shownWindow || !markers.length) return;
    const frets = markers.map(m => m.fret);
    shownWindow = { min: Math.min(shownWindow.min, ...frets), max: Math.max(shownWindow.max, ...frets) };
  }

  // The CAGED grips traced through, whatever else a view is drawing on top of
  // them — the shape you already know, under the scale or the arpeggio. Only
  // the ones you're working on: a shape switched off leaves the outlines along
  // with everything else.
  function gripOutlines(rootPc, isMinor){
    return cagedPlacements(rootPc, isMinor ? CAGED_MINOR : CAGED_MAJOR)
      .filter(p => shapeOn(p.name) && p.cells.length > 1)
      .map(p => ({ color: CAGED_COLORS[p.name], shape: p.name,
                   cells: p.cells.map(c => ({ string: c.string, fret: c.fret })) }));
  }

  // the notes of the chord itself, so the scale views can set the rest back
  function chordTonePcs(chord){
    return new Set([chord.note, chord.third, chord.fifth, chord.seventh]
      .filter(Boolean).map(n => SEMITONE[n] % 12));
  }

  function updateCagedLock(){
    cagedChordGroup.classList.toggle('locked', cagedFollow && host.isPlaying());
  }

  // The picker only lists the chords that have CAGED shapes, so a place in
  // the progression has to be counted past the diminished ones to find its
  // button. Null when that chord isn't in the picker at all.
  function pickerIndexFor(progIdx){
    const prog = host.progression();
    if (!prog[progIdx] || prog[progIdx].quality === 'dim') return null;
    let ci = 0;
    for (let k = 0; k < progIdx; k++){
      if (prog[k] && prog[k].quality !== 'dim') ci++;
    }
    return ci;
  }

  // Put one of the progression's chords in front, the way clicking its button
  // in the picker does.
  function showChordAt(ci){
    cagedChordIdx = ci;
    rebaseBox = true;      // stay where the hand is rather than where the index points
    cagedChordGroup.querySelectorAll('.seg-btn').forEach((b, k) => b.classList.toggle('active', k === ci));
    renderFretboard();
  }

  // while "follows playback" is on, jump the CAGED chord picker to whatever
  // chord is currently sounding
  function followPlayingChord(force){
    if (!cagedFollow || fretMode === 'roots') return;
    const active = host.activeChord();
    if (!active) return;
    const ci = pickerIndexFor(active.idx);
    if (ci === null) return;             // no CAGED shapes for a diminished chord
    if (ci === cagedChordIdx && !force) return;
    showChordAt(ci);
  }

  // Clicking a bar in the chart while nothing is playing brings that chord
  // onto the neck — the same move Follow makes while it plays.
  function selectChord(progIdx){
    if (fretMode === 'roots') return;    // roots draws the whole progression at once
    const ci = pickerIndexFor(progIdx);
    if (ci === null || ci === cagedChordIdx) return;
    showChordAt(ci);
  }

  cagedFollowToggle.addEventListener('change', () => {
    cagedFollow = cagedFollowToggle.checked;
    updateCagedLock();
    if (cagedFollow) followPlayingChord(true);
  });

  // ---- Progression: a cell shared by two chords labels itself
  // differently depending on which of them is currently in focus (root for
  // one, some other degree for another) ----
  const fillsIn = g => [...g.querySelectorAll('circle:not(.dot-ring), path')];
  // a hollow dot wears its colour on the stroke, with the panel showing
  // through — repainting its fill would solidify the very thing that makes
  // it read as a 7th
  const paint = (g, colors) => {
    const prop = g.classList.contains('hollow') ? 'stroke' : 'fill';
    fillsIn(g).forEach((el, i) => el.setAttribute(prop, colors[Math.min(i, colors.length - 1)]));
  };
  function setDotColor(g, tag){
    const raw = g.getAttribute('data-colors');
    if (!raw) return;
    const hit = raw.split(',').map(p => p.split(':')).find(([t]) => t === tag);
    if (hit) paint(g, [hit[1]]);
  }
  function resetDotColor(g){
    const def = g.getAttribute('data-default-color');
    if (def) paint(g, def.split(','));
  }

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

  // ---- spotlight one CAGED shape (or, in Progression, one chord) when
  // its legend entry is hovered / tapped ----
  function paintShapeSpotlight(shape){
    fretboardSvg.classList.toggle('shape-focus', !!shape);
    fretboardSvg.querySelectorAll('.note-dot').forEach(g => {
      const list = (g.getAttribute('data-shapes') || '').split(',').filter(Boolean);
      const isHot = !!shape && list.includes(shape);
      g.classList.toggle('hot', isHot);
      // a shared cell reads as whatever degree it is *for* the spotlighted
      // chord, and wears that chord's colour, not whichever one drew it first
      if (isHot){ setDotLabel(g, shape); setDotColor(g, shape); }
      else { resetDotLabel(g); resetDotColor(g); }
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
    if (!shape) paintRootSpotlight();
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
        rebaseBox = true;
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

    if (clusterMode()){
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
          .filter(p => shapeOn(p.name) && (p.name !== 'G' || p.fretMin === 0))
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

      const ids = chordIdentity(chords);
      const curIdx = Math.min(cagedChordIdx, chords.length - 1);
      const curName = displayName(chords[curIdx]);
      // the chord you're heading into reads brighter than the ones after it —
      // the same three tiers One box uses
      const nextName = chords.length > 1
        ? displayName(chords[(curIdx + 1) % chords.length]) : null;

      // Each chord's own placement, chosen the way this method chooses: the
      // whole progression measured against one fret, or — with voice leading —
      // each chord against wherever the one before it landed. Keyed by which
      // chord this is, not which slot: a twelve-bar blues has one C7, however
      // many bars it fills.
      const chosen = new Map();
      chords.forEach((chord, i) => {
        const placements = perChordPlacements[i];
        if (!placements.length) return;
        const placement = placements.reduce((best, p) =>
          Math.abs(p.meanFret - aimFret) < Math.abs(best.meanFret - aimFret) ? p : best);
        if (cagedPosMethod === 'lead') aimFret = placement.meanFret;
        const name = displayName(chord);
        if (!chosen.has(name)) chosen.set(name, { chord, placement });
      });
      if (!chosen.has(curName)) return { markers: [], lines: [] };

      // The chord in front goes down first, so a note two chords share is
      // drawn in its colour and the chord behind adds itself to that dot.
      const order = [curName, ...[...chosen.keys()].filter(n => n !== curName)];
      const markers = [], lines = [], placed = new Map();
      ghostLegendData = [];
      order.forEach(name => {
        const { chord, placement } = chosen.get(name);
        const { tag, color } = ids.get(name);
        const ghost = name !== curName;
        const isNext = name === nextName;
        const rootPc = SEMITONE[chord.note] % 12;
        // the grip itself — the CAGED shape, or its 7th-chord voicing
        const gripCells = chord.seventh
          ? seventhCells(placement, rootPc, SEMITONE[chord.seventh] % 12)
          : placement.cells.slice();
        // The grip, or — with "Whole arpeggio" on — every chord tone a hand
        // sitting on that grip can reach, the grip still traced through the
        // middle so you can see the shape inside its arpeggio.
        const tonePcs = new Set([chord.note, chord.third, chord.fifth, chord.seventh]
          .filter(Boolean).map(n => SEMITONE[n] % 12));
        const cells = wholeArpeggio
          ? arpeggioCells(placement.fretMin, Math.max(placement.fretMax, placement.fretMin + 3), tonePcs)
          : gripCells;
        placeShape({ chord, cells, tag, color, ghost, isNext, placed, markers });
        if (gripCells.length > 1){
          const line = { color, shape: tag, cells: gripCells.map(c => ({ string: c.string, fret: c.fret })) };
          if (ghost) Object.assign(line, { ghost: true, ghostNext: isNext, letter: placement.name });
          lines.push(line);
        }
        ghostLegendData.push({ name, numeral: chord.numeral, color, tag, order: tag,
                               shapeLetter: placement.name, current: !ghost });
      });
      ghostLegendData.sort((a, b) => Number(a.order.slice(1)) - Number(b.order.slice(1)));
      // These shapes sit where they're playable rather than inside one box, so
      // the readout covers what's actually drawn.
      const frets = markers.map(m => m.fret);
      if (frets.length) shownWindow = { min: Math.min(...frets), max: Math.max(...frets) };
      shownBoxName = chosen.get(curName).placement.name;
      shownBoxCells = null;
      // where the hand is, so switching to One box keeps it rather than
      // jumping back to whatever box was last measured
      positionAnchor = chosen.get(curName).placement.meanFret;
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
      // The one list of a chord's shapes in this view, same as Chords has:
      // the position picks a box from it for the chord in front, and a chord
      // behind picks the one nearest the same anchor.
      const triadShapes = c => {
        const rp = SEMITONE[c.note] % 12;
        const thirdOf = SEMITONE[c.third] % 12;
        const tones = new Set([rp, thirdOf, SEMITONE[c.fifth] % 12]);
        return stringSetTriads(stringSetLow, tones).map(t => ({
          name: t.bassPc === rp ? 'root' : t.bassPc === thirdOf ? '1st' : '2nd',
          anchor: t.startFret,
          cells: t.cells.slice().sort((a, b) => a.string - b.string),
        }));
      };
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
      const markers = withTagColors([...cellMap.values()].map(m => {
        const pc = (STRING_TUNING[m.string] + m.fret) % 12;
        const invs = INVERSIONS.map(i => i.tag).filter(t => m.invs.has(t));
        const base = { string: m.string, fret: m.fret, label: degByPc[pc], isRoot: pc === rootPc, shapes: invs };
        return invs.length >= 2
          ? { ...base, split: [INVERSION_COLOR[invs[0]], INVERSION_COLOR[invs[1]]] }
          : { ...base, color: INVERSION_COLOR[invs[0]] };
      }), t => INVERSION_COLOR[t]);
      // Triads has shapes of its own, so those are its positions — borrowing
      // the CAGED grips could land you on a stretch of neck holding no triad
      // for the very chord you picked. Stepping now walks this chord's own
      // shapes up the neck, and each stop is one you can actually play.
      const shown = applyBoxWindow(markers, lines, triadShapes(chord), { minSpan: 4 });
      // applyBoxWindow keeps a line only when all three of its notes are in
      // the window, but filters the dots one at a time — so a triad reaching
      // one fret past the box came through as a two-note fragment, a shape
      // nobody can play. Keep only the notes of the triads that survived.
      if (shownWindow){
        const kept = new Set(shown.lines.flatMap(l => l.cells.map(c => c.string + ':' + c.fret)));
        shown.markers = shown.markers.filter(m => kept.has(m.string + ':' + m.fret));
      }
      if (!inPosition) return { markers: applyColorBy(shown.markers, chord), lines: shown.lines };

      // In one position the other chords' triads come too, exactly as they do
      // in Chords: colour says which chord, the inversion moves to the legend
      // tag, and the rest of the progression sits behind in its own colours.
      const cands = host.progression().filter(c => c.quality !== 'dim');
      const curIdx = Math.min(cagedChordIdx, cands.length - 1);
      const { tag: curTag, color: curColor } = idOf(cands, curIdx);
      // the box is one triad, so its name is the inversion — that's the tag
      const lit = shown.markers.map(m => {
        const { split, colorsByTag, ...rest } = m;
        return { ...rest, color: curColor, shapes: [curTag] };
      });
      const litLines = shown.lines.map(l => ({ ...l, color: curColor, shape: curTag }));
      const ghosts = ghostMarkers(shownWindow,
        new Map(lit.map(m => [m.string + ':' + m.fret, m])), true, triadShapes, true);
      noteCurrentChord(cands, curIdx, curTag, curColor);
      const all = [...ghosts.markers, ...lit];
      windowCovering(all);
      return { markers: all, lines: [...ghosts.lines, ...litLines] };
    }

    // The five movable CAGED shapes for one chord. "Whole arpeggio" opens each
    // shape out into every chord tone around it, boxed by the shape it sits in
    // — the same five grips either way, still traced through the middle, so
    // the toggle changes how much you see rather than what you're looking at.
    if (fretMode === 'caged'){
      const chord = currentChord();
      if (!chord) return { markers: [], lines: [] };
      // One position, or all of them. In one position the whole progression
      // comes with you — that's what the reading is for — and voice leading
      // hands the choice of which position to the progression itself.
      const cands = host.progression().filter(c => c.quality !== 'dim');
      const curIdx = Math.min(cagedChordIdx, cands.length - 1);
      const { tag: curTag, color: curColor } = idOf(cands, curIdx);
      // In one position several chords share the neck, so colour says which
      // chord a note belongs to and the legend names its shape — the same
      // scheme Progression uses. Across the neck only one chord is drawn, so
      // colour is free to say which of its five shapes a note is in instead.
      const asChord = (m) => {
        // drop the shape-keyed colours it was drawn with: this dot now answers
        // to a chord, not to a CAGED shape, and a stale key here would leave
        // the spotlight repainting it as something it no longer is
        const { split, colorsByTag, ...rest } = m;
        return { ...rest, color: curColor, shapes: [curTag] };
      };
      const boxOpts = { single: inPosition };
      const rootPc = SEMITONE[chord.note] % 12;
      const isMinor = chord.quality === 'min';
      const seventhPc = chord.seventh ? SEMITONE[chord.seventh] % 12 : null;

      // The grips, and the outlines tracing them. A chord carrying a 7th gets
      // its 7th-chord voicings, so what's traced is a shape you'd actually
      // finger rather than the plain triad underneath it.
      const board = cagedTriadBoard(rootPc, isMinor, chord.note, seventhPc, enabledShapes());
      board.markers = withTagColors(board.markers, n => CAGED_COLORS[n]);
      if (!wholeArpeggio){
        cagedShapesShown = board.shapesShown;
        // Each grip is its own box, so "Single box" walks the neck one CAGED
        // shape at a time here just as it walks one arpeggio box at a time
        // with the shapes opened out.
        const grips = gripBoxes(chord);
        const one = applyBoxWindow(board.markers, board.lines, grips, boxOpts);
        // cagedTriadBoard draws all five shapes at once, so clipping that to a
        // window leaves fragments of the neighbouring ones — notes that belong
        // to no shape you're holding, which read as stray arpeggio notes. In
        // one position, keep only the cells of the shape the box actually is.
        const boxOnly = inPosition && shownBoxCells
          ? one.markers.filter(m => shownBoxCells.has(m.string + ':' + m.fret))
          : one.markers;
        const lit = inPosition ? boxOnly.map(asChord) : applyColorBy(boxOnly, chord);
        const litLines = inPosition
          ? one.lines.map(l => ({ ...l, color: curColor, shape: curTag })) : one.lines;
        // Nearest shape, not only one lying wholly inside the box. A CAGED
        // grip is four frets wide and a box at the nut can be three, so the
        // strict rule silently drops a chord whose grip reaches one fret past
        // the edge — an open Dm is 0-3 against a window of 0-2.
        const ghosts = inPosition
          ? ghostMarkers(shownWindow, new Map(lit.map(m => [m.string + ':' + m.fret, m])), true,
                         gripBoxes, true)
          : { markers: [], lines: [] };
        if (!inPosition) return { markers: lit, lines: litLines };
        noteCurrentChord(cands, curIdx, curTag, curColor);
        const all = [...ghosts.markers, ...lit];
        windowCovering(all);
        return { markers: all, lines: [...ghosts.lines, ...litLines] };
      }

      const degByPc = { [rootPc]: chord.note };
      degByPc[SEMITONE[chord.third] % 12] = degreeLabel(chord, 'third');
      degByPc[SEMITONE[chord.fifth] % 12] = degreeLabel(chord, 'fifth');
      if (chord.seventh) degByPc[SEMITONE[chord.seventh] % 12] = degreeLabel(chord, 'seventh');
      const tonePcs = new Set(Object.keys(degByPc).map(Number));

      const boxes = cagedArpeggioBoxes(rootPc, isMinor, tonePcs).filter(b => shapeOn(b.name));
      cagedShapesShown = CAGED_ORDER.filter(n => boxes.some(b => b.name === n));
      const lines = board.lines;

      const markers = boxColouredNotes(boxes, { labelOf: pc => degByPc[pc], rootPc });
      const shown = applyBoxWindow(markers, lines, boxes, boxOpts);
      shown.markers = withTagColors(shown.markers, n => CAGED_COLORS[n]);
      const lit = inPosition ? shown.markers.map(asChord) : applyColorBy(shown.markers, chord);
      const litLines = inPosition
        ? shown.lines.map(l => ({ ...l, color: curColor, shape: curTag })) : shown.lines;
      const ghosts = inPosition
        ? ghostMarkers(shownWindow, new Map(lit.map(m => [m.string + ':' + m.fret, m])), false,
                       gripBoxes)
        : { markers: [], lines: [] };
      if (inPosition) noteCurrentChord(cands, curIdx, curTag, curColor);
      return { markers: [...ghosts.markers, ...lit], lines: [...ghosts.lines, ...litLines] };
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

      // A box anchored off the end of the neck is one you can neither play nor
      // step to, so it owns no notes and names nothing: it used to claim notes
      // down at the nut, putting a run in the legend for a box the arrows can
      // never reach.
      const placements = pentaBoxPlacements(rootPc, isMinor)
        .filter(p => shapeOn(p.name) && p.anchor >= 0 && p.anchor <= FRET_COUNT);
      cagedShapesShown = CAGED_ORDER.filter(n => placements.some(p => p.name === n));
      const tones = chordTonePcs(chord);

      // lines trace each CAGED chord shape (root / 3rd / 5th), one note per
      // string, following the actual fingering — same as Chords mode
      const lines = gripOutlines(rootPc, isMinor);

      // every pentatonic note is coloured by the CAGED box(es) that actually
      // contain it: notes shared by two adjacent boxes get a split dot
      // (left half = lower box, right half = higher box)
      const markers = boxColouredNotes(placements, {
        labelOf: pc => degByPc[pc], rootPc, passingOf: pc => !tones.has(pc),
      });
      const shown = applyBoxWindow(withTagColors(markers, n => CAGED_COLORS[n]), lines, placements);
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

      const boxes = scaleBoxPlacements(rootPc, isMinor, scalePcs)
        .filter(b => shapeOn(b.name) && b.anchor >= 0 && b.anchor <= FRET_COUNT);
      cagedShapesShown = CAGED_ORDER.filter(n => boxes.some(b => b.name === n));
      const tones = chordTonePcs(chord);

      const lines = gripOutlines(rootPc, isMinor);

      const markers = boxColouredNotes(boxes, {
        labelOf: pc => degByPc[pc], rootPc, passingOf: pc => !tones.has(pc),
      });
      const shown = applyBoxWindow(withTagColors(markers, n => CAGED_COLORS[n]), lines, boxes);
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
      // in one position, only the roots under that hand
      const shown = applyBoxWindow(markers, [], gripBoxes(currentChord()));
      return { markers: shown.markers, lines: shown.lines };
    }

    return { markers: [], lines: [] };
  }

  // The progression's *other* chords, drawn into the box you're practising in
  // so you can see where the changes fall without moving your hand. Faint, and
  // only where the chord you're on isn't already using the fret, so it reads as
  // background rather than as competing with the shape.
  let ghostLegendData = [];
  // One chord's shape on the board. The chord in front, the one you're heading
  // into next and the ones after it differ only in the tier they're drawn at,
  // so every chord in every position reading goes through here — that's what
  // makes a cluster look like a box rather than like the old Progression map.
  // `placed` maps a cell to the marker already drawn there, whoever drew it: a
  // cell two chords share is drawn once, by whichever got there first, and the
  // second chord adds its tag and colour to that dot rather than being dropped.
  // Otherwise spotlighting the second chord would light an incomplete version
  // of it, missing exactly the notes it holds in common with the first.
  function placeShape({ chord, cells, tag, color, ghost, isNext, placed, markers }){
    const rootPc = SEMITONE[chord.note] % 12;
    const thirdPc = SEMITONE[chord.third] % 12;
    const fifthPc = SEMITONE[chord.fifth] % 12;
    // the root by name, every other note by the degree it is in this chord
    const nameOf = pc =>
      pc === rootPc ? chord.note : pc === thirdPc ? degreeLabel(chord, 'third') :
      pc === fifthPc ? degreeLabel(chord, 'fifth') : degreeLabel(chord, 'seventh');
    let drew = false;
    cells.forEach(cell => {
      drew = true;
      const k = cell.string + ':' + cell.fret;
      const already = placed.get(k);
      if (already){                       // shared note: one dot, two owners
        if (!already.shapes.includes(tag)) already.shapes.push(tag);
        already.colorsByTag = already.colorsByTag
          || { [already.shapes[0]]: already.color };
        already.colorsByTag[tag] = color;
        // if one of them is the chord you're heading into, the brighter
        // reading wins — the note is coming up either way
        if (isNext && already.ghost) already.ghostNext = true;
        return;
      }
      const pc = (STRING_TUNING[cell.string] + cell.fret) % 12;
      const m = { string: cell.string, fret: cell.fret, color, label: nameOf(pc),
                  isRoot: pc === rootPc, shapes: [tag] };
      if (ghost){ m.ghost = true; m.ghostNext = isNext; }
      placed.set(k, m);
      markers.push(m);
    });
    return drew;
  }

  // `placed` maps a cell to the marker already drawn there, whoever drew it.
  // A cell two chords share gets drawn once, in the front chord's colour, but
  // it belongs to both — so the second chord adds its tag to the marker that's
  // already there rather than being dropped. Otherwise spotlighting that chord
  // would light an incomplete version of it, missing exactly the notes it
  // holds in common with the chord in front.
  // `nearest` changes what "here" means for the chords behind. Where a view's
  // shapes are dense — CAGED grips, five to a chord — the ones inside the
  // window are the ones under your hand. Where they're sparse — close triads,
  // roughly one every four frets — insisting on that shows nothing but the
  // chord you're on, so each chord gives its nearest shape instead, whole.
  function ghostMarkers(win, placed, useGrips, shapesOf, nearest){
    ghostLegendData = [];
    if (!win) return { markers: [], lines: [] };
    const cands = host.progression().filter(c => c.quality !== 'dim');
    const markers = [], lines = [];
    const inWin = c => c.fret >= win.min && c.fret <= win.max;
    const ids = chordIdentity(cands);
    const cur = Math.min(cagedChordIdx, cands.length - 1);
    const curName = displayName(cands[cur]);
    // the chord you're heading into reads brighter than the ones after it,
    // the same three tiers Progression uses while it plays
    const next = cands.length > 1 ? (cur + 1) % cands.length : -1;
    const nextName = next === -1 ? null : displayName(cands[next]);
    const done = new Set([curName]);
    cands.forEach((c, i) => {
      const name = displayName(c);
      if (done.has(name)) return;    // the one in front, or a chord already drawn
      done.add(name);
      const shapes = shapesOf(c);
      const gripNames = shapes.map(g => g.name);
      const grips = shapes.map(g => g.cells);
      // one shape per chord, the one most of which is under this hand — a
      // union of all five clipped to the window is not a shape anyone plays
      // whole shapes only — half a grip clipped by the box edge is not
      // something you can put your hand on
      let bestGrip = [];
      if (nearest && shapes.length){
        // the same fret a chord change aims at, and the same picker, so the
        // shape shown here is the shape switching to this chord gives you
        const aim = positionAnchor != null ? positionAnchor : (win.min + win.max) / 2;
        bestGrip = nearestShape(shapes, aim).cells;
      } else {
        const whole = shapes.filter(g => g.cells.every(inWin));
        bestGrip = whole.length ? whole[0].cells : [];
      }
      // whatever the view in front is showing, the ghosts show the same of:
      // the grips, or every chord tone
      const cells = useGrips
        ? bestGrip
        : arpeggioCells(win.min, win.max,
            new Set([c.note, c.third, c.fifth, c.seventh].filter(Boolean).map(n => SEMITONE[n] % 12)));

      const { tag, color } = ids.get(name);
      const isNext = name === nextName;
      let letter = '';
      const drew = placeShape({ chord: c, cells: nearest ? cells : cells.filter(inWin),
                                tag, color, ghost: true, isNext, placed, markers });
      // and its grip traced through, where one sits wholly inside the box
      grips.forEach((g, gi) => {
        const shown = nearest ? g === bestGrip : g.every(inWin);
        if (g.length > 1 && shown){
          if (!letter) letter = gripNames[gi] || '';
          lines.push({ color, shape: tag, ghost: true, ghostNext: isNext, letter,
                       cells: g.map(cell => ({ string: cell.string, fret: cell.fret })) });
        }
      });
      if (drew) ghostLegendData.push({ name, numeral: c.numeral, color, tag,
                                       shapeLetter: letter, order: ids.get(name).tag });
    });
    return { markers, lines };
  }

  // The five CAGED grips of a chord, as position windows — one ladder of five
  // positions for the whole app rather than each view inventing its own idea of
  // where the hand is. Roots and Triads have no boxes of their own and borrow
  // these outright. Chords uses them as its shape list in the grips reading:
  // the position picks the chord in front's box from here and a chord behind
  // picks the one nearest the same anchor, so the shape you're shown for a
  // chord is the shape you get when you switch to it, by construction. It kept
  // its own copy of this function until the two were noticed to be the same,
  // which is the arrangement that produced B24 in the first place.
  function gripBoxes(chord){
    if (!chord) return [];
    const rootPc = SEMITONE[chord.note] % 12;
    return cagedTriadBoard(rootPc, chord.quality === 'min', chord.note,
      chord.seventh ? SEMITONE[chord.seventh] % 12 : null, enabledShapes()).lines.map(l => ({
        name: l.shape, anchor: Math.min(...l.cells.map(c => c.fret)), cells: l.cells,
      }));
  }

  // A chord is identified by what it is, not by where it sits: a twelve-bar
  // blues has C7 in three slots, and drawing it in three colours with three
  // legend entries says there are three chords when there's one. Colour and
  // tag key off the chord's name, in the order it first appears.
  function chordIdentity(cands){
    const byName = new Map();
    cands.forEach(c => {
      const n = displayName(c);
      if (!byName.has(n)){
        byName.set(n, { tag: 'c' + byName.size, color: ROOT_PALETTE[byName.size % ROOT_PALETTE.length],
                        name: n, numeral: c.numeral });
      }
    });
    return byName;
  }
  const idOf = (cands, i) => chordIdentity(cands).get(displayName(cands[i]));

  // The chord in front takes its place in the same list the ghosted ones
  // build, so the legend reads as one entry per chord in progression order.
  function noteCurrentChord(cands, curIdx, tag, color){
    const c = cands[curIdx];
    if (!c) return;
    ghostLegendData.push({ name: displayName(c), numeral: c.numeral, color, tag,
                           shapeLetter: shownBoxName, order: tag, current: true });
    ghostLegendData.sort((a, b) => Number(a.order.slice(1)) - Number(b.order.slice(1)));
  }

  // the chord the single-chord views are showing
  function currentChord(){
    const cands = host.progression().filter(c => c.quality !== 'dim');
    return cands[Math.min(cagedChordIdx, cands.length - 1)] || null;
  }

  function renderFretLegend(){
    // The position is drawn on the neck itself, as a labelled window over the
    // frets it covers, so the legend doesn't say it again in words. It's
    // published here instead, for whatever draws that window.
    if (shownWindow) cagedLegend.dataset.window = `${shownWindow.min}-${shownWindow.max}`;
    else delete cagedLegend.dataset.window;

    if (fretMode === 'roots'){
      cagedLegend.innerHTML = rootLegendData
        .map(r => `<span><i style="background:${r.color}"></i>${r.name}<em>${r.num}</em></span>`).join('');
      return;
    }
    // each entry says where on the neck that shape sits, so you can find it
    // without hunting for the colour
    const range = n => {
      const runs = shapeRanges[n];
      if (!runs || !runs.length) return '';
      return `<em class="range">${runs.map(r => `${r.min}–${r.max}`).join(' · ')}</em>`;
    };
    // Chords in one position is Progression's picture, so it gets
    // Progression's legend: one entry per chord, named, numbered, tagged with
    // the CAGED shape it's sitting in, and spotlightable by hovering it.
    if (inPosition && (fretMode === 'caged' || fretMode === 'triads3')){
      const entries = ghostLegendData.map(g =>
        `<span data-shape="${g.tag}" tabindex="0" role="button" aria-label="Highlight ${g.name}"` +
        `${g.current ? ' class="legend-current"' : ''}>` +
        `<i style="background:${g.color}"></i>${g.name}<em>${g.numeral}</em>` +
        `${g.shapeLetter ? `<small class="pos-shape-tag">${g.shapeLetter}</small>` : ''}${range(g.tag)}</span>`);
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

    if (fretMode === 'roots'){
      stuckShape = null;
      paintRootSpotlight();
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
  }

  function resetFollow(){
    activeRootPc = null;
  }

  function onPlaybackStarted(){
    updateCagedLock();
  }

  function onPlaybackStopped(){
    updateCagedLock();
    if (activeRootPc != null){
      activeRootPc = null;
      if (fretMode === 'roots') renderFretboard();
    }
  }

  GT.fretboardView = {
    init(hostImpl){ host = hostImpl; updateFretUI(); },
    render: renderFretboard,
    updateVisibility: updateFretUI,
    rebuildChordPicker: rebuildCagedPicker,
    resetPosition(){ chordPosIndex = 0; },   // a fresh progression starts at the lowest cluster
    resetFollow, followChord, selectChord, onPlaybackStarted, onPlaybackStopped,
  };
})();
