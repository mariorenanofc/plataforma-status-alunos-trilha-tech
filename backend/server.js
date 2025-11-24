// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Pacote CORS adicionado

// Carrega variáveis de ambiente do arquivo .env (segurança para dados sensíveis)
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORREÇÃO CRUCIAL DO CORS: Usar apenas o pacote CORS e remover a barra final (/) da URL.
app.use(cors({
    // URL exata do Front-end no Vercel (sem a barra final /)
    origin: 'https://plataforma-status-alunos-trilha-tec.vercel.app', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Permite todos os métodos necessários
    credentials: true, // Necessário para enviar o token (JWT)
}));


// Middleware: Permite que o Express leia JSON do corpo das requisições (POST/PUT)
app.use(express.json());

// A CONFIGURAÇÃO MANUAL DE CORS FOI REMOVIDA AQUI PARA EVITAR CONFLITOS.

// 2. Conexão com o Banco de Dados
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro de conexão com o MongoDB:', err));

// 3. Definição das Rotas
const alunosRoutes = require('./routes/alunos');
const adminRoutes = require('./routes/admin');
app.use('/api/alunos', alunosRoutes); // Rotas públicas
app.use('/api/admin', adminRoutes);   // Rotas privadas

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Florescendo Talentos está rodando!');
});

// 4. Inicializa o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});