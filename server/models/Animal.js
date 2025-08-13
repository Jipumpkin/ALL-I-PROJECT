const db = require('../config/database');

class Animal {
    static async findOldest() {
        const query = `
            SELECT animal_id, species, gender, age, image_url, region, rescued_at
            FROM animals 
            WHERE status = 'available' -- 보호중인 동물 중에서
            ORDER BY rescued_at ASC -- 구조일이 가장 오래된 순으로
            LIMIT 3 -- 3마리만 조회
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findAllForList() {
        const query = `
            SELECT animal_id, species, gender, age, image_url, region 
            FROM animals 
            ORDER BY RAND()
            LIMIT 12
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
        const query = 'SELECT * FROM animals WHERE animal_id = ?';
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