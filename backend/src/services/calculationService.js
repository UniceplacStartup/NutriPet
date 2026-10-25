const db = require('../config/database');
const NutritionalCalculator = require('./NutritionalCalculator');

// Helpers
const round2 = (n) => (n === null || n === undefined || isNaN(n) ? null : Math.round(n * 100) / 100);

async function getFormById(formulario_id) {
  const { rows } = await db.query('SELECT * FROM formularios_dieteticos WHERE id=$1', [Number(formulario_id)]);
  return rows[0];
}

async function getPatientById(paciente_id) {
  const { rows } = await db.query('SELECT * FROM pacientes WHERE id=$1', [Number(paciente_id)]);
  return rows[0];
}

async function getFoodsByFormId(formulario_id) {
  const { rows } = await db.query('SELECT * FROM alimentos_consumidos WHERE formulario_id=$1', [Number(formulario_id)]);
  return rows;
}

async function computeFormCalculation(formulario_id) {
  const form = await getFormById(formulario_id);
  if (!form) throw new Error('Formulário não encontrado');

  const patient = await getPatientById(form.paciente_id);
  if (!patient) throw new Error('Paciente não encontrado para o formulário');

  const foods = await getFoodsByFormId(formulario_id);

  const calculo = NutritionalCalculator.calcular(patient, form, foods);

  return {
    em_total_kcal_dia: round2(calculo.emTotal),
    nem_calculada_kcal_dia: round2(calculo.nem),
    quantidade_racao_recomendada_g_dia: round2(calculo.quantidadeRecomendada),
    condicao: calculo.condicao,
  };
}

// Calcula e persiste (relação 1:1 com o formulário)
async function saveFormCalculation(formulario_id) {
  const calculo = await computeFormCalculation(formulario_id);
  const { rows } = await db.query(`
    INSERT INTO calculos_formulario (formulario_id, em_total_kcal_dia, nem_calculada_kcal_dia, quantidade_racao_recomendada_g_dia)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (formulario_id) DO UPDATE SET
      em_total_kcal_dia = EXCLUDED.em_total_kcal_dia,
      nem_calculada_kcal_dia = EXCLUDED.nem_calculada_kcal_dia,
      quantidade_racao_recomendada_g_dia = EXCLUDED.quantidade_racao_recomendada_g_dia
    RETURNING *
  `, [Number(formulario_id), calculo.em_total_kcal_dia, calculo.nem_calculada_kcal_dia, calculo.quantidade_racao_recomendada_g_dia]);
  return { ...rows[0], condicao: calculo.condicao };
}

module.exports = {
  computeFormCalculation,
  saveFormCalculation,
};
