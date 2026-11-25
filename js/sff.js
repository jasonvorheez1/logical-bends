// FIGHTWIRE — SFF sprite archive reader (v1 PCX and v2 RLE8/RLE5/LZ5/PNG).
// Sprites decode lazily into palette indices (or RGBA for true-colour PNG).

const rd16 = (d, o) => d[o] | (d[o + 1] << 8);
const rd16s = (d, o) => { const v = rd16(d, o); return v & 0x8000 ? v - 0x10000 : v; };
const rd32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;

export class Sprite {
  constructor() {
    this.group = 0; this.no = 0; this.x = 0; this.y = 0; this.w = 0; this.h = 0;
    this.idx = null;      // Uint8Array palette indices
    this.rgba = null;     // Uint8ClampedArray for true-colour sprites
    this.pal = null;      // Uint32Array own palette (ABGR) — null means "use the character palette"
    this.palId = 0;       // v2 palette list index
    this.decoder = null;  // lazy decode closure
    this.cache = new Map();
  }
  async ready() {
    if (this.decoder) { const d = this.decoder; this.decoder = null; await d(); }
  }
}

// Build a canvas for a sprite with a given palette. Palette index 0 is transparent.
export function spriteCanvas(spr, pal, key) {
  let c = spr.cache.get(key);
  if (c) return c;
  if (!spr.w || !spr.h) return null;
  c = document.createElement('canvas');
  c.width = spr.w; c.height = spr.h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(spr.w, spr.h);
  if (spr.rgba) {
    img.data.set(spr.rgba);
  } else if (spr.idx) {
    const p = spr.pal || pal;
    const out = new Uint32Array(img.data.buffer);
    const src = spr.idx;
    for (let i = 0; i < src.length; i++) { const v = src[i]; out[i] = v ? p[v] : 0; }
  }
  ctx.putImageData(img, 0, 0);
  spr.cache.set(key, c);
  return c;
}

// RGB triples -> ABGR Uint32 palette
export function palFromRGB(bytes, off = 0, reversed = false, stride = 3) {
  const p = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const j = reversed ? 255 - i : i;
    const o = off + j * stride;
    if (o + 2 >= bytes.length) break;
    p[i] = (0xff << 24) | (bytes[o + 2] << 16) | (bytes[o + 1] << 8) | bytes[o];
  }
  return p;
}

export function palFromACT(bytes) { return palFromRGB(bytes, 0, true); }

function decodePCX(d, off, len, spr) {
  const bpl = rd16(d, off + 66);
  const x0 = rd16(d, off + 4), y0 = rd16(d, off + 6), x1 = rd16(d, off + 8), y1 = rd16(d, off + 10);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  spr.w = w; spr.h = h;
  const out = new Uint8Array(w * h);
  let p = off + 128;
  const end = off + len;
  const row = new Uint8Array(bpl);
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < bpl && p < end) {
      let b = d[p++], cnt = 1;
      if ((b & 0xc0) === 0xc0) { cnt = b & 0x3f; b = d[p++]; }
      while (cnt-- > 0 && x < bpl) row[x++] = b;
    }
    out.set(row.subarray(0, w), y * w);
  }
  spr.idx = out;
}

export async function loadSFF(bytes) {
  const d = bytes;
  const sig = String.fromCharCode(...d.subarray(0, 11));
  if (sig !== 'ElecbyteSpr') throw new Error('Not an SFF file');
  const verHi = d[15];
  return verHi === 2 ? loadV2(d) : loadV1(d);
}

function loadV1(d) {
  const nImages = rd32(d, 20);
  let off = rd32(d, 24);
  const sprites = [];
  const map = new Map();
  let curPal = null; // null => character palette (the chain that starts at sprite 0)
  let defaultPal = null;
  for (let i = 0; i < nImages && off > 0 && off < d.length; i++) {
    const next = rd32(d, off);
    const len = rd32(d, off + 4);
    const spr = new Sprite();
    spr.x = rd16s(d, off + 8); spr.y = rd16s(d, off + 10);
    spr.group = rd16(d, off + 12); spr.no = rd16(d, off + 14);
    const link = rd16(d, off + 16);
    const samePal = d[off + 18];
    const dataOff = off + 32;
    if (len === 0) {
      const src = sprites[link];
      if (src) {
        spr.linkOf = src;
        spr.decoder = async () => { await src.ready(); spr.w = src.w; spr.h = src.h; spr.idx = src.idx; spr.pal = src.pal; };
        // linked sprites inherit dimensions once decoded
      }
    } else {
      const po = dataOff + len - 768;
      const hasPal = len > 769 && d[po - 1] === 0x0c;
      if (i === 0) {
        if (hasPal) defaultPal = palFromRGB(d, po);
        curPal = null;
        spr.pal = null;
      } else if (!samePal) {
        const own = hasPal ? palFromRGB(d, po) : null;
        // Portraits / UI art (group 9000+) keep their own colours but never start a palette
        // chain: body sprites that follow them must still use the selected character palette.
        // An own palette identical to the character's default is also just the character palette.
        const isDefault = own && defaultPal && own.every((v, k) => k === 0 || v === defaultPal[k]);
        spr.pal = isDefault ? null : own;
        if (spr.group < 9000) curPal = isDefault ? null : own;
      } else {
        spr.pal = curPal;
      }
      spr.w = rd16(d, dataOff + 8) - rd16(d, dataOff + 4) + 1;
      spr.h = rd16(d, dataOff + 10) - rd16(d, dataOff + 6) + 1;
      spr.decoder = async () => decodePCX(d, dataOff, len, spr);
    }
    sprites.push(spr);
    const key = spr.group * 65536 + spr.no;
    if (!map.has(key)) map.set(key, spr);
    if (!next || next <= off) break;
    off = next;
  }
  return { version: 1, sprites, map, palettes: defaultPal ? [defaultPal] : [], palMap: new Map(), defaultPal };
}

// ---- SFF v2 ----
function rle8(src, size) {
  const out = new Uint8Array(size);
  let i = 0, j = 0;
  while (j < size && i < src.length) {
    let b = src[i++], n = 1;
    if ((b & 0xc0) === 0x40) { n = b & 0x3f; b = src[i++]; }
    while (n-- > 0 && j < size) out[j++] = b;
  }
  return out;
}
function rle5(rle, size) {
  const p = new Uint8Array(size);
  let i = 0, j = 0;
  const L = rle.length - 1;
  while (j < size) {
    let rl = rle[i]; if (i < L) i++;
    let dl = rle[i] & 0x7f;
    let c = 0;
    if (rle[i] >> 7) { if (i < L) i++; c = rle[i]; }
    if (i < L) i++;
    for (;;) {
      if (j < size) p[j++] = c;
      rl--;
      if (rl < 0) {
        dl--;
        if (dl < 0) break;
        c = rle[i] & 0x1f; rl = rle[i] >> 5;
        if (i < L) i++;
      }
    }
    if (i >= L && j < size && dl < 0 && rl < 0 && rle.length <= 1) break;
  }
  return p;
}
function lz5(rle, size) {
  const p = new Uint8Array(size);
  if (!rle.length) return p;
  let i = 0, j = 0, n = 0;
  const L = rle.length - 1;
  let ct = rle[i], cts = 0, rb = 0, rbc = 0;
  if (rle.length > 1) i++;
  let guard = 0;
  while (j < size) {
    if (++guard > size * 4 + 1000) break;
    let d = rle[i];
    if (i < L) i++;
    if (ct & (1 << cts)) {
      if ((d & 0x3f) === 0) {
        d = ((d << 2) | rle[i]) + 1;
        if (i < L) i++;
        n = rle[i] + 2;
        if (i < L) i++;
      } else {
        rb |= (d & 0xc0) >> rbc;
        rbc += 2;
        n = d & 0x3f;
        if (rbc < 8) {
          d = rle[i] + 1;
          if (i < L) i++;
        } else {
          d = rb + 1;
          rb = 0; rbc = 0;
        }
      }
      for (;;) {
        if (j < size) { p[j] = j - d >= 0 ? p[j - d] : 0; j++; }
        n--;
        if (n < 0) break;
      }
    } else {
      if ((d & 0xe0) === 0) {
        n = rle[i] + 8;
        if (i < L) i++;
      } else {
        n = d >> 5;
        d &= 0x1f;
      }
      for (; n > 0 && j < size; n--) p[j++] = d;
    }
    cts++;
    if (cts >= 8) {
      ct = rle[i]; cts = 0;
      if (i < L) i++;
    }
  }
  return p;
}

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Minimal PNG decoder (indexed or truecolour, 8-bit, non-interlaced).
async function decodePNG(bytes) {
  let p = 8;
  let w = 0, h = 0, depth = 8, ctype = 3;
  const idat = [];
  let plte = null, trns = null;
  while (p + 8 <= bytes.length) {
    const len = (bytes[p] << 24 | bytes[p + 1] << 16 | bytes[p + 2] << 8 | bytes[p + 3]) >>> 0;
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const body = bytes.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = (body[0] << 24 | body[1] << 16 | body[2] << 8 | body[3]) >>> 0;
      h = (body[4] << 24 | body[5] << 16 | body[6] << 8 | body[7]) >>> 0;
      depth = body[8]; ctype = body[9];
    } else if (type === 'PLTE') plte = body;
    else if (type === 'tRNS') trns = body;
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  let total = 0; for (const c of idat) total += c.length;
  const all = new Uint8Array(total); let o = 0; for (const c of idat) { all.set(c, o); o += c.length; }
  const raw = await inflate(all);
  const chans = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype] || 1;
  const bpp = Math.max(1, (chans * depth) >> 3);
  const stride = Math.ceil(w * chans * depth / 8);
  const out = new Uint8Array(stride * h);
  let prev = new Uint8Array(stride);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++];
    const line = raw.subarray(q, q + stride); q += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      switch (f) {
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); break; }
      }
      cur[x] = v & 255;
    }
    prev = cur;
  }
  if (ctype === 3) {
    let idx = out;
    if (depth < 8) {
      idx = new Uint8Array(w * h);
      const per = 8 / depth, mask = (1 << depth) - 1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const byte = out[y * stride + Math.floor(x / per)];
        idx[y * w + x] = (byte >> ((per - 1 - (x % per)) * depth)) & mask;
      }
    }
    return { w, h, idx, plte, trns };
  }
  // truecolour -> RGBA
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = i * chans;
    if (chans === 4) { rgba[i * 4] = out[s]; rgba[i * 4 + 1] = out[s + 1]; rgba[i * 4 + 2] = out[s + 2]; rgba[i * 4 + 3] = out[s + 3]; }
    else if (chans === 3) { rgba[i * 4] = out[s]; rgba[i * 4 + 1] = out[s + 1]; rgba[i * 4 + 2] = out[s + 2]; rgba[i * 4 + 3] = 255; }
    else if (chans === 2) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = out[s]; rgba[i * 4 + 3] = out[s + 1]; }
    else { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = out[s]; rgba[i * 4 + 3] = 255; }
  }
  return { w, h, rgba };
}

function loadV2(d) {
  const sprOff = rd32(d, 36), nSpr = rd32(d, 40);
  const palOff = rd32(d, 44), nPal = rd32(d, 48);
  const ldata = rd32(d, 52), tdata = rd32(d, 60);
  const palettes = [];
  const palMap = new Map();
  for (let i = 0; i < nPal; i++) {
    const o = palOff + i * 16;
    const g = rd16(d, o), it = rd16(d, o + 2), nc = rd16(d, o + 4), link = rd16(d, o + 6);
    const po = rd32(d, o + 8), plen = rd32(d, o + 12);
    let pal;
    if (plen === 0 && palettes[link]) pal = palettes[link];
    else {
      pal = new Uint32Array(256);
      const base = ldata + po;
      for (let c = 0; c < Math.min(nc, 256); c++) {
        const b = base + c * 4;
        pal[c] = (0xff << 24) | (d[b + 2] << 16) | (d[b + 1] << 8) | d[b];
      }
    }
    palettes.push(pal);
    palMap.set(g * 65536 + it, i);
  }
  const sprites = [];
  const map = new Map();
  for (let i = 0; i < nSpr; i++) {
    const o = sprOff + i * 28;
    const spr = new Sprite();
    spr.group = rd16(d, o); spr.no = rd16(d, o + 2);
    spr.w = rd16(d, o + 4); spr.h = rd16(d, o + 6);
    spr.x = rd16s(d, o + 8); spr.y = rd16s(d, o + 10);
    const link = rd16(d, o + 12);
    const fmt = d[o + 14];
    const dOff = rd32(d, o + 16), dLen = rd32(d, o + 20);
    spr.palId = rd16(d, o + 24);
    const flags = rd16(d, o + 26);
    if (dLen === 0) {
      const src = sprites[link];
      if (src) spr.decoder = async () => { await src.ready(); spr.w = src.w; spr.h = src.h; spr.x = spr.x; spr.idx = src.idx; spr.rgba = src.rgba; spr.palId = src.palId; };
    } else {
      const base = (flags & 1 ? tdata : ldata) + dOff;
      const w = spr.w, h = spr.h;
      spr.decoder = async () => {
        const size = w * h;
        if (fmt === 0) spr.idx = d.slice(base, base + size);
        else if (fmt === 2) spr.idx = rle8(d.subarray(base + 4, base + dLen), size);
        else if (fmt === 3) spr.idx = rle5(d.subarray(base + 4, base + dLen), size);
        else if (fmt === 4) spr.idx = lz5(d.subarray(base + 4, base + dLen), size);
        else if (fmt >= 10) {
          const png = await decodePNG(d.subarray(base + 4, base + dLen));
          if (png.idx) spr.idx = png.idx; else spr.rgba = png.rgba;
          spr.w = png.w; spr.h = png.h;
        }
      };
    }
    spr.pal = spr.palId ? palettes[spr.palId] || null : null;
    if (dLen === 0) {
      const dec = spr.decoder;
      if (dec) spr.decoder = async () => { await dec(); spr.pal = spr.palId ? palettes[spr.palId] || null : null; };
    }
    sprites.push(spr);
    const key = spr.group * 65536 + spr.no;
    if (!map.has(key)) map.set(key, spr);
  }
  return { version: 2, sprites, map, palettes, palMap, defaultPal: palettes[0] || null };
}

export function getSprite(sff, g, n) {
  return sff.map.get(g * 65536 + n) || null;
}

// Decode every sprite up front (keeps the fight loop free of async work).
export async function decodeAll(sff, onProgress) {
  const n = sff.sprites.length;
  for (let i = 0; i < n; i++) {
    await sff.sprites[i].ready();
    if (onProgress && (i & 63) === 0) { onProgress(i / n); await new Promise(r => setTimeout(r, 0)); }
  }
}
