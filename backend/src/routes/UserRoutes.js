const { Router } = require('express');
const rateLimit = require('express-rate-limit')
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/checkRole');
const { validateIdParam } = require('../middlewares/validateIdParam');

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutos
    max: 5,
    message: {
        error: 'Muitas tentativas de login, tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Conta só as tentativas que falharam: logins certos não bloqueiam ninguém
    skipSuccessfulRequests: true
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: {
        error: 'Muitos cadastros a partir deste endereço, tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.param('id', validateIdParam);

// Cadastro público de clínica + admin, liberado para quem tem matrícula da faculdade
router.post('/auth/cadastro', signupLimiter, UserController.signup);
router.post('/auth/register', authenticateToken, checkRole('admin'), UserController.register);
router.post('/auth/login', loginLimiter, UserController.login);

router.get(
    '/usuarios',
    authenticateToken,
    checkRole('admin'),
    UserController.listUsers
);

router.get(
    '/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.getUserById
);

router.put(
    '/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.updateUser
);

router.delete(
    '/usuarios/:id',
    authenticateToken,
    checkRole('admin'),
    UserController.deleteUser
);

module.exports = router;
