const YahooFinance = require("yahoo-finance2").default;
const NodeCache = require("node-cache");
const {
  getMarketSnapshot: getSimulatedSnapshot,
  normalizeSymbol,
  getMarketSymbols,
  buildSimulatedRangeCandles,
} = require("./marketData");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Short TTLs keep prices feeling "live" while avoiding hammering the free,
// unofficial Yahoo Finance API on every request across many users/symbols.
const quoteCache = new NodeCache({ stdTTL: 15 });
const chartCache = new NodeCache({ stdTTL: 60 });

const YAHOO_TIMEOUT_MS = 4000;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Yahoo Finance request timed out")), ms))]);

// Corporate actions (demergers, renames) sometimes leave our app's symbol
// pointing at a ticker Yahoo no longer lists under that name. Tata Motors
// demerged into commercial/passenger vehicle entities in 2025; TMCV is the
// continuing "Tata Motors Limited" listing closest to the old TATAMOTORS.
const YAHOO_SYMBOL_OVERRIDES = {
  TATAMOTORS: "TMCV",
};

const toYahooSymbol = (symbol) => `${(YAHOO_SYMBOL_OVERRIDES[symbol] || symbol).replace(/_/g, "&")}.NS`;

const calculateSMA = (closes, period) => {
  const slice = closes.slice(-period);
  if (!slice.length) return null;
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
};

const calculateEMA = (closes, period) => {
  if (!closes.length) return null;
  const factor = 2 / (Math.min(period, closes.length) + 1);
  return closes.reduce((ema, value) => ema + factor * (value - ema), closes[0]);
};

const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const fetchRealQuote = async (symbol) => {
  const cacheKey = `quote_${symbol}`;
  const cached = quoteCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const quote = await withTimeout(yahooFinance.quote(toYahooSymbol(symbol)), YAHOO_TIMEOUT_MS);
  if (!quote || quote.regularMarketPrice == null) {
    quoteCache.set(cacheKey, null, 10);
    return null;
  }
  quoteCache.set(cacheKey, quote);
  return quote;
};

const fetchRealChart = async (symbol) => {
  const cacheKey = `chart_${symbol}`;
  const cached = chartCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const period1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await withTimeout(
    yahooFinance.chart(toYahooSymbol(symbol), { interval: "5m", period1 }),
    YAHOO_TIMEOUT_MS
  );
  const quotes = (result?.quotes || []).filter((q) => q.close != null).slice(-36);
  if (!quotes.length) {
    chartCache.set(cacheKey, null, 20);
    return null;
  }
  chartCache.set(cacheKey, quotes);
  return quotes;
};

const buildCandlesFromChart = (quotes) =>
  quotes.map((q) => {
    const ts = new Date(q.date);
    const time = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
    return {
      time,
      open: Number((q.open ?? q.close).toFixed(2)),
      high: Number((q.high ?? q.close).toFixed(2)),
      low: Number((q.low ?? q.close).toFixed(2)),
      close: Number(q.close.toFixed(2)),
      price: Number(q.close.toFixed(2)),
      volume: q.volume || 0,
    };
  });

const RANGE_CONFIG = {
  "1D": { interval: "5m", lookbackDays: 1, labelMode: "time" },
  "5D": { interval: "30m", lookbackDays: 5, labelMode: "time" },
  "1M": { interval: "1d", lookbackDays: 31, labelMode: "date" },
  "6M": { interval: "1d", lookbackDays: 183, labelMode: "date" },
  YTD: { interval: "1d", lookbackDays: null, labelMode: "date" },
  "1Y": { interval: "1d", lookbackDays: 365, labelMode: "date" },
  "5Y": { interval: "1wk", lookbackDays: 5 * 365, labelMode: "date" },
  MAX: { interval: "1mo", lookbackDays: 15 * 365, labelMode: "month" },
};

const formatLabel = (date, labelMode) => {
  if (labelMode === "time") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (labelMode === "month") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const buildLabeledCandles = (quotes, labelMode) =>
  quotes.map((q) => ({
    time: formatLabel(new Date(q.date), labelMode),
    open: Number((q.open ?? q.close).toFixed(2)),
    high: Number((q.high ?? q.close).toFixed(2)),
    low: Number((q.low ?? q.close).toFixed(2)),
    close: Number(q.close.toFixed(2)),
    price: Number(q.close.toFixed(2)),
    volume: q.volume || 0,
  }));

/**
 * Historical candles for a selectable timeframe (1D/5D/1M/6M/YTD/1Y/5Y/MAX),
 * used by the price chart. Live-first via Yahoo Finance; falls back to a
 * deterministic simulated walk (anchored to the current live/simulated
 * price) whenever real data isn't available, so a chart is always returned.
 */
const getHistoricalRange = async (symbolInput, rangeKey) => {
  const symbol = normalizeSymbol(symbolInput);
  const config = RANGE_CONFIG[rangeKey] || RANGE_CONFIG["1D"];
  const cacheKey = `range_${symbol}_${rangeKey}`;
  const cached = chartCache.get(cacheKey);
  if (cached !== undefined && cached !== null) {
    return cached;
  }

  const snapshot = await getMarketSnapshot(symbol);
  if (!snapshot) {
    return null;
  }

  try {
    const period1 =
      rangeKey === "YTD"
        ? new Date(new Date().getFullYear(), 0, 1)
        : new Date(Date.now() - config.lookbackDays * 24 * 60 * 60 * 1000);
    const result = await withTimeout(
      yahooFinance.chart(toYahooSymbol(symbol), { interval: config.interval, period1 }),
      YAHOO_TIMEOUT_MS
    );
    const quotes = (result?.quotes || []).filter((q) => q.close != null);
    if (!quotes.length) {
      throw new Error("No historical data returned");
    }
    const payload = { candles: buildLabeledCandles(quotes, config.labelMode), source: "live" };
    chartCache.set(cacheKey, payload, 300);
    return payload;
  } catch (_error) {
    // For 1D, the snapshot's own simulated intraday candles already have
    // proper HH:MM labels — reuse them instead of the generic range walk.
    if (rangeKey === "1D" && Array.isArray(snapshot.historical)) {
      const payload = { candles: snapshot.historical, source: "simulated" };
      chartCache.set(cacheKey, payload, 60);
      return payload;
    }

    const rawCandles = buildSimulatedRangeCandles(symbol, snapshot.livePrice, rangeKey);
    const n = rawCandles.length;
    const lookbackMs =
      rangeKey === "YTD"
        ? Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()
        : config.lookbackDays * 24 * 60 * 60 * 1000;
    const candles = rawCandles.map((c, idx) => {
      const msAgo = lookbackMs * (1 - idx / Math.max(1, n - 1));
      return { ...c, time: formatLabel(new Date(Date.now() - msAgo), config.labelMode) };
    });
    const payload = { candles, source: "simulated" };
    chartCache.set(cacheKey, payload, 60);
    return payload;
  }
};

/**
 * The live, real-world market snapshot — same shape as the simulated one so
 * every existing caller (trading, portfolio valuation, watchlists, pending
 * order triggers) keeps working unchanged. Falls back to the deterministic
 * simulator whenever Yahoo Finance is slow, rate-limited, or doesn't cover a
 * symbol, so a snapshot is always returned and trading never breaks.
 */
const getMarketSnapshot = async (symbolInput) => {
  const symbol = normalizeSymbol(symbolInput);
  const simulated = getSimulatedSnapshot(symbol);
  if (!simulated) {
    return null;
  }

  try {
    const quote = await fetchRealQuote(symbol);
    if (!quote) {
      return { ...simulated, source: "simulated" };
    }

    const livePrice = Number(quote.regularMarketPrice.toFixed(2));
    const changePct = Number((quote.regularMarketChangePercent ?? simulated.changePct).toFixed(2));

    let historical = simulated.historical;
    let technicalIndicators = simulated.technicalIndicators;

    try {
      const quotes = await fetchRealChart(symbol);
      if (quotes) {
        historical = buildCandlesFromChart(quotes);
        const closes = historical.map((c) => c.close);
        technicalIndicators = {
          rsi14: calculateRSI(closes) ?? simulated.technicalIndicators.rsi14,
          sma20: Number((calculateSMA(closes, 20) ?? simulated.technicalIndicators.sma20).toFixed(2)),
          ema20: Number((calculateEMA(closes, 20) ?? simulated.technicalIndicators.ema20).toFixed(2)),
        };
      }
    } catch (_chartError) {
      // Keep simulated chart/indicators; the real quoted price above still applies.
    }

    const hasRealBidAsk = quote.bid > 0 && quote.ask > 0;
    const bid = hasRealBidAsk ? Number(quote.bid.toFixed(2)) : Number((livePrice - 0.2).toFixed(2));
    const ask = hasRealBidAsk ? Number(quote.ask.toFixed(2)) : Number((livePrice + 0.2).toFixed(2));

    return {
      symbol,
      companyName: simulated.companyName,
      livePrice,
      changePct,
      source: "live",
      previousClose: quote.regularMarketPreviousClose ?? simulated.previousClose,
      dayOpen: quote.regularMarketOpen ?? simulated.dayOpen,
      dayHigh: quote.regularMarketDayHigh ?? simulated.dayHigh,
      dayLow: quote.regularMarketDayLow ?? simulated.dayLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? simulated.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? simulated.fiftyTwoWeekLow,
      dividendRate: quote.trailingAnnualDividendRate ?? null,
      asOf: new Date().toISOString(),
      orderBook: {
        bid: [{ price: bid, quantity: quote.bidSize || 120 }, { price: Number((bid - 0.1).toFixed(2)), quantity: 80 }],
        ask: [{ price: ask, quantity: quote.askSize || 110 }, { price: Number((ask + 0.1).toFixed(2)), quantity: 95 }],
      },
      fundamentals: {
        marketCapCr: quote.marketCap ? Number((quote.marketCap / 10000000).toFixed(0)) : simulated.fundamentals.marketCapCr,
        pe: quote.trailingPE ? Number(quote.trailingPE.toFixed(1)) : simulated.fundamentals.pe,
        eps: quote.epsTrailingTwelveMonths ?? simulated.fundamentals.eps,
      },
      technicalIndicators,
      historical,
    };
  } catch (_error) {
    return { ...simulated, source: "simulated" };
  }
};

module.exports = { getMarketSnapshot, getHistoricalRange, normalizeSymbol, getMarketSymbols };
