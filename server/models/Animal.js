const db = require('../config/database');

class Animal {
    static async findOldest() {
        const pool = await db.getPool();
        const query = `
            SELECT animal_id, species, gender, age, image_url, region, rescued_at
            FROM animals 
            WHERE status = 'available'
            ORDER BY rescued_at ASC
            LIMIT 3
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findAllForList() {
        const pool = await db.getPool();
        const query = `
            SELECT animal_id, species, gender, age, image_url, region 
            FROM animals 
            ORDER BY rescued_at DESC
            LIMIT 12
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findRandom(limit) {
        const pool = await db.getPool();
        const query = `
            SELECT animal_id, species, gender, age, image_url, region
            FROM animals
            ORDER BY RAND()
            LIMIT ${parseInt(limit, 10)}
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findAll() {
        const pool = await db.getPool();
        const query = 'SELECT * FROM animals';
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findById(id) {
        const pool = await db.getPool();
        const query = `
            SELECT
                a.*,
                s.shelter_name,
                s.address AS shelter_address,
                s.contact_number AS shelter_contact_number
            FROM
                animals a
            JOIN
                shelters s ON a.shelter_id = s.shelter_id
            WHERE
                a.animal_id = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async create(animalData) {
        const pool = await db.getPool();
        const { species, gender, age, image_url, shelter_id, status, region, rescued_at } = animalData;
        const query = `
            INSERT INTO animals (species, gender, age, image_url, shelter_id, status, region, rescued_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [species, gender, age, image_url, shelter_id, status, region, rescued_at]);
        return this.findById(result.insertId);
    }

    static async update(id, animalData) {
        const pool = await db.getPool();
        const { species, gender, age, image_url, shelter_id, status, region, rescued_at } = animalData;
        const query = `
            UPDATE animals 
            SET species = ?, gender = ?, age = ?, image_url = ?, shelter_id = ?, status = ?, region = ?, rescued_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE animal_id = ?
        `;
        await pool.execute(query, [species, gender, age, image_url, shelter_id, status, region, rescued_at, id]);
        return this.findById(id);
    }

    static async delete(id) {
        const pool = await db.getPool();
        const query = 'DELETE FROM animals WHERE animal_id = ?';
        await pool.execute(query, [id]);
    }
}

module.exports = Animal;