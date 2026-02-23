import { useEffect, useState } from "react";
import apiClient from "../api/client";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const PortfolioPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portfolio, setPortfolio] = useState({ holdings: [], summary: null });

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.get("/api/portfolio");
        if (data?.success) {
          setPortfolio(data.data);
        } else {
          setError(data?.message || "Unable to load portfolio.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load portfolio.");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  if (loading) {
    return <div className="panel-card">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="panel-card error">{error}</div>;
  }

  return (
    <div className="grid-layout">
      <section className="panel-card kpi-grid">
        <article>
          <h4>Total Invested</h4>
          <p>{money(portfolio.summary?.totalInvested)}</p>
        </article>
        <article>
          <h4>Current Value</h4>
          <p>{money(portfolio.summary?.totalCurrentValue)}</p>
        </article>
        <article>
          <h4>Total P/L</h4>
          <p className={(portfolio.summary?.totalPnl || 0) >= 0 ? "profit" : "loss"}>{money(portfolio.summary?.totalPnl)}</p>
        </article>
        <article>
          <h4>Total Performance</h4>
          <p className={(portfolio.summary?.totalPnlPct || 0) >= 0 ? "profit" : "loss"}>{portfolio.summary?.totalPnlPct}%</p>
        </article>
      </section>

      <section className="panel-card">
        <h3>Holdings</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Qty</th>
                <th>Avg Buy</th>
                <th>Current</th>
                <th>Invested</th>
                <th>Current Value</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>{holding.symbol}</td>
                  <td>{holding.quantity}</td>
                  <td>{money(holding.averageBuyPrice)}</td>
                  <td>{money(holding.currentPrice)}</td>
                  <td>{money(holding.invested)}</td>
                  <td>{money(holding.currentValue)}</td>
                  <td className={holding.pnl >= 0 ? "profit" : "loss"}>
                    {money(holding.pnl)} ({holding.pnlPct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PortfolioPage;
