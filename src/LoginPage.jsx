import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/styles.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensures cookies are sent and received
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✓ Login successful! Redirecting...');
        console.log('User logged in successfully:', data);

        // Redirect user based on their role after showing success message
        setTimeout(() => {
          if (data.role === 'CUSTOMER') {
            navigate('/customerhome');
          } else if (data.role === 'ADMIN') {
            navigate('/adminhome');
          } else {
            throw new Error('Invalid user role');
          }
        }, 1500);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
  <div className="auth-brand">
    <div className="brand-box">
      <h1>MyApp</h1>
      <p>Welcome back! Please login to continue.</p>
    </div>
  </div>

  <div className="auth-form-section">
    <div className="auth-card">
      <div className="auth-header">
        <h2>Login</h2>
        <p>Enter your credentials</p>
      </div>

      {error && <div className="status-msg error">{error}</div>}
      {success && <div className="status-msg success">{success}</div>}

      <form onSubmit={handleSignIn}>
        <div className="input-group">
          <label>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="auth-btn">Sign In</button>
      </form>

      <div className="auth-footer">
        New user? <a href="/register">Create account</a>
      </div>
    </div>
  </div>
</div>
  );
}