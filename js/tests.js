// Regression tests. Open tests.html to run them.
//
// The chord finder's results are a judgement call — scoring, ranking, which
// shapes are playable — so the guard here is a snapshot: whatever it returned
// when these were written must keep coming back. Tuning may add shapes, and
// that's fine; it must not quietly drop one.
(function(){
  'use strict';
  const GT = window.GT;
  const { parseChordName, identifyChords } = GT.theory;
  const { STRING_TUNING } = GT.fretboard;
  const { findChordVoicings } = GT.chordFinder;

  const CHORDS = ["C", "A", "G", "E", "D", "Cm", "Am", "Gm", "Em", "Dm", "Ab", "Gb", "C#", "A9", "E9", "C7", "D7", "Cm7", "CM7"];

  // low E first, 'x' for a muted string, e.g. 'x-3-2-0-1-0' is an open C
  function grip(cells){
    const byString = new Map(cells.map(c => [c.string, c.fret]));
    return [5, 4, 3, 2, 1, 0].map(s => byString.has(s) ? byString.get(s) : 'x').join('-');
  }

  const BASELINE = {
      "C": [
          "x-3-2-0-1-0",
          "x-3-2-0-1-3",
          "x-3-2-0-5-0",
          "x-3-2-0-5-3",
          "x-3-5-5-5-3",
          "x-3-5-0-5-0",
          "8-7-5-5-5-8",
          "8-7-5-0-5-0",
          "8-7-x-9-8-8",
          "8-7-10-x-8-8",
          "8-10-10-9-8-8",
          "x-x-10-9-x-12",
          "x-x-10-12-13-12",
          "x-15-14-12-13-12",
          "x-15-14-x-13-15",
          "15-15-14-x-x-15"
      ],
      "A": [
          "x-0-2-2-2-0",
          "5-4-2-2-2-5",
          "5-4-x-6-5-0",
          "5-4-x-6-5-5",
          "5-7-7-6-5-5",
          "5-0-7-6-5-0",
          "x-x-7-6-x-9",
          "x-x-7-9-10-9",
          "9-7-7-9-x-9",
          "x-12-11-9-10-9",
          "x-12-11-9-x-12",
          "x-12-11-x-10-12",
          "x-12-11-14-14-12",
          "12-12-11-14-14-x",
          "x-12-14-14-14-12",
          "12-12-14-14-14-x"
      ],
      "G": [
          "3-2-0-0-0-3",
          "3-2-0-0-3-3",
          "3-5-5-4-3-3",
          "3-5-0-0-0-3",
          "x-x-5-4-0-x",
          "x-x-5-7-8-7",
          "x-x-5-7-0-7",
          "x-10-9-7-8-7",
          "x-10-9-7-x-10",
          "x-10-9-x-8-10",
          "x-10-9-12-12-10",
          "10-10-9-12-12-x",
          "x-10-12-12-12-10",
          "10-10-12-12-12-x",
          "15-14-12-12-12-15",
          "15-14-12-12-15-15"
      ],
      "E": [
          "0-2-2-1-0-0",
          "0-2-2-1-0-4",
          "0-2-2-4-0-4",
          "x-x-2-4-5-4",
          "x-7-6-4-5-4",
          "0-7-6-4-0-0",
          "0-7-6-x-5-0",
          "0-7-6-x-5-7",
          "x-7-6-9-9-7",
          "x-7-9-9-9-7",
          "7-7-9-9-9-x",
          "12-11-9-9-9-12",
          "12-11-9-9-12-12",
          "12-11-x-13-12-12",
          "12-11-14-x-12-12",
          "12-14-14-13-12-12"
      ],
      "D": [
          "x-x-0-2-3-2",
          "x-5-4-2-3-2",
          "x-5-4-x-3-5",
          "x-5-4-7-7-5",
          "x-0-4-7-7-5",
          "x-5-7-7-7-5",
          "x-5-0-7-7-5",
          "10-9-7-7-7-10",
          "10-9-7-7-10-10",
          "10-9-x-11-10-10",
          "10-9-12-x-10-10",
          "10-12-12-11-10-10",
          "x-x-12-11-x-14",
          "x-x-12-14-15-14",
          "14-12-12-14-x-14",
          "14-x-x-14-15-14"
      ],
      "Cm": [
          "x-3-1-0-1-3",
          "x-3-1-0-4-3",
          "x-3-5-5-4-3",
          "x-3-5-0-4-3",
          "x-6-5-5-4-x",
          "8-6-5-5-8-8",
          "8-6-5-8-8-8",
          "8-10-10-8-8-8",
          "8-10-10-8-8-11",
          "x-x-10-12-13-11",
          "11-10-10-12-x-11",
          "x-x-13-12-13-11",
          "11-x-13-12-13-x",
          "x-15-13-12-13-x",
          "x-15-13-12-x-15",
          "x-15-13-x-13-15"
      ],
      "Am": [
          "x-0-2-2-1-0",
          "0-3-2-2-1-0",
          "5-0-2-5-5-0",
          "5-3-2-2-5-5",
          "5-3-x-5-5-5",
          "5-3-x-5-5-0",
          "5-7-7-5-5-5",
          "5-0-7-5-5-0",
          "x-x-7-9-10-8",
          "x-x-10-9-10-8",
          "x-12-10-9-10-x",
          "x-12-10-9-x-12",
          "x-12-10-x-10-12",
          "x-12-10-x-13-12",
          "x-12-14-14-13-12",
          "12-15-14-14-13-12"
      ],
      "Gm": [
          "3-1-0-0-3-3",
          "3-1-0-3-3-x",
          "3-5-5-3-3-3",
          "3-x-0-3-3-3",
          "x-x-5-7-8-6",
          "x-x-5-0-8-6",
          "x-x-8-7-8-6",
          "6-x-8-7-8-x",
          "x-10-8-7-8-x",
          "x-10-8-7-x-10",
          "x-10-8-x-8-10",
          "x-10-8-x-11-10",
          "x-10-12-12-11-10",
          "10-13-12-12-11-10",
          "15-13-12-12-15-15",
          "15-13-12-15-15-15"
      ],
      "Em": [
          "0-2-2-0-0-0",
          "0-2-2-0-0-3",
          "0-x-5-0-0-3",
          "0-x-5-4-0-3",
          "0-7-5-4-0-0",
          "0-7-5-4-5-0",
          "0-7-5-0-0-0",
          "0-7-5-0-0-7",
          "x-7-9-9-8-7",
          "7-10-9-9-8-7",
          "12-10-9-9-12-12",
          "12-10-9-12-12-12",
          "12-14-14-12-12-12",
          "12-14-14-12-12-15",
          "15-14-14-x-x-15"
      ],
      "Dm": [
          "x-x-0-2-3-1",
          "1-0-0-2-x-1",
          "x-5-3-2-3-x",
          "x-5-3-2-x-5",
          "x-5-3-x-3-5",
          "x-5-3-x-6-5",
          "x-5-7-7-6-5",
          "x-5-0-7-6-5",
          "x-8-7-7-6-x",
          "10-8-7-7-10-10",
          "10-8-7-10-10-10",
          "10-12-12-10-10-10",
          "10-12-12-10-10-13",
          "x-x-12-14-15-13",
          "13-12-12-14-x-13",
          "x-x-15-14-15-13"
      ],
      "Ab": [
          "4-3-1-1-1-4",
          "4-3-1-1-4-4",
          "4-3-x-5-4-4",
          "4-3-6-x-4-4",
          "4-6-6-5-4-4",
          "x-x-6-5-x-8",
          "x-x-6-8-9-8",
          "8-6-6-8-x-8",
          "x-11-10-8-9-8",
          "x-11-10-8-x-11",
          "x-11-10-x-9-11",
          "x-11-10-13-13-11",
          "11-11-10-13-13-x",
          "x-11-13-13-13-11",
          "11-11-13-13-13-x",
          "x-15-13-13-13-x"
      ],
      "Gb": [
          "2-1-x-3-2-2",
          "2-1-4-x-2-2",
          "2-4-4-3-2-2",
          "x-x-4-3-x-6",
          "x-x-4-6-7-6",
          "6-4-4-6-x-6",
          "x-9-8-6-7-6",
          "x-9-8-6-x-9",
          "x-9-8-x-7-9",
          "x-9-8-11-11-9",
          "9-9-8-11-11-x",
          "x-9-11-11-11-9",
          "9-9-11-11-11-x",
          "14-13-11-11-11-14",
          "14-13-11-11-14-14",
          "14-13-x-15-14-14"
      ],
      "C#": [
          "x-4-3-1-2-1",
          "x-4-3-1-x-4",
          "x-4-3-x-2-4",
          "x-4-3-6-6-4",
          "4-4-3-6-6-x",
          "x-4-6-6-6-4",
          "4-4-6-6-6-x",
          "9-8-6-6-6-9",
          "9-8-6-6-9-9",
          "9-8-x-10-9-9",
          "9-8-11-x-9-9",
          "9-11-11-10-9-9",
          "x-x-11-10-x-13",
          "x-x-11-13-14-13",
          "13-11-11-13-x-13",
          "x-x-15-13-14-13"
      ],
      "A9": [
          "5-4-2-0-0-0",
          "5-2-2-2-2-3",
          "5-4-5-0-0-3",
          "5-0-5-6-0-3",
          "5-4-5-0-0-0",
          "5-4-5-4-5-5",
          "5-0-5-6-0-0",
          "5-0-5-6-0-5",
          "x-x-7-6-8-7",
          "7-7-7-9-8-9",
          "x-12-9-12-10-9",
          "x-12-11-12-12-9",
          "x-12-11-12-12-12",
          "15-14-14-14-14-12",
          "12-14-14-14-14-15",
          "15-14-14-14-14-15"
      ],
      "E9": [
          "0-2-0-1-0-2",
          "0-2-0-1-3-2",
          "0-2-4-x-3-4",
          "0-x-4-4-3-4",
          "0-5-4-4-0-4",
          "0-7-0-4-7-4",
          "0-5-6-7-7-0",
          "0-5-6-x-7-7",
          "x-7-6-7-7-7",
          "10-9-9-9-9-7",
          "12-9-9-9-9-10",
          "12-9-9-11-9-10",
          "12-11-x-11-x-10",
          "12-11-12-11-12-12",
          "12-14-12-13-12-14",
          "x-x-14-13-15-14"
      ],
      "C7": [
          "x-3-2-3-1-0",
          "0-1-2-0-1-0",
          "x-3-2-3-5-0",
          "x-3-5-3-5-3",
          "x-3-5-3-5-0",
          "8-7-8-0-5-0",
          "8-7-5-5-5-6",
          "8-7-x-x-8-6",
          "8-7-8-x-8-8",
          "8-10-8-9-8-8",
          "8-10-8-9-11-8",
          "x-x-10-9-11-12",
          "x-x-10-12-11-12",
          "12-13-14-12-13-12",
          "x-15-14-15-13-x",
          "x-15-14-15-x-15"
      ],
      "D7": [
          "x-x-0-2-1-2",
          "x-5-0-5-3-2",
          "2-3-4-2-3-2",
          "x-5-4-5-3-x",
          "x-5-4-5-x-5",
          "x-5-7-5-7-5",
          "x-5-0-5-7-5",
          "10-9-7-7-7-8",
          "10-9-10-7-7-x",
          "10-9-x-x-10-8",
          "10-9-10-x-10-10",
          "10-12-10-11-10-10",
          "10-12-10-11-13-10",
          "x-x-12-11-13-14",
          "x-x-12-14-13-14",
          "x-15-x-14-15-14"
      ],
      "Cm7": [
          "x-3-1-3-1-3",
          "3-1-1-3-1-3",
          "x-3-5-3-4-3",
          "x-3-5-0-4-6",
          "6-6-5-5-4-6",
          "8-6-5-0-x-6",
          "8-6-5-5-x-6",
          "8-6-8-8-8-6",
          "8-6-8-8-8-8",
          "8-10-8-8-8-8",
          "8-10-8-8-11-8",
          "x-x-10-12-11-11",
          "11-13-13-12-13-11",
          "15-13-13-12-13-x",
          "x-15-13-15-13-15",
          "15-13-13-15-13-15"
      ],
      "CM7": [
          "0-2-2-0-1-0",
          "x-3-2-4-1-0",
          "x-3-2-0-0-0",
          "x-3-2-0-0-3",
          "x-3-5-0-0-0",
          "x-3-5-5-0-0",
          "8-7-5-0-0-0",
          "8-7-5-5-0-0",
          "8-7-9-9-8-7",
          "8-7-9-9-8-8",
          "8-10-9-9-8-8",
          "x-x-10-9-12-12",
          "x-x-10-12-12-12",
          "x-15-14-12-12-12",
          "x-15-14-12-12-15",
          "15-14-14-x-13-15"
      ]
  };

  // ---- 1. every shape these chords produced before is still produced ----
  function testBaselineShapesSurvive(t){
    CHORDS.forEach(name => {
      const parsed = parseChordName(name);
      t.ok(!!parsed, `${name} parses`);
      if (!parsed) return;
      const current = findChordVoicings(parsed.rootPc, parsed.formula).map(v => grip(v.cells));
      const missing = BASELINE[name].filter(g => !current.includes(g));
      t.equal(missing.join(' '), '', `${name}: keeps all ${BASELINE[name].length} known shapes`
        + (missing.length ? ` (lost ${missing.length})` : ''));
    });
  }

  // ---- 2. what the chord finder draws, the reverse finder can name ----
  function testFinderOutputIsIdentifiable(t){
    CHORDS.forEach(name => {
      const parsed = parseChordName(name);
      if (!parsed) return;
      const voicings = findChordVoicings(parsed.rootPc, parsed.formula);
      const unnamed = [];
      voicings.forEach(v => {
        const pcs = [...new Set(v.cells.map(c => (STRING_TUNING[c.string] + c.fret) % 12))];
        const matched = identifyChords(pcs).some(m =>
          m.rootPc === parsed.rootPc && m.formula.name === parsed.formula.name);
        if (!matched) unnamed.push(grip(v.cells));
      });
      t.equal(unnamed.join(' '), '', `${name}: all ${voicings.length} shapes read back as ${name}`
        + (unnamed.length ? ` (${unnamed.length} did not)` : ''));
    });
  }

  // ---- a very small test runner ----
  function run(){
    const results = [];
    const t = {
      ok(cond, what){ results.push({ pass: !!cond, what }); },
      equal(actual, expected, what){
        const pass = actual === expected;
        results.push({ pass, what, detail: pass ? '' : `got "${actual}", expected "${expected}"` });
      },
    };
    const suites = [
      ['Chord finder keeps its known shapes', testBaselineShapesSurvive],
      ['Chord finder output is identifiable in reverse', testFinderOutputIsIdentifiable],
    ];
    const out = [];
    suites.forEach(([title, fn]) => {
      const from = results.length;
      fn(t);
      out.push({ title, cases: results.slice(from) });
    });
    const failed = results.filter(r => !r.pass);
    window.TEST_RESULTS = {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      failures: failed.map(f => `${f.what}${f.detail ? ' — ' + f.detail : ''}`),
    };
    render(out, results.length - failed.length, failed.length);
  }

  function render(suites, passed, failed){
    const el = document.getElementById('results');
    if (!el) return;
    const summary = failed
      ? `<p class="summary bad">${failed} failed, ${passed} passed</p>`
      : `<p class="summary good">All ${passed} checks passed</p>`;
    el.innerHTML = summary + suites.map(s => `
      <section>
        <h2>${s.title}</h2>
        <ul>${s.cases.map(c => `
          <li class="${c.pass ? 'pass' : 'fail'}">
            <span class="mark">${c.pass ? '\u2713' : '\u2717'}</span>${c.what}
            ${c.detail ? `<br><small>${c.detail}</small>` : ''}
          </li>`).join('')}</ul>
      </section>`).join('');
  }

  run();
})();
