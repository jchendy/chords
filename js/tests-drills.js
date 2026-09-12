// Regression tests for the drills tab: what each kind of drill realises
// (the notes inside the shape, in the order the exercise wants), the state
// the link carries, and the page's controls. Like the other tab tests this
// builds the controls the module binds to, so it must load before
// js/drills.js.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const root = document.createElement('div');
  root.id = 'drills-fixture';
  root.hidden = true;
  const add = (tag, id, attrs = {}, parent = root) => {
    const el = document.createElement(tag);
    if (id) el.id = id;
    Object.entries(attrs).forEach(([k, v]) => { el[k] = v; });
    parent.appendChild(el);
    return el;
  };
  const seg = (id, values, active) => {
    const s = add('span', id); s.className = 'segmented';
    values.forEach(v => { const b = add('button', null, { type: 'button', textContent: String(v) }, s); b.className = 'seg-btn' + (String(v) === String(active) ? ' active' : ''); b.dataset.value = String(v); });
    return s;
  };
  add('div', 'page-drills');
  seg('drillKindGroup', ['changes', 'scale', 'picking', 'crossing', 'arpeggio'], 'scale');
  add('span', 'drillKindWhat');
  add('select', 'drillKey');
  add('input', 'drillTempo', { type: 'range', min: '40', max: '208', value: '80' });
  add('b', 'drillTempoOut');
  seg('drillDivGroup', [1, 2, 3, 4], 2);
  add('div', 'drillChordsRow'); add('input', 'drillChords', { type: 'text' });
  add('span', 'drillBeatsField'); add('select', 'drillBeats').innerHTML = '<option value="4">4</option><option value="8">8</option><option value="16">16</option>';
  add('span', 'drillStrumField'); add('select', 'drillStrum');
  add('span', 'drillDivField');
  add('div', 'drillScaleRow'); add('select', 'drillScale');
  add('span', 'drillPatternField'); seg('drillPatternGroup', ['updown', 'threes', 'fours', 'thirds', 'boxes'], 'updown');
  add('div', 'drillPickRow'); seg('drillPerStringGroup', [2, 3, 4, 6], 4); seg('drillDirGroup', ['up', 'down', 'updown'], 'updown');
  add('div', 'drillCrossRow'); seg('drillCrossGroup', ['adjacent', 'skip', 'outside', 'pedal'], 'skip');
  add('select', 'drillStrings').innerHTML = '<option value="all">All six</option><option value="low">Bottom four</option><option value="mid">Middle four</option><option value="high">Top four</option>';
  seg('drillShapesGroup', ['C', 'A', 'G', 'E', 'D'], null).querySelectorAll('.seg-btn').forEach(b => b.classList.add('active'));
  add('span', 'drillBoxField'); add('select', 'drillBox');
  add('span', 'drillPosField'); add('select', 'drillPos');
  const card = add('div', 'drillCard');
  const play = add('button', null, { type: 'button', textContent: 'Play' }, card); play.className = 'tbtn play';
  add('input', 'drillComp', { type: 'checkbox' }, card);
  add('input', 'drillNeckToggle', { type: 'checkbox', checked: true }, card);
  add('button', 'drillShare', { type: 'button' }, card);
  add('button', 'drillExpand', { type: 'button' }, card);
  add('button', 'drillClose', { type: 'button', hidden: true }, card);
  add('p', 'drillBrief', {}, card);
  add('div', 'drillTab', {}, card);
  add('div', 'drillNeck', {}, card).hidden = true;
  document.body.appendChild(root);

  const q = s => document.querySelector(s);
  let started = false;
  function start(){ if (started) return; started = true; GT.drills.init(); }

  // ---- the drills themselves ----
  const base = () => ({ kind: 'scale', mode: 'major', tonic: 'A', tempo: 80, div: 2, scale: 'minorpenta', pattern: 'updown', shapes: new Set(['C', 'A', 'G', 'E', 'D']), box: '',
                        chords: '', beats: 4, strum: 'quarters', cross: 'skip', strings: 'all', perString: 4, direction: 'updown', position: 5, comp: false, neck: true });
  const midis = d => d.notes.map(n => n.midi);
  const inCells = (d, cells) => d.notes.every(n => cells.some(c => c.string === n.string && c.fret === n.fret));
  const onGrid = d => d.notes.every(n => n.at >= 0 && n.at < d.grid && n.dur > 0 && n.at + n.dur <= d.grid);

  function testAScaleDrill(t){
    const { realiseDrill, boxesFor, SCALES } = GT.drills;
    const bad = [];
    const o = base();
    const scale = SCALES.find(s => s.id === 'minorpenta');
    const boxes = boxesFor(9, scale, null);
    const d = realiseDrill(o);
    if (!d){ t.ok(false, 'the scale drill realises'); return; }
    const box = boxes[0];
    if (!inCells(d, box.cells)) bad.push('a note is outside the box');
    if (!onGrid(d)) bad.push('a note is off the grid');
    // up, then down: one peak, and the ends on the box's lowest note
    const m = midis(d), peak = m.indexOf(Math.max(...m));
    const up = m.slice(0, peak + 1), down = m.slice(peak);
    if (!up.every((x, i) => i === 0 || x >= up[i - 1])) bad.push('the way up is not ascending');
    if (!down.every((x, i) => i === 0 || x <= down[i - 1])) bad.push('the way down is not descending');
    if (m.length !== box.cells.length * 2 - 1) bad.push(`${m.length} notes for a box of ${box.cells.length}`);
    if (m[0] !== Math.min(...m)) bad.push('the run does not start on the lowest note');
    // two a beat on a sixteen grid; triplets on a twelve
    if (d.grid !== 16 || d.notes[1].at !== 2) bad.push(`two a beat came out as grid ${d.grid}, second note at ${d.notes[1].at}`);
    const trip = realiseDrill({ ...o, div: 3 });
    if (trip.grid !== 12 || trip.notes[1].at !== 1) bad.push('three a beat is not on a twelve grid');
    // in threes: groups of three ascending on the way up
    const threes = realiseDrill({ ...o, pattern: 'threes' });
    const tm = midis(threes).slice(0, 9);
    if (!(tm[0] < tm[1] && tm[1] < tm[2] && tm[3] > tm[0] && tm[3] < tm[4])) bad.push(`in threes does not sequence (${tm.join(' ')})`);
    // another box by name, and the shapes narrowed
    const e = realiseDrill({ ...o, box: 'E@5' });
    const eBox = boxes.find(b => b.name === 'E' && b.anchor === 5);
    if (!eBox || !inCells(e, eBox.cells)) bad.push('asking for the E shape at the 5th fret did not give it');
    const only = realiseDrill({ ...o, shapes: new Set(['D']) });
    const dBoxes = boxesFor(9, scale, new Set(['D']));
    if (!dBoxes.length || !inCells(only, dBoxes[0].cells)) bad.push('narrowing the shapes to D did not give a D box');
    // into the next box: a slide on the way over
    const across = realiseDrill({ ...o, pattern: 'boxes' });
    if (!across.notes.some(n => n.slide != null)) bad.push('into the next box has no slide');
    t.equal(bad.join('; '), '', `A scale drill runs the box up and down, in sequence, on the grid, in the shape asked for (${m.length} notes)`);
  }

  function testPickingAndCrossing(t){
    const { realiseDrill } = GT.drills;
    const bad = [];
    const o = base();
    const pick = realiseDrill({ ...o, kind: 'picking', perString: 4, direction: 'up' });
    // four notes a string, the strings low to high
    const strings = pick.notes.map(n => n.string);
    for (let i = 0; i < strings.length; i += 4){
      const four = strings.slice(i, i + 4);
      if (four.some(s => s !== four[0])) bad.push(`notes ${i}–${i + 3} are not on one string`);
      if (i > 0 && four[0] !== strings[i - 1] - 1) bad.push(`string ${four[0]} does not follow ${strings[i - 1]}`);
    }
    if (!onGrid(pick)) bad.push('a picking note is off the grid');
    const both = realiseDrill({ ...o, kind: 'picking', perString: 3, direction: 'updown' });
    if (both.notes.length !== pick.notes.length / 4 * 3 * 2) bad.push(`up and down with three a string is ${both.notes.length} notes`);
    // crossing: one note a string, never the same string twice running, and a skip in the pattern
    const cross = realiseDrill({ ...o, kind: 'crossing', cross: 'skip', strings: 'all' });
    const cs = cross.notes.map(n => n.string);
    if (cs.some((s, i) => i > 0 && s === cs[i - 1])) bad.push('skip one repeats a string');
    if (!cs.some((s, i) => i > 0 && Math.abs(s - cs[i - 1]) === 2)) bad.push('skip one never skips a string');
    if (new Set(cs).size !== 6) bad.push(`skip one over all six uses ${new Set(cs).size} strings`);
    const four = realiseDrill({ ...o, kind: 'crossing', cross: 'outside', strings: 'high' });
    if (new Set(four.notes.map(n => n.string)).size !== 4 || four.notes.some(n => n.string > 3)) bad.push('the top four strings are not the top four');
    const pedal = realiseDrill({ ...o, kind: 'crossing', cross: 'pedal', strings: 'low' });
    const ps = pedal.notes.map(n => n.string);
    if (!ps.every((s, i) => i % 2 === 1 || s === 5)) bad.push('off the low string does not return to it');
    t.equal(bad.join('; '), '', 'Picking runs its notes a string in turn; crossing jumps strings the way the pattern says');
  }

  function testChangesAndArpeggios(t){
    const { realiseDrill } = GT.drills;
    const { chordFromName, chordPcs } = GT.theory;
    const bad = [];
    const o = base();
    const ch = realiseDrill({ ...o, kind: 'changes', chords: 'G D Em C', beats: 4, strum: 'quarters' });
    if (ch.chords.length !== 4) bad.push(`four chords a bar each came out as ${ch.chords.length} bars`);
    const byMoment = new Map();
    ch.notes.forEach(n => { const k = `${n.bar}:${n.at}`; if (!byMoment.has(k)) byMoment.set(k, []); byMoment.get(k).push(n); });
    if (byMoment.size !== 16) bad.push(`every beat over four bars is ${byMoment.size} strikes`);
    byMoment.forEach((ns, k) => {
      const chord = ch.chords[ns[0].bar], tones = new Set(chordPcs(chord));
      if (!ns.every(n => n.strum && tones.has(n.midi % 12))) bad.push(`the strike at ${k} has a note outside ${chord.name}`);
      const ss = ns.map(n => n.string).sort((a, b) => a - b);
      if (ss.some((s, i) => i > 0 && s !== ss[i - 1] + 1)) bad.push(`the strike at ${k} skips a string`);
    });
    // the shapes allowed are the shapes used
    const eOnly = realiseDrill({ ...o, kind: 'changes', chords: 'G D', shapes: new Set(['E']), position: 5 });
    if (!eOnly.grips.every(g => g.placement.name === 'E')) bad.push(`allowing only the E shape gave ${eOnly.grips.map(g => g.placement.name).join(',')}`);
    const eighths = realiseDrill({ ...o, kind: 'changes', chords: 'G', strum: 'eighths', beats: 8 });
    if (eighths.chords.length !== 2) bad.push('eight beats a chord is not two bars');
    if (!eighths.notes.some(n => n.stroke === 'up')) bad.push('every eighth has no upstrokes');
    // a pattern with the thumb's bass note and the split chord comes out as
    // the engine plays it, and a pattern from a link round-trips
    const { encodeStrums, decodeStrums } = GT.drills;
    const sent = 'fake';
    const custom = decodeStrums('0-b-2-9,2-m-2-8,8-b-2-9,10-m-2-8x');
    if (custom.length !== 4 || custom[1].voicing !== 'mid' || !custom[3].mute) bad.push(`a pattern did not decode (${JSON.stringify(custom)})`);
    if (encodeStrums(custom) !== '0-b-2-9,2-m-2-8,8-b-2-9,10-m-2-8x') bad.push(`a pattern did not encode back (${encodeStrums(custom)})`);
    const thumb = realiseDrill({ ...o, kind: 'changes', chords: 'Em', custom, position: 0 });
    const bassNote = thumb.notes.filter(n => n.bar === 0 && n.at === 0), split = thumb.notes.filter(n => n.bar === 0 && n.at === 2);
    if (bassNote.length !== 1 || bassNote[0].string < 3 || bassNote[0].midi % 12 !== 4) bad.push(`the thumb's bass note came out as ${bassNote.map(n => n.string + ':' + n.fret).join(' ')}`);
    if (split.length !== 3 || !split.every(n => n.string >= 1 && n.string <= 3)) bad.push(`the split chord came out as ${split.map(n => n.string + ':' + n.fret).join(' ')}`);
    if (!thumb.notes.some(n => n.at === 10 && n.mute)) bad.push('the muted strike is not muted');
    // a 7♯9 is the Hendrix grip, root on the A string, not a CAGED 7th
    const haze = realiseDrill({ ...o, kind: 'changes', chords: 'E7#9', position: 5 });
    const hz = haze.grips[0].cells.map(c => `${c.string}:${c.fret}`).sort().join(' ');
    if (hz !== '1:8 2:7 3:6 4:7') bad.push(`E7♯9 came out as ${hz}, not x-7-6-7-8-x`);
    // the key's own changes when nothing is typed
    const own = realiseDrill({ ...o, kind: 'changes', chords: '' });
    if (own.chords.length !== 4 || own.chords[0].name !== 'A' || own.chords[1].name !== 'D') bad.push(`the key's own changes are ${own.chords.map(c => c.name).join(' ')}`);
    // arpeggios: only chord tones, up then down, one chord after another
    const arp = realiseDrill({ ...o, kind: 'arpeggio', chords: 'Am F' });
    if (!arp.notes.every(n => new Set(chordPcs(arp.chords[n.bar])).has(n.midi % 12))) bad.push('an arpeggio note is not a chord tone of its bar');
    const first = arp.notes.filter(n => arp.chords[n.bar].name === 'Am').map(n => n.midi);
    const peak = first.indexOf(Math.max(...first));
    if (!first.slice(0, peak + 1).every((x, i) => i === 0 || x >= first[i - 1])) bad.push('the arpeggio does not go up first');
    if (arp.chords[arp.chords.length - 1].name !== 'F') bad.push('the second chord does not follow');
    t.equal(bad.join('; '), '', 'Chord changes strike each grip on the beat on neighbouring strings; arpeggios run each shape\'s tones');
  }

  function testTheLinkAndTheControls(t){
    start();
    const bad = [];
    const { shareState, applyState, state } = GT.drills;
    // the page came up on something, and drawn
    if (!q('#drillTab svg')) bad.push('no tab drawn on init');
    if (!q('#drillBrief').textContent) bad.push('no brief');
    if (q('#drillNeck').hidden || !q('#drillNeck svg')) bad.push('the neck is not drawn');
    if (!q('#drillBox').options.length) bad.push('no boxes to choose from');
    // a kind shows its own rows
    q('#drillKindGroup [data-value="changes"]').click();
    if (q('#drillChordsRow').hidden || !q('#drillScaleRow').hidden || q('#drillPosField').hidden) bad.push('chord changes did not show its rows');
    q('#drillKindGroup [data-value="crossing"]').click();
    if (q('#drillCrossRow').hidden || q('#drillScaleRow').hidden || !q('#drillChordsRow').hidden) bad.push('string crossing did not show its rows');
    // the shapes narrow the boxes, and one stays on
    const shapes = q('#drillShapesGroup');
    ['C', 'A', 'G', 'E'].forEach(n => shapes.querySelector(`[data-value="${n}"]`).click());
    if (![...q('#drillBox').options].every(o => o.value.startsWith('D@'))) bad.push('turning off four shapes left other boxes on the list');
    shapes.querySelector('[data-value="D"]').click();
    if (!state.shapes.has('D')) bad.push('the last shape on could be turned off');
    ['C', 'A', 'G', 'E'].forEach(n => shapes.querySelector(`[data-value="${n}"]`).click());
    // the link carries the state and brings it back
    q('#drillKindGroup [data-value="picking"]').click();
    q('#drillPerStringGroup [data-value="3"]').click();
    q('#drillDivGroup [data-value="4"]').click();
    q('#drillKey').value = 'minor:E'; q('#drillKey').dispatchEvent(new Event('change'));
    const link = shareState().toString();
    // (a link carries the fields its kind uses; the rest are another drill's)
    const FIELDS = ['kind', 'mode', 'tonic', 'tempo', 'div', 'scale', 'box', 'perString', 'direction', 'comp', 'neck'];
    const snap = () => JSON.stringify(Object.fromEntries(FIELDS.map(k => [k, state[k]])) ) + [...state.shapes].sort().join('');
    const was = snap();
    q('#drillKindGroup [data-value="scale"]').click();
    q('#drillDivGroup [data-value="1"]').click();
    applyState(new URLSearchParams(link));
    const now = snap();
    if (was !== now) bad.push(`the link did not bring the state back (${link})`);
    if (!/d=picking/.test(link) || !/ps=3/.test(link) || !/v=4/.test(link) || !/k=minor%3AE/.test(link)) bad.push(`the link is missing something: ${link}`);
    // expand moves the card into a full-window view and close brings it back
    const home = q('#drillCard').parentNode;
    q('#drillExpand').click();
    const dlg = q('#drillCard').closest('dialog');
    if (!dlg || !dlg.open || !GT.drills.isExpanded()) bad.push('expand did not open the drill in a dialog');
    if (!q('#drillExpand').hidden || q('#drillClose').hidden) bad.push('the buttons did not swap on expand');
    q('#drillClose').click();
    if (q('#drillCard').parentNode !== home || GT.drills.isExpanded() || (dlg && dlg.open)) bad.push('close did not bring the card back');
    if (!q('#drillTab svg')) bad.push('the tab was not redrawn after closing');
    // a link with nothing of ours is left alone
    if (applyState(new URLSearchParams('c=Bb13'))) bad.push('a stranger\'s link was taken as ours');
    t.equal(bad.join('; '), '', 'The drills page draws on init, shows each kind\'s rows, keeps one shape on, and its link round-trips');
  }

  GT.drillsSuites = [
    ['Drills: a scale drill', testAScaleDrill],
    ['Drills: picking and string crossing', testPickingAndCrossing],
    ['Drills: chord changes and arpeggios', testChangesAndArpeggios],
    ['Drills: the link and the controls', testTheLinkAndTheControls],
  ];
})();
