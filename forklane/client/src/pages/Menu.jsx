import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import FoodCard from '../components/FoodCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { ProductGridSkeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
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

  const handleSearch = (query) => {
    const newParams = new URLSearchParams();
    if (category !== 'All') newParams.set('category', category);
    if (query) newParams.set('search', query);
    setSearchParams(newParams);
  };

  const heading = search
    ? `Results for "${search}"`
    : category !== 'All'
    ? category
    : 'Full Menu';

  return (
    <main className="menu-page page-enter">
      <div className="container">
        {/* Header */}
        <div className="menu-page__header">
          <h1 className="heading-xl">{heading}</h1>
          <p className="caption text-mute">
            {loading ? 'Loading...' : `${products.length} dish${products.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div className="menu-page__controls">
          <SearchBar initialValue={search} onSearch={handleSearch} />
          <CategoryFilter active={category} onChange={handleCategoryChange} />
        </div>

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
          ) : loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="No dishes found"
              description={
                search || category !== 'All'
                  ? 'Try adjusting your search or category filter.'
                  : 'The menu is being updated. Check back soon!'
              }
              actionLabel="Clear filters"
              onAction={() => setSearchParams({})}
            />
          ) : (
            <div className="product-grid">
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
