#!/usr/bin/env node
// Realises every part in every reading, key, window, easy mode and seed and
// reports anything outside the rules: an exception, a note outside the
// window, a bar left empty, a technique left in easy mode. Run it after
// changing the engine or the styles:   node tools/sweep.js
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));
global.window = {}; global.console = console;
const GT = window.GT = {};
['js/theory.js','js/fretboard.js','js/parts.js','js/parts-guide-data.js','js/styles-base.js','review/proposals.js','review/proposals-2.js','review/proposals-3.js','review/proposals-4.js','review/proposals-more.js','review/proposals-easy.js','js/styles.js'].forEach(f => new Function('window', fs.readFileSync(f, 'utf8'))(window));
const { STYLES, LIBRARY } = GT.styles;
const { chordFromName, SEMITONE } = GT.theory;
const { realise } = GT.parts;
const roots = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const windows = [{ min: 0, max: 3 }, { min: 2, max: 6 }, { min: 5, max: 9 }, { min: 10, max: 14 }];
const bad = {}; const note = (k, m) => { bad[k] = bad[k] || []; if (bad[k].length < 4) bad[k].push(m); };
let realised = 0, errors = 0, notes = 0;
Object.keys(LIBRARY).forEach(style => Object.keys(LIBRARY[style]).forEach(feel => {
  const grid = style === 'simple' ? 16 : STYLES[style].variants.find(v => v.label === feel).grid;
  LIBRARY[style][feel].forEach(part => {
    ['caged', 'penta', 'scale', 'triads3'].forEach(reading => roots.forEach(root => {
      const I = chordFromName(root), IV = chordFromName(roots[(roots.indexOf(root) + 5) % 12] + '7'), V = chordFromName(roots[(roots.indexOf(root) + 7) % 12] + 'm7');
      const bars = [I, I, IV, IV, V, I, I, V].map(chord => ({ chord }));
      windows.forEach(window => [false, true].forEach(easy => [1, 2, 3].forEach(seed => {
        const opts = { reading, window, scaleTheory: 'parallel', stayOnKey: false, key: { tonic: root, mode: 'major' }, tech: null };
        let out;
        try { out = realise(part, bars, seed, opts, { grid, easy }); realised++; }
        catch (e){ errors++; note('throws', `${part.name} ${reading} ${root} ${JSON.stringify(window)} easy=${easy}: ${e.message}`); return; }
        notes += out.length;
        out.forEach(n => {
          if (!(n.at >= 0 && n.at < grid)) note('at', `${part.name}: at ${n.at} on ${grid}`);
          if (!(n.dur > 0)) note('dur', `${part.name}: dur ${n.dur}`);
          if (!(n.vel > 0 && n.vel <= 1.01)) note('vel', `${part.name}: vel ${n.vel}`);
          if (!Number.isFinite(n.midi) || n.fret < window.min || n.fret > window.max) note('window', `${part.name} ${reading} ${root}: fret ${n.fret} outside ${window.min}-${window.max}`);
          if (n.string < 0 || n.string > 5) note('string', `${part.name}: string ${n.string}`);
          if (n.bend && !(n.fret > 0)) note('bend0', `${part.name}: a bend on an open string`);
          if (n.slide != null && (n.slide < 0 || n.slide > 22)) note('slide', `${part.name}: slide from ${n.slide}`);
          if (n.pair && !out.some(m => m.bar === n.bar && Math.abs(m.at - n.at) < 1e-9 && m.tech === 'double' && !m.pair)) note('orphan', `${part.name}: a pair note with no first note`);
          if (easy && (n.bend || n.tech === 'h' || n.tech === 'p' || n.slide != null || n.ghost || n.trem || n.rake)) note('easy', `${part.name}: easy mode still has ${n.bend ? 'a bend' : n.tech || (n.slide != null ? 'a slide' : n.ghost ? 'a ghost' : n.trem ? 'tremolo' : 'a rake')}`);
        });
        out.stopBars.forEach(b => { if (b % 2 !== 1) note('stopbar', `${part.name}: stop bar ${b} is not a fill bar`); });
        // every bar has something in it
        for (let b = 0; b < bars.length; b++) if (!out.some(n => n.bar === b)) note('emptybar', `${part.name} ${reading} ${root} w${window.min} easy=${easy}: bar ${b} is empty`);
      })));
    }));
  });
}));
console.log('realised', realised, 'errors', errors, 'notes', notes);
Object.entries(bad).forEach(([k, v]) => console.log(k, v.length, v));
