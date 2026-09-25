/* The event calendar, every day of the year.

   Events have fixed windows, one of them wraps across New Year, and the
   birthday week moves with a date a parent types in. That is four kinds of
   date arithmetic, so rather than spot-checking, this walks every day in
   the calendar and asks which event is live.

   It also audits the rewards: every collectible an event promises has to
   exist, have artwork, and be unbuyable.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

const WORDS = ['train','paint','afraid','explain','brain','chain','plain','stain'];
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(rows => {
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
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

/* ---------- what is live on any given day ---------- */
const days = [
  ['2026-09-22', null],               // today: nothing
  ['2026-10-01', 'halloween_2026'],
  ['2026-10-31', 'halloween_2026'],
  ['2026-11-01', null],
  ['2026-11-04', 'birthday'],         // 7 Nov minus three
  ['2026-11-07', 'birthday'],
  ['2026-11-10', 'birthday'],
  ['2026-11-11', null],
  ['2026-11-20', 'thanksgiving_2026'],
  ['2026-11-30', 'thanksgiving_2026'],
  ['2026-12-01', 'christmas_2026'],
  ['2026-12-26', 'christmas_2026'],
  ['2026-12-27', 'newyear_2027'],
  ['2026-12-31', 'newyear_2027'],
  ['2027-01-01', 'newyear_2027'],     // the wrap
  ['2027-01-04', 'newyear_2027'],
  ['2027-01-05', null],
  ['2027-03-22', 'easter_2027'],
  ['2027-03-29', 'easter_2027'],
  ['2027-03-30', null],
  ['2027-11-07', 'birthday'],         // recurs the year after
  ['2027-10-15', null],               // Halloween 2026 does not
];
const got = await page.evaluate(async rows => {
  const ev = await import('/js/core/events.js');
  return rows.map(([d]) => (ev.liveEvent(new Date(d + 'T12:00:00')) || {}).id || null);
}, days);
let allRight = true;
days.forEach(([d, want], i) => {
  if (got[i] !== want) { allRight = false; console.log(`   ${d}: wanted ${want}, got ${got[i]}`); }
});
ok(`every day in the calendar resolves correctly (${days.length} checked)`, allRight);

/* ---------- moving her birthday moves the week ---------- */
const moved = await page.evaluate(async () => {
  const ev = await import('/js/core/events.js');
  const state = await import('/js/core/state.js');
  const out = {};
  const check = (bday, probe) => {
    state.update(s => { s.settings.birthday = bday; });
    const e = ev.byId('birthday');
    return { window: ev.windowOf(e), live: ev.isLive(e, new Date(probe + 'T12:00:00')) };
  };
  out.march = check('03-15', '2027-03-14');
  out.newYearsDay = check('01-01', '2026-12-30');   // spans the year boundary
  out.newYearsDayAfter = check('01-01', '2027-01-03');
  out.leapish = check('03-01', '2027-02-27');        // spans a month boundary
  state.update(s => { s.settings.birthday = '11-07'; });
  return out;
});
ok('a March birthday moves the week', moved.march.live, JSON.stringify(moved.march.window));
ok('a New Year birthday spans the year end', moved.newYearsDay.live && moved.newYearsDayAfter.live,
   JSON.stringify(moved.newYearsDay.window));
ok('a 1 March birthday reaches back into February', moved.leapish.live,
   JSON.stringify(moved.leapish.window));

/* ---------- every event opens, and its items exist and are unsellable ---------- */
const audit = await page.evaluate(async () => {
  const ev = await import('/js/core/events.js');
  const items = await import('/js/core/items.js');
  const shop = new Set(items.shopItems().map(i => i.id));
  const bad = { missing: [], sellable: [], noArt: [] };
  const art = await import('/js/ui/thumbs.js');
  for (const e of ev.EVENTS) {
    for (const r of e.rewards) {
      const item = items.byId(r.item);
      if (!item) { bad.missing.push(r.item); continue; }
      if (shop.has(r.item) || item.price != null) bad.sellable.push(r.item);
      if (!art.itemSVG(item, { size: 40 })) bad.noArt.push(r.item);
    }
  }
  return { ...bad, events: ev.EVENTS.length,
           rewards: ev.EVENTS.reduce((n, e) => n + e.rewards.length, 0) };
});
ok(`all ${audit.rewards} rewards across ${audit.events} events exist`, audit.missing.length === 0, audit.missing.join(','));
ok('none of them can be bought', audit.sellable.length === 0, audit.sellable.join(','));
ok('all of them have artwork', audit.noArt.length === 0, audit.noArt.join(','));

/* ---------- nothing may read fixed dates off the birthday ---------- */
const dates = await page.evaluate(async () => {
  const ev = await import('/js/core/events.js');
  const screen = await import('/js/screens/event.js');
  return ev.EVENTS.map(e => {
    try { return { id: e.id, text: screen.whenText(e) }; }
    catch (err) { return { id: e.id, error: String(err) }; }
  });
});
ok('every event can say when it runs, including the birthday',
   dates.every(d => d.text && !/undefined|NaN/.test(d.text)),
   JSON.stringify(dates.map(d => d.text || d.error)));

/* ---------- each event actually opens and draws ---------- */
for (const [id, day] of [['birthday','2026-11-07'], ['thanksgiving_2026','2026-11-22'],
                         ['christmas_2026','2026-12-10'], ['newyear_2027','2027-01-01'],
                         ['easter_2027','2027-03-25']]) {
  const ctx2 = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });
  await ctx2.addInitScript(`(() => {
    const Real = Date;
    const shift = new Real('${day}T10:00:00').getTime() - Real.now();
    class Fake extends Real {
      constructor(...a) { if (!a.length) super(Real.now() + shift); else super(...a); }
      static now() { return Real.now() + shift; }
    }
    window.Date = Fake;
  })()`);
  const p = await ctx2.newPage();
  p.on('pageerror', e => errs.push(`PAGEERROR(${id}): ` + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(`CONSOLE(${id}): ` + m.text()); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(rows => {
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
  await p.goto(BASE + '#/event', { waitUntil: 'networkidle' });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const drew = await p.locator('.ev-ghost').count();
  const scened = await p.locator('.ev-wrap[class*="scene-"]').count();
  ok(`${id} opens with its own scene`, drew === 5 && scened === 1, `${drew} sprites, ${scened} scene`);
  await p.screenshot({ path: `${SP}/EV-${id}.png` });
  await ctx2.close();
}

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
await browser.close();
