// Thin API client for the backend. When MOCK is true, all calls resolve with
// fake data so the frontend works standalone (no backend running). Flip MOCK
// to false when the backend routes are ready and you want real requests.
const MOCK = false;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mockUser(overrides = {}) {
  return {
    _id: "mock-user-1",
    name: "John Doe",
    email: "john.doe@example.com",
    elo: 1200,
    avatarInitials: "JD",
    role: "user",
    ...overrides,
  };
}

async function request(path, options = {}) {
  if (MOCK) {
    await delay(250); // simulate network latency

    const { method = "GET" } = options;

    // --- auth ---
    if (path === "/auth/user/login" && method === "POST") {
      const { email, password } = JSON.parse(options.body || "{}");
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }
      return { success: true, user: mockUser({ email }) };
    }
    if (path === "/auth/user/register" && method === "POST") {
      const { name, email, password } = JSON.parse(options.body || "{}");
      if (!name || !email || !password) {
        throw new Error("Name, email and password are required.");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      return { success: true, user: mockUser({ name, email }) };
    }
    if (path === "/auth/user/logout" && method === "POST") {
      return { success: true };
    }
    if (path === "/auth/user/forgot-password" && method === "POST") {
      return { success: true };
    }
    if (path === "/auth/user/reset-password" && method === "POST") {
      const { password } = JSON.parse(options.body || "{}");
      if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      return { success: true };
    }
    if (path === "/auth/user/me" && method === "GET") {
      return { user: mockUser() };
    }
    if (path === "/auth/user/change-password" && method === "POST") {
      return { success: true };
    }
    if (path === "/auth/user/profile" && method === "PUT") {
      const { name, avatarInitials } = JSON.parse(options.body || "{}");
      return { success: true, user: mockUser({ name, avatarInitials }) };
    }

    // --- rooms ---
    if (path === "/rooms" && method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const { difficulty, clueCount, powerUps, timerMin } = body;
      return {
        success: true,
        code: `SD-${String(Math.floor(100 + Math.random() * 900))}-${String(
          Math.floor(10 + Math.random() * 90)
        )}`,
        room: {
          code: `SD-882-QX`,
          difficulty,
          clueCount,
          powerUps,
          timerMin,
          status: "waiting",
        },
      };
    }
    if (path.startsWith("/rooms/") && method === "GET") {
      return {
        success: true,
        room: {
          code: path.split("/")[2],
          host: "John Doe",
          guest: null,
          status: "waiting",
        },
      };
    }
    if (path.match(/^\/rooms\/.+\/join$/) && method === "POST") {
      return { success: true, room: { status: "full" } };
    }
    if (path.match(/^\/rooms\/[^/]+$/) && method === "DELETE") {
      return { success: true };
    }

    // --- unknown mock route ---
    throw new Error(`Mock: no handler for ${method} ${path}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send session cookie
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

export const apiClient = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
