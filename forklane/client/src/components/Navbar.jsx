import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import './Navbar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // Click outside to close navbar search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live instant search with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !searchOpen) {
      setSearchSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data } = await productAPI.getAll({ search: trimmed });
        setSearchSuggestions(data.products?.slice(0, 5) || []);
        setDropdownOpen(true);
      } catch {
        setSearchSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setDropdownOpen(false);
      setSearchOpen(false);
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSelectSuggestion = (productId) => {
    setDropdownOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  const highlightMatch = (text, match) => {
    if (!match || !match.trim()) return text;
    const escaped = match.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      {/* Top utility strip */}
      <div className="navbar__strip">
        <div className="container navbar__strip-inner">
          <span>Free delivery on orders above ₹499</span>
          <div className="navbar__strip-links">
            <Link to="/menu">Find Food</Link>
            <span className="separator">|</span>
            <Link to="/orders">My Orders</Link>
            <span className="separator">|</span>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="strip-btn">Sign Out</button>
            ) : (
              <Link to="/login">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="navbar__main" aria-label="Primary navigation">
        <div className="container navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo" aria-label="ForkLane home">
            <span className="navbar__logo-icon">🍴</span>
            <span className="navbar__logo-text">ForkLane</span>
          </Link>

          {/* Desktop links */}
          <ul className="navbar__links" role="list">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink></li>
            <li><NavLink to="/menu" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Menu</NavLink></li>
            <li><NavLink to="/offers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Offers</NavLink></li>
            {isAuthenticated && (
              <li><NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Orders</NavLink></li>
            )}
          </ul>

          {/* Right actions */}
          <div className="navbar__actions">
            {/* Search */}
            <div className="navbar__search-wrap" ref={searchContainerRef}>
              <form
                onSubmit={handleSearch}
                className={`navbar__search-form${searchOpen ? ' open' : ''}`}
                role="search"
              >
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0 && searchQuery.trim()) setDropdownOpen(true);
                  }}
                  className="navbar__search-input"
                  aria-label="Search food"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-icon navbar__action-btn" aria-label="Submit search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </form>

              {!searchOpen && (
                <button
                  className="btn btn-icon navbar__action-btn"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              )}

              {/* Live search dropdown */}
              {dropdownOpen && searchOpen && searchQuery.trim().length > 0 && (
                <div className="navbar__search-dropdown" role="listbox">
                  <div className="navbar__search-dropdown-header">
                    {loadingSuggestions ? 'Searching dishes...' : `Matches for "${searchQuery.trim()}"`}
                  </div>

                  {searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((item) => {
                        const img = item.image
                          ? item.image.startsWith('http')
                            ? item.image
                            : `${API_URL}${item.image}`
                          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80';

                        return (
                          <div
                            key={item._id}
                            className="navbar__search-dropdown-item"
                            onClick={() => handleSelectSuggestion(item._id)}
                            role="option"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSelectSuggestion(item._id);
                            }}
                          >
                            <img src={img} alt={item.name} className="navbar__search-dropdown-thumb" />
                            <div className="navbar__search-dropdown-info">
                              <p className="navbar__search-dropdown-name">{highlightMatch(item.name, searchQuery)}</p>
                              <p className="navbar__search-dropdown-meta">{item.category}</p>
                            </div>
                            <span className="navbar__search-dropdown-price">₹{item.price}</span>
                          </div>
                        );
                      })}

                      <div
                        className="navbar__search-dropdown-footer"
                        onClick={() => {
                          setDropdownOpen(false);
                          setSearchOpen(false);
                          navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
                          setSearchQuery('');
                        }}
                      >
                        <span>View all results for "{searchQuery.trim()}"</span>
                        <span>→</span>
                      </div>
                    </>
                  ) : !loadingSuggestions ? (
                    <div className="navbar__search-dropdown-empty">
                      No dishes found matching "{searchQuery.trim()}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="btn btn-icon navbar__action-btn navbar__cart-btn" aria-label={`Cart, ${cartCount} items`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && (
                <span className="navbar__cart-badge" aria-live="polite">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <Link to="/profile" className="btn btn-icon navbar__action-btn" aria-label="My profile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="btn btn-icon navbar__hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="navbar__overlay" onClick={closeMobile} aria-hidden="true" />
      )}
      <div className={`navbar__drawer${mobileOpen ? ' open' : ''}`} role="dialog" aria-label="Mobile navigation">
        <div className="navbar__drawer-header">
          <Link to="/" className="navbar__logo" onClick={closeMobile}>
            <span className="navbar__logo-icon">🍴</span>
            <span className="navbar__logo-text">ForkLane</span>
          </Link>
          <button className="btn btn-icon" onClick={closeMobile} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <ul className="navbar__drawer-links" role="list">
          <li><Link to="/" onClick={closeMobile}>Home</Link></li>
          <li><Link to="/menu" onClick={closeMobile}>Menu</Link></li>
          <li><Link to="/offers" onClick={closeMobile}>Offers</Link></li>
          <li><Link to="/cart" onClick={closeMobile}>Cart {cartCount > 0 && `(${cartCount})`}</Link></li>
          {isAuthenticated ? (
            <>
              <li><Link to="/orders" onClick={closeMobile}>My Orders</Link></li>
              <li><Link to="/profile" onClick={closeMobile}>Profile</Link></li>
              <li><button onClick={handleLogout} className="drawer-signout">Sign Out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={closeMobile}>Sign In</Link></li>
              <li><Link to="/register" onClick={closeMobile}>Create Account</Link></li>
            </>
          )}
        </ul>

        {user && (
          <div className="navbar__drawer-user">
            <p className="caption text-mute">Signed in as</p>
            <p className="heading-sm">{user.name}</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
