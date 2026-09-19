import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import FoodCard from '../components/FoodCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { ProductGridSkeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import BackButton from '../components/BackButton';
import './Menu.css';

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = searchParams.get('category') || 'All';
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products || []);
    } catch {
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (cat) => {
    const newParams = new URLSearchParams();
    if (cat !== 'All') newParams.set('category', cat);
    if (search) newParams.set('search', search);
    setSearchParams(newParams);
  };

  const handleSearch = useCallback((query) => {
    const newParams = new URLSearchParams();
    if (category !== 'All') newParams.set('category', category);
    if (query) newParams.set('search', query);
    setSearchParams(newParams, { replace: true });
  }, [category, setSearchParams]);

  const heading = category !== 'All' ? category : 'Full Menu';

  return (
    <main className="menu-page page-enter">
      <div className="container">
        <BackButton label="Back to Home" to="/" />
        {/* Header */}
        <div className="menu-page__header">
          <div>
            <h1 className="heading-xl">{heading}</h1>
            <p className="caption text-mute">Freshly prepared, delivered to your door</p>
          </div>
          <p className="caption text-mute menu-page__count">
            {loading && products.length === 0
              ? 'Loading...'
              : `${products.length} dish${products.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div className="menu-page__controls">
          <SearchBar initialValue={search} onSearch={handleSearch} />
          <CategoryFilter active={category} onChange={handleCategoryChange} />
        </div>

        {/* Active search banner */}
        {search && (
          <div className="menu-search-tag">
            <span>
              Showing results for <strong>"{search}"</strong>{' '}
              <span className="text-mute">({products.length} found)</span>
            </span>
            <button
              type="button"
              className="menu-search-tag__clear"
              onClick={() => handleSearch('')}
              aria-label="Clear search"
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="menu-page__grid-wrap">
          {error ? (
            <EmptyState
              icon="⚠️"
              title="Something went wrong"
              description={error}
              actionLabel="Try Again"
              onAction={fetchProducts}
            />
          ) : loading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="menu-empty-search">
              <span className="menu-empty-search__icon">🔍</span>
              <h3 className="heading-md">No dishes found for "{search || category}"</h3>
              <p className="caption text-mute">
                Try searching for something else like "burger", "pizza", or browse another category.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchParams({})}
              >
                View Full Menu
              </button>
            </div>
          ) : (
            <div className={`product-grid${loading ? ' product-grid--loading' : ''}`}>
              {products.map((product) => (
                <FoodCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Menu;
