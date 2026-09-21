/* The pet.

   Hard rule from the design: the pet is a companion, never a chore. It has
   no hunger, no mood decay, no illness, and it never mentions how long it
   has been. There is no code path in this file that can make it sad.

   Growth comes from mastered words, not from opening the app.
*/

import { getState, update } from './state.js';
import { emit } from './bus.js';
import { masteredWords } from './words.js';

/* One animal, on purpose.

   Every future feature — outfits, hats, holiday costumes, growth-stage
   art, animations — has to be drawn once per species. Keeping that at one
   means all of it can be good, instead of six of it being adequate.

   Coats are free by comparison: they are four fill values on the same
   drawing, so she still gets to make the axolotl hers. */

export const AXOLOTL = { key: 'axolotl', name: 'Axolotl', emoji: '\u{1F984}' };

/* Coats are named loosely after real axolotl morphs. They are four fill
   values on the same drawing, so personalising the pet costs nothing that
   outfits and costumes would later have to be drawn twice for. */
export const COATS = [
  { key: 'peach',    name: 'Peach',    body: '#f7bdd0', belly: '#fde9f1', gill: '#f2849f', dark: '#b56a83', accent: '#e79fb7' },
  { key: 'gold',     name: 'Gold',     body: '#f5d290', belly: '#fdf4dd', gill: '#eeab4e', dark: '#a8833f', accent: '#dfb76d' },
  { key: 'mint',     name: 'Mint',     body: '#a8dbc7', belly: '#e9f7f0', gill: '#6cc0a2', dark: '#5c9480', accent: '#84c8af' },
  { key: 'lavender', name: 'Lavender', body: '#c6b6e0', belly: '#f2ecfb', gill: '#a58ed0', dark: '#7b6a9c', accent: '#a694cc' },
];

export function coatByKey(key) {
  return COATS.find(c => c.key === key) || COATS[0];
}

/* ---------- Growth ---------- */

export const STAGES = [
  { key: 'baby',    name: 'Baby',    at: 0,   headScale: 1.16, bodyScale: 0.84, gill: 0.68 },
  { key: 'child',   name: 'Little',  at: 8,   headScale: 1.08, bodyScale: 0.93, gill: 0.84 },
  { key: 'teen',    name: 'Big Kid', at: 25,  headScale: 1.00, bodyScale: 1.00, gill: 1.00 },
  { key: 'adult',   name: 'Grown',   at: 55,  headScale: 0.95, bodyScale: 1.07, gill: 1.12 },
  { key: 'radiant', name: 'Radiant', at: 110, headScale: 0.95, bodyScale: 1.12, gill: 1.22, sparkle: true },
];

export function stageFor(masteredCount) {
  let stage = STAGES[0];
  for (const s of STAGES) if (masteredCount >= s.at) stage = s;
  return stage;
}

export function currentStage() {
  return stageFor(masteredWords().length);
}

/** Progress toward the next growth stage, for the pet screen's meter. */
export function growthProgress() {
  const count = masteredWords().length;
  const stage = stageFor(count);
  const idx = STAGES.indexOf(stage);
  const next = STAGES[idx + 1] || null;
  if (!next) return { stage, next: null, have: count, goal: count, pct: 1 };
  const span = next.at - stage.at;
  return {
    stage,
    next,
    have: count - stage.at,
    goal: span,
    pct: span > 0 ? Math.min(1, (count - stage.at) / span) : 1,
  };
}

/* ---------- Identity ---------- */

export function pet() {
  const c = getState().child;
  return {
    species: AXOLOTL,
    coat: coatByKey(c.petCoat),
    name: c.petName || AXOLOTL.name,
    stage: currentStage(),
    mastered: masteredWords().length,
  };
}

export function setPet({ coat, name }) {
  update(state => {
    if (coat) state.child.petCoat = coat;
    if (name !== undefined) state.child.petName = String(name).trim().slice(0, 16);
  });
}

/* ---------- Moods ----------
   A face, not a state. Nothing here decays, and there is no mood the pet
   can fall into on its own — every one of these is a reaction to something
   she just did. */

export const MOODS = ['calm', 'happy', 'excited', 'love', 'munch', 'sleepy'];

/* ---------- Treats ----------

   Treats are earned by spelling and spent on giving the axolotl something
   nice. They are a gift she gets to give, never an upkeep cost: running out
   of treats changes nothing about the pet, which stays exactly as happy and
   is still there to be played with for free.

   There is deliberately no code anywhere that reads the treat count and
   makes the pet worse off. */

export function treats() {
  return getState().progress.treats || 0;
}

export function earnTreats(n, reason = '') {
  const count = Math.max(0, Math.round(n));
  if (!count) return 0;
  update(state => { state.progress.treats = (state.progress.treats || 0) + count; });
  emit('treats:earned', { count, reason });
  return count;
}

/** Spend one treat. Returns false when there are none — and nothing bad
    happens as a result; the free interactions are always available. */
export function spendTreat() {
  if (treats() < 1) return false;
  update(state => { state.progress.treats -= 1; });
  return true;
}

/** A warm tally that only ever goes up. Never a meter, never a target. */
export function moments() {
  return getState().progress.petMoments || 0;
}

export function noteMoment() {
  update(state => { state.progress.petMoments = (state.progress.petMoments || 0) + 1; });
}

/* ---------- What the pet says ----------

   Every line here is either neutral or warm. None of them mention absence,
   none of them ask for anything, and none of them imply the pet needs
   looking after. Returning after two months gets the same welcome as
   returning after two hours.
*/

const GREETINGS = [
  'Hi! Want to play?',
  "I'm so glad you're here.",
  'Ready when you are!',
  'What should we do today?',
  'You are my favourite speller.',
  'I was just daydreaming about words.',
  'Hello, friend!',
  'Look at us, back together.',
  'I like it when you visit.',
  'Shall we go on a word adventure?',
];

const CORRECT_LINES = [
  'You got it!',
  'Perfect!',
  'Awesome!',
  'Yes! That is exactly right.',
  "I'm so proud of you.",
  'Nailed it!',
  'Look at that spelling!',
  'Wonderful!',
];

/* Never "wrong". Never "failed". Always pointing forward. */
const ALMOST_LINES = [
  'Almost! Let us look closely at that one.',
  "You're getting closer.",
  'Nearly there — try it once more.',
  'That was a tricky one. Here it is again.',
  'Good try! Watch the letters this time.',
  "Let's take another run at it.",
];

const MASTERED_LINES = [
  'You mastered that word!',
  'That word is yours now.',
  'You really know that one.',
  'Mastered! Look at you go.',
];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const greeting       = () => pick(GREETINGS);
export const praiseCorrect  = () => pick(CORRECT_LINES);
export const praiseAlmost   = () => pick(ALMOST_LINES);
export const praiseMastered = () => pick(MASTERED_LINES);

export const INTERACTIONS = {
  pet: {
    key: 'pet', label: 'Pet', emoji: '\u{1F91A}', cost: 0, mood: 'love', effect: 'hearts',
    lines: ['That is the best.', 'Hee hee!', 'More please!', 'You give the nicest pats.',
            'I like you a lot.', '*happy wiggle*'],
  },
  splash: {
    key: 'splash', label: 'Splash', emoji: '\u{1FAE7}', cost: 0, mood: 'happy', effect: 'bubbles',
    lines: ['Splashy splashy!', 'Bubbles everywhere!', 'Watch this one \u2014 it is huge.',
            'Blub blub blub.', 'The water is perfect today.'],
  },
  feed: {
    key: 'feed', label: 'Feed', emoji: '\u{1F353}', cost: 1, mood: 'munch', effect: 'crumbs',
    lines: ['Mmm, my favourite!', 'Nom nom nom.', 'Thank you!', 'That was delicious.',
            'You always pick the good ones.'],
  },
  play: {
    key: 'play', label: 'Play', emoji: '\u{1FA80}', cost: 1, mood: 'excited', effect: 'sparkles',
    lines: ['Again! Again!', 'I am SO fast.', 'This is the best game.',
            'Did you see that?!', 'Whee!'],
  },
  cuddle: {
    key: 'cuddle', label: 'Cuddle', emoji: '\u{1F917}', cost: 1, mood: 'love', effect: 'hearts',
    lines: ['Cozy.', 'I could stay here forever.', 'You are my favourite person.',
            'Warm and squishy.', '*contented sigh*'],
  },
};

export function interactionLine(key) {
  const set = INTERACTIONS[key];
  return set ? pick(set.lines) : pick(GREETINGS);
}

export function stageUpLine(stage) {
  return `${pet().name} grew into a ${stage.name}!`;
}
