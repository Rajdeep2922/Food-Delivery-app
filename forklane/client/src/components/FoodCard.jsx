import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './FoodCard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FoodCard = ({ product, badge }) => {
  const { addToCart, isInCart } = useCart();

  const imageUrl = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${API_URL}${product.image}`
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable) return;
    addToCart(product);
    toast.success('Added to cart', {
      style: { borderRadius: '9999px', fontWeight: 500 },
      duration: 2000,
    });
  };

  return (
    <article className="food-card">
      <Link to={`/product/${product._id}`} className="food-card__image-wrap">
        {badge && <span className={`badge badge-${badge.type} food-card__badge`}>{badge.label}</span>}
        {!product.isAvailable && (
          <div className="food-card__unavail-overlay">
            <span>Currently Unavailable</span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={product.name}
          className="food-card__image"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
          }}
        />
      </Link>

      <div className="food-card__body">
        <p className="food-card__category caption text-mute">{product.category}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="food-card__name">{product.name}</h3>
        </Link>
        <div className="food-card__footer">
          <span className="food-card__price">₹{product.price}</span>
          <button
            className={`btn btn-sm btn-primary food-card__cta${!product.isAvailable ? ' disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            aria-label={`Add ${product.name} to cart`}
          >
            {isInCart(product._id) ? 'Add More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default FoodCard;
