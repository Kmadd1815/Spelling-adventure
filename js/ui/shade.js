/* The shading language.

   One light, from the upper left, shared by everything the app draws — the
   axolotl, the furniture, the garden. It is the same corner the room's
   window is in, so a thing standing in the room is lit by the thing that
   lights the room.

   That single decision is most of what makes a set of flat shapes read as
   objects in a space rather than stickers on a page: every highlight lands
   on the same side, every shadow falls the same way, and the eye stops
   noticing the drawings and starts seeing the room.

   The helpers here shade a shape BY ITS OWN GEOMETRY. A generic sheen laid
   over the top of a finished drawing was tried first, and it looked like a
   smear: a highlight has to be the shape of the thing it is on, or it reads
   as dirt on the screen. So each one takes the same numbers the shape takes
   and hands back the shape, already shaded.

   This lives in its own file because both ui/art.js and ui/item-art.js need
   it, and a light that is defined twice is a light that drifts.
*/

const n = v => Math.round(v * 100) / 100;

/* Unique gradient ids. The same drawing goes up many times on one page —
   the shop grid alone puts a hundred of them out — and in SVG a url(#id)
   resolves to the FIRST match in the whole document, so two drawings
   sharing an id means the second silently wears the first one's colours. */
let uid = 0;
const gid = () => `ia${(++uid).toString(36)}`;

/* Shadows are marked, because a shadow is not part of the thing that
   throws it. Anything measuring how big a piece is — the room's fit tests
   do exactly this — has to be able to tell the two apart, or a door that
   correctly casts a shadow onto the floor in front of it looks like a door
   that has sunk into the floor. */
export const SHADOW = 'ia-shadow';

/* The light's direction, written once as gradient corners. */
export const L1 = { x1: '10%', y1: '0%', x2: '90%', y2: '100%' };

/** Stroke attributes, or nothing at all — so every helper can take both. */
const edge = o => (o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 3}"` +
  (o.join ? ` stroke-linejoin="${o.join}"` : '') : '');

/** A flat face turned towards the light: bright corner to shaded corner. */
export function litRect(x, y, w, h, rx, light, dark, o = {}) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}" fill="url(#${id})"${edge(o)}/>`;
}

/** A rounded thing, lit from above left so it reads as having a belly. */
export function litEllipse(cx, cy, rx, ry, light, dark, o = {}) {
  const id = gid();
  return `<defs><radialGradient id="${id}" cx="${o.cx ?? '34%'}" cy="${o.cy ?? '26%'}" r="${o.r ?? '82%'}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"${edge(o)}/>`;
}

/** Any outline at all, shaded along the light rather than filled flat. */
export function litPath(d, light, dark, o = {}) {
  const id = gid();
  const grad = o.round
    ? `<radialGradient id="${id}" cx="34%" cy="26%" r="82%">`
    : `<linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">`;
  const close = o.round ? '</radialGradient>' : '</linearGradient>';
  return `<defs>${grad}<stop offset="0%" stop-color="${light}"/>` +
    `<stop offset="100%" stop-color="${dark}"/>${close}</defs>` +
    `<path d="${d}" fill="url(#${id})"${edge(o)}/>`;
}

/**
 * A frame drawn as a stroke rather than a filled shape.
 *
 * A window's frame has to be a ring: the room hangs a live piece of sky
 * behind the glass, and a filled rectangle underneath the frame would cover
 * it up. Strokes take a gradient just as fills do, so the frame can still
 * have a lit side and a shaded one.
 */
export function ringRect(x, y, w, h, rx, sw, light, dark) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}"
      fill="none" stroke="url(#${id})" stroke-width="${n(sw)}"/>`;
}

/** The same, for a frame that is not a rectangle: a round or arched one. */
export function ringPath(d, sw, light, dark, o = {}) {
  const id = gid();
  const g = o.round
    ? `<radialGradient id="${id}" cx="34%" cy="26%" r="82%">`
    : `<linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">`;
  return `<defs>${g}<stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>` +
    `${o.round ? '</radialGradient>' : '</linearGradient>'}</defs>` +
    `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="${n(sw)}" stroke-linejoin="${o.join ?? 'round'}"/>`;
}

/**
 * The shadow a thing standing on the floor casts at its own feet.
 *
 * This is the single biggest reason the room used to look like a collage:
 * nothing touched the ground. A soft dark pool under the footprint is what
 * says "this is standing here" rather than "this is pasted here", and it
 * costs one ellipse.
 */
export function contact(cx, cy, rx, ry = rx * 0.26, o = 0.26) {
  const id = gid();
  return `<defs><radialGradient id="${id}">
      <stop offset="0%" stop-color="#4a3a2c" stop-opacity="${o}"/>
      <stop offset="55%" stop-color="#4a3a2c" stop-opacity="${n(o * 0.55)}"/>
      <stop offset="100%" stop-color="#4a3a2c" stop-opacity="0"/>
    </radialGradient></defs>` +
    `<ellipse class="${SHADOW}" cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"/>`;
}

/**
 * An inset panel — a door panel, a drawer front, a sunken pane.
 *
 * Light catches the top and left of a recess and the bottom and right fall
 * into shadow, which is the opposite of a raised boss. Two open strokes
 * rather than a whole second rectangle, so the panel keeps its own colour.
 */
export function inset(x, y, w, h, rx, o = {}) {
  const sw = o.sw ?? 2.4;
  const lo = o.light ?? 0.42, so = o.shade ?? 0.3;
  const r = Math.min(rx, w / 2, h / 2);
  return `<path d="M ${n(x + w - r)} ${n(y)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x)} ${n(y + r)} V ${n(y + h - r)}"
      fill="none" stroke="#000" stroke-opacity="${so}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M ${n(x + r)} ${n(y + h)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x + w)} ${n(y + h - r)} V ${n(y + r)}"
      fill="none" stroke="#fff" stroke-opacity="${lo}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

/** The same edge the other way up: a raised face, catching light on top. */
export function raised(x, y, w, h, rx, o = {}) {
  const sw = o.sw ?? 2.4;
  const lo = o.light ?? 0.5, so = o.shade ?? 0.26;
  const r = Math.min(rx, w / 2, h / 2);
  return `<path d="M ${n(x + w - r)} ${n(y)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x)} ${n(y + r)} V ${n(y + h - r)}"
      fill="none" stroke="#fff" stroke-opacity="${lo}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M ${n(x + r)} ${n(y + h)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x + w)} ${n(y + h - r)} V ${n(y + r)}"
      fill="none" stroke="#000" stroke-opacity="${so}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

/**
 * The bright streak on a pane of glass or the surface of water.
 * Angled with the light, and soft at both ends so it reads as a reflection
 * and not as a white stripe someone painted on.
 */
export function gloss(x, y, w, h, o = {}) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#fff" stop-opacity="${o.peak ?? 0.55}"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(o.rx ?? h / 2)}"
      fill="url(#${id})" transform="rotate(${o.rot ?? -22} ${n(x + w / 2)} ${n(y + h / 2)})"/>`;
}

/** Grain, kept inside the shape it belongs to rather than ruled across it. */
export function grain(x, y, w, h, rx, lines = 5, o = {}) {
  const id = gid();
  let out = `<defs><clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}"/></clipPath></defs>`;
  out += `<g clip-path="url(#${id})" opacity="${o.opacity ?? 0.5}">`;
  for (let i = 1; i <= lines; i++) {
    const t = i / (lines + 1);
    const gx = x + w * t;
    const wob = (i % 2 ? 1 : -1) * w * 0.035;
    out += `<path d="M ${n(gx)} ${n(y)} q ${n(wob)} ${n(h * 0.5)} 0 ${n(h)}"
       fill="none" stroke="${o.color ?? '#8a6340'}" stroke-opacity="${o.strength ?? 0.3}" stroke-width="${o.sw ?? 1.6}"/>`;
  }
  return out + '</g>';
}
