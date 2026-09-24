/* The Word Tree.

   A leaf for every mastered word, with the word on it. Nothing here is
   bought and nothing can be arranged, so there is exactly one thing that
   must always be true: THE TREE IS HER WORK AND NOTHING ELSE. A leaf for
   every mastered word, no leaf for anything she has not mastered, and the
   word on the leaf is the word she learned.

   After that, two things that would quietly ruin it:

     a leaf that moves. If mastering a word rearranged the tree she looked
     at yesterday, the tree would stop being a place and start being a
     chart. Her first word stays in the middle for ever.

     a tree that outgrows the screen. It has to hold together at forty
     words and at four hundred, because a child who keeps at this for two
     years will get there.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();
const DAY = 86400000;

/* `mastered` words are mastered, the rest are still being learned. `due`
   of the mastered ones are ready for a review. */
const SEED = ({ mastered, learning = 0, due = 0 }) => {
  const now = Date.now();
  const row = (text, i, isMastered, isDue) => ({
    id: 'w' + i, listId: 'l1', text, definition: '', sentence: '', hint: '', tags: [],
    attempts: 6, correctCount: isMastered ? 6 : 2, incorrectCount: isMastered ? 0 : 4,
    streak: isMastered ? 5 : 2, lastCreditDay: null, lastDailyDay: null, recent: [],
    firstSeen: now - 200 * 86400000, lastSeen: now, lastCorrect: now, lastMissed: null,
    /* Oldest first, so word 0 is the first one she ever mastered. */
    masteredAt: isMastered ? now - (400 - i) * 86400000 : null,
    reviewAt: isMastered ? (isDue ? now - 86400000 : now + 30 * 86400000) : null,
    reviewStep: 0, createdAt: now,
  });
  const words = [];
  for (let i = 0; i < mastered; i++) words.push(row(`word${i}`, i, true, i < due));
  for (let i = 0; i < learning; i++) words.push(row(`later${i}`, mastered + i, false, false));

  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words,
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 200, milestonesEarned: ['word_tree'] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] },
  }));
};

/* Seeds, then loads the app fresh BEFORE asking for a screen behind the
   gate: going straight to #/tree with the old state still in memory gets
   bounced, and then the reload happens on the wrong hash. */
async function open(plan, hash = '#/tree') {
  const ctx = await browser.newContext({ viewport: { width: 950, height: 900 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.addInitScript(() => {
    const s = window.speechSynthesis;
    if (s) {
      s.getVoices = () => [{ name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true }];
      window.__said = [];
      s.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend?.(new Event('end')), 10); };
      s.cancel = () => {}; s.resume = () => {};
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, plan);
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  await page.goto(`${BASE}${hash}`);
  await page.waitForTimeout(800);
  return { ctx, page };
}

const leafCount = page => page.locator('[data-leaf]').count();
const leafWords = page => page.evaluate(() =>
  [...document.querySelectorAll('[data-leaf] text')].map(t => t.textContent));

/* ---------- the gate ---------- */
{
  const { ctx, page } = await open({ mastered: 39, learning: 20 }, '#/tree');
  ok('at 39 mastered words the tree is not reachable',
     !/Word Tree/i.test(await page.evaluate(() => document.body.innerText)) ||
     await leafCount(page) === 0);
  const gate = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    return { open: t.treeOpen(), left: t.wordsToGo(), line: t.gateLine() };
  });
  ok('the gate is shut', gate.open === false);
  ok('and it knows how far off it is', gate.left === 1, String(gate.left));
  ok('a shut gate says the number rather than just "no"',
     /one more/i.test(gate.line), gate.line);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 40 });
  const gate = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    return { open: t.treeOpen(), left: t.wordsToGo() };
  });
  ok('at 40 it opens', gate.open === true);
  ok('and there is nothing left to go', gate.left === 0);
  ok('the tree is on the screen', await leafCount(page) === 40, String(await leafCount(page)));
  await ctx.close();
}

/* ---------- it is her work and nothing else ---------- */
{
  const { ctx, page } = await open({ mastered: 40, learning: 25 });
  const shown = await leafWords(page);
  ok('one leaf for every mastered word', shown.length === 40, String(shown.length));
  ok('and the word she learned is on it',
     shown.includes('word0') && shown.includes('word39'), shown.slice(0, 3).join(','));
  ok('a word she has NOT mastered has no leaf',
     !shown.some(w => w.startsWith('later')), shown.filter(w => w.startsWith('later')).join(','));
  await ctx.close();
}

/* ---------- a leaf does not move ---------- */
{
  const { ctx, page } = await open({ mastered: 40 });
  const before = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    return t.leafLayout(40).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  });
  const after = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    return t.leafLayout(41).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  });
  ok('mastering a word does not move the forty already there',
     before.every((p, i) => p === after[i]));
  ok('it adds one on the outside', after.length === 41);

  const first = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    return [40, 100, 400].map(n => {
      const p = t.leafLayout(n)[0];
      return Math.hypot(p.x, p.y).toFixed(2);
    });
  });
  ok('her first word stays in the middle whatever else she learns',
     new Set(first).size === 1, first.join(' '));

  /* Even growth: the spiral has no clumps or bald patches at any count. */
  const spread = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    const out = {};
    for (const n of [40, 120, 400]) {
      const pts = t.leafLayout(n);
      /* How many leaves in each of eight wedges — a fair spiral puts
         roughly an eighth in each. Measured in the spiral's own space:
         the canopy is an ellipse, so the stretch alone would pile points
         up either side and that is the shape of a tree, not a clump. */
      const wedges = new Array(8).fill(0);
      pts.forEach(p => {
        const a = Math.atan2(p.y / t.SPREAD.y, p.x / t.SPREAD.x);
        wedges[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 8]++;
      });
      out[n] = +(Math.max(...wedges) / Math.min(...wedges)).toFixed(2);
    }
    return out;
  });
  /* Forty leaves across eight wedges is five each, and five is a small
     enough number that one wedge having six and another four is ordinary
     rather than a clump. A big canopy has to be tighter than that. */
  ok('the canopy is even all the way round at every size',
     spread[40] < 1.6 && spread[120] < 1.25 && spread[400] < 1.15,
     JSON.stringify(spread));
  await ctx.close();
}

/* ---------- it holds together as it grows ---------- */
{
  const { ctx, page } = await open({ mastered: 40 });
  const fits = await page.evaluate(async () => {
    const t = await import('./js/core/wordtree.js');
    const frame = { fitX: 62, fitY: 29 };
    const out = {};
    for (const n of [40, 120, 300, 600]) {
      const s = t.canopyScale(n, frame);
      const pts = t.leafLayout(n);
      out[n] = {
        w: Math.max(...pts.map(p => Math.abs(p.x))) * s,
        h: Math.max(...pts.map(p => Math.abs(p.y))) * s,
        scale: s,
      };
    }
    return out;
  });
  ok('a canopy of any size stays inside the frame',
     Object.values(fits).every(f => f.w <= 62.5 && f.h <= 29.5), JSON.stringify(fits));
  ok('a small tree is not blown up to fill it', fits[40].scale <= 1);
  ok('and a big tree really is bigger than a small one',
     fits[300].w > fits[40].w, `${fits[40].w} vs ${fits[300].w}`);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 300 });
  ok('three hundred words still draws every leaf',
     await leafCount(page) === 300, String(await leafCount(page)));
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('and nothing runs off the side of the screen', overflow <= 0, `${overflow}px`);
  await ctx.close();
}

/* ---------- tapping a leaf ---------- */
{
  const { ctx, page } = await open({ mastered: 40, due: 3 });
  await page.click('[data-leaf]');
  await page.waitForTimeout(400);

  const card = await page.locator('.wt-card').innerText();
  ok('tapping a leaf shows the word', /word\d+/.test(card), card.replace(/\s+/g, ' '));
  ok('and when she mastered it', /Mastered/.test(card), card.replace(/\s+/g, ' '));
  ok('and says it out loud',
     (await page.evaluate(() => window.__said)).length > 0);

  await page.click('.wt-card button:has-text("Close")');
  await page.waitForTimeout(200);
  ok('and it closes when she is done looking',
     await page.locator('.wt-card').isHidden());
  await ctx.close();
}

/* ---------- words due for a check ---------- */
{
  const { ctx, page } = await open({ mastered: 40, due: 3 });
  ok('a word ready for a check is marked',
     await page.locator('.wt-due').count() === 3,
     String(await page.locator('.wt-due').count()));
  const note = await page.evaluate(() => document.body.innerText);
  ok('and said plainly under the tree', /ready for a check/i.test(note));

  /* The thing this must never do. */
  ok('a word waiting for a check is not called lost',
     !/lost|forgot|gone|failed/i.test(note), note.slice(0, 200));
  ok('and it still has its leaf', await leafCount(page) === 40);
  await ctx.close();
}

/* ---------- the gate at the end of the garden ---------- */
{
  const { ctx, page } = await open({ mastered: 25 }, '#/garden');
  ok('the gate is in the garden even while it is shut',
     await page.locator('.garden-gate').count() === 1);
  await page.click('.garden-gate');
  await page.waitForTimeout(300);
  const said = await page.locator('.room-speech').innerText();
  ok('tapping a shut gate says how many words are left',
     /15 more mastered words/.test(said), said);
  ok('and it does not go anywhere',
     !/tree/.test(await page.evaluate(() => location.hash)));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 40 }, '#/garden');
  await page.click('.garden-gate');
  await page.waitForTimeout(700);
  ok('an open gate goes through to the tree',
     /#\/tree/.test(await page.evaluate(() => location.hash)));
  await ctx.close();
}

/* ---------- a typed URL is a gate too ---------- */
{
  const { ctx, page } = await open({ mastered: 10 }, '#/tree');
  await page.waitForTimeout(500);
  ok('the tree cannot be reached by typing its address early',
     await leafCount(page) === 0 && !/#\/tree/.test(await page.evaluate(() => location.hash)),
     await page.evaluate(() => location.hash));
  await ctx.close();
}

/* ---------- the celebration ---------- */
{
  const { ctx, page } = await open({ mastered: 40 });
  const m = await page.evaluate(async () => {
    const r = await import('./js/core/rewards.js');
    const found = r.MILESTONES.find(x => x.id === 'word_tree');
    return { at: found?.test({ mastered: 40, streak: 0, completedLists: 0 }),
             not39: found?.test({ mastered: 39, streak: 0, completedLists: 0 }),
             /* It opens a place rather than handing her an ornament. */
             item: found?.item || null };
  });
  ok('there is a milestone at forty', m.at === true);
  ok('and not at thirty-nine', m.not39 === false);
  ok('it opens a place rather than giving a keepsake', m.item === null);
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
