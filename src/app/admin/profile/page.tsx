"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import { isAdmin } from "@/lib/permissions";
import type { SppgProfile } from "@/lib/types";
import { useEffect, useState } from "react";

type ProfileForm = {
  nama: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  telepon: string;
  email: string;
  kepala_sppg: string;
  logo: string;
  latitude: string;
  longitude: string;
};

const emptyForm: ProfileForm = {
  nama: "", alamat: "", kecamatan: "", kabupaten: "", provinsi: "",
  telepon: "", email: "", kepala_sppg: "", logo: "", latitude: "", longitude: "",
};

function toForm(profile: SppgProfile): ProfileForm {
  return {
    nama: profile.nama ?? "",
    alamat: profile.alamat ?? "",
    kecamatan: profile.kecamatan ?? "",
    kabupaten: profile.kabupaten ?? "",
    provinsi: profile.provinsi ?? "",
    telepon: profile.telepon ?? "",
    email: profile.email ?? "",
    kepala_sppg: profile.kepala_sppg ?? "",
    logo: profile.logo ?? "",
    latitude: profile.latitude === null || profile.latitude === undefined ? "" : String(profile.latitude),
    longitude: profile.longitude === null || profile.longitude === undefined ? "" : String(profile.longitude),
  };
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.profile(), api.me()])
      .then(([profileResult, me]) => {
        if (!active) return;
        if (profileResult.profile) setForm(toForm(profileResult.profile));
        setAdmin(isAdmin(me.user));
      })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const setField = (key: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.nama.trim()) {
      setError("Nama SPPG wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile({
        nama: form.nama.trim(),
        alamat: form.alamat.trim() || null,
        kecamatan: form.kecamatan.trim() || null,
        kabupaten: form.kabupaten.trim() || null,
        provinsi: form.provinsi.trim() || null,
        telepon: form.telepon.trim() || null,
        email: form.email.trim() || null,
        kepala_sppg: form.kepala_sppg.trim() || null,
        logo: form.logo.trim() || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      });
      setNotice("Profil SPPG diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Pengaturan"
        title="Profil SPPG"
        description="Identitas dan koordinat pusat SPPG yang dipakai publik serta peta GIS."
        action={<Badge color={admin ? "success" : "warning"}>{admin ? "Dapat diubah" : "Hanya lihat"}</Badge>}
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && <LoadingState label="Memuat profil..." />}

      {!loading && (
        <div className="surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama SPPG" required className="sm:col-span-2">
              <Input value={form.nama} disabled={!admin} onChange={(event) => setField("nama", event.target.value)} />
            </FormField>
            <FormField label="Alamat" className="sm:col-span-2">
              <Textarea value={form.alamat} disabled={!admin} onChange={(event) => setField("alamat", event.target.value)} />
            </FormField>
            <FormField label="Kecamatan">
              <Input value={form.kecamatan} disabled={!admin} onChange={(event) => setField("kecamatan", event.target.value)} />
            </FormField>
            <FormField label="Kabupaten">
              <Input value={form.kabupaten} disabled={!admin} onChange={(event) => setField("kabupaten", event.target.value)} />
            </FormField>
            <FormField label="Provinsi">
              <Input value={form.provinsi} disabled={!admin} onChange={(event) => setField("provinsi", event.target.value)} />
            </FormField>
            <FormField label="Kepala SPPG">
              <Input value={form.kepala_sppg} disabled={!admin} onChange={(event) => setField("kepala_sppg", event.target.value)} />
            </FormField>
            <FormField label="Telepon">
              <Input value={form.telepon} disabled={!admin} onChange={(event) => setField("telepon", event.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} disabled={!admin} onChange={(event) => setField("email", event.target.value)} />
            </FormField>
            <FormField label="Latitude" hint="Contoh: -7.2275">
              <Input value={form.latitude} disabled={!admin} onChange={(event) => setField("latitude", event.target.value)} />
            </FormField>
            <FormField label="Longitude" hint="Contoh: 107.8720">
              <Input value={form.longitude} disabled={!admin} onChange={(event) => setField("longitude", event.target.value)} />
            </FormField>
            <FormField label="Logo (URL)" className="sm:col-span-2">
              <Input value={form.logo} disabled={!admin} onChange={(event) => setField("logo", event.target.value)} />
            </FormField>
          </div>

          {admin && (
            <div className="mt-6 flex justify-end">
              <Button onClick={() => void submit()} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
