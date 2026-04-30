import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/login.css";
import pathwiseLogo from "../assets/pathwise-logo.png";

const API_BASE_URL = "http://127.0.0.1:8000";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [error, setError] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const username = formData.username.trim().toLowerCase();
        const password = formData.password.trim();

        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setError("Could not sign in. Please try again.");
                return;
            }

            const result = await response.json();

            if (!result.success) {
                setError(result.message || "Invalid credentials. Try the demo logins.");
                return;
            }

            login(result.user, result.user.role);
            navigate(result.user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
        } catch (error) {
            setError("Could not reach the PathWise server. Please try again.");
        }
    }

    return (
        <div className="login-page">
            <div className="login-overlay">
                <div className="login-card">
                    <div className="login-header">
                        <img
                            src={pathwiseLogo}
                            alt="PathWise logo"
                            className="login-logo"
                        />
                        <p>Sign in to access your planning dashboard</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Enter username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" className="login-btn">
                            Sign In
                        </button>
                    </form>

                    <div className="demo-box">
                        <h3>Demo Credentials</h3>
                        <p><strong>Student:</strong> student / student123</p>
                        <p><strong>Admin:</strong> admin / admin123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
