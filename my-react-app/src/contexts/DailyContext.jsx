import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const DailyContext = createContext(null);

export function DailyProvider({ children }) {
  const [today, setToday] = useState(null);
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchToday = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/daily/today");
      setToday(res.puzzle);
      return res.puzzle;
    } catch (err) {
      setError(err.message || "Failed to fetch daily puzzle.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const solveDaily = useCallback(async (puzzleId, { board, timeSec }) => {
    const res = await apiClient.post(`/daily/${puzzleId}/solve`, {
      board,
      timeSec,
    });
    return res;
  }, []);

  const fetchArchive = useCallback(async (date) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/daily/archive?date=${date}`);
      setArchive(res.puzzle);
      return res.puzzle;
    } catch (err) {
      setError(err.message || "Failed to fetch archive puzzle.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DailyContext.Provider
      value={{
        today,
        archive,
        loading,
        error,
        fetchToday,
        solveDaily,
        fetchArchive,
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}
