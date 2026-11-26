// FIGHTWIRE — AIR animation reader and per-entity animation player.
import { stripComment } from './util.js';

function parseTrans(s) {
  s = (s || '').trim().toUpperCase();
  if (!s) return null;
  if (s === 'A') return { mode: 'add', src: 256, dst: 256 };
  if (s === 'A1') return { mode: 'add', src: 256, dst: 128 };
  if (s === 'S') return { mode: 'sub', src: 256, dst: 256 };
  const m = s.match(/^AS(\d+)D(\d+)$/);
  if (m) {
    const src = +m[1], dst = +m[2];
    if (src + dst >= 250 && dst > 0 && src < 256) return { mode: 'alpha', src, dst };
    return { mode: dst >= 200 ? 'add' : 'alpha', src, dst };
  }
  return null;
}

export function parseAIR(text) {
  const anims = new Map();
  let cur = null;
  let defC1 = null, defC2 = null, nextC1 = null, nextC2 = null;
  let pendingKind = 0, pendingDefault = false, pendingList = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (line[0] === '[') {
      const m = line.match(/begin\s+action\s+(-?\d+)/i);
      if (m) {
        cur = { no: +m[1], frames: [], loopStart: 0 };
        if (!anims.has(cur.no)) anims.set(cur.no, cur);
        defC1 = defC2 = nextC1 = nextC2 = null;
      } else cur = null;
      continue;
    }
    if (!cur) continue;
    const low = line.toLowerCase();
    let m;
    if ((m = low.match(/^clsn([12])(default)?\s*:\s*(\d+)/))) {
      pendingKind = +m[1]; pendingDefault = !!m[2];
      pendingList = [];
      if (pendingKind === 1) { if (pendingDefault) defC1 = pendingList; else nextC1 = pendingList; }
      else { if (pendingDefault) defC2 = pendingList; else nextC2 = pendingList; }
      continue;
    }
    if ((m = low.match(/^clsn([12])\s*\[\s*\d+\s*\]\s*=\s*(.*)$/))) {
      const v = m[2].split(',').map(Number);
      if (v.length >= 4 && pendingList) {
        const [a, b, c, d] = v;
        pendingList.push([Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)]);
      }
      continue;
    }
    if (low.startsWith('loopstart')) { cur.loopStart = cur.frames.length; continue; }
    if (/^[a-z]/.test(low)) continue; // interpolate etc.
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 5) continue;
    const f = {
      g: parseInt(parts[0]) || 0, n: parseInt(parts[1]) || 0,
      x: parseInt(parts[2]) || 0, y: parseInt(parts[3]) || 0,
      time: parseInt(parts[4]),
      hflip: false, vflip: false, trans: null,
      xs: 1, ys: 1, angle: 0,
      clsn1: nextC1 || defC1, clsn2: nextC2 || defC2,
    };
    if (isNaN(f.time)) f.time = 1;
    const fl = (parts[5] || '').toUpperCase();
    f.hflip = fl.includes('H'); f.vflip = fl.includes('V');
    f.trans = parseTrans(parts[6]);
    if (parts[7] !== undefined && parts[7] !== '') f.xs = parseFloat(parts[7]) || 1;
    if (parts[8] !== undefined && parts[8] !== '') f.ys = parseFloat(parts[8]) || 1;
    if (parts[9] !== undefined && parts[9] !== '') f.angle = parseFloat(parts[9]) || 0;
    nextC1 = nextC2 = null;
    cur.frames.push(f);
  }
  for (const a of anims.values()) finalizeAnim(a);
  return anims;
}

export function finalizeAnim(a) {
  let t = 0;
  a.starts = [];
  a.infinite = false;
  for (const f of a.frames) {
    a.starts.push(t);
    if (f.time < 0) { a.infinite = true; }
    else t += f.time;
  }
  a.total = t;
  if (a.loopStart >= a.frames.length) a.loopStart = 0;
}

// Plays one Anim. Advances one tick at a time.
export class AnimPlayer {
  constructor(anim, owner = null) {
    this.set(anim, owner);
  }
  set(anim, owner = null, elem = 0) {
    this.anim = anim;
    this.owner = owner; // CharDef that owns the animation (sprites)
    this.no = anim ? anim.no : -1;
    this.elem = 0;
    this.elemTime = 0;
    this.time = 0; // ticks since start (wraps on loop)
    this.loops = 0;
    if (anim && elem > 0 && elem < anim.frames.length) {
      this.elem = elem;
      this.time = anim.starts[elem];
    }
  }
  frame() { return this.anim && this.anim.frames.length ? this.anim.frames[this.elem] : null; }
  step() {
    const a = this.anim;
    if (!a || !a.frames.length) return;
    const f = a.frames[this.elem];
    if (f.time < 0) { this.elemTime++; this.time++; return; }
    this.elemTime++;
    this.time++;
    if (this.elemTime >= f.time) {
      this.elemTime = 0;
      this.elem++;
      if (this.elem >= a.frames.length) {
        this.elem = a.loopStart;
        this.time = a.starts[a.loopStart];
        this.loops++;
      }
      // skip zero-length frames
      let guard = 0;
      while (a.frames[this.elem].time === 0 && guard++ < a.frames.length) {
        this.elem++;
        if (this.elem >= a.frames.length) { this.elem = a.loopStart; this.time = a.starts[a.loopStart]; this.loops++; }
      }
    }
  }
  // At the loop boundary the sprite has wrapped, but triggers still see the completed duration.
  triggerTime() {
    const a = this.anim;
    if (this.loops && this.time === a.starts[a.loopStart]) return a.total;
    return this.time;
  }
  animTime() {
    const a = this.anim;
    if (!a) return 0;
    if (a.infinite) {
      const f = a.frames[this.elem];
      if (f && f.time < 0) return 0;
      return this.time - a.total;
    }
    return this.triggerTime() - a.total;
  }
  elemNo() { return this.elem + 1; }
  // Ticks since element n (1-based) started; negative if not reached yet in this loop.
  elemTimeOf(n) {
    const a = this.anim;
    if (!a || n < 1 || n > a.frames.length) return -99999;
    return this.triggerTime() - a.starts[n - 1];
  }
  elemNoAt(t) {
    const a = this.anim;
    if (!a) return 0;
    const tt = this.time + t;
    for (let i = a.frames.length - 1; i >= 0; i--) if (a.starts[i] <= tt) return i + 1;
    return 1;
  }
  // true on the first tick of element n
  elemStarted(n) {
    return this.elem + 1 === n && this.elemTimeOf(n) === 0;
  }
}
