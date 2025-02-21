import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import UserConsole from "./pages/UserConsole";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedWithPasswordCheck({ allowedRole, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.passwordChanged) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route
            path="/user-console"
            element={
              <ProtectedWithPasswordCheck allowedRole="user">
                <UserConsole />
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminDashboard />
              </ProtectedWithPasswordCheck>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
