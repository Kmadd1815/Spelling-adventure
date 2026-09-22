/* Weather.

   One layer, two jobs. Indoors it goes behind a window, where a few pieces
   cross a pane of glass briskly. Outdoors it goes across the whole picture,
   where a skyful drifts slowly. The difference is entirely in the numbers,
   which is why they are arguments: a drift of thirty pixels reads as a
   breeze across a garden and as a gale across a windowpane.

   Every piece carries its own delay, duration, drift and spin, so a dozen
   of them never fall in step. The layer is hidden rather than frozen when
   motion is turned down — frozen weather is a row of dots stuck near the
   top, which looks broken rather than calm.
*/

import { el } from './dom.js';

export function weatherLayer(season, { pieces, dur = [9, 20], drift = 30 } = {}) {
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

