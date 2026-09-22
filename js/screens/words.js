/* My Words — the child's own view of her list.

   Two tabs, because the split is the whole point of the app: the words she
   is still working on, and the words she has finished with. Mastered words
   are visible and celebrated, but they only come back into practice if she
   deliberately asks for them. */

import { el, mount, button, segmented } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import * as words from '../core/words.js';
import * as speech from '../core/speech.js';
import { setQueue } from './spell.js';

export default function wordsScreen(container, params) {
  let tab = params.tab === 'mastered' ? 'mastered' : 'active';

  function render() {
    const active = words.activeWords();
    const mastered = words.masteredWords();

    const tabs = segmented([
      { value: 'active',   label: `Practicing (${active.length})` },
      { value: 'mastered', label: `Mastered (${mastered.length})` },
    ], tab, value => { tab = value; render(); });

    const list = tab === 'active' ? sortActive(active) : sortMastered(mastered);

    const body = el('div', { class: 'stack' }, tabs);

    if (!list.length) {
      body.append(el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.2rem' }, text: tab === 'active' ? '\u{1F389}' : '⭐' }),
        el('p', { class: 'muted', text: tab === 'active'
          ? 'No words to practice right now.'
          : 'Words you master will be kept here forever.' })
      ));
    } else {
      body.append(el('div', { class: 'stack-sm' }, list.map(row)));
    }

    if (tab === 'mastered' && mastered.length) {
      body.append(el('div', { class: 'card center' },
        el('p', { class: 'tiny muted', text:
          'These words are finished, so they stay out of your normal practice. You can still review them whenever you want.' }),
        button('Review mastered words', { cls: 'btn btn-quiet', emoji: '\u{1F504}',
          onClick: () => {
            setQueue(words.pickWords({ count: 8, pool: 'mastered' }));
            navigate('/practice');
          } })
      ));
    }

    if (tab === 'active' && list.length) {
      body.append(button('Practice these', { cls: 'btn btn-primary btn-block', emoji: '✨',
        onClick: () => navigate('/practice') }));
    }

    mount(container, body);
  }

  function row(word) {
    const status = words.statusOf(word);
    const have = words.credits(word);
    const need = words.threshold();

    /* Labelled, because a row of dots does not say what it is counting.
       "1 of 3" next to a word she has just spelled right twice looks like a
       broken counter; "1 of 3 days" is the whole explanation. */
    const dots = el('div', { class: 'mastery-dots' });
    for (let i = 0; i < need; i++) dots.append(el('div', { class: i < have ? 'mdot on' : 'mdot' }));
    const progress = el('div', { class: 'mastery-line' },
      dots,
      el('span', { class: 'w-meta',
        text: `${have} of ${need} ${need === 1 ? 'day' : 'days'}` })
    );

    return el('div', { class: 'word-row' },
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hear ${word.text}`,
        onClick: () => speech.speakWord(word) }, '\u{1F50A}'),
      el('div', { class: 'grow' },
        el('div', { class: 'w-text', text: word.text }),
        status.key === 'mastered'
          ? el('div', { class: 'w-meta', text: masteredOn(word) })
          : progress
      ),
      el('div', { class: `badge badge-${status.key}`, text: `${status.icon} ${status.kidLabel}` })
    );
  }

  render();
}

function sortActive(list) {
  const order = { learning: 0, new: 1, practicing: 2 };
  return list.slice().sort((a, b) => {
    const d = order[words.statusOf(a).key] - order[words.statusOf(b).key];
    return d || a.text.localeCompare(b.text);
  });
}

function sortMastered(list) {
  return list.slice().sort((a, b) => (b.masteredAt || 0) - (a.masteredAt || 0));
}

function masteredOn(word) {
  if (!word.masteredAt) return 'Mastered';
  const d = new Date(word.masteredAt);
  return `Mastered ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
