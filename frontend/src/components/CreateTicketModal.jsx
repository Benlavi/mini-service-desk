import { useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function CreateTicketModal({ open, onClose, onTicketCreated }) {
  const { token } = useAuth();

  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("software");
  const [urgency, setUrgency] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const ticket = await apiFetch("/api/tickets/", {
        token,
        method: "POST",
        json: {
          description: description.trim(),
          request_type: requestType,
          urgency,
        },
      });

      setDescription("");
      setRequestType("software");
      setUrgency("normal");
      onTicketCreated?.(ticket);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setDescription("");
    setRequestType("software");
    setUrgency("normal");
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Create New Ticket</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        {error && <div className="error" style={{ margin: "var(--space-4) var(--space-6) 0" }}>{error}</div>}

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your issue or request in detail..."
                autoFocus
              />
              <span className="text-sm text-muted">
                {description.length} characters
              </span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="label">Category</label>
                <select
                  className="select"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                >
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="environment">Environment</option>
                  <option value="logistics">Logistics</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Urgency</label>
                <select
                  className="select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={!description.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
