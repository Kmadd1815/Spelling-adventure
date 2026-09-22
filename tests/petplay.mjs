/* The pet cannot be neglected.

   Deliberately not a Tamagotchi. There is no hunger, no decay and no
   guilt: leave it a month and it is exactly as pleased to see her. What is
   checked here is mostly the ABSENCE of things — no sad face with an empty
   treat jar, nothing on screen that says hungry or lonely — because that
   is the kind of thing that gets added by accident.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1400 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('spelling-adventure:v1')));

await page.goto(BASE);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('spelling-adventure:v1', JSON.stringify({
  schemaVersion:1, child:{name:'Ellie',petCoat:'peach',petName:'Bubbles',setupComplete:true},
  progress:{ stars: 0, treats: 0, petMoments: 0 }, lists:[], words:[] })); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// ---- no guilt: zero treats must change nothing about the pet ----
await page.goto(BASE + '#/pet', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const zero = await page.evaluate(() => ({
  mood: document.querySelector('.room-pet svg')?.dataset.mood,
  copy: document.querySelector('#screen').innerText,
}));
ok('with zero treats the pet is still calm, not sad', zero.mood === 'calm');
ok('nothing on screen says hungry / sad / lonely / neglect',
   !/hungry|sad|lonely|neglect|misses you|needs you/i.test(zero.copy));
ok('both free interactions are still offered',
   await page.locator('.play-btn:not([disabled])').count() === 2);
ok('the three treat-only ones are quietly unavailable',
   await page.locator('.play-btn[disabled]').count() === 3);
await page.screenshot({ path: SP + '/P1-no-treats.png', fullPage: true });

// ---- free interaction works with no treats ----
await page.click('.play-btn:has-text("Splash")');
await page.waitForTimeout(500);
ok('splashing works with an empty treat jar',
   await page.evaluate(() => document.querySelector('.room-pet svg')?.dataset.mood) === 'happy');
ok('bubbles appear', await page.locator('.fx').count() > 0);
ok('the moment was counted', (await save()).progress.petMoments === 1);
await page.screenshot({ path: SP + '/P2-splash.png' });

// ---- tapping the pet directly ----
await page.waitForTimeout(2200);
await page.click('.room-pet');
await page.waitForTimeout(400);
ok('tapping the axolotl makes it happy',
   await page.evaluate(() => document.querySelector('.room-pet svg')?.dataset.mood) === 'love');
ok('hearts float up', await page.locator('.fx').count() > 0);
ok('the pet said something', (await page.locator('.room-speech').textContent()).length > 3);
console.log('   it said:', await page.locator('.room-speech').textContent());
await page.screenshot({ path: SP + '/P3-petting.png' });

// ---- treats come from spelling ----
const earned = await page.evaluate(async () => {
  const p = await import('./js/core/pet.js');
  p.earnTreats(5, 'test');
  return p.treats();
});
ok(`spelling earns treats (${earned})`, earned === 5);

await page.goto(BASE + '#/', { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
await page.goto(BASE + '#/pet', { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
ok('all five interactions now available',
   await page.locator('.play-btn:not([disabled])').count() === 5);

await page.click('.play-btn:has-text("Feed")');
await page.waitForTimeout(500);
ok('feeding switches to the munching face',
   await page.evaluate(() => document.querySelector('.room-pet svg')?.dataset.mood) === 'munch');
ok('a treat was spent (5 -> 4)', (await save()).progress.treats === 4);
await page.screenshot({ path: SP + '/P4-feeding.png' });

await page.waitForTimeout(2400);
await page.click('.play-btn:has-text("Cuddle")');
await page.waitForTimeout(500);
ok('cuddling gives the closed happy eyes',
   await page.evaluate(() => document.querySelector('.room-pet svg')?.dataset.mood) === 'love');
await page.screenshot({ path: SP + '/P5-cuddle.png' });

// ---- idle life ----
await page.waitForTimeout(2500);
const idle = await page.evaluate(() => {
  const svg = document.querySelector('.room-pet svg');
  const g = svg.querySelector('.pet-breathe');
  const gills = svg.querySelector('.pet-gills');
  return { alive: svg.classList.contains('pet-alive'),
           breathing: getComputedStyle(g).animationName,
           gills: getComputedStyle(gills).animationName,
           blinks: !!svg.querySelector('.pet-eye-shut') };
});
console.log('  ', JSON.stringify(idle));
ok('it breathes on its own', idle.breathing === 'petBreathe');
ok('its gills drift', idle.gills === 'gillSway');
ok('it blinks', idle.blinks);

ok('played-together tally is shown',
   /played together \d+ times/i.test(await page.locator('#screen').innerText()));

await browser.close();
console.log('\n--- PAGE ERRORS ---');
console.log(errors.length ? [...new Set(errors)].join('\n') : 'none');
