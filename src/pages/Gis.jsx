import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Gis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/gis').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="loading">Memuat distribusi GIS…</div>;

  const profile = data.profile || {};
  const lat = Number(profile.latitude || -7.2275);
  const lng = Number(profile.longitude || 107.872);
  const d = 0.04;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  function distance(row) {
    if (!row.latitude || !row.longitude) return null;
    const R = 6371;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(Number(row.latitude) - lat);
    const dLon = toRad(Number(row.longitude) - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(Number(row.latitude))) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(2);
  }

  const withCoords = data.institutions.filter((i) => i.latitude && i.longitude);

  return (
    <>
      <div className="page-head">
        <h2>Distribusi GIS</h2>
        <p>Lokasi lembaga penerima manfaat relatif terhadap {profile.nama || 'SPPG'}.</p>
      </div>

      <div className="stat-grid">
        <div className="stat primary">
          <div className="stat-label">Lembaga Berkoordinat</div>
          <div className="stat-value">{withCoords.length}</div>
          <div className="stat-note">dari {data.institutions.length} lembaga aktif</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">Total Penerima</div>
          <div className="stat-value">{data.institutions.reduce((s, i) => s + i.jumlah, 0)}</div>
          <div className="stat-note">di lembaga berkoordinat</div>
        </div>
        <div className="stat">
          <div className="stat-label">Titik Pusat SPPG</div>
          <div className="stat-value" style={{ fontSize: 15, marginTop: 12 }}>{lat.toFixed(4)}, {lng.toFixed(4)}</div>
          <div className="stat-note">{profile.alamat || ''}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        <div className="card">
          <div className="card-head"><h3>Peta Sebaran</h3><span style={{ fontSize: 11, color: '#64748b' }}>OpenStreetMap</span></div>
          <div style={{ padding: 12 }}>
            <iframe
              title="Peta sebaran lembaga"
              src={mapSrc}
              style={{ width: '100%', height: 480, border: 0, borderRadius: 10 }}
              loading="lazy"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Daftar Lokasi</h3></div>
          <div className="table-wrap" style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Lembaga</th><th className="text-center">Penerima</th><th className="text-center">Jarak</th></tr></thead>
              <tbody>
                {data.institutions.length === 0 && <tr><td colSpan={3} className="empty">Belum ada lembaga.</td></tr>}
                {data.institutions.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="cell-main">{i.nama}</div>
                      <div className="cell-sub">{i.tipe} {i.jenjang ? `· ${i.jenjang}` : ''}</div>
                      {i.latitude && i.longitude && (
                        <a
                          className="cell-sub"
                          style={{ color: '#059669' }}
                          href={`https://www.openstreetmap.org/?mlat=${i.latitude}&mlon=${i.longitude}#map=16/${i.latitude}/${i.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {Number(i.latitude).toFixed(5)}, {Number(i.longitude).toFixed(5)} ↗
                        </a>
                      )}
                    </td>
                    <td className="text-center" style={{ fontWeight: 700 }}>{i.jumlah}</td>
                    <td className="text-center">{distance(i) ? `${distance(i)} km` : '—'}</td>
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
