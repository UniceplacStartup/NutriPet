const { invalidId } = require('../utils/validateInput');

// Usado com router.param('id', ...): evita 500 do Postgres com IDs como "abc"
const validateIdParam = (req, res, next, id) => {
    if (invalidId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    next();
};

module.exports = { validateIdParam };
