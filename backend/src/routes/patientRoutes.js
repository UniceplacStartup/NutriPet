const { Router } = require('express');
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middlewares/auth');
const { validateIdParam } = require('../middlewares/validateIdParam');
const { checkRole } = require('../middlewares/checkRole');
const { validatePatientAccess } = require('../middlewares/validateClinicAccess');

const router = Router();

// Só no prefixo do recurso: aplicado a todo /api, barraria as rotas de outros routers
router.use('/pacientes', authenticateToken);
router.param('id', validateIdParam);

router.post('/pacientes', checkRole('admin', 'veterinario'), patientController.createPatient);
router.get('/pacientes', checkRole('admin', 'veterinario', 'atendente'), patientController.listPatients);
router.get('/pacientes/:id', checkRole('admin', 'veterinario', 'atendente'), validatePatientAccess, patientController.getPatientById);
router.put('/pacientes/:id', checkRole('admin', 'veterinario'), validatePatientAccess, patientController.updatePatient);
router.delete('/pacientes/:id', checkRole('admin', 'veterinario'), validatePatientAccess, patientController.deletePatient);
router.get('/pacientes/:id/historico', checkRole('admin', 'veterinario', 'atendente'), validatePatientAccess, patientController.getPatientHistory);

module.exports = router;
