// FIGHTWIRE — MUGEN trigger expression compiler.
// Expressions compile once into closures: node = { f(c) -> value, t: 'i'|'f'|'s' }.

const OPS = [':=', '**', '!=', '>=', '<=', '&&', '||', '^^', '=', '<', '>', '+', '-', '*', '/', '%', '!', '~', '&', '|', '^', '(', ')', '[', ']', ','];

export function tokenize(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { i++; continue; }
    if (ch === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"') j++;
      toks.push({ k: 's', v: src.slice(i + 1, j) });
      i = j + 1; continue;
    }
    if ((ch >= '0' && ch <= '9') || (ch === '.' && src[i + 1] >= '0' && src[i + 1] <= '9')) {
      let j = i; let fl = false;
      while (j < n && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) { if (src[j] === '.') fl = true; j++; }
      toks.push({ k: 'n', v: parseFloat(src.slice(i, j)), fl });
      i = j; continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_.$]/.test(src[j])) j++;
      // trailing dots belong to nothing
      let word = src.slice(i, j);
      toks.push({ k: 'id', v: word, l: word.toLowerCase() });
      i = j; continue;
    }
    let op = null;
    for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
    if (!op) { i++; continue; }
    toks.push({ k: 'op', v: op });
    i += op.length;
  }
  return toks;
}

const SPECIAL_T = new Set(['hitdefattr', 'animelem', 'timemod', 'command']);
const REDIRECTS = new Set(['parent', 'root', 'helper', 'target', 'partner', 'enemy', 'enemynear', 'playerid', 'p2']);
const COMPONENT = new Set(['pos', 'vel', 'p2dist', 'p2bodydist', 'parentdist', 'rootdist', 'screenpos', 'hitvel', 'camerapos', 'p1dist', 'acc', 'offset']);

const num = (v) => (typeof v === 'number' ? v : (v ? 1 : 0));
const I = (f) => ({ f, t: 'i' });
const F = (f) => ({ f, t: 'f' });
const S = (f) => ({ f, t: 's' });
const lit = (v, t) => ({ f: () => v, t, lit: v });

let warned = new Set();
function warn(msg) { if (!warned.has(msg)) { warned.add(msg); console.warn('[fightwire]', msg); } }

// Trigger table: name -> [type, fn(c)]  (lowercase names, no args)
export const TRIG = {};
// Trigger with argument: name -> [type, fn(c, argValue)]
export const TRIGA = {};

class Parser {
  constructor(toks, src) { this.t = toks; this.p = 0; this.src = src; this.depth = 0; }
  peek(o = 0) { return this.t[this.p + o]; }
  next() { return this.t[this.p++]; }
  isOp(v, o = 0) { const t = this.t[this.p + o]; return t && t.k === 'op' && t.v === v; }
  eat(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
  expect(v) { if (!this.eat(v)) throw new Error(`expected '${v}' in: ${this.src}`); }

  parse() {
    const e = this.or();
    return e;
  }
  bin(sub, ops, mk) {
    let l = sub();
    for (;;) {
      const t = this.peek();
      if (!t || t.k !== 'op' || !ops.includes(t.v)) return l;
      this.p++;
      const r = sub();
      l = mk(t.v, l, r);
    }
  }
  or() { return this.bin(() => this.xor(), ['||'], (o, a, b) => I(c => (num(a.f(c)) || num(b.f(c))) ? 1 : 0)); }
  xor() { return this.bin(() => this.and(), ['^^'], (o, a, b) => I(c => (!!num(a.f(c)) !== !!num(b.f(c))) ? 1 : 0)); }
  and() { return this.bin(() => this.bor(), ['&&'], (o, a, b) => I(c => (num(a.f(c)) && num(b.f(c))) ? 1 : 0)); }
  bor() { return this.bin(() => this.bxor(), ['|'], (o, a, b) => I(c => (num(a.f(c)) | num(b.f(c))))); }
  bxor() { return this.bin(() => this.band(), ['^'], (o, a, b) => I(c => (num(a.f(c)) ^ num(b.f(c))))); }
  band() { return this.bin(() => this.assign(), ['&'], (o, a, b) => I(c => (num(a.f(c)) & num(b.f(c))))); }
  assign() {
    const l = this.eq();
    if (this.isOp(':=')) {
      this.p++;
      const r = this.assign();
      if (!l.ref) { warn('bad assignment in ' + this.src); return r; }
      const ref = l.ref;
      return { f: c => ref.set(c, r.f(c)), t: ref.kind === 'var' || ref.kind === 'sysvar' ? 'i' : 'f' };
    }
    return l;
  }
  eq() {
    let l = this.rel();
    for (;;) {
      const t = this.peek();
      if (!t || t.k !== 'op' || (t.v !== '=' && t.v !== '!=')) return l;
      this.p++;
      const neg = t.v === '!=';
      l = this.eqRight(l, neg);
    }
  }
  eqRight(l, neg) {
    // hitdefattr = SCA, NA, SA
    if (l.special === 'hitdefattr') {
      const st = this.next();
      const flags = [];
      while (this.isOp(',') && this.peek(1) && this.peek(1).k === 'id' && /^[nsha][atp]$/i.test(this.peek(1).v)) {
        this.p++; flags.push(this.next().v.toUpperCase());
      }
      const stv = (st && st.v ? String(st.v) : '').toUpperCase();
      const g = l.getter;
      return I(c => { const r = g(c, stv, flags); return (neg ? !r : r) ? 1 : 0; });
    }
    // interval
    if (this.isOp('[') || this.isOp('(')) {
      const save = this.p;
      const openB = this.next().v;
      this.depth++;
      const a = this.or();
      if (this.isOp(',')) {
        this.p++;
        const b = this.or();
        const close = this.next();
        this.depth--;
        const lo = openB === '[', hi = close && close.v === ']';
        const lf = l.f;
        return I(c => {
          const v = num(lf(c)), x = num(a.f(c)), y = num(b.f(c));
          const inside = (lo ? v >= x : v > x) && (hi ? v <= y : v < y);
          return (neg ? !inside : inside) ? 1 : 0;
        });
      }
      this.depth--;
      this.p = save;
    }
    let r = this.rel();
    if (l.special === 'command') {
      const name = r.lit != null ? String(r.lit) : '';
      return I(c => { const v = c.cmdActive(name); return (neg ? !v : v) ? 1 : 0; });
    }
    if (l.t === 's' || r.t === 's') {
      const lf = l.f, rf = r.f;
      return I(c => {
        const a = lf(c), b = rf(c);
        const eqv = String(a).toLowerCase() === String(b).toLowerCase();
        return (neg ? !eqv : eqv) ? 1 : 0;
      });
    }
    // animelem = n, >= m  /  timemod = m, r  /  projhit = 1, < t
    if ((l.special === 'animelem' || l.special === 'timemod' || l.special === 'proj') && this.isOp(',')) {
      const t2 = this.peek(1);
      const isCmp = t2 && t2.k === 'op' && ['=', '!=', '<', '>', '<=', '>='].includes(t2.v);
      const bareNum = this.depth === 0 && t2 && (t2.k === 'n' || (t2.k === 'op' && t2.v === '-'));
      if (isCmp || bareNum) {
        this.p++;
        let op = '=';
        if (isCmp) op = this.next().v;
        const m = this.rel();
        const cmp = mkCmp(op);
        if (l.special === 'animelem') {
          const nf = r.f;
          return I(c => {
            const n = num(nf(c));
            const et = c.anim.elemTimeOf(n);
            if (!c.anim.anim || n < 1 || n > c.anim.anim.frames.length) return 0;
            const ok = cmp(et, num(m.f(c)));
            return (neg ? !ok : ok) ? 1 : 0;
          });
        }
        if (l.special === 'timemod') {
          const nf = r.f;
          return I(c => { const d = num(nf(c)); const ok = d ? (c.time % d) === num(m.f(c)) : false; return (neg ? !ok : ok) ? 1 : 0; });
        }
        if (l.special === 'proj') {
          const g = l.getter, nf = r.f;
          return I(c => { const want = num(nf(c)); const tt = g(c); const has = tt >= 0; const ok = want ? (has && cmp(tt, num(m.f(c)))) : !has; return (neg ? !ok : ok) ? 1 : 0; });
        }
      }
    }
    if (l.special === 'animelem') {
      const nf = r.f;
      return I(c => { const v = c.anim.elemStarted(num(nf(c))); return (neg ? !v : v) ? 1 : 0; });
    }
    if (l.special === 'proj') {
      const g = l.getter, nf = r.f;
      return I(c => { const want = num(nf(c)); const has = g(c) >= 0; const ok = want ? has : !has; return (neg ? !ok : ok) ? 1 : 0; });
    }
    if (l.special === 'timemod') {
      const nf = r.f;
      return I(c => { const ok = c.time % Math.max(1, num(nf(c))) === 0; return (neg ? !ok : ok) ? 1 : 0; });
    }
    const lf = l.f, rf = r.f;
    return neg ? I(c => (num(lf(c)) !== num(rf(c)) ? 1 : 0)) : I(c => (num(lf(c)) === num(rf(c)) ? 1 : 0));
  }
  rel() {
    return this.bin(() => this.add(), ['<', '<=', '>', '>='], (o, a, b) => {
      const cmp = mkCmp(o);
      return I(c => (cmp(num(a.f(c)), num(b.f(c))) ? 1 : 0));
    });
  }
  add() {
    return this.bin(() => this.mul(), ['+', '-'], (o, a, b) => {
      const t = a.t === 'f' || b.t === 'f' ? 'f' : 'i';
      return o === '+' ? { f: c => num(a.f(c)) + num(b.f(c)), t } : { f: c => num(a.f(c)) - num(b.f(c)), t };
    });
  }
  mul() {
    return this.bin(() => this.pow(), ['*', '/', '%'], (o, a, b) => {
      const t = a.t === 'f' || b.t === 'f' ? 'f' : 'i';
      if (o === '*') return { f: c => num(a.f(c)) * num(b.f(c)), t };
      if (o === '%') return I(c => { const y = Math.trunc(num(b.f(c))); return y ? Math.trunc(num(a.f(c))) % y : 0; });
      if (t === 'i') return I(c => { const y = num(b.f(c)); return y ? Math.trunc(num(a.f(c)) / y) : 0; });
      return F(c => { const y = num(b.f(c)); return y ? num(a.f(c)) / y : 0; });
    });
  }
  pow() {
    return this.bin(() => this.unary(), ['**'], (o, a, b) => {
      const t = a.t === 'f' || b.t === 'f' ? 'f' : 'i';
      return { f: c => { const r = Math.pow(num(a.f(c)), num(b.f(c))); return t === 'i' ? Math.trunc(r) : r; }, t };
    });
  }
  unary() {
    if (this.eat('!')) { const e = this.unary(); return I(c => (num(e.f(c)) ? 0 : 1)); }
    if (this.eat('~')) { const e = this.unary(); return I(c => ~num(e.f(c))); }
    if (this.eat('-')) { const e = this.unary(); if (e.lit != null && typeof e.lit === 'number') return lit(-e.lit, e.t); return { f: c => -num(e.f(c)), t: e.t }; }
    if (this.eat('+')) return this.unary();
    return this.primary();
  }
  rawArg() {
    // returns raw text inside parentheses
    this.expect('(');
    let depth = 1; const parts = [];
    while (this.p < this.t.length) {
      const t = this.next();
      if (t.k === 'op' && t.v === '(') depth++;
      if (t.k === 'op' && t.v === ')') { depth--; if (!depth) break; }
      parts.push(t.k === 'id' ? t.v : String(t.v));
    }
    return parts.join('').toLowerCase();
  }
  args() {
    this.expect('(');
    this.depth++;
    const out = [];
    if (!this.isOp(')')) {
      out.push(this.or());
      while (this.eat(',')) out.push(this.or());
    }
    this.expect(')');
    this.depth--;
    return out;
  }
  component() {
    const t = this.peek();
    if (t && t.k === 'id' && (t.l === 'x' || t.l === 'y' || t.l === 'z')) { this.p++; return t.l; }
    return 'x';
  }
  primary() {
    const t = this.next();
    if (!t) throw new Error('unexpected end: ' + this.src);
    if (t.k === 'n') return lit(t.v, t.fl ? 'f' : 'i');
    if (t.k === 's') return lit(t.v, 's');
    if (t.k === 'op' && t.v === '(') {
      this.depth++;
      const e = this.or();
      this.expect(')');
      this.depth--;
      return e;
    }
    if (t.k !== 'id') throw new Error(`unexpected '${t.v}' in: ${this.src}`);
    const name = t.l;

    // redirection
    if (REDIRECTS.has(name)) {
      let argE = null;
      const save = this.p;
      if (this.isOp('(')) { argE = this.args(); }
      if (this.isOp(',')) {
        this.p++;
        const nt = this.peek();
        const isSpecial = nt && nt.k === 'id' && (SPECIAL_T.has(nt.l) || /^proj(hit|contact|guarded)\d*$/.test(nt.l));
        const inner = isSpecial ? this.eq() : this.unaryRedirectTarget();
        const a0 = argE && argE[0];
        const rf = redirectFn(name);
        return {
          f: c => { const r = rf(c, a0 ? num(a0.f(c)) : undefined); return r ? inner.f(r) : 0; },
          t: inner.t, special: inner.special === 'command' ? undefined : inner.special,
        };
      }
      this.p = save;
    }

    switch (name) {
      case 'var': case 'fvar': case 'sysvar': case 'sysfvar': {
        const [ie] = this.args();
        const kind = name;
        const arr = kind === 'var' ? 'vars' : kind === 'fvar' ? 'fvars' : kind === 'sysvar' ? 'sysvars' : 'sysfvars';
        const isInt = kind === 'var' || kind === 'sysvar';
        const ref = {
          kind,
          set: (c, v) => { const i = num(ie.f(c)) | 0; const a = c[arr]; if (i < 0 || i >= a.length) return 0; v = num(v); a[i] = isInt ? Math.trunc(v) : v; return a[i]; },
        };
        const g = ie.lit != null ? (() => { const i = ie.lit | 0; return c => { const a = c[arr]; return i >= 0 && i < a.length ? a[i] : 0; }; })()
          : c => { const i = num(ie.f(c)) | 0; const a = c[arr]; return i >= 0 && i < a.length ? a[i] : 0; };
        return { f: g, t: isInt ? 'i' : 'f', ref };
      }
      case 'const': {
        const key = this.rawArg();
        return { f: c => c.constant(key), t: /^data\.|\.(height|attack\.dist)$/.test(key) && !/^data\.(attack|defence)/.test(key) ? 'i' : 'f' };
      }
      case 'gethitvar': {
        const key = this.rawArg();
        const ft = ['xvel', 'yvel', 'yaccel', 'fall.xvel', 'fall.yvel', 'xvelmul', 'yvelmul', 'xoff', 'yoff', 'zoff', 'zvel', 'xaccel', 'fall.zvel'];
        return { f: c => c.getHitVar(key), t: ft.includes(key) ? 'f' : 'i' };
      }
      case 'stagevar': { const key = this.rawArg(); return { f: c => c.fight.stageVar(key), t: 's' }; }
      case 'ifelse': case 'cond': {
        const [a, b, d] = this.args();
        const t2 = b.t === 'f' || d.t === 'f' ? 'f' : (b.t === 's' ? 's' : 'i');
        if (name === 'ifelse') return { f: c => { const x = num(a.f(c)); const y = b.f(c), z = d.f(c); return x ? y : z; }, t: t2 };
        return { f: c => (num(a.f(c)) ? b.f(c) : d.f(c)), t: t2 };
      }
      // MUGEN 1.1: convert a value authored at 240p/480p/720p into this character's local coords
      case 'const240p': case 'const480p': case 'const720p': {
        const [a] = this.args(); const base = +name.slice(5, -1);
        return F(c => num(a.f(c)) * ((c.root?.def?.localcoord?.[1] || 240) / base));
      }
      case 'abs': { const [a] = this.args(); return { f: c => Math.abs(num(a.f(c))), t: a.t }; }
      case 'floor': { const [a] = this.args(); return I(c => Math.floor(num(a.f(c)))); }
      case 'ceil': { const [a] = this.args(); return I(c => Math.ceil(num(a.f(c)))); }
      case 'exp': { const [a] = this.args(); return F(c => Math.exp(num(a.f(c)))); }
      case 'ln': { const [a] = this.args(); return F(c => { const v = num(a.f(c)); return v > 0 ? Math.log(v) : 0; }); }
      case 'log': { const [a, b] = this.args(); return F(c => { const x = num(a.f(c)), y = num(b.f(c)); return x > 0 && y > 0 && x !== 1 ? Math.log(y) / Math.log(x) : 0; }); }
      case 'sin': case 'cos': case 'tan': case 'asin': case 'acos': case 'atan': {
        const [a] = this.args(); const fn = Math[name]; return F(c => { const r = fn(num(a.f(c))); return isFinite(r) ? r : 0; });
      }
      case 'pi': return lit(Math.PI, 'f');
      case 'e': return lit(Math.E, 'f');
      case 'random': return I(() => Math.floor(Math.random() * 1000));
      case 'command': return { f: () => 0, t: 'i', special: 'command' };
      case 'hitdefattr': return { f: () => 0, t: 'i', special: 'hitdefattr', getter: (c, st, fl) => c.hitDefAttrMatch(st, fl) };
      case 'animelem': return { f: c => c.anim.elemNo(), t: 'i', special: 'animelem' };
      case 'timemod': return { f: c => c.time, t: 'i', special: 'timemod' };
      case 'animelemtime': { const [a] = this.args(); return I(c => c.anim.elemTimeOf(num(a.f(c)))); }
      case 'animelemno': { const [a] = this.args(); return I(c => c.anim.elemNoAt(num(a.f(c)))); }
      case 'selfanimexist': { const [a] = this.args(); return I(c => (c.selfAnimExist(num(a.f(c))) ? 1 : 0)); }
      case 'animexist': { const [a] = this.args(); return I(c => (c.animExist(num(a.f(c))) ? 1 : 0)); }
      case 'ishelper': {
        if (this.isOp('(')) { const [a] = this.args(); return I(c => (c.isHelper && c.helperId === num(a.f(c)) ? 1 : 0)); }
        return I(c => (c.isHelper ? 1 : 0));
      }
      case 'numhelper': case 'numexplod': case 'numtarget': case 'numprojid': case 'numproj': case 'playeridexist': case 'numenemy': case 'numpartner': {
        let a = null;
        if (this.isOp('(')) [a] = this.args();
        const fn = TRIGA[name];
        return I(c => fn(c, a ? num(a.f(c)) : undefined));
      }
      case 'projhittime': case 'projcontacttime': case 'projguardedtime': {
        const [a] = this.args();
        const kind = name.replace('time', '');
        return I(c => c.projTime(kind, num(a.f(c))));
      }
      case 'teammode': return S(c => 'single');
    }
    let pm;
    if ((pm = name.match(/^proj(hit|contact|guarded)(\d*)$/))) {
      const kind = 'proj' + pm[1];
      const id = pm[2] ? +pm[2] : 0;
      return { f: c => (c.projTime(kind, id) >= 0 ? 1 : 0), t: 'i', special: 'proj', getter: c => c.projTime(kind, id) };
    }
    if (COMPONENT.has(name)) {
      const comp = this.component();
      const fn = TRIGA[name];
      if (fn) return F(c => fn(c, comp));
      warn('component trigger ' + name);
      return lit(0, 'i');
    }
    if (TRIG[name]) {
      const [t2, fn] = TRIG[name];
      // tolerate an optional "(...)" after zero-arg triggers like numtarget()
      return { f: fn, t: t2 };
    }
    if (TRIGA[name] && this.isOp('(')) {
      const as = this.args();
      const fn = TRIGA[name];
      return I(c => fn(c, ...as.map(a => num(a.f(c)))));
    }
    // bare word -> string literal (statetype = S, movetype = A, ...)
    return lit(t.v, 's');
  }
  unaryRedirectTarget() {
    // the redirected term: a single primary (with possible unary prefix)
    return this.unary();
  }
}

function mkCmp(o) {
  switch (o) {
    case '<': return (a, b) => a < b;
    case '<=': return (a, b) => a <= b;
    case '>': return (a, b) => a > b;
    case '>=': return (a, b) => a >= b;
    case '!=': return (a, b) => a !== b;
    default: return (a, b) => a === b;
  }
}

function redirectFn(name) {
  switch (name) {
    case 'parent': return c => c.parent;
    case 'root': return c => c.root;
    case 'helper': return (c, id) => c.findHelper(id);
    case 'target': return (c, id) => c.findTarget(id);
    case 'partner': return c => c.partner();
    case 'enemy': return (c, n) => c.enemy(n || 0);
    case 'enemynear': case 'p2': return (c, n) => c.enemyNear(n || 0);
    case 'playerid': return (c, id) => c.fight.playerById(id);
  }
  return () => null;
}

const cache = new Map();
export function compile(src) {
  src = String(src ?? '').trim();
  if (cache.has(src)) return cache.get(src);
  let node;
  try {
    const toks = tokenize(src);
    if (!toks.length) node = lit(0, 'i');
    else {
      const p = new Parser(toks, src);
      node = p.parse();
      if (p.p < toks.length) {
        // trailing garbage: tolerate but warn
        warn(`trailing tokens in expression: ${src}`);
      }
    }
  } catch (e) {
    warn(e.message);
    node = lit(0, 'i');
    node.error = e.message;
  }
  cache.set(src, node);
  return node;
}

// Split a parameter value on top-level commas, keeping redirection commas intact.
export function splitTop(src) {
  const out = [];
  let depth = 0, inQ = false, start = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') inQ = !inQ;
    if (inQ) continue;
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      const before = src.slice(start, i).trim().toLowerCase();
      if (/(^|[^a-z0-9_.])(parent|root|partner|helper(\s*\([^)]*\))?|target(\s*\([^)]*\))?|enemy(near)?(\s*\([^)]*\))?|playerid\s*\([^)]*\))\s*$/.test(before)) continue;
      out.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(src.slice(start).trim());
  return out;
}

export function evalNum(node, c) { return num(node.f(c)); }
