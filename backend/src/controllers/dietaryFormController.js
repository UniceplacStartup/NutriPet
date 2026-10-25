const db = require('../config/database');
const { isUndefined } = require('../utils/validateInput');
const NutritionalCalculator = require('../services/NutritionalCalculator');
const { saveFormCalculation } = require('../services/calculationService');
const PDFDocument = require('pdfkit');

// Texto vazio vira null (usa a condição padrão da espécie)
const normalizarCondicao = (condicao) => (typeof condicao === 'string' ? condicao.trim() || null : condicao ?? null);

// Valida peso, condição e detalhes rodando o cálculo sem alimentos.
// Retorna a mensagem de erro, ou null se os dados forem válidos.
const validarDadosNutricionais = (paciente, { peso_atual, condicao, detalhes }) => {
  if (condicao !== null && typeof condicao !== 'string') {
    return 'condicao deve ser texto';
  }
  if (detalhes !== null && (typeof detalhes !== 'object' || Array.isArray(detalhes))) {
    return 'detalhes deve ser um objeto';
  }
  try {
    NutritionalCalculator.calcular(paciente, { peso_atual, condicao, detalhes }, []);
    return null;
  } catch (err) {
    return err.message.trim();
  }
};

const createDietaryForm = async (req, res) => {
  try {
    const { paciente_id, usuario_id, peso_atual, condicoes_clinicas, observacoes_vet, condicao, detalhes } = req.body;
    if (isUndefined(paciente_id) || isUndefined(peso_atual)) {
      return res.status(400).json({ error: 'paciente_id e peso_atual são obrigatórios' });
    }

    // Verificar se o paciente pertence à clínica do usuário e buscar dados completos
    const { rows: pacienteRows } = await db.query('SELECT * FROM pacientes WHERE id = $1 AND clinica_id = $2', [Number(paciente_id), req.user.clinicaId]);
    if (!pacienteRows.length) return res.status(403).json({ error: 'Acesso negado: paciente não pertence à sua clínica' });

    const paciente = pacienteRows[0];

    const dadosNutricionais = { peso_atual, condicao: normalizarCondicao(condicao), detalhes: detalhes ?? null };
    const erroValidacao = validarDadosNutricionais(paciente, dadosNutricionais);
    if (erroValidacao) return res.status(400).json({ error: erroValidacao });

    const { rows } = await db.query(
      `INSERT INTO formularios_dieteticos (paciente_id, usuario_id, peso_atual, condicoes_clinicas, observacoes_vet, condicao, detalhes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [Number(paciente_id), usuario_id ? Number(usuario_id) : null, peso_atual, condicoes_clinicas || null, observacoes_vet || null,
      dadosNutricionais.condicao, dadosNutricionais.detalhes]
    );

    const formulario = rows[0];

    try {
      // Novo formulário ainda sem alimentos: registra o NEM, a quantidade fica nula
      await saveFormCalculation(formulario.id);
    } catch (errCalc) {
      // Falhas no cálculo não quebram o fluxo principal
      console.error('Erro no cálculo nutricional (create):', errCalc.message);
    }

    return res.status(201).json(formulario);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar formulário', details: err.message });
  }
};

const listDietaryForms = async (req, res) => {
  try {
    const { paciente_id } = req.query;
    let sql = `
      SELECT f.* 
      FROM formularios_dieteticos f
      JOIN pacientes p ON f.paciente_id = p.id
      WHERE p.clinica_id = $1
    `;
    const params = [req.user.clinicaId];
    if (paciente_id) {
      params.push(Number(paciente_id));
      sql += ` AND f.paciente_id = $${params.length}`;
    }
    sql += ' ORDER BY f.id DESC';
    const { rows } = await db.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar formulários', details: err.message });
  }
};

const getDietaryFormById = async (req, res) => {
  try {
    return res.status(200).json(req.formulario);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar formulário', details: err.message });
  }
};

const updateDietaryForm = async (req, res) => {
  try {
    const { id } = req.formulario;
    const { peso_atual, condicoes_clinicas, observacoes_vet, condicao, detalhes } = req.body;

    // Campos ausentes mantêm o valor atual; condicao/detalhes aceitam null para voltar ao padrão
    const dadosNutricionais = {
      peso_atual: peso_atual ?? req.formulario.peso_atual,
      condicao: condicao === undefined ? req.formulario.condicao : normalizarCondicao(condicao),
      detalhes: detalhes === undefined ? req.formulario.detalhes : detalhes,
    };

    const { rows: pacRows } = await db.query('SELECT * FROM pacientes WHERE id = $1', [Number(req.formulario.paciente_id)]);
    const erroValidacao = validarDadosNutricionais(pacRows[0], dadosNutricionais);
    if (erroValidacao) return res.status(400).json({ error: erroValidacao });

    const { rows } = await db.query(
      `UPDATE formularios_dieteticos SET
        peso_atual = $1,
        condicoes_clinicas = COALESCE($2, condicoes_clinicas),
        observacoes_vet = COALESCE($3, observacoes_vet),
        condicao = $4,
        detalhes = $5,
        updated_at = NOW()
       WHERE id=$6 RETURNING *`,
      [dadosNutricionais.peso_atual, condicoes_clinicas ?? null, observacoes_vet ?? null,
      dadosNutricionais.condicao, dadosNutricionais.detalhes, Number(id)]
    );
    if (!rows.length) return res.status(404).json();

    const formularioAtualizado = rows[0];

    try {
      // Recalcula com os dados atualizados e os alimentos já cadastrados
      await saveFormCalculation(id);
    } catch (errCalc) {
      // Falhas no cálculo não quebram o fluxo principal
      console.error('Erro no cálculo nutricional (update):', errCalc.message);
    }

    return res.status(200).json(formularioAtualizado);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar formulário', details: err.message });
  }
};

const deleteDietaryForm = async (req, res) => {
  try {
    const { id } = req.formulario;
    const result = await db.query(`
      DELETE FROM formularios_dieteticos 
      WHERE id=$1
    `, [Number(id)]);
    if (result.rowCount === 0) return res.status(404).json();
    return res.status(204).json();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar formulário', details: err.message });
  }
};

const generatePdfReport = async (req, res) => {
  try {
    // Proteção de tipo: conversão explícita para BIGINT (Number)
    const formId = Number(req.params.id);
    
    // Verifica se formulário existe e valida o ID com o req.formulario
    if (!req.formulario || Number(req.formulario.id) !== formId) {
      return res.status(404).json({ error: 'Formulário não encontrado ou sem permissão' });
    }

    const doc = new PDFDocument();

    // Define cabeçalhos para forçar o download automático do arquivo em PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_formulario_${formId}.pdf"`);

    // Utiliza streams para enviar o PDF otimizando memória
    doc.pipe(res);

    // Conteúdo do relatório
    doc.fontSize(20).text('Relatório Dietético', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Formulário ID: ${formId}`);
    doc.text(`Paciente ID: ${req.formulario.paciente_id}`);
    doc.text(`Peso Atual: ${req.formulario.peso_atual} kg`);
    
    if (req.formulario.condicoes_clinicas) {
      doc.moveDown();
      doc.text('Condições Clínicas:');
      doc.fontSize(12).text(req.formulario.condicoes_clinicas);
    }

    if (req.formulario.observacoes_vet) {
      doc.moveDown();
      doc.fontSize(14).text('Observações Veterinárias:');
      doc.fontSize(12).text(req.formulario.observacoes_vet);
    }

    // Busca resultados do cálculo na tabela
    const { rows: calcRows } = await db.query('SELECT * FROM calculos_formulario WHERE formulario_id = $1', [formId]);
    
    if (calcRows.length > 0) {
      const calculo = calcRows[0];
      doc.moveDown();
      doc.fontSize(14).text('Cálculos Nutricionais:');
      doc.fontSize(12).text(`EM Total: ${calculo.em_total_kcal_dia} kcal/dia`);
      doc.text(`NEM: ${calculo.nem_calculada_kcal_dia} kcal/dia`);
      doc.text(`Quantidade Recomendada: ${calculo.quantidade_racao_recomendada_g_dia} g/dia`);
    }

    // Finaliza stream do documento
    doc.end();
  } catch (err) {
    // Trata falha com status 500 caso ocorra erro no banco ou processamento
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erro ao gerar o PDF', details: err.message });
    } else {
      console.error('Erro na geração do stream PDF:', err.message);
    }
  }
};

module.exports = {
  createDietaryForm,
  listDietaryForms,
  getDietaryFormById,
  updateDietaryForm,
  deleteDietaryForm,
  generatePdfReport,
};
