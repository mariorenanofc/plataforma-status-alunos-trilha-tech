// ===============================================
// DADOS BASE E CONFIGURAÇÃO DA API
// ===============================================

const NUM_AULAS = 60;
// CORREÇÃO: Usando a URL de produção do .env para garantir a conectividade em produção.
const API_BASE_URL = 'https://plataforma-status-alunos-trilha-tech.onrender.com/api'; 

/**
 * Carrega a lista de alunos do Back-end (Rota pública /api/alunos).
 */
async function carregarAlunos() {
    try {
        const response = await fetch(`${API_BASE_URL}/alunos`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        return result.data || []; // Retorna o array de dados
    } catch (error) {
        console.error("Erro ao carregar dados do servidor:", error);
        // Em um ambiente público, podemos tentar retornar dados de fallback
        return [];
    }
}

function calcularPendencias(aluno) {
    // Calcula as pendências com base no array do BD
    return aluno.statusAulas.filter(status => status === 0).length;
}


// ===============================================
// HTML DOS COMPONENTES E FUNÇÕES DE NAVEGAÇÃO
// ===============================================

const HTML_LISTA_ALUNOS = `
    <section id="listaAlunos" class="conteudo-secao">
        <h2>📜 Lista Completa de Alunos e Pendências</h2>
        
        <div class="filtros">
            <div class="campos-filtro">
                <input type="text" id="inputBuscaNome" placeholder="Buscar aluno pelo nome..." onkeyup="filtrarAlunos()">
                <select id="selectTurma" onchange="filtrarAlunos()">
                    <option value="todos">Todas as Turmas</option>
                    <option value="1º Ano">1º Ano</option>
                    <option value="2º Ano">2º Ano</option>
                </select>
            </div>
        </div>
        
        <table id="tabelaAlunos">
            <thead>
                <tr>
                    <th>Nome do Aluno</th>
                    <th>Turma</th>
                    <th>Total de Pendências</th>
                    <th>Progresso</th> <th>Ações</th>
                </tr>
            </thead>
            <tbody id="listaAlunosBody">
                </tbody>
        </table>
    </section>
`;

const HTML_RANKING = `
    <section id="ranking" class="conteudo-secao">
        <h2>🥇 Ranking de Entregas e Pendências</h2>
        <div class="ranking-layout">
            
            <div class="ranking-coluna">
                <h3>🏆 Top 5: Mais Entregas em Dia (${NUM_AULAS} Aulas)</h3>
                <div id="topEntregasContainer" class="ranking-lista">
                    </div>
            </div>

            <div class="ranking-coluna">
                <h3>🚨 Top 5: Maior Número de Pendências</h3>
                <div id="topPendenciasContainer" class="ranking-lista">
                    </div>
            </div>
        </div>
    </section>
`;


function mostrarSecao(idSecao) {
    const conteudoDinamico = document.getElementById('conteudoDinamico');
    const secaoInicio = document.getElementById('inicio');

    secaoInicio.style.display = 'none';
    conteudoDinamico.innerHTML = '';

    if (idSecao === 'inicio') {
        secaoInicio.style.display = 'block';
    } else if (idSecao === 'listaAlunos') {
        conteudoDinamico.innerHTML = HTML_LISTA_ALUNOS;
        // Chama a função assíncrona
        filtrarAlunos();
    } else if (idSecao === 'ranking') {
        conteudoDinamico.innerHTML = HTML_RANKING;
        // Chama a função assíncrona
        gerarRanking();
    }
}

// ===============================================
// FUNÇÕES DE EXIBIÇÃO (AGORA ASSÍNCRONAS)
// ===============================================

async function filtrarAlunos() {
    const termoBusca = document.getElementById('inputBuscaNome')?.value.toLowerCase() || '';
    const turmaSelecionada = document.getElementById('selectTurma')?.value || 'todos';

    const todosAlunos = await carregarAlunos(); // Aguarda os dados da API

    const alunosFiltrados = todosAlunos.filter(aluno => {
        // Usa o ID do MongoDB (aluno._id) como ID local, se o 'id' não for definido
        aluno.id = aluno._id;

        const matchNome = aluno.nome.toLowerCase().includes(termoBusca);
        const matchTurma = (turmaSelecionada === 'todos' || aluno.turma === turmaSelecionada);
        return matchNome && matchTurma;
    });

    renderizarTabela(alunosFiltrados);
}

function renderizarTabela(listaDeAlunos) {
    const tabelaBody = document.getElementById('listaAlunosBody');
    if (!tabelaBody) return;

    tabelaBody.innerHTML = '';
    if (listaDeAlunos.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum aluno encontrado com este filtro.</td></tr>`;
        return;
    }

    listaDeAlunos.forEach(aluno => {
        // ... (cálculo de progresso e rendering é o mesmo) ...
        const totalPendencias = calcularPendencias(aluno);
        const totalEntregues = NUM_AULAS - totalPendencias;
        const porcentagem = Math.round((totalEntregues / NUM_AULAS) * 100);

        const corPendencia = totalPendencias > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)';
        const corBarra = porcentagem < 50 ? 'var(--cor-alerta)' : 'var(--cor-primaria)';

        const linha = document.createElement('tr');
        // Usamos aluno._id para o modal
        linha.innerHTML = `
            <td>${aluno.nome}</td>
            <td>${aluno.turma}</td>
            <td class="coluna-pendencias" style="color: ${corPendencia};">
                ${totalPendencias} Pendência(s)
            </td>
            <td>
                <div class="progresso-container">
                    <div class="progresso-bar" style="width: ${porcentagem}%; background-color: ${corBarra};"></div>
                </div>
                <span class="progresso-texto" style="color: ${corBarra};">${porcentagem}%</span>
            </td>
            <td>
                <button class="btn-detalhes" onclick="abrirModal('${aluno._id}')">
                    Detalhes
                </button>
            </td>
        `;
        tabelaBody.appendChild(linha);
    });
}

async function gerarRanking() {
    const alunosData = await carregarAlunos(); // Aguarda os dados da API

    const rankingData = alunosData.map(aluno => {
        const totalPendencias = calcularPendencias(aluno);
        const totalEntregues = NUM_AULAS - totalPendencias;
        return {
            nome: aluno.nome,
            entregues: totalEntregues,
            pendencias: totalPendencias
        };
    });
    // ... (restante da lógica de ordenação e renderização de ranking é o mesmo) ...

    const rankingEntregues = [...rankingData].sort((a, b) => {
        if (b.entregues !== a.entregues) { return b.entregues - a.entregues; }
        return a.nome.localeCompare(b.nome);
    });
    const top5Entregues = rankingEntregues.slice(0, 5);

    const rankingPendencias = [...rankingData].sort((a, b) => {
        if (b.pendencias !== a.pendencias) { return b.pendencias - a.pendencias; }
        return a.nome.localeCompare(b.nome);
    });
    const top5Pendencias = rankingPendencias.slice(0, 5);

    renderizarCardsRanking(top5Entregues, document.getElementById('topEntregasContainer'), 'entregues');
    renderizarCardsRanking(top5Pendencias, document.getElementById('topPendenciasContainer'), 'pendencias');
}


function renderizarCardsRanking(lista, container, tipo) {
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `<p>Não há dados para este ranking.</p>`;
        return;
    }

    lista.forEach((aluno, index) => {
        const posicao = index + 1;
        const valorPrincipal = (tipo === 'entregues') ? aluno.entregues : aluno.pendencias;
        const totalMax = NUM_AULAS;
        const etiqueta = (tipo === 'entregues') ? 'Entregues' : 'Pendências';
        const corPosicao = (tipo === 'entregues') ? 'var(--cor-sucesso)' : 'var(--cor-alerta)';

        const card = document.createElement('div');
        const classeTipo = (tipo === 'pendencias') ? 'rank-pendencia' : '';
        card.className = `card-rank rank-${posicao} ${classeTipo}`;

        card.innerHTML = `
            <div class="posicao" style="color: ${corPosicao};">${posicao}º</div>
            <h3>${aluno.nome}</h3>
            <p>${etiqueta}: <span class="entregas">${valorPrincipal}/${totalMax}</span></p>
        `;
        container.appendChild(card);
    });
}

async function abrirModal(alunoId) {
    // Busca o aluno pelo _id do MongoDB
    const alunosData = await carregarAlunos();
    const aluno = alunosData.find(a => a._id === alunoId);
    if (!aluno) return;

    const listaPendenciasUL = document.getElementById('listaPendencias');
    if (!listaPendenciasUL) return;

    // ... (restante da lógica do modal é o mesmo, usando aluno.pendenciasDetalhadas) ...
    // [Seu código existente para popular o modal]

    listaPendenciasUL.innerHTML = '';
    let pendenciasCount = 0;

    if (aluno.pendenciasDetalhadas && Object.keys(aluno.pendenciasDetalhadas).length > 0) {
        for (const aulaNumStr in aluno.pendenciasDetalhadas) {
            const aulaNum = parseInt(aulaNumStr);
            const info = aluno.pendenciasDetalhadas[aulaNum];

            if (info.status === 'Completa') continue;

            pendenciasCount++;

            const iconeAula = (info.status === 'Atribuído') ? '❌' : '⚠️';
            const corAula = (info.status === 'Atribuído') ? 'var(--cor-alerta)' : '#FFC107';

            const li = document.createElement('li');
            li.style.color = corAula;
            li.style.fontWeight = 'bold';
            li.innerHTML = `${iconeAula} Aula ${aulaNum} <span style="font-size: 0.9em; font-weight: normal;">(${info.status})</span>:`;

            if (info.tarefas && info.tarefas.length > 0) {
                const ulTarefas = document.createElement('ul');
                ulTarefas.style.marginLeft = '15px';
                ulTarefas.style.color = 'var(--cor-texto-principal)';

                info.tarefas.forEach(tarefa => {
                    const liTarefa = document.createElement('li');
                    liTarefa.innerHTML = `<span style="color: var(--cor-alerta);">•</span> ${tarefa}`;
                    ulTarefas.appendChild(liTarefa);
                });
                li.appendChild(ulTarefas);
            } else {
                li.innerHTML += ' Pendência de entrega completa.';
            }
            listaPendenciasUL.appendChild(li);
        }
    }

    if (pendenciasCount === 0) {
        const li = document.createElement('li');
        li.style.color = 'var(--cor-sucesso)';
        li.style.fontWeight = 'bold';
        li.textContent = '✅ Parabéns! Nenhuma pendência encontrada com detalhes.';
        listaPendenciasUL.appendChild(li);
    }

    document.getElementById('modalNomeAluno').textContent = aluno.nome;
    document.getElementById('modalTurmaAluno').textContent = aluno.turma;
    document.getElementById('modalTotalPendencias').textContent = pendenciasCount;

    document.getElementById('modalPendencias').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modalPendencias').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    // A inicialização ainda chama mostrarSecao que, por sua vez, chama as funções assíncronas.
});