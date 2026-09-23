/* Practice days.

   It used to be a streak in the strict sense, and then a streak with one
   forgiven day a week. Both counted the days she did NOT open the app,
   which for a child who is at school five days out of seven and away some
   weekends is a number that mostly measures her family's diary.

   It counts the days she turned up now, and only those. Nothing takes it
   away: not a weekend, not a fortnight's holiday, not a month.

   All of this is about days, so all of it fakes them.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const browser = await chromium.launch();
const errs = [];
const DAY = 86400000;

/* Run something with the clock frozen `days` from now, carrying the save
   forward so each day builds on the last. */
async function onDay(days, fn, saveIn = null) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await ctx.newPage();
  watch(page, errs);
  const at = Date.now() + days * DAY;
  await page.addInitScript(`{
    const R = Date;
    class F extends R { constructor(...a){ a.length ? super(...a) : super(${at}); }
      static now(){ return ${at}; } }
    Date = F;
  }`);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (saveIn) await page.evaluate(s => localStorage.setItem('spelling-adventure:v1', s), saveIn);
  else await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  const out = await page.evaluate(fn);
  await page.waitForTimeout(400);           // the save is debounced by 200ms
  const save = await page.evaluate(() => localStorage.getItem('spelling-adventure:v1'));
  await ctx.close();
  return { out, save };
}

const practise = async () => {
  const r = await import('./js/core/rewards.js');
  const s = r.touchStreak();
  return { streak: s.streak, isNewDay: !!s.isNewDay, isRecord: !!s.isRecord,
           daysAway: s.daysAway };
};

/* ---------- practising every day ---------- */
let r = await onDay(0, practise);
ok('the first day counts one', r.out.streak === 1, `streak ${r.out.streak}`);
for (const d of [1, 2, 3]) r = await onDay(d, practise, r.save);
ok('four days running makes four', r.out.streak === 4, `streak ${r.out.streak}`);

/* ---------- twice in one day is still one day ---------- */
const twice = await onDay(3, async () => {
  const r = await import('./js/core/rewards.js');
  r.touchStreak();
  return r.touchStreak();
}, r.save);
ok('practising twice in a day does not count twice',
   twice.out.isNewDay === false, 'the second one changes nothing');

/* ---------- a day off ---------- */
const oneOff = await onDay(5, practise, r.save);      // day 4 skipped
ok('a missed day costs her nothing', oneOff.out.streak === 5,
   `streak ${oneOff.out.streak}`);
ok('...and the screen knows she was away', oneOff.out.daysAway === 1,
   `${oneOff.out.daysAway} day away`);

/* ---------- a weekend, which is the ordinary case ---------- */
let week = await onDay(0, practise);
for (const d of [1, 2, 3, 4]) week = await onDay(d, practise, week.save);
ok('five school days make five', week.out.streak === 5, `streak ${week.out.streak}`);
const monday = await onDay(7, practise, week.save);   // Saturday and Sunday off
ok('a whole weekend off carries straight on', monday.out.streak === 6,
   `streak ${monday.out.streak} — two days off used to reset this to 1`);
ok('...and says how long she was away', monday.out.daysAway === 2,
   `${monday.out.daysAway} days away`);

/* ---------- a fortnight away ---------- */
const holiday = await onDay(21, practise, monday.save);
ok('a fortnight away carries on where she left it', holiday.out.streak === 7,
   `streak ${holiday.out.streak} — three, then a holiday, is still three`);
ok('...and that is worth a welcome back', holiday.out.daysAway === 13,
   `${holiday.out.daysAway} days away`);

/* ---------- and a month ---------- */
const term = await onDay(60, practise, holiday.save);
ok('a month away carries on too', term.out.streak === 8, `streak ${term.out.streak}`);

/* ---------- it only ever goes up ---------- */
const stored = JSON.parse(term.save).progress;
ok('nothing in the save can make it go down',
   stored.currentStreak === 8 && stored.longestStreak === 8,
   `current ${stored.currentStreak}, longest ${stored.longestStreak}`);
ok('the rest-day bookkeeping is gone from the save',
   !('lastRestDay' in stored), Object.keys(stored).join(','));

/* ---------- an old save carries its number across ----------
   A save made under the old rule may have a streak and a stale rest day on
   it. Whatever number it reached is hers; it just cannot fall any more. */
const old = JSON.parse(term.save);
old.progress.currentStreak = 12;
old.progress.longestStreak = 12;
old.progress.lastRestDay = '2020-01-01';
old.progress.lastPracticeDay = '2020-01-02';
const carried = await onDay(61, practise, JSON.stringify(old));
ok('a streak from the old rule is kept, not reset',
   carried.out.streak === 13, `streak ${carried.out.streak}`);

await browser.close();
const t = tally();
console.log(`\nstreak: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
