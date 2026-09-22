/* The garden.

   Three things worth holding down: the gate is earned and says so, the two
   scenes never share their contents, and the weather outdoors falls across
   the whole picture rather than behind a pane of glass.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
import { SEED } from './lib/garden-seed.mjs';
const browser = await chromium.launch();
const errs = [];

const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(`(() => { const R = Date;
  const shift = new R('2026-10-15T12:00:00').getTime() - R.now();
  class F extends R { constructor(...a){ if(!a.length) super(R.now()+shift); else super(...a);} static now(){return R.now()+shift;} }
  window.Date = F; })()`);
const page = await ctx.newPage();
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

const boot = async (opts, at = '#/') => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, opts);
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(BASE + at, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
};

/* ---------- the gate ---------- */
await boot({ words: 18 });

ok('before it opens, the door is still something she can tap',
   await page.locator('.room-door-live').count() === 1);

await page.locator('.room-door-live').click({ force: true });
await page.waitForTimeout(350);
const said = await page.locator('.room-speech').textContent();
ok('a shut door says how far off it is, rather than just refusing',
   /\b2\b/.test(said) && said.length > 12, said);
ok('...and it does not take her anywhere',
   await page.evaluate(() => location.hash) === '#/');

const locked = await page.evaluate(() => ({
  tabs: [...document.querySelectorAll('.seg button')].map(b => b.textContent),
}));
await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const shopTabs = await page.evaluate(() =>
  [...document.querySelectorAll('.seg button')].map(b => b.textContent));
ok('the shop does not sell garden things before she has a garden',
   !shopTabs.some(t => /Garden/.test(t)), shopTabs.join(' | '));

await page.goto(BASE + '#/decorate', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
ok('...and there is nothing to arrange out there either',
   await page.locator('.seg button', { hasText: 'Garden' }).count() === 0);

/* Typing the address in is a door too. */
await page.goto(BASE + '#/garden', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
ok('the garden itself turns her away if she has not earned it',
   await page.evaluate(() => location.hash) === '#/' &&
   await page.locator('.garden').count() === 0);

const prog = await page.evaluate(async () => {
  location.hash = '#/progress';
  await new Promise(r => setTimeout(r, 600));
  return document.body.textContent;
});
ok('progress counts down to it', /Garden Gate/.test(prog) && /18 of 20/.test(prog));

/* ---------- and once it is open ---------- */
await boot({});
await page.locator('.room-door-live').click({ force: true });
await page.waitForTimeout(600);
ok('tapping the open door goes outside',
   await page.evaluate(() => location.hash) === '#/garden');
ok('the garden is out there', await page.locator('.garden').count() === 1);

const scene = await page.evaluate(() => {
  const g = document.querySelector('.garden');
  return {
    sky: !!g.querySelector('.garden-sky'),
    ground: !!g.querySelector('.garden-ground'),
    hills: g.querySelectorAll('.garden-hills .hill').length,
    fence: g.querySelectorAll('.room-piece').length,
    pet: !!g.querySelector('.room-pet'),
    light: !!g.querySelector('.room-light'),
    weather: g.querySelectorAll('.room-weather .wx').length,
    behindGlass: g.querySelectorAll('.room-view').length,
    kind: [...g.querySelector('.room-weather').classList].find(c => c.startsWith('weather-')),
  };
});
ok('the garden has a sky, a ground and something in the distance',
   scene.sky && scene.ground && scene.hills === 2, JSON.stringify(scene));

/* The whole reason this place exists. */
ok('outdoors the weather falls across the whole picture, not behind glass',
   scene.weather >= 10 && scene.behindGlass === 0 && scene.kind === 'weather-leaves',
   `${scene.weather} pieces, ${scene.behindGlass} windows, ${scene.kind}`);

const spread = await page.evaluate(() => {
  const g = document.querySelector('.garden');
  const R = g.getBoundingClientRect();
  const xs = [...g.querySelectorAll('.room-weather .wx')]
    .map(w => 100 * (w.getBoundingClientRect().left - R.left) / R.width);
  const ys = [...g.querySelectorAll('.room-weather .wx')].map(w => {
    const m = new DOMMatrixReadOnly(getComputedStyle(w).transform);
    return Math.abs(m.f) / R.height;
  });
  return { left: Math.min(...xs), right: Math.max(...xs),
           crossing: ys.filter(v => v > 0.05 && v < 1).length };
});
ok('...spread right across it, and actually falling',
   spread.right - spread.left > 50 && spread.crossing >= 4,
   `x ${spread.left.toFixed(0)}–${spread.right.toFixed(0)}%, ${spread.crossing} crossing`);

/* ---------- the two scenes stay separate ---------- */
const slots = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  const indoors = ['wallpaper','flooring','window','door','bed','rug','wallDecor','floorDecor'];
  const shared = it.CATALOG.filter(i => it.GARDEN_SLOTS.includes(i.category)
                                     && indoors.includes(i.category));
  return {
    garden: it.CATALOG.filter(i => it.GARDEN_SLOTS.includes(i.category)).length,
    shared: shared.length,
    starters: it.CATALOG.filter(i => it.GARDEN_SLOTS.includes(i.category) && i.price === 0).length,
    shop: it.shopItems().length,
  };
});
ok('the garden has its own things, and nothing is in both places',
   slots.garden >= 24 && slots.shared === 0, JSON.stringify(slots));
ok('and two of them are hers the moment the gate opens', slots.starters === 2);

/* ---------- arranging it ---------- */
await page.goto(BASE + '#/decorate?where=garden', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
ok('the decorating screen opens on the garden when asked',
   await page.locator('.garden').count() === 1);
const headings = await page.evaluate(() =>
  [...document.querySelectorAll('.slot-row h3')].map(h => h.textContent));
ok('...and offers only outdoor slots',
   ['Sky','Ground','Fence','Tree','Water','In the garden'].every(h => headings.includes(h))
   && !headings.includes('Wallpaper'), headings.join(', '));

await page.locator('.seg button', { hasText: 'My Room' }).click();
await page.waitForTimeout(500);
const indoorHeads = await page.evaluate(() =>
  [...document.querySelectorAll('.slot-row h3')].map(h => h.textContent));
ok('switching back indoors offers only indoor slots',
   indoorHeads.includes('Wallpaper') && !indoorHeads.includes('Sky'), indoorHeads.join(', '));

/* ---------- the room is unchanged ---------- */
await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const room = await page.evaluate(() => {
  const r = document.querySelector('.room');
  return {
    isGarden: r.classList.contains('garden'),
    behindGlass: r.querySelectorAll('.room-view .room-weather .wx').length,
    loose: r.querySelectorAll(':scope > .room-weather').length,
  };
});
ok('indoors, the weather is still only behind the window',
   !room.isGarden && room.behindGlass >= 5 && room.loose === 0, JSON.stringify(room));

/* ---------- a look at each sky ---------- */
for (const sky of ['sky_day', 'sky_sunset', 'sky_night', 'sky_rainbow']) {
  await boot({ garden: { sky } }, '#/garden');
  await page.locator('.garden').screenshot({ path: `${SP}/G-${sky}.png` });
}
ok('every sky renders', true);

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
await browser.close();
