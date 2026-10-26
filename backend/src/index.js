require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Sem a chave, login e cadastro falham com 500 (e o cadastro criaria a conta antes de falhar)
if (!process.env.SECRETKEY) {
  console.error('SECRETKEY não definida: configure a variável de ambiente antes de iniciar a API.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Atrás de proxy reverso, sem isso o rate limit enxerga todos com o IP do proxy
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if(!origin){
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Loga a origem recusada: o erro mais comum é localhost x 127.0.0.1 ou porta diferente
      console.warn(`CORS: origem não permitida: ${origin} (permitidas: ${allowedOrigins.join(', ')})`);
      const err = new Error('Origem não permitida');
      err.status = 403;
      return callback(err);
    }
  })
);

app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter); 

// Middleware para o Express entender JSON
app.use(express.json());

// Rota "Health Check" para verificar se a API está no ar
app.get('/', (req, res) => {
  res.json({ message: 'API MedVet está funcionando!' });
});

// Importar e usar as rotas da aplicação
const clinicRoutes = require('./routes/clinicRoutes');
const UserRoutes = require('./routes/UserRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dietaryFormRoutes = require('./routes/dietaryFormRoutes');
const consumedFoodRoutes = require('./routes/consumedFoodRoutes');
const consumedSupplementRoutes = require('./routes/consumedSupplementRoutes');
const formCalculationRoutes = require('./routes/formCalculationRoutes');

const errorHandler = require('./middlewares/errorHandler');

// Cada router aplica authenticateToken só no prefixo do seu recurso
app.use('/api', UserRoutes);   // Auth
app.use('/api', clinicRoutes); // RF02: Clínica
app.use('/api', tutorRoutes);  // Tutores CRUD
app.use('/api', patientRoutes);
app.use('/api', dietaryFormRoutes);
app.use('/api', consumedFoodRoutes);
app.use('/api', consumedSupplementRoutes);
app.use('/api', formCalculationRoutes);

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware global de erro sempre por ultimo
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
