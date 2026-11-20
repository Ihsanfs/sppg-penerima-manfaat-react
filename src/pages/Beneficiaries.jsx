import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY_FORM = {
  institution_id: '', nama: '', nik: '', nisn: '', jenis_kelamin: 'L',
  kategori: '', kelas: '', jurusan: '', status: 'aktif', bulan: '', tahun: '', keterangan: '',
};

export default function Beneficiaries() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [options, setOptions] = useState({ penerima: [], institutions: [] });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/options').then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, q: appliedQuery, status, institution_id: institutionId });
    api.get(`/beneficiaries?${params}`)
      .then((d) => { setRows(d.data); setTotal(d.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, appliedQuery, status, institutionId]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, kategori: options.penerima[0]?.kode || '' });
    setError('');
    setModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      institution_id: row.institution_id ?? '',
      nama: row.nama ?? '', nik: row.nik ?? '', nisn: row.nisn ?? '',
      jenis_kelamin: row.jenis_kelamin ?? 'L', kategori: row.kategori ?? '',
      kelas: row.kelas ?? '', jurusan: row.jurusan ?? '', status: row.status ?? 'aktif',
      bulan: row.bulan ?? '', tahun: row.tahun ?? '', keterangan: row.keterangan ?? '',
    });
    setError('');
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.put(`/beneficiaries/${editing.id}`, form);
      else await api.post('/beneficiaries', form);
      setModal(false);
      setNotice(editing ? 'Data penerima diperbarui.' : 'Penerima baru ditambahkan.');
      const params = new URLSearchParams({ page, limit, q: appliedQuery, status, institution_id: institutionId });
      api.get(`/beneficiaries?${params}`).then((d) => { setRows(d.data); setTotal(d.total); });
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Hapus penerima "${row.nama}"?`)) return;
    try {
      await api.delete(`/beneficiaries/${row.id}`);
      setNotice('Penerima dihapus.');
      const params = new URLSearchParams({ page, limit, q: appliedQuery, status, institution_id: institutionId });
      api.get(`/beneficiaries?${params}`).then((d) => { setRows(d.data); setTotal(d.total); });
    } catch (err) {
      setError(err.message);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="page-head">
        <h2>Penerima Manfaat</h2>
        <p>Kelola data penerima manfaat aktif. Perubahan tercatat di riwayat.</p>
      </div>

      {notice && <div className="error-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>{notice}</div>}
      {!modal && error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h3>Daftar Penerima ({total})</h3>
          <button className="btn primary" onClick={openCreate}>+ Tambah Penerima</button>
        </div>

        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <input
              className="input search" placeholder="Cari nama / NIK / NISN…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setAppliedQuery(query); } }}
            />
            <button className="btn sm" onClick={() => { setPage(1); setAppliedQuery(query); }}>Cari</button>
            <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="non_aktif">Nonaktif</option>
            </select>
            <select className="select" value={institutionId} onChange={(e) => { setPage(1); setInstitutionId(e.target.value); }}>
              <option value="">Semua lembaga</option>
              {options.institutions.map((i) => <option key={i.id} value={i.id}>{i.nama}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th><th>NIK / NISN</th><th>Lembaga</th><th>Kategori</th>
                <th className="text-center">Kelas</th><th className="text-center">Status</th><th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="empty">Memuat…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="empty">Tidak ada data.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="cell-main">{r.nama}</div>
                    <div className="cell-sub">{r.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  </td>
                  <td className="mono">{r.nik || r.nisn || '—'}</td>
                  <td>
                    <div>{r.institution_nama || '—'}</div>
                    <div className="cell-sub">{r.institution_tipe || ''}</div>
                  </td>
                  <td><span className="badge gray">{options.penerima.find((c) => c.kode === r.kategori)?.nama || r.kategori}</span></td>
                  <td className="text-center">{r.kelas ?? '—'}</td>
                  <td className="text-center"><span className={`badge ${r.status === 'aktif' ? 'green' : 'red'}`}>{r.status}</span></td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                    <button className="icon-btn" onClick={() => openEdit(r)} title="Ubah">✎</button>
                    <button className="icon-btn danger" onClick={() => remove(r)} title="Hapus">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Halaman {page} dari {pages} &middot; {total} data</span>
          <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal">
            <form onSubmit={save}>
              <div className="modal-head">
                <h3>{editing ? `Ubah: ${editing.nama}` : 'Tambah Penerima Baru'}</h3>
                <button type="button" className="icon-btn" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="error-box">{error}</div>}
                <div className="form-grid">
                  <div className="field full">
                    <label>Nama *</label>
                    <input className="input" required value={form.nama} onChange={(e) => setField('nama', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Lembaga *</label>
                    <select className="input" required value={form.institution_id} onChange={(e) => setField('institution_id', e.target.value)}>
                      <option value="">— Pilih lembaga —</option>
                      {options.institutions.map((i) => <option key={i.id} value={i.id}>{i.nama}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Kategori *</label>
                    <select className="input" required value={form.kategori} onChange={(e) => setField('kategori', e.target.value)}>
                      <option value="">— Pilih kategori —</option>
                      {options.penerima.map((c) => <option key={c.kode} value={c.kode}>{c.nama}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Jenis Kelamin *</label>
                    <select className="input" value={form.jenis_kelamin} onChange={(e) => setField('jenis_kelamin', e.target.value)}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Kelas</label>
                    <select className="input" value={form.kelas} onChange={(e) => setField('kelas', e.target.value)}>
                      <option value="">— Tidak ada —</option>
                      {[1, 2, 3, 4, 5, 6].map((k) => <option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>NIK</label>
                    <input className="input" value={form.nik} onChange={(e) => setField('nik', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>NISN</label>
                    <input className="input" value={form.nisn} onChange={(e) => setField('nisn', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Jurusan</label>
                    <input className="input" value={form.jurusan} onChange={(e) => setField('jurusan', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Bulan</label>
                    <select className="input" value={form.bulan} onChange={(e) => setField('bulan', e.target.value)}>
                      <option value="">—</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Tahun</label>
                    <input className="input" type="number" value={form.tahun} onChange={(e) => setField('tahun', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select className="input" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                      <option value="aktif">Aktif</option>
                      <option value="non_aktif">Nonaktif</option>
                      <option value="pindah">Pindah</option>
                    </select>
                  </div>
                  <div className="field full">
                    <label>Keterangan</label>
                    <textarea className="textarea" rows={3} value={form.keterangan} onChange={(e) => setField('keterangan', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn" onClick={() => setModal(false)}>Batal</button>
                <button type="submit" className="btn primary">{editing ? 'Simpan Perubahan' : 'Tambah Penerima'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
