// CategoryNavigation.jsx
import React from 'react';
import './assets/styles.css';

export function CategoryNavigation({ onCategoryClick, activeCategory }) {
  // Static categories list
  // Map display labels to actual database values
  const categories = [
    { label: 'Men', value: 'Men' },
    { label: 'Women', value: 'Women' },
    { label: 'Home Appliances', value: 'Home Appliances' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Accessories', value: 'Accessories' }
  ];

  return (
    <nav className="category-navigation">
      <ul className="category-list">
        {categories.map((category, index) => (
          <li
            key={index}
            className={`category-item ${activeCategory === category.value ? 'active' : ''}`}
            onClick={() => onCategoryClick(category.value)}
          >
            {category.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}
