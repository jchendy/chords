// Draws a full 15-fret neck as SVG from a set of markers and shape outlines.
// Shared by the practice tab's fretboard and the chord finder's CAGED overview
// so the two always look the same.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { STRING_LABELS, FRET_COUNT } = GT.fretboard;

  const W = 520, H = 156;
  const padL = 44, padR = 12, padT = 14, padB = 22;
  const nutX = padL + 12;
  const cellW = (W - nutX - padR) / FRET_COUNT;
  const rowH = (H - padT - padB) / 5;

  const stringY = s => padT + s * rowH;
  const wireX = f => nutX + f * cellW;
  const fretX = f => f === 0 ? nutX - 11 : nutX + (f - 0.5) * cellW;

  const viewBox = `0 0 ${W} ${H}`;

  // strings, nut, fret wires, inlays and fret numbers — the empty neck
  function board(){
    const els = [];
    for (let s = 0; s < 6; s++){
      els.push(`<line class="fret-string" x1="${nutX}" y1="${stringY(s)}" x2="${W - padR}" y2="${stringY(s)}"/>`);
      els.push(`<text class="string-label" x="${padL - 10}" y="${stringY(s) + 3}" text-anchor="end">${STRING_LABELS[s]}</text>`);
    }
    els.push(`<line class="fret-nut" x1="${nutX}" y1="${stringY(0)}" x2="${nutX}" y2="${stringY(5)}"/>`);
    for (let f = 1; f <= FRET_COUNT; f++){
      els.push(`<line class="fret-wire" x1="${wireX(f)}" y1="${stringY(0)}" x2="${wireX(f)}" y2="${stringY(5)}"/>`);
    }
    [3, 5, 7, 9, 15].forEach(f =>
      els.push(`<circle class="fret-inlay" cx="${fretX(f)}" cy="${padT + 2.5 * rowH}" r="3.6"/>`));
    els.push(`<circle class="fret-inlay" cx="${fretX(12)}" cy="${padT + 1.5 * rowH}" r="3.6"/>`);
    els.push(`<circle class="fret-inlay" cx="${fretX(12)}" cy="${padT + 3.5 * rowH}" r="3.6"/>`);
    [3, 5, 7, 9, 12, 15].forEach(f =>
      els.push(`<text class="fret-num" x="${fretX(f)}" y="${H - 6}" text-anchor="middle">${f}</text>`));
    return els;
  }

  // Markers carry optional extras the practice tab uses for its spotlight and
  // follow-playback highlighting; a plain diagram can leave them off.
  function buildSVG(markers, lines){
    const els = board();

    lines.forEach(ln => {
      const pts = ln.cells.map(c => `${fretX(c.fret)},${stringY(c.string)}`).join(' ');
      els.push(`<polyline class="shape-line" data-shape="${ln.shape || ''}" points="${pts}" stroke="${ln.color}"/>`);
    });

    markers.forEach(m => {
      const cx = fretX(m.fret), cy = stringY(m.string), r = 9.5;
      const fs = (m.label && m.label.length > 1) ? 10.5 : 13;
      const shapeAttr = (m.shapes && m.shapes.length) ? ` data-shapes="${m.shapes.join(',')}"` : '';
      const rootPcAttr = m.pc !== undefined ? ` data-rootpc="${m.pc}"` : '';
      const rootForAttr = (m.rootShapes && m.rootShapes.length) ? ` data-rootfor="${m.rootShapes.join(',')}"` : '';
      // a cell shared by two chords reads as a different degree for each —
      // keep every chord's own label so spotlighting/following one can
      // show the right one instead of whichever happened to render first
      const labelEntries = m.labelsByTag ? Object.entries(m.labelsByTag) : [];
      const labelsAttr = labelEntries.length > 1
        ? ` data-labels="${labelEntries.map(([t, l]) => `${t}:${l}`).join(',')}" data-default-label="${m.label || ''}"`
        : '';
      const posRootClass = m.isLowestRoot ? ' pos-root' : '';
      let g = `<g class="note-dot${posRootClass}"${shapeAttr}${rootPcAttr}${rootForAttr}${labelsAttr}>`;
      if (m.split){
        // left half = left shape's colour, right half = right shape's colour
        g += `<path d="M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z" fill="${m.split[0]}"/>`;
        g += `<path d="M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} Z" fill="${m.split[1]}"/>`;
      } else {
        g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${m.color}"/>`;
      }
      if (m.isRoot) g += `<circle class="dot-ring" cx="${cx}" cy="${cy}" r="${r}" fill="none"/>`;
      if (m.label) g += `<text x="${cx}" y="${cy + fs * 0.34}" font-size="${fs}" text-anchor="middle">${m.label}</text>`;
      g += '</g>';
      els.push(g);
    });

    return els.join('');
  }

  // `board` and the two coordinate helpers are shared with the reverse chord
  // finder, which draws its own click targets on the same empty neck
  GT.neck = { buildSVG, board, fretX, stringY, viewBox };
})();
