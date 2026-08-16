import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { fadeUp } from "../components/motion/presets";

function AccountSettingsPage() {
  const { user, updateProfile } = useAuth();
  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(""); // "saved" | error text

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(""); // "saved" | error text

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim() || user?.name });
      setProfileMsg("saved");
    } catch (err) {
      setProfileMsg(err.message || "Could not save your name.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (newPassword.length < 8) {
      setPwdMsg("New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwdMsg("saved");
    } catch (err) {
      setPwdMsg(err.message || "Could not update the password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="bg-paper-white text-ink-black font-body-md min-h-screen flex flex-col">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[600px] mx-auto px-margin-sm md:px-0 py-margin-lg flex flex-col gap-12">
        {/* Header */}
        <header className="w-full pb-4 border-b border-ink-black">
          <h1 className="font-headline-md text-headline-md uppercase tracking-widest">
            Account
          </h1>
        </header>

        {/* Profile */}
        <motion.form
          className="flex gap-8 items-start pb-12 border-b border-ink-black"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          onSubmit={saveProfile}
        >
          <div className="w-24 h-24 bg-ink-black text-paper-white flex items-center justify-center flex-shrink-0">
            <span className="font-headline-md text-headline-md">{initials}</span>
          </div>
          <div className="flex flex-col gap-6 w-full pt-1">
            <div>
              <label
                className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1"
                htmlFor="profile-name"
              >
                Name
              </label>
              <input
                id="profile-name"
                name="name"
                className="input-underline font-body-lg text-body-lg"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1"
                htmlFor="profile-email"
              >
                Email
              </label>
              <input
                id="profile-email"
                name="email"
                className="input-underline font-body-lg text-body-lg"
                type="email"
                value={email}
                readOnly
                aria-describedby="email-note"
              />
              <p
                id="email-note"
                className="font-body-md text-[12px] text-note-gray mt-1"
              >
                Email is used for sign-in and cannot be changed here.
              </p>
            </div>
            <AnimatePresence>
              {profileMsg && (
                <motion.p
                  role={profileMsg === "saved" ? "status" : "alert"}
                  className={`font-body-md text-body-md px-3 py-2 ${
                    profileMsg === "saved"
                      ? "border border-ink-black bg-surface-variant text-ink-black"
                      : "border border-error-red bg-error-red/10 text-error-red"
                  }`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {profileMsg === "saved"
                    ? "Profile saved."
                    : profileMsg}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile || !name.trim()}
                className="bg-ink-black text-paper-white font-label-mono text-label-mono uppercase tracking-widest px-6 py-3 hover:bg-ink-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Saving…" : "Save name"}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Password */}
        <motion.form
          className="flex flex-col gap-6 pb-12 border-b border-ink-black"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.08 }}
          onSubmit={changePassword}
        >
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest">
            Security
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label
                className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1"
                htmlFor="current-password"
              >
                Current password
              </label>
              <input
                id="current-password"
                name="currentPassword"
                className="input-underline font-body-lg text-body-lg"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label
                className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1"
                htmlFor="new-password"
              >
                New password
              </label>
              <input
                id="new-password"
                name="newPassword"
                className="input-underline font-body-lg text-body-lg"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                aria-describedby="password-hint"
              />
              <p
                id="password-hint"
                className="font-body-md text-[12px] text-note-gray mt-1"
              >
                At least 8 characters.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary hover:text-ink-black transition-colors self-start"
              >
                {showPassword ? "Hide" : "Show"} passwords
              </button>
            </div>
            <AnimatePresence>
              {pwdMsg && (
                <motion.p
                  role={pwdMsg === "saved" ? "status" : "alert"}
                  className={`font-body-md text-body-md px-3 py-2 ${
                    pwdMsg === "saved"
                      ? "border border-ink-black bg-surface-variant text-ink-black"
                      : "border border-error-red bg-error-red/10 text-error-red"
                  }`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {pwdMsg === "saved"
                    ? "Password updated. Use it next time you sign in."
                    : pwdMsg}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || newPassword.length < 8}
                className="bg-ink-black text-paper-white font-label-mono text-label-mono uppercase tracking-widest px-6 py-3 hover:bg-ink-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Danger Zone */}
        <motion.section
          className="flex flex-col gap-6 pb-12 border-b border-ink-black"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.16 }}
        >
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest">
            Danger zone
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap border border-error-red p-4">
            <div className="flex flex-col gap-1">
              <span className="font-body-md text-body-md font-medium">
                Delete account
              </span>
              <span className="font-body-md text-[12px] text-secondary">
                Permanently removes your account and match history. This cannot
                be undone.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                window.confirm(
                  "Delete your account and all history? This cannot be undone."
                ) && alert("Account deletion is not available yet.")
              }
              className="font-label-mono text-grid-notes uppercase tracking-widest text-error-red hover:bg-error-red hover:text-paper-white transition-colors border border-error-red px-4 py-2"
            >
              Delete account
            </button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-paper-white w-full border-t border-ink-black flex flex-col md:flex-row justify-between items-center px-margin-lg py-8 mt-auto">
        <div className="font-headline-sm text-headline-sm text-ink-black">
          © 2024 SUDOKU ARENA. AN EDITORIAL LOGIC PLATFORM.
        </div>
        <div className="flex gap-6 mt-4 md:mt-0 font-label-mono text-grid-notes uppercase tracking-widest">
          <Link to="/about" className="text-secondary hover:text-ink-black underline transition-colors">
            Terms
          </Link>
          <Link to="/about" className="text-secondary hover:text-ink-black underline transition-colors">
            Privacy
          </Link>
          <Link to="/archive" className="text-secondary hover:text-ink-black underline transition-colors">
            Archive
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default AccountSettingsPage;
