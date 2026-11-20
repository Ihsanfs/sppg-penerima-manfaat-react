// Konstanta domain yang aman dipakai komponen client maupun server.
export const DETAIL_KEYS = [
  "tk_paud", "kelas_1", "kelas_2", "kelas_3", "kelas_4", "kelas_5", "kelas_6",
  "smk", "guru", "balita", "bumil", "busui", "kader",
] as const;

export const DETAIL_INSERT_KEYS = [...DETAIL_KEYS] as string[];

export const LEGACY_TO_GRUP: Record<string, string> = {
  tk_paud: "tk_paud",
  kelas_1: "sd_1_3", kelas_2: "sd_1_3", kelas_3: "sd_1_3",
  kelas_4: "sd_4_6", kelas_5: "sd_4_6", kelas_6: "sd_4_6",
  smk: "smk", guru: "guru", balita: "balita", bumil: "bumil",
  busui: "busui", kader: "kader",
};

export const GRUP_URUTAN = [
  "tk_paud", "sd_1_3", "sd_4_6", "smk", "guru", "balita", "bumil", "busui", "kader",
] as const;

export const GRUP_LABELS: Record<string, string> = {
  tk_paud: "TK / PAUD",
  sd_1_3: "Kelas 1-3 SD",
  sd_4_6: "Kelas 4-6 SD",
  smk: "SMP / SMK",
  guru: "Guru",
  balita: "Balita",
  bumil: "Ibu Hamil",
  busui: "Ibu Menyusui",
  kader: "Kader",
};

export const KATEGORI_KEYS = [...GRUP_URUTAN] as const;
