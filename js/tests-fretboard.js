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
  // the view greys a checkbox out by reaching for the label wrapping it
  ['cagedFollowToggle', 'holdPositionToggle', 'wholeArpeggioToggle'].forEach(id => {
    const label = document.createElement('label');
    label.className = 'inline-check';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = id;
    if (id === 'cagedFollowToggle') box.checked = true;
    label.appendChild(box);
    root.appendChild(label);
  });
  Object.entries(SEG).forEach(([id, values]) => {
    const group = document.createElement('div');
    group.id = id;
    group.className = 'segmented';
    values.forEach((v, i) => {
      const b = document.createElement('button');
      b.className = 'seg-btn' + (i === 0 ? ' active' : '');
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
  ];
})();
