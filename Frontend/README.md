# Authentication System Documentation

This document provides a detailed explanation of the authentication system implemented in our React application.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Components and Files](#components-and-files)
4. [Code Examples](#code-examples)
5. [Security Considerations](#security-considerations)

## Overview

The authentication system implements a role-based access control (RBAC) system with JWT-like tokens. It supports two types of users:

- Regular users (role: 'user')
- Administrators (role: 'admin')

## Authentication Flow

1. **Initial Access**

   - User visits the application
   - If no valid token exists, redirected to login
   - If token exists, user state is restored from localStorage

2. **Login Process**

   ```javascript
   // Login.jsx
   const handleSubmit = (e) => {
     e.preventDefault();
     if (isUser) {
       if (credentials.id === "user" && credentials.password === "password") {
         const userData = {
           id: credentials.id,
           role: "user",
         };
         const token = generateToken(userData);
         login(userData, token);
         navigate("/user-console");
       }
     }
   };
   ```

3. **Token Generation**

   ```javascript
   // utils/auth.js
   const generateToken = (user) => {
     const token = btoa(
       JSON.stringify({
         id: Math.random().toString(36).substr(2, 9),
         role: user.role,
         exp: Date.now() + 2 * 60 * 60 * 1000, // 2 hours expiration
       })
     );
     return token;
   };
   ```

4. **Authentication State Management**

   ```javascript
   // context/AuthContext.jsx
   const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null);

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

     // ... rest of the provider code
   };
   ```

5. **Protected Routes**

   ```javascript
   // components/ProtectedRoute.jsx
   const ProtectedRoute = ({ children, allowedRole }) => {
     const { user } = useAuth();
     const location = useLocation();

     if (!user) {
       return <Navigate to="/login" state={{ from: location }} replace />;
     }

     if (allowedRole && user.role !== allowedRole) {
       return (
         <Navigate
           to={user.role === "admin" ? "/admin-dashboard" : "/user-console"}
           replace
         />
       );
     }

     return children;
   };
   ```

## Components and Files

### 1. AuthContext (context/AuthContext.jsx)

- Manages global authentication state
- Provides login/logout functions
- Handles token persistence
- Usage example:
  ```javascript
  const { user, login, logout } = useAuth();
  ```

### 2. ProtectedRoute (components/ProtectedRoute.jsx)

- Guards routes based on authentication and role
- Redirects unauthorized access
- Implementation in App.jsx:
  ```javascript
  <Route
    path="/user-console"
    element={
      <ProtectedRoute allowedRole="user">
        <UserConsole />
      </ProtectedRoute>
    }
  />
  ```

### 3. Login Component (pages/Login.jsx)

- Handles user authentication
- Manages login form state
- Performs credential validation
- Initiates token generation and storage

### 4. Auth Utilities (utils/auth.js)

- Contains token generation logic
- Handles token format and expiration

## Code Examples

### Using Authentication in Components

```javascript
// Example of a protected component
const UserConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Welcome, {user.id}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
```

### Route Protection in App.jsx

```javascript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/user-console"
            element={
              <ProtectedRoute allowedRole="user">
                <UserConsole />
              </ProtectedRoute>
            }
          />
          {/* ... other routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

## Security Considerations

1. **Token Storage**

   - Currently stored in localStorage
   - In production, consider using HTTP-only cookies

2. **Token Generation**

   - Current implementation is for demonstration
   - Should be handled server-side in production

3. **Password Handling**

   - Current implementation uses plain text
   - Should use proper hashing in production

4. **Token Expiration**

   - Tokens expire after 2 hours
   - Implement refresh token mechanism in production

5. **Role-Based Access**
   - Currently implements basic role checking
   - Consider implementing more granular permissions

## Production Recommendations

1. Implement proper JWT token generation on the server
2. Add password hashing and salting
3. Use secure HTTP-only cookies for token storage
4. Implement token refresh mechanism
5. Add proper error handling and loading states
6. Implement proper session management
7. Add rate limiting for login attempts
8. Implement proper password recovery flow
9. Add multi-factor authentication
10. Implement proper logging and monitoring
