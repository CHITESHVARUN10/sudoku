import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createMatchSocket } from "../api/socket";

const SocketContext = createContext(null);

// Wraps the real socket.io-client connection. Pages consume match state +
// send methods; the underlying transport is swappable (mock vs real).
export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [connected, setConnected] = useState(false);
  const [oppDisconnected, setOppDisconnected] = useState(false);
  const [result, setResult] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [userId, setUserId] = useState(null);

  // Set up the socket connection once (lazy-connect; see api/socket.js).
  useEffect(() => {
    const socket = createMatchSocket({
      onStart: (data) => {
        setMatch(data);
        setConnected(true);
        setResult(null);
        setOppDisconnected(false);
      },
      onState: (data) =>
        setMatch((m) => ({
          ...(m || {}),
          ...data,
          status: data.status || m?.status || "active",
        })),
      onEnd: (data) => {
        setMatch((m) => (m ? { ...m, status: "completed" } : m));
        setResult(data);
      },
      onOppDisconnect: () => setOppDisconnected(true),
      onOppReconnect: () => setOppDisconnected(false),
    });
    socketRef.current = socket;
    return () => socket.destroy();
  }, []);

  // Join the room over the socket (host on waiting-room mount; guest after join).
  const joinRoom = useCallback((code, uid) => {
    setRoomCode(code);
    setUserId(uid);
    socketRef.current?.joinRoom(code, uid);
  }, []);

  const rejoinMatch = useCallback((matchId, uid) => {
    setUserId(uid);
    // Optimistic: let sendMove/sendPowerUp target this match immediately.
    setMatch((m) => ({ ...(m || {}), matchId, status: "active" }));
    socketRef.current?.rejoinMatch(matchId, uid);
  }, []);

  const sendMove = useCallback(
    (cell, value) => {
      const mid = match?.matchId;
      if (mid && userId) socketRef.current?.sendMove(mid, userId, cell, value);
    },
    [match?.matchId, userId]
  );

  const sendPowerUp = useCallback(
    (cell) => {
      const mid = match?.matchId;
      if (mid && userId) socketRef.current?.sendPowerUp(mid, userId, cell);
    },
    [match?.matchId, userId]
  );

  const resign = useCallback(() => {
    const mid = match?.matchId;
    if (mid && userId) socketRef.current?.resign(mid, userId);
  }, [match?.matchId, userId]);

  const value = {
    match,
    connected,
    oppDisconnected,
    result,
    roomCode,
    joinRoom,
    rejoinMatch,
    sendMove,
    sendPowerUp,
    resign,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
