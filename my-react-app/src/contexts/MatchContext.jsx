import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const MatchContext = createContext(null);

export function MatchProvider({ children }) {
  const [activeMatch, setActiveMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchActiveMatch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/matches/active");
      setActiveMatch(res.match);
      return res.match;
    } catch (err) {
      setError(err.message || "Failed to fetch active match.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MatchContext.Provider
      value={{ activeMatch, loading, error, fetchActiveMatch }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  return useContext(MatchContext);
}
