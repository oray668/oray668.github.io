// Bricks are .brick elements (pointer-events: none in CSS) each containing an <img>.
// All interaction is handled here: a brick only reacts if the pointer is over a
// non-transparent pixel of its PNG. Transparent areas let clicks pass straight through
// to whatever is underneath (other bricks, the project table, links, etc).

const bricks = Array.from(document.querySelectorAll('#brick-wrapper .brick'));
const root = document.documentElement;
const ctxCache = new WeakMap();
let warnedAboutCanvas = false;

/* ---------- alpha hit-testing ---------- */

// Draw each image to an offscreen canvas once and reuse it
function getContext(img) {
  if (!img.complete || !img.naturalWidth) return null; // not loaded yet, don't cache
  let ctx = ctxCache.get(img);
  if (!ctx) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    ctxCache.set(img, ctx);
  }
  return ctx;
}

function isOpaque(img, e) {
  const rect = img.getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX >= rect.right ||
      e.clientY < rect.top  || e.clientY >= rect.bottom) return false;

  const ctx = getContext(img);
  if (!ctx) return false;

  const x = Math.floor((e.clientX - rect.left) * (img.naturalWidth / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (img.naturalHeight / rect.height));

  try {
    return ctx.getImageData(x, y, 1, 1).data[3] > 10; // small threshold for anti-aliased edges
  } catch (err) {
    // Canvas is "tainted" (cross-origin image, or page opened via file://).
    // Fall back to treating the whole image box as clickable.
    if (!warnedAboutCanvas) {
      console.warn('Cannot read image pixels; use a local server / same-origin images.', err);
      warnedAboutCanvas = true;
    }
    return true;
  }
}

const zOf = el => Number(getComputedStyle(el).zIndex) || 0;

// Topmost brick with an opaque pixel under the pointer (or null)
function brickAt(e) {
  let best = null;
  let bestZ = -Infinity;
  for (const brick of bricks) {
    const img = brick.querySelector('img');
    if (!img || !isOpaque(img, e)) continue;
    const z = zOf(brick);
    if (z >= bestZ) { best = brick; bestZ = z; } // >= so later DOM order wins ties
  }
  return best;
}

/* ---------- positioning ---------- */

// Bricks are positioned in % of the viewport (their containing block), so keep it that way
function setPos(brick, x, y) {
  const w = root.clientWidth;
  const h = root.clientHeight;
  brick.style.right = 'auto';   // in case a brick was placed with right/bottom
  brick.style.bottom = 'auto';
  brick.style.left = (x / w * 100) + '%';
  brick.style.top = (y / h * 100) + '%';
}

// Stay below #name-title (z-index 102); renormalise if we get close
let topZ = 10;
function bringToFront(brick) {
  if (topZ >= 90) {
    const ordered = [...bricks].sort((a, b) => zOf(a) - zOf(b));
    ordered.forEach((b, i) => { b.style.zIndex = 10 + i; });
    topZ = 10 + ordered.length - 1;
  }
  brick.style.zIndex = ++topZ;
}

/* ---------- hover feedback ---------- */

let hovered = null;
function setHover(brick) {
  if (brick === hovered) return;
  if (hovered) hovered.classList.remove('is-hover');
  if (brick) brick.classList.add('is-hover');   // shows .hover-info
  root.classList.toggle('over-brick', !!brick); // grab cursor
  hovered = brick;
}

/* ---------- dragging ---------- */

let active = null;
let startX = 0, startY = 0, startLeft = 0, startTop = 0;
let clickGuard = false;

document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const brick = brickAt(e);
  if (!brick) return;                 // transparent area: let the event do its normal thing

  e.preventDefault();                 // also stops compat mouse events reaching other scripts
  clickGuard = true;                  // swallow the click that follows (e.g. on a link underneath)

  const rect = brick.getBoundingClientRect();
  active = brick;
  startX = e.clientX;
  startY = e.clientY;
  startLeft = rect.left;
  startTop = rect.top;

  setPos(brick, startLeft, startTop); // convert right/bottom placement to left/top without a jump
  bringToFront(brick);
  setHover(brick);
  window.getSelection()?.removeAllRanges(); // drop any highlight that includes the image
  root.classList.add('is-dragging');
  root.setPointerCapture(e.pointerId); // keep receiving events if the pointer leaves the window
});

document.addEventListener('pointermove', e => {
  if (active) {
    setPos(active, startLeft + (e.clientX - startX), startTop + (e.clientY - startY));
  } else {
    setHover(brickAt(e));
  }
});

function endDrag(e) {
  if (!active) return;
  active = null;
  root.classList.remove('is-dragging');
  if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
  setTimeout(() => { clickGuard = false; }, 0);
  setHover(brickAt(e));
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

// Block clicks that were really the end of a brick press/drag
document.addEventListener('click', e => {
  if (clickGuard) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

root.addEventListener('pointerleave', () => { if (!active) setHover(null); });

/* ---------- block native image drag / selection ---------- */

// Never let the browser start its own "drag this image" ghost on a brick
bricks.forEach(brick => {
  brick.querySelectorAll('img').forEach(img => { img.draggable = false; });
});
document.addEventListener('dragstart', e => {
  if (e.target instanceof Element && e.target.closest('.brick')) e.preventDefault();
});

// If a selection (e.g. drag-select or Ctrl/Cmd+A) swallows a brick, clear that part of it
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  if (bricks.some(b => sel.containsNode(b, true))) {
    // only wipe the selection if it's purely brick content (keeps normal text selection in the table working)
    const text = sel.toString().trim();
    if (!text) sel.removeAllRanges();
  }
});