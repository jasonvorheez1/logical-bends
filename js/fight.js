// FIGHTWIRE — match runtime: tick loop, hit resolution, effects, camera, rounds, rendering.
import { Char } from './char.js';
import { AnimPlayer } from './air.js';
import { spriteCanvas, getSprite } from './sff.js';
import { readRaw, DIR, BTN } from './input.js';
import { audio } from './audio.js';
import { compile, splitTop } from './expr.js';

const num = v => (typeof v === 'number' ? v : (v ? 1 : 0));

export const VIEW_W = 427, VIEW_H = 240, GROUND_Y = 214;

// Uniform rules per attack strength: target damage, minimum hitstun / blockstun, minimum hitpause.
const UNIFORM = {
  light: { dmg: 25, stun: 14, block: 10, pause: 7 },
  medium: { dmg: 60, stun: 17, block: 13, pause: 9 },
  heavy: { dmg: 80, stun: 20, block: 15, pause: 11 },
  launcher: { dmg: 60, stun: 22, block: 15, pause: 11 },
};

// --- param helpers for explods/projectiles (mirror of char.js helpers) ---
function P(ct, key, c, i = 0, def = 0) {
  ct.pc ||= {};
  let n = ct.pc['_f' + key];
  if (n === undefined) {
    const raw = ct.params[key];
    n = raw == null ? null : splitTop(raw).map(s => (s === '' ? null : compile(s)));
    ct.pc['_f' + key] = n;
  }
  if (!n || !n[i]) return def;
  const v = num(n[i].f(c));
  return isFinite(v) ? v : def;
}
const H = (ct, k) => ct.params[k] != null;
const S = (ct, k, d = '') => (ct.params[k] == null ? d : ct.params[k].trim().replace(/^"|"$/g, '').toLowerCase());
function animRef(ct, key, c) {
  const raw = ct.params[key];
  if (raw == null) return null;
  const m = raw.trim().match(/^([fFsS])(?=\s|\d|\(|-)\s*(.*)$/);
  if (m) {
    ct.pc ||= {};
    const k2 = '_a' + key;
    const node = ct.pc[k2] ||= compile(m[2]);
    return { pre: m[1].toLowerCase(), no: num(node.f(c)) };
  }
  return { pre: '', no: P(ct, key, c) };
}

class Explod {
  constructor() { this.anim = new AnimPlayer(null); }
}

export class Fight {
  constructor(opts) {
    this.opts = opts;
    this.fx = opts.fx;
    this.stage = opts.stage;
    this.mode = opts.mode || 'versus';
    this.training = this.mode === 'training';
    this.trainingInfiniteLife = true;
    this.comboSystem = opts.comboSystem !== false;
    this.uniform = opts.uniform !== false;
    this.viewW = VIEW_W; this.viewH = VIEW_H; this.groundY = GROUND_Y;
    this.stageLeft = -420; this.stageRight = 420;
    this.camX = 0; this.camY = 0;
    this.gameTime = 0;
    this.roundNo = 1; this.matchNo = opts.matchNo || 1;
    this.roundsToWin = opts.roundsToWin || 2;
    this.roundTimeSec = opts.timeSec ?? 99;
    this.wins = { 1: 0, 2: 0 };
    this.entities = [];
    this.explods = [];
    this.projs = [];
    this.globalAssert = new Set();
    this.pause = null;
    this.shake = null;
    this.envColor = null;
    this.allPalFX = null;
    this.combos = { 1: { hits: 0, dmg: 0, show: 0, last: 0 }, 2: { hits: 0, dmg: 0, show: 0, last: 0 } };
    this.messages = [];
    this.roundsExistedMap = new Map();
    this.showBoxes = false;
    this.events = [];
    this.roots = [];
    const mk = (side, cfg) => {
      const c = new Char(this, cfg.def, { teamSide: side, slot: side - 1, palIndex: cfg.palIndex || 0, ai: cfg.ai || 0 });
      c.human = !cfg.ai && !cfg.dummy;
      c.dummy = cfg.dummy || null;
      c.nativeAI = !!cfg.def.profile?.nativeAI;
      c.bot = cfg.ai && !c.nativeAI ? { level: cfg.ai, think: 0, hold: 0, btn: 0 } : (cfg.ai ? { level: cfg.ai, think: 0, hold: 0, btn: 0, light: true } : null);
      return c;
    };
    this.p1 = mk(1, opts.p1);
    this.p2 = mk(2, opts.p2);
    this.roots = [this.p1, this.p2];
    this.entities = [this.p1, this.p2];
    this.startRound(true);
  }

  // ---------------- lookups ----------------
  playerById(id) { return this.entities.find(e => e.playerId === id && !e.destroyed) || null; }
  roundsExisted(c) { return this.roundsExistedMap.get(c) || 0; }
  addEntity(e) { this.entities.push(e); }
  camLeft() { return this.camX - this.viewW / 2; }
  camRight() { return this.camX + this.viewW / 2; }
  edgeDist(c, front) {
    const right = this.camRight(), left = this.camLeft();
    if ((c.facing > 0) === front) return right - c.pos.x;
    return c.pos.x - left;
  }
  stageVar(k) { return k === 'info.name' ? (this.stage?.name || '') : ''; }
  posTypeRef(c, postype) {
    // Screen-anchored effects are authored for a 320-wide screen: center that box inside our wider view.
    const m = Math.max(0, (this.viewW - (c.root.def.localcoord?.[0] || 320)) / 2);
    const L = this.camLeft() + m, R = this.camRight() - m;
    switch (postype) {
      case 'p2': { const e = c.p2() || c; return { x: e.pos.x, y: e.pos.y, facing: c.facing }; }
      case 'front': return { x: c.facing > 0 ? R : L, y: this.camY - 0, facing: c.facing, screen: true };
      case 'back': return { x: c.facing > 0 ? L : R, y: this.camY - 0, facing: c.facing, screen: true };
      case 'left': return { x: L, y: this.camY - this.groundY, facing: 1, screen: true };
      case 'right': return { x: R, y: this.camY - this.groundY, facing: 1, screen: true };
      default: return { x: c.pos.x, y: c.pos.y, facing: c.facing };
    }
  }

  // ---------------- round flow ----------------
  startRound(first = false) {
    this.roundState = 0;
    this.roundTick = 0;
    this.roundTime = 0;
    this.timer = this.roundTimeSec;
    this.timerSub = 0;
    this.winnerSide = 0; this.winType = ''; this.perfect = false;
    this.koTick = 0; this.slowmo = 0;
    for (const e of this.entities) if (e.isHelper) e.destroyed = true;
    this.entities = [this.p1, this.p2];
    this.explods = []; this.projs = [];
    this.pause = null; this.shake = null; this.envColor = null; this.allPalFX = null;
    for (const c of this.roots) {
      c.helpers = []; c.children = []; c.targets = [];
      if (this.uniform) { c.lifeMax = 1000; c.powerMax = 3000; }
      c.life = c.lifeMax;
      if (first) c.power = this.training ? c.powerMax : 0;
      c.pos.x = c.teamSide === 1 ? -70 : 70; c.pos.y = 0;
      c.vel.x = c.vel.y = 0;
      c.facing = c.teamSide === 1 ? 1 : -1;
      c.pauseTime = 0; c.hitdef = null; c.palfx = null; c.afterimage = null;
      c.notHitBy = [null, null]; c.hitBy = [null, null]; c.hitOverride = [];
      c.attackMul = 1; c.defenceMul = 1;
      c.stateOwner = c; c.bindTo = null; c.angle = 0;
      c.ghv = c.blankGHV();
      const ip = c.def.consts['data.intpersistindex'] ?? 60, fp = c.def.consts['data.floatpersistindex'] ?? 40;
      if (!first) { for (let i = 0; i < Math.min(60, ip); i++) c.vars[i] = 0; for (let i = 0; i < Math.min(40, fp); i++) c.fvars[i] = 0; }
      c.sysvars.fill(0); c.sysfvars.fill(0);
      c.cmd?.clear();
      audio.stop(c, -1);
      c.changeState(5900, 0);
      this.roundsExistedMap.set(c, (this.roundsExistedMap.get(c) || 0) + (first ? 0 : 0));
    }
    this.camX = 0; this.camY = 0;
    this.messages = [];
  }

  say(text, ticks, style = 'big', sub = '') { this.messages.push({ text, ticks, t: 0, style, sub }); }

  roundLogic() {
    const rs = this.roundState;
    this.roundTick++;
    const anyAssert = (f) => this.globalAssert.has(f);
    if (rs === 0) {
      if (this.roundTick >= 20) { this.roundState = 1; this.roundTick = 0; }
    } else if (rs === 1) {
      const intro = anyAssert('intro');
      if (!this._introDone) {
        if (!intro && this.roundTick > 2) {
          this._introDone = true; this.roundTick = 0;
          if (!this.training) {
            const final = this.wins[1] === this.roundsToWin - 1 && this.wins[2] === this.roundsToWin - 1;
            this.say(final ? 'FINAL ROUND' : `ROUND ${this.roundNo}`, 70, 'round');
            audio.sting('round');
          }
        }
        if (this.roundTick > 600) { this._introDone = true; this.roundTick = 0; }
      } else {
        const wait = this.training ? 1 : 70;
        if (this.roundTick === wait) { if (!this.training) { this.say('FIGHT!', 45, 'fight'); audio.sting('fight'); } }
        if (this.roundTick >= wait + (this.training ? 0 : 20)) {
          this.roundState = 2; this.roundTick = 0; this._introDone = false;
          for (const c of this.roots) {
            if (c.stateNo === 191 || c.stateNo === 190 || c.stateNo >= 180 && c.stateNo < 200) c.changeState(0, 1);
            c.ctrl = 1;
            this.roundsExistedMap.set(c, (this.roundsExistedMap.get(c) || 0));
          }
        }
      }
    } else if (rs === 2) {
      this.roundTime++;
      if (!this.training && !anyAssert('timerfreeze') && !this.pause && this.timer >= 0 && this.roundTimeSec > 0) {
        if (++this.timerSub >= 60) { this.timerSub = 0; this.timer--; }
      }
      const dead = this.roots.filter(c => c.life <= 0);
      if (this.training) {
        for (const c of this.roots) if (c.life <= 0) c.life = 1;
        return;
      }
      if (dead.length) {
        this.roundState = 3; this.roundTick = 0;
        if (dead.length === 2) { this.winnerSide = 3; this.winType = 'ko'; this.say('DOUBLE K.O.', 120, 'ko'); }
        else {
          const w = this.roots.find(c => c.life > 0);
          this.winnerSide = w.teamSide; this.winType = 'ko';
          this.perfect = w.life >= w.lifeMax;
          this.say('K.O.', 110, 'ko', this.perfect ? 'PERFECT' : '');
        }
        if (!anyAssert('nokoslow')) this.slowmo = 60;
        audio.sting('ko');
      } else if (this.timer < 0 || (this.timer === 0 && this.timerSub === 0 && this.roundTimeSec > 0)) {
        this.roundState = 3; this.roundTick = 0;
        const [a, b] = this.roots;
        const ra = a.life / a.lifeMax, rb = b.life / b.lifeMax;
        this.winnerSide = Math.abs(ra - rb) < 1e-6 ? 3 : (ra > rb ? 1 : 2);
        this.winType = 'time';
        this.say('TIME UP', 110, 'ko');
        for (const c of this.roots) c.ctrl = 0;
      }
    } else if (rs === 3) {
      for (const c of this.roots) if (c.stateNo < 5000 && c.ctrl) c.ctrl = 0;
      const settled = this.roots.every(c => (c.life <= 0 ? c.stateNo === 5150 || c.statetype === 'L' : (c.movetype !== 'H' && c.statetype !== 'A')));
      if ((this.roundTick > 80 && settled && !anyAssert('roundnotover')) || this.roundTick > 420) {
        this.roundState = 4; this.roundTick = 0;
        for (const c of this.roots) {
          if (c.life <= 0) continue;
          const won = this.winnerSide === c.teamSide;
          const draw = this.winnerSide === 3;
          const target = draw ? 175 : won ? 180 : 170;
          if (c.stateOwner !== c) c.stateOwner = c;
          if (c.movetype !== 'H') c.changeState(target, 0);
        }
        if (this.winnerSide === 1 || this.winnerSide === 2) {
          this.wins[this.winnerSide]++;
          const w = this.winnerSide === 1 ? this.p1 : this.p2;
          this.say(`${w.def.displayName.toUpperCase()} WINS`, 150, 'win');
          audio.sting('win');
        } else {
          this.wins[1]++; this.wins[2]++;
          this.say('DRAW GAME', 150, 'win');
        }
      }
    } else if (rs === 4) {
      if ((this.roundTick > 150 && !anyAssert('roundnotover')) || this.roundTick > 600) {
        for (const c of this.roots) this.roundsExistedMap.set(c, (this.roundsExistedMap.get(c) || 0) + 1);
        const done = this.wins[1] >= this.roundsToWin || this.wins[2] >= this.roundsToWin;
        if (done) {
          this.matchOver = true;
          const ws = this.wins[1] === this.wins[2] ? 3 : (this.wins[1] > this.wins[2] ? 1 : 2);
          this.events.push({ type: 'matchover', winner: ws });
          this.roundState = 5;
        } else {
          this.roundNo++;
          this.startRound(false);
        }
      }
    }
  }

  // ---------------- inputs ----------------
  readInputs() {
    for (const c of this.roots) {
      // Older characters detect "CPU control" through a variable their helpers set; set it directly.
      const av = c.def.profile?.aiVar;
      if (av && c.ai && !c.human) c.vars[av.var] = av.value;
      let dirBits = 0, btn = 0;
      if (c.human) {
        const r = readRaw(c.slot);
        if (r.u) dirBits |= DIR.U; if (r.d) dirBits |= DIR.D;
        if (r.l) dirBits |= c.facing > 0 ? DIR.B : DIR.F;
        if (r.r) dirBits |= c.facing > 0 ? DIR.F : DIR.B;
        btn = r.btn;
      } else if (c.dummy) {
        const d = c.dummy;
        if (d.mode === 'crouch') dirBits |= DIR.D;
        if (d.mode === 'jump') dirBits |= DIR.U;
        if (d.guard === 'all' || (d.guard === 'random' && Math.random() < 0.5)) {
          const e = c.p2();
          if (e && (e.movetype === 'A' || this.projs.some(p => p.owner.root === e))) dirBits |= DIR.B;
        }
        if (d.mode === 'cpu') ({ dirBits, btn } = this.botThink(c));
      } else if (c.bot) {
        ({ dirBits, btn } = this.botThink(c));
      }
      c._upPressed = (dirBits & DIR.U) && !((c.inputDir || 0) & DIR.U);
      c.inputDir = dirBits;
      const prevBtn = c.inputBtn || 0;
      c.inputBtn = btn;
      c.cmd.push(dirBits, btn & 0x7f);
      c.cmd.update(c.pauseTime > 0 || (this.pause && this.pause.owner.root !== c));
      // FIGHTWIRE easy inputs: E + dir = special, Q + dir = super, E+Q = EX special
      const pressed = btn & ~prevBtn;
      const easy = !c.def.profile?._easyOff && c.def.profile?.easy;
      if (easy && (pressed & (BTN.e | BTN.q))) {
        const key = dirKey(dirBits);
        const both = (btn & BTN.e) && (btn & BTN.q);
        let table = null;
        if (both && easy.ex) table = easy.ex;
        else if (pressed & BTN.q) table = c.statetype === 'A' && easy.superAir ? easy.superAir : easy.super;
        else table = c.statetype === 'A' && easy.specialAir ? easy.specialAir : easy.special;
        const name = pickEasy(table, key);
        if (name) for (const n of [].concat(name)) c.cmd.force(n, 6);
      }
      // FIGHTWIRE auto combo: mashing Light advances Light → Medium → Heavy → Special → Super
      if (this.autoCombo && c.human && (pressed & BTN.x)) this.autoComboStep(c, dirBits);
    }
  }

  autoComboStep(c, dirBits) {
    const prof = c.def.profile;
    const ac = prof?.autoCombo;
    if (!ac || c.movetype !== 'A' || !c.moveContact || c.stateOwner !== c) return;
    const rank = c.rankOf(c.stateNo);
    const easy = prof.easy || {};
    const air = c.statetype === 'A';
    let next = null;
    if (rank === 'light') next = ac.medium || ac.heavy || 'special';
    else if (rank === 'medium') next = ac.heavy || 'special';
    else if (rank === 'heavy' || rank === 'launcher') next = air ? null : 'special';
    else if (rank === 'special') next = c.root.power >= 1000 ? 'super' : null;
    if (!next) return;
    if (next === 'special') next = pickEasy(air && easy.specialAir ? easy.specialAir : easy.special, 'N');
    else if (next === 'super') next = pickEasy(air && easy.superAir ? easy.superAir : easy.super, 'N');
    if (!next) return;
    // swap the buffered Light press for the next link in the route
    c.cmd.active.delete('x');
    c.cmd.forced.delete('x');
    for (const n of [].concat(next)) c.cmd.force(n, 8);
    c.combo.chain = 3; // stop the plain light→light chain from stealing the press
  }

  // Generic CPU for characters without their own AI (and helper for "light" assistance)
  botThink(c) {
    const b = c.bot || (c.bot = { level: 4, think: 0 });
    const e = c.p2();
    let dirBits = 0, btn = 0;
    if (!e || this.roundState !== 2) return { dirBits, btn };
    if (b.light) return { dirBits, btn }; // native AI handles everything
    const dist = Math.abs(e.pos.x - c.pos.x);
    const lvl = b.level;
    if (--b.think <= 0) {
      b.think = 8 + Math.floor(Math.random() * (24 - lvl * 2));
      const r = Math.random();
      b.plan = dist > 110 ? (r < 0.7 ? 'approach' : r < 0.85 ? 'jumpin' : 'wait')
        : dist > 55 ? (r < 0.4 ? 'approach' : r < 0.6 ? 'poke' : r < 0.75 ? 'special' : r < 0.85 ? 'jumpin' : 'back')
        : (r < 0.45 ? 'combo' : r < 0.6 ? 'special' : r < 0.75 ? 'crouchpoke' : r < 0.85 ? 'back' : 'wait');
      b.step = 0;
      if (c.power >= 1000 && Math.random() < 0.08 * lvl / 4 && dist < 120) b.plan = 'super';
    }
    // defend
    if (e.movetype === 'A' && dist < 140 && Math.random() < 0.25 + lvl * 0.08) {
      dirBits |= DIR.B;
      if (e.statetype === 'C' || Math.random() < 0.3) dirBits |= DIR.D;
      return { dirBits, btn };
    }
    b.step++;
    switch (b.plan) {
      case 'approach': dirBits |= DIR.F; break;
      case 'back': dirBits |= DIR.B; break;
      case 'jumpin': if (b.step < 3) dirBits |= DIR.U | DIR.F; else if (c.statetype === 'A' && b.step % 6 === 0) btn |= pickBtn(); break;
      case 'poke': if (b.step % 4 === 1) btn |= BTN.x; break;
      case 'crouchpoke': dirBits |= DIR.D; if (b.step % 5 === 1) btn |= [BTN.x, BTN.y, BTN.z][Math.floor(Math.random() * 3)]; break;
      case 'combo': if (b.step % 6 === 1) btn |= [BTN.x, BTN.y, BTN.z][Math.min(2, Math.floor(b.step / 6))]; if (b.step === 19) btn |= BTN.e; break;
      case 'special': if (b.step === 1) { btn |= BTN.e; dirBits |= [0, DIR.F, DIR.B, DIR.D, DIR.U][Math.floor(Math.random() * 5)]; } break;
      case 'super': if (b.step === 1) btn |= BTN.q; break;
    }
    return { dirBits, btn };
  }

  // ---------------- main tick ----------------
  tick() {
    if (this.roundState === 5) return;
    if (this.slowmo > 0) {
      this.slowmo--;
      if ((this._slowAcc = (this._slowAcc || 0) + 1) % 2) return;
    }
    this.gameTime++;
    this.globalAssert.clear();
    this.readInputs();
    const pause = this.pause;
    const frozen = (e) => {
      if (!pause) return false;
      if (pause.owner === e && pause.movetime > 0) return false;
      if (e.isHelper && (pause.isSuper ? e.supermovetime : e.pausemovetime) > 0) return false;
      return true;
    };
    const list = this.entities.slice();
    for (const e of list) { e.gotHitThisTick = false; }
    // state processing
    for (const e of list) {
      if (e.destroyed) continue;
      if (frozen(e)) continue;
      e.actionRun();
    }
    // physics / animation
    for (const e of list) {
      if (e.destroyed) continue;
      if (frozen(e)) continue;
      this.physics(e);
    }
    if (pause) {
      if (pause.movetime > 0) pause.movetime--;
      for (const e of list) if (e.isHelper && !frozen(e)) { if (pause.isSuper && e.supermovetime > 0) e.supermovetime--; if (!pause.isSuper && e.pausemovetime > 0) e.pausemovetime--; }
      if (--pause.time <= 0) this.pause = null;
    }
    if (!pause) {
      this.hitDetection();
      this.updateProjectiles();
    }
    this.pushPlayers();
    this.updateExplods(pause);
    // remove destroyed helpers
    this.entities = this.entities.filter(e => !e.destroyed);
    // targets cleanup
    for (const e of this.entities) {
      if (e.targets.length) e.targets = e.targets.filter(t => !t.c.destroyed && (t.c.movetype === 'H' || t.c.stateOwner === e.root));
    }
    // custom-state release: if a thrower got hit, release the target
    for (const c of this.roots) {
      if (c.stateOwner !== c) {
        const own = c.stateOwner;
        if (own.movetype === 'H' && own.gotHitThisTick) { c.stateOwner = c; c.changeState(5050); }
      }
    }
    this.updateCombos();
    this.updateCamera();
    this.roundLogic();
    if (this.shake) { this.shake.t++; if (this.shake.t >= this.shake.time) this.shake = null; }
    if (this.envColor && --this.envColor.time <= 0) this.envColor = null;
    if (this.allPalFX && ++this.allPalFX.t >= this.allPalFX.time && this.allPalFX.time >= 0) this.allPalFX = null;
    for (const m of this.messages) m.t++;
    this.messages = this.messages.filter(m => m.t < m.ticks);
  }

  physics(e) {
    const paused = e.pauseTime > 0;
    if (paused) {
      e.pauseTime--;
      if (e.bindTo) e.applyBind();
      return;
    }
    // counters
    if (e.moveContact > 0) e.moveContact++;
    if (e.moveHit > 0) e.moveHit++;
    if (e.moveGuarded > 0) e.moveGuarded++;
    if (e.moveReversed > 0) e.moveReversed++;
    for (const arr of [e.notHitBy, e.hitBy]) for (let i = 0; i < 2; i++) if (arr[i] && arr[i].time >= 0 && --arr[i].time <= 0) arr[i] = null;
    e.hitOverride = e.hitOverride.map(h => (h && h.time !== -1 && --h.time <= 0 ? null : h));
    if (e.movetype === 'H') {
      if (e.ghv.hittime > -1) e.ghv.hittime--;
      if (e.ghv['fall.recovertime'] > 0) e.ghv['fall.recovertime']--;
    }
    e.time++;
    if (e.palfx) { e.palfx.t++; if (e.palfx.time >= 0 && e.palfx.t >= e.palfx.time) e.palfx = null; }
    if (e.afterimage) {
      const ai = e.afterimage;
      if (ai.t % ai.timegap === 0) {
        const f = e.anim.frame();
        if (f) { e.afterHist.unshift({ f, x: e.pos.x, y: e.pos.y, facing: e.facing, owner: e.anim.owner }); if (e.afterHist.length > ai.length) e.afterHist.pop(); }
      }
      ai.t++;
      if (ai.time >= 0 && ai.t >= ai.time) { e.afterimage = null; e.afterHist = []; }
    }
    if (e.bindTo) {
      e.applyBind();
      if (e.bindTo && e.bindTo.time > 0) e.bindTo.time--;
      if (e.bindTo && e.bindTo.time === 0) e.bindTo = null;
    } else if (!e.posFrozen) {
      e.pos.x += e.vel.x * e.facing;
      e.pos.y += e.vel.y;
    }
    // physics types
    const k = e.root.def.consts;
    if (e.physics === 'S' || e.physics === 'C') {
      const fr = e.physics === 'S' ? k['movement.stand.friction'] : k['movement.crouch.friction'];
      const sliding = e.movetype === 'H' && e.time <= (e.ghv.slidetime || 0);
      if (!sliding) e.vel.x *= fr;
      if (Math.abs(e.vel.x) < 0.01) e.vel.x = 0;
      if (e.pos.y > 0) e.pos.y = 0;
      // Safety: basic stand / crouch / walk states are always on the floor
      if (e.pos.y < 0 && !e.isHelper && !e.bindTo && [0, 10, 11, 12, 20].includes(e.stateNo)) { e.pos.y = 0; e.vel.y = 0; }
    } else if (e.physics === 'A') {
      e.vel.y += k['movement.yaccel'];
      if (e.pos.y >= 0 && e.vel.y > 0 && e.movetype !== 'H' && !e.isHelper) {
        e.pos.y = 0;
        e.changeState(52);
        e.airJumps = 0;
        if (e.combo) e.combo.chain = 0;
      }
    }
    e.anim.step();
  }

  // ---------------- collision ----------------
  boxes(e, kind) {
    const f = e.anim.frame();
    if (!f) return null;
    const list = kind === 1 ? f.clsn1 : f.clsn2;
    if (!list || !list.length) return null;
    const xs = e.root.def.consts['size.xscale'] || 1, ys = e.root.def.consts['size.yscale'] || 1;
    return list.map(([x1, y1, x2, y2]) => (e.facing > 0
      ? [e.pos.x + x1 * xs, e.pos.y + y1 * ys, e.pos.x + x2 * xs, e.pos.y + y2 * ys]
      : [e.pos.x - x2 * xs, e.pos.y + y1 * ys, e.pos.x - x1 * xs, e.pos.y + y2 * ys]));
  }
  overlap(A, B) {
    for (const a of A) for (const b of B) if (a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]) return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
    return null;
  }

  canBeHit(att, def, hd) {
    if (def.destroyed || def === att) return false;
    if (def.isHelper && def.helperType === 'normal' && !this.boxes(def, 2)) return false;
    const enemy = def.teamSide !== att.teamSide;
    const aff = hd.affectteam;
    if (aff === 'e' && !enemy) return false;
    if (aff === 'f' && enemy) return false;
    if (hd.hitTargets.has(def)) return false;
    // nothitby / hitby
    for (const s of def.notHitBy) if (s && attrMatches(s.attr, hd.attr)) return false;
    if (def.hitBy.some(Boolean) && !def.hitBy.some(s => s && attrMatches(s.attr, hd.attr))) return false;
    // throws can't hit someone already being thrown / in custom state of another
    if (def.stateOwner !== def && def.stateOwner.root !== att.root) return false;
    // hitflag
    const hf = hd.hitflag;
    if (hf.includes('+') && def.movetype !== 'H') return false;
    if (hf.includes('-') && def.movetype === 'H') return false;
    if (def.statetype === 'L') { if (!hf.includes('D')) return false; }
    else if (def.statetype === 'A') {
      if (!hf.includes('A')) return false;
      if (def.movetype === 'H' && def.ghv.fall && !hf.includes('F')) return false;
    } else if (def.statetype === 'C') { if (!(hf.includes('L') || hf.includes('M'))) return false; }
    else { if (!(hf.includes('H') || hf.includes('M'))) return false; }
    // nochainid
    if (def.movetype === 'H' && def.ghv.hitid && (hd.nochain[0] >= 0 || hd.nochain[1] >= 0)) {
      if (def.ghv.chainidLast === hd.nochain[0] || def.ghv.chainidLast === hd.nochain[1]) return false;
    }
    return true;
  }
  isGuarding(def, hd) {
    if (!hd.guardflag) return false;
    if (def.stateOwner !== def) return false;
    if (def.movetype === 'H' && !(def.stateNo >= 150 && def.stateNo <= 155)) return false;
    const gf = hd.guardflag;
    let ok = false;
    if (def.statetype === 'S') ok = gf.includes('H') || gf.includes('M');
    else if (def.statetype === 'C') ok = gf.includes('L') || gf.includes('M');
    else if (def.statetype === 'A') ok = gf.includes('A');
    if (!ok) return false;
    if (def.stateNo >= 120 && def.stateNo <= 155) return true;
    const holdBack = def.root.inputDir & DIR.B;
    return !!(holdBack && def.ctrl && def.movetype !== 'A' && def.statetype !== 'L' && !def.isHelper);
  }

  inGuardDistOf(c) {
    for (const e of this.entities) {
      if (e.teamSide === c.teamSide || e.destroyed) continue;
      if (e.movetype === 'A' && e.hitdef) {
        const d = Math.abs(e.pos.x - c.pos.x);
        if (d <= (e.hitdef.guardDist ?? 160) + 20) return true;
      }
    }
    for (const p of this.projs) if (p.owner.teamSide !== c.teamSide && Math.abs(p.pos.x - c.pos.x) < 150) return true;
    return false;
  }

  hitDetection() {
    const attackers = this.entities.filter(e => e.hitdef && e.hitdef.active && !e.destroyed && e.pauseTime <= 0);
    const hits = [];
    for (const a of attackers) {
      const hd = a.hitdef;
      const c1 = this.boxes(a, 1);
      if (!c1) continue;
      for (const d of this.entities) {
        if (d === a || d.destroyed) continue;
        if (!this.canBeHit(a, d, hd)) continue;
        const c2 = this.boxes(d, 2);
        if (!c2) continue;
        const ov = this.overlap(c1, c2);
        if (!ov) continue;
        if (hd.reversal) continue;
        hits.push({ a, d, hd, ov });
      }
    }
    // reversals: a ReversalDef catches an incoming attacker's hitdef
    for (const r of attackers.filter(e => e.hitdef && e.hitdef.reversal)) {
      const rh = r.hitdef;
      if (!rh || !rh.active) continue;
      const c1 = this.boxes(r, 1); if (!c1) continue;
      for (const a of attackers) {
        const ah = a.hitdef;
        if (a === r || a.teamSide === r.teamSide || !ah || !ah.active || ah.reversal) continue;
        if (!attrMatches(rh.reversalAttr, ah.attr)) continue;
        const c1b = this.boxes(a, 1); if (!c1b || !this.overlap(c1, c1b)) continue;
        ah.active = false; rh.active = false;
        r.moveReversed = 1; r.moveContact = 1;
        r.pauseTime = rh.pauseP1; a.pauseTime = rh.pauseP2;
        r.targets.push({ c: a, id: rh.id });
        if (rh.p1stateno != null) r.changeState(rh.p1stateno);
        if (rh.p2stateno != null) a.changeState(rh.p2stateno, undefined, undefined, rh.p2getp1state ? r.root : a);
        break;
      }
    }
    for (const h of hits) {
      if (!h.hd.active && h.hd.hitTargets.size) continue;
      this.applyHit(h.a, h.d, h.hd, h.ov, null);
    }
    for (const h of hits) h.hd.active = false;
  }

  applyHit(a, d, hd0, ov, proj) {
    const atkRoot = a.root;
    let hd = hd0;
    hd0.hitTargets.add(d);
    // hit override
    const ovr = d.hitOverride.find(o => o && attrMatches(o.attr, hd.attr));
    let guarded = !ovr && this.isGuarding(d, hd);
    const inAir = d.statetype === 'A';
    const wasHit = d.movetype === 'H';
    // MvC-style launcher
    if (!guarded && !proj && this.comboSystem && atkRoot.rankOf && a === atkRoot && atkRoot.rankOf(a.stateNo) === 'launcher' && !inAir) {
      hd = { ...hd, groundType: 1, airType: 1, p2stateno: null, groundVel: [-1.2, -10.5], airVel: [-1.2, -10.5], fall: 1, airFall: 1, animtype: 4, airAnimtype: 4, fallAnimtype: 4, groundHit: 28, airHit: 28, yaccel: 0.42, fallRecover: 0 };
      atkRoot.combo.launched = true;
    }
    // Uniform rules: same damage scale and minimum hitstun per strength for every character
    const rank = !proj && a === atkRoot && atkRoot.rankOf ? atkRoot.rankOf(a.stateNo) : null;
    let uniScale = 1;
    if (this.uniform && rank && UNIFORM[rank]) {
      const U = UNIFORM[rank];
      const med = atkRoot.def.rankDamage?.[rank];
      if (med) uniScale = Math.max(0.6, Math.min(1.6, U.dmg / med));
      if (!hd.p2stateno) hd = { ...hd, groundHit: Math.max(hd.groundHit, U.stun), groundSlide: Math.max(hd.groundSlide, U.stun - 2), airHit: Math.max(hd.airHit, U.stun + 4), guardHit: Math.max(hd.guardHit, U.block), guardSlide: Math.max(hd.guardSlide, U.block - 2), guardCtrl: Math.max(hd.guardCtrl, U.block - 2), pauseP2: Math.max(hd.pauseP2, U.pause), pauseP1: Math.max(hd.pauseP1, U.pause - 1) };
    }
    // damage
    const statAtk = this.uniform ? 1 : atkRoot.constant('data.attack') / 100;
    const statDef = this.uniform ? 1 : d.root.constant('data.defence') / 100;
    const atkMul = (proj ? proj.attackMul : a.attackMul) * statAtk;
    const defMul = d.defenceMul * statDef;
    let dmg = Math.round((guarded ? hd.guardDamage : hd.damage) * uniScale * atkMul / defMul);
    const combo = this.combos[a.teamSide];
    if (!guarded && wasHit && this.comboSystem && combo.hits >= 2) {
      dmg = Math.round(dmg * Math.max(0.3, 1 - 0.08 * (combo.hits - 1)));
    }
    const kill = guarded ? hd.guardKill : hd.kill;
    if (!guarded && (!wasHit || !combo.hits)) combo.startLife = d.life;
    d.addLife(-dmg, kill);
    if (this.training && this.trainingInfiniteLife && d.life < 1) d.life = 1;
    // gethit vars
    const g = d.ghv;
    const prevFall = wasHit && g.fall;
    const prevHitCount = wasHit ? g.hitcount : 0;
    Object.assign(g, d.blankGHV());
    g.damage = dmg; g.damageTick = this.gameTime; g.guarded = guarded ? 1 : 0;
    g.hitcount = prevHitCount + 1;
    g.attr = hd.attr; g.id = a.playerId; g.playerno = a.teamSide; g.hitid = hd.id; g.chainid = hd.chainid; g.chainidLast = hd.id;
    g.groundtype = hd.groundType; g.airtype = hd.airType;
    g.type = inAir ? hd.airType : hd.groundType;
    g.fall = inAir ? hd.airFall : hd.fall;
    if (prevFall && inAir) g.fall = 1;
    if (d.life <= 0 && !guarded) g.fall = 1;
    g.animtype = inAir ? (g.fall ? hd.fallAnimtype : hd.airAnimtype) : hd.animtype;
    if (inAir && !g.fall) g.animtype = hd.airAnimtype;
    let vx, vy;
    if (guarded) {
      if (inAir) { vx = hd.airGuardVel[0]; vy = hd.airGuardVel[1]; } else { vx = hd.guardVel; vy = 0; }
    } else if (d.statetype === 'L') { vx = hd.downVel[0]; vy = hd.downVel[1]; }
    else if (inAir) { vx = hd.airVel[0]; vy = hd.airVel[1]; }
    else { vx = hd.groundVel[0]; vy = hd.groundVel[1]; }
    // Combo system: normals push back less on the ground so chains connect (uniform across characters)
    if (this.comboSystem && !proj && !inAir && d.statetype !== 'L' && ['light', 'medium', 'heavy'].includes(atkRoot.rankOf?.(a.stateNo))) vx *= 0.45;
    const dirF = proj ? proj.facing : a.facing;
    const worldVx = -vx * dirF;
    // p2facing
    if (hd.p2facing === 1) d.facing = -dirF; else if (hd.p2facing === -1) d.facing = dirF;
    else if (!inAir && !guarded && d.stateOwner === d && d.root === d) { /* keep */ }
    g.xvel = worldVx * d.facing; g.yvel = vy;
    g.yaccel = hd.yaccel;
    g.hittime = guarded ? hd.guardHit : (d.statetype === 'L' ? hd.downHit : inAir ? hd.airHit : hd.groundHit);
    g.slidetime = guarded ? hd.guardSlide : hd.groundSlide;
    g.ctrltime = guarded ? (inAir ? hd.airGuardCtrl : hd.guardCtrl) : 0;
    g['fall.xvel'] = isNaN(hd.fallX) ? NaN : -hd.fallX * dirF * d.facing;
    g['fall.yvel'] = hd.fallY; g['fall.recover'] = hd.fallRecover; g['fall.recovertime'] = hd.fallRecoverTime;
    g['fall.damage'] = hd.fallDamage; g['fall.kill'] = hd.fallKill;
    if (hd.fallEnvshake) [g['fall.envshake.time'], g['fall.envshake.freq'], g['fall.envshake.ampl'], g['fall.envshake.phase']] = hd.fallEnvshake;
    g.hitshaketime = guarded ? hd.guardPauseP2 : hd.pauseP2;
    // pauses
    d.pauseTime = Math.max(0, g.hitshaketime);
    if (!proj) a.pauseTime = Math.max(0, guarded ? hd.guardPauseP1 : hd.pauseP1);
    else proj.pauseTime = Math.max(0, guarded ? hd.guardPauseP1 : hd.pauseP1);
    // attacker bookkeeping
    if (!proj) {
      a.moveContact = 1;
      if (guarded) a.moveGuarded = 1; else { a.moveHit = 1; a.hitCount++; a.uniqHitCount++; }
      if (!a.targets.some(t => t.c === d)) a.targets.push({ c: d, id: hd.id });
      else a.targets.find(t => t.c === d).id = hd.id;
    } else {
      const rec = (atkRoot.projRec ||= { projhit: new Map(), projcontact: new Map(), projguarded: new Map() });
      rec.projcontact.set(proj.id, this.gameTime); rec.projcontact.set(0, this.gameTime);
      (guarded ? rec.projguarded : rec.projhit).set(proj.id, this.gameTime);
      if (!guarded && !a.targets.some(t => t.c === d)) a.targets.push({ c: d, id: hd.id });
    }
    // power
    const isSuper = (hd.attr.types[0] || '')[0] === 'H';
    const gp = hd.getpower ? hd.getpower[guarded ? 1 : 0] : (isSuper ? 0 : Math.round(dmg * (guarded ? 0.35 : 0.7)));
    const gv = hd.givepower ? hd.givepower[guarded ? 1 : 0] : Math.round(dmg * 0.6);
    atkRoot.addPower(gp); d.addPower(gv);
    // state changes
    d.ctrl = 0;
    d.gotHitThisTick = true;
    if (d.root === d) d.root.gotHitThisTick = true;
    if (hd.p1getp2facing) a.facing = hd.p1getp2facing > 0 ? d.facing : -d.facing;
    if (hd.p1facing < 0 && !proj) a.facing = -a.facing;
    if (ovr) {
      d.changeState(ovr.stateno);
      if (ovr.forceair) d.statetype = 'A';
    } else if (!guarded && hd.p2stateno != null) {
      d.changeState(hd.p2stateno, undefined, undefined, hd.p2getp1state ? a.root : d);
    } else if (guarded) {
      d.stateOwner = d;
      d.changeState(d.statetype === 'C' ? 152 : d.statetype === 'A' ? 154 : 150);
    } else {
      d.stateOwner = d;
      let st;
      if (d.statetype === 'L') st = 5080;
      else if (inAir) st = 5020;
      else if (hd.groundType === 3) st = 5070;
      else if (d.statetype === 'C' && !hd.forcestand) st = 5010;
      else st = 5000;
      d.changeState(st);
    }
    d.movetype = 'H';
    if (!proj && hd.p1stateno != null) a.changeState(hd.p1stateno);
    if (!proj) { a.sprPriority = hd.p1spr; }
    d.sprPriority = hd.p2spr;
    if (hd.palfx && !guarded) d.palfx = { ...hd.palfx, t: 0 };
    if (hd.envshake && !guarded) this.envShake(...hd.envshake);
    // spark + sound
    const sp = guarded ? hd.guardSpark : hd.spark;
    if (sp && sp.no >= 0) {
      const fromOwn = sp.own;
      const sx = d.pos.x - dirF * d.frontWidth() * 0 + dirF * hd.sparkxy[0];
      const sxx = ov ? (dirF > 0 ? ov[0] : ov[2]) : d.pos.x;
      const sy = (proj ? proj.pos.y : a.pos.y) + hd.sparkxy[1];
      const bank = fromOwn ? atkRoot.def : this.fx;
      if (bank.anims.has(sp.no)) this.spawnFXAnim(bank, sp.no, (ov ? sxx + dirF * hd.sparkxy[0] * 0.25 : sx), sy, dirF, { ontop: true, owner: fromOwn ? atkRoot : null, ownpal: fromOwn, spark: true });
    }
    const snd = guarded ? hd.guardsound : hd.hitsound;
    if (snd) audio.play(snd.own ? atkRoot.def.snd : this.fx.snd, snd.g, snd.n, { owner: d.root === d ? null : null });
    // combo tracking
    if (!guarded) {
      const cb = this.combos[a.teamSide];
      if (!wasHit || !cb.hits) { cb.hits = 0; }
      cb.hits++; cb.show = 90; cb.last = this.gameTime; cb.victim = d;
      cb.dmg = Math.max(0, (cb.startLife ?? d.life) - d.life);
      d.combo.recv = (wasHit ? d.combo.recv || 0 : 0) + dmg;
      d.combo.recvHits = (wasHit ? d.combo.recvHits || 0 : 0) + 1;
    }
    this.lastHit = { a, d, guarded };
  }
  addComboHits(c, n) { const cb = this.combos[c.teamSide]; cb.hits += n; cb.show = 90; }
  addComboDamage(c, n) {
    const cb = this.combos[c.teamSide];
    const v = c.teamSide === 1 ? this.p2 : this.p1;
    if (cb.hits) cb.dmg = Math.max(0, (cb.startLife ?? v.life) - v.life);
  }
  updateCombos() {
    for (const side of [1, 2]) {
      const cb = this.combos[side];
      const victim = side === 1 ? this.p2 : this.p1;
      if (cb.hits) cb.dmg = Math.max(cb.dmg, (cb.startLife ?? victim.life) - victim.life);
      if (cb.hits && victim.movetype !== 'H' && victim.stateOwner === victim) {
        if (cb.hits >= 2) cb.final = { hits: cb.hits, dmg: cb.dmg, t: 100 };
        cb.hits = 0; cb.dmg = 0;
        if (this.training && this.trainingInfiniteLife) { victim.life = victim.lifeMax; }
      }
      if (cb.final && --cb.final.t <= 0) cb.final = null;
    }
    for (const c of this.roots) if (c.movetype !== 'A') { c.combo.chain = 0; }
    if (this.training) {
      for (const c of this.roots) if (this.trainingPower) c.power = c.powerMax;
    }
  }

  pushPlayers() {
    const [a, b] = this.roots;
    for (const e of this.entities) {
      if (e.destroyed || e.isHelper) continue;
      // stage + screen bounds
      const fw = e.frontWidth(), bw = e.backWidth();
      const leftW = e.facing > 0 ? bw : fw, rightW = e.facing > 0 ? fw : bw;
      if (e.screenbound) {
        e.pos.x = Math.max(this.camLeft() + leftW, Math.min(this.camRight() - rightW, e.pos.x));
      }
      e.pos.x = Math.max(this.stageLeft + leftW, Math.min(this.stageRight - rightW, e.pos.x));
    }
    if (a.pushable && b.pushable && a.stateOwner === a && b.stateOwner === b && !a.bindTo && !b.bindTo) {
      const ah = a.root.def.consts['size.height'] || 60, bh = b.root.def.consts['size.height'] || 60;
      const vertical = a.pos.y - ah < b.pos.y && b.pos.y - bh < a.pos.y;
      if (vertical) {
        const aR = a.facing > 0 ? a.frontWidth() : a.backWidth(), aL = a.facing > 0 ? a.backWidth() : a.frontWidth();
        const bR = b.facing > 0 ? b.frontWidth() : b.backWidth(), bL = b.facing > 0 ? b.backWidth() : b.frontWidth();
        let left = a, right = b, lR = aR, rL = bL;
        if (a.pos.x > b.pos.x || (a.pos.x === b.pos.x && a.facing < 0)) { left = b; right = a; lR = bR; rL = aL; }
        const overlap = (left.pos.x + lR) - (right.pos.x - rL);
        if (overlap > 0) {
          let pl = overlap / 2, pr = overlap / 2;
          const lw = this.camLeft() + 8, rw = this.camRight() - 8;
          if (left.pos.x - pl < Math.max(this.stageLeft, lw)) { pr += pl; pl = 0; }
          if (right.pos.x + pr > Math.min(this.stageRight, rw)) { pl += pr; pr = 0; }
          left.pos.x -= pl; right.pos.x += pr;
        }
      }
    }
    // auto-turn
    for (const c of this.roots) {
      const e = c.p2();
      if (!e || c.stateOwner !== c) continue;
      if (c.ctrl && c.movetype === 'I' && (c.statetype === 'S' || c.statetype === 'C') && ![120, 130, 131].includes(c.stateNo) && c.pauseTime <= 0) {
        if (c.distX(e) < -0.5 && !c.assert.has('noautoturn')) {
          c.facing = -c.facing;
          if (c.stateNo === 0 || c.stateNo === 20) c.changeAnim(c.def.anims.has(5) ? 5 : 0);
          else if (c.stateNo === 11) c.changeAnim(c.def.anims.has(6) ? 6 : 11);
        }
      }
    }
  }

  // ---------------- effects ----------------
  envShake(time, freq = 60, ampl = -4, phase = 0) { if (time > 0) this.shake = { time, freq, ampl, phase, t: 0 }; }
  startPause(p) { this.pause = { ...p, time: Math.max(1, p.time) }; if (p.isSuper) this.superFlash = 12; }

  spawnFXAnim(bank, animNo, x, y, facing, o = {}) {
    const a = bank.anims.get(animNo);
    if (!a) return null;
    const ex = new Explod();
    ex.bank = bank; ex.anim.set(a, bank);
    ex.pos = { x, y }; ex.vel = { x: 0, y: 0 }; ex.accel = { x: 0, y: 0 };
    ex.facing = facing; ex.vfacing = 1;
    ex.removetime = -2; ex.bindtime = 0; ex.id = -1; ex.owner = o.owner || null;
    ex.sprpriority = 5; ex.ontop = !!o.ontop; ex.scale = [1, 1];
    ex.supermove = o.supermove ? 9999 : 0; ex.pausemove = 0;
    ex.ownpal = !!o.ownpal; ex.spark = !!o.spark;
    ex.trans = null; ex.ignorehitpause = true;
    this.explods.push(ex);
    return ex;
  }
  spawnSimpleAnim(c, ct, cc) {
    const ar = animRef(ct, 'value', cc) || { pre: 'f', no: 0 };
    const own = ar.pre === 's';
    this.spawnFXAnim(own ? c.root.def : this.fx, ar.no, c.pos.x + P(ct, 'pos', cc, 0) * c.facing, c.pos.y + P(ct, 'pos', cc, 1), c.facing, { owner: c, ownpal: own, ontop: !H(ct, 'under') || !P(ct, 'under', cc) });
  }
  spawnExplod(c, ct, cc) {
    const ar = animRef(ct, 'anim', cc);
    if (!ar) return;
    const fromFX = ar.pre === 'f';
    const bank = fromFX ? this.fx : c.root.def;
    const a = bank.anims.get(ar.no);
    const ex = new Explod();
    ex.bank = bank;
    ex.anim.set(a || null, bank);
    ex.animNo = ar.no;
    ex.owner = c;
    ex.id = H(ct, 'id') ? P(ct, 'id', cc) : -1;
    const postype = S(ct, 'postype', 'p1');
    ex.postype = postype;
    const ref = this.posTypeRef(c, postype);
    const fpar = H(ct, 'facing') ? P(ct, 'facing', cc) : 1;
    ex.facing = (postype === 'left' || postype === 'right') ? (fpar < 0 ? -1 : 1) : ref.facing * (fpar < 0 ? -1 : 1);
    ex.vfacing = H(ct, 'vfacing') && P(ct, 'vfacing', cc) < 0 ? -1 : 1;
    let ox = P(ct, 'pos', cc, 0), oy = P(ct, 'pos', cc, 1);
    if (H(ct, 'random')) { const rx = P(ct, 'random', cc, 0), ry = P(ct, 'random', cc, 1); ox += (Math.random() - 0.5) * rx; oy += (Math.random() - 0.5) * ry; }
    ex.off = { x: ox, y: oy };
    ex.screen = ref.screen;
    const dirx = (postype === 'left' || postype === 'right') ? 1 : ref.facing;
    ex.dirx = dirx;
    ex.pos = { x: ref.x + ox * dirx, y: ref.y + oy };
    if (ex.screen) ex.scr = { x: ex.pos.x - this.camX, y: ex.pos.y - this.camY };
    ex.vel = { x: P(ct, 'vel', cc, 0), y: P(ct, 'vel', cc, 1) };
    ex.accel = { x: P(ct, 'accel', cc, 0), y: P(ct, 'accel', cc, 1) };
    ex.bindtime = H(ct, 'bindtime') ? P(ct, 'bindtime', cc) : 0;
    ex.bindTarget = postype === 'p2' ? c.p2() : c;
    ex.removetime = H(ct, 'removetime') ? P(ct, 'removetime', cc) : -2;
    ex.supermove = H(ct, 'supermovetime') ? P(ct, 'supermovetime', cc) : 0;
    ex.pausemove = H(ct, 'pausemovetime') ? P(ct, 'pausemovetime', cc) : 0;
    ex.scale = [H(ct, 'scale') ? P(ct, 'scale', cc, 0, 1) : 1, H(ct, 'scale') ? P(ct, 'scale', cc, 1, 1) : 1];
    ex.sprpriority = P(ct, 'sprpriority', cc);
    ex.ontop = !!P(ct, 'ontop', cc);
    ex.under = !!P(ct, 'under', cc);
    ex.ownpal = H(ct, 'ownpal') ? !!P(ct, 'ownpal', cc) : false;
    ex.removeongethit = !!P(ct, 'removeongethit', cc);
    ex.ignorehitpause = H(ct, 'ignorehitpause') ? !!P(ct, 'ignorehitpause', cc) : true;
    ex.angle = P(ct, 'angle', cc);
    const tr = S(ct, 'trans');
    ex.trans = tr && tr !== 'default' ? { mode: tr, src: P(ct, 'alpha', cc, 0, 256), dst: P(ct, 'alpha', cc, 1, 0) } : null;
    ex.shadow = H(ct, 'shadow');
    ex.time = 0;
    this.explods.push(ex);
    if (this.explods.length > 400) this.explods.shift();
  }
  modifyExplod(c, ct, cc) {
    const id = H(ct, 'id') ? P(ct, 'id', cc) : -1;
    for (const ex of this.explods) {
      if (ex.owner !== c || (id !== -1 && ex.id !== id)) continue;
      if (H(ct, 'pos')) { ex.off = { x: P(ct, 'pos', cc, 0), y: P(ct, 'pos', cc, 1) }; if (!ex.bindtime) { const ref = this.posTypeRef(c, ex.postype); ex.pos = { x: ref.x + ex.off.x * ex.dirx, y: ref.y + ex.off.y }; } }
      if (H(ct, 'vel')) ex.vel = { x: P(ct, 'vel', cc, 0), y: P(ct, 'vel', cc, 1) };
      if (H(ct, 'accel')) ex.accel = { x: P(ct, 'accel', cc, 0), y: P(ct, 'accel', cc, 1) };
      if (H(ct, 'scale')) ex.scale = [P(ct, 'scale', cc, 0, 1), P(ct, 'scale', cc, 1, 1)];
      if (H(ct, 'sprpriority')) ex.sprpriority = P(ct, 'sprpriority', cc);
      if (H(ct, 'removetime')) ex.removetime = P(ct, 'removetime', cc);
      if (H(ct, 'bindtime')) ex.bindtime = P(ct, 'bindtime', cc);
      if (H(ct, 'angle')) ex.angle = P(ct, 'angle', cc);
      if (H(ct, 'facing')) ex.facing = c.facing * (P(ct, 'facing', cc) < 0 ? -1 : 1);
      if (H(ct, 'trans')) { const tr = S(ct, 'trans'); ex.trans = { mode: tr, src: P(ct, 'alpha', cc, 0, 256), dst: P(ct, 'alpha', cc, 1, 0) }; }
      if (H(ct, 'alpha') && ex.trans) { ex.trans.src = P(ct, 'alpha', cc, 0, 256); ex.trans.dst = P(ct, 'alpha', cc, 1, 0); }
      if (H(ct, 'anim')) { const ar = animRef(ct, 'anim', cc); const bank = ar.pre === 'f' ? this.fx : c.root.def; ex.bank = bank; ex.anim.set(bank.anims.get(ar.no) || null, bank); }
      if (H(ct, 'ontop')) ex.ontop = !!P(ct, 'ontop', cc);
    }
  }
  removeExplods(c, id, all = false) {
    this.explods = this.explods.filter(ex => !(ex.owner === c && (id === -1 || ex.id === id)));
  }
  countExplods(c, id) { let n = 0; for (const ex of this.explods) if (ex.owner === c && (id === -1 || ex.id === id)) n++; return n; }

  updateExplods(pause) {
    const keep = [];
    for (const ex of this.explods) {
      const o = ex.owner;
      let frozen = false;
      if (pause) {
        if (ex.spark && !pause.isSuper) frozen = false;
        else if (pause.isSuper ? ex.supermove > 0 : ex.pausemove > 0) { if (pause.isSuper) ex.supermove--; else ex.pausemove--; }
        else if (o && o === pause.owner && pause.movetime > 0) frozen = false;
        else frozen = true;
      }
      if (!frozen && o && !ex.ignorehitpause && o.pauseTime > 0) frozen = true;
      if (o && ex.removeongethit && o.gotHitThisTick) continue;
      if (o && o.destroyed && ex.bindtime !== 0) ex.bindtime = 0;
      if (frozen) { keep.push(ex); continue; }
      ex.time = (ex.time || 0) + 1;
      if (ex.bindtime !== 0 && ex.bindTarget && !ex.screen) {
        const b = ex.bindTarget;
        ex.pos.x = b.pos.x + ex.off.x * (ex.postype === 'p2' ? o.facing : b.facing);
        ex.pos.y = b.pos.y + ex.off.y;
        if (ex.bindtime > 0) ex.bindtime--;
      } else if (ex.screen && ex.bindtime !== 0) {
        ex.scr.x += ex.vel.x * ex.facing; ex.scr.y += ex.vel.y;
        ex.pos.x = this.camX + ex.scr.x; ex.pos.y = this.camY + ex.scr.y;
        ex.vel.x += ex.accel.x; ex.vel.y += ex.accel.y;
        if (ex.bindtime > 0) ex.bindtime--;
      } else {
        ex.pos.x += ex.vel.x * ex.facing; ex.pos.y += ex.vel.y;
        ex.vel.x += ex.accel.x; ex.vel.y += ex.accel.y;
      }
      const loopsBefore = ex.anim.loops;
      ex.anim.step();
      if (ex.removetime > 0) { ex.removetime--; if (ex.removetime === 0) continue; }
      else if (ex.removetime === -2) {
        if (!ex.anim.anim || ex.anim.loops > loopsBefore || ex.anim.loops > 0) continue;
      } else if (ex.removetime === 0) continue;
      keep.push(ex);
    }
    this.explods = keep;
  }

  // ---------------- projectiles ----------------
  spawnProjectile(c, ct, cc) {
    const before = c.hitdef;
    c.setHitDef(ct, cc);
    const hd = c.hitdef;
    c.hitdef = before;
    const p = new Explod();
    p.owner = c; p.hd = hd; p.facing = c.facing;
    p.id = H(ct, 'projid') ? P(ct, 'projid', cc) : 0;
    p.bank = c.root.def;
    const ar = animRef(ct, 'projanim', cc) || { no: 0 };
    p.anim.set(c.root.def.anims.get(ar.no) || null, c.root.def);
    p.hitAnim = H(ct, 'projhitanim') ? P(ct, 'projhitanim', cc) : -1;
    p.remAnim = H(ct, 'projremanim') ? P(ct, 'projremanim', cc) : p.hitAnim;
    p.cancelAnim = H(ct, 'projcancelanim') ? P(ct, 'projcancelanim', cc) : p.remAnim;
    p.scale = [H(ct, 'projscale') ? P(ct, 'projscale', cc, 0, 1) : 1, H(ct, 'projscale') ? P(ct, 'projscale', cc, 1, 1) : 1];
    p.remove = H(ct, 'projremove') ? !!P(ct, 'projremove', cc) : true;
    p.removetime = H(ct, 'projremovetime') ? P(ct, 'projremovetime', cc) : -1;
    p.vel = { x: P(ct, 'velocity', cc, 0), y: P(ct, 'velocity', cc, 1) };
    p.remvel = { x: P(ct, 'remvelocity', cc, 0), y: P(ct, 'remvelocity', cc, 1) };
    p.accel = { x: P(ct, 'accel', cc, 0), y: P(ct, 'accel', cc, 1) };
    p.velmul = [H(ct, 'velmul') ? P(ct, 'velmul', cc, 0, 1) : 1, H(ct, 'velmul') ? P(ct, 'velmul', cc, 1, 1) : 1];
    p.hits = H(ct, 'projhits') ? P(ct, 'projhits', cc) : 1;
    p.misstime = H(ct, 'projmisstime') ? P(ct, 'projmisstime', cc) : 0;
    p.priority = H(ct, 'projpriority') ? P(ct, 'projpriority', cc) : 1;
    p.sprpriority = H(ct, 'projsprpriority') ? P(ct, 'projsprpriority', cc) : 3;
    p.edgebound = H(ct, 'projedgebound') ? P(ct, 'projedgebound', cc) : 40;
    p.stagebound = H(ct, 'projstagebound') ? P(ct, 'projstagebound', cc) : 40;
    p.heightbound = [H(ct, 'projheightbound') ? P(ct, 'projheightbound', cc, 0) : -240, H(ct, 'projheightbound') ? P(ct, 'projheightbound', cc, 1, 1) : 1];
    const postype = S(ct, 'postype', 'p1');
    const ref = this.posTypeRef(c, postype);
    p.pos = { x: ref.x + P(ct, 'offset', cc, 0) * c.facing, y: ref.y + P(ct, 'offset', cc, 1) };
    p.attackMul = c.attackMul;
    p.teamSide = c.teamSide;
    p.state = 'fly'; p.missT = 0; p.pauseTime = 0;
    p.sprpriority ??= 3;
    this.projs.push(p);
  }
  countProj(c, id) { let n = 0; for (const p of this.projs) if (p.owner.root === c.root && p.state === 'fly' && (id === -1 || p.id === id)) n++; return n; }
  updateProjectiles() {
    const keep = [];
    for (const p of this.projs) {
      if (p.pauseTime > 0) { p.pauseTime--; keep.push(p); continue; }
      if (p.state === 'fly') {
        p.pos.x += p.vel.x * p.facing; p.pos.y += p.vel.y;
        p.vel.x = p.vel.x * p.velmul[0] + p.accel.x; p.vel.y = p.vel.y * p.velmul[1] + p.accel.y;
        if (p.missT > 0) p.missT--;
        // collisions
        if (p.missT <= 0) {
          const c1 = this.projBoxes(p, 1);
          if (c1) for (const d of this.entities) {
            if (d.teamSide === p.teamSide || d.destroyed) continue;
            p.hd.hitTargets = new Set();
            if (!this.canBeHit(p.owner, d, p.hd)) continue;
            const c2 = this.boxes(d, 2); if (!c2) continue;
            const ov = this.overlap(c1, c2); if (!ov) continue;
            this.applyHit(p.owner, d, p.hd, ov, p);
            p.hits--; p.missT = p.misstime;
            if (p.hits <= 0) { this.endProj(p, p.hitAnim); }
            break;
          }
          // projectile vs projectile
          for (const q of this.projs) {
            if (q === p || q.teamSide === p.teamSide || q.state !== 'fly' || p.state !== 'fly') continue;
            const qa = this.projBoxes(q, 1); if (!qa || !c1) continue;
            if (this.overlap(c1, qa)) {
              if (p.priority <= q.priority) this.endProj(p, p.cancelAnim);
              if (q.priority <= p.priority) this.endProj(q, q.cancelAnim);
            }
          }
        }
        if (p.removetime > 0 && --p.removetime === 0) this.endProj(p, p.remAnim);
        const cl = this.camLeft() - p.edgebound, cr = this.camRight() + p.edgebound;
        if (p.pos.x < cl || p.pos.x > cr || p.pos.x < this.stageLeft - p.stagebound || p.pos.x > this.stageRight + p.stagebound || p.pos.y < p.heightbound[0] || p.pos.y > p.heightbound[1] + 40) { p.state = 'dead'; }
      } else if (p.state === 'ending') {
        p.pos.x += p.remvel.x * p.facing; p.pos.y += p.remvel.y;
      }
      const lb = p.anim.loops;
      p.anim.step();
      if (p.state === 'ending' && (p.anim.loops > lb || !p.anim.anim)) p.state = 'dead';
      if (p.state !== 'dead') keep.push(p);
    }
    this.projs = keep;
  }
  endProj(p, animNo) {
    const rec = (p.owner.root.projRec ||= { projhit: new Map(), projcontact: new Map(), projguarded: new Map() });
    if (!p.remove && p.state === 'fly' && p.hits > 0) return;
    const a = animNo >= 0 ? p.bank.anims.get(animNo) : null;
    if (a) { p.anim.set(a, p.bank); p.state = 'ending'; } else p.state = 'dead';
  }
  projBoxes(p, kind) {
    const f = p.anim.frame(); if (!f) return null;
    const list = kind === 1 ? (f.clsn1 || f.clsn2) : f.clsn2;
    if (!list || !list.length) return null;
    return list.map(([x1, y1, x2, y2]) => (p.facing > 0 ? [p.pos.x + x1 * p.scale[0], p.pos.y + y1 * p.scale[1], p.pos.x + x2 * p.scale[0], p.pos.y + y2 * p.scale[1]] : [p.pos.x - x2 * p.scale[0], p.pos.y + y1 * p.scale[1], p.pos.x - x1 * p.scale[0], p.pos.y + y2 * p.scale[1]]));
  }

  // ---------------- camera ----------------
  updateCamera() {
    const [a, b] = this.roots;
    let tx = (a.pos.x + b.pos.x) / 2;
    const half = this.viewW / 2;
    tx = Math.max(this.stageLeft + half, Math.min(this.stageRight - half, tx));
    this.camX += (tx - this.camX) * 0.25;
    if (Math.abs(tx - this.camX) < 0.05) this.camX = tx;
    const top = Math.min(a.pos.y, b.pos.y);
    const ty = Math.min(0, (top + 110) * 0.6);
    this.camY += (Math.max(-110, ty) - this.camY) * 0.15;
  }

  // ---------------- rendering ----------------
  toScreen(x, y) { return [x - this.camX + this.viewW / 2, y - this.camY + this.groundY]; }

  draw(g, stageDraw) {
    const W = this.viewW, Hh = this.viewH;
    g.save();
    let shx = 0, shy = 0;
    if (this.shake) {
      const s = this.shake;
      shy = s.ampl * Math.cos((s.t * s.freq / 180 * Math.PI) + s.phase) * (1 - s.t / s.time) * 0.6;
    }
    g.translate(shx, shy);
    if (!this.globalAssert.has('nobg')) stageDraw(g, this);
    if (this.envColor && this.envColor.under) { g.fillStyle = `rgb(${this.envColor.color.join(',')})`; g.fillRect(-10, -10, W + 20, Hh + 20); }
    // darken for super pause
    const darken = this.pause && this.pause.darken;
    if (darken) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-10, -10, W + 20, Hh + 20); }
    // shadows
    if (!this.globalAssert.has('globalnoshadow')) for (const e of this.entities) if (!e.assert.has('noshadow') && !e.assert.has('invisible')) this.drawShadow(g, e);
    // sorted sprites
    const items = [];
    for (const e of this.entities) if (!e.assert.has('invisible')) items.push({ pr: e.sprPriority, k: 0, e });
    for (const ex of this.explods) items.push({ pr: ex.ontop ? 1000 : ex.under ? -1000 : ex.sprpriority, k: 1, ex });
    for (const p of this.projs) items.push({ pr: p.sprpriority, k: 2, p });
    items.sort((x, y) => x.pr - y.pr || x.k - y.k);
    for (const it of items) {
      if (it.k === 0) this.drawChar(g, it.e);
      else if (it.k === 1) this.drawExplod(g, it.ex);
      else this.drawProj(g, it.p);
    }
    if (this.showBoxes) this.drawBoxes(g);
    if (this.envColor && !this.envColor.under) { g.fillStyle = `rgb(${this.envColor.color.join(',')})`; g.fillRect(-10, -10, W + 20, Hh + 20); }
    g.restore();
  }

  palFor(e, owner) {
    // owner: CharDef the frame comes from
    if (owner === e.root.def || owner === e.def) return { pal: e.root.pal, key: e.root.palKey };
    if (owner === this.fx) return { pal: this.fx.sff.defaultPal, key: 'fx' };
    return { pal: owner.palettes?.[0]?.pal || owner.sff.defaultPal, key: (owner.folder || 'o') + ':0' };
  }

  blit(g, owner, f, palInfo, x, y, facing, o = {}) {
    if (!f || !owner) return;
    const spr = getSprite(owner.sff, f.g, f.n);
    if (!spr) return;
    const pal = palInfo.pal || owner.sff.defaultPal;
    const cv = spriteCanvas(spr, pal, palInfo.key);
    if (!cv) return;
    const xs = (o.xs ?? 1) * (f.xs || 1), ys = (o.ys ?? 1) * (f.ys || 1);
    const flipH = (facing < 0) !== f.hflip;
    const flipV = (o.vfacing < 0) !== f.vflip;
    const [sx, sy] = this.toScreen(x, y);
    g.save();
    g.translate(sx + (f.x * facing) * (o.xs ?? 1), sy + f.y * (o.ys ?? 1) * (o.vfacing < 0 ? -1 : 1));
    if (o.angle) g.rotate((-o.angle * Math.PI / 180) * (facing < 0 ? -1 : 1));
    if (f.angle) g.rotate((-f.angle * Math.PI / 180) * (facing < 0 ? -1 : 1));
    g.scale(flipH ? -xs : xs, flipV ? -ys : ys);
    const tr = o.trans || f.trans;
    if (tr) {
      const m = tr.mode;
      if (m === 'add' || m === 'add1' || m === 'addalpha') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, (tr.src ?? 256) / 256); }
      else if (m === 'sub') { g.globalCompositeOperation = 'difference'; }
      else if (m === 'alpha' || m === 'none' && false) { g.globalAlpha = Math.min(1, (tr.src ?? 256) / 256); }
      if (m === 'add1') g.globalAlpha = 0.5;
      if (m === 'addalpha') g.globalAlpha = Math.min(1, (tr.src ?? 256) / 256);
    }
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    let img = cv;
    const fx = o.palfx;
    if (fx) img = tintCanvas(cv, fx);
    g.drawImage(img, -spr.x, -spr.y);
    g.restore();
  }

  drawChar(g, e) {
    const f = e.anim.frame();
    if (!f) return;
    // Animation data may come from another character (ChangeAnim2), but sprites are always our own.
    const owner = e.root.def;
    const pi = this.palFor(e, owner);
    const xs = e.root.def.consts['size.xscale'] || 1, ys = e.root.def.consts['size.yscale'] || 1;
    // afterimages
    if (e.afterHist.length && e.afterimage) {
      const ai = e.afterimage;
      for (let i = e.afterHist.length - 1; i >= 1; i--) {
        if (i % ai.gap) continue;
        const h = e.afterHist[i];
        const alpha = 0.55 * (1 - i / e.afterHist.length);
        this.blit(g, owner, h.f, pi, h.x, h.y, h.facing, { xs, ys, alpha, trans: { mode: 'add', src: 256 }, palfx: { add: ai.add.map(v => v), mul: [256 * ai.mul[0], 256 * ai.mul[1], 256 * ai.mul[2]], t: 0, sinadd: [0, 0, 0, 1], color: ai.palcolor } });
      }
    }
    const palfx = mergePalFX(e.palfx, this.allPalFX);
    const tr = e.transOverride && e.transOverride.mode !== 'none' && e.transOverride.mode !== 'default' ? e.transOverride : (e.transOverride && e.transOverride.mode === 'none' ? null : undefined);
    this.blit(g, owner, f, pi, e.pos.x + e.drawOffset.x * e.facing, e.pos.y + e.drawOffset.y, e.facing, {
      xs: xs * (e.angleDrawThisTick ? e.angleScale[0] : 1), ys: ys * (e.angleDrawThisTick ? e.angleScale[1] : 1),
      angle: e.angleDrawThisTick ? e.angle : 0, trans: tr === undefined ? null : tr, palfx,
    });
  }
  drawShadow(g, e) {
    const f = e.anim.frame(); if (!f) return;
    const owner = e.root.def;
    const spr = getSprite(owner.sff, f.g, f.n); if (!spr) return;
    const cv = spriteCanvas(spr, e.root.pal || owner.sff.defaultPal, (owner === e.root.def ? e.root.palKey : 'o'));
    if (!cv) return;
    const sh = shadowCanvas(cv);
    const [sx, sy] = this.toScreen(e.pos.x, 0);
    const xs = e.root.def.consts['size.xscale'] || 1;
    const lift = Math.min(1, Math.max(0.25, 1 + e.pos.y / 200));
    g.save();
    g.globalAlpha = 0.32 * lift;
    g.translate(sx + f.x * e.facing, sy + (this.stage?.shadowY || 0));
    g.scale(((e.facing < 0) !== f.hflip ? -1 : 1) * xs, -0.28);
    g.drawImage(sh, -spr.x, -spr.y + f.y);
    g.restore();
  }
  drawExplod(g, ex) {
    const f = ex.anim.frame(); if (!f) return;
    const owner = ex.bank;
    const pi = owner === this.fx ? { pal: this.fx.sff.defaultPal, key: 'fx' } : ex.owner ? this.palFor(ex.owner, owner) : { pal: owner.palettes?.[0]?.pal, key: 'x' };
    const xs = owner === this.fx ? 1 : (owner.consts?.['size.xscale'] || 1);
    this.blit(g, owner, f, pi, ex.pos.x, ex.pos.y, ex.facing, { xs: ex.scale[0] * xs, ys: ex.scale[1] * xs, vfacing: ex.vfacing, trans: ex.trans && ex.trans.mode !== 'none' ? ex.trans : null, angle: ex.angle || 0, palfx: ex.owner && !ex.ownpal ? mergePalFX(ex.owner.palfx, this.allPalFX) : this.allPalFX });
  }
  drawProj(g, p) {
    const f = p.anim.frame(); if (!f) return;
    this.blit(g, p.bank, f, this.palFor(p.owner, p.bank), p.pos.x, p.pos.y, p.facing, { xs: p.scale[0], ys: p.scale[1] });
  }
  drawBoxes(g) {
    const draw = (bs, col) => {
      if (!bs) return;
      g.strokeStyle = col; g.lineWidth = 1;
      for (const b of bs) { const [x1, y1] = this.toScreen(b[0], b[1]); const [x2, y2] = this.toScreen(b[2], b[3]); g.fillStyle = col.replace('1)', '0.18)'); g.fillRect(x1, y1, x2 - x1, y2 - y1); g.strokeRect(x1 + 0.5, y1 + 0.5, x2 - x1 - 1, y2 - y1 - 1); }
    };
    for (const e of this.entities) {
      draw(this.boxes(e, 2), 'rgba(60,140,255,1)');
      if (e.hitdef && e.hitdef.active) draw(this.boxes(e, 1), 'rgba(255,60,60,1)');
      else draw(this.boxes(e, 1), 'rgba(255,200,60,1)');
      const [ax, ay] = this.toScreen(e.pos.x, e.pos.y);
      g.fillStyle = '#fff'; g.fillRect(ax - 2, ay, 5, 1); g.fillRect(ax, ay - 2, 1, 5);
    }
    for (const p of this.projs) draw(this.projBoxes(p, 1), 'rgba(255,60,60,1)');
  }
}

function attrMatches(slotAttr, hitAttr) {
  const sl = (slotAttr || '').toUpperCase().split(',').map(t => t.trim());
  const st = hitAttr.st;
  if (!st.split('').some(ch => (sl[0] || '').includes(ch))) return false;
  const types = sl.slice(1).filter(Boolean);
  if (!types.length) return true;
  const ht = hitAttr.types[0] || 'NA';
  return types.some(t => (t[0] === 'A' || t[0] === ht[0]) && (t[1] === 'A' || t[1] === ht[1]));
}

function dirKey(bits) {
  const u = bits & DIR.U, d = bits & DIR.D, f = bits & DIR.F, b = bits & DIR.B;
  if (d && f) return 'DF'; if (d && b) return 'DB'; if (u && f) return 'UF'; if (u && b) return 'UB';
  if (d) return 'D'; if (u) return 'U'; if (f) return 'F'; if (b) return 'B';
  return 'N';
}
function pickEasy(table, key) {
  if (!table) return null;
  if (table[key]) return table[key];
  const fb = { UF: ['U', 'F'], UB: ['U', 'B'], DF: ['D', 'F'], DB: ['D', 'B'] }[key] || [];
  for (const k of fb) if (table[k]) return table[k];
  return table.N || null;
}
function pickBtn() { return [BTN.x, BTN.y, BTN.z][Math.floor(Math.random() * 3)]; }

function mergePalFX(a, b) {
  if (!a && !b) return null;
  if (!a) return b; if (!b) return a;
  return { add: a.add.map((v, i) => v + b.add[i]), mul: a.mul.map((v, i) => (v * b.mul[i]) / 256), sinadd: a.sinadd, t: a.t, invert: a.invert || b.invert, color: Math.min(a.color, b.color) };
}

let tintC = null;
function tintCanvas(src, fx) {
  if (!tintC) tintC = document.createElement('canvas');
  const c = tintC; c.width = src.width; c.height = src.height;
  const g = c.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, c.width, c.height);
  let filt = '';
  if (fx.color != null && fx.color < 256) filt += `saturate(${Math.max(0, fx.color / 256)}) `;
  if (fx.invert) filt += 'invert(1) ';
  g.filter = filt || 'none';
  g.drawImage(src, 0, 0);
  g.filter = 'none';
  let add = fx.add.slice();
  if (fx.sinadd && fx.sinadd[3]) { const s = Math.sin(2 * Math.PI * (fx.t || 0) / fx.sinadd[3]); add = add.map((v, i) => v + fx.sinadd[i] * s); }
  const mul = fx.mul;
  if (mul.some(v => v !== 256)) {
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = `rgb(${mul.map(v => Math.max(0, Math.min(255, v))).join(',')})`;
    g.fillRect(0, 0, c.width, c.height);
    const bright = mul.map(v => Math.max(0, v - 256));
    if (bright.some(v => v > 0)) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgb(${bright.map(v => Math.min(255, v * 0.6)).join(',')})`; g.fillRect(0, 0, c.width, c.height); }
  }
  if (add.some(v => v > 0)) {
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgb(${add.map(v => Math.max(0, Math.min(255, v))).join(',')})`;
    g.fillRect(0, 0, c.width, c.height);
  }
  if (add.some(v => v < 0)) {
    g.globalCompositeOperation = 'difference';
  }
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-over';
  return c;
}

const shadowCache = new WeakMap();
function shadowCanvas(cv) {
  let s = shadowCache.get(cv);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = cv.width; s.height = cv.height;
  const g = s.getContext('2d');
  g.drawImage(cv, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#000';
  g.fillRect(0, 0, s.width, s.height);
  shadowCache.set(cv, s);
  return s;
}
