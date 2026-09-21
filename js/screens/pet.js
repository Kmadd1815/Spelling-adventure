/* The pet screen.

   There is no hunger bar, no mood, and no timer. The only meter on this
   screen measures words mastered, which is the only thing that makes the
   pet grow. */

import { el, mount, button, bar, modal } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { petSVG, petThumbSVG } from '../ui/art.js';
import { navigate } from '../ui/router.js';
import * as pet from '../core/pet.js';
import { COATS } from '../core/pet.js';
import * as items from '../core/items.js';
import { itemSVG } from '../ui/item-art.js';
import { buildRoom } from '../ui/room.js';
import { burst, hop } from '../ui/fx.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';

export default function petScreen(container) {
  let mood = 'calm';
  let moodTimer = null;

  function render() {
    const info = pet.pet();
    const growth = pet.growthProgress();
    const season = currentSeason();
    applySeasonTheme(season);

    const worn = items.equipped();
    const bubble = el('div', { class: 'room-speech', text: pet.greeting() });

    const drawPet = m => petSVG({
      coat: info.coat, stage: info.stage, mood: m,
      hat: worn.hat, accessory: worn.accessory,
    });

    const room = buildRoom({
      petHTML: drawPet(mood),
      petProps: {
        class: 'room-pet pet-tappable', role: 'button', tabindex: '0',
        'aria-label': `Pet ${info.name}`,
        onClick: () => interact('pet'),
      },
    });

    const stage = el('div', { class: 'hub-hero hub-hero-room', style: { position: 'relative' } },
      el('div', { class: 'room-season-chip', text: `${season.emoji} ${season.name}` }),
      bubble,
      room
    );

    const growthCard = el('div', { class: 'card' },
      el('h2', { text: `${info.name} the Axolotl` }),
      el('p', { class: 'muted tiny', text: `Right now: ${info.stage.name}` }),
      bar(growth.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text: growth.next
        ? `${growth.goal - growth.have} more mastered ${growth.goal - growth.have === 1 ? 'word' : 'words'} until ${info.name} grows into a ${growth.next.name}.`
        : `${info.name} is fully grown and absolutely radiant.` })
    );

    /* Only what the axolotl wears lives here; the room has its own screen. */
    function shelf(slot, title, hint) {
      const owned = items.ownedOf(slot);
      if (!owned.length) {
        return el('div', { class: 'card' },
          el('h3', { text: title }),
          el('p', { class: 'muted tiny', text: hint })
        );
      }
      return el('div', { class: 'card' },
        el('h3', { text: title }),
        el('div', { class: 'wardrobe-grid' }, owned.map(item => {
          const on = items.isEquipped(item.id);
          return el('button', {
            class: `wardrobe-item${on ? ' on' : ''}`, type: 'button',
            onClick: () => { items.toggleEquip(item.id); render(); },
          },
            el('div', { class: 'wardrobe-art', html: itemSVG(item, { size: 62 }) }),
            el('div', { class: 'wardrobe-name', text: item.name }),
            items.isSpecial(item) ? el('div', { class: 'wardrobe-tag', text: '\u2728 Earned' }) : null,
            on ? el('div', { class: 'wardrobe-on', text: '\u2713' }) : null
          );
        }))
      );
    }

    const wardrobe = el('div', { class: 'stack' },
      shelf('hat', '\u{1F452} Hats', 'Hats she buys or earns will show up here.'),
      shelf('accessory', '\u{1F380} Accessories', 'Accessories will show up here.')
    );


    /* Free interactions always work. Treats buy the fancier ones — and
       having none of them changes nothing about the axolotl, which is
       exactly as happy either way and still right there to be petted. */
    const playCard = el('div', { class: 'card' },
      el('div', { class: 'row', style: { justifyContent: 'space-between' } },
        el('h3', { text: 'Play together', style: { margin: '0' } }),
        el('div', { class: 'treat-chip' }, '\u{1F36C}', String(pet.treats()))
      ),
      /* Petting is listed as well as being tappable: the free options have
         to be visible, so there is always something she can obviously do. */
      el('div', { class: 'play-grid', style: { marginTop: '12px' } },
        playButton('pet',    't-orange'),
        playButton('splash', 't-blue'),
        playButton('feed',   't-pink'),
        playButton('play',   't-green'),
        playButton('cuddle', 't-purple')
      ),
      el('p', { class: 'muted tiny center', style: { marginTop: '12px' },
        text: pet.treats() > 0
          ? `You have ${pet.treats()} ${pet.treats() === 1 ? 'treat' : 'treats'} saved up. Tap the axolotl any time \u2014 that is always free.`
          : 'Spelling earns treats to spoil your axolotl with. Splashing and petting are always free.' }),
      pet.moments() > 0
        ? el('p', { class: 'muted tiny center', style: { marginTop: '4px' },
            text: `You have played together ${pet.moments()} ${pet.moments() === 1 ? 'time' : 'times'}.` })
        : null
    );

    const actions = el('div', { class: 'row' },
      button('Rename', { cls: 'btn btn-quiet grow', emoji: '✏️', onClick: renameDialog }),
      button('Change coat', { cls: 'btn btn-quiet grow', emoji: '\u{1F3A8}', onClick: coatDialog })
    );

    mount(container, el('div', { class: 'stack' },
      stage, playCard, growthCard, wardrobe, actions,
      button('Decorate the room', { cls: 'btn btn-green btn-block', emoji: '\u{1FA91}',
        onClick: () => navigate('/decorate') }),
      button('Go to the shop', { cls: 'btn btn-pink btn-block', emoji: '\u{1F6CD}\uFE0F',
        onClick: () => navigate('/shop') }),
      button('Go practice', { cls: 'btn btn-primary btn-block', emoji: '\u2728',
        onClick: () => navigate('/practice') })
    ));
  }

  /**
   * Run an interaction. Free ones always work; the rest cost a treat, and
   * being out of treats simply means that button is quiet for now.
   */
  function interact(key) {
    const spec = pet.INTERACTIONS[key];
    if (!spec) return;
    if (spec.cost > 0 && !pet.spendTreat()) {
      toast('Do some spelling to earn more treats!', { ms: 3200 });
      return;
    }

    pet.noteMoment();
    mood = spec.mood;

    const scene = container.querySelector('.room');
    const petNode = container.querySelector('.room-pet');
    const bubble = container.querySelector('.room-speech');

    // Re-draw the face for the new mood, then celebrate over the top of it.
    if (petNode) {
      const info = pet.pet();
      const worn = items.equipped();
      petNode.innerHTML = petSVG({
        coat: info.coat, stage: info.stage, mood,
        hat: worn.hat, accessory: worn.accessory,
      });
      hop(petNode);
    }
    if (bubble) bubble.textContent = pet.interactionLine(key);
    burst(scene, spec.effect, { origin: petNode });

    // Settle back to calm, and only then re-render so the treat count and
    // the tally catch up without interrupting the animation.
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => { mood = 'calm'; render(); }, 2400);
  }

  function playButton(key, tone) {
    const spec = pet.INTERACTIONS[key];
    const locked = spec.cost > 0 && pet.treats() < spec.cost;
    return el('button', {
      class: `play-btn ${tone}`, type: 'button', disabled: locked,
      onClick: () => interact(key),
    },
      el('span', { class: 'emoji', text: spec.emoji }),
      el('span', { text: spec.label }),
      el('small', { text: spec.cost ? `\u{1F36C} ${spec.cost}` : 'free' })
    );
  }

  function renameDialog() {
    const input = el('input', { type: 'text', maxlength: '16', value: pet.pet().name });
    const close = modal('Name your friend', [
      input,
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Save', { cls: 'btn btn-primary grow', onClick: () => {
          pet.setPet({ name: input.value });
          close(); render();
        } })
      ),
    ]);
    setTimeout(() => input.focus(), 50);
  }

  function coatDialog() {
    const current = pet.pet().coat.key;
    const grid = el('div', { class: 'hub-grid' });
    COATS.forEach(coat => {
      grid.append(el('button', {
        class: `hub-tile ${coat.key === current ? 't-orange' : 't-green'}`, type: 'button',
        onClick: () => { pet.setPet({ coat: coat.key }); close(); render(); },
      },
        el('span', { html: petThumbSVG(coat.key) }),
        el('span', { text: coat.name })
      ));
    });
    const close = modal('Choose a coat', [
      el('p', { class: 'muted tiny', text: 'Only the colour changes \u2014 everything you have earned stays exactly the same.' }),
      grid,
      button('Cancel', { cls: 'btn btn-quiet btn-block', style: { marginTop: '12px' },
        onClick: () => close() }),
    ]);
  }

  render();
  return () => clearTimeout(moodTimer);
}
