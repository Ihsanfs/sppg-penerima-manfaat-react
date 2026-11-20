import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [tanggal, setTanggal] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [catatan, setCatatan] = useState('');

  const load = () => {
    api.get(`/daily-reports?page=${page}&limit=${limit}`)
      .then((d) => { setRows(d.data); setTotal(d.total); })
      .catch((e) => setError(e.message));
  };
  useEffect(() => { load(); }, [page]);

  async function openDetail(id) {
    try {
      setDetail(await api.get(`/daily-reports/${id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveSnapshot() {
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const result = await api.post('/daily-reports/save', { tanggal, catatan, sumber: 'manual' });
      setNotice(`Snapshot tersimpan: ${result.total} penerima pada ${tanggal}.`);
      setPage(1);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="page-head">
        <h2>Laporan Harian</h2>
        <p>Simpan snapshot jumlah penerima manfaat per tanggal.</p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {notice && <div className="error-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><h3>Simpan Snapshot</h3></div>
        <div className="card-body">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <input className="input" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            <input className="input" style={{ maxWidth: 340 }} placeholder="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <button className="btn primary" onClick={saveSnapshot} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Snapshot Hari Ini'}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Arsip Laporan ({total})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th><th className="text-center">Total</th><th>Sumber</th><th>Catatan</th><th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="empty">Belum ada laporan.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="cell-main">{r.tanggal}</td>
                  <td className="text-center" style={{ fontWeight: 800 }}>{r.total}</td>
                  <td><span className={`badge ${r.sumber === 'manual' ? 'green' : 'gray'}`}>{r.sumber}</span></td>
                  <td style={{ color: '#64748b' }}>{r.catatan || '—'}</td>
                  <td className="text-right"><button className="btn sm" onClick={() => openDetail(r.id)}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Halaman {page} dari {pages}</span>
          <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {detail && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <div className="modal-head">
              <h3>Detail Laporan — {detail.report.tanggal}</h3>
              <button className="icon-btn" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="stat-grid" style={{ marginBottom: 18 }}>
                <div className="stat primary"><div className="stat-label">Total</div><div className="stat-value">{detail.report.total}</div></div>
                <div className="stat"><div className="stat-label">Sumber</div><div className="stat-value" style={{ fontSize: 18 }}>{detail.report.sumber}</div></div>
                <div className="stat"><div className="stat-label">Disimpan Oleh</div><div className="stat-value" style={{ fontSize: 18 }}>{detail.report.saved_by_name || '—'}</div></div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Lembaga</th><th>Tipe</th><th className="text-center">Total</th></tr></thead>
                  <tbody>
                    {detail.details.map((d) => (
                      <tr key={d.id}>
                        <td>{d.institution_nama || `Lembaga #${d.institution_id}`}</td>
                        <td>{d.institution_tipe || '—'}</td>
                        <td className="text-center" style={{ fontWeight: 700 }}>{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
