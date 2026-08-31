import { useState, useEffect } from 'react';
import { adminOrderAPI } from '../services/api';
import AdminLayout from '../components/Layout';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASS = {
  PLACED: 'status-placed',
  CONFIRMED: 'status-confirmed',
  PREPARING: 'status-preparing',
  OUT_FOR_DELIVERY: 'status-delivery',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

const NEXT_STATUS = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

const ALL_STATUSES = ['', 'PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await adminOrderAPI.getAll(params);
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleAdvance = async (order) => {
    if (!NEXT_STATUS[order.orderStatus]) return;
    setActionLoading(order._id);
    try {
      await adminOrderAPI.advanceStatus(order._id);
      toast.success(`Order advanced to ${STATUS_LABELS[NEXT_STATUS[order.orderStatus]]}`);
      fetchOrders();
      if (selectedOrder?._id === order._id) setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { toast.error('Cancellation reason is required'); return; }
    setActionLoading(cancelModal._id);
    try {
      const { data } = await adminOrderAPI.cancel(cancelModal._id, { cancelReason });
      toast.success('Order cancelled');
      if (data.refund) {
        if (data.refund.success) toast.success(`Stripe refund initiated (${data.refund.refundId})`);
        else toast.error(`Refund attempt failed: ${data.refund.error}`);
      }
      setCancelModal(null);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <AdminLayout title="Orders">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ALL_STATUSES.map((s) => (
          <button
            key={s || 'all'}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--mute)' }}>No orders found</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--stone)' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{order.user?.name || 'N/A'}</p>
                      <p style={{ fontSize: 11, color: 'var(--stone)' }}>{order.user?.email}</p>
                    </td>
                    <td>
                      <p style={{ fontSize: 12, color: 'var(--ash)' }}>
                        {order.items.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>₹{order.totalAmount.toFixed(0)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600 }}>{order.paymentMethod}</span>
                        <span className={`status-chip ${order.paymentStatus === 'PAID' ? 'status-paid' : order.paymentStatus === 'FAILED' ? 'status-cancelled' : 'status-pending'}`} style={{ fontSize: 10 }}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${STATUS_CLASS[order.orderStatus]}`}>
                        {STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--stone)', whiteSpace: 'nowrap' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedOrder(order)}
                          style={{ fontSize: 11 }}
                        >
                          View
                        </button>
                        {NEXT_STATUS[order.orderStatus] && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAdvance(order)}
                            disabled={actionLoading === order._id}
                            style={{ fontSize: 11 }}
                          >
                            → {STATUS_LABELS[NEXT_STATUS[order.orderStatus]]}
                          </button>
                        )}
                        {!['DELIVERED', 'CANCELLED'].includes(order.orderStatus) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => { setCancelModal(order); setCancelReason(''); }}
                            style={{ fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail panel */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Order #{selectedOrder._id.slice(-12).toUpperCase()}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className={`status-chip ${STATUS_CLASS[selectedOrder.orderStatus]}`}>{STATUS_LABELS[selectedOrder.orderStatus]}</span>
                <span className={`status-chip ${selectedOrder.paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}`}>{selectedOrder.paymentStatus}</span>
              </div>

              <div>
                <p style={{ fontSize: 11, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Customer</p>
                <p style={{ fontWeight: 600 }}>{selectedOrder.user?.name}</p>
                <p style={{ fontSize: 13, color: 'var(--mute)' }}>{selectedOrder.user?.email}</p>
                <p style={{ fontSize: 13, color: 'var(--mute)' }}>{selectedOrder.phone}</p>
                <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>{selectedOrder.deliveryAddress}</p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline-soft)', fontSize: 13 }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 15, fontWeight: 700 }}>
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount.toFixed(0)}</span>
                </div>
              </div>

              {selectedOrder.cancelReason && (
                <div style={{ background: '#fff5f5', padding: '12px 16px', borderLeft: '3px solid var(--sale)', fontSize: 13 }}>
                  <strong>Cancel reason:</strong> {selectedOrder.cancelReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="admin-modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Cancel Order</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setCancelModal(null)}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--ash)' }}>
                Cancelling order #{cancelModal._id.slice(-8).toUpperCase()} for <strong>{cancelModal.user?.name}</strong>.
                {cancelModal.paymentMethod === 'STRIPE' && cancelModal.paymentStatus === 'PAID' && (
                  <span style={{ color: 'var(--info)', display: 'block', marginTop: 6, fontSize: 13 }}>
                    ℹ️ A Stripe refund will be attempted automatically.
                  </span>
                )}
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  className="form-input form-textarea"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Item out of stock, Restaurant closed, etc."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-danger"
                  onClick={handleCancelSubmit}
                  disabled={!!actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button className="btn btn-secondary" onClick={() => setCancelModal(null)}>Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .admin-modal {
          background: var(--canvas);
          width: 100%;
          max-width: 660px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .admin-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--hairline-soft);
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Orders;
