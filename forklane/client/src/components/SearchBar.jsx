import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import './SearchBar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SearchBar = ({ initialValue = '', onSearch }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const isFirstRender = useRef(true);

  // Sync with external initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live instant search with debounce (both grid update and suggestions dropdown)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      if (onSearch) onSearch('');
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Update parent grid search
      if (onSearch) onSearch(trimmed);

      // 2. Fetch live suggestions for dropdown
      setLoadingSuggestions(true);
      try {
        const { data } = await productAPI.getAll({ search: trimmed });
        const list = data.products || [];
        setSuggestions(list.slice(0, 5));
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else if (query.trim()) {
      navigate(`/menu?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (onSearch) onSearch('');
  };

  const handleSelectSuggestion = (productId) => {
    setIsOpen(false);
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

  return (
    <div className="search-bar-wrap" ref={wrapperRef}>
      <form className="search-bar" onSubmit={handleSubmit} role="search">
        <span className="search-bar__icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim()) setIsOpen(true);
          }}
          placeholder="Search for dishes, cuisines..."
          className="search-bar__input"
          aria-label="Search food"
          autoComplete="off"
        />
        {query && (
          <button type="button" className="search-bar__clear" onClick={handleClear} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm search-bar__submit">Search</button>
      </form>

      {/* Live suggestions popup */}
      {isOpen && query.trim().length > 0 && (
        <div className="search-dropdown" role="listbox">
          <div className="search-dropdown__header">
            {loadingSuggestions ? 'Searching dishes...' : `Quick matches for "${query.trim()}"`}
          </div>

          {suggestions.length > 0 ? (
            <>
              {suggestions.map((item) => {
                const img = item.image
                  ? item.image.startsWith('http')
                    ? item.image
                    : `${API_URL}${item.image}`
                  : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80';

                return (
                  <div
                    key={item._id}
                    className="search-dropdown__item"
                    onClick={() => handleSelectSuggestion(item._id)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelectSuggestion(item._id);
                    }}
                  >
                    <img src={img} alt={item.name} className="search-dropdown__thumb" />
                    <div className="search-dropdown__info">
                      <p className="search-dropdown__name">{highlightMatch(item.name, query)}</p>
                      <p className="search-dropdown__meta">
                        <span>{item.category}</span>
                      </p>
                    </div>
                    <span className="search-dropdown__price">₹{item.price}</span>
                  </div>
                );
              })}

              <div
                className="search-dropdown__footer"
                onClick={() => {
                  setIsOpen(false);
                  if (onSearch) onSearch(query.trim());
                }}
              >
                <span>View all results for "{query.trim()}"</span>
                <span>→</span>
              </div>
            </>
          ) : !loadingSuggestions ? (
            <div className="search-dropdown__empty">
              No dishes found matching "{query.trim()}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
