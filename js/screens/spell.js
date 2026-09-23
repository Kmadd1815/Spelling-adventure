/* The spelling activities.

   Four kinds, all driven by the same engine so mastery can never mean two
   different things in two places:

     daily        Today's Practice. Works through the active list, showing
                  each word once a day, with feedback after every answer.
     extra        Free practice. Same feel, any active word, worth less.
     practiceTest A short quiet quiz — no feedback until the end.
     fullTest     A whole spelling list, exactly like the real thing,
                  including words she has already mastered.

   Missing a word never means retyping it while she is still looking at the
   answer. She sees the correct spelling, moves on, and meets the word again
   a few words later — recall rather than copying. That second look is for
   learning only: it earns nothing and does not touch her mastery streak.

   The mini-games reach mastery through core/games.js, which wraps this
   same words.recordAttempt() call — there is no second path to it.
*/

import { el, mount, button, clear } from '../ui/dom.js';
import { buildKeyboard as drawKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import { toast, confetti } from '../ui/toast.js';
import { navigate, render as rerender } from '../ui/router.js';
import * as speech from '../core/speech.js';
import * as words from '../core/words.js';
import * as rewards from '../core/rewards.js';
import { byId as itemById } from '../core/items.js';
import * as pet from '../core/pet.js';
import { getState, update, settings } from '../core/state.js';
import { maybeDiscover } from '../core/discovery.js';
import { showDiscovery } from '../ui/discovery.js';

/* Hands a specific set of words to the next session — used by "practice the
   tricky ones", the parent's per-list practice, and reviewing mastered words. */
let queueOverride = null;
export function setQueue(wordList) { queueOverride = wordList.slice(); }

const KINDS = {
  /* `counts` is the whole mastery rule in one column.

     Only the two tests move it. Practice shows her the answer, gives her a
     second look at anything she misses, and is meant to be where she
     learns — so it is teaching, not assessment, and a streak built out of
     it would be measuring the wrong thing.

     Neutral means neutral in BOTH directions: practice cannot advance a
     streak and cannot break one either. Losing five test results to a
     fumbled practice word would be maddening and would teach her to avoid
     practising. */
  daily: {
    label: "Today's Practice", pool: 'daily',
    feedback: true, retry: true, marksDaily: true, counts: false,
  },
  extra: {
    label: 'Practice', pool: 'active',
    feedback: true, retry: true, marksDaily: false, counts: false,
  },
  practiceTest: {
    label: 'Practice test', pool: 'active',
    feedback: false, retry: false, marksDaily: false, counts: true,
  },
  fullTest: {
    label: 'Spelling test', pool: 'list',
    feedback: false, retry: false, marksDaily: false, counts: true,
  },
};

/* How many words later a missed word comes back. Far enough that she has to
   remember it rather than echo it, close enough to still be the same lesson. */
const RETRY_GAP = 3;

export default function spellScreen(container, { kind = 'daily', listId = null } = {}) {
  const config = KINDS[kind] || KINDS.daily;

  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.overflow = 'hidden';

  const releaseLayout = () => {
    container.style.display = '';
    container.style.flexDirection = '';
    container.style.height = '';
    container.style.overflow = '';
  };
  const cleanupFns = [() => { speech.stop(); releaseLayout(); }];

  /* ---------- Build the queue ---------- */

  let plan;   // [{ word, isRetry }]

  if (queueOverride && queueOverride.length) {
    plan = queueOverride.map(word => ({ word, isRetry: false }));
    queueOverride = null;
  } else if (kind === 'fullTest') {
    // A real spelling test covers the whole list, mastered words and all,
    // in a fresh order each time. Missing one she had mastered honestly
    // puts it back in play.
    plan = words.shuffled(words.wordsInList(listId)).map(word => ({ word, isRetry: false }));
  } else {
    const size = kind === 'practiceTest'
      ? Math.max(1, settings().practiceTestSize || 10)
      : Math.max(1, settings().practiceSize || 8);
    plan = words.pickWords({ count: size, pool: config.pool })
      .map(word => ({ word, isRetry: false }));
  }

  /* A couple of words she mastered a while back, come round to be checked.
     They ride along with Today's Practice rather than being their own
     chore, because a separate "revision" button is a button nobody presses.

     They go at the END: the day's real words first, and the old friends as
     a little victory lap. And they are capped, so a summer's worth of
     mastered words drains a few at a time instead of arriving at once. */
  let reviews = [];
  if (kind === 'daily' && settings().reviewMastered !== false) {
    const cap = Math.max(0, settings().reviewsPerDay ?? 2);
    reviews = words.wordsDueForReview().slice(0, cap);
    plan = plan.concat(reviews.map(word => ({ word, isRetry: false, isReview: true })));
  }

  if (!plan.length) {
    releaseLayout();
    mount(container, emptyState(kind));
    return () => cleanupFns.forEach(f => f());
  }

  /* ---------- Session state ---------- */

  const originalIds = plan.map(e => e.word.id);
  const results = new Map();       // wordId -> { text, typed, correct }  (first attempts only)
  const masteredThisSession = [];
  let creditedThisSession = 0;
  let index = 0;
  let typed = '';
  let locked = false;
  let physicalUsed = false;

  /* ---------- Layout ---------- */

  const pips     = el('div', { class: 'spell-progress' });
  const prompt   = el('div', { class: 'center stack-sm' });
  const tiles    = el('div', { class: 'answer-tiles' });
  const helpRow  = el('div', { class: 'help-row row', style: { justifyContent: 'center' } });
  const feedback = el('div');
  const keyboard = el('div', { class: 'keyboard' });

  const stage = el('div', { class: 'spell-stage' },
    pips,
    el('div', { class: 'spell-middle' },
      el('div', { class: 'listen-zone' }, prompt),
      tiles,
      helpRow
    ),
    feedback,
    keyboard
  );
  mount(container, stage);

  /* ---------- Rendering ---------- */

  // Function declarations, not const arrows: everything in this screen is
  // hoisted so that the start-up calls at the bottom cannot reach a binding
  // that has not been initialised yet.
  function entry() { return plan[index]; }
  function currentWord() { return entry().word; }

  function renderPips() {
    clear(pips);
    originalIds.forEach(id => {
      const r = results.get(id);
      let cls = 'pip';
      if (r) cls += config.feedback ? (r.correct ? ' done' : ' missed') : ' done';
      else if (!locked && entry() && entry().word.id === id) cls += ' current';
      pips.append(el('div', { class: cls }));
    });
  }

  /* ---------- Look, cover, spell ----------

     Every way of finding out what the word is goes through the speech
     engine — the speaker button, "Hear it", even "Show me", which spells it
     out ALOUD. On a tablet with no voice data, or with text-to-speech
     switched off, all of them are silent no-ops and she is looking at an
     empty row of tiles being asked to spell a word nobody has told her.
     Nothing on screen said why; it just looked like a normal session.

     So when the tablet cannot speak, the word is SHOWN instead: a few
     seconds to look at it, then it is covered and she spells it from
     memory. That is how spelling is taught in schools, it needs no audio
     and nothing extra from a grown-up, and it turns a dead app into a
     working one. */
  const LOOK_MS = 3600;
  let lookTimer = null;
  cleanupFns.push(() => clearTimeout(lookTimer));

  function flashWord() {
    const word = currentWord();
    const card = prompt.querySelector('.look-word');
    if (!card) return;
    card.textContent = word.text;
    card.classList.remove('covered');
    clearTimeout(lookTimer);
    lookTimer = setTimeout(() => {
      card.textContent = '';
      card.classList.add('covered');
    }, LOOK_MS);
  }

  function showWord({ speakIt = false } = {}) {
    typed = '';
    locked = false;
    clear(feedback);
    stage.classList.remove('showing-feedback');
    renderPips();
    renderTiles();

    const word = currentWord();
    const withSentence = words.shouldSpeakSentence(word);
    const label = entry().isRetry
      ? 'Here is that word again — you have got this'
      : entry().isReview
        ? '\u2B50 One you already know — do you still?'
        : (config.feedback ? 'Listen, then spell it' : config.label);

    if (!speech.canSpeak()) {
      mount(prompt,
        el('div', { class: 'look-word covered' }),
        el('button', {
          class: 'btn btn-quiet', type: 'button',
          onClick: () => flashWord(),
        }, '\u{1F440}  Show me again'),
        el('div', { class: 'muted tiny', text: entry().isRetry
          ? 'Here is that word again — you have got this'
          : entry().isReview
            ? '\u2B50 One you already know — do you still?'
            : 'Look at it, then spell it' })
      );
      renderHelp();
      flashWord();
      return;
    }

    mount(prompt,
      el('button', {
        class: 'speak-btn', type: 'button', 'aria-label': 'Hear the word',
        onClick: () => sayWord({ withSentence }),
      }, '\u{1F50A}'),
      el('div', { class: 'muted tiny', text: label })
    );

    renderHelp();
    if (speakIt) setTimeout(() => sayWord({ withSentence }), 260);
  }

  function renderHelp() {
    const word = currentWord();
    if (!speech.canSpeak()) {
      /* Slower, In a sentence and Hint are all spoken. The sentence and the
         hint are text, so they can still be read; the rest would be
         buttons that do nothing. */
      mount(helpRow,
        word.sentence
          ? button('In a sentence', { cls: 'btn btn-quiet', emoji: '\u{1F4AC}',
              onClick: () => toast(word.sentence.replace(new RegExp(word.text, 'ig'), '\u2026'), { ms: 5000 }) })
          : null,
        (config.feedback && word.hint)
          ? button('Hint', { cls: 'btn btn-quiet', emoji: '\u{1F4A1}',
              onClick: () => toast(word.hint, { ms: 4000 }) })
          : null,
        physicalUsed
          ? button('Letters', { cls: 'btn btn-quiet', emoji: '\u2328',
              onClick: () => stage.classList.toggle('physical-kb') })
          : null
      );
      return;
    }
    mount(helpRow,
      button('Slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}',
        onClick: () => speech.speakWordSlowly(word) }),
      word.sentence
        ? button('In a sentence', { cls: 'btn btn-quiet', emoji: '\u{1F4AC}',
            onClick: () => speech.speakSentence(word) })
        : null,
      (config.feedback && word.hint)
        ? button('Hint', { cls: 'btn btn-quiet', emoji: '\u{1F4A1}',
            onClick: () => toast(word.hint, { ms: 4000 }) })
        : null,
      physicalUsed
        ? button('Letters', { cls: 'btn btn-quiet', emoji: '⌨',
            onClick: () => stage.classList.toggle('physical-kb') })
        : null
    );
  }

  function sayWord({ withSentence = false } = {}) {
    const btn = prompt.querySelector('.speak-btn');
    btn?.classList.add('speaking');
    speech.promptWord(currentWord(), { withSentence })
      .finally(() => btn?.classList.remove('speaking'));
  }

  function renderTiles(state = 'typing') {
    clear(tiles);
    typed.split('').forEach(ch => {
      let cls = 'tile';
      if (state === 'good') cls += ' good';
      if (state === 'bad')  cls += ' bad';
      tiles.append(el('div', { class: cls, text: ch }));
    });
    if (state === 'typing') tiles.append(el('div', { class: 'tile empty caret' }));
  }

  /* ---------- Keyboard ----------
     Drawn by ui/keyboard.js, which the mini-games use too, so there is only
     one keyboard in the app and it behaves the same everywhere. */

  function buildKeyboard() {
    drawKeyboard(keyboard, {
      onLetter: typeLetter,
      onBackspace: backspace,
      onEnter: submit,
      enterLabel: 'Check',
    });
  }

  function typeLetter(ch) {
    if (locked || typed.length >= 24) return;
    typed += ch;
    renderTiles();
  }

  function backspace() {
    if (locked) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  /* A Bluetooth keyboard is the better way to practice typing, so when one
     starts being used the on-screen letters step aside. A button brings them
     back if she puts it down. */
  function notePhysicalKeyboard() {
    if (physicalUsed) return;
    physicalUsed = true;
    stage.classList.add('physical-kb');
    toast('Using your keyboard — tap ⌨ to show the letters again.', { ms: 4200 });
    renderHelp();
  }

  cleanupFns.push(watchPhysicalKeyboard({
    onLetter: typeLetter,
    onBackspace: backspace,
    onEnter: submit,
    onFirstUse: notePhysicalKeyboard,
    isLocked: () => locked,
  }));

  /* ---------- Checking ---------- */

  function submit() {
    if (locked) return;
    const { word, isRetry, isReview } = entry();
    const attempt = typed.trim().toLowerCase();
    if (!attempt) { toast('Tap the letters to spell the word'); return; }

    const correct = attempt === word.text.trim().toLowerCase();

    // A second look at a word she just missed is practice, not assessment:
    // it is recorded in her history but cannot advance or break the streak,
    // and it earns nothing.
    const outcome = words.recordAttempt(word.id, correct,
      { countsForMastery: config.counts && !isRetry, isReview: !!isReview });
    if (outcome?.justMastered) masteredThisSession.push(word);
    if (outcome?.creditedNow) creditedThisSession += 1;

    if (!isRetry) {
      results.set(word.id, { text: word.text, typed: attempt, correct });
      if (config.marksDaily) words.markCoveredToday(word.id);
      // Bring a missed word back a few words later, once.
      if (!correct && config.retry) {
        const at = Math.min(index + RETRY_GAP, plan.length);
        plan.splice(at, 0, { word, isRetry: true });
      }
    }

    locked = true;

    if (!config.feedback) {
      renderTiles();
      renderPips();
      setTimeout(next, 420);
      return;
    }
    correct ? showCorrect(word, isRetry, outcome)
            : showMissed(word, attempt, isRetry, !!outcome?.forgotten);
  }

  function showCorrect(word, isRetry, outcome) {
    stage.classList.add('showing-feedback');
    renderTiles('good');
    renderPips();
    speech.stop();

    const justMastered = masteredThisSession.includes(word);
    mount(feedback, el('div', { class: 'feedback feedback-good' },
      el('span', { class: 'big', text: justMastered ? '⭐ ' + pet.praiseMastered()
        : outcome?.stillRemembered ? 'You still remember it!'
        : isRetry ? 'You remembered it!' : pet.praiseCorrect() }),
      el('div', { class: 'correct-spelling', text: word.text }),
      outcome?.stillRemembered
        ? el('div', { class: 'tiny muted', text: reviewLine(word) })
        : masteryDots(word, { creditedNow: !!outcome?.creditedNow })
    ));

    if (justMastered) confetti(28);
    setTimeout(next, justMastered ? 2200 : 1300);
  }

  function showMissed(word, attempt, isRetry, forgotten = false) {
    stage.classList.add('showing-feedback');
    renderTiles('bad');
    tiles.classList.add('shake');
    setTimeout(() => tiles.classList.remove('shake'), 420);
    renderPips();

    const comingBack = !isRetry && config.retry;

    mount(feedback, el('div', { class: 'feedback feedback-almost' },
      el('span', { class: 'big', text: pet.praiseAlmost() }),
      el('div', { class: 'your-try', text: attempt }),
      el('div', { class: 'correct-spelling', text: word.text }),
      el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } },
        speech.canSpeak()
          ? button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}',
              onClick: () => speech.speakWord(word) })
          : null,
        speech.canSpeak()
          ? button('Show me', { cls: 'btn btn-quiet', emoji: '\u{1F524}',
              onClick: () => speech.spellOut(word) })
          : null,
        button('Next word', { cls: 'btn btn-primary', emoji: '➡️', onClick: next })
      ),
      el('div', { class: 'tiny muted', style: { marginTop: '10px' },
        text: forgotten
          ? 'That one has gone a bit rusty — it is back in your practice for a while.'
          : comingBack
            ? 'Look closely at it — this word will come back in a moment.'
            : 'You will see this one again next time.' })
    ));
  }

/* How long until this word is checked again. She should see that getting it
   right pushed it further away — that is the reward for remembering, and
   without it a review is just an extra word with no point to it. */
function reviewLine(word) {
  if (!word.reviewAt) return 'Kept.';
  const days = Math.max(1, Math.round((word.reviewAt - Date.now()) / 86400000));
  if (days >= 150) return 'Kept \u2014 you will not see this one for about six months.';
  if (days >= 75)  return 'Kept \u2014 back in about three months.';
  if (days >= 21)  return 'Kept \u2014 back in about a month.';
  return 'Kept \u2014 back in about a week.';
}

  /* Where she is, and — when the answer she just got right did not move
     anything — why not.

     A correct answer that earns no dot is the single most confusing thing
     in the app: the counter looks broken. It is not, but nobody can tell
     that from a row of dots that did not change. Two reasons it can
     happen, and they need different sentences:

       practice        it never counts. Only the two tests do.
       already today   one-a-day counting is on and today is spent.
  */
  function masteryDots(word, { creditedNow = true } = {}) {
    const have = words.credits(word);
    const need = words.threshold();

    const wrap = el('div', { class: 'mastery-dots', style: { justifyContent: 'center', marginTop: '6px' } });
    for (let i = 0; i < need; i++) wrap.append(el('div', { class: i < have ? 'mdot on' : 'mdot' }));

    const caption = have >= need ? 'Mastered!'
      : !config.counts ? `${have} of ${need} — tests are what fill these in.`
      : creditedNow ? words.progressLabel(word)
      : `Today is already counted — ${have} of ${need} so far.`;

    return el('div', { class: 'center' },
      wrap,
      el('div', { class: 'tiny muted', style: { marginTop: '4px' }, text: caption })
    );
  }

  function next() {
    index += 1;
    if (index >= plan.length) return finish();
    showWord({ speakIt: true });
  }

  /* ---------- End of session ---------- */

  function finish() {
    speech.stop();

    const first = [...results.values()];
    const attempted = first.length;
    const firstTryCorrect = first.filter(r => r.correct).length;
    const missed = first.filter(r => !r.correct);

    const payout = rewards.payForActivity({
      kind, firstTryCorrect, attempted, mastered: masteredThisSession.length,
    });

    const treats = attempted > 0
      ? pet.earnTreats(1 + masteredThisSession.length * 2, kind)
      : 0;

    update(state => {
      state.progress.sessionsCompleted += 1;
      if (kind === 'practiceTest' || kind === 'fullTest') state.progress.testsCompleted += 1;
      state.sessions.push({
        id: `s_${Date.now().toString(36)}`, mode: kind, at: Date.now(),
        attempted, correct: firstTryCorrect,
      });
      if (state.sessions.length > 60) state.sessions = state.sessions.slice(-60);
    });

    const streak = rewards.touchStreak();
    const milestones = rewards.checkMilestones();

    if (attempted > 0 && firstTryCorrect === attempted) confetti(48);

    releaseLayout();
    mount(container, resultsScreen({ attempted, firstTryCorrect, missed, payout, streak, milestones, treats }));

    /* And once in a while the axolotl has been off finding something while
       she worked. A beat first, so it arrives after the results rather than
       on top of them. */
    const found = maybeDiscover({ attempted });
    if (found) setTimeout(() => showDiscovery(found), 900);
  }

  function resultsScreen({ attempted, firstTryCorrect, missed, payout, streak, milestones, treats }) {
    const petInfo = pet.pet();
    const headline = firstTryCorrect === attempted ? 'Every single one!'
      : firstTryCorrect >= attempted / 2 ? 'Nice work!' : 'Good effort — you tried them all.';

    const body = el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F389}' }),
        el('h2', { text: headline }),
        el('p', { class: 'muted', text: `${firstTryCorrect} of ${attempted} on the first try` })
      ),

      /* The itemised payout. Seeing the accuracy line separately is what
         makes the accuracy bonus mean anything to her. */
      el('div', { class: 'card' },
        el('h3', { text: 'Stars earned' }),
        el('div', { class: 'stack-sm' },
          payout.lines.map(line => el('div', { class: 'payout-row' },
            el('div', { class: 'grow', text: line.label }),
            el('div', { class: 'payout-stars', text: `+${line.stars}` })
          ))
        ),
        el('div', { class: 'payout-total' },
          el('div', { class: 'grow', text: 'Total' }),
          el('div', { text: `★ ${payout.total}` })
        )
      )
    );

    /* A test that moved nothing, because one-a-day counting is on and
       today is spent. The tests show no per-word feedback at all, so
       without this the whole session passes in silence and the dots simply
       do not move. */
    if (config.counts && attempted > 0 && creditedThisSession === 0) {
      body.append(el('div', { class: 'card center' },
        el('p', { class: 'muted tiny', text:
          'Today is already counted for these words. A test tomorrow moves them on.' })
      ));
    }

    /* Practice does not move mastery any more, so after one the dots are
       exactly where they were. Saying which activity DOES move them turns
       that from a counter that looks broken into a signpost. */
    if (!config.counts && attempted > 0) {
      body.append(el('div', { class: 'card center' },
        el('p', { class: 'muted tiny', text:
          `Practice is for learning. ${words.threshold()} in a row on a test is what masters a word \u2014 try Take a Test when you are ready.` })
      ));
    }

    if (masteredThisSession.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: `⭐ Mastered ${masteredThisSession.length === 1 ? 'a new word' : 'new words'}!` }),
        el('p', { class: 'muted tiny', text:
          `${petInfo.name} is so proud. These words leave your practice list now.` }),
        el('div', { class: 'stack-sm' }, masteredThisSession.map(w =>
          el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: w.text }),
            el('div', { class: 'badge badge-mastered', text: '⭐ Mastered' })
          )))
      ));
    }

    if (streak.isNewDay && streak.streak > 1) {
      body.append(el('div', { class: 'card center' },
        el('h3', { text: `\u{1F525} ${streak.streak}-day practice streak!` }),
        streak.isRecord ? el('p', { class: 'muted tiny', text: 'That is your best one yet.' }) : null
      ));
    }

    milestones.forEach(m => body.append(el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2rem' }, text: m.emoji }),
      el('h3', { text: m.title }),
      el('p', { class: 'muted tiny', text: m.blurb }),
      m.item ? el('p', { class: 'tiny', text: `You earned: ${itemById(m.item)?.name || ''}` }) : null
    )));

    if (missed.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: 'Words to look at again' }),
        el('div', { class: 'stack-sm' }, missed.map(r =>
          el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: r.text }),
            el('div', { class: 'w-meta', text: `you wrote: ${r.typed}` }),
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hear ${r.text}`,
              onClick: () => speech.speak(r.text) }, '\u{1F50A}')
          )))
      ));
    }

    const left = words.wordsLeftToday().length;
    body.append(el('div', { class: 'row' },
      (kind === 'daily' && left > 0)
        ? button('Keep going', { cls: 'btn btn-green grow', emoji: '➕', onClick: rerender })
        : button('Practice more', { cls: 'btn btn-green grow', emoji: '✨',
            onClick: () => navigate('/practice') }),
      button('Go home', { cls: 'btn btn-primary grow', emoji: '\u{1F3E0}',
        onClick: () => navigate('/') })
    ));

    return body;
  }

  /* ---------- Go ----------
     Deliberately the last thing in this function: every helper above is
     defined by the time any of it runs. */

  buildKeyboard();
  showWord({ speakIt: true });

  return () => cleanupFns.forEach(f => f());
}

/* ---------- Nothing to do ---------- */

function emptyState(kind) {
  if (kind === 'daily') {
    return el('div', { class: 'card center stack' },
      el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F31F}' }),
      el('h2', { text: 'All done for today!' }),
      el('p', { class: 'muted', text:
        'You have practiced every word on your list today. Come back tomorrow — or do some extra practice if you want more.' }),
      el('div', { class: 'row', style: { justifyContent: 'center' } },
        button('Extra practice', { cls: 'btn btn-green', emoji: '✨',
          onClick: () => navigate('/practice') }),
        button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') })
      )
    );
  }
  return el('div', { class: 'card center stack' },
    el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F389}' }),
    el('h2', { text: 'Nothing to practice!' }),
    el('p', { class: 'muted', text:
      'Every word has been mastered, or there are no words yet. A grown-up can add this week’s list in the Parent Area.' }),
    el('div', { class: 'row', style: { justifyContent: 'center' } },
      button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') }),
      button('Parent Area', { cls: 'btn btn-quiet', onClick: () => navigate('/parent') })
    )
  );
}
