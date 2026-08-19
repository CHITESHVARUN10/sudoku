// Real socket.io-client connection to the backend.
// API-compatible with mockSocket.js so pages/contexts are agnostic:
// createMatchSocket({ onStart, onState, onEnd, onConnect, onDisconnect, onError, onOppDisconnect, onOppReconnect })
//   -> { joinRoom, rejoinMatch, sendMove, sendPowerUp, resign, destroy }

import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3000`;

export function createMatchSocket({
  onStart,
  onState,
  onEnd,
  onConnect,
  onDisconnect,
  onError,
  onOppDisconnect,
  onOppReconnect,
  onResignRequested,
  onResignPending,
  onResignDeclined,
  onResignCancelled,
  onResignExpired,
  onLeaveCooldown,
}) {
  // Lazy: don't connect until the user actually enters a room/match.
  let socket = null;

  const ensure = () => {
    if (socket) return socket;
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: Infinity, // keep retrying; server is stateful
      withCredentials: true, // send the session cookie (socket auth)
    });

    socket.on("connect", () => onConnect?.());
    socket.on("disconnect", () => onDisconnect?.());
    socket.on("match:start", (data) => onStart?.(data));
    socket.on("match:state", (data) => onState?.(data));
    socket.on("match:end", (data) => onEnd?.(data));
    socket.on("error", (data) => onError?.(data?.message || "Server error."));
    socket.on("opponent:disconnected", (data) => onOppDisconnect?.(data));
    socket.on("opponent:reconnected", (data) => onOppReconnect?.(data));
    socket.on("room:expired", (data) => onOppDisconnect?.(data)); // treat as pause signal
    socket.on("resign:requested", (data) => onResignRequested?.(data));
    socket.on("resign:pending", (data) => onResignPending?.(data));
    socket.on("resign:declined", (data) => onResignDeclined?.(data));
    socket.on("resign:cancelled", (data) => onResignCancelled?.(data));
    socket.on("resign:expired", (data) => onResignExpired?.(data));
    socket.on("leave:cooldown", (data) => onLeaveCooldown?.(data));
    // Quiet: don't spam the console with reconnect errors.
    socket.on("connect_error", () => {});
    socket.io.on("reconnect_error", () => {});
    return socket;
  };

  return {
    joinRoom(roomCode, userId) {
      ensure().emit("room:join", { roomCode, userId });
    },
    rejoinMatch(matchId, userId) {
      ensure().emit("match:rejoin", { matchId, userId });
    },
    sendMove(matchId, userId, cell, value) {
      ensure().emit("match:move", { matchId, userId, cell, value });
    },
    sendPowerUp(matchId, userId, cell) {
      ensure().emit("match:powerup", { matchId, userId, cell });
    },
    sendNotes(matchId, userId, notes) {
      ensure().emit("match:notes", { matchId, userId, notes });
    },
    resign(matchId, userId) {
      ensure().emit("match:resign:request", { matchId, userId });
    },
    requestResign(matchId, userId) {
      ensure().emit("match:resign:request", { matchId, userId });
    },
    acceptResign(matchId, userId) {
      ensure().emit("match:resign:accept", { matchId, userId });
    },
    declineResign(matchId, userId) {
      ensure().emit("match:resign:decline", { matchId, userId });
    },
    leaveMatch(matchId, userId) {
      ensure().emit("match:leave", { matchId, userId });
    },
    destroy() {
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
      }
    },
  };
}
