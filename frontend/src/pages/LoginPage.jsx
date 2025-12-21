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
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <h1 className="h1">Welcome back</h1>
        <div className="h2">Login to manage your tickets</div>
      </div>

      {err && <div className="error">{err}</div>}

      <section className="card" style={{ maxWidth: 520 }}>
        <h3 className="cardTitle">Login</h3>

        <form onSubmit={onSubmit} className="form">
          <div>
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button className="btn primary" disabled={loading || !email || !password}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="meta">
            No account yet?{" "}
            <Link className="link" to="/register">
              Create one
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}