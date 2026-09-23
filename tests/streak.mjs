/* The day streak, and the rest day.

   The streak used to be strictly consecutive: one missed day turned forty
   into one. For a nine-year-old that punishes a birthday party, a holiday
   or a day off sick in exactly the same way it punishes not bothering, and
   none of those was her choice.

   One missed day in any seven is forgiven now. Two in a row still is not,
   because a streak that cannot be broken is not a streak.

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
  return { streak: s.streak, usedRestDay: !!s.usedRestDay, isRecord: !!s.isRecord };
};

/* ---------- practising every day ---------- */
let r = await onDay(0, practise);
ok('the first day starts a streak of one', r.out.streak === 1, `streak ${r.out.streak}`);
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

/* ---------- one day off is forgiven ---------- */
const rested = await onDay(5, practise, r.save);   // day 4 skipped
ok('a missed day does not break the streak', rested.out.streak === 5,
   `streak ${rested.out.streak}`);
ok('...and she is told it was her rest day', rested.out.usedRestDay,
   'so the number does not look like a counting mistake');

/* ---------- but not twice in the same week ---------- */
const again = await onDay(7, practise, rested.save);   // day 6 skipped too
ok('a second missed day in the same week does start a new streak',
   again.out.streak === 1, `streak ${again.out.streak}`);
ok('...and does not claim to be a rest day', !again.out.usedRestDay, 'no rest day claimed');

/* ---------- two days off in a row is a new streak ---------- */
let long = await onDay(0, practise);
for (const d of [1, 2]) long = await onDay(d, practise, long.save);
const gone = await onDay(5, practise, long.save);   // days 3 and 4 both missed
ok('two days off in a row starts a new streak', gone.out.streak === 1,
   `streak ${gone.out.streak} — a streak that cannot break is not a streak`);

/* ---------- and the rest day comes back a week later ----------
   Every step in between has to be a real day's practice, or the streak
   breaks for the ordinary reason and the check proves nothing. */
let week = await onDay(0, practise);
week = await onDay(2, practise, week.save);          // day 1 missed: rest day used
ok('the rest day is used', week.out.usedRestDay, 'first one');
for (const d of [3, 4, 5, 6, 7, 8]) week = await onDay(d, practise, week.save);
const later = await onDay(10, practise, week.save);  // day 9 missed, eight days on
ok('a week later she has another rest day',
   later.out.usedRestDay && later.out.streak > 1,
   `streak ${later.out.streak}, rest day ${later.out.usedRestDay}`);

await browser.close();
const t = tally();
console.log(`\nstreak: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
