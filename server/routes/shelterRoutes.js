const express = require('express');
const router = express.Router();
const shelterController = require('../controllers/shelterController');

router.get('/', shelterController.getAllShelters);
router.get('/:id', shelterController.getShelterById);
router.post('/', shelterController.createShelter);
router.put('/:id', shelterController.updateShelter);
router.delete('/:id', shelterController.deleteShelter);

module.exports = router;