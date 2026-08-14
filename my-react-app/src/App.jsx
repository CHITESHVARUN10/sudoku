import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/practice" element={<SinglePlayerSetupPage />} />
          <Route path="/practice/board" element={<SinglePlayerGameBoardPage />} />
          <Route path="/multiplayer" element={<MultiplayerSetupModalPage />} />
          <Route path="/multiplayer/board" element={<MultiplayerGameBoardPage />} />
          <Route path="/multiplayer/waiting" element={<WaitingRoomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/archive" element={<DailyArchivePage />} />
          <Route path="/results" element={<GameResultsPage />} />
          <Route path="/about" element={<AboutCreditsPage />} />
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
