import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig, AnimatePresence } from "framer-motion";
import { AuthProvider } from "./auth/AuthContext";
import { PracticeProvider } from "./contexts/PracticeContext";
import { RoomProvider } from "./contexts/RoomContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { LeaderboardProvider } from "./contexts/LeaderboardContext";
import { DailyProvider } from "./contexts/DailyContext";
import { MatchProvider } from "./contexts/MatchContext";
import { SocketProvider } from "./contexts/SocketContext";
import PageTransition from "./components/motion/PageTransition";
import LandingPage from "./pages/LandingPage";
import SinglePlayerSetupPage from "./pages/SinglePlayerSetupPage";
import SinglePlayerGameBoardPage from "./pages/SinglePlayerGameBoardPage";
import MultiplayerSetupModalPage from "./pages/MultiplayerSetupModalPage";
import MultiplayerGameBoardPage from "./pages/MultiplayerGameBoardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import HowToPlayPage from "./pages/HowToPlayPage";
import StatisticsPage from "./pages/StatisticsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DailyArchivePage from "./pages/DailyArchivePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import GameResultsPage from "./pages/GameResultsPage";
import AboutCreditsPage from "./pages/AboutCreditsPage";

const routes = [
  { path: "/", element: <LandingPage /> },
  { path: "/practice", element: <SinglePlayerSetupPage /> },
  { path: "/practice/board", element: <SinglePlayerGameBoardPage /> },
  { path: "/multiplayer", element: <MultiplayerSetupModalPage /> },
  { path: "/multiplayer/board", element: <MultiplayerGameBoardPage /> },
  { path: "/multiplayer/waiting", element: <WaitingRoomPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password/:token", element: <ResetPasswordPage /> },
  { path: "/settings", element: <AccountSettingsPage /> },
  { path: "/how-to-play", element: <HowToPlayPage /> },
  { path: "/stats", element: <StatisticsPage /> },
  { path: "/leaderboard", element: <LeaderboardPage /> },
  { path: "/archive", element: <DailyArchivePage /> },
  { path: "/results/:id", element: <GameResultsPage /> },
  { path: "/about", element: <AboutCreditsPage /> },
  { path: "*", element: <PageNotFoundPage /> },
];

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {routes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<PageTransition>{r.element}</PageTransition>}
          />
        ))}
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <PracticeProvider>
            <RoomProvider>
              <HistoryProvider>
                <LeaderboardProvider>
                  <DailyProvider>
                    <MatchProvider>
                      <SocketProvider>
                        <AnimatedRoutes />
                      </SocketProvider>
                    </MatchProvider>
                  </DailyProvider>
                </LeaderboardProvider>
              </HistoryProvider>
            </RoomProvider>
          </PracticeProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}

export default App;
