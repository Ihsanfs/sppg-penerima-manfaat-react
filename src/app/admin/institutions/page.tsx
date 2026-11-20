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
import { isAdmin } from "@/lib/permissions";
import type { Category, Institution, OptionsData } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";

const column = createColumn<Institution>();

type FormState = {
  nama: string; tipe: string; jenjang: string; category_id: string;
  alamat: string; penanggung_jawab: string; telepon: string; urutan: string;
  is_active: boolean; latitude: string; longitude: string;
};

const emptyForm: FormState = {
  nama: "", tipe: "sekolah", jenjang: "", category_id: "", alamat: "",
  penanggung_jawab: "", telepon: "", urutan: "0", is_active: true,
  latitude: "", longitude: "",
};

function toForm(row: Institution): FormState {
  return {
    nama: row.nama ?? "",
    tipe: row.tipe ?? "sekolah",
    jenjang: row.jenjang ?? "",
    category_id: row.category_id === null ? "" : String(row.category_id),
    alamat: row.alamat ?? "",
    penanggung_jawab: row.penanggung_jawab ?? "",
    telepon: row.telepon ?? "",
    urutan: String(row.urutan ?? 0),
    is_active: Boolean(row.is_active),
    latitude: row.latitude === null ? "" : String(row.latitude),
    longitude: row.longitude === null ? "" : String(row.longitude),
  };
}

function toPayload(form: FormState): Partial<Institution> {
  return {
    nama: form.nama.trim(),
    tipe: form.tipe,
    jenjang: form.jenjang.trim() || null,
    category_id: form.category_id === "" ? null : Number(form.category_id),
    alamat: form.alamat.trim() || null,
    penanggung_jawab: form.penanggung_jawab.trim() || null,
    telepon: form.telepon.trim() || null,
    urutan: Number(form.urutan) || 0,
    is_active: form.is_active,
    latitude: form.latitude === "" ? null : Number(form.latitude),
    longitude: form.longitude === "" ? null : Number(form.longitude),
  };
}

export default function InstitutionsPage() {
  const [rows, setRows] = useState<Institution[]>([]);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tipe, setTipe] = useState("");
  const [isActive, setIsActive] = useState("");
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
      const [institutions, optionData, categoryData, me] = await Promise.all([
        api.institutions({ tipe: tipe || undefined, is_active: isActive || undefined }),
        api.options(),
        api.categories(),
        api.me(),
      ]);
      setRows(institutions.data);
      setOptions(optionData);
      setCategories(categoryData.data.filter((item) => item.jenis === "lembaga"));
      setAdmin(isAdmin(me.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [tipe, isActive]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNotice(null);
    setFormOpen(true);
  };

  const openEdit = (row: Institution) => {
    setEditingId(row.id);
    setForm(toForm(row));
    setNotice(null);
    setFormOpen(true);
  };

  const remove = async (row: Institution) => {
    if (!window.confirm(`Hapus lembaga "${row.nama}"?`)) return;
    setError(null);
    try {
      await api.deleteInstitution(row.id);
      setNotice(`Lembaga "${row.nama}" dihapus.`);
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
        await api.updateInstitution(editingId, payload);
        setNotice("Data lembaga diperbarui.");
      } else {
        await api.createInstitution(payload);
        setNotice("Lembaga baru ditambahkan.");
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
    column.accessor("nama", {
      header: "Nama Lembaga",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("tipe", {
      header: "Tipe",
      cell: (info) => <Badge color="brand">{info.getValue()}</Badge>,
    }),
    column.accessor("jenjang", { header: "Jenjang", cell: (info) => info.getValue() || "-" }),
    column.accessor("category_nama", { header: "Kategori", cell: (info) => info.getValue() || "-" }),
    column.accessor("jumlah_penerima", { header: "Penerima", cell: (info) => info.getValue() ?? 0 }),
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
            title={admin ? "Hapus lembaga" : "Hanya admin yang dapat menghapus"}
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
        title="Lembaga"
        description={`${rows.length} lembaga terdaftar · sekolah dan posyandu mitra SPPG.`}
        action={<Button onClick={openCreate}><LuPlus className="size-4" /> Tambah Lembaga</Button>}
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && !rows.length ? (
        <LoadingState />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Daftar Lembaga"
          description="Sekolah dan posyandu yang menjadi mitra SPPG."
          searchPlaceholder="Cari nama atau alamat lembaga..."
          pageSize={10}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={tipe}
                onChange={(event) => setTipe(event.target.value)}
                className="h-10 w-full text-xs sm:w-36"
                aria-label="Filter tipe lembaga"
              >
                <option value="">Semua tipe</option>
                <option value="sekolah">Sekolah</option>
                <option value="posyandu">Posyandu</option>
              </Select>
              <Select
                value={isActive}
                onChange={(event) => setIsActive(event.target.value)}
                className="h-10 w-full text-xs sm:w-36"
                aria-label="Filter status lembaga"
              >
                <option value="">Semua status</option>
                <option value="true">Aktif</option>
                <option value="false">Non aktif</option>
              </Select>
            </div>
          }
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Ubah Lembaga" : "Tambah Lembaga"}
        description="Data lembaga dan koordinat untuk peta GIS."
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
          <FormField label="Nama Lembaga" required className="sm:col-span-2">
            <Input required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} />
          </FormField>
          <FormField label="Tipe">
            <Select value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value })}>
              <option value="sekolah">Sekolah</option>
              <option value="posyandu">Posyandu</option>
            </Select>
          </FormField>
          <FormField label="Jenjang">
            <Select value={form.jenjang} onChange={(event) => setForm({ ...form, jenjang: event.target.value })}>
              <option value="">Pilih jenjang</option>
              {options?.jenjang.map((item) => <option key={item.kode} value={item.kode}>{item.nama}</option>)}
            </Select>
          </FormField>
          <FormField label="Kategori Lembaga">
            <Select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
              <option value="">Pilih kategori</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
            </Select>
          </FormField>
          <FormField label="Urutan">
            <Input type="number" value={form.urutan} onChange={(event) => setForm({ ...form, urutan: event.target.value })} />
          </FormField>
          <FormField label="Alamat" className="sm:col-span-2">
            <Textarea value={form.alamat} onChange={(event) => setForm({ ...form, alamat: event.target.value })} />
          </FormField>
          <FormField label="Penanggung Jawab">
            <Input value={form.penanggung_jawab} onChange={(event) => setForm({ ...form, penanggung_jawab: event.target.value })} />
          </FormField>
          <FormField label="Telepon">
            <Input value={form.telepon} onChange={(event) => setForm({ ...form, telepon: event.target.value })} />
          </FormField>
          <FormField label="Latitude" hint="Contoh: -7.19">
            <Input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} placeholder="-7.19" />
          </FormField>
          <FormField label="Longitude" hint="Contoh: 107.88">
            <Input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} placeholder="107.88" />
          </FormField>
          <CheckboxField
            label="Lembaga aktif"
            description="Nonaktif tidak masuk rekap dan snapshot."
            checked={form.is_active}
            onChange={(checked) => setForm({ ...form, is_active: checked })}
          />
        </div>
      </Modal>
    </div>
  );
}
