import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { Fight } from '../js/fight.js';
import { CharDef } from '../js/chardef.js';
import { keyboard } from '../js/input.js';

globalThis.window = {};
globalThis.fetch = async path => new Response(await readFile(new URL('../' + path, import.meta.url)));

test('Up specials work together or during jump startup on either side', async () => {
  const def = await CharDef.load('uppercut');
  for (const side of [1, 2]) {
    const up = side === 1 ? 'KeyW' : 'ArrowUp';
    const special = side === 1 ? 'KeyE' : 'Numpad7';
    for (const lead of [0, 1, 2]) {
      const fight = new Fight({ p1: { def }, p2: { def }, mode: 'training' });
      fight.roundState = 2;
      const c = fight.roots[side - 1];
      c.changeState(0, 1);
      keyboard.down = new Set([up]);
      for (let tick = 0; tick < lead; tick++) fight.tick();
      if (lead) assert.equal(c.stateNo, 40);
      keyboard.down.add(special);
      fight.tick();
      assert.equal(c.stateNo, 1010, 'P' + side + ', Up lead ' + lead);
      keyboard.down.clear();
    }
  }
});
