const Animal = require('../models/Animal');

const animalController = {
    getAllAnimals: async (req, res) => {
        try {
            const animals = await Animal.findAll();
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAnimalById: async (req, res) => {
        try {
            const animal = await Animal.findById(req.params.id);
            if (!animal) {
                return res.status(404).json({ error: 'Animal not found' });
            }
            res.json(animal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createAnimal: async (req, res) => {
        try {
            const newAnimal = await Animal.create(req.body);
            res.status(201).json(newAnimal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateAnimal: async (req, res) => {
        try {
            const updatedAnimal = await Animal.update(req.params.id, req.body);
            res.json(updatedAnimal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteAnimal: async (req, res) => {
        try {
            await Animal.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = animalController;