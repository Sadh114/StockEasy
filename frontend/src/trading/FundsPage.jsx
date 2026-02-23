import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../api/client";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const FundsPage = () => {
  const [method, setMethod] = useState("UPI");
  const [amount, setAmount] = useState(1000);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/payments/history");
      if (data?.success) {
        setHistory(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const submitDeposit = async () => {
    setProcessing(true);
    try {
      const { data } = await apiClient.post("/api/payments/deposit", {
        amount: Number(amount),
        method,
      });

      if (data.success) {
        toast.success(data.message || "Funds added successfully.");
      } else {
        toast.error(data.message || "Payment failed.");
      }
      await loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to process payment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid-layout">
      <section className="panel-card">
        <h3>Add Funds ( Gateway)</h3>
        <div className="form-grid">
          <label>
            Payment Method
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="UPI"> UPI</option>
              <option value="NET_BANKING"> Net Banking</option>
            </select>
          </label>
          <label>
            Amount
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
        </div>
        <button className="btn-solid buy" disabled={processing} type="button" onClick={submitDeposit}>
          {processing ? "Processing..." : "Add Funds"}
        </button>
      </section>

      <section className="panel-card">
        <h3>Payment History</h3>
        {loading ? <p>Loading payment history...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Ref</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row._id}>
                  <td>{row.method === "NET_BANKING" ? "Net Banking" : "UPI"}</td>
                  <td>{money(row.amount)}</td>
                  <td className={row.status === "SUCCESS" ? "profit" : "loss"}>{row.status}</td>
                  <td>{row.transactionRef}</td>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FundsPage;
