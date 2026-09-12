// The Hendrix deep dive (hendrix.html): the grips drawn, the examples,
// exercises and studies realised from the Hendrix genre's parts and played
// through the example player, each with a link into the Practice tab that
// opens the same key, progression, feel, part and roll — and the songs and
// the sources written out. Nothing here is played from a recording: every
// tab on the page is the engine realising a part of the library.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { chordFromName, SEMITONE, MINOR_KEYS } = GT.theory;
  const { partsFor, realise } = GT.parts;
  const { STYLES } = GT.audio;
  const { drawTab, play, stop, playing } = GT.examplePlayer;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const STYLE = 'hendrix';
  const feels = STYLES[STYLE].variants;
  const feelByLabel = label => feels.find(f => f.label === label);
  const feelIndex = label => feels.findIndex(f => f.label === label);

  // ---- where the hand sits: the E shape at the key's root on the low E ----
  // The window is the box whose root is on the low E string — the thumb
  // chord's box — four frets wide. E is the open position (the same shape
  // as the 12th fret, which the app's fifteen-fret neck can't hold with a
  // box above it); the fuzz grips sit at the 7th-fret root on the A string.
  function eShapeWindow(key){
    const pc = SEMITONE[key] % 12;
    const f = (pc - 4 + 12) % 12;       // the root's fret on the low E
    return { min: f, max: f + 3 };
  }
  const windowAt = (min, span = 3) => ({ min, max: min + span });

  // ---- a link into the practice tab ----
  // The practice tab's share format: k = mode:tonic, n = the chords by name
  // with bars (or pr = the preset they came from, which a part written for
  // one progression needs), t = tempo, s = style.variant, p =
  // part.scale.seed(.e)(.l|.r), f = the neck's reading, theory and box.
  function practiceLink({ key, mode, chords, tempo, feel, part, seed, blend, reading, preset, easy, window: win }){
    const p = new URLSearchParams();
    p.set('k', `${mode || 'major'}:${key}`);
    if (preset) p.set('pr', `${preset.name}|${preset.variant || ''}`);
    else p.set('n', chords.map(c => `${c.name}.${c.bars || 1}`).join(','));
    p.set('t', String(tempo));
    p.set('s', `${STYLE}.${feelIndex(feel)}`);
    const idx = partsFor(STYLE, feel).findIndex(x => x.name === part);
    p.set('p', `${Math.max(0, idx)}.f.${seed}${easy ? '.e' : ''}${blend === 'lead' ? '.l' : blend === 'rhythm' ? '.r' : ''}`);
    const first = chordFromName(chords[0].name, SEMITONE[key] % 12, mode || 'major');
    const box = boxIndexFor({ key, mode, reading, window: win }, first);
    p.set('f', `m:${reading || 'penta'}${mode === 'minor' ? '.t:modal' : ''}${box ? `.b:${box}` : ''}`);
    return `index.html#practice?${p.toString()}`;
  }
  // The box the link opens the neck on: of the boxes the neck lists for the
  // first chord, low to high, the one nearest the example's window — the
  // higher of two equally near, so a grip at the top of the window is in.
  // The neck's boxes are the shapes' own frets, so the window in Practice
  // can differ from the example's by a fret; the arrows step it from there.
  function boxIndexFor(ex, chord){
    const fb = GT.fretboard;
    const rootPc = SEMITONE[chord.note] % 12;
    const isMinor = chord.quality === 'min';
    const win = ex.window || eShapeWindow(ex.key);
    let boxes;
    if ((ex.reading || 'penta') === 'scale'){
      const flat7 = chord.seventh && (SEMITONE[chord.seventh] - rootPc + 12) % 12 === 10;
      const pcs = ex.mode === 'minor'
        ? MINOR_KEYS[ex.key].map(n => SEMITONE[n] % 12)      // modal theory: the key's own notes
        : (isMinor ? [0, 2, 3, 5, 7, 8, 10] : flat7 ? [0, 2, 4, 5, 7, 9, 10] : [0, 2, 4, 5, 7, 9, 11]).map(i => (rootPc + i) % 12);
      boxes = fb.scaleBoxPlacements(rootPc, isMinor, new Set(pcs));
    } else boxes = fb.pentaBoxPlacements(rootPc, isMinor);
    const sorted = boxes.filter(b => b.anchor >= 0 && b.anchor <= fb.FRET_COUNT).sort((a, b) => a.anchor - b.anchor);
    let best = 0, bd = Infinity;
    sorted.forEach((b, i) => {
      const d = Math.abs(Math.min(...b.cells.map(c => c.fret)) - win.min);
      if (d <= bd){ bd = d; best = i; }
    });
    return best;
  }
  const finderLink = chord => `index.html#chord-finder?c=${encodeURIComponent(chord)}`;

  // ---- realising an example ----
  function realiseExample(ex){
    const feel = feelByLabel(ex.feel);
    const part = partsFor(STYLE, ex.feel).find(p => p.name === ex.part);
    if (!feel || !part) return null;
    const tonicPc = SEMITONE[ex.key] % 12;
    const chords = [];
    ex.chords.forEach(c => { const ch = chordFromName(c.name, tonicPc, ex.mode || 'major'); for (let k = 0; k < (c.bars || 1); k++) chords.push(ch); });
    const opts = { reading: ex.reading || 'penta', window: ex.window || eShapeWindow(ex.key), scaleTheory: ex.mode === 'minor' ? 'modal' : 'parallel',
                   stringSet: 2, stayOnKey: false, key: { tonic: ex.key, mode: ex.mode || 'major' }, tech: null };
    const notes = realise(part, chords.map(chord => ({ chord })), ex.seed || 7, opts, { grid: feel.grid, blend: ex.blend || 'mixed', easy: !!ex.easy });
    return { feel, part, chords, notes };
  }

  function card(host, ex){
    const art = document.createElement('article');
    art.className = 'ex';
    art.id = ex.id;
    const link = practiceLink(ex);
    art.innerHTML = `
      <div class="ex-head"><div><h4>${esc(ex.title)}</h4>
        <div class="meta"><span>${esc(ex.feel)}</span><span>${esc(ex.part)}</span><span>${esc(ex.key)} ${ex.mode === 'minor' ? 'minor' : 'major'}</span><span>${ex.tempo} BPM</span><span>${ex.blend === 'lead' ? 'lead' : ex.blend === 'rhythm' ? 'rhythm' : 'mixed'}</span></div></div>
        <span class="btns"><button type="button" class="play">Play</button><a class="drill" href="${link}">Drill it in Practice →</a></span></div>
      <p class="blurb">${ex.blurb}</p>
      <div class="tab"></div>
      ${ex.refs ? `<p class="refs">${ex.refs}</p>` : ''}`;
    host.appendChild(art);
    const r = realiseExample(ex);
    if (!r){ art.querySelector('.tab').innerHTML = `<p class="missing">This example's part is missing: ${esc(ex.feel)} / ${esc(ex.part)}</p>`; return; }
    const tabHost = art.querySelector('.tab');
    const metrics = drawTab(tabHost, r.feel, r.chords, r.notes);
    art.querySelector('.play').addEventListener('click', () => {
      if (playing() && playing().card === art){ stop(); return; }
      play(art, STYLE, r.feel, r.chords, r.notes, ex.tempo, metrics);
    });
  }

  // ---- the grips ----
  // pattern low string to high, relative to the lowest fret; `at` is the
  // fret the pattern's 0 sits at for the chord named
  const GRIPS = [
    { name: 'E-shape barre, thumb over the bass', chord: 'G', pattern: '0-2-2-1-0-0', at: 3, what: 'The thumb frets the low E; the four fingers are free. The chord every ballad is built on.' },
    { name: 'E-shape minor', chord: 'Em', pattern: '0-2-2-0-0-0', at: 0, what: 'The same hand on a minor chord: Little Wing’s Em, Am and Bm.' },
    { name: 'The split chord', chord: 'G', pattern: 'x-x-2-1-0-x', at: 3, what: 'The D, G and B strings of the E shape struck on their own after the thumb’s bass note.' },
    { name: 'The 4th hammered on (sus4)', chord: 'Gsus4', pattern: '0-2-2-2-0-0', at: 3, what: 'The pinky hammers the 4th onto the 3rd on the G string and lets it go.' },
    { name: 'The 6th (The Wind Cries Mary)', chord: 'G6', pattern: '0-2-2-1-2-0', at: 3, what: 'The 6th onto the 5th on the B string — the embellishment that drives that record’s rhythm part.' },
    { name: 'The 9th on top (add9)', chord: 'Gadd9', pattern: '0-2-2-1-0-2', at: 3, what: 'The 9th hammered onto the octave on the top string.' },
    { name: 'The Hendrix chord, 7♯9', chord: 'E7#9', pattern: 'x-1-0-1-2-x', at: 6, what: 'Root on the A string at the 7th fret, 3rd, ♭7, ♯9: x-7-6-7-8-x. Both thirds at once.' },
    { name: 'The 9th chord (Red House)', chord: 'B9', pattern: 'x-1-0-1-1-1', at: 1, what: 'The same grip with the 9th and the 5th on top: the T-Bone and B.B. King comp chord, slid in from a fret below.' },
    { name: 'A-shape barre', chord: 'A', pattern: 'x-0-2-2-2-0', at: 5, what: 'The 5th-string-root barre, and the slides that connect it to the E shape.' },
    { name: 'C shape with the 3rd in the bass', chord: 'C/E', pattern: '0-3-2-0-1-0', at: 0, what: 'The C shape voiced from its 3rd — the inversions the ballads move through.' },
    { name: 'Stacked fifths (Castles Made of Sand)', chord: 'Dsus2', pattern: 'x-x-0-2-5-x', at: 0, what: 'Root, 5th and 9th on the D, G and B strings, slid along the neck.' },
  ];
  function gripSVG(pattern, at){
    const frets = pattern.split('-').map(f => f === 'x' ? null : Number(f) + at);
    const lo = Math.max(0, Math.min(...frets.filter(f => f != null)));
    const start = lo <= 1 ? 0 : lo;             // draw from the nut, or from the lowest fret
    const W = 150, H = 120, x0 = 24, y0 = 22, sx = 18, sy = 19, n = 5;
    const parts = [];
    for (let s = 0; s < 6; s++) parts.push(`<line x1="${x0 + s * sx}" y1="${y0}" x2="${x0 + s * sx}" y2="${y0 + n * sy}" stroke="#6f675b" stroke-width="1"/>`);
    for (let f = 0; f <= n; f++) parts.push(`<line x1="${x0}" y1="${y0 + f * sy}" x2="${x0 + 5 * sx}" y2="${y0 + f * sy}" stroke="${f === 0 && start === 0 ? '#ece7dc' : '#3a3631'}" stroke-width="${f === 0 && start === 0 ? 3 : 1}"/>`);
    frets.forEach((f, s) => {
      const x = x0 + s * sx;
      if (f == null){ parts.push(`<text x="${x}" y="${y0 - 8}" text-anchor="middle" fill="#6f675b" font-size="11">x</text>`); return; }
      if (f === 0){ parts.push(`<circle cx="${x}" cy="${y0 - 10}" r="4" fill="none" stroke="#a49a8a" stroke-width="1.3"/>`); return; }
      const row = f - start;
      parts.push(`<circle cx="${x}" cy="${y0 + (row - 0.5) * sy}" r="6.2" fill="#e0a84a"/>`);
    });
    if (start > 0) parts.push(`<text x="${x0 - 8}" y="${y0 + sy * 0.5 + 4}" text-anchor="end" fill="#a49a8a" font-size="11">${start}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
  }
  function renderGrips(){
    $('grips').innerHTML = GRIPS.map(g => `
      <div class="grip">${gripSVG(g.pattern, g.at)}
        <div class="name">${esc(g.name)}</div>
        <div class="what">${esc(g.what)}</div>
        <a href="${finderLink(g.chord)}">${esc(g.chord)} in the finder →</a></div>`).join('');
  }

  // ---- the examples ----
  const E_FUZZ = windowAt(5);        // the 7♯9 grip's home: the E on the A string at the 7th fret
  const soul = { feel: 'Soul ballad (chord melody)', key: 'E', mode: 'minor', tempo: 70, chords: [{ name: 'Em' }, { name: 'G' }, { name: 'Am' }, { name: 'Em' }, { name: 'Bm' }, { name: 'C' }], window: windowAt(0), reading: 'scale' };
  const fuzz = { feel: 'Fuzz riff (the Hendrix chord)', key: 'E', tempo: 108, chords: [{ name: 'E7#9', bars: 2 }, { name: 'G' }, { name: 'A' }, { name: 'E7#9', bars: 2 }], window: E_FUZZ, reading: 'penta' };
  const blues = { feel: 'Slow blues in 12/8 (Red House way)', key: 'B', tempo: 60, chords: [{ name: 'B7', bars: 2 }, { name: 'E9', bars: 2 }, { name: 'B7' }, { name: 'F#7' }], window: windowAt(7), reading: 'penta' };
  const funk = { feel: 'Funk rock (Band of Gypsys)', key: 'C', tempo: 104, chords: [{ name: 'C' }, { name: 'Eb' }, { name: 'C7' }, { name: 'F7' }, { name: 'C' }, { name: 'Eb' }], window: windowAt(8), reading: 'penta' };
  const cycle = { feel: 'Cycle of fourths (Hey Joe way)', key: 'E', tempo: 82, chords: [{ name: 'C' }, { name: 'G' }, { name: 'D' }, { name: 'A' }, { name: 'E', bars: 2 }], window: windowAt(0), reading: 'penta' };
  const voodoo = { feel: 'One-chord voodoo (wah and pentatonic)', key: 'E', tempo: 88, chords: [{ name: 'E7#9', bars: 6 }], window: E_FUZZ, reading: 'penta' };
  const rnb = { feel: 'Rhythm & blues (Wait Until Tomorrow way)', key: 'E', tempo: 118, chords: [{ name: 'E' }, { name: 'G' }, { name: 'A' }, { name: 'E' }, { name: 'G' }, { name: 'A' }], window: windowAt(0), reading: 'scale' };
  const waltz = { feel: 'Rolling waltz (Manic Depression way)', key: 'A', tempo: 140, chords: [{ name: 'A' }, { name: 'G' }, { name: 'D' }, { name: 'D#' }, { name: 'E' }, { name: 'A' }], window: windowAt(5), reading: 'penta' };

  const HEY_JOE = { name: 'Hendrix', variant: 'Cycle of fourths (Hey Joe)' };
  const preset = variant => ({ name: 'Hendrix', variant });
  const tab = (song, url) => `<a href="${url}">${esc(song)} tab</a>`;
  const UG = 'https://tabs.ultimate-guitar.com/tab/jimi-hendrix/';

  const RHYTHM = [
    { ...soul, id: 'r-split', title: 'Thumb bass and the split chord', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7,
      blurb: 'The root under the thumb on one, the D–G–B triad on the "and", the 4th hammered on the G string, the 9th on the top string, a double stop coming down the box. The band is a rim click and a bass on roots; the sixteenths bounce a little, the way Mermikides measures them moving on the record.',
      refs: `As heard in ${tab('Little Wing', UG + 'little-wing-tabs-31788')} and ${tab('Castles Made of Sand', UG + 'castles-made-of-sand-tabs-982787')} (Ultimate Guitar); the device is set out in Happy Bluesman’s three steps [8] and Blackstar’s lesson [9].` },
    { ...soul, id: 'r-sixths', title: 'Sliding 6ths and rolling hammer-ons', part: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)', blend: 'rhythm', seed: 3,
      blurb: 'What Mayfield and Cropper play: 6ths on the D and B strings slid into from a fret below, the 2nd rolling onto the 3rd and the 4th onto the 5th, two notes at a time.',
      refs: `The Cropper devices from a university lesson [29]; Mayfield’s sliding 6ths and rolling hammer-ons from Premier Guitar [7]. As heard in ${tab('The Wind Cries Mary', UG + 'the-wind-cries-mary-tabs-64118')}.` },
    { ...fuzz, id: 'r-stabs', title: '7♯9 stabs and the riff', part: '7♯9 stabs and the riff', blend: 'rhythm', seed: 5,
      blurb: 'The Hendrix chord on one, left to ring, then the riff on the low strings in the E minor pentatonic with the ♭5 passing, muted between the notes and doubled with the bass. The chord sits at the 7th fret on the A string; the box is the one below it.',
      refs: `As heard in ${tab('Purple Haze', UG + 'purple-haze-tabs-25')} and ${tab('Foxy Lady', UG + 'foxy-lady-tabs-28416')}; the chord’s theory in [1], [5] and [20].` },
    { ...fuzz, id: 'r-power', title: 'Power chords with the open strings', part: 'Power chords with the open strings', blend: 'rhythm', seed: 11,
      blurb: 'Root-and-5th chords hit hard, slid into from a fret below, the riff between them in the pentatonic with a muted scratch.',
      refs: `As heard in ${tab('Spanish Castle Magic', UG + 'spanish-castle-magic-tabs-83455')}; Wikipedia on the unison of guitar and bass there [13b].` },
    { ...blues, id: 'r-ninths', title: '9th chords with the trill', part: '9th chords with the trill', blend: 'rhythm', seed: 2,
      blurb: 'The 9th grip on one, muted on the third triplet, slid in from a fret below on three, the 3rd trilled against the 4th into the change; the turnaround walks the 6ths down.',
      refs: `The form and the 7th/9th voicings from guitarclub.io’s Red House lesson [16b]; as heard in ${tab('Red House', UG + 'red-house-tabs-14113')}.` },
    { ...funk, id: 'r-scratch', title: 'Sixteenth scratch with the wah', part: 'Sixteenth scratch with the wah', blend: 'rhythm', seed: 4,
      blurb: 'The pick moving in sixteenths whether the strings ring or not, the wah rocking with every stroke, the chord on the "and of 2" and the "and of 4".',
      refs: `Guitar Player’s rule of the funk figures [6b]; as heard in ${tab('Freedom', UG + 'freedom-tabs-395814')} and ${tab('Izabella', UG + 'izabella-tabs-160070')}.` },
    { ...funk, id: 'r-riff', title: 'Single-note funk riff with muted ghosts', part: 'Single-note funk riff with muted ghosts', blend: 'rhythm', seed: 6,
      blurb: 'Root and octave, the ♭7 and the 5th on the low strings, dead sixteenths between the notes, a slide into the ♭3 and a trill on the 4th — the syncopations "articulated with muting, slurs, trills and bends" [6b].',
      refs: `As heard in ${tab('Ezy Ryder', 'https://www.songsterr.com/a/wsa/jimi-hendrix-ezy-ryder-chords-s9423')} (Songsterr) and ${tab('Freedom', UG + 'freedom-tabs-395814')}.` },
    { ...cycle, id: 'r-walk', title: 'Thumb chords and the walk-up', part: 'Thumb chords and the walk-up', blend: 'rhythm', seed: 1, preset: HEY_JOE,
      blurb: 'Written for the cycle of fourths and only for it: the chord on one, then root, 3rd, 4th, 5th on the low strings — and the 5th is the next chord’s root because the next chord is a fourth below. In Practice this part opens only with the "Cycle of fourths" progression loaded.',
      refs: `The bass line as an arpeggio whose 5th becomes the new root, from the lesson pages [15] and the search summaries on Hey Joe; as heard in ${tab('Hey Joe', UG + 'hey-joe-tabs-59')}.` },
    { ...cycle, id: 'r-answers', title: 'Double-stop answers between the chords', part: 'Double-stop answers between the chords', blend: 'rhythm', seed: 9,
      blurb: 'The same slow backbeat over any progression: the thumb chord, then 3rds and 4ths out of the box under the shape answering the vocal.' },
    { ...voodoo, id: 'r-wah', title: 'Wah scratch (the intro)', part: 'Wah scratch (the intro)', blend: 'rhythm', seed: 3,
      blurb: 'Dead strings and the pedal: sixteen muted strokes a bar, the beats harder, and every second bar the riff — the bend from the 4th, the pull-off, the 7♯9 stab.',
      refs: `The intro’s muted wah rhythm from Riff Ninja [17] and Wikipedia [4]; as heard in ${tab('Voodoo Child (Slight Return)', UG + 'voodoo-child-slight-return-tabs-326654')}.` },
    { ...rnb, id: 'r-hammered', title: 'Hammered double stops between the chords', part: 'Hammered double stops between the chords', blend: 'rhythm', seed: 8,
      blurb: 'The chord on one, then the hand rolling through the E shape in sixteenths: the 2nd onto the 3rd, the 4th onto the 5th, the 6th down to the 5th.',
      refs: `As heard in ${tab('Wait Until Tomorrow', UG + 'wait-until-tomorrow-tabs-11764')}; the record’s Cropper likeness noted on Wikipedia [14].` },
    { ...rnb, id: 'r-chucks', title: 'Cropper chucks and 6ths', part: 'Cropper chucks and 6ths', blend: 'rhythm', seed: 2,
      blurb: 'The Stax job: a 6th slid into on one, the chord muted on two, the 6th on three, muted on four.', refs: 'From the Cropper lesson [29].' },
    { ...waltz, id: 'r-waltz', title: 'Unison riff with the bass (3/4)', part: 'Unison riff with the bass', blend: 'rhythm', seed: 5,
      blurb: 'Three to the bar and three to the beat: the riff on the low strings the bass doubles, a chromatic step into each chord, the middle of the beat left empty.',
      refs: `Mitchell’s jazz-waltz feel from DRUM! [22] and Wikipedia [12b]; the 3/4 riff from Guitar Control [18]; as heard in ${tab('Manic Depression', UG + 'manic-depression-tabs-11736')}.` },
  ];

  const LEAD = [
    { ...soul, id: 'l-leslie', title: 'Chord-melody lead (the Leslie lead)', part: 'Chord-melody lead (the Leslie lead)', blend: 'lead', seed: 7, reading: 'penta',
      blurb: 'The minor pentatonic on the top three strings with the 9th and the major 3rd let in, double stops between phrases, a slide into the box above and back, wide vibrato, a unison bend at the top.',
      refs: 'The solo’s Leslie speaker and the chord-melody basis from Wikipedia [3].' },
    { ...fuzz, id: 'l-fuzz', title: 'Fuzz lead over the vamp', part: 'Fuzz lead over the vamp', blend: 'lead', seed: 12, window: windowAt(12),
      blurb: 'The box at the 12th fret: the minor pentatonic with the Dorian 6th and the major 3rd free against it, the unison bend, the trill, the rake, the step-and-a-half bend shaken.',
      refs: 'Mermikides on the Dorian solo of Purple Haze [1]; MusicRadar on unison bends, catch bends and the wrist vibrato [10].' },
    { ...blues, id: 'l-vocal', title: 'Vocal blues lead (major and minor mixed)', part: 'Vocal blues lead (major and minor mixed)', blend: 'lead', seed: 4,
      blurb: 'The box at the 7th fret in B: the 4th bent to the 5th and shaken, Albert King’s step-and-a-half, the major 3rd against the minor pentatonic, triplet pull-offs, and a beat of silence.',
      refs: 'Red House’s major-and-minor mix from [16b]; its Albert King and Elmore James roots from [6].' },
    { ...funk, id: 'l-funk', title: 'Funk lead with the wah', part: 'Funk lead with the wah', blend: 'lead', seed: 3,
      blurb: 'The pedal following the phrase, the Dorian colour, double-stop chucks between phrases, the trill, a climb into the box above.' },
    { ...cycle, id: 'l-twelfth', title: 'Blues-scale lead at the 12th', part: 'Blues-scale lead at the 12th', blend: 'lead', seed: 6, window: windowAt(12),
      blurb: 'The E minor blues scale from the box at the 12th fret over the cycle’s major chords: the B string bent a full step and shaken, the ♭5 passing.',
      refs: 'The 12th-fret blues scale and the full-step bend on the 15th fret of the B string, from Jon MacLennan’s lesson [15].' },
    { ...voodoo, id: 'l-machine', title: 'Machine-gun lead', part: 'Machine-gun lead', blend: 'lead', seed: 9, window: windowAt(12),
      blurb: 'The note repeated like a rifle, the step-and-a-half bend held, notes that last a bar, the climb into the box above and the drop back.',
      refs: 'Machine Gun’s battlefield of feedback and percussive riffs, from Wikipedia [11b]; Hanford on Band of Gypsys [2].' },
    { ...rnb, id: 'l-rnb', title: 'R&B fills in the major pentatonic', part: 'R&B fills in the major pentatonic', blend: 'lead', seed: 2, reading: 'penta',
      blurb: 'The sweet register: the major pentatonic from the shape, the 6th and the 9th on top, 3rds coming down, the 2nd bent to the 3rd.' },
    { ...waltz, id: 'l-waltz', title: 'Rolling lead in triplets', part: 'Rolling lead in triplets', blend: 'lead', seed: 5,
      blurb: 'Pentatonic triplets alternate-picked, ghost notes in the middle of the beat, a whole-step bend on the downbeat, a run up into the box above.' },
  ];

  const MIXED = [
    { ...soul, id: 'm-split', title: 'The split chord, with its lead lines', part: 'Thumb bass and the split chord', blend: 'mixed', seed: 21,
      blurb: 'The rhythm part with the blend on Mixed: the figure, and in about half the fill bars the melody the chord already had.' },
    { ...fuzz, id: 'm-stabs', title: 'The Hendrix chord, with its lead lines', part: '7♯9 stabs and the riff', blend: 'mixed', seed: 17,
      blurb: 'The stabs and the riff, and the fuzz lines — a unison bend, a rake into the high root — in the fill bars.' },
    { ...blues, id: 'm-call', title: 'Call and answer (stabs and licks)', part: 'Call and answer (stabs and licks)', blend: 'mixed', seed: 5,
      blurb: 'Both jobs in one hand, as he comped his own blues: the 9th chord as a stab, a lick in the box answering, silence.' },
    { ...funk, id: 'm-scratch', title: 'The scratch, with its lead lines', part: 'Sixteenth scratch with the wah', blend: 'mixed', seed: 13,
      blurb: 'The wah scratch, and a wah line in the fill bars.' },
    { ...rnb, id: 'm-hammered', title: 'Hammered double stops, with its lead lines', part: 'Hammered double stops between the chords', blend: 'mixed', seed: 19,
      blurb: 'The R&B rhythm with the fills a sideman plays between the singer’s lines.' },
  ];

  const EXERCISES = [
    { ...soul, id: 'x1', title: '1. The thumb and the split chord, plain', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7, easy: true, tempo: 60,
      blurb: 'The beginner’s version: the bass note under the thumb on one and three, the D–G–B triad on the "and". Get the two strokes to sound like one hand before adding anything.' },
    { ...soul, id: 'x2', title: '2. The hammered colours', part: 'Thumb bass and the split chord', blend: 'rhythm', seed: 7, tempo: 62,
      blurb: 'Now the 4th on the G string, the 9th on the top string, the 6th on the B — hammered, with the chord still ringing under them. Slow, and clean.' },
    { ...soul, id: 'x3', title: '3. Sliding 6ths', part: 'Sliding 6ths and rolling hammer-ons (the Mayfield way)', blend: 'rhythm', seed: 3, tempo: 64,
      blurb: 'Two strings a string apart, the lower note slid into from a fret below. The 6th is the sound of Stax and of Mayfield; the roll (2nd to 3rd, 4th to 5th) comes after.' },
    { ...fuzz, id: 'x4', title: '4. The Hendrix chord', part: '7♯9 stabs and the riff', blend: 'rhythm', seed: 5, easy: true, tempo: 90,
      blurb: 'x-7-6-7-8-x with the thumb free to mute the low E. Strike it on one, let it ring, play the riff in eighths under your palm.' },
    { ...voodoo, id: 'x5', title: '5. Minor over major', part: 'Pentatonic riff with the octave drop', blend: 'rhythm', seed: 3, tempo: 76,
      blurb: 'The E minor pentatonic over E7♯9: bend the 4th to the 5th and let it back, pull off to the ♭3, land on the root. The ♭3 against the chord’s major 3rd is the point.' },
    { ...blues, id: 'x6', title: '6. The 9th chord and the trill', part: '9th chords with the trill', blend: 'rhythm', seed: 2, tempo: 54,
      blurb: 'The grip slid in from a fret below on three, the 3rd trilled against the 4th on the way to the IV. Keep the triplets lazy.' },
    { ...blues, id: 'x7', title: '7. The bends: a step, a step and a half', part: 'Vocal blues lead (major and minor mixed)', blend: 'lead', seed: 4, tempo: 52,
      blurb: 'The 4th to the 5th (a whole step) shaken; the 4th to the 6th (a step and a half). Match the pitch to the fretted note first, then add the wrist.' },
    { ...fuzz, id: 'x8', title: '8. The unison bend and the climb', part: 'Fuzz lead over the vamp', blend: 'lead', seed: 12, window: windowAt(12), tempo: 84,
      blurb: 'The B string bent a whole tone to the note held on the E string, rough then smooth; then the slide up into the box above and the drop back.' },
    { ...funk, id: 'x9', title: '9. The wah with the pick', part: 'Sixteenth scratch with the wah', blend: 'rhythm', seed: 4, tempo: 88,
      blurb: 'Sixteen muted strokes a bar, toe down on the downstrokes, heel on the upstrokes; the chord lands on the "and of 2".' },
    { ...cycle, id: 'x10', title: '10. The walk-up, root to root', part: 'Thumb chords and the walk-up', blend: 'rhythm', seed: 1, tempo: 66, preset: HEY_JOE,
      blurb: 'Root, 3rd, 4th, 5th on the low strings into each new chord. Say the next root as you land on it.' },
  ];

  // whole forms: the changes from the songs, a part realised over them
  const STUDIES = [
    { id: 'st1', title: 'Study in E minor: the ballad', feel: 'Soul ballad (chord melody)', part: 'Thumb bass and the split chord', key: 'E', mode: 'minor', tempo: 70, blend: 'mixed', seed: 31, window: windowAt(0), reading: 'scale', preset: preset('Soul ballad (Little Wing)'),
      chords: ['Em', 'G', 'Am', 'Em', 'Bm', 'Bb', 'Am', 'C', 'G', 'F', 'C', 'D'].map(name => ({ name })),
      blurb: 'The twelve bars Little Wing runs on — the minor key’s own chords, the B♭ a tritone from the tonic, the ♭II — with the split-chord part over them and its lead lines rolled in. Follow the thumb.' },
    { id: 'st2', title: 'Study in E: the fuzz vamp', feel: 'Fuzz riff (the Hendrix chord)', part: '7♯9 stabs and the riff', key: 'E', tempo: 108, blend: 'mixed', seed: 17, window: E_FUZZ, reading: 'penta', preset: preset('Fuzz vamp (Purple Haze)'),
      chords: [{ name: 'E7#9', bars: 2 }, { name: 'G' }, { name: 'A' }],
      blurb: 'I7♯9–♭III–IV, twice: the Hendrix chord as home, the two major chords a minor third and a fourth above it.' },
    { id: 'st3', title: 'Study in B: twelve slow bars', feel: 'Slow blues in 12/8 (Red House way)', part: 'Call and answer (stabs and licks)', key: 'B', tempo: 60, blend: 'mixed', seed: 5, window: windowAt(7), reading: 'penta', preset: preset('Slow blues in 12/8 (Red House)'),
      chords: [{ name: 'B7', bars: 4 }, { name: 'E9', bars: 2 }, { name: 'B7', bars: 2 }, { name: 'F#7' }, { name: 'E9' }, { name: 'B7' }, { name: 'F#7' }],
      blurb: 'The Red House form, the IV as a 9th, the turnaround on the last two bars. Stabs, licks and room.' },
    { id: 'st4', title: 'Study in E: the cycle', feel: 'Cycle of fourths (Hey Joe way)', part: 'Thumb chords and the walk-up', key: 'E', tempo: 82, blend: 'mixed', seed: 1, window: windowAt(0), reading: 'penta', preset: HEY_JOE,
      chords: [{ name: 'C' }, { name: 'G' }, { name: 'D' }, { name: 'A' }, { name: 'E', bars: 2 }],
      blurb: 'C–G–D–A–E and round again, the walk-up landing on every new root.' },
    { id: 'st5', title: 'Study in C: the funk', feel: 'Funk rock (Band of Gypsys)', part: 'Single-note funk riff with muted ghosts', key: 'C', tempo: 104, blend: 'mixed', seed: 6, window: windowAt(8), reading: 'penta', preset: preset('Funk (Freedom)'),
      chords: [{ name: 'C' }, { name: 'Eb' }, { name: 'C7' }, { name: 'F7' }],
      blurb: 'The Freedom changes, the riff doubling the bass, the lead lines in the fill bars.' },
  ];

  // ---- the songs ----
  const SONGS = [
    { title: 'Little Wing', linkKey: 'E', linkMode: 'minor', bpm: 70, album: 'Axis: Bold as Love, 1967', key: 'E minor (fingered), 70–72 BPM, 4/4 with one bar of 2/4', preset: 'Soul ballad (Little Wing)',
      what: 'Em–G–Am–Em–Bm–B♭–Am–C–G–Fadd9–C–D: the minor key’s chords with a B♭ a tritone from the tonic and an F a semitone above it. The intro is the chord-melody at its purest — thumb bass, the split chord, the hammered 4ths and 9ths, double stops from the pentatonic, and a swing that moves phrase to phrase (Mermikides measures it between even and heavily swung). Recorded in E♭; the rhythm guitar with the pickup between neck and middle, the lead through a Leslie; Hendrix called it "a very, very simple Indian style".',
      cites: '[1] [3] [8]', tab: UG + 'little-wing-tabs-31788', tab2: 'https://www.songsterr.com/a/wsa/jimi-hendrix-little-wing-tab-s22572' },
    { title: 'The Wind Cries Mary', linkKey: 'F', bpm: 78, album: 'Are You Experienced, 1967', key: 'F major (fingered)', preset: 'Chromatic soul (The Wind Cries Mary)',
      what: 'E♭5–E5–F5 up the neck a fret at a time to open, then C–B♭–F in the verse, G and B♭ on the way round, A♭ and D♭ in the solo. The 6th embellishment on the E shape is the rhythm part; the solo is the F major pentatonic in 12th position with double stops. Billy Cox names Mayfield as the influence.',
      cites: '[15c] [16c] [10b]', tab: UG + 'the-wind-cries-mary-tabs-64118' },
    { title: 'Castles Made of Sand', linkKey: 'G', bpm: 76, album: 'Axis: Bold as Love, 1967', key: 'G major (Mixolydian), fingered', preset: 'Mixolydian ballad (Castles Made of Sand)',
      what: 'G–D–F–C in the chorus — the F is the ♭VII, so the key is G Mixolydian — with F, Am and Em7 in the verses. The intro slides a shape of stacked fifths along the neck; the last chord of the intro is only Gs and Ds, doubled, and reads as more than its two pitch classes. The solo is backwards guitar. Cox and the critics hear Mayfield in it.',
      cites: '[1] [13] [7]', tab: UG + 'castles-made-of-sand-tabs-982787' },
    { title: 'Bold as Love', linkKey: 'A', bpm: 84, album: 'Axis: Bold as Love, 1967', key: 'A major (fingered), heard in A♭', preset: 'R&B ballad (Bold as Love)',
      what: 'A–E–F♯m–D in the verse, E–F♯–G–A into the chorus with a VI major and a ♭VII, a "masterclass in chordal embellishment" on the E shape with the thumb. The coda is the first phased drums on a record.',
      cites: '[32] [11] [9b]', tab: UG + 'bold-as-love-tabs-718945', tab2: 'https://www.songsterr.com/a/wsa/jimi-hendrix-bold-as-love-chords-s22542' },
    { title: 'Hey Joe', linkKey: 'E', bpm: 82, album: 'single, 1966', key: 'E major with borrowed chords, about 82 BPM', preset: 'Cycle of fourths (Hey Joe)',
      what: 'C–G–D–A–E, each chord a fourth below the last, the circle of fifths read backwards, two bars of E at the end. The bass walks root, 3rd, 4th, 5th into each new chord and the 5th is the new root; the guitar doubles that walk in places and answers the vocal with double stops. The solo is the E minor blues scale at the 12th fret. Modelled on Tim Rose’s slow arrangement of Billy Roberts’ song.',
      cites: '[15] [9c]', tab: UG + 'hey-joe-tabs-59' },
    { title: 'Purple Haze', linkKey: 'E', bpm: 108, album: 'Are You Experienced, 1967', key: 'E (fingered), about 108 BPM', preset: 'Fuzz vamp (Purple Haze)',
      what: 'The intro locks E against B♭ — a tritone, repeated rather than resolved; the verse is E7♯9–G–A; the solo runs Dorian over E5, F♯5 and D5 through the Octavia. The E7♯9 is an all-interval tetrachord: every interval class in four notes. The riff is the E minor pentatonic with the ♭5, muted, doubled with the bass.',
      cites: '[1] [4b] [15b]', tab: UG + 'purple-haze-tabs-25' },
    { title: 'Foxy Lady', linkKey: 'Gb', bpm: 116, album: 'Are You Experienced, 1967', key: 'F♯ (fingered), F♯ Dorian by one analysis', preset: 'One-chord vamp (Voodoo Child)',
      what: 'Feedback summoned "from thin air by just vibrato alone", then the F♯7♯9 riff — played without its major 3rd here — and a solo of bent notes and slides in the blues scale. The ending’s IV chord was Noel Redding’s idea.',
      cites: '[16] [1]', tab: UG + 'foxy-lady-tabs-28416' },
    { title: 'Voodoo Child (Slight Return)', linkKey: 'E', bpm: 88, album: 'Electric Ladyland, 1968', key: 'E (fingered), about 88 BPM', preset: 'One-chord vamp (Voodoo Child)',
      what: 'A wah-wah intro of muted strings on a clean tone ("a West African even-before-Bo-Diddley beat"), then the fuzz and the riff: the 4th on the G string bent to the 5th and released, the pull-off to the open G, the E7♯9 stabs. All the lead work is E minor pentatonic over E major and E7♯9. Mermikides: a pinch harmonic held on a fixed wah gliding through the blue 5th while the pickup selector is toggled in rhythm.',
      cites: '[4] [17] [1]', tab: UG + 'voodoo-child-slight-return-tabs-326654' },
    { title: 'Red House', linkKey: 'B', bpm: 66, album: 'Are You Experienced, 1967', key: 'B (fingered; heard in B♭), 12/8, 66 BPM', preset: 'Slow blues in 12/8 (Red House)',
      what: 'A twelve-bar slow blues opening on a diminished 7th, the IV as E9, the V as F♯7; the comp is the 7th and 9th grips, the lead "packed solid with vocalisms" — bends, glissandos, jumps, drops. Written from Albert King’s "Travelin’ to California" and Elmore James’s "The Sky Is Crying"; Noel Redding played a tuned-down hollow-body as the bass.',
      cites: '[6] [16b] [19]', tab: UG + 'red-house-tabs-14113' },
    { title: 'Machine Gun', album: 'Band of Gypsys, 1970 (live, Fillmore East)', key: 'E minor, a core descending riff', preset: null,
      what: 'A jam on one descending riff and bass line, the guitar through wah, Fuzz Face, Uni-Vibe and Octavia, feedback shaped into helicopters and shellfire, the Uni-Vibe riff a machine gun. Hanford’s dissertation reads it as "a unique fusion of traditional blues and electronic sound painting".',
      cites: '[11b] [2] [21]', tab: UG + 'machine-gun-tabs-372266' },
    { title: 'Manic Depression', linkKey: 'A', bpm: 140, album: 'Are You Experienced, 1967', key: 'A (fingered), 3/4 with a triplet feel', preset: 'Waltz riff (Manic Depression)',
      what: 'A–G–D–D♯–E with a parallel guitar and bass line; Mitchell built the drum part on Ronnie Stephenson’s "African Waltz", a churning triplet feel "that could just as easily be transcribed in 9/8". The riff runs quarter notes up the A string, then eighths.',
      cites: '[12b] [22] [18]', tab: UG + 'manic-depression-tabs-11736' },
    { title: 'All Along the Watchtower', linkKey: 'C#', linkMode: 'minor', bpm: 112, album: 'Electric Ladyland, 1968', key: 'C♯ minor (fingered; heard in C minor)', preset: 'Minor rock (All Along the Watchtower)',
      what: 'C♯m–B–A–B, two beats each, the C♯m often voiced as C♯m7 to free the pinky; the intro slides from the 10th to the 12th fret and bends whole tones with vibrato; the solos come from the C♯ minor blues scale at the 9th with Dorian notes, unison bends, half-, whole- and step-and-a-half bends and a "floaty" vibrato.',
      cites: '[15d] [10]', tab: UG + 'all-along-the-watchtower-tabs-49' },
    { title: 'Wait Until Tomorrow', linkKey: 'E', bpm: 118, album: 'Axis: Bold as Love, 1967', key: 'E (fingered; heard in E♭), about 118 BPM', preset: 'Fuzz vamp (Purple Haze)',
      what: 'A/E and G/E in the intro, E–G–A in the chorus, "lots of licks in between the chords" — hammer-ons and pull-offs at the 9th to 11th frets — a bass-and-guitar duet as the core riff, "stylistically similar to Steve Cropper".',
      cites: '[14] [11]', tab: UG + 'wait-until-tomorrow-tabs-11764' },
    { title: 'Freedom', linkKey: 'C', bpm: 104, album: 'The Cry of Love, 1971', key: 'C (fingered), E♭ tuning', preset: 'Funk (Freedom)',
      what: 'C, E♭, C7 and F7; the intro is two chords and a walking lick on the low E and A strings; the solo shows "jazz harmonic sensibility". The last year’s funk, with Billy Cox on bass.',
      cites: '[19] [3]', tab: UG + 'freedom-tabs-395814' },
    { title: 'Spanish Castle Magic', album: 'Axis: Bold as Love, 1967', key: 'descending power chords, heard a half-step down', preset: null,
      what: 'Guitar and bass in unison on the riff — which "locks up a song in a strong rhythmic voice" — open strings inside the power chords, jazz chords overdubbed on piano, a solo of "a large number of note bends" ending on "a crazy double-stop".',
      cites: '[13b]', tab: UG + 'spanish-castle-magic-tabs-83455' },
  ];
  // the song's changes in Practice: the preset by name, in the song's key
  const presetLink = s => {
    const hendrix = GT.progressionPresets.find(p => p.name === 'Hendrix');
    const v = hendrix && hendrix.variants.find(x => x.name === s.preset);
    if (!v || !s.linkKey) return '';
    const p = new URLSearchParams();
    p.set('k', `${s.linkMode || 'major'}:${s.linkKey}`);
    p.set('pr', `Hendrix|${s.preset}`);
    if (s.bpm) p.set('t', String(s.bpm));
    return `index.html#practice?${p.toString()}`;
  };
  function renderSongs(){
    $('songs').innerHTML = SONGS.map(s => `
      <div class="song"><h4>${esc(s.title)}</h4>
        <p class="facts">${esc(s.album)} · ${esc(s.key)}</p>
        <p>${esc(s.what)} <span class="cite">${esc(s.cites)}</span></p>
        <p class="links">${s.tab ? `<a href="${s.tab}">Ultimate Guitar tab</a>` : ''}${s.tab2 ? ` · <a href="${s.tab2}">Songsterr</a>` : ''}${presetLink(s) ? ` · <a href="${presetLink(s)}">the changes in Practice →</a>` : ''}</p>
      </div>`).join('');
  }

  // ---- the sources ----
  const SOURCES = [
    ['src-gresham', '1', 'Mermikides, M. (2025). <b>"Just Ask the Axis: Jimi Hendrix Unpicked"</b>, Gresham College lecture transcript, 20 March 2025. Read.', 'https://www.gresham.ac.uk/sites/default/files/transcript/2025-02-25_1307_Mermikides-T.pdf'],
    ['src-hanford', '2', 'Hanford, J. C. (2003). <b>"With the power of soul: Jimi Hendrix in Band of Gypsys"</b>, PhD dissertation, University of Washington. Abstract and description read; the full text (51 MB) was downloaded but had no extractable text.', 'https://digital.lib.washington.edu/researchworks/items/98cb7e1f-4526-46cf-aaf3-ed28a1ecf35f'],
    ['src-storey', '3', 'Storey, A. (2014). <b>Jimi Hendrix playing analysis</b> (Licentiate thesis, London College of Music). Read. Also: Wikipedia, <b>"Little Wing"</b> (key, tempo, form, Leslie, the Mayfield blueprint). Read.', 'https://arronstorey.com/jimi-hendrix-playing-analysis/'],
    ['src-wiki-voodoo', '4', 'Wikipedia, <b>"Voodoo Child (Slight Return)"</b>. Read. [4b] Wikipedia, <b>"Purple Haze"</b> (the tritone intro, E7♯9, the verse chords, the Octavia). Read.', 'https://en.wikipedia.org/wiki/Voodoo_Child_(Slight_Return)'],
    ['src-wiki-7s9', '5', 'Wikipedia, <b>"Dominant seventh sharp ninth chord"</b>. Read.', 'https://en.wikipedia.org/wiki/Dominant_seventh_sharp_ninth_chord'],
    ['src-red-house', '6', 'Wikipedia, <b>"Red House (song)"</b> (key, 12/8, the tuning, the opening chord, Albert King and Elmore James). Read. [6b] Guitar Player, <b>"Jimi Hendrix: The Five Rules of His Powerful Rhythm Style"</b>. Two rules read; the rest truncated.', 'https://en.wikipedia.org/wiki/Red_House_(song)'],
    ['src-pg-mayfield', '7', 'Premier Guitar, <b>"Digging Deeper: Curtis Mayfield"</b> and <b>"Forgotten Heroes: Curtis Mayfield"</b> (the F♯ tuning, sliding 6ths and 4ths, rolling hammer-ons, Cox on Hendrix). Read. [7b] Premier Guitar, <b>"Hendrix Rhythms Made Easy"</b>. Read.', 'https://www.premierguitar.com/digging-deeper-curtis-mayfield'],
    ['src-happy', '8', 'Happy Bluesman, <b>"Jimi Hendrix Rhythm Guitar: 3 Steps to Blur the Lines Between Rhythm and Lead"</b> (the D–G–B triad, the pinky’s sus4, 6 and add9, the thumb). Read.', 'https://happybluesman.com/jimi-hendrix-rhythm-guitar-3-steps-mix-rhythm-and-lead/'],
    ['src-blackstar', '9', 'Blackstar Amps, <b>"Mixing Rhythm &amp; Lead — Hendrix Style Embellishments"</b> (the chords as triads on D, G and B with the thumb; each chord’s pentatonic box). Read. [9b] Wikipedia, <b>"Bold as Love (song)"</b>. Read. [9c] Wikipedia, <b>"Hey Joe"</b>. Read.', 'https://blackstaramps.com/lessons/mixing-rhythm-lead-hendrix-style-embellishments/'],
    ['src-musicradar-lead', '10', 'MusicRadar, <b>"The ultimate Jimi Hendrix lead guitar lesson"</b> (unison bends, staccato and catch bends, the wrist vibrato, the E Dorian drone, the wah). Read. [10b] MusicRadar, <b>"Learn the ultimate Jimi Hendrix rhythm guitar chord lesson"</b>. Read.', 'https://www.musicradar.com/how-to/the-ultimate-jimi-hendrix-lead-guitar-lesson'],
    ['src-pickup', '11', 'Pickup Music, <b>"Hendrix CAGED"</b> (the course’s shape-by-shape map to the records). Read. [11b] Wikipedia, <b>"Machine Gun (Jimi Hendrix song)"</b>. Read.', 'https://www.pickupmusic.com/guitar/guitar-classes/hendrix-caged'],
    ['src-thumb', '12', 'guitarwiz.app, <b>"Thumb-Over Guitar Technique: The Hendrix Approach to Chord Grips"</b>. Read. [12b] Wikipedia, <b>"Manic Depression (song)"</b>. Read.', 'https://guitarwiz.app/articles/thumb-over-guitar-technique/'],
    ['src-castles', '13', 'Wikipedia, <b>"Castles Made of Sand (song)"</b>. Read. [13b] Wikipedia, <b>"Spanish Castle Magic"</b>. Read.', 'https://en.wikipedia.org/wiki/Castles_Made_of_Sand_(song)'],
    ['src-wait', '14', 'Wikipedia, <b>"Wait Until Tomorrow"</b>. Read.', 'https://en.wikipedia.org/wiki/Wait_Until_Tomorrow'],
    ['src-mac-heyjoe', '15', 'MacLennan, J., <b>Hey Joe guitar lesson</b> (the open chords, the walk, the E minor blues scale at the 12th). Read. [15b] <b>Purple Haze guitar lesson</b>. Read. [15c] <b>Wind Cries Mary guitar lesson</b>. Read. [15d] <b>All Along the Watchtower guitar lesson</b>. Read.', 'https://www.jonmaclennan.com/blog/hey-joe-guitar-lesson'],
    ['src-wiki-foxy', '16', 'Wikipedia, <b>"Foxy Lady"</b>. Read. [16b] guitarclub.io, <b>"Red House"</b> lesson (the twelve bars with 7ths and 9ths, B minor and major pentatonic layered). Read. [16c] guitarclub.io, <b>"The Wind Cries Mary"</b> lesson. Read.', 'https://en.wikipedia.org/wiki/Foxy_Lady'],
    ['src-riffninja', '17', 'Riff Ninja, <b>"Voodoo Child Guitar Lesson"</b> (E♭ tuning, the minor-third lick, the bend-release-pull-off, Eaug9, E minor pentatonic over major chords). Read. [17b] Ultimate Guitar wiki, <b>Voodoo Child (Slight Return)</b>. Summary.', 'https://www.riffninja.com/voodoo-child-guitar-lesson/'],
    ['src-guitarcontrol', '18', 'Guitar Control, <b>"How to Play Manic Depression"</b> (3/4, the riff up the A string, the picking). Read.', 'https://guitarcontrol.com/how-to-play-manic-depression/'],
    ['src-wiki-jimi', '19', 'Wikipedia, <b>"Jimi Hendrix"</b> (the Isley Brothers, Little Richard, Don Covay, King Curtis, the effects). Read. Also Texas Blues Alley, <b>Red House 3:01</b>, <b>Killing Floor intro</b> and <b>Freedom intro chords</b> lesson pages (key and tuning notes). Read.', 'https://en.wikipedia.org/wiki/Jimi_Hendrix'],
    ['src-fender', '20', 'Fender, <b>"Purple Reign: The Hendrix Chord"</b>. Summary only (the page refused the tools); the Isleys’ "Testify" and "Taxman" history is also in [5].', 'https://www.fender.com/articles/chords/purple-reign-the-hendrix-chord'],
    ['src-cox', '21', 'Rock Cellar Magazine, <b>"Remembering Jimi Hendrix and the Band of Gypsys: Q&amp;A with Billy Cox"</b>. Read. Mitchell’s Mayfield remark is quoted in the search summary of the Vintage Guitar Curtis Mayfield feature and Guitar World’s Woodstock piece (summary).', 'https://rockcellarmagazine.com/billy-cox-interview-jimi-hendrix-band-of-gypsys-woodstock/'],
    ['src-drum', '22', 'DRUM! Magazine, <b>"Mitch Mitchell: Transcription &amp; Analysis"</b>. Read. Also PS Audio, <b>"The Jimi Hendrix Experience: The Other Two Guys"</b>. Read.', 'https://drummagazine.com/mitch-mitchell-transcription-analysis/'],
    ['src-osu', '23', 'The Ohio State University, AAEP 1600, <b>"Jimi Hendrix"</b> chapter. Read. Berklee College of Music, <b>ENRK-204 The Music of Jimi Hendrix</b>, course page. Read.', 'https://aaep1600.osu.edu/book/09_Hendrix.php'],
    ['src-cambridge', '24', 'Herbst, J.-P. and Waksman, S. (eds.) (2024). <b>The Cambridge Companion to the Electric Guitar</b>, Part III "Musical Style and Technique". Abstract only.', 'https://www.cambridge.org/core/books/abs/cambridge-companion-to-the-electric-guitar/musical-style-and-technique/3E904834A028EA69A785CD7F1C46FA99'],
    ['src-obrecht', '25', 'Obrecht, J., <b>"How Jimi Learned to Play Guitar Pt. 1"</b>, Line 6 blog. Read.', 'https://blog.line6.com/2022/06/01/jas-obrecht-how-jimi-learned-to-play-guitar-pt-1-earliest-music-first-guitars/'],
    ['src-kramer', '26', 'Best Classic Bands, <b>"Jimi Hendrix Engineer Eddie Kramer Remembers"</b>. Read.', 'https://bestclassicbands.com/eddie-kramer-jimi-hendrix-interview-9-21-22/'],
    ['src-aadl', '27', 'Ann Arbor District Library, <b>"Interview: Jimi Hendrix"</b>, Ann Arbor Sun, September 1967. Read.', 'https://aadl.org/node/192571'],
    ['src-truefire', '28', 'TrueFire blog, <b>"Jimi Hendrix: All the Way to Ladyland"</b> and <b>"Mastering Hendrix Guitar Techniques"</b>. Read. Also learningtoplaytheguitar.net, <b>"7 Essential Jimi Hendrix Guitar Techniques"</b>. Read.', 'https://blog.truefire.com/guitar-lessons/jimi-hendrix-ladyland/'],
    ['src-cropper', '29', '<b>"How to Play Like Steve Cropper"</b>, Guitar Player feature as a lesson PDF on the Savonia University of Applied Sciences course blog. Read.', 'https://blogi.savonia.fi/afroblues/wp-content/uploads/sites/7040/2019/11/Steve-Cropper.pdf'],
    ['src-gwu', '30', 'George Washington University Law School, Music Copyright Infringement Resource, <b>"Chord"</b>. Read. [30b] Structured Asset Sales v. Sheeran, Second Circuit 2024, via Rolling Stone and Copyright Lately (summaries); Local 802 AFM, <b>"Can you copyright a chord progression?"</b>. Read.', 'https://blogs.law.gwu.edu/mcir/2018/12/20/chord/'],
    ['src-hein', '31', 'Hein, E., <b>"Jimi Hendrix, electronic musician"</b>. Read.', 'https://ethanhein.substack.com/p/jimi-hendrix-electronic-musician'],
    ['src-songsterr', '32', 'Songsterr, <b>Bold as Love</b> (chords by section) and <b>Ezy Ryder</b> (chords). Read. Ultimate Guitar tab pages: linked; the tool could not read them.', 'https://www.songsterr.com/a/wsa/jimi-hendrix-bold-as-love-chords-s22542'],
    ['src-hooktheory', '33', 'Hooktheory, <b>Crosstown Traffic</b> analysis (C Dorian, 115 BPM). Summary only; the page refused the tools. Guitar World’s lessons on Hendrix’s rhythm and lead playing were likewise behind a wall and are not relied on.', 'https://www.hooktheory.com/theorytab/view/jimi-hendrix/crosstown-traffic'],
  ];
  function renderSources(){
    $('sources').innerHTML = SOURCES.map(([id, num, text, url]) => `<li id="${id}" value="${num}">${text} <a href="${url}">${url}</a></li>`).join('');
  }

  // ---- the page ----
  function render(){
    $('toc').innerHTML = [...document.querySelectorAll('section.part h2')].map(h => `<a href="#${h.parentElement.id}">${esc(h.textContent)}</a>`).join('');
    renderGrips();
    RHYTHM.forEach(ex => card($('rhythm'), ex));
    LEAD.forEach(ex => card($('lead'), ex));
    MIXED.forEach(ex => card($('mixed'), ex));
    EXERCISES.forEach(ex => card($('exercises'), ex));
    STUDIES.forEach(ex => card($('studies'), ex));
    renderSongs();
    renderSources();
  }
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/input|select|textarea/i.test(e.target.tagName)){ e.preventDefault(); if (playing()) stop(); } });
  render();
  let resizeTimer = 0, drawnWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth !== drawnWidth){ drawnWidth = window.innerWidth; if (playing()) stop(); ['rhythm', 'lead', 'mixed', 'exercises', 'studies'].forEach(id => { $(id).innerHTML = ''; }); render(); } }, 200);
  });

  GT.hendrixGuide = { RHYTHM, LEAD, MIXED, EXERCISES, STUDIES, SONGS, SOURCES, GRIPS, practiceLink, realiseExample };
})();
