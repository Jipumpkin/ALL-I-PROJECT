const db = require('../config/database');

class Animal {
    static async findOldest() {
        const query = `
            SELECT animal_id, species, gender, age, image_url, region, rescued_at
            FROM animals 
            WHERE status = 'available' -- 蹂댄몄 臾 以
            ORDER BY rescued_at ASC -- 援ъ“쇱 媛 ㅻ 쇰
            LIMIT 3 -- 3留由щ 議고
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findAllForList() {
        const query = `
            SELECT animal_id, species, gender, age, image_url, region 
            FROM animals 
            ORDER BY rescued_at DESC
            LIMIT 12
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findRandom(limit) {
        const query = `
            SELECT animal_id, species, gender, age, image_url, region
            FROM animals
            ORDER BY RAND()
            LIMIT ${parseInt(limit, 10)}
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findAll() {
        const query = 'SELECT * FROM animals';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findById(id) {
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
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    static async create(animalData) {
        const { species, gender, age, image_url, shelter_id, status, region, rescued_at } = animalData;
        const query = `
            INSERT INTO animals (species, gender, age, image_url, shelter_id, status, region, rescued_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [species, gender, age, image_url, shelter_id, status, region, rescued_at]);
        return this.findById(result.insertId);
    }

    static async update(id, animalData) {
        const { species, gender, age, image_url, shelter_id, status, region, rescued_at } = animalData;
        const query = `
            UPDATE animals 
            SET species = ?, gender = ?, age = ?, image_url = ?, shelter_id = ?, status = ?, region = ?, rescued_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE animal_id = ?
        `;
        await db.execute(query, [species, gender, age, image_url, shelter_id, status, region, rescued_at, id]);
        return this.findById(id);
    }

    static async delete(id) {
        const query = 'DELETE FROM animals WHERE animal_id = ?';
        await db.execute(query, [id]);
    }
}

module.exports = Animal;