import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";

export const useDashboardSummary = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/api/dashboard/summary");
      if (data?.success) {
        setSummary(data.data);
      } else {
        setError(data?.message || "Unable to load dashboard.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [load]);

  return { loading, summary, error, reload: load };
};
