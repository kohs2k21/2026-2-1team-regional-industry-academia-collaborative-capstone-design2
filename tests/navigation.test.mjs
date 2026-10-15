import test from 'node:test';
import assert from 'node:assert/strict';
import { navigateScreens, screenTab } from '../src/navigation.ts';

test('tab switches replace peers while pushed screens return to their actual origin', () => {
  let stack = [{ view: 'landing' }];
  for (const tab of ['trades', 'patterns', 'principles', 'trades']) {
    stack = navigateScreens(stack, { type: 'tab', tab });
    assert.deepEqual(stack, [{ view: 'landing' }, { view: tab }]);
  }
  for (const origin of [{ view: 'trade', id: 'trade-a' }, { view: 'patterns' }, { view: 'principle', id: 'principle-a' }]) {
    const previous = [...stack, origin];
    for (const view of ['chat', 'settings']) {
      const pushed = navigateScreens(previous, { type: 'push', screen: { view } });
      assert.deepEqual(navigateScreens(pushed, { type: 'back' }), previous);
      assert.deepEqual(navigateScreens(pushed, { type: 'push', screen: { view } }), pushed);
    }
  }
  assert.deepEqual(navigateScreens(stack, { type: 'back' }), [{ view: 'landing' }]);
  const directEntry = [{ view: 'trades' }];
  const detail = navigateScreens(directEntry, { type: 'push', screen: { view: 'trade', id: 'trade-a' } });
  const chat = navigateScreens(detail, { type: 'push', screen: { view: 'chat' } });
  assert.deepEqual(navigateScreens(chat, { type: 'back' }), detail);
  assert.deepEqual(navigateScreens(detail, { type: 'back' }), directEntry);
  assert.deepEqual(navigateScreens(directEntry, { type: 'back' }), directEntry);
  assert.deepEqual(navigateScreens(chat, { type: 'tab', tab: 'patterns' }), [{ view: 'patterns' }]);
  assert.equal(screenTab({ view: 'trade', id: 'a' }), 'trades');
  assert.equal(screenTab({ view: 'principle', id: 'b' }), 'principles');
});
