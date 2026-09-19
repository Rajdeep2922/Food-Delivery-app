import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });
      toast.success('Account created successfully!', {
        style: { borderRadius: '9999px', fontWeight: 500 },
      });
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page page-enter">
      <div style={{ width: '100%', maxWidth: 540, marginBottom: 12 }}>
        <BackButton label="Back to Home" to="/" />
      </div>
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <Link to="/" className="auth-logo">
            <span>🍴</span>
            <span>ForkLane</span>
          </Link>
          <h1 className="heading-xl">Create account</h1>
          <p className="caption text-mute">Join ForkLane and start ordering delicious food.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full name *</label>
              <input id="reg-name" type="text" name="name" value={form.name}
                onChange={handleChange} className="form-input" placeholder="John Doe"
                autoComplete="name" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone number</label>
              <input id="reg-phone" type="tel" name="phone" value={form.phone}
                onChange={handleChange} className="form-input" placeholder="+91 98765 43210"
                autoComplete="tel" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address *</label>
            <input id="reg-email" type="email" name="email" value={form.email}
              onChange={handleChange} className="form-input" placeholder="you@example.com"
              autoComplete="email" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-address">Delivery address</label>
            <input id="reg-address" type="text" name="address" value={form.address}
              onChange={handleChange} className="form-input"
              placeholder="Your default delivery address"
              autoComplete="street-address" />
          </div>

          <div className="auth-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password *</label>
              <input id="reg-password" type="password" name="password" value={form.password}
                onChange={handleChange} className="form-input" placeholder="At least 6 characters"
                autoComplete="new-password" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm password *</label>
              <input id="reg-confirm" type="password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} className="form-input" placeholder="Repeat password"
                autoComplete="new-password" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="btn-spinner" /> Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer caption">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
