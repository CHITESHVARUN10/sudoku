import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";

const ROOM_TTL_MS = 5 * 60 * 1000; // room code active for 5 minutes
const POLL_INTERVAL_MS = 2000;

function WaitingRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getRoom, cancelRoom } = useRoom();
  const { joinRoom } = useSocket();
  const { user } = useAuth();

  // Room code passed from the setup page via route state (host created the room).
  const roomCode = location.state?.roomCode || null;
  const settings = location.state?.settings || null;

  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + ROOM_TTL_MS);
  const [remainingMs, setRemainingMs] = useState(ROOM_TTL_MS);
  const [expired, setExpired] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

  // No code in route state (direct URL) — go back to the setup page.
  useEffect(() => {
    if (!roomCode) navigate("/multiplayer", { replace: true });
  }, [roomCode, navigate]);

  // Use the server's expiry time so a refresh doesn't reset the countdown.
  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    getRoom(roomCode)
      .then((room) => {
        if (cancelled || !room?.expiresAt) return;
        const expiry = new Date(room.expiresAt).getTime();
        if (!isNaN(expiry)) {
          setExpiresAt(expiry);
          setRemainingMs(Math.max(0, expiry - Date.now()));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [roomCode, getRoom]);

  // Countdown ticker for room expiry.
  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setExpired(true);
        clearInterval(interval);
      } else {
        setRemainingMs(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Host joins the socket room on mount (auto-join, no code entry).
  useEffect(() => {
    if (user?._id && roomCode) {
      joinRoom(roomCode, user._id);
    }
  }, [user?._id, roomCode, joinRoom]);

  // Poll room status; when the guest joins (status full) -> go to the board.
  useEffect(() => {
    if (expired) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const room = await getRoom(roomCode);
        if (cancelled) return;
        if (room?.status === "full" || room?.status === "started") {
          navigate("/multiplayer/board", {
            state: { roomCode, settings },
            replace: true,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not reach room.");
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomCode, settings, expired, navigate, getRoom]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const handleCancel = async () => {
    setError("");
    try {
      await cancelRoom(roomCode); // host cancels the room
    } finally {
      setCancelled(true);
      navigate("/multiplayer", { replace: true });
    }
  };

  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const progressPct = Math.min(
    100,
    Math.max(0, (remainingMs / ROOM_TTL_MS) * 100)
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper-white text-ink-black font-body-md text-body-md antialiased">
      {/* Shared Navbar */}
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-margin-md">
        <div className="w-full max-w-2xl border-2 border-ink-black shadow-hard bg-paper-white p-margin-lg">
          <header className="mb-margin-md border-b border-ink-black pb-margin-md">
            <h3 className="font-label-mono text-label-mono uppercase tracking-widest text-note-gray mb-2">
              Invite
            </h3>
            <h1 className="font-display-lg text-display-lg">
              {expired
                ? "Room Expired"
                : cancelled
                ? "Room Cancelled"
                : "Waiting for Player 2"}
            </h1>
          </header>

          {expired ? (
            <div>
              <p className="font-body-md text-body-md text-ink-black mb-margin-md">
                This room code was active for 5 minutes and no opponent joined.
                Create a new room to try again.
              </p>
              <Link
                to="/multiplayer"
                className="inline-block bg-ink-black text-paper-white py-3 px-6 font-label-mono text-label-mono uppercase tracking-widest hover:bg-ink-blue transition-colors"
              >
                Back to Setup
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6 mb-margin-md flex-wrap">
                <div>
                  <div className="border-2 border-ink-black p-margin-sm inline-block mb-2">
                    <span className="font-grid-number text-grid-number tracking-widest text-ink-black">
                      {roomCode}
                    </span>
                  </div>
                  <div>
                    <button
                      className="font-body-md text-body-md text-ink-black hover:underline decoration-1 underline-offset-4 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ink-black focus:ring-offset-2 p-1 -ml-1 transition-all"
                      onClick={handleCopy}
                    >
                      {copied ? "Copied" : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-label-mono text-label-mono uppercase tracking-widest text-secondary">
                    Host
                  </div>
                  <div className="font-headline-sm text-headline-sm font-bold">
                    {user?.name || "You"}
                  </div>
                </div>
              </div>

              {settings && (
                <div className="mb-margin-md flex flex-wrap gap-3 font-label-mono text-label-mono text-secondary">
                  <span className="border border-ink-black px-2 py-1">
                    {settings.difficulty} · {settings.clueCount} clues
                  </span>
                  <span className="border border-ink-black px-2 py-1">
                    Power-ups:{" "}
                    {settings.powerUps > 0
                      ? `${settings.powerUps}/player`
                      : "off"}
                  </span>
                  <span className="border border-ink-black px-2 py-1">
                    Timer:{" "}
                    {settings.timerMin > 0 ? `${settings.timerMin} min` : "off"}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2 mb-margin-md">
                <span className="font-label-mono text-label-mono text-ink-black">
                  Awaiting opponent
                </span>
                <span className="font-label-mono text-label-mono text-ink-black blinking-cursor">
                  _
                </span>
              </div>

              {/* TTL progress bar */}
              <div className="mb-2 h-1 w-full bg-surface-variant">
                <div
                  className="h-1 bg-ink-black transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mb-margin-md">
                <span className="font-label-mono text-label-mono text-note-gray">
                  Room expires in {mm}:{ss}
                </span>
              </div>

              {error && (
                <p
                  className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2 mb-margin-md"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="pt-margin-md border-t border-ink-black/20">
                <button
                  onClick={handleCancel}
                  className="font-body-md text-body-md text-note-gray hover:text-ink-black transition-colors underline decoration-1 underline-offset-4 bg-transparent border-none cursor-pointer"
                >
                  Cancel Room
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default WaitingRoomPage;
