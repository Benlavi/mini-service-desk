import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import { Badge, Avatar } from "../components/ui";
import { truncateText, formatDate } from "../utils";

export default function TicketsDetailsPage() {
  const { id } = useParams();
  const { token } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const t = await apiFetch(`/api/tickets/${id}`, { token });
      const c = await apiFetch(`/api/tickets/${id}/comments`, { token });
      setTicket(t);
      setComments(c);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          <Link to="/tickets">Tickets</Link>
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
    <Layout title={`Ticket #${ticket.id}`} subtitle={truncateText(ticket.description, 60)}>
      <div className="breadcrumb">
        <Link to="/tickets">Tickets</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">#{ticket.id}</span>
      </div>

      <div className="grid-2">
        {/* Ticket Details Card */}
        <section className="card">
          <h2 className="card-title mb-lg">Ticket Details</h2>

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
          </div>

          <div className="ticket-description">
            <div className="label">Description</div>
            <div className="ticket-description-text">
              {ticket.description}
            </div>
          </div>
        </section>

        {/* Comments Card */}
        <section className="card">
          <div className="spread mb-lg">
            <h2 className="card-title">Comments</h2>
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

          <form onSubmit={addComment}>
            <label className="label mb-sm">Add a comment</label>
            <div className="comment-composer">
              <textarea
                className="textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                placeholder="Write your comment..."
              />
              <div className="comment-composer-footer">
                <button className="btn primary" disabled={!newComment || submitting}>
                  {submitting ? "Sending..." : "Add Comment"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}
