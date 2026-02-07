import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import AdvancedFilterModal, { evaluateAdvanced } from "../components/AdvancedFilterModal.jsx";
import { Badge } from "../components/ui";
import { truncateText, compare, ALL_STATUSES } from "../utils";

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [operators, setOperators] = useState([]);
  const [userById, setUserById] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  // Advanced filters
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState(null);

  // Table controls
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const pageSize = 12;

  function nameForUserId(id) {
    if (id == null) return "—";
    return userById[id]?.name ?? `User ${id}`;
  }

  function nameForOperatorId(id) {
    if (id == null) return "—";
    const op = operators.find((o) => o.id === id);
    return op?.name ?? userById[id]?.name ?? `User ${id}`;
  }

  async function loadTickets() {
    setErr(null);
    setLoading(true);
    try {
      const [tix, ops] = await Promise.all([
        apiFetch("/api/tickets/", { token }),
        apiFetch("/api/users/operators", { token }),
      ]);

      setTickets(tix);
      setOperators(ops);

      const ids = new Set();
      for (const t of tix) {
        if (t.created_by_id != null) ids.add(t.created_by_id);
        if (t.operator_id != null) ids.add(t.operator_id);
      }

      const missing = [...ids].filter((id) => userById[id] == null);

      if (missing.length) {
        const users = await Promise.all(
          missing.map((id) =>
            apiFetch(`/api/users/${id}`, { token }).catch(() => null)
          )
        );
        setUserById((prev) => {
          const next = { ...prev };
          for (const u of users) {
            if (u && u.id != null) next[u.id] = u;
          }
          return next;
        });
      }
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

  function onLogout() {
    logout();
    navigate("/login");
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortValue(t, key) {
    if (key === "created_by_id") return nameForUserId(t.created_by_id);
    if (key === "operator_id") return nameForOperatorId(t.operator_id);
    if (key === "description") return t.description ?? "";
    return t?.[key];
  }

  // ========== STATISTICS ==========
  const stats = useMemo(() => {
    const total = tickets.length;
    const byStatus = { new: 0, assigned: 0, pending: 0, closed: 0 };
    let highPriority = 0;
    let unassigned = 0;

    for (const t of tickets) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      if (t.urgency === "high") highPriority++;
      if (t.operator_id == null) unassigned++;
    }

    const open = byStatus.new + byStatus.assigned + byStatus.pending;

    return { total, open, highPriority, unassigned, byStatus };
  }, [tickets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const ctx = {
      userById,
      operators,
    };

    return tickets
      .filter((t) => {
        const okStatus = statusFilter === "all" || t.status === statusFilter;

        const okQ =
          !needle ||
          String(t.id).includes(needle) ||
          (t.description ?? "").toLowerCase().includes(needle) ||
          (t.request_type ?? "").toLowerCase().includes(needle) ||
          nameForUserId(t.created_by_id).toLowerCase().includes(needle) ||
          nameForOperatorId(t.operator_id).toLowerCase().includes(needle);

        const okAdv = evaluateAdvanced(t, adv, ctx);
        return okStatus && okQ && okAdv;
      })
      .sort((a, b) => {
        const av = getSortValue(a, sortKey);
        const bv = getSortValue(b, sortKey);
        const c = compare(av, bv);
        return sortDir === "asc" ? c : -c;
      });
  }, [tickets, statusFilter, q, adv, sortKey, sortDir, userById, operators]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  useEffect(() => setPage(1), [statusFilter, q, adv]);

  const allOnPageSelected = useMemo(() => {
    if (pageRows.length === 0) return false;
    return pageRows.every((t) => selected.has(t.id));
  }, [pageRows, selected]);

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((t) => next.delete(t.id));
      else pageRows.forEach((t) => next.add(t.id));
      return next;
    });
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function sortIcon(key) {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  function filterByStatus(status) {
    setStatusFilter(status);
    setQ("");
  }

  return (
    <>
      <Layout title="Admin Dashboard" subtitle="Manage all tickets across the system">
        {/* ========== STATISTICS CARDS ========== */}
        <div className="stats-grid">
          <div
            className="stat-card"
            style={{ "--stat-color": "var(--accent-primary)" }}
          >
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tickets</div>
            <div className="stat-subtext">All time</div>
          </div>

          <div
            className="stat-card"
            style={{ "--stat-color": "var(--status-new)" }}
          >
            <div className="stat-value">{stats.open}</div>
            <div className="stat-label">Open Tickets</div>
            <div className="stat-subtext">Needs attention</div>
          </div>

          <div
            className="stat-card"
            style={{ "--stat-color": "var(--urgency-high)" }}
          >
            <div className="stat-value">{stats.highPriority}</div>
            <div className="stat-label">High Priority</div>
            <div className="stat-subtext">Urgent</div>
          </div>

          <div
            className="stat-card"
            style={{ "--stat-color": "var(--status-closed)" }}
          >
            <div className="stat-value">{stats.byStatus.closed}</div>
            <div className="stat-label">Closed</div>
            <div className="stat-subtext">Resolved</div>
          </div>
        </div>

        {/* ========== STATUS DISTRIBUTION ========== */}
        <section className="card mb-xl">
          <h3 className="card-title mb-sm">Status Distribution</h3>

          <div className="status-bar">
            {stats.total > 0 && (
              <>
                <div
                  className="segment"
                  style={{
                    width: `${(stats.byStatus.new / stats.total) * 100}%`,
                    background: "var(--status-new)"
                  }}
                />
                <div
                  className="segment"
                  style={{
                    width: `${(stats.byStatus.assigned / stats.total) * 100}%`,
                    background: "var(--status-assigned)"
                  }}
                />
                <div
                  className="segment"
                  style={{
                    width: `${(stats.byStatus.pending / stats.total) * 100}%`,
                    background: "var(--status-pending)"
                  }}
                />
                <div
                  className="segment"
                  style={{
                    width: `${(stats.byStatus.closed / stats.total) * 100}%`,
                    background: "var(--status-closed)"
                  }}
                />
              </>
            )}
          </div>

          <div className="status-legend">
            <div className="legend-item" onClick={() => filterByStatus("new")}>
              <span className="legend-dot" style={{ background: "var(--status-new)" }} />
              <span>New <b>{stats.byStatus.new}</b></span>
            </div>
            <div className="legend-item" onClick={() => filterByStatus("assigned")}>
              <span className="legend-dot" style={{ background: "var(--status-assigned)" }} />
              <span>Assigned <b>{stats.byStatus.assigned}</b></span>
            </div>
            <div className="legend-item" onClick={() => filterByStatus("pending")}>
              <span className="legend-dot" style={{ background: "var(--status-pending)" }} />
              <span>Pending <b>{stats.byStatus.pending}</b></span>
            </div>
            <div className="legend-item" onClick={() => filterByStatus("closed")}>
              <span className="legend-dot" style={{ background: "var(--status-closed)" }} />
              <span>Closed <b>{stats.byStatus.closed}</b></span>
            </div>
          </div>
        </section>

        {/* ========== FILTER BAR ========== */}
        <div className="filter-bar">
          <button className="btn ghost" onClick={loadTickets}>
            Refresh
          </button>
          <button className="btn ghost" onClick={() => setAdvOpen(true)}>
            Advanced Filter
          </button>
        </div>

        {err && <div className="error">{err}</div>}

        <section className="card mb-lg">
          <div className="toolbar-row">
            <div className="flex items-center gap-md">
              <label className="label" style={{ margin: 0 }}>Status</label>
              <select
                className="select"
                style={{ width: "auto", minWidth: "140px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <input
              className="input"
              style={{ flex: "1 1 280px" }}
              placeholder="Search: id, submitter, description, category..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="pill-row" style={{ marginTop: "var(--space-3)" }}>
            <span className="pill">
              <b>Total:</b> {tickets.length}
            </span>
            <span className="pill">
              <b>Shown:</b> {filtered.length}
            </span>
            <span className="pill">
              <b>Selected:</b> {selected.size}
            </span>
            <span
              className="pill"
              style={{
                borderColor: adv ? "var(--accent-primary)" : undefined,
                color: adv ? "var(--accent-primary)" : undefined,
              }}
            >
              <b>Filter:</b> {adv ? "ON" : "OFF"}
            </span>
          </div>
        </section>

        <section className="card">
          <div className="table-wrapper" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      className="checkbox"
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                    />
                  </th>

                  <th>
                    <button className="th-btn" onClick={() => toggleSort("id")}>
                      # <span className="sort-icon">{sortIcon("id")}</span>
                    </button>
                  </th>

                  <th>
                    <button className="th-btn" onClick={() => toggleSort("status")}>
                      Status <span className="sort-icon">{sortIcon("status")}</span>
                    </button>
                  </th>

                  <th>
                    <button className="th-btn" onClick={() => toggleSort("created_by_id")}>
                      Submitter <span className="sort-icon">{sortIcon("created_by_id")}</span>
                    </button>
                  </th>

                  <th className="col-hide-mobile">
                    <button className="th-btn" onClick={() => toggleSort("description")}>
                      Description <span className="sort-icon">{sortIcon("description")}</span>
                    </button>
                  </th>

                  <th className="col-hide-mobile">
                    <button className="th-btn" onClick={() => toggleSort("request_type")}>
                      Category <span className="sort-icon">{sortIcon("request_type")}</span>
                    </button>
                  </th>

                  <th className="col-hide-mobile">
                    <button className="th-btn" onClick={() => toggleSort("operator_id")}>
                      Assigned <span className="sort-icon">{sortIcon("operator_id")}</span>
                    </button>
                  </th>

                  <th>
                    <button className="th-btn" onClick={() => toggleSort("urgency")}>
                      Urgency <span className="sort-icon">{sortIcon("urgency")}</span>
                    </button>
                  </th>

                  <th style={{ width: 100 }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="meta loading">Loading tickets...</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="meta">No matching tickets found.</div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((t) => (
                    <tr
                      key={t.id}
                      className={`${t.urgency === "high" ? "high-priority" : ""} ${selected.has(t.id) ? "selected" : ""}`}
                    >
                      <td>
                        <input
                          className="checkbox"
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleOne(t.id)}
                        />
                      </td>

                      <td>
                        <b style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>#{t.id}</b>
                      </td>
                      <td>
                        <Badge status={t.status}>{t.status}</Badge>
                      </td>
                      <td>{nameForUserId(t.created_by_id)}</td>
                      <td className="col-hide-mobile" title={t.description ?? ""}>
                        {truncateText(t.description, 30)}
                      </td>
                      <td className="col-hide-mobile">{t.request_type}</td>
                      <td className="col-hide-mobile">{nameForOperatorId(t.operator_id)}</td>
                      <td>
                        <Badge urgency={t.urgency}>{t.urgency}</Badge>
                      </td>

                      <td>
                        <Link className="btn ghost sm" to={`/admin/tickets/${t.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="toolbar-row" style={{ marginTop: "var(--space-4)", justifyContent: "space-between" }}>
            <div className="meta">
              Page <b>{pageSafe}</b> of <b>{totalPages}</b>
            </div>

            <div className="flex gap-sm">
              <button
                className="btn ghost"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn ghost"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </Layout>

      <AdvancedFilterModal
        open={advOpen}
        value={adv}
        onClose={() => setAdvOpen(false)}
        onApply={(ast) => setAdv(ast)}
        token={token}
        operators={operators}
      />
    </>
  );
}
