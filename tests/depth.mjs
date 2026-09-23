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

/* ---------- the long tail ----------
   Everything in the catalogue has to have been through the light, whether
   it was hand-shaded or run through shadeFills on the way out. There are no
   exceptions: the one drawing made entirely of strokes, the rainbow, has
   its depth drawn in by hand for exactly this reason. */
const unlit = art.ids.filter(id => !art.svg[id].includes('url(#'));
ok('every drawing in the catalogue has been through the light',
   unlit.length === 0,
   unlit.length ? unlit.join(', ') : `${art.ids.length} drawings`);

const worn = await page.evaluate(async () => {
  const m = await import('./js/ui/item-art.js');
  const items = await import('./js/core/items.js');
  const geom = { hx: 50, hy: 56, hrx: 30, hry: 24, bx: 50, by: 84, brx: 26, bry: 18 };
  const out = {};
  for (const it of items.CATALOG ?? []) {
    const s = m.wearableSVG(it.id, geom);
    if (s) out[it.id] = s;
  }
  return out;
});
const flatWorn = Object.entries(worn).filter(([, s]) => !s.includes('url(#')).map(([k]) => k);
ok('every hat and accessory is lit too',
   flatWorn.length === 0,
   flatWorn.length ? flatWorn.join(', ') : `${Object.keys(worn).length} wearables`);

/* A highlight is meant to be flat, and a gradient on a 3px pupil is mud. */
const shadeTest = await page.evaluate(async () => {
  const { shadeFills } = await import('./js/ui/shade.js');
  return shadeFills('<circle fill="#ffffff"/><rect fill="#3a2e28"/><path fill="#ef7f7f"/><path fill="none"/>');
});
ok('shading leaves white, near-black and unfilled shapes alone',
   shadeTest.includes('fill="#ffffff"') && shadeTest.includes('fill="#3a2e28"') &&
   shadeTest.includes('fill="none"') && !shadeTest.includes('fill="#ef7f7f"'),
   'only the mid-tone was given a gradient');

/* ---------- a recoloured copy is actually a different colour ----------
   Two keepsakes used to be built by string-replacing another drawing's hex
   codes. Reshading those drawings changed the codes, so the replaces
   matched nothing and both keepsakes silently kept the original colour with
   only their outline changed: a red lamp with a pink edge, a peach rug with
   a purple one. Nothing in the app noticed for a whole release. */
const fills = t => new Set((t.match(/stop-color="(#[0-9a-f]{6})"/gi) || []).map(x => x.toLowerCase()));
for (const [base, copy] of [['lamp', 'blossom_lamp'], ['rug', 'star_rug']]) {
  const a = fills(art.svg[base]), b = fills(art.svg[copy]);
  /* They legitimately share a stand or a backing, so the test is not that
     they have nothing in common — it is that the recolour actually landed
     on something. */
  const own = [...b].filter(c => !a.has(c));
  ok(`${copy} is really a different colour from ${base}`,
     own.length >= 2,
     `${own.length} of ${b.size} fills are its own`);
}

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

/* ---------- the surfaces are drawings now, not stacked gradients ----------
   The motifs are inline SVG tiles. Two things about that can break quietly:

   A surface's CSS is also written straight into a style="..." attribute,
   for the swatches in the shop and the collection book. One double quote
   anywhere in the value ends the attribute, and the pattern disappears
   while the plain colour underneath carries on looking fine — which is
   exactly what happened on the first cut of this.

   And a '#' inside a data URI ends the URL, so every colour in a tile has
   to be percent-encoded or the drawing is silently truncated. */
const surf = art.surfaces;
const unsafe = Object.entries(surf).filter(([, v]) =>
  Object.values(v).some(x => typeof x === 'string' && x.includes('"')));
ok('no surface can break out of a style attribute',
   unsafe.length === 0,
   unsafe.length ? unsafe.map(([k]) => k).join(', ') : `${Object.keys(surf).length} surfaces`);

const tiles = Object.entries(surf).flatMap(([id, v]) =>
  [...(v.backgroundImage || '').matchAll(/url\(data:image\/svg\+xml,([^)]*)\)/g)].map(m => [id, m[1]]));
ok('the surfaces are drawn, not stacked gradients',
   tiles.length >= 20, `${tiles.length} drawn tiles across the catalogue`);

const broken = tiles.filter(([, enc]) => {
  const svg = decodeURIComponent(enc);
  return !svg.startsWith('<svg') || !svg.endsWith('</svg>') || svg.includes('%23');
});
ok('every drawn tile decodes to a whole SVG',
   broken.length === 0,
   broken.length ? broken.map(([id]) => id).join(', ') : 'all decode');

/* Rendered, not just present: a tile that fails to parse leaves the layer
   blank and the surface looks like its plain background colour. */
const painted = await page.evaluate(async () => {
  const { SURFACES } = await import('./js/ui/item-art.js');
  const out = [];
  for (const [id, style] of Object.entries(SURFACES)) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:-9999px;width:120px;height:120px';
    Object.assign(d.style, style);
    document.body.append(d);
    out.push([id, getComputedStyle(d).backgroundImage.includes('data:image/svg+xml')]);
    d.remove();
  }
  return out;
});
const dropped = painted.filter(([id, ok_]) => !ok_ &&
  !['sky_night'].includes(id)).map(([id]) => id);
ok('the browser accepts every drawn tile',
   dropped.length === 0,
   dropped.length ? dropped.join(', ') : 'all accepted');

/* ---------- The game scenes ----------

   A CSS background with four images and three sizes is not an error: the
   browser cycles the short list and paints the wrong layer at the wrong
   size, silently. Every scene here lists its layers four times over, so
   the counts have to agree or the backdrop quietly comes out wrong. */
const scenes = await page.evaluate(async () => {
  const { sceneStyle } = await import('./js/ui/scenes.js');
  const { GAMES } = await import('./js/core/games.js');
  const names = [...new Set(GAMES.map(g => g.scene).filter(Boolean))];
  return names.map(name => {
    const st = sceneStyle(name);
    if (!st) return { name, missing: true };
    const count = (v, sep = ',') => String(v || '').split(sep).length;
    /* Split on commas outside brackets — gradients have commas inside. */
    const layers = v => {
      let depth = 0, n = 1;
      for (const ch of String(v || '')) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) n++;
      }
      return n;
    };
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:-9999px;width:300px;height:200px';
    Object.assign(d.style, st);
    document.body.append(d);
    const painted = getComputedStyle(d).backgroundImage;
    d.remove();
    return {
      name,
      images: layers(st.backgroundImage),
      sizes: layers(st.backgroundSize),
      positions: layers(st.backgroundPosition),
      repeats: layers(st.backgroundRepeat),
      drawn: (painted.match(/data:image\/svg\+xml/g) || []).length,
      accepted: painted !== 'none' && painted !== '',
    };
  });
});

ok('every game scene exists', scenes.every(s => !s.missing),
   scenes.filter(s => s.missing).map(s => s.name).join(', ') || scenes.map(s => s.name).join(', '));

const mismatched = scenes.filter(s => !s.missing &&
  !(s.images === s.sizes && s.images === s.positions && s.images === s.repeats));
ok('every scene lists a size, a position and a repeat for each layer',
   mismatched.length === 0,
   mismatched.length
     ? mismatched.map(s => `${s.name} ${s.images}/${s.sizes}/${s.positions}/${s.repeats}`).join(', ')
     : scenes.map(s => `${s.name} x${s.images}`).join(', '));

ok('the browser accepts every scene', scenes.every(s => s.missing || s.accepted),
   scenes.filter(s => !s.missing && !s.accepted).map(s => s.name).join(', ') || 'all accepted');

/* Each scene is meant to be a drawing, not a stack of blobs. A scene whose
   drawn tiles all failed to parse silently falls back to its gradients. */
const flat = scenes.filter(s => !s.missing && s.drawn === 0);
ok('every scene paints at least one drawn tile', flat.length === 0,
   flat.length ? flat.map(s => s.name).join(', ')
               : scenes.map(s => `${s.name} ${s.drawn}`).join(', '));

/* ---------- and a picture of the shelf, to look at ---------- */
await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: `${SP}/depth-shop.png`, fullPage: false });

await browser.close();
const t = tally();
console.log(`\ndepth: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
