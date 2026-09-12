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

  const SLOT_W = 24;        // preferred horizontal space per grid slot
  const MIN_SLOT_W = 12;    // ...and how tight it may get before we give up and scroll
  const ROW_H = 17;         // between string lines
  const PAD_L = 26, PAD_R = 14;
  const ROW_TOP = 28;       // room above each row for the chord names
  const ROW_GAP = 18;       // between one row's rhythm and the next row's names
  // the rhythm under each row: stems hanging from a line below the sixth
  // string, flagged, beamed and dotted the way notation writes them
  const RHYTHM_TOP = 12;    // from the sixth string to the stems' base
  const STEM_H = 20;
  const RHYTHM_H = RHYTHM_TOP + STEM_H + 8;

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
    const rowSpan = ROW_TOP + 5 * ROW_H + RHYTHM_H + ROW_GAP;

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
      // the bar's number, small and italic, on the line's left — the way
      // printed tab counts its bars
      els.push(`<text class="tab-barnum" x="${p.x - 3}" y="${p.top - 13}" text-anchor="end">${i + 1}</text>`);
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
      const w = 9 + label.length * 6.6;
      const cls = ['tab-note', n.tone === 'muted' || n.mute ? 'muted' : '', n.soft ? 'soft' : ''].filter(Boolean).join(' ');
      els.push(`<g class="${cls}" data-slot="${Math.floor(n.at)}">
        <rect x="${x - w / 2}" y="${y - 6.5}" width="${w}" height="13" rx="2"/>
        <text x="${x}" y="${y + 3.8}" text-anchor="middle">${label}</text>
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

    els.push(...rhythm(example, m));
    els.push(`<rect class="tab-playhead" x="${PAD_L}" y="${ROW_TOP - 8}" width="${m.slotW}" height="${5 * ROW_H + RHYTHM_TOP + STEM_H + 12}" rx="3" hidden/>`);

    return {
      markup: els.join(''),
      width: m.width,
      height: m.height,
      viewBox: `0 0 ${m.width} ${m.height}`,
      metrics: m,
    };
  }

  // ---- the rhythm ----------------------------------------------------------
  // Every moment something is struck gets a stem under the strings, and the
  // stem says how long: bare for a quarter, a flag for an eighth, two for a
  // sixteenth, a dot for a dotted value, a hollow head for a half and a
  // whole. Eighths and shorter inside one beat are beamed together, a
  // sixteenth beside an eighth taking a stub of second beam. A sixteen-slot
  // bar is four beats of four sixteenths; a twelve-slot (or nine-slot) bar
  // is three eighths a beat, written the 12/8 way. What is written is the
  // time to the next strike, capped by the strike's own length: a ringing
  // arpeggio is sixteenths that happen to ring on, not a run of quarters,
  // and a note that stops short of the next leaves a rest, which is a gap.
  const SIMPLE = [[16, 'whole', 0], [12, 'half', 1], [8, 'half', 0], [6, 'quarter', 1], [4, 'quarter', 0],
                  [3, 'eighth', 1], [2, 'eighth', 0], [1.5, 'sixteenth', 1], [1, 'sixteenth', 0], [0.5, 'thirty', 0]];
  const COMPOUND = [[12, 'whole', 1], [6, 'half', 1], [4, 'half', 0], [3, 'quarter', 1], [2, 'quarter', 0],
                    [1, 'eighth', 0], [0.5, 'sixteenth', 0]];
  const FLAGS = { whole: 0, half: 0, quarter: 0, eighth: 1, sixteenth: 2, thirty: 3 };
  function valueOf(dur, grid){
    const simple = grid % 3 !== 0;                          // sixteen slots; twelve and nine are three a beat
    const units = simple ? dur * 16 / grid : dur;          // sixteenths, or eighths
    const table = simple ? SIMPLE : COMPOUND;
    const hit = table.find(([u]) => u <= units + 1e-6) || table[table.length - 1];
    return { kind: hit[1], dotted: !!hit[2], flags: FLAGS[hit[1]] };
  }
  // the moments a bar is struck: one stem per onset, however many strings
  function onsets(example){
    const byBar = new Map();
    example.notes.forEach(n => {
      const key = Math.round(n.at * 4) / 4;
      const bar = Math.floor(key / example.grid);
      const list = byBar.get(bar) || byBar.set(bar, new Map()).get(bar);
      const dur = Math.max(list.get(key) || 0, n.dur || 0);
      list.set(key, dur);
    });
    return byBar;
  }
  function rhythm(example, m){
    const els = [];
    const grid = example.grid;
    const perBeat = grid % 3 !== 0 ? 4 : 3;
    onsets(example).forEach((list, bar) => {
      const barEnd = (bar + 1) * grid;
      const struck = [...list.entries()].sort((a, b) => a[0] - b[0]);
      const hits = struck.map(([at, dur], i) => {
        const p = positionOf(at, m);
        const next = struck[i + 1] ? struck[i + 1][0] : barEnd;
        const v = valueOf(Math.min(dur, next - at, barEnd - at), grid);
        return { at, x: p.x + m.slotW / 2, y0: stringY(p.top, 5) + RHYTHM_TOP, ...v };
      });
      // beam groups: runs of flagged hits inside one beat
      const groups = [];
      let run = [];
      const flush = () => { if (run.length > 1) groups.push(run); run = []; };
      hits.forEach((h, i) => {
        const beat = Math.floor((h.at - bar * grid) / perBeat);
        const prev = hits[i - 1];
        if (!h.flags || (prev && (Math.floor((prev.at - bar * grid) / perBeat) !== beat || !prev.flags))) flush();
        if (h.flags) run.push(h); else run = [];
      });
      flush();
      const beamed = new Set(groups.flat());
      hits.forEach(h => {
        const y1 = h.y0 + STEM_H;
        // the long values take a hollow head, drawn the way notation draws
        // one: an oval leaning up to the right, the stem on its left side;
        // the whole note is the head alone
        const headed = h.kind === 'whole' || h.kind === 'half';
        if (headed){
          const cx = h.kind === 'half' ? h.x + 4 : h.x;
          els.push(`<ellipse class="tab-head" cx="${cx}" cy="${h.y0 + 2.5}" rx="4.4" ry="2.7" transform="rotate(-22 ${cx} ${h.y0 + 2.5})"/>`);
        }
        if (h.kind !== 'whole') els.push(`<line class="tab-stem" x1="${h.x}" y1="${h.y0 + (headed ? 2.5 : 0)}" x2="${h.x}" y2="${y1}"/>`);
        if (h.dotted) els.push(`<circle class="tab-dot" cx="${h.x + (h.kind === 'half' ? 12 : h.kind === 'whole' ? 8 : 5)}" cy="${h.y0 + 2.5}" r="1.5"/>`);
        if (h.flags && !beamed.has(h)){
          for (let f = 0; f < h.flags; f++){
            const y = y1 - f * 5;
            els.push(`<path class="tab-flag" d="M${h.x} ${y} c 1 -4 5 -5 6 -10"/>`);
          }
        }
      });
      groups.forEach(g => {
        const y1 = g[0].y0 + STEM_H;
        els.push(`<line class="tab-beam" x1="${g[0].x}" y1="${y1}" x2="${g[g.length - 1].x}" y2="${y1}"/>`);
        // the shorter values' extra beams: between neighbours that both have
        // them, else a stub toward the neighbour the note is beamed to
        const most = Math.max(...g.map(h => h.flags));
        for (let level = 2; level <= most; level++){
          const y = y1 - (level - 1) * 4.5;
          g.forEach((h, i) => {
            if (h.flags < level) return;
            const next = g[i + 1], prev = g[i - 1];
            if (next && next.flags >= level) els.push(`<line class="tab-beam" x1="${h.x}" y1="${y}" x2="${next.x}" y2="${y}"/>`);
            else if (!(prev && prev.flags >= level)){
              const dir = prev ? -1 : 1;
              els.push(`<line class="tab-beam" x1="${h.x}" y1="${y}" x2="${h.x + dir * 6}" y2="${y}"/>`);
            }
          });
        }
      });
    });
    return els;
  }

  // where to park the playhead for a given slot — x, and the top of its row
  function playheadPos(slot, m){
    const p = positionOf(slot, m);
    return { x: p.x, y: p.top - 8 };
  }

  GT.tab = { build, playheadPos, SLOT_W, valueOf, onsets };
})();
