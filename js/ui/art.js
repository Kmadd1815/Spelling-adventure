/* Hand-drawn SVG artwork.

   Everything visual in the app is generated here as SVG strings, so there
   are no image files to manage, nothing to download, and a new coat or
   growth stage is a few numbers rather than a new drawing.

   There is one animal, an axolotl, drawn from a handful of proportions so
   that every growth stage and every coat comes out of the same code. */

import { COATS, coatByKey, STAGES } from '../core/pet.js';
import { wearableSVG, BEHIND_BODY } from './item-art.js';

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

/** Point on a quadratic bezier — used to hang fronds along a gill stalk. */
function qPoint(p0, c, p1, t) {
  const m = 1 - t;
  return {
    x: m * m * p0.x + 2 * m * t * c.x + t * t * p1.x,
    y: m * m * p0.y + 2 * m * t * c.y + t * t * p1.y,
  };
}

/* Vertical position of each stalk's root, and how far its tip lifts. The
   top stalk sweeps up, the middle goes straight out, the bottom droops. */
const GILL_ROOT = [-0.44, -0.02, 0.38];
const GILL_LIFT = [0.46, 0.06, -0.30];

/**
 * One gill, in two passes. The dark pass draws every piece slightly larger
 * underneath, so the whole feathery shape ends up with a single clean
 * outline instead of a tangle of overlapping strokes.
 */
function gill(hx, hy, rx, ry, c, side, i, g, pass) {
  const dark = pass === 'under';
  const root = { x: hx + side * rx * 0.80, y: hy + ry * GILL_ROOT[i] };
  const len  = rx * 0.58 * g;
  const lift = ry * GILL_LIFT[i] * g;
  const tip  = { x: root.x + side * len, y: root.y - lift };
  const ctrl = { x: root.x + side * len * 0.45, y: root.y - lift * 1.5 - ry * 0.10 };

  const w = ry * 0.13 * g;
  const stalk = `<path d="M ${n(root.x)} ${n(root.y)} Q ${n(ctrl.x)} ${n(ctrl.y)} ${n(tip.x)} ${n(tip.y)}"
      fill="none" stroke="${dark ? c.dark : c.gill}" stroke-width="${n(dark ? w + 3.2 : w)}" stroke-linecap="round"/>`;

  const pad = dark ? 1.6 : 0;
  const puff = (cx, cy, r) =>
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + pad)}" fill="${dark ? c.dark : c.gill}"/>`;

  const mid = qPoint(root, ctrl, tip, 0.55);
  const R1 = ry * 0.17 * g, R2 = ry * 0.13 * g, R3 = ry * 0.12 * g, R4 = ry * 0.10 * g;

  return stalk
    + puff(mid.x, mid.y - ry * 0.13 * g, R4)
    + puff(tip.x, tip.y, R1)
    + puff(tip.x - side * ry * 0.15 * g, tip.y - ry * 0.14 * g, R2)
    + puff(tip.x - side * ry * 0.08 * g, tip.y + ry * 0.16 * g, R3);
}

/**
 * Draw the pet.
 * @param {object} opts
 * @param {object} opts.coat   a COATS entry
 * @param {object} opts.stage  a STAGES entry
 * @param {boolean} [opts.happy] a wider grin
 * @param {string} [opts.hat]       a worn hat's item id
 * @param {string} [opts.accessory] a worn accessory's item id
 * @returns {string} an <svg> string
 */
export function petSVG({ coat = COATS[0], stage = STAGES[0], happy = false,
                         hat = null, accessory = null } = {}) {
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

  // Paddle tail, sweeping out behind the body.
  const tail = `
    <path d="M ${n(bodyCx + bodyRx * 0.30)} ${n(bodyCy + bodyRy * 0.52)}
             Q ${n(bodyCx + bodyRx * 1.46)} ${n(bodyCy + bodyRy * 0.58)}
               ${n(bodyCx + bodyRx * 1.42)} ${n(bodyCy - bodyRy * 0.46)}
             Q ${n(bodyCx + bodyRx * 0.98)} ${n(bodyCy + bodyRy * 0.04)}
               ${n(bodyCx + bodyRx * 0.30)} ${n(bodyCy + bodyRy * 0.02)} Z"
          fill="${c.body}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
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
      ${bumps(c.body, 0)}`;
  };

  const foot = side => `<ellipse cx="${n(bodyCx + side * bodyRx * 0.40)}" cy="${n(bodyCy + bodyRy * 0.86)}"
      rx="${n(bodyRx * 0.22)}" ry="${n(bodyRy * 0.14)}" fill="${c.belly}" stroke="${c.dark}" stroke-width="2"/>`;

  // The grin. It spans most of the face and turns up at both ends — the
  // single most recognisable thing about an axolotl's expression.
  const grin = `<path d="M ${n(headCx - headRx * 0.40)} ${n(headCy + headRy * 0.16)}
             Q ${n(headCx)} ${n(headCy + headRy * (happy ? 0.74 : 0.58))}
               ${n(headCx + headRx * 0.40)} ${n(headCy + headRy * 0.16)}"
          fill="none" stroke="${c.dark}" stroke-width="2.8" stroke-linecap="round"/>`;

  const eye = side => `
    <circle cx="${n(headCx + side * headRx * 0.42)}" cy="${n(headCy - headRy * 0.16)}"
            r="${n(headRx * 0.072)}" fill="#3a2e28"/>
    <circle cx="${n(headCx + side * headRx * 0.42 + headRx * 0.026)}" cy="${n(headCy - headRy * 0.20)}"
            r="${n(headRx * 0.026)}" fill="#fff" opacity=".9"/>`;

  const nostril = side => `<circle cx="${n(headCx + side * headRx * 0.10)}" cy="${n(headCy + headRy * 0.06)}"
      r="${n(headRx * 0.022)}" fill="${c.dark}" opacity=".55"/>`;

  const sparkles = stage.sparkle ? `
    <g opacity=".92">
      <path d="M 22 70 l 4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#ffe9a8"/>
      <path d="M 180 106 l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#ffe9a8"/>
      <path d="M 168 60 l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#fff3cc"/>
    </g>` : '';

  return `
<svg class="pet-stage" viewBox="0 44 200 162" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="An axolotl">
  <ellipse cx="100" cy="${n(groundY)}" rx="${n(bodyRx * 0.82)}" ry="7" fill="#000" opacity=".10"/>
  ${sparkles}
  ${accBehind ? accArt : ''}
  ${tail}

  <!-- body -->
  <ellipse cx="${n(bodyCx)}" cy="${n(bodyCy)}" rx="${n(bodyRx)}" ry="${n(bodyRy)}"
           fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
  <ellipse cx="${n(bodyCx)}" cy="${n(bodyCy + bodyRy * 0.24)}" rx="${n(bodyRx * 0.58)}" ry="${n(bodyRy * 0.60)}"
           fill="${c.belly}" opacity=".85"/>
  ${arm(-1)}${arm(1)}
  ${foot(-1)}${foot(1)}

  <!-- gills, outlined underneath then filled over -->
  ${gillsUnder}
  ${gillsOver}

  <!-- head -->
  <ellipse cx="${n(headCx)}" cy="${n(headCy)}" rx="${n(headRx)}" ry="${n(headRy)}"
           fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>

  <ellipse cx="${n(headCx - headRx * 0.58)}" cy="${n(headCy + headRy * 0.26)}"
           rx="${n(headRx * 0.11)}" ry="${n(headRy * 0.085)}" fill="${c.gill}" opacity=".45"/>
  <ellipse cx="${n(headCx + headRx * 0.58)}" cy="${n(headCy + headRy * 0.26)}"
           rx="${n(headRx * 0.11)}" ry="${n(headRy * 0.085)}" fill="${c.gill}" opacity=".45"/>

  ${eye(-1)}${eye(1)}
  ${nostril(-1)}${nostril(1)}
  ${grin}

  ${accBehind ? '' : accArt}
  ${hatArt}
</svg>`;
}

/** A small round portrait, for the coat picker. */
export function petThumbSVG(coatKey) {
  const c = coatByKey(coatKey);
  const stalk = (side, i) => {
    const roots = [[-10, -9], [-2, -2], [8, 4]][i];
    const rx = 50 + side * 22, ry = 48 + roots[0];
    const tx = 50 + side * 40, ty = 48 + roots[1] - 6;
    return `<path d="M ${rx} ${ry} Q ${50 + side * 32} ${ry - 6} ${tx} ${ty}"
              fill="none" stroke="${c.dark}" stroke-width="7" stroke-linecap="round"/>
            <circle cx="${tx}" cy="${ty}" r="8" fill="${c.dark}"/>
            <path d="M ${rx} ${ry} Q ${50 + side * 32} ${ry - 6} ${tx} ${ty}"
              fill="none" stroke="${c.gill}" stroke-width="4" stroke-linecap="round"/>
            <circle cx="${tx}" cy="${ty}" r="6" fill="${c.gill}"/>`;
  };
  let gills = '';
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) gills += stalk(side, i);
  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="68" height="68" aria-hidden="true">
  <circle cx="50" cy="50" r="48" fill="${c.belly}"/>
  ${gills}
  <ellipse cx="50" cy="50" rx="30" ry="24" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
  <circle cx="37" cy="45" r="2.6" fill="#3a2e28"/>
  <circle cx="63" cy="45" r="2.6" fill="#3a2e28"/>
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
