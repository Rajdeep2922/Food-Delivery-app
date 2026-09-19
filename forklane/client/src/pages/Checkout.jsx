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

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
      {/* ── Left Column: Checkout Details ── */}
      <div className="checkout-main">
        {/* 1. Delivery Information Card */}
        <section className="checkout-card">
          <div className="checkout-card__header">
            <div className="checkout-card__title-group">
              <span className="checkout-card__icon-badge">📍</span>
              <div>
                <h2 className="checkout-card__title">Delivery Information</h2>
                <p className="caption text-mute">Enter where you'd like your order delivered</p>
              </div>
            </div>
            <Link to="/profile" className="checkout-card__link">
              Profile Settings →
            </Link>
          </div>

          <div className="checkout-card__body">
            <div className="checkout-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="co-name">Full Name</label>
                <input
                  id="co-name"
                  name="name"
                  type="text"
                  value={deliveryInfo.name}
                  onChange={handleDeliveryChange}
                  className="form-input"
                  placeholder="e.g. John Doe"
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
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label" htmlFor="co-address">Delivery Address</label>
              <textarea
                id="co-address"
                name="address"
                value={deliveryInfo.address}
                onChange={handleDeliveryChange}
                className="form-input form-textarea"
                rows={3}
                placeholder="Flat / House No., Apartment, Street, Landmark, Area & City"
                required
              />
            </div>

            <div className="delivery-estimate-pill">
              <span className="delivery-estimate-pill__icon">⚡</span>
              <span>Estimated Delivery: <strong>25–35 minutes</strong> to your door</span>
            </div>
          </div>
        </section>

        {/* 2. Coupons & Offers Card */}
        <section className="checkout-card">
          <div className="checkout-card__header">
            <div className="checkout-card__title-group">
              <span className="checkout-card__icon-badge">🏷️</span>
              <div>
                <h2 className="checkout-card__title">Offers & Coupons</h2>
                <p className="caption text-mute">Apply a coupon code for instant savings</p>
              </div>
            </div>
            <span className="badge badge-sale">{AVAILABLE_COUPONS.length} AVAILABLE</span>
          </div>

          <div className="checkout-card__body">
            {/* Manual Coupon Input */}
            <div className="checkout-coupon-input-wrap">
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
                className="btn btn-secondary checkout-coupon-apply-action"
                onClick={() => handleApplyCoupon()}
                disabled={!couponCodeInput.trim()}
              >
                Apply Code
              </button>
            </div>

            {/* Applied Coupon Banner */}
            {appliedCoupon && (
              <div className="checkout-applied-banner">
                <div className="checkout-applied-banner__info">
                  <div className="checkout-applied-banner__title-row">
                    <span className="checkout-applied-banner__sparkle">🎉</span>
                    <span className="checkout-applied-banner__code">
                      '{appliedCoupon.code}' Applied!
                    </span>
                  </div>
                  <p className="caption checkout-applied-banner__sub">
                    You saved ₹{discountAmount.toFixed(2)} on this order
                  </p>
                </div>
                <button
                  type="button"
                  className="checkout-applied-banner__remove-btn"
                  onClick={handleRemoveCoupon}
                  aria-label="Remove coupon"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Available Coupons List */}
            <div className="checkout-coupons-grid">
              {AVAILABLE_COUPONS.map((promo) => {
                const isApplied = appliedCoupon?.code === promo.code;
                const isEligible = !promo.minOrder || cartTotal >= promo.minOrder;

                return (
                  <div
                    key={promo.code}
                    className={`coupon-ticket${isApplied ? ' coupon-ticket--applied' : ''}${!isEligible ? ' coupon-ticket--disabled' : ''}`}
                  >
                    <div className="coupon-ticket__left">
                      <div className="coupon-ticket__badges">
                        <span className="coupon-ticket__code font-mono">{promo.code}</span>
                        <span className="badge badge-sale">{promo.discountText}</span>
                        {promo.minOrder === 0 ? (
                          <span className="badge badge-pill-green">NO MIN ORDER</span>
                        ) : (
                          <span className="caption text-mute" style={{ fontSize: 11 }}>
                            Min: ₹{promo.minOrder}
                          </span>
                        )}
                      </div>
                      <p className="coupon-ticket__title">{promo.title}</p>
                      <p className="coupon-ticket__desc caption text-mute">{promo.description}</p>
                    </div>

                    <div className="coupon-ticket__right">
                      {isApplied ? (
                        <div className="coupon-ticket__applied-status">
                          <span className="coupon-ticket__check">APPLIED ✓</span>
                          <button
                            type="button"
                            className="coupon-ticket__remove-link"
                            onClick={handleRemoveCoupon}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-sm ${isEligible ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleApplyCoupon(promo.code)}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Payment Method Card */}
        <section className="checkout-card">
          <div className="checkout-card__header">
            <div className="checkout-card__title-group">
              <span className="checkout-card__icon-badge">💵</span>
              <div>
                <h2 className="checkout-card__title">Payment Method</h2>
                <p className="caption text-mute">Choose how you'd like to pay</p>
              </div>
            </div>
          </div>

          <div className="checkout-card__body">
            <div className="payment-method-card selected">
              <div className="payment-method-card__radio">
                <div className="payment-method-card__radio-dot" />
              </div>
              <div className="payment-method-card__icon">💵</div>
              <div className="payment-method-card__details">
                <div className="payment-method-card__header-row">
                  <span className="heading-sm">Cash on Delivery (COD)</span>
                  <span className="badge badge-new">Recommended</span>
                </div>
                <p className="caption text-mute">
                  Pay via Cash or any UPI App (GPay, PhonePe, Paytm) upon doorstep delivery.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Right Column: Sticky Summary ── */}
      <aside className="checkout-sidebar">
        <section className="checkout-card checkout-card--summary">
          <div className="checkout-card__header">
            <div className="checkout-card__title-group">
              <span className="checkout-card__icon-badge">🧾</span>
              <div>
                <h2 className="checkout-card__title">Order Summary</h2>
                <p className="caption text-mute">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your order</p>
              </div>
            </div>
          </div>

          <div className="checkout-card__body">
            {/* Items List */}
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item._id} className="summary-item">
                  <div className="summary-item__info">
                    <span className="summary-item__qty">{item.quantity}×</span>
                    <span className="summary-item__name">{item.name}</span>
                  </div>
                  <span className="summary-item__price">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            {/* Bill Details */}
            <div className="summary-bill">
              <div className="summary-row caption">
                <span className="text-mute">Items Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>

              <div className="summary-row caption">
                <span className="text-mute">Delivery Partner Fee</span>
                <span>
                  {DELIVERY_FEE === 0 ? (
                    <span className="text-success font-weight-bold">FREE</span>
                  ) : (
                    `₹${DELIVERY_FEE.toFixed(2)}`
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row caption summary-row--discount">
                  <span className="text-success font-weight-bold">
                    Coupon ({appliedCoupon?.code})
                  </span>
                  <span className="text-success font-weight-bold">
                    -₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <hr className="divider" style={{ margin: '14px 0' }} />

              <div className="summary-row summary-row--total">
                <div>
                  <span className="heading-sm">Grand Total</span>
                  <p className="caption text-mute" style={{ fontSize: 11, marginTop: 2 }}>Incl. taxes & charges</p>
                </div>
                <span className="summary-total-price">₹{total.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-savings-pill">
                  🎉 You are saving <strong>₹{discountAmount.toFixed(2)}</strong> on this order!
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg checkout-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="btn-spinner" />
                  Placing Order...
                </span>
              ) : (
                <span className="checkout-submit-btn__inner">
                  <span>Place Order</span>
                  <span className="checkout-submit-btn__sep">·</span>
                  <span>₹{total.toFixed(2)}</span>
                </span>
              )}
            </button>

            {/* Reassurance Badges */}
            <div className="checkout-assurances">
              <div className="checkout-assurance-item">
                <span>🛡️</span>
                <span className="caption text-mute">100% Secure & Contactless</span>
              </div>
              <div className="checkout-assurance-item">
                <span>📍</span>
                <span className="caption text-mute">Live Order Tracking</span>
              </div>
            </div>
          </div>
        </section>
      </aside>
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
        <div className="checkout-page__top-nav">
          <BackButton label="Back to Cart" to="/cart" />
        </div>
        <div className="checkout-page__header-row">
          <div>
            <h1 className="heading-xl checkout-page__heading">Checkout</h1>
            <p className="caption text-mute">Complete your order with quick delivery</p>
          </div>
          <span className="checkout-page__secure-badge">
            🔒 256-Bit SSL Encrypted
          </span>
        </div>
        <CheckoutForm cart={cart} cartTotal={cartTotal} />
      </div>
    </main>
  );
};

export default Checkout;
