/* Reactions, and the bug they keep causing.

   Every celebration in the app animates the axolotl, and every one of them
   used to make it leap sideways: the effect set its own transform, which
   wiped out the one holding it in place. The rule now is that an animation
   owns the transform completely and position is done with `left`.

   So this suite watches the axolotl's actual screen position through every
   reaction, and checks the bursts come out of the pet rather than out of
   the top-left corner.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 860, height: 1500 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(BASE);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('spelling-adventure:v1', JSON.stringify({
  schemaVersion:1, child:{name:'Ellie',petCoat:'peach',petName:'Bubbles',setupComplete:true},
  progress:{ stars: 0, treats: 20, petMoments: 0 }, lists:[], words:[] })); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const petBox = async () => page.evaluate(() => {
  const r = document.querySelector('.room').getBoundingClientRect();
  const p = document.querySelector('.room-pet').getBoundingClientRect();
  return { left: +(((p.left - r.left) / r.width) * 100).toFixed(1),
           mid:  +((((p.left + p.width / 2) - r.left) / r.width) * 100).toFixed(2),
           foot: +((((p.top + p.height) - r.top) / r.height) * 100).toFixed(2),
           top:  +(((p.top  - r.top ) / r.height) * 100).toFixed(1),
           w: +((p.width / r.width) * 100).toFixed(1),
           h: +((p.height / r.height) * 100).toFixed(1) };
});

// Where the particles are, relative to the pet's own box.
const fxVsPet = async () => page.evaluate(() => {
  const p = document.querySelector('.room-pet').getBoundingClientRect();
  const fx = [...document.querySelectorAll('.fx')];
  if (!fx.length) return null;
  const boxes = fx.map(f => f.getBoundingClientRect());
  const cx = boxes.reduce((a, b) => a + b.left + b.width / 2, 0) / boxes.length;
  const cy = boxes.reduce((a, b) => a + b.top + b.height / 2, 0) / boxes.length;
  return {
    count: fx.length,
    // 0 = pet's top, 1 = pet's bottom. Negative means above the creature.
    yInPet: +(((cy - p.top) / p.height)).toFixed(2),
    xOffsetPetWidths: +(((cx - (p.left + p.width / 2)) / p.width)).toFixed(2),
  };
});

// ---------- 1. the sideways jump ----------
await page.goto(BASE + '#/pet', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const before = await petBox();
console.log('   pet at rest:', JSON.stringify(before));

await page.click('.play-btn:has-text("Pet")');
await page.waitForTimeout(160);                 // mid-hop
const during = await petBox();
console.log('   pet mid-hop: ', JSON.stringify(during));
ok('the axolotl stays put horizontally while reacting',
   Math.abs(during.mid - before.mid) < 0.5);
ok('it does hop upward', during.top < before.top - 0.3);
await page.screenshot({ path: SP + '/F1-hop.png' });

// ---------- 2. effects land on the pet, not the wall ----------
const petFx = await fxVsPet();
console.log('   pet effect:', JSON.stringify(petFx));
ok('hearts come out of the axolotl, not high above it',
   petFx && petFx.yInPet > -0.25 && petFx.yInPet < 0.9);
ok('and are centred on it horizontally', Math.abs(petFx.xOffsetPetWidths) < 0.45);

// ---------- 3. every interaction ----------
const INTERACTIONS = [
  ['Splash', 'happy',   'bubbles'],
  ['Feed',   'munch',   'crumbs'],
  ['Play',   'excited', 'sparkles'],
  ['Cuddle', 'love',    'hearts'],
];
for (const [label, mood] of INTERACTIONS) {
  await page.waitForTimeout(2600);              // let the mood settle back
  await page.goto(BASE + '#/pet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const rest = await petBox();
  await page.click(`.play-btn:has-text("${label}")`);
  await page.waitForTimeout(170);
  const mid = await petBox();
  const fx = await fxVsPet();
  const gotMood = await page.evaluate(() => document.querySelector('.room-pet svg')?.dataset.mood);
  const said = (await page.locator('.room-speech').textContent()).trim();
  console.log(`   ${label.padEnd(7)} mood=${String(gotMood).padEnd(8)} drift=${(mid.mid - rest.mid).toFixed(2)}% ` +
              `fx=${fx ? fx.count : 0} y=${fx ? fx.yInPet : '-'}  "${said}"`);
  ok(`${label}: correct face`, gotMood === mood);
  ok(`${label}: no sideways jump`, Math.abs(mid.mid - rest.mid) < 0.5);
  ok(`${label}: effects appear on the axolotl`,
     fx && fx.count > 0 && fx.yInPet > -0.25 && fx.yInPet < 1.1);
  await page.screenshot({ path: SP + `/F-${label.toLowerCase()}.png` });
}

// ---------- 4. same on the home screen ----------
await page.waitForTimeout(2600);
await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const homeRest = await petBox();
await page.click('.room-pet');
await page.waitForTimeout(170);
const homeMid = await petBox();
const homeFx = await fxVsPet();
ok('home screen: no sideways jump either', Math.abs(homeMid.mid - homeRest.mid) < 0.5);
ok('home screen: effects on the axolotl',
   homeFx && homeFx.yInPet > -0.25 && homeFx.yInPet < 1.1);
await page.screenshot({ path: SP + '/F2-home.png' });

await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
