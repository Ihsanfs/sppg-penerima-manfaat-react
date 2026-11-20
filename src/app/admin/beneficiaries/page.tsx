"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import { isAdmin } from "@/lib/permissions";
import type {
  AuthUser,
  Beneficiary,
  BeneficiaryHistory,
  OptionsData,
} from "@/lib/types";
import { formatWaktu } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { LuHistory, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";

const column = createColumn<Beneficiary>();
const historyColumn = createColumn<BeneficiaryHistory>();

type FormState = {
  institution_id: string;
  nama: string;
  nik: string;
  nisn: string;
  jenis_kelamin: string;
  kategori: string;
  kelas: string;
  jurusan: string;
  status: string;
  bulan: string;
  tahun: string;
  keterangan: string;
  alasan: string;
};

const emptyForm: FormState = {
  institution_id: "", nama: "", nik: "", nisn: "", jenis_kelamin: "L",
  kategori: "", kelas: "", jurusan: "", status: "aktif", bulan: "",
  tahun: String(new Date().getFullYear()), keterangan: "", alasan: "",
};

function toForm(row: Beneficiary): FormState {
  return {
    institution_id: String(row.institution_id ?? ""),
    nama: row.nama ?? "",
    nik: row.nik ?? "",
    nisn: row.nisn ?? "",
    jenis_kelamin: row.jenis_kelamin ?? "L",
    kategori: row.kategori ?? "",
    kelas: row.kelas === null ? "" : String(row.kelas),
    jurusan: row.jurusan ?? "",
    status: row.status ?? "aktif",
    bulan: row.bulan === null ? "" : String(row.bulan),
    tahun: row.tahun === null ? "" : String(row.tahun),
    keterangan: row.keterangan ?? "",
    alasan: "",
  };
}

function toPayload(form: FormState, editing: boolean): Partial<Beneficiary> {
  const payload: Partial<Beneficiary> = {
    institution_id: Number(form.institution_id),
    nama: form.nama.trim(),
    nik: form.nik.trim() || null,
    nisn: form.nisn.trim() || null,
    jenis_kelamin: form.jenis_kelamin,
    kategori: form.kategori,
    kelas: form.kelas === "" ? null : Number(form.kelas),
    jurusan: form.jurusan.trim() || null,
    status: form.status,
    bulan: form.bulan === "" ? null : Number(form.bulan),
    tahun: form.tahun === "" ? null : Number(form.tahun),
    keterangan: form.keterangan.trim() || null,
  };
  if (editing) payload.alasan = form.alasan.trim();
  return payload;
}

export default function BeneficiariesPage() {
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [kategori, setKategori] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{
    id: number;
    nama: string;
    data: BeneficiaryHistory[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const admin = isAdmin(currentUser);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [beneficiaries, optionData, me] = await Promise.all([
        api.beneficiaries({
          status,
          institution_id: institutionId || undefined,
          kategori: kategori || undefined,
          jenis_kelamin: jenisKelamin || undefined,
        }),
        api.options(),
        api.me(),
      ]);
      setRows(beneficiaries.data);
      setOptions(optionData);
      setCurrentUser(me.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [status, institutionId, kategori, jenisKelamin]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      institution_id: options?.institutions[0] ? String(options.institutions[0].id) : "",
      kategori: options?.penerima[0]?.kode ?? "",
    });
    setNotice(null);
    setFormOpen(true);
  };

  const openEdit = (row: Beneficiary) => {
    setEditingId(row.id);
    setForm(toForm(row));
    setNotice(null);
    setFormOpen(true);
  };

  const openHistory = async (row: Beneficiary) => {
    setHistory({ id: row.id, nama: row.nama, data: [] });
    setHistoryLoading(true);
    setError(null);
    try {
      const result = await api.beneficiaryHistory(row.id);
      setHistory({ id: row.id, nama: row.nama, data: result.data });
    } catch (err) {
      setHistory(null);
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const remove = async (row: Beneficiary) => {
    if (!window.confirm(`Hapus penerima "${row.nama}"?`)) return;
    setError(null);
    setNotice(null);
    try {
      await api.deleteBeneficiary(row.id);
      setNotice(`Penerima "${row.nama}" dihapus.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  };

  const submit = async () => {
    if (editingId && !form.alasan.trim()) {
      setError("Alasan perubahan wajib diisi saat mengubah data penerima.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form, Boolean(editingId));
      if (editingId) {
        await api.updateBeneficiary(editingId, payload);
        setNotice("Data penerima diperbarui.");
      } else {
        await api.createBeneficiary(payload);
        setNotice("Penerima baru ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const columns = [
    column.accessor("nama", {
      header: "Nama",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("institution_nama", {
      header: "Lembaga",
      cell: (info) => info.getValue() || "-",
    }),
    column.accessor("kategori", { header: "Kategori" }),
    column.accessor("jenis_kelamin", { header: "JK" }),
    column.accessor("kelas", {
      header: "Kelas",
      cell: (info) => info.getValue() ?? "-",
    }),
    column.accessor("status", {
      header: "Status",
      cell: (info) => {
        const value = String(info.getValue());
        return (
          <Badge color={value === "aktif" ? "success" : "warning"}>
            {value === "aktif" ? "Aktif" : value === "non_aktif" ? "Non aktif" : value}
          </Badge>
        );
      },
    }),
    column.display({
      id: "actions",
      header: "Aksi",
      cell: (info) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Riwayat" onClick={() => void openHistory(info.row.original)}>
            <LuHistory className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Ubah" onClick={() => openEdit(info.row.original)}>
            <LuPencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Hapus"
            title={admin ? "Hapus penerima" : "Hanya admin yang dapat menghapus"}
            disabled={!admin}
            onClick={() => void remove(info.row.original)}
          >
            <LuTrash2 className="size-4 text-red-500" />
          </Button>
        </div>
      ),
    }),
  ];

  const historyColumns = [
    historyColumn.accessor("created_at", {
      header: "Waktu",
      cell: (info) => formatWaktu(info.getValue()),
    }),
    historyColumn.accessor("aksi", {
      header: "Aksi",
      cell: (info) => <Badge color="brand">{String(info.getValue())}</Badge>,
    }),
    historyColumn.accessor("alasan", {
      header: "Alasan",
      cell: (info) => info.getValue() || "-",
    }),
    historyColumn.accessor("user_name", {
      header: "Petugas",
      cell: (info) => info.getValue() || "-",
    }),
    historyColumn.accessor("perubahan", {
      header: "Perubahan",
      cell: (info) => `${Object.keys(info.getValue() ?? {}).length} field`,
    }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Data Master"
        title="Penerima Manfaat"
        description={`${rows.length} data penerima · pencarian, sorting, pagination, filter, dan riwayat perubahan.`}
        action={
          <Button onClick={openCreate} disabled={!options}>
            <LuPlus className="size-4" /> Tambah Penerima
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && !rows.length ? (
        <LoadingState />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Daftar Penerima"
          description="Klik header kolom untuk mengurutkan data. Tombol riwayat menampilkan jejak perubahan."
          searchPlaceholder="Cari nama, NIK, NISN, atau lembaga..."
          pageSize={10}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={institutionId}
                onChange={(event) => setInstitutionId(event.target.value)}
                className="h-10 w-full text-xs sm:w-44"
                aria-label="Filter lembaga"
              >
                <option value="">Semua lembaga</option>
                {options?.institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.nama}</option>
                ))}
              </Select>
              <Select
                value={kategori}
                onChange={(event) => setKategori(event.target.value)}
                className="h-10 w-full text-xs sm:w-36"
                aria-label="Filter kategori"
              >
                <option value="">Semua kategori</option>
                {options?.penerima.map((cat) => (
                  <option key={cat.kode} value={cat.kode}>{cat.nama}</option>
                ))}
              </Select>
              <Select
                value={jenisKelamin}
                onChange={(event) => setJenisKelamin(event.target.value)}
                className="h-10 w-full text-xs sm:w-32"
                aria-label="Filter jenis kelamin"
              >
                <option value="">Semua JK</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </Select>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full text-xs sm:w-36"
                aria-label="Filter status"
              >
                <option value="">Semua status</option>
                <option value="aktif">Aktif</option>
                <option value="non_aktif">Non aktif</option>
                <option value="pindah">Pindah</option>
              </Select>
            </div>
          }
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Ubah Penerima" : "Tambah Penerima"}
        description={editingId ? "Alasan perubahan wajib diisi dan akan tersimpan di riwayat." : "Lengkapi data sesuai identitas penerima."}
        size="lg"
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
            <Input required value={form.nama} onChange={(event) => setField("nama", event.target.value)} />
          </FormField>
          <FormField label="Lembaga" required>
            <Select required value={form.institution_id} onChange={(event) => setField("institution_id", event.target.value)}>
              <option value="">Pilih lembaga</option>
              {options?.institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.nama}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Kategori" required>
            <Select required value={form.kategori} onChange={(event) => setField("kategori", event.target.value)}>
              <option value="">Pilih kategori</option>
              {options?.penerima.map((cat) => (
                <option key={cat.kode} value={cat.kode}>{cat.nama}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Jenis Kelamin">
            <Select value={form.jenis_kelamin} onChange={(event) => setField("jenis_kelamin", event.target.value)}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(event) => setField("status", event.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="non_aktif">Non aktif</option>
              <option value="pindah">Pindah</option>
            </Select>
          </FormField>
          <FormField label="NIK">
            <Input value={form.nik} onChange={(event) => setField("nik", event.target.value)} />
          </FormField>
          <FormField label="NISN">
            <Input value={form.nisn} onChange={(event) => setField("nisn", event.target.value)} />
          </FormField>
          <FormField label="Kelas">
            <Input type="number" min={1} max={12} value={form.kelas} onChange={(event) => setField("kelas", event.target.value)} />
          </FormField>
          <FormField label="Jurusan">
            <Input value={form.jurusan} onChange={(event) => setField("jurusan", event.target.value)} />
          </FormField>
          <FormField label="Bulan">
            <Select value={form.bulan} onChange={(event) => setField("bulan", event.target.value)}>
              <option value="">-</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tahun">
            <Input type="number" value={form.tahun} onChange={(event) => setField("tahun", event.target.value)} />
          </FormField>
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea value={form.keterangan} onChange={(event) => setField("keterangan", event.target.value)} />
          </FormField>
          {editingId && (
            <FormField label="Alasan perubahan" required className="sm:col-span-2">
              <Textarea
                required
                value={form.alasan}
                onChange={(event) => setField("alasan", event.target.value)}
                placeholder="Contoh: Perbaikan NIK dan pemutakhiran kelas"
              />
            </FormField>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        title={`Riwayat ${history?.nama ?? ""}`}
        description="Jejak perubahan data penerima manfaat."
        size="xl"
        footer={<Button type="button" variant="outline" onClick={() => setHistory(null)}>Tutup</Button>}
      >
        {historyLoading && <LoadingState label="Memuat riwayat..." />}
        {history && !historyLoading && (
          <DataTable
            data={history.data}
            columns={historyColumns}
            searchPlaceholder="Cari riwayat..."
            pageSize={8}
          />
        )}
      </Modal>
    </div>
  );
}
