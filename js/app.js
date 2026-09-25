/* Bootstrap.

   Wires the screens to the router, unlocks speech on the first tap, keeps
   the star counter in the top bar honest, and paints the season. */

import * as router from './ui/router.js';
import * as speech from './core/speech.js';
import { applySeasonTheme } from './core/season.js';
import { applyTextSize } from './ui/textsize.js';
import { getState } from './core/state.js';
import { on } from './core/bus.js';
import { watchForUpdates } from './core/updates.js';
import { requestPersistence } from './core/safety.js';
import * as storage from './core/storage.js';
import { toast } from './ui/toast.js';

import homeScreen     from './screens/home.js';
import spellScreen    from './screens/spell.js';
import wordsScreen    from './screens/words.js';
import petScreen      from './screens/pet.js';
import progressScreen from './screens/progress.js';
import parentScreen   from './screens/parent.js';
import paperTestScreen from './screens/paper.js';
import shopScreen     from './screens/shop.js';
import decorateScreen from './screens/decorate.js';
import setupScreen    from './screens/setup.js';
import gamesScreen    from './screens/games.js';
import playScreen     from './screens/play.js';
import eventScreen    from './screens/event.js';
import gardenScreen   from './screens/garden.js';
import treeScreen     from './screens/tree.js';
import pondScreen     from './screens/pond.js';
import { liveEvent, byId as eventById } from './core/events.js';
import { byId as gameById } from './core/games.js';

/* ---------- Routes ---------- */

router.route('/',         { title: 'Spelling Adventure', back: false, render: homeScreen });
router.route('/setup',    { title: 'Welcome', back: false, stars: false, render: setupScreen });
router.route('/daily',    { title: "Today's Practice", back: '/', render: (c, p) => spellScreen(c, { ...p, kind: 'daily' }) });
router.route('/practice', { title: 'Practice',          back: '/', render: (c, p) => spellScreen(c, { ...p, kind: 'extra' }) });
router.route('/test',     { title: 'Practice Test',     back: '/', render: (c, p) => spellScreen(c, { ...p, kind: 'practiceTest' }) });
router.route('/fulltest', { title: 'Spelling Test',     back: '/', render: (c, p) => spellScreen(c, { ...p, kind: 'fullTest' }) });
router.route('/words',    { title: 'My Words',  back: '/', render: wordsScreen });
router.route('/pet',      { title: 'My Pet',    back: '/', render: petScreen });
router.route('/progress', { title: 'My Progress', back: '/', render: progressScreen });
router.route('/decorate', { title: 'Decorate', back: '/pet', render: decorateScreen });
router.route('/shop',     { title: 'Shop', back: '/pet', render: shopScreen });
router.route('/garden',   { title: 'The Garden', back: '/', render: gardenScreen });
router.route('/tree',     { title: 'Your Word Tree', back: '/garden', render: treeScreen });
router.route('/pond',     { title: 'The Pond', back: '/garden', render: pondScreen });
router.route('/games',    { title: 'Mini-Games', back: '/', render: gamesScreen });
router.route('/play',     { title: p => gameById(p.id)?.name || 'Mini-Game', back: '/games', render: playScreen });
router.route('/event',    { title: p => (liveEvent() || eventById(p.preview))?.name || 'Event',
                            back: '/', render: eventScreen });
router.route('/parent',   { title: 'Parent Area', back: '/', stars: false, render: parentScreen });
router.route('/papertest', { title: 'Paper Test', back: '/parent', stars: false, render: paperTestScreen });

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

/* ---------- Saying so when the save is in trouble ----------

   Both of these used to go to the console and nowhere else, which on a
   tablet is nowhere at all. They are the two ways months of work disappear
   without anybody finding out until it is too late to do anything. */
const outcome = storage.loadOutcome();
if (outcome === 'recovered') {
  toast('Your progress was rescued from the backup copy.', { ms: 5200 });
} else if (outcome === 'lost') {
  /* The worst news in the app. It has to be said plainly and it has to say
     what to do, because "No words yet" reads as "nobody added a list". */
  toast('Something went wrong with the saved progress. A grown-up can restore a backup in the Parent Area.',
        { ms: 9000 });
}

/* Out of space, or storage switched off. Said once, when it first happens,
   because otherwise she plays for an hour and none of it is kept. */
on('storage:failed', () => toast(
  'Progress is not being saved right now. Ask a grown-up to check the tablet\u2019s storage.',
  { ms: 9000 }));
on('storage:ok', () => toast('Saving again \u2014 all good.', { ms: 3200 }));

/* The voice stopped working, usually because the tablet lost its signal and
   the chosen voice is one that streams. Everything else carries on exactly
   as before — the app is cached and it saves to the tablet, so nothing is
   lost and nothing needs waiting for — but she has to be told, because from
   where she is sitting the axolotl has simply gone quiet. The activities
   have already switched to look, cover, spell by the time this shows. */
on('speech:failed', () => toast(
  'Axo has lost its voice for now \u2014 you can still look at each word and cover it up. '
  + 'Everything you do is still being saved.',
  { ms: 9000 }));

/* And it tries again the moment the tablet is back online, rather than
   staying silent until the app is restarted. */
addEventListener('online', () => {
  if (!speech.canSpeak()) {
    speech.retryEngine();
    if (speech.canSpeak()) toast('Axo can talk again!', { ms: 3200 });
  }
});

/* The arrow goes up a level, not back through history — see goBack() in
   ui/router.js. Before the child has finished setup there is no level to
   go up to, so it belongs on the welcome screen. */
document.getElementById('backBtn').addEventListener('click', () => {
  if (!getState().child.setupComplete) return router.navigate('/setup', { replace: true });
  router.goBack('/');
});
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

/* Before the first screen is drawn, so a bigger size never flashes past at
   the old one — and on every screen after, because it is set on <html>. */
applyTextSize();

/* Ask Chrome not to reclaim her save file if the tablet runs short of
   space. Asking costs nothing, the answer is remembered by the browser,
   and a refusal is not worth mentioning to anybody — the backup reminder
   in the Parent Area covers the same risk either way. */
requestPersistence();
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
