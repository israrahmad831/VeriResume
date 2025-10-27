import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import AuthSuccess from "./pages/AuthSuccess/AuthSuccess";
import EmailVerification from "./pages/EmailVerification/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import JobSeekerDashboard from "./pages/JobSeekerDashboard/JobSeekerDashboard";
import HRDashboard from "./pages/HRDashboard/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* <Navbar /> */}
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route 
            path="/dashboardjob" 
            element={
              <ProtectedRoute requiredRole="jobseeker">
                <JobSeekerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboardhr" 
            element={
              <ProtectedRoute requiredRole="hr">
                <HRDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboardadmin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
