/* Letters.

   The last of the five things she earns, at a hundred and ten mastered
   words, and the only one that is not a place. An axolotl called Marbles
   lives in a pond a long way off and writes to her. She writes back, and
   the way she writes back is by spelling.

   THE PROBLEM THIS FILE EXISTS TO SOLVE. A pen pal is a lovely idea that
   goes stale in a fortnight, because a fixed set of letters runs out and
   the child notices the second time she reads one. Writing three hundred
   letters is not a fix either; it is the same problem further away.

   So the letters are not written in advance. They are assembled out of
   things the app already knows about HER: the word she mastered most
   recently, what she has put in her pond, how many leaves are on her word
   tree, what her duckling is called, what the season is doing, how many
   days she has practised. Those change constantly, so the letters change
   constantly, and the handful of sentence shapes underneath never has to
   carry the whole job.

   And Marbles ALWAYS mentions what she sent last time. That is the one
   thing that turns a stream of messages into a correspondence, and it is
   the reason the words she spells are kept with the letter she put them
   in rather than being scored and thrown away.

   WHAT IT IS NOT. It is not a test. She picks which of her words to use,
   she hears it before she spells it, and she gets another go if it comes
   out wrong — so it is not the honest measure the Practice Test and the
   Spelling Test are, and nothing here can move a word towards mastery.
   It pays stars, like the games. See the note in core/games.js; the rule
   is the same rule.
*/

import { getState, update } from './state.js';
import { masteredWords, allWords, dayKey } from './words.js';
import * as items from './items.js';

/** Mastered words before the first letter arrives. */
export const LETTERS_AT = 110;

/** How long between letters. Long enough that a letter is an event. */
export const DAYS_BETWEEN = 2;

/** How many of her words to offer for each blank. */
export const WORD_CHOICES = 3;

/** How much of the correspondence to keep. Forty is months of it. */
const KEEP = 40;

export const PAL = { name: 'Marbles', coat: 'mint', pond: 'the Green Pond' };

const blank = { thread: [], lastArrivedAt: null, unread: false };

export function letters() {
  return { ...blank, ...(getState().letters || {}) };
}

export const mastered = () => masteredWords().length;
export const lettersOpen = () => mastered() >= LETTERS_AT;
export const wordsToGo = () => Math.max(0, LETTERS_AT - mastered());

export function gateLine() {
  const left = wordsToGo();
  if (left === 0) return 'There is a letter for you!';
  if (left === 1) return 'One more mastered word and the first letter comes!';
  if (left <= 5)  return `Nearly! ${left} more mastered words and a letter will come.`;
  return `Somebody wants to write to you. ${left} more mastered words and the first ` +
         'letter arrives!';
}

/* ---------- The thread ---------- */

export const thread = () => letters().thread;
export const lastLetter = () => {
  const t = thread();
  for (let i = t.length - 1; i >= 0; i--) if (t[i].from === 'pal') return t[i];
  return null;
};

/** Is there a letter sitting there she has not answered? */
export function waiting() {
  const t = thread();
  return t.length > 0 && t[t.length - 1].from === 'pal';
}

/**
 * Is a new letter due?
 *
 * Never while one is already waiting: one letter at a time, so a fortnight
 * away comes back to a letter rather than to a pile of them with a number
 * on it. Nothing in this app should ever look like an inbox.
 */
export function letterDue(now = Date.now()) {
  if (!lettersOpen()) return false;
  if (waiting()) return false;
  const { lastArrivedAt } = letters();
  if (!lastArrivedAt) return true;         // the very first one
  return now - lastArrivedAt >= DAYS_BETWEEN * 86400000;
}

/* ---------- What Marbles knows about her ----------

   Every one of these comes back null when there is nothing to say, and
   the letter simply uses a different line. A letter that says "I love
   your 0 leaves" is worse than one that never mentions the tree. */

function herThings() {
  const state = getState();
  const mast = masteredWords();
  const newest = mast.slice().sort((a, b) => (b.masteredAt || 0) - (a.masteredAt || 0))[0];
  const worn = items.equipped();
  const named = id => (id ? items.byId(id)?.name || null : null);

  const inPond = ['pondFeature', 'pondPlant', 'pondFriend']
    .flatMap(slot => items.inSlot(slot))
    .map(named).filter(Boolean);
  const inGarden = ['tree', 'water', 'gardenDecor']
    .flatMap(slot => items.inSlot(slot))
    .map(named).filter(Boolean);
  const inRoom = ['bed', 'rug', 'floorDecor', 'wallDecor']
    .flatMap(slot => items.inSlot(slot))
    .map(named).filter(Boolean);

  return {
    childName: state.child?.name || null,
    petName: state.child?.petName || 'your axolotl',
    friendName: state.friend?.hatchedAt ? (state.friend.name || 'your duckling') : null,
    newestWord: newest?.text || null,
    leaves: mast.length,
    words: allWords().length,
    practiceDays: state.progress?.practiceDays ?? state.progress?.streakBest ?? 0,
    inPond, inGarden, inRoom,
  };
}

const pick = list => list[Math.floor(Math.random() * list.length)];
const pickSome = (list, n) => {
  const copy = list.slice();
  const out = [];
  while (copy.length && out.length < n) out.push(...copy.splice(Math.floor(Math.random() * copy.length), 1));
  return out;
};

/* ---------- Marbles' news ----------

   His own small life, which is the part that does repeat — so it is kept
   short and there is a lot of it, and it is never the whole letter. */
const NEWS = [
  'A heron stood at the end of my pond for the whole morning. I hid under a leaf.',
  'I have found the coldest corner of my pond and I am not telling anybody where it is.',
  'Three frogs moved in last week. They are very loud and I like them.',
  'I tried to count the stones on my bottom and got to forty and lost my place.',
  'It rained so hard yesterday that the whole pond went bumpy.',
  'A dragonfly landed on my head and stayed there. I did not move for ages.',
  'I have been practising swimming backwards. I am not good at it yet.',
  'The weed at my end has grown taller than me.',
  'Somebody dropped an apple in and it floated for two whole days.',
  'I watched the moon on the water until I fell asleep right there.',
  'There is a duck who visits and she is enormous.',
  'I made a nest out of leaves and then a fish sat in it.',
];

const OPENERS = [
  'Dear {child},',
  'Hello {child}!',
  'Dear {child},',
  '{child}!',
];

const SIGNOFFS = [
  'Write back soon,', 'Your friend,', 'From my pond to yours,',
  'Blub blub,', 'Until next time,',
];

/* The questions Marbles asks. Each one is answerable by spelling a word,
   which is the whole point of them. */
const QUESTIONS = [
  'What is the best word you know?',
  'Tell me a word you have just learned.',
  'What word did you find hardest this week?',
  'Send me your favourite word and I will try to spell it too.',
  'What is a word that sounds funny when you say it a lot?',
  'Tell me a long word. I like long ones.',
  'What word would you use to describe your pond?',
];

/**
 * A letter from Marbles, built out of what is true about her today.
 * @returns {{id:string, from:'pal', at:number, lines:string[], question:string}}
 */
export function composeLetter(now = Date.now()) {
  const her = herThings();
  const sent = lastSentWords();
  const lines = [];

  lines.push(pick(OPENERS).replace('{child}', her.childName || 'friend'));

  /* If she has written before, that is what he answers first — a letter
     that ignores what you sent is not a reply. */
  if (sent.length) {
    const w = sent[0];
    lines.push(pick([
      `Thank you for sending me ${quoteWords(sent)}. I have read ${sent.length > 1 ? 'them' : 'it'} about nine times.`,
      `${capitalise(w)}! What a word. I said it out loud to the frogs.`,
      `I have been practising ${quoteWords(sent)} all week. ${capitalise(w)} is my new favourite.`,
      `Your last letter had ${quoteWords(sent)} in it and I have not stopped thinking about ${sent.length > 1 ? 'them' : 'it'}.`,
    ]));
  }

  /* Something of hers. Whichever of these he has anything to say about. */
  const aboutHer = [];
  if (her.inPond.length) {
    aboutHer.push(`${capitalise(her.petName)} told me about the ${pick(her.inPond)} in your pond. ` +
      'I am a bit jealous.');
  }
  if (her.leaves >= 20) {
    aboutHer.push(`Somebody said your word tree has ${her.leaves} leaves on it now. ` +
      `${her.leaves >= 120 ? 'That is an enormous tree.' : 'That is a lot of words.'}`);
  }
  if (her.friendName) {
    aboutHer.push(`How is ${her.friendName}? Ducklings grow so fast.`);
  }
  if (her.inGarden.length) {
    aboutHer.push(`Is the ${pick(her.inGarden)} still in your garden? I would like to see it.`);
  }
  if (her.inRoom.length) {
    aboutHer.push(`${capitalise(her.petName)} says you have a ${pick(her.inRoom)} now. Very smart.`);
  }
  if (aboutHer.length) lines.push(pick(aboutHer));

  lines.push(pick(NEWS));

  const question = pick(QUESTIONS);
  lines.push(question);
  lines.push(pick(SIGNOFFS));
  lines.push(PAL.name);

  return { id: `l_${now.toString(36)}`, from: 'pal', at: now, lines, question };
}

/** The words she put in her last letter, newest first. */
export function lastSentWords() {
  const t = thread();
  for (let i = t.length - 1; i >= 0; i--) if (t[i].from === 'her') return t[i].words || [];
  return [];
}

const capitalise = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const quoteWords = ws => ws.length === 1 ? `"${ws[0]}"`
  : `${ws.slice(0, -1).map(w => `"${w}"`).join(', ')} and "${ws[ws.length - 1]}"`;

/* ---------- Her reply ----------

   Two blanks, not five. This is a letter, not a worksheet, and a child who
   has to spell five words to say hello stops writing letters. */
export const REPLY_SHAPES = [
  ['The best word I know is', 'and I also like'],
  ['Here is a word for you:', 'And here is a harder one:'],
  ['This week I learned', 'and'],
  ['My word for you today is', 'My axolotl picked'],
];

export function replyShape() {
  return pick(REPLY_SHAPES);
}

/**
 * Which of her words to offer for a blank. Mastered ones she can be proud
 * of, mixed with ones she is still learning, and never the same word twice
 * in one letter.
 */
export function wordChoices(exclude = []) {
  const skip = new Set(exclude.map(w => String(w).toLowerCase()));
  const usable = allWords().filter(w => !skip.has(w.text.toLowerCase()) && w.text.length >= 2);
  if (!usable.length) return [];
  const mast = usable.filter(w => w.masteredAt);
  const rest = usable.filter(w => !w.masteredAt);
  /* Two she knows and one she is working on, when there are enough of
     each — so writing a letter is mostly a victory lap with one stretch
     in it. */
  const out = [...pickSome(mast, 2), ...pickSome(rest, 1)];
  while (out.length < WORD_CHOICES && usable.length > out.length) {
    const more = pickSome(usable.filter(w => !out.includes(w)), 1);
    if (!more.length) break;
    out.push(...more);
  }
  return pickSome(out, Math.min(WORD_CHOICES, out.length));
}

/* ---------- Writing it down ---------- */

function put(entry) {
  update(state => {
    const l = { ...blank, ...(state.letters || {}) };
    l.thread = [...l.thread, entry].slice(-KEEP);
    if (entry.from === 'pal') { l.lastArrivedAt = entry.at; l.unread = true; }
    else l.unread = false;
    state.letters = l;
    return entry;
  });
  return entry;
}

/** Puts a new letter in the postbox, if one is due. */
export function deliverIfDue(now = Date.now()) {
  if (!letterDue(now)) return null;
  return put(composeLetter(now));
}

/** Her reply. `filled` is [{ lead, word }]. */
export function sendReply(filled, now = Date.now()) {
  const words = filled.map(f => f.word);
  /* Each half is a sentence of its own, so each one starts with a capital
     — "and I also like beneath." after a full stop is not a letter. */
  const lines = filled.map(f => `${capitalise(f.lead)} ${f.word}.`);
  return put({ id: `s_${now.toString(36)}`, from: 'her', at: now, lines, words });
}

export function markRead() {
  update(state => {
    const l = { ...blank, ...(state.letters || {}) };
    l.unread = false;
    state.letters = l;
  });
}

/** A plain-English date for the top of a letter. */
export function whenSent(at) {
  if (!at) return '';
  const days = Math.floor((Date.now() - at) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Used by the tests and the postbox: today's key, so a letter that came
    today can be told from one that came before. */
export const today = () => dayKey();
