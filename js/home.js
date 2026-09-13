// The landing page: what the site has, each tool with a way in and a few
// places worth going straight to — a particular jam with a part already
// playing, a chord worth looking at in the finder, a grip to identify, a
// scale to hear, a drill, a lesson. The links are built here from the
// presets, styles and parts as they are, so a renamed preset or part
// cannot leave a dead link behind, and a test holds that every one of them
// resolves.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // ---- a jam, as the Jam tab's share link writes it ----
  // key and mode, the preset and its variant by name, the feel by its label,
  // the part by its name, the tempo; the part's roll is one fixed seed so the
  // link always opens on the same bars
  function jamLink({ key, mode = 'major', preset, variant = '', style, feel, part, tempo, seed = 7 }){
    const p = new URLSearchParams();
    p.set('k', `${mode}:${key}`);
    p.set('pr', `${preset}|${variant}`);
    p.set('t', String(tempo));
    const S = GT.audio && GT.audio.STYLES;
    const fi = S && S[style] ? S[style].variants.findIndex(v => v.label === feel) : -1;
    p.set('s', `${style}.${Math.max(0, fi)}`);
    if (part){
      const idx = GT.parts ? GT.parts.partsFor(style, feel).findIndex(x => x.name === part) : -1;
      p.set('p', `${Math.max(0, idx)}.f.${seed}`);
    }
    return `#jam?${p.toString()}`;
  }
  const finderLink = (chord, opts = {}) => `#chord-finder?${new URLSearchParams({ c: chord, ...opts }).toString()}`;
  const reverseLink = grip => `#reverse-chord-finder?${new URLSearchParams({ n: grip }).toString()}`;
  const earLink = params => `#ear-training?${new URLSearchParams(params).toString()}`;
  const drillsLink = params => `#drills?${new URLSearchParams(params).toString()}`;

  // ---- the sections ----
  function sections(){
    return [
      { id: 'jam', title: 'Jam', tab: 'caged', open: '#jam',
        blurb: 'A band in any key, feel and tempo, with a written guitar part over it — the chords as a chart or as tab, lit on the neck as it goes.',
        tries: [
          { label: 'A twelve-bar blues in A, shuffle at 100, the 5–6 boogie', href: jamLink({ key: 'A', preset: 'Blues', variant: '12-bar', style: 'blues', feel: 'Blues shuffle', part: '5–6 boogie', tempo: 100 }), jam: { preset: 'Blues', variant: '12-bar', style: 'blues', feel: 'Blues shuffle', part: '5–6 boogie' } },
          { label: 'Purple Haze’s changes with the Hendrix chord stabs, 108', href: jamLink({ key: 'E', preset: 'Hendrix', variant: 'Fuzz vamp (Purple Haze)', style: 'hendrix', feel: 'Fuzz riff (the Hendrix chord)', part: '7♯9 stabs and the riff', tempo: 108 }), jam: { preset: 'Hendrix', variant: 'Fuzz vamp (Purple Haze)', style: 'hendrix', feel: 'Fuzz riff (the Hendrix chord)', part: '7♯9 stabs and the riff' } },
          { label: 'The rockabilly twelve in E, boom-chicka at 176', href: jamLink({ key: 'E', preset: 'Psychobilly', variant: 'Rockabilly twelve (the Sun way)', style: 'psychobilly', feel: 'Boom-chicka (the Sun way)', part: 'Boom-chicka with the 6th', tempo: 176 }), jam: { preset: 'Psychobilly', variant: 'Rockabilly twelve (the Sun way)', style: 'psychobilly', feel: 'Boom-chicka (the Sun way)', part: 'Boom-chicka with the 6th' } },
          { label: 'A jazz turnaround in D as a bossa nova, the batida', href: jamLink({ key: 'D', preset: 'Jazz turnaround', style: 'jazz', feel: 'Bossa nova', part: 'The batida, two bars', tempo: 120 }), jam: { preset: 'Jazz turnaround', variant: '', style: 'jazz', feel: 'Bossa nova', part: 'The batida, two bars' } },
          { label: 'The Andalusian cadence in E minor, gypsy jazz at 180', href: jamLink({ key: 'E', mode: 'minor', preset: 'Andalusian', style: 'gypsy', feel: 'Gypsy jazz', part: 'La pompe', tempo: 180 }), jam: { preset: 'Andalusian', variant: '', style: 'gypsy', feel: 'Gypsy jazz', part: 'La pompe', mode: 'minor' } },
          { label: 'A rock vamp in E as classic funk, the chicken scratch', href: jamLink({ key: 'E', preset: 'Rock vamp', style: 'funk', feel: 'Classic funk (Nolen-inspired)', part: 'Chicken scratch', tempo: 104 }), jam: { preset: 'Rock vamp', variant: '', style: 'funk', feel: 'Classic funk (Nolen-inspired)', part: 'Chicken scratch' } },
          { label: 'Pachelbel’s canon in D as bluegrass crosspicking', href: jamLink({ key: 'D', preset: 'Canon', style: 'bluegrass', feel: 'Bluegrass', part: 'Crosspicking (Watson/White-inspired)', tempo: 120 }), jam: { preset: 'Canon', variant: '', style: 'bluegrass', feel: 'Bluegrass', part: 'Crosspicking (Watson/White-inspired)' } },
          { label: 'A minor rock progression in E minor, the metal gallop at 160', href: jamLink({ key: 'E', mode: 'minor', preset: 'Minor rock', style: 'metal', feel: 'Gallop (Hetfield-inspired)', part: 'Gallop chug', tempo: 160 }), jam: { preset: 'Minor rock', variant: '', style: 'metal', feel: 'Gallop (Hetfield-inspired)', part: 'Gallop chug', mode: 'minor' } },
        ] },
      { id: 'finder', title: 'Chord finder', tab: 'finder', open: '#chord-finder',
        blurb: 'Type a chord and see every way to hold it, open and up the neck, fingered, with the grips Hendrix and the rockabilly players used marked as theirs.',
        tries: [
          { label: 'E7♯9, the Hendrix chord', href: finderLink('E7#9'), chord: 'E7#9' },
          { label: 'B♭13, the big band’s chord', href: finderLink('Bb13'), chord: 'Bb13' },
          { label: 'C♯m7♭5, the half-diminished', href: finderLink('C#m7b5', { d: 'degrees' }), chord: 'C#m7b5' },
          { label: 'Dmaj9, open and movable', href: finderLink('Dmaj9'), chord: 'Dmaj9' },
          { label: 'A6, the rockabilly chicka', href: finderLink('A6'), chord: 'A6' },
          { label: 'E♭dim7, the horror chord', href: finderLink('Ebdim7', { s: 'movable' }), chord: 'Ebdim7' },
        ] },
      { id: 'reverse', title: 'Reverse chord finder', tab: 'reverse', open: '#reverse-chord-finder',
        blurb: 'Press the notes you are holding and it names the chord — and every other name those notes could go by.',
        tries: [
          { label: 'x-7-6-7-8-x — what is this grip?', href: reverseLink('x-7-6-7-8-x'), grip: 'x-7-6-7-8-x' },
          { label: 'x-3-2-0-3-3 — a C with something on top', href: reverseLink('x-3-2-0-3-3'), grip: 'x-3-2-0-3-3' },
          { label: 'x-3-5-3-4-x — a barre from the jazz side', href: reverseLink('x-3-5-3-4-x'), grip: 'x-3-5-3-4-x' },
          { label: '0-2-2-1-2-0 — the open E with its 6th', href: reverseLink('0-2-2-1-2-0'), grip: '0-2-2-1-2-0' },
        ] },
      { id: 'ear', title: 'Ear training', tab: 'ear', open: '#ear-training',
        blurb: 'Hear a note of a scale box and find it, or hear a chord and name its quality, on the shapes the finder draws.',
        tries: [
          { label: 'E♭ Dorian, the second box, one octave', href: earLink({ m: 'scale', k: 'Eb', s: 'dorian', i: 2, o: 1 }), ear: { m: 'scale', s: 'dorian' } },
          { label: 'The E minor pentatonic at the nut', href: earLink({ m: 'penta', k: 'E', s: 'minorpenta', i: 0, o: 1 }), ear: { m: 'penta', s: 'minorpenta' } },
          { label: 'Major, minor, 7th, maj7 or m7?', href: earLink({ m: 'quality', q: 'maj.m.7.maj7.m7' }), ear: { m: 'quality', q: ['', 'm', '7', 'maj7', 'm7'] } },
          { label: 'The colors: 6, m6, add9, 9 and dim7', href: earLink({ m: 'quality', q: '6.m6.add9.9.dim7' }), ear: { m: 'quality', q: ['6', 'm6', 'add9', '9', 'dim7'] } },
        ] },
      { id: 'drills', title: 'Drills', tab: 'drills', open: '#drills',
        blurb: 'Exercises for the hands over the band: chord changes in time, scale shapes up and down, picking speed, string crossing, arpeggios — at any tempo, with a count-in.',
        tries: [
          { label: 'A minor pentatonic at the 5th fret, up and down at 80', href: drillsLink({ d: 'scale', k: 'major:A', t: 80, sc: 'minorpenta', b: 'E@5', p: 'updown', v: 2 }), drill: { d: 'scale', sc: 'minorpenta', b: 'E@5' } },
          { label: 'Little Wing’s changes with the thumb barre walking, 60', href: drillsLink({ d: 'changes', k: 'minor:E', t: 60, ch: 'Em,G,Am,Em', pos: '0,3,5,0', bt: 4, st: 'quarters' }), drill: { d: 'changes' } },
          { label: 'The blues scale in threes at 100, for the fingers', href: drillsLink({ d: 'scale', k: 'major:E', t: 100, sc: 'blues', b: 'E@12', p: 'threes', v: 4 }), drill: { d: 'scale', sc: 'blues', p: 'threes', b: 'E@12' } },
          { label: 'Picking speed: four notes a string, alternate picked', href: drillsLink({ d: 'picking', k: 'major:A', t: 90, sc: 'minorpenta', b: 'E@5', ps: 4 }), drill: { d: 'picking', b: 'E@5' } },
          { label: 'String crossing, skipping one', href: drillsLink({ d: 'crossing', k: 'major:G', t: 90, cr: 'skip', ss: 'all' }), drill: { d: 'crossing' } },
        ] },
      { id: 'dives', title: 'Style Deep Dives', tab: 'dives', open: '#style-deep-dives',
        blurb: 'One player’s or one genre’s whole way of playing, taken apart and put back together as parts you can practice — and each as a course of eight lessons, your place kept.',
        tries: [
          { label: 'Hendrix, lesson 1: the thumb and the split chord', href: 'hendrix.html#course/1', page: 'hendrix' },
          { label: 'The Hendrix chord exercise', href: 'hendrix.html#x4', page: 'hendrix' },
          { label: 'Psychobilly, lesson 1: the boom and the chicka', href: 'psychobilly.html#course/1', page: 'psychobilly' },
          { label: 'The Reverend’s surf-billy study', href: 'psychobilly.html#st7', page: 'psychobilly' },
          { label: 'The players of psychobilly, wave by wave', href: 'psychobilly.html#s8', page: 'psychobilly' },
        ] },
      { id: 'favorites', title: 'Favorites', tab: 'favorites', open: '#favorites',
        blurb: 'The cards, jams and drills you starred, each with the link that reopens it as it was; signed in, the same list on every device.',
        tries: [] },
    ];
  }
  // every link the page offers, flat, for the test that holds them
  const links = () => sections().flatMap(s => [{ section: s.id, label: s.title, href: s.open }, ...s.tries.map(t => ({ section: s.id, ...t }))]);

  // ---- the page ----
  function render(host){
    host = host || document.getElementById('homeSections');
    if (!host) return;
    const favs = GT.favorites ? GT.favorites.list().length : 0;
    host.innerHTML = sections().map(s => `
      <section class="home-card" id="home-${s.id}">
        <h3><a href="${esc(s.open)}">${esc(s.title)}</a></h3>
        <p class="home-blurb">${esc(s.blurb)}${s.id === 'favorites' && favs ? ` <b>${favs} kept.</b>` : ''}</p>
        ${s.tries.length ? `<p class="home-try-lbl">Try</p><ul class="home-tries">${s.tries.map(t => `<li><a href="${esc(t.href)}">${esc(t.label)}</a></li>`).join('')}</ul>` : ''}
        <a class="home-open" href="${esc(s.open)}">Open ${esc(s.title)} →</a>
      </section>`).join('') + `
      <p class="home-more">Also: <a href="parts.html">the parts, explained</a>, every guitar part written out and playable · <a href="privacy.html">what the site stores</a>.</p>`;
  }

  GT.home = { sections, links, render, jamLink };
})();
