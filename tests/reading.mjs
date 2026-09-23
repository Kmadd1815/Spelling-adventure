/* Text size.

   One number scales every word in the app. Two things have to be true for
   that to be a setting anyone would leave switched on:

     1. It holds. Not on the screen that set it — on every screen, after a
        reload, after the app is closed and opened again. A setting that
        falls off halfway through a game is worse than no setting.

     2. It moves the WORDS and nothing else. Her room, the keyboard, the
        game scenes: all of that is in px and percentages and must measure
        exactly the same at Biggest as at Normal. A text-size setting that
        reflowed her room would not be a text-size setting.

   And it is off by default, because a child who is reading fine should not
   have her app changed under her.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

const SEED = size => {
  const now = Date.now();
  localStorage.clear();
  const save = {
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: ['because', 'journey', 'weather'].map((text, i) => ({
      id: 'w' + i, listId: 'l1', text, definition: 'a word', sentence: `The ${text} was there.`,
      hint: '', tags: [], attempts: 2, correctCount: 1, incorrectCount: 1, streak: 1,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: now, lastSeen: now,
      lastCorrect: now, lastMissed: null, masteredAt: null, reviewAt: null, reviewStep: 0,
      createdAt: now })),
    settings: { parentPin: '1234' },
    progress: { stars: 80, milestonesEarned: [] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] },
  };
  /* undefined means "a save from before this setting existed", which is
     every save she already has. */
  if (size !== undefined) save.settings.textSize = size;
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
};

async function open(size) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.addInitScript(() => {
    const v = { name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true };
    const s = window.speechSynthesis;
    if (s) {
      s.getVoices = () => [v];
      s.speak = u => { setTimeout(() => u.onend?.(new Event('end')), 10); };
      s.cancel = () => {}; s.resume = () => {};
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, size);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { ctx, page };
}

const rootSize = page => page.evaluate(() =>
  parseFloat(getComputedStyle(document.documentElement).fontSize));

/* ---------- off by default ---------- */
{
  const { ctx, page } = await open(undefined);
  ok('a save from before the setting existed reads as Normal',
     await page.evaluate(() => document.documentElement.dataset.text) === 'normal');
  ok('and is the size the app has always been', await rootSize(page) === 16,
     String(await rootSize(page)));
  await ctx.close();
}

/* ---------- it scales ---------- */
{
  const { ctx, page } = await open('biggest');
  const root = await rootSize(page);
  ok('Biggest makes the type bigger', root > 19 && root < 22, String(root));
  ok('and says so on the page, so every screen inherits it',
     await page.evaluate(() => document.documentElement.dataset.text) === 'biggest');

  const heading = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('h1, h2, .btn')).fontSize));
  ok('a real heading is bigger too, not just the root', heading > 20, String(heading));
  await ctx.close();
}

/* ---------- it holds ---------- */
{
  const { ctx, page } = await open('big');
  const at = async where => {
    await page.goto(`${BASE}#${where}`);
    await page.waitForTimeout(500);
    return page.evaluate(() => document.documentElement.dataset.text);
  };
  const screens = ['/', '/practice', '/games', '/shop', '/room', '/progress'];
  const held = [];
  for (const s of screens) held.push(`${s}:${await at(s)}`);
  ok('it holds on every screen', held.every(h => h.endsWith(':big')), held.join(' '));

  /* The one that catches a setting applied by the screen that set it. */
  await page.goto(`${BASE}#/room`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  ok('and survives a reload on a screen that never set it',
     await page.evaluate(() => document.documentElement.dataset.text) === 'big');
  await ctx.close();
}

/* ---------- it moves the words and nothing else ---------- */
async function measure(size) {
  const { ctx, page } = await open(size);
  const out = {};
  await page.goto(`${BASE}#/practice`);
  await page.waitForTimeout(900);
  out.keys = await page.evaluate(() => [...document.querySelectorAll('.key')].slice(0, 6)
    .map(k => { const r = k.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })
    .join(','));
  await page.goto(`${BASE}#/room`);
  await page.waitForTimeout(900);
  out.room = await page.evaluate(() => {
    const r = document.querySelector('.room, .room-stage, .scene')?.getBoundingClientRect();
    return r ? `${Math.round(r.width)}x${Math.round(r.height)}` : 'none';
  });
  out.overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await ctx.close();
  return out;
}
{
  const normal = await measure('normal');
  const biggest = await measure('biggest');
  ok('the keyboard is exactly the same size at Biggest',
     normal.keys === biggest.keys && normal.keys.length > 0,
     `${normal.keys} vs ${biggest.keys}`);
  ok('and so is her room', normal.room === biggest.room && normal.room !== 'none',
     `${normal.room} vs ${biggest.room}`);
  ok('nothing runs off the side of the screen', biggest.overflow <= 0,
     `${biggest.overflow}px`);
}

/* ---------- setting it from the Parent Area ---------- */
{
  const { ctx, page } = await open(undefined);
  await page.goto(`${BASE}#/parent`);
  await page.waitForTimeout(400);
  for (const d of '1234') { await page.click(`button:has-text("${d}")`); await page.waitForTimeout(90); }
  await page.waitForTimeout(400);

  ok('there is a Text size entry in the Parent Area',
     await page.locator('text=Text size').count() > 0);
  await page.click('text=Text size');
  await page.waitForTimeout(350);
  ok('and a preview sentence to read before choosing',
     /The journey took all day/.test(await page.evaluate(() => document.body.innerText)));

  const before = await rootSize(page);
  await page.click('button:has-text("Biggest")');
  await page.waitForTimeout(450);
  const after = await rootSize(page);
  ok('picking a size changes it there and then', after > before, `${before} → ${after}`);

  /* It is a setting, not a session: it must be in her save. */
  await page.waitForTimeout(400);
  ok('and it is written to her save',
     await page.evaluate(() =>
       JSON.parse(localStorage.getItem('spelling-adventure:v1')).settings.textSize) === 'biggest');

  await page.goto(`${BASE}#/`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  ok('so it is still set when she next opens the app',
     await rootSize(page) === after, `${await rootSize(page)} vs ${after}`);

  /* And back again — a setting that cannot be undone is a trap. */
  await page.goto(`${BASE}#/parent`);
  await page.waitForTimeout(400);
  for (const d of '1234') { await page.click(`button:has-text("${d}")`); await page.waitForTimeout(90); }
  await page.waitForTimeout(400);
  await page.click('text=Text size');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Normal")');
  await page.waitForTimeout(450);
  ok('and it can be put back', await rootSize(page) === 16, String(await rootSize(page)));
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
