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

- One key picker: all 24 keys, major and minor side by side, always naming
  the key you're actually in, with a dice beside it that picks a new one. In
  minor, the V is occasionally the harmonic-minor dominant. Changing key —
  by hand or by dice — transposes what's already there rather than rolling
  something new: each chord keeps its scale
  degree, so a I–V–vi–IV in A becomes the I–V–vi–IV of wherever you land, and
  picking C minor from C major turns it into i–v–VI–iv. A progression loaded
  from a genre example isn't diatonic, so it shifts by the same interval
  instead, spelled the way the new key spells it
- Preset progressions, in one picker that names each the way people do with
  the numerals beside it, and that follows the key's mode. In a major key:
  Blues (12-bar, quick change, jazz blues, 8-bar, slow blues), Three-chord ·
  I–IV–V, Four-chord pop · I–V–vi–IV, 50s doo-wop · I–vi–IV–V, Jazz cadence
  · ii–V–I, Jazz turnaround · I–VI7–ii–V7, Canon and a few more. In a minor
  key: Blues (with the minor blues variant), Minor three-chord · i–iv–V,
  Minor four-chord · i–VI–III–VII, Minor pop · i–VI–VII, Minor rock ·
  i–VII–VI–VII, Jazz cadence · ii°–V–i, Andalusian · i–VII–VI–V. They're
  stored as scale degrees, so a preset lands in whatever key you're in and
  follows you when you change key, and every chord stays editable
  afterwards; changing one drops the picker back to "None" but keeps the
  rest. The blues presets force dominant 7ths, which no key's own diatonic
  7ths give you — I7 IV7 V7 in a major key, i7 iv7 V7 in a minor one, the V
  a real dominant either way. Change the key to the other mode and the
  picker's list changes with it, and a preset that lives in both modes keeps
  its meaning — a blues is I7 IV7 V7 in major and i7 iv7 V7 in minor, a
  ii–V–I is Dm7 G7 Cmaj7 in C major and Dm7♭5 G7 Cm7 in C minor — because
  those sevenths are stored relative to the key rather than frozen when the
  preset landed. A preset that isn't in the new list simply stops being "the
  preset" while its chords stay, transposed
- Per-slot chord selection — one row per chord, with the columns named once
  at the top (Chord / Bars / Quality) so which picker does what is readable
  rather than something you learn by clicking. Every chord picker always names
  a real chord of the key, and the dice beside the count stepper rolls the
  whole set at once. Randomness
  is an action rather than a state a slot sits in, so what you see in the
  pickers is always what's sounding. A chord loaded from a genre example that
  isn't a degree of the key names itself instead. The presets sit above these,
  so you can drop a shape in and then edit it
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
- "Common chords only" — limits the dice to I, ii, IV, V, vi / i, iv, v–V,
  VI, VII (picking a chord by hand can still reach anything)
- "Use 7ths" — every chord whose quality you haven't set yourself takes the
  diatonic seventh of its degree (maj7 / dominant 7 / m7 / m7♭5, whichever the
  scale implies) instead of a plain triad. Ticking it swaps triads for
  sevenths where they stand: the roots, the degrees and the bar lengths don't
  move, and any chord you've set by hand — or that a preset pinned — is left
  alone
- Click a bar in the chord display to hear that chord on its own, playing or
  not — for checking a shape against what it's meant to sound like. Each bar
  is a button, so Enter or the space bar does the same to a focused one
  (there the space bar means "hear this chord" rather than play/pause)
- Space bar starts and stops playback (here and in the genre examples), as
  long as you're not typing in a field
- "Copy link to this progression" writes the key, every chord's degree, bar
  count and shape, the tempo and the style into the page's URL and copies it,
  so a progression can be bookmarked or sent to someone; opening the link
  brings it all back. A progression loaded from a genre example is written as
  chord names instead, since its chords aren't degrees of anything
- Info tooltips (ⓘ) on the less-obvious controls — hover on desktop, tap on
  touch, tap elsewhere to dismiss
- The tab is three panels in the order a session runs: build the
  progression (key, preset, the per-chord pickers, and what the dice may
  use), then everything you touch while it plays (Play, tempo with 60/90/120
  shortcuts, style and feel, the Simple-only note value, the metronome /
  roots-only / count-in options, and the share link), and then the chord
  chart itself. The chart closes that panel and the neck opens the next one,
  so the two things you read while playing sit against each other rather than
  with the controls between them. Play sits in the transport list and also
  floats bottom-right, clear of the page, so it's never somewhere you have to
  scroll back to; both are the same control and show the same state. A "Style"
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
  readout under the chords (the key itself is shown plainly above them,
  e.g. "C major" / "C#m")
- Fretboard panel (6 strings, 15 frets) with six views, each named in one
  word — the tab is already CAGED practice and the legend already says
  "C shape", so the prefix was carrying nothing:
  Roots — every root-note location for the progression (colour-coded,
  legend gives each root's roman numeral; while playing, the currently
  sounding chord's root is ringed and spotlighted);
  Progression — one shape per chord, colour-coded by
  chord, chosen so every shape sits close together on the neck (shared notes
  split-coloured, no shape outlines since several overlapping shapes made
  them confusing here, and hovering/tapping a chord name in the legend —
  which also names each chord's CAGED shape letter — spotlights it, same as
  Chords); every note is labelled by scale degree except the root,
  which keeps its note name; with the whole cluster shown at rest, every
  note is dimmed except each chord's lowest root, so the anchor notes stand
  out; the barred
  G-shape is skipped everywhere except its own open-G-chord form, since it's
  not realistically playable elsewhere. **All chord tones** turns the cluster
  of grips into a map of the progression: instead of one shape per chord,
  each chord's whole arpeggio within reach of that shape, and a ring on every
  note two chords share — so you can see what your fingers keep as the chord
  changes. (In that mode the ring means "shared", since the roots are already
  named by their label.) A ii–V–I is mostly shared notes, which is the point.
  **Voice leading** picks each chord's
  shape closest to where the *previous* one landed rather than to one fixed
  fret, so the shapes walk from one to the next the way a hand does — an
  Am7 that would otherwise jump back to the nut carries on up the neck
  instead. "Next position" cycles to the next
  cluster up the neck, wrapping back to the lowest. When a chord carries a
  seventh, its shapes turn into the 7th-chord voicing guitarists use for it —
  flattening that shape's own doubled root by a half step (major 7th) or a
  whole step (dominant/minor 7th) — rather than tacking a note onto some
  other string. "Follow playback" (on by default) lights up whichever
  chord is currently sounding (in both the fretboard and its legend entry),
  lightly dims the next chord, and dims the rest much further; a lit note
  only wears the root ring when it's actually the sounding chord's own root,
  not just a note it happens to share with another chord's root;
  Chords — the five CAGED shapes for the chosen chord, outlined and
  colour-coded, every note labelled by scale degree except the root (which
  keeps its note name), shared notes split-coloured; a chord carrying a 7th
  shows its 7th-chord shapes, the 7th drawn as a hollow dot, so this view
  and Progression agree. **Whole arpeggio** opens those same five
  shapes out: every chord tone on the neck, each one coloured by the CAGED
  box it sits in (seam notes split-coloured), labelled by degree, with the
  grip itself still traced through the middle of its box. That's the CAGED
  arpeggio a method book teaches — the shape you already know, plus the notes
  around it on each string. The outlines are the same grips either way, so the
  toggle changes how much you see rather than what you're looking at, and the
  Box row works in both: with the grips alone each grip is its own box, so
  "Single box" walks the neck one CAGED shape at a time. **Other chords**
  draws the progression's remaining chords faintly into the box you're
  practising in, each in its own colour and only on the frets the chord in
  front isn't already using, so you can see where the changes fall without
  moving your hand;
  Triads — close three-note triads on one set of three adjacent
  strings (e–B–G, B–G–D, G–D–A or D–A–E), every inversion, all the way up
  the neck, each legend entry also naming the CAGED grip its shapes are cut
  from so a triad reads as somewhere you already know. Each shape is outlined
  and coloured by which chord tone is
  underneath — root position, 1st inversion (3rd in the bass), 2nd inversion
  (5th in the bass) — and hovering an inversion in the legend picks out just
  those. A voicing qualifies when it plays one of each chord tone, one per
  string, rising in pitch across the set, inside an octave and a hand span,
  which is what produces the shapes rhythm players comp with (C major on the
  top three strings comes out 0-1-0, 5-5-3, 9-8-8, 12-13-12);
  Pentatonic — the chosen chord's major/minor pentatonic, every note
  coloured by the CAGED box it belongs to (seam notes split-coloured), scale
  degrees in the dots, chord-shape outlines through the chord tones. The
  chord's own notes (1, 3, 5 and its 7th) are drawn at full strength and
  the rest of the scale sits back, so the notes to land on read at a glance;
  Scales — with a toggle between two theories: Parallel (the scale
  matching the chosen chord's own quality — major chord → major scale, a
  dominant chord → Mixolydian so its ♭7 is in the scale, minor chord →
  natural minor) and Key mode (chord-scale theory — the progression key's
  mode rooted on the chosen chord, e.g. a IV chord reads as Lydian); same
  CAGED-box colouring and chord-tone emphasis either way.
  Both scale views have a "Box" row: **Single box** shows one CAGED
  position at a time, with ◂ ▸ to walk up and down the neck and the legend
  naming the fret range; **Hold position** keeps that stretch of frets fixed
  when the chord changes (by hand or by following playback), so the new
  chord's notes appear under the hand you already have there rather than the
  view jumping to the new chord's box — the "stay in one position while the
  ii–V–I goes by" exercise
- A "Display" row applies to every view. **Frets** zooms in on a stretch of
  the neck — all frets, 0–7, 4–11, 8–15, or "Fit to box", which follows
  whichever single box is on screen. The frets keep their width, so a shorter
  neck is drawn in a narrower space and scales up: on a phone the dots go
  from 14px to 18px and the sideways scroll disappears. **Colour** fills each
  dot either by the CAGED shape it belongs to (the default) or by what the
  note is in the current chord — root, 3rd, 5th, 7th, everything else a
  scale tone. The roles come from the chord itself, so a ♭5 reads as that
  chord's 5th while a ♭6 in the scale around it reads as a scale tone. The
  shape outlines stay shape-coloured either way; colouring by interval has
  nothing to add to Roots (already coloured by root) or Progression
  (coloured by chord), so the control is hidden there
- The legend says where each shape sits — "C shape 6–10" — and, for a shape
  that appears twice on a 15-fret neck, both places ("D shape 0–2 · 12–14").
  Only shapes actually on screen get an entry, so a single box or a zoomed
  stretch of neck leaves the others out
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

Click any shape to hear it strummed, low string to high, on the clean guitar
voice. A slash chord (`D/F#`, `C/E`, `Am/G`) works too: the same chord with
the named note underneath, so only shapes with that note on their lowest
sounding string are offered — and the note can be one from outside the
chord, as in `C/D`.

## Reverse chord finder

Click frets on the interactive fretboard to select notes (clicking a
selected fret again clears it; picking a different fret on the same string
replaces the old selection, since a string only sounds one note at a time).
Once one or more frets are selected, every chord name that fits — trying
each selected note in turn as the root — is listed below, using the same
chord-formula table as the chord finder. "Play notes" strums what you've
picked.

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).

## Genre examples

Twenty-two styles, grouped by family: skate punk, ska punk, pop punk and
hardcore; rockabilly, psychobilly, surf rock, country and bluegrass; hard
rock and grunge; delta blues, Chicago blues and blues rock; bebop, gypsy jazz
and bossa nova; funk, reggae and soul; thrash metal; flamenco.

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
for bebop, the 9th grip for funk, octaves for pop punk, and for the styles
that live at the nut (delta blues, country, bluegrass, flamenco) "open",
which tries every CAGED form and takes the lowest one that fits, so G is the
open G and B7 the open B7 rather than a barre — and the shapes are derived
from interval templates in `js/genres.js`. A boom-chick bass can alternate
between the root and the 5th of whatever grip it's on. The material itself
is the generic vocabulary
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
per-note lowpass that opens with velocity and closes as the note rings, a
two-stage decay so a note drops quickly then sustains quietly, a few
milliseconds of filtered noise on the front for the hammer, and a level that
eases off up the keyboard the way a real piano's does. The genre examples
add a guitar voice — detuned sawtooth pairs through a filter. The overdriven
tones all go through one shared clipping stage, so the strings of a chord
are distorted *together*: that intermodulation is where a power chord's
crunch comes from, and clipping each string on its own never gets there.
There's a reverb too — a convolver fed by a synthesized room, decaying noise
whose top end rolls off over the tail — with a send from each voice at its
own level: a clean guitar sits in it, an overdriven one only touches it, and
the palm-muted chug stays dry. Drums are the classic recipes: a pitched-down
sine for the kick, filtered white noise for the snare and cymbals. Every bus
meets at one gentle limiter before the
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
| `neck.js` | Draws a full 15-fret neck as SVG from markers and shape outlines — shared by the practice fretboard, the chord finder's CAGED overview and the reverse finder, so all three necks are one drawing. |
| `progressions.js` | The preset progressions, written as scale degrees. Pure data. |
| `genres.js` | Voicing templates and the code that turns a progression × rhythm into notes. Pure. |
| `genre-data.js` | The genre library itself: progressions, rhythm patterns and lead lines. Pure data. |
| `tab.js` | Draws guitar tablature from a note list. |
| `genre-examples.js` | The Genre examples tab: pickers, tab display, and its player. |
| `audio.js` | The Web Audio synth voices (piano, bass, drums) and the per-genre groove patterns. Owns the `AudioContext`; knows nothing about the UI. |
| `fretboard-view.js` | The practice tab's fretboard panel: the six views, the legend, the hover spotlight, the follow-playback highlighting. |
| `practice.js` | The CAGED practice tab: progression generation, the chord display and settings, and the playback transport. |
| `chord-finder.js` | Chord finder tab: voicing search, fingering, chord diagrams. |
| `reverse-finder.js` | Reverse chord finder tab: click targets over the shared neck, and the name lookup. |
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
