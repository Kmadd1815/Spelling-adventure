/* What the axolotl is holding.

   The poses were mime: it tipped forward at the plant with nothing in its
   hands, and nodded at the bookshelf with no book. A pose with no prop in
   it does not read as watering or reading — it reads as an axolotl
   wobbling, which is exactly what came back from the first version.

   So each pose that needs a thing gets one, drawn here, lit from the upper
   left like everything else, and held inside .pet-lean so it tips when the
   animal tips. They are small and simple on purpose: this is a prop in a
   two-second animation, not an item in the shop.
*/

import { gid } from './shade.js';

const wrap = inner =>
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

/* An open book, seen from the front: two pages tilted away from each
   other with a spine down the middle. */
function book() {
  const page = gid(), cover = gid();
  return wrap(`
    <defs>
      <linearGradient id="${page}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fffdf6"/><stop offset="100%" stop-color="#eadfc8"/>
      </linearGradient>
      <linearGradient id="${cover}" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stop-color="#8fc4e4"/><stop offset="100%" stop-color="#5d96bd"/>
      </linearGradient>
    </defs>
    <path d="M 8 78 L 8 34 Q 29 22 49 33 L 49 79 Q 29 68 8 78 Z" fill="url(#${cover})"/>
    <path d="M 92 78 L 92 34 Q 71 22 51 33 L 51 79 Q 71 68 92 78 Z" fill="url(#${cover})"/>
    <path d="M 13 73 L 13 37 Q 31 27 48 37 L 48 74 Q 31 64 13 73 Z" fill="url(#${page})"/>
    <path d="M 87 73 L 87 37 Q 69 27 52 37 L 52 74 Q 69 64 87 73 Z" fill="url(#${page})"/>
    ${[44, 52, 60].map(y =>
      `<path d="M 19 ${y} q 12 -5 24 -1" fill="none" stroke="#c3b296" stroke-width="2.4"
             stroke-linecap="round"/>
       <path d="M 57 ${y - 1} q 12 -4 24 1" fill="none" stroke="#c3b296" stroke-width="2.4"
             stroke-linecap="round"/>`).join('')}
    <path d="M 50 33 L 50 79" stroke="#4c7e9f" stroke-width="3" stroke-linecap="round"/>`);
}

/* A watering can, tipped the way the pose tips, with water coming out. */
function wateringCan() {
  const body = gid(), water = gid();
  return wrap(`
    <defs>
      <linearGradient id="${body}" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stop-color="#9ad3a8"/><stop offset="100%" stop-color="#5ca36f"/>
      </linearGradient>
      <linearGradient id="${water}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#bfe6f6"/><stop offset="100%" stop-color="#7cc4e8"/>
      </linearGradient>
    </defs>
    <rect x="30" y="34" width="44" height="40" rx="12" fill="url(#${body})"
          stroke="#47855a" stroke-width="3"/>
    <path d="M 40 34 q 12 -12 24 0" fill="none" stroke="#47855a" stroke-width="5"
          stroke-linecap="round"/>
    <path d="M 30 44 L 10 30 q -4 -3 -2 4 L 18 54 Z" fill="url(#${body})"
          stroke="#47855a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="11" cy="31" rx="6" ry="5" fill="#b7e0c1" stroke="#47855a" stroke-width="2.6"/>
    <rect x="36" y="40" width="16" height="7" rx="3.5" fill="#ffffff" opacity=".4"/>
    ${[[8, 44], [14, 50], [3, 52]].map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y + 12}" rx="2.6" ry="4" fill="url(#${water})"/>`).join('')}`);
}

/* A teacup on its saucer. */
function teacup() {
  const china = gid();
  return wrap(`
    <defs>
      <linearGradient id="${china}" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stop-color="#fffdfa"/><stop offset="100%" stop-color="#e6dbe9"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="78" rx="34" ry="9" fill="url(#${china})" stroke="#b49bbd" stroke-width="3"/>
    <path d="M 26 44 L 32 70 q 18 8 36 0 L 74 44 Z" fill="url(#${china})"
          stroke="#b49bbd" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="50" cy="44" rx="24" ry="7" fill="#f6e5ea" stroke="#b49bbd" stroke-width="3"/>
    <path d="M 74 50 q 14 2 10 12 q -3 7 -12 6" fill="none" stroke="#b49bbd" stroke-width="4"
          stroke-linecap="round"/>
    <path d="M 44 36 q 4 -8 -2 -14" fill="none" stroke="#ffffff" stroke-width="3"
          stroke-linecap="round" opacity=".85"/>
    <path d="M 56 34 q 4 -8 -2 -14" fill="none" stroke="#ffffff" stroke-width="3"
          stroke-linecap="round" opacity=".65"/>`);
}

/* One flower, held up to be smelled. */
function flower() {
  const petal = gid();
  return wrap(`
    <defs>
      <radialGradient id="${petal}" cx="38%" cy="34%" r="70%">
        <stop offset="0%" stop-color="#ffd0e2"/><stop offset="100%" stop-color="#ef9ab8"/>
      </radialGradient>
    </defs>
    <path d="M 50 92 q -6 -26 2 -42" fill="none" stroke="#5f9e63" stroke-width="5"
          stroke-linecap="round"/>
    <path d="M 52 70 q -16 -6 -20 -18 q 14 -2 21 10 Z" fill="#79b97c"/>
    ${[0, 72, 144, 216, 288].map(a =>
      `<ellipse cx="50" cy="26" rx="11" ry="16" fill="url(#${petal})"
                transform="rotate(${a} 50 42)"/>`).join('')}
    <circle cx="50" cy="42" r="9" fill="#f7cd5c"/>
    <circle cx="47" cy="39" r="3" fill="#ffe9a8" opacity=".9"/>`);
}

/* A ball, for the poses that are just playing. */
function ball() {
  const skin = gid();
  return wrap(`
    <defs>
      <radialGradient id="${skin}" cx="34%" cy="30%" r="72%">
        <stop offset="0%" stop-color="#ffe6a6"/><stop offset="100%" stop-color="#f0a84f"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="52" r="34" fill="url(#${skin})" stroke="#cf8534" stroke-width="3"/>
    <path d="M 20 42 q 30 14 60 0" fill="none" stroke="#cf8534" stroke-width="3"/>
    <path d="M 24 66 q 26 10 52 0" fill="none" stroke="#cf8534" stroke-width="3" opacity=".7"/>
    <ellipse cx="38" cy="36" rx="9" ry="6" fill="#ffffff" opacity=".45"/>`);
}

/* A magnifying glass, for having a proper look at something. */
function lens() {
  const glass = gid();
  return wrap(`
    <defs>
      <radialGradient id="${glass}" cx="34%" cy="30%" r="72%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/>
        <stop offset="100%" stop-color="#bfe0f0" stop-opacity=".7"/>
      </radialGradient>
    </defs>
    <path d="M 38 62 L 16 86" stroke="#9a6f4a" stroke-width="10" stroke-linecap="round"/>
    <circle cx="56" cy="40" r="28" fill="url(#${glass})" stroke="#b98a5c" stroke-width="7"/>
    <path d="M 40 30 q 8 -10 20 -11" fill="none" stroke="#ffffff" stroke-width="5"
          stroke-linecap="round" opacity=".9"/>`);
}

/* A heart, for a cuddle. */
function heart() {
  const skin = gid();
  return wrap(`
    <defs>
      <radialGradient id="${skin}" cx="36%" cy="30%" r="72%">
        <stop offset="0%" stop-color="#ffc0cd"/><stop offset="100%" stop-color="#e8798f"/>
      </radialGradient>
    </defs>
    <path d="M 50 84 C 16 60 14 36 30 26 C 41 19 50 28 50 34 C 50 28 59 19 70 26
             C 86 36 84 60 50 84 Z" fill="url(#${skin})" stroke="#c75e74" stroke-width="3"/>
    <ellipse cx="38" cy="38" rx="7" ry="5" fill="#ffffff" opacity=".5"
             transform="rotate(-28 38 38)"/>`);
}

const PROPS = {
  read: book,
  water: wateringCan,
  sip: teacup,
  sniff: flower,
  play: ball,
  peer: lens,
  cuddle: heart,
};

/**
 * The prop for a pose.
 * @param {string} pose
 * @returns {string} an <svg> string, or '' for a pose that holds nothing
 */
export function propSVG(pose) {
  const draw = PROPS[pose];
  return draw ? draw() : '';
}

/** Which poses carry something, for the tests. */
export const PROP_POSES = Object.keys(PROPS);
