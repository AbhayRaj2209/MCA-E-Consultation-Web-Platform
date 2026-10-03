const pool = require('../config/db');

// password_hash kabhi bhi API response me nahi jaata
const PUBLIC_COLUMNS = `id, full_name, email, phone, designation, department, location, bio,
  created_at, updated_at, last_login_at`;

async function findByEmailWithHash(email) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM admin_users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM admin_users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create(user) {
  const { rows } = await pool.query(
    `INSERT INTO admin_users (full_name, email, password_hash, phone, designation, department, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${PUBLIC_COLUMNS}`,
    [user.fullName, user.email, user.passwordHash, user.phone, user.designation, user.department, user.location]
  );
  return rows[0];
}

async function touchLastLogin(id) {
  await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [id]);
}

async function updateProfile(id, p) {
  const { rows } = await pool.query(
    `UPDATE admin_users
     SET full_name = $1, phone = $2, designation = $3, department = $4, location = $5, bio = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING ${PUBLIC_COLUMNS}`,
    [p.fullName, p.phone, p.designation, p.department, p.location, p.bio, id]
  );
  return rows[0] || null;
}

async function updatePasswordHash(id, passwordHash) {
  await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);
}

async function getPasswordHash(id) {
  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [id]);
  return rows[0] ? rows[0].password_hash : null;
}

module.exports = {
  findByEmailWithHash,
  findById,
  create,
  touchLastLogin,
  updateProfile,
  updatePasswordHash,
  getPasswordHash
};
