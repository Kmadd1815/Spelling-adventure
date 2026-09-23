/* The shop, and the wall between buying and earning.

   The rule is structural rather than checked: a special item has no price
   field, and the shop is defined as "items that have a price", so there is
   nowhere to put a price on a milestone reward. This suite holds that wall
   up from both sides — nothing priceless on a shelf, nothing purchasable
   handed out as a prize — and then buys something and follows the stars.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1250 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')));

// Seed a set-up child with a healthy purse.
await page.goto(BASE);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion:1, child:{name:'Ellie',petCoat:'peach',petName:'Bubbles',setupComplete:true},
    progress:{ stars: 300 },
    lists:[{id:'l1',name:'W1',archived:false,createdAt:Date.now()}],
    words:['train','paint'].map((t,i)=>({id:'w'+i,listId:'l1',text:t,definition:'',sentence:'',hint:'',tags:[],
      attempts:0,correctCount:0,incorrectCount:0,streak:0,lastCreditDay:null,lastDailyDay:null,recent:[],
      firstSeen:null,lastSeen:null,lastCorrect:null,lastMissed:null,masteredAt:null,createdAt:Date.now()})),
  }));
});
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// ---- the hard rule, checked in the engine ----
const rule = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  const rw = await import('./js/core/rewards.js');
  const specials = it.specialItems();
  const leaked = it.shopItems().filter(i => i.price == null);
  const priced = specials.filter(i => i.price != null);
  // Try to award something purchasable as if it were a prize.
  const abuse = rw.grantSpecial('gold_crown', 'cheating');
  return { shop: it.shopItems().length, specials: specials.length,
           leaked: leaked.length, priced: priced.length,
           abuseBlocked: abuse === null, ownsCrown: it.owns('gold_crown') };
});
console.log('  ', JSON.stringify(rule));
ok('no priceless item can appear in the shop', rule.leaked === 0);
ok('no special item carries a price', rule.priced === 0);
ok('awarding a purchasable item as a prize is refused', rule.abuseBlocked && !rule.ownsCrown);

/* ---- one id is one item ----
   The Toadstools were in the catalogue twice, 50 stars for the garden and
   110 for indoors, under the same id. The last row of a duplicate pair wins
   every lookup, so BOTH shelves sold the indoor one: a pair bought from the
   garden shelf was filed as indoor furniture and could never be put out in
   the garden at all. Nothing in the app noticed for months. */
const ids = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  const art = await import('./js/ui/item-art.js');
  const seen = {}, dupes = [], undrawn = [];
  for (const i of it.CATALOG) {
    if (seen[i.id]) dupes.push(i.id); else seen[i.id] = true;
    const drawn = art.decorSVG(i.id) ||
      art.wearableSVG(i.id, { hx: 50, hy: 56, hrx: 30, hry: 24, bx: 50, by: 84, brx: 26, bry: 18 }) ||
      art.SURFACES[i.id];
    if (!drawn) undrawn.push(i.id);
  }
  /* Every item's slot has to be a slot the shop actually has a tab for, or
     it is on sale somewhere she can never reach. */
  const tabbed = new Set(it.SHOP_TABS.flatMap(t => t.slots));
  const homeless = it.shopItems().filter(i => !tabbed.has(i.category)).map(i => i.id);
  return { total: it.CATALOG.length, dupes, undrawn, homeless };
});
ok('no item is in the catalogue twice', ids.dupes.length === 0,
   ids.dupes.length ? ids.dupes.join(', ') : `${ids.total} ids, all different`);
ok('every item in the catalogue can actually be drawn', ids.undrawn.length === 0,
   ids.undrawn.length ? ids.undrawn.join(', ') : `${ids.total} drawings`);
ok('every item on sale has a tab to be sold on', ids.homeless.length === 0,
   ids.homeless.length ? ids.homeless.join(', ') : 'all reachable');

/* ---- and the save of anyone who owned the broken one ---- */
const split = await page.evaluate(async () => {
  const raw = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
  const before = JSON.parse(JSON.stringify(raw));
  before.collection = { items: [{ id: 'o1', itemId: 'mushrooms', source: 'Bought in the shop', earnedAt: Date.now() }] };
  before.equipped = { ...(before.equipped || {}), floorDecor: ['mushrooms'] };
  localStorage.setItem('spelling-adventure:v1', JSON.stringify(before));
  const s = await import('./js/core/storage.js');
  const after = s.load();
  return {
    owns: (after.collection.items || []).map(r => r.itemId),
    floor: after.equipped.floorDecor,
  };
});
ok('a save with the old Toadstools keeps them and gains the indoor pair',
   split.owns.includes('mushrooms') && split.owns.includes('toadstool_cluster'),
   split.owns.join(', '));
ok('...and the pair she had standing on the floor stays on the floor',
   split.floor.includes('toadstool_cluster') && !split.floor.includes('mushrooms'),
   `floor: ${split.floor.join(', ') || '(empty)'}`);

// ---- shop UI ----
await page.click('.hub-tile:has-text("Shop")'); await page.waitForTimeout(600);
ok('shop opens', await page.locator('.shop-card').count() > 0);
await page.screenshot({ path: SP + '/S1-shop.png', fullPage: true });

const affordable = await page.locator('.shop-card:not(.cant-afford):not(.owned)').count();
console.log('   hats in reach with 300 stars:', affordable);

// Buy a hat she can afford.
await page.click('.shop-card:has-text("Wizard Hat")'); await page.waitForTimeout(500);
await page.click('.modal button:has-text("Buy for")'); await page.waitForTimeout(800);
ok('purchase confirmed with a celebration', await page.locator('text=It’s yours!').count() === 1);
await page.screenshot({ path: SP + '/S2-bought.png' });
const afterBuy = await save();
ok('stars deducted (300 - 190 = 110)', afterBuy.progress.stars === 110);
ok('item is in her collection', afterBuy.collection.items.some(r => r.itemId === 'wizard_hat'));
ok('the source is recorded', afterBuy.collection.items.find(r => r.itemId === 'wizard_hat').source === 'Bought in the shop');

// Wear it.
await page.click('.modal button:has-text("Wear it now")'); await page.waitForTimeout(800);
ok('wearing it takes her to the pet screen', page.url().includes('/pet'));
ok('the hat is equipped', (await save()).equipped.hat === 'wizard_hat');
/* This used to look for the wizard hat's purple by its hex code, and the
   shading pass broke it: a flat fill became a gradient between a lighter
   and a darker version of that purple, so the exact code was nowhere in the
   markup even though the hat was drawn perfectly. Asking whether wearing it
   ADDS a hat's worth of drawing tests the same thing without caring how the
   hat is coloured. */
const petSvg = await page.locator('.room-pet svg').innerHTML();
const drawn = await page.evaluate(async () => {
  const { petSVG } = await import('./js/ui/art.js');
  const { coatByKey, STAGES } = await import('./js/core/pet.js');
  const opts = { coat: coatByKey('peach'), stage: STAGES[0], alive: false };
  return { without: petSVG(opts).length, worn: petSVG({ ...opts, hat: 'wizard_hat' }).length };
});
ok('the hat is actually drawn on the axolotl',
   petSvg.length > 0 && drawn.worn > drawn.without + 200,
   `wearing it adds ${drawn.worn - drawn.without} characters of drawing`);
await page.screenshot({ path: SP + '/S3-wearing.png', fullPage: true });

// ---- can't afford ----
await page.goto(BASE + '#/shop', { waitUntil: 'networkidle' }); await page.waitForTimeout(600);
await page.click('.shop-card:has-text("Golden Crown")'); await page.waitForTimeout(500);
const shortfall = await page.locator('.modal').innerText();
ok('not-affordable shows how far to go, kindly', /more to go/.test(shortfall));
console.log('   message:', shortfall.split('\n').filter(Boolean).slice(-2)[0]);
await page.screenshot({ path: SP + '/S4-saving.png' });
await page.click('.modal button:has-text("Keep saving")'); await page.waitForTimeout(400);
ok('no stars were spent', (await save()).progress.stars === 110);

// ---- scene slots ----
const FLOOR_IDS = ['pebbles','toy_ball','potted_plant','lamp','teddy','bookshelf','stool'];
const sceneTest = await page.evaluate(async ids => {
  const it = await import('./js/core/items.js');
  ids.forEach(id => it.grant(id, 'test'));
  /* From an empty floor: equipping something already out quietly succeeds
     without adding, so leftovers make the count come up short. */
  it.inSlot('floorDecor').forEach(id => it.unequip(id));
  const results = ids.map(id => it.equip(id));
  return { placed: it.inSlot('floorDecor').length, over: results[6] };
}, FLOOR_IDS);
ok(`only ${sceneTest.placed} floor decorations can be out at once`, sceneTest.placed === 6);
ok('the seventh is refused with a reason', sceneTest.over.reason === 'full',
   JSON.stringify(sceneTest.over));

await page.goto(BASE + '#/', { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
/* Everything except the window she was given at the start — that one is
   always there, because indoors it is the only way the weather shows. */
ok('decorations appear in the room',
   await page.locator('.room-piece:not(.room-window)').count() === 6,
   `${await page.locator('.room-piece:not(.room-window)').count()} pieces besides the window`);
ok('...and she has a window whether or not she has bought one',
   await page.locator('.room-window').count() === 1);
await page.screenshot({ path: SP + '/S5-scene.png' });

// ---- collection book ----
await page.goto(BASE + '#/progress?tab=collection', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
ok('book shows owned items', await page.locator('.book-cell:not(.locked)').count() >= 5);
ok('book shows locked silhouettes', await page.locator('.book-cell.locked').count() > 20);
await page.screenshot({ path: SP + '/S6-book.png', fullPage: true });

await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
