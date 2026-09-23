/* Centralised text-to-speech.

   Every spoken word in the app comes through here — Listen & Spell,
   Practice, Test, and any mini-game added later. One voice setting,
   one speed setting, changed in one place.

   Android Chrome quirks this module works around:
     - getVoices() is empty on first call and fills in asynchronously
     - synthesis needs a user gesture before the first utterance
     - the queue can wedge after the tab is backgrounded (resume() fixes it)
     - cancel() must precede speak() or utterances stack up
*/

import { settings, update } from './state.js';
import { emit } from './bus.js';

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;

export const isSupported = !!synth;

/* Whether this tablet can ACTUALLY say a word out loud right now.
   `isSupported` only says the browser has the API; a tablet with the voice
   data not downloaded, or text-to-speech switched off in Android settings,
   has the API and no voices, and then every spoken word in the app is a
   silent no-op. Spelling with no audio is not hard, it is impossible — she
   is being asked to spell a word nobody has told her.

   Call this AFTER ready(), or it will say no while the voice list is still
   filling in. */
export function canSpeak() {
  return !!synth && voiceCache.length > 0 && !engineFailed;
}

/* ---------- When the engine stops working mid-use ----------

   A tablet can have voices listed and still not be able to say anything.
   The usual reason is the internet: a lot of Android's best-sounding
   voices are streamed, and with no signal they fail rather than falling
   back to something local. Everything else in this app works offline — it
   is all cached and it saves to the tablet itself — so this is the one
   thing a lost connection can actually take away.

   And it used to take it away SILENTLY. The error handler resolved the
   promise and said nothing, so the speaker button did nothing, over and
   over, and a spelling app that will not say the word is a spelling app
   asking her to spell a word nobody has told her.

   So a real failure now switches the whole app into the mode it already
   has for a tablet with no voices at all: look at the word, cover it,
   spell it. That is a worse way to practise and an entirely workable one,
   which beats a button that does nothing. */
let engineFailed = false;

/* 'interrupted' and 'canceled' are what every call reports when the next
   one cuts it off, which happens constantly and by design. */
const REAL_FAILURE = new Set(['network', 'synthesis-failed', 'synthesis-unavailable',
                              'audio-busy', 'audio-hardware', 'language-unavailable',
                              'voice-unavailable']);

function noteEngineFailure(reason) {
  if (engineFailed) return;
  engineFailed = true;
  console.warn('[speech] the voice engine stopped working:', reason);
  emit('speech:failed', reason);
}

/** Give it another go — the connection may be back. */
export function retryEngine() {
  engineFailed = false;
}

let voiceCache = [];
let readyPromise = null;
let unlocked = false;
let current = null;

/* ---------- Voice loading ---------- */

function collectVoices() {
  try { voiceCache = synth.getVoices() || []; }
  catch { voiceCache = []; }
  return voiceCache;
}

/** Resolves once the device has reported its voices (or we give up waiting). */
export function ready() {
  if (!synth) return Promise.resolve([]);
  if (readyPromise) return readyPromise;

  readyPromise = new Promise(resolve => {
    if (collectVoices().length) return resolve(voiceCache);

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener?.('voiceschanged', onChange);
      resolve(collectVoices());
    };
    const onChange = () => { if (collectVoices().length) finish(); };

    synth.addEventListener?.('voiceschanged', onChange);
    // Some builds only ever fire once, some never fire at all.
    const poll = setInterval(() => { if (collectVoices().length) { clearInterval(poll); finish(); } }, 250);
    setTimeout(() => { clearInterval(poll); finish(); }, 3000);
  });

  return readyPromise;
}

/** English voices, best-sounding first. US English is ranked above the rest. */
export function voices() {
  const scored = voiceCache
    .filter(v => /^en\b|^en[-_]/i.test(v.lang || ''))
    .map(v => {
      let score = 0;
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      if (lang.startsWith('en-us') || lang === 'en_us') score += 100;
      else if (lang.startsWith('en-gb')) score += 20;
      else score += 10;
      // Google's US voices are the clearest ones on most Android builds.
      if (name.includes('google')) score += 25;
      if (/\bus\b|united states/.test(name)) score += 15;
      /* Weighted heavily, and on purpose. A streamed voice sounds a little
         better and stops working the moment the tablet loses signal; a
         voice stored on the device works in the car, at her grandmother's,
         and on a train. For an app whose whole job is saying words out
         loud, one that always works beats one that sometimes sounds
         nicer. */
      if (v.localService) score += 45;
      if (v.default) score += 3;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.v);

  // If the device reports no English voices at all, offer everything
  // rather than leaving the parent with an empty picker.
  return scored.length ? scored : voiceCache.slice();
}

export function allVoicesRaw() {
  return voiceCache.slice();
}

function chooseVoice() {
  const wanted = settings().voiceURI;
  if (wanted) {
    const match = voiceCache.find(v => v.voiceURI === wanted);
    if (match) return match;
  }
  return voices()[0] || null;
}

export function currentVoice() {
  return chooseVoice();
}

export function setVoice(voiceURI) {
  update(state => { state.settings.voiceURI = voiceURI || null; });
  emit('speech:voiceChanged', voiceURI);
}

export function setRate(rate) {
  const clamped = Math.min(1.3, Math.max(0.4, Number(rate) || 0.85));
  update(state => { state.settings.rate = clamped; });
  return clamped;
}

/* ---------- Unlocking ----------
   Chrome will not speak until synthesis has been touched inside a real
   user gesture. app.js calls this on the first tap anywhere. */

export function unlock() {
  if (!synth || unlocked) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
    synth.cancel();
  } catch { /* nothing to do */ }
}

/* ---------- Speaking ---------- */

export function stop() {
  if (!synth) return;
  try { synth.cancel(); } catch { /* ignore */ }
  current = null;
  emit('speech:end');
}

/**
 * Speak a phrase.
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.rate]  absolute rate; overrides the setting
 * @param {number} [opts.rateScale] multiplier on the setting (0.65 = "say it slowly")
 * @returns {Promise<void>} resolves when speech finishes or is interrupted
 */
export function speak(text, opts = {}) {
  if (!synth || !text) return Promise.resolve();

  stop();
  unlock();

  const utter = new SpeechSynthesisUtterance(String(text));
  const voice = chooseVoice();
  /* Android reloads its voice list when the TTS engine updates or a
     language pack is added or removed, so the voice chosen a moment ago can
     already be stale. Assigning a stale one throws, and the throw comes out
     of speak() — which is called from a click handler — so the word is
     simply never said and nothing else on the screen happens either.
     Falling back to the device default is always better than that. */
  try {
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = 'en-US';
    }
  } catch {
    utter.lang = 'en-US';
  }

  const base = opts.rate ?? settings().rate ?? 0.85;
  utter.rate = Math.min(1.5, Math.max(0.3, base * (opts.rateScale ?? 1)));
  utter.pitch = opts.pitch ?? 1;
  utter.volume = 1;

  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      current = null;
      emit('speech:end');
      resolve();
    };

    utter.onend = finish;
    utter.onerror = e => {
      const reason = e?.error || 'unknown';
      if (REAL_FAILURE.has(reason)) noteEngineFailure(reason);
      finish();
    };

    current = utter;
    emit('speech:start', text);

    try {
      // Guards the wedged-queue bug after the app has been backgrounded.
      if (synth.paused) synth.resume();
      synth.speak(utter);
    } catch (err) {
      console.error('[speech] speak failed', err);
      finish();
    }

    // Safety net: if the engine never fires onend, do not hang the UI.
    const guessedMs = 1200 + String(text).length * 110;
    setTimeout(finish, guessedMs + 4000);
  });
}

/* ---------- Word-level helpers used by activities ---------- */

/** Say the word on its own. */
export function speakWord(word, opts) {
  return speak(word.text, opts);
}

/** Say it slowly, for the "say it again slower" button. */
export function speakWordSlowly(word) {
  return speak(word.text, { rateScale: 0.62 });
}

/** Say the example sentence. */
export function speakSentence(word) {
  return word.sentence ? speak(word.sentence) : Promise.resolve();
}

/**
 * The standard prompt for an activity: the word, then — when the word is a
 * homophone or the parent asked for sentences always — a pause and the
 * sentence, then the word again so the last thing she hears is the target.
 */
export async function promptWord(word, { withSentence = false } = {}) {
  await speak(word.text);
  if (withSentence && word.sentence) {
    await pause(260);
    await speak(word.sentence);
    await pause(200);
    await speak(word.text);
  }
}

/** Spell a word out letter by letter, for the "show me" reveal. */
export async function spellOut(word) {
  const letters = word.text.split('');
  for (const letter of letters) {
    await speak(letter.toUpperCase(), { rateScale: 0.8 });
    await pause(80);
  }
  await pause(200);
  await speak(word.text);
}

function pause(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Parent settings "test voice" button. */
export function testVoice() {
  return speak('Hi! Can you spell the word rainbow?');
}
