import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import OrderTracker from '../components/OrderTracker';
import Loading from '../components/Loading';
import './OrderDetails.css';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await orderAPI.getById(id);
        setOrder(data.order);
      } catch {
        setError('Order not found');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Loading fullPage />;

  if (error || !order) {
    return (
      <main className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p className="heading-lg">Order not found</p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: 24 }}>My Orders</Link>
      </main>
    );
  }

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="order-details-page page-enter">
      <div className="container">
        {/* Back link */}
        <Link to="/orders" className="order-details__back caption text-mute">
          ← Back to Orders
        </Link>

        <div className="order-details__header">
          <div>
            <h1 className="heading-xl">Order Details</h1>
            <p className="caption text-mute">Order #{order._id.slice(-12).toUpperCase()}</p>
            <p className="caption text-mute">{date}</p>
          </div>
          <span className={`status-chip ${STATUS_CLASS[order.orderStatus]}`} style={{ fontSize: 14 }}>
            {STATUS_LABELS[order.orderStatus]}
          </span>
        </div>

        {/* Tracker */}
        <section className="order-details__section">
          <h2 className="order-details__section-title">Order Status</h2>
          <OrderTracker status={order.orderStatus} />

          {order.orderStatus === 'CANCELLED' && order.cancelReason && (
            <div className="order-details__cancel-reason">
              <strong>Cancellation reason:</strong> {order.cancelReason}
            </div>
          )}
        </section>

        <div className="order-details__layout">
          {/* Items */}
          <section className="order-details__section">
            <h2 className="order-details__section-title">Items Ordered</h2>
            <div className="order-details__items">
              {order.items.map((item, idx) => {
                const imageUrl = item.product?.image
                  ? item.product.image.startsWith('http')
                    ? item.product.image
                    : `${API_URL}${item.product.image}`
                  : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80';

                return (
                  <div key={idx} className="od-item">
                    <div className="od-item__img-wrap">
                      <img src={imageUrl} alt={item.name} className="od-item__img"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'; }}
                      />
                    </div>
                    <div className="od-item__info">
                      <p className="heading-sm">{item.name}</p>
                      <p className="caption text-mute">Qty: {item.quantity}</p>
                    </div>
                    <p className="od-item__price heading-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Info */}
          <aside className="order-details__info">
            <section className="order-details__section">
              <h2 className="order-details__section-title">Delivery Details</h2>
              <div className="info-grid">
                <span className="caption text-mute">Name</span>
                <span className="caption">{order.user?.name || 'N/A'}</span>
                <span className="caption text-mute">Phone</span>
                <span className="caption">{order.phone}</span>
                <span className="caption text-mute">Address</span>
                <span className="caption">{order.deliveryAddress}</span>
              </div>
            </section>

            <section className="order-details__section">
              <h2 className="order-details__section-title">Payment</h2>
              <div className="info-grid">
                <span className="caption text-mute">Method</span>
                <span className="caption">{order.paymentMethod}</span>
                <span className="caption text-mute">Status</span>
                <span className={`status-chip ${order.paymentStatus === 'PAID' ? 'status-paid' : order.paymentStatus === 'FAILED' ? 'status-cancelled' : 'status-pending'}`}>
                  {order.paymentStatus}
                </span>
                <span className="caption text-mute">Total</span>
                <span className="heading-sm">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrderDetails;
