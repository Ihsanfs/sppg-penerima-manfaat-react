import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY = {
  nama: '', tipe: 'sekolah', jenjang: '', category_id: '', alamat: '',
  penanggung_jawab: '', telepon: '', urutan: 0, is_active: true, latitude: '', longitude: '',
};
const TIPE = { sekolah: 'Sekolah', posyandu: 'Posyandu' };

export default function Institutions() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ lembaga: [], jenjang: [], categories: [] });
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/institutions?q=${encodeURIComponent(appliedQ)}`)
      .then((d) => setRows(d.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [appliedQ]);
  useEffect(() => {
    Promise.all([api.get('/options'), api.get('/categories')])
      .then(([opt, cats]) => setOptions({ ...opt, categories: cats.data.filter((c) => c.jenis === 'lembaga') }))
      .catch(() => {});
  }, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError('');
    setModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      nama: row.nama ?? '', tipe: row.tipe ?? 'sekolah', jenjang: row.jenjang ?? '',
      category_id: row.category_id ?? '', alamat: row.alamat ?? '',
      penanggung_jawab: row.penanggung_jawab ?? '', telepon: row.telepon ?? '',
      urutan: row.urutan ?? 0, is_active: Boolean(row.is_active),
      latitude: row.latitude ?? '', longitude: row.longitude ?? '',
    });
    setError('');
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.put(`/institutions/${editing.id}`, form);
      else await api.post('/institutions', form);
      setModal(false);
      setNotice(editing ? 'Lembaga diperbarui.' : 'Lembaga ditambahkan.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Hapus lembaga "${row.nama}"?`)) return;
    try {
      await api.delete(`/institutions/${row.id}`);
      setNotice('Lembaga dihapus.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Lembaga</h2>
        <p>Sekolah dan posyandu tempat penerima manfaat terdaftar.</p>
      </div>

      {notice && <div className="error-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}
      {!modal && error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h3>Daftar Lembaga ({rows.length})</h3>
          <button className="btn primary" onClick={openCreate}>+ Tambah Lembaga</button>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <input className="input search" placeholder="Cari nama / alamat…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setAppliedQ(q); }} />
            <button className="btn sm" onClick={() => setAppliedQ(q)}>Cari</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th><th>Tipe</th><th>Jenjang</th><th>Kategori</th>
                <th className="text-center">Penerima</th><th className="text-center">Status</th><th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="empty">Memuat…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="empty">Tidak ada data.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="cell-main">{r.nama}</div>
                    <div className="cell-sub">{r.alamat || '—'}</div>
                  </td>
                  <td><span className={`badge ${r.tipe === 'sekolah' ? 'blue' : 'amber'}`}>{TIPE[r.tipe] || r.tipe}</span></td>
                  <td>{options.jenjang.find((j) => j.kode === r.jenjang)?.nama || r.jenjang || '—'}</td>
                  <td>{r.category_nama || '—'}</td>
                  <td className="text-center" style={{ fontWeight: 700 }}>{r.jumlah_penerima}</td>
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
                <h3>{editing ? `Ubah: ${editing.nama}` : 'Tambah Lembaga'}</h3>
                <button type="button" className="icon-btn" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="error-box">{error}</div>}
                <div className="form-grid">
                  <div className="field full">
                    <label>Nama Lembaga *</label>
                    <input className="input" required value={form.nama} onChange={(e) => setField('nama', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Tipe *</label>
                    <select className="input" value={form.tipe} onChange={(e) => setField('tipe', e.target.value)}>
                      <option value="sekolah">Sekolah</option>
                      <option value="posyandu">Posyandu</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Jenjang</label>
                    <select className="input" value={form.jenjang} onChange={(e) => setField('jenjang', e.target.value)}>
                      <option value="">— Tidak ada —</option>
                      {options.jenjang.map((j) => <option key={j.kode} value={j.kode}>{j.nama}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Kategori Lembaga</label>
                    <select className="input" value={form.category_id} onChange={(e) => setField('category_id', e.target.value)}>
                      <option value="">— Tidak ada —</option>
                      {options.categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Urutan</label>
                    <input className="input" type="number" value={form.urutan} onChange={(e) => setField('urutan', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Penanggung Jawab</label>
                    <input className="input" value={form.penanggung_jawab} onChange={(e) => setField('penanggung_jawab', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Telepon</label>
                    <input className="input" value={form.telepon} onChange={(e) => setField('telepon', e.target.value)} />
                  </div>
                  <div className="field full">
                    <label>Alamat</label>
                    <textarea className="textarea" rows={2} value={form.alamat} onChange={(e) => setField('alamat', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Latitude</label>
                    <input className="input" type="number" step="any" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} placeholder="-7.2275" />
                  </div>
                  <div className="field">
                    <label>Longitude</label>
                    <input className="input" type="number" step="any" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} placeholder="107.8720" />
                  </div>
                  <div className="field">
                    <div className="checkbox-row">
                      <input id="inst-active" type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                      <label htmlFor="inst-active">Lembaga aktif</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn" onClick={() => setModal(false)}>Batal</button>
                <button type="submit" className="btn primary">{editing ? 'Simpan Perubahan' : 'Tambah Lembaga'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
