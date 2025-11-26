// DADOS BASE E CONFIGURAÇÃO DA API

const NUM_AULAS = 60;

// Configuração dinâmica da API para suportar DEV (local) e PROD (online)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal
    ? 'http://localhost:3000/api' // URL para testes locais
    : 'https://plataforma-status-alunos-trilha-tech.onrender.com/api'; // URL do servidor de produção 

// NOVO: Variável global para armazenar os dados dos alunos carregados em cache.
let alunosDataCache = [];


// Funções para controlar o loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Carrega a lista de alunos do Back-end (Rota pública /api/alunos).
 * Implementa cache para evitar múltiplas chamadas à API e garante que todos
 * os outros componentes possam usar esta mesma lista.
 */
async function carregarAlunos() {
    if (alunosDataCache.length > 0) {
        return alunosDataCache;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/alunos`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        alunosDataCache = result.data || []; // Armazena no cache
        return alunosDataCache;
    } catch (error) {
        console.error("Erro ao carregar dados do servidor:", error);
        return [];
    }
}

function calcularPendencias(aluno) {
    // Calcula as pendências com base no array do BD
    return aluno.statusAulas.filter(status => status === 0).length;
}

/**
 * Encontra e formata a data da última atualização entre todos os alunos.
 * @param {Array} alunos Lista de objetos Aluno.
 * @returns {string} Data formatada ou mensagem padrão.
 */
function getLastUpdateTime(alunos) {
    if (!alunos || alunos.length === 0) {
        return "Nenhuma atualização encontrada.";
    }

    // Encontra a data mais recente
    const latestDate = alunos.reduce((maxDate, aluno) => {
        const currentData = new Date(aluno.dataAtualizacao);
        return currentData > maxDate ? currentData : maxDate;
    }, new Date(0)); 

    if (latestDate.getTime() === new Date(0).getTime()) {
        return "Nenhuma atualização recente.";
    }

    // Formatação da data (Ex: 25/11/2025 às 09:15)
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };
    
    return latestDate.toLocaleDateString('pt-BR', options).replace(',', ' às');
}


/**
 * Popula os cards de estatísticas da Hero Section na tela inicial, 
 * incluindo a notificação de última atualização.
 */
async function popularHeroSection() {
    const totalAlunosElement = document.getElementById('totalAlunosHero');
    const alunosEmDiaElement = document.getElementById('alunosEmDiaHero');
    const updateNotificationElement = document.getElementById('lastUpdateNotification');

    if (!totalAlunosElement || !alunosEmDiaElement) return;

    totalAlunosElement.textContent = '...';
    alunosEmDiaElement.textContent = '...';
    if (updateNotificationElement) updateNotificationElement.textContent = 'Carregando última atualização...';

    showLoader(); 

    try {
        const alunosData = await carregarAlunos(); // Agora usa cache
        const totalAlunos = alunosData.length;
        
        const alunosEmDia = alunosData.filter(aluno => {
            const pendencias = calcularPendencias(aluno);
            return pendencias === 0;
        }).length;
        
        totalAlunosElement.textContent = totalAlunos;
        alunosEmDiaElement.textContent = alunosEmDia;
        
        // NOVO: Exibe a data de atualização
        if (updateNotificationElement) {
            const lastUpdateTime = getLastUpdateTime(alunosData);
            updateNotificationElement.innerHTML = ` Última Atualização: <strong>${lastUpdateTime}</strong>`;
        }

    } catch (error) {
        totalAlunosElement.textContent = '--';
        alunosEmDiaElement.textContent = '--';
        if (updateNotificationElement) updateNotificationElement.textContent = 'Falha ao carregar dados.';
        console.error("Erro ao popular Hero Section:", error);
    } finally {
        hideLoader(); 
    }
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
        popularHeroSection(); // CHAMADA PARA POPULAR AS ESTATÍSTICAS (que agora usa cache)
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
    showLoader();
    try {
        const termoBusca = document.getElementById('inputBuscaNome')?.value.toLowerCase() || '';
        const turmaSelecionada = document.getElementById('selectTurma')?.value || 'todos';

        const todosAlunos = await carregarAlunos(); // Aguarda os dados do cache ou API

        const alunosFiltrados = todosAlunos.filter(aluno => {
            // Usa o ID do MongoDB (aluno._id) como ID local, se o 'id' não for definido
            aluno.id = aluno._id;

            const matchNome = aluno.nome.toLowerCase().includes(termoBusca);
            const matchTurma = (turmaSelecionada === 'todos' || aluno.turma === turmaSelecionada);
            return matchNome && matchTurma;
        });

        renderizarTabela(alunosFiltrados);
    } finally {
        hideLoader();
    }
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
        // CORREÇÃO ESSENCIAL: Adicionando o atributo data-label para a responsividade (Card View)
        linha.innerHTML = `
            <td data-label="Aluno:">${aluno.nome}</td>
            <td data-label="Turma:">${aluno.turma}</td>
            <td data-label="Pendências:" class="coluna-pendencias" style="color: ${corPendencia};">
                ${totalPendencias} Pendência(s)
            </td>
            <td data-label="Progresso:">
                <div class="progresso-container">
                    <div class="progresso-bar" style="width: ${porcentagem}%; background-color: ${corBarra};"></div>
                </div>
                <span class="progresso-texto" style="color: ${corBarra};">${porcentagem}%</span>
            </td>
            <td data-label="Ações:">
                <button class="btn-detalhes" onclick="abrirModal('${aluno._id}')">
                    Detalhes
                </button>
            </td>
        `;
        tabelaBody.appendChild(linha);
    });
}

async function gerarRanking() {
    showLoader();
    try {
        const alunosData = await carregarAlunos(); // Aguarda os dados do cache ou API

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
    } finally {
        hideLoader();
    }
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
    showLoader();
    try {
        // Busca o aluno pelo _id do MongoDB
        const alunosData = await carregarAlunos();
        const aluno = alunosData.find(a => a._id === alunoId);
        if (!aluno) return;

        const listaPendenciasUL = document.getElementById('listaPendencias');
        if (!listaPendenciasUL) return;

        // Limpeza e inicialização
        listaPendenciasUL.innerHTML = '';
        let pendenciasCount = 0;

        if (aluno.pendenciasDetalhadas && Object.keys(aluno.pendenciasDetalhadas).length > 0) {
            for (const aulaNumStr in aluno.pendenciasDetalhadas) {
                const aulaNum = parseInt(aulaNumStr);
                const info = aluno.pendenciasDetalhadas[aulaNum];

                if (info.status === 'Completa') continue;

                pendenciasCount++;
                
                // Define classes e textos baseados no status para uso no CSS
                const iconeAula = (info.status === 'Atribuído') ? '❌' : '⚠️';
                const statusClass = (info.status === 'Atribuído') ? 'aula-status-atribuido' : 'aula-status-quase-completa';
                const statusTexto = (info.status === 'Atribuído') ? 'Pendente (Atribuído)' : 'Em Revisão (Quase Completa)';


                const li = document.createElement('li');
                li.className = statusClass; // Aplica a classe CSS para o card de aula
                
                let liContent = `<span class="titulo-aula-pendencia">${iconeAula} Aula ${aulaNum}: ${statusTexto}</span>`;

                if (info.tarefas && info.tarefas.length > 0) {
                    let ulTarefasContent = '';
                    info.tarefas.forEach(tarefa => {
                        // Estrutura a lista de tarefas aninhada
                        ulTarefasContent += `<li><span style="color: var(--cor-alerta);">●</span> ${tarefa}</li>`;
                    });
                    
                    liContent += `<p style="font-weight: normal; margin-top: 8px;">**Tarefas Pendentes:**</p>`;
                    liContent += `<ul class="lista-tarefas-pendentes">${ulTarefasContent}</ul>`;
                } else {
                    liContent += '<p style="font-style: italic; font-size: 0.9em; margin-top: 5px;">Entrega incompleta/faltando, sem tarefas detalhadas no relatório.</p>';
                }
                
                li.innerHTML = liContent;
                listaPendenciasUL.appendChild(li);
            }
        }

        if (pendenciasCount === 0) {
            const li = document.createElement('li');
            li.className = 'aula-status-ok'; // Aplica a classe de sucesso
            li.textContent = '✅ Parabéns! Nenhuma pendência encontrada com detalhes.';
            listaPendenciasUL.appendChild(li);
        }

        document.getElementById('modalNomeAluno').textContent = aluno.nome;
        document.getElementById('modalTurmaAluno').textContent = aluno.turma;
        document.getElementById('modalTotalPendencias').textContent = pendenciasCount;

        document.getElementById('modalPendencias').style.display = 'block';
    } finally {
        hideLoader();
    }
}

function fecharModal() {
    document.getElementById('modalPendencias').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    // Gerencia o botão de Login/Área do Admin com base no token
    function gerenciarBotaoAdmin() {
        const adminButton = document.querySelector('.btn-login-admin');
        if (!adminButton) return;

        const adminToken = localStorage.getItem('adminToken');

        if (adminToken) {
            adminButton.textContent = 'Área do Admin ⚙️';
            adminButton.href = 'coleta-dados.html';
        }
        // Se não houver token, o botão permanece com seu estado padrão do HTML (Login Admin)
    }

    gerenciarBotaoAdmin();
    
    // NOVO: Inicia o carregamento de dados e a atualização da Hero Section Imediatamente
    popularHeroSection(); 
});