/* What moves mastery, and what does not.

   A word is mastered after N correct answers in a row ON A TEST. Only the
   Practice Test and the Spelling Test count: they give no feedback until
   the end and no second look, so they are the honest measure. Today's
   Practice, extra practice, the mini-games and the events are all neutral
   — they cannot advance a streak and, just as deliberately, cannot break
   one either. A word fumbled while she is still learning it should not
   undo five test results.

   That means a correct answer often earns no dot, which looks exactly like
   a broken counter. So this checks the wording as carefully as the sums.

   It is also the only suite that spans more than one day, for the optional
   "Once a day" rule.
*/

import { chromium, BASE, ok } from './lib/harness.mjs';

const WORDS = ['train', 'paint', 'afraid'];
const errs = [];
const browser = await chromium.launch();

const SEED = ({ rows, settings = {} }) => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map((text, i) => ({ id: 'w' + i, listId: 'l1', text, definition: '', sentence: '',
      hint: '', tags: [], attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
      lastCorrect: null, lastMissed: null, masteredAt: null, createdAt: now })),
    /* masteryRuleV2 stops migrate() overwriting whatever a block asked
       for — that one-time move is right for a real save and wrong here.
       The block that tests the move deletes the flag on purpose. */
    settings: { masteryThreshold: 5, oneCreditPerDay: false, masteryRuleV2: true, ...settings },
    progress: { stars: 0, milestonesEarned: [] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] } }));
};

/* The word is deliberately never on screen, so it is read the way the other
   suites read it: off the voice. */
const hooks = day => `(() => {
  const R = Date;
  const shift = new R('${day}T10:00:00').getTime() - R.now();
  class F extends R { constructor(...a){ if(!a.length) super(R.now()+shift); else super(...a);} static now(){return R.now()+shift;} }
  window.Date = F;
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s?.speak) { const o = s.speak.bind(s); s.speak = u => { if (u?.text) window.__spoken.push(u.text); try { o(u); } catch {} }; }
})()`;

async function clearDiscovery(p) {
  if (await p.locator('.find-box').count()) {
    await p.click('.find-box', { force: true });
    await p.waitForTimeout(700);
  }
  const done = p.locator('.find-wrap button:has-text("Lovely")');
  if (await done.count()) { await done.click(); await p.waitForTimeout(350); }
}

/* Play a session. `missFirst` gets the first word wrong on purpose, which
   is what puts a second look into the plan. Returns what the feedback panel
   said after each answer. */
async function play(page, { missFirst = false, max = 20 } = {}) {
  const said = [];
  await page.waitForSelector('.keyboard', { timeout: 8000 });
  let missed = false;
  for (let t = 0; t < max; t++) {
    await page.waitForTimeout(850);
    if (await page.locator('.keyboard').count() === 0) break;
    /* The speak button is hidden while feedback is up, and the results
       screen keeps one around. Visible, not merely present, is the only
       reliable "there is a word waiting". */
    const speak = page.locator('.speak-btn');
    /* Waiting, not a one-shot check: the button is hidden while feedback is
       up, and a word she has just mastered holds that feedback nearly twice
       as long. A check that fires during it looks exactly like the end of
       the session, which is how this suite first "found" a bug that was
       only ever in itself. */
    try { await speak.waitFor({ state: 'visible', timeout: 5000 }); }
    catch { break; }
    await page.evaluate(() => { window.__spoken = []; });
    await speak.click({ force: true });
    await page.waitForTimeout(550);
    const word = (await page.evaluate(() => window.__spoken)).find(x => /^[a-z']+$/i.test(x.trim()));
    if (!word) break;
    let type = word.toLowerCase();
    if (missFirst && !missed) { type = type.slice(0, -1) + 'z'; missed = true; }
    for (const ch of type) await page.click(`.key:text-is("${ch}")`, { timeout: 3000 });
    await page.click('.key-enter');
    await page.waitForTimeout(650);
    /* The word goes in whether or not there is a feedback panel: the two
       TESTS deliberately have none, and only recording the ones that do
       meant every test looked like it asked nothing at all. */
    const fb = await page.evaluate(() => {
      const f = document.querySelector('.feedback');
      return f ? { text: f.textContent.replace(/\s+/g, ' ').trim(),
                   dots: f.querySelectorAll('.mdot').length,
                   on: f.querySelectorAll('.mdot.on').length } : {};
    });
    said.push({ word, text: '', dots: 0, on: 0, ...fb });
    const nb = page.locator('button:has-text("Next word")');
    if (await nb.count()) { await nb.click(); await page.waitForTimeout(350); }
  }
  await page.waitForTimeout(900);
  await clearDiscovery(page);
  return said;
}

/* Always via home. Asking for a hash the browser is already on fires no
   hashchange, so the previous session's results screen just sits there —
   which looks exactly like a session that refused to start. */
async function startSession(page, route) {
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

const streaks = page => page.evaluate(async () => {
  const { getState } = await import('./js/core/state.js');
  return Object.fromEntries(getState().words.map(w => [w.text, w.streak]));
});

async function open(day, save, opts = {}, rows = WORDS) {
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1200 } });
  await ctx.addInitScript(hooks(day));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (save) await page.evaluate(s => localStorage.setItem('spelling-adventure:v1', s), save);
  else await page.evaluate(SEED, { rows, settings: opts });
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { ctx, page };
}

const keep = page => page.evaluate(() => localStorage.getItem('spelling-adventure:v1'));

/* ---------- only the tests move it ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);

  await startSession(page, '#/daily');
  const practice = await play(page);
  const afterPractice = await streaks(page);
  ok('a whole practice session moves nothing',
     Object.values(afterPractice).every(v => v === 0), JSON.stringify(afterPractice));
  ok('...and says what does move it',
     practice.some(x => /tests are what fill these in/i.test(x.text)),
     practice[0]?.text.slice(0, 70));

  await startSession(page, '#/practice');
  await play(page);
  ok('extra practice moves nothing either',
     Object.values(await streaks(page)).every(v => v === 0));

  /* A test is a different matter. */
  await startSession(page, '#/test');
  await play(page);
  const afterTest = await streaks(page);
  ok('a practice test moves every word it asked',
     Object.values(afterTest).every(v => v === 1), JSON.stringify(afterTest));
  await ctx.close();
}

/* ---------- five tests in a row ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  const marks = [];
  for (let i = 0; i < 5; i++) {
    await startSession(page, '#/test');
    await play(page);
    marks.push((await streaks(page)).train);
  }
  ok('each test adds one', marks.join(',') === '1,2,3,4,5', marks.join(','));

  const done = await page.evaluate(async () => {
    const w = await import('./js/core/words.js');
    return { mastered: w.masteredWords().length, active: w.activeWords().length };
  });
  ok('...and the fifth masters the word', done.mastered === WORDS.length, JSON.stringify(done));
  await ctx.close();
}

/* ---------- practice cannot break a streak either ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  await startSession(page, '#/test');
  await play(page);
  const before = (await streaks(page)).train;

  await startSession(page, '#/daily');
  const said = await play(page, { missFirst: true });
  const after = await streaks(page);
  const fumbled = said[0].word;

  ok('a word missed in practice keeps its test streak',
     before === 1 && after[fumbled] === 1,
     `${fumbled}: ${before} before, ${after[fumbled]} after`);

  /* Missing one ON A TEST is a different matter — that is the measure. */
  await startSession(page, '#/test');
  await play(page, { missFirst: true });
  const afterTest = await streaks(page);
  ok('a word missed on a test starts over',
     Object.values(afterTest).some(v => v === 0), JSON.stringify(afterTest));
  await ctx.close();
}

/* ---------- a fresh order every time ---------- */

{
  /* Six words rather than three, so "same order twice" is a real
     coincidence rather than a one-in-six one. And a threshold nothing can
     reach, because a word that masters leaves the pool and the next test
     would have nothing to ask. */
  const SIX = ['train', 'paint', 'afraid', 'explain', 'brain', 'chain'];
  const { ctx, page } = await open('2026-09-21', null,
    { practiceTestSize: 6, masteryThreshold: 99 }, SIX);
  const orders = [];
  for (let i = 0; i < 6; i++) {
    await startSession(page, '#/test');
    orders.push((await play(page)).map(x => x.word).join(' '));
  }
  /* Six runs of the same words. Identical order every time would mean the
     shuffle is not happening; she learns the sequence long before anyone
     notices she is not reading the words. */
  ok('the same words come up in a different order', new Set(orders).size > 1,
     `${new Set(orders).size} distinct orders in 6 runs`);
  ok('...and it is always the same words',
     new Set(orders.map(o => o.split(' ').sort().join(' '))).size === 1);
  await ctx.close();
}

/* ---------- the old save moves across ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  const moved = await page.evaluate(async () => {
    /* A save from before the rule changed: three in a row, no flag. */
    const raw = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    raw.settings = { masteryThreshold: 3 };
    raw.words[0].streak = 2;
    localStorage.setItem('spelling-adventure:v1', JSON.stringify(raw));
    return true;
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const after = await page.evaluate(async () => {
    const { settings } = await import('./js/core/state.js');
    const { getState } = await import('./js/core/state.js');
    return { threshold: settings().masteryThreshold, gate: settings().gamesAfterDaily,
             streak: getState().words[0].streak };
  });
  ok('an older save is moved to five, and keeps what she had earned',
     moved && after.threshold === 5 && after.streak === 2, JSON.stringify(after));
  ok('...and gets the games gate with it', after.gate === true);
  await ctx.close();
}

/* ---------- with "Once a day" turned on ---------- */

{
  const { ctx, page } = await open('2026-09-21', null, { oneCreditPerDay: true });
  await startSession(page, '#/test');
  await play(page);
  const after1 = await streaks(page);

  await startSession(page, '#/test');
  const said = await play(page);
  const after2 = await streaks(page);

  ok('once a day means two tests in one day is still one',
     after1.train === 1 && after2.train === 1, `${after1.train} then ${after2.train}`);
  /* A test shows no per-word feedback, so the explanation has to be on the
     results screen or the whole session passes in silence. */
  const results = await page.evaluate(() =>
    document.getElementById('screen').textContent.replace(/\s+/g, ' ').trim());
  ok('...and the results screen says why the dots did not move',
     /already counted for these words/i.test(results),
     results.slice(0, 90));
  await ctx.close();
}

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
if (errs.length && !process.exitCode) process.exitCode = 1;
await browser.close();
