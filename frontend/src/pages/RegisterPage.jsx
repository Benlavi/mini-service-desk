import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import Shell from "../components/shell.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await apiFetch("/api/users/", {
        method: "POST",
        json: {
          name,
          email,
          password,
          is_admin: false, // IMPORTANT: user cannot register as admin
        },
      });

      // After successful register -> go login
      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="Create account" subtitle="Register to open and track tickets">
      {err && <div className="error">{err}</div>}

      <section className="card" style={{ maxWidth: 520 }}>
        <h3 className="cardTitle">Register</h3>

        <form onSubmit={onSubmit} className="form">
          <div>
            <div className="label">Name</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ben"
            />
          </div>

          <div>
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ben@example.com"
            />
          </div>

          <div>
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn primary" disabled={loading || !name || !email || !password}>
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="meta">
            Already have an account? <Link className="link" to="/login">Login</Link>
          </div>
        </form>
      </section>
    </Shell>
  );
}