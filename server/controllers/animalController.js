// ✅ db/connection.js에서 내보낸 pool 객체를 구조 분해 할당으로 가져옵니다.
const { pool } = require('../db/connection');

// --- 1. 동물 목록 조회 (필터링, 페이지네이션) ---
const getAnimals = async (req, res) => {
    const { filter, page = 1, shelter_id } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    // 🖼️ 유효한 이미지가 있는 동물들만 조회
    whereClauses.push('image_url LIKE ?');
    queryParams.push('http%');

    // 카테고리 필터
    if (filter && filter !== 'all') {
        if (filter === 'dog') {
            whereClauses.push('species LIKE ?');
            queryParams.push('%개%');
        } else if (filter === 'cat') {
            whereClauses.push('species LIKE ?');
            queryParams.push('%고양이%');
        } else if (filter === 'other') {
            whereClauses.push('species NOT LIKE ? AND species NOT LIKE ?');
            queryParams.push('%개%');
            queryParams.push('%고양이%');
        }
    }
    // 보호소 필터
    if (shelter_id && shelter_id !== 'all') {
        whereClauses.push('shelter_id = ?');
        queryParams.push(shelter_id);
    }

    const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    try {        
        // 유효한 이미지가 있는 동물들의 전체 개수 조회
        const countQuery = `SELECT COUNT(*) as count FROM animals ${whereQuery}`;
        const [countRows] = await pool.query(countQuery, queryParams);
        const totalAnimals = countRows[0].count;
        const totalPages = Math.ceil(totalAnimals / limit);

        // 유효한 이미지가 있는 동물들을 랜덤하게 조회
        const animalsQuery = `SELECT * FROM animals ${whereQuery} ORDER BY RAND() LIMIT ? OFFSET ?`;
        const finalParams = [...queryParams, limit, offset];
        
        const [animals] = await pool.query(animalsQuery, finalParams);
        
        res.json({ animals, totalPages });
    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// --- 2. 모든 보호소 목록 조회 ---
const getAllShelters = async (req, res) => {
    try {
        const query = 'SELECT shelter_id, shelter_name FROM shelters ORDER BY shelter_name ASC';
        const [shelters] = await pool.query(query);
        res.json(shelters);
    } catch (error) {
        console.error('Error fetching shelters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- 3. 특정 ID의 동물 상세 정보 조회 (로직 구현) ---
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

// --- 4. 가장 오래된 동물 조회 (로직 수정) ---
const getOldestAnimals = async (req, res) => {
    try {
        const query = `
            SELECT * FROM animals
            ORDER BY rescued_at ASC  -- ✅ 정렬 기준을 'rescued_at' (실제 구조일)로 수정
            LIMIT 12
        `;
        const [animals] = await pool.query(query);
        // 다른 API와 응답 형식을 통일 (totalPages 포함)
        res.json({ animals: animals, totalPages: 1 });
    } catch (error) {
        console.error('Error fetching oldest animals:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    getAnimals,
    getAllShelters,
    getAnimalById,
    getOldestAnimals,
};