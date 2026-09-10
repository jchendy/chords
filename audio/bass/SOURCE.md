# Where these recordings came from

A Yamaha RBX bass guitar, sampled chromatically — every semitone from E1 to
D♯2, mono, 48 kHz FLAC — in two playing styles, `samples/finger/` and
`samples/pick/`. The two `.sfz` files are the mapping as published: E1 covers
down to D1, and the top sample carries the stretch above D♯2 — in the finger
set that is `D#.flac` reaching up to A2, and in the picked set a thirteenth
sample, `E2.flac`, reaching to A♯2.

That is the whole set as recorded — a bass's first octave. It ends at A2
(MIDI 45), and the practice tab's walking line, which reaches a third above
the root an octave up, can ask for notes as high as D♯4 (MIDI 63). Whatever
plays these will have to decide what to do about that: voice the high notes
an octave down, or leave them to the synth. Stretching a sample eighteen
semitones is not one of the options — it stops sounding like a bass.

- **Recorded by:** Andrea Biasior <reusenoise@gmail.com>, sent to FreePats in
  September 2019. Small edits for consistency with the rest of the FreePats
  banks by Roberto <roberto@zenvoid.org>.
- **Taken from:** <https://github.com/freepats/electric-bass-YR> (the FreePats
  project's own repository), also published at
  <https://freepats.zenvoid.org/ElectricGuitar/clean-electric-bass.html#BassYR>.
- **Licence:** Creative Commons CC0 1.0 (public domain dedication). The full
  text is in `LICENSE.txt` beside these files, as it ships upstream.

One practical note for whoever wires these up: the file names contain `#`,
which a URL reads as the start of a fragment, so a fetch has to encode it as
`%23`. They are FLAC, which `decodeAudioData` handles in current Chrome,
Firefox and Safari — measured here in Chromium at 30–50 ms a file — but a
browser that can't will throw, and the loader already treats a failed sample
as "no sample" and falls back to the synth.

## Why we believe we may use them

CC0 waives copyright as far as the law allows: nothing to ask, no condition
to meet, not even attribution. We credit the player anyway.

The dedication is recorded by the project that received the samples, naming
the person who made them and the terms he sent them under — on the FreePats
page:

> Sound samples created by Andrea Biasior <reusenoise@gmail.com> from a
> Yamaha RBX bass guitar. It was sent for inclusion in FreePats on September
> 2019, under the terms of the Creative Commons CC0 1.0 public domain
> dedication.

and again in `README.txt` in the repository the samples come from, copied
here as `UPSTREAM-README.txt`. The repository is tagged `CC0-1.0` and carries
the full legal text. Checked 2026-09-10.

This is the same standard T43 and T49 applied, and it is what the rejected
Killer Bass failed: that one also said CC0 in its header, but the URL it
named as the source now redirects to a shop, so there was no way to read the
grant where it was given. Here the grant sits in the giver's own hands —
FreePats received the files directly from the person who recorded them.
