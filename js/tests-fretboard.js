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
    viewGroup: ['neck', 'position'],
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
  // except the shapes, which are independent toggles, and which open on all
  // five because the view starts across the neck — in one position it's A, E
  // and D, and the buttons are repainted when the reading changes.
  const SEG_ACTIVE = { cagedShapeGroup: ['C', 'A', 'G', 'E', 'D'] };
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
              const w = (q('#cagedLegend').textContent.match(/position: frets (\d+)[–-](\d+)/) || []).slice(1);
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
              : !legend.some(x => x.startsWith('position: frets')) ? 'has no fret readout'
              : legend.length - 1 < new Set(names).size ? 'leaves a chord out of the legend'
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
  // Every run the legend draws should be a position you can reach: count them.
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
      const runs = [...q('#cagedLegend').querySelectorAll('.range')]
        .reduce((n, el) => n + el.textContent.split('·').length, 0);
      // walk the stepper right round and collect the distinct windows it lands on
      setView('position');
      setShapes(all);
      const seen = new Set();
      for (let i = 0; i < 16; i++){
        const last = [...q('#cagedLegend').querySelectorAll('span')].pop();
        seen.add(last.textContent.trim());
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

  GT.fretboardSuites = [
    ['Fretboard: chords are drawn as shapes you can hold', testGripsAreGrips],
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
    ['Fretboard: One box goes when it cannot hold the progression', testOneBoxGoesWhenItCannotHold],
  ];
})();
