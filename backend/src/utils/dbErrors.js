// Traduz erros conhecidos do PostgreSQL em respostas 4xx
const PG_ERRORS = {
    '23505': { status: 409, error: 'Registro já existe' },          // unique_violation
    '23503': { status: 400, error: 'Referência inválida' },         // foreign_key_violation
    '22P02': { status: 400, error: 'Valor inválido' },              // invalid_text_representation (enum, bigint)
    '22007': { status: 400, error: 'Data inválida' },               // invalid_datetime_format
    '22008': { status: 400, error: 'Data inválida' },               // datetime_field_overflow
    '22003': { status: 400, error: 'Número fora do intervalo' },    // numeric_value_out_of_range
    '22001': { status: 400, error: 'Texto maior que o permitido' }, // string_data_right_truncation
};

// Mensagem amigável para as constraints únicas do schema
const UNIQUE_MESSAGES = {
    clinicas_cnpj_key: 'CNPJ já cadastrado',
    clinicas_email_key: 'E-mail da clínica já cadastrado',
    usuarios_clinica_id_email_uk: 'E-mail já cadastrado',
    usuarios_matricula_key: 'Matrícula já cadastrada',
};

const mapDbError = (err) => {
    const known = err && PG_ERRORS[err.code];
    if (!known) { return null }
    if (err.code === '23505' && UNIQUE_MESSAGES[err.constraint]) {
        return { status: 409, error: UNIQUE_MESSAGES[err.constraint] };
    }
    return known;
};

// Resposta padrão dos controllers: 4xx para erros de dados, 500 para o resto
const respondWithError = (res, err, message) => {
    const mapped = mapDbError(err);
    if (mapped) {
        return res.status(mapped.status).json({ error: mapped.error });
    }
    console.error(`${message}:`, err);
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(500).json({ error: message, details: isProduction ? undefined : err.message });
};

module.exports = { mapDbError, respondWithError };
