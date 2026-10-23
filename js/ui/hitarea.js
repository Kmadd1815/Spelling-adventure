/* Making a piece as big to the finger as it looks to the eye.

   Every drawing in this app is made in a square, and most of a square is
   empty. A rug is a flat ellipse along the bottom of a box as tall as it
   is wide; bunting is a shallow swag across the top of one. Left as plain
   boxes, those empty halves stack over each other — and because the rug is
   drawn after the bunting, the rug's empty top half sat over the bunting
   and swallowed every tap meant for it. She tapped a banner on the wall
   and the rug answered.

   Hit-testing the shapes alone fixes that and goes slightly too far the
   other way: between the triangles of a garland there is nothing to hit,
   so a child aiming at a banner can miss it by aiming at the middle of it.

   So each piece gets one invisible rectangle, laid over exactly the part
   of its square that the drawing actually fills, worked out from the
   drawing itself. The rug's is a flat band along the bottom; the bunting's
   is a wide band along the top; neither reaches anywhere near the other.
   It is a rectangle rather than the outline of the art because a tap
   should be forgiving — the gap between two triangles of a banner is part
   of the banner as far as a finger is concerned.
*/

const NS = 'http://www.w3.org/2000/svg';

/* A little room around the drawing, in viewBox units, so the edge of a
   thing is as tappable as the middle of it. */
const PAD = 5;

/**
 * Give a piece a hit area that matches its drawing.
 * Safe to call on anything: a node with no SVG in it is left alone.
 * @param {HTMLElement} node  the .room-piece
 */
export function fitHitArea(node) {
  const svg = node?.querySelector?.('svg');
  if (!svg) return;

  /* getBBox needs the drawing to have been laid out, and the piece is
     appended before the scene is mounted, so this waits a frame. */
  const run = () => {
    if (!svg.isConnected) return;
    let box;
    try { box = svg.getBBox(); } catch { return; }
    if (!box || !box.width || !box.height) return;

    svg.querySelector('.piece-hit')?.remove();
    const hit = document.createElementNS(NS, 'rect');
    hit.setAttribute('class', 'piece-hit');
    hit.setAttribute('x', String(box.x - PAD));
    hit.setAttribute('y', String(box.y - PAD));
    hit.setAttribute('width', String(box.width + PAD * 2));
    hit.setAttribute('height', String(box.height + PAD * 2));
    hit.setAttribute('fill', 'none');
    /* Inline, because the stylesheet has a rule for every rect inside a
       piece and a presentation attribute would lose to it. `all` is what
       makes an unpainted rectangle answer a tap. */
    hit.style.pointerEvents = 'all';
    svg.insertBefore(hit, svg.firstChild);
  };

  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else setTimeout(run, 0);
}
