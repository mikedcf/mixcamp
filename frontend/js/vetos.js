
// Obter token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

let sessaoVetos = null;
let imagensMapas = {};
let intervaloAtualizacao = null;
let intervaloRoleta = null;
let roletaGirando = false;
let roletaIniciadaEm = null;

const INTERVALO_POLL_MS = 8000;
const INTERVALO_ROleta_MS = 3000;
const LOGO_TIME_PADRAO = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
const IMGMAP_CACHE_KEY = 'mixcamp_vetos_imgmap';
const cacheTimesVetos = new Map();
let ultimoFingerprintSessao = '';
let pollEmAndamento = false;
let carregamentoIniciado = false;

function roletaEstaGirandoAgora() {
    const roleta = document.getElementById('roleta');
    return roletaGirando ||
        (roleta && roleta.classList.contains('girando')) ||
        (roleta && roleta.hasAttribute('data-roleta-protegida'));
}

function pararPolling() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
        intervaloAtualizacao = null;
    }
}

function iniciarPolling() {
    if (intervaloAtualizacao) return;
    intervaloAtualizacao = setInterval(tickPolling, INTERVALO_POLL_MS);
}

function fingerprintSessao(data) {
    const s = data?.sessao || {};
    const acoes = (data?.acoes || [])
        .map((a) => `${a.ordem}:${a.mapa}:${a.acao}:${a.lado_inicial || ''}`)
        .join('|');
    return [
        s.status,
        s.turno_atual,
        s.pode_jogar,
        s.sorteio_realizado,
        s.time_a_pronto,
        s.time_b_pronto,
        acoes
    ].join(';');
}

function aplicarTimesDaSessao(data) {
    if (!data?.sessao) return;
    const s = data.sessao;
    if (data.times?.time_a && s.time_a_id) {
        cacheTimesVetos.set(Number(s.time_a_id), {
            id: s.time_a_id,
            nome: data.times.time_a.nome || 'Time A',
            logo: data.times.time_a.logo || LOGO_TIME_PADRAO
        });
    }
    if (data.times?.time_b && s.time_b_id) {
        cacheTimesVetos.set(Number(s.time_b_id), {
            id: s.time_b_id,
            nome: data.times.time_b.nome || 'Time B',
            logo: data.times.time_b.logo || LOGO_TIME_PADRAO
        });
    }
}

async function garantirCacheTimes() {
    aplicarTimesDaSessao(sessaoVetos);
    const timeAId = sessaoVetos?.sessao?.time_a_id;
    const timeBId = sessaoVetos?.sessao?.time_b_id;
    const temA = !timeAId || cacheTimesVetos.has(Number(timeAId));
    const temB = !timeBId || cacheTimesVetos.has(Number(timeBId));
    if (temA && temB) return;
    if (typeof isApiRateLimited === 'function' && isApiRateLimited()) return;

    try {
        const response = await fetch(`${API_URL}/times/list`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (response.status === 429) {
            if (typeof markApiRateLimited === 'function') markApiRateLimited(response);
            return;
        }
        if (!response.ok) return;
        const data = await response.json();
        const lista = Array.isArray(data.dados) ? data.dados : [];
        for (const t of lista) {
            cacheTimesVetos.set(Number(t.id), {
                id: t.id,
                nome: t.nome || `Time #${t.id}`,
                logo: t.avatar_time_url || LOGO_TIME_PADRAO
            });
        }
    } catch (_) { /* ignore */ }
}

function getTimeDoCache(timeId, fallbackNome) {
    if (!timeId) return null;
    return cacheTimesVetos.get(Number(timeId)) || {
        id: timeId,
        nome: fallbackNome,
        logo: LOGO_TIME_PADRAO
    };
}

async function tickPolling() {
    if (roletaEstaGirandoAgora() || pollEmAndamento) return;
    if (typeof isApiRateLimited === 'function' && isApiRateLimited()) return;

    pollEmAndamento = true;
    try {
        const mudou = await atualizarSessao();
        if (!sessaoVetos) return;

        const status = sessaoVetos.sessao?.status;
        if (status === 'finalizado') {
            pararPolling();
            await renderizarInterface();
            return;
        }

        if (mudou && status === 'em_andamento') {
            await renderizarInterface();
            verificarModalCTTR();
        }
    } finally {
        pollEmAndamento = false;
    }
}

async function carregarImagensMapas() {
    try {
        const cached = sessionStorage.getItem(IMGMAP_CACHE_KEY);
        if (cached) {
            imagensMapas = JSON.parse(cached);
            return;
        }
    } catch (_) { /* ignore */ }

    if (typeof isApiRateLimited === 'function' && isApiRateLimited()) {
        imagensMapas = {};
        return;
    }

    const response = await fetch(`${API_URL}/imgmap`);
    if (response.status === 429) {
        if (typeof markApiRateLimited === 'function') markApiRateLimited(response);
        imagensMapas = {};
        return;
    }
    if (!response.ok) {
        imagensMapas = {};
        return;
    }

    const dataImagens = await response.json();
    if (dataImagens && Array.isArray(dataImagens) && dataImagens.length > 0) {
        imagensMapas = dataImagens[0];
    } else if (dataImagens && typeof dataImagens === 'object' && !Array.isArray(dataImagens)) {
        imagensMapas = dataImagens;
    } else {
        imagensMapas = {};
    }

    try {
        sessionStorage.setItem(IMGMAP_CACHE_KEY, JSON.stringify(imagensMapas));
    } catch (_) { /* ignore */ }
}

async function processarEstadoPosAtualizacao(data) {
    if (data.sessao?.status === 'finalizado') {
        pararPolling();
        const partidaId = data.sessao.partida_id;
        if (partidaId) {
            setTimeout(() => {
                window.location.href = `resultado.html?id=${partidaId}`;
            }, 2000);
        }
        return;
    }

    if (data.sessao && !data.sessao.sorteio_realizado) {
        mostrarModalRoleta();
        atualizarStatusRoleta();
    }
}

// Carregar dados iniciais
async function carregarDados() {
    if (!token) {
        mostrarErro('Token não encontrado na URL');
        return;
    }
    if (carregamentoIniciado) return;
    carregamentoIniciado = true;

    try {
        await carregarImagensMapas();

        if (typeof isApiRateLimited === 'function' && isApiRateLimited()) {
            mostrarErro('Muitas requisições. Aguarde cerca de 1 minuto e recarregue a página.');
            return;
        }

        await atualizarSessao();
        await garantirCacheTimes();

        if (sessaoVetos) {
            await renderizarInterface();
        }

        if (sessaoVetos?.sessao?.status === 'em_andamento') {
            iniciarPolling();
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados');
    }
}

// Atualizar sessão de vetos (sem re-render automático; retorna true se o estado mudou)
async function atualizarSessao() {
    try {
        if (typeof isApiRateLimited === 'function' && isApiRateLimited()) {
            return false;
        }

        const response = await fetch(`${API_URL}/vetos/sessao/${token}`);

        if (response.status === 429) {
            if (typeof markApiRateLimited === 'function') markApiRateLimited(response);
            pararPolling();
            return false;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            if (response.status !== 404) {
                mostrarErro(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            }
            return false;
        }

        const data = await response.json();
        const fp = fingerprintSessao(data);
        const mudou = fp !== ultimoFingerprintSessao;
        ultimoFingerprintSessao = fp;
        sessaoVetos = data;
        aplicarTimesDaSessao(data);

        await processarEstadoPosAtualizacao(data);
        return mudou;
    } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
        return false;
    }
}

// Atualizar header com informações dos times (somente cache — sem GET /times/:id)
async function atualizarHeaderTimes() {
    if (!sessaoVetos || !sessaoVetos.sessao) return;

    const vetosTimesHeader = document.getElementById('vetosTimesHeader');
    const vetosTimeALogo = document.getElementById('vetosTimeALogo');
    const vetosTimeANome = document.getElementById('vetosTimeANome');
    const vetosTimeBLogo = document.getElementById('vetosTimeBLogo');
    const vetosTimeBNome = document.getElementById('vetosTimeBNome');

    if (!vetosTimesHeader || !vetosTimeALogo || !vetosTimeANome || !vetosTimeBLogo || !vetosTimeBNome) return;

    const timeAId = sessaoVetos.sessao.time_a_id;
    const timeBId = sessaoVetos.sessao.time_b_id;

    if (!timeAId || !timeBId) {
        vetosTimesHeader.style.display = 'none';
        return;
    }

    await garantirCacheTimes();

    const timeA = getTimeDoCache(timeAId, 'Time A');
    const timeB = getTimeDoCache(timeBId, 'Time B');

    vetosTimeALogo.src = timeA.logo;
    vetosTimeANome.textContent = timeA.nome;
    vetosTimeBLogo.src = timeB.logo;
    vetosTimeBNome.textContent = timeB.nome;
    vetosTimesHeader.style.display = 'flex';
}

// Renderizar interface
async function renderizarInterface() {
    if (!sessaoVetos) return;

    // Verificar se a sessão foi finalizada e redirecionar
    if (sessaoVetos.sessao && sessaoVetos.sessao.status === 'finalizado') {
        pararPolling();
        const partidaId = sessaoVetos.sessao.partida_id;
        if (partidaId) {
            setTimeout(() => {
                window.location.href = `resultado.html?id=${partidaId}`;
            }, 2000);
            return;
        }
    }

    const loading = document.getElementById('loading');
    const erro = document.getElementById('erro');
    const mapasContainer = document.getElementById('mapasContainer');
    const formatoDisplay = document.getElementById('formatoDisplay');
    const turnoInfo = document.getElementById('turnoInfo');
    const acoesRealizadas = document.getElementById('acoesRealizadas');

    loading.style.display = 'none';
    erro.style.display = 'none';
    mapasContainer.style.display = 'grid';
    if (acoesRealizadas) acoesRealizadas.style.display = 'none';

    // Atualizar formato
    const formatoTexto = sessaoVetos.sessao.formato.toUpperCase();
    formatoDisplay.textContent = formatoTexto;

    // Atualizar turno
    const podeJogar = sessaoVetos.sessao.pode_jogar;
    const turnoTexto = podeJogar 
        ? 'É o seu turno! Escolha um mapa para Pick ou Ban'
        : 'Aguardando o outro time...';
    
    turnoInfo.className = podeJogar ? 'turno-info' : 'turno-info esperando';
    turnoInfo.querySelector('.turno-texto').textContent = turnoTexto;

    // Atualizar header com times (sempre mostrar)
    await atualizarHeaderTimes();
    // Garantir que o header esteja visível
    const vetosTimesHeader = document.getElementById('vetosTimesHeader');
    if (vetosTimesHeader && sessaoVetos.sessao.time_a_id && sessaoVetos.sessao.time_b_id) {
        vetosTimesHeader.style.display = 'flex';
    }

    // Renderizar mapas
    renderizarMapas();

    // Renderizar ações realizadas
    renderizarAcoes();
    
    // Verificar se precisa mostrar modal CT/TR
    verificarModalCTTR();
}

// Determinar qual ação deve ser feita baseado no formato e ordem
function determinarProximaAcao(formato, ordemAtual) {
    if (formato === 'bo1') {
        // BO1: 6 vetos (A veta, B veta, A veta, B veta, A veta, B veta)
        // Ordem: 1,2,3,4,5,6 = todos ban
        return 'ban';
    } else if (formato === 'bo3') {
        // BO3: 2 vetos, 2 picks, 2 vetos
        // Ordem: 1,2 = ban | 3,4 = pick | 5,6 = ban
        if (ordemAtual <= 2) {
            return 'ban';
        } else if (ordemAtual <= 4) {
            return 'pick';
        } else if (ordemAtual <= 6) {
            return 'ban';
        }
    } else if (formato === 'bo5') {
        // BO5: 2 vetos, 4 picks
        // Ordem: 1,2 = ban | 3,4,5,6 = pick
        if (ordemAtual <= 2) {
            return 'ban';
        } else if (ordemAtual <= 6) {
            return 'pick';
        }
    }
    return 'ban'; // Default
}

// Cache de logos dos times
let logosTimesCache = {
    time_a: null,
    time_b: null
};

// Buscar logos dos times e cachear
async function buscarLogosTimes() {
    if (!sessaoVetos || !sessaoVetos.sessao) return;

    await garantirCacheTimes();
    const timeAId = sessaoVetos.sessao.time_a_id;
    const timeBId = sessaoVetos.sessao.time_b_id;

    if (timeAId) {
        logosTimesCache.time_a = getTimeDoCache(timeAId, 'Time A').logo;
    }
    if (timeBId) {
        logosTimesCache.time_b = getTimeDoCache(timeBId, 'Time B').logo;
    }
}

// Função auxiliar para verificar se um mapa é decider
function isMapaDecider(mapa, acao, formato, acoes, status) {
    if (!acao || acao.acao !== 'pick') return false;
    
    const ordemAcao = acao.ordem || 0;
    const isUltimoPick = ordemAcao === 7 && acao.acao === 'pick';
    
    if (!isUltimoPick) return false;
    
    const vetosFeitos = acoes.filter(a => a.acao === 'ban').length;
    const picksFeitos = acoes.filter(a => a.acao === 'pick').length;
    const bo1Finalizado = formato === 'bo1' && (vetosFeitos === 6 && picksFeitos >= 1) || status === 'finalizado';
    const bo3Finalizado = formato === 'bo3' && (vetosFeitos === 4 && picksFeitos >= 3) || status === 'finalizado';
    const bo5Finalizado = formato === 'bo5' && (vetosFeitos === 2 && picksFeitos >= 5) || status === 'finalizado';
    
    const isMapaFinalBO1 = bo1Finalizado && formato === 'bo1';
    const isMapaDeciderBO3 = bo3Finalizado && formato === 'bo3';
    const isMapaDeciderBO5 = bo5Finalizado && formato === 'bo5';
    
    return isMapaFinalBO1 || isMapaDeciderBO3 || isMapaDeciderBO5;
}

// Renderizar mapas
async function renderizarMapas() {
    const mapasContainer = document.getElementById('mapasContainer');
    const mapasSelecionados = sessaoVetos.sessao.mapas_selecionados;
    const acoes = sessaoVetos.acoes || [];
    const podeJogar = sessaoVetos.sessao.pode_jogar;
    const formato = sessaoVetos.sessao.formato;

    // Buscar logos dos times
    await buscarLogosTimes();

    // Criar mapa de ações por mapa
    const acoesPorMapa = {};
    acoes.forEach(acao => {
        acoesPorMapa[acao.mapa] = acao;
    });

    // Determinar próxima ação baseada na ordem atual
    const ordemAtual = acoes.length + 1;
    
    // Verificar se BO1 está finalizado (6 vetos + 1 pick automático)
    const vetosFeitos = acoes.filter(a => a.acao === 'ban').length;
    const picksFeitos = acoes.filter(a => a.acao === 'pick').length;
    const bo1Finalizado = formato === 'bo1' && (vetosFeitos === 6 && picksFeitos >= 1) || sessaoVetos.sessao.status === 'finalizado';
    
    // Verificar se BO3 está finalizado (2 ban + 2 pick + 2 ban + 1 pick automático)
    const bo3Finalizado = formato === 'bo3' && (vetosFeitos === 4 && picksFeitos >= 3) || sessaoVetos.sessao.status === 'finalizado';
    
    // Verificar se BO5 está finalizado (2 ban + 4 pick + 1 pick automático)
    const bo5Finalizado = formato === 'bo5' && (vetosFeitos === 2 && picksFeitos >= 5) || sessaoVetos.sessao.status === 'finalizado';
    
    const sessaoFinalizada = bo1Finalizado || bo3Finalizado || bo5Finalizado || sessaoVetos.sessao.status === 'finalizado';
    const proximaAcao = (podeJogar && !sessaoFinalizada) ? determinarProximaAcao(formato, ordemAtual) : null;

    mapasContainer.innerHTML = '';

    mapasSelecionados.forEach(mapa => {
        const acao = acoesPorMapa[mapa];
        // Normalizar nome do mapa para minúsculas (backend espera minúsculas)
        const mapaNormalizado = typeof mapa === 'string' ? mapa.toLowerCase() : mapa;
        // No banco os campos estão com primeira letra maiúscula (Mirage, Train, etc)
        const nomeCampo = typeof mapa === 'string' ? (mapa.charAt(0).toUpperCase() + mapa.slice(1)) : mapa;
        // Tentar diferentes variações do nome do campo
        const imagemUrl = imagensMapas[nomeCampo] || 
                         imagensMapas[mapa] || 
                         imagensMapas[mapa.toUpperCase()] ||
                         'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        const nomeMapa = nomeCampo;

        const mapaCard = document.createElement('div');
        mapaCard.className = 'mapa-card';
        mapaCard.setAttribute('data-mapa', mapaNormalizado);
        
        // Verificar se é o mapa decider usando função auxiliar
        let ehMapaDecider = false;
        if (acao) {
            ehMapaDecider = isMapaDecider(mapa, acao, formato, acoes, sessaoVetos.sessao.status);
            
            if (acao.acao === 'ban') {
                mapaCard.classList.add('banido');
            } else if (acao.acao === 'pick') {
                mapaCard.classList.add('pickado');
            }
            
            if (ehMapaDecider) {
                mapaCard.classList.add('decider');
            }
        } else if (!podeJogar) {
            mapaCard.classList.add('desabilitado');
        }

        // Determinar HTML do overlay (logos dos times)
        let overlayHTML = '';
        if (acao && !ehMapaDecider) {
            // Mapas banidos não mostram overlay (cor normal)
            if (acao.acao === 'ban') {
                overlayHTML = ''; // Sem overlay para mapas banidos
            } else if (acao.acao === 'pick' && acao.time_id) {
                // Quando pickado (não decider): só mostrar overlay completo se já tiver escolha de lado
                if (acao.lado_inicial) {
                    // Já tem escolha de lado, mostrar overlay completo
                    const timeIdQuePickou = acao.time_id;
                    const outroTimeId = timeIdQuePickou === sessaoVetos.sessao.time_a_id 
                        ? sessaoVetos.sessao.time_b_id 
                        : sessaoVetos.sessao.time_a_id;
                    
                    const logoTimeQuePickou = timeIdQuePickou === sessaoVetos.sessao.time_a_id 
                        ? logosTimesCache.time_a 
                        : logosTimesCache.time_b;
                    const logoOutroTime = outroTimeId === sessaoVetos.sessao.time_a_id 
                        ? logosTimesCache.time_a 
                        : logosTimesCache.time_b;
                    
                    const logoPickUrl = logoTimeQuePickou || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                    const logoCTUrl = logoOutroTime || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
                    
                    const ladoTexto = acao.lado_inicial.toUpperCase();
                    
                    // Determinar classe de animação baseado no lado
                    const classeAnimacao = ladoTexto === 'CT' ? 'texto-ct-animado' : 'texto-tr-animado';
                    
                    overlayHTML = `
                        <div class="mapa-overlay">
                            <img src="${logoPickUrl}" alt="Time Pick" class="mapa-logo-time" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <img src="${logoCTUrl}" alt="${ladoTexto}" class="mapa-logo-time pequeno" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                                <span class="${classeAnimacao}">${ladoTexto}</span>
                            </div>
                        </div>
                    `;
                }
                // Se não tem lado_inicial ainda, não mostrar overlay (aguardando escolha do outro time)
            }
            // Se for decider ou time_id for null, não mostrar logos (overlayHTML fica vazio)
        }

        // Determinar texto do status
        let statusTexto = '';
        let statusClasse = '';
        let botoesHTML = '';
        
        if (acao) {
            if (ehMapaDecider) {
                statusTexto = 'DECIDER';
                statusClasse = 'decider';
            } else if (acao.acao === 'ban') {
                statusTexto = 'BAN';
                statusClasse = 'ban';
            } else if (acao.acao === 'pick') {
                // Calcular número do pick baseado na ordem dos picks
                const picksOrdenados = acoes
                    .filter(a => a.acao === 'pick')
                    .sort((a, b) => a.ordem - b.ordem);
                const indicePick = picksOrdenados.findIndex(p => p.mapa === acao.mapa);
                const numeroPick = indicePick + 1; // Começar do 1
                statusTexto = `PICK #${numeroPick}`;
                statusClasse = 'pick';
            }
        } else if (podeJogar && proximaAcao && !sessaoFinalizada) {
            // Botão único que muda conforme a ação
            const textoBotao = proximaAcao === 'pick' ? 'Pick' : 'Veto';
            const classeBotao = proximaAcao === 'pick' ? 'btn-pick' : 'btn-ban';
            const mapaParaEnviar = mapaNormalizado;
            botoesHTML = `
                <div style="position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%); z-index: 10;">
                    <button class="${classeBotao}" onclick="realizarAcao('${mapaParaEnviar}', '${proximaAcao}')">
                        ${textoBotao}
                    </button>
                </div>
            `;
        }

        // Quando for decider, adicionar logos dos 2 times acima e faca abaixo
        if (ehMapaDecider) {
            // Buscar logos dos dois times
            const logoTimeA = logosTimesCache.time_a || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            const logoTimeB = logosTimesCache.time_b || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
            
            overlayHTML = `
                <div class="mapa-overlay">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <img src="${logoTimeA}" alt="Time A" class="mapa-logo-time" style="width: 80px; height: 80px;" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                        <span class="vs-text-decider">VS</span>
                        <img src="${logoTimeB}" alt="Time B" class="mapa-logo-time" style="width: 80px; height: 80px;" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                    </div>
                    <div class="mapa-faca-container" style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://img.icons8.com/external-others-inmotus-design/67/external-Knife-knives-others-inmotus-design.png" alt="Faca" class="mapa-faca-imagem" id="faca-${mapaNormalizado}">
                        <span class="texto-knife-animado">KNIFE</span>
                    </div>
                </div>
            `;
        }

        mapaCard.innerHTML = `
            <div class="mapa-imagem-container">
                <img src="${imagemUrl}" alt="${nomeMapa}" class="mapa-imagem" onerror="this.src='https://cdn-icons-png.flaticon.com/128/5726/5726775.png'">
                ${overlayHTML}
                <div class="mapa-info">
                    <div class="mapa-nome">${nomeMapa}</div>
                </div>
                ${botoesHTML}
            </div>
            ${statusTexto ? `
                <div class="mapa-status">
                    <div class="mapa-status-text ${statusClasse}">${statusTexto}</div>
                </div>
            ` : ''}
        `;

        mapasContainer.appendChild(mapaCard);
    });
    
    // Verificar se há decider e mostrar/esconder botão de ir para partida
    const temDecider = acoes.some(a => {
        if (a.acao !== 'pick') return false;
        return isMapaDecider(a.mapa, a, formato, acoes, sessaoVetos.sessao.status);
    });
    
    const btnIrPartidaContainer = document.getElementById('btnIrPartidaContainer');
    if (btnIrPartidaContainer) {
        if (temDecider) {
            btnIrPartidaContainer.style.display = 'block';
        } else {
            btnIrPartidaContainer.style.display = 'none';
        }
    }
}

// Renderizar ações realizadas
function renderizarAcoes() {
    const acoesLista = document.getElementById('acoesLista');
    
    // Se o elemento não existe (foi removido), não fazer nada
    if (!acoesLista) {
        return;
    }
    
    const acoes = sessaoVetos.acoes || [];

    if (acoes.length === 0) {
        acoesLista.innerHTML = '<p style="color: #9ddfff; text-align: center;">Nenhuma ação realizada ainda.</p>';
        return;
    }

    acoesLista.innerHTML = '';

    acoes.forEach((acao, index) => {
        const nomeMapa = acao.mapa.charAt(0).toUpperCase() + acao.mapa.slice(1);
        const acaoItem = document.createElement('div');
        acaoItem.className = 'acao-item';
        const textoAcao = acao.acao === 'ban' ? 'VETO' : 'PICK';
        acaoItem.innerHTML = `
            <span class="acao-tipo ${acao.acao}">${textoAcao}</span>
            <span class="acao-mapa">${nomeMapa}</span>
            <span style="color: #9ddfff; font-size: 0.85rem;">#${index + 1}</span>
        `;
        acoesLista.appendChild(acaoItem);
    });
}

// Realizar ação (pick/ban)
// Tornar função global para ser acessível via onclick
window.realizarAcao = async function realizarAcao(mapa, acao) {
    if (!sessaoVetos || !sessaoVetos.sessao || !sessaoVetos.sessao.pode_jogar) {
        alert('Não é o seu turno!');
        showNotification('error', 'Não é o seu turno!');
        return;
    }

    const acoes = sessaoVetos.acoes || [];
    const ordemAtual = acoes.length + 1;
    const acaoEsperada = determinarProximaAcao(sessaoVetos.sessao.formato, ordemAtual);

    if (acao !== acaoEsperada) {
        alert(`Ação incorreta! Você deve fazer ${acaoEsperada === 'pick' ? 'PICK' : 'VETO'} agora.`);
        showNotification('error', `Ação incorreta! Você deve fazer ${acaoEsperada === 'pick' ? 'PICK' : 'VETO'} agora.`);
        return;
    }

    const textoAcao = acao === 'pick' ? 'PICKAR' : 'VETAR';
    
    const confirmou = await showConfirmModal(`Tem certeza que deseja ${textoAcao} o mapa ${mapa.toUpperCase()}?`)
    if (!confirmou) return;

    try {
        const response = await fetch(`${API_URL}/vetos/acao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                mapa,
                acao
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                alert('Erro: ' + (errorData.message || 'Erro desconhecido'));
            } catch (e) {
                alert('Erro: ' + errorText);
            }
            return;
        }

        await response.json();
        showNotification('success', `Ação realizada com sucesso: ${textoAcao} o mapa ${mapa.toUpperCase()}`);

        await atualizarSessao();
        await renderizarInterface();

        if (acao === 'pick' && sessaoVetos?.sessao?.status === 'em_andamento') {
            const acoesAtualizadas = sessaoVetos.acoes || [];
            const acaoPickAtual = acoesAtualizadas.find((a) => a.mapa === mapa && a.acao === 'pick');
            if (acaoPickAtual && !isMapaDecider(mapa, acaoPickAtual, sessaoVetos.sessao.formato, acoesAtualizadas, sessaoVetos.sessao.status)) {
                setTimeout(() => verificarEscolhaCTTR(mapa), 800);
            }
        }

        if (sessaoVetos?.sessao?.status === 'em_andamento') {
            iniciarPolling();
        }
    } catch (error) {
        console.error('Erro ao realizar ação:', error);
        alert('Erro ao realizar ação: ' + error.message);
    }
}

// Mostrar erro
function mostrarErro(mensagem) {
    const loading = document.getElementById('loading');
    const erro = document.getElementById('erro');
    const mapasContainer = document.getElementById('mapasContainer');

    loading.style.display = 'none';
    mapasContainer.style.display = 'none';
    erro.style.display = 'block';
    erro.textContent = mensagem;
}

// Limpar intervalo ao sair da página
window.addEventListener('beforeunload', () => {
    pararPolling();
    if (intervaloRoleta) {
        clearInterval(intervaloRoleta);
    }
});

// Mostrar modal da roleta
function mostrarModalRoleta() {
    const modalRoleta = document.getElementById('modalRoleta');
    if (!modalRoleta) return;
    
    modalRoleta.style.display = 'flex';
    
    // Atualizar avatares na roleta
    if (sessaoVetos && sessaoVetos.sessao) {
        atualizarAvataresRoleta();
        atualizarStatusRoleta();
    }
    
    // Habilitar botão se ainda não clicou (mas esconder para espectadores)
    const btnClicarRoleta = document.getElementById('btnClicarRoleta');
    if (btnClicarRoleta) {
        const isSpectator = sessaoVetos?.sessao?.is_spectator === true;
        
        // Esconder botão para espectadores
        if (isSpectator) {
            btnClicarRoleta.style.display = 'none';
        } else {
            btnClicarRoleta.style.display = 'block';
            const timeAtual = sessaoVetos?.sessao?.time_atual;
            const jaClicou = timeAtual === 'time_a' 
                ? sessaoVetos.sessao.time_a_pronto 
                : sessaoVetos.sessao.time_b_pronto;
            
            btnClicarRoleta.disabled = jaClicou;
            if (jaClicou) {
                btnClicarRoleta.textContent = 'Você já clicou! Aguardando o outro time...';
            }
        }
    }
    
    // Iniciar atualização periódica do status
    // Atualizar mais frequentemente para que ambos os times vejam quando o outro clica
    if (intervaloRoleta) clearInterval(intervaloRoleta);
    intervaloRoleta = setInterval(async () => {
        if (roletaEstaGirandoAgora()) return;
        if (typeof isApiRateLimited === 'function' && isApiRateLimited()) return;

        const mudou = await atualizarSessao();
        atualizarStatusRoleta();

        if (
            mudou &&
            sessaoVetos?.sessao?.sorteio_realizado &&
            !roletaEstaGirandoAgora()
        ) {
            const btnClicarRoleta = document.getElementById('btnClicarRoleta');
            if (btnClicarRoleta) btnClicarRoleta.style.display = 'none';
            girarRoleta(sessaoVetos.sessao.turno_atual);
        }
    }, INTERVALO_ROleta_MS);
}

// Esconder modal da roleta
function esconderModalRoleta() {
    const modalRoleta = document.getElementById('modalRoleta');
    if (modalRoleta) {
        modalRoleta.style.display = 'none';
    }
    if (intervaloRoleta) {
        clearInterval(intervaloRoleta);
        intervaloRoleta = null;
    }
}

// Atualizar avatares na roleta
async function atualizarAvataresRoleta() {
    if (!sessaoVetos || !sessaoVetos.sessao) return;

    await garantirCacheTimes();

    const roletaTimeALogo = document.getElementById('roletaTimeALogo');
    const roletaTimeBLogo = document.getElementById('roletaTimeBLogo');
    const vetosTimeALogo = document.getElementById('vetosTimeALogo');
    const vetosTimeBLogo = document.getElementById('vetosTimeBLogo');
    const vetosTimeANome = document.getElementById('vetosTimeANome');
    const vetosTimeBNome = document.getElementById('vetosTimeBNome');

    if (sessaoVetos.sessao.time_a_id) {
        const timeA = getTimeDoCache(sessaoVetos.sessao.time_a_id, 'Time A');
        if (roletaTimeALogo) roletaTimeALogo.src = timeA.logo;
        if (vetosTimeALogo) vetosTimeALogo.src = timeA.logo;
        if (vetosTimeANome) vetosTimeANome.textContent = timeA.nome;
    }

    if (sessaoVetos.sessao.time_b_id) {
        const timeB = getTimeDoCache(sessaoVetos.sessao.time_b_id, 'Time B');
        if (roletaTimeBLogo) roletaTimeBLogo.src = timeB.logo;
        if (vetosTimeBLogo) vetosTimeBLogo.src = timeB.logo;
        if (vetosTimeBNome) vetosTimeBNome.textContent = timeB.nome;
    }
}

// Atualizar status da roleta (sem atualizar sessão para evitar loop)
function atualizarStatusRoleta() {
    if (!sessaoVetos || !sessaoVetos.sessao) return;
    
    const statusTimeA = document.getElementById('statusTimeA');
    const statusTimeB = document.getElementById('statusTimeB');
    const statusTimeAItem = statusTimeA?.parentElement;
    const statusTimeBItem = statusTimeB?.parentElement;
    const btnClicarRoleta = document.getElementById('btnClicarRoleta');
    
    // Esconder botão para espectadores
    const isSpectator = sessaoVetos?.sessao?.is_spectator === true;
    if (btnClicarRoleta && isSpectator) {
        btnClicarRoleta.style.display = 'none';
    }

    // Pegar nomes reais dos times (do header principal, se já carregado)
    const nomeTimeA =
        document.getElementById('vetosTimeANome')?.textContent?.trim() || 'Time A';
    const nomeTimeB =
        document.getElementById('vetosTimeBNome')?.textContent?.trim() || 'Time B';
    
    if (sessaoVetos.sessao.time_a_pronto) {
        if (statusTimeA) statusTimeA.textContent = `✅ ${nomeTimeA} pronto!`;
        if (statusTimeAItem) statusTimeAItem.classList.add('pronto');
    } else {
        if (statusTimeA) statusTimeA.textContent = `⏳ Aguardando ${nomeTimeA}...`;
        if (statusTimeAItem) statusTimeAItem.classList.remove('pronto');
    }
    
    if (sessaoVetos.sessao.time_b_pronto) {
        if (statusTimeB) statusTimeB.textContent = `✅ ${nomeTimeB} pronto!`;
        if (statusTimeBItem) statusTimeBItem.classList.add('pronto');
    } else {
        if (statusTimeB) statusTimeB.textContent = `⏳ Aguardando ${nomeTimeB}...`;
        if (statusTimeBItem) statusTimeBItem.classList.remove('pronto');
    }
    
    // NÃO chamar girarRoleta aqui - isso será feito apenas no callback do clique
    // para evitar múltiplas animações
}

// Girar a roleta
async function girarRoleta(vencedor) {
    if (roletaGirando) return;

    const roleta = document.getElementById('roleta');
    if (roleta && roleta.classList.contains('girando')) {
        roletaGirando = true;
        return;
    }

    if (roleta && roleta.hasAttribute('data-roleta-protegida')) {
        roletaGirando = true;
        return;
    }

    if (roleta && roleta.hasAttribute('data-rotacao-final')) {
        roletaGirando = true;
        return;
    }

    roletaGirando = true;
    roletaIniciadaEm = Date.now();

    if (intervaloRoleta) {
        clearInterval(intervaloRoleta);
        intervaloRoleta = null;
    }
    pararPolling();
    
    // Buscar elementos
    const btnClicarRoleta = document.getElementById('btnClicarRoleta');
    const resultadoRoleta = document.getElementById('resultadoRoleta');
    
    if (!roleta) {
        console.error('Elemento roleta não encontrado!');
        roletaGirando = false;
        return;
    }
    
    // Esconder botão durante a animação
    if (btnClicarRoleta) {
        btnClicarRoleta.style.display = 'none';
    }
    
    // Calcular rotação final baseada no vencedor
    // Se time_a ganhou, parar no lado esquerdo (0-180deg)
    // Se time_b ganhou, parar no lado direito (180-360deg)
    const rotacaoBase = vencedor === 'time_a' ? 0 : 180;
    const rotacaoExtra = Math.random() * 180; // Adicionar variação
    const rotacaoFinal = rotacaoBase + rotacaoExtra + 8640; // 24 voltas completas + rotação final (30 segundos)
    
    // Armazenar a rotação final em um atributo data para não ser alterada
    roleta.setAttribute('data-rotacao-final', rotacaoFinal.toString());
    roleta.setAttribute('data-roleta-protegida', 'true');
    
    // CRÍTICO: Não fazer NADA se a classe já estiver presente
    if (roleta.classList.contains('girando')) {
        return;
    }
    
    // Definir a rotação final ANTES de qualquer manipulação visual
    roleta.style.setProperty('--rotacao-final', `${rotacaoFinal}deg`);
    
    // NÃO resetar transform - deixar o CSS fazer tudo
    // Apenas adicionar a classe - a animação CSS vai fazer o resto
    roleta.classList.add('girando');
    
    // Adicionar listener para detectar quando a animação termina
    const handleAnimationEnd = (e) => {
        // Verificar se é a animação da roleta (não de outro elemento)
        if (e.target === roleta && e.animationName === 'girar') {
            roleta.removeEventListener('animationend', handleAnimationEnd);
        }
    };

    roleta.addEventListener('animationend', handleAnimationEnd);

    // Após a animação (30 segundos), mostrar resultado
    setTimeout(async () => {
        // Buscar dados do time vencedor
        const timeVencedorId = vencedor === 'time_a' 
            ? sessaoVetos.sessao.time_a_id 
            : sessaoVetos.sessao.time_b_id;
        
        await garantirCacheTimes();
        const timeVencedor = timeVencedorId
            ? getTimeDoCache(timeVencedorId, vencedor === 'time_a' ? 'Time A' : 'Time B')
            : null;
        
        // Mostrar resultado
        if (resultadoRoleta) {
            const textoVencedor = document.getElementById('textoVencedor');
            const avatarVencedorImg = document.getElementById('avatarVencedorImg');
            const textoVencedorInfo = document.getElementById('textoVencedorInfo');
            
            if (textoVencedor) {
                textoVencedor.textContent = `🏆 ${vencedor === 'time_a' ? 'Time A' : 'Time B'} Venceu!`;
                
            }
            
            if (avatarVencedorImg && timeVencedor) {
                avatarVencedorImg.src = timeVencedor.logo;
                avatarVencedorImg.alt = timeVencedor.nome;
            } else if (avatarVencedorImg) {
                // Usar avatar do header se não conseguir buscar
                const headerLogo = vencedor === 'time_a' 
                    ? document.getElementById('roletaTimeALogo')?.src
                    : document.getElementById('roletaTimeBLogo')?.src;
                if (headerLogo) {
                    avatarVencedorImg.src = headerLogo;
                }
            }
            
            if (textoVencedorInfo) {
                textoVencedorInfo.textContent = 'Este time começa a vetar primeiro!';
                showNotification('success', `Este time começa a vetar primeiro ${vencedor === 'time_a' ? 'Time A' : 'Time B'}!`);
            }
            
            resultadoRoleta.style.display = 'block';
        }
        
        // Aguardar mais 5 segundos para o usuário ver o resultado antes de fechar
        setTimeout(async () => {
            esconderModalRoleta();
            
            // LIMPAR TODOS os indicadores de roleta girando ANTES de atualizar
            roletaGirando = false;
            roletaIniciadaEm = null;
            
            // Remover proteção da roleta
            if (roleta) {
                roleta.removeAttribute('data-roleta-protegida');
                roleta.removeAttribute('data-rotacao-final');
                roleta.classList.remove('girando');
            }
            
            await atualizarSessao();
            await renderizarInterface();

            if (sessaoVetos?.sessao?.status === 'em_andamento') {
                iniciarPolling();
            }
        }, 5000);
    }, 30000); // 30 segundos de animação
}

// Clique no botão da roleta
async function clicarRoleta() {
    if (!token) return;
    
    // Bloquear espectadores
    if (sessaoVetos?.sessao?.is_spectator === true) {
        return;
    }
    
    const btnClicarRoleta = document.getElementById('btnClicarRoleta');
    if (btnClicarRoleta) {
        btnClicarRoleta.disabled = true;
        btnClicarRoleta.textContent = 'Processando...';
        btnClicarRoleta.style.display = 'block'; // Garantir que está visível
    }
    
    try {
        const response = await fetch(`${API_URL}/vetos/roleta/clique`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', response.status, errorText);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (response.ok) {
            // Atualizar sessão local
            if (sessaoVetos && sessaoVetos.sessao) {
                sessaoVetos.sessao.time_a_pronto = data.time_a_pronto;
                sessaoVetos.sessao.time_b_pronto = data.time_b_pronto;
                sessaoVetos.sessao.sorteio_realizado = data.sorteio_realizado;
                if (data.turno_inicial) {
                    sessaoVetos.sessao.turno_atual = data.turno_inicial;
                }
            }
            
            // Atualizar status
            atualizarStatusRoleta();
            
            // Se o sorteio foi realizado, girar a roleta
            // Verificar se já não está girando para evitar múltiplas animações
            if (data.sorteio_realizado && data.vencedor) {
                // Verificar se a roleta já está girando (verificação tripla)
                const roleta = document.getElementById('roleta');
                const tempoDesdeInicio = roletaIniciadaEm ? Date.now() - roletaIniciadaEm : Infinity;
                const animacaoEmAndamento = tempoDesdeInicio < 35000; // 30s animação + 5s margem
                const jaEstaGirando = roletaGirando || 
                                      (roleta && roleta.classList.contains('girando')) ||
                                      animacaoEmAndamento;
                
                if (!jaEstaGirando) {
                    // Esconder botão antes de iniciar animação
                    if (btnClicarRoleta) {
                        btnClicarRoleta.style.display = 'none';
                    }
                    // Chamar diretamente - a função vai verificar novamente antes de iniciar
                    girarRoleta(data.vencedor);
                } else {
                    // Se a roleta já está girando, apenas esconder o botão
                    if (btnClicarRoleta) {
                        btnClicarRoleta.style.display = 'none';
                    }
                }
            } else {
                // Se ainda não foi sorteado, restaurar botão
                if (btnClicarRoleta) {
                    btnClicarRoleta.disabled = false;
                    btnClicarRoleta.style.display = 'block';
                    btnClicarRoleta.textContent = 'Aguardando o outro time...';
                }
            }
        } else {
            alert('Erro: ' + (data.message || 'Erro desconhecido'));
            if (btnClicarRoleta) {
                btnClicarRoleta.disabled = false;
                btnClicarRoleta.style.display = 'block';
                btnClicarRoleta.textContent = 'Clique para Iniciar Sorteio';
            }
        }
    } catch (error) {
        console.error('Erro ao clicar na roleta:', error);
        let mensagemErro = 'Erro ao registrar clique';
        if (error.message && error.message.includes('404')) {
            mensagemErro = 'Erro: Rota não encontrada. Por favor, reinicie o servidor backend para carregar as novas rotas.';
        } else if (error.message) {
            mensagemErro = 'Erro: ' + error.message;
        }
        alert(mensagemErro);
        if (btnClicarRoleta) {
            btnClicarRoleta.disabled = false;
            btnClicarRoleta.style.display = 'block';
            btnClicarRoleta.textContent = 'Clique para Iniciar Sorteio';
        }
    }
}

// Verificar se precisa mostrar modal de escolha CT/TR
async function verificarEscolhaCTTR(mapa) {
    if (!sessaoVetos || !sessaoVetos.acoes || !sessaoVetos.sessao) return;
    
    // Verificar se é espectador - espectadores não podem escolher lado
    const isSpectator = sessaoVetos.sessao.is_spectator === true;
    if (isSpectator) return;
    
    // Verificar se o card tem a classe "decider" no DOM
    const mapaNormalizado = typeof mapa === 'string' ? mapa.toLowerCase() : mapa;
    const mapaCard = document.querySelector(`[data-mapa="${mapaNormalizado}"]`);
    if (mapaCard && mapaCard.classList.contains('decider')) {
        return; // Card é decider, não mostrar modal
    }
    
    // Buscar a ação de pick para este mapa
    const acaoPick = sessaoVetos.acoes.find(a => a.mapa === mapa && a.acao === 'pick');
    if (!acaoPick) return;
    
    // Verificar se é o mapa decider - decider não precisa escolher CT/TR
    const formato = sessaoVetos.sessao.formato;
    const acoes = sessaoVetos.acoes || [];
    const status = sessaoVetos.sessao.status;
    
    if (isMapaDecider(mapa, acaoPick, formato, acoes, status)) {
        return; // Decider não precisa escolher CT/TR
    }
    
    // Verificar se já tem escolha de CT/TR
    if (acaoPick.lado_inicial) return; // Já escolheu
    
    // Verificar qual time está logado baseado no time_atual da sessão
    // Se time_atual é 'time_a', então o token é do time_a, senão é do time_b
    const timeAtualId = sessaoVetos.sessao.time_atual === 'time_a' 
        ? sessaoVetos.sessao.time_a_id 
        : sessaoVetos.sessao.time_b_id;
    
    // Verificar se é o outro time (não o que fez o pick)
    if (acaoPick.time_id === timeAtualId) return; // É o mesmo time que fez o pick
    
    // Mostrar modal
    mostrarModalCTTR(mapa);
}

// Mostrar modal de escolha CT/TR
function mostrarModalCTTR(mapa) {
    // Verificar novamente se é espectador (segurança extra)
    if (sessaoVetos?.sessao?.is_spectator === true) {
        return;
    }
    
    const modal = document.getElementById('modalCTTR');
    const mapaNome = document.getElementById('modalMapaNome');
    
    if (!modal || !mapaNome) return;
    
    mapaNome.textContent = mapa.toUpperCase();
    modal.style.display = 'flex';
    
    // Adicionar listeners nos botões
    const btnCT = document.getElementById('btnEscolherCT');
    const btnTR = document.getElementById('btnEscolherTR');
    
    if (btnCT) {
        btnCT.onclick = () => salvarEscolhaCTTR(mapa, 'CT');
    }
    
    if (btnTR) {
        btnTR.onclick = () => salvarEscolhaCTTR(mapa, 'TR');
    }
}

// Salvar escolha de CT/TR
async function salvarEscolhaCTTR(mapa, lado) {
    try {
        const response = await fetch(`${API_URL}/vetos/escolher-lado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                mapa,
                lado
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            alert('Erro: ' + (errorData.message || 'Erro ao salvar escolha'));
            return;
        }

        // Fechar modal
        const modal = document.getElementById('modalCTTR');
        if (modal) modal.style.display = 'none';
        
        await atualizarSessao();
        await renderizarInterface();
    } catch (error) {
        console.error('Erro ao salvar escolha CT/TR:', error);
        alert('Erro ao salvar escolha');
    }
}

// Verificar modal CT/TR ao atualizar sessão
async function verificarModalCTTR() {
    if (!sessaoVetos || !sessaoVetos.acoes || !sessaoVetos.sessao) return;
    
    // Verificar se é espectador - espectadores não podem escolher lado
    const isSpectator = sessaoVetos.sessao.is_spectator === true;
    if (isSpectator) return;
    
    // Verificar se há picks sem escolha de lado (excluindo decider)
    const formato = sessaoVetos.sessao.formato;
    const acoes = sessaoVetos.acoes || [];
    const vetosFeitos = acoes.filter(a => a.acao === 'ban').length;
    const picksFeitos = acoes.filter(a => a.acao === 'pick').length;
    const bo1Finalizado = formato === 'bo1' && (vetosFeitos === 6 && picksFeitos >= 1) || sessaoVetos.sessao.status === 'finalizado';
    const bo3Finalizado = formato === 'bo3' && (vetosFeitos === 4 && picksFeitos >= 3) || sessaoVetos.sessao.status === 'finalizado';
    const bo5Finalizado = formato === 'bo5' && (vetosFeitos === 2 && picksFeitos >= 5) || sessaoVetos.sessao.status === 'finalizado';
    
    // Buscar picks sem escolha de lado (excluindo decider)
    const picksSemLado = sessaoVetos.acoes.filter(a => {
        if (a.acao !== 'pick' || a.lado_inicial) return false;
        
        // Verificar se o card tem a classe "decider" no DOM
        const mapaNormalizado = typeof a.mapa === 'string' ? a.mapa.toLowerCase() : a.mapa;
        const mapaCard = document.querySelector(`[data-mapa="${mapaNormalizado}"]`);
        if (mapaCard && mapaCard.classList.contains('decider')) {
            return false; // É decider, excluir
        }
        
        // Verificar se é decider usando a função auxiliar
        const formato = sessaoVetos.sessao.formato;
        const acoes = sessaoVetos.acoes || [];
        const status = sessaoVetos.sessao.status;
        return !isMapaDecider(a.mapa, a, formato, acoes, status); // Excluir decider
    });
    
    if (picksSemLado.length === 0) return;
    
    // Verificar qual time está logado
    const timeAtualId = sessaoVetos.sessao.time_atual === 'time_a' 
        ? sessaoVetos.sessao.time_a_id 
        : sessaoVetos.sessao.time_b_id;
    
    // Verificar se é o outro time para cada pick
    for (const acao of picksSemLado) {
        if (acao.time_id !== timeAtualId) {
            mostrarModalCTTR(acao.mapa);
            break; // Mostrar apenas um modal por vez
        }
    }
}

// Função para redirecionar para página de partida
function irParaPartida() {
    if (!sessaoVetos || !sessaoVetos.sessao) {
        alert('Erro: Sessão não encontrada');
        return;
    }
    
    const partidaId = sessaoVetos.sessao.partida_id;
    if (partidaId) {
        window.location.href = `resultado.html?id=${partidaId}`;
    } else {
        alert('Erro: ID da partida não encontrado');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    
    // Adicionar listener no botão da roleta
    const btnClicarRoleta = document.getElementById('btnClicarRoleta');
    if (btnClicarRoleta) {
        btnClicarRoleta.addEventListener('click', clicarRoleta);
    }
});

