# Jeff's Guitar Tools

A single-page, dependency-free site with three tabs under one header:

- **CAGED practice** — generates random diatonic chord progressions and
  plays them back with a synthesized piano and optional hi-hat click.
- **Chord finder** — type a chord name (e.g. `G#9`, `Cmaj7`, `Dm7b5`) and
  see the common places to play it on the neck.
- **Reverse chord finder** — click frets on an interactive fretboard and
  see what chord name(s) the selected notes could be.
- **Genre examples** — pick a style, then a rhythm or a lead line, and read
  the tab while you hear it played. It lives in the footer under
  "Experimental features" rather than in the header.

Switching tabs stops any playback that was running. Each tab has its own URL
fragment (`#chord-finder`, `#reverse-chord-finder`), so a tab can be
bookmarked or linked to, and back/forward move between them; the page title
names the tab you're on.

## CAGED practice

## Features

- Major / Minor / Random mode toggle, with an occasional harmonic-minor
  dominant (V) substitution in minor
- Manual key selection (any of the 24 keys, or Random). Changing key
  transposes what's already there rather than rolling something new: each
  chord keeps its scale degree, so a I–V–vi–IV in A becomes the I–V–vi–IV of
  wherever you land, and switching Major/Minor holds the same degrees in the
  other mode. A progression loaded from a genre example isn't diatonic, so it
  shifts by the same interval instead, spelled the way the new key spells it
- Preset progressions — the blues (12-bar, quick change, jazz blues, minor
  blues, 8-bar, slow blues), I–IV–V, I–IV–V–IV, I–V–vi–IV, ii–V–I, the
  I–VI7–ii–V7 turnaround, Pachelbel's canon, the Andalusian i–VII–VI–V and a
  few more. They're stored as scale degrees, so a preset lands in whatever
  key you're in and follows you when you change key, and every chord stays
  editable afterwards; changing one drops the preset label but keeps the
  rest. The blues presets force dominant 7ths, which no key's own diatonic
  7ths give you — I7 IV7 V7 in a major key, i7 iv7 V7 in a minor one, the V
  a real dominant either way. A preset that only makes sense in one mode
  (the minor blues, the Andalusian cadence with its major V) moves the key
  there when you pick it, keeping the tonic
- Per-slot chord selection — pin any chord in the progression to a specific
  diatonic degree (or leave it Random); "New progression" only re-rolls the
  slots left on Random. The presets sit above these, so you can drop a shape
  in and then edit it
- Per-slot chord quality — the degree picker names the degree and nothing
  else (`Dm · ii`); a second picker beside it sets the shape, and offers
  Major, Minor, 7, maj7 and m7 on any degree, with dim, m7♭5 and dim7 added
  on the one degree whose own chord is diminished. A **✓** marks the two
  shapes the key itself gives that degree, so leaving the key is a choice you
  can see yourself making — a secondary dominant on the ii, a borrowed minor
  iv, a major III. The numeral follows: pick Major on the ii and it reads
  `II`. The choice rides along when you transpose or switch Major/Minor,
  while a shape you haven't touched keeps following the key
- Dark theme
- Adjustable number of chords (up to 12), each with its own number of
  measures — set beside the chord in the progression settings, so one chord can
  hold for four bars while the next passes in one, which is what a twelve-bar
  blues needs. The display writes out every bar rather than a bar count —
  a chord held for two reads `F C C`, wrapping four bars to a line the way a
  chart does, with the numeral under each bar and the carried-over bars
  dimmed so you can still see where the chord changes
- "Common chords only" — restricts the Random rolls to I, ii, IV, V, vi /
  i, iv, v–V, VI, VII (manual slots can still pick anything)
- "Use 7ths for randomized chords" — a slot left on Random comes up as the
  diatonic seventh of whatever degree it landed on (maj7 / dominant 7 / m7 /
  m7♭5, whichever the scale implies) instead of a plain triad. Ticking it
  swaps triads for sevenths where they stand: the roots, the degrees and the
  bar lengths don't move, and any chord you've set yourself — or that a preset
  pinned — is left alone. A rolled chord is always one the key contains;
  handing a slot back to Random hands its shape back too
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
  cluster up the neck, wrapping back to the lowest. When a chord carries a
  seventh, its shapes turn into the 7th-chord voicing guitarists use for it —
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

The results walk up the neck, showing the best grips at each position, so
every place the chord can be played gets a look in. Choosing and ordering
are separate judgements: a score decides which shapes make the cut (fuller
chords, small stretches, root in the bass), and a second pass makes sure the
compact everyday grips — the four-string Fmaj7, the three-string power
chord, the A9 that lost out to a dozen six-string variants at the nut —
aren't hidden behind bigger shapes that merely contain them. Within a
position the everyday grip reads first: extra strings past four count for
little, a barre costs, and so does a hand that zigzags between frets. Open
position (anything within reach of the nut) counts as one position, so a
shape that happens to be all open strings never sorts ahead of the real open
chord. Open-position shapes draw a nut, higher ones are labelled with their
starting fret, and a shape built on a CAGED form says which one.
Toggles sit above the results: dots can show **finger numbers** or **scale
degrees**; **shell voicings only** narrows the list to shells — the chord
stripped to the notes that name it (root, the 3rd or the sus note standing in
for it, and the 7th), dropping the plain 5th but keeping an altered one, with
the root underneath on the 6th or 5th string, which is the grip jazz players
comp with; and for a plain triad you can ask for **three-note voicings
only**. A major or minor triad also gets the whole-neck CAGED
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

## Genre examples

Fourteen styles, grouped by family: skate punk and ska punk; rockabilly,
psychobilly, surf rock and country; delta and Chicago blues; bebop, gypsy
jazz and bossa nova; funk and reggae; thrash metal.

Choose **rhythm** and you get that genre's chord progressions and its
strumming patterns as separate lists — pick any combination of the two, and
the tab and playback update together. Choose **lead** and you get solo lines
built from the same vocabulary. Either way the tab shows what you're about to
hear, note for note, with a playhead tracking the beat, and there's a loop
and a drums toggle. Long examples wrap onto as many rows as they need, the
way printed notation does — breaking only at bar lines, and tightening the
note spacing a little before wrapping to a single bar per row on narrow
screens.

Any progression here can be opened in the practice tab, which loads its
chords, key, tempo and bar lengths. Runs of the same chord collapse into one
chord held for that many measures, so a twelve-bar blues arrives as seven
chords lasting 4, 2, 2, 1, 1, 1 and 1 bars. The practice tab's model is a
triad plus an optional 7th, so anything richer arrives as its nearest
equivalent: a 9th keeps its dominant 7th, a 6th chord drops to its triad, and
a power chord is read as major.

The chords aren't drawn from a chord dictionary: each rhythm says how it wants
its chords voiced — power chords for punk, barre shapes for ska, jazz shells
for bebop, the 9th grip for funk — and the shapes are derived from interval
templates in `js/genres.js`. The material itself is the generic vocabulary
method books teach (twelve-bar forms, ii–V–I, pentatonic and arpeggio
patterns, strumming styles), not transcriptions of particular recordings.

## Tests

Open `tests.html` — the tests run on load and print a pass/fail list, with no
server, runner or build step. They also leave the results on
`window.TEST_RESULTS` so a headless browser can read them.

Five things are guarded. The first two run over a fixed list of chords (C,
A, G, E, D, Cm, Am, Gm, Em, Dm, Ab, Gb, C#, A9, E9, C7, D7, Cm7, CM7):

1. **The chord finder keeps the shapes it already had.** Ranking and
   playability are judgement calls, so the test holds a snapshot of every
   shape those chords produced and fails if one stops coming back. Adding
   shapes is fine; losing one is not.
2. **Everything the chord finder draws, the reverse finder can name.** Each
   voicing is fed back through the chord-identification code, which has to
   recognise it as the chord it came from — so the two halves of the app
   can't drift apart.

3. **The chord finder shows the everyday grips.** Some fifty method-book
   shapes — open chords, E- and A-shape barres, the open 7ths, power chords,
   the funk 9ths — must come back, and for the unambiguous ones (open C, F
   barre, A7 …) must read first. The snapshot keeps old shapes from
   vanishing; this keeps the textbook ones from being buried.
4. **Naming round-trips.** What the app writes (`B°`, `CM7`, `Bø`, `CmM7`)
   its chord finder can read back, chords built from names keep the right
   notes, and identification names both a C6 and an Am7 for C E G A.
5. **The genre library and the presets are well-formed.** Every progression
   has a key and parseable chords, a "twelve-bar" has twelve bars, hits sit
   inside their grid, a six-slot bar declares itself a waltz, every chord can
   be voiced the way its rhythm asks, lead lines stay on the neck and inside
   their bars, and a "pentatonic" line uses five notes. This is the check
   that would have caught the eight-bar quick-change blues.

The snapshot lives in `js/tests.js`. If a change is *meant* to alter the
shapes, regenerate it deliberately rather than editing it to match.

## Sound

Everything is synthesized live in the Web Audio API — no MIDI, no samples,
nothing to download. The piano is a single periodic wave (five harmonics
baked into one oscillator, doubled and detuned a few cents) through a
per-note lowpass that opens with velocity and closes as the note rings, and
a two-stage decay so a note drops quickly then sustains quietly. The genre
examples add a guitar voice — detuned sawtooth pairs through a filter, and
through a soft-clipping waveshaper for the overdriven tones. Drums are
the classic recipes: a pitched-down sine for the kick, filtered white noise
for the snare and cymbals. Every bus meets at one gentle limiter before the
output, so a kick, a bass note and a full chord landing together can't add
up past what the output can carry. The style voices play a chord's own
seventh when it has one (a `D7` set on the ii is a real dominant) and only
fall back to the style's implied seventh for a plain triad. Notes are
scheduled against the audio clock by a 25 ms lookahead loop, so timing
doesn't drift when the main thread is busy.

## Code layout

`index.html` is markup and styles only; the JavaScript lives in `js/`, split
by what each part does:

| File | Responsibility |
| --- | --- |
| `theory.js` | Keys, scale degrees, chord formulas, chord naming, chord identification. Pure — no DOM, no audio, no app state. |
| `fretboard.js` | Tuning, CAGED and pentatonic shape templates, the maths that places them on the neck, and CAGED shape matching. Also pure. |
| `neck.js` | Draws a full 15-fret neck as SVG from markers and shape outlines — shared by the practice fretboard and the chord finder's CAGED overview. |
| `progressions.js` | The preset progressions, written as scale degrees. Pure data. |
| `genres.js` | Voicing templates and the code that turns a progression × rhythm into notes. Pure. |
| `genre-data.js` | The genre library itself: progressions, rhythm patterns and lead lines. Pure data. |
| `tab.js` | Draws guitar tablature from a note list. |
| `genre-examples.js` | The Genre examples tab: pickers, tab display, and its player. |
| `audio.js` | The Web Audio synth voices (piano, bass, drums) and the per-genre groove patterns. Owns the `AudioContext`; knows nothing about the UI. |
| `fretboard-view.js` | The practice tab's fretboard panel: the five views, the legend, the hover spotlight, the follow-playback highlighting. |
| `practice.js` | The CAGED practice tab: progression generation, the chord display and settings, and the playback transport. |
| `chord-finder.js` | Chord finder tab: voicing search, fingering, chord diagrams. |
| `reverse-finder.js` | Reverse chord finder tab: the clickable neck and the name lookup. |
| `tooltips.js` | The (i) info bubbles. |
| `tabs.js` | Tab switching, plus the URL fragment and page title that go with each tab. |
| `main.js` | Boots each tab and wires the header together. |
| `tests.js` | The regression tests, run by `tests.html`. |

Each file wraps itself in an IIFE and hangs its public interface off a single
`GT` namespace, so nothing else leaks into global scope. Dependencies run one
way — `theory` and `fretboard` know about nothing, `audio` uses `theory`, the
tab modules use those, and `main` starts them.

`practice.js` and `fretboard-view.js` share state (the progression, which
chord is sounding), so rather than reaching into each other, the view gets a
small **host object** of getters at `init()` and exposes a handful of methods
(`render`, `followChord`, `onPlaybackStarted`, …) for the practice tab to call.

They're plain `<script>` tags rather than ES modules on purpose: modules are
blocked by CORS when a page is opened straight from disk, and this one is meant
to work by double-clicking `index.html`, with no server and no build step.
