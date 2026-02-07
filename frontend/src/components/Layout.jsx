import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Avatar } from "./ui";
import { getInitials } from "../utils";

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownOpen && !e.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function onLogout() {
    logout();
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const navIcons = {
    Dashboard: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="5.5" height="5.5" rx="1" />
        <rect x="10.5" y="2" width="5.5" height="5.5" rx="1" />
        <rect x="2" y="10.5" width="5.5" height="5.5" rx="1" />
        <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" />
      </svg>
    ),
    "My Tickets": (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h12M3 9h8M3 13h10" />
      </svg>
    ),
    "All Tickets": (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h10v10H4zM7 4V2M11 4V2M4 8h10" />
      </svg>
    ),
  };

  const userNavItems = [
    { path: "/tickets", label: "My Tickets" },
  ];

  const adminNavItems = [
    { path: "/admin", label: "Dashboard" },
    { path: "/tickets", label: "My Tickets" },
  ];

  const navItems = user?.is_admin ? adminNavItems : userNavItems;

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">SD</div>
            <span className="sidebar-logo-text">Service Desk</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Navigation</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">{navIcons[item.label]}</span>
                <span className="sidebar-nav-text">{item.label}</span>
              </Link>
            ))}
          </div>

          {user?.is_admin && (
            <div className="sidebar-nav-section">
              <div className="sidebar-nav-label">Admin</div>
              <Link
                to="/admin"
                className={`sidebar-nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">{navIcons["All Tickets"]}</span>
                <span className="sidebar-nav-text">All Tickets</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <Avatar name={user?.name} email={user?.email} size="md" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || user?.email}</div>
              <div className="sidebar-user-role">{user?.is_admin ? "Admin" : "User"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Navigation Bar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Mobile menu button - proper 3-bar SVG */}
            <button
              className="topbar-icon-btn mobile-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 4.5h12M3 9h12M3 13.5h12" />
              </svg>
            </button>
          </div>

          <div className="topbar-center">
            <div className="topbar-search">
              <span className="topbar-search-icon" aria-label="Search"></span>
              <input
                type="text"
                className="topbar-search-input"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-right">
            <div className="dropdown">
              <div
                className="topbar-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={user?.email}
              >
                {getInitials(user?.email)}
              </div>

              <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">
                    {user?.name || "User"}
                  </div>
                  <div className="dropdown-user-email">
                    {user?.email}
                  </div>
                  <div className="dropdown-user-role">
                    <span className={`badge ${user?.is_admin ? 'primary' : ''}`}>
                      {user?.is_admin ? "Admin" : "User"}
                    </span>
                  </div>
                </div>
                <button className="dropdown-menu-item" onClick={() => navigate('/tickets')}>
                  My Tickets
                </button>
                {user?.is_admin && (
                  <button className="dropdown-menu-item" onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </button>
                )}
                <div className="dropdown-divider" />
                <button className="dropdown-menu-item danger" onClick={onLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="main-content">
          {(title || subtitle) && (
            <div className="page-header">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
