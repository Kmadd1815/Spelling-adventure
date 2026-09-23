/* Text size.

   Nine year olds do not all read comfortably at the same size, and neither
   do the grown-ups marking a paper test at arm's length. This scales every
   piece of text in the app from one number.

   It works because almost all of the type is set in rem, so scaling the
   root font size scales the words and leaves the layout — the keyboard,
   the room, the scenes, all of it in px or percentages — exactly where it
   was. A text-size setting that reflowed her room would not be a
   text-size setting.

   Off by default: a child who is reading fine should not have her app
   changed under her.
*/

import { settings, update } from '../core/state.js';

export const SIZES = [
  { key: 'normal', label: 'Normal',  scale: 1 },
  { key: 'big',    label: 'Bigger',  scale: 1.14 },
  { key: 'biggest',label: 'Biggest', scale: 1.28 },
];

export const sizeOf = key => SIZES.find(s => s.key === key) || SIZES[0];

/** What is set now, defaulting to normal for a save that predates this. */
export function textSize() {
  return sizeOf(settings().textSize).key;
}

/** Paints it on. Called at boot and whenever it is changed, so it holds on
    every screen rather than only the one that set it. */
export function applyTextSize(key = textSize()) {
  const size = sizeOf(key);
  const root = document.documentElement;
  root.dataset.text = size.key;
  root.style.setProperty('--text-scale', String(size.scale));
}

export function setTextSize(key) {
  const size = sizeOf(key);
  update(state => { state.settings.textSize = size.key; });
  applyTextSize(size.key);
  return size.key;
}
