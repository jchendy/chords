# Jeff's Guitar Tools

A single-page, dependency-free site with four tabs under one header:

- **Practice** — generates random diatonic chord progressions and
  plays them back on a recorded piano or a recorded guitar, over a recorded
  double bass, with an optional hi-hat click.
- **Chord finder** — type a chord name (e.g. `G#9`, `Cmaj7`, `Dm7b5`), or
  pick one of the examples, and see the common places to play it on the neck.
- **Reverse chord finder** — click frets on an interactive fretboard and
  see what chord name(s) the selected notes could be; hear them together as
  a chord or one at a time as an arpeggio.
- **Ear training** — four drills, run ten questions at a time. Three put a
  chord shape, a pentatonic box or a scale box on the neck and sound a note
  from inside it for you to place; the fourth plays a whole chord, shows you
  only its root, and asks what kind of chord it is.

Switching tabs stops any playback that was running. Each tab has its own URL
fragment (`#chord-finder`, `#reverse-chord-finder`), so a tab can be
bookmarked or linked to, and back/forward move between them; the page title
names the tab you're on.

## Practice

## Features

- Opens on the first preset the key's mode offers — the three-chord
  progression, plainest ground to practise over — rather than on a random
  roll, so a fresh page starts on something recognisable and the picker says
  which it is; the dice are there for a random one. A shared link still wins
- The chart carries its own copy of the key picker, the key dice and the
  preset picker, plus a dice that rolls a whole progression — two to four
  chords, a bar or two each, then the chords themselves, honouring the same
  two roll settings. So the things you reach for most while playing are on the
  chart rather than two panels down. They're views on the same state, not a
  second copy of it: change either and both follow
- One key picker: all 24 keys, major and minor side by side, always naming
  the key you're actually in, with a dice beside it that picks a new one. In
  minor, the V is occasionally the harmonic-minor dominant. Changing key —
  by hand or by dice — transposes what's already there rather than rolling
  something new: each chord keeps its scale
  degree, so a I–V–vi–IV in A becomes the I–V–vi–IV of wherever you land, and
  picking C minor from C major turns it into i–v–VI–iv. A progression that was
  typed in isn't diatonic, so it shifts by the same interval instead,
  spelled the way the new key spells it
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
  a real chord, and the dice beside the count stepper rolls the
  whole set at once. Randomness
  is an action rather than a state a slot sits in, so what you see in the
  pickers is always what's sounding. A chord that was typed in and isn't a
  root you picked names itself instead. The presets sit above these,
  so you can drop a shape in and then edit it
- All twelve roots, in two groups — the seven the key owns read as their
  degree (`Dm · ii`) under "In this key", and the five it doesn't read as
  what they are (`Bb · ♭VII`) under "Outside the key", so stepping outside is
  plain rather than something you have to work out from the letters. A
  borrowed root is held as an interval above the tonic rather than as a note,
  which is what lets it survive everything a degree survives: transposing
  takes it along (the ♭VII of C becomes the ♭VII of D), a shared link brings
  it back, and a mode that turns out to own it — the ♭III of C major is the
  III of C minor — hands it back to that degree. It's spelled the way its
  numeral writes it, so a ♭VII reads `Bb`, not `A#`
- Per-slot chord quality — the degree picker names the degree and nothing
  else (`Dm · ii`); a second picker beside it sets the shape, and offers
  Major, Minor, 7, maj7 and m7 on any degree, with dim, m7♭5 and dim7 added
  on the one degree whose own chord is diminished — and every shape at once on
  a root outside the key, which the key says nothing about. A **✓** marks the two
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
- "Chord chart / Tabbed guitar part" — on its own line under the key, the
  chart's two readings: the chords as bars, or a guitar part to play over
  them. The part is a two-bar figure
  and its answer — rhythm guitar with fills, chord strums on the feel's
  beat and single-note lines between — written for the feel that's playing
  and realised into the notes the neck's reading offers in its position.
  It's lit on the neck as it goes, written out as tab with its own controls
  above it, and sounded on the recorded guitar so you can hear what you're
  aiming at, on top of the band the way a lead sits, with a volume slider
  and a mute for when you'd rather play it yourself, and a second pair for
  the band — comp, bass and drums together — so it can be pulled down under
  the part or under you. ‹ › steps through the
  feel's parts and "New fills" re-rolls the answering bars of the one
  you're on; nothing changes otherwise, however long you practise — in
  particular the neck following the playing chord into another box does
  not move it. The part stays in the window it was set in, and only
  stepping the box yourself takes it along. "Follow chords" moves the notes
  with each change using whatever the neck is showing; "Stay on the I"
  keeps them on the key's scale throughout. When there's no part to show —
  the neck across the whole neck, or a feel with none written yet — the
  view says why. The tab names a chord where it arrives, with its Nashville
  numeral after it, and not over the bars it holds through — the way the
  chart reads — with the name of the bar being played lit and a playhead
  on the slot. On a wide screen (700 px or more for the tab) it wraps to as
  many bars as fit across and shows two rows at a time, the row being
  played on top and the row after it below — what's coming is what you need
  to see — scrolling a row at a time as the bar moves down, with room under
  the last row so it too gets the top; narrower than that it's one long strip
  that scrolls sideways a bar at a time, since a wrapped tab on a phone
  holds one bar a row. See **Suggested parts** below for how a part written
  once ends up in four readings
- "Type it" — a button by the progression name opening a field that takes the progression as chord
  names, one per bar: `E E E E A7 A7 E E Bm7 Bm7` is four chords held for
  four, two, two and two. Bar lines and commas are allowed (`A | D | E`,
  `C, Am, F, G`) because people write them. The key follows the chords —
  the first one is the tonic and its quality picks major or minor — since
  half the reason to type a progression is to reach what the dice can't:
  a borrowed chord, a secondary dominant, a key change. A word it can't
  read refuses the whole line and says which word, rather than quietly
  dropping a bar. The field also reads back whatever is set, so it doubles
  as a plain-text view of the chart
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
- Space bar starts and stops playback, as long as you're not typing in a
  field
- "Voice" plays the chords on the recorded piano or on the recorded
  guitar the finders use (see **Sound**). The piano is the default because
  it stays out of the way of the guitar you are playing over it; the guitar
  is there for hearing a voicing the way it would actually sound, and strums
  its notes 16 ms apart rather than striking them together. Pressing Play
  fetches the whole sample set at once, since a chord lands on a beat and
  can't wait for a download; any chord whose notes haven't arrived — or that
  are out of reach, as they are on a `file://` page — is played on the piano
  instead, so choosing the guitar can never leave you with silence
- The address bar follows the tab, the way it does on the other four: the
  key, every chord's degree, bar count and shape, the tempo, the style and
  feel, the voice — and what the neck below the chart is showing, packed into
  one field. A setting left at its default is left out, so the fragment only
  grows as far as you've strayed from them, and a bookmark holds what you
  were actually looking at: the third box of the A-shape pentatonic coloured
  by interval, not merely the key you were in. A typed progression is written
  as chord names instead, since its chords aren't degrees of anything. "Copy a link to all of this" stays, because putting
  that address on the clipboard is the part the address bar can't do for you
- An info tooltip (ⓘ) beside the position method, the one choice that
  needs explaining — hover on desktop, tap on touch, tap elsewhere to dismiss
- The tab is laid out as a stage: near-black ground and high-contrast ink,
  meant to be read from a music stand, with colour reserved for the CAGED
  shapes — a chosen control is ink with a rule under it, not a coloured
  fill. The chart comes first, its key as the title and the progression's
  name beside it, both directly editable (the real pickers lie over the text)
  with a dice for each, a
  gear that opens the Settings menu, a Type it button (a popover with the
  progression as chord names, one per bar), and the style as *genre › feel* with two buttons beside it that load the
  progression the style is usually played over and set the tempo it is
  usually played at (the ones its page in the parts guide shows it with) —
  and a Play at the head of the row, so playback starts without looking away
  from the chart. When the chosen preset has variants (the blues: 12-bar,
  quick change, jazz blues…) they show as a row under the title. The chart's
  bars are the editor: tap a bar to hear it and to change its chord or its
  quality, type a name for it, or remove it; "+" on the last bar adds a bar
  of the same chord. Editing one bar of a chord held for several splits that
  bar off, so nothing else moves. The things set once and left — the voice,
  the click, roots only, the count-in, what the dice may use, the dot colour,
  the fret range, the share link — are in the **Settings** menu under the
  gear. The style has a
  picker of its own, a sheet over the page: the sixty-one feels grouped by
  genre with a count each, a search box, and the last three used at the top;
  the bar's select over the name offers the same list for the keyboard. The
  neck sits under the chart with its controls on it: the five views as tabs
  above, a toolbar for the reading (across the neck / in one position) and
  whatever the view needs, and a quieter row for the shapes under the
  legend. In one position the stretch of frets is drawn on the neck as a
  window you can drag; a joined ‹ › pair at the end of the toolbar and an
  arrow on each edge of the window step it. One transport is pinned to the
  bottom of the tab: Play, the tempo slider with its BPM readout and five one-tap tempos under it, the
  click, a button that copies a link to all of it — key, chords, style,
  tempo, the neck's view, the part's roll — and a Hide / Show controls
  button. In the Part view the
  controls are one row — the part's arrows and name, New fills, the
  lead-roll tag, Easy, Follow chords / Stay on the I — with the techniques
  (and Humanize) behind a Techniques menu and the part and band volumes
  behind a Mix menu; on a phone the tab strip comes before that row. While
  it plays, a beat line appears along the top of every bar in the chart and
  fills through the sounding one a quarter per beat. The click's own row
  moves out of the Settings menu into the bar when the window is wide enough
  and back again whenever the menu is open, so it is never missing a
  setting. On a phone the site name drops out and the tools row scrolls
  sideways. A Hide controls button in the transport (Show controls once
  pressed), at every width, hides every control — the neck's, the
  progression's buttons, the part's row — so the picture has the screen — a phone needs it
  most, but a desktop can want the neck on its own too. Turned sideways a phone goes further, because that is the shape with the
least height and the most need of it: the chart sets its chord names small
and tight, and the controls come off by default. A phone in landscape is
told apart from a tablet by its height and from a desktop window someone has
made short by its pointer — it is the only screen that is both short and
touched — and once you have pressed the controls button yourself, rotating
doesn't overrule you. The bar itself can fold away too, from a button at its
right end, leaving Play floating clear of the page and giving the neck the
eighty-odd pixels the bar was using; that button is there wherever there's
room for it, which is everywhere but a phone held upright, where the neck
already fits and the bar has no space to spare. The style picker chooses the
  backing from one list, the same in the picker and in the bar's select:
  Simple quarter / half / whole note — the plain piano voicing at that
  spacing, with a metronome click and a roots-only mode;
  Straight rock — driving 8th-note chords and a basic kit; Rock — the
  same backbeat and eighth-note hats with the comping thinned to a chord
  per quarter and the bass filling the "and" of 2 and 4, which is what a
  fresh page plays; Half-time rock — the snare on 3 alone under sustained
  chords;
  Rockabilly — swung and quick, the slap bass walking root and fifth with
  its click on the upbeats, a dominant-7th comp chanking on the upbeats and
  leaning on 2 and 4; Psychobilly — straight and faster, the kick on every
  beat, the bass pumping eighths with an octave leap, the chords chugging
  every eighth; Surf rock — straight and dry, a push into 1 and 3, eighth
  notes in the bass with the fifth under three, short chords every eighth;
  Country — a two-feel with a train under it, the bass alternating root and
  fifth, the comp chanking on 2 and 4; Bluegrass — no drums, the bass in
  two and the chop on 2 and 4;
  Blues shuffle — 12/8: boogie-woogie walking bass (1-3-5-6-♭7-6-5-3),
  long-ringing dominant-7th stabs on the shuffle upbeats, a shuffled kit;
  Slow blues — sparse 12/8, a held chord and the turnaround bass; Jump
  blues — the boogie figure with the eighths square, a hard backbeat and two
  short stabs a bar, the rock-and-roll side of the music;
  Swing — a "spang-a-lang" ride with hi-hat on 2 & 4, a quarter-note walking
  bass (root–5th–3rd–chromatic approach), rootless Charleston-comped 7ths;
  Bossa nova — straight, the samba-derived bass and a syncopated comp;
  Gypsy jazz — no drums at all: la pompe, four short chords a bar with a
  lift into 2 and 4, over a bass in two;
  6/8 ballad — slow, twelve to the bar, the ride on every one of them, the
  chord on each beat; Reggae — the one drop, kick and rim together on 3,
  the skank on every and, the bass in the space; Ska — quick, every and an
  upstroke, a walking bass in eighths; Soul — a pocket, 7th-chord shells
  off the beat, a bass line through the octave and ♭7;
  Pop — four on the floor;
  Classic funk — the hit on the One, ghost kicks, constant 16th hats; Disco
  — four on the floor with off-beat chords and an octave-jumping bass;
  Metal — the kick on every eighth, chords and bass chugging with it.
- Live chord highlighting synced to playback, with a measure.beat position
  readout under the chords (the key itself is shown plainly above them,
  e.g. "C major" / "C#m")
- Fretboard panel (6 strings, 15 frets) with five views, each named in one
  word — the tab is already Practice and the legend already says
  "C shape", so the prefix was carrying nothing. One **View** toggle above
  them all decides whether you're looking at the whole neck or at one hand
  position, and it stays put when you switch view, so following a chord into
  its scale doesn't throw you back out to the whole neck. The second button is
  named for what that view actually puts in the position: **All chords in one
  position** in Chords and Triads, which bring the whole progression with you,
  and plain **In one position** in Roots, Pentatonic and Scales, which put one
  view's notes there rather than every chord. In one position a
  single Position row appears — ◂ ▸ to move the hand — and each view narrows
  to its own notes inside that stretch. It stays where you put it as the chords
  change; only the arrows move it. The views number their positions differently (a pentatonic box
  isn't the same width as a CAGED grip), so switching view re-picks the
  nearest one rather than carrying the index across, and the hand stays where
  it was:
  Roots — every root-note location for the progression (colour-coded,
  legend gives each root's roman numeral; while playing, the currently
  sounding chord's root is ringed and spotlighted);
  Chords — the five CAGED shapes for the chosen chord, outlined and
  colour-coded, every note labelled by scale degree except the root (which
  keeps its note name), shared notes split-coloured; a chord carrying a 7th
  shows its 7th-chord shapes, the 7th drawn as a hollow dot, so this view
  and the position reading agree. **Whole arpeggio** opens those same five
  shapes out: every chord tone on the neck, each one coloured by the CAGED
  box it sits in (seam notes split-coloured), labelled by degree, with the
  grip itself still traced through the middle of its box. That's the CAGED
  arpeggio a method book teaches — the shape you already know, plus the notes
  around it on each string. The outlines are the same grips either way, so the
  toggle changes how much you see rather than what you're looking at, and the
  Position row works in both: with the grips alone each grip is its own box, so
  one position walks the neck one CAGED shape at a time.
  This view reads two ways, chosen by **View**. *Across the neck* is one chord
  at a time, its five shapes everywhere they fall — the view for learning where
  a chord lives. *All chords in one position* is the whole progression gathered
  under one hand, drawn the way it plays —
  each chord in its own colour, labelled by degree, its grip traced faintly
  through, and three tiers of brightness (the chord in front lit, the
  one you're heading into next half-lit, the rest dimmed much further, roots
  included). Only the frets the chord in front isn't already using are drawn,
  so the rest stays behind rather than competing. A chord shows whichever of
  its own shapes sits nearest the position, not only one lying wholly inside
  it — a CAGED grip is four frets wide and a box at the nut can be three, so
  the stricter reading would simply drop the chord. And the shape you see for
  a chord sitting behind is the shape you get when you switch to it: both come
  from one list of that chord's shapes and one function picking from it, in
  every view, rather than from two pieces of code that have to agree. Colour there means which
  chord a note belongs to, so the legend reads the same way: one entry per chord with its name, numeral, the CAGED shape
  it's sitting in and the frets it spans, each spotlighting its chord when you
  hover it, and the chord in front marked. Across the neck only one chord is
  drawn, so colour is free to say which of its five shapes a note is in
  instead, and the interval colouring stays available there.
  Whole arpeggio applies to both. Everything about *choosing* a
  position belongs to the second reading, since the first has no position to
  choose — it shows them all. Three ways of putting the progression in one
  place: **One box** clips every chord into a single CAGED box, so nothing
  leaves the frets you're on; **Cluster** gives each chord its own best position, chosen to sit
  close to the others, so the shapes are the ones you'd really play (the barred
  G-shape is skipped everywhere except its own open-G form, since it isn't
  realistically playable elsewhere); **Voice leading** gives each chord
  whichever of its own shapes sits nearest where the last one landed, so the
  hand walks through the changes rather than jumping back down the neck. ◂ ▸
  step the box or cycle to the next cluster. The three differ in where the
  shapes land and in nothing else: all of them draw the chord in front lit, the
  one you're heading into next behind it, the rest faint, and read out the
  frets the position covers.
  **Shapes** picks which of the five you're working on — switch the rest off
  and they leave the neck, the outlines, the legend and the positions the
  arrows walk through. Chords, Pentatonic and Scales are three views of the
  same five shapes and share the choice, so following a chord into its scale
  keeps the ones you're on. Each reading keeps its own set, though, since the
  two are asking different things: across the neck all five are on, because
  that picture is the map of where a shape lives, while in one position it
  opens on A, E and D, the three that fall under the hand without a stretch.
  Change one and the other stays as you left it. The last shape standing can't
  be switched off.
  One box needs the shapes left on to be able to meet somewhere: on Am–Dm–E,
  all five or A–E–D hold one shape of every chord inside four frets, A and E
  need five, but a single shape needs ten to twelve — most of the neck, and not
  a position at all. Past a hand's reach the option greys out, and if it was
  the one selected, Cluster takes over, since Cluster is already the reading
  that lets each chord sit where it really falls.
  Triads — in one position these behave as Chords does: the chord in front
  lit, the rest of the progression's triads behind it in their own colours,
  and the legend naming each chord with the inversion it's sitting in.
  Across the neck they're close three-note triads on one set of three adjacent
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
  Every scale box is written out rather than worked out, the way the
  pentatonic ones are: which of two places a note is best fingered in is a
  judgement, not something a rule derives, and deriving them left every box
  with a hole in it — the 2 missing from an octave here, the ♭6 there. A mode
  has the same notes as the major scale it comes from, so it has the same five
  boxes: you play D Dorian with C major's shapes and count from a different
  root. That moves the roots inside each box and so moves the CAGED name with
  them — C major's D shape is D Dorian's E shape — and every mode is written
  out on that basis. The result is a complete run of the scale in every box,
  over four or five frets, tested across all seven modes and all twelve roots.
  Both scale views take the same Position row as the others: ◂ ▸ walk one
  CAGED position at a time up and down the neck, with the legend naming the
  fret range. The position stays where you leave it as the chords change, so
  the new chord's notes appear under the hand you already have there rather
  than the view jumping — the "stay in one position while the ii–V–I goes by"
  exercise
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
  nothing to add to Roots (already coloured by root) or the position reading
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
`13`, `7#9`, `9sus4`, `6/9`, and around two dozen others; chart spellings
like `C7(#9)`, `Cadd2` and `G6add9` read too) — and the tab searches every
string/fret combination within a comfortable 4-fret stretch for shapes that
sound all of that chord's defining tones (the plain 5th is treated as
optional, same as real players drop it). Two chords bend that rule the way
players do. The 6/9's 3rd is optional: x-x-4-4-5-5 is A E B F♯, no C♯
anywhere, and every chart calls it A6/9 — though a bare root, 6th and 9th
isn't one yet, so the 3rd or the 5th has to be there. And an extended chord
(a 9th, 13th, 6/9 …) may be played **rootless**, the way jazz and funk
players do when the bass has the root: four different notes on the top four
strings, the 3rd and 7th among them and the 9th standing in for the root.
x-x-5-6-7-7 is G C♯ F♯ B — the ♭7, 3, 13 and 9 of A — and is offered for
A13 with a "no root" note under it.

Every shape is then handed to a fingering pass, which either works out a
playable left hand for it or throws it out. Fingers are numbered 1 (index)
to 4 (pinky); up to three fingers may share a fret, and when that isn't
enough the shape is barred — the index across the lowest fret, or a higher
finger laid flat over neighbouring strings (the ring-finger barre that
shapes like C9 and Em9 need). A barre that would silence an open string, or
sound a note outside the chord, means the shape isn't offered at all.

A few open shapes are fingered by convention instead, from a small table the
pass consults first. The convention there comes from the chord a shape is
lifted from rather than from anything about the frets: Em is E major with the
index taken off, so it keeps E major's middle and ring, while Asus2 — two
notes on one fret, the same shape as Em — is A major with the ring taken off
and keeps A major's index and middle. Nothing about the geometry separates
those two, so they can't both come out of a rule.

The results come in two sections, **Common** and **Less common**, most
common first within each. Every shape is told what kind of grip it is from
its geometry — an open chord, a barre chord, a power chord, a compact
root-6 or root-5 grip (x-3-5-4-5-x, 1-x-2-2-1-x, x-7-6-7-7-7), a
top-string voicing, a three-note triad, a shell, one of the other CAGED
forms — and whether that kind is a common way to play *this* chord: the
open chord and the barre for a triad, those plus the root-6 and root-5 grips
for a seventh, and the compact top-string shape as well for anything
extended past the 7th, which is how a 6/9 or a 13th is nearly always
played. Hover a shape for a tooltip naming the kind and the styles it's at
home in — the family's own (folk, country and pop for an open chord; jazz,
blues and bossa nova for a grip; funk, R&B and reggae for a top-string
voicing) plus the chord type's (a dominant 7th belongs to the blues in any
shape, a 9th to funk and soul, a maj7 to jazz).

Choosing and ordering are separate judgements: a score decides which shapes
make the cut (fuller chords, small stretches, root in the bass), and a
second pass brings back the everyday grips the first pass hid — the
four-string Fmaj7, the three-string power chord, the A9 that lost out to a
dozen six-string variants at the nut, the 6/9's five-string barre that lost
its place to two open-string variants of itself, the Hendrix chord
(x-3-2-3-4-x, which is not x-3-2-3-4-0 with a string thrown in because it
happens to be in the chord). Each kind of grip gets a few places of its own,
so the barres can't use up the room before a top-string shape gets a look
in, and two shapes that are one hand — the E-shape barre with its top string
off, the 6/9 grip with the 5th string fretted as well — show as one. Within
a section the kinds read in the order a player meets them, open chord before
barre before grip, and then up the neck; extra strings past four count for
little, a barre costs, and so does a hand that zigzags between frets. Open
position (anything within reach of the nut) counts as one position, so a
shape that happens to be all open strings never sorts ahead of the real open
chord. Open-position shapes draw a nut, higher ones are labelled with their
starting fret, and a shape built on a CAGED form says which one.
Every diagram names each sounding string off the end of the neck: the note
it plays and what that note is in this chord (`B♭ ♭7`, `E 3`, `A R`), so
you can see the shape and read the harmony off it at once. Chord tones are
spelled the way their own degree writes them — the ♭7 of C7 is B♭, not A♯ —
and a degree with no accidental of its own follows however the root is
spelled. The cards carry no chord name: the whole page is one chord, so
printing its name on all thirty diagrams says nothing. What a card does say
is what's true of that shape alone — the CAGED form it's built on, and
whether it's rootless.

Toggles sit above the results: **shapes** narrows the list to **open**
shapes (at least one open string: they ring, they're usually easier to
hold, and they only work in the one place) or **movable** ones (no open
strings, so the same grip slides along the neck to any root — the barres
and the compact jazz grips); dots can show **finger numbers** or **scale
degrees**; **shell voicings only** narrows the list to shells — the chord
stripped to the notes that name it (root, the 3rd or the sus note standing in
for it, and the 7th), dropping the plain 5th but keeping an altered one, with
the root underneath on the 6th or 5th string, which is the grip jazz players
comp with; and for a plain triad you can ask for **three-note voicings
only**. A major or minor triad also gets the whole-neck CAGED
picture at the top — the same five shapes the practice tab draws, from the
same code, so the two always agree.

Click any shape and you hear it three ways over, on a recorded guitar: the chord, then its notes
one at a time up and back down, then the chord again — how it sounds, what's
in it, then how it sounds with those notes in your ear. (The top note isn't
struck twice at the turn, so the run reads as one line instead of stalling
at the top.) Clicking a single dot, or the note's name beside it, sounds
just that note; pointing at either lights both, so it's plain they're the
same string and that either will play it. A second click calls off whatever
the first still had coming.

All of it plays on the recorded Martin described under **Sound** — and, on a
page that can't reach those recordings, on the synthesized piano. Not on the
synthesized guitar: six of its strings struck together are six sawtooth pairs
through one clipping stage, and a chord with a 9th and a 13th in it turns to
mud there, where the piano's notes stay separate however many land at once.

A slash chord (`D/F#`, `C/E`, `Am/G`) works too: the same chord with
the named note underneath, so only shapes with that note on their lowest
sounding string are offered — and the note can be one from outside the
chord, as in `C/D`.

Each card carries a **⋮** menu, for the things you'd do to one shape rather
than to the chord: at the moment that's "Open in ear training", which hands
that exact grip to the drill. The button only appears on hover, since thirty
of them showing at once would be thirty things competing with the diagrams —
except on a touch screen, where nothing hovers and it always shows.

## Reverse chord finder

Click frets on the interactive fretboard to select notes (clicking a
selected fret again clears it; picking a different fret on the same string
replaces the old selection, since a string only sounds one note at a time).
Once one or more frets are selected, every chord name that fits — trying
each selected note in turn as the root — is listed below, using the same
chord-formula table as the chord finder. Each name is a button: clicking it
opens that chord in the chord finder, so the two tabs run in a loop — this
one tells you what the notes under your fingers add up to, that one shows
every other way to play it. A rootless match hands over the chord itself
(`A13`, not `A13 (no root)`), which the finder can look up like any other. Then the roots that *aren't* there:
an extended chord played without its root, the 9th standing in for it, is
named too and marked "(no root)", after the plainer readings — B F♯ C♯ G is
A13 (no root) and nothing else, while C♯ E G B is C♯m7♭5 first and A9 (no
root) after. Only chords of five tones or more are read that way, since a
rootless 7th is just a triad. "Play chord" strums what you've picked and
"Play arpeggio" rolls it, both on the same piano voice the chord finder
uses.

## Ear training

Something on the neck, and a drill over it. Three of the four drills put a
shape there and ask you to place its notes — a **chord** shape, a
**pentatonic** box or a **scale** box — and the fourth, **chord quality**,
plays a whole chord and asks what kind it is. They share everything below
the picture: only the picture, what it holds and the words for it differ.

A chord is drawn as a chord diagram, because that's how a chord is written
down; it's the chord finder's own — same search, same diagram, same sounds —
so clicking it plays the chord three ways over. A box is drawn across the
whole neck, because that's where it lives and half of learning one is knowing
where it sits — and it's drawn by the practice tab's own code, coloured by
the CAGED box it belongs to with the chord shape inside it traced through,
since knowing which chord a box sits on is most of what makes it worth
learning. (A scale with no perfect 5th has no such grip, and Locrian
accordingly gets no line: the filter that keeps only grips the box wholly
holds says so without being told.) Either way, clicking a note plays that note, and the notes
light under the pointer the same way.

The **scale** drill offers the seven modes and the **pentatonic** drill the
two pentatonics, on any of the twelve roots, in the five CAGED boxes — the
same written-out boxes the practice tab draws. The scales are named here by
the intervals that define them, which is also how those boxes are keyed, so
asking for a scale and getting its shapes is one lookup and no translating.

**Play** narrows a box to a single octave or leaves it whole. A box holds the
same five or seven notes two or three times over, and one octave — the span
a player runs while learning the shape — is a fairer drill than eighteen
notes spread over five frets. The whole box is still drawn either way; the
notes outside the octave in play just go quiet — still labelled with their
degree, since reading the shape is half of what a box is for — so you can
see the whole thing and see which part of it you're being asked about.
**↓ ↑** move the octave, and stop at the ends rather than wrapping. The ends
include the partial octaves: the one at the top of the box that runs off the
end of the shape, and the tail below its lowest root — built downward to a
root rather than up from one, and the only way those notes are ever in play.

Which octave it starts on takes a little care: usually the one above the
box's lowest root, but a box clipped by the nut can have its lowest root so
high that the octave above it runs off the top of the shape, so the fullest
octave wins. Of the 582 boxes across every scale and root, three are like
that — A major pentatonic's A box holds three of its five notes above the
lowest root and all five above the next.

Setting up an exercise and doing one are different jobs, so the tab is in one
state or the other. The setup — drill, subject, shape, octave — is the whole
page until you press **Start a run of 10**, and one line of summary once you
have, which is what makes room for the drill: on a 375×667 phone the answer
buttons used to begin at y=702 in a 667-tall viewport, so you couldn't see
the question and the answers at once. They start at 450 now.

A run is ten questions and then a result: how many you got, and what you went
wrong on (`Went wrong on ♭7 (3×), 4`). It's the thing that makes the drill
something you can finish, and therefore something you can do well or badly
at, which an endless tally never was. **Go again** runs another ten of the
same; **Change the exercise** puts the setup back. **Just practise** is the
endless version for when you only want to noodle, and keeps the running
tally instead of a run.

Either way the drill picks a note and plays it, and you say which one it was.
A question counts once however many times you guess at it: three wrong stabs
at one note is one question missed, which is the honest measure of whether
you heard it. **Play the note** repeats it; **Play the chord**,
**Play arpeggio** and **Play root** give it context — the shape struck
together, rolled one note at a time, or just the root the rest is heard
against. (A rootless voicing hasn't got one, and there that button goes
rather than sounding a root the shape doesn't contain.) The answer buttons
are the notes of the chord, each with its name and what it is in the chord
(`C` / `R`, `E♭` / `♭3`). One button per note rather than per string — a shape with its root on
two strings is still one answer. Get it right and it says so, then picks the
next note and plays it, so a drill keeps going without a press in between;
get it wrong and it says that instead and leaves the same note running. The
next note is never the one you just answered: hearing the same note twice
running teaches nothing, and reads as though the drill has stalled.

A note sounds where it actually sits in the shape rather than at some
neutral octave. A 3rd on the top string and a 3rd buried in the middle of
the chord are different things to hear, and telling them apart is the point.

**Chord quality** is the odd one out: it rolls a root, a quality and a shape,
plays the chord, and shows you nothing but the root on the neck — the root is
what you'd know from the bass, the quality is the question. The shape is
rolled too, so the same quality doesn't arrive sounding identical every time;
hearing past the voicing is part of it. **Ask about** says which qualities it
may pick, starting on the five you have to tell apart before any of the rest
are worth trying — major, minor, maj7, m7 and 7 — with everything from 6 and
sus4 through 9, 13 and 6/9 there to switch on as they become worth it. The
last one on can't be switched off, and switching off the quality of the chord
currently sounding rolls a new one, since it's no longer a fair question.

**Back** puts the last question on again and plays it, for when one went past
before you'd placed it. It restores the whole question, which in these drills
means the thing on the neck as much as the note asked: stepping to another
box or rolling another chord is a new question, so going back has to put the
neck back too.

**Random** rolls a new subject — in chord mode, the everyday triads and
sevenths plus the colours you meet soon after, on any of the twelve roots,
starting on one of the first few shapes rather than the open one every time;
in the other two, a key, a scale and a box. In chord mode you can type a
chord name instead.

**Shape** opens every way of playing it at once — the same list the
chord finder shows, drawn the same way, with the one you're on marked — and
you pick by looking rather than by stepping past the twenty-nine you didn't
want. In there a click is a choice and not a sound: the diagrams are the
menu, not the instrument. The **‹ ›** arrows beside it step through the same
list for when you just want the next one, and the button itself names the
CAGED shape you're on as well as its place in the list (`A shape · 2 of 6`),
since the letter is how a player knows a box.

Every note that sounds lights up where it sits — the root, the chord, the
run up the scale — so you can see what you're hearing and where it is. With
one exception, which is the point of the tab: the note you're being asked
never lights, because lighting the question would be answering it. It lights
once you've placed it, where knowing where it was is the thing worth taking
away. The chord finder's diagrams light the same way as their shapes play.

**Root first**, on by default, sounds the root before the note you're being
asked to place. A note on its own is a hard thing to place; heard against
the root it's an interval, which is the thing an ear can actually learn.
Turn it off when you don't want the help. The root plays even when the root
*is* the answer — skipping it there would be easier, and would also give the
game away, since a question that played one note instead of two could only
ever be the root. When the root *is* the answer it's asked an octave up from
the reference wherever the shape has one: the same note twice is no question
at all, where a root against its own octave is one worth being able to hear.

**You answer by pointing at the dot.** A note drill asks which note sounded,
and where a note is is what the answer is made of — so the answer is given on
the neck rather than from a list. There is no setting: the three note drills
all work this way. The quality drill is the exception, and not by omission —
"what kind of chord is this" has no place on the neck to point at, so it
keeps its buttons.

Pointing is exact by nature. You can't point vaguely at a C, so a shape's
three Gs are three different answers, and pressing the twin of the right one
is marked as its own kind of miss — "that's the 5, but not that one" —
because telling the note but not the place is a different mistake, and the
one this drill exists to train. It still costs the question. A dot that is
drawn but out of play, which is most of a box when one octave of it is
sounding, isn't an answer at all: clicking it says so and leaves the question
standing.

Pointing carries one rule a list of buttons wouldn't need: **while a question
stands, a dot answers instead of sounding.** The shape is clickable
everywhere else in this app, and clicking round a box until one matches what
you heard is a way to get every question right without hearing anything.
Before the drill starts and after it ends, the dots play as they always did —
then it's a shape to explore rather than a test.

The neck under the question is drawn as the box and a fret either side,
rather than as the whole fifteen. A box is four or five frets, so drawing it
full-length spent three quarters of the width on neck nobody was being asked
about and left every dot a third of the size it could be — which matters a
great deal when the dot is the thing you tap. On a phone the box now fills
the screen with 40px targets, and the tap area grows a little further where
the pointer is coarse.

## Suggested parts

A part is written **once per feel**, as two bars on the feel's own grid —
a figure, then a fill — out of two kinds of note. A single note is an
interval above a root: 0 is the root, 7 the fifth, 10 the flat seventh, 12
the octave; or, marked as such, an interval above the *next* bar's root —
how a fill points where the music is going, the ♭7 falling to the IV's 3rd,
a chromatic step up under the root that's coming — and an interval below
zero is below that root. A single note can also be a **technique**: a
double stop (a second note on another string, funk's 4ths and rockabilly's
6ths), a bend (the note pushed up a semitone or a tone to a note the
reading allows — measured from the note as placed, so a 4th the chords
reading moved to the 3rd doesn't bend to a ♯4 it doesn't offer, it plays
plain), a hammer-on or pull-off (the second note on the same string,
without the pick, eased in), or a slide into the note from a fret below or
above. The part view has a toggle for each; switched off, the technique
plays plain — a double stop as its first note, a bend as the note it bent
to, a hammer-on as two picked notes, a slide as the note slid to — and
where the window can't hold it (no higher fret on that string, an open
string under a bend) it plays plain too, rather than not at all. The tab
writes them the way tab does: "3/5", "5b1", "4 h 6", and an "x" over a
palm-muted strum. In the engine a bend and a slide are the recording's
playback rate ramped, which is what a bend does to a string; a hammered
note is the same recording without its pick, eased in over 25 ms; a
palm-muted strum has its top rolled off. A strum is the chord itself: the CAGED grip the box is built on,
the strings of it that sit in the window (three at the least, or it isn't
a chord), swept low to high 16 ms a string the way a pick does, with a 7th
chord getting its 7th the way the chords reading draws it. A strum says how
much of the grip it wants, as the style does: the whole thing, the bottom
three strings where a shuffle keeps its weight, the top three for a stab or
a chop, the root alone — the low note an alternating-bass strum puts
before the chord (the 5th when the window has cut the root off, the other
note such a bass goes to) — or the 5th alone, the note that bass alternates
to, which is how country's and bluegrass's boom-chick is written. A strum
can also be palm-muted, for the chug of metal. In the triads reading every strum is the triad
the neck is showing on its string set and nothing more, the root alone
being its lowest note. A figure also has **variants** — the same bar with
its weight moved, a pickup added, a strum opened out — that the phrases
take in turn, so four bars on one chord aren't the same bar four times
over; they cycle rather than roll, so the part stays what it was until you
ask for a change, and the fills are where the dice are. A part is rhythm
guitar with fills, so every one strums somewhere, and a test says so. It isn't written for
a key, a box or a reading. Those come at realisation: the interval becomes a
pitch class against the chord (or the key, when the part stays on the I), is
snapped to a note the reading allows — the note itself if it's there, else
the nearest within a tone, downward first, else nothing — and is placed on
the nearest such note inside the position window, climbing from the lowest
root the window holds on the bottom three strings. So the same part appears
in the chords reading using only chord tones, in the pentatonic reading
using only the five, and in the scales reading using the scale; a note the
reading can't offer within a tone is dropped rather than forced, so a sparse
reading gives a sparser part, not a wrong one.

Written that way because parts belong to feels — twenty-two of them, and
Simple — and appear in four readings. Written per reading they'd be
twenty-three times four times several examples, hundreds of hand-written
parts none of which could be given real attention. Written once and
snapped, they're twenty-three times a few. Every feel the picker offers has two, and a test holds it to that.
Simple has no feels of its own — quarter, half and
whole notes are one hit at three spacings — so its parts are written for a
stand-in on a sixteenth grid: the chord struck whole on one and nowhere
else (the backing is already a chord a beat) and a run through part of the
scale for the rest of the bar, in quarter notes or in eighths.

**The parts, explained.** `parts.html` (from the menu: "The parts,
explained") writes every part out over a six-bar progression that suits its
style — figure, fill 1, variant 1, fill 2, variant 2, fill 3 — with what its
rhythm and notes are made of, the players and records the idiom comes from
(reference points for the style, never sources of lines), and a Play button:
the style's own band under the part on the guitar, from a small player of
its own in `js/parts-guide.js`. A switch shows the same parts in the Chords,
Pentatonic or Scales reading, and another plays the techniques plain. The
text lives in `js/parts-guide-data.js`, and a test holds every feel and
every part to having its page there.

**The style review.** `review.html` is a page for deciding what the styles
should become: every existing style beside a proposed revision of it — the
band pattern and every guitar part, both playable — plus proposed new
styles and a list of engine changes, with a decision to record on each
(keep / take the proposal / mix / drop; add / skip; do / later / no) and a
box for notes. Nothing on it touches the app: `review/proposals*.js` hold
the proposed patterns and parts, `review/review.js` a player and realiser
of its own that understands the proposed engine features (change-aware
fills, turnarounds, ghost notes, rakes, tremolo, chord slides, colour
tones, shell voicings, swung 16ths, humanized timing, slapback, 3/4), so
what the app can't do yet can still be heard and judged. An "Easy mode"
checkbox plays every part the way a teacher would show it first: no bends,
hammer-ons, pull-offs, slides, rakes, tremolo or ghost notes, sixteenths
back on the eighths, the middle of each triplet dropped, no tails, pickups
or stop-time; `review/proposals-easy.js` writes the beginner's form out by
hand for the parts where a rule can't find it (the boogie in quarter notes,
la pompe without the lift, the batida in one bar), and each card says
which it got. Decisions save to this browser and, when `serve.py` is
serving, to `review/decisions.json` (not tracked); "Copy decisions" puts
them on the clipboard for the deployed copy, which has no server.

**Implemented.** Everything the review page proposed is what the app now
plays. The method and the findings are written down in `docs/STYLES.md` and
`docs/STYLES-CATALOGUE.md`; read the first before changing a style. `js/styles.js` merges the proposals in `review/proposals*.js` over
the base data (the band patterns in `js/styles-base.js`, the parts library
in `js/parts.js`, the guide in `js/parts-guide-data.js`) at load: a
proposal's band fields override the base feel's, a proposed part replaces
the base part it names and the rest stay, an added feel becomes a new
variant of its style, and the guide page is written from the verdicts and
the parts' reasons. Sixty-one feels, ninety-seven parts. The engine in
`parts.js` is the review page's: fills that know whether the chord is
changing, turnarounds, tails, pickups, stop-time, rolled figures, lead
rolls, ghost notes, rakes, tremolo, vibrato marks, chord slides, colour
tones, shell and power voicings, double stops placed by shape, the thumb on
the bass strings, easy mode; the band scheduler plays ghost snares, open
hats, rim, ride, a drum fill into the top of the form, the bass approaching
changes, the comp anticipating them, swung sixteenths, three beats to the
bar, slapback on the styles that live on it, and humanizing (a checkbox).
A part is realised from one seed ("New fills" is a new seed), so a link
holds the exact roll. The review page still works: its left column is the
base data, what the app played before.

**What the fills are made of.** Each style's fills are written from what
its players actually play between the chords, and the file says so above
each: which notes carry the style (a blues line is the root, the ♭3 leaning
on the 3, the 4th, 5th and ♭7, said more than once; a rock line the minor
pentatonic with a note repeated rather than a scale run; a jazz line a
chord tone on the beat — 3rd and 7th first — with a passing note between;
a funk line mostly root and octave in syncopated bursts; a gypsy line an
arpeggio with the 6th), what the rhythm does (space in a slow blues,
sixteenth bursts in funk, triplets in gypsy jazz), and where the last beat
goes — nearly every fill ends on notes written against the next chord: its
root approached from a semitone or a tone away, its 3rd, its 5th, or the
root enclosed from above and below, as the style would. The blues and rock
parts also go up the neck: intervals above the octave (17 the 4th, 19 the
5th, 22 the ♭7, 24 the root, 26 and 27 the 9th and ♭3 above it) place on
the box's top strings, which is where B.B. King's box, Albert King's bends,
Berry's double stops and the rock unison bend live; a card's counts line
says how many of its bars go up there.

**Where the parts come from, and why they're nobody's.** Every part is
written from the idiom of its feel — where a shuffle puts its weight, which
degrees a blues line leans on, how a turnaround falls — and not from any
recording. A boogie figure, a minor-pentatonic run, a chromatic walk down to
the root: these are the common property of the style, the way a twelve-bar
form is. What would be somebody's is a signature riff, and none is used,
however simple, because being recognisable is the whole point of one.
Sources were consulted for the idiom, never for the notes; `js/parts.js`
says so at the top, beside the parts themselves.

A test holds every part to its feel's grid and every realisation to its
promise: on every reading, in every key, in three positions, every note it
produces is inside the window and is one the reading allows (a note written
against the next chord is held to *that* chord's palette, and one test
plays the IV's root over the I and expects the IV's root; a bend's target
too, and a bend never sits on an open string; a hammer-on's second note is
on the same string, above, a pull-off's below, and lands where the first
said it would); every part has a fill that points at the next chord; every
technique is written somewhere and comes out somewhere, and switched off
one at a time each leaves no trace and loses no written note; a strum is as
many strings as it asked for, its bass note the root or the 5th, and in
triads it is three notes of the triad on the chosen strings — and in the
generous scales reading, at least four notes in five of what was written
survive, so a part can't quietly snap itself away to nothing. Six bars on
one chord must not play the figure the same way three times, and must come
out the same on a second realisation.

## Bookmarking an exercise

Every tool keeps its state in the address bar, so a particular chord, box,
drill or example can be bookmarked or sent to someone:

| | |
|---|---|
| `#chord-finder?c=Bb13&s=movable&d=degrees` | that chord, movable shapes only, dots showing degrees |
| `#reverse-chord-finder?n=x-x-5-6-7-7` | those notes picked, written the way this app writes a grip |
| `#ear-training?m=scale&k=Eb&s=dorian&i=2&o=1` | that drill, that box, that octave |
| `#ear-training?m=quality&q=maj.m.7.9.13` | the quality drill, asking about those five |
| `#practice?k=major:C&c=0.2.,4.2.&t=120` | the practice tab's own share link (`#caged-practice`, its old name, still opens it) |

It's the exercise that's saved, not the question it happens to be asking: a
bookmark should reopen the drill rather than one moment of it, and Random is
there for wanting another. The state is written as you go, with
`replaceState` — a control you twiddled is not a place you navigated to, and
forty of them would leave the back button useless — except in the practice
tab, which keeps its explicit **Copy link**: its state is a whole
progression, and rewriting twelve chords into the URL on every twiddle would
be noise.

## Usage

Open `index.html` in any modern browser. No build step, no dependencies
(fonts load from Google Fonts).

To hear the recorded guitar rather than the synthesized fallback, serve the
folder over http instead — a page opened from disk isn't allowed to read the
sample files beside it (see **Sound**). Anything will do:

```
python3 serve.py
```

Then <http://127.0.0.1:8777/>, and <http://127.0.0.1:8777/tests.html> for the
tests. `serve.py` is `python3 -m http.server` with one thing fixed: it sends
`Cache-Control: no-store`. Plain `http.server` sends no caching instructions
at all, and a browser given none caches heuristically — roughly a tenth of the
time since the file was last modified — so on a folder you're editing every
few minutes the page you reload is quietly the page you had before, and you
end up debugging code that no longer exists on disk. Add `--lan` to reach it
from a phone on the same wifi, at the price of serving the whole folder,
`.git` included, to anything on that network.

## Tests

Open `tests.html` — the tests run on load and print a pass/fail list, with no
server, runner or build step. They also leave the results on
`window.TEST_RESULTS` so a headless browser can read them.

The second group draws the fretboard for real. The five views decide their
shapes while rendering, against the practice tab's own markup, so there's no
pure seam to test through: `tests-fretboard.js` builds the controls the view
binds to — ids and data-values, nothing else — points it at a made-up
progression and reads the SVG. Every check there guards a bug that shipped,
and they were all the same mistake in different places: a shape is something
you put your hand on, so clipping one to a window, or letting several blur
together, leaves something on screen nobody can play. What it asserts is that
a chord is drawn as a grip (one note per string), a triad is drawn whole or
not at all, the whole progression is on the neck, the legend names exactly
what's drawn, a note two chords share carries a colour for each of them, and
playing through a progression doesn't walk the hand along the neck.

Two groups are guarded. The first twelve run over the pure modules; the first
two of those over a fixed list of chords (C, A, G, E, D, Cm, Am, Gm, Em, Dm,
Ab, Gb, C#, A9, E9, C7, D7, Cm7, CM7):

1. **The chord finder keeps the shapes it already had.** Ranking and
   playability are judgement calls, so the test holds a snapshot of every
   shape those chords produced and fails if one stops coming back. Adding
   shapes is fine; losing one is not.
2. **Everything the chord finder draws, the reverse finder can name.** Each
   voicing is fed back through the chord-identification code, which has to
   recognise it as the chord it came from — so the two halves of the app
   can't drift apart.
3. **Open shapes and movable ones are told apart.** The filter runs inside
   the search rather than over its results, so asking for open shapes gives a
   list full of them rather than the two or three that survived the general
   ranking. Every shape offered under a filter has to belong to it (no open
   string, or at least one), still read back as the chord it came from, and
   six named grips must show under their own heading and not the other one.
4. **Every chord name the app writes parses back.** The reverse finder's
   matches are buttons that hand their chord to the finder, so each of the
   thirty chord types, on three roots, has to survive being written out and
   read again — the slashes (`6/9`, `m/maj7`), the symbols (`m7♭5`, `7♯9`)
   and the brackets (`m(add9)`) included.
5. **The chord finder shows the everyday grips.** Some sixty method-book
   shapes — open chords, E- and A-shape barres, the open 7ths, power chords,
   the funk 9ths, the 6/9 shapes with and without their 3rd, the Hendrix
   chord, the jazz grips, the rootless 13th — must come back, and for the
   unambiguous ones (open C, F barre, A7 …) must read first. The snapshot
   keeps old shapes from vanishing; this keeps the textbook ones from being
   buried. A companion test holds a table of shapes with the kind of grip
   each is and whether it's common (the F barre is; a top-string C triad and
   the bottom four strings of a barre are not), checks every common shape
   reads before every other, and that the styles a shape claims follow from
   its kind and its chord type.
6. **The ear trainer's answers cover its shape.** The drill offers one
   button per note and sounds a note from somewhere inside the shape, so the
   two halves have to agree: every note is answerable, none is offered
   twice, the row reads root upwards, and each answer says what the diagram
   says beside the same string. It also pins the open C's three answers, and
   that a 13th chord's 2nd reads as its 9th.
7. **Naming round-trips.** What the app writes (`B°`, `CM7`, `Bø`, `CmM7`)
   its chord finder can read back, chords built from names keep the right
   notes, and identification names both a C6 and an Am7 for C E G A — and
   A6/9 first for A E B F♯, a rootless A13 and nothing else for B F♯ C♯ G,
   nothing rootless for E G B or C E G D.
8. **Every scale the drill offers has boxes of its own.** The ear trainer
   names its scales by the intervals that define them and fretboard.js keys
   its boxes the same way, which works only as long as the two lists agree:
   ask for a scale whose signature isn't in the table and the boxes quietly
   come back as the parallel major or minor, and the drill would be showing
   one scale while calling it another. So every scale offered has boxes made
   of its own notes, and a full box holds all of them.
9. **One octave of a box is one octave of it** — an octave span with one of
   the box's own roots at one end of it, and the fullest octave that box has,
   counting both the octaves built up from a root and the tail built down to
   the lowest one. Over all twelve roots, because the case it guards is rare:
   three boxes in 582 have a higher root whose octave beats the lowest's, and
   two roots wouldn't meet one.
10. **Every chord quality the drill can ask is one it can play.** A quality
    whose suffix the finder can't parse, or one with no shape holding its own
    root, would leave the drill rolling in silence — so each has to survive
    being written out, found and voiced, on three roots. It also pins the
    five it starts on.
11. **Every note the neck can play has a recording near it.** Fifteen samples
   cover the range by being stretched a semitone or three either side of
   themselves; stretch one much further and it stops sounding like the guitar
   it was. So every string and fret the app draws has to land inside some
   sample's own range, and the map has to be in order with no gaps and no two
   samples claiming a note. The practice tab's chords are held to the same
   line from the other end: all twelve roots in all twelve qualities are
   written out, voiced, and checked note by note against the map, because a
   voicing that reaches past it would drop to the piano mid-progression and
   the only sign would be that one bar sounded different.
12. **The piano map covers both layers end to end.** Sixty-six file names
   were transcribed out of the upstream `.sfz`, and a wrong one is invisible
   at runtime: the fetch fails, the bank goes quiet, and the synthesized
   voice plays as though nothing had happened. So both layers are held to the
   shape the `.sfz` has — all 88 keys covered, no gap, no note claimed twice,
   no sample stretched further than its layer allows — and every note the
   practice tab can play is checked to have a sample on both sides of the
   velocity split. It also walks every style in the library rather than the
   voices that exist today: a style added later either voices inside the
   warmed range or this fails, and a style asking for a voice nothing can
   place fails too. That is the guard the jazz comp needed and didn't have.
13. **Every bass note every style can play has a recording, and it is
   warmed.** Three things at once, over 23,328 notes — every bass figure in
   every style, on every chord, at the velocity that style declares. It has
   to be inside the register a bass plays in, so a style added later can't
   quietly write a line up where a player wouldn't go. It has to have a
   sample. And that sample has to be one the warm actually fetches: a note
   whose recording nothing loads plays on the synthesized bass however long
   you wait, which is the shape of bug you only notice as "that sounded
   thin". The last of those was real — moving the roots down left the lowest
   samples outside what the warm asked for.
14. **The presets are well-formed.** Every preset progression's degrees
   are in range, a "blues" preset is twelve bars, a preset a mode offers has
   a variant that mode can show, and the harmonic-minor V only appears in a
   minor key.

The snapshot lives in `js/tests.js`. If a change is *meant* to alter the
shapes, regenerate it deliberately rather than editing it to match.

The second group needs a page. `js/tests-fretboard.js`, `js/tests-ear.js` and
`js/tests-practice.js` each build the controls their tab binds to — the module
only ever asks for ids, so that's all a fixture owes it — and then press the
buttons. That's the only way to catch a class of bug the pure tests can't
see: the ear trainer once built its answer buttons from one list and chose the
question from another, the two labelled their answers differently, and every
press came back "not that one" in all three note drills at once while the
score counted misses. Nothing about it is wrong in isolation. Pressing every
button and finding that exactly one is accepted is what sees it.

A suite that throws is reported as a failure rather than taking the page down
with it — a page with no results says less than a red line does, least of all
when what threw is the thing the suite was written to catch.

## Sound

Most of it is synthesized live in the Web Audio API — no MIDI, no plugins,
nothing to install — and the two voices you hear most are recordings of real
instruments, with the synthesized ones behind them for any page that can't
reach the files.

Every piano note in the app is a Kawai upright, recorded in a living room and
released CC0 (see below). Sixty-six samples in two velocity layers — a hard strike and a soft one,
which is the difference between a piano and a piano-shaped noise repeated.
The layers are two different strikes rather than one strike at two volumes,
so choosing between them at a threshold made a bar of quarter notes
alternate between two instruments: velocities near the split play both, with
equal-power gains a quarter-turn of sine apart, and the sound moves from one
to the other instead of jumping. (The obvious square-root pair holds the
power just as well, but arrives with infinite slope — it moves the lurch to
a quieter velocity rather than removing it, which a test now catches.) Where a note
falls between samples it is the nearest one moved, by a semitone in the soft
layer and no more than three in the hard one. The synthesized piano still
stands behind it — a single periodic wave (five harmonics baked into one
oscillator, doubled and detuned a few cents) through a per-note lowpass that
opens with velocity and closes as the note rings, a two-stage decay so a note
drops quickly then sustains quietly, a few milliseconds of filtered noise on
the front for the hammer, and a level that eases off up the keyboard the way
a real piano's does — and its level was matched to the recordings by
measurement, so nothing jumps when the samples finish arriving.
There's a reverb too — a convolver fed by a synthesized room, decaying noise
whose top end rolls off over the tail — with a send from each voice at its
own level. Drums are the classic recipes: a pitched-down
sine for the kick, filtered white noise for the snare and cymbals. The bass
under a progression is the recorded double bass (see below); the synthesized
one it replaced — a triangle wave through a lowpass at 850 Hz — is still what
plays when the recordings can't be reached, and the two were levelled against
each other by measurement.

Where the bass sits is chosen the way a player chooses it. Every root used to
be taken in one octave, so how far it sat from the bottom of the instrument
depended on the key — a C at MIDI 36, a B at 47 — and anything built on the
root climbed from there, which put a boogie figure in B up at A3. A player
takes the lowest root they have: roots from E up take the low octave and C,
C♯, D and D♯ take the one above, so every root lands inside E1–D♯2 whatever
the key. The walking line's third is in position rather than an octave up.
Across every style, variant, root and next chord, the bass now spans D♯1–D♯3,
and only the punk and disco octave figures reach the top of that. Every bus
meets at one gentle limiter before the
output, so a kick, a bass note and a full chord landing together can't add
up past what the output can carry. The style voices play a chord's own
seventh when it has one (a `D7` set on the ii is a real dominant) and only
fall back to the style's implied seventh for a plain triad. A voicing is
built upward from its lowest note, so where it ends up depends on the key —
the rootless jazz shape sat E4–C5 in C and climbed to A♭5 in A♭, singing out
over everything else in the sharp keys. Each 7th voicing is now moved by
whole octaves until it settles about A3, give or take a half-octave: the
grip and the spacing are untouched, only the register moves, which is what a
player does when a voicing lands too high. Notes are
scheduled against the audio clock by a 25 ms lookahead loop, so timing
doesn't drift when the main thread is busy.

**The engine sleeps when nothing is sounding.** A running AudioContext
renders its graph whether or not anything is audible — 375 blocks a second at
48 kHz, through a limiter and a reverb convolver that are wired up
permanently — and it keeps doing that for as long as the tab is open. On iOS
a live audio session keeps the page resident besides, so a tab left open
overnight goes on costing battery hours after the last note. So the context is
suspended once the sound has stopped and stayed stopped, and woken by the
next note — ten seconds on a page you're looking at, one second on a hidden
one, and at once for a page being put away (`pagehide`, which iOS sends when
the screen locks even where it skips `visibilitychange`).

Both windows are measured from when the last voice *stops*, not from when it
started, which is what lets them be that short. Measured from the start you
would have to wait out the worst case — a whole-note chord at 40 BPM rings
for 6.06 seconds — or you would freeze a note mid-decay and thaw it, still
sounding, whenever the engine next woke. Every voice here is stopped
explicitly, so the engine watches the `stop` calls rather than asking each
caller to report, and a voice added later is counted without anyone
remembering to count it. Ten seconds on a visible page isn't about the
battery, which is settled either way: it's so the engine doesn't cycle
between two clicks in the chord finder or two questions in the ear trainer,
since waking costs a few milliseconds here and an audio session transition
is not free on a phone. It never sleeps while something
is playing — that rule is a pure function with a test on it, because the
worst version of this is an engine that stops in the middle of a
progression. Stop means stop: a note still
queued never sounds, and one already sounding is taken away over 60 ms rather
than left to ring — which was fine when every voice was synthesized and fell
away by itself, and is not when a recorded piano rings for seconds. What
carries on after is the reverb, decaying the way a room does.

Wherever a guitar rings undistorted it is a **real guitar**: fifteen notes of
a 2017 Martin HD-28 recorded by Jeff Learman and released CC0, one sample
every two or three semitones with the notes between reached by pitching the
nearest one. That is the chord finder, the reverse finder, the ear trainer,
the practice tab's guitar voice and its suggested parts. The samples sit in `audio/guitar/`, and `audio/guitar/SOURCE.md` records where they came from
and why we believe we may use them, along with two libraries that were
rejected and the reason — the Philharmonia's, whose terms forbid making the
samples available as-is, which is what a public repository does; and VCSL,
which is genuinely CC0 but has no guitar in it.

Two more CC0 sets sit beside them, recorded for the FreePats project and
taken whole rather than in the slice we need. The piano (`audio/piano/`, a
Kawai upright, 66 samples in two velocity layers) is the one every piano note
in the app now comes from. What gets fetched is the range the app can
actually reach, C3 to G♯5 — every chord it can build, voiced every way its
styles voice them, lands inside that — which is 25 of the 66 files, 10.6 MB
to fetch and about 42 MB once decoded. The whole keyboard would be 33 MB to
fetch, which is nothing much, and 125 MB decoded, which is not: Web Audio
holds a buffer as 32-bit floats, four times the size of the file, and this is
325 seconds of piano. Warming per chord instead would save a few megabytes
and leave a hole wherever a style voiced somewhere the warm didn't look —
which it did, and the jazz comp came out synthesized over sampled everything
else until a test was written to catch it. Each folder's `SOURCE.md` records who recorded them, where the CC0
dedication is stated, and what the set does and doesn't cover.

The bass is a **1958 Otto Rubner double bass**, played pizzicato by D.
Smolken, who dedicated his own recordings to the public domain — the CC0
licence in that repository was committed by him, with the message "Swapping
to CC0". It sits in `audio/bass/`: eleven pitches from C1 to A3 in three
velocity bands, the bands split where the upstream `.sfz` splits them rather
than where the file names suggest, which is a real distinction — a band holds
files whose names say `_pa`, `_ma` and `_fa`, because pitches recorded at two
dynamics borrow from a third. Getting that wrong put a forte B1 beside a
piano A2, seventeen decibels apart, in the audition that picked this
instrument.

A double bass stops, though, and this one's highest recorded note is an A3.
A walking line's "third, up an octave" reaches D♯4 in the keys of A, A♯ and
B — six semitones above anything played. Those notes drop an octave instead
of being stretched, which is what a player would do rather than climb to the
end of the fingerboard for a passing note, and it happens whichever voice is
playing so the line is the same line either way.

The recordings are a bonus rather than a requirement. Each sample is fetched the first
time a note needs it (about 30 ms on a local server, nothing after that), and
when it can't be fetched the synthesized piano plays instead and says nothing
about it. That matters for one case in particular: opened straight from disk
as a `file://` URL, a browser gives the page an opaque origin and won't let
it read its own neighbours — Firefox and Chrome both closed that door after
[CVE-2019-11730](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp)
— so the recordings are for pages served over http, and double-clicking
`index.html` still works, just synthesized. The practice tab can use them
too, under Voice, and falls back the same way: the piano is what you get
until the samples are resident, and all that happens on a page that can't
reach them is that the fallback is permanent. Its drums stay synthesized.

That loop queues the notes 0.4 s ahead of the sound, and steps over any beat
whose moment has already passed. Both matter for the same reason: a browser
throttles the timers of a page that isn't focused, to a second or more, and a
beat handed to the audio clock late doesn't play late — every note of it
starts at the same instant, which is heard as a burst of pops rather than
music. Stepping over the missed beats makes a stall a slip in the
progression instead, the way a metronome carries on while you look away. The
cushion costs nothing at the transport, because stopping calls off the notes
still queued; the ones already sounding are left to ring out. The counting
and the calling-off both live in `audio.js`, beside the clock.

Two things keep a practice session alive on a phone propped up on a music
stand. The screen is held awake while something is playing — and only while
it's playing, since a lock left on would keep the screen lit for as long as
the tab is open. The browser takes the lock back whenever the tab is hidden,
so returning to it asks for a new one. And the page declares itself as
`playback` audio, which is what lets an iPhone with the ringer switch on
silent play out loud, the same as a music app would; without it you set the
phone down, work through a progression and hear nothing, with no clue why.
Both are asked for behind a feature check and both are allowed to fail — a
browser without them is a browser where the problem didn't arise.

## Code layout

`index.html` is markup and styles only; the JavaScript lives in `js/`, split
by what each part does:

| File | Responsibility |
| --- | --- |
| `theory.js` | Keys, scale degrees, chord formulas, chord naming, chord identification. Pure — no DOM, no audio, no app state. |
| `fretboard.js` | Tuning, CAGED and pentatonic shape templates, the maths that places them on the neck, CAGED shape matching, and the two pieces of box drawing every view shares — `boxColouredNotes`, which colours a note by the box that owns it, and `gripOutlines`, which traces the chord shape underneath. Also pure. |
| `neck.js` | Draws a full 15-fret neck as SVG from markers and shape outlines — shared by the practice fretboard, the chord finder's CAGED overview and the reverse finder, so all three necks are one drawing. A fret is close to twice as wide as the gap between two strings, near enough the shape of the real thing to read a grip off, and a note sits close up behind its fret wire where the finger goes rather than in the middle of the gap; the inlays and the fret numbers stay centred, since that's where they are on a guitar. The label and the dot are sized against each other: a single character is set as large as the dot will hold without running into a root's ring, and a longer one ("♭3") a size down so it fits — which is what lets the dots be small enough for the strings to sit that close together. A full neck is wide, so it wants most of a laptop's width — hence the wider cap on how large the drawing may render. |
| `progressions.js` | The preset progressions, written as scale degrees. Pure data. |
| `tab.js` | Draws guitar tablature from a note list. |
| `parts-guide-data.js` | What the parts page says about each style and part: progression, tempo, what the rhythm and notes are made of, where the idiom comes from. Pure data. |
| `parts-guide.js` | The parts page (`parts.html`): every part written out and playable, in any reading. Has a small player of its own. |
| `js/styles-base.js` | The band patterns the app started with: the base `STYLES`, one entry per style with its feels. |
| `js/styles.js` | Resolves what the app plays: the proposals merged over the base patterns, parts and guide at load (`GT.styles`), with the base kept for the review page. |
| `js/band.js` | The band one slot at a time — kit, comp, bass, the approach and the push on the last eighth, the fill on the last bar, stop-time — used by the practice tab, the parts page and the review page alike. |
| `docs/STYLES.md` | The method behind the styles: where the data lives, the rule about sources, how a part is written and placed, the register, double stops, the thumb, the band, checking, adding a style. Read before changing a style. |
| `docs/STYLES-CATALOGUE.md` | What the research found, per genre and part; generated by `tools/styles-doc.js`. |
| `tools/` | `sweep.js` realises every part every way and reports rule breaks; `reach.js` prints what each key's box holds; `styles-doc.js` writes the catalogue. |
| `CLAUDE.md` | What an agent working here has to know first. |
| `review/review.js` | The style review page (`review.html`): existing beside proposed, playable, with decisions. Its own player and realiser, a superset of the app's for the proposed features. |
| `review/proposals*.js` | The proposals: revised bands and parts per existing style, new styles, the engine list. Data plus the parts, written with the same helpers parts.js uses and a few more. |
| `review/proposals-easy.js` | Easy mode's hand-written parts: the beginner's form of a part where the page's simplifying rule can't find it. |
| `audio.js` | The Web Audio synth voices (piano, bass, drums) and the per-style groove patterns. Owns the `AudioContext` and the queue both players schedule into — how far a stall has put a cursor behind the clock, and calling off notes that haven't sounded — but knows nothing about the UI. |
| `fretboard-view.js` | The practice tab's fretboard panel: the six views, the legend, the hover spotlight, the follow-playback highlighting. |
| `practice.js` | The practice tab: progression generation, the chord display and settings, and the playback transport. |
| `stage.js` | The practice tab's chrome: the style picker, the popover menus, the phone's controls toggle, the progression name in the chart head, the beat line, the draggable position window, and the site menu. Reads what the other modules draw; keeps no state. |
| `chord-finder.js` | Chord finder tab: voicing search, fingering, chord diagrams. |
| `reverse-finder.js` | Reverse chord finder tab: click targets over the shared neck, and the name lookup. |
| `ear-training.js` | Ear training tab: what's on the neck — a chord shape, a pentatonic box or a scale box — and the drill over its notes. Draws and sounds chords from the chord finder's own code and boxes from the practice tab's, so no tab can drift from another. |
| `tooltips.js` | The (i) info bubbles. |
| `tabs.js` | Tab switching, plus the URL fragment and page title that go with each tab — including `setState`, which lets a tab write its own state after the slug so an exercise can be bookmarked. |
| `main.js` | Boots each tab and wires the header together. |
| `tests.js` | The regression tests, run by `tests.html`. |
| `tests-ear.js` | The ear trainer's drill, pressed rather than reasoned about: builds the controls it binds to, then answers questions. Loads before `ear-training.js`. |
| `tests-fretboard.js` | What the fretboard draws: builds the controls the view binds to, then checks the shapes it renders. Loads before `fretboard-view.js`. |

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
