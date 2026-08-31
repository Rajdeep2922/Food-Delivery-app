import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import OrderCard from '../components/OrderCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await orderAPI.getMyOrders();
        setOrders(data.orders || []);
      } catch {
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)
  );
  const pastOrders = orders.filter(
    (o) => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus)
  );

  if (loading) return <Loading fullPage />;

  return (
    <main className="orders-page page-enter">
      <div className="container">
        <h1 className="heading-xl" style={{ marginBottom: 'var(--space-5)' }}>My Orders</h1>

        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load orders" description={error} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders yet"
            description="You haven't placed any orders yet. Start exploring our menu!"
            actionLabel="Browse Menu"
            actionTo="/menu"
          />
        ) : (
          <>
            {activeOrders.length > 0 && (
              <section className="orders-section">
                <h2 className="orders-section__title">Active Orders</h2>
                <div className="orders-list">
                  {activeOrders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section className="orders-section">
                <h2 className="orders-section__title">Order History</h2>
                <div className="orders-list">
                  {pastOrders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Orders;
