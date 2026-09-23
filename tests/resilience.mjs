/* What happens when the tablet lets her down.

   Everything in here was found by deliberately breaking the things a real
   tablet does, and every one of them used to fail in the same way: the app
   carried on looking completely normal and said nothing at all. A console
   warning on a tablet is a warning nobody will ever read.

   The two that mattered most:

     A corrupt save went straight to a blank app — every word, every star,
     every mastered dot gone — while a perfectly good auto-backup sat in the
     next key along, untouched. The backup is written for exactly this, and
     the one code path that needed it was the one that could not reach it,
     because the fallback only ran when the primary was MISSING and a
     half-finished write leaves it present and unparseable. Worse, the
     screen then said "No words yet", which reads as "nobody ever added a
     list" rather than "everything is gone".

     A tablet with no text-to-speech made the app impossible to use. Every
     route to finding out what the word is goes through the speech engine —
     the speaker, "Hear it", even "Show me", which spells it out ALOUD — so
     she was looking at an empty row of tiles being asked to spell a word
     nobody had told her.
*/

import { chromium, BASE, ok, tally, reportErrors } from './lib/harness.mjs';

const browser = await chromium.launch();
const errs = [];

const GOOD = JSON.stringify({
  schemaVersion: 1, createdAt: Date.now(),
  child: { name: 'Tess', petCoat: 'mint', petName: 'Axo', setupComplete: true },
  lists: [{ id: 'l1', name: 'Week 4', week: '', description: '', archived: false, createdAt: Date.now() }],
  words: ['bicycle', 'journey', 'because'].map((t, i) => ({
    id: 'w' + i, listId: 'l1', text: t, definition: '', sentence: '', hint: '', tags: [],
    /* streak 0, not 5: a word whose streak has reached the threshold counts
       as mastered whatever masteredAt says, and a mastered word is not in
       the practice pool — so the session under test would be empty. */
    attempts: 1, correctCount: 1, incorrectCount: 0, streak: 0, lastCreditDay: null,
    lastDailyDay: null, recent: [], firstSeen: Date.now(), lastSeen: Date.now(),
    lastCorrect: Date.now(), lastMissed: null, masteredAt: null, reviewAt: null,
    reviewStep: 0, createdAt: Date.now(),
  })),
  progress: { stars: 840, milestonesEarned: [] },
  settings: { masteryThreshold: 5, masteryRuleV2: true },
  equipped: { wallpaper: 'wall_books' },
  collection: { items: [{ id: 'o1', itemId: 'wizard_hat', source: 'shop', earnedAt: Date.now() }] },
});

async function open({ init = null, seed = null, go = '#/', wait = 1200 } = {}) {
  const page = await (await browser.newContext({ viewport: { width: 900, height: 1100 } })).newPage();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  if (init) await page.addInitScript(init);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  if (seed) await page.evaluate(seed, GOOD);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  if (go !== '#/') { await page.goto(BASE + go, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(900); }
  return page;
}

const said = page => page.evaluate(() =>
  [...new Set([...document.querySelectorAll('[class*=toast]')].map(t => t.textContent.trim()))]
    .filter(Boolean).join(' / '));

/* ---------- a half-written save ---------- */
{
  const page = await open({ seed: good => {
    localStorage.clear();
    localStorage.setItem('spelling-adventure:v1:autobackup', good);
    localStorage.setItem('spelling-adventure:v1', good.slice(0, Math.floor(good.length * 0.6)));
  } });
  const state = await page.evaluate(async () => {
    const st = await import('./js/core/state.js');
    const store = await import('./js/core/storage.js');
    const s = st.getState();
    return { outcome: store.loadOutcome(), name: s.child?.name, stars: s.progress?.stars,
             words: (s.words || []).length, owns: (s.collection?.items || []).length };
  });
  ok('a half-written save is rescued from the auto-backup',
     state.outcome === 'recovered' && state.stars === 840 && state.words === 3,
     `${state.name}, ${state.stars} stars, ${state.words} words, ${state.owns} owned`);
  ok('...and she is told it happened',
     /rescued/i.test(await said(page)), await said(page) || '(nothing said)');
  await page.context().close();
}

/* ---------- both copies gone ---------- */
{
  const page = await open({ seed: good => {
    localStorage.clear();
    localStorage.setItem('spelling-adventure:v1', good.slice(0, 40));
  } });
  const msg = await said(page);
  ok('when there is nothing to recover, it says so instead of looking new',
     /went wrong|restore a backup/i.test(msg), msg || '(NOTHING SAID)');
  ok('...and points at the one thing that can help',
     /Parent Area/i.test(msg), 'it names where the backups are');
  await page.context().close();
}

/* ---------- the tablet is out of room ---------- */
{
  const page = await open({ seed: good => {
    localStorage.clear();
    localStorage.setItem('spelling-adventure:v1', good);
  } });
  await page.evaluate(() => {
    const real = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (k, v) => {
      if (String(k).startsWith('spelling')) throw new DOMException('quota', 'QuotaExceededError');
      return real(k, v);
    };
  });
  await page.evaluate(async () => {
    const st = await import('./js/core/state.js');
    st.update(s => { s.progress.stars += 1; });
  });
  await page.waitForTimeout(700);
  const msg = await said(page);
  ok('a save that cannot be written says so, rather than only in the console',
     /not being saved/i.test(msg), msg || '(NOTHING SAID)');
  await page.context().close();
}

/* ---------- a tablet that cannot talk ---------- */
const MUTE = () => {
  Object.defineProperty(window, 'speechSynthesis', { get: () => undefined, configurable: true });
};
{
  const page = await open({ init: MUTE, go: '#/daily', seed: good => {
    localStorage.clear(); localStorage.setItem('spelling-adventure:v1', good);
  } });
  const screen = await page.evaluate(() => document.body.innerText);
  ok('with no voice, the word is shown instead of spoken',
     /Look at it, then spell it/.test(screen), 'look, cover, spell');
  ok('...and there is a way to see it again',
     /Show me again/.test(screen), 'the button is there');
  ok('...and nothing offers to say something it cannot say',
     !/Listen, then spell it/.test(screen) && !/Hear it/.test(screen),
     'no buttons that do nothing');

  /* The word has to actually go away again, or it is copying, not spelling. */
  const shown = await page.evaluate(() => document.querySelector('.look-word')?.textContent || '');
  await page.waitForTimeout(4000);
  const later = await page.evaluate(() => document.querySelector('.look-word')?.textContent || '');
  ok('...and it covers itself back up, so she spells it rather than copies it',
     shown.length > 0 && later === '', `showed "${shown}", then covered`);
  await page.context().close();
}

/* A tablet WITH the speech API but no voices installed is the same thing,
   and it is the commoner of the two: the API is always there on Android. */
{
  const page = await open({ go: '#/daily', init: () => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
  }, seed: good => { localStorage.clear(); localStorage.setItem('spelling-adventure:v1', good); } });
  ok('a tablet with the API but no voices is treated the same way',
     /Look at it, then spell it/.test(await page.evaluate(() => document.body.innerText)),
     'no voices is the same as no speech');
  await page.context().close();
}

/* ---------- and a normal tablet is untouched ----------
   A voice has to be faked in, because headless Chromium genuinely has none
   — which is its own small reminder that "no voices installed" is an
   ordinary state for a device to be in, not an exotic one. */
{
  const page = await open({ go: '#/daily', init: () => {
    const voice = { name: 'Test Voice', lang: 'en-US', voiceURI: 'test', default: true,
                    localService: true };
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [voice];
  }, seed: good => {
    localStorage.clear(); localStorage.setItem('spelling-adventure:v1', good);
  } });
  const screen = await page.evaluate(() => document.body.innerText);
  ok('a tablet that can talk still listens and spells',
     /Listen, then spell it/.test(screen) && !/Look at it/.test(screen),
     'unchanged where speech works');
  await page.context().close();
}

await browser.close();
const t = tally();
console.log(`\nresilience: ${t.passed} pass, ${t.failed} fail`);
reportErrors(errs);
