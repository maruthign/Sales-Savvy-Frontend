import React, { useState, useEffect } from 'react';
import { CategoryNavigation } from './CategoryNavigation';
import { ProductList } from './ProductList';
import { Footer } from './Footer';
import { Header } from './Header';
import './assets/styles.css';

export default function CustomerHomePage() {
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [cartError, setCartError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Men');

  const [cartItemsMap, setCartItemsMap] = useState({});

  useEffect(() => {
    fetchProducts();
    if (username) {
      fetchCartData();
    }
  }, [username]);

  const fetchProducts = async (category = '') => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/products${category ? `?category=${category}` : '?category=Men'
        }`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data) {
        setUsername(data.user?.name || 'Guest');
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchCartData = async () => {
    setIsCartLoading(true);
    try {
      // Fetch full cart to get items map
      const response = await fetch(
        `http://localhost:8080/api/cart/items?username=${username}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        const products = data?.cart?.products || [];

        // Calculate total count
        const count = products.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);

        // Create map of productId -> quantity
        const map = {};
        products.forEach(item => {
          map[item.product_id] = item.quantity;
        });
        setCartItemsMap(map);
        setCartError(false);
      } else {
        // Fallback if full items endpoint fails or is unnecessary? 
        // Actually the user wants stock restriction so we need this.
        setCartError(true);
      }
    } catch (error) {
      console.error('Error fetching cart data:', error);
      setCartError(true);
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    fetchProducts(category);
  };

  const handleAddToCart = async (productId) => {
    if (!username) {
      console.error('Username is required to add items to the cart');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/api/cart/add', {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({ username, productId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchCartData();
      } else {
        console.error('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      handleRemoveItem(productId);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/cart/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId, quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCartData();
      } else {
        console.error("Failed to update cart quantity");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const response = await fetch("http://localhost:8080/api/cart/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId }),
      });
      if (response.status === 204) {
        fetchCartData();
      } else {
        console.error("Failed to remove item from cart");
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  return (
    <div className="customer-homepage">
      <Header
        cartCount={isCartLoading ? '...' : cartError ? 'Error' : cartCount}
        username={username}
      />
      <nav className="navigation">
        <CategoryNavigation
          onCategoryClick={handleCategoryClick}
          activeCategory={activeCategory}
        />
      </nav>
      <main className="main-content">
        <ProductList
          products={products}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          cartItemsMap={cartItemsMap}
        />
      </main>
      <Footer />
    </div>
  );
}
