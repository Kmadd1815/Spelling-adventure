/* Run everything.

       node tests/run.mjs                 the whole sweep
       node tests/run.mjs garden seasons  just those two

   Starts a static server on the app, runs each suite in its own process,
   and prints one line per suite. Exits non-zero if anything failed, so it
   is usable from a hook or from CI without reading the output.

   Each suite is a separate process on purpose. They seed localStorage and
   fake the clock, and a suite that leaves the date in 2027 would quietly
   poison every suite after it.
*/

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, extname, normalize } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HERE = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}/index.html`;

/* The order is roughly cheapest first, so a broken build says so in seconds
   rather than after the six mini-games have been played through. */
const ORDER = ['shell', 'resilience', 'regress', 'mastery', 'review', 'streak', 'milestone', 'shop', 'petplay', 'fxcheck', 'depth',
               'room', 'roomfit', 'seasons', 'garden', 'backup', 'calendar',
               'events', 'games', 'paper', 'week', 'reading'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

/* A server rather than a dependency: `npx http-server` works, but it is one
   more thing to have installed, and this is twenty lines. */
function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const file = join(ROOT, normalize(path === '/' ? '/index.html' : path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    /* Saying "address already in use" and a stack trace is not help. The
       usual cause is a server left running from last time, and the usual
       fix is a different port. */
    server.once('error', err => reject(err.code === 'EADDRINUSE'
      ? new Error(`Port ${PORT} is already in use — something else is serving there.\n` +
                  `Stop it, or run on another port:  PORT=8123 node tests/run.mjs`)
      : err));
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function run(name) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [join(HERE, `${name}.mjs`)], {
      env: { ...process.env, BASE },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => {
      const lines = out.split('\n');
      const passed = lines.filter(l => l.startsWith('PASS')).length;
      const failures = lines.filter(l => l.includes('FAIL'));
      /* A suite can pass every check while the app throws behind it. */
      const pageErrors = /--- PAGE ERRORS ---\n(?!none)/.test(out);
      resolve({ name, code, passed, failures, pageErrors, out, err });
    });
  });
}

const wanted = process.argv.slice(2);
const suites = wanted.length
  ? wanted.filter(n => ORDER.includes(n))
  : ORDER;

const unknown = wanted.filter(n => !ORDER.includes(n));
if (unknown.length) {
  console.error(`No such suite: ${unknown.join(', ')}`);
  console.error(`There is: ${ORDER.join(', ')}`);
  process.exit(2);
}

let server;
try {
  server = await serve();
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
console.log(`serving ${ROOT} on ${BASE}\n`);

let totalPassed = 0;
const broken = [];

for (const name of suites) {
  const r = await run(name);
  totalPassed += r.passed;
  const bad = r.code !== 0 || r.failures.length || r.pageErrors;
  if (bad) broken.push(r);
  console.log(
    `${bad ? 'FAIL' : ' ok '}  ${name.padEnd(10)} ${String(r.passed).padStart(3)} passed` +
    (r.failures.length ? `, ${r.failures.length} failed` : '') +
    (r.pageErrors ? ', page errors' : '') +
    (r.code !== 0 && !r.failures.length && !r.pageErrors ? `, exited ${r.code}` : '')
  );
}

server.close();

console.log(`\n${totalPassed} checks passed across ${suites.length} ${suites.length === 1 ? 'suite' : 'suites'}.`);

if (broken.length) {
  console.log('\n--- what went wrong ---');
  for (const r of broken) {
    console.log(`\n### ${r.name}`);
    r.failures.forEach(l => console.log(l));
    if (r.pageErrors) console.log(r.out.slice(r.out.indexOf('--- PAGE ERRORS ---')));
    if (r.err.trim()) console.log(r.err.trim());
  }
  process.exit(1);
}
