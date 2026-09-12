// Draws guitar tablature: six string lines with fret numbers laid out in time,
// bar lines, chord names above, and a playhead that can be moved while it
// plays. Takes the same note list the player reads, so the tab always shows
// exactly what you hear.
//
// Long examples wrap onto as many rows as they need, the way printed notation
// does, breaking only at bar lines so no bar is ever split across rows.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const { STRING_LABELS } = GT.fretboard;

  const SLOT_W = 22;        // preferred horizontal space per grid slot
  const MIN_SLOT_W = 11;    // ...and how tight it may get before we give up and scroll
  const ROW_H = 15;         // between string lines
  const PAD_L = 26, PAD_R = 14;
  const ROW_TOP = 26;       // room above each row for the chord names
  const ROW_GAP = 22;       // between one row of six strings and the next

  // Work out how the example divides into rows for the width available.
  function measure(example, availableWidth){
    const grid = example.grid;
    const barCount = example.bars.length;
    const usable = Math.max(120, (availableWidth || 640) - PAD_L - PAD_R);

    // shrink the slots a little rather than wrap to silly narrow rows
    let slotW = SLOT_W;
    if (grid * slotW > usable) slotW = Math.max(MIN_SLOT_W, Math.floor(usable / grid));

    const barW = grid * slotW;
    const barsPerRow = Math.max(1, Math.min(barCount, Math.floor(usable / barW)));
    const rows = Math.ceil(barCount / barsPerRow);
    const rowSpan = ROW_TOP + 5 * ROW_H + ROW_GAP;

    return {
      grid, slotW, barW, barsPerRow, rows, rowSpan, barCount,
      width: PAD_L + Math.min(barCount, barsPerRow) * barW + PAD_R,
      height: rows * rowSpan,
    };
  }

  // where a (possibly fractional) slot sits, once the example is laid out
  function positionOf(slot, m){
    const bar = Math.floor(slot / m.grid);
    const row = Math.min(m.rows - 1, Math.floor(bar / m.barsPerRow));
    const barInRow = bar - row * m.barsPerRow;
    const withinBar = slot - bar * m.grid;
    return {
      row,
      x: PAD_L + (barInRow * m.grid + withinBar) * m.slotW,
      top: row * m.rowSpan + ROW_TOP,
    };
  }

  const stringY = (top, s) => top + s * ROW_H;

  function build(example, availableWidth){
    const m = measure(example, availableWidth);
    const els = [];

    // one set of six strings per row, only as wide as that row's bars
    for (let row = 0; row < m.rows; row++){
      const top = row * m.rowSpan + ROW_TOP;
      const barsHere = Math.min(m.barsPerRow, m.barCount - row * m.barsPerRow);
      const right = PAD_L + barsHere * m.barW;
      for (let s = 0; s < 6; s++){
        els.push(`<line class="tab-string" x1="${PAD_L}" y1="${stringY(top, s)}" x2="${right}" y2="${stringY(top, s)}"/>`);
        els.push(`<text class="tab-label" x="${PAD_L - 8}" y="${stringY(top, s) + 3.5}" text-anchor="end">${STRING_LABELS[s]}</text>`);
      }
      // closing bar line for the row
      els.push(`<line class="tab-bar" x1="${right}" y1="${stringY(top, 0)}" x2="${right}" y2="${stringY(top, 5)}"/>`);
    }

    // a bar line at the start of every bar, with its chord above
    example.bars.forEach((bar, i) => {
      const p = positionOf(bar.startSlot, m);
      els.push(`<line class="tab-bar" x1="${p.x}" y1="${stringY(p.top, 0)}" x2="${p.x}" y2="${stringY(p.top, 5)}"/>`);
      // a name only where the caller gave one, tagged with its bar: a bar
      // that carries a chord through has no name of its own, so whoever
      // lights the name for a bar looks for the nearest one at or before it
      if (bar.chord){
        els.push(`<text class="tab-chord" data-bar="${i}" x="${p.x + 4}" y="${p.top - 12}">${bar.chord}</text>`);
        // the Nashville numeral after the name, quieter, when the caller has
        // one — a tab drawn without a key passes none
        if (bar.numeral){
          const dx = 4 + bar.chord.length * 7.2 + 5;
          els.push(`<text class="tab-numeral" x="${p.x + dx}" y="${p.top - 12}">${bar.numeral}</text>`);
        }
      }
    });

    // fret numbers, tagged with their slot so the playhead can light them
    // up — and the techniques written the way tab writes them: a slide as
    // "3/5" (or "7\\5" coming down), a bend as the fret with "b" and how far
    // ("½" a semitone, "1" a tone), a hammer-on or pull-off as "h" or "p"
    // between the two frets, and a palm mute as "x" over the number
    example.notes.forEach(n => {
      const p = positionOf(n.at, m);
      const x = p.x + m.slotW / 2, y = stringY(p.top, n.string);
      let label = String(n.fret);
      if (n.slide != null) label = `${n.slide}${n.slide < n.fret ? '/' : '\\'}${n.fret}`;
      if (n.bend) label = `${n.fret}b${n.bend === 1 ? '½' : n.bend === 2 ? '1' : n.bend}`;
      const w = 8 + label.length * 6;
      const cls = ['tab-note', n.tone === 'muted' || n.mute ? 'muted' : '', n.soft ? 'soft' : ''].filter(Boolean).join(' ');
      els.push(`<g class="${cls}" data-slot="${n.at}">
        <rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" rx="2"/>
        <text x="${x}" y="${y + 3.5}" text-anchor="middle">${label}</text>
      </g>`);
      // one "x" a strum, over its lowest string, not one a string; a ghost
      // note the same, dim; vibrato as "~", tremolo picking as "≡", a rake
      // as "r" before the number
      if (n.mute && n.lead !== false) els.push(`<text class="tab-tech" x="${x}" y="${y - 7}" text-anchor="middle">x</text>`);
      else if (n.vib) els.push(`<text class="tab-tech" x="${x}" y="${y - 7}" text-anchor="middle">~</text>`);
      else if (n.trem) els.push(`<text class="tab-tech" x="${x}" y="${y - 7}" text-anchor="middle">≡</text>`);
      if (n.rake) els.push(`<text class="tab-tech" x="${x - w / 2 - 4}" y="${y + 3.5}" text-anchor="middle">r</text>`);
      if (n.tech === 'h' || n.tech === 'p'){
        // the letter sits over the gap to the note it leads to, which the
        // realisation put half this note's length later
        const q = positionOf(n.at + n.dur, m);
        const x2 = q.x + m.slotW / 2;
        const mid = q.top === p.top ? (x + x2) / 2 : x + m.slotW / 2;
        els.push(`<text class="tab-tech" x="${mid}" y="${y - 7}" text-anchor="middle">${n.tech}</text>`);
      }
    });

    els.push(`<rect class="tab-playhead" x="${PAD_L}" y="${ROW_TOP - 8}" width="${m.slotW}" height="${5 * ROW_H + 16}" rx="3" hidden/>`);

    return {
      markup: els.join(''),
      width: m.width,
      height: m.height,
      viewBox: `0 0 ${m.width} ${m.height}`,
      metrics: m,
    };
  }

  // where to park the playhead for a given slot — x, and the top of its row
  function playheadPos(slot, m){
    const p = positionOf(slot, m);
    return { x: p.x, y: p.top - 8 };
  }

  GT.tab = { build, playheadPos, SLOT_W };
})();
