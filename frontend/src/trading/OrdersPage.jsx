import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ date: "", symbol: "", type: "" });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.date) {
      params.set("date", filters.date);
    }
    if (filters.symbol) {
      params.set("symbol", filters.symbol);
    }
    if (filters.type) {
      params.set("type", filters.type);
    }
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.get(`/api/orders${query ? `?${query}` : ""}`);
        if (data?.success) {
          setOrders(data.data);
        } else {
          setError(data?.message || "Unable to fetch orders.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [query]);

  return (
    <div className="grid-layout">
      <section className="panel-card">
        <h3>Order History</h3>
        <div className="form-grid filters">
          <label>
            Date
            <input type="date" value={filters.date} onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))} />
          </label>
          <label>
            Stock
            <input
              type="text"
              value={filters.symbol}
              placeholder="e.g. INFY"
              onChange={(e) => setFilters((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
            />
          </label>
          <label>
            Type
            <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="">All</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
        </div>
        {loading ? <p>Loading orders...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className={order.type === "BUY" ? "profit" : "loss"}>{order.type}</td>
                  <td>{order.symbol}</td>
                  <td>{order.quantity}</td>
                  <td>{money(order.price)}</td>
                  <td>{money(order.total)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OrdersPage;
