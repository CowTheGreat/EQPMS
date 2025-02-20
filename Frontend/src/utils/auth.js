const generateToken = (user) => {
  // In a real application, this would be done on the server side
  // This is just for demonstration purposes
  const token = btoa(
    JSON.stringify({
      id: Math.random().toString(36).substr(2, 9),
      role: user.role,
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes expiration
      lastActivity: Date.now(),
    })
  );

  return token;
};

const isTokenExpired = (token) => {
  try {
    const decodedToken = JSON.parse(atob(token));
    const now = Date.now();

    // Check if token has expired
    if (decodedToken.exp <= now) {
      return { expired: true, reason: "Token has expired" };
    }

    // Check for inactivity (15 minutes)
    const inactivityPeriod = now - decodedToken.lastActivity;
    if (inactivityPeriod > 15 * 60 * 1000) {
      return { expired: true, reason: "Session expired due to inactivity" };
    }

    return { expired: false, reason: null };
  } catch (error) {
    return { expired: true, reason: "Invalid token" };
  }
};

const updateTokenActivity = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token));
      decodedToken.lastActivity = Date.now();
      localStorage.setItem("token", btoa(JSON.stringify(decodedToken)));
    } catch (error) {
      console.error("Error updating token activity:", error);
    }
  }
};

export { generateToken, isTokenExpired, updateTokenActivity };
