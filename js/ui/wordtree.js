/* Drawing the Word Tree.

   One SVG rather than three hundred positioned divs: at two hundred words
   this is two hundred leaves that all have to be laid out, drawn and
   listened to, and the browser does that far better inside one picture
   than as a pile of elements.

   WHAT GROWS AND WHAT DOES NOT. The trunk is planted and stays the size it
   is. The crown grows out of the top of it with every word, until it fills
   the frame — after that it stops spreading and starts getting denser,
   which is what an old tree does anyway. So forty words is a young tree
   with room around it and two hundred is a canopy from edge to edge, and
   the difference is visible at a glance from across the kitchen.

   THE SEASON TINTS IT AND NEVER STRIPS IT. Everywhere else in this app the
   winter is real: the window goes cold, the garden goes bare. Not here. A
   bare tree in January would take away every word she has earned and hand
   them back in March, and no amount of botanical honesty is worth that.
   Winter gets frost on green leaves.
*/

import { el } from './dom.js';
import { petLayers } from './petlife.js';
import { gid, SHADOW } from './shade.js';
import { surfaceStyle } from './item-art.js';
import { weatherLayer } from './weather.js';
import * as items from '../core/items.js';
import { currentSeason } from '../core/season.js';
import { canopyRadius, canopyScale, SPREAD } from '../core/wordtree.js';

/* The picture is 16:10, like the room and the garden. */
const W = 160, H = 100;
const GROUND = 80;          // where the grass starts
const TRUNK_X = 80;
const TRUNK_TOP = 58;
const CROWN = { x: TRUNK_X, y: 38 };
const FRAME = { fitX: 62, fitY: 29 };

/** A leaf is this wide in tree units before the crown is scaled, and this
    is its half-height: a leaf is about two and a half times as long as it
    is deep, which is why it reads as a leaf and not as a bubble. */
const LEAF_W = 12, LEAF_HH = 3.6;

const n = v => Math.round(v * 100) / 100;

/* Deterministic jitter, so a leaf sits at the same jaunty angle every time
   she opens the screen rather than twitching on every render. */
const wobble = (i, spread) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * spread;

/* ---------- Colour ----------

   Four or five leaf colours per season rather than one. A canopy in a
   single green is a shape; a canopy in five is a tree. */
const PALETTES = {
  spring: [['#a9e0bb', '#6cb98d'], ['#bfe9c9', '#7cc79a'], ['#97d9b0', '#5aa97d'],
           ['#f7c9dc', '#d492ae'], ['#cdeccf', '#88c79c']],
  summer: [['#8fd3a8', '#4f9b6d'], ['#a3dcb8', '#5aa97d'], ['#7cc79a', '#47905f'],
           ['#b3e5c6', '#69b98c'], ['#93d8ae', '#54a074']],
  fall:   [['#f4c06a', '#c88a3a'], ['#eda45c', '#bf7233'], ['#e5825c', '#b45638'],
           ['#f2d488', '#c9a349'], ['#dd9a52', '#a96c28']],
  winter: [['#a9d9bc', '#69ab8a'], ['#c2e4d0', '#83bda2'], ['#95cdae', '#5d9a7c'],
           ['#d8ecdf', '#9cc3b0'], ['#b5dfc6', '#76b294']],
};

/* The foliage behind the leaves. Without it the canopy is a scattering of
   words with sky between them and the branch ends poking out the sides —
   words near a tree rather than words ON one. This is the tree's own
   shadow of itself: darker than any leaf, so every leaf reads on top of
   it. */
/* The mass behind the leaves, which has to be DARKER than the leaves in
   front of it in every season. In fall it was the same tan as the leaves,
   and the whole crown came out as one brown cloud with words faintly
   printed on it. */
const MASS = {
  spring: ['#5fae7f', '#458c62'],
  summer: ['#4d9a6e', '#3a7a4e'],
  fall:   ['#a0631f', '#7a4715'],
  winter: ['#6aa288', '#50866f'],
};

/* A word that is due for a review is marked, and marked GENTLY: a pale
   ring and a dot, never a dead leaf. She has not lost the word — the app
   simply has not asked her about it for a month. */
const DUE_RING = '#e8a33c';

function leafSVG(leaf, size, palette) {
  const [light, dark] = palette[leaf.i % palette.length];
  const id = gid();
  const w = size, hh = size * (LEAF_HH / LEAF_W);
  const angle = n(-8 + wobble(leaf.i, 20));

  /* The word is fitted to the leaf it has to sit on, and when it still
     will not go — "temperature" on a canopy of three hundred — it is
     squeezed rather than cut off. A slightly condensed word is readable;
     half a word is not. */
  const font = n(Math.max(hh * 0.8, Math.min(hh * 1.24, (w * 0.72) / (leaf.text.length * 0.58))));
  const natural = font * 0.58 * leaf.text.length;
  const room = w * 0.74;
  const squeeze = natural > room
    ? ` textLength="${n(room)}" lengthAdjust="spacingAndGlyphs"` : '';

  /* Two quadratics meeting at the tips, so the leaf comes to a point at
     each end instead of bulging into a circle. */
  const shape = `M ${n(-w / 2)} 0 Q 0 ${n(-hh * 2)} ${n(w / 2)} 0 ` +
                `Q 0 ${n(hh * 2)} ${n(-w / 2)} 0 Z`;

  return `<g class="wt-leaf${leaf.due ? ' wt-due' : ''}" data-leaf="${leaf.id}"
             role="button" tabindex="0"
             aria-label="${leaf.text}${leaf.due ? ', ready for a check' : ''}"
             transform="translate(${n(leaf.x)} ${n(leaf.y)}) rotate(${angle})">
      <defs><linearGradient id="${id}" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
      </linearGradient></defs>
      <path d="${shape}" fill="url(#${id})" stroke="${leaf.due ? DUE_RING : dark}"
            stroke-width="${n(w * 0.05)}" stroke-linejoin="round"/>
      <path d="M ${n(-w * 0.42)} 0 H ${n(w * 0.42)}" stroke="${dark}"
            stroke-width="${n(w * 0.022)}" opacity=".4"/>
      <text x="0" y="${n(font * 0.34)}" text-anchor="middle" font-size="${font}"
            font-weight="700" fill="#2f4536" opacity=".95"${squeeze}>${escapeText(leaf.text)}</text>
      ${leaf.due ? /* Just off the tip, so it never lands on the word. */
        `<circle cx="${n(w * 0.6)}" cy="${n(-hh * 0.9)}" r="${n(w * 0.085)}"
                 fill="${DUE_RING}" stroke="#fff6e8" stroke-width="${n(w * 0.035)}"/>` : ''}
    </g>`;
}

/* The word comes off her spelling list, so it goes through the same door
   everything else does rather than into innerHTML as it stands. */
const escapeText = t => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- The tree itself ---------- */

/* Overlapping blobs rather than one ellipse: a canopy has a lumpy edge,
   and one smooth oval reads as a lollipop. The light is upper left like
   everything else, so the top-left blobs are the pale ones. */
function canopyMass(rx, ry, season) {
  const [light, dark] = MASS[season.key] || MASS.summer;
  const id = gid();
  const blobs = [[0, 0, 0.72], [-0.52, 0.06, 0.55], [0.52, 0.06, 0.55],
                 [-0.28, -0.34, 0.5], [0.3, -0.32, 0.5],
                 [-0.34, 0.36, 0.46], [0.36, 0.34, 0.46]];
  return `
    <defs><linearGradient id="${id}" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </linearGradient></defs>
    <g class="wt-mass" opacity=".82">
      ${blobs.map(([dx, dy, r]) =>
        `<ellipse cx="${n(CROWN.x + dx * rx)}" cy="${n(CROWN.y + dy * ry)}"
                  rx="${n(rx * r)}" ry="${n(ry * r * 1.05)}" fill="url(#${id})"/>`).join('')}
    </g>`;
}

function trunk() {
  const bark = gid(), barkDark = '#8a6340';
  return `
    <defs><linearGradient id="${bark}" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#c79a6d"/><stop offset="100%" stop-color="#8a6340"/>
    </linearGradient></defs>
    <path d="M ${TRUNK_X - 13} ${GROUND + 2}
             C ${TRUNK_X - 7} ${GROUND - 6} ${TRUNK_X - 6} ${TRUNK_TOP + 10} ${TRUNK_X - 5} ${TRUNK_TOP}
             L ${TRUNK_X + 5} ${TRUNK_TOP}
             C ${TRUNK_X + 6} ${TRUNK_TOP + 10} ${TRUNK_X + 7} ${GROUND - 6} ${TRUNK_X + 13} ${GROUND + 2} Z"
          fill="url(#${bark})" stroke="${barkDark}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M ${TRUNK_X - 2.5} ${GROUND - 2} C ${TRUNK_X - 1} ${GROUND - 16} ${TRUNK_X - 2} ${TRUNK_TOP + 12} ${TRUNK_X - 1.5} ${TRUNK_TOP + 4}"
          fill="none" stroke="${barkDark}" stroke-width="1.1" opacity=".5"/>
    <path d="M ${TRUNK_X + 2} ${GROUND - 4} C ${TRUNK_X + 3} ${GROUND - 18} ${TRUNK_X + 2} ${TRUNK_TOP + 14} ${TRUNK_X + 2.5} ${TRUNK_TOP + 6}"
          fill="none" stroke="${barkDark}" stroke-width=".9" opacity=".35"/>`;
}

/* Branches are worked out from how big the crown actually is, so they
   always reach into it and never poke out the top of a small one. */
function branches(reach) {
  const arms = [[-1, 0.95, 0.62], [1, 0.9, 0.66], [-1, 0.5, 0.9], [1, 0.45, 0.92], [0, 0, 1.02]];
  return arms.map(([side, spread, lift]) => {
    const ex = TRUNK_X + side * reach * spread;
    const ey = CROWN.y + (1 - lift) * 16;
    const mx = TRUNK_X + side * reach * spread * 0.4;
    const my = TRUNK_TOP - (TRUNK_TOP - ey) * 0.45;
    return `<path d="M ${TRUNK_X} ${TRUNK_TOP + 3} Q ${n(mx)} ${n(my)} ${n(ex)} ${n(ey)}"
                  fill="none" stroke="#9c7350" stroke-width="${n(2.6 - Math.abs(side) * 0.6)}"
                  stroke-linecap="round"/>`;
  }).join('');
}

/**
 * The whole scene.
 *
 * @param {object} opts
 * @param {Array}  opts.leaves    from core/wordtree.js
 * @param {string} [opts.petHTML]
 * @param {object} [opts.petProps]
 * @returns {HTMLElement}
 */
export function buildTree({ leaves = [], petHTML = '', petProps = {},
                            season = currentSeason() } = {}) {
  const scale = canopyScale(leaves.length, FRAME);
  const radius = canopyRadius(leaves.length) * scale;
  /* The layout's own spread, so the foliage is exactly the shape the
     leaves are arranged in. */
  const spreadX = radius * SPREAD.x + LEAF_W * scale * 0.55;
  const spreadY = radius * SPREAD.y + LEAF_HH * scale * 1.6;
  const reach = radius * SPREAD.x;
  const palette = PALETTES[season.key] || PALETTES.summer;
  const size = LEAF_W * scale;

  /* Drawn from the inside out, so the newest leaves — the outer ones —
     sit on top of the older growth. That is also the right way round for
     her: the word she mastered on Tuesday is the one in plain sight. */
  const foliage = leaves.map(leaf => leafSVG({
    ...leaf,
    x: CROWN.x + leaf.x * scale,
    y: CROWN.y + leaf.y * scale,
  }, size, palette)).join('');

  const svg = `
    <svg class="wt-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" aria-label="Your word tree">
      <ellipse class="${SHADOW}" cx="${TRUNK_X}" cy="${GROUND + 3}" rx="26" ry="5"
               fill="#3a2c1e" opacity=".14"/>
      ${branches(reach)}
      ${trunk()}
      ${canopyMass(spreadX, spreadY, season)}
      <g class="wt-canopy">${foliage}</g>
    </svg>`;

  /* Her own sky and her own grass, the ones she bought for the garden.
     This is through the gate at the end of it, not a different world. */
  const worn = items.equipped();
  const scene = el('div', { class: 'room wt-scene', 'data-season': season.key });

  const sky = el('div', { class: 'wt-sky' });
  Object.assign(sky.style, surfaceStyle(worn.sky || 'sky_day'));
  const grass = el('div', { class: 'wt-grass' });
  Object.assign(grass.style, surfaceStyle(worn.ground || 'ground_grass'));

  scene.append(sky, grass);
  /* And the same weather falling on it. */
  scene.append(weatherLayer(season));
  scene.append(el('div', { class: 'wt-art', html: svg }));

  const pet = el('div', { class: 'room-pet', ...petProps });
  pet.append(petLayers(petHTML));
  pet.style.position = 'absolute';
  pet.style.left = '28%';
  pet.style.bottom = '6%';
  pet.style.width = '20%';
  pet.style.zIndex = '6';
  scene.append(pet);

  scene.append(el('div', { class: 'room-light', style: { background: season.light } }));
  return scene;
}

/* ---------- The gate at the end of the garden ----------

   Shut it is still a gate rather than a wall, and there is a path leading
   to it: a way out that is plainly there and plainly not open yet is a
   reason to keep going. A blank hedge would just be a hedge.
*/
export function gateSVG(open = false) {
  const wood = gid(), leaf = gid(), post = gid();

  /* Both states are built from the same parts — two posts, a panel with
     two rails and a diagonal brace — so the open gate reads as the same
     gate that was shut a week ago rather than as a different drawing.
     The first attempt drew the open one as a narrow slat with two short
     lines across it and a loose stroke for the path, and at the size this
     is actually seen that came out as a broken plank next to a stray
     mark. */
  const panel = (d, rails, brace) => `
    <path d="${d}" fill="url(#${wood})" stroke="#8a6340" stroke-width="2.6"
          stroke-linejoin="round"/>
    ${rails.map(r => `<path d="${r}" stroke="#8a6340" stroke-width="2.2"
                            stroke-linecap="round"/>`).join('')}
    <path d="${brace}" stroke="#8a6340" stroke-width="2.4" stroke-linecap="round"/>`;

  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${wood}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#e0b183"/><stop offset="100%" stop-color="#a87f55"/>
        </linearGradient>
        <linearGradient id="${post}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#cfa274"/><stop offset="100%" stop-color="#93704a"/>
        </linearGradient>
        <linearGradient id="${leaf}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#8fd3a8"/><stop offset="100%" stop-color="#4f9b6d"/>
        </linearGradient>
      </defs>
      <ellipse class="${SHADOW}" cx="50" cy="93" rx="30" ry="5" fill="#3a2c1e" opacity=".15"/>

      <!-- the hedge the gate is set into -->
      <path d="M 6 92 V 46 A 44 44 0 0 1 94 46 V 92 Z" fill="url(#${leaf})"
            stroke="#3d7f5a" stroke-width="3" stroke-linejoin="round"/>
      <!-- what is beyond it: sky once the gate is open, hedge while it is not -->
      <path d="M 18 90 V 48 A 32 32 0 0 1 82 48 V 90 Z" fill="${open ? '#cfe9f5' : '#f3e6cd'}"
            stroke="#3d7f5a" stroke-width="2.4"/>

      ${open
        ? /* A path worn through the gap, drawn as ground rather than as a
             line: it is something you could walk on, and it reaches the
             bottom of the picture so it goes somewhere. */
          `<path d="M 38 90 L 52 71 L 63 71 L 78 90 Z" fill="#e6d5b4"
                 stroke="#d3bf9c" stroke-width="1" stroke-linejoin="round"/>
           <!-- the two posts it hangs between -->
           <path d="M 20 90 V 52 h 6 v 38 z" fill="url(#${post})" stroke="#8a6340" stroke-width="2.2"
                 stroke-linejoin="round"/>
           <path d="M 76 90 V 52 h 6 v 38 z" fill="url(#${post})" stroke="#8a6340" stroke-width="2.2"
                 stroke-linejoin="round"/>
           <!-- swung in on its hinge: the free edge is nearer, so it is the
                taller one -->
           ${panel('M 25 55 L 45 50 L 45 93 L 25 87 Z',
                   ['M 27 64 L 44 60', 'M 27 79 L 44 76'],
                   'M 27 85 L 44 57')}`
        : /* Shut across the opening, with a latch. */
          `<path d="M 20 90 V 52 h 6 v 38 z" fill="url(#${post})" stroke="#8a6340" stroke-width="2.2"
                 stroke-linejoin="round"/>
           <path d="M 76 90 V 52 h 6 v 38 z" fill="url(#${post})" stroke="#8a6340" stroke-width="2.2"
                 stroke-linejoin="round"/>
           ${panel('M 22 86 H 80 V 54 H 22 Z',
                   ['M 24 64 H 78', 'M 24 76 H 78'],
                   'M 24 84 L 78 56')}
           <circle cx="72" cy="70" r="3.4" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`}
    </svg>`;
}
