import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="loading">Memuat ringkasan…</div>;

  const { counts, gender, rekap, snapshot, recent } = data;
  const max = Math.max(...rekap.map((r) => r.nilai), 1);

  return (
    <>
      <div className="page-head">
        <h2>Ringkasan</h2>
        <p>Data penerima manfaat aktif dari database PostgreSQL.</p>
      </div>

      <div className="stat-grid">
        <div className="stat primary">
          <div className="stat-label">Total Penerima</div>
          <div className="stat-value">{counts.aktif}</div>
          <div className="stat-note">penerima aktif</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Laki-laki</div>
          <div className="stat-value">{gender.L}</div>
          <div className="stat-note">orang</div>
        </div>
        <div className="stat pink">
          <div className="stat-label">Perempuan</div>
          <div className="stat-value">{gender.P}</div>
          <div className="stat-note">orang</div>
        </div>
        <div className="stat">
          <div className="stat-label">Lembaga</div>
          <div className="stat-value">{counts.lembaga}</div>
          <div className="stat-note">aktif</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">Laporan</div>
          <div className="stat-value">{counts.laporan}</div>
          <div className="stat-note">arsip harian</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        <div className="card">
          <div className="card-head"><h3>Rekap Kategori</h3><span style={{ fontSize: 12, color: '#64748b' }}>{snapshot.total} penerima</span></div>
          <div className="card-body">
            {rekap.map((r) => (
              <div className="bar-row" key={r.kode}>
                <div className="bar-label">{r.label}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.nilai / max) * 100}%` }} /></div>
                <div className="bar-value">{r.nilai}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Aktivitas Terbaru</h3><Link to="/admin/reports" className="btn sm">Lihat laporan</Link></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Aksi</th><th>Tanggal</th><th className="text-right">Selisih</th></tr></thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={3} className="empty">Belum ada aktivitas.</td></tr>}
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td><span className={`badge ${r.aksi === 'simpan' ? 'green' : r.aksi === 'update' ? 'blue' : 'gray'}`}>{r.aksi}</span></td>
                    <td>{r.tanggal_data}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: r.selisih > 0 ? '#059669' : r.selisih < 0 ? '#dc2626' : '#64748b' }}>
                      {r.selisih > 0 ? '+' : ''}{r.selisih}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
