// Reverse chord finder tab: click notes on a fretboard, get back every chord
// name those notes could go by.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { NOTE_NAMES_SHARP, identifyChords } = GT.theory;
  const { STRING_TUNING, STRING_LABELS, FRET_COUNT } = GT.fretboard;

  const reverseFretboardSvg = document.getElementById('reverseFretboard');
  const reverseMatchesEl = document.getElementById('reverseMatches');
  const reverseSelectedNotesEl = document.getElementById('reverseSelectedNotes');
  const reverseClearBtn = document.getElementById('reverseClearBtn');
  let reverseSelection = new Array(6).fill(null);   // per string: fret number or null (muted)

  function renderReverseFretboard(){
    const W = 520, H = 156;
    const padL = 44, padR = 12, padT = 14, padB = 22;
    const nutX = padL + 12;
    const cellW = (W - nutX - padR) / FRET_COUNT;
    const rowH = (H - padT - padB) / 5;
    const stringY = s => padT + s * rowH;
    const wireX = f => nutX + f * cellW;
    const fretX = f => f === 0 ? nutX - 11 : nutX + (f - 0.5) * cellW;

    const els = [];
    for (let s = 0; s < 6; s++){
      els.push(`<line class="fret-string" x1="${nutX}" y1="${stringY(s)}" x2="${W - padR}" y2="${stringY(s)}"/>`);
      els.push(`<text class="string-label" x="${padL - 10}" y="${stringY(s) + 3}" text-anchor="end">${STRING_LABELS[s]}</text>`);
    }
    els.push(`<line class="fret-nut" x1="${nutX}" y1="${stringY(0)}" x2="${nutX}" y2="${stringY(5)}"/>`);
    for (let f = 1; f <= FRET_COUNT; f++){
      els.push(`<line class="fret-wire" x1="${wireX(f)}" y1="${stringY(0)}" x2="${wireX(f)}" y2="${stringY(5)}"/>`);
    }
    [3, 5, 7, 9, 15].forEach(f => els.push(`<circle class="fret-inlay" cx="${fretX(f)}" cy="${padT + 2.5 * rowH}" r="3.6"/>`));
    els.push(`<circle class="fret-inlay" cx="${fretX(12)}" cy="${padT + 1.5 * rowH}" r="3.6"/>`);
    els.push(`<circle class="fret-inlay" cx="${fretX(12)}" cy="${padT + 3.5 * rowH}" r="3.6"/>`);
    [3, 5, 7, 9, 12, 15].forEach(f => els.push(`<text class="fret-num" x="${fretX(f)}" y="${H - 6}" text-anchor="middle">${f}</text>`));

    // one clickable target per string/fret intersection, plus fret 0 (open)
    for (let s = 0; s < 6; s++){
      for (let f = 0; f <= FRET_COUNT; f++){
        const cx = fretX(f), cy = stringY(s);
        const selected = reverseSelection[s] === f;
        els.push(`<g class="reverse-click-target${selected ? ' selected' : ''}" data-string="${s}" data-fret="${f}">
          <circle class="rct-hit" cx="${cx}" cy="${cy}" r="10"/>
          <circle class="rct-ring" cx="${cx}" cy="${cy}" r="7"/>
        </g>`);
      }
    }
    // Filled dots for the current selection, drawn last so they sit on top.
    // They ignore pointer events so a click still lands on the target beneath
    // and can toggle the note back off.
    reverseSelection.forEach((f, s) => {
      if (f === null) return;
      const cx = fretX(f), cy = stringY(s);
      const pc = (STRING_TUNING[s] + f) % 12;
      els.push(`<g class="reverse-selected-dot">
        <circle class="diagram-note" cx="${cx}" cy="${cy}" r="9"/>
        <text class="reverse-note-label" x="${cx}" y="${cy + 3.5}" text-anchor="middle">${NOTE_NAMES_SHARP[pc]}</text>
      </g>`);
    });

    reverseFretboardSvg.innerHTML = els.join('');
    reverseFretboardSvg.querySelectorAll('.reverse-click-target').forEach(g => {
      g.addEventListener('click', () => {
        const s = Number(g.dataset.string), f = Number(g.dataset.fret);
        reverseSelection[s] = reverseSelection[s] === f ? null : f;
        renderReverseFretboard();
        updateReverseMatches();
      });
    });
  }

  function updateReverseMatches(){
    const pcs = [...new Set(reverseSelection.map((f, s) => f === null ? null : (STRING_TUNING[s] + f) % 12).filter(v => v !== null))];

    if (!pcs.length){
      reverseSelectedNotesEl.textContent = 'Click frets on the neck below to select notes.';
      reverseMatchesEl.innerHTML = '';
      return;
    }
    reverseSelectedNotesEl.textContent = 'Selected notes: ' + pcs.map(pc => NOTE_NAMES_SHARP[pc]).join(', ');

    const matches = identifyChords(pcs);
    if (!matches.length){
      reverseMatchesEl.innerHTML = '<span class="diagram-empty">No standard chord name matches these notes yet.</span>';
      return;
    }
    const seenLabels = new Set();
    const labels = [];
    matches.forEach(m => {
      const label = NOTE_NAMES_SHARP[m.rootPc] + m.formula.name;
      if (seenLabels.has(label)) return;
      seenLabels.add(label);
      labels.push(label);
    });
    reverseMatchesEl.innerHTML = labels.map(l => `<span class="chord-match">${l}</span>`).join('');
  }

  reverseClearBtn.addEventListener('click', () => {
    reverseSelection = new Array(6).fill(null);
    renderReverseFretboard();
    updateReverseMatches();
  });

  GT.reverseFinder = {
    init(){ renderReverseFretboard(); updateReverseMatches(); },
    refresh(){ renderReverseFretboard(); },
  };
})();
