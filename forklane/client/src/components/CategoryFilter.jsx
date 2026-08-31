import './CategoryFilter.css';

const CATEGORIES = ['All', 'Pizza', 'Burgers', 'Indian', 'Chinese', 'Desserts', 'Drinks', 'Healthy', 'Pasta'];

const CategoryFilter = ({ active, onChange }) => {
  return (
    <div className="category-filter" role="navigation" aria-label="Filter by category">
      <div className="category-filter__track">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-filter__btn${active === cat ? ' active' : ''}`}
            onClick={() => onChange(cat)}
            aria-pressed={active === cat}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
export { CATEGORIES };
