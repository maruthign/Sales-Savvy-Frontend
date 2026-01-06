import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import './assets/styles.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generateBill = (order) => {
    try {
      console.log("Generating bill for order:", order.order_id);
      const doc = new jsPDF();
      console.log("jsPDF instance created");

      // 1. Header
      doc.setFontSize(18);
      doc.text('Sales Savvy', 14, 22);

      doc.setFontSize(14);
      doc.text('Order Bill', 14, 32);

      doc.setFontSize(11);
      doc.text(`Order ID: ${order.order_id}`, 14, 40);

      // 2. Table Data
      // Columns: Item, Qty, Rate (Base), SGST, CGST, Amount
      const tableColumn = ["Item", "Qty", "Rate (Base)", "SGST (9%)", "CGST (9%)", "Total"];
      const tableRows = [];

      let totalQty = 0;
      let totalSGST = 0;
      let totalCGST = 0;
      let orderGrandTotal = 0;

      order.products.forEach(product => {
        // Calculations (Tax Inclusive)
        // Total Price for this item line (Inclusive)
        const itemInclusiveTotal = product.total_price;

        // Base Total for this item line
        const itemBaseTotal = itemInclusiveTotal / 1.18;

        // Taxes for this item line
        const itemSGST = itemBaseTotal * 0.09;
        const itemCGST = itemBaseTotal * 0.09;

        // Rate (Base per unit)
        const unitInclusive = product.price_per_unit;
        const unitBase = unitInclusive / 1.18;

        const productData = [
          product.name,
          product.quantity,
          `Rs. ${unitBase.toFixed(2)}`,
          `Rs. ${itemSGST.toFixed(2)}`,
          `Rs. ${itemCGST.toFixed(2)}`,
          `Rs. ${itemInclusiveTotal.toFixed(2)}`
        ];
        tableRows.push(productData);

        // Accumulate totals
        totalQty += product.quantity;
        totalSGST += itemSGST;
        totalCGST += itemCGST;
        orderGrandTotal += itemInclusiveTotal;
      });

      // 3. Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        foot: [[
          "Total",
          totalQty,
          "", // Rate column total doesn't make sense
          `Rs. ${totalSGST.toFixed(2)}`,
          `Rs. ${totalCGST.toFixed(2)}`,
          `Rs. ${orderGrandTotal.toFixed(2)}`
        ]],
        footStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        }
      });

      // 4. Footer / Summary
      const finalY = doc.lastAutoTable.finalY + 10;

      // Calculate total base price from the accumulated values
      const totalBasePrice = orderGrandTotal - totalSGST - totalCGST;

      doc.text(`Sub Total (Base Price): Rs. ${totalBasePrice.toFixed(2)}`, 14, finalY);
      doc.text(`CGST (9%): Rs. ${totalCGST.toFixed(2)}`, 14, finalY + 6);
      doc.text(`SGST (9%): Rs. ${totalSGST.toFixed(2)}`, 14, finalY + 12);
      doc.setFontSize(12);
      doc.text(`Grand Total: Rs. ${orderGrandTotal.toFixed(2)}`, 14, finalY + 20);

      // 5. Save
      console.log("Saving PDF...");
      doc.save(`Bill_Order_${order.order_id}.pdf`);
      console.log("PDF Saved successfully");
    } catch (err) {
      console.error("Error generating bill:", err);
      alert(`Failed to generate bill: ${err.message}`);
    }
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
                        {/* Download Bill Button - Inside the expanded details */}
                        <div style={{ padding: '10px 20px', textAlign: 'right' }}>
                          <button
                            className="download-bill-btn"
                            onClick={() => generateBill(order)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '0.9rem',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Download Bill
                          </button>
                        </div>
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
