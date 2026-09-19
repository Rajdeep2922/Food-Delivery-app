import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);

  // Keep form in sync when user object updates
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Fetch fresh profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await authAPI.getProfile();
        if (data?.user) {
          updateUser(data.user);
        }
      } catch (err) {
        console.error('Failed to refresh profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated!', { style: { borderRadius: '9999px', fontWeight: 500 } });
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="profile-page page-enter">
      <div className="container">
        <div style={{ maxWidth: 640, margin: '0 auto 16px' }}>
          <BackButton label="Back" />
        </div>
        <div className="profile-card">
          <div className="profile-card__header">
            <div className="profile-avatar" aria-hidden="true">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="heading-xl">{user?.name}</h1>
              <p className="caption text-mute">{user?.email}</p>
              <span className="badge badge-new" style={{ marginTop: 6 }}>
                {user?.role === 'admin' ? 'Admin' : 'Customer'}
              </span>
            </div>
          </div>

          <hr className="divider" />

          {editing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <h2 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Edit Profile</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">Full Name</label>
                <input id="prof-name" type="text" name="name" value={form.name}
                  onChange={handleChange} className="form-input" required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-phone">Phone Number</label>
                <input id="prof-phone" type="tel" name="phone" value={form.phone}
                  onChange={handleChange} className="form-input" placeholder="+91 98765 43210" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-address">Delivery Address</label>
                <input id="prof-address" type="text" name="address" value={form.address}
                  onChange={handleChange} className="form-input" placeholder="Your delivery address" />
              </div>

              <div className="profile-form__actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <h2 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Account Details</h2>

              <div className="profile-info-list">
                {[
                  ['Name', user?.name],
                  ['Email', user?.email],
                  ['Phone', user?.phone || '—'],
                  ['Address', user?.address || '—'],
                  ['Member since', new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })],
                ].map(([label, value]) => (
                  <div key={label} className="profile-row">
                    <span className="caption text-mute profile-row__label">{label}</span>
                    <span className="profile-row__value">{value}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ marginTop: 'var(--space-4)' }}>
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Profile;
