/* The room.

   A wall behind, a floor in front, and everything she owns placed where it
   would actually go: pictures up on the wall, a rug under the axolotl, a bed
   against the back-left corner, and small things tucked into the corners
   rather than ringed around the pet like a fairy circle.

   Positions are percentages of the room box, so the same arrangement holds
   from a phone-width hero to a full-screen decorating view.

   The season lives in here too, but it stays where it belongs: this is
   indoors, so the weather falls OUTSIDE, seen through the window and
   nowhere else. The room itself only takes the wash of the day's light.
   (An outdoor scene would want the weather across the whole picture —
   that is what weatherLayer is for, and why it takes its own sizing.)

   Both are decoration only — nothing she owns or can buy changes with the
   season.
*/

import { el } from './dom.js';
import { decorSVG, surfaceStyle, WINDOW_GLASS } from './item-art.js';
import * as items from '../core/items.js';
import { currentSeason } from '../core/season.js';

/** Where the wall stops and the floor starts, as a percentage of height. */
const HORIZON = 56;

/* Each slot's place in the room. `depth` sets the stacking order: the
   further back something is, the earlier it is drawn, so the axolotl stands
   in front of its bed and behind the thing in the front corner. */
const PLACES = {
  /* The window is the only way the weather gets in, so it is worth the
     wall space: big enough to actually watch it snowing. */
  window:      { left: 8,  top: 7, width: 27, depth: 1 },
  /* Measured from the join, not from the bottom of the picture, so the
     door stands on the floor instead of hovering over it. */
  door:        { left: 79, bottom: 100 - HORIZON, width: 20, depth: 1, footGap: 4 },
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
    /* Standing between the rug and the door: any further left and the rug
       draws over the top of it, any further right and it blocks the way
       out. There is about four percent of room either side. */
    { left: 69, bottom: 24, width: 15, depth: 3 },   // back right
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
  /* Every door is drawn with a little clear space beneath it inside its own
     square, so a door placed by its box hovers. This pulls the box down by
     exactly that gap: a margin percentage resolves against the room's WIDTH,
     and so does the piece's width, and the art is square — so `footGap`
     viewBox units come out as the same number of pixels at any room size. */
  if (spec.footGap) node.style.marginBottom = `${-spec.footGap * spec.width / 100}%`;
  node.style.zIndex = String(spec.depth);
  return node;
}

/* What is in the air this time of year. Each piece carries its own timing
   and drift so the fall never looks stamped out, and the whole layer is
   hidden rather than frozen when motion is turned down — a frozen snowfall
   is a row of dots stuck near the ceiling.

   The sizing is a parameter because the same layer has two jobs: a few
   pieces falling briskly across a window pane, and — when there is an
   outdoor scene to put it in — a whole skyful drifting slowly across it.
   A drift of thirty pixels reads as a breeze across a room and as a gale
   across a pane of glass. */
function weatherLayer(season, { pieces, dur = [9, 20], drift = 30 } = {}) {
  const layer = el('div', { class: `room-weather weather-${season.weather}` });
  const n = pieces ?? season.pieces;
  for (let i = 0; i < n; i++) {
    /* The delay is negative on purpose: a positive one would park every
       piece above the ceiling until its turn came round, so the view would
       open empty and only start snowing a quarter of a minute later. A
       negative delay starts each piece part-way through its own fall, so
       the weather is already in the air the moment she opens the app. */
    const d = dur[0] + Math.random() * (dur[1] - dur[0]);
    layer.append(el('span', {
      class: 'wx',
      style: {
        left: `${Math.random() * 100}%`,
        '--wx-delay': `${(-Math.random() * d).toFixed(2)}s`,
        '--wx-dur': `${d.toFixed(2)}s`,
        '--wx-drift': `${(Math.random() * drift * 2 - drift).toFixed(1)}px`,
        '--wx-spin': `${Math.round(Math.random() * 540 - 270)}deg`,
        '--wx-size': `${(0.55 + Math.random() * 0.6).toFixed(2)}`,
      },
    }));
  }
  return layer;
}

/* The window, and the piece of outdoors behind it.

   The sky and the weather hang BEHIND the glass rather than over it, so the
   frame and the glazing bars stay in front of the snow the way they would
   if you were standing in the room. That works because `--season-glass` is
   a custom property: setting it to `transparent` here paints this one
   window's glass out of the way and leaves every other copy of the same
   drawing — on the shop shelf, in the decorating list — with its glass
   still in. */
function windowPiece(itemId, spec, season) {
  const art = decorSVG(itemId, { size: 200 });
  if (!art) return null;

  const node = el('div', {
    class: 'room-piece room-window',
    style: { '--season-glass': 'transparent' },
  });

  /* A window whose shape nobody has written down gets plain glass rather
     than a square of sky sitting over its frame. */
  const glass = WINDOW_GLASS[itemId];
  if (!glass) {
    node.insertAdjacentHTML('beforeend', art);
    node.style.removeProperty('--season-glass');
    return place(node, spec);
  }

  const view = el('div', { class: 'room-view', style: {
    /* The season's glass colour, deepened towards the top of the pane. Flat
       colour is what sky looks like in a paint program; this is what it
       looks like through a window, and it is also what lets white snow read
       against pale blue instead of disappearing into it. */
    background: `linear-gradient(180deg, rgba(38,62,84,.26), rgba(38,62,84,0) 66%), ${season.glass}`,
    clipPath: glass.clip,
  } });

  /* The weather is spread across the GLASS, not across the drawing's square.
     Left to itself it would scatter over the frame and the sill as well,
     and since those are clipped away the pane would look half empty. */
  const [t, r, b, l] = glass.pane;
  const wx = weatherLayer(season, {
    pieces: Math.max(7, Math.round(season.pieces * 0.85)),
    dur: [4.5, 10],
    drift: 12,
  });
  Object.assign(wx.style, { top: `${t}%`, right: `${r}%`, bottom: `${b}%`, left: `${l}%` });
  view.append(wx);

  node.append(view);
  node.insertAdjacentHTML('beforeend', art);
  return place(node, spec);
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

  /* Indoors the weather belongs outside, so it arrives with the window and
     nowhere else. She always has one — window_plain is a starter — so there
     is no season she cannot see. */
  if (worn.window) room.append(windowPiece(worn.window, PLACES.window, season));
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
