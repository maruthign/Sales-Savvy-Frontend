import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import useravatar from './useravatar.png';
import './assets/styles.css';
export function ProfileDropdown({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  const handleLogout = async () => {
    try {
      // Attempt to notify backend of logout
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always redirect to login page, regardless of backend success/failure
      console.log('User logged out (client-side)');
      navigate('/');
    }
  };
  const handleOrdersClick = () => {
    navigate('/orders'); // Navigate to the orders route
  };
  return (
    <div className="profile-dropdown">
      <button className="profile-button" onClick={toggleDropdown}>
        <img
          src={useravatar}
          alt="User Avatar"
          className="user-avatar"
          onError={(e) => { e.target.src = 'fallback-logo.png'; }} // Fallback for image error
        />
        <span className="username">{username || 'Guest'}</span> {/* Display username */}
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <a href="#">Profile</a>
          <a onClick={handleOrdersClick}>Orders</a> {/* Handle Orders Click */}
          <button className="profile-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
