/* The four seasons.

   The room reads the tablet's own clock, so each season is tested on a
   real date inside it with the clock faked.

   What it holds down: the weather is IN the window and nowhere else
   indoors, it actually crosses the pane rather than parking above it, the
   glass takes the day's colour — and, the subtle one, that blanking the
   glass for the window in her room has not blanked every other copy of the
   same drawing on the shop shelf.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const browser = await chromium.launch();
const errs = [];
const hexToRgb = h => {
  const n = parseInt(h.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const WORDS = ['train','paint','afraid','explain','brain','chain'];
const SEED = rows => {
  localStorage.clear();
  const now = Date.now();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map((text, i) => ({ id: 'w' + i, listId: 'l1', text, definition: '', sentence: '',
      hint: '', tags: [], attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
      lastCorrect: null, lastMissed: null, masteredAt: null, createdAt: now })),
    progress: { stars: 900, lastBackupAt: now, lastBackupMastered: 0 },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood', window: 'window_cottage',
      door: 'door_wood', bed: 'bed_cozy', rug: 'rug', hat: null, accessory: null,
      wallDecor: ['frame'], floorDecor: ['potted_plant'] },
    collection: { items: ['window_cottage','door_wood','bed_cozy','rug','frame','potted_plant']
      .map((id, i) => ({ id: 'o' + i, itemId: id, source: 'test', earnedAt: now })) } }));
};

/* ---------- each season, on a real date inside it ---------- */
const DAYS = [['spring','2027-04-15'], ['summer','2027-07-15'],
              ['fall','2026-10-15'], ['winter','2027-01-15']];
const WEATHER = { spring: 'petals', summer: 'motes', fall: 'leaves', winter: 'snow' };

for (const [key, day] of DAYS) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(`(() => {
    const Real = Date;
    const shift = new Real('${day}T12:00:00').getTime() - Real.now();
    class Fake extends Real {
      constructor(...a) { if (!a.length) super(Real.now() + shift); else super(...a); }
      static now() { return Real.now() + shift; }
    }
    window.Date = Fake;
  })()`);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(`PAGEERROR(${key}): ` + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(`CONSOLE(${key}): ` + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, WORDS);
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const seen = await page.evaluate(() => {
    const layer = document.querySelector('.room-weather');
    const glass = getComputedStyle(document.documentElement).getPropertyValue('--season-glass').trim();
    const chip = document.querySelector('.room-season-chip')?.textContent || '';
    return {
      season: document.body.dataset.season,
      kind: layer ? [...layer.classList].find(c => c.startsWith('weather-')) : null,
      pieces: document.querySelectorAll('.room-weather .wx').length,
      light: !!document.querySelector('.room-light'),
      glass, chip,
    };
  });
  ok(`${key}: the room knows what month it is`, seen.season === key, JSON.stringify(seen));
  ok(`${key}: the right weather is in the air`, seen.kind === `weather-${WEATHER[key]}` && seen.pieces >= 5,
     `${seen.kind}, ${seen.pieces} pieces`);

  /* Indoors it falls OUTSIDE. Every piece of weather has to be behind a
     window; none of it may be loose in the room. */
  const outside = await page.evaluate(() => ({
    behindGlass: document.querySelectorAll('.room-window .room-view .room-weather .wx').length,
    looseInRoom: document.querySelectorAll('.room > .room-weather .wx').length,
    clipped: !!getComputedStyle(document.querySelector('.room-view')).clipPath.replace('none', ''),
  }));
  ok(`${key}: the weather falls outside the window`,
     outside.behindGlass >= 5 && outside.looseInRoom === 0 && outside.clipped,
     `${outside.behindGlass} behind the glass, ${outside.looseInRoom} loose in the room`);
  ok(`${key}: the light falls on the room`, seen.light);

  /* The one that matters: weather that is actually IN the room. A percentage
     translate resolves against the element's own box, so it is very easy to
     ship a dozen petals that fall thirteen pixels and never appear. */
  const inRoom = await page.evaluate(() => {
    const layer = document.querySelector('.room-weather');
    const h = layer.getBoundingClientRect().height;
    const y = w => {
      const m = new DOMMatrixReadOnly(getComputedStyle(w).transform);
      return Math.abs(m.f) / h;
    };
    const all = [...layer.querySelectorAll('.wx')].map(y);
    return { h, crossing: all.filter(v => v > 0.05 && v < 1).length, max: Math.max(...all).toFixed(2) };
  });
  ok(`${key}: the weather crosses the pane, not stuck at the top of it`,
     inRoom.crossing >= 2 && Number(inRoom.max) > 0.5,
     `${inRoom.crossing} crossing, furthest ${inRoom.max} of the way down`);
  ok(`${key}: the glass takes the season`, /^#[0-9a-f]{6}$/i.test(seen.glass), seen.glass);

  /* The view behind the glass really carries the day's colour — and every
     OTHER copy of the same drawing, on a shelf or in a list, still has its
     glass painted in. Blanking the variable globally would empty them all. */
  const view = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.room-view'));
    return cs.backgroundImage + ' | ' + cs.backgroundColor;
  });
  ok(`${key}: the view behind the glass takes the season`,
     view.includes(hexToRgb(seen.glass)), view.split(' | ')[1]);

  await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Room/ }).first().click();
  await page.waitForTimeout(300);
  const shelf = await page.evaluate(() => {
    const n = [...document.querySelectorAll('.shop-art svg rect, .shop-art svg circle, .shop-art svg path')]
      .find(x => (x.getAttribute('fill') || '').includes('--season-glass'));
    return n ? getComputedStyle(n).fill : null;
  });
  ok(`${key}: windows on the shop shelf still have their glass in`,
     !!shelf && shelf !== 'none' && shelf !== 'rgba(0, 0, 0, 0)', String(shelf));
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.screenshot({ path: `${SP}/S-${key}.png` });
  await ctx.close();
}

/* ---------- the shop points out what suits the month ---------- */
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(`(() => {
  const Real = Date;
  const shift = new Real('2026-10-15T12:00:00').getTime() - Real.now();
  class Fake extends Real {
    constructor(...a) { if (!a.length) super(Real.now() + shift); else super(...a); }
    static now() { return Real.now() + shift; }
  }
  window.Date = Fake;
})()`);
const page = await ctx.newPage();
page.on('pageerror', e => errs.push('PAGEERROR(shop): ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE(shop): ' + m.text()); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(SEED, WORDS);
await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const shop = await page.evaluate(async () => {
  const items = await import('/js/core/items.js');
  const first = document.querySelector('.shop-card');
  return {
    tagged: document.querySelectorAll('.season-tag').length,
    firstIsSeasonal: !!first?.classList.contains('in-season'),
    tagCount: { spring: items.itemsInSeason('spring').length, summer: items.itemsInSeason('summer').length,
                fall: items.itemsInSeason('fall').length, winter: items.itemsInSeason('winter').length },
    everythingStillForSale: items.shopItems().length,
    /* Counted from the catalogue rather than written down here: a number
       typed into a test goes stale the first time the catalogue grows, and
       then it is the test that is wrong. */
    pricedInCatalogue: items.CATALOG.filter(i => i.price > 0).length,
  };
});
ok('the shop marks what suits the month', shop.tagged > 0, `${shop.tagged} marked`);
ok('...and floats it to the front of the tab', shop.firstIsSeasonal);
ok('every season has something to point at',
   Object.values(shop.tagCount).every(n => n >= 4), JSON.stringify(shop.tagCount));
ok('nothing is withheld because of the date',
   shop.everythingStillForSale === shop.pricedInCatalogue && shop.pricedInCatalogue > 100,
   String(shop.everythingStillForSale));
await page.screenshot({ path: `${SP}/S-shop.png` });
await ctx.close();

/* ---------- motion off means no weather, not frozen weather ---------- */
const still = await browser.newContext({ viewport: { width: 900, height: 700 },
  reducedMotion: 'reduce' });
const p3 = await still.newPage();
p3.on('pageerror', e => errs.push('PAGEERROR(reduced): ' + e.message));
await p3.goto(BASE, { waitUntil: 'networkidle' });
await p3.evaluate(SEED, WORDS);
await p3.goto(BASE + '#/', { waitUntil: 'networkidle' });
await p3.reload({ waitUntil: 'networkidle' });
await p3.waitForTimeout(500);
const hidden = await p3.evaluate(() => {
  const l = document.querySelector('.room-weather');
  return l ? getComputedStyle(l).display : 'missing';
});
ok('with motion turned down the weather is hidden, not frozen', hidden === 'none', hidden);
await still.close();

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
await browser.close();
