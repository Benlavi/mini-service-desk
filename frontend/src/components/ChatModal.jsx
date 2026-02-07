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
      if (response.ticket) {
        onTicketCreated?.(response.ticket);
      }
      if (response.chat_ended) {
        setTimeout(() => {
          setMessages([]);
          setError(null);
          onClose();
        }, 1000);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setMessages([]);
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
      </div>
    </div>
  );
}
