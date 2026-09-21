# Spelling Adventure

A private, family-only spelling game for one third grader and her pet.
No accounts, no ads, no subscriptions, no server, and nothing leaves the
tablet. Everything is plain HTML, CSS and JavaScript — there is no build
step, so it can be edited and deployed entirely from a tablet.

---

## Getting it onto the tablet

1. Put this folder in a GitHub repository (it can be private).
2. In the repository, go to **Settings → Pages**, set *Source* to
   **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. Wait a minute, then open the URL GitHub gives you in Chrome on the tablet.
4. Tap Chrome's **⋮** menu → **Add to Home screen**.

It now opens fullscreen like a real app, and works with no internet after
the first load.

When the app is updated, Chrome may keep serving the old copy for a day.
To force it: open the app, pull down to refresh, or clear the app from
Recents and reopen it.

---

## First run

The app asks for her name, a pet, and a pet name. Then it will say there
are no words yet.

**Parent Area → PIN `1234`.** Change it inside, under *Spelling rules*.

### Adding a week's words

*Parent Area → Spelling lists → New list.*

Paste the whole list at once, one word per line. Numbering is stripped
automatically, so this works exactly as copied off the sheet:

```
1. train
2. paint
3. afraid
4. explain
```

To add a definition and an example sentence, separate them with `|`:

```
their | belonging to them | Those are their coats.
```

### Homophones — read this one

A spoken word alone cannot tell *their* from *there*, or *to* from *too*.
The app knows the common homophone families and will warn you on the
Parent Area home screen when one of them has no example sentence. Those
words are impossible to answer correctly from audio alone until you add
one, so it is worth doing right away. Once a sentence exists, it is read
aloud automatically every time that word comes up.

### Voice

*Parent Area → Voice & speech.* The list shows every English voice
installed on the tablet. Tap through a few, listen, and pick the clearest.
The choice applies to the entire app at once.

If the list is empty, Android has no speech engine installed:
**Settings → System → Languages & input → Text-to-speech output**, set the
preferred engine to *Speech Recognition & Synthesis by Google*, and install
the English (United States) voice data.

---

## Back up the progress

Everything lives in this browser's storage on this one tablet. Clearing
Chrome's browsing data would erase months of work.

*Parent Area → Backup & reset → Save a backup file.* It lands in Downloads;
move it to your cloud drive. Doing this every few weeks is enough.

---

## How mastery works

- A word is **mastered** after being spelled correctly in N *separate*
  sittings (default 3, configurable). Three right answers inside one
  session only ever count as one — knowing a word on three different days
  is the thing being measured.
- Mastered words **leave** the normal practice pool.
- Unmastered words **carry forward** week after week until she gets them.
- Mastered words are **never deleted**. They live in *My Words → Mastered*
  and can be reviewed deliberately, but never turn up in normal practice.
- Missing a word is never punished. It returns to the pool, comes back
  sooner, and she gets to try again immediately.

So a typical week looks like: 2 leftover words + 17 new = 19 active. As she
masters them the active list shrinks, and only the hard ones follow her.

The **words per practice** setting caps a single sitting (default 8) even
when the active pool is much larger.

---

## Keyboards

The app draws its own letters and never opens the system keyboard, because
Android's suggestion strip would hand her the correctly spelled word while
she is being asked to spell it.

The on-screen layout defaults to **QWERTY**, laid out like a real US
keyboard — staggered rows, Backspace at the end of the top row, the Check
key where Enter really is, and shift keys drawn as landmarks. The positions
she learns on screen are the positions her fingers will find on a physical
keyboard. *Parent Area → Spelling rules* can switch it to A-B-C order if
finding letters is still the harder problem.

**Bluetooth keyboards just work.** Letters, Backspace and Enter all do what
you would expect. The moment she types on one, the on-screen letters hide
themselves to give the screen back; a keyboard button brings them back if
she puts it down.

The app is built for **landscape as well as portrait** — sideways, the
layout tightens up so the keyboard always fits without scrolling.

---

## Design rules the code enforces

These are deliberate and should survive future changes:

1. Mastered words leave the active pool.
2. Unmastered words carry forward indefinitely.
3. Mastered words are never deleted.
4. Mastered words only reappear when explicitly requested.
5. Stars are ordinary currency.
6. Special items are earned, never purchasable — a special item has no
   price field anywhere in the code, so it cannot accidentally be sold.
7. Every special item records how it was earned.
8. The pet never becomes sad, hungry, lonely or neglected. There is no
   code path that can make it so, and nothing it says mentions absence.
   There is exactly one animal, an axolotl, on purpose: every future
   feature (outfits, hats, costumes, stage art, animations) has to be
   drawn once per species, so keeping that at one means all of it can be
   good. Coats are four fill values on the same drawing, so personalising
   the pet costs nothing. The gills grow fuller with each stage, which is
   what makes growth readable at a glance.
9. Breaking a streak costs nothing and is never mentioned.
10. All spelling goes through one engine; all speech goes through one voice.

---

## Code layout

```
index.html              app shell
css/app.css             all styling
sw.js                   offline caching  (bump CACHE when files change)
manifest.webmanifest    home-screen install

js/app.js               bootstrap: routes, speech unlock, star counter

js/core/                systems — no DOM in here
  state.js              the single source of truth
  storage.js            persistence, auto-backup, export/import
  words.js              THE spelling engine: pools, priority, mastery
  speech.js             THE voice: one setting, used everywhere
  rewards.js            stars, streaks, milestones, special items
  pet.js                the axolotl: coats, growth stages, everything it says
  season.js             date-driven season
  bus.js                tiny pub/sub

js/ui/                  reusable pieces
  dom.js  router.js  art.js (all SVG artwork)  toast.js

js/screens/             one file per screen
  home  setup  spell  words  pet  progress  parent
```

### Adding a mini-game later

Create `js/screens/games/your-game.js`, register a route in `app.js`, and
use the existing APIs:

```js
import { pickWords, recordAttempt } from '../../core/words.js';
import { promptWord } from '../../core/speech.js';
import { payForSession } from '../../core/rewards.js';

const sessionId = `s_${Date.now().toString(36)}`;
const queue = pickWords({ count: 8 });          // active, prioritised
await promptWord(queue[0]);                      // the shared voice
recordAttempt(queue[0].id, wasCorrect, sessionId);  // the shared mastery
```

Do not re-implement mastery, word selection or speech inside a game. If a
game needs something the engine cannot do, extend the engine.

Remember to add the new file to `SHELL` in `sw.js` and bump `CACHE`.
