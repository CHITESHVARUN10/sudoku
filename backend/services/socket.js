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

function enqueueMatchOp(matchId, fn) {
  const prev = matchQueues.get(matchId) || Promise.resolve();
  const next = prev.then(fn, fn);
  matchQueues.set(matchId, next);
  // Clean up the queue entry when it settles.
  next.finally(() => {
    if (matchQueues.get(matchId) === next) matchQueues.delete(matchId);
  });
  return next;
}

// Generate a room code like "SD-882-QX".
function generateRoomCode() {
  const a = Math.floor(100 + Math.random() * 900);
  const b = Math.floor(10 + Math.random() * 90);
  return `SD-${a}-${b}`;
}

function attachSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Helper: send the full current match state to both players in a room.
  function emitMatchState(match) {
    io.to(`match:${match._id}`).emit('match:state', {
      board: match.board,
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

    // ELO only counts for completed (non-abandoned) matches.
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

    // Mark the room as finished.
    await Room.updateOne({ _id: match.room }, { status: 'started' });
  }

  // Create the Match when both players are in a full room, and start it.
  async function startMatch(room) {
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
      clocks: { p1: clockSec, p2: clockSec },
      status: 'active',
      startedAt: new Date(),
    });

    room.match = match._id;
    room.status = 'started';
    await room.save();

    const players = await Promise.all([
      User.findById(match.player1).select('name elo'),
      User.findById(match.player2).select('name elo'),
    ]);

    // Move both players' sockets from the room room into the match room,
    // so match:state / match:end reach them.
    const socketsInRoom = await io.in(`room:${room.code}`).fetchSockets();
    for (const s of socketsInRoom) {
      s.join(`match:${match._id}`);
    }

    io.to(`room:${room.code}`).emit('match:start', {
      matchId: match._id,
      board: match.board,
      initialBoard: match.initialBoard,
      difficulty: match.difficulty,
      clueCount: match.clueCount,
      players,
      turn: match.turn,
      timerMin: match.timerMinPerPlayer,
      powerUps: match.powerUpsLeft,
      scores: match.scores,
      clocks: match.clocks,
    });

    return match;
  }

  io.on('connection', (socket) => {
    // Attach socket to a room; if the room is full, start the match.
    socket.on('room:join', async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room || room.status === 'cancelled' || room.status === 'started') {
          socket.emit('error', { message: 'Room not available.' });
          return;
        }
        if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
          socket.emit('room:expired', { code: roomCode });
          return;
        }

        socket.join(`room:${roomCode}`);
        socket.join(`user:${userId}`);
        socket.userId = userId; // for disconnect handling

        const presence = roomPresence.get(roomCode) || new Set();
        presence.add(userId);
        roomPresence.set(roomCode, presence);

        // Host already in the room; guest joins -> full -> start.
        if (String(room.guest) === String(userId) && room.status === 'full') {
          await startMatch(room);
        }
      } catch (err) {
        console.error('room:join error:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // Reconnect to an in-progress match and resync full state.
    socket.on('match:rejoin', async ({ matchId, userId }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match) {
          socket.emit('error', { message: 'Match not found.' });
          return;
        }
        socket.join(`match:${matchId}`);
        socket.join(`user:${userId}`);
        socket.userId = userId; // for disconnect handling

        // Clear the disconnect pause for this player.
        if (String(match.player1) === String(userId)) match.disconnectedAt.p1 = null;
        if (String(match.player2) === String(userId)) match.disconnectedAt.p2 = null;
        await match.save();

        const players = await Promise.all([
          User.findById(match.player1).select('name elo'),
          User.findById(match.player2).select('name elo'),
        ]);

        socket.emit('match:state', {
          matchId: match._id,
          board: match.board,
          initialBoard: match.initialBoard,
          difficulty: match.difficulty,
          clueCount: match.clueCount,
          players,
          turn: match.turn,
          turnNumber: match.turnNumber,
          moveHistory: match.moveHistory,
          scores: match.scores,
          powerUpsLeft: match.powerUpsLeft,
          clocks: match.clocks,
          status: match.status,
        });
      } catch (err) {
        console.error('match:rejoin error:', err);
        socket.emit('error', { message: 'Failed to rejoin match.' });
      }
    });

    // Validate + apply a move. Both players act SIMULTANEOUSLY on the shared
    // grid (no turns) — a cell is locked once filled by either player.
    socket.on('match:move', ({ matchId, userId, cell, value }) => {
      enqueueMatchOp(matchId, async () => {
        try {
          const match = await Match.findById(matchId);
          if (!match || match.status !== 'active') return;
          if (cell < 0 || cell > 80 || value < 1 || value > 9) return;

          const player = String(match.player1) === String(userId) ? 1 : 2;
          if (!player) return;
          if (match.board[cell] != null) return; // cell already claimed

          const correct = value === match.solution[cell];
          const { board, delta, completedLines } = applyMove({
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
            timestamp: new Date(),
          });
          match.lastMoveAt = new Date();
          await match.save();

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
          if (!match) return;
          const player = String(match.player1) === String(userId) ? 1 : 2;
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
            timestamp: new Date(),
          });
          match.lastMoveAt = new Date();
          await match.save();

          emitMatchState(match);
        } catch (err) {
          console.error('match:powerup error:', err);
        }
      });
    });

    socket.on('match:resign', async ({ matchId, userId }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match) return;
        const player = String(match.player1) === String(userId) ? 1 : 2;
        if (!player) return;
        const winner = player === 1 ? 2 : 1;
        await endMatch(match, winner, 'resign');
      } catch (err) {
        console.error('match:resign error:', err);
      }
    });

    // On disconnect, mark the player disconnected and pause their clock.
    socket.on('disconnect', async () => {
      try {
        const rooms = [...socket.rooms].filter((r) => r.startsWith('room:'));
        for (const roomKey of rooms) {
          const code = roomKey.slice('room:'.length);
          const room = await Room.findOne({ code });
          if (!room || !room.match) continue;

          const match = await Match.findById(room.match);
          if (!match || match.status !== 'active') continue;

          const player = String(match.player1) === socket.userId ? 1 : 2;
          if (player) {
            const key = player === 1 ? 'p1' : 'p2';
            match.disconnectedAt[key] = new Date();
            await match.save();
            io.to(`room:${code}`).emit('opponent:disconnected', { player });
          }
        }
      } catch (err) {
        console.error('disconnect error:', err);
      }
    });
  });

  return io;
}

module.exports = { attachSocket, generateRoomCode };
