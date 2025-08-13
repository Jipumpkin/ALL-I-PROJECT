const Animal = require('../models/Animal');

const animalController = {
    // 가장 오래 기다린 동물 목록 조회
    getOldestAnimals: async (req, res) => {
        try {
            const animals = await Animal.findOldest();
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 메인 페이지용 동물 목록 조회
    getAnimalList: async (req, res) => {
        try {
            // 모델에 새로운 함수를 만들어 필요한 데이터만 조회
            const animals = await Animal.findAllForList(); 
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

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