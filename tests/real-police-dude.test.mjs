import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { CharDef, loadFightFX } from '../js/chardef.js';
import { Fight } from '../js/fight.js';
import { keyboard } from '../js/input.js';

globalThis.window = {};
globalThis.fetch = async path => new Response(await readFile(new URL('../' + path, import.meta.url)));

test('Real Police Dude recovers after Speedrunning Tactics and gets timed throw protection', async () => {
  const def = await CharDef.load('realpolicedude');
  const fight = new Fight({
    p1: { def }, p2: { def, dummy: { mode: 'stand' } },
    fx: await loadFightFX(), mode: 'training',
  });
  const player = fight.p1;
  fight.roundState = 2;
  player.changeState(0, 1);
  keyboard.down = new Set(['KeyW', 'KeyE']);
  fight.tick();
  keyboard.down.clear();
  assert.equal(player.stateNo, 1310);
  let downTick, riseTick;
  for (let tick = 1; tick <= 600; tick++) {
    fight.tick();
    if (player.stateNo === 5110) downTick ??= tick;
    if (player.stateNo === 5120) riseTick ??= tick;
    if (riseTick && player.stateNo === 0 && player.ctrl) break;
  }
  assert.equal(riseTick - downTick, def.consts['data.liedown.time']);
  assert.equal(player.stateNo, 0);
  assert.equal(player.ctrl, 1);
  const canHit = type => fight.canBeHit(fight.p2, player, {
    attr: { st: 'S', types: [type] }, affectteam: 'e', hitTargets: new Set(), hitflag: 'M',
  });
  for (let t = 0; t < 16; t++) fight.tick();
  assert.equal(canHit('NA'), true);
  for (const type of ['NT', 'ST', 'HT']) assert.equal(canHit(type), false);
  for (let t = 0; t < 4; t++) fight.tick();
  assert.equal(canHit('NT'), true);
});

test('Real Police Dude helpers use their authored size and pass it to nested helpers', async () => {
  const def = await CharDef.load('realpolicedude');
  const fight = new Fight({ p1: { def }, p2: { def, dummy: { mode: 'stand' } }, fx: await loadFightFX(), mode: 'training' });
  fight.roundState = 2;
  const player = fight.p1;
  player.changeState(0, 1);
  player.cmd.force('Armor', 2);
  for (let i = 0; i < 50; i++) fight.tick();
  const ashley = player.helpers.find(h => h.helperId === 1960);
  const timer = player.helpers.find(h => h.helperId === 1965);
  assert.equal(ashley.constant('size.xscale'), 1.3);
  assert.equal(timer.constant('size.yscale'), 1.3);
  assert.equal(player.constant('size.xscale'), 1);

  const frame = ashley.anim.frame();
  const first = frame.clsn2[0];
  const [left, top, right, bottom] = fight.boxes(ashley, 2)[0];
  assert.ok(Math.abs((right - left) - (first[2] - first[0]) * 1.3) < 1e-8);
  assert.ok(Math.abs((bottom - top) - (first[3] - first[1]) * 1.3) < 1e-8);

  let drawn;
  fight.blit = (...args) => { drawn = args.at(-1); };
  fight.drawChar({}, ashley);
  assert.deepEqual([drawn.xs, drawn.ys], [1.3, 1.3]);

  const shellController = [...def.states.values()].flatMap(s => s.ctrls).find(c =>
    c.type === 'helper' && c.params.id === '224' && c.params['size.xscale'] === '0.65');
  player.exec(shellController);
  const shell = player.helpers.at(-1);
  assert.equal(shell.helperId, 224);
  assert.deepEqual([shell.xscale, shell.yscale], [0.65, 0.65]);
});
