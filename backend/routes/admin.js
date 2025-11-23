// backend/routes/admin.js (Atualizado)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Aluno = require('../models/Aluno'); // Importa o modelo
const { protect } = require('../middleware/auth'); // Importa o middleware de proteção

// ------------------------------------
// ROTA DE LOGIN (Não precisa de proteção)
// ------------------------------------
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        
        const token = jwt.sign(
            { id: 1, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );

        return res.json({ success: true, message: 'Login bem-sucedido!', token: token });
    }

    res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
});


// ------------------------------------
// ROTAS DE GERENCIAMENTO DE DADOS (PROTEGIDAS)
// O middleware 'protect' garante que o usuário esteja logado.
// ------------------------------------

// Rota POST /api/admin/alunos
// Objetivo: Lançar um NOVO ALUNO (usando os dados processados do coletor)
router.post('/alunos', protect, async (req, res) => {
    try {
        // Valida se o aluno com o mesmo nome já existe
        const existingAluno = await Aluno.findOne({ nome: req.body.nome });
        if (existingAluno) {
            return res.status(400).json({ success: false, message: 'Aluno com este nome já existe. Use a rota de atualização.' });
        }

        const aluno = await Aluno.create(req.body); // Cria o novo aluno no BD
        res.status(201).json({ success: true, data: aluno });

    } catch (error) {
        console.error("Erro ao criar aluno:", error);
        // Trata erros de validação do Mongoose (ex: campo 'nome' faltando)
        res.status(400).json({ success: false, message: error.message || 'Falha ao criar o registro do aluno.' });
    }
});

// Rota PUT /api/admin/alunos/:id
// Objetivo: ATUALIZAR os dados de um aluno existente (usando o coletor para gerar os novos dados)
router.put('/alunos/:id', protect, async (req, res) => {
    try {
        const aluno = await Aluno.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, dataAtualizacao: Date.now() }, // Atualiza todos os campos, incluindo a data
            { new: true, runValidators: true } // 'new: true' retorna o documento atualizado
        );

        if (!aluno) {
            return res.status(404).json({ success: false, message: `Aluno com ID ${req.params.id} não encontrado.` });
        }

        res.status(200).json({ success: true, data: aluno });
    } catch (error) {
        console.error("Erro ao atualizar aluno:", error);
        res.status(400).json({ success: false, message: error.message || 'Falha ao atualizar o registro do aluno.' });
    }
});

// Rota DELETE /api/admin/alunos/:id
// Objetivo: DELETAR um aluno
router.delete('/alunos/:id', protect, async (req, res) => {
    try {
        const aluno = await Aluno.findByIdAndDelete(req.params.id);

        if (!aluno) {
            return res.status(404).json({ success: false, message: `Aluno com ID ${req.params.id} não encontrado.` });
        }

        res.status(200).json({ success: true, message: 'Aluno deletado com sucesso.' });
    } catch (error) {
        console.error("Erro ao deletar aluno:", error);
        res.status(500).json({ success: false, message: 'Erro ao deletar o registro do aluno.' });
    }
});


module.exports = router;