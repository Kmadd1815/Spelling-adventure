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

/* ---------- Shading a whole drawing at once ----------

   The helpers above are for a drawing being built: you hand them the same
   numbers the shape takes and they hand back the shape, already lit. That
   is the right way round for anything with a few big masses in it — a door,
   a bed, a tree.

   The long tail is different. A party hat, a snow globe, a string of fairy
   lights: dozens of small pieces each of which is correct as a flat colour,
   where redrawing every one by hand would take a week and change nothing
   anybody would name. What they need is volume, not detail.

   So this walks a finished drawing and gives every flat fill a gradient of
   its own. It is NOT the generic overlay that failed the first time this
   was tried — there is no sheen pasted across the top. Each gradient lives
   inside the shape it belongs to (an SVG gradient defaults to the element's
   own bounding box), so the light follows that shape's outline exactly, and
   round things get a round falloff while flat ones get a flat one.

   Three kinds of fill are deliberately left alone:

     pure white             a highlight is meant to be flat; shading it
                            turns it grey and dirty. Off-white is NOT a
                            highlight, it is a material — a chef's hat, a
                            pillow, a snowball — and it needs its shaded
                            side like anything else
     near-black             eyes, pupils, keyholes. A gradient on a 3px dot
                            is invisible at best and muddy at worst
     already a gradient     a drawing that has been shaded by hand stays
                            exactly as its author drew it
*/

/** #abc and #aabbcc to [r, g, b]. */
function rgb(hex) {
  const h = hex.length === 4
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex;
  return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
}

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, '0')).join('');

/** Towards white by k, or towards black by -k. */
const shift = (c, k) => hex(rgb(c).map(v => k > 0 ? v + (255 - v) * k : v * (1 + k)));

/** Roughly how bright a colour looks, 0 to 1. */
const lightness = c => {
  const [r, g, b] = rgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const FILL = /<(circle|ellipse|rect|path|polygon)\b([^>]*?)fill="(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})"/g;

/**
 * @param {string} svg   a drawing's markup
 * @param {object} [o]
 * @param {number} [o.lift]  how far the lit side goes towards white
 * @param {number} [o.sink]  how far the shaded side goes towards black
 */
export function shadeFills(svg, o = {}) {
  const lift = o.lift ?? 0.17, sink = o.sink ?? -0.16;
  const made = new Map();          // one gradient per colour per shape kind
  let defs = '';

  const out = svg.replace(FILL, (whole, tag, attrs, colour) => {
    const L = lightness(colour);
    if (L > 0.985 || L < 0.22) return whole;
    const round = tag === 'circle' || tag === 'ellipse';
    const key = colour.toLowerCase() + (round ? 'r' : 'f');
    if (!made.has(key)) {
      const id = gid();
      made.set(key, id);
      const light = shift(colour, lift), dark = shift(colour, sink);
      defs += round
        ? `<radialGradient id="${id}" cx="36%" cy="26%" r="82%">
             <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
           </radialGradient>`
        : `<linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">
             <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
           </linearGradient>`;
    }
    return `<${tag}${attrs}fill="url(#${made.get(key)})"`;
  });

  return defs ? `<defs>${defs}</defs>${out}` : out;
}

/**
 * The shadow a thing hanging on a wall throws onto the wall behind it.
 *
 * Built by redrawing the piece itself in flat dark and nudging it the way
 * the light points, so the shadow is the shape of the thing — a wreath's
 * shadow has a hole in the middle, a string of bunting's is a row of
 * triangles. A rounded rectangle behind everything, which is the usual
 * shortcut, gets all of those wrong in a way you notice without being able
 * to say why.
 *
 * A wall hanging sits close to the wall, so the offset is small and the
 * shadow keeps its edges rather than going soft.
 */
export function castShadow(svg, dx = 2.2, dy = 2.8, opacity = 0.17) {
  const flat = svg
    /* The copy has no gradients of its own, so its defs would only be dead
       ids — and the fills that pointed at them have to become flat dark. */
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/fill="(?!none")[^"]*"/g, 'fill="#3a2c1e"')
    .replace(/stroke="(?!none")[^"]*"/g, 'stroke="#3a2c1e"')
    .replace(/(fill|stroke)-opacity="[^"]*"/g, '')
    .replace(/opacity="[^"]*"/g, '');
  return `<g class="${SHADOW}" opacity="${opacity}" transform="translate(${dx} ${dy})">${flat}</g>${svg}`;
}
