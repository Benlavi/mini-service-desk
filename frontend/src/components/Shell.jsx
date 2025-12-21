import { useAuth } from "../auth/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Shell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login");
  }

  function goToUserView() {
    navigate("/tickets");
  }

  function goToAdminView() {
    navigate("/admin");
  }

  return (
    <>
      <div className="header">
        <div className="headerInner">
          <div className="brand">
            <Link to={user?.is_admin ? "/admin" : "/tickets"}>
              Mini Service Desk
            </Link>
            <span className="badge">{user?.is_admin ? "Admin" : "User"}</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Admin can switch between dashboards */}
            {user?.is_admin && (
              <>
                <button className="btn" type="button" onClick={goToUserView}>
                  User view
                </button>
                <button className="btn" type="button" onClick={goToAdminView}>
                  Admin view
                </button>
              </>
            )}

            {user && <span className="badge">{user.email}</span>}
            <button className="btn danger" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: 16 }}>
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="h2">{subtitle}</div>}
        </div>

        {children}
      </div>
    </>
  );
}