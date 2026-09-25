/* The pond.

   The fourth place, at eighty mastered words, and the only one where the
   axolotl is not standing on something. That is what this suite is mostly
   about: everywhere else in the app the animal has ONE coordinate and the
   only question is how far left or right. Here it has two, and if that
   ever quietly goes back to one the pond has become a room with a blue
   wall and nobody would notice from the screenshots.

   After that: the gate, and the thing every new place in this app has to
   prove — that its stuff stays in it. A bed on the grass is a bug; so is
   a rug at the bottom of a pond.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();

const SEED = ({ mastered, equipped = {}, friend = null }) => {
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
    progress: { stars: 900, milestonesEarned: ['garden_gate', 'word_tree', 'the_egg', 'the_pond'] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood',
                sky: 'sky_day', ground: 'ground_grass', ...equipped },
    collection: { items: ['pond_reeds', 'pond_lilies', 'pond_weed', 'pond_log', 'pond_rock',
                          'pond_fish', 'pond_tadpoles', 'water_deep', 'bed_pebbles']
      .map(id => ({ id, itemId: id, source: 'shop', earnedAt: now })) },
  };
  if (friend) save.friend = friend;
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
};

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
  if (hash !== '#/') { await page.goto(`${BASE}${hash}`); await page.waitForTimeout(1000); }
  return { ctx, page };
}

/* ---------- the way down ---------- */
{
  const { ctx, page } = await open({ mastered: 79 }, '#/garden');
  const g = await page.evaluate(async () => {
    const p = await import('./js/core/pond.js');
    return { open: p.pondOpen(), left: p.wordsToGo(), line: p.gateLine() };
  });
  ok('at 79 mastered words the pond is shut', g.open === false);
  ok('and it is one word off', g.left === 1, String(g.left));
  ok('a shut path says the number rather than just "no"',
     /one more/i.test(g.line), g.line);
  ok('the path is in the garden even while it is shut',
     await page.locator('.garden-path').count() === 1);

  await page.click('.garden-path');
  await page.waitForTimeout(300);
  ok('tapping it says how far off it is',
     /one more mastered word/i.test(await page.locator('.room-speech').innerText()),
     await page.locator('.room-speech').innerText());
  ok('and it does not go anywhere', !/pond/.test(await page.evaluate(() => location.hash)));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 80 }, '#/garden');
  await page.click('.garden-path');
  await page.waitForTimeout(800);
  ok('at 80 the path goes down to the water',
     /#\/pond/.test(await page.evaluate(() => location.hash)));
  ok('and there is water on the screen', await page.locator('.pond-water').count() === 1);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 20 }, '#/pond');
  await page.waitForTimeout(500);
  ok('the pond cannot be reached by typing its address early',
     await page.locator('.pond-water').count() === 0 &&
     !/#\/pond/.test(await page.evaluate(() => location.hash)),
     await page.evaluate(() => location.hash));
  await ctx.close();
}

/* ---------- it is a pond, not a room with a blue wall ---------- */
{
  const { ctx, page } = await open({ mastered: 80 }, '#/pond');
  ok('there is a bed at the bottom of it', await page.locator('.pond-bed').count() === 1);
  ok('and a surface at the top', await page.locator('.pond-surface').count() === 1);

  /* The check this suite exists for. Pinned as it wanders, so what is
     measured is where it actually went rather than where it started. */
  const seen = [];
  for (let i = 0; i < 9; i++) {
    await page.waitForTimeout(1100);
    seen.push(await page.evaluate(() => {
      const e = document.querySelector('.room-pet');
      return { x: +parseFloat(e.style.left).toFixed(1), y: +parseFloat(e.style.bottom).toFixed(1) };
    }));
  }
  const xs = new Set(seen.map(s => s.x)), ys = new Set(seen.map(s => s.y));
  ok('the axolotl moves across the water', xs.size > 1, [...xs].join(','));
  ok('AND up and down it, which is the whole point of the place',
     ys.size > 1, [...ys].join(','));

  /* It must not walk out of the water in either direction. */
  ok('it never sinks into the bed', seen.every(s => s.y >= 10),
     seen.map(s => s.y).join(','));
  ok('and never breaks the surface', seen.every(s => s.y <= 60),
     seen.map(s => s.y).join(','));
  ok('and stays in frame across the water',
     seen.every(s => s.x >= -4 && s.x <= 96), seen.map(s => s.x).join(','));

  /* It tilts towards where it is going, which is the difference between
     swimming and being slid about. */
  const tilted = await page.evaluate(async () => {
    const lean = document.querySelector('.room-pet .pet-lean');
    const seenAngles = new Set();
    for (let i = 0; i < 26; i++) {
      seenAngles.add(getComputedStyle(lean).transform);
      await new Promise(r => setTimeout(r, 260));
    }
    return seenAngles.size;
  });
  ok('and it banks and pitches as it goes', tilted > 1, `${tilted} different angles`);
  await ctx.close();
}

/* ---------- what she puts in it ---------- */
{
  const { ctx, page } = await open({ mastered: 80, equipped: {
    pondWater: 'water_deep', pondFloor: 'bed_pebbles', pondFeature: 'pond_log',
    pondPlant: ['pond_reeds', 'pond_weed', 'pond_lilies'],
    pondFriend: ['pond_fish', 'pond_tadpoles'],
  } }, '#/pond');

  const pieces = await page.locator('.room-piece').count();
  ok('everything she has put in is in the water', pieces === 6, String(pieces));
  ok('the fish and the tadpoles drift about',
     await page.locator('.pond-drifter').count() === 2);

  /* Lily pads float and reeds are rooted, so they cannot both be at the
     same height. */
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('.room-piece')].map(n => parseFloat(n.style.bottom)));
  ok('things sit at different depths rather than in a row',
     new Set(heights).size >= 4, heights.join(','));
  ok('and something floats near the top', Math.max(...heights) > 50, String(Math.max(...heights)));
  ok('while something is rooted on the bottom', Math.min(...heights) < 20, String(Math.min(...heights)));
  await ctx.close();
}

/* ---------- its things stay in it ---------- */
{
  const { ctx, page } = await open({ mastered: 80 });
  const kept = await page.evaluate(async () => {
    const items = await import('./js/core/items.js');
    const slotOf = id => items.byId(id)?.category;
    return {
      reeds: slotOf('pond_reeds'),
      lilies: slotOf('pond_lilies'),
      water: slotOf('water_deep'),
      bed: slotOf('bed_pebbles'),
      /* And the pond slots are their own group. */
      groups: items.POND_SLOTS.map(s => items.SLOTS[s].group),
      roomSlots: items.POND_SLOTS.filter(s => ['room', 'furniture', 'decor'].includes(items.SLOTS[s].group)),
      gardenOverlap: items.POND_SLOTS.filter(s => items.GARDEN_SLOTS.includes(s)),
    };
  });
  ok('the water plants are pond plants', kept.reeds === 'pondPlant' && kept.lilies === 'pondPlant');
  ok('the water and the bed are their own slots',
     kept.water === 'pondWater' && kept.bed === 'pondFloor');
  ok('every pond slot belongs to the pond', kept.groups.every(g => g === 'pond'),
     kept.groups.join(','));
  ok('none of them is a room slot', kept.roomSlots.length === 0, kept.roomSlots.join(','));
  ok('and none of them is a garden slot', kept.gardenOverlap.length === 0,
     kept.gardenOverlap.join(','));

  /* A save that tries to put a rug in the pond gets nothing, the same way
     a wall item cannot land on the floor. */
  const refused = await page.evaluate(async () => {
    const items = await import('./js/core/items.js');
    const { update } = await import('./js/core/state.js');
    update(st => { st.equipped.pondFeature = 'rug_round'; });
    return items.equipped().pondFeature || null;
  });
  ok('a rug cannot end up at the bottom of the pond, even from a bad save',
     refused === null, String(refused));
  await ctx.close();
}

/* ---------- the shop and the decorating screen ---------- */
{
  const { ctx, page } = await open({ mastered: 79 }, '#/shop');
  await page.waitForTimeout(500);
  ok('the pond tab is hidden until the water is hers',
     await page.locator('button:has-text("Pond")').count() === 0);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 80 }, '#/shop?tab=pond');
  await page.waitForTimeout(600);
  const text = await page.evaluate(() => document.body.innerText);
  ok('and it is there once it is', /Pond/.test(text));
  ok('with things to put in the water', /Reeds|Lily Pads|Goldfish|Sunken Log/.test(text),
     text.slice(0, 200));
  await ctx.close();
}
{
  const { ctx, page } = await open({ mastered: 80 }, '#/decorate?where=pond');
  await page.waitForTimeout(700);
  ok('the decorating screen can show the pond',
     await page.locator('.pond-water').count() === 1);
  const text = await page.evaluate(() => document.body.innerText);
  ok('with a section for each thing in it',
     /The water/.test(text) && /The bottom/.test(text) && /Water plants/.test(text),
     text.slice(0, 260));
  await ctx.close();
}

/* ---------- the duckling ---------- */
{
  const { ctx, page } = await open({ mastered: 80,
    friend: { crackedTaps: 4, hatchedAt: 1000, name: 'Pip', foundAt: 900 } }, '#/pond');
  ok('the duckling comes down to the pond too',
     await page.locator('.room-friend').count() === 1);
  ok('and it paddles on the surface rather than swimming',
     await page.locator('.room-friend.on-water').count() === 1);

  const where = await page.evaluate(() => ({
    friend: parseFloat(document.querySelector('.room-friend').style.bottom),
    pet: parseFloat(document.querySelector('.room-pet').style.bottom),
  }));
  ok('it stays up above the axolotl', where.friend > where.pet + 20, JSON.stringify(where));
  await ctx.close();
}

/* ---------- the celebration ---------- */
{
  const { ctx, page } = await open({ mastered: 80 });
  const m = await page.evaluate(async () => {
    const r = await import('./js/core/rewards.js');
    const found = r.MILESTONES.find(x => x.id === 'the_pond');
    return { at: found?.test({ mastered: 80, streak: 0, completedLists: 0 }),
             not79: found?.test({ mastered: 79, streak: 0, completedLists: 0 }),
             item: found?.item || null };
  });
  ok('there is a milestone at eighty', m.at === true);
  ok('and not at seventy-nine', m.not79 === false);
  ok('it opens a place rather than handing her an ornament', m.item === null);
  await ctx.close();
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
