/* The Word Tree screen.

   A leaf for every word she has mastered, with the word on it. There is
   nothing to buy here and nothing to arrange: the only way to change this
   place is to learn another word, which makes it the one screen in the app
   that is made entirely of work she has already done.

   Tapping a leaf says the word and tells her when she got it. That is the
   whole interaction and it is meant to be — this is somewhere to stand and
   look at what she has done, not another thing to do.
*/

import { el, mount, button, clear } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG } from '../ui/art.js';
import { buildTree } from '../ui/wordtree.js';
import { roam, setPetArt, GARDEN_BAND } from '../ui/petlife.js';
import { burst, hop } from '../ui/fx.js';
import * as pet from '../core/pet.js';
import * as items from '../core/items.js';
import * as speech from '../core/speech.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';
import { treeOpen, leaves, whenMastered } from '../core/wordtree.js';

export default function treeScreen(container) {
  /* Reached through a gate that will not open otherwise — but a typed URL
     is a gate too, so it is checked here as well. */
  if (!treeOpen()) { navigate('/'); return; }

  let stopRoam = null;
  const stopRoaming = () => { stopRoam?.(); stopRoam = null; };
  let mood = 'happy';
  let moodTimer = null;

  const card = el('div', { class: 'wt-card', hidden: true });

  function render() {
    const info = pet.pet();
    const worn = items.equipped();
    const season = currentSeason();
    applySeasonTheme(season);

    const all = leaves();
    const due = all.filter(l => l.due).length;

    const drawPet = m => petSVG({
      coat: info.coat, stage: info.stage, mood: m,
      hat: worn.hat, accessory: worn.accessory,
    });

    const bubble = el('div', { class: 'room-speech', text: greeting(all.length, due) });

    stopRoaming();
    const scene = buildTree({
      leaves: all,
      season,
      petHTML: drawPet(mood),
      petProps: {
        class: 'room-pet pet-tappable', role: 'button', tabindex: '0',
        'aria-label': `Pet ${info.name}`,
        onClick: () => pat(),
      },
    });

    /* One listener for the whole canopy rather than one per leaf: at two
       hundred words that is two hundred listeners for a screen she mostly
       just looks at. */
    scene.addEventListener('click', ev => {
      const node = ev.target.closest?.('[data-leaf]');
      if (node) showLeaf(node.getAttribute('data-leaf'), all);
    });
    scene.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const node = ev.target.closest?.('[data-leaf]');
      if (node) { ev.preventDefault(); showLeaf(node.getAttribute('data-leaf'), all); }
    });

    const stage = el('div', { class: 'hub-hero hub-hero-room', style: { position: 'relative' } },
      el('div', { class: 'room-season-chip', text: `${season.emoji} ${season.name}` }),
      bubble,
      scene,
      card
    );

    mount(container, el('div', { class: 'stack' },
      stage,
      el('p', { class: 'center tiny muted', text: `${all.length} leaves · one for every word you have mastered` }),
      due
        ? el('p', { class: 'center tiny', text:
            `${due} leaf${due === 1 ? ' has' : 'ves have'} a dot — ${due === 1 ? 'that word is' : 'those words are'} ready for a check.` })
        : null,
      button('Back to the garden', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F33F}',
        onClick: () => navigate('/garden') })
    ));

    stopRoam = roam(scene, { band: GARDEN_BAND });
  }

  function greeting(count, due) {
    if (due) return 'Some of these are ready for a check!';
    if (count >= 100) return 'Look how big it got.';
    return 'Every leaf is a word you learned.';
  }

  /* The card, rather than a toast: she taps a leaf to look at a word, and
     a message that slides away after two seconds is no good for looking
     at something. */
  function showLeaf(id, all) {
    const leaf = all.find(l => l.id === id);
    if (!leaf) return;
    speech.speak(leaf.text);

    clear(card);
    card.hidden = false;
    card.append(
      el('div', { class: 'wt-card-word', text: leaf.text }),
      el('div', { class: 'wt-card-when', text: `Mastered ${whenMastered(leaf.at)}` }),
      leaf.due
        ? el('div', { class: 'wt-card-due', text: '\u{1F504} Ready for a check' })
        : null,
      el('div', { class: 'row', style: { marginTop: '10px', gap: '8px' } },
        button('Say it again', { cls: 'btn btn-quiet grow', emoji: '\u{1F50A}',
          onClick: () => speech.speak(leaf.text) }),
        button('Close', { cls: 'btn btn-quiet grow', emoji: '✕',
          onClick: () => { card.hidden = true; } })
      )
    );
  }

  function pat() {
    const spec = pet.INTERACTIONS.pet;
    pet.noteMoment();
    mood = spec.mood;

    const scene = container.querySelector('.room');
    const petNode = container.querySelector('.room-pet');
    const bubble = container.querySelector('.room-speech');
    const info = pet.pet();
    const worn = items.equipped();

    if (petNode) {
      setPetArt(petNode, petSVG({
        coat: info.coat, stage: info.stage, mood,
        hat: worn.hat, accessory: worn.accessory,
      }));
      hop(petNode);
    }
    if (scene && petNode) burst(scene, spec.effect, { origin: petNode });
    if (bubble) bubble.textContent = pet.interactionLine('pet');

    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => {
      mood = 'happy';
      const node = container.querySelector('.room-pet');
      if (node) setPetArt(node, petSVG({
        coat: info.coat, stage: info.stage, mood,
        hat: worn.hat, accessory: worn.accessory,
      }));
    }, 2600);
  }

  render();
  return () => { clearTimeout(moodTimer); stopRoaming(); speech.stop(); };
}
