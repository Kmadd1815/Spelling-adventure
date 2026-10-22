/* The noises the app makes.

   Until now the only sound in a spelling app was the voice reading words
   out. Everything else — a right answer, a word mastered, the axolotl
   growing — was celebrated in pictures to a child who was listening as
   much as looking. A small sound lands before the eye has finished
   reading, and it is half of what makes something feel like it worked.

   Rules this file keeps:

     NOTHING IS A FILE. Every sound here is made on the spot out of a few
     oscillators. There is nothing to download, nothing to cache, nothing
     to go missing on a tablet with no signal — which matters, because
     this app works offline and a silent reward is worse than no reward.

     NOTHING IS LOUD OR LONG. The longest is under a second and they are
     all played quietly. This is used in a living room, often beside
     somebody else; a sound she notices and nobody else minds.

     IT CAN BE TURNED OFF. One switch in the Grown-ups area, because the
     one place this app gets used that sound does not suit is a car with a
     sleeping brother in it.

     IT NEVER TALKS OVER THE VOICE. A tone is a few hundred milliseconds
     and the speech is the important part; these are pitched and timed to
     sit under it rather than fight it.
*/

import { settings } from './state.js';

/* Looked up when it is first needed rather than when this file loads.
   Safari calls it webkitAudioContext, and a browser that has neither is a
   browser where this whole file quietly does nothing. */
const audioCtxClass = () =>
  (typeof AudioContext !== 'undefined' ? AudioContext
    : typeof webkitAudioContext !== 'undefined' ? webkitAudioContext
    : null);

/** Whether this device can make a sound at all. */
export function isSupported() {
  return !!audioCtxClass();
}

let ctx = null;
let master = null;
let failed = false;

/** Whether sound is on. Off only if a grown-up has said so. */
export function soundOn() {
  return settings().sound !== false;
}

/* The context has to be created — and resumed — inside a real tap, the
   same rule the speech engine lives by. app.js primes both on the first
   touch anywhere. */
export function unlock() {
  const Ctx = audioCtxClass();
  if (!Ctx || failed) return;
  try {
    if (!ctx) {
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0.22;        // everything here is quiet on purpose
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    failed = true;
  }
}

function ready() {
  if (!soundOn() || failed || document.hidden) return false;
  if (!ctx) unlock();
  return !!ctx && ctx.state === 'running';
}

/**
 * One note.
 * @param {object} spec
 * @param {number} spec.freq     hertz
 * @param {number} [spec.to]     slide to this pitch across the note
 * @param {number} [spec.at]     seconds from now
 * @param {number} [spec.dur]    seconds
 * @param {number} [spec.gain]   0..1, before the master level
 * @param {OscillatorType} [spec.type]
 */
function note({ freq, to = null, at = 0, dur = 0.16, gain = 0.6, type = 'sine' }) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);

  /* A note that starts and stops at full volume clicks. The short ramp at
     each end is the difference between a chime and a tick. */
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(amp); amp.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(notes) {
  if (!ready()) return false;
  try { notes.forEach(note); return true; }
  catch { failed = true; return false; }
}

/* ---------- The sounds ----------
   Pitches are from one small scale so that two of them landing together —
   a right answer that also masters the word — still sound like the same
   app rather than two apps. */
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;

/** A word spelled right. Two notes up. */
export function right() {
  return play([
    { freq: E5, dur: 0.1, gain: 0.5 },
    { freq: G5, at: 0.08, dur: 0.18, gain: 0.5 },
  ]);
}

/** Not yet. Low and soft, and deliberately not a buzzer: she missed a
    word, she did not set off an alarm. */
export function notYet() {
  return play([
    { freq: 300, to: 232, dur: 0.22, gain: 0.34, type: 'triangle' },
  ]);
}

/* One celebration sound for the whole app, played wherever the confetti
   falls — a word mastered, a milestone, a perfect session, a letter, a
   discovery. They are all the same kind of moment to her, and an app that
   has a different flourish for each one sounds like four apps. */
export function fanfare() {
  return play([
    { freq: G5, dur: 0.14, gain: 0.45 },
    { freq: C6, at: 0.12, dur: 0.16, gain: 0.45 },
    { freq: E6, at: 0.26, dur: 0.34, gain: 0.4 },
    { freq: C6, at: 0.26, dur: 0.34, gain: 0.22 },
  ]);
}

/** Stars landing in the counter. `n` makes it a run rather than one note. */
export function stars(n = 3) {
  const many = Math.max(1, Math.min(6, n));
  return play(Array.from({ length: many }, (_, i) => ({
    freq: C5 * Math.pow(2, i / 12 * 2), at: i * 0.07, dur: 0.1, gain: 0.34,
  })));
}

/** Something small answered a tap: a treat, a decoration, the duckling. */
export function pip() {
  return play([{ freq: G5, to: C6, dur: 0.09, gain: 0.3, type: 'triangle' }]);
}

/* Drops the engine so the next unlock() builds a new one. The test suite
   swaps in a fake audio engine and needs this one to let go of the real
   one; nothing in the app calls it. */
export function forgetContextForTests() {
  ctx = null; master = null; failed = false;
}

/** For the grown-ups' switch: proof that sound is working, right now. */
export function test() {
  unlock();
  return right();
}
