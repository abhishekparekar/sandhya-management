import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Sales from './pages/Sales';
import Telecalling from './pages/Telecalling';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Certificates from './pages/Certificates';
import Documents from './pages/Documents';
import IDCards from './pages/IDCards';
import Reports from './pages/Reports';
import Internship from './pages/Internship';
import Progress from './pages/Progress';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="sales" element={<Sales />} />
            <Route path="telecalling" element={<Telecalling />} />
            <Route path="employees" element={<Employees />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="internship" element={<Internship />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="id-cards" element={<IDCards />} />
            <Route path="documents" element={<Documents />} />
            <Route path="progress" element={<Progress />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
