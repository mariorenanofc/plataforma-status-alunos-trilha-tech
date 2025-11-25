
# Plataforma de Status de Alunos - Trilha Tech

Este projeto é uma plataforma web para acompanhar o status de progresso dos alunos na Trilha Tech do projeto Florescendo Talentos. Ele permite que os alunos visualizem suas pendências e progresso, e oferece uma área administrativa para gerenciar os dados dos alunos.

## Visão Geral da Arquitetura

O projeto é dividido em duas partes principais:

*   **Frontend:** Uma aplicação web estática construída com HTML, CSS e JavaScript puros.
*   **Backend:** Uma API RESTful construída com Node.js, Express e MongoDB.

### Serviços Utilizados

*   **Frontend (Hosting):** [Vercel](https://vercel.com/)
*   **Backend (Hosting):** [Render](https://render.com/)
*   **Banco de Dados:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Funcionalidades

### Área Pública (Frontend)

*   **Listagem de Alunos:** Exibe uma tabela com todos os alunos, suas turmas, total de pendências e uma barra de progresso.
*   **Busca e Filtro:** Permite buscar alunos por nome e filtrar por turma (1º ou 2º Ano).
*   **Detalhes de Pendências:** Um modal exibe as atividades pendentes específicas de cada aluno.
*   **Ranking:** Uma tela de ranking mostra o Top 5 de alunos com mais entregas e o Top 5 com mais pendências.
*   **Login de Administrador:** Um link para a página de login da área administrativa.

### Área Administrativa (Frontend + Backend)

*   **Autenticação:** Acesso à área de administração protegido por login e senha com JWT (JSON Web Token).
*   **Coleta e Lançamento de Dados:** Uma página permite colar um relatório de progresso do aluno. O sistema processa o texto, gera um JSON com os dados estruturados e permite lançar (criar ou atualizar) os dados do aluno no banco de dados.
*   **API Segura:** As rotas de criação, atualização e exclusão de alunos no backend são protegidas e só podem ser acessadas com um token de autenticação válido.

## Tecnologias Utilizadas

### Backend

*   **Linguagem:** JavaScript
*   **Plataforma:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/pt-br/)
*   **Banco de Dados:** [MongoDB](https://www.mongodb.com/) com [Mongoose](https://mongoosejs.com/)
*   **Autenticação:** [JSON Web Token (JWT)](https://jwt.io/)
*   **Outras dependências:**
    *   `cors`: Para permitir requisições de origens diferentes (do frontend Vercel para o backend Render).
    *   `dotenv`: Para gerenciar variáveis de ambiente.

### Frontend

*   **Linguagens:** HTML, CSS, JavaScript

## Configuração do Ambiente

Para rodar o projeto localmente, você precisará configurar as variáveis de ambiente no backend.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/plataforma-status-alunos-trilha-tech.git
    ```

2.  **Navegue até a pasta do backend:**
    ```bash
    cd plataforma-status-alunos-trilha-tech/backend
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Crie um arquivo `.env` na raiz da pasta `backend`** e adicione as seguintes variáveis:

    ```env
    # Porta do servidor
    PORT=3000

    # String de conexão do seu banco de dados MongoDB Atlas
    MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

    # Credenciais para o login de administrador
    ADMIN_USER=seu_usuario_admin
    ADMIN_PASS=sua_senha_admin

    # Chave secreta para gerar os tokens JWT (pode ser qualquer string segura)
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

    **Como obter a `MONGO_URI`:**
    *   Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    *   Crie um novo cluster e um novo banco de dados.
    *   Na visão geral do seu cluster, clique em "Connect", selecione "Drivers", escolha "Node.js" e copie a string de conexão fornecida, substituindo `<password>` pela senha do usuário do banco de dados que você criou.

5.  **Inicie o servidor backend:**
    ```bash
    npm start
    ```

6.  **Abra os arquivos HTML do frontend** (como `index.html`) diretamente no seu navegador ou use uma extensão como o "Live Server" no VS Code para visualizar o frontend. O frontend se conectará automaticamente à API rodando localmente.

## Estrutura de Pastas

```
.
├── backend/                # Contém a aplicação Node.js (API)
│   ├── middleware/         # Middlewares do Express (ex: autenticação)
│   ├── models/             # Modelos do Mongoose para o MongoDB
│   ├── routes/             # Definição das rotas da API
│   ├── .gitignore
│   ├── package.json
│   ├── server.js           # Arquivo principal do servidor
│   └── ...
└── frontend/               # Contém a aplicação cliente
    ├── assets/             # Arquivos estáticos (CSS, JS, Imagens)
    ├── coleta-dados.html   # Página de admin para inserir dados
    ├── index.html          # Página principal (lista de alunos)
    ├── login.html          # Página de login do admin
    └── ...
```

## Como Usar a Área de Admin

1.  Acesse `login.html` e insira o `ADMIN_USER` e `ADMIN_PASS` definidos no seu arquivo `.env`.
2.  Após o login, você será redirecionado para a página `coleta-dados.html`.
3.  Copie o relatório de progresso de um aluno e cole no campo de texto.
4.  Clique em "Processar e Gerar JSON". O sistema irá analisar o texto.
5.  Selecione a turma correta do aluno.
6.  Clique em "Lançar Dados do Aluno no Sistema" para salvar as informações no banco de dados. Se o aluno já existir (baseado no nome), seus dados serão atualizados; caso contrário, um novo aluno será criado.
