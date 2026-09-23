# Checks

Nothing in this folder is part of the app. The app has no dependencies and
no build step — that is deliberate, so it can be edited and deployed from a
tablet — and none of these files are ever served to her tablet. They are
here so a change can be checked before it is pushed.

## Running them

```
cd tests && npm install     # once: Playwright, and a headless Chromium
node tests/run.mjs          # from the project root — the whole sweep
node tests/run.mjs garden   # or one suite, or several
```

`run.mjs` serves the app itself on port 8099, runs each suite in its own
process, prints a line each, and exits non-zero if anything failed. Each
suite is a separate process on purpose: they seed `localStorage` and fake
the clock, and a suite that leaves the date in 2027 would quietly poison
every suite after it.

If Playwright is already installed somewhere on the machine, point
`PLAYWRIGHT` at it instead of installing again. If a Chromium is already
downloaded, `PLAYWRIGHT_BROWSERS_PATH` is respected.

## What is in here

| | |
|---|---|
| `shell` | every module is in the service worker's offline list. No browser; instant. |
| `regress` | a whole day's practice, end to end, with the payouts line by line |
| `mastery` | days in a row, across three faked days — and what the screen says when a right answer earns no dot |
| `milestone` | a milestone fires once, and its keepsake can be worn but never bought |
| `shop` | the wall between buying and earning, from both sides |
| `petplay` | the pet cannot be neglected — mostly a check that nothing sad got added |
| `fxcheck` | reactions do not make the axolotl leap sideways |
| `depth` | one light over the whole catalogue, no clashing gradient ids, nothing floating off the floor, a recoloured copy that really is a different colour, and the axolotl's two drawings kept in step |
| `room` | the room, and the migration from the old flat scene |
| `roomfit` | geometry that renders fine and still looks wrong |
| `seasons` | the four seasons, each on a real date inside it |
| `garden` | the gate is earned, and the two scenes never share their contents |
| `backup` | the nudge fires when there is something real to lose |
| `calendar` | every day of the year, and every reward an event promises |
| `games` | the six mini-games, actually played |

Each file says at the top what it is holding down and why. That matters
more than the checks: a check without a reason gets deleted the first time
it is inconvenient.

## How to add one

A suite is a plain Node script. There is no test framework, because a
framework is a dependency.

```js
import { chromium, BASE, SP, ok } from './lib/harness.mjs';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });

ok('the thing does the thing', await page.locator('.thing').count() === 1);

await browser.close();
```

`ok(label, condition, extra)` prints one line and remembers whether it
passed, so the process exits non-zero on its own. The third argument is for
the number that makes a passing line worth reading — `"12 pieces"`,
`"56.0%"` — which is what turns a green line into evidence.

Then add the name to `ORDER` in `run.mjs`, roughly cheapest first.

## Worth knowing

**Look at the screenshots.** Several suites take pictures into
`tests/screenshots/`. Most of the real bugs in this project were found by
rendering something and looking at it, not by an assertion: invisible
wearables, five hats clipped off the top of the canvas, a door hanging in
mid-air, snowflakes that fell thirteen pixels, a bench standing in a pond.
All of those passed every check that existed at the time.

**Fake the clock, do not mock the date.** The app reads the tablet's own
clock in a dozen places. Seasons, events and birthdays are all tested by
replacing `window.Date` in an init script, which is the only honest way to
be in October in March.

**Seed, then reload, then navigate.** Writing `localStorage` does not
change the state the running app already loaded, and the first boot of an
unseeded app redirects to `#/setup`. So: `goto(BASE)`, seed, `reload()`,
and only then ask for the screen you want. Getting this order wrong makes a
suite look like a product bug.

**Count, do not write the number down.** A total typed into a test goes
stale the first time the catalogue grows, and then it is the test that is
wrong rather than the code.
