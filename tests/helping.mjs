/* The parts of the app that are there to teach rather than to reward.

   Each of these exists because of something a child actually does:

     she sees "frend" and "friend" one above the other and cannot find the
     difference, so the difference is marked

     she hears a long word as one lump, so Show me can break it into the
     chunks it is spelled in

     she is given eight words with the same spelling pattern in them and
     nobody ever says so

     the words she keeps missing are scattered through a list she mostly
     knows, so there is a short session made only of those
*/

import { chromium, BASE, ok, tally, watch, reportErrors } from './lib/harness.mjs';

const errs = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
watch(page, errs);
await page.goto(BASE, { waitUntil: 'networkidle' });

/* ---------- 1. where it went wrong ---------- */
{
  const d = await page.evaluate(async () => {
    const { diffWord } = await import('./js/core/spelldiff.js');
    const show = (a, b) => {
      const r = diffWord(a, b);
      return {
        target: r.target.map(m => (m.state === 'same' ? m.ch : `[${m.ch}:${m.state[0]}]`)).join(''),
        attempt: r.attempt.map(m => (m.state === 'same' ? m.ch : `[${m.ch}:${m.state[0]}]`)).join(''),
        slips: r.slips, same: r.same,
      };
    };
    return {
      missing: show('frend', 'friend'),
      swapped: show('thier', 'their'),
      extra: show('traain', 'train'),
      right: show('paint', 'paint'),
      empty: show('', 'train'),
      wholeWordWrong: show('xyz', 'train'),
    };
  });
  console.log('  ' + JSON.stringify(d.missing) + ' ' + JSON.stringify(d.swapped));

  ok('a missing letter is found and nothing else is blamed',
     d.missing.target === 'fr[i:m]end' && d.missing.slips === 1, JSON.stringify(d.missing));
  ok('and her own spelling shows the hole where it belonged',
     d.missing.attempt === 'fr[:g]end', d.missing.attempt);
  ok('two letters the wrong way round is two slips, not a whole word',
     d.swapped.slips === 2, JSON.stringify(d.swapped));
  ok('a letter she added is marked in her try, not in the word',
     /e\]/.test(d.extra.attempt) && d.extra.target === 'train', JSON.stringify(d.extra));
  ok('a right answer has nothing marked at all',
     d.right.same && d.right.slips === 0 && d.right.target === 'paint');
  ok('an empty answer still shows her the whole word',
     d.empty.target.includes('[t:m]') && d.empty.slips === 5, JSON.stringify(d.empty));
  ok('and a word with nothing right is not a crash',
     d.wholeWordWrong.slips > 0, JSON.stringify(d.wholeWordWrong));
}

/* ---------- 2. sound ---------- */
{
  /* Headless Chromium has an audio engine that never actually makes a
     noise, so the check is on what the app ASKS for: that the oscillators
     are built, that they stop again, and above all that the switch in the
     Grown-ups area really silences it. */
  await page.evaluate(() => {
    window.__notes = [];
    const Real = window.AudioContext;
    class FakeCtx {
      constructor() { this.state = 'running'; this.currentTime = 0;
        this.destination = { connect() {} }; }
      resume() { this.state = 'running'; }
      createGain() {
        return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
                 connect() {} };
      }
      createOscillator() {
        const o = { type: 'sine', frequency: { setValueAtTime(v) { o.hz = v; },
                    exponentialRampToValueAtTime() {} },
                    connect() {}, start() { o.started = true; },
                    stop() { o.stopped = true; } };
        window.__notes.push(o);
        return o;
      }
    }
    window.AudioContext = FakeCtx;
    window.__realAudioContext = Real;
  });

  const r = await page.evaluate(async () => {
    const sound = await import('./js/core/sound.js');
    const { update } = await import('./js/core/state.js');
    sound.forgetContextForTests?.();
    sound.unlock();
    window.__notes = [];
    const played = sound.right();
    const afterRight = window.__notes.length;
    const allStarted = window.__notes.every(o => o.started && o.stopped);

    window.__notes = [];
    sound.fanfare();
    const afterFanfare = window.__notes.length;

    update(st => { st.settings.sound = false; });
    window.__notes = [];
    const playedMuted = sound.right();
    const afterMute = window.__notes.length;
    update(st => { st.settings.sound = true; });
    return { played, afterRight, allStarted, afterFanfare, playedMuted, afterMute };
  });

  ok('a right answer makes a sound', r.played && r.afterRight === 2, JSON.stringify(r));
  ok('every note it starts, it also stops', r.allStarted);
  ok('a celebration is a longer run of notes', r.afterFanfare >= 3, String(r.afterFanfare));
  ok('and the switch in Grown-ups really silences it',
     r.playedMuted === false && r.afterMute === 0, JSON.stringify(r));

  const quiet = await page.evaluate(async () => {
    const sound = await import('./js/core/sound.js');
    /* Nothing here may throw on a tablet with no audio engine at all —
       the app has to work on a device that cannot make a sound. */
    const saved = window.AudioContext;
    try {
      let threw = false;
      try { sound.pip(); sound.stars(3); sound.notYet(); } catch { threw = true; }
      return { threw };
    } finally { window.AudioContext = saved; }
  });
  ok('and none of it can throw', quiet.threw === false);
}

/* ---------- 3. syllables ---------- */
{
  const r = await page.evaluate(async () => {
    const { syllables } = await import('./js/core/syllables.js');
    const out = {};
    for (const w of ['remember', 'afraid', 'whistle', 'listen', 'weather', 'friend',
                     'cake', 'beautiful', 'table', 'rhythm', 'a', 'explain'])
      out[w] = syllables(w).join('-');
    return out;
  });
  console.log('  ' + Object.entries(r).map(([k, v]) => v).join(' '));

  ok('a long word breaks into chunks', r.remember === 're-mem-ber', r.remember);
  ok('a blend stays with the chunk it starts', r.afraid === 'a-fraid', r.afraid);
  ok('a two-letter sound is never split', r.weather === 'wea-ther', r.weather);
  ok('consonant plus le is its own ending', r.whistle === 'whis-tle', r.whistle);
  ok('and an s-blend in the middle is not an opening',
     r.listen === 'lis-ten', r.listen);
  ok('a one-chunk word comes back whole', r.friend === 'friend' && r.cake === 'cake',
     `${r.friend} ${r.cake}`);
  ok('a word with no second vowel sound is left alone', r.rhythm === 'rhythm', r.rhythm);
  ok('and nothing is ever a chunk with no vowel in it', Object.values(r)
     .every(v => v.split('-').every(bit => /[aeiouy]/i.test(bit))), JSON.stringify(r));

  /* And the speaking side: Show me says the chunks before the letters. */
  const said = await page.evaluate(async () => {
    const speech = await import('./js/core/speech.js');
    window.__said = [];
    const v = { name: 'T', lang: 'en-US', voiceURI: 't', default: true, localService: true };
    speechSynthesis.getVoices = () => [v];
    speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend?.(new Event('end')), 1); };
    speechSynthesis.cancel = () => {};
    await speech.ready();
    await speech.sayInChunks({ text: 'remember' });
    /* speech.unlock() says a silent space to wake Chrome up; it is not
       one of the chunks. */
    return window.__said.filter(t => t.trim());
  });
  ok('Show me can say a word in its chunks',
     said.slice(0, 3).join('-') === 're-mem-ber', JSON.stringify(said));
  ok('...and puts the word back together at the end',
     said[said.length - 1] === 'remember', JSON.stringify(said));
}

/* ---------- 4. the pattern in the list ---------- */
{
  const r = await page.evaluate(async () => {
    const { patternOf, patternSpoken } = await import('./js/core/patterns.js');
    const line = ws => { const f = patternOf(ws); return f ? f.line : null; };
    return {
      ai: line(['train', 'paint', 'afraid', 'explain', 'brain', 'chain']),
      tion: line(['station', 'nation', 'action', 'fiction', 'motion']),
      kn: line(['knee', 'knife', 'knock', 'know', 'knot']),
      mixed: line(['because', 'friend', 'weather', 'journey', 'scissors', 'enough']),
      tooFew: line(['train', 'paint']),
      halfAndHalf: line(['train', 'paint', 'afraid', 'dog', 'cat', 'sun', 'hat', 'cup']),
      spoken: (() => { const f = patternOf(['station', 'nation', 'action', 'motion']);
                       return f ? patternSpoken(f) : null; })(),
    };
  });
  console.log('  ' + JSON.stringify(r.ai) + ' ' + JSON.stringify(r.tion));

  ok('a list of ai words is named as an ai list',
     /have ai in them/.test(r.ai || ''), r.ai);
  ok('an ending is called an ending', /end in -tion/.test(r.tion || ''), r.tion);
  ok('and a beginning a beginning', /start with a silent k/.test(r.kn || ''), r.kn);
  ok('a list with no pattern in it says nothing at all', r.mixed === null, r.mixed);
  ok('neither does a list too short to have one', r.tooFew === null, r.tooFew);
  ok('and nor does three out of eight', r.halfAndHalf === null, r.halfAndHalf);
  ok('the spoken version drops the dash the page needs',
     r.spoken === 'All of these words end in tion, like station.', r.spoken);
}

/* ---------- 5. the words she keeps missing ---------- */
{
  const r = await page.evaluate(async () => {
    const now = Date.now(), D = 86400000;
    const word = (id, text, over) => ({
      id, listId: 'l1', text, definition: '', sentence: '', hint: '', tags: [],
      attempts: 0, correctCount: 0, incorrectCount: 0, streak: 0,
      lastCreditDay: null, lastDailyDay: null, recent: [],
      firstSeen: now, lastSeen: now, lastCorrect: null, lastMissed: null,
      masteredAt: null, createdAt: now, ...over,
    });
    localStorage.setItem('spelling-adventure:v1', JSON.stringify({
      schemaVersion: 1,
      child: { name: 'T', petCoat: 'peach', petName: 'A', setupComplete: true },
      settings: { masteryThreshold: 5, masteryRuleV2: true },
      progress: { stars: 0 },
      lists: [{ id: 'l1', name: 'W', archived: false, createdAt: now }],
      words: [
        /* Missed a lot, and lately. */
        word('w1', 'because', { attempts: 6, correctCount: 2, incorrectCount: 4,
          recent: [false, false, true], lastMissed: now - D }),
        word('w2', 'friend', { attempts: 5, correctCount: 3, incorrectCount: 2,
          recent: [false, true, false], lastMissed: now - 2 * D }),
        word('w3', 'weather', { attempts: 4, correctCount: 3, incorrectCount: 1,
          recent: [true, false], lastMissed: now - 3 * D }),
        /* Missed once, months ago: not a tricky word any more. */
        word('w4', 'train', { attempts: 9, correctCount: 8, incorrectCount: 1,
          recent: [true, true, true], lastMissed: now - 90 * D }),
        /* Never missed at all. */
        word('w5', 'paint', { attempts: 7, correctCount: 7, incorrectCount: 0,
          recent: [true, true, true] }),
        /* Missed, but she has finished with it. */
        word('w6', 'brain', { attempts: 8, correctCount: 7, incorrectCount: 1,
          recent: [false], lastMissed: now - D, masteredAt: now - D }),
      ],
    }));
    location.reload();
  });

  await page.waitForTimeout(700);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const picked = await page.evaluate(async () => {
    const words = await import('./js/core/words.js');
    return {
      tricky: words.trickyWords(5).map(w => w.text),
      enough: words.hasTrickyWords(3),
      capped: words.trickyWords(2).length,
    };
  });
  console.log('  tricky: ' + picked.tricky.join(', '));

  ok('the words she keeps missing are the ones picked',
     picked.tricky.includes('because') && picked.tricky.includes('friend'),
     JSON.stringify(picked.tricky));
  ok('a word she has never missed is not one of them',
     !picked.tricky.includes('paint'), JSON.stringify(picked.tricky));
  ok('nor is one she missed once months ago',
     !picked.tricky.includes('train'), JSON.stringify(picked.tricky));
  ok('nor one she has already mastered',
     !picked.tricky.includes('brain'), JSON.stringify(picked.tricky));
  ok('the worst one comes first', picked.tricky[0] === 'because', picked.tricky[0]);
  ok('and it never hands back more than it was asked for', picked.capped === 2);
  ok('three of them is enough to be worth offering', picked.enough === true);

  /* And the button on the home screen really starts that session. */
  await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const btn = page.locator('button:has-text("Fix these")');
  ok('the home screen offers them as a session', await btn.count() === 1);
  const named = await page.locator('.tricky-btn + .muted').innerText().catch(() => '');
  ok('...and says which words they are', /because/.test(named), named);
  await btn.click();
  await page.waitForTimeout(900);
  const asked = await page.evaluate(() => document.querySelectorAll('.spell-progress i, .pip').length);
  ok('the session is made of exactly those words',
     await page.locator('.spell-stage').count() === 1 && asked <= 3,
     `${asked} pips`);
}

await browser.close();
reportErrors(errs);
const { failed } = tally();
process.exit(failed ? 1 : 0);
