/* An event, played through.

   Six events share one mechanic in six costumes, so this drives one of
   them end to end — with the clock faked into October, since the app reads
   the tablet's own date — and then checks the parts that are shared: the
   daily budget is separate from the games' one, so a month of Halloween
   cannot quietly double a day's worth of stars; the collectibles are
   earned and cannot be bought; and the banner sits above Today's Practice
   rather than instead of it.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();

/* Pretend it is Halloween. The app reads the tablet's own clock, so this is
   the only honest way to test an event before the day. */
const ctx = await browser.newContext({
  viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2,
});
await ctx.addInitScript(() => {
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s?.speak) { const o = s.speak.bind(s); s.speak = u => { if (u?.text) window.__spoken.push(u.text); try { o(u); } catch {} }; }
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const WORDS = ['train','paint','afraid','explain','brain','chain','plain','stain'];
const seed = () => page.evaluate(rows => {
  localStorage.clear();
  const now = Date.now();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map((text, i) => ({ id: 'w' + i, listId: 'l1', text, definition: 'd' + i,
      sentence: '', hint: '', tags: [], attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
      lastCorrect: null, lastMissed: null, masteredAt: null, createdAt: now })) }));
}, WORDS);

/* ---------- the calendar, checked without touching the clock ---------- */
await page.goto(BASE, { waitUntil: 'networkidle' });
const cal = await page.evaluate(async () => {
  const ev = await import('/js/core/events.js');
  const e = ev.byId('halloween_2026');
  const on = d => ev.isLive(e, new Date(d));
  return {
    sept30: on('2026-09-30T12:00'), oct1: on('2026-10-01T12:00'),
    oct31: on('2026-10-31T12:00'), nov1: on('2026-11-01T12:00'),
    oct2027: on('2027-10-15T12:00'),
    daysLeftOct20: ev.daysLeft(e, new Date('2026-10-20T12:00')),
    upcomingNow: ev.upcoming(new Date('2026-09-22T12:00')).map(x => x.id),
  };
});
ok('the event opens on 1 October', cal.oct1 && !cal.sept30, JSON.stringify(cal));
ok('...and closes after 31 October', cal.oct31 && !cal.nov1);
ok('...and does not come back in 2027', !cal.oct2027);
ok('days left counts correctly', cal.daysLeftOct20 === 12, String(cal.daysLeftOct20));
ok('it is listed as upcoming today', cal.upcomingNow.includes('halloween_2026'));

/* ---------- the parent preview banks nothing ---------- */
await seed();
await page.goto(BASE + '#/event?preview=halloween_2026', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
ok('preview opens the hunt', await page.locator('.ev-ghost').count() === 5);
ok('preview says so plainly', await page.locator('.ev-preview-note').count() === 1);
await page.screenshot({ path: `${SP}/E1-hunt.png` });

async function spellOne({ wrong = false } = {}) {
  const ghosts = page.locator('.ev-ghost');
  if (!await ghosts.count()) return false;
  await page.evaluate(() => { window.__spoken = []; });
  await ghosts.first().click({ force: true });  // they bob on purpose
  await page.waitForTimeout(900);
  const word = (await page.evaluate(() => window.__spoken)).find(x => /^[a-z']+$/i.test(x.trim()));
  if (!word) return false;
  const type = wrong ? word.toLowerCase().slice(0, -1) + 'z' : word.toLowerCase();
  for (const ch of type) await page.click(`.key:text-is("${ch}")`);
  await page.click('.key-enter');
  await page.waitForTimeout(wrong ? 3000 : 1600);
  return true;
}
await spellOne();
await page.waitForTimeout(400);
const afterPreview = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
  return { events: s.events, stars: s.progress.stars, items: s.collection.items.length };
});
ok('preview banks no progress', !afterPreview.events?.halloween_2026, JSON.stringify(afterPreview.events || {}));
ok('preview banks no stars or items', afterPreview.stars === 0 && afterPreview.items === 0,
   JSON.stringify(afterPreview));

/* ---------- the real thing, with the clock moved to Halloween ---------- */
const ctx2 = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });
await ctx2.addInitScript(() => {
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s?.speak) { const o = s.speak.bind(s); s.speak = u => { if (u?.text) window.__spoken.push(u.text); try { o(u); } catch {} }; }
  const Real = Date;
  const shift = new Real('2026-10-20T10:00:00').getTime() - Real.now();
  class Fake extends Real {
    constructor(...a) { if (!a.length) super(Real.now() + shift); else super(...a); }
    static now() { return Real.now() + shift; }
  }
  window.Date = Fake;
});
const p2 = await ctx2.newPage();
p2.on('pageerror', e => errors.push('PAGEERROR(oct): ' + e.message));
p2.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE(oct): ' + m.text()); });

await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.evaluate(rows => {
  localStorage.clear();
  const now = Date.now();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map((text, i) => ({ id: 'w' + i, listId: 'l1', text, definition: 'd' + i,
      sentence: '', hint: '', tags: [], attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
      lastCorrect: null, lastMissed: null, masteredAt: null, createdAt: now })) }));
}, WORDS);
await p2.goto(BASE + '#/', { waitUntil: 'networkidle' });
await p2.reload({ waitUntil: 'networkidle' });
await p2.waitForTimeout(700);
ok('the home screen shows the banner in October', await p2.locator('.event-banner').count() === 1);
await p2.screenshot({ path: `${SP}/E0-home-banner.png` });

await p2.click('.event-banner');
await p2.waitForTimeout(900);
ok('the banner opens the hunt', await p2.locator('.ev-ghost').count() === 5);
ok('no preview note when it is really on', await p2.locator('.ev-preview-note').count() === 0);

async function spell2({ wrong = false } = {}) {
  const ghosts = p2.locator('.ev-ghost');
  if (!await ghosts.count()) return false;
  await p2.evaluate(() => { window.__spoken = []; });
  await ghosts.first().click({ force: true });  // they bob on purpose
  await p2.waitForTimeout(900);
  const word = (await p2.evaluate(() => window.__spoken)).find(x => /^[a-z']+$/i.test(x.trim()));
  if (!word) return false;
  const type = wrong ? word.toLowerCase().slice(0, -1) + 'z' : word.toLowerCase();
  for (const ch of type) await p2.click(`.key:text-is("${ch}")`);
  await p2.click('.key-enter');
  /* A correct answer that crosses a reward threshold shows the prize for a
     good while before the board frees up again, so wait for the board
     rather than for a fixed beat. */
  await p2.waitForTimeout(wrong ? 3400 : 1400);
  for (let i = 0; i < 30; i++) {
    if (await p2.locator('.ev-spell').isHidden().catch(() => true)) break;
    if (await p2.locator('.payout-total').count()) break;
    await p2.waitForTimeout(300);
  }
  return true;
}

ok('a miss keeps the ghost in play', await (async () => {
  await spell2({ wrong: true });
  return await p2.locator('.ev-ghost').count() === 5;
})());

for (let i = 0; i < 12; i++) {
  if (await p2.locator('.payout-total').count()) break;
  if (await p2.locator('.ev-ghost').count() === 0) break;
  if (!await spell2()) break;
}
await p2.waitForTimeout(2500);
ok('finishing the round shows the results', await p2.locator('.payout-total').count() === 1);
const state2 = await p2.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')));
ok('ghosts helped home are counted', (state2.events?.halloween_2026?.count || 0) >= 2,
   JSON.stringify(state2.events || {}));
ok('crossing a threshold grants the item', state2.collection.items.some(r => r.itemId === 'pumpkin_lantern'),
   state2.collection.items.map(r => r.itemId).join(','));
ok('the item records where it came from',
   (state2.collection.items.find(r => r.itemId === 'pumpkin_lantern') || {}).source?.includes('2026'),
   JSON.stringify(state2.collection.items[0] || {}));
ok('the hunt paid some stars', state2.progress.stars > 0, String(state2.progress.stars));
await p2.screenshot({ path: `${SP}/E2-progress.png` });

/* ---------- the hard rules ---------- */
const rules = await p2.evaluate(async () => {
  const items = await import('/js/core/items.js');
  const ids = ['pumpkin_lantern','witch_hat','bat_garland','candy_bucket','ghost_friend',
               'glow_jar','moon_shell','star_map','paper_boat','mushroom_stool','feather_cap'];
  const shopIds = new Set(items.shopItems().map(i => i.id));
  return {
    inShop: ids.filter(id => shopIds.has(id)),
    priced: ids.filter(id => items.byId(id)?.price != null),
    allSpecial: ids.every(id => items.isSpecial(items.byId(id))),
  };
});
ok('no event or discovery item is in the shop', rules.inShop.length === 0, rules.inShop.join(','));
ok('none of them has a price at all', rules.priced.length === 0 && rules.allSpecial, rules.priced.join(','));

const streak = await p2.evaluate(async () => {
  const state = await import('/js/core/state.js');
  const w = await import('/js/core/words.js');
  const id = state.getState().words[0].id;
  state.update(s => { const x = s.words.find(y => y.id === id); x.streak = 2; x.lastCreditDay = '2000-01-01'; });
  w.recordAttempt(id, false, { countsForMastery: false });
  return state.getState().words.find(x => x.id === id).streak;
});
ok('a missed word in the hunt never breaks a streak', streak === 2, String(streak));

/* ---------- pet discoveries ---------- */
const disc = await p2.evaluate(async () => {
  const d = await import('/js/core/discovery.js');
  const state = await import('/js/core/state.js');
  state.update(s => { s.progress.lastDiscoveryDay = null; });
  const tooFew = d.maybeDiscover({ attempted: 1 });
  let found = null;
  for (let i = 0; i < 60 && !found; i++) {
    state.update(s => { s.progress.lastDiscoveryDay = null; });
    found = d.maybeDiscover({ attempted: 8 });
  }
  const second = d.maybeDiscover({ attempted: 8 });   // same day again
  return { tooFew: !!tooFew, found: found?.id || null, secondSameDay: !!second,
           left: d.stillOutThere().length };
});
ok('a two-word session never earns a discovery', !disc.tooFew);
ok('a real session can', !!disc.found, disc.found || 'none');
ok('at most one a day', !disc.secondSameDay);
ok('each item can only be found once', disc.left === 5, `${disc.left} left of 6`);

/* ---------- a modal must never outlive its screen ----------
   Discoveries are appended to <body>, so before this was fixed, pressing
   Back instead of closing one left the backdrop over the next screen and
   swallowed every tap. */
const stuck = await p2.evaluate(async () => {
  const ui = await import('/js/ui/discovery.js');
  const items = await import('/js/core/items.js');
  const router = await import('/js/ui/router.js');
  ui.showDiscovery(items.byId('glow_jar'));
  await new Promise(r => setTimeout(r, 150));
  const before = document.querySelectorAll('.modal-back').length;
  router.navigate('/');
  await new Promise(r => setTimeout(r, 400));
  return { before, after: document.querySelectorAll('.modal-back').length };
});
ok('a discovery box never outlives the screen it opened on',
   stuck.before === 1 && stuck.after === 0, JSON.stringify(stuck));

console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? errors.join('\n') : 'none');
await browser.close();
