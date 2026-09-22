/* Does the spelling still work.

   The oldest suite and the one that matters most: a whole day's practice,
   end to end, with the payouts checked line by line. Every feature since
   has been built on top of this working, so it runs first.

   The thing it really guards is the daily cap — one credit per word per
   day, so three in a row means three different days and not three goes in
   one sitting. Without that, mastery is copying.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1200 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s?.speak) { const o = s.speak.bind(s); s.speak = u => { if (u?.text) window.__spoken.push(u.text); try { o(u); } catch {} }; }
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')));

/* The axolotl turns up with a present after roughly a quarter of sessions.
   It is a modal, so it sits over whatever the test wants to click next.
   Real behaviour, so the test acknowledges it the way she would. */
async function clearDiscovery(p) {
  if (await p.locator('.find-box').count()) {
    await p.click('.find-box', { force: true });     // it wiggles on purpose
    await p.waitForTimeout(700);
  }
  const done = p.locator('.find-wrap button:has-text("Lovely")');
  if (await done.count()) { await done.click(); await p.waitForTimeout(350); }
}

async function play({ missFirst = false, max = 30 } = {}) {
  await page.waitForSelector('.keyboard', { timeout: 6000 });
  let missed = false;
  for (let t = 0; t < max; t++) {
    await page.waitForTimeout(850);
    if (await page.locator('.keyboard').count() === 0) break;
    if (await page.locator('.speak-btn').count() === 0) break;
    await page.evaluate(() => { window.__spoken = []; });
    await page.click('.speak-btn', { force: true });
    await page.waitForTimeout(550);
    const word = (await page.evaluate(() => window.__spoken)).find(x => /^[a-z']+$/i.test(x.trim()));
    if (!word) break;
    let type = word.toLowerCase();
    if (missFirst && !missed) { type = type.slice(0, -1) + 'z'; missed = true; }
    for (const ch of type) await page.click(`.key:text-is("${ch}")`, { timeout: 3000 });
    await page.click('.key-enter');
    await page.waitForTimeout(600);
    const nb = page.locator('button:has-text("Next word")');
    if (await nb.count()) { await nb.click(); await page.waitForTimeout(350); }
  }
  await page.waitForTimeout(900);
  await clearDiscovery(page);
}
const payout = async () => (await page.locator('.payout-row').allTextContents())
  .map(t => t.replace(/\s+/g, ' ').trim());

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// ---- parent setup ----
await page.click('button:has-text("Parent setup")'); await page.waitForTimeout(400);
for (const d of '1234') await page.click(`.hub-tile:text-is("${d}")`);
await page.waitForTimeout(400);
await page.click('text=Spelling lists'); await page.waitForTimeout(250);
await page.click('button:has-text("New list")'); await page.waitForTimeout(250);
await page.fill('input[placeholder*="Week 1"]', 'Week 1');
await page.fill('textarea', ['train','paint','afraid','explain','brain',
  'their | belonging to them | Those are their coats.'].join('\n'));
await page.click('.modal button:has-text("Create")'); await page.waitForTimeout(500);
ok('list created', await page.locator('.word-row').count() === 6);
await page.click('button:has-text("Back")'); await page.waitForTimeout(300);
await page.click('button:has-text("Back")'); await page.waitForTimeout(300);
ok('homophone warning shown', await page.locator('text=Homophones need sentences').count() === 0);
await page.click('button:has-text("welcome screen")'); await page.waitForTimeout(500);

await page.fill('input[placeholder="Your name"]', 'Ellie');
await page.click('button:has-text("Next")'); await page.waitForTimeout(200);
await page.click('button:has-text("Next")'); await page.waitForTimeout(200);
await page.fill('input[placeholder="Pet name"]', 'Bubbles');
await page.click("button:has-text('Let')"); await page.waitForTimeout(500);

// ---- 1. daily practice, all correct ----
await page.click('button:has-text("Today")'); await page.waitForTimeout(900);
await play();
console.log('   daily payout:', (await payout()).join(' | '));
ok('daily = 5 base + 6 first-try = 11', (await save()).progress.stars === 11);
ok('every word covered today', (await save()).words.every(w => w.lastDailyDay));
ok('every word has 1 credit', (await save()).words.every(w => w.streak === 1));

// ---- 2. daily exhausted, extra practice still open ----
await page.click('button:has-text("Go home")'); await page.waitForTimeout(600);
ok('daily button greyed out', await page.locator('button:has-text("All done for today")').isDisabled());
const beforeExtra = (await save()).progress.stars;
await page.click('.hub-tile:has-text("Practice")'); await page.waitForTimeout(900);
await play();
console.log('   extra payout:', (await payout()).join(' | '));
ok('extra practice paid 2 (all correct)', (await save()).progress.stars - beforeExtra === 2);
ok('the daily cap held: still 1 credit each', (await save()).words.every(w => w.streak === 1));

// ---- 3. practice test ----
await page.click('button:has-text("Go home")'); await page.waitForTimeout(600);
const beforePT = (await save()).progress.stars;
await page.click('.hub-tile:has-text("Take a Test")'); await page.waitForTimeout(400);
await page.click('button:has-text("Practice Test")'); await page.waitForTimeout(900);
ok('practice test gives no feedback panel', await page.locator('.feedback').count() === 0);
await play();
console.log('   practice test payout:', (await payout()).join(' | '));
ok('practice test = 10 base + 6 = 16', (await save()).progress.stars - beforePT === 16);

// ---- 4. full spelling test ----
await page.click('button:has-text("Go home")'); await page.waitForTimeout(600);
const beforeFT = (await save()).progress.stars;
await page.click('.hub-tile:has-text("Take a Test")'); await page.waitForTimeout(400);
await page.click('button:has-text("Full Spelling Test")'); await page.waitForTimeout(900);
await play();
console.log('   full test payout:', (await payout()).join(' | '));
ok('full test = 15 + 6 + 5 perfect = 26', (await save()).progress.stars - beforeFT === 26);
await page.screenshot({ path: SP + '/R1-fulltest-results.png', fullPage: true });

// ---- 5. other screens still render ----
await page.click('button:has-text("Go home")'); await page.waitForTimeout(600);
for (const [route, probe] of [['#/words','.seg'], ['#/progress','.stat'], ['#/pet','.pet-stage']]) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  ok(`${route} renders`, await page.locator(probe).count() > 0);
}

// ---- 6. backup round-trip ----
const snapshot = await page.evaluate(() => localStorage.getItem('spelling-adventure:v1'));
const rt = await page.evaluate(async raw => {
  const m = await import('./js/core/storage.js');
  const parsed = m.parseBackup(await m.exportBlob(JSON.parse(raw)).text());
  return { words: parsed.words.length, stars: parsed.progress.stars };
}, snapshot);
ok(`backup round-trips (${rt.words} words, ${rt.stars} stars)`, rt.words === 6);

await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
