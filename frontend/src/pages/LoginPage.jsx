import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const { setToken, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/tickets";

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const data = await apiFetch("/api/users/login", {
        method: "POST",
        form: { username: email, password },
      });

      const accessToken = data.access_token;
      setToken(accessToken);

      const me = await refreshMe(accessToken);

      if (me?.is_admin) navigate("/admin", { replace: true });
      else navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page split-screen">
      {/* Brand Panel - hidden on mobile */}
      <div className="auth-brand-panel">
        <h1 className="auth-brand-title">Streamline your IT support</h1>
        <p className="auth-brand-description">
          A modern service desk built for teams that value speed, clarity, and collaboration.
        </p>
        <ul className="auth-brand-features">
          <li>AI-powered ticket creation</li>
          <li>Real-time status tracking</li>
          <li>Team assignment & collaboration</li>
          <li>Advanced filtering & search</li>
        </ul>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">SD</div>
            <span className="auth-logo-text">Service Desk</span>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your tickets</p>

          {err && <div className="error">{err}</div>}

          <form onSubmit={onSubmit} className="form">
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              className="btn primary lg w-full"
              disabled={loading || !email || !password}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
