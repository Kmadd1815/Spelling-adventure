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

/* Hands a specific set of words to the next session — used by "practice the
   tricky ones", the parent's per-list practice, and reviewing mastered words. */
let queueOverride = null;
export function setQueue(wordList) { queueOverride = wordList.slice(); }

const KINDS = {
  daily: {
    label: "Today's Practice", pool: 'daily',
    feedback: true, retry: true, marksDaily: true,
  },
  extra: {
    label: 'Practice', pool: 'active',
    feedback: true, retry: true, marksDaily: false,
  },
  practiceTest: {
    label: 'Practice test', pool: 'active',
    feedback: false, retry: false, marksDaily: false,
  },
  fullTest: {
    label: 'Spelling test', pool: 'list',
    feedback: false, retry: false, marksDaily: false,
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
    // A real spelling test covers the whole list in order, mastered words
    // and all. Missing one she had mastered honestly puts it back in play.
    plan = words.wordsInList(listId).map(word => ({ word, isRetry: false }));
  } else {
    const size = kind === 'practiceTest'
      ? Math.max(1, settings().practiceTestSize || 10)
      : Math.max(1, settings().practiceSize || 8);
    plan = words.pickWords({ count: size, pool: config.pool })
      .map(word => ({ word, isRetry: false }));
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

  function showWord({ speakIt = false } = {}) {
    typed = '';
    locked = false;
    clear(feedback);
    stage.classList.remove('showing-feedback');
    renderPips();
    renderTiles();

    const word = currentWord();
    const withSentence = words.shouldSpeakSentence(word);

    mount(prompt,
      el('button', {
        class: 'speak-btn', type: 'button', 'aria-label': 'Hear the word',
        onClick: () => sayWord({ withSentence }),
      }, '\u{1F50A}'),
      el('div', { class: 'muted tiny', text: entry().isRetry
        ? 'Here is that word again — you have got this'
        : (config.feedback ? 'Listen, then spell it' : config.label) })
    );

    renderHelp();
    if (speakIt) setTimeout(() => sayWord({ withSentence }), 260);
  }

  function renderHelp() {
    const word = currentWord();
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
    const { word, isRetry } = entry();
    const attempt = typed.trim().toLowerCase();
    if (!attempt) { toast('Tap the letters to spell the word'); return; }

    const correct = attempt === word.text.trim().toLowerCase();

    // A second look at a word she just missed is practice, not assessment:
    // it is recorded in her history but cannot advance or break the streak,
    // and it earns nothing.
    const outcome = words.recordAttempt(word.id, correct, { countsForMastery: !isRetry });
    if (outcome?.justMastered) masteredThisSession.push(word);

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
    correct ? showCorrect(word, isRetry) : showMissed(word, attempt, isRetry);
  }

  function showCorrect(word, isRetry) {
    stage.classList.add('showing-feedback');
    renderTiles('good');
    renderPips();
    speech.stop();

    const justMastered = masteredThisSession.includes(word);
    mount(feedback, el('div', { class: 'feedback feedback-good' },
      el('span', { class: 'big', text: justMastered ? '⭐ ' + pet.praiseMastered()
        : isRetry ? 'You remembered it!' : pet.praiseCorrect() }),
      el('div', { class: 'correct-spelling', text: word.text }),
      masteryDots(word)
    ));

    if (justMastered) confetti(28);
    setTimeout(next, justMastered ? 2200 : 1300);
  }

  function showMissed(word, attempt, isRetry) {
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
        button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}',
          onClick: () => speech.speakWord(word) }),
        button('Show me', { cls: 'btn btn-quiet', emoji: '\u{1F524}',
          onClick: () => speech.spellOut(word) }),
        button('Next word', { cls: 'btn btn-primary', emoji: '➡️', onClick: next })
      ),
      el('div', { class: 'tiny muted', style: { marginTop: '10px' },
        text: comingBack
          ? 'Look closely at it — this word will come back in a moment.'
          : 'You will see this one again next time.' })
    ));
  }

  function masteryDots(word) {
    const have = words.credits(word);
    const need = words.threshold();
    const wrap = el('div', { class: 'mastery-dots', style: { justifyContent: 'center', marginTop: '6px' } });
    for (let i = 0; i < need; i++) wrap.append(el('div', { class: i < have ? 'mdot on' : 'mdot' }));
    return el('div', { class: 'center' },
      wrap,
      el('div', { class: 'tiny muted', style: { marginTop: '4px' },
        text: have >= need ? 'Mastered!' : `${have} of ${need} days in a row` })
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
