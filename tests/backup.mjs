/* The backup nudge.

   The one genuinely fragile thing about this app is that everything she
   has done lives in one browser's storage on one tablet. The nudge is what
   stands between that and a lost term.

   It has to fire when there is something real to lose and stay quiet
   otherwise, so the table of cases is checked directly, and then the
   screen is driven: the reminder appears, "Later" puts it away for a few
   days rather than for ever, and saving a copy clears it.
*/

import { chromium, BASE, SP, ok } from './lib/harness.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2,
  acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

const WORDS = ['train','paint','afraid','explain','brain','chain','plain','stain','grain','stain2'];
const seed = (over = {}) => page.evaluate(([rows, over]) => {
  localStorage.clear();
  const now = Date.now();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    words: rows.map((text, i) => ({ id: 'w' + i, listId: 'l1', text, definition: '', sentence: '',
      hint: '', tags: [], attempts: 0, correctCount: 0, incorrectCount: 0,
      streak: (over.mastered || 0) > i ? 3 : 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: null, lastSeen: null,
      lastCorrect: null, lastMissed: null,
      masteredAt: (over.mastered || 0) > i ? now : null, createdAt: now })),
    progress: Object.assign({ sessionsCompleted: over.sessions ?? 0 }, over.progress || {}) }));
}, [WORDS, over]);

await page.goto(BASE, { waitUntil: 'networkidle' });

/* ---------- when the nudge should and should not appear ---------- */
const cases = [
  ['a brand new tablet with nothing done',    { mastered: 0, sessions: 0 }, false],
  ['she has started but never backed up',     { mastered: 2, sessions: 3 }, true],
  ['backed up today, nothing since',          { mastered: 2, sessions: 3,
      progress: { lastBackupAt: Date.now(), lastBackupMastered: 2 } }, false],
  ['eight words mastered since the last copy',{ mastered: 9, sessions: 9,
      progress: { lastBackupAt: Date.now(), lastBackupMastered: 1 } }, true],
  ['a fortnight since the last copy',         { mastered: 2, sessions: 3,
      progress: { lastBackupAt: Date.now() - 15 * 86400000, lastBackupMastered: 2 } }, true],
  ['a week since the last copy',              { mastered: 2, sessions: 3,
      progress: { lastBackupAt: Date.now() - 7 * 86400000, lastBackupMastered: 2 } }, false],
  ['snoozed',                                 { mastered: 9, sessions: 9,
      progress: { lastBackupAt: null, backupSnoozedUntil: Date.now() + 86400000 } }, false],
  ['snooze has run out',                      { mastered: 9, sessions: 9,
      progress: { lastBackupAt: null, backupSnoozedUntil: Date.now() - 1000 } }, true],
];
let allRight = true;
for (const [label, over, want] of cases) {
  await seed(over);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  const got = await page.evaluate(async () => {
    const s = await import('/js/core/safety.js');
    const st = s.backupStatus();
    return { due: st.due, reason: st.reason, msg: s.backupMessage(st) };
  });
  if (got.due !== want) { allRight = false; console.log(`   ${label}: wanted due=${want}, got ${JSON.stringify(got)}`); }
  else if (want && /undefined|NaN/.test(got.msg)) { allRight = false; console.log(`   ${label}: bad message "${got.msg}"`); }
}
ok(`the nudge fires exactly when it should (${cases.length} cases)`, allRight);

/* ---------- it shows up in the Parent Area, and Later silences it ---------- */
await seed({ mastered: 4, sessions: 5 });
await page.goto(BASE + '#/parent', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
for (const d of '1234') await page.click(`.hub-tile:text-is("${d}")`);
await page.waitForTimeout(600);
ok('the Parent Area shows the reminder', await page.locator('.card-warn:has-text("Save a copy")').count() === 1);
await page.screenshot({ path: `${SP}/K1-nudge.png` });

await page.click('button:has-text("Later")');
await page.waitForTimeout(500);
ok('"Later" puts it away', await page.locator('.card-warn:has-text("Save a copy")').count() === 0);
const snoozed = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('spelling-adventure:v1')).progress.backupSnoozedUntil);
ok('...for a few days, not for ever', snoozed > Date.now() && snoozed < Date.now() + 5 * 86400000,
   String(snoozed));

/* ---------- saving a copy records it, and the file is restorable ---------- */
await page.click('text=Backup & reset');
await page.waitForTimeout(500);
ok('the backup screen reports when the last copy was saved',
   await page.locator('text=No copy saved yet').count() === 1);
await page.screenshot({ path: `${SP}/K2-backup.png` });

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button:has-text("Save a copy")'),
]);
const path = await download.path();
const text = await (await import('node:fs/promises')).readFile(path, 'utf8');
ok('the saved file is a real backup', (() => {
  try { const j = JSON.parse(text); return j.app === 'spelling-adventure' && Array.isArray(j.state.words); }
  catch { return false; }
})());

await page.waitForTimeout(600);
const recorded = await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('spelling-adventure:v1')).progress;
  return { at: p.lastBackupAt, mastered: p.lastBackupMastered, snoozed: p.backupSnoozedUntil };
});
ok('saving a copy is recorded', recorded.at > Date.now() - 60000 && recorded.mastered === 4,
   JSON.stringify(recorded));
ok('...and clears any snooze', recorded.snoozed === null);

const after = await page.evaluate(async () => {
  const s = await import('/js/core/safety.js');
  return { due: s.backupStatus().due, says: s.reassurance(), since: s.masteredSinceBackup() };
});
ok('the reminder goes quiet once a copy exists', !after.due && after.says === 'Last copy saved today.',
   JSON.stringify(after));

/* ---------- moving to another tablet ----------

   This is the one path in the whole app where losing is permanent, and it
   was the one path nothing tested. Everything above proves a backup file
   gets WRITTEN. None of it proved the file can be read back onto a device
   that has never seen this app — which is the only reason the file exists.

   So: take the copy just saved, wipe the browser the way a brand new
   tablet is wiped, restore the file, and check that months of her progress
   actually came back. Not "it loaded" — the mastered words, the stars, the
   treasures she bought, what is out in her room, her pet's name and her
   practice days, item by item. */
const before = await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('spelling-adventure:v1'));
  return {
    name: st.child.petName, child: st.child.name,
    stars: st.progress.stars, days: st.progress.currentStreak,
    words: st.words.length,
    mastered: st.words.filter(w => w.masteredAt).map(w => w.text).sort(),
    streaks: Object.fromEntries(st.words.map(w => [w.text, w.streak])),
    owns: st.collection.items.length,
    equipped: JSON.stringify(st.equipped),
    birthday: st.settings.birthday,
  };
});

/* A brand new tablet: nothing in storage at all, including the rolling
   auto-backup, so there is nowhere to recover from except the file. */
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const fresh = await page.evaluate(async () => {
  const st = await import('/js/core/state.js');
  return { setup: st.getState().child.setupComplete, words: st.getState().words.length };
});
ok('a tablet that has never seen the app starts empty',
   fresh.setup === false && fresh.words === 0, JSON.stringify(fresh));

/* Restore the file, exactly as the Parent Area does: read it, parse it,
   and put it in. Deliberately through storage.parseBackup rather than by
   pasting the raw JSON, because parseBackup is what the button calls and
   it is where an old backup gets migrated forward. */
const restored = await page.evaluate(async fileText => {
  const storage = await import('/js/core/storage.js');
  const st = await import('/js/core/state.js');
  const next = storage.parseBackup(fileText);
  st.replaceState(next);
  storage.flush(next);
  const s = st.getState();
  return {
    name: s.child.petName, child: s.child.name,
    stars: s.progress.stars, days: s.progress.currentStreak,
    words: s.words.length,
    mastered: s.words.filter(w => w.masteredAt).map(w => w.text).sort(),
    streaks: Object.fromEntries(s.words.map(w => [w.text, w.streak])),
    owns: s.collection.items.length,
    equipped: JSON.stringify(s.equipped),
    birthday: s.settings.birthday,
  };
}, text);

ok('her words all come back', restored.words === before.words,
   `${before.words} before, ${restored.words} after`);
ok('...and the ones she had mastered are still mastered',
   JSON.stringify(restored.mastered) === JSON.stringify(before.mastered),
   `${before.mastered.join(',')} -> ${restored.mastered.join(',')}`);
ok('...with every word where it was on the way to mastery',
   JSON.stringify(restored.streaks) === JSON.stringify(before.streaks),
   JSON.stringify(restored.streaks));
ok('her stars and practice days come back',
   restored.stars === before.stars && restored.days === before.days,
   `${restored.stars} stars, ${restored.days} days`);
ok('her treasures come back', restored.owns === before.owns,
   `${before.owns} -> ${restored.owns}`);
ok('...and her room is still arranged the way she left it',
   restored.equipped === before.equipped, restored.equipped.slice(0, 80));
ok('her pet is still her pet, with the same name',
   restored.name === before.name && restored.child === before.child,
   `${restored.child} and ${restored.name}`);
ok('...and settings a grown-up chose come with her',
   restored.birthday === before.birthday, String(restored.birthday));

/* And the app itself agrees, not just the save file. */
await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
ok('the restored tablet opens on her room, not on the welcome screen',
   await page.locator('.room').count() === 1,
   (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 70));
await page.screenshot({ path: `${SP}/K3-restored.png` });

/* ---------- persistence and size are reported, never crash ---------- */
const health = await page.evaluate(async () => {
  const s = await import('/js/core/safety.js');
  return { persisted: await s.persistenceState(), bytes: await s.storageEstimate(),
           asked: await s.requestPersistence() };
});
ok('storage health can be read without throwing',
   ['granted', 'not granted', 'unknown'].includes(health.persisted), JSON.stringify(health));

console.log('\n--- PAGE ERRORS ---');
console.log(errs.length ? errs.join('\n') : 'none');
await browser.close();
