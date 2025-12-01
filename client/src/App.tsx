import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBooking';
import AdminDashboard from './pages/AdminDashboard';

// Guard Component to protect routes
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) return <div>Loading...</div>;

  return auth?.user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/my-bookings" element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;