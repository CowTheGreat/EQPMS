import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired, updateTokenActivity } from "../utils/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const navigate = useNavigate();

  const showSessionExpiredMessage = (reason) => {
    setSessionMessage(reason);
    setTimeout(() => setSessionMessage(""), 5000); // Clear message after 5 seconds
  };

  // Function to check token expiration and clear if expired
  const checkAndClearExpiredToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const { expired, reason } = isTokenExpired(token);
      if (expired) {
        // Token is expired, clear everything
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        showSessionExpiredMessage(reason);
        navigate("/login");
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    // Check if there's a token in localStorage on initial load
    const token = localStorage.getItem("token");
    if (token) {
      if (!checkAndClearExpiredToken()) {
        // Token is valid, set user info
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);
      }
    }
    setLoading(false);

    // Set up interval to check token expiration every minute
    const interval = setInterval(() => {
      checkAndClearExpiredToken();
    }, 60000); // Check every minute

    // Set up activity listeners
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      if (user) {
        updateTokenActivity();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup interval and event listeners on unmount
    return () => {
      clearInterval(interval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, navigate]);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("userInfo", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
