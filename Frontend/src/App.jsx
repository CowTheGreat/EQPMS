import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import UserConsole from "./pages/UserConsole";
import AdminDashboard from "./pages/AdminDashboard";
import AssignQP from "./pages/AssignQP";
import AccessQP from "./pages/AccessQP";
import AddUser from "./pages/AddUser";
import AddSubjects from "./pages/AddSubjects";
import DeleteSubject from "./pages/DeleteSubject";
import Settings from "./pages/Settings";
import AdminSidebar from "../src/components/AdminSidebar/AdminSidebar";

function ProtectedWithPasswordCheck({ allowedRole, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.passwordChanged === false || user.passwordChanged === 0) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />
      <div style={{ flexGrow: 1, padding: "20px" }}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* User Routes */}
          <Route
            path="/user-console"
            element={
              <ProtectedWithPasswordCheck allowedRole="user">
                <UserConsole />
              </ProtectedWithPasswordCheck>
            }
          />

          {/* Admin Routes with Sidebar */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/assign-qp"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <AssignQP />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/access-qp"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <AccessQP />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/add-user"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <AddUser />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/add-subject"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <AddSubjects />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/delete-subject"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <DeleteSubject />
                </AdminLayout>
              </ProtectedWithPasswordCheck>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedWithPasswordCheck allowedRole="admin">
                <AdminLayout>
                  <Settings />
                </AdminLayout>
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
