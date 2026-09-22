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
const petSvg = await page.locator('.room-pet svg').innerHTML();
ok('the hat is actually drawn on the axolotl', petSvg.includes('6b5aa6'));
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
const sceneTest = await page.evaluate(async () => {
  const it = await import('./js/core/items.js');
  ['pebbles','toy_ball','potted_plant','lamp'].forEach(id => it.grant(id, 'test'));
  const results = ['pebbles','toy_ball','potted_plant','lamp'].map(id => it.equip(id));
  return { placed: it.inSlot('floorDecor').length, fourth: results[3] };
});
ok(`only ${sceneTest.placed} floor decorations can be out at once`, sceneTest.placed === 3);
ok('the fourth is refused with a reason', sceneTest.fourth.reason === 'full');

await page.goto(BASE + '#/', { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
/* Everything except the window she was given at the start — that one is
   always there, because indoors it is the only way the weather shows. */
ok('decorations appear in the room',
   await page.locator('.room-piece:not(.room-window)').count() === 3);
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
