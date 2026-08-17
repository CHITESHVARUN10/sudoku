const { Server } = require('socket.io');
const Room = require('../models/Room');
const Match = require('../models/Match');
const User = require('../models/User');
const { sessionMiddleware } = require('../middleware/session');
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

// Every socket handler resolves the real user from the session cookie; the
// userId passed in the payload is only accepted if it matches.
function socketUserId(socket) {
  return socket.request?.session?.passport?.user || null;
}

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

// ---- Independent per-player boards (race mode) ----
// Each seat has its own 81-cell grid. Clues/solution are shared. A move
// touches ONLY the actor's board — no masking, no '?' ghost, no cross-overwrite.

function ensureBoards(match) {
  if (match.boards && match.boards.p1 && match.boards.p2) return;
  const legacy = match.board && match.board.length === 81 ? match.board : match.initialBoard;
  if (!match.boards) match.boards = {};
  if (!match.boards.p1) match.boards.p1 = [...legacy];
  if (!match.boards.p2) match.boards.p2 = [...legacy];
  match.markModified('boards');
}

function boardForSeat(match, seat) {
  ensureBoards(match);
  return seat === 1 ? match.boards.p1 : match.boards.p2;
}

function setBoardForSeat(match, seat, next) {
  ensureBoards(match);
  if (seat === 1) match.boards.p1 = next;
  else match.boards.p2 = next;
  match.markModified('boards');
}

function cellStatusForSeat(match, seat) {
  const b = boardForSeat(match, seat);
  return b.map((v, i) => {
    if (v == null) return null;
    if (match.initialBoard[i] != null) return 'given';
    return v === match.solution[i] ? 'locked' : 'wrong';
  });
}

function isBoardSolvedForSeat(match, seat) {
  const b = boardForSeat(match, seat);
  return b.every((v, i) => v != null && v === match.solution[i]);
}

function opponentProgress(match, viewerSeat) {
  const oppSeat = viewerSeat === 1 ? 2 : 1;
  const oppBoard = boardForSeat(match, oppSeat);
  let filled = 0;
  let correct = 0;
  for (let i = 0; i < 81; i++) {
    if (oppBoard[i] != null) {
      filled++;
      if (oppBoard[i] === match.solution[i]) correct++;
    }
  }
  return { filled, correct };
}

function ghostMaskForSeat(match, viewerSeat) {
  const ownBoard = boardForSeat(match, viewerSeat);
  const oppSeat = viewerSeat === 1 ? 2 : 1;
  const oppBoard = boardForSeat(match, oppSeat);
  const mask = Array(81).fill(false);
  for (let i = 0; i < 81; i++) {
    if (ownBoard[i] != null) continue; // own value present — no ghost
    if (match.initialBoard[i] != null) continue; // clue — never ghost
    if (oppBoard[i] != null && oppBoard[i] === match.solution[i]) {
      mask[i] = true; // opponent solved correctly, you haven't — show '?'
    }
  }
  return mask;
}

async function fetchMatchPlayers(match) {
  const [p1, p2] = await Promise.all([
    User.findById(match.player1).select('name elo'),
    User.findById(match.player2).select('name elo'),
  ]);
  return [p1, p2];
}

// Full state payload for ONE viewer (seat 1 or 2). Board is per-player
// (race mode) — each viewer gets their OWN board/status. Ghost '?' is a
// view-only overlay (opponent correct && you empty), not a stored value.
function buildStatePayload(match, players, viewerSeat) {
  ensureBoards(match);
  const ownBoard = boardForSeat(match, viewerSeat);
  const ownStatus = cellStatusForSeat(match, viewerSeat);
  const ownNotes =
    viewerSeat === 1 ? match.notes?.p1 : match.notes?.p2;
  return {
    matchId: match._id,
    board: ownBoard,
    initialBoard: match.initialBoard,
    cellStatus: ownStatus,
    ghost: ghostMaskForSeat(match, viewerSeat),
    opponentProgress: opponentProgress(match, viewerSeat),
    difficulty: match.difficulty,
    clueCount: match.clueCount,
    players: players.map((p) =>
      p ? { _id: p._id, name: p.name, elo: p.elo } : null
    ),
    turn: match.turn,
    turnNumber: match.turnNumber,
    // Opponent's entries: keep only WHICH cell was marked — never the value
    // or whether it was right/wrong.
    moveHistory: match.moveHistory.map((m) =>
      m.player === viewerSeat
        ? m
        : { player: m.player, cell: m.cell, timestamp: m.timestamp }
    ),
    scores: match.scores,
    mistakes: match.mistakes,
    notes: ownNotes != null ? ownNotes : match.notes,
    powerUpsLeft: match.powerUpsLeft,
    powerUpsMax: match.powerUpsMax,
    clocks: match.clocks,
    status: match.status,
  };
}

// Server-authoritative clocks: decrement both players' clocks by the real
// elapsed time since lastMoveAt. A seat whose disconnectedAt is set is paused.
// Returns true if the match ended via timeout.
async function tickClocks(io, match) {
  if (match.timerMinPerPlayer <= 0) return false;
  const now = new Date();
  const last = match.lastMoveAt || match.startedAt || now;
  const elapsed = Math.max(0, (now - new Date(last)) / 1000);

  if (elapsed > 0) {
    match.clocks = {
      p1: match.disconnectedAt?.p1
        ? match.clocks.p1
        : Math.max(0, (match.clocks.p1 || 0) - elapsed),
      p2: match.disconnectedAt?.p2
        ? match.clocks.p2
        : Math.max(0, (match.clocks.p2 || 0) - elapsed),
    };
  }
  match.lastMoveAt = now;

  if (match.clocks.p1 <= 0) {
    await endMatch(io, match, 2, 'timeout');
    return true;
  }
  if (match.clocks.p2 <= 0) {
    await endMatch(io, match, 1, 'timeout');
    return true;
  }
  return false;
}

// Broadcast the live match state to both players — each gets their OWN
// board/status + view-only ghost overlay (race mode).
async function emitMatchState(io, match) {
  ensureBoards(match);
  const players = await fetchMatchPlayers(match);
  const common = {
    matchId: match._id,
    turn: match.turn,
    turnNumber: match.turnNumber,
    scores: match.scores,
    mistakes: match.mistakes,
    powerUpsLeft: match.powerUpsLeft,
    clocks: match.clocks,
    status: match.status,
  };
  for (const seat of [1, 2]) {
    const ownBoard = boardForSeat(match, seat);
    const ownStatus = cellStatusForSeat(match, seat);
    const ownNotes = seat === 1 ? match.notes?.p1 : match.notes?.p2;
    const uid = seat === 1 ? match.player1 : match.player2;
    io.to(`user:${uid}`).emit('match:state', {
      ...common,
      board: ownBoard,
      cellStatus: ownStatus,
      ghost: ghostMaskForSeat(match, seat),
      opponentProgress: opponentProgress(match, seat),
      notes: ownNotes != null ? ownNotes : match.notes,
      players: players.map((p) =>
        p ? { _id: p._id, name: p.name, elo: p.elo } : null
      ),
      moveHistory: match.moveHistory.map((m) =>
        m.player === seat
          ? m
          : { player: m.player, cell: m.cell, timestamp: m.timestamp }
      ),
    });
  }
}

// End the match: set status, winner, elo deltas, notify players.
async function endMatch(io, match, winnerPlayer, reason) {
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
    const timeSec = match.startedAt
      ? Math.max(0, Math.round((new Date() - new Date(match.startedAt)) / 1000))
      : 0;
    await recordMatchResult(match, {
      winnerUserId,
      loserUserId,
      eloDelta: match.eloDelta,
      timeSec,
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
    mistakes: match.mistakes,
    eloDelta: match.eloDelta,
  });

  await Room.updateOne({ _id: match.room }, { status: 'started' });
}

function attachSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Share the express session middleware so socket handlers can read the
  // authenticated user from the session cookie.
  io.engine.use(sessionMiddleware);

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
        boards: { p1: [...puzzle.puzzle], p2: [...puzzle.puzzle] },
        board: puzzle.puzzle, // legacy — kept for old docs
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
      // A started room must NOT be TTL-deleted while the match is live —
      // players rejoin via the room code after a refresh. Clear the expiry.
      room.expiresAt = null;
      await room.save();

      const players = await fetchMatchPlayers(match);

      // Move both players' sockets into the match room so match:state /
      // match:end reach them (they keep room:CODE as well).
      const socketsInRoom = await io.in(`room:${room.code}`).fetchSockets();
      for (const s of socketsInRoom) {
        s.join(`match:${match._id}`);
        s.matchId = match._id;
      }

      // Send each player their OWN board (race mode — no masking).
      // players is absolute [p1, p2]; frontend derives seat from ids.
      for (const seat of [1, 2]) {
        const uid = seat === 1 ? match.player1 : match.player2;
        io.to(`user:${uid}`).emit('match:start', {
          ...buildStatePayload(match, players, seat),
          timerMin: match.timerMinPerPlayer,
        });
      }

      return match;
    });
  }

  io.on('connection', (socket) => {
    // Attach socket to a room; if both players are present, start the match.
    socket.on('room:join', async ({ roomCode, userId }) => {
      try {
        const authedId = socketUserId(socket);
        if (!authedId || String(authedId) !== String(userId)) {
          socket.emit('error', { message: 'Not authenticated.' });
          return;
        }
        if (!roomCode || !userId) {
          socket.emit('error', { message: 'Missing room code or user id.' });
          return;
        }
        const room = await Room.findOne({ code: roomCode });
        // Room may be TTL-deleted even though a match is live; fall back to
        // the user's active match so refresh/rejoin still works.
        if (!room || room.status === 'cancelled') {
          const activeMatch = await Match.findOne({
            $or: [{ player1: authedId }, { player2: authedId }],
            status: 'active',
          }).sort({ createdAt: -1 });
          if (activeMatch) {
            socket.join(`match:${activeMatch._id}`);
            socket.join(`user:${userId}`);
            socket.userId = userId;
            socket.matchId = activeMatch._id;
            const players = await fetchMatchPlayers(activeMatch);
            const seat =
              String(activeMatch.player1) === String(authedId) ? 1 : 2;
            socket.emit(
              'match:state',
              buildStatePayload(activeMatch, players, seat)
            );
            return;
          }
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
            const seat =
              String(match.player1) === String(userId) ? 1 : 2;
            socket.emit(
              'match:state',
              buildStatePayload(match, players, seat)
            );
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
        const authedId = socketUserId(socket);
        if (!authedId || String(authedId) !== String(userId)) {
          socket.emit('error', { message: 'Not authenticated.' });
          return;
        }
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
        socket.emit('match:state', buildStatePayload(match, players, player));
        io.to(`match:${matchId}`).emit('opponent:reconnected', { player });
      } catch (err) {
        console.error('match:rejoin error:', err);
        socket.emit('error', { message: 'Failed to rejoin match.' });
      }
    });

    // Validate + apply a move. Race mode: each player writes ONLY to their
    // own board. One player's mark has no effect on the opponent's grid.
    socket.on('match:move', ({ matchId, userId, cell, value }) => {
      enqueueMatchOp(matchId, async () => {
        try {
          const authedId = socketUserId(socket);
          if (!authedId || String(authedId) !== String(userId)) {
            socket.emit('error', { message: 'Not authenticated.' });
            return;
          }
          const match = await Match.findById(matchId);
          if (!match || match.status !== 'active') {
            socket.emit('error', { message: 'Match is not active.' });
            return;
          }
          if (cell < 0 || cell > 80 || value < 1 || value > 9) {
            socket.emit('error', { message: 'Invalid move.' });
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
          if (match.initialBoard[cell] != null) {
            socket.emit('error', { message: 'Cell is a clue.' });
            return;
          }
          ensureBoards(match);
          const ownBoard = boardForSeat(match, player);
          // Locked correct cells on OWN board cannot be changed; wrong cells on
          // own board can be overwritten (player corrects their mistake).
          if (
            ownBoard[cell] != null &&
            ownBoard[cell] === match.solution[cell]
          ) {
            socket.emit('error', {
              message: 'That cell is already correct.',
            });
            return;
          }

          if (await tickClocks(io, match)) return; // match ended via timeout

          const correct = value === match.solution[cell];
          const { board: next, delta } = applyMove({
            board: ownBoard,
            cell,
            value,
            correct,
          });

          setBoardForSeat(match, player, next);
          const scoreKey = player === 1 ? 'p1' : 'p2';
          match.scores[scoreKey] += delta;
          if (!correct) match.mistakes[scoreKey] += 1;
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

          if (isBoardSolvedForSeat(match, player)) {
            await endMatch(io, match, player, 'solved');
            return;
          }
          emitMatchState(io, match);
        } catch (err) {
          console.error('match:move error:', err);
        }
      });
    });

    // Reveal a cell via power-up. Race mode: reveals on the ACTOR's own board only.
    socket.on('match:powerup', ({ matchId, userId, cell }) => {
      enqueueMatchOp(matchId, async () => {
        try {
          const authedId = socketUserId(socket);
          if (!authedId || String(authedId) !== String(userId)) {
            socket.emit('error', { message: 'Not authenticated.' });
            return;
          }
          const match = await Match.findById(matchId);
          if (!match || match.status !== 'active') {
            socket.emit('error', { message: 'Match is not active.' });
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

          if (await tickClocks(io, match)) return; // match ended via timeout

          ensureBoards(match);
          if (match.initialBoard[cell] != null) {
            socket.emit('error', { message: 'Cell is a clue.' });
            return;
          }
          const ownBoard = boardForSeat(match, player);
          if (
            ownBoard[cell] != null &&
            ownBoard[cell] === match.solution[cell]
          ) {
            socket.emit('error', {
              message: 'That cell is already correct.',
            });
            return;
          }

          const res = usePowerUp(match, player, cell);
          if (!res.ok) {
            socket.emit('error', { message: res.reason });
            return;
          }

          const { board: _next } = applyMove({
            board: ownBoard,
            cell,
            value: res.value,
            correct: true,
          });
          setBoardForSeat(match, player, _next);

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

          if (isBoardSolvedForSeat(match, player)) {
            await endMatch(io, match, player, 'solved');
            return;
          }
          emitMatchState(io, match);
        } catch (err) {
          console.error('match:powerup error:', err);
        }
      });
    });

    // Persist a player's pencil marks (81-cell array of note sets).
    socket.on('match:notes', async ({ matchId, userId, notes }) => {
      try {
        const authedId = socketUserId(socket);
        if (!authedId || String(authedId) !== String(userId)) {
          socket.emit('error', { message: 'Not authenticated.' });
          return;
        }
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'active') return;
        const player =
          String(match.player1) === String(userId)
            ? 1
            : String(match.player2) === String(userId)
            ? 2
            : 0;
        if (!player) return;
        if (
          !Array.isArray(notes) ||
          notes.length !== 81 ||
          notes.some((set) => !Array.isArray(set))
        ) {
          socket.emit('error', { message: 'Notes must be an 81-cell array.' });
          return;
        }
        const key = player === 1 ? 'p1' : 'p2';
        match.notes[key] = notes.map((set) =>
          [...new Set(set)].filter((n) => n >= 1 && n <= 9)
        );
        await match.save();
        emitMatchState(io, match);
      } catch (err) {
        console.error('match:notes error:', err);
      }
    });

    socket.on('match:resign', async ({ matchId, userId }) => {
      try {
        const authedId = socketUserId(socket);
        if (!authedId || String(authedId) !== String(userId)) {
          socket.emit('error', { message: 'Not authenticated.' });
          return;
        }
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
        await endMatch(io, match, winner, 'resign');
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
        } else {
          return; // another tab/socket is still connected
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

  // Sweep active timed matches so clocks tick (and timeouts fire) even when
  // neither player makes a move.
  setInterval(async () => {
    try {
      const matches = await Match.find({
        status: 'active',
        timerMinPerPlayer: { $gt: 0 },
      });
      for (const match of matches) {
        await enqueueMatchOp(match._id, async () => {
          const fresh = await Match.findById(match._id);
          if (!fresh || fresh.status !== 'active') return;
          const before = { ...fresh.clocks };
          const ended = await tickClocks(io, fresh);
          if (ended) return;
          if (fresh.clocks.p1 !== before.p1 || fresh.clocks.p2 !== before.p2) {
            await fresh.save();
            emitMatchState(io, fresh);
          }
        });
      }
    } catch (err) {
      console.error('clock sweep error:', err);
    }
  }, 5000);

  return io;
}

module.exports = { attachSocket, generateRoomCode };
