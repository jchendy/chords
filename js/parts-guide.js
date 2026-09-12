// The parts guide: every part in the library, written out over a progression
// that suits its style, with what the rhythm and the notes are made of, who
// the idiom comes from, and a Play button. A page of its own, so the machinery
// can be read end to end: parts.js realises, tab.js draws, audio.js plays —
// this file only wires them to a page and keeps a small player of its own,
// since the jam tab's scheduler is wound round that tab's controls.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, displayName, SEMITONE } = GT.theory;
  const { SIMPLE_FEEL, partsFor, realise } = GT.parts;
  const { GUIDE } = GT.partsGuide;
  const audio = GT.audio;
  const { STYLES } = audio;

  const $ = id => document.getElementById(id);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  // ---- which feels, in the order the app lists them ----
  const FEELS = [{ style: 'simple', feel: SIMPLE_FEEL }];
  Object.keys(STYLES).forEach(style => STYLES[style].variants.forEach(v => FEELS.push({ style, feel: v })));
  const guideFor = (style, feel) => GUIDE[`${style}/${feel.label}`] || (GUIDE[style] && GUIDE[style].feel === feel.label ? GUIDE[style] : null);

  // ---- the reading the parts are shown in ----
  // A part is realised into what the neck's reading offers, so the same
  // part reads three ways; the guide lets you switch between them.
  let reading = 'scale';
  let techOn = true;

  const { windowFor, drawTab, play, stop, seekable } = GT.examplePlayer;
  const playing = () => GT.examplePlayer.playing();

  // The progression as the jam tab would hold it: chord objects with
  // numerals against the key.
  function chordsOf(entry){
    const tonicPc = SEMITONE[entry.key] % 12;
    return entry.progression.map(name => chordFromName(name, tonicPc, 'major'));
  }

  function realiseFor(style, feel, part, entry, blend){
    const chords = chordsOf(entry);
    const bars = chords.map(chord => ({ chord }));
    const opts = {
      reading, window: windowFor(entry.key), scaleTheory: 'parallel', stringSet: 2,
      stayOnKey: false, key: { tonic: entry.key, mode: 'major' },
      tech: techOn ? null : { double: false, bend: false, hammer: false, pull: false, slide: false },
    };
    // one seed, so the page reads the same each time; `blend` is the card's
    // own choice for a part with lead lines
    return { chords, notes: realise(part, bars, 1, opts, { grid: feel.grid, blend }) };
  }

  // ---- the page ----
  function render(){
    const main = $('guide');
    main.innerHTML = '';
    const missing = [];
    FEELS.forEach(({ style, feel }) => {
      const entry = guideFor(style, feel);
      const parts = partsFor(style, feel.label);
      if (!entry){ missing.push(`${style}/${feel.label}`); return; }
      const sec = document.createElement('section');
      sec.className = 'style';
      sec.id = `s-${style}-${feel.label.replace(/\W+/g, '-').toLowerCase()}`;
      const chords = chordsOf(entry);
      sec.innerHTML = `
        <h2>${feel.label}</h2>
        <p class="meta"><span>${entry.progression.join(' · ')}</span><span>in ${entry.key}</span><span>${entry.tempo} BPM</span><span>${feel.grid === 12 ? 'twelve to the bar — swung, or 12/8' : 'sixteen to the bar — straight'}</span></p>
        <p class="about">${entry.about}</p>
        <p class="influences"><b>Where it comes from.</b> ${entry.influences}</p>
        <div class="parts"></div>`;
      const holder = sec.querySelector('.parts');
      parts.forEach(part => {
        const blurb = entry.parts[part.name];
        if (!blurb) missing.push(`${style}/${feel.label}/${part.name}`);
        const card = document.createElement('article');
        card.className = 'part';
        // a part written with lead lines can be heard as comping alone, as a
        // lead pass, or both — the same three ways the jam tab offers
        const blends = GT.parts.hasLeads(part)
          ? `<span class="seg blend" role="group" aria-label="Rhythm or lead" title="Comping alone, a lead pass, or both: the lead lines in about half the fill bars">${GT.parts.BLENDS.map(b => `<button type="button" data-value="${b}"${b === 'mixed' ? ' class="active"' : ''}>${b[0].toUpperCase() + b.slice(1)}</button>`).join('')}</span>`
          : '';
        card.innerHTML = `
          <div class="part-head">
            <h3>${part.name}</h3>
            <span class="part-btns">${blends}<button type="button" class="play">Play</button></span>
          </div>
          <p class="blurb">${blurb || ''}</p>
          <p class="legend">Bars: figure · fill 1 · variant 1 · fill 2 · variant 2 · fill 3</p>
          <div class="tab"></div>`;
        holder.appendChild(card);
        const tabHost = card.querySelector('.tab');
        let state = null, blend = 'mixed';
        const build = () => {
          const { chords: cs, notes } = realiseFor(style, feel, part, entry, blend);
          const metrics = drawTab(tabHost, feel, cs, notes);
          state = { chords: cs, notes, metrics };
        };
        build();
        card.querySelector('.play').addEventListener('click', () => {
          if (playing() && playing().card === card){ stop(); return; }
          play(card, style, feel, state.chords, state.notes, entry.tempo, state.metrics);
        });
        card.rebuild = () => { const was = playing() && playing().card === card; if (was) stop(); build(); };
        seekable(card, () => ({ feel, chords: state.chords, notes: state.notes, metrics: state.metrics }));
        const blendEl = card.querySelector('.blend');
        if (blendEl) blendEl.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          blend = b.dataset.value;
          blendEl.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
          card.rebuild();
        });
      });
      main.appendChild(sec);
    });
    $('missing').hidden = !missing.length;
    $('missing').textContent = missing.length ? `No guide text for: ${missing.join(', ')}` : '';
    // the contents list
    $('toc').innerHTML = FEELS.map(({ style, feel }) => {
      const id = `s-${style}-${feel.label.replace(/\W+/g, '-').toLowerCase()}`;
      return `<a href="#${id}">${feel.label}</a>`;
    }).join('');
  }

  function rebuildAll(){ document.querySelectorAll('.part').forEach(c => c.rebuild && c.rebuild()); }

  document.querySelectorAll('#readingGroup button').forEach(b => b.addEventListener('click', () => {
    reading = b.dataset.value;
    document.querySelectorAll('#readingGroup button').forEach(x => x.classList.toggle('active', x === b));
    rebuildAll();
  }));
  $('techToggle').addEventListener('change', () => { techOn = $('techToggle').checked; rebuildAll(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/input|select|textarea/i.test(e.target.tagName)){ e.preventDefault(); if (playing()) stop(); } });

  render();
  // redrawn when the width changes — the tab is built to it — and not on a
  // resize event that changed nothing, since a redraw stops what's playing
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; rebuildAll(); } }, 200);
  });

  GT.partsGuideView = { FEELS, guideFor, realiseFor, stop };
})();
