const { getPool } = require('../config/database');

class User {
    static async findAll() {
        const db = await getPool();
        const query = 'SELECT * FROM users';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        const db = await getPool();
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    static async create(userData) {
        console.log('🔍 User.create userData:', userData);
        
        const query = `
            INSERT INTO users (username, email, password_hash, nickname, gender, phone_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            userData.username,
            userData.email,
            userData.password_hash,
            userData.nickname || null,
            userData.gender || null,
            userData.phone_number || null
        ];
        
        console.log('🔍 SQL parameters:', params);
        
        const db = await getPool();
        const [result] = await db.execute(query, params);
        return this.findById(result.insertId);
    }

    static async update(id, userData) {
        const { username, email, nickname, gender, phone_number } = userData;
        const query = `
            UPDATE users 
            SET username = ?, email = ?, nickname = ?, gender = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        const db = await getPool();
        await db.execute(query, [username, email, nickname, gender, phone_number, id]);
        return this.findById(id);
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE user_id = ?';
        const db = await getPool();
        await db.execute(query, [id]);
    }

    // 인증 관련 메서드들
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const db = await getPool();
        const [rows] = await db.execute(query, [email]);
        return rows[0];
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        const db = await getPool();
        const [rows] = await db.execute(query, [username]);
        return rows[0];
    }

    static async checkEmailExists(email) {
        const user = await this.findByEmail(email);
        return !!user;
    }

    static async checkUsernameExists(username) {
        const user = await this.findByUsername(username);
        return !!user;
    }

    static async createWithValidation(userData) {
        console.log('🔍 User.createWithValidation userData:', userData);
        const { username, email, password_hash, nickname, gender, phone_number } = userData;
        
        // username 중복 체크
        const usernameExists = await this.checkUsernameExists(username);
        if (usernameExists) {
            throw new Error('이미 존재하는 사용자명입니다.');
        }
        
        // 이메일 중복 체크
        const emailExists = await this.checkEmailExists(email);
        if (emailExists) {
            throw new Error('이미 존재하는 이메일입니다.');
        }

        console.log('🔍 Username and email validation passed, calling create...');
        // 사용자 생성
        return await this.create(userData);
    }

    /**
     * 사용자 프로필 정보 업데이트 (닉네임, 연락처, 성별만 수정 가능)
     * @param {number} userId - 사용자 ID
     * @param {object} updateData - 업데이트할 데이터 { nickname?, phone_number?, gender? }
     * @returns {object} 업데이트된 사용자 정보
     */
    static async updateProfile(userId, updateData) {
        console.log('🔍 User.updateProfile userId:', userId, 'updateData:', updateData);
        
        // 업데이트 가능한 필드만 포함하도록 필터링
        const allowedFields = ['nickname', 'phone_number', 'gender'];
        const filteredData = {};
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        });

        if (Object.keys(filteredData).length === 0) {
            throw new Error('업데이트할 데이터가 없습니다.');
        }

        // 동적 쿼리 생성
        const setClause = Object.keys(filteredData).map(field => `${field} = ?`).join(', ');
        const query = `
            UPDATE users 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        
        const params = [...Object.values(filteredData), userId];
        console.log('🔍 Update profile SQL:', query, 'params:', params);
        
        const db = await getPool();
        const [result] = await db.execute(query, params);
        
        if (result.affectedRows === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        return this.findById(userId);
    }

    /**
     * 회원탈퇴 처리 (소프트 삭제)
     * @param {number} userId - 탈퇴할 사용자 ID
     * @returns {boolean} 삭제 성공 여부
     */
    static async deleteAccount(userId) {
        console.log('🔍 User.deleteAccount userId:', userId);
        
        // 실제 삭제 대신 소프트 삭제 (deleted_at 컬럼이 있다면)
        // 현재 스키마에서는 deleted_at이 없으므로 실제 삭제 수행
        const query = 'DELETE FROM users WHERE user_id = ?';
        const db = await getPool();
        const [result] = await db.execute(query, [userId]);
        
        if (result.affectedRows === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        console.log('🔍 User.deleteAccount 성공');
        return true;
    }
}

module.exports = User;