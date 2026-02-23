import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import SentimentCard from "../components/AI/SentimentCard";
import RecommendationPanel from "../components/AI/RecommendationPanel";
import FundamentalsMeter from "../components/AI/FundamentalsMeter";

const defaultSymbol = "INFY";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CandlestickChart = ({ points }) => {
  if (!points?.length) {
    return <div className="chart-empty">No chart data</div>;
  }

  const candles = points.map((point, idx) => {
    const prevClose = idx > 0 ? Number(points[idx - 1].close ?? points[idx - 1].price) : Number(point.price || 0);
    const open = Number(point.open ?? prevClose);
    const close = Number(point.close ?? point.price ?? open);
    const high = Number(point.high ?? Math.max(open, close));
    const low = Number(point.low ?? Math.min(open, close));

    return {
      open,
      high,
      low,
      close,
      time: point.time,
      isGreen: close >= open,
      volume: Number(point.volume ?? 0),
    };
  });

  const allPrices = candles.flatMap((candle) => [candle.open, candle.high, candle.low, candle.close]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const spread = max - min || 1;

  const chartWidth = 100;
  const chartHeight = 86;
  const totalHeight = chartHeight;
  const candleWidth = Math.max(1.2, Math.min(4.5, (chartWidth / candles.length) * 0.7));
  const wickWidth = Math.max(0.25, candleWidth * 0.12);
  const lastCandle = candles[candles.length - 1];
  const lastCloseY = totalHeight - ((lastCandle.close - min) / spread) * chartHeight;

  return (
    <div
      style={{
        width: "100%",
        height: "320px",
        background: "#f5f6f8",
        borderRadius: "8px",
        padding: "12px",
        border: "1px solid #d9dee6",
      }}
    >
      <div
        style={{
          color: "#4b5563",
          fontSize: "0.9em",
          fontWeight: "600",
          marginBottom: "10px",
          textAlign: "left",
        }}
      >
        Candlestick Chart
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${totalHeight}`}
        style={{
          width: "100%",
          height: "236px",
          background: "#f5f6f8",
        }}
      >
        {[0.16, 0.32, 0.48, 0.64, 0.8].map((level) => {
          const price = min + spread * level;
          return (
            <g key={level}>
              <line
                x1="0"
                y1={totalHeight - level * chartHeight}
                x2={chartWidth}
                y2={totalHeight - level * chartHeight}
                stroke="#e2e7ef"
                strokeWidth="0.4"
              />
              <text
                x={chartWidth - 1}
                y={totalHeight - level * chartHeight - 0.8}
                fontSize="2"
                fill="#8a93a2"
                textAnchor="end"
              >
                INR {price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {[0.25, 0.5, 0.75].map((xLevel) => (
          <line
            key={xLevel}
            x1={chartWidth * xLevel}
            y1="0"
            x2={chartWidth * xLevel}
            y2={totalHeight}
            stroke="#e2e7ef"
            strokeWidth="0.35"
          />
        ))}

        <line
          x1="0"
          y1={lastCloseY}
          x2={chartWidth}
          y2={lastCloseY}
          stroke="#e65e5e"
          strokeWidth="0.35"
          strokeDasharray="0.8 1"
        />

        {candles.map((candle, idx) => {
          const x = (idx / (candles.length - 1 || 1)) * (chartWidth - candleWidth) + candleWidth / 2;
          const openY = totalHeight - ((candle.open - min) / spread) * chartHeight;
          const closeY = totalHeight - ((candle.close - min) / spread) * chartHeight;
          const highY = totalHeight - ((candle.high - min) / spread) * chartHeight;
          const lowY = totalHeight - ((candle.low - min) / spread) * chartHeight;
          const bodyHeight = Math.max(0.8, Math.abs(closeY - openY));
          const bodyY = Math.min(openY, closeY);
          const upColor = "#4fa79f";
          const downColor = "#df5d57";
          const bodyColor = candle.isGreen ? upColor : downColor;

          return (
            <g key={idx}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={bodyColor}
                strokeWidth={wickWidth}
                strokeLinecap="square"
              />

              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={bodyColor}
                stroke={bodyColor}
                strokeWidth="0.18"
              />

              {Math.abs(openY - closeY) < 1 && (
                <line
                  x1={x - candleWidth / 3}
                  y1={openY}
                  x2={x + candleWidth / 3}
                  y2={closeY}
                  stroke={bodyColor}
                  strokeWidth="0.8"
                  strokeLinecap="square"
                />
              )}
            </g>
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "10px",
          padding: "8px",
          background: "#eef1f6",
          borderRadius: "4px",
          fontSize: "0.78em",
          fontFamily: "monospace",
        }}
      >
        <div style={{ marginRight: "15px" }}>
          <span style={{ color: "#666" }}>O:</span>
          <span style={{ color: "#333", fontWeight: "bold" }}> INR {lastCandle?.open.toFixed(2)}</span>
        </div>
        <div style={{ marginRight: "15px" }}>
          <span style={{ color: "#666" }}>H:</span>
          <span style={{ color: "#4caf50", fontWeight: "bold" }}> INR {lastCandle?.high.toFixed(2)}</span>
        </div>
        <div style={{ marginRight: "15px" }}>
          <span style={{ color: "#666" }}>L:</span>
          <span style={{ color: "#f44336", fontWeight: "bold" }}> INR {lastCandle?.low.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: "#666" }}>C:</span>
          <span
            style={{
              color: lastCandle?.isGreen ? "#4caf50" : "#f44336",
              fontWeight: "bold",
            }}
          >
            {" "}
            INR {lastCandle?.close.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: "6px", fontSize: "0.72em", color: "#7b8491" }}></div>
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
      toast.success(data.message || "Order executed.");
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
            <h3>
              {market.companyName} ({market.symbol})
            </h3>
            <p>
              <strong>{money(market.livePrice)}</strong> <span className={changePctClass}>{market.changePct}%</span>
            </p>
            <div style={{ gridColumn: "span 4", marginBottom: "20px" }}>
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
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <SentimentCard symbol={symbol} />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <FundamentalsMeter symbol={symbol} />
            </div>
            <CandlestickChart points={market.historical} />
          </div>
        ) : null}
      </section>

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