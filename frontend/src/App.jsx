import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Questionnaire from './pages/Questionnaire';
import DocumentUpload from './pages/DocumentUpload';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout component to include Navbar on all pages
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow flex items-start justify-center p-4 pt-10">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
            <Login />
          </div>
        } />
        <Route path="/signup" element={
          <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
            <Signup />
          </div>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/questionnaire" element={<ProtectedRoute><Layout><Questionnaire /></Layout></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Layout><DocumentUpload /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
