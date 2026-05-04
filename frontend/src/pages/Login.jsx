import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../context/useAuth";
import "../styles/login.css";
import pathwiseLogo from "../assets/pathwise-logo.png";

const INACTIVITY_MESSAGE_KEY = "pathwise-inactivity-message";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isResetOpen, setIsResetOpen] = useState(false);

    useEffect(() => {
        const inactivityMessage = localStorage.getItem(INACTIVITY_MESSAGE_KEY);

        if (inactivityMessage) {
            setNotice(inactivityMessage);
            localStorage.removeItem(INACTIVITY_MESSAGE_KEY);
        }
    }, []);

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
        setNotice("");

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

    function openResetPanel() {
        setError("");
        setNotice("");
        setIsResetOpen(true);
    }

    function closeResetPanel() {
        setIsResetOpen(false);
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

                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={openResetPanel}
                        >
                            Forgot Password?
                        </button>

                        {isResetOpen && (
                            <div className="forgot-password-panel">
                                <p>
                                    For security, please contact your administrator to reset your password.
                                </p>
                                <button type="button" onClick={closeResetPanel}>
                                    Close
                                </button>
                            </div>
                        )}

                        {notice && <p className="session-notice">{notice}</p>}
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
