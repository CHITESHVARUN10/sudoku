import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/stats/me");
      setStats(res.stats);
      return res.stats;
    } catch (err) {
      setError(err.message || "Failed to fetch stats.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/stats/history?page=${pageNum}`);
      setGames(res.games);
      setPage(res.page);
      setTotalPages(res.totalPages);
      return res;
    } catch (err) {
      setError(err.message || "Failed to fetch history.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        stats,
        games,
        page,
        totalPages,
        loading,
        error,
        fetchStats,
        fetchHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
