/* The friend.

   An egg at sixty mastered words, four taps to crack it open, and a
   duckling that follows the axolotl about afterwards.

   Four things have to hold, and they are all about not taking something
   away from her:

     the egg keeps its cracks. Half-cracked at bedtime is half-cracked in
     the morning, and a word that falls back out of mastery does not make
     an egg she has already touched disappear off the floor.

     it hatches exactly once. Not twice, not never, and not again on the
     next tap.

     the duckling is on every screen the axolotl is on, and never drawn on
     top of it.

     it survives a move to another tablet, like everything else she has.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

const SEED = ({ mastered, friend = null }) => {
  const now = Date.now(), D = 86400000;
  localStorage.clear();
  const save = {
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: Array.from({ length: Math.max(mastered, 4) }, (_, i) => ({
      id: 'w' + i, listId: 'l1', text: 'word' + i, definition: '', sentence: '', hint: '', tags: [],
      attempts: 6, correctCount: 6, incorrectCount: 0, streak: i < mastered ? 5 : 1,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now - 200 * D, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: i < mastered ? now - (400 - i) * D : null,
      reviewAt: i < mastered ? now + 30 * D : null, reviewStep: 0, createdAt: now,
    })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 300, milestonesEarned: ['the_egg', 'garden_gate', 'word_tree'] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood', rug: 'rug_round' },
    collection: { items: [] },
  };
  if (friend) save.friend = friend;
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
};

/* Seeds, loads the app fresh, then goes where it was asked — going
   straight to a screen behind a gate with the old state still in memory
   gets bounced, and then the reload happens on the wrong hash. */
async function open(plan, hash = '#/') {
  const ctx = await browser.newContext({ viewport: { width: 950, height: 950 } });
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
  await page.evaluate(SEED, plan);
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  if (hash !== '#/') { await page.goto(`${BASE}${hash}`); await page.waitForTimeout(800); }
  return { ctx, page };
}

const saved = page => page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).friend || {});
const tapEgg = async page => { await page.click('.room-egg'); await page.waitForTimeout(450); };

/* ---------- the gate ---------- */
{
  const { ctx, page } = await open({ mastered: 59 });
  ok('at 59 mastered words there is no egg', await page.locator('.room-egg').count() === 0);
  ok('and no friend either', await page.locator('.room-friend').count() === 0);
  const g = await page.evaluate(async () => {
    const f = await import('./js/core/friend.js');
    return { earned: f.eggEarned(), left: f.wordsToGo() };
  });
  ok('the gate is shut', g.earned === false);
  ok('and it is one word off', g.left === 1, String(g.left));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 60 });
  ok('at 60 the egg is on her bedroom floor', await page.locator('.room-egg').count() === 1);
  ok('and the axolotl points at it',
     /egg on the floor/i.test(await page.locator('.room-speech').innerText()),
     await page.locator('.room-speech').innerText());
  ok('nothing has hatched yet', await page.locator('.room-friend').count() === 0);
  await ctx.close();
}

/* ---------- cracking it open ---------- */
{
  const { ctx, page } = await open({ mastered: 60 });
  await tapEgg(page);
  ok('one tap cracks it', await page.getAttribute('.room-egg svg', 'data-cracks') === '1');
  ok('and it is written down', (await saved(page)).crackedTaps === 1);
  await tapEgg(page);
  ok('two taps, two cracks', await page.getAttribute('.room-egg svg', 'data-cracks') === '2');
  ok('it is still an egg', await page.locator('.room-friend').count() === 0);

  /* The one that matters at bedtime. */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  ok('a half-cracked egg is still half-cracked after a reload',
     await page.getAttribute('.room-egg svg', 'data-cracks') === '2',
     await page.getAttribute('.room-egg svg', 'data-cracks'));

  await tapEgg(page);
  await tapEgg(page);
  await page.waitForTimeout(600);
  ok('the fourth tap hatches it', await page.locator('.room-friend').count() === 1);
  ok('and the egg is gone', await page.locator('.room-egg').count() === 0);
  ok('the save says so', !!(await saved(page)).hatchedAt);
  await ctx.close();
}

/* ---------- it hatches once ---------- */
{
  const { ctx, page } = await open({ mastered: 60, friend: { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 } });
  ok('an egg already hatched does not come back', await page.locator('.room-egg').count() === 0);
  ok('the friend is here', await page.locator('.room-friend').count() === 1);

  const again = await page.evaluate(async () => {
    const f = await import('./js/core/friend.js');
    const before = f.friend().hatchedAt;
    const r = f.tapEgg();          // as if something tapped a gone egg
    return { before, after: f.friend().hatchedAt, hatched: r.hatched };
  });
  ok('tapping again cannot hatch it twice', again.hatched === false);
  ok('and cannot change the day it hatched', again.after === again.before);
  await ctx.close();
}

/* ---------- a word falling back out of mastery ---------- */
{
  const { ctx, page } = await open({ mastered: 59, friend: { crackedTaps: 2, hatchedAt: null, name: '', foundAt: 500 } });
  ok('an egg she has already touched stays, even if she dips under sixty',
     await page.locator('.room-egg').count() === 1);
  ok('with its cracks', await page.getAttribute('.room-egg svg', 'data-cracks') === '2');
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 40, friend: { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 } });
  ok('and a hatched friend is never taken away', await page.locator('.room-friend').count() === 1);
  await ctx.close();
}

/* ---------- the name ---------- */
{
  const { ctx, page } = await open({ mastered: 60, friend: { crackedTaps: 4, hatchedAt: 1000, name: '', foundAt: 900 } });
  const before = await page.evaluate(async () =>
    (await import('./js/core/friend.js')).name());
  ok('with no name it is just called a Duckling', before === 'Duckling', before);

  await page.evaluate(async () => {
    (await import('./js/core/friend.js')).setName('  Nugget  ');
  });
  await page.waitForTimeout(400);
  ok('a name she picks is trimmed and kept',
     (await saved(page)).name === 'Nugget', (await saved(page)).name);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  ok('and it is still there next time',
     (await page.evaluate(async () => (await import('./js/core/friend.js')).name())) === 'Nugget');

  /* Renameable from the Pet screen, so a name picked at seven is not for
     life. */
  await page.goto(`${BASE}#/pet`);
  await page.waitForTimeout(700);
  const petScreen = await page.evaluate(() => document.body.innerText);
  ok('the friend has a card on the Pet screen', /Nugget/.test(petScreen));
  ok('with a way to change its name',
     await page.locator('button:has-text("Rename")').count() >= 1);
  await ctx.close();
}

/* ---------- wherever the axolotl is ---------- */
{
  const hatched = { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 };
  for (const [hash, where] of [['#/', 'her room'], ['#/garden', 'the garden'], ['#/tree', 'under the tree']]) {
    const { ctx, page } = await open({ mastered: 60, friend: hatched }, hash);
    ok(`the friend is in ${where}`, await page.locator('.room-friend').count() === 1);

    /* Never drawn over the axolotl: it is behind in the stacking order and
       set back up the floor, so the one being followed is in front. */
    const z = await page.evaluate(() => {
      const f = document.querySelector('.room-friend');
      const p = document.querySelector('.room-pet');
      return { friend: +getComputedStyle(f).zIndex, pet: +getComputedStyle(p).zIndex,
               fBottom: parseFloat(f.style.bottom), pBottom: parseFloat(p.style.bottom),
               fWidth: parseFloat(f.style.width), pWidth: parseFloat(p.style.width) };
    });
    ok(`and behind the axolotl in ${where}`, z.friend < z.pet, JSON.stringify(z));
    ok(`set back up the floor in ${where}`, z.fBottom > z.pBottom, JSON.stringify(z));
    ok(`and smaller than it in ${where}`, z.fWidth < z.pWidth, JSON.stringify(z));
    await ctx.close();
  }
}

/* ---------- it follows ----------

   The axolotl is walked by hand here rather than left to wander. Its own
   wandering is random by design — it stands still sometimes, which is the
   point of it — and a test that waits for a random walk to happen is a
   test that fails one run in four for no reason. What is being checked is
   follow(), so follow() is what gets driven.
*/
{
  const { ctx, page } = await open({ mastered: 60,
    friend: { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 } });

  /* Put the axolotl somewhere and HOLD it there while the duckling catches
     up. Holding rather than setting once: the axolotl is wandering on its
     own the whole time, and a single placement gets walked away from
     half a second later, which is what made the first version of this
     fail one run in five. */
  const walkTo = async centre => {
    await page.evaluate(c => {
      clearInterval(window.__hold);
      window.__hold = setInterval(() => {
        const p = document.querySelector('.room-pet');
        if (p) p.style.left = `${c - parseFloat(p.style.width) / 2}%`;
      }, 70);
    }, centre);
    await page.waitForTimeout(1800);
    return page.evaluate(() => {
      const p = document.querySelector('.room-pet'), f = document.querySelector('.room-friend');
      return {
        pc: +(parseFloat(p.style.left) + parseFloat(p.style.width) / 2).toFixed(1),
        fc: +(parseFloat(f.style.left) + parseFloat(f.style.width) / 2).toFixed(1),
      };
    });
  };

  const first = await walkTo(35);
  const second = await walkTo(65);
  const third = await walkTo(30);

  ok('the duckling follows the axolotl across the room',
     first.fc !== second.fc, `${first.fc} then ${second.fc}`);
  ok('and comes back with it', second.fc !== third.fc, `${second.fc} then ${third.fc}`);

  for (const [where, r] of [['left', first], ['right', second], ['back left', third]]) {
    ok(`it stands clear of the axolotl at the ${where}`,
       Math.abs(r.pc - r.fc) > 12, `${r.pc}/${r.fc}`);
    ok(`and stays on the floor at the ${where}`,
       r.fc > 2 && r.fc < 98, String(r.fc));
  }

  /* Behind, not in front: when the axolotl went right, the duckling is on
     its left, and the other way about coming back. */
  ok('it walks behind the axolotl rather than ahead of it',
     second.fc < second.pc && third.fc > third.pc,
     `going right ${second.pc}/${second.fc}, coming back ${third.pc}/${third.fc}`);
  await page.evaluate(() => clearInterval(window.__hold));
  await ctx.close();
}

/* ---------- moving to another tablet ---------- */
{
  const { ctx, page } = await open({ mastered: 60,
    friend: { crackedTaps: 4, hatchedAt: 1700000000000, name: 'Waddles', foundAt: 1600000000000 } });
  const backup = await page.evaluate(async () => {
    const s = await import('./js/core/storage.js');
    return JSON.stringify(s.exportData ? s.exportData() : JSON.parse(localStorage.getItem('spelling-adventure:v1')));
  });
  await ctx.close();

  /* A tablet that has never seen the app. */
  const fresh = await browser.newContext({ viewport: { width: 950, height: 950 } });
  const page2 = await fresh.newPage();
  watch(page2, errs);
  await page2.goto(BASE, { waitUntil: 'networkidle' });
  await page2.evaluate(() => localStorage.clear());
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.evaluate(async json => {
    const s = await import('./js/core/storage.js');
    const data = JSON.parse(json);
    if (s.importData) s.importData(data);
    else localStorage.setItem('spelling-adventure:v1', json);
  }, backup);
  await page2.waitForTimeout(400);
  await page2.goto(BASE);
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(700);

  ok('the friend comes with her to a new tablet',
     await page2.locator('.room-friend').count() === 1);
  ok('and it is still called what she called it',
     (await page2.evaluate(async () => (await import('./js/core/friend.js')).name())) === 'Waddles');
  await fresh.close();
}

/* ---------- a save from before any of this ---------- */
{
  const { ctx, page } = await open({ mastered: 10 });
  const f = await page.evaluate(async () => {
    const mod = await import('./js/core/friend.js');
    return { ...mod.friend(), hatched: mod.hasHatched(), waiting: mod.eggWaiting() };
  });
  ok('an old save reads as no egg and no friend, not as broken',
     f.crackedTaps === 0 && f.hatchedAt === null && f.hatched === false && f.waiting === false,
     JSON.stringify(f));
  await ctx.close();
}

/* ---------- the celebration ---------- */
{
  const { ctx, page } = await open({ mastered: 60 });
  const m = await page.evaluate(async () => {
    const r = await import('./js/core/rewards.js');
    const found = r.MILESTONES.find(x => x.id === 'the_egg');
    return { at: found?.test({ mastered: 60, streak: 0, completedLists: 0 }),
             not59: found?.test({ mastered: 59, streak: 0, completedLists: 0 }),
             item: found?.item || null };
  });
  ok('there is a milestone at sixty', m.at === true);
  ok('and not at fifty-nine', m.not59 === false);
  ok('it opens something rather than handing her an ornament', m.item === null);
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
