import { useDashboardSummary } from "./useTradingData";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const DashboardPage = () => {
  const { loading, summary, error } = useDashboardSummary();

  if (loading) {
    return <div className="panel-card">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="panel-card error">{error}</div>;
  }

  return (
    <div className="grid-layout">
      <section className="panel-card kpi-grid">
        <article>
          <h4>Available Balance</h4>
          <p>{money(summary.availableBalance)}</p>
        </article>
        <article>
          <h4>Today's P/L</h4>
          <p className={summary.todayPnl >= 0 ? "profit" : "loss"}>{money(summary.todayPnl)}</p>
        </article>
        <article>
          <h4>Portfolio Value</h4>
          <p>{money(summary.portfolioTotalValue)}</p>
        </article>
        <article>
          <h4>Total Portfolio P/L</h4>
          <p className={summary.portfolioPnl >= 0 ? "profit" : "loss"}>{money(summary.portfolioPnl)}</p>
        </article>
      </section>

      <section className="panel-card">
        <h3>Watchlist</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {summary.watchlist.map((item) => (
                <tr key={item.symbol}>
                  <td>{item.symbol}</td>
                  <td>{money(item.livePrice)}</td>
                  <td className={item.changePct >= 0 ? "profit" : "loss"}>{item.changePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h3>Recent Trades</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className={trade.type === "BUY" ? "profit" : "loss"}>{trade.type}</td>
                  <td>{trade.symbol}</td>
                  <td>{trade.quantity}</td>
                  <td>{money(trade.price)}</td>
                  <td>{new Date(trade.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
