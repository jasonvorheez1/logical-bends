// FIGHTWIRE — character runtime: state machine, state controllers, helpers, explods, projectiles.
import { AnimPlayer } from './air.js';
import { compile, splitTop, TRIG, TRIGA } from './expr.js';
import { audio } from './audio.js';
import { CommandBuffer, DIR, BTN } from './input.js';

const num = v => (typeof v === 'number' ? v : (v ? 1 : 0));
let nextPlayerId = 56;

// ---------------- parameter helpers ----------------
function parts(ctrl, key) {
  let p = ctrl.pr?.[key];
  if (p === undefined) {
    ctrl.pr ||= {};
    const raw = ctrl.params[key];
    p = raw == null ? null : splitTop(raw);
    ctrl.pr[key] = p;
  }
  return p;
}
function nodes(ctrl, key) {
  let n = ctrl.pc[key];
  if (n === undefined) {
    const p = parts(ctrl, key);
    n = p ? p.map(s => (s === '' ? null : compile(s))) : null;
    ctrl.pc[key] = n;
  }
  return n;
}
function has(ctrl, key) { return ctrl.params[key] != null; }
function pn(ctrl, key, c, i = 0, def = 0) {
  const n = nodes(ctrl, key);
  if (!n || !n[i]) return def;
  const v = n[i].f(c);
  return typeof v === 'number' ? (isFinite(v) ? v : def) : num(v);
}
function pstr(ctrl, key, def = '') {
  const v = ctrl.params[key];
  return v == null ? def : v.trim().replace(/^"|"$/g, '').toLowerCase();
}
// "S5, 0" / "F7,0" / "123" -> { pre, a, b }
function pPrefixed(ctrl, key, c) {
  const raw = ctrl.params[key];
  if (raw == null) return null;
  let cacheKey = '__pf_' + key;
  let ent = ctrl.pc[cacheKey];
  if (!ent) {
    const ps = splitTop(raw);
    let pre = '';
    let first = ps[0] || '';
    const m = first.match(/^\s*([fFsS])(?=\s|\d|\(|-)/);
    if (m) { pre = m[1].toLowerCase(); first = first.slice(m[0].length); }
    ent = { pre, nodes: [compile(first), ...ps.slice(1).map(s => (s === '' ? null : compile(s)))] };
    ctrl.pc[cacheKey] = ent;
  }
  return { pre: ent.pre, a: num(ent.nodes[0].f(c)), b: ent.nodes[1] ? num(ent.nodes[1].f(c)) : 0, has2: !!ent.nodes[1] };
}

// attribute string "S, NA" -> { st: 'S', types: ['NA'] }
function parseAttr(s) {
  s = (s || '').toUpperCase().split(',').map(t => t.trim());
  return { st: s[0] || '', types: s.slice(1).filter(Boolean) };
}
function attrMatches(slotAttr, hitAttr) {
  // slotAttr: "SCA, NA, SA" style from NotHitBy/HitBy
  const sl = parseAttr(slotAttr);
  const st = hitAttr.st;
  if (!st.split('').some(ch => sl.st.includes(ch))) return false;
  if (!sl.types.length) return true;
  const ht = hitAttr.types[0] || 'NA';
  return sl.types.some(t => {
    const [a, b] = [t[0], t[1]];
    return (a === 'A' || a === ht[0]) && (b === 'A' || b === ht[1]);
  });
}

const HIT_TYPES = { high: 1, low: 2, trip: 3, none: 0 };
const ANIMTYPES = { light: 0, medium: 1, med: 1, hard: 2, heavy: 2, back: 3, up: 4, diagup: 5 };

export class Char {
  constructor(fight, def, opts = {}) {
    this.fight = fight;
    this.def = def;
    this.playerId = nextPlayerId++;
    this.isHelper = !!opts.parent;
    this.parent = opts.parent || null;
    this.root = opts.parent ? opts.parent.root : this;
    this.helperId = opts.helperId || 0;
    this.helperName = opts.name || '';
    this.teamSide = opts.teamSide ?? (opts.parent ? opts.parent.teamSide : 1);
    this.slot = opts.slot ?? 0;
    this.palIndex = opts.palIndex ?? 0;
    this.pal = opts.pal || (def.palettes[this.palIndex] || def.palettes[0])?.pal;
    this.palKey = (def.folder || 'fx') + ':' + this.palIndex;
    this.ai = opts.ai || 0;
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.facing = 1;
    this.stateNo = 0; this.prevStateNo = 0; this.time = 0;
    this.stateOwner = this; // whose statedefs we run (custom states)
    this.statetype = 'S'; this.movetype = 'I'; this.physics = 'S';
    this.ctrl = 1;
    this.anim = new AnimPlayer(null);
    this.animOwner = def;
    this.animNo = -1;
    this.lifeMax = def.consts['data.life'] || 1000;
    this.life = this.lifeMax;
    this.powerMax = def.consts['data.power'] || 3000;
    this.power = 0;
    this.vars = new Int32Array(60); this.fvars = new Float64Array(40);
    this.sysvars = new Int32Array(5); this.sysfvars = new Float64Array(5);
    this.hitdef = null;
    this.moveContact = 0; this.moveHit = 0; this.moveGuarded = 0; this.moveReversed = 0;
    this.hitCount = 0; this.uniqHitCount = 0;
    this.targets = [];
    this.ghv = this.blankGHV();
    this.pauseTime = 0; // hitpause / hitshake
    this.notHitBy = [null, null]; this.hitBy = [null, null];
    this.hitOverride = [];
    this.attackMul = 1; this.defenceMul = 1;
    this.helpers = []; // only on root: all descendants
    this.children = [];
    this.persist = new Map();
    this.sprPriority = 0;
    this.angle = 0; this.angleScale = [1, 1];
    this.drawOffset = { x: 0, y: 0 };
    this.palfx = null; this.afterimage = null; this.afterHist = [];
    this.destroyed = false;
    this.juggle = 0;
    this.bindTo = null;
    this.ownpal = true;
    this.combo = { hits: 0, dmg: 0 };
    this.keyctrl = !this.isHelper;
    this.resetTick();
    if (!this.isHelper) {
      this.cmd = new CommandBuffer(def.commands);
    }
    this.gotHitThisTick = false;
    this.lastHitBy = null;
  }

  blankGHV() {
    return {
      damage: 0, hitcount: 0, fallcount: 0, hitshaketime: 0, hittime: 0, slidetime: 0, ctrltime: 0,
      recovertime: 0, xoff: 0, yoff: 0, xvel: 0, yvel: 0, yaccel: 0.35, type: 0, animtype: 0, airtype: 0, groundtype: 0,
      chainid: -1, guarded: 0, isbound: 0, fall: 0, 'fall.damage': 0, 'fall.xvel': NaN, 'fall.yvel': -4.5, 'fall.recover': 1,
      'fall.time': 0, 'fall.recovertime': 4, 'fall.kill': 1, 'fall.envshake.time': 0, 'fall.envshake.freq': 60, 'fall.envshake.ampl': -4,
      'fall.envshake.phase': 0, id: 0, playerno: 0, 'down.recover': 1, 'down.recovertime': 0, attr: null, kill: 1, hitid: 0,
      fallanimtype: 3, airanimtype: 0, groundanimtype: 0, guardcount: 0, xveladd: 0, yveladd: 0,
    };
  }

  resetTick() {
    this.assert = new Set();
    this.widthOverride = null;
    this.screenbound = true; this.moveCamX = true; this.moveCamY = true;
    this.pushable = true;
    this.posFrozen = false;
    this.transOverride = null;
    this.angleDrawThisTick = false;
  }

  // ---------- basic queries used by triggers ----------
  get alive() { return this.life > 0; }
  constant(key) {
    const v = this.root.def.consts[key];
    if (v !== undefined) return v;
    if (key.endsWith('.x') || key.endsWith('.y')) return 0;
    return 0;
  }
  getHitVar(key) {
    const g = this.ghv;
    switch (key) {
      case 'fall.xvel': return isNaN(g['fall.xvel']) ? this.vel.x : g['fall.xvel'];
      case 'hitshaketime': return Math.max(0, this.pauseTime);
      case 'fall': return g.fall ? 1 : 0;
      case 'fall.recover': return g['fall.recover'] ? 1 : 0;
      case 'guarded': return g.guarded ? 1 : 0;
      case 'isbound': return g.isbound ? 1 : 0;
    }
    const v = g[key];
    return typeof v === 'number' ? v : 0;
  }
  cmdActive(name) {
    const r = this.root;
    if (!r.cmd) return false;
    if (r.ai && r.aiCmdAssert && r.aiCmdAssert.has(name)) return true;
    return r.cmd.isActive(name);
  }
  hitDefAttrMatch(st, flags) {
    const hd = this.hitdef;
    if (!hd || this.movetype !== 'A') return false;
    const a = hd.attr;
    if (!a.st.split('').some(ch => st.includes(ch))) return false;
    if (!flags.length) return true;
    const t = a.types[0] || 'NA';
    return flags.some(f => (f[0] === 'A' || f[0] === t[0]) && (f[1] === 'A' || f[1] === t[1]));
  }
  selfAnimExist(n) { return this.root.def.anims.has(n); }
  animExist(n) { return (this.animOwner || this.def).anims.has(n); }
  projTime(kind, id) {
    const r = this.root;
    const rec = r.projRec?.[kind];
    if (!rec) return -1;
    if (id) { const t = rec.get(id); return t == null ? -1 : this.fight.gameTime - t; }
    let best = -1;
    for (const t of rec.values()) { const d = this.fight.gameTime - t; if (best < 0 || d < best) best = d; }
    return best;
  }
  enemies() { return this.fight.roots.filter(p => p.teamSide !== this.teamSide && !p.destroyed); }
  enemyNear(n = 0) {
    const es = this.enemies().filter(e => e.alive || true);
    if (!es.length) return null;
    es.sort((a, b) => Math.abs(a.pos.x - this.pos.x) - Math.abs(b.pos.x - this.pos.x));
    return es[n] || null;
  }
  enemy(n = 0) { return this.enemies()[n] || null; }
  partner() { return this.fight.roots.find(p => p.teamSide === this.teamSide && p !== this.root) || null; }
  findHelper(id) {
    const list = this.root.helpers;
    for (const h of list) if (!h.destroyed && (id === undefined || h.helperId === id)) return h;
    return null;
  }
  findTarget(id) {
    for (const t of this.targets) if (id === undefined || id < 0 || t.id === id) return t.c;
    return null;
  }
  frontWidth() {
    if (this.widthOverride) return this.widthOverride[0];
    return this.root.def.consts[this.statetype === 'A' ? 'size.air.front' : 'size.ground.front'] ?? 16;
  }
  backWidth() {
    if (this.widthOverride) return this.widthOverride[1];
    return this.root.def.consts[this.statetype === 'A' ? 'size.air.back' : 'size.ground.back'] ?? 15;
  }
  p2() { return this.enemyNear(0); }
  distX(o) { return (o.pos.x - this.pos.x) * this.facing; }
  bodyDistX(o) {
    const d = this.distX(o);
    const oppFacesMe = o.facing !== this.facing;
    const ow = oppFacesMe ? o.frontWidth() : o.backWidth();
    if (d >= 0) return d - this.frontWidth() - ow;
    return d + this.backWidth() + ow;
  }

  // ---------- animation ----------
  changeAnim(no, elem = 1, owner = null) {
    const src = owner || this.def;
    let a = src.anims.get(no);
    if (!a && src !== this.def) a = this.def.anims.get(no);
    this.animNo = no;
    this.animOwner = a ? src : this.def;
    this.anim.set(a || null, this.animOwner, Math.max(0, (elem | 0) - 1));
  }

  // ---------- states ----------
  states() { return this.stateOwner.root.def; }
  changeState(no, ctrl, anim, owner) {
    if (owner !== undefined) this.stateOwner = owner;
    const def = this.stateOwner.root.def;
    let sd = def.getState(no);
    if (!sd && this.stateOwner !== this) { this.stateOwner = this; sd = this.def.getState(no); }
    this.prevStateNo = this.stateNo;
    this.stateNo = no;
    this.time = 0;
    this.persist.clear();
    this._stateChanged = true;
    const p = sd ? sd.params : {};
    const pc = sd ? (sd._pc ||= {}) : {};
    const ev = (k) => { const n = pc[k] ||= splitTop(p[k]).map(s => compile(s)); return n; };
    const type = (p.type || 'S').trim().toUpperCase()[0];
    if (type !== 'U') this.statetype = type;
    const mt = (p.movetype || 'I').trim().toUpperCase()[0];
    if (mt !== 'U') this.movetype = mt;
    const ph = (p.physics || 'N').trim().toUpperCase()[0];
    if (ph !== 'U') this.physics = ph;
    if (!num(p.hitdefpersist ? ev('hitdefpersist')[0].f(this) : 0)) this.hitdef = null;
    if (!num(p.movehitpersist ? ev('movehitpersist')[0].f(this) : 0)) { this.moveContact = this.moveHit = this.moveGuarded = this.moveReversed = 0; }
    if (!num(p.hitcountpersist ? ev('hitcountpersist')[0].f(this) : 0)) { this.hitCount = 0; this.uniqHitCount = 0; }
    if (p.velset != null) { const v = ev('velset'); this.vel.x = num(v[0]?.f(this)); if (v[1]) this.vel.y = num(v[1].f(this)); }
    if (ctrl !== undefined && ctrl !== null) this.ctrl = ctrl ? 1 : 0;
    else if (p.ctrl != null) this.ctrl = num(ev('ctrl')[0].f(this)) ? 1 : 0;
    if (p.poweradd != null) this.addPower(num(ev('poweradd')[0].f(this)));
    if (p.juggle != null) this.juggle = num(ev('juggle')[0].f(this));
    if (p.facep2 != null && num(ev('facep2')[0].f(this))) { const e = this.p2(); if (e && this.distX(e) < 0) this.facing = -this.facing; }
    if (p.sprpriority != null) this.sprPriority = num(ev('sprpriority')[0].f(this));
    if (anim !== undefined && anim !== null) this.changeAnim(anim);
    else if (p.anim != null) {
      const a = num(ev('anim')[0].f(this));
      this.changeAnim(a, 1, this.stateOwner !== this ? this.def : null);
    }
    this.combo.cancelled = false;
    // MvC-style super jump after a launcher
    if (no === 50 && this.combo.launched && this.prevStateNo === 40) { this.vel.y *= 1.3; this.combo.launched = false; }
    if (no === 0 || no === 52) this.combo.launched = false;
    if (this.onStateChange) this.onStateChange(no);
  }

  addPower(v) { const r = this.root; r.power = Math.max(0, Math.min(r.powerMax, r.power + v)); }

  // Run a statedef's controllers. Returns true if a ChangeState aborted it.
  runStateDef(sd, special, paused) {
    if (!sd) return false;
    const ctrls = sd.ctrls;
    for (let i = 0; i < ctrls.length; i++) {
      const ct = ctrls[i];
      if (paused && !ct.ignorehitpause) continue;
      // persistent handling
      if (ct.persistent !== 1) {
        const k = this.persist.get(ct) || 0;
        if (ct.persistent === 0 && k > 0) continue;
        if (ct.persistent > 1 && k > 0) {
          // execute every N-th time triggers fire
        }
      }
      if (!this.checkTriggers(ct)) continue;
      if (ct.persistent !== 1) {
        const k = (this.persist.get(ct) || 0) + 1;
        this.persist.set(ct, k);
        if (ct.persistent > 1 && (k - 1) % ct.persistent !== 0) continue;
      }
      const before = this.stateNo, beforeOwner = this.stateOwner, cnt = this._changeCount;
      const res = this.exec(ct, special);
      if (this.destroyed) return true;
      if (res === 'changed' || this._changeCount !== cnt) return true;
    }
    return false;
  }
  checkTriggers(ct) {
    for (const t of ct.tAll) if (!num(t.f(this))) return false;
    if (!ct.tGroups.length) return ct.tAll.length > 0;
    for (const g of ct.tGroups) {
      let ok = true;
      for (const t of g) if (!num(t.f(this))) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }

  // The per-tick state processing (called by Fight)
  actionRun() {
    if (this.destroyed) return;
    this.resetTick();
    const paused = this.pauseTime > 0;
    const ownDef = this.def;
    this._changeCount = 0;
    if (!this.isHelper) {
      // -3: only in own states
      if (this.stateOwner === this) this.runStateDef(ownDef.states.get(-3), true, paused);
      if (this.destroyed) return;
      this.runStateDef(ownDef.states.get(-2), true, paused);
      // FIGHTWIRE combo layer: open a cancel window for chains/specials/supers
      const ctrlBefore = this.ctrl;
      const cw = !paused && this.fight.comboSystem ? this.cancelWindow() : null;
      if (cw) { this.cancelFilter = cw; this.ctrl = 1; }
      const st0 = this.stateNo, cc0 = this._changeCount;
      if (this.keyctrl) this.runStateDef(ownDef.states.get(-1), true, paused);
      // a move just started from input: drop stale buffered presses so they can't re-fire the same move
      if (this._changeCount !== cc0 && this.cmd && this.movetype === 'A') this.cmd.clear();
      if (cw) {
        this.cancelFilter = null;
        if (this._changeCount === cc0) this.ctrl = ctrlBefore;
        else this.combo.cancelled = true;
      }
      if (!paused && this._changeCount === cc0) this.builtinControl();
    }
    // current state; loop while ChangeState fires
    let guard = 0;
    while (guard++ < 30) {
      const sd = this.stateOwner.root.def.getState(this.stateNo);
      const cc = this._changeCount;
      this.runStateDef(sd, false, paused);
      if (this.destroyed) return;
      if (this._changeCount === cc) break;
    }
  }

  // ---------- engine-level movement ("built-in" MUGEN control) ----------
  rawDir() {
    const r = this.root;
    return r.inputDir || 0;
  }
  builtinControl() {
    if (!this.ctrl || this.stateOwner !== this) return;
    const d = this.rawDir();
    const holdU = d & DIR.U, holdD = d & DIR.D, holdF = d & DIR.F, holdB = d & DIR.B;
    const rs = this.fight.roundState;
    if (rs !== 2 && !this.fight.training) return;
    const inGuard = this.stateNo >= 120 && this.stateNo <= 155;
    if (holdB && this.fight.inGuardDistOf(this) && !inGuard && this.statetype !== 'L') {
      this.changeState(120); return;
    }
    if (this.statetype === 'S') {
      if (holdU) { this.changeState(40); return; }
      if (holdD) { this.changeState(10); return; }
      if ((holdF || holdB) && this.stateNo !== 20 && !this.assert.has('nowalk')) { this.changeState(20); return; }
      if (!holdF && !holdB && this.stateNo === 20) { this.changeState(0); return; }
    } else if (this.statetype === 'C') {
      if (!holdD && this.stateNo === 11) { this.changeState(12); return; }
      if (holdU && !holdD) { this.changeState(40); return; }
    } else if (this.statetype === 'A') {
      const aj = this.root.def.consts['movement.airjump.num'] || 0;
      if (holdU && aj > (this.airJumps || 0) && this._upPressed && this.pos.y < -(this.root.def.consts['movement.airjump.height'] || 35)) {
        this.airJumps = (this.airJumps || 0) + 1; this.changeState(45); return;
      }
    }
  }

  // ---------- FIGHTWIRE combo system ----------
  rankOf(stateNo) {
    const prof = this.def.profile?.combo;
    if (!prof) return null;
    for (const [rk, list] of Object.entries(prof.ranks || {})) if (list.includes(stateNo)) return rk;
    if (prof.specialRange && stateNo >= prof.specialRange[0] && stateNo <= prof.specialRange[1]) return 'special';
    if (prof.superRange && stateNo >= prof.superRange[0] && stateNo <= prof.superRange[1]) return 'super';
    if ((prof.jump || [40]).includes(stateNo)) return 'jump';
    return null;
  }
  cancelWindow() {
    if (this.movetype !== 'A' || !this.moveContact || this.stateOwner !== this) return null;
    if (this.fight.roundState !== 2 && !this.fight.training) return null;
    const cur = this.rankOf(this.stateNo);
    if (!cur) return null;
    const ORDER = { light: 1, medium: 2, heavy: 3, launcher: 3, special: 4, super: 5 };
    const r0 = ORDER[cur];
    if (!r0) return null;
    const hit = this.moveHit > 0;
    const prof = this.def.profile.combo;
    const chainCount = this.combo.chain || 0;
    return (next) => {
      if (next === this.stateNo) return cur === 'light' && chainCount < 3 ? true : false;
      const rk = this.rankOf(next);
      if (!rk) return false;
      if (rk === 'jump') return hit && (cur === 'launcher' || (prof.jumpCancel || []).includes(this.stateNo));
      const r1 = ORDER[rk];
      if (rk === 'super') return r0 <= 4;
      if (rk === 'special') return r0 <= 3;
      if (r0 >= 4) return false;
      if (rk === 'light' && cur === 'light') return chainCount < 3;
      return r1 > r0;
    };
  }

  // ---------- controllers ----------
  exec(ct, special) {
    const c = this;
    const t = ct.type;
    switch (t) {
      case 'null': return;
      case 'changestate': case 'selfstate': {
        const v = pn(ct, 'value', c);
        if (this.cancelFilter && !this.cancelFilter(v)) return;
        if (this.cancelFilter) {
          const rk = this.rankOf(v);
          this.combo.chain = rk === 'light' ? (this.combo.chain || 0) + 1 : 0;
        }
        const ctrl = has(ct, 'ctrl') ? pn(ct, 'ctrl', c) : undefined;
        const anim = has(ct, 'anim') ? pn(ct, 'anim', c) : undefined;
        if (t === 'selfstate') this.stateOwner = this;
        this.changeState(v, ctrl, anim);
        this._changeCount++;
        return 'changed';
      }
      case 'changeanim': case 'changeanim2': {
        const v = pn(ct, 'value', c);
        const elem = has(ct, 'elem') ? pn(ct, 'elem', c) : 1;
        this.changeAnim(v, elem, t === 'changeanim2' ? this.stateOwner.root.def : this.def);
        return;
      }
      case 'velset': if (has(ct, 'x')) this.vel.x = pn(ct, 'x', c); if (has(ct, 'y')) this.vel.y = pn(ct, 'y', c); return;
      case 'veladd': if (has(ct, 'x')) this.vel.x += pn(ct, 'x', c); if (has(ct, 'y')) this.vel.y += pn(ct, 'y', c); return;
      case 'velmul': if (has(ct, 'x')) this.vel.x *= pn(ct, 'x', c); if (has(ct, 'y')) this.vel.y *= pn(ct, 'y', c); return;
      case 'posset': if (has(ct, 'x')) this.pos.x = pn(ct, 'x', c) + (this.fight.cameraX || 0) * 0; if (has(ct, 'y')) this.pos.y = pn(ct, 'y', c); return;
      case 'posadd': if (has(ct, 'x')) this.pos.x += pn(ct, 'x', c) * this.facing; if (has(ct, 'y')) this.pos.y += pn(ct, 'y', c); return;
      case 'gravity': this.vel.y += this.constant('movement.yaccel'); return;
      case 'ctrlset': this.ctrl = pn(ct, 'value', c) ? 1 : 0; return;
      case 'statetypeset': {
        const st = pstr(ct, 'statetype'), mt = pstr(ct, 'movetype'), ph = pstr(ct, 'physics');
        if (st) this.statetype = st[0].toUpperCase();
        if (mt) this.movetype = mt[0].toUpperCase();
        if (ph) this.physics = ph[0].toUpperCase();
        return;
      }
      case 'turn': this.facing = -this.facing; return;
      case 'varset': case 'varadd': {
        const add = t === 'varadd';
        for (const key of Object.keys(ct.params)) {
          const m = key.match(/^(var|fvar|sysvar|sysfvar)\s*\(\s*(\d+)\s*\)$/);
          if (m) { this.setVar(m[1], +m[2], pn(ct, key, c), add); }
        }
        if (has(ct, 'v')) this.setVar('var', pn(ct, 'v', c), pn(ct, 'value', c), add);
        if (has(ct, 'fv')) this.setVar('fvar', pn(ct, 'fv', c), pn(ct, 'value', c), add);
        return;
      }
      case 'varrandom': {
        const v = pn(ct, 'v', c);
        const lo = has(ct, 'range') ? (nodes(ct, 'range').length > 1 ? pn(ct, 'range', c, 0) : 0) : 0;
        const hi = has(ct, 'range') ? (nodes(ct, 'range').length > 1 ? pn(ct, 'range', c, 1) : pn(ct, 'range', c, 0)) : 1000;
        this.setVar('var', v, lo + Math.floor(Math.random() * (hi - lo + 1)), false);
        return;
      }
      case 'varrangeset': {
        const first = has(ct, 'first') ? pn(ct, 'first', c) : 0;
        if (has(ct, 'value')) { const last = has(ct, 'last') ? pn(ct, 'last', c) : 59; const v = pn(ct, 'value', c); for (let i = first; i <= last && i < 60; i++) this.vars[i] = v; }
        if (has(ct, 'fvalue')) { const last = has(ct, 'last') ? pn(ct, 'last', c) : 39; const v = pn(ct, 'fvalue', c); for (let i = first; i <= last && i < 40; i++) this.fvars[i] = v; }
        return;
      }
      case 'parentvarset': case 'parentvaradd': case 'rootvarset': case 'rootvaradd': {
        const tgt = t.startsWith('parent') ? this.parent : this.root;
        if (!tgt) return;
        const add = t.endsWith('add');
        for (const key of Object.keys(ct.params)) {
          const m = key.match(/^(var|fvar|sysvar|sysfvar)\s*\(\s*(\d+)\s*\)$/);
          if (m) tgt.setVar(m[1], +m[2], pn(ct, key, c), add);
        }
        if (has(ct, 'v')) tgt.setVar('var', pn(ct, 'v', c), pn(ct, 'value', c), add);
        if (has(ct, 'fv')) tgt.setVar('fvar', pn(ct, 'fv', c), pn(ct, 'value', c), add);
        return;
      }
      case 'poweradd': this.addPower(pn(ct, 'value', c)); return;
      case 'powerset': this.root.power = Math.max(0, Math.min(this.root.powerMax, pn(ct, 'value', c))); return;
      case 'lifeadd': {
        let v = pn(ct, 'value', c);
        if (!has(ct, 'absolute') || !pn(ct, 'absolute', c)) v = Math.round(v * (v < 0 ? 1 / (this.defenceMul * (this.constant('data.defence') / 100)) : 1));
        this.addLife(v, has(ct, 'kill') ? pn(ct, 'kill', c) : 1);
        return;
      }
      case 'lifeset': this.life = Math.max(0, Math.min(this.lifeMax, pn(ct, 'value', c))); return;
      case 'attackmulset': this.attackMul = pn(ct, 'value', c, 0, 1); return;
      case 'defencemulset': this.defenceMul = pn(ct, 'value', c, 0, 1) || 1; return;
      case 'assertspecial': {
        for (const k of ['flag', 'flag2', 'flag3']) { const f = pstr(ct, k); if (f) this.assert.add(f); }
        for (const f of this.assert) if (['intro', 'roundnotover', 'timerfreeze', 'nobardisplay', 'nomusic', 'noko', 'nokoslow', 'nokosnd', 'globalnoshadow', 'nobg', 'nofg', 'skipfightdisplay'].includes(f)) this.fight.globalAssert.add(f);
        return;
      }
      case 'playsnd': {
        const v = pPrefixed(ct, 'value', c);
        if (!v) return;
        const bank = v.pre === 'f' ? this.fight.fx.snd : this.stateOwner.root.def.snd;
        let vol = 1;
        if (has(ct, 'volumescale')) vol = pn(ct, 'volumescale', c) / 100;
        else if (has(ct, 'volume')) vol = Math.max(0.05, 1 + pn(ct, 'volume', c) / 255);
        const ch = has(ct, 'channel') ? pn(ct, 'channel', c) : -1;
        audio.play(bank, v.a, v.b, { channel: ch, owner: this.root, volume: vol, lowpriority: has(ct, 'lowpriority') && pn(ct, 'lowpriority', c), freqmul: has(ct, 'freqmul') ? pn(ct, 'freqmul', c) : 1, loop: has(ct, 'loop') && pn(ct, 'loop', c) });
        return;
      }
      case 'stopsnd': audio.stop(this.root, has(ct, 'channel') ? pn(ct, 'channel', c) : -1); return;
      case 'sndpan': return;
      case 'hitdef': this.setHitDef(ct, c); return;
      case 'reversaldef': this.setHitDef(ct, c, true); return;
      case 'nothitby': case 'hitby': {
        const slot = has(ct, 'value2') ? 1 : 0;
        const val = ct.params[slot ? 'value2' : 'value'] || '';
        const time = has(ct, 'time') ? pn(ct, 'time', c) : 1;
        (t === 'nothitby' ? this.notHitBy : this.hitBy)[slot] = { attr: val, time };
        return;
      }
      case 'hitoverride': {
        const slot = has(ct, 'slot') ? pn(ct, 'slot', c) : 0;
        this.hitOverride[slot] = { attr: ct.params.attr || '', stateno: pn(ct, 'stateno', c), time: has(ct, 'time') ? pn(ct, 'time', c) : 1, forceair: has(ct, 'forceair') && pn(ct, 'forceair', c) };
        return;
      }
      case 'movehitreset': this.moveContact = this.moveHit = this.moveGuarded = 0; return;
      case 'hitadd': this.hitCount += pn(ct, 'value', c); this.fight.addComboHits(this, pn(ct, 'value', c)); return;
      case 'hitvelset': {
        if (!has(ct, 'x') || pn(ct, 'x', c)) this.vel.x = this.ghv.xvel;
        if (!has(ct, 'y') || pn(ct, 'y', c)) this.vel.y = this.ghv.yvel;
        return;
      }
      case 'hitfallset': {
        const v = has(ct, 'value') ? pn(ct, 'value', c) : -1;
        if (v !== -1) this.ghv.fall = v ? 1 : 0;
        if (has(ct, 'xvel')) this.ghv['fall.xvel'] = pn(ct, 'xvel', c);
        if (has(ct, 'yvel')) this.ghv['fall.yvel'] = pn(ct, 'yvel', c);
        return;
      }
      case 'hitfallvel': {
        if (!isNaN(this.ghv['fall.xvel'])) this.vel.x = this.ghv['fall.xvel'];
        this.vel.y = this.ghv['fall.yvel'];
        return;
      }
      case 'hitfalldamage': {
        const d = this.ghv['fall.damage'];
        if (d) { this.addLife(-d, this.ghv['fall.kill']); this.ghv['fall.damage'] = 0; }
        return;
      }
      case 'fallenvshake': {
        const g = this.ghv;
        if (g['fall.envshake.time']) { this.fight.envShake(g['fall.envshake.time'], g['fall.envshake.freq'], g['fall.envshake.ampl'], g['fall.envshake.phase']); g['fall.envshake.time'] = 0; }
        return;
      }
      case 'width': {
        let f = this.frontWidth(), b = this.backWidth();
        if (has(ct, 'edge')) { f = pn(ct, 'edge', c, 0, f); b = pn(ct, 'edge', c, 1, b); }
        if (has(ct, 'player')) { f = pn(ct, 'player', c, 0, f); b = pn(ct, 'player', c, 1, b); }
        if (has(ct, 'value')) { f = pn(ct, 'value', c, 0, f); b = pn(ct, 'value', c, 1, b); }
        this.widthOverride = [f, b];
        return;
      }
      case 'playerpush': this.pushable = !!pn(ct, 'value', c, 0, 1); return;
      case 'screenbound': this.screenbound = !!pn(ct, 'value', c, 0, 0); this.moveCamX = !!pn(ct, 'movecamera', c, 0, 0); this.moveCamY = !!pn(ct, 'movecamera', c, 1, 0); return;
      case 'posfreeze': this.posFrozen = !!pn(ct, 'value', c, 0, 1); return;
      case 'sprpriority': this.sprPriority = pn(ct, 'value', c); return;
      case 'offset': if (has(ct, 'x')) this.drawOffset.x = pn(ct, 'x', c); if (has(ct, 'y')) this.drawOffset.y = pn(ct, 'y', c); return;
      case 'angledraw': this.angleDrawThisTick = true; if (has(ct, 'value')) this.angle = pn(ct, 'value', c); if (has(ct, 'scale')) this.angleScale = [pn(ct, 'scale', c, 0, 1), pn(ct, 'scale', c, 1, 1)]; return;
      case 'angleset': this.angle = pn(ct, 'value', c); return;
      case 'angleadd': this.angle += pn(ct, 'value', c); return;
      case 'anglemul': this.angle *= pn(ct, 'value', c); return;
      case 'trans': {
        const tr = pstr(ct, 'trans', 'none');
        const s = pn(ct, 'alpha', c, 0, 256), d = pn(ct, 'alpha', c, 1, 0);
        this.transOverride = { mode: tr, src: s, dst: d };
        return;
      }
      case 'palfx': case 'allpalfx': case 'bgpalfx': {
        const fx = {
          time: has(ct, 'time') ? pn(ct, 'time', c) : 1, t: 0,
          add: [pn(ct, 'add', c, 0), pn(ct, 'add', c, 1), pn(ct, 'add', c, 2)],
          mul: [pn(ct, 'mul', c, 0, 256), pn(ct, 'mul', c, 1, 256), pn(ct, 'mul', c, 2, 256)],
          sinadd: [pn(ct, 'sinadd', c, 0), pn(ct, 'sinadd', c, 1), pn(ct, 'sinadd', c, 2), pn(ct, 'sinadd', c, 3, 1)],
          invert: !!pn(ct, 'invertall', c), color: pn(ct, 'color', c, 0, 256),
        };
        if (t === 'palfx') this.palfx = fx;
        else if (t === 'allpalfx') this.fight.allPalFX = fx;
        else this.fight.bgPalFX = fx;
        return;
      }
      case 'remappal': return;
      case 'afterimage': {
        this.afterimage = {
          time: has(ct, 'time') ? pn(ct, 'time', c) : 1, length: has(ct, 'length') ? pn(ct, 'length', c) : 20,
          gap: Math.max(1, has(ct, 'framegap') ? pn(ct, 'framegap', c) : 4), timegap: Math.max(1, has(ct, 'timegap') ? pn(ct, 'timegap', c) : 1),
          trans: pstr(ct, 'trans', 'add'),
          palcolor: has(ct, 'palcolor') ? pn(ct, 'palcolor', c) : 256,
          add: [pn(ct, 'paladd', c, 0, 30), pn(ct, 'paladd', c, 1, 30), pn(ct, 'paladd', c, 2, 30)],
          mul: [pn(ct, 'palmul', c, 0, 0.65), pn(ct, 'palmul', c, 1, 0.65), pn(ct, 'palmul', c, 2, 0.65)],
          t: 0,
        };
        this.afterHist = [];
        return;
      }
      case 'afterimagetime': if (this.afterimage) { this.afterimage.time = pn(ct, 'time', c, 0, pn(ct, 'value', c)); this.afterimage.t = 0; } return;
      case 'envshake': this.fight.envShake(pn(ct, 'time', c), has(ct, 'freq') ? pn(ct, 'freq', c) : 60, has(ct, 'ampl') ? pn(ct, 'ampl', c) : -4, pn(ct, 'phase', c)); return;
      case 'envcolor': {
        this.fight.envColor = { color: [pn(ct, 'value', c, 0, 255), pn(ct, 'value', c, 1, 255), pn(ct, 'value', c, 2, 255)], time: has(ct, 'time') ? pn(ct, 'time', c) : 1, under: !!pn(ct, 'under', c) };
        return;
      }
      case 'superpause': case 'pause': this.doPause(ct, c, t === 'superpause'); return;
      case 'explod': this.fight.spawnExplod(this, ct, c); return;
      case 'gamemakeanim': this.fight.spawnSimpleAnim(this, ct, c); return;
      case 'modifyexplod': this.fight.modifyExplod(this, ct, c); return;
      case 'removeexplod': this.fight.removeExplods(this, has(ct, 'id') ? pn(ct, 'id', c) : -1); return;
      case 'helper': this.spawnHelper(ct, c); return;
      case 'destroyself': this.destroy(); return 'changed';
      case 'bindtoparent': case 'bindtoroot': {
        const tgt = t === 'bindtoparent' ? this.parent : this.root;
        if (!tgt) return;
        this.bindTo = { to: tgt, time: has(ct, 'time') ? pn(ct, 'time', c) : 1, x: pn(ct, 'pos', c, 0), y: pn(ct, 'pos', c, 1), facing: has(ct, 'facing') ? pn(ct, 'facing', c) : 0 };
        this.applyBind();
        return;
      }
      case 'bindtotarget': {
        const tg = this.findTarget(has(ct, 'id') ? pn(ct, 'id', c) : -1);
        if (!tg) return;
        const pt = pstr(ct, 'pos').split(',').map(s => s.trim());
        this.bindTo = { to: tg, time: has(ct, 'time') ? pn(ct, 'time', c) : 1, x: pn(ct, 'pos', c, 0), y: pn(ct, 'pos', c, 1), target: true, postype: pt[2] || 'foot', facing: 0 };
        this.applyBind();
        return;
      }
      case 'targetbind': {
        const id = has(ct, 'id') ? pn(ct, 'id', c) : -1;
        for (const tg of this.targetsById(id)) {
          tg.bindTo = { to: this, time: has(ct, 'time') ? pn(ct, 'time', c) : 1, x: pn(ct, 'pos', c, 0), y: pn(ct, 'pos', c, 1), facing: 0, fromTarget: true };
          tg.applyBind();
        }
        return;
      }
      case 'targetstate': {
        const id = has(ct, 'id') ? pn(ct, 'id', c) : -1;
        const v = pn(ct, 'value', c);
        for (const tg of this.targetsById(id)) { tg.changeState(v, undefined, undefined, this.root); tg._changeCount = (tg._changeCount || 0) + 1; }
        return;
      }
      case 'targetlifeadd': {
        const id = has(ct, 'id') ? pn(ct, 'id', c) : -1;
        let v = pn(ct, 'value', c);
        const kill = has(ct, 'kill') ? pn(ct, 'kill', c) : 1;
        const abs = has(ct, 'absolute') && pn(ct, 'absolute', c);
        for (const tg of this.targetsById(id)) {
          let d = v;
          if (!abs && d < 0) d = Math.round(d * this.attackMul * (this.root.constant('data.attack') / 100) / (tg.defenceMul * tg.constant('data.defence') / 100));
          tg.addLife(d, kill);
          if (d < 0) this.fight.addComboDamage(this, -d);
        }
        return;
      }
      case 'targetpoweradd': { const id = has(ct, 'id') ? pn(ct, 'id', c) : -1; for (const tg of this.targetsById(id)) tg.addPower(pn(ct, 'value', c)); return; }
      case 'targetfacing': {
        const id = has(ct, 'id') ? pn(ct, 'id', c) : -1;
        const v = pn(ct, 'value', c);
        for (const tg of this.targetsById(id)) tg.facing = v > 0 ? this.facing : -this.facing;
        return;
      }
      case 'targetvelset': case 'targetveladd': {
        const id = has(ct, 'id') ? pn(ct, 'id', c) : -1;
        for (const tg of this.targetsById(id)) {
          if (t === 'targetvelset') { if (has(ct, 'x')) tg.vel.x = pn(ct, 'x', c); if (has(ct, 'y')) tg.vel.y = pn(ct, 'y', c); }
          else { if (has(ct, 'x')) tg.vel.x += pn(ct, 'x', c); if (has(ct, 'y')) tg.vel.y += pn(ct, 'y', c); }
        }
        return;
      }
      case 'targetdrop': {
        const keep = has(ct, 'excludeid') ? pn(ct, 'excludeid', c) : -1;
        this.targets = this.targets.filter(t2 => keep >= 0 && t2.id === keep);
        return;
      }
      case 'projectile': this.fight.spawnProjectile(this, ct, c); return;
      case 'displaytoclipboard': case 'appendtoclipboard': case 'clearclipboard': case 'forcefeedback': case 'victoryquote': return;
      case 'makedust': return;
      case 'powertoggle': return;
      default:
        if (!Char.warned.has(t)) { Char.warned.add(t); console.warn('[fightwire] unsupported controller', t); }
    }
  }

  setVar(kind, i, v, add) {
    const arr = kind === 'var' ? this.vars : kind === 'fvar' ? this.fvars : kind === 'sysvar' ? this.sysvars : this.sysfvars;
    i |= 0;
    if (i < 0 || i >= arr.length) return;
    const nv = add ? arr[i] + v : v;
    arr[i] = (kind === 'var' || kind === 'sysvar') ? Math.trunc(nv) : nv;
  }
  addLife(v, kill = 1) {
    this.life = Math.min(this.lifeMax, this.life + v);
    if (!kill && this.life < 1) this.life = 1;
    if (this.life < 0) this.life = 0;
    if (this.fight.training && this.fight.trainingInfiniteLife && this.life < 1) this.life = 1;
  }
  targetsById(id) {
    return this.targets.filter(t => (id < 0 || id === undefined || t.id === id) && !t.c.destroyed).map(t => t.c);
  }

  doPause(ct, c, isSuper) {
    const time = has(ct, 'time') ? pn(ct, 'time', c) : 30;
    const movetime = has(ct, 'movetime') ? pn(ct, 'movetime', c) : 0;
    const darken = isSuper ? (has(ct, 'darken') ? !!pn(ct, 'darken', c) : true) : false;
    this.fight.startPause({ owner: this, time, movetime, darken, isSuper, endcmdbuftime: pn(ct, 'endcmdbuftime', c) });
    if (isSuper) {
      if (has(ct, 'poweradd')) this.addPower(pn(ct, 'poweradd', c));
      const a = pPrefixed(ct, 'anim', c);
      const animNo = a ? a.a : 30;
      if (animNo !== -1) {
        const fromFX = !a || a.pre !== 's';
        this.fight.spawnFXAnim(fromFX ? this.fight.fx : this.root.def, fromFX ? (this.fight.fx.anims.has(animNo) ? animNo : 100) : animNo,
          this.pos.x + pn(ct, 'pos', c, 0) * this.facing, this.pos.y + pn(ct, 'pos', c, 1), this.facing, { ontop: true, supermove: true, owner: this, ownpal: !fromFX });
      }
      const s = pPrefixed(ct, 'sound', c);
      if (s && s.a >= 0) audio.play(s.pre === 's' ? this.root.def.snd : this.fight.fx.snd, s.a, s.b, { owner: this.root });
    }
  }

  spawnHelper(ct, c) {
    const root = this.root;
    if (root.helpers.length > 56) return;
    const h = new Char(this.fight, root.def, { parent: this, helperId: has(ct, 'id') ? pn(ct, 'id', c) : 0, name: pstr(ct, 'name'), palIndex: root.palIndex, pal: root.pal, slot: root.slot, ai: root.ai });
    h.palKey = root.palKey;
    h.helperType = pstr(ct, 'helpertype', 'normal');
    h.lifeMax = root.lifeMax; h.life = root.lifeMax;
    const postype = pstr(ct, 'postype', 'p1');
    const px = pn(ct, 'pos', c, 0), py = pn(ct, 'pos', c, 1);
    const fv = has(ct, 'facing') ? pn(ct, 'facing', c) : 1;
    const ref = this.fight.posTypeRef(this, postype);
    h.facing = ref.facing * (fv < 0 ? -1 : 1);
    if (postype === 'left' || postype === 'right') h.facing = fv < 0 ? -1 : 1;
    h.pos.x = ref.x + px * ref.facing;
    h.pos.y = ref.y + py;
    h.keyctrl = has(ct, 'keyctrl') && !!pn(ct, 'keyctrl', c);
    h.ownpal = has(ct, 'ownpal') ? !!pn(ct, 'ownpal', c) : false;
    h.supermovetime = pn(ct, 'supermovetime', c);
    h.pausemovetime = pn(ct, 'pausemovetime', c);
    h.isProjHelper = h.helperType === 'proj';
    h.screenboundDefault = false;
    h.statetype = 'S'; h.movetype = 'I'; h.physics = 'N';
    h.ctrl = 0;
    h.stateOwner = h;
    h.sprPriority = this.sprPriority;
    root.helpers.push(h);
    this.children.push(h);
    this.fight.addEntity(h);
    h.changeState(has(ct, 'stateno') ? pn(ct, 'stateno', c) : 0);
  }
  destroy() {
    if (!this.isHelper) return;
    this.destroyed = true;
    const r = this.root;
    r.helpers = r.helpers.filter(h => h !== this);
    if (this.parent) this.parent.children = this.parent.children.filter(h => h !== this);
    this.fight.removeExplods(this, -1, true);
  }

  applyBind() {
    const b = this.bindTo;
    if (!b) return;
    if (b.time === 0 || b.to.destroyed) { this.bindTo = null; return; }
    const to = b.to;
    if (b.fromTarget) {
      // target bound to attacker: position relative to attacker facing
      this.pos.x = to.pos.x + b.x * to.facing;
      this.pos.y = to.pos.y + b.y;
    } else if (b.target) {
      let yoff = 0;
      if (b.postype === 'mid') yoff = to.constant('size.mid.pos.y');
      else if (b.postype === 'head') yoff = to.constant('size.head.pos.y');
      this.pos.x = to.pos.x + b.x * to.facing;
      this.pos.y = to.pos.y + b.y + yoff;
    } else {
      this.pos.x = to.pos.x + b.x * to.facing;
      this.pos.y = to.pos.y + b.y;
      if (b.facing > 0) this.facing = to.facing; else if (b.facing < 0) this.facing = -to.facing;
    }
  }

  // ---------- HitDef ----------
  setHitDef(ct, c, reversal = false) {
    const g = (k, i = 0, d = 0) => (has(ct, k) ? pn(ct, k, c, i, d) : d);
    const str = (k, d = '') => pstr(ct, k, d);
    const attr = parseAttr(ct.params.attr || 'S, NA');
    const hd = {
      reversal,
      active: true, ctrl: ct,
      attr,
      hitflag: (ct.params.hitflag || 'MAF').toUpperCase().replace(/\s/g, ''),
      guardflag: (ct.params.guardflag || '').toUpperCase().replace(/\s/g, ''),
      affectteam: str('affectteam', 'e'),
      animtype: ANIMTYPES[str('animtype', 'light')] ?? 0,
      damage: g('damage', 0), guardDamage: g('damage', 1),
      pauseP1: g('pausetime', 0), pauseP2: g('pausetime', 1),
      groundType: HIT_TYPES[str('ground.type', 'high')] ?? 1,
      groundSlide: g('ground.slidetime'), groundHit: g('ground.hittime'),
      airHit: g('air.hittime', 0, 20),
      groundVel: [g('ground.velocity', 0), g('ground.velocity', 1)],
      airVel: [g('air.velocity', 0), g('air.velocity', 1)],
      downVel: null,
      yaccel: g('yaccel', 0, 0.35 * (this.root.def.localcoord[0] / 320)),
      fall: g('fall'),
      fallX: has(ct, 'fall.xvelocity') ? g('fall.xvelocity') : NaN,
      fallY: g('fall.yvelocity', 0, -4.5),
      fallRecover: g('fall.recover', 0, 1),
      fallRecoverTime: g('fall.recovertime', 0, 4),
      fallDamage: g('fall.damage'),
      fallKill: g('fall.kill', 0, 1),
      kill: g('kill', 0, 1), guardKill: g('guard.kill', 0, 1),
      id: g('id'), chainid: g('chainid', 0, -1),
      nochain: [g('nochainid', 0, -1), g('nochainid', 1, -1)],
      hitonce: has(ct, 'hitonce') ? g('hitonce') : (attr.types[0]?.[1] === 'T' ? 1 : 0),
      numhits: g('numhits', 0, 1),
      p1stateno: has(ct, 'p1stateno') ? g('p1stateno') : null,
      p2stateno: has(ct, 'p2stateno') ? g('p2stateno') : null,
      p2getp1state: g('p2getp1state', 0, 1),
      forcestand: g('forcestand'),
      p1facing: g('p1facing'), p2facing: g('p2facing'), p1getp2facing: g('p1getp2facing'),
      p1spr: g('p1sprpriority', 0, 1), p2spr: g('p2sprpriority', 0, 0),
      airjuggle: g('air.juggle'),
      getpower: has(ct, 'getpower') ? [g('getpower', 0), g('getpower', 1, g('getpower', 0) / 2)] : null,
      givepower: has(ct, 'givepower') ? [g('givepower', 0), g('givepower', 1, g('givepower', 0) / 2)] : null,
      envshake: has(ct, 'envshake.time') ? [g('envshake.time'), g('envshake.freq', 0, 60), g('envshake.ampl', 0, -4), g('envshake.phase')] : null,
      fallEnvshake: has(ct, 'fall.envshake.time') ? [g('fall.envshake.time'), g('fall.envshake.freq', 0, 60), g('fall.envshake.ampl', 0, -4), g('fall.envshake.phase')] : null,
      palfx: has(ct, 'palfx.time') ? { time: g('palfx.time'), t: 0, add: [g('palfx.add', 0), g('palfx.add', 1), g('palfx.add', 2)], mul: [g('palfx.mul', 0, 256), g('palfx.mul', 1, 256), g('palfx.mul', 2, 256)], sinadd: [0, 0, 0, 1], invert: false, color: g('palfx.color', 0, 256) } : null,
      mindist: has(ct, 'mindist') ? [g('mindist', 0), g('mindist', 1)] : null,
      maxdist: has(ct, 'maxdist') ? [g('maxdist', 0), g('maxdist', 1)] : null,
      snap: has(ct, 'snap') ? [g('snap', 0), g('snap', 1)] : null,
      priority: g('priority', 0, 4),
    };
    hd.airType = HIT_TYPES[str('air.type', '')] ?? hd.groundType;
    hd.airAnimtype = has(ct, 'air.animtype') ? (ANIMTYPES[str('air.animtype')] ?? hd.animtype) : hd.animtype;
    hd.fallAnimtype = has(ct, 'fall.animtype') ? (ANIMTYPES[str('fall.animtype')] ?? 3) : (hd.airAnimtype >= 3 ? hd.airAnimtype : 3);
    hd.airFall = has(ct, 'air.fall') ? g('air.fall') : hd.fall;
    hd.guardPauseP1 = has(ct, 'guard.pausetime') ? g('guard.pausetime', 0) : hd.pauseP1;
    hd.guardPauseP2 = has(ct, 'guard.pausetime') ? g('guard.pausetime', 1) : hd.pauseP2;
    hd.guardSlide = has(ct, 'guard.slidetime') ? g('guard.slidetime') : hd.groundSlide;
    hd.guardHit = has(ct, 'guard.hittime') ? g('guard.hittime') : hd.guardSlide;
    hd.guardCtrl = has(ct, 'guard.ctrltime') ? g('guard.ctrltime') : hd.guardSlide;
    hd.airGuardCtrl = has(ct, 'airguard.ctrltime') ? g('airguard.ctrltime') : hd.guardCtrl;
    hd.guardVel = has(ct, 'guard.velocity') ? g('guard.velocity') : hd.groundVel[0];
    hd.airGuardVel = has(ct, 'airguard.velocity') ? [g('airguard.velocity', 0), g('airguard.velocity', 1)] : [hd.airVel[0] * 1.5, hd.airVel[1] / 2];
    hd.guardDist = has(ct, 'guard.dist') ? g('guard.dist') : this.root.constant('size.attack.dist');
    hd.downVel = has(ct, 'down.velocity') ? [g('down.velocity', 0), g('down.velocity', 1)] : hd.airVel.slice();
    hd.downHit = g('down.hittime', 0, 20);
    hd.downBounce = g('down.bounce');
    hd.groundCornerVel = has(ct, 'ground.cornerpush.veloff') ? g('ground.cornerpush.veloff') : hd.guardVel * 1.3;
    hd.airCornerVel = has(ct, 'air.cornerpush.veloff') ? g('air.cornerpush.veloff') : hd.groundCornerVel;
    // sparks and sounds
    const sp = pPrefixed(ct, 'sparkno', c);
    hd.spark = sp ? { own: sp.pre === 's', no: sp.a } : { own: false, no: this.root.constant('data.sparkno') };
    const gsp = pPrefixed(ct, 'guard.sparkno', c);
    hd.guardSpark = gsp ? { own: gsp.pre === 's', no: gsp.a } : { own: false, no: this.root.constant('data.guard.sparkno') };
    hd.sparkxy = [g('sparkxy', 0), g('sparkxy', 1)];
    const hs = pPrefixed(ct, 'hitsound', c);
    hd.hitsound = hs ? { own: hs.pre === 's', g: hs.a, n: hs.b } : null;
    const gs = pPrefixed(ct, 'guardsound', c);
    hd.guardsound = gs ? { own: gs.pre === 's', g: gs.a, n: gs.b } : null;
    if (reversal) hd.reversalAttr = ct.params['reversal.attr'] || '';
    hd.hitTargets = new Set();
    this.hitdef = hd;
  }

  hitDefFor(target) { return this.hitdef; }
}
Char.warned = new Set();

// ---------------- trigger table ----------------
const T = (name, type, fn) => { TRIG[name] = [type, fn]; };
const p2 = c => c.p2();
T('time', 'i', c => c.time); T('statetime', 'i', c => c.time);
T('stateno', 'i', c => c.stateNo); T('prevstateno', 'i', c => c.prevStateNo);
T('anim', 'i', c => c.animNo); T('animtime', 'i', c => c.anim.animTime());
T('ctrl', 'i', c => c.ctrl); T('alive', 'i', c => (c.life > 0 ? 1 : 0));
T('life', 'i', c => c.life); T('lifemax', 'i', c => c.lifeMax);
T('power', 'i', c => c.root.power); T('powermax', 'i', c => c.root.powerMax);
T('facing', 'i', c => c.facing); T('id', 'i', c => c.playerId);
T('gametime', 'i', c => c.fight.gameTime); T('roundstate', 'i', c => c.fight.roundState);
T('roundno', 'i', c => c.fight.roundNo); T('matchno', 'i', c => c.fight.matchNo);
T('roundsexisted', 'i', c => c.fight.roundsExisted(c.root)); T('matchover', 'i', c => (c.fight.matchOver ? 1 : 0));
T('win', 'i', c => (c.fight.winnerSide === c.teamSide ? 1 : 0)); T('winko', 'i', c => (c.fight.winnerSide === c.teamSide && c.fight.winType === 'ko' ? 1 : 0));
T('wintime', 'i', c => (c.fight.winnerSide === c.teamSide && c.fight.winType === 'time' ? 1 : 0)); T('winperfect', 'i', c => (c.fight.winnerSide === c.teamSide && c.fight.perfect ? 1 : 0));
T('lose', 'i', c => (c.fight.winnerSide && c.fight.winnerSide !== c.teamSide && c.fight.winnerSide !== 3 ? 1 : 0));
T('loseko', 'i', c => (c.fight.winnerSide && c.fight.winnerSide !== c.teamSide && c.fight.winType === 'ko' ? 1 : 0));
T('losetime', 'i', c => (c.fight.winnerSide && c.fight.winnerSide !== c.teamSide && c.fight.winType === 'time' ? 1 : 0));
T('drawgame', 'i', c => (c.fight.winnerSide === 3 ? 1 : 0));
T('ishometeam', 'i', c => (c.teamSide === 1 ? 1 : 0)); T('teamside', 'i', c => c.teamSide);
T('movecontact', 'i', c => c.moveContact); T('movehit', 'i', c => c.moveHit);
T('moveguarded', 'i', c => c.moveGuarded); T('movereversed', 'i', c => c.moveReversed);
T('hitcount', 'i', c => c.hitCount); T('uniqhitcount', 'i', c => c.uniqHitCount);
T('hitshakeover', 'i', c => (c.pauseTime <= 0 ? 1 : 0));
T('hitover', 'i', c => (c.ghv.hittime <= -1 || (c.ghv.hittime <= 0 && c.pauseTime <= 0) ? 1 : 0));
T('hitfall', 'i', c => (c.ghv.fall ? 1 : 0));
T('canrecover', 'i', c => (c.ghv['fall.recover'] && c.ghv['fall.recovertime'] <= 0 ? 1 : 0));
T('inguarddist', 'i', c => (c.fight.inGuardDistOf(c) ? 1 : 0));
T('numenemy', 'i', c => c.enemies().length); T('numpartner', 'i', c => (c.partner() ? 1 : 0));
T('numhelper', 'i', c => c.root.helpers.length); T('numtarget', 'i', c => c.targets.length);
T('numexplod', 'i', c => c.fight.countExplods(c, -1)); T('numproj', 'i', c => c.fight.countProj(c, -1));
T('palno', 'i', c => c.root.palIndex + 1); T('drawpalno', 'i', c => c.root.palIndex + 1);
T('ailevel', 'i', c => c.root.ai | 0);
T('name', 's', c => c.root.def.name); T('p1name', 's', c => c.root.def.name);
T('p2name', 's', c => p2(c)?.def.name || ''); T('p3name', 's', c => c.partner()?.def.name || '');
T('p4name', 's', c => c.enemy(1)?.def.name || ''); T('authorname', 's', c => c.root.def.author);
T('statetype', 's', c => c.statetype); T('movetype', 's', c => c.movetype);
T('p2statetype', 's', c => p2(c)?.statetype || ''); T('p2movetype', 's', c => p2(c)?.movetype || '');
T('p2life', 'i', c => p2(c)?.life ?? 0); T('p2stateno', 'i', c => p2(c)?.stateNo ?? 0); T('p2ctrl', 'i', c => p2(c)?.ctrl ?? 0);
T('p2power', 'i', c => p2(c)?.power ?? 0);
T('frontedgedist', 'f', c => c.fight.edgeDist(c, true)); T('backedgedist', 'f', c => c.fight.edgeDist(c, false));
T('frontedgebodydist', 'f', c => c.fight.edgeDist(c, true) - c.frontWidth()); T('backedgebodydist', 'f', c => c.fight.edgeDist(c, false) - c.backWidth());
T('leftedge', 'f', c => c.fight.camLeft()); T('rightedge', 'f', c => c.fight.camRight());
T('frontedge', 'f', c => (c.facing > 0 ? c.fight.camRight() : c.fight.camLeft())); T('backedge', 'f', c => (c.facing > 0 ? c.fight.camLeft() : c.fight.camRight()));
T('topedge', 'f', c => c.fight.camY - c.fight.groundY); T('bottomedge', 'f', c => c.fight.camY + (c.fight.viewH - c.fight.groundY));
T('screenwidth', 'f', c => c.fight.viewW); T('screenheight', 'f', c => c.fight.viewH);
T('gamewidth', 'f', c => c.fight.viewW); T('gameheight', 'f', c => c.fight.viewH);
T('hitpausetime', 'i', c => Math.max(0, c.pauseTime));
T('majorversion', 'i', () => 1); T('ikemenversion', 'i', () => 0);
T('receiveddamage', 'i', c => c.combo.recv || 0); T('receivedhits', 'i', c => c.combo.recvHits || 0);
T('timeremaining', 'i', c => c.fight.timer * 60); T('timeelapsed', 'i', c => c.fight.roundTime);
T('isasserted', 'i', () => 0);
T('runorder', 'i', () => 1);
T('backedgebody', 'f', c => c.fight.edgeDist(c, false));
T('projcanceltime', 'i', c => c.projTime('projcancel', 0));
T('envshaketime', 'i', c => c.fight.shake?.time || 0);
T('localscale', 'f', () => 1);

const A = (name, fn) => { TRIGA[name] = fn; };
A('numhelper', (c, id) => (id === undefined ? c.root.helpers.length : c.root.helpers.filter(h => h.helperId === id).length));
A('numexplod', (c, id) => c.fight.countExplods(c, id === undefined ? -1 : id));
A('numtarget', (c, id) => (id === undefined ? c.targets.length : c.targets.filter(t => t.id === id).length));
A('numprojid', (c, id) => c.fight.countProj(c, id ?? -1));
A('numproj', (c) => c.fight.countProj(c, -1));
A('playeridexist', (c, id) => (c.fight.playerById(id) ? 1 : 0));
A('numenemy', c => c.enemies().length);
A('numpartner', c => (c.partner() ? 1 : 0));
A('pos', (c, k) => (k === 'x' ? c.pos.x - (c.fight.originX || 0) : k === 'y' ? c.pos.y : 0));
A('vel', (c, k) => (k === 'x' ? c.vel.x : k === 'y' ? c.vel.y : 0));
A('p2dist', (c, k) => { const o = c.p2(); if (!o) return 0; return k === 'x' ? c.distX(o) : o.pos.y - c.pos.y; });
A('p1dist', (c, k) => { const o = c.p2(); if (!o) return 0; return k === 'x' ? c.distX(o) : o.pos.y - c.pos.y; });
A('p2bodydist', (c, k) => { const o = c.p2(); if (!o) return 0; return k === 'x' ? c.bodyDistX(o) : o.pos.y - c.pos.y; });
A('parentdist', (c, k) => { const o = c.parent; if (!o) return 0; return k === 'x' ? c.distX(o) : o.pos.y - c.pos.y; });
A('rootdist', (c, k) => { const o = c.root; if (!o) return 0; return k === 'x' ? c.distX(o) : o.pos.y - c.pos.y; });
A('screenpos', (c, k) => (k === 'x' ? c.pos.x - c.fight.camLeft() : c.pos.y - (c.fight.camY - c.fight.groundY)));
A('hitvel', (c, k) => (k === 'x' ? c.ghv.xvel : c.ghv.yvel));
A('camerapos', (c, k) => (k === 'x' ? c.fight.camX : c.fight.camY));
A('offset', (c, k) => (k === 'x' ? c.drawOffset.x : c.drawOffset.y));
A('acc', () => 0);
