/* The icons, drawn.

   Everything else in this app is hand-drawn SVG lit from the upper left.
   The games hub was the last screen still using system emoji, and emoji are
   the one thing in a design you do not control: they are the operating
   system's drawings, they look different on every device, and on the tablet
   this runs on they are Google's set — a different style, a different
   palette and a different light from everything around them. Eleven small
   drawings is a cheap price for the screen she opens most.

   Each one is a 48-unit square so they all optically match at any size, and
   each says what its thing is about rather than being decorative: the
   letters you hunt for, the gap you fill, the two spellings you choose
   between.
*/

import { litRect, litEllipse, litPath, contact } from './shade.js';

const n = v => Math.round(v * 100) / 100;

/* A letter tile, which several of the icons are built from. */
const tile = (x, y, w, h, ch, light, dark, line, size = 13) =>
  litRect(x, y, w, h, 4, light, dark, { stroke: line, sw: 2 }) +
  `<text x="${n(x + w / 2)}" y="${n(y + h / 2 + size * 0.35)}" text-anchor="middle"
         font-family="system-ui, sans-serif" font-weight="800" font-size="${size}"
         fill="${line}">${ch}</text>`;

const ICONS = {
  /* A magnifier over a grid of letters. */
  wordsearch: () => `
    ${litRect(5, 7, 30, 30, 5, '#fdf3e2', '#e7d5bb', { stroke: '#b89a73', sw: 2 })}
    ${[['S', 10, 17], ['P', 20, 17], ['E', 30, 17],
       ['L', 10, 27], ['L', 20, 27], ['A', 30, 27],
       ['B', 10, 36], ['C', 20, 36], ['D', 30, 36]].map(([ch, x, y]) =>
      `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, sans-serif"
             font-weight="800" font-size="9" fill="#b89a73">${ch}</text>`).join('')}
    <circle cx="28" cy="26" r="12" fill="#bfe6f5" fill-opacity=".55" stroke="#4d7f92" stroke-width="3"/>
    <circle cx="24" cy="22" r="4" fill="#ffffff" opacity=".55"/>
    <path d="M 37 35 L 44 42" stroke="#4d7f92" stroke-width="5" stroke-linecap="round"/>`,

  /* A line of writing with a gap in it. */
  fillgap: () => `
    ${litRect(4, 8, 40, 32, 5, '#fffdf7', '#e8dcc6', { stroke: '#b89a73', sw: 2 })}
    <path d="M 10 17 h 12 M 32 17 h 6 M 10 31 h 9 M 29 31 h 9"
          stroke="#cbb79a" stroke-width="3" stroke-linecap="round"/>
    ${litRect(24, 11, 6, 12, 2, '#ffe9a8', '#dcae44', { stroke: '#c9922c', sw: 2 })}
    <path d="M 22 36 h 12" stroke="#e2566f" stroke-width="3" stroke-linecap="round"/>`,

  /* Two spellings, a tick and a cross. */
  spotit: () => `
    ${litRect(4, 7, 40, 14, 4, '#e6f5e9', '#bedfc6', { stroke: '#4f9b6d', sw: 2 })}
    ${litRect(4, 27, 40, 14, 4, '#fdeaea', '#f3c7c7', { stroke: '#c25f5f', sw: 2 })}
    <path d="M 9 14 l 4 4 7 -8" fill="none" stroke="#4f9b6d" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 10 30 l 9 8 M 19 30 l -9 8" stroke="#c25f5f" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 26 14 h 13 M 26 34 h 13" stroke="#9a8b78" stroke-width="3" stroke-linecap="round"/>`,

  /* A crossword corner. */
  crossword: () => `
    ${[[6, 6], [18, 6], [30, 6], [18, 18], [18, 30], [30, 18], [6, 18]].map(([x, y]) =>
      litRect(x, y, 12, 12, 2, '#fffdf7', '#e3d5bd', { stroke: '#b89a73', sw: 2 })).join('')}
    <text x="24" y="15" text-anchor="middle" font-family="system-ui, sans-serif"
          font-weight="800" font-size="9" fill="#8a6f54">1</text>
    ${litRect(30, 30, 12, 12, 2, '#ffe9a8', '#dcae44', { stroke: '#c9922c', sw: 2 })}`,

  /* Jumbled letter blocks. */
  builder: () => `
    ${contact(24, 43, 17, 3, .2)}
    <g transform="rotate(-9 14 30)">${tile(6, 22, 16, 16, 'B', '#f7a8b8', '#d2768d', '#a8566b')}</g>
    <g transform="rotate(7 32 28)">${tile(25, 20, 16, 16, 'A', '#a8d4ef', '#6fa7cc', '#4b7fa0')}</g>
    <g transform="rotate(-3 23 14)">${tile(15, 5, 16, 16, 'C', '#ffe08a', '#dcae44', '#b4892c')}</g>`,

  /* Noughts and crosses, mid-game. */
  tictactoe: () => `
    <path d="M 18 6 V 42 M 30 6 V 42 M 6 18 H 42 M 6 30 H 42"
          stroke="#c9b396" stroke-width="3" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="4.6" fill="none" stroke="#e2566f" stroke-width="3.4"/>
    <path d="M 20 20 l 8 8 M 28 20 l -8 8" stroke="#4d7f92" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="36" cy="36" r="4.6" fill="none" stroke="#e2566f" stroke-width="3.4"/>`,

  /* A stopwatch. */
  sprint: () => `
    ${litEllipse(24, 27, 16, 16, '#fffdf7', '#dcd0bb', { stroke: '#8a7f6e', sw: 2.6 })}
    ${litRect(20, 4, 8, 6, 2, '#b8a894', '#8a7f6e', { stroke: '#6f6557', sw: 2 })}
    <path d="M 24 27 V 17 M 24 27 l 7 5" stroke="#5f5648" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="27" r="2.2" fill="#e2566f"/>
    <path d="M 36 13 l 5 -4" stroke="#8a7f6e" stroke-width="3.4" stroke-linecap="round"/>`,

  /* A pencil tracing a letter. */
  trace: () => `
    <path d="M 10 36 q 6 -26 14 -26 q 8 0 8 10 q 0 10 -10 10 h -6"
          fill="none" stroke="#e3d3b8" stroke-width="6" stroke-linecap="round"/>
    <path d="M 10 36 q 6 -26 14 -26 q 8 0 8 10"
          fill="none" stroke="#6fb3d9" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="3 5"/>
    <g transform="rotate(32 34 30)">
      ${litRect(30, 14, 8, 20, 2, '#ffd980', '#dcae44', { stroke: '#c9922c', sw: 2 })}
      <path d="M 30 34 h 8 l -4 7 z" fill="#f3c9a0" stroke="#b08557" stroke-width="1.6"/>
      <path d="M 32.4 39.5 h 3.2 l -1.6 2.6 z" fill="#5f5648"/>
    </g>`,

  /* The snake, with a letter in its path. */
  snake: () => `
    <path d="M 8 36 q 10 0 10 -9 q 0 -9 10 -9 q 10 0 10 -9"
          fill="none" stroke="#7fbd6d" stroke-width="8" stroke-linecap="round"/>
    <circle cx="38" cy="9" r="6" fill="#8cc87a" stroke="#4b8244" stroke-width="2"/>
    <circle cx="40" cy="7.5" r="1.4" fill="#3a2e28"/>
    <path d="M 44 10 l 4 1 -4 1" fill="none" stroke="#e2566f" stroke-width="1.8" stroke-linecap="round"/>
    ${litEllipse(13, 18, 7, 7, '#ffe9a8', '#dcae44', { stroke: '#c9922c', sw: 2 })}
    <text x="13" y="22" text-anchor="middle" font-family="system-ui, sans-serif"
          font-weight="800" font-size="9" fill="#a8762a">S</text>`,

  /* A tower of lettered blocks. */
  tower: () => `
    ${contact(24, 44, 18, 3, .22)}
    ${tile(10, 32, 28, 11, '', '#f7a8b8', '#d2768d', '#a8566b')}
    ${tile(12, 21, 24, 11, '', '#a8d4ef', '#6fa7cc', '#4b7fa0')}
    ${tile(14, 10, 20, 11, '', '#ffe08a', '#dcae44', '#b4892c')}
    <path d="M 24 10 V 5" stroke="#8a6f54" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 24 5 l 7 2 -7 2 z" fill="#e2566f"/>`,

  /* The axolotl, under a wave. */
  swim: () => `
    <path d="M 2 14 q 7 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 5 5 10 0"
          fill="none" stroke="#6fb3d9" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 2 22 q 7 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 5 5 10 0"
          fill="none" stroke="#a8d4ef" stroke-width="3" stroke-linecap="round"/>
    ${litEllipse(22, 34, 12, 10, '#fde9f1', '#f2849f', { stroke: '#b56a83', sw: 2.4 })}
    ${[-1, 1].map(side => `
      <path d="M ${22 + side * 10} 30 q ${side * 7} -3 ${side * 8} 3"
            fill="none" stroke="#f2849f" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <circle cx="18" cy="32" r="1.8" fill="#3a2e28"/>
    <circle cx="26" cy="32" r="1.8" fill="#3a2e28"/>
    <path d="M 19 37 q 3 3 6 0" fill="none" stroke="#b56a83" stroke-width="2" stroke-linecap="round"/>
    <path d="M 34 34 q 7 -3 8 4 q -5 2 -8 -4 z" fill="#fbd3e0" stroke="#b56a83" stroke-width="1.8"/>`,
};

/**
 * One game's icon.
 * @param {string} gameId
 * @param {number} [size]
 * @returns {string} an <svg> string, or '' if that game has no drawing
 */
export function gameIcon(gameId, size = 44) {
  const fn = ICONS[gameId];
  if (!fn) return '';
  return `<svg class="game-icon" viewBox="0 0 48 48" width="${size}" height="${size}"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${fn()}</svg>`;
}

/* ---------- The tiles on the home screen ----------

   The first screen she sees, and it was ten operating-system emoji in a
   row. Same treatment, same box, same light. */
const TILES = {
  practice: () => `
    ${contact(24, 42, 17, 3, .2)}
    ${litRect(8, 30, 32, 10, 2, '#f7a8b8', '#d2768d', { stroke: '#a8566b', sw: 2 })}
    ${litRect(6, 20, 34, 10, 2, '#a8d4ef', '#6fa7cc', { stroke: '#4b7fa0', sw: 2 })}
    ${litRect(10, 10, 30, 10, 2, '#ffe08a', '#dcae44', { stroke: '#b4892c', sw: 2 })}
    <path d="M 14 15 h 20 M 12 25 h 22 M 16 35 h 18"
          stroke="#ffffff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`,

  test: () => `
    ${litRect(7, 5, 30, 38, 4, '#fffdf7', '#e6d9c2', { stroke: '#b89a73', sw: 2 })}
    <path d="M 13 15 h 14 M 13 23 h 18 M 13 31 h 10"
          stroke="#cbb79a" stroke-width="2.6" stroke-linecap="round"/>
    <g transform="rotate(34 34 28)">
      ${litRect(31, 12, 7, 20, 2, '#ffd980', '#dcae44', { stroke: '#c9922c', sw: 2 })}
      <path d="M 31 32 h 7 l -3.5 6 z" fill="#f3c9a0" stroke="#b08557" stroke-width="1.5"/>
    </g>`,

  words: () => `
    ${litRect(5, 12, 38, 28, 4, '#ffe08a', '#dcae44', { stroke: '#b4892c', sw: 2 })}
    ${litRect(5, 8, 17, 8, 3, '#ffd05a', '#d9a32e', { stroke: '#b4892c', sw: 2 })}
    ${litRect(11, 18, 26, 18, 3, '#fffdf7', '#e6d9c2', { stroke: '#b89a73', sw: 1.8 })}
    <path d="M 16 24 h 16 M 16 30 h 11" stroke="#cbb79a" stroke-width="2.4" stroke-linecap="round"/>`,

  pet: () => `
    ${litEllipse(24, 28, 13, 11, '#fde9f1', '#f2849f', { stroke: '#b56a83', sw: 2.4 })}
    ${[-1, 1].map(side => `
      <path d="M ${24 + side * 11} 23 q ${side * 8} -4 ${side * 9} 3"
            fill="none" stroke="#f2849f" stroke-width="3.4" stroke-linecap="round"/>`).join('')}
    <circle cx="19" cy="26" r="2" fill="#3a2e28"/>
    <circle cx="29" cy="26" r="2" fill="#3a2e28"/>
    <path d="M 20 32 q 4 3.4 8 0" fill="none" stroke="#b56a83" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="24" cy="10" r="4" fill="#f7b8cb" opacity=".8"/>
    <circle cx="14" cy="14" r="3" fill="#f7b8cb" opacity=".65"/>
    <circle cx="34" cy="14" r="3" fill="#f7b8cb" opacity=".65"/>`,

  games: () => `
    ${litRect(4, 15, 40, 20, 9, '#8fbfe0', '#5f93b8', { stroke: '#426f90', sw: 2.4 })}
    <path d="M 14 25 h 8 M 18 21 v 8" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="32" cy="22" r="2.8" fill="#ffe08a"/>
    <circle cx="37" cy="28" r="2.8" fill="#f7a8b8"/>`,

  shop: () => `
    ${litPath('M 10 16 h 28 l -3 26 h -22 z', '#f7a8b8', '#d2768d',
              { stroke: '#a8566b', sw: 2.4, join: 'round' })}
    <path d="M 18 18 v -4 a 6 6 0 0 1 12 0 v 4"
          fill="none" stroke="#a8566b" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 14 24 h 20" stroke="#ffffff" stroke-opacity=".5" stroke-width="2.4"/>`,

  decorate: () => `
    ${contact(24, 43, 16, 3, .2)}
    ${litRect(12, 8, 24, 20, 4, '#c4a07a', '#9a7450', { stroke: '#7a5836', sw: 2.2 })}
    ${litRect(10, 26, 28, 7, 2, '#d9b88f', '#a8835c', { stroke: '#7a5836', sw: 2.2 })}
    <path d="M 14 33 v 9 M 34 33 v 9" stroke="#7a5836" stroke-width="3.4" stroke-linecap="round"/>`,

  progress: () => `
    ${litRect(7, 28, 9, 15, 2, '#f7a8b8', '#d2768d', { stroke: '#a8566b', sw: 2 })}
    ${litRect(19, 18, 9, 25, 2, '#a8d4ef', '#6fa7cc', { stroke: '#4b7fa0', sw: 2 })}
    ${litRect(31, 8, 9, 35, 2, '#8fd3a8', '#5aa87c', { stroke: '#3f7f5a', sw: 2 })}
    <path d="M 5 44 h 38" stroke="#b89a73" stroke-width="2.4" stroke-linecap="round"/>`,

  collection: () => `
    ${litPath('M 6 10 q 9 -4 18 2 v 28 q -9 -5 -18 -2 z', '#fdf3e2', '#e2cfae',
              { stroke: '#b89a73', sw: 2.2, join: 'round' })}
    ${litPath('M 42 10 q -9 -4 -18 2 v 28 q 9 -5 18 -2 z', '#fffdf7', '#e8dcc6',
              { stroke: '#b89a73', sw: 2.2, join: 'round' })}
    <path d="M 24 12 v 28" stroke="#b89a73" stroke-width="2.2"/>
    <path d="M 11 19 h 8 M 11 26 h 7 M 29 19 h 8 M 29 26 h 7"
          stroke="#cbb79a" stroke-width="2" stroke-linecap="round"/>`,

  grownups: () => `
    ${litRect(10, 21, 28, 21, 5, '#f6c453', '#dcae44', { stroke: '#b4892c', sw: 2.4 })}
    <path d="M 17 21 v -5 a 7 7 0 0 1 14 0 v 5"
          fill="none" stroke="#b4892c" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="24" cy="30" r="3.4" fill="#8a6b22"/>
    <path d="M 24 32 v 5" stroke="#8a6b22" stroke-width="3" stroke-linecap="round"/>`,
};

/**
 * One of the home screen's tile icons.
 * @param {string} name
 * @param {number} [size]
 * @returns {string} an <svg> string, or '' if there is no drawing by that name
 */
export function tileIcon(name, size = 36) {
  const fn = TILES[name];
  if (!fn) return '';
  return `<svg class="tile-icon" viewBox="0 0 48 48" width="${size}" height="${size}"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${fn()}</svg>`;
}

/** Which games and tiles have a drawing, for the tests. */
export const DRAWN = Object.keys(ICONS);
export const TILES_DRAWN = Object.keys(TILES);
