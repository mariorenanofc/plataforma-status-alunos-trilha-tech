// A constante NUM_AULAS é definida em script.js (carregado primeiro) e será acessada
// implicitamente no escopo global. Removida a declaração duplicada para resolver o SyntaxError.
const SEPARADOR_LINHA = '\n'; 


// ** REFERÊNCIA DE FUNÇÕES E CONSTANTES GLOBAIS **
// As funções e constantes globais (carregarAlunos, fazerLogout, API_BASE_URL, NUM_AULAS)
// são carregadas a partir de script.js e/ou do HTML antes deste script.


/**
 * Inicia o processo de parseamento (análise) do texto colado.
 * Implementa o preenchimento automático da turma.
 */
async function processarRelatorio() {
    const textoRelatorio = document.getElementById('inputRelatorio').value;
    const outputJSON = document.getElementById('outputJSON');
    const selectTurmaLancamento = document.getElementById('selectTurmaLancamento');
    const statusExistente = document.getElementById('alunoExistenteId');

    // Resetar campos de controle
    document.getElementById('jsonAlunoProcessado').dataset.alunoId = '';
    statusExistente.textContent = '';

    if (!localStorage.getItem('adminToken')) {
        alert("Sessão expirada ou não iniciada. Faça login novamente.");
        fazerLogout();
        return;
    }

    if (!textoRelatorio || textoRelatorio.trim().length < 50) {
        outputJSON.textContent = "Por favor, cole um relatório válido com dados suficientes.";
        document.getElementById('btnLancarDados').disabled = true;
        selectTurmaLancamento.value = "";
        return;
    }

    try {
        const resultado = parsearTextoParaDados(textoRelatorio);

        // 1. VERIFICAÇÃO DE ALUNO EXISTENTE (Assíncrona - usando carregarAlunos que busca do BD)
        const listaAtual = await carregarAlunos(); // Função do script.js
        const alunoExistente = listaAtual.find(a => a.nome === resultado.nome);

        if (alunoExistente) {
            // Guarda o ID do MongoDB para a operação de UPDATE (PUT)
            document.getElementById('jsonAlunoProcessado').dataset.alunoId = alunoExistente._id;
            statusExistente.textContent = `Aluno EXISTENTE (ID: ${alunoExistente._id}). Será feita uma ATUALIZAÇÃO (PUT).`;

            if (alunoExistente.turma && alunoExistente.turma !== "Desconhecida") {
                selectTurmaLancamento.value = alunoExistente.turma;
            }
        } else {
            statusExistente.textContent = `Aluno NOVO. Será feito um LANÇAMENTO (POST).`;
            selectTurmaLancamento.value = "";
        }

        outputJSON.textContent = JSON.stringify(resultado, null, 4);
        document.getElementById('jsonAlunoProcessado').value = JSON.stringify(resultado);
        document.getElementById('btnLancarDados').disabled = false;

        alert(`Dados de ${resultado.nome} processados. Turma checada. Clique em 'Lançar Dados'.`);

    } catch (error) {
        outputJSON.textContent = `Erro ao processar: ${error.message}`;
        console.error(error);
    }
}


/**
 * Lança ou Atualiza os dados do aluno no Back-end (POST ou PUT) usando o Token JWT.
 */
async function lancarDadosAluno() {
    const jsonStr = document.getElementById('jsonAlunoProcessado').value;
    const turmaSelecionada = document.getElementById('selectTurmaLancamento').value;
    const alunoId = document.getElementById('jsonAlunoProcessado').dataset.alunoId;
    const adminToken = localStorage.getItem('adminToken');

    if (!jsonStr) {
        alert("Erro: Nenhum dado processado.");
        return;
    }
    if (turmaSelecionada === "") {
        alert("Atenção! É obrigatório selecionar a Turma para lançar o aluno.");
        return;
    }
    if (!adminToken) {
        alert("Erro de segurança: Token de admin ausente. Faça login novamente.");
        fazerLogout();
        return;
    }

    const novoAluno = JSON.parse(jsonStr);
    novoAluno.turma = turmaSelecionada; // Injeta a turma

    const isUpdate = !!alunoId;
    const url = isUpdate ? `${API_BASE_URL}/admin/alunos/${alunoId}` : `${API_BASE_URL}/admin/alunos`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` // ** ENVIO DO TOKEN PARA AUTENTICAÇÃO **
            },
            body: JSON.stringify(novoAluno)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`Lançamento bem-sucedido! Aluno ${novoAluno.nome} ${isUpdate ? 'ATUALIZado' : 'CRIADO'} no BD.`);
        } else if (response.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            fazerLogout();
        } else {
            alert(`Falha no lançamento (${method}): ${result.message || 'Erro de servidor.'}`);
        }

    } catch (error) {
        console.error("Erro ao comunicar com a API:", error);
        alert("Erro de rede. Verifique o console do navegador e o servidor Node.js.");
    }

    // Limpa a interface
    document.getElementById('btnLancarDados').disabled = true;
    document.getElementById('outputJSON').textContent = "Aguardando próximo processamento...";
    document.getElementById('selectTurmaLancamento').value = "";
    document.getElementById('alunoExistenteId').textContent = '';
    document.getElementById('jsonAlunoProcessado').value = '';
}

/**
 * Analisa o texto do relatório no novo formato e o converte para um objeto de dados estruturado.
 */
function parsearTextoParaDados(texto) {
    // Acessa NUM_AULAS do escopo global (definido em script.js)
    const totalAulasEsperado = window.NUM_AULAS || 60; 

    const linhas = texto.split(SEPARADOR_LINHA)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !/filtro de tarefas|sem data de entrega|tudo/i.test(l));

    const aulasStatus = {};
    let nomeAluno = "NOME INDEFINIDO";

    if (linhas.length > 0) {
        // Tenta encontrar o nome do aluno, que geralmente é a primeira linha.
        // Remove possíveis prefixos como "ALUNO:" e garante que seja maiúsculo.
        nomeAluno = linhas[0].replace(/^ALUNO:\s*/i, '').toUpperCase();
    }

    const regexTarefa = /^Aula\s*(\d+)\s*-\s*(.+?)(?:\s*\((?:concluído|entregue com atraso)\))?$/i;
    
    // Itera sobre as linhas para extrair as informações de cada aula
    for (let i = 1; i < linhas.length; i++) { // Começa em i=1 para pular o nome do aluno
        const linha = linhas[i];
        const matchTarefa = linha.match(regexTarefa);

        if (matchTarefa) {
            const numeroAula = parseInt(matchTarefa[1], 10);
            const nomeTarefa = matchTarefa[2].trim();

            if (!aulasStatus[numeroAula]) {
                aulasStatus[numeroAula] = { total: 0, pendentes: 0, tarefasPendentes: [] };
            }
            aulasStatus[numeroAula].total++;

            // Procura pelo status ("Atribuído") nas linhas seguintes, até a próxima aula ou o fim.
            let proximoIndice = i + 1;
            let statusEncontrado = false;
            while(proximoIndice < linhas.length && !linhas[proximoIndice].match(regexTarefa)) {
                if (/atribuído|atribuido/i.test(linhas[proximoIndice])) {
                    aulasStatus[numeroAula].pendentes++;
                    aulasStatus[numeroAula].tarefasPendentes.push(nomeTarefa);
                    statusEncontrado = true;
                    break; 
                }
                proximoIndice++;
            }
            // Se o status for encontrado, avança o índice para a linha que continha o status
            if(statusEncontrado) i = proximoIndice -1; // Ajuste para que o for(i++) vá para a próxima aula
        }
    }

    // Constrói o Array final `statusAulas` e o objeto detalhado
    const statusAulasFinal = [];
    let totalPendenciasCalculado = 0;
    const pendenciasDetalhadas = {};

    for (let i = 1; i <= totalAulasEsperado; i++) {
        const aulaInfo = aulasStatus[i];
        let status = 1; // 1 = OK

        if (aulaInfo && aulaInfo.pendentes > 0) {
            status = 0; // 0 = Pendente
            totalPendenciasCalculado++;

            pendenciasDetalhadas[i] = {
                status: (aulaInfo.pendentes === aulaInfo.total) ? 'Atribuído' : 'Quase Completa',
                tarefas: aulaInfo.tarefasPendentes
            };
        }
        statusAulasFinal.push(status);
    }
    
    // Verificação de Sanidade: Garante que o array de statusAulas tem o tamanho correto.
    if (statusAulasFinal.length !== totalAulasEsperado) {
        throw new Error(`Erro de processamento: O número de aulas (${statusAulasFinal.length}) não corresponde ao esperado (${totalAulasEsperado}). Verifique o texto colado.`);
    }


    // Retorno final do objeto estruturado
    return {
        nome: nomeAluno,
        turma: "Desconhecida",
        totalPendenciasCalculado: totalPendenciasCalculado,
        statusAulas: statusAulasFinal,
        pendenciasDetalhadas: pendenciasDetalhadas
    };
}


// --- Final do arquivo: Anexando os eventos aos botões ---

document.addEventListener('DOMContentLoaded', () => {
    const btnProcessar = document.getElementById('btnProcessar');
    if (btnProcessar) {
        btnProcessar.addEventListener('click', processarRelatorio);
    }

    const btnLancarDados = document.getElementById('btnLancarDados');
    if (btnLancarDados) {
        btnLancarDados.addEventListener('click', lancarDadosAluno);
    }
});