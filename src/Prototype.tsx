import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, UsersIcon, CoinsIcon, CaretRightIcon, BookmarkSimpleIcon, SparkleIcon, ArrowsClockwiseIcon, CaretDownIcon, CaretUpIcon, CheckIcon, DotsThreeVerticalIcon, GearSixIcon, ListIcon, MicrophoneIcon, TriangleIcon, XIcon, HourglassIcon, CompassIcon, EyeIcon, TargetIcon, ShieldCheckIcon, QuestionIcon } from '@phosphor-icons/react';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-serif-kr/700.css';
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboardInsets, useKeyboard, useMobileDevice } from './mobile';
import { applySimulationAction, emptySimulation, parseSimulation, portfolioSummary, saveLinkedPrinciple, simulationStocks, simulationStorageKey, stockFor, tradeLabel, tradeTime, won, type Holding, type SimulationAction, type TradeRecord } from './simulation';

const accountOptions = ['1234-5678 [위탁종합] 김철수', '1234-0000 [종합매매] 김철수'];
const topTabs = ['국내잔고', '미체결', '예수금', '주문가능금액'];
const bottomTabs = ['관심종목', '현재가', '주문', '차트', '계좌', '종합'];
type Sheet = 'account' | 'notice' | 'tools' | 'menu' | 'settings' | 'ranking' | 'overseas' | 'sell' | 'chat' | null;

export default function Prototype() {
  const [landingOpen, setLandingOpen] = useState(false);
  const keyboard = useKeyboard();
  const { device } = useMobileDevice();
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const hasNavigated = useRef(false);
  useEffect(() => {
    if (landingOpen) backButtonRef.current?.focus({ preventScroll: true });
    else if (hasNavigated.current) aiButtonRef.current?.focus({ preventScroll: true });
  }, [landingOpen]);
  const [topTab, setTopTab] = useState('국내잔고');
  const [balanceTab, setBalanceTab] = useState('키움 잔고');
  const [account, setAccount] = useState(accountOptions[0]);
  const [portfolioState, setPortfolioState] = useState(() => {
    try { return { data: parseSimulation(localStorage.getItem(simulationStorageKey)), warning: '' }; }
    catch { return { data: emptySimulation(), warning: '가상 잔고를 불러오지 못했어요. 현재 화면의 기록은 저장이 제한될 수 있어요.' }; }
  });
  const simulation = portfolioState.data;
  const simulationRef = useRef(simulation);
  const [principles, setPrinciples] = useState(readPrinciples);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [order, setOrder] = useState<{ mode: SimulationAction['mode']; stockId?: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [landingTrade, setLandingTrade] = useState<TradeRecord | null>(null);
  const [landingRecords, setLandingRecords] = useState(false);
  const orderBusy = useRef(false);
  const holdings = simulation.holdings.filter(item => item.accountId === account && item.quantity > 0);
  const accountTrades = simulation.trades.filter(item => item.accountId === account);
  const summary = portfolioSummary(simulation, account);
  const pendingTrade = accountTrades.find(trade => !principles.some(item => item.trade?.id === trade.id));
  function updatePrinciples(next: InvestmentPrinciple[]) {
    setPrinciples(next);
    try { localStorage.setItem(principlesStorageKey, JSON.stringify(next)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }
  function openOrder(mode: SimulationAction['mode'], stockId?: string) {
    keyboard.hide(); setSheet(null); orderBusy.current = false; setOrder({ mode, stockId });
  }
  function executeOrder(action: SimulationAction): string | null {
    if (orderBusy.current) return '이 거래는 이미 처리하고 있어요.';
    orderBusy.current = true;
    try {
      const next = applySimulationAction(simulationRef.current, action, crypto.randomUUID(), new Date().toISOString());
      let warning = '';
      try { localStorage.setItem(simulationStorageKey, JSON.stringify(next)); }
      catch { warning = '브라우저 저장이 제한되어 가상 잔고와 거래는 현재 화면에서만 유지돼요.'; }
      simulationRef.current = next; setPortfolioState({ data: next, warning });
      keyboard.hide(); setOrder(null);
      notify(action.mode === 'seed' ? '시작 잔고를 등록했어요. 이제 매수·매도를 해보세요.' : '가상 거래를 기록했어요. 선택의 이유를 돌아볼까요?');
      return null;
    } catch (error) { orderBusy.current = false; return error instanceof Error ? error.message : '거래를 확인해 주세요.'; }
  }
  const [expanded, setExpanded] = useState(true);
  const [credit, setCredit] = useState('융자별');
  const [rows, setRows] = useState(2);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [sort, setSort] = useState('');
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { bottomInset } = useKeyboardInsets();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);
  function notify(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2100);
  }
  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => { setRefreshing(false); notify('잔고를 새로고침했습니다.'); }, 650);
  }
  function selectTop(value: string) { setTopTab(value); setSheet(null); }
  const titles: Record<Exclude<Sheet, null>, string> = { account: '계좌 선택', notice: '잔고 조회 유의사항', tools: '투자도구', menu: '전체 메뉴', settings: '잔고 화면 설정', ranking: 'MY랭킹', overseas: '해외 잔고', sell: '매도할 종목 선택', chat: '지수 채팅' };
  const indices = [{ name: '나스닥', value: '27,068.72' }, { name: '코스피', value: '2,650.00' }, { name: '코스닥', value: '780.00' }];
  function openLanding(selectedTrade: TradeRecord | null = null, showRecords = false) {
    keyboard.hide();
    setSheet(null);
    setOrder(null); setHistoryOpen(false); setLandingTrade(selectedTrade); setLandingRecords(showRecords);
    setToast('');
    hasNavigated.current = true;
    setLandingOpen(true);
  }
  if (landingOpen) return <ConfessionLanding backButtonRef={backButtonRef} onBack={() => { keyboard.hide(); setLandingOpen(false); }}
    trades={accountTrades} initialTrade={landingTrade} initialRecords={landingRecords} principles={principles}
    storageAvailable={storageAvailable} onChange={updatePrinciples} />;
  return (
    <>
    <main className="kiwoom" aria-label="키움증권 국내잔고 목업">
      <header className="main-header">
        <button className="back icon-button" aria-label="이전 화면" onClick={() => { selectTop('국내잔고'); setBalanceTab('키움 잔고'); }}><ArrowLeftIcon size={29} weight="thin" /></button>
        <nav className="top-tabs" aria-label="계좌 메뉴">
          {topTabs.map((label) => <button key={label} className={topTab === label ? 'active' : ''} aria-current={topTab === label ? 'page' : undefined} onClick={() => selectTop(label)}>{label === '국내잔고' && <MicrophoneIcon className="voice-icon" size={12} weight="light" />}{label}</button>)}
        </nav>
        <button className="more icon-button" aria-label="더보기" onClick={() => setSheet('menu')}><DotsThreeVerticalIcon size={29} weight="bold" /></button>
      </header>
      <div className="balance-tabs" role="tablist" aria-label="잔고 구분">
        {['키움 잔고', '타사 잔고'].map(label => <button key={label} role="tab" aria-selected={balanceTab === label} className={balanceTab === label ? 'selected' : ''} onClick={() => setBalanceTab(label)}>{label}</button>)}
      </div>
      <button className="edge-handle" aria-label="빠른 메뉴" onClick={() => setSheet('menu')} />
      <div className="account-toolbar">
        <button className="outline notice" onClick={() => setSheet('notice')}>유의</button>
        <button className="outline account-selector" aria-label={`계좌 선택: ${account}`} onClick={() => setSheet('account')}><span>{account}</span><CaretDownIcon size={13} weight="light" /></button>
        <button className="outline refresh" aria-label="잔고 새로고침" aria-busy={refreshing} onClick={refresh}><ArrowsClockwiseIcon className={refreshing ? 'spinning' : ''} size={26} weight="thin" /></button>
        <button className="outline overseas" onClick={() => setSheet('overseas')}>해외<br />잔고</button>
      </div>
      {topTab === '국내잔고' && balanceTab === '키움 잔고' ? <>
        <section className="balance-card" aria-label="계좌 잔고 요약">
          <button className="profit-row" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><strong>평가손익</strong><b>{won(summary.profit)}원</b><span>{summary.percent.toFixed(2)}%</span>{expanded ? <CaretUpIcon size={14} weight="light" /> : <CaretDownIcon size={14} weight="light" />}</button>
          {expanded && <div className="balance-details"><div><span>총 매입</span><span>{won(summary.cost)}</span><span>실현손익</span><span>{won(summary.realized)}</span></div><div><span>총 평가</span><span>{won(summary.value)}</span><button className="estimated" onClick={() => notify(`가상 보유종목 평가금액 ${won(summary.value)}원 · 수수료 제외`)}><span>추정자산</span><ArrowsClockwiseIcon size={15} weight="light" /></button><span /></div></div>}
          <button className="ranking" onClick={() => setSheet('ranking')}><span>MY랭킹</span><strong>월 수익률 순위 조회 (키움전체)</strong><ArrowsClockwiseIcon size={16} weight="light" /></button>
        </section>
        <div className="investment-toolbar">
          <button className="outline tools" onClick={() => setSheet('tools')}><img src="/assets/kiwoom/investment-tools.png" alt="" draggable={false} /><strong>투자도구</strong></button>
          <button className="outline sell" onClick={() => setSheet('sell')}>매도</button>
          <div className="credit-toggle" aria-label="융자 표시 방식">{['융자별', '융자합'].map(label => <button key={label} className={credit === label ? 'selected' : ''} aria-pressed={credit === label} onClick={() => setCredit(label)}>{label}</button>)}</div>
          <button className="outline row-toggle" onClick={() => setRows(rows === 2 ? 1 : 2)} aria-label={`${rows}줄 보기, 전환`}>{rows}줄 <span className="row-dots"><span className={rows === 2 ? 'on' : ''} /><span className={rows === 1 ? 'on' : ''} /></span></button>
        </div>
        <div className="virtual-toolbar"><span>가상 잔고 · 시연 가격</span><button onClick={() => openOrder('seed')}>+ 종목 등록</button><button onClick={() => openOrder('buy')}>매수</button><button onClick={() => { keyboard.hide(); setHistoryOpen(true); }}>기록 {accountTrades.length}</button></div>
        <div className={`holdings-header ${rows === 1 ? 'single-row' : ''}`} role="table" aria-label="보유종목">
          <button className="table-settings icon-button" aria-label="잔고 화면 설정" onClick={() => setSheet('settings')}><GearSixIcon size={16} weight="fill" /></button>
          <div role="row" className="table-columns">
            {['종목명', rows === 2 ? '매입가|현재가' : '현재가', rows === 2 ? '보유수량|가능수량' : '보유수량', rows === 2 ? '평가손익|수익률' : '평가손익'].map(label => <button role="columnheader" aria-sort={sort === label ? 'ascending' : 'none'} key={label} onClick={() => { setSort(sort === label ? '' : label); notify(`${label.split('|')[0]} 정렬 ${sort === label ? '해제' : '선택'}`); }}>{label.split('|').map((line, i) => <span key={line}>{line}<TriangleIcon size={9} weight="fill" className={`sort-mark ${sort === label ? 'sorted' : ''}`} style={{ bottom: i === 0 && label.includes('|') ? '50%' : 0 }} /></span>)}</button>)}
          </div>
          <button className="next-columns icon-button" aria-label="추가 잔고 항목" onClick={() => setSheet('settings')}><TriangleIcon size={12} weight="fill" /></button>
        </div>
        <MobileScroll className="holdings-scroll">
          {portfolioState.warning && <p className="virtual-warning" role="status">{portfolioState.warning}</p>}
          {pendingTrade && <button className="trade-reminder" onClick={() => openLanding(pendingTrade)}><SparkleIcon size={17} /><span>{stockFor(pendingTrade.stockId).name} {tradeLabel(pendingTrade)} {pendingTrade.quantity}주<small>이 거래를 왜 했는지 돌아볼까요?</small></span><CaretRightIcon size={15} /></button>}
          {holdings.length === 0 ? <div className="virtual-empty"><CoinsIcon size={28} /><strong>{simulation.holdings.some(item => item.accountId === account) ? '현재 보유한 종목이 없어요' : '나의 가상 잔고를 만들어보세요'}</strong><p>{accountTrades.length ? <>전량 매도한 거래도 기록에 남아 있어요.<br />기록을 눌러 선택의 이유를 돌아봐요.</> : <>보유 종목과 수량을 등록한 뒤<br />매수·매도한 이유를 돌아봐요.</>}</p><button onClick={() => openOrder(simulation.holdings.some(item => item.accountId === account) ? 'buy' : 'seed')}>{simulation.holdings.some(item => item.accountId === account) ? '새로운 가상 매수' : '시작 잔고 등록'}</button></div> : [...holdings].sort((a, b) => sort.startsWith('종목명') ? stockFor(a.stockId).name.localeCompare(stockFor(b.stockId).name, 'ko') : sort.startsWith('보유수량') ? a.quantity - b.quantity : sort.startsWith('매입가') ? a.averagePrice - b.averagePrice : sort.startsWith('현재가') ? stockFor(a.stockId).price - stockFor(b.stockId).price : sort.startsWith('평가손익') ? (stockFor(a.stockId).price - a.averagePrice) * a.quantity - (stockFor(b.stockId).price - b.averagePrice) * b.quantity : 0).map(item => {
            const stock = stockFor(item.stockId); const profit = (stock.price - item.averagePrice) * item.quantity;
            return <button className={`holding-row ${rows === 1 ? 'holding-single' : ''}`} key={item.stockId} aria-label={`${stock.name}, ${item.quantity}주 보유, 매수·매도 열기`} onClick={() => openOrder('buy', item.stockId)}><span><strong>{stock.name}</strong>{rows === 2 && <small>{stock.sector}</small>}</span><span>{rows === 2 && <small>{won(item.averagePrice)}</small>}<strong>{won(stock.price)}</strong></span><span><strong>{item.quantity}</strong>{rows === 2 && <small>{item.quantity}</small>}</span><span className={profit >= 0 ? 'profit-positive' : 'profit-negative'}><strong>{won(profit)}</strong>{rows === 2 && <small>{((stock.price / item.averagePrice - 1) * 100).toFixed(2)}%</small>}</span></button>;
          })}
        </MobileScroll>
      </> : <MobileScroll className="alternate-scroll"><section className="alternate-content" aria-label={topTab}>
        {balanceTab === '타사 잔고' ? <><h2>타사 잔고</h2><p>연결된 타사 계좌가 없습니다.</p><button className="sheet-primary" onClick={() => notify('계좌 연결은 시연용 화면에서 제공하지 않습니다.')}>계좌 연결</button></> : topTab === '미체결' ? <><div className="simple-table"><span>종목명</span><span>주문수량</span><span>미체결수량</span></div><p>미체결 내역이 없습니다.</p></> : <><h2>{topTab}</h2>{(topTab === '예수금' ? ['예수금', 'D+1 추정예수금', 'D+2 추정예수금', '출금가능금액'] : ['현금주문가능금액', '증거금 100% 주문가능', '신용주문가능금액']).map(label => <div className="amount-line" key={label}><span>{label}</span><strong>0원</strong></div>)}</>}
      </section></MobileScroll>}
      <footer className="app-footer">
        <div className="market-strip"><button className="index-chat" onClick={() => setSheet('chat')}><b>지수</b><span>채팅</span></button><button className="market-values" aria-label="시장 지수 변경" onClick={() => setIndex((index + 1) % indices.length)}><span>{indices[index].name}</span><span>{indices[index].value}</span><span>0.00</span><span>0.00%</span></button></div>
        <nav className="bottom-nav" aria-label="하단 메뉴"><button className="menu-button" onClick={() => setSheet('menu')}><ListIcon size={29} weight="light" /><strong>메뉴</strong></button>{bottomTabs.map(label => <button key={label} className={label === '계좌' ? 'active' : ''} aria-current={label === '계좌' ? 'page' : undefined} onClick={() => { if (label === '계좌') { selectTop('국내잔고'); setBalanceTab('키움 잔고'); } else { notify(`${label} 화면은 다음 단계에서 연결됩니다.`); } }}>{label}</button>)}</nav>
      </footer>
      {toast && <div className="toast" role="status" style={{ bottom: bottomInset + 118 }}>{toast}</div>}
      <BottomSheet open={sheet !== null} onOpenChange={open => { if (!open) setSheet(null); }} title={sheet ? titles[sheet] : ''} description="시연용 가상 계좌 · 실제 거래 및 데이터 연결 없음" snap={sheet === 'menu' ? 0.66 : 0.49}>
        <div className="kiwoom-sheet"><button className="sheet-close icon-button" aria-label="닫기" onClick={() => setSheet(null)}><XIcon size={21} /></button>
          {sheet === 'account' && accountOptions.map(value => <button className="sheet-option" key={value} onClick={() => { setAccount(value); setSheet(null); }}><span>{value}</span>{account === value && <CheckIcon size={19} />}</button>)}
          {sheet === 'notice' && <><p>잔고 및 평가금액은 조회 시점에 따라 달라질 수 있습니다.</p><p>이 화면의 계좌, 잔고와 지수는 프로토타입 시연용 가상 정보입니다.</p><button className="sheet-primary" onClick={() => setSheet(null)}>확인</button></>}
          {sheet === 'menu' && <><div className="sheet-account">김철수님 <small>1234-5678</small></div>{topTabs.map(label => <button className="sheet-option" key={label} onClick={() => { selectTop(label); setBalanceTab('키움 잔고'); }}><span>{label}</span><CaretDownIcon size={15} className="point-right" /></button>)}</>}
          {sheet === 'settings' && <><div className="setting-line"><span>잔고 표시</span><div>{[1, 2].map(value => <button key={value} aria-pressed={rows === value} className={rows === value ? 'chosen' : ''} onClick={() => setRows(value)}>{value}줄</button>)}</div></div><div className="setting-line"><span>융자 표시</span><div>{['융자별', '융자합'].map(value => <button key={value} aria-pressed={credit === value} className={credit === value ? 'chosen' : ''} onClick={() => setCredit(value)}>{value}</button>)}</div></div><button className="sheet-primary" onClick={() => setSheet(null)}>적용</button></>}
          {sheet === 'tools' && ['수익률 계산기', '관심종목 등록', '잔고 화면 설정'].map(label => <button className="sheet-option" key={label} onClick={() => label === '잔고 화면 설정' ? setSheet('settings') : notify('보유종목이 없어 사용할 수 없습니다.')}><span>{label}</span><CaretDownIcon size={15} className="point-right" /></button>)}
          {sheet === 'ranking' && <><p>월 수익률 순위 조회 (키움전체)</p><div className="sheet-empty">수익률 순위 정보가 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>확인</button></>}
          {sheet === 'overseas' && <><div className="amount-line"><span>총 평가금액</span><strong>0원</strong></div><div className="sheet-empty">보유 중인 해외 종목이 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>국내잔고로 돌아가기</button></>}
          {sheet === 'sell' && (holdings.length ? <><p>매도할 종목을 선택해 주세요.</p>{holdings.map(item => <button className="sheet-option" key={item.stockId} onClick={() => openOrder('sell', item.stockId)}><span>{stockFor(item.stockId).name}</span><strong>{item.quantity}주</strong></button>)}</> : <><div className="sheet-empty">매도 가능한 보유종목이 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>확인</button></>)}
          {sheet === 'chat' && <><div className="sheet-option"><span>{indices[index].name}</span><strong>{indices[index].value}</strong></div><div className="sheet-empty">표시할 대화가 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>닫기</button></>}
        </div>
      </BottomSheet>
      <BottomSheet open={order !== null} onOpenChange={open => { if (!open) { keyboard.hide(); setOrder(null); } }} title={order?.mode === 'seed' ? '시작 잔고 등록' : '가상 매수·매도'} description="가상 종목 · 고정된 시연 가격 · 실제 거래 없음" snap={0.74}>
        {order && <VirtualOrder key={`${account}:${order.mode}:${order.stockId}`} accountId={account} holdings={simulation.holdings.filter(item => item.accountId === account)} initial={order} onSubmit={executeOrder} onClose={() => { keyboard.hide(); setOrder(null); }} />}
      </BottomSheet>
      <BottomSheet open={historyOpen} onOpenChange={setHistoryOpen} title="나의 매매 기록" description="시작 잔고 등록 이후의 가상 거래" snap={0.8}>
        <TradeList trades={accountTrades} principles={principles} onSelect={item => openLanding(item)} onEmpty={() => { setHistoryOpen(false); openOrder('buy'); }} onClose={() => setHistoryOpen(false)} />
      </BottomSheet>
    </main>
    {!sheet && !order && !historyOpen && <button
      ref={aiButtonRef}
      className="ai-launcher"
      aria-label="AI 고해성사 열기"
      // The footer is 8cqw (market strip) + 25.3cqw (navigation).
      style={{ bottom: device.geometry.screen.width * 0.333 + 12 }}
      onClick={() => openLanding()}
    >
      <span className="ai-launcher-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-message-ai">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M8 9h8" />
          <path d="M8 13h3.5" />
          <path d="M9.994 19.804l-1.994 1.196v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4" />
          <path d="M14 21v-4a2 2 0 1 1 4 0v4" />
          <path d="M14 19h4" />
          <path d="M21 15v6" />
        </svg>
      </span>
    </button>}
    </>
  );
}


function VirtualOrder({ accountId, holdings, initial, onSubmit, onClose }: {
  accountId: string; holdings: Holding[]; initial: { mode: SimulationAction['mode']; stockId?: string };
  onSubmit: (action: SimulationAction) => string | null; onClose: () => void;
}) {
  const keyboard = useKeyboard();
  const [stockId, setStockId] = useState(initial.stockId || '');
  const [mode, setMode] = useState(initial.mode);
  const [quantity, setQuantity] = useState(initial.mode === 'seed' ? '10' : '1');
  const [averagePrice, setAveragePrice] = useState(initial.stockId ? String(stockFor(initial.stockId).price) : '');
  const [error, setError] = useState('');
  const stock = stockFor(stockId);
  const holding = holdings.find(item => item.stockId === stockId);
  const choices = simulationStocks.filter(item => mode !== 'seed' || !holdings.some(held => held.stockId === item.id));
  function choose(id: string) { keyboard.hide(); setStockId(id); setAveragePrice(String(stockFor(id).price)); setError(''); }
  function submit() {
    keyboard.hide();
    if (!stock || !/^\d+$/.test(quantity) || (mode === 'seed' && !/^\d+$/.test(averagePrice))) { setError('수량과 평균매입가를 정수로 입력해 주세요.'); return; }
    const failure = onSubmit({ mode, accountId, stockId, quantity: Number(quantity), price: mode === 'seed' ? Number(averagePrice) : stock.price });
    if (failure) setError(failure);
  }
  return <form className="virtual-sheet" onSubmit={event => { event.preventDefault(); submit(); }}>
    <button type="button" className="virtual-close" aria-label="거래창 닫기" onClick={onClose}><XIcon size={20} /></button>
    <MobileScroll className="virtual-sheet-scroll">
      {!stock ? <><p className="virtual-intro">{mode === 'seed' ? '현재 보유하고 있다고 가정할 종목을 골라주세요.' : '가상 거래할 종목을 골라주세요.'}</p><div className="virtual-stock-grid">{choices.map(item => <button type="button" key={item.id} onClick={() => choose(item.id)}><small>{item.sector}</small><strong>{item.name}</strong><span>{won(item.price)}원</span></button>)}</div>{choices.length === 0 && <p className="virtual-intro">10개 종목을 모두 등록했어요. 잔고의 종목을 눌러 매수·매도를 진행해 주세요.</p>}</> : <>
        <div className="virtual-stock-heading"><div><small>{stock.sector} · 가상 종목</small><h3>{stock.name}</h3></div><button type="button" onClick={() => { keyboard.hide(); setStockId(''); setError(''); }}>종목 변경</button></div>
        {mode !== 'seed' && <div className="virtual-mode" role="group" aria-label="거래 구분">{(['buy', 'sell'] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} className={mode === value ? 'selected' : ''} onClick={() => { keyboard.hide(); setMode(value); setError(''); }}>{value === 'buy' ? '매수' : '매도'}</button>)}</div>}
        <div className="virtual-price"><span>{mode === 'seed' ? '현재 시연 가격' : '가상 체결가격'}</span><strong>{won(stock.price)}원</strong></div>
        {mode !== 'seed' && <p className="virtual-held">현재 보유 <b>{holding?.quantity || 0}주</b>{holding && holding.quantity > 0 ? ` · 평균 ${won(holding.averagePrice)}원` : ''}</p>}
        <label className="virtual-input"><span>{mode === 'seed' ? '시작 보유수량' : mode === 'buy' ? '매수 수량' : '매도 수량'}</span><span><KeyboardInput aria-label="수량 입력" inputMode="numeric" maxLength={7} value={quantity} onChange={event => { setQuantity(event.target.value); setError(''); }} /><b>주</b></span></label>
        <div className="virtual-quantity-options">{[1, 5, 10].map(value => <button type="button" key={value} onClick={() => { setQuantity(String(value)); setError(''); }}>{value}주</button>)}{mode === 'sell' && (holding?.quantity || 0) > 0 && <button type="button" onClick={() => { setQuantity(String(holding!.quantity)); setError(''); }}>전량 {holding!.quantity}주</button>}</div>
        {mode === 'seed' && <label className="virtual-input"><span>평균매입가</span><span><KeyboardInput aria-label="평균매입가 입력" inputMode="numeric" maxLength={9} value={averagePrice} onChange={event => { setAveragePrice(event.target.value); setError(''); }} /><b>원</b></span></label>}
        <div className="virtual-total"><span>{mode === 'seed' ? '시작 매입금액' : '거래 금액'}</span><strong>{won((mode === 'seed' ? Number(averagePrice) || 0 : stock.price) * (Number(quantity) || 0))}원</strong></div>
        <p className="virtual-intro">{mode === 'seed' ? '시작 잔고 등록은 매매 기록에 포함되지 않아요. 등록 후 매수·매도부터 회고할 수 있어요.' : '고정된 시연 가격으로 기록해요. 수수료·세금은 계산하지 않아요.'}</p>
        {error && <p className="virtual-error" role="alert">{error}</p>}
      </>}
    </MobileScroll>
    {stock && <button type="submit" className="virtual-submit" onPointerDown={event => { if (event.button === 0) event.preventDefault(); }}>{mode === 'seed' ? '시작 잔고 등록하기' : mode === 'buy' ? '가상 매수 기록하기' : '가상 매도 기록하기'}</button>}
  </form>;
}

function TradeList({ trades, principles, onSelect, onEmpty, onClose }: {
  trades: TradeRecord[]; principles: InvestmentPrinciple[]; onSelect: (trade: TradeRecord) => void; onEmpty: () => void; onClose: () => void;
}) {
  return <div className="virtual-sheet trade-list"><button className="virtual-close" aria-label="매매 기록 닫기" onClick={onClose}><XIcon size={20} /></button><MobileScroll className="virtual-sheet-scroll">
    <p className="virtual-intro">{trades.length ? `${trades.length}건의 거래 · 원칙을 남긴 거래는 회고 완료로 표시돼요.` : '아직 매매 기록이 없어요. 가상 잔고에서 매수·매도한 뒤 선택의 이유를 돌아봐요.'}</p>
    {trades.map(trade => <button className={`trade-record trade-${trade.side}`} key={trade.id} onClick={() => onSelect(trade)} aria-label={`${stockFor(trade.stockId).name} ${tradeLabel(trade)} ${trade.quantity}주 돌아보기`}><span className="trade-record-top"><b>{tradeLabel(trade)}</b><small>{principles.some(item => item.trade?.id === trade.id) ? '회고 완료 · 다시 보기' : '회고 대기'}</small></span><strong>{stockFor(trade.stockId).name}<CaretRightIcon size={17} /></strong><span>{trade.quantity}주 · {won(trade.price)}원<span>{tradeTime(trade.createdAt)}</span></span><small>보유 {trade.beforeQuantity}주 → {trade.afterQuantity}주</small></button>)}
    {trades.length === 0 && <button className="virtual-submit" onClick={onEmpty}>가상 잔고로 이동</button>}
  </MobileScroll></div>;
}

function TradeContext({ trade }: { trade: TradeRecord }) {
  return <aside className={`reflection-trade trade-${trade.side}`}><span>이번에 돌아볼 가상 거래 · {tradeLabel(trade)}</span><strong>{stockFor(trade.stockId).name} {trade.quantity}주</strong><p>{tradeTime(trade.createdAt)} · 체결 {won(trade.price)}원</p><small>보유 {trade.beforeQuantity}주 → {trade.afterQuantity}주</small></aside>;
}

type ConfessionTopic = 'follow' | 'average';
const confessionTopics = [
  { id: 'follow' as const, label: '매수 타이밍이 고민돼요', lines: ['매수 타이밍이', '고민돼요'], Icon: UsersIcon },
  { id: 'average' as const, label: '추가 매수 기준이 궁금해요', lines: ['추가 매수 기준이', '궁금해요'], Icon: CoinsIcon },
];

// Each visual section owns its markup; Reveal animates the section, never individual letters.
function ConfessionReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={`confession-reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

function ConfessionBackdrop({ onReady }: { onReady: () => void }) {
  return <img className="confession-art" src="/assets/kiwoom/confession-chapel.png" alt="" aria-hidden="true" draggable={false} onLoad={onReady} onError={onReady} />;
}

function ConfessionTitle() {
  return <ConfessionReveal className="confession-heading"><h1><em>마음을 고백하세요.</em></h1></ConfessionReveal>;
}

function ConfessionDescription() {
  return <ConfessionReveal className="confession-description" delay={120}><p>AI와의 채팅으로 지난 투자를 돌아보고,<br />나만의 투자 기준을 세워보세요.</p></ConfessionReveal>;
}

function ConfessionMascot({ onReady }: { onReady: () => void }) {
  return <ConfessionReveal className="confession-mascot" delay={240}><img src="/assets/kiwoom/confession-angel.png" alt="날개와 후광이 있는 분홍 천사가 두 손을 모으고 미소 짓고 있습니다." draggable={false} onLoad={onReady} onError={onReady} /></ConfessionReveal>;
}

function ConfessionGreeting() {
  return <ConfessionReveal className="confession-greeting" delay={360}><p>선택의 이유를 나누며<br />나만의 기준을 찾아봐요.</p></ConfessionReveal>;
}

function ConfessionTopicPicker({ topic, onSelect }: { topic: ConfessionTopic | null; onSelect: (topic: ConfessionTopic | null) => void }) {
  return <div className="confession-topics" role="group" aria-label="고백 주제 선택">
    {confessionTopics.map(({ id, label, lines, Icon }, index) => <ConfessionReveal key={id} delay={480 + index * 80}>
      <button className={`confession-topic ${topic === id ? 'is-selected' : ''}`} aria-label={label} aria-pressed={topic === id} onClick={() => onSelect(topic === id ? null : id)}>
        <span className="confession-topic-icon"><Icon size={24} weight="fill" /></span>
        <span>{lines[0]}<br />{lines[1]}</span>
        {topic === id ? <CheckIcon size={17} /> : <CaretRightIcon size={17} />}
      </button>
    </ConfessionReveal>)}
  </div>;
}

function ConfessionMotto() {
  return <ConfessionReveal className="confession-motto" delay={620}><p>오늘의 고백이 내일의 다짐이 되기를.</p><span><SparkleIcon size={14} /></span></ConfessionReveal>;
}

function ConfessionActions({ primaryRef, onStart, onRecords, onSaved, hasSaved }: {
  primaryRef: RefObject<HTMLButtonElement | null>; onStart: () => void; onRecords: () => void; onSaved: () => void; hasSaved: boolean;
}) {
  return <div className="confession-actions">
    <ConfessionReveal delay={700}><button ref={primaryRef} className="confession-primary" onClick={onStart}>나의 투자 돌아보기<ArrowRightIcon size={25} weight="light" /></button></ConfessionReveal>
    <ConfessionReveal delay={780}><button className="confession-records" onClick={onRecords}>매매 기록부터 돌아보기</button></ConfessionReveal>
    {hasSaved && <button className="confession-saved-link" onClick={onSaved}><BookmarkSimpleIcon size={15} weight="fill" /> 남겨둔 투자 원칙 보기</button>}
  </div>;
}

type PrincipleCategory = 'follow' | 'rush' | 'missing' | 'confidence' | 'recovery' | 'concentration' | 'none' | 'unsure';
const principleCategories: { id: PrincipleCategory; name: string; description: string; principle: string }[] = [
  { id: 'follow', name: '뇌동매매죄', description: '다른 사람의 추천이 내 판단을 대신했던 선택이에요.', principle: '추천을 받아도 내 거래 이유를 먼저 적기.' },
  { id: 'rush', name: '조급매매죄', description: '가격 변화에 대한 불안이나 조급함이 선택을 앞섰어요.', principle: '거래 전에 선택의 이유를 한 문장으로 정리하기.' },
  { id: 'missing', name: '기준실종죄', description: '매수·매도나 재검토를 위한 나만의 기준이 아직 없었어요.', principle: '거래 전에 투자 이유와 재검토할 조건을 정하기.' },
  { id: 'confidence', name: '확신과잉죄', description: '내 예상과 다른 근거를 충분히 살피지 않았어요.', principle: '결정 전에 내 예상과 반대되는 근거 하나 확인하기.' },
  { id: 'recovery', name: '손실만회죄', description: '이전 손실을 만회하고 싶은 마음이 다음 거래에 영향을 줬어요.', principle: '다음 거래의 이유를 이전 손실과 분리해서 적기.' },
  { id: 'concentration', name: '집중과잉죄', description: '미리 정한 비중보다 한 종목에 더 집중했던 선택이에요.', principle: '거래 전에 현재 비중과 내가 정한 기준 확인하기.' },
  { id: 'none', name: '기준을 지킨 선택', description: '미리 세운 기준과 확인한 근거에 따라 선택했어요. 억지로 죄를 붙이지 않아요.', principle: '거래 전에 세운 기준과 판단 근거를 계속 기록하기.' },
  { id: 'unsure', name: '조금 더 돌아볼 선택', description: '지금 이야기만으로는 선택의 이유를 단정하기 어려워요. 직접 맞는 정리를 골라도 괜찮아요.', principle: '다음 거래 전에 내가 선택하는 이유를 한 줄로 적기.' },
];
function categoryFor(id: PrincipleCategory) { return principleCategories.find(item => item.id === id)!; }
const principleBadges = {
  follow: { label: '뇌동매매죄', Icon: UsersIcon },
  rush: { label: '조급매매죄', Icon: HourglassIcon },
  missing: { label: '기준실종죄', Icon: CompassIcon },
  confidence: { label: '확신과잉죄', Icon: EyeIcon },
  recovery: { label: '손실만회죄', Icon: ArrowsClockwiseIcon },
  concentration: { label: '집중과잉죄', Icon: TargetIcon },
  none: { label: '원칙 지킴', Icon: ShieldCheckIcon },
  unsure: { label: '판단 보류', Icon: QuestionIcon },
};
function PrincipleBadge({ category }: { category: PrincipleCategory }) {
  const { label, Icon } = principleBadges[category];
  return <span className={`principle-badge badge-${category}`}><Icon size={13} weight="duotone" aria-hidden="true" /><span>{label}</span></span>;
}
function PrincipleBadgeSummary({ principles }: { principles: InvestmentPrinciple[] }) {
  // Derive totals from saved records so edits never add counts and deletion removes them.
  const counts = principles.reduce<Partial<Record<PrincipleCategory, number>>>((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + 1;
    return totals;
  }, {});
  return <section className="principle-badge-summary" aria-label="투자 원칙 뱃지 누적 기록">
    <div className="badge-summary-heading"><h2>쌓인 고해 기록</h2><span>총 {principles.length}회</span></div>
    <p>저장한 투자 원칙마다 하나씩 쌓여요.</p>
    <ul className="badge-summary-list">{principleCategories.map(({ id }) => {
      const count = counts[id] || 0;
      return <li key={id} className={count === 0 ? 'badge-count-empty' : ''}><PrincipleBadge category={id} /><strong aria-label={`${count}회`}>{count}<span>회</span></strong></li>;
    })}</ul>
  </section>;
}
type ReflectionAnswer = { question: string; text: string; hint?: PrincipleCategory };
type ReflectionResult = { category: PrincipleCategory; evidence: string; explanation: string };
type InvestmentPrinciple = { id: string; text: string; category: PrincipleCategory; evidence: string; explanation: string; answers: ReflectionAnswer[]; createdAt: string; updatedAt: string; previousPrinciple?: string; trade?: TradeRecord };
const principlesStorageKey = 'kiwoom-confession-principles-v1';
function readPrinciples(): InvestmentPrinciple[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(principlesStorageKey) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is InvestmentPrinciple => item && typeof item.id === 'string' && typeof item.text === 'string' && item.text.trim() &&
      principleCategories.some(category => category.id === item.category) && typeof item.evidence === 'string' && typeof item.explanation === 'string' &&
      typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) && Array.isArray(item.answers) &&
      item.answers.every((answer: ReflectionAnswer) => answer && typeof answer.question === 'string' && typeof answer.text === 'string')).map(item => {
        if (!item.trade) return item;
        try { parseSimulation(JSON.stringify({ holdings: [], trades: [item.trade] })); return item; }
        catch { const { trade: invalidTrade, ...legacy } = item; return legacy; }
      });
  } catch { return []; }
}
// Mock interpretation considers the stated reason, never the price movement or P/L.
function summarizeReflection(answers: ReflectionAnswer[]): ReflectionResult {
  const reason = answers[1];
  const criteria = answers[2];
  let category: PrincipleCategory = reason.hint || 'unsure';
  if (!reason.hint) {
    const text = reason.text;
    if (/추천|따라|주변|친구|커뮤니티/.test(text) && !/따르지|따라.*않|추천.*아니/.test(text)) category = 'follow';
    else if (/놓칠|놓치|급하|급하게|조급|늦을|후회|불안.*(팔|매도)/.test(text)) category = 'rush';
    else if (/만회|복구|본전/.test(text)) category = 'recovery';
    else if (/반대.*(무시|안 봤)|무조건|확실|오를 수밖에/.test(text)) category = 'confidence';
    else if (/몰빵|전부|비중.*(넘|초과)|한 종목.*집중/.test(text)) category = 'concentration';
    else if (/근거|분석|계획|기준/.test(text) && !/없|안 |않/.test(text)) category = 'none';
    if (/기준.*(확인|따라)|근거.*확인|분석.*확인|계획대로/.test(text) && !/무시|확인하지|안 |않|없/.test(text)) category = 'none';
  }
  const missingCriteria = criteria.hint === 'missing' || /기준.*없|정하지|계획.*없/.test(criteria.text);
  const checkedCriteria = criteria.hint === 'none' || (/정했|세웠|계획|확인했/.test(criteria.text) && !/없|않|안 |확인하지/.test(criteria.text));
  if (category === 'none' && !checkedCriteria) category = missingCriteria ? 'missing' : 'unsure';
  if (category === 'unsure' && missingCriteria) category = 'missing';
  const evidence = category === 'missing' ? criteria.text : reason.text;
  return { category, evidence, explanation: categoryFor(category).description };
}
function principleDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value)); }

function ConfessionLanding({ onBack, backButtonRef, trades, initialTrade, initialRecords, principles, storageAvailable, onChange }: {
  onBack: () => void; backButtonRef: RefObject<HTMLButtonElement | null>; trades: TradeRecord[];
  initialTrade: TradeRecord | null; initialRecords: boolean; principles: InvestmentPrinciple[];
  storageAvailable: boolean; onChange: (next: InvestmentPrinciple[]) => void;
}) {
  const keyboard = useKeyboard();
  const [topic, setTopic] = useState<ConfessionTopic | null>(null);
  const [panel, setPanel] = useState<'chat' | 'trades' | 'principles' | null>(initialTrade ? 'chat' : initialRecords ? 'trades' : null);
  const [trade, setTrade] = useState<TradeRecord | null>(initialTrade);
  const [reviewPrinciple, setReviewPrinciple] = useState<InvestmentPrinciple | null>(principles.find(item => item.trade?.id === initialTrade?.id && item.trade) || principles[0] || null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [mascotReady, setMascotReady] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);
  function closePanel() { keyboard.hide(); setPanel(null); }
  function showPrinciples() { keyboard.hide(); setPanel('principles'); }
  const previousPanel = useRef(panel);
  useEffect(() => {
    if (previousPanel.current !== null && panel === null) backButtonRef.current?.focus({ preventScroll: true });
    previousPanel.current = panel;
  }, [panel, backButtonRef]);
  function start(selectedTopic = topic, selectedTrade: TradeRecord | null = null, previous = principles[0] || null) {
    keyboard.hide(); setTopic(selectedTopic); setTrade(selectedTrade); setReviewPrinciple(principles.find(item => item.trade?.id === selectedTrade?.id && item.trade) || previous); setPanel('chat');
  }
  const covered = panel === 'chat' || panel === 'principles';
  return <>
  <main className="kiwoom ai-landing confession-landing" aria-label="AI 고해성사 랜딩페이지" data-covered={covered} aria-hidden={covered} inert={covered}>
    <MobileScroll className="confession-scroll">
      <div className="confession-scene" data-ready={backdropReady && mascotReady}>
        <ConfessionBackdrop onReady={() => setBackdropReady(true)} />
        <ConfessionTitle />
        <ConfessionDescription />
        <ConfessionMascot onReady={() => setMascotReady(true)} />
        <ConfessionGreeting />
        <ConfessionTopicPicker topic={topic} onSelect={value => { setTopic(value); setTrade(null); }} />
        <ConfessionMotto />
        <ConfessionActions primaryRef={primaryRef} onStart={() => trades.length ? setPanel('trades') : start()}
          onRecords={() => { keyboard.hide(); setPanel('trades'); }} onSaved={showPrinciples} hasSaved={principles.length > 0} />
      </div>
    </MobileScroll>
    <header className="confession-header">
      <button ref={backButtonRef} className="icon-button" aria-label="뒤로가기" onClick={onBack}><ArrowLeftIcon size={28} weight="light" /></button>
      <span>투자 고해성사</span>
      <button className="principles-entry icon-button" aria-label="나의 투자 원칙 보기" onClick={showPrinciples}><BookmarkSimpleIcon size={24} />{principles.length > 0 && <small>{principles.length}</small>}</button>
    </header>
    <BottomSheet open={panel === 'trades'} onOpenChange={open => { if (!open) closePanel(); }} title="어떤 거래를 돌아볼까요?" description="현재 계좌에서 직접 만든 가상 매매 기록" snap={0.8}>
      <TradeList trades={trades} principles={principles} onSelect={item => start(item.side === 'buy' && item.beforeQuantity > 0 ? 'average' : null, item)} onEmpty={() => { keyboard.hide(); onBack(); }} onClose={closePanel} />
    </BottomSheet>
  </main>
  {panel === 'chat' && <ConfessionChat topic={topic} trade={trade} onBack={closePanel} previous={reviewPrinciple}
    storageAvailable={storageAvailable} onSavedView={showPrinciples} onSave={value => onChange(saveLinkedPrinciple(principles, value))} />}
  {panel === 'principles' && <InvestmentPrinciples principles={principles} storageAvailable={storageAvailable} onBack={closePanel}
    onChange={onChange} onStart={previous => previous ? start(null, previous.trade || null, previous) : trades.length ? setPanel('trades') : start()} />}
  </>;
}

type ConfessionMessage = { id: number; role: 'ai' | 'user'; text: string };

function ConfessionThinking() {
  return <div className="chat-thinking" role="status" aria-live="polite">
    <div className="chat-thinking-orbit" aria-hidden="true"><SparkleIcon size={25} weight="fill" /></div>
    <strong>키움 AI가 생각하는 중<span className="chat-typing-dots" aria-hidden="true"><i /><i /><i /></span></strong>
    <p>이야기 속에서 나만의 투자 기준을 찾고 있어요.</p>
  </div>;
}

type ChatStage = 'interview' | 'thinking' | 'review' | 'correct' | 'principle' | 'saved';
const reasonSuggestions: { text: string; hint: PrincipleCategory }[] = [
  { text: '주변의 추천을 따랐고, 직접 확인하지 않았어요', hint: 'follow' },
  { text: '오르는 가격을 보고 기회를 놓칠까 급하게 샀어요', hint: 'rush' },
  { text: '제가 세운 기준과 근거를 확인하고 샀어요', hint: 'none' },
  { text: '앞선 손실을 빨리 만회하고 싶었어요', hint: 'recovery' },
  { text: '반대 근거가 있어도 제 예상이 확실하다고 생각했어요', hint: 'confidence' },
  { text: '정해둔 비중을 넘겨 한 종목에 집중했어요', hint: 'concentration' },
];

function ReflectionCard({ result, onConfirm, onCorrect }: { result: ReflectionResult; onConfirm: () => void; onCorrect: () => void }) {
  return <section className="reflection-card" aria-label="고백 정리 카드">
    <span className="reflection-eyebrow"><SparkleIcon size={15} weight="fill" />고백 정리</span>
    <h2>{categoryFor(result.category).name}</h2>
    <p>{result.explanation}</p>
    <div className="reflection-evidence"><span>이렇게 말씀해 주셨어요</span><blockquote>“{result.evidence}”</blockquote></div>
    <small>수익이나 손실이 아닌 선택의 이유를 돌아보는 시연용 정리예요. 잘못을 단정하는 판단이 아닙니다.</small>
    <h3>이 정리가 내 마음과 맞나요?</h3>
    <div className="reflection-confirm"><button className="flow-primary" onClick={onConfirm}><CheckIcon size={17} />맞아요</button><button className="flow-secondary" onClick={onCorrect}>조금 달라요</button></div>
  </section>;
}

function ConfessionChat({ topic, trade, onBack, onSave, onSavedView, previous, storageAvailable }: {
  topic: ConfessionTopic | null; trade: TradeRecord | null; onBack: () => void; onSave: (value: InvestmentPrinciple) => void;
  onSavedView: () => void; previous: InvestmentPrinciple | null; storageAvailable: boolean;
}) {
  const keyboard = useKeyboard();
  const { bottomInset, keyboardDragging } = useKeyboardInsets();
  const { device } = useMobileDevice();
  const isSell = trade?.side === 'sell';
  const tradeName = trade ? stockFor(trade.stockId).name : '';
  const updatingTrade = !!trade && previous?.trade?.id === trade.id;
  const questions = [
    trade ? isSell ? `${tradeName} ${trade.quantity}주를 ${trade.afterQuantity === 0 ? '전량' : '일부'} 매도했어요. ${trade.afterQuantity === 0 ? '모두 매도한' : '일부만 매도한'} 계기는 무엇인가요?` : `${tradeName} ${trade.quantity}주를 ${trade.beforeQuantity > 0 ? '추가 매수' : '매수'}했어요. ${trade.beforeQuantity > 0 ? '이미 보유한 종목을 더 산' : '이 종목을 선택한'} 계기는 무엇인가요?`
      : previous ? '지난번에 남긴 원칙이 이번 선택에 어떻게 도움이 됐나요?' : '최근 어떤 거래를 돌아보고 싶으세요?',
    '그 선택을 하게 된 가장 큰 이유는 무엇이었나요?',
    isSell ? '매도 전에 가격·비중이나 투자 판단을 다시 검토할 기준을 정해두셨나요?' : '거래 전에 매수나 재검토를 위한 기준을 정해두셨나요?',
  ];
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState<PrincipleCategory | undefined>();
  const [stage, setStage] = useState<ChatStage>('interview');
  const [answers, setAnswers] = useState<ReflectionAnswer[]>([]);
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [correctionCategory, setCorrectionCategory] = useState<PrincipleCategory>('unsure');
  const [moreReasons, setMoreReasons] = useState(false);
  const [messages, setMessages] = useState<ConfessionMessage[]>(() => [{ id: 0, role: 'ai', text: `안녕하세요. 선택의 이유를 나누며 나만의 투자 기준을 함께 세워볼게요.\n${questions[0]}` }]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    const scroll = endRef.current?.closest('.mobile-scroll');
    if (!scroll) return;
    const top = stage === 'interview' && messages.length === 1 ? 0 : ['review', 'correct', 'principle', 'saved'].includes(stage) && resultRef.current
      ? resultRef.current.offsetTop - device.geometry.safeArea.top - 100 : scroll.scrollHeight;
    scroll.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [messages, stage, moreReasons, device.geometry.safeArea.top]);
  const questionIndex = answers.length;
  const currentReasons = isSell ? [
    { text: '가격 하락이 불안해서 급하게 팔았어요', hint: 'rush' as const },
    { text: '제가 정한 매도 조건을 확인하고 팔았어요', hint: 'none' as const },
    { text: '주변에서 팔라는 말을 듣고 직접 확인하지 않았어요', hint: 'follow' as const },
    { text: '다른 거래로 손실을 만회하려고 팔았어요', hint: 'recovery' as const },
    { text: '투자 판단의 변화와 근거를 확인하고 팔았어요', hint: 'none' as const },
    { text: '자금이 필요해서 계획에 따라 팔았어요', hint: 'none' as const },
  ] : reasonSuggestions;
  const suggestions: { text: string; hint?: PrincipleCategory }[] = questionIndex === 0
    ? (trade ? isSell ? ['미리 정한 비중으로 조정하려고 했어요', '가격 움직임을 보고 결정을 바꿨어요', '다른 곳에 쓸 자금이 필요했어요'] : trade.beforeQuantity > 0 ? ['투자 판단에 새로운 근거가 생겼어요', '평균매입가를 낮추고 싶었어요', '가격 움직임을 보고 더 사고 싶었어요'] : ['직접 찾아본 종목이었어요', '주변에서 추천받았어요', '가격 움직임을 보고 관심이 생겼어요']
      : previous ? ['원칙을 확인한 뒤 거래했어요', '원칙을 세웠지만 이번에는 지키지 못했어요', '이번에는 거래하지 않고 기다렸어요']
      : topic === 'average' ? ['보유 중인 종목을 추가 매수했어요', '추가 매수할지 고민하다 기다렸어요', '일부를 매도했어요'] : ['새로운 종목을 매수했어요', '보유 중인 종목을 추가 매수했어요', '매수하지 않고 기다렸어요']).map(text => ({ text }))
    : questionIndex === 1 ? moreReasons ? currentReasons : currentReasons.slice(0, 3)
      : [{ text: isSell ? '매도 조건과 비중 기준을 미리 정하고 확인했어요' : '투자 이유와 재검토 조건을 미리 정했어요', hint: 'none' }, { text: '정해둔 기준은 없었어요', hint: 'missing' }, { text: '기준은 있었지만 이번에는 확인하지 않았어요', hint: 'unsure' }];
  function append(role: 'ai' | 'user', text: string) { setMessages(current => [...current, { id: nextId.current++, role, text }]); }
  function confirm() {
    keyboard.hide();
    setDraft(categoryFor(result!.category).principle); setStage('principle');
  }
  function submit() {
    const text = draft.trim();
    if (busy.current || (stage !== 'correct' && !text)) return;
    keyboard.hide();
    if (stage === 'principle') {
      busy.current = true;
      const now = new Date().toISOString();
      onSave({ id: crypto.randomUUID(), text, category: result!.category, evidence: result!.evidence,
        explanation: result!.explanation, answers, createdAt: now, updatedAt: now, previousPrinciple: previous?.text, trade: trade || undefined });
      setDraft(''); setStage('saved'); return;
    }
    if (stage === 'correct') {
      if (text) append('user', text);
      setResult({ category: correctionCategory, evidence: text || result!.evidence,
        explanation: categoryFor(correctionCategory).description });
      setDraft(''); setStage('review'); return;
    }
    if (stage !== 'interview') return;
    const next = [...answers, { question: questions[questionIndex], text, hint }];
    setAnswers(next); append('user', text); setDraft(''); setHint(undefined); setMoreReasons(false);
    if (next.length < 3) { append('ai', questions[next.length]); return; }
    busy.current = true; setStage('thinking');
    // Five-second demo latency, cancelled on back/unmount. No AI or network request.
    timer.current = setTimeout(() => {
      setResult(summarizeReflection(next)); busy.current = false; setStage('review'); timer.current = null;
    }, 5000);
  }
  const editable = stage === 'interview' || stage === 'correct' || stage === 'principle';
  const maxLength = stage === 'principle' ? 160 : 500;
  const step = stage === 'interview' || stage === 'thinking' ? 0 : stage === 'review' || stage === 'correct' ? 1 : 2;
  return <main className="kiwoom confession-chat" aria-label="투자 고해성사 AI 채팅">
    <header className="chat-header" style={{ paddingTop: device.geometry.safeArea.top }}>
      <button ref={backRef} className="icon-button" aria-label="고해성사 랜딩으로 돌아가기" onClick={() => { keyboard.hide(); onBack(); }}><ArrowLeftIcon size={24} /></button>
      <div><strong>투자 고해성사</strong><span><i />키움 AI와 함께 만드는 나만의 기준</span></div>
    </header>
    <MobileScroll className="chat-scroll">
      <div className={`chat-history reflection-history ${editable ? '' : 'without-composer'}`} style={{ paddingTop: device.geometry.safeArea.top + 84 }}>
        <div className="reflection-steps" aria-label={`진행 단계 ${step + 1}/3`}>{['이야기 나누기', '고백 정리', '원칙 남기기'].map((label, index) => <span key={label} className={index <= step ? 'active' : ''} aria-current={index === step ? 'step' : undefined}><b>{index < step ? <CheckIcon size={10} /> : index + 1}</b>{label}</span>)}</div>
        <p className="chat-demo-note">프로토타입 · AI 응답과 분류는 시연용입니다</p>
        {trade && <TradeContext trade={trade} />}
        {previous && (trade ? <details className="previous-principle previous-context"><summary>앞서 남긴 투자 원칙 참고하기</summary><strong>{previous.text}</strong><small>이번 거래에서 이 기준을 어떻게 적용했는지 떠올려봐요.</small></details> : <aside className="previous-principle"><span><BookmarkSimpleIcon size={14} />지난번에 남긴 나의 원칙</span><strong>{previous.text}</strong><small>이 기준을 이번 선택에 어떻게 적용했는지 돌아봐요.</small></aside>)}
        <div className="chat-messages" role="log" aria-label="AI와의 대화" aria-live="polite" aria-relevant="additions">
          {messages.map(message => <div key={message.id} className={`chat-message chat-message-${message.role}`}>
            {message.role === 'ai' && <span className="chat-author"><SparkleIcon size={16} weight="fill" />키움 AI</span>}
            <div className="chat-bubble"><p>{message.text}</p></div>
          </div>)}
        </div>
        {stage === 'interview' && <div className="chat-suggestions" role="group" aria-label="추천 답변">
          <p>질문 {questionIndex + 1}/3 · 가까운 답변을 고르거나 직접 입력해 주세요</p>
          {suggestions.map(value => <button key={value.text} aria-pressed={draft === value.text} className={draft === value.text ? 'is-selected' : ''} onClick={() => { keyboard.hide(); setDraft(value.text); setHint(value.hint); }}>{value.text}{draft === value.text && <CheckIcon size={16} />}</button>)}
          {questionIndex === 1 && <button className="more-reasons" aria-expanded={moreReasons} onClick={() => setMoreReasons(!moreReasons)}>{moreReasons ? '다른 이유 접기' : '다른 이유도 살펴보기'}<CaretDownIcon size={15} /></button>}
        </div>}
        {stage === 'thinking' && <ConfessionThinking />}
        <div ref={resultRef} className="reflection-result">
          {stage === 'review' && result && <ReflectionCard result={result} onConfirm={confirm} onCorrect={() => { keyboard.hide(); setDraft(''); setCorrectionCategory(result.category); setStage('correct'); }} />}
          {stage === 'correct' && <section className="reflection-card"><span className="reflection-eyebrow">내 마음에 맞게 고치기</span><h2>어떤 정리가 더 가까운가요?</h2><p>분류를 고르고, 다르게 느낀 점을 자유롭게 적어주세요.</p>
            <div className="correction-options" role="group" aria-label="고백 분류 수정">{principleCategories.map(item => <button key={item.id} aria-pressed={correctionCategory === item.id} className={correctionCategory === item.id ? 'selected' : ''} onClick={() => { keyboard.hide(); setCorrectionCategory(item.id); }}>{item.name}{correctionCategory === item.id && <CheckIcon size={14} />}</button>)}</div>
            <p className="correction-description">{categoryFor(correctionCategory).description}</p><button className="flow-text" onClick={() => { keyboard.hide(); setDraft(''); setStage('review'); }}>기존 정리로 돌아가기</button>
          </section>}
          {stage === 'principle' && result && <section className="reflection-card"><span className="reflection-eyebrow"><BookmarkSimpleIcon size={15} />나만의 기준 만들기</span><h2>오늘의 고백을<br />내일의 원칙으로.</h2><p>아래 입력창에서 나의 말로 바꿔보세요.<br />실천할 수 있는 작은 기준 하나면 충분해요.</p>
            <blockquote className="principle-preview">{draft || '나에게 맞는 투자 원칙을 적어주세요.'}</blockquote><small>확인한 정리 · {categoryFor(result.category).name}</small>
            <button className="flow-text" onClick={() => { keyboard.hide(); setDraft(''); setStage('review'); }}>고백 정리 다시 보기</button>
          </section>}
          {stage === 'saved' && <section className="reflection-card saved-card" role="status"><span className="saved-check"><CheckIcon size={30} /></span><h2>{updatingTrade ? '이 거래의 원칙을 갱신했어요.' : '나의 원칙으로 남겼어요.'}</h2><p>{updatingTrade ? <>같은 거래의 기존 기록을 갱신했어요.<br />뱃지 총횟수는 늘어나지 않아요.</> : <>다음 선택을 앞두고 다시 꺼내보세요.<br />다음 대화에서도 이 기준을 함께 돌아볼게요.</>}</p><small>{storageAvailable ? '이 브라우저에 저장됩니다. 새로고침해도 유지돼요.' : '브라우저 저장이 제한되어 현재 화면에서만 유지돼요.'}</small><button className="flow-primary" onClick={() => { keyboard.hide(); onSavedView(); }}><BookmarkSimpleIcon size={18} />나의 투자 원칙 보기</button><button className="flow-text" onClick={onBack}>고해성사 홈으로 돌아가기</button></section>}
        </div>
        <div ref={endRef} />
      </div>
    </MobileScroll>
    {editable && <form className="chat-composer" style={{ bottom: bottomInset, transition: keyboardDragging ? 'none' : undefined }} onSubmit={event => { event.preventDefault(); submit(); }}>
      <div className="chat-input-wrap"><KeyboardTextarea aria-label={stage === 'principle' ? '나의 투자 원칙 입력' : stage === 'correct' ? '고백 정리 수정 의견' : '투자 이야기 직접 입력'} placeholder={stage === 'principle' ? '내가 실천할 투자 원칙을 적어주세요' : stage === 'correct' ? '다르게 느낀 점을 적어주세요 (선택)' : '그때의 생각을 자유롭게 적어주세요'} rows={2} maxLength={maxLength} value={draft}
        onChange={event => { setDraft(event.target.value); setHint(undefined); }} onBlur={() => keyboard.hide()}
        onKeyDown={event => { if (event.key === 'Escape') { keyboard.hide(); return; } if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} />
      </div>
      <div className="chat-composer-actions"><span>{draft.length}/{maxLength}</span><button type="submit" onPointerDown={event => { if (event.button === 0) event.preventDefault(); }} disabled={stage !== 'correct' && !draft.trim()}>{stage === 'principle' ? '나의 투자 원칙으로 남기기' : stage === 'correct' ? '이 정리로 수정하기' : questionIndex === 2 ? '돌아보기' : '보내기'}<ArrowRightIcon size={18} /></button></div>
    </form>}
  </main>;
}

function InvestmentPrinciples({ principles, storageAvailable, onBack, onStart, onChange }: {
  principles: InvestmentPrinciple[]; storageAvailable: boolean; onBack: () => void;
  onStart: (previous?: InvestmentPrinciple) => void; onChange: (next: InvestmentPrinciple[]) => void;
}) {
  const keyboard = useKeyboard();
  const { device } = useMobileDevice();
  const { bottomInset, keyboardDragging } = useKeyboardInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const backRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selected = principles.find(item => item.id === selectedId);
  useEffect(() => { backRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    scrollRef.current?.closest('.mobile-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
    backRef.current?.focus({ preventScroll: true });
  }, [selectedId]);
  function closeDetail() { keyboard.hide(); setSelectedId(null); setEditing(false); setDeleting(false); }
  function saveEdit() {
    if (!selected || !draft.trim()) return;
    keyboard.hide(); onChange(principles.map(item => item.id === selected.id ? { ...item, text: draft.trim(), updatedAt: new Date().toISOString() } : item));
    setEditing(false); setNotice('원칙을 수정했어요.');
  }
  return <main className="kiwoom principles-page" aria-label="나의 투자 원칙">
    <header className="chat-header" style={{ paddingTop: device.geometry.safeArea.top }}><button ref={backRef} className="icon-button" aria-label={selected ? '투자 원칙 목록으로 돌아가기' : '고해성사 랜딩으로 돌아가기'} onClick={selected ? closeDetail : onBack}><ArrowLeftIcon size={24} /></button><div><strong>{selected ? '원칙 돌아보기' : '나의 투자 원칙'}</strong>{!selected && <span>{principles.length}개의 원칙</span>}</div></header>
    <MobileScroll className="principles-scroll"><div ref={scrollRef} className="principles-content" style={{ paddingTop: device.geometry.safeArea.top + 92 }}>
      {notice && <p className="principles-notice" role="status">{notice}</p>}
      {!selected && principles.length > 0 && <PrincipleBadgeSummary principles={principles} />}
      {!selected && principles.length === 0 && <section className="principles-empty"><BookmarkSimpleIcon size={28} weight="light" /><p>아직 저장한 투자 원칙이 없어요.</p><small>고해성사에서 원칙을 남기면<br />거래 기록과 뱃지가 여기에 쌓여요.</small></section>}
      {!selected && principles.length > 0 && <div className="principles-list">{principles.map((item, index) => <button className="principle-list-card" key={item.id} aria-label={`투자 원칙 ${index + 1}, ${principleBadges[item.category].label}: ${item.text}`} onClick={() => { keyboard.hide(); setNotice(''); setSelectedId(item.id); }}><span className="principle-card-top"><span className="principle-card-date"><b>{String(principles.length - index).padStart(2, '0')}</b><small>{principleDate(item.createdAt)}</small></span><PrincipleBadge category={item.category} /></span>{item.trade && <span className="principle-trade-line">{stockFor(item.trade.stockId).name} · {tradeLabel(item.trade)} {item.trade.quantity}주</span>}<strong>{item.text}</strong><p>{item.evidence}</p></button>)}</div>}
      {selected && <article className="principle-detail"><span className="reflection-eyebrow">{principleDate(selected.createdAt)}에 남긴 원칙</span><h1>{selected.text}</h1><PrincipleBadge category={selected.category} />{selected.trade && <TradeContext trade={selected.trade} />}
        {editing && <section className="principle-edit"><label htmlFor="principle-edit">나의 말로 다시 다듬기</label><div className="chat-input-wrap"><KeyboardTextarea id="principle-edit" aria-label="저장한 투자 원칙 수정" rows={3} maxLength={160} value={draft} onChange={event => setDraft(event.target.value)} onBlur={() => keyboard.hide()} onKeyDown={event => { if (event.key === 'Escape') keyboard.hide(); }} /></div><small>{draft.length}/160</small><button className="flow-text" onClick={() => { keyboard.hide(); setEditing(false); }}>수정 취소</button></section>}
        <section className="principle-origin"><h2>이 원칙이 시작된 이야기</h2><blockquote>“{selected.evidence}”</blockquote><p>{selected.explanation}</p>{selected.previousPrinciple && <p className="principle-previous">지난 원칙을 돌아보며 남겼어요<br />{selected.previousPrinciple}</p>}</section>
        <details className="principle-conversation"><summary>함께 나눈 대화 보기</summary>{selected.answers.map((answer, index) => <div key={index}><span>질문 {index + 1}</span><p>{answer.question}</p><blockquote>{answer.text}</blockquote></div>)}</details>
        <div className="principle-manage"><button onClick={() => { keyboard.hide(); setDraft(selected.text); setEditing(true); setDeleting(false); setNotice(''); }}>원칙 수정</button><button onClick={() => { keyboard.hide(); setDeleting(true); setEditing(false); }}>원칙 삭제</button></div>
        {deleting && <section className="principle-delete" role="alert"><p>이 원칙을 삭제할까요?<br />저장된 원칙과 함께 나눈 대화가 삭제돼요.</p><div className="reflection-confirm"><button className="flow-secondary" onClick={() => setDeleting(false)}>취소</button><button className="flow-primary" onClick={() => { onChange(principles.filter(item => item.id !== selected.id)); closeDetail(); setNotice('원칙을 삭제했어요.'); }}>삭제하기</button></div></section>}
      </article>}
      {!storageAvailable && <p className="principles-storage" role="status">브라우저 저장이 제한되어 현재 화면에서만 유지돼요.</p>}
    </div></MobileScroll>
    <footer className="principles-footer" style={{ bottom: bottomInset, transition: keyboardDragging ? 'none' : undefined }}><button className="flow-primary" disabled={editing && !draft.trim()} onPointerDown={event => { if (event.button === 0) event.preventDefault(); }} onClick={() => { keyboard.hide(); if (editing) saveEdit(); else onStart(selected); }}>{editing ? '수정한 원칙 저장하기' : selected ? '이 원칙으로 다시 돌아보기' : principles.length > 0 ? '새로운 투자 돌아보기' : '나의 투자 돌아보기'}<ArrowRightIcon size={19} /></button></footer>
  </main>;
}
