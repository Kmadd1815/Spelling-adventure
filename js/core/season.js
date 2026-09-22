/* Seasons change on their own, from the tablet's own clock.
   Nothing here needs a network call or a parent switch.

   A season is not a colour scheme — it is weather in her room. Each one
   carries what drifts through the air, how the light falls, what the view
   through the window looks like, and the sort of thing the axolotl says
   about the time of year.

   Everything here is data. Nothing seasonal is ever taken away from her:
   the season changes what the room looks like, never what she owns or what
   she can buy.
*/

export const SEASONS = {
  spring: {
    key: 'spring', name: 'Spring', emoji: '\u{1F338}',
    sky: '#dcecf7', land: '#d6ecc8',
    /* Seen through any window she has put up. */
    glass: '#cfe9f7',
    /* What drifts through the room, and how much of it. */
    weather: 'petals', pieces: 12,
    /* A wash of light over the room, strongest at the ceiling and gone by
       the floor, so her furniture keeps its own colours. Strong enough to
       read as a cold morning or a warm afternoon; not so strong that the
       room stops being the one she decorated. */
    light: 'linear-gradient(165deg, rgba(255,193,222,.30), rgba(176,226,180,.15) 55%, rgba(255,255,255,0) 85%)',
    lines: [
      'Everything is growing again!',
      'I saw a butterfly today.',
      'The blossom is out.',
      'Spring smells so good.',
    ],
  },

  summer: {
    key: 'summer', name: 'Summer', emoji: '☀️',
    sky: '#c9e6f8', land: '#bfe0ad',
    glass: '#bfe6f5',
    weather: 'motes', pieces: 10,
    light: 'linear-gradient(150deg, rgba(255,205,92,.32), rgba(255,240,190,.14) 52%, rgba(255,255,255,0) 84%)',
    lines: [
      'It is so warm today.',
      'Perfect weather for splashing.',
      'The days are lovely and long.',
      'I have been sunbathing.',
    ],
  },

  fall: {
    key: 'fall', name: 'Fall', emoji: '\u{1F342}',
    sky: '#e3e9ef', land: '#e0bf8a',
    glass: '#e8d9b8',
    weather: 'leaves', pieces: 11,
    light: 'linear-gradient(160deg, rgba(226,138,58,.26), rgba(240,196,120,.13) 55%, rgba(255,255,255,0) 85%)',
    lines: [
      'The leaves are falling!',
      'It is getting cosy out.',
      'I like the crunchy leaves.',
      'Everything has gone golden.',
    ],
  },

  winter: {
    key: 'winter', name: 'Winter', emoji: '❄️',
    sky: '#dfe9f2', land: '#f4f8fb',
    glass: '#dceaf6',
    weather: 'snow', pieces: 14,
    light: 'linear-gradient(170deg, rgba(146,192,236,.34), rgba(206,230,250,.17) 55%, rgba(255,255,255,0) 85%)',
    lines: [
      'It is snowing outside!',
      'Brr! Cosy in here though.',
      'Everything is so quiet in the snow.',
      'I love a frosty morning.',
    ],
  },
};

export function seasonForDate(date = new Date()) {
  const m = date.getMonth(); // 0 = January
  if (m >= 2 && m <= 4)  return SEASONS.spring;  // Mar–May
  if (m >= 5 && m <= 7)  return SEASONS.summer;  // Jun–Aug
  if (m >= 8 && m <= 10) return SEASONS.fall;    // Sep–Nov
  return SEASONS.winter;                         // Dec–Feb
}

export function currentSeason() {
  return seasonForDate();
}

/** Something the axolotl might say about the time of year. */
export function seasonLine(season = currentSeason()) {
  return season.lines[Math.floor(Math.random() * season.lines.length)];
}

/** Paints the seasonal colours into the CSS variables the scenery uses. */
export function applySeasonTheme(season = currentSeason()) {
  const root = document.documentElement;
  root.style.setProperty('--season-sky', season.sky);
  root.style.setProperty('--season-land', season.land);
  /* Windows read this, so every window she owns looks out on the same day
     without any of them knowing what month it is. */
  root.style.setProperty('--season-glass', season.glass);
  document.body.dataset.season = season.key;
}
