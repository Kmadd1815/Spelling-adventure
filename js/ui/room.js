/* The room.

   A wall behind, a floor in front, and everything she owns placed where it
   would actually go: pictures up on the wall, a rug under the axolotl, a bed
   against the back-left corner, and small things tucked into the corners
   rather than ringed around the pet like a fairy circle.

   Positions are percentages of the room box, so the same arrangement holds
   from a phone-width hero to a full-screen decorating view.

   The season lives in here too: whatever is drifting through the air this
   time of year falls behind the furniture and in front of the wall, and a
   faint wash of the day's light sits over the top. Both are decoration
   only — nothing she owns or can buy changes with the season.
*/

import { el } from './dom.js';
import { decorSVG, surfaceStyle } from './item-art.js';
import * as items from '../core/items.js';
import { currentSeason } from '../core/season.js';

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
  /* Centred pieces work out their own left edge rather than using
     translateX(-50%). A transform here would be wiped out the moment any
     animation sets its own transform — which is exactly what made the
     axolotl leap sideways every time it was petted. */
  node.style.left = `${spec.centre ? spec.left - spec.width / 2 : spec.left}%`;
  node.style.width = `${spec.width}%`;
  if (spec.top !== undefined) node.style.top = `${spec.top}%`;
  else node.style.bottom = `${spec.bottom}%`;
  node.style.zIndex = String(spec.depth);
  return node;
}

/* What is in the air this time of year. Each piece carries its own timing
   and drift so the fall never looks stamped out, and the whole layer is
   hidden rather than frozen when motion is turned down — a frozen snowfall
   is a row of dots stuck near the ceiling. */
function weatherLayer(season) {
  const layer = el('div', { class: `room-weather weather-${season.weather}` });
  for (let i = 0; i < season.pieces; i++) {
    /* The delay is negative on purpose: a positive one would park every
       piece above the ceiling until its turn came round, so the room would
       open empty and only start snowing a quarter of a minute later. A
       negative delay starts each piece part-way through its own fall, so
       the weather is already in the air the moment she opens the app. */
    const dur = 9 + Math.random() * 11;
    layer.append(el('span', {
      class: 'wx',
      style: {
        left: `${Math.random() * 100}%`,
        '--wx-delay': `${(-Math.random() * dur).toFixed(2)}s`,
        '--wx-dur': `${dur.toFixed(2)}s`,
        '--wx-drift': `${(Math.random() * 60 - 30).toFixed(1)}px`,
        '--wx-spin': `${Math.round(Math.random() * 540 - 270)}deg`,
        '--wx-size': `${(0.55 + Math.random() * 0.6).toFixed(2)}`,
      },
    }));
  }
  return layer;
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
export function buildRoom({ petHTML = '', petProps = {}, season = currentSeason() } = {}) {
  const worn = items.equipped();

  const room = el('div', { class: 'room' });

  const wall = el('div', { class: 'room-wall' });
  Object.assign(wall.style, surfaceStyle(worn.wallpaper || 'wall_plain'));
  wall.style.height = `${HORIZON}%`;

  const floor = el('div', { class: 'room-floor' });
  Object.assign(floor.style, surfaceStyle(worn.flooring || 'floor_wood'));
  floor.style.height = `${100 - HORIZON}%`;

  room.append(wall, floor, el('div', { class: 'room-skirting', style: { top: `${HORIZON}%` } }));
  room.append(weatherLayer(season));

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

  /* The light goes on last so it falls across everything, and takes no
     pointer events so it can never come between her and the axolotl. */
  room.append(el('div', { class: 'room-light', style: { background: season.light } }));

  return room;
}

/** Which floor position the next decoration would take, for the hints. */
export const FLOOR_SPOTS = ['back right', 'front left', 'front right'];
export const WALL_SPOTS  = ['left', 'right'];
