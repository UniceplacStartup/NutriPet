const db = require('../config/database');

class User {
    id;
    clinic_id;
    nome;
    email;
    password;
    role;
    matricula = null;
    created_at;
    updated_at;

    constructor(clinic_id, nome, email, role, password) {
        this.clinic_id = clinic_id;
        this.nome = nome;
        this.email = email;
        this.role = role;
        this.password = password;
    }

    // client permite rodar dentro de uma transação (pool.connect())
    async save(client = db) {
        const result = await client.query(
            'INSERT INTO usuarios(clinica_id, nome, email, password_hash, role, matricula) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
            [this.clinic_id, this.nome, this.email, this.password, this.role, this.matricula]
        );
        const row = result.rows[0];
        this.id = row.id;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
        return this;
    }

    // Dados seguros para devolver ao cliente (sem o hash da senha)
    toJSON() {
        return {
            id: this.id,
            clinica_id: this.clinic_id,
            nome: this.nome,
            email: this.email,
            role: this.role,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    static fromRow(row) {
        const user = new User(row.clinica_id, row.nome, row.email, row.role, row.password_hash);
        user.id = row.id;
        user.matricula = row.matricula ?? null;
        user.created_at = row.created_at;
        user.updated_at = row.updated_at;
        return user;
    }

    // E-mail é comparado sem diferenciar maiúsculas; bases antigas podem ter mais de um
    static async findAllByEmail(email) {
        const result = await db.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) ORDER BY id', [email]);
        return result.rows.map(User.fromRow);
    }

    // O login é só por e-mail, então ele precisa ser único no sistema todo
    static async emailInUse(email, exceptId = null, client = db) {
        const result = await client.query(
            'SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1) AND ($2::bigint IS NULL OR id <> $2::bigint) LIMIT 1',
            [email, exceptId]
        );
        return result.rows.length > 0;
    }
}

module.exports = { User };
