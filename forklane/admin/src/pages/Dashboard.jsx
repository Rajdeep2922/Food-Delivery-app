import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import AdminLayout from '../components/Layout';

const STAT_CONFIG = [
  { key: 'productCount', label: 'Total Products', icon: '📦' },
  { key: 'userCount', label: 'Registered Users', icon: '👥' },
  { key: 'totalOrders', label: 'Total Orders', icon: '📋' },
  { key: 'inProgressOrders', label: 'In Progress', icon: '⚡' },
  { key: 'deliveredOrders', label: 'Delivered', icon: '✅' },
  { key: 'cancelledOrders', label: 'Cancelled', icon: '❌' },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await dashboardAPI.getStats();
        setStats(data.stats);
      } catch {
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : error ? (
        <div style={{ color: 'var(--sale)', padding: 24 }}>{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            {STAT_CONFIG.map(({ key, label, icon }) => (
              <div key={key} className="stat-block">
                <div className="stat-block__label">{icon} {label}</div>
                <div className="stat-block__value">{stats?.[key] ?? 0}</div>
              </div>
            ))}
            <div className="stat-block">
              <div className="stat-block__label">💰 Revenue</div>
              <div className="stat-block__value" style={{ fontSize: 22 }}>
                ₹{(stats?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="stat-block__sub">From delivered orders</div>
            </div>
          </div>

          {/* Quick summary */}
          <div className="admin-card" style={{ marginTop: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--stone)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Order Breakdown
            </h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Completion Rate', value: stats?.totalOrders ? `${Math.round((stats.deliveredOrders / stats.totalOrders) * 100)}%` : '—' },
                { label: 'Cancellation Rate', value: stats?.totalOrders ? `${Math.round((stats.cancelledOrders / stats.totalOrders) * 100)}%` : '—' },
                { label: 'Avg Order Value', value: stats?.deliveredOrders ? `₹${Math.round(stats.revenue / stats.deliveredOrders)}` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
