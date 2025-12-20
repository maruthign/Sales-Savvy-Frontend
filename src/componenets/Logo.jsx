import React from 'react';
import '../assets/styles.css';

export default function Logo() {
  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        background: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.4)'
      }} />
      <h1 style={{ 
        margin: 0, 
        color: 'white', 
        fontSize: 18, 
        fontWeight: 800 
      }}>
        SalesSavvy
      </h1>
    </div>
  );
}