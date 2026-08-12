import { useState } from "react";
import { Link } from "react-router-dom";

const ROOM_CODE = "SD-882-QX";

function WaitingRoomPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ROOM_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-start justify-center p-margin-lg md:pl-24 lg:pl-48">
      <main className="w-full max-w-2xl">
        <div className="mb-margin-lg w-full">
          <h3 className="font-label-mono text-label-mono uppercase tracking-widest text-note-gray mb-4">
            INVITE
          </h3>
          <div className="w-full border-t border-hairline mb-8"></div>
          <h1 className="font-display-lg text-display-lg mb-margin-md">
            Waiting for Player 2
          </h1>
        </div>
        <div className="mb-margin-lg">
          <div className="border-hairline p-margin-md inline-block mb-4">
            <span className="font-grid-number text-grid-number tracking-widest text-ink-black">
              {ROOM_CODE}
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
        <div className="flex items-center space-x-2 mb-margin-lg mt-margin-md">
          <span className="font-label-mono text-label-mono text-ink-black">
            Awaiting opponent
          </span>
          <span className="font-label-mono text-label-mono text-ink-black blinking-cursor">
            _
          </span>
        </div>
        <div className="mt-margin-lg pt-margin-lg">
          <Link
            to="/multiplayer"
            className="font-body-md text-body-md text-note-gray hover:text-ink-black transition-colors underline decoration-1 underline-offset-4"
          >
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}

export default WaitingRoomPage;
