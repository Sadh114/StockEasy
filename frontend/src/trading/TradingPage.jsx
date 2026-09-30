import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import SentimentCard from "../components/AI/SentimentCard";
import RecommendationPanel from "../components/AI/RecommendationPanel";
import FundamentalsMeter from "../components/AI/FundamentalsMeter";

const defaultSymbol = "INFY";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CHART_RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

// Google-Finance-style line/area price chart: smooth line, gradient fill,
// hover crosshair with a price+time tooltip, and a dashed previous-close
// reference line (shown only on the 1D view, matching real stock pages).
const PriceLineChart = ({ candles, isUp, previousClose, range }) => {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!candles?.length) {
    return <div className="chart-empty">No chart data</div>;
  }

  const closes = candles.map((c) => Number(c.close ?? c.price));
  const values = previousClose && range === "1D" ? [...closes, previousClose] : closes;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const pad = spread * 0.08;

  const W = 100;
  const H = 60;
  const toX = (idx) => (idx / (closes.length - 1 || 1)) * W;
  const toY = (value) => H - ((value - (min - pad)) / (spread + pad * 2)) * H;

  const linePath = closes.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L ${toX(closes.length - 1).toFixed(2)} ${H} L 0 ${H} Z`;

  const lineColor = isUp ? "#0b8043" : "#c5221f";
  const fillId = isUp ? "priceFillUp" : "priceFillDown";

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (closes.length - 1));
    setHoverIdx(Math.max(0, Math.min(closes.length - 1, idx)));
  };

  const hovered = hoverIdx != null ? candles[hoverIdx] : null;
  const hoverX = hoverIdx != null ? toX(hoverIdx) : null;
  const hoverY = hoverIdx != null ? toY(closes[hoverIdx]) : null;
  const prevCloseY = previousClose ? toY(previousClose) : null;

  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "260px", cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.2, 0.4, 0.6, 0.8].map((level) => (
          <line key={level} x1="0" y1={H * level} x2={W} y2={H * level} stroke="#e8eaed" strokeWidth="0.3" />
        ))}

        <path d={areaPath} fill={`url(#${fillId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />

        {prevCloseY != null && range === "1D" ? (
          <line x1="0" y1={prevCloseY} x2={W} y2={prevCloseY} stroke="#9aa0a6" strokeWidth="0.3" strokeDasharray="1 1" />
        ) : null}

        {hoverX != null ? (
          <>
            <line x1={hoverX} y1="0" x2={hoverX} y2={H} stroke="#9aa0a6" strokeWidth="0.3" strokeDasharray="1 1" />
            <circle cx={hoverX} cy={hoverY} r="1" fill={lineColor} stroke="white" strokeWidth="0.3" />
          </>
        ) : null}
      </svg>

      {hovered ? (
        <div style={{ textAlign: "center", fontSize: "0.85em", marginTop: "4px" }}>
          <span
            style={{
              background: "#fff",
              border: "1px solid #dadce0",
              borderRadius: "4px",
              padding: "4px 10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            {money(Number(hovered.close ?? hovered.price).toFixed(2))} &nbsp;
            <span className="muted">{hovered.time}</span>
          </span>
        </div>
      ) : previousClose && range === "1D" ? (
        <div style={{ textAlign: "right", fontSize: "0.78em", color: "#9aa0a6", marginTop: "-14px", marginRight: "4px" }}>
          Previous close {previousClose}
        </div>
      ) : null}
    </div>
  );
};

const TradingPage = () => {
  const [symbolInput, setSymbolInput] = useState(defaultSymbol);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [marketSymbols, setMarketSymbols] = useState([]);
  const [market, setMarket] = useState(null);
  const [marketError, setMarketError] = useState("");
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);

  const [range, setRange] = useState("1D");
  const [historyCandles, setHistoryCandles] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  const [triggerType, setTriggerType] = useState("BUY");
  const [triggerCategory, setTriggerCategory] = useState("LIMIT");
  const [triggerQuantity, setTriggerQuantity] = useState(1);
  const [triggerPrice, setTriggerPrice] = useState("");
  const [placingTriggerOrder, setPlacingTriggerOrder] = useState(false);
  const [activeTriggerOrders, setActiveTriggerOrders] = useState([]);

  const loadPendingTriggerOrders = async () => {
    try {
      const { data } = await apiClient.get("/api/orders/pending");
      if (data?.success) {
        setActiveTriggerOrders(data.data.filter((item) => item.status === "ACTIVE"));
      }
    } catch (_err) {
      // Non-critical, leave list as-is.
    }
  };

  useEffect(() => {
    loadPendingTriggerOrders();
  }, []);

  const submitTriggerOrder = async () => {
    setPlacingTriggerOrder(true);
    try {
      const { data } = await apiClient.post("/api/orders/pending", {
        symbol,
        type: triggerType,
        orderCategory: triggerCategory,
        quantity: Number(triggerQuantity),
        triggerPrice: Number(triggerPrice),
      });
      if (!data?.success) {
        toast.error(data?.message || "Unable to place order.");
        return;
      }
      toast.success(data.message);
      setTriggerPrice("");
      loadPendingTriggerOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to place order.");
    } finally {
      setPlacingTriggerOrder(false);
    }
  };

  const cancelTriggerOrder = async (id) => {
    try {
      const { data } = await apiClient.delete(`/api/orders/pending/${id}`);
      if (data?.success) {
        toast.success("Order cancelled.");
        loadPendingTriggerOrders();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to cancel order.");
    }
  };

  const loadMarket = async (selectedSymbol) => {
    setLoadingMarket(true);
    setMarketError("");
    try {
      const { data } = await apiClient.get(`/api/market/${selectedSymbol}`);
      if (data?.success) {
        setMarket(data.data);
        setPrice(data.data.livePrice);
      } else {
        setMarketError(data?.message || "Unable to load market data.");
      }
    } catch (err) {
      setMarketError(err?.response?.data?.message || "Unable to load market data.");
    } finally {
      setLoadingMarket(false);
    }
  };

  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const { data } = await apiClient.get("/api/market");
        if (data?.success) {
          setMarketSymbols(data.data || []);
        }
      } catch (_err) {
        setMarketSymbols([]);
      }
    };

    loadSymbols();
  }, []);

  useEffect(() => {
    loadMarket(symbol);
    const interval = setInterval(() => loadMarket(symbol), 8000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    setFollowing(false);
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await apiClient.get(`/api/market/${symbol}/history`, { params: { range } });
        if (!cancelled && data?.success) {
          setHistoryCandles(data.data.candles);
        }
      } catch (_err) {
        if (!cancelled) {
          setHistoryCandles([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();
    const interval = range === "1D" ? setInterval(loadHistory, 8000) : null;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [symbol, range]);

  const handleFollow = async () => {
    try {
      const { data } = await apiClient.post("/api/watchlist", { symbol });
      if (data?.success) {
        setFollowing(true);
        toast.success(`${symbol} added to your watchlist.`);
      } else {
        toast.error(data?.message || "Unable to follow this stock.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to follow this stock.");
    }
  };

  const changePctClass = useMemo(() => {
    if (!market) {
      return "";
    }
    return market.changePct >= 0 ? "profit" : "loss";
  }, [market]);

  const resolveSymbol = () => {
    const query = symbolInput.trim().toUpperCase();
    if (!query) {
      return symbol;
    }

    const exactSymbol = marketSymbols.find((item) => item.symbol === query);
    if (exactSymbol) {
      return exactSymbol.symbol;
    }

    const byName = marketSymbols.find((item) => item.companyName.toUpperCase() === query);
    if (byName) {
      return byName.symbol;
    }

    const containsName = marketSymbols.find((item) => item.companyName.toUpperCase().includes(query));
    if (containsName) {
      return containsName.symbol;
    }

    return query;
  };

  const submitOrder = async (type) => {
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticOrder = {
      id: optimisticId,
      symbol,
      type,
      quantity,
      price,
      status: "PENDING",
      timestamp: new Date().toISOString(),
    };
    setPendingOrders((prev) => [optimisticOrder, ...prev].slice(0, 5));

    setPlacingOrder(true);
    try {
      const { data } = await apiClient.post("/api/trades/execute", {
        symbol,
        type,
        quantity: Number(quantity),
        price: Number(price),
      });

      if (!data?.success) {
        setPendingOrders((prev) => prev.filter((item) => item.id !== optimisticId));
        toast.error(data?.message || "Order failed.");
        return;
      }

      setPendingOrders((prev) =>
        prev.map((item) => (item.id === optimisticId ? { ...item, status: "EXECUTED" } : item))
      );
      const chargesMsg = data?.data?.charges
        ? ` Charges: ${money(data.data.charges.totalCharges)}. Net ${type === "BUY" ? "debited" : "credited"}: ${money(data.data.netAmount)}.`
        : "";
      toast.success((data.message || "Order executed.") + chargesMsg);
    } catch (err) {
      setPendingOrders((prev) => prev.filter((item) => item.id !== optimisticId));
      toast.error(err?.response?.data?.message || "Trade execution failed.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="grid-layout">
      <section className="panel-card">
        <div className="trade-symbol-bar">
          <input
            list="company-search-list"
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            placeholder="Search company or symbol (e.g. Infosys / INFY)"
          />
          <datalist id="company-search-list">
            {marketSymbols.map((item) => (
              <option key={item.symbol} value={item.symbol}>{`${item.companyName} (${item.displaySymbol})`}</option>
            ))}
          </datalist>
          <select
            value={symbol}
            onChange={(event) => {
              setSymbol(event.target.value);
              setSymbolInput(event.target.value);
            }}
          >
            {!marketSymbols.length ? <option value={symbol}>{symbol}</option> : null}
            {marketSymbols.map((item) => (
              <option key={item.symbol} value={item.symbol}>
                {`${item.companyName} (${item.displaySymbol})`}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setSymbol(resolveSymbol())}>
            Load
          </button>
        </div>
        {loadingMarket ? <p>Loading market feed...</p> : null}
        {marketError ? <p className="error">{marketError}</p> : null}
        {market ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0" }}>
                  {market.companyName} ({market.symbol})
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "2em", fontWeight: 600 }}>{money(market.livePrice)}</span>
                  <span
                    className={changePctClass}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      background: market.changePct >= 0 ? "#e6f4ea" : "#fce8e6",
                    }}
                  >
                    {market.changePct >= 0 ? "▲" : "▼"} {Math.abs(market.changePct)}%
                  </span>
                  <span className={changePctClass}>
                    {market.changePct >= 0 ? "+" : ""}
                    {money((market.livePrice - (market.previousClose ?? market.livePrice)).toFixed(2))} today
                  </span>
                </div>
                <p className="muted" style={{ fontSize: "0.85em", margin: "6px 0 0 0" }}>
                  {market.asOf ? new Date(market.asOf).toLocaleString("en-IN") : ""} IST &middot;{" "}
                  {market.source === "live" ? "🟢 Live NSE price via Yahoo Finance" : "🟡 Simulated (live data unavailable)"}
                </p>
              </div>
              <button type="button" className="btn-solid primary" disabled={following} onClick={handleFollow}>
                {following ? "✓ Following" : "+ Follow"}
              </button>
            </div>

            <div className="btn-row" style={{ marginTop: "16px", gap: "4px" }}>
              {CHART_RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: "6px 10px",
                    borderBottom: range === r ? "2px solid #1a73e8" : "2px solid transparent",
                    color: range === r ? "#1a73e8" : "#5f6368",
                    fontWeight: range === r ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {historyLoading && !historyCandles.length ? (
              <p>Loading chart...</p>
            ) : (
              <PriceLineChart
                candles={historyCandles}
                isUp={market.changePct >= 0}
                previousClose={market.previousClose}
                range={range}
              />
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: "1px solid #e8eaed",
                fontSize: "0.9em",
              }}
            >
              <div>
                <p className="muted" style={{ margin: 0 }}>Open</p>
                <p style={{ margin: 0 }}>{market.dayOpen ?? "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>High</p>
                <p style={{ margin: 0 }}>{market.dayHigh ?? "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>Low</p>
                <p style={{ margin: 0 }}>{market.dayLow ?? "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>Mkt Cap</p>
                <p style={{ margin: 0 }}>{money((market.fundamentals?.marketCapCr || 0) * 10000000)}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>P/E Ratio</p>
                <p style={{ margin: 0 }}>{market.fundamentals?.pe || "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>52-wk High</p>
                <p style={{ margin: 0 }}>{market.fiftyTwoWeekHigh ?? "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>Dividend</p>
                <p style={{ margin: 0 }}>{market.dividendRate ? money(market.dividendRate) : "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>EPS</p>
                <p style={{ margin: 0 }}>{market.fundamentals?.eps ?? "-"}</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>52-wk Low</p>
                <p style={{ margin: 0 }}>{market.fiftyTwoWeekLow ?? "-"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {market ? (
        <>
          <section className="panel-card">
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <h2 style={{ margin: "0", fontSize: "1.8em" }}>AI Analysis Dashboard</h2>
              <p style={{ margin: "8px 0 0 0", opacity: "0.9" }}>Real-time insights powered by advanced algorithms</p>
            </div>
            <RecommendationPanel symbol={symbol} />
          </section>
          <section className="panel-card">
            <SentimentCard symbol={symbol} />
          </section>
          <section className="panel-card">
            <FundamentalsMeter symbol={symbol} />
          </section>
        </>
      ) : null}

      <section className="panel-card">
        <h3>Place Order</h3>
        <div className="form-grid">
          <label>
            Quantity
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </label>
          <label>
            Price
            <input type="number" min={0.01} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </label>
        </div>
        <div className="btn-row">
          <button className="btn-solid buy" disabled={placingOrder} type="button" onClick={() => submitOrder("BUY")}>
            Buy
          </button>
          <button className="btn-solid sell" disabled={placingOrder} type="button" onClick={() => submitOrder("SELL")}>
            Sell
          </button>
        </div>
        <p className="muted">Orders are applied optimistically and rolled back if API fails.</p>
      </section>

      <section className="panel-card">
        <h3>Limit / Stop-Loss Order</h3>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          Placed for {symbol}. Runs automatically in the background and executes at the live market price once triggered.
        </p>
        <div className="form-grid">
          <label>
            Type
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          <label>
            Category
            <select value={triggerCategory} onChange={(e) => setTriggerCategory(e.target.value)}>
              <option value="LIMIT">Limit</option>
              <option value="STOP_LOSS" disabled={triggerType !== "SELL"}>
                Stop-Loss (SELL only)
              </option>
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              value={triggerQuantity}
              onChange={(e) => setTriggerQuantity(Number(e.target.value))}
            />
          </label>
          <label>
            Trigger Price
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
            />
          </label>
        </div>
        <div className="btn-row">
          <button className="btn-solid primary" disabled={placingTriggerOrder || !triggerPrice} type="button" onClick={submitTriggerOrder}>
            Place Order
          </button>
        </div>

        {activeTriggerOrders.length ? (
          <div className="table-wrap" style={{ marginTop: "12px" }}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Trigger</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activeTriggerOrders.map((order) => (
                  <tr key={order._id}>
                    <td className={order.type === "BUY" ? "profit" : "loss"}>{order.type}</td>
                    <td>{order.orderCategory === "LIMIT" ? "Limit" : "Stop-Loss"}</td>
                    <td>{order.symbol}</td>
                    <td>{order.quantity}</td>
                    <td>{money(order.triggerPrice)}</td>
                    <td>
                      <button type="button" className="btn-solid sell" onClick={() => cancelTriggerOrder(order._id)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No active limit/stop-loss orders.</p>
        )}
      </section>

      <section className="panel-card">
        <h3>Order Book (Bid / Ask)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bid Price</th>
                <th>Bid Qty</th>
                <th>Ask Price</th>
                <th>Ask Qty</th>
              </tr>
            </thead>
            <tbody>
              {(market?.orderBook?.bid || []).map((bid, idx) => {
                const ask = market?.orderBook?.ask?.[idx];
                return (
                  <tr key={`${bid.price}-${idx}`}>
                    <td>{bid.price}</td>
                    <td>{bid.quantity}</td>
                    <td>{ask?.price || "-"}</td>
                    <td>{ask?.quantity || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h3>Fundamentals</h3>
        <p>Market Cap: {money((market?.fundamentals?.marketCapCr || 0) * 10000000)}</p>
        <p>P/E: {market?.fundamentals?.pe ?? "-"}</p>
        <p>EPS: {market?.fundamentals?.eps ?? "-"}</p>
      </section>

      <section className="panel-card">
        <h3>Technical Indicators</h3>
        <p>RSI (14): {market?.technicalIndicators?.rsi14 ?? "-"}</p>
        <p>SMA 20: {market?.technicalIndicators?.sma20 ?? "-"}</p>
        <p>EMA 20: {market?.technicalIndicators?.ema20 ?? "-"}</p>
      </section>

      <section className="panel-card">
        <h3>Historical Price Data</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
              </tr>
            </thead>
            <tbody>
              {(market?.historical || []).map((point) => (
                <tr key={`${point.time}-${point.open}-${point.close}`}>
                  <td>{point.time}</td>
                  <td>{point.open ?? point.price}</td>
                  <td>{point.high ?? point.price}</td>
                  <td>{point.low ?? point.price}</td>
                  <td>{point.close ?? point.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h3>Recent Optimistic Orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((order) => (
                <tr key={order.id}>
                  <td className={order.type === "BUY" ? "profit" : "loss"}>{order.type}</td>
                  <td>{order.symbol}</td>
                  <td>{order.quantity}</td>
                  <td>{money(order.price)}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default TradingPage;