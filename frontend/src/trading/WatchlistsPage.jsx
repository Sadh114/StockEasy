import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../api/client";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const WatchlistsPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFollowed = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/watchlist/followed");
      if (data?.success) {
        setStocks(data.data);
      }
    } catch (_err) {
      toast.error("Unable to load your watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowed();
  }, []);

  const unfollow = async (symbol) => {
    try {
      const { data } = await apiClient.delete(`/api/watchlist/${symbol}`);
      if (data?.success) {
        setStocks((prev) => prev.filter((item) => item.symbol !== symbol));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to remove stock.");
    }
  };

  return (
    <div className="grid-layout">
      <section className="panel-card">
        <h3>Watchlist</h3>
        {loading ? <p>Loading...</p> : null}
        <div className="table-wrap" style={{ marginTop: "12px" }}>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Live Price</th>
                <th>Change %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id}>
                  <td>{stock.symbol}</td>
                  <td>{stock.companyName}</td>
                  <td>{money(stock.livePrice)}</td>
                  <td className={stock.changePct >= 0 ? "profit" : "loss"}>{stock.changePct}%</td>
                  <td>
                    <button type="button" className="btn-solid sell" onClick={() => unfollow(stock.symbol)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !stocks.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No stocks yet — follow a stock from the Trading page.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default WatchlistsPage;
