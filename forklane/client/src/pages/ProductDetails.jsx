import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import './ProductDetails.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cartItem = cart.find((item) => item._id === id);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.getById(id);
        setProduct(data.product);
      } catch {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Loading fullPage />;

  if (error || !product) {
    return (
      <main className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p className="heading-lg">Product not found</p>
        <Link to="/menu" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Menu</Link>
      </main>
    );
  }

  const imageUrl = product.image
    ? product.image.startsWith('http') ? product.image : `${API_URL}${product.image}`
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      style: { borderRadius: '9999px', fontWeight: 500 },
    });
  };

  return (
    <main className="product-details page-enter">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="product-details__breadcrumb caption text-mute" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/menu">Menu</Link>
          <span> / </span>
          <Link to={`/menu?category=${product.category}`}>{product.category}</Link>
          <span> / </span>
          <span>{product.name}</span>
        </nav>

        <div className="product-details__layout">
          {/* Image */}
          <div className="product-details__image-wrap">
            <img
              src={imageUrl}
              alt={product.name}
              className="product-details__image"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'; }}
            />
            {!product.isAvailable && (
              <div className="product-details__unavail">Currently Unavailable</div>
            )}
          </div>

          {/* Info */}
          <div className="product-details__info">
            <div>
              <Link to={`/menu?category=${product.category}`} className="product-details__category caption text-mute">
                {product.category}
              </Link>
              <h1 className="product-details__name">{product.name}</h1>
              <p className="product-details__price">₹{product.price}</p>
              <p className="product-details__desc body">{product.description}</p>
            </div>

            <div className="product-details__actions">
              {product.isAvailable ? (
                cartItem ? (
                  <div className="product-details__qty">
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                    </button>
                    <span className="qty-count heading-md">{cartItem.quantity}</span>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                    Add to Cart
                  </button>
                )
              ) : (
                <button className="btn btn-secondary btn-lg" disabled>
                  Currently Unavailable
                </button>
              )}

              {cartItem && (
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/cart')}>
                  View Cart ({cartItem.quantity})
                </button>
              )}
            </div>

            {/* Meta */}
            <div className="product-details__meta">
              <div className="product-meta-item">
                <span className="caption text-mute">Category</span>
                <span className="caption">{product.category}</span>
              </div>
              <div className="product-meta-item">
                <span className="caption text-mute">Availability</span>
                <span className={`status-chip ${product.isAvailable ? 'status-delivered' : 'status-cancelled'}`}>
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
