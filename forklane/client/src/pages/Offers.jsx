import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import FoodCard from '../components/FoodCard';
import { ProductGridSkeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './Offers.css';

const PROMO_CODES = [
  {
    code: 'FORKLANE',
    title: 'Free Delivery on First Order',
    discount: '100% OFF DELIVERY',
    minOrder: '₹299',
    description: 'Enjoy free doorstep delivery on your first purchase with us.',
    tag: 'NEW USER',
  },
  {
    code: 'FEAST50',
    title: 'Flat 50% OFF up to ₹150',
    discount: '50% OFF',
    minOrder: '₹349',
    description: 'Valid on all Pizza, Burger, and Indian main course categories.',
    tag: 'SPECIAL',
  },
  {
    code: 'WEEKEND20',
    title: 'Weekend Binge 20% Instant Discount',
    discount: '20% OFF',
    minOrder: '₹499',
    description: 'Applicable across the entire menu with no upper limit.',
    tag: 'LIMITED TIME',
  },
  {
    code: 'SWEET10',
    title: 'Free Dessert with Orders Above ₹599',
    discount: 'FREE DESSERT',
    minOrder: '₹599',
    description: 'Get our Chef Special Chocolate Brownie free with your order.',
    tag: 'DESSERT',
  },
];

const Offers = () => {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data } = await productAPI.getAll({});
        const products = data.products || [];
        setDealProducts(products.slice(0, 4));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon "${code}" copied to clipboard!`, {
      style: { borderRadius: '9999px', fontWeight: 500 },
    });
  };

  return (
    <main className="offers-page page-enter">
      <div className="container">
        <BackButton label="Back to Home" to="/" />
        {/* Header */}
        <div className="offers-page__header">
          <p className="caption text-mute" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Exclusive Deals & Discounts
          </p>
          <h1 className="hero-headline offers-headline">Today's Top Offers</h1>
          <p className="body-lg text-mute" style={{ maxWidth: '600px', marginTop: '8px' }}>
            Save big on your favourite meals. Use coupons at checkout or grab our hand-picked special deal dishes.
          </p>
        </div>

        {/* Coupons Grid */}
        <section className="offers-coupons">
          <h2 className="heading-lg" style={{ marginBottom: 'var(--space-3)' }}>Active Coupon Codes</h2>
          <div className="coupon-grid">
            {PROMO_CODES.map((promo) => (
              <div key={promo.code} className="coupon-card">
                <div className="coupon-card__badge-row">
                  <span className="badge badge-sale">{promo.tag}</span>
                  <span className="caption text-mute">Min order: {promo.minOrder}</span>
                </div>
                <div className="coupon-card__body">
                  <div className="coupon-card__discount">{promo.discount}</div>
                  <h3 className="coupon-card__title">{promo.title}</h3>
                  <p className="caption text-mute">{promo.description}</p>
                </div>
                <div className="coupon-card__footer">
                  <span className="coupon-code font-mono">{promo.code}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyCode(promo.code)}
                    aria-label={`Copy coupon code ${promo.code}`}
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" style={{ margin: 'var(--space-8) 0' }} />

        {/* Special Discount Dishes */}
        <section className="offers-dishes">
          <div className="section-header">
            <div>
              <p className="caption text-mute" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Chef Selected
              </p>
              <h2 className="heading-xl">Discounted Favourites</h2>
            </div>
            <Link to="/menu" className="btn btn-secondary btn-sm">Browse Full Menu</Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : dealProducts.length > 0 ? (
            <div className="product-grid">
              {dealProducts.map((product) => (
                <FoodCard
                  key={product._id}
                  product={product}
                  badge={{ type: 'sale', label: '20% OFF' }}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default Offers;
