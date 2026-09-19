import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import EmptyState from '../components/EmptyState';
import BackButton from '../components/BackButton';
import './Cart.css';

const Cart = () => {
  const { cart, cartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <main className="cart-page page-enter">
        <div className="container">
          <BackButton label="Back to Menu" to="/menu" />
          <h1 className="heading-xl" style={{ marginBottom: 40 }}>Your Cart</h1>
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Your cart is waiting for something delicious."
            actionLabel="Browse Menu"
            actionTo="/menu"
          />
        </div>
      </main>
    );
  }

  const DELIVERY_FEE = cartTotal >= 499 ? 0 : 49;

  return (
    <main className="cart-page page-enter">
      <div className="container">
        <BackButton label="Back to Menu" to="/menu" />
        <div className="cart-page__header">
          <h1 className="heading-xl">Your Cart</h1>
          <button className="btn btn-secondary btn-sm" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="cart-page__layout">
          {/* Items */}
          <div className="cart-page__items">
            {cart.map((item) => (
              <CartItem key={item._id} item={item} />
            ))}
          </div>

          {/* Summary */}
          <aside className="cart-page__summary">
            <h2 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Order Summary</h2>

            <div className="summary-lines">
              <div className="summary-line">
                <span className="caption text-mute">Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span className="caption">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span className="caption text-mute">Delivery fee</span>
                <span className="caption">{DELIVERY_FEE === 0 ? <span className="text-success">Free</span> : `₹${DELIVERY_FEE}`}</span>
              </div>
              {DELIVERY_FEE > 0 && (
                <p className="caption text-mute" style={{ marginTop: 4 }}>
                  Add ₹{(499 - cartTotal).toFixed(0)} more for free delivery
                </p>
              )}
              <hr className="divider" style={{ margin: '12px 0' }} />
              <div className="summary-line summary-line--total">
                <span className="heading-sm">Total</span>
                <span className="heading-sm">₹{(cartTotal + DELIVERY_FEE).toFixed(2)}</span>
              </div>
            </div>

            <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-3)' }}>
              Proceed to Checkout
            </Link>

            <p className="caption text-mute" style={{ textAlign: 'center', marginTop: 12 }}>
              Secure payments powered by Stripe
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
