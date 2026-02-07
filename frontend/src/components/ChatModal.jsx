import { useState, useRef, useEffect } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ChatModal({ open, onClose, onTicketCreated }) {
  const { token } = useAuth();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hi! I'm your IT support assistant. Tell me about the issue you're experiencing, and I'll help you create a support ticket.\n\nFor example:\n• \"My screen keeps flickering\"\n• \"I need Excel installed\"\n• \"The printer isn't working\"",
      }]);
    }
  }, [open]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setTicketData(null);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await apiFetch("/api/chat/message", {
        token,
        method: "POST",
        json: {
          messages: messages.filter(m => m.role !== "system"),
          message: userMessage,
        },
      });

      setMessages(prev => [...prev, { role: "assistant", content: response.response }]);
      if (response.ticket_data) {
        setTicketData(response.ticket_data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket() {
    if (!ticketData) return;
    setCreating(true);
    setError(null);

    try {
      const ticket = await apiFetch("/api/chat/create-ticket", {
        token,
        method: "POST",
        json: ticketData,
      });

      setMessages([]);
      setTicketData(null);
      onTicketCreated?.(ticket);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function handleClose() {
    setMessages([]);
    setTicketData(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600, height: "80vh" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">AI Support Chat</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        {error && <div className="error" style={{ margin: "0 var(--space-4)" }}>{error}</div>}

        <div className="chat-container">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="chat-typing">
              <div className="chat-typing-dots">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {ticketData && (
          <div className="chat-ticket-preview">
            <div className="chat-ticket-preview-title">
              Ready to create ticket:
            </div>
            <div className="chat-ticket-preview-details">
              <div><b>Description:</b> {ticketData.description}</div>
              <div><b>Urgency:</b> {ticketData.urgency}</div>
              <div><b>Category:</b> {ticketData.request_type}</div>
            </div>
            <button
              className="btn primary w-full"
              onClick={handleCreateTicket}
              disabled={creating}
              style={{ marginTop: "var(--space-3)" }}
            >
              {creating ? "Creating..." : "Create Ticket"}
            </button>
            <button
              className="btn ghost w-full"
              onClick={() => { setTicketData(null); setMessages([]); }}
              style={{ marginTop: "var(--space-2)" }}
            >
              Start Over
            </button>
          </div>
        )}

        {ticketData ? (
          <div className="chat-input-area disabled">
            Create the ticket above or start over
          </div>
        ) : (
          <form onSubmit={handleSend} className="chat-input-area">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your issue..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              className="btn primary"
              type="submit"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
