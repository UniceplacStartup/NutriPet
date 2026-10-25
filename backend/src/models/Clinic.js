const db = require('../config/database');
const { invalidText, invalidCnpj, normalizeCnpj, invalidEmail, normalizeEmail, invalidOptionalText, toOptionalText } = require('../utils/validateInput');

class Clinic {
    id;
    cnpj;
    razaoSocial;
    email;
    telefone;
    created_at;
    updated_at;

    constructor(cnpj, razaoSocial, email, telefone) {
        this.cnpj = cnpj;
        this.razaoSocial = razaoSocial;
        this.email = email;
        this.telefone = telefone;
    }

    // Valida o corpo da requisição; retorna a mensagem de erro ou null
    static validate(data) {
        if (!data || typeof data !== 'object') { return 'Dados da clínica são obrigatórios' }
        const { cnpj, razaoSocial, email, telefone } = data;
        if (invalidCnpj(cnpj)) { return 'CNPJ inválido: informe 14 dígitos' }
        if (invalidText(razaoSocial)) { return 'Razão social é obrigatória' }
        if (invalidEmail(email)) { return 'E-mail da clínica inválido' }
        if (invalidOptionalText(telefone) || !toOptionalText(telefone)) { return 'Telefone é obrigatório' }
        return null;
    }

    // Monta a clínica com os dados já normalizados (chamar depois de validate)
    static fromBody({ cnpj, razaoSocial, email, telefone }) {
        return new Clinic(normalizeCnpj(cnpj.trim()), razaoSocial.trim(), normalizeEmail(email), toOptionalText(telefone));
    }

    // client permite rodar dentro de uma transação (pool.connect())
    async save(client = db) {
        const result = await client.query(
            'INSERT INTO clinicas(razao_social, cnpj, email, telefone) VALUES($1, $2, $3, $4) RETURNING *',
            [this.razaoSocial, this.cnpj, this.email, this.telefone]
        );
        const row = result.rows[0];
        this.id = row.id;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            cnpj: this.cnpj,
            razaoSocial: this.razaoSocial,
            email: this.email,
            telefone: this.telefone
        };
    }
}

module.exports = { Clinic };
