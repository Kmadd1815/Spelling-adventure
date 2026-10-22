/* "Say it again" — the repeat buttons every game shares.

   A game says the word out loud once and then she is on her own with it.
   That is fine for "paint" and no use at all for "their", "weather" or
   "knight": the voice is a tablet's voice, it says the word quickly, and
   some words simply do not survive the trip. So every game that asks her
   to spell a word now offers the same two buttons — say the WORD again,
   and say the SENTENCE it came with — plus the slower one where there is
   room for it.

   Two buttons rather than one on purpose. A single button that says the
   word and then the sentence makes her sit through the sentence when all
   she wanted was the word again, and makes her hear the word three times
   when all she wanted was the sentence. She knows which one she needs.

   The wording matches Practice and the tests ("In a sentence"), because
   the same button should not have two names in one app.
*/

import { el, button } from './dom.js';
import * as speech from '../core/speech.js';
import * as words from '../core/words.js';

/**
 * The prompt a game speaks when a new word comes up: the word, then its
 * sentence, then the word again, so the last thing she hears is the thing
 * she has to spell.
 * @param {object} word
 * @param {object} [opts]
 * @param {boolean} [opts.withSentence]  override the default rule
 */
export function sayPrompt(word, { withSentence = words.sentenceInGames(word) } = {}) {
  return speech.promptWord(word, { withSentence });
}

/**
 * The repeat buttons, as an array so a game can drop them into its own row.
 * Empty when the tablet cannot speak — a button that does nothing is worse
 * than no button.
 *
 * @param {object} word
 * @param {object} [opts]
 * @param {boolean} [opts.slower]   include "Slower" (default true)
 * @param {boolean} [opts.compact]  icon-only, for a game's own HUD strip
 * @param {boolean} [opts.labels]   write "In a sentence" on it (default true);
 *                                  false keeps it a round button beside the
 *                                  speaker, for a row with no space for words
 * @returns {Array<HTMLElement>}
 */
export function sayAgain(word, { slower = true, compact = false, labels = true } = {}) {
  if (!speech.canSpeak() || !word) return [];

  const sayWord = compact
    ? el('button', { class: 'icon-btn', type: 'button',
        'aria-label': 'Hear the word again',
        onClick: () => speech.speakWord(word) }, '\u{1F50A}')
    : el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
        'aria-label': 'Hear the word again',
        onClick: () => speech.speakWord(word) }, '\u{1F50A}');

  const hasSentence = !!(word.sentence || '').trim();
  const saySentence = !hasSentence ? null
    : compact
      ? el('button', { class: 'icon-btn', type: 'button',
          'aria-label': 'Hear it in a sentence',
          onClick: () => speech.speakSentence(word) }, '\u{1F4AC}')
      : labels
        ? button('In a sentence', { cls: 'btn btn-quiet', emoji: '\u{1F4AC}',
            'aria-label': 'Hear it in a sentence',
            onClick: () => speech.speakSentence(word) })
        : el('button', { class: 'speak-btn speak-btn-sm speak-btn-say', type: 'button',
            'aria-label': 'Hear it in a sentence',
            onClick: () => speech.speakSentence(word) }, '\u{1F4AC}');

  const saySlower = (!slower || compact) ? null
    : button('Slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}',
        'aria-label': 'Hear the word more slowly',
        onClick: () => speech.speakWordSlowly(word) });

  return [sayWord, saySentence, saySlower].filter(Boolean);
}
