// Genereert de PWA-iconen (192/512/512-maskable) als PNG zonder externe
// dependencies: rauwe RGBA-pixels + zlib, met een oranje "V"-monogram op
// donkere achtergrond. Draaien met: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const ACCENT = [0xff, 0x68, 0x23];
const DONKER = [0x0e, 0x0e, 0x10];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bitdiepte
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Afstand van punt p tot lijnsegment a-b
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function maakIcoon(size, { maskable }) {
  const pixels = Buffer.alloc(size * size * 4);
  const c = size / 2;
  // Maskable: safe zone = 80% — teken het monogram kleiner
  const schaal = maskable ? 0.62 : 0.8;
  const dikte = size * 0.075 * schaal;
  // "V": twee lijnsegmenten van boven naar het onderste midden
  const topY = c - size * 0.22 * schaal;
  const botY = c + size * 0.24 * schaal;
  const spreid = size * 0.19 * schaal;
  const hoekRadius = maskable ? 0 : size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Achtergrond met afgeronde hoeken (behalve maskable: vol vlak)
      let alpha = 255;
      if (hoekRadius > 0) {
        const rx = Math.max(Math.abs(x - c) - (c - hoekRadius), 0);
        const ry = Math.max(Math.abs(y - c) - (c - hoekRadius), 0);
        const d = Math.hypot(rx, ry) - hoekRadius;
        alpha = d > 0.5 ? 0 : d > -0.5 ? Math.round(255 * (0.5 - d)) : 255;
      }
      const dLinks = distSeg(x, y, c - spreid, topY, c, botY);
      const dRechts = distSeg(x, y, c + spreid, topY, c, botY);
      const d = Math.min(dLinks, dRechts) - dikte;
      // Anti-aliasing over 1px rand
      const t = Math.max(0, Math.min(1, 0.5 - d));
      const kleur = [
        DONKER[0] + (ACCENT[0] - DONKER[0]) * t,
        DONKER[1] + (ACCENT[1] - DONKER[1]) * t,
        DONKER[2] + (ACCENT[2] - DONKER[2]) * t,
      ];
      pixels[i] = kleur[0];
      pixels[i + 1] = kleur[1];
      pixels[i + 2] = kleur[2];
      pixels[i + 3] = alpha;
    }
  }
  return png(size, pixels);
}

mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/icons/icon-192.png', import.meta.url), maakIcoon(192, { maskable: false }));
writeFileSync(new URL('../public/icons/icon-512.png', import.meta.url), maakIcoon(512, { maskable: false }));
writeFileSync(new URL('../public/icons/icon-maskable-512.png', import.meta.url), maakIcoon(512, { maskable: true }));
console.log('iconen gegenereerd in public/icons/');
