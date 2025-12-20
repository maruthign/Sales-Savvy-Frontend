import React, { useState, useEffect } from 'react';
import { ProductList } from './ProductList';
import { Footer } from './Footer';
import { Header } from './Header';
import '../assets/styles.css';

// API URL - Update this to match your backend
const API_URL = 'http://localhost:8080';

export default function CustomerHomePage() {
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [cartError, setCartError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Fetch products once on mount with default category
  useEffect(() => {
    fetchProducts('Shirts');
  }, []);

  // Fetch cart count whenever username changes
  useEffect(() => {
    if (username) {
      fetchCartCount();
    }
  }, [username]);

  const fetchProducts = async (category = '') => {
    setIsProductsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/products${category ? `?category=${category}` : ''}`, 
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data) {
        // Only set username once to avoid infinite loops
        if (data.user?.name && !username) {
          setUsername(data.user.name);
        }
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchCartCount = async () => {
    setIsCartLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/cart/items/count?username=${username}`, 
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

  const handleCategoryClick = (category) => {
    fetchProducts(category);
  };

  const handleAddToCart = async (productId) => {
    if (!username) {
      console.error('Username is required to add items to the cart');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({ username, productId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchCartCount();
      } else {
        console.error('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  return (
    <div className="customer-homepage">
      <Header
        cartCount={isCartLoading ? '...' : cartError ? '!' : cartCount}
        username={username || 'Guest'}
        onCategoryClick={handleCategoryClick}
      />
      <main className="main-content">
        {isProductsLoading ? (
          <div className="loading-state">Loading products...</div>
        ) : (
          <ProductList products={products} onAddToCart={handleAddToCart} />
        )}
      </main>
      <Footer />
    </div>
  );
}