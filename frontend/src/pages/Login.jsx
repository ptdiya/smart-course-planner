import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import pathwiseLogo from "../assets/pathwise-logo.png";

function Login() {
    const navigate = useNavigate();

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

    function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const username = formData.username.trim().toLowerCase();
        const password = formData.password.trim();

        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        if (username === "admin" && password === "admin123") {
            navigate("/admin");
        } else if (username === "student" && password === "student123") {
            navigate("/student");
        } else {
            setError("Invalid credentials. Try the demo logins.");
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