import './Loading.css';

const Loading = ({ text = 'Loading...', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="loading-fullpage">
        <div className="loading-spinner" aria-label="Loading" role="status" />
        <p className="caption text-mute">{text}</p>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner" aria-label="Loading" role="status" />
    </div>
  );
};

// Skeleton card for product grid
export const ProductSkeleton = () => (
  <div className="product-skeleton">
    <div className="skeleton product-skeleton__image" />
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton" style={{ height: '12px', width: '60%' }} />
      <div className="skeleton" style={{ height: '16px', width: '85%' }} />
      <div className="skeleton" style={{ height: '14px', width: '40%' }} />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="product-grid">
    {Array.from({ length: count }, (_, i) => <ProductSkeleton key={i} />)}
  </div>
);

export default Loading;
