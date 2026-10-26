const User = require('../models/User');
const Clinic = require('../models/Clinic');
const db = require('../config/database');

const { createToken } = require('../utils/jwt');
const { encryptPassword, comparePassword } = require('../utils/bcrypt');
const { respondWithError } = require('../utils/dbErrors');
const { invalidText, invalidPassword, invalidEmail, normalizeEmail, invalidMatricula } = require('../utils/validateInput');

const rolesPermitidas = [
    'admin',
    'veterinario',
    'atendente'
];

const invalidRole = (role) => typeof role !== 'string' || !rolesPermitidas.includes(role.trim());

// Mensagem única para os dados do usuário (nome, e-mail e senha)
const userDataError = ({ nome, email, password }) => {
    if (invalidText(nome)) { return 'Nome é obrigatório' }
    if (invalidEmail(email)) { return 'E-mail inválido' }
    if (invalidPassword(password)) {
        return 'Senha inválida: mínimo de 8 caracteres, com maiúscula, minúscula e número, sem espaços nas pontas';
    }
    return null;
};

// Cadastro público: cria a clínica e o primeiro admin, mediante matrícula da faculdade
const signup = async (req, res) => {
    const { matricula, nome, email, password, clinica } = req.body ?? {};

    if (invalidMatricula(matricula)) {
        return res.status(400).json({ error: 'Matrícula inválida: informe 7 dígitos (0000000)' });
    }
    const erroUsuario = userDataError({ nome, email, password });
    if (erroUsuario) {
        return res.status(400).json({ error: erroUsuario });
    }
    const erroClinica = Clinic.Clinic.validate(clinica);
    if (erroClinica) {
        return res.status(400).json({ error: erroClinica });
    }

    const emailNormalizado = normalizeEmail(email);
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        if (await User.User.emailInUse(emailNormalizado, null, client)) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'E-mail já cadastrado' });
        }

        const clinic = Clinic.Clinic.fromBody(clinica);
        await clinic.save(client);

        const user = new User.User(clinic.id, nome.trim(), emailNormalizado, 'admin', await encryptPassword(password));
        user.matricula = matricula.trim();
        await user.save(client);

        // Gera o token antes do COMMIT: se falhar, a conta não fica criada pela metade
        const token = createToken(user);

        await client.query('COMMIT');

        res.status(201).json({ token, user, clinica: clinic });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        respondWithError(res, err, 'Erro ao criar conta');
    } finally {
        client.release();
    }
};

// Admin cadastra um usuário na própria clínica
const register = async (req, res) => {
    try {
        const { nome, email, password, role } = req.body ?? {};

        const clinic_id = req.user.clinicaId;

        if (invalidRole(role)) {
            return res.status(400).json({
                error: 'Role inválida'
            });
        }

        const erroUsuario = userDataError({ nome, email, password });
        if (erroUsuario) {
            return res.status(400).json({ error: erroUsuario });
        }

        const emailNormalizado = normalizeEmail(email);
        if (await User.User.emailInUse(emailNormalizado)) {
            return res.status(409).json({ error: 'E-mail já cadastrado' });
        }

        const user = new User.User(
            Number(clinic_id),
            nome.trim(),
            emailNormalizado,
            role.trim(),
            await encryptPassword(password)
        );

        await user.save();

        // Não devolve token: quem cadastra é o admin, que continua com a própria sessão
        res.status(201).json({ user });
    } catch (err) {
        respondWithError(res, err, 'Erro ao registrar usuário');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (invalidEmail(email) || invalidPassword(password)) {
            res.status(400).json({ error: 'Email ou senha inválidos' });
            return
        }

        // Bases antigas podem ter o mesmo e-mail em mais de uma conta: vale a que tiver a senha
        const candidatos = await User.User.findAllByEmail(email.trim());
        let user = null;
        for (const candidato of candidatos) {
            if (await comparePassword(password, candidato.password)) {
                user = candidato;
                break;
            }
        }

        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return
        }

        const token = createToken(user);

        res.status(200).json({ token: token, user });
    } catch (err) {
        respondWithError(res, err, 'Erro ao fazer login');
    }
};

const listUsers = async (req, res) => {
    try {
        const clinica_id = req.user.clinicaId;

        const { rows } = await db.query(
            'SELECT id, clinica_id, nome, email, role, created_at, updated_at FROM usuarios WHERE clinica_id = $1 ORDER BY id DESC', [clinica_id]
        );

        res.status(200).json(rows);
    } catch (err) {
        respondWithError(res, err, 'Erro ao listar usuários');
    }
};

const getUserById = async(req, res) => {
    try {
        const {id} = req.params;
        const clinica_id = req.user.clinicaId;

        const {rows} = await db.query(
            `SELECT id, clinica_id, nome, email, role, created_at, updated_at
             FROM usuarios
             WHERE id = $1
             AND clinica_id = $2`,
             [id, clinica_id]
        );

        if (rows.length === 0) {
            return res.status(404).json();
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        respondWithError(res, err, 'Erro ao buscar usuário');
    }
};



const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const clinica_id = req.user.clinicaId;

        const {nome, email, role, password} = req.body ?? {};

        if (role !== undefined && invalidRole(role)) {
            return res.status(400).json({
                error: 'Role inválida'
            });
        }

        // Mesma política do cadastro: senha fora dela seria recusada no login
        if ((nome !== undefined && invalidText(nome)) || (email !== undefined && invalidEmail(email)) || (password !== undefined && invalidPassword(password))) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const emailNormalizado = email !== undefined ? normalizeEmail(email) : null;
        if (emailNormalizado && await User.User.emailInUse(emailNormalizado, id)) {
            return res.status(409).json({ error: 'E-mail já cadastrado' });
        }

        let passwordHash = null;

        if (password !== undefined) {
            passwordHash = await encryptPassword(password);
        }

        const {rows} = await db.query(
            `UPDATE usuarios
             SET nome = COALESCE($1, nome),
                 email = COALESCE($2, email),
                 role = COALESCE($3, role),
                 password_hash = COALESCE($4, password_hash),
                 updated_at = NOW()
             WHERE id = $5
             AND clinica_id = $6
             RETURNING id, clinica_id, nome, email, role, created_at, updated_at`,
             [
                nome?.trim() ?? null,
                emailNormalizado,
                role?.trim() ?? null,
                passwordHash,
                id,
                clinica_id
             ]
        );

        if (rows.length === 0) {
            return res.status(404).json();
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        respondWithError(res, err, 'Erro ao atualizar usuário');
    }
};

const deleteUser = async (req, res) =>{
    try {
        const {id} = req.params;
        const clinica_id = req.user.clinicaId;

        // O id do token vem como string (BIGINT do PostgreSQL)
        if(Number(id) === Number(req.user.id)) {
            return res.status(400).json({
                error: 'Você não pode excluir sua própria conta'
            });
        }

        const result = await db.query(
            'DELETE FROM usuarios WHERE id = $1 AND clinica_id = $2',
            [id, clinica_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json();
        }

        res.status(204).json();
    } catch (err) {
        respondWithError(res, err, 'Erro ao deletar usuário');
    }
};

module.exports = {
    signup,
    register,
    login,
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
};
