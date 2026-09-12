#!/usr/bin/env node
// For every part whose thumb keeps a bass (strums voiced bass or fifth): how
// many bars have a finger note on a string the thumb uses in that bar. A
// fingerpicking hand never does that; the count should be zero.
//     node tools/thumb-clash.js
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));
global.window = {}; global.console = console;
const GT = window.GT = {};
['js/theory.js','js/fretboard.js','js/parts.js','js/parts-guide-data.js','js/styles-base.js','review/proposals.js','review/proposals-2.js','review/proposals-3.js','review/proposals-4.js','review/proposals-more.js','review/proposals-easy.js','review/proposals-hendrix.js','js/styles.js'].forEach(f => new Function('window', fs.readFileSync(f, 'utf8'))(window));
const { STYLES, LIBRARY } = GT.styles;
const { chordFromName } = GT.theory;
const roots = ['C','D','E','G','A','Bb'];
const windows = [{ min: 0, max: 3 }, { min: 2, max: 6 }, { min: 5, max: 9 }, { min: 7, max: 11 }, { min: 10, max: 14 }];
let total = 0;
const report = [];
Object.keys(LIBRARY).forEach(style => Object.keys(LIBRARY[style]).forEach(feel => {
  const grid = style === 'simple' ? 16 : STYLES[style].variants.find(v => v.label === feel).grid;
  LIBRARY[style][feel].forEach(part => {
    const lists = [part.figure, ...(part.variants || []), ...(part.fills || []), ...(part.fillsOnChange || []), ...(part.fillsOnStay || []), ...(part.leads || [])];
    if (!lists.some(bar => (bar || []).some(w => w.strum && (w.voicing === 'bass' || w.voicing === 'fifth')))) return;
    let bars = 0, clashes = 0;
    ['penta', 'scale', 'caged'].forEach(reading => roots.forEach(root => windows.forEach(window => [1, 2, 3].forEach(seed => {
      const I = chordFromName(root), IV = chordFromName(roots[(roots.indexOf(root) + 3) % roots.length] + '7');
      const barsIn = [I, I, IV, IV, I, IV].map(chord => ({ chord }));
      const out = GT.parts.realise(part, barsIn, seed, { reading, window, scaleTheory: 'parallel', stayOnKey: false, key: { tonic: root, mode: 'major' }, tech: null }, { grid });
      for (let b = 0; b < barsIn.length; b++){
        const notes = out.filter(n => n.bar === b);
        const thumb = new Set(notes.filter(n => n.strum && (n.voicing === 'bass' || n.voicing === 'fifth')).map(n => n.string));
        if (!thumb.size) continue;
        bars++;
        if (notes.some(n => !n.strum && thumb.has(n.string))) clashes++;
      }
    }))));
    total += clashes;
    report.push(`${(style + '/' + feel + '/' + part.name).padEnd(70)} ${clashes} of ${bars} bars (${Math.round(100 * clashes / Math.max(1, bars))}%)`);
  });
}));
console.log(report.join('\n'));
console.log('total clashing bars:', total);
