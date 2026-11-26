import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const events = new EventTarget();
globalThis.addEventListener = events.addEventListener.bind(events);
globalThis.window = {};
globalThis.fetch = async path => new Response(await readFile(new URL('../' + path, import.meta.url)));

const { CommandBuffer, DIR, BTN, keyboard } = await import('../js/input.js');
const { Fight } = await import('../js/fight.js');
const { CharDef } = await import('../js/chardef.js');

test('attack consumption keeps motion history, while a round reset discards it', () => {
  for (const action of ['clear', 'reset']) {
    const buffer = new CommandBuffer([{ name: 'forward punch', command: 'F,x', time: 10, buffertime: 1 }]);
    buffer.push(DIR.F, 0);
    buffer.update(true);
    buffer[action]();
    buffer.push(0, BTN.x);
    buffer.update(false);
    assert.equal(buffer.isActive('forward punch'), action === 'clear');
  }
});

test('focus loss releases held keys and drops pending taps', () => {
  keyboard.down.add('KeyE');
  keyboard.latched.add('KeyE');
  events.dispatchEvent(new Event('blur'));
  assert.equal(keyboard.down.size, 0);
  assert.equal(keyboard.latched.size, 0);
});

test('restart clears both fighters and the HUD and preserves round wins', async () => {
  const def = await CharDef.load('uppercut');
  const fight = new Fight({ p1: { def }, p2: { def, ai: 4 } });
  fight.wins[1] = 1;
  fight.lastHit = { a: fight.p1, d: fight.p2 };
  for (const c of fight.roots) {
    fight.combos[c.teamSide].final = { hits: 4, dmg: 120, t: 30 };
    c.combo.recvHits = 4;
    c.cmd.push(DIR.F, BTN.x);
    c.cmd.force('attack');
  }
  fight.startRound(false);
  for (const c of fight.roots) {
    assert.equal(c.cmd.hist.length, 0);
    assert.equal(c.cmd.isActive('attack'), false);
    assert.equal(c.combo.recvHits ?? 0, 0);
    assert.equal(fight.combos[c.teamSide].final, undefined);
  }
  assert.equal(fight.lastHit, null);
  assert.equal(fight.wins[1], 1);
});
