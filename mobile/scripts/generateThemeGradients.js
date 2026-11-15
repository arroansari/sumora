const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function createLuxuryGradientPng(width, height, c1, c2, c3, angleDeg = 135, sheen = 0.22) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc(height * (1 + width * 3));
  let pos = 0;

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (let y = 0; y < height; y++) {
    raw[pos++] = 0;
    const ny = (y / height) - 0.5;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) - 0.5;

      // Diagonal gradient projection
      const proj = nx * cos + ny * sin;
      let t = (proj + 0.5);
      t = Math.max(0, Math.min(1, t));

      // S-curve smoothstep
      const st = t * t * (3 - 2 * t);

      let r, g, b;
      if (st < 0.5) {
        const localT = st * 2;
        r = c1[0] + (c2[0] - c1[0]) * localT;
        g = c1[1] + (c2[1] - c1[1]) * localT;
        b = c1[2] + (c2[2] - c1[2]) * localT;
      } else {
        const localT = (st - 0.5) * 2;
        r = c2[0] + (c3[0] - c2[0]) * localT;
        g = c2[1] + (c3[1] - c2[1]) * localT;
        b = c2[2] + (c3[2] - c2[2]) * localT;
      }

      // Top-left specular sheen highlight:
      // Adds a pearlescent, luminous luxury glow
      const distFromTopLeft = Math.sqrt((nx + 0.35) ** 2 + (ny + 0.35) ** 2);
      const highlight = Math.max(0, 1 - distFromTopLeft * 1.4) * sheen * 255;

      // Subtle lift to prevent any muddy dark corners (no dark vignette)
      r = Math.round(Math.min(255, Math.max(0, r + highlight)));
      g = Math.round(Math.min(255, Math.max(0, g + highlight)));
      b = Math.round(Math.min(255, Math.max(0, b + highlight)));

      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const outDir = path.resolve(__dirname, '../src/assets/images/themes');
fs.mkdirSync(outDir, { recursive: true });

// Lightened, luminous, rich luxury palettes
const themes = [
  {
    id: 'royal_amethyst',
    // Rich imperial violet -> vibrant luminous amethyst -> radiant cobalt
    stops: ['#581C87', '#8B5CF6', '#3B82F6'],
  },
  {
    id: 'champagne_gold',
    // Warm cognac amber -> lustrous honey -> bright champagne gold
    stops: ['#78350F', '#D97706', '#FBBF24'],
  },
  {
    id: 'emerald_prestige',
    // Deep pine emerald -> vibrant jade -> luminous mint
    stops: ['#065F46', '#059669', '#34D399'],
  },
  {
    id: 'sunset_cashmere',
    // Rich Venetian rose -> radiant rose -> warm coral sunset
    stops: ['#9F1239', '#F43F5E', '#FB923C'],
  },
  {
    id: 'sapphire_celestial',
    // Rich royal navy -> vivid electric cobalt -> brilliant sky azure
    stops: ['#1E3A8A', '#2563EB', '#38BDF8'],
  },
  {
    id: 'velvet_orchid',
    // Rich Byzantine magenta -> bright orchid -> luminous coral rose
    stops: ['#701A75', '#A855F7', '#FB7185'],
  },
];

themes.forEach((t) => {
  const c1 = hexToRgb(t.stops[0]);
  const c2 = hexToRgb(t.stops[1]);
  const c3 = hexToRgb(t.stops[2]);

  // 1. Header gradient (768 x 384, 135 deg with 0.20 sheen)
  const headerBuf = createLuxuryGradientPng(768, 384, c1, c2, c3, 135, 0.20);
  fs.writeFileSync(path.join(outDir, `header_${t.id}.png`), headerBuf);

  // 2. Button gradient (512 x 128, 115 deg with 0.22 sheen)
  const btnBuf = createLuxuryGradientPng(512, 128, c1, c2, c3, 115, 0.22);
  fs.writeFileSync(path.join(outDir, `button_${t.id}.png`), btnBuf);

  // 3. Swatch gradient (160 x 160, 135 deg with 0.24 sheen)
  const swatchBuf = createLuxuryGradientPng(160, 160, c1, c2, c3, 135, 0.24);
  fs.writeFileSync(path.join(outDir, `swatch_${t.id}.png`), swatchBuf);

  console.log(`Luminous luxury gradient generated for ${t.id} (${t.stops.join(' -> ')})`);
});
