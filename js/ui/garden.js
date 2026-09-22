/* The garden.

   Her room turned inside out. Same idea — a backdrop, a set of places,
   and the axolotl standing in the middle of it — but outdoors, which
   changes three things:

     the weather falls across the WHOLE picture rather than behind glass,
     which is the entire reason this place exists

     nothing here comes from the room. A bed on the grass would look like
     a bug rather than a choice, so the garden has its own slots and its
     own things to put in them

     there is no wall to hang anything on, so depth is done with a line of
     distant hills and a fence standing on the horizon

   Positions are percentages of the scene box, so the same arrangement
   holds from a phone-width hero to a full-screen decorating view.
*/

import { el } from './dom.js';
import { decorSVG, surfaceStyle } from './item-art.js';
import * as items from '../core/items.js';
import { currentSeason } from '../core/season.js';
import { weatherLayer } from './weather.js';

/** Where the sky stops and the ground starts, as a percentage of height. */
const HORIZON = 44;

/* Some skies change the whole garden rather than just the top of it. Grass
   in full daylight under a moon is the sort of thing that reads as a bug,
   and the night sky is the second most expensive thing in the shop — it
   should feel like it did something. */
const SKY_CAST = {
  sky_night:  'linear-gradient(180deg, rgba(30,36,70,.58), rgba(38,44,80,.46))',
  sky_sunset: 'linear-gradient(180deg, rgba(232,137,154,.20), rgba(246,184,132,.15))',
};

/* A piece's box is the square its art is drawn in, and its height comes out
   as its width — the scene is 16:10, so a piece W% wide is W × 1.6 % tall.
   Every `bottom` below was chosen with that in mind. */
const PLACES = {
  /* Four sections of fence across the back, standing on the horizon. Each
     drawing runs edge to edge so the rails meet at the joins. */
  /* Six sections rather than four: a taller fence hides the hills behind
     it completely, and then the garden has no distance in it at all. */
  fenceSpan:   { count: 6, bottom: 100 - HORIZON, width: 100 / 6, depth: 2, footGap: 4 },

  tree:        { left: 1,  bottom: 100 - HORIZON - 6, width: 29, depth: 3 },
  gardenDecor: [
    { left: 63, bottom: 100 - HORIZON - 6, width: 15, depth: 3 },   // back right
    { left: 3,  bottom: 2,  width: 17, depth: 9 },                  // front left
    /* Far enough right to be beside the water rather than standing in it. */
    { left: 85, bottom: 3,  width: 14, depth: 9 },                  // front right
  ],
  water:       { left: 55, bottom: 4,  width: 30, depth: 4 },
  pet:         { left: 44, bottom: 10, width: 31, depth: 6, centre: true },
};

function place(node, spec, left) {
  node.style.position = 'absolute';
  node.style.left = `${left ?? (spec.centre ? spec.left - spec.width / 2 : spec.left)}%`;
  node.style.width = `${spec.width}%`;
  if (spec.top !== undefined) node.style.top = `${spec.top}%`;
  else node.style.bottom = `${spec.bottom}%`;
  /* The same trick the room's door uses: a margin percentage resolves
     against the scene's WIDTH, and so does a piece's width, so `footGap`
     viewBox units stay `footGap` viewBox units at any size. */
  if (spec.footGap) node.style.marginBottom = `${-spec.footGap * spec.width / 100}%`;
  node.style.zIndex = String(spec.depth);
  return node;
}

function piece(itemId, spec, left) {
  const art = decorSVG(itemId, { size: 200 });
  if (!art) return null;
  return place(el('div', { class: 'room-piece', html: art }), spec, left);
}

/* Something in the distance for the fence to stand in front of. Not an item:
   a garden with nothing behind it is a stage set, and this is cheaper than
   asking her to buy a horizon. */
function hills() {
  return el('div', { class: 'garden-hills', style: { bottom: `${100 - HORIZON}%` } }, [
    el('div', { class: 'hill hill-far' }),
    el('div', { class: 'hill hill-near' }),
  ]);
}

/**
 * Build the garden.
 * @param {object} opts
 * @param {string} opts.petHTML    the pet's SVG, already drawn
 * @param {object} [opts.petProps] extra props for the pet node (onClick etc.)
 * @returns {HTMLElement}
 */
export function buildGarden({ petHTML = '', petProps = {}, season = currentSeason() } = {}) {
  const worn = items.equipped();
  const garden = el('div', { class: 'room garden' });

  const sky = el('div', { class: 'garden-sky' });
  Object.assign(sky.style, surfaceStyle(worn.sky || 'sky_day'));
  sky.style.height = `${HORIZON}%`;

  const ground = el('div', { class: 'garden-ground' });
  Object.assign(ground.style, surfaceStyle(worn.ground || 'ground_grass'));
  ground.style.height = `${100 - HORIZON}%`;

  garden.append(sky, ground, hills());

  /* Outdoors the weather is simply in the air, in front of the sky and the
     ground and behind everything standing in the garden. This is the whole
     point of the place. */
  garden.append(weatherLayer(season));

  if (worn.fence) {
    const f = PLACES.fenceSpan;
    for (let i = 0; i < f.count; i++) {
      garden.append(piece(worn.fence, f, i * (100 / f.count)));
    }
  }

  if (worn.tree)  garden.append(piece(worn.tree, PLACES.tree));

  (worn.gardenDecor || []).forEach((id, i) => {
    const spec = PLACES.gardenDecor[i];
    if (spec) garden.append(piece(id, spec));
  });

  if (worn.water) garden.append(piece(worn.water, PLACES.water));

  const pet = el('div', { class: 'room-pet', html: petHTML, ...petProps });
  garden.append(place(pet, PLACES.pet));

  const cast = SKY_CAST[worn.sky];
  if (cast) garden.append(el('div', { class: 'room-light', style: { background: cast } }));

  garden.append(el('div', { class: 'room-light', style: { background: season.light } }));
  return garden;
}

/** Which spot the next garden decoration would take, for the hints. */
export const GARDEN_SPOTS = ['back right', 'front left', 'front right'];
