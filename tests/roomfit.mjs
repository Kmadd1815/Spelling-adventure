/* How the room fits together.

   Everything here is geometry that renders without error and still looks
   wrong: a door hanging in mid-air, a plant standing in the doorway, a
   decoration drawn behind the rug, a pane of sky wider than the window it
   is supposed to be inside. None of it throws, so none of it shows up in
   any other suite. */

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const browser = await chromium.launch();
const errs = [];

const HORIZON = 56;   // where the wall meets the floor, in room %

const SEED = window_ => {
  const now = Date.now();
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: ['train', 'paint', 'afraid'].map((text, i) => ({ id: 'w' + i, listId: 'l1', text,
      definition: '', sentence: '', hint: '', tags: [], attempts: 0, correctCount: 0,
      incorrectCount: 0, streak: 0, lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: null, lastSeen: null, lastCorrect: null, lastMissed: null,
      masteredAt: null, createdAt: now })),
    progress: { stars: 900, lastBackupAt: now, lastBackupMastered: 0 },
    equipped: { wallpaper: 'wall_plain', flooring: 'floor_wood', window: window_,
      door: 'door_wood', bed: 'bed_cozy', rug: 'rug', hat: null, accessory: null,
      wallDecor: ['frame'], floorDecor: ['potted_plant'] },
    collection: { items: [window_, 'door_wood', 'bed_cozy', 'rug', 'frame', 'potted_plant']
      .map((id, i) => ({ id: 'o' + i, itemId: id, source: 'test', earnedAt: now })) } }));
};

/* A shadow is not part of the thing that throws it. The door correctly drops
   one onto the floor IN FRONT of it, so measuring the whole drawing would
   report that the door has sunk through the floorboards. Everything that is
   a shadow carries the class ui/item-art.js gives it, so it can be left out.

   This is installed into the page rather than passed to one evaluate,
   because two checks below need it and a helper defined inside an evaluate
   does not exist for the next one. */
const INK_BOX = () => {
  window.inkBox = svg => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of svg.querySelectorAll('*')) {
      if (!el.getBBox || el.closest('defs') || el.classList.contains('ia-shadow')) continue;
      let r; try { r = el.getBBox(); } catch { continue; }
      if (!r.width && !r.height) continue;
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
      x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };
};

/* The box a piece's INK actually occupies, in room percentages. A piece's
   node is its whole square; most of that square is empty space around the
   drawing, which is why placing things by their nodes is what let the door
   float in the first place. */
function INK(sel) {
  const room = document.querySelector('.room');
  const R = room.getBoundingClientRect();
  return [...room.querySelectorAll(sel)].map(n => {
    const svg = n.querySelector('svg');
    if (!svg || !svg.getBBox) return null;
    const g = window.inkBox(svg), b = n.getBoundingClientRect();
    if (!g) return null;
    return {
      id: n.dataset.what || '',
      l: 100 * (b.left + b.width * (g.x / 100) - R.left) / R.width,
      r: 100 * (b.left + b.width * ((g.x + g.width) / 100) - R.left) / R.width,
      t: 100 * (b.top + b.height * (g.y / 100) - R.top) / R.height,
      b: 100 * (b.top + b.height * ((g.y + g.height) / 100) - R.top) / R.height,
    };
  }).filter(Boolean);
}

const overlap = (a, b) =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) > 0.4 &&
  Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)) > 0.4;

const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(INK_BOX);
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(SEED, 'window_cottage');
await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

/* ---------- the door stands on the floor ---------- */
const pieces = await page.evaluate(INK, '.room-piece');
const byOrder = pieces;                       // window, door, wallDecor, bed, rug, floorDecor
const door  = byOrder[1];
const rug   = byOrder.find(p => p.b > 85);    // the rug is the piece nearest the front
const plant = byOrder[byOrder.length - 1];

ok('the door stands on the floor, not above it',
   Math.abs(door.b - HORIZON) < 1,
   `door base at ${door.b.toFixed(1)}%, the join is at ${HORIZON}%`);

ok('the door is still a door, not a hatch',
   door.t < HORIZON - 15 && door.r < 99,
   `top ${door.t.toFixed(1)}%, right edge ${door.r.toFixed(1)}%`);

/* ---------- nothing stands in the doorway ---------- */
ok('nothing on the floor is drawn over the door',
   !overlap(plant, door),
   `plant ${plant.l.toFixed(1)}–${plant.r.toFixed(1)}%, door ${door.l.toFixed(1)}–${door.r.toFixed(1)}%`);

/* ---------- and nothing is lost behind the rug ---------- */
ok('the back-right decoration is not hidden behind the rug',
   !overlap(plant, rug),
   `plant ${plant.l.toFixed(1)}–${plant.r.toFixed(1)}%, rug ${rug.l.toFixed(1)}–${rug.r.toFixed(1)}%`);

/* ---------- every window's pane is inside its own window ---------- */
const WINDOWS = ['window_plain', 'window_round', 'window_cottage',
                 'window_arch', 'window_flower', 'window_star'];
const shots = [];
for (const id of WINDOWS) {
  await page.evaluate(SEED, id);
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(450);

  const fit = await page.evaluate(() => {
    const room = document.querySelector('.room');
    const R = room.getBoundingClientRect();
    const node = document.querySelector('.room-window');
    const svg = node.querySelector('svg'), g = window.inkBox(svg);
    const nb = node.getBoundingClientRect();
    const pct = (px, along) => along === 'x'
      ? 100 * (px - R.left) / R.width : 100 * (px - R.top) / R.height;
    const ink = {
      l: pct(nb.left + nb.width * (g.x / 100), 'x'),
      r: pct(nb.left + nb.width * ((g.x + g.width) / 100), 'x'),
      t: pct(nb.top + nb.height * (g.y / 100), 'y'),
      b: pct(nb.top + nb.height * ((g.y + g.height) / 100), 'y'),
    };
    const w = document.querySelector('.room-window .room-weather').getBoundingClientRect();
    const pane = { l: pct(w.left, 'x'), r: pct(w.right, 'x'),
                   t: pct(w.top, 'y'),  b: pct(w.bottom, 'y') };
    return { ink, pane, clip: getComputedStyle(document.querySelector('.room-view')).clipPath,
             pieces: document.querySelectorAll('.room-window .wx').length };
  });

  /* Weather spread wider than the window would be clipped away, and the
     pane would look half empty — which is exactly how this first looked. */
  const inside = fit.pane.l >= fit.ink.l - 0.5 && fit.pane.r <= fit.ink.r + 0.5
              && fit.pane.t >= fit.ink.t - 0.5 && fit.pane.b <= fit.ink.b + 0.5;
  ok(`${id}: the weather is spread across the glass, inside the frame`, inside,
     `pane ${fit.pane.l.toFixed(1)}–${fit.pane.r.toFixed(1)} in window ${fit.ink.l.toFixed(1)}–${fit.ink.r.toFixed(1)}`);
  ok(`${id}: the sky is clipped to the glass`,
     !!fit.clip && fit.clip !== 'none' && fit.pieces >= 5,
     `${fit.clip.slice(0, 44)}…, ${fit.pieces} pieces`);

  shots.push(id);
  await page.locator('.room-window').screenshot({ path: `${SP}/W-${id}.png` });
}

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
await browser.close();
