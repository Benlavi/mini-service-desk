import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Shell from "../components/shell.jsx";

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  async function loadTickets() {
    setErr(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/tickets/", { token });
      setTickets(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const byStatus = {};
    for (const t of tickets) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    return { total: tickets.length, byStatus };
  }, [tickets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tickets.filter((t) => {
      const okStatus = statusFilter === "all" || t.status === statusFilter;
      const okQ =
        !needle ||
        String(t.id).includes(needle) ||
        (t.subject ?? "").toLowerCase().includes(needle) ||
        (t.body ?? "").toLowerCase().includes(needle);
      return okStatus && okQ;
    });
  }, [tickets, statusFilter, q]);

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <Shell
        title="Admin Dashboard"
        subtitle="Review and manage all tickets"
        right={
          <button className="btn ghost" onClick={onLogout}>
            Logout
          </button>
        }
      >
        {err && <div className="error">{err}</div>}

        <div className="grid">
          <section className="card">
            <h3 className="cardTitle">Overview</h3>

            <div className="meta" style={{ marginBottom: 10 }}>
              Total tickets: <b>{stats.total}</b>
            </div>

            <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {Object.entries(stats.byStatus).map(([k, v]) => (
                <span key={k} className="badge">
                  {k}: {v}
                </span>
              ))}
            </div>

            <div className="form">
              <div>
                <div className="label">Status</div>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="new">new</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              <div>
                <div className="label">Search</div>
                <input
                  className="input"
                  placeholder="Search id / subject / body…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <button className="btn primary" onClick={loadTickets}>
                Refresh
              </button>
            </div>
          </section>

          <section className="card">
            <h3 className="cardTitle">All tickets</h3>

            {loading ? (
              <div className="meta">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="meta">No matching tickets.</div>
            ) : (
              <ul className="list">
                {filtered.map((t) => (
                  <li key={t.id} className="listItem">
                    <Link className="link" to={`/admin/tickets/${t.id}`}>
                      <div>
                        <b>#{t.id}</b> — {t.subject}
                      </div>
                      <div className="meta">
                        status: {t.status} • urgency: {t.urgency} • type: {t.request_type} • operator:{" "}
                        {t.operator_id ?? "—"}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Shell>
    </>
  );
}