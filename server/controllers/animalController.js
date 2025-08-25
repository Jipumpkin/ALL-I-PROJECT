const Animal = require('../models/Animal');
const Shelter = require('../models/Shelter');
const axios = require('axios');
const db = require('../config/database');

// 유기동물 목록 조회 (필터링 및 페이지네이션)
exports.getAnimals = async (req, res) => {
    const { filter, page = 1, shelter_id } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        const pool = await db.getPool();
        let whereClauses = [];
        let params = [];

        if (filter && filter !== 'all') {
            if (filter === 'dog') {
                whereClauses.push("species LIKE ?");
                params.push('%개%');
            } else if (filter === 'cat') {
                whereClauses.push("species LIKE ?");
                params.push('%고양이%');
            } else if (filter === 'other') {
                whereClauses.push("species NOT LIKE ? AND species NOT LIKE ?");
                params.push('%개%');
                params.push('%고양이%');
            }
        }

        if (shelter_id && shelter_id !== 'all') {
            whereClauses.push("shelter_id = ?");
            params.push(shelter_id);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count total records
        const countQuery = `SELECT COUNT(*) as count FROM animals ${whereSql}`;
        const [countRows] = await pool.execute(countQuery, params);
        const totalAnimals = countRows[0].count;
        const totalPages = Math.ceil(totalAnimals / limit);

        // Fetch paginated records
        const query = `SELECT * FROM animals ${whereSql} ORDER BY animal_id DESC LIMIT ${limit} OFFSET ${offset}`;
        const [animals] = await pool.execute(query, params);

        res.json({ animals, totalPages });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 특정 유기동물 상세 정보 조회
exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id);
        if (animal) {
            res.json(animal);
        } else {
            res.status(404).json({ message: '동물을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 보호소 목록 조회
exports.getShelters = async (req, res) => {
    try {
        const shelters = await Shelter.findAll();
        res.json(shelters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 이미지 프록시 컨트롤러
exports.imageProxy = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('Image URL is required');
        }

        const response = await axios({
            method: 'get',
            url: decodeURIComponent(url),
            responseType: 'stream'
        });

        response.data.pipe(res);

    } catch (error) {
        console.error('Image proxy error:', error);
        res.status(500).send('Error fetching image');
    }
};

// 가장 오래된 동물 조회
exports.getOldestAnimals = async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 6;
    try {
        const pool = await db.getPool();
        const query = `
            SELECT *
            FROM animals
            ORDER BY rescued_at ASC
            LIMIT ${limit}
        `;
        const [animals] = await pool.execute(query);
        res.json({ animals: animals });
    } catch (error) {
        console.error('Error fetching oldest animals:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};