import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const PracticeContext = createContext(null);

export function PracticeProvider({ children }) {
  const [game, setGame] = useState(null); // { _id, board, initialBoard, score, mistakes, ... }
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchActiveGame = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/practice/active");
      setActiveGame(res.game);
      return res.game;
    } catch (err) {
      setError(err.message || "Failed to fetch active game.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startGame = useCallback(async ({ difficulty, clueCount, powerUps }) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/practice/start", {
        difficulty,
        clueCount,
        powerUps,
      });
      setGame(res.game);
      return res.game;
    } catch (err) {
      setError(err.message || "Failed to start practice.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeGame = useCallback(async (gameId) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/practice/${gameId}/resume`);
      setGame(res.game);
      return res.game;
    } catch (err) {
      setError(err.message || "Failed to load game.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const makeMove = useCallback(async (gameId, { cell, value, timeElapsedSec }) => {
    const res = await apiClient.post(`/practice/${gameId}/move`, {
      cell,
      value,
      timeElapsedSec,
    });
    setGame((g) =>
      g
        ? {
            ...g,
            board: res.board,
            score: res.score,
            mistakes: res.mistakes,
            status: res.solved ? "solved" : g.status,
          }
        : g
    );
    return res;
  }, []);

  const requestHint = useCallback(async (gameId, { cell }) => {
    const res = await apiClient.post(`/practice/${gameId}/hint`, { cell });
    setGame((g) =>
      g
        ? {
            ...g,
            board: res.board,
            powerUpsUsed: res.powerUpsUsed,
            status: res.solved ? "solved" : g.status,
          }
        : g
    );
    return res;
  }, []);

  const clearGame = useCallback(() => setGame(null), []);

  return (
    <PracticeContext.Provider
      value={{
        game,
        activeGame,
        loading,
        error,
        fetchActiveGame,
        startGame,
        resumeGame,
        makeMove,
        requestHint,
        clearGame,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  return useContext(PracticeContext);
}
