const MARKET_DATA = {
  INFY: { companyName: "Infosys", price: 1555.45, changePct: -1.6, pe: 28.4, eps: 54.7, marketCapCr: 645000 },
  RELIANCE: { companyName: "Reliance Industries", price: 2112.4, changePct: 1.44, pe: 24.1, eps: 87.1, marketCapCr: 1875000 },
  TCS: { companyName: "Tata Consultancy Services", price: 3194.8, changePct: -0.25, pe: 31.2, eps: 102.4, marketCapCr: 1165000 },
  WIPRO: { companyName: "Wipro", price: 577.75, changePct: 0.32, pe: 21.8, eps: 26.5, marketCapCr: 318000 },
  HDFCBANK: { companyName: "HDFC Bank", price: 1522.35, changePct: 0.11, pe: 19.2, eps: 79.3, marketCapCr: 1290000 },
  ICICIBANK: { companyName: "ICICI Bank", price: 987.65, changePct: -0.85, pe: 18.6, eps: 53.1, marketCapCr: 702000 },
  HINDUNILVR: { companyName: "Hindustan Unilever", price: 2417.4, changePct: 0.21, pe: 61.4, eps: 39.4, marketCapCr: 571000 },
  ITC: { companyName: "ITC", price: 207.9, changePct: 0.8, pe: 23.4, eps: 8.9, marketCapCr: 258000 },
  KOTAKBANK: { companyName: "Kotak Mahindra Bank", price: 1789.25, changePct: -0.45, pe: 20.1, eps: 88.9, marketCapCr: 356000 },
  LT: { companyName: "Larsen & Toubro", price: 3456.78, changePct: 2.15, pe: 33.4, eps: 103.5, marketCapCr: 474000 },
  BAJFINANCE: { companyName: "Bajaj Finance", price: 6789.12, changePct: 1.75, pe: 34.6, eps: 196.2, marketCapCr: 420000 },
  MARUTI: { companyName: "Maruti Suzuki", price: 9876.54, changePct: -0.95, pe: 29.1, eps: 339.4, marketCapCr: 298000 },
  AXISBANK: { companyName: "Axis Bank", price: 876.43, changePct: 0.65, pe: 14.2, eps: 61.7, marketCapCr: 270000 },
  M_M: { companyName: "Mahindra & Mahindra", price: 779.8, changePct: -0.01, pe: 22.6, eps: 34.1, marketCapCr: 97000 },
  NTPC: { companyName: "NTPC", price: 234.56, changePct: -0.35, pe: 13.8, eps: 17.0, marketCapCr: 228000 },
  POWERGRID: { companyName: "Power Grid Corporation", price: 312.45, changePct: 0.75, pe: 14.5, eps: 21.6, marketCapCr: 289000 },
  ONGC: { companyName: "ONGC", price: 116.8, changePct: -0.09, pe: 7.8, eps: 15.2, marketCapCr: 147000 },
  COALINDIA: { companyName: "Coal India", price: 445.67, changePct: 1.25, pe: 8.7, eps: 51.2, marketCapCr: 275000 },
  TATAMOTORS: { companyName: "Tata Motors", price: 678.9, changePct: -2.15, pe: 16.1, eps: 42.2, marketCapCr: 250000 },
  SUNPHARMA: { companyName: "Sun Pharma", price: 1234.56, changePct: 0.95, pe: 36.2, eps: 34.1, marketCapCr: 297000 },
  SBIN: { companyName: "State Bank of India", price: 430.2, changePct: -0.34, pe: 11.1, eps: 38.7, marketCapCr: 385000 },
  BHARTIARTL: { companyName: "Bharti Airtel", price: 541.15, changePct: 2.99, pe: 52.3, eps: 10.6, marketCapCr: 305000 },
  KPITTECH: { companyName: "KPIT Technologies", price: 266.45, changePct: 3.54, pe: 66.5, eps: 4.0, marketCapCr: 73000 },
  SGBMAY29: { companyName: "SGB May 2029", price: 4719.0, changePct: 0.15, pe: 0, eps: 0, marketCapCr: 12000 },
  TATAPOWER: { companyName: "Tata Power", price: 124.15, changePct: -0.24, pe: 24.7, eps: 5.0, marketCapCr: 39600 },
  EVEREADY: { companyName: "Eveready Industries", price: 312.35, changePct: -1.24, pe: 31.8, eps: 9.8, marketCapCr: 2300 },
  JUBLFOOD: { companyName: "Jubilant FoodWorks", price: 3082.65, changePct: -1.35, pe: 95.3, eps: 32.4, marketCapCr: 203000 },
};

const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase().replace(/&/g, "_");

const seededUnit = (seed, step) => {
  const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const buildIntradayCandles = (symbol, basePrice) => {
  const seed = symbol.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const candleMs = 5 * 60 * 1000;
  const candleCount = 36;
  const now = Date.now();
  const currentBucket = Math.floor(now / candleMs);
  const startBucket = currentBucket - candleCount + 1;
  const candles = [];

  let prevClose = basePrice * (1 + (seededUnit(seed, startBucket) - 0.5) * 0.01);

  for (let i = 0; i < candleCount; i += 1) {
    const bucket = startBucket + i;
    const trend = Math.sin((seed + bucket) / 13) * 0.0009;
    const drift = Math.cos((seed + bucket) / 5) * 0.0006;
    const shock = (seededUnit(seed, bucket) - 0.5) * 0.0022;
    const open = prevClose;
    const close = open * (1 + trend + drift + shock);
    const wickScale = open * (0.0008 + seededUnit(seed + 19, bucket) * 0.0025);
    const high = Math.max(open, close) + wickScale;
    const low = Math.min(open, close) - wickScale * 0.95;
    const volume = Math.floor(150000 + seededUnit(seed + 31, bucket) * 600000);
    const ts = new Date(bucket * candleMs);
    const time = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(Math.max(0.01, low).toFixed(2)),
      close: Number(close.toFixed(2)),
      price: Number(close.toFixed(2)),
      volume,
    });

    prevClose = close;
  }

  const last = candles[candles.length - 1];
  const progress = (now % candleMs) / candleMs;
  const liveJitter = Math.sin((now / 1000 + seed) / 8) * 0.0008 + (progress - 0.5) * 0.0006;
  const livePrice = Number((last.close * (1 + liveJitter)).toFixed(2));

  last.close = livePrice;
  last.price = livePrice;
  last.high = Number(Math.max(last.high, livePrice).toFixed(2));
  last.low = Number(Math.min(last.low, livePrice).toFixed(2));

  return { candles, livePrice };
};

const getMarketSymbols = () =>
  Object.entries(MARKET_DATA)
    .map(([symbol, info]) => ({
      symbol,
      displaySymbol: symbol.replace(/_/g, "&"),
      companyName: info.companyName,
    }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

const getMarketSnapshot = (symbolInput) => {
  const symbol = normalizeSymbol(symbolInput);
  const base = MARKET_DATA[symbol];

  if (!base) {
    return null;
  }

  const { candles, livePrice } = buildIntradayCandles(symbol, base.price);
  const dayOpen = candles[0]?.open || base.price;
  const changePct = dayOpen ? Number((((livePrice - dayOpen) / dayOpen) * 100).toFixed(2)) : 0;
  const bid = Number((livePrice - 0.2).toFixed(2));
  const ask = Number((livePrice + 0.2).toFixed(2));
  const closes = candles.map((candle) => candle.close);
  const sma20 = closes.slice(-20).reduce((sum, value) => sum + value, 0) / Math.min(20, closes.length || 1);
  const emaFactor = 2 / (Math.min(20, closes.length) + 1);
  const ema20 = closes.reduce((ema, value) => ema + emaFactor * (value - ema), closes[0] || livePrice);

  return {
    symbol,
    companyName: base.companyName,
    livePrice,
    changePct,
    orderBook: {
      bid: [{ price: bid, quantity: 120 }, { price: Number((bid - 0.1).toFixed(2)), quantity: 80 }],
      ask: [{ price: ask, quantity: 110 }, { price: Number((ask + 0.1).toFixed(2)), quantity: 95 }],
    },
    fundamentals: {
      marketCapCr: base.marketCapCr,
      pe: base.pe,
      eps: base.eps,
    },
    technicalIndicators: {
      rsi14: Number((45 + (symbol.length % 20)).toFixed(1)),
      sma20: Number(sma20.toFixed(2)),
      ema20: Number(ema20.toFixed(2)),
    },
    historical: candles,
  };
};

module.exports = { getMarketSnapshot, normalizeSymbol, getMarketSymbols };
