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

**This is the one genuinely fragile thing about the app.** Everything she
has done lives in one browser's storage, on one tablet. The rolling second
copy the app keeps guards against a half-finished write and against nothing
else — "clear browsing data", a storage sweep by Chrome, a factory reset or
a lost tablet all take both copies at once.

Two things guard against that:

**The app asks Chrome not to reclaim its storage.** On start-up it requests
persistent storage, which stops the browser evicting the save file when the
device is short of space. Chrome grants this readily to an installed app. The
Backup screen says whether it was granted.

**The Parent Area asks you for a copy when one is overdue.** Not on a
schedule, and never in front of her — only when there is something real to
lose, and it says what:

* no copy has ever been saved and she has started using it
* eight or more words mastered since the last copy
* a fortnight since the last copy

"Later" puts it away for three days. Saving a copy clears it.

**Saving a copy** goes to the share sheet where the tablet offers one, so it
can go straight to Google Drive in a tap; it falls back to a download
otherwise. The file is plain JSON and **Restore from a copy** reads it back.

Do it at the end of a term, after a big week, and before anything that might
touch the tablet's storage.

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

## Mini-games

Six games, all of them played with her own spelling words, and the axolotl
is in every one of them.

| | What it is | The axolotl | Counts for mastery |
|---|---|---|---|
| **Word Search** | Her words hidden in a 10×10 grid, forwards only | Cheers from the side | no |
| **Crossword** | Built from the definitions on her list | Reads the clues | **yes** |
| **Tic Tac Toe** | Spell a word right to claim a square | Plays against her | **yes** |
| **Word Snake** | Hears the word, then collects its letters in order | She plays as it | no |
| **Tower Builder** | Guess letters; every right one lays a block | Builds the tower | no |
| **Axolotl Swim** | Hold to swim up, dodge rocks, catch letters | She plays as it | no |

Each game sits on its own painted backdrop — paper for the puzzles, a
meadow for the tower, open water for the two she swims — built from stacked
CSS gradients like the room's wallpapers, so there is nothing to download
and nothing to go stale in the cache.

### What games can and cannot do to her progress

Everything goes through `core/games.js`, which is the only route from a game
to the spelling engine:

* **A game can add a mastery credit. A game can never take one away.** Losing
  a game she is playing for fun must not undo a word she knows, so a missed
  word in a game is written into her history and stops there.
* Only **Crossword** and **Tic Tac Toe** can add a credit at all, because
  they are the only two where she spells the whole word from memory with
  nothing to copy. Word Search shows her the spelling; Snake and Swim hand
  her the letters in order; Tower is letter-guessing against blanks.
* Crossword's speaker button reads the **clue**, never the answer. Reading a
  clue out loud is help with reading; reading the answer out loud would make
  the credit meaningless. The next clue is read out automatically as soon as
  she finishes one — unless she has already picked a different clue herself,
  in which case hers wins.
* Word Snake reads the word out and then hides it: every letter floating in
  the water looks **exactly the same**, so finding the next one means knowing
  how the word is spelled. It still does not count for mastery, because she
  can find a letter by swimming into one and seeing what happens.
* Tower Builder takes guesses from a Bluetooth keyboard as well as from the
  letter pad, and the pad greys out what she has already tried either way.
* The one-credit-a-day cap still applies, so a game cannot be used to rush a
  word to mastery in an afternoon.

### What games pay

Games are worth real stars, and far fewer than practice:

* The **first go at each game each day** pays a base plus one star per word
  she got, plus a bonus for a clean run — usually 8–14 stars.
* Any **repeat go at the same game that day** pays **1 star**.
* Everything the games pay is capped at **25 stars a day**, all six games
  together. The hub says how many are left before she starts, and the results
  card says so plainly when the cap is what trimmed a payout.

So playing three different games is worth roughly a day's practice, and
playing one game thirty times is not worth anything much. The shop ladder
still runs on spelling.

There is a grown-up setting — **Mini-games** in the Parent Area — to make the
games wait until Today's Practice is finished. It is off by default.

## Seasonal events

An event sits **on top of** the season rather than replacing it: October is
still Fall, it just also has a Haunted Spelling Hunt in it. When one is
running, a banner appears on the home screen above Today's Practice — above
it, never instead of it.

### The calendar

| | Runs | She taps | Earns |
|---|---|---|---|
| 🎃 **Haunted Spelling Hunt** | 1–31 Oct 2026 | lost ghosts, helped home | Pumpkin Lantern, Witch Hat, Bat Garland, Candy Bucket, Ghost Friend |
| 🎂 **Birthday Week** | 3 days either side of her birthday, **every year** | candles, lit | Birthday Cake, Balloons, Banner, Sash |
| 🍂 **Gathering Week** | 20–30 Nov 2026 | blown leaves, gathered | Pumpkin Pie, Acorn Cap, Leaf Wreath, Harvest Basket |
| 🎄 **Trim the Tree** | 1–26 Dec 2026 | ornaments, hung up | Holiday Tree, Stocking, Holiday Hat, Snow Globe |
| 🎆 **Midnight Sparklers** | 27 Dec 2026 – 4 Jan 2027 | sparklers, lit | Jar of Sparklers, Party Horn, Star Garland, Midnight Clock |
| 🐰 **Spring Egg Hunt** | 22–29 Mar 2027 | hidden eggs, found | Basket of Eggs, Bunny Ears, Pot of Tulips, Spring Wreath |

All six play the same way: something is scattered across a scene, she taps
one, hears a word, and spells it. The thing does a happy little exit and the
track at the top fills a bit more. What differs between them is data in
`core/events.js` — the sprite, the backdrop, what the things are called and
what happens to them — so a seventh event is an entry in a list, not a new
screen.

Because she spells a whole word from memory with nothing to copy, every
event **can add to a mastery streak and can never break one**, the same rule
Crossword and Tic Tac Toe follow.

Nothing in any of them is frightening or punishing. The Halloween ghosts are
round and smiling and *lost* rather than haunting, and getting a word wrong
anywhere means the thing waits a moment and drifts somewhere else.

### Her birthday

Birthday Week is the only event that comes back every year, and the only one
whose dates are a **setting** rather than a fixed date — a birthday belongs
to the child, not the calendar. Set it in the Parent Area under *Events and
surprises*; the week runs three days either side, and the app works that out
by walking days outward, so it stays right across a month or a year boundary.

The collectibles are hers from the first birthday. Every year after that
there is still a party, and still a **present of 50 stars** — handed over
whole, not counted against any daily allowance, because a present is a
present.

### The rules events follow

* **Event items are earned, never sold.** They are ordinary special items —
  no price field — so the shop has nowhere to put a number on them.
* **What she earns is hers for good.** An event ending takes nothing away; it
  only stops new things being earned from it.
* **Events have their own small star budget** — 12 a day, counted separately
  from the mini-games' 25 — so a month of Halloween cannot quietly double
  what a day is worth.
* **Each year is its own entry.** `halloween_2026` only ever runs in 2026.
  Adding `halloween_2027` with a different set of collectibles leaves
  everything she earned this year untouched. Birthday Week is the deliberate
  exception: it recurs, so its items are earned once and the party is annual.
* **A window may run over the turn of the year.** Midnight Sparklers starts
  on 27 December 2026 and ends on 4 January 2027; `year` is the year it
  starts in.

The Parent Area lists what is running and what is coming, and can **preview**
an event before it opens. A preview plays the real thing but banks nothing —
no stars, no progress, no items — so the event is still new on the day.

## Pet discoveries

Every so often, after she has finished a spelling session, the axolotl turns
up with something it found. She taps the box to open it.

The rules that keep this a nice surprise rather than a slot machine:

* **Never required.** Nothing is gated behind a discovery and nothing levels
  up because of one.
* **At most one a day.**
* **Only after real work** — a two-word run does not summon a present.
* **Never the same thing twice.** There are six things to find; when they are
  all found the axolotl simply stops finding things and never mentions it.

## Playing with the axolotl

The pet breathes, its gills drift, and it blinks — all the time, with no
input. Tap it anywhere and it reacts: a hop, a floating burst of hearts,
a closed-eyed grin and something to say.

Five interactions on the **My Pet** screen:

| | Cost |
|---|---|
| **Pet** — hearts, a happy face | free, always |
| **Splash** — bubbles everywhere | free, always |
| **Feed** — a strawberry and a munching face | 1 treat |
| **Play** — sparkles and a big grin | 1 treat |
| **Cuddle** — the cosiest face it has | 1 treat |

**Treats** come from spelling: one per completed activity, plus two for
every word mastered.

### Treats are a gift, never an upkeep

This is the part worth being careful about. Running out of treats changes
**nothing** about the axolotl. It does not get hungry, sad, lonely or sick,
it never mentions how long it has been, and it is exactly as happy and as
available to play with at zero treats as at fifty. The two free
interactions are always there, so there is always something nice she can do.

There is deliberately no code anywhere that reads the treat count and makes
the pet worse off, and no mood the pet can drift into on its own — every
expression it has is a reaction to something she just did.

## The shop and her collection

Stars buy things. There are **96 items** in the shop — hats, accessories,
wallpaper, flooring, windows, doors, beds, rugs, furniture, plants and wall
art — priced against roughly 200 stars in a good week:

| | Price | Roughly |
|---|---|---|
| Watering Can, Little Bow, Pebbles, Bell Collar | 35–75 | a few days |
| Sun Hat, Flower Pot, Butterflies, Mossy Floor | 80–150 | most weeks |
| Wizard Hat, Bonsai Tree, Hammock, Rainbow | 150–300 | a week or two of saving |
| Sparkle Tiara, Cloud Bed, Golden Crown | 300–600 | about a month |
| Fish Tank, Castle Playset | 650–900 | a long goal |

The shape that matters is not the total but **how much exists at each price**,
so there is always something new within reach:

```
under 80   19 items
80-150     27 items
150-300    35 items
300-600    13 items
600+        2 items
```

Everything together costs 17,930 stars, so thirty weeks of steady work buys
roughly a third of the shop — about one new thing a week, with plenty left
to want. More can be added at any time by appending to the catalogue in
`js/core/items.js` and drawing the item in `js/ui/item-art.js`.

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
- **Equipped** — the arrangement she chooses on top of it

## Her room

The home screen is a room: a wall behind, a floor in front, and everything
placed where it would actually go. She can change the **wallpaper** and the
**flooring**, and add a **window** and a **door**.

Each kind of thing has its own place and its own limit:

| Slot | How many |
|---|---|
| Wallpaper, flooring | 1 each |
| Window, door | 1 each |
| Bed, rug | 1 each |
| On the walls | **2** |
| On the floor | **3** |
| Hat, accessory (on the pet) | 1 each |

A room is not a shelf with three spaces on it. Separate limits are what stop
it turning into a pile, and what make choosing between two rugs a real
decision rather than a question of whether there is room.

Single slots **swap** — picking a new rug rolls up the old one. The two
multi-slots fill up and then say so, since taking something down should be
a choice rather than something that happens quietly.

Floor decorations go in the **corners** — back right, front left, front
right — with the bed in the back-left corner. Nothing is placed in the strip
where the axolotl stands, so the room reads like a room rather than a ring
of objects around a pet.

A **soft cream wallpaper and warm wood floor** are hers from the very first
launch, so the room is never blank.

**Decorate** on the home screen shows the room with every slot beneath it.

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
11. A mini-game can add to a mastery streak but can never break one, and only
   a game where she spells the whole word from memory can add to one at all.
12. Mini-games pay less than practice, and their earnings are capped per day,
   so the shop can never be funded by games instead of spelling.
13. A game never puts something she has to avoid somewhere she cannot avoid
   it. In Axolotl Swim only the letter she needs is ever placed in a gap
   between rocks; wrong letters drift in open water with room to swim past.
14. An event layers on top of the season and never replaces the day's work.
   What it gives her is permanent; the event ending only stops new things
   being earned.
15. A pet discovery is always a bonus. Nothing in the app is gated behind
   one, and running out of things to find costs her nothing.
16. The backup reminder only ever appears in the Parent Area, only when
   something real is at risk, and always says what is at risk rather than
   quoting a date. The child is never asked to think about it.

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
  pet.js                the axolotl: coats, growth stages, moods, treats
  items.js              the catalogue, ownership and the room's slots
  games.js              the mini-game registry, their payouts and the one
                        door between a game and the spelling engine
  events.js             the event calendar, progress and collectibles
  discovery.js          what the axolotl finds, and how rarely
  safety.js             persistent storage, and noticing when a backup
                        is overdue
  season.js             date-driven season
  bus.js                tiny pub/sub

js/ui/                  reusable pieces
  dom.js  router.js  toast.js  fx.js (reaction bursts)
  art.js       the axolotl, drawn from a handful of proportions
  item-art.js  every item, plus the wallpaper and floor surfaces
  room.js      the room: wall, floor, and where each slot sits
  keyboard.js  THE on-screen keyboard, shared by spelling and games
  buddy.js     the axolotl's seat in every mini-game
  discovery.js the little ceremony around opening what it found

js/screens/             one file per screen
  home  setup  spell  words  pet  progress  parent  shop  decorate
  games.js     the mini-game hub
  play.js      the frame every game runs inside: loading, recording,
               paying out, and the shared results card
  event.js     the seasonal event, and the shape later ones will take

js/games/               one file per mini-game
  wordsearch  crossword  tictactoe  snake  tower  swim
```

### Adding another mini-game

Write `js/games/your-game.js` with a default export that takes the context
`screens/play.js` hands it, and add one entry to `GAMES` in
`js/core/games.js`. The hub, the route, the payout, the results card and the
axolotl all come for free.

```js
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import { gameWords } from '../core/games.js';

export default function yourGame(ctx) {
  const buddy = createBuddy({ layout: 'side' });
  const queue = gameWords(5);          // active words first, prioritised

  ctx.record(word, wasCorrect);        // the ONLY route to her progress
  ctx.onCleanup(() => clearInterval(timer));
  ctx.finish({ wordsWon: 3, headline: 'Nice one!' });
}
```

A game never imports `words.js`, `rewards.js` or `state.js`. `ctx.record()`
applies that game's mastery rule — set by `canMaster` in the registry — and
`ctx.finish()` prices the result against the daily ceiling. If a game needs
something the engine cannot do, extend the engine rather than working around
it inside the game.

Two traps worth knowing, both of which have already bitten this codebase:

* **Do all of a screen's set-up at the very end of its function**, after
  every helper is declared. Calling a `const` arrow before its line is
  reached throws, and it throws at run time on the tablet, not here.
* **Never position something with `transform` if an animation will also set
  `transform` on it.** The animation wins and the thing jumps. Use `left`,
  `top`, or a negative margin.

Remember to add the new file to `SHELL` in `sw.js`, and bump `APP_VERSION`
in `js/core/version.js` — that is what retires the old cache and ships the
new files to the tablet.
