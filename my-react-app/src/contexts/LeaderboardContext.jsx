import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const LeaderboardContext = createContext(null);

export function LeaderboardProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [period, setPeriod] = useState("all-time");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async (periodValue = "all-time", pageNum = 1, append = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(
        `/leaderboard?period=${periodValue}&page=${pageNum}`
      );
      setEntries((prev) =>
        append ? [...prev, ...res.entries] : res.entries
      );
      setPeriod(res.period);
      setPage(res.page);
      setTotalPages(res.totalPages);
      return res;
    } catch (err) {
      setError(err.message || "Failed to fetch leaderboard.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <LeaderboardContext.Provider
      value={{
        entries,
        period,
        page,
        totalPages,
        loading,
        error,
        fetchLeaderboard,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  return useContext(LeaderboardContext);
}
