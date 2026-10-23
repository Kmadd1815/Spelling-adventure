/* Tapping the things she has put out.

   Her idea: tap the bed and the axolotl has a nap, tap the bookcase and it
   reads, tap the plant and it waters it — and everything else does a little
   something of its own.

   The rules worth protecting:

     NOTHING IS SILENT. Every single thing she can put in a room, a garden
     or a pond answers a tap. A child who taps something and gets nothing
     learns that tapping does nothing and stops trying.

     THE AXOLOTL GETS THERE FIRST. A nap that starts before it has walked
     to the bed is a nap in the middle of the floor.

     AND IT STOPS. A pose is held for a few seconds and then let go; a
     screen that goes away takes its timers with it. An axolotl frozen
     mid-nap on the next screen is the bug this is here to catch.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 950, height: 1150 } });
const page = await ctx.newPage();
watch(page, errs);

const ROOM = ['teddy', 'bookshelf', 'potted_plant', 'toy_blocks', 'tea_set', 'toy_ball'];
const WALL = ['clock', 'bunting', 'wall_planter'];

const SEED = ({ room, wall }) => {
  const now = Date.now(), D = 86400000;
  const own = ['wall_plain', 'floor_wood', 'window_cottage', 'door_round',
               'bed_cozy', 'rug_round', ...room, ...wall];
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'Tessa', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: Array.from({ length: 40 }, (_, i) => ({
      id: 'w' + i, listId: 'l1', text: 'word' + i, definition: '', sentence: '', hint: '', tags: [],
      attempts: 6, correctCount: 6, incorrectCount: 0, streak: 5,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: now - D, reviewAt: now + 30 * D, reviewStep: 0, createdAt: now,
    })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 900, milestonesEarned: ['garden_gate'] },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood', window: 'window_cottage',
                door: 'door_round', bed: 'bed_cozy', rug: 'rug_round',
                sky: 'sky_day', ground: 'ground_grass',
                floorDecor: room, wallDecor: wall },
    collection: { items: own.map(id => ({ id, itemId: id, source: 'shop', earnedAt: now })) },
  }));
};

/* Waiting for a thing to happen rather than for a number of milliseconds.

   The walk is 520ms plus 62ms for every per cent of the room it crosses,
   and a busy machine stretches that; a fixed sleep made this suite fail on
   a different check each run. Polling keeps the check exactly as strict —
   the pose still has to arrive, and the walk-first checks above still
   prove it walked — without making it a race against the clock. */
const until = async (test, ms = 12000, step = 150) => {
  const stop = Date.now() + ms;
  for (;;) {
    if (await test()) return true;
    if (Date.now() > stop) return false;
    await page.waitForTimeout(step);
  }
};
const petClass = () => page.$eval('.room-pet', n => n.className).catch(() => '');
const waitForPose = name => until(async () => (await petClass()).includes(`pet-pose-${name}`));
const waitForNoPose = () => until(async () => !/pet-pose/.test(await petClass()));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(SEED, { room: ROOM, wall: WALL });
await page.goto(BASE);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);

/* ---------- nothing is silent ---------- */
{
  const audit = await page.evaluate(async () => {
    const items = await import('./js/core/items.js');
    const { playFor, POSES } = await import('./js/core/decorplay.js');
    /* Everything she can put out anywhere. */
    const SLOTS = ['floorDecor', 'wallDecor', 'bed', 'rug', 'gardenDecor', 'tree', 'water',
                   'pondFeature', 'pondPlant', 'pondFriend'];
    const out = { total: 0, silent: [], noLine: [], badPose: [], noAnimation: [] };
    for (const item of items.CATALOG) {
      if (!SLOTS.includes(item.category)) continue;
      out.total += 1;
      const play = playFor(item.id);
      if (!play) { out.silent.push(item.id); continue; }
      if (!play.lines?.length) out.noLine.push(item.id);
      if (play.kind === 'visit' && !POSES[play.pose]) out.badPose.push(item.id);
      if (play.kind === 'fidget' && !play.item) out.noAnimation.push(item.id);
    }
    return out;
  });
  ok(`every one of the ${audit.total} things she can put out answers a tap`,
     audit.silent.length === 0, audit.silent.join(','));
  ok('and every one of them has something to say',
     audit.noLine.length === 0, audit.noLine.join(','));
  ok('no visit names a pose that does not exist',
     audit.badPose.length === 0, audit.badPose.join(','));
  ok('and every fidget has an animation to run',
     audit.noAnimation.length === 0, audit.noAnimation.join(','));
}

/* ---------- the room ---------- */
{
  const pieces = page.locator('button.room-piece');
  const n = await pieces.count();
  ok('everything out in the room is tappable', n >= 10, String(n));

  const labels = await pieces.evaluateAll(ns => ns.map(x => x.getAttribute('aria-label')));
  ok('and each one says its own name out loud',
     labels.every(l => l && l.length > 2 && !/_/.test(l)), labels.join(' | '));

  /* Nothing she has put out may be a dead square. The window was: it is a
     thing she chose and paid for and it answered a tap with nothing. */
  const dead = await page.evaluate(() => [...document.querySelectorAll('.room-piece')]
    .filter(n => n.tagName !== 'BUTTON' && !n.classList.contains('room-door'))
    .map(n => n.className));
  ok('and nothing in the room is a dead square', dead.length === 0, dead.join(' | '));
  ok('the window answers a tap too',
     await page.locator('button.room-piece[aria-label*="Window"]').count() === 1,
     labels.join(' | '));

  /* A tap is answered at once. */
  const before = await page.$eval('.room-speech', n2 => n2.textContent);
  await page.click('button.room-piece[aria-label="Toy Blocks"]');
  await page.waitForTimeout(260);
  const blocks = await page.$eval('button.room-piece[aria-label="Toy Blocks"]', n2 => n2.className);
  ok('tapping the blocks sets them going straight away', /dp-stack/.test(blocks), blocks);
  const said = await page.$eval('.room-speech', n2 => n2.textContent);
  ok('and the axolotl says something about it', said !== before, `${before} -> ${said}`);

  /* And it stops. */
  await until(async () => !/dp-stack/.test(
    await page.$eval('button.room-piece[aria-label="Toy Blocks"]', n2 => n2.className)), 6000);
  const after = await page.$eval('button.room-piece[aria-label="Toy Blocks"]', n2 => n2.className);
  ok('the blocks settle again afterwards', !/dp-stack/.test(after), after);

  /* Even a thing it cannot walk to gets a look. Forced, because by now
     the axolotl may legitimately be standing in front of the blocks —
     which is a thing a child would simply tap through by tapping
     somewhere else, and not what this check is about. */
  await until(async () => !/pet-walking/.test(await petClass()), 6000);
  await page.click('button.room-piece[aria-label="Toy Blocks"]', { force: true });
  const looked = await until(async () => /pet-peeking/.test(await petClass()), 2000);
  ok('and the axolotl looks over at it', looked, await petClass());
  await until(async () => !/pet-peeking/.test(await petClass()), 4000);

  /* Tapping it again works — the class has to come off and go back on, or
     the second tap is silent. */
  await page.click('button.room-piece[aria-label="Toy Blocks"]');
  await page.waitForTimeout(220);
  ok('and they go again on a second tap',
     /dp-stack/.test(await page.$eval('button.room-piece[aria-label="Toy Blocks"]', n2 => n2.className)));
  await page.waitForTimeout(2700);
}

/* ---------- the axolotl walks over ---------- */
{
  const where = () => page.$eval('.room-pet', n => parseFloat(n.style.left));
  const start = await where();
  await page.click('button.room-piece[aria-label="Cozy Bed"]');
  await page.waitForTimeout(400);
  ok('tapping the bed sets the axolotl walking',
     await page.$eval('.room-pet', n => n.className.includes('pet-walking')),
     await page.$eval('.room-pet', n => n.className));
  ok('and it is heading for the bed', (await where()) < start + 1,
     `${start} -> ${await where()}`);

  /* Crossing the room takes a moment on purpose: the pace is the same
     whatever the distance, so the far wall is a journey. */
  const napped = await waitForPose('nap');
  const nap = await petClass();
  ok('when it gets there it lies down', napped, nap);

  /* And it lies down AT THE BED. This is the check that was missing: the
     wandering band stopped the axolotl in the middle of the floor, so it
     walked off towards the bed and then napped in the middle of the room,
     which is what she saw and reported. */
  const atBed = await page.evaluate(() => {
    const scene = document.querySelector('.room');
    const bed = document.querySelector('button.room-piece[aria-label="Cozy Bed"]');
    const pet = document.querySelector('.room-pet');
    const r = scene.getBoundingClientRect();
    const b = bed.getBoundingClientRect();
    const q = pet.getBoundingClientRect();
    const mid = n => (n.x + n.width / 2 - r.x) / r.width * 100;
    return {
      dx: Math.abs(mid(q) - mid(b)),
      petBottom: (r.bottom - q.bottom) / r.height * 100,
      bedBottom: (r.bottom - b.bottom) / r.height * 100,
      overlaps: !(q.right < b.left || q.left > b.right || q.bottom < b.top || q.top > b.bottom),
    };
  });
  console.log('   bed: ' + JSON.stringify(atBed));
  ok('and it is lying on the bed, not in the middle of the floor',
     atBed.overlaps && atBed.dx < 18, JSON.stringify(atBed));
  ok('...up the floor where the bed is, not down at the front',
     atBed.petBottom > atBed.bedBottom - 2, JSON.stringify(atBed));
  ok('with its eyes shut',
     await page.evaluate(() => {
       const open = document.querySelector('.room-pet .pet-eye-open');
       return !open || getComputedStyle(open).opacity === '0';
     }));
  ok('and a z z z over it', await page.locator('.room-pet .pet-zzz').count() === 1);

  /* The nap has to end by itself. */
  const awake = await waitForNoPose();
  const woke = await petClass();
  ok('and it wakes up again', awake, woke);
  ok('taking the z z z with it', await page.locator('.room-pet .pet-zzz').count() === 0);
}

/* ---------- it holds the thing it is using ---------- */
{
  await page.click('button.room-piece[aria-label="Book Nook"]');
  const reading = await waitForPose('read');
  ok('tapping the bookshelf sends it to read', reading, await petClass());
  ok('...and it holds an open book while it does',
     await page.locator('.room-pet .pet-prop-read svg').count() === 1);

  const atShelf = await page.evaluate(() => {
    const scene = document.querySelector('.room');
    const shelf = document.querySelector('button.room-piece[aria-label="Book Nook"]');
    const pet = document.querySelector('.room-pet');
    const r = scene.getBoundingClientRect();
    const mid = n => { const q = n.getBoundingClientRect();
      return (q.x + q.width / 2 - r.x) / r.width * 100; };
    return Math.abs(mid(pet) - mid(shelf));
  });
  ok('...standing at the bookshelf', atShelf < 20, String(Math.round(atShelf)));
  await until(async () => !/pet-pose/.test(await petClass()));

  await page.click('button.room-piece[aria-label="Potted Plant"]');
  const watering = await waitForPose('water');
  ok('tapping the plant sends it to water it', watering, await petClass());
  ok('...with a watering can in its hands',
     await page.locator('.room-pet .pet-prop-water svg').count() === 1);
  /* And the can has to be in front of the plant rather than behind it. */
  const inFront = await page.evaluate(() => {
    const pet = document.querySelector('.room-pet');
    const plant = document.querySelector('button.room-piece[aria-label="Potted Plant"]');
    return Number(getComputedStyle(pet).zIndex) > Number(getComputedStyle(plant).zIndex);
  });
  ok('...held in front of the plant, not behind it', inFront);
  await until(async () => !/pet-pose/.test(await petClass()));

  /* Whatever it was holding goes away with the pose. */
  ok('and it puts the prop down afterwards',
     await page.locator('.room-pet .pet-prop').count() === 0);
}

/* ---------- leaving the screen ---------- */
{
  await page.click('button.room-piece[aria-label="Book Nook"]');
  await page.waitForTimeout(500);
  await page.goto(`${BASE}#/progress`);
  await page.waitForTimeout(900);
  await page.goto(`${BASE}#/`);
  await page.waitForTimeout(1200);
  const cls = await page.$eval('.room-pet', n => n.className);
  ok('walking out mid-read leaves no axolotl stuck in a pose',
     !/pet-pose/.test(cls), cls);
  ok('and none of its z z z left behind', await page.locator('.pet-zzz').count() === 0);
}

/* ---------- the garden and the pond ---------- */
{
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    save.equipped.gardenDecor = ['bird_bath', 'flower_bed', 'birdhouse'];
    save.equipped.fence = 'fence_picket';
    save.equipped.tree = 'tree_apple';
    for (const id of ['bird_bath', 'flower_bed', 'birdhouse', 'fence_picket', 'tree_apple']) {
      save.collection.items.push({ id, itemId: id, source: 'shop', earnedAt: Date.now() });
    }
    localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
  });
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.goto(`${BASE}#/garden`);
  await page.waitForTimeout(1500);
  const out = await page.locator('button.room-piece').count();
  ok('the things in the garden are tappable too', out >= 3, String(out));

  const gardenDead = await page.evaluate(() => [...document.querySelectorAll('.room-piece')]
    .filter(n => n.tagName !== 'BUTTON').map(n => n.className));
  ok('and nothing out there is a dead square either',
     gardenDead.length === 0, gardenDead.join(' | '));
  ok('the fence answers a tap, every section of it',
     await page.locator('button.room-piece[aria-label*="Fence"]').count() >= 2);

  await page.click('button.room-piece[aria-label="Flower Bed"]');
  const sniffed = await waitForPose('sniff');
  ok('and the axolotl goes and smells the flowers', sniffed, await petClass());
  ok('...with a flower in its hands',
     await page.locator('.room-pet .pet-prop-sniff svg').count() === 1);

  const atFlowers = await page.evaluate(() => {
    const scene = document.querySelector('.room');
    const bed = document.querySelector('button.room-piece[aria-label="Flower Bed"]');
    const pet = document.querySelector('.room-pet');
    const r = scene.getBoundingClientRect();
    const mid = n => { const q = n.getBoundingClientRect();
      return (q.x + q.width / 2 - r.x) / r.width * 100; };
    return Math.abs(mid(pet) - mid(bed));
  });
  ok('...standing at the flowers, not out in the middle of the lawn',
     atFlowers < 22, String(Math.round(atFlowers)));
  await until(async () => !/pet-pose/.test(await petClass()));
}

/* ---------- and under the water ----------

   The pond was the one place where tapping something she owned brought
   nobody over: the axolotl carried on with its own swim while the lily
   pads wobbled by themselves. */
{
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
    const now = Date.now(), D = 86400000;
    /* The way down opens at eighty mastered words. */
    for (let i = save.words.length; i < 95; i++) {
      save.words.push({ ...save.words[0], id: 'p' + i, text: 'pond' + i, masteredAt: now - D });
    }
    save.equipped.pondWater = 'water_sunny';
    save.equipped.pondFloor = 'bed_sand';
    save.equipped.pondFeature = 'pond_rock';
    save.equipped.pondPlant = ['pond_reeds', 'pond_lilies'];
    for (const id of ['water_sunny', 'bed_sand', 'pond_rock', 'pond_reeds', 'pond_lilies']) {
      save.collection.items.push({ id, itemId: id, source: 'shop', earnedAt: now });
    }
    localStorage.setItem('spelling-adventure:v1', JSON.stringify(save));
  });
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.goto(`${BASE}#/pond`);
  await page.waitForTimeout(1600);

  const wet = await page.locator('button.room-piece').count();
  ok('the things in the pond are tappable as well', wet >= 2, String(wet));
  const pondDead = await page.evaluate(() => [...document.querySelectorAll('.room-piece')]
    .filter(n => n.tagName !== 'BUTTON').map(n => n.className));
  ok('and none of them is a dead square', pondDead.length === 0, pondDead.join(' | '));

  const before = await page.$eval('.room-pet', n => `${n.style.left} ${n.style.bottom}`);
  await page.click('button.room-piece[aria-label="Big Rock"]');
  const came = await until(async () => {
    const now = await page.$eval('.room-pet', n => `${n.style.left} ${n.style.bottom}`);
    return now !== before;
  }, 8000);
  ok('tapping one brings the axolotl over to it', came,
     await page.$eval('.room-pet', n => `${n.style.left} ${n.style.bottom}`));
}

await ctx.close();
await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
