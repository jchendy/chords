# Jeff's Guitar Tools

A single-page, dependency-free site with three tabs under one header:

- **CAGED practice** — generates random diatonic chord progressions and
  plays them back with a synthesized piano and optional hi-hat click.
- **Chord finder** — type a chord name (e.g. `G#9`, `Cmaj7`, `Dm7b5`) and
  see the common places to play it on the neck.
- **Reverse chord finder** — click frets on an interactive fretboard and
  see what chord name(s) the selected notes could be.

Switching tabs stops any playback that was running.

## CAGED practice

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
- Web Audio playback via icon Play/Pause buttons (both the corner button on
  the chord display and the main one in the Style panel), with the panel
  split into a "Style" section (Genre,
  Feel, and the Simple-only note value / metronome click / roots-only
  options) and an "All styles" section (tempo — with 60/90/120 BPM presets —
  measures per chord, and a 4-beat count-in) that always applies. A matching
  Genre row (Simple / Rock / Blues / Jazz / Pop / Funk only, no Feel or other
  advanced options) also sits at the bottom of the chord display panel for
  quick switching, kept in sync with the main Style section. A "Genre"
  picker chooses the backing:
  Simple — the plain piano voicing, with note value (quarter / half / whole),
  metronome click and a roots-only mode;
  Rock — driving 8th-note piano chords and a basic kit, with a half-time
  feel and a 16th-note "1 & a" gallop (Punk drive) as alternate Feels;
  Blues — a 12/8 shuffle: boogie-woogie walking bass (1-3-5-6-♭7-6-5-3),
  long-ringing dominant-7th chord stabs on the shuffle upbeats, and a
  shuffled kick/snare/hat;
  Jazz — a swung "spang-a-lang" ride pattern with hi-hat on 2 & 4, a quarter-note
  walking bass (root–5th–3rd–chromatic approach to the next chord), and
  rootless Charleston-comped 7th-chord voicings;
  Pop — four-on-the-floor, ballad, and syncopated dance-pop grooves;
  Funk — a hard-hitting "on the One" groove, a 16th-note guitar-chop groove,
  and a four-on-the-floor disco groove.
  Every style (except Simple) offers three "Feel" variants — its canonical
  groove plus two common alternatives
- Live chord highlighting synced to playback, with a measure.beat position
  readout and a "BPM"-labelled trio of 60/90/120 shortcut buttons in the
  corner of the key display (the key itself is shown plainly, e.g.
  "C major" / "C#m")
- Fretboard panel (6 strings, 15 frets) with five views, "Roots" and
  "Chord positions" first:
  Roots — every root-note location for the progression (colour-coded,
  legend gives each root's roman numeral; while playing, the currently
  sounding chord's root is ringed and spotlighted);
  Chord positions — one shape per chord in the progression, colour-coded by
  chord, chosen so every shape sits close together on the neck (shared notes
  split-coloured, no shape outlines since several overlapping shapes made
  them confusing here, and hovering/tapping a chord name in the legend —
  which also names each chord's CAGED shape letter — spotlights it, same as
  CAGED triads); every note is labelled by scale degree except the root,
  which keeps its note name; with the whole cluster shown at rest, every
  note is dimmed except each chord's lowest root, so the anchor notes stand
  out; the barred
  G-shape is skipped everywhere except its own open-G-chord form, since it's
  not realistically playable elsewhere. "Next position" cycles to the next
  cluster up the neck, wrapping back to the lowest. With "7 chords" on, each
  shape turns into the 7th-chord voicing guitarists actually use for it —
  flattening that shape's own doubled root by a half step (major 7th) or a
  whole step (dominant/minor 7th) — rather than tacking a note onto some
  other string. "Follow playback" (on by default) lights up whichever
  chord is currently sounding (in both the fretboard and its legend entry),
  lightly dims the next chord, and dims the rest much further; a lit note
  only wears the root ring when it's actually the sounding chord's own root,
  not just a note it happens to share with another chord's root;
  CAGED triads — the five chord shapes for the chosen chord, outlined and
  colour-coded, every note labelled by scale degree except the root (which
  keeps its note name), shared notes split-coloured;
  CAGED pentatonic — the chosen chord's major/minor pentatonic, every note
  coloured by the CAGED box it belongs to (seam notes split-coloured), scale
  degrees in the dots, chord-shape outlines through the chord tones;
  CAGED scales — with a toggle between two theories: Parallel (the scale
  matching the chosen chord's own quality — major chord → major scale, minor
  chord → natural minor) and Key mode (chord-scale theory — the progression
  key's mode rooted on the chosen chord, e.g. a IV chord reads as Lydian);
  same CAGED-box colouring either way
- In the CAGED views, hover/tap a shape name in the legend to spotlight that
  shape; "Follow playback" (on by default) lets the fretboard track whichever
  chord is currently sounding

## Chord finder

Type a chord name — root note plus an optional accidental (`#`/`b`) and a
quality/extension suffix (`m`, `7`, `maj7`, `m7b5`, `dim7`, `sus4`, `9`,
`13`, `7#9`, and around two dozen others) — and the tab searches every
string/fret combination within a comfortable 4-fret stretch for shapes that
sound all of that chord's defining tones (the plain 5th is treated as
optional, same as real players drop it).

Every shape is then handed to a fingering pass, which either works out a
playable left hand for it or throws it out. Fingers are numbered 1 (index)
to 4 (pinky); up to three fingers may share a fret, and when that isn't
enough the shape is barred — the index across the lowest fret, or a higher
finger laid flat over neighbouring strings (the ring-finger barre that
shapes like C9 and Em9 need). A barre that would silence an open string, or
sound a note outside the chord, means the shape isn't offered at all.

The results walk up the neck, showing the best grip at each position plus
the strongest runners-up, so every place the chord can be played gets a
look in. Open-position shapes draw a nut, higher ones are labelled with
their starting fret, and a shape built on a CAGED form says which one.
Two toggles sit above the results: dots can show **finger numbers** or
**scale degrees**, and for a plain triad you can ask for **three-note
voicings only**. A major or minor triad also gets the whole-neck CAGED
picture at the top — the same five shapes the practice tab draws, from the
same code, so the two always agree.

## Reverse chord finder

Click frets on the interactive fretboard to select notes (clicking a
selected fret again clears it; picking a different fret on the same string
replaces the old selection, since a string only sounds one note at a time).
Once one or more frets are selected, every chord name that fits — trying
each selected note in turn as the root — is listed below, using the same
chord-formula table as the chord finder.

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).

## Code layout

`index.html` is markup and styles only; the JavaScript lives in `js/`, split
by what each part does:

| File | Responsibility |
| --- | --- |
| `theory.js` | Keys, scale degrees, chord formulas, chord naming, chord identification. Pure — no DOM, no audio, no app state. |
| `fretboard.js` | Tuning, CAGED and pentatonic shape templates, the maths that places them on the neck, and CAGED shape matching. Also pure. |
| `neck.js` | Draws a full 15-fret neck as SVG from markers and shape outlines — shared by the practice fretboard and the chord finder's CAGED overview. |
| `audio.js` | The Web Audio synth voices (piano, bass, drums) and the per-genre groove patterns. Owns the `AudioContext`; knows nothing about the UI. |
| `fretboard-view.js` | The practice tab's fretboard panel: the five views, the legend, the hover spotlight, the follow-playback highlighting. |
| `practice.js` | The CAGED practice tab: progression generation, the chord display and settings, and the playback transport. |
| `chord-finder.js` | Chord finder tab: voicing search, fingering, chord diagrams. |
| `reverse-finder.js` | Reverse chord finder tab: the clickable neck and the name lookup. |
| `tooltips.js`, `tabs.js` | Small shared UI pieces. |
| `main.js` | Boots each tab and wires the header together. |

Each file wraps itself in an IIFE and hangs its public interface off a single
`GT` namespace, so nothing else leaks into global scope. Dependencies run one
way — `theory` and `fretboard` know about nothing, `audio` uses `theory`, the
tab modules use those, and `main` starts them.

`practice.js` and `fretboard-view.js` share state (which chord is sounding,
whether 7ths are on), so rather than reaching into each other, the view gets a
small **host object** of getters at `init()` and exposes a handful of methods
(`render`, `followChord`, `onPlaybackStarted`, …) for the practice tab to call.

They're plain `<script>` tags rather than ES modules on purpose: modules are
blocked by CORS when a page is opened straight from disk, and this one is meant
to work by double-clicking `index.html`, with no server and no build step.
