// The CAGED practice tab: rolling a progression, the chord display and its
// settings, and the playback transport that drives both the audio and the
// on-screen highlighting.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const {
    MAJOR_KEYS, MINOR_KEYS, MAJOR_COMMON, MINOR_COMMON, LEADING_TONE, SEMITONE,
    pick, buildDiatonicChords, displayName, chordFromName, parseChordName, numeralFor,
    NOTE_NAMES_SHARP, NOTE_NAMES_FLAT, SUFFIX,
  } = GT.theory;
  const audio = GT.audio;
  const {
    ensureAudio, noteFreq, chordFrequencies, bassFreqAt, walkBassFreq, STYLES, ROOT_OCTAVE,
    playNote, playChord, playBass, playHiHat, playRide, playKick, playSnare, playStyleVoice,
  } = GT.audio;
  const view = GT.fretboardView;

  let currentProgression = [];
  let chordCount = 3;
  const MAX_CHORDS = 12;        // enough to hold a twelve-bar blues once repeats are merged
  // The key and every chord are always something concrete you can read off the
  // pickers; randomness is a button you press, not a state a slot sits in. A
  // slot holds the scale degree it's on, or a root outside the key written as
  // the semitones above the tonic ('c3' is a ♭III) — or null, which means only
  // that this chord isn't a root you picked at all (one loaded from a genre
  // example), and its picker names the chord itself instead.
  let slotChoices = [0, 0, 0];          // per slot: the root it's on
  let slotMeasures = [];                // per slot: how many measures that chord lasts
  let slotShapes = [];                // per slot: the shape you chose, or null to follow the key
  let loadedLabel = null;               // set when a progression came in from elsewhere
  let currentMode = 'major';
  let currentTonic = 'C';
  let currentDiatonic = [];             // the chord choices available for the current key

  // The chords play on the piano unless you ask for the guitar. The piano is
  // the default because a progression is accompaniment: it keeps out of the
  // way of the guitar you're playing over it, where a second guitar competes.
  let chordVoice = 'piano';

  const keySelect = document.getElementById('keySelect');
  // The chart carries a copy of the two pickers you reach for while playing.
  // They're views onto the same state, not a second copy of it: each mirrors
  // the real picker's options and forwards a change straight to it.
  const quickKey = document.getElementById('quickKey');
  const quickPreset = document.getElementById('quickPreset');
  const mirror = (from, to) => { to.innerHTML = from.innerHTML; to.value = from.value; };
  const forward = (from, to) => { to.value = from.value; to.dispatchEvent(new Event('change')); };
  const chordSlotsEl = document.getElementById('chordSlots');
  // grabbed here with the other elements rather than beside the code that
  // uses them: renderAll() reads the typing field, and renderAll is hoisted
  const chordText = document.getElementById('chordText');
  const chordTextNote = document.getElementById('chordTextNote');
  const chordTextApply = document.getElementById('chordTextApply');

  // chords a manual slot can be set to: the 7 diatonic triads, plus the
  // harmonic-minor V (degree 7) in minor keys
  function keyChordChoices(){
    const base = buildDiatonicChords(currentMode, currentTonic).map((c, i) => ({ ...c, deg: i }));
    if (currentMode === 'minor'){
      const five = base[4];
      base.push({
        note: five.note, third: LEADING_TONE[currentTonic], fifth: five.fifth, seventh: five.seventh,
        quality: 'maj', numeral: 'V', name: five.note, deg: 7,
      });
    }
    return base;
  }

  // ---- roots outside the key ----------------------------------------------
  // A slot can sit on any of the twelve, not just the seven the key hands you:
  // a ♭VII to fall off the end of a major progression, a ♯IV under a
  // secondary V, the borrowed ♭VI. Such a root is stored as 'c' + the
  // semitones above the tonic rather than as a note name, for the same reason
  // a degree is: written that way it moves with the key, so a progression
  // built here transposes whole.
  const chromaticOf = deg =>
    typeof deg === 'string' && /^c\d+$/.test(deg) ? Number(deg.slice(1)) % 12 : null;

  // The chord a root gives before any shape asks for something else: the key's
  // own chord on a degree, or a plain major triad on a root the key doesn't
  // own. Either way it carries the seventh "Use 7ths" would put on it, which
  // chordForDegree strips again unless a shape wants it.
  function baseChordFor(deg){
    const semis = chromaticOf(deg);
    if (semis == null) return currentDiatonic.find(x => x.deg === deg) || currentDiatonic[0];
    const tonicPc = SEMITONE[currentTonic] % 12;
    const rootPc = (tonicPc + semis) % 12;
    // The numeral table already spells these the way musicians write them —
    // ♭VII in major, ♯IV in either — so take the accidental from the numeral
    // and name the notes to match: the ♭VII of C is Bb, not A#.
    const numeral = numeralFor(rootPc, tonicPc, 'maj', currentMode);
    const names = numeral.includes('\u266d') ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    const at = iv => names[(rootPc + iv) % 12];
    return {
      note: at(0), third: at(4), fifth: at(7), seventh: at(10),
      quality: 'maj', numeral, name: at(0) + SUFFIX.maj, deg,
    };
  }

  function randomDegreePool(){
    const common = currentMode === 'major' ? MAJOR_COMMON : MINOR_COMMON;
    return commonToggle.checked ? common.slice() : [0, 1, 2, 3, 4, 5, 6];
  }

  function rollDegree(prevDeg){
    const pool = randomDegreePool();
    let d = pick(pool);
    if (pool.length > 1 && d === prevDeg) d = pick(pool.filter(x => x !== prevDeg));
    if (currentMode === 'minor' && d === 4 && Math.random() < 0.5) d = 7;  // harmonic V
    return d;
  }

  // Name the shape a chord is currently in — the key a slot stores.
  function shapeOf(chord){
    if (!chord.seventh) return chord.quality === 'min' ? 'min' : chord.quality === 'dim' ? 'dim' : 'maj';
    const iv = ((SEMITONE[chord.seventh] - SEMITONE[chord.note]) % 12 + 12) % 12;
    if (chord.quality === 'dim') return iv === 9 ? 'dim7' : 'm7♭5';
    if (chord.quality === 'min') return 'm7';
    return iv === 11 ? 'maj7' : '7';
  }

  // The seventh a key's own scale puts on a degree — what "use 7ths" rolls.
  // Read from the diatonic list, since a chord built as a triad has none.
  function diatonicSeventhFor(deg){
    return shapeOf(baseChordFor(deg));
  }

  // the flat-7 that keeps the triad it's built on
  function flatSeventh(quality){
    return quality === 'dim' ? 'm7♭5' : quality === 'min' ? 'm7' : '7';
  }

  // Every shape a slot can be set to, as a triad plus an optional seventh
  // (semitones above the root). A slot isn't limited to the chord its key
  // gives that degree — this is how you get a secondary dominant on the ii, a
  // borrowed minor iv, or a major III.
  const CHORD_SHAPES = {
    maj:    { triad: 'maj', seventh: null, label: 'Major' },
    min:    { triad: 'min', seventh: null, label: 'Minor' },
    dim:    { triad: 'dim', seventh: null, label: 'dim'   },
    '7':    { triad: 'maj', seventh: 10,   label: '7'     },
    maj7:   { triad: 'maj', seventh: 11,   label: 'maj7'  },
    m7:     { triad: 'min', seventh: 10,   label: 'm7'    },
    'm7♭5': { triad: 'dim', seventh: 10,   label: 'm7♭5'  },
    dim7:   { triad: 'dim', seventh: 9,    label: 'dim7'  },
  };

  // The five everyday shapes, plus the diminished ones on the one degree whose
  // own chord is diminished — otherwise the vii° couldn't be spelled at all.
  function shapeOptions(quality){
    const dim = quality === 'dim';
    return ['maj', 'min', ...(dim ? ['dim'] : []), '7', 'maj7', 'm7',
            ...(dim ? ['m7♭5', 'dim7'] : [])];
  }

  // every shape there is, for a root the key has nothing to say about. Written
  // out rather than read off CHORD_SHAPES, whose '7' would come first: an
  // object enumerates its number-like keys ahead of the rest.
  const ALL_SHAPES = ['maj', 'min', 'dim', '7', 'maj7', 'm7', 'm7♭5', 'dim7'];

  const triadShapeOf = quality => quality === 'min' ? 'min' : quality === 'dim' ? 'dim' : 'maj';

  // The shape a slot should take: whatever you set it to, otherwise the key's
  // own triad — or the key's own seventh, if random slots are set to come up
  // as sevenths. Leaving that last case implicit rather than writing it into
  // `slotShapes` is what lets the checkbox turn triads into sevenths and
  // back without disturbing anything else about the progression.
  // Two of the stored shapes are relative to the key rather than fixed, so a
  // preset keeps its meaning when the key changes mode: `dia7` is the key's
  // own seventh on that degree (the ii of a ii–V–I is m7 in major, m7♭5 in
  // minor), `flat7` is the key's triad with a flat 7 (a blues I is I7 in
  // major, i7 in minor).
  function resolveShape(shape, deg){
    if (shape === 'dia7') return diatonicSeventhFor(deg);
    if (shape === 'flat7') return flatSeventh(chordForDegree(deg).quality);
    return shape;
  }

  function shapeFor(i, deg){
    if (slotShapes[i]) return resolveShape(slotShapes[i], deg);
    // A chord whose shape you haven't set follows the key — as its triad, or
    // as the seventh the key puts on that degree when "Use 7ths" is on. That's
    // what lets the checkbox swap triads for sevenths where they stand without
    // disturbing a single root, degree or bar length.
    if (randomSeventhsToggle.checked) return diatonicSeventhFor(deg);
    return null;
  }

  // the two shapes the key itself puts on a degree: its triad and its 7th.
  // A root the key doesn't own gets none — nothing about the key says what a
  // borrowed chord should be, which is the whole point of borrowing it.
  function diatonicShapesFor(deg){
    if (chromaticOf(deg) != null) return [];
    return [triadShapeOf(baseChordFor(deg).quality), diatonicSeventhFor(deg)];
  }

  // what a slot shows before you touch its shape picker
  const defaultShapeFor = deg => triadShapeOf(baseChordFor(deg).quality);

  // Re-cast a roman numeral for a quality the key doesn't give that degree —
  // a borrowed iv, a secondary V7 sitting on the ii, a diminished vii°.
  function recaseNumeral(numeral, triad){
    const plain = numeral.replace('°', '');
    if (triad === 'maj') return plain.toUpperCase();
    if (triad === 'min') return plain.toLowerCase();
    return plain.toLowerCase() + '°';
  }

  // Build a degree's chord in whichever shape that slot asks for. Passing
  // nothing gives the key's own triad, which is what lets an untouched slot
  // follow along when the key or the mode changes.
  function chordForDegree(deg, shape){
    const c = baseChordFor(deg);
    const chord = { ...c, _deg: c.deg, _shape: shape || null };
    const spec = CHORD_SHAPES[shape];

    if (!spec){ chord.seventh = null; return chord; }

    // spell the chord tones the way its root is spelled, so a borrowed Bbm
    // gets a Db third rather than a C#
    const names = chord.note.includes('b') ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    const at = semis => names[((SEMITONE[chord.note] + semis) % 12 + 12) % 12];
    if (spec.triad !== chord.quality){
      chord.third = at(spec.triad === 'maj' ? 4 : 3);
      chord.fifth = at(spec.triad === 'dim' ? 6 : 7);
      chord.quality = spec.triad;
      chord.name = chord.note + SUFFIX[spec.triad];
      chord.numeral = recaseNumeral(chord.numeral, spec.triad);
    }
    chord.seventh = spec.seventh == null ? null : at(spec.seventh);
    return chord;
  }

  // Roll every chord afresh. The key stays where it is — that's the other
  // button's job — so this is only ever "give me different chords in this key".
  function randomizeChords(){
    const degs = [];
    for (let i = 0; i < chordCount; i++){
      degs.push(rollDegree(degs.length ? degs[degs.length - 1] : -1));
    }
    // a progression that never touches its tonic doesn't sound like it's in a
    // key at all, so plant one somewhere
    if (!degs.includes(0)) degs[Math.floor(Math.random() * degs.length)] = 0;

    slotChoices = degs;
    slotShapes = degs.map(() => null);   // freshly rolled chords follow the key
    rebuildProgression();
  }

  // Build the chords from what the pickers say. Everything that changes a
  // degree, a shape or the key comes back through here.
  function rebuildProgression(){
    currentProgression = slotChoices.map((deg, i) =>
      deg == null ? currentProgression[i] : chordForDegree(deg, shapeFor(i, deg)));
  }

  // A whole progression, chosen for you: how many chords, how long each one
  // holds, and then the chords themselves. Short and squarish on purpose —
  // two to four chords of a bar or two is the shape of most things worth
  // practising over, and anything longer is better built by hand.
  function randomizeProgression(){
    setSlotCount(2 + Math.floor(Math.random() * 3));          // 2, 3 or 4
    slotMeasures = slotChoices.map(() => 1 + Math.floor(Math.random() * 2));
    randomizeChords();   // degrees and shapes, honouring the two roll settings
  }

  // A different key, chosen for you — the same progression lands in it, since
  // each chord keeps its degree.
  function randomizeKey(){
    const mode = Math.random() < 0.5 ? 'major' : 'minor';
    const keys = Object.keys(mode === 'major' ? MAJOR_KEYS : MINOR_KEYS)
      .filter(t => !(mode === currentMode && t === currentTonic));
    transposeToKey(mode, pick(keys));
  }

  function buildKeySelect(){
    const grp = (label, obj, mode) =>
      `<optgroup label="${label}">` +
      Object.keys(obj).slice().sort().map(t => `<option value="${mode}:${t}">${t} ${mode}</option>`).join('') +
      `</optgroup>`;
    // one picker for all 24 keys, major and minor side by side; it always names
    // the key you're actually in, and the dice beside it picks a new one
    keySelect.innerHTML = grp('Major keys', MAJOR_KEYS, 'major') + grp('Minor keys', MINOR_KEYS, 'minor');
    keySelect.value = `${currentMode}:${currentTonic}`;
    mirror(keySelect, quickKey);
  }

  // ---- ready-made progressions -------------------------------------------
  const presetSelect = document.getElementById('presetSelect');
  const presetVariantRow = document.getElementById('presetVariantRow');
  const presetVariantGroup = document.getElementById('presetVariantGroup');
  let presetIdx = null;      // which preset is showing, if any
  let variantIdx = 0;

  // Put the tab in a key: the state, the diatonic chord list, and the key
  // picker that shows it. Doesn't touch the progression — callers rebuild or
  // transpose that themselves.
  function setKey(mode, tonic){
    currentMode = mode;
    currentTonic = tonic;
    currentDiatonic = keyChordChoices();
    buildKeySelect();
  }

  // the same tonic in the other mode when that key exists, else any key there
  function tonicIn(mode, tonic){
    const keys = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;
    return keys[tonic] ? tonic : pick(Object.keys(keys));
  }

  function applyPreset(preset, variant){
    // a preset written for one mode takes the key there first
    const mode = variant.mode || preset.mode;
    if (mode && mode !== currentMode) setKey(mode, tonicIn(mode, currentTonic));
    const chords = variant.chords.slice(0, MAX_CHORDS);
    setSlotCount(chords.length);
    // pinning each slot to its degree is what keeps the shape put — and what
    // leaves every chord editable from its own picker afterwards
    slotChoices = chords.map(c => c.deg);
    slotMeasures = chords.map(c => c.bars);
    // `maj` asks for a real dominant; `dom` keeps whatever triad the key gives
    // the degree and just flattens its 7th; `dia` takes the key's own 7th.
    // The last two are stored relative to the key, so they follow a change of
    // mode rather than freezing as whatever they were when the preset landed.
    slotShapes = chords.map(c => {
      if (c.dia) return 'dia7';
      if (!c.dom) return null;
      return c.maj ? '7' : 'flat7';
    });
    currentProgression = chords.map((c, i) => chordForDegree(c.deg, shapeFor(i, c.deg)));
    loadedLabel = null;
    renderAll();
  }

  // a preset or variant written for one mode only shows up in that mode
  const fitsMode = item => !item.mode || item.mode === currentMode;

  function renderPresetVariants(){
    // A variant written for one mode can't survive the key moving to the other.
    // Its degrees still transpose — the chart keeps playing — but what's on it
    // is no longer any variant this preset lists, so the selection has to go,
    // the way buildPresetSelect already drops a preset the mode has no room
    // for. Left alone the row sat there with nothing marked, still claiming a
    // preset while the chords underneath had come from somewhere else.
    if (presetIdx != null){
      const chosen = GT.progressionPresets[presetIdx].variants[variantIdx];
      if (!chosen || !fitsMode(chosen)){
        presetIdx = null;
        presetSelect.value = '';
        mirror(presetSelect, quickPreset);
      }
    }
    const preset = presetIdx == null ? null : GT.progressionPresets[presetIdx];
    const shown = preset ? preset.variants.map((v, i) => [v, i]).filter(([v]) => fitsMode(v)) : [];
    const many = shown.length > 1;
    presetVariantRow.hidden = !many;
    // Empty it even when the row is about to hide: leaving the last preset's
    // buttons behind means the group holds controls for a preset that isn't
    // selected any more, still carrying their click handlers.
    presetVariantGroup.innerHTML = '';
    if (!many) return;
    shown.forEach(([v, i]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === variantIdx ? ' active' : '');
      b.textContent = v.name;
      b.addEventListener('click', () => {
        variantIdx = i;
        renderPresetVariants();
        applyPreset(preset, preset.variants[i]);
      });
      presetVariantGroup.appendChild(b);
    });
  }

  // One picker, each entry named the way people name it, with the numerals
  // beside it — twelve buttons of roman numerals all looked the same. The
  // list follows the key: a major key offers the doo-wop and the canon, a
  // minor one the Andalusian cadence and the minor four-chord, and the ones
  // that work in both read with the numerals of the mode they're in.
  function buildPresetSelect(){
    const options = GT.progressionPresets
      .map((p, i) => [p, i])
      .filter(([p]) => fitsMode(p))
      .map(([p, i]) => {
        const numerals = currentMode === 'minor' && p.numeralsMinor ? p.numeralsMinor : p.numerals;
        return `<option value="${i}">${p.name}${numerals ? ' · ' + numerals : ''}</option>`;
      });
    presetSelect.innerHTML = `<option value="">None</option>` + options.join('');
    // a preset that doesn't exist in this mode is no longer the one showing
    if (presetIdx != null && !fitsMode(GT.progressionPresets[presetIdx])) presetIdx = null;
    presetSelect.value = presetIdx == null ? '' : String(presetIdx);
    mirror(presetSelect, quickPreset);
  }

  function loadPreset(i){
    presetIdx = i;
    const preset = GT.progressionPresets[presetIdx];
    variantIdx = preset.variants.findIndex(fitsMode);
    renderPresetVariants();
    applyPreset(preset, preset.variants[variantIdx]);
  }

  presetSelect.addEventListener('change', () => {
    if (presetSelect.value === ''){ clearPreset(); return; }
    loadPreset(Number(presetSelect.value));
  });

  // once you've changed something by hand it isn't that preset any more
  function clearPreset(){
    if (presetIdx == null) return;
    presetIdx = null;
    presetSelect.value = '';
    renderPresetVariants();
  }

  // Rolls every chord in the progression at once. Randomness is an action
  // here rather than a state a slot sits in, so this always has something to
  // do and the pickers always show what it came up with.
  const genBtn = document.getElementById('genBtn');
  const randomKeyBtn = document.getElementById('randomKeyBtn');

  // Which root of the current key a slot is sitting on — a degree, or one of
  // the chromatic ids. Chords generated here carry their root; one loaded from
  // a genre example doesn't, so match it by pitch: to a degree if the key has
  // one there, and otherwise to the root outside the key that it is.
  function degreeOf(i){
    if (slotChoices[i] != null) return slotChoices[i];
    const chord = currentProgression[i];
    if (!chord) return currentDiatonic[0].deg;
    if (chord._deg != null) return chord._deg;
    const rootPc = SEMITONE[chord.note] % 12;
    const match = currentDiatonic.find(c => SEMITONE[c.note] % 12 === rootPc);
    if (match) return match.deg;
    return 'c' + ((rootPc - SEMITONE[currentTonic]) % 12 + 12) % 12;
  }

  function renderChordSlots(){
    chordSlotsEl.innerHTML = '';
    for (let i = 0; i < chordCount; i++){
      const slot = document.createElement('div');
      slot.className = 'chord-row';
      // the row number, so a chord can be talked about by position
      const num = document.createElement('span');
      num.className = 'chord-num';
      num.textContent = i + 1;
      slot.appendChild(num);

      const sel = document.createElement('select');
      sel.className = 'mini-select chord-degree';
      sel.setAttribute('aria-label', `Chord ${i + 1}`);
      // Just which root this chord is on — the shape picker beside it says
      // whether it's a triad or a seventh, so naming one here would only
      // contradict the other. There's no "Random" entry: the picker always
      // names the chord that's actually sounding, and the dice roll the whole
      // progression at once.
      // All twelve roots are on the list, in two groups: the ones the key owns
      // read as their degree (D · ii), and the five it doesn't read as what
      // they are (Bb · ♭VII) under a heading that says you've stepped outside.
      const inKeyOpts = currentDiatonic
        .map(o => `<option value="${o.deg}">${o.name} · ${o.numeral}</option>`);
      const owned = new Set(currentDiatonic.map(c => SEMITONE[c.note] % 12));
      const outsideOpts = [];
      for (let semis = 1; semis < 12; semis++){
        if (owned.has((SEMITONE[currentTonic] + semis) % 12)) continue;
        const c = baseChordFor('c' + semis);
        outsideOpts.push(`<option value="c${semis}">${c.note} · ${c.numeral}</option>`);
      }
      // a chord loaded from a genre example is on no root you picked; it still
      // gets to name itself, and picking anything else replaces it
      const offOpt = (slotChoices[i] == null && currentProgression[i])
        ? `<option value="off">${displayName(currentProgression[i])}</option>` : '';
      sel.innerHTML = offOpt
        + `<optgroup label="In this key">${inKeyOpts.join('')}</optgroup>`
        + `<optgroup label="Outside the key">${outsideOpts.join('')}</optgroup>`;
      sel.value = slotChoices[i] == null ? 'off' : String(slotChoices[i]);
      sel.addEventListener('change', () => {
        if (sel.value === 'off') return;         // it's already that chord
        slotChoices[i] = chromaticOf(sel.value) == null ? Number(sel.value) : sel.value;
        // a chord picked by hand starts from the key's own shape for it,
        // unless a shape was already set on this slot
        currentProgression[i] = chordForDegree(slotChoices[i], shapeFor(i, slotChoices[i]));
        loadedLabel = null;
        clearPreset();
        renderAll();
      });
      slot.appendChild(sel);

      // how long this particular chord lasts, so a progression can hold one
      // chord for four bars and the next for one
      const bars = document.createElement('select');
      bars.className = 'mini-select bars-select';
      bars.setAttribute('aria-label', `Measures for chord ${i + 1}`);
      bars.innerHTML = [1, 2, 3, 4, 6, 8]
        .map(n => `<option value="${n}">${n}</option>`).join('');
      bars.value = String(measuresFor(i));
      bars.addEventListener('change', () => {
        slotMeasures[i] = Number(bars.value) || DEFAULT_MEASURES;
        clearPreset();      // once the bar lengths change it isn't that preset any more
        renderChordDisplay();
        resetPlaybackCursor();
      });
      slot.appendChild(bars);

      // what shape the chord takes — free to leave the key, with a ✓ on the
      // two shapes the key itself gives this degree
      const sev = document.createElement('select');
      sev.className = 'mini-select seventh-select';
      sev.setAttribute('aria-label', `Chord quality for chord ${i + 1}`);
      sev.title = '✓ marks the shapes this key gives that degree';
      const deg = degreeOf(i);
      const inKey = diatonicShapesFor(deg);
      // A root the key owns is offered the shapes that fit it; a root outside
      // the key is offered all of them, since there's no scale to narrow it.
      const options = chromaticOf(deg) == null
        ? shapeOptions(baseChordFor(deg).quality)
        : ALL_SHAPES.slice();
      // whatever is actually sounding is always on the list, even a shape a
      // key change carried in from the other mode
      const sounding = shapeFor(i, deg);
      if (sounding && !options.includes(sounding)) options.push(sounding);
      sev.innerHTML = options.map(tok =>
        `<option value="${tok}">${CHORD_SHAPES[tok].label}${inKey.includes(tok) ? ' ✓' : ''}</option>`
      ).join('');
      // what this slot would be showing if you'd never touched it
      const plain = defaultShapeFor(deg);
      const implied = randomSeventhsToggle.checked ? diatonicSeventhFor(deg) : plain;
      sev.value = shapeFor(i, deg) || plain;
      sev.addEventListener('change', () => {
        // leaving the untouched choice unrecorded is what lets a slot follow
        // the key when you transpose or flip Major/Minor
        slotShapes[i] = sev.value === implied ? null : sev.value;
        currentProgression[i] = chordForDegree(deg, shapeFor(i, deg));
        clearPreset();
        renderAll();
      });
      slot.appendChild(sev);

      chordSlotsEl.appendChild(slot);
    }
  }

  // ---- hearing one chord on its own ---------------------------------------
  // Click a bar and just that chord sounds, whether or not the progression is
  // playing — for checking a shape against what it's supposed to sound like.
  function auditionBar(bar){
    const idx = Number(bar.dataset.chord);
    const chord = currentProgression[idx];
    if (!chord) return;
    // While nothing is playing there's no Follow to move the neck for you, so
    // the bar you tap to hear also becomes the chord the fretboard shows.
    if (!isPlaying) view.selectChord(idx);
    ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    playChord(chord, audio.ctx().currentTime + 0.02, 1.8, 0.85, chordVoice);
    bar.classList.remove('rang');
    void bar.offsetWidth;            // restart the flash
    bar.classList.add('rang');
  }

  const chordsRoot = document.getElementById('chords');
  chordsRoot.addEventListener('click', e => {
    const bar = e.target.closest('.bar');
    if (bar) auditionBar(bar);
  });
  chordsRoot.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const bar = e.target.closest('.bar');
    if (!bar) return;
    // on a focused bar the space bar means "hear this one", not play/pause
    e.preventDefault();
    e.stopPropagation();
    auditionBar(bar);
  });

  // The display is laid out a bar at a time, the way a chart reads: a chord
  // held for three bars is written out three times. Four bars to a line.
  function barCells(){
    const cells = [];
    currentProgression.forEach((chord, i) => {
      for (let b = 0; b < measuresFor(i); b++){
        cells.push({ chord, chordIndex: i, bar: cells.length, held: b > 0 });
      }
    });
    return cells;
  }

  function barOffset(chordIndex){
    let bars = 0;
    for (let i = 0; i < chordIndex; i++) bars += measuresFor(i);
    return bars;
  }

  function renderChordDisplay(){
    const chordsEl = document.getElementById('chords');
    const cells = barCells();
    // seventh-chord names ("Bm7♭5") run much longer than triads ("Am"), so the
    // font follows the longest name as well as how many bars share the line
    const maxLen = Math.max(1, ...cells.map(c => displayName(c.chord).length));
    chordsEl.style.setProperty('--cols', Math.min(4, Math.max(1, cells.length)));
    chordsEl.style.setProperty('--len', maxLen);
    chordsEl.innerHTML = '';
    cells.forEach((cell, i) => {
      const item = document.createElement('div');
      item.className = 'bar' + (cell.held ? ' held' : '');
      item.dataset.bar = cell.bar;
      item.dataset.chord = cell.chordIndex;
      // each bar is a button that plays its own chord
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.title = `Play ${displayName(cell.chord)}`;
      item.style.animationDelay = `${Math.min(i, 8) * 55}ms`;
      item.innerHTML = `
        <span class="chord-name">${displayName(cell.chord)}</span>
        <span class="chord-numeral">${cell.chord.numeral}</span>
      `;
      chordsEl.appendChild(item);
    });
  }

  // render everything from the current progression WITHOUT re-rolling it
  function renderAll(){
    syncChordText();
    writeShareState();
    document.getElementById('keyReadout').textContent =
      loadedLabel || (currentMode === 'major' ? `${currentTonic} major` : `${currentTonic}m`);
    renderChordDisplay();
    renderChordSlots();
    buildPresetSelect();          // the list follows whichever mode the key is in
    renderPresetVariants();
    view.rebuildChordPicker();
    view.render();
    resetPlaybackCursor();
  }

  // roll a whole new set of chords, then render
  function render(){
    loadedLabel = null;
    clearPreset();
    randomizeChords();
    view.resetPosition();   // a newly-rolled progression starts at the lowest cluster
    renderAll();
  }

  genBtn.addEventListener('click', render);
  const randomKey = () => { clearPreset(); randomizeKey(); };
  randomKeyBtn.addEventListener('click', randomKey);
  document.getElementById('quickKeyDice').addEventListener('click', randomKey);
  document.getElementById('quickRandomChords').addEventListener('click', () => {
    loadedLabel = null;
    clearPreset();
    randomizeProgression();
    view.resetPosition();
    renderAll();
  });
  quickKey.addEventListener('change', () => forward(quickKey, keySelect));
  quickPreset.addEventListener('change', () => forward(quickPreset, presetSelect));

  keySelect.addEventListener('change', () => {
    const [m, t] = keySelect.value.split(':');
    const known = (m === 'major' && MAJOR_KEYS[t]) || (m === 'minor' && MINOR_KEYS[t]);
    if (!known){          // the option list changed under us
      buildKeySelect();
      return;
    }
    // Same progression, other key: each chord keeps its degree, so picking C
    // minor from C major turns I–V–vi–IV into i–v–VI–iv rather than rolling
    // something unrelated.
    transposeToKey(m, t);
  });

  // Move the progression to another key rather than rolling a new one: each
  // chord keeps its scale degree, so a I–V–vi–IV in A becomes the I–V–vi–IV of
  // wherever you land. Chords that aren't degrees of the old key — a
  // progression loaded from a genre example — are shifted by the same interval.
  function transposeToKey(mode, tonic){
    const shift = ((SEMITONE[tonic] - SEMITONE[currentTonic]) % 12 + 12) % 12;
    currentMode = mode;
    currentTonic = tonic;
    currentDiatonic = keyChordChoices();
    const validDegs = new Set(currentDiatonic.map(c => c.deg));

    currentProgression = currentProgression.map((chord, i) => {
      const semis = chromaticOf(chord._deg);
      if (semis != null){
        // A root stored as an interval above the tonic moves with the key on
        // its own. It stops being outside the key only when the mode changes
        // under it — a ♭III is no degree of C major but is the III of C minor
        // — so hand it back to that degree when the new key has one for it.
        const pc = (SEMITONE[tonic] + semis) % 12;
        const match = currentDiatonic.find(c => SEMITONE[c.note] % 12 === pc);
        slotChoices[i] = match ? match.deg : chord._deg;
        return chordForDegree(slotChoices[i], shapeFor(i, slotChoices[i]));
      }
      if (chord._deg != null && validDegs.has(chord._deg)){
        return chordForDegree(chord._deg, shapeFor(i, chord._deg));
      }
      const moved = transposeChord(chord, shift);
      // A pin the new key has no degree for — the harmonic-minor V, on the way
      // out of a minor key — still lands on a chord the new key does contain.
      // Re-pin it there rather than handing the slot back to Random, which
      // would leave the picker saying "Random" over a chord that never moves.
      const rootPc = SEMITONE[moved.note] % 12;
      const match = chord._deg != null
        ? currentDiatonic.find(c => SEMITONE[c.note] % 12 === rootPc) : null;
      if (match){
        slotChoices[i] = match.deg;
        slotShapes[i] = shapeOf(moved);
        return chordForDegree(match.deg, slotShapes[i]);
      }
      // Otherwise it's a chord of no degree at all (one loaded from a genre
      // example). Spell its shape out, so its picker describes what's sounding.
      slotShapes[i] = shapeOf(moved);
      return moved;
    });

    // a degree the new key has no chord for is re-pinned above, or else the
    // chord stays as a plain transposition and its picker names it
    slotChoices = slotChoices.map(s =>
      (s == null || validDegs.has(s) || chromaticOf(s) != null) ? s : null);
    loadedLabel = null;      // it's no longer the key that progression came in
    buildKeySelect();        // the picker always names the key you're in
    renderAll();
  }

  // spell a note the way the current key does, so moving to Eb gives Bb, not A#
  function noteNameInKey(pc){
    const scale = (currentMode === 'major' ? MAJOR_KEYS : MINOR_KEYS)[currentTonic] || [];
    return scale.find(n => SEMITONE[n] % 12 === pc) || NOTE_NAMES_SHARP[pc];
  }

  function transposeChord(chord, shift){
    const move = note => note == null ? null
      : noteNameInKey(((SEMITONE[note] + shift) % 12 + 12) % 12);
    const note = move(chord.note);
    return Object.assign({}, chord, {
      note,
      third: move(chord.third),
      fifth: move(chord.fifth),
      seventh: move(chord.seventh),
      name: note + (chord.name || '').slice((chord.note || '').length),
      // Shifted by an interval rather than rebuilt from a degree: whatever
      // degree it used to be, it isn't one of this key's, so saying so would
      // only mislead the pickers that read it.
      _deg: null,
      _shape: null,
    });
  }

  const tempoInput = document.getElementById('tempo');
  const tempoVal = document.getElementById('tempoVal');
  // Two of them: one floating clear of the page so it's always in reach, one
  // in the transport list where the rest of the playback controls are. They
  // are the same control, so they carry the same label and state.
  const playBtns = [...document.querySelectorAll('.play-btn')];
  const commonToggle = document.getElementById('commonToggle');
  const randomSeventhsToggle = document.getElementById('randomSeventhsToggle');
  const clickToggle = document.getElementById('clickToggle');
  const countInToggle = document.getElementById('countInToggle');
  const rootOnlyToggle = document.getElementById('rootOnlyToggle');
  const measureReadout = document.getElementById('measureReadout');

  const chordCountValue = document.getElementById('chordCountValue');

  const DEFAULT_MEASURES = 2;   // what a freshly rolled chord lasts
  let noteBeats = 1;
  // What a fresh page plays: rock on the quarter-note feel — a backing that
  // keeps time without filling the bar, which is what you want under
  // practice. Named rather than inlined so the test can hold it.
  const DEFAULT_FEEL = { style: 'rock', variant: 'Quarter drive' };
  // 'simple' | a key of STYLES, and an index into its variants
  let currentStyle = DEFAULT_FEEL.style;
  let currentVariant = Math.max(0,
    STYLES[DEFAULT_FEEL.style].variants.findIndex(v => v.label === DEFAULT_FEEL.variant));

  const noteValueRow = document.getElementById('noteValueRow');
  const rootOnlyRow = document.getElementById('rootOnlyRow');
  const clickRow = document.getElementById('clickRow');
  const styleVariantRow = document.getElementById('styleVariantRow');
  const styleVariantGroup = document.getElementById('styleVariantGroup');

  function renderVariantButtons(){
    styleVariantGroup.innerHTML = '';
    if (currentStyle === 'simple') return;
    STYLES[currentStyle].variants.forEach((variant, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (i === currentVariant ? ' active' : '');
      b.textContent = variant.label;
      b.addEventListener('click', () => {
        currentVariant = i;
        renderVariantButtons();
        syncQuickStyle();          // the bar names the feel, not just the style
      });
      styleVariantGroup.appendChild(b);
    });
  }

  // The transport carries the style as a name you can tap rather than six
  // buttons it has no room for — the chart head's move, and like the key
  // there it's a view of the same state, not a second copy of it. The options
  // are built from the buttons, so the list is written once.
  //
  // Simple's note value belongs in that list too: on its own "Simple" says
  // nothing about what you'll hear, and quarter/half/whole is the only thing
  // left to choose once you've picked it. So Simple appears once per note
  // value, and picking one sets both.
  // A picker entry names a feel, not a style. Most styles put up one entry —
  // the feel you'd expect when you tap that name — but a style can offer
  // more than one where the difference is the reason you'd choose it: the two
  // blues feels are different music, not two shadings of the same thing. The
  // Set up sheet still has every variant; this is the short list.
  const QUICK_FEELS = {
    rock:  [{ variant: 'Quarter drive', label: 'Rock' }],
    blues: [{ variant: 'Shuffle', label: 'Blues shuffle' }, { variant: 'Jump blues', label: 'Jump blues' }],
  };
  const variantIndex = (style, name) => {
    const list = (STYLES[style] && STYLES[style].variants) || [];
    const i = list.findIndex(v => v.label === name);
    return i < 0 ? 0 : i;
  };
  const feelName = (style, index) => {
    const entry = (QUICK_FEELS[style] || []).find(e => variantIndex(style, e.variant) === index);
    if (entry) return entry.label;
    const btn = document.querySelector(`#styleGroup .genre-btn[data-value="${style}"]`);
    const styleName = btn ? btn.textContent : style;
    // a style that names no feels is offered under its own name, and that
    // name means its first one
    if (!QUICK_FEELS[style] && index === 0) return styleName;
    const variant = STYLES[style] && STYLES[style].variants[index];
    return variant ? `${styleName} · ${variant.label}` : styleName;
  };

  const quickStyle = document.getElementById('quickStyle');
  const styleLabel = document.getElementById('styleLabel');
  const noteValueButtons = () => [...document.querySelectorAll('#noteValueGroup .seg-btn')];
  const simpleName = beats => {
    const btn = noteValueButtons().find(b => b.dataset.value === String(beats));
    return btn ? `Simple ${btn.textContent.toLowerCase()} note` : 'Simple';
  };
  document.querySelectorAll('#styleGroup .genre-btn').forEach(btn => {
    const style = btn.dataset.value;
    if (style === 'simple'){
      // Simple's note value belongs in the list too: on its own "Simple" says
      // nothing about what you'll hear, and quarter/half/whole is the only
      // thing left to choose once you've picked it.
      noteValueButtons().forEach(nv =>
        quickStyle.appendChild(new Option(simpleName(nv.dataset.value), `simple.${nv.dataset.value}`)));
      return;
    }
    const feels = QUICK_FEELS[style] || [{ variant: null, label: btn.textContent }];
    feels.forEach(feel => {
      const i = feel.variant ? variantIndex(style, feel.variant) : 0;
      quickStyle.appendChild(new Option(feel.label, `${style}.${i}`));
    });
  });
  quickStyle.addEventListener('change', () => {
    const [style, arg] = quickStyle.value.split('.');
    const btn = document.querySelector(`#styleGroup .genre-btn[data-value="${style}"]`);
    if (btn) btn.click();                       // resets the variant to the first
    if (style === 'simple'){
      const nv = noteValueButtons().find(b => b.dataset.value === arg);
      if (nv) nv.click();
    } else {
      currentVariant = Math.min(Number(arg) || 0, STYLES[style].variants.length - 1);
      renderVariantButtons();
    }
    syncQuickStyle();
  });

  // the name in the bar, and which option the picker is sitting on. A feel
  // chosen in the Set up sheet that the short list doesn't carry gets an
  // entry of its own rather than leaving the picker showing the wrong thing.
  function syncQuickStyle(){
    const simple = currentStyle === 'simple';
    const want = simple ? `simple.${noteBeats}` : `${currentStyle}.${currentVariant}`;
    [...quickStyle.options].forEach(o => { if (o.dataset.extra) o.remove(); });
    if (![...quickStyle.options].some(o => o.value === want)){
      const extra = new Option(feelName(currentStyle, currentVariant), want);
      extra.dataset.extra = '1';
      quickStyle.appendChild(extra);
    }
    quickStyle.value = want;
    styleLabel.textContent = simple ? simpleName(noteBeats) : feelName(currentStyle, currentVariant);
  }

  function updatePlaybackUI(){
    const simple = currentStyle === 'simple';
    noteValueRow.hidden = !simple;
    rootOnlyRow.hidden = !simple;
    clickRow.hidden = !simple;
    styleVariantRow.hidden = simple;
    syncQuickStyle();
  }

  document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.genre-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.value === btn.dataset.value));
      currentStyle = btn.dataset.value;
      currentVariant = 0;
      renderVariantButtons();
      updatePlaybackUI();
    });
  });

  // Swaps triads for sevenths in place: the roots, the degrees, the bar
  // lengths and any chord you've set yourself all stay exactly as they are.
  randomSeventhsToggle.addEventListener('change', () => {
    currentProgression = currentProgression.map((chord, i) => {
      if (chord._deg == null) return chord;    // loaded from elsewhere; not ours to change
      return chordForDegree(chord._deg, shapeFor(i, chord._deg));
    });
    renderAll();
  });

  // resize the per-slot arrays to match; kept separate from setChordCount so a
  // loaded progression can set its own length without re-rolling itself away
  function setSlotCount(n){
    chordCount = Math.max(1, Math.min(MAX_CHORDS, n));
    chordCountValue.textContent = chordCount;
    // a slot added by the stepper comes up on a rolled degree, since every
    // slot always holds a real chord
    while (slotChoices.length < chordCount){
      slotChoices.push(rollDegree(slotChoices[slotChoices.length - 1]));
    }
    slotChoices.length = chordCount;
    while (slotMeasures.length < chordCount) slotMeasures.push(DEFAULT_MEASURES);
    slotMeasures.length = chordCount;
    while (slotShapes.length < chordCount) slotShapes.push(null);
    slotShapes.length = chordCount;
  }

  // Changing the count adds or drops a chord and leaves the rest alone —
  // there's no reason for it to throw away chords you chose.
  function setChordCount(n){
    setSlotCount(n);
    clearPreset();
    loadedLabel = null;
    rebuildProgression();
    renderAll();
  }
  document.getElementById('chordCountDown').addEventListener('click', () => {
    if (chordCount <= 1) return;
    setChordCount(chordCount - 1);
  });
  document.getElementById('chordCountUp').addEventListener('click', () => {
    if (chordCount >= MAX_CHORDS) return;
    setChordCount(chordCount + 1);
  });


  document.querySelectorAll('#noteValueGroup .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#noteValueGroup .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      noteBeats = Number(btn.dataset.value);
      syncQuickStyle();      // Simple is named for its note value in the bar
    });
  });

  function getTempo(){ return Number(tempoInput.value); }
  // how many measures a given chord in the progression lasts, and the beats
  // that works out to (4/4 throughout)
  function measuresFor(i){ return slotMeasures[i] || DEFAULT_MEASURES; }
  function beatsForChord(i){ return measuresFor(i) * 4; }
  function getNoteBeats(){ return noteBeats; } // 1 = quarter, 2 = half, 4 = whole

  tempoInput.addEventListener('input', () => {
    tempoVal.textContent = `${getTempo()} BPM`;
    document.querySelectorAll('.bpm-preset')
      .forEach(b => b.classList.toggle('active', Number(b.dataset.bpm) === getTempo()));
  });

  document.querySelectorAll('.bpm-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      tempoInput.value = btn.dataset.bpm;
      tempoInput.dispatchEvent(new Event('input'));
    });
  });

  let isPlaying = false;
  let schedulerId = null;
  let nextNoteTime = 0;
  let chordIdx = 0;
  let beatInChord = 0;
  let scheduledLog = []; // {idx, time} for syncing the visual highlight
  let playbackStartTime = 0; // audioCtx time of the first chord (after any count-in)
  let countInFrom = null;    // audioCtx time of the first count-in click, or null for no count-in
  let countInSpb = 0;        // seconds per beat during the count-in

  const ICON_PLAY = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M3.5 2.2v11.6c0 .78.85 1.26 1.52.86l9.3-5.8c.65-.4.65-1.32 0-1.72l-9.3-5.8c-.67-.4-1.52.08-1.52.86Z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3.2" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/><rect x="9.4" y="2.2" width="3.4" height="11.6" rx="1" fill="currentColor"/></svg>';

  function setPlayLabel(text){
    const icon = text === 'Pause' ? ICON_PAUSE : ICON_PLAY;
    playBtns.forEach(b => {
      b.innerHTML = `${icon}<span>${text}</span>`;
      b.setAttribute('aria-label', text);
    });
  }

  function resetPlaybackCursor(){
    chordIdx = 0;
    beatInChord = 0;
    scheduledLog = [];
    view.resetFollow();
    document.querySelectorAll('#chords .bar').forEach(el => el.classList.remove('dim', 'active'));
    measureReadout.textContent = '';
  }


  const LOOKAHEAD_MS = 25;
  // How far ahead of the sound the notes are queued. It has to cover the
  // longest the timer below might be held up: a browser throttles the timers
  // of a page that isn't focused, to a second or more, and a beat queued after
  // its moment has passed doesn't play late — every note of it starts at once,
  // which is what a burst of pops is. Stopping playback calls off whatever is
  // still queued, so the cushion costs nothing at the button.
  const SCHEDULE_AHEAD_SEC = 0.4;

  // How hard the Simple style strikes: an accent on the downbeat, not a
  // different instrument. This was 1 against 0.62 — 4.4 dB, half again as
  // loud — and worse, those two straddle the sample layers' split, so beat
  // one came off a hard strike and beats two to four off soft ones, and a bar
  // alternated between two pianos. A player leans on the downbeat by a couple
  // of decibels. The layers cross-fade now (see audio.js), and this is the
  // other half of the fix.
  const SIMPLE_ACCENT = { downbeat: 0.86, other: 0.68 };

  // How long a hit in the Simple style rings: until the next one lands, and no
  // longer. It used to ring 2.3 times that, on the reasoning that a piano's
  // notes overlap — which they do, and the synthesized voice fell away far
  // enough by itself that the overlap read as ring. The recordings actually
  // sustain, so the same rule turned a bar of quarter notes into one chord
  // held under the next two. The envelope tapers over the last third of the
  // note, so this lands the fade just as the next hit arrives rather than
  // chopping it off.
  function simpleHitSeconds(secondsPerBeat, noteBeats){
    return secondsPerBeat * noteBeats;
  }

  function scheduleSimpleBeat(chord, secondsPerBeat, beatInMeasure, isDownbeat){
    const noteBeats = getNoteBeats();
    const shouldTrigger = beatInMeasure % noteBeats === 0;
    if (chord && shouldTrigger){
      const interval = secondsPerBeat * noteBeats;
      const duration = simpleHitSeconds(secondsPerBeat, noteBeats);
      const velocity = isDownbeat ? SIMPLE_ACCENT.downbeat : SIMPLE_ACCENT.other;
      if (rootOnlyToggle.checked){
        // boost the lone root so it sits at a similar loudness to a full triad
        playNote(noteFreq(chord.note, ROOT_OCTAVE), nextNoteTime, duration, velocity * 1.9);
      } else {
        playChord(chord, nextNoteTime, duration, velocity, chordVoice);
      }
    }
    if (clickToggle.checked) playHiHat(nextNoteTime);
    // Every beat goes in the log, struck or not. The log is what the chart
    // reads to sweep its beat line, and on half and whole notes only one beat
    // in two or four is struck — logging just those left the line sitting
    // still between attacks instead of moving a quarter of the bar per beat.
    if (chord){
      scheduledLog.push({
        idx: chordIdx, time: nextNoteTime,
        measure: Math.floor(beatInChord / 4) + 1,
        beat: (beatInChord % 4) + 1,
      });
    }
  }

  function scheduleStyleBeat(style, chord, secondsPerBeat, beatInMeasure){
    const subPerBeat = style.grid / 4;
    const slotDur = secondsPerBeat / subPerBeat;
    const nextChord = currentProgression[(chordIdx + 1) % currentProgression.length];
    const approachNext = Math.floor(beatInChord / 4) === measuresFor(chordIdx) - 1;
    const accentEvery = style.grid / 4;

    for (let k = 0; k < subPerBeat; k++){
      const slot = beatInMeasure * subPerBeat + k;
      const t = nextNoteTime + k * slotDur;

      if (style.kick && style.kick.includes(slot)) playKick(t, style.kickVel || 0.9);
      if (style.snare && style.snare.includes(slot)) playSnare(t, style.snareVel || 0.85);
      if (style.hat && style.hat.includes(slot)){
        playHiHat(t, slot % accentEvery === 0 ? 0.55 : 0.32);
      }
      if (style.ride && style.ride.includes(slot)) playRide(t, 0.55);

      if (chord){
        const ce = style.chord && style.chord.find(e => e.slot === slot);
        if (ce) playStyleVoice(style.voice, chord, t, ce.dur * slotDur, ce.vel, chordVoice);

        const be = style.bass && style.bass.find(e => e.slot === slot);
        if (be){
          const freq = 'walk' in be
            ? walkBassFreq(chord, nextChord, be.walk, approachNext)
            : audio.bassNote(SEMITONE[chord.note] % 12, be.off);
          playBass(freq, t, be.dur * slotDur, be.vel);
        }
      }
    }

    if (chord){
      scheduledLog.push({
        idx: chordIdx, time: nextNoteTime,
        measure: Math.floor(beatInChord / 4) + 1,
        beat: (beatInChord % 4) + 1,
      });
    }
  }

  // Move the cursor on to the next beat of the progression.
  function advanceBeat(secondsPerBeat){
    nextNoteTime += secondsPerBeat;
    beatInChord++;
    if (beatInChord >= beatsForChord(chordIdx)){
      beatInChord = 0;
      chordIdx = (chordIdx + 1) % currentProgression.length;
    }
  }

  function scheduler(){
    const now = audio.ctx().currentTime;
    const secondsPerBeat = 60 / getTempo();
    // A beat whose moment has passed can't be played — queueing it would start
    // every note of it at once — so step over the ones a stall ate. The
    // progression slips, which is what a metronome does when you look away.
    for (let skip = audio.stepsToSkip(nextNoteTime, now, secondsPerBeat); skip > 0; skip--){
      advanceBeat(secondsPerBeat);
    }

    while (nextNoteTime < now + SCHEDULE_AHEAD_SEC){
      const chord = currentProgression[chordIdx];
      const beatInMeasure = beatInChord % 4;

      if (currentStyle === 'simple'){
        scheduleSimpleBeat(chord, secondsPerBeat, beatInMeasure, beatInMeasure === 0);
      } else {
        scheduleStyleBeat(STYLES[currentStyle].variants[currentVariant], chord, secondsPerBeat, beatInMeasure);
      }

      advanceBeat(secondsPerBeat);
    }
    schedulerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function syncHighlight(){
    if (!isPlaying) return;
    const now = audio.ctx().currentTime;

    // during the count-in, show the running beat number where the
    // measure.beat readout normally sits
    if (countInFrom != null && now < playbackStartTime - 0.0005){
      const b = Math.min(4, Math.max(1, Math.floor((now - countInFrom) / countInSpb) + 1));
      measureReadout.textContent = String(b);
      requestAnimationFrame(syncHighlight);
      return;
    }

    while (scheduledLog.length > 1 && scheduledLog[1].time <= now){
      scheduledLog.shift();
    }
    const active = scheduledLog[0];
    if (active){
      const currentBar = barOffset(active.idx) + Math.min(active.measure, measuresFor(active.idx)) - 1;
      document.querySelectorAll('#chords .bar').forEach(el => {
        const isActive = Number(el.dataset.bar) === currentBar;
        el.classList.toggle('active', isActive);
        el.classList.toggle('dim', !isActive);
      });
      measureReadout.textContent =
        `${Math.min(active.measure, measuresFor(active.idx))}.${active.beat}`;
      view.followChord(active);
    }
    requestAnimationFrame(syncHighlight);
  }

  function stopPlayback(){ if (isPlaying) togglePlay(); }

  function togglePlay(){
    ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    // A progression plays to a clock and can't wait for a recording mid-bar,
    // so they're fetched at the press rather than one chord at a time.
    // Nothing waits on it: until they land the synthesized voice plays.
    if (chordVoice === 'guitar') audio.warmGuitar();
    else warmThePiano();
    audio.warmBass();          // the bass plays under every style and every voice

    if (!isPlaying){
      isPlaying = true;
      resetPlaybackCursor();
      nextNoteTime = audio.ctx().currentTime + 0.05;
      countInSpb = 60 / getTempo();
      // null when there's no count-in to show. The first chord is scheduled
      // 50ms out either way, and reading that gap as a count-in printed a
      // clamped "1" in the measure readout for those 50ms before the real
      // measure.beat took over.
      countInFrom = countInToggle.checked ? nextNoteTime : null;
      if (countInToggle.checked){
        for (let i = 0; i < 4; i++) playHiHat(nextNoteTime + i * countInSpb);
        nextNoteTime += 4 * countInSpb;
      }
      playbackStartTime = nextNoteTime;
      scheduler();
      requestAnimationFrame(syncHighlight);
      setPlayLabel('Pause');
      audio.keepAwake(true);      // a phone on a music stand shouldn't sleep mid-progression
      view.onPlaybackStarted();
    } else {
      isPlaying = false;
      clearTimeout(schedulerId);
      // the notes queued ahead of the sound would otherwise play on past the
      // button; what's already sounding is left to ring out
      audio.cancelScheduled();
      document.querySelectorAll('#chords .bar').forEach(el => el.classList.remove('dim', 'active'));
      measureReadout.textContent = '';
      setPlayLabel('Play');
      audio.keepAwake(false);
      view.onPlaybackStopped();
    }
  }

  playBtns.forEach(b => b.addEventListener('click', togglePlay));
  // space bar starts and stops, unless you're typing somewhere
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat) return;
    if (document.getElementById('page-caged').hidden) return;
    if (GT.keys.typing(e.target)) return;
    e.preventDefault();
    togglePlay();
  });

  // ---- sharing a progression by link ---------------------------------------
  // The state rides in the URL fragment after the tab name:
  //   #caged-practice?k=major:C&c=0.2.maj7,3.1,4.1.7&t=90&s=blues.0
  // k = mode:tonic; c = one entry per chord as root.bars.shape, where a root is
  // a scale degree or a 'c'-prefixed interval above the tonic (shape blank
  // for the key's own triad); t = tempo; s = style.variant. A progression that
  // came in as chord names (from a genre example) is written as n = name.bars
  // instead, since its chords aren't degrees of anything.
  function shareState(){
    const p = new URLSearchParams();
    p.set('k', `${currentMode}:${currentTonic}`);
    if (currentProgression.every(c => c._deg != null)){
      p.set('c', currentProgression.map((c, i) => [c._deg, measuresFor(i), c._shape || ''].join('.')).join(','));
    } else {
      p.set('n', currentProgression.map((c, i) => `${displayName(c)}.${measuresFor(i)}`).join(','));
      if (loadedLabel) p.set('l', loadedLabel);
    }
    p.set('t', String(getTempo()));
    if (currentStyle !== 'simple') p.set('s', `${currentStyle}.${currentVariant}`);
    if (chordVoice !== 'piano') p.set('v', chordVoice);
    // ...and what the neck under the chart is showing, as one field. It's
    // empty whenever the neck is at its defaults, which is most of the time.
    const fretboard = view.viewState();
    if (fretboard) p.set('f', fretboard);
    return p;
  }

  // T46 left this tab writing its state only when you pressed Copy link, on
  // the grounds that it has more state than the others and a long fragment is
  // an ugly thing to look at. Two things settled it the other way. The view
  // state this now carries is exactly what you'd want a bookmark to hold —
  // you were on the third box of the A-shape pentatonic, not just in A minor
  // — and a setting you have to remember to press a button to keep is a
  // setting you lose. So it writes as you go, like the other four tabs, and
  // the defaults are left out so the link only grows as far as you've
  // strayed from them. Copy link stays: it puts the address on the clipboard,
  // which is the part the address bar can't do for you.
  function writeShareState(){
    GT.tabs.setState('caged', shareState().toString());
  }

  // Bring a shared link's state in. Returns false if there wasn't one, so the
  // caller can roll a progression as usual.
  function applyShareState(p){
    if (!p.get('k') || !(p.get('c') || p.get('n'))) return false;
    const [mode, tonic] = p.get('k').split(':');
    const table = mode === 'major' ? MAJOR_KEYS : mode === 'minor' ? MINOR_KEYS : null;
    if (!table || !table[tonic]) return false;
    setKey(mode, tonic);
    chordVoice = p.get('v') === 'guitar' ? 'guitar' : 'piano';
    voiceGroup.querySelectorAll('.seg-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.value === chordVoice));

    if (p.get('t')){
      tempoInput.value = p.get('t');
      tempoInput.dispatchEvent(new Event('input'));
    }
    if (p.get('s')){
      const [style, variant] = p.get('s').split('.');
      const btn = document.querySelector(`#styleGroup .genre-btn[data-value="${style}"]`);
      if (btn && STYLES[style]){
        btn.click();                       // which resets the feel to the first
        currentVariant = Math.min(Number(variant) || 0, STYLES[style].variants.length - 1);
        renderVariantButtons();
        syncQuickStyle();                  // ...so the bar has to be told again
      }
    }

    // the neck is set before the chords, so the redraw that follows them
    // draws the view the link asked for rather than the one that was up
    view.applyViewState(p.get('f') || '');

    if (p.get('n')){
      const entries = p.get('n').split(',').map(e => e.split('.'));
      const chords = [];
      entries.forEach(([name, bars]) => { for (let b = 0; b < (Number(bars) || 1); b++) chords.push(name); });
      loadProgression({ chords, label: p.get('l') || null, key: tonic });
      return true;
    }
    const entries = p.get('c').split(',').map(e => e.split('.'));
    const valid = new Set(currentDiatonic.map(c => c.deg));
    // a root is a degree of the key, or one of the twelve written as an
    // interval above the tonic — which every key has, so it needs no checking
    const rootOf = deg => chromaticOf(deg) == null ? Number(deg) : deg;
    const kept = entries
      .filter(([deg]) => valid.has(Number(deg)) || chromaticOf(deg) != null)
      .slice(0, MAX_CHORDS);
    if (!kept.length) return false;
    setSlotCount(kept.length);
    slotChoices = kept.map(([deg]) => rootOf(deg));
    slotMeasures = kept.map(([, bars]) => Math.max(1, Number(bars) || 1));
    slotShapes = kept.map(([, , shape]) => CHORD_SHAPES[shape] ? shape : null);
    currentProgression = kept.map(([deg], i) => chordForDegree(rootOf(deg), slotShapes[i]));
    renderAll();
    return true;
  }

  // The stretch of piano this app can reach, fetched in one go. Not the whole
  // keyboard (see audio.js: decoded, that would be 125 MB of it) and no
  // longer chord by chord either — the style picks the voicing, the style can
  // change mid-progression, and warming what this chord needs is what left
  // the jazz comp playing a synthesized piano over sampled everything else.
  function warmThePiano(){ audio.warmPiano(); }

  const voiceGroup = document.getElementById('voiceGroup');
  voiceGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      voiceGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      chordVoice = btn.dataset.value;
      ensureAudio();
      if (chordVoice === 'guitar') audio.warmGuitar(); else warmThePiano();
    });
  });

  const shareBtn = document.getElementById('shareBtn');
  const shareOut = document.getElementById('shareOut');

  // Write the progression into the address bar and onto the clipboard. Says
  // whether the copy took, so each button offering it can report back its own
  // way — and hands back the link for the ones that show it.
  let shareUrl = '';
  async function copyShareLink(){
    const slug = location.hash.slice(1).split('?')[0] || 'caged-practice';
    shareUrl = `${location.href.split('#')[0]}#${slug}?${shareState()}`;
    try { history.replaceState(null, '', `#${slug}?${shareState()}`); } catch (e) { /* file:// can refuse */ }
    try { await navigator.clipboard.writeText(shareUrl); return true; } catch (e) { return false; }
  }

  shareBtn.addEventListener('click', async () => {
    const copied = await copyShareLink();
    const url = shareUrl;
    shareOut.value = url;
    shareOut.hidden = copied;
    if (!copied){ shareOut.focus(); shareOut.select(); }
    shareBtn.textContent = copied ? 'Link copied ✓' : 'Copy the link above';
    clearTimeout(shareBtn._reset);
    shareBtn._reset = setTimeout(() => { shareBtn.textContent = 'Copy link to this progression'; }, 2200);
  });

  // Take a progression from somewhere else in the app — a genre example, say —
  // and set the practice tab up to play it. Runs of the same chord collapse
  // into one chord held for that many measures, which is how a twelve-bar
  // blues fits into seven slots.
  function loadProgression({ chords, label, tempo, key }){
    if (!chords || !chords.length) return;
    stopPlayback();

    const runs = [];
    chords.forEach(name => {
      const last = runs[runs.length - 1];
      if (last && last.name === name) last.bars++;
      else runs.push({ name, bars: 1 });
    });
    const kept = runs.slice(0, MAX_CHORDS);

    // The progression's own key decides the roman numerals; without one, read
    // the first chord as the tonic. Nothing says which mode it's in, so read
    // that off the chord sitting on the tonic — a minor one means a minor
    // key, and its VI and VII are then written plainly, not as ♭VI and ♭VII.
    const tonicPc = key !== undefined && SEMITONE[key] !== undefined
      ? SEMITONE[key]
      : (SEMITONE[(chordFromName(kept[0].name) || {}).note] || 0);
    const tonicChord = kept.map(r => parseChordName(r.name)).find(p => p && p.rootPc % 12 === tonicPc % 12);
    const mode = tonicChord && tonicChord.formula.intervals.includes(3) ? 'minor' : 'major';
    const built = kept.map(r => chordFromName(r.name, tonicPc, mode)).filter(Boolean);
    if (!built.length) return;

    setSlotCount(built.length);
    // Move to the key it came in, so changing key from here shifts by the right
    // interval rather than from whatever was last generated — and so the chord
    // pickers rate its chords against the right scale.
    if (key && SEMITONE[key] !== undefined){
      const table = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;
      if (table[key]) setKey(mode, key);
      else currentTonic = key;
    }
    currentProgression = built;
    // A loaded chord that happens to be a degree of the key it came in gets
    // pinned to it, so its picker reads as a degree like every other slot;
    // one that isn't (a borrowed ♭VII, a secondary dominant) keeps null and
    // names itself instead.
    slotChoices = built.map(c => {
      const rootPc = SEMITONE[c.note] % 12;
      const match = currentDiatonic.find(d => SEMITONE[d.note] % 12 === rootPc
        && d.quality === c.quality);
      return match ? match.deg : null;
    });
    slotMeasures = kept.slice(0, built.length).map(r => r.bars);
    // spelled out rather than left to the key: a loaded progression is whatever
    // it is, so its pickers should show the chord that's actually sounding
    slotShapes = built.map(shapeOf);
    loadedLabel = label || null;
    if (tempo){
      tempoInput.value = tempo;
      tempoInput.dispatchEvent(new Event('input'));
    }
    renderAll();
  }

  // ---- typing the progression ----
  // One chord per bar, so a chord held for four bars is written four times
  // and loadProgression collapses the run — the same road a genre example
  // takes in. Bar lines and commas are allowed because people write them:
  // "E | A7 | E" and "E, A7, E" both mean what they look like.
  //
  // The key comes from the chords rather than the other way round: the first
  // chord is the tonic, and its quality says major or minor. Typing names is
  // a statement about what to play, and half the reason to type them is to
  // reach something the dice would never roll — a borrowed chord, a secondary
  // dominant — which reading them against the current key would throw away.
  // Change the key afterwards and the whole thing transposes, the way a
  // loaded progression does.
  const TOKEN_SPLIT = /[\s,|]+/;

  function say(message, bad){
    chordTextNote.textContent = message || '';
    chordTextNote.hidden = !message;
    chordTextNote.classList.toggle('bad', !!bad);
  }

  // The field is a view of the progression as much as a way in, so it follows
  // whatever is set — unless you're in the middle of typing, which nothing
  // should interrupt.
  function syncChordText(){
    if (!chordText || document.activeElement === chordText) return;
    chordText.value = chordTextFromProgression();
  }

  // What's set, written out the way you would type it: one token a bar.
  function chordTextFromProgression(){
    return currentProgression.map((chord, i) =>
      Array(Math.max(1, measuresFor(i))).fill(displayName(chord)).join(' ')).join(' ');
  }

  function applyTypedChords(){
    const tokens = chordText.value.trim().split(TOKEN_SPLIT).filter(Boolean);
    if (!tokens.length){ say('Type a chord for each bar, like E E E E A7 A7 E E Bm7 Bm7.'); return false; }

    // Refuse the line rather than the token: a progression with a hole in it
    // is not what anyone meant, and saying which word is wrong is more use
    // than quietly dropping it.
    const unknown = [...new Set(tokens.filter(t => !chordFromName(t)))];
    if (unknown.length){
      say(`${unknown.length === 1 ? "Can't read" : "Can't read these:"} ${unknown.map(u => `"${u}"`).join(', ')}`, true);
      return false;
    }
    // runs of the same chord collapse, so the limit is on chord changes
    const runs = tokens.filter((t, i) => t !== tokens[i - 1]).length;
    if (runs > MAX_CHORDS){
      say(`That's ${runs} chord changes; there's room for ${MAX_CHORDS}.`, true);
      return false;
    }
    // The key follows the chords — the first one is read as the tonic, and
    // whether it's major or minor decides the mode. loadProgression only
    // adopts a key when it's handed one; left to itself it keeps whatever was
    // set, which would leave "F Bb C F" sitting in A minor and every numeral
    // under the chart wrong.
    const first = chordFromName(tokens[0]);
    loadProgression({ chords: tokens, key: first && first.note });
    say(`${tokens.length} bar${tokens.length === 1 ? '' : 's'}, ${runs} chord${runs === 1 ? '' : 's'}.`);
    return true;
  }

  chordTextApply.addEventListener('click', applyTypedChords);
  chordText.addEventListener('keydown', e => {
    if (e.key === 'Enter'){ e.preventDefault(); applyTypedChords(); }
  });
  // an edit that hasn't been applied yet shouldn't keep shouting about the
  // last one that failed
  chordText.addEventListener('input', () => say(''));

  GT.practice = {
    // leaving the tab shouldn't leave a progression playing behind you
    stop(){ if (isPlaying) togglePlay(); },
    loadProgression,
    copyShareLink,
    simpleHitSeconds, SIMPLE_ACCENT, DEFAULT_FEEL,
    init(){
      view.init({
        progression: () => currentProgression,
        isPlaying:   () => isPlaying,
        mode:        () => currentMode,
        tonic:       () => currentTonic,
        activeChord: () => scheduledLog[0],
        // the neck's own controls are its business, but the address bar is
        // this tab's — so it says when it has redrawn and the link follows
        viewChanged: writeShareState,
      });
      // the style buttons are markup, so the default has to be put on them
      document.querySelectorAll('.genre-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.value === currentStyle));
      renderVariantButtons();
      updatePlaybackUI();
      setPlayLabel('Play');
      // A shared link doesn't only arrive on a cold page: it gets pasted into
      // the bar of a tab already open here, and back/forward walks between two
      // of them. tabs.js hears those, but it only switches tabs — the state
      // half of the fragment went unread, so the link quietly did nothing.
      // Our own writes go through history.replaceState, which fires neither
      // event, so this can't loop.
      ['hashchange', 'popstate'].forEach(e =>
        window.addEventListener(e, () => {
          if (isPlaying) togglePlay();      // don't leave the old one playing
          applyShareState(GT.tabs.stateParams());
        }));
      // A shared link opens on its progression; otherwise open on something
      // recognisable rather than a random roll — the first preset the key's
      // own mode offers, with the picker showing which one it is. The dice
      // are right there for a random one.
      if (!applyShareState(GT.tabs.stateParams())){
        const mode = Math.random() < 0.5 ? 'major' : 'minor';
        setKey(mode, pick(Object.keys(mode === 'major' ? MAJOR_KEYS : MINOR_KEYS)));
        const first = GT.progressionPresets.findIndex(fitsMode);
        if (first === -1) render();          // no preset for this mode: roll one
        else {
          loadPreset(first);
          buildPresetSelect();               // ...and show which one it is
          presetSelect.value = String(first);
        }
      }
      // The address bar should describe the page from the moment it settles,
      // not from the first time something is touched. It's written after the
      // header has wired the tabs up, since only the tab on show may write.
      setTimeout(writeShareState, 0);
    },
  };
})();
