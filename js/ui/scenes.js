/* Where a game happens.

   Every game used to sit on a few stacked CSS gradients — pleasant enough,
   and all of them atmosphere rather than anything to look at. A background
   made of soft blobs is a background you stop seeing in about four seconds,
   which for a child is three and a half seconds too long.

   These are drawn instead: bunting actually strung on a string, lily pads
   with a notch cut out of them, fish with tails, jigsaw pieces with the
   right number of tabs. They are inline SVG tiles (see ui/shade.js) so
   there is still nothing to download and nothing to scale, and they are lit
   from the upper left like everything else in the app.

   Each scene is a base wash plus one or two bands of motif. The rule that
   keeps them from fighting the game on top: DETAIL LIVES AT THE EDGES. The
   middle of the board, where the letters and the clue card go, stays quiet,
   so the scene is something she notices between turns rather than something
   she has to read past.
*/

import { tile, tileGrad } from './shade.js';

/* ---------- Motifs ---------- */

/* Bunting on a real string, each flag hanging off it. */
const bunting = tile(180, 64,
  `<defs>${['#ef7f7f', '#f6c453', '#8fd3a8', '#6fb3d9', '#c9a3e0', '#f2849f']
     .map((c, i) => tileGrad('b' + i, c, c)).join('')}</defs>
   <path d='M 0 10 Q 45 30 90 16 T 180 10' fill='none' stroke='#a5875f' stroke-width='2.5'/>
   ${[12, 42, 72, 102, 132, 162].map((x, i) => {
     const y = 14 + Math.sin((x / 180) * Math.PI) * 10;
     return `<path d='M ${x - 11} ${y} L ${x + 11} ${y} L ${x} ${y + 26} Z'
               fill='${['#ef7f7f', '#f6c453', '#8fd3a8', '#6fb3d9', '#c9a3e0', '#f2849f'][i]}'
               stroke='rgba(90,64,40,.22)' stroke-width='1.4' stroke-linejoin='round'/>
             <path d='M ${x - 11} ${y} L ${x - 4} ${y} L ${x - 6} ${y + 17} Z'
               fill='#ffffff' opacity='.28'/>`;
   }).join('')}`);

/* Confetti, tumbling rather than sitting still: each piece at its own angle. */
const confettiTile = tile(150, 150,
  [[18, 26, 14, '#ef7f7f'], [62, 12, -28, '#f6c453'], [104, 34, 40, '#8fd3a8'],
   [136, 70, -16, '#6fb3d9'], [30, 78, 34, '#c9a3e0'], [78, 96, -42, '#f2849f'],
   [118, 122, 22, '#f6c453'], [24, 132, -34, '#8fd3a8'], [92, 58, 12, '#6fb3d9']]
    .map(([x, y, r, c]) =>
      `<rect x='${x}' y='${y}' width='11' height='7' rx='2.5' fill='${c}' opacity='.72'
         transform='rotate(${r} ${x + 5} ${y + 3})'/>`).join(''));

/* Lily pads, notched, with the shine on the side the light is on. */
const lilies = tile(200, 90,
  `<defs>${tileGrad('lp', '#8fd3a8', '#4f9b6d', true)}</defs>
   ${[[34, 56, 26], [110, 30, 19], [168, 64, 22]].map(([x, y, r]) =>
     `<path d='M ${x} ${y} m ${-r} 0 a ${r} ${r * 0.62} 0 1 1 ${r * 2} 0
               a ${r} ${r * 0.62} 0 1 1 ${-r * 2} 0 z
               M ${x} ${y} l ${r * 0.9} ${-r * 0.3} l 0 ${r * 0.6} z'
        fill='url(#lp)' stroke='#3f7a56' stroke-width='1.6' fill-rule='evenodd'/>
      <ellipse cx='${x - r * 0.35}' cy='${y - r * 0.2}' rx='${r * 0.3}' ry='${r * 0.14}'
        fill='#ffffff' opacity='.3'/>`).join('')}
   <circle cx='128' cy='62' r='6' fill='#f7bdd2'/><circle cx='128' cy='62' r='2.4' fill='#fff3c9'/>`);

/* Bubbles on their way up. */
const bubbles = tile(120, 200,
  [[18, 168, 7], [44, 112, 4.5], [78, 150, 9], [100, 64, 5.5], [30, 40, 6.5], [62, 20, 4]]
    .map(([x, y, r]) =>
      `<circle cx='${x}' cy='${y}' r='${r}' fill='none' stroke='#ffffff' stroke-opacity='.55' stroke-width='1.6'/>
       <circle cx='${x - r * 0.3}' cy='${y - r * 0.35}' r='${r * 0.26}' fill='#ffffff' opacity='.6'/>`).join(''));

/* Seaweed along the floor, leaning the same way as if in a current. */
const weed = tile(160, 110,
  [[20, 74, '#4f9b6d'], [52, 96, '#6bbf8c'], [96, 82, '#4f9b6d'], [132, 104, '#6bbf8c']]
    .map(([x, h, c]) =>
      `<path d='M ${x} 110 q -9 ${-h * 0.35} 2 ${-h * 0.6} q 10 ${-h * 0.3} -1 ${-h * 0.4}'
         fill='none' stroke='${c}' stroke-width='6' stroke-linecap='round' opacity='.85'/>`).join(''));

/* A couple of fish, always swimming the same way so the water has a flow. */
const fish = tile(260, 150,
  [[40, 40, 1, '#f7a94e'], [180, 100, 1.2, '#ef7f9f'], [110, 124, .8, '#6fb3d9']]
    .map(([x, y, s, c]) =>
      `<g transform='translate(${x} ${y}) scale(${s})' opacity='.8'>
         <ellipse cx='0' cy='0' rx='14' ry='8' fill='${c}'/>
         <path d='M -14 0 l -10 -7 v 14 z' fill='${c}'/>
         <circle cx='6' cy='-2' r='1.8' fill='#3a2e28'/>
         <path d='M -8 -6 q 8 -4 14 0' fill='none' stroke='#ffffff' stroke-opacity='.45' stroke-width='2'/>
       </g>`).join(''));

/* Flowers in the grass. */
const flowers = tile(190, 80,
  `<defs>${tileGrad('fp', '#fbd6e4', '#eda6c0', true)}${tileGrad('fy', '#ffeaa8', '#e8c35c', true)}</defs>
   ${[[24, 58, 'fp'], [70, 44, 'fy'], [118, 62, 'fp'], [164, 50, 'fy']].map(([x, y, g]) => {
     let p = `<path d='M ${x} 80 V ${y + 6}' stroke='#5f9e53' stroke-width='2.6' stroke-linecap='round'/>`;
     for (let k = 0; k < 5; k++) {
       const a = (k / 5) * Math.PI * 2;
       p += `<ellipse cx='${(x + Math.cos(a) * 5).toFixed(1)}' cy='${(y + Math.sin(a) * 5).toFixed(1)}'
               rx='4' ry='3.2' fill='url(#${g})'/>`;
     }
     return p + `<circle cx='${x}' cy='${y}' r='2.4' fill='#fff6e8'/>`;
   }).join('')}`);

/* Clouds with a flat bottom and a lit top, the way a child draws them and
   the way they actually look. A band of these keeps the meadow's sky from
   being a plain wash of blue across the middle of the screen. */
const clouds = tile(260, 110,
  `<defs>${tileGrad('cl', '#ffffff', '#dce9f2', true)}</defs>
   ${[[52, 34, 1], [168, 62, .72], [232, 26, .55]].map(([x, y, k]) => {
     const r = 20 * k;
     return `<g opacity='${(0.92 - (1 - k) * 0.25).toFixed(2)}'>
       <ellipse cx='${x}' cy='${y}' rx='${(r * 1.5).toFixed(1)}' ry='${(r * 0.72).toFixed(1)}' fill='url(#cl)'/>
       <circle cx='${(x - r * 0.62).toFixed(1)}' cy='${(y - r * 0.3).toFixed(1)}' r='${(r * 0.66).toFixed(1)}' fill='url(#cl)'/>
       <circle cx='${(x + r * 0.2).toFixed(1)}' cy='${(y - r * 0.6).toFixed(1)}' r='${(r * 0.8).toFixed(1)}' fill='url(#cl)'/>
       <circle cx='${(x + r * 0.86).toFixed(1)}' cy='${(y - r * 0.22).toFixed(1)}' r='${(r * 0.56).toFixed(1)}' fill='url(#cl)'/>
       <ellipse cx='${(x - r * 0.5).toFixed(1)}' cy='${(y - r * 0.62).toFixed(1)}'
         rx='${(r * 0.42).toFixed(1)}' ry='${(r * 0.2).toFixed(1)}' fill='#ffffff' opacity='.85'/>
     </g>`;
   }).join('')}`);

/* A hedge of round trees along the far side of the field. */
const treeline = tile(220, 96,
  `<defs>${tileGrad('tt', '#8fc97a', '#4e8b4a', true)}${tileGrad('tb', '#a78157', '#7a5a38', true)}</defs>
   ${[[40, 44, 1], [118, 54, .8], [186, 40, .92]].map(([x, y, k]) => {
     const r = 26 * k;
     return `<rect x='${(x - 4 * k).toFixed(1)}' y='${y}' width='${(8 * k).toFixed(1)}'
               height='${(96 - y).toFixed(1)}' rx='3' fill='url(#tb)'/>
             <circle cx='${x}' cy='${y - r * 0.55}' r='${r.toFixed(1)}' fill='url(#tt)'/>
             <circle cx='${(x - r * 0.7).toFixed(1)}' cy='${(y - r * 0.1).toFixed(1)}'
               r='${(r * 0.62).toFixed(1)}' fill='url(#tt)'/>
             <circle cx='${(x + r * 0.7).toFixed(1)}' cy='${(y - r * 0.14).toFixed(1)}'
               r='${(r * 0.58).toFixed(1)}' fill='url(#tt)'/>
             <ellipse cx='${(x - r * 0.4).toFixed(1)}' cy='${(y - r * 1.05).toFixed(1)}'
               rx='${(r * 0.4).toFixed(1)}' ry='${(r * 0.22).toFixed(1)}' fill='#ffffff' opacity='.3'/>`;
   }).join('')}`);

/* Exercise-book ruling, and a doodle where a child would doodle. */
const ruled = tile(60, 34,
  `<path d='M 0 33 H 60' stroke='#9fc4dd' stroke-opacity='.5' stroke-width='1.4'/>`);
const doodles = tile(320, 260,
  `${[[46, 60, 12], [268, 128, 9], [150, 226, 10]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.44 : r;
        d += `${i ? 'L' : 'M'} ${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `;
      }
      return `<path d='${d}Z' fill='none' stroke='#b9a184' stroke-opacity='.38' stroke-width='2'/>`;
    }).join('')}
   <path d='M 210 40 q 14 -16 28 0 t 28 0' fill='none' stroke='#b9a184' stroke-opacity='.3' stroke-width='2.2' stroke-linecap='round'/>
   <path d='M 60 180 q 12 14 26 0 t 26 0' fill='none' stroke='#b9a184' stroke-opacity='.28' stroke-width='2.2' stroke-linecap='round'/>`);

/* Jigsaw pieces — the shape of the game itself. One slot left empty. */
const jigsaw = (() => {
  const piece = (x, y, c, rot, hollow) => {
    /* A square with a tab on the right and a socket on the bottom: enough
       for it to read as a jigsaw piece at a glance. */
    const d = `M ${x} ${y} h 22 q 4 -7 9 0 h 22 v 22 q 7 4 0 9 v 22 h -53 z`;
    return hollow
      ? `<path d='${d}' fill='none' stroke='#c9b79c' stroke-opacity='.75' stroke-width='2.4'
           stroke-dasharray='6 5' transform='rotate(${rot} ${x + 26} ${y + 26})'/>`
      : `<path d='${d}' fill='${c}' opacity='.62' stroke='rgba(90,64,40,.2)' stroke-width='1.6'
           transform='rotate(${rot} ${x + 26} ${y + 26})'/>
         <path d='M ${x + 4} ${y + 4} h 16 v 4 h -16 z' fill='#ffffff' opacity='.4'
           transform='rotate(${rot} ${x + 26} ${y + 26})'/>`;
  };
  return tile(300, 240,
    piece(16, 20, '#8fd3a8', -12) + piece(196, 36, '#f6c453', 14) +
    piece(104, 150, '#6fb3d9', 8) + piece(228, 166, '#f2849f', -18) +
    piece(28, 138, '#c9a3e0', 20, true) + piece(146, 54, '#ef9f7f', -6, true));
})();

/* A curtain: folds, each one lit down one side, hung from a rail. */
const curtain = tile(110, 160,
  `<defs>${tileGrad('cu', '#d9607a', '#8e2f47', true)}${tileGrad('cr', '#b8506a', '#7a2a3e', true)}</defs>
   <rect x='0' y='0' width='110' height='160' fill='url(#cu)'/>
   ${[0, 26, 52, 78].map(x =>
     `<path d='M ${x + 8} 0 q 7 80 0 160 h 10 q 7 -80 0 -160 z' fill='#000000' opacity='.16'/>
      <path d='M ${x + 1} 0 q 5 80 0 160 h 4 q 5 -80 0 -160 z' fill='#ffffff' opacity='.16'/>`).join('')}
   <rect x='0' y='0' width='110' height='11' fill='url(#cr)'/>
   <rect x='0' y='0' width='110' height='3' fill='#ffffff' opacity='.22'/>`);

/* Little lights along the front of the stage. */
const footlights = tile(72, 30,
  `<defs>${tileGrad('fl', '#fff6c8', '#f3c95e', true)}</defs>
   <circle cx='20' cy='16' r='8.5' fill='url(#fl)'/>
   <circle cx='20' cy='16' r='14' fill='#ffe9a3' opacity='.28'/>
   <circle cx='17' cy='13' r='3' fill='#ffffff' opacity='.8'/>
   <circle cx='54' cy='19' r='6' fill='url(#fl)'/>
   <circle cx='54' cy='19' r='11' fill='#ffe9a3' opacity='.22'/>
   <circle cx='52' cy='17' r='2.2' fill='#ffffff' opacity='.8'/>`);

/* Wooden toy blocks, tipped out on the floor.

   No letters on them, deliberately. Letters in the background of a game
   whose foreground is letters on blocks means a child tapping the wallpaper
   and wondering why nothing happens. They are just blocks. */
const blocks = (() => {
  const cube = (x, y, size, rot, i) => {
    const c = ['#f0c078', '#e59a9a', '#8fc7d6', '#a9cf94', '#c9a9dd', '#f2c9a0'][i % 6];
    return `<g transform='rotate(${rot} ${x + size / 2} ${y + size / 2})' opacity='.5'>
      <rect x='${x}' y='${y}' width='${size}' height='${size}' rx='${size * 0.18}'
        fill='${c}' stroke='rgba(90,64,40,.22)' stroke-width='1.6'/>
      <rect x='${x + size * 0.12}' y='${y + size * 0.12}' width='${size * 0.76}'
        height='${size * 0.24}' rx='${size * 0.1}' fill='#ffffff' opacity='.38'/>
      <rect x='${x + size * 0.12}' y='${y + size * 0.56}' width='${size * 0.46}'
        height='${size * 0.16}' rx='${size * 0.07}' fill='rgba(90,64,40,.14)'/>
    </g>`;
  };
  return tile(420, 340,
    cube(26, 36, 46, -10, 0) + cube(150, 14, 34, 14, 1) + cube(330, 54, 42, -6, 2) +
    cube(64, 214, 38, 18, 3) + cube(242, 252, 48, -14, 4) + cube(370, 198, 32, 8, 5));
})();

/* A floor of boards, seen from the front. */
const planks = tile(120, 46,
  `<defs>${tileGrad('pk', '#e0b98a', '#bb8f5f', true)}</defs>
   <rect x='0' y='0' width='120' height='46' fill='url(#pk)'/>
   <path d='M 0 2 H 120 M 0 44 H 120' stroke='rgba(120,84,50,.35)' stroke-width='2'/>
   <path d='M 46 0 V 46 M 98 0 V 46' stroke='rgba(120,84,50,.28)' stroke-width='2'/>
   <path d='M 0 6 H 120' stroke='#ffffff' stroke-opacity='.28' stroke-width='2'/>`);

/* Chequered flag bunting, for the one game with a clock on it. */
const chequer = tile(64, 34,
  `<rect x='0' y='0' width='64' height='34' fill='#fdfaf2'/>
   ${[0, 1, 2, 3].map(c => [0, 1].map(r =>
     ((c + r) % 2 ? `<rect x='${c * 16}' y='${r * 17}' width='16' height='17' fill='#4a3b33'/>` : '')
   ).join('')).join('')}
   <rect x='0' y='31' width='64' height='3' fill='rgba(0,0,0,.18)'/>`);

/* Speed lines: the ground going past faster than it should. */
const streaks = tile(240, 120,
  [[10, 24, 92], [140, 52, 64], [56, 86, 120], [176, 104, 48], [96, 8, 54]]
    .map(([x, y, w]) =>
      `<rect x='${x}' y='${y}' width='${w}' height='6' rx='3' fill='#ffffff' opacity='.5'/>`).join(''));

/* The road, with the dashes down the middle of it. */
const road = tile(180, 88,
  `<defs>${tileGrad('rd', '#8d8f9c', '#5e6070', true)}</defs>
   <rect x='0' y='0' width='180' height='88' fill='url(#rd)'/>
   <rect x='0' y='0' width='180' height='4' fill='#ffffff' opacity='.28'/>
   <rect x='16' y='40' width='68' height='8' rx='4' fill='#ffe9a3'/>
   <rect x='112' y='40' width='68' height='8' rx='4' fill='#ffe9a3'/>`);

/* ---------- The scenes ---------- */

const SCENES = {
  /* An exercise book: ruled lines, a margin, and the doodles that end up in
     one by the middle of term. */
  paper: {
    backgroundColor: '#fdf6e8',
    backgroundImage: `${doodles}, ${ruled}, ` +
      'linear-gradient(90deg, rgba(239,127,127,.32) 0 2px, rgba(239,127,127,0) 2px 100%), ' +
      'radial-gradient(140% 90% at 50% -25%, rgba(255,255,255,.95) 0 45%, rgba(255,255,255,0) 75%)',
    backgroundSize: '320px 260px, 60px 34px, 100% 100%, 100% 100%',
    backgroundPosition: 'center, 0 0, 42px 0, 0 0',
    backgroundRepeat: 'repeat, repeat, no-repeat, no-repeat',
  },

  /* Bunting across the top and confetti still coming down. */
  party: {
    backgroundColor: '#ffeed8',
    backgroundImage: `${bunting}, ${confettiTile}, linear-gradient(180deg, #fff8ef, #fce3c6)`,
    backgroundSize: '180px 64px, 150px 150px, 100% 100%',
    backgroundPosition: 'top left, center, 0 0',
    backgroundRepeat: 'repeat-x, repeat, no-repeat',
  },

  /* Looking down at the pond: lily pads on the surface, bubbles rising. */
  pond: {
    backgroundColor: '#b6e0f1',
    backgroundImage: `${lilies}, ${bubbles}, ` +
      'linear-gradient(112deg, rgba(255,255,255,.22) 0 5%, rgba(255,255,255,0) 6% 17%, ' +
      'rgba(255,255,255,.16) 18% 23%, rgba(255,255,255,0) 24%), ' +
      'linear-gradient(180deg, #ddf2fc, #a4d5eb)',
    backgroundSize: '200px 90px, 120px 200px, 100% 100%, 100% 100%',
    backgroundPosition: 'bottom left, center, 0 0, 0 0',
    backgroundRepeat: 'repeat-x, repeat, no-repeat, no-repeat',
  },

  /* Hills, flowers and a sun: where the tower goes up. */
  meadow: {
    backgroundColor: '#eef7e8',
    backgroundImage: `${flowers}, ${treeline}, ${clouds}, ` +
      'radial-gradient(62% 30% at 20% 106%, #9ed087 0 100%, rgba(0,0,0,0) 100%), ' +
      'radial-gradient(72% 32% at 84% 110%, #8bc675 0 100%, rgba(0,0,0,0) 100%), ' +
      'radial-gradient(circle at 86% 13%, #fff3c0 0 34px, rgba(255,243,192,.5) 40px, transparent 62px), ' +
      'linear-gradient(180deg, #ddeffa 0%, #f0f8ea 72%)',
    backgroundSize: '190px 80px, 220px 96px, 260px 110px, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
    backgroundPosition: 'bottom left, bottom 58px left 30px, top 6px left, 0 0, 0 0, 0 0, 0 0',
    backgroundRepeat: 'repeat-x, repeat-x, repeat-x, no-repeat, no-repeat, no-repeat, no-repeat',
  },

  /* Under the water, where the swimming happens. */
  shore: {
    backgroundColor: '#cfeaf6',
    backgroundImage: `${weed}, ${fish}, ${bubbles}, ` +
      'radial-gradient(96% 18% at 50% 106%, #f1ddb8 0 100%, rgba(0,0,0,0) 100%), ' +
      'linear-gradient(180deg, #d9eefb, #a9d8ea)',
    backgroundSize: '160px 110px, 260px 150px, 120px 200px, 100% 100%, 100% 100%',
    backgroundPosition: 'bottom left, center, center, 0 0, 0 0',
    backgroundRepeat: 'repeat-x, repeat, repeat, no-repeat, no-repeat',
  },

  /* A racetrack: chequered flags along the top, the road at the bottom and
     the world going past in between. */
  race: {
    backgroundColor: '#dff0f8',
    backgroundImage:
      `${chequer}, ${road}, ` +
      'radial-gradient(60% 46% at 50% 48%, rgba(255,253,246,.94) 0 40%, rgba(255,253,246,0) 82%), ' +
      `${streaks}, ` +
      'radial-gradient(70% 26% at 50% 78%, #9ed087 0 100%, rgba(0,0,0,0) 100%), ' +
      'linear-gradient(180deg, #cfe9f7 0%, #eaf6fb 62%)',
    backgroundSize: '64px 34px, 180px 88px, 100% 100%, 240px 120px, 100% 100%, 100% 100%',
    backgroundPosition: 'top left, bottom left, 0 0, center, 0 0, 0 0',
    backgroundRepeat: 'repeat-x, repeat-x, no-repeat, repeat, no-repeat, no-repeat',
  },

  /* The floor of a playroom with the blocks tipped out on it. */
  blocks: {
    backgroundColor: '#f4ece0',
    backgroundImage:
      `${planks}, ` +
      'radial-gradient(52% 44% at 50% 46%, rgba(255,252,244,.96) 0 36%, rgba(255,252,244,0) 80%), ' +
      `${blocks}, ` +
      'linear-gradient(180deg, #eaf3f7 0%, #f6ede0 64%)',
    backgroundSize: '120px 46px, 100% 100%, 420px 340px, 100% 100%',
    backgroundPosition: 'bottom left, 0 0, center, 0 0',
    backgroundRepeat: 'repeat-x, no-repeat, repeat, no-repeat',
  },

  /* A little stage: curtains down both sides, two spotlights crossing, and
     footlights along the front. The right answer is the one in the light. */
  stage: {
    backgroundColor: '#2f2440',
    backgroundImage:
      `${curtain}, ${curtain}, ${footlights}, ` +
      'radial-gradient(38% 92% at 26% -8%, rgba(255,245,206,.5) 0 40%, rgba(255,245,206,0) 100%), ' +
      'radial-gradient(38% 92% at 74% -8%, rgba(214,235,255,.42) 0 40%, rgba(214,235,255,0) 100%), ' +
      'radial-gradient(58% 50% at 50% 48%, rgba(255,247,226,.9) 0 38%, rgba(255,247,226,.42) 72%, rgba(255,247,226,0) 100%), ' +
      'linear-gradient(180deg, #4a3560 0%, #6b4a72 58%, #8a5f6d 100%)',
    backgroundSize: '110px 160px, 110px 160px, 72px 30px, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
    backgroundPosition: 'top left, top right, bottom left, 0 0, 0 0, 0 0, 0 0',
    backgroundRepeat: 'repeat-y, repeat-y, repeat-x, no-repeat, no-repeat, no-repeat, no-repeat',
  },

  /* Fill the Gap: jigsaw pieces, some of them still missing. */
  jigsaw: {
    backgroundColor: '#fdf1e2',
    /* The veil goes on TOP of the pieces, not under them: it lifts a soft
       clearing out of the middle of the board for the sentence and the slot
       to sit in, and leaves the scattered pieces showing round the edges. */
    backgroundImage:
      'radial-gradient(62% 54% at 50% 54%, rgba(255,249,238,.94) 0 46%, rgba(255,249,238,0) 82%), ' +
      `${jigsaw}, ` +
      'radial-gradient(130% 80% at 50% -20%, rgba(255,255,255,.9) 0 40%, rgba(255,255,255,0) 72%), ' +
      'linear-gradient(180deg, #fff8ec, #f7e4cc)',
    backgroundSize: '100% 100%, 300px 240px, 100% 100%, 100% 100%',
    backgroundPosition: '0 0, center, 0 0, 0 0',
    backgroundRepeat: 'no-repeat, repeat, no-repeat, no-repeat',
  },
};

/** The style for a game's backdrop, or nothing if it has not got one. */
export const sceneStyle = name => SCENES[name] || null;
