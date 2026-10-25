const { Router } = require('express');
const controller = require('../controllers/formCalculationController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/calculos', authenticateToken);
router.param('id', validateIdParam);

router.post('/calculos', checkRole('admin', 'veterinario'), controller.upsertFormCalculation); // upsert por formulario_id
router.get('/calculos/compute', checkRole('admin', 'veterinario', 'atendente'), controller.computeOnly); // calcula sem salvar
router.get('/calculos', checkRole('admin', 'veterinario', 'atendente'), controller.listFormCalculations);
router.get('/calculos/:id', checkRole('admin', 'veterinario', 'atendente'), controller.getFormCalculationById);
router.delete('/calculos/:id', checkRole('admin', 'veterinario'), controller.deleteFormCalculation);

module.exports = router;
