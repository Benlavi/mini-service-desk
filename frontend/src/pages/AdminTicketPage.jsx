import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import { Badge, Avatar } from "../components/ui";
import { truncateText, formatDate } from "../utils";

export default function AdminTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [submitterName, setSubmitterName] = useState("—");

  const [statusVal, setStatusVal] = useState("new");
  const [urgencyVal, setUrgencyVal] = useState("normal");
  const [operatorIdVal, setOperatorIdVal] = useState("");

  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function loadAll() {
    setErr(null);
    setLoading(true);
    try {
      const [t, c, a] = await Promise.all([
        apiFetch(`/api/tickets/${id}`, { token }),
        apiFetch(`/api/tickets/${id}/comments`, { token }),
        apiFetch(`/api/users/operators`, { token }),
      ]);

      setTicket(t);
      setComments(c);
      setAdmins(a);

      setStatusVal(t.status ?? "new");
      setUrgencyVal(t.urgency ?? "normal");
      setOperatorIdVal(t.operator_id == null ? "" : String(t.operator_id));

      try {
        const u = await apiFetch(`/api/users/${t.created_by_id}`, { token });
        setSubmitterName(u?.name || u?.email || "—");
      } catch {
        setSubmitterName("—");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) navigate("/login");
    else loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const operatorLabel = useMemo(() => {
    if (!ticket?.operator_id) return "—";
    const op = admins.find((u) => u.id === ticket.operator_id);
    return op ? op.name : "—";
  }, [ticket, admins]);


  function onChangeStatus(nextStatus) {
    setStatusVal(nextStatus);

    // if status is new => force unassigned (backend rule)
    if (nextStatus === "new") {
      setOperatorIdVal("");
    }
  }

  function onChangeOperator(nextOperatorId) {
    setOperatorIdVal(nextOperatorId);

    if (nextOperatorId === "") {
      setStatusVal("new");
      return;
    }

    // if operator assigned while status is new => auto move to assigned
    if (statusVal === "new") {
      setStatusVal("assigned");
    }
  }

  async function saveQuickEdit(e) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    const operatorToSend = operatorIdVal === "" ? null : Number(operatorIdVal);
    const statusToSend =
      operatorToSend != null && statusVal === "new" ? "assigned" : statusVal;

    const operatorFinal = statusToSend === "new" ? null : operatorToSend;

    try {
      await apiFetch(`/api/tickets/${id}`, {
        token,
        method: "PATCH",
        json: {
          status: statusToSend,
          urgency: urgencyVal,
          operator_id: operatorFinal,
        },
      });
      await loadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setErr(null);

    try {
      await apiFetch(`/api/tickets/${id}/comments`, {
        token,
        method: "POST",
        json: { body: newComment },
      });
      setNewComment("");
      await loadAll();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (loading) {
    return (
      <Layout title="Loading..." subtitle="">
        <div className="card">
          <div className="meta loading">Loading ticket details...</div>
        </div>
      </Layout>
    );
  }

  if (err) {
    return (
      <Layout title="Error" subtitle="">
        <div className="error">Error: {err}</div>
        <div className="breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Error</span>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout title="Not Found" subtitle="">
        <div className="error">Ticket not found</div>
      </Layout>
    );
  }

  return (
    <>
      <Layout title={`Ticket #${ticket.id}`} subtitle={truncateText(ticket.description, 60)}>
        <div className="breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Ticket #{ticket.id}</span>
        </div>

        <div className="grid-2">
          {/* Ticket Details & Edit */}
          <section className="card">
            <h3 className="card-title mb-lg">Ticket Details</h3>

            <div className="ticket-detail-meta">
              <div className="ticket-detail-meta-item">
                <span className="ticket-detail-meta-label">Status</span>
                <Badge status={ticket.status}>{ticket.status}</Badge>
              </div>
              <div className="ticket-detail-meta-item">
                <span className="ticket-detail-meta-label">Urgency</span>
                <Badge urgency={ticket.urgency}>{ticket.urgency}</Badge>
              </div>
              <div className="ticket-detail-meta-item">
                <span className="ticket-detail-meta-label">Category</span>
                <Badge>{ticket.request_type}</Badge>
              </div>
              <div className="ticket-detail-meta-item">
                <span className="ticket-detail-meta-label">Assigned to</span>
                <Badge>{operatorLabel}</Badge>
              </div>
              <div className="ticket-detail-meta-item">
                <span className="ticket-detail-meta-label">Created by</span>
                <Badge>{submitterName}</Badge>
              </div>
            </div>

            <div className="ticket-description mb-xl">
              <div className="label">Description</div>
              <div className="ticket-description-text">
                {ticket.description}
              </div>
            </div>

            <div className="ticket-edit-section">
              <form onSubmit={saveQuickEdit} className="form">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="label">Status</label>
                    <select
                      className="select"
                      value={statusVal}
                      onChange={(e) => onChangeStatus(e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Urgency</label>
                    <select
                      className="select"
                      value={urgencyVal}
                      onChange={(e) => setUrgencyVal(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Operator</label>
                    <select
                      className="select"
                      value={operatorIdVal}
                      onChange={(e) => onChangeOperator(e.target.value)}
                    >
                      <option value="">— Unassigned —</option>
                      {admins.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {a.name}
                        </option>
                      ))}
                    </select>

                    {statusVal === "new" && (
                      <div className="meta" style={{ marginTop: "var(--space-2)" }}>
                        Note: Assigning an operator will automatically move status to <b>assigned</b>.
                      </div>
                    )}
                  </div>
                </div>

                <button className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </section>

          {/* Comments Section */}
          <section className="card">
            <div className="spread mb-lg">
              <h3 className="card-title">Comments</h3>
              <Badge>{comments.length}</Badge>
            </div>

            {comments.length === 0 ? (
              <div className="meta mb-xl">
                No comments yet. Be the first to add one!
              </div>
            ) : (
              <ul className="comment-list mb-xl">
                {comments.map((c) => (
                  <li key={c.id} className="comment-item">
                    <div className="spread mb-sm">
                      <div className="flex items-center gap-sm">
                        <Avatar name={c.author_name} size="sm" />
                        <span className="font-semibold" style={{ color: "var(--accent-primary)" }}>
                          {c.author_name ?? `User #${c.author_id}`}
                        </span>
                      </div>
                      <span className="text-sm text-muted">{formatDate(c.created_at)}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {c.body}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submitComment}>
              <label className="label mb-sm">Add Admin Comment</label>
              <div className="comment-composer">
                <textarea
                  className="textarea"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  placeholder="Write your comment..."
                />
                <div className="comment-composer-footer">
                  <button className="btn primary" disabled={!newComment}>
                    Add Comment
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </Layout>
    </>
  );
}
