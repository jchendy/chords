// Draws a neck as SVG from a set of markers and shape outlines. Shared by the
// jam tab's fretboard, the chord finder's CAGED overview and the reverse
// chord finder, so all three look the same.
//
// A neck can show all 15 frets or a stretch of them. `geometry(from, to)`
// returns a drawing kit for that stretch — the frets keep their width, so a
// shorter neck means a narrower viewBox and, in the same space on screen,
// bigger dots. The module's own exports are the full-neck kit, which is what
// the other two tabs use.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { STRING_LABELS, FRET_COUNT } = GT.fretboard;

  // The strings sit closer together than the frets are wide — near enough the
  // proportions of the real thing that a grip drawn on it reads as a grip.
  // H follows from the string gap: the padding is the room the fret numbers
  // and the string names need.
  const ROW_H = 19;
  const padL = 44, padR = 12, padT = 14, padB = 22;
  const H = padT + padB + 5 * ROW_H;
  const nutX = padL + 12;
  // A fret is close to twice as wide as the gap between two strings, which is
  // roughly the shape of the real thing — a fret square enough to be mistaken
  // for a grid cell is harder to read a shape off. The neck that comes out is
  // wide, so a full one wants most of a laptop's width; see maxWidth below.
  const CELL_W = 36;                                 // one fret, at full-neck scale
  // Where a note sits inside its fret. A finger goes just behind the wire
  // rather than in the middle of the gap, and putting the dots there says
  // which fret is which without having to count the wires. Close enough that
  // roughly three units of the fret are left beyond the dot's edge.
  const DOT_AT = 0.705;
  const rowH = ROW_H;

  const INLAYS = [3, 5, 7, 9, 15];
  const FRET_NUMS = [3, 5, 7, 9, 12, 15];

  function geometry(from = 0, to = FRET_COUNT){
    from = Math.max(0, Math.min(FRET_COUNT - 1, Math.round(from)));
    to = Math.max(from + 1, Math.min(FRET_COUNT, Math.round(to)));
    const startFret = from === 0 ? 1 : from;          // first fret with a cell
    const openColumn = from === 0;                     // room for open strings + nut
    const W = nutX + (to - startFret + 1) * CELL_W + padR;

    const stringY = s => padT + s * rowH;
    const wireX = f => nutX + (f - startFret + 1) * CELL_W;
    // where a note is drawn — behind the wire, where the finger goes
    const fretX = f => f === 0 ? nutX - 11 : nutX + (f - startFret + DOT_AT) * CELL_W;
    // ...and the middle of the fret, which is where an inlay is set and where
    // the fret's own number belongs
    const cellX = f => nutX + (f - startFret + 0.5) * CELL_W;
    const inRange = f => f === 0 ? openColumn : (f >= startFret && f <= to);

    // strings, nut, fret wires, inlays and fret numbers — the empty neck
    function board(){
      const els = [];
      for (let s = 0; s < 6; s++){
        els.push(`<line class="fret-string" x1="${nutX}" y1="${stringY(s)}" x2="${W - padR}" y2="${stringY(s)}"/>`);
        els.push(`<text class="string-label" x="${padL - 10}" y="${stringY(s) + 3}" text-anchor="end">${STRING_LABELS[s]}</text>`);
      }
      // the nut, or — starting up the neck — a plain edge where it's cut off
      els.push(`<line class="${openColumn ? 'fret-nut' : 'fret-wire'}" x1="${nutX}" y1="${stringY(0)}" x2="${nutX}" y2="${stringY(5)}"/>`);
      for (let f = startFret; f <= to; f++){
        els.push(`<line class="fret-wire" x1="${wireX(f)}" y1="${stringY(0)}" x2="${wireX(f)}" y2="${stringY(5)}"/>`);
      }
      INLAYS.filter(inRange).forEach(f =>
        els.push(`<circle class="fret-inlay" cx="${cellX(f)}" cy="${padT + 2.5 * rowH}" r="3.6"/>`));
      if (inRange(12)){
        els.push(`<circle class="fret-inlay" cx="${cellX(12)}" cy="${padT + 1.5 * rowH}" r="3.6"/>`);
        els.push(`<circle class="fret-inlay" cx="${cellX(12)}" cy="${padT + 3.5 * rowH}" r="3.6"/>`);
      }
      // zoomed in, the first fret is numbered too — otherwise there's nothing
      // to say where on the neck you are
      const nums = FRET_NUMS.filter(inRange);
      if (!openColumn && !nums.includes(startFret)) nums.unshift(startFret);
      nums.forEach(f =>
        els.push(`<text class="fret-num" x="${cellX(f)}" y="${H - 6}" text-anchor="middle">${f}</text>`));
      return els;
    }

    // Markers carry optional extras the jam tab uses for its spotlight and
    // follow-playback highlighting; a plain diagram can leave them off.
    // Anything outside this neck's frets is simply not drawn.
    function buildSVG(markers, lines){
      const els = board();

      lines.filter(ln => ln.cells.every(c => inRange(c.fret))).forEach(ln => {
        const pts = ln.cells.map(c => `${fretX(c.fret)},${stringY(c.string)}`).join(' ');
        const letter = ln.letter ? ` data-shape-letter="${ln.letter}"` : '';
        const ghostCls = (ln.ghost ? ' ghost' : '') + (ln.ghostNext ? ' ghost-next' : '');
        els.push(`<polyline class="shape-line${ghostCls}" data-shape="${ln.shape || ''}"${letter} points="${pts}" stroke="${ln.color}"/>`);
      });

      markers.filter(m => inRange(m.fret)).forEach(m => {
        // Small enough that two on neighboring strings stay two dots, and no
        // smaller than the label it carries — a longer one ("♭3") is set a
        // size down to fit rather than the dot being grown to hold it.
        // A single character is set as large as the dot will hold: the widest
        // of them ("A") measures 5.55 from the middle to the corner of its
        // ink at 11, against the 6.2 where a root's ring starts.
        const cx = fretX(m.fret), cy = stringY(m.string), r = 7.5;
        const fs = (m.label && m.label.length > 1) ? 7.5 : 11;
        const shapeAttr = (m.shapes && m.shapes.length) ? ` data-shapes="${m.shapes.join(',')}"` : '';
        const rootPcAttr = m.pc !== undefined ? ` data-rootpc="${m.pc}"` : '';
        // a cell shared by two chords reads as a different degree for each —
        // keep every chord's own label so spotlighting/following one can
        // show the right one instead of whichever happened to render first
        const labelEntries = m.labelsByTag ? Object.entries(m.labelsByTag) : [];
        const labelsAttr = labelEntries.length > 1
          ? ` data-labels="${labelEntries.map(([t, l]) => `${t}:${l}`).join(',')}" data-default-label="${m.label || ''}"`
          : '';
        // `hollow` marks a note outside the triad (the 7th); `passing` a scale
        // note that isn't a chord tone, drawn quieter so the chord tones stand out
        const fills = m.hollow ? [m.color || (m.split && m.split[0])]
          : m.split ? m.split : [m.color];
        const colorsAttr = m.colorsByTag
          ? ` data-colors="${Object.entries(m.colorsByTag).map(([t, c]) => `${t}:${c}`).join(',')}"` +
            ` data-default-color="${fills.join(',')}"`
          : '';
        const extraClass = (m.hollow ? ' hollow' : '') + (m.passing ? ' passing' : '')
          + (m.ghost ? ' ghost' : '') + (m.ghostNext ? ' ghost-next' : '');
        // where it is, so a part playing through the box can light it as it goes
        const whereAttr = ` data-string="${m.string}" data-fret="${m.fret}"`;
        let g = `<g class="note-dot${extraClass}"${whereAttr}${shapeAttr}${rootPcAttr}${labelsAttr}${colorsAttr}>`;
        if (m.hollow){
          const stroke = m.color || (m.split && m.split[0]);
          g += `<circle cx="${cx}" cy="${cy}" r="${r - 1.2}" fill="var(--panel)" stroke="${stroke}" stroke-width="2.4"/>`;
        } else if (m.split){
          // left half = left shape's color, right half = right shape's color
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

    return {
      buildSVG, board, fretX, stringY, inRange,
      viewBox: `0 0 ${W} ${H}`,
      // Keep the drawing about this tall on screen whatever the zoom: a
      // narrower neck scaled to the full width would tower over the page.
      maxWidth: Math.min(1020, Math.round(W * 1.9)),
      // ...and a short neck doesn't need the full neck's floor, which would
      // only force a phone to scroll sideways for no reason
      minWidth: Math.min(500, Math.round(W * 0.9)),
      from, to, width: W,
    };
  }

  // the full neck, for callers that don't zoom
  const full = geometry();

  GT.neck = {
    geometry,
    buildSVG: full.buildSVG, board: full.board, fretX: full.fretX, stringY: full.stringY,
    viewBox: full.viewBox,
  };
})();
