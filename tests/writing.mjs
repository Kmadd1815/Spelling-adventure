/* Write It — tracing letters with a finger.

   Two things are worth testing here and they pull in opposite directions.

   It has to be able to tell a trace from a scribble, or the game is a
   button that says "Lovely" whatever she does. And it has to be forgiving,
   because it is a finger on glass and a nine year old who cannot get past
   the 'g' puts the tablet down for good.

   The third thing is the quiet one: tracing must leave her spelling
   history alone. The letters are on the screen — copying them is not
   evidence she can spell the word, and a game that bumped her correct
   count would make every number in the Parent Area slightly untrue.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

const SEED = list => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: list.map((text, i) => ({
      id: 'w' + i, listId: 'l1', text, definition: '', sentence: '', hint: '', tags: [],
      attempts: 4, correctCount: 3, incorrectCount: 1, streak: 3,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: now, lastSeen: now,
      lastCorrect: now, lastMissed: null, masteredAt: null, reviewAt: null, reviewStep: 0,
      createdAt: now })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 40, milestonesEarned: [] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] } }));
};

async function open(list = ['cat', 'dog']) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 950 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.addInitScript(() => {
    const s = window.speechSynthesis;
    if (s) {
      s.getVoices = () => [{ name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true }];
      s.speak = u => { setTimeout(() => u.onend?.(new Event('end')), 10); };
      s.cancel = () => {}; s.resume = () => {};
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, list);
  await page.goto(`${BASE}#/play?id=trace`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  return { ctx, page };
}

/* Paints something onto the ink canvas, the way a finger would have. */
const draw = (page, how) => page.evaluate(kind => {
  const ink = document.querySelector('.trace-ink');
  if (!ink) return false;
  const W = ink.width, H = ink.height;
  const c = ink.getContext('2d');
  const brush = Math.max(16, Math.round(H * 0.075));
  c.strokeStyle = '#4a3b32'; c.lineWidth = brush; c.lineCap = 'round'; c.lineJoin = 'round';

  if (kind === 'scribble') {
    c.beginPath();
    c.moveTo(20, 20); c.lineTo(W - 20, H - 20);
    c.moveTo(20, H - 20); c.lineTo(W - 20, 20);
    c.stroke();
    return true;
  }
  if (kind === 'nothing') return true;

  /* A trace: follow the letter, wobbling off it a little the way a finger
     does. `kind` is 'good' or 'wobbly'. */
  const off = kind === 'wobbly' ? 6 : 0;
  const ch = document.querySelector('.trace-ch.now')?.textContent || '';
  const family = getComputedStyle(document.body).fontFamily;
  c.font = `500 ${Math.round(H * 0.62)}px ${family}`;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.strokeText(ch, W / 2 + off, Math.round(H * 0.78) + off);
  return true;
}, how);

const at = page => page.locator('.trace-say').innerText();
const verdict = page => page.locator('.trace-verdict').innerText();
const tapDone = async page => {
  await page.click('button:has-text("Done")');
  await page.waitForTimeout(450);
};

/* ---------- it can tell a trace from a scribble ---------- */
{
  const { ctx, page } = await open();
  const scores = await page.evaluate(async () => {
    const { scoreTrace } = await import('./js/games/trace.js');
    const W = 520, H = 360;
    const brush = Math.max(16, Math.round(H * 0.075));
    const family = getComputedStyle(document.body).fontFamily;
    const size = Math.round(H * 0.62), base = Math.round(H * 0.78);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const put = (c, ch, { fill, stroke, width, dx = 0, dy = 0 } = {}) => {
      const x = c.getContext('2d');
      x.font = `500 ${size}px ${family}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      if (fill) { x.fillStyle = fill; x.fillText(ch, W / 2 + dx, base + dy); }
      if (stroke) { x.strokeStyle = stroke; x.lineWidth = width; x.lineJoin = 'round'; x.lineCap = 'round';
                    x.strokeText(ch, W / 2 + dx, base + dy); }
      return c;
    };
    const data = c => c.getContext('2d').getImageData(0, 0, W, H).data;
    const out = {};
    for (const ch of ['c', 'd', 'o', 'g', 'e', 'a', 'w', 't']) {
      const strict = put(mk(), ch, { fill: '#000' });
      const loose = put(mk(), ch, { fill: '#000', stroke: '#000', width: brush * 1.1 });
      const s = (ink) => scoreTrace(data(strict), data(loose), data(ink));
      const scribble = mk();
      { const x = scribble.getContext('2d'); x.strokeStyle = '#000'; x.lineWidth = brush; x.lineCap = 'round';
        x.beginPath(); x.moveTo(20, 20); x.lineTo(W - 20, H - 20);
        x.moveTo(20, H - 20); x.lineTo(W - 20, 20); x.stroke(); }
      out[ch] = {
        good:    s(put(mk(), ch, { stroke: '#000', width: brush })).ok,
        wobbly:  s(put(mk(), ch, { stroke: '#000', width: brush, dx: 6, dy: 5 })).ok,
        blank:   s(mk()).ok,
        scribble: s(scribble).ok,
      };
    }
    return out;
  });

  const letters = Object.entries(scores);
  ok('a trace of the letter passes, for every letter tried',
     letters.every(([, r]) => r.good), letters.filter(([, r]) => !r.good).map(([c]) => c).join(','));
  ok('a wobbly one passes too, because it is a finger',
     letters.every(([, r]) => r.wobbly), letters.filter(([, r]) => !r.wobbly).map(([c]) => c).join(','));
  ok('an empty page does not', letters.every(([, r]) => !r.blank));
  ok('and neither does a scribble across the whole pad',
     letters.every(([, r]) => !r.scribble), letters.filter(([, r]) => r.scribble).map(([c]) => c).join(','));
  await ctx.close();
}

/* ---------- the screen ---------- */
{
  const { ctx, page } = await open(['cat', 'dog']);
  const text = await page.evaluate(() => document.body.innerText);
  ok('the game opens', /Write It/.test(text), text.slice(0, 80));
  ok('it starts on the first letter of the first word',
     /Word 1 of \d+ · letter 1 of 3/.test(await at(page)), await at(page));
  ok('the whole word is on screen to see', await page.locator('.trace-ch').count() === 3);
  ok('with the letter she is on marked', await page.locator('.trace-ch.now').count() === 1);
  ok('there is something to draw on', await page.locator('.trace-ink').count() === 1);

  /* The tablet must draw rather than scroll the page under her hand. */
  ok('the pad does not scroll the page when she draws on it',
     await page.evaluate(() =>
       getComputedStyle(document.querySelector('.trace-pad')).touchAction) === 'none');

  ok('and a way to rub it out', await page.locator('button:has-text("Rub it out")').count() === 1);
  await ctx.close();
}

/* ---------- tracing it ---------- */
{
  const { ctx, page } = await open(['cat']);
  await draw(page, 'good');
  await tapDone(page);
  ok('a good trace is accepted', /✓/.test(await verdict(page)), await verdict(page));
  await page.waitForTimeout(900);
  ok('and moves on to the next letter', /letter 2 of 3/.test(await at(page)), await at(page));
  ok('the letter behind her is marked done',
     await page.locator('.trace-ch.done').count() === 1);

  /* Rubbing out clears her ink and nothing else. */
  await draw(page, 'scribble');
  await page.click('button:has-text("Rub it out")');
  await page.waitForTimeout(250);
  const inkLeft = await page.evaluate(() => {
    const c = document.querySelector('.trace-ink');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) n++;
    return n;
  });
  ok('"rub it out" leaves a clean page', inkLeft === 0, `${inkLeft} pixels left`);
  ok('and stays on the same letter', /letter 2 of 3/.test(await at(page)), await at(page));
  await ctx.close();
}

/* ---------- she is never stuck ---------- */
{
  const { ctx, page } = await open(['cat']);
  await draw(page, 'scribble');
  await tapDone(page);
  ok('a scribble is not accepted', !/✓/.test(await verdict(page)), await verdict(page));
  ok('and she is told something useful, not just "no"',
     /grey letter/.test(await verdict(page)), await verdict(page));
  ok('it is still the same letter', /letter 1 of 3/.test(await at(page)), await at(page));

  await page.waitForTimeout(700);
  await draw(page, 'scribble');
  await tapDone(page);
  ok('the second bad go moves on anyway, so she cannot get stuck',
     !/Nearly/.test(await verdict(page)), await verdict(page));
  await page.waitForTimeout(1300);
  ok('on to the next letter', /letter 2 of 3/.test(await at(page)), await at(page));
  ok('and it does not tell her off', !/wrong|bad|no\b/i.test(await verdict(page)),
     await verdict(page));
  await ctx.close();
}

/* ---------- what finishing does, and what it does not ---------- */
{
  const { ctx, page } = await open(['it']);
  const before = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    return { stars: s.progress.stars, attempts: s.words[0].attempts,
             correct: s.words[0].correctCount, streak: s.words[0].streak };
  });

  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.trace-ink').count())) break;
    await draw(page, 'good');
    await tapDone(page);
    await page.waitForTimeout(950);
  }
  await page.waitForTimeout(1200);

  const done = await page.evaluate(() => document.body.innerText);
  ok('finishing the word ends the game', /written by hand|wrote them all|Nice writing/i.test(done),
     done.slice(0, 160));

  await page.waitForTimeout(500);
  const after = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    return { stars: s.progress.stars, attempts: s.words[0].attempts,
             correct: s.words[0].correctCount, streak: s.words[0].streak,
             played: s.progress.gamesPlayed };
  });

  ok('it pays her in stars', after.stars > before.stars, `${before.stars} → ${after.stars}`);
  ok('and counts as a game played', (after.played || 0) === 1, String(after.played));

  /* The point of the whole suite. */
  ok('tracing does NOT count as spelling the word',
     after.attempts === before.attempts && after.correct === before.correct,
     `attempts ${before.attempts}→${after.attempts}, correct ${before.correct}→${after.correct}`);
  ok('and cannot move her towards mastery', after.streak === before.streak,
     `${before.streak} → ${after.streak}`);
  await ctx.close();
}

/* ---------- it is where she can find it ---------- */
{
  const { ctx, page } = await open();
  await page.goto(`${BASE}#/games`);
  await page.waitForTimeout(600);
  ok('Write It is in the games hub',
     await page.locator('.game-card:has-text("Write It")').count() === 1);
  ok('and says what it is',
     /finger/i.test(await page.locator('.game-card:has-text("Write It")').innerText()));
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
