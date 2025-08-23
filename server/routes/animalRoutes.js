const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');

router.get('/', animalController.getAnimals);
router.get('/oldest', animalController.getOldestAnimals); // New route
router.get('/:id', animalController.getAnimalById);

module.exports = router;
