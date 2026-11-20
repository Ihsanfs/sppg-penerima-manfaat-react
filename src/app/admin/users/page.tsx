"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { FormField, Input, Select } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import type { UserRecord } from "@/lib/types";
import { formatWaktu } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";

const column = createColumn<UserRecord>();

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const emptyForm: UserForm = { name: "", email: "", password: "", role: "petugas" };

export default function UsersPage() {
  const [rows, setRows] = useState<UserRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, me] = await Promise.all([api.users(), api.me()]);
      setRows(users.data);
      setCurrentUserId(me.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengguna.");
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

  const openEdit = (row: UserRecord) => {
    setEditingId(row.id);
    setForm({ name: row.name, email: row.email, password: "", role: row.role ?? "petugas" });
    setNotice(null);
    setFormOpen(true);
  };

  const remove = async (row: UserRecord) => {
    if (!window.confirm(`Hapus pengguna "${row.name}"?`)) return;
    setError(null);
    try {
      await api.deleteUser(row.id);
      setNotice(`Pengguna "${row.name}" dihapus.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    }
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.updateUser(editingId, form);
        setNotice("Pengguna diperbarui.");
      } else {
        await api.createUser(form);
        setNotice("Pengguna baru ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengguna.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    column.accessor("name", {
      header: "Nama",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("email", { header: "Email" }),
    column.accessor("role", {
      header: "Role",
      cell: (info) => <Badge color={info.getValue() === "admin" ? "success" : "info"}>{info.getValue() || "-"}</Badge>,
    }),
    column.accessor("created_at", { header: "Dibuat", cell: (info) => formatWaktu(info.getValue()) }),
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
            disabled={info.row.original.id === currentUserId}
            title={info.row.original.id === currentUserId ? "Tidak dapat menghapus akun sendiri" : "Hapus pengguna"}
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
        eyebrow="Pengaturan"
        title="Pengguna & Role"
        description="Kelola akun admin dan petugas. Hanya admin yang dapat mengakses halaman ini."
        action={<Button onClick={openCreate}><LuPlus className="size-4" /> Tambah Pengguna</Button>}
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && !rows.length ? (
        <LoadingState label="Memuat pengguna..." />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Daftar Pengguna"
          description="Perubahan role berlaku setelah pengguna login ulang."
          searchPlaceholder="Cari nama, email, atau role..."
          pageSize={10}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Ubah Pengguna" : "Tambah Pengguna"}
        description="Password kosong pada mode ubah berarti tidak diubah."
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
          <FormField label="Nama" required className="sm:col-span-2">
            <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </FormField>
          <FormField label="Email" required className="sm:col-span-2">
            <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </FormField>
          <FormField label={editingId ? "Password baru" : "Password"} required={!editingId}>
            <Input
              required={!editingId}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </FormField>
          <FormField label="Role">
            <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="petugas">Petugas</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
