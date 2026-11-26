import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Char, parseAttr } from '../js/char.js';
import { Fight } from '../js/fight.js';
import { parseStates } from '../js/cns.js';

const stateFile = name => readFile(new URL('../chars/' + name, import.meta.url), 'latin1');

test('Real Police Dude guard reaction restores only horizontal velocity', async () => {
  const { states } = parseStates(await stateFile('realpolicedude/RealPoliceDude.cns'));
  const ctrl = states.get(151).ctrls.find(c => c.type === 'hitvelset');
  const fighter = { vel: { x: 0, y: -3 }, ghv: { xvel: -5, yvel: 2 } };
  Char.prototype.exec.call(fighter, ctrl);
  assert.deepEqual(fighter.vel, { x: -5, y: -3 });
});

test('hit filters share two slots and preserve strike, projectile and throw classes', () => {
  const defender = { hitBy: [null, null], statetype: 'S', teamSide: 2 };
  defender.stateOwner = defender;
  const attacker = { teamSide: 1 };
  const permit = type => Fight.prototype.canBeHit.call({}, attacker, defender, {
    attr: parseAttr('S,' + type), affectteam: 'e', hitTargets: new Set(), hitflag: 'M',
  });
  const write = (type, params) => Char.prototype.exec.call(defender, { type, params, pc: {} });
  write('nothitby', { value: 'SCA,AA' });
  assert.equal(permit('HA'), false);
  assert.equal(permit('NT'), true);
  assert.equal(permit('SP'), true);
  write('hitby', { value: 'SCA,AA,AP' });
  write('hitby', { value2: 'SCA,NA,NT' });
  assert.equal(permit('NA'), true);
  for (const type of ['NT', 'SP', 'HA']) assert.equal(permit(type), false);
  write('nothitby', { value2: 'SCA,NA', time: '0' });
  assert.equal(permit('SP'), true);
});
