/**
 * Generates the "text Basemate" QR — scanning it opens Messages with a draft
 * to our line, body prefilled with GM.
 *
 * Error correction is H (~30%) so the centered logo tile can punch out the
 * middle without breaking the code.
 *
 *   node scripts/make-imessage-qr.mjs
 *
 * Needs `qrcode` and `sharp`, which resolve today as transitive deps. Add them
 * to devDependencies if this script ever needs to survive a clean install.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import QRCode from "qrcode";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "brand", "qr");
// The flat mark is the nav/UI logo — a blue tile with the bubble, so it stays
// legible against the white knockout. The transparent mark is white-on-nothing
// and dissolves into it.
const LOGO = path.join(ROOT, "public", "brand", "logo", "basemate-logo-flat.png");

const PHONE = "+16283165638";
const BODY = "GM";
// `?&body=` is the shape both iOS and Android parse; iOS Camera hands `sms:`
// straight to Messages, which routes to iMessage for our line.
const PAYLOAD = `sms:${PHONE}?&body=${encodeURIComponent(BODY)}`;

const INK = "#0505FF"; // electric blue
const PAPER = "#FFFFFF";
const CANVAS = "#00040A"; // near-black, for the dark variant

const SIZE = 1024; // px, final PNG edge
const MARGIN = 4; // modules of quiet zone — 4 is the spec minimum

/** Renders the QR as an SVG string with `ink` modules on a transparent field. */
async function qrSvg(ink) {
  const svg = await QRCode.toString(PAYLOAD, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: MARGIN,
    color: { dark: ink, light: "#0000" },
  });
  return svg;
}

/**
 * Composites the mark onto a white squircle tile at the centre of the code.
 * The tile is 22% of the edge — inside what ECC H can lose.
 */
async function withLogo(qrPng) {
  // The flat mark ships with its own white rounded-square field, so the mark is
  // kept well inside the tile — otherwise the two corner radii disagree and the
  // knockout reads as a ragged blob.
  const tile = Math.round(SIZE * 0.24);
  const mark = Math.round(tile * 0.6);
  const radius = Math.round(tile * 0.28); // squircle, per the design system

  const tilePng = await sharp(
    Buffer.from(
      `<svg width="${tile}" height="${tile}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${tile}" height="${tile}" rx="${radius}" ry="${radius}" fill="${PAPER}"/>
       </svg>`,
    ),
  )
    .png()
    .toBuffer();

  const markPng = await sharp(LOGO)
    .resize(mark, mark, { fit: "contain", background: "#0000" })
    .png()
    .toBuffer();

  const tileWithMark = await sharp(tilePng)
    .composite([{ input: markPng, gravity: "centre" }])
    .png()
    .toBuffer();

  return sharp(qrPng)
    .composite([{ input: tileWithMark, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Flattens onto `bg` and writes both the logo'd PNG and the bare SVG. */
async function build({ name, ink, bg }) {
  const svg = await qrSvg(ink);

  const base = await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE, { fit: "contain", background: "#0000" })
    .flatten({ background: bg })
    .png()
    .toBuffer();

  await writeFile(path.join(OUT_DIR, `${name}.png`), await withLogo(base));
  await writeFile(path.join(OUT_DIR, `${name}.svg`), svg);

  console.log(`  ${name}.png  ${name}.svg`);
}

await mkdir(OUT_DIR, { recursive: true });
console.log(`payload: ${PAYLOAD}\n`);
await build({ name: "basemate-imessage-qr", ink: INK, bg: PAPER });
await build({ name: "basemate-imessage-qr-dark", ink: PAPER, bg: CANVAS });
