import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY = { kode: '', nama: '', jenis: 'penerima', grup: '', urutan: 0, is_active: true, keterangan: '', has_class: false };
const JENIS = { penerima: 'Penerima Manfaat', lembaga: 'Lembaga', jenjang: 'Jenjang Sekolah' };
const GRUP = ['tk_paud', 'sd_1_3', 'sd_4_6', 'smk', 'guru', 'balita', 'bumil', 'busui', 'kader'];

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/categories').then((d) => setRows(d.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const visible = filter ? rows.filter((r) => r.jenis === filter) : rows;

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, jenis: filter || 'penerima' });
    setError('');
    setModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      kode: row.kode ?? '', nama: row.nama ?? '', jenis: row.jenis ?? 'penerima',
      grup: row.grup ?? '', urutan: row.urutan ?? 0, is_active: Boolean(row.is_active),
      keterangan: row.keterangan ?? '', has_class: Boolean(row.has_class),
    });
    setError('');
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.put(`/categories/${editing.id}`, form);
      else await api.post('/categories', form);
      setModal(false);
      setNotice(editing ? 'Kategori diperbarui.' : 'Kategori ditambahkan.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Hapus kategori "${row.nama}"?`)) return;
    try {
      await api.delete(`/categories/${row.id}`);
      setNotice('Kategori dihapus.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Kategori</h2>
        <p>Kategori penerima, lembaga, dan jenjang sekolah.</p>
      </div>

      {notice && <div className="error-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}
      {!modal && error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h3>Daftar Kategori ({visible.length})</h3>
          <div style={{ display: 'flex', gap: 9 }}>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Semua jenis</option>
              <option value="penerima">Penerima Manfaat</option>
              <option value="lembaga">Lembaga</option>
              <option value="jenjang">Jenjang Sekolah</option>
            </select>
            <button className="btn primary" onClick={openCreate}>+ Tambah Kategori</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th><th>Nama</th><th>Jenis</th><th>Grup Laporan</th>
                <th className="text-center">Urutan</th><th className="text-center">Digunakan</th>
                <th className="text-center">Status</th><th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="empty">Memuat…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={8} className="empty">Tidak ada data.</td></tr>}
              {visible.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.kode}</td>
                  <td className="cell-main">{r.nama}</td>
                  <td><span className="badge gray">{JENIS[r.jenis] || r.jenis}</span></td>
                  <td>{r.grup ? <span className="badge blue">{r.grup}</span> : '—'}</td>
                  <td className="text-center">{r.urutan}</td>
                  <td className="text-center">{r.usage_count + r.institution_count}</td>
                  <td className="text-center"><span className={`badge ${r.is_active ? 'green' : 'red'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                    <button className="icon-btn" onClick={() => openEdit(r)} title="Ubah">✎</button>
                    <button className="icon-btn danger" onClick={() => remove(r)} title="Hapus">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal">
            <form onSubmit={save}>
              <div className="modal-head">
                <h3>{editing ? `Ubah: ${editing.nama}` : 'Tambah Kategori'}</h3>
                <button type="button" className="icon-btn" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="error-box">{error}</div>}
                <div className="form-grid">
                  <div className="field">
                    <label>Kode *</label>
                    <input className="input mono" required value={form.kode} onChange={(e) => setField('kode', e.target.value)} placeholder="contoh: balita" />
                  </div>
                  <div className="field">
                    <label>Nama *</label>
                    <input className="input" required value={form.nama} onChange={(e) => setField('nama', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Jenis *</label>
                    <select className="input" value={form.jenis} onChange={(e) => setField('jenis', e.target.value)}>
                      {Object.entries(JENIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Grup Laporan</label>
                    <select className="input" value={form.grup} onChange={(e) => setField('grup', e.target.value)}>
                      <option value="">— Tidak ada —</option>
                      {GRUP.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Urutan</label>
                    <input className="input" type="number" value={form.urutan} onChange={(e) => setField('urutan', e.target.value)} />
                  </div>
                  <div className="field full">
                    <label>Keterangan</label>
                    <textarea className="textarea" rows={2} value={form.keterangan} onChange={(e) => setField('keterangan', e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="checkbox-row">
                      <input id="cat-active" type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                      <label htmlFor="cat-active">Aktif</label>
                    </div>
                  </div>
                  <div className="field">
                    <div className="checkbox-row">
                      <input id="cat-class" type="checkbox" checked={form.has_class} onChange={(e) => setField('has_class', e.target.checked)} />
                      <label htmlFor="cat-class">Mempunyai kelas</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn" onClick={() => setModal(false)}>Batal</button>
                <button type="submit" className="btn primary">{editing ? 'Simpan Perubahan' : 'Tambah Kategori'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
