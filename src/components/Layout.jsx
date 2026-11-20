import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearToken } from '../api.js';

const nav = [
  { to: '/admin', label: 'Ringkasan', icon: '▦', end: true },
  { to: '/admin/beneficiaries', label: 'Penerima Manfaat', icon: '♙' },
  { to: '/admin/institutions', label: 'Lembaga', icon: '▣' },
  { to: '/admin/categories', label: 'Kategori', icon: '◷' },
  { to: '/admin/reports', label: 'Laporan Harian', icon: '▤' },
  { to: '/admin/gis', label: 'Distribusi GIS', icon: '◇' },
];

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('sppg_user') || '{}');
  } catch {
    return {};
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = currentUser();
  const active = nav.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  function logout() {
    clearToken();
    localStorage.removeItem('sppg_user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">SPPG</div>
          <div>
            <div className="brand-name">SPPG Samarang</div>
            <div className="brand-sub">Penerima Manfaat</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Menu Utama</div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-label">Lainnya</div>
          <NavLink to="/" className="nav-item">
            <span className="nav-icon">↗</span>
            <span>Halaman Publik</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout}>Keluar</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{active?.label || 'SPPG Samarang'}</h1>
          <div className="topbar-user">
            <div className="avatar">{(user.name || 'A').slice(0, 1).toUpperCase()}</div>
            <span>{user.name || 'Administrator'}</span>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
