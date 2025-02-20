import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import UserConsole from "./pages/UserConsole";
import AdminDashboard from "./pages/AdminDashboard";
import SessionAlert from "./components/SessionAlert";

function AppContent() {
  return (
    <>
      <SessionAlert />
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
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
