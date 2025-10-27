import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import AuthSuccess from "./pages/AuthSuccess/AuthSuccess";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
      <AuthProvider>
        <BrowserRouter>
          <nav style={{ padding: 8 }}>
            <Link to="/">Home</Link> | <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link>
          </nav>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
};

export default App;
