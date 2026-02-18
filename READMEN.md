## MIXCAMP

Plataforma web para organização de campeonatos e mix de CS/CS2, com sistema de usuários, times, inscrições, chaveamento, ranking, notícias e integração com APIs externas (Faceit, Steam, Cloudinary, Mercado Pago).

---

### **📌 Visão Geral**

O projeto é dividido em duas partes:

- **Backend**: API REST em Node.js/Express, com MySQL, sessões de usuário, envio de e-mail e integrações externas.
- **Frontend**: site em HTML/CSS/JS puro, com várias páginas (login, registro, home, campeonatos, comunidade, etc.) e UI animada focada em e-sports.

---

### **🧰 Tecnologias Principais**

- **Backend**
  - **Node.js / Express**
  - **express-session**
  - **MySQL2**
  - **dotenv**
  - **bcrypt**
  - **nodemailer**
  - **multer**
  - **axios**
  - **mercadopago**

- **Frontend**
  - **HTML5**
  - **CSS3** (layout responsivo, animações, efeitos visuais)
  - **JavaScript (ES6+)**
  - **Font Awesome**

- **Banco de Dados**
  - **MySQL** (script em `backend/sql/db.sql`)

---

### **📁 Estrutura de Pastas**

- **backend/**
  - `javascript/`
    - `server.js` — ponto de entrada do servidor Express (rotas, CORS, sessões, montagem da API).
    - `controller.js` — implementação das regras de negócio e handlers das rotas (usuários, times, inscrições, ranking, notícias, integrações, etc.).
    - `db.js` — conexão com o banco MySQL.
    - `auth.js` — validações de email/senha/caracteres.
  - `sql/`
    - `db.sql` — script de criação/atualização do banco de dados.
  - `package.json` — dependências e scripts do backend.
  - `node_modules/` — dependências Node.

- **frontend/**
  - `html/` — páginas da aplicação:
    - `login.html`, `registro.html`, `home.html`, `campeonato.html`, `comunidade.html`, `matchs.html`, `ranking.html`, `perfil.html`, `team.html`, `vetos.html`, `vetos_cs2.html`, etc.
  - `css/` — estilos por página/componente:
    - `login.css`, `registro.css`, `home.css`, `campeonato.css`, `chaveamento.css`, `ranking.css`, `perfil.css`, `header.css`, etc.
  - `js/` — lógica de cada página:
    - `login.js`, `registro.js`, `home.js`, `campeonato.js`, `chaveamento_sistema.js`, `config_time.js`, `comunidade.js`, `resultado.js`, `ranking.js`, `perfil.js`, `team.js`, `vetos.js`, `utils.js`, etc.
  - `img/` — imagens, ícones, GIFs, fundos, etc.
  - `download/Regras_MIXCAMP.pdf` — regras do campeonato.

- Arquivos adicionais:
  - `ANALISE_PRODUCAO.md` — anotações/detalhes de produção.
  - `dados.txt` — dados auxiliares (livre).
  - `.gitignore`

---

### **⚙️ Configuração do Ambiente**

#### **1. Clonar o repositório**

```bash
git clone <url-do-repo>
cd site
```

#### **2. Backend – instalar dependências**

```bash
cd backend
npm install
```

#### **3. Arquivo `.env` (backend)**

Crie um arquivo `.env` dentro da pasta `backend/` com algo semelhante:

```env
# Porta da API
PORT=3000

# CORS
CORS_DOMAIN=http://127.0.0.1:5501

# Sessão
SESSION_SECRET=uma_chave_secreta_bem_segura

# Banco de Dados MySQL
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
DB_PORT=3306

# Email (Nodemailer - Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_ou_app_password

# Mercado Pago
APIKEYMERCADOPAGO=seu_access_token_mercadopago

# Cloudinary
APIKEYCLOUDINARY=seu_cloud_name
APIKEYUPLOAD=seu_upload_preset

# Faceit
APIKEYFACEIT=sua_faceit_api_key

# Steam
APIKEYSTEAM=sua_steam_api_key

# URLs base para callbacks (Mercado Pago, etc.)
BASE_URL=http://127.0.0.1:3000
NGROK_URL=

# Rotas principais da API (exemplos – ajustar conforme suas definições atuais em server.js)
ROUTE_REGISTER=/api/v1/register
ROUTE_LOGIN=/api/v1/login
ROUTE_DASHBOARD=/api/v1/dashboard
ROUTE_LOGOUT=/api/v1/logout

ROUTE_EMAIL_CODIGO=/api/v1/email/register
ROUTE_EMAIL_VERYCODE=/api/v1/email/verify-code
```

> **Importante**: não commitar o `.env` no repositório (deve estar no `.gitignore`).

#### **4. Banco de Dados**

1. Crie um banco no MySQL com o nome configurado em `DB_NAME`.
2. Importe/execute o script `backend/sql/db.sql` nesse banco para criar as tabelas e estruturas necessárias.

---

### **🚀 Como Rodar o Projeto**

#### **Backend (API)**

Na pasta `backend/`:

```bash
npm start
# ou
node javascript/server.js
# ou
node --require dotenv/config javascript/server.js
```

A API ficará (por padrão) em:

- `http://127.0.0.1:3000` (ou `http://localhost:PORT` se você mudar a porta no `.env`)

#### **Frontend**

As páginas HTML estão em `frontend/html/`. Você pode rodar de várias formas:

- Abrir diretamente com Live Server (VSCode) apontando, por exemplo, para `frontend/html/home.html` ou `frontend/html/login.html`.
- Ou usar qualquer servidor estático simples servindo a pasta `frontend/`.

Certifique-se de que os endpoints usados no JS (por exemplo, `API_URL = 'http://127.0.0.1:3000/api/v1'`) apontam para a mesma URL/porta configurada no backend.

---

### **🔐 Segurança & Variáveis Sensíveis**

- **Sempre** manter chaves e credenciais apenas no `.env`:
  - `SESSION_SECRET`, `EMAIL_USER`, `EMAIL_PASSWORD`
  - `APIKEYMERCADOPAGO`, `APIKEYCLOUDINARY`, `APIKEYUPLOAD`
  - `APIKEYFACEIT`, `APIKEYSTEAM`
  - Configurações de MySQL (`DB_*`)
- Verifique se o `.env` **não** está versionado no Git.

---

### **📦 Scripts úteis (backend)**

Na pasta `backend/`:

- **`npm start`**: inicia o servidor Express usando `javascript/server.js`.

---

### **🗺️ Funcionalidades (resumo)**

- **Autenticação**
  - Login com sessões (`express-session`).
  - Registro de usuários com senha hasheada (`bcrypt`).
  - Verificação de código de e-mail para registro.

- **Usuários & Perfil**
  - Perfil com avatar, banner, redes sociais, destaques.
  - Configurações personalizadas de cores, posições e links.

- **Times**
  - Criação e gerenciamento de times.
  - Convites/solicitações, transferência de liderança, gerenciamento de membros.

- **Campeonatos & Inscrições**
  - Inscrição de times/campeonatos.
  - Histórico de membros, ranking de times.
  - Chaveamento de partidas e resultados.

- **Notícias & Conteúdo**
  - Notícias em destaque, notícias do site e do campeonato.

- **Integrações**
  - **Faceit API** (dados de players e partidas).
  - **Steam API** (informações de jogadores/status).
  - **Cloudinary** (upload de imagens e mídias).
  - **Mercado Pago** (pagamentos e webhooks).

---

### **✅ Próximos Passos / Melhorias**

- Implementar o fluxo completo de **recuperação de senha** (endpoint no backend).
- Documentar todas as rotas (`ROUTE_...`) em um arquivo separado (por exemplo, `docs/api.md`).
- Adicionar testes automatizados (unitários e de integração) para as rotas principais.
- Criar um guia de deploy (produção) com variáveis específicas de ambiente.


