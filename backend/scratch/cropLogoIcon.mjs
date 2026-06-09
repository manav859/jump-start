// One-off: derive the icon-only mark (arrow-through-J emblem) from the full
// Jumpstart logo by detecting the opaque cluster that sits ABOVE the
// "JUMPSTART" wordmark, cropping it square, and emitting:
//   frontend/src/assets/jumpstart-icon.png  (square emblem, transparent)
//   frontend/public/favicon.png             (256x256 favicon)
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../.."); // jumpstart/
// Read from the pristine copy so re-runs are idempotent (we overwrite the
// trimmed full logo in place).
const SRC = resolve(root, "frontend/src/assets/jumpstart-logo-source.png");
const FULL_OUT = resolve(root, "frontend/src/assets/jumpstart-logo.png");
const ICON_OUT = resolve(root, "frontend/src/assets/jumpstart-icon.png");
const FAV_OUT = resolve(root, "frontend/public/favicon.png");

const ALPHA = 24; // opacity threshold for "content"

const img = await loadImage(SRC);
const W = img.width, H = img.height;
const c = createCanvas(W, H);
const ctx = c.getContext("2d");
ctx.drawImage(img, 0, 0);
const data = ctx.getImageData(0, 0, W, H).data;

const rowHasContent = (y) => {
  for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > ALPHA) return true;
  return false;
};

// Find vertical content segments (runs of non-empty rows).
const segments = [];
let start = -1;
for (let y = 0; y < H; y++) {
  const on = rowHasContent(y);
  if (on && start === -1) start = y;
  else if (!on && start !== -1) { segments.push([start, y - 1]); start = -1; }
}
if (start !== -1) segments.push([start, H - 1]);

// The emblem = everything from the top of the first segment down to the
// bottom of the last segment BEFORE the largest inter-segment gap (which
// separates the mark+flourish from the wordmark).
let splitIdx = segments.length - 1, maxGap = -1;
for (let i = 0; i < segments.length - 1; i++) {
  const gap = segments[i + 1][0] - segments[i][1];
  if (gap > maxGap) { maxGap = gap; splitIdx = i; }
}
const top = segments[0][0];
const bottom = segments[splitIdx][1];

// Horizontal bounds across the emblem rows.
let minX = W, maxX = 0;
for (let y = top; y <= bottom; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > ALPHA) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
  }
}
const cw = maxX - minX + 1, ch = bottom - top + 1;
const side = Math.max(cw, ch);
const pad = Math.round(side * 0.08); // small breathing room
const box = side + pad * 2;

console.log(`logo ${W}x${H}; segments=${segments.length}; emblem rows ${top}-${bottom} (${ch}px), x ${minX}-${maxX} (${cw}px); square=${box}`);

// Render emblem centered on a transparent square.
const out = createCanvas(box, box);
const octx = out.getContext("2d");
octx.drawImage(
  img,
  minX, top, cw, ch,
  Math.round((box - cw) / 2), Math.round((box - ch) / 2), cw, ch
);
writeFileSync(ICON_OUT, out.toBuffer("image/png"));

// ── Trimmed FULL logo: tight bounding box over ALL content (mark + wordmark)
// so it renders crisply at header heights instead of being a tiny mark
// floating in a 500x500 transparent square. ──────────────────────────────
{
  const fullTop = segments[0][0];
  const fullBottom = segments[segments.length - 1][1];
  let fminX = W, fmaxX = 0;
  for (let y = fullTop; y <= fullBottom; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > ALPHA) { if (x < fminX) fminX = x; if (x > fmaxX) fmaxX = x; }
    }
  }
  const fw = fmaxX - fminX + 1, fh = fullBottom - fullTop + 1;
  const m = Math.round(Math.max(fw, fh) * 0.04); // tiny uniform margin
  const ow = fw + m * 2, oh = fh + m * 2;
  const full = createCanvas(ow, oh);
  full.getContext("2d").drawImage(img, fminX, fullTop, fw, fh, m, m, fw, fh);
  writeFileSync(FULL_OUT, full.toBuffer("image/png"));
  console.log(`full logo trimmed -> ${ow}x${oh} (content ${fw}x${fh})`);
}

// Favicon 256x256.
const FAV = 256;
const fav = createCanvas(FAV, FAV);
const fctx = fav.getContext("2d");
fctx.imageSmoothingEnabled = true;
fctx.imageSmoothingQuality = "high";
fctx.drawImage(out, 0, 0, FAV, FAV);
writeFileSync(FAV_OUT, fav.toBuffer("image/png"));

console.log("wrote:", ICON_OUT, "and", FAV_OUT);
