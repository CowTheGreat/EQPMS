Authentication System

This project implements a React authentication system with role-based access control, protected routes, token-based authentication, and persistent authentication using localStorage.

Authentication Context (AuthContext.jsx)

Creates a central authentication state using React Context.

Manages:

User state (logged-in user information).

Login function (stores user data and token).

Logout function (clears user data and token).

Authentication persistence using localStorage.

Provides authentication state across the entire app.

Protected Route Component (ProtectedRoute.jsx)

Guards routes that require authentication.

Checks:

If the user is authenticated (has valid user data).

If the user has the correct role for the route.

Redirects:

To login if not authenticated.

To the appropriate dashboard if the role is incorrect.

Login Flow (Login.jsx)

// When user submits login form
if (credentials.id === 'user' && credentials.password === 'password') {
const userData = {
id: credentials.id,
role: 'user'
};
const token = generateToken(userData); // Generate JWT token
login(userData, token); // Store in context & localStorage
navigate('/user-console'); // Redirect to dashboard
}

Token Generation (auth.js)

Creates a simple JWT-like token (mock implementation).

Includes:

Random ID

User role

Expiration time

In production:

Token generation should be handled by a secure server.

App Structure (App.jsx)

<AuthProvider> {/_ Provides auth context _/}
<Router>
<Routes>
<Route path="/login" element={<Login />} />
<Route
path="/user-console"
element={
<ProtectedRoute allowedRole="user"> {/_ Guards route _/}
<UserConsole />
</ProtectedRoute>
}
/>
</Routes>
</Router>
</AuthProvider>

Authentication Flow

User visits a protected route.

ProtectedRoute checks authentication state.

If not authenticated → Redirects to login.

User logs in.

Token is generated & stored.

User data is saved in context.

Redirects to the protected route.

ProtectedRoute allows access.

Persistence

Token and user data stored in localStorage.

On page refresh:

useEffect(() => {
const token = localStorage.getItem('token');
if (token) {
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
setUser(userInfo);
}
}, []);

Logout Flow

const handleLogout = () => {
logout(); // Clears context & localStorage
navigate('/login'); // Redirects to login
};

Features

✅ Role-based access control✅ Protected routes✅ Persistent authentication✅ Centralized authentication state✅ Token-based authentication

Production Considerations

⚠️ Generate tokens on a secure server⚠️ Use HTTP-only secure cookies⚠️ Implement proper token validation⚠️ Add a token refresh mechanism⚠️ Implement real password hashing and validation⚠️ Improve error handling
