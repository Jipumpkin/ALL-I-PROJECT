const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true, connectionLimit: 5
});

router.get('/api/animals', async (req, res) => {
  const { region, species, status, page = 1, size = 20 } = req.query;
  const p = Math.max(1, parseInt(page,10) || 1);
  const s = Math.min(100, Math.max(1, parseInt(size,10) || 20));
  const offset = (p - 1) * s;

  const where = [];
  const params = [];
  if (region) { where.push('region = ?'); params.push(region); }
  if (species) { where.push('species = ?'); params.push(species); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM animals ${whereSql}`, params);
    const [rows] = await conn.query(
      `SELECT ext_id AS animalId, species, gender, age, image_url AS imageUrl,
              shelter_id AS shelterId, status, region, rescued_at AS rescuedAt
         FROM animals
        ${whereSql}
        ORDER BY rescued_at DESC, ext_id DESC
        LIMIT ? OFFSET ?`,
      [...params, s, offset]
    );
    res.json({ page: p, size: s, total, items: rows });
  } finally { conn.release(); }
});

router.get('/api/animals/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT ext_id AS animalId, species, gender, age, image_url AS imageUrl,
              shelter_id AS shelterId, status, region, rescued_at AS rescuedAt
         FROM animals WHERE ext_id = ? LIMIT 1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(rows[0]);
  } finally { conn.release(); }
});

module.exports = router;