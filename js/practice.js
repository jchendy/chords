// The practice tab: rolling a progression, the chord display and its
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
    playNote, playChord, playBass, playHiHat, playRide, playKick, playSnare, playStyleVoice, ROOT_ALONE,
  } = GT.audio;
  const view = GT.fretboardView;

  let currentProgression = [];
  let chordCount = 3;
  const MAX_CHORDS = 12;        // enough to hold a twelve-bar blues once repeats are merged
  // The key and every chord are always something concrete you can read off the
  // pickers; randomness is a button you press, not a state a slot sits in. A
  // slot holds the scale degree it's on, or a root outside the key written as
  // the semitones above the tonic ('c3' is a ♭III) — or null, which means only
  // that this chord isn't a root you picked at all (one that was typed in),
  // and its picker names the chord itself instead.
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

  // Which root of the current key a slot is sitting on — a degree, or one of
  // the chromatic ids. Chords generated here carry their root; a typed one
  // doesn't, so match it by pitch: to a degree if the key has
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
      slot.dataset.chord = i;
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
      // a chord that was typed in is on no root you picked; it still
      // gets to name itself, and picking anything else replaces it
      const offOpt = (slotChoices[i] == null && currentProgression[i])
        ? `<option value="off">${displayName(currentProgression[i])}</option>` : '';
      sel.innerHTML = offOpt
        + `<optgroup label="In this key">${inKeyOpts.join('')}</optgroup>`
        + `<optgroup label="Outside the key">${outsideOpts.join('')}</optgroup>`;
      sel.value = slotChoices[i] == null ? 'off' : String(slotChoices[i]);
      sel.addEventListener('change', () => {
        if (sel.value === 'off') return;         // it's already that chord
        const j = isolateBar(i);                 // this bar alone, if the chord is held
        slotChoices[j] = chromaticOf(sel.value) == null ? Number(sel.value) : sel.value;
        // a chord picked by hand starts from the key's own shape for it,
        // unless a shape was already set on this slot
        currentProgression[j] = chordForDegree(slotChoices[j], shapeFor(j, slotChoices[j]));
        loadedLabel = null;
        clearPreset();
        renderAll();
      });
      slot.appendChild(sel);

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
        const j = isolateBar(i);
        // leaving the untouched choice unrecorded is what lets a slot follow
        // the key when you transpose or flip Major/Minor
        slotShapes[j] = sev.value === implied ? null : sev.value;
        currentProgression[j] = chordForDegree(deg, shapeFor(j, deg));
        clearPreset();
        renderAll();
      });
      slot.appendChild(sev);

      // or name the bar's chord outright
      const typed = document.createElement('span');
      typed.className = 'bar-type';
      const field = document.createElement('input');
      field.type = 'text'; field.className = 'chord-text bar-type-field'; field.placeholder = currentProgression[i] ? displayName(currentProgression[i]) : 'A7';
      field.spellcheck = false; field.setAttribute('aria-label', `Type a chord for bar ${i + 1}`);
      const setBtn = document.createElement('button');
      setBtn.type = 'button'; setBtn.className = 'tbtn bar-type-set'; setBtn.textContent = 'Set';
      const apply = () => {
        const name = field.value.trim();
        if (!name) return;
        if (!setBarFromName(i, name)){ field.classList.add('bad'); field.setAttribute('aria-invalid', 'true'); }
      };
      setBtn.addEventListener('click', apply);
      field.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); apply(); } });
      field.addEventListener('input', () => { field.classList.remove('bad'); field.removeAttribute('aria-invalid'); });
      typed.appendChild(field); typed.appendChild(setBtn);
      slot.appendChild(typed);

      const rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'ib remove'; rm.textContent = '×';
      rm.setAttribute('aria-label', `Remove bar ${i + 1}`); rm.title = 'Remove this bar';
      rm.disabled = chordCount <= 1 && measuresFor(i) <= 1;
      rm.addEventListener('click', () => removeBar(i));
      slot.appendChild(rm);

      chordSlotsEl.appendChild(slot);
    }
    if (editing) chordSlotsEl.querySelectorAll('.chord-row').forEach(row => { row.hidden = Number(row.dataset.chord) !== editing.chord; });
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
  const barEditor = document.getElementById('barEditor');
  // The bar you tap is heard and opened for editing: its row of the chord
  // editor (chord, bars, quality, remove) appears under it. The "+ bar" cell
  // at the end adds a chord.
  // which bar is open in the editor: its chord's slot, and which of that
  // chord's bars it is
  let editing = null;
  // A change made in the editor is to one bar. When the bar belongs to a
  // chord held for several, that bar is split off first — the bars before
  // it, the bar, the bars after — so the chord, the quality, a typed name or
  // a delete touch only it. Returns the bar's own slot.
  function isolateBar(i){
    if (!editing || editing.chord !== i) return i;
    const m = measuresFor(i);
    if (m <= 1) return i;
    const before = editing.measure, after = m - before - 1;
    const pieces = [before, 1, after].filter(n => n > 0);
    if (chordCount + pieces.length - 1 > MAX_CHORDS) return i;     // no room to split: the whole chord it is
    const copy = () => ({ choice: slotChoices[i], shape: slotShapes[i], chord: { ...currentProgression[i] } });
    const parts = pieces.map(n => ({ ...copy(), bars: n }));
    slotChoices.splice(i, 1, ...parts.map(x => x.choice));
    slotShapes.splice(i, 1, ...parts.map(x => x.shape));
    currentProgression.splice(i, 1, ...parts.map(x => x.chord));
    slotMeasures.splice(i, 1, ...parts.map(x => x.bars));
    chordCount = slotChoices.length;
    const j = i + (before > 0 ? 1 : 0);
    editing = { chord: j, measure: 0 };
    return j;
  }
  function openBarEditor(bar){
    if (!barEditor) return;
    const idx = Number(bar.dataset.chord);
    editing = { chord: idx, measure: Number(bar.dataset.bar) - barOffset(idx) };
    showBarEditor(bar);
  }
  // the editor on a bar: that bar marked, that chord's row alone, the box under it
  function showBarEditor(bar){
    if (!barEditor || !editing) return;
    chordsRoot.querySelectorAll('.bar.editing').forEach(b => b.classList.remove('editing'));
    bar.classList.add('editing');
    chordSlotsEl.querySelectorAll('.chord-row').forEach(row => { row.hidden = Number(row.dataset.chord) !== editing.chord; });
    barEditor.hidden = false;
    // under the bar, kept inside the page
    const host = barEditor.offsetParent || document.body;
    const hb = host.getBoundingClientRect(), bb = bar.getBoundingClientRect();
    const width = barEditor.offsetWidth || 400;
    barEditor.style.top = `${bb.bottom - hb.top + 6}px`;
    barEditor.style.left = `${Math.max(8, Math.min(bb.left - hb.left, hb.width - width - 8))}px`;
  }
  function closeBarEditor(){
    editing = null;
    if (!barEditor || barEditor.hidden) return;
    barEditor.hidden = true;
    chordsRoot.querySelectorAll('.bar.editing').forEach(b => b.classList.remove('editing'));
  }
  chordsRoot.addEventListener('click', e => {
    const bar = e.target.closest('.bar, .add-bar');
    if (!bar) return;
    e.stopPropagation();                      // the editor closes on a tap elsewhere; this isn't elsewhere
    if (bar.classList.contains('add-bar')){ addChord(); return; }
    auditionBar(bar);
    openBarEditor(bar);
  });
  chordsRoot.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const bar = e.target.closest('.bar, .add-bar');
    if (!bar) return;
    // on a focused bar the space bar means "hear this one", not play/pause
    e.preventDefault();
    e.stopPropagation();
    if (bar.classList.contains('add-bar')){ addChord(); return; }
    auditionBar(bar);
    openBarEditor(bar);
  });
  if (barEditor) barEditor.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', closeBarEditor);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBarEditor(); });

  // one more bar on the end: the last chord again, as its own slot lasting
  // one bar, so it can be changed on its own
  function addChord(){
    if (chordCount >= MAX_CHORDS) return;
    closeBarEditor();
    const last = chordCount - 1;
    slotChoices.push(slotChoices[last]);
    slotMeasures.push(1);
    slotShapes.push(slotShapes[last]);
    currentProgression.push({ ...currentProgression[last] });
    chordCount++;
    loadedLabel = null;
    clearPreset();
    renderAll();
  }
  // one bar out: a chord held for several loses one, a chord of one bar goes
  function removeBar(i){
    if (measuresFor(i) > 1){
      closeBarEditor();
      slotMeasures[i] = measuresFor(i) - 1;      // a length never set is the default, not a number to take one from
      loadedLabel = null;
      clearPreset();
      renderAll();
      return;
    }
    removeChord(i);
  }
  // a bar named by hand — "A7", "Bbm7" — the way a typed progression names
  // its bars: pinned to a degree when the key owns that root in that
  // quality, otherwise a chord that names itself
  function setBarFromName(i, name){
    const chord = chordFromName(name, SEMITONE[currentTonic], currentMode);
    if (!chord) return false;
    const j = isolateBar(i);
    const rootPc = SEMITONE[chord.note] % 12;
    const match = currentDiatonic.find(d => SEMITONE[d.note] % 12 === rootPc && d.quality === chord.quality);
    slotChoices[j] = match ? match.deg : null;
    slotShapes[j] = shapeOf(chord);
    currentProgression[j] = chord;
    loadedLabel = null;
    clearPreset();
    renderAll();
    return true;
  }
  // one chord out of the middle; the ones after it move up
  function removeChord(i){
    if (chordCount <= 1) return;
    closeBarEditor();
    slotChoices.splice(i, 1);
    slotMeasures.splice(i, 1);
    slotShapes.splice(i, 1);
    currentProgression.splice(i, 1);
    chordCount--;
    loadedLabel = null;
    clearPreset();
    renderAll();
  }

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
    if (editing && barEditor && !barEditor.hidden){
      const want = barOffset(editing.chord) + editing.measure;
      const bar = [...chordsEl.querySelectorAll('.bar')].find(b => Number(b.dataset.bar) === want);
      if (bar) showBarEditor(bar); else closeBarEditor();
    }
    // "+" at the right edge of the last bar, inside its cell, so it takes no
    // room of its own; it adds one bar of the same chord after it
    const lastBar = chordsEl.lastElementChild;
    if (lastBar && chordCount < MAX_CHORDS){
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'add-bar';
      add.title = 'Add a bar of this chord';
      add.setAttribute('aria-label', 'Add a bar of this chord');
      add.textContent = '+';
      lastBar.appendChild(add);
    }
  }

  // render everything from the current progression WITHOUT re-rolling it
  function renderAll(){
    syncChordText();
    writeShareState();
    rebuildPart();
    document.getElementById('keyReadout').textContent =
      loadedLabel || (currentMode === 'major' ? `${currentTonic} major` : `${currentTonic}m`);
    renderChordDisplay();
    syncLoop();
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

  const randomKey = () => { clearPreset(); randomizeKey(); };
  document.getElementById('quickKeyDice').addEventListener('click', randomKey);
  document.getElementById('quickRandomChords').addEventListener('click', () => {
    loadedLabel = null;
    clearPreset();
    randomizeProgression();
    view.resetPosition();
    renderAll();
  });

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
  // typed progression — are shifted by the same interval.
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
      // Otherwise it's a chord of no degree at all (one that was typed in).
      // Spell its shape out, so its picker describes what's sounding.
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


  const DEFAULT_MEASURES = 2;   // what a freshly rolled chord lasts
  let noteBeats = 1;
  // What a fresh page plays: rock on the quarter-note feel — a backing that
  // keeps time without filling the bar, which is what you want under
  // practice. Named rather than inlined so the test can hold it.
  const DEFAULT_FEEL = { style: 'rock', variant: 'Rock' };
  // 'simple' | a key of STYLES, and an index into its variants
  let currentStyle = DEFAULT_FEEL.style;
  let currentVariant = Math.max(0,
    STYLES[DEFAULT_FEEL.style].variants.findIndex(v => v.label === DEFAULT_FEEL.variant));

  const rootOnlyRow = document.getElementById('rootOnlyRow');
  const clickRow = document.getElementById('clickRow');
  const styleGroup = document.getElementById('styleGroup');
  const quickStyle = document.getElementById('quickStyle');
  const styleLabel = document.getElementById('styleLabel');

  // ---- the one list of styles ----
  // A style to play under the chords is a feel — Rock, Blues shuffle, Bossa
  // nova — and there is one list of them, offered whole in the Set up sheet
  // and whole again in the bar: the sheet used to ask for a genre and then a
  // feel within it, and the bar a shortlist, and the same thing had three
  // names depending on where you looked. Simple's note value belongs in the
  // list too: on its own "Simple" says nothing about what you'll hear, and
  // quarter/half/whole is the only thing left to choose once you've picked
  // it. Every entry carries `style.arg`: the note value in beats for Simple,
  // the index into STYLES[style].variants for the rest.
  const SIMPLE_NAMES = { 1: 'Simple quarter note', 2: 'Simple half note', 4: 'Simple whole note' };
  const simpleName = beats => SIMPLE_NAMES[beats] || 'Simple';
  const feelName = (style, index) => {
    if (style === 'simple') return simpleName(index);
    const variant = STYLES[style] && STYLES[style].variants[index];
    return variant ? variant.label : style;
  };
  const STYLE_LIST = [
    ...Object.keys(SIMPLE_NAMES).map(beats => ({ value: `simple.${beats}`, label: simpleName(beats) })),
    ...Object.keys(STYLES).flatMap(style =>
      STYLES[style].variants.map((v, i) => ({ value: `${style}.${i}`, label: v.label }))),
  ];
  // the picker's list: a headed group per genre (Simple first), the same
  // buttons in the same order as the bar's select, so a test can hold them equal
  styleGroup.innerHTML = '';
  const groupOf = value => value.startsWith('simple.') ? 'simple' : value.split('.')[0];
  const groupLabel = g => g === 'simple' ? 'Simple' : (STYLES[g] && STYLES[g].label) || g;
  let groupEl = null, groupId = null;
  STYLE_LIST.forEach(({ value, label }) => {
    const g = groupOf(value);
    if (g !== groupId){
      groupId = g;
      groupEl = document.createElement('div');
      groupEl.className = 'style-genre';
      groupEl.dataset.genre = g;
      const count = STYLE_LIST.filter(e => groupOf(e.value) === g).length;
      groupEl.innerHTML = `<h4>${groupLabel(g)}<small>${count}</small></h4><span class="segmented"></span>`;
      styleGroup.appendChild(groupEl);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg-btn genre-btn';
    b.dataset.value = value;
    b.textContent = label;
    b.addEventListener('click', () => setFeel(value));
    groupEl.querySelector('.segmented').appendChild(b);
    quickStyle.appendChild(new Option(label, value));
  });
  quickStyle.addEventListener('change', () => setFeel(quickStyle.value));
  // the picker's search: a group stays while any of its feels matches
  const styleSearch = document.getElementById('styleSearch');
  if (styleSearch) styleSearch.addEventListener('input', () => {
    const q = styleSearch.value.trim().toLowerCase();
    styleGroup.querySelectorAll('.style-genre').forEach(gEl => {
      let any = false;
      gEl.querySelectorAll('.genre-btn').forEach(b => {
        const hit = !q || b.textContent.toLowerCase().includes(q) || groupLabel(gEl.dataset.genre).toLowerCase().includes(q);
        b.hidden = !hit; if (hit) any = true;
      });
      gEl.hidden = !any;
    });
  });
  // the last three styles used, at the top of the picker
  const RECENT_KEY = 'gt-style-recent';
  const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(v => STYLE_LIST.some(e => e.value === v)); } catch (e) { return []; } };
  function noteRecent(value){
    const list = [value, ...readRecent().filter(v => v !== value)].slice(0, 3);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
    renderRecent();
  }
  function renderRecent(){
    const row = document.getElementById('styleRecentRow'), host = document.getElementById('styleRecent');
    if (!row || !host) return;
    const list = readRecent();
    row.hidden = !list.length;
    host.innerHTML = '';
    list.forEach(v => {
      const e = STYLE_LIST.find(x => x.value === v); if (!e) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.dataset.value = v; b.textContent = e.label;
      b.addEventListener('click', () => setFeel(v));
      host.appendChild(b);
    });
  }
  renderRecent();

  // The one way a style is chosen, wherever from. `value` is an entry of the
  // list; anything else — a link written for a feel that has since gone —
  // falls back to that style's first feel, or to the default.
  function setFeel(value){
    let [style, arg] = String(value || '').split('.');
    if (style === 'simple'){
      noteBeats = SIMPLE_NAMES[arg] ? Number(arg) : 1;
    } else if (STYLES[style]){
      currentVariant = Math.min(Math.max(0, Number(arg) || 0), STYLES[style].variants.length - 1);
    } else {
      style = DEFAULT_FEEL.style;
      currentVariant = variantIndex(DEFAULT_FEEL.style, DEFAULT_FEEL.variant);
    }
    const changed = style !== currentStyle || feelValue() !== value;
    currentStyle = style;
    updatePlaybackUI();
    if (changed) noteRecent(feelValue());
    if (changed) partSeed = 0;            // a different feel is a different part
    rebuildPart();
  }
  const feelValue = () => currentStyle === 'simple' ? `simple.${noteBeats}` : `${currentStyle}.${currentVariant}`;
  const variantIndex = (style, name) => {
    const list = (STYLES[style] && STYLES[style].variants) || [];
    const i = list.findIndex(v => v.label === name);
    return i < 0 ? 0 : i;
  };

  // the sheet's list, the bar's picker and the bar's name, all told the same
  function syncQuickStyle(){
    const want = feelValue();
    styleGroup.querySelectorAll('.genre-btn').forEach(b => b.classList.toggle('active', b.dataset.value === want));
    quickStyle.value = want;
    // the name as genre › feel, so sixty-one styles read as families
    const feel = feelName(currentStyle, currentStyle === 'simple' ? noteBeats : currentVariant);
    styleLabel.textContent = currentStyle === 'simple' ? feel : `${STYLES[currentStyle].label} › ${feel}`;
    syncStyleTools();
  }

  // ---- what the style is usually played over and at ----
  // The parts guide shows every feel over a progression that suits it, in a
  // key, at a tempo (js/parts-guide-data.js, with the proposals merged over
  // it). The two buttons beside the style name load that progression, or set
  // that tempo, one press each — a way in when you want to hear the style
  // as itself rather than over whatever was on the chart.
  const guideNow = () => {
    const g = GT.partsGuide && GT.partsGuide.GUIDE;
    const f = feelNow();
    if (!g || !f) return null;
    return g[`${currentStyle}/${f.label}`] || (g[currentStyle] && g[currentStyle].feel === f.label ? g[currentStyle] : null);
  };
  const styleProgBtn = document.getElementById('styleProgBtn'), styleTempoBtn = document.getElementById('styleTempoBtn');
  function syncStyleTools(){
    const g = guideNow();
    const name = styleLabel.textContent;
    if (styleProgBtn){
      styleProgBtn.disabled = !(g && g.progression);
      styleProgBtn.title = g && g.progression ? `Use a progression ${name} is usually played over: ${g.progression.join(' · ')} in ${g.key}${g.mode === 'minor' ? ' minor' : ''}` : 'No progression suggested for this style';
      styleProgBtn.setAttribute('aria-label', styleProgBtn.title);
    }
    if (styleTempoBtn){
      styleTempoBtn.disabled = !(g && g.tempo);
      styleTempoBtn.title = g && g.tempo ? `Use the tempo ${name} is usually played at: ${g.tempo} BPM` : 'No tempo suggested for this style';
      styleTempoBtn.setAttribute('aria-label', styleTempoBtn.title);
    }
  }
  if (styleProgBtn) styleProgBtn.addEventListener('click', () => {
    const g = guideNow();
    if (!g || !g.progression) return;
    loadProgression({ chords: g.progression, key: g.key });
  });
  // a random style: any feel but the one playing
  const styleDice = document.getElementById('styleDice');
  if (styleDice) styleDice.addEventListener('click', () => {
    const others = STYLE_LIST.filter(e => e.value !== feelValue());
    setFeel(others[Math.floor(Math.random() * others.length)].value);
    writeShareState();
  });
  if (styleTempoBtn) styleTempoBtn.addEventListener('click', () => {
    const g = guideNow();
    if (g && g.tempo) setTempo(g.tempo);
  });

  function updatePlaybackUI(){
    const simple = currentStyle === 'simple';
    rootOnlyRow.hidden = !simple;
    clickRow.hidden = !simple;
    syncQuickStyle();
  }

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


  function getTempo(){ return Number(tempoInput.value); }
  // how many measures a given chord in the progression lasts, and the beats
  // that works out to (4/4 throughout)
  function measuresFor(i){ return slotMeasures[i] || DEFAULT_MEASURES; }
  // beats to the bar: four, or what the style says (the waltzes are in three)
  const beatsPerBar = () => currentStyle === 'simple' ? 4 : ((STYLES[currentStyle].variants[currentVariant] || {}).beats || 4);
  function beatsForChord(i){ return measuresFor(i) * beatsPerBar(); }
  function getNoteBeats(){ return noteBeats; } // 1 = quarter, 2 = half, 4 = whole

  tempoInput.addEventListener('input', () => {
    tempoVal.textContent = `${getTempo()} BPM`;
    document.querySelectorAll('.bpm-preset')
      .forEach(b => b.classList.toggle('active', Number(b.dataset.bpm) === getTempo()));
  });
  function setTempo(bpm){
    tempoInput.value = String(Math.max(Number(tempoInput.min) || 40, Math.min(Number(tempoInput.max) || 200, Math.round(bpm))));
    tempoInput.dispatchEvent(new Event('input'));
  }
  document.querySelectorAll('.bpm-preset').forEach(btn => {
    btn.addEventListener('click', () => setTempo(Number(btn.dataset.bpm)));
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
    const start = loop.on ? cursorAtBar(Math.min(loop.from, Math.max(0, totalBars() - 1))) : { chordIdx: 0, beatInChord: 0 };
    chordIdx = start.chordIdx;
    beatInChord = start.beatInChord;
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
  const scheduleAhead = () => audio.scheduleAhead(document.hidden);   // 0.4 s visible, wider hidden — see audio.js

  // How hard the Simple style strikes: an accent on the downbeat, not a
  // different instrument. This was 1 against 0.62 — 4.4 dB, half again as
  // loud — and worse, those two straddle the sample layers' split, so beat
  // one came off a hard strike and beats two to four off soft ones, and a bar
  // alternated between two pianos. A player leans on the downbeat by a couple
  // of decibels. The layers cross-fade now (see audio.js), and this is the
  // other half of the fix.
  const SIMPLE_ACCENT = { downbeat: 0.86, other: 0.68 };
  // The click and the count-in at the band's own hat level (band.js HAT),
  // the downbeat accented: they used to play at 1.0, five decibels over
  // the loudest hat the band ever plays.
  const CLICK = { downbeat: GT.band.HAT.accent, other: 0.4 };

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
        // the lone root lifted to where the triad sat (ROOT_ALONE, by measurement)
        playNote(noteFreq(chord.note, ROOT_OCTAVE), nextNoteTime, duration, velocity * ROOT_ALONE);
      } else {
        playChord(chord, nextNoteTime, duration, velocity, chordVoice);
      }
    }
    if (clickToggle.checked) playHiHat(nextNoteTime, beatInMeasure === 0 ? CLICK.downbeat : CLICK.other);
    // the part, on its sixteenth grid, whether or not this beat struck a chord
    if (chord){
      const perBeat = GT.parts.SIMPLE_FEEL.grid / 4, slotDur = secondsPerBeat / perBeat;
      for (let k = 0; k < perBeat; k++){
        schedulePartSlot(barOffset(chordIdx) + Math.floor(beatInChord / 4), beatInMeasure * perBeat + k, nextNoteTime + k * slotDur, slotDur, null);
      }
    }
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

  // timing and velocity moved a little, when humanizing is on
  const jit = amt => partHumanize ? (Math.random() * 2 - 1) * amt : 0;

  // One beat of the band, slot by slot, through band.js — the same rules
  // the parts and review pages play by.
  function scheduleStyleBeat(style, chord, secondsPerBeat, beatInMeasure){
    const beats = GT.band.beatsOf(style);
    const subPerBeat = style.grid / beats;
    const slotDur = secondsPerBeat / subPerBeat;
    const nextChord = currentProgression[(chordIdx + 1) % currentProgression.length];
    const measure = Math.floor(beatInChord / beats);
    const approachNext = measure === measuresFor(chordIdx) - 1;
    const barIdx = barOffset(chordIdx) + measure;
    const ctx = {
      chord, next: nextChord, audio, voice: chordVoice, jit,
      // the change is coming: the next bar is another chord
      changing: approachNext && displayName(nextChord) !== displayName(chord),
      // the last bar of the form gets the kit's fill, where the style has one
      fillNow: chordIdx === currentProgression.length - 1 && approachNext,
      // stop-time: the band hits the One and stops; the guitar has the bar
      stopped: partOn && !!(partNotes.stopBars && partNotes.stopBars.has(barIdx)),
    };
    for (let k = 0; k < subPerBeat; k++){
      const slot = beatInMeasure * subPerBeat + k;
      const t = nextNoteTime + k * slotDur + GT.band.swingOffset(style, slot, slotDur) + jit(0.006);
      GT.band.scheduleSlot(style, slot, t, slotDur, ctx);
      if (chord) schedulePartSlot(barIdx, slot, t, slotDur, style);
    }
    if (chord){
      scheduledLog.push({
        idx: chordIdx, time: nextNoteTime,
        measure: measure + 1,
        beat: (beatInChord % beats) + 1,
      });
    }
  }

  // Move the cursor on to the next beat of the progression.
  // ---- the loop's controls: on or off, and its first and last bar ----
  const loopWrap = document.getElementById('loopWrap'), loopToggle = document.getElementById('loopToggle');
  const loopFrom = document.getElementById('loopFrom'), loopTo = document.getElementById('loopTo');
  // an end moved past the other drags it along, so the stretch is never inside out
  function setLoop(next){
    const n = Math.max(1, totalBars());
    let from = next.from == null ? loop.from : next.from, to = next.to == null ? loop.to : next.to;
    if (next.to != null && next.from == null && to < from) from = to;
    if (next.from != null && next.to == null && from > to) to = from;
    from = Math.max(0, Math.min(n - 1, from)); to = Math.max(from, Math.min(n - 1, to));
    loop = { on: next.on == null ? loop.on : !!next.on, from, to };
    syncLoop();
    writeShareState();
  }
  // the lists follow the chart's bars; the chart dims the bars outside the loop
  function syncLoop(){
    const n = Math.max(1, totalBars());
    if (loop.to >= n || loop.from >= n) loop = { ...loop, from: Math.min(loop.from, n - 1), to: Math.min(loop.to, n - 1) };
    [loopFrom, loopTo].forEach(sel => {
      if (sel.options.length !== n) sel.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i}">${i + 1}</option>`).join('');
    });
    loopFrom.value = String(loop.from); loopTo.value = String(loop.to);
    loopWrap.classList.toggle('on', loop.on);
    loopToggle.setAttribute('aria-pressed', String(loop.on));
    document.querySelectorAll('#chords .bar').forEach(el => {
      const b = Number(el.dataset.bar);
      el.classList.toggle('outside', loop.on && (b < loop.from || b > loop.to));
    });
  }
  loopToggle.addEventListener('click', () => { setLoop({ on: !loop.on }); if (!isPlaying) resetPlaybackCursor(); });
  loopFrom.addEventListener('change', () => setLoop({ from: Number(loopFrom.value) }));
  loopTo.addEventListener('change', () => setLoop({ to: Number(loopTo.value) }));

  // ---- the loop: a stretch of bars played round ----
  // `from` and `to` are bars of the chart, counted from 0, both included.
  let loop = { on: false, from: 0, to: 0 };
  const totalBars = () => currentProgression.reduce((n, c, i) => n + measuresFor(i), 0);
  // the cursor a bar starts at
  function cursorAtBar(bar){
    let at = 0;
    for (let i = 0; i < currentProgression.length; i++){
      const m = measuresFor(i);
      if (bar < at + m) return { chordIdx: i, beatInChord: (bar - at) * beatsPerBar() };
      at += m;
    }
    return { chordIdx: 0, beatInChord: 0 };
  }
  // One beat on from a cursor, over a progression whose chords last
  // `measures` bars each at `beats` a bar, wrapping at the end — or, with a
  // loop on, back to its first bar the moment the cursor would leave its
  // last. Pure, so the wrap can be tested without a clock.
  function stepCursor(cur, measures, beats, lp){
    let { chordIdx: c, beatInChord: b } = cur;
    b++;
    if (b >= measures[c] * beats){ b = 0; c = (c + 1) % measures.length; }
    if (lp && lp.on){
      let at = 0; for (let i = 0; i < c; i++) at += measures[i];
      const bar = at + Math.floor(b / beats);
      if (bar > lp.to || bar < lp.from){
        let start = 0, i = 0;
        for (; i < measures.length; i++){ if (lp.from < start + measures[i]) break; start += measures[i]; }
        if (i >= measures.length){ i = 0; start = 0; }
        return { chordIdx: i, beatInChord: (lp.from - start) * beats };
      }
    }
    return { chordIdx: c, beatInChord: b };
  }
  function advanceBeat(secondsPerBeat){
    nextNoteTime += secondsPerBeat;
    const next = stepCursor({ chordIdx, beatInChord }, currentProgression.map((c, i) => measuresFor(i)), beatsPerBar(), loop);
    chordIdx = next.chordIdx;
    beatInChord = next.beatInChord;
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

    while (nextNoteTime < now + scheduleAhead()){
      const chord = currentProgression[chordIdx];
      const beatInMeasure = beatInChord % beatsPerBar();

      if (currentStyle === 'simple'){
        scheduleSimpleBeat(chord, secondsPerBeat, beatInMeasure, beatInMeasure === 0);
      } else {
        scheduleStyleBeat(STYLES[currentStyle].variants[currentVariant], chord, secondsPerBeat, beatInMeasure);
      }

      advanceBeat(secondsPerBeat);
    }
    schedulerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }
  // Going hidden, the queue is filled to the wider cushion at once — the
  // event arrives before the timers slow, and the first slow tick would
  // otherwise find the queue empty.
  document.addEventListener('visibilitychange', () => {
    if (!isPlaying || !document.hidden) return;
    clearTimeout(schedulerId);
    scheduler();
  });

  function syncHighlight(){
    if (!isPlaying) return;
    const now = audio.ctx().currentTime;

    // during the count-in, show the running beat number where the
    // measure.beat readout normally sits
    if (countInFrom != null && now < playbackStartTime - 0.0005){
      const b = Math.min(beatsPerBar(), Math.max(1, Math.floor((now - countInFrom) / countInSpb) + 1));
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
    // The part's follower is not allowed to take the chart down with it: an
    // exception here once ended this loop, and the page sat frozen on one
    // bar while the scheduler, on its own timer, played on.
    try { followPart(now, active); }
    catch (err){ if (!partFollowFailed){ partFollowFailed = true; console.error('followPart', err); } }
    requestAnimationFrame(syncHighlight);
  }

  function stopPlayback(){ if (isPlaying) togglePlay(); }

  function togglePlay(){
    ensureAudio();
    if (audio.ctx().state === 'suspended') audio.ctx().resume();
    // A progression plays to a clock and can't wait for a recording mid-bar,
    // so they're fetched at the press rather than one chord at a time.
    // Nothing waits on it: until they land the synthesized voice plays.
    if (chordVoice === 'guitar' || partOn) audio.warmGuitar();
    if (chordVoice !== 'guitar') warmThePiano();
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
        for (let i = 0; i < beatsPerBar(); i++) playHiHat(nextNoteTime + i * countInSpb, i === 0 ? CLICK.downbeat : CLICK.other);
        nextNoteTime += beatsPerBar() * countInSpb;
      }
      playbackStartTime = nextNoteTime;
      scheduler();
      requestAnimationFrame(syncHighlight);
      setPlayLabel('Pause');
      audio.keepAwake(true);      // a phone on a music stand shouldn't sleep mid-progression
      view.onPlaybackStarted();
    } else {
      isPlaying = false;
      partStopped();
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
  //   #practice?k=major:C&c=0.2.maj7,3.1,4.1.7&t=90&s=blues.0
  // k = mode:tonic; c = one entry per chord as root.bars.shape, where a root is
  // a scale degree or a 'c'-prefixed interval above the tonic (shape blank
  // for the key's own triad); t = tempo; s = style.variant. A progression that
  // came in as chord names (typed in) is written as n = name.bars
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
    if (feelValue() !== 'simple.1') p.set('s', feelValue());   // Simple on quarters is what a link means by nothing
    if (chordVoice !== 'piano') p.set('v', chordVoice);
    // ...and what the neck under the chart is showing, as one field. It's
    // empty whenever the neck is at its defaults, which is most of the time.
    const fretboard = view.viewState();
    if (fretboard) p.set('f', fretboard);
    // the part: on, which one, which fills were rolled, and whether it stays
    // on the I — so the exact part you were working on comes back
    if (partOn){
      const off = Object.keys(partTech).filter(k => !partTech[k]).map(k => TECH_LETTERS[k]).join('');
      const extras = (partVolume !== PART_VOLUME_DEFAULT ? `.v${partVolume}` : '') + (partMuted ? '.m' : '')
        + (off ? `.o${off}` : '');            // the techniques switched off, by letter
      p.set('p', `${partIdx}.${partScale === 'key' ? 'k' : 'f'}.${partSeed}${extras}${partEasy ? '.e' : ''}`);
    }
    // the band's volume is heard in both views, so it's its own field
    if (bandVolume !== BAND_VOLUME_DEFAULT || bandMuted) p.set('b', `${bandVolume}${bandMuted ? '.m' : ''}`);
    if (loop.on) p.set('r', `${loop.from + 1}-${loop.to + 1}`);   // the loop, in the bars the chart shows
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
    // a link that names no style means Simple on quarters — which is also
    // what a link written for a feel that has since gone falls back to
    setFeel(p.get('s') || 'simple.1');

    // the neck is set before the chords, so the redraw that follows them
    // draws the view the link asked for rather than the one that was up
    view.applyViewState(p.get('f') || '');
    const part = p.get('p');
    partOn = !!part;
    if (part){
      const [idx, scale, fills, ...extras] = part.split('.');
      partIdx = Number(idx) || 0;
      partScale = scale === 'k' ? 'key' : 'follow';
      partSeed = Number(fills) || 0;
      partEasy = false;
      partVolume = PART_VOLUME_DEFAULT;
      partMuted = false;
      partTech = { double: true, bend: true, hammer: true, pull: true, slide: true };
      extras.forEach(x => {
        if (x === 'm') partMuted = true;
        else if (x === 'e') partEasy = true;
        else if (/^v\d+$/.test(x)) partVolume = Math.max(0, Math.min(100, Number(x.slice(1))));
        else if (/^o[dbhps]*$/.test(x)){
          Object.keys(TECH_LETTERS).forEach(k => { if (x.includes(TECH_LETTERS[k])) partTech[k] = false; });
        }
      });
      syncPartTech();
      syncPartToggles();
    }
    bandVolume = BAND_VOLUME_DEFAULT;
    bandMuted = false;
    {
      const m = (p.get('r') || '').match(/^(\d+)-(\d+)$/);
      loop = m ? { on: true, from: Number(m[1]) - 1, to: Number(m[2]) - 1 } : { on: false, from: 0, to: 0 };
    }
    if (p.get('b')){
      const [vol, m] = p.get('b').split('.');
      bandVolume = Math.max(0, Math.min(100, Number(vol) || 0));
      bandMuted = m === 'm';
    }
    syncPartVolume();
    partScaleSelect.value = partScale === 'key' ? 'key' : 'follow';

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

  // ---- a part to play over it ----
  // A rhythm figure and its fills, written for the feel that's playing (see
  // parts.js) and realised into the notes this reading offers in this
  // position. It's a suggestion of what to play, so it shows three ways: lit
  // on the neck as it goes, written out as tab under the chart, and sounded
  // on the recorded guitar so you can hear what you're aiming at.
  //
  // What's on screen stays put for the session. Rolling a new chord or
  // stepping the box re-realises the same part into the new notes, but the
  // part and its fills only change when you ask: one pair of arrows steps
  // through the feel's parts, one button re-rolls the fills of the part
  // you're on.
  const PART_READINGS = ['caged', 'triads3', 'penta', 'scale'];
  let partOn = false;
  let partFollowFailed = false;      // logged once, not sixty times a second
  let partBars = [];                 // what the tab was last drawn from, for a redraw on resize
  let partIdx = 0;                  // which of the feel's parts
  let partSeed = 0;                 // the roll the part was realised from; 0 = not rolled yet
  let partEasy = false;             // the beginner's version of the part
  let partHumanize = false;         // timing and velocity moved a little
  const partEasyToggle = document.getElementById('partEasy'), partHumanToggle = document.getElementById('partHumanize');
  const partLeadEl = document.getElementById('partLead');
  const syncPartToggles = () => { partEasyToggle.checked = partEasy; partHumanToggle.checked = partHumanize; };
  let partScale = 'follow';         // 'follow' the chords | stay on the 'key'
  let partVolume = 70;              // 0..100, where the slider sits
  let partMuted = false;            // ...and whether it's heard at all
  let bandVolume = 100;             // the band's, on its own bus in the engine
  let bandMuted = false;
  // which of the part's techniques are played as written; off, each plays
  // plain (see parts.js for what plain means for each)
  let partTech = { double: true, bend: true, hammer: true, pull: true, slide: true };
  const TECH_LETTERS = { double: 'd', bend: 'b', hammer: 'h', pull: 'p', slide: 's' };
  // The part is the thing you're aiming at, so it sits on top of the band
  // the way a lead does, not inside it. Measured: at the guitar's own level
  // it added half a decibel to the mix, which is to say nobody could hear
  // it — the reason "New fills" seemed to do nothing. 2.4 is where the
  // slider's default lands; there's room above it.
  const PART_LEVEL_AT_DEFAULT = audio.PART_LEVEL, PART_VOLUME_DEFAULT = 70;   // 2.4: B48
  const partLevel = () => partMuted ? 0 : PART_LEVEL_AT_DEFAULT * (partVolume / PART_VOLUME_DEFAULT);
  const BAND_VOLUME_DEFAULT = 100;
  const bandLevel = () => bandMuted ? 0 : bandVolume / BAND_VOLUME_DEFAULT;
  let partNotes = [];               // realised: bar, at, dur, vel, string, fret, midi
  let partLog = [];                 // what's been scheduled, for lighting as it sounds
  let partTab = null;               // the drawn tab's metrics, for the playhead
  let partSig = '';                 // what the realised part was built from
  let partWindow = null;            // the stretch of neck it was realised in
  let partBarShown = -1;            // which bar the tab is scrolled to

  const chartViewGroup = document.getElementById('chartViewGroup');
  const chordsEl = document.getElementById('chords');
  const partPanel = document.getElementById('partPanel');
  const partControls = document.getElementById('partControls');
  const partNoteEl = document.getElementById('partNote');
  const partNameEl = document.getElementById('partName');
  const partTabEl = document.getElementById('partTab');
  const partScaleSelect = document.getElementById('partScaleSelect');

  // Simple has no feels; its parts are written for a stand-in of the same shape
  const feelNow = () => currentStyle === 'simple' ? GT.parts.SIMPLE_FEEL : STYLES[currentStyle].variants[currentVariant];
  const partsNow = () => { const f = feelNow(); return f ? GT.parts.partsFor(currentStyle, f.label) : []; };
  const partNow = () => { const ps = partsNow(); return ps.length ? ps[((partIdx % ps.length) + ps.length) % ps.length] : null; };

  // one entry per bar of the progression, in order, with the chord in it
  function progressionBars(){
    const bars = [];
    currentProgression.forEach((chord, i) => {
      for (let b = 0; b < measuresFor(i); b++) bars.push({ chord, idx: i });
    });
    return bars;
  }

  // Available at all? The style has to have a feel, the feel parts written
  // for it, and the neck has to be in one position on a reading that offers
  // notes to play.
  function partAvailable(){
    const pv = view.positionView();
    return !!partNow() && pv.inPosition && !!pv.window && PART_READINGS.includes(pv.reading);
  }

  // Everything the realised part depends on, so it's rebuilt when any of it
  // moves and left alone otherwise. The position window is deliberately NOT
  // here: the neck follows the playing chord, and in one position that means
  // re-picking the box on every change — so a part that followed the window
  // was re-realised into different notes on every chord, and came out
  // different every time round. The part is realised in the window it was
  // set in and stays there; stepping the box yourself is the one thing that
  // moves it, and that's wired to the arrows below rather than to the neck.
  function partSignature(){
    const pv = view.positionView();
    const feel = feelNow();
    // ...but whether a part CAN be shown is in it: a link opens before the
    // neck has worked out its position, and without this the view stayed on
    // "switch to one position" while looking at one.
    return JSON.stringify([partOn, partIdx, partSeed, partEasy, partScale, partTech, currentMode, currentTonic,
      feel && feel.label, pv.reading, pv.inPosition, pv.scaleTheory, partAvailable(),
      currentProgression.map((c, i) => `${displayName(c)}.${measuresFor(i)}`)]);
  }

  // Why there is nothing to show, in the words that say what to do about it.
  function partExcuse(){
    if (!partsNow().length) return `No parts written for ${feelName(currentStyle, currentVariant)} yet.`;
    const pv = view.positionView();
    const link = (act, value, text) => `<button type="button" class="link" data-act="${act}" data-value="${value}">${text}</button>`;
    if (!PART_READINGS.includes(pv.reading)) return `A part is realised into the notes a reading offers: switch the neck to ${link('mode', 'caged', 'Chords')}, ${link('mode', 'triads3', 'Triads')}, ${link('mode', 'penta', 'Pentatonic')} or ${link('mode', 'scale', 'Scales')}.`;
    if (!pv.inPosition || !pv.window) return `A part is written into one position: ${link('view', 'position', 'switch the neck to \u201cIn one position\u201d')}.`;
    return '';
  }
  // ...and the words are the controls: a link in the excuse presses the
  // neck's own button for it
  partNoteEl.addEventListener('click', e => {
    const b = e.target.closest('.link');
    if (!b) return;
    const group = b.dataset.act === 'view' ? '#viewGroup' : '#fretModeGroup';
    const btn = document.querySelector(`${group} [data-value="${b.dataset.value}"]`);
    if (btn) btn.click();
  });

  function rebuildPart(force){
    // the chart or the part, never both: two readings of the same bars
    chartViewGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', (b.dataset.value === 'part') === partOn));
    chordsEl.hidden = partOn;
    partPanel.hidden = !partOn;
    if (!force && partSignature() === partSig) return;
    partWindow = view.positionView().window;
    partBarShown = -1;

    if (!partOn || !partAvailable()){
      partNotes = [];
      partTab = null;
      partLeadEl.hidden = true;
      partTabEl.hidden = true;
      partTabEl.innerHTML = '';
      view.lightSounding([]);
      const why = partOn ? partExcuse() : '';
      partNoteEl.innerHTML = why;
      partNoteEl.hidden = !why;
      partControls.hidden = !!why;
      partSig = partSignature();
      return;
    }
    partNoteEl.hidden = true;
    partControls.hidden = false;
    const part = partNow(), bars = progressionBars(), pv = view.positionView();
    // the roll: a seed, kept until "New fills" or another part asks for a new one
    if (!partSeed) partSeed = GT.parts.newSeed();
    partNotes = GT.parts.realise(part, bars, partSeed, {
      reading: pv.reading, window: partWindow, scaleTheory: pv.scaleTheory, stringSet: pv.stringSet,
      stayOnKey: partScale === 'key', key: { tonic: currentTonic, mode: currentMode }, tech: { ...partTech },
    }, { grid: feelNow().grid, easy: partEasy });
    partLeadEl.hidden = !partNotes.leadRoll;
    partNameEl.textContent = part.name;
    syncPartSelect();
    drawPartTab(bars);
    // Taken now, after the fills have been rolled, not before: stored before
    // the roll it described a part that no longer existed, so the very next
    // neck redraw saw "different fills", rebuilt once more, and carried the
    // part off into whatever window the neck had moved to by then.
    partSig = partSignature();
  }

  // The part as tablature, one bar
  // per bar of the progression with the chord above it.
  function drawPartTab(bars){
    partBars = bars;
    const grid = feelNow().grid;
    // a chord is named where it arrives, with its numeral, and not over the
    // bars it carries through — the way the chart reads
    const cells = barCells();
    const example = {
      grid,
      bars: bars.map((b, i) => ({
        startSlot: i * grid,
        chord: cells[i] && cells[i].held ? '' : displayName(b.chord),
        numeral: cells[i] && cells[i].held ? '' : (b.chord.numeral || ''),
      })),
      notes: partNotes.map(n => ({ string: n.string, fret: n.fret, at: n.bar * grid + n.at, dur: n.dur,
                                   bend: n.bend, slide: n.slide, tech: n.tech, to: n.to, soft: n.soft, mute: n.mute,
                                   vib: n.vib, trem: n.trem, rake: n.rake, ghost: n.ghost, tone: !n.strum && (n.mute || n.ghost) ? 'muted' : undefined,
                                   // the top string of a strum carries its marks, over the tab
                                   lead: !n.strum || !partNotes.some(m => m.bar === n.bar && m.at === n.at && m.strum && m.spread > n.spread) })),
      totalSlots: bars.length * grid,
    };
    // On a wide screen the tab wraps to as many bars as fit across, and the
    // viewport shows two rows of it, scrolling down to the row being played
    // — a page of tab, turned when the bottom row runs out. On a phone a
    // wrapped tab holds one bar a row and reads worse than a strip, so there
    // it stays one row that scrolls sideways a bar at a time.
    // shown before it is measured: hidden, its width reads as nothing and
    // every screen counted as a phone
    partTabEl.hidden = false;
    const avail = partTabEl.clientWidth || partPanel.clientWidth;
    const wide = avail >= 700;
    const built = GT.tab.build(example, wide ? avail : Number.MAX_SAFE_INTEGER);
    partTab = built.metrics;
    partTabEl.innerHTML = `<svg viewBox="${built.viewBox}" width="${built.width}" height="${built.height}"`
      + ` role="img" aria-label="${partNow().name}, written out">${built.markup}</svg>`;
    partTabEl.classList.toggle('wrapped', wide);
    const paged = wide && built.metrics.rows > 2;
    partTabEl.style.height = paged ? `${2 * built.metrics.rowSpan}px` : '';
    // room under the last row, so it too can sit on top when its turn comes
    if (paged) partTabEl.insertAdjacentHTML('beforeend', `<div class="part-tab-end" style="height:${built.metrics.rowSpan}px"></div>`);
    partTabEl.dataset.drawnAt = avail;
    partTabEl.scrollLeft = 0;
    partTabEl.scrollTop = 0;
    partBarShown = -1;
  }

  // The wrap is decided by width, so a window that changes size gets the tab
  // drawn again for the new one — settled, not on every pixel of a drag.
  let partResizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(partResizeTimer);
    partResizeTimer = setTimeout(() => {
      if (!partOn || !partNotes.length || partTabEl.hidden) return;
      const avail = partTabEl.clientWidth || partPanel.clientWidth;
      if (String(avail) !== partTabEl.dataset.drawnAt) drawPartTab(partBars);
    }, 150);
  });

  // Sound and log the part's notes for one slot of one bar. Called from the
  // style scheduler, which already walks the grid slot by slot.
  function schedulePartSlot(barIdx, slot, t, slotDur, style){
    if (!partOn || !partNotes.length) return;
    // this slot's notes, played by the engine's one part player (a strum
    // swept, a rake ahead of its note, the slapback where the style lives
    // on it); a tremolo pick sits between slots, so the note's own `at`
    const mine = partNotes.filter(n => n.bar === barIdx && Math.floor(n.at) === slot);
    if (!mine.length) return;
    const played = partLevel() > 0
      ? audio.playPartNotes(mine, n => t + (n.at - slot) * slotDur, slotDur, partLevel(), { slapback: !!(style && style.slapback), jit })
      : mine.map(n => ({ note: n, time: t + (n.at - slot) * slotDur, until: t + (n.at - slot + n.dur) * slotDur }));
    played.forEach(({ note: n, time, until }) => {
      partLog.push({ time, until, string: n.string, fret: n.fret, slot: barIdx * feelNow().grid + Math.floor(n.at) });
    });
    if (partLog.length > 256) partLog = partLog.filter(e => e.until > audio.ctx().currentTime);
  }

  // What the part is sounding right now, on the neck and in the tab. Called
  // from the same animation frame that moves the chart's highlight.
  function followPart(now, active){
    if (!partOn || !partNotes.length){ return; }
    const sounding = partLog.filter(e => e.time <= now && now < e.until);
    view.lightSounding(sounding);
    const slots = new Set(sounding.map(e => e.slot));
    partTabEl.querySelectorAll('.tab-note').forEach(g => g.classList.toggle('now', slots.has(Number(g.dataset.slot))));
    const head = partTabEl.querySelector('.tab-playhead');
    if (head && partTab && active){
      // the slot the beat is in: the bar from the chart's own count, the
      // slot within it from how far into the beat the clock is
      const grid = feelNow().grid, perBeat = grid / beatsPerBar();
      const barIdx = barOffset(active.idx) + Math.min(active.measure, measuresFor(active.idx)) - 1;
      const into = Math.max(0, (now - active.time) / (60 / getTempo()));
      const slot = barIdx * grid + (active.beat - 1) * perBeat + Math.min(perBeat - 1, Math.floor(into * perBeat));
      const pos = GT.tab.playheadPos(slot, partTab);
      // an SVG element has no `hidden` property, only the attribute — set the
      // property and nothing happens, which is why this never showed
      head.removeAttribute('hidden');
      head.setAttribute('x', pos.x);
      head.setAttribute('y', pos.y);
      if (barIdx !== partBarShown) showPartBar(barIdx);
    }
  }

  // The bar being played, named in the tab and brought into view — the
  // strip scrolls a bar at a time, when the bar changes, so it reads like a
  // page turning rather than a ticker. On its own so a test can walk every
  // bar of a progression through it: it once indexed the names by bar when
  // the tab names only the bars a chord arrives in, and the walk ended in
  // an exception at the first bar past the last name, which took the
  // follower with it — the tab stood still while the band played on.
  function showPartBar(barIdx){
    if (!partTab) return;
    partBarShown = barIdx;
    const grid = feelNow().grid;
    // the name over this bar, or over the bar the chord arrived in — the
    // tab names only those, tagged with the bar they sit over
    let arrival = -1;
    partTabEl.querySelectorAll('.tab-chord').forEach(el => {
      const b = Number(el.dataset.bar);
      if (b <= barIdx && b > arrival) arrival = b;
    });
    partTabEl.querySelectorAll('.tab-chord').forEach(el => el.classList.toggle('now', Number(el.dataset.bar) === arrival));
    const scale = partTabEl.querySelector('svg').getBoundingClientRect().width / partTab.width;
    if (partTabEl.classList.contains('wrapped')){
      // the row being played on top, the row after it in view below — what
      // is coming is what you need to see; what has gone, you played
      const row = Math.floor(barIdx / partTab.barsPerRow);
      partTabEl.scrollTo({ top: row * partTab.rowSpan * scale, behavior: 'smooth' });
    } else {
      const barStart = GT.tab.playheadPos(barIdx * grid, partTab).x;
      partTabEl.scrollTo({ left: Math.max(0, barStart * scale - 24), behavior: 'smooth' });
    }
  }

  function partStopped(){
    partLog = [];
    view.lightSounding([]);
    partTabEl.querySelectorAll('.tab-note.now').forEach(g => g.classList.remove('now'));
    const head = partTabEl.querySelector('.tab-playhead');
    if (head) head.setAttribute('hidden', '');
    partTabEl.querySelectorAll('.tab-chord.now').forEach(el => el.classList.remove('now'));
    partBarShown = -1;
  }

  chartViewGroup.querySelectorAll('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
    partOn = btn.dataset.value === 'part';
    if (partOn){ ensureAudio(); audio.warmGuitar(); }
    rebuildPart();
    writeShareState();
  }));
  // the part's picker: the feel's parts, the current one chosen; rebuilt
  // with the part view since the list is the feel's
  const partSelect = document.getElementById('partSelect');
  function syncPartSelect(){
    const ps = partsNow();
    const want = ps.length ? ((partIdx % ps.length) + ps.length) % ps.length : 0;
    const have = [...partSelect.options].map(o => o.text).join('|');
    if (have !== ps.map(p => p.name).join('|')){
      partSelect.innerHTML = ps.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
    }
    partSelect.value = String(want);
  }
  partSelect.addEventListener('change', () => { partIdx = Number(partSelect.value) || 0; partSeed = 0; rebuildPart(); writeShareState(); });
  document.getElementById('partReroll').addEventListener('click', () => { partSeed = 0; rebuildPart(); writeShareState(); });
  partEasyToggle.addEventListener('change', () => { partEasy = partEasyToggle.checked; rebuildPart(); writeShareState(); });
  partHumanToggle.addEventListener('change', () => { partHumanize = partHumanToggle.checked; });

  // The arrows (and the window on the neck, which forwards to them) are you
  // moving the box; the neck moving it for you during playback is not.
  ['boxPrev', 'boxNext'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => rebuildPart(true));
  });
  const partVolumeEl = document.getElementById('partVolume');
  const partMuteBtn = document.getElementById('partMute');
  const bandVolumeEl = document.getElementById('bandVolume');
  const bandMuteBtn = document.getElementById('bandMute');
  function syncPartVolume(){
    partVolumeEl.value = String(partVolume);
    partMuteBtn.setAttribute('aria-pressed', String(partMuted));
    partMuteBtn.setAttribute('aria-label', partMuted ? 'Unmute the part' : 'Mute the part');
    partMuteBtn.title = partMuted ? 'Unmute the part' : 'Mute the part';
    bandVolumeEl.value = String(bandVolume);
    bandMuteBtn.setAttribute('aria-pressed', String(bandMuted));
    bandMuteBtn.setAttribute('aria-label', bandMuted ? 'Unmute the band' : 'Mute the band');
    bandMuteBtn.title = bandMuteBtn.getAttribute('aria-label');
    audio.setBandLevel(bandLevel());       // the band's is a bus in the engine, not a note-by-note level
  }
  partVolumeEl.addEventListener('input', () => {
    partVolume = Math.max(0, Math.min(100, Number(partVolumeEl.value) || 0));
    if (partVolume > 0 && partMuted){ partMuted = false; syncPartVolume(); }   // moving the slider is asking to hear it
    writeShareState();
  });
  partMuteBtn.addEventListener('click', () => {
    partMuted = !partMuted;
    syncPartVolume();
    writeShareState();
  });
  bandVolumeEl.addEventListener('input', () => {
    bandVolume = Math.max(0, Math.min(100, Number(bandVolumeEl.value) || 0));
    if (bandVolume > 0 && bandMuted) bandMuted = false;
    syncPartVolume();
    writeShareState();
  });
  bandMuteBtn.addEventListener('click', () => {
    bandMuted = !bandMuted;
    syncPartVolume();
    writeShareState();
  });
  // the techniques: five toggles, each played as written or plain
  const partTechGroup = document.getElementById('partTechGroup');
  function syncPartTech(){
    partTechGroup.querySelectorAll('.tech-btn').forEach(b => b.setAttribute('aria-pressed', String(partTech[b.dataset.tech] !== false)));
  }
  partTechGroup.querySelectorAll('.tech-btn').forEach(b => b.addEventListener('click', () => {
    partTech[b.dataset.tech] = !partTech[b.dataset.tech];
    syncPartTech();
    rebuildPart();                 // the same part, played plainer or not
    writeShareState();
  }));
  syncPartTech();
  partScaleSelect.addEventListener('change', () => {
    partScale = partScaleSelect.value === 'key' ? 'key' : 'follow';
    rebuildPart();
    writeShareState();
  });

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
    const slug = location.hash.slice(1).split('?')[0] || 'practice';
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
    shareBtn._reset = setTimeout(() => { shareBtn.textContent = 'Copy a link to all of this'; }, 2200);
  });

  // Take a progression written as chord names — the typed field, a link —
  // and set the practice tab up to play it. Runs of the same chord collapse
  // into one chord held for that many measures, which is how a twelve-bar
  // blues fits into seven slots.
  function loadProgression({ chords, label, tempo, key }){
    if (!chords || !chords.length) return;
    stopPlayback();
    clearPreset();                 // whatever preset was showing, this isn't it — typed, linked or the style's

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
  // and loadProgression collapses the run — the same road a link's chord names
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
    simpleHitSeconds, SIMPLE_ACCENT, CLICK, DEFAULT_FEEL,
    setTempo, getTempo,
    stepCursor, setLoop, loopState: () => ({ ...loop }), cursor: () => ({ chordIdx, beatInChord }),
    // the realised part and the window it was realised in, so a test can
    // hold it still across the things that must not move it
    partState: () => ({ notes: partNotes.map(n => ({ ...n })), window: partWindow && { ...partWindow },
                        seed: partSeed, easy: partEasy, signature: partSignature(), tech: { ...partTech },
                        named: [...partTabEl.querySelectorAll('.tab-chord.now')].map(el => el.textContent) }),
    showPartBar,
    init(){
      view.init({
        progression: () => currentProgression,
        isPlaying:   () => isPlaying,
        mode:        () => currentMode,
        tonic:       () => currentTonic,
        activeChord: () => scheduledLog[0],
        // the neck's own controls are its business, but the address bar is
        // this tab's — so it says when it has redrawn and the link follows
        viewChanged: () => { writeShareState(); rebuildPart(); },
      });
      updatePlaybackUI();       // the list is built above; this marks the default on it
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
