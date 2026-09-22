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
  ['frame','clock','bunting','pebbles','toy_ball','potted_plant','lamp',
   'window_arch','door_fancy','bed_cozy','wall_stars','floor_pond'].forEach(id => it.grant(id, 'test'));
  const wall = ['frame','clock','bunting'].map(id => it.equip(id));
  const floor = ['pebbles','toy_ball','potted_plant','lamp'].map(id => it.equip(id));
  ['window_arch','door_fancy','bed_cozy','wall_stars','floor_pond'].forEach(id => it.equip(id));
  return {
    wallOut: it.inSlot('wallDecor').length, wallThird: wall[2],
    floorOut: it.inSlot('floorDecor').length, floorFourth: floor[3],
    usage: Object.fromEntries(Object.keys(it.SLOTS).map(s => [s, it.slotUsage(s)])),
  };
});
ok('exactly 2 wall decorations fit', limits.wallOut === 2);
ok('the third is refused', limits.wallThird.reason === 'full');
ok('exactly 3 floor decorations fit', limits.floorOut === 3);
ok('the fourth is refused', limits.floorFourth.reason === 'full');
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
ok('multi slots say how many are out', counts.some(t => /2 of 2 out/.test(t)) && counts.some(t => /3 of 3 out/.test(t)));
await page.screenshot({ path: SP + '/D2-decorate.png', fullPage: true });

// ---- placement: things are off to the sides, not ringing the pet ----
const layout = await page.evaluate(() => {
  const room = document.querySelector('.room').getBoundingClientRect();
  const pet = document.querySelector('.room-pet').getBoundingClientRect();
  const pct = r => ({ l: Math.round((r.left - room.left) / room.width * 100),
                      r: Math.round((r.right - room.left) / room.width * 100),
                      t: Math.round((r.top - room.top) / room.height * 100) });
  return { pet: pct(pet),
           pieces: [...document.querySelectorAll('.room-piece')].map(p => pct(p.getBoundingClientRect())) };
});
const petMid = (layout.pet.l + layout.pet.r) / 2;
console.log('   pet spans', layout.pet.l + '%-' + layout.pet.r + '%');
ok('nothing is sitting on top of the axolotl',
   layout.pieces.every(p => p.r <= layout.pet.l + 4 || p.l >= layout.pet.r - 4 || p.t < 40));

await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: SP + '/D3-decorated-home.png' });

await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
