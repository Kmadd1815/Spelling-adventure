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

### Updates

The app updates itself. On every launch it checks for a new version, and
when one is ready it refreshes — but only on the home or welcome screen,
never in the middle of a spelling word. In practice: push a change, reopen
the app, and it is current.

*Parent Area → App version* shows which build is actually on the tablet,
with a **Check for updates** button for when you are impatient.

**Never clear site data to force an update.** That is where every word,
star and treasure lives. Uninstalling the home-screen app is unnecessary
too — and if an update ever does seem stuck, opening the Pages URL in a
normal Chrome tab and pulling to refresh is enough.

---

## First run — set it up before she ever opens it

The welcome screen has a **Parent setup** button under the name field.
Tap that first, before anyone enters a name.

**PIN `1234`.** Change it inside, under *Spelling rules*.

Add this week's list and choose the voice, then tap **Back to the welcome
screen**. She can now open the app, put in her name and pick her axolotl,
and go straight into a game that is already set up for her.

### Testing it yourself first

Feel free to run through the whole app to check it works — do the wizard,
play a practice round, earn some stars. When you are done:

*Parent Area → Backup & reset → **Fresh start for her**.*

That clears everything your testing created — progress, stars, streaks,
treasures, her name and her pet — and drops the app back on the welcome
screen, **while keeping your word lists, voice choice, mastery rules and
PIN**. It is the button to use when you hand the tablet over.

The other two resets are blunter: *Clear progress* keeps her name and pet
but wipes mastery and stars, and *Erase everything* deletes the word lists
too and returns the app to a completely blank first run.

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

- A word is **mastered** after being spelled correctly **N times in a row**
  (default 3, configurable), and **only one correct answer counts per day**.
  So three in a row really means three different days — she learned the word,
  rather than copying letters she was still looking at.
- **Missing a word starts the count over.**
- Mastered words **leave** the normal practice pool.
- Unmastered words **carry forward** week after week until she gets them.
- Mastered words are **never deleted**. They live in *My Words → Mastered*
  and can be reviewed deliberately, but never turn up in normal practice.

### Missing a word

She sees the correct spelling, then moves on to the next word. The one she
missed comes back **a few words later in the same session**, so she has to
recall it rather than retype something still on screen. That second look is
practice only: it earns no stars and cannot advance or break her streak. If
she misses it again it waits for the next session.

## The activities

| | What it is | Stars |
|---|---|---|
| **Today's Practice** | Works through the active list, each word once a day, feedback after every answer | **5** + 1 per first-try correct |
| **Practice** | Extra practice, any active word, always available | **+2** all correct, **+1** otherwise |
| **Practice Test** | A short quiet quiz, no answers until the end | **10** + 1 per correct |
| **Spelling Test** | A whole list, mastered words included, just like the real thing | **15** + 1 per correct, **+5** perfect |
| Mastering a word | | **+5** each |

The flat base pays for **effort** — a hard session still earns something, so
finishing is always worth doing. The per-word stars pay for **accuracy**. The
results screen itemises every line rather than showing one total, so the
accuracy bonus is something she can actually see herself earning.

Once every active word has had its turn today, **Today's Practice goes quiet
until tomorrow**. Extra practice stays open, and is deliberately worth much
less — it is for when she wants more, not a way to farm stars.

## The shop and her collection

Stars buy things. There are 21 items in the shop across hats, accessories
and decorations, priced against roughly 200 stars in a good week:

| | Price | Roughly |
|---|---|---|
| Little Bow, Bouncy Ball, Pretty Pebbles | 35–55 | a few days |
| Cozy Scarf, Party Hat, Toadstool Lamp | 65–120 | most weeks |
| Wizard Hat, Hero Cape, Book Nook | 160–300 | a week of saving |
| Golden Crown, Fish Tank, Castle Playset | 550–900 | something to work towards |

Eleven more items exist that the shop cannot sell at any price. Those are
**earned** — milestones, streaks, lists completed — and the Collection Book
records how she came by each one.

That rule is structural rather than a check someone could forget: an earned
item has no price field at all, and the shop is defined as "items that have
a price". There is nowhere to put a number on a milestone reward. Trying to
award a purchasable item as a prize is refused outright.

### Owning, wearing and displaying

Three separate layers, deliberately never merged:

- **Stars** — the currency
- **Collection** — everything she owns, permanently
- **Equipped** — the few things on show right now

She can own thirty decorations and display three. The pet wears one hat and
one accessory; the scene holds three decorations. Everything else waits in
the wardrobe on the **My Pet** screen, where she can swap things any time.

Hats and accessories are drawn onto the pet from its live measurements, so
one drawing fits every growth stage — a hat that fits the baby fits the
grown axolotl.

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
2b. Mastery is a streak of correct answers capped at one a day, so it can
   only ever be earned across separate days. A miss resets it.
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
sw.js                   offline caching, a module worker
js/core/version.js      THE version — sw.js imports it, so the cache name
                        and the number shown in the app cannot drift apart
js/core/updates.js      checks for new versions, refreshes at a safe moment
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

Remember to add the new file to `SHELL` in `sw.js`, and bump `APP_VERSION`
in `js/core/version.js` — that is what retires the old cache and ships the
new files to the tablet.
