import { useCart } from '../context/CartContext';
import './CartItem.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const imageUrl = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${API_URL}${item.image}`
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

  return (
    <div className="cart-item">
      <div className="cart-item__image-wrap">
        <img
          src={imageUrl}
          alt={item.name}
          className="cart-item__image"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'; }}
        />
      </div>

      <div className="cart-item__info">
        <p className="caption text-mute">{item.category}</p>
        <h4 className="cart-item__name">{item.name}</h4>
        <p className="cart-item__unit-price caption">₹{item.price} each</p>
      </div>

      <div className="cart-item__controls">
        <div className="cart-item__qty">
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item._id, item.quantity - 1)}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
          </button>
          <span className="qty-value" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item._id, item.quantity + 1)}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          </button>
        </div>

        <span className="cart-item__total">₹{(item.price * item.quantity).toFixed(2)}</span>

        <button
          className="cart-item__remove"
          onClick={() => removeFromCart(item._id)}
          aria-label={`Remove ${item.name} from cart`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
