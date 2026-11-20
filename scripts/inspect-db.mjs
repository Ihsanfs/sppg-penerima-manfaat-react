import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const env = {};
for (const line of fs.readFileSync(path.resolve(".env"), "utf8").split(/\r?\n/)) {
  const match = /^([^#=]+)=(.*)$/.exec(line);
  if (match) env[match[1].trim()] = match[2].trim();
}

const pool = new pg.Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 5432),
  database: env.DB_DATABASE || "postgres",
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

try {
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", "));

  const columns = await pool.query(
    `SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN (
         'users','roles','model_has_roles','sppg_profiles','beneficiaries',
         'beneficiary_histories','institutions','categories','daily_reports',
         'daily_report_details','audit_logs'
       )
     ORDER BY table_name, ordinal_position`,
  );

  const roles = await pool.query(
    `SELECT r.name, mr.model_type, COUNT(*)::int AS jumlah
     FROM model_has_roles mr JOIN roles r ON r.id = mr.role_id
     GROUP BY r.name, mr.model_type ORDER BY r.name`,
  );
  console.log("\nROLES:", JSON.stringify(roles.rows));

  const profile = await pool.query("SELECT * FROM sppg_profiles ORDER BY id LIMIT 1");
  console.log("\nPROFILE:", JSON.stringify(profile.rows[0] ?? null));

  const reportSample = await pool.query(
    `SELECT id, tanggal, sumber, total, catatan FROM daily_reports ORDER BY tanggal DESC LIMIT 3`,
  );
  console.log("\nREPORTS:", JSON.stringify(reportSample.rows));

  let current = "";
  for (const row of columns.rows) {
    if (row.table_name !== current) {
      current = row.table_name;
      console.log(`\n[${current}]`);
    }
    console.log(`  ${row.column_name}: ${row.data_type}${row.is_nullable === "NO" ? " NOT NULL" : ""}`);
  }
} finally {
  await pool.end();
}
