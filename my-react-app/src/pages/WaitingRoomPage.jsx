import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

const ROOM_TTL_MS = 5 * 60 * 1000; // room code active for 5 minutes
const POLL_INTERVAL_MS = 2000;

function WaitingRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Room code passed from the setup page via route state (host created the room).
  const roomCode = location.state?.roomCode || "SD-882-QX";
  const settings = location.state?.settings || null;

  const [copied, setCopied] = useState(false);
  const [expiresAt] = useState(() => Date.now() + ROOM_TTL_MS);
  const [remainingMs, setRemainingMs] = useState(ROOM_TTL_MS);
  const [expired, setExpired] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

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

  // Poll room status; when the guest joins (status full) -> go to the board.
  useEffect(() => {
    if (expired) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await apiClient.get(`/rooms/${roomCode}`);
        if (cancelled) return;
        if (res.room?.status === "full") {
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
  }, [roomCode, settings, expired, navigate]);

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
      await apiClient.delete(`/rooms/${roomCode}`); // host cancels the room
    } finally {
      setCancelled(true);
      navigate("/multiplayer", { replace: true });
    }
  };

  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col items-start justify-center p-margin-lg md:pl-24 lg:pl-48">
      <main className="w-full max-w-2xl">
        <div className="mb-margin-lg w-full">
          <h3 className="font-label-mono text-label-mono uppercase tracking-widest text-note-gray mb-4">
            INVITE
          </h3>
          <div className="w-full border-t border-hairline mb-8"></div>
          <h1 className="font-display-lg text-display-lg mb-margin-md">
            {expired
              ? "Room Expired"
              : cancelled
              ? "Room Cancelled"
              : "Waiting for Player 2"}
          </h1>
        </div>

        {expired ? (
          <div className="mb-margin-lg">
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
            <div className="mb-margin-lg">
              <div className="border-hairline p-margin-md inline-block mb-4">
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

            {settings && (
              <div className="mb-margin-lg flex flex-wrap gap-6 font-label-mono text-label-mono text-secondary">
                <span>
                  {settings.difficulty} · {settings.clueCount} clues
                </span>
                <span>
                  Power-ups:{" "}
                  {settings.powerUps > 0 ? `${settings.powerUps}/player` : "off"}
                </span>
                <span>
                  Timer: {settings.timerMin > 0 ? `${settings.timerMin} min` : "off"}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-margin-lg mt-margin-md">
              <span className="font-label-mono text-label-mono text-ink-black">
                Awaiting opponent
              </span>
              <span className="font-label-mono text-label-mono text-ink-black blinking-cursor">
                _
              </span>
            </div>

            <div className="mb-margin-lg">
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

            <div className="mt-margin-lg pt-margin-lg">
              <button
                onClick={handleCancel}
                className="font-body-md text-body-md text-note-gray hover:text-ink-black transition-colors underline decoration-1 underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default WaitingRoomPage;
