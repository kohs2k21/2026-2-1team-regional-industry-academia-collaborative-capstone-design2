import test from 'node:test';
import assert from 'node:assert/strict';
import { applySimulationAction, emptySimulation, parseSimulation, portfolioSummary, saveLinkedPrinciple, simulationStocks, tradeLabel } from '../src/simulation.ts';

const date = '2026-10-14T06:00:00.000Z';
const action = (mode, quantity, price = 50000, accountId = 'account-a') => ({ mode, quantity, price, accountId, stockId: 'hanbit' });
const apply = (state, mode, quantity, price, id = 'trade-1', accountId) => applySimulationAction(state, action(mode, quantity, price, accountId), id, date);
const seeded = () => apply(emptySimulation(), 'seed', 10, 50000);

test('ten distinct fictional stocks are available and opening holdings create no trades', () => {
  assert.equal(new Set(simulationStocks.map(stock => stock.id)).size, 10);
  const state = seeded();
  assert.equal(state.holdings[0].quantity, 10);
  assert.equal(state.trades.length, 0);
  assert.deepEqual(portfolioSummary(state, 'account-a'), { cost: 500000, value: 500000, realized: 0, profit: 0, percent: 0 });
});

test('10 opening shares + buy 5 - sell 3 leaves 12 shares and precisely two trades', () => {
  const start = seeded();
  const bought = apply(start, 'buy', 5, 60000);
  const sold = apply(bought, 'sell', 3, 47000, 'trade-2');
  assert.equal(sold.holdings[0].quantity, 12);
  assert.equal(sold.trades.length, 2);
  assert.equal(sold.holdings[0].averagePrice, 800000 / 15);
  assert.deepEqual(sold.trades.map(item => [item.beforeQuantity, item.afterQuantity]), [[15, 12], [10, 15]]);
  const summary = portfolioSummary(sold, 'account-a');
  assert.ok(Math.abs(summary.cost - 640000) < 1e-6);
  assert.ok(Math.abs(summary.realized + 19000) < 1e-6);
  assert.equal(start.holdings[0].quantity, 10);
  assert.equal(tradeLabel(sold.trades[0]), '부분 매도');
});

test('full liquidation preserves the transaction for reflection and rebuy resets average cost', () => {
  const sold = apply(seeded(), 'sell', 10, 47000);
  assert.equal(sold.holdings[0].quantity, 0);
  assert.equal(sold.trades.length, 1);
  assert.equal(tradeLabel(sold.trades[0]), '전량 매도');
  assert.equal(portfolioSummary(sold, 'account-a').realized, -30000);
  const rebought = apply(sold, 'buy', 2, 45000, 'trade-2');
  assert.equal(rebought.holdings[0].averagePrice, 45000);
  assert.equal(tradeLabel(rebought.trades[0]), '매수');
});

test('overselling, invalid numbers and duplicate registration do not mutate the ledger', () => {
  const state = seeded();
  for (const [mode, quantity, price] of [['sell', 11, 50000], ['buy', 0, 50000], ['buy', 1.5, 50000], ['buy', NaN, 50000], ['buy', 1, -1], ['buy', 1, Infinity], ['buy', 1000000, 50000], ['seed', 10, 50000]]) {
    assert.throws(() => apply(state, mode, quantity, price));
  }
  assert.equal(state.holdings[0].quantity, 10);
  assert.equal(state.trades.length, 0);
  assert.throws(() => apply(emptySimulation(), 'sell', 1, 50000));
});

test('accounts have independent holdings, transactions and summaries', () => {
  const state = apply(seeded(), 'buy', 5, 60000, 'trade-b', 'account-b');
  assert.equal(state.holdings.find(item => item.accountId === 'account-a').quantity, 10);
  assert.equal(state.holdings.find(item => item.accountId === 'account-b').quantity, 5);
  assert.equal(portfolioSummary(state, 'account-a').value, 500000);
  assert.equal(portfolioSummary(state, 'account-b').cost, 300000);
});

test('valid persisted records round trip including a zero balance position', () => {
  const state = apply(seeded(), 'sell', 10, 50000);
  assert.deepEqual(parseSimulation(JSON.stringify(state)), state);
  assert.deepEqual(parseSimulation(null), emptySimulation());
});

test('malformed persisted snapshots, dates, unknown stocks and duplicate ids are rejected', () => {
  const state = apply(seeded(), 'buy', 1, 50000);
  for (const change of [
    data => { data.holdings[0].quantity = -1; },
    data => { data.trades[0].stockId = 'unknown'; },
    data => { data.trades[0].createdAt = 'bad-date'; },
    data => { data.trades[0].afterQuantity = 99; },
    data => { data.trades.push(data.trades[0]); },
    data => { data.holdings.push(data.holdings[0]); },
  ]) {
    const data = structuredClone(state); change(data);
    assert.throws(() => parseSimulation(JSON.stringify(data)));
  }
  assert.throws(() => parseSimulation('{'));
});

test('revisiting one trade updates one principle and preserves its id and original date', () => {
  const trade = apply(seeded(), 'buy', 1, 50000).trades[0];
  const legacy = { id: 'legacy', createdAt: date, text: 'Old principle' };
  const first = { id: 'first', createdAt: date, text: 'First', trade };
  const items = saveLinkedPrinciple([legacy], first);
  const updated = saveLinkedPrinciple(items, { ...first, id: 'second', createdAt: '2026-10-15T06:00:00Z', text: 'Updated' });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].id, 'first');
  assert.equal(updated[0].createdAt, date);
  assert.equal(updated[0].text, 'Updated');
  assert.deepEqual(updated[1], legacy);
  const anotherTrade = { ...trade, id: 'another-trade' };
  assert.equal(saveLinkedPrinciple(updated, { ...first, id: 'third', trade: anotherTrade }).length, 3);
});

test('duplicate trade ids are rejected before any holding is committed', () => {
  const state = apply(seeded(), 'buy', 1, 50000);
  assert.throws(() => apply(state, 'buy', 1, 50000));
  assert.equal(state.holdings[0].quantity, 11);
  assert.equal(state.trades.length, 1);
});
