# How the styles are made

This is the method behind every style, band pattern and guitar part in the
app: where the material comes from, how a part is written, how it is placed
on the neck, how it is checked. Read it before adding or changing a style.
The findings themselves — what each genre's players actually do, with the
records that show it, and why every part is written the way it is — are in
[STYLES-CATALOGUE.md](STYLES-CATALOGUE.md), generated from the data.

## Where the data lives

- `review/proposals*.js` — the styles: for each genre, the research, the
  revised band and parts for every feel the app started with, the added
  feels, and (in `proposals-more.js`) the later passes that layered fills,
  tails, pickups, stop-time, turnarounds, lead lines and the upper register
  onto them. `proposals-easy.js` holds the hand-written easy versions;
  `proposals-hendrix.js` and `proposals-psychobilly.js` are the deep dives'
  genres, written for the engine (`engine: true`). A genre may add feels to
  a style that already exists (the psychobilly dive's eight feels join the
  app's `psychobilly` style): give the genre entry its own `id` and point
  each feel's `style` at the existing one. This is the source of truth for
  what the app plays.
- `js/styles-base.js`, the `LIBRARY` in `js/parts.js`, `js/parts-guide-data.js`
  — the base data the app started with. Kept so the review page can show
  before and after; the proposals are merged over it.
- `js/styles.js` — the merge, at load. A proposal's band fields override the
  base feel's; a proposed part replaces the base part it names (`replaces`)
  and the rest stay; an added feel becomes a new variant of its style; the
  guide page is written from the verdicts and the parts' reasons.
- `js/parts.js` — the realiser (the notes on the neck), `js/band.js` — the
  band slot by slot, `js/tab.js` — the drawing. The jam tab, the parts
  page (`parts.html`) and the review page (`review.html`) all play through
  these; there is one copy of each rule.
- `tools/styles-doc.js` writes the catalogue; `tools/sweep.js` realises
  every part in every reading, key, window and seed and reports anything
  outside the rules.

## The rule about sources

Every part is written from the idiom of its style — where the weight falls,
which strings carry it, which notes it leans on, how a phrase ends — and
never from a recording. Players and records are named as reference points
for the style; none of their lines is used. A boogie figure, a chromatic
walk-up, the G-run, the Charleston figure, the B.B. box: these are the
common property of the music, the way a twelve-bar form is. What would be
somebody's is a signature riff, and none is used. When research turns up a
figure that is one player's, describe the way of playing in the terms a
method book would use and write that.

Research goes in the genre's `research` text, with the records that show
it. If a claim about a style can't be backed by what its players do, it
doesn't go in the part.

## How a part is written

A part is bars on the style's grid — twelve slots to the bar when the style
swings or is in 12/8 (three a beat), sixteen when it is straight (four a
beat), nine for a jazz waltz (three beats of three). Every event has a slot
(`at`), a length in slots (`dur`) and a velocity (`vel`). The helpers in
`review/proposals.js` write them:

- `n(at, iv, dur, vel, flags)` a note, `nx(...)` a note written against the
  NEXT bar's chord — how a fill points where the music is going.
- `s(at, dur, vel, voicing, 'mute', flags)` a strum of the chord: `full`,
  `low` (bottom three), `high` (top three), `bass` (the root alone),
  `fifth` (the 5th alone — the other note an alternating thumb goes to),
  `power` (root, 5th, octave), `shell` (root, 3rd, 7th), `mid` (the D, G
  and B strings — the split chord a thumb-over hand strikes after its bass
  note), `sharp9` (the 7♯9 grip, x-7-6-7-8-x with the root on the A
  string) and `ninth` (the 9th grip, x-7-6-7-7-7); the two grips may sit a
  fret past the window (`reach: 1`). `sn` strikes the
  next chord early (the "and of 4" push). `add: 14` puts a colour tone (the
  9th) on top — and with `free` the tone keeps its note in every reading
  and, where the grip has no room above its top string (the E shape at
  the nut), takes the place of the grip's 5th on that string: `add: 9,
  free: true` on a `high` strum of E is the E6 of the rockabilly chicka; `chordSlide: 1` slides the chord in from a fret below;
  `stroke: 'up'` says which way the pick goes — otherwise the hand's rule
  decides from the slot (`strokeFor` in parts.js: down on the beat and the
  "and", up between, when the bar moves in sixteenths; down on the beat and
  up on the rest otherwise). The engine sweeps a strum the way a pick
  crosses the strings (audio.js `strumPlan`): 32 ms low to high on a
  downstroke, 22 ms high to low on an upstroke, the later strings a shade
  lighter, the whole strum weighing what `strumStringLevel` says.
- `d(at, iv, iv2, ...)` a double stop; `up: 2` bends its lower note.
  `d(at, iv, iv, ..., { unison: true })` is a unison bend: the note on one
  string and, on the string below, the note a tone under it bent up to
  meet it. `b(at, iv, up, ...)` a bend, `h`/`p` hammer-on and pull-off,
  `sl(at, from, iv, ...)` a slide. `g` is a ghost strum (a muted scratch).
- Flags: `dip: true` (or `dip: n`) the Bigsby pressed and let go on the
  chord or the note — a semitone (or n) down over a tenth of a second and
  back, "dip" written over the tab; `pop` a note snapped by a finger
  rather than picked (the chicken-pickin' front); `pm` palm mute, `stacc` short, `vib` vibrato (dropped where the
  note lands on an open string, which no hand can shake), `rake` a rake into
  the note, `trem: 8` tremolo picking, `ghost` a dead note, `wah` the pedal
  rocked with the stroke (a sweep up or down per note), `trill: iv2` a
  trill to that interval (played as 32nds; written once, the first note
  carrying the tab's value and `trillTo`, the fret it goes to, the rest
  `tabHide`), `free` a note played as written whatever the reading
  offers (the Dorian 6th, the major 3rd against a minor pentatonic, a
  chromatic step — the pitch is exact and is placed, not snapped), `reach:
  n` leave to sit up to n frets past the position window (a slide up into
  the box above and back, a bend at the top of the neck).

Notes are intervals above the chord's root, never pitches: 0 the root, 4
the 3rd, 7 the 5th, 10 the ♭7, 12 the octave, and above it 14 the 9th, 15
the ♭3, 16 the 3rd, 17 the 4th, 19 the 5th, 21 the 6th, 22 the ♭7, 24 the
double octave, 26 and 27 the 9th and ♭3 above it. Negative intervals sit
below the root (a bass walk-up: −5, −3, −2, −1). The reading decides what
each interval becomes: in Chords it snaps to a chord tone, in Pentatonic to
the box, in Scales it is the scale.

A part has:

- `figure` and `variants` — the bar it plays and the same bar with its
  weight moved; taken in turn, or rolled per bar with `figureMode: 'roll'`.
- `fills`, `fillsOnChange`, `fillsOnStay` — the bar before more of the same
  chord, and the bar before a change (a walk-up, an approach from above, the
  ♭7 onto the next 3rd). The realiser draws from the situation's list and
  the plain fills together.
- `tails` (a lick on the end of a figure bar), `pickups` (a lead-in on the
  last beat before a change), `stops` (stop-time: the band out, the guitar
  alone), each with a chance; `turnaround`/`turnarounds` for the last bar
  of the form; `leads` for the lead lines, played by the blend the player
  chooses (`feat.blend`): never, in about half the fill bars (each rolled;
  `leadChance` sets the share), or in every bar but the turnaround and the
  stop-time bars. A part with `leads` gets the Rhythm / Mixed / Lead switch
  in the app; one without doesn't.
- `easy` — a hand-written beginner's version, where the rule in
  `parts.js` (`simplify`) can't find it: fewer notes, on the beat. Written
  as an object (`easy: { figure: [...] }`); the lists it leaves out are the
  rule's simplification of the part's own, so no rake or bend survives.
- `blues: true` — the part plays the minor pentatonic over a major chord
  in the Pentatonic reading and the blues scale (1 2 ♭3 3 4 ♭5 5 6 ♭7) in
  Scales: the tension a blues or rock player keeps on purpose. Without it
  a major chord gets the major pentatonic, as the neck draws it.
- `needs: { preset, variant }` — a part written for one progression and
  no other (a walk-up whose 5th is the next root because every chord is a
  fourth below the last): it opens in the app only with that preset
  loaded, the excuse names it and loads it, and a shared link carries the
  preset (`pr=`).
- `why` — the reasons, in words. It becomes the part's page in the guide.

A genre with `engine: true` in its proposal (Hendrix) is realised on the
review page by the app's own `realise`, not the review page's superset
realiser, since it was written for features that are in the engine.

A bar handed to `realise` may carry a `window` of its own (`{ chord,
window }`): the Hendrix page gives each chord a position, so the hand moves
with the changes and each bar is realised in its window, the base window
standing for the rest. The engine says what each bar was written from in
`roles` — figure, variant, fill, lead, turnaround, stop-time — which the tab
writes over the bar.

## Register

Lines go where the players put them. Every genre's parts use the whole box,
low strings to the first string: the boogie on the low two, the B.B. box on
the top three, 6ths and octaves in between. A five-fret box whose root sits
on the low E holds intervals to 28 on its top string; one rooted on the A
string holds to 23 and folds the rest down an octave. So parts written for
a feel whose review key roots on the A string (E, C, G, D and most others)
peak on the 5th, 6th and ♭7 above the octave (19–23); the A, B♭ and G♯
keys reach 24–28. The `tools/reach.js` script prints this per key.

## Double stops, the thumb, the voicings

- A double stop is placed by shape: 2nds to 5ths on adjacent strings, 6ths,
  7ths and octaves with one string skipped, 10ths with two; the boogie's
  root-and-6th adjacent, a stretch. A 3rd may invert to a 6th when that
  keeps it on the treble strings the box has, never when its lower note
  bends. (`placePair` in parts.js.)
- A fingerpicked part keeps its thumb on the bass strings: `bass` is the
  lowest root on E, A or D, `fifth` the 5th on the string beside it. When
  the window has no root on those strings (F♯m in a box of frets 5 to 8)
  the thumb reaches a fret or two past the window for one, marked
  `reach`, before settling for the 5th or the lowest chord tone the bass
  strings hold — never a treble string. A dead
  thumb is the root on every beat, by definition; the fingers play the
  treble strings, so their intervals are written an octave up, and a part
  marked `fingers: true` (every fingerpicked part; `liftFingers` in
  proposals-more.js sets it) never puts a finger note on a string the thumb
  uses in that bar — the realiser moves it to the nearest place for its
  pitch on another string, an octave up before down, and a hammer-on whose
  two notes come apart plays plain. `tools/thumb-clash.js` counts the bars
  where that would otherwise happen. (`thumbCell`, `fingersOffThumb`.)
- `power` is the root on the lowest string that has it, the 5th on the next
  string up, the octave above — one hand shape, so when the window holds
  the root but not the two frets above it the shape reaches past the window
  (the notes marked `reach`) rather than falling to chord tones on skipped
  strings; only a window with no root falls back to a low strum. `shell` is
  root, 3rd and 7th (or 5th for a triad), the way a big-band rhythm guitar
  plays; where none sits inside the window (G's shell at frets 3 to 5
  under a window at the 5th) it is the same stretch moved a fret or two
  along — moved, not widened, so a shell never spans six frets — with the
  notes past the window marked `reach`, and the low strum after that.
- In the Triads reading every strum is the triad the neck shows, whatever
  voicing was asked for; where the window holds no close triad on the
  reading's string set (A♭ minor on G-B-e sits at the 4th fret, one past a
  window at the nut) the nearest a fret or two past it is strummed, marked
  `reach`. No strum ever leaves a bar empty (B80).
- A 7♯9 or a 9th struck whole (`full`) is its own grip — x-7-6-7-8-x,
  x-7-6-7-7-7, root on the A string — when the grip can be had at the
  position, not a CAGED 7th with the colour left out. `opts.shapes` (a set
  of CAGED letters) narrows the grips a strum may use; the drills tab sets
  it, the jam tab doesn't.
- A strum is a pick sweep across neighbouring strings. When the window
  cuts into the grip so that its cells inside sit on strings that aren't
  neighbours, the grip is completed a fret or two past the window (the
  notes marked `reach`) rather than played with a string skipped; a colour
  tone on top (`add`) sits on the string beside the grip's top one, or is
  left out. A shell mutes the string between its root and its 3rd and 7th,
  and a fingerpicked part (`fingers: true`) plucks its chords, so neither
  is held to it. `tools/sweep.js` counts strums that skip a string.
- A chord with colour the triad-and-7th model can't spell — 7♯9, 9, add9,
  6, sus2, sus4, 7sus4 — carries it as `ext` (semitones beyond the triad)
  and `sus`, and the palette, the strums and the comp voice it: a strum of
  E7♯9 has its G against the G♯.

## The band

A style's pattern is slot lists for the kit (`kick`, `snare`, `hat`, `ride`,
`rim`, `ghost`, `hatOpen`, and `brush` for the wire brush on the snare — the
train beat's sixteenths), `chord` entries for the comp and `bass` entries
(`off` an interval, `walk` a step of a walking line, `next` the next
chord's root), a `fill` for the last bar of the form, `bassApproach` (a
semitone below the chord to come, on the last eighth before a change),
`bassSnap` (the upright snapped on every note: a click on the front, a short
ring) and `slap` slots (the hand slapped against the strings between the
notes — rockabilly's single slap on the upbeat, psychobilly's two on the
sixteenths after each note — with `slapVel`),
`compAnticipate` (the next chord struck on that last eighth, as an
upstroke, in place of any strike the pattern has there), an optional `stroke` on a chord entry for the guitar voice (la
pompe is all downstrokes; otherwise the hand's rule decides), `swing` for
sixteen-slot grids, `beats` when not four, `slapback` where the style lives
on it, and `voice` (`triad`, `dom7` or `jazz`). `js/band.js` has the rules
and the list.

## Checking

Measure rather than assume. When a claim is made about the parts — that
they sit low, that double stops land on the wrong strings, that the thumb
moves, that a list is never heard — realise them and count. The scripts in
`tools/` do this: `sweep.js` (every part through every reading, key, window,
easy mode and seed: no exceptions, every note in the window or marked
reach, every bar played, no technique left in easy mode, no vibrato on an
open string, no swept strum skipping a string), `reach.js` (what each key's box
holds), and on the review page each card exposes its realised state
(`card.getState()`) so a measurement can run in the console.

Every change is held by a test in `js/tests.js` (open `tests.html`): the
parts are well-formed and realise inside the reading in every key and
window (a note with `reach` may sit past it, and says so); the engine's
features each do what they say on a part written for the purpose — free
notes, reach, the blues palette, the colour grips, unison bends, trills,
the wah; the band lands the approach and the push on the last eighth of
every grid; a part with `needs` opens only with its preset and the link
carries it. Every new test is sabotage-checked: break the thing it holds,
see it fail, put it back.

## Adding a style, in order

1. Research first: what its players actually do, with the records that show
   it, in the genre's `research` text. Not lines — ways of playing.
2. Add the feel to the genre's `additions` in the right `proposals*.js`:
   `label`, `inspired`, `style` (the group it lists under), `progression`,
   `key`, `tempo` (and `mode`, `scaleTheory` if minor or modal), `why`, the
   `band`, the `parts`. Six-bar progression, so the guide shows figure, fill,
   variant, fill, variant, turnaround.
3. Write the parts up the neck as well as down it, with change and stay
   fills, a turnaround where the style has one, tails, pickups or stop-time
   where its players do those, and `leads` if it is a chord part.
4. Run `node tools/sweep.js`, then `tests.html`; look at the part on the
   review page with the fills rerolled a few times; play it.
5. Run `node tools/styles-doc.js` so the catalogue says what you found.
