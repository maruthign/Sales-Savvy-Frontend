import React, { useState, useEffect } from 'react';
import './assets/styles.css';

function ProductCard({ product, onAddToCart, onUpdateQuantity, cartQty = 0 }) {
  // Toggle state for low stock flicker
  const [showStockWarning, setShowStockWarning] = useState(false);

  const stock = product.stock_quantity !== undefined ? product.stock_quantity : (product.stock || 0);
  const isLowStock = stock > 0 && stock < 10;
  const isOutOfStock = stock === 0;

  useEffect(() => {
    let interval;
    if (isLowStock && cartQty === 0) { // Only flicker if not added yet
      interval = setInterval(() => {
        setShowStockWarning(prev => !prev);
      }, 3000);
    } else {
      setShowStockWarning(false);
    }
    return () => clearInterval(interval);
  }, [isLowStock, cartQty]);

  const handleAddClick = () => {
    if (cartQty >= stock) {
      alert(`You cannot add more than ${stock} items to the cart.`);
      return;
    }
    onAddToCart(product.product_id);
  };

  const handleIncrement = () => {
    if (cartQty >= stock) {
      alert(`You cannot add more than ${stock} items to the cart.`);
      return;
    }
    onUpdateQuantity(product.product_id, cartQty + 1);
  };

  const handleDecrement = () => {
    onUpdateQuantity(product.product_id, cartQty - 1);
  };

  return (
    <div className="product-card">
      <img
        src={product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/150'}
        alt={product.name}
        className="product-image"
        loading="lazy"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/150';
        }}
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">₹{product.price}</p>

        {isOutOfStock ? (
          <span className="out-of-stock">Not Available</span>
        ) : cartQty > 0 ? (
          <div className="quantity-controls-inline">
            <button className="qty-btn" onClick={handleDecrement}>-</button>
            <span className="qty-display">{cartQty}</span>
            <button className="qty-btn" onClick={handleIncrement}>+</button>
          </div>
        ) : (
          <button
            className={`add-to-cart-btn ${showStockWarning ? 'warning-bg' : ''}`}
            onClick={handleAddClick}
          >
            {showStockWarning ? `Only ${stock} left!` : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductList({ products, onAddToCart, onUpdateQuantity, cartItemsMap = {} }) {
  if (products.length === 0) {
    return <p className="no-products">No products available.</p>;
  }

  return (
    <div className="product-list">
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
            cartQty={cartItemsMap[product.product_id] || 0}
          />
        ))}
      </div>
    </div>
  );
}
