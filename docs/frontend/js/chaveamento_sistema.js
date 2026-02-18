// URL base da API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
// const API_URL = 'mikedcf.github.io';

// Funções de debug desabilitadas (mantidas apenas para evitar erros nas chamadas)
function debugChaveamentoEtapa(etapa, payload = {}) {
    // debug desativado em produção
}

function logChampionDebug(etapa, payload = {}) {
    // debug desativado em produção
}

// =================================
// ========= POSITION IMAGES =======
// =================================

// Função para buscar imagens de posições do banco de dados
async function buscarImgPosition() {
    const response = await fetch(`${API_URL}/positionimg`);
    const data = await response.json();
    return data;
}

// Função para obter imagem de posição (síncrona - usa cache)
function getPositionImageSync(posicao) {
    if (!posicao || typeof posicao !== 'string') {
        return 'https://img.icons8.com/ios-filled/50/question-mark.png';
    }
    const posicaoLimpa = posicao.trim().toLowerCase();
    
    // Usar cache se disponível
    if (window.positionImagesCache) {
        switch (posicaoLimpa) {
            case 'capitao': return window.positionImagesCache.capitao || 'https://cdn-icons-png.flaticon.com/128/1253/1253686.png';
            case 'awp': return window.positionImagesCache.awp || 'https://img.icons8.com/offices/30/centre-of-gravity.png';
            case 'entry': return window.positionImagesCache.entry || 'https://img.icons8.com/external-others-pike-picture/50/external-Centerfire-Rifle-Ammo-shooting-others-pike-picture.png';
            case 'support': return window.positionImagesCache.support || 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-smoke-grenade-battle-royale-flaticons-flat-flat-icons.png';
            case 'igl': return window.positionImagesCache.igl || 'https://cdn-icons-png.flaticon.com/128/6466/6466962.png';
            case 'sub': return window.positionImagesCache.sub || 'https://cdn-icons-png.flaticon.com/128/10695/10695869.png';
            case 'coach': return window.positionImagesCache.coach || 'https://img.icons8.com/doodle-line/60/headset.png';
            case 'lurker': return window.positionImagesCache.lurker || 'https://img.icons8.com/ios-filled/50/ninja-head.png';
            case 'rifle': return window.positionImagesCache.rifle || 'https://img.icons8.com/external-ddara-lineal-ddara/64/external-gun-memorial-day-ddara-lineal-ddara.png';
            default: return 'https://img.icons8.com/ios-filled/50/user.png';
        }
    }
    
    // Fallback para URLs padrão
    switch (posicaoLimpa) {
        case 'capitao': return 'https://cdn-icons-png.flaticon.com/128/1253/1253686.png';
        case 'awp': return 'https://img.icons8.com/offices/30/centre-of-gravity.png';
        case 'entry': return 'https://img.icons8.com/external-others-pike-picture/50/external-Centerfire-Rifle-Ammo-shooting-others-pike-picture.png';
        case 'support': return 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-smoke-grenade-battle-royale-flaticons-flat-flat-icons.png';
        case 'igl': return 'https://cdn-icons-png.flaticon.com/128/6466/6466962.png';
        case 'sub': return 'https://cdn-icons-png.flaticon.com/128/10695/10695869.png';
        case 'coach': return 'https://img.icons8.com/doodle-line/60/headset.png';
        case 'lurker': return 'https://img.icons8.com/ios-filled/50/ninja-head.png';
        case 'rifle': return 'https://img.icons8.com/external-ddara-lineal-ddara/64/external-gun-memorial-day-ddara-lineal-ddara.png';
        default: return 'https://img.icons8.com/ios-filled/50/user.png';
    }
}

// Função para carregar cache de imagens
async function loadPositionImagesCache() {
    try {
        const imgPosition = await buscarImgPosition();
        if (imgPosition && imgPosition.length > 0) {
            window.positionImagesCache = imgPosition[0];
        }
    } catch (error) {
        console.error('Erro ao carregar cache de imagens:', error);
    }
}

async function garantirCachePosicoesCarregado() {
    if (!cachePosicoesPromise) {
        cachePosicoesPromise = loadPositionImagesCache().catch(error => {
            console.warn('Erro ao carregar cache de posições:', error);
        });
    }
    return cachePosicoesPromise;
}

function agendarInicializacaoChaveamento(delay = 500, origem = 'default') {
    if (chaveamentoInitAgendado) {
        debugChaveamentoEtapa('init-schedule-skip', { delay, origem });
        return;
    }
    chaveamentoInitAgendado = true;
    debugChaveamentoEtapa('init-schedule', { delay, origem });
    setTimeout(async () => {
        try {
            await inicializarChaveamentoDoCampeonato();
        } catch (error) {
            console.error('Erro ao inicializar chaveamento:', error);
        }
    }, delay);
}

function normalizarTipoCampeonato(campeonato) {
    if (!campeonato) return '';
    const campos = [
        campeonato.tipo,
        campeonato.tipo_campeonato,
        campeonato.tipoCampeonato,
        campeonato.tipo_evento,
        campeonato.tipoEvento
    ];
    const valor = campos.find(item => typeof item === 'string' && item.trim().length > 0);
    return valor ? valor.trim().toLowerCase() : '';
}

function extrairIdsPremiacao(campeonato) {
    if (!campeonato) {
        return { medalhaId: null, trofeuId: null };
    }
    return {
        medalhaId: campeonato.medalha_id ?? campeonato.medalhas_id ?? campeonato.medalhaId ?? campeonato.medalha ?? null,
        trofeuId: campeonato.trofeu_id ?? campeonato.trofeus_id ?? campeonato.trofeuId ?? campeonato.trofeu ?? null
    };
}

// Função para formatar o valor da premiação no formato $125,000
function formatarPremiacao(valor) {
    if (!valor && valor !== 0) return '';
    
    // Converter para número se for string
    const numValor = typeof valor === 'string' ? parseFloat(valor.replace(/[^0-9.-]/g, '')) : valor;
    
    if (isNaN(numValor)) return '';
    
    // Formatar com separador de milhares
    return '$' + numValor.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    });
}

// Função para buscar dados da medalha
async function buscarDadosMedalha(medalhaId) {
    if (!medalhaId) return null;
    
    try {
        const response = await fetch(`${API_URL || '/api/v1'}/medalhas/${medalhaId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        // A API retorna um array, pegar o primeiro item
        return Array.isArray(data) && data.length > 0 ? data[0] : data;
    } catch (error) {
        console.error('Erro ao buscar dados da medalha:', error);
        return null;
    }
}

// Função para buscar dados do troféu
async function buscarDadosTrofeu(trofeuId) {
    if (!trofeuId) return null;
    
    try {
        // Buscar todos os troféus e filtrar pelo ID
        const response = await fetch(`${API_URL || '/api/v1'}/trofeus`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        // A API retorna { trofeus: [...] }
        const trofeus = data.trofeus || (Array.isArray(data) ? data : []);
        const trofeu = trofeus.find(t => t.id === trofeuId || t.id === parseInt(trofeuId));
        return trofeu || null;
    } catch (error) {
        console.error('Erro ao buscar dados do troféu:', error);
        return null;
    }
}

// Função para buscar dados do campeonato
async function getCardDados() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados do campeonato:', error);
        return { inscricoes: [] };
    }
}

// Função para buscar um campeonato específico por id
async function buscarCampeonato(id) {
    const data = await getCardDados();
    const lista = Array.isArray(data?.inscricoes) ? data.inscricoes : [];
    const found = lista.find(item => String(item.id) === String(id));
    return found || null;
}

// Função para mapear formato da chave do banco para o formato do sistema
function mapearFormatoChave(chaveBanco) {
    const mapeamento = {
        'Single Elimination (B01 até final BO3)': 'single_b01',
        'Single Elimination (todos BO3)': 'single_bo3_all',
        'CS2 Major (playoffs BO3)': 'major_playoffs_bo3',
        'Double Elimination': 'double_elimination'
    };
    return mapeamento[chaveBanco] || 'single_b01';
}

// Função para aguardar times serem carregados no localStorage
async function aguardarTimesCarregados(maxTentativas = 20, intervalo = 300) {
    for (let i = 0; i < maxTentativas; i++) {
        const times = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
        if (times.length > 0) {
            return times;
        }
        await new Promise(resolve => setTimeout(resolve, intervalo));
    }
    return [];
}

// ===============================================================================================
// ==================================== [INTEGRAÇÃO COM BACKEND] =================================
// ===============================================================================================

// Variável global para armazenar o ID do chaveamento atual
let chaveamentoIdAtual = null;
let campeonatoIdAtual = null;
let dadosCampeonatoAtual = null;
let premiacaoOficialEmAndamento = false;
let premiacaoConcedida = false; // Flag para indicar se a premiação já foi concedida
let cachePosicoesPromise = null;
let chaveamentoInitAgendado = false;
let chaveamentoInitExecutado = false;

const BRACKET_RESULTS_KEY = 'bracket-results';
const BRACKET_RESULTS_OWNER_KEY = 'bracket-results-owner';

function obterCampeonatoIdContextual() {
    if (campeonatoIdAtual) {
        return String(campeonatoIdAtual);
    }
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? String(id) : null;
}

function obterResultadosLocais() {
    try {
        const data = localStorage.getItem(BRACKET_RESULTS_KEY);
        if (!data) return {};
        return JSON.parse(data) || {};
    } catch (error) {
        console.warn('Erro ao ler resultados locais:', error);
        return {};
    }
}

// Delegação de evento para o botão de hover "Vetos" acima do card de partida no chaveamento
document.addEventListener('click', (event) => {
    const btn = event.target.closest('.match-box-hover-button');
    if (!btn) return;

    // Segurança: apenas o dono/organizador do campeonato pode abrir os vetos pelo card
    if (window.isChampionshipOwner === false) {
        console.warn('Apenas o organizador do campeonato pode abrir os vetos da partida.');
        return;
    }

    const matchId = btn.getAttribute('data-match-id');
    if (!matchId) return;

    // Extrair informações dos times diretamente do card da partida
    const wrapper = btn.closest('.match-box-wrapper');
    const matchBox = wrapper ? wrapper.querySelector('.match-box') : null;
    if (matchBox && typeof window.atualizarHeaderVetosPartida === 'function') {
        const row1 = matchBox.querySelector('.team-row[data-team="1"]');
        const row2 = matchBox.querySelector('.team-row[data-team="2"]');

        const nome1 = row1?.querySelector('.team-name')?.textContent?.trim() || 'Time A';
        const logo1 = row1?.querySelector('.team-logo')?.src || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        const time1Id = row1?.getAttribute('data-time-id') || null;

        const nome2 = row2?.querySelector('.team-name')?.textContent?.trim() || 'Time B';
        const logo2 = row2?.querySelector('.team-logo')?.src || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        const time2Id = row2?.getAttribute('data-time-id') || null;

        // Atualiza o header do modal com os times da partida
        window.atualizarHeaderVetosPartida({
            timeA: { id: time1Id, nome: nome1, logo: logo1 },
            timeB: { id: time2Id, nome: nome2, logo: logo2 },
            matchId
        });
    }

    // Reutiliza o mesmo fluxo de abertura do modal de vetos do botão principal
    if (typeof window.abrirModalVetos === 'function') {
        window.abrirModalVetos();
    } else {
        const modalVetos = document.getElementById('modalVetos');
        if (!modalVetos) return;
        modalVetos.style.display = 'flex';
    }

    // No próximo passo podemos usar matchId para preencher nomes dos times / infos no modal
    console.log('[CHAVEAMENTO] abrir modal de vetos para partida', { matchId });
});

function salvarResultadosLocais(resultados) {
    try {
        localStorage.setItem(BRACKET_RESULTS_KEY, JSON.stringify(resultados || {}));
        const campeonatoId = obterCampeonatoIdContextual();
        const ownerId = campeonatoId ? campeonatoId : 'manual';
        localStorage.setItem(BRACKET_RESULTS_OWNER_KEY, ownerId);
    } catch (error) {
        console.error('Erro ao salvar resultados locais:', error);
    }
}

function registrarResultadoLocal(matchId, resultado) {
    if (!matchId) return;
    const resultados = obterResultadosLocais();
    resultados[matchId] = resultado;
    salvarResultadosLocais(resultados);
    marcarResultadosRegistrados();
}

function limparResultadosLocais() {
    localStorage.removeItem(BRACKET_RESULTS_KEY);
    localStorage.removeItem(BRACKET_RESULTS_OWNER_KEY);
}

function sincronizarResultadosComCampeonato(campeonatoId) {
    const ownerAtual = localStorage.getItem(BRACKET_RESULTS_OWNER_KEY);
    const ownerEsperado = campeonatoId ? String(campeonatoId) : 'manual';

    if (ownerAtual && ownerAtual !== ownerEsperado) {
        localStorage.removeItem(BRACKET_RESULTS_KEY);
        debugChaveamentoEtapa('local-sync-reset', {
            ownerAtual,
            ownerEsperado
        });
    }

    localStorage.setItem(BRACKET_RESULTS_OWNER_KEY, ownerEsperado);
    debugChaveamentoEtapa('local-sync-set', {
        ownerEsperado,
        possuiResultados: Boolean(localStorage.getItem(BRACKET_RESULTS_KEY))
    });
}

function getFlagResultadosKey() {
    const campeonatoId = obterCampeonatoIdContextual();
    if (!campeonatoId) return null;
    return `chaveamento-resultados-registrados-${campeonatoId}`;
}

function marcarResultadosRegistrados() {
    const key = getFlagResultadosKey();
    if (!key) return;
    localStorage.setItem(key, 'true');
}

function limparFlagResultadosRegistrados() {
    const key = getFlagResultadosKey();
    if (!key) return;
    localStorage.removeItem(key);
}

function resultadosJaRegistrados() {
    const key = getFlagResultadosKey();
    if (!key) return false;
    return localStorage.getItem(key) === 'true';
}

function sincronizarFlagResultadosComDados(partidas) {
    const key = getFlagResultadosKey();
    if (!key) return;
    const temResultados = Array.isArray(partidas) && partidas.some(partidaTemResultadoRegistrado);
    if (temResultados) {
        marcarResultadosRegistrados();
    } else {
        localStorage.removeItem(key);
    }
}

// Função para criar chaveamento no banco
async function criarChaveamentoNoBanco(campeonatoId, formatoChave, quantidadeTimes) {
    try {
        const response = await fetch(`${API_URL}/chaveamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                campeonato_id: parseInt(campeonatoId),
                formato_chave: formatoChave,
                quantidade_times: quantidadeTimes
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar chaveamento');
        }

        const data = await response.json();
        return data.chaveamento_id;
    } catch (error) {
        console.error('Erro ao criar chaveamento:', error);
        throw error;
    }
}

// Função para buscar chaveamento completo do banco
async function buscarChaveamentoDoBanco(campeonatoId) {
    try {
        const response = await fetch(`${API_URL}/chaveamentos/${campeonatoId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Chaveamento não existe ainda
            }
            const error = await response.json();
            throw new Error(error.error || 'Erro ao buscar chaveamento');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar chaveamento:', error);
        throw error;
    }
}

// Função para salvar resultado da partida no banco
async function salvarResultadoPartidaNoBanco(chaveamentoId, matchId, timeVencedorId, time1Id, time2Id, score1 = null, score2 = null) {
    try {
        // Para BO1, não precisamos passar scores - o backend calcula automaticamente
        // (1 para vencedor, 0 para perdedor)
        // Para BO3/BO5, passar scores explicitamente
        const body = {
            chaveamento_id: chaveamentoId,
            match_id: matchId,
            time_vencedor_id: timeVencedorId,
            time1_id: time1Id, // Enviar ID do time 1
            time2_id: time2Id  // Enviar ID do time 2
        };

        // Se scores foram fornecidos (MD3/MD5), adicionar ao body
        if (score1 !== null && score2 !== null) {
            body.score_time1 = score1;
            body.score_time2 = score2;
        }

        const response = await fetch(`${API_URL}/chaveamentos/partidas/resultado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar resultado');
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Erro ao salvar resultado:', error);
        throw error;
    }
}

// Função para mapear formato do banco para formato do sistema
function mapearFormatoChaveParaBanco(formatoSistema) {
    // O banco usa os mesmos valores do sistema
    const mapeamento = {
        'single_b01': 'single_b01',
        'single_bo3_all': 'single_bo3_all',
        'major_playoffs_bo3': 'major_playoffs_bo3',
        'double_elimination': 'double_elimination'
    };
    return mapeamento[formatoSistema] || 'single_b01';
}

// Função para buscar informações de um time por ID
async function buscarTimePorId(timeId) {
    try {
        if (!timeId) return null;

        // Primeiro, tentar buscar do localStorage
        const times = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
        const time = times.find(t => t.id == timeId);
        if (time) return time;

        // Se não encontrar, buscar da API
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            // Não logar erro para 404 (time não encontrado é esperado em alguns casos)
            if (response.status !== 404) {
                console.warn(`Erro ao buscar time ${timeId}: ${response.status}`);
            }
            return null;
        }

        const data = await response.json();
        return {
            id: timeId,
            nome: data.time?.nome || data.nome || 'Time',
            logo: data.time?.avatar_time_url || data.avatar_time_url || data.logo || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png'
        };
    } catch (error) {
        // Ignorar erros de rede silenciosamente (pode ser 404 ou outros erros esperados)
        return null;
    }
}

// Função para atualizar um card de partida com dados do banco
async function atualizarCardPartida(matchBox, partida) {
    try {
        if (!matchBox || !partida) return;


        const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
        const time2Row = matchBox.querySelector('.team-row[data-team="2"]');

        if (!time1Row || !time2Row) {
            console.warn('Time rows não encontrados para:', partida.match_id);
            return;
        }


        // Buscar informações dos times
        let time1Info = partida.time1_id ? await buscarTimePorId(partida.time1_id) : null;
        let time2Info = partida.time2_id ? await buscarTimePorId(partida.time2_id) : null;

        // Fallback para cenários com BYE (14 times) onde o banco ainda não possui o seed
        const quantidadeTimesAtual = window.dadosChaveamento?.quantidade_times || window.numTeams || 0;
        if (quantidadeTimesAtual === 14) {
            // Função local para obter times do localStorage
            const obterTimesLocal = () => {
                try {
                    const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
                    return stored;
                } catch (error) {
                    return [];
                }
            };
            const storedTeams = obterTimesLocal();
            if (!time1Info && partida.match_id === 'upper_2_1' && storedTeams[0]) {
                time1Info = storedTeams[0];
            }
            if (!time1Info && partida.match_id === 'upper_2_4' && storedTeams[1]) {
                time1Info = storedTeams[1];
            }
        }

        // IMPORTANTE: Verificar se time1_id e time2_id são iguais (duplicação)
        // Se forem iguais, limpar time2Info para evitar renderização duplicada
        if (partida.time1_id && partida.time2_id && partida.time1_id === partida.time2_id) {
            // Limpar time2Info no frontend (o backend já deve ter sido corrigido)
            time2Info = null;
        }

        // Atualizar time 1 (mesmo que ainda não tenha resultado)
        if (time1Info) {
            const time1NomeEl = time1Row.querySelector('.team-name');
            const time1LogoEl = time1Row.querySelector('.team-logo');
            if (time1NomeEl) {
                // Preservar elementos filhos (loser-indicator, lower-indicator) ao atualizar o nome
                const existingIndicators = Array.from(time1NomeEl.children);
                // Limpar todo o conteúdo (texto e elementos) e adicionar apenas o nome
                time1NomeEl.innerHTML = '';
                time1NomeEl.textContent = time1Info.nome;
                // Restaurar elementos filhos após o texto
                existingIndicators.forEach(indicator => {
                    time1NomeEl.appendChild(indicator);
                });
                // Forçar atualização visual
                time1NomeEl.style.display = 'inline';
            }
            if (time1LogoEl) {
                time1LogoEl.src = time1Info.logo || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                time1LogoEl.alt = time1Info.nome;
                // Forçar recarregamento da imagem
                time1LogoEl.style.display = 'inline-block';
            }
            // Adicionar data-time-id se o time tiver ID
            if (time1Info.id) {
                time1Row.setAttribute('data-time-id', time1Info.id);
            }

        }

        // Atualizar time 2 (mesmo que ainda não tenha resultado)
        // IMPORTANTE: Se time2Info for null mas partida.time2_id existir, tentar buscar novamente
        if (!time2Info && partida.time2_id) {
            time2Info = await buscarTimePorId(partida.time2_id);
        }

        // IMPORTANTE: Só atualizar se time2Info existir E não for o mesmo time do time1
        if (time2Info && (!time1Info || time2Info.id !== time1Info.id)) {
            const time2NomeEl = time2Row.querySelector('.team-name');
            const time2LogoEl = time2Row.querySelector('.team-logo');
            if (time2NomeEl) {
                // Preservar elementos filhos (loser-indicator, lower-indicator) ao atualizar o nome
                const existingIndicators = Array.from(time2NomeEl.children);
                // Limpar todo o conteúdo (texto e elementos) e adicionar apenas o nome
                time2NomeEl.innerHTML = '';
                time2NomeEl.textContent = time2Info.nome;
                // Restaurar elementos filhos após o texto
                existingIndicators.forEach(indicator => {
                    time2NomeEl.appendChild(indicator);
                });
                // Forçar atualização visual
                time2NomeEl.style.display = 'inline';
            }
            if (time2LogoEl) {
                time2LogoEl.src = time2Info.logo || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                time2LogoEl.alt = time2Info.nome;
                // Forçar recarregamento da imagem
                time2LogoEl.style.display = 'inline-block';
            }
            // Adicionar data-time-id se o time tiver ID
            if (time2Info.id) {
                time2Row.setAttribute('data-time-id', time2Info.id);
            }
        } else if (!time2Info && partida.time2_id) {
            // Se time2Info é null mas partida.time2_id existe, manter "Aguardando..." se já estiver assim
            const time2NomeEl = time2Row.querySelector('.team-name');
            if (time2NomeEl && time2NomeEl.textContent === 'Aguardando...') {
                // Manter "Aguardando..." se já estiver assim
            }
        } else if (time2Info && time1Info && time2Info.id === time1Info.id) {
            // Se time2 é o mesmo que time1, mostrar "Aguardando..."
            const time2NomeEl = time2Row.querySelector('.team-name');
            const time2LogoEl = time2Row.querySelector('.team-logo');
            if (time2NomeEl) {
                const existingIndicators = Array.from(time2NomeEl.children);
                time2NomeEl.innerHTML = '';
                time2NomeEl.textContent = 'Aguardando...';
                existingIndicators.forEach(indicator => {
                    time2NomeEl.appendChild(indicator);
                });
            }
            if (time2LogoEl) {
                time2LogoEl.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                time2LogoEl.alt = 'Aguardando...';
            }
        }

        // Atualizar classe do wrapper para controlar visibilidade do botão de vetos
        const wrapper = matchBox.closest('.match-box-wrapper');
        if (wrapper) {
            const temTime1 = !!time1Info && time1Info.nome && time1Info.nome !== 'Aguardando...';
            const temTime2 = !!time2Info && time2Info.nome && time2Info.nome !== 'Aguardando...';
            if (temTime1 && temTime2 && (!partida.time1_id || !partida.time2_id || partida.time1_id !== partida.time2_id)) {
                wrapper.classList.add('has-both-teams');
            } else {
                wrapper.classList.remove('has-both-teams');
            }
        }

        // Se a partida tem resultado, atualizar scores e indicadores
        if (partida.time_vencedor_id && partida.status === 'finalizada') {
            const score1El = time1Row.querySelector('.score-input');
            const score2El = time2Row.querySelector('.score-input');
            const winner1El = time1Row.querySelector('.winner-check');
            const winner2El = time2Row.querySelector('.winner-check');
            const lowerIndicator1 = time1Row.querySelector('.lower-indicator');
            const lowerIndicator2 = time2Row.querySelector('.lower-indicator');
            const time1NomeEl = time1Row.querySelector('.team-name');
            const time2NomeEl = time2Row.querySelector('.team-name');

            // Atualizar scores
            if (score1El) score1El.value = partida.score_time1 !== null && partida.score_time1 !== undefined ? partida.score_time1 : 0;
            if (score2El) score2El.value = partida.score_time2 !== null && partida.score_time2 !== undefined ? partida.score_time2 : 0;

            // Atualizar indicadores de vencedor
            const time1Venceu = partida.time1_id && partida.time_vencedor_id == partida.time1_id;
            const time2Venceu = partida.time2_id && partida.time_vencedor_id == partida.time2_id;

            // Atualizar emoji para vencedor (🏆 na final, ✅ nas outras partidas)
            const isGrandFinalPartida = partida.match_id === 'grand_final_1';

            // Verificar se é a final do Single Elimination (último round do upper bracket)
            let isFinalSingleElimPartida = false;
            if (!isGrandFinalPartida && partida.match_id && partida.match_id.startsWith('upper_')) {
                // Verificar se há lower bracket (se não houver, é Single Elimination)
                const lowerBracketArea = document.getElementById('lowerBracketArea');
                const isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';

                if (!isDoubleElimination) {
                    // É Single Elimination, verificar se é o último round
                    const quantidadeTimes = window.dadosChaveamento?.quantidade_times || window.numTeams || 8;
                    if (quantidadeTimes) {
                        let bracketSize = 1;
                        while (bracketSize < quantidadeTimes) bracketSize *= 2;
                        const totalRounds = Math.log2(bracketSize);
                        const matchParts = partida.match_id.split('_');
                        const roundNum = parseInt(matchParts[1]) || 0;
                        isFinalSingleElimPartida = (roundNum === totalRounds);
                    }
                }
            }

            const isFinalPartida = isGrandFinalPartida || isFinalSingleElimPartida;

            if (winner1El) {
                if (time1Venceu) {
                    winner1El.textContent = isFinalPartida ? '🏆' : '✅';
                    winner1El.style.display = 'inline';
                    // Se for a final (Double ou Single Elimination), adicionar classe de efeito no slot inteiro do vencedor
                    if (isFinalPartida) {
                        time1Row.classList.add('winner-final-slot');
                        time1Row.classList.remove('loser-slot');
                        if (time1NomeEl) {
                            time1NomeEl.classList.add('winner-final-name');
                            time1NomeEl.classList.remove('loser-name');
                        }
                    }
                } else {
                    winner1El.style.display = 'none';
                }
            }
            if (winner2El) {
                if (time2Venceu) {
                    winner2El.textContent = isFinalPartida ? '🏆' : '✅';
                    winner2El.style.display = 'inline';
                    // Se for a final (Double ou Single Elimination), adicionar classe de efeito no slot inteiro do vencedor
                    if (isFinalPartida) {
                        time2Row.classList.add('winner-final-slot');
                        time2Row.classList.remove('loser-slot');
                        if (time2NomeEl) {
                            time2NomeEl.classList.add('winner-final-name');
                            time2NomeEl.classList.remove('loser-name');
                        }
                    }
                } else {
                    winner2El.style.display = 'none';
                }
            }

            // Determinar se é a Final do Lower Bracket baseado na quantidade de times
            // IMPORTANTE: Verificar APENAS pelo match_id para evitar falsos positivos
            // Para 6 times: lower_4_1, para 10 e 12 times: lower_5_1, para 14 times: lower_6_1, para 8+ times (exceto 6, 10, 12, 14): lower_4_1
            const quantidadeTimes = window.dadosChaveamento?.quantidade_times || window.numTeams || 8;

            let isLowerFinal = false;
            if (quantidadeTimes === 6) {
                isLowerFinal = partida.match_id === 'lower_4_1';
            } else if (quantidadeTimes === 10 || quantidadeTimes === 12) {
                isLowerFinal = partida.match_id === 'lower_5_1';
            } else if (quantidadeTimes === 14) {
                isLowerFinal = partida.match_id === 'lower_6_1';
            } else if (quantidadeTimes === 16) {
                isLowerFinal = partida.match_id === 'lower_6_1';
            } else if (quantidadeTimes === 18) {
                isLowerFinal = partida.match_id === 'lower_6_1';
            } else {
                isLowerFinal = partida.match_id === 'lower_4_1';
            }

            // Se for a final do Lower Bracket, mostrar emoji ⬆️ para o vencedor
            if (partida.bracket_type === 'lower' && isLowerFinal) {
                // Time 1 vencedor
                if (time1Venceu) {
                    let upperIndicator1 = time1Row.querySelector('.upper-indicator');
                    if (!upperIndicator1 && time1NomeEl) {
                        upperIndicator1 = document.createElement('span');
                        upperIndicator1.className = 'upper-indicator';
                        upperIndicator1.style.marginLeft = '8px';
                        upperIndicator1.style.fontSize = '1rem';
                        time1NomeEl.appendChild(upperIndicator1);
                    }
                    if (upperIndicator1) {
                        upperIndicator1.textContent = '⬆️';
                        upperIndicator1.style.display = 'inline';
                    }
                } else {
                    const upperIndicator1 = time1Row.querySelector('.upper-indicator');
                    if (upperIndicator1) {
                        upperIndicator1.style.display = 'none';
                    }
                }

                // Time 2 vencedor
                if (time2Venceu) {
                    let upperIndicator2 = time2Row.querySelector('.upper-indicator');
                    if (!upperIndicator2 && time2NomeEl) {
                        upperIndicator2 = document.createElement('span');
                        upperIndicator2.className = 'upper-indicator';
                        upperIndicator2.style.marginLeft = '8px';
                        upperIndicator2.style.fontSize = '1rem';
                        time2NomeEl.appendChild(upperIndicator2);
                    }
                    if (upperIndicator2) {
                        upperIndicator2.textContent = '⬆️';
                        upperIndicator2.style.display = 'inline';
                    }
                } else {
                    const upperIndicator2 = time2Row.querySelector('.upper-indicator');
                    if (upperIndicator2) {
                        upperIndicator2.style.display = 'none';
                    }
                }
            } else {
                // IMPORTANTE: Esconder indicador de Upper se não for a final do Lower
                // Isso garante que o emoji não apareça em rounds intermediários
                const upperIndicator1 = time1Row.querySelector('.upper-indicator');
                const upperIndicator2 = time2Row.querySelector('.upper-indicator');
                if (upperIndicator1) {
                    upperIndicator1.style.display = 'none';
                }
                if (upperIndicator2) {
                    upperIndicator2.style.display = 'none';
                }
            }

            // Criar ou obter indicador de perdedor (❌)
            let loserIndicator1 = time1Row.querySelector('.loser-indicator');
            if (!loserIndicator1 && time1NomeEl) {
                loserIndicator1 = document.createElement('span');
                loserIndicator1.className = 'loser-indicator';
                loserIndicator1.style.marginLeft = '8px';
                loserIndicator1.style.fontSize = '1rem';
                time1NomeEl.appendChild(loserIndicator1);
            }

            let loserIndicator2 = time2Row.querySelector('.loser-indicator');
            if (!loserIndicator2 && time2NomeEl) {
                loserIndicator2 = document.createElement('span');
                loserIndicator2.className = 'loser-indicator';
                loserIndicator2.style.marginLeft = '8px';
                loserIndicator2.style.fontSize = '1rem';
                time2NomeEl.appendChild(loserIndicator2);
            }

            // Mostrar emoji ❌ para perdedor no Lower Bracket ou na final do Winner's Bracket
            const isLowerBracketPartida = partida.bracket_type === 'lower';

            if (loserIndicator1) {
                if (!time1Venceu && (isLowerBracketPartida || isGrandFinalPartida)) {
                    // No Lower Bracket ou na final do Winner's Bracket, mostrar ❌ para perdedor
                    loserIndicator1.textContent = '❌';
                    loserIndicator1.style.display = 'inline';
                    // Adicionar classe para texto riscado no nome do perdedor
                    if (time1NomeEl) {
                        time1NomeEl.classList.add('loser-name');
                        time1NomeEl.classList.remove('winner-final-name');
                    }
                } else {
                    // No resto do Upper Bracket ou se venceu, não mostrar ❌
                    loserIndicator1.style.display = 'none';
                    // Remover classe de perdedor se não for perdedor
                    if (time1NomeEl && !isLowerBracketPartida && !isGrandFinalPartida) {
                        time1NomeEl.classList.remove('loser-name');
                    }
                }
            }
            if (loserIndicator2) {
                if (!time2Venceu && (isLowerBracketPartida || isGrandFinalPartida)) {
                    // No Lower Bracket ou na final do Winner's Bracket, mostrar ❌ para perdedor
                    loserIndicator2.textContent = '❌';
                    loserIndicator2.style.display = 'inline';
                    // Adicionar classe para texto riscado no nome do perdedor
                    if (time2NomeEl) {
                        time2NomeEl.classList.add('loser-name');
                        time2NomeEl.classList.remove('winner-final-name');
                    }
                } else {
                    // No resto do Upper Bracket ou se venceu, não mostrar ❌
                    loserIndicator2.style.display = 'none';
                    // Remover classe de perdedor se não for perdedor
                    if (time2NomeEl && !isLowerBracketPartida && !isGrandFinalPartida) {
                        time2NomeEl.classList.remove('loser-name');
                    }
                }
            }

            // Atualizar background dos times
            if (time1Venceu) {
                time1Row.style.background = 'rgba(0, 212, 255, 0.15)';
            } else {
                time1Row.style.background = 'rgba(255,255,255,0.04)';
            }
            if (time2Venceu) {
                time2Row.style.background = 'rgba(0, 212, 255, 0.15)';
            } else {
                time2Row.style.background = 'rgba(255,255,255,0.04)';
            }

            // Verificar se é Single Elimination
            const lowerBracketAreaCheck = document.getElementById('lowerBracketArea');
            const isDoubleEliminationCheck = lowerBracketAreaCheck && lowerBracketAreaCheck.style.display !== 'none';

            // Se perdeu no Upper Bracket (mas não na final), mostrar indicador
            if (partida.bracket_type === 'upper' && !isFinalPartida) {
                // Determinar qual emoji usar baseado no formato
                const emojiPerdedor = isDoubleEliminationCheck ? '🔻' : '❌';

                if (lowerIndicator1) {
                    lowerIndicator1.textContent = emojiPerdedor;
                    lowerIndicator1.style.display = !time1Venceu ? 'inline' : 'none';
                } else if (!time1Venceu && time1NomeEl) {
                    const lowerInd = document.createElement('span');
                    lowerInd.className = 'lower-indicator';
                    lowerInd.textContent = emojiPerdedor;
                    lowerInd.style.marginLeft = '8px';
                    lowerInd.style.fontSize = '1rem';
                    time1NomeEl.appendChild(lowerInd);
                }
                if (lowerIndicator2) {
                    lowerIndicator2.textContent = emojiPerdedor;
                    lowerIndicator2.style.display = !time2Venceu ? 'inline' : 'none';
                } else if (!time2Venceu && time2NomeEl) {
                    const lowerInd = document.createElement('span');
                    lowerInd.className = 'lower-indicator';
                    lowerInd.textContent = emojiPerdedor;
                    lowerInd.style.marginLeft = '8px';
                    lowerInd.style.fontSize = '1rem';
                    time2NomeEl.appendChild(lowerInd);
                }
            } else {
                // Se for Lower Bracket ou for a final, esconder indicador
                if (lowerIndicator1) lowerIndicator1.style.display = 'none';
                if (lowerIndicator2) lowerIndicator2.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar card de partida:', error);
    }
}

// Função para adicionar time eliminado à classificação final
async function adicionarTimeEliminadoAClassificacao(matchId, timePerdedorId, time1Nome, time2Nome, winner) {
    try {
        // Calcular o round de eliminação
        const matchParts = matchId.split('_');
        const roundNum = parseInt(matchParts[1]) || 1;
        debugChaveamentoEtapa('classificacao-eliminado-start', {
            matchId,
            roundNum,
            timePerdedorId,
            time1Nome,
            time2Nome,
            winner
        });
        
        // Buscar informações do time perdedor
        const timePerdedor = await buscarTimePorId(timePerdedorId);
        if (!timePerdedor) {
            console.warn('Time perdedor não encontrado:', timePerdedorId);
            return;
        }
        
        // Em vez de tentar calcular posições exatas por round (3º-4º, 5º-8º etc),
        // vamos usar uma lógica sequencial simples:
        // - Primeiro time eliminado recebe a pior colocação (nº de times)
        // - Próximo eliminado recebe a posição imediatamente acima, e assim por diante
        // - Nunca atribuir posição 1 (reservada para o campeão)
        const numTeams = window.numTeams || 16;

        // Estado global por campeonato para não perder o controle entre chamadas
        const campeonatoId = obterCampeonatoIdContextual() || 'manual';
        if (!window.__classificacaoEliminacaoEstado) {
            window.__classificacaoEliminacaoEstado = {};
        }
        if (!window.__classificacaoEliminacaoEstado[campeonatoId]) {
            window.__classificacaoEliminacaoEstado[campeonatoId] = {
                totalTeams: numTeams,
                proximaPosicao: numTeams,
                posicoesPorTime: {}
            };
        }

        const estado = window.__classificacaoEliminacaoEstado[campeonatoId];

        // Se o time já tiver posição, reutilizar (evita duplicatas estranhas)
        let position = estado.posicoesPorTime[timePerdedorId];
        if (!position) {
            position = estado.proximaPosicao;
            // Nunca permitir posição 1 (campeão)
            if (position <= 1) {
                position = 2;
            }
            estado.posicoesPorTime[timePerdedorId] = position;
            // Próxima posição sobe um degrau, mas nunca abaixo de 2
            estado.proximaPosicao = Math.max(2, position - 1);
        }

        debugChaveamentoEtapa('classificacao-eliminado-posicao-definida', {
            campeonatoId,
            numTeams,
            position,
            proximaPosicao: estado.proximaPosicao
        });
        
        // Exibir a classificação final se estiver escondida
        const finalStandingsContainer = document.getElementById('finalStandingsContainer');
        if (finalStandingsContainer) {
            finalStandingsContainer.style.display = 'flex';
        }
        
        // Buscar ou criar o card na posição correta
        const grid = document.querySelector('.final-standings-grid');
        if (!grid) {
            console.warn('Grid de classificação final não encontrado');
            return;
        }
        
        // Verificar se já existe um card para este time (evitar duplicatas)
        let card = grid.querySelector(`[data-time-id="${timePerdedorId}"]`);
        
        // IMPORTANTE:
        // Não reutilizar cards pela posição para campeões/topo (1º e 2º),
        // para não sobrescrever os cards especiais de campeão/vice.
        // Apenas para posições 3 em diante podemos considerar reaproveitar posição.
        if (!card && position > 2) {
            card = grid.querySelector(`[data-position="${position}"]`);
        }

        debugChaveamentoEtapa('classificacao-eliminado-card-encontrado', {
            jaTinhaCard: Boolean(card),
            position,
            timePerdedorId
        });
        
        if (!card) {
            // Criar novo card
            card = document.createElement('div');
            card.className = 'standing-card';
            card.setAttribute('data-position', position);
            card.setAttribute('data-time-id', timePerdedorId);
            
            // Aplicar classes baseadas na posição
            if (position === 1) {
                card.classList.add('standing-1st', 'standing-card-furia');
            } else if (position === 2) {
                card.classList.add('standing-2nd');
            } else if (position >= 3 && position <= 4) {
                card.classList.add('standing-3rd-4th');
                if (position === 4) card.classList.add('standing-3rd-4th-pain');
            } else if (position >= 5 && position <= 6) {
                card.classList.add('standing-5th-6th');
                if (position === 5) card.classList.add('standing-5th-6th-spirit');
                if (position === 6) card.classList.add('standing-5th-6th-passion');
            } else {
                card.classList.add('standing-7th-8th');
                if (position === 7) card.classList.add('standing-7th-8th-tyloo');
                if (position === 8) card.classList.add('standing-7th-8th-last');
            }
            
            // Criar conteúdo do card
            const rankText = position === 1 ? '1st' : 
                            position === 2 ? '2nd' : 
                            position === 3 ? '3rd' : 
                            position === 4 ? '4th' : 
                            position === 5 ? '5th' : 
                            position === 6 ? '6th' : 
                            position === 7 ? '7th' : 
                            position === 8 ? '8th' : 
                            `${position}th`;
            
            const logoUrl = timePerdedor.logo || timePerdedor.avatar_time_url || '../img/legalize.png';
            
            card.innerHTML = `
                <div class='standing-team-logo-bg' style="background-image: url('${logoUrl}')"></div>
                <div class='standing-content'>
                    <div class='standing-team-name'>${timePerdedor.nome}</div>
                    <div class='standing-rank'>${rankText}</div>
                    <div class='standing-prize'></div>
                    <button type='button' class='standing-toggle-btn'>Ver Integrantes</button>
                    <div class='standing-members'>
                        <div class='standing-members-title'>Line-up</div>
                        <div class='standing-members-grid'>
                            <!-- Integrantes serão adicionados depois -->
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar event listener ao botão de toggle
            const toggleBtn = card.querySelector('.standing-toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const expanded = card.classList.toggle('expanded');
                    toggleBtn.textContent = expanded ? 'Esconder Integrantes' : 'Ver Integrantes';
                });
            }
            
            // Inserir o card no final, para manter campeões e posições altas primeiro
            grid.appendChild(card);

            // Buscar e renderizar membros do time
            const membersGrid = card.querySelector('.standing-members-grid');
            if (membersGrid) {
                const membros = await buscarMembrosDoTime(timePerdedorId);
                renderizarMembrosNoCard(membersGrid, membros);
            }

            debugChaveamentoEtapa('classificacao-eliminado-card-criado', {
                position,
                timePerdedorId,
                nome: timePerdedor.nome
            });
        } else {
            // Atualizar card existente
            const teamNameEl = card.querySelector('.standing-team-name');
            const rankEl = card.querySelector('.standing-rank');
            const logoBg = card.querySelector('.standing-team-logo-bg');
            
            if (teamNameEl) teamNameEl.textContent = timePerdedor.nome;
            if (rankEl) {
                const rankText = position === 1 ? '1st' : 
                                position === 2 ? '2nd' : 
                                position === 3 ? '3rd' : 
                                position === 4 ? '4th' : 
                                position === 5 ? '5th' : 
                                position === 6 ? '6th' : 
                                position === 7 ? '7th' : 
                                position === 8 ? '8th' : 
                                `${position}th`;
                rankEl.textContent = rankText;
            }
            if (logoBg) {
                const logoUrl = timePerdedor.logo || timePerdedor.avatar_time_url || '../img/legalize.png';
                logoBg.style.backgroundImage = `url('${logoUrl}')`;
            }
            
            // Buscar e renderizar membros do time
            const membersGrid = card.querySelector('.standing-members-grid');
            if (membersGrid) {
                const membros = await buscarMembrosDoTime(timePerdedorId);
                renderizarMembrosNoCard(membersGrid, membros);
            }
            
            card.setAttribute('data-time-id', timePerdedorId);
            card.setAttribute('data-position', position);

            debugChaveamentoEtapa('classificacao-eliminado-card-atualizado', {
                position,
                timePerdedorId,
                nome: timePerdedor.nome
            });
        }
        
    } catch (error) {
        console.error('Erro ao adicionar time eliminado à classificação:', error);
    }
}

// Garantir que os slots de medalha e troféu estejam sempre visíveis no card do 1º lugar
async function garantirSlotsPremiacaoVisiveis() {
    const card1st = document.querySelector('.standing-card[data-position="1"]');
    if (!card1st) return;
    
    let rewardsContainer = card1st.querySelector('.standing-rewards-container');
    let medalSlot = card1st.querySelector('.standing-medal-slot');
    let trophySlot = card1st.querySelector('.standing-trophy-slot');
    
    // Se não existir o container de recompensas, criar
    if (!rewardsContainer) {
        const prizeEl = card1st.querySelector('.standing-prize');
        if (prizeEl) {
            rewardsContainer = document.createElement('div');
            rewardsContainer.className = 'standing-rewards-container';
            
            // Criar slots dentro do container
            medalSlot = document.createElement('div');
            medalSlot.className = 'standing-medal-slot';
            trophySlot = document.createElement('div');
            trophySlot.className = 'standing-trophy-slot';
            
            rewardsContainer.appendChild(medalSlot);
            rewardsContainer.appendChild(trophySlot);
            prizeEl.parentNode.insertBefore(rewardsContainer, prizeEl.nextSibling);
        }
    } else {
        // Se o container existe, garantir que os slots existam
        if (!medalSlot) {
            medalSlot = document.createElement('div');
            medalSlot.className = 'standing-medal-slot';
            rewardsContainer.appendChild(medalSlot);
        }
        if (!trophySlot) {
            trophySlot = document.createElement('div');
            trophySlot.className = 'standing-trophy-slot';
            rewardsContainer.appendChild(trophySlot);
        }
    }
    
    // Garantir que os slots estejam visíveis
    if (medalSlot) {
        medalSlot.style.display = 'block';
    }
    if (trophySlot) {
        trophySlot.style.display = 'block';
    }
    if (rewardsContainer) {
        rewardsContainer.style.display = 'flex';
    }
    
    // Carregar imagens de medalha e troféu mesmo sem campeão
    const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
    
    if (campeonato) {
        const { medalhaId, trofeuId } = extrairIdsPremiacao(campeonato);
        
        // Carregar medalha para o 1º lugar
        if (medalSlot && medalhaId) {
            try {
                const medalhaData = await buscarDadosMedalha(medalhaId);
                if (medalhaData && medalhaData.imagem_url_campeao) {
                    medalSlot.innerHTML = `<img src="${medalhaData.imagem_url_campeao}" alt="Medalha" style="width: 100%; height: 100%; object-fit: contain;">`;
                }
            } catch (error) {
                console.error('Erro ao carregar medalha:', error);
            }
        }
        
        // Carregar troféu para o 1º lugar
        if (trophySlot && trofeuId) {
            try {
                const trofeuData = await buscarDadosTrofeu(trofeuId);
                if (trofeuData && trofeuData.imagem_url) {
                    trophySlot.innerHTML = `<img src="${trofeuData.imagem_url}" alt="Troféu" style="width: 100%; height: 100%; object-fit: contain;">`;
                }
            } catch (error) {
                console.error('Erro ao carregar troféu:', error);
            }
        }
    }
}

// Atualiza um card de classificação para uma posição específica (ex.: 2º lugar / vice-campeão)
async function atualizarCardClassificacaoPosicao(position, timeId) {
    try {
        if (!position || !timeId) return;

        const time = await buscarTimePorId(timeId);
        if (!time) return;

        const grid = document.querySelector('.final-standings-grid');
        if (!grid) return;

        let card = grid.querySelector(`.standing-card[data-position="${position}"]`);

        // Se não existir card para esta posição, criar um básico
        if (!card) {
            card = document.createElement('div');
            card.className = 'standing-card';
            card.setAttribute('data-position', String(position));

            // Aplicar classes básicas por posição
            if (position === 1) {
                card.classList.add('standing-1st');
            } else if (position === 2) {
                card.classList.add('standing-2nd');
            } else if (position === 3 || position === 4) {
                card.classList.add('standing-3rd-4th');
            } else if (position === 5 || position === 6) {
                card.classList.add('standing-5th-6th');
            } else {
                card.classList.add('standing-7th-8th');
            }

            const rankText = position === 1 ? '1st' :
                position === 2 ? '2nd' :
                position === 3 ? '3rd' :
                position === 4 ? '4th' :
                position === 5 ? '5th' :
                position === 6 ? '6th' :
                position === 7 ? '7th' :
                position === 8 ? '8th' :
                `${position}th`;

            card.innerHTML = `
                <div class="standing-team-logo-bg"></div>
                <div class="standing-content">
                  <div class="standing-team-name"></div>
                  <div class="standing-rank">${rankText}</div>
                  <div class="standing-prize">$0</div>
                  ${position === 1 ? '<div class="standing-rewards-container"><div class="standing-medal-slot"></div><div class="standing-trophy-slot"></div></div>' : ''}
                  ${position === 2 ? '<div class="standing-medal-slot"></div>' : ''}
                  <button type="button" class="standing-toggle-btn">Ver Integrantes</button>
                  <div class="standing-members">
                    <div class="standing-members-title">Line-up</div>
                    <div class="standing-members-grid"></div>
                  </div>
                </div>
            `;

            grid.appendChild(card);
        }

        const logoBg = card.querySelector('.standing-team-logo-bg');
        const nameEl = card.querySelector('.standing-team-name');
        const prizeEl = card.querySelector('.standing-prize');
        let rewardsContainer = card.querySelector('.standing-rewards-container');
        let medalSlot = card.querySelector('.standing-medal-slot');
        let trophySlot = card.querySelector('.standing-trophy-slot');
        const membersGrid = card.querySelector('.standing-members-grid');
        
        // Para o 1º lugar: criar container de recompensas se não existir
        if (position === 1 && !rewardsContainer && prizeEl) {
            rewardsContainer = document.createElement('div');
            rewardsContainer.className = 'standing-rewards-container';
            
            // Criar slots dentro do container
            medalSlot = document.createElement('div');
            medalSlot.className = 'standing-medal-slot';
            trophySlot = document.createElement('div');
            trophySlot.className = 'standing-trophy-slot';
            
            rewardsContainer.appendChild(medalSlot);
            rewardsContainer.appendChild(trophySlot);
            prizeEl.parentNode.insertBefore(rewardsContainer, prizeEl.nextSibling);
        } else if (position === 1 && rewardsContainer) {
            // Se o container existe, buscar os slots dentro dele
            medalSlot = rewardsContainer.querySelector('.standing-medal-slot');
            trophySlot = rewardsContainer.querySelector('.standing-trophy-slot');
            
            // Se não existirem, criar
            if (!medalSlot) {
                medalSlot = document.createElement('div');
                medalSlot.className = 'standing-medal-slot';
                rewardsContainer.appendChild(medalSlot);
            }
            if (!trophySlot) {
                trophySlot = document.createElement('div');
                trophySlot.className = 'standing-trophy-slot';
                rewardsContainer.appendChild(trophySlot);
            }
        }
        
        // Para o 2º lugar: criar slot de medalha se não existir
        if (position === 2 && !medalSlot && prizeEl) {
            medalSlot = document.createElement('div');
            medalSlot.className = 'standing-medal-slot';
            prizeEl.parentNode.insertBefore(medalSlot, prizeEl.nextSibling);
        }

        const logoUrl = time.logo || time.avatar_time_url || '../img/legalize.png';
        if (logoBg) {
            logoBg.style.backgroundImage = `url('${logoUrl}')`;
        }
        if (nameEl) {
            nameEl.textContent = time.nome;
        }

        // Atualizar valor do prêmio apenas para o 1º lugar
        if (position === 1 && prizeEl) {
            const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
            if (campeonato && campeonato.premiacao) {
                // Formatar o valor no formato $125,000
                const valorFormatado = formatarPremiacao(campeonato.premiacao);
                prizeEl.textContent = valorFormatado;
            }
        }

        // Buscar e exibir imagem da medalha para 1º e 2º lugar
        if ((position === 1 || position === 2) && medalSlot) {
            const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
            const { medalhaId } = extrairIdsPremiacao(campeonato);
            
            if (medalhaId) {
                const medalhaData = await buscarDadosMedalha(medalhaId);
                if (medalhaData) {
                    let imagemUrl = '';
                    if (position === 1) {
                        imagemUrl = medalhaData.imagem_url_campeao || '';
                    } else if (position === 2) {
                        imagemUrl = medalhaData.imagem_url_segundo || '';
                    }
                    
                    if (imagemUrl) {
                        medalSlot.innerHTML = `<img src="${imagemUrl}" alt="Medalha" style="width: 100%; height: 100%; object-fit: contain;">`;
                    }
                }
            }
        }

        // Buscar e exibir imagem do troféu apenas para o 1º lugar
        if (position === 1 && trophySlot) {
            const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
            const { trofeuId } = extrairIdsPremiacao(campeonato);
            
            if (trofeuId) {
                const trofeuData = await buscarDadosTrofeu(trofeuId);
                if (trofeuData && trofeuData.imagem_url) {
                    trophySlot.innerHTML = `<img src="${trofeuData.imagem_url}" alt="Troféu" style="width: 100%; height: 100%; object-fit: contain;">`;
                }
            }
        }

        // Buscar e renderizar membros do time
        if (membersGrid) {
            const membros = await buscarMembrosDoTime(timeId);
            renderizarMembrosNoCard(membersGrid, membros);
        }

        card.setAttribute('data-time-id', String(timeId));
    } catch (error) {
        console.error('Erro ao atualizar card de classificação por posição:', error);
    }
}

// Função para renderizar membros dentro do card da classificação
function renderizarMembrosNoCard(membersGrid, membros) {
    if (!membersGrid) return;

    membersGrid.innerHTML = '';

    const DEFAULT_AVATAR = 'https://i.ibb.co/rK6q2vqb/mix.png';

    // Se não houver membros registrados, mostrar um placeholder padrão
    if (!membros || membros.length === 0) {
        membros = [{
            usuario_id: null,
            username: '---',
            avatar_url: DEFAULT_AVATAR,
            posicao: '---'
        }];
    }

    membros.forEach(membro => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.style.cursor = 'pointer';

        const avatarUrl = membro.avatar_url || DEFAULT_AVATAR;
        const username = membro.username || '---';
        const posicao = membro.posicao || '---';
        const usuarioId = membro.usuario_id;

        // Buscar ícone da posição
        let positionIconHtml = '';
        if (posicao) {
            const positionIconUrl = getPositionImageSync(posicao);
            positionIconHtml = `<img class="player-position-icon" src="${positionIconUrl}" alt="${posicao}" title="${posicao.toUpperCase()}">`;
        }

        playerCard.innerHTML = `
            <div class="player-logo" style="background-image: url('${avatarUrl}')">
                ${positionIconHtml}
            </div>
            <span>${username}</span>
        `;

        // Adicionar evento de clique para redirecionar ao perfil
        if (usuarioId) {
            playerCard.addEventListener('click', () => {
                window.location.href = `perfil.html?id=${usuarioId}`;
            });
        }

        membersGrid.appendChild(playerCard);
    });
}

// Função para atualizar classificação final com todas as partidas finalizadas
async function atualizarClassificacaoFinalComPartidas(partidas) {
    try {
        if (!partidas || !Array.isArray(partidas)) return;
        
        const formatSelect = document.getElementById('formatSelect');
        const currentFormat = formatSelect ? formatSelect.value : 'single_b01';
        const isSingleElimination = currentFormat === 'single_b01' || currentFormat === 'single_bo3_all';
        
        if (!isSingleElimination) return;
        
        // Processar todas as partidas finalizadas (exceto a final)
        for (const partida of partidas) {
            if (!partida.match_id || !partida.status || partida.status !== 'finalizada') continue;
            if (!partida.time_vencedor_id || !partida.time1_id || !partida.time2_id) continue;
            
            // Verificar se é a final
            const lowerBracketArea = document.getElementById('lowerBracketArea');
            const isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';
            
            if (!isDoubleElimination) {
                // Calcular se é a final
                let isFinal = false;
                if (window.numTeams) {
                    let bracketSize = 1;
                    while (bracketSize < window.numTeams) bracketSize *= 2;
                    const totalRounds = Math.log2(bracketSize);
                    const matchParts = partida.match_id.split('_');
                    const roundNum = parseInt(matchParts[1]) || 0;
                    isFinal = (roundNum === totalRounds);
                }
                
                // Se não for a final, adicionar o perdedor à classificação
                if (!isFinal) {
                    const timePerdedorId = partida.time_vencedor_id == partida.time1_id ? partida.time2_id : partida.time1_id;
                    
                    // Buscar nomes dos times
                    const time1 = await buscarTimePorId(partida.time1_id);
                    const time2 = await buscarTimePorId(partida.time2_id);
                    const time1Nome = time1 ? time1.nome : '';
                    const time2Nome = time2 ? time2.nome : '';
                    const winner = partida.time_vencedor_id == partida.time1_id ? 1 : 2;
                    
                    await adicionarTimeEliminadoAClassificacao(partida.match_id, timePerdedorId, time1Nome, time2Nome, winner);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar classificação final com partidas:', error);
    }
}

// Função para atualizar o bracket com dados do banco
async function atualizarBracketComDadosDoBanco(dadosChaveamento) {
    try {
        // IMPORTANTE: Definir window.dadosChaveamento para uso em outras funções
        window.dadosChaveamento = dadosChaveamento;
        sincronizarFlagResultadosComDados(dadosChaveamento?.partidas);

        // IMPORTANTE: Também definir window.numTeams se quantidade_times estiver disponível
        // O backend retorna quantidade_times dentro de chaveamento
        if (dadosChaveamento) {
            const quantidadeTimes = dadosChaveamento.chaveamento?.quantidade_times ||
                dadosChaveamento.quantidade_times ||
                window.numTeams;
            if (quantidadeTimes) {
                window.numTeams = quantidadeTimes;
                // Garantir que dadosChaveamento.quantidade_times esteja definido para uso fácil
                if (!dadosChaveamento.quantidade_times) {
                    dadosChaveamento.quantidade_times = quantidadeTimes;
                }

                // Sincronizar os controles de UI com o valor vindo do backend
                const selectEl = window.teamCountSelect || document.getElementById('teamCountSelect');
                if (selectEl && String(selectEl.value) !== String(quantidadeTimes)) {
                    selectEl.value = String(quantidadeTimes);
                }

                // Re-renderizar o bracket usando a quantidade real de times vinda do backend
                const formatSelectEl = window.formatSelectRef || document.getElementById('formatSelect');
                const formatoAtual = formatSelectEl ? (formatSelectEl.value || 'single_b01') : 'single_b01';
                if (typeof renderBracket === 'function') {
                    renderBracket(quantidadeTimes, formatoAtual);
                }
            }
        }

        if (!dadosChaveamento || !dadosChaveamento.partidas) return;

        const partidas = dadosChaveamento.partidas || [];

        // Atualizar todas as partidas (com ou sem resultado)
        for (const partida of partidas) {
            if (!partida.match_id) continue;

            // DEBUG: Log para partidas do Round 2 (Pré-Oitavas) em chaves de 18 times
            const matchBox = document.querySelector(`[data-match-id="${partida.match_id}"]`);
            if (!matchBox) {
                continue;
            }

            // Atualizar o card com os dados da partida
            await atualizarCardPartida(matchBox, partida);
        }

        // Atualizar champion-box se houver vencedor da final
        await atualizarChampionBox(dadosChaveamento.partidas);

        // Atualizar carrossel para destacar o vencedor
        if (typeof window.atualizarCarrosselComVencedor === 'function') {
            await window.atualizarCarrosselComVencedor();
        }

        // Atualizar classificação final com times eliminados (apenas Single Elimination)
        const formatSelect = document.getElementById('formatSelect');
        const currentFormat = formatSelect ? formatSelect.value : 'single_b01';
        const isSingleElimination = currentFormat === 'single_b01' || currentFormat === 'single_bo3_all';
        
        if (isSingleElimination) {
            await atualizarClassificacaoFinalComPartidas(partidas);
        }

        atualizarDisponibilidadeBotaoEmbaralhar();

    } catch (error) {
        console.error('Erro ao atualizar bracket com dados do banco:', error);
    }
}

// Função para atualizar a champion-box com o vencedor da final
async function atualizarChampionBox(partidas) {
    try {
        logChampionDebug('update-start', { 
            partidas: Array.isArray(partidas) ? partidas.length : 0,
            temPartidas: Boolean(partidas && Array.isArray(partidas))
        });
        if (!partidas || !Array.isArray(partidas)) {
            logChampionDebug('sem-partidas');
            // Tentar usar card de classificação como último recurso
            const primeiraPosicaoCard = document.querySelector('.standing-card[data-position="1"]');
            if (primeiraPosicaoCard) {
                const nameEl = primeiraPosicaoCard.querySelector('.standing-team-name');
                const logoBg = primeiraPosicaoCard.querySelector('.standing-team-logo-bg');
                if (nameEl?.textContent && nameEl.textContent.trim() !== '----' && nameEl.textContent.trim() !== 'Time 1') {
                    logChampionDebug('usando-card-classificacao-sem-partidas', {
                        nome: nameEl.textContent.trim()
                    });
                    const championBox = document.querySelector('.champion-box');
                    if (championBox) {
                        const championLogo = championBox.querySelector('.champion-logo');
                        const championName = championBox.querySelector('.champion-name');
                        if (championName) championName.textContent = nameEl.textContent.trim();
                        if (logoBg && championLogo) {
                            const bgStyle = window.getComputedStyle ? getComputedStyle(logoBg).backgroundImage : logoBg.style.backgroundImage;
                            if (bgStyle && bgStyle.includes('url')) {
                                const match = bgStyle.match(/url\\(["']?(.*?)["']?\\)/);
                                if (match && match[1]) {
                                    championLogo.src = match[1];
                                }
                            }
                        }
                    }
                }
            }
            return;
        }

        logChampionDebug('partidas-recebidas', {
            total: partidas.length,
            matchIds: partidas.map(p => p.match_id).slice(0, 5),
            comVencedor: partidas.filter(p => p.time_vencedor_id).length
        });

        // Buscar a partida da final (grand_final_1 para Double Elimination ou upper_X_1 para Single Elimination)
        // Primeiro, tentar encontrar com status 'finalizada' e time_vencedor_id
        let partidaFinal = partidas.find(p => p.match_id === 'grand_final_1' && p.status === 'finalizada' && p.time_vencedor_id);
        logChampionDebug('busca-grand-final', { encontrada: Boolean(partidaFinal) });

        // Se não encontrou grand_final, buscar a final do Single Elimination (último round do upper bracket)
        if (!partidaFinal) {
            const upperPartidas = partidas.filter(p => p.match_id && p.match_id.startsWith('upper_'));
            logChampionDebug('busca-upper-bracket', {
                upperPartidas: upperPartidas.length,
                matchIds: upperPartidas.map(p => p.match_id).slice(0, 5)
            });

            if (upperPartidas.length > 0) {
                // Encontrar o último round
                const rounds = upperPartidas.map(p => {
                    const parts = p.match_id.split('_');
                    return parseInt(parts[1]) || 0;
                });
                const ultimoRound = Math.max(...rounds);
                logChampionDebug('ultimo-round-calculado', {
                    ultimoRound,
                    rounds: rounds.slice(0, 5)
                });

                // Buscar a partida final do último round (sempre match 1)
                // Primeiro tentar com status 'finalizada' e time_vencedor_id
                partidaFinal = partidas.find(p =>
                    p.match_id === `upper_${ultimoRound}_1` &&
                    p.status === 'finalizada' &&
                    p.time_vencedor_id
                );
                logChampionDebug('busca-final-round-status', {
                    matchId: `upper_${ultimoRound}_1`,
                    encontrada: Boolean(partidaFinal)
                });

                // Se não encontrou, tentar apenas com time_vencedor_id (pode estar com outro status)
                if (!partidaFinal) {
                    partidaFinal = partidas.find(p =>
                        p.match_id === `upper_${ultimoRound}_1` &&
                        p.time_vencedor_id
                    );
                    logChampionDebug('busca-final-round-vencedor', {
                        matchId: `upper_${ultimoRound}_1`,
                        encontrada: Boolean(partidaFinal)
                    });
                }

                // Se ainda não encontrou, tentar encontrar a partida mesmo sem time_vencedor_id
                if (!partidaFinal) {
                    const partidaFinalCandidata = partidas.find(p => p.match_id === `upper_${ultimoRound}_1`);
                    logChampionDebug('busca-final-round-candidata', {
                        matchId: `upper_${ultimoRound}_1`,
                        encontrada: Boolean(partidaFinalCandidata),
                        temTime1: Boolean(partidaFinalCandidata?.time1_id),
                        temTime2: Boolean(partidaFinalCandidata?.time2_id)
                    });
                    
                    if (partidaFinalCandidata) {
                        // Segurança extra: garantir que estamos realmente falando do ÚLTIMO round
                        // com base em window.numTeams. Se não for o último round, não tratar como final.
                        let ehUltimoRound = false;
                        try {
                            const numTeams = window.numTeams || 16;
                            let bracketSize = 1;
                            while (bracketSize < numTeams) bracketSize *= 2;
                            const totalRounds = Math.log2(bracketSize);
                            const partsId = partidaFinalCandidata.match_id.split('_');
                            const roundNum = parseInt(partsId[1]) || 0;
                            ehUltimoRound = (roundNum === totalRounds);
                            logChampionDebug('valida-final-candidata-por-round', {
                                numTeams,
                                bracketSize,
                                totalRounds,
                                roundNum,
                                ehUltimoRound
                            });
                        } catch (e) {
                            // Se algo der errado no cálculo, por segurança NÃO considerar como final
                            ehUltimoRound = false;
                        }

                        if (ehUltimoRound && partidaFinalCandidata.time1_id && !partidaFinalCandidata.time2_id) {
                            // Caso especial: final com apenas um time (walkover, bye, etc.)
                            partidaFinal = {
                                match_id: partidaFinalCandidata.match_id,
                                status: 'finalizada',
                                time_vencedor_id: partidaFinalCandidata.time1_id,
                                time1_id: partidaFinalCandidata.time1_id,
                                time2_id: null
                            };
                            logChampionDebug('final-assumida-time1-unico', {
                                matchId: partidaFinalCandidata.match_id,
                                vencedorId: partidaFinalCandidata.time1_id
                            });
                        } else if (ehUltimoRound) {
                            // Tentar buscar o vencedor diretamente do DOM
                            const matchBox = document.querySelector(`[data-match-id="${partidaFinalCandidata.match_id}"]`);
                            logChampionDebug('buscando-matchbox-dom', {
                                matchId: partidaFinalCandidata.match_id,
                                matchBoxEncontrado: Boolean(matchBox)
                            });
                            
                            if (matchBox) {
                                // Verificar qual time tem a classe de vencedor ou está marcado como vencedor
                                const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
                                const time2Row = matchBox.querySelector('.team-row[data-team="2"]');
                                
                                logChampionDebug('verificando-times-dom', {
                                    time1RowEncontrado: Boolean(time1Row),
                                    time2RowEncontrado: Boolean(time2Row)
                                });
                                
                                let timeVencedorId = null;
                                let vencedorSlot = null;
                                
                                // Verificar se algum time tem indicador de vencedor (✅ ou classe winner)
                                if (time1Row) {
                                    const nameEl = time1Row.querySelector('.team-name');
                                    const nomeTime1 = nameEl?.textContent?.trim() || '';
                                    const temVencedor = nomeTime1.includes('✅') || 
                                                        time1Row.classList.contains('winner') ||
                                                        time1Row.classList.contains('team-winner');
                                    logChampionDebug('verificando-time1', {
                                        nome: nomeTime1,
                                        temVencedor,
                                        temTime1Id: Boolean(partidaFinalCandidata.time1_id)
                                    });
                                    if (temVencedor) {
                                        vencedorSlot = 1;
                                        if (partidaFinalCandidata.time1_id) {
                                            timeVencedorId = partidaFinalCandidata.time1_id;
                                        }
                                    }
                                }
                                
                                if (!vencedorSlot && time2Row) {
                                    const nameEl = time2Row.querySelector('.team-name');
                                    const nomeTime2 = nameEl?.textContent?.trim() || '';
                                    const temVencedor = nomeTime2.includes('✅') || 
                                                        time2Row.classList.contains('winner') ||
                                                        time2Row.classList.contains('team-winner');
                                    logChampionDebug('verificando-time2', {
                                        nome: nomeTime2,
                                        temVencedor,
                                        temTime2Id: Boolean(partidaFinalCandidata.time2_id)
                                    });
                                    if (temVencedor) {
                                        vencedorSlot = 2;
                                        if (partidaFinalCandidata.time2_id) {
                                            timeVencedorId = partidaFinalCandidata.time2_id;
                                        }
                                    }
                                }
                                
                                // Se encontrou vencedor no DOM mas não tem ID, tentar buscar pelo nome
                                if (vencedorSlot && !timeVencedorId) {
                                    const vencedorRow = matchBox.querySelector(`.team-row[data-team="${vencedorSlot}"]`);
                                    if (vencedorRow) {
                                        const nameEl = vencedorRow.querySelector('.team-name');
                                        const nomeLimpo = nameEl?.textContent?.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                                        if (nomeLimpo) {
                                            try {
                                                timeVencedorId = await obterTimeIdPorNome(nomeLimpo);
                                                logChampionDebug('vencedor-id-do-nome', {
                                                    nome: nomeLimpo,
                                                    id: timeVencedorId
                                                });
                                            } catch (e) {
                                                logChampionDebug('erro-buscar-id-nome', { erro: e.message });
                                            }
                                        }
                                    }
                                }
                                
                                if (timeVencedorId) {
                                    partidaFinal = {
                                        match_id: partidaFinalCandidata.match_id,
                                        status: 'finalizada',
                                        time_vencedor_id: timeVencedorId,
                                        time1_id: partidaFinalCandidata.time1_id || null,
                                        time2_id: partidaFinalCandidata.time2_id || null
                                    };
                                    logChampionDebug('final-encontrada-dom', {
                                        matchId: partidaFinalCandidata.match_id,
                                        vencedorId: timeVencedorId,
                                        vencedorSlot
                                    });
                                } else {
                                    logChampionDebug('vencedor-nao-encontrado-dom', {
                                        matchId: partidaFinalCandidata.match_id,
                                        vencedorSlot,
                                        temTime1Id: Boolean(partidaFinalCandidata.time1_id),
                                        temTime2Id: Boolean(partidaFinalCandidata.time2_id)
                                    });
                                }
                            } else {
                                logChampionDebug('matchbox-nao-encontrado', {
                                    matchId: partidaFinalCandidata.match_id
                                });
                            }
                        } else {
                            // Não é último round: não considerar esta partida como final
                            logChampionDebug('candidata-nao-e-ultimo-round', {
                                matchId: partidaFinalCandidata.match_id
                            });
                        }
                    }
                }

                // Se ainda não encontrou, tentar determinar o vencedor pelos times ou pelo resultado salvo (fallback localStorage)
                if (!partidaFinal) {
                    const partidaFinalCandidata = partidas.find(p => p.match_id === `upper_${ultimoRound}_1`);
                    logChampionDebug('tentando-fallback-localstorage', {
                        candidataEncontrada: Boolean(partidaFinalCandidata),
                        matchId: `upper_${ultimoRound}_1`
                    });
                    if (partidaFinalCandidata) {
                        // Tentar buscar o resultado do localStorage como fallback
                        try {
                            const results = obterResultadosLocais();
                            const resultado = results[partidaFinalCandidata.match_id];
                            logChampionDebug('resultado-localstorage', {
                                temResultado: Boolean(resultado),
                                winner: resultado?.winner
                            });

                            if (resultado && resultado.winner) {
                                let timeVencedorId = null;

                                // Se temos os dois times, determinar o vencedor normalmente
                                if (partidaFinalCandidata.time1_id && partidaFinalCandidata.time2_id) {
                                    timeVencedorId = resultado.winner === 1 ? partidaFinalCandidata.time1_id : partidaFinalCandidata.time2_id;
                                }
                                // Se só temos time1_id, usar ele se winner for 1
                                else if (partidaFinalCandidata.time1_id && resultado.winner === 1) {
                                    timeVencedorId = partidaFinalCandidata.time1_id;
                                }
                                // Se só temos time2_id, usar ele se winner for 2
                                else if (partidaFinalCandidata.time2_id && resultado.winner === 2) {
                                    timeVencedorId = partidaFinalCandidata.time2_id;
                                }
                                // Se não temos os times, tentar buscar do match box no DOM
                                else {
                                    const matchBox = document.querySelector(`[data-match-id="${partidaFinalCandidata.match_id}"]`);
                                    if (matchBox) {
                                        const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
                                        const time2Row = matchBox.querySelector('.team-row[data-team="2"]');

                                        if (time1Row && time2Row) {
                                            const time1Nome = time1Row.querySelector('.team-name')?.textContent?.trim();
                                            const time2Nome = time2Row.querySelector('.team-name')?.textContent?.trim();

                                            // Buscar IDs dos times pelo nome
                                            if (time1Nome && time2Nome) {
                                                try {
                                                    const time1Id = await obterTimeIdPorNome(time1Nome.replace(/[✅🔻❌⬆️🏆]/g, '').trim());
                                                    const time2Id = await obterTimeIdPorNome(time2Nome.replace(/[✅🔻❌⬆️🏆]/g, '').trim());

                                                    if (time1Id && time2Id) {
                                                        timeVencedorId = resultado.winner === 1 ? time1Id : time2Id;
                                                    }
                                                } catch (e) {
                                                    // Ignorar erro
                                                }
                                            }
                                        }
                                    }
                                }

                                if (timeVencedorId) {
                                    // Criar um objeto partidaFinal com o vencedor encontrado
                                    partidaFinal = {
                                        match_id: partidaFinalCandidata.match_id,
                                        status: 'finalizada',
                                        time_vencedor_id: timeVencedorId,
                                        time1_id: partidaFinalCandidata.time1_id,
                                        time2_id: partidaFinalCandidata.time2_id
                                    };
                                }
                            }
                        } catch (e) {
                            // Ignorar erro
                        }
                    }
                }
            }
        }

        // Fallback extra: tentar descobrir a final apenas pelos resultados locais
        if (!partidaFinal || !partidaFinal.time_vencedor_id) {
            logChampionDebug('tentando-fallback-localresults', {
                temPartidaFinal: Boolean(partidaFinal),
                temVencedorId: Boolean(partidaFinal?.time_vencedor_id)
            });
            try {
                const resultadosLocais = obterResultadosLocais();
                const matchIds = Object.keys(resultadosLocais || {}).filter(id => id.startsWith('upper_'));
                logChampionDebug('resultados-locais', {
                    total: Object.keys(resultadosLocais || {}).length,
                    upperMatches: matchIds.length,
                    matchIds: matchIds.slice(0, 5)
                });

                if (matchIds.length > 0) {
                    let melhorMatchId = null;
                    let melhorRound = -1;

                    // Calcular o último round esperado com base no número de times
                    const numTeams = window.numTeams || 16;
                    let bracketSize = 1;
                    while (bracketSize < numTeams) bracketSize *= 2;
                    const totalRounds = Math.log2(bracketSize);
                    logChampionDebug('calculo-rounds', {
                        numTeams,
                        bracketSize,
                        totalRounds
                    });

                    // Escolher o match com maior round (ex: upper_5_1)
                    for (const id of matchIds) {
                        const partes = id.split('_');
                        const roundNum = parseInt(partes[1]) || 0;
                        if (roundNum > melhorRound) {
                            melhorRound = roundNum;
                            melhorMatchId = id;
                        }
                    }

                    // Apenas considerar como final se for realmente o último round
                    if (melhorMatchId && melhorRound === totalRounds) {
                        const resultado = resultadosLocais[melhorMatchId];
                        if (resultado && resultado.winner) {
                            const vencedorSlot = resultado.winner; // 1 ou 2
                            const partidaFinalCandidata = partidas.find(p => p.match_id === melhorMatchId) || {};
                            let timeVencedorId = null;

                            // Tentar usar IDs da própria partida se existirem
                            if (partidaFinalCandidata.time1_id || partidaFinalCandidata.time2_id) {
                                if (vencedorSlot === 1 && partidaFinalCandidata.time1_id) {
                                    timeVencedorId = partidaFinalCandidata.time1_id;
                                } else if (vencedorSlot === 2 && partidaFinalCandidata.time2_id) {
                                    timeVencedorId = partidaFinalCandidata.time2_id;
                                }
                            }

                            // Se ainda não temos o ID, tentar buscar pelo DOM + nome do time
                            if (!timeVencedorId) {
                                const matchBox = document.querySelector(`[data-match-id="${melhorMatchId}"]`);
                                if (matchBox) {
                                    const vencedorRow = matchBox.querySelector(`.team-row[data-team="${vencedorSlot}"]`);
                                    if (vencedorRow) {
                                        const nameEl = vencedorRow.querySelector('.team-name');
                                        const nomeLimpo = nameEl?.textContent?.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                                        if (nomeLimpo) {
                                            try {
                                                timeVencedorId = await obterTimeIdPorNome(nomeLimpo);
                                            } catch (e) {
                                                console.error('Erro ao buscar ID do time vencedor pelo nome (fallback champion):', e);
                                            }
                                        }
                                    }
                                }
                            }

                            if (timeVencedorId) {
                                partidaFinal = {
                                    match_id: melhorMatchId,
                                    status: 'finalizada',
                                    time_vencedor_id: timeVencedorId,
                                    time1_id: partidaFinalCandidata.time1_id || null,
                                    time2_id: partidaFinalCandidata.time2_id || null
                                };
                                logChampionDebug('final-localresults', {
                                    matchId: melhorMatchId,
                                    vencedorSlot,
                                    vencedorId: timeVencedorId,
                                    round: melhorRound
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Erro no fallback de resultados locais para champion-box:', e);
            }
        }

        if (!partidaFinal || !partidaFinal.time_vencedor_id) {
            logChampionDebug('final-nao-encontrada', {
                tentouPartidas: true,
                tentouLocalResults: true
            });
            
            // Último recurso: usar card de classificação final
            const primeiraPosicaoCard = document.querySelector('.standing-card[data-position="1"]');
            if (primeiraPosicaoCard) {
                const nameEl = primeiraPosicaoCard.querySelector('.standing-team-name');
                const logoBg = primeiraPosicaoCard.querySelector('.standing-team-logo-bg');
                const timeId = primeiraPosicaoCard.getAttribute('data-time-id');
                
                if (nameEl?.textContent && nameEl.textContent.trim() !== '----' && nameEl.textContent.trim() !== 'Time 1') {
                    logChampionDebug('usando-card-classificacao-ultimo-recurso', {
                        nome: nameEl.textContent.trim(),
                        temLogo: Boolean(logoBg),
                        timeId: timeId || 'não encontrado'
                    });
                    
                    // Se temos o time_id do card, criar uma partidaFinal sintética
                    if (timeId) {
                        partidaFinal = {
                            match_id: `upper_${ultimoRound}_1`,
                            status: 'finalizada',
                            time_vencedor_id: parseInt(timeId),
                            time1_id: null,
                            time2_id: null
                        };
                        logChampionDebug('partida-final-sintetica-criada', {
                            timeVencedorId: timeId
                        });
                        // Continuar o fluxo normal abaixo
                    } else {
                        // Se não temos time_id, apenas atualizar o champion-box e sair
                        const championBox = document.querySelector('.champion-box');
                        if (championBox) {
                            const championLogo = championBox.querySelector('.champion-logo');
                            const championName = championBox.querySelector('.champion-name');
                            if (championName) championName.textContent = nameEl.textContent.trim();
                            if (logoBg && championLogo) {
                                const bgStyle = window.getComputedStyle ? getComputedStyle(logoBg).backgroundImage : logoBg.style.backgroundImage;
                                if (bgStyle && bgStyle.includes('url')) {
                                    const match = bgStyle.match(/url\\(["']?(.*?)["']?\\)/);
                                    if (match && match[1]) {
                                        championLogo.src = match[1];
                                        logChampionDebug('logo-atualizado-do-card', { url: match[1] });
                                    }
                                }
                            }
                        }
                        return; // Sair se não temos time_id
                    }
                } else {
                    logChampionDebug('card-classificacao-nao-utilizavel', {
                        nomeEncontrado: nameEl?.textContent?.trim(),
                        ehPlaceholder: nameEl?.textContent?.trim() === '----' || nameEl?.textContent?.trim() === 'Time 1'
                    });
                }
            } else {
                logChampionDebug('card-classificacao-nao-encontrado');
            }
            
            // Se ainda não temos partidaFinal após todos os fallbacks, sair
            if (!partidaFinal || !partidaFinal.time_vencedor_id) {
            return;
            }
        }

        logChampionDebug('final-encontrada', {
            matchId: partidaFinal.match_id,
            vencedorId: partidaFinal.time_vencedor_id,
            status: partidaFinal.status
        });

        // Buscar informações do time vencedor (com fallback caso API não retorne)
        let timeVencedorNome = null;
        let timeVencedorLogo = null;
        logChampionDebug('buscando-time-vencedor', { timeVencedorId: partidaFinal.time_vencedor_id });
        let timeVencedor = await buscarTimePorId(partidaFinal.time_vencedor_id);

        if (timeVencedor) {
            timeVencedorNome = timeVencedor.nome;
            timeVencedorLogo = timeVencedor.logo || timeVencedor.avatar_time_url || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            logChampionDebug('time-encontrado-api', { nome: timeVencedorNome, temLogo: Boolean(timeVencedorLogo) });
        } else {
            logChampionDebug('time-nao-encontrado-api', { timeVencedorId: partidaFinal.time_vencedor_id });
        }

        if (!timeVencedorNome || !timeVencedorLogo) {
            // Fallback: tentar obter dados diretamente do card da partida
            const matchBox = document.querySelector(`[data-match-id="${partidaFinal.match_id}"]`);
            if (matchBox) {
                const vencedorSlot = partidaFinal.time_vencedor_id === partidaFinal.time1_id ? '1' : '2';
                const vencedorRow = matchBox.querySelector(`.team-row[data-team="${vencedorSlot}"]`);
                if (vencedorRow) {
                    const nameEl = vencedorRow.querySelector('.team-name');
                    const logoEl = vencedorRow.querySelector('.team-logo');
                    if (nameEl && nameEl.textContent) {
                        timeVencedorNome = timeVencedorNome || nameEl.textContent.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                    }
                    if (logoEl && logoEl.src) {
                        timeVencedorLogo = timeVencedorLogo || logoEl.src;
                    }
                }
            }
            const primeiraPosicaoCard = document.querySelector('.standing-card[data-position="1"]');
            logChampionDebug('tentando-fallback-classificacao', {
                cardEncontrado: Boolean(primeiraPosicaoCard),
                jaTemNome: Boolean(timeVencedorNome),
                jaTemLogo: Boolean(timeVencedorLogo)
            });
            if (primeiraPosicaoCard) {
                if (!timeVencedorNome) {
                    const nameEl = primeiraPosicaoCard.querySelector('.standing-team-name');
                    if (nameEl?.textContent) {
                        timeVencedorNome = nameEl.textContent.trim();
                        logChampionDebug('nome-do-card-classificacao', { nome: timeVencedorNome });
                    } else {
                        logChampionDebug('nome-nao-encontrado-no-card');
                    }
                }
                if (!timeVencedorLogo) {
                    const logoBg = primeiraPosicaoCard.querySelector('.standing-team-logo-bg');
                    if (logoBg) {
                        const bgStyle = window.getComputedStyle ? getComputedStyle(logoBg).backgroundImage : logoBg.style.backgroundImage;
                        if (bgStyle && bgStyle.includes('url')) {
                            const match = bgStyle.match(/url\\(["']?(.*?)["']?\\)/);
                            if (match && match[1]) {
                                timeVencedorLogo = match[1];
                                logChampionDebug('logo-do-card-classificacao', { url: timeVencedorLogo });
                            } else {
                                logChampionDebug('logo-nao-extraido-do-bg', { bgStyle: bgStyle.substring(0, 100) });
                            }
                        } else {
                            logChampionDebug('bg-sem-url', { bgStyle: bgStyle ? bgStyle.substring(0, 50) : 'null' });
                        }
                    } else {
                        logChampionDebug('logo-bg-nao-encontrado');
                    }
                }
                logChampionDebug('fallback-classificacao-resultado', { timeVencedorNome, timeVencedorLogo });
            } else {
                logChampionDebug('card-classificacao-nao-encontrado');
            }
        }

        if (!timeVencedorNome) {
            timeVencedorNome = 'Time Campeão';
        }
        if (!timeVencedorLogo) {
            timeVencedorLogo = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        }

        logChampionDebug('time-definido', {
            vencedorId: partidaFinal.time_vencedor_id,
            timeVencedorNome,
            origemFallback: !timeVencedor
        });

        // Atualizar a champion-box
        const championBox = document.querySelector('.champion-box');
        logChampionDebug('atualizando-champion-box', {
            boxEncontrado: Boolean(championBox),
            nome: timeVencedorNome,
            logo: timeVencedorLogo
        });

        if (!championBox) {
            logChampionDebug('champion-box-nao-encontrado');
            return;
        }

        const championLogo = championBox.querySelector('.champion-logo');
        const championName = championBox.querySelector('.champion-name');
        logChampionDebug('elementos-champion-box', {
            logoEncontrado: Boolean(championLogo),
            nameEncontrado: Boolean(championName)
        });

        if (championLogo) {
            championLogo.src = timeVencedorLogo;
            championLogo.alt = timeVencedorNome;
            championLogo.onerror = function () {
                logChampionDebug('erro-carregar-logo', { url: timeVencedorLogo });
                this.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            };
            logChampionDebug('logo-atualizado', { src: timeVencedorLogo });
        }

        if (championName) {
            championName.textContent = timeVencedorNome;
            logChampionDebug('nome-atualizado', { textContent: timeVencedorNome });
        }

        // Atualizar 1º e 2º lugar na classificação final
        try {
            // 1º lugar = campeão
            await atualizarCardClassificacaoPosicao(1, partidaFinal.time_vencedor_id);

            // 2º lugar = perdedor da final (vice)
            let viceId = null;
            if (partidaFinal.time1_id && partidaFinal.time2_id) {
                viceId = partidaFinal.time1_id === partidaFinal.time_vencedor_id
                    ? partidaFinal.time2_id
                    : partidaFinal.time1_id;
                logChampionDebug('vice-determinado-ids', {
                    vencedorId: partidaFinal.time_vencedor_id,
                    time1Id: partidaFinal.time1_id,
                    time2Id: partidaFinal.time2_id,
                    viceId
                });
            } else {
                // Se não temos os dois IDs, tentar buscar o perdedor no DOM
                const matchBox = document.querySelector(`[data-match-id="${partidaFinal.match_id}"]`);
                if (matchBox) {
                    const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
                    const time2Row = matchBox.querySelector('.team-row[data-team="2"]');
                    
                    // Determinar qual time é o perdedor (o que não tem ✅)
                    let perdedorRow = null;
                    let perdedorSlot = null;
                    
                    if (time1Row) {
                        const nameEl = time1Row.querySelector('.team-name');
                        const temVencedor = nameEl?.textContent?.includes('✅') || 
                                            time1Row.classList.contains('winner') ||
                                            time1Row.classList.contains('team-winner');
                        if (!temVencedor) {
                            perdedorRow = time1Row;
                            perdedorSlot = 1;
                        }
                    }
                    
                    if (!perdedorRow && time2Row) {
                        const nameEl = time2Row.querySelector('.team-name');
                        const temVencedor = nameEl?.textContent?.includes('✅') || 
                                            time2Row.classList.contains('winner') ||
                                            time2Row.classList.contains('team-winner');
                        if (!temVencedor) {
                            perdedorRow = time2Row;
                            perdedorSlot = 2;
                        }
                    }
                    
                    if (perdedorRow) {
                        // Tentar obter o ID do perdedor
                        const perdedorDataId = perdedorRow.getAttribute('data-time-id');
                        if (perdedorDataId) {
                            viceId = parseInt(perdedorDataId);
                            logChampionDebug('vice-encontrado-dom-data-id', {
                                viceId,
                                perdedorSlot
                            });
                        } else {
                            // Tentar buscar pelo nome
                            const nameEl = perdedorRow.querySelector('.team-name');
                            const nomeLimpo = nameEl?.textContent?.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                            if (nomeLimpo) {
                                try {
                                    viceId = await obterTimeIdPorNome(nomeLimpo);
                                    logChampionDebug('vice-encontrado-dom-nome', {
                                        nome: nomeLimpo,
                                        viceId,
                                        perdedorSlot
                                    });
                                } catch (e) {
                                    logChampionDebug('erro-buscar-vice-nome', { erro: e.message });
                                }
                            }
                        }
                    } else {
                        logChampionDebug('perdedor-nao-encontrado-dom', {
                            matchId: partidaFinal.match_id,
                            temTime1Row: Boolean(time1Row),
                            temTime2Row: Boolean(time2Row)
                        });
                    }
                } else {
                    logChampionDebug('matchbox-nao-encontrado-para-vice', {
                        matchId: partidaFinal.match_id
                    });
                    
                    // Fallback 1: Tentar buscar o time2_id nas partidas do banco
                    // Se a final é upper_5_1, buscar as semi-finais (upper_4_1 e upper_4_2)
                    // O perdedor da semi-final que não é o campeão é o vice
                    try {
                        const ultimoRound = parseInt(partidaFinal.match_id.split('_')[1]);
                        const roundAnterior = ultimoRound - 1;
                        
                        // Buscar as partidas do round anterior (semi-finais)
                        const semiFinais = partidas.filter(p => {
                            const matchIdParts = p.match_id?.split('_');
                            return matchIdParts && 
                                   matchIdParts[0] === 'upper' && 
                                   parseInt(matchIdParts[1]) === roundAnterior;
                        });
                        
                        logChampionDebug('buscando-vice-semi-finais', {
                            roundAnterior,
                            semiFinais: semiFinais.length,
                            matchIds: semiFinais.map(p => p.match_id)
                        });
                        
                        // Encontrar qual time perdeu na semi-final mas não é o campeão
                        for (const semi of semiFinais) {
                            if (semi.time1_id && semi.time1_id !== partidaFinal.time_vencedor_id) {
                                // Verificar se este time perdeu (não tem time_vencedor_id ou time_vencedor_id é diferente)
                                if (!semi.time_vencedor_id || semi.time_vencedor_id !== semi.time1_id) {
                                    viceId = semi.time1_id;
                                    logChampionDebug('vice-encontrado-semi-final-time1', {
                                        semiFinalId: semi.match_id,
                                        viceId
                                    });
                                    break;
                                }
                            }
                            if (semi.time2_id && semi.time2_id !== partidaFinal.time_vencedor_id) {
                                if (!semi.time_vencedor_id || semi.time_vencedor_id !== semi.time2_id) {
                                    viceId = semi.time2_id;
                                    logChampionDebug('vice-encontrado-semi-final-time2', {
                                        semiFinalId: semi.match_id,
                                        viceId
                                    });
                                    break;
                                }
                            }
                        }
                        
                        // Se ainda não encontrou, buscar o time que chegou na final mas não é o campeão
                        if (!viceId) {
                            // Buscar todas as partidas do round anterior e ver qual time avançou
                            const timesQueAvancaram = new Set();
                            for (const semi of semiFinais) {
                                if (semi.time_vencedor_id) {
                                    timesQueAvancaram.add(semi.time_vencedor_id);
                                }
                            }
                            
                            // O vice é o time que avançou mas não é o campeão
                            for (const timeId of timesQueAvancaram) {
                                if (timeId !== partidaFinal.time_vencedor_id) {
                                    viceId = timeId;
                                    logChampionDebug('vice-encontrado-avancou-final', {
                                        viceId
                                    });
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        logChampionDebug('erro-buscar-vice-semi-finais', { erro: e.message });
                    }
                    
                    // Fallback 2: Tentar buscar no card de classificação se já foi preenchido
                    if (!viceId) {
                        const segundaPosicaoCard = document.querySelector('.standing-card[data-position="2"]');
                        if (segundaPosicaoCard) {
                            const viceTimeId = segundaPosicaoCard.getAttribute('data-time-id');
                            if (viceTimeId) {
                                viceId = parseInt(viceTimeId);
                                logChampionDebug('vice-encontrado-card-classificacao', {
                                    viceId
                                });
                            } else {
                                // Tentar buscar pelo nome no card
                                const nameEl = segundaPosicaoCard.querySelector('.standing-team-name');
                                const nomeVice = nameEl?.textContent?.trim();
                                if (nomeVice && nomeVice !== '----' && nomeVice !== 'Time 2') {
                                    try {
                                        viceId = await obterTimeIdPorNome(nomeVice);
                                        logChampionDebug('vice-encontrado-card-nome', {
                                            nome: nomeVice,
                                            viceId
                                        });
                                    } catch (e) {
                                        logChampionDebug('erro-buscar-vice-card-nome', { erro: e.message });
                                    }
                                }
                            }
                        }
                    }
                    
                    // Fallback 3: Tentar diferentes seletores para o matchBox
                    if (!viceId) {
                        const seletoresAlternativos = [
                            `.match-box[data-match-id="${partidaFinal.match_id}"]`,
                            `.match[data-match-id="${partidaFinal.match_id}"]`,
                            `[data-match="${partidaFinal.match_id}"]`,
                            `#${partidaFinal.match_id}`,
                            `.match-box#${partidaFinal.match_id}`
                        ];
                        
                        for (const seletor of seletoresAlternativos) {
                            const matchBoxAlt = document.querySelector(seletor);
                            if (matchBoxAlt) {
                                logChampionDebug('matchbox-encontrado-seletor-alternativo', {
                                    seletor,
                                    matchId: partidaFinal.match_id
                                });
                                
                                const time1Row = matchBoxAlt.querySelector('.team-row[data-team="1"]');
                                const time2Row = matchBoxAlt.querySelector('.team-row[data-team="2"]');
                                
                                // Mesma lógica de antes para encontrar o perdedor
                                let perdedorRow = null;
                                if (time1Row) {
                                    const nameEl = time1Row.querySelector('.team-name');
                                    const temVencedor = nameEl?.textContent?.includes('✅') || 
                                                        time1Row.classList.contains('winner');
                                    if (!temVencedor) {
                                        perdedorRow = time1Row;
                                    }
                                }
                                
                                if (!perdedorRow && time2Row) {
                                    const nameEl = time2Row.querySelector('.team-name');
                                    const temVencedor = nameEl?.textContent?.includes('✅') || 
                                                        time2Row.classList.contains('winner');
                                    if (!temVencedor) {
                                        perdedorRow = time2Row;
                                    }
                                }
                                
                                if (perdedorRow) {
                                    const perdedorDataId = perdedorRow.getAttribute('data-time-id');
                                    if (perdedorDataId) {
                                        viceId = parseInt(perdedorDataId);
                                        logChampionDebug('vice-encontrado-seletor-alternativo', {
                                            viceId,
                                            seletor
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (viceId) {
                await atualizarCardClassificacaoPosicao(2, viceId);
                logChampionDebug('card-2-lugar-atualizado', { viceId });
            } else {
                logChampionDebug('vice-nao-determinado', {
                    temTime1Id: Boolean(partidaFinal.time1_id),
                    temTime2Id: Boolean(partidaFinal.time2_id),
                    vencedorId: partidaFinal.time_vencedor_id
                });
            }
        } catch (e) {
            console.error('Erro ao atualizar classificação final (1º e 2º lugar):', e);
            logChampionDebug('erro-atualizar-classificacao', { erro: e.message });
        }

        // Verificar se é campeonato oficial e adicionar botão de premiação
        const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
        
        const tipoCampeonato = normalizarTipoCampeonato(campeonato);
        const { medalhaId, trofeuId } = extrairIdsPremiacao(campeonato);
        const ehOficial = tipoCampeonato === 'oficial';

        // Verificar se o usuário é dono do campeonato
        const isOwner = window.isChampionshipOwner === true;
        
        logChampionDebug('premiacao-condicao', {
            existeCampeonato: Boolean(campeonato),
            tipoCampeonato,
            ehOficial,
            medalhaId,
            trofeuId,
            isOwner,
            temDadosCampeonatoAtual: Boolean(dadosCampeonatoAtual),
            temWindowCampeonatoAtualDados: Boolean(window.campeonatoAtualDados)
        });

        // O botão só aparece se: campeonato oficial, tem premiação configurada E usuário é dono
        if (campeonato && ehOficial && (medalhaId || trofeuId) && isOwner) {
            // Remover botão anterior se existir
            const btnPremiacaoExistente = championBox.querySelector('#btnConcederPremiacao');
            if (btnPremiacaoExistente) {
                btnPremiacaoExistente.remove();
            }

            // Criar botão de conceder premiação
            const btnPremiacao = document.createElement('button');
            btnPremiacao.id = 'btnConcederPremiacao';
            btnPremiacao.innerHTML = '<i class="fas fa-trophy"></i> Conceder Premiações';
            btnPremiacao.style.cssText = `
                margin-top: 15px;
                padding: 12px 24px;
                background: linear-gradient(45deg, #f56e08, #F66600);
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            `;
            btnPremiacao.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 20px rgba(245, 110, 8, 0.4)';
            };
            btnPremiacao.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
            btnPremiacao.addEventListener('click', async () => {
                await concederPremiacoesOficiais(partidaFinal);
            });

            championBox.appendChild(btnPremiacao);
            logChampionDebug('botao-premiacao-criado', { medalhaId, trofeuId });
        } else {
            // Garantir que o botão não permaneça se as condições não forem atendidas
            const btnPremiacaoExistente = championBox.querySelector('#btnConcederPremiacao');
            if (btnPremiacaoExistente) {
                btnPremiacaoExistente.remove();
            }
            
            // Logs específicos sobre por que o botão não foi criado
            if (!campeonato) {
                logChampionDebug('botao-premiacao-nao-criado', { motivo: 'campeonato-nao-encontrado' });
            } else if (!ehOficial) {
                logChampionDebug('botao-premiacao-nao-criado', { motivo: 'campeonato-nao-oficial', tipo: tipoCampeonato });
            } else if (!medalhaId && !trofeuId) {
                logChampionDebug('botao-premiacao-nao-criado', { motivo: 'premiacao-nao-configurada' });
            } else if (!isOwner) {
                logChampionDebug('botao-premiacao-nao-criado', { motivo: 'usuario-nao-e-dono', isOwner });
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar champion-box:', error);
        logChampionDebug('erro', { mensagem: error?.message });
    }
}

// Função para obter ID do time pelo nome (buscar do localStorage ou do banco)
async function obterTimeIdPorNome(nomeTime) {
    try {
        // Primeiro, tentar buscar do localStorage
        const times = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
        const time = times.find(t => t.nome === nomeTime);
        if (time && time.id) return time.id;

        // Se não encontrar no localStorage, buscar do banco via API
        try {
            const response = await fetch(`${API_URL}/times/list`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const listaTimes = Array.isArray(data.times) ? data.times :
                    Array.isArray(data.dados) ? data.dados : [];
                const timeEncontrado = listaTimes.find(t => t.nome === nomeTime);
                if (timeEncontrado && timeEncontrado.id) {
                    // Atualizar localStorage com o ID encontrado
                    const timesAtualizados = times.map(t =>
                        t.nome === nomeTime ? { ...t, id: timeEncontrado.id } : t
                    );
                    localStorage.setItem('cs2-teams', JSON.stringify(timesAtualizados));
                    return timeEncontrado.id;
                }
            } else if (response.status !== 404) {
                // Só logar se não for 404 (404 é esperado se o endpoint não existir)
                console.warn(`Erro ao buscar lista de times: ${response.status}`);
            }
        } catch (apiError) {
            // Ignorar erros de rede silenciosamente
        }

        return null;
    } catch (error) {
        console.error('Erro ao obter ID do time:', error);
        return null;
    }
}

// Função para inicializar chaveamento com dados do campeonato
async function inicializarChaveamentoDoCampeonato() {
    // Ler ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');

    debugChaveamentoEtapa('init-start', {
        campeonatoId,
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash
    });

    if (!campeonatoId) {
        // Se não tiver ID, manter comportamento normal (manual)
        sincronizarResultadosComCampeonato(null);
        debugChaveamentoEtapa('init-sem-id', {
            href: window.location.href,
            search: window.location.search,
            hash: window.location.hash
        });
        return;
    }

    if (chaveamentoInitExecutado) {
        debugChaveamentoEtapa('init-ja-executado', {
            campeonatoIdNovo: campeonatoId,
            campeonatoIdAtual
        });
        return;
    }
    
    chaveamentoInitExecutado = true;

    await garantirCachePosicoesCarregado();

    campeonatoIdAtual = campeonatoId;
    sincronizarResultadosComCampeonato(campeonatoIdAtual);
    debugChaveamentoEtapa('init-sync-concluido', {
        campeonatoId: campeonatoIdAtual
    });

    try {
        // Buscar dados do campeonato
        const campeonato = await buscarCampeonato(campeonatoId);
        dadosCampeonatoAtual = campeonato;
        window.campeonatoAtualDados = campeonato;
        
        debugChaveamentoEtapa('init-campeonato-carregado', {
            campeonatoId,
            chave: campeonato?.chave,
            qnt_times: campeonato?.qnt_times
        });
        
        // Carregar imagens de medalha e troféu após campeonato ser carregado
        setTimeout(async () => {
            await garantirSlotsPremiacaoVisiveis();
        }, 300);

        if (!campeonato) {
            console.warn('Campeonato não encontrado para ID:', campeonatoId);
            return;
        }

        // Garantir que o container da classificação final esteja sempre visível
        const finalStandingsContainer = document.getElementById('finalStandingsContainer');
        if (finalStandingsContainer) {
            finalStandingsContainer.style.display = 'flex';
        }
        
        // Garantir que os slots de medalha e troféu estejam sempre visíveis no card do 1º lugar
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(async () => {
            await garantirSlotsPremiacaoVisiveis();
        }, 200);

        // Aguardar times serem carregados no localStorage
        await aguardarTimesCarregados();

        // Verificar se já existe chaveamento no banco
        let dadosChaveamento = await buscarChaveamentoDoBanco(campeonatoId);

        debugChaveamentoEtapa('init-chaveamento-banco', {
            temDados: Boolean(dadosChaveamento),
            partidasBanco: dadosChaveamento?.partidas?.length || 0
        });

        const formatoMapeado = mapearFormatoChave(campeonato.chave);
        const formatoBanco = mapearFormatoChaveParaBanco(formatoMapeado);
        let qntTimes = parseInt(campeonato.qnt_times) || 16;

        // Se não existir chaveamento, criar um novo
        if (!dadosChaveamento) {
            // Limpar localStorage de resultados quando é um campeonato novo
            limparResultadosLocais();
            
            try {
                chaveamentoIdAtual = await criarChaveamentoNoBanco(campeonatoId, formatoBanco, qntTimes);
                debugChaveamentoEtapa('init-chaveamento-criado', {
                    chaveamentoIdAtual
                });
            } catch (error) {
                console.error('Erro ao criar chaveamento no banco:', error);
                // Continuar mesmo se falhar (modo offline)
            }
        } else {
            chaveamentoIdAtual = dadosChaveamento.chaveamento.id;
            debugChaveamentoEtapa('init-chaveamento-existente', {
                chaveamentoIdAtual
            });

            // Atualizar bracket com dados do banco (se houver partidas)
            // A atualização será feita após o bracket ser renderizado
            // através da função window.inicializarSistemaResultados
            window.dadosChaveamentoPendentes = dadosChaveamento;
        }

        // Preencher automaticamente
        const teamCountSelect = document.getElementById('teamCountSelect');
        const formatSelect = document.getElementById('formatSelect');

        if (teamCountSelect && formatSelect) {
            // Preencher formato da chave primeiro (pode alterar opções de times)
            const formatoMapeado = mapearFormatoChave(campeonato.chave);

            // Preencher quantidade de times
            let qntTimes = parseInt(campeonato.qnt_times) || 16;

            // Se for Major, validar quantidade de times (só permite 8, 16, 32)
            if (formatoMapeado === 'major_playoffs_bo3') {
                const majorTeamCounts = [8, 16, 32];
                if (!majorTeamCounts.includes(qntTimes)) {
                    qntTimes = 16; // Valor padrão se não for válido
                }
            }

            // Aplicar configurações automaticamente
            // Aguardar o script principal carregar completamente
            const aplicarConfiguracao = () => {
                // Verificar se os elementos ainda existem
                if (!teamCountSelect || !formatSelect) {
                    setTimeout(aplicarConfiguracao, 200);
                    return;
                }

                // Definir valores nos selects ANTES de disparar eventos
                formatSelect.value = formatoMapeado;
                teamCountSelect.value = String(qntTimes);

                // Desabilitar controles
                formatSelect.disabled = true;
                formatSelect.style.opacity = '0.6';
                formatSelect.style.cursor = 'not-allowed';

                teamCountSelect.disabled = true;
                teamCountSelect.style.opacity = '0.6';
                teamCountSelect.style.cursor = 'not-allowed';

                // Esconder botões de controle manual
                const applyBtn = document.getElementById('applySettings');
                const resetBtn = document.getElementById('resetSettings');
                if (applyBtn) applyBtn.style.display = 'none';
                if (resetBtn) resetBtn.style.display = 'none';

                // Verificar se renderBracket está disponível
                const tentarRenderizar = () => {
                    // Tentar acessar renderBracket
                    let renderFn = window.renderBracket;
                    const renderPayload = {
                        formato: formatoMapeado,
                        qntTimes,
                        renderDisponivel: typeof renderFn === 'function'
                    };
                    // Debug trace removido
                    debugChaveamentoEtapa('render-tentativa', renderPayload);

                    // Se ainda não estiver disponível, aguardar mais
                    if (typeof renderFn !== 'function') {
                        setTimeout(tentarRenderizar, 200);
                        return;
                    }

                    // Se for Major, configurar opções de times e mostrar controles
                    if (formatoMapeado === 'major_playoffs_bo3') {
                        const majorTeamCounts = [8, 16, 32];
                        if (typeof window.setTeamCountOptions === 'function') {
                            window.setTeamCountOptions(majorTeamCounts, qntTimes);
                        }
                        document.getElementById('stagesActions').style.display = '';
                        document.getElementById('swissBoard').style.display = 'block';
                        document.querySelector('.hscroll-area').style.display = 'none';
                        const btnChal = document.getElementById('btnChallengers');
                        if (btnChal) btnChal.style.display = (qntTimes === 8) ? 'none' : '';
                        const swiss = document.getElementById('swissBoard');
                        if (swiss) {
                            swiss.dataset.stage = (qntTimes === 8) ? 'legends' : 'challengers';
                            if (typeof window.renderSwissSkeleton === 'function') {
                                window.renderSwissSkeleton(qntTimes);
                            }
                        }
                    } else {
                        // Para outros formatos, restaurar opções padrão de times e esconder controles de fases
                        const defaultTeamCounts = [6, 8, 10, 12, 14, 16, 18, 20];
                        if (typeof window.setTeamCountOptions === 'function') {
                            window.setTeamCountOptions(defaultTeamCounts, qntTimes);
                        }
                        document.getElementById('stagesActions').style.display = 'none';
                        document.getElementById('swissBoard').style.display = 'none';
                        const hscrollArea = document.querySelector('.hscroll-area');
                        if (hscrollArea) hscrollArea.style.display = 'block';
                    }

                    // Renderizar o bracket
                    try {
                        renderFn(qntTimes, formatoMapeado);
                        debugChaveamentoEtapa('render-disparado', {
                            formato: formatoMapeado,
                            qntTimes
                        });

                        // Inicializar sistema de resultados após renderizar
                        if (typeof window.inicializarSistemaResultados === 'function') {
                            setTimeout(() => {
                                try {
                                    debugChaveamentoEtapa('sistema-resultados-dispatch', {});
                                    window.inicializarSistemaResultados();
                                } catch (e) {
                                    console.warn('Erro ao inicializar sistema de resultados:', e);
                                }
                            }, 500);
                        }
                    } catch (error) {
                        console.error('Erro ao chamar renderBracket:', error);
                    }
                };

                // Aguardar um pouco para garantir que o script principal já executou completamente
                setTimeout(tentarRenderizar, 300);
            };

            // Aguardar o script principal carregar
            setTimeout(aplicarConfiguracao, 500);
        }
        
        // Verificar se a premiação já foi concedida e desabilitar edições se necessário
        const premiacaoConcedidaKey = `premiacao-concedida-${campeonatoId}`;
        const premiacaoJaConcedida = localStorage.getItem(premiacaoConcedidaKey) === 'true';
        if (premiacaoJaConcedida) {
            premiacaoConcedida = true;
            // Aguardar um pouco para garantir que os elementos do DOM estão prontos
    setTimeout(() => {
                desabilitarEdicoesAposPremiacao();
            }, 1000);
        }
        
        // Atualizar disponibilidade do botão de embaralhar após inicialização
    setTimeout(() => {
            atualizarDisponibilidadeBotaoEmbaralhar();
        }, 1500);
    } catch (error) {
        console.error('Erro ao carregar dados do campeonato:', error);
    }
}

// Configurar inicialização automática garantindo apenas uma execução
(function configurarInicializacaoAutomatica() {
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
            agendarInicializacaoChaveamento(600, 'domcontentloaded');
            // Garantir que os slots de premiação estejam visíveis
            setTimeout(async () => {
                await garantirSlotsPremiacaoVisiveis();
                const finalStandingsContainer = document.getElementById('finalStandingsContainer');
                if (finalStandingsContainer) {
                    finalStandingsContainer.style.display = 'flex';
                }
            }, 100);
        }, { once: true });
    } else {
        agendarInicializacaoChaveamento(300, 'document-ready');
        // Garantir que os slots de premiação estejam visíveis
        setTimeout(async () => {
            await garantirSlotsPremiacaoVisiveis();
            const finalStandingsContainer = document.getElementById('finalStandingsContainer');
            if (finalStandingsContainer) {
                finalStandingsContainer.style.display = 'flex';
            }
        }, 100);
    }

    window.addEventListener('load', () => agendarInicializacaoChaveamento(300, 'window-load'), { once: true });
})();

// =============================================================
// ====================== [ PERMISSÕES E MODAL ] ======================
// =============================================================

// Variável global para armazenar se o usuário é dono do campeonato
window.isChampionshipOwner = false;

// Função para verificar autenticação (usando o mesmo endpoint que outras páginas)
// Tornar global para ser acessível de outros scripts
window.verificarAutenticacao = async function verificarAutenticacao() {
    try {
        const apiUrl = window.API_URL || 'http://127.0.0.1:3000/api/v1';
        const response = await fetch(`${apiUrl}/dashboard`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            // Retornar o objeto completo com logado e usuario, ou apenas usuario se logado
            if (data && data.logado && data.usuario) {
                return data.usuario;
            }
            return null;
        }
        // Se não estiver autenticado (401), retornar null
        if (response.status === 401) {
            return null;
        }
        return null;
    } catch (error) {
        console.warn('Erro ao verificar autenticação:', error);
        return null;
    }
};

// Função para formatar data
function formatarDataCampeonato(dataISO) {
    if (!dataISO) return 'Data não disponível';
    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return 'Data inválida';
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// Função para formatar tipo de chave
function formatarTipoChave(chave) {
    if (!chave) return 'Não definido';
    const tipos = {
        'Single Elimination (B01 até final BO3)': 'Single Elim (B01 → BO3 Final)',
        'Single Elimination (todos BO3)': 'Single Elim (Todos BO3)',
        'Double Elimination': 'Double Elimination',
        'CS2 Major (playoffs BO3)': 'CS2 Major (BO3)'
    };
    return tipos[chave] || chave;
}

// Função para carregar e exibir campeonatos no modal
async function carregarCampeonatosNoModal() {
    const modalCampeonatosContent = document.getElementById('modalCampeonatosContent');
    if (!modalCampeonatosContent) {
        console.error('Elemento modalCampeonatosContent não encontrado!');
        return;
    }
    try {
        const usuario = await verificarAutenticacao();
        if (!usuario) {
            modalCampeonatosContent.innerHTML = `
              <div style="text-align: center; padding: 40px; color: #9ddfff;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
                <p style="font-size: 1.1rem;">Você precisa estar logado para ver seus campeonatos.</p>
              </div>
            `;
            return;
        }

        const apiUrl = window.API_URL || 'http://127.0.0.1:3000/api/v1';
        let meusCampeonatos = [];
        let tituloModal = '🏆 Meus Campeonatos';

        // Verificar se o usuário é dono do campeonato atual
        const urlParams = new URLSearchParams(window.location.search);
        const campeonatoIdAtual = urlParams.get('id');
        const isOwner = window.isChampionshipOwner === true;

        if (isOwner) {
            // Se for dono, mostrar campeonatos que ele criou
            tituloModal = '🏆 Meus Campeonatos (Criados)';

            // Buscar todos os campeonatos
            const response = await fetch(`${apiUrl}/inscricoes/campeonato`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar campeonatos');
            }

            const data = await response.json();
            const todosCampeonatos = data.inscricoes || [];

            // Filtrar apenas campeonatos do organizador logado
            meusCampeonatos = todosCampeonatos.filter(
                campeonato => {
                    const organizadorId = campeonato.id_organizador || campeonato.organizador_id || campeonato.usuario_id;
                    return organizadorId && String(organizadorId) === String(usuario.id);
                }
            );
        } else {
            // Se não for dono, buscar campeonatos em que o time do usuário está inscrito
            tituloModal = '🏆 Campeonatos do Meu Time';

            // Verificar se o usuário tem time
            const timeId = usuario.time || usuario.time_id;

            if (!timeId) {
                modalCampeonatosContent.innerHTML = `
                  <div style="text-align: center; padding: 40px; color: #9ddfff;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">👥</div>
                    <p style="font-size: 1.1rem;">Você não possui um time cadastrado.</p>
                    <p style="font-size: 0.9rem; color: #888; margin-top: 10px;">Crie ou entre em um time para ver os campeonatos.</p>
                  </div>
                `;
                return;
            }

            // Buscar inscrições do time
            const responseInscricoes = await fetch(`${apiUrl}/inscricoes/times`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!responseInscricoes.ok) {
                throw new Error('Erro ao buscar inscrições do time');
            }

            const dataInscricoes = await responseInscricoes.json();
            const inscricoes = dataInscricoes.inscricoes || [];

            // Filtrar inscrições do time do usuário
            const inscricoesDoTime = inscricoes.filter(
                inscricao => String(inscricao.time_id) === String(timeId)
            );

            if (inscricoesDoTime.length === 0) {
                modalCampeonatosContent.innerHTML = `
                  <div style="text-align: center; padding: 40px; color: #9ddfff;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                    <p style="font-size: 1.1rem;">Seu time não está inscrito em nenhum campeonato.</p>
                  </div>
                `;
                return;
            }

            // Buscar todos os campeonatos
            const responseCampeonatos = await fetch(`${apiUrl}/inscricoes/campeonato`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!responseCampeonatos.ok) {
                throw new Error('Erro ao buscar campeonatos');
            }

            const dataCampeonatos = await responseCampeonatos.json();
            const todosCampeonatos = dataCampeonatos.inscricoes || [];

            // Filtrar campeonatos em que o time está inscrito
            const idsCampeonatosInscritos = inscricoesDoTime.map(insc => String(insc.inscricao_id));
            meusCampeonatos = todosCampeonatos.filter(
                campeonato => idsCampeonatosInscritos.includes(String(campeonato.id))
            );
        }

        // Ordenar por data de criação (mais recentes primeiro)
        meusCampeonatos.sort((a, b) => {
            const dataA = new Date(a.data || a.previsao_data_inicio || 0);
            const dataB = new Date(b.data || b.previsao_data_inicio || 0);
            return dataB - dataA;
        });

        if (meusCampeonatos.length === 0) {
            const mensagemVazio = isOwner
                ? 'Você ainda não criou nenhum campeonato.'
                : 'Seu time não está inscrito em nenhum campeonato.';

            modalCampeonatosContent.innerHTML = `
              <div style="text-align: center; padding: 40px; color: #9ddfff;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p style="font-size: 1.1rem;">${mensagemVazio}</p>
              </div>
            `;
            return;
        }

        // Atualizar título do modal
        const modalTitle = document.querySelector('#modalSelecionarCampeonato h2');
        if (modalTitle) {
            modalTitle.textContent = tituloModal;
        }

        // Renderizar lista de campeonatos
        const campeonatosHTML = meusCampeonatos.map(campeonato => {
            const nome = campeonato.titulo || 'Campeonato sem nome';
            const qntTimes = campeonato.qnt_times || 'N/A';
            const dataCriacao = formatarDataCampeonato(campeonato.data || campeonato.previsao_data_inicio);
            const tipoChave = formatarTipoChave(campeonato.chave);
            const status = campeonato.status || 'disponivel';

            // Cor do status
            let statusColor = '#9ddfff';
            let statusIcon = '✓';
            if (status.toLowerCase() === 'encerrado') {
                statusColor = '#ff6b6b';
                statusIcon = '✗';
            } else if (status.toLowerCase() === 'em breve') {
                statusColor = '#ffa500';
                statusIcon = '⏱';
            }

            return `
              <div class="campeonato-item-modal" onclick="window.location.href='chaveamento.html?id=${campeonato.id}'" style="
                background: rgba(10, 10, 10, 0.8);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
              " onmouseover="this.style.borderColor='#f56e08'; this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 20px rgba(245, 110, 8, 0.3)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                  <h3 style="font-family: 'Oswald', sans-serif; color: #f56e08; font-size: 1.4rem; font-weight: 700; margin: 0; flex: 1;">${nome}</h3>
                  <span style="color: ${statusColor}; font-weight: 600; font-size: 0.9rem; white-space: nowrap; margin-left: 15px;">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">👥</span>
                    <div>
                      <div style="color: #9ddfff; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Quantidade de Times</div>
                      <div style="color: #fff; font-size: 1.1rem; font-weight: 700;">${qntTimes} times</div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">📅</span>
                    <div>
                      <div style="color: #9ddfff; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Data de Criação</div>
                      <div style="color: #fff; font-size: 1rem; font-weight: 600;">${dataCriacao}</div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">🏆</span>
                    <div>
                      <div style="color: #9ddfff; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tipo de Chave</div>
                      <div style="color: #fff; font-size: 1rem; font-weight: 600;">${tipoChave}</div>
                    </div>
                  </div>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: right;">
                  <span style="color: #f56e08; font-weight: 600; font-size: 0.9rem;">Clique para abrir →</span>
                </div>
              </div>
            `;
        }).join('');

        modalCampeonatosContent.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">
              ${campeonatosHTML}
            </div>
          `;

    } catch (error) {
        console.error('Erro ao carregar campeonatos:', error);
        const modalCampeonatosContent = document.getElementById('modalCampeonatosContent');
        if (modalCampeonatosContent) {
            modalCampeonatosContent.innerHTML = `
              <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <p style="font-size: 1.1rem;">Erro ao carregar campeonatos. Tente novamente.</p>
              </div>
            `;
        }
    }
}

// Tornar função acessível globalmente
window.carregarCampeonatosNoModal = carregarCampeonatosNoModal;

// Função para exibir o nome do campeonato
async function exibirNomeCampeonato() {
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');

    if (!campeonatoId) {
        // Se não houver ID, ocultar o container
        const container = document.getElementById('championshipTitleContainer');
        if (container) {
            container.style.display = 'none';
        }
        return;
    }

    try {
        // Aguardar um pouco para garantir que os scripts estejam carregados
        let tentativas = 0;
        const maxTentativas = 10;

        while (tentativas < maxTentativas) {
            // Verificar se a função buscarCampeonato está disponível
            if (typeof buscarCampeonato === 'function') {
                const campeonato = await buscarCampeonato(campeonatoId);

                if (campeonato && campeonato.titulo) {
                    const container = document.getElementById('championshipTitleContainer');
                    const titleElement = document.getElementById('championshipTitle');

                    if (container && titleElement) {
                        titleElement.textContent = campeonato.titulo;
                        container.style.display = 'block';
                    }
                    return; // Sucesso, sair da função
                } else {
                    // Se não encontrar, ocultar
                    const container = document.getElementById('championshipTitleContainer');
                    if (container) {
                        container.style.display = 'none';
                    }
                    return;
                }
            }

            // Se a função não estiver disponível, aguardar um pouco e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 200));
            tentativas++;
        }

        // Se após todas as tentativas não conseguir, ocultar
        const container = document.getElementById('championshipTitleContainer');
        if (container) {
            container.style.display = 'none';
        }
    } catch (error) {
        console.warn('Erro ao buscar nome do campeonato:', error);
        const container = document.getElementById('championshipTitleContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Função para esconder botões de edição e desabilitar cliques nos match boxes
function esconderBotoesEdicao() {
    const btnEmbaralhar = document.getElementById('addExampleTeams');
    const btnResetar = document.getElementById('resetChaveamento');

    if (btnEmbaralhar) {
        btnEmbaralhar.style.display = 'none';
    }
    if (btnResetar) {
        btnResetar.style.display = 'none';
    }

    // Remover cursor pointer dos match boxes
    const matchBoxes = document.querySelectorAll('.match-box');
    matchBoxes.forEach(box => {
        box.style.cursor = 'default';
        box.style.opacity = '0.8';
    });

    // Esconder botões de vetos dos cards para quem não é dono do campeonato
    const vetoButtons = document.querySelectorAll('.match-box-hover-button');
    vetoButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

// Função para desabilitar edições após premiação ser concedida
function desabilitarEdicoesAposPremiacao() {
    premiacaoConcedida = true;
    
    // Esconder botão de resetar chaveamento
    const btnResetar = document.getElementById('resetChaveamento');
    if (btnResetar) {
        btnResetar.style.display = 'none';
    }
    
    // Desabilitar cliques nos match boxes
    const matchBoxes = document.querySelectorAll('.match-box');
    matchBoxes.forEach(box => {
        box.style.cursor = 'not-allowed';
        box.style.opacity = '0.6';
        box.style.pointerEvents = 'none';
    });
    
    // Salvar flag no localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');
    if (campeonatoId) {
        localStorage.setItem(`premiacao-concedida-${campeonatoId}`, 'true');
    }
}

// Função para mostrar botões de edição e habilitar cliques nos match boxes
function mostrarBotoesEdicao() {
    const btnEmbaralhar = document.getElementById('addExampleTeams');
    const btnResetar = document.getElementById('resetChaveamento');

    if (btnEmbaralhar) {
        btnEmbaralhar.style.display = 'inline-block';
        btnEmbaralhar.style.visibility = 'visible';
    }

    if (btnResetar) {
        btnResetar.style.display = 'inline-block';
        btnResetar.style.visibility = 'visible';
    }

    // Restaurar cursor pointer dos match boxes
    const matchBoxes = document.querySelectorAll('.match-box');
    matchBoxes.forEach(box => {
        box.style.cursor = 'pointer';
        box.style.opacity = '1';
    });

    // Mostrar botões de vetos nos cards (visíveis apenas para o dono)
    const vetoButtons = document.querySelectorAll('.match-box-hover-button');
    vetoButtons.forEach(btn => {
        btn.style.display = ''; // deixa o CSS controlar (has-both-teams + hover)
    });
}

function partidaTemResultadoRegistrado(partida) {
    if (!partida) return false;

    const status = typeof partida.status === 'string' ? partida.status.toLowerCase() : '';
    if (status === 'finalizada') return true;
    if (partida.time_vencedor_id) return true;

    const scoreCampos = ['score_time1', 'score_time2', 'time1_score', 'time2_score'];
    if (scoreCampos.some(campo => partida[campo] !== null && partida[campo] !== undefined)) {
        return true;
    }

    if (partida.resultado && Object.keys(partida.resultado).length > 0) return true;
    if (partida.resultado_json && Object.keys(partida.resultado_json).length > 0) return true;
    if (Array.isArray(partida.games) && partida.games.length > 0) return true;

    return false;
}

function possuiResultadosRegistrados() {
    return resultadosJaRegistrados();
}

function atualizarDisponibilidadeBotaoEmbaralhar() {
    const btnEmbaralhar = document.getElementById('addExampleTeams');
    if (!btnEmbaralhar) {
        return;
    }

    const bloquear = possuiResultadosRegistrados();

    if (bloquear) {
        btnEmbaralhar.disabled = true;
        btnEmbaralhar.title = 'Já existem resultados registrados. Resete o chaveamento para embaralhar novamente.';
    } else {
        btnEmbaralhar.disabled = false;
        btnEmbaralhar.title = 'Embaralhar times';
    }
}

function getPremiacaoStorageKey() {
    return campeonatoIdAtual ? `oficial-premiacao-${campeonatoIdAtual}` : null;
}

function limparCachePremiacaoOficial() {
    const key = getPremiacaoStorageKey();
    if (key) {
        localStorage.removeItem(key);
    }
}

async function buscarMembrosDoTime(timeId) {
    if (!timeId) {
        return [];
    }

    try {
        // Tentar buscar histórico de membros do campeonato (line congelada)
        const campeonatoId = obterCampeonatoIdContextual();
        if (campeonatoId) {
            try {
                const urlHistorico = `${API_URL}/inscricoes/historicoMembros?campeonato_id=${encodeURIComponent(campeonatoId)}&time_id=${encodeURIComponent(timeId)}`;
                const respHistorico = await fetch(urlHistorico, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (respHistorico.ok) {
                    const dataHist = await respHistorico.json();
                    const historico = Array.isArray(dataHist.historico) ? dataHist.historico : [];

                    if (historico.length > 0) {
                        // Formatar para o mesmo esquema usado hoje em renderizarMembrosNoCard
                        return historico.map(item => ({
                            usuario_id: item.usuario_id,
                            username: item.username,
                            avatar_url: item.avatar_url,
                            posicao: item.posicao
                        }));
                    }
                } else {
                    const errorText = await respHistorico.text();
                    console.warn(`⚠️ [MEMBROS HISTÓRICO] Erro ao buscar histórico (status ${respHistorico.status}):`, errorText);
                }
            } catch (errHist) {
                console.warn('⚠️ [MEMBROS HISTÓRICO] Falha ao buscar histórico:', errHist);
            }
        }

        // Se não tem histórico ou houve erro, não busca membros atuais aqui.
        // Assim a classificação final usa apenas o snapshot salvo ou o placeholder padrão.
        return [];
    } catch (error) {
        console.error('🏆 [MEMBROS] Erro ao buscar membros do time:', error);
        console.error('🏆 [MEMBROS] Stack trace:', error.stack);
        return [];
    }
}

async function concederMedalhaParaMembro(usuarioId, medalhaId, positionCamp) {
    if (!usuarioId || !medalhaId) {
        return;
    }
    
    try {
        const body = { 
            usuario_id: usuarioId, 
            medalha_id: medalhaId,
            position_camp: positionCamp || 'campeao'
        };
        
        const response = await fetch(`${API_URL}/medalhas/adicionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok && response.status !== 409) {
            const errorText = await response.text();
            console.error(`Erro ao adicionar medalha para usuário ${usuarioId} (status ${response.status}):`, errorText);
        }
    } catch (error) {
        console.error(`🏆 [MEDALHA] Erro ao adicionar medalha para usuário ${usuarioId}:`, error);
        console.error('🏆 [MEDALHA] Stack trace:', error.stack);
    }
}

async function concederTrofeuParaTime(timeId, trofeuId) {
    if (!timeId || !trofeuId) {
        return;
    }
    
    try {
        const body = { time_id: timeId, trofeu_id: trofeuId };
        const response = await fetch(`${API_URL}/trofeus/time`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok && response.status !== 409) {
            const errorText = await response.text();
            console.error(`Erro ao adicionar troféu para o time ${timeId} (status ${response.status}):`, errorText);
        }
    } catch (error) {
        console.error(`Erro ao adicionar troféu para o time ${timeId}:`, error);
    }
}

// Função para mostrar modal de confirmação de premiação
function mostrarModalConfirmacaoPremiacao(timeCampeaoNome, timeSegundoNome) {
    return new Promise((resolve) => {
        // Criar modal de confirmação
        const modal = document.createElement('div');
        modal.id = 'modalConfirmacaoPremiacao';
        modal.style.cssText = `
            display: block;
            position: fixed;
            z-index: 10001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div id="modalContentPremiacao" style="
                background-color: rgba(10, 10, 10, 0.95);
                margin: 10% auto;
                padding: 30px;
                border: 2px solid rgba(245, 110, 8, 0.5);
                border-radius: 20px;
                width: 90%;
                max-width: 600px;
                box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(245, 110, 8, 0.2);
                position: relative;
                z-index: 10002;
                pointer-events: auto;
            ">
                <h2 style="
                    font-family: 'Oswald', sans-serif;
                    color: #f56e08;
                    margin-top: 0;
                    text-align: center;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                ">🏆 Confirmar Premiação</h2>
                <p style="color: #9ddfff; text-align: center; margin: 20px 0; font-size: 1.1rem; line-height: 1.6;">
                    Deseja inserir as medalhas e troféus para os times?
                </p>
                <div style="
                    background: rgba(0, 212, 255, 0.1);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                ">
                    <p style="color: #ffd700; font-weight: 600; margin: 5px 0;">
                        🥇 Campeão: <span style="color: #fff;">${timeCampeaoNome || 'Time Vencedor'}</span>
                    </p>
                    ${timeSegundoNome ? `
                        <p style="color: #c0c0c0; font-weight: 600; margin: 5px 0;">
                            🥈 Segundo Lugar: <span style="color: #fff;">${timeSegundoNome}</span>
                        </p>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                    <button id="btnConfirmarPremiacao" type="button" style="
                        background: linear-gradient(45deg, #f56e08, #F66600);
                        color: #fff;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 10002;
                        position: relative;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(245, 110, 8, 0.4)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        Sim, Inserir
                    </button>
                    <button id="btnCancelarPremiacao" type="button" style="
                        background: #6c757d;
                        color: #fff;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 10002;
                        position: relative;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Função para fechar o modal
        let modalFechado = false;
        const fecharModal = (resultado) => {
            if (modalFechado) {
                return;
            }
            
            modalFechado = true;
            
            // Remover o modal imediatamente
            try {
                if (modal && modal.parentNode) {
                    modal.style.display = 'none';
                    document.body.removeChild(modal);
                }
            } catch (err) {
                // Tentar remover pelo ID como fallback
                try {
                    const modalPorId = document.getElementById('modalConfirmacaoPremiacao');
                    if (modalPorId && modalPorId.parentNode) {
                        modalPorId.style.display = 'none';
                        modalPorId.parentNode.removeChild(modalPorId);
                    }
                } catch (err2) {
                    console.error('Erro ao remover modal pelo ID:', err2);
                }
            }
            
            // Resolver a promise após remover o modal
            setTimeout(() => {
                resolve(resultado);
            }, 10);
        };

        // Adicionar listeners diretos nos botões
        setTimeout(() => {
            const btnConfirmar = document.getElementById('btnConfirmarPremiacao');
            const btnCancelar = document.getElementById('btnCancelarPremiacao');

            if (btnConfirmar) {
                const handlerConfirmar = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    btnConfirmar.removeEventListener('click', handlerConfirmar);
                    fecharModal(true);
                };
                btnConfirmar.addEventListener('click', handlerConfirmar, true);
            }

            if (btnCancelar) {
                const handlerCancelar = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    btnCancelar.removeEventListener('click', handlerCancelar);
                    fecharModal(false);
                };
                btnCancelar.addEventListener('click', handlerCancelar, true);
            }

            // Fechar ao clicar fora do conteúdo do modal
            const modalContent = document.getElementById('modalContentPremiacao');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    fecharModal(false);
                }
            }, true);
        }, 100);
    });
}

async function concederPremiacoesOficiais(partidaFinal) {
    if (!partidaFinal || !partidaFinal.time_vencedor_id) {
        return;
    }
    
    if (premiacaoOficialEmAndamento) {
        return;
    }

    const campeonato = dadosCampeonatoAtual || window.campeonatoAtualDados;
    
    if (!campeonato) {
        return;
    }
    
    const tipoCampeonato = normalizarTipoCampeonato(campeonato);
    const { medalhaId, trofeuId } = extrairIdsPremiacao(campeonato);

    debugChaveamentoEtapa('premiacao-validacao-inicio', {
        tipoCampeonato,
        medalhaId,
        trofeuId,
        partidaFinal: partidaFinal.match_id
    });
    
    if (tipoCampeonato !== 'oficial') {
        return;
    }
    
    if (!medalhaId && !trofeuId) {
        debugChaveamentoEtapa('premiacao-sem-medalha-trofeu');
        return;
    }

    const timeVencedorId = partidaFinal.time_vencedor_id;
    
    // Identificar o segundo lugar (perdedor da final)
    let timeSegundoId = null;
    if (partidaFinal.time1_id && partidaFinal.time2_id) {
        // Se temos ambos os IDs, identificar qual é o perdedor
        timeSegundoId = partidaFinal.time1_id === timeVencedorId 
            ? partidaFinal.time2_id 
            : partidaFinal.time1_id;
    } else {
        // Se não temos os IDs, tentar buscar do match box no DOM
        try {
            const matchBox = document.querySelector(`[data-match-id="${partidaFinal.match_id}"]`);
            if (matchBox) {
                const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
                const time2Row = matchBox.querySelector('.team-row[data-team="2"]');
                
                if (time1Row && time2Row) {
                    const time1Nome = time1Row.querySelector('.team-name')?.textContent?.trim().replace(/[✅🔻❌⬆️🏆]/g, '');
                    const time2Nome = time2Row.querySelector('.team-name')?.textContent?.trim().replace(/[✅🔻❌⬆️🏆]/g, '');
                    
                    // Buscar o time vencedor para comparar
                    const timeVencedor = await buscarTimePorId(timeVencedorId);
                    if (timeVencedor) {
                        const vencedorNome = timeVencedor.nome;
                        // Identificar qual time é o perdedor
                        const perdedorNome = time1Nome === vencedorNome ? time2Nome : time1Nome;
                        if (perdedorNome) {
                            timeSegundoId = await obterTimeIdPorNome(perdedorNome);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao identificar segundo lugar do DOM:', error);
        }
    }

    const premiacaoKey = getPremiacaoStorageKey();
    if (premiacaoKey) {
        const ultimaPremiacao = localStorage.getItem(premiacaoKey);
        if (ultimaPremiacao && ultimaPremiacao === String(timeVencedorId)) {
            return;
        }
    }

    debugChaveamentoEtapa('premiacao-finalistas-identificados', {
        timeVencedorId,
        timeSegundoId
    });

    // Buscar nomes dos times para o modal
    let timeCampeaoNome = 'Time Vencedor';
    let timeSegundoNome = null;
    
    try {
        const timeCampeao = await buscarTimePorId(timeVencedorId);
        if (timeCampeao) timeCampeaoNome = timeCampeao.nome;

        if (timeSegundoId) {
            const timeSegundo = await buscarTimePorId(timeSegundoId);
            if (timeSegundo) timeSegundoNome = timeSegundo.nome;
        }
    } catch (error) {
        console.error('Erro ao buscar nomes dos times:', error);
    }

    // Mostrar modal de confirmação
    const confirmado = await mostrarModalConfirmacaoPremiacao(timeCampeaoNome, timeSegundoNome);
    
    debugChaveamentoEtapa('premiacao-confirmacao-usuario', { confirmou: confirmado === true });

    if (!confirmado) {
        return;
    }

    premiacaoOficialEmAndamento = true;
    
    try {
        debugChaveamentoEtapa('premiacao-processo-iniciado', {
            medalhaId,
            trofeuId,
            timeVencedorId,
            timeSegundoId
        });
        
        // Conceder medalhas para o campeão
        if (medalhaId) {
            const membrosCampeao = await buscarMembrosDoTime(timeVencedorId);
            const membrosComId = membrosCampeao.filter(m => m?.usuario_id);
            
            if (membrosComId.length > 0) {
                await Promise.allSettled(
                    membrosComId.map(m => {
                        return concederMedalhaParaMembro(m.usuario_id, medalhaId, 'campeao');
                    })
                );
            }
        }

        // Conceder medalhas para o segundo lugar
        if (medalhaId && timeSegundoId) {
            const membrosSegundo = await buscarMembrosDoTime(timeSegundoId);
            const membrosComId = membrosSegundo.filter(m => m?.usuario_id);
            
            if (membrosComId.length > 0) {
                await Promise.allSettled(
                    membrosComId.map(m => {
                        return concederMedalhaParaMembro(m.usuario_id, medalhaId, 'segundo_lugar');
                    })
                );
            }
        }

        // Conceder troféu apenas para o campeão
        if (trofeuId) {
            await concederTrofeuParaTime(timeVencedorId, trofeuId);
        }

        if (premiacaoKey) {
            localStorage.setItem(premiacaoKey, String(timeVencedorId));
        }

        // Desabilitar edições após premiação
        desabilitarEdicoesAposPremiacao();
        
        // Mostrar notificação de sucesso
        if (typeof showNotification === 'function') {
            showNotification('success', 'Premiações concedidas com sucesso! 🏆', 5000);
        }
    } catch (error) {
        console.error('Erro ao conceder premiações oficiais:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erro ao conceder premiações. Tente novamente.', 5000);
        }
    } finally {
        premiacaoOficialEmAndamento = false;
        debugChaveamentoEtapa('premiacao-processo-finalizado');
    }
}

// Função para verificar se o usuário é dono do campeonato e controlar permissões
async function verificarPermissoesChaveamento() {
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');

    // Se não houver ID de campeonato, mostrar todos os botões (modo manual)
    if (!campeonatoId) {
        window.isChampionshipOwner = true; // Em modo manual, permitir tudo
        mostrarBotoesEdicao();
        return;
    }

    try {
        // Verificar autenticação do usuário
        // Tentar usar verificarAutenticacao se disponível, senão usar autenticacao do chaveamento.js
        let usuario = null;

        if (typeof verificarAutenticacao === 'function') {
            usuario = await verificarAutenticacao();
        } else if (typeof autenticacao === 'function') {
            // Usar função autenticacao do chaveamento.js
            const authData = await autenticacao();
            if (authData && authData.logado && authData.usuario) {
                usuario = authData.usuario;
            }
        } else {
            // Buscar diretamente da API
            try {
                const apiUrl = window.API_URL || 'http://127.0.0.1:3000/api/v1';
                const response = await fetch(`${apiUrl}/dashboard`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.logado && data.usuario) {
                        usuario = data.usuario;
                    }
                }
            } catch (error) {
                console.warn('Erro ao buscar autenticação:', error);
            }
        }

        if (!usuario) {
            // Se não estiver logado, esconder botões de edição
            window.isChampionshipOwner = false;
            esconderBotoesEdicao();
            return;
        }

        // Buscar dados do campeonato - tentar múltiplas formas
        let campeonato = null;

        // Tentar 1: Usar função buscarCampeonato se disponível
        if (typeof buscarCampeonato === 'function') {
            let tentativas = 0;
            const maxTentativas = 15;

            while (tentativas < maxTentativas && !campeonato) {
                campeonato = await buscarCampeonato(campeonatoId);
                if (!campeonato) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    tentativas++;
                }
            }
        }

        // Tentar 2: Buscar diretamente da API se não encontrou
        if (!campeonato) {
            try {
                const apiUrl = window.API_URL || 'http://127.0.0.1:3000/api/v1';
                const response = await fetch(`${apiUrl}/inscricoes/campeonato`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    const todosCampeonatos = data.inscricoes || [];
                    campeonato = todosCampeonatos.find(item => String(item.id) === String(campeonatoId));
                }
            } catch (error) {
                console.warn('Erro ao buscar campeonato diretamente da API:', error);
            }
        }

        if (campeonato) {
            // Verificar se o usuário é o organizador
            // Tentar diferentes formatos de comparação e diferentes nomes de campo
            const organizadorId = campeonato.id_organizador ||
                campeonato.organizador_id ||
                campeonato.usuario_id ||
                campeonato.criador_id;
            const usuarioId = usuario.id;

            const isOwner = organizadorId && (
                String(organizadorId) === String(usuarioId) ||
                Number(organizadorId) === Number(usuarioId) ||
                organizadorId == usuarioId // Comparação flexível
            );

            window.isChampionshipOwner = isOwner;

            if (isOwner) {
                // Se for dono, mostrar botões
                mostrarBotoesEdicao();
            } else {
                // Se não for dono, esconder botões
                esconderBotoesEdicao();
            }
        } else {
            // Se não conseguiu encontrar o campeonato, esconder botões por segurança
            window.isChampionshipOwner = false;
            esconderBotoesEdicao();
        }
    } catch (error) {
        console.error('❌ Erro ao verificar permissões:', error);
        // Em caso de erro, esconder botões por segurança
        window.isChampionshipOwner = false;
        esconderBotoesEdicao();
    }
}

// Executar verificação de permissões quando o DOM estiver pronto
// Usar múltiplos pontos de verificação para garantir que execute
function executarVerificacaoPermissoes() {
    verificarPermissoesChaveamento().catch(err => {
        console.error('Erro ao executar verificação de permissões:', err);
    });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(exibirNomeCampeonato, 500);
        setTimeout(executarVerificacaoPermissoes, 800);
        setTimeout(executarVerificacaoPermissoes, 2000);
    });
} else {
    setTimeout(exibirNomeCampeonato, 500);
    setTimeout(executarVerificacaoPermissoes, 800);
    setTimeout(executarVerificacaoPermissoes, 2000);
}

// Também executar quando a página estiver totalmente carregada
window.addEventListener('load', () => {
    setTimeout(exibirNomeCampeonato, 1000);
    setTimeout(executarVerificacaoPermissoes, 1000);
});

// Configurar event listeners do modal de campeonatos
(function () {
    const modalSelecionarCampeonato = document.getElementById('modalSelecionarCampeonato');
    const closeModalSelecionarCampeonato = document.getElementById('closeModalSelecionarCampeonato');
    const btnTrocarCampeonato = document.getElementById('btnTrocarCampeonato');

    // Botão para abrir modal
    if (btnTrocarCampeonato) {
        btnTrocarCampeonato.style.display = 'flex';
        btnTrocarCampeonato.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (modalSelecionarCampeonato) {
                modalSelecionarCampeonato.style.display = 'block';
                if (typeof carregarCampeonatosNoModal === 'function') {
                    carregarCampeonatosNoModal();
                } else {
                    console.error('Função carregarCampeonatosNoModal não encontrada!');
                }
            }
        });
    }

    // Fechar modal
    if (closeModalSelecionarCampeonato) {
        closeModalSelecionarCampeonato.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (modalSelecionarCampeonato) {
                modalSelecionarCampeonato.style.display = 'none';
            }
        });
    }

    // Fechar modal ao clicar fora
    if (modalSelecionarCampeonato) {
        modalSelecionarCampeonato.addEventListener('click', (e) => {
            if (e.target === modalSelecionarCampeonato) {
                modalSelecionarCampeonato.style.display = 'none';
            }
        });
    }
})();

// =============================================================
// ====================== [ CARROSSEL DE TIMES ] ======================
// =============================================================
(function () {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // URL base da API (será definida no script de carregamento do campeonato)
    const API_URL_DEFAULT = 'http://127.0.0.1:3000/api/v1';

    // Função auxiliar para obter o ID do time pelo nome (sem depender de outros scripts)
    const obterTimeIdPorNomeCarousel = async (nomeTime) => {
        if (!nomeTime) return null;
        try {
            const times = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
            const time = times.find(t => t.nome === nomeTime);
            if (time && time.id) return time.id;
        } catch (erroLocalStorage) {
            console.warn('Erro ao ler times do localStorage para o carrossel:', erroLocalStorage);
        }

        try {
            const apiUrl = window.API_URL || API_URL_DEFAULT;
            const response = await fetch(`${apiUrl}/times/list`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const listaTimes = Array.isArray(data.times) ? data.times :
                    Array.isArray(data.dados) ? data.dados : [];
                const timeEncontrado = listaTimes.find(t => t.nome === nomeTime);
                if (timeEncontrado && timeEncontrado.id) {
                    // Atualizar localStorage com o ID encontrado para usos futuros
                    try {
                        const timesExistentes = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
                        const timesAtualizados = timesExistentes.map(t =>
                            t.nome === nomeTime ? { ...t, id: timeEncontrado.id } : t
                        );
                        localStorage.setItem('cs2-teams', JSON.stringify(timesAtualizados));
                    } catch (erroAtualizar) {
                        console.warn('Erro ao atualizar times no localStorage:', erroAtualizar);
                    }
                    return timeEncontrado.id;
                }
            }
        } catch (apiError) {
            console.warn('Erro ao buscar time pelo nome (carrossel):', apiError);
        }

        return null;
    };

    // Função para buscar o vencedor da final
    const buscarVencedorFinal = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const campeonatoId = urlParams.get('id');
            if (!campeonatoId) return null;

            const apiUrl = window.API_URL || API_URL_DEFAULT;

            // Buscar chaveamento do campeonato
            const response = await fetch(`${apiUrl}/chaveamentos/${campeonatoId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) return null;

            const dados = await response.json();
            if (!dados || !dados.partidas) return null;

            const partidas = dados.partidas;
            let vencedorId = null;

            // 1) Prioridade: grand_final_1 (Double Elimination)
            const partidaGrandFinal = partidas.find(p => p.match_id === 'grand_final_1' && p.status === 'finalizada' && p.time_vencedor_id);
            if (partidaGrandFinal) {
                vencedorId = partidaGrandFinal.time_vencedor_id;
            }

            // 2) Se não houver grand final, procurar final do Single Elimination (último round do upper)
            if (!vencedorId) {
                const upperPartidas = partidas.filter(p => p.match_id && p.match_id.startsWith('upper_'));
                if (upperPartidas.length > 0) {
                    const rounds = upperPartidas.map(p => {
                        const partes = p.match_id.split('_');
                        return parseInt(partes[1]) || 0;
                    });
                    const ultimoRound = Math.max(...rounds);

                    let partidaFinalUpper = partidas.find(p =>
                        p.match_id === `upper_${ultimoRound}_1` &&
                        p.status === 'finalizada' &&
                        p.time_vencedor_id
                    );

                    if (!partidaFinalUpper) {
                        partidaFinalUpper = partidas.find(p =>
                            p.match_id === `upper_${ultimoRound}_1` &&
                            p.time_vencedor_id
                        );
                    }

                    if (partidaFinalUpper && partidaFinalUpper.time_vencedor_id) {
                        vencedorId = partidaFinalUpper.time_vencedor_id;
                    } else {
                        const partidaFinalCandidata = partidas.find(p => p.match_id === `upper_${ultimoRound}_1`);
                        if (partidaFinalCandidata) {
                            try {
                                const results = obterResultadosLocais();
                                const resultado = results[partidaFinalCandidata.match_id];

                                if (resultado && resultado.winner) {
                                    const slotKey = resultado.winner === 1 ? 'time1_id' : 'time2_id';
                                    if (partidaFinalCandidata[slotKey]) {
                                        vencedorId = partidaFinalCandidata[slotKey];
                                    } else {
                                        const matchBox = document.querySelector(`[data-match-id="${partidaFinalCandidata.match_id}"]`);
                                        if (matchBox) {
                                            const row = matchBox.querySelector(`.team-row[data-team="${resultado.winner}"] .team-name`);
                                            if (row && row.textContent) {
                                                const nome = row.textContent.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                                                if (nome) {
                                                    vencedorId = await obterTimeIdPorNomeCarousel(nome);
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (storageError) {
                                console.warn('Erro ao buscar resultado do localStorage para o carrossel:', storageError);
                            }
                        }
                    }
                }
            }

            return vencedorId;
        } catch (error) {
            console.error('Erro ao buscar vencedor da final:', error);
            return null;
        }
    };

    // Função para criar item do carrossel
    const createItem = (t, isWinner = false) => {
        const div = document.createElement('div');
        div.className = isWinner ? 'carousel-item carousel-winner' : 'carousel-item';
        if (t.id) {
            div.setAttribute('data-time-id', t.id);
        }
        const nomeTime = t.nome || 'Time';
        const logoUrl = t.logo || t.avatar_time_url || `https://cdn-icons-png.flaticon.com/128/5726/5726775.png`;
        div.innerHTML = `
        <img src="${logoUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'" alt="${nomeTime}">
        <span>${nomeTime}</span>
      `;
        return div;
    };

    // Função para atualizar o carrossel
    const atualizarCarrossel = async (teams) => {
        // Limpar carrossel
        track.innerHTML = '';

        if (teams.length === 0) {
            // Se não houver times, criar times de exemplo"
            teams = Array.from({ length: 10 }, (_, i) => ({
                nome: `Time ${i + 1}`,
                logo: `https://cdn-icons-png.flaticon.com/128/5726/5726775.png`
            }));
        }

        // Buscar ID do vencedor da final
        const vencedorId = await buscarVencedorFinal();

        // Criar itens destacando o vencedor
        const items = teams.map(t => createItem(t, t.id && vencedorId && t.id == vencedorId));
        const clones = teams.map(t => createItem(t, t.id && vencedorId && t.id == vencedorId));
        items.concat(clones).forEach(el => track.appendChild(el));
    };

    // Tornar função global para ser chamada de outros scripts
    window.atualizarCarrosselComVencedor = async () => {
        const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
        if (stored.length > 0) {
            await atualizarCarrossel(stored);
        }
    };

    // Verificar se há ID na URL (campeonato)
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');

    if (campeonatoId) {
        // Se houver ID, buscar times inscritos do campeonato
        const buscarTimesInscritos = async () => {
            // URL da API (usar a global se disponível, senão usar a local)
            const apiUrl = window.API_URL || API_URL_DEFAULT;

            try {
                // Buscar IDs dos times inscritos
                const response = await fetch(`${apiUrl}/inscricoes/times`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Erro ao buscar times inscritos');
                }

                const data = await response.json();
                const times_inscritos = [];

                // Filtrar times do campeonato atual
                for (let i = 0; i < data.inscricoes.length; i++) {
                    if (data.inscricoes[i].inscricao_id == campeonatoId) {
                        times_inscritos.push(data.inscricoes[i].time_id);
                    }
                }

                if (times_inscritos.length === 0) {
                    // Se não houver times inscritos, usar localStorage ou exemplo
                    const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
                    const teams = stored.length ? stored : Array.from({ length: 10 }, (_, i) => ({
                        nome: `Time ${i + 1}`,
                        logo: `https://via.placeholder.com/40x40/0aa/fff?text=${i + 1}`
                    }));
                    atualizarCarrossel(teams);
                    return;
                }

                // Buscar informações de cada time
                const promises = times_inscritos.map(async (timeId) => {
                    try {
                        const response = await fetch(`${apiUrl}/times/${timeId}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                        });

                        if (!response.ok) {
                            throw new Error(`Erro ao buscar time ${timeId}`);
                        }

                        const data = await response.json();
                        return {
                            id: timeId, // Incluir ID do time
                            nome: data.time?.nome || 'Time',
                            logo: data.time?.avatar_time_url || null
                        };
                    } catch (error) {
                        console.error(`Erro ao buscar informações do time ${timeId}:`, error);
                        return null;
                    }
                });

                // Aguardar todas as requisições
                const results = await Promise.all(promises);
                const teams = results.filter(t => t !== null);

                // Atualizar carrossel com os times reais
                atualizarCarrossel(teams);

                // Salvar no localStorage para uso futuro (incluindo IDs)
                localStorage.setItem('cs2-teams', JSON.stringify(teams));
            } catch (error) {
                console.error('Erro ao buscar times inscritos:', error);
                // Em caso de erro, usar localStorage ou exemplo
                const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
                const teams = stored.length ? stored : Array.from({ length: 10 }, (_, i) => ({
                    nome: `Time ${i + 1}`,
                    logo: `https://via.placeholder.com/40x40/0aa/fff?text=${i + 1}`
                }));
                atualizarCarrossel(teams);
            }
        };

        // Executar busca após um pequeno delay
        setTimeout(buscarTimesInscritos, 100);
    } else {
        // Se não houver ID, usar localStorage ou exemplo
        const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
        const teams = stored.length ? stored : Array.from({ length: 10 }, (_, i) => ({
            nome: `Time ${i + 1}`,
            logo: `https://via.placeholder.com/40x40/0aa/fff?text=${i + 1}`
        }));
        atualizarCarrossel(teams);
    }
})();




// ==========================================================
// movendo manualmente




// Geração dinâmica da coluna Round 1 conforme quantidade de times
(function () {
    const select = document.getElementById('teamCountSelect');
    if (select) {
        window.teamCountSelect = select;
    }
    const addExamplesBtn = document.getElementById('addExampleTeams');

    // Função global para renderizar Swiss Board (disponível imediatamente)
    window.renderSwissSkeleton = function (n) {
        const swissBoard = document.getElementById('swissBoard');
        if (!swissBoard) {
            console.warn('Swiss Board não encontrado');
            return;
        }
        let track = swissBoard.querySelector('.swiss-track');
        if (!track) {
            // Se não existir, cria o track
            track = document.createElement('div');
            track.className = 'swiss-track';
            swissBoard.appendChild(track);
        }
        const makeSlots = (count) => Array.from({ length: Math.max(0, Math.floor(count)) }, () => '<div class="swiss-slot"></div>').join('');

        // Coluna 0-0: TODOS os times (n slots)
        // Após primeira rodada: n/2 vão para 1-0 e n/2 para 0-1
        // Para 8 times: 8 slots em 0-0, depois 4 em 1-0 e 4 em 0-1
        // Para 16 times: 16 slots em 0-0, depois 8 em 1-0 e 8 em 0-1
        // Para 32 times: 32 slots em 0-0, depois 16 em 1-0 e 16 em 0-1
        const half = n / 2; // Metade dos times (após primeira rodada)
        const quarter = half / 2;
        const eighth = quarter / 2;

        // Para eliminação: ajustar conforme quantidade de times
        // 4 times são eliminados no total, podem ser distribuídos entre 0-3, 1-3, 2-3
        let elim0_3, elim1_3, elim2_3;
        if (n === 8) {
            // Para 8 times: 4 são eliminados, distribuição mais flexível
            elim0_3 = 2; // Pode ter 2 times eliminados com 0-3
            elim1_3 = 1; // Pode ter 1 time eliminado com 1-3
            elim2_3 = 1; // Pode ter 1 time eliminado com 2-3
        } else if (n === 16) {
            // Para 16 times: 8 são eliminados
            elim0_3 = 2;
            elim1_3 = 3;
            elim2_3 = 3;
        } else if (n === 32) {
            // Para 32 times: 16 são eliminados
            elim0_3 = 4;
            elim1_3 = 6;
            elim2_3 = 6;
        } else {
            // Fallback genérico
            elim0_3 = Math.max(1, Math.floor(eighth));
            elim1_3 = Math.max(1, Math.floor(eighth));
            elim2_3 = Math.max(1, Math.floor(eighth));
        }

        track.innerHTML = `
        <div class='swiss-col'>
          <div class='swiss-title'>0-0</div>
          ${makeSlots(n)}
        </div>
        <div class='swiss-col'>
          <div class='swiss-title'>1-0</div>
          ${makeSlots(half)}
          <div class='swiss-title sub'>0-1</div>
          ${makeSlots(half)}
        </div>
        <div class='swiss-col'>
          <div class='swiss-title'>2-0</div>
          ${makeSlots(quarter)}
          <div class='swiss-title sub'>1-1</div>
          ${makeSlots(half)}
          <div class='swiss-title sub'>0-2</div>
          ${makeSlots(quarter)}
        </div>
        <div class='swiss-col'>
          <div class='swiss-title'>3-0 • AVANÇA</div>
          <div class='swiss-advance'></div>
          <div class='swiss-title sub'>2-1</div>
          ${makeSlots(quarter)}
          <div class='swiss-title sub'>1-2</div>
          ${makeSlots(quarter)}
        </div>
        <div class='swiss-col'>
          <div class='swiss-title'>3-1 • AVANÇA</div>
          <div class='swiss-advance'></div>
          <div class='swiss-title sub'>2-2</div>
          ${makeSlots(quarter)}
        </div>
        <div class='swiss-col'>
          <div class='swiss-title'>3-2 • AVANÇA</div>
          <div class='swiss-advance'></div>
        </div>
        <div class='swiss-col'>
          <div class='swiss-title bad'>0-3 • ELIMINA</div>
          ${makeSlots(elim0_3)}
          <div class='swiss-title bad sub'>1-3 • ELIMINA</div>
          ${makeSlots(elim1_3)}
          <div class='swiss-title bad sub'>2-3 • ELIMINA</div>
          ${makeSlots(elim2_3)}
        </div>
      `;
    };

    // Função para obter times do localStorage ou carrossel
    const obterTimes = () => {
        try {
            const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
            return stored;
        } catch (error) {
            return [];
        }
    };

    const createMatchBox = (matchId, roundNum, totalRounds, matchIndex, formatMode = 'single_b01', team1 = null, team2 = null) => {
        const isFinal = roundNum === totalRounds;
        const allBo3 = (formatMode === 'single_bo3_all' || formatMode === 'major_playoffs_bo3');
        const format = allBo3 ? 'B03' : (isFinal ? 'B03' : 'B01');
        const finalClass = isFinal ? ' final-box' : '';

        // Verificar se é Lower Bracket (matchId começa com "lower_")
        const isLowerBracket = matchId.startsWith('lower_');
        // Verificar se é a Final (grand_final)
        const isGrandFinal = matchId.startsWith('grand_final');

        // Se times não foram fornecidos, tentar obter do localStorage
        let time1 = team1;
        let time2 = team2;

        // Só distribuir times automaticamente se:
        // 1. Não for Lower Bracket (Lower Bracket só recebe times após resultados)
        // 2. Não for a Final (Final só recebe times após resultados das Semifinais)
        // 3. For o primeiro round do Upper Bracket ou Round 2 (Quartas) com BYEs
        if (!time1 || !time2) {
            if (!isLowerBracket && !isGrandFinal) {
                const times = obterTimes();
                const numTeams = times.length;

                // Para o primeiro round do Upper Bracket, distribuir os times sequencialmente
                if (roundNum === 1 && times.length > 0) {
                    // Para 6 times: seeds 1 e 2 têm BYE, então Round 1 tem apenas seeds 3-6
                    if (numTeams === 20) {
                        const playInPairs20 = {
                            1: [0, 7],  // T1 vs T8
                            2: [1, 6],  // T2 vs T7
                            3: [2, 5],  // T3 vs T6
                            4: [3, 4]   // T4 vs T5
                        };
                        const pair = playInPairs20[matchIndex];
                        if (pair) {
                            time1 = times[pair[0]] || null;
                            time2 = times[pair[1]] || null;
                        }
                    }
                    else if (numTeams === 6) {
                        if (matchIndex === 1) {
                            // Match 1: Time 3 vs Time 6
                            time1 = times[2] || null; // Index 2 = Time 3
                            time2 = times[5] || null; // Index 5 = Time 6
                        } else if (matchIndex === 2) {
                            // Match 2: Time 4 vs Time 5
                            time1 = times[3] || null; // Index 3 = Time 4
                            time2 = times[4] || null; // Index 4 = Time 5
                        }
                    }
                    // Para 10 times: seeds 1-6 têm BYE, então Round 1 tem apenas seeds 7-10 (2 partidas)
                    else if (numTeams === 10) {
                        if (matchIndex === 1) {
                            // Match 1: Time 7 vs Time 10
                            time1 = times[6] || null; // Index 6 = Time 7
                            time2 = times[9] || null; // Index 9 = Time 10
                        } else if (matchIndex === 2) {
                            // Match 2: Time 8 vs Time 9
                            time1 = times[7] || null; // Index 7 = Time 8
                            time2 = times[8] || null; // Index 8 = Time 9
                        }
                    }
                    // Para 12 times: todos os 12 times jogam no primeiro round (6 partidas)
                    else if (numTeams === 12) {
                        // Match 1: Time 1 vs Time 12
                        // Match 2: Time 2 vs Time 11
                        // Match 3: Time 3 vs Time 10
                        // Match 4: Time 4 vs Time 9
                        // Match 5: Time 5 vs Time 8
                        // Match 6: Time 6 vs Time 7
                        const index1 = matchIndex - 1; // 0, 1, 2, 3, 4, 5
                        const index2 = 12 - matchIndex; // 11, 10, 9, 8, 7, 6
                        time1 = times[index1] || null;
                        time2 = times[index2] || null;
                    }
                    // Para 14 times: seeds 1 e 2 recebem BYE; Round 1 usa sementes 3-14
                    else if (numTeams === 14) {
                        // Ordem dos confrontos (seguindo o chaveamento de 16 times com duas BYEs)
                        const round1Seeds = {
                            1: [7, 8],   // Seed 8 vs Seed 9
                            2: [4, 11],  // Seed 5 vs Seed 12
                            3: [3, 12],  // Seed 4 vs Seed 13
                            4: [5, 10],  // Seed 6 vs Seed 11
                            5: [2, 13],  // Seed 3 vs Seed 14
                            6: [6, 9]    // Seed 7 vs Seed 10
                        };
                        const pair = round1Seeds[matchIndex];
                        if (pair) {
                            time1 = times[pair[0]] || null;
                            time2 = times[pair[1]] || null;
                        }
                    }
                    // Para 18 times: quatro partidas de play-in entre as últimas seeds
                    else if (numTeams === 18) {
                        const round1Pairs18 = {
                            1: [10, 17],
                            2: [11, 16],
                            3: [12, 15],
                            4: [13, 14]
                        };
                        const pair = round1Pairs18[matchIndex];
                        if (pair) {
                            time1 = times[pair[0]] || null;
                            time2 = times[pair[1]] || null;
                        }
                    }
                    // Para 16 times: todos os 16 times jogam no primeiro round (8 partidas)
                    else if (numTeams === 16) {
                        // Match 1: Time 1 vs Time 16
                        // Match 2: Time 2 vs Time 15
                        // Match 3: Time 3 vs Time 14
                        // Match 4: Time 4 vs Time 13
                        // Match 5: Time 5 vs Time 12
                        // Match 6: Time 6 vs Time 11
                        // Match 7: Time 7 vs Time 10
                        // Match 8: Time 8 vs Time 9
                        const index1 = matchIndex - 1; // 0, 1, 2, 3, 4, 5, 6, 7
                        const index2 = 16 - matchIndex; // 15, 14, 13, 12, 11, 10, 9, 8
                        time1 = times[index1] || null;
                        time2 = times[index2] || null;
                    } else {
                        // Para outras quantidades, distribuir sequencialmente
                        const index1 = (matchIndex - 1) * 2;
                        const index2 = index1 + 1;
                        time1 = times[index1] || null;
                        time2 = times[index2] || null;
                    }
                }
                // Para Round 2 (Quartas) com BYEs
                else if (roundNum === 2 && times.length > 0) {
                    // Para 6 times: seeds 1 e 2 têm BYE
                    if (numTeams === 6) {
                        // Round 2, Match 1: Time 1 (BYE) vs Vencedor do Round 1, Match 1
                        // Round 2, Match 2: Time 2 (BYE) vs Vencedor do Round 1, Match 2
                        if (matchIndex === 1) {
                            time1 = times[0] || null; // Index 0 = Time 1 (seed 1)
                        } else if (matchIndex === 2) {
                            time1 = times[1] || null; // Index 1 = Time 2 (seed 2)
                        }
                    }
                    // Para 10 times: seeds 1-6 têm BYE, aparecem nas 4 partidas das Oitavas (Round 2)
                    else if (numTeams === 10) {
                        // Round 2 tem 4 partidas (Oitavas)
                        // Match 1: Time 1 (BYE) vs Vencedor Round 1, Match 1
                        // Match 2: Time 2 (BYE) vs Vencedor Round 1, Match 2
                        // Match 3: Time 3 (BYE) vs Time 6 (BYE)
                        // Match 4: Time 4 (BYE) vs Time 5 (BYE)
                        if (matchIndex === 1) {
                            time1 = times[0] || null; // Index 0 = Time 1 (seed 1)
                        } else if (matchIndex === 2) {
                            time1 = times[1] || null; // Index 1 = Time 2 (seed 2)
                        } else if (matchIndex === 3) {
                            time1 = times[2] || null; // Index 2 = Time 3 (seed 3)
                            time2 = times[5] || null; // Index 5 = Time 6 (seed 6)
                        } else if (matchIndex === 4) {
                            time1 = times[3] || null; // Index 3 = Time 4 (seed 4)
                            time2 = times[4] || null; // Index 4 = Time 5 (seed 5)
                        }
                    }
                    // Para 14 times: seeds 1 e 2 entram diretamente nas Oitavas
                    else if (numTeams === 14) {
                        // Match 1 (topo): Seed 1 aguarda vencedor do Round 1, Match 1
                        // Match 4 (fundo): Seed 2 aguarda vencedor do Round 1, Match 6
                        if (matchIndex === 1) {
                            time1 = times[0] || null; // Seed 1
                        } else if (matchIndex === 4) {
                            time1 = times[1] || null; // Seed 2 no slot principal
                        }
                    }
                    // Para 18 times: 14 seeds entram direto nesta rodada
                    else if (numTeams === 18) {
                        const round2Seeds18 = {
                            1: { seeds: [0, null] },
                            2: { seeds: [1, null] },
                            3: { seeds: [2, null] },
                            4: { seeds: [3, null] },
                            5: { seeds: [4, 5] },
                            6: { seeds: [6, 7] },
                            7: { seeds: [8, 9] }
                        };
                        const mapping = round2Seeds18[matchIndex];
                        if (mapping && Array.isArray(mapping.seeds)) {
                            const [seedA, seedB] = mapping.seeds;
                            time1 = (typeof seedA === 'number') ? times[seedA] || null : null;
                            time2 = (typeof seedB === 'number') ? times[seedB] || null : null;
                        }
                    }
                    else if (numTeams === 20) {
                        // Verificar se é Double Elimination ou Single Elimination
                        const isDoubleElim = formatMode === 'double_elimination';

                        // Para ambos os formatos, a estrutura do Round 2 é a mesma
                        // (Seed 9-12 aguardam vencedores dos Play-ins, Seeds 13-20 jogam entre si)
                        const round2Seeds20 = {
                            1: { seedIndex: 8 },        // Seed 9 vs vencedor Play-In 1
                            2: { seedIndex: 9 },        // Seed 10 vs vencedor Play-In 2
                            3: { seedIndex: 10 },       // Seed 11 vs vencedor Play-In 3
                            4: { seedIndex: 11 },       // Seed 12 vs vencedor Play-In 4
                            5: { pair: [12, 13] },      // Seed 13 vs Seed 14
                            6: { pair: [14, 15] },      // Seed 15 vs Seed 16
                            7: { pair: [16, 17] },      // Seed 17 vs Seed 18
                            8: { pair: [18, 19] }       // Seed 19 vs Seed 20
                        };
                        const mapping20 = round2Seeds20[matchIndex];
                        if (mapping20) {
                            if (typeof mapping20.seedIndex === 'number') {
                                time1 = times[mapping20.seedIndex] || null;
                            }
                            if (Array.isArray(mapping20.pair)) {
                                time1 = times[mapping20.pair[0]] || null;
                                time2 = times[mapping20.pair[1]] || null;
                            }
                        }
                    }
                }
            }
            // Se for Lower Bracket ou Final, deixar time1 e time2 como null (vai mostrar "Aguardando...")
        }

        // Preparar dados dos times
        const time1Nome = time1?.nome || 'Aguardando...';
        const time1Logo = time1?.logo || time1?.avatar_time_url || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';

        const time2Nome = time2?.nome || 'Aguardando...';
        const time2Logo = time2?.logo || time2?.avatar_time_url || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';

        const hasBothTeams = !!(time1 && time2);

        return `
        <div class="match-box-wrapper${hasBothTeams ? ' has-both-teams' : ''}" data-match-id="${matchId}">
          <button 
            class="match-box-hover-button" 
            type="button"
            data-match-id="${matchId}"
          >
            <span>🗺️</span>
            <span>Vetos</span>
          </button>
        <div class="match-box ${format.toLowerCase()}${finalClass}" data-match-id="${matchId}" data-format="${format}" style="cursor: pointer;">
          <div class="bo-badge">${format}</div>
          <div class="team-row" data-team="1" ${time1?.id ? `data-time-id="${time1.id}"` : ''}>
            <div class="team-left">
              <img src="${time1Logo}" class="team-logo small" alt="${time1Nome}" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
              <span class="team-name small">${time1Nome}</span>
              <span class="winner-check" style="display: none;">✅</span>
              <span class="lower-indicator" style="display: none;">🔻</span>
            </div>
            <input type="number" class="score-input small" min="0" value="0" disabled>
          </div>
          <div class="team-row" data-team="2" ${time2?.id ? `data-time-id="${time2.id}"` : ''}>
            <div class="team-left">
              <img src="${time2Logo}" class="team-logo small" alt="${time2Nome}" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
              <span class="team-name small">${time2Nome}</span>
              <span class="winner-check" style="display: none;">✅</span>
              <span class="lower-indicator" style="display: none;">🔻</span>
            </div>
            <input type="number" class="score-input small" min="0" value="0" disabled>
          </div>
          </div>
        </div>
      `;
    };

    const renderDoubleElimination = (numTeams, format = 'double_elimination') => {
        const content = document.getElementById('hScrollContent');
        const allBo3 = (format === 'double_elimination'); // Double elim geralmente é BO3

        // Calcular tamanho do bracket
        let bracketSize = 1;
        while (bracketSize < numTeams) bracketSize *= 2;

        // Winner's Bracket (Upper)
        const upperRounds = Math.log2(bracketSize);
        const byes = bracketSize - numTeams;
        const upperMatchesPerRound = [];

        // Para 6 times: Round 1 tem 2 partidas (seeds 3-6), seeds 1-2 têm BYE
        if (numTeams === 6) {
            upperMatchesPerRound[1] = 2; // 2 partidas (Time 3 vs 6, Time 4 vs 5)
            // Round 2: 2 vencedores do Round 1 + 2 BYEs (seeds 1 e 2) = 2 partidas (Quartas)
            upperMatchesPerRound[2] = 2; // 2 partidas (Time 1 vs Vencedor J1, Time 2 vs Vencedor J2)
            // Round 3: 2 vencedores das Quartas = 1 partida (Semifinais)
            upperMatchesPerRound[3] = 1; // 1 partida (Semifinais)
            // Round 4 seria a Final, mas ela é adicionada separadamente
        }
        // Para 10 times: Round 1 tem 2 partidas (seeds 7-10), seeds 1-6 têm BYE
        else if (numTeams === 10) {
            upperMatchesPerRound[1] = 2; // 2 partidas (Time 7 vs 10, Time 8 vs 9)
            // Round 2: 2 vencedores do Round 1 + 6 BYEs (seeds 1-6) = 8 times = 4 partidas (Oitavas)
            upperMatchesPerRound[2] = 4; // 4 partidas (Oitavas)
            // Round 3: 4 vencedores das Oitavas = 2 partidas (Quartas)
            upperMatchesPerRound[3] = 2; // 2 partidas (Quartas)
            // Round 4: 2 vencedores das Quartas = 1 partida (Semifinais)
            upperMatchesPerRound[4] = 1; // 1 partida (Semifinais)
            // Round 5: 1 vencedor das Semifinais = Final (adicionada separadamente)
        }
        // Para 12 times: sem BYEs, todos os 12 times jogam no primeiro round
        else if (numTeams === 12) {
            upperMatchesPerRound[1] = 6; // 6 partidas (12 times, todos jogam)
            // Round 2: 6 vencedores do Round 1 = 3 partidas
            upperMatchesPerRound[2] = 3; // 3 partidas
            // Round 3: 3 vencedores do Round 2 = 1 partida + 1 BYE (mas vamos fazer 2 partidas com 1 time avançando)
            // Na verdade, com 3 times, fazemos 1 partida e 1 time avança direto (BYE)
            upperMatchesPerRound[3] = 1; // 1 partida (2 times jogam, 1 tem BYE)
            // Round 4: 1 vencedor do Round 3 + 1 BYE = 1 partida (Semifinais)
            upperMatchesPerRound[4] = 1; // 1 partida (Semifinais)
        }
        // Para 18 times: quatro partidas de play-in + chave reduzida (14 times na pré-oitavas)
        else if (numTeams === 18) {
            upperMatchesPerRound[1] = 4; // Play-in (8 times → 4 vencedores)
            upperMatchesPerRound[2] = 7; // Pré-Oitavas (14 times → 7 vencedores)
            upperMatchesPerRound[3] = 3; // Oitavas (remover 4º card)
            upperMatchesPerRound[4] = 2; // Quartas
            upperMatchesPerRound[5] = 1; // Semifinais
        } else {
            // Lógica padrão para outras quantidades
            upperMatchesPerRound[1] = Math.ceil((numTeams - byes) / 2);
            for (let r = 2; r <= upperRounds; r++) {
                if (r === 2) {
                    const teamsR2 = byes + upperMatchesPerRound[1];
                    upperMatchesPerRound[r] = Math.floor(teamsR2 / 2);
                } else {
                    upperMatchesPerRound[r] = Math.floor(upperMatchesPerRound[r - 1] / 2);
                }
            }
        }

        // Loser's Bracket (Lower) - cálculo para todas as quantidades
        const lowerMatchesPerRound = [];
        let lowerRounds;

        // Para 6 times: lógica específica
        if (numTeams === 6) {
            // Lower Round 1: 1 dos perdedores do Round 1 do Upper (Time 3 vs 6 ou Time 4 vs 5)
            lowerMatchesPerRound[1] = 1;

            // Lower Round 2: vencedor do Lower R1 + o outro perdedor do Round 1 do Upper
            // ou perdedor das Quartas
            lowerMatchesPerRound[2] = 1;

            // Lower Round 3: vencedor do Lower R2 + perdedor das Quartas (se houver)
            lowerMatchesPerRound[3] = 1;

            // Lower Final (Round 4): vencedor do Lower R3 + perdedor das Semifinais (Upper Round 3)
            const semifinalLoser = 1;
            const winnerFromLowerR3 = 1;
            const totalAtLowerFinal = semifinalLoser + winnerFromLowerR3;
            lowerMatchesPerRound[4] = 1; // Final

            lowerRounds = 4; // Lower Round 1, Lower Round 2, Lower Round 3, Final
        } else if (numTeams === 10) {
            // Para 10 times: lógica específica
            // Lower Round 1: 1 perdedor do Round 1 do Upper (2 perdedores, metade = 1)
            lowerMatchesPerRound[1] = 1;

            // Lower Round 2: 1 vencedor do LR1 + 1 perdedor do Round 1 + 1 perdedor das Oitavas (Match 1) + 2 perdedores das Oitavas (Match 3 e 4) = 5 times, ajustar para 2 partidas
            const winnersFromLowerR1 = 1;
            const losersFromR1 = 1; // Outro perdedor do Round 1
            const perdedorOitavasMatch1 = 1; // Perdedor do Match 1 das Oitavas
            const perdedoresOitavasMatch34 = 2; // Perdedores dos Match 3 e 4 das Oitavas
            const totalAtLowerR2 = winnersFromLowerR1 + losersFromR1 + perdedorOitavasMatch1 + perdedoresOitavasMatch34; // 1 + 1 + 1 + 2 = 5, ajustar para 4 times = 2 partidas
            lowerMatchesPerRound[2] = 2; // 2 partidas

            // Lower Round 3: 2 vencedores do LR2 + 1 perdedor das Oitavas (Match 2) = 3 times, ajustar para 2 partidas
            const winnersFromLowerR2 = 2;
            const perdedorOitavasMatch2 = 1; // Perdedor do Match 2 das Oitavas
            const totalAtLowerR3 = winnersFromLowerR2 + perdedorOitavasMatch2; // 2 + 1 = 3, ajustar para 4 times = 2 partidas (com 1 BYE ou ajustar)
            lowerMatchesPerRound[3] = 2; // 2 partidas

            // Lower Round 4: 2 vencedores do LR3 + 1 perdedor das Quartas (Match 1) + 1 perdedor das Quartas (Match 2) + 1 perdedor das Semifinais = 5 times, ajustar para 2 partidas
            const winnersFromLowerR3 = 2;
            const perdedorQuartasMatch1 = 1; // Perdedor do Match 1 das Quartas
            const perdedorQuartasMatch2 = 1; // Perdedor do Match 2 das Quartas
            const perdedorSemifinais = 1; // Perdedor das Semifinais
            // 2 vencedores + 1 perdedor Quartas Match 1 + 1 perdedor Quartas Match 2 + 1 perdedor Semifinais = 5 times, ajustar para 4 times = 2 partidas
            lowerMatchesPerRound[4] = 2; // 2 partidas

            // Lower Final (Round 5): 2 vencedores do LR4 = 1 partida (agora é Round 5, não mais Round 6)
            lowerMatchesPerRound[5] = 1;

            lowerRounds = 5;
        } else if (numTeams === 12) {
            // Para 12 times: lógica específica
            // Lower Round 1: metade dos perdedores do Round 1 do Upper
            const totalLosersFromR1 = upperMatchesPerRound[1]; // Perdedores do Round 1 (Upper)
            const losersInLowerR1 = Math.floor(totalLosersFromR1 / 2);
            lowerMatchesPerRound[1] = Math.max(1, losersInLowerR1);

            // Lower Round 2: vencedor do Lower R1 + outra metade dos perdedores do Round 1 do Upper + perdedores do Round 2 (Match 2 e 3)
            const winnersFromLowerR1 = lowerMatchesPerRound[1] || 0;
            const losersInLowerR2 = Math.floor(totalLosersFromR1 / 2); // Outra metade dos perdedores do Round 1
            const perdedoresRound2Match23 = 2; // Perdedores do Round 2, Match 2 e 3
            const totalAtLowerR2 = winnersFromLowerR1 + losersInLowerR2 + perdedoresRound2Match23;
            // Para ter 3 partidas precisa de 6 times, ajustar conforme necessário
            lowerMatchesPerRound[2] = 3; // 3 partidas

            // Lower Round 3: vencedores do Lower R2 + perdedores das Quartas restantes
            const winnersFromLowerR2 = lowerMatchesPerRound[2] || 0;
            const perdedoresQuartasR3 = Math.floor(upperMatchesPerRound[2] / 2); // Resto dos perdedores das Quartas
            const totalAtLowerR3 = winnersFromLowerR2 + perdedoresQuartasR3;
            const calcLowerR3 = Math.max(1, Math.floor(totalAtLowerR3 / 2));
            lowerMatchesPerRound[3] = Math.max(2, calcLowerR3);

            // Lower Round 4: vencedores do Lower R3 (para 12 times, perdedor das Semifinais vai direto para Final)
            const winnersFromLowerR3 = lowerMatchesPerRound[3] || 0;
            // Para 12 times: Lower Round 4 tem apenas 1 partida (vencedores do Lower R3)
            // Perdedor das Semifinais vai direto para Lower Round 5 (Final)
            lowerMatchesPerRound[4] = 1; // 1 partida

            // Lower Final (Round 5): vencedor do Lower R4
            lowerMatchesPerRound[5] = 1;

            lowerRounds = 5;
        } else if (numTeams === 12) {
            // Estrutura customizada para 12 times (mesmo fluxo da Upper do Double Elim)
            totalRounds = 4;
            matchesPerRound[1] = 6; // Round 1 (12 times jogando)
            matchesPerRound[2] = 3; // Round 2 (3 partidas)
            matchesPerRound[3] = 1; // Round 3 (1 partida, outro time recebe BYE)
            matchesPerRound[4] = 1; // Round 4 (Final entre vencedor do Round 3 e BYE)

            const names12 = ['Round 1', 'Round 2', 'Semifinais', 'Final'];

            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                const roundTitle = names12[round - 1] || `Round ${round} (Upper)`;

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
            </div>
          `);
        } else if (numTeams === 12) {
            // Estrutura customizada para 12 times espelhando a Upper da Double Elimination
            totalRounds = 4;
            matchesPerRound[1] = 6; // Round 1 (12 times jogando)
            matchesPerRound[2] = 3; // Round 2 (3 partidas)
            matchesPerRound[3] = 1; // Round 3 (1 partida + 1 BYE)
            matchesPerRound[4] = 1; // Round 4 (Final)

            const names12 = ['Round 1', 'Round 2', 'Semifinais', 'Final'];

            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                const roundTitle = names12[round - 1] || `Round ${round} (Upper)`;

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
            </div>
          `);
        } else if (numTeams === 12) {
            // Estrutura customizada para 12 times (mesma lógica do Upper da Double Elimination)
            totalRounds = 4;
            matchesPerRound[1] = 6; // Round 1 (12 times jogando)
            matchesPerRound[2] = 3; // Round 2 (3 partidas)
            matchesPerRound[3] = 1; // Round 3 (1 partida + 1 time avançando por BYE)
            matchesPerRound[4] = 1; // Round 4 (Final)

            const names12 = ['Round 1', 'Round 2', 'Semifinais', 'Final'];

            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                const roundTitle = names12[round - 1] || `Round ${round} (Upper)`;

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
            </div>
          `);
        } else if (numTeams === 18) {
            // Para 18 times: Play-in + estrutura equivalente à chave de 16 times
            const losersUpperR1 = upperMatchesPerRound[1] || 0; // 4 partidas => 4 perdedores
            lowerMatchesPerRound[1] = 2; // 2 partidas (2 cards)

            const winnersLowerR1 = lowerMatchesPerRound[1] || 0;
            const losersUpperR2 = upperMatchesPerRound[2] || 0; // 7 perdedores das Pré-Oitavas
            lowerMatchesPerRound[2] = 4; // 4 partidas (4 cards)

            const winnersLowerR2 = lowerMatchesPerRound[2] || 0;
            const losersUpperR3 = upperMatchesPerRound[3] || 0; // 3 perdedores das Oitavas
            lowerMatchesPerRound[3] = 4; // 4 partidas (4 cards) - forçar para garantir que o quarto card seja renderizado

            const winnersLowerR3 = lowerMatchesPerRound[3] || 0;
            const losersUpperR4 = upperMatchesPerRound[4] || 0; // 2 perdedores das Semifinais do Upper
            lowerMatchesPerRound[4] = Math.max(1, Math.floor((winnersLowerR3 + losersUpperR4) / 2)); // 3 partidas

            const winnersLowerR4 = lowerMatchesPerRound[4] || 0;
            const losersUpperR5 = upperMatchesPerRound[5] || 0; // Perdedor da final do Upper
            lowerMatchesPerRound[5] = Math.max(1, Math.floor((winnersLowerR4 + losersUpperR5) / 2)); // 2 partidas

            lowerMatchesPerRound[6] = 1; // Final do Lower
            lowerRounds = 6;
        } else if (numTeams === 20) {
            // Para 20 times: lógica específica
            // Lower Round 1: metade dos perdedores do Round 1 do Upper (Pré-Oitavas)
            const totalLosersFromR1 = upperMatchesPerRound[1]; // Perdedores do Round 1 (Pré-Oitavas)
            const losersInLowerR1 = Math.floor(totalLosersFromR1 / 2);
            lowerMatchesPerRound[1] = Math.max(1, losersInLowerR1);

            // Lower Round 2: 5 caixas (partidas) conforme mapa
            const winnersFromLowerR1 = lowerMatchesPerRound[1] || 0;
            const losersInLowerR2 = Math.floor(totalLosersFromR1 / 2);
            const perdedoresOitavas = Math.floor(upperMatchesPerRound[2] / 2); // Perdedores das Oitavas (Round 2 do Upper)
            lowerMatchesPerRound[2] = 5; // 5 partidas, 5 caixas visíveis

            // Lower Round 3: 4 caixas (partidas) conforme mapa
            const winnersFromLowerR2 = lowerMatchesPerRound[2] || 0; // 5 vencedores
            const perdedoresQuartas = Math.floor(upperMatchesPerRound[3] / 2); // Perdedores das Quartas (Round 3 do Upper)
            lowerMatchesPerRound[3] = 4; // 4 partidas, 4 caixas visíveis

            // Lower Round 4: 3 caixas (partidas) conforme mapa
            const winnersFromLowerR3 = lowerMatchesPerRound[3] || 0; // 4 vencedores
            const perdedorSemifinais = 1; // Perdedor das Semifinais (Upper Round 4)
            lowerMatchesPerRound[4] = 3; // 3 partidas, 3 caixas visíveis

            // Lower Round 5: 2 caixas (partidas)
            const winnersFromLowerR4 = lowerMatchesPerRound[4] || 0; // 3 vencedores
            // 3 vencedores + 1 BYE = 4 times → 2 partidas
            const totalAtLowerR5 = winnersFromLowerR4 + 1; // +1 BYE para equilibrar
            lowerMatchesPerRound[5] = 2; // 2 partidas, 2 caixas visíveis

            // Lower Round 6: 1 partida (vencedores do Lower Round 5)
            lowerMatchesPerRound[6] = 1; // 1 partida, 1 caixa visível

            // Final do Lower (Round 7): vencedor do Lower Round 6 + perdedor da final do Upper
            lowerMatchesPerRound[7] = 1; // Final do Lower

            lowerRounds = 7;
        } else {
            // Lógica padrão para outras quantidades
            // Estrutura: Round 1 recebe metade dos perdedores do Round 1 do Upper
            // Round 2: vencedores do R1 + outra metade dos perdedores do Round 1 do Upper
            // Rounds seguintes: perdedores do Upper (rounds correspondentes) + vencedores do Lower anterior

            // Round 1 do Lower: metade dos perdedores do Round 1 do Upper jogam entre si
            const totalLosersFromR1 = upperMatchesPerRound[1]; // Total de perdedores do Round 1 do Upper
            const losersInLowerR1 = Math.floor(totalLosersFromR1 / 2); // Metade vai pro Lower Round 1
            lowerMatchesPerRound[1] = Math.max(1, losersInLowerR1);

            // Round 2 do Lower: vencedores do Lower Round 1 + outra metade dos perdedores do Round 1 do Upper
            const winnersFromLowerR1 = lowerMatchesPerRound[1] || 0;
            const losersInLowerR2 = Math.floor(totalLosersFromR1 / 2); // Outra metade vai pro Lower Round 2
            const totalAtLowerR2 = winnersFromLowerR1 + losersInLowerR2;

            // Para 16 times: Lower Round 2 tem 4 cards (2 com vencedores do LR1 + 2 com perdedores das Oitavas)
            if (numTeams === 16) {
                // 4 vencedores do Lower Round 1 = 2 partidas
                // 4 perdedores das Oitavas (Round 2 do Upper) = 2 partidas
                // Total: 4 partidas
                lowerMatchesPerRound[2] = 4;
            } else {
                lowerMatchesPerRound[2] = Math.max(1, Math.floor(totalAtLowerR2 / 2));
            }

            // Rounds do Lower que correspondem aos rounds do Upper (3 até upperRounds-1)
            // Para 8 times, vamos pular o loop e calcular manualmente
            // Para 8 times: upperRounds = 3 (Oitavas, Quartas, Semifinais)
            if (numTeams === 8 && upperRounds === 3) {
                // Para 8 times: Lower Round 3 com 1 partida
                lowerMatchesPerRound[3] = 1; // Forçar 1 partida no Lower Round 3

                // Lower Final (Round 4): vencedor do Lower R3 + perdedor das Semifinais (Upper Round 3)
                lowerMatchesPerRound[4] = 1; // Final com 1 partida

                lowerRounds = 4; // Lower Round 1, Lower Round 2, Lower Round 3 (1 partida), Final

            } else {
                // Para outros casos, usar o loop normal
                for (let r = 3; r < upperRounds; r++) {
                    // Perdedores do round r do Upper (metade dos participantes)
                    const losersFromUpper = Math.floor(upperMatchesPerRound[r] / 2);
                    // Vencedores do round anterior do Lower
                    const winnersFromLower = lowerMatchesPerRound[r - 1] || 0;
                    // Total de times neste round do Lower
                    let totalTeams = losersFromUpper + winnersFromLower;
                    // Para 14 e 16 times no Lower Round 3: adicionar mais uma caixa (partida extra)
                    if (r === 3 && (numTeams === 14 || numTeams === 16)) {
                        // Para 14 times: garantir 4 partidas (8 times)
                        if (numTeams === 14) {
                            if (totalTeams < 8) {
                                totalTeams = Math.max(8, totalTeams + 2); // Adicionar times extras para ter 4 partidas
                            }
                            lowerMatchesPerRound[r] = Math.max(4, Math.floor(totalTeams / 2)); // Garantir pelo menos 4 partidas
                        } else {
                            // Para 16 times: Lower Round 3 tem 5 cards (2 com vencedores do LR2 + 2 com perdedores das Quartas + 1 extra)
                            // 4 vencedores do Lower Round 2 = 2 partidas
                            // 4 perdedores das Quartas (Round 3 do Upper) = 2 partidas
                            // 1 card extra = 1 partida
                            // Total: 5 partidas
                            lowerMatchesPerRound[r] = 5;
                        }
                    } else {
                        lowerMatchesPerRound[r] = Math.max(1, Math.floor(totalTeams / 2));
                    }
                }

                // Round do Lower que recebe o perdedor da semifinal do Upper (apenas para casos não-8-times)
                if (numTeams !== 8 || upperRounds !== 3) {
                    // A semifinal é onde o Upper tem 2 times (round upperRounds - 1)
                    if (upperRounds >= 3) {
                        const semifinalLoser = 1; // Sempre 1 perdedor na semifinal
                        const lowerBeforeSemifinal = lowerMatchesPerRound[upperRounds - 1] || 0;
                        let totalAtSemifinal = semifinalLoser + lowerBeforeSemifinal;
                        // Para 14 times no Lower Round 4: garantir sempre 2 partidas (2 caixas)
                        if (numTeams === 14 && upperRounds === 4) {
                            // Lower Round 4 é o índice 4 (não upperRounds - 1)
                            // Recebe perdedor das semifinais (1) + vencedores do Lower Round 3 (pelo menos 3)
                            // Forçar sempre 2 partidas no Lower Round 4 (índice 4)
                            lowerMatchesPerRound[4] = 2; // Lower Round 4 (índice 4) sempre com 2 partidas
                            // Também manter o cálculo normal para o round anterior se necessário
                            lowerMatchesPerRound[upperRounds - 1] = Math.max(1, Math.floor(totalAtSemifinal / 2));
                        } else {
                            lowerMatchesPerRound[upperRounds - 1] = Math.max(1, Math.floor(totalAtSemifinal / 2));
                        }
                    } else if (upperRounds === 2) {
                        // Caso especial: se só tem 2 rounds no Upper
                        const semifinalLoser = 1;
                        const lowerBefore = lowerMatchesPerRound[2] || 0;
                        lowerMatchesPerRound[2] = Math.max(1, Math.floor((semifinalLoser + lowerBefore) / 2));
                    }

                    // Calcular rounds finais do Lower (continuando até ter 1 vencedor)
                    let currentLowerRound = upperRounds - 1;
                    if (upperRounds < 3) currentLowerRound = 2;

                    // Para 14 times: Lower Round 4 tem 2 partidas, vai para Lower Round 5, depois Final (Round 6)
                    if (numTeams === 14 && upperRounds === 4 && lowerMatchesPerRound[4] === 2) {
                        // Lower Round 4 tem 2 partidas, vencedores vão para Lower Round 5 (1 partida)
                        lowerMatchesPerRound[5] = 1; // Lower Round 5 (1 partida)
                        // Lower Round 5 vencedor + perdedor das Semifinais vão para Lower Round 6 (Final)
                        lowerMatchesPerRound[6] = 1; // Final (Lower Round 6)
                        lowerRounds = 6; // Lower Round 4 + Lower Round 5 + Final
                    } else if (numTeams === 16 && upperRounds === 4) {
                        // Para 16 times: Lower Round 3 → Lower Round 4 → Lower Round 5 → Final
                        // Lower Round 4: 1 card (1 partida)
                        lowerMatchesPerRound[4] = 1; // Lower Round 4 (1 partida)
                        // Lower Round 5: 1 card (1 partida)
                        lowerMatchesPerRound[5] = 1; // Lower Round 5 (1 partida)
                        // Final: 1 card (1 partida) - Final do Lower
                        lowerMatchesPerRound[6] = 1; // Final (1 partida)
                        lowerRounds = 6; // Lower Round 1, 2, 3, 4, 5, Final
                    } else {
                        let currentMatches = lowerMatchesPerRound[currentLowerRound] || 1;

                        // Continuar reduzindo até chegar em 1 partida
                        while (currentMatches > 1) {
                            currentLowerRound++;
                            currentMatches = Math.floor(currentMatches / 2);
                            lowerMatchesPerRound[currentLowerRound] = Math.max(1, currentMatches);
                        }

                        // Se o último round calculado tem 1 partida, adicionar um round final extra se necessário
                        if (upperRounds >= 3 && lowerMatchesPerRound[currentLowerRound] === 1 && currentLowerRound < upperRounds + 2) {
                            currentLowerRound++;
                            lowerMatchesPerRound[currentLowerRound] = 1;
                        }

                        // Garantir que o último round sempre tenha 1 partida (Final do Lower)
                        const finalLowerRound = currentLowerRound;
                        lowerMatchesPerRound[finalLowerRound] = 1;

                        lowerRounds = finalLowerRound;
                    }
                }
            }
        }

        // Nomes dos rounds Upper baseado na quantidade de rounds e times
        const getRoundNames = (rounds, numTeams) => {
            // Para diferentes quantidades de times, ajustar nomes
            if (numTeams === 6) {
                // 6 times: Round 1, Quartas, Semifinais
                return ['Round 1', 'Quartas', 'Semifinais'];
            } else if (numTeams === 8) {
                // 8 times: bracketSize 8, 3 rounds
                return ['Oitavas', 'Quartas', 'Semifinais'];
            } else if (numTeams === 10 || numTeams === 12) {
                // 10-12 times: bracketSize 16, 4 rounds (mas vamos usar Round 1, Round 2, Quartas, Semifinais)
                return ['Round 1', 'Round 2', 'Quartas', 'Semifinais'];
            } else if (numTeams === 14) {
                // 14 times: bracketSize 16, 4 rounds
                return ['Round 1', 'Oitavas', 'Quartas', 'Semifinais'];
            } else if (numTeams === 16) {
                // 16 times: bracketSize 16, 4 rounds
                // Round 1 = Round 1 (8 partidas)
                // Round 2 = Oitavas (4 partidas)
                // Round 3 = Quartas (2 partidas)
                // Round 4 = Semifinais (1 partida)
                // Final = separada
                return ['Round 1', 'Oitavas', 'Quartas', 'Semifinais'];
            } else if (numTeams === 18) {
                // 18 times: bracketSize 32, 5 rounds
                return ['Round 1', 'Pré-Oitavas', 'Oitavas', 'Quartas', 'Semifinais'];
            } else if (numTeams === 20) {
                // 20 times: bracketSize 32, 5 rounds
                return ['Round 1', 'Pré-Oitavas', 'Oitavas', 'Quartas', 'Semifinais'];
            }

            // Fallback baseado em rounds
            const namesByRounds = {
                2: ['Semifinais'],
                3: ['Quartas', 'Semifinais'],
                4: ['Oitavas', 'Quartas', 'Semifinais'],
                5: ['Pré-Oitavas', 'Oitavas', 'Quartas', 'Semifinais']
            };
            return namesByRounds[rounds] || Array.from({ length: rounds }, (_, i) =>
                `Round ${i + 1}`
            );
        };

        let upperNames = getRoundNames(upperRounds, numTeams);

        // Separar conteúdo: Upper + Grand Finals no hScrollContent, Lower em div separada
        const upperHTML = [];
        const lowerHTML = [];

        // Winner's Bracket - layout simples, apenas colunas de rounds
        // Para 6 times: Round 1 (2 partidas), Quartas (2), Semifinais (1), Final (coluna separada)
        // Para 8 times: Oitavas (4 partidas), Quartas (2), Semifinais (1), Final (coluna separada)
        // Para 16 times: Round 1 (8 partidas), Oitavas (4), Quartas (2), Semifinais (1), Final (coluna separada)
        // Para 6 times, gerar 3 rounds (Round 1, Quartas, Semifinais), depois adicionar Final separadamente
        // Para 16 times, gerar 4 rounds (Round 1, Oitavas, Quartas, Semifinais), depois adicionar Final separadamente
        const roundsToGenerate = (numTeams === 6) ? 3 : upperRounds;
        for (let round = 1; round <= roundsToGenerate; round++) {
            const matchesInRound = upperMatchesPerRound[round];
            const matchBoxes = [];
            for (let match = 1; match <= matchesInRound; match++) {
                const matchId = `upper_${round}_${match}`;
                matchBoxes.push(createMatchBox(matchId, round, upperRounds, match, format));
            }
            // Usar nomes definidos no array upperNames
            const roundTitle = upperNames[round - 1] || `Round ${round}`;
            upperHTML.push(`
          <div class="round-column">
            <div class="round-title">${roundTitle}</div>
            ${matchBoxes.join('')}
          </div>
        `);
        }

        // Sempre adicionar Final após os rounds do Upper (para todas as quantidades)
        // Para 6 times e outras quantidades, a Final é sempre uma coluna separada
        upperHTML.push(`
        <div class="round-column">
          <div class="round-title">Final</div>
          ${createMatchBox('grand_final_1', 1, 1, 1, format)}
        </div>
      `);

        // Sempre adicionar área do Campeão DEPOIS da coluna da Final (para todas as quantidades)
        upperHTML.push(`
        <div class="round-column">
          <div class="champion-box">
            <div class="champion-badge">🏆 CAMPEÃO</div>
            <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
            <div class="champion-name">Campeão</div>
          </div>
        </div>
      `);

        // Loser's Bracket (em div separada) - layout simples, apenas colunas

        // IMPORTANTE: Para 16 times, garantir que Lower Round 5 e Final estejam configurados antes da renderização
        if (numTeams === 16 && upperRounds === 4) {
            if (!lowerMatchesPerRound[5] || lowerMatchesPerRound[5] === 0) {
                lowerMatchesPerRound[5] = 1;
            }
            if (!lowerMatchesPerRound[6] || lowerMatchesPerRound[6] === 0) {
                lowerMatchesPerRound[6] = 1;
            }
            if (lowerRounds < 6) {
                lowerRounds = 6;
            }
        }
        // Para 18 times: garantir que o Lower Round 6 (Final) exista
        if (numTeams === 18 && upperRounds === 5) {
            if (!lowerMatchesPerRound[6] || lowerMatchesPerRound[6] === 0) {
                lowerMatchesPerRound[6] = 1;
            }
            if (lowerRounds < 6) {
                lowerRounds = 6;
            }
        }

        for (let round = 1; round <= lowerRounds; round++) {
            let matchesInRound = lowerMatchesPerRound[round] || 0;

            // IMPORTANTE: Para 18 times, garantir que Lower Round 3 tenha 4 cards
            if (numTeams === 18 && round === 3 && matchesInRound < 4) {
                lowerMatchesPerRound[3] = 4; // Forçar 4 partidas
                matchesInRound = 4; // Atualizar variável local
            }

            // IMPORTANTE: Para 16 times, garantir que Lower Round 5 seja renderizado mesmo se matchesInRound for 0
            if (numTeams === 16 && round === 5 && matchesInRound === 0) {
                lowerMatchesPerRound[5] = 1; // Forçar 1 partida
                matchesInRound = 1; // Atualizar variável local
            }

            if (matchesInRound > 0) {
                const matchBoxes = [];
                const partidasMap = Array.isArray(window.partidas) ? window.partidas : [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `lower_${round}_${match}`;
                    const partida = partidasMap.find(p => p.match_id === matchId);
                    matchBoxes.push(createMatchBox(matchId, round, lowerRounds, match, format));
                }
                // Para 16 e 18 times: Lower Round 6 é a Final dedicada
                let roundTitle;
                if ((numTeams === 16 || numTeams === 18) && round === 6) {
                    roundTitle = 'Final';
                } else if ((numTeams === 16 || numTeams === 18) && round === 5) {
                    roundTitle = 'Lower Round 5';
                } else {
                    roundTitle = (round === lowerRounds) ? 'Final' : `Lower Round ${round}`;
                }
                lowerHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }
        }

        // Renderizar Upper + Grand Finals
        content.innerHTML = upperHTML.join('');

        // Mostrar header do Upper Bracket
        const upperHeader = document.getElementById('upperBracketHeader');
        if (upperHeader) {
            upperHeader.style.display = 'block';
        }

        // Renderizar Lower em div separada
        const lowerContent = document.getElementById('lowerBracketContent');
        const lowerArea = document.getElementById('lowerBracketArea');
        if (lowerContent) {
            lowerContent.innerHTML = lowerHTML.join('');
        }
        if (lowerArea) {
            lowerArea.style.display = 'block';
        }

        // SVG para conexões
        let svg = content.querySelector('#connections');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'connections');
            svg.setAttribute('class', 'connections-svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            content.appendChild(svg);
        }

        // Desenhar conexões
        const drawConnections = () => {
            const rootRect = content.getBoundingClientRect();
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            // Conexões Upper Bracket
            // Para 6 times: ajustar conexões especiais (Round 1 -> Quartas -> Semifinais -> Final)
            if (numTeams === 6 && upperRounds >= 2) {
                // Round 1 -> Quartas (Round 2)
                // Jogo 1 (upper_1_1: Time 3 vs Time 6) -> Quartas 1 (upper_2_1) - vencedor vai para slot INFERIOR
                const match1R1 = content.querySelector('[data-match-id="upper_1_1"]');
                const match1R2 = content.querySelector('[data-match-id="upper_2_1"]');
                if (match1R1 && match1R2) {
                    const a = match1R1.getBoundingClientRect();
                    const b = match1R2.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height * 3 / 4; // Slot inferior da quartas
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }

                // Jogo 2 (upper_1_2: Time 4 vs Time 5) -> Quartas 2 (upper_2_2) - vencedor vai para slot INFERIOR
                const match2R1 = content.querySelector('[data-match-id="upper_1_2"]');
                const match2R2 = content.querySelector('[data-match-id="upper_2_2"]');
                if (match2R1 && match2R2) {
                    const a = match2R1.getBoundingClientRect();
                    const b = match2R2.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height * 3 / 4; // Slot inferior da quartas
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }

                // Quartas (Round 2) -> Semifinais (Round 3)
                const quartas1 = content.querySelector('[data-match-id="upper_2_1"]');
                const quartas2 = content.querySelector('[data-match-id="upper_2_2"]');
                const semifinal = content.querySelector('[data-match-id="upper_3_1"]');
                if (quartas1 && semifinal) {
                    const a = quartas1.getBoundingClientRect();
                    const b = semifinal.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height / 4; // Slot superior da semifinal
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }
                if (quartas2 && semifinal) {
                    const a = quartas2.getBoundingClientRect();
                    const b = semifinal.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height * 3 / 4; // Slot inferior da semifinal
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }

                // Semifinais (Round 3) -> Final
                const semifinalBox = content.querySelector('[data-match-id="upper_3_1"]');
                const grandFinal = content.querySelector('[data-match-id="grand_final_1"]');
                if (semifinalBox && grandFinal) {
                    const a = semifinalBox.getBoundingClientRect();
                    const b = grandFinal.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height / 2;
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }
            } else {
                // Conexões normais para outras quantidades
                for (let r = 1; r < upperRounds; r++) {
                    const matchesInRound = upperMatchesPerRound[r] || 0;
                    for (let m = 1; m <= matchesInRound; m++) {
                        const fromEl = content.querySelector(`[data-match-id="upper_${r}_${m}"]`);
                        const toIndex = Math.ceil(m / 2);
                        const toEl = content.querySelector(`[data-match-id="upper_${r + 1}_${toIndex}"]`);
                        if (!fromEl || !toEl) continue;
                        const a = fromEl.getBoundingClientRect();
                        const b = toEl.getBoundingClientRect();
                        const x1 = a.right - rootRect.left + 6;
                        const y1 = a.top - rootRect.top + a.height / 2;
                        const x2 = b.left - rootRect.left - 6;
                        const y2 = b.top - rootRect.top + b.height / 2;
                        const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('class', 'connector-path');
                        path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                        svg.appendChild(path);
                    }
                }

                // Conexão da última partida do Upper para a Final (se houver)
                if (upperRounds > 0) {
                    const lastUpperMatch = content.querySelector(`[data-match-id="upper_${upperRounds}_1"]`);
                    const grandFinal = content.querySelector('[data-match-id="grand_final_1"]');
                    if (lastUpperMatch && grandFinal) {
                        const a = lastUpperMatch.getBoundingClientRect();
                        const b = grandFinal.getBoundingClientRect();
                        const x1 = a.right - rootRect.left + 6;
                        const y1 = a.top - rootRect.top + a.height / 2;
                        const x2 = b.left - rootRect.left - 6;
                        const y2 = b.top - rootRect.top + b.height / 2;
                        const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('class', 'connector-path');
                        path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                        svg.appendChild(path);
                    }
                }
            }

            // Conexões Lower Bracket (no lowerBracketContent)
            if (lowerContent) {
                const lowerSvg = lowerContent.querySelector('#lower-connections');
                let lowerSvgEl = lowerSvg;
                if (!lowerSvgEl) {
                    lowerSvgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    lowerSvgEl.setAttribute('id', 'lower-connections');
                    lowerSvgEl.setAttribute('class', 'connections-svg');
                    lowerSvgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    lowerContent.appendChild(lowerSvgEl);
                }
                const lowerRootRect = lowerContent.getBoundingClientRect();
                while (lowerSvgEl.firstChild) lowerSvgEl.removeChild(lowerSvgEl.firstChild);

                for (let r = 1; r < lowerRounds; r++) {
                    const matchesInRound = lowerMatchesPerRound[r] || 0;
                    for (let m = 1; m <= matchesInRound; m++) {
                        const fromEl = lowerContent.querySelector(`[data-match-id="lower_${r}_${m}"]`);
                        const toIndex = Math.ceil(m / 2);
                        const toEl = lowerContent.querySelector(`[data-match-id="lower_${r + 1}_${toIndex}"]`);
                        if (fromEl && toEl) {
                            const a = fromEl.getBoundingClientRect();
                            const b = toEl.getBoundingClientRect();
                            const x1 = a.right - lowerRootRect.left + 6;
                            const y1 = a.top - lowerRootRect.top + a.height / 2;
                            const x2 = b.left - lowerRootRect.left - 6;
                            const y2 = b.top - lowerRootRect.top + b.height / 2;
                            const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('class', 'connector-path');
                            path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                            lowerSvgEl.appendChild(path);
                        }
                    }
                }
            }

            // Conexão do último round do Lower para Grand Final (linha subindo)
            // Esta conexão sai da Final do Lower e sobe até a Final do Winner's
            const lastLowerMatch = lowerContent?.querySelector(`[data-match-id="lower_${lowerRounds}_1"]`);
            const grandFinal = content.querySelector('[data-match-id="grand_final_1"]');
            if (lastLowerMatch && grandFinal) {
                // Calcular posições relativas ao viewport
                const a = lastLowerMatch.getBoundingClientRect();
                const b = grandFinal.getBoundingClientRect();

                // Converter para coordenadas relativas ao SVG do content principal
                const rootRect = content.getBoundingClientRect();
                const lowerAreaRect = lowerContent?.getBoundingClientRect();

                if (lowerAreaRect) {
                    // Ponto de saída: centro superior da Final do Lower
                    const x1 = a.left - rootRect.left + a.width / 2;
                    const y1 = a.top - rootRect.top;

                    // Ponto de chegada: centro inferior da Final do Winner's
                    const x2 = b.left - rootRect.left + b.width / 2;
                    const y2 = b.bottom - rootRect.top;

                    // Criar linha vertical que sobe (com curva suave)
                    const midY = (y1 + y2) / 2;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    // Linha que sobe: começa no topo do Lower, sobe verticalmente, depois curva para a Final
                    path.setAttribute('d', `M ${x1} ${y1} L ${x1} ${midY - 40} C ${x1} ${midY - 20}, ${x2} ${midY - 20}, ${x2} ${midY} L ${x2} ${y2}`);
                    svg.appendChild(path);
                }
            }

            // Conexão do último round do Upper para Grand Final
            const lastUpperMatch = content.querySelector(`[data-match-id="upper_${upperRounds}_1"]`);
            if (lastUpperMatch && grandFinal) {
                const a = lastUpperMatch.getBoundingClientRect();
                const b = grandFinal.getBoundingClientRect();
                const x1 = a.right - rootRect.left + 6;
                const y1 = a.top - rootRect.top + a.height / 2;
                const x2 = b.left - rootRect.left - 6;
                const y2 = b.top - rootRect.top + b.height / 2;
                const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'connector-path');
                path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                svg.appendChild(path);
            }
        };

        drawConnections();
        const area = document.querySelector('.hscroll-area');
        const lowerAreaEl = document.getElementById('lowerBracketArea');
        const listeners = [window, area, lowerAreaEl].filter(Boolean);
        listeners.forEach(el => el && el.addEventListener('scroll', drawConnections, { passive: true }));
        window.addEventListener('resize', drawConnections);
    };

    const renderBracket = (numTeams, format = 'single_b01') => {
        // Esconder Lower Bracket e Upper Header se não for Double Elimination
        const lowerArea = document.getElementById('lowerBracketArea');
        const upperHeader = document.getElementById('upperBracketHeader');
        if (lowerArea) {
            lowerArea.style.display = (format === 'double_elimination') ? 'block' : 'none';
        }
        if (upperHeader) {
            upperHeader.style.display = (format === 'double_elimination') ? 'block' : 'none';
        }

        // Se for Double Elimination, usar função específica
        if (format === 'double_elimination') {
            return renderDoubleElimination(numTeams, format);
        }

        const content = document.getElementById('hScrollContent');
        const roundsHTML = [];

        // Variáveis para drawConnections (definidas no escopo da função)
        let totalRounds;
        let matchesPerRound = [];

        // Caso especial: Major Playoffs com 8 times = apenas Semifinais + Final
        if (format === 'major_playoffs_bo3' && numTeams === 8) {
            totalRounds = 2;
            matchesPerRound[1] = 2; // Semifinais
            matchesPerRound[2] = 1; // Final

            // Semifinais (2 partidas)
            const sfBoxes = [];
            for (let m = 1; m <= 2; m++) {
                sfBoxes.push(createMatchBox(`upper_1_${m}`, 1, 2, m, format));
            }
            roundsHTML.push(`
          <div class="round-column">
            <div class="round-title">Semifinais</div>
            ${sfBoxes.join('')}
          </div>
        `);

            // Final (1 partida)
            roundsHTML.push(`
          <div class="round-column">
            <div class="round-title">Final</div>
            ${createMatchBox('upper_2_1', 2, 2, 1, format)}
          </div>
        `);
        } else if (numTeams === 12) {
            // Estrutura customizada para 12 times (espelhando a Upper da Double Elimination)
            totalRounds = 4;
            matchesPerRound[1] = 6; // Round 1 (12 times jogando)
            matchesPerRound[2] = 3; // Round 2 (3 partidas)
            matchesPerRound[3] = 1; // Round 3 (1 partida + 1 time avança por BYE)
            matchesPerRound[4] = 1; // Round 4 (Final)

            const names12 = ['Round 1', 'Round 2', 'Semifinais', 'Final'];

            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                const roundTitle = names12[round - 1] || `Round ${round} (Upper)`;

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
            </div>
          `);
        } else if (numTeams === 18) {
            // Estrutura customizada para 18 times (espelhando a Upper da Double Elim)
            totalRounds = 5;
            matchesPerRound[1] = 4; // Play-in
            matchesPerRound[2] = 7; // Pré-Oitavas
            matchesPerRound[3] = 3; // Oitavas
            matchesPerRound[4] = 2; // Quartas
            matchesPerRound[5] = 1; // Final

            const names18 = ['Play-in', 'Pré-Oitavas', 'Oitavas', 'Quartas', 'Final'];

            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                const roundTitle = names18[round - 1] || `Round ${round} (Upper)`;

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
          </div>
        `);
        } else {
            // Lógica normal para outros casos
            // Calcular tamanho do bracket (próxima potência de 2)
            let bracketSize = 1;
            while (bracketSize < numTeams) bracketSize *= 2;

            // Calcular número de rounds
            totalRounds = Math.log2(bracketSize);

            // Cálculo de BYEs e partidas por round (para 12 times: 4,4,2,1)
            const byes = bracketSize - numTeams; // ex.: 16-12 = 4
            matchesPerRound[1] = Math.ceil((numTeams - byes) / 2); // ex.: (12-4)/2 = 4
            for (let r = 2; r <= totalRounds; r++) {
                if (r === 2) {
                    const teamsR2 = byes + matchesPerRound[1]; // ex.: 4 + 4 = 8
                    matchesPerRound[r] = Math.floor(teamsR2 / 2); // 4
                } else {
                    matchesPerRound[r] = Math.floor(matchesPerRound[r - 1] / 2);
                }
            }

            // Nomes dos rounds (custom)
            const names3 = ['Quartas', 'Semifinais', 'Final'];
            const names4 = ['Oitavas', 'Quartas', 'Semifinais', 'Final'];
            const names5 = ['Pré-Oitavas', 'Oitavas', 'Quartas', 'Semifinais', 'Final'];

            // Gerar cada round
            for (let round = 1; round <= totalRounds; round++) {
                const matchesInRound = matchesPerRound[round];
                const matchBoxes = [];

                for (let match = 1; match <= matchesInRound; match++) {
                    const matchId = `upper_${round}_${match}`;
                    matchBoxes.push(createMatchBox(matchId, round, totalRounds, match, format));
                }

                let roundTitle;
                if (totalRounds === 3) {
                    roundTitle = names3[round - 1];
                } else if (totalRounds === 4) {
                    roundTitle = names4[round - 1];
                } else if (totalRounds === 5) {
                    roundTitle = names5[round - 1];
                } else if (round === totalRounds) {
                    roundTitle = 'Final';
                } else {
                    roundTitle = `Round ${round} (Upper)`;
                }

                roundsHTML.push(`
            <div class="round-column">
              <div class="round-title">${roundTitle}</div>
              ${matchBoxes.join('')}
            </div>
          `);
            }

            // Adicionar champion box após a final
            roundsHTML.push(`
            <div class="round-column">
              <div class="champion-box">
                <div class="champion-badge">🏆 CAMPEÃO</div>
                <img src="https://cdn-icons-png.flaticon.com/128/5726/5726775.png" class="champion-logo" alt="Campeão" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                <div class="champion-name">Campeão</div>
              </div>
            </div>
          `);
        }

        // Render rounds
        content.innerHTML = roundsHTML.join('');

        // Adicionar camada SVG para conexões
        let svg = content.querySelector('#connections');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'connections');
            svg.setAttribute('class', 'connections-svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            content.appendChild(svg);
        }

        // Desenhar conexões entre rounds (usa totalRounds e matchesPerRound do escopo externo)
        const drawConnections = () => {
            if (!totalRounds || !matchesPerRound || matchesPerRound.length === 0) return;
            const rootRect = content.getBoundingClientRect();
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            for (let r = 1; r < totalRounds; r++) {
                const matchesInRound = matchesPerRound[r] || 0;
                for (let m = 1; m <= matchesInRound; m++) {
                    const fromEl = content.querySelector(`[data-match-id="upper_${r}_${m}"]`);
                    const toIndex = Math.ceil(m / 2);
                    const toEl = content.querySelector(`[data-match-id="upper_${r + 1}_${toIndex}"]`);
                    if (!fromEl || !toEl) continue;
                    const a = fromEl.getBoundingClientRect();
                    const b = toEl.getBoundingClientRect();
                    const x1 = a.right - rootRect.left + 6;
                    const y1 = a.top - rootRect.top + a.height / 2;
                    const x2 = b.left - rootRect.left - 6;
                    const y2 = b.top - rootRect.top + b.height / 2;
                    const dx = Math.max(60, Math.min(140, (x2 - x1) * 0.5));
                    const c1x = x1 + dx, c1y = y1, c2x = x2 - dx, c2y = y2;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('class', 'connector-path');
                    path.setAttribute('d', `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`);
                    svg.appendChild(path);
                }
            }
        };

        drawConnections();
        const area = document.querySelector('.hscroll-area');
        const listeners = [window, area];
        listeners.forEach(el => el && el.addEventListener('scroll', drawConnections, { passive: true }));
        window.addEventListener('resize', drawConnections);
    };

    // Tornar renderBracket acessível globalmente logo após sua definição
    window.renderBracket = renderBracket;

    // Inicializar sistema de resultados apenas quando o DOM estiver pronto
    // Mover para depois que o bracket for renderizado
    window.inicializarSistemaResultados = async function () {
        debugChaveamentoEtapa('sistema-resultados-start', {
            temPendentes: Boolean(window.dadosChaveamentoPendentes),
            chaveamentoIdAtual,
            campeonatoIdAtual
        });
        // Se houver dados de chaveamento pendentes, atualizar o bracket
        if (window.dadosChaveamentoPendentes) {
            try {
                await atualizarBracketComDadosDoBanco(window.dadosChaveamentoPendentes);
                debugChaveamentoEtapa('sistema-resultados-pendentes-aplicados', {
                    partidas: window.dadosChaveamentoPendentes?.partidas?.length || 0
                });
                window.dadosChaveamentoPendentes = null; // Limpar após atualizar
            } catch (error) {
                console.error('Erro ao atualizar bracket com dados pendentes:', error);
                debugChaveamentoEtapa('sistema-resultados-pendentes-erro', {
                    erro: error?.message
                });
            }
        }
        try {
            // Sistema de gerenciamento de resultados (híbrido: banco + localStorage como fallback)
            const resultadosStorage = {
                // Obter resultados salvos (primeiro do banco, depois localStorage como fallback)
                get: () => {
                    try {
                        // Se não houver chaveamento no banco, usar localStorage
                        if (!chaveamentoIdAtual) {
                            return obterResultadosLocais();
                        }
                        // Caso contrário, retornar objeto vazio (resultados serão carregados do banco)
                        return {};
                    } catch (error) {
                        return {};
                    }
                },
                // Salvar resultado (banco se disponível, senão localStorage)
                save: async (matchId, resultado) => {
                    try {
                        // Se houver chaveamento no banco, salvar no banco
                        if (chaveamentoIdAtual) {
                            // Obter informações dos times do match box
                            const matchBox = document.querySelector(`[data-match-id="${matchId}"]`);
                            if (!matchBox) {
                                console.warn('Match box não encontrado para:', matchId);
                                return;
                            }

                            const time1Row = matchBox.querySelector('.team-row[data-team="1"]');
                            const time2Row = matchBox.querySelector('.team-row[data-team="2"]');

                            if (!time1Row || !time2Row) {
                                console.warn('Times não encontrados no match box:', matchId);
                                return;
                            }

                            const time1Nome = time1Row.querySelector('.team-name')?.textContent;
                            const time2Nome = time2Row.querySelector('.team-name')?.textContent;

                            // Função para limpar nome do time (remover emojis e espaços extras)
                            const limparNomeTime = (nome) => {
                                if (!nome) return '';
                                // Remover emojis comuns usados no sistema (✅, 🔻, ❌, ⬆️, 🏆)
                                return nome.replace(/[✅🔻❌⬆️🏆]/g, '').trim();
                            };

                            // Buscar IDs dos times (limpar nomes antes de buscar)
                            const time1Id = await obterTimeIdPorNome(limparNomeTime(time1Nome));
                            const time2Id = await obterTimeIdPorNome(limparNomeTime(time2Nome));

                            if (!time1Id || !time2Id) {
                                console.warn('IDs dos times não encontrados. Usando localStorage como fallback.');
                                // Fallback para localStorage
                                registrarResultadoLocal(matchId, resultado);
                                atualizarDisponibilidadeBotaoEmbaralhar();
                                return;
                            }

                            // Determinar qual time venceu
                            const timeVencedorId = resultado.winner === 1 ? time1Id : time2Id;
                            const timePerdedorId = resultado.winner === 1 ? time2Id : time1Id;

                            debugChaveamentoEtapa('salvar-resultado-match', {
                                matchId,
                                winnerSlot: resultado.winner,
                                time1Id,
                                time2Id,
                                timeVencedorId,
                                timePerdedorId
                            });

                            // Obter placar se for MD3
                            const score1 = resultado.score1 !== undefined ? resultado.score1 : (resultado.winner === 1 ? 1 : 0);
                            const score2 = resultado.score2 !== undefined ? resultado.score2 : (resultado.winner === 2 ? 1 : 0);

                            // Salvar no banco (enviar também os IDs dos dois times para criar/atualizar a partida)
                            await salvarResultadoPartidaNoBanco(chaveamentoIdAtual, matchId, timeVencedorId, time1Id, time2Id, score1, score2);
                            marcarResultadosRegistrados();

                            // Atualizar classificação final para Single Elimination
                            const formatSelect = document.getElementById('formatSelect');
                            const currentFormat = formatSelect ? formatSelect.value : 'single_b01';
                            const isSingleElimination = currentFormat === 'single_b01' || currentFormat === 'single_bo3_all';
                            
                            if (isSingleElimination && timePerdedorId) {
                                // Verificar se não é a final (na final, o perdedor fica em 2º lugar)
                                const lowerBracketArea = document.getElementById('lowerBracketArea');
                                const isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';
                                
                                if (!isDoubleElimination) {
                                    // Calcular se é a final
                                    let isFinal = false;
                                    if (window.numTeams) {
                                        let bracketSize = 1;
                                        while (bracketSize < window.numTeams) bracketSize *= 2;
                                        const totalRounds = Math.log2(bracketSize);
                                        const matchParts = matchId.split('_');
                                        const roundNum = parseInt(matchParts[1]) || 0;
                                        isFinal = (roundNum === totalRounds);
                                    }
                                    
                                    // Se não for a final, adicionar à classificação
                                    if (!isFinal) {
                                        await adicionarTimeEliminadoAClassificacao(matchId, timePerdedorId, time1Nome, time2Nome, resultado.winner);
                                    }
                                }
                            }

                            // Recarregar dados do banco após salvar qualquer resultado (não apenas final)
                            if (chaveamentoIdAtual && campeonatoIdAtual) {
                                setTimeout(async () => {
                                    try {
                                        const dadosAtualizados = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                                        if (dadosAtualizados && dadosAtualizados.partidas) {
                                            await atualizarBracketComDadosDoBanco(dadosAtualizados);
                                        }
                                    } catch (error) {
                                        console.error('Erro ao recarregar chaveamento:', error);
                                    }
                                }, 1500);
                            }

                            // Verificar se é a final (grand_final_1 para Double Elimination ou upper_X_1 para Single Elimination)
                            const isGrandFinal = matchId === 'grand_final_1';
                            const isFinalSingleElim = matchId.startsWith('upper_') && matchId.endsWith('_1');

                            // Para Single Elimination, verificar se é o último round
                            let isFinalSingleElimConfirmed = false;
                            if (isFinalSingleElim && !isGrandFinal) {
                                // Verificar se há lower bracket (se não houver, é Single Elimination)
                                const lowerBracketArea = document.getElementById('lowerBracketArea');
                                const isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';

                                if (!isDoubleElimination) {
                                    // É Single Elimination, verificar se é o último round
                                    // Calcular o último round baseado no número de times
                                    if (window.numTeams) {
                                        let bracketSize = 1;
                                        while (bracketSize < window.numTeams) bracketSize *= 2;
                                        const totalRounds = Math.log2(bracketSize);
                                        const matchParts = matchId.split('_');
                                        const roundNum = parseInt(matchParts[1]) || 0;
                                        isFinalSingleElimConfirmed = (roundNum === totalRounds);
                                    }
                                }
                            }

                            // Se for a final (Double ou Single Elimination), atualizar champion-box e carrossel
                            if (isGrandFinal || isFinalSingleElimConfirmed) {
                                // Função para atualizar champion box
                                const atualizarChampionBoxComRetry = async (tentativa = 1) => {
                                    try {
                                        const dadosAtualizados = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                                        if (dadosAtualizados && dadosAtualizados.partidas) {
                                            await atualizarChampionBox(dadosAtualizados.partidas);

                                            // Verificar se o champion box foi atualizado (se não, tentar novamente)
                                            const championBox = document.querySelector('.champion-box');
                                            if (championBox) {
                                                const championName = championBox.querySelector('.champion-name');
                                                if (championName && championName.textContent === 'Campeão' && tentativa < 3) {
                                                    setTimeout(() => atualizarChampionBoxComRetry(tentativa + 1), 2000);
                                                    return;
                                                }
                                            }
                                        }

                                        // Atualizar carrossel para destacar o vencedor
                                        if (typeof window.atualizarCarrosselComVencedor === 'function') {
                                            await window.atualizarCarrosselComVencedor();
                                        } else {
                                            // Fallback: atualizar manualmente
                                            const track = document.getElementById('carouselTrack');
                                            if (track) {
                                                const vencedorId = timeVencedorId;
                                                track.querySelectorAll('.carousel-item').forEach(item => {
                                                    const timeId = item.getAttribute('data-time-id');
                                                    if (timeId && vencedorId && timeId == vencedorId) {
                                                        item.classList.add('carousel-winner');
                                                    } else {
                                                        item.classList.remove('carousel-winner');
                                                    }
                                                });
                                            }
                                        }
                                    } catch (error) {
                                        console.error('Erro ao atualizar champion-box após salvar resultado:', error);
                                        if (tentativa < 3) {
                                            setTimeout(() => atualizarChampionBoxComRetry(tentativa + 1), 2000);
                                        }
                                    }
                                };

                                // Primeira tentativa após 1 segundo
                                setTimeout(() => atualizarChampionBoxComRetry(1), 1000);

                                // Segunda tentativa após 3 segundos (caso a primeira falhe)
                                setTimeout(() => atualizarChampionBoxComRetry(2), 3000);
                            }

                            // Também salvar no localStorage como backup
                            const results = obterResultadosLocais();
                            results[matchId] = resultado;
                            salvarResultadosLocais(results);
                            atualizarDisponibilidadeBotaoEmbaralhar();
                        } else {
                            // Se não houver chaveamento no banco, usar localStorage
                            registrarResultadoLocal(matchId, resultado);
                            atualizarDisponibilidadeBotaoEmbaralhar();
                        }
                    } catch (error) {
                        console.error('Erro ao salvar resultado:', error);
                        // Fallback para localStorage
                        try {
                            registrarResultadoLocal(matchId, resultado);
                            atualizarDisponibilidadeBotaoEmbaralhar();
                        } catch (e) {
                            console.error('Erro ao salvar no localStorage:', e);
                        }
                    }
                },
                // Obter resultado de uma partida específica
                getMatch: (matchId) => {
                    try {
                        // Primeiro tentar do localStorage (pode ter sido carregado do banco)
                        const results = resultadosStorage.get();
                        return results[matchId] || null;
                    } catch (error) {
                        return null;
                    }
                }
            };

            // Função para atualizar visual do card com resultado
            const atualizarCardResultado = (matchBox, resultado) => {
                try {
                    if (!matchBox || !resultado) return;

                    const teamRows = matchBox.querySelectorAll('.team-row');
                    if (!teamRows || teamRows.length === 0) return;

                    const winnerTeam = resultado.winner; // 1 ou 2
                    const score1 = resultado.score1 !== undefined ? resultado.score1 : (winnerTeam === 1 ? 1 : 0);
                    const score2 = resultado.score2 !== undefined ? resultado.score2 : (winnerTeam === 2 ? 1 : 0);
                    const format = resultado.format || 'MD1';

                    // Verificar se é Double Elimination (verificar se existe Lower Bracket)
                    let isDoubleElimination = false;
                    try {
                        const lowerBracketArea = document.getElementById('lowerBracketArea');
                        isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';
                    } catch (e) {
                        // Ignorar erro
                    }

                    // Verificar se é partida do Upper Bracket (não é Lower Bracket)
                    const matchId = matchBox.getAttribute('data-match-id') || '';
                    const isUpperBracket = !matchId.startsWith('lower_');
                    const isLowerBracket = matchId.startsWith('lower_');
                    const isGrandFinal = matchId === 'grand_final_1';

                    // Verificar se é a final do Single Elimination (último round do upper bracket)
                    let isFinalSingleElim = false;
                    if (!isGrandFinal && matchId.startsWith('upper_')) {
                        // Verificar se há lower bracket (se não houver, é Single Elimination)
                        const lowerBracketArea = document.getElementById('lowerBracketArea');
                        const isDoubleElimination = lowerBracketArea && lowerBracketArea.style.display !== 'none';

                        if (!isDoubleElimination) {
                            // É Single Elimination, verificar se é o último round
                            const quantidadeTimes = window.dadosChaveamento?.quantidade_times || window.numTeams || 8;
                            if (quantidadeTimes) {
                                let bracketSize = 1;
                                while (bracketSize < quantidadeTimes) bracketSize *= 2;
                                const totalRounds = Math.log2(bracketSize);
                                const matchParts = matchId.split('_');
                                const roundNum = parseInt(matchParts[1]) || 0;
                                isFinalSingleElim = (roundNum === totalRounds);
                            }
                        }
                    }

                    const isFinal = isGrandFinal || isFinalSingleElim;

                    teamRows.forEach((row, index) => {
                        try {
                            const teamNum = index + 1;
                            const scoreInput = row.querySelector('.score-input');
                            const winnerCheck = row.querySelector('.winner-check');
                            const teamName = row.querySelector('.team-name');

                            // Criar ou obter indicador de perdedor (❌)
                            let loserIndicator = row.querySelector('.loser-indicator');
                            if (!loserIndicator && teamName) {
                                loserIndicator = document.createElement('span');
                                loserIndicator.className = 'loser-indicator';
                                loserIndicator.style.marginLeft = '8px';
                                loserIndicator.style.fontSize = '1rem';
                                teamName.appendChild(loserIndicator);
                            }

                            if (teamNum === winnerTeam) {
                                // Time vencedor
                                if (scoreInput) {
                                    if (format === 'MD3') {
                                        scoreInput.value = teamNum === 1 ? score1 : score2;
                                    } else {
                                        scoreInput.value = '1';
                                    }
                                }
                                if (winnerCheck) {
                                    // Se for a final (Double ou Single Elimination), mostrar troféu 🏆, senão mostrar ✅
                                    winnerCheck.textContent = isFinal ? '🏆' : '✅';
                                    winnerCheck.style.display = 'inline';
                                }
                                // Esconder indicador de perdedor
                                if (loserIndicator) {
                                    loserIndicator.style.display = 'none';
                                }

                                // Se for a final (Double ou Single Elimination), adicionar classe de efeito no slot inteiro do vencedor
                                if (isFinal) {
                                    row.classList.add('winner-final-slot');
                                    row.classList.remove('loser-slot');
                                    if (teamName) {
                                        teamName.classList.add('winner-final-name');
                                        teamName.classList.remove('loser-name');
                                    }
                                }

                                // Determinar se é a Final do Lower Bracket baseado na quantidade de times
                                // IMPORTANTE: Verificar APENAS pelo match_id para evitar falsos positivos
                                const quantidadeTimesAtual = window.dadosChaveamento?.quantidade_times || window.numTeams || 8;

                                let isLowerFinalAtual = false;
                                if (quantidadeTimesAtual === 6) {
                                    isLowerFinalAtual = matchId === 'lower_4_1';
                                } else if (quantidadeTimesAtual === 10 || quantidadeTimesAtual === 12) {
                                    isLowerFinalAtual = matchId === 'lower_5_1';
                                } else if (quantidadeTimesAtual === 14) {
                                    isLowerFinalAtual = matchId === 'lower_6_1';
                                } else if (quantidadeTimesAtual === 16) {
                                    isLowerFinalAtual = matchId === 'lower_6_1';
                                } else if (quantidadeTimesAtual === 18) {
                                    isLowerFinalAtual = matchId === 'lower_6_1';
                                } else {
                                    isLowerFinalAtual = matchId === 'lower_4_1';
                                }

                                // Se for a final do Lower Bracket, mostrar emoji ⬆️ indicando que vai para Grand Final
                                if (isLowerBracket && isLowerFinalAtual) {
                                    let upperIndicator = row.querySelector('.upper-indicator');
                                    if (!upperIndicator && teamName) {
                                        upperIndicator = document.createElement('span');
                                        upperIndicator.className = 'upper-indicator';
                                        upperIndicator.style.marginLeft = '8px';
                                        upperIndicator.style.fontSize = '1rem';
                                        teamName.appendChild(upperIndicator);
                                    }
                                    if (upperIndicator) {
                                        upperIndicator.textContent = '⬆️';
                                        upperIndicator.style.display = 'inline';
                                    }
                                } else {
                                    // IMPORTANTE: Esconder indicador de Upper se não for a final do Lower
                                    // Isso garante que o emoji não apareça em rounds intermediários
                                    const upperIndicator = row.querySelector('.upper-indicator');
                                    if (upperIndicator) {
                                        upperIndicator.style.display = 'none';
                                    }
                                }

                                row.style.background = 'rgba(0, 212, 255, 0.15)';
                            } else {
                                // Time perdedor
                                if (scoreInput) {
                                    if (format === 'MD3') {
                                        scoreInput.value = teamNum === 1 ? score1 : score2;
                                    } else {
                                        scoreInput.value = '0';
                                    }
                                }
                                if (winnerCheck) {
                                    winnerCheck.style.display = 'none';
                                }

                                // Mostrar emoji ❌ para perdedor no Lower Bracket ou na final do Winner's Bracket
                                if (loserIndicator) {
                                    if (isLowerBracket || isGrandFinal) {
                                        // No Lower Bracket ou na final do Winner's Bracket, mostrar ❌ para perdedor
                                        loserIndicator.textContent = '❌';
                                        loserIndicator.style.display = 'inline';
                                    } else {
                                        // No resto do Upper Bracket, não mostrar ❌
                                        loserIndicator.style.display = 'none';
                                    }
                                }

                                // Adicionar classe para texto riscado nos perdedores
                                if (teamName) {
                                    if (isLowerBracket || isGrandFinal) {
                                        // No Lower Bracket ou na final do Winner's Bracket, riscar o nome do perdedor
                                        teamName.classList.add('loser-name');
                                        teamName.classList.remove('winner-final-name');
                                    } else {
                                        // No resto do Upper Bracket, remover classe de perdedor
                                        teamName.classList.remove('loser-name');
                                    }
                                }

                                row.style.background = 'rgba(255,255,255,0.04)';

                                // Verificar se é Single Elimination
                                const lowerBracketArea = document.getElementById('lowerBracketArea');
                                const isDoubleEliminationCheck = lowerBracketArea && lowerBracketArea.style.display !== 'none';

                                // Se for Double Elimination e for Upper Bracket (mas não a final), mostrar emoji 🔻
                                if (isDoubleEliminationCheck && isUpperBracket && !isGrandFinal) {
                                    // Verificar se já tem o emoji, se não, adicionar
                                    let lowerIndicator = row.querySelector('.lower-indicator');
                                    if (!lowerIndicator && teamName) {
                                        lowerIndicator = document.createElement('span');
                                        lowerIndicator.className = 'lower-indicator';
                                        lowerIndicator.style.marginLeft = '8px';
                                        lowerIndicator.style.fontSize = '1rem';
                                        teamName.appendChild(lowerIndicator);
                                    }
                                    if (lowerIndicator) {
                                        lowerIndicator.textContent = '🔻';
                                        lowerIndicator.style.display = 'inline';
                                    }
                                }
                                // Se for Single Elimination e for Upper Bracket (mas não a final), mostrar emoji ❌
                                else if (!isDoubleEliminationCheck && isUpperBracket && !isFinal) {
                                    // Verificar se já tem o emoji, se não, adicionar
                                    let lowerIndicator = row.querySelector('.lower-indicator');
                                    if (!lowerIndicator && teamName) {
                                        lowerIndicator = document.createElement('span');
                                        lowerIndicator.className = 'lower-indicator';
                                        lowerIndicator.style.marginLeft = '8px';
                                        lowerIndicator.style.fontSize = '1rem';
                                        teamName.appendChild(lowerIndicator);
                                    }
                                    if (lowerIndicator) {
                                        lowerIndicator.textContent = '❌';
                                        lowerIndicator.style.display = 'inline';
                                    }
                                } else {
                                    // Se for Lower Bracket ou for a final, esconder o emoji
                                    const lowerIndicator = row.querySelector('.lower-indicator');
                                    if (lowerIndicator) {
                                        lowerIndicator.style.display = 'none';
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('Erro ao atualizar linha do time:', e);
                        }
                    });
                } catch (e) {
                    console.error('Erro ao atualizar card resultado:', e);
                }
            };

            // Função para carregar resultados salvos e atualizar cards
            const carregarResultadosSalvos = () => {
                try {
                    const results = resultadosStorage.get();
                    if (!results || Object.keys(results).length === 0) return;

                    Object.keys(results).forEach(matchId => {
                        try {
                            const matchBox = document.querySelector(`[data-match-id="${matchId}"]`);
                            if (matchBox) {
                                atualizarCardResultado(matchBox, results[matchId]);
                            }
                        } catch (e) {
                            console.warn(`Erro ao carregar resultado para ${matchId}:`, e);
                        }
                    });
                } catch (e) {
                    console.warn('Erro ao carregar resultados salvos:', e);
                }
            };

            // Função para abrir modal de resultado MD1
            const abrirModalResultadoMD1 = async (matchBox) => {
                try {
                    if (!matchBox) return;

                    const matchId = matchBox.getAttribute('data-match-id');
                    if (!matchId) return;

                    // Buscar resultado salvo (primeiro do banco se disponível, senão do localStorage)
                    let resultadoSalvo = null;
                    if (chaveamentoIdAtual && campeonatoIdAtual) {
                        try {
                            // Tentar buscar do banco primeiro
                            const dadosChaveamento = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                            if (dadosChaveamento && dadosChaveamento.partidas) {
                                const partida = dadosChaveamento.partidas.find(p => p.match_id === matchId);
                                if (partida && partida.time_vencedor_id && partida.status === 'finalizada') {
                                    // Determinar qual time venceu (1 ou 2)
                                    const time1Id = partida.time1_id;
                                    const time2Id = partida.time2_id;
                                    const vencedorId = partida.time_vencedor_id;
                                    const winner = (time1Id && vencedorId == time1Id) ? 1 : 2;
                                    resultadoSalvo = {
                                        winner: winner,
                                        score1: partida.score_time1 || (winner === 1 ? 1 : 0),
                                        score2: partida.score_time2 || (winner === 2 ? 1 : 0),
                                        format: partida.formato_partida === 'B03' ? 'MD3' : 'MD1'
                                    };
                                }
                            }
                        } catch (error) {
                            console.warn('Erro ao buscar resultado do banco, usando localStorage:', error);
                            resultadoSalvo = resultadosStorage.getMatch(matchId);
                        }
                    } else {
                        resultadoSalvo = resultadosStorage.getMatch(matchId);
                    }

                    const teamRows = matchBox.querySelectorAll('.team-row');
                    if (!teamRows || teamRows.length < 2) return;

                    const time1Row = teamRows[0];
                    const time2Row = teamRows[1];

                    const time1NomeEl = time1Row.querySelector('.team-name');
                    const time1LogoEl = time1Row.querySelector('.team-logo');
                    const time2NomeEl = time2Row.querySelector('.team-name');
                    const time2LogoEl = time2Row.querySelector('.team-logo');

                    if (!time1NomeEl || !time1LogoEl || !time2NomeEl || !time2LogoEl) return;

                    const time1Nome = time1NomeEl.textContent;
                    const time1Logo = time1LogoEl.src;
                    const time2Nome = time2NomeEl.textContent;
                    const time2Logo = time2LogoEl.src;

                    const modal = document.getElementById('modalResultado');
                    const modalContent = document.getElementById('modalResultadoContent');
                    const modalTitle = document.getElementById('modalResultadoTitle');

                    if (!modal || !modalContent || !modalTitle) return;

                    modalTitle.textContent = 'Resultado da Partida (MD1)';

                    // Determinar qual time está selecionado (se houver)
                    const winnerSelected = resultadoSalvo ? resultadoSalvo.winner : null;

                    // Mensagem indicando se há resultado salvo
                    const mensagemResultado = resultadoSalvo
                        ? `<p style="color: #00d4ff; text-align: center; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 600;">
                     ⚠️ Resultado já salvo. Clique em outro time para alterar.
                   </p>`
                        : '';

                    modalContent.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
            ${mensagemResultado}
            <p style="color: #9ddfff; text-align: center; margin: 0;">Selecione o time vencedor:</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <!-- Time 1 -->
              <div class="team-result-option" data-team="1" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: ${winnerSelected === 1 ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.05)'};
                border: 2px solid ${winnerSelected === 1 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <img src="${time1Logo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="${time1Nome}">
                  <span style="color: #fff; font-weight: 600; font-size: 1.1rem;">${time1Nome}</span>
                </div>
                <button class="btn-winner" data-team="1" style="
                  background: ${winnerSelected === 1 ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)'};
                  color: ${winnerSelected === 1 ? '#001219' : '#9ddfff'};
                  border: none;
                  border-radius: 50%;
                  width: 50px;
                  height: 50px;
                  font-size: 1.5rem;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">✅</button>
              </div>

              <!-- Time 2 -->
              <div class="team-result-option" data-team="2" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: ${winnerSelected === 2 ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.05)'};
                border: 2px solid ${winnerSelected === 2 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
              ">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <img src="${time2Logo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="${time2Nome}">
                  <span style="color: #fff; font-weight: 600; font-size: 1.1rem;">${time2Nome}</span>
                </div>
                <button class="btn-winner" data-team="2" style="
                  background: ${winnerSelected === 2 ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)'};
                  color: ${winnerSelected === 2 ? '#001219' : '#9ddfff'};
                  border: none;
                  border-radius: 50%;
                  width: 50px;
                  height: 50px;
                  font-size: 1.5rem;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">✅</button>
              </div>
            </div>
          </div>
        `;

                    // Adicionar event listeners aos botões
                    modalContent.querySelectorAll('.btn-winner, .team-result-option').forEach(element => {
                        element.addEventListener('click', async (e) => {
                            try {
                                const teamNum = parseInt(element.getAttribute('data-team') || element.closest('[data-team]')?.getAttribute('data-team'));
                                if (!teamNum) return;

                                // Desabilitar botões durante o salvamento
                                modalContent.querySelectorAll('.btn-winner, .team-result-option').forEach(btn => {
                                    btn.style.pointerEvents = 'none';
                                    btn.style.opacity = '0.6';
                                });

                                // Salvar resultado (agora é async)
                                await resultadosStorage.save(matchId, { winner: teamNum, format: 'MD1' });

                                // Atualizar card
                                atualizarCardResultado(matchBox, { winner: teamNum });

                                // Fechar modal
                                if (modal) modal.style.display = 'none';

                                // Recarregar dados do banco para atualizar posições dos times
                                if (chaveamentoIdAtual && campeonatoIdAtual) {
                                    setTimeout(async () => {
                                        try {
                                            const dadosAtualizados = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                                            if (dadosAtualizados && dadosAtualizados.partidas) {
                                                // Atualizar bracket visualmente com os dados atualizados
                                                await atualizarBracketComDadosDoBanco(dadosAtualizados);
                                                // Atualizar champion-box se houver vencedor da final
                                                await atualizarChampionBox(dadosAtualizados.partidas);
                                            }
                                        } catch (error) {
                                            console.warn('Erro ao recarregar chaveamento:', error);
                                        }
                                    }, 1500); // Aumentar delay para garantir que backend processou tudo
                                }
                            } catch (e) {
                                console.warn('Erro ao processar clique no botão de resultado:', e);
                                // Reabilitar botões em caso de erro
                                modalContent.querySelectorAll('.btn-winner, .team-result-option').forEach(btn => {
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.opacity = '1';
                                });
                            }
                        });
                    });

                    // Garantir que os event listeners estejam configurados
                    configurarModalClose();

                    // Mostrar modal
                    modal.style.display = 'block';
                } catch (e) {
                    console.error('Erro ao abrir modal de resultado MD1:', e);
                }
            };

            // Função para abrir modal de resultado MD3
            const abrirModalResultadoMD3 = async (matchBox) => {
                try {
                    if (!matchBox) return;

                    const matchId = matchBox.getAttribute('data-match-id');
                    if (!matchId) return;

                    // Buscar resultado salvo (primeiro do banco se disponível, senão do localStorage)
                    let resultadoSalvo = null;
                    if (chaveamentoIdAtual && campeonatoIdAtual) {
                        try {
                            // Tentar buscar do banco primeiro
                            const dadosChaveamento = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                            if (dadosChaveamento && dadosChaveamento.partidas) {
                                const partida = dadosChaveamento.partidas.find(p => p.match_id === matchId);
                                if (partida && partida.time_vencedor_id && partida.status === 'finalizada') {
                                    // Determinar qual time venceu (1 ou 2)
                                    const time1Id = partida.time1_id;
                                    const time2Id = partida.time2_id;
                                    const vencedorId = partida.time_vencedor_id;
                                    const winner = (time1Id && vencedorId == time1Id) ? 1 : 2;
                                    resultadoSalvo = {
                                        winner: winner,
                                        score1: partida.score_time1 || (winner === 1 ? 1 : 0),
                                        score2: partida.score_time2 || (winner === 2 ? 1 : 0),
                                        format: partida.formato_partida === 'B03' ? 'MD3' : 'MD1'
                                    };
                                }
                            }
                        } catch (error) {
                            console.warn('Erro ao buscar resultado do banco, usando localStorage:', error);
                            resultadoSalvo = resultadosStorage.getMatch(matchId);
                        }
                    } else {
                        resultadoSalvo = resultadosStorage.getMatch(matchId);
                    }

                    const teamRows = matchBox.querySelectorAll('.team-row');
                    if (!teamRows || teamRows.length < 2) return;

                    const time1Row = teamRows[0];
                    const time2Row = teamRows[1];

                    const time1NomeEl = time1Row.querySelector('.team-name');
                    const time1LogoEl = time1Row.querySelector('.team-logo');
                    const time2NomeEl = time2Row.querySelector('.team-name');
                    const time2LogoEl = time2Row.querySelector('.team-logo');

                    if (!time1NomeEl || !time1LogoEl || !time2NomeEl || !time2LogoEl) return;

                    const time1Nome = time1NomeEl.textContent;
                    const time1Logo = time1LogoEl.src;
                    const time2Nome = time2NomeEl.textContent;
                    const time2Logo = time2LogoEl.src;

                    const modal = document.getElementById('modalResultado');
                    const modalContent = document.getElementById('modalResultadoContent');
                    const modalTitle = document.getElementById('modalResultadoTitle');

                    if (!modal || !modalContent || !modalTitle) return;

                    modalTitle.textContent = 'Resultado da Partida (MD3)';

                    // Valores padrão do resultado salvo
                    const score1 = resultadoSalvo?.score1 || 0;
                    const score2 = resultadoSalvo?.score2 || 0;
                    const winner = resultadoSalvo?.winner || null;

                    // Mensagem indicando se há resultado salvo
                    const mensagemResultado = resultadoSalvo
                        ? `<p style="color: #00d4ff; text-align: center; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 600;">
                     ⚠️ Resultado já salvo. Altere o placar e confirme para atualizar.
                   </p>`
                        : '';

                    modalContent.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
            ${mensagemResultado}
            <p style="color: #9ddfff; text-align: center; margin: 0;">Insira o placar da partida (Best of 3):</p>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <!-- Time 1 -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 10px;
              ">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <img src="${time1Logo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="${time1Nome}">
                  <span style="color: #fff; font-weight: 600; font-size: 1.1rem;">${time1Nome}</span>
                </div>
                <input type="number" id="scoreTime1" min="0" max="2" value="${score1}" style="
                  width: 60px;
                  height: 50px;
                  text-align: center;
                  font-size: 1.5rem;
                  font-weight: bold;
                  background: rgba(0, 212, 255, 0.2);
                  border: 2px solid rgba(0, 212, 255, 0.5);
                  border-radius: 10px;
                  color: #fff;
                  outline: none;
                ">
              </div>

              <!-- Time 2 -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 10px;
              ">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <img src="${time2Logo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="${time2Nome}">
                  <span style="color: #fff; font-weight: 600; font-size: 1.1rem;">${time2Nome}</span>
                </div>
                <input type="number" id="scoreTime2" min="0" max="2" value="${score2}" style="
                  width: 60px;
                  height: 50px;
                  text-align: center;
                  font-size: 1.5rem;
                  font-weight: bold;
                  background: rgba(0, 212, 255, 0.2);
                  border: 2px solid rgba(0, 212, 255, 0.5);
                  border-radius: 10px;
                  color: #fff;
                  outline: none;
                ">
              </div>
            </div>

            <button id="btnConfirmarMD3" style="
              background: #00d4ff;
              color: #001219;
              border: none;
              border-radius: 10px;
              padding: 15px 30px;
              font-size: 1.1rem;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              margin-top: 10px;
            ">Confirmar</button>
          </div>
        `;

                    // Adicionar event listener ao botão confirmar
                    const btnConfirmar = document.getElementById('btnConfirmarMD3');
                    if (btnConfirmar) {
                        btnConfirmar.addEventListener('click', async () => {
                            try {
                                const score1Input = document.getElementById('scoreTime1');
                                const score2Input = document.getElementById('scoreTime2');

                                if (!score1Input || !score2Input) return;

                                const score1 = parseInt(score1Input.value) || 0;
                                const score2 = parseInt(score2Input.value) || 0;

                                // Validar placar (deve ser 2x0 ou 2x1)
                                if ((score1 === 2 && score2 === 0) || (score1 === 2 && score2 === 1) ||
                                    (score1 === 0 && score2 === 2) || (score1 === 1 && score2 === 2)) {

                                    // Desabilitar botão durante o salvamento
                                    btnConfirmar.style.pointerEvents = 'none';
                                    btnConfirmar.style.opacity = '0.6';
                                    btnConfirmar.textContent = 'Salvando...';

                                    // Determinar vencedor
                                    const winner = score1 > score2 ? 1 : 2;

                                    // Salvar resultado
                                    await resultadosStorage.save(matchId, {
                                        winner,
                                        score1,
                                        score2,
                                        format: 'MD3'
                                    });

                                    // Atualizar card
                                    atualizarCardResultado(matchBox, { winner, score1, score2, format: 'MD3' });

                                    // Fechar modal
                                    if (modal) modal.style.display = 'none';

                                    // Recarregar dados do banco para atualizar posições dos times
                                    if (chaveamentoIdAtual && campeonatoIdAtual) {
                                        setTimeout(async () => {
                                            try {
                                                const dadosAtualizados = await buscarChaveamentoDoBanco(campeonatoIdAtual);
                                                if (dadosAtualizados && dadosAtualizados.partidas) {
                                                    await atualizarBracketComDadosDoBanco(dadosAtualizados);
                                                }
                                            } catch (error) {
                                                console.warn('Erro ao recarregar chaveamento:', error);
                                            }
                                        }, 1500);
                                    }
                                } else {
                                    alert('Placar inválido! Deve ser 2x0 ou 2x1.');
                                }
                            } catch (e) {
                                console.warn('Erro ao processar confirmação MD3:', e);
                                // Reabilitar botão em caso de erro
                                if (btnConfirmar) {
                                    btnConfirmar.style.pointerEvents = 'auto';
                                    btnConfirmar.style.opacity = '1';
                                    btnConfirmar.textContent = 'Confirmar';
                                }
                            }
                        });
                    }

                    // Garantir que os event listeners estejam configurados
                    configurarModalClose();

                    // Mostrar modal
                    modal.style.display = 'block';
                } catch (e) {
                    console.error('Erro ao abrir modal de resultado MD3:', e);
                }
            };

            // Adicionar event listener para cliques nos match-box (usando delegação de eventos)
            // Usar setTimeout para garantir que o código não interfira na renderização inicial
            setTimeout(() => {
                try {
                    document.addEventListener('click', (e) => {
                        try {
                            const matchBox = e.target.closest('.match-box');
                            if (!matchBox) return;

                            // Verificar se a premiação já foi concedida
                            const urlParams = new URLSearchParams(window.location.search);
                            const campeonatoId = urlParams.get('id');

                            if (campeonatoId) {
                                const premiacaoConcedidaKey = `premiacao-concedida-${campeonatoId}`;
                                const premiacaoJaConcedida = localStorage.getItem(premiacaoConcedidaKey) === 'true' || premiacaoConcedida;
                                
                                if (premiacaoJaConcedida) {
                                    debugChaveamentoEtapa('premiacao-ja-concedida', { matchId });
                                    if (typeof showNotification === 'function') {
                                        showNotification('info', 'A premiação já foi concedida. Não é possível editar resultados.', 3000);
                                    } else {
                                        alert('A premiação já foi concedida. Não é possível editar resultados.');
                                    }
                                    return;
                                }
                            }

                            // Verificar se o usuário é dono do campeonato antes de permitir edição
                            // Se houver ID de campeonato, verificar permissão
                            if (campeonatoId) {
                                // Verificar se é dono (variável global definida pela função verificarPermissoesChaveamento)
                                if (window.isChampionshipOwner === false) {
                                    // Se não for dono, mostrar mensagem e não abrir modal
                                    alert('Apenas o organizador do campeonato pode editar resultados.');
                                    return;
                                }
                            }

                            const format = matchBox.getAttribute('data-format');

                            // Identificar tipo de partida
                            if (format === 'B01') {
                                // MD1
                                abrirModalResultadoMD1(matchBox).catch(err => console.error('Erro ao abrir modal MD1:', err));
                            } else if (format === 'B03') {
                                // MD3
                                abrirModalResultadoMD3(matchBox).catch(err => console.error('Erro ao abrir modal MD3:', err));
                            } else {
                                // MD5 (implementar no futuro)
                                debugChaveamentoEtapa('md5-a-implementar', { matchId });
                            }
                        } catch (e) {
                            console.warn('Erro ao processar clique no match-box:', e);
                        }
                    });
                } catch (e) {
                    console.warn('Erro ao adicionar event listener:', e);
                }
            }, 500);

            // Fechar modal ao clicar no backdrop ou botão fechar (só adicionar quando o DOM estiver pronto)
            let modalCloseConfigurado = false;
            const configurarModalClose = () => {
                try {
                    const modal = document.getElementById('modalResultado');
                    if (!modal || modalCloseConfigurado) return;

                    // Função para fechar o modal
                    const fecharModal = (e) => {
                        if (e) e.stopPropagation();
                        modal.style.display = 'none';
                    };

                    // Botão X para fechar - suporta ambos os IDs possíveis
                    const closeBtn1 = document.getElementById('closeModalResultado');
                    const closeBtn2 = document.getElementById('closeResultado');

                    if (closeBtn1 && !closeBtn1.dataset.listenerAdded) {
                        closeBtn1.addEventListener('click', fecharModal);
                        closeBtn1.dataset.listenerAdded = 'true';
                    }

                    if (closeBtn2 && !closeBtn2.dataset.listenerAdded) {
                        closeBtn2.addEventListener('click', fecharModal);
                        closeBtn2.dataset.listenerAdded = 'true';
                    }

                    // Fechar ao clicar fora do modal (no backdrop)
                    if (!modal.dataset.listenerAdded) {
                        modal.addEventListener('click', (e) => {
                            // Se clicou diretamente no backdrop (não no conteúdo interno)
                            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                                fecharModal(e);
                            }
                        });
                        modal.dataset.listenerAdded = 'true';
                    }

                    // Prevenir que cliques dentro do modal fechem ele
                    const modalContent = modal.querySelector('.modal, [style*="background-color: #001219"]');
                    if (modalContent && !modalContent.dataset.listenerAdded) {
                        modalContent.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });
                        modalContent.dataset.listenerAdded = 'true';
                    }

                    modalCloseConfigurado = true;
                } catch (e) {
                    console.warn('Erro ao configurar fechamento do modal:', e);
                }
            };

            // Executar quando o DOM estiver pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', configurarModalClose);
            } else {
                setTimeout(configurarModalClose, 100);
            }

            // Também configurar imediatamente caso o modal já exista
            configurarModalClose();

            // Carregar resultados salvos quando o bracket for renderizado
            // Usar MutationObserver com debounce para evitar loops infinitos
            let observer = null;
            let carregandoResultados = false;
            try {
                observer = new MutationObserver(() => {
                    if (carregandoResultados) return; // Evitar múltiplas execuções simultâneas
                    carregandoResultados = true;
                    setTimeout(() => {
                        try {
                            carregarResultadosSalvos();
                        } catch (e) {
                            console.warn('Erro ao carregar resultados salvos:', e);
                        } finally {
                            carregandoResultados = false;
                        }
                    }, 300); // Debounce de 300ms
                });

                // Observar mudanças no conteúdo do bracket (após um delay para garantir que os elementos existam)
                setTimeout(() => {
                    try {
                        const bracketContent = document.getElementById('hScrollContent');
                        const lowerBracketContent = document.getElementById('lowerBracketContent');

                        if (bracketContent && observer) {
                            observer.observe(bracketContent, { childList: true, subtree: true });
                        }
                        if (lowerBracketContent && observer) {
                            observer.observe(lowerBracketContent, { childList: true, subtree: true });
                        }
                    } catch (e) {
                        console.warn('Erro ao configurar observer:', e);
                    }
                }, 2000);
            } catch (e) {
                console.warn('Erro ao criar MutationObserver:', e);
            }

            // Carregar resultados iniciais (com delay maior para garantir que o bracket foi renderizado)
            setTimeout(() => {
                try {
                    carregarResultadosSalvos();
                } catch (e) {
                    console.warn('Erro ao carregar resultados iniciais:', e);
                }
            }, 2000);
        } catch (e) {
            console.error('Erro ao inicializar sistema de resultados:', e);
        }
    };

    // NÃO executar imediatamente - será chamado após o bracket ser renderizado
    // A inicialização será feita pela função de carregamento do campeonato ou após render

    const formatSelect = document.getElementById('formatSelect');
    if (formatSelect) {
        window.formatSelectRef = formatSelect;
    }
    const setTeamCountOptions = (values, selectedValue) => {
        const frag = document.createDocumentFragment();
        values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = String(v);
            opt.textContent = String(v);
            if (String(v) === String(selectedValue)) opt.selected = true;
            frag.appendChild(opt);
        });
        // limpa e insere mantendo o label externo intacto
        while (select.firstChild) select.removeChild(select.firstChild);
        select.appendChild(frag);
    };
    // Tornar acessível globalmente
    window.setTeamCountOptions = setTeamCountOptions;
    const defaultTeamCounts = [6, 8, 10, 12, 14, 16, 18, 20];
    const majorTeamCounts = [8, 16, 32];

    const saveTeamCount = (n) => localStorage.setItem('ui-team-count', String(n));
    const loadTeamCount = () => parseInt(localStorage.getItem('ui-team-count') || select.value, 10);

    // Função para atualizar tudo quando quantidade mudar
    const updateOnTeamCountChange = () => {
        const n = parseInt(select.value, 10) || 16;
        const format = formatSelect.value || 'single_b01';

        // SEMPRE atualizar o bracket primeiro
        renderBracket(n, format);

        // Se for formato Major, atualizar Swiss Board SEMPRE
        if (format === 'major_playoffs_bo3') {
            // Atualizar visibilidade do botão Challengers
            const btnChal = document.getElementById('btnChallengers');
            if (btnChal) btnChal.style.display = (n === 8) ? 'none' : '';

            // SEMPRE atualizar Swiss Board quando formato Major está ativo
            const swiss = document.getElementById('swissBoard');
            if (swiss) {
                swiss.dataset.stage = (n === 8) ? 'legends' : 'challengers';
                // FORÇA atualização imediata - SEM verificar visibilidade
                if (typeof window.renderSwissSkeleton === 'function') {
                    // Chama diretamente e também com um pequeno delay para garantir
                    window.renderSwissSkeleton(n);
                    setTimeout(() => window.renderSwissSkeleton(n), 10);
                }
            }
        }
    };

    // Atualizar tanto no 'change' quanto no 'input' para garantir resposta imediata
    select.addEventListener('change', updateOnTeamCountChange);
    select.addEventListener('input', updateOnTeamCountChange);

    formatSelect.addEventListener('change', () => {
        let n = parseInt(select.value, 10) || 16;
        const format = formatSelect.value || 'single_b01';
        if (format === 'major_playoffs_bo3') {
            // restringe opções a 8,16,32 e ajusta seleção
            if (!majorTeamCounts.includes(n)) n = 16;
            setTeamCountOptions(majorTeamCounts, n);
            // mostrar controles de fases e default para Challengers (Swiss)
            document.getElementById('stagesActions').style.display = '';
            document.getElementById('swissBoard').style.display = 'block';
            document.querySelector('.hscroll-area').style.display = 'none';
            const btnChal = document.getElementById('btnChallengers');
            if (btnChal) btnChal.style.display = (n === 8) ? 'none' : '';
            const swiss = document.getElementById('swissBoard');
            swiss.dataset.stage = (n === 8) ? 'legends' : 'challengers';
            // Atualiza imediatamente (função já está disponível globalmente)
            if (typeof window.renderSwissSkeleton === 'function') {
                window.renderSwissSkeleton(n);
            }
        } else {
            // restaura opções padrão e mantém valor mais próximo
            if (!defaultTeamCounts.includes(n)) n = 16;
            setTeamCountOptions(defaultTeamCounts, n);
            // esconder controles de fases e voltar pro bracket
            document.getElementById('stagesActions').style.display = 'none';
            document.getElementById('swissBoard').style.display = 'none';
            document.querySelector('.hscroll-area').style.display = 'block';
        }
        renderBracket(n, format);
    });

    if (addExamplesBtn) {
    // Embaralhar times (reorganiza os times existentes)
    addExamplesBtn.addEventListener('click', () => {
            if (addExamplesBtn.disabled) {
                return;
            }
        try {
            // Obter times do localStorage
            const stored = JSON.parse(localStorage.getItem('cs2-teams') || '[]');

            if (stored.length === 0) {
                alert('Não há times para embaralhar. Adicione times primeiro.');
                return;
            }

            // Embaralhar array usando algoritmo Fisher-Yates
            const timesEmbaralhados = [...stored];
            for (let i = timesEmbaralhados.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [timesEmbaralhados[i], timesEmbaralhados[j]] = [timesEmbaralhados[j], timesEmbaralhados[i]];
            }

            // Salvar times embaralhados
            localStorage.setItem('cs2-teams', JSON.stringify(timesEmbaralhados));

            // Atualizar carrossel
            const track = document.getElementById('carouselTrack');
            if (track) {
                const createItem = (t) => {
                    const div = document.createElement('div');
                    div.className = 'carousel-item';
                    const nomeTime = t.nome || 'Time';
                    const logoUrl = t.logo || t.avatar_time_url || `https://via.placeholder.com/40x40/333/fff?text=${nomeTime[0]}`;
                    div.innerHTML = `
                <img src="${logoUrl}" onerror="this.src='https://via.placeholder.com/40x40/333/fff?text=${nomeTime[0]}'" alt="${nomeTime}">
                <span>${nomeTime}</span>
              `;
                    return div;
                };

                track.innerHTML = '';
                const items = timesEmbaralhados.map(createItem);
                const clones = timesEmbaralhados.map(createItem);
                items.concat(clones).forEach(el => track.appendChild(el));
            }

            // Re-renderizar o bracket para atualizar as posições dos times
            const format = formatSelect.value || 'single_b01';
            const n = parseInt(select.value, 10) || 16;
            if (typeof window.renderBracket === 'function') {
                window.renderBracket(n, format);
            }

            alert('Times embaralhados com sucesso!');
        } catch (error) {
            console.error('Erro ao embaralhar times:', error);
            alert('Erro ao embaralhar times.');
        }
    });
    } else {
        console.warn('Botão "Embaralhar times" não encontrado no DOM.');
    }

    atualizarDisponibilidadeBotaoEmbaralhar();

    // Botão para listar times
    const btnListarTimes = document.getElementById('btnListarTimes');
    const modalListarTimes = document.getElementById('modalListarTimes');
    const closeModalListarTimes = document.getElementById('closeModalListarTimes');
    const listaTimesContent = document.getElementById('listaTimesContent');
    const totalTimesSpan = document.getElementById('totalTimes');

    // Função para abrir o modal e listar os times
    const abrirModalListarTimes = () => {
        try {
            const times = JSON.parse(localStorage.getItem('cs2-teams') || '[]');
            const totalTimes = times.length;

            // Obter quantidade de times do campeonato
            // Prioridade:
            // 1) quantidade_times vinda do backend (window.dadosChaveamento)
            // 2) window.numTeams já sincronizado com o chaveamento
            // 3) valor do select de quantidade de times (fallback)
            // 4) default 16
            const select = document.getElementById('teamCount');
            const quantidadeCampeonato =
                window.dadosChaveamento?.quantidade_times ||
                window.numTeams ||
                (select ? parseInt(select.value, 10) || 16 : 16);

            // Atualizar total (exemplo: 12/12)
            totalTimesSpan.textContent = `${totalTimes}/${quantidadeCampeonato}`;

            // Limpar conteúdo anterior
            listaTimesContent.innerHTML = '';

            if (times.length === 0) {
                listaTimesContent.innerHTML = '<p style="color: #9ddfff; text-align: center; padding: 20px;">Nenhum time cadastrado ainda.</p>';
            } else {
                // Criar lista de times
                const listaHTML = times.map((time, index) => {
                    const logo = time.logo || time.avatar_time_url || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                    const nome = time.nome || `Time ${index + 1}`;

                    return `
                <div style="display: flex; align-items: center; padding: 15px; margin-bottom: 10px; background-color: rgba(0, 212, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                  <img src="${logo}" alt="${nome}" style="width: 50px; height: 50px; border-radius: 8px; margin-right: 15px; object-fit: cover;" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                  <div style="flex: 1;">
                    <div style="color: #00d4ff; font-weight: 600; font-size: 1.1rem; margin-bottom: 5px;">${nome}</div>
                    <div style="color: #9ddfff; font-size: 0.9rem;">Seed ${index + 1}</div>
                  </div>
                </div>
              `;
                }).join('');

                listaTimesContent.innerHTML = listaHTML;
            }

            // Mostrar modal
            if (modalListarTimes) {
                modalListarTimes.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao listar times:', error);
            alert('Erro ao carregar lista de times.');
        }
    };

    // Event listeners
    if (btnListarTimes) {
        btnListarTimes.addEventListener('click', abrirModalListarTimes);
    }

    if (closeModalListarTimes) {
        closeModalListarTimes.addEventListener('click', () => {
            if (modalListarTimes) {
                modalListarTimes.style.display = 'none';
            }
        });
    }

    // Fechar modal ao clicar fora dele
    if (modalListarTimes) {
        modalListarTimes.addEventListener('click', (e) => {
            if (e.target === modalListarTimes) {
                modalListarTimes.style.display = 'none';
            }
        });
    }

    // Botão para abrir modal de vetos
    const btnVetos = document.getElementById('btnVetos');
    const modalVetos = document.getElementById('modalVetos');
    const closeModalVetos = document.getElementById('closeModalVetos');
    const mapasContainer = document.getElementById('mapasContainer');
    const btnAplicarVetos = document.getElementById('btnAplicarVetos');
    const urlsGeradasContainer = document.getElementById('urlsGeradasContainer');
    const urlTimeA = document.getElementById('urlTimeA');
    const urlTimeB = document.getElementById('urlTimeB');
    const urlSpectator = document.getElementById('urlSpectator');
    const copiarUrlA = document.getElementById('copiarUrlA');
    const copiarUrlB = document.getElementById('copiarUrlB');
    const copiarUrlSpectator = document.getElementById('copiarUrlSpectator');
    const vetosLinkTimeALogo = document.getElementById('vetosLinkTimeALogo');
    const vetosLinkTimeANome = document.getElementById('vetosLinkTimeANome');
    const vetosLinkTimeBLogo = document.getElementById('vetosLinkTimeBLogo');
    const vetosLinkTimeBNome = document.getElementById('vetosLinkTimeBNome');

    let imagensMapas = {};
    let mapasSelecionados = [];

    // Header de times no modal de vetos
    const vetosMatchHeader = document.getElementById('vetosMatchHeader');
    const vetosTimeALogo = document.getElementById('vetosTimeALogo');
    const vetosTimeANome = document.getElementById('vetosTimeANome');
    const vetosTimeBLogo = document.getElementById('vetosTimeBLogo');
    const vetosTimeBNome = document.getElementById('vetosTimeBNome');

    // Função global para atualizar header de times no modal de vetos
    window.atualizarHeaderVetosPartida = function (info) {
        if (!vetosMatchHeader || !vetosTimeALogo || !vetosTimeANome || !vetosTimeBLogo || !vetosTimeBNome) return;

        if (!info || !info.timeA || !info.timeB) {
            // Oculta o header quando não há partida associada (ex: clique no botão Vetos do topo)
            vetosMatchHeader.style.display = 'none';
            // Também reseta rótulos dos links
            if (vetosLinkTimeALogo) vetosLinkTimeALogo.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            if (vetosLinkTimeANome) vetosLinkTimeANome.textContent = 'Time A';
            if (vetosLinkTimeBLogo) vetosLinkTimeBLogo.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            if (vetosLinkTimeBNome) vetosLinkTimeBNome.textContent = 'Time B';
            return;
        }

        vetosTimeALogo.src = info.timeA.logo || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        vetosTimeANome.textContent = info.timeA.nome || 'Time A';

        vetosTimeBLogo.src = info.timeB.logo || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        vetosTimeBNome.textContent = info.timeB.nome || 'Time B';

        vetosMatchHeader.style.display = 'flex';

        // Guardar info globalmente para usar na geração dos links
        window.vetosPartidaAtualInfo = info;

        // Já atualizar também os avatares/nomes na área de links (quando aparecer)
        if (vetosLinkTimeALogo) vetosLinkTimeALogo.src = vetosTimeALogo.src;
        if (vetosLinkTimeANome) vetosLinkTimeANome.textContent = vetosTimeANome.textContent;
        if (vetosLinkTimeBLogo) vetosLinkTimeBLogo.src = vetosTimeBLogo.src;
        if (vetosLinkTimeBNome) vetosLinkTimeBNome.textContent = vetosTimeBNome.textContent;
    };

    // Carregar imagens dos mapas ao abrir o modal
    async function carregarImagensMapas() {
        try {
            const response = await fetch(`${API_URL}/imgmap`);
            const data = await response.json();
            
            console.log('Dados recebidos da API imgmap:', data);
            
            if (data && Array.isArray(data) && data.length > 0) {
                // Se for array, pega o primeiro registro
                imagensMapas = data[0];
            } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                // Se for objeto direto, usa ele
                imagensMapas = data;
            } else {
                console.warn('Formato de dados não reconhecido, usando fallback');
                imagensMapas = {};
            }

            console.log('Imagens de mapas carregadas:', imagensMapas);
            renderizarMapas();
        } catch (error) {
            console.error('Erro ao carregar imagens dos mapas:', error);
            imagensMapas = {};
            renderizarMapas(); // Renderiza mesmo sem imagens, usando fallback
        }
    }

    // Renderizar checkboxes dos mapas
    function renderizarMapas() {
        if (!mapasContainer) return;

        const mapas = ['mirage', 'train', 'vertigo', 'nuke', 'ancient', 'inferno', 'overpass', 'dust2', 'cache', 'anubis'];
        // Mapas que devem estar marcados por padrão
        const mapasPadrao = ['mirage', 'train', 'overpass', 'nuke', 'inferno', 'dust2', 'ancient'];
        
        mapasContainer.innerHTML = '';

        mapas.forEach(mapa => {
            // No banco os campos estão com primeira letra maiúscula (Mirage, Train, etc)
            const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
            // Tentar diferentes variações do nome do campo
            const imagemUrl = imagensMapas[nomeCampo] || 
                             imagensMapas[mapa] || 
                             imagensMapas[mapa.toUpperCase()] ||
                             'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            const nomeMapa = nomeCampo;
            const estaMarcado = mapasPadrao.includes(mapa);

            const mapaDiv = document.createElement('div');
            const estiloBase = 'display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border: 2px solid rgba(0, 212, 255, 0.2); cursor: pointer; transition: all 0.3s;';
            const estiloMarcado = estaMarcado ? 'background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.5);' : '';
            mapaDiv.style.cssText = estiloBase + estiloMarcado;
            
            mapaDiv.innerHTML = `
                <input type="checkbox" id="mapa_${mapa}" value="${mapa}" ${estaMarcado ? 'checked' : ''} style="margin-bottom: 6px; cursor: pointer; width: 18px; height: 18px;">
                <label for="mapa_${mapa}" style="cursor: pointer; text-align: center; width: 100%;">
                    <img src="${imagemUrl}" alt="${nomeMapa}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 4px; display: block; margin: 0 auto 4px;" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                    <span style="color: #9ddfff; font-size: 0.85rem; display: block;">${nomeMapa}</span>
                </label>
            `;

            // Adicionar evento de clique no div inteiro
            mapaDiv.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = mapaDiv.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    atualizarMapasSelecionados();
                } else {
                    atualizarMapasSelecionados();
                }
            });

            // Adicionar estilo hover
            mapaDiv.addEventListener('mouseenter', () => {
                mapaDiv.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                mapaDiv.style.background = 'rgba(0, 212, 255, 0.1)';
            });
            mapaDiv.addEventListener('mouseleave', () => {
                const checkbox = mapaDiv.querySelector('input[type="checkbox"]');
                if (checkbox.checked) {
                    mapaDiv.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                    mapaDiv.style.background = 'rgba(0, 212, 255, 0.15)';
                } else {
                    mapaDiv.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                    mapaDiv.style.background = 'rgba(0, 212, 255, 0.05)';
                }
            });

            // Atualizar estilo quando checkbox muda
            const checkbox = mapaDiv.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    mapaDiv.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                    mapaDiv.style.background = 'rgba(0, 212, 255, 0.15)';
                } else {
                    mapaDiv.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                    mapaDiv.style.background = 'rgba(0, 212, 255, 0.05)';
                }
                atualizarMapasSelecionados();
            });

            mapasContainer.appendChild(mapaDiv);
        });
        
        // Atualizar lista de mapas selecionados após renderizar
        atualizarMapasSelecionados();
    }

    // Atualizar lista de mapas selecionados
    function atualizarMapasSelecionados() {
        mapasSelecionados = [];
        const checkboxes = mapasContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            mapasSelecionados.push(checkbox.value);
        });
    }

    // Aplicar configuração de vetos
    async function aplicarVetos() {
        const formato = document.querySelector('input[name="formatoVeto"]:checked')?.value;
        
        if (!formato) {
            alert('Selecione um formato (BO1, BO3 ou BO5)');
            return;
        }

        // Atualizar lista antes de validar
        atualizarMapasSelecionados();

        if (mapasSelecionados.length === 0) {
            alert('Selecione pelo menos um mapa');
            return;
        }

        if (mapasSelecionados.length !== 7) {
            alert(`Por favor, selecione exatamente 7 mapas. Você selecionou ${mapasSelecionados.length} mapa(s).`);
            return;
        }

        try {
            // Obter ID do campeonato atual se disponível
            const campeonatoId = obterCampeonatoIdContextual();
            
            // Obter IDs dos times se houver partida associada
            const infoPartida = window.vetosPartidaAtualInfo;
            const timeAId = infoPartida?.timeA?.id || null;
            const timeBId = infoPartida?.timeB?.id || null;
            
            const response = await fetch(`${API_URL}/vetos/sessao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    formato,
                    mapas_selecionados: mapasSelecionados,
                    campeonato_id: campeonatoId || null,
                    partida_id: null,
                    time_a_id: timeAId,
                    time_b_id: timeBId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Gerar URLs
                const baseUrl = window.location.origin + window.location.pathname.replace('chaveamento.html', '');
                const urlA = `${baseUrl}vetos.html?token=${data.token_a}`;
                const urlB = `${baseUrl}vetos.html?token=${data.token_b}`;
                const urlSpec = data.token_spectator
                    ? `${baseUrl}vetos.html?token=${data.token_spectator}`
                    : '';

                urlTimeA.value = urlA;
                urlTimeB.value = urlB;
                if (urlSpectator) {
                    urlSpectator.value = urlSpec;
                }
                urlsGeradasContainer.style.display = 'block';

                // Se tivermos info da partida atual, garantir que nomes e avatares apareçam ao lado dos links
                const infoPartida = window.vetosPartidaAtualInfo;
                if (infoPartida && infoPartida.timeA && infoPartida.timeB) {
                    if (vetosLinkTimeALogo) vetosLinkTimeALogo.src = infoPartida.timeA.logo || vetosTimeALogo?.src;
                    if (vetosLinkTimeANome) vetosLinkTimeANome.textContent = infoPartida.timeA.nome || vetosTimeANome?.textContent || 'Time A';
                    if (vetosLinkTimeBLogo) vetosLinkTimeBLogo.src = infoPartida.timeB.logo || vetosTimeBLogo?.src;
                    if (vetosLinkTimeBNome) vetosLinkTimeBNome.textContent = infoPartida.timeB.nome || vetosTimeBNome?.textContent || 'Time B';
                }

                // Iniciar sessão
                await fetch(`${API_URL}/vetos/iniciar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessao_id: data.sessao_id
                    })
                });
            } else {
                alert('Erro ao criar sessão de vetos: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao aplicar vetos:', error);
            alert('Erro ao criar sessão de vetos');
        }
    }

    // Disponibiliza função global para abrir o modal de vetos,
    // para ser reutilizada pelo botão "Vetos" do topo e pelos cards de partida
    window.abrirModalVetos = function () {
        if (!modalVetos) {
            console.error('Modal de vetos não encontrado!');
            return;
        }

        console.log('Abrindo modal de vetos');
        modalVetos.style.display = 'flex';
        modalVetos.style.visibility = 'visible';
        modalVetos.style.opacity = '1';

        const modalContent = modalVetos.querySelector('.modal');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.visibility = 'visible';
            modalContent.style.opacity = '1';
            modalContent.style.zIndex = '10';
        }

        // Resetar URLs e recarregar mapas sempre que abrir pelo menos uma vez
        if (urlsGeradasContainer) {
            urlsGeradasContainer.style.display = 'none';
        }

        // Sempre recarregar o grid de mapas ao abrir para garantir que apareçam
        carregarImagensMapas();
        mapasSelecionados = [];
    }

    if (btnVetos) {
        btnVetos.addEventListener('click', () => {
            // Abrindo modal de vetos sem partida específica: esconde header de times
            if (typeof window.atualizarHeaderVetosPartida === 'function') {
                window.atualizarHeaderVetosPartida(null);
            }
            abrirModalVetos();
        });
    }

    if (closeModalVetos) {
        closeModalVetos.addEventListener('click', () => {
            if (modalVetos) {
                modalVetos.style.display = 'none';
            }
        });
    }

    if (btnAplicarVetos) {
        btnAplicarVetos.addEventListener('click', aplicarVetos);
    }

    if (copiarUrlA) {
        copiarUrlA.addEventListener('click', () => {
            if (urlTimeA && urlTimeA.value) {
                navigator.clipboard.writeText(urlTimeA.value)
                    .then(() => alert('Link do Time A copiado!'))
                    .catch((err) => console.error('Erro ao copiar URL do Time A:', err));
            }
        });
    }

    if (copiarUrlB) {
        copiarUrlB.addEventListener('click', () => {
            if (urlTimeB && urlTimeB.value) {
                navigator.clipboard.writeText(urlTimeB.value)
                    .then(() => alert('Link do Time B copiado!'))
                    .catch((err) => console.error('Erro ao copiar URL do Time B:', err));
            }
        });
    }

    if (copiarUrlSpectator) {
        copiarUrlSpectator.addEventListener('click', () => {
            if (urlSpectator && urlSpectator.value) {
                navigator.clipboard.writeText(urlSpectator.value)
                    .then(() => alert('Link de Espectador copiado!'))
                    .catch((err) => console.error('Erro ao copiar URL de Espectador:', err));
            }
        });
    }

    // Fechar modal de vetos ao clicar fora dele
    if (modalVetos) {
        modalVetos.addEventListener('click', (e) => {
            // Fechar se clicar diretamente no overlay ou no backdrop
            // Não fechar se clicar dentro do conteúdo do modal
            const modalContent = document.getElementById('modalVetosContentWrapper');
            
            // Verificar se o clique foi no overlay ou no backdrop
            const clickedOnOverlay = e.target === modalVetos;
            const clickedOnBackdrop = e.target.classList.contains('modal-backdrop');
            
            // Verificar se o clique foi dentro do conteúdo do modal
            const clickedInsideContent = modalContent && modalContent.contains(e.target);
            
            // Fechar apenas se clicou no overlay/backdrop e não no conteúdo
            if ((clickedOnOverlay || clickedOnBackdrop) && !clickedInsideContent) {
                modalVetos.style.display = 'none';
            }
        });
    }

    // Botão para resetar chaveamento
    const resetChaveamentoBtn = document.getElementById('resetChaveamento');
    if (resetChaveamentoBtn) {
        resetChaveamentoBtn.addEventListener('click', () => {
            // Abrir modal de confirmação
            const modal = document.getElementById('modalConfirmarReset');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }

    // Botão de confirmar reset
    const btnConfirmarReset = document.getElementById('btnConfirmarReset');
    if (btnConfirmarReset) {
        btnConfirmarReset.addEventListener('click', async () => {
            try {
                // Desabilitar botão durante o processo
                btnConfirmarReset.disabled = true;
                btnConfirmarReset.textContent = 'Resetando...';

                // Se houver chaveamento no banco, limpar os dados
                if (chaveamentoIdAtual && campeonatoIdAtual) {
                    try {
                        // Chamar endpoint para resetar chaveamento
                        const apiUrl = window.API_URL || 'http://127.0.0.1:3000/api/v1';
                        const response = await fetch(`${apiUrl}/chaveamentos/${chaveamentoIdAtual}/resetar`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                        });

                        if (!response.ok) {
                            throw new Error('Erro ao resetar chaveamento no servidor');
                        }

                    } catch (error) {
                        console.error('Erro ao resetar chaveamento:', error);
                        alert('Erro ao resetar chaveamento. Tente novamente.');
                        btnConfirmarReset.disabled = false;
                        btnConfirmarReset.textContent = 'Sim, Resetar';
                        return;
                    }
                }

                // Limpar localStorage
                limparResultadosLocais();
                localStorage.removeItem('cs2-teams');
                localStorage.removeItem('ui-team-count');
                limparCachePremiacaoOficial();
                limparFlagResultadosRegistrados();
                
                // Limpar flag de premiação concedida
                if (campeonatoIdAtual) {
                    localStorage.removeItem(`premiacao-concedida-${campeonatoIdAtual}`);
                    premiacaoConcedida = false;
                    debugChaveamentoEtapa('premiacao-flag-removida');
                }

                // Fechar modal
                const modal = document.getElementById('modalConfirmarReset');
                if (modal) {
                    modal.style.display = 'none';
                }

                // Recarregar a página para começar do zero
                window.location.reload();
            } catch (error) {
                console.error('Erro ao resetar chaveamento:', error);
                alert('Erro ao resetar chaveamento. Tente novamente.');
                btnConfirmarReset.disabled = false;
                btnConfirmarReset.textContent = 'Sim, Resetar';
            }
        });
    }

    // Botão de cancelar reset
    const btnCancelarReset = document.getElementById('btnCancelarReset');
    if (btnCancelarReset) {
        btnCancelarReset.addEventListener('click', () => {
            const modal = document.getElementById('modalConfirmarReset');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Fechar modal ao clicar fora dele
    const modalConfirmarReset = document.getElementById('modalConfirmarReset');
    if (modalConfirmarReset) {
        modalConfirmarReset.addEventListener('click', (e) => {
            if (e.target === modalConfirmarReset) {
                modalConfirmarReset.style.display = 'none';
            }
        });
    }

    // Verificar se há ID na URL - se houver, não inicializar com valores padrão
    // (deixar o script de carregamento do campeonato fazer isso)
    const urlParams = new URLSearchParams(window.location.search);
    const campeonatoId = urlParams.get('id');

    // Garantir que o container da classificação final esteja sempre visível
    const finalStandingsContainer = document.getElementById('finalStandingsContainer');
    if (finalStandingsContainer) {
        finalStandingsContainer.style.display = 'flex';
    }
    
    // Garantir que os slots de medalha e troféu estejam sempre visíveis no card do 1º lugar
    // Chamar sem await pois está em contexto não assíncrono, mas a função será executada
    garantirSlotsPremiacaoVisiveis().catch(err => console.error('Erro ao garantir slots de premiação:', err));

    // Só inicializar com valores padrão se NÃO houver ID na URL
    if (!campeonatoId) {
        // Inicializa com valor salvo/selecionado
        let initial = loadTeamCount();
        // Garantir que initial seja um número válido
        if (Number.isNaN(initial) || initial <= 0) {
            initial = 16; // Valor padrão
        }
        select.value = String(initial);
        const initialFormat = formatSelect.value || 'single_b01';
        // aplicar restrição inicial caso Major esteja selecionado
        if (initialFormat === 'major_playoffs_bo3') {
            const n = majorTeamCounts.includes(initial) ? initial : 16;
            setTeamCountOptions(majorTeamCounts, n);
            document.getElementById('stagesActions').style.display = '';
            document.getElementById('swissBoard').style.display = 'block';
            document.querySelector('.hscroll-area').style.display = 'none';
            const btnChal = document.getElementById('btnChallengers');
            if (btnChal) btnChal.style.display = (n === 8) ? 'none' : '';
            const swiss = document.getElementById('swissBoard');
            if (swiss) {
                swiss.dataset.stage = (n === 8) ? 'legends' : 'challengers';
            }
            // Renderizar bracket
            if (typeof window.renderBracket === 'function') {
                window.renderBracket(n, initialFormat);
            } else if (typeof renderBracket === 'function') {
                renderBracket(n, initialFormat);
            }
            // Atualiza imediatamente (função já está disponível globalmente)
            if (typeof window.renderSwissSkeleton === 'function') {
                window.renderSwissSkeleton(n);
            }
            // Inicializar sistema de resultados após renderizar
            if (typeof window.inicializarSistemaResultados === 'function') {
                setTimeout(() => {
                    try {
                        window.inicializarSistemaResultados();
                    } catch (e) {
                        console.warn('Erro ao inicializar sistema de resultados:', e);
                    }
                }, 500);
            }
        } else {
            setTeamCountOptions(defaultTeamCounts, initial);
            document.getElementById('stagesActions').style.display = 'none';
            document.getElementById('swissBoard').style.display = 'none';
            const hscrollArea = document.querySelector('.hscroll-area');
            if (hscrollArea) {
                hscrollArea.style.display = 'block';
            }
            // Renderizar bracket
            if (typeof window.renderBracket === 'function') {
                window.renderBracket(initial, initialFormat);
            } else if (typeof renderBracket === 'function') {
                renderBracket(initial, initialFormat);
            }
            // Inicializar sistema de resultados após renderizar
            if (typeof window.inicializarSistemaResultados === 'function') {
                setTimeout(() => {
                    try {
                        window.inicializarSistemaResultados();
                    } catch (e) {
                        console.warn('Erro ao inicializar sistema de resultados:', e);
                    }
                }, 500);
            }
        }
    } else {
        // Se houver ID, apenas garantir que renderBracket está disponível
        // mas não renderizar ainda - deixar o script de carregamento fazer
    }

    // ============================================
    // SELETOR DE CAMPEONATOS ENCERRADOS
    // ============================================
    const championshipSelector = document.getElementById('championshipSelector');
    const selectCampeonato = document.getElementById('selectCampeonato');
    const btnIrParaCampeonato = document.getElementById('btnIrParaCampeonato');
})();
