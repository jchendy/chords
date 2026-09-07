// Reverse chord finder tab: click notes on a fretboard, get back every chord
// name those notes could go by. The neck itself comes from neck.js, so it
// matches the practice tab's; this file only adds the click targets.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { NOTE_NAMES_SHARP, identifyChords } = GT.theory;
  const { STRING_TUNING, FRET_COUNT } = GT.fretboard;
  const { board, fretX, stringY } = GT.neck;

  const reverseFretboardSvg = document.getElementById('reverseFretboard');
  const reverseMatchesEl = document.getElementById('reverseMatches');
  const reverseSelectedNotesEl = document.getElementById('reverseSelectedNotes');
  const reverseClearBtn = document.getElementById('reverseClearBtn');
  let reverseSelection = new Array(6).fill(null);   // per string: fret number or null (muted)

  function renderReverseFretboard(){
    // the same empty neck the practice tab draws, from the same code
    const els = board();

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

  // hear the notes you've picked, strummed low to high
  document.getElementById('reversePlayBtn').addEventListener('click', () => {
    const cells = reverseSelection.map((f, s) => f === null ? null : { string: s, fret: f }).filter(Boolean);
    if (cells.length) GT.chordFinder.strum(cells);
  });

  GT.reverseFinder = {
    init(){ renderReverseFretboard(); updateReverseMatches(); },
    refresh(){ renderReverseFretboard(); },
  };
})();
