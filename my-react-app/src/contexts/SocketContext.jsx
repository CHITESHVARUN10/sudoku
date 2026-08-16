import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createMatchSocket } from "../api/socket";
import { useAuth } from "../auth/AuthContext";

const SocketContext = createContext(null);

// Wraps the real socket.io-client connection. Pages consume match state +
// send methods; the underlying transport is swappable (mock vs real).
export function SocketProvider({ children }) {
  const { refreshUser } = useAuth();
  const socketRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [oppDisconnected, setOppDisconnected] = useState(false);
  const [result, setResult] = useState(null);
  const [lastError, setLastError] = useState("");
  const [roomCode, setRoomCode] = useState(null);
  const [userId, setUserId] = useState(null);

  // Latest context for the socket callbacks (created once).
  const sessionRef = useRef({ matchId: null, roomCode: null, userId: null });
  sessionRef.current = {
    matchId: match?.matchId || null,
    roomCode,
    userId,
  };
  // Stable ref for the auth refresh so the one-time socket setup effect can
  // call it without re-subscribing.
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  // Set up the socket connection once (lazy-connect; see api/socket.js).
  useEffect(() => {
    const socket = createMatchSocket({
      onStart: (data) => {
        setMatch(data);
        setSocketConnected(true);
        setResult(null);
        setOppDisconnected(false);
        setLastError("");
        // A match is live — the room code is no longer needed for joining.
        setRoomCode(null);
        sessionRef.current.matchId = data.matchId || null;
        sessionRef.current.roomCode = null;
      },
      onState: (data) => {
        setSocketConnected(true);
        setLastError("");
        setMatch((m) => {
          const next = { ...(m || {}), ...data };
          if (data.matchId) next.matchId = data.matchId;
          sessionRef.current.matchId = next.matchId || null;
          return next;
        });
      },
      onEnd: (data) => {
        setMatch((m) => (m ? { ...m, status: "completed" } : m));
        setResult(data);
        // Elo changed on completion — refresh the stored user.
        refreshUserRef.current?.().catch(() => {});
      },
      onConnect: () => {
        setSocketConnected(true);
        // After a (re)connect, resync: match first, then the waiting room.
        const { matchId, roomCode: rc, userId: uid } = sessionRef.current;
        if (matchId && uid) {
          socket.rejoinMatch(matchId, uid);
        } else if (rc && uid) {
          socket.joinRoom(rc, uid);
        }
      },
      onDisconnect: () => {
        setSocketConnected(false);
      },
      onError: (message) => setLastError(message || "Server error."),
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
    sessionRef.current.roomCode = code;
    sessionRef.current.userId = uid;
    socketRef.current?.joinRoom(code, uid);
  }, []);

  const rejoinMatch = useCallback((matchId, uid) => {
    setUserId(uid);
    setRoomCode(null); // match is live; room code no longer needed
    sessionRef.current.matchId = matchId;
    sessionRef.current.roomCode = null;
    sessionRef.current.userId = uid;
    // Optimistic: let sendMove/sendPowerUp target this match immediately.
    setMatch((m) => ({ ...(m || {}), matchId, status: "active" }));
    socketRef.current?.rejoinMatch(matchId, uid);
  }, []);

  const sendMove = useCallback(
    (cell, value) => {
      const mid = sessionRef.current.matchId;
      const uid = sessionRef.current.userId;
      if (mid && uid) socketRef.current?.sendMove(mid, uid, cell, value);
    },
    []
  );

  const sendPowerUp = useCallback(
    (cell) => {
      const mid = sessionRef.current.matchId;
      const uid = sessionRef.current.userId;
      if (mid && uid) socketRef.current?.sendPowerUp(mid, uid, cell);
    },
    []
  );

  const sendNotes = useCallback(
    (notes) => {
      const mid = sessionRef.current.matchId;
      const uid = sessionRef.current.userId;
      if (mid && uid) socketRef.current?.sendNotes(mid, uid, notes);
    },
    []
  );

  const resign = useCallback(() => {
    const mid = sessionRef.current.matchId;
    const uid = sessionRef.current.userId;
    if (mid && uid) socketRef.current?.resign(mid, uid);
  }, []);

  const value = {
    match,
    connected: socketConnected && !!match,
    socketConnected,
    oppDisconnected,
    result,
    lastError,
    roomCode,
    joinRoom,
    rejoinMatch,
    sendMove,
    sendPowerUp,
    sendNotes,
    resign,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
