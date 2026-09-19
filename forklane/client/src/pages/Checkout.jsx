import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, authAPI } from '../services/api';
import EmptyState from '../components/EmptyState';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './Checkout.css';

const AVAILABLE_COUPONS = [
  {
    code: 'FEAST50',
    title: 'Flat 50% OFF up to ₹150',
    discountText: '50% OFF',
    minOrder: 0,
    calcDiscount: (cartTotal) => Math.min(Math.round(cartTotal * 0.5), 150),
    description: 'Save 50% on your food order with no minimum spend required.',
    tag: 'BEST VALUE',
  },
  {
    code: 'FORKLANE',
    title: 'Free Delivery (Save ₹49)',
    discountText: 'FREE DELIVERY',
    minOrder: 0,
    calcDiscount: (cartTotal, deliveryFee) => (deliveryFee > 0 ? deliveryFee : 49),
    description: 'Enjoy free doorstep delivery on your order.',
    tag: 'POPULAR',
  },
  {
    code: 'WELCOME20',
    title: '20% Instant Discount',
    discountText: '20% OFF',
    minOrder: 0,
    calcDiscount: (cartTotal) => Math.round(cartTotal * 0.2),
    description: 'Get 20% off across the menu with no minimum order.',
    tag: 'WELCOME',
  },
  {
    code: 'SWEET100',
    title: 'Flat ₹100 OFF on Orders Above ₹299',
    discountText: '₹100 OFF',
    minOrder: 299,
    calcDiscount: (cartTotal) => Math.min(100, cartTotal),
    description: 'Get an instant flat ₹100 discount on orders above ₹299.',
    tag: 'SPECIAL',
  },
];

// ── Inner checkout form ──
const CheckoutForm = ({ cart, cartTotal }) => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user, updateUser } = useAuth();

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');

  // Keep delivery info populated if user loads or updates
  useEffect(() => {
    if (user) {
      setDeliveryInfo((prev) => ({
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || '',
      }));
    }
  }, [user]);

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
  };

  const [loading, setLoading] = useState(false);

  const DELIVERY_FEE = cartTotal >= 499 ? 0 : 49;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (!appliedCoupon.minOrder || cartTotal >= appliedCoupon.minOrder) {
      discountAmount = appliedCoupon.calcDiscount(cartTotal, DELIVERY_FEE);
    }
  }

  const total = Math.max(0, cartTotal + DELIVERY_FEE - discountAmount);

  const handleApplyCoupon = (codeArg) => {
    const code = (typeof codeArg === 'string' && codeArg.trim() ? codeArg : couponCodeInput).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter or select a coupon code');
      return;
    }
    const found = AVAILABLE_COUPONS.find((c) => c.code === code);
    if (!found) {
      toast.error(`"${code}" is not a valid coupon code`);
      return;
    }
    if (found.minOrder > 0 && cartTotal < found.minOrder) {
      toast.error(
        `Add ₹${(found.minOrder - cartTotal).toFixed(0)} more to apply ${found.code} (Min order ₹${found.minOrder})`
      );
      return;
    }
    setAppliedCoupon(found);
    setCouponCodeInput('');
    const saved = found.calcDiscount(cartTotal, DELIVERY_FEE);
    toast.success(`Coupon ${found.code} applied! Saved ₹${saved}`, {
      style: { borderRadius: '9999px', fontWeight: 500 },
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast('Coupon removed', { icon: '🏷️' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = deliveryInfo.name.trim();
    const trimmedPhone = deliveryInfo.phone.trim();
    const trimmedAddress = deliveryInfo.address.trim();

    if (!trimmedName) {
      toast.error('Please enter your full name');
      return;
    }
    if (!trimmedPhone) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!trimmedAddress) {
      toast.error('Please enter your delivery address');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        items: cart.map((item) => ({ product: item._id, quantity: item.quantity })),
        deliveryAddress: trimmedAddress,
        phone: trimmedPhone,
        paymentMethod: 'COD',
        couponCode: appliedCoupon ? appliedCoupon.code : '',
      };

      // If user profile is missing phone or address, save it in background for convenience
      if (!user?.address || !user?.phone) {
        authAPI.updateProfile({
          name: trimmedName,
          phone: trimmedPhone,
          address: trimmedAddress,
        }).then(({ data }) => {
          if (data?.user) updateUser(data.user);
        }).catch(() => {});
      }

      const { data } = await orderAPI.create(orderPayload);
      const order = data.order;

      clearCart();
      toast.success('Order placed successfully!', {
        style: { borderRadius: '9999px', fontWeight: 500 },
      });
      navigate(`/orders/${order._id}`);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--hairline-soft)' }}>
          <h2 className="checkout-section__title" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>
            Delivery Information
          </h2>
          <Link to="/profile" className="caption" style={{ color: 'var(--ink)', textDecoration: 'underline', fontWeight: 500 }}>
            Profile Settings
          </Link>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="co-name">Full Name</label>
          <input
            id="co-name"
            name="name"
            type="text"
            value={deliveryInfo.name}
            onChange={handleDeliveryChange}
            className="form-input"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="co-phone">Phone Number</label>
          <input
            id="co-phone"
            name="phone"
            type="tel"
            value={deliveryInfo.phone}
            onChange={handleDeliveryChange}
            className="form-input"
            placeholder="e.g. 9876543210"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="co-address">Delivery Address</label>
          <textarea
            id="co-address"
            name="address"
            value={deliveryInfo.address}
            onChange={handleDeliveryChange}
            className="form-input form-textarea"
            rows={3}
            placeholder="Enter your complete delivery address (Street, Flat/House No., Area, City, Pincode)"
            required
          />
        </div>
      </section>

      {/* Coupons & Offers Section */}
      <section className="checkout-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--hairline-soft)' }}>
          <h2 className="checkout-section__title" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>
            Coupons & Offers
          </h2>
          <span className="caption text-mute">
            {AVAILABLE_COUPONS.length} active coupons
          </span>
        </div>

        {/* Manual Coupon Input Box */}
        <div className="checkout-coupon-form">
          <input
            type="text"
            className="form-input checkout-coupon-input"
            placeholder="ENTER COUPON CODE"
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCoupon();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleApplyCoupon()}
            disabled={!couponCodeInput.trim()}
            style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
          >
            Apply
          </button>
        </div>

        {appliedCoupon && (
          <div className="checkout-applied-coupon">
            <div className="checkout-applied-coupon__info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🎉</span>
                <span className="checkout-applied-coupon__title">
                  '{appliedCoupon.code}' Applied!
                </span>
              </div>
              <p className="caption text-mute" style={{ color: '#007d48', marginTop: 2 }}>
                You saved ₹{discountAmount.toFixed(2)} on this order
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRemoveCoupon}
              style={{ color: '#d30005', borderColor: '#ffcdd2' }}
            >
              Remove
            </button>
          </div>
        )}

        {/* Available coupons list */}
        <div className="checkout-coupons-list">
          {AVAILABLE_COUPONS.map((promo) => {
            const isApplied = appliedCoupon?.code === promo.code;
            const isEligible = !promo.minOrder || cartTotal >= promo.minOrder;

            return (
              <div
                key={promo.code}
                className={`checkout-coupon-card${isApplied ? ' applied' : ''}${!isEligible ? ' disabled' : ''}`}
                style={isApplied ? { borderColor: '#007d48', background: '#f6fbf7' } : {}}
              >
                <div className="checkout-coupon-card__left">
                  <div className="checkout-coupon-badge-row">
                    <span className="checkout-coupon-card__code font-mono">{promo.code}</span>
                    <span className="badge badge-sale" style={{ fontSize: 10, padding: '2px 6px' }}>
                      {promo.discountText}
                    </span>
                    {promo.minOrder === 0 && (
                      <span className="badge" style={{ fontSize: 10, padding: '2px 6px', background: '#e8f5e9', color: '#007d48' }}>
                        NO MIN ORDER
                      </span>
                    )}
                  </div>
                  <p className="checkout-coupon-card__title">{promo.title}</p>
                  <p className="checkout-coupon-card__desc">{promo.description}</p>
                </div>

                <div className="checkout-coupon-card__action">
                  {isApplied ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="caption" style={{ color: '#007d48', fontWeight: 700 }}>
                        APPLIED ✓
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleRemoveCoupon}
                        style={{ padding: '4px 10px', fontSize: 12, color: '#d30005', borderColor: '#ffcdd2' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : isEligible ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm checkout-coupon-apply-btn"
                      onClick={() => handleApplyCoupon(promo.code)}
                      style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600 }}
                    >
                      Apply
                    </button>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <span className="caption text-mute" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                        Add ₹{(promo.minOrder - cartTotal).toFixed(0)} more
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleApplyCoupon(promo.code)}
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment method */}
      <section className="checkout-section">
        <h2 className="checkout-section__title">Payment Method</h2>

        <div className="payment-options">
          <div className="payment-option selected" style={{ cursor: 'default' }}>
            <div className="payment-option__body">
              <span className="payment-option__icon">💵</span>
              <div>
                <p className="heading-sm">Cash on Delivery (COD)</p>
                <p className="caption text-mute">Pay via cash or UPI when your food arrives at your door</p>
              </div>
            </div>
          </div>
        </div>
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
          <span className="text-mute">Items total</span>
          <span>₹{cartTotal.toFixed(2)}</span>
        </div>
        <div className="checkout-item caption">
          <span className="text-mute">Delivery fee</span>
          <span>{DELIVERY_FEE === 0 ? <span className="text-success">Free</span> : `₹${DELIVERY_FEE}`}</span>
        </div>
        {discountAmount > 0 && (
          <div className="checkout-item caption" style={{ color: '#007d48', fontWeight: 600 }}>
            <span>Coupon Discount ({appliedCoupon?.code})</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="checkout-item checkout-item--total">
          <span className="heading-sm">Total</span>
          <span className="heading-sm">₹{total.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <p className="caption" style={{ color: '#007d48', marginTop: 4, textAlign: 'right', fontWeight: 600 }}>
            🎉 You saved ₹{discountAmount.toFixed(2)} on this order!
          </p>
        )}
      </section>

      <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={loading}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="btn-spinner" />
            Placing order...
          </span>
        ) : (
          `Place Order — ₹${total.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

// ── Main Checkout page ──
const Checkout = () => {
  const { cart, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <main className="checkout-page page-enter">
        <div className="container">
          <BackButton label="Back to Cart" to="/cart" />
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

  return (
    <main className="checkout-page page-enter">
      <div className="container">
        <BackButton label="Back to Cart" to="/cart" />
        <h1 className="heading-xl checkout-page__heading">Checkout</h1>
        <CheckoutForm cart={cart} cartTotal={cartTotal} />
      </div>
    </main>
  );
};

export default Checkout;
