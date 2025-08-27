const express = require('express');
const { pool } = require('../db/connection');
const router = express.Router();

// GET /animals - 동물 목록 조회 (필터링 및 페이지네이션 지원)
router.get('/', async (req, res) => {
  const { region, species, status, page = 1, size = 20 } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const s = Math.min(100, Math.max(1, parseInt(size, 10) || 20));
  const offset = (p - 1) * s;

  const where = [];
  const params = [];
  
  // 🖼️ 유효한 이미지가 있는 동물들만 조회
  where.push('image_url LIKE ?');
  params.push('http%');
  
  if (region) { where.push('region = ?'); params.push(region); }
  if (species) { where.push('species = ?'); params.push(species); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let conn;
  try {
    conn = await pool.getConnection();
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
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally { 
    if (conn) conn.release(); 
  }
});

// GET /animals/:id - 특정 동물 상세 조회
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT ext_id AS animalId, species, gender, age, image_url AS imageUrl,
              shelter_id AS shelterId, status, region, rescued_at AS rescuedAt
         FROM animals WHERE ext_id = ? LIMIT 1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching animal by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally { 
    if (conn) conn.release(); 
  }
});

module.exports = router;