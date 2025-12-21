import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  // where to go after login (for normal users)
  const from = location.state?.from || "/tickets";

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // OAuth2PasswordRequestForm login
      const data = await apiFetch("/api/users/login", {
        method: "POST",
        form: { username: email, password },
      });

      const accessToken = data.access_token;
      setToken(accessToken);

      // fetch /me and store user in AuthContext
      const me = await refreshMe(accessToken);

      // role-based redirect
      if (me?.is_admin) navigate("/admin", { replace: true });
      else navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="app">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="page-head">
          <h1 className="h1">Welcome back</h1>
          <p className="sub">Login to manage your tickets</p>
        </div>

        <div className="card solid">
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@example.com" />
            </div>

            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {err && <div className="error">{err}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}