import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const LeaderboardContext = createContext(null);

export function LeaderboardProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [period, setPeriod] = useState("all-time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async (periodValue = "all-time") => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/leaderboard?period=${periodValue}`);
      setEntries(res.entries);
      setPeriod(res.period);
      return res.entries;
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
