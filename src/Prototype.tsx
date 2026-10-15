import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, UsersIcon, CoinsIcon, CaretRightIcon, BookmarkSimpleIcon, SparkleIcon, ArrowsClockwiseIcon, CaretDownIcon, CaretUpIcon, CheckIcon, DotsThreeVerticalIcon, GearSixIcon, ListIcon, MicrophoneIcon, TriangleIcon, XIcon, HourglassIcon, CompassIcon, EyeIcon, TargetIcon, ShieldCheckIcon, QuestionIcon, ChartLineIcon, BellIcon, ReceiptIcon } from '@phosphor-icons/react';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-serif-kr/700.css';
import { BottomSheet, KeyboardTextarea, MobileScroll, useKeyboardInsets, useKeyboard, useMobileDevice } from './mobile';
import { demoAccounts, demoPortfolio, parseSimulation, portfolioSummary, saveLinkedPrinciple, stockFor, tradeLabel, won, type TradeRecord } from './simulation';

const accountOptions = demoAccounts;
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
  const simulation = demoPortfolio;
  const [principles, setPrinciples] = useState(readPrinciples);
  const [journal, setJournal] = useState(() => readTradeReflections(simulation.trades.map(normalizeTrade), principles));
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [landingTrade, setLandingTrade] = useState<TradeRecord | null>(null);
  const [landingRecords, setLandingRecords] = useState(false);
  const holdings = simulation.holdings.filter(item => item.accountId === account && item.quantity > 0);
  const accountTrades = simulation.trades.filter(item => item.accountId === account);
  const summary = portfolioSummary(simulation, account);
  const pendingTrade = accountTrades.find(trade => !journal.some(item => item.tradeId === trade.id));
  function updatePrinciples(next: InvestmentPrinciple[]) {
    setPrinciples(next);
    try { localStorage.setItem(principlesStorageKey, JSON.stringify(next)); localStorage.setItem(journalStorageKey, JSON.stringify(journal)); }
    catch { setStorageAvailable(false); }
  }
  function updateJournal(next: TradeReflection[]) {
    setJournal(next);
    try { localStorage.setItem(journalStorageKey, JSON.stringify(next)); } catch { setStorageAvailable(false); }
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
  const titles: Record<Exclude<Sheet, null>, string> = { account: '계좌 선택', notice: '잔고 조회 유의사항', tools: '투자도구', menu: '전체 메뉴', settings: '잔고 화면 설정', ranking: 'MY랭킹', overseas: '해외 잔고', sell: '일괄매도', chat: '지수 채팅' };
  const indices = [{ name: '나스닥', value: '27,068.72' }, { name: '코스피', value: '2,650.00' }, { name: '코스닥', value: '780.00' }];
  function openLanding(selectedTrade: TradeRecord | null = null, showRecords = false) {
    keyboard.hide();
    setSheet(null);
    setLandingTrade(selectedTrade); setLandingRecords(showRecords);
    setToast('');
    hasNavigated.current = true;
    setLandingOpen(true);
  }
  if (landingOpen) return <ConfessionLanding backButtonRef={backButtonRef} onBack={() => { keyboard.hide(); setLandingOpen(false); }}
    trades={accountTrades} initialTrade={landingTrade} initialRecords={landingRecords} principles={principles}
    storageAvailable={storageAvailable} onChange={updatePrinciples} journal={journal} onJournalChange={updateJournal} />;
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
          {expanded && <div className="balance-details"><div><span>총 매입</span><span>{won(summary.cost)}</span><span>실현손익</span><span>{won(summary.realized)}</span></div><div><span>총 평가</span><span>{won(summary.value)}</span><button className="estimated" onClick={() => notify(`보유종목 평가금액 ${won(summary.value)}원 · 수수료 제외`)}><span>추정자산</span><ArrowsClockwiseIcon size={15} weight="light" /></button><span /></div></div>}
          <button className="ranking" onClick={() => setSheet('ranking')}><span>MY랭킹</span><strong>월 수익률 순위 조회 (키움전체)</strong><ArrowsClockwiseIcon size={16} weight="light" /></button>
        </section>
        <div className="investment-toolbar">
          <button className="outline tools" onClick={() => setSheet('tools')}><img src="/assets/kiwoom/investment-tools.png" alt="" draggable={false} /><strong>투자도구</strong></button>
          <button className="outline sell" onClick={() => setSheet('sell')}>일괄매도</button>
          <div className="credit-toggle" aria-label="융자 표시 방식">{['융자별', '융자합'].map(label => <button key={label} className={credit === label ? 'selected' : ''} aria-pressed={credit === label} onClick={() => setCredit(label)}>{label}</button>)}</div>
          <button className="outline row-toggle" onClick={() => setRows(rows === 2 ? 1 : 2)} aria-label={`${rows}줄 보기, 전환`}>{rows}줄 <span className="row-dots"><span className={rows === 2 ? 'on' : ''} /><span className={rows === 1 ? 'on' : ''} /></span></button>
        </div>
        <div className="account-records-toolbar"><span>시연용 잔고 · 임시 데이터</span><button onClick={() => openLanding(null, true)}>거래 내역 {accountTrades.length}<CaretRightIcon size={13} /></button></div>
        <div className={`holdings-header ${rows === 1 ? 'single-row' : ''}`} role="table" aria-label="보유종목">
          <button className="table-settings icon-button" aria-label="잔고 화면 설정" onClick={() => setSheet('settings')}><GearSixIcon size={16} weight="fill" /></button>
          <div role="row" className="table-columns">
            {['종목명', rows === 2 ? '매입가|현재가' : '현재가', rows === 2 ? '보유수량|가능수량' : '보유수량', rows === 2 ? '평가손익|수익률' : '평가손익'].map(label => <button role="columnheader" aria-sort={sort === label ? 'ascending' : 'none'} key={label} onClick={() => { setSort(sort === label ? '' : label); notify(`${label.split('|')[0]} 정렬 ${sort === label ? '해제' : '선택'}`); }}>{label.split('|').map((line, i) => <span key={line}>{line}<TriangleIcon size={9} weight="fill" className={`sort-mark ${sort === label ? 'sorted' : ''}`} style={{ bottom: i === 0 && label.includes('|') ? '50%' : 0 }} /></span>)}</button>)}
          </div>
          <button className="next-columns icon-button" aria-label="추가 잔고 항목" onClick={() => setSheet('settings')}><TriangleIcon size={12} weight="fill" /></button>
        </div>
        <MobileScroll className="holdings-scroll">
          {pendingTrade && <button className="trade-reminder" onClick={() => openLanding(pendingTrade)}><SparkleIcon size={17} /><span>{stockFor(pendingTrade.stockId).name} {tradeLabel(pendingTrade)} {pendingTrade.quantity}주<small>이 거래를 왜 했는지 돌아볼까요?</small></span><CaretRightIcon size={15} /></button>}
          {[...holdings].sort((a, b) => sort.startsWith('종목명') ? stockFor(a.stockId).name.localeCompare(stockFor(b.stockId).name, 'ko') : sort.startsWith('보유수량') ? a.quantity - b.quantity : sort.startsWith('매입가') ? a.averagePrice - b.averagePrice : sort.startsWith('현재가') ? stockFor(a.stockId).price - stockFor(b.stockId).price : sort.startsWith('평가손익') ? (stockFor(a.stockId).price - a.averagePrice) * a.quantity - (stockFor(b.stockId).price - b.averagePrice) * b.quantity : 0).map(item => {
            const stock = stockFor(item.stockId); const profit = (stock.price - item.averagePrice) * item.quantity;
            return <button className={`holding-row ${rows === 1 ? 'holding-single' : ''}`} key={item.stockId} aria-label={`${stock.name}, ${item.quantity}주 보유, 거래 내역 보기`} onClick={() => openLanding(accountTrades.find(trade => trade.stockId === item.stockId) || null, true)}><span><strong>{stock.name}</strong>{rows === 2 && <small>{stock.sector}</small>}</span><span>{rows === 2 && <small>{won(item.averagePrice)}</small>}<strong>{won(stock.price)}</strong></span><span><strong>{item.quantity}</strong>{rows === 2 && <small>{item.quantity}</small>}</span><span className={profit >= 0 ? 'profit-positive' : 'profit-negative'}><strong>{won(profit)}</strong>{rows === 2 && <small>{((stock.price / item.averagePrice - 1) * 100).toFixed(2)}%</small>}</span></button>;
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
      <BottomSheet open={sheet !== null} onOpenChange={open => { if (!open) setSheet(null); }} title={sheet ? titles[sheet] : ''} description="시연용 계좌 · 실제 거래 및 데이터 연결 없음" snap={sheet === 'menu' ? 0.66 : 0.49}>
        <div className="kiwoom-sheet"><button className="sheet-close icon-button" aria-label="닫기" onClick={() => setSheet(null)}><XIcon size={21} /></button>
          {sheet === 'account' && accountOptions.map(value => <button className="sheet-option" key={value} onClick={() => { setAccount(value); setSheet(null); }}><span>{value}</span>{account === value && <CheckIcon size={19} />}</button>)}
          {sheet === 'notice' && <><p>잔고 및 평가금액은 조회 시점에 따라 달라질 수 있습니다.</p><p>이 화면의 계좌, 잔고와 지수는 프로토타입 시연용 임시 정보입니다.</p><button className="sheet-primary" onClick={() => setSheet(null)}>확인</button></>}
          {sheet === 'menu' && <><div className="sheet-account">김철수님 <small>1234-5678</small></div>{topTabs.map(label => <button className="sheet-option" key={label} onClick={() => { selectTop(label); setBalanceTab('키움 잔고'); }}><span>{label}</span><CaretDownIcon size={15} className="point-right" /></button>)}</>}
          {sheet === 'settings' && <><div className="setting-line"><span>잔고 표시</span><div>{[1, 2].map(value => <button key={value} aria-pressed={rows === value} className={rows === value ? 'chosen' : ''} onClick={() => setRows(value)}>{value}줄</button>)}</div></div><div className="setting-line"><span>융자 표시</span><div>{['융자별', '융자합'].map(value => <button key={value} aria-pressed={credit === value} className={credit === value ? 'chosen' : ''} onClick={() => setCredit(value)}>{value}</button>)}</div></div><button className="sheet-primary" onClick={() => setSheet(null)}>적용</button></>}
          {sheet === 'tools' && ['수익률 계산기', '관심종목 등록', '잔고 화면 설정'].map(label => <button className="sheet-option" key={label} onClick={() => label === '잔고 화면 설정' ? setSheet('settings') : notify('이 도구는 시연용 화면에서 제공하지 않습니다.')}><span>{label}</span><CaretDownIcon size={15} className="point-right" /></button>)}
          {sheet === 'ranking' && <><p>월 수익률 순위 조회 (키움전체)</p><div className="sheet-empty">수익률 순위 정보가 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>확인</button></>}
          {sheet === 'overseas' && <><div className="amount-line"><span>총 평가금액</span><strong>0원</strong></div><div className="sheet-empty">보유 중인 해외 종목이 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>국내잔고로 돌아가기</button></>}
          {sheet === 'sell' && <><div className="sheet-empty">매매 주문은 시연하지 않습니다.<br />준비된 거래 내역에서 투자 판단을 돌아보세요.</div><button className="sheet-primary" onClick={() => openLanding(null, true)}>거래 내역 보기</button></>}
          {sheet === 'chat' && <><div className="sheet-option"><span>{indices[index].name}</span><strong>{indices[index].value}</strong></div><div className="sheet-empty">표시할 대화가 없습니다.</div><button className="sheet-primary" onClick={() => setSheet(null)}>닫기</button></>}
        </div>
      </BottomSheet>

    </main>
    {!sheet && <button
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
  return <ConfessionReveal className="confession-description" delay={120}><p>매매 기록을 AI와 함께 돌아보고,<br />나만의 투자 기준을 세워보세요.</p></ConfessionReveal>;
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

function ConfessionActions({ primaryRef, onStart, onRecords, onSaved, onPatterns, hasSaved }: {
  primaryRef: RefObject<HTMLButtonElement | null>; onStart: () => void; onRecords: () => void; onSaved: () => void; onPatterns: () => void; hasSaved: boolean;
}) {
  return <div className="confession-actions">
    <ConfessionReveal delay={700}><button ref={primaryRef} className="confession-primary" onClick={onStart}>나의 투자 돌아보기<ArrowRightIcon size={25} weight="light" /></button></ConfessionReveal>
    <ConfessionReveal delay={780}><button className="confession-records" onClick={onRecords}>거래 없이 이야기 나누기</button></ConfessionReveal>
    <button className="confession-saved-link" onClick={onPatterns}><ChartLineIcon size={16} /> 나의 투자 오답노트</button>
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
type PrincipleApplication = 'kept' | 'missed' | 'uncertain' | 'not_applicable';
type ReflectionAnswer = { question: string; text: string; hint?: PrincipleCategory; application?: PrincipleApplication };
type ReflectionResult = { category: PrincipleCategory; evidence: string; explanation: string };
type InvestmentPrinciple = { id: string; text: string; category: PrincipleCategory; evidence: string; explanation: string; answers: ReflectionAnswer[]; createdAt: string; updatedAt: string; previousPrinciple?: string; trade?: TradeRecord };
type ReflectionTrade = { id: string; accountId: string; record?: TradeRecord; name: string; symbol: string; side: 'buy' | 'sell'; kind: 'new' | 'add' | 'sell'; quantity: number; price: number; executedAt: string; change: number | null; volumeRatio: number | null; weightBefore: number | null; weightAfter: number | null; marketChange: number | null; prices: number[] | null };
type PrincipleReference = { id: string; text: string; createdAt: string; source: 'user' | 'example' };
type TradeReflection = ReflectionResult & { tradeId: string; trade: ReflectionTrade; answers: ReflectionAnswer[]; reference: PrincipleReference | null; application: PrincipleApplication; principleId: string; nextPrinciple: string; createdAt: string; updatedAt: string };
type TradeReviewContext = { reference: PrincipleReference | null; application: PrincipleApplication };
const journalStorageKey = 'kiwoom-confession-trade-reflections-v1.2';
const applicationLabels: Record<PrincipleApplication, string> = { kept: '지켰어요', missed: '지키지 못했어요', uncertain: '판단 보류', not_applicable: '비교할 원칙 없음' };
const demoTrades: ReflectionTrade[] = demoPortfolio.trades.filter(trade => trade.accountId === accountOptions[0]).map(normalizeTrade);
const exampleReference: PrincipleReference = { id: 'demo-reference', text: '매매 전 판단 근거 두 가지를 확인하고, 한 종목의 비중은 30% 이내로 유지하기.', createdAt: '2026-09-25T09:00:00+09:00', source: 'example' };
const demoJournal: TradeReflection[] = demoAccounts.flatMap(accountId => [2, 4, 8, 10, 14, 16, 18, 22].map((tradeIndex, index) => {
  const category = (['rush', 'follow', 'none', 'rush', 'follow', 'none', 'unsure', 'rush'] as const)[index];
  const trade = demoPortfolio.trades.filter(item => item.accountId === accountId).map(normalizeTrade)[tradeIndex];
  const application: PrincipleApplication = category === 'none' ? 'kept' : category === 'unsure' ? 'uncertain' : 'missed';
  const evidence = category === 'rush' ? '기회를 놓칠까 급하게 결정했고 근거를 더 확인하지 않았어요.' : category === 'follow' ? '주변 추천을 보고 결정했지만 직접 확인하지는 않았어요.' : category === 'none' ? '미리 정한 근거와 비중을 확인한 뒤 계획대로 거래했어요.' : '당시 판단 근거가 잘 기억나지 않아요.';
  return { tradeId: trade.id, trade, category, evidence, explanation: categoryFor(category).description,
    answers: [{ question: '이 거래를 결정한 이유는 무엇인가요?', text: evidence }, { question: '어떤 기준을 확인했나요?', text: application === 'kept' ? '근거와 비중을 확인했어요.' : '기준을 충분히 확인하지 못했어요.' }, { question: '이전 원칙을 적용했나요?', text: applicationLabels[application], application }],
    reference: exampleReference, application, principleId: `demo-principle-${index}`, nextPrinciple: categoryFor(category).principle,
    createdAt: trade.executedAt, updatedAt: trade.executedAt };
}));
function normalizeTrade(trade: TradeRecord): ReflectionTrade {
  const stock = stockFor(trade.stockId), market = trade.market;
  return { id: trade.id, accountId: trade.accountId, record: trade, name: stock.name, symbol: trade.stockId,
    side: trade.side, kind: trade.side === 'sell' ? 'sell' : trade.beforeQuantity > 0 ? 'add' : 'new', quantity: trade.quantity, price: trade.price, executedAt: trade.createdAt,
    change: market?.change ?? null, volumeRatio: market?.volumeRatio ?? null, weightBefore: market?.weightBefore ?? null, weightAfter: market?.weightAfter ?? null,
    marketChange: market?.marketChange ?? null, prices: market?.prices ?? null };
}
function readTradeReflections(trades: ReflectionTrade[], principles: InvestmentPrinciple[]): TradeReflection[] {
  const known = new Map([...demoTrades, ...trades].map(trade => [trade.id, trade]));
  let records: TradeReflection[] = [];
  try {
    const data: unknown = JSON.parse(localStorage.getItem(journalStorageKey) || '[]');
    if (Array.isArray(data)) {
      const seen = new Set<string>();
      records = data.filter((item): item is TradeReflection => {
        if (!item || typeof item !== 'object') return false;
        const record = item as TradeReflection;
        const valid = known.has(record.tradeId) && principleCategories.some(category => category.id === record.category) &&
          typeof record.evidence === 'string' && typeof record.explanation === 'string' && typeof record.principleId === 'string' &&
          typeof record.nextPrinciple === 'string' && Number.isFinite(Date.parse(record.createdAt)) && Array.isArray(record.answers) &&
          record.answers.length === 3 && record.answers.every(answer => answer && typeof answer.question === 'string' && typeof answer.text === 'string') &&
          Object.hasOwn(applicationLabels, record.application) && (record.reference === null ||
            (record.reference && typeof record.reference.id === 'string' && typeof record.reference.text === 'string' && ['user', 'example'].includes(record.reference.source) &&
              Number.isFinite(Date.parse(record.reference.createdAt)) && Date.parse(record.reference.createdAt) <= Date.parse(known.get(record.tradeId)!.executedAt)));
        if (!valid || seen.has(record.tradeId)) return false;
        seen.add(record.tradeId); return true;
      }).map(record => ({ ...record, trade: known.get(record.tradeId)!, application: record.reference ? record.application : 'not_applicable' }));
    }
  } catch { /* Valid linked principles below remain readable even if the separate journal is damaged. */ }
  // Adopt main's existing trade-linked principles once, without counting one trade twice.
  for (const principle of principles) {
    const trade = principle.trade && known.get(principle.trade.id);
    if (!trade || records.some(item => item.tradeId === trade.id) || principle.answers.length !== 3) continue;
    records.push({ tradeId: trade.id, trade, category: principle.category, evidence: principle.evidence, explanation: principle.explanation,
      answers: principle.answers, reference: null, application: 'not_applicable', principleId: principle.id, nextPrinciple: principle.text,
      createdAt: principle.createdAt, updatedAt: principle.updatedAt || principle.createdAt });
  }
  return records;
}
function eligibleReferences(trade: ReflectionTrade, principles: InvestmentPrinciple[]): PrincipleReference[] {
  return principles.map(item => ({ id: item.id, text: item.text, createdAt: item.updatedAt || item.createdAt, source: 'user' as const }))
    .filter(item => Number.isFinite(Date.parse(item.createdAt)) && Date.parse(item.createdAt) <= Date.parse(trade.executedAt));
}
function tradeDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)); }
function tradeAction(trade: ReflectionTrade) { if (trade.record) return tradeLabel(trade.record); return trade.kind === 'sell' ? '매도' : trade.kind === 'add' ? '추가 매수' : '매수'; }
function formatWon(value: number) { return value.toLocaleString('ko-KR') + '원'; }
function tradeReasonQuestion(trade: ReflectionTrade) {
  if (trade.side === 'sell') return `${trade.name} ${trade.quantity}주를 매도하셨어요. 이 시점에 매도한 이유는 무엇인가요?`;
  if (trade.kind === 'add') return `보유하던 ${trade.name}을 추가 매수하셨어요. 추가 매수를 결정한 근거는 무엇인가요?`;
  return trade.change !== null && trade.change >= 5 ? `전일 대비 ${trade.change}% 오른 시점에 ${trade.name}을 매수하셨어요. 당시 어떤 근거로 결정했나요?` : `${trade.name}을 ${formatWon(trade.price)}에 매수하셨어요. 선택한 이유는 무엇인가요?`;
}
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
function summarizeReflection(answers: ReflectionAnswer[], tradeBased = false): ReflectionResult {
  const reason = answers[tradeBased ? 0 : 1];
  const criteria = answers[tradeBased ? 1 : 2];
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

function ConfessionLanding({ onBack, backButtonRef, trades: rawTrades, initialTrade, initialRecords, principles, storageAvailable, onChange, journal, onJournalChange }: {
  onBack: () => void; backButtonRef: RefObject<HTMLButtonElement | null>; trades: TradeRecord[]; initialTrade: TradeRecord | null; initialRecords: boolean;
  principles: InvestmentPrinciple[]; storageAvailable: boolean; onChange: (next: InvestmentPrinciple[]) => void;
  journal: TradeReflection[]; onJournalChange: (next: TradeReflection[]) => void;
}) {
  const keyboard = useKeyboard();
  const [topic, setTopic] = useState<ConfessionTopic | null>(null);
  const [panel, setPanel] = useState<'chat' | 'trades' | 'patterns' | 'principles' | null>(initialTrade || initialRecords ? 'trades' : null);
  const [trade, setTrade] = useState<ReflectionTrade | null>(initialTrade ? normalizeTrade(initialTrade) : null);
  const [reference, setReference] = useState<PrincipleReference | null>(null);
  const [preferredPrinciple, setPreferredPrinciple] = useState<InvestmentPrinciple | null>(null);
  const [reviewPrinciple, setReviewPrinciple] = useState<InvestmentPrinciple | null>(null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [mascotReady, setMascotReady] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);
  function closePanel() { keyboard.hide(); setPanel(null); }
  function showPrinciples() { keyboard.hide(); setPanel('principles'); }
  function showPatterns() { keyboard.hide(); setPanel('patterns'); }
  function showTrades(previous: InvestmentPrinciple | null = null) { keyboard.hide(); setTrade(null); setPreferredPrinciple(previous); setPanel('trades'); }
  const previousPanel = useRef(panel);
  useEffect(() => {
    if (previousPanel.current !== null && panel === null) backButtonRef.current?.focus({ preventScroll: true });
    previousPanel.current = panel;
  }, [panel, backButtonRef]);
  function start(selectedTopic = topic, selectedTrade: ReflectionTrade | null = null, selectedReference: PrincipleReference | null = null) {
    keyboard.hide(); setTopic(selectedTopic); setTrade(selectedTrade); setReference(selectedReference);
    setReviewPrinciple(selectedTrade ? null : principles[0] || null); setPanel('chat');
  }
  function saveReview(value: InvestmentPrinciple, context?: TradeReviewContext) {
    const existing = trade ? journal.find(item => item.tradeId === trade.id) : undefined;
    const linked = existing && principles.find(item => item.id === existing.principleId);
    const principle = linked ? { ...value, id: linked.id, createdAt: linked.createdAt } : value;
    onChange(principle.trade ? saveLinkedPrinciple(principles, principle) : [principle, ...principles.filter(item => item.id !== principle.id)]);
    if (trade && context) {
      const record: TradeReflection = { tradeId: trade.id, trade, category: value.category, evidence: value.evidence, explanation: value.explanation,
        answers: value.answers, reference: context.reference, application: context.reference ? context.application : 'not_applicable',
        principleId: principle.id, nextPrinciple: value.text, createdAt: existing?.createdAt || value.createdAt, updatedAt: value.updatedAt };
      const next = [record, ...journal.filter(item => item.tradeId !== trade.id)];
      onJournalChange(next);
    }
  }
  const covered = panel !== null;
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
        <ConfessionActions primaryRef={primaryRef} onStart={() => showTrades()}
          onRecords={() => start()} onSaved={showPrinciples} onPatterns={showPatterns} hasSaved={principles.length > 0} />
      </div>
    </MobileScroll>
    <header className="confession-header">
      <button ref={backButtonRef} className="icon-button" aria-label="뒤로가기" onClick={onBack}><ArrowLeftIcon size={28} weight="light" /></button>
      <span>투자 고해성사</span>
      <button className="principles-entry icon-button" aria-label="나의 투자 원칙 보기" onClick={showPrinciples}><BookmarkSimpleIcon size={24} />{principles.length > 0 && <small>{principles.length}</small>}</button>
    </header>
  </main>
  {(panel === 'trades' || panel === 'patterns') && <TradeWorkspace initialView={panel} initialTrade={panel === 'trades' ? trade : null} portfolioTrades={rawTrades.map(normalizeTrade)} journal={journal} principles={principles} preferred={preferredPrinciple}
    storageAvailable={storageAvailable} onBack={closePanel} onStart={(selected, previous) => start(selected.kind === 'add' ? 'average' : 'follow', selected, previous)} onPrinciples={showPrinciples} />}
  {panel === 'chat' && <ConfessionChat topic={topic} trade={trade} reference={reference} onBack={trade ? () => { keyboard.hide(); setPanel('trades'); } : closePanel} previous={reviewPrinciple}
    storageAvailable={storageAvailable} onSavedView={trade ? showPatterns : showPrinciples} onSave={saveReview} />}
  {panel === 'principles' && <InvestmentPrinciples principles={principles} storageAvailable={storageAvailable} onBack={closePanel}
    onChange={onChange} onStart={previous => showTrades(previous || null)} />}
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

function ConfessionChat({ topic, trade, reference, onBack, onSave, onSavedView, previous, storageAvailable }: {
  topic: ConfessionTopic | null; trade: ReflectionTrade | null; reference: PrincipleReference | null; onBack: () => void; onSave: (value: InvestmentPrinciple, context?: TradeReviewContext) => void;
  onSavedView: () => void; previous: InvestmentPrinciple | null; storageAvailable: boolean;
}) {
  const keyboard = useKeyboard();
  const { bottomInset, keyboardDragging } = useKeyboardInsets();
  const { device } = useMobileDevice();
  const questions = trade ? [tradeReasonQuestion(trade),
    trade.kind === 'add' ? `${trade.weightAfter !== null ? `거래 후 ${trade.name}의 주식 내 비중은 ${trade.weightAfter}%였어요. ` : ''}미리 정한 비중과 추가 매수 조건을 확인했나요?` : trade.side === 'sell' ? '매도 전에 정한 재검토 조건과 판단 근거를 확인했나요?' : '매수 전에 판단 근거와 재검토할 조건을 정해두셨나요?',
    reference ? '선택한 이전 원칙을 이번 거래에서 적용했나요? 적용 여부는 직접 확인해 주세요.' : '아직 비교할 이전 원칙이 없어요. 다음 거래에서 가장 먼저 확인할 기준은 무엇인가요?',
  ] : [
    previous ? '지난번에 남긴 원칙이 이번 선택에 어떻게 도움이 됐나요?' : '최근 어떤 거래를 돌아보고 싶으세요?',
    '그 선택을 하게 된 가장 큰 이유는 무엇이었나요?',
    '거래 전에 매수나 재검토를 위한 기준을 정해두셨나요?',
  ];
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState<PrincipleCategory | undefined>();
  const [application, setApplication] = useState<PrincipleApplication>(reference ? 'uncertain' : 'not_applicable');
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
  const criteriaSuggestions = [{ text: '판단 근거와 재검토 조건을 미리 정하고 확인했어요', hint: 'none' as const }, { text: '정해둔 기준은 없었어요', hint: 'missing' as const }, { text: '기준은 있었지만 이번에는 확인하지 않았어요', hint: 'unsure' as const }];
  const contextualReasons = trade?.side === 'sell' ? [
    { text: '미리 정한 매도 조건과 근거를 확인했어요', hint: 'none' as const },
    { text: '가격이 더 떨어질까 급하게 결정했어요', hint: 'rush' as const },
    { text: '주변의 매도 의견을 직접 확인 없이 따랐어요', hint: 'follow' as const },
    ...reasonSuggestions.slice(3),
  ] : trade?.kind === 'add' ? [
    { text: '추가 근거와 제가 정한 비중 기준을 확인했어요', hint: 'none' as const },
    { text: '매입 단가를 낮추고 손실을 만회하고 싶었어요', hint: 'recovery' as const },
    { text: '정한 비중을 넘어도 같은 종목을 더 보유하고 싶었어요', hint: 'concentration' as const },
    ...reasonSuggestions.slice(0, 2), reasonSuggestions[4],
  ] : trade && (trade.change === null || trade.change < 5) ? reasonSuggestions.map((item, index) => index === 1 ? { text: '가격 변화에 마음이 급해져 서둘러 결정했어요', hint: 'rush' as const } : item) : reasonSuggestions;
  const suggestions: { text: string; hint?: PrincipleCategory; application?: PrincipleApplication }[] = trade ? (questionIndex === 0 ? (moreReasons ? contextualReasons : contextualReasons.slice(0, 3))
    : questionIndex === 1 ? criteriaSuggestions
      : reference ? [{ text: '이 원칙을 확인하고 지켰어요', application: 'kept' }, { text: '원칙은 있었지만 지키지 못했어요', application: 'missed' }, { text: '적용했는지 아직 판단하기 어려워요', application: 'uncertain' }]
        : ['판단 근거 두 가지를 먼저 확인할게요', '거래 전 한 종목의 비중을 확인할게요', '재검토할 조건을 먼저 정할게요'].map(text => ({ text })))
    : questionIndex === 0
    ? (previous ? ['원칙을 확인한 뒤 거래했어요', '원칙을 세웠지만 이번에는 지키지 못했어요', '이번에는 거래하지 않고 기다렸어요']
      : topic === 'average' ? ['보유 중인 종목을 추가 매수했어요', '추가 매수할지 고민하다 기다렸어요', '일부를 매도했어요'] : ['새로운 종목을 매수했어요', '보유 중인 종목을 추가 매수했어요', '매수하지 않고 기다렸어요']).map(text => ({ text }))
    : questionIndex === 1 ? moreReasons ? reasonSuggestions : reasonSuggestions.slice(0, 3)
      : [{ text: '투자 이유와 재검토 조건을 미리 정했어요', hint: 'none' }, { text: '정해둔 기준은 없었어요', hint: 'missing' }, { text: '기준은 있었지만 이번에는 확인하지 않았어요', hint: 'unsure' }];
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
        explanation: result!.explanation, answers, createdAt: now, updatedAt: now, previousPrinciple: trade ? reference?.text : previous?.text, trade: trade?.record }, trade ? { reference, application } : undefined);
      setDraft(''); setStage('saved'); return;
    }
    if (stage === 'correct') {
      if (text) append('user', text);
      setResult({ category: correctionCategory, evidence: text || result!.evidence,
        explanation: categoryFor(correctionCategory).description });
      setDraft(''); setStage('review'); return;
    }
    if (stage !== 'interview') return;
    const next = [...answers, { question: questions[questionIndex], text, hint, ...(trade && questionIndex === 2 ? { application } : {}) }];
    setAnswers(next); append('user', text); setDraft(''); setHint(undefined); setMoreReasons(false);
    if (next.length < 3) { append('ai', questions[next.length]); return; }
    busy.current = true; setStage('thinking');
    // Five-second demo latency, cancelled on back/unmount. No AI or network request.
    timer.current = setTimeout(() => {
      setResult(summarizeReflection(next, !!trade)); busy.current = false; setStage('review'); timer.current = null;
    }, 5000);
  }
  const editable = stage === 'interview' || stage === 'correct' || stage === 'principle';
  const maxLength = stage === 'principle' ? 160 : 500;
  const step = stage === 'interview' || stage === 'thinking' ? 0 : stage === 'review' || stage === 'correct' ? 1 : 2;
  return <main className="kiwoom confession-chat" aria-label="투자 고해성사 AI 채팅">
    <header className="chat-header" style={{ paddingTop: device.geometry.safeArea.top }}>
      <button ref={backRef} className="icon-button" aria-label={trade ? '매매 상세로 돌아가기' : '고해성사 랜딩으로 돌아가기'} onClick={() => { keyboard.hide(); onBack(); }}><ArrowLeftIcon size={24} /></button>
      <div><strong>투자 고해성사</strong><span><i />키움 AI와 함께 만드는 나만의 기준</span></div>
    </header>
    <MobileScroll className="chat-scroll">
      <div className={`chat-history reflection-history ${editable ? '' : 'without-composer'}`} style={{ paddingTop: device.geometry.safeArea.top + 84 }}>
        <div className="reflection-steps" aria-label={`진행 단계 ${step + 1}/3`}>{['이야기 나누기', '고백 정리', '원칙 남기기'].map((label, index) => <span key={label} className={index <= step ? 'active' : ''} aria-current={index === step ? 'step' : undefined}><b>{index < step ? <CheckIcon size={10} /> : index + 1}</b>{label}</span>)}</div>
        <p className="chat-demo-note">프로토타입 · AI 응답과 분류는 시연용입니다</p>
        {trade && <TradeFactCard trade={trade} compact />}
        {trade && reference && <details className="previous-principle"><summary><BookmarkSimpleIcon size={14} />{reference.source === 'example' ? '시연용 예시 원칙 펼쳐보기' : '거래 전에 남긴 나의 원칙 펼쳐보기'}</summary><strong>{reference.text}</strong><small>손익이 아니라 이 기준을 확인했는지 돌아봐요.</small></details>}
        {previous && <aside className="previous-principle"><span><BookmarkSimpleIcon size={14} />지난번에 남긴 나의 원칙</span><strong>{previous.text}</strong><small>이 기준을 이번 선택에 어떻게 적용했는지 돌아봐요.</small></aside>}
        <div className="chat-messages" role="log" aria-label="AI와의 대화" aria-live="polite" aria-relevant="additions">
          {messages.map(message => <div key={message.id} className={`chat-message chat-message-${message.role}`}>
            {message.role === 'ai' && <span className="chat-author"><SparkleIcon size={16} weight="fill" />키움 AI</span>}
            <div className="chat-bubble"><p>{message.text}</p></div>
          </div>)}
        </div>
        {stage === 'interview' && <div className="chat-suggestions" role="group" aria-label="추천 답변">
          <p>질문 {questionIndex + 1}/3 · 가까운 답변을 고르거나 직접 입력해 주세요</p>
          {suggestions.map(value => <button key={value.text} aria-pressed={draft === value.text} className={draft === value.text ? 'is-selected' : ''} onClick={() => { keyboard.hide(); setDraft(value.text); setHint(value.hint); if (trade && questionIndex === 2) setApplication(value.application || (reference ? 'uncertain' : 'not_applicable')); }}>{value.text}{draft === value.text && <CheckIcon size={16} />}</button>)}
          {questionIndex === (trade ? 0 : 1) && <button className="more-reasons" aria-expanded={moreReasons} onClick={() => setMoreReasons(!moreReasons)}>{moreReasons ? '다른 이유 접기' : '다른 이유도 살펴보기'}<CaretDownIcon size={15} /></button>}
        </div>}
        {stage === 'thinking' && <ConfessionThinking />}
        <div ref={resultRef} className="reflection-result">
          {stage === 'review' && result && <>{trade && <PrincipleComparison reference={reference} application={application} onChange={value => { keyboard.hide(); setApplication(value); }} />}
            <ReflectionCard result={result} onConfirm={confirm} onCorrect={() => { keyboard.hide(); setDraft(''); setCorrectionCategory(result.category); setStage('correct'); }} /></>}
          {stage === 'correct' && <section className="reflection-card"><span className="reflection-eyebrow">내 마음에 맞게 고치기</span><h2>어떤 정리가 더 가까운가요?</h2><p>분류를 고르고, 다르게 느낀 점을 자유롭게 적어주세요.</p>
            <div className="correction-options" role="group" aria-label="고백 분류 수정">{principleCategories.map(item => <button key={item.id} aria-pressed={correctionCategory === item.id} className={correctionCategory === item.id ? 'selected' : ''} onClick={() => { keyboard.hide(); setCorrectionCategory(item.id); }}>{item.name}{correctionCategory === item.id && <CheckIcon size={14} />}</button>)}</div>
            <p className="correction-description">{categoryFor(correctionCategory).description}</p><button className="flow-text" onClick={() => { keyboard.hide(); setDraft(''); setStage('review'); }}>기존 정리로 돌아가기</button>
          </section>}
          {stage === 'principle' && result && <section className="reflection-card"><span className="reflection-eyebrow"><BookmarkSimpleIcon size={15} />나만의 기준 만들기</span><h2>오늘의 고백을<br />내일의 원칙으로.</h2><p>아래 입력창에서 나의 말로 바꿔보세요.<br />실천할 수 있는 작은 기준 하나면 충분해요.</p>
            <blockquote className="principle-preview">{draft || '나에게 맞는 투자 원칙을 적어주세요.'}</blockquote><small>확인한 정리 · {categoryFor(result.category).name}</small>
            <button className="flow-text" onClick={() => { keyboard.hide(); setDraft(''); setStage('review'); }}>고백 정리 다시 보기</button>
          </section>}
          {stage === 'saved' && <section className="reflection-card saved-card" role="status"><span className="saved-check"><CheckIcon size={30} /></span><h2>{trade ? '거래와 원칙을 연결했어요.' : '나의 원칙으로 남겼어요.'}</h2><p>다음 선택을 앞두고 다시 꺼내보세요.<br />다음 대화에서도 이 기준을 함께 돌아볼게요.</p><small>{storageAvailable ? '이 브라우저에 저장됩니다. 새로고침해도 유지돼요.' : '브라우저 저장이 제한되어 현재 화면에서만 유지돼요.'}</small><button className="flow-primary" onClick={() => { keyboard.hide(); onSavedView(); }}><BookmarkSimpleIcon size={18} />{trade ? '투자 오답노트 보기' : '나의 투자 원칙 보기'}</button><button className="flow-text" onClick={onBack}>{trade ? '매매 상세로 돌아가기' : '고해성사 홈으로 돌아가기'}</button></section>}
        </div>
        <div ref={endRef} />
      </div>
    </MobileScroll>
    {editable && <form className="chat-composer" style={{ bottom: bottomInset, transition: keyboardDragging ? 'none' : undefined }} onSubmit={event => { event.preventDefault(); submit(); }}>
      <div className="chat-input-wrap"><KeyboardTextarea aria-label={stage === 'principle' ? '나의 투자 원칙 입력' : stage === 'correct' ? '고백 정리 수정 의견' : '투자 이야기 직접 입력'} placeholder={stage === 'principle' ? '내가 실천할 투자 원칙을 적어주세요' : stage === 'correct' ? '다르게 느낀 점을 적어주세요 (선택)' : '그때의 생각을 자유롭게 적어주세요'} rows={2} maxLength={maxLength} value={draft}
        onChange={event => { setDraft(event.target.value); setHint(undefined); if (trade && questionIndex === 2 && stage === 'interview') setApplication(reference ? 'uncertain' : 'not_applicable'); }} onBlur={() => keyboard.hide()}
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
      {selected && <article className="principle-detail"><span className="reflection-eyebrow">{principleDate(selected.createdAt)}에 남긴 원칙</span><h1>{selected.text}</h1><PrincipleBadge category={selected.category} />{selected.trade && <TradeFactCard trade={normalizeTrade(selected.trade)} compact />}
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


function TradeFactCard({ trade, compact = false }: { trade: ReflectionTrade; compact?: boolean }) {
  const signedPercent = (value: number | null) => value === null ? '미기록' : `${value > 0 ? '+' : ''}${value}%`;
  return <section className={`trade-facts ${compact ? 'compact' : ''}`} aria-label="회고할 거래 정보">
    <div className="trade-fact-heading"><span className={`trade-side ${trade.side}`}>{tradeAction(trade)}</span><strong>{trade.name}</strong><small>시연용 거래</small></div>
    <p>{tradeDate(trade.executedAt)} · {trade.quantity}주 · {formatWon(trade.price)}</p>
    {trade.record && <p>보유 {trade.record.beforeQuantity}주 → {trade.record.afterQuantity}주</p>}
    {!compact && <><dl className="trade-metrics">
      <div><dt>체결 금액</dt><dd>{formatWon(trade.price * trade.quantity)}</dd></div><div><dt>시연 전일 대비</dt><dd className={trade.change !== null && trade.change >= 0 ? 'positive' : 'negative'}>{signedPercent(trade.change)}</dd></div>
      <div><dt>시연 거래량 / 평균</dt><dd>{trade.volumeRatio === null ? '미기록' : `${trade.volumeRatio.toFixed(1)}배`}</dd></div><div><dt>거래 후 주식 내 비중</dt><dd>{trade.weightAfter === null ? '미기록' : `${trade.weightAfter}%`}</dd></div>
    </dl><small className="trade-context-note">주식 평가액 기준 비중 {trade.weightBefore === null ? '미기록' : `${trade.weightBefore}%`} → {trade.weightAfter === null ? '미기록' : `${trade.weightAfter}%`}<br />시연 시장 등락 {signedPercent(trade.marketChange)} · 가격 흐름·시세 지표는 시연용 예시</small></>}
  </section>;
}

function TradeTimingChart({ trade }: { trade: ReflectionTrade }) {
  const [showAfter, setShowAfter] = useState(false);
  if (!trade.prices) return <section className="timing-card" aria-label="거래 시점 차트"><div className="section-heading"><h2>거래 시점 기록</h2><span>시세 미기록</span></div><p>이전 버전의 거래에는 시점별 시세가 없어 체결가 {formatWon(trade.price)}만 확인할 수 있어요.</p></section>;
  const values = trade.prices.slice(0, showAfter ? 10 : 7);
  const min = Math.min(...values) * .98, max = Math.max(...values) * 1.02;
  const x = (index: number) => 42 + index / (values.length - 1) * 292;
  const y = (price: number) => 184 - (price - min) / (max - min) * 116;
  const points = (start: number, end: number) => values.slice(start, end).map((price, offset) => `${x(start + offset)},${y(price)}`).join(' ');
  return <section className="timing-card" aria-label="거래 시점 차트">
    <div className="section-heading"><h2>그때, 이 가격에서</h2><span>가상 가격 흐름</span></div>
    <p>체결 당시 확인할 수 있었던 흐름을 먼저 살펴봐요.</p>
    <svg viewBox="0 0 360 225" role="img" aria-label={`${trade.name} 가상 가격 차트, ${tradeAction(trade)} 체결가 ${trade.price}원. ${showAfter ? '사후 가상 흐름을 점선으로 표시' : '체결 이후 가격은 숨김'}`}>
      {showAfter && <rect x={x(6)} y="48" width={334 - x(6)} height="139" fill="#ffffff04" />}
      {[0, .5, 1].map(ratio => <g key={ratio}><line x1="42" x2="334" y1={68 + ratio * 116} y2={68 + ratio * 116} stroke="#333540" strokeDasharray="3 5" /><text x="3" y={72 + ratio * 116}>{Math.round(max - ratio * (max - min)).toLocaleString('ko-KR')}</text></g>)}
      <polyline points={points(0, 7)} fill="none" stroke="#efa0ce" strokeWidth="2.5" strokeLinejoin="round" />
      {showAfter && <polyline points={points(6, 10)} fill="none" stroke="#919ba9" strokeWidth="2" strokeDasharray="4 5" />}
      <line x1={x(6)} x2={x(6)} y1="55" y2="190" stroke="#db729e" strokeDasharray="2 4" />
      <circle cx={x(6)} cy={y(trade.price)} r="5" fill="#faafd8" stroke="#1d2029" strokeWidth="3" />
      <text x={Math.min(x(6), 292)} y="33" textAnchor="end" className="chart-marker-label">{tradeAction(trade)} · {formatWon(trade.price)}</text>
      <text x="42" y="210">체결 60분 전</text><text x={x(6)} y="210" textAnchor="end">체결 시점</text>
      {showAfter && <text x="335" y="210" textAnchor="end">이후</text>}
    </svg>
    <button className="chart-toggle" aria-pressed={showAfter} onClick={() => setShowAfter(!showAfter)}>{showAfter ? '사후 흐름 숨기기' : '사후 흐름 따로 보기'}<CaretDownIcon size={14} /></button>
    <small>{showAfter ? '점선은 사후 설명용 가상 가격입니다. 당시에는 알 수 없었던 정보예요.' : '당시 지표와 사후 결과를 구분해 판단 과정을 돌아봐요.'}</small>
  </section>;
}

function PrincipleComparison({ reference, application, onChange }: { reference: PrincipleReference | null; application: PrincipleApplication; onChange?: (value: PrincipleApplication) => void }) {
  return <section className="principle-comparison" aria-label="이전 원칙 적용 여부">
    <span className="reflection-eyebrow"><ShieldCheckIcon size={16} />이전 원칙과 이번 선택</span>
    {reference ? <><blockquote>{reference.text}</blockquote><small>{reference.source === 'example' ? '시연용 예시 원칙' : '사용자가 남긴 원칙'} · 거래 전 작성</small>
      <span className={`application-label application-${application}`}>{applicationLabels[application]} · 사용자 확인</span>
      {onChange && <div className="application-options" role="group" aria-label="원칙 적용 여부 확인">{(['kept', 'missed', 'uncertain'] as const).map(value => <button key={value} aria-pressed={application === value} onClick={() => onChange(value)}>{applicationLabels[value]}</button>)}</div>}
      <p>수익과 손실이 아니라, 스스로 정한 기준을 적용했는지 확인해요.</p></>
      : <><p>거래 전에 남긴 원칙이 없어 이번에는 준수 여부를 평가하지 않아요.</p><span className="application-label">비교할 원칙 없음</span></>}
  </section>;
}

function PatternReport({ records, total, isExample, onCategory }: { records: TradeReflection[]; total: number; isExample: boolean; onCategory: (category: PrincipleCategory) => void }) {
  const reviewed = records.length;
  const confirmed = records.filter(item => item.reference && ['kept', 'missed'].includes(item.application));
  const kept = confirmed.filter(item => item.application === 'kept').length;
  const uncertain = records.filter(item => item.reference && item.application === 'uncertain').length;
  const counts = principleCategories.map(category => ({ ...category, count: records.filter(item => item.category === category.id).length }));
  const repeated = counts.filter(item => !['none', 'unsure'].includes(item.id) && item.count >= 2).sort((a, b) => b.count - a.count);
  return <>
    <section className="journal-hero"><span>MY INVESTMENT NOTES</span><h1>결과보다,<br />선택의 이유를 남겨요.</h1><p>{isExample ? '예시 매매' : '현재 계좌의 매매'} {total}건의 회고</p></section>
    <section className="report-totals" aria-label="거래별 회고 현황"><div><span>전체 거래</span><strong>{total}<small>건</small></strong></div><div><span>회고 완료</span><strong>{reviewed}<small>건</small></strong></div><div><span>회고 필요</span><strong>{total - reviewed}<small>건</small></strong></div></section>
    <section className="application-report"><div><span>이전 원칙 적용</span><strong>{confirmed.length ? Math.round(kept / confirmed.length * 100) + '%' : '—'}</strong></div><p>적용 {kept}건 / 준수·미준수를 확인한 {confirmed.length}건<br />판단 보류 {uncertain}건과 비교 원칙 없는 거래는 비율에서 제외해요.</p></section>
    <section className="pattern-section"><div className="section-heading"><h2>돌아본 선택의 패턴</h2><span>회고 {reviewed}건 기준</span></div>
      <p>미회고 거래의 마음은 추정하지 않아요.</p>
      {counts.map(item => <button className={`pattern-row badge-${item.id}`} key={item.id} onClick={() => onCategory(item.id)} disabled={!item.count} aria-label={`${principleBadges[item.id].label} ${item.count}건 기록 보기`}><div><PrincipleBadge category={item.id} /><span>{item.count}건 · {reviewed ? Math.round(item.count / reviewed * 100) : 0}%</span></div><span className="pattern-track"><i style={{ width: `${reviewed ? item.count / reviewed * 100 : 0}%` }} /></span></button>)}
    </section>
    <section className="repeat-insight"><SparkleIcon size={18} /><div><h2>{repeated.length ? '다시 나타난 선택이 있어요' : reviewed ? '조금씩 나의 패턴이 보여요' : '첫 거래부터 돌아볼까요?'}</h2><p>{repeated.length ? `${repeated.map(item => `${principleBadges[item.id].label} ${item.count}건`).join(', ')}이 반복됐어요. 어떤 원칙을 다음 거래에 적용할지 살펴봐요.` : '거래를 회고하면 반복되는 선택과 원칙 적용 이력을 함께 볼 수 있어요.'}</p></div></section>
  </>;
}

type ReminderSettings = { enabled: boolean; privatePreview: boolean; hour: '17:00' | '20:00' };
const reminderStorageKey = 'kiwoom-confession-reminder-v1.2';
function readReminderSettings(): ReminderSettings {
  try {
    const data = JSON.parse(localStorage.getItem(reminderStorageKey) || 'null');
    if (data && typeof data.enabled === 'boolean' && typeof data.privatePreview === 'boolean' && ['17:00', '20:00'].includes(data.hour)) return data;
  } catch { /* Storage restrictions leave reminders off. */ }
  return { enabled: false, privatePreview: true, hour: '17:00' };
}

function TradeWorkspace({ initialView, initialTrade, portfolioTrades, journal, principles, preferred, storageAvailable, onBack, onStart, onPrinciples }: {
  initialView: 'trades' | 'patterns'; initialTrade: ReflectionTrade | null; portfolioTrades: ReflectionTrade[]; journal: TradeReflection[]; principles: InvestmentPrinciple[];
  preferred: InvestmentPrinciple | null; storageAvailable: boolean; onBack: () => void; onStart: (trade: ReflectionTrade, reference: PrincipleReference | null) => void; onPrinciples: () => void;
}) {
  const keyboard = useKeyboard(), { device } = useMobileDevice(), { bottomInset } = useKeyboardInsets();
  const [view, setView] = useState<'trades' | 'patterns' | 'settings'>(initialView);
  const [selectedId, setSelectedId] = useState(initialTrade?.id || null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [side, setSide] = useState<'all' | 'buy' | 'sell'>('all');
  const [category, setCategory] = useState<PrincipleCategory | null>(null);
  const [examples, setExamples] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(() => {
    if (!initialTrade) return null;
    const previous = journal.find(item => item.tradeId === initialTrade.id)?.reference;
    const choices = eligibleReferences(initialTrade, principles);
    return (previous?.source === 'example' ? previous.id : choices.find(item => item.id === previous?.id)?.id) || choices[0]?.id || null;
  });
  const [settings, setSettings] = useState(readReminderSettings);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null), backRef = useRef<HTMLButtonElement>(null);
  const availableTrades = portfolioTrades;
  const selected = availableTrades.find(item => item.id === selectedId);
  const ownRecords = journal.filter(item => availableTrades.some(trade => trade.id === item.tradeId));
  const records = examples ? demoJournal.filter(item => availableTrades.some(trade => trade.id === item.tradeId)) : ownRecords;
  const existing = records.find(item => item.tradeId === selectedId);
  const references = selected ? eligibleReferences(selected, principles) : [];
  const reference = referenceId === exampleReference.id ? exampleReference : references.find(item => item.id === referenceId) || null;
  const remaining = portfolioTrades.length - journal.filter(item => portfolioTrades.some(trade => trade.id === item.tradeId)).length;
  const filtered = availableTrades.filter(trade => {
    const record = records.find(item => item.tradeId === trade.id);
    return (side === 'all' || trade.side === side) && (filter === 'all' || (filter === 'reviewed' ? !!record : !record)) && (!category || record?.category === category);
  });
  useEffect(() => { contentRef.current?.closest('.mobile-scroll')?.scrollTo({ top: 0, behavior: 'instant' }); backRef.current?.focus({ preventScroll: true }); }, [selectedId, view]);
  function openTrade(trade: ReflectionTrade) {
    keyboard.hide(); setSelectedId(trade.id); setNotice('');
    const choices = eligibleReferences(trade, principles);
    const previous = journal.find(item => item.tradeId === trade.id)?.reference;
    setReferenceId(choices.find(item => item.id === preferred?.id)?.id || (previous?.source === 'example' ? previous.id : choices.find(item => item.id === previous?.id)?.id) || choices[0]?.id || null);
  }
  function navigate(next: 'trades' | 'patterns' | 'settings') { keyboard.hide(); setExamples(false); setSelectedId(null); setView(next); setCategory(null); setNotice(''); setPreview(false); }
  function back() { keyboard.hide(); if (selected) setSelectedId(null); else if (view === 'settings') navigate('patterns'); else onBack(); }
  function changeSettings(next: ReminderSettings) {
    setSettings(next); setPreview(false);
    try { localStorage.setItem(reminderStorageKey, JSON.stringify(next)); setNotice(''); } catch { setNotice('설정은 현재 화면에서만 유지돼요.'); }
  }
  return <main className="kiwoom trade-workspace" aria-label="거래 기반 투자 오답노트">
    <header className="chat-header" style={{ paddingTop: device.geometry.safeArea.top }}><button ref={backRef} className="icon-button" aria-label={selected ? '거래 목록으로 돌아가기' : view === 'settings' ? '오답노트로 돌아가기' : '고해성사 랜딩으로 돌아가기'} onClick={back}><ArrowLeftIcon size={24} /></button><div><strong>{selected ? '매매 돌아보기' : view === 'trades' ? '나의 매매 기록' : view === 'settings' ? '회고 알림' : '투자 오답노트'}</strong><span>투자 고해성사 · v1.2</span></div><button className="icon-button workspace-bell" aria-label="회고 알림 설정" onClick={() => navigate('settings')}><BellIcon size={22} /></button></header>
    <MobileScroll className="trade-workspace-scroll"><div ref={contentRef} className="trade-workspace-content" style={{ paddingTop: device.geometry.safeArea.top + 96 }}>
      <p className="trade-demo-label"><i />시연용 거래 내역 {portfolioTrades.length}건 · 임시 데이터</p>
      {notice && <p role="status" className="principles-notice">{notice}</p>}
      {!storageAvailable && <p role="status" className="principles-storage">저장이 제한되어 현재 화면에서만 유지돼요.</p>}
      {selected ? <>
        <TradeFactCard trade={selected} /><TradeTimingChart key={selected.id} trade={selected} />
        {existing && <section className="journal-entry"><div className="section-heading"><h2>{examples ? '예시 고백 정리' : '이 거래의 고백 정리'}</h2><PrincipleBadge category={existing.category} /></div><blockquote>“{existing.evidence}”</blockquote><p>{existing.explanation}</p>
          <PrincipleComparison reference={existing.reference} application={existing.application} /><h3>다음 선택을 위한 원칙</h3><p className="journal-next-principle">{existing.nextPrinciple}</p><small>회고에 남긴 원칙 스냅샷 · 원칙을 삭제해도 거래 회고는 유지돼요.</small>
          <details className="principle-conversation"><summary>이 거래에서 나눈 대화</summary>{existing.answers.map((answer, index) => <div key={index}><p>{answer.question}</p><blockquote>{answer.text}</blockquote></div>)}</details>
        </section>}
        <section className="reference-picker"><div className="section-heading"><h2>이번에 점검할 원칙</h2><BookmarkSimpleIcon size={18} /></div><p>이 거래 전에 작성·수정한 원칙만 선택할 수 있어요.</p>
          <div role="group" aria-label="거래에 적용할 이전 원칙"><button aria-pressed={!referenceId} onClick={() => setReferenceId(null)}>이전 원칙 없이 돌아보기</button>{references.map(item => <button key={item.id} aria-pressed={referenceId === item.id} onClick={() => setReferenceId(item.id)}>{item.text}</button>)}
          <button aria-pressed={referenceId === exampleReference.id} onClick={() => setReferenceId(exampleReference.id)}><span>시연용 예시 원칙으로 비교</span>{exampleReference.text}</button></div>
          {!references.length && <small>거래 전에 작성한 나의 원칙은 아직 없어요. 예시 원칙은 내 원칙 목록에 추가되지 않아요.</small>}
        </section>
      </> : view === 'patterns' ? <>
        <div className="record-source-switch" role="group" aria-label="오답노트 데이터 선택"><button aria-pressed={!examples} onClick={() => { setExamples(false); setCategory(null); }}>내가 남긴 회고 {ownRecords.length}건</button><button aria-pressed={examples} onClick={() => { setExamples(true); setCategory(null); }}>예시 회고 보기</button></div>
        <PatternReport records={records} total={availableTrades.length} isExample={examples} onCategory={value => { keyboard.hide(); setCategory(value); setFilter('reviewed'); setSide('all'); setView('trades'); }} />
      </> : view === 'settings' ? <section className="reminder-settings"><div className="reminder-icon"><BellIcon size={28} /></div><h1>마감 후, 잠깐의 돌아보기</h1><p>놓친 거래의 판단 이유를 정리할 수 있게<br />가볍게 알려드릴게요.</p>
        <div className="setting-row"><div><strong>회고 알림 받기</strong><small>기본 꺼짐 · 하루 최대 한 번</small></div><button className="setting-switch" role="switch" aria-checked={settings.enabled} aria-label="회고 알림 받기" onClick={() => changeSettings({ ...settings, enabled: !settings.enabled })}><i /></button></div>
        <div className="setting-row"><div><strong>미리보기 정보 숨기기</strong><small>종목명과 매매 금액은 항상 숨겨요</small></div><button className="setting-switch" role="switch" aria-checked={settings.privatePreview} aria-label="알림 미리보기 정보 숨기기" onClick={() => changeSettings({ ...settings, privatePreview: !settings.privatePreview })}><i /></button></div>
        <h2>알림 시간</h2><div className="reminder-times" role="group" aria-label="회고 알림 시간">{(['17:00', '20:00'] as const).map(hour => <button key={hour} aria-pressed={settings.hour === hour} disabled={!settings.enabled} onClick={() => changeSettings({ ...settings, hour })}>{hour}</button>)}</div>
        <button className="flow-secondary reminder-preview-button" disabled={!settings.enabled || !remaining} onClick={() => setPreview(true)}>미회고 거래 알림 미리보기</button>
        {preview && <button className="reminder-preview" role="status" onClick={() => { navigate('trades'); setExamples(false); setFilter('pending'); setSide('all'); }}><span><BellIcon size={15} />투자 고해성사 · {settings.hour}</span><strong>{settings.privatePreview ? '오늘의 투자 판단을 함께 돌아볼까요?' : `돌아보지 않은 매매가 ${remaining}건 있어요.`}</strong><small>눌러서 회고할 거래 보기<ArrowRightIcon size={14} /></small></button>}
        <small className="reminder-disclaimer">실제 푸시가 아닌 앱 안의 시연 화면입니다. 선택한 시간에 자동 발송되지는 않아요.</small>
      </section> : <>
        <section className="trade-list-intro"><h1>선택의 순간을<br />다시 펼쳐볼까요?</h1><p>체결 정보는 준비했어요.<br />그때의 이유만 들려주세요.</p></section>
        {category && <button className="category-filter" onClick={() => setCategory(null)}><PrincipleBadge category={category} />분류 필터 해제<XIcon size={14} /></button>}
        <div className="trade-filter" role="group" aria-label="회고 상태 필터">{([{ id: 'all', label: '전체' }, { id: 'pending', label: '회고 필요' }, { id: 'reviewed', label: '회고 완료' }] as const).map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
        <div className="trade-filter side-filter" role="group" aria-label="매매 종류 필터">{([{ id: 'all', label: '모든 매매' }, { id: 'buy', label: '매수' }, { id: 'sell', label: '매도' }] as const).map(item => <button key={item.id} aria-pressed={side === item.id} onClick={() => setSide(item.id)}>{item.label}</button>)}</div>
        <div className="trade-list-heading"><span>{filtered.length}건</span><small>최근 체결 순 · 한국 시간</small></div>
        <div className="trade-list">{filtered.map(item => { const record = records.find(entry => entry.tradeId === item.id); return <button className="trade-list-card" key={item.id} aria-label={`${item.name} ${tradeAction(item)} ${tradeDate(item.executedAt)} ${record ? '회고 완료' : '회고 필요'}`} onClick={() => openTrade(item)}>
          <span className="trade-list-top"><span className={`trade-side ${item.side}`}>{tradeAction(item)}</span><strong>{item.name}</strong><CaretRightIcon size={18} /></span><span className="trade-list-date">{tradeDate(item.executedAt)} · {item.quantity}주</span><span className="trade-list-bottom"><b>{formatWon(item.price)}</b>{record ? <PrincipleBadge category={record.category} /> : <small>회고 필요</small>}</span></button>; })}</div>
        {!filtered.length && <section className="trade-empty"><ReceiptIcon size={28} /><p>{availableTrades.length ? '이 조건에 맞는 거래가 없어요.' : '표시할 거래 내역이 없어요.'}</p>{availableTrades.length ? <button className="flow-text" onClick={() => { setFilter('all'); setSide('all'); setCategory(null); }}>전체 거래 보기</button> : null}</section>}
      </>}
    </div></MobileScroll>
    <footer className="workspace-footer" style={{ bottom: bottomInset }}>{selected ? <button className="flow-primary" onClick={() => { keyboard.hide(); onStart(selected, reference); }}>{existing ? '이 거래 다시 돌아보기' : '이 거래 돌아보기'}<ArrowRightIcon size={18} /></button>
      : <nav aria-label="투자 고해성사 메뉴"><button aria-current={view === 'trades' ? 'page' : undefined} onClick={() => navigate('trades')}><ReceiptIcon size={21} />매매 기록</button><button aria-current={view === 'patterns' ? 'page' : undefined} onClick={() => navigate('patterns')}><ChartLineIcon size={21} />오답노트</button><button onClick={() => { keyboard.hide(); onPrinciples(); }}><BookmarkSimpleIcon size={21} />투자 원칙</button></nav>}</footer>
  </main>;
}
