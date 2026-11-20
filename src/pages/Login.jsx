import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      setToken(data.token);
      localStorage.setItem('sppg_user', JSON.stringify(data.user));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">SPPG</div>
        <h1>Masuk Admin</h1>
        <p>Kelola data penerima manfaat SPPG Samarang.</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="login-field">
            <label>Email</label>
            <input
              className="input" type="email" required autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sppg.test"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              className="input" type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>

        <div className="login-hint">
          Akun demo: <b>admin@sppg.test</b> / <b>password</b><br />
          atau <b>petugas@sppg.test</b> / <b>password</b>
        </div>
        <Link to="/" className="back-link">← Kembali ke data publik</Link>
      </div>
    </div>
  );
}
