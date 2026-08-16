// Mock socket layer that mimics the Socket.IO contract the backend will emit.
// It simulates: match:start, match:state, match:end, opponent:disconnected/reconnected.
// Swap this module's internals for a real socket.io-client connection when the
// backend WebSocket service is ready — the component API stays identical.

// A valid solved grid + its puzzle, so the mock can simulate real moves.
const SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

const PUZZLE = [
  5, 3, null, null, 7, null, null, null, null,
  6, null, null, 1, 9, 5, null, null, null,
  null, 9, 8, null, null, null, null, 6, null,
  8, null, null, null, 6, null, null, null, 3,
  4, null, 8, null, 3, null, null, null, 1,
  7, null, null, null, null, 2, null, null, 6,
  null, 6, null, null, null, null, 2, 8, null,
  null, null, null, 4, 1, 9, null, null, 5,
  null, null, null, null, 8, null, null, 7, 9,
];

const PLAYERS = [
  { id: "me", name: "John Doe", elo: 1200 },
  { id: "opp", name: "Opponent", elo: 1180 },
];

function buildInitialState() {
  return {
    matchId: "mock-match-1",
    board: [...PUZZLE],
    initialBoard: [...PUZZLE],
    difficulty: "Hard",
    clueCount: 29,
    players: PLAYERS,
    turn: null, // no turns — both players act simultaneously
    turnNumber: 1,
    scores: { p1: 0, p2: 0 },
    powerUpsLeft: { p1: 3, p2: 3 },
    powerUpsMax: 3,
    timerMin: 5,
    clocks: { p1: 300, p2: 300 },
    moveHistory: [],
    status: "active",
  };
}

export function createMockSocket({ onStart, onState, onEnd, onOppDisconnect, onOppReconnect }) {
  const state = buildInitialState();

  // After a short delay, emit match:start (simulating the guest joining).
  const startTimer = setTimeout(() => onStart(state), 600);

  // Simulate the opponent briefly disconnecting ~14s in, then reconnecting.
  const disconnectTimer = setTimeout(() => {
    if (state.status !== "active") return;
    onOppDisconnect();
    setTimeout(() => {
      if (state.status !== "active") return;
      onOppReconnect();
    }, 3000);
  }, 14000);

  // Every 9s, the mock opponent makes a correct move on the first empty cell.
  let oppMoves = 0;
  const oppTimer = setInterval(() => {
    if (state.status !== "active") return;
    if (oppMoves >= 5) return;

    const idx = state.board.findIndex((v) => v === null);
    if (idx === -1) return;

    state.board[idx] = SOLUTION[idx];
    oppMoves++;
    state.scores.p2 += 10;
    state.moveHistory.push({
      player: 2,
      cell: idx,
      value: SOLUTION[idx],
      isNote: false,
      isPowerUp: false,
      correct: true,
      timestamp: new Date().toISOString(),
    });

    if (state.board.every((v) => v !== null)) {
      state.status = "completed";
      onEnd({ winner: 2, reason: "solved", scores: state.scores, eloDelta: 8 });
      clearInterval(oppTimer);
      return;
    }
    onState(state);
  }, 9000);

  return {
    sendMove(cell, value) {
      if (state.board[cell] !== null) return; // cell already claimed

      const correct = value === SOLUTION[cell];
      state.board[cell] = value;
      state.moveHistory.push({
        player: 1,
        cell,
        value,
        isNote: false,
        isPowerUp: false,
        correct,
        timestamp: new Date().toISOString(),
      });

      if (correct) {
        state.scores.p1 += 10;
      } else {
        state.scores.p1 -= 15;
      }

      if (state.board.every((v) => v !== null)) {
        state.status = "completed";
        onEnd({ winner: 1, reason: "solved", scores: state.scores, eloDelta: 8 });
        clearInterval(oppTimer);
        return;
      }
      onState(state);
    },
    sendPowerUp(cell) {
      if (state.powerUpsLeft.p1 <= 0) return;
      if (state.board[cell] !== null) return;

      state.board[cell] = SOLUTION[cell];
      state.powerUpsLeft.p1 -= 1;
      state.moveHistory.push({
        player: 1,
        cell,
        value: SOLUTION[cell],
        isNote: false,
        isPowerUp: true,
        correct: true,
        timestamp: new Date().toISOString(),
      });

      if (state.board.every((v) => v !== null)) {
        state.status = "completed";
        onEnd({ winner: 1, reason: "solved", scores: state.scores, eloDelta: 8 });
        clearInterval(oppTimer);
        return;
      }
      onState(state);
    },
    resign() {
      state.status = "completed";
      onEnd({ winner: 2, reason: "resign", scores: state.scores, eloDelta: 0 });
      clearInterval(oppTimer);
    },
    destroy() {
      clearTimeout(startTimer);
      clearTimeout(disconnectTimer);
      clearInterval(oppTimer);
    },
  };
}
