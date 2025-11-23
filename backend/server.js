// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente do arquivo .env (segurança para dados sensíveis)
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: Permite que o Express leia JSON do corpo das requisições (POST/PUT)
app.use(express.json());

// Middleware: Configuração básica de CORS (para permitir que o frontend acesse o backend)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Permite acesso de qualquer origem (em produção, limite isso!)
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 1. Conexão com o Banco de Dados
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro de conexão com o MongoDB:', err));

// 2. Definição das Rotas (Serão criadas nos próximos passos)
const alunosRoutes = require('./routes/alunos');
const adminRoutes = require('./routes/admin');
app.use('/api/alunos', alunosRoutes); // Rotas públicas: /api/alunos/...
app.use('/api/admin', adminRoutes);   // Rotas privadas: /api/admin/...

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Florescendo Talentos está rodando!');
});

// 3. Inicializa o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});