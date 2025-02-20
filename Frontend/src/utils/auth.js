const generateToken = (user) => {
  // In a real application, this would be done on the server side
  // This is just for demonstration purposes
  const token = btoa(
    JSON.stringify({
      id: Math.random().toString(36).substr(2, 9),
      role: user.role,
      exp: Date.now() + 2 * 60 * 60 * 1000,
      //   exp: Date.now() + 5000,
    })
  );

  return token;
};

const isTokenExpired = (token) => {
  try {
    const decodedToken = JSON.parse(atob(token));
    return decodedToken.exp <= Date.now();
  } catch (error) {
    return true; // If token can't be decoded, consider it expired
  }
};

export { generateToken, isTokenExpired };
