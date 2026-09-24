/* The garden screen.

   She earns this one. Everything else in the app is hers from the first
   launch; the door out of her room stays shut until twenty words are
   mastered, and this is what is behind it.

   It is deliberately quiet: a place to be and to arrange, not another thing
   to do. The spelling, the games and the events all stay indoors.
*/

import { el, mount, button } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG } from '../ui/art.js';
import { buildGarden } from '../ui/garden.js';
import { roam, setPetArt, follow, setFriendArt, GARDEN_BAND } from '../ui/petlife.js';
import { attachFriend } from '../ui/friendlife.js';
import { friendSVG } from '../ui/art.js';
import * as friendCore from '../core/friend.js';
import { burst, hop } from '../ui/fx.js';
import * as pet from '../core/pet.js';
import * as items from '../core/items.js';
import { currentSeason, applySeasonTheme, seasonLine } from '../core/season.js';
import { gardenOpen } from '../core/garden.js';
import { treeOpen, gateLine as treeGateLine } from '../core/wordtree.js';
import { gateSVG } from '../ui/wordtree.js';

export default function gardenScreen(container) {
  /* It wanders out here too — more room than indoors, and no doorway to
     stand in the middle of. */
  let stopRoam = null;
  let stopFollow = null;
  const stopRoaming = () => {
    stopRoam?.(); stopRoam = null;
    stopFollow?.(); stopFollow = null;
  };

  /* Reachable only through a door that will not open otherwise, but a typed
     URL is a door too, so the gate is checked here as well. */
  if (!gardenOpen()) { navigate('/'); return; }

  let mood = 'happy';
  let moodTimer = null;

  function render() {
    const info = pet.pet();
    const worn = items.equipped();
    const season = currentSeason();
    applySeasonTheme(season);

    const drawPet = m => petSVG({
      coat: info.coat, stage: info.stage, mood: m,
      hat: worn.hat, accessory: worn.accessory,
    });

    const bubble = el('div', { class: 'room-speech',
      text: Math.random() < 0.3 ? seasonLine(season) : pet.outdoorLine() });

    stopRoaming();
    const scene = buildGarden({
      petHTML: drawPet(mood),
      petProps: {
        class: 'room-pet pet-tappable', role: 'button', tabindex: '0',
        'aria-label': `Pet ${info.name}`,
        onClick: () => pat(),
      },
    });

    /* The way on. Shut, it still says how many words are left, the same
       way the door out of her room does — a gate with a number on it is
       something to work towards. */
    const openYet = treeOpen();
    const gate = el('button', {
      class: `garden-gate${openYet ? '' : ' garden-gate-shut'}`,
      type: 'button',
      'aria-label': openYet ? 'Through the gate to your word tree' : 'The gate to your word tree',
      html: gateSVG(openYet),
      onClick: () => {
        if (openYet) { navigate('/tree'); return; }
        bubble.textContent = treeGateLine();
      },
    });
    scene.append(gate);

    const stage = el('div', { class: 'hub-hero hub-hero-room', style: { position: 'relative' } },
      el('div', { class: 'room-season-chip', text: `${season.emoji} ${season.name}` }),
      bubble,
      scene
    );

    const out = items.GARDEN_SLOTS.reduce((n, slot) => n + items.inSlot(slot).length, 0);

    const body = el('div', { class: 'stack' },
      stage,
      el('p', { class: 'center tiny muted', text: out <= 2
        ? 'This garden is mostly sky so far. Have a look in the shop.'
        : `${out} things out in the garden.` }),
      el('div', { class: 'row' },
        button('Arrange it', { cls: 'btn btn-green grow', emoji: '\u{1F33F}',
          onClick: () => navigate('/decorate?where=garden') }),
        button('Shop', { cls: 'btn btn-pink grow', emoji: '\u{1F6CD}️',
          onClick: () => navigate('/shop?tab=garden') })
      ),
      button('Go back inside', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F6AA}',
        onClick: () => navigate('/') })
    );

    mount(container, body);

    /* The duckling comes out here too, and under the tree. Wherever the
       axolotl is, it is a step behind. */
    const friendNode = attachFriend(scene, {
      onTap: node => {
        setFriendArt(node, friendSVG({ mood: 'peep' }));
        const bubble = container.querySelector('.room-speech');
        if (bubble) bubble.textContent = friendCore.peep();
        burst(scene, 'hearts', { origin: node });
        setTimeout(() => setFriendArt(node, friendSVG({ mood: 'calm' })), 1600);
      },
    });

    stopRoam = roam(scene, { band: GARDEN_BAND });
    if (friendNode) stopFollow = follow(scene, { band: [4, 94] });
  }

  /* Petting outdoors is the same free thing it is indoors: no treats, no
     counter, just a reaction. The Pet screen keeps the rest. */
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
  return () => { clearTimeout(moodTimer); stopRoaming(); };
}
