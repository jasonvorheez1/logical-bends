// FIGHTWIRE — keyboard/gamepad input and MUGEN command matching.

export const BTN = { a: 1, b: 2, c: 4, x: 8, y: 16, z: 32, s: 64, e: 128, q: 256 };
export const DIR = { U: 1, D: 2, B: 4, F: 8 };

// Default key maps. E = easy special, Q = easy super.
export const KEYMAPS = [
  {
    U: ['KeyW'], D: ['KeyS'], L: ['KeyA'], R: ['KeyD'],
    x: ['KeyL'], y: ['Semicolon'], z: ['Quote'], a: ['Comma'], b: ['Period'], c: ['Slash'],
    s: ['Enter'], e: ['KeyE'], q: ['KeyQ'],
  },
  {
    U: ['ArrowUp'], D: ['ArrowDown'], L: ['ArrowLeft'], R: ['ArrowRight'],
    x: ['Numpad4'], y: ['Numpad5'], z: ['Numpad6'], a: ['Numpad1'], b: ['Numpad2'], c: ['Numpad3'],
    s: ['NumpadEnter'], e: ['Numpad7'], q: ['Numpad9'],
  },
];

class Keyboard {
  constructor() {
    this.down = new Set();
    this.latched = new Set(); // keys pressed since the last game tick (catches very short taps)
    if (typeof addEventListener === 'undefined') return;
    addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Slash', 'Quote', 'Semicolon', 'Comma', 'Period'].includes(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.latched.add(e.code);
      this.down.add(e.code);
    });
    addEventListener('keyup', e => this.down.delete(e.code));
    addEventListener('blur', () => {
      this.down.clear();
      this.latched.clear();
    });
  }
}
export const keyboard = new Keyboard();

// Read a raw input snapshot for player slot (0/1): {l,r,u,d, buttons bitmask}
export function readRaw(slot) {
  const km = KEYMAPS[slot];
  const k = keyboard.down, lt = keyboard.latched;
  const has = (list) => list.some(c => k.has(c) || lt.has(c));
  let u = has(km.U), d = has(km.D), l = has(km.L), r = has(km.R);
  let btn = 0;
  for (const b of ['a', 'b', 'c', 'x', 'y', 'z', 's', 'e', 'q']) if (has(km[b])) btn |= BTN[b];
  // gamepads: pad 0 -> P1, pad 1 -> P2
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads && pads[slot];
  if (pad) {
    const B = (i) => pad.buttons[i] && pad.buttons[i].pressed;
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    if (B(12) || ay < -0.5) u = true;
    if (B(13) || ay > 0.5) d = true;
    if (B(14) || ax < -0.5) l = true;
    if (B(15) || ax > 0.5) r = true;
    if (B(2)) btn |= BTN.x; if (B(3)) btn |= BTN.y; if (B(5)) btn |= BTN.z;
    if (B(0)) btn |= BTN.a; if (B(1)) btn |= BTN.b; if (B(7)) btn |= BTN.c;
    if (B(4)) btn |= BTN.e; if (B(6)) btn |= BTN.q;
    if (B(9)) btn |= BTN.s;
  }
  if (u && d) { u = false; d = false; }
  if (l && r) { l = false; r = false; }
  return { u, d, l, r, btn };
}

// Menu-level edge detection shared by both players
export class MenuInput {
  constructor() { this.prev = [{}, {}]; this.rep = [{}, {}]; }
  poll() {
    const out = [];
    for (let s = 0; s < 2; s++) {
      const r = readRaw(s);
      const cur = { up: r.u, down: r.d, left: r.l, right: r.r, ok: !!(r.btn & (BTN.a | BTN.x | BTN.s)), back: !!(r.btn & (BTN.b | BTN.y)), start: !!(r.btn & BTN.s), btn: r.btn };
      const p = this.prev[s];
      const ev = {};
      for (const key of ['up', 'down', 'left', 'right']) {
        if (cur[key] && !p[key]) { ev[key] = true; this.rep[s][key] = 14; }
        else if (cur[key]) { if (--this.rep[s][key] <= 0) { ev[key] = true; this.rep[s][key] = 4; } }
      }
      for (const key of ['ok', 'back', 'start']) if (cur[key] && !p[key]) ev[key] = true;
      ev.btnPressed = cur.btn & ~(p.btn || 0);
      this.prev[s] = cur;
      out.push(ev);
    }
    // keyboard-only extras
    const k = keyboard.down;
    const escNow = k.has('Escape') || keyboard.latched.has('Escape');
    out.esc = escNow && !this._esc; this._esc = escNow;
    return out;
  }
}

// ---------- Command parsing / matching ----------

const DIRSYM = { B: DIR.B, DB: DIR.D | DIR.B, D: DIR.D, DF: DIR.D | DIR.F, F: DIR.F, UF: DIR.U | DIR.F, U: DIR.U, UB: DIR.U | DIR.B };

function parseElem(tok) {
  let s = tok.trim();
  const e = { release: false, charge: 0, hold: false, four: false, strict: false, dir: 0, btn: 0, isDir: false };
  for (;;) {
    if (s[0] === '>') { e.strict = true; s = s.slice(1).trim(); continue; }
    if (s[0] === '~') {
      e.release = true; s = s.slice(1);
      const m = s.match(/^\d+/); if (m) { e.charge = +m[0]; s = s.slice(m[0].length); }
      s = s.trim(); continue;
    }
    if (s[0] === '/') { e.hold = true; s = s.slice(1).trim(); continue; }
    if (s[0] === '$') { e.four = true; s = s.slice(1).trim(); continue; }
    break;
  }
  for (const part of s.split('+').map(t => t.trim()).filter(Boolean)) {
    if (DIRSYM[part] !== undefined) { e.isDir = true; e.dir = DIRSYM[part]; }
    else if (BTN[part] !== undefined && part.length === 1) e.btn |= BTN[part];
  }
  return e;
}

export function compileCommand(cmd) {
  let els = cmd.command.split(',').map(parseElem).filter(e => e.dir || e.btn);
  // successive identical directions: "F, F" -> F, >~F, >F
  const out = [];
  for (let i = 0; i < els.length; i++) {
    const e = els[i];
    const p = out[out.length - 1];
    if (p && e.isDir && !e.btn && p.isDir && !p.btn && !e.hold && !p.hold && !e.release && !p.release && p.dir === e.dir) {
      out.push({ ...e, release: true, strict: true });
      out.push({ ...e, strict: true });
    } else out.push(e);
  }
  // Lenient buffering for anything that ends in a button press (easier links and cancels).
  const last = out[out.length - 1];
  const lenient = last && last.btn && !last.hold && !last.release;
  return { name: cmd.name, els: out, time: cmd.time, bufferTime: lenient ? Math.max(cmd.buffertime, 4) : cmd.buffertime };
}

const dirMatch = (bits, e) => (e.four ? (bits & e.dir) === e.dir || ((bits & e.dir) && (e.dir & (e.dir - 1)) === 0) : bits === e.dir);

export class CommandBuffer {
  constructor(commands) {
    this.cmds = commands.map(compileCommand).filter(c => c.els.length);
    this.hist = []; // [{dir, btn}] newest last
    this.active = new Map(); // name -> ticks remaining
    this.forced = new Map();
    this.max = 120;
  }
  push(dirBits, btn) {
    this.hist.push({ dir: dirBits, btn });
    if (this.hist.length > this.max) this.hist.shift();
  }
  at(t) { return this.hist[t] || { dir: 0, btn: 0 }; }
  // event e happened at index t?
  ev(e, t) {
    const cur = this.at(t), prev = this.at(t - 1);
    if (e.isDir && !e.btn) {
      const m = dirMatch(cur.dir, e), pm = dirMatch(prev.dir, e);
      if (e.hold) return m;
      if (e.release) {
        if (!(pm && !m)) return false;
        if (e.charge) { let n = 0; for (let k = t - 1; k >= 0 && dirMatch(this.at(k).dir, e); k--) n++; return n >= e.charge; }
        return true;
      }
      return m && !pm;
    }
    const b = e.btn;
    const held = (cur.btn & b) === b;
    if (e.hold) return held && (!e.isDir || dirMatch(cur.dir, e));
    if (e.release) {
      const ph = (prev.btn & b) === b;
      if (!(ph && !held)) return false;
      if (e.charge) { let n = 0; for (let k = t - 1; k >= 0 && (this.at(k).btn & b) === b; k--) n++; return n >= e.charge; }
      return true;
    }
    if (!held) return false;
    // at least one of the buttons newly pressed now, the rest pressed within 2 ticks
    const newly = b & ~prev.btn;
    if (!newly) return false;
    for (let bit = 1; bit <= b; bit <<= 1) {
      if (!(b & bit)) continue;
      let ok = false;
      for (let k = 0; k <= 2; k++) { const h = this.at(t - k), hp = this.at(t - k - 1); if ((h.btn & bit) && !(hp.btn & bit)) { ok = true; break; } }
      if (!ok) return false;
    }
    if (e.isDir && !dirMatch(cur.dir, e)) return false;
    return true;
  }
  anyEventBetween(t0, t1) {
    for (let t = t0 + 1; t < t1; t++) {
      const a = this.at(t), p = this.at(t - 1);
      if (a.dir !== p.dir || a.btn !== p.btn) return true;
    }
    return false;
  }
  match(c) {
    const now = this.hist.length - 1;
    const els = c.els;
    const n = els.length;
    if (!this.ev(els[n - 1], now)) return false;
    let tNext = now;
    for (let i = n - 2; i >= 0; i--) {
      const e = els[i], en = els[i + 1];
      let found = -1;
      if (e.hold) { if (this.ev(e, tNext)) found = tNext; }
      else {
        const sameKind = (!!e.btn) === (!!en.btn);
        const start = sameKind ? tNext - 1 : tNext;
        for (let t = start; t >= Math.max(0, now - c.time); t--) {
          if (this.ev(e, t)) { found = t; break; }
        }
      }
      if (found < 0) return false;
      if (en.strict && this.anyEventBetween(found, tNext)) return false;
      tNext = found;
    }
    return now - tNext <= c.time;
  }
  // called once per tick after push(); paused = hitpause (buffers frozen)
  update(paused) {
    // Commands entered during hitpause survive into the first free tick (so chains feel responsive).
    const resume = this._wasPaused && !paused;
    this._wasPaused = paused;
    if (!paused && !resume) {
      for (const [k, v] of this.active) { if (v <= 1) this.active.delete(k); else this.active.set(k, v - 1); }
      for (const [k, v] of this.forced) { if (v <= 1) this.forced.delete(k); else this.forced.set(k, v - 1); }
    }
    for (const c of this.cmds) {
      if (this.match(c)) {
        const cur = this.active.get(c.name) || 0;
        if (c.bufferTime > cur) this.active.set(c.name, c.bufferTime);
      }
    }
  }
  force(name, ticks = 4) { this.forced.set(name, ticks); }
  isActive(name) { return this.active.has(name) || this.forced.has(name); }
  clear() { this.active.clear(); this.forced.clear(); }
  reset() {
    this.clear();
    this.hist.length = 0;
    this._wasPaused = false;
  }
}
