/* Tapping something she has put out.

   One handler, shared by the room, the garden and the pond, because the
   answer to "what happens when I tap this" should not depend on which of
   her places she is standing in.

   Two things happen on a tap, and the order matters:

     the THING moves straight away — the touch has to be answered inside a
     tenth of a second or it did not register as a touch at all;

     the AXOLOTL comes over, if it is something it makes sense to use, and
     does its bit when it arrives. A nap that starts before it has got to
     the bed is a nap in the middle of the floor.

   Taps are deliberately not queued. Tapping a second thing while the
   axolotl is walking to the first simply changes its mind, which is what
   a child doing it expects and what an animal would do.
*/

import { playFor, lineFor, POSES } from '../core/decorplay.js';
import * as sound from '../core/sound.js';

/* Long enough for the longest animation in app.css to finish, after which
   the class comes off so the next tap can put it back on. */
const FIDGET_MS = 2500;

/**
 * Build the handler to hand to buildRoom / buildGarden / buildPond.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.bubble   the speech bubble, if the screen has one
 * @param {Function} [opts.getRoam] returns whatever roam() last returned.
 *   A getter rather than the handle itself because the scene is built
 *   before the wandering starts, and the scene is what needs the handler.
 * @param {Function} [opts.onSay]     called with the line, if the screen
 *   would rather say it itself
 * @returns {Function} (itemId, node) => void
 */
export function decorTap({ bubble = null, getRoam = null, onSay = null } = {}) {
  return function tapped(itemId, node) {
    const play = playFor(itemId);
    const say = lineFor(itemId);

    /* The smallest sound in the app, so that a tap is answered in the ear
       as well as on the screen. */
    sound.pip();

    /* Answer the finger first. Restarting a CSS animation needs the class
       off, a reflow, and the class on again — without the reflow the
       browser never notices it went away and a second tap does nothing. */
    const move = () => {
      if (!node || !play.item) return;
      node.classList.remove(play.item);
      void node.offsetWidth;
      node.classList.add(play.item);
      setTimeout(() => node.classList.remove(play.item), FIDGET_MS);
    };

    const line = () => {
      if (onSay) onSay(say);
      else if (bubble) bubble.textContent = say;
    };

    const roamHandle = getRoam?.();
    if (play.kind === 'visit' && roamHandle?.visit) {
      /* Where the thing is: across the room, and how far up the floor.
         The second one is what was missing — without it the axolotl
         walked to the right place and then lay down at the front of the
         room, a whole bed away from the bed. Things pinned to the wall
         have a top instead of a bottom, and those it just looks up at
         from the floor. */
      const left = parseFloat(node?.style.left);
      const width = parseFloat(node?.style.width) || 0;
      const x = Number.isFinite(left) ? left + width / 2 : 50;
      const pose = POSES[play.pose] ? play.pose : '';

      /* How far up the floor it sits, and how tall it is — both as
         percentages of the scene, measured rather than assumed, because a
         piece's width is a percentage of the scene's WIDTH and its height
         comes out of the drawing. A piece pinned to the wall has a top
         instead of a bottom and gets no depth at all: the axolotl stays on
         the floor and looks up at it. */
      let bottom = null, height = 0;
      if (Number.isFinite(parseFloat(node?.style.bottom))) {
        const scene = node.closest('.room');
        const r = scene?.getBoundingClientRect();
        const q = node.getBoundingClientRect();
        if (r?.height) {
          bottom = (r.bottom - q.bottom) / r.height * 100;
          height = q.height / r.height * 100;
        } else {
          bottom = parseFloat(node.style.bottom);
        }
      }

      roamHandle.visit(x, {
        pose,
        bottom,
        height,
        ms: POSES[pose]?.ms ?? 2400,
        /* The thing moves and the line is said when the axolotl gets
           there, so the whole business reads as one event. */
        onArrive: () => { move(); line(); },
      });
      /* …except for a small nudge right away, so the tap is acknowledged
         while it is still walking over. */
      if (node) {
        node.classList.remove('dp-nudge');
        void node.offsetWidth;
        node.classList.add('dp-nudge');
        setTimeout(() => node.classList.remove('dp-nudge'), 800);
      }
      return;
    }

    /* Not something it can go and use — but it still looks over at it.
       A tap always gets the animal's attention even when it does not get
       the animal. */
    const where = Number.isFinite(parseFloat(node?.style.left))
      ? parseFloat(node.style.left) + (parseFloat(node.style.width) || 0) / 2
      : null;
    if (where !== null) roamHandle?.glance?.(where);

    move();
    line();
  };
}
