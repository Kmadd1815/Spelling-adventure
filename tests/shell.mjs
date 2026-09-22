/* The offline shell.

   The service worker lists every file to put in the cache before she is
   ever offline. A module left off that list still works — the fetch handler
   quietly caches it the first time it is asked for — so nothing fails, and
   nothing looks wrong, right up until she opens that screen for the first
   time with no signal. Then it is just broken, on a tablet, in a car.

   That has already happened once: four garden modules shipped outside the
   shell. This is the cheapest possible check against it happening again,
   and it needs no browser at all.
*/

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { ok } from './lib/harness.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');

const walk = dir => readdirSync(dir).flatMap(name => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

const modules = walk(join(ROOT, 'js'))
  .filter(f => f.endsWith('.js'))
  .map(f => './' + relative(ROOT, f).split('\\').join('/'));

const missing = modules.filter(m => !sw.includes(`'${m}'`));
ok('every module she needs is in the offline shell',
   missing.length === 0,
   missing.length ? missing.join(', ') : `${modules.length} modules`);

/* And the other way round: a file listed but deleted would fail silently,
   because install() lets a missing file slide rather than breaking the
   whole cache. */
/* Deduped: version.js appears twice, once in the list and once in the
   import that gives the cache its name. */
const listed = [...new Set([...sw.matchAll(/'(\.\/js\/[^']+\.js)'/g)].map(m => m[1]))];
const ghosts = listed.filter(l => !modules.includes(l));
ok('...and nothing in the shell has been deleted since',
   ghosts.length === 0, ghosts.length ? ghosts.join(', ') : `${listed.length} listed`);

/* The version constant is the cache name. If it did not change, the old
   cache is kept and she never sees the new build. */
const version = readFileSync(join(ROOT, 'js/core/version.js'), 'utf8');
const v = version.match(/APP_VERSION = '([^']+)'/)?.[1];
ok('the version is a real version', /^\d+\.\d+\.\d+$/.test(v || ''), String(v));
ok('the service worker takes its cache name from it',
   sw.includes('APP_VERSION') && sw.includes("from './js/core/version.js'"));
