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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term (Token-based OR match)
  const filteredProducts = products.filter(product => {
    if (!searchTerm.trim()) return true;
    const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.trim() !== '');
    const productName = product.name.toLowerCase();
    const productDesc = product.description.toLowerCase();

    // Check if ANY token matches the product name or description
    return searchTokens.some(token =>
      productName.includes(token) || productDesc.includes(token)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setItemsPerPage(9);
      } else if (window.innerWidth <= 1024) {
        setItemsPerPage(12);
      } else {
        setItemsPerPage(15);
      }
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
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
        const fetchedProducts = data.products || [];

        // --- 10-Minute Persistent Shuffle Logic ---
        const CACHE_KEY_ORDER = 'product_shuffle_order';
        const CACHE_KEY_TIME = 'product_shuffle_timestamp';
        const CACHE_KEY_USER = 'product_shuffle_user';
        const TEN_MINUTES_MS = 10 * 60 * 1000;

        const cachedOrderStr = localStorage.getItem(CACHE_KEY_ORDER);
        const cachedTimeStr = localStorage.getItem(CACHE_KEY_TIME);
        const cachedUser = localStorage.getItem(CACHE_KEY_USER);

        const now = Date.now();
        const currentUser = data.user?.name || 'Guest';

        let finalProducts = [];
        let shouldUseCache = false;

        if (cachedOrderStr && cachedTimeStr) {
          const cachedTime = parseInt(cachedTimeStr, 10);
          const isTimeValid = (now - cachedTime < TEN_MINUTES_MS);
          const isUserValid = (cachedUser === currentUser);

          if (isTimeValid && isUserValid) {
            shouldUseCache = true;
          }
        }

        if (shouldUseCache) {
          try {
            const orderIds = JSON.parse(cachedOrderStr);
            // Create a map for O(1) access to fresh product data
            const productMap = new Map(fetchedProducts.map(p => [p.product_id, p]));

            // Reconstruct array based on cached order
            orderIds.forEach(id => {
              if (productMap.has(id)) {
                finalProducts.push(productMap.get(id));
                productMap.delete(id); // Remove from map to identify new items later
              }
            });

            // Append any NEW products that weren't in the cache
            productMap.forEach(product => {
              finalProducts.push(product);
            });

          } catch (e) {
            console.error("Error parsing cached shuffle order", e);
            shouldUseCache = false; // Fallback to re-shuffle
          }
        }

        if (!shouldUseCache) {
          // Perform Fisher-Yates Shuffle
          finalProducts = [...fetchedProducts];
          for (let i = finalProducts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalProducts[i], finalProducts[j]] = [finalProducts[j], finalProducts[i]];
          }

          // Save new order, timestamp, and user
          const newOrderIds = finalProducts.map(p => p.product_id);
          localStorage.setItem(CACHE_KEY_ORDER, JSON.stringify(newOrderIds));
          localStorage.setItem(CACHE_KEY_TIME, now.toString());
          localStorage.setItem(CACHE_KEY_USER, currentUser);
        }

        setProducts(finalProducts);
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
    setCurrentPage(1); // Reset to first page on category change
    setSearchTerm(''); // Reset search on category change
    fetchProducts(category);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
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
        onSearch={handleSearch}
      />
      <nav className="navigation">
        <CategoryNavigation
          onCategoryClick={handleCategoryClick}
          activeCategory={activeCategory}
        />
      </nav>
      <main className="main-content">
        <ProductList
          products={filteredProducts.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          cartItemsMap={cartItemsMap}
        />

        {/* Pagination Controls */}
        {filteredProducts.length > itemsPerPage && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            <span className="pagination-info">
              {currentPage}
            </span>
            <button
              className="pagination-btn"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage))
                )
              }
              disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
            >
              &gt;
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
