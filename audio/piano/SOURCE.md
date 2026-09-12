# Where these recordings came from

Sixty-six samples of a Kawai upright piano, stereo, 48 kHz FLAC, in two
velocity layers split at MIDI velocity 80 — `vL` below, `vH` above.

The two layers are not sampled alike, and a reader that assumes they are will
ask for files that don't exist. The soft layer is thirty samples in minor
thirds, A / C / D♯ / F♯ in every octave from A0 to C8. The hard layer is
thirty-six: the same grid with a B added in most octaves, but missing `A2`
and `C4`. `UprightPianoKW-20220221.sfz` is the mapping as published — which
sample covers which keys, where each one loops, and the velocity split — and
it is the thing to follow rather than the file names.

The whole set is here, not the dozen notes the jam tab needs today, so
that widening the range later is a code change rather than another download.

- **Recorded by:** Gonzalo <humanogonzalo@gmail.com> and Roberto
  <roberto@zenvoid.org>, January 2017, on a Zoom H1 in a living room, at
  about the height a player's head would be. Edited and processed by Roberto.
  The piano was Inma Martínez de Miguel's, lent for the recording.
- **Taken from:** <https://github.com/freepats/upright-piano-KW> (the FreePats
  project's own repository), also published at
  <https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html#UprightKW>.
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
to meet, not even attribution. We name the people who made the recording
anyway, because it is their work and their neighbour's piano.

The dedication is made by the people who did the recording, and it is stated
in two places that both belong to them — the project's own web page:

> Published under the terms of the Creative Commons CC0 1.0 public domain
> dedication.

and `README.md` in the repository the samples come from, which is copied here
as `UPSTREAM-README.md` and says the same thing. This is the test T43 set and
T49 applied: the grant has to be readable where it was given, by the person
who had the right to give it. FreePats is that person's own project, and the
GitHub repository is tagged `CC0-1.0` besides. Checked 2026-09-10.

Three other free pianos were looked at and set aside, so nobody has to check
them again:

- **Salamander Grand Piano** (Yamaha C5, Alexander Holm) — the best-known
  free piano, and genuinely usable, but CC-BY 3.0 rather than CC0: it carries
  an attribution condition, and a subset of it is an adaptation that has to
  say so. 707 MB for the FLAC set. If we ever want a concert grand rather
  than a living-room upright, this is the one to come back to.
- **YDP Grand Piano** (Yamaha Disklavier, via the OLPC sample library) —
  also CC-BY 3.0, and only offered as a 36 MB SF2, which we would have to
  take apart before we could use a note of it.
- **VCSL's pianos** (Steinway B, two Kawais, two uprights) — CC0 like this
  one and worth remembering, but each is a folder of hundreds of samples in
  three articulations, which is a lot of repository for one voice.
