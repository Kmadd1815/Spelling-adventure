/* The Paper Test.

   Her real spelling test at school is read out loud and written on paper.
   This is that, with the app doing the reading and the grown-up doing the
   marking. Two things make or break it:

     1. The word must never appear on screen while it is being read. If it
        does, the test is worthless — she can copy it. Every check here that
        looks like paranoia is guarding that one line.

     2. A word marked right must move towards mastery through exactly the
        same door as the Spelling Test, or the week's work splits into two
        sets of books that disagree.

   Everything else — the count, going back one, stopping early — is about
   a grown-up marking a page with a child watching, which is not a moment
   to discover a bug in.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

const WORDS = [
  ['because', 'for the reason that', 'I stayed inside because it rained.'],
  ['their',   'belonging to them',   'They took their coats.'],
  ['journey', 'a long trip',         'The journey took all day.'],
];

/* Words one dot short of mastery, so a single right mark tips them over and
   a wrong one is visibly costly. */
const SEED = ({ streak, rows }) => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'Week 7', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map(([text, definition, sentence], i) => ({
      id: 'w' + i, listId: 'l1', text, definition, sentence, hint: '', tags: [],
      attempts: 4, correctCount: 4, incorrectCount: 0, streak,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: null, reviewAt: null, reviewStep: 0, createdAt: now })),
    settings: { masteryThreshold: 5, oneCreditPerDay: false, masteryRuleV2: true },
    progress: { stars: 40, milestonesEarned: [] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] } }));
};

/* A page with a working voice, remembering everything it was asked to say.
   The words never appear on screen, so the spoken log is the only way to
   know which word is up — which is the point. */
async function open({ streak = 4 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.addInitScript(() => {
    window.__spoken = [];
    const s = window.speechSynthesis;
    if (s) {
      const v = { name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true };
      s.getVoices = () => [v];
      s.speak = u => {
        if (u?.text) window.__spoken.push(u.text);
        setTimeout(() => u.onstart?.(new Event('start')), 0);
        setTimeout(() => u.onend?.(new Event('end')), 10);
      };
      s.cancel = () => {};
      s.resume = () => {};
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, { streak, rows: WORDS });
  await page.goto(`${BASE}#/papertest`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(450);
  return { ctx, page };
}

const text = page => page.evaluate(() => document.body.innerText);
const save = page => page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')));
const spoken = page => page.evaluate(() => window.__spoken.filter(Boolean));
const tap = async (page, label) => {
  await page.click(`button:has-text(${JSON.stringify(label)})`);
  await page.waitForTimeout(320);
};

/* Read the last word and the button says "let us mark it" instead. */
const nextWord = async page => {
  const on = await page.locator('button:has-text("Next word")').count();
  await tap(page, on ? 'Next word' : 'let us mark it');
};

/* ---------- the way in ---------- */
{
  const { ctx, page } = await open();
  const t = await text(page);
  ok('the Paper Test has a screen of its own', /Paper test/i.test(t), t.slice(0, 60));
  ok('it offers her list by name', t.includes('Week 7'));
  ok('nothing has been read out before she starts', (await spoken(page)).length === 0);
  await ctx.close();
}

/* ---------- reading: the whole point ---------- */
{
  const { ctx, page } = await open();
  await tap(page, 'Week 7');
  await page.waitForTimeout(400);

  const reading = await text(page);
  ok('the test starts on word one', /1 of 3/.test(reading), reading.slice(0, 80));

  /* The check this suite exists for. Not "the word is not in a heading" —
     the word is nowhere in the rendered page at all. */
  const leaked = WORDS.map(([w]) => w).filter(w => reading.toLowerCase().includes(w));
  ok('THE WORD IS NEVER ON SCREEN', leaked.length === 0, `leaked: ${leaked.join(', ')}`);

  /* Nor hidden in the markup where a curious child would find it by
     turning the tablet, or where a screen reader would read it out. */
  const html = await page.evaluate(() => document.querySelector('main, #app, body').innerHTML.toLowerCase());
  const inMarkup = WORDS.map(([w]) => w).filter(w => html.includes(w));
  ok('nor anywhere in the markup behind it', inMarkup.length === 0, `found: ${inMarkup.join(', ')}`);

  const said = await spoken(page);
  ok('it read the first word out loud', said.some(s => WORDS.some(([w]) => s.includes(w))),
     said.join(' | '));

  /* The grown-up's three helpers. */
  const before = (await spoken(page)).length;
  await tap(page, 'Say it again');
  ok('"Say it again" reads it again', (await spoken(page)).length > before);

  await tap(page, 'Use it in a sentence');
  ok('"Use it in a sentence" reads the sentence',
     (await spoken(page)).some(s => /stayed inside|took their coats|took all day/i.test(s)));

  const after = await text(page);
  const stillHidden = WORDS.map(([w]) => w).filter(w => after.toLowerCase().includes(w));
  ok('and the helpers do not put the word on screen', stillHidden.length === 0,
     `leaked: ${stillHidden.join(', ')}`);

  /* Walk the rest of the way, checking the counter moves. */
  await nextWord(page);
  ok('it moves to word two', /2 of 3/.test(await text(page)));
  await nextWord(page);
  ok('and to word three', /3 of 3/.test(await text(page)));

  const readOut = await spoken(page);
  ok('all three words were read out', WORDS.every(([w]) => readOut.some(s => s.includes(w))),
     readOut.join(' | '));
  await ctx.close();
}

/* ---------- marking ---------- */
{
  const { ctx, page } = await open();
  await tap(page, 'Week 7');
  for (let i = 0; i < 3; i++) await nextWord(page);
  await page.waitForTimeout(300);

  const marking = await text(page);
  ok('after the last word it goes to marking', /Marking 1 of 3/.test(marking), marking.slice(0, 80));
  ok('and NOW the word is shown, to mark against',
     /because|their|journey/i.test(marking), marking.slice(0, 120));
  ok('spelled out letter by letter as well as whole',
     await page.locator('.paper-letters').count() > 0);

  /* Marking order follows reading order, so the grown-up marks the page
     top to bottom. */
  const read = (await spoken(page)).filter(s => WORDS.some(([w]) => s === w));
  const shown = await page.locator('.paper-answer').innerText();
  ok('the first word marked is the first word read', shown.trim().toLowerCase() === read[0],
     `showing ${shown}, read ${read[0]} first`);

  await tap(page, 'Right');
  ok('marking one moves to the next', /Marking 2 of 3/.test(await text(page)));

  /* Back one: a grown-up who taps Right by mistake must be able to undo it
     before the marks are written, because they are written all at once. */
  ok('there is a way back one', await page.locator('button:has-text("Back one")').count() > 0);
  await tap(page, 'Back one');
  ok('back one returns to the word before', /Marking 1 of 3/.test(await text(page)));
  ok('and shows the same word again', (await page.locator('.paper-answer').innerText()).trim().toLowerCase() === read[0]);

  ok('nothing is written to the save until the end',
     (await save(page)).words.every(w => w.attempts === 4),
     'an attempt landed early');
  await ctx.close();
}

/* ---------- what a mark does ---------- */
{
  const { ctx, page } = await open({ streak: 4 });
  await tap(page, 'Week 7');
  for (let i = 0; i < 3; i++) await nextWord(page);
  const order = (await spoken(page)).filter(s => WORDS.some(([w]) => s === w));

  await tap(page, 'Right');
  await tap(page, 'Right');
  await tap(page, 'Wrong');
  await page.waitForTimeout(700);

  const done = await text(page);
  ok('it says how many she got right', /2 of 3/.test(done), done.slice(0, 120));

  const s = await save(page);
  const by = Object.fromEntries(s.words.map(w => [w.text, w]));

  /* The door: a word marked right on paper advances mastery exactly as the
     Spelling Test does. Threshold is 5 and they start on 4, so one right
     mark masters the word. */
  ok('a word marked right is mastered, same as on the Spelling Test',
     !!by[order[0]].masteredAt && !!by[order[1]].masteredAt,
     `${order[0]}:${by[order[0]].streak} ${order[1]}:${by[order[1]].streak}`);
  ok('a word marked wrong loses its run', by[order[2]].streak === 0 && !by[order[2]].masteredAt,
     `${order[2]}:${by[order[2]].streak}`);
  ok('every word was recorded, not just the right ones',
     s.words.every(w => w.attempts === 5), s.words.map(w => `${w.text}:${w.attempts}`).join(' '));

  ok('it counts as a test', (s.progress.testsCompleted || 0) === 1,
     String(s.progress.testsCompleted));
  ok('it pays her in stars', s.progress.stars > 40, `stars ${s.progress.stars}`);
  ok('and it counts as a day of practice',
     (s.sessions || []).some(x => x.mode === 'paperTest'),
     (s.sessions || []).map(x => x.mode).join(','));
  await ctx.close();
}

/* ---------- a clean sweep ---------- */
{
  const { ctx, page } = await open();
  await tap(page, 'Week 7');
  for (let i = 0; i < 3; i++) await nextWord(page);
  for (let i = 0; i < 3; i++) await tap(page, 'Right');
  await page.waitForTimeout(700);
  const done = await text(page);
  ok('all three right is said so', /Every one right|3 of 3/.test(done), done.slice(0, 120));
  ok('and paid a bonus', (await save(page)).progress.stars > 40);
  await ctx.close();
}

/* ---------- stopping early ---------- */
{
  const { ctx, page } = await open();
  await tap(page, 'Week 7');
  await nextWord(page);
  await tap(page, 'Stop the test');
  ok('stopping asks first, so a stray tap does not end the test',
     /Stop the test\?/.test(await text(page)));
  await tap(page, 'Keep going');
  ok('and it carries on where it was', /2 of 3/.test(await text(page)));

  await tap(page, 'Stop the test');
  await page.click('.modal button:has-text("Stop")');
  await page.waitForTimeout(500);
  ok('stopping leaves the test behind', !/of 3/.test(await text(page)));
  const s = await save(page);
  ok('stopping early writes nothing at all',
     s.words.every(w => w.attempts === 4) && !(s.progress.testsCompleted > 0),
     'a half-finished test was recorded');
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
