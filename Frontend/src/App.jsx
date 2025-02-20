import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Login from "./pages/Login";
import UserConsole from "./pages/UserConsole";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/user-console"
            element={
              <ProtectedRoutes allowedRole="user">
                <UserConsole />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoutes allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoutes>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
