/* A milestone, and what it hands her.

   Short, but it covers the seam between three systems: the milestone
   fires once, its keepsake lands in her collection with the milestone
   recorded as where it came from, and that keepsake can be worn but can
   never turn up in the shop.
*/

import { chromium, BASE, ok } from './lib/harness.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(BASE);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('spelling-adventure:v1', JSON.stringify({
  schemaVersion:1, child:{name:'E',petCoat:'peach',petName:'B',setupComplete:true},
  settings:{masteryThreshold:1}, progress:{stars:0},
  lists:[{id:'l1',name:'W1',archived:false,createdAt:Date.now()}],
  words:[{id:'w1',listId:'l1',text:'train',definition:'',sentence:'',hint:'',tags:[],
    attempts:0,correctCount:0,incorrectCount:0,streak:0,lastCreditDay:null,lastDailyDay:null,recent:[],
    firstSeen:null,lastSeen:null,lastCorrect:null,lastMissed:null,masteredAt:null,createdAt:Date.now()}] })); });
await p.goto(BASE, { waitUntil:'networkidle' });
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const r = await p.evaluate(async () => {
  const w = await import('./js/core/words.js');
  const rw = await import('./js/core/rewards.js');
  const it = await import('./js/core/items.js');
  w.recordAttempt('w1', true);
  const earned = rw.checkMilestones();
  const charm = it.byId('sprout_charm');
  return { milestones: earned.map(m => m.id),
           ownsCharm: it.owns('sprout_charm'),
           source: it.sourceOf('sprout_charm'),
           charmHasNoPrice: charm.price === null,
           inShop: it.shopItems().some(i => i.id === 'sprout_charm'),
           equippable: it.equip('sprout_charm').ok };
});
console.log('  ' + JSON.stringify(r));
ok('milestone fired', r.milestones.includes('first_word'));
ok('its item landed in the collection', r.ownsCharm);
ok('with the milestone recorded as its source', r.source === 'First Word Mastered');
ok('the earned item has no price', r.charmHasNoPrice);
ok('and never appears in the shop', !r.inShop);
ok('but she can still wear it', r.equippable);
await b.close();
console.log('  page errors:', errs.length ? errs.join('; ') : 'none');
