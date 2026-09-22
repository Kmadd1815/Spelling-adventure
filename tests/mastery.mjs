/* Days in a row.

   The heart of the app: a word is mastered after N correct answers on N
   DIFFERENT days, because three in a row in five minutes only proves she
   can copy letters she is still looking at.

   That rule means a correct answer sometimes earns nothing — she already
   has today's credit, or it was a second look at one she just missed — and
   a right answer that moves no dot is indistinguishable from a broken
   counter unless the screen says so. So this suite checks both: that the
   counting is right, and that it explains itself when it does not move.

   It is the only suite that spans more than one day, which is why it exists
   separately from `regress`.
*/

import { chromium, BASE, ok } from './lib/harness.mjs';

const WORDS = ['train', 'paint', 'afraid'];
const errs = [];
const browser = await chromium.launch();

const SEED = rows => {
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
    const fb = await page.evaluate(() => {
      const f = document.querySelector('.feedback');
      return f ? { text: f.textContent.replace(/\s+/g, ' ').trim(),
                   dots: f.querySelectorAll('.mdot').length,
                   on: f.querySelectorAll('.mdot.on').length } : null;
    });
    if (fb) said.push({ word, ...fb });
    const nb = page.locator('button:has-text("Next word")');
    if (await nb.count()) { await nb.click(); await page.waitForTimeout(350); }
  }
  await page.waitForTimeout(900);
  await clearDiscovery(page);
  return said;
}

const streaks = page => page.evaluate(async () => {
  const { getState } = await import('./js/core/state.js');
  return Object.fromEntries(getState().words.map(w => [w.text, w.streak]));
});

async function open(day, save) {
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1200 } });
  await ctx.addInitScript(hooks(day));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (save) await page.evaluate(s => localStorage.setItem('spelling-adventure:v1', s), save);
  else await page.evaluate(SEED, WORDS);
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { ctx, page };
}

const keep = page => page.evaluate(() => localStorage.getItem('spelling-adventure:v1'));

/* ---------- right on three different days is three dots ---------- */

let save = null;
const seen = [], asked = [];
for (const [i, day] of ['2026-09-21', '2026-09-22', '2026-09-23'].entries()) {
  const { ctx, page } = await open(day, save);
  await page.goto(BASE + '#/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const said = await play(page);
  asked.push([...new Set(said.map(x => x.word))]);
  if (process.env.DEBUG) console.log(`  day ${i + 1} ${day}:`,
    said.map(x => `${x.word}=${x.on}/${x.dots}`).join(' '), '->', JSON.stringify(await streaks(page)));
  seen.push(await streaks(page));
  save = await keep(page);
  await ctx.close();
}
ok('every word gets its turn every day',
   asked.every(day => day.length === WORDS.length),
   asked.map(d => d.length).join(', '));
ok('a right answer on a new day adds a day',
   seen[0].train === 1 && seen[1].train === 2, JSON.stringify(seen.map(s => s.train)));
ok('...three days running masters it',
   seen[2].train === 3, `streak ${seen[2].train}`);

/* ---------- twice in one day is still one day ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  await page.goto(BASE + '#/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await play(page);
  const after1 = await streaks(page);

  /* Today's Practice is finished for the day, so a second go has to be
     extra Practice — which is exactly what she would reach for. */
  await page.goto(BASE + '#/practice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const said = await play(page);
  const after2 = await streaks(page);

  ok('spelling it right twice in one day is still one day',
     after1.train === 1 && after2.train === 1,
     `${after1.train} then ${after2.train}`);

  /* The bug that was reported was this one looking broken. */
  const explained = said.some(s => /already counted/i.test(s.text));
  ok('...and the screen says why the dot did not move',
     explained, said[0]?.text.slice(0, 70) || '(nothing said)');
  await ctx.close();
}

/* ---------- a second look at one she missed ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  await page.goto(BASE + '#/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const said = await play(page, { missFirst: true });
  const after = await streaks(page);

  const missedWord = said[0].word;
  ok('missing a word puts its days back to none',
     after[missedWord] === 0, `${missedWord}: ${after[missedWord]}`);

  const retry = said.find(s => /remembered it/i.test(s.text));
  ok('getting the second look right is praised', !!retry, retry?.text.slice(0, 40));
  /* A scoreboard reading zero under "You remembered it!" is unkind, and
     there is nothing she can do about it today anyway. */
  ok('...without showing her a scoreboard on nought',
     !!retry && retry.dots === 0 && /tomorrow/i.test(retry.text),
     retry ? `${retry.dots} dots — ${retry.text.slice(-46)}` : '(no retry)');
  await ctx.close();
}

/* ---------- and the list says what it is counting ---------- */

{
  const { ctx, page } = await open('2026-09-21', null);
  await page.goto(BASE + '#/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await play(page);
  await page.goto(BASE + '#/words', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.word-row')]
    .map(r => r.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
  ok('My Words says the dots are days, not tries',
     rows.some(t => /1 of 3 days/.test(t)), rows[0]?.slice(0, 60));
  await ctx.close();
}

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
if (errs.length && !process.exitCode) process.exitCode = 1;
await browser.close();
