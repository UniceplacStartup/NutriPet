const { Pool } = require('pg');
require('dotenv').config();

function buildConfig() {
  // Prefer a full connection string if provided
  if (process.env.DATABASE_URL) {
    const cfg = { connectionString: process.env.DATABASE_URL };
    if (process.env.DATABASE_SSL === 'true' || !process.env.DATABASE_URL.includes('localhost')) {
      cfg.ssl = { rejectUnauthorized: false };
    }
    return cfg;
  }

  const required = ['DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE'];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length) {
    throw new Error(
      `Database env vars missing: ${missing.join(', ')}. Create backend/.env with DATABASE_* values or set DATABASE_URL.`
    );
  }

  return {
    user: String(process.env.DATABASE_USER),
    password: String(process.env.DATABASE_PASSWORD),
    host: String(process.env.DATABASE_HOST),
    port: Number(process.env.DATABASE_PORT),
    database: String(process.env.DATABASE),
  };
}

const pool = new Pool(buildConfig());

// Garante que as colunas novas das últimas migrations existam em produção
async function ensureSchema() {
  await pool.query(`
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(7);
    CREATE UNIQUE INDEX IF NOT EXISTS usuarios_matricula_key ON usuarios (matricula);
    ALTER TABLE formularios_dieteticos ADD COLUMN IF NOT EXISTS condicao VARCHAR(30);
    ALTER TABLE formularios_dieteticos ADD COLUMN IF NOT EXISTS detalhes JSONB;
  `);
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  ensureSchema,
};
