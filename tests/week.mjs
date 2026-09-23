/* Starting next week.

   Every Monday: name the list, type the words, put last week away, and
   remember which of last week's words she has NOT finished. The fourth is
   the one a tired grown-up forgets, and forgetting it is how a word she
   never mastered quietly leaves her practice for good.

   So the button does all four, and this checks all four — especially that
   a carried word arrives with its history intact. A word brought forward
   with its counters wiped is worse than one left behind: it looks like
   progress and is not.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

/* streak 5 == mastered at the default threshold. */
const ROWS = [
  ['because', 5], ['friend', 5],
  ['their', 1], ['journey', 0], ['enough', 2], ['weather', 3], ['scissors', 0],
];

const SEED = rows => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'Week 7', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map(([text, streak], i) => ({
      id: 'w' + i, listId: 'l1', text, definition: '', sentence: '', hint: '', tags: [],
      attempts: 6, correctCount: streak, incorrectCount: 6 - streak, streak,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: streak >= 5 ? now : null, reviewAt: null, reviewStep: 0, createdAt: now })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 60, milestonesEarned: [] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood' },
    collection: { items: [] } }));
};

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  const page = await ctx.newPage();
  watch(page, errs);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(SEED, ROWS);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { ctx, page };
}

/* Runs a startNextList() in the page and reports what the save looks like
   afterwards, list by list. */
const startNext = (page, opts) => page.evaluate(async o => {
  const w = await import('./js/core/words.js');
  const { getState } = await import('./js/core/state.js');
  const from = w.activeLists()[0];
  const r = w.startNextList({ ...o, rows: w.parseBulk(o.paste || ''), fromListId: from.id });
  /* Read it back off the live state, not localStorage: the save is
     debounced by 200ms and would still be showing last week. */
  const lists = getState().lists;
  const byList = {};
  for (const l of lists) byList[l.name] = { archived: !!l.archived, words: [] };
  for (const word of w.allWords()) {
    const l = lists.find(x => x.id === word.listId);
    byList[l.name].words.push({ text: word.text, streak: word.streak,
                                attempts: word.attempts, mastered: !!word.masteredAt });
  }
  return { name: r.list.name, added: r.added, carried: r.carried, archived: r.archived, byList };
}, opts);

/* ---------- the name it offers ---------- */
{
  const { ctx, page } = await open();
  const names = await page.evaluate(async () => {
    const w = await import('./js/core/words.js');
    return {
      week:  w.nextListName({ name: 'Week 7' }),
      list:  w.nextListName({ name: 'List 12' }),
      inner: w.nextListName({ name: 'Unit 3 — long a' }),
      none:  w.nextListName({ name: 'Tricky ones' }),
    };
  });
  ok('"Week 7" becomes "Week 8"', names.week === 'Week 8', names.week);
  ok('and "List 12" becomes "List 13"', names.list === 'List 13', names.list);
  ok('a number inside the name still counts up', names.inner === 'Unit 4 — long a', names.inner);
  ok('a name with no number falls back to the date',
     /^Week of /.test(names.none), names.none);
  await ctx.close();
}

/* ---------- the whole Monday ---------- */
{
  const { ctx, page } = await open();
  const r = await startNext(page, { name: 'Week 8', paste: 'knowledge\nfamous\ntheir' });

  ok('the new list is made', !!r.byList['Week 8']);
  ok('last week is put away', r.byList['Week 7'].archived === true);
  ok('this week is not', r.byList['Week 8'].archived === false);

  const week8 = Object.fromEntries(r.byList['Week 8'].words.map(w => [w.text, w]));
  const week7 = r.byList['Week 7'].words.map(w => w.text).sort();

  ok('the mastered words stay behind', week7.join(',') === 'because,friend', week7.join(','));
  ok('the unfinished words come across',
     ['journey', 'enough', 'weather', 'scissors'].every(t => week8[t]),
     Object.keys(week8).join(','));
  ok('this week’s new words are in it', !!week8.knowledge && !!week8.famous);

  /* The check this suite exists for. */
  ok('a carried word keeps its history',
     week8.weather.streak === 3 && week8.weather.attempts === 6,
     `weather: streak ${week8.weather.streak}, ${week8.weather.attempts} attempts`);
  ok('a brand new word starts from nothing',
     week8.knowledge.streak === 0 && week8.knowledge.attempts === 0);

  /* "their" was both carried forward AND typed into the new list. */
  ok('a word in both places appears once, not twice',
     r.byList['Week 8'].words.filter(w => w.text === 'their').length === 1);
  ok('and it is the one with the history',
     week8.their.streak === 1 && week8.their.attempts === 6,
     `their: streak ${week8.their.streak}, ${week8.their.attempts} attempts`);

  ok('it says what it carried', r.carried.length === 5, r.carried.join(','));
  /* Three words were pasted, but "their" was one of last week's. */
  ok('a word that was pasted AND carried is not counted as new',
     r.added === 2, String(r.added));
  await ctx.close();
}

/* ---------- a week with no new words ---------- */
{
  const { ctx, page } = await open();
  const r = await startNext(page, { name: 'Week 8', paste: '' });
  ok('a week of just carrying on is allowed',
     r.byList['Week 8'].words.length === 5, String(r.byList['Week 8'].words.length));
  ok('and last week still goes away', r.byList['Week 7'].archived === true);
  await ctx.close();
}

/* ---------- the two tick boxes ---------- */
{
  const { ctx, page } = await open();
  const r = await startNext(page, { name: 'Week 8', paste: 'apple', carryForward: false });
  ok('carrying can be turned off', r.byList['Week 8'].words.length === 1, 
     r.byList['Week 8'].words.map(w => w.text).join(','));
  ok('and then last week keeps every word it had',
     r.byList['Week 7'].words.length === 7, String(r.byList['Week 7'].words.length));
  await ctx.close();
}
{
  const { ctx, page } = await open();
  const r = await startNext(page, { name: 'Week 8', paste: 'apple', archiveOld: false });
  ok('archiving can be turned off', r.byList['Week 7'].archived === false);
  await ctx.close();
}

/* ---------- what she practises next ---------- */
{
  const { ctx, page } = await open();
  await startNext(page, { name: 'Week 8', paste: 'knowledge\nfamous' });
  const pool = await page.evaluate(async () => {
    const w = await import('./js/core/words.js');
    return w.activeWords().map(x => x.text).sort();
  });
  ok('her practice is now this week plus the unfinished ones',
     pool.join(',') === 'enough,famous,journey,knowledge,scissors,their,weather', pool.join(','));
  ok('and nothing she has finished is in it',
     !pool.includes('because') && !pool.includes('friend'));
  await ctx.close();
}

/* ---------- two taps, from the actual screen ---------- */
{
  const { ctx, page } = await open();
  await page.goto(`${BASE}#/parent`);
  await page.waitForTimeout(400);
  for (const d of '1234') {
    await page.click(`button:has-text("${d}")`);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(400);
  await page.click('text=Spelling lists');
  await page.waitForTimeout(350);

  ok('the button is on the lists screen',
     await page.locator('button:has-text("Start next week")').count() > 0);

  await page.click('button:has-text("Start next week")');   // tap one
  await page.waitForTimeout(350);
  const dialog = await page.evaluate(() => document.body.innerText);
  ok('it offers next week’s name already typed in',
     await page.inputValue('.modal input[type=text]') === 'Week 8',
     await page.inputValue('.modal input[type=text]'));
  ok('it says how many words it is about to carry',
     /Bring forward 5 unfinished words/.test(dialog), dialog.slice(0, 200));
  ok('and names them, so it can be checked before it happens',
     /their|journey|enough/.test(dialog));
  ok('it says which list it is putting away', /Put Week 7 away/.test(dialog));

  await page.click('button:has-text("Start it")');           // tap two
  await page.waitForTimeout(600);

  const after = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    const live = s.lists.filter(l => !l.archived);
    return { live: live.map(l => l.name),
             inLive: s.words.filter(w => w.listId === live[0]?.id).map(w => w.text).sort() };
  });
  ok('two taps made next week', after.live.join(',') === 'Week 8', after.live.join(','));
  ok('with the unfinished words already in it',
     after.inLive.join(',') === 'enough,journey,scissors,their,weather', after.inLive.join(','));
  await ctx.close();
}

/* ---------- the week in three sentences ---------- */

/* Seeds a whole week: which words are where, and what she did on which
   day. Returns the three sentences. */
const noteFor = (page, plan) => page.evaluate(async p => {
  const D = 86400000, now = Date.now();
  const s = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
  s.words = p.words.map((w, i) => ({
    id: 'n' + i, listId: 'l1', text: w.text, definition: '', sentence: '', hint: '', tags: [],
    attempts: w.attempts ?? 6, correctCount: w.streak, incorrectCount: (w.attempts ?? 6) - w.streak,
    streak: w.streak, lastCreditDay: null, lastDailyDay: null, recent: [],
    firstSeen: now, lastSeen: now, lastCorrect: now,
    lastMissed: w.missedDaysAgo == null ? null : now - w.missedDaysAgo * D,
    masteredAt: w.masteredDaysAgo == null ? null : now - w.masteredDaysAgo * D,
    reviewAt: null, reviewStep: 0, createdAt: now }));
  s.sessions = (p.sessions || []).map((x, i) => ({
    id: 's' + i, mode: x.mode, at: now - x.daysAgo * D, attempted: 8, correct: 7 }));
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(s));
  location.reload();
}, plan).then(async () => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(350);
  return page.evaluate(async () => {
    const { weekNote } = await import('./js/core/weeknote.js');
    return weekNote();
  });
});

/* A normal week. */
{
  const { ctx, page } = await open();
  const n = await noteFor(page, {
    words: [
      { text: 'because', streak: 5, masteredDaysAgo: 2 },
      { text: 'friend',  streak: 5, masteredDaysAgo: 1 },
      { text: 'journey', streak: 4, missedDaysAgo: 3 },
      { text: 'weather', streak: 3 },
      { text: 'their',   streak: 1, missedDaysAgo: 1 },
    ],
    sessions: [{ mode: 'daily', daysAgo: 4 }, { mode: 'practiceTest', daysAgo: 3 },
               { mode: 'daily', daysAgo: 1 }, { mode: 'paperTest', daysAgo: 1 }],
  });
  const [turn, learn, stuck] = n.sentences;

  ok('there are exactly three sentences', n.sentences.length === 3);
  ok('the first counts the days she practised, not the days she missed',
     /practised on 3 days this week/.test(turn) && !/miss/i.test(turn), turn);
  ok('two sessions on one day count as one day', n.practised === 3, String(n.practised));
  ok('and it counts the tests', /2 spelling tests/.test(turn), turn);
  ok('a paper test counts as a test', n.tests === 2, String(n.tests));

  ok('the second names what she mastered',
     /mastered 2 new words: because and friend/.test(learn), learn);
  ok('and what is nearly there', /Nearly there too: journey and weather/.test(learn), learn);

  ok('the third names what is still catching her out',
     /Still catching her out/.test(stuck) && /their/.test(stuck), stuck);
  ok('a word she has not missed this week is not on that list',
     !/weather/.test(stuck), stuck);

  /* The one thing a note like this must never do. */
  ok('nothing is called mastered that is not',
     !n.mastered.includes('journey') && !n.mastered.includes('their'),
     n.mastered.join(','));

  /* A spelling word given a capital letter is a spelling word shown
     wrong, so no sentence may begin with one. */
  const ours = ['because', 'friend', 'journey', 'weather', 'their'];
  ok('no sentence starts with one of her words',
     n.sentences.every(line => !ours.some(w =>
       line.toLowerCase().startsWith(w) || line.split('. ').slice(1)
         .some(part => part.toLowerCase().startsWith(w)))),
     n.sentences.join(' / '));
  await ctx.close();
}

/* A week off. The note must not scold, and must not invent progress. */
{
  const { ctx, page } = await open();
  const n = await noteFor(page, {
    words: [{ text: 'because', streak: 0 }, { text: 'friend', streak: 0 }],
    sessions: [],
  });
  const all = n.sentences.join(' ');
  ok('a week off says so plainly', /has not practised this week/.test(n.sentences[0]),
     n.sentences[0]);
  ok('it does not count a streak she has lost, because she has not',
     !/lost|broke|missed|behind|should/i.test(all), all);
  ok('it claims nothing was learned', n.mastered.length === 0);
  ok('and says what is waiting', /2 words are waiting for her/.test(n.sentences[2]),
     n.sentences[2]);
  await ctx.close();
}

/* A week of work with nothing finished — the discouraging one, which is
   exactly when the wording matters. */
{
  const { ctx, page } = await open();
  const n = await noteFor(page, {
    words: [{ text: 'scissors', streak: 4, missedDaysAgo: 2 },
            { text: 'knowledge', streak: 1, missedDaysAgo: 1 }],
    sessions: [{ mode: 'daily', daysAgo: 2 }, { mode: 'daily', daysAgo: 1 }],
  });
  ok('a hard week is still counted as turning up',
     /practised on 2 days/.test(n.sentences[0]), n.sentences[0]);
  ok('it says what is close rather than what is missing',
     /one or two goes away/.test(n.sentences[1]), n.sentences[1]);
  await ctx.close();
}

/* Everything mastered. */
{
  const { ctx, page } = await open();
  const n = await noteFor(page, {
    words: [{ text: 'because', streak: 5, masteredDaysAgo: 1 },
            { text: 'friend', streak: 5, masteredDaysAgo: 1 }],
    sessions: [{ mode: 'fullTest', daysAgo: 1 }],
  });
  ok('an empty list is a prompt for next week, not a blank',
     /nothing left on her list/i.test(n.sentences[2]), n.sentences[2]);
  await ctx.close();
}

/* It is on the screen, not just in the module. */
{
  const { ctx, page } = await open();
  await page.goto(`${BASE}#/parent`);
  await page.waitForTimeout(400);
  for (const d of '1234') { await page.click(`button:has-text("${d}")`); await page.waitForTimeout(90); }
  await page.waitForTimeout(400);
  ok('the note is the first thing in the Parent Area',
     await page.locator('.week-note').count() > 0);
  const lines = await page.locator('.week-note .week-line').count();
  ok('and it shows all three sentences', lines === 3, String(lines));
  const y = await page.locator('.week-note').boundingBox();
  const stats = await page.locator('.stat-grid').boundingBox();
  ok('above the numbers, not below them', y.y < stats.y, `${y.y} vs ${stats.y}`);
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
