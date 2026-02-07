import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { isValidEmail } from "../utils";

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const levels = [
    { label: "", color: "" },
    { label: "Weak", color: "var(--semantic-danger)" },
    { label: "Fair", color: "var(--semantic-warning)" },
    { label: "Fair", color: "var(--semantic-warning)" },
    { label: "Good", color: "var(--semantic-info)" },
    { label: "Strong", color: "var(--semantic-success)" },
  ];

  return { score, ...levels[score] };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate() {
    const errors = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.password = "Password must contain at least one special character (!@#$%^&*...)";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await apiFetch("/api/users/", {
        method: "POST",
        json: { name: fullName, email: email.trim(), password, is_admin: false },
      });

      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && password.trim() && confirmPassword.trim();

  return (
    <div className="auth-page split-screen">
      {/* Brand Panel - hidden on mobile */}
      <div className="auth-brand-panel">
        <h1 className="auth-brand-title">Join your team's service desk</h1>
        <p className="auth-brand-description">
          Create an account to submit tickets, track progress, and get support from your IT team.
        </p>
        <ul className="auth-brand-features">
          <li>Submit and track support requests</li>
          <li>Get AI-assisted ticket creation</li>
          <li>Real-time updates on your issues</li>
          <li>Comment and collaborate with admins</li>
        </ul>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">SD</div>
            <span className="auth-logo-text">Service Desk</span>
          </div>

          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Register to open and track tickets</p>

          {err && <div className="error">{err}</div>}

          <form onSubmit={onSubmit} className="form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="label">First Name</label>
                <input
                  className={`input ${fieldErrors.firstName ? 'error' : ''}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <div className="field-error">{fieldErrors.firstName}</div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Last Name</label>
                <input
                  className={`input ${fieldErrors.lastName ? 'error' : ''}`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <div className="field-error">{fieldErrors.lastName}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email</label>
              <input
                className={`input ${fieldErrors.email ? 'error' : ''}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
              />
              {fieldErrors.email && (
                <div className="field-error">{fieldErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                className={`input ${fieldErrors.password ? 'error' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, number, special"
              />
              {password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${(strength.score / 5) * 100}%`,
                        background: strength.color,
                      }}
                    />
                  </div>
                  <div className="password-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </div>
                </div>
              )}
              {fieldErrors.password && (
                <div className="field-error">{fieldErrors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Confirm Password</label>
              <input
                className={`input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
              {fieldErrors.confirmPassword && (
                <div className="field-error">{fieldErrors.confirmPassword}</div>
              )}
            </div>

            <button
              className="btn primary lg w-full"
              disabled={loading || !isFormValid}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
