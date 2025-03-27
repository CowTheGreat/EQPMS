import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/Login.module.css";
import Logo from "../assets/svce-logo.png";

const Login = () => {
  const [isUser, setIsUser] = useState(true);
  const [credentials, setCredentials] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [userId, setUserId] = useState(""); // New state for user ID
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: credentials.id,
            password: credentials.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (Boolean(data.force_password_change)) {
        navigate("/change-password", { state: { id: credentials.id } });
        return;
      }

      localStorage.setItem("token", data.token);
      login(
        {
          id: credentials.id,
          role: data.role,
          passwordChanged: data.password_changed,
        },
        data.token
      );

      navigate(data.role === "admin" ? "/admin-dashboard" : "/user-console");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleForgotPassword = async () => {
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, email }), // Send user ID and email
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      setOtpSent(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleOtpVerification = async () => {
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "OTP verification failed");
      }

      setOtpVerified(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    try {
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Prepare the payload with correct field names
      const payload = {
        email,
        new_password: newPassword, // Match backend field name
        confirm_password: confirmPassword, // Include confirm_password
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), // Send the correct payload
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed");
      }

      // Reset the state after successful password reset
      setForgotPassword(false);
      setOtpSent(false);
      setOtpVerified(false);
      setUserId("");
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <img src={Logo} alt="SVCE Logo" className={styles.logo} />

      <div className={styles.loginBox}>
        <h1 className={styles.title}>Welcome Back</h1>

        {!forgotPassword ? (
          <>
            <div className={styles.tabs}>
              <div
                className={`${styles.tab} ${isUser ? styles.activeTab : ""}`}
                onClick={() => setIsUser(true)}
              >
                User Login
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {isUser ? "User ID" : "Admin ID"}
                </label>
                <input
                  type="text"
                  name="id"
                  value={credentials.id}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder={isUser ? "Enter user ID" : "Enter admin ID"}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter password"
                  required
                />
              </div>

              <button type="submit" className={styles.button}>
                Login
              </button>

              {error && <p className={styles.error}>{error}</p>}

              <p
                className={styles.forgotPassword}
                onClick={() => setForgotPassword(true)}
              >
                Forgot Password?
              </p>
            </form>
          </>
        ) : (
          <div className={styles.forgotPasswordForm}>
            {!otpSent ? (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your User ID"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button
                  onClick={handleForgotPassword}
                  className={styles.button}
                >
                  Send OTP
                </button>
              </>
            ) : !otpVerified ? (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={styles.input}
                    placeholder="Enter OTP"
                    required
                  />
                </div>

                <button
                  onClick={handleOtpVerification}
                  className={styles.button}
                >
                  Verify OTP
                </button>
              </>
            ) : (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button onClick={handlePasswordReset} className={styles.button}>
                  Reset Password
                </button>
              </>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <p
              className={styles.backToLogin}
              onClick={() => setForgotPassword(false)}
            >
              Back to Login
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
