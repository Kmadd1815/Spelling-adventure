/* Seasons change on their own, from the tablet's own clock.
   Nothing here needs a network call or a parent switch. */

export const SEASONS = {
  spring: { key: 'spring', name: 'Spring', emoji: '\u{1F338}', sky: '#dcecf7', land: '#d6ecc8' },
  summer: { key: 'summer', name: 'Summer', emoji: '☀️',  sky: '#c9e6f8', land: '#bfe0ad' },
  fall:   { key: 'fall',   name: 'Fall',   emoji: '\u{1F342}', sky: '#e3e9ef', land: '#e0bf8a' },
  winter: { key: 'winter', name: 'Winter', emoji: '❄️',  sky: '#dfe9f2', land: '#f4f8fb' },
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

/** Paints the seasonal colours into the CSS variables the scenery uses. */
export function applySeasonTheme(season = currentSeason()) {
  const root = document.documentElement;
  root.style.setProperty('--season-sky', season.sky);
  root.style.setProperty('--season-land', season.land);
  document.body.dataset.season = season.key;
}
