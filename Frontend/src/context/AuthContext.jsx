import React, { createContext, useContext, useState, useEffect } from "react";
import { isTokenExpired } from "../utils/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check token expiration and clear if expired
  const checkAndClearExpiredToken = () => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      // Token is expired, clear everything
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      return true;
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

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

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
    <AuthContext.Provider value={{ user, login, logout }}>
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
