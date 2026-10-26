const { mapDbError } = require('../utils/dbErrors');

const errorHandler = (err, req, res, next) => {
  // Corpo da requisição com JSON malformado (express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }

  // Origem recusada pelo CORS (src/index.js)
  if (err.status === 403 && err.message === 'Origem não permitida') {
    return res.status(403).json({ error: 'Origem não permitida' });
  }

  // Erro de validacao
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ error: 'Erro de validação', messages });
  }

  // Violacao de chave unica
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return res.status(409).json({ error: 'Conflito de dados', messages });
  }

  // Erros conhecidos do PostgreSQL (unique, FK, tipo inválido, banco sem migration...)
  const dbError = mapDbError(err);
  if (dbError) {
    if (dbError.status >= 500) console.error(dbError.error, err);
    return res.status(dbError.status).json({ error: dbError.error });
  }

  // Token invalido
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // Erro generico
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    error: 'Erro interno no servidor',
    message: isProduction ? 'Ocorreu um erro inesperado.' : err.message,
    stack: isProduction ? undefined : err.stack
  });
};

module.exports = errorHandler;
