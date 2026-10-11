
import { useState } from "react";

const AUTH_URL = "http://localhost:5000/api/auth";

function AuthForm({ onAuthSuccess, onBack }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const body = { email, password };

      if (mode === "register") {
        body.name = name;
        body.role = role;
      }

      const response = await fetch(`${AUTH_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      onAuthSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button className="auth-back" type="button" onClick={onBack}>
          ← Back to JobHub
        </button>

        <div className="auth-brand">
          <span className="brand-icon">J</span>
          <span>JobHub</span>
        </div>

        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to continue your career journey."
            : "Join JobHub and discover new opportunities."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <>
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                required
              />

              <label htmlFor="auth-role">Account type</label>
              <select
                id="auth-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="jobseeker">Jobseeker</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </>
          )}

          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            minLength={6}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="primary-btn auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login to JobHub"
                : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "New to JobHub? "
            : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthForm;
