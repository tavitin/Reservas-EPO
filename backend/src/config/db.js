const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Asegurar que todas las comparaciones de fechas se hagan en UTC
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'UTC'");
});

module.exports = { pool };
