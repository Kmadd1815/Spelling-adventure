/* The mini-games: what they are, what they pay, and the rules they all share.

   Games are the fun way round the same words, not a second spelling engine.
   Three rules keep them in their place, and all three live here rather than
   inside any one game:

     1. Mastery still belongs to words.js. A game can hand a word a credit,
        but only a game where she spells the whole word from memory, and
        only when she gets it right. A game can never take a credit away —
        losing at a game she is playing for fun must not undo a word she
        knows. See recordGameAttempt().

     2. Games pay less than practice, and paying is spread across the six
        of them: the first go at each game today pays properly, a second go
        pays a token, and there is a daily ceiling on the lot. Playing three
        different games is worth about a day's practice; playing one game
        thirty times is not.

     3. Every game gets the axolotl. See ui/buddy.js.
*/

import { getState, update } from './state.js';
import { awardStars } from './rewards.js';
import * as words from './words.js';

/* ---------- The ceiling ----------
   Today's Practice plus a test comes to roughly 15-30 stars on a good day.
   Games top out a little under that, and only by playing several different
   ones, so the shop ladder still runs on spelling. */
export const DAILY_CAP = 25;

/** What a repeat go at the same game pays, once the first one is banked. */
const REPEAT_PAY = 1;

/**
 * The catalogue.
 *
 * canMaster  false everywhere now: mastery is five correct answers in a
 *            row on the Practice Test or the Spelling Test, and nothing
 *            else moves it. The field stays so that rule has one obvious
 *            place to live if it ever changes back.
 *
 *            It used to mean: true only where she spells a whole word from
 *            memory with nothing to copy and no way to stumble onto the
 *            answer. Word Search shows her the spelling; Snake and Swim can
 *            be brute-forced by swimming into letters to see what happens.
 *            Those are recorded in her history but never move the streak.
 * minWords   how many words the game needs before it makes any sense.
 * pay        base for finishing, perWord for each word she got, and a
 *            bonus for a clean run.
 * scene      which painted backdrop the game sits on — see css/app.css.
 */
export const GAMES = [
  {
    id: 'wordsearch', name: 'Word Search', emoji: '\u{1F50D}', tint: 't-green',
    blurb: 'Find your spelling words hidden in the letters.',
    buddyRole: 'Cheers you on from the side',
    minWords: 4, canMaster: false,
    pay: { base: 3, perWord: 1, perfect: 2 },
    scene: 'paper',
    load: () => import('../games/wordsearch.js'),
  },
  {
    id: 'fillgap', name: 'Fill the Gap', emoji: '\u{1F4DD}', tint: 't-teal',
    blurb: 'Read the sentence and spell the word that is missing.',
    buddyRole: 'Reads the sentence with you',
    /* The only game that can teach a homophone: their and there sound the
       same, so the sentence round the gap is the only thing that tells her
       which one to write. */
    minWords: 2, canMaster: false,
    pay: { base: 4, perWord: 1, perfect: 4 },
    scene: 'paper',
    load: () => import('../games/fillgap.js'),
  },
  {
    id: 'crossword', name: 'Crossword', emoji: '\u{1F9E9}', tint: 't-blue',
    blurb: 'Read the clue, then spell the word into the squares.',
    buddyRole: 'Reads the clues with you',
    minWords: 4, canMaster: false,
    pay: { base: 4, perWord: 1, perfect: 4 },
    scene: 'paper',
    load: () => import('../games/crossword.js'),
  },
  {
    id: 'tictactoe', name: 'Tic Tac Toe', emoji: '⭕', tint: 't-orange',
    blurb: 'Spell a word right to claim a square. Beat the axolotl!',
    buddyRole: 'Plays against you',
    minWords: 3, canMaster: false,
    pay: { base: 4, perWord: 1, perfect: 3 },
    scene: 'party',
    load: () => import('../games/tictactoe.js'),
  },
  {
    id: 'snake', name: 'Word Snake', emoji: '\u{1F40D}', tint: 't-purple',
    blurb: 'Hear the word, then swim around collecting its letters in order.',
    buddyRole: 'You play as the axolotl',
    minWords: 1, canMaster: false,
    pay: { base: 3, perWord: 2, perfect: 2 },
    scene: 'pond',
    load: () => import('../games/snake.js'),
  },
  {
    id: 'tower', name: 'Tower Builder', emoji: '\u{1F3F0}', tint: 't-gold',
    blurb: 'Guess the letters and build the tower block by block.',
    buddyRole: 'Builds the tower for you',
    minWords: 1, canMaster: false,
    pay: { base: 3, perWord: 2, perfect: 3 },
    scene: 'meadow',
    load: () => import('../games/tower.js'),
  },
  {
    id: 'swim', name: 'Axolotl Swim', emoji: '\u{1F30A}', tint: 't-pink',
    blurb: 'Swim up and down past the rocks, catching your letters.',
    buddyRole: 'You play as the axolotl',
    minWords: 1, canMaster: false,
    pay: { base: 3, perWord: 2, perfect: 2 },
    scene: 'shore',
    load: () => import('../games/swim.js'),
  },
];

export const byId = id => GAMES.find(g => g.id === id) || null;

/* ---------- Words for a game ----------

   Active words first, exactly like practice. If she has mastered nearly
   everything, mastered words fill the gap rather than the game refusing to
   open: meeting an old word inside a game is a nice thing, and since games
   cannot take mastery away it costs her nothing.
*/

export function gameWords(count = 6, { minLength = 1, needsClue = false } = {}) {
  const usable = w => w.text.replace(/[^a-z']/gi, '').length >= minLength
    && (!needsClue || !!(w.definition || w.sentence));

  const active = words.pickWords({ count: count * 3, pool: 'active' }).filter(usable);
  const chosen = active.slice(0, count);

  if (chosen.length < count) {
    const have = new Set(chosen.map(w => w.id));
    for (const w of words.masteredWords().filter(usable)) {
      if (chosen.length >= count) break;
      if (!have.has(w.id)) chosen.push(w);
    }
  }
  return chosen;
}

/** Can this game be played right now, and if not, why not? */
export function availability(game) {
  const pool = gameWords(game.minWords, {
    minLength: game.id === 'crossword' ? 3 : 1,
    needsClue: false,
  });
  if (pool.length >= game.minWords) return { ok: true };
  return {
    ok: false,
    reason: words.allWords().length === 0
      ? 'Ask a grown-up to add your spelling list first.'
      : `Needs ${game.minWords} words — you have ${pool.length}.`,
  };
}

/* ---------- Recording ----------

   The single door between a game and mastery, deliberately narrow.
   `countsForMastery` is only ever true when the game is one that asks her
   to spell from memory AND she got it right, so a game can add to a streak
   and can never break one.
*/

export function recordGameAttempt(wordId, wasCorrect, { canMaster = false } = {}) {
  /* No game moves mastery any more — the two tests are the only things
     that do. The `canMaster` flag stays in the registry because it is what
     the hub uses to say so, and because the rule belongs in one place
     rather than in six games. */
  return words.recordAttempt(wordId, wasCorrect, { countsForMastery: false });
}

/* ---------- Today's game earnings ---------- */

function today() { return words.dayKey(); }

function ledger(state) {
  const p = state.progress;
  if (!p.gameDay || p.gameDay.day !== today()) {
    p.gameDay = { day: today(), stars: 0, plays: {} };
  }
  return p.gameDay;
}

/** Read-only view of what games have paid today. */
export function todaysGameStars() {
  const day = getState().progress.gameDay;
  return day && day.day === today() ? day.stars : 0;
}

export function playedToday(gameId) {
  const day = getState().progress.gameDay;
  if (!day || day.day !== today()) return 0;
  return day.plays[gameId] || 0;
}

export function starsLeftToday() {
  return Math.max(0, DAILY_CAP - todaysGameStars());
}

/**
 * Work out what a finished game pays, and bank the play.
 *
 * Returns itemised lines the same shape payForActivity() uses, so the
 * results screen can show a game's stars exactly the way it shows a
 * practice session's — she should be able to read where every star came
 * from, in every activity.
 *
 * Nothing here is ever negative, and a capped-out day still finishes with a
 * warm line rather than a zero.
 *
 * @returns {{lines: Array<{label: string, stars: number}>, total: number,
 *            capped: boolean, repeat: boolean}}
 */
export function scoreGame({ gameId, wordsWon = 0, bonus = false, bonusLabel = '' }) {
  const game = byId(gameId);
  if (!game) return { lines: [], total: 0, capped: false, repeat: false };

  const payout = update(state => {
    const day = ledger(state);
    const priorPlays = day.plays[gameId] || 0;
    const repeat = priorPlays > 0;
    const room = Math.max(0, DAILY_CAP - day.stars);

    day.plays[gameId] = priorPlays + 1;

    const lines = [];
    const add = (label, stars) => { if (stars > 0) lines.push({ label, stars }); };

    let want;
    if (repeat) {
      want = REPEAT_PAY;
      add(`Another go at ${game.name}`, REPEAT_PAY);
    } else {
      add(`Finished ${game.name}`, game.pay.base);
      add(`${wordsWon} ${wordsWon === 1 ? 'word' : 'words'} you got`, wordsWon * game.pay.perWord);
      if (bonus) add(bonusLabel || 'Perfect game!', game.pay.perfect);
      want = lines.reduce((sum, l) => sum + l.stars, 0);
    }

    // Trim to whatever is left of the day's game allowance, cheapest line
    // first so the headline "finished it" star is the last thing to go.
    let total = Math.min(want, room);
    const capped = total < want;
    if (capped) {
      let budget = total;
      for (const line of lines) {
        const take = Math.min(line.stars, budget);
        line.stars = take;
        budget -= take;
      }
    }
    day.stars += total;

    return { lines: lines.filter(l => l.stars > 0), total, capped, repeat };
  });

  if (payout.total > 0) awardStars(payout.total, `game:${gameId}`);
  return payout;
}
