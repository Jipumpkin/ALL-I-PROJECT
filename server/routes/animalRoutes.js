const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');

// GET /api/animals -> 필터링 기능이 포함된 동물 목록 조회
router.get('/', animalController.getAnimals);

// GET /api/animals/shelters -> 모든 보호소 목록 조회 (새로운 라우트)
router.get('/shelters', animalController.getAllShelters);

// GET /api/animals/oldest -> 가장 오래된 동물 조회
router.get('/oldest', animalController.getOldestAnimals);

// GET /api/animals/:id -> 특정 ID의 동물 상세 정보 조회
router.get('/:id', animalController.getAnimalById);

module.exports = router;