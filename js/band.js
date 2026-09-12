// The band, one slot at a time. A style's pattern says what the kit, the
// comp and the bass do on each slot of a bar; this schedules one slot of it,
// and the three players — the jam tab, the parts page, the review page
// — call it rather than each keeping a copy of the rules. The rules:
//
//   kick / snare / hat / ride / rim / ghost / hatOpen — slot lists; the hat
//     accents the beat, an open hat rings longer and a closed one chokes it,
//     a ghost is the snare barely, a rim is the stick on the rim
//   kickVel / snareVel, kickVels / snareVels — one level, or a level per slot
//   chord: [{ slot, dur, vel, stroke? }] — the comp; `stroke` ('down'/'up')
//     says which way the pick goes on the guitar voice, else the hand's
//     rule (parts.js strokeFor) decides from the slot; compAnticipate
//     strikes the NEXT chord on the last eighth of a bar before a change
//     (the "and of 4" push), as an upstroke, in place of any strike the
//     pattern has on that slot
//   bass: [{ slot, off | walk | next, dur, vel }] — the bass: an interval off
//     the root, a step of a walking line, or the next chord's root; with
//     bassApproach the last eighth before a change is a semitone below the
//     chord to come (a note is added there if the pattern has none)
//   fill: { kick, snare, hat } — what the kit plays instead on the last bar
//     of the form
//   swing — how far the second of each pair of sixteenths sits late, as a
//     share of a sixteenth (16-slot grids only)
//   beats — beats to the bar (four unless said; the waltzes are three)
//   slapback — the guitar part gets an echo (the players do that, not this)
//
// A stop-time bar (the part's realisation names them) is the band hitting
// the One and stopping: kick, comp and bass root on the first slot, nothing
// after, the guitar alone.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { SEMITONE } = GT.theory;

  const beatsOf = style => style.beats || 4;
  // the hat's two levels — on the beat and off it — named so the click and
  // the count-in can sit at the band's level rather than over it
  const HAT = { accent: 0.55, other: 0.32 };
  // the last eighth of the bar as a slot: 14 on sixteen, 11 on twelve (the
  // last triplet third), 8 on nine
  const lastEighth = style => Math.ceil(style.grid - style.grid / beatsOf(style) / 2);
  // (four slots a beat only: a twelve grid is already swung)
  const swingOffset = (style, slot, slotDur) =>
    (style.swing && style.grid / beatsOf(style) === 4 && slot % 2 === 1) ? style.swing * slotDur * 0.5 : 0;

  // One slot of the band. `at` is the slot's moment, already swung and
  // humanized by the caller; `ctx` says what the bar is:
  //   chord, next — this bar's chord and the next bar's
  //   changing — the next bar is another chord
  //   fillNow — this is the last bar of the form
  //   stopped — a stop-time bar
  //   voice — the comp's voice ('piano' | 'guitar')
  //   jit(amt) — a small random offset for velocities, or 0
  //   audio — the audio module (or a stand-in that records the calls)
  function scheduleSlot(style, slot, at, slotDur, ctx){
    const { chord, next, audio } = ctx;
    const jit = ctx.jit || (() => 0);
    const voice = ctx.voice || 'piano';
    const per = style.grid / beatsOf(style);
    const last = lastEighth(style);
    const vk = (style.kickVels && style.kickVels[slot]) || style.kickVel || 0.9;
    const vs = (style.snareVels && style.snareVels[slot]) || style.snareVel || 0.85;

    // which way the pick goes on the guitar voice: the pattern's own word
    // for the entry, else the hand's rule for the slot (parts.js); a bar
    // with comp strikes off the eighths is a hand moving in sixteenths
    const fine = per === 4 && (style.chord || []).some(e => e.slot % 2 === 1);
    const strokeAt = s => GT.parts.strokeFor(per, s, fine);
    if (ctx.stopped){
      if (slot === 0 && chord){
        if (style.kick && style.kick.length) audio.playKick(at, vk);
        if (style.chord && style.chord.length) audio.playStyleVoice(style.voice, chord, at, slotDur * 2, 0.7, voice, { stroke: 'down' });
        if (style.bass && style.bass.length) audio.playBass(audio.bassNote(SEMITONE[chord.note] % 12, 0), at, slotDur * 2, 0.9);
      }
      return;
    }

    if (ctx.fillNow && style.fill){
      if (style.fill.kick && style.fill.kick.includes(slot)) audio.playKick(at, vk);
      if (style.fill.snare && style.fill.snare.includes(slot)) audio.playSnare(at, 0.5 + 0.4 * (slot / style.grid));
      if (style.fill.hat && style.fill.hat.includes(slot)) audio.playHiHat(at, 0.5);
    } else {
      if (style.kick && style.kick.includes(slot)) audio.playKick(at, vk);
      if (style.snare && style.snare.includes(slot)) audio.playSnare(at, vs);
      if (style.ghost && style.ghost.includes(slot)) audio.playSnare(at, 0.22, 'ghost');
      if (style.rim && style.rim.includes(slot)) audio.playSnare(at, 0.3, 'rim');
      if (style.hat && style.hat.includes(slot)){
        const open = style.hatOpen && style.hatOpen.includes(slot);
        audio.playHiHat(at, slot % per === 0 ? HAT.accent : HAT.other, open ? 0.28 : 0.06);
      }
      if (style.ride && style.ride.includes(slot)) audio.playRide(at, slot % per === 0 ? 0.6 : 0.45);
    }

    if (!chord) return;
    const ce = style.chord && style.chord.find(e => e.slot === slot);
    // the push: the next chord on the last eighth before a change, an
    // upstroke, in place of any strike the pattern has there — with that
    // strike's own length and weight if it has one, not as well as it
    const pushing = style.compAnticipate && ctx.changing && slot === last && next;
    if (ce && !pushing) audio.playStyleVoice(style.voice, chord, at, ce.dur * slotDur, ce.vel + jit(0.06), voice, { stroke: ce.stroke || strokeAt(slot) });
    if (pushing) audio.playStyleVoice(style.voice, next, at, (ce ? ce.dur : per / 2) * slotDur, (ce ? ce.vel : 0.6) + jit(0.06), voice, { stroke: 'up' });
    const be = style.bass && style.bass.find(e => e.slot === slot);
    if (be){
      let freq;
      if ('walk' in be) freq = audio.walkBassFreq(chord, next || chord, be.walk, !!ctx.changing);
      else if (be.next) freq = audio.bassNote(SEMITONE[((ctx.changing && next) || chord).note] % 12, be.off || 0);
      else freq = audio.bassNote(SEMITONE[chord.note] % 12, be.off);
      if (style.bassApproach && ctx.changing && next && slot >= last) freq = audio.bassNote(SEMITONE[next.note] % 12, -1);
      audio.playBass(freq, at, be.dur * slotDur, be.vel + jit(0.05));
    } else if (style.bassApproach && ctx.changing && next && slot === last && !(style.bass || []).some(e => e.slot >= last)){
      audio.playBass(audio.bassNote(SEMITONE[next.note] % 12, -1), at, slotDur * (per / 2), 0.75);
    }
  }

  GT.band = { beatsOf, lastEighth, swingOffset, scheduleSlot, HAT };
})();
