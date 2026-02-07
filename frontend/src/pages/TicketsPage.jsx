import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import ChatModal from "../components/ChatModal.jsx";
import CreateTicketModal from "../components/CreateTicketModal.jsx";
import { Badge } from "../components/ui";
import { truncateText, getStatusClass, getUrgencyClass } from "../utils";

export default function TicketsPage() {
  const { token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  // Split tickets into active and closed
  const { activeTickets, closedTickets } = useMemo(() => {
    const active = tickets.filter(t => t.status !== "closed").sort((a, b) => b.id - a.id);
    const closed = tickets.filter(t => t.status === "closed").sort((a, b) => b.id - a.id);
    return { activeTickets: active, closedTickets: closed };
  }, [tickets]);

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

  function TicketRow({ ticket }) {
    return (
      <li className="ticket-item">
        <Link className="link" to={`/tickets/${ticket.id}`} title={ticket.description ?? ""}>
          <div className="ticket-item-header">
            <div className="ticket-item-content">
              <div className="ticket-item-body">
                <div className="ticket-item-title">
                  <span className="ticket-item-id">#{ticket.id}</span>
                  <span className="ticket-item-desc">
                    {truncateText(ticket.description, 35)}
                  </span>
                </div>
                <div className="ticket-item-meta">
                  <Badge urgency={ticket.urgency}>{ticket.urgency}</Badge>
                  <span className="ticket-item-separator">·</span>
                  <span>{ticket.request_type}</span>
                </div>
              </div>
            </div>
            <Badge status={ticket.status}>{ticket.status}</Badge>
          </div>
        </Link>
      </li>
    );
  }

  return (
    <>
      <Layout title="My Tickets" subtitle="Create and track your support requests">
        {/* Action Buttons */}
        <div className="page-actions">
          <button
            className="btn primary"
            onClick={() => setManualOpen(true)}
          >
            Create Ticket
          </button>
          <button
            className="btn info"
            onClick={() => setChatOpen(true)}
          >
            Create with AI
          </button>
        </div>

        {err && <div className="error">{err}</div>}

        {/* Active Tickets Section */}
        <section className="card mb-xl">
          <div className="spread mb-lg">
            <h3 className="card-title">Active Tickets</h3>
            <Badge variant="info">{activeTickets.length}</Badge>
          </div>

          {loading ? (
            <div className="meta loading" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
              Loading your tickets...
            </div>
          ) : activeTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No active tickets</div>
              <p className="empty-state-text">All caught up! Create a new ticket if you need help.</p>
            </div>
          ) : (
            <div className="ticket-list-scroll">
              <ul className="list">
                {activeTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} />
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Ticket History Section */}
        <section className="card">
          <div className="spread mb-lg">
            <h3 className="card-title">Ticket History</h3>
            <Badge variant="success">{closedTickets.length} closed</Badge>
          </div>

          {loading ? (
            <div className="meta loading" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
              Loading history...
            </div>
          ) : closedTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No closed tickets yet</div>
              <p className="empty-state-text">Closed tickets will appear here.</p>
            </div>
          ) : (
            <div className="ticket-list-scroll">
              <ul className="list">
                {closedTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} />
                ))}
              </ul>
            </div>
          )}
        </section>
      </Layout>

      {/* Modals */}
      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onTicketCreated={() => loadTickets()}
      />
      <CreateTicketModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onTicketCreated={() => loadTickets()}
      />
    </>
  );
}
