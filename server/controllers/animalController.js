const pool = require('../db/connection');

const getAnimals = async (req, res) => {
  console.log('Received request for /api/animals');
  console.log('Query params:', req.query);

  const { filter, page = 1 } = req.query; // Revert to original
  const limit = 12;
  const offset = (page - 1) * limit;

  let whereClause = ''; // Revert to original
  const params = [];

  if (filter && filter !== 'all') {
    if (filter === 'dog') {
      whereClause = 'WHERE species LIKE ?';
      params.push('%개%');
    } else if (filter === 'cat') {
      whereClause = 'WHERE species LIKE ?';
      params.push('%고양이%');
    } else if (filter === 'other') {
      whereClause = 'WHERE species NOT LIKE ? AND species NOT LIKE ?';
      params.push('%개%');
      params.push('%고양이%');
    }
  }

  try {
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as count FROM animals ${whereClause}`; // Revert to original
    console.log('Count query:', countQuery, params);
    const [countRows] = await pool.query(countQuery, params);
    const totalAnimals = countRows[0].count;
    const totalPages = Math.ceil(totalAnimals / limit);

    // Get animals for the current page
    const animalsQuery = `
      SELECT * FROM animals
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `; // Revert to original
    console.log('Animals query:', animalsQuery, [...params, limit, offset]);
    const [animals] = await pool.query(animalsQuery, [...params, limit, offset]);

    res.json({ animals, totalPages });
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getAnimalById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        a.*, 
        s.shelter_name, 
        s.address as shelter_address, 
        s.contact_number as shelter_contact_number 
      FROM animals a
      LEFT JOIN shelters s ON a.shelter_id = s.shelter_id
      WHERE a.animal_id = ?
    `;
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching animal with id ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOldestAnimals = async (req, res) => {
  try {
    const query = `
      SELECT * FROM animals
      ORDER BY created_at ASC
      LIMIT 12
    `;
    const [animals] = await pool.query(query);
    res.json({ animals });
  } catch (error) {
    console.error('Error fetching oldest animals:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getAnimals,
  getAnimalById,
  getOldestAnimals,
};