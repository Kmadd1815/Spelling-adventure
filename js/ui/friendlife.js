/* Putting the egg and the friend into a scene.

   The room, the garden and the word tree are built by three different
   modules, and threading an egg and a duckling through all three of their
   signatures would mean the same six lines in three places. These attach
   to a finished scene instead, so each screen calls one function and the
   scene builders stay the shape they were.
*/

import { el } from './dom.js';
import { friendLayers } from './petlife.js';
import { eggSVG, friendSVG } from './art.js';
import * as friend from '../core/friend.js';

/** Where the egg sits: over on the right, clear of the floor decorations
    and out of the axolotl's walking band, so it is plainly its own thing. */
const EGG_SPOT = { left: 66, bottom: 9, width: 15 };

/**
 * The egg, if she has earned it and not yet cracked it open.
 * @returns {HTMLElement|null} the button, already placed.
 */
export function attachEgg(scene, { onTap } = {}) {
  if (!scene || !friend.eggWaiting()) return null;

  const node = el('button', {
    class: 'room-egg', type: 'button',
    'aria-label': 'An egg. Tap it!',
    html: eggSVG({ cracks: friend.cracks() }),
  });
  Object.assign(node.style, {
    left: `${EGG_SPOT.left}%`, bottom: `${EGG_SPOT.bottom}%`,
    width: `${EGG_SPOT.width}%`,
  });
  node.addEventListener('click', () => onTap?.(node));
  scene.append(node);
  return node;
}

/** Redraw the egg in place, so a tap adds a crack without rebuilding the
    room underneath her finger. */
export function setEggArt(node, cracks) {
  if (node) node.innerHTML = eggSVG({ cracks });
}

/**
 * The duckling, if it has hatched. Placed next to the axolotl; follow()
 * takes over from there.
 */
export function attachFriend(scene, { onTap, mood = 'calm', width = 10 } = {}) {
  if (!scene || !friend.hasHatched()) return null;

  const pet = scene.querySelector('.room-pet');
  const petLeft = parseFloat(pet?.style.left) || 40;
  const petWidth = parseFloat(pet?.style.width) || 34;

  const node = el('div', {
    class: 'room-friend', role: 'button', tabindex: '0',
    'aria-label': `Pet ${friend.name()}`,
  });
  node.append(friendLayers(friendSVG({ mood })));
  Object.assign(node.style, {
    left: `${Math.max(2, petLeft + petWidth / 2 - 26 - width / 2)}%`,
    /* A little further up the floor than the axolotl, which is to say a
       little further away: it is smaller AND set back, so the two never
       collide even when they end up side by side, and the depth reads
       correctly rather than looking like a sticker. */
    bottom: `${(parseFloat(pet?.style.bottom) || 7) + 7}%`,
    width: `${width}%`,
  });
  node.addEventListener('click', () => onTap?.(node));
  node.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onTap?.(node); }
  });
  scene.append(node);
  return node;
}
