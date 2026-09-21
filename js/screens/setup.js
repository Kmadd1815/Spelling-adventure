/* First run. Three quick questions, then straight into the app. */

import { el, mount, button, field } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petThumbSVG } from '../ui/art.js';
import { COATS } from '../core/pet.js';
import { update } from '../core/state.js';

export default function setupScreen(container) {
  let step = 0;
  let childName = '';
  let coat = 'cocoa';
  let petName = '';

  function render() {
    mount(container, [stepOne, stepTwo, stepThree][step]());
  }

  function stepOne() {
    const input = el('input', { type: 'text', placeholder: 'Your name',
      maxlength: '18', value: childName, autocapitalize: 'words' });
    input.addEventListener('input', () => { childName = input.value; });

    return el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '3rem' }, text: '\u{1F31F}' }),
        el('h2', { text: 'Welcome to Spelling Adventure!' }),
        el('p', { class: 'muted', text: 'First, what should we call you?' })
      ),
      el('div', { class: 'card' }, field('My name is', input)),
      button('Next', { cls: 'btn btn-primary btn-lg btn-block',
        onClick: () => { step = 1; render(); } })
    );
  }

  function stepTwo() {
    const grid = el('div', { class: 'hub-grid' });
    COATS.forEach(option => {
      grid.append(el('button', {
        class: `hub-tile ${option.key === coat ? 't-orange' : 't-green'}`,
        type: 'button',
        onClick: () => { coat = option.key; render(); },
      },
        el('span', { html: petThumbSVG(option.key) }),
        el('span', { text: option.name })
      ));
    });

    return el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('h2', { text: `Hi${childName ? ', ' + childName : ''}!` }),
        el('p', { class: 'muted', text: 'An axolotl is coming to live with you. Pick their colour.' })
      ),
      grid,
      button('Next', { cls: 'btn btn-primary btn-lg btn-block',
        onClick: () => { step = 2; render(); } })
    );
  }

  function stepThree() {
    const input = el('input', { type: 'text', placeholder: 'Pet name',
      maxlength: '16', value: petName, autocapitalize: 'words' });
    input.addEventListener('input', () => { petName = input.value; });

    return el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { html: petThumbSVG(coat) }),
        el('h2', { text: 'What is their name?' }),
        el('p', { class: 'muted tiny', text: 'You can change it later.' })
      ),
      el('div', { class: 'card' }, field('Their name is', input)),
      button('Let’s go!', { cls: 'btn btn-primary btn-lg btn-block', emoji: '\u{1F680}',
        onClick: finish })
    );
  }

  function finish() {
    update(state => {
      state.child.name = childName.trim();
      state.child.petCoat = coat;
      state.child.petName = petName.trim();
      state.child.setupComplete = true;
    });
    navigate('/', { replace: true });
  }

  render();
}
