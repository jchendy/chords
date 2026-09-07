# Chord Progression Generator

A single-page, dependency-free tool that generates random diatonic chord
progressions and plays them back with a synthesized piano and optional
hi-hat click.

## Features

- Major / Minor / Random mode toggle, with an occasional harmonic-minor
  dominant (V) substitution in minor
- Manual key selection (any of the 24 keys, or Random)
- Per-slot chord selection — pin any chord in the progression to a specific
  diatonic degree (or leave it Random); "New progression" only re-rolls the
  slots left on Random
- Dark theme
- Adjustable number of chords (1–7)
- "Common chords only" — restricts the Random rolls to I, ii, IV, V, vi /
  i, iv, v–V, VI, VII (manual slots can still pick anything)
- "7 chords" — toggles every chord between a plain triad and its diatonic
  seventh chord (maj7 / dominant 7 / m7 / m7♭5, whichever the scale degree
  implies), affecting the displayed names and the notes played
- Info tooltips (ⓘ) on the less-obvious controls — hover on desktop, tap on
  touch, tap elsewhere to dismiss
- Web Audio playback, with the panel split into a "Style" section (Genre,
  Feel, and the Simple-only note value / metronome click / roots-only
  options) and an "All styles" section (tempo — with 60/90/120 BPM presets —
  measures per chord, and a 4-beat count-in) that always applies. A "Genre"
  picker chooses the backing:
  Simple — the plain piano voicing, with note value (quarter / half / whole),
  metronome click and a roots-only mode;
  Rock — driving 8th-note piano chords and a basic kit, with a half-time
  feel and a 16th-note "1 & a" gallop (Punk drive) as alternate Feels;
  Blues — a 12/8 shuffle: boogie-woogie walking bass (1-3-5-6-♭7-6-5-3),
  dominant-7th chord stabs on the shuffle upbeats, and a shuffled kick/snare/hat;
  Jazz — a swung "spang-a-lang" ride pattern with hi-hat on 2 & 4, a quarter-note
  walking bass (root–5th–3rd–chromatic approach to the next chord), and
  rootless Charleston-comped 7th-chord voicings;
  Pop — four-on-the-floor, ballad, and syncopated dance-pop grooves;
  Funk — a hard-hitting "on the One" groove, a 16th-note guitar-chop groove,
  and a four-on-the-floor disco groove.
  Every style (except Simple) offers three "Feel" variants — its canonical
  groove plus two common alternatives
- Live chord highlighting synced to playback, with a measure.beat position
  readout and 60/90/120 BPM shortcut buttons in the corner of the key display
  (the key itself is shown plainly, e.g. "C major" / "C#m")
- Fretboard panel (6 strings, 15 frets) with five views:
  Root notes — every root-note location for the progression (colour-coded,
  legend gives each root's roman numeral; while playing, the currently
  sounding chord's root is ringed and spotlighted);
  CAGED triads — the five chord shapes for the chosen chord, outlined and
  colour-coded, every note named, shared notes split-coloured;
  CAGED pentatonic — the chosen chord's major/minor pentatonic, every note
  coloured by the CAGED box it belongs to (seam notes split-coloured), scale
  degrees in the dots, chord-shape outlines through the chord tones;
  CAGED scales — with a toggle between two theories: Parallel (the scale
  matching the chosen chord's own quality — major chord → major scale, minor
  chord → natural minor) and Key mode (chord-scale theory — the progression
  key's mode rooted on the chosen chord, e.g. a IV chord reads as Lydian);
  same CAGED-box colouring either way;
  Chord positions — one shape per chord in the progression, colour-coded by
  chord, chosen so every shape sits close together on the neck (shared notes
  split-coloured, and hovering/tapping a chord name in the legend spotlights
  it, same as CAGED triads); the barred G-shape is skipped everywhere except
  its own open-G-chord form, since it's not realistically playable elsewhere.
  "Next position" cycles to the next cluster up the neck, wrapping back to
  the lowest. With "7 chords" on, it also adds each chord's 7th nearby on an
  open string of that shape, when one is reachable. "Follow playback" (on by
  default) lights up whichever chord is currently sounding, half-lights the
  next one, and dims the rest
- In the CAGED views, hover/tap a shape name in the legend to spotlight that
  shape; "Follow playback" (on by default) lets the fretboard track whichever
  chord is currently sounding

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).
