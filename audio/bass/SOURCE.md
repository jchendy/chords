# Where these recordings came from

Thirty-one samples of a 1958 Otto Rubner double bass, played pizzicato:
eleven pitches from C1 up to A3 — roughly every three or four semitones —
in three velocity bands, mono, 44.1 kHz, 32-bit float WAV.

`d_smolken_rubner_bass_pizz.sfz` is the mapping as published and is the thing
to read, not the file names. The bands are split at MIDI velocity 74 and 120,
and they are **not** sampled alike: where a pitch was recorded at only two
dynamics the `.sfz` fills the third band with a sample from another one, so a
band contains files whose names end `_pa`, `_ma` and `_fa` together. Reading
the dynamic out of a file name instead of out of the `.sfz` is what put a
forte B1 next to a piano A2 in the audition that chose this instrument —
seventeen decibels apart, on notes ten semitones apart.

## What was left upstream, and why

The library holds four round robins of every sample and an arco set as well;
this is the first round robin of the pizzicato, which is 30 MB against 141 MB
for the whole pizz folder. Round robins vary the attack when the same note is
struck twice running, which a walking line rarely does — one note per beat,
and rarely the same one twice. If a style ever wants them, they are one fetch
away and the `.sfz` already names them.

## Where it stops

The highest note recorded is **A3**, and the map stretches it to C4. A
walking line's "third, up an octave" figure reaches a D♯4 in the keys of A,
A♯ and B — six semitones above anything anyone played. So those notes are
dropped an octave instead, which is what a player would do rather than climb
to the end of the fingerboard for one passing note, and a test holds every
bass figure in every style to it.

- **Played, recorded and mapped by:** D. Smolken. Fifths tuning (CGDA),
  Thomastik-Infeld Spirocore strings.
- **Taken from:** <https://github.com/sfzinstruments/dsmolken.double-bass>.
- **Licence:** Creative Commons CC0 1.0 (public domain dedication). The full
  text is in `LICENSE.txt`, as it ships upstream.

## Why we believe we may use them

CC0 waives copyright as far as the law allows: no condition to meet, not even
attribution. We credit the player anyway.

The dedication was made by the copyright holder himself. `UPSTREAM-README.txt`
beside these files says "Copyright 2013 D. Smolken", and the `LICENSE` file in
that repository was committed **by D. Smolken** on 2022-11-04, with the commit
message "Swapping to CC0" — the same person, moving his own work into the
public domain, in the repository the samples come from. His GitHub account
(`DSmolken`) gives his company as Karoryfer Samples, whose libraries carry the
same dedication by the same hand.

That is the test T43 set and T49 applied, and it is exactly what the rejected
Killer Bass failed at the time: that one also said CC0, but the URL it named
as its source redirected to a shop, so there was nowhere to read the grant.
The Killer Bass turns out to be `karoryfer.fashionbass` in the same
collection, dedicated the same way on the same day — it was a contender here
and lost on tone, not on licence. Checked 2026-09-10.

One practical note: these are 32-bit float WAVs. `decodeAudioData` handles
them everywhere the app's other recordings work, and a browser that can't
throws, which the loader already treats as "no sample" — the synthesized bass
plays instead and says nothing about it.
