const { Router } = require('express');
const rateLimit = require('express-rate-limit')
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/checkRole');

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutos
    max: 5,
    message: {
        error: 'Muitas tentativas de login, tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/auth/register', authenticateToken, checkRole('admin'), UserController.register);
router.post('/auth/login', loginLimiter, UserController.login);

router.get(
    '/api/usuarios',
    authenticateToken,
    checkRole('admin'),
    UserController.listUsers
);

router.get(
    '/api/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.getUserById
);

router.put(
    '/api/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.updateUser
);

router.delete(
    '/api/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.deleteUser
);

module.exports = router;
