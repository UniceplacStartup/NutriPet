const db = require('../config/database');
const { respondWithError } = require('../utils/dbErrors');

const validatePatientAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const clinica_id = req.user?.clinicaId;

        if (!id) {
            return res.status(400).json({ error: 'ID não fornecido.' });
        }

        const { rows } = await db.query('SELECT * FROM pacientes WHERE id = $1', [Number(id)]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Paciente não encontrado.' });
        }

        const paciente = rows[0];

        // Se o recurso pertencer a outra clínica, retorna 404
        if (Number(paciente.clinica_id) !== Number(clinica_id)) {
            return res.status(404).json({ error: 'Paciente não encontrado.' });
        }

        // Disponibiliza o paciente na requisição
        req.paciente = paciente;
        next();
    } catch (err) {
        return respondWithError(res, err, 'Erro ao validar acesso.');
    }
};

const validateFormAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const clinica_id = req.user?.clinicaId;

        if (!id) {
            return res.status(400).json({ error: 'ID não fornecido.' });
        }

        const { rows } = await db.query(`
            SELECT f.*, p.clinica_id 
            FROM formularios_dieteticos f
            JOIN pacientes p ON f.paciente_id = p.id
            WHERE f.id = $1
        `, [Number(id)]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Formulário não encontrado.' });
        }

        const formulario = rows[0];

        // Se o recurso pertencer a outra clínica, retorna 404
        if (Number(formulario.clinica_id) !== Number(clinica_id)) {
            return res.status(404).json({ error: 'Formulário não encontrado.' });
        }

        // Remove o clinica_id para retornar o formulário original
        delete formulario.clinica_id;
        
        // Disponibiliza o formulário na requisição
        req.formulario = formulario;
        next();
    } catch (err) {
        return respondWithError(res, err, 'Erro ao validar acesso.');
    }
};

module.exports = {
    validatePatientAccess,
    validateFormAccess
};
