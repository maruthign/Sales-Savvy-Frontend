// RegistrationPage.jsx
import React, { useState } from "react";
import "./assets/styles.css";

export default function RegistrationPage() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
                setTimeout(() => { window.location.href = "/"; }, 2000);
            } else {
                throw new Error(data.error || "Registration failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {/* Left Section: Visual Branding (Hidden on Mobile) */}
            <aside className="brand-aside">
                <div className="brand-content">
                    <div className="brand-logo">
                        <span className="fire-icon">🔥</span>
                        <h1>SalesSavvy</h1>
                    </div>
                    <p>Streamline your business with our all-in-one platform.</p>
                </div>
            </aside>

            {/* Right Section: Form Content */}
            <main className="form-section">
                <div className="form-card">
                    <header className="form-header">
                        <h2>Create Account</h2>
                        <p>Fill in the details to get started</p>
                    </header>

                    {error && <div className="status-msg error">{error}</div>}
                    {success && <div className="status-msg success">Account created successfully!</div>}

                    <form onSubmit={handleSignUp} className="main-form">
                        <div className="input-field">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-field">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-field">
                            <label>Select Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} required>
                                <option value="" disabled>Choose your role</option>
                                <option value="CUSTOMER">Customer</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Sign Up"}
                        </button>
                    </form>

                    <footer className="card-footer">
                        Already have an account? <a href="/">Log In</a>
                    </footer>
                </div>
            </main>
        </div>
    );
}