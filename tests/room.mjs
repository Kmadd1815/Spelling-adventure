/* The room, and the save file it grew out of.

   Half of this is the migration: the scene used to be one flat list of
   three things, and an old save has to become a room with slots without
   losing anything she had out. That path runs exactly once per tablet, so
   it has to be right the first time and there is no second chance to test
   it on her actual save.

   The rest is the slot limits — two things on the walls, three on the
   floor — being visible rather than discovered by being refused.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 860, height: 1500 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')));

// ---- an OLD save, in the previous flat-scene format ----
await page.goto(BASE);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('spelling-adventure:v1', JSON.stringify({
  schemaVersion:1, child:{name:'Ellie',petCoat:'peach',petName:'Bubbles',setupComplete:true},
  progress:{ stars: 4000, treats: 3 }, lists:[], words:[],
  collection:{items:[
    {id:'a',itemId:'rug',source:'Bought in the shop',earnedAt:1},
    {id:'b',itemId:'lantern',source:'Bought in the shop',earnedAt:1},
    {id:'c',itemId:'teddy',source:'Bought in the shop',earnedAt:1}]},
  equipped:{ hat:null, accessory:null, scene:['rug','lantern','teddy'] } })); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const migrated = await page.evaluate(async () =>
  (await import('./js/core/state.js')).getState().equipped);
console.log('   migrated:', JSON.stringify(migrated));
ok('the old flat scene sorted itself into slots',
   migrated.rug === 'rug' && migrated.wallDecor.includes('lantern') && migrated.floorDecor.includes('teddy'));
ok('a wall and a floor were assumed', !!migrated.wallpaper && !!migrated.flooring);
ok('the old scene list is gone', migrated.scene === undefined);

// ---- starters ----
const starters = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  return { owned: it.starterItems().every(i => it.owns(i.id)),
           inShop: it.shopItems().some(i => i.price === 0),
           shopCount: it.shopItems().length };
});
ok('starter wallpaper and floor are owned from the beginning', starters.owned);
ok('and are not sold in the shop', !starters.inShop);
console.log('   shop sells', starters.shopCount, 'items');

// ---- the room renders ----
ok('home shows a room', await page.locator('.room').count() === 1);
ok('with a wall and a floor',
   await page.locator('.room-wall').count() === 1 && await page.locator('.room-floor').count() === 1);
await page.screenshot({ path: SP + '/D1-home-room.png' });

// ---- slot limits ----
const limits = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  const WALL  = ['frame','clock','bunting','lantern'];              // one too many
  const FLOOR = ['pebbles','toy_ball','potted_plant','lamp','teddy','bookshelf','stool'];
  [...WALL, ...FLOOR, 'window_arch','door_fancy','bed_cozy','wall_stars','floor_pond']
    .forEach(id => it.grant(id, 'test'));
  /* Start from an empty wall and an empty floor: equipping something that
     is already out is a no-op that quietly returns ok, so anything left
     over from the seed makes the count come out one short. */
  it.inSlot('wallDecor').forEach(id => it.unequip(id));
  it.inSlot('floorDecor').forEach(id => it.unequip(id));
  const wall = WALL.map(id => it.equip(id));
  const floor = FLOOR.map(id => it.equip(id));
  ['window_arch','door_fancy','bed_cozy','wall_stars','floor_pond'].forEach(id => it.equip(id));
  return {
    wallOut: it.inSlot('wallDecor').length, wallOver: wall[3],
    floorOut: it.inSlot('floorDecor').length, floorOver: floor[6],
    usage: Object.fromEntries(Object.keys(it.SLOTS).map(s => [s, it.slotUsage(s)])),
  };
});
ok('exactly 3 wall decorations fit', limits.wallOut === 3, `${limits.wallOut} out`);
ok('the fourth is refused', limits.wallOver.reason === 'full', JSON.stringify(limits.wallOver));
ok('exactly 6 floor decorations fit', limits.floorOut === 6, `${limits.floorOut} out`);
ok('the seventh is refused', limits.floorOver.reason === 'full');
ok('one rug, one bed, one window, one door', ['rug','bed','window','door'].every(s => limits.usage[s].max === 1));

// ---- swapping a single slot replaces rather than refuses ----
const swap = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  it.grant('rug_round', 'test');
  const before = it.inSlot('rug')[0];
  const r = it.equip('rug_round');
  return { before, after: it.inSlot('rug')[0], ok: r.ok, count: it.inSlot('rug').length };
});
ok('choosing a second rug swaps it in', swap.ok && swap.after === 'rug_round' && swap.count === 1);

// ---- the decorate screen ----
await page.goto(BASE + '#/decorate', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
ok('decorate screen shows every slot',
   await page.locator('.slot-row').count() === 8);
const counts = await page.locator('.slot-count').allTextContents();
console.log('   slot labels:', counts.join(' | '));
ok('multi slots say how many are out',
   counts.some(t => /3 of 3 out/.test(t)) && counts.some(t => /6 of 6 out/.test(t)),
   counts.join(' | '));
await page.screenshot({ path: SP + '/D2-decorate.png', fullPage: true });

// ---- placement: things are off to the sides, not ringing the pet ----
/* The axolotl walks about the room now, so "clear of the pet" is neither
   true nor something to want — it passes in front of the back row and
   behind the front corners, which is what depth is for. What still has to
   hold is that nothing is drawn ON TOP of it where it lives: a decoration
   over its face is a bug, a decoration it strolls behind is the room. */
const layout = await page.evaluate(() => {
  const room = document.querySelector('.room').getBoundingClientRect();
  const petNode = document.querySelector('.room-pet');
  const pct = r => ({ l: (r.left - room.left) / room.width * 100,
                      r: (r.right - room.left) / room.width * 100,
                      t: (r.top - room.top) / room.height * 100,
                      b: (r.bottom - room.top) / room.height * 100 });
  const z = n => Number(getComputedStyle(n).zIndex) || 0;
  return {
    pet: { ...pct(petNode.getBoundingClientRect()), z: z(petNode) },
    pieces: [...document.querySelectorAll('.room-piece')]
      .map(p => ({ ...pct(p.getBoundingClientRect()), z: z(p) })),
  };
});
console.log('   pet spans', layout.pet.l.toFixed(0) + '%-' + layout.pet.r.toFixed(0) + '%');
const over = layout.pieces.filter(p => p.z > layout.pet.z
  && Math.min(p.r, layout.pet.r) - Math.max(p.l, layout.pet.l) > 1
  && Math.min(p.b, layout.pet.b) - Math.max(p.t, layout.pet.t) > 1);
ok('nothing is drawn over the top of the axolotl', over.length === 0,
   over.map(p => `${p.l.toFixed(0)}–${p.r.toFixed(0)}%`).join(', ') || 'its face is clear');

await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: SP + '/D3-decorated-home.png' });

/* ---- a picture cannot end up on the floorboards ----

   She has no way to do this: equipping reads the slot off the item itself.
   But the room draws whatever the SAVE says is in a slot, and a save can
   come from a backup, an older version, or a half-finished write. */
await page.waitForTimeout(450);        // let the app's own save settle first
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
  raw.equipped.floorDecor = ['frame', 'clock'];       // both belong on the wall
  raw.equipped.wallDecor  = ['potted_plant'];         // and this belongs on the floor
  raw.equipped.rug = 'frame';
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(raw));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const filed = await page.evaluate(async () => {
  const it = await import('/js/core/items.js');
  const e = it.equipped();
  return { floor: e.floorDecor, wall: e.wallDecor, rug: e.rug,
           pieces: document.querySelectorAll('.room .room-piece').length };
});
ok('a wall thing written into the floor slot is not put on the floor',
   filed.floor.length === 0, JSON.stringify(filed.floor));
ok('...and a floor thing written onto the wall is not hung up',
   filed.wall.length === 0, JSON.stringify(filed.wall));
ok('...and a picture in the rug slot is not laid down as a rug',
   filed.rug === null, JSON.stringify(filed.rug));


await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
