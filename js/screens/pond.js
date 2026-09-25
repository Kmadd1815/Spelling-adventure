/* The pond screen.

   An axolotl is not a land animal. It has spent this whole app standing on
   a rug being very pleased to see her, and this is where it finally gets
   some water — so the screen is deliberately quiet and mostly picture.
   There is nothing to do here but watch it swim, pet it, and arrange the
   place. The spelling all stays indoors.
*/

import { el, mount, button } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG, friendSVG } from '../ui/art.js';
import { buildPond, SURFACE_BOTTOM } from '../ui/pond.js';
import { swim, setPetArt, follow, setFriendArt } from '../ui/petlife.js';
import { attachFriend } from '../ui/friendlife.js';
import { burst, hop } from '../ui/fx.js';
import * as pet from '../core/pet.js';
import * as items from '../core/items.js';
import * as friendCore from '../core/friend.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';
import { pondOpen, pondLine } from '../core/pond.js';

export default function pondScreen(container) {
  /* Reached by a path that will not open otherwise — but a typed URL is a
     path too, so it is checked here as well. */
  if (!pondOpen()) { navigate('/'); return; }

  let stopSwim = null;
  let stopFollow = null;
  const stopEverything = () => {
    stopSwim?.(); stopSwim = null;
    stopFollow?.(); stopFollow = null;
  };

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

    const bubble = el('div', { class: 'room-speech', text: pondLine() });

    stopEverything();
    const scene = buildPond({
      season,
      petHTML: drawPet(mood),
      petProps: {
        class: 'room-pet pet-tappable', role: 'button', tabindex: '0',
        'aria-label': `Pet ${info.name}`,
        onClick: () => pat(),
      },
    });

    /* The duckling does not swim: it paddles about on the top, which is
       what a duckling does and what keeps the two of them from ending up
       in the same piece of water. */
    const friendNode = attachFriend(scene, {
      onTap: node => {
        setFriendArt(node, friendSVG({ mood: 'peep' }));
        bubble.textContent = friendCore.peep();
        burst(scene, 'hearts', { origin: node });
        setTimeout(() => setFriendArt(node, friendSVG({ mood: 'calm' })), 1600);
      },
    });
    if (friendNode) {
      friendNode.classList.add('on-water');
      friendNode.style.bottom = `${SURFACE_BOTTOM}%`;
    }

    const stage = el('div', { class: 'hub-hero hub-hero-room', style: { position: 'relative' } },
      el('div', { class: 'room-season-chip', text: `${season.emoji} ${season.name}` }),
      bubble,
      scene
    );

    const out = items.POND_SLOTS
      .filter(s => s !== 'pondWater' && s !== 'pondFloor')
      .reduce((n, slot) => n + items.inSlot(slot).length, 0);

    mount(container, el('div', { class: 'stack' },
      stage,
      el('p', { class: 'center tiny muted', text: out === 0
        ? 'Just water so far. The shop has things to put in it.'
        : `${out} thing${out === 1 ? '' : 's'} in the water.` }),
      el('div', { class: 'row' },
        button('Arrange it', { cls: 'btn btn-green grow', emoji: '\u{1F33F}',
          onClick: () => navigate('/decorate?where=pond') }),
        button('Shop', { cls: 'btn btn-pink grow', emoji: '\u{1F6CD}️',
          onClick: () => navigate('/shop?tab=pond') })
      ),
      button('Back up to the garden', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F33F}',
        onClick: () => navigate('/garden') })
    ));

    stopSwim = swim(scene);
    /* It follows along the top while the axolotl goes wherever it likes
       underneath — follow() only ever writes `left`, so the duckling stays
       on the surface without being told twice. */
    if (friendNode) stopFollow = follow(scene, { band: [6, 92] });
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
    if (scene && petNode) burst(scene, 'bubbles', { origin: petNode });
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
  return () => { clearTimeout(moodTimer); stopEverything(); };
}
