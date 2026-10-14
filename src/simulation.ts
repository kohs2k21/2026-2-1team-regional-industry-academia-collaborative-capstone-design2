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
export type TradeRecord = {
  id: string; accountId: string; stockId: string; side: 'buy' | 'sell'; quantity: number;
  price: number; beforeQuantity: number; afterQuantity: number; averagePriceBefore: number; createdAt: string;
};
export type Simulation = { holdings: Holding[]; trades: TradeRecord[] };
export type SimulationAction = {
  mode: 'seed' | 'buy' | 'sell'; accountId: string; stockId: string; quantity: number; price: number;
};
export const simulationStorageKey = 'kiwoom-virtual-portfolio-v1';
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
  const trade: TradeRecord = { id, accountId, stockId, side: mode, quantity, price, beforeQuantity, afterQuantity, averagePriceBefore: holding?.averagePrice || 0, createdAt };
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
  return { holdings: data.holdings, trades: data.trades };
}

// One saved reflection per trade; legacy principles without a trade remain untouched.
export function saveLinkedPrinciple<T extends { id: string; createdAt: string; trade?: TradeRecord }>(items: T[], next: T): T[] {
  const existing = next.trade && items.find(item => item.trade?.id === next.trade!.id);
  return existing ? items.map(item => item === existing ? { ...next, id: existing.id, createdAt: existing.createdAt } : item) : [next, ...items];
}
