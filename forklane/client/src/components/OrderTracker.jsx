import './OrderTracker.css';

const STEPS = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const getStepIndex = (status) => {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx;
};

const OrderTracker = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="order-tracker order-tracker--cancelled">
        <div className="tracker-cancelled">
          <span className="cancelled-icon">✕</span>
          <div>
            <p className="heading-sm">Order Cancelled</p>
            <p className="caption text-mute">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div className="order-tracker" aria-label="Order status tracker">
      <div className="tracker__steps">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={step.key}
              className={`tracker__step${isCompleted ? ' completed' : ''}${isCurrent ? ' current' : ''}${isPending ? ' pending' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connector line (before step, not for first) */}
              {idx > 0 && (
                <div className={`tracker__connector${isCompleted || isCurrent ? ' filled' : ''}`} />
              )}

              <div className="tracker__dot">
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <span className="tracker__dot-inner" />
                )}
              </div>

              <span className="tracker__label caption">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
