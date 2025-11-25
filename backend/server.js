// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Pacote CORS adicionado

// Carrega variáveis de ambiente do arquivo .env (segurança para dados sensíveis)
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORREÇÃO CRUCIAL DO CORS: Configuração flexível para DEV e PROD.
const allowedOrigins = [
    'https://plataforma-status-alunos-trilha-tec.vercel.app', // URL de produção do Frontend
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:3000', // Exemplo com porta comum de Live Server
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: Postman, apps mobile) ou se a origem estiver na lista
        if (!origin || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
            callback(null, true);
        } else {
            callback(new Error('A política de CORS não permite acesso desta origem.'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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