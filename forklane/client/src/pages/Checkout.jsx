import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#111111',
      fontFamily: '"Inter", sans-serif',
      '::placeholder': { color: '#9e9ea0' },
    },
    invalid: { color: '#d30005' },
  },
};

// ── Inner checkout form (needs Stripe context) ──
const CheckoutForm = ({ form, cart, cartTotal }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const DELIVERY_FEE = cartTotal >= 499 ? 0 : 49;
  const total = cartTotal + DELIVERY_FEE;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.address) {
      toast.error('Please fill in all delivery details');
      return;
    }

    setLoading(true);
    setStripeError('');

    try {
      const orderPayload = {
        items: cart.map((item) => ({ product: item._id, quantity: item.quantity })),
        deliveryAddress: form.address,
        phone: form.phone,
        paymentMethod,
      };

      const { data } = await orderAPI.create(orderPayload);
      const order = data.order;

      if (paymentMethod === 'COD') {
        clearCart();
        toast.success('Order placed successfully!', {
          style: { borderRadius: '9999px', fontWeight: 500 },
        });
        navigate(`/orders/${order._id}`);
        return;
      }

      // ── Stripe flow ──
      if (!stripe || !elements) {
        throw new Error('Stripe not loaded');
      }

      const cardElement = elements.getElement(CardElement);
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeErr) {
        setStripeError(stripeErr.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Verify on server
        await orderAPI.confirmPayment(order._id);
        clearCart();
        toast.success('Order placed & payment confirmed!', {
          style: { borderRadius: '9999px', fontWeight: 500 },
        });
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Order failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      {/* Delivery info */}
      <section className="checkout-section">
        <h2 className="checkout-section__title">Delivery Information</h2>

        <div className="form-group">
          <label className="form-label" htmlFor="co-name">Full Name</label>
          <input id="co-name" type="text" value={form.name} readOnly className="form-input form-input--readonly" />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="co-phone">Phone Number</label>
          <input id="co-phone" type="tel" value={form.phone} readOnly className="form-input form-input--readonly" />
          {!form.phone && (
            <span className="form-error">Please add a phone number to your profile first</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="co-address">Delivery Address</label>
          <input id="co-address" type="text" value={form.address} readOnly className="form-input form-input--readonly" />
          {!form.address && (
            <span className="form-error">Please add a delivery address to your profile first</span>
          )}
        </div>
        <p className="caption text-mute">
          Update your contact details in <a href="/profile" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Profile Settings</a>
        </p>
      </section>

      {/* Payment method */}
      <section className="checkout-section">
        <h2 className="checkout-section__title">Payment Method</h2>

        <div className="payment-options">
          <label className={`payment-option${paymentMethod === 'COD' ? ' selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
              className="payment-option__radio"
            />
            <div className="payment-option__body">
              <span className="payment-option__icon">💵</span>
              <div>
                <p className="heading-sm">Cash on Delivery</p>
                <p className="caption text-mute">Pay when your food arrives</p>
              </div>
            </div>
          </label>

          <label className={`payment-option${paymentMethod === 'STRIPE' ? ' selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="STRIPE"
              checked={paymentMethod === 'STRIPE'}
              onChange={() => setPaymentMethod('STRIPE')}
              className="payment-option__radio"
            />
            <div className="payment-option__body">
              <span className="payment-option__icon">💳</span>
              <div>
                <p className="heading-sm">Card Payment</p>
                <p className="caption text-mute">Secure card payment via Stripe</p>
              </div>
            </div>
          </label>
        </div>

        {paymentMethod === 'STRIPE' && (
          <div className="stripe-card-wrap">
            <p className="caption text-mute" style={{ marginBottom: 12 }}>Enter your card details</p>
            <div className="stripe-card-element">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            {stripeError && (
              <p className="form-error" style={{ marginTop: 8 }}>{stripeError}</p>
            )}
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="checkout-section checkout-section--summary">
        <h2 className="checkout-section__title">Order Summary</h2>
        <div className="checkout-items">
          {cart.map((item) => (
            <div key={item._id} className="checkout-item caption">
              <span>{item.quantity}× {item.name}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr className="divider" style={{ margin: '12px 0' }} />
        <div className="checkout-item caption">
          <span className="text-mute">Delivery fee</span>
          <span>{DELIVERY_FEE === 0 ? <span className="text-success">Free</span> : `₹${DELIVERY_FEE}`}</span>
        </div>
        <div className="checkout-item checkout-item--total">
          <span className="heading-sm">Total</span>
          <span className="heading-sm">₹{total.toFixed(2)}</span>
        </div>
      </section>

      <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={loading}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="btn-spinner" />
            {paymentMethod === 'STRIPE' ? 'Processing payment...' : 'Placing order...'}
          </span>
        ) : (
          `${paymentMethod === 'STRIPE' ? 'Pay' : 'Place Order'} — ₹${total.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

// ── Main Checkout page ──
const Checkout = () => {
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();

  if (cart.length === 0) {
    return (
      <main className="checkout-page page-enter">
        <div className="container">
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Add some items before checking out."
            actionLabel="Browse Menu"
            actionTo="/menu"
          />
        </div>
      </main>
    );
  }

  const form = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  };

  return (
    <main className="checkout-page page-enter">
      <div className="container">
        <h1 className="heading-xl checkout-page__heading">Checkout</h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm form={form} cart={cart} cartTotal={cartTotal} />
        </Elements>
      </div>
    </main>
  );
};

export default Checkout;
