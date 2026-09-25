/* Does it sit where it is supposed to sit?

   Every defect this suite checks for shipped at least once, and not one of
   them threw an error, failed a build, or showed up in any other suite.
   They were all found by a person looking at a picture — which is the one
   kind of testing that does not scale, so the ones worth keeping are
   written down here.

   THE BOX AND THE INK. Every piece of furniture is a square drawing, hung
   in the room by the bottom edge of that square. So where a drawing sits
   INSIDE its square decides where it lands on the floor. The Star Rug was
   drawn as an upright star filling its box, and came out as a six-foot
   golden star standing against the wall behind the axolotl — correct code,
   correct placement, absurd picture.

   TWO DRAWINGS OF THE SAME THING. The Tiny Word Castle was literally
   `() => DECOR.castle()`, so the shop sold the same grey castle twice
   under two names at two prices.

   A PICTURE OF NOTHING. Every hat and accessory is measured against the
   head and body it is worn on, so drawn on its own it is a few pixels of
   ribbon in an empty square. The shop's Wear tab was a grid of specks.

   AND THE DUCKLING. It follows the axolotl everywhere, which in the pond
   meant hovering in mid-water like a very calm drowning.
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 950, height: 1200 } });
const page = await ctx.newPage();
watch(page, errs);
await page.goto(BASE, { waitUntil: 'networkidle' });

/* ---------- the ink inside the box ---------- */

const ink = await page.evaluate(async () => {
  const items = await import('./js/core/items.js');
  const { decorSVG } = await import('./js/ui/item-art.js');
  const out = {};
  for (const item of items.CATALOG) {
    const svg = decorSVG(item.id, { size: 100 });
    if (!svg) continue;
    const host = document.createElement('div');
    host.innerHTML = svg;
    document.body.append(host);
    const b = host.querySelector('svg').getBBox();
    out[item.id] = { x: +b.x.toFixed(1), y: +b.y.toFixed(1),
                     w: +b.width.toFixed(1), h: +b.height.toFixed(1),
                     cat: item.category, name: item.name };
    host.remove();
  }
  return out;
});

ok(`measured ${Object.keys(ink).length} drawings`, Object.keys(ink).length > 100);

/* Fences and hedges run edge to edge on purpose — four of them tile across
   the back of the garden, and a rail that stops short leaves a gap at
   every join. Everything else stays inside its own square. */
const SPANS = new Set(['fence_picket', 'fence_hedge', 'fence_stone']);
const outside = Object.entries(ink).filter(([id, b]) =>
  !SPANS.has(id) && (b.x < -2.5 || b.y < -2.5 || b.x + b.w > 102.5 || b.y + b.h > 102.5));
ok('no drawing runs out of its own box',
   outside.length === 0,
   outside.map(([id, b]) => `${id} ${b.x},${b.y} ${b.w}x${b.h}`).join(' | '));

/* A rug lies on the floor. The room hangs its box by the bottom edge, so a
   rug whose ink sits high in its square floats up the wall. Flat and low,
   every one of them. */
const rugs = Object.entries(ink).filter(([, b]) => b.cat === 'rug');
ok(`all ${rugs.length} rugs lie flat and low in their box`,
   rugs.every(([, b]) => b.y >= 45 && b.h <= 48 && b.w / b.h >= 1.7),
   rugs.filter(([, b]) => !(b.y >= 45 && b.h <= 48 && b.w / b.h >= 1.7))
       .map(([id, b]) => `${id} y${b.y} ${b.w}x${b.h}`).join(' | '));

/* Anything that stands on the floor or the ground has to REACH the floor,
   or it hovers. */
const STANDING = new Set(['floorDecor', 'bed', 'gardenDecor', 'tree', 'door']);
const hovering = Object.entries(ink)
  .filter(([, b]) => STANDING.has(b.cat) && b.y + b.h < 86);
ok('nothing that stands on the floor stops short of it',
   hovering.length === 0,
   hovering.map(([id, b]) => `${id} ends at ${(b.y + b.h).toFixed(0)}`).join(' | '));

/* ---------- one drawing per item ---------- */

const same = await page.evaluate(async () => {
  const items = await import('./js/core/items.js');
  const { decorSVG } = await import('./js/ui/item-art.js');
  /* The ids inside a drawing are unique per call, so they are stripped
     before comparing — otherwise every drawing differs from itself. */
  const clean = s => s.replace(/id="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '');
  const seen = new Map(), dupes = [];
  for (const item of items.CATALOG) {
    const svg = decorSVG(item.id, { size: 100 });
    if (!svg) continue;
    const key = clean(svg);
    if (seen.has(key)) dupes.push(`${item.name} = ${seen.get(key)}`);
    else seen.set(key, item.name);
  }
  return dupes;
});
ok('no two items are the same picture with different names',
   same.length === 0, same.join(' | '));

/* ---------- the things she wears ---------- */

const wear = await page.evaluate(async () => {
  const items = await import('./js/core/items.js');
  const { itemSVG } = await import('./js/ui/thumbs.js');
  const out = { missing: [], tiny: [], noAnimal: [] };
  for (const item of items.CATALOG) {
    if (item.category !== 'hat' && item.category !== 'accessory') continue;
    const svg = itemSVG(item, { size: 120 });
    if (!svg) { out.missing.push(item.id); continue; }
    /* The picture of a wearable is the axolotl wearing it, so the pet's
       own drawing has to be in there. */
    if (!/wear-thumb/.test(svg)) { out.noAnimal.push(item.id); continue; }
    const host = document.createElement('div');
    host.innerHTML = svg;
    document.body.append(host);
    const svgEl = host.querySelector('svg');
    const vb = svgEl.getAttribute('viewBox').split(/\s+/).map(Number);
    const b = svgEl.getBBox();
    const fill = (b.width * b.height) / (vb[2] * vb[3]);
    if (fill < 0.4) out.tiny.push(`${item.id} ${(fill * 100).toFixed(0)}%`);
    host.remove();
  }
  return out;
});
ok('every hat and accessory has a picture', wear.missing.length === 0, wear.missing.join(','));
ok('and every one of them is the axolotl wearing it',
   wear.noAnimal.length === 0, wear.noAnimal.join(','));
ok('so none of them is a speck in an empty square',
   wear.tiny.length === 0, wear.tiny.join(' | '));

/* The item she is looking at has to be IN the picture, not cropped out of
   it: a hat is drawn on the head, an accessory on the body, and the view
   is aimed differently for each. */
const aimed = await page.evaluate(async () => {
  const { wearingSVG } = await import('./js/ui/thumbs.js');
  const box = (id, category) => {
    const host = document.createElement('div');
    host.innerHTML = wearingSVG(id, { size: 120, category });
    document.body.append(host);
    const svg = host.querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const b = svg.getBBox();
    host.remove();
    /* How far the drawing spills past the view on each side. */
    return { over: [vb[0] - b.x, vb[1] - b.y,
                    (b.x + b.width) - (vb[0] + vb[2]),
                    (b.y + b.height) - (vb[1] + vb[3])] };
  };
  return { hat: box('wizard_hat', 'hat'), acc: box('cape', 'accessory') };
});
ok('a hat is shown head and shoulders, with the hat inside the view',
   aimed.hat.over[1] <= 2, JSON.stringify(aimed.hat.over));
ok('and a cape is shown with enough of the body to see it on',
   aimed.acc.over[3] <= 14, JSON.stringify(aimed.acc.over));

/* ---------- the places, and who stands in them ---------- */

const SEED = ({ mastered = 130, equipped = {}, owned = [] }) => {
  const now = Date.now(), D = 86400000;
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'Tessa', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: Array.from({ length: mastered + 4 }, (_, i) => ({
      id: 'w' + i, listId: 'l1', text: 'word' + i, definition: '', sentence: '', hint: '', tags: [],
      attempts: 6, correctCount: 6, incorrectCount: 0, streak: i < mastered ? 5 : 2,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now, lastSeen: now, lastCorrect: now, lastMissed: null,
      masteredAt: i < mastered ? now - D : null, reviewAt: now + 30 * D, reviewStep: 0, createdAt: now,
    })),
    settings: { masteryThreshold: 5, masteryRuleV2: true, parentPin: '1234' },
    progress: { stars: 4000,
      milestonesEarned: ['garden_gate', 'word_tree', 'the_egg', 'the_pond', 'the_letters'] },
    friend: { crackedTaps: 4, hatchedAt: now - 9 * D, name: 'Pip', foundAt: now - 10 * D },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood',
                sky: 'sky_day', ground: 'ground_grass', ...equipped },
    collection: { items: owned.map(id => ({ id, itemId: id, source: 'shop', earnedAt: now })) },
  }));
};

async function open(plan, hash) {
  await page.goto(BASE);
  await page.evaluate(SEED, plan);
  await page.goto(BASE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.goto(`${BASE}${hash}`);
  await page.waitForTimeout(1400);
}

/* Three things in the garden, and nowhere for any of them to be buried.
   The front-left spot used to be exactly where the path down to the pond
   was later dug. */
{
  const decor = ['garden_bench', 'lamp_post', 'birdhouse'];
  await open({ equipped: { gardenDecor: decor, fence: 'fence_picket' },
               owned: [...decor, 'fence_picket'] }, '#/garden');
  const clash = await page.evaluate(() => {
    const scene = document.querySelector('.room');
    const r = scene.getBoundingClientRect();
    const rect = el => { const b = el.getBoundingClientRect();
      return { l: b.left - r.left, t: b.top - r.top, w: b.width, h: b.height, el }; };
    const overlap = (a, b) =>
      Math.max(0, Math.min(a.l + a.w, b.l + b.w) - Math.max(a.l, b.l)) *
      Math.max(0, Math.min(a.t + a.h, b.t + b.h) - Math.max(a.t, b.t));
    /* The fence is not something she put out: it runs edge to edge across
       the back and the gate stands IN it, so it is not a clash. */
    const pieces = [...scene.querySelectorAll('.room-piece:not(.garden-fence)')].map(rect);
    const fixed = ['.garden-path', '.garden-post', '.garden-gate']
      .map(s => scene.querySelector(s)).filter(Boolean).map(rect);
    const bad = [];
    for (const p of pieces) for (const f of fixed) {
      const share = overlap(p, f) / Math.min(p.w * p.h, f.w * f.h);
      if (share > 0.3) bad.push(`${f.el.className} covers a piece (${Math.round(share * 100)}%)`);
    }
    return { pieces: pieces.length, fixed: fixed.length, bad };
  });
  ok('the garden has its three decor places and its three ways on',
     clash.pieces >= 3 && clash.fixed === 3, JSON.stringify(clash));
  ok('and nothing she puts out lands underneath the path, the postbox or the gate',
     clash.bad.length === 0, clash.bad.join(' | '));
}

/* The duckling floats. It does not hover in mid-water. */
{
  await open({ equipped: { pondWater: 'water_deep', pondFloor: 'bed_pebbles' },
               owned: ['water_deep', 'bed_pebbles'] }, '#/pond');
  const duck = await page.evaluate(() => {
    const scene = document.querySelector('.room');
    const f = document.querySelector('.room-friend');
    if (!f) return null;
    const r = scene.getBoundingClientRect(), b = f.getBoundingClientRect();
    const style = getComputedStyle(f);
    return {
      onWater: f.classList.contains('on-water'),
      clipped: getComputedStyle(f.querySelector('.friend-body')).clipPath !== 'none',
      ripple: getComputedStyle(f, '::after').content !== 'none',
      topPct: ((r.bottom - b.top) / r.height) * 100,
      bottomPct: ((r.bottom - b.bottom) / r.height) * 100,
      insideScene: b.top >= r.top - 1 && b.bottom <= r.bottom + 1,
    };
  });
  ok('the duckling comes down to the pond with her', duck !== null);
  ok('it is on the water, not in it', duck.onWater === true);
  ok('its feet are under the surface', duck.clipped === true);
  ok('and there is a ripple where it sits', duck.ripple === true);
  ok('it floats at the top of the pond, not half way down',
     duck.bottomPct > 80, `${duck.bottomPct?.toFixed(0)}% up`);
  ok('and its head does not go out through the top of the picture',
     duck.insideScene === true, `${duck.topPct?.toFixed(0)}% up`);
}

/* On land it stands on the ground, at the axolotl's side, and smaller. */
{
  await open({}, '#/garden');
  const pair = await page.evaluate(() => {
    const pet = document.querySelector('.room-pet svg');
    const friend = document.querySelector('.room-friend svg');
    if (!pet || !friend) return null;
    const p = pet.getBoundingClientRect(), f = friend.getBoundingClientRect();
    return { petW: p.width, friendW: f.width,
             ratio: f.width / p.width,
             friendBottom: f.bottom, petBottom: p.bottom };
  });
  ok('the duckling is a pet for the pet, not a rival',
     pair.ratio > 0.18 && pair.ratio < 0.55,
     `${pair.friendW.toFixed(0)} against ${pair.petW.toFixed(0)}`);
  ok('and it stands on the same ground, a little further back',
     pair.friendBottom <= pair.petBottom + 2,
     `${pair.friendBottom.toFixed(0)} vs ${pair.petBottom.toFixed(0)}`);
}

await ctx.close();
await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
