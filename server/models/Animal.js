const db = require('../config/database');

class Animal {
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