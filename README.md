# Chord Progression Generator

A single-page, dependency-free tool that generates random diatonic chord
progressions and plays them back with a synthesized piano and optional
hi-hat click.

## Features

- Random major/minor key selection, with an occasional harmonic-minor
  dominant (V) substitution
- Adjustable number of chords (2–7)
- "Common chords only" mode (I, ii, IV, V, vi / i, iv, v–V, VI, VII)
- Web Audio playback: additive piano tone, adjustable tempo (40–200 BPM),
  measures per chord, note value (quarter / half / whole), metronome
  click, and a roots-only mode
- Live chord highlighting synced to playback

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).
