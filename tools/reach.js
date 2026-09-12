#!/usr/bin/env node
// For every key: the window the review page and the guide use, where the
// root sits, and which intervals above the octave the box holds exactly
// (the rest fold down an octave). Says how high a part written for a key
// can go:   node tools/reach.js
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));
global.window = {}; global.console = console;
const GT = window.GT = {};
['js/theory.js','js/fretboard.js','js/parts.js'].forEach(f => new Function('window', fs.readFileSync(f, 'utf8'))(window));
const { cellsIn } = GT.parts;
const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function windowFor(pc){ const onA = (pc - 9 + 12) % 12, onE = (pc - 4 + 12) % 12; const f = [onA, onE, onA + 12, onE + 12].find(x => x >= 2 && x <= 10); return { min: f, max: f + 4 }; }
function homeMidi(cells, root){ const roots = cells.filter(c => c.midi % 12 === root).sort((a, b) => a.midi - b.midi); const low = roots.filter(c => c.string >= 3); if (low.length) return low[0].midi; return roots[0].midi; }
for (let pc = 0; pc < 12; pc++){
  const w = windowFor(pc), cells = cellsIn(w), home = homeMidi(cells, pc);
  const top = Math.max(...cells.map(c => c.midi));
  const exact = [];
  for (let iv = 12; iv <= 30; iv++){ const want = home + iv; const c = cells.find(x => x.midi === want); if (c) exact.push(iv); }
  console.log(`${names[pc].padEnd(2)} window ${w.min}-${w.max} home ${home} (${['E','A','D','G','B','e'][5 - Math.min(5, cells.filter(c=>c.midi===home)[0].string)]}) top ${top} = iv ${top - home}; exact up to ${Math.max(...exact)}; folds: ${[...Array(31).keys()].slice(12).filter(iv => !exact.includes(iv)).join(',')}`);
}
