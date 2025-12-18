import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TicketsDetailsPage() {
  const { id } = useParams();
  const { token } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const t = await apiFetch(`/api/tickets/${id}`, { token });
      setTicket(t);

      // IMPORTANT: this path must match your backend
      // If your backend is different, change only this line.
      const c = await apiFetch(`/api/tickets/${id}/comments`, { token });
      setComments(c);
    } catch (e) {
      setErr(e.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setErr("");

    try {
      // IMPORTANT: this path must match your backend
      await apiFetch(`/api/tickets/${id}/comments`, {
        token,
        method: "POST",
        json: { body: newComment },
      });

      setNewComment("");
      await loadAll();
    } catch (e) {
      setErr(e.message || "Failed to add comment");
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Error: {err}</div>;
  if (!ticket) return <div style={{ padding: 16 }}>Ticket not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <Link to="/tickets">← Back to tickets</Link>

      <h2 style={{ marginTop: 12 }}>
        Ticket #{ticket.id}: {ticket.subject}
      </h2>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div><b>Status:</b> {ticket.status}</div>
        <div><b>Urgency:</b> {ticket.urgency}</div>
        <div><b>Type:</b> {ticket.request_type}</div>
        <div style={{ marginTop: 10 }}>
          <b>Body:</b>
          <div style={{ whiteSpace: "pre-wrap" }}>{ticket.body}</div>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Comments</h3>

      {comments.length === 0 ? (
        <div>No comments yet.</div>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {comments.map((c) => (
            <li key={c.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                by <b>{c.author_name ?? c.author_id ?? "Unknown"}</b>{" "}
                {c.created_at ? `• ${c.created_at}` : ""}
              </div>
              <div>{c.body}</div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submitComment} style={{ marginTop: 16 }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          placeholder="Write a comment…"
          style={{ width: "100%", padding: 10 }}
        />
        <button type="submit" disabled={!newComment.trim()} style={{ marginTop: 8 }}>
          Add comment
        </button>
      </form>
    </div>
  );
}