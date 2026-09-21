/* The on-screen keyboard.

   The app never opens the system keyboard: Android's suggestion strip would
   offer her the correctly spelled word while she is being asked to spell
   it. Drawing our own also means the QWERTY layout can mirror a real US
   keyboard — staggered rows and all — so the finger positions carry over to
   the Bluetooth keyboard she is learning to type on.

   Shared by the spelling activities and by the mini-games that ask her to
   spell a whole word, so there is only ever one keyboard to get right.
*/

import { el, clear } from './dom.js';
import { settings } from '../core/state.js';

const ABC_ROWS = ['abcdefg', 'hijklmn', 'opqrstu', "vwxyz'"];

/* Half-column widths on a 24-column grid, which is what gives the rows
   their real-keyboard stagger. */
const QWERTY_ROWS = [
  { lead: 0, keys: 'qwertyuiop', end: 'del'   },
  { lead: 1, keys: "asdfghjkl'", end: 'enter' },
  { lead: 3, keys: 'zxcvbnm',    end: 'shift', leadShift: true },
];

/**
 * Draw a keyboard into `host`.
 *
 * @param {HTMLElement} host
 * @param {object} opts
 * @param {function(string)} opts.onLetter
 * @param {function} opts.onBackspace
 * @param {function} opts.onEnter
 * @param {string} [opts.enterLabel]  what the big key says, e.g. 'Check'
 * @param {string} [opts.layout]      overrides the saved setting
 */
export function buildKeyboard(host, { onLetter, onBackspace, onEnter,
                                      enterLabel = 'Check', layout = null } = {}) {
  clear(host);
  const which = layout || settings().keyboardLayout;
  if (which === 'abc') buildAbc();
  else buildQwerty();
  return host;

  function letterKey(ch) {
    return el('button', {
      class: 'key', type: 'button', text: ch,
      style: { gridColumn: 'span 2' },
      onClick: () => onLetter(ch),
    });
  }

  function buildQwerty() {
    QWERTY_ROWS.forEach(row => {
      const grid = el('div', { class: 'kb-grid' });
      if (row.leadShift) {
        grid.append(el('div', { class: 'key key-shift', style: { gridColumn: 'span 3' },
          text: '⇧', 'aria-hidden': 'true' }));
      } else if (row.lead) {
        grid.append(el('div', { style: { gridColumn: `span ${row.lead}` } }));
      }
      row.keys.split('').forEach(ch => grid.append(letterKey(ch)));

      if (row.end === 'del') {
        grid.append(el('button', { class: 'key key-del', type: 'button', text: '⌫',
          style: { gridColumn: 'span 4' }, 'aria-label': 'Delete', onClick: onBackspace }));
      } else if (row.end === 'enter') {
        grid.append(el('button', { class: 'key key-enter', type: 'button', text: enterLabel,
          style: { gridColumn: 'span 3' }, onClick: onEnter }));
      } else {
        grid.append(el('div', { class: 'key key-shift', style: { gridColumn: 'span 7' },
          text: '⇧', 'aria-hidden': 'true' }));
      }
      host.append(grid);
    });
  }

  function buildAbc() {
    ABC_ROWS.forEach(rowText => {
      const row = el('div', { class: 'kb-row' });
      rowText.split('').forEach(ch => row.append(el('button', {
        class: 'key', type: 'button', text: ch, onClick: () => onLetter(ch),
      })));
      host.append(row);
    });
    host.append(el('div', { class: 'kb-row' },
      el('button', { class: 'key key-wide key-del', type: 'button', text: '⌫',
        'aria-label': 'Delete', onClick: onBackspace }),
      el('button', { class: 'key key-wide key-enter', type: 'button', text: enterLabel,
        onClick: onEnter })
    ));
  }
}

/**
 * Listen for a real (Bluetooth or USB) keyboard.
 *
 * Returns a remove() function — call it from the screen's cleanup, or the
 * listener outlives the screen and types into the next one.
 *
 * @param {object} opts
 * @param {function(string)} opts.onLetter
 * @param {function} opts.onBackspace
 * @param {function} opts.onEnter
 * @param {function} [opts.onFirstUse] fired once, when a real key is used
 * @param {function(): boolean} [opts.isLocked] ignore everything but Enter
 */
export function watchPhysicalKeyboard({ onLetter, onBackspace, onEnter,
                                        onFirstUse = null, isLocked = () => false }) {
  let noticed = false;
  const notice = () => { if (!noticed) { noticed = true; onFirstUse?.(); } };

  const handler = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isLocked() && e.key !== 'Enter') return;

    if (/^[a-zA-Z']$/.test(e.key)) { notice(); onLetter(e.key.toLowerCase()); e.preventDefault(); }
    else if (e.key === 'Backspace') { notice(); onBackspace(); e.preventDefault(); }
    else if (e.key === 'Enter')     { notice(); onEnter(); e.preventDefault(); }
  };

  addEventListener('keydown', handler);
  return () => removeEventListener('keydown', handler);
}
