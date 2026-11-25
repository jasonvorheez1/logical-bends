// FIGHTWIRE — app shell: boot, menus, select, VS, fight HUD, results.
import { CharDef, loadFightFX } from './chardef.js';
import { Fight, VIEW_W, VIEW_H } from './fight.js';
import { makeStages } from './stages.js';
import { MenuInput, keyboard, BTN, KEYMAPS } from './input.js';
import { audio, parseSND } from './audio.js';
import { AnimPlayer } from './air.js';
import { spriteCanvas, getSprite } from './sff.js';
import { fetchText, fetchBytes } from './util.js';

const C = { bg: '#171413', ink: '#fff1d9', y: '#ffbd68', r: '#ff593a', b: '#3ad6ff', dim: '#b6afa2', panel: '#292322' };
const FONT = (px, w = 900) => `italic ${w} ${px}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
const MONO = (px) => `700 ${px}px "Consolas", "SFMono-Regular", monospace`;

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const game = document.createElement('canvas');
game.width = VIEW_W; game.height = VIEW_H;
const gctx = game.getContext('2d');
let SC = 3;
function resize() {
  const vw = innerWidth, vh = innerHeight;
  SC = Math.max(2, Math.min(4, Math.floor(Math.min(vw / VIEW_W, vh / VIEW_H) * devicePixelRatio) || 2));
  canvas.width = VIEW_W * SC; canvas.height = VIEW_H * SC;
  const fit = Math.min(vw / VIEW_W, vh / VIEW_H);
  canvas.style.width = Math.floor(VIEW_W * fit) + 'px';
  canvas.style.height = Math.floor(VIEW_H * fit) + 'px';
}
addEventListener('resize', resize); resize();

// ---------------- settings ----------------
const settings = Object.assign({ difficulty: 4, rounds: 3, time: 99, combo: true, autoCombo: true, uniform: true, easy: true, volume: 8, scanlines: true, music: true }, JSON.parse(localStorage.getItem('fightwire.settings') || '{}'));
const saveSettings = () => localStorage.setItem('fightwire.settings', JSON.stringify(settings));
audio.setVolume(settings.volume / 10);

// ---------------- app state ----------------
const app = {
  screen: 'loading', t: 0, roster: [], fx: null, stages: makeStages(),
  load: { label: 'Booting', p: 0 },
  menuIndex: 0, mode: 'versus',
  sel: null, fight: null, pauseMenu: null,
};
const menuIn = new MenuInput();

function go(screen, extra = {}) { app.screen = screen; app.t = 0; Object.assign(app, extra); }

// ---------------- boot ----------------
async function boot() {
  try {
    const roster = JSON.parse(await fetchText('chars/roster.json')).chars;
    app.load.label = 'Loading interface';
    await loadUI();
    try { audio.uiBank = parseSND(await fetchBytes('ui/system.snd')); audio.decodeBank(audio.uiBank); } catch {}
    app.load.label = 'Loading effects'; app.fx = await loadFightFX();
    for (let i = 0; i < roster.length; i++) {
      const folder = roster[i];
      const def = await CharDef.load(folder, null, (label, p) => { app.load.label = `${folder.toUpperCase()} — ${label}`; app.load.p = (i + p) / roster.length; });
      def.idle = new AnimPlayer(def.anims.get(0) || null, def);
      app.roster.push(def);
    }
    app.load.p = 1;
    go('title');
    // decode sounds in the background
    (async () => { await audio.decodeBank(app.fx.snd); for (const d of app.roster) await audio.decodeBank(d.snd); })();
  } catch (e) {
    console.error(e);
    app.load.error = String(e.message || e);
  }
}

// ---------------- drawing helpers ----------------
function text(s, x, y, o = {}) {
  ctx.save();
  ctx.font = o.font || FONT(o.size || 12);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || '#000'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x + (o.sx ?? 1.5), y + (o.sy ?? 1.5)); }
  ctx.fillStyle = o.color || C.ink;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function para(x, y, w, h, skew, fill) {
  ctx.beginPath(); ctx.moveTo(x + skew, y); ctx.lineTo(x + w + skew, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
const cabinet = new Image();
cabinet.src = new URL('../ui/cabinet.webp', import.meta.url).href;
function poster(shade = 0) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (cabinet.complete && cabinet.naturalWidth) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1 - shade;
    ctx.drawImage(cabinet, 0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
}
// ---- Fighting Jam screenpack art (rebranded for Logical Bends) ----
const UI = {};
const UI_FILES = ['0_1', '10_2', '10_3', '10_4', '200_3', '200_4', '150_0', '180_0', '180_1', '50_14', '40_0', '40_1', '60_0', '500_3', 'player_select'];
function loadUI() {
  return Promise.all(UI_FILES.map(n => new Promise(res => { const im = new Image(); im.onload = () => { UI[n] = im; res(); }; im.onerror = res; im.src = `ui/${n}.png`; })));
}
// Cyan sky with sliding chrome streaks; darkened at the bottom so text stays readable.
function wireBackdrop(t, tint = null) {
  if (!UI['0_1']) { poster(0.92); return; }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(UI['0_1'], 0, 0, VIEW_W, VIEW_H);
  ctx.globalCompositeOperation = 'lighter';
  [['10_4', 0.5, 0.35], ['10_3', 0.75, 0.3], ['10_2', 1.0, 0.25]].forEach(([n, v, a]) => {
    const im = UI[n]; if (!im) return;
    const w = im.width * 0.5, h = im.height * 0.5, step = 200;
    ctx.globalAlpha = a;
    const off = (t * v) % step;
    for (let x = -w + off; x < VIEW_W + w; x += step) ctx.drawImage(im, x, (VIEW_H - h) / 2, w, h);
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, 'rgba(0,20,60,0.15)'); g.addColorStop(1, 'rgba(0,10,40,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (tint) { ctx.globalAlpha = 0.12; ctx.fillStyle = tint; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  ctx.restore();
}
function logo(x, y, scale = 1) {
  text('LOGICAL BENDS', x, y, {size: 31 * scale, align: 'center', color: C.ink, shadow: '#a32c1b'});
}
function featuredFighter(index, x, y, facing) {
  const fighter = app.roster[index];
  if (!fighter) return;
  fighter.idle.step();
  drawFrameOf(fighter, fighter.idle, 0, x, y, 1.05, facing);
}
function titleWord(word, x, y, width, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.10, 1, 0, 0);
  ctx.font = '900 58px Impact, "Arial Black", sans-serif';
  ctx.scale(width / ctx.measureText(word).width, 1);
  ctx.fillStyle = '#271512';
  ctx.fillText(word, 1.5, 2);
  ctx.fillStyle = color;
  ctx.fillText(word, 0, 0);
  ctx.restore();
}
function portraitOf(def, palIndex = 0, big = true) {
  const spr = getSprite(def.sff, 9000, big ? 1 : 0) || getSprite(def.sff, 9000, 0);
  if (!spr) return null;
  const pal = (def.palettes[palIndex] || def.palettes[0])?.pal;
  return { cv: spriteCanvas(spr, pal, def.folder + ':' + palIndex), spr };
}
function drawFrameOf(def, anim, palIndex, x, y, scale = 1, facing = 1) {
  const f = anim.frame(); if (!f) return;
  const spr = getSprite(def.sff, f.g, f.n); if (!spr) return;
  const cv = spriteCanvas(spr, (def.palettes[palIndex] || def.palettes[0])?.pal, def.folder + ':' + palIndex);
  if (!cv) return;
  ctx.save();
  ctx.translate(x + f.x * scale * facing, y + f.y * scale);
  ctx.scale(scale * ((facing < 0) !== f.hflip ? -1 : 1), scale);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, -spr.x, -spr.y);
  ctx.restore();
}

// ---------------- screens ----------------
const MAIN_MENU = [
  { id: 'arcade', label: 'ARCADE', desc: 'Fight through the ladder against the CPU.' },
  { id: 'versus', label: 'VERSUS', desc: 'Two players, one keyboard (or two pads).' },
  { id: 'cpu', label: 'VS CPU', desc: 'Pick your fighter and your opponent.' },
  { id: 'training', label: 'TRAINING', desc: 'Lab mode: dummy settings, hitboxes, infinite meter.' },
  { id: 'watch', label: 'WATCH', desc: 'CPU vs CPU.' },
  { id: 'controls', label: 'CONTROLS', desc: 'Keys, easy specials, combo system.' },
  { id: 'options', label: 'OPTIONS', desc: 'Difficulty, rounds, timer, audio.' },
  { id: 'credits', label: 'CREDITS', desc: 'Who made what.' },
];

const screens = {
  loading: {
    update() {},
    draw() {
      wireBackdrop(app.t);
      logo(VIEW_W / 2, 100, 1, app.t);
      const w = 220, x = (VIEW_W - w) / 2, y = 150;
      ctx.fillStyle = '#1c2340'; ctx.fillRect(x, y, w, 6);
      ctx.fillStyle = C.y; ctx.fillRect(x, y, w * app.load.p, 6);
      text(app.load.error ? 'ERROR: ' + app.load.error : app.load.label, VIEW_W / 2, y + 20, { font: MONO(7), align: 'center', color: app.load.error ? C.r : C.dim });
      if (app.load.error) text('Serve this folder over http (see README) and reload.', VIEW_W / 2, y + 34, { font: MONO(7), align: 'center', color: C.ink });
    },
  },
  title: {
    update(ins) {
      if (ins[0].ok || ins[0].start || ins[1].ok || ins.esc === false && keyboard.down.has('Space')) { audio.ensure(); audio.confirm(); if (settings.music) audio.startMusic('menu'); go('menu'); }
    },
    draw() {
      poster();
      featuredFighter(0, 258, 211, 1);
      featuredFighter(1, 363, 211, -1);
      titleWord('LOGICAL', 16, 101, 182, C.ink);
      titleWord('BENDS', 16, 146, 178, C.r);
      para(17, 170, 111, 20, 4, C.ink);
      text('PRESS ENTER   ›', 26, 184, {size: 10, color: C.bg});
    },
  },
  menu: {
    update(ins) {
      const i0 = ins[0];
      if (i0.up) { app.menuIndex = (app.menuIndex + MAIN_MENU.length - 1) % MAIN_MENU.length; audio.move(); }
      if (i0.down) { app.menuIndex = (app.menuIndex + 1) % MAIN_MENU.length; audio.move(); }
      if (i0.back || ins.esc) { audio.back(); go('title'); }
      if (i0.ok) {
        audio.confirm();
        const id = MAIN_MENU[app.menuIndex].id;
        if (['arcade', 'versus', 'cpu', 'training', 'watch'].includes(id)) startSelect(id);
        else go(id, { optIndex: 0, scroll: 0 });
      }
    },
    draw() {
      poster();
      featuredFighter(app.menuIndex % app.roster.length, 316, 205, -1);
      para(-20, 0, 209, VIEW_H, 32, 'rgba(19,16,15,0.96)');
      text('LOGICAL BENDS', 16, 18, {font: MONO(7), color: C.y});
      text('MAIN MENU', 15, 40, {size: 19});
      MAIN_MENU.forEach((mode, i) => {
        const active = i === app.menuIndex, y = 47 + i * 19;
        if (active) para(12, y, 157, 17, 5, C.r);
        text(mode.label, 23, y + 12, {size: 10, color: active ? '#16100e' : C.ink});
        if (active) text('›', 158, y + 12, {size: 12, color: C.bg});
      });
      ctx.fillStyle = '#191514';
      ctx.fillRect(0, 205, VIEW_W, 35);
      ctx.fillStyle = C.r;
      ctx.fillRect(0, 205, VIEW_W, 1);
      text(MAIN_MENU[app.menuIndex].desc, 15, 219, {font: MONO(7)});
      text('↑ ↓  SELECT     ENTER  CONFIRM     ESC  BACK', 15, 232, {font: MONO(6), color: C.y});
    },
  },
  select: {
    update(ins) { selectUpdate(ins); },
    draw() { selectDraw(); },
  },
  stage: {
    update(ins) {
      const s = app.sel;
      if (ins[0].left) { s.stage = (s.stage + app.stages.length) % (app.stages.length + 1); audio.move(); }
      if (ins[0].right) { s.stage = (s.stage + 1) % (app.stages.length + 1); audio.move(); }
      if (ins[0].back || ins.esc) { audio.back(); s.locked = [false, false]; s.palMode = [false, false]; s.cpuPick = false; go('select'); }
      if (ins[0].ok) { audio.confirm(); go('vs'); }
    },
    draw() {
      wireBackdrop(app.t, C.y);
      text('STAGE SELECT', VIEW_W / 2, 30, { size: 16, align: 'center', color: C.y, stroke: 3 });
      const s = app.sel;
      const idx = s.stage;
      const st = idx < app.stages.length ? app.stages[idx] : null;
      // live preview
      ctx.save();
      const pw = 256, ph = 144, px = (VIEW_W - pw) / 2, py = 48;
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      ctx.translate(px, py); ctx.scale(pw / VIEW_W, ph / VIEW_H);
      if (st) st.draw(ctx, { camX: Math.sin(app.t * 0.01) * 150, camY: 0 });
      else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.font = FONT(60); ctx.fillStyle = C.y; ctx.textAlign = 'center'; ctx.fillText('?', VIEW_W / 2, VIEW_H / 2 + 20); }
      ctx.restore();
      ctx.strokeStyle = C.y; ctx.lineWidth = 1; ctx.strokeRect(px - 0.5, py - 0.5, pw + 1, ph + 1);
      text('◀  ' + (st ? st.name.toUpperCase() : 'RANDOM') + '  ▶', VIEW_W / 2, 212, { size: 11, align: 'center', color: C.ink, stroke: 3 });
    },
  },
  vs: {
    update(ins) {
      if (app.t === 1) { if (settings.music) audio.startMusic('vs'); else audio.sting('round'); }
      if (app.t > 110 || (app.t > 20 && (ins[0].ok || ins[0].start))) startFight();
    },
    draw() {
      const s = app.sel;
      wireBackdrop(app.t * 3);
      const slide = Math.min(1, app.t / 18);
      // diagonal split, tinted per side
      ctx.save();
      ctx.globalAlpha = 0.6;
      para(-60 + (1 - slide) * -200, 0, VIEW_W / 2 + 40, VIEW_H, 0, '#5a0f10');
      ctx.fillStyle = '#0b2a5a';
      ctx.beginPath(); ctx.moveTo(VIEW_W / 2 + 30 + (1 - slide) * 300, 0); ctx.lineTo(VIEW_W + 10, 0); ctx.lineTo(VIEW_W + 10, VIEW_H); ctx.lineTo(VIEW_W / 2 - 30 + (1 - slide) * 300, VIEW_H); ctx.fill();
      ctx.restore();
      if (UI['60_0']) { ctx.save(); ctx.globalAlpha = 0.8; ctx.drawImage(UI['60_0'], -(1 - slide) * 400, 196, VIEW_W, 30); ctx.restore(); }
      const [a, b] = [s.pick[0], s.pick[1]];
      const da = app.roster[a], db = app.roster[b];
      const pa = portraitOf(da, s.pal[0]), pb = portraitOf(db, s.pal[1]);
      ctx.imageSmoothingEnabled = false;
      if (pa) { const k = 150 / pa.cv.height; ctx.drawImage(pa.cv, 20 - (1 - slide) * 200, 40, pa.cv.width * k, 150); }
      if (pb) { const k = 150 / pb.cv.height; ctx.save(); ctx.translate(VIEW_W - 20 + (1 - slide) * 200, 40); ctx.scale(-1, 1); ctx.drawImage(pb.cv, 0, 0, pb.cv.width * k, 150); ctx.restore(); }
      text(da.displayName.toUpperCase(), 24, 210, { size: 14, color: C.y, stroke: 3 });
      text(db.displayName.toUpperCase(), VIEW_W - 24, 210, { size: 14, color: C.b, stroke: 3, align: 'right' });
      text(da.profile.tagline || '', 24, 224, { font: MONO(6), color: C.dim });
      text(db.profile.tagline || '', VIEW_W - 24, 224, { font: MONO(6), color: C.dim, align: 'right' });
      const pulse = 1 + Math.sin(app.t * 0.3) * 0.05;
      if (UI['50_14']) {
        const im = UI['50_14'], k = pulse * Math.min(1, app.t / 10) * 0.42;
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(VIEW_W / 2, 112); ctx.scale(k, k);
        ctx.drawImage(im, -im.width / 2, -im.height / 2); ctx.restore();
      } else {
        ctx.save(); ctx.translate(VIEW_W / 2, 120); ctx.scale(pulse * Math.min(1, app.t / 10) * 1.6, pulse * Math.min(1, app.t / 10) * 1.6);
        ctx.font = FONT(30); ctx.textAlign = 'center'; ctx.fillStyle = C.r; ctx.fillText('VS', 2, 2); ctx.fillStyle = C.ink; ctx.fillText('VS', 0, 0);
        ctx.restore();
      }
      if (s.mode === 'arcade') text(`STAGE ${s.arcade.round + 1} / ${s.arcade.ladder.length}`, VIEW_W / 2, 24, { font: MONO(8), align: 'center', color: C.y });
    },
  },
  fight: {
    update(ins) { fightUpdate(ins); },
    draw() { fightDraw(); },
  },
  results: {
    update(ins) {
      const r = app.results;
      if (ins[0].up) { r.idx = (r.idx + r.items.length - 1) % r.items.length; audio.move(); }
      if (ins[0].down) { r.idx = (r.idx + 1) % r.items.length; audio.move(); }
      if (ins[0].ok && app.t > 30) { audio.confirm(); r.items[r.idx].act(); }
    },
    draw() {
      const r = app.results;
      wireBackdrop(app.t, r.color);
      const def = r.def;
      const p = portraitOf(def, r.pal);
      ctx.imageSmoothingEnabled = false;
      if (p) { const k = 170 / p.cv.height; ctx.drawImage(p.cv, 18, 30, p.cv.width * k, 170); }
      if (UI['180_1']) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(UI['180_1'], 150, 8, 270, 270 * UI['180_1'].height / UI['180_1'].width); ctx.restore(); }
      text(r.title, 220, 50, { size: 18, color: r.color, stroke: 4 });
      text(def.displayName.toUpperCase(), 220, 66, { size: 10, color: C.ink });
      // quote box
      ctx.fillStyle = C.panel; ctx.fillRect(210, 78, 205, 60); ctx.fillStyle = r.color; ctx.fillRect(210, 78, 3, 60);
      wrapText('“' + r.quote + '”', 218, 92, 192, 10, MONO(7), C.ink);
      r.items.forEach((it, i) => {
        const sel = i === r.idx, y = 165 + i * 15;
        if (sel) para(212, y - 10, 130, 13, 4, C.y);
        text(it.label, 220, y, { size: 9, color: sel ? C.bg : C.ink });
      });
    },
  },
  controls: {
    update(ins) {
      if (ins[0].back || ins[0].ok || ins.esc) { audio.back(); go('menu'); }
      if (ins[0].down) app.scroll = Math.min(app.scroll + 8, 140);
      if (ins[0].up) app.scroll = Math.max(app.scroll - 8, 0);
    },
    draw() {
      wireBackdrop(app.t);
      ctx.save(); ctx.translate(0, -app.scroll);
      text('CONTROLS', 20, 28, { size: 16, color: C.y, stroke: 3 });
      const rows = [
        ['', 'PLAYER 1', 'PLAYER 2'],
        ['Move', 'W A S D', 'Arrow keys'],
        ['Light / Med / Heavy  (X Y Z)', "L  ;  '", 'Num 4 5 6'],
        ['Kick row  (A B C)', ',  .  /', 'Num 1 2 3'],
        ['EASY SPECIAL', 'E + direction', 'Num 7 + dir'],
        ['EASY SUPER', 'Q + direction', 'Num 9 + dir'],
        ['EX special', 'E + Q + direction', 'Num 7 + 9'],
        ['Taunt (Start)', 'Enter', 'Num Enter'],
        ['Pause', 'Esc', 'Esc'],
        ['Gamepad', 'X Y RB = X Y Z · A B RT = A B C · LB = E · LT = Q', ''],
      ];
      rows.forEach((r, i) => {
        const y = 48 + i * 13;
        if (i === 0) { text(r[1], 200, y, { font: MONO(7), color: C.y }); text(r[2], 320, y, { font: MONO(7), color: C.b }); return; }
        text(r[0], 20, y, { font: MONO(7), color: C.dim });
        text(r[1], 200, y, { font: MONO(7), color: C.ink });
        text(r[2], 320, y, { font: MONO(7), color: C.ink });
      });
      text('COMBO SYSTEM  (on by default — Options)', 20, 190, { size: 9, color: C.y });
      const lines = [
        'Chain on hit or block:  Light → Medium → Heavy.  Lights can chain into lights up to 3 times.',
        'AUTO COMBO: just mash Light (L) — each hit steps Light → Medium → Heavy → Special → Super (1 bar).',
        'Any normal cancels into a special (E); any normal or special cancels into a super (Q).',
        'Crouching heavy is a LAUNCHER: on hit, press Up to super-jump and keep the air combo going.',
        'Air normals chain the same way. Damage scales down the longer the combo runs.',
        'Original MUGEN motion inputs (QCF, charge, 360...) still work alongside the easy buttons.',
      ];
      lines.forEach((l, i) => text(l, 20, 202 + i * 10, { font: MONO(6.5), color: C.ink }));
      text('THE CHARACTERS', 20, 274, { size: 9, color: C.y });
      text('Pause during a fight and choose MOVE LIST to see each fighter\'s easy and classic inputs.', 20, 284, { font: MONO(6.5), color: C.ink });
      ctx.restore();
      text('↑↓ scroll · any button: back', VIEW_W - 10, VIEW_H - 8, { font: MONO(6), color: C.dim, align: 'right' });
    },
  },
  options: {
    update(ins) {
      const opts = optionList();
      const i0 = ins[0];
      if (i0.up) { app.optIndex = (app.optIndex + opts.length - 1) % opts.length; audio.move(); }
      if (i0.down) { app.optIndex = (app.optIndex + 1) % opts.length; audio.move(); }
      const o = opts[app.optIndex];
      if (i0.left && o.change) { o.change(-1); audio.move(); saveSettings(); }
      if ((i0.right || i0.ok) && o.change) { o.change(1); audio.move(); saveSettings(); }
      if (i0.ok && o.act) o.act();
      if (i0.back || ins.esc) { audio.back(); go('menu'); }
    },
    draw() {
      wireBackdrop(app.t);
      text('OPTIONS', 20, 30, { size: 16, color: C.y, stroke: 3 });
      optionList().forEach((o, i) => {
        const sel = i === app.optIndex, y = 60 + i * 16;
        if (sel) para(16, y - 11, 300, 14, 4, '#1f2846');
        text(o.label, 24, y, { size: 9, color: sel ? C.y : C.ink });
        if (o.value) text(o.value(), 300, y, { font: MONO(8), color: C.ink, align: 'right' });
      });
    },
  },
  credits: {
    update(ins) { if (ins[0].ok || ins[0].back || ins.esc) { audio.back(); go('menu'); } },
    draw() {
      wireBackdrop(app.t);
      logo(VIEW_W / 2, 40, 0.6, app.t);
      const L = [
        ['ENGINE', 'Logical Bends · browser MUGEN engine'],
        ['DEE BEE KAW', 'The_None (Most_Mysterious) · voiced by JesusZilla'],
        ['', 'via Logical Bends — see chars/deebeekaw/readme.txt'],
        ['EVIL KUNG FU MAN', 'The_None (Most_Mysterious) · via Logical Bends'],
        ['KANAE', 'aokmaniac13 · via Logical Bends'],
        ['UPPERCUT', 'The_None · via Logical Bends'],
        ['KUNG FU MAN', 'Elecbyte (bundled with Ikemen GO)'],
        ['HIT SPARKS / COMMON SFX', 'Ikemen GO project (data/fightfx, data/common.snd)'],
        ['FORMAT REFERENCE', 'Elecbyte M.U.G.E.N docs · Ikemen GO (MIT)'],
        ['CABINET ART', 'GPT Image'],
        ['STAGES · MUSIC', 'Drawn and synthesized in-engine'],
      ];
      L.forEach(([a, b], i) => { text(a, 30, 80 + i * 18, { font: MONO(7), color: C.y }); text(b, 160, 80 + i * 18, { font: MONO(7), color: C.ink }); });
    },
  },
};

function wrapText(s, x, y, w, lh, font, color) {
  ctx.font = font;
  const words = s.split(' ');
  let line = '';
  for (const wd of words) {
    const t = line ? line + ' ' + wd : wd;
    if (ctx.measureText(t).width > w && line) { text(line, x, y, { font, color }); y += lh; line = wd; }
    else line = t;
  }
  if (line) text(line, x, y, { font, color });
}

function optionList() {
  const cyc = (k, list) => (d) => { const i = list.indexOf(settings[k]); settings[k] = list[(i + d + list.length) % list.length]; };
  return [
    { label: 'CPU DIFFICULTY', value: () => '★'.repeat(settings.difficulty) + '·'.repeat(8 - settings.difficulty), change: cyc('difficulty', [1, 2, 3, 4, 5, 6, 7, 8]) },
    { label: 'ROUNDS', value: () => `BEST OF ${settings.rounds}`, change: cyc('rounds', [1, 3, 5]) },
    { label: 'ROUND TIMER', value: () => (settings.time ? settings.time + ' SEC' : '∞'), change: cyc('time', [30, 60, 99, 0]) },
    { label: 'COMBO SYSTEM', value: () => (settings.combo ? 'ON' : 'OFF (pure MUGEN)'), change: () => (settings.combo = !settings.combo) },
    { label: 'AUTO COMBO (mash Light)', value: () => (settings.autoCombo ? 'ON' : 'OFF'), change: () => (settings.autoCombo = !settings.autoCombo) },
    { label: 'UNIFORM RULES', value: () => (settings.uniform ? 'ON (equal damage/stun)' : 'OFF (original)'), change: () => (settings.uniform = !settings.uniform) },
    { label: 'CONTROLS SETUP', act: () => go('keys', { keys: { side: 0, row: 0, waiting: false } }) },
    { label: 'EASY SPECIALS (E / Q)', value: () => (settings.easy ? 'ON' : 'OFF'), change: () => (settings.easy = !settings.easy) },
    { label: 'VOLUME', value: () => '▮'.repeat(settings.volume) + '▯'.repeat(10 - settings.volume), change: (d) => { settings.volume = Math.max(0, Math.min(10, settings.volume + d)); audio.setVolume(settings.volume / 10); } },
    { label: 'MUSIC', value: () => (settings.music ? 'ON' : 'OFF'), change: () => { settings.music = !settings.music; settings.music ? audio.startMusic('menu') : audio.stopMusic(); } },
    { label: 'CRT SCANLINES', value: () => (settings.scanlines ? 'ON' : 'OFF'), change: () => (settings.scanlines = !settings.scanlines) },
    { label: 'BACK', act: () => go('menu') },
  ];
}

// ---------------- character select ----------------
function startSelect(mode) {
  if (settings.music) audio.startMusic('select');
  const n = app.roster.length;
  app.sel = {
    mode, cursor: [0, Math.min(1, n - 1)], locked: [false, false], palMode: [false, false], pal: [0, 1], pick: [0, 0],
    stage: 0, cpuPick: false,
    humans: mode === 'versus' ? [true, true] : mode === 'watch' ? [false, false] : [true, false],
  };
  go('select');
}
const SLOTS = 8;
function selectUpdate(ins) {
  const s = app.sel;
  const n = app.roster.length;
  // who controls which side?
  const ctlFor = (side) => {
    if (s.mode === 'versus') return ins[side];
    if (side === 0) return ins[0];
    // P2 side in 1P modes: P1 controls it after locking P1 (vs cpu / training / watch)
    if (s.mode === 'arcade') return null;
    return s.locked[0] ? ins[0] : null;
  };
  if (ins.esc || (ins[0].back && !s.locked[0] && !s.palMode[0])) { audio.back(); go('menu'); return; }
  for (let side = 0; side < 2; side++) {
    const i = ctlFor(side);
    if (!i || s.locked[side]) continue;
    if (side === 1 && s.mode !== 'versus' && !s.locked[0]) continue;
    if (s.palMode[side]) {
      const pc = app.roster[s.cursor[side]].palettes.length;
      if (i.left) { s.pal[side] = (s.pal[side] + pc - 1) % pc; audio.move(); }
      if (i.right) { s.pal[side] = (s.pal[side] + 1) % pc; audio.move(); }
      if (i.back) { s.palMode[side] = false; audio.back(); }
      else if (i.ok) {
        s.locked[side] = true; s.pick[side] = s.cursor[side]; audio.confirm();
      }
      continue;
    }
    if (i.left) { s.cursor[side] = (s.cursor[side] + SLOTS - 1) % SLOTS; audio.move(); }
    if (i.right) { s.cursor[side] = (s.cursor[side] + 1) % SLOTS; audio.move(); }
    if (i.up || i.down) { s.cursor[side] = (s.cursor[side] + SLOTS / 2) % SLOTS; audio.move(); }
    if (i.back && side === 1 && s.mode !== 'versus') { s.locked[0] = false; s.palMode[0] = false; audio.back(); continue; }
    if (i.ok) {
      if (s.cursor[side] >= n) { audio.back(); continue; }
      s.palMode[side] = true; audio.confirm();
      // default palette: main look for P1, avoid identical mirror for P2
      s.pal[side] = 0;
      if (side === 1 && s.locked[0] && s.pick[0] === s.cursor[1]) s.pal[1] = (s.pal[0] + 1) % app.roster[s.cursor[1]].palettes.length;
    }
  }
  if (s.mode === 'arcade' && s.locked[0]) {
    // build the ladder
    const others = app.roster.map((_, i) => i);
    const ladder = [];
    for (let k = 0; k < 4; k++) ladder.push(others[(k + 1) % others.length]);
    s.arcade = { ladder, round: 0 };
    s.pick[1] = ladder[0];
    s.pal[1] = s.pick[1] === s.pick[0] ? (s.pal[0] + 1 + Math.floor(Math.random() * 5)) % app.roster[s.pick[1]].palettes.length : 0;
    s.stage = 0;
    go('vs');
    return;
  }
  if (s.locked[0] && s.locked[1]) {
    s.stage = s.mode === 'training' ? 2 : 0;
    go('stage');
  }
}
function selectDraw() {
  const s = app.sel;
  wireBackdrop(app.t);
  const modeName = { arcade: 'ARCADE', versus: 'VS MODE', cpu: 'VS CPU', training: 'TRAINING', watch: 'WATCH' }[s.mode];
  const P1C = '#ffd23f', P2C = '#3ad6ff';
  ctx.imageSmoothingEnabled = true;
  // side streaks (P1 warm, P2 cool), sliding in
  const slide = Math.min(1, app.t / 14);
  for (let side = 0; side < 2; side++) {
    const im = side ? UI['500_3'] : UI['40_1'];
    if (!im) continue;
    const h = VIEW_H + 20, w = im.width * (h / im.height);
    ctx.save(); ctx.globalAlpha = 0.55;
    for (let k = 0; k < 3; k++) {
      const x = side ? VIEW_W - 150 + k * 34 + (1 - slide) * 200 : 20 + k * 34 - (1 - slide) * 200;
      ctx.drawImage(im, x, -10, w, h);
    }
    ctx.restore();
  }
  // header
  if (UI.player_select) { const im = UI.player_select; const w = 150, h = im.height * (w / im.width); ctx.drawImage(im, (VIEW_W - w) / 2, 4, w, h); }
  else text('PLAYER SELECT', VIEW_W / 2, 22, { size: 14, align: 'center', color: C.ink, stroke: 3 });
  text(modeName, VIEW_W / 2, 36, { size: 8, align: 'center', color: P1C, stroke: 2.5 });

  // big fighter previews
  for (let side = 0; side < 2; side++) {
    const cx = side ? VIEW_W - 76 : 76;
    if (s.mode === 'arcade' && side === 1) {
      text('CPU LADDER', cx, 100, { size: 13, align: 'center', color: C.ink, stroke: 3 });
      text('4 FIGHTS', cx, 114, { size: 8, align: 'center', color: P1C, stroke: 2.5 });
      continue;
    }
    const idx = s.locked[side] ? s.pick[side] : s.cursor[side];
    const shown = side === 0 || s.mode === 'versus' || s.locked[0];
    const def = app.roster[idx];
    if (!shown) { text('WAITING…', cx, 110, { size: 10, align: 'center', color: C.ink, stroke: 3 }); continue; }
    if (!def) { text('LOCKED', cx, 105, { size: 12, align: 'center', color: C.ink, stroke: 3 }); text('more fighters soon', cx, 117, { font: MONO(6.5), align: 'center', color: C.ink }); continue; }
    const pal = s.palMode[side] || s.locked[side] ? s.pal[side] : 0;
    // big portrait
    const p = portraitOf(def, pal, true);
    if (p) {
      ctx.imageSmoothingEnabled = false;
      const ph = 112, k = ph / p.cv.height, pw = p.cv.width * k;
      ctx.save();
      ctx.translate(side ? VIEW_W - 8 + (1 - slide) * 120 : 8 - (1 - slide) * 120, 40);
      if (side) ctx.scale(-1, 1);
      ctx.drawImage(p.cv, 0, 0, pw, ph);
      ctx.restore();
    }
    // animated fighter in front
    def.idle.step();
    drawFrameOf(def, def.idle, pal, side ? VIEW_W - 44 : 44, 160, 0.7, side ? -1 : 1);
    // name bar
    const bar = UI['180_0'];
    const by = 158;
    if (bar) { ctx.save(); ctx.globalAlpha = 0.85; if (side) { ctx.translate(VIEW_W, 0); ctx.scale(-1, 1); } ctx.drawImage(bar, -40, by, 230, 20); ctx.restore(); }
    text(def.displayName.toUpperCase(), side ? VIEW_W - 10 : 10, by + 13, { size: 9, align: side ? 'right' : 'left', color: side ? P2C : P1C, stroke: 2.5 });
    if (s.palMode[side] && !s.locked[side]) {
      text(`◀ COLOR ${pal + 1}/${def.palettes.length} ▶`, cx, 190, { size: 7.5, align: 'center', color: C.ink, stroke: 2.5 });
      text(pal === 0 ? 'MAIN LOOK' : 'confirm to lock', cx, 199, { font: MONO(6), align: 'center', color: pal === 0 ? P1C : C.ink });
    } else if (s.locked[side]) text('READY!', cx, 192, { size: 11, align: 'center', color: P1C, stroke: 3 });
  }

  // cell grid (center bottom)
  const cw = 26, gap = 4, cols = SLOTS / 2;
  const gx = (VIEW_W - (cols * cw + (cols - 1) * gap)) / 2, gy = 166;
  for (let i = 0; i < SLOTS; i++) {
    const x = gx + (i % cols) * (cw + gap), y = gy + Math.floor(i / cols) * (cw + gap);
    ctx.fillStyle = 'rgba(0,10,40,0.75)'; ctx.fillRect(x, y, cw, cw);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.75; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, cw - 1);
    const def = app.roster[i];
    ctx.imageSmoothingEnabled = false;
    if (def) {
      const p = portraitOf(def, 0, false) || portraitOf(def, 0, true);
      if (p) { const k = Math.min((cw - 2) / p.cv.width, (cw - 2) / p.cv.height); ctx.drawImage(p.cv, x + (cw - p.cv.width * k) / 2, y + (cw - p.cv.height * k) / 2, p.cv.width * k, p.cv.height * k); }
    } else if (UI['150_0']) {
      ctx.globalAlpha = 0.35; ctx.drawImage(UI['150_0'], x + 3, y + 3, cw - 6, cw - 6); ctx.globalAlpha = 1;
    }
  }
  // cursors (screenpack 1P / 2P frames)
  for (let side = 0; side < 2; side++) {
    const active = side === 0 || s.mode === 'versus' || s.locked[0];
    if (!active || (s.mode === 'arcade' && side === 1)) continue;
    const i = s.cursor[side];
    const x = gx + (i % cols) * (cw + gap), y = gy + Math.floor(i / cols) * (cw + gap);
    const im = UI[side ? '200_4' : '200_3'];
    const blink = s.locked[side] || s.palMode[side] || (app.t >> 3) % 2 === 0;
    if (!blink) continue;
    if (im) { ctx.imageSmoothingEnabled = true; const k = (cw + 6) / 40; ctx.drawImage(im, x - 3 - 5 * k, y - 3 - 12 * k, im.width * k, im.height * k); }
    else { ctx.strokeStyle = side ? P2C : C.r; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, cw + 2, cw + 2); }
  }
  const hint = s.mode === 'versus' ? 'P1: WASD + L   ·   P2: Arrows + Num 4' : (s.locked[0] && s.mode !== 'arcade' ? 'Now pick the opponent' : 'L / Enter: pick  ·  then ◀ ▶ for colors');
  text(hint, VIEW_W / 2, VIEW_H - 4, { size: 6.5, align: 'center', color: C.ink, stroke: 2 });
}

// ---------------- fight ----------------
function startFight() {
  const s = app.sel;
  const stageIdx = s.stage < app.stages.length ? s.stage : Math.floor(Math.random() * app.stages.length);
  const stage = app.stages[stageIdx];
  const humans = s.humans;
  const aiLevel = settings.difficulty;
  const mk = (side) => ({
    def: app.roster[s.pick[side]], palIndex: s.pal[side],
    ai: humans[side] ? 0 : (s.mode === 'training' && side === 1 ? 0 : aiLevel),
    dummy: s.mode === 'training' && side === 1 ? { mode: 'stand', guard: 'none' } : null,
  });
  const fight = new Fight({
    fx: app.fx, stage, mode: s.mode === 'training' ? 'training' : 'versus',
    p1: mk(0), p2: mk(1),
    roundsToWin: Math.ceil(settings.rounds / 2), timeSec: s.mode === 'training' ? 0 : settings.time,
    comboSystem: settings.combo, uniform: settings.uniform, matchNo: s.arcade ? s.arcade.round + 1 : 1,
  });
  for (const c of fight.roots) c.def.profile._easyOff = !settings.easy;
  fight.trainingPower = s.mode === 'training';
  fight.autoCombo = settings.combo && settings.autoCombo;
  app.fight = fight;
  app.hud = { life: [1, 1], red: [1, 1], redHold: [0, 0] };
  app.pauseMenu = null;
  if (settings.music) audio.startMusic('fight');
  go('fight');
}

let accum = 0;
function fightUpdate(ins) {
  const f = app.fight;
  if (app.pauseMenu) { pauseUpdate(ins); return; }
  const pausePressed = ins.esc || keyboard.down.has('KeyP') && !app._p || (navigator.getGamepads?.()[0]?.buttons[8]?.pressed && !app._pad8);
  app._p = keyboard.down.has('KeyP'); app._pad8 = !!navigator.getGamepads?.()[0]?.buttons[8]?.pressed;
  if (pausePressed) { openPause(); return; }
  if (f.training && keyboard.down.has('F1') && !app._f1) f.showBoxes = !f.showBoxes;
  app._f1 = keyboard.down.has('F1');
  f.tick();
  for (const ev of f.events.splice(0)) if (ev.type === 'matchover') onMatchOver(ev.winner);
}

function onMatchOver(winner) {
  const s = app.sel, f = app.fight;
  const human1 = s.humans[0];
  const wside = winner === 3 ? 1 : winner;
  const wdef = app.roster[s.pick[wside - 1]];
  const quote = wdef.quotes.length ? wdef.quotes[Math.floor(Math.random() * wdef.quotes.length)] : 'Next.';
  const items = [];
  let title = winner === 3 ? 'DRAW' : `${winner}P WINS`;
  let color = winner === 2 ? C.b : C.y;
  if (s.mode === 'arcade') {
    if (winner === 1) {
      s.arcade.round++;
      if (s.arcade.round >= s.arcade.ladder.length) {
        title = 'ARCADE CLEAR';
        items.push({ label: 'MAIN MENU', act: () => { audio.startMusic('menu'); go('menu'); } });
      } else {
        title = 'YOU WIN';
        items.push({ label: 'NEXT FIGHT', act: () => { s.pick[1] = s.arcade.ladder[s.arcade.round]; s.pal[1] = (s.pick[1] === s.pick[0] ? (s.pal[0] + 1 + s.arcade.round) : s.arcade.round) % app.roster[s.pick[1]].palettes.length; s.stage = s.arcade.round % 2; go('vs'); } });
        items.push({ label: 'MAIN MENU', act: () => { audio.startMusic('menu'); go('menu'); } });
      }
    } else {
      title = 'GAME OVER'; color = C.r;
      items.push({ label: 'CONTINUE', act: () => go('vs') });
      items.push({ label: 'MAIN MENU', act: () => { audio.startMusic('menu'); go('menu'); } });
    }
  } else {
    items.push({ label: 'REMATCH', act: () => go('vs') });
    items.push({ label: 'CHARACTER SELECT', act: () => { audio.startMusic('menu'); startSelect(s.mode); } });
    items.push({ label: 'MAIN MENU', act: () => { audio.startMusic('menu'); go('menu'); } });
  }
  app.results = { def: wdef, pal: s.pal[wside - 1], quote, title, color, items, idx: 0 };
  setTimeout(() => { go('results'); if (settings.music) audio.startMusic('win'); }, 0);
}

function openPause() {
  const f = app.fight;
  const items = [{ label: 'RESUME', act: () => (app.pauseMenu = null) }];
  if (f.training) {
    const d = f.p2.dummy;
    items.push({ label: 'DUMMY', value: () => d.mode.toUpperCase(), change: (k) => { const L = ['stand', 'crouch', 'jump', 'cpu']; d.mode = L[(L.indexOf(d.mode) + k + L.length) % L.length]; if (d.mode === 'cpu') f.p2.bot = { level: settings.difficulty, think: 0 }; } });
    items.push({ label: 'DUMMY GUARD', value: () => d.guard.toUpperCase(), change: (k) => { const L = ['none', 'all', 'random']; d.guard = L[(L.indexOf(d.guard) + k + L.length) % L.length]; } });
    items.push({ label: 'HITBOXES (F1)', value: () => (f.showBoxes ? 'ON' : 'OFF'), change: () => (f.showBoxes = !f.showBoxes) });
    items.push({ label: 'INFINITE METER', value: () => (f.trainingPower ? 'ON' : 'OFF'), change: () => (f.trainingPower = !f.trainingPower) });
    items.push({ label: 'RESET POSITIONS', act: () => { f.startRound(false); f.roundState = 2; for (const c of f.roots) { c.changeState(0, 1); } app.pauseMenu = null; } });
  }
  items.push({ label: 'MOVE LIST', act: () => (app.pauseMenu.moves = { side: 0, scroll: 0 }) });
  items.push({ label: 'RESTART MATCH', act: () => { app.pauseMenu = null; startFight(); } });
  items.push({ label: 'CHARACTER SELECT', act: () => { app.pauseMenu = null; audio.startMusic('menu'); startSelect(app.sel.mode); } });
  items.push({ label: 'MAIN MENU', act: () => { app.pauseMenu = null; audio.startMusic('menu'); go('menu'); } });
  app.pauseMenu = { items, idx: 0 };
  audio.back();
}
function pauseUpdate(ins) {
  const pm = app.pauseMenu;
  const i0 = ins[0];
  if (pm.moves) {
    if (i0.left || i0.right) { pm.moves.side ^= 1; pm.moves.scroll = 0; audio.move(); }
    if (i0.down) pm.moves.scroll = Math.min(pm.moves.scroll + 10, 200);
    if (i0.up) pm.moves.scroll = Math.max(0, pm.moves.scroll - 10);
    if (i0.back || ins.esc || i0.ok) { pm.moves = null; audio.back(); }
    return;
  }
  if (ins.esc) { app.pauseMenu = null; return; }
  if (i0.up) { pm.idx = (pm.idx + pm.items.length - 1) % pm.items.length; audio.move(); }
  if (i0.down) { pm.idx = (pm.idx + 1) % pm.items.length; audio.move(); }
  const it = pm.items[pm.idx];
  if (it.change && (i0.left || i0.right)) { it.change(i0.left ? -1 : 1); audio.move(); }
  if (i0.ok) { audio.confirm(); if (it.act) it.act(); else if (it.change) it.change(1); }
  if (i0.back) app.pauseMenu = null;
}

// ---------------- HUD ----------------
function fightDraw() {
  const f = app.fight;
  gctx.imageSmoothingEnabled = false;
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  f.draw(gctx, (g, ff) => ff.stage.draw(g, ff));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(game, 0, 0, VIEW_W, VIEW_H);
  if (!f.globalAssert.has('nobardisplay')) drawHUD(f);
  drawMessages(f);
  if (f.superFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${f.superFlash / 30})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); f.superFlash--; }
  if (app.pauseMenu) drawPause();
}

function drawHUD(f) {
  const h = app.hud;
  const sides = [f.p1, f.p2];
  for (let i = 0; i < 2; i++) {
    const c = sides[i];
    const lf = Math.max(0, c.life / c.lifeMax);
    h.life[i] += (lf - h.life[i]) * 0.5;
    if (lf < h.red[i]) { if (c.movetype !== 'H' || h.redHold[i] > 40) h.red[i] = Math.max(lf, h.red[i] - 0.006); h.redHold[i]++; } else { h.red[i] = lf; h.redHold[i] = 0; }
    if (c.movetype !== 'H') h.redHold[i] = 999;
    const W = 168, Hh = 10, y = 10;
    const x = i === 0 ? 14 : VIEW_W - 14 - W;
    const sk = i === 0 ? 6 : -6;
    // frame
    para(x - 2, y - 2, W + 4, Hh + 4, sk, '#05070e');
    para(x, y, W, Hh, sk, '#2a0d12');
    // red (recent damage)
    const rw = W * h.red[i], lw = W * h.life[i];
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + W + sk, y); ctx.lineTo(x + W, y + Hh); ctx.lineTo(x, y + Hh); ctx.closePath(); ctx.clip();
    const dir = i === 0 ? -1 : 1;
    const rx = i === 0 ? x + W - rw : x, lx = i === 0 ? x + W - lw : x;
    ctx.fillStyle = C.r; ctx.fillRect(rx - 6, y, rw + 12, Hh);
    const low = lf < 0.25;
    const gr = ctx.createLinearGradient(0, y, 0, y + Hh);
    gr.addColorStop(0, low && (f.gameTime >> 3) % 2 ? '#fff3b0' : '#fff1a6'); gr.addColorStop(0.5, low ? '#ff9b3f' : C.y); gr.addColorStop(1, low ? '#c8501a' : '#d9a313');
    ctx.fillStyle = gr; ctx.fillRect(lx - 6, y, lw + 12, Hh);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 10, y + 1, W + 20, 2);
    ctx.restore();
    // name plate
    const name = c.def.displayName.toUpperCase();
    text(name, i === 0 ? x + 4 : x + W - 4, y + Hh + 11, { size: 8, align: i === 0 ? 'left' : 'right', color: C.ink, stroke: 2.5 });
    // round wins
    for (let k = 0; k < f.roundsToWin; k++) {
      const wx = i === 0 ? x + W - 6 - k * 9 : x + 6 + k * 9;
      const won = f.wins[i + 1] > k;
      ctx.save(); ctx.translate(wx, y + Hh + 8); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = won ? (i ? C.b : C.y) : '#1a2038'; ctx.fillRect(-3, -3, 6, 6);
      ctx.strokeStyle = '#05070e'; ctx.lineWidth = 1; ctx.strokeRect(-3, -3, 6, 6);
      ctx.restore();
    }
    // power gauge (bottom)
    const PW = 110, py = VIEW_H - 16;
    const px = i === 0 ? 14 : VIEW_W - 14 - PW;
    const lvl = Math.floor(c.power / 1000), part = (c.power % 1000) / 1000;
    const maxL = Math.floor(c.powerMax / 1000);
    para(px - 2, py - 2, PW + 4, 9, i === 0 ? 3 : -3, '#05070e');
    para(px, py, PW, 5, i === 0 ? 3 : -3, '#141a30');
    const full = lvl >= maxL;
    const pcol = ['#3ad6ff', '#ffbd68', '#ff593a', '#ffffff'][Math.min(3, lvl)];
    ctx.fillStyle = full ? ((f.gameTime >> 2) % 2 ? '#fff' : C.r) : pcol;
    const fillW = full ? PW : PW * part;
    ctx.fillRect(i === 0 ? px + 2 : px + PW - fillW - 2, py, fillW, 5);
    text(String(lvl), i === 0 ? px + PW + 12 : px - 12, py + 7, { size: 13, align: 'center', color: lvl ? pcol : C.dim, stroke: 3 });
    text('LV', i === 0 ? px + PW + 12 : px - 12, py - 5, { font: MONO(5), align: 'center', color: C.dim });
    // combo counter
    const cb = f.combos[i + 1];
    const show = cb.hits >= 2 ? { hits: cb.hits, dmg: cb.dmg, a: 1 } : cb.final ? { hits: cb.final.hits, dmg: cb.final.dmg, a: Math.min(1, cb.final.t / 30) } : null;
    if (show) {
      const cx = i === 0 ? 16 : VIEW_W - 16, al = i === 0 ? 'left' : 'right';
      text(String(show.hits), cx, 74, { size: 24, align: al, color: i ? C.b : C.y, stroke: 4, alpha: show.a });
      text('HITS', cx + (i === 0 ? 1 : -1), 86, { size: 9, align: al, color: C.ink, stroke: 3, alpha: show.a });
      text(`${show.dmg} DMG`, cx, 96, { font: MONO(6), align: al, color: C.ink, alpha: show.a });
    }
  }
  // timer
  const tx = VIEW_W / 2;
  ctx.save(); ctx.translate(tx, 18);
  ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 15); } ctx.closePath();
  ctx.fillStyle = '#05070e'; ctx.fill(); ctx.strokeStyle = C.y; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  const tv = f.training || !f.roundTimeSec ? '∞' : String(Math.max(0, f.timer));
  text(tv, tx, 24, { size: 14, align: 'center', color: f.timer <= 10 && !f.training && f.roundTimeSec ? C.r : C.ink });
  if (f.training) {
    text('TRAINING', tx, 44, { font: MONO(6), align: 'center', color: C.b });
    const lh = f.lastHit;
    if (lh) text(lh.guarded ? 'BLOCKED' : 'HIT', tx, 52, { font: MONO(6), align: 'center', color: lh.guarded ? C.b : C.y });
    drawInputLog(f.p1);
  }
}

// Training input display: P1's recent inputs (newest on top), relative to facing.
const ARROWS = { 0: '·', 1: '↑', 2: '↓', 4: '←', 8: '→', 5: '↖', 9: '↗', 6: '↙', 10: '↘' };
function drawInputLog(c) {
  const h = c.cmd?.hist; if (!h || !h.length) return;
  const rows = [];
  let prev = null, run = 0;
  for (let i = h.length - 1; i >= 0 && rows.length < 14; i--) {
    const e = h[i];
    const key = e.dir * 1000 + e.btn;
    if (prev === null || key === prev) { run++; prev = key; continue; }
    rows.push({ key: prev, run }); prev = key; run = 1;
  }
  if (prev !== null && rows.length < 14) rows.push({ key: prev, run });
  const names = [['x', 8], ['y', 16], ['z', 32], ['a', 1], ['b', 2], ['c', 4]];
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(4, 58, 54, 14 * 9 + 4);
  rows.forEach((r, i) => {
    const dir = Math.floor(r.key / 1000), btn = r.key % 1000;
    const y = 67 + i * 9;
    text(ARROWS[dir] ?? '·', 8, y, { font: MONO(8), color: C.ink });
    text(names.filter(([, b]) => btn & b).map(([n]) => n.toUpperCase()).join(''), 20, y, { font: MONO(7), color: C.y });
    text(String(Math.min(99, r.run)), 55, y, { font: MONO(6), color: C.dim, align: 'right' });
  });
  ctx.restore();
}

function drawMessages(f) {
  for (const m of f.messages) {
    const t = m.t, k = Math.min(1, t / 8), out = Math.max(0, (m.ticks - t) / 10);
    const a = Math.min(1, out);
    const cy = VIEW_H / 2 - 10;
    if (m.style === 'round') {
      ctx.save(); ctx.globalAlpha = a; para(-20 + (1 - k) * -400, cy - 18, VIEW_W + 40, 28, 10, 'rgba(5,7,14,0.75)'); ctx.restore();
      text(m.text, VIEW_W / 2 + (1 - k) * 200, cy + 4, { size: 20, align: 'center', color: C.ink, stroke: 4, alpha: a });
    } else if (m.style === 'fight') {
      const s = 1 + (1 - k) * 1.5;
      ctx.save(); ctx.translate(VIEW_W / 2, cy); ctx.scale(s, s); ctx.globalAlpha = a;
      ctx.font = FONT(30); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(m.text, 0, 10);
      ctx.fillStyle = C.r; ctx.fillText(m.text, 2, 12); ctx.fillStyle = C.y; ctx.fillText(m.text, 0, 10);
      ctx.restore();
    } else if (m.style === 'ko') {
      const s = 1 + Math.max(0, 1 - t / 6) * 2;
      ctx.save(); ctx.translate(VIEW_W / 2, cy); ctx.scale(s, s); ctx.globalAlpha = a;
      ctx.font = FONT(36); ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(m.text, 0, 12);
      ctx.fillStyle = C.r; ctx.fillText(m.text, 0, 12);
      if (m.sub) { ctx.font = FONT(12); ctx.fillStyle = C.y; ctx.fillText(m.sub, 0, 30); }
      ctx.restore();
    } else {
      text(m.text, VIEW_W / 2, cy + 40, { size: 14, align: 'center', color: C.y, stroke: 4, alpha: a });
    }
  }
}

function drawPause() {
  const pm = app.pauseMenu;
  ctx.fillStyle = 'rgba(5,7,14,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (pm.moves) { drawMoveList(pm.moves); return; }
  text('PAUSED', VIEW_W / 2, 40, { size: 18, align: 'center', color: C.y, stroke: 4 });
  pm.items.forEach((it, i) => {
    const sel = i === pm.idx, y = 66 + i * 14;
    if (sel) para(VIEW_W / 2 - 90, y - 10, 180, 13, 4, C.y);
    text(it.label, VIEW_W / 2 - 80, y, { size: 8.5, color: sel ? C.bg : C.ink });
    if (it.value) text(it.value(), VIEW_W / 2 + 80, y, { font: MONO(7), color: sel ? C.bg : C.b, align: 'right' });
  });
}
function drawMoveList(st) {
  const f = app.fight;
  const c = st.side ? f.p2 : f.p1;
  const ml = c.def.profile.movelist || {};
  text(`${c.def.displayName.toUpperCase()} — MOVE LIST`, 16, 22, { size: 11, color: st.side ? C.b : C.y, stroke: 3 });
  text('◀ ▶ switch fighter · ↑↓ scroll · any button: back', VIEW_W - 12, 22, { font: MONO(6), color: C.dim, align: 'right' });
  ctx.save(); ctx.beginPath(); ctx.rect(0, 30, VIEW_W, VIEW_H - 30); ctx.clip();
  let y = 44 - st.scroll;
  text('EASY', 230, y, { font: MONO(6), color: C.y }); text('CLASSIC', 320, y, { font: MONO(6), color: C.dim }); y += 4;
  for (const [sec, rows] of Object.entries(ml)) {
    y += 10;
    text(sec.toUpperCase(), 16, y, { size: 8, color: C.b }); y += 4;
    for (const [name, easy, classic] of rows) {
      y += 10;
      text(name, 22, y, { font: MONO(7), color: C.ink });
      text(easy, 230, y, { font: MONO(7), color: C.y });
      text(classic, 320, y, { font: MONO(6.5), color: C.dim });
    }
  }
  ctx.restore();
}

// Menus answer to either player's controls (arrows / numpad work too), except where
// each side drives its own cursor (versus character select) or while rebinding keys.
function mergeMenuInput(ins) {
  const own = (app.screen === 'select' && app.sel?.mode === 'versus') || app.screen === 'keys';
  if (!own) {
    const a = ins[0], b = ins[1];
    for (const k of ['up', 'down', 'left', 'right', 'ok', 'back', 'start']) a[k] = a[k] || b[k];
  }
  // Enter always confirms and Backspace always goes back in menus
  if (app.screen !== 'fight' && app.screen !== 'keys') {
    if (keyboard.latched.has('Enter') || keyboard.latched.has('NumpadEnter')) ins[0].ok = true;
    if (keyboard.latched.has('Backspace')) ins[0].back = true;
  }
  return ins;
}

// ---------------- key rebinding ----------------
const BIND_ROWS = [['U', 'Up'], ['D', 'Down'], ['L', 'Left'], ['R', 'Right'], ['x', 'Light (X)'], ['y', 'Medium (Y)'], ['z', 'Heavy (Z)'], ['a', 'A'], ['b', 'B'], ['c', 'C'], ['e', 'Easy special (E)'], ['q', 'Easy super (Q)'], ['s', 'Start / taunt']];
const DEFAULT_KEYS = JSON.parse(JSON.stringify(KEYMAPS));
function loadKeys() {
  try { const saved = JSON.parse(localStorage.getItem('logicalbends.keys') || 'null'); if (saved) for (let p = 0; p < 2; p++) Object.assign(KEYMAPS[p], saved[p]); } catch {}
}
function saveKeys() { localStorage.setItem('logicalbends.keys', JSON.stringify(KEYMAPS)); }
const keyName = (code) => (code || '—').replace(/^Key/, '').replace(/^Digit/, '').replace('Numpad', 'Num ').replace('Arrow', '').replace('Semicolon', ';').replace('Quote', "'").replace('Comma', ',').replace('Period', '.').replace('Slash', '/');
loadKeys();
screens.keys = {
  update(ins) {
    const k = app.keys ||= { side: 0, row: 0, waiting: false };
    if (k.waiting) {
      const code = [...keyboard.latched][0];
      if (!code) return;
      if (code === 'Escape') { k.waiting = false; audio.back(); return; }
      // a key can only do one thing per player: remove it from other actions first
      const map = KEYMAPS[k.side];
      for (const [act] of BIND_ROWS) map[act] = (map[act] || []).filter(c => c !== code);
      map[BIND_ROWS[k.row][0]] = [code];
      saveKeys(); k.waiting = false; audio.confirm();
      k.row = Math.min(BIND_ROWS.length + 1, k.row + 1);
      return;
    }
    const i = ins[0], j = ins[1];
    const up = i.up || j.up, down = i.down || j.down, left = i.left || j.left, right = i.right || j.right;
    const total = BIND_ROWS.length + 2;
    if (up) { k.row = (k.row + total - 1) % total; audio.move(); }
    if (down) { k.row = (k.row + 1) % total; audio.move(); }
    if (left || right) { k.side ^= 1; audio.move(); }
    const ok = keyboard.latched.has('Enter') || keyboard.latched.has('NumpadEnter');
    if (ok) {
      if (k.row < BIND_ROWS.length) { k.waiting = true; keyboard.latched.clear(); audio.confirm(); }
      else if (k.row === BIND_ROWS.length) { Object.assign(KEYMAPS[k.side], JSON.parse(JSON.stringify(DEFAULT_KEYS[k.side]))); saveKeys(); audio.confirm(); }
      else { audio.back(); go('options', { optIndex: 0 }); }
    }
    if (ins.esc || keyboard.latched.has('Backspace')) { audio.back(); go('options', { optIndex: 0 }); }
  },
  draw() {
    const k = app.keys ||= { side: 0, row: 0, waiting: false };
    wireBackdrop(app.t);
    text('CONTROLS SETUP', 20, 26, { size: 15, color: C.y, stroke: 3 });
    text('◀ ▶ switch player · Enter: rebind · Esc: back', VIEW_W - 14, 26, { font: MONO(6.5), color: C.ink, align: 'right' });
    ['PLAYER 1', 'PLAYER 2'].forEach((t, s) => { if (s === k.side) para(196 + s * 110, 33, 100, 12, 3, s ? '#3ad6ff' : C.y); text(t, 206 + s * 110, 42, { size: 8, color: s === k.side ? '#111' : C.ink }); });
    BIND_ROWS.forEach(([act, label], r) => {
      const y = 58 + r * 12.5, sel = r === k.row;
      if (sel) para(14, y - 9, 400, 11.5, 3, 'rgba(0,10,40,0.75)');
      text(label, 22, y, { font: MONO(7), color: sel ? C.y : C.ink });
      for (let s = 0; s < 2; s++) {
        const waiting = k.waiting && sel && s === k.side;
        const v = waiting ? ((app.t >> 4) % 2 ? 'PRESS A KEY…' : '') : (KEYMAPS[s][act] || []).map(keyName).join(' / ');
        text(v, 206 + s * 110, y, { font: MONO(7), color: waiting ? C.y : (s === k.side ? C.ink : C.dim) });
      }
    });
    const yr = 58 + BIND_ROWS.length * 12.5;
    [['RESET THIS PLAYER TO DEFAULTS', BIND_ROWS.length], ['BACK', BIND_ROWS.length + 1]].forEach(([t, r], n) => {
      const y = yr + n * 12.5 + 2;
      if (k.row === r) para(14, y - 9, 400, 11.5, 3, 'rgba(0,10,40,0.75)');
      text(t, 22, y, { font: MONO(7), color: k.row === r ? C.y : C.ink });
    });
    text('Gamepads: D-pad/stick move · X Y RB = Light Med Heavy · A B RT = A B C · LB = E · LT = Q · Start', VIEW_W / 2, VIEW_H - 5, { font: MONO(6), color: C.ink, align: 'center' });
  },
};

// ---------------- main loop ----------------
let last = performance.now();
const STEP = 1000 / 60;
function frame(now) {
  accum += Math.min(100, now - last);
  last = now;
  while (accum >= STEP) {
    accum -= STEP;
    const ins = mergeMenuInput(menuIn.poll());
    app.t++;
    screens[app.screen].update(ins);
    keyboard.latched.clear();
  }
  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  ctx.imageSmoothingEnabled = false;
  screens[app.screen].draw();
  if (settings.scanlines) drawScanlines();
  requestAnimationFrame(frame);
}
let scan = null;
function drawScanlines() {
  if (!scan || scan.width !== canvas.width) {
    scan = document.createElement('canvas'); scan.width = canvas.width; scan.height = canvas.height;
    const g = scan.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < scan.height; y += SC) g.fillRect(0, y, scan.width, Math.max(1, SC / 3));
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(scan, 0, 0); ctx.restore();
}
addEventListener('pointerdown', () => audio.ensure());
addEventListener('keydown', () => audio.ensure(), { once: true });
requestAnimationFrame(frame);
boot();
window.fightwire = app; // handy for debugging in the console
// Debug hooks: step the simulation without requestAnimationFrame (used for automated testing).
window.fwDebug = {
  settings, startSelect, startFight, go,
  step(n = 1, keys = null) {
    for (let i = 0; i < n; i++) {
      if (keys) for (const k of keys) keyboard.latched.add(k);
      const ins = mergeMenuInput(menuIn.poll()); app.t++; screens[app.screen].update(ins); keyboard.latched.clear();
    }
    ctx.setTransform(SC, 0, 0, SC, 0, 0); screens[app.screen].draw();
  },
  hold(codes, on = true) { for (const c of codes) on ? keyboard.down.add(c) : keyboard.down.delete(c); },
  quickFight(p1 = 0, p2 = 0, pal1 = 0, pal2 = 1, mode = 'cpu', stage = 0) {
    startSelect(mode); Object.assign(app.sel, { pick: [p1, p2], pal: [pal1, pal2], locked: [true, true], stage });
    startFight();
  },
};
