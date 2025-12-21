import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Check if URL has a token (sent by Backend)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 2. Simple decode (JSON.parse the middle part of JWT)
      // In production, use 'jwt-decode' library
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);

        // Optional: Clean URL
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Simple Google Login</h1>

      {!user ? (
        /* --- STATE 1: NOT LOGGED IN --- */
        <a
          href="http://localhost:3000/auth/google"
          style={{
            padding: "10px 20px",
            backgroundColor: "#DB4437",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            fontSize: "18px",
          }}
        >
          Sign in with Google
        </a>
      ) : (
        /* --- STATE 2: LOGGED IN (PROFILE) --- */
        <div
          style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px", display: "inline-block" }}
        >
          <img
            src={user.picture}
            alt="Profile"
            style={{ borderRadius: "50%", width: "100px", height: "100px" }}
          />
          <h2>Welcome, {user.firstName}!</h2>
          <p>{user.email}</p>
          <button onClick={() => setUser(null)} style={{ marginTop: "10px" }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
