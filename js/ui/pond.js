/* The pond.

   Not another room. The room and the garden are both a backdrop with a
   line along the bottom for the axolotl to walk on; this is a box of water
   seen from the side, and the axolotl is IN it rather than standing in
   front of it. Everything below follows from that:

     the water is the whole picture, not a strip of it. There is a thin
     band of surface at the top with the daylight coming through it, and
     the bed of the pond along the bottom

     things are planted at different depths. Reeds and grass stand on the
     bottom, the big feature sits on it, lily pads float at the top, and
     the little swimmers drift in the middle, so the water has layers in
     it rather than a row of objects on a shelf

     the axolotl swims in two dimensions and the duckling paddles on the
     surface above it — see swim() and follow() in ui/petlife.js
*/

import { el } from './dom.js';
import { gid } from './shade.js';
import { petLayers } from './petlife.js';
import { decorSVG, surfaceStyle } from './item-art.js';
import * as items from '../core/items.js';
import { currentSeason } from '../core/season.js';

/** Where the water stops and the bed starts, as a percentage of height. */
const BED = 18;
/** How much of the top is surface, where the light and the lilies are. */
const SURFACE = 9;

/* Positions are percentages of the scene, like the room and the garden, so
   one arrangement holds from a phone-width hero to the decorating view. */
const PLACES = {
  /* Standing on the bed, at three depths so they do not line up. */
  plants: [
    { left: 4,  bottom: BED - 3, width: 20, depth: 3 },
    { left: 76, bottom: BED - 4, width: 22, depth: 3 },
    { left: 30, bottom: BED - 2, width: 17, depth: 2 },
  ],
  /* The big thing sits on the bed, a little right of centre and BEHIND the
     plants, so the plants read as being in front of it. */
  feature: { left: 46, bottom: BED - 4, width: 30, depth: 1 },
  /* The little swimmers drift in open water, clear of the plants. */
  friends: [
    { left: 60, bottom: 52, width: 16, depth: 4 },
    { left: 16, bottom: 38, width: 14, depth: 4 },
  ],
  /* Lily pads float, so they go at the very top whatever else is out. */
  /* Floating just under the surface. The box is square, so its height is
     its width — anything wider than this and the pads push up out of the
     top of the picture. */
  lilies:  { left: 5,  bottom: 100 - SURFACE - 35, width: 20, depth: 5 },
  pet:     { left: 50, bottom: 34, width: 30, depth: 6, centre: true },
};

/** Lily pads belong on the surface; everything else in the plant slots is
    rooted on the bottom. */
const FLOATS = new Set(['pond_lilies']);

function place(node, spec) {
  node.style.position = 'absolute';
  node.style.left = `${spec.centre ? spec.left - spec.width / 2 : spec.left}%`;
  node.style.bottom = `${spec.bottom}%`;
  node.style.width = `${spec.width}%`;
  node.style.zIndex = String(spec.depth);
  return node;
}

function piece(itemId, spec) {
  const art = decorSVG(itemId, { size: 200 });
  if (!art) return null;
  return place(el('div', { class: 'room-piece', html: art }), spec);
}

/**
 * @param {object} opts
 * @param {string} opts.petHTML   the axolotl, already drawn
 * @param {object} [opts.petProps]
 * @returns {HTMLElement}
 */
export function buildPond({ petHTML = '', petProps = {}, season = currentSeason() } = {}) {
  const worn = items.equipped();
  const pond = el('div', { class: 'room pond' });

  const water = el('div', { class: 'pond-water' });
  Object.assign(water.style, surfaceStyle(worn.pondWater || 'water_sunny'));

  const bed = el('div', { class: 'pond-bed' });
  Object.assign(bed.style, surfaceStyle(worn.pondFloor || 'bed_sand'));
  bed.style.height = `${BED}%`;

  pond.append(water, bed);

  /* The surface, seen from underneath: a bright band with the daylight
     wobbling along it. It is what tells the eye which way is up. */
  pond.append(el('div', { class: 'pond-surface', style: { height: `${SURFACE}%` } }));

  if (worn.pondFeature) pond.append(piece(worn.pondFeature, PLACES.feature));

  (worn.pondPlant || []).forEach((id, i) => {
    if (!id) return;
    const spec = FLOATS.has(id) ? PLACES.lilies : PLACES.plants[i];
    if (spec) pond.append(piece(id, spec));
  });

  (worn.pondFriend || []).forEach((id, i) => {
    const spec = PLACES.friends[i];
    if (id && spec) {
      const node = piece(id, spec);
      /* They drift. Each one gets its own timing so two of them never
         swing together like a pendulum. */
      if (node) {
        node.classList.add('pond-drifter');
        node.style.setProperty('--drift-dur', `${(7 + i * 2.6).toFixed(1)}s`);
        node.style.setProperty('--drift-delay', `${(-i * 3.1).toFixed(1)}s`);
        pond.append(node);
      }
    }
  });

  const pet = el('div', { class: 'room-pet', ...petProps });
  pet.append(petLayers(petHTML));
  pond.append(place(pet, PLACES.pet));

  /* The light over the top, same as everywhere else — but the pond is
     under water, so the season tints it far less. */
  pond.append(el('div', { class: 'room-light pond-light',
    style: { background: season.light } }));
  return pond;
}

/** Where the duckling paddles: on the surface, not in the water. */
/* Where the duckling floats. The surface is the top `SURFACE` per cent of
   the pond, so the waterline is at 100 - SURFACE; this sits the duckling so
   that line crosses the bottom third of it. Any lower and it hangs in
   mid-water, which is the one thing a duckling never does; any higher and
   its head goes out through the top of the scene. */
export const SURFACE_BOTTOM = 100 - SURFACE - 3;

/** Which plant spot the next water plant would take, for the hints. */
export const POND_SPOTS = ['left', 'right', 'middle'];


/* ---------- The way down ----------

   A path leading off the bottom-left of the garden with water showing at
   the end of it. Shut, the water is still visible: a way out that is
   plainly there and plainly not open yet is a reason to keep going, which
   is the same reason the gate to the word tree is a gate and not a hedge.
*/
export function pathSVG(open = false) {
  const stone = gid(), wet = gid(), rim = gid();
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${stone}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#e2d7bd"/><stop offset="100%" stop-color="#b3a586"/>
        </linearGradient>
        <linearGradient id="${rim}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#b9a98a"/><stop offset="100%" stop-color="#8b7c60"/>
        </linearGradient>
        <linearGradient id="${wet}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d7aa4"/><stop offset="55%" stop-color="#57add0"/>
          <stop offset="100%" stop-color="#8fd6ea"/>
        </linearGradient>
      </defs>

      <!-- The mouth of it: a dip in the ground with water in the bottom.
           Drawn as a hole rather than as a blue shape lying on the grass,
           which is what the first attempt looked like. -->
      <ellipse cx="50" cy="28" rx="40" ry="17" fill="url(#${rim})"/>
      <ellipse cx="50" cy="30" rx="34" ry="13" fill="url(#${wet})"/>
      <path d="M 30 27 q 10 -4 21 -1" fill="none" stroke="#ffffff" stroke-opacity=".5"
            stroke-width="2.6" stroke-linecap="round"/>
      <path d="M 40 35 q 8 -3 17 -1" fill="none" stroke="#ffffff" stroke-opacity=".3"
            stroke-width="2" stroke-linecap="round"/>

      <!-- A couple of reeds at the near edge, so it reads as a pond and not
           as a puddle. -->
      ${[[15, 30, 22, 3], [20, 31, 16, -2], [85, 31, 19, -3], [80, 32, 14, 2]]
        .map(([x, y, h, lean]) =>
        `<path d="M ${x} ${y} q ${lean * 0.4} ${-h * 0.6} ${lean} ${-h}" fill="none"
               stroke="#5b9a5c" stroke-width="2.2" stroke-linecap="round"/>`).join('')}

      <!-- Steps coming up out of it towards the front, each one wider and
           lower than the one behind, which is what makes it a descent. -->
      ${[[34, 40, 32], [28, 55, 44], [20, 71, 60], [12, 88, 76]].map(([x, y, w]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="12" rx="4"
               fill="url(#${stone})" stroke="#8d8065" stroke-width="2"/>
         <rect x="${x + 3}" y="${y + 2}" width="${w - 6}" height="3.4" rx="1.7"
               fill="#ffffff" opacity=".3"/>`).join('')}

      ${open ? '' :
        /* Shut: a rope across the top step. Not a wall — she can see
           exactly where it goes, which is the whole point. */
        `<path d="M 14 84 Q 50 94 86 84" fill="none" stroke="#c9a97c" stroke-width="3.6"
               stroke-linecap="round"/>
         <circle cx="14" cy="84" r="4" fill="#a5875f" stroke="#7d6244" stroke-width="2"/>
         <circle cx="86" cy="84" r="4" fill="#a5875f" stroke="#7d6244" stroke-width="2"/>`}
    </svg>`;
}
