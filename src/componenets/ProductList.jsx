import React, { useState, useRef, useEffect } from 'react';
import '../assets/styles.css';

// Helper function to get product image
const getProductImage = (product) => {
  return product.image 
    || (product.images && Array.isArray(product.images) && product.images[0]) 
    || product.imageUrl 
    || product.picture 
    || 'https://via.placeholder.com/280x200?text=Product';
};

export function ProductList({ products, onAddToCart }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageWrapperRef = useRef(null);

  const ZOOM_STEP = 0.2;
  const MAX_ZOOM = 3;
  const MIN_ZOOM = 1;

  // Disable page scroll when preview is open
  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [previewImage]);

  // Constrain pan to prevent image from going off-screen
  const constrainPan = (x, y) => {
    if (zoomLevel <= 1) return { x: 0, y: 0 };
    
    const maxOffset = (zoomLevel - 1) * 200;
    return {
      x: Math.max(Math.min(x, maxOffset), -maxOffset),
      y: Math.max(Math.min(y, maxOffset), -maxOffset)
    };
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    setZoomLevel(newZoom);
    if (newZoom === MIN_ZOOM) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(MIN_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanOffset(constrainPan(newX, newY));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setZoomLevel(MIN_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  if (products.length === 0) {
    return <p className="no-products">No products available.</p>;
  }

  return (
    <div className="product-list">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="preview-close-btn" 
              onClick={closePreview}
              aria-label="Close preview"
            >
              ×
            </button>
            
            <div className="zoom-controls">
              <button 
                className="zoom-btn" 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= MIN_ZOOM}
                title="Zoom Out"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button 
                className="zoom-btn" 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= MAX_ZOOM}
                title="Zoom In"
                aria-label="Zoom in"
              >
                +
              </button>
              <button 
                className="zoom-btn reset" 
                onClick={handleResetZoom} 
                title="Reset"
                aria-label="Reset zoom"
              >
                ⟲
              </button>
            </div>

            <div 
              className="preview-image-wrapper" 
              ref={imageWrapperRef}
              onWheel={handleMouseWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img 
                src={previewImage} 
                alt="Product Preview" 
                className="preview-image" 
                style={{ 
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      <div className="product-grid">
        {products.map((product) => {
          const imageUrl = getProductImage(product);
          const productId = product.product_id || product.id;

          return (
            <div key={productId} className="product-card">
              <div 
                className="product-image" 
                onClick={() => setPreviewImage(imageUrl)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setPreviewImage(imageUrl)}
                aria-label={`Preview image for ${product.name}`}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="product-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">
                  {product.description || 'Quality product'}
                </p>
                <p className="product-price">
                  {product.price ? `₹${product.price}` : 'Price TBA'}
                </p>
                <button
                  className="add-to-cart-btn"
                  onClick={() => onAddToCart(productId)}
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}