const axios = require('axios');
const { Animal, Shelter, sequelize } = require('../models');

// 유기동물 목록 조회 (필터링 및 페이지네이션)
exports.getAnimals = async (req, res) => {
    const { filter, page = 1, shelter_id } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        let whereClause = {};
        
        // 종류별 필터링
        if (filter && filter !== 'all') {
            if (filter === 'dog') {
                whereClause.species = { [sequelize.Sequelize.Op.like]: '%개%' };
            } else if (filter === 'cat') {
                whereClause.species = { [sequelize.Sequelize.Op.like]: '%고양이%' };
            } else if (filter === 'other') {
                whereClause.species = { 
                    [sequelize.Sequelize.Op.and]: [
                        { [sequelize.Sequelize.Op.notLike]: '%개%' },
                        { [sequelize.Sequelize.Op.notLike]: '%고양이%' }
                    ]
                };
            }
        }

        // 보호소별 필터링
        if (shelter_id && shelter_id !== 'all') {
            whereClause.shelter_id = shelter_id;
        }

        // 총 개수 조회
        const totalAnimals = await Animal.count({ where: whereClause });
        const totalPages = Math.ceil(totalAnimals / limit);

        // 페이지네이션된 동물 목록 조회
        const animals = await Animal.findAll({
            where: whereClause,
            order: [['animal_id', 'DESC']],
            limit,
            offset
        });

        res.json({ animals, totalPages });

    } catch (error) {
        console.error('getAnimals error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 특정 유기동물 상세 정보 조회
exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findByPk(req.params.id);
        if (animal) {
            res.json(animal);
        } else {
            res.status(404).json({ message: '동물을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('getAnimalById error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 보호소 목록 조회
exports.getShelters = async (req, res) => {
    try {
        const shelters = await Shelter.findAll();
        res.json(shelters);
    } catch (error) {
        console.error('getShelters error:', error);
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
        const animals = await Animal.findAll({
            order: [['rescued_at', 'ASC']],
            limit
        });
        res.json({ animals });
    } catch (error) {
        console.error('Error fetching oldest animals:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};