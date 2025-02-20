Authentication Context (AuthContext.jsx)

Creates a central authentication state using React Context
Manages:
User state (logged in user information)
Login function (stores user data and token)
Logout function (clears user data and token)
Persists authentication using localStorage
Provides authentication state to the entire app
Protected Route Component (ProtectedRoute.jsx)

Guards routes that require authentication
Checks:
If user is authenticated (has valid user data)
If user has the correct role for the route
Redirects:
To login if not authenticated
To appropriate dashboard if wrong role
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

Creates a simple JWT-like token (mock implementation)
Includes:
Random ID
User role
Expiration time
In production, this would be handled by a server
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
Authentication Flow:

User visits protected route
↓
ProtectedRoute checks auth state
↓
No auth? → Redirect to login
↓
User logs in
↓
Token generated & stored
↓
User data saved in context
↓
Redirect to protected route
↓
ProtectedRoute allows access
Persistence:

Token and user data stored in localStorage
On page refresh:

useEffect(() => {
const token = localStorage.getItem('token');
if (token) {
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
setUser(userInfo);
}
}, []);
Logout Flow:

const handleLogout = () => {
logout(); // Clears context & localStorage
navigate('/login'); // Redirects to login
};
This implementation provides a complete authentication system with:

Role-based access control
Protected routes
Persistent authentication
Centralized auth state
Token-based authentication
Remember that in a production environment, you'd want to:

Generate tokens on the server
Use secure HTTP-only cookies
Implement proper token validation
Add token refresh mechanism
Add proper error handling
Use real password hashing and validation
