const generateToken = (user) => {
  // In a real application, this would be done on the server side
  // This is just for demonstration purposes
  const token = btoa(
    JSON.stringify({
      id: Math.random().toString(36).substr(2, 9),
      role: user.role,
      exp: Date.now() + 2 * 60 * 60 * 1000, // 2 hours expiration
    })
  );

  return token;
};

export { generateToken };
