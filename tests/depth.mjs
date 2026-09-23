/* The graphics pass: one light, and everything touching the ground.

   These are the checks that would have caught the two real bugs this pass
   produced. The first was silent and only visible on the shop shelf: the
   windows were redrawn with the frame as a stroked ring, which is the only
   way the live sky behind the glass can show through — and the glass fill
   went with it, so in the shop every window was a hole. The second was a
   pair of gradients sharing an id, which in SVG means the second drawing
   quietly wears the first one's colours.

   Nothing here judges whether a drawing looks good; that is what looking at
   it is for. These check the things that are true or false. */

import { chromium, BASE, SP, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const browser = await chromium.launch();
const errs = [];
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
watch(page, errs);
await page.goto(BASE, { waitUntil: 'networkidle' });

const art = await page.evaluate(async () => {
  const m = await import('./js/ui/item-art.js');
  const items = await import('./js/core/items.js');
  const out = { ids: [], svg: {}, surfaces: m.SURFACES, shadow: m.SHADOW };
  /* By id, not by catalogue row: the catalogue lists 'mushrooms' twice,
     once for the garden and once for indoors, and counting the same drawing
     twice would look exactly like two drawings clashing. */
  for (const it of items.CATALOG ?? items.shopItems().concat(items.starterItems())) {
    if (out.svg[it.id]) continue;
    const s = m.decorSVG(it.id, { size: 100 });
    if (s) { out.ids.push(it.id); out.svg[it.id] = s; }
  }
  return out;
});

ok('every catalogue drawing still draws', art.ids.length > 90, `${art.ids.length} drawings`);

/* ---------- ids are unique across a whole page of drawings ----------
   The shop puts the entire catalogue up at once. */
const allIds = [];
for (const id of art.ids) {
  for (const m of art.svg[id].matchAll(/ id="([^"]+)"/g)) allIds.push(m[1]);
}
const dupes = allIds.filter((v, i) => allIds.indexOf(v) !== i);
ok('no two gradients on one page share an id',
   dupes.length === 0,
   `${allIds.length} ids, ${dupes.length} clashes${dupes.length ? ': ' + dupes.slice(0, 3) : ''}`);

/* ---------- windows are windows, not holes ----------
   The room paints --season-glass transparent so the sky behind shows
   through. Everywhere else the glass has to be there. */
const WINDOWS = ['window_plain', 'window_round', 'window_cottage',
                 'window_arch', 'window_flower', 'window_star'];
let glassed = 0;
for (const id of WINDOWS) if (/fill="var\(--season-glass/.test(art.svg[id] || '')) glassed++;
ok('every window has glass in it', glassed === WINDOWS.length,
   `${glassed} of ${WINDOWS.length}`);

/* ---------- things that stand on the ground touch it ---------- */
const STANDING = ['door_wood', 'door_round', 'door_fancy', 'door_barn', 'door_star',
  'bed_cozy', 'bed_cushion', 'bed_shell', 'potted_plant', 'lamp', 'teddy', 'bookshelf',
  'stool', 'floor_lamp', 'toy_ball', 'pebbles', 'little_tree', 'lantern', 'fish_tank',
  'castle', 'mushroom_stool', 'easel', 'rocking_horse', 'watering_can', 'toy_blocks',
  'plant_cactus', 'plant_succulent', 'plant_flowers', 'plant_tall', 'plant_big_leaf',
  'plant_bonsai', 'tree_apple', 'tree_blossom', 'tree_pine', 'tree_willow',
  'birdhouse', 'mushrooms', 'garden_bench', 'flower_bed', 'wheelbarrow',
  'lamp_post', 'rope_swing', 'stepping_stones'];
const floating = STANDING.filter(id => !(art.svg[id] || '').includes(art.shadow));
ok('everything standing on the ground casts a shadow at its feet',
   floating.length === 0,
   floating.length ? `no shadow: ${floating.join(', ')}` : `${STANDING.length} pieces`);

/* ---------- the light comes from one direction ----------
   Every flat face is shaded along the same diagonal. One drawing lit from
   the other side is worse than none of them being lit at all. */
const L1 = 'x1="10%" y1="0%" x2="90%" y2="100%"';          // a face turned to the light
const GLOSS = 'x1="0%" y1="0%" x2="100%" y2="100%"';       // a reflection on glass or water
const wrongWay = art.ids.filter(id =>
  [...art.svg[id].matchAll(/<linearGradient([^>]*)>/g)]
    .some(g => !g[1].includes(L1) && !g[1].includes(GLOSS)));
ok('nothing is lit from the wrong side', wrongWay.length === 0,
   wrongWay.length ? wrongWay.slice(0, 4).join(', ') : 'all one light');

/* ---------- the floor is not the wall lying down ----------
   A room needs the dark band in the join between them, and the floor needs
   its rows to bunch up towards the back. Both are shared constants, so one
   surface of each kind proves the lot. */
const floor = art.surfaces.floor_wood.backgroundImage;
ok('the floor has a shadow in the join with the wall',
   /rgba\(70,\s*48,\s*28,\s*\.32\)\s*0%/.test(floor), 'join band present');
ok('the floorboards bunch up towards the back',
   (floor.match(/%\s*\d/g) || []).length > 8 && floor.includes('5.6%'),
   'perspective rows present');
ok('the wall is brighter at the top than at the bottom',
   /rgba\(255,255,255,\.17\) 0%/.test(art.surfaces.wall_plain.backgroundImage), 'falloff present');
ok('there is a pool of window light on the wall',
   art.surfaces.wall_plain.backgroundImage.includes('at 16% 2%'), 'light pool present');

/* ---------- the axolotl ----------
   It is the one thing she looks at every single day, and it is drawn twice:
   once for real and once small for the coat picker. The portrait went stale
   once already — it was still showing stalks with knobs on the end long
   after the animal had grown proper feathery gills — so this check is here
   to make sure the two never drift apart again. */
const pet = await page.evaluate(async () => {
  const m = await import('./js/ui/art.js');
  const { COATS, STAGES } = await import('./js/core/pet.js');
  return {
    animal: m.petSVG({ coat: COATS[0], stage: STAGES[2] }),
    stages: STAGES.map(st => m.petSVG({ coat: COATS[0], stage: st })),
    picker: COATS.map(c => m.petThumbSVG(c.key)),
  };
});

const strokes = t => (t.match(/stroke-linecap="round"/g) || []).length;
ok('the coat picker draws the animal\'s own gills, not its own pair',
   strokes(pet.picker[0]) > strokes(pet.animal) * 0.8,
   `portrait ${strokes(pet.picker[0])} strokes, animal ${strokes(pet.animal)}`);

ok('the axolotl sits on the ground rather than over it',
   pet.animal.includes(art.shadow), 'ground shadow present');

ok('the head throws a shadow onto the body',
   (pet.animal.match(new RegExp(art.shadow, 'g')) || []).length >= 2,
   'two shadows: the floor, and the body under the head');

const pickerIds = pet.picker.flatMap(t => [...t.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));
ok('four portraits side by side do not share a gradient',
   new Set(pickerIds).size === pickerIds.length,
   `${pickerIds.length} ids across ${pet.picker.length} portraits`);

/* Nothing a growth stage draws may go above the top of the picture, or it
   is silently cut off — which is what hats and gills both push against. */
const tops = await page.evaluate(async () => {
  const m = await import('./js/ui/art.js');
  const { COATS, STAGES } = await import('./js/core/pet.js');
  const out = [];
  for (const st of STAGES) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:-9999px;width:400px';
    d.innerHTML = m.petSVG({ coat: COATS[0], stage: st, alive: false });
    document.body.append(d);
    const svg = d.querySelector('svg');
    out.push({ key: st.key, top: svg.querySelector('.pet-gills').getBBox().y, vb: svg.viewBox.baseVal.y });
    d.remove();
  }
  return out;
});
const clipped = tops.filter(t => t.top < t.vb + 1);
ok('no growth stage has its gills cut off the top of the picture',
   clipped.length === 0,
   clipped.length ? clipped.map(t => t.key).join(', ')
                  : `closest: ${Math.min(...tops.map(t => t.top - t.vb)).toFixed(1)} units clear`);

/* ---------- and a picture of the shelf, to look at ---------- */
await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: `${SP}/depth-shop.png`, fullPage: false });

await browser.close();
const t = tally();
console.log(`\ndepth: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
