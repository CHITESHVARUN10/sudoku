// Backwards-compatible re-export. The real AuthContext now lives in
// src/contexts/AuthContext.jsx; pages should import from "../contexts/AuthContext".
export { AuthProvider, useAuth } from "../contexts/AuthContext";
