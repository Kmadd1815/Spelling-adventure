/* The room.

   A wall behind, a floor in front, and everything she owns placed where it
   would actually go: pictures up on the wall, a rug under the axolotl, a bed
   against the back-left corner, and small things tucked into the corners
   rather than ringed around the pet like a fairy circle.

   Positions are percentages of the room box, so the same arrangement holds
   from a phone-width hero to a full-screen decorating view.
*/

import { el } from './dom.js';
import { decorSVG, surfaceStyle } from './item-art.js';
import * as items from '../core/items.js';

/** Where the wall stops and the floor starts, as a percentage of height. */
const HORIZON = 56;

/* Each slot's place in the room. `depth` sets the stacking order: the
   further back something is, the earlier it is drawn, so the axolotl stands
   in front of its bed and behind the thing in the front corner. */
const PLACES = {
  window:      { left: 9,  top: 9,    width: 22, depth: 1 },
  door:        { left: 74, bottom: HORIZON - 2, width: 20, depth: 1, anchor: 'bottom' },
  wallDecor: [
    { left: 38, top: 7,  width: 16, depth: 2 },
    { left: 57, top: 15, width: 14, depth: 2 },
  ],
  /* The axolotl stands centre stage, roughly a third to two thirds across.
     Everything on the floor is placed clear of that: the bed in the back
     left corner, and the three small things tucked into the other three
     corners the way a room actually gets decorated. */
  bed:         { left: 1,  bottom: 20, width: 27, depth: 3 },
  floorDecor: [
    { left: 71, bottom: 24, width: 16, depth: 3 },   // back right
    { left: 2,  bottom: 1,  width: 15, depth: 9 },   // front left, ahead of the pet
    { left: 82, bottom: 1,  width: 16, depth: 9 },   // front right
  ],
  rug:         { left: 50, bottom: 3,  width: 46, depth: 4, centre: true },
  pet:         { left: 50, bottom: 7,  width: 34, depth: 6, centre: true },
};

function place(node, spec) {
  node.style.position = 'absolute';
  node.style.left = `${spec.left}%`;
  node.style.width = `${spec.width}%`;
  if (spec.top !== undefined) node.style.top = `${spec.top}%`;
  else node.style.bottom = `${spec.bottom}%`;
  node.style.zIndex = String(spec.depth);
  if (spec.centre) node.style.transform = 'translateX(-50%)';
  return node;
}

function piece(itemId, spec, extraClass = '') {
  const art = decorSVG(itemId, { size: 200 });
  if (!art) return null;
  const node = el('div', { class: `room-piece ${extraClass}`.trim(), html: art });
  return place(node, spec);
}

/**
 * Build the room.
 * @param {object} opts
 * @param {string} opts.petHTML   the pet's SVG, already drawn
 * @param {object} [opts.petProps] extra props for the pet node (onClick etc.)
 * @returns {HTMLElement}
 */
export function buildRoom({ petHTML = '', petProps = {} } = {}) {
  const worn = items.equipped();

  const room = el('div', { class: 'room' });

  const wall = el('div', { class: 'room-wall' });
  Object.assign(wall.style, surfaceStyle(worn.wallpaper || 'wall_plain'));
  wall.style.height = `${HORIZON}%`;

  const floor = el('div', { class: 'room-floor' });
  Object.assign(floor.style, surfaceStyle(worn.flooring || 'floor_wood'));
  floor.style.height = `${100 - HORIZON}%`;

  room.append(wall, floor, el('div', { class: 'room-skirting', style: { top: `${HORIZON}%` } }));

  if (worn.window) room.append(piece(worn.window, PLACES.window));
  if (worn.door)   room.append(piece(worn.door, PLACES.door));

  (worn.wallDecor || []).forEach((id, i) => {
    const spec = PLACES.wallDecor[i];
    if (spec) room.append(piece(id, spec));
  });

  if (worn.bed) room.append(piece(worn.bed, PLACES.bed));
  if (worn.rug) room.append(piece(worn.rug, PLACES.rug));

  (worn.floorDecor || []).forEach((id, i) => {
    const spec = PLACES.floorDecor[i];
    if (spec) room.append(piece(id, spec));
  });

  const pet = el('div', { class: 'room-pet', html: petHTML, ...petProps });
  room.append(place(pet, PLACES.pet));

  return room;
}

/** Which floor position the next decoration would take, for the hints. */
export const FLOOR_SPOTS = ['back right', 'front left', 'front right'];
export const WALL_SPOTS  = ['left', 'right'];
