const db = require('../config/database');
const { respondWithError } = require('../utils/dbErrors');
const { invalidText, invalidOptionalText, toOptionalText } = require('../utils/validateInput');

// Create
const createTutor = async (req, res) => {
  try {
    const clinica_id = req.user.clinicaId;
    const { nome, contato } = req.body ?? {};

    if (invalidText(nome)) {
      res.status(400).json({ error: 'nome é obrigatório' });
      return;
    }
    if (invalidOptionalText(contato)) {
      res.status(400).json({ error: 'contato deve ser texto' });
      return;
    }

    const { rows } = await db.query(
      'INSERT INTO tutores (clinica_id, nome, contato) VALUES ($1, $2, $3) RETURNING *',
      [clinica_id, nome.trim(), toOptionalText(contato)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    respondWithError(res, err, 'Erro ao criar tutor');
  }
};

// Read All
const listTutores = async (req, res) => {
  try {
    const clinica_id = req.user.clinicaId;
    const { rows } = await db.query('SELECT * FROM tutores WHERE clinica_id = $1 ORDER BY id DESC', [clinica_id]);
    res.status(200).json(rows);
  } catch (err) {
    respondWithError(res, err, 'Erro ao listar tutores');
  }
};

// Read One
const getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    const clinica_id = req.user.clinicaId;
    const { rows } = await db.query('SELECT * FROM tutores WHERE id = $1 AND clinica_id = $2', [id, clinica_id]);
    if (rows.length === 0) {
      res.status(404).json();
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    respondWithError(res, err, 'Erro ao buscar tutor');
  }
};

// Update
const updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const clinica_id = req.user.clinicaId;
    const { nome, contato } = req.body ?? {};
    if ((nome !== undefined && invalidText(nome)) || invalidOptionalText(contato)) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }
    const { rows } = await db.query(
      'UPDATE tutores SET nome = COALESCE($1, nome), contato = COALESCE($2, contato), updated_at = NOW() WHERE id = $3 AND clinica_id = $4 RETURNING *',
      [nome?.trim() ?? null, contato === undefined || contato === null ? null : String(contato).trim(), id, clinica_id]
    );
    if (rows.length === 0) {
      res.status(404).json();
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    respondWithError(res, err, 'Erro ao atualizar tutor');
  }
};

// Delete
const deleteTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const clinica_id = req.user.clinicaId;

    // Tutor de outra clínica é tratado como inexistente
    const { rows: tutor } = await db.query('SELECT id FROM tutores WHERE id = $1 AND clinica_id = $2', [id, clinica_id]);
    if (tutor.length === 0) {
      res.status(404).json();
      return;
    }

    // Verificar se tutor tem pacientes vinculados
    const { rows: pacientes } = await db.query('SELECT COUNT(*) as count FROM pacientes WHERE tutor_id = $1', [id]);
    if (parseInt(pacientes[0].count) > 0) {
      res.status(409).json({ error: 'Não é possível deletar um tutor que tem pacientes vinculados. Remova os pacientes primeiro.' });
      return;
    }

    const result = await db.query('DELETE FROM tutores WHERE id = $1 AND clinica_id = $2', [id, clinica_id]);
    if (result.rowCount === 0) {
      res.status(404).json();
      return;
    }
    res.status(204).json();
  } catch (err) {
    respondWithError(res, err, 'Erro ao deletar tutor');
  }
};

module.exports = {
  createTutor,
  listTutores,
  getTutorById,
  updateTutor,
  deleteTutor,
};
