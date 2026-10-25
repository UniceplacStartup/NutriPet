const { Router } = require('express');
const tutorController = require('../controllers/tutorController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/tutores', authenticateToken);
router.param('id', validateIdParam);

router.post('/tutores', checkRole('admin', 'veterinario'), tutorController.createTutor);
router.get('/tutores', checkRole('admin', 'veterinario', 'atendente'), tutorController.listTutores);
router.get('/tutores/:id', checkRole('admin', 'veterinario', 'atendente'), tutorController.getTutorById);
router.put('/tutores/:id', checkRole('admin', 'veterinario'), tutorController.updateTutor);
router.delete('/tutores/:id', checkRole('admin', 'veterinario'), tutorController.deleteTutor);

module.exports = router;
