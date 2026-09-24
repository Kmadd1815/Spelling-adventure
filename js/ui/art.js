/* Hand-drawn SVG artwork.

   Everything visual in the app is generated here as SVG strings, so there
   are no image files to manage, nothing to download, and a new coat or
   growth stage is a few numbers rather than a new drawing.

   There is one animal, an axolotl, drawn from a handful of proportions so
   that every growth stage and every coat comes out of the same code.

   It is lit by the same light as everything else — ui/shade.js — from the
   upper left. A soft creature does not take the light the way a wooden door
   does, so almost none of that shading is flat: the head and body are
   spheres, and what sells them is not the highlight on top but the BOUNCE
   along the bottom edge, the light coming back up off the floor. Without it
   a round shape reads as a flat disc no matter how bright the top is. */

import { COATS, coatByKey, STAGES } from '../core/pet.js';
import { wearableSVG, BEHIND_BODY } from './item-art.js';
import { litEllipse, litPath, contact, SHADOW } from './shade.js';

const n = v => Math.round(v * 100) / 100;

/* ---------- The axolotl ----------

   What makes an axolotl read as an axolotl, in rough order of importance:
     - six feathery gill stalks, three fanning from each side of the head
     - a wide flat head, broader than it is tall
     - tiny dot eyes set high and very wide apart
     - the famous wide, permanently upturned grin
     - no visible nose, just two pin-prick nostrils
     - tiny stubby arms
     - a flat paddle tail
   The gills grow fuller with each stage, so growth is visible at a glance.
*/

/* ---------- Shading a soft animal ----------

   A door takes the light on one flat face. An axolotl does not: it is round
   and slightly translucent, so it needs four separate things, and leaving
   any one of them out is what made the first attempt look like a sticker
   with a gradient on it.

     sphere     the body colour, bright where the light lands, deepening
                away from it
     sheen      a soft bloom on the forehead, the shape of the forehead
     bounce     light coming back UP off the floor along the bottom edge.
                This is the one that matters. Without it a round shape reads
                as a flat disc however bright the top is
     softPatch  the pale belly, fading out instead of ending at a line

   Each takes a unique gradient id: many of these go on one page at once —
   the coat picker alone puts four up — and in SVG a url(#id) resolves to
   the first match in the whole document, so a shared id means the second
   axolotl quietly wears the first one's colours.
*/

let petUid = 0;
const pid = () => `pa${(++petUid).toString(36)}`;

/** A round body, lit from the upper left. */
function sphere(cx, cy, rx, ry, lit, mid, deep, o = {}) {
  const id = pid();
  return `<defs><radialGradient id="${id}" cx="36%" cy="24%" r="82%">
      <stop offset="0%" stop-color="${lit}"/>
      <stop offset="${n((o.top ?? 0.22) * 100)}%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"` +
    (o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 2.5}"` : '') + '/>';
}

/** The bloom where the light actually hits, soft at every edge. */
function sheen(cx, cy, rx, ry, strength = 0.42) {
  const id = pid();
  return `<defs><radialGradient id="${id}">
      <stop offset="0%" stop-color="#fff" stop-opacity="${strength}"/>
      <stop offset="60%" stop-color="#fff" stop-opacity="${n(strength * 0.5)}"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"
       transform="rotate(-12 ${n(cx)} ${n(cy)})"/>`;
}

/**
 * Light coming back up off the floor, caught along the bottom edge.
 *
 * Drawn as a clipped arc rather than a whole second ellipse, so it hugs the
 * silhouette exactly and cannot spill past it.
 */
function bounce(cx, cy, rx, ry, colour, strength = 0.5) {
  const clip = pid(), grad = pid();
  return `<defs>
      <clipPath id="${clip}"><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"/></clipPath>
      <linearGradient id="${grad}" x1="0%" y1="100%" x2="20%" y2="0%">
        <stop offset="0%" stop-color="${colour}" stop-opacity="${strength}"/>
        <stop offset="100%" stop-color="${colour}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"
       fill="none" stroke="url(#${grad})" stroke-width="${n(ry * 0.34)}" clip-path="url(#${clip})"/>`;
}

/** The pale belly, fading out rather than ending at a line. */
function softPatch(cx, cy, rx, ry, colour, strength = 0.9) {
  const id = pid();
  return `<defs><radialGradient id="${id}">
      <stop offset="0%" stop-color="${colour}" stop-opacity="${strength}"/>
      <stop offset="62%" stop-color="${colour}" stop-opacity="${n(strength * 0.82)}"/>
      <stop offset="100%" stop-color="${colour}" stop-opacity="0"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"/>`;
}

/** A cheek. The old one was a flat oval with a hard edge, which on a face
    reads as a sticker rather than as a blush. */
function blush(cx, cy, rx, ry, colour) {
  const id = pid();
  return `<defs><radialGradient id="${id}">
      <stop offset="0%" stop-color="${colour}" stop-opacity=".62"/>
      <stop offset="55%" stop-color="${colour}" stop-opacity=".40"/>
      <stop offset="100%" stop-color="${colour}" stop-opacity="0"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"/>`;
}

/** Point on a quadratic bezier — used to hang barbs along a gill stalk. */
function qPoint(p0, c, p1, t) {
  const m = 1 - t;
  return {
    x: m * m * p0.x + 2 * m * t * c.x + t * t * p1.x,
    y: m * m * p0.y + 2 * m * t * c.y + t * t * p1.y,
  };
}

/** Direction the stalk is heading at t — the barbs hang off its normal. */
function qTangent(p0, c, p1, t) {
  const m = 1 - t;
  return {
    x: 2 * m * (c.x - p0.x) + 2 * t * (p1.x - c.x),
    y: 2 * m * (c.y - p0.y) + 2 * t * (p1.y - c.y),
  };
}

/* Vertical position of each stalk's root, and how far its tip lifts. The
   top stalk sweeps up, the middle goes straight out, the bottom droops. */
const GILL_ROOT = [-0.44, -0.02, 0.38];
const GILL_LIFT = [0.46, 0.06, -0.30];

/* The feathering. An axolotl's gills are not antennae with knobs on the
   end — they are fronds, a central stalk with soft filaments down both
   sides, longest in the middle and swept back towards the tip. */
const BARBS = 9;          // filaments per side of a stalk
const SWEEP = 0.52;       // radians the filaments lean back towards the tip
const TAPER = 0.55;       // <1 keeps them full further along the stalk
const BARB_LEN = 0.28;    // longest filament, as a fraction of head height

/**
 * One gill, in two passes. The dark pass draws every piece slightly fatter
 * underneath, so the whole frond ends up inside a single clean outline
 * instead of a tangle of overlapping strokes.
 */
function gill(hx, hy, rx, ry, c, side, i, g, pass) {
  const dark = pass === 'under';
  const ink = dark ? c.dark : c.gill;
  const pad = dark ? 1.9 : 0;

  const root = { x: hx + side * rx * 0.80, y: hy + ry * GILL_ROOT[i] };
  const len  = rx * 0.62 * g;
  const lift = ry * GILL_LIFT[i] * g;
  const tip  = { x: root.x + side * len, y: root.y - lift };
  const ctrl = { x: root.x + side * len * 0.45, y: root.y - lift * 1.35 - ry * 0.09 };

  /* The stalk itself, thinning to a point. */
  let out = `<path d="M ${n(root.x)} ${n(root.y)} Q ${n(ctrl.x)} ${n(ctrl.y)} ${n(tip.x)} ${n(tip.y)}"
      fill="none" stroke="${ink}" stroke-width="${n(ry * 0.10 * g + pad)}" stroke-linecap="round"/>`;

  for (let k = 1; k <= BARBS; k++) {
    const t = k / (BARBS + 1);
    const p = qPoint(root, ctrl, tip, t);
    const tg = qTangent(root, ctrl, tip, t);
    const m = Math.hypot(tg.x, tg.y) || 1;
    const ux = tg.x / m, uy = tg.y / m;            // along the stalk
    /* Short at the root, short at the tip, fullest in between. */
    const bell = Math.sin(Math.PI * t) ** TAPER;
    const L = ry * BARB_LEN * g * bell;

    for (const s of [-1, 1]) {
      /* The stalk's normal, tilted back towards the tip. */
      const nx = -uy * s, ny = ux * s;
      const bx = nx * Math.cos(SWEEP) + ux * Math.sin(SWEEP);
      const by = ny * Math.cos(SWEEP) + uy * Math.sin(SWEEP);
      /* A slight inward pull on the control point gives each filament the
         gentle curl that makes the gill look soft rather than spiky. */
      out += `<path d="M ${n(p.x)} ${n(p.y)}
                       Q ${n(p.x + bx * L * 0.55 - ux * L * 0.12)} ${n(p.y + by * L * 0.55 - uy * L * 0.12)}
                         ${n(p.x + bx * L)} ${n(p.y + by * L)}"
                fill="none" stroke="${ink}" stroke-width="${n(ry * 0.055 * g + pad)}" stroke-linecap="round"/>`;
    }
  }

  return out;
}

/**
 * Draw the pet.
 * @param {object} opts
 * @param {object} opts.coat   a COATS entry
 * @param {object} opts.stage  a STAGES entry
 * @param {boolean} [opts.happy] a wider grin
 * @param {string} [opts.mood] calm | happy | excited | love | munch | sleepy
 * @param {boolean} [opts.alive] idle breathing, blinking and swaying gills
 * @param {string} [opts.hat]       a worn hat's item id
 * @param {string} [opts.accessory] a worn accessory's item id
 * @returns {string} an <svg> string
 */
export function petSVG({ coat = COATS[0], stage = STAGES[0], happy = false,
                         mood = null, alive = true,
                         hat = null, accessory = null } = {}) {
  if (!mood) mood = happy ? 'happy' : 'calm';
  const c = coat;
  const h = stage.headScale;
  const b = stage.bodyScale;
  const g = stage.gill ?? 1;

  const bodyCx = 100, bodyCy = 148;
  const bodyRx = 44 * b, bodyRy = 36 * b;

  const headRx = 46 * h, headRy = 36 * h;   // wider than tall
  const headCx = 100;
  const headCy = bodyCy - bodyRy - headRy + 22 * h;

  const groundY = bodyCy + bodyRy * 0.88 + 11;

  /* Everything she is wearing is measured as a fraction of the head and
     body, so one drawing per item fits every growth stage. */
  const geom = { hx: headCx, hy: headCy, hrx: headRx, hry: headRy,
                 bx: bodyCx, by: bodyCy, brx: bodyRx, bry: bodyRy, coat: c };
  const hatArt = hat ? wearableSVG(hat, geom) : '';
  const accArt = accessory ? wearableSVG(accessory, geom) : '';
  const accBehind = accessory && BEHIND_BODY.has(accessory);

  let gillsUnder = '', gillsOver = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      gillsUnder += gill(headCx, headCy, headRx, headRy, c, side, i, g, 'under');
      gillsOver  += gill(headCx, headCy, headRx, headRy, c, side, i, g, 'over');
    }
  }

  /* Paddle tail, sweeping out behind the body. It is the thinnest part of
     the animal, so it is also the part light gets through: pale at the
     trailing edge, the body's colour where it joins. */
  const tailId = pid();
  const tail = `
    <defs><linearGradient id="${tailId}" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="${c.body}"/>
      <stop offset="82%" stop-color="${c.body}"/>
      <stop offset="100%" stop-color="${c.belly}"/>
    </linearGradient></defs>`;
  const tailArt = `
    <path d="M ${n(bodyCx + bodyRx * 0.30)} ${n(bodyCy + bodyRy * 0.52)}
             Q ${n(bodyCx + bodyRx * 1.46)} ${n(bodyCy + bodyRy * 0.58)}
               ${n(bodyCx + bodyRx * 1.42)} ${n(bodyCy - bodyRy * 0.46)}
             Q ${n(bodyCx + bodyRx * 0.98)} ${n(bodyCy + bodyRy * 0.04)}
               ${n(bodyCx + bodyRx * 0.30)} ${n(bodyCy + bodyRy * 0.02)} Z"
          fill="url(#${tailId})" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M ${n(bodyCx + bodyRx * 1.02)} ${n(bodyCy + bodyRy * 0.40)}
             Q ${n(bodyCx + bodyRx * 1.26)} ${n(bodyCy + bodyRy * 0.14)}
               ${n(bodyCx + bodyRx * 1.22)} ${n(bodyCy - bodyRy * 0.28)}"
          fill="none" stroke="${c.belly}" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>`;

  // Tiny stubby arms, kept low so they never crowd the gills.
  const arm = side => {
    const ax = bodyCx + side * bodyRx * 0.62, ay = bodyCy + bodyRy * 0.22;
    const tx = bodyCx + side * bodyRx * 0.92, ty = bodyCy + bodyRy * 0.50;
    const w = bodyRy * 0.30;
    const hand = bodyRy * 0.20;
    // Three overlapping bumps read as a little mitten of fingers.
    const bumps = (fill, pad) => [0, 1, 2].map(k => `<circle
        cx="${n(tx + side * hand * 0.34 * (k - 1))}"
        cy="${n(ty + hand * 0.30 * Math.abs(k - 1))}"
        r="${n(hand * 0.62 + pad)}" fill="${fill}"/>`).join('');
    return `
      <path d="M ${n(ax)} ${n(ay)} L ${n(tx)} ${n(ty)}" stroke="${c.dark}"
            stroke-width="${n(w + 3.2)}" stroke-linecap="round"/>
      ${bumps(c.dark, 1.6)}
      <path d="M ${n(ax)} ${n(ay)} L ${n(tx)} ${n(ty)}" stroke="${c.body}"
            stroke-width="${n(w)}" stroke-linecap="round"/>
      ${bumps(c.body, 0)}
      <path d="M ${n(ax)} ${n(ay - w * 0.22)} L ${n(tx - side * w * 0.1)} ${n(ty - w * 0.26)}"
            stroke="${c.belly}" stroke-opacity=".55"
            stroke-width="${n(w * 0.38)}" stroke-linecap="round"/>`;
  };

  const foot = side => litEllipse(
    bodyCx + side * bodyRx * 0.40, bodyCy + bodyRy * 0.86, bodyRx * 0.22, bodyRy * 0.14,
    c.belly, c.body, { stroke: c.dark, sw: 2, cx: '38%', cy: '22%', r: '96%' });

  // The grin. It spans most of the face and turns up at both ends — the
  // single most recognisable thing about an axolotl's expression.
  const MOUTH_DROP = { calm: 0.58, happy: 0.74, excited: 0.86, love: 0.80, munch: 0.62, sleepy: 0.44 };
  const drop = MOUTH_DROP[mood] ?? 0.58;

  const grin = mood === 'munch'
    ? `<g class="pet-munch">
         <ellipse cx="${n(headCx)}" cy="${n(headCy + headRy * 0.34)}"
                  rx="${n(headRx * 0.20)}" ry="${n(headRy * 0.17)}" fill="${c.dark}"/>
         <ellipse cx="${n(headCx)}" cy="${n(headCy + headRy * 0.38)}"
                  rx="${n(headRx * 0.11)}" ry="${n(headRy * 0.09)}" fill="#e2566f"/>
       </g>`
    : `<path d="M ${n(headCx - headRx * 0.40)} ${n(headCy + headRy * 0.16)}
                Q ${n(headCx)} ${n(headCy + headRy * drop)}
                  ${n(headCx + headRx * 0.40)} ${n(headCy + headRy * 0.16)}"
             fill="none" stroke="${c.dark}" stroke-width="2.8" stroke-linecap="round"/>`
      + (mood === 'excited'
          ? `<ellipse cx="${n(headCx)}" cy="${n(headCy + headRy * 0.42)}"
                      rx="${n(headRx * 0.13)}" ry="${n(headRy * 0.12)}" fill="${c.dark}" opacity=".85"/>`
          : '');

  const eyeY = headCy - headRy * 0.16;
  const eyeR = headRx * 0.072;
  const wide = mood === 'excited';
  const shutAlways = mood === 'love' || mood === 'munch' || mood === 'sleepy';

  const openEye = side => {
    const cx = headCx + side * headRx * 0.42;
    const r = eyeR * (wide ? 1.5 : 1);
    return `<circle cx="${n(cx)}" cy="${n(eyeY)}" r="${n(r)}" fill="#3a2e28"/>
            <circle cx="${n(cx + r * 0.36)}" cy="${n(eyeY - r * 0.40)}" r="${n(r * 0.34)}" fill="#fff" opacity=".9"/>`;
  };

  /* A happy closed eye: the little upward arc that does most of the work of
     making a face look delighted. Sleepy curves the other way. */
  const shutEye = side => {
    const cx = headCx + side * headRx * 0.42;
    const w = eyeR * 1.7, h = eyeR * (mood === 'sleepy' ? -1.1 : 1.3);
    return `<path d="M ${n(cx - w)} ${n(eyeY + h * 0.4)} Q ${n(cx)} ${n(eyeY - h)} ${n(cx + w)} ${n(eyeY + h * 0.4)}"
                  fill="none" stroke="#3a2e28" stroke-width="${n(eyeR * 0.72)}" stroke-linecap="round"/>`;
  };

  const eyes = shutAlways
    ? `<g>${shutEye(-1)}${shutEye(1)}</g>`
    : `<g class="pet-eye-open">${openEye(-1)}${openEye(1)}</g>
       <g class="pet-eye-shut">${shutEye(-1)}${shutEye(1)}</g>`;

  const nostril = side => `<circle cx="${n(headCx + side * headRx * 0.10)}" cy="${n(headCy + headRy * 0.06)}"
      r="${n(headRx * 0.022)}" fill="${c.dark}" opacity=".55"/>`;

  const sparkles = stage.sparkle ? `
    <g opacity=".92">
      <path d="M 22 70 l 4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#ffe9a8"/>
      <path d="M 180 106 l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#ffe9a8"/>
      <path d="M 168 60 l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#fff3cc"/>
    </g>` : '';

  return `
<svg class="pet-stage${alive ? ' pet-alive' : ''}" data-mood="${mood}"
     viewBox="0 44 200 162" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="An axolotl">
  ${contact(100, groundY, bodyRx * 0.92, 8.5, .26)}
  ${sparkles}
  <g class="pet-breathe" style="transform-origin:${n(bodyCx)}px ${n(groundY)}px">
  ${accBehind ? accArt : ''}
  ${tail}
  <!-- The tail hangs off the body and swings from where it joins it, so it
       gets its own group: a tail that pivots anywhere else looks like a
       rudder being steered rather than a tail being wagged. -->
  <g class="pet-tail" style="transform-origin:${n(bodyCx + bodyRx * 0.30)}px ${n(bodyCy + bodyRy * 0.27)}px">
    ${tailArt}
  </g>

  <!-- body: a sphere, not a disc. The bounce light along the bottom is
       what makes the difference; the belly fades out rather than ending. -->
  ${sphere(bodyCx, bodyCy, bodyRx, bodyRy, c.belly, c.body, c.gill, { stroke: c.dark, sw: 2.5 })}
  ${softPatch(bodyCx, bodyCy + bodyRy * 0.28, bodyRx * 0.54, bodyRy * 0.50, c.belly, 0.82)}
  ${bounce(bodyCx, bodyCy, bodyRx, bodyRy, c.belly)}
  ${arm(-1)}${arm(1)}
  ${foot(-1)}${foot(1)}

  <!-- Everything above the neck, in one group so it can turn to look at
       something. It pivots at the neck, where a head actually turns. -->
  <g class="pet-head" style="transform-origin:${n(headCx)}px ${n(headCy + headRy)}px">

  <!-- gills, outlined underneath then filled over -->
  <g class="pet-gills" style="transform-origin:${n(headCx)}px ${n(headCy)}px">
    ${gillsUnder}
    ${gillsOver}
  </g>

  <!-- head. It overhangs the body, so it throws a shadow down onto it:
       that one shadow is most of what puts the two shapes in the same
       space rather than side by side on a sheet of paper. -->
  <ellipse class="${SHADOW}" cx="${n(headCx)}" cy="${n(headCy + headRy * 0.92)}"
           rx="${n(headRx * 0.82)}" ry="${n(headRy * 0.30)}" fill="${c.dark}" opacity=".20"/>
  ${sphere(headCx, headCy, headRx, headRy, '#ffffff', c.body, c.gill, { stroke: c.dark, sw: 2.5, top: 0.30 })}
  ${sheen(headCx - headRx * 0.28, headCy - headRy * 0.44, headRx * 0.36, headRy * 0.21)}
  ${bounce(headCx, headCy, headRx, headRy, c.belly)}

  ${blush(headCx - headRx * 0.58, headCy + headRy * 0.26, headRx * 0.14, headRy * 0.11, c.gill)}
  ${blush(headCx + headRx * 0.58, headCy + headRy * 0.26, headRx * 0.14, headRy * 0.11, c.gill)}

  ${eyes}
  ${nostril(-1)}${nostril(1)}
  ${grin}

  ${accBehind ? '' : accArt}
  ${hatArt}
  </g><!-- /pet-head -->
  </g>
</svg>`;
}

/**
 * A small round portrait, for the coat picker.
 *
 * It draws the same gills the animal itself has rather than its own
 * simplified pair — the picker used to show stalks with knobs on the end
 * long after the axolotl had grown proper fronds, which is exactly the kind
 * of drift a second drawing of the same thing always produces.
 */
export function petThumbSVG(coatKey) {
  const c = coatByKey(coatKey);
  const hx = 50, hy = 50, hrx = 30, hry = 24;
  let gills = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) gills += gill(hx, hy, hrx, hry, c, side, i, 0.9, 'under');
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) gills += gill(hx, hy, hrx, hry, c, side, i, 0.9, 'over');
  }
  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="68" height="68" aria-hidden="true">
  <circle cx="50" cy="50" r="48" fill="${c.belly}"/>
  ${gills}
  ${sphere(hx, hy, hrx, hry, '#ffffff', c.body, c.gill, { stroke: c.dark, sw: 2.5, top: 0.30 })}
  ${sheen(hx - hrx * 0.28, hy - hry * 0.44, hrx * 0.36, hry * 0.21)}
  ${bounce(hx, hy, hrx, hry, c.belly)}
  ${blush(hx - hrx * 0.58, hy + hry * 0.26, hrx * 0.16, hry * 0.13, c.gill)}
  ${blush(hx + hrx * 0.58, hy + hry * 0.26, hrx * 0.16, hry * 0.13, c.gill)}
  <circle cx="37" cy="45" r="2.6" fill="#3a2e28"/>
  <circle cx="63" cy="45" r="2.6" fill="#3a2e28"/>
  <circle cx="37.9" cy="44.1" r="0.9" fill="#fff" opacity=".9"/>
  <circle cx="63.9" cy="44.1" r="0.9" fill="#fff" opacity=".9"/>
  <path d="M 38 53 Q 50 64 62 53" fill="none" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;
}

/** The star the reward chips use, so stars look the same everywhere. */
export function starSVG(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
          fill="#f6c453" stroke="#dda93c" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------- The friend ----------

   A duckling, and an egg for it to come out of. Drawn here rather than in
   item-art.js because it is an animal, not an ornament: it wants the same
   sphere, sheen and bounce the axolotl gets, and those live in this file.

   What makes a duckling read as a duckling, in rough order:
     - a round body with a smaller round head sitting right on it, no neck
     - a wide flat bill, low on the face
     - one big eye, high
     - a tiny wing tucked on the side
     - two orange webbed feet, small and far apart

   Same 200-wide viewBox as the axolotl so the two can stand on the same
   floor and be sized against each other honestly.
*/

const DUCK = {
  body:  '#f7d774',
  lit:   '#fdf0c4',
  deep:  '#e0b449',
  dark:  '#b88c32',
  bill:  '#f5a742',
  billDark: '#c87d24',
  foot:  '#f09a3a',
};

/**
 * @param {object} opts
 * @param {'calm'|'happy'|'peep'} [opts.mood]
 * @param {boolean} [opts.alive]  breathing and blinking
 */
export function friendSVG({ mood = 'calm', alive = true } = {}) {
  const c = DUCK;
  const bodyCx = 100, bodyCy = 150;
  const bodyRx = 42, bodyRy = 38;
  const headRx = 30, headRy = 28;
  const headCx = 86;
  const headCy = bodyCy - bodyRy - headRy + 30;
  const groundY = bodyCy + bodyRy * 0.92 + 8;

  const open = mood === 'peep';
  const billLip = open ? 8 : 12;      // the bill's lower edge, dropped when it peeps

  /* The bill: a rounded wedge, low on the face and wider than it is tall.
     Open, the lower half drops and shows a little inside. */
  const bill = `
    ${open ? `<path d="M ${headCx - 30} ${headCy + 10}
                       Q ${headCx - 46} ${headCy + 22} ${headCx - 27} ${headCy + 24}
                       Q ${headCx - 14} ${headCy + 24} ${headCx - 12} ${headCy + 12} Z"
                    fill="${c.billDark}" stroke="${c.billDark}" stroke-width="2"
                    stroke-linejoin="round"/>` : ''}
    ${litPath(`M ${headCx - 11} ${headCy + 2}
               Q ${headCx - 30} ${headCy - 6} ${headCx - 40} ${headCy + 3}
               Q ${headCx - 34} ${headCy + 13} ${headCx - 11} ${headCy + billLip} Z`,
      '#fbc06a', c.bill, { stroke: c.billDark, sw: 2.2, join: 'round' })}
    <path d="M ${headCx - 34} ${headCy + 1} q 8 -3 16 -1" fill="none"
          stroke="#fff" stroke-opacity=".45" stroke-width="2.6" stroke-linecap="round"/>`;

  const eyeY = headCy - 6;
  const eyeX = headCx - 6;
  const eye = `
    <ellipse class="pet-eye" cx="${eyeX}" cy="${eyeY}" rx="5.2" ry="${mood === 'happy' ? 3.4 : 5.6}"
             fill="#3b2f26"/>
    <circle cx="${eyeX - 1.8}" cy="${eyeY - 2.2}" r="1.9" fill="#fff" opacity=".9"/>`;

  /* A curl of down on the crown — the one detail that turns a yellow ball
     into a baby bird. */
  const tuft = `
    <path d="M ${headCx + 4} ${headCy - headRy + 2}
             q 3 -12 12 -10 q -6 3 -6 11" fill="${c.body}"
          stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>`;

  /* A wing, tucked and pointing back — the first version was a rounded
     rectangle on the side, which reads as a pocket. */
  const wing = `
    ${litPath(`M ${bodyCx + 2} ${bodyCy - 12}
               Q ${bodyCx + 30} ${bodyCy - 14} ${bodyCx + 36} ${bodyCy + 12}
               Q ${bodyCx + 20} ${bodyCy + 14} ${bodyCx + 6} ${bodyCy + 4} Z`,
      c.lit, c.deep, { stroke: c.dark, sw: 2.2, join: 'round' })}
    <path d="M ${bodyCx + 10} ${bodyCy - 6} Q ${bodyCx + 24} ${bodyCy - 4} ${bodyCx + 31} ${bodyCy + 9}"
          fill="none" stroke="${c.dark}" stroke-width="1.8" opacity=".45" stroke-linecap="round"/>
    <path d="M ${bodyCx + 9} ${bodyCy + 1} Q ${bodyCx + 20} ${bodyCy + 3} ${bodyCx + 26} ${bodyCy + 11}"
          fill="none" stroke="${c.dark}" stroke-width="1.5" opacity=".3" stroke-linecap="round"/>`;

  const foot = dx => `
    <path d="M ${bodyCx + dx} ${groundY - 9}
             l -7 9 h 14 z" fill="${c.foot}" stroke="${c.billDark}"
          stroke-width="2" stroke-linejoin="round"/>`;

  return `
<svg class="pet-stage friend-stage${alive ? ' pet-alive' : ''}" data-mood="${mood}"
     viewBox="0 44 200 162" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="A duckling">
  ${contact(bodyCx, groundY, bodyRx * 0.8, 7, .24)}
  <g class="pet-breathe" style="transform-origin:${bodyCx}px ${groundY}px">
    ${foot(-14)}${foot(12)}
    ${sphere(bodyCx, bodyCy, bodyRx, bodyRy, c.lit, c.body, c.deep, { stroke: c.dark, sw: 2.4 })}
    ${softPatch(bodyCx, bodyCy + bodyRy * 0.3, bodyRx * 0.5, bodyRy * 0.45, c.lit, 0.8)}
    ${bounce(bodyCx, bodyCy, bodyRx, bodyRy, c.lit, 0.55)}
    ${wing}
    ${sphere(headCx, headCy, headRx, headRy, c.lit, c.body, c.deep, { stroke: c.dark, sw: 2.4 })}
    ${sheen(headCx - 8, headCy - 12, 14, 10, 0.5)}
    ${bounce(headCx, headCy, headRx, headRy, c.lit, 0.45)}
    ${tuft}
    ${bill}
    ${eye}
    ${blush(headCx - 16, headCy + 9, 7, 4.5, '#f0a0a8')}
  </g>
</svg>`;
}

/**
 * The egg, with `cracks` of them showing: 0 whole, 3 about to go.
 */
export function eggSVG({ cracks = 0 } = {}) {
  const shell = '#fffaf0', shellMid = '#f8ecd2', shellDeep = '#e2d0ab', line = '#af9771';
  /* Big. It is the only thing in the room she is being asked to tap, and a
     small dull egg on a patterned floor is something she walks past. */
  const cx = 100, cy = 148, rx = 42, ry = 54;

  /* Speckles, in fixed places rather than random ones: an egg that
     re-speckles itself every time the screen redraws is a different egg
     each time she looks at it. */
  const speckles = [[-15, -22, 3.6], [10, -30, 2.8], [18, 2, 3.4], [-20, 10, 3],
                    [3, 20, 2.6], [-5, -3, 2.1], [22, -13, 2.3], [-9, 30, 2.4]]
    .map(([dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}"
                                   fill="${line}" opacity=".26"/>`).join('');

  /* Each crack is drawn once and stays put, so tapping adds a crack rather
     than rearranging the ones already there. */
  const CRACKS = [
    `M ${cx - 30} ${cy - 8} l 12 9 -8 11 13 8`,
    `M ${cx + 30} ${cy + 2} l -13 8 9 12 -12 7`,
    `M ${cx - 8} ${cy - 40} l 10 12 -11 9 12 11`,
  ];
  const shown = CRACKS.slice(0, Math.max(0, Math.min(3, cracks)))
    .map(d => `<path d="${d}" fill="none" stroke="#8d7550" stroke-width="4"
                     stroke-linecap="round" stroke-linejoin="round"/>
               <path d="${d}" fill="none" stroke="#fffdf6" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" opacity=".75"
                     transform="translate(-1.4 -1.4)"/>`).join('');

  return `
<svg class="egg-stage" data-cracks="${cracks}"
     viewBox="0 44 200 162" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="An egg">
  ${contact(cx, cy + ry * 0.94, rx * 0.8, 6, .24)}
  <g class="egg-wobble" style="transform-origin:${cx}px ${cy + ry}px">
    ${sphere(cx, cy, rx, ry, shell, shellMid, shellDeep, { stroke: line, sw: 2.4 })}
    ${speckles}
    ${sheen(cx - 10, cy - 18, 12, 16, 0.55)}
    ${bounce(cx, cy, rx, ry, shell, 0.5)}
    ${shown}
  </g>
</svg>`;
}
