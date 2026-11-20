import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api.js';
import Layout from './components/Layout.jsx';
import PublicDashboard from './pages/PublicDashboard.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Beneficiaries from './pages/Beneficiaries.jsx';
import Institutions from './pages/Institutions.jsx';
import Categories from './pages/Categories.jsx';
import Reports from './pages/Reports.jsx';
import Gis from './pages/Gis.jsx';

function Protected({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="institutions" element={<Institutions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="reports" element={<Reports />} />
        <Route path="gis" element={<Gis />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
