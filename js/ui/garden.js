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
import { petLayers } from './petlife.js';
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
/* Clear where the moon is, coming in through the lower sky and full by the
   horizon. An even wash over the whole picture dims the moon and every star
   in it, which is the opposite of the point; but a wash that waits until
   the horizon leaves the hedge and the top of the tree standing in full
   daylight under that moon, which is worse. Dimmer towards the ground is
   also just what a night looks like. */
const SKY_CAST = {
  sky_night:  'linear-gradient(180deg, rgba(30,36,70,0) 0%, rgba(30,36,70,.06) 14%, ' +
              'rgba(30,36,70,.42) 30%, rgba(30,36,70,.56) 44%, rgba(34,40,76,.5) 100%)',
  sky_sunset: 'linear-gradient(180deg, rgba(232,137,154,0) 0%, rgba(232,137,154,.04) 14%, ' +
              'rgba(236,146,146,.16) 30%, rgba(240,160,134,.24) 44%, rgba(246,184,132,.2) 100%)',
};

/* The skies with something in them worth watching. */
const STARRY = new Set(['sky_night']);

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
  /* Three places to stand something, and none of them may be a place the
     garden already uses for something else. The front-left spot used to be
     exactly where the path down to the pond was later dug, so whatever she
     put there was buried under it — which is the kind of thing nobody
     notices until they own three garden ornaments. Kept clear of: the path
     (left 3-22%, along the bottom), the postbox (left 27-38%, up at 44%),
     the pond, and the gate in the fence. */
  gardenDecor: [
    { left: 63, bottom: 100 - HORIZON - 6, width: 15, depth: 3 },   // back right
    { left: 24, bottom: 17, width: 15, depth: 5 },                  // mid left
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

function piece(itemId, spec, left, extraClass = '') {
  const art = decorSVG(itemId, { size: 200 });
  if (!art) return null;
  return place(el('div', { class: `room-piece ${extraClass}`.trim(), html: art }), spec, left);
}

/* Stars, for the skies that have them.

   Real elements rather than dots in the background gradient, because a
   gradient cannot twinkle and a star that does not twinkle is a dot. The
   gradient keeps its own faint scattering underneath — a wash of distant
   ones with a few bright ones over the top is what a sky actually looks
   like. */
function starLayer(count = 26) {
  const layer = el('div', { class: 'garden-stars', style: { height: `${HORIZON}%` } });
  for (let i = 0; i < count; i++) {
    layer.append(el('span', {
      class: 'star',
      style: {
        left: `${(Math.random() * 100).toFixed(1)}%`,
        top: `${(Math.random() * 86).toFixed(1)}%`,
        '--star-size': `${(1.8 + Math.random() * 2.6).toFixed(2)}px`,
        /* Negative, so they are already mid-twinkle when she opens it. */
        '--star-dur': `${(2.6 + Math.random() * 4.5).toFixed(2)}s`,
        '--star-delay': `${(-Math.random() * 7).toFixed(2)}s`,
      },
    }));
  }
  return layer;
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
  /* The sky is on the scene as well as in it, so the pieces that sit above
     where the cast begins — the distant hills — can be told what time of
     day it is. */
  const garden = el('div', { class: 'room garden', 'data-sky': worn.sky || 'sky_day' });

  const sky = el('div', { class: 'garden-sky' });
  Object.assign(sky.style, surfaceStyle(worn.sky || 'sky_day'));
  sky.style.height = `${HORIZON}%`;

  const ground = el('div', { class: 'garden-ground' });
  Object.assign(ground.style, surfaceStyle(worn.ground || 'ground_grass'));
  ground.style.height = `${100 - HORIZON}%`;

  garden.append(sky, ground);
  if (STARRY.has(worn.sky)) garden.append(starLayer());
  garden.append(hills());

  /* Outdoors the weather is simply in the air, in front of the sky and the
     ground and behind everything standing in the garden. This is the whole
     point of the place. */
  garden.append(weatherLayer(season));

  if (worn.fence) {
    const f = PLACES.fenceSpan;
    for (let i = 0; i < f.count; i++) {
      garden.append(piece(worn.fence, f, i * (100 / f.count), 'garden-fence'));
    }
  }

  if (worn.tree)  garden.append(piece(worn.tree, PLACES.tree));

  (worn.gardenDecor || []).forEach((id, i) => {
    const spec = PLACES.gardenDecor[i];
    if (spec) garden.append(piece(id, spec));
  });

  if (worn.water) garden.append(piece(worn.water, PLACES.water));

  const pet = el('div', { class: 'room-pet', ...petProps });
  pet.append(petLayers(petHTML));
  garden.append(place(pet, PLACES.pet));

  const cast = SKY_CAST[worn.sky];
  if (cast) garden.append(el('div', { class: 'room-light', style: { background: cast } }));

  garden.append(el('div', { class: 'room-light', style: { background: season.light } }));
  return garden;
}

/** Which spot the next garden decoration would take, for the hints. */
export const GARDEN_SPOTS = ['back right', 'left of the lawn', 'front right'];
