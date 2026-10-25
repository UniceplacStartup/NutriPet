const { Router } = require('express');
const clinicController = require('../controllers/clinicController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/clinicas', authenticateToken);
router.param('id', validateIdParam);

// Rota para RF02: Cadastro da Clínica
router.post('/clinicas', checkRole('admin'), clinicController.createClinic);

// Suporte à listagem de clínicas para o frontend (só a clínica do usuário)
router.get('/clinicas', checkRole('admin', 'veterinario', 'atendente'), clinicController.listClinics);
router.get('/clinicas/:id', checkRole('admin', 'veterinario', 'atendente'), clinicController.getClinicById);
router.put('/clinicas/:id', checkRole('admin'), clinicController.updateClinic);

module.exports = router;
