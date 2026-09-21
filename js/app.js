/* Bootstrap.

   Wires the screens to the router, unlocks speech on the first tap, keeps
   the star counter in the top bar honest, and paints the season. */

import * as router from './ui/router.js';
import * as speech from './core/speech.js';
import { applySeasonTheme } from './core/season.js';
import { getState } from './core/state.js';
import { on } from './core/bus.js';
import { watchForUpdates } from './core/updates.js';
import { toast } from './ui/toast.js';

import homeScreen     from './screens/home.js';
import spellScreen    from './screens/spell.js';
import wordsScreen    from './screens/words.js';
import petScreen      from './screens/pet.js';
import progressScreen from './screens/progress.js';
import parentScreen   from './screens/parent.js';
import shopScreen     from './screens/shop.js';
import decorateScreen from './screens/decorate.js';
import setupScreen    from './screens/setup.js';

/* ---------- Routes ---------- */

router.route('/',         { title: 'Spelling Adventure', back: false, render: homeScreen });
router.route('/setup',    { title: 'Welcome', back: false, stars: false, render: setupScreen });
router.route('/daily',    { title: "Today's Practice", back: true, render: (c, p) => spellScreen(c, { ...p, kind: 'daily' }) });
router.route('/practice', { title: 'Practice',          back: true, render: (c, p) => spellScreen(c, { ...p, kind: 'extra' }) });
router.route('/test',     { title: 'Practice Test',     back: true, render: (c, p) => spellScreen(c, { ...p, kind: 'practiceTest' }) });
router.route('/fulltest', { title: 'Spelling Test',     back: true, render: (c, p) => spellScreen(c, { ...p, kind: 'fullTest' }) });
router.route('/words',    { title: 'My Words',  back: true, render: wordsScreen });
router.route('/pet',      { title: 'My Pet',    back: true, render: petScreen });
router.route('/progress', { title: 'My Progress', back: true, render: progressScreen });
router.route('/decorate', { title: 'Decorate', back: true, render: decorateScreen });
router.route('/shop',     { title: 'Shop', back: true, render: shopScreen });
router.route('/parent',   { title: 'Parent Area', back: true, stars: false, render: parentScreen });

/* ---------- Top bar ---------- */

function paintStars() {
  const node = document.getElementById('starNum');
  if (!node) return;
  const next = String(getState().progress.stars);
  if (node.textContent === next) return;
  node.textContent = next;
  const chip = document.getElementById('starCount');
  chip.classList.remove('bump');
  void chip.offsetWidth;          // restart the animation
  chip.classList.add('bump');
}

on('state:changed', paintStars);
// Activities show their own itemised breakdown, so a toast would only
// repeat the total. Stars awarded anywhere else still announce themselves.
on('stars:awarded', ({ amount, reason }) => {
  if (amount > 0 && String(reason).startsWith('milestone:')) toast(`+${amount} stars`, { gold: true });
});
on('milestone:earned', m => toast(`${m.emoji}  ${m.title}`, { gold: true, ms: 4200 }));

// Before the child has finished setup, "back" belongs on the welcome screen
// rather than a hub she has not reached yet.
document.getElementById('backBtn').addEventListener('click', () =>
  router.goBack(getState().child.setupComplete ? '/' : '/setup'));
document.getElementById('starCount').addEventListener('click', () => router.navigate('/progress'));

/* ---------- Speech unlock ----------
   Chrome will not speak until synthesis has been touched inside a real
   user gesture, so the very first tap anywhere quietly primes it. */

function primeSpeech() {
  speech.unlock();
  removeEventListener('pointerdown', primeSpeech);
  removeEventListener('keydown', primeSpeech);
}
addEventListener('pointerdown', primeSpeech, { once: false });
addEventListener('keydown', primeSpeech, { once: false });

// Chrome's synthesis queue can wedge when the app goes to the background.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) speech.stop();
});

/* ---------- Go ---------- */

applySeasonTheme();
speech.ready().then(list => {
  if (!list.length) console.warn('[speech] the device reported no voices');
});
paintStars();

// First run goes to setup instead of the hub.
if (!getState().child.setupComplete && !location.hash.startsWith('#/parent')) {
  location.replace('#/setup');
}

router.start();

/* ---------- Offline support and updates ----------

   A reload in the middle of a spelling word would throw away what she is
   doing, so a new version waits for the home or welcome screen — which she
   passes through constantly — before refreshing. */

watchForUpdates({
  isSafeToReload: () => ['/', '/setup'].includes(router.currentRoute()),
});
