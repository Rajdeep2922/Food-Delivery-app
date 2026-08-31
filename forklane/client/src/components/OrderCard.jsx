import { Link } from 'react-router-dom';
import './OrderCard.css';

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

const PAYMENT_CLASS = {
  PAID: 'status-paid',
  PENDING: 'status-pending',
  FAILED: 'status-failed',
};

const OrderCard = ({ order }) => {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <article className="order-card">
      <div className="order-card__header">
        <div>
          <p className="caption text-mute">Order #{order._id.slice(-8).toUpperCase()}</p>
          <p className="caption text-mute">{date}</p>
        </div>
        <div className="order-card__status-row">
          <span className={`status-chip ${STATUS_CLASS[order.orderStatus]}`}>
            {STATUS_LABELS[order.orderStatus]}
          </span>
          <span className={`status-chip ${PAYMENT_CLASS[order.paymentStatus]}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="order-card__items">
        {order.items.slice(0, 3).map((item, idx) => (
          <span key={idx} className="order-card__item-name caption">
            {item.quantity}× {item.name}{idx < Math.min(order.items.length, 3) - 1 ? ',' : ''}
          </span>
        ))}
        {order.items.length > 3 && (
          <span className="caption text-mute">+{order.items.length - 3} more</span>
        )}
      </div>

      <div className="order-card__footer">
        <div>
          <p className="caption text-mute">{order.paymentMethod}</p>
          <p className="order-card__total">₹{order.totalAmount.toFixed(2)}</p>
        </div>
        <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
      </div>

      {order.orderStatus === 'CANCELLED' && order.cancelReason && (
        <div className="order-card__cancel-reason">
          <span className="caption text-mute">Reason: </span>
          <span className="caption">{order.cancelReason}</span>
        </div>
      )}
    </article>
  );
};

export default OrderCard;
