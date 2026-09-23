/* Keeping what she has learned.

   A mastered word used to be a word she would never see again: Today's
   Practice, Practice and the practice test all draw from the ACTIVE words,
   and a mastered word is not active. So a word learned in September was
   gone by December and nothing in the app could ever find out — the star
   said "mastered" and quietly meant "mastered in September".

   Everything here is about time, so everything here fakes it. A check that
   ran only against today would pass on the day it was written and prove
   nothing about the thing it is holding down.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const browser = await chromium.launch();
const errs = [];

const DAY = 86400000;

/* A page whose Date is stuck `daysFromNow` days away. */
async function pageAt(days) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1250 } });
  const page = await ctx.newPage();
  watch(page, errs);
  const at = Date.now() + days * DAY;
  await page.addInitScript(`{
    const R = Date;
    class F extends R {
      constructor(...a) { a.length ? super(...a) : super(${at}); }
      static now() { return ${at}; }
    }
    Date = F;
  }`);
  return page;
}

/* One word, already mastered today, in a save we can carry forward. */
const SEED = () => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: [{
      id: 'w1', listId: 'l1', text: 'their', definition: '', sentence: '', hint: '',
      tags: [], attempts: 5, correctCount: 5, incorrectCount: 0, streak: 5,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: now, lastSeen: now,
      lastCorrect: now, lastMissed: null, masteredAt: now, reviewAt: null, reviewStep: 0,
      createdAt: now,
    }],
    progress: { stars: 0, milestonesEarned: [] },
    settings: { masteryThreshold: 5, masteryRuleV2: true, reviewMastered: true, reviewsPerDay: 2 },
    equipped: {},
    collection: { items: [] },
  }));
};

/* Run something against core/words.js in a page frozen N days from now,
   carrying the save forward so each step builds on the last. */
async function at(days, fn, saveIn = null) {
  const page = await pageAt(days);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (saveIn) await page.evaluate(s => localStorage.setItem('spelling-adventure:v1', s), saveIn);
  else await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  const out = await page.evaluate(fn);
  /* Saving is debounced by 200ms so a session of typing does not thrash
     localStorage. Reading it back any sooner gets the state BEFORE the
     thing this check just did, which looks exactly like the feature not
     working. */
  await page.waitForTimeout(400);
  const save = await page.evaluate(() => localStorage.getItem('spelling-adventure:v1'));
  await page.context().close();
  return { out, save };
}

const look = async () => {
  const w = await import('./js/core/words.js');
  const due = w.wordsDueForReview();
  const all = w.allWords();
  return {
    due: due.map(x => x.text),
    mastered: all.filter(w.isMastered).map(x => x.text),
    active: w.activeWords().map(x => x.text),
    step: all[0].reviewStep,
    daysAway: all[0].reviewAt ? Math.round((all[0].reviewAt - Date.now()) / 86400000) : null,
  };
};

/* ---------- mastering a word schedules its first check ---------- */
let r = await at(0, look);
ok('a word she has just mastered is not in the practice pool',
   r.out.active.length === 0, `active: ${r.out.active.join(', ') || '(none)'}`);
ok('...and is not due to be checked yet',
   r.out.due.length === 0, `due: ${r.out.due.length}`);

/* ---------- a week later it comes back ---------- */
r = await at(8, look, r.save);
ok('a week later it comes round to be checked',
   r.out.due.includes('their'), `due: ${r.out.due.join(', ') || '(none)'}`);
ok('...and it is still mastered while it waits',
   r.out.mastered.includes('their'), 'the star is not taken away just for being due');

/* ---------- getting it right pushes the next check further out ---------- */
const right = async () => {
  const w = await import('./js/core/words.js');
  const id = w.allWords()[0].id;
  const outcome = w.recordAttempt(id, true, { countsForMastery: false, isReview: true });
  const word = w.allWords()[0];
  return {
    stillRemembered: !!outcome.stillRemembered,
    stillMastered: w.isMastered(word),
    step: word.reviewStep,
    daysAway: Math.round((word.reviewAt - Date.now()) / 86400000),
    credits: word.streak,
  };
};
r = await at(8, right, r.save);
ok('remembering it keeps the star', r.out.stillMastered, 'still mastered');
ok('...and pushes the next check out to a month', r.out.daysAway === 30,
   `${r.out.daysAway} days away, rung ${r.out.step}`);
ok('...and earns nothing, because only the two tests do',
   r.out.credits === 5, `streak still ${r.out.credits}`);

/* ---------- a month later, then a term ---------- */
r = await at(40, look, r.save);
ok('a month on, it is due again', r.out.due.includes('their'), `due in ${r.out.daysAway} days`);
r = await at(40, right, r.save);
ok('...and remembering it again buys three months', r.out.daysAway === 90,
   `${r.out.daysAway} days away, rung ${r.out.step}`);

r = await at(135, right, r.save);
ok('a term on, remembering it buys six months', r.out.daysAway === 180,
   `${r.out.daysAway} days away, rung ${r.out.step}`);

r = await at(320, right, r.save);
ok('and it stays at six months rather than running off the end',
   r.out.daysAway === 180, `${r.out.daysAway} days away, rung ${r.out.step}`);

/* ---------- forgetting it costs the star ---------- */
const wrong = async () => {
  const w = await import('./js/core/words.js');
  const id = w.allWords()[0].id;
  const outcome = w.recordAttempt(id, false, { countsForMastery: false, isReview: true });
  const word = w.allWords()[0];
  return {
    forgotten: !!outcome.forgotten,
    stillMastered: w.isMastered(word),
    active: w.activeWords().map(x => x.text),
    streak: word.streak,
    reviewAt: word.reviewAt,
  };
};
const mastered = (await at(0, () => true)).save;   // mastered on day zero
const forgot = await at(8, wrong, mastered);
ok('forgetting it takes the star back', !forgot.out.stillMastered, 'no longer mastered');
ok('...and puts the word back in the practice pool',
   forgot.out.active.includes('their'), `active: ${forgot.out.active.join(', ')}`);
ok('...and starts its count from nothing', forgot.out.streak === 0, `streak ${forgot.out.streak}`);
ok('...and stops scheduling checks for a word that is no longer mastered',
   forgot.out.reviewAt === null, 'schedule cleared');

/* ---------- a review that she misses in Today's Practice really does count ----------
   Today's Practice is deliberately neutral for mastery: it can neither
   advance a streak nor break one. A review has to be the exception, or a
   check she fails changes nothing and there was no point asking. */
const viaDaily = await at(8, async () => {
  const w = await import('./js/core/words.js');
  const id = w.allWords()[0].id;
  /* exactly what screens/spell.js passes for a review in Today's Practice */
  w.recordAttempt(id, false, { countsForMastery: false, isReview: true });
  const plain = w.isMastered(w.allWords()[0]);
  return { stillMastered: plain };
}, mastered);
ok('a review missed during Today’s Practice still costs the star',
   !viaDaily.out.stillMastered,
   'the daily session is neutral for mastery, and a review is the exception');

/* ---------- and the switch turns the whole thing off ---------- */
const off = await at(8, async () => {
  const st = await import('./js/core/state.js');
  st.update(s => { s.settings.reviewMastered = false; });
  const w = await import('./js/core/words.js');
  return { due: w.wordsDueForReview().length, setting: false };
}, mastered);
ok('the word is still due even with reviews switched off',
   off.out.due === 1,
   'the setting decides whether the daily session asks, not whether the clock runs');

/* ---------- she can actually get to them ----------
   A word she has mastered and a list she has finished are the same thing
   from the home screen's point of view: it congratulates her and offers no
   Today's Practice button, because there is nothing left to practise. That
   made the reviews unreachable in exactly the case they exist for — the
   finished list, where the schedule is the only thing still asking her
   anything. The model was right and the front door was shut. */
{
  const page = await pageAt(8);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(s => localStorage.setItem('spelling-adventure:v1', s), mastered);
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const home = await page.evaluate(async () => {
    const w = await import('./js/core/words.js');
    return {
      active: w.activeWords().length,
      due: w.wordsDueForReview().length,
      offered: [...document.querySelectorAll('button')]
        .some(b => !b.disabled && /remember/i.test(b.textContent)),
    };
  });
  ok('with every word mastered there is still nothing to practise',
     home.active === 0 && home.due > 0, `${home.due} due, ${home.active} active`);
  ok('...and the home screen still offers a way to the reviews',
     home.offered, 'the button is on the screen');

  /* And it has to go somewhere that actually asks her something. */
  await page.goto(BASE + '#/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const asked = await page.evaluate(() => document.body.innerText.includes('already know'));
  ok('...which opens a session made of the words that are due',
     asked, 'Today\u2019s Practice asks the review words');
  await page.context().close();
}

await browser.close();
const t = tally();
console.log(`\nreview: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
