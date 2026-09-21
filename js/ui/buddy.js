/* The axolotl's seat at every game.

   She asked for the pet to be part of the mini-games, so no game draws its
   own creature: they all mount one of these. It is the same axolotl as the
   room — same coat, same growth stage, wearing whatever she has dressed it
   in — reacting to what is happening in the game.

   Everything it says follows the same rule as the rest of the app: warm or
   neutral, never disappointed, never needy. Losing a game gets the same
   friendly axolotl as winning one.
*/

import { el } from './dom.js';
import { petSVG } from './art.js';
import { burst, hop } from './fx.js';
import * as pet from '../core/pet.js';
import * as items from '../core/items.js';

/* What it says, by moment. None of these are scores and none of them are
   comparisons — they are the noises a friend makes while you play. */
const LINES = {
  start: [
    'Here we go!', 'I love this one.', 'Ooh, my favourite game.',
    'You and me, ready?', 'Let us play!',
  ],
  good: [
    'Yes!', 'Got it!', 'Nice one!', 'You are so good at this.',
    'That is the one!', 'Wow!', 'Look at you go.',
  ],
  miss: [
    'Ooh, close.', 'Nearly!', 'That one is sneaky.', 'Try another.',
    'No worries — keep going.', 'Hmm, tricky!',
  ],
  thinking: [
    'Hmm...', 'Let me think.', 'My turn!', 'What shall I do...',
  ],
  win: [
    'You did it!', 'That was amazing!', 'Hooray!', 'Best game ever.',
    'We make a great team.',
  ],
  finish: [
    'That was fun!', 'Good game!', 'Let us play again some time.',
    'I had the best time.', 'Thanks for playing with me.',
  ],
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * Build a buddy panel.
 *
 * @param {object} [opts]
 * @param {'side'|'strip'|'voice'} [opts.layout]
 *   'side'  a tall panel to sit beside a board
 *   'strip' a short wide bar to sit above or below one
 *   'voice' the bubble on its own, for the two games where SHE is the
 *           axolotl — a second one of the same creature cheering the first
 *           one on is just confusing
 * @param {string} [opts.greeting] what it says to begin with
 * @returns {{node: HTMLElement, say, react, cheer, sympathise, celebrate,
 *            think, setMood, isPlayer}}
 */
export function createBuddy({ layout = 'side', greeting = null } = {}) {
  const info = pet.pet();
  const worn = items.equipped();

  const draw = mood => petSVG({
    coat: info.coat, stage: info.stage, mood, alive: true,
    hat: worn.hat, accessory: worn.accessory,
  });

  const voiceOnly = layout === 'voice';
  const bubble = el('div', { class: 'buddy-bubble', text: greeting || pick(LINES.start) });
  const figure = voiceOnly ? null : el('div', { class: 'buddy-pet', html: draw('happy') });
  const node = el('div', { class: `buddy buddy-${layout}` }, bubble, figure);

  let settle = null;

  /** Say something, and hold it there until the next thing is said. */
  function say(text) {
    if (text) bubble.textContent = text;
    return api;
  }

  /**
   * React: change face, hop, throw an effect, and say a line — the whole
   * reaction in one call, because every game wants all four together.
   */
  function react({ mood = 'happy', effect = null, text = null, ms = 1800 } = {}) {
    if (text) say(text);
    if (!figure) return api;

    figure.innerHTML = draw(mood);
    hop(figure);
    if (effect) burst(node, effect, { origin: figure });

    clearTimeout(settle);
    settle = setTimeout(() => { figure.innerHTML = draw('happy'); }, ms);
    return api;
  }

  const cheer      = text => react({ mood: 'excited', effect: 'sparkles', text: text || pick(LINES.good) });
  const sympathise = text => react({ mood: 'calm',    effect: null,       text: text || pick(LINES.miss) });
  const celebrate  = text => react({ mood: 'love',    effect: 'hearts',   text: text || pick(LINES.win), ms: 3200 });
  const think      = text => react({ mood: 'calm',    effect: null,       text: text || pick(LINES.thinking), ms: 1200 });

  function setMood(mood) {
    clearTimeout(settle);
    if (figure) figure.innerHTML = draw(mood);
    return api;
  }

  function stop() { clearTimeout(settle); }

  const api = { node, figure, say, react, cheer, sympathise, celebrate, think,
                setMood, stop, name: info.name, farewell: () => pick(LINES.finish) };
  return api;
}

/* A plain drawing of the pet for games where she plays as the axolotl and
   there is no panel — the sprite itself. Kept here so every game gets the
   coat and outfit she chose without importing three modules to do it. */
export function petSprite(mood = 'happy') {
  const info = pet.pet();
  const worn = items.equipped();
  return petSVG({ coat: info.coat, stage: info.stage, mood, alive: false,
                  hat: worn.hat, accessory: worn.accessory });
}

/** Swap a mounted sprite's drawing without rebuilding its node. */
export function setSprite(node, mood) {
  if (node) node.innerHTML = petSprite(mood);
}

export { LINES as BUDDY_LINES };
