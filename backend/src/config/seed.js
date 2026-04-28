const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seedAdmin() {
  const { rows } = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
  if (rows.length === 0) {
    const pass = process.env.ADMIN_DEFAULT_PASS;
    const email = process.env.ADMIN_EMAIL;
    if (!pass || !email) {
      throw new Error('ADMIN_DEFAULT_PASS y ADMIN_EMAIL son requeridos para crear el admin inicial');
    }
    const hash = await bcrypt.hash(pass, 10);
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin')",
      ['Administrador EPO', email.toLowerCase().trim(), hash]
    );
    console.log('Admin inicial creado. Cambia la contraseña después del primer inicio de sesión.');
  }
}

module.exports = { seedAdmin };
