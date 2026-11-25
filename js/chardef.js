// FIGHTWIRE — loads a MUGEN character folder into a shared CharDef.
import { parseIni, unquote, fetchBytes, fetchText, bytesToText, numList } from './util.js';
import { loadSFF, decodeAll, palFromACT } from './sff.js';
import { parseAIR } from './air.js';
import { parseSND } from './audio.js';
import { parseStates, parseCommands } from './cns.js';

let commonStates = null;
export async function loadCommon() {
  if (commonStates) return commonStates;
  commonStates = parseStates(await fetchText('data/common1.cns'), 'common1').states;
  return commonStates;
}

const CONST_DEFAULTS = {
  'data.life': 1000, 'data.power': 3000, 'data.attack': 100, 'data.defence': 100,
  'data.fall.defence_up': 50, 'data.liedown.time': 60, 'data.airjuggle': 15,
  'data.sparkno': 2, 'data.guard.sparkno': 40, 'data.ko.echo': 0, 'data.volume': 0,
  'data.intpersistindex': 60, 'data.floatpersistindex': 40,
  'size.xscale': 1, 'size.yscale': 1, 'size.ground.back': 15, 'size.ground.front': 16,
  'size.air.back': 12, 'size.air.front': 12, 'size.height': 60, 'size.attack.dist': 160,
  'size.proj.attack.dist': 90, 'size.proj.doscale': 0, 'size.head.pos.x': -5, 'size.head.pos.y': -90,
  'size.mid.pos.x': -5, 'size.mid.pos.y': -60, 'size.shadowoffset': 0, 'size.draw.offset.x': 0, 'size.draw.offset.y': 0,
  'velocity.walk.fwd.x': 2.4, 'velocity.walk.back.x': -2.2, 'velocity.run.fwd.x': 4.6, 'velocity.run.fwd.y': 0,
  'velocity.run.back.x': -4.5, 'velocity.run.back.y': -3.8, 'velocity.jump.y': -8.4, 'velocity.jump.neu.x': 0, 'velocity.jump.neu.y': -8.4,
  'velocity.jump.back.x': -2.55, 'velocity.jump.fwd.x': 2.5, 'velocity.runjump.back.x': -2.55, 'velocity.runjump.back.y': -8.1,
  'velocity.runjump.fwd.x': 4, 'velocity.runjump.fwd.y': -8.1, 'velocity.airjump.neu.x': 0, 'velocity.airjump.neu.y': -8.1,
  'velocity.airjump.back.x': -2.55, 'velocity.airjump.fwd.x': 2.5,
  'velocity.air.gethit.groundrecover.x': -0.15, 'velocity.air.gethit.groundrecover.y': -3.5,
  'velocity.air.gethit.airrecover.mul.x': 0.5, 'velocity.air.gethit.airrecover.mul.y': 0.2,
  'velocity.air.gethit.airrecover.add.x': 0, 'velocity.air.gethit.airrecover.add.y': -4.5,
  'velocity.air.gethit.airrecover.back': -1, 'velocity.air.gethit.airrecover.fwd': 0,
  'velocity.air.gethit.airrecover.up': -2, 'velocity.air.gethit.airrecover.down': 1.5,
  'movement.airjump.num': 0, 'movement.airjump.height': 35, 'movement.yaccel': 0.44,
  'movement.stand.friction': 0.85, 'movement.crouch.friction': 0.82,
  'movement.stand.friction.threshold': 2, 'movement.crouch.friction.threshold': 0.05,
  'movement.air.gethit.groundlevel': 25, 'movement.air.gethit.groundrecover.ground.threshold': -20,
  'movement.air.gethit.groundrecover.groundlevel': 10, 'movement.air.gethit.airrecover.threshold': -1,
  'movement.air.gethit.airrecover.yaccel': 0.35, 'movement.air.gethit.trip.groundlevel': 15,
  'movement.down.bounce.offset.x': 0, 'movement.down.bounce.offset.y': 20, 'movement.down.bounce.yaccel': 0.4,
  'movement.down.bounce.groundlevel': 12, 'movement.down.friction.threshold': 0.05,
};

function readConsts(sections) {
  const consts = { ...CONST_DEFAULTS };
  const quotes = [];
  for (const s of sections) {
    const sec = s.lname;
    if (sec === 'quotes') {
      for (const [k, v] of s.entries) { const m = k.match(/^victory(\d+)$/); if (m) quotes[+m[1]] = unquote(v); }
      continue;
    }
    if (!['data', 'size', 'velocity', 'movement'].includes(sec)) continue;
    for (const [k, v] of s.entries) {
      const parts = v.split(',').map(t => parseFloat(t));
      const base = sec + '.' + k;
      if (parts.length >= 2 && !isNaN(parts[1])) {
        consts[base + '.x'] = parts[0] || 0; consts[base + '.y'] = parts[1] || 0;
        if (sec === 'velocity' && k === 'jump.neu') consts['velocity.jump.y'] = parts[1];
        if (sec === 'velocity' && k === 'runjump.fwd') consts['velocity.runjump.y'] = parts[1];
        if (sec === 'velocity' && k === 'airjump.neu') consts['velocity.airjump.y'] = parts[1];
      } else if (!isNaN(parts[0])) {
        consts[base] = parts[0];
        // single-valued velocities are x components
        if (sec === 'velocity') consts[base + '.x'] = parts[0];
      }
    }
  }
  return { consts, quotes };
}

export class CharDef {
  static async load(folder, defName, onProgress = () => {}) {
    const cd = new CharDef();
    cd.folder = folder;
    const base = `chars/${folder}/`;
    cd.base = base;
    try { cd.profile = JSON.parse(await fetchText(base + 'fightwire.json')); } catch { cd.profile = {}; }
    defName = defName || cd.profile.def || folder + '.def';
    const defSecs = parseIni(await fetchText(base + defName));
    const info = defSecs.find(s => s.lname === 'info')?.map || {};
    const files = defSecs.find(s => s.lname === 'files')?.map || {};
    cd.name = unquote(info.name || folder);
    cd.displayName = unquote(info.displayname || cd.name);
    cd.author = unquote(info.author || '');
    cd.localcoord = numList(info.localcoord, [320, 240]);
    cd.mugenversion = info.mugenversion || '';

    onProgress('Reading states', 0.05);
    const stFiles = [];
    if (files.cmd) stFiles.push(files.cmd);
    if (files.st) stFiles.push(files.st);
    for (let i = 0; i <= 9; i++) if (files['st' + i]) stFiles.push(files['st' + i]);
    if (files.cns && !stFiles.includes(files.cns)) stFiles.push(files.cns);
    const states = new Map();
    const texts = {};
    for (const f of stFiles) {
      const t = texts[f] ??= await fetchText(base + f);
      const parsed = parseStates(t, f);
      for (const [no, st] of parsed.states) if (!states.has(no)) states.set(no, st);
    }
    cd.states = states;
    const cnsText = texts[files.cns] ?? await fetchText(base + files.cns);
    const { consts, quotes } = readConsts(parseStates(cnsText).others);
    cd.consts = consts;
    cd.quotes = quotes.filter(Boolean);
    const cmdText = files.cmd ? (texts[files.cmd] ?? await fetchText(base + files.cmd)) : '';
    cd.commands = parseCommands(cmdText);
    cd.common = await loadCommon();

    onProgress('Reading animations', 0.15);
    cd.anims = parseAIR(await fetchText(base + files.anim));

    onProgress('Loading sprites', 0.2);
    cd.sff = await loadSFF(await fetchBytes(base + files.sprite));
    await decodeAll(cd.sff, p => onProgress('Decoding sprites', 0.2 + p * 0.5));

    onProgress('Loading sounds', 0.75);
    cd.snd = files.sound ? parseSND(await fetchBytes(base + files.sound)) : new Map();

    // palettes
    onProgress('Loading palettes', 0.9);
    cd.palettes = [];
    const order = cd.profile.palettes;
    const palFiles = order && order.length ? order : Array.from({ length: 12 }, (_, i) => files['pal' + (i + 1)]).filter(Boolean);
    for (const pf of palFiles) {
      try { cd.palettes.push({ file: pf, pal: palFromACT(await fetchBytes(base + pf)) }); } catch {}
    }
    if (cd.sff.version === 2) {
      cd.palettes = [];
      for (let i = 1; i <= 12; i++) {
        const idx = cd.sff.palMap.get(1 * 65536 + i);
        if (idx != null) cd.palettes.push({ file: `1,${i}`, pal: cd.sff.palettes[idx] });
      }
    }
    if (!cd.palettes.length && cd.sff.defaultPal) cd.palettes.push({ file: 'sff', pal: cd.sff.defaultPal });
    onProgress('Ready', 1);
    return cd;
  }
  getState(no) {
    return this.states.get(no) || this.common.get(no) || null;
  }
}

export async function loadFightFX() {
  const sff = await loadSFF(await fetchBytes('data/fightfx.sff'));
  await decodeAll(sff);
  const anims = parseAIR(await fetchText('data/fightfx.air'));
  const snd = parseSND(await fetchBytes('data/common.snd'));
  return { sff, anims, snd, palettes: [{ pal: sff.defaultPal }], isFX: true };
}
