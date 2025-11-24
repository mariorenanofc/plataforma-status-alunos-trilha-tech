const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');



// Rota de teste pública (GET /api/alunos)
router.get('/', async (req, res) => {
    try {
        const alunos = await Aluno.find().sort({ nome: 1 }); // Ordena por nome
        res.status(200).json({ success: true, data: alunos});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar alunos.', error: error.message });
    }
});

// Rota GET /api/alunos/:id
// Objetivo: Retornar os dados de um aluno específico.
router.get('/:id', async (req, res) => {
    try {
        const aluno = await Aluno.findById(req.params.id);

        if (!aluno) {
            return res.status(404).json({ success: false, message: `Aluno com ID ${req.params.id} não encontrado.` });
        }
        
        res.status(200).json({ success: true, data: aluno });

    } catch (error) {
        // Trata IDs inválidos do MongoDB (ex: formato incorreto)
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ success: false, message: 'Formato de ID inválido.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao buscar aluno.' });
    }
});

// **É ESSENCIAL EXPORTAR O OBJETO ROUTER**
module.exports = router;