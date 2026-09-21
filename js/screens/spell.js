/* Listen & Spell — the one spelling activity.

   Practice and Test are the same engine with different manners:
     Practice  shows what happened after every word and lets her try again.
     Test      stays quiet until the end, like a real spelling test.

   Every mini-game added later should call recordAttempt() the same way this
   screen does, so mastery can never mean two different things in two places.
*/

import { el, mount, button, clear } from '../ui/dom.js';
import { toast, confetti } from '../ui/toast.js';
import { navigate, render as rerender } from '../ui/router.js';
import * as speech from '../core/speech.js';
import * as words from '../core/words.js';
import * as rewards from '../core/rewards.js';
import * as pet from '../core/pet.js';
import { update, settings } from '../core/state.js';

/* A place to hand a specific set of words to the next session — used by
   "practice the tricky ones" and by the parent's per-list practice. */
let queueOverride = null;
export function setQueue(wordList) { queueOverride = wordList.slice(); }

/* The QWERTY layout mirrors a real US keyboard, staggered rows and all,
   so the positions she learns on screen are the positions her fingers will
   find on the Bluetooth keyboard. Backspace sits at the end of the top row
   and Enter at the end of the home row, exactly where they really are. */
const ABC_ROWS = ['abcdefg', 'hijklmn', 'opqrstu', "vwxyz'"];

const QWERTY_ROWS = [
  { lead: 0, keys: 'qwertyuiop', end: 'del'   },
  { lead: 1, keys: "asdfghjkl'", end: 'enter' },
  { lead: 3, keys: 'zxcvbnm',    end: 'shift', leadShift: true },
];

export default function spellScreen(container, { mode = 'practice', pool = 'active', listId = null } = {}) {
  // The activity owns the whole viewport below the top bar so the keyboard
  // is always reachable without scrolling.
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

  const size = mode === 'test'
    ? Math.max(1, words.activeWords().length ? Math.min(words.activeWords().length, 20) : 0)
    : Math.max(1, settings().practiceSize || 8);

  let queue;
  if (queueOverride && queueOverride.length) {
    queue = queueOverride;
    queueOverride = null;
  } else {
    queue = words.pickWords({ count: size, pool, listId });
  }

  if (!queue.length) {
    mount(container, emptyState(pool));
    return () => cleanupFns.forEach(f => f());
  }

  /* ---------- Session state ---------- */

  const sessionId = `s_${Date.now().toString(36)}`;
  const results = [];            // { wordId, text, typed, correct }
  let index = 0;
  let typed = '';
  let locked = false;            // true while feedback is on screen
  let physicalUsed = false;      // a Bluetooth keyboard has been used
  let retrying = false;          // this attempt is a second look, not scored
  let masteredThisSession = [];

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

  buildKeyboard();
  renderPips();
  showWord({ speakIt: true });

  /* ---------- Rendering ---------- */

  function currentWord() { return queue[index]; }

  function renderPips() {
    clear(pips);
    queue.forEach((_, i) => {
      const r = results[i];
      let cls = 'pip';
      if (i === index && !locked) cls += ' current';
      else if (r) cls += r.correct ? ' done' : ' missed';
      // In a test she does not learn how she did until the end, so a
      // finished word is marked as done either way.
      if (mode === 'test' && r) cls = 'pip done';
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
        class: 'speak-btn',
        type: 'button',
        'aria-label': 'Hear the word',
        onClick: () => sayWord({ withSentence }),
      }, '\u{1F50A}'),
      el('div', { class: 'muted tiny', text: mode === 'test' ? 'Spelling test' : 'Listen, then spell it' })
    );

    renderHelp();

    if (speakIt) setTimeout(() => sayWord({ withSentence }), 260);
  }

  function renderHelp() {
    const word = currentWord();
    mount(helpRow,
      button('Slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}', onClick: () => speech.speakWordSlowly(word) }),
      word.sentence
        ? button('In a sentence', { cls: 'btn btn-quiet', emoji: '\u{1F4AC}', onClick: () => speech.speakSentence(word) })
        : null,
      (mode === 'practice' && word.hint)
        ? button('Hint', { cls: 'btn btn-quiet', emoji: '\u{1F4A1}', onClick: () => toast(word.hint, { ms: 4000 }) })
        : null,
      physicalUsed
        ? button('Letters', { cls: 'btn btn-quiet', emoji: '\u2328',
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
    const letters = typed.split('');
    letters.forEach((ch, i) => {
      let cls = 'tile';
      if (state === 'good') cls += ' good';
      if (state === 'bad')  cls += ' bad';
      tiles.append(el('div', { class: cls, text: ch, key: i }));
    });
    if (state === 'typing') {
      tiles.append(el('div', { class: 'tile empty caret' }));
    }
  }

  /* ---------- Keyboard ----------
     The app never uses the system keyboard. Gboard's suggestion strip
     would offer her the correctly spelled word while she is being asked
     to spell it, which would quietly defeat the whole app. */
  function buildKeyboard() {
    clear(keyboard);
    if (settings().keyboardLayout === 'abc') buildAbcKeyboard();
    else buildQwertyKeyboard();
  }

  // Function declarations, not const arrows: buildKeyboard() runs during
  // setup, well before this point in the source is reached.
  function letterKey(ch) {
    return el('button', {
      class: 'key', type: 'button', text: ch,
      style: { gridColumn: 'span 2' },
      onClick: () => typeLetter(ch),
    });
  }

  /* Twenty-four half-columns per row is what lets the home row sit half a
     key right of the top row, and the bottom row a key and a half right of
     that — the same stagger her fingers meet on the Bluetooth keyboard. */
  function buildQwertyKeyboard() {
    QWERTY_ROWS.forEach(row => {
      const grid = el('div', { class: 'kb-grid' });

      if (row.leadShift) {
        grid.append(el('div', { class: 'key key-shift', style: { gridColumn: 'span 3' },
          text: '\u21E7', 'aria-hidden': 'true' }));
      } else if (row.lead) {
        grid.append(el('div', { style: { gridColumn: `span ${row.lead}` } }));
      }

      row.keys.split('').forEach(ch => grid.append(letterKey(ch)));

      if (row.end === 'del') {
        grid.append(el('button', { class: 'key key-del', type: 'button', text: '\u232B',
          style: { gridColumn: 'span 4' }, 'aria-label': 'Delete', onClick: backspace }));
      } else if (row.end === 'enter') {
        grid.append(el('button', { class: 'key key-enter', type: 'button', text: 'Check',
          style: { gridColumn: 'span 3' }, onClick: submit }));
      } else {
        // Right shift: a landmark for her hands, not a working key.
        grid.append(el('div', { class: 'key key-shift', style: { gridColumn: 'span 7' },
          text: '\u21E7', 'aria-hidden': 'true' }));
      }
      keyboard.append(grid);
    });
  }

  function buildAbcKeyboard() {
    ABC_ROWS.forEach(rowText => {
      const row = el('div', { class: 'kb-row' });
      rowText.split('').forEach(ch => row.append(el('button', {
        class: 'key', type: 'button', text: ch, onClick: () => typeLetter(ch),
      })));
      keyboard.append(row);
    });
    keyboard.append(el('div', { class: 'kb-row' },
      el('button', { class: 'key key-wide key-del', type: 'button', text: '\u232B',
        'aria-label': 'Delete', onClick: backspace }),
      el('button', { class: 'key key-wide key-enter', type: 'button', text: 'Check',
        onClick: submit })
    ));
  }

  function typeLetter(ch) {
    if (locked) return;
    if (typed.length >= 24) return;
    typed += ch;
    renderTiles();
  }

  function backspace() {
    if (locked) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  /* A Bluetooth keyboard is the better way to practise typing, so when one
     starts being used the on-screen letters step aside and give the screen
     back. A button brings them back if she puts the keyboard down. */
  function notePhysicalKeyboard() {
    if (physicalUsed) return;
    physicalUsed = true;
    stage.classList.add('physical-kb');
    toast('Using your keyboard \u2014 tap \u2328 to show the letters again.', { ms: 4200 });
    renderHelp();
  }

  const onKeyDown = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (locked && e.key !== 'Enter') return;
    if (/^[a-zA-Z']$/.test(e.key)) { notePhysicalKeyboard(); typeLetter(e.key.toLowerCase()); e.preventDefault(); }
    else if (e.key === 'Backspace') { notePhysicalKeyboard(); backspace(); e.preventDefault(); }
    else if (e.key === 'Enter') { notePhysicalKeyboard(); submit(); e.preventDefault(); }
  };
  addEventListener('keydown', onKeyDown);
  cleanupFns.push(() => removeEventListener('keydown', onKeyDown));

  /* ---------- Checking ---------- */

  function submit() {
    if (locked) return;
    const word = currentWord();
    const attempt = typed.trim().toLowerCase();
    if (!attempt) { toast('Tap the letters to spell the word'); return; }

    const correct = attempt === word.text.trim().toLowerCase();

    // A retry is a second look at the same word, for learning. It is not
    // scored again, so a miss can never be double-counted against her.
    if (!retrying) {
      const outcome = words.recordAttempt(word.id, correct, sessionId);
      if (outcome?.justMastered) masteredThisSession.push(word);
      results[index] = { wordId: word.id, text: word.text, typed: attempt, correct };
    }
    retrying = false;
    locked = true;

    if (mode === 'test') {
      renderTiles();
      renderPips();
      setTimeout(next, 420);
      return;
    }

    correct ? showCorrect(word) : showAlmost(word, attempt);
  }

  function showCorrect(word) {
    stage.classList.add('showing-feedback');
    renderTiles('good');
    renderPips();
    speech.stop();

    const justMastered = masteredThisSession.includes(word);
    mount(feedback, el('div', { class: 'feedback feedback-good' },
      el('span', { class: 'big', text: justMastered ? '⭐ ' + pet.praiseMastered() : pet.praiseCorrect() }),
      el('div', { class: 'correct-spelling', text: word.text }),
      masteryDots(word)
    ));

    if (justMastered) confetti(28);
    setTimeout(next, justMastered ? 2200 : 1300);
  }

  function showAlmost(word, attempt) {
    stage.classList.add('showing-feedback');
    renderTiles('bad');
    tiles.classList.add('shake');
    setTimeout(() => tiles.classList.remove('shake'), 420);
    renderPips();

    mount(feedback, el('div', { class: 'feedback feedback-almost' },
      el('span', { class: 'big', text: pet.praiseAlmost() }),
      el('div', { class: 'your-try', text: attempt }),
      el('div', { class: 'correct-spelling', text: word.text }),
      el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } },
        button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}', onClick: () => speech.speakWord(word) }),
        button('Show me', { cls: 'btn btn-quiet', emoji: '\u{1F524}', onClick: () => speech.spellOut(word) }),
        button('Try again', { cls: 'btn btn-primary', onClick: () => { retrying = true; showWord({ speakIt: true }); } })
      ),
      el('div', { class: 'tiny muted', style: { marginTop: '10px' },
        text: 'This word will come back soon so you can get it.' })
    ));
  }

  function masteryDots(word) {
    const have = words.credits(word);
    const need = words.threshold();
    const wrap = el('div', { class: 'mastery-dots', style: { justifyContent: 'center', marginTop: '6px' } });
    for (let i = 0; i < need; i++) wrap.append(el('div', { class: i < have ? 'mdot on' : 'mdot' }));
    return el('div', { class: 'center' }, wrap);
  }

  function next() {
    index += 1;
    if (index >= queue.length) return finish();
    showWord({ speakIt: true });
  }

  /* ---------- End of session ---------- */

  function finish() {
    speech.stop();

    const attempted = results.filter(Boolean).length;
    const correct   = results.filter(r => r?.correct).length;
    const missed    = results.filter(r => r && !r.correct);

    const earned = rewards.payForSession({
      correct, attempted, mastered: masteredThisSession.length, isTest: mode === 'test',
    });

    update(state => {
      state.progress.sessionsCompleted += 1;
      if (mode === 'test') state.progress.testsCompleted += 1;
      state.sessions.push({
        id: sessionId, mode, at: Date.now(),
        attempted, correct,
        results: results.filter(Boolean).map(r => ({ wordId: r.wordId, correct: r.correct })),
      });
      if (state.sessions.length > 60) state.sessions = state.sessions.slice(-60);
    });

    const streak = rewards.touchStreak();
    const milestones = rewards.checkMilestones();

    if (correct === attempted && attempted > 0) confetti(48);

    releaseLayout();
    mount(container, resultsScreen({ attempted, correct, missed, earned, streak, milestones }));
  }

  function resultsScreen({ attempted, correct, missed, earned, streak, milestones }) {
    const petInfo = pet.pet();

    const headline = correct === attempted
      ? 'Every single one!'
      : correct >= attempted / 2 ? 'Nice work!' : 'Good effort — you tried them all.';

    const body = el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F389}' }),
        el('h2', { text: headline }),
        el('p', { class: 'muted', text: `${correct} of ${attempted} spelled correctly` }),
        el('div', { class: 'row', style: { justifyContent: 'center' } },
          el('div', { class: 'star-chip' },
            el('span', { class: 'star-chip-icon', text: '★' }), `+${earned}`)
        )
      )
    );

    if (masteredThisSession.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: `⭐ Mastered ${masteredThisSession.length === 1 ? 'a new word' : 'new words'}!` }),
        el('p', { class: 'muted tiny', text: `${petInfo.name} is so proud. These words leave your practice list now.` }),
        el('div', { class: 'stack-sm' },
          masteredThisSession.map(w => el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: w.text }),
            el('div', { class: 'badge badge-mastered', text: '⭐ Mastered' })
          ))
        )
      ));
    }

    if (streak.isNewDay && streak.streak > 1) {
      body.append(el('div', { class: 'card center' },
        el('h3', { text: `\u{1F525} ${streak.streak}-day practice streak!` }),
        streak.isRecord ? el('p', { class: 'muted tiny', text: 'That is your best one yet.' }) : null
      ));
    }

    milestones.forEach(m => {
      body.append(el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2rem' }, text: m.emoji }),
        el('h3', { text: m.title }),
        el('p', { class: 'muted tiny', text: m.blurb }),
        m.item ? el('p', { class: 'tiny', text: `You earned: ${m.item.emoji} ${m.item.name}` }) : null
      ));
    });

    if (missed.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: 'Words to look at again' }),
        el('div', { class: 'stack-sm' },
          missed.map(r => el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: r.text }),
            el('div', { class: 'w-meta', text: `you wrote: ${r.typed}` }),
            el('button', {
              class: 'icon-btn', type: 'button', 'aria-label': `Hear ${r.text}`,
              onClick: () => speech.speak(r.text),
            }, '\u{1F50A}')
          ))
        ),
        button('Practice these', {
          cls: 'btn btn-primary btn-block', emoji: '\u{1F504}',
          style: { marginTop: '12px' },
          onClick: () => {
            setQueue(missed.map(r => words.wordById(r.wordId)).filter(Boolean));
            navigate('/practice');
          },
        })
      ));
    }

    body.append(el('div', { class: 'row' },
      button('Do more', { cls: 'btn btn-green grow', emoji: '➕',
        onClick: rerender }),
      button('Go home', { cls: 'btn btn-primary grow', emoji: '\u{1F3E0}',
        onClick: () => navigate('/') })
    ));

    return body;
  }

  return () => cleanupFns.forEach(f => f());
}

/* ---------- Nothing to practise yet ---------- */

function emptyState(pool) {
  if (pool === 'mastered') {
    return el('div', { class: 'card center stack' },
      el('div', { style: { fontSize: '2.4rem' }, text: '⭐' }),
      el('h2', { text: 'No mastered words yet' }),
      el('p', { class: 'muted', text: 'Keep practising — they will show up here.' }),
      button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') })
    );
  }
  return el('div', { class: 'card center stack' },
    el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F389}' }),
    el('h2', { text: 'Nothing to practise!' }),
    el('p', { class: 'muted', text:
      'Every word has been mastered, or there are no words yet. A grown-up can add this week’s list in the Parent Area.' }),
    el('div', { class: 'row', style: { justifyContent: 'center' } },
      button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') }),
      button('Parent Area', { cls: 'btn btn-quiet', onClick: () => navigate('/parent') })
    )
  );
}
