import assert from 'node:assert/strict';
import test from 'node:test';
import { AnimPlayer, parseAIR } from '../js/air.js';
import { compile } from '../js/expr.js';

function player(lines) {
  return new AnimPlayer(parseAIR(['[Begin Action 0]', ...lines].join('\n')).get(0));
}

test('AnimTime reaches zero after the last full tick, including later loops', () => {
  const anim = player(['0,0,0,0,2', 'LoopStart', '0,1,0,0,3']);
  const times = [];
  for (let tick = 0; tick <= 8; tick++) {
    times.push(anim.animTime());
    if (tick === 5) {
      assert.equal(anim.elemNo(), 2);
      assert.equal(anim.elemStarted(2), false);
      assert.equal(anim.elemTimeOf(2), 3);
    }
    anim.step();
  }
  assert.deepEqual(times, [-5, -4, -3, -2, -1, 0, -2, -1, 0]);
});

test('a held frame fires its entry trigger once', () => {
  const anim = player(['0,0,0,0,-1']);
  const entered = compile('AnimElem = 1');
  assert.equal(entered.f({ anim }), 1);
  anim.step();
  assert.equal(entered.f({ anim }), 0);
});

test('AnimElem can compare time before a valid future element', () => {
  const anim = player(['0,0,0,0,3', '0,1,0,0,2']);
  const before = compile('AnimElem = 2, < 0');
  assert.equal(before.f({ anim }), 1);
  assert.equal(compile('AnimElem = 3, < 0').f({ anim }), 0);
  for (let t = 0; t < 3; t++) anim.step();
  assert.equal(before.f({ anim }), 0);
});
