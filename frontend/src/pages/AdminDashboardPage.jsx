import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Shell from "../components/shell.jsx";
import AdvancedFilterModal, { evaluateAdvanced } from "../components/AdvancedFilterModal.jsx";

const STATUS = ["new", "in_progress", "resolved", "closed"];

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // quick filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  // advanced filters
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState(null);

  // table controls
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("desc"); // asc/desc
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const pageSize = 12;

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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return tickets
      .filter((t) => {
        const okStatus = statusFilter === "all" || t.status === statusFilter;
        const okQ =
          !needle ||
          String(t.id).includes(needle) ||
          (t.subject ?? "").toLowerCase().includes(needle) ||
          (t.body ?? "").toLowerCase().includes(needle) ||
          (t.request_type ?? "").toLowerCase().includes(needle);
        const okAdv = evaluateAdvanced(t, adv);
        return okStatus && okQ && okAdv;
      })
      .sort((a, b) => {
        const av = a?.[sortKey];
        const bv = b?.[sortKey];
        const c = compare(av, bv);
        return sortDir === "asc" ? c : -c;
      });
  }, [tickets, statusFilter, q, adv, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  // reset page when filters change
  useEffect(() => setPage(1), [statusFilter, q, adv]);

  const allOnPageSelected = useMemo(() => {
    if (pageRows.length === 0) return false;
    return pageRows.every((t) => selected.has(t.id));
  }, [pageRows, selected]);

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((t) => next.delete(t.id));
      } else {
        pageRows.forEach((t) => next.add(t.id));
      }
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

  return (
    <>
      <Shell title="Admin Dashboard" subtitle="All tickets across the system">
        <div className="toolbarRow" style={{ marginBottom: 12 }}>
          

          <div style={{ flex: 1 }} />

          <button className="btn ghost" onClick={loadTickets}>Refresh</button>
          <button className="btn ghost" onClick={() => setAdvOpen(true)}>
            Advanced filter
          </button>
        </div>

        {err && <div className="error">{err}</div>}

        <section className="card" style={{ marginBottom: 12 }}>
          <div className="toolbarRow">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="label">Status</div>
              <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <input
              className="input"
              style={{ flex: "1 1 280px" }}
              placeholder="Search: id / subject / body / type…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="pillRow">
            <div className="pill"><b>Total:</b> {tickets.length}</div>
            <div className="pill"><b>Shown:</b> {filtered.length}</div>
            <div className="pill"><b>Selected:</b> {selected.size}</div>
            {adv ? <div className="pill"><b>Advanced:</b> ON</div> : <div className="pill"><b>Advanced:</b> OFF</div>}
          </div>
        </section>

        <section className="card">
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="th" style={{ width: 44 }}>
                    <input className="checkbox" type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("id")}>
                      # <span className="sortIcon">{sortIcon("id")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("status")}>
                      Status <span className="sortIcon">{sortIcon("status")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("created_by_id")}>
                      Submitter <span className="sortIcon">{sortIcon("created_by_id")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("subject")}>
                      Description <span className="sortIcon">{sortIcon("subject")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("request_type")}>
                      Sub-Category <span className="sortIcon">{sortIcon("request_type")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("operator_id")}>
                      Assigned to <span className="sortIcon">{sortIcon("operator_id")}</span>
                    </button>
                  </th>

                  <th className="th">
                    <button className="thBtn" onClick={() => toggleSort("urgency")}>
                      Urgency <span className="sortIcon">{sortIcon("urgency")}</span>
                    </button>
                  </th>

                  <th className="th" style={{ width: 120 }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr className="tr">
                    <td className="td" colSpan={9}>
                      <div className="meta">Loading…</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr className="tr">
                    <td className="td" colSpan={9}>
                      <div className="meta">No matching tickets.</div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((t) => (
                    <tr key={t.id} className="tr">
                      <td className="td">
                        <input
                          className="checkbox"
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleOne(t.id)}
                        />
                      </td>

                      <td className="td"><b>#{t.id}</b></td>
                      <td className="td">{t.status}</td>
                      <td className="td">{t.created_by_id}</td>
                      <td className="td">
                        <div style={{ fontWeight: 600 }}>{t.subject}</div>
                        <div className="meta" style={{ marginTop: 4 }}>
                          {(t.body ?? "").slice(0, 80)}{(t.body ?? "").length > 80 ? "…" : ""}
                        </div>
                      </td>
                      <td className="td">{t.request_type}</td>
                      <td className="td">{t.operator_id ?? "—"}</td>
                      <td className="td">{t.urgency}</td>

                      <td className="td">
                        <Link className="btn ghost" to={`/admin/tickets/${t.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="toolbarRow" style={{ marginTop: 12, justifyContent: "space-between" }}>
            <div className="meta">
              Page <b>{pageSafe}</b> / <b>{totalPages}</b>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn ghost" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <button className="btn ghost" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </button>
            </div>
          </div>
        </section>
      </Shell>

      <AdvancedFilterModal
        open={advOpen}
        value={adv}
        onClose={() => setAdvOpen(false)}
        onApply={(ast) => setAdv(ast)}
      />
    </>
  );
}