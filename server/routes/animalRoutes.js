const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');

// 가장 오래 기다린 동물 목록 조회
router.get('/oldest', animalController.getOldestAnimals);

// 메인 페이지용 동물 목록 조회
router.get('/list', animalController.getAnimalList);

router.get('/', animalController.getAllAnimals);
router.get('/:id', animalController.getAnimalById);
router.post('/', animalController.createAnimal);
router.put('/:id', animalController.updateAnimal);
router.delete('/:id', animalController.deleteAnimal);

module.exports = router;