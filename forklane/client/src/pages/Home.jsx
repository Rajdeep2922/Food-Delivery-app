import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import FoodCard from '../components/FoodCard';
import { ProductGridSkeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import './Home.css';

const CATEGORIES = [
  { name: 'Pizza', emoji: '🍕', color: '#fff3e0' },
  { name: 'Burgers', emoji: '🍔', color: '#e8f5e9' },
  { name: 'Indian', emoji: '🍛', color: '#fce4ec' },
  { name: 'Chinese', emoji: '🥡', color: '#e3f2fd' },
  { name: 'Desserts', emoji: '🍰', color: '#f3e5f5' },
  { name: 'Drinks', emoji: '🥤', color: '#e0f2f1' },
  { name: 'Healthy', emoji: '🥗', color: '#f1f8e9' },
  { name: 'Pasta', emoji: '🍝', color: '#fff8e1' },
];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await productAPI.getAll({});
        const products = data.products || [];
        setFeatured(products.slice(0, 4));
        setPopular(products.slice(4, 8));
      } catch {
        // handled silently
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="home page-enter">
      {/* ── Hero ── */}
      <section className="home__hero">
        <div className="home__hero-content">
          <p className="home__hero-eyebrow caption">ForkLane Premium Delivery</p>
          <h1 className="hero-headline home__hero-headline">
            Good Food.<br />No Wait.
          </h1>
          <p className="home__hero-sub body-lg text-mute">
            Restaurant-quality food delivered to your door in minutes. Fresh, fast, and exactly how you like it.
          </p>
          <div className="home__hero-actions">
            <Link to="/menu" className="btn btn-primary btn-lg">Order Now</Link>
            <Link to="/menu" className="btn btn-secondary btn-lg">Explore Menu</Link>
          </div>
        </div>
        <div className="home__hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85"
            alt="Delicious food spread"
            className="home__hero-image"
          />
          <div className="home__hero-badge">
            <span className="hero-badge-number">30</span>
            <span className="hero-badge-label">min avg delivery</span>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-xl">What are you craving?</h2>
            <Link to="/menu" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="home__categories">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/menu?category=${cat.name}`}
                className="home__cat-card"
                style={{ '--cat-bg': cat.color }}
                aria-label={`Browse ${cat.name}`}
              >
                <span className="home__cat-emoji" aria-hidden="true">{cat.emoji}</span>
                <span className="home__cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── Featured Dishes ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="caption text-mute" style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chef's Picks</p>
              <h2 className="heading-xl">Featured Dishes</h2>
            </div>
            <Link to="/menu" className="btn btn-secondary btn-sm">See All</Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : featured.length > 0 ? (
            <div className="product-grid">
              {featured.map((product, i) => (
                <FoodCard
                  key={product._id}
                  product={product}
                  badge={i === 0 ? { type: 'new', label: 'Just In' } : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="🍽️" title="No dishes yet" description="Check back soon for our menu." />
          )}
        </div>
      </section>

      {/* ── Campaign Banner ── */}
      <section className="home__campaign">
        <div className="container home__campaign-inner">
          <div className="home__campaign-text">
            <p className="caption" style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Limited Time</p>
            <h2 className="hero-headline" style={{ color: '#fff', fontSize: 'clamp(36px, 6vw, 72px)' }}>
              Free Delivery<br />on First Order
            </h2>
            <p className="body text-mute" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '400px', marginTop: '16px' }}>
              Use code <strong>FORKLANE</strong> at checkout and get free delivery on your first order with us.
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ background: '#fff', color: '#111', marginTop: '24px' }}>
              Order Now
            </Link>
          </div>
          <div className="home__campaign-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"
              alt="Pizza promotional offer"
              className="home__campaign-img"
            />
          </div>
        </div>
      </section>

      {/* ── Popular Dishes ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="caption text-mute" style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most Ordered</p>
              <h2 className="heading-xl">Popular Right Now</h2>
            </div>
            <Link to="/menu" className="btn btn-secondary btn-sm">See All</Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : popular.length > 0 ? (
            <div className="product-grid">
              {popular.map((product) => (
                <FoodCard key={product._id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="home__trust">
        <div className="container home__trust-inner">
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Average 30 min delivery' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Stripe encrypted checkout' },
            { icon: '♨️', title: 'Always Fresh', desc: 'Prepared to order, not pre-made' },
            { icon: '📱', title: 'Live Tracking', desc: 'Follow your order in real time' },
          ].map((item) => (
            <div key={item.title} className="home__trust-item">
              <span className="home__trust-icon">{item.icon}</span>
              <div>
                <p className="heading-sm">{item.title}</p>
                <p className="caption text-mute">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
