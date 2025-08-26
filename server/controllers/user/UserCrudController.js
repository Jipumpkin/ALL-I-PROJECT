const UserService = require('../../services/userService');
const { User } = require('../../models');

const UserCrudController = {
    /**
     * 모든 사용자 조회
     * GET /api/users/
     */
    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * 특정 사용자 조회
     * GET /api/users/:id
     */
    getUserById: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * 사용자 생성
     * POST /api/users/
     */
    createUser: async (req, res) => {
        try {
            const newUser = await User.createUser(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * 사용자 수정
     * PUT /api/users/:id
     */
    updateUser: async (req, res) => {
        try {
            const updatedUser = await User.updateProfile(req.params.id, req.body);
            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * 사용자 삭제
     * DELETE /api/users/:id
     */
    deleteUser: async (req, res) => {
        try {
            const deleted = await User.deleteAccount(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = UserCrudController;