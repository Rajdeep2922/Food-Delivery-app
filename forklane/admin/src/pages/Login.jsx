import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const AdminLogin = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome, Admin!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span>🍴</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 18 }}>ForkLane</p>
            <p style={{ fontSize: 11, color: 'var(--stone)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Panel</p>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sign in to Admin</h1>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 24 }}>This panel is restricted to authorized admins only.</p>

        {error && (
          <div className="admin-login-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Email Address</label>
            <input id="admin-email" type="email" name="email" value={form.email}
              onChange={handleChange} className="form-input" placeholder="admin@forklane.com"
              autoComplete="email" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" name="password" value={form.password}
              onChange={handleChange} className="form-input" placeholder="Your admin password"
              autoComplete="current-password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 15 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
