# Chord Progression Generator

A single-page, dependency-free tool that generates random diatonic chord
progressions and plays them back with a synthesized piano and optional
hi-hat click.

## Features

- Major / Minor / Random mode toggle, with an occasional harmonic-minor
  dominant (V) substitution in minor
- Dark theme
- Adjustable number of chords (1–7)
- "Common chords only" mode (I, ii, IV, V, vi / i, iv, v–V, VI, VII)
- Web Audio playback: additive piano tone, adjustable tempo (40–200 BPM),
  measures per chord, note value (quarter / half / whole), a 4-beat
  count-in, metronome click, and a roots-only mode
- Live chord highlighting synced to playback, with a measure.beat position readout
- Fretboard panel (6 strings, 15 frets) with three views for a chosen chord:
  every root-note location for the progression (colour-coded, legend gives
  each root's roman numeral); CAGED chords — the five chord shapes, outlined
  and colour-coded, every note named, shared notes split-coloured; and CAGED
  pentatonic — the full major/minor pentatonic scale, every note coloured by
  the CAGED box it belongs to (seam notes split-coloured), scale degrees in
  the dots, and the chord-shape outlines drawn through the chord tones

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).
