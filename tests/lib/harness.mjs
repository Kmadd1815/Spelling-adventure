/* What every suite needs, in one place.

   The suites are plain Node scripts. There is no test framework, because a
   framework is a dependency and this project has exactly one (Playwright,
   for driving a real browser). A check is a line of output; a suite is a
   file; the runner reads the lines.

   The app itself still has NO dependencies and no build step. Nothing in
   this folder is served to the tablet — it is here so that a change can be
   checked before it is pushed.
*/

import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* ---------- Playwright ----------

   Looked for where it might reasonably be rather than hard-coded: as a
   dependency of this folder, installed globally, or wherever PLAYWRIGHT
   points. A path baked into a file is how a test suite stops working the
   moment it moves to another machine. */
const CANDIDATES = [
  process.env.PLAYWRIGHT,
  'playwright',
  '/opt/node22/lib/node_modules/playwright/index.mjs',
  '/usr/lib/node_modules/playwright/index.mjs',
  '/usr/local/lib/node_modules/playwright/index.mjs',
].filter(Boolean);

async function loadPlaywright() {
  const tried = [];
  for (const where of CANDIDATES) {
    try { return await import(where); } catch { tried.push(where); }
  }
  console.error(
    'Playwright could not be found. Install it with:\n' +
    '    cd tests && npm install\n' +
    'or point PLAYWRIGHT at an existing copy.\n' +
    `Looked in: ${tried.join(', ')}`
  );
  process.exit(2);
}

const { chromium: realChromium } = await loadPlaywright();

/* ---------- A voice ----------

   Headless Chromium ships with no speech voices at all. That used not to
   matter, because the app simply said nothing. It matters now: a tablet
   that cannot talk correctly switches to look, cover, spell — so without
   this, every suite that drives a spelling session would be testing the
   silent fallback by accident, and the path a real tablet actually takes
   would have no coverage at all.

   A real tablet has a voice, so the test browser is given one.
   tests/resilience.mjs takes it away again, deliberately, because that is
   the thing that suite is about. */
const GIVE_IT_A_VOICE = () => {
  const voice = { name: 'Test Voice', lang: 'en-US', voiceURI: 'test',
                  default: true, localService: true };
  try {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [voice];
  } catch { /* a suite that removed speech entirely */ }
};

/* Wrapped rather than left to each suite to remember: a suite that forgot
   would go green while testing something nobody uses. */
export const chromium = {
  async launch(opts) {
    const browser = await realChromium.launch(opts);
    const wrap = async ctx => { await ctx.addInitScript(GIVE_IT_A_VOICE); return ctx; };
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...args) => wrap(await newContext(...args));
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (...args) => {
      const page = await newPage(...args);
      await wrap(page.context());
      return page;
    };
    return browser;
  },
};

/* ---------- Where the app is being served ---------- */
export const BASE = process.env.BASE || 'http://127.0.0.1:8099/index.html';

/* ---------- Where screenshots go ----------
   Several suites take pictures. Looking at them is how most of the real
   bugs in this project were found, so they are kept rather than thrown
   away, but they are not committed. */
export const SP = process.env.SP || fileURLToPath(new URL('../screenshots', import.meta.url));
if (!existsSync(SP)) mkdirSync(SP, { recursive: true });

/* ---------- A check ----------

   One line each, so the output of a whole sweep can be read at a glance and
   a failure names itself. The third argument is for the number or the
   string that makes a pass worth reading — "12 pieces", "56.0%" — which is
   what turns a green line into evidence. */
let passed = 0, failed = 0;

export const ok = (label, condition, extra = '') => {
  if (condition) passed++; else failed++;
  console.log(`${condition ? 'PASS' : '**FAIL**'}  ${label}${extra ? ' — ' + extra : ''}`);
};

export const tally = () => ({ passed, failed });

/* A failing check has to fail the process, or the runner and any CI would
   cheerfully report a green sweep full of red lines. */
process.on('exit', () => {
  if (failed && !process.exitCode) process.exitCode = 1;
});

/* ---------- Page errors ----------

   Every suite watches for them. An exception thrown inside the app does not
   fail a click, so without this a suite can pass every check while the
   console is full of red. */
export function watch(page, errs) {
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  return errs;
}

export function reportErrors(errs) {
  console.log('\n--- PAGE ERRORS ---');
  console.log(errs.length ? errs.join('\n') : 'none');
  if (errs.length && !process.exitCode) process.exitCode = 1;
}
