/* A pet that lives in the room rather than standing in it.

   The axolotl used to breathe, blink and sway its gills on one spot in the
   middle of the floor, forever. All of that is good and none of it is what
   makes something feel alive: an animal that never goes anywhere is an
   ornament of an animal. What reads as alive is having somewhere to be —
   crossing the room for no reason, stopping in front of the thing she put
   out yesterday and looking at it, wandering off again.

   So this walks it about. It strolls to a spot, sometimes to whatever she
   has arranged in the room, leans in to look, and moves on. The tail swings
   the whole time, slowly when it is standing and faster when it is going
   somewhere, which is the single cheapest thing in here and probably the
   one that does the most work.

   ---------- Why the layers ----------

   Three different things want to move the axolotl at once — where it is in
   the room, which way it is leaning, and the hop it does when she taps it —
   and in CSS they would all be writing to the same `transform`, so the last
   one to run wins and the other two vanish. (That is exactly the bug that
   used to make it leap sideways whenever it was petted.) So each gets its
   own box to move:

     .room-pet    where it is standing   (left, animated)
     .pet-lean    which way it is going  (rotate)
     .pet-body    hops and the walk bob  (the existing animations)

   It leans rather than flipping, deliberately. Everything in this app is
   lit from the upper left, and mirroring the drawing to face the other way
   would flip its light with it. An axolotl that faces front and leans the
   way it is going stays in the same light — and is also how you would draw
   it walking anyway.
*/

import { el } from './dom.js';

/** The drawing, wrapped in the two boxes the room moves it with. */
export function petLayers(petHTML) {
  return el('div', { class: 'pet-lean' }, el('div', { class: 'pet-body', html: petHTML }));
}

/** Swap the drawing without losing the boxes around it. */
export function setPetArt(petNode, html) {
  if (!petNode) return;
  const body = petNode.querySelector('.pet-body');
  if (body) body.innerHTML = html;
  else petNode.innerHTML = html;
}

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* How far along the floor it is allowed to get. The room is wider than
   this, but the far ends of it are the bed and the doorway, and an axolotl
   standing in an open doorway looks like it is leaving rather than like it
   lives here. */
const ROOM_BAND = [30, 70];

/* Outdoors there is no doorway to stand in, so it gets more room. */
export const GARDEN_BAND = [26, 66];

/** A room percentage for each thing she has put out, to go and look at. */
function interests(room) {
  return [...room.querySelectorAll('.room-piece')].map(node => {
    const left = parseFloat(node.style.left);
    const width = parseFloat(node.style.width);
    if (!Number.isFinite(left) || !Number.isFinite(width)) return null;
    return left + width / 2;
  }).filter(x => x !== null);
}

/**
 * Let the axolotl wander the room it is standing in.
 *
 * @param {HTMLElement} room  the node buildRoom() returned
 * @returns {Function} call it to stop — screens must, or the timers outlive
 *   the screen and walk an axolotl that is no longer on the page.
 */
export function roam(room, { band = ROOM_BAND } = {}) {
  const pet = room?.querySelector?.('.room-pet');
  const lean = pet?.querySelector('.pet-lean');
  if (!pet || !lean) return () => {};

  /* A child who has asked their device to stop moving things has asked for
     this too. */
  if (matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return () => {};

  const width = parseFloat(pet.style.width) || 34;
  const start = (parseFloat(pet.style.left) || 0) + width / 2;

  let here = clamp(start, band[0], band[1]);
  let stopped = false;
  let timer = null;

  const after = (ms, fn) => { timer = setTimeout(fn, ms); };

  /* The speech bubble lives outside the room box, above it, so it is found
     from the room's parent. Missing is fine — the decorating screen has a
     room and nobody talking in it. */
  const bubble = room.parentElement?.querySelector?.('.room-speech') || null;

  /* Point the bubble's tail at wherever the axolotl is standing. Worked out
     in pixels against the bubble's own width, because the bubble and the
     room are different sizes and a percentage of one is not a percentage
     of the other. Clamped so the tail stays under the bubble rather than
     sliding off the end of it. */
  function pointTail(x) {
    if (!bubble) return;
    const r = room.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    if (!r.width || !b.width) return;
    const petPx = r.left + (x / 100) * r.width;
    const px = Math.max(15, Math.min(b.width - 15, petPx - b.left));
    bubble.style.setProperty('--tail-x', `${px.toFixed(1)}px`);
  }

  const standAt = x => { pet.style.left = `${x - width / 2}%`; pointTail(x); };
  const leanTo = deg => { lean.style.transform = `rotate(${deg}deg)`; };

  /** Walk there, then do whatever comes next. */
  function walkTo(x, then) {
    const dx = x - here;
    if (Math.abs(dx) < 1.5) return then();

    /* Long legs it is not: the pace stays the same whatever the distance,
       so crossing the room takes longer than a shuffle, which is the whole
       reason crossing the room reads as a journey. */
    const ms = Math.round(520 + Math.abs(dx) * 62);
    pet.style.transition = `left ${ms}ms ease-in-out`;
    pet.classList.add('pet-walking');
    leanTo(dx > 0 ? 3.5 : -3.5);
    here = x;
    standAt(x);
    after(ms + 90, () => {
      pet.classList.remove('pet-walking');
      then();
    });
  }

  /** Stop and have a good look at something. */
  function lookAt(x, then) {
    leanTo(clamp((x - here) * 0.6, -7, 7));
    pet.classList.add('pet-peeking');
    after(rand(1700, 3400), () => {
      pet.classList.remove('pet-peeking');
      leanTo(0);
      then();
    });
  }

  let lastSeen = -1;

  function next() {
    if (stopped) return;
    /* A tab in the background is not a room anybody is looking at. */
    if (document.hidden) return after(1200, next);

    const rest = () => after(rand(1200, 3600), next);
    const spots = interests(room);
    const roll = Math.random();

    if (roll < 0.42 || spots.length < 2) {
      /* Just go somewhere. */
      walkTo(rand(band[0], band[1]), () => { leanTo(0); rest(); });
    } else if (roll < 0.84) {
      /* Go and see about something — but not the same thing twice running,
         or it paces between two favourites like a zoo animal. */
      let pick = lastSeen;
      for (let i = 0; i < 6 && pick === lastSeen; i++) {
        pick = Math.floor(Math.random() * spots.length);
      }
      lastSeen = pick;
      const what = spots[pick];
      /* Most of what she owns is against a wall and out of reach, so it
         walks as near as the floor allows and looks across at it. The
         little wobble keeps it from stopping on the same spot every time
         it goes to look at anything over by the door. */
      const stand = clamp(clamp(what, band[0], band[1]) + rand(-3, 3), band[0], band[1]);
      walkTo(stand, () => lookAt(what, rest));
    } else {
      /* Stand there. Doing nothing sometimes is part of it. */
      leanTo(0);
      rest();
    }
  }

  standAt(here);
  /* Once more after a beat: the bubble's text arrives with the screen and
     its width settles after the first layout, and a tail aimed at the old
     width points at nothing in particular. */
  after(120, () => { pointTail(here); after(rand(900, 2600), next); });

  return () => {
    stopped = true;
    clearTimeout(timer);
    pet.classList.remove('pet-walking', 'pet-peeking');
    pet.style.transition = '';
    leanTo(0);
  };
}


/* ---------- The friend ----------

   The duckling does not wander: it follows. That is the whole difference
   between a second pet and a friend, and it is why this is twenty lines
   rather than another roam().

   It trails BEHIND the axolotl rather than beside it — whichever way the
   axolotl last went, the duckling stands on the other side of it — so the
   pair reads as one leading and one following instead of two animals that
   happen to be next to each other. It is also slower, and starts moving
   after the axolotl does, which is what makes it look like it is keeping
   up rather than being dragged along on a rail.

   It reads the axolotl's `left` off the style rather than off the screen,
   which is deliberate: that is the target of a transition still running,
   so the duckling sets off for where the axolotl is GOING. A follower that
   waits for the leader to arrive is always exactly one journey behind.
*/

/** The node to put the drawing in, so waddling and walking do not fight. */
export function friendLayers(html) {
  return el('div', { class: 'friend-body', html });
}

export function setFriendArt(node, html) {
  const body = node?.querySelector?.('.friend-body');
  if (body) body.innerHTML = html;
}

/**
 * Walk the duckling after the axolotl.
 *
 * @param {HTMLElement} scene  the room, garden or tree scene
 * @returns {Function} call it to stop.
 */
/* The gap does not shrink with the duckling: the axolotl's gills reach a
   long way either side of where it is standing, so a smaller friend
   standing closer just disappears behind them. */
export function follow(scene, { gap = 26, band = [6, 92] } = {}) {
  const pet = scene?.querySelector?.('.room-pet');
  const friend = scene?.querySelector?.('.room-friend');
  if (!pet || !friend) return () => {};

  const width = parseFloat(friend.style.width) || 10;
  const petWidth = () => parseFloat(pet.style.width) || 34;
  const petCentre = () => (parseFloat(pet.style.left) || 0) + petWidth() / 2;
  const lo = band[0] + width / 2, hi = band[1] - width / 2;

  const standAt = x => { friend.style.left = `${clamp(x, lo, hi) - width / 2}%`; };

  /* Asked not to animate: stand it next to the axolotl and leave it. */
  if (matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    standAt(petCentre() - gap);
    return () => {};
  }

  let last = petCentre();
  let side = -1;                 // which side of the axolotl to stand on
  let stopped = false;
  const timers = new Set();
  const after = (ms, fn) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
    return t;
  };

  standAt(last - gap);

  function step() {
    if (stopped) return;
    if (document.hidden) return after(900, step);

    const centre = petCentre();
    /* Behind, not in front: if the axolotl went right, the duckling is on
       its left. */
    if (Math.abs(centre - last) > 1) side = centre > last ? -1 : 1;
    last = centre;

    const want = clamp(centre + side * gap, lo, hi);
    const now = (parseFloat(friend.style.left) || want - width / 2) + width / 2;
    const dist = Math.abs(want - now);

    if (dist > 0.8) {
      /* Slower per step than the axolotl, so it is always catching up. */
      const ms = Math.round(460 + dist * 74);
      friend.style.transition = `left ${ms}ms ease-in-out`;
      friend.classList.add('friend-waddling');
      standAt(want);
      after(ms + 70, () => friend.classList.remove('friend-waddling'));
    }
    after(420, step);
  }

  after(420, step);

  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers.clear();
    friend.classList.remove('friend-waddling');
    friend.style.transition = '';
  };
}
