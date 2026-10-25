const db = require('../config/database');
const { respondWithError } = require('../utils/dbErrors');
const { invalidId, invalidText, invalidOptionalText, toOptionalText } = require('../utils/validateInput');

const createConsumedSupplement = async (req, res) => {
  try {
    const { formulario_id, descricao, quantidade, frequencia } = req.body ?? {};
    if (invalidId(formulario_id) || invalidText(descricao)) {
      return res.status(400).json({ error: 'formulario_id e descricao são obrigatórios' });
    }
    if (invalidOptionalText(quantidade) || invalidOptionalText(frequencia)) {
      return res.status(400).json({ error: 'quantidade e frequencia devem ser texto' });
    }

    // Verificar se o formulário pertence à clínica
    const { rows: formRows } = await db.query(
      `SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE f.id = $1 AND p.clinica_id = $2`,
      [Number(formulario_id), req.user.clinicaId]
    );
    if (!formRows.length) return res.status(403).json({ error: 'Acesso negado: formulário não pertence à sua clínica' });

    const { rows } = await db.query(
      `INSERT INTO suplementos_consumidos(formulario_id, descricao, quantidade, frequencia)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [Number(formulario_id), descricao.trim(), toOptionalText(quantidade), toOptionalText(frequencia)]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao adicionar suplemento');
  }
};

const listConsumedSupplements = async (req, res) => {
  try {
    const { formulario_id } = req.query;
    if (formulario_id !== undefined && invalidId(formulario_id)) {
      return res.status(400).json({ error: 'formulario_id inválido' });
    }
    let sql = `
      SELECT s.* FROM suplementos_consumidos s
      JOIN formularios_dieteticos f ON s.formulario_id = f.id
      JOIN pacientes p ON f.paciente_id = p.id
      WHERE p.clinica_id = $1
    `;
    const params = [req.user.clinicaId];
    if (formulario_id) {
      params.push(Number(formulario_id));
      sql += ` AND s.formulario_id = $${params.length}`;
    }
    sql += ' ORDER BY s.id DESC';
    const { rows } = await db.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao listar suplementos');
  }
};

const getConsumedSupplementById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT s.* FROM suplementos_consumidos s
      JOIN formularios_dieteticos f ON s.formulario_id = f.id
      JOIN pacientes p ON f.paciente_id = p.id
      WHERE s.id=$1 AND p.clinica_id=$2
    `, [Number(id), req.user.clinicaId]);
    if (!rows.length) return res.status(404).json();
    return res.status(200).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao buscar suplemento');
  }
};

const updateConsumedSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, quantidade, frequencia } = req.body ?? {};
    if ((descricao !== undefined && invalidText(descricao)) || invalidOptionalText(quantidade) || invalidOptionalText(frequencia)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const textoOuNull = (v) => (v === undefined || v === null ? null : String(v).trim());
    const { rows } = await db.query(
      `UPDATE suplementos_consumidos SET
        descricao = COALESCE($1, descricao),
        quantidade = COALESCE($2, quantidade),
        frequencia = COALESCE($3, frequencia)
       WHERE id=$4 AND formulario_id IN (
         SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE p.clinica_id = $5
       ) RETURNING *`,
      [descricao?.trim() ?? null, textoOuNull(quantidade), textoOuNull(frequencia), Number(id), req.user.clinicaId]
    );
    if (!rows.length) return res.status(404).json();
    return res.status(200).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao atualizar suplemento');
  }
};

const deleteConsumedSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      DELETE FROM suplementos_consumidos 
      WHERE id=$1 AND formulario_id IN (
         SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE p.clinica_id = $2
      )
    `, [Number(id), req.user.clinicaId]);
    if (result.rowCount === 0) return res.status(404).json();
    return res.status(204).json();
  } catch (err) {
    return respondWithError(res, err, 'Erro ao deletar suplemento');
  }
};

module.exports = {
  createConsumedSupplement,
  listConsumedSupplements,
  getConsumedSupplementById,
  updateConsumedSupplement,
  deleteConsumedSupplement,
};
