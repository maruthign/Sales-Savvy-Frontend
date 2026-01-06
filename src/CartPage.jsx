import React, { useEffect, useState } from "react";
import "./CartPage.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [overallPrice, setOverallPrice] = useState(0);
  const [username, setUsername] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const navigate = useNavigate(); // To redirect users after successful payment

  const [stockMap, setStockMap] = useState({});

  // Fetch cart items on component load
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/cart/items", {
          credentials: "include", // Include session cookie
        });
        if (!response.ok) throw new Error("Failed to fetch cart items");
        const data = await response.json();

        setCartItems(
          data?.cart?.products.map((item) => ({
            ...item,
            total_price: parseFloat(item.total_price).toFixed(2),
            price_per_unit: parseFloat(item.price_per_unit).toFixed(2),
          })) || []
        );
        setOverallPrice(parseFloat(data?.cart?.overall_total_price || 0).toFixed(2));
        setUsername(data?.username || ""); // Save the username from the response
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    fetchCartItems();
    fetchStock();
  }, []);

  // Fetch products to get stock information
  const fetchStock = async () => {
    try {
      // Fetching all products to Build stock map
      // Assuming api/products returns a list of products
      const response = await fetch("http://localhost:8080/api/products", {
        credentials: "include"
      });
      const data = await response.json();
      const products = data.products || [];
      const map = {};
      products.forEach(p => {
        map[p.product_id] = p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0);
      });
      setStockMap(map);
    } catch (error) {
      console.error("Error fetching stock info:", error);
    }
  };

  // Calculate subtotal whenever cart items change
  useEffect(() => {
    const total = cartItems
      .reduce((total, item) => total + parseFloat(item.total_price), 0)
      .toFixed(2);
    setSubtotal(total);
  }, [cartItems]);

  // Remove item from the cart
  const handleRemoveItem = async (productId) => {
    try {
      const response = await fetch("http://localhost:8080/api/cart/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId }),
      });
      if (response.status === 204) {
        setCartItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
      } else throw new Error("Failed to remove item");
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Update quantity of an item
  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        handleRemoveItem(productId);
        return;
      }

      // Check stock limit using stockMap or item property if available
      const item = cartItems.find((i) => i.product_id === productId);
      if (item) {
        // Prioritize stockMap, then item.stock_quantity
        let stock = stockMap[productId];
        if (stock === undefined) {
          stock = item.stock_quantity !== undefined ? item.stock_quantity : (item.stock || 0);
        }

        // If we have valid stock info (and it's not unlimited/undefined logic), check it
        // If stock is found and > 0, restrict
        if (stock !== undefined && stock > 0 && newQuantity > stock) {
          alert(`Stock limit exceeded! Only ${stock} items available.`);
          return;
        }
      }

      const response = await fetch("http://localhost:8080/api/cart/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId, quantity: newQuantity }),
      });
      if (response.ok) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.product_id === productId
              ? {
                ...item,
                quantity: newQuantity,
                total_price: (item.price_per_unit * newQuantity).toFixed(2),
              }
              : item
          )
        );
      } else throw new Error("Failed to update quantity");
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Razorpay integration for payment
  const handleCheckout = async () => {
    try {
      const requestBody = {
        totalAmount: subtotal,
        cartItems: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price_per_unit,
        })),
      };

      // Create Razorpay order via backend
      const response = await fetch("http://localhost:8080/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      const razorpayOrderId = await response.text();

      // Open Razorpay checkout interface
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use environment variable
        amount: subtotal * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "SalesSavvy",
        description: "Test Transaction",
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Payment success, verify on backend
            const verifyResponse = await fetch("http://localhost:8080/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id, // Ensure key matches backend
                razorpayPaymentId: response.razorpay_payment_id, // Ensure key matches backend
                razorpaySignature: response.razorpay_signature, // Ensure key matches backend
              }),
            });
            const result = await verifyResponse.text();
            if (verifyResponse.ok) {
              alert("Payment verified successfully!");
              navigate("/customerhome"); // Redirect to Customer Home Page
            } else {
              alert("Payment verification failed: " + result);
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            alert("Payment verification failed. Please try again.");
          }
        },
        prefill: {
          name: username,
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      // Function to dynamically load the script if missing
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert("Payment failed. Please try again.");
      console.error("Error during checkout:", error);
    }
  };

  const totalProducts = () => cartItems.reduce((acc, item) => acc + item.quantity, 0);

  /* Shipping Logic:
     - 5% of subtotal if subtotal <= 5000
     - Free if subtotal > 5000
  */
  const subtotalValue = parseFloat(subtotal) || 0;
  let shippingCost = 0;
  if (subtotalValue > 0 && subtotalValue <= 5000) {
    shippingCost = subtotalValue * 0.05;
  }
  const shipping = shippingCost.toFixed(2);

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <h2>Your Cart is Empty</h2>
        <p>Add some items to get started!</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw" }}>
      <Header cartCount={totalProducts()} username={username} />
      <div className="cart-container">
        <div className="cart-page">
          <a href="#" className="back-button">
            ← Shopping Continue
          </a>

          <div className="cart-header">
            <h2>Shopping Cart</h2>
            <p>You have {cartItems.length} items in your cart</p>
          </div>

          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.product_id} className="cart-item">
                <img
                  src={item.image_url || "https://via.placeholder.com/80?text=No+Image"}
                  alt={item.name}
                />
                <div className="item-details">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}>
                        -
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        disabled={(() => {
                          const stock = stockMap[item.product_id] !== undefined ? stockMap[item.product_id] : (item.stock_quantity || item.stock || 0);
                          return stock > 0 && item.quantity >= stock;
                        })()}
                        style={(() => {
                          const stock = stockMap[item.product_id] !== undefined ? stockMap[item.product_id] : (item.stock_quantity || item.stock || 0);
                          const disabled = stock > 0 && item.quantity >= stock;
                          return {
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer'
                          };
                        })()}
                      >
                        +
                      </button>
                    </div>
                    <span className="price">₹{item.total_price}</span>
                    <button className="remove-btn" onClick={() => handleRemoveItem(item.product_id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-section">
          <h2>Order Summary</h2>
          <div className="checkout-summary">
            {(() => {
              const inclusiveTotal = parseFloat(subtotal) || 0;
              const baseTotal = inclusiveTotal / 1.18;
              const totalTax = inclusiveTotal - baseTotal;
              const cgst = totalTax / 2;
              const sgst = totalTax / 2;
              const shippingCost = parseFloat(shipping) || 0;
              const finalTotal = inclusiveTotal + shippingCost;

              return (
                <>
                  <div className="summary-row">
                    <span>Subtotal (Base Price)</span>
                    <span>₹{baseTotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>SGST (9%)</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>CGST (9%)</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>₹{shipping}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Products</span>
                    <span>{totalProducts()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </>
              );
            })()}
            <button className="checkout-button" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;