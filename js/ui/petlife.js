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
import { propSVG } from './props.js';

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
const n2 = v => Math.round(v * 100) / 100;

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
 * @returns {Function & {visit: Function}} call it to stop — screens must, or
 *   the timers outlive the screen and walk an axolotl that is no longer on
 *   the page. It also carries `.visit(x, opts)`, which interrupts the
 *   wandering, walks over to something she has tapped, holds a pose there
 *   and then picks the wandering back up. A function is an object, so
 *   hanging it there keeps every existing `stop = roam(room)` working.
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

  /* Where it stands when it is not visiting anything, so it can go back
     there afterwards. The scenes put the pet at a fixed distance up the
     floor; a visit moves it to the depth of whatever it went to see. */
  const homeBottom = parseFloat(pet.style.bottom);
  /* Read once, before any visit has had a chance to raise it: taken inside
     visit() instead, a second tap would record the raised value as home
     and the axolotl would stay in front of everything for good. */
  const homeZ = pet.style.zIndex;

  /* The wandering band keeps it off the bed and out of the doorway, which
     is right for strolling about and wrong for going somewhere on purpose:
     clamped to it, an axolotl asked to go to the bed stopped in the middle
     of the floor and lay down there. Reaching is a different question from
     wandering, so it has its own limit — as far across as it can go while
     the whole animal is still inside the picture. Half of an axolotl
     hanging off the edge of the room is not an improvement on standing in
     the wrong place. */
  const reach = [width / 2, 100 - width / 2];

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

  /** Walk there, then do whatever comes next.
   *
   * `depth` is how far up the floor to stand, as the bottom percentage the
   * scene placed the thing at. Walking across the room is one movement and
   * walking up to something is another, and they happen together: left and
   * bottom are animated over the same stretch of time so it crosses the
   * floor diagonally rather than sliding sideways and then backwards. */
  function walkTo(x, then, depth = null) {
    const dx = x - here;
    const dy = depth === null || !Number.isFinite(depth)
      ? 0 : depth - (parseFloat(pet.style.bottom) || 0);
    if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1) {
      if (dy) pet.style.bottom = `${n2(depth)}%`;
      return then();
    }

    /* Long legs it is not: the pace stays the same whatever the distance,
       so crossing the room takes longer than a shuffle, which is the whole
       reason crossing the room reads as a journey. */
    const ms = Math.round(520 + Math.abs(dx) * 62);
    pet.style.transition = `left ${ms}ms ease-in-out, bottom ${ms}ms ease-in-out`;
    pet.classList.add('pet-walking');
    leanTo(dx > 0 ? 3.5 : -3.5);
    here = x;
    standAt(x);
    if (dy) pet.style.bottom = `${n2(depth)}%`;
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

  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(poseTimer);
    pet.classList.remove('pet-walking', 'pet-peeking', ...POSE_CLASSES);
    pet.querySelector('.pet-zzz')?.remove();
    pet.querySelector('.pet-prop')?.remove();
    pet.style.transition = '';
    leanTo(0);
  };

  let poseTimer = null;

  /**
   * Look over at something without going to it.
   *
   * The things that cannot be visited — a clock on the wall, bunting, a
   * ball that bounces away on its own — used to leave the axolotl facing
   * the other way, carrying on with its stroll while the room moved
   * behind it. A tap should always get the animal's attention even when
   * it does not get the animal.
   */
  stop.glance = x => {
    if (stopped) return;
    /* Not in the middle of doing something else at something else. */
    if (POSE_CLASSES.some(c => pet.classList.contains(c))) return;

    /* The head turn works whatever it is up to; the body only leans when
       it is standing still, because a lean on top of a walk fights the
       lean the walk is already doing. Either way there IS a reaction —
       that is the whole point of a glance. */
    const walking = pet.classList.contains('pet-walking');
    if (!walking) leanTo(clamp((x - here) * 0.6, -9, 9));
    pet.classList.add('pet-peeking');
    setTimeout(() => {
      if (stopped) return;
      pet.classList.remove('pet-peeking');
      if (!pet.classList.contains('pet-walking')) leanTo(0);
    }, 1400);
  };

  /**
   * Go and do something at a particular spot.
   *
   * It takes over from the wandering rather than running alongside it: the
   * pending timer is cleared first, because an axolotl that is walking to
   * the bed and also walking to wherever it had decided to go next ends up
   * sliding between the two.
   *
   * @param {number} x     where to stand, as a percentage across the room
   * @param {object} opts
   * @param {string} [opts.pose]   one of the pose classes, or '' to just look
   * @param {number} [opts.ms]     how long to hold it
   * @param {number} [opts.bottom] how far up the floor the thing is, so it
   *   can stand at the same depth instead of down at the front of the room
   * @param {Function} [opts.onArrive] called when the pose starts
   */
  stop.visit = (x, { pose = '', ms = 2400, bottom = null, height = 0, onArrive } = {}) => {
    if (stopped) return;
    clearTimeout(timer);
    clearTimeout(poseTimer);
    pet.classList.remove(...POSE_CLASSES);
    pet.querySelector('.pet-zzz')?.remove();
    pet.querySelector('.pet-prop')?.remove();

    /* It goes to the thing itself now, not to the nearest spot its
       wandering was allowed to stand in. */
    const stand = clamp(x, reach[0], reach[1]);

    /* And to the right depth. A bed against the back wall is further up
       the floor than the axolotl's usual spot, and lying down at the front
       of the room was the whole problem: it napped nowhere near the bed.

       Some poses happen ON the thing rather than beside it, and those are
       lifted by a share of the thing's own height — a mattress is about a
       third of the way up a bed whatever size the screen is, which is why
       this is a fraction of the measured piece and not a number of
       percent that only looks right on a tablet. */
    const lift = (LIFT[pose] || 0) * (height || 0);
    const depth = Number.isFinite(bottom) ? clamp(bottom + lift, 0, 55) : null;

    /* In front of the thing it has gone to, whatever that thing's own
       place in the stacking order is. The watering can came out behind
       the plant the first time, which looked like an axolotl doing
       nothing beside a plant that had quietly started raining. */
    pet.style.zIndex = '12';

    walkTo(stand, () => {
      leanTo(0);
      onArrive?.();
      const goHome = () => {
        pet.style.zIndex = homeZ;
        if (Number.isFinite(homeBottom) && depth !== null) {
          pet.style.transition = 'left 700ms ease-in-out, bottom 700ms ease-in-out';
          pet.style.bottom = `${n2(homeBottom)}%`;
        }
        after(rand(600, 1500), next);
      };
      if (!pose) return after(rand(900, 1800), goHome);
      pet.classList.add(`pet-pose-${pose}`);
      /* Whatever it needs in its hands: an open book, a watering can, a
         teacup. A pose with nothing in it is a child miming. */
      const prop = propNode(pose, x < stand ? 'left' : 'right');
      if (prop) (lean || pet).append(prop);
      if (pose === 'nap') {
        const z = document.createElement('div');
        z.className = 'pet-zzz';
        z.textContent = 'z z z';
        pet.append(z);
      }
      poseTimer = setTimeout(() => {
        pet.classList.remove(`pet-pose-${pose}`);
        pet.querySelector('.pet-zzz')?.remove();
        pet.querySelector('.pet-prop')?.remove();
        goHome();
      }, ms);
    }, depth);
  };

  return stop;
}

/* How far up the thing the axolotl sits, as a share of the thing's height.
   A nap is on top of the bed; a cup of tea is lifted a little by the table
   it is on; everything else happens on the floor beside it. */
const LIFT = { nap: 0.3, sip: 0.08, cuddle: 0.05 };

/** The thing it holds while it is doing something, if that pose has one. */
function propNode(pose, side = 'right') {
  const art = propSVG(pose);
  if (!art) return null;
  return el('div', {
    class: `pet-prop pet-prop-${pose} pet-prop-${side}`,
    html: art, 'aria-hidden': 'true',
  });
}

/* Every pose class, so stopping can clear whichever one is on. */
const POSE_CLASSES = ['nap', 'read', 'water', 'play', 'sip', 'sniff', 'cuddle', 'peer']
  .map(p => `pet-pose-${p}`);


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

/* ---------- Swimming ----------

   The reason the pond exists. Everywhere else in this app the axolotl
   walks along a line at the bottom of the picture: it has one coordinate
   and the only question is how far left or right. In the water it has two,
   and that single difference is what makes the pond a place rather than a
   room with a blue wall.

   Three things do the work, and the first is much the most important:

     IT TILTS TOWARDS WHERE IT IS GOING. Rising, the nose comes up;
     sinking, it goes down; turning, it banks. Without this it is a sticker
     being slid around a window. The tilt comes from the direction of
     travel, so it is always right and never has to be authored.

     it is slow to start and slow to stop, because water is thick. The
     easing is the same one walking uses; the durations are longer.

     the tail goes properly. Walking speeds the tail up a little; swimming
     speeds it up more, and the body sways with it.

   It never touches the bottom and never breaks the surface — a duckling
   is up there paddling and an axolotl surfacing through it would look
   like a collision rather than a pond.
*/
export function swim(scene, { xBand = [12, 76], yBand = [12, 56] } = {}) {
  const pet = scene?.querySelector?.('.room-pet');
  const lean = pet?.querySelector('.pet-lean');
  if (!pet || !lean) return () => {};
  if (matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return () => {};

  const width = parseFloat(pet.style.width) || 30;
  let hereX = clamp((parseFloat(pet.style.left) || 0) + width / 2, xBand[0], xBand[1]);
  let hereY = clamp(parseFloat(pet.style.bottom) || 30, yBand[0], yBand[1]);

  let stopped = false;
  const timers = new Set();
  const after = (ms, fn) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
    return t;
  };

  const bubble = scene.parentElement?.querySelector?.('.room-speech') || null;
  const homeZ = pet.style.zIndex;

  function pointTail(x) {
    if (!bubble) return;
    const r = scene.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    if (!r.width || !b.width) return;
    const px = Math.max(15, Math.min(b.width - 15, r.left + (x / 100) * r.width - b.left));
    bubble.style.setProperty('--tail-x', `${px.toFixed(1)}px`);
  }

  const put = (x, y) => {
    pet.style.left = `${x - width / 2}%`;
    pet.style.bottom = `${y}%`;
    pointTail(x);
  };

  /** Banking into the turn and pitching up or down, from one move. */
  const tiltFor = (dx, dy) =>
    clamp(clamp(dx * 0.5, -11, 11) + clamp(-dy * 0.45, -10, 10), -17, 17);

  function glideTo(x, y, then) {
    const dx = x - hereX, dy = y - hereY;
    if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) return then();

    /* Water is thick: everything takes longer than it would on a rug. */
    const dist = Math.hypot(dx, dy);
    const ms = Math.round(900 + dist * 66);
    pet.style.transition = `left ${ms}ms ease-in-out, bottom ${ms}ms ease-in-out`;
    pet.classList.add('pet-swimming');
    lean.style.transition = 'transform .7s ease-in-out';
    lean.style.transform = `rotate(${n2(tiltFor(dx, dy))}deg)`;

    hereX = x; hereY = y;
    put(x, y);
    after(ms + 80, () => {
      /* Level off when it arrives, the way anything swimming does. */
      lean.style.transform = 'rotate(0deg)';
      then();
    });
  }

  function next() {
    if (stopped) return;
    if (document.hidden) return after(1200, next);

    const rest = () => after(rand(700, 2400), next);
    const roll = Math.random();

    if (roll < 0.2) {
      /* Hang there. Something that is floating is still doing something. */
      rest();
    } else if (roll < 0.34) {
      /* Straight up for a look at the surface, then back down. */
      const top = yBand[1];
      glideTo(hereX + rand(-6, 6), top, () =>
        after(rand(900, 1800), () => glideTo(hereX + rand(-10, 10), rand(yBand[0], yBand[1] - 12), rest)));
    } else if (roll < 0.46) {
      /* Down to the bottom to have a look at something. */
      glideTo(hereX + rand(-12, 12), yBand[0], () => after(rand(900, 2000), rest));
    } else {
      /* Off somewhere. */
      glideTo(rand(xBand[0], xBand[1]), rand(yBand[0], yBand[1]), rest);
    }
  }

  put(hereX, hereY);
  pet.classList.add('pet-swimming');
  after(140, () => { pointTail(hereX); after(rand(500, 1500), next); });

  const stop = () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers.clear();
    pet.classList.remove('pet-swimming', ...POSE_CLASSES);
    pet.querySelector('.pet-zzz')?.remove();
    pet.querySelector('.pet-prop')?.remove();
    pet.style.zIndex = '';
    pet.style.transition = '';
    lean.style.transition = '';
    lean.style.transform = 'rotate(0deg)';
  };

  /** Look over at it from wherever it is floating. */
  stop.glance = x => {
    if (stopped) return;
    if (POSE_CLASSES.some(c => pet.classList.contains(c))) return;
    lean.style.transition = 'transform .5s ease-in-out';
    lean.style.transform = `rotate(${n2(clamp((x - hereX) * 0.4, -12, 12))}deg)`;
    after(1300, () => { if (!stopped) lean.style.transform = 'rotate(0deg)'; });
  };

  /* The pond gets visits too.

     It used to be the one place where tapping something she owned brought
     nobody over: the axolotl carried on with its own swim while the lily
     pads wobbled by themselves. Underwater there is no floor to walk
     along, so it simply swims to the thing — across and up or down at
     once — and hangs there doing its bit. */
  stop.visit = (x, { pose = '', ms = 2400, bottom = null, height = 0, onArrive } = {}) => {
    if (stopped) return;
    timers.forEach(clearTimeout);
    timers.clear();
    pet.classList.remove(...POSE_CLASSES);
    pet.querySelector('.pet-zzz')?.remove();
    pet.querySelector('.pet-prop')?.remove();

    const toX = clamp(x, width / 2, 100 - width / 2);
    /* Beside it, at about the height of the thing itself rather than at
       its base: things in water are looked at from alongside. */
    const toY = Number.isFinite(bottom)
      ? clamp(bottom + (height || 0) * 0.35, yBand[0] - 6, yBand[1])
      : hereY;

    pet.style.zIndex = '12';

    glideTo(toX, toY, () => {
      onArrive?.();
      const done = () => {
        pet.style.zIndex = homeZ;
        after(rand(600, 1500), next);
      };
      if (!pose) return after(rand(900, 1800), done);
      pet.classList.add(`pet-pose-${pose}`);
      const prop = propNode(pose, x < toX ? 'left' : 'right');
      if (prop) (lean || pet).append(prop);
      after(ms, () => {
        pet.classList.remove(`pet-pose-${pose}`);
        pet.querySelector('.pet-prop')?.remove();
        done();
      });
    });
  };

  return stop;
}
