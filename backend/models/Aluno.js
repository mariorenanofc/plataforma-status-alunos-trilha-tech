// backend/models/Aluno.js

const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
    // ID é gerado automaticamente pelo MongoDB (_id)

    nome: {
        type: String,
        required: true,
        trim: true,
        unique: true // Garante que não haja duplicidade de nome
    },
    turma: {
        type: String,
        required: true,
        enum: ['1º Ano', '2º Ano', 'Desconhecida'] // Limita os valores aceitos
    },
    // Array que armazena 52 posições (0 ou 1) para cálculo de pendências/ranking
    statusAulas: {
        type: [Number], // Array de números
        required: true,
        validate: [arrayLimit, 'statusAulas deve ter exatamente 52 entradas.']
    },
    // Objeto detalhado das pendências (para exibir no modal)
    pendenciasDetalhadas: {
        type: Object, // Armazena a estrutura { '40': {status: 'Atribuído', tarefas: [...]}, ...}
        default: {}
    },
    dataAtualizacao: {
        type: Date,
        default: Date.now
    }
});

function arrayLimit(val) {
    return val.length === 60;
}

module.exports = mongoose.model('Aluno', AlunoSchema);