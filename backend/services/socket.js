const { Server } = require('socket.io');
const Room = require('../models/Room');
const Match = require('../models/Match');
const User = require('../models/User');
const { generatePuzzle } = require('./sudokuGenerator');
const { applyMove } = require('./scoring');
const { usePowerUp } = require('./powerUps');
const { newRatings } = require('./elo');
const { recordMatchResult } = require('./stats');

// Map from room code -> set of connected user IDs (for presence / reconnect).
const roomPresence = new Map();

// Per-match serialization queues: match:move / match:powerup handlers mutate
// the same Match doc, so concurrent read-modify-write loses updates. Chain
// each operation so they run one at a time per match.
const matchQueues = new Map();

// Per-room serialization queue so startMatch runs exactly once per room.
const roomQueues = new Map();

function enqueueOp(queueMap, key, fn) {
  const prev = queueMap.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  queueMap.set(key, next);
  next.finally(() => {
    if (queueMap.get(key) === next) queueMap.delete(key);
  });
  return next;
}

function enqueueMatchOp(matchId, fn) {
  return enqueueOp(matchQueues, matchId, fn);
}

function enqueueRoomOp(roomId, fn) {
  return enqueueOp(roomQueues, roomId, fn);
}

// Generate a room code like "SD-882-31".
function generateRoomCode() {
  const a = Math.floor(100 + Math.random() * 900);
  const b = Math.floor(10 + Math.random() * 90);
  return `SD-${a}-${b}`;
}

// 81-cell status array: null = empty, 'given' = initial clue, 'locked' =
// correctly solved (cannot change), 'wrong' = filled but incorrect.
function buildCellStatus(match) {
  return match.board.map((v, i) => {
    if (v == null) return null;
    if (match.initialBoard[i] != null) return 'given';
    if (v === match.solution[i]) return 'locked';
    return 'wrong';
  });
}

// A cell cannot be overwritten once it holds the correct value.
function isLockedCell(match, cell) {
  if (match.initialBoard[cell] != null) return true;
  return match.moveHistory.some(
    (m) => m.cell === cell && (m.correct === true || m.isPowerUp)
  );
}

function isBoardSolved(match) {
  return match.board.every((v, i) => v != null && v === match.solution[i]);
}

async function fetchMatchPlayers(match) {
  const [p1, p2] = await Promise.all([
    User.findById(match.player1).select('name elo'),
    User.findById(match.player2).select('name elo'),
  ]);
  return [p1, p2];
}

// Full state payload shared by match:start / match:state (rejoin) emits.
function buildStatePayload(match, players) {
  return {
    matchId: match._id,
    board: match.board,
    initialBoard: match.initialBoard,
    cellStatus: buildCellStatus(match),
    difficulty: match.difficulty,
    clueCount: match.clueCount,
    players: players.map((p) =>
      p ? { _id: p._id, name: p.name, elo: p.elo } : null
    ),
    turn: match.turn,
    turnNumber: match.turnNumber,
    moveHistory: match.moveHistory,
    scores: match.scores,
    powerUpsLeft: match.powerUpsLeft,
    powerUpsMax: match.powerUpsMax,
    clocks: match.clocks,
    status: match.status,
  };
}

function attachSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Broadcast the live match state to both players.
  function emitMatchState(match) {
    io.to(`match:${match._id}`).emit('match:state', {
      matchId: match._id,
      board: match.board,
      cellStatus: buildCellStatus(match),
      turn: match.turn,
      turnNumber: match.turnNumber,
      moveHistory: match.moveHistory,
      scores: match.scores,
      powerUpsLeft: match.powerUpsLeft,
      clocks: match.clocks,
      status: match.status,
    });
  }

  // End the match: set status, winner, elo deltas, notify players.
  async function endMatch(match, winnerPlayer, reason) {
    if (match.status !== 'active') return;

    match.status = 'completed';
    match.completedAt = new Date();
    match.winner = winnerPlayer === 1 ? match.player1 : match.player2;

    // ELO only counts for completed matches with a winner.
    if (winnerPlayer) {
      const [p1, p2] = await Promise.all([
        User.findById(match.player1),
        User.findById(match.player2),
      ]);
      if (p1 && p2) {
        const { delta } = newRatings(p1.elo, p2.elo);
        match.eloDelta = delta;
        p1.elo = winnerPlayer === 1 ? p1.elo + delta : p1.elo - delta;
        p2.elo = winnerPlayer === 2 ? p2.elo + delta : p2.elo - delta;
        await Promise.all([p1.save(), p2.save()]);
      }
    }

    await match.save();

    // Record history + stats + leaderboard for both players.
    try {
      const winnerUserId = winnerPlayer === 1 ? match.player1 : match.player2;
      const loserUserId = winnerPlayer === 2 ? match.player1 : match.player2;
      await recordMatchResult(match, {
        winnerUserId,
        loserUserId,
        eloDelta: match.eloDelta,
        timeSec: 0,
        movesCount: match.moveHistory.length,
        difficulty: match.difficulty,
      });
    } catch (err) {
      console.error('recordMatchResult error:', err);
    }

    io.to(`match:${match._id}`).emit('match:end', {
      winner: winnerPlayer,
      reason,
      scores: match.scores,
      eloDelta: match.eloDelta,
    });

    await Room.updateOne({ _id: match.room }, { status: 'started' });
  }

  // Create the Match when both players are in a full room, and start it.
  // Serialized per room so concurrent room:join events can't double-start.
  async function startMatch(roomId) {
    return enqueueRoomOp(roomId, async () => {
      const room = await Room.findById(roomId);
      if (!room || room.status === 'cancelled') return null;
      if (room.match) return null; // already started

      if (
        !room.host ||
        !room.guest ||
        String(room.host) === String(room.guest)
      ) {
        console.error('startMatch: invalid player ids for room', room.code);
        return null;
      }

      const puzzle = generatePuzzle(room.difficulty, room.clueCount);
      const clockSec = (room.timerMinPerPlayer || 0) * 60;

      const match = await Match.create({
        player1: room.host,
        player2: room.guest,
        room: room._id,
        difficulty: room.difficulty,
        clueCount: room.clueCount,
        timerMinPerPlayer: room.timerMinPerPlayer,
        board: puzzle.puzzle,
        initialBoard: puzzle.puzzle,
        solution: puzzle.solution,
        turn: 1,
        turnNumber: 1,
        scores: { p1: 0, p2: 0 },
        powerUpsLeft: {
          p1: room.powerUpsPerPlayer,
          p2: room.powerUpsPerPlayer,
        },
        powerUpsMax: room.powerUpsPerPlayer,
        clocks: { p1: clockSec, p2: clockSec },
        status: 'active',
        startedAt: new Date(),
      });

      room.match = match._id;
      room.status = 'started';
      await room.save();

      const players = await fetchMatchPlayers(match);

      // Move both players' sockets into the match room so match:state /
      // match:end reach them (they keep room:CODE as well).
      const socketsInRoom = await io.in(`room:${room.code}`).fetchSockets();
      for (const s of socketsInRoom) {
        s.join(`match:${match._id}`);
        s.matchId = match._id;
      }

      io.to(`match:${match._id}`).emit('match:start', {
        ...buildStatePayload(match, players),
        timerMin: match.timerMinPerPlayer,
      });

      return match;
    });
  }

  io.on('connection', (socket) => {
    // Attach socket to a room; if both players are present, start the match.
    socket.on('room:join', async ({ roomCode, userId }) => {
      try {
        if (!roomCode || !userId) {
          socket.emit('error', { message: 'Missing room code or user id.' });
          return;
        }
        const room = await Room.findOne({ code: roomCode });
        if (!room || room.status === 'cancelled') {
          socket.emit('error', { message: 'Room not available.' });
          return;
        }
        if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
          socket.emit('room:expired', { code: roomCode });
          return;
        }

        const isMember =
          String(room.host) === String(userId) ||
          (room.guest && String(room.guest) === String(userId));
        if (!isMember) {
          socket.emit('error', { message: 'Not a player in this room.' });
          return;
        }

        socket.join(`room:${roomCode}`);
        socket.join(`user:${userId}`);
        socket.userId = userId;
        socket.roomCode = roomCode;

        const presence = roomPresence.get(roomCode) || new Set();
        presence.add(userId);
        roomPresence.set(roomCode, presence);

        // Room already has a running match (late joiner / refresh) -> resync.
        if (room.match && room.status === 'started') {
          const match = await Match.findById(room.match);
          if (match && match.status === 'active') {
            socket.join(`match:${match._id}`);
            socket.matchId = match._id;
            if (String(match.player1) === String(userId))
              match.disconnectedAt.p1 = null;
            if (String(match.player2) === String(userId))
              match.disconnectedAt.p2 = null;
            await match.save();
            const players = await fetchMatchPlayers(match);
            socket.emit('match:state', buildStatePayload(match, players));
            io.to(`match:${match._id}`).emit('opponent:reconnected', {
              player: String(match.player1) === String(userId) ? 1 : 2,
            });
          }
          return;
        }

        // Both players present in a full room -> start the match.
        if (room.status === 'full' && room.guest) {
          const hostPresent = presence.has(String(room.host));
          const guestPresent = presence.has(String(room.guest));
          if (hostPresent && guestPresent) {
            await startMatch(room._id);
          }
        }
      } catch (err) {
        console.error('room:join error:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // Reconnect to an in-progress match and resync full state.
    socket.on('match:rejoin', async ({ matchId, userId }) => {
      try {
        if (!matchId || !userId) {
          socket.emit('error', { message: 'Missing match or user id.' });
          return;
        }
        const match = await Match.findById(matchId);
        if (!match) {
          socket.emit('error', { message: 'Match not found.' });
          return;
        }
        const player =
          String(match.player1) === String(userId)
            ? 1
            : String(match.player2) === String(userId)
            ? 2
            : 0;
        if (!player) {
          socket.emit('error', { message: 'Not a player in this match.' });
          return;
        }

        socket.join(`match:${matchId}`);
        socket.join(`user:${userId}`);
        socket.userId = userId;
        socket.matchId = matchId;

        if (match.status === 'active') {
          if (player === 1) match.disconnectedAt.p1 = null;
          if (player === 2) match.disconnectedAt.p2 = null;
          await match.save();
        }

        const players = await fetchMatchPlayers(match);
        socket.emit('match:state', buildStatePayload(match, players));
        io.to(`match:${matchId}`).emit('opponent:reconnected', { player });
      } catch (err) {
        console.error('match:rejoin error:', err);
        socket.emit('error', { message: 'Failed to rejoin match.' });
      }
    });

    // Validate + apply a move. Both players act SIMULTANEOUSLY on the shared
    // grid — a cell locks once it holds the correct value; wrong values can
    // be overwritten by either player.
    socket.on('match:move', ({ matchId, userId, cell, value }) => {
      enqueueMatchOp(matchId, async () => {
        try {
          const match = await Match.findById(matchId);
          if (!match || match.status !== 'active') return;
          if (cell < 0 || cell > 80 || value < 1 || value > 9) return;

          const player =
            String(match.player1) === String(userId)
              ? 1
              : String(match.player2) === String(userId)
              ? 2
              : 0;
          if (!player) return;
          if (isLockedCell(match, cell)) return; // given or already solved

          const correct = value === match.solution[cell];
          const { board, delta } = applyMove({
            board: match.board,
            cell,
            value,
            correct,
          });

          match.board = board;
          const scoreKey = player === 1 ? 'p1' : 'p2';
          match.scores[scoreKey] += delta;
          match.moveHistory.push({
            player,
            cell,
            value,
            isNote: false,
            isPowerUp: false,
            correct,
            timestamp: new Date(),
          });
          match.lastMoveAt = new Date();
          await match.save();

          if (isBoardSolved(match)) {
            await endMatch(match, player, 'solved');
            return;
          }
          emitMatchState(match);
        } catch (err) {
          console.error('match:move error:', err);
        }
      });
    });

    // Reveal a cell via power-up. Power-ups are per-player but can be used
    // at ANY time (no turns).
    socket.on('match:powerup', ({ matchId, userId, cell }) => {
      enqueueMatchOp(matchId, async () => {
        try {
          const match = await Match.findById(matchId);
          if (!match || match.status !== 'active') return;
          const player =
            String(match.player1) === String(userId)
              ? 1
              : String(match.player2) === String(userId)
              ? 2
              : 0;
          if (!player) return;

          const res = usePowerUp(match, player, cell);
          if (!res.ok) {
            socket.emit('error', { message: res.reason });
            return;
          }

          match.moveHistory.push({
            player,
            cell,
            value: res.value,
            isNote: false,
            isPowerUp: true,
            correct: true,
            timestamp: new Date(),
          });
          match.lastMoveAt = new Date();
          await match.save();

          if (isBoardSolved(match)) {
            await endMatch(match, player, 'solved');
            return;
          }
          emitMatchState(match);
        } catch (err) {
          console.error('match:powerup error:', err);
        }
      });
    });

    socket.on('match:resign', async ({ matchId, userId }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'active') return;
        const player =
          String(match.player1) === String(userId)
            ? 1
            : String(match.player2) === String(userId)
            ? 2
            : 0;
        if (!player) return;
        const winner = player === 1 ? 2 : 1;
        await endMatch(match, winner, 'resign');
      } catch (err) {
        console.error('match:resign error:', err);
      }
    });

    // On disconnect, update presence; if the player has no sockets left,
    // mark them disconnected and let the opponent know.
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        // Remove from room presence only when the user's last socket is gone.
        const userSockets = await io.in(`user:${userId}`).fetchSockets();
        if (userSockets.length === 0) {
          for (const [code, set] of roomPresence) {
            if (set.has(userId)) {
              set.delete(userId);
              if (set.size === 0) roomPresence.delete(code);
            }
          }
        }

        const matchId = socket.matchId;
        if (!matchId) return;

        const match = await Match.findById(matchId);
        if (!match || match.status !== 'active') return;

        const player =
          String(match.player1) === userId
            ? 1
            : String(match.player2) === userId
            ? 2
            : 0;
        if (player) {
          const key = player === 1 ? 'p1' : 'p2';
          match.disconnectedAt[key] = new Date();
          await match.save();
          io.to(`match:${matchId}`).emit('opponent:disconnected', { player });
        }
      } catch (err) {
        console.error('disconnect error:', err);
      }
    });
  });

  return io;
}

module.exports = { attachSocket, generateRoomCode };
