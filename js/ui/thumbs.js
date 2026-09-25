/* One picture of an item, whatever kind of item it is.

   This lives in its own file rather than in item-art.js because a
   wearable's picture is the AXOLOTL WEARING IT, which means reaching for
   the pet drawing — and art.js already reaches the other way for the
   wearables themselves. Two modules importing each other works until the
   day it does not, so the dispatcher sits above both instead.

   WHY THE AXOLOTL IS IN THE PICTURE. A bow tie drawn on its own is eleven
   pixels of ribbon floating in a white square: the shop's Wear tab was a
   grid of specks, and a scarf, a collar and a necklace were impossible to
   tell apart. Every one of those drawings is measured against the head and
   body it is worn on — that is how one drawing fits every growth stage —
   so drawn without the animal they are not small by accident, they are
   small because the animal is missing. Putting it back is also the honest
   answer to "what will this look like on him?", which is the only question
   she is really asking in that grid.
*/

import { petSVG } from './art.js';
import { coatByKey, currentStage, pet } from '../core/pet.js';
import { decorSVG, surfaceSwatch, SURFACES } from './item-art.js';

/* Head and shoulders for a hat, a little more of the animal for anything
   worn on the body. The pet is drawn in a 200-wide box whose own view
   starts at y=44; these crops are in those same units. */
const CROP = {
  hat:       { x: 20, y: 46, w: 160, h: 124 },
  accessory: { x: 10, y: 52, w: 180, h: 152 },
};

/**
 * The axolotl wearing one item.
 *
 * @param {string} itemId
 * @param {object} [opts]
 * @param {number} [opts.size]
 * @param {'hat'|'accessory'} [opts.category] which slot it is worn in
 * @returns {string} an <svg> string
 */
export function wearingSVG(itemId, { size = 100, category = 'hat' } = {}) {
  const worn = category === 'accessory' ? { accessory: itemId } : { hat: itemId };
  const crop = CROP[category] || CROP.hat;
  /* Still, not breathing: these appear twenty to a screen, and twenty
     animals blinking at her out of a price list is a different feeling
     from one animal in a room. */
  const art = petSVG({
    coat: coatByKey(pet().coat), stage: currentStage(),
    mood: 'happy', alive: false, ...worn,
  });
  /* Re-aim the pet's own viewBox at the part of it that is wearing the
     thing, and drop the class that sizes it as a room-sized animal. */
  return art
    .replace('class="pet-stage"', 'class="wear-thumb"')
    .replace('viewBox="0 44 200 162"',
             `viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" width="${size}" height="${size}"`);
}

/**
 * Draw an item, whatever kind it is.
 *
 * Dispatching on which drawing exists rather than on the category means
 * moving an item between slots — a lantern from the floor to the wall,
 * say — never silently loses its art.
 */
export function itemSVG(item, opts = {}) {
  if (!item) return '';
  if (SURFACES[item.id]) return surfaceSwatch(item.id, opts);
  const drawn = decorSVG(item.id, opts);
  if (drawn) return drawn;
  if (item.category === 'hat' || item.category === 'accessory') {
    return wearingSVG(item.id, { ...opts, category: item.category });
  }
  return '';
}
