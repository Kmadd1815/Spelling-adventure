/* The thing her list is actually about.

   A third-grade spelling list is almost never eight unrelated words. It is
   eight words that share one piece of spelling — train, paint, afraid,
   explain, brain are a list about ai — and the app treated them as eight
   separate things to memorise. Nobody ever said the quiet part out loud.

   This finds the pattern a list is built on, so the app can say it once:
   "all of this week's words have ai in them". One sentence turns eight
   things to remember into one thing to understand.

   It is deliberately cautious. It would rather say nothing than name a
   pattern that is not really there, because a wrong rule is worse than no
   rule: a list has to be mostly built on something before it is mentioned,
   and the everyday letter pairs that turn up in any list at all are not
   patterns, they are English.
*/

/* Each entry: the letters, where they have to sit, and how to say it to a
   child. `like` is a word she will know with the same pattern in it. */
const PATTERNS = [
  // Vowel teams — the backbone of a third-grade list.
  { key: 'ai',  where: 'in',  say: 'ai',  like: 'rain' },
  { key: 'ay',  where: 'end', say: 'ay',  like: 'play' },
  { key: 'ea',  where: 'in',  say: 'ea',  like: 'dream' },
  { key: 'ee',  where: 'in',  say: 'ee',  like: 'tree' },
  { key: 'oa',  where: 'in',  say: 'oa',  like: 'boat' },
  { key: 'oo',  where: 'in',  say: 'oo',  like: 'moon' },
  { key: 'ou',  where: 'in',  say: 'ou',  like: 'cloud' },
  { key: 'ow',  where: 'in',  say: 'ow',  like: 'snow' },
  { key: 'oi',  where: 'in',  say: 'oi',  like: 'coin' },
  { key: 'oy',  where: 'end', say: 'oy',  like: 'boy' },
  { key: 'au',  where: 'in',  say: 'au',  like: 'because' },
  { key: 'aw',  where: 'in',  say: 'aw',  like: 'draw' },
  { key: 'ew',  where: 'in',  say: 'ew',  like: 'flew' },
  { key: 'ie',  where: 'in',  say: 'ie',  like: 'field' },
  { key: 'ue',  where: 'in',  say: 'ue',  like: 'blue' },

  // Two letters, one sound.
  { key: 'ch',  where: 'in',  say: 'ch',  like: 'chair' },
  { key: 'sh',  where: 'in',  say: 'sh',  like: 'shell' },
  { key: 'th',  where: 'in',  say: 'th',  like: 'think' },
  { key: 'wh',  where: 'start', say: 'wh', like: 'whale' },
  { key: 'ph',  where: 'in',  say: 'ph',  like: 'phone' },
  { key: 'ck',  where: 'in',  say: 'ck',  like: 'duck' },
  { key: 'ng',  where: 'in',  say: 'ng',  like: 'ring' },

  // Letters you cannot hear.
  { key: 'kn',  where: 'start', say: 'a silent k', like: 'knee' },
  { key: 'wr',  where: 'start', say: 'a silent w', like: 'write' },
  { key: 'gh',  where: 'in',  say: 'gh',  like: 'night' },
  { key: 'mb',  where: 'end', say: 'a silent b', like: 'thumb' },

  // The bossy r.
  { key: 'ar',  where: 'in',  say: 'ar',  like: 'star' },
  { key: 'or',  where: 'in',  say: 'or',  like: 'storm' },
  { key: 'ir',  where: 'in',  say: 'ir',  like: 'bird' },
  { key: 'ur',  where: 'in',  say: 'ur',  like: 'turn' },

  // Endings and beginnings.
  { key: 'tion', where: 'end', say: '-tion', like: 'station' },
  { key: 'sion', where: 'end', say: '-sion', like: 'vision' },
  { key: 'ing',  where: 'end', say: '-ing',  like: 'jumping' },
  { key: 'est',  where: 'end', say: '-est',  like: 'fastest' },
  { key: 'ful',  where: 'end', say: '-ful',  like: 'helpful' },
  { key: 'less', where: 'end', say: '-less', like: 'fearless' },
  { key: 'ness', where: 'end', say: '-ness', like: 'kindness' },
  { key: 'ly',   where: 'end', say: '-ly',   like: 'slowly' },
  { key: 'ed',   where: 'end', say: '-ed',   like: 'jumped' },
  { key: 'er',   where: 'end', say: '-er',   like: 'faster' },
  { key: 'le',   where: 'end', say: '-le',   like: 'little' },
  { key: 'un',   where: 'start', say: 'un-', like: 'unhappy' },
  { key: 're',   where: 'start', say: 're-', like: 'redo' },
  { key: 'pre',  where: 'start', say: 'pre-', like: 'preview' },
  { key: 'dis',  where: 'start', say: 'dis-', like: 'disagree' },
];

/* Pairs this common turn up in any eight words you like, so they only
   count when nearly the whole list has them. */
const EVERYDAY = new Set(['er', 'ed', 'in', 'th', 'le', 're']);

function has(word, pattern) {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (pattern.where === 'start') return w.startsWith(pattern.key);
  if (pattern.where === 'end')   return w.endsWith(pattern.key);
  return w.includes(pattern.key);
}

/**
 * The pattern a set of words is built on, if there is one.
 *
 * @param {Array<{text: string}>|string[]} words
 * @returns {{ key: string, say: string, like: string, count: number,
 *             total: number, all: boolean, line: string } | null}
 */
export function patternOf(words) {
  const texts = (words || [])
    .map(w => (typeof w === 'string' ? w : w?.text) || '')
    .map(t => t.toLowerCase().replace(/[^a-z']/g, ''))
    .filter(t => t.length > 2);

  const total = texts.length;
  if (total < 3) return null;

  let best = null;
  for (const pattern of PATTERNS) {
    const count = texts.filter(t => has(t, pattern)).length;
    const needed = EVERYDAY.has(pattern.key)
      ? Math.max(4, Math.ceil(total * 0.85))
      : Math.max(3, Math.ceil(total * 0.6));
    if (count < needed) continue;

    /* More words beats fewer; the same number of words, and the longer
       pattern wins — a list of -tion words is about -tion, not about o. */
    const better = !best
      || count > best.count
      || (count === best.count && pattern.key.length > best.key.length);
    if (better) best = { ...pattern, count, total };
  }
  if (!best) return null;

  const all = best.count === total;
  const some = all ? 'All' : 'Most';

  /* Said the way the pattern actually works: a prefix is something words
     start with, an ending is something they end in, and everything else is
     something they have in them. */
  const body = best.where === 'start' ? `start with ${best.say}`
    : best.where === 'end' ? `end in ${best.say}`
    : `have ${best.say} in them`;

  return {
    key: best.key,
    say: best.say,
    like: best.like,
    where: best.where,
    count: best.count,
    total,
    all,
    line: `${some} of these words ${body} — like ${best.like}.`,
  };
}

/** The same thing, spoken rather than written. The dash that marks an
    ending on the page is not something a voice should try to read. */
export function patternSpoken(found) {
  if (!found) return '';
  const some = found.all ? 'All' : 'Most';
  const say = found.say.replace(/-/g, '');
  const body = found.where === 'start' ? `start with ${say}`
    : found.where === 'end' ? `end in ${say}`
    : `have ${say} in them`;
  return `${some} of these words ${body}, like ${found.like}.`;
}
