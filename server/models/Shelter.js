const db = require('../config/database');

class Shelter {
    static async findAll() {
        const pool = await db.getPool();
        const query = 'SELECT * FROM shelters';
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findById(id) {
        const pool = await db.getPool();
        const query = 'SELECT * FROM shelters WHERE shelter_id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async create(shelterData) {
        const pool = await db.getPool();
        const { shelter_name, email, contact_number, address, region } = shelterData;
        const query = `
            INSERT INTO shelters (shelter_name, email, contact_number, address, region)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [shelter_name, email, contact_number, address, region]);
        return this.findById(result.insertId);
    }

    static async update(id, shelterData) {
        const pool = await db.getPool();
        const { shelter_name, email, contact_number, address, region } = shelterData;
        const query = `
            UPDATE shelters 
            SET shelter_name = ?, email = ?, contact_number = ?, address = ?, region = ?
            WHERE shelter_id = ?
        `;
        await pool.execute(query, [shelter_name, email, contact_number, address, region, id]);
        return this.findById(id);
    }

    static async delete(id) {
        const pool = await db.getPool();
        const query = 'DELETE FROM shelters WHERE shelter_id = ?';
        await pool.execute(query, [id]);
    }
}

module.exports = Shelter;