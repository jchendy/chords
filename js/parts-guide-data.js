// What the parts guide says about each style and each part: the progression
// it is shown over, the tempo, what the rhythm and the note choices are made
// of, and the players and records that define the idiom the part is written
// from. Those names are reference points for the STYLE — where its weight
// falls, which strings carry it, which notes it leans on — and never a
// source of lines: no part here is a transcription, or a paraphrase of one.
// See the top of parts.js.
//
// A progression is six bars, written as chord names one bar each, so a part
// shows its figure, both variants and all three fills over harmony that
// makes sense for the style: [figure, fill 1, variant 1, fill 2, variant 2,
// fill 3]. `tempo` is what the style is usually played at.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const GUIDE = {
    simple: {
      feel: 'Simple',
      progression: ['C', 'F', 'G', 'C', 'F', 'G'], key: 'C', tempo: 96,
      about: 'The plainest backing there is — the chord on every beat — and the plainest thing to play over it: the chord struck whole on one, and a run through part of the scale for the rest of the bar. A chord only ever on the first beat, since the backing is already a chord a beat.',
      influences: 'Nobody in particular: this is what a method book has you play in week two, and it is here so the machinery can be heard bare. The reading decides everything — in Chords the run thins to chord tones, in Scales it is the scale.',
      parts: {
        'Quarter-note run': 'A chord, then three quarter notes stepping through the scale. The fills go on up, or come down from the octave and step onto the next chord’s root or 5th.',
        'Eighth-note run': 'The same idea at twice the speed: a chord, then six eighths. One fill hammers the 4th onto the 5th; another turns round the root and walks to the next chord.',
      },
    },
    blues: {
      feel: 'Blues shuffle',
      progression: ['A7', 'A7', 'D7', 'D7', 'A7', 'E7'], key: 'A', tempo: 112,
      about: 'A shuffle: three to the beat, down on the first, up on the third. The rhythm guitar lives on the low strings — a boogie is the bottom two or three strings, not a barre chord — with the downbeats leaning harder. The lines are a handful of notes said more than once: the root, the ♭3 leaning on the 3, the 4th, the 5th, the ♭7, with room in the bar, and the last beat pointing at the next chord — the ♭7 falling to the IV’s 3rd, or a chromatic step up under the root that’s coming.',
      influences: 'The Chicago shuffle of Jimmy Reed and Muddy Waters’ bands (Jimmy Rogers, Eddie Taylor) for the low-string comp; Freddie King and Magic Sam for the stabs-and-licks way of playing rhythm and lead at once; the ♭3-to-3 hammer and the 4-to-5 bend are the vocabulary every one of them shares.',
      parts: {
        'Shuffle comp': 'Eight strums a bar on the bottom three strings, the ones on the beat heavier. Variants walk the last beat up to the octave, or open the chord out on one. The fills: the ♭3 hammered into the 3rd; the 4th bent a whole tone to the 5th; half a bar of chords and the ♭7 falling to the next chord’s 3rd.',
        'Stabs and licks': 'Chords on one and three, on the top strings, single notes leading into them. A fill that breathes — root, ♭3-to-3, the 5th held; one that rocks the ♭7 against the 5th; one with a bend from the 4th.',
      },
    },
    'blues/Slow blues': {
      feel: 'Slow blues',
      progression: ['A7', 'D7', 'A7', 'A7', 'E7', 'D7'], key: 'A', tempo: 66,
      about: '12/8 and sparse: one idea a bar. A chord let ring, a note leaned on (a bend, here a semitone) and left alone, the answer coming late. The bass has the space and the guitar answers it.',
      influences: 'B.B. King (“The Thrill Is Gone”) for the single held note and the space round it; Albert King for leaning on the ♭3; T-Bone Walker’s chord-then-answer way of comping under a singer.',
      parts: {
        'Long chords': 'The whole chord let ring on one, the top of it again on three, a short line at the end. Fills: the ♭3 bent up against the chord and resolved late; the ♭7 answered by the 5th; one note — the 5th — for six beats.',
        'Answering the bass': 'The root alone on one, then a phrase in the space the bass leaves, the top of the chord on three. Fills: the octave down to the ♭7 and sat on; a slide from the 4th into the 5th; the root said twice.',
      },
    },
    'blues/Jump blues': {
      feel: 'Jump blues',
      progression: ['Bb7', 'Bb7', 'Eb7', 'Eb7', 'Bb7', 'F7'], key: 'Bb', tempo: 160,
      about: 'Straight eighths, the boogie figure with its corners squared off, a hard backbeat. The comp is two stabs a bar on 2 and 4, on the top strings, with a light upstroke after each; the lines are the boogie walk — root, 3, 5, 6, ♭7 — and the ♭3 pushed into the 3.',
      influences: 'T-Bone Walker and Louis Jordan’s Tympany Five for the backbeat stabs; Bill Doggett, Big Joe Turner’s bands and early Chuck Berry for the boogie walk on the guitar.',
      parts: {
        'Jump comp': 'Backbeat stabs with lighter upstrokes. Variants put the root under one and three, or push the second stab early. Fills: the boogie walk up and down; the ♭3-to-3 hammer twice and a chromatic walk to the next chord; the 5th said three times.',
        'Riff and stab': 'A riff on the way to each stab: 5-6 into the chord on two, ♭7-6 into the chord on four. Fills come off the top of the boogie — octave, ♭7, 5 — and the last walks up chromatically.',
      },
    },
    rock: {
      feel: 'Rock',
      progression: ['A', 'D', 'E', 'A', 'D', 'E'], key: 'A', tempo: 120,
      about: 'Straight eighths with the weight on 1 and 3, the chord kept low so it sits with the bass. Rock lines are the minor pentatonic said plainly — the root, ♭7, 5 and 4, in that order of how often — a note repeated rather than a scale run, and the last beat walking up to the next chord’s root from the ♭7 or a tone below. The 4th bent to the 5th is the sound.',
      influences: 'Chuck Berry for eighth-note drive on the low strings; Malcolm Young (AC/DC) for the chord-per-quarter with air in it and the stabs on the and; Keith Richards for the two-string rhythm figure; Tom Petty and Mike Campbell for the fills that repeat a note rather than run.',
      parts: {
        'Driving eighths': 'Eight low strums, 1 and 3 heavier. One variant opens the chord on one and leads out on the root alone; the other holds the chord on 1 and 3 and chugs between. Fills: root-root-♭7-5 and the walk up; a bend from the 4th to the 5th; the octave hammered and the chord back on three.',
        'Stabs on the and': 'The chord on one, the and of two, and four — where the kick lands. Fills: the root and ♭3 hammered onto the 4th, twice; a stab and the ♭7 falling; the 5th, ♭7 and octave held.',
      },
    },
    'rock/Straight rock': {
      feel: 'Straight rock',
      progression: ['E', 'A', 'D', 'A', 'E', 'B'], key: 'E', tempo: 132,
      about: 'Busier than Rock: every eighth on the low strings, the whole chord on 1 and 3 — the chug rock rhythm guitar is built on — and riffs in the gaps, out of the same minor pentatonic.',
      influences: 'The Ramones and early AC/DC for the eighth-note chug; Free (Paul Kossoff) and Bad Company for the chords-and-a-riff trade; Deep Purple for the low riff.',
      parts: {
        'Eighth-note chug': 'Eight strums, the chord opened out on 1 and 3, the rest low. Fills: root-root-♭3 hammered to 4, then 5-4-♭3; chugging then octave-♭7-5; 5-♭7-octave-octave.',
        'Chords and a riff': 'Half a bar of chords, half a bar of riff — root, ♭3, 4, 5. A variant puts the riff first. Fills rock the octave against the ♭7, or bend the 4th up between chugs.',
      },
    },
    'rock/Half-time rock': {
      feel: 'Half-time rock',
      progression: ['E', 'G', 'A', 'E', 'G', 'D'], key: 'E', tempo: 84,
      about: 'The snare on 3 alone under sustained chords. Space is the point: the chord held long, the riff slow and low, a note said twice rather than moved.',
      influences: 'Led Zeppelin (“When the Levee Breaks”) and Black Sabbath for the held power chord and the slow low riff; Queens of the Stone Age for the modern version.',
      parts: {
        'Big chords': 'Two chords a bar, held. Variants add a low chug before three, or two light upstrokes after one. Fills: the root held, a slide ♭3-to-4, the 5th held; the chord for half a bar then octave-♭7-5; three notes in a bar.',
        'Low riff': 'Root, root, ♭3, 4 / chord / 5, 4 — on the bottom strings. Fills: the octave twice and down; two big chords; the root held and the ♭3 hammered to the 4th.',
      },
    },
    rockabilly: {
      feel: 'Rockabilly',
      progression: ['E', 'E', 'A', 'A', 'B7', 'E'], key: 'E', tempo: 176,
      about: 'Swung and quick. The rhythm is boom-chick — the bass note on the beat, the chord on the top strings on the and — and the lines are the major side of the boogie: root, 3, 5, 6 and the ♭7, the ♭3 pushed into the 3, walked up and down the low strings and walked chromatically into the next chord. Double stops in 6ths.',
      influences: 'Scotty Moore (with Elvis, 1954–56) for the boom-chick with fills between; Carl Perkins for the ♭3-to-3 and the 6ths; Cliff Gallup (Gene Vincent) for the walking boogie; Brian Setzer for the modern version of all three.',
      parts: {
        'Boom-chick': 'Bass note, chord, bass note, chord — swung. One variant hits the chord harder on 2 and 4; the other walks the bass root-3-5-6 under the chords. Fills: the boogie up and a chromatic walk into the next chord; ♭3-to-3 hammered twice and a 6th; half a bar of boom-chick and the boogie down.',
        'Walking boogie': 'Root, 3, 5, 6 on the low strings, each note doubled. Fills: the octave rocked against the ♭7 and the next root from a semitone below; a chord then ♭3-to-3, 5, 6; the root said and said.',
      },
    },
    psychobilly: {
      feel: 'Psychobilly',
      progression: ['E', 'E', 'A', 'E', 'B', 'A'], key: 'E', tempo: 190,
      about: 'Straight and faster, on the low strings: chugged eighths with the accents on the beat, minor-pentatonic riffs — root, ♭3, 4, 5, ♭7, the ♭5 as a passing tone — and chromatic walks up and down into the next chord, which is most of what the bass is doing too.',
      influences: 'The Cramps (Poison Ivy) for the low chug; The Meteors and Reverend Horton Heat (Jim Heath) for the fast riffing and the slides; Stray Cats at their hardest for the walk-ups.',
      parts: {
        'Chug and stab': 'Eight low chugs, accents on the beat. Variants put stabs on the and of 2 and 4, or the root alone under 1 and 3. Fills: the riff root-root-♭3-4-♭5-4-♭3; chugging then octave-♭7-5; the ♭7 hammered and a chromatic walk down.',
        'Low riff': 'Root, root, ♭3, root / 4, ♭3, root, ♭7. Fills: a bar of chugs; a slide from the ♭7 up to the octave and down the pentatonic; the root pounded and the chord on three.',
      },
    },
    surf: {
      feel: 'Surf rock',
      progression: ['Am', 'Am', 'Dm', 'Dm', 'E', 'Am'], key: 'A', tempo: 168,
      about: 'Straight, picked hard and dry: eighth notes on the low root, the chord stabbed short on 2 and 4, and runs that fall — the minor pentatonic with the 6th and the ♭2 that surf borrowed from the Mediterranean — landing on the next chord from a semitone above. Pull-offs, and a slide down from the top.',
      influences: 'Dick Dale (“Misirlou”) for the picked low string and the ♭2; The Ventures (“Walk Don’t Run”) and The Shadows for the clean falling runs; The Chantays (“Pipeline”) for the slide down.',
      parts: {
        'Low-string pulse': 'Eighth notes on the root with the chord stabbed on 2 and 4. Variants put the 5th under three, or leave the chord to four. Fills: a slide down from the top and the pentatonic falling with a pull-off; the ♭2 leaning on the root; a stab and a run up to the octave held.',
        'Stabs and runs': 'Two stabs, then a run down: 5, 4, ♭3, root. Fills: octave-6-5-4 with a pull-off; the low pulse for a bar; the ♭2 and ♭3 each resolved to the root.',
      },
    },
    country: {
      feel: 'Country',
      progression: ['G', 'C', 'G', 'D', 'C', 'G'], key: 'G', tempo: 116,
      about: 'Boom-chick: the root on one, the chord on two, the 5th on three, the chord on four — and a walk up the low strings into the next chord where the bass would do the same. The lines are the major pentatonic with the ♭3 hammered into the 3rd and the 2nd bent to it; the G-run shape (root, 2, ♭3-3, 5, 6, octave) is the idiom’s own. Double stops in 3rds and 6ths.',
      influences: 'Luther Perkins (Johnny Cash) for the boom-chick itself; Merle Travis and Chet Atkins for the alternating bass with the chord on top; James Burton and Albert Lee for the 2-to-3 bend and the 6ths; Brad Paisley for how all of it sounds now.',
      parts: {
        'Boom-chick': 'Root, chord, 5th, chord. Variants walk into the next chord on four, or add upstrokes. Fills: the G-run onto the next root; the 2nd bent to the 3rd twice; 3rds down the pentatonic to the next chord’s 5th.',
        'Walk and chank': 'A bass note, a chank, a three-note walk, the 5th. Fills: octave-6-5-3 and the walk down from above; a chank then ♭3-to-3 and the 5th held; 6ths down the neck.',
      },
    },
    bluegrass: {
      feel: 'Bluegrass',
      progression: ['G', 'G', 'C', 'G', 'D', 'G'], key: 'G', tempo: 150,
      about: 'Quick, and everything from the wrist: the root on one, the strum on two, the 5th on three, the strum on four, and the G-run — 2, ♭3-3, 5, 6, octave — every time a chord change comes, in eighths, landing on the next root. Hammer-ons from the 2nd and the ♭3.',
      influences: 'Lester Flatt for the G-run (it carries his name); Jimmy Martin and Del McCoury for bass-strum rhythm at speed; Doc Watson, Tony Rice and Clarence White for the runs between the changes.',
      parts: {
        'Bass strum bass strum': 'Root, strum, 5th, strum. Variants add an upstroke after each strum, or walk the bass up on the last beat. Fills: the G-run in eighths; the 2nd hammered to the 3rd, 5th, 6th and down; a bass note and strum then the run from the 5th.',
        'Runs': 'Root, 2, 3, 5 up to the 5th on three, a strum on four. Fills: the octave down with a pull-off; ♭3-to-3 and up to the octave held; a bar of bass-strum.',
      },
    },
    jazz: {
      feel: 'Swing',
      progression: ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7'], key: 'C', tempo: 132,
      about: 'Swung: three to the beat, the eighths on the first and third. Four-to-the-bar comping on the low three strings with 2 and 4 leaning, and the Charleston figure — one and the and of two — on the top. The lines put a chord tone on the beat, 3rd and 7th before anything, a passing or chromatic note between, and arrive on the next chord’s 3rd or root from a semitone away. Slides into the 3rd.',
      influences: 'Freddie Green (Count Basie Orchestra) for four to the bar on the low strings, the whole idea; Charlie Christian for lines that put the 3rd and 7th on the beat; Wes Montgomery and Grant Green for the enclosures round the next root; the Charleston figure is every pianist’s, from Red Garland to Wynton Kelly.',
      parts: {
        'Four to the bar': 'Four short chords on the low three strings, 2 and 4 heavier. Variants push a chord on the and of two, or open three and four out. Fills: 3rd-5th-7th up and a chromatic step onto the next 3rd; the 7th down the chord and the next root enclosed; two chords then 6-7-octave.',
        'Charleston comp': 'The chord on one and the and of two, on top. Variants anticipate — the ands of two and four — or the ands of one and three. Fills: up the chord to the octave; a chord then a slide from the 9th into the 3rd; a walking line on top in quarter notes.',
      },
    },
    'jazz/Bossa nova': {
      feel: 'Bossa nova',
      progression: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7', 'Fmaj7', 'E7'], key: 'C', tempo: 120,
      about: 'Straight, quiet: the thumb on one and three, the chord in the fingers on the syncopations between — the bossa’s own rhythm guitar — with lines out of the chord scale that move by step, land on chord tones, and slip into the next chord from a semitone away.',
      influences: 'João Gilberto for the thumb-and-fingers pattern, which he more or less invented; Antônio Carlos Jobim’s songs (“Girl from Ipanema”, “Corcovado”) for the harmony the lines move through; Luiz Bonfá and Baden Powell for the guitar’s melodic answers.',
      parts: {
        'Thumb and fingers': 'The root under one and three, the chord on the top strings on the syncopations. Variants push the chords onto the “e”, or hold fewer of them. Fills: 3-5-7-9 by step; the thumb then down from the 9th; the 6th slid into and held.',
        'Bass and answer': 'The root, a chord, the root, a chord — and a note answering at the end. Fills: down the chord scale with a slide into the 3rd; the thumb under a rising line; the 5th and 3rd held with the 9th to close.',
      },
    },
    gypsy: {
      feel: 'Gypsy jazz',
      progression: ['Am', 'Am', 'Dm', 'Dm', 'E7', 'Am'], key: 'A', tempo: 200,
      about: 'Swung and quick, no drums: la pompe — a short chord on every beat with a brushed lift into 2 and 4 — is the whole rhythm section, and the lines are arpeggios up and down the chord with the 6th, chromatic enclosures round the next chord’s root or 3rd, and a chromatic hammer-on into the 5th.',
      influences: 'Django Reinhardt (“Minor Swing”, “Minor Blues”) for the arpeggio-with-the-6th lines; Joseph Reinhardt and the Quintette’s rhythm guitars for la pompe; Stochelo Rosenberg and Biréli Lagrène for how the enclosures sound played today.',
      parts: {
        'La pompe': 'The four beats, the lift into 2 and 4. Variants leave the lifts out, or put a bass note under one and three. Fills: up the arpeggio with the next root enclosed; two beats of pompe then down the arpeggio; the 6th to the 5th twice and the octave held.',
        'Pompe and arpeggio': 'Two beats of pompe, then the arpeggio in triplets. Fills: the 6th enclosing the 5th with a chromatic hammer-on; a bar of pompe; up in triplets and the next chord’s 3rd.',
      },
    },
    ballad: {
      feel: '6/8 ballad',
      progression: ['C', 'Am', 'F', 'G', 'C', 'G'], key: 'C', tempo: 60,
      about: 'Twelve to the bar, slow: the chord broken across the beat — root, 5th, octave, 3rd — with the whole chord on one, and lines that are melodies: chord tones held, a slide into the 3rd, the 2nd hammered to it, a step into the next chord’s root or 3rd.',
      influences: '“Unchained Melody”, “When a Man Loves a Woman” and “House of the Rising Sun” for the broken chord in twelve; The Everly Brothers and early Elvis ballads for the chord-and-answer; the 6ths are from the same country and soul players the other pages name.',
      parts: {
        'Broken chord': 'The chord on one, then the chord broken across the twelve. Variants break the whole bar, or put the chord on one and three. Fills: the 3rd slid into and held; the chord then octave-7-6; the 2nd hammered to the 3rd and held.',
        'Chord and answer': 'The whole chord for two beats, two notes answering. Fills: 5-6-octave and onto the next 3rd; the octave, 5th, and a slide into the 3rd; double stops — 6ths — held.',
      },
    },
    reggae: {
      feel: 'Reggae',
      progression: ['A', 'D', 'A', 'E', 'D', 'A'], key: 'A', tempo: 76,
      about: 'The guitar is the skank — the chord on every and, high, short — and nothing on the beat. What lines there are stay low and sparse: root, 5th and ♭7, a slide up into the root, a double stop on the skank, and room.',
      influences: 'The Wailers (Al Anderson, Junior Marvin, and Bob Marley’s own rhythm) for the skank; Ernest Ranglin for the guitar taking a bass-like line; Sly & Robbie’s one drop under all of it.',
      parts: {
        'Skank': 'The chord on every and, short. Variants double the skank into sixteenths, or put the root under one and three. Fills: a slide up into the root on three; 3rds on the skank; a low line in the gaps.',
        'Skank and bass line': 'Root and 5th on the beat, low, the skank on the ands. Fills: a bar of skank; the octave down to the root and the next root from below; a slide from the 4th into the 5th between skanks.',
      },
    },
    ska: {
      feel: 'Ska',
      progression: ['C', 'Am', 'F', 'G', 'C', 'G'], key: 'C', tempo: 168,
      about: 'Every and an upstroke, high and short, nothing on the beat; the guitar can also take the walking line the bass has — root, 3rd, 5th, 6th and back in eighths — and the fills are that walk carried chromatically into the next chord, or the octave hammered.',
      influences: 'The Skatalites (Jah Jerry) and Prince Buster for the original upstroke; The Specials (Lynval Golding) and Madness for the Two-Tone version; the walking line is the Skatalites’ bass, Lloyd Brevett, on the guitar.',
      parts: {
        'Upstrokes': 'Four upstrokes, one per and. Variants double up on two and four, or put the root under one. Fills: the walk root-3-5-6-octave and chromatically up; upstrokes then the octave hammered from the ♭7; a bar of upstrokes.',
        'Walking line': 'Root, 3, 5, 6, octave, 6, 5, 3 in eighths. Fills: a bar of upstrokes; the walk down and a chromatic step to the next root; a slide into the root and the walk up.',
      },
    },
    soul: {
      feel: 'Soul',
      progression: ['A', 'D', 'A', 'D', 'E', 'D'], key: 'A', tempo: 96,
      about: 'The pocket, and the guitar mostly staying out of it: 7th-chord shells on the top strings off the beat, double stops in 6ths and 3rds slid into and hammered into — the 2nd to the 3rd, the 4th to the 5th — a lick on the way to the next chord’s 3rd.',
      influences: 'Steve Cropper (Booker T. & the M.G.’s, Otis Redding) for the 6ths and the stabs off the beat; Curtis Mayfield for the hammered double stops; Cornell Dupree and Jimmy Johnson (Muscle Shoals) for the pocket line.',
      parts: {
        'Stabs and double stops': 'Shells off the beat with 6ths on three. Fills: the 2nd hammered to the 3rd over the root; 6ths slid into, down the neck; a stab and the 4th hammered to the 5th.',
        'Pocket line': 'Root, ♭7, octave, 5th in the pocket with a stab to close. Fills: a bar of stabs; octave-♭7-5-3 and the root held; a slide into the 3rd, a 6th, the 4th hammered to the 5th.',
      },
    },
    pop: {
      feel: 'Pop',
      progression: ['C', 'G', 'Am', 'F', 'C', 'G'], key: 'C', tempo: 116,
      about: 'Straight, the chord doing most of the work: the down-down-up-up-down-up strum with the ups on the top strings, broken chords out of the root, 3rd, 5th and octave, and lines that are melodies — chord tones held, the 9th and 6th as colour, a step into the next chord’s root or 3rd rather than a chromatic slide.',
      influences: 'The down-down-up-up-down-up strum is the acoustic pop pattern of the last thirty years, from Oasis to Ed Sheeran; the broken chord is every ballad from “Everybody Hurts” to Coldplay; the melodic fills are what a second guitar adds on a record.',
      parts: {
        'Down down up up down up': 'The strum, with the ups on the top strings. Variants strum every eighth, or put the root under one. Fills: the chord broken up and back; half the pattern then octave-6-5; a melody a beat.',
        'Broken chord and strum': 'The chord broken across the first half, strummed in the second. Fills: the octave twice and down; up the chord to the 9th; two chords and a pull-off from the 6th.',
      },
    },
    funk: {
      feel: 'Classic funk',
      progression: ['E7', 'E7', 'E7', 'A7', 'E7', 'B7'], key: 'E', tempo: 104,
      about: 'Sixteenths, short, with rests: the hit on one and the chops on the top strings in the gaps the drums leave, and single-note lines that are mostly the root and the octave with the ♭7 and ♭3 for flavour — said in syncopated bursts, not runs — sliding into the next chord from a semitone below. Double stops in 4ths.',
      influences: 'Jimmy Nolen (James Brown) for the chicken-scratch chop and the hit on the One; Phelps “Catfish” Collins (Bootsy’s brother, James Brown’s other guitarist in 1970) for the single-note lines; Nile Rodgers and Leo Nocentelli (The Meters) for the 4ths.',
      parts: {
        'The one and the chops': 'The hit on one, chops in the gaps. Variants open the one out, or fill the e and a. Fills: root and octave in bursts; the hit then 4ths stabbed; octaves and a chop.',
        'Single-note groove': 'Root, ♭7, octave, root, 5th, ♭7, octave, ♭7 in sixteenths. Fills: a bar of chops; octave-♭7-5-♭3-root and the next root from below; a slide into the root and up in bursts.',
      },
    },
    'funk/Disco': {
      feel: 'Disco',
      progression: ['Am7', 'Dm7', 'Am7', 'Em7', 'Dm7', 'Am7'], key: 'A', tempo: 118,
      about: 'Four on the floor under it, the guitar on the off-beats: short chops on the top strings on the ands, and the octave line disco bass and guitar share — root and octave, with the ♭7 and 5th as the way from one chord to the next.',
      influences: 'Nile Rodgers (Chic, “Le Freak”, “Good Times”) for the off-beat chop, the definition of it; Al McKay (Earth, Wind & Fire) for the sixteenth pickups; the octave line is Bernard Edwards’ bass on the guitar.',
      parts: {
        'Off-beat chops': 'A chop on every and. Variants add sixteenth pickups, or the one as well. Fills: the octave line; two chops then 5-♭7-octave; root and octave in a burst.',
        'Octave riff': 'Root, octave, root, octave, then 5 and ♭7. Fills: a bar of chops; a slide up to the octave and down; the root in a burst and two chops.',
      },
    },
    metal: {
      feel: 'Metal',
      progression: ['E', 'E', 'G', 'A', 'E', 'F'], key: 'E', tempo: 150,
      about: 'Palm-muted: the root chugged on the low strings in eighths and in the gallop, opened up on the accents; the riffs out of the minor pentatonic with the ♭2 and the ♭5, chromatic, low; pull-offs and slides. The ♭2 chord (F over E) is the idiom’s.',
      influences: 'James Hetfield (Metallica) for the palm-muted gallop and the down-picked eighths; Steve Harris’ and Iron Maiden’s gallop; Tony Iommi (Black Sabbath) for the ♭5 and the riff that opens up on the accent.',
      parts: {
        'Gallop chug': 'Muted low strums in the gallop — long, short, short. Variants go to straight eighths with the one open, or let the chord ring on one. Fills: root-root-♭2-root / ♭3-♭5-4-♭3; chugs then a pull-off and a slide up to the octave; the root pounded and the ♭5 hammered to the 5th.',
        'Chug and riff': 'Muted root eighths, then ♭3-4-♭5-5. Fills: a bar of chugs; the octave with a pull-off to the 5th and down chromatically; a slide into the root and the chord opened on three.',
      },
    },
  };

  GT.partsGuide = { GUIDE };
})();
