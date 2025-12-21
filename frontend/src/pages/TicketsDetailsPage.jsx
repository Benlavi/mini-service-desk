import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Shell from "../components/shell.jsx";

export default function TicketsDetailsPage() {
  const { id } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [err, setErr] = useState(null);

  async function load() {
    setErr(null);
    try {
      const t = await apiFetch(`/api/tickets/${id}`, { token });
      const c = await apiFetch(`/api/tickets/${id}/comments`, { token });
      setTicket(t);
      setComments(c);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch(`/api/tickets/${id}/comments`, {
        token,
        method: "POST",
        json: { body: newComment },
      });
      setNewComment("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  function onLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (err) return <div className="container"><div className="error">Error: {err}</div></div>;
  if (!ticket) return <div className="container">Loading…</div>;

  return (
    <Shell
      title={`Ticket #${ticket.id}`}
      subtitle={ticket.subject}
      right={
        <button className="btn ghost" onClick={onLogout}>
          Logout
        </button>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Link className="navlink" to="/tickets">← Back</Link>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Ticket details</h2>

          <div className="row" style={{ flexWrap: "wrap", marginBottom: 10 }}>
            <span className="badge">status: {ticket.status}</span>
            <span className="badge">urgency: {ticket.urgency}</span>
            <span className="badge">type: {ticket.request_type}</span>
          </div>

          <div className="card solid" style={{ padding: 14 }}>
            <div className="label">Body</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{ticket.body}</div>
          </div>
        </section>

        <section className="card">
          <div className="spread">
            <h2 style={{ margin: 0 }}>Comments</h2>
            <span className="badge">{comments.length}</span>
          </div>

          {comments.length === 0 ? (
            <div className="meta" style={{ marginTop: 12 }}>No comments yet.</div>
          ) : (
            <ul className="list" style={{ marginTop: 12 }}>
              {comments.map((c) => (
                <li key={c.id} className="item">
                  <div className="spread">
                    <div style={{ fontWeight: 650 }}>author_id: {c.author_id}</div>
                    <div className="meta">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{c.body}</div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addComment} style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <textarea
              className="textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              placeholder="Write a comment…"
            />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" disabled={!newComment}>Add comment</button>
            </div>
          </form>
        </section>
      </div>
    </Shell>
  );
}