const db = require('../config/database');

class User {
    static async findAll() {
        const query = 'SELECT * FROM users';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    static async create(userData) {
        const { username, email, password_hash, nickname, gender, phone_number } = userData;
        const query = `
            INSERT INTO users (username, email, password_hash, nickname, gender, phone_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [username, email, password_hash, nickname, gender, phone_number]);
        return this.findById(result.insertId);
    }

    static async update(id, userData) {
        const { username, email, nickname, gender, phone_number } = userData;
        const query = `
            UPDATE users 
            SET username = ?, email = ?, nickname = ?, gender = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        await db.execute(query, [username, email, nickname, gender, phone_number, id]);
        return this.findById(id);
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE user_id = ?';
        await db.execute(query, [id]);
    }

    // 인증 관련 메서드들
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);
        return rows[0];
    }

    static async checkEmailExists(email) {
        const user = await this.findByEmail(email);
        return !!user;
    }

    static async createWithValidation(userData) {
        const { username, email, password_hash, nickname, gender, phone_number } = userData;
        
        // 이메일 중복 체크
        const emailExists = await this.checkEmailExists(email);
        if (emailExists) {
            throw new Error('이미 존재하는 이메일입니다.');
        }

        // 사용자 생성
        return await this.create(userData);
    }
}

module.exports = User;