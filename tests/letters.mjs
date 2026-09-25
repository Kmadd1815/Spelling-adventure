/* Letters.

   The last of the five unlocks, and the only one that is not a place. An
   axolotl called Marbles writes to her; she writes back by spelling.

   Three things decide whether it works, and none of them is the drawing:

     THE LETTERS ARE ABOUT HER. They are assembled out of what the app
     knows — her duckling's name, what she has put in her pond, how many
     leaves are on her tree — because a fixed set of letters goes stale in
     a fortnight and writing three hundred of them is the same problem
     further away.

     MARBLES ANSWERS WHAT SHE SENT. Without that it is a stream of
     messages rather than a correspondence.

     THERE IS NEVER A BACKLOG. One letter at a time, so a fortnight away
     comes back to a letter and not to a pile of them with a number on it.
     Nothing in this app should ever look like an inbox.

   And, as with the games: writing a letter cannot move a word towards
   mastery. She picks the word, she hears it first, and she gets another
   go — that is not the honest measure the two tests are.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();
const DAY = 86400000;

const SEED = ({ mastered, letters = null, friend = null, equipped = {} }) => {
  const now = Date.now(), D = 86400000;
  localStorage.clear();
  const AL = 'abcdefghijklmnopqrstuvwxyz';
  const nameOf = i => 'sp' + AL[i % 26] + AL[Math.floor(i / 26) % 26] + 'l';
  const save = {
    schemaVersion: 1, createdAt: now,
    child: { name: 'Tessa', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: Array.from({ length: Math.max(mastered + 6, 10) }, (_, i) => ({
      id: 'w' + i, listId: 'l1', text: nameOf(i), definition: '', sentence: '', hint: '', tags: [],
      attempts: 6, correctCount: 6, incorrectCount: 0, streak: i < mastered ? 5 : 2,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now - 200 * D, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: i < mastered ? now - (400 - i) * D : null,
      reviewAt: i < mastered ? now + 30 * D : null, reviewStep: 0, createdAt: now,
    })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 900,
      milestonesEarned: ['garden_gate', 'word_tree', 'the_egg', 'the_pond', 'the_letters'] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood',
                sky: 'sky_day', ground: 'ground_grass', ...equipped },
    collection: { items: ['rug_round', 'tree_apple', 'pond_log']
      .map(id => ({ id, itemId: id, source: 'shop', earnedAt: now })) },
  };
  if (letters) save.letters = letters;
  if (friend) save.friend = friend;
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
};

async function open(plan, hash = '#/') {
  const ctx = await browser.newContext({ viewport: { width: 950, height: 1100 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.addInitScript(() => {
    window.__said = [];
    const s = window.speechSynthesis;
    if (s) {
      s.getVoices = () => [{ name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true }];
      s.speak = u => { if (u?.text) window.__said.push(u.text);
                       setTimeout(() => u.onend?.(new Event('end')), 10); };
      s.cancel = () => {}; s.resume = () => {};
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, plan);
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  if (hash !== '#/') { await page.goto(`${BASE}${hash}`); await page.waitForTimeout(800); }
  return { ctx, page };
}

const saved = page => page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).letters || {});

/* ---------- the gate ---------- */
{
  const { ctx, page } = await open({ mastered: 109 }, '#/garden');
  const g = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    return { open: L.lettersOpen(), left: L.wordsToGo(), line: L.gateLine(), due: L.letterDue() };
  });
  ok('at 109 mastered words no letters yet', g.open === false);
  ok('and it is one word off', g.left === 1, String(g.left));
  ok('a shut postbox says the number rather than just "no"',
     /one more/i.test(g.line), g.line);
  ok('and nothing is delivered', g.due === false);

  ok('the postbox is in the garden even before it opens',
     await page.locator('.garden-post').count() === 1);
  await page.click('.garden-post');
  await page.waitForTimeout(300);
  ok('tapping it says how far off it is',
     /one more mastered word/i.test(await page.locator('.room-speech').innerText()),
     await page.locator('.room-speech').innerText());
  ok('and it goes nowhere', !/letters/.test(await page.evaluate(() => location.hash)));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 110 }, '#/garden');
  ok('at 110 the first letter is waiting',
     (await saved(page)).thread?.length === 1, JSON.stringify((await saved(page)).thread?.length));
  await page.click('.garden-post');
  await page.waitForTimeout(700);
  ok('and the postbox opens it',
     /#\/letters/.test(await page.evaluate(() => location.hash)));
  ok('there is a letter on the screen', await page.locator('.lt-paper').count() >= 1);
  ok('it is from Marbles', /Marbles/.test(await page.locator('.lt-paper').first().innerText()));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 20 }, '#/letters');
  await page.waitForTimeout(500);
  ok('the letters cannot be reached by typing the address early',
     await page.locator('.lt-paper').count() === 0 &&
     !/#\/letters/.test(await page.evaluate(() => location.hash)),
     await page.evaluate(() => location.hash));
  await ctx.close();
}

/* ---------- the letters are about her ---------- */
{
  const { ctx, page } = await open({
    mastered: 130,
    friend: { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 },
    equipped: { rug: 'rug_round', tree: 'tree_apple', pondFeature: 'pond_log' },
  });

  /* Composed a hundred times: every one of these facts has to be able to
     come up, and none of them may come from anywhere but her save. */
  const built = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    return Array.from({ length: 120 }, () => {
      const l = L.composeLetter();
      return { text: l.lines.join(' '), question: l.question, asked: l.lines.includes(l.question) };
    });
  });
  const seen = built.map(b => b.text);
  const all = seen.join(' ');
  ok('the letters use her name', seen.every(l => /Tessa/.test(l)));
  ok('they mention her duckling by the name she gave it', /Pip/.test(all));
  ok('and what she has put in her pond', /Sunken Log/.test(all));
  ok('and what is in her garden', /Apple Tree/.test(all));
  ok('and what is in her room', /Round Rug/.test(all));
  ok('and how big her word tree has got', /130 leaves/.test(all));

  /* The whole reason they are assembled rather than written. */
  const unique = new Set(seen).size;
  ok('no two letters in a hundred are the same', unique > 100, `${unique} of 120 different`);
  ok('and every one of them asks her something',
     built.every(b => b.question && b.asked),
     JSON.stringify(built.find(b => !b.asked) || {}));
  await ctx.close();
}
{
  /* A save with nothing in the pond and no duckling must not produce a
     letter about her 0 leaves or her undefined duckling. */
  const { ctx, page } = await open({ mastered: 110 });
  const lines = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    return Array.from({ length: 60 }, () => L.composeLetter().lines.join(' '));
  });
  ok('a letter never mentions a thing she has not got',
     !lines.some(l => /undefined|null|NaN| 0 |your duckling\?/.test(l)),
     lines.find(l => /undefined|null|NaN/.test(l)) || 'clean');
  await ctx.close();
}

/* ---------- never a backlog ---------- */
{
  const { ctx, page } = await open({ mastered: 110 });
  const r = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    const now = Date.now();
    const first = L.deliverIfDue(now);
    /* A fortnight away. Five letters' worth of time. */
    const later = now + 14 * 86400000;
    const extra = [L.deliverIfDue(later), L.deliverIfDue(later), L.deliverIfDue(later)];
    return { first: !!first, extra: extra.filter(Boolean).length,
             waiting: L.waiting(), count: L.thread().length };
  });
  ok('the first letter arrives', r.first === true);
  ok('a fortnight away does not pile up five more letters', r.extra === 0,
     String(r.extra));
  ok('there is exactly one letter to come back to', r.count === 1, String(r.count));
  ok('and it is waiting for her', r.waiting === true);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 110 });
  const r = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    const now = Date.now();
    L.deliverIfDue(now);
    L.sendReply([{ lead: 'x', word: 'apple' }], now);
    return {
      tooSoon: L.letterDue(now + 60 * 60 * 1000),       // an hour later
      nextDay: L.letterDue(now + 1.2 * 86400000),       // a day later
      dueAt2:  L.letterDue(now + 2.1 * 86400000),       // two days later
    };
  });
  ok('no new letter an hour after she replies', r.tooSoon === false);
  ok('nor the next day', r.nextDay === false);
  ok('one two days later', r.dueAt2 === true);
  await ctx.close();
}

/* ---------- Marbles answers what she sent ---------- */
{
  const { ctx, page } = await open({ mastered: 110 });
  const r = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    const now = Date.now();
    L.deliverIfDue(now);
    L.sendReply([{ lead: 'The best word I know is', word: 'rhythm' },
                 { lead: 'and I also like', word: 'journey' }], now);
    /* Composed forty times over the same reply: whichever shape he uses,
       it has to come back to something she actually sent. */
    const lines = Array.from({ length: 40 }, () => L.composeLetter().lines.join(' '));
    return {
      everyOne: lines.every(l => /rhythm/i.test(l) || /journey/i.test(l)),
      missed: lines.find(l => !/rhythm/i.test(l) && !/journey/i.test(l)) || '',
      both: lines.some(l => /rhythm/i.test(l) && /journey/i.test(l)),
      real: (() => { const n = L.deliverIfDue(now + 3 * 86400000);
                     return n ? n.lines.join(' ') : ''; })(),
    };
  });
  ok('every letter after hers comes back to a word she sent', r.everyOne, r.missed);
  ok('and sometimes to all of them', r.both);
  ok('the letter that really arrives does it too',
     /rhythm/i.test(r.real) || /journey/i.test(r.real), r.real);
  await ctx.close();
}

/* ---------- writing one ---------- */
{
  const { ctx, page } = await open({ mastered: 110 }, '#/letters');
  const before = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    return { stars: s.progress.stars,
             words: s.words.map(w => `${w.text}:${w.attempts}:${w.streak}`).join(',') };
  });

  await page.click('button:has-text("Write back")');
  await page.waitForTimeout(500);
  const choices = await page.locator('.lt-choice').allInnerTexts();
  ok('she is offered some of her own words', choices.length === 3, choices.join(','));
  ok('and they really are her words',
     choices.every(c => /^sp[a-z][a-z]l$/.test(c)), choices.join(','));

  await page.locator('.lt-choice').first().click();
  await page.waitForTimeout(400);
  ok('picking one says it out loud',
     (await page.evaluate(() => window.__said)).includes(choices[0]),
     (await page.evaluate(() => window.__said)).join(','));
  ok('and it is NOT written on the screen for her to copy',
     !(await page.evaluate(() => document.body.innerText)).includes(choices[0]),
     'the word was on screen while she was meant to be spelling it');
  ok('there is a box for every letter of it',
     await page.locator('.lt-tile').count() === choices[0].length,
     `${await page.locator('.lt-tile').count()} for ${choices[0]}`);

  /* Spell it wrong first: a letter is not a test, so it is rubbed out and
     she goes again with the same word. */
  for (const ch of 'zzz') await page.click(`.key:text-is("${ch}")`);
  await page.click('button:has-text("Write it")');
  await page.waitForTimeout(1200);
  ok('a wrong spelling is not posted',
     await page.locator('.lt-tile').count() === choices[0].length &&
     (await page.locator('.lt-tile').allInnerTexts()).join('') === '',
     'it was not rubbed out');
  ok('and she keeps the word she chose',
     (await page.evaluate(() => window.__said)).filter(w => w === choices[0]).length >= 2,
     'the word was not said again');

  for (const ch of choices[0]) await page.click(`.key:text-is("${ch}")`);
  await page.click('button:has-text("Write it")');
  await page.waitForTimeout(900);

  const second = await page.locator('.lt-choice').allInnerTexts();
  ok('then it asks for a second word', second.length === 3, second.join(','));
  ok('and never offers the one she just used', !second.includes(choices[0]),
     second.join(','));

  await page.locator('.lt-choice').first().click();
  await page.waitForTimeout(400);
  for (const ch of second[0]) await page.click(`.key:text-is("${ch}")`);
  await page.click('button:has-text("Write it")');
  await page.waitForTimeout(1300);

  const posted = await page.evaluate(() => document.body.innerText);
  ok('two words and the letter is posted', /Posted/.test(posted), posted.slice(0, 120));

  const after = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    return { stars: s.progress.stars,
             words: s.words.map(w => `${w.text}:${w.attempts}:${w.streak}`).join(','),
             thread: (s.letters?.thread || []).length,
             sent: (s.letters?.thread || []).filter(e => e.from === 'her').length };
  });
  ok('it pays her in stars', after.stars > before.stars, `${before.stars} → ${after.stars}`);
  ok('her letter is kept', after.sent === 1 && after.thread === 2, JSON.stringify(after));

  /* The rule this shares with the games. */
  ok('writing a letter does not touch her spelling history',
     after.words === before.words, 'a word moved');
  await ctx.close();
}

/* ---------- reading them back ---------- */
{
  /* A settled correspondence: she has answered the last letter, and the
     next one is not due yet, so nothing new arrives while she is looking. */
  const { ctx, page } = await open({ mastered: 110, letters: {
    thread: [
      { id: 'a', from: 'pal', at: Date.now() - 6 * DAY, lines: ['Dear Tessa,', 'Hello!'] },
      { id: 'b', from: 'her', at: Date.now() - 5 * DAY, lines: ['I sent you rhythm.'], words: ['rhythm'] },
      { id: 'c', from: 'pal', at: Date.now() - 1000, lines: ['Thank you for rhythm.'] },
      { id: 'd', from: 'her', at: Date.now() - 500, lines: ['Here is journey.'], words: ['journey'] },
    ],
    lastArrivedAt: Date.now() - 1000, unread: false,
  } }, '#/letters');
  await page.waitForTimeout(600);
  ok('with nothing waiting she can read the whole correspondence back',
     await page.locator('.lt-paper').count() === 4,
     String(await page.locator('.lt-paper').count()));
  const text = await page.evaluate(() => document.body.innerText);
  ok('both sides of it are there', /From Marbles/.test(text) && /You wrote/.test(text));
  ok('and there is no unanswered count anywhere on it',
     !/\b\d+ unread\b|inbox/i.test(text), text.slice(0, 200));
  ok('nothing new is delivered while she is reading',
     (await saved(page)).thread.length === 4,
     String((await saved(page)).thread.length));
  await ctx.close();
}
{
  /* A letter waiting: she lands on that one letter, not on the pile. */
  const { ctx, page } = await open({ mastered: 110, letters: {
    thread: [
      { id: 'a', from: 'pal', at: Date.now() - 6 * DAY, lines: ['Dear Tessa,', 'Old news.'] },
      { id: 'b', from: 'her', at: Date.now() - 5 * DAY, lines: ['I sent you rhythm.'], words: ['rhythm'] },
      { id: 'c', from: 'pal', at: Date.now() - 1000, lines: ['Thank you for rhythm.'] },
    ],
    lastArrivedAt: Date.now() - 1000, unread: true,
  } }, '#/letters');
  await page.waitForTimeout(600);
  ok('a waiting letter opens on its own', await page.locator('.lt-paper').count() === 1,
     String(await page.locator('.lt-paper').count()));
  ok('and it is the new one, not the old one',
     /Thank you for rhythm/.test(await page.locator('.lt-paper').innerText()));
  await page.click('button:has-text("Read them all")');
  await page.waitForTimeout(400);
  ok('the older ones are one tap away', await page.locator('.lt-paper').count() === 3,
     String(await page.locator('.lt-paper').count()));
  await ctx.close();
}

/* ---------- moving to another tablet ---------- */
{
  const { ctx, page } = await open({ mastered: 110, letters: {
    thread: [{ id: 'a', from: 'pal', at: Date.now() - 3 * DAY, lines: ['Dear Tessa,', 'Hello!'] },
             { id: 'b', from: 'her', at: Date.now() - 600, lines: ['I sent you rhythm.'], words: ['rhythm'] }],
    lastArrivedAt: Date.now() - 1000, unread: false,
  } });
  const backup = await page.evaluate(() =>
    localStorage.getItem('spelling-adventure:v1'));
  await ctx.close();

  const fresh = await browser.newContext({ viewport: { width: 950, height: 1100 } });
  const page2 = await fresh.newPage();
  watch(page2, errs);
  await page2.goto(BASE, { waitUntil: 'networkidle' });
  await page2.evaluate(json => {
    localStorage.clear();
    localStorage.setItem('spelling-adventure:v1', json);
  }, backup);
  await page2.goto(BASE);
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(500);
  await page2.goto(`${BASE}#/letters`);
  await page2.waitForTimeout(800);
  ok('the whole correspondence comes with her to a new tablet',
     await page2.locator('.lt-paper').count() >= 2,
     String(await page2.locator('.lt-paper').count()));
  ok('and it still reads as hers', /rhythm/.test(await page2.evaluate(() => document.body.innerText)));
  await fresh.close();
}

/* ---------- a save from before any of this ---------- */
{
  const { ctx, page } = await open({ mastered: 12 });
  const l = await page.evaluate(async () => {
    const L = await import('./js/core/letters.js');
    return { thread: L.thread().length, waiting: L.waiting(), open: L.lettersOpen() };
  });
  ok('an old save reads as no letters, not as broken',
     l.thread === 0 && l.waiting === false && l.open === false, JSON.stringify(l));
  await ctx.close();
}

/* ---------- the celebration ---------- */
{
  const { ctx, page } = await open({ mastered: 110 });
  const m = await page.evaluate(async () => {
    const r = await import('./js/core/rewards.js');
    const found = r.MILESTONES.find(x => x.id === 'the_letters');
    return { at: found?.test({ mastered: 110, streak: 0, completedLists: 0 }),
             not109: found?.test({ mastered: 109, streak: 0, completedLists: 0 }),
             item: found?.item || null };
  });
  ok('there is a milestone at a hundred and ten', m.at === true);
  ok('and not at a hundred and nine', m.not109 === false);
  ok('it opens something rather than handing her an ornament', m.item === null);
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
