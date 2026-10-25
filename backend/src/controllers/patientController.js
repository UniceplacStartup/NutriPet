const db = require('../config/database');
const { respondWithError } = require('../utils/dbErrors');
const { invalidText, invalidOptionalText, toOptionalText, invalidId, invalidDate, invalidDateTime, invalidOptionalNumber } = require('../utils/validateInput');

const ESPECIES = ['cao', 'gato'];

// Valida os campos opcionais comuns ao cadastro e à edição
const patientDataError = ({ especie, raca, data_nascimento, peso_ideal }) => {
  if (especie !== undefined && (typeof especie !== 'string' || !ESPECIES.includes(especie.trim()))) {
    return "especie deve ser 'cao' ou 'gato'";
  }
  if (invalidOptionalText(raca)) return 'raca deve ser texto';
  if (data_nascimento !== undefined && data_nascimento !== null && data_nascimento !== '' && invalidDate(data_nascimento)) {
    return 'data_nascimento deve estar no formato AAAA-MM-DD';
  }
  if (peso_ideal !== '' && invalidOptionalNumber(peso_ideal, { min: 0, max: 999.99, allowMin: false })) {
    return 'peso_ideal deve ser um número maior que zero';
  }
  return null;
};

// Create
const createPatient = async (req, res) => {
  try {
    const clinica_id = req.user.clinicaId;
    const { tutor_id, nome, especie, raca, data_nascimento, peso_ideal } = req.body ?? {};

    if (invalidId(tutor_id) || invalidText(nome) || especie === undefined) {
      return res.status(400).json({ error: 'tutor_id, nome e especie são obrigatórios' });
    }
    const erro = patientDataError({ especie, raca, data_nascimento, peso_ideal });
    if (erro) return res.status(400).json({ error: erro });

    // O tutor precisa ser da mesma clínica do usuário
    const { rows: tutorRows } = await db.query('SELECT id FROM tutores WHERE id = $1 AND clinica_id = $2', [Number(tutor_id), Number(clinica_id)]);
    if (!tutorRows.length) return res.status(404).json({ error: 'Tutor não encontrado' });

    const { rows } = await db.query(
      `INSERT INTO pacientes (tutor_id, clinica_id, nome, especie, raca, data_nascimento, peso_ideal)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [Number(tutor_id), Number(clinica_id), nome.trim(), especie.trim(), toOptionalText(raca), data_nascimento || null, peso_ideal ?? null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao criar paciente');
  }
};

// Read all (optional filter by tutor_id)
const listPatients = async (req, res) => {
  try {
    const clinica_id = req.user.clinicaId;
    const { tutor_id } = req.query;
    if (tutor_id !== undefined && invalidId(tutor_id)) {
      return res.status(400).json({ error: 'tutor_id inválido' });
    }
    let sql = 'SELECT * FROM pacientes WHERE clinica_id = $1';
    const params = [Number(clinica_id)];
    
    if (tutor_id) {
      params.push(Number(tutor_id));
      sql += ` AND tutor_id = $2`;
    }
    sql += ' ORDER BY id DESC';
    const { rows } = await db.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao listar pacientes');
  }
};

// Read one
const getPatientById = async (req, res) => {
  try {
    return res.status(200).json(req.paciente);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao buscar paciente');
  }
};

// Update (partial)
const updatePatient = async (req, res) => {
  try {
    const { id } = req.paciente;
    const { nome, especie, raca, data_nascimento, peso_ideal } = req.body ?? {};
    if (nome !== undefined && invalidText(nome)) return res.status(400).json({ error: 'nome não pode ficar vazio' });
    const erro = patientDataError({ especie, raca, data_nascimento, peso_ideal });
    if (erro) return res.status(400).json({ error: erro });
    const { rows } = await db.query(
      `UPDATE pacientes SET 
        nome = COALESCE($1, nome),
        especie = COALESCE($2, especie),
        raca = COALESCE($3, raca),
        data_nascimento = COALESCE($4, data_nascimento),
        peso_ideal = COALESCE($5, peso_ideal),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [nome?.trim() ?? null, especie?.trim() ?? null, raca === undefined || raca === null ? null : String(raca).trim(), data_nascimento || null, peso_ideal === '' ? null : peso_ideal ?? null, Number(id)]
    );
    if (!rows.length) return res.status(404).json();
    return res.status(200).json(rows[0]);
  } catch (err) {
    return respondWithError(res, err, 'Erro ao atualizar paciente');
  }
};

// Delete
const deletePatient = async (req, res) => {
  try {
    const { id } = req.paciente;
    const result = await db.query('DELETE FROM pacientes WHERE id = $1', [Number(id)]);
    if (result.rowCount === 0) return res.status(404).json();
    return res.status(204).json();
  } catch (err) {
    return respondWithError(res, err, 'Erro ao remover paciente');
  }
};

// History
const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.paciente; // Paciente validado pelo middleware
    const { data_inicio, data_fim, veterinario_id } = req.query;

    if ((data_inicio !== undefined && invalidDateTime(data_inicio)) || (data_fim !== undefined && invalidDateTime(data_fim))) {
      return res.status(400).json({ error: 'Datas devem estar no formato AAAA-MM-DD' });
    }
    if (veterinario_id !== undefined && invalidId(veterinario_id)) {
      return res.status(400).json({ error: 'veterinario_id inválido' });
    }

    // Monta a query para buscar histórico
    let sql = `
      SELECT 
        f.*,
        u.nome AS veterinario_nome,
        u.email AS veterinario_email,
        c.nem_calculada_kcal_dia AS nem_calculada,
        c.em_total_kcal_dia AS em_total
      FROM formularios_dieteticos f
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      LEFT JOIN calculos_formulario c ON f.id = c.formulario_id
      WHERE f.paciente_id = $1
    `;

    const params = [Number(id)]; // Proteção contra tipos BIGINT
    let paramCount = 2;

    // Filtra por veterinário opcionalmente
    if (veterinario_id) {
      sql += ` AND f.usuario_id = $${paramCount}`;
      params.push(Number(veterinario_id)); // Proteção contra tipos BIGINT
      paramCount++;
    }

    // Filtra por data de início
    if (data_inicio) {
      sql += ` AND f.created_at >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }

    // Filtra por data de fim
    if (data_fim) {
      sql += ` AND f.created_at <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }

    // Ordem decrescente obrigatória
    sql += ` ORDER BY f.created_at DESC`;

    const { rows: historico } = await db.query(sql, params);

    return res.status(200).json({
      paciente: req.paciente,
      historico
    });
  } catch (err) {
    return respondWithError(res, err, 'Erro ao buscar histórico do paciente');
  }
};

module.exports = {
  createPatient,
  listPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientHistory,
};
