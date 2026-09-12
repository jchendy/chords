// Regression tests for what the fretboard actually draws.
//
// The five views are the one part of the app with no pure seam: the shapes are
// decided while rendering, against DOM the practice tab owns. So this file
// builds the controls the view binds to — ids and data-values only, no styling
// — and must load *before* js/fretboard-view.js, which binds them as it loads.
// The suites themselves run later, from js/tests.js.
//
// Everything here guards a bug that shipped, and they were all the same
// mistake in different places: a shape is a thing you put your hand on, so
// clipping one to a window, or letting several blur together, leaves something
// on screen that nobody can play. The invariants are the cheapest way to say
// that in code —
//
//   one note per string      a grip has one note per string, by definition
//   whole triads only        three notes on three strings, or not drawn
//   every chord present      a view of the progression shows the progression
//   a shared note's colours  highlighting a chord shows it in its own colour
//
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  // ---- the controls the view expects to find -------------------------------
  // Built rather than copied from index.html: the view only ever asks for ids
  // and data-values, so that's all a fixture owes it. A control added to the
  // real page and forgotten here fails loudly on the next run, which is the
  // behaviour worth having.
  const SEG = {
    fretModeGroup: ['roots', 'caged', 'triads3', 'penta', 'scale'],
    viewGroup: ['position', 'neck'],
    cagedPosMethodGroup: ['box', 'cluster', 'lead'],
    cagedShapeGroup: ['C', 'A', 'G', 'E', 'D'],
    colorByGroup: ['shape', 'interval'],
    scaleTheoryGroup: ['parallel', 'modal'],
    stringSetGroup: ['2', '3', '4', '5'],
  };
  const PLAIN = ['boxRow', 'boxStep', 'cagedChordRow', 'cagedChordGroup', 'cagedLegend',
                 'cagedPosMethodWrap', 'cagedViewRow', 'colorByLabel', 'scaleTheoryRow',
                 'stringSetRow'];

  const root = document.createElement('div');
  root.id = 'fretboard-fixture';
  root.hidden = true;

  PLAIN.forEach(id => {
    const el = document.createElement('div');
    el.id = id;
    root.appendChild(el);
  });
  ['boxNext', 'boxPrev'].forEach(id => {
    const b = document.createElement('button');
    b.id = id;
    root.appendChild(b);
  });
  // the view greys a checkbox out by reaching for the label wrapping it, and
  // hides Whole arpeggio by that label's own id — so the wrapper has to be the
  // label here too, as it is on the page, not a box beside it
  const WRAPPER_ID = { wholeArpeggioToggle: 'wholeArpeggioWrap' };
  ['cagedFollowToggle', 'wholeArpeggioToggle'].forEach(id => {
    const label = document.createElement('label');
    label.className = 'inline-check';
    if (WRAPPER_ID[id]) label.id = WRAPPER_ID[id];
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = id;
    if (id === 'cagedFollowToggle') box.checked = true;
    label.appendChild(box);
    root.appendChild(label);
  });
  // Which buttons start lit has to match the real page, because the view reads
  // its own state from JavaScript and only writes the classes back: a fixture
  // that disagreed would make a test toggling a control do the opposite of
  // what it meant. Every group is a picker whose first option is the default —
  // except the shapes, which are independent toggles, and which open on A, E
  // and D because the view starts in one position — all positions has all
  // five, and the buttons are repainted when the reading changes.
  const SEG_ACTIVE = { cagedShapeGroup: ['A', 'E', 'D'] };
  // the view rewrites this one's label as the mode changes, so it has to start
  // with the text the page ships rather than empty
  const SEG_TEXT = { viewGroup: { neck: 'All positions', position: 'One position' } };
  Object.entries(SEG).forEach(([id, values]) => {
    const group = document.createElement('div');
    group.id = id;
    group.className = 'segmented';
    const lit = SEG_ACTIVE[id];
    values.forEach((v, i) => {
      const b = document.createElement('button');
      const on = lit ? lit.includes(v) : i === 0;
      b.className = 'seg-btn' + (on ? ' active' : '');
      b.dataset.value = v;
      if (SEG_TEXT[id] && SEG_TEXT[id][v]) b.textContent = SEG_TEXT[id][v];
      group.appendChild(b);
    });
    root.appendChild(group);
  });
  const sel = document.createElement('select');
  sel.id = 'fretRangeSelect';
  ['all', 'fit', '0-7'].forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    sel.appendChild(o);
  });
  root.appendChild(sel);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'fretboard';
  root.appendChild(svg);
  document.body.appendChild(root);

  // ---- driving it ----------------------------------------------------------
  let progression = [];
  const q = s => root.querySelector(s);
  const click = s => { const el = q(s); if (el) el.click(); };
  const setMode = m => click(`#fretModeGroup [data-value="${m}"]`);
  const setView = v => click(`#viewGroup [data-value="${v}"]`);
  const setMethod = m => click(`#cagedPosMethodGroup [data-value="${m}"]`);
  const setStringSet = s => click(`#stringSetGroup [data-value="${s}"]`);
  const stepPosition = () => click('#boxNext');
  const shapesOn = () => [...q('#cagedShapeGroup').querySelectorAll('.seg-btn')]
    .filter(b => b.classList.contains('active')).map(b => b.dataset.value);
  // Switch the wanted ones on before switching the rest off: the view refuses
  // to turn off the last shape standing, so a set that emptied on the way past
  // would keep whichever shape happened to be last rather than the one asked
  // for.
  const setShapes = want => {
    want.forEach(n => { if (!shapesOn().includes(n)) click(`#cagedShapeGroup [data-value="${n}"]`); });
    shapesOn().filter(n => !want.includes(n))
      .forEach(n => click(`#cagedShapeGroup [data-value="${n}"]`));
  };

  let started = false;
  function start(){
    if (started) return;
    started = true;
    GT.fretboardView.init({
      progression: () => progression,
      isPlaying: () => false,
      mode: () => 'minor',
      tonic: () => 'A',
      activeChord: () => null,
    });
  }
  function loadProgression(names){
    start();
    progression = names.map(n => GT.theory.chordFromName(n, 0, 'major'));
    GT.fretboardView.rebuildChordPicker();
    GT.fretboardView.render();
  }

  // every note on the board, grouped by the chord or shape it belongs to.
  // A dot's string is its y, which is all these checks need.
  function drawnByTag(){
    const out = {};
    svg.querySelectorAll('.note-dot').forEach(g => {
      const c = g.querySelector('circle') || g.querySelector('path');
      if (!c) return;
      const cell = { y: c.getAttribute('cy') || c.getAttribute('d') };
      (g.getAttribute('data-shapes') || '').split(',').filter(Boolean)
        .forEach(t => { (out[t] = out[t] || []).push(cell); });
    });
    return out;
  }
  // the exact notes a chord owns, as "string:fret" keys read off the drawing
  function cellsOf(tag){
    const out = [];
    svg.querySelectorAll('.note-dot').forEach(g => {
      if (!(g.getAttribute('data-shapes') || '').split(',').includes(tag)) return;
      const c = g.querySelector('circle') || g.querySelector('path');
      if (c) out.push((c.getAttribute('cx') || '') + '@' + (c.getAttribute('cy') || c.getAttribute('d')));
    });
    return out.sort().join(' ');
  }
  const pickChord = i => {
    const b = q('#cagedChordGroup').querySelectorAll('.seg-btn')[i];
    if (b) b.click();
  };

  const legendTags = () =>
    [...q('#cagedLegend').querySelectorAll('[data-shape]')].map(e => e.getAttribute('data-shape'));

  const PROGRESSIONS = [
    ['Am7', 'Dm7', 'E7'],       // the report: Am7's triad sits below the box
    ['Ab7', 'Db7', 'Eb7'],      // the twelve-bar that drew a two-note Ab7
    ['C', 'F', 'G'],
    ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    ['Bm', 'D', 'Em'],
  ];
  const STRING_SETS = ['2', '3', '4', '5'];
  const POSITIONS = 6;

  // ---- the suites ----------------------------------------------------------

  // B17 — a grip has one note per string. The position reading used to clip
  // the whole five-shape board to the window, so fragments of neighbouring
  // shapes came through and one "chord" could hold two notes on a string.
  function testGripsAreGrips(t){
    let bad = null, checked = 0;
    PROGRESSIONS.forEach(names => {
      loadProgression(names);
      setMode('caged'); setView('position'); setMethod('box');
      for (let p = 0; p < POSITIONS; p++){
        Object.entries(drawnByTag()).forEach(([tag, cells]) => {
          checked++;
          const strings = new Set(cells.map(c => c.y)).size;
          if (strings !== cells.length && !bad){
            bad = `${names.join('-')} position ${p}, ${tag}: ${cells.length} notes on ${strings} strings`;
          }
        });
        stepPosition();
      }
    });
    t.ok(!bad, `Chords in one position: every chord is a grip, one note per string (${checked} checked)`
      + (bad ? ` — ${bad}` : ''));
  }

  // ...and opening the shapes out must break that, or the check above is
  // passing on an empty board
  function testArpeggioReallyOpensOut(t){
    loadProgression(['Am7', 'Dm7', 'E7']);
    setMode('caged'); setView('position'); setMethod('box');
    const arp = q('#wholeArpeggioToggle');
    arp.checked = true;
    arp.dispatchEvent(new Event('change'));
    const opened = Object.values(drawnByTag())
      .some(cells => new Set(cells.map(c => c.y)).size < cells.length);
    arp.checked = false;
    arp.dispatchEvent(new Event('change'));
    t.ok(opened, 'Whole arpeggio puts more than one note on a string, so the grip check means something');
  }

  // B19 — a triad is three notes on three strings. One reaching a fret past
  // the box used to be drawn as the two notes that fitted.
  function testTriadsAreWhole(t){
    let bad = null, checked = 0;
    PROGRESSIONS.forEach(names => {
      loadProgression(names);
      setMode('triads3'); setView('position');
      STRING_SETS.forEach(set => {
        setStringSet(set);
        for (let p = 0; p < POSITIONS; p++){
          Object.entries(drawnByTag()).forEach(([tag, cells]) => {
            checked++;
            const strings = new Set(cells.map(c => c.y)).size;
            if ((cells.length % 3 || strings !== 3) && !bad){
              bad = `${names.join('-')} set ${set} position ${p}, ${tag}: ${cells.length} notes on ${strings} strings`;
            }
          });
          stepPosition();
        }
      });
    });
    t.ok(!bad, `Triads in one position: every triad complete, three notes on three strings (${checked} checked)`
      + (bad ? ` — ${bad}` : ''));
  }

  // B20 — the other side of the same coin. Requiring a shape to sit wholly
  // inside the window left the sparse triad views showing one chord alone.
  function testEveryChordIsDrawn(t){
    let bad = null, checked = 0;
    // Both views, and the nut especially: a CAGED grip is four frets wide and
    // a box down there can be three, so a chord whose shape reaches one fret
    // past the edge is exactly what goes missing.
    ['triads3', 'caged'].forEach(mode => {
      PROGRESSIONS.forEach(names => {
        loadProgression(names);
        const want = new Set(progression.filter(c => c.quality !== 'dim')
          .map(GT.theory.displayName)).size;
        setMode(mode); setView('position');
        (mode === 'triads3' ? STRING_SETS : ['2']).forEach(set => {
          if (mode === 'triads3') setStringSet(set);
          // walk from the nut upward, so the tight low boxes are covered
          for (let i = 0; i < 8; i++) click('#boxPrev');
          for (let p = 0; p < POSITIONS; p++){
            checked++;
            const got = Object.keys(drawnByTag()).length;
            if (got < want && !bad){
              bad = `${mode} ${names.join('-')} set ${set} position ${p}: ${got} of ${want} chords drawn`;
            }
            stepPosition();
          }
        });
      });
    });
    t.ok(!bad, `In one position the whole progression is on the neck (${checked} positions)`
      + (bad ? ` — ${bad}` : ''));
  }

  // the legend has to agree with the neck: an entry for every chord drawn,
  // and nothing named that isn't there
  function testLegendMatchesTheNeck(t){
    let bad = null;
    PROGRESSIONS.forEach(names => {
      loadProgression(names);
      ['caged', 'triads3'].forEach(mode => {
        setMode(mode); setView('position');
        for (let p = 0; p < POSITIONS; p++){
          const drawn = new Set(Object.keys(drawnByTag()));
          const named = new Set(legendTags());
          const unnamed = [...drawn].filter(x => !named.has(x));
          const unshown = [...named].filter(x => !drawn.has(x));
          if ((unnamed.length || unshown.length) && !bad){
            bad = `${names.join('-')} ${mode} position ${p}: drawn but unnamed [${unnamed}], named but not drawn [${unshown}]`;
          }
          stepPosition();
        }
      });
    });
    t.ok(!bad, 'The legend names exactly the chords on the neck' + (bad ? ` — ${bad}` : ''));
  }

  // B21 — a note two chords share is drawn once, in one of their colours, so
  // it has to carry the other's too, or spotlighting that chord shows it in
  // the wrong one.
  function testSharedNotesCarryEveryColour(t){
    let bad = null, shared = 0;
    PROGRESSIONS.forEach(names => {
      loadProgression(names);
      ['caged', 'triads3'].forEach(mode => {
        setMode(mode); setView('position');
        for (let p = 0; p < POSITIONS; p++){
          svg.querySelectorAll('.note-dot').forEach(g => {
            const tags = (g.getAttribute('data-shapes') || '').split(',').filter(Boolean);
            if (tags.length < 2) return;
            shared++;
            const have = new Set((g.getAttribute('data-colors') || '')
              .split(',').map(x => x.split(':')[0]).filter(Boolean));
            const gap = tags.filter(x => !have.has(x));
            if (gap.length && !bad){
              bad = `${names.join('-')} ${mode} position ${p}: note shared by [${tags}] has colours for [${[...have]}]`;
            }
          });
          stepPosition();
        }
      });
    });
    t.ok(!bad, `A note two chords share carries a colour for each of them (${shared} shared notes)`
      + (bad ? ` — ${bad}` : ''));
  }

  // B22 — the hand stays where you put it. Chord changes re-pick the nearest
  // shape of the new chord, and that target used to be re-derived from
  // wherever the last one landed, so every change nudged it and the nudges
  // added up into a walk along the neck across a progression.
  function testPositionHoldsStillWhilePlaying(t){
    let bad = null, runs = 0;
    const view = GT.fretboardView;
    ['triads3', 'caged', 'penta'].forEach(mode => {
      PROGRESSIONS.forEach(names => {
        const chords = names.map(n => GT.theory.chordFromName(n, 0, 'major'));
        let active = 0;
        view.init({
          progression: () => chords, isPlaying: () => true,
          mode: () => 'minor', tonic: () => 'A',
          activeChord: () => ({ idx: active, measure: 1, beat: 1 }),
        });
        view.rebuildChordPicker();
        view.render();
        setMode(mode);
        setView('position');
        (mode === 'triads3' ? STRING_SETS : ['2']).forEach(set => {
          if (mode === 'triads3') setStringSet(set);
          for (let start = 0; start < 3; start++){
            for (let i = 0; i < start; i++) stepPosition();
            runs++;
            // play a few laps of the progression without touching the arrows
            const seen = [];
            for (let n = 0; n < 24; n++){
              active = (active + 1) % chords.length;
              view.followChord({ idx: active, measure: 1, beat: 1 });
              const w = (q('#cagedLegend').dataset.window || '').split('-').filter(Boolean);
              seen.push(w.length ? (Number(w[0]) + Number(w[1])) / 2 : null);
            }
            // Chords that share no position will alternate between their own,
            // which is right. What must not happen is finding new ground every
            // lap — a walk visits far more places than a cycle does.
            const distinct = new Set(seen).size;
            if (distinct > chords.length + 1 && !bad){
              bad = `${mode} ${names.join('-')} set ${set} start ${start}: ${distinct} positions over 24 chord changes`;
            }
          }
        });
      });
    });
    // put the view back on the page's own progression
    view.init({ progression: () => progression, isPlaying: () => false,
      mode: () => 'minor', tonic: () => 'A', activeChord: () => null });
    t.ok(!bad, `Playing through a progression doesn't walk the hand along the neck (${runs} runs)`
      + (bad ? ` — ${bad}` : ''));
  }

  // B24 — what a chord looks like sitting behind must be what you get when
  // you switch to it. The preview aimed at the middle of the window while the
  // switch aimed at the position anchor, and once the window had been padded
  // out and stretched over the other chords those were different frets — so a
  // chord could be previewed in one place and arrive in another.
  function testPreviewMatchesArrival(t){
    let bad = null, compared = 0;
    ['triads3', 'caged'].forEach(mode => {
      PROGRESSIONS.forEach(names => {
        loadProgression(names);
        setMode(mode);
        setView('position');
        (mode === 'triads3' ? STRING_SETS : ['2']).forEach(set => {
          if (mode === 'triads3') setStringSet(set);
          for (let p = 0; p < POSITIONS; p++){
            const tags = legendTags();
            // what each chord looks like from where we are now...
            const preview = {};
            tags.forEach(tag => { preview[tag] = cellsOf(tag); });
            // ...against what it looks like once it's the chord in front
            tags.forEach((tag, i) => {
              pickChord(i);
              const arrived = cellsOf(tag);
              compared++;
              if (preview[tag] !== arrived && !bad){
                bad = `${mode} ${names.join('-')} set ${set} position ${p}, ${tag}: `
                  + `previewed [${preview[tag] || 'nothing'}], arrived [${arrived || 'nothing'}]`;
              }
            });
            pickChord(0);
            stepPosition();
          }
        });
      });
    });
    t.ok(!bad, `A chord looks the same previewed as it does selected (${compared} compared)`
      + (bad ? ` — ${bad}` : ''));
  }

  // and narrowing to a position must actually narrow, in every view
  function testPositionNarrows(t){
    loadProgression(['Am7', 'Dm7', 'E7']);
    ['roots', 'caged', 'triads3', 'penta', 'scale'].forEach(mode => {
      setMode(mode);
      setView('position');
      const narrowed = svg.querySelectorAll('.note-dot').length;
      setView('neck');
      const whole = svg.querySelectorAll('.note-dot').length;
      t.ok(whole > narrowed && narrowed > 0,
        `${mode}: one position shows less of the neck than all of it (${narrowed} of ${whole})`);
    });
  }

  // Three ways of putting a progression in one position — One box, Cluster,
  // Voice leading — differ in where the shapes land and in nothing else. They
  // used to differ in how they were drawn too: Cluster and Voice leading were
  // still running the old Progression renderer, with its own dimming, its own
  // split dots and no fret readout, so the same three shapes looked like two
  // different pictures depending on which button was lit.
  function testPositionMethodsRenderAlike(t){
    const readings = [];
    let bad = '';
    [['Am', 'Dm', 'E'], ['C', 'Am', 'F', 'G'], ['Bm7', 'E7', 'A']].forEach(names => {
      loadProgression(names);
      setMode('caged');
      setView('position');
      [false, true].forEach(arp => {
        const cb = q('#wholeArpeggioToggle');
        if (cb.checked !== arp) cb.click();
        for (let p = 0; p < 3; p++){
          if (p) stepPosition();
          ['box', 'cluster', 'lead'].forEach(method => {
            setMethod(method);
            const where = `${names.join('-')} arp=${arp} position ${p} ${method}`;
            const legend = [...q('#cagedLegend').querySelectorAll('span')]
              .map(s => s.textContent.trim());
            const fail =
              svg.classList.contains('positions-mode') ? 'draws through the old Progression renderer'
              : svg.querySelectorAll('.pos-root, .ringed').length ? "uses Progression's emphasis"
              : svg.querySelectorAll('.note-dot path').length ? 'splits shared dots in two'
              : !svg.querySelectorAll('.note-dot:not(.ghost)').length ? 'lights no chord at all'
              : names.length > 1 && !svg.querySelectorAll('.note-dot.ghost').length
                ? 'shows the rest of the progression at full strength'
              : q('#cagedLegend').querySelectorAll('.legend-current').length !== 1
                ? 'names no single chord as the one in front'
              : !q('#cagedLegend').dataset.window ? 'publishes no position for the window on the neck'
              : legend.length < new Set(names).size ? 'leaves a chord out of the legend'
              : '';
            if (fail && !bad) bad = `${where} ${fail}`;
            readings.push(where);
          });
        }
      });
    });
    t.ok(!bad, `Every way of choosing a position draws the same picture `
      + `(${readings.length} readings)` + (bad ? ` — ${bad}` : ''));
  }

  // A box anchored off the end of the neck is one the arrows can never land
  // on, so nothing should be coloured by it or named after it. Pentatonic used
  // to hand notes at the nut to a D box anchored at -2, which put a run in the
  // legend — "D shape 0-1 · 9-13" — for a position you could not step to.
  // Every run the legend knows (each entry carries its frets as a tooltip)
  // should be a position you can reach: count them.
  function testEveryBoxNamedCanBeReached(t){
    loadProgression(['C', 'F', 'G']);
    const all = ['C', 'A', 'G', 'E', 'D'];
    ['penta', 'scale'].forEach(mode => {
      setMode(mode);
      // The runs come from the neck reading and the windows from the position
      // one, and the two carry their own sets of shapes — so put both on all
      // five, or this would be counting a five-shape legend against a
      // three-shape stepper and calling the difference a bug.
      setView('neck');
      setShapes(all);
      const runs = [...q('#cagedLegend').querySelectorAll('[data-shape][title]')]
        .reduce((n, el) => n + el.title.split('·').length, 0);
      // walk the stepper right round and collect the distinct windows it lands on
      setView('position');
      setShapes(all);
      const seen = new Set();
      for (let i = 0; i < 16; i++){
        seen.add(q('#cagedLegend').dataset.window || '');
        stepPosition();
      }
      t.equal(runs, seen.size,
        `${mode}: the legend names ${runs} stretches of neck and the arrows reach ${seen.size}`);
    });
    setView('position'); setShapes(['A', 'E', 'D']);      // back to the defaults
    setView('neck'); setShapes(all);
  }

  // Across the neck, a dot's colour is the CAGED box it belongs to, and the
  // three views that draw that picture — the Chords arpeggio, Pentatonic and
  // Scales — each say so in their own copy of the same loop. That's how B5
  // happened: one copy coloured notes with a box anchored off the end of the
  // neck while the others didn't. The invariant behind all three is that the
  // colour on a dot has to be the colour of a box that dot claims to be in.
  function testEveryColourComesFromItsBox(t){
    const colours = GT.fretboard.CAGED_COLORS;
    const bad = [];
    let dots = 0;
    loadProgression(['Am7', 'Dm7', 'E7']);
    ['caged', 'penta', 'scale'].forEach(mode => {
      setMode(mode);
      setView('neck');
      [false, true].forEach(arp => {
        const cb = q('#wholeArpeggioToggle');
        if (cb.checked !== arp) cb.click();
        svg.querySelectorAll('.note-dot').forEach(g => {
          const shapes = (g.getAttribute('data-shapes') || '').split(',').filter(Boolean);
          const halves = [...g.querySelectorAll('path')];
          // a hollow dot — the 7th — wears its colour on the stroke, with the
          // panel showing through, so reading its fill would read the panel
          const paint = g.classList.contains('hollow') ? 'stroke' : 'fill';
          const fills = halves.length
            ? halves.map(h => h.getAttribute(paint))
            : [...g.querySelectorAll('circle:not(.dot-ring)')].map(c => c.getAttribute(paint));
          if (!fills.length) return;
          dots++;
          const owned = shapes.map(n => colours[n]).filter(Boolean);
          // a half painted in a colour no box of this dot wears
          const stray = fills.filter(f => f && !owned.includes(f));
          if (stray.length && bad.length < 4)
            bad.push(`${mode} arp=${arp}: a dot in [${shapes.join(',')}] is painted ${stray[0]}`);
          // a split dot is how "two boxes share this note" is drawn, so two
          // halves of one colour would be saying nothing in two places
          if (halves.length === 2 && fills[0] === fills[1] && bad.length < 4)
            bad.push(`${mode} arp=${arp}: a split dot has both halves ${fills[0]}`);
        });
      });
    });
    t.ok(!bad.length, `Every dot wears the colour of a box it's in (${dots} checked)`
      + (bad.length ? ` — ${bad[0]}` : ''));
  }

  // A shape switched off leaves the view entirely — no dot claims it, no
  // outline traces it, no legend entry names it, and the arrows don't stop on
  // it. Filtering at the source is what makes that true of a note two shapes
  // share: with one of them off it's a plain dot in the other's colour rather
  // than a split still half-painted by a shape that isn't there.
  function testDisabledShapesLeaveTheView(t){
    const bad = [];
    loadProgression(['Am7', 'Dm7', 'E7']);
    // the reading first: each keeps its own set of shapes, so setting them
    // before choosing one would edit whichever set happened to be showing
    setMode('caged');
    setView('neck');
    [['A', 'E', 'D'], ['C', 'G'], ['E'], ['C', 'A', 'G', 'E', 'D']].forEach(on => {
      setShapes(on);
      [['caged', false], ['caged', true], ['penta', false], ['scale', false]].forEach(([mode, arp]) => {
        setMode(mode);
        const cb = q('#wholeArpeggioToggle');
        if (cb.checked !== arp) cb.click();
        const where = `${mode} ${on.join('')} arp=${arp}`;
        const drawn = new Set([...svg.querySelectorAll('.note-dot')]
          .flatMap(g => (g.getAttribute('data-shapes') || '').split(',').filter(Boolean)));
        const traced = new Set([...svg.querySelectorAll('.shape-line')]
          .map(l => l.getAttribute('data-shape')));
        const named = new Set(legendTags());
        [...drawn].filter(n => !on.includes(n)).forEach(n => bad.push(`${where}: ${n} still on the neck`));
        [...traced].filter(n => !on.includes(n)).forEach(n => bad.push(`${where}: ${n} still traced`));
        [...named].filter(n => !on.includes(n)).forEach(n => bad.push(`${where}: ${n} still in the legend`));
        if (!drawn.size) bad.push(`${where}: nothing drawn at all`);
      });
    });
    setMode('caged');
    setShapes(['C', 'A', 'G', 'E', 'D']);      // back to what this reading opens on
    t.ok(!bad.length, `A shape switched off leaves the neck, the outlines and the legend`
      + (bad.length ? ` — ${bad[0]}` : ''));
  }

  // One box only means something while the shapes left on can meet inside a
  // hand's reach. When they can't the option has to go — and go for good, not
  // just visually: an unusable reading left selected would quietly stop
  // windowing at all and call the whole neck one box.
  function testOneBoxGoesWhenItCannotHold(t){
    const bad = [];
    loadProgression(['Am7', 'Dm7', 'E7']);
    setMode('caged');
    setView('position');
    const boxBtn = () => q('#cagedPosMethodGroup [data-value="box"]');
    const method = () => {
      const on = [...q('#cagedPosMethodGroup').querySelectorAll('.seg-btn')]
        .find(b => b.classList.contains('active'));
      return on ? on.dataset.value : null;
    };
    // wide enough sets keep it; a single shape spans most of the neck
    setShapes(['C', 'A', 'G', 'E', 'D']);
    if (boxBtn().disabled) bad.push('all five shapes: One box was refused');
    setMethod('box');
    if (method() !== 'box') bad.push('all five shapes: One box would not select');
    setShapes(['A']);
    if (!boxBtn().disabled) bad.push('one shape: One box was still offered');
    if (method() === 'box') bad.push('one shape: One box stayed selected once it became impossible');
    // and it comes back when the shapes do
    setShapes(['A', 'E', 'D']);
    if (boxBtn().disabled) bad.push('A-E-D: One box did not come back');
    t.ok(!bad.length, 'One box is offered exactly while a hand could hold the progression'
      + (bad.length ? ` — ${bad[0]}` : ''));
  }

  // The two readings ask different questions, so each keeps its own set of
  // shapes: across the neck all five, which is the map of where a chord lives;
  // in one position the three that sit under a hand. Switching between them
  // must bring the right set back rather than carrying one over — including
  // the buttons, which are the only place the set is visible.
  function testEachReadingKeepsItsOwnShapes(t){
    const bad = [];
    loadProgression(['Am7', 'Dm7', 'E7']);
    setMode('caged');
    setView('neck');
    if (shapesOn().join('') !== 'CAGED') bad.push(`across the neck opens on ${shapesOn().join('') || 'nothing'}`);
    setView('position');
    if (shapesOn().join('') !== 'AED') bad.push(`in one position opens on ${shapesOn().join('') || 'nothing'}`);
    // change one, and the other must be untouched when you come back
    setShapes(['C', 'A']);
    setView('neck');
    if (shapesOn().join('') !== 'CAGED') bad.push(`the neck's set followed the position's: ${shapesOn().join('')}`);
    setShapes(['G']);
    setView('position');
    if (shapesOn().join('') !== 'CA') bad.push(`the position's set was not kept: ${shapesOn().join('')}`);
    setView('neck');
    if (shapesOn().join('') !== 'G') bad.push(`the neck's set was not kept: ${shapesOn().join('')}`);
    setShapes(['C', 'A', 'G', 'E', 'D']);
    setView('position');
    setShapes(['A', 'E', 'D']);
    t.ok(!bad.length, 'Each reading keeps its own shapes' + (bad.length ? ` — ${bad[0]}` : ''));
  }

  // Chords, Pentatonic and Scales are three views of the same five shapes, so
  // the choice of which to work on follows you between them: switching off the
  // G shape and then following a chord into its scale shouldn't hand it back.
  function testShapesCarryBetweenViews(t){
    const bad = [];
    loadProgression(['Am7', 'Dm7', 'E7']);
    setMode('caged');
    ['neck', 'position'].forEach(reading => {
      setView(reading);
      setShapes(['A', 'D']);
      ['penta', 'scale', 'caged'].forEach(mode => {
        setMode(mode);
        if (shapesOn().join('') !== 'AD')
          bad.push(`${reading}: ${mode} shows ${shapesOn().join('') || 'nothing'}`);
      });
      // and a change made in one of them is the same change in the others
      setMode('scale');
      setShapes(['E']);
      setMode('caged');
      if (shapesOn().join('') !== 'E')
        bad.push(`${reading}: a change made in Scales didn't reach Chords (${shapesOn().join('')})`);
    });
    setView('position'); setShapes(['A', 'E', 'D']);
    setView('neck'); setShapes(['C', 'A', 'G', 'E', 'D']);
    t.ok(!bad.length, 'The shapes you\u2019re working on follow you between the views'
      + (bad.length ? ` — ${bad[0]}` : ''));
  }

  // Chords and Triads are the two views that bring the whole progression into
  // the position with you, so there the reading is named for that. The others
  // put one view's notes in a position rather than every chord and keep the
  // plain name. Only the wording differs: the reading is chosen by the button's
  // data-value, so a test that clicked by label would still work either way —
  // which is exactly why this checks the label itself.
  function testTheReadingIsNamedForWhatItShows(t){
    const bad = [];
    loadProgression(['Am7', 'Dm7', 'E7']);
    const label = () => q('#viewGroup [data-value="position"]').textContent.trim();
    const WHOLE_PROGRESSION = 'All chords, one position';
    [['caged', WHOLE_PROGRESSION], ['triads3', WHOLE_PROGRESSION],
     ['roots', 'One position'], ['penta', 'One position'],
     ['scale', 'One position']].forEach(([mode, want]) => {
      setMode(mode);
      if (label() !== want) bad.push(`${mode} reads "${label()}", not "${want}"`);
    });
    // and the label is only a label — choosing the reading still works
    setMode('caged');
    setView('position');
    const on = [...q('#viewGroup').querySelectorAll('.seg-btn')]
      .filter(b => b.classList.contains('active')).map(b => b.dataset.value);
    if (on.join() !== 'position') bad.push(`selecting it left [${on}] active`);
    setView('neck');
    t.equal(bad.join('; '), '', 'The reading is named for what that view puts in the position');
  }

  // A bar in the chord chart is a way onto the neck: while nothing is playing
  // there's no Follow to move the hand for you, so clicking a bar brings that
  // chord forward itself. The picker leaves out diminished chords, which have
  // no CAGED shapes, so a place in the progression has to be counted past them
  // rather than used as a button index — the bug this guards.
  function testChartClickPicksTheChord(t){
    const bad = [];
    loadProgression(['C', 'Bdim', 'F', 'G']);
    setMode('caged');
    setView('neck');
    const buttons = () => [...q('#cagedChordGroup').querySelectorAll('.seg-btn')];
    const inFront = () => (buttons().find(b => b.classList.contains('active')) || {}).textContent || 'nothing';
    if (buttons().map(b => b.textContent).join() !== 'C,F,G'){
      bad.push(`the picker lists [${buttons().map(b => b.textContent)}], not the chords with shapes`);
    }
    [[0, 'C'], [2, 'F'], [3, 'G']].forEach(([idx, want]) => {
      GT.fretboardView.selectChord(idx);
      if (inFront() !== want) bad.push(`bar ${idx} put ${inFront()} in front, not ${want}`);
    });
    // the diminished chord has no button, so its bar leaves the neck alone
    GT.fretboardView.selectChord(1);
    if (inFront() !== 'G') bad.push(`the diminished chord's bar moved the neck to ${inFront()}`);
    // Roots draws every chord at once — there's nothing to bring forward
    setMode('roots');
    GT.fretboardView.selectChord(0);
    if (inFront() !== 'G') bad.push(`in Roots it still moved the neck to ${inFront()}`);
    setMode('caged');
    t.equal(bad.join('; '), '', 'A bar in the chart brings its own chord onto the neck');
  }

  // The position is drawn on the neck as a window over the frets it covers, so
  // the legend publishes it as data for whatever draws that window rather than
  // spelling it out again in words underneath.
  function testThePositionIsPublishedForTheWindow(t){
    const bad = [];
    loadProgression(['C', 'F', 'G']);
    ['caged', 'triads3', 'penta', 'scale'].forEach(mode => {
      setMode(mode);
      setView('position');
      const win = q('#cagedLegend').dataset.window;
      if (!/^\d+-\d+$/.test(win || '')) bad.push(`${mode} in one position publishes "${win}"`);
      if (/position: frets/.test(q('#cagedLegend').textContent)){
        bad.push(`${mode} still spells the position out in the legend`);
      }
    });
    setMode('caged');
    setView('neck');
    t.equal(bad.join('; '), '', 'The legend publishes the position for the window on the neck');
  }

  // A position is a stretch of neck, not one chord's box: changing which chord
  // is in front changes what's lit, not where the hand is. It went wrong with
  // the arpeggio opened out (B32) — that reading took its window from its own
  // boxes, which are wider and fewer than the grips, so each chord's nearest
  // to the same anchor could land a couple of frets from the last.
  function testThePositionHoldsWhileTheChordChanges(t){
    const bad = [];
    const arpToggle = q('#wholeArpeggioToggle');
    const win = () => q('#cagedLegend').dataset.window || '(none)';
    const acrossChords = () => {
      const seen = new Set();
      [...q('#cagedChordGroup').querySelectorAll('.seg-btn')].forEach(b => { b.click(); seen.add(win()); });
      return [...seen];
    };

    [['C', 'F', 'G'], ['G', 'C', 'D'], ['Am', 'Dm', 'E'], ['C', 'Am', 'F', 'G']].forEach(names => {
      loadProgression(names);
      setMode('caged');
      setView('position');
      setShapes(['A', 'E', 'D']);
      ['box', 'cluster', 'lead'].forEach(method => {
        setMethod(method);
        for (let step = 0; step < 4; step++){
          if (step) stepPosition();
          const held = {};
          [false, true].forEach(arp => {
            if (arpToggle.checked !== arp) arpToggle.click();
            const seen = acrossChords();
            if (seen.length !== 1){
              bad.push(`${names.join('-')} ${method} position ${step} arpeggio=${arp}: ` +
                       `the window moved between chords — ${seen.join(' then ')}`);
            }
            held[arp] = seen[0];
          });
          // One box is a box you pick, so the toggle must leave it alone. The
          // other two put each chord where it really falls and report the
          // stretch that covers, and the arpeggio genuinely draws more — so
          // there the window is allowed to grow with it.
          if (method === 'box' && held[false] !== held[true]){
            bad.push(`${names.join('-')} position ${step}: ` +
                     `the arpeggio toggle moved the hand, ${held[false]} to ${held[true]}`);
          }
          if (arpToggle.checked) arpToggle.click();
        }
      });
    });
    setMethod('box');
    t.equal(bad.join('; '), '', 'The position holds while the chord in front changes');
  }

  // ---- what the neck is showing, as a string and back again ----
  // The practice tab's link carries the view in one field, so that a bookmark
  // holds what you were actually looking at — the third box of the A-shape
  // pentatonic, coloured by interval — and not merely the key you were in.
  // Two things have to hold. A setting left at its default writes nothing, or
  // every link carries a dozen fields nobody needs. And applying a state has
  // to set everything, not only what the string mentions: a link should land
  // the same way on a fresh page as on one somebody has been playing with,
  // which means the fields it leaves out are defaults rather than "don't
  // touch".
  function testTheViewTravelsAsAString(t){
    const view = GT.fretboardView;
    const bad = [];
    const active = group => {
      const b = document.querySelector(`#${group} .seg-btn.active`);
      return b && b.dataset.value;
    };
    const seg = (group, value) => document.querySelector(`#${group} .seg-btn[data-value="${value}"]`).click();

    view.applyViewState('');
    if (view.viewState() !== ''){
      bad.push(`the defaults write "${view.viewState()}" rather than nothing`);
    }

    // somewhere worth bookmarking: the pentatonic over all positions, by interval
    seg('fretModeGroup', 'penta');
    seg('viewGroup', 'neck');
    seg('colorByGroup', 'interval');
    const there = view.viewState();
    ['m:penta', 'p:neck', 'c:interval'].forEach(part => {
      if (there.indexOf(part) < 0) bad.push(`"${part}" went missing from "${there}"`);
    });

    // wander off, then follow the string back
    seg('fretModeGroup', 'caged');
    seg('viewGroup', 'position');
    seg('colorByGroup', 'shape');
    view.applyViewState(there);
    if (active('fretModeGroup') !== 'penta') bad.push(`the view came back as ${active('fretModeGroup')}`);
    if (active('viewGroup') !== 'neck') bad.push(`the reading came back as ${active('viewGroup')}`);
    if (active('colorByGroup') !== 'interval') bad.push(`the colouring came back as ${active('colorByGroup')}`);
    if (view.viewState() !== there) bad.push(`the round trip wrote "${view.viewState()}" for "${there}"`);

    // a string that mentions one thing still puts everything else back
    view.applyViewState('c:interval');
    if (active('fretModeGroup') !== 'caged' || active('viewGroup') !== 'position'){
      bad.push('a link that named only the colouring left the rest where it was');
    }
    if (active('colorByGroup') !== 'interval') bad.push('...and did not even set the colouring');

    view.applyViewState('');     // leave the neck as it was found
    t.equal(bad.join('; '), '', 'The neck travels as a string, defaults and all');
  }

  GT.fretboardSuites = [
    ['Fretboard: chords are drawn as shapes you can hold', testGripsAreGrips],
    ['Fretboard: the view travels as a string', testTheViewTravelsAsAString],
    ['Fretboard: whole arpeggio opens the shapes out', testArpeggioReallyOpensOut],
    ['Fretboard: triads are drawn whole', testTriadsAreWhole],
    ['Fretboard: the progression is all there, in both views', testEveryChordIsDrawn],
    ['Fretboard: the legend matches the neck', testLegendMatchesTheNeck],
    ['Fretboard: shared notes know their colours', testSharedNotesCarryEveryColour],
    ['Fretboard: the hand stays put while a progression plays', testPositionHoldsStillWhilePlaying],
    ['Fretboard: a chord previewed is the chord you get', testPreviewMatchesArrival],
    ['Fretboard: one position narrows the neck', testPositionNarrows],
    ['Fretboard: every position method draws alike', testPositionMethodsRenderAlike],
    ['Fretboard: every box named is a box you can reach', testEveryBoxNamedCanBeReached],
    ['Fretboard: every colour comes from a box the note is in', testEveryColourComesFromItsBox],
    ['Fretboard: a shape switched off leaves the view', testDisabledShapesLeaveTheView],
    ['Fretboard: each reading keeps its own shapes', testEachReadingKeepsItsOwnShapes],
    ['Fretboard: the shapes follow you between views', testShapesCarryBetweenViews],
    ['Fretboard: the reading is named for what it shows', testTheReadingIsNamedForWhatItShows],
    ['Fretboard: One box goes when it cannot hold the progression', testOneBoxGoesWhenItCannotHold],
    ['Fretboard: a bar in the chart picks its chord', testChartClickPicksTheChord],
    ['Fretboard: the position is published, not printed', testThePositionIsPublishedForTheWindow],
    ['Fretboard: the position holds while the chord changes', testThePositionHoldsWhileTheChordChanges],
  ];
})();
