// controllers/animalController.js

const pool = require('../db/connection');

// --- 1. 동물 목록 조회 (보호소 필터링, 페이지네이션) ---
const getAnimals = async (req, res) => {
    // 받는 파라미터를 filter, page, shelter_id로 단순화
    const { 
        filter, 
        page = 1,
        shelter_id 
    } = req.query;
    
    const limit = 12;
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    // --- 카테고리 필터 조건 ---
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

    // --- 보호소 필터 조건 추가 ---
    if (shelter_id && shelter_id !== 'all') {
        whereClauses.push('a.shelter_id = ?'); // 'animals' 테이블을 a로 별칭
        queryParams.push(shelter_id);
    }

    const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        // shelter_id 필터링을 위해 animals 테이블에 별칭 'a'를 부여
        const countQuery = `SELECT COUNT(*) as count FROM animals a ${whereQuery}`;
        const [countRows] = await pool.query(countQuery, queryParams);
        const totalAnimals = countRows[0].count;
        const totalPages = Math.ceil(totalAnimals / limit);

        const animalsQuery = `
            SELECT * FROM animals a
            ${whereQuery}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...queryParams, limit, offset];
        const [animals] = await pool.query(animalsQuery, finalParams);
        
        res.json({ animals, totalPages });

    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// --- 2. 모든 보호소 목록 조회 (새로 추가된 함수) ---
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

// --- 3. ID로 특정 동물 조회 ---
const getAnimalById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT a.*, s.shelter_name, s.address as shelter_address, s.contact_number as shelter_contact_number 
            FROM animals a
            LEFT JOIN shelters s ON a.shelter_id = s.shelter_id
            WHERE a.animal_id = ?`;
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

// --- 4. 보호소 입소일이 오래된 동물 조회 ---
const getOldestAnimals = async (req, res) => {
    // (기존 코드와 동일)
    try {
        const query = `SELECT * FROM animals ORDER BY created_at ASC LIMIT 12`;
        const [animals] = await pool.query(query);
        res.json({ animals });
    } catch (error) {
        console.error('Error fetching oldest animals:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    getAnimals,
    getAllShelters, // export에 추가
    getAnimalById,
    getOldestAnimals,
};