const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seedAdmin() {
  const { rows } = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
  if (rows.length === 0) {
    const pass = process.env.ADMIN_DEFAULT_PASS || 'Admin2024!';
    const hash = await bcrypt.hash(pass, 10);
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin')",
      ['Administrador EPO', process.env.ADMIN_EMAIL || 'admin@epo.edu.mx', hash]
    );
    console.log('Admin creado — email: admin@epo.edu.mx  pass: Admin2024!');
  }
}

module.exports = { seedAdmin };
