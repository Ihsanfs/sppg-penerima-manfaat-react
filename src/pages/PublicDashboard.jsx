import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const KELAS = [1, 2, 3, 4, 5, 6];
const JENJANG_LABEL = {
  tk_paud: 'TK / PAUD', sd: 'SD', smp: 'SMP', sma: 'SMA', smk: 'SMK', slb: 'SLB', lainnya: 'Lainnya',
};
const dash = (v) => (v ? v : '—');

function Stat({ label, value, note, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function InstitutionTable({ rows, title }) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  return (
    <section className="card public-section">
      <div className="public-section-head">
        <h2>{title}</h2>
        <span>{rows.length} lembaga &middot; {total} penerima</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="text-center">No</th>
              <th>Nama {title}</th>
              <th className="text-center">TK/PAUD</th>
              {KELAS.map((k) => <th key={k} className="text-center">K{k}</th>)}
              <th className="text-center">SMK</th>
              <th className="text-center">Guru</th>
              <th className="text-center">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={11} className="text-center" style={{ color: '#94a3b8', padding: 26 }}>Belum ada data.</td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td className="text-center" style={{ color: '#94a3b8' }}>{i + 1}</td>
                <td>
                  <span className="cell-main">{row.nama}</span>
                  {row.jenjang && <span className="badge blue" style={{ marginLeft: 7 }}>{JENJANG_LABEL[row.jenjang] || row.jenjang}</span>}
                </td>
                <td className="text-center">{dash(row.jenjang === 'tk_paud' ? row.rincian.tk_paud : 0)}</td>
                {KELAS.map((k) => (
                  <td key={k} className="text-center">{dash(row.jenjang === 'sd' ? row.rincian['kelas_' + k] : 0)}</td>
                ))}
                <td className="text-center">{dash(row.jenjang === 'smk' ? row.rincian.smk : 0)}</td>
                <td className="text-center">{dash(row.rincian.guru)}</td>
                <td className="text-center" style={{ fontWeight: 800 }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PublicDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="loading"><div className="error-box" style={{ maxWidth: 520, margin: '60px auto' }}>{error}</div></div>;
  if (!data) return <div className="loading">Memuat data penerima manfaat…</div>;

  const profile = data.profile || {};
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date(data.tanggal + 'T00:00:00Z'));

  return (
    <div className="public-wrap">
      <header className="public-header">
        <div className="public-header-inner">
          <div className="public-brand">
            <div className="brand-mark">SPPG</div>
            <div>
              <div className="public-title">{profile.nama || 'SPPG Samarang'}</div>
              <div className="public-sub">
                {profile.kecamatan ? `Kec. ${profile.kecamatan}, ${profile.kabupaten}` : 'Data penerima manfaat'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-pill"><span className="live-dot" />LIVE</span>
            <Link to="/login" className="btn sm">Masuk Admin</Link>
          </div>
        </div>
      </header>

      <main className="public-main">
        <div className="public-heading">
          <h1>Data Penerima Manfaat</h1>
          <p>{tanggal} &middot; Data langsung dari penerima aktif</p>
          {data.savedToday?.saved_at && (
            <p style={{ fontSize: 11 }}>Terakhir disimpan {new Date(data.savedToday.saved_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
          )}
        </div>

        <div className="stat-grid">
          <Stat label="Total Penerima" value={data.snapshot.total} note="orang" tone="primary" />
          <Stat label="Laki-laki" value={data.jumlahLaki} note="orang" tone="blue" />
          <Stat label="Perempuan" value={data.jumlahPerempuan} note="orang" tone="pink" />
          <Stat label="Sekolah" value={data.sekolah.length} note={`${data.totalSekolah} penerima`} />
          <Stat label="Posyandu" value={data.posyandu.length} note={`${data.totalPosyandu} penerima`} />
        </div>

        <div className="card">
          <div className="public-section-head"><h2>Rekap per Kategori</h2><span>Ringkasan penerima aktif</span></div>
          <div className="card-body">
            {data.rekap.map((r) => {
              const max = Math.max(...data.rekap.map((x) => x.nilai), 1);
              return (
                <div className="bar-row" key={r.kode}>
                  <div className="bar-label">{r.label}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.nilai / max) * 100}%` }} /></div>
                  <div className="bar-value">{r.nilai}</div>
                </div>
              );
            })}
          </div>
        </div>

        <InstitutionTable rows={data.sekolah} title="Sekolah" />
        <InstitutionTable rows={data.posyandu} title="Posyandu" />

        <div className="public-footer">Data=penerima manfaat &middot; SPPG Samarang &middot; {data.tanggal}</div>
      </main>
    </div>
  );
}
