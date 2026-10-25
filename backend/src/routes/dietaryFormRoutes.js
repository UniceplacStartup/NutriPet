const { Router } = require('express');
const controller = require('../controllers/dietaryFormController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');
const { validateFormAccess } = require('../middlewares/validateClinicAccess');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/formularios', authenticateToken);
router.param('id', validateIdParam);

router.post('/formularios', checkRole('admin', 'veterinario'), controller.createDietaryForm);
router.get('/formularios', checkRole('admin', 'veterinario', 'atendente'), controller.listDietaryForms);
router.get('/formularios/:id', checkRole('admin', 'veterinario', 'atendente'), validateFormAccess, controller.getDietaryFormById);
router.get('/formularios/:id/pdf', checkRole('admin', 'veterinario', 'atendente'), validateFormAccess, controller.generatePdfReport);
router.put('/formularios/:id', checkRole('admin', 'veterinario'), validateFormAccess, controller.updateDietaryForm);
router.delete('/formularios/:id', checkRole('admin', 'veterinario'), validateFormAccess, controller.deleteDietaryForm);

module.exports = router;
