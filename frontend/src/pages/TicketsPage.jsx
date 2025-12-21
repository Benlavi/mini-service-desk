import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import Shell from "../components/shell.jsx";

export default function TicketsPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [requestType, setRequestType] = useState("it");

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

  async function createTicket(e) {
    e.preventDefault();
    setErr(null);

    try {
      await apiFetch("/api/tickets/", {
        token,
        method: "POST",
        json: {
          subject,
          body,
          request_type: requestType,
        },
      });

      setSubject("");
      setBody("");
      setRequestType("it");
      await loadTickets();
    } catch (e) {
      setErr(e.message);
    }
  }

  function onLogout() {
    logout();
    navigate("/login");
  }

return (
  <>
    <Shell title="Tickets" subtitle="Create a ticket and track progress">
      {err && <div className="error">{err}</div>}

      <div className="grid">
        <section className="card">
          <h3 className="cardTitle">Create ticket</h3>

          <form onSubmit={createTicket} className="form">
            <div>
              <div className="label">Subject</div>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div>
              <div className="label">Body</div>
              <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
            </div>

            <div>
              <div className="label">Request type</div>
              <select className="select" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                <option value="it">IT</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="access">Access</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button className="btn primary" disabled={!subject || !body}>
              Open ticket
            </button>
          </form>
        </section>

        <section className="card">
          <h3 className="cardTitle">My tickets</h3>

          {loading ? (
            <div className="meta">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="meta">No tickets yet.</div>
          ) : (
            <ul className="list">
              {tickets.map((t) => (
                <li key={t.id} className="listItem">
                  <Link className="link" to={`/tickets/${t.id}`}>
                    <div>
                      <b>#{t.id}</b> — {t.subject}
                    </div>
                    <div className="meta">
                      status: {t.status} • urgency: {t.urgency} • type: {t.request_type}
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