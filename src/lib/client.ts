import type {
  AdminDashboardData,
  AuditLog,
  Beneficiary,
  BeneficiaryHistory,
  Category,
  DailyReport,
  DailyReportDetail,
  GisData,
  ImportResult,
  Institution,
  OperationalData,
  OptionsData,
  Paginated,
  PublicDashboardData,
  SppgProfile,
  UserRecord,
  WeeklyReportData,
} from "@/lib/types";

export type LoginResult = {
  token: string;
  user: { id: number; name: string; email: string };
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(
      typeof data.message === "string" ? data.message : `Permintaan gagal (${response.status})`,
    );
  }
  return data as T;
}

async function apiDownload(path: string, filename: string) {
  const response = await fetch(`/api${path}`);
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Unduhan gagal (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),

  publicDashboard: () => api.get<PublicDashboardData>("/public/dashboard"),
  login: (email: string, password: string) =>
    api.post<LoginResult>("/auth/login", { email, password }),
  logout: () => api.post<{ ok: boolean }>("/auth/logout"),
  me: () => api.get<{ user: LoginResult["user"] }>("/auth/me"),

  dashboard: () => api.get<AdminDashboardData>("/dashboard"),
  options: () => api.get<OptionsData>("/options"),

  beneficiaries: (params?: {
    q?: string;
    status?: string;
    institution_id?: string;
    kategori?: string;
    jenis_kelamin?: string;
  }) => {
    const query = new URLSearchParams();
    query.set("limit", "100");
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.institution_id) query.set("institution_id", params.institution_id);
    if (params?.kategori) query.set("kategori", params.kategori);
    if (params?.jenis_kelamin) query.set("jenis_kelamin", params.jenis_kelamin);
    return api.get<Paginated<Beneficiary>>(`/beneficiaries?${query.toString()}`);
  },
  createBeneficiary: (body: Partial<Beneficiary>) =>
    api.post<Beneficiary>("/beneficiaries", body),
  updateBeneficiary: (id: number, body: Partial<Beneficiary>) =>
    api.put<Beneficiary>(`/beneficiaries/${id}`, body),
  deleteBeneficiary: (id: number) => api.delete<{ ok: boolean }>(`/beneficiaries/${id}`),

  institutions: (params?: {
    q?: string;
    tipe?: string;
    jenjang?: string;
    is_active?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.tipe) query.set("tipe", params.tipe);
    if (params?.jenjang) query.set("jenjang", params.jenjang);
    if (params?.is_active) query.set("is_active", params.is_active);
    const suffix = query.toString();
    return api.get<{ data: Institution[] }>(`/institutions${suffix ? `?${suffix}` : ""}`);
  },
  createInstitution: (body: Partial<Institution>) => api.post<Institution>("/institutions", body),
  updateInstitution: (id: number, body: Partial<Institution>) =>
    api.put<Institution>(`/institutions/${id}`, body),
  deleteInstitution: (id: number) => api.delete<{ ok: boolean }>(`/institutions/${id}`),

  categories: () => api.get<{ data: Category[] }>("/categories"),
  createCategory: (body: Partial<Category>) => api.post<Category>("/categories", body),
  updateCategory: (id: number, body: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, body),
  deleteCategory: (id: number) => api.delete<{ ok: boolean }>(`/categories/${id}`),

  dailyReports: (page = 1) =>
    api.get<Paginated<DailyReport>>(`/daily-reports?page=${page}&limit=100`),
  dailyReportDetail: (id: number) =>
    api.get<{ report: DailyReport; details: DailyReportDetail[] }>(`/daily-reports/${id}`),
  saveDailyReport: (body: { tanggal?: string; sumber?: string; catatan?: string }) =>
    api.post<{ report: DailyReport; total: number }>("/daily-reports/save", body),

  gis: () => api.get<GisData>("/gis"),
  auditLogs: () => api.get<{ data: AuditLog[] }>("/audit-logs"),

  profile: () => api.get<{ profile: SppgProfile | null }>("/profile"),
  updateProfile: (body: Partial<SppgProfile>) =>
    api.put<{ profile: SppgProfile }>("/profile", body),

  operational: (tanggal?: string) =>
    api.get<OperationalData>(`/operational${tanggal ? `?tanggal=${tanggal}` : ""}`),
  weeklyReport: (tanggal?: string) =>
    api.get<WeeklyReportData>(`/weekly-report${tanggal ? `?tanggal=${tanggal}` : ""}`),

  history: (beneficiaryId?: number) =>
    api.get<{ data: BeneficiaryHistory[] }>(
      `/beneficiary-history${beneficiaryId ? `?beneficiary_id=${beneficiaryId}` : ""}`,
    ),
  beneficiaryHistory: (id: number) =>
    api.get<{ data: BeneficiaryHistory[] }>(`/beneficiaries/${id}/history`),

  users: () => api.get<{ data: UserRecord[] }>("/users"),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => api.post<UserRecord>("/users", body),
  updateUser: (
    id: number,
    body: { name?: string; email?: string; password?: string; role?: string },
  ) => api.put<UserRecord>(`/users/${id}`, body),
  deleteUser: (id: number) => api.delete<{ ok: boolean }>(`/users/${id}`),

  importFile: (type: "beneficiaries" | "institutions", file: File) => {
    const form = new FormData();
    form.set("type", type);
    form.set("file", file);
    return api.post<ImportResult>("/import-export/import", form);
  },
  downloadTemplate: (type: "beneficiaries" | "institutions", format: "csv" | "xlsx") =>
    apiDownload(`/import-export/template?type=${type}&format=${format}`, `template-${type}.${format}`),
  downloadExport: (
    type: "beneficiaries" | "institutions" | "history",
    format: "csv" | "xlsx",
  ) => apiDownload(`/import-export/export?type=${type}&format=${format}`, `sppg-${type}.${format}`),
};
