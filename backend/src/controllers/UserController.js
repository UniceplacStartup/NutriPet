const User = require('../models/User');
const db = require('../config/database');

const { createToken } = require('../utils/jwt');
const { encryptPassword, comparePassword } = require('../utils/bcrypt');
const { isUndefined, invalidPassword, invalidEmail } = require('../utils/validateInput');

const register = async (req, res) => {
    try {
        const { nome, email, password, role } = req.body;

        const clinic_id = req.user.clinicaId;

        const rolesPermitidas = [
            'admin',
            'veterinario',
            'atendente'
        ];

        if (!role || !rolesPermitidas.includes(role.trim())){
            return res.status(400).json({
                error: 'Role inválida'
            });
        }

        if (isUndefined(clinic_id) || isUndefined(nome) || invalidEmail(email) || isUndefined(role) || invalidPassword(password)) {
            res.status(400).json({ error: 'Dados inválidos' });
            return
        }

        const user = new User.User(
            Number(clinic_id), 
            nome.trim(), 
            email.trim(), 
            role.trim(), 
            await encryptPassword(password.trim())
        );

        await user.save();

        const token = createToken(user);

        res.status(201).json({ token: token });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ error: 'Erro ao registrar usuário', details: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (invalidEmail(email) || invalidPassword(password)) {
            res.status(400).json({ error: 'Email ou senha inválidos' });
            return
        }

        const user = new User.User();
        const found = await user.findByEmail(email);

        if (!found || !await comparePassword(password, user.password)) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return
        }

        const token = createToken(user);

        res.status(200).json({ token: token });
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ error: 'Erro ao fazer login', details: err.message });
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
        res.status(500).json({
            error: 'Erro ao listar usuários',
            details: err.message
        });
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
        res.status(500).json({
            error: 'Erro ao buscar usuário',
            details: err.message
        });
    }
};



const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const clinica_id = req.user.clinicaId;

        const {nome, email, role, password} = req.body;

        const rolesPermitidas = [
            'admin',
            'veterinario',
            'atendente'
        ];

        if (role && !rolesPermitidas.includes(role.trim())) {
            return res.status(400).json({
                error: 'Role inválida'
            });
        }

        let passwordHash = null; 

        if (password) {
            passwordHash = await encryptPassword(password.trim()); 
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
                email?.trim() ?? null,
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
        res.status(500).json({
            error: 'Erro ao atualizar usuário',
            details: err.message
        });
    }
};

const deleteUser = async (req, res) =>{
    try {
        const {id} = req.params;
        const clinica_id = req.user.clinicaId;

        if(Number(id) === req.user.id) {
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
        res.status(500).json({
            error: 'Erro ao deletar usuário',
            details: err.message
        });
    }
};

module.exports = {
    register,
    login,
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
};
