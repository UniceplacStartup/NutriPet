const jwt = require('jsonwebtoken');
const db = require('../config/database');
const secretKey = process.env.SECRETKEY;

const authenticateToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    try {
        // Confere no banco: usuário excluído perde o acesso e mudança de papel vale na hora
        const { rows } = await db.query(
            'SELECT id, clinica_id, role, email FROM usuarios WHERE id = $1',
            [decoded.id]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado. Faça login novamente.' });
        }

        const user = rows[0];
        req.user = {
            id: user.id,
            clinicaId: user.clinica_id,
            role: user.role,
            email: user.email
        };
        next();
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao validar o token.' });
    }
};

module.exports = { authenticateToken };
