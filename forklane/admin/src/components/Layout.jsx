import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="7" height="7" x="3" y="3"/><rect width="7" height="7" x="14" y="3"/><rect width="7" height="7" x="14" y="14"/><rect width="7" height="7" x="3" y="14"/></svg>
    ),
  },
  {
    to: '/products',
    label: 'Products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect width="6" height="4" x="9" y="3" rx="2"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
    ),
  },
];

const AdminLayout = ({ children, title }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__logo">
          <span>🍴</span>
          <div>
            <div>ForkLane</div>
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.5, letterSpacing: '0.08em' }}>ADMIN</div>
          </div>
        </div>

        <div className="admin-sidebar__label">Management</div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="admin-nav-link__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {admin && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>Signed in as</p>
            <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{admin.name}</p>
          </div>
        )}

        <div className="admin-sidebar__signout">
          <button className="admin-signout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-topbar__title">{title}</h1>
          <span className="status-chip status-delivered" style={{ fontSize: 11 }}>Admin</span>
        </header>
        <div className="admin-page">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
