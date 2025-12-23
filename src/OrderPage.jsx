import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import './assets/styles.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);          // [{ order_id, products: [...] }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [cartError, setCartError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null); // which order is open

  useEffect(() => {
    fetchOrders();
    if (username) {
      fetchCartCount();
    }
  }, [username]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      const items = data.products || [];

      // Group flat items by order_id -> { order_id, products: [...] }
      const grouped = items.reduce((acc, item) => {
        const id = item.order_id;
        if (!acc[id]) {
          acc[id] = { order_id: id, products: [] };
        }
        acc[id].products.push(item);
        return acc;
      }, {});

      const groupedArray = Object.values(grouped); // [{order_id, products:[]}, ...]

      setOrders(groupedArray);
      setUsername(data.username || 'Guest');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    setIsCartLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/cart/items/count?username=${username}`,
        { credentials: 'include' }
      );
      const count = await response.json();
      setCartCount(count);
      setCartError(false);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartError(true);
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="maindiv">
      <div className="customer-homepage">
        <Header
          cartCount={isCartLoading ? '...' : cartError ? 'Error' : cartCount}
          username={username}
        />
        <main className="main-content">
          <h1 className="form-title">Your Orders</h1>

          {loading && <p>Loading orders...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && orders.length === 0 && (
            <p>No orders found. Start shopping now!</p>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.order_id;
                return (
                  <div
                    key={order.order_id}
                    className={`order-row ${isExpanded ? 'expanded' : ''}`}
                  >
                    {/* Only unique order id is always visible */}
                    <div
                      className="order-row-header"
                      onClick={() => handleOrderClick(order.order_id)}
                    >
                      <span className="order-row-id">
                        Order #{order.order_id}
                      </span>
                      <span
                        className={`order-row-arrow ${isExpanded ? 'open' : ''
                          }`}
                      >
                        ▾
                      </span>
                    </div>

                    {/* When expanded, show ALL products for this order */}
                    {isExpanded && (
                      <div className="order-row-details">
                        {order.products.map((p, idx) => (
                          <div
                            key={`${order.order_id}-${idx}`}
                            className="order-row-details-inner"
                          >
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="order-row-image"
                            />
                            <div className="order-row-info">
                              <h3 className="order-row-name">{p.name}</h3>
                              <p className="order-row-desc">
                                {p.description}
                              </p>
                              <div className="order-row-meta">
                                <div>
                                  <span className="meta-label">
                                    Quantity
                                  </span>
                                  <span className="meta-value">
                                    {p.quantity}
                                  </span>
                                </div>
                                <div>
                                  <span className="meta-label">
                                    Price / unit
                                  </span>
                                  <span className="meta-value">
                                    ₹{p.price_per_unit.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="meta-label">Total</span>
                                  <span className="meta-value total">
                                    ₹{p.total_price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
