const db = require('../config/database');
const { respondWithError } = require('../utils/dbErrors');
const { invalidId, invalidText, invalidOptionalText, toOptionalText, invalidOptionalNumber } = require('../utils/validateInput');
const { saveFormCalculation } = require('../services/calculationService');

const PERCENTUAIS = ['proteina_bruta_p', 'extrato_etereo_p', 'extrativo_nao_nitrogenado_p', 'umidade_p', 'fibra_bruta_p', 'materia_mineral_p'];

// Mesma normalização do EMCalculator: aceita 'Úmido', 'UMIDO' etc.
const normalizarTipo = (tipo) => String(tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Valida os campos comuns ao cadastro e à edição; retorna a mensagem de erro ou null
const foodDataError = (body) => {
  const { descricao_alimento, tipo, quantidade_g_dia, frequencia } = body;
  if (descricao_alimento !== undefined && invalidText(descricao_alimento)) return 'descricao_alimento não pode ficar vazio';
  if (tipo !== undefined && tipo !== null && tipo !== '' && !['seco', 'umido'].includes(normalizarTipo(tipo))) {
    return "tipo deve ser 'seco' ou 'umido'";
  }
  if (invalidOptionalNumber(quantidade_g_dia, { min: 0, max: 999999.99, allowMin: false })) return 'quantidade_g_dia deve ser um número maior que zero';
  if (invalidOptionalText(frequencia)) return 'frequencia deve ser texto';
  const percentualInvalido = PERCENTUAIS.find((campo) => invalidOptionalNumber(body[campo], { min: 0, max: 100 }));
  if (percentualInvalido) return `${percentualInvalido} deve ser um número entre 0 e 100`;
  return null;
};

// Mantém o cálculo salvo (usado no PDF e no histórico) em dia com os alimentos
const recalcular = async (formulario_id) => {
  try {
    await saveFormCalculation(formulario_id);
  } catch (errCalc) {
    // Falhas no cálculo não quebram o fluxo principal
    console.error('Erro no cálculo nutricional (alimentos):', errCalc.message);
  }
};

const createConsumedFood = async (req, res) => {
  try {
    const { formulario_id, descricao_alimento, tipo, quantidade_g_dia, frequencia, proteina_bruta_p, extrato_etereo_p, extrativo_nao_nitrogenado_p, umidade_p, fibra_bruta_p, materia_mineral_p } = req.body ?? {};
    if (invalidId(formulario_id) || invalidText(descricao_alimento) || quantidade_g_dia === undefined || quantidade_g_dia === null) {
      return res.status(400).json({ error: 'formulario_id, descricao_alimento e quantidade_g_dia são obrigatórios' });
    }
    const erro = foodDataError(req.body);
    if (erro) return res.status(400).json({ error: erro });

    // Verificar se o formulário pertence à clínica
    const { rows: formRows } = await db.query(
      `SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE f.id = $1 AND p.clinica_id = $2`,
      [Number(formulario_id), req.user.clinicaId]
    );
    if (!formRows.length) return res.status(403).json({ error: 'Acesso negado: formulário não pertence à sua clínica' });

    const { rows } = await db.query(
      `INSERT INTO alimentos_consumidos(
        formulario_id, descricao_alimento, tipo, quantidade_g_dia, frequencia,
        proteina_bruta_p, extrato_etereo_p, extrativo_nao_nitrogenado_p, umidade_p, fibra_bruta_p, materia_mineral_p)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [Number(formulario_id), descricao_alimento.trim(), tipo ? normalizarTipo(tipo) : null, quantidade_g_dia, toOptionalText(frequencia),
      proteina_bruta_p ?? null, extrato_etereo_p ?? null, extrativo_nao_nitrogenado_p ?? null, umidade_p ?? null, fibra_bruta_p ?? null, materia_mineral_p ?? null]
    );
    await recalcular(formulario_id);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao adicionar alimento');
  }
};

const listConsumedFoods = async (req, res) => {
  try {
    const { formulario_id } = req.query;
    if (formulario_id !== undefined && invalidId(formulario_id)) {
      return res.status(400).json({ error: 'formulario_id inválido' });
    }
    let sql = `
      SELECT c.* FROM alimentos_consumidos c
      JOIN formularios_dieteticos f ON c.formulario_id = f.id
      JOIN pacientes p ON f.paciente_id = p.id
      WHERE p.clinica_id = $1
    `;
    const params = [req.user.clinicaId];
    if (formulario_id) {
      params.push(Number(formulario_id));
      sql += ` AND c.formulario_id = $${params.length}`;
    }
    sql += ' ORDER BY c.id DESC';
    const { rows } = await db.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao listar alimentos');
  }
};

const getConsumedFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT c.* FROM alimentos_consumidos c
      JOIN formularios_dieteticos f ON c.formulario_id = f.id
      JOIN pacientes p ON f.paciente_id = p.id
      WHERE c.id=$1 AND p.clinica_id=$2
    `, [Number(id), req.user.clinicaId]);
    if (!rows.length) return res.status(404).json();
    return res.status(200).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao buscar alimento');
  }
};

const updateConsumedFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao_alimento, tipo, quantidade_g_dia, frequencia, proteina_bruta_p, extrato_etereo_p, extrativo_nao_nitrogenado_p, umidade_p, fibra_bruta_p, materia_mineral_p } = req.body ?? {};
    const erro = foodDataError(req.body ?? {});
    if (erro) return res.status(400).json({ error: erro });
    const { rows } = await db.query(
      `UPDATE alimentos_consumidos SET
        descricao_alimento = COALESCE($1, descricao_alimento),
        tipo = COALESCE($2, tipo),
        quantidade_g_dia = COALESCE($3, quantidade_g_dia),
        frequencia = COALESCE($4, frequencia),
        proteina_bruta_p = COALESCE($5, proteina_bruta_p),
        extrato_etereo_p = COALESCE($6, extrato_etereo_p),
        extrativo_nao_nitrogenado_p = COALESCE($7, extrativo_nao_nitrogenado_p),
        umidade_p = COALESCE($8, umidade_p),
        fibra_bruta_p = COALESCE($9, fibra_bruta_p),
        materia_mineral_p = COALESCE($10, materia_mineral_p)
       WHERE id=$11 AND formulario_id IN (
         SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE p.clinica_id = $12
       ) RETURNING *`,
      [descricao_alimento?.trim() ?? null, tipo ? normalizarTipo(tipo) : null, quantidade_g_dia ?? null, frequencia === undefined || frequencia === null ? null : String(frequencia).trim(),
      proteina_bruta_p ?? null, extrato_etereo_p ?? null, extrativo_nao_nitrogenado_p ?? null, umidade_p ?? null, fibra_bruta_p ?? null, materia_mineral_p ?? null,
      Number(id), req.user.clinicaId]
    );
    if (!rows.length) return res.status(404).json();
    await recalcular(rows[0].formulario_id);
    return res.status(200).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao atualizar alimento');
  }
};

const deleteConsumedFood = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      DELETE FROM alimentos_consumidos 
      WHERE id=$1 AND formulario_id IN (
         SELECT f.id FROM formularios_dieteticos f JOIN pacientes p ON f.paciente_id = p.id WHERE p.clinica_id = $2
      )
      RETURNING formulario_id
    `, [Number(id), req.user.clinicaId]);
    if (result.rowCount === 0) return res.status(404).json();
    await recalcular(result.rows[0].formulario_id);
    return res.status(204).json();
  } catch (err) {
    return respondWithError(res, err, 'Erro ao deletar alimento');
  }
};

module.exports = {
  createConsumedFood,
  listConsumedFoods,
  getConsumedFoodById,
  updateConsumedFood,
  deleteConsumedFood,
};
