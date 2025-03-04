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
import FacultyList from "./pages/FacultyList";
import Admin2 from "./pages/Admin2";
import DropdownComponent from "./pages/DropdownComponent";

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
          <Route path="/faculty" element={<FacultyList />} />
          <Route path="/admin" element={<Admin2 />} />
          <Route path="/drop" element={<DropdownComponent/>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
