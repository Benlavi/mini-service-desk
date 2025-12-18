import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

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
          // urgency optional (your backend default exists)
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
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Tickets</h1>
        <button onClick={onLogout}>Logout</button>
      </div>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Create Ticket</h2>
          <form onSubmit={createTicket} style={{ display: "grid", gap: 10 }}>
            <label>
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
            </label>

            <label>
              Body
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ width: "100%", padding: 10, marginTop: 6 }} />
            </label>

            <label>
              Request type
              <select value={requestType} onChange={(e) => setRequestType(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}>
                <option value="it">IT</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="access">Access</option>
                <option value="other">Other</option>
              </select>
            </label>

            <button disabled={!subject || !body}>Open ticket</button>
          </form>
        </section>

        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>My tickets / All tickets</h2>

          {loading ? (
            <div>Loading...</div>
          ) : tickets.length === 0 ? (
            <div>No tickets yet.</div>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {tickets.map((t) => (
                <li key={t.id} style={{ marginBottom: 10 }}>
                  <div>
                    <b>#{t.id}</b> {t.subject}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    status: {t.status} | urgency: {t.urgency} | type: {t.request_type}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}