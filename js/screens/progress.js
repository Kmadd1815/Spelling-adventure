/* My Progress — the child's version.

   Deliberately not a report card: no percentages, no grades, no "you are
   behind". Counts of things she has actually done, and the next nice thing
   coming up. */

import { el, mount, button, stat, bar, segmented } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import * as words from '../core/words.js';
import * as pet from '../core/pet.js';
import * as rewards from '../core/rewards.js';
import { getState } from '../core/state.js';

export default function progressScreen(container, params) {
  let tab = params.tab === 'collection' ? 'collection' : 'progress';

  function render() {
    const tabs = segmented([
      { value: 'progress',   label: '\u{1F4CA} Progress' },
      { value: 'collection', label: '\u{1F4D6} Collection' },
    ], tab, value => { tab = value; render(); });

    mount(container, el('div', { class: 'stack' },
      tabs,
      tab === 'progress' ? progressTab() : collectionTab()
    ));
  }

  function progressTab() {
    const s = words.summary();
    const p = getState().progress;
    const growth = pet.growthProgress();
    const info = pet.pet();
    const next = rewards.nextMilestone();

    const body = el('div', { class: 'stack' });

    body.append(el('div', { class: 'stat-grid' },
      stat(s.mastered, '⭐ Mastered'),
      stat(s.active, '\u{1F331} Practicing'),
      stat(p.currentStreak, '\u{1F525} Day streak'),
      stat(p.stars, '★ Stars')
    ));

    body.append(el('div', { class: 'card' },
      el('h3', { text: `${info.name} is growing` }),
      bar(growth.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text: growth.next
        ? `${growth.goal - growth.have} more mastered words until ${growth.next.name}.`
        : 'Fully grown!' })
    ));

    if (next) {
      const pct = next.goal ? next.have / next.goal : 0;
      body.append(el('div', { class: 'card' },
        el('h3', { text: `${next.milestone.emoji} Next: ${next.milestone.title}` }),
        bar(pct),
        el('p', { class: 'tiny muted', style: { marginTop: '8px' },
          text: `${next.have} of ${next.goal} words mastered` })
      ));
    }

    const earned = rewards.earnedMilestones();
    if (earned.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: '\u{1F3C6} Things you have done' }),
        el('div', { class: 'stack-sm' }, earned.slice().reverse().map(m =>
          el('div', { class: 'word-row' },
            el('div', { style: { fontSize: '1.5rem' }, text: m.emoji }),
            el('div', { class: 'grow' },
              el('div', { class: 'w-text', text: m.title }),
              el('div', { class: 'w-meta', text: m.blurb })
            )
          )))
      ));
    }

    body.append(el('div', { class: 'stat-grid' },
      stat(p.sessionsCompleted, 'Practices'),
      stat(p.testsCompleted, 'Tests'),
      stat(p.longestStreak, 'Best streak'),
      stat(s.total, 'Words total')
    ));

    body.append(button('Keep going', { cls: 'btn btn-primary btn-block', emoji: '✨',
      onClick: () => navigate('/practice') }));

    return body;
  }

  /* The Collection Book. Owned things are shown in full; everything still
     out there shows as a silhouette, so there is always something to find. */
  function collectionTab() {
    const owned = rewards.ownedSpecials();
    const ownedIds = new Set(owned.map(i => i.itemId));
    const locked = rewards.MILESTONES
      .filter(m => m.item && !ownedIds.has(m.item.itemId));

    const body = el('div', { class: 'stack' });

    body.append(el('div', { class: 'card center' },
      el('h3', { text: `${owned.length} of ${owned.length + locked.length} treasures found` }),
      bar(owned.length / Math.max(1, owned.length + locked.length), { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' },
        text: 'Special treasures are earned, never bought.' })
    ));

    if (owned.length) {
      body.append(el('div', { class: 'stack-sm' }, owned.slice().reverse().map(item =>
        el('div', { class: 'word-row' },
          el('div', { style: { fontSize: '1.8rem' }, text: item.emoji }),
          el('div', { class: 'grow' },
            el('div', { class: 'w-text', text: item.name }),
            el('div', { class: 'w-meta', text: `How you got it: ${item.source}` })
          )
        ))));
    }

    if (locked.length) {
      body.append(el('div', { class: 'section-title', text: 'Still out there' }));
      body.append(el('div', { class: 'stack-sm' }, locked.map(m =>
        el('div', { class: 'word-row', style: { opacity: '.62' } },
          el('div', { style: { fontSize: '1.8rem' }, text: '❓' }),
          el('div', { class: 'grow' },
            el('div', { class: 'w-text', text: '? ? ?' }),
            el('div', { class: 'w-meta', text: m.title })
          )
        ))));
    }

    return body;
  }

  render();
}
