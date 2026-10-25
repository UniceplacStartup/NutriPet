const Clinic = require('../models/Clinic');
const db = require('../config/database');

const { respondWithError } = require('../utils/dbErrors');
const { invalidText, invalidCnpj, normalizeCnpj, invalidEmail, normalizeEmail, invalidOptionalText, toOptionalText } = require('../utils/validateInput');

const createClinic = async (req, res) => {
    try {
        const erro = Clinic.Clinic.validate(req.body);
        if (erro) {
            res.status(400).json({ error: erro });
            return
        }

        const clinic = Clinic.Clinic.fromBody(req.body);

        await clinic.save();

        res.status(201).json({
            message: 'Clínica criada com sucesso',
            clinica: clinic
        });
    } catch (err) {
        respondWithError(res, err, 'Erro ao criar clínica');
    }
};

// Usuários só enxergam a própria clínica
const getClinicById = async (req, res) => {
    try {
        const { id } = req.params;
        if (Number(id) !== Number(req.user.clinicaId)) {
            return res.status(404).json({ error: 'Clínica não encontrada' });
        }
        const { rows } = await db.query('SELECT * FROM clinicas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Clínica não encontrada' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        respondWithError(res, err, 'Erro ao buscar clínica');
    }
};

const updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        if (Number(id) !== Number(req.user.clinicaId)) {
            return res.status(404).json({ error: 'Clínica não encontrada' });
        }

        // Aceita razaoSocial (padrão do cadastro) ou razao_social (padrão do GET)
        const { cnpj, email, telefone } = req.body ?? {};
        const razaoSocial = req.body?.razaoSocial ?? req.body?.razao_social;

        if ((cnpj !== undefined && invalidCnpj(cnpj)) || (razaoSocial !== undefined && invalidText(razaoSocial))
            || (email !== undefined && invalidEmail(email)) || invalidOptionalText(telefone)) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const { rows } = await db.query(
            `UPDATE clinicas SET
                cnpj = COALESCE($1, cnpj),
                razao_social = COALESCE($2, razao_social),
                email = COALESCE($3, email),
                telefone = COALESCE($4, telefone),
                updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [
                cnpj !== undefined ? normalizeCnpj(cnpj.trim()) : null,
                razaoSocial?.trim() ?? null,
                email !== undefined ? normalizeEmail(email) : null,
                toOptionalText(telefone),
                id
            ]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Clínica não encontrada' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        respondWithError(res, err, 'Erro ao atualizar clínica');
    }
};

module.exports = {
    createClinic,
    getClinicById,
    updateClinic,
    // Lista a clínica do usuário (suporte ao frontend); antes listava as de todos
    async listClinics(req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM clinicas WHERE id = $1 ORDER BY id ASC', [req.user.clinicaId]);
            res.status(200).json(rows);
        } catch (err) {
            respondWithError(res, err, 'Erro ao listar clínicas');
        }
    },
};
