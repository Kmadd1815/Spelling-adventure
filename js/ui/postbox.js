/* The postbox, and the paper the letters are written on.

   The postbox stands in the garden. Its flag is up when there is
   something to read and down when there is not, which is the whole state
   of the feature readable from across the room — the same job the gate's
   latch and the egg's cracks do.
*/

import { gid, SHADOW, litPath, litRect, litEllipse } from './shade.js';

/**
 * @param {object} opts
 * @param {boolean} [opts.open]     has she earned it yet
 * @param {boolean} [opts.waiting]  is there a letter in it
 */
export function postboxSVG({ open = false, waiting = false } = {}) {
  const body = gid(), post = gid();
  const red = ['#e8766c', '#c04e48'];
  const grey = ['#c3bdb4', '#8e887f'];
  const [light, dark] = open ? red : grey;

  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${body}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <linearGradient id="${post}" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#c79a6d"/><stop offset="100%" stop-color="#8a6340"/>
        </linearGradient>
      </defs>
      <ellipse class="${SHADOW}" cx="50" cy="95" rx="20" ry="4.5" fill="#3a2c1e" opacity=".16"/>

      <!-- the post it stands on -->
      <path d="M 44 96 V 58 h 12 v 38 z" fill="url(#${post})" stroke="#6f5133"
            stroke-width="2.4" stroke-linejoin="round"/>

      <!-- the box: a round-topped tunnel, which is what a postbox is -->
      <path d="M 16 62 V 40 A 24 22 0 0 1 84 40 V 62 Z" fill="url(#${body})"
            stroke="${dark}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M 24 58 V 41 A 17 16 0 0 1 58 41 V 58 Z" fill="#ffffff" opacity=".14"/>

      <!-- the slot -->
      <rect x="30" y="34" width="40" height="7" rx="3.5" fill="#4a3b32" opacity=".82"/>
      ${waiting
        /* A corner of paper sticking out. The flag says there is post; this
           says it from the other side of the garden. */
        ? `<path d="M 34 36 l 30 -3 -1 -9 -29 3 z" fill="#fdf6e6" stroke="#cbb894"
                 stroke-width="1.6" stroke-linejoin="round"/>`
        : ''}

      <!-- the flag, up when there is something to read -->
      <g transform="rotate(${waiting ? 0 : 58} 84 58)">
        <path d="M 84 58 V 20" stroke="#8e887f" stroke-width="3.4" stroke-linecap="round"/>
        ${litPath('M 84 21 h 17 l -5 6 5 6 h -17 z',
          waiting ? '#f6c453' : '#bdb6ac', waiting ? '#cf9a24' : '#8e887f',
          { stroke: waiting ? '#a87d18' : '#6f695f', sw: 1.8, join: 'round' })}
      </g>
    </svg>`;
}

/* The pen pal's portrait is the real axolotl drawing in a coat she has
   not got — see screens/letters.js. Hand-rolling a second, worse axolotl
   here was the first attempt and it looked exactly like what it was. The
   stamp's dashed edge is in the stylesheet, on .lt-stamp. */
