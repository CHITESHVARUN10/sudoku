# Sudoku Arena

A modern, broadsheet-inspired Sudoku platform designed with an editorial aesthetic. Built for focus, elegance, and competitive play.

---

## 🌟 Overview

**Sudoku Arena** offers a clean, distraction-free environment for Sudoku enthusiasts. From single-player practice sessions to competitive real-time multiplayer matches, the application provides a refined puzzle-solving experience.

---

## 📁 Repository Structure

```
full/
├── my-react-app/         # React Frontend Application (Vite + Tailwind CSS)
│   ├── src/              # Application source code
│   │   ├── auth/         # Authentication context and provider
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application view pages
│   │   ├── data.js       # Mock data & puzzle helpers
│   │   ├── App.jsx       # App routes & provider container
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static public assets
│   ├── package.json      # Project dependencies and scripts
│   └── vite.config.js    # Vite configuration
├── backend/              # Backend service and API server
├── stitch_screens/       # UI Design assets and screen mockups
├── .gitignore            # Root Git ignore rule set
└── README.md             # Project documentation
```

---

## ✨ Features

- **Single Player Practice**: Play puzzles tailored across multiple difficulty tiers with real-time validation and hints.
- **Multiplayer Matches**: Challenge opponents in real-time head-to-head match rooms.
- **Daily Archives**: Access past daily puzzles and track daily streak progress.
- **Player Statistics & Leaderboards**: Track solving speed, win rates, and ranking on global leaderboards.
- **Editorial Design System**: Newspaper-inspired UI with high-contrast broadsheet aesthetics and clean typography.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd full
   ```

2. Navigate to the frontend directory and install dependencies:
   ```bash
   cd my-react-app
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser to view the application.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vite
- **Styling**: Tailwind CSS, Google Fonts
- **Linting**: Oxlint

---

## 📜 License

This project is licensed under the MIT License.
