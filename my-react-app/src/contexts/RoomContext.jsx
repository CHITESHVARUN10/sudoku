import { createContext, useCallback, useContext, useState } from "react";
import { apiClient } from "../api/client";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null); // { code, status, host, guest, settings... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createRoom = useCallback(async ({ difficulty, clueCount, powerUps, timerMin }) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/rooms", {
        difficulty,
        clueCount,
        powerUps,
        timerMin,
      });
      setRoom(res.room);
      return res.room;
    } catch (err) {
      setError(err.message || "Failed to create room.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (code) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post(`/rooms/${code}/join`);
      setRoom(res.room);
      return res.room;
    } catch (err) {
      setError(err.message || "Failed to join room.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoom = useCallback(async (code) => {
    const res = await apiClient.get(`/rooms/${code}`);
    setRoom(res.room);
    return res.room;
  }, []);

  const cancelRoom = useCallback(async (code) => {
    await apiClient.delete(`/rooms/${code}`);
    setRoom(null);
  }, []);

  const clearRoom = useCallback(() => setRoom(null), []);

  return (
    <RoomContext.Provider
      value={{
        room,
        loading,
        error,
        createRoom,
        joinRoom,
        getRoom,
        cancelRoom,
        clearRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
