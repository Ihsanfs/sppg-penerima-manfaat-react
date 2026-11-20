"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { CheckboxField, FormField, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import { GRUP_LABELS } from "@/lib/constants";
import { isAdmin } from "@/lib/permissions";
import type { Category } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";

const column = createColumn<Category>();

type FormState = {
  kode: string; nama: string; jenis: string; grup: string; urutan: string;
  is_active: boolean; keterangan: string; has_class: boolean;
};

const emptyForm: FormState = {
  kode: "", nama: "", jenis: "penerima", grup: "", urutan: "0",
  is_active: true, keterangan: "", has_class: false,
};

function toForm(row: Category): FormState {
  return {
    kode: row.kode ?? "", nama: row.nama ?? "", jenis: row.jenis ?? "penerima",
    grup: row.grup ?? "", urutan: String(row.urutan ?? 0),
    is_active: Boolean(row.is_active), keterangan: row.keterangan ?? "",
    has_class: Boolean(row.has_class),
  };
}

function toPayload(form: FormState): Partial<Category> {
  return {
    kode: form.kode.trim().toLowerCase(),
    nama: form.nama.trim(),
    jenis: form.jenis,
    grup: form.grup.trim() || null,
    urutan: Number(form.urutan) || 0,
    is_active: form.is_active,
    keterangan: form.keterangan.trim() || null,
    has_class: form.has_class,
  };
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, me] = await Promise.all([api.categories(), api.me()]);
      setRows(result.data);
      setAdmin(isAdmin(me.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNotice(null);
    setFormOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditingId(row.id);
    setForm(toForm(row));
    setNotice(null);
    setFormOpen(true);
  };

  const remove = async (row: Category) => {
    if (!window.confirm(`Hapus kategori "${row.nama}"?`)) return;
    setError(null);
    try {
      await api.deleteCategory(row.id);
      setNotice(`Kategori "${row.nama}" dihapus.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await api.updateCategory(editingId, payload);
        setNotice("Kategori diperbarui.");
      } else {
        await api.createCategory(payload);
        setNotice("Kategori baru ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    column.accessor("kode", {
      header: "Kode",
      cell: (info) => <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">{info.getValue()}</span>,
    }),
    column.accessor("nama", {
      header: "Nama Kategori",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("jenis", {
      header: "Jenis",
      cell: (info) => <Badge color="info">{info.getValue()}</Badge>,
    }),
    column.accessor("grup", {
      header: "Grup Rekap",
      cell: (info) => (info.getValue() && GRUP_LABELS[info.getValue() as string]) || "-",
    }),
    column.accessor("has_class", {
      header: "Kelas",
      cell: (info) => (info.getValue() ? "Ya" : "-"),
    }),
    column.accessor("usage_count", { header: "Penerima", cell: (info) => info.getValue() ?? 0 }),
    column.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <Badge color={info.getValue() ? "success" : "warning"}>
          {info.getValue() ? "Aktif" : "Non aktif"}
        </Badge>
      ),
    }),
    column.display({
      id: "actions",
      header: "Aksi",
      cell: (info) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Ubah" onClick={() => openEdit(info.row.original)}>
            <LuPencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Hapus"
            title={admin ? "Hapus kategori" : "Hanya admin yang dapat menghapus"}
            disabled={!admin}
            onClick={() => void remove(info.row.original)}
          >
            <LuTrash2 className="size-4 text-red-500" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Data Master"
        title="Kategori"
        description={`${rows.length} kategori terdaftar · penerima, lembaga, dan jenjang.`}
        action={<Button onClick={openCreate}><LuPlus className="size-4" /> Tambah Kategori</Button>}
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && !rows.length ? (
        <LoadingState />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Daftar Kategori"
          description="Kategori aktif dipakai pada form penerima dan rekap laporan."
          searchPlaceholder="Cari kode atau nama kategori..."
          pageSize={10}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Ubah Kategori" : "Tambah Kategori"}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Kode" required hint="Huruf kecil, contoh: balita">
            <Input required value={form.kode} onChange={(event) => setForm({ ...form, kode: event.target.value })} placeholder="contoh: balita" />
          </FormField>
          <FormField label="Nama Kategori" required>
            <Input required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} />
          </FormField>
          <FormField label="Jenis">
            <Select value={form.jenis} onChange={(event) => setForm({ ...form, jenis: event.target.value })}>
              <option value="penerima">Penerima</option>
              <option value="lembaga">Lembaga</option>
              <option value="jenjang">Jenjang</option>
            </Select>
          </FormField>
          <FormField label="Grup Rekap">
            <Select value={form.grup} onChange={(event) => setForm({ ...form, grup: event.target.value })}>
              <option value="">Tanpa grup</option>
              {Object.entries(GRUP_LABELS).map(([kode, label]) => (
                <option key={kode} value={kode}>{label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Urutan">
            <Input type="number" value={form.urutan} onChange={(event) => setForm({ ...form, urutan: event.target.value })} />
          </FormField>
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} />
          </FormField>
          <CheckboxField label="Aktif" checked={form.is_active} onChange={(checked) => setForm({ ...form, is_active: checked })} />
          <CheckboxField
            label="Menggunakan kelas"
            description="Kategori ini memakai kolom kelas 1–6 pada rekap."
            checked={form.has_class}
            onChange={(checked) => setForm({ ...form, has_class: checked })}
          />
        </div>
      </Modal>
    </div>
  );
}
