export const simulationStocks = [
  { id: 'hanbit', name: '한빛테크', sector: '반도체', price: 50000 },
  { id: 'saebom', name: '새봄에너지', sector: '에너지', price: 32000 },
  { id: 'mirai', name: '미래모빌리티', sector: '자동차', price: 78000 },
  { id: 'nuri', name: '누리플랫폼', sector: '인터넷', price: 42000 },
  { id: 'gaon', name: '가온바이오', sector: '바이오', price: 26000 },
  { id: 'haesol', name: '해솔리테일', sector: '유통', price: 18000 },
  { id: 'saeron', name: '새론금융', sector: '금융', price: 55000 },
  { id: 'bitna', name: '빛나배터리', sector: '배터리', price: 64000 },
  { id: 'haneul', name: '하늘콘텐츠', sector: '콘텐츠', price: 23000 },
  { id: 'daon', name: '다온로보틱스', sector: '로봇', price: 36000 },
] as const;

export type Holding = { accountId: string; stockId: string; quantity: number; averagePrice: number };
export type TradeMarketSnapshot = { source: 'fictional'; change: number; volumeRatio: number; marketChange: number; weightBefore: number; weightAfter: number; prices: number[] };
export type TradeRecord = {
  id: string; accountId: string; stockId: string; side: 'buy' | 'sell'; quantity: number;
  price: number; beforeQuantity: number; afterQuantity: number; averagePriceBefore: number; createdAt: string; market?: TradeMarketSnapshot;
};
export type Simulation = { holdings: Holding[]; trades: TradeRecord[] };
export type SimulationAction = {
  mode: 'seed' | 'buy' | 'sell'; accountId: string; stockId: string; quantity: number; price: number;
};
export const emptySimulation = (): Simulation => ({ holdings: [], trades: [] });
export const stockFor = (id: string) => simulationStocks.find(stock => stock.id === id)!;
export const won = (amount: number) => Math.round(amount).toLocaleString('ko-KR');
export function tradeLabel(trade: TradeRecord) {
  return trade.side === 'sell' ? (trade.afterQuantity === 0 ? '전량 매도' : '부분 매도') : trade.beforeQuantity > 0 ? '추가 매수' : '매수';
}
export function tradeTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

// Initial holdings are a baseline. Only subsequent buy/sell actions create a trade.
export function applySimulationAction(state: Simulation, action: SimulationAction, id: string, createdAt: string): Simulation {
  const { accountId, stockId, mode, quantity, price } = action;
  if (!accountId || !stockFor(stockId)) throw new Error('종목과 계좌를 선택해 주세요.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) throw new Error('수량은 1~1,000,000주의 정수로 입력해 주세요.');
  if (!Number.isSafeInteger(price) || price < 1 || price > 100000000) throw new Error('가격은 1~100,000,000원의 정수로 입력해 주세요.');
  const holding = state.holdings.find(item => item.accountId === accountId && item.stockId === stockId);
  if (mode === 'seed' && holding) throw new Error('이미 등록한 종목입니다. 매수로 수량을 추가해 주세요.');
  if (mode === 'sell' && quantity > (holding?.quantity || 0)) throw new Error('보유수량보다 많이 매도할 수 없어요.');
  const beforeQuantity = holding?.quantity || 0;
  const afterQuantity = mode === 'sell' ? beforeQuantity - quantity : beforeQuantity + quantity;
  if (afterQuantity > 1000000) throw new Error('종목당 최대 보유수량은 1,000,000주예요.');
  const averagePrice = mode === 'sell' ? holding!.averagePrice : ((holding?.averagePrice || 0) * beforeQuantity + price * quantity) / afterQuantity;
  const nextHolding = { accountId, stockId, quantity: afterQuantity, averagePrice };
  const holdings = holding ? state.holdings.map(item => item === holding ? nextHolding : item) : [...state.holdings, nextHolding];
  if (mode === 'seed') return { holdings, trades: state.trades };
  if (!id || state.trades.some(trade => trade.id === id) || !Number.isFinite(Date.parse(createdAt))) throw new Error('거래 기록을 확인해 주세요.');
  // Capture simulated context at execution; later orders must not rewrite this trade's weights.
  const totalValue = (positions: Holding[]) => positions.filter(item => item.accountId === accountId)
    .reduce((sum, item) => sum + item.quantity * (item.stockId === stockId ? price : stockFor(item.stockId).price), 0);
  const beforeValue = totalValue(state.holdings), afterValue = totalValue(holdings);
  const stockIndex = simulationStocks.findIndex(stock => stock.id === stockId);
  const change = [8.3, -4.6, 2.8, -1.2, 11.4][stockIndex % 5];
  const market: TradeMarketSnapshot = { source: 'fictional', change, volumeRatio: Number((1.2 + stockIndex % 5 * .4).toFixed(1)), marketChange: [-.7, .4, 1.1][stockIndex % 3],
    weightBefore: beforeValue ? Number((beforeQuantity * price / beforeValue * 100).toFixed(1)) : 0,
    weightAfter: afterValue ? Number((afterQuantity * price / afterValue * 100).toFixed(1)) : 0,
    prices: [.93, .95, .94, .98, .97, .995, 1, 1.012, .987, 1.025].map((ratio, point) => Math.max(1, Math.round(price * (point < 6 && change < 0 ? 2 - ratio : ratio)))) };
  const trade: TradeRecord = { id, accountId, stockId, side: mode, quantity, price, beforeQuantity, afterQuantity, averagePriceBefore: holding?.averagePrice || 0, createdAt, market };
  return { holdings, trades: [trade, ...state.trades] };
}

export function portfolioSummary(state: Simulation, accountId: string) {
  const holdings = state.holdings.filter(item => item.accountId === accountId);
  const cost = holdings.reduce((sum, item) => sum + item.quantity * item.averagePrice, 0);
  const value = holdings.reduce((sum, item) => sum + item.quantity * stockFor(item.stockId).price, 0);
  const realized = state.trades.filter(item => item.accountId === accountId && item.side === 'sell')
    .reduce((sum, item) => sum + (item.price - item.averagePriceBefore) * item.quantity, 0);
  return { cost, value, realized, profit: value - cost, percent: cost ? (value - cost) / cost * 100 : 0 };
}

export function parseSimulation(raw: string | null): Simulation {
  if (!raw) return emptySimulation();
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.holdings) || !Array.isArray(data.trades)) throw new Error('Invalid portfolio');
  const validQuantity = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
  const validPrice = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 100000000;
  const validBase = (item: Pick<Holding, 'accountId' | 'stockId'>) => item && typeof item.accountId === 'string' && item.accountId.length > 0 && !!stockFor(item.stockId);
  if (!data.holdings.every((item: Holding) => validBase(item) && validQuantity(item.quantity) && validPrice(item.averagePrice)) ||
    !data.trades.every((item: TradeRecord) => validBase(item) && typeof item.id === 'string' && item.id.length > 0 &&
      ['buy', 'sell'].includes(item.side) && validQuantity(item.quantity) && item.quantity > 0 && validPrice(item.price) &&
      validQuantity(item.beforeQuantity) && validQuantity(item.afterQuantity) && typeof item.averagePriceBefore === 'number' &&
      Number.isFinite(item.averagePriceBefore) && item.averagePriceBefore >= 0 && item.averagePriceBefore <= 100000000 &&
      typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) &&
      item.afterQuantity === item.beforeQuantity + (item.side === 'buy' ? item.quantity : -item.quantity))) throw new Error('Invalid portfolio');
  if (new Set(data.holdings.map((item: Holding) => `${item.accountId}:${item.stockId}`)).size !== data.holdings.length ||
      new Set(data.trades.map((item: TradeRecord) => item.id)).size !== data.trades.length) throw new Error('Duplicate records');
  if (!data.trades.every((item: TradeRecord) => !item.market || (item.market.source === 'fictional' &&
      [item.market.change, item.market.volumeRatio, item.market.marketChange, item.market.weightBefore, item.market.weightAfter].every(value => typeof value === 'number' && Number.isFinite(value)) &&
      item.market.volumeRatio > 0 && item.market.weightBefore >= 0 && item.market.weightBefore <= 100 && item.market.weightAfter >= 0 && item.market.weightAfter <= 100 &&
      Array.isArray(item.market.prices) && item.market.prices.length === 10 && item.market.prices.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0) && item.market.prices[6] === item.price))) throw new Error('Invalid market snapshot');
  return { holdings: data.holdings, trades: data.trades };
}

// One saved reflection per trade; legacy principles without a trade remain untouched.
export function saveLinkedPrinciple<T extends { id: string; createdAt: string; trade?: TradeRecord }>(items: T[], next: T): T[] {
  const existing = next.trade && items.find(item => item.trade?.id === next.trade!.id);
  return existing ? items.map(item => item === existing ? { ...next, id: existing.id, createdAt: existing.createdAt } : item) : [next, ...items];
}

// Fixed prototype data: users never need to register holdings or place orders.
export const demoAccounts = ['1234-5678 [위탁종합] 김철수', '1234-0000 [종합매매] 김철수'];
const demoDates = ['2026-10-14', '2026-10-13', '2026-10-12', '2026-10-08', '2026-10-07', '2026-10-06', '2026-10-05', '2026-10-02', '2026-10-01', '2026-09-30', '2026-09-29', '2026-09-28'];
export const demoPortfolio: Simulation = demoAccounts.reduce((portfolio, accountId, accountIndex) => {
  for (let step = 0; step < 24; step++) {
    const round = Math.floor(step / 4), stock = simulationStocks[step % 4];
    const index = 23 - step;
    const side = round === 2 || round === 4 ? 'sell' : 'buy';
    const quantity = [10, 5, 3, 4, 6, 2][round] + accountIndex;
    portfolio = applySimulationAction(portfolio, { mode: side, accountId, stockId: stock.id, quantity,
      price: stock.price + (round - 3) * 200 }, `${accountIndex ? 'second-' : ''}demo-trade-${index + 1}`,
      `${demoDates[Math.floor(index / 2)]}T${index % 2 === 0 ? '14:06' : '10:24'}:00+09:00`);
  }
  return portfolio;
}, emptySimulation());
