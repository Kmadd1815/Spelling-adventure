/* The six mini-games, played through.

   The longest suite, and the last to run. Each game is actually played —
   words spelled, letters tapped, the axolotl flown through a gap — because
   a game that renders is not a game that works. The Swim game shipped once
   in a state where the wrong letters could not be avoided, which every
   assertion at the time was happy with.

   The rule it exists to protect: a game can add a mastery credit but never
   take one away, and only where she spells a whole word from memory with
   nothing on screen to copy.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s?.speak) { const o = s.speak.bind(s); s.speak = u => { if (u?.text) window.__spoken.push(u.text); try { o(u); } catch {} }; }
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const WORDS = [
  ['train',  'a line of railway cars',       'We rode the train to town.'],
  ['paint',  'coloured liquid for a brush',  'I will paint a picture.'],
  ['afraid', 'feeling scared',               'She was afraid of the dark.'],
  ['explain','to make something clear',      'Please explain the rule.'],
  ['brain',  'the thinking part of you',     'Use your brain.'],
  ['chain',  'metal links joined together',  'The chain is rusty.'],
  ['plain',  'simple, with no pattern',      'It is a plain shirt.'],
  ['stain',  'a mark that will not wash out', 'There is a stain here.'],
];
const BY_DEF = Object.fromEntries(WORDS.map(([w, d]) => [d, w]));

function seed() {
  const now = Date.now();
  const list = { id: 'l_test', name: 'Week 1', week: '', description: '', archived: false, createdAt: now };
  const words = WORDS.map(([text, definition, sentence], i) => ({
    id: `w_t${i}`, listId: 'l_test', text, definition, sentence, hint: '', tags: [],
    attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
    lastCreditDay: null, lastDailyDay: null, recent: [],
    firstSeen: null, lastSeen: null, lastCorrect: null, lastMissed: null, masteredAt: null,
    createdAt: now,
  }));
  return { list, words };
}

await page.goto(BASE);
await page.evaluate(seedData => {
  localStorage.clear();
  const base = {
    schemaVersion: 1, createdAt: Date.now(),
    child: { name: 'Tester', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [seedData.list], words: seedData.words,
  };
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(base));
}, seed());
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

/* ---------- hub ---------- */
await page.click('.hub-tile:has-text("Games")');
await page.waitForTimeout(500);
const cards = await page.locator('.game-card').count();
const HOW_MANY = await page.evaluate(async () =>
  (await import('/js/core/games.js')).GAMES.length);
ok('the hub shows every game there is', cards === HOW_MANY, `saw ${cards} of ${HOW_MANY}`);
const locked = await page.locator('.game-card-locked').count();
/* Games wait for Today's Practice now, so with a fresh list every card is
   shut — and the gate has the way through printed on it. */
ok('with practice still to do, every game waits', locked === HOW_MANY, `locked ${locked} of ${HOW_MANY}`);
/* Matching on the heading rather than the button: the button's label has a
   curly apostrophe in it, which is a silly thing for a test to depend on. */
ok('...and the gate says how to open it',
   await page.locator('h2:has-text("Practice first")').count() === 1 &&
   await page.locator('.card button.btn-primary').count() === 1);

/* The rest of this suite is about the games themselves, so let practice be
   done and carry on. */
await page.evaluate(async () => {
  const w = await import('./js/core/words.js');
  w.allWords().forEach(x => w.markCoveredToday(x.id));
});
await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.click('.hub-tile:has-text("Games")');
await page.waitForTimeout(500);
ok('with practice done, the games open up',
   await page.locator('.game-card-locked').count() === 0);
ok('buddy is on the hub', await page.locator('.buddy .buddy-pet svg').count() === 1);
await page.screenshot({ path: `${SP}/G0-hub.png` });

const goHub = async () => { await page.goto(BASE + '#/games'); await page.waitForTimeout(450); };
const RESULTS = 'button:has-text("Other games")';
/* Each game starts from a clean ledger so it can be checked on its own
   payout rather than on whatever the daily ceiling left it. */
const resetDay = () => page.evaluate(async () => {
  const state = await import('/js/core/state.js');
  state.update(s => { s.progress.gameDay = null; s.progress.stars = 0; });
});
const goPlay = async id => {
  await resetDay();
  await page.goto(BASE + '#/play?id=' + id);
  await page.waitForTimeout(700);
};
const stars = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')).progress.stars);
const gameDay = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')).progress.gameDay);
const wordState = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')).words);

/* ---------- 1. Word Search ---------- */
await goPlay('wordsearch');
ok('word search built a grid', await page.locator('.ws-cell').count() === 100);
const listed = await page.locator('.ws-word').count();
ok('word search hid some words', listed >= 2, `${listed} words`);
await page.screenshot({ path: `${SP}/G1-wordsearch.png` });

const grid = await page.$$eval('.ws-cell', ns => ns.map(n => n.textContent.trim().toLowerCase()));
const targets = await page.$$eval('.ws-word', ns => ns.map(n => n.textContent.trim().replace(/[^a-z]/gi, '')));
const S = 10, idx = (r, c) => r * S + c;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function matches(word) {
  const out = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) for (const [dr, dc] of DIRS) {
    let good = true;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      if (rr < 0 || rr >= S || cc < 0 || cc >= S || grid[idx(rr, cc)] !== word[i]) { good = false; break; }
    }
    if (good) out.push({ r, c, dr, dc });
  }
  return out;
}

let foundAll = true;
for (const word of targets) {
  const cells = page.locator('.ws-cell');
  let done = false;
  for (const hit of matches(word)) {
    const a = idx(hit.r, hit.c);
    const b = idx(hit.r + hit.dr * (word.length - 1), hit.c + hit.dc * (word.length - 1));
    await cells.nth(a).click();
    await cells.nth(b).click();
    await page.waitForTimeout(280);
    if (await page.locator(RESULTS).count()) { done = true; break; }
    done = await page.locator(`.ws-word-found:has-text("${word}")`).count() > 0;
    if (done) break;
  }
  if (!done) { foundAll = false; console.log(`   could not select "${word}"`); }
  if (await page.locator(RESULTS).count()) break;
}
ok('every hidden word was locatable', foundAll);
await page.waitForTimeout(1600);
ok('word search paid out', await page.locator('.payout-total').count() === 1);
const wsStars = await stars();
ok('word search stars landed', wsStars > 0, `${wsStars} stars`);
await page.screenshot({ path: `${SP}/G2-wordsearch-results.png` });
const wsWords = await wordState();
ok('word search did NOT grant mastery credit', wsWords.every(w => w.streak === 0));
ok('word search still recorded the attempts', wsWords.some(w => w.attempts > 0));

/* ---------- 2. Crossword ---------- */
await goPlay('crossword');
ok('crossword built a grid', await page.locator('.cw-cell:not(.cw-blank)').count() > 6);
const clues = await page.$$eval('.cw-clue', ns => ns.map(n => n.textContent.replace(/^\d+\.\s*/, '').trim()));
ok('crossword crossed at least two words', clues.length >= 2, `${clues.length} clues`);
await page.screenshot({ path: `${SP}/G3-crossword.png` });

let solvedAll = true;
for (let i = 0; i < clues.length; i++) {
  await page.locator('.cw-clue').nth(i).click();
  await page.waitForTimeout(160);
  const answer = BY_DEF[clues[i]];
  if (!answer) { solvedAll = false; console.log('   unknown clue: ' + clues[i]); continue; }
  for (const ch of answer) await page.click(`.key:text-is("${ch}")`);
  await page.click('.key-enter');
  await page.waitForTimeout(420);
}
ok('every crossword clue was answerable', solvedAll);
await page.waitForTimeout(1800);
ok('crossword paid out', await page.locator('.payout-total').count() === 1);
await page.screenshot({ path: `${SP}/G4-crossword-results.png` });
const cwWords = await wordState();
const credited = cwWords.filter(w => w.streak > 0).map(w => w.text);
/* No game moves mastery in either direction any more — only the Practice
   Test and the Spelling Test do. */
ok('crossword does NOT grant mastery credit', credited.length === 0, credited.join(',') || 'none');

/* ---------- Swim gets faster ---------- */

{
  /* Her own suggestion, and it has to be felt rather than merely true: the
     ramp used to be 12% a word over three words and nobody noticed it. */
  const ramp = await page.evaluate(async () => {
    const res = await fetch('./js/games/swim.js');
    const src = await res.text();
    const step = Number((src.match(/SPEED_STEP\s*=\s*([\d.]+)/) || [])[1]);
    const words = Number((src.match(/WORDS_PER_ROUND\s*=\s*(\d+)/) || [])[1]);
    return { step, words, byTheEnd: 1 + step * (words - 1),
             tellsHer: /Faster now/.test(src),
             readsLive: /wordIndex \* SPEED_STEP/.test(src) };
  });
  ok('Swim speeds up enough to feel it', ramp.byTheEnd >= 1.4,
     `${Math.round((ramp.byTheEnd - 1) * 100)}% faster by the last word`);
  ok('...and says so when she earns it', ramp.tellsHer);
  /* Read live, so finishing a word speeds up the rocks already on screen
     rather than only the ones spawned after it. */
  ok('...and the rocks already in the water speed up too', ramp.readsLive);
}

/* ---------- crossword cannot break a streak ---------- */
const streakKept = await page.evaluate(async () => {
  const state = await import('/js/core/state.js');
  const games = await import('/js/core/games.js');
  const id = state.getState().words[0].id;
  state.update(s => { const w = s.words.find(x => x.id === id); w.streak = 2; w.lastCreditDay = '2000-01-01'; });
  games.recordGameAttempt(id, false, { canMaster: true });
  const w = state.getState().words.find(x => x.id === id);
  return { streak: w.streak, incorrect: w.incorrectCount };
});
ok('a missed game word never breaks a mastery streak', streakKept.streak === 2, JSON.stringify(streakKept));
ok('...but the miss is still recorded', streakKept.incorrect >= 1);

/* ---------- 3. Tic Tac Toe ---------- */
await goPlay('tictactoe');
ok('tic tac toe drew nine squares', await page.locator('.ttt-cell').count() === 9);
ok('the axolotl is the opponent', await page.locator('.ttt-side .buddy-pet svg').count() === 1);
for (let turn = 0; turn < 12; turn++) {
  if (await page.locator(RESULTS).count()) break;
  const empties = await page.$$eval('.ttt-cell', ns =>
    ns.map((n, i) => (n.textContent.trim() === '' ? i : -1)).filter(i => i >= 0));
  if (!empties.length) { await page.waitForTimeout(1500); continue; }
  await page.evaluate(() => { window.__spoken = []; });
  await page.locator('.ttt-cell').nth(empties[0]).click();
  await page.waitForTimeout(900);
  if (await page.locator('.ttt-spell').count() === 0) { await page.waitForTimeout(1500); continue; }
  const word = (await page.evaluate(() => window.__spoken)).find(x => /^[a-z']+$/i.test(x.trim()));
  if (!word) { await page.waitForTimeout(1200); continue; }
  for (const ch of word.toLowerCase()) await page.click(`.key:text-is("${ch}")`);
  await page.click('.key-enter');
  await page.waitForTimeout(2900);
}
await page.waitForTimeout(2200);
ok('tic tac toe reached a result', await page.locator('.payout-total').count() === 1);
await page.screenshot({ path: `${SP}/G5-tictactoe.png` });

/* ---------- 4. Tower ---------- */
await goPlay('tower');
ok('tower drew its blocks and pad', await page.locator('.tower-pad .tower-key').count() === 26);
ok('the axolotl is building', await page.locator('.tower-builder svg').count() === 1);
for (let w = 0; w < 4; w++) {
  if (await page.locator(RESULTS).count()) break;
  if (await page.locator('.tower-clue span').count() === 0) break;
  const clue = (await page.locator('.tower-clue span').first().textContent() || '').trim();
  const answer = BY_DEF[clue];
  const tryLetters = answer ? [...new Set(answer.split(''))] : 'etaoinsrhl'.split('');
  for (const ch of tryLetters) {
    const key = page.locator(`.tower-key:text-is("${ch}")`);
    if (await key.count() && await key.isEnabled().catch(() => false)) {
      await key.click().catch(() => {});
      await page.waitForTimeout(160);
    }
  }
  await page.waitForTimeout(2400);
}
await page.waitForTimeout(1200);
ok('tower reached a result', await page.locator('.payout-total').count() === 1);
await page.screenshot({ path: `${SP}/G6-tower.png` });

/* ---------- 5. Snake ---------- */
await goPlay('snake');
ok('snake drew a pond', await page.locator('.snake-cell').count() === 165);
ok('she plays as the axolotl', await page.locator('.snake-head svg').count() === 1);
ok('there is a d-pad', await page.locator('.dpad-btn').count() === 4);
await page.screenshot({ path: `${SP}/G7-snake.png` });
let snakeGot = 0;
for (let step = 0; step < 90; step++) {
  if (await page.locator(RESULTS).count()) break;
  const pos = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.snake-cell')];
    const head = cells.findIndex(n => n.classList.contains('snake-head'));
    const good = cells.findIndex(n => n.classList.contains('snake-good'));
    const on = document.querySelectorAll('.snake-slot-on').length;
    return { head, good, on, cols: 15 };
  });
  if (pos.head < 0 || pos.good < 0) { await page.waitForTimeout(400); continue; }
  snakeGot = Math.max(snakeGot, pos.on);
  const hr = Math.floor(pos.head / 15), hc = pos.head % 15;
  const gr = Math.floor(pos.good / 15), gc = pos.good % 15;
  if (hr !== gr) await page.click(gr > hr ? '.dpad-down' : '.dpad-up');
  else if (hc !== gc) await page.click(gc > hc ? '.dpad-right' : '.dpad-left');
  await page.waitForTimeout(240);
}
ok('the snake collected letters by steering', snakeGot > 0, `${snakeGot} letters`);
await page.screenshot({ path: `${SP}/G8-snake-playing.png` });

/* ---------- 6. Swim ---------- */
await goPlay('swim');
await page.waitForTimeout(1400);
ok('swim drew a pond and the axolotl', await page.locator('.swim-pet svg').count() === 1);
const topBefore = await page.$eval('.swim-pet', n => parseFloat(n.style.top));
await page.mouse.move(600, 420);
await page.mouse.down();
await page.waitForTimeout(700);
await page.mouse.up();
const topAfter = await page.$eval('.swim-pet', n => parseFloat(n.style.top));
ok('holding the pond swims her upwards', topAfter < topBefore, `${topBefore} -> ${topAfter}`);
await page.waitForTimeout(2200);
const rocks = await page.locator('.swim-rock').count();
const tokens = await page.locator('.swim-token').count();
ok('rocks appear', rocks >= 2, `${rocks}`);
ok('letters appear', tokens >= 1, `${tokens}`);
await page.screenshot({ path: `${SP}/G9-swim.png` });

/* ---------- the daily ceiling ---------- */
const cap = await page.evaluate(async () => {
  const games = await import('/js/core/games.js');
  const state = await import('/js/core/state.js');
  state.update(s => { s.progress.gameDay = null; s.progress.stars = 0; });
  const first = games.scoreGame({ gameId: 'crossword', wordsWon: 5, bonus: true });
  const again = games.scoreGame({ gameId: 'crossword', wordsWon: 5, bonus: true });
  let guard = 0;
  while (games.starsLeftToday() > 0 && guard++ < 40) games.scoreGame({ gameId: 'tower', wordsWon: 3, bonus: true });
  const after = games.scoreGame({ gameId: 'swim', wordsWon: 3, bonus: true });
  return {
    first: first.total, again: again.total, repeat: again.repeat,
    spent: games.todaysGameStars(), cap: games.DAILY_CAP,
    afterCap: after.total, capped: after.capped,
    stars: state.getState().progress.stars,
  };
});
ok('the first go at a game pays properly', cap.first >= 9, `${cap.first}`);
ok('a repeat go pays a token', cap.again === 1 && cap.repeat, JSON.stringify(cap));
ok('games stop at the daily ceiling', cap.spent === cap.cap && cap.afterCap === 0 && cap.capped, JSON.stringify(cap));
ok('stars banked match what was paid', cap.stars === cap.spent, `${cap.stars} vs ${cap.spent}`);

/* ---------- Fill the Gap ----------

   The one game that can teach a homophone, so the thing worth holding down
   is that the sentence never shows the answer. A sentence that does not
   actually contain its word cannot be gapped — "We painted the fence" for
   "paint" — and showing it ungapped would print the answer across the top
   of the screen. That word falls back to its definition instead. */
const gapUnit = await page.evaluate(async () => {
  const { gapSentence } = await import('/js/games/fillgap.js');
  return {
    plain:    gapSentence({ text: 'paint',  sentence: 'I will paint a picture.' }),
    inflected: gapSentence({ text: 'paint', sentence: 'We painted the fence.' }),
    homophone: gapSentence({ text: 'their', sentence: 'They took their coats.' }),
    none:      gapSentence({ text: 'paint', sentence: '' }),
    /* "paint" must not be blanked out of "painting". */
    inside:    gapSentence({ text: 'paint', sentence: 'The painting and the paint.' }),
  };
});
const BAR = '\u2581';
ok('a sentence is gapped where its word is',
   gapUnit.plain && gapUnit.plain.includes(BAR) && !/paint/i.test(gapUnit.plain),
   JSON.stringify(gapUnit.plain));
ok('a sentence that does not contain its word is refused',
   gapUnit.inflected === null && gapUnit.none === null,
   'no ungapped sentence can reach the screen');
ok('a homophone gaps cleanly', gapUnit.homophone === 'They took ' + BAR.repeat(5) + ' coats.',
   JSON.stringify(gapUnit.homophone));
ok('only the whole word is taken out, never a word inside another',
   gapUnit.inside && /painting/i.test(gapUnit.inside) && gapUnit.inside.includes(BAR),
   JSON.stringify(gapUnit.inside));

await goPlay('fillgap');
ok('Fill the Gap opens with a gap to fill',
   await page.locator('.gap-clue').count() === 1, 'a clue is on screen');
const gapText = await page.locator('.gap-clue').innerText();
ok('...and the answer is not written on it',
   gapText.includes(BAR), JSON.stringify(gapText));

/* Play it through, getting every one right. */
/* Twelve turns for five words: after a right answer the board locks for a
   beat before it moves on, and a turn spent typing at a locked board is a
   turn that does nothing. */
for (let i = 0; i < 12; i++) {
  if (await page.locator(RESULTS).count()) break;
  const answer = await page.evaluate(async () => {
    const words = await import('/js/core/words.js');
    const clue = document.querySelector('.gap-clue')?.textContent || '';
    if (!clue) return null;
    const bar = '\u2581'.repeat(5);
    const hit = words.allWords().find(w => {
      if (!w.sentence) return false;
      const re = new RegExp(`(^|[^a-z'])(${w.text})(?=[^a-z']|$)`, 'ig');
      return w.sentence.replace(re, (_m, b2) => b2 + bar) === clue;
    });
    return hit ? hit.text : null;
  });
  if (!answer) break;
  await page.keyboard.type(answer);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(900);
ok('a clean run finishes and pays out',
   await page.locator(RESULTS).count() === 1,
   await page.locator('.game-result h2').innerText().catch(() => '(no results)'));
await page.screenshot({ path: `${SP}/GA-fillgap.png` });

/* ---------- Sixty-Second Sprint ----------

   A clock in a children's app is a thing to be careful with, so the checks
   are about the promises: it starts at a minute, it stops when the minute
   is up, a miss shows the right spelling rather than a telling-off, and
   Skip costs her nothing at all. */
/* An earlier check in this file deliberately seeds a streak on a word, so
   "nothing has a streak" would be a lie about any of these three games.
   What each one promises is that it does not MOVE one. */
const streaksBefore = () => page.evaluate(() => Object.fromEntries(
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).words.map(w => [w.text, w.streak])));

const beforeSprint = await streaksBefore();
await goPlay('sprint');
/* Capture what it says rather than what it shows: the word is spoken, not
   written, which is the point of the game. */
await page.evaluate(() => {
  window.__said = [];
  const real = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = u => { window.__said.push(u.text); return real(u); };
});
const clockAtStart = await page.locator('.sprint-clock').innerText();
ok('the sprint starts with a minute on the clock',
   /^(59|60)s$/.test(clockAtStart.trim()), JSON.stringify(clockAtStart));
ok('...and says the word rather than writing it down',
   await page.locator('.sprint-said').count() === 0,
   await page.locator('.sprint-col').innerText().then(t => t.replace(/\s+/g, ' ')));

const hear = async () => {
  await page.click('.speak-btn');
  await page.waitForTimeout(120);
  return page.evaluate(() => window.__said.pop() || null);
};

/* One right. */
const w1 = await hear();
ok('the sprint says a word to spell', !!w1, JSON.stringify(w1));
await page.keyboard.type(String(w1).toLowerCase());
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
ok('a word she gets right counts on the scoreboard',
   (await page.locator('.sprint-score').innerText()).includes('1'),
   await page.locator('.sprint-score').innerText());

/* One wrong: the right spelling has to appear, and nothing scolds her. */
const w2 = await hear();
await page.keyboard.type('zzq');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const shown = await page.locator('.sprint-answer').innerText();
ok('a miss puts the right spelling up rather than a telling-off',
   shown.trim().toLowerCase() === String(w2).toLowerCase() && !/wrong|no|oops/i.test(shown),
   JSON.stringify(shown));

/* Skip: no record, no penalty. */
const beforeSkip = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).words
    .reduce((n, w) => n + w.attempts, 0));
await page.waitForTimeout(1200);
await page.click('button:has-text("Skip")');
await page.waitForTimeout(400);
const afterSkip = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).words
    .reduce((n, w) => n + w.attempts, 0));
ok('skipping a word is not getting it wrong',
   afterSkip === beforeSkip, `${beforeSkip} then ${afterSkip}`);

await page.waitForTimeout(600);
const ticked = await page.locator('.sprint-clock').innerText();
ok('the clock is actually running',
   parseInt(ticked, 10) < parseInt(clockAtStart, 10), `${clockAtStart} -> ${ticked}`);

const afterSprint = await streaksBefore();
const sprintCredit = Object.keys(afterSprint)
  .filter(t => afterSprint[t] !== (beforeSprint[t] ?? 0));
ok('a word spelled against a clock is not a word mastered',
   sprintCredit.length === 0, sprintCredit.join(',') || 'no streak moved');
await page.screenshot({ path: `${SP}/GE-sprint.png` });

/* ---------- Word Builder ----------

   The letters are handed to her, so the only thing that can go wrong is the
   jumble: a word that comes up already in order is not a puzzle, and a tray
   that is missing a letter cannot be finished at all. */
const buildUnit = await page.evaluate(async () => {
  const { jumble } = await import('/js/games/builder.js');
  const words = ['cat', 'little', 'because', 'school', 'journey', 'to'];
  let inOrder = 0, wrongLetters = 0, runs = 0;
  for (let i = 0; i < 300; i++) {
    for (const w of words) {
      const got = jumble(w).join('');
      runs++;
      if (got === w) inOrder++;
      if (got.split('').sort().join('') !== w.split('').sort().join('')) wrongLetters++;
    }
  }
  return { inOrder, wrongLetters, runs, allSame: jumble('aaa').join('') };
});
ok('the jumble never hands back the word already built',
   buildUnit.inOrder === 0 && buildUnit.runs > 1000,
   `${buildUnit.inOrder} in ${buildUnit.runs}`);
ok('...and never loses or invents a letter',
   buildUnit.wrongLetters === 0, `${buildUnit.wrongLetters} broken`);
ok('a word of all one letter does not hang the shuffle',
   buildUnit.allSame === 'aaa', JSON.stringify(buildUnit.allSame));

const beforeBuild = await streaksBefore();

await goPlay('builder');
const trayCount = await page.locator('.build-block').count();
const slotCount = await page.locator('.build-slot').count();
ok('the first word is just its own letters, no extras',
   trayCount === slotCount && trayCount >= 3, `${trayCount} blocks, ${slotCount} spaces`);

/* Build the first word, then take a letter back out again: a child who
   taps the wrong block must be able to undo it without starting over. */
/* Which word is on the table. Not "the tray sorted equals the word
   sorted" any more — from the second word on there are decoy letters in
   there too, so it is "as many spaces as the word has letters, and every
   letter of it somewhere in the tray". */
const FIND_TARGET = async () => page.evaluate(async () => {
  const words = await import('/js/core/words.js');
  const tray = [...document.querySelectorAll('.build-block')].map(b => b.textContent);
  const slots = document.querySelectorAll('.build-slot').length;
  return (words.allWords().find(w => {
    const text = w.text.toLowerCase();
    if (text.length !== slots) return false;
    const left = tray.slice();
    return text.split('').every(ch => {
      const at = left.indexOf(ch);
      if (at < 0) return false;
      left.splice(at, 1);
      return true;
    });
  })?.text || '').toLowerCase() || null;
});
const buildTarget = await FIND_TARGET();
ok('...and they are the letters of one of her words', !!buildTarget, JSON.stringify(buildTarget));

await page.click('.build-block:not(.used)');
await page.waitForTimeout(150);
const afterOne = await page.locator('.build-slot.filled').count();
await page.click('.build-slot.filled');
await page.waitForTimeout(150);
const afterUndo = await page.locator('.build-slot.filled').count();
ok('a block can be taken back out of the word',
   afterOne === 1 && afterUndo === 0, `${afterOne} then ${afterUndo}`);
ok('...and the block goes back on the table',
   await page.locator('.build-block.used').count() === 0);

/* Now play the whole thing through. */
const trays = [];
for (let round = 0; round < 8; round++) {
  if (await page.locator(RESULTS).count()) break;
  const target = await FIND_TARGET();
  if (!target) { await page.waitForTimeout(800); continue; }
  trays.push({
    spare: await page.locator('.build-block').count() - await page.locator('.build-slot').count(),
    word: target,
  });
  for (const ch of target) {
    const block = page.locator(`.build-block:not(.used)`).filter({ hasText: new RegExp(`^${ch}$`) }).first();
    if (!(await block.count())) break;
    await block.click();
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(1300);
}
await page.waitForTimeout(700);
ok('a clean build finishes and pays out',
   await page.locator(RESULTS).count() === 1,
   await page.locator('.game-result h2').innerText().catch(() => '(no results)'));
await page.screenshot({ path: `${SP}/GD-builder.png` });

/* ---- and it got harder as she got them right ----
   With exactly the word's letters on the table the last few place
   themselves. Decoys are what stop the puzzle finishing itself. */
ok('the tray gains a decoy letter with each word she builds',
   trays.length >= 3 && trays[0].spare === 0 && trays[trays.length - 1].spare > trays[0].spare,
   trays.map(t => `${t.word}+${t.spare}`).join(' '));
ok('...and never so many that the word is lost in them',
   trays.every(t => t.spare <= 3), trays.map(t => t.spare).join(','));

const afterBuild = await streaksBefore();
const buildCredit = Object.keys(afterBuild)
  .filter(t => afterBuild[t] !== (beforeBuild[t] ?? 0));
ok('having the letters in front of her is not spelling from memory',
   buildCredit.length === 0, buildCredit.join(',') || 'no streak moved');

/* ---------- Which One Is Right? ----------

   Two things matter here and nothing else does. The wrong card must be a
   plausible misspelling and never another real word, and the RIGHT spelling
   has to be on the screen after she answers — including, especially, when
   she answered wrong. A child who taps the wrong card and is whisked on has
   spent the whole turn looking at a misspelling and never seen the real
   one, which is worse than not playing. */
const spotUnit = await page.evaluate(async () => {
  const { misspell } = await import('/js/games/spotit.js');
  const words = ['friend', 'because', 'journey', 'little', 'school', 'paint',
                 'their', 'there', 'happy', 'write', 'tomorrow', 'said'];
  const out = {};
  for (const w of words) out[w] = misspell(w, words);
  /* Run it a lot: the mutation is picked at random, so one call proves
     nothing about the other four. */
  let sameAsWord = 0, collided = 0, tries = 0;
  for (let i = 0; i < 400; i++) {
    for (const w of words) {
      const got = misspell(w, words);
      if (!got) continue;
      tries++;
      if (got === w) sameAsWord++;
      if (words.includes(got)) collided++;
    }
  }
  return { out, sameAsWord, collided, tries, short: misspell('at', words) };
});
ok('every word gets a wrong spelling to sit beside',
   Object.values(spotUnit.out).every(Boolean),
   Object.entries(spotUnit.out).map(([w, m]) => `${w}->${m}`).join(' '));
ok('the wrong one is never the right one',
   spotUnit.sameAsWord === 0 && spotUnit.tries > 1000,
   `${spotUnit.sameAsWord} in ${spotUnit.tries}`);
ok('...and never another word she is learning',
   spotUnit.collided === 0, `${spotUnit.collided} collisions`);
ok('a word too short to misspell is refused rather than mangled',
   spotUnit.short === null, JSON.stringify(spotUnit.short));

/* ---- and it gets harder to spot as she gets them right ----
   A missing letter changes the word's shape and she catches it without
   reading. A swapped one does not, and she has to actually read the middle
   — which is the skill this game is for. */
const spotLevels = await page.evaluate(async () => {
  const { misspell } = await import('/js/games/spotit.js');
  const words = ['write', 'school', 'happy', 'little', 'letter'];
  const at = lv => words.map(w => misspell(w, [], lv));
  const sameLength = out => out.filter((m, i) => m && m.length === words[i].length).length;
  return { easy: at(0), hard: at(2),
           easySame: sameLength(at(0)), hardSame: sameLength(at(2)) };
});
ok('the early wrong ones are a different length, so the shape gives them away',
   spotLevels.easySame <= 1, spotLevels.easy.join(' '));
ok('...and the later ones are the same length, so she has to read them',
   spotLevels.hardSame >= 4, spotLevels.hard.join(' '));

const beforeSpot = await streaksBefore();
await goPlay('spotit');
ok('Which One Is Right? offers exactly two spellings',
   await page.locator('.spot-card').count() === 2,
   `${await page.locator('.spot-card').count()} cards`);
const askText = await page.locator('.spot-ask').innerText();
const rightNow = await page.locator('.spot-card[data-right="1"] .spot-word').innerText();
ok('...and does not print the answer above them',
   !askText.toLowerCase().includes(rightNow.toLowerCase()),
   JSON.stringify(askText));

/* Tap the wrong one on purpose. */
await page.click('.spot-card:not([data-right="1"])');
await page.waitForTimeout(500);
const afterWrong = await page.evaluate(() => ({
  right: document.querySelector('.spot-card.is-right .spot-word')?.textContent || '',
  struck: !!document.querySelector('.spot-card.is-wrong'),
  verdict: document.querySelector('.spot-verdict')?.textContent || '',
}));
ok('a wrong answer leaves the right spelling on the screen',
   afterWrong.right === rightNow && afterWrong.verdict.includes(rightNow),
   JSON.stringify(afterWrong));
ok('...with the wrong one struck through beside it', afterWrong.struck);

/* And then play the rest of it right through to the payout. */
for (let i = 0; i < 12; i++) {
  if (await page.locator(RESULTS).count()) break;
  const card = page.locator('.spot-card[data-right="1"]:not(.done)');
  if (!(await card.count())) { await page.waitForTimeout(700); continue; }
  await card.click();
  await page.waitForTimeout(900);
}
await page.waitForTimeout(900);
ok('Which One Is Right? finishes and pays out',
   await page.locator(RESULTS).count() === 1,
   await page.locator('.game-result h2').innerText().catch(() => '(no results)'));
await page.screenshot({ path: `${SP}/GC-spotit.png` });

/* Recognising a spelling is not spelling it, so it must not touch mastery. */
const afterSpot = await streaksBefore();
const spotCredit = Object.keys(afterSpot)
  .filter(t => afterSpot[t] !== (beforeSpot[t] ?? 0));
ok('...and never moves a word towards mastery',
   spotCredit.length === 0, spotCredit.join(',') || 'no streak moved');

/* ---------- getting out again ----------

   The arrow at the top left means "out of here", and for three games in a
   row it was meaning "back through every game you just played". Playing a
   few games stacks up history: games, play, games, play, games, play. The
   arrow goes UP a level now — out of the game to the hub, out of the hub
   to home — and leaving a game replaces it rather than stacking another
   entry, so the tablet's own back gesture does not replay them either. */
const hash = () => page.evaluate(() => location.hash);
const tapBack = async () => {
  await page.click('#backBtn');
  await page.waitForTimeout(350);
  return hash();
};

await resetDay();
await page.goto(BASE + '#/games');
await page.waitForTimeout(400);
const depthBefore = await page.evaluate(() => history.length);
for (const id of ['builder', 'spotit', 'wordsearch']) {
  await page.goto(BASE + '#/play?id=' + id);
  await page.waitForTimeout(500);
  await page.click('.game-head .icon-btn');       // the game's own ✕
  await page.waitForTimeout(400);
}
ok('leaving a game does not stack up history',
   (await page.evaluate(() => history.length)) - depthBefore <= 4,
   `history grew by ${(await page.evaluate(() => history.length)) - depthBefore} over three games`);
ok('...and three games later she is on the hub', (await hash()) === '#/games',
   await hash());

/* Now the thing she actually reported: into a game, then the top arrow. */
await page.goto(BASE + '#/play?id=builder');
await page.waitForTimeout(500);
ok('the arrow out of a game lands on the games hub', (await tapBack()) === '#/games',
   'not the last game she played');
ok('...and the arrow out of the hub lands on home', (await tapBack()) === '#/',
   'home, not another game');

/* And from deeper in: the arrow knows the room is above the shop. */
await page.goto(BASE + '#/shop');
await page.waitForTimeout(400);
ok('the arrow out of the shop goes to her room', (await tapBack()) === '#/pet',
   await hash());

/* ---------- the parent gate ---------- */
await page.evaluate(async () => {
  const state = await import('/js/core/state.js');
  state.update(s => {
    s.settings.gamesAfterDaily = true;
    s.words.forEach(w => { w.lastDailyDay = null; });
  });
});
await goHub();
ok('the practice-first gate locks the games',
   await page.locator('.game-card-locked').count() === HOW_MANY, `of ${HOW_MANY}`);
ok('...and offers the way through', await page.locator('button:has-text("Today’s Practice")').count() >= 1);
await page.screenshot({ path: `${SP}/GA-gate.png` });

/* ---------- and the way through has to be reachable ----------

   The gate used to ask whether EVERY word in the pool had had a turn
   today. Today's Practice only ever covers practiceSize of them, and the
   pool is every unmastered word from every list that has not been
   archived — so after a few weeks of lists the gate asked for five
   sessions in a day, then six, then seven. It said "40 words left today,
   games open up straight after", and then did not.

   A term's worth of lists, and then exactly one session's work. */
const gate = await page.evaluate(async () => {
  const state = await import('/js/core/state.js');
  const words = await import('/js/core/words.js');
  state.update(s => {
    s.settings.practiceSize = 8;
    s.lists = [];
    s.words = [];
    for (let wk = 1; wk <= 10; wk++) {
      s.lists.push({ id: 'g' + wk, name: 'Week ' + wk, week: '', description: '',
                     archived: false, createdAt: Date.now() });
      for (let i = 0; i < 4; i++) s.words.push({
        id: `g${wk}_${i}`, listId: 'g' + wk, text: `word${wk}${i}`, definition: '', sentence: '',
        hint: '', tags: [], attempts: 1, correctCount: 0, incorrectCount: 1, streak: 0,
        lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
        lastCorrect: null, lastMissed: null, masteredAt: null, reviewAt: null, reviewStep: 0,
        createdAt: Date.now(),
      });
    }
  });
  const pool = words.activeWords().length;
  const asked = words.leftInTodaysPractice();
  /* One session's worth, exactly as Today's Practice would cover it. */
  for (const w of words.pickWords({ count: words.dailyTarget(), pool: 'daily' })) {
    words.markCoveredToday(w.id);
  }
  return { pool, asked, doneAfterOne: words.dailyPracticeDone(),
           leftAfterOne: words.leftInTodaysPractice() };
});
ok('the gate asks for one session, not the whole pool',
   gate.pool === 40 && gate.asked === 8, `${gate.pool} words in the pool, ${gate.asked} asked for`);
ok('...so one Today\u2019s Practice opens it',
   gate.doneAfterOne && gate.leftAfterOne === 0, 'done after one session');
/* Away and back: goto() to the hash the page is already on does not
   re-render, so checking here without leaving first would read the screen
   from before the session. */
await page.goto(BASE + '#/'); await page.waitForTimeout(200);
await goHub();
ok('...and the games really are unlocked', await page.locator('.game-card-locked').count() === 0,
   'no locked cards left');

/* ---------- landscape ---------- */
await page.setViewportSize({ width: 1180, height: 600 });
await page.evaluate(async () => {
  const state = await import('/js/core/state.js');
  state.update(s => { s.settings.gamesAfterDaily = false; });
});
await goPlay('crossword');
await page.waitForTimeout(500);
const fits = await page.evaluate(() => {
  const s = document.getElementById('screen');
  return { scroll: s.scrollHeight, client: s.clientHeight };
});
ok('crossword fits a landscape screen', fits.scroll <= fits.client + 4, JSON.stringify(fits));
await page.screenshot({ path: `${SP}/GB-crossword-landscape.png` });

console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? errors.join('\n') : 'none');
await browser.close();
