const Shelter = require('../models/Shelter');

const shelterController = {
    getAllShelters: async (req, res) => {
        try {
            const shelters = await Shelter.findAll();
            res.json(shelters);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getShelterById: async (req, res) => {
        try {
            const shelter = await Shelter.findById(req.params.id);
            if (!shelter) {
                return res.status(404).json({ error: 'Shelter not found' });
            }
            res.json(shelter);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createShelter: async (req, res) => {
        try {
            const newShelter = await Shelter.create(req.body);
            res.status(201).json(newShelter);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateShelter: async (req, res) => {
        try {
            const updatedShelter = await Shelter.update(req.params.id, req.body);
            res.json(updatedShelter);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteShelter: async (req, res) => {
        try {
            await Shelter.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = shelterController;