const { Router } = require('express');
const controller = require('../controllers/consumedFoodController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/alimentos', authenticateToken);
router.param('id', validateIdParam);

router.post('/alimentos', checkRole('admin', 'veterinario'), controller.createConsumedFood);
router.get('/alimentos', checkRole('admin', 'veterinario', 'atendente'), controller.listConsumedFoods);
router.get('/alimentos/:id', checkRole('admin', 'veterinario', 'atendente'), controller.getConsumedFoodById);
router.put('/alimentos/:id', checkRole('admin', 'veterinario'), controller.updateConsumedFood);
router.delete('/alimentos/:id', checkRole('admin', 'veterinario'), controller.deleteConsumedFood);

module.exports = router;
