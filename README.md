# Sistema MedVet 🐾

![Badge de Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Badge de Licença](https://img.shields.io/badge/license-MIT-blue)

## 📄 Sobre o Projeto

O **Sistema MedVet** é uma aplicação web SaaS (Software as a Service) projetada para auxiliar clínicas veterinárias a realizar o registro e o acompanhamento do histórico dietético de seus pacientes. A plataforma permite o cadastro de clínicas, múltiplos usuários, o preenchimento de formulários detalhados e a geração de relatórios nutricionais.

Este repositório é um **monorepo**, contendo tanto o código do `backend` quanto do `frontend`.

## ✨ Funcionalidades Principais

- **Cadastro de Clínicas:** As clínicas podem se cadastrar no sistema de forma segura.
- **Gerenciamento de Usuários:** Cada clínica pode ter múltiplos usuários internos, como veterinários e atendentes.
- **Formulário Dietético Completo:** Preenchimento de um formulário detalhado com informações sobre alimentos, suplementos, frequência e quantidades da dieta do animal.
- **Cálculos Automatizados:** O sistema realiza o cálculo automático das necessidades nutricionais (EM, NEM) com base nos dados fornecidos.
- **Geração de Relatórios PDF:** Criação de um relatório profissional em PDF com todos os dados da consulta, pronto para ser entregue ao tutor do animal.
- **Histórico de Pacientes:** Acesso fácil a todos os relatórios e formulários anteriores de um animal, permitindo o acompanhamento de sua evolução.

## 🛠️ Stack Tecnológica

As tecnologias escolhidas para este projeto visam produtividade, escalabilidade e uma boa curva de aprendizado para a equipe.

| Parte | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Backend** | **Node.js com Express.js** | Criação da API RESTful de forma ágil e em JavaScript. |
| **Frontend** | **Vue.js (com Vite)** | Framework moderno e amigável para a construção de interfaces reativas. |
| **Banco de Dados** | **PostgreSQL** | Banco de dados relacional robusto e confiável para garantir a segurança das informações. |
| **Linguagem** | **JavaScript/TypeScript** | Uso de JavaScript em toda a stack para unificar o conhecimento, com TypeScript no frontend para maior segurança. |

## 🚀 Como Rodar o Projeto (Ambiente de Desenvolvimento)

### Pré-requisitos

- **Node.js** 20.19+ ou 22.12+ (exigido pelo Vite do frontend)
- **Git**
- Uma instância do **PostgreSQL** rodando, com um banco criado (ex: `univet_db`)

### Passos para Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/UniceplacStartup/NutriPet.git
    cd NutriPet
    ```

2.  **Configure as variáveis de ambiente do backend:**
    ```bash
    cd backend
    cp .env.example .env
    ```
    Ajuste as credenciais do banco e defina `SECRETKEY` (sem ela a API não inicia). Veja a [tabela de variáveis](#variáveis-de-ambiente-do-backend).

3.  **Instale as dependências:**
    ```bash
    npm install            # dentro de backend/
    cd ../frontend
    npm install
    ```

4.  **Crie as tabelas (migrations):**
    ```bash
    cd ../backend
    npx sequelize-cli db:migrate --url postgres://USUARIO:SENHA@localhost:5432/univet_db
    ```
    > ⚠️ O `npm run db:migrate` **não lê o `.env`**: ele usa os dados fixos de `config/config.json` (`postgres:postgres@localhost:5432/univet_db`). Use `--url` sempre que o seu banco for diferente disso.

5.  **(Opcional) Popule dados de demonstração:**
    ```bash
    node seed.js
    ```
    Cria uma clínica, um tutor, um paciente e o usuário **admin@demo.com / Demo1234**. Use apenas em desenvolvimento.
    > O arquivo `seed-demo.sql` está desatualizado em relação ao schema e falha; use o `seed.js`.

### Executando a Aplicação

Você precisará de dois terminais abertos para rodar o backend e o frontend simultaneamente.

- **Terminal 1: Rodar o Backend**
  ```bash
  cd backend
  npm run dev
  ```
  O servidor do backend estará rodando em `http://localhost:3000`.

- **Terminal 2: Rodar o Frontend**
  ```bash
  cd frontend
  npm run dev
  ```
  A aplicação frontend estará acessível em `http://localhost:5173` (ou outra porta indicada no terminal).

### Testes

```bash
cd backend && npm test        # Jest
cd frontend && npm run test:unit
```

## 🌐 Deploy

O sistema é composto por três partes independentes:

| Parte | O que é | Onde pode rodar |
| :--- | :--- | :--- |
| **Banco** | PostgreSQL 13+ | Qualquer Postgres gerenciado (Neon, Supabase, RDS, Render…) ou próprio |
| **API** | Processo Node.js (`backend/`) | Qualquer serviço que rode Node (Render, Railway, VPS com PM2…) |
| **Frontend** | Arquivos estáticos gerados pelo build (`frontend/dist/`) | Qualquer hospedagem estática (Netlify, Vercel, Nginx, S3…) |

### Variáveis de ambiente do backend

| Variável | Obrigatória | Descrição |
| :--- | :---: | :--- |
| `DATABASE_URL` | ✅ * | String de conexão do Postgres. Se o provedor exigir SSL, acrescente `?sslmode=require` |
| `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE` | ✅ * | Alternativa à `DATABASE_URL` (* use uma das duas formas) |
| `DATABASE_SSL` | | `true` força SSL sem validar o certificado (para certificado autoassinado). Só funciona junto com `DATABASE_URL` e não afeta as migrations |
| `SECRETKEY` | ✅ | Chave de assinatura dos tokens JWT. Use um valor longo e aleatório (ex: `openssl rand -hex 32`). Sem ela a API não inicia. Trocá-la invalida todas as sessões |
| `CORS_ORIGIN` | ✅ em produção | URL(s) do frontend, separadas por vírgula **sem espaços** (ex: `https://app.exemplo.com.br`). Padrão: `http://localhost:5173`. `localhost` e `127.0.0.1` contam como origens diferentes; uma origem fora da lista recebe 403 e aparece no log da API |
| `PORT` | | Porta HTTP da API. Padrão: `3000` (a maioria das plataformas define automaticamente) |
| `TRUST_PROXY` | ✅ atrás de proxy | Número de proxies reversos à frente da API (normalmente `1`). Sem isso, o rate limit trata todos os usuários como um só IP e o limite de login (5 tentativas a cada 15 min) passa a valer para o sistema inteiro |
| `NODE_ENV` | | `production` oculta o stack trace nas respostas de erro |

### Variáveis de ambiente do frontend

| Variável | Descrição |
| :--- | :--- |
| `VITE_API_URL` | URL pública da API **incluindo `/api`** (ex: `https://api.exemplo.com.br/api`). É embutida no momento do **build**: alterar depois exige um novo build. Padrão: `http://localhost:3000/api` |

### Passo a passo

**1. Banco de dados: rodar as migrations**

As migrations usam o `sequelize-cli`, que é dependência de desenvolvimento. Rode a partir de uma instalação completa (`npm ci`), na sua máquina ou em uma etapa de release/CI:

```bash
cd backend
npm ci
npx sequelize-cli db:migrate --url "$DATABASE_URL"
```

Rode esse comando **a cada deploy** que trouxer migrations novas (pasta `backend/migrations/`). Se o banco ficar atrás do código, a API responde 500 com `Banco de dados desatualizado: rode as migrations`. Para conferir o estado: `npx sequelize-cli db:migrate:status --url "$DATABASE_URL"`.

**2. Primeiro acesso: criar a clínica e o administrador**

Quem tem matrícula da faculdade (7 dígitos, máscara `0000000`) cria a própria conta de admin pela tela **Criar uma conta** (`/cadastro`), que cria a clínica e o administrador juntos. Pela API:

```http
POST /api/auth/cadastro
Content-Type: application/json

{
  "matricula": "0012345",
  "nome": "Nome do Admin",
  "email": "admin@clinica.com.br",
  "password": "SuaSenhaForte123",
  "clinica": {
    "cnpj": "12.345.678/0001-90",
    "razaoSocial": "Nome da Clínica LTDA",
    "email": "contato@clinica.com.br",
    "telefone": "61999999999"
  }
}
```

- A resposta (`201`) traz `token`, `user` e `clinica`, e o admin já fica logado.
- Cada matrícula cria **uma** conta (repetida retorna `409`). A API confere só o formato: não há consulta à base de alunos da faculdade.
- O e-mail de login é único no sistema todo, sem diferenciar maiúsculas. O CNPJ pode vir com ou sem máscara e é gravado só com os dígitos.
- Limite de 10 cadastros por hora por IP.

Depois disso, o admin cadastra os demais usuários da clínica pelo endpoint `POST /api/auth/register` (com o token do admin; o usuário entra na clínica do admin). **Não rode o `seed.js` em produção**: ele cria um admin com senha pública.

**3. Backend (API)**

```bash
cd backend
npm ci --omit=dev
npm start
```

- Health check: `GET /` deve responder `{"message":"API MedVet está funcionando!"}`.
- Sempre rode `npm ci` no servidor: a pasta `backend/node_modules` está versionada no git por engano e não deve ser usada.
- O rate limit é guardado em memória: com mais de uma instância da API, cada uma conta separadamente. Rode **uma instância** ou troque o store do `express-rate-limit`.
- O HTTPS deve ser terminado no proxy ou na plataforma; a API escuta HTTP puro.

**4. Frontend**

```bash
cd frontend
npm ci
VITE_API_URL=https://api.exemplo.com.br/api npm run build
```

Publique o conteúdo de `frontend/dist/`. O app usa rotas com *history mode*, então o servidor precisa devolver o `index.html` para qualquer rota desconhecida, ou recarregar a página em `/pacientes` dará 404. Exemplo no Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

(Netlify: arquivo `_redirects` com `/* /index.html 200`. Vercel: rewrite de `/(.*)` para `/index.html`.)

### Checklist de deploy

- [ ] `DATABASE_URL` configurada (com `?sslmode=require` se o provedor exigir)
- [ ] Migrations aplicadas (`db:migrate:status` todas como `up`)
- [ ] `SECRETKEY` longa e aleatória, diferente da usada em desenvolvimento
- [ ] `CORS_ORIGIN` igual à URL do frontend publicado
- [ ] `TRUST_PROXY=1` se houver proxy ou plataforma à frente da API
- [ ] Frontend construído com `VITE_API_URL` apontando para a API
- [ ] Fallback para `index.html` configurado na hospedagem do frontend
- [ ] Primeiro admin criado e login testado
- [ ] `seed.js` **não** executado no banco de produção

### Limitações conhecidas

- As respostas de erro dos controllers incluem a mensagem original do banco (`details`) mesmo com `NODE_ENV=production`.
- O token JWT fica no `localStorage` e vale por 7 dias; não há logout no servidor nem renovação de token.
- Não há endpoint para editar os dados da clínica; alterações precisam ser feitas no banco.

## 🌳 Estrutura do Projeto

Este é um monorepo com a seguinte estrutura principal:

```
/
├── backend/      # Contém a aplicação Node.js/Express
├── frontend/     # Contém a aplicação Vue.js
├── .gitignore
└── README.md
```

## 🌿 Fluxo de Trabalho (Gitflow)

Adotamos um fluxo de trabalho baseado no Gitflow para manter o repositório organizado:

- `main`: Contém o código em produção. Estável.
- `develop`: Branch de integração. Contém as últimas funcionalidades desenvolvidas.
- `feature/...`: Todas as novas funcionalidades ou correções são feitas em branches de feature que partem da `develop`. O trabalho é integrado de volta à `develop` através de **Pull Requests (PRs)**.

## ⚖️ Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
