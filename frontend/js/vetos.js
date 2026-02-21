
// Obter token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

let sessaoVetos = null;
let imagensMapas = {};
let intervaloAtualizacao = null;
let intervaloRoleta = null;
let roletaGirando = false;
let roletaIniciadaEm = null; // Timestamp de quando a roleta começou a girar

// Carregar dados iniciais
async function carregarDados() {
    if (!token) {
        mostrarErro('Token não encontrado na URL');
        return;
    }

    try {
        // Carregar imagens dos mapas
        const responseImagens = await fetch(`${API_URL}/imgmap`);
        const dataImagens = await responseImagens.json();
        
        console.log('Dados de imagens recebidos:', dataImagens);
        
        if (dataImagens && Array.isArray(dataImagens) && dataImagens.length > 0) {
            imagensMapas = dataImagens[0]; // Pega o primeiro registro
        } else if (dataImagens && typeof dataImagens === 'object' && !Array.isArray(dataImagens)) {
            imagensMapas = dataImagens;
        } else {
            console.warn('Formato de dados de imagens não reconhecido');
            imagensMapas = {};
        }
        
        console.log('Imagens de mapas processadas:', imagensMapas);

        // Carregar sessão de vetos
        await atualizarSessao();
        
        // Se a sessão já foi carregada, renderizar novamente com as imagens
        if (sessaoVetos) {
            renderizarMapas();
        }
        
        // Iniciar atualização automática
        // Mas não atualizar se a roleta estiver girando
        console.log('🚀 Iniciando intervalo de atualização automática');
        intervaloAtualizacao = setInterval(async () => {
            // Não atualizar sessão se a roleta estiver girando
            const roleta = document.getElementById('roleta');
            const roletaEstaGirando = roletaGirando || 
                                     (roleta && roleta.classList.contains('girando')) ||
                                     (roleta && roleta.hasAttribute('data-roleta-protegida'));
            
            if (roletaEstaGirando) {
                return;
            }
            
            await atualizarSessao();
            
            // Verificar se há picks pendentes de escolha CT/TR
            if (sessaoVetos && sessaoVetos.acoes) {
                const picksPendentes = sessaoVetos.acoes.filter(a => 
                    a.acao === 'pick' && !a.lado_inicial
                );
                if (picksPendentes.length > 0) {
                    verificarModalCTTR();
                }
            }
            
            // SEMPRE renderizar se a sessão estiver em andamento ou tiver ações
            // Isso garante que todas as mudanças sejam visíveis automaticamente
            const status = sessaoVetos?.sessao?.status;
            const acoesCount = sessaoVetos?.acoes?.length || 0;
            
            if (status === 'em_andamento' || acoesCount > 0) {
                console.log('🎨 Renderizando interface (intervalo principal):', { 
                    status, 
                    acoesCount,
                    turno_atual: sessaoVetos?.sessao?.turno_atual,
                    pode_jogar: sessaoVetos?.sessao?.pode_jogar
                });
                renderizarInterface();
            }
        }, 2000); // Atualiza a cada 2 segundos
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados');
    }
}

// Atualizar sessão de vetos
async function atualizarSessao() {
    try {
        const response = await fetch(`${API_URL}/vetos/sessao/${token}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            mostrarErro(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        sessaoVetos = data;
        
        console.log('📥 Dados da sessão atualizados:', {
            turno_atual: data.sessao?.turno_atual,
            pode_jogar: data.sessao?.pode_jogar,
            status: data.sessao?.status,
            acoes_count: data.acoes?.length || 0,
            acoes: data.acoes?.map(a => `${a.mapa} (${a.acao})`) || []
        });
        
        // Se a sessão foi finalizada (BO1 completo), mostrar mensagem
        if (data.sessao_finalizada && data.mapa_final) {
            const nomeMapaFinal = data.mapa_final.charAt(0).toUpperCase() + data.mapa_final.slice(1);
            console.log(`Sessão finalizada! Mapa do jogo: ${nomeMapaFinal}`);
        }
        
        // Verificar se a sessão foi finalizada e redirecionar para página de resultado
        if (data.sessao && data.sessao.status === 'finalizado') {
            const partidaId = data.sessao.partida_id;
            if (partidaId) {
                console.log('🔄 Vetos finalizados! Redirecionando para página de resultado. Partida ID:', partidaId);
                // Aguardar 2 segundos para o usuário ver que finalizou antes de redirecionar
                setTimeout(() => {
                    window.location.href = `resultado.html?id=${partidaId}`;
                }, 2000);
                return; // Sair da função para não continuar processando
            } else {
                console.log('⚠️ Sessão finalizada mas partida_id não encontrado');
            }
        }
        
        // Verificar se precisa mostrar o modal da roleta
        if (data.sessao && !data.sessao.sorteio_realizado) {
            mostrarModalRoleta();
            atualizarStatusRoleta(); // Atualizar status sem recarregar sessão
        } else if (data.sessao && data.sessao.sorteio_realizado) {
            // Se o sorteio foi realizado, NÃO fazer nada se a roleta já está girando
            // Isso evita reiniciar a animação
            const roleta = document.getElementById('roleta');
            const roletaEstaGirando = roletaGirando || 
                                     (roleta && roleta.classList.contains('girando')) ||
                                     (roleta && roleta.hasAttribute('data-roleta-protegida'));
            
            if (!roletaEstaGirando) {
                // Se ainda não está girando, SEMPRE renderizar interface
                // Isso garante que as atualizações sejam visíveis
                console.log('🎨 Renderizando interface após atualizar sessão (sorteio realizado)');
                renderizarInterface();
            }
            // Se já está girando, não fazer nada - deixar a animação continuar
        } else {
            // Se não há roleta ou sorteio já foi realizado, sempre renderizar
            console.log('🎨 Renderizando interface após atualizar sessão (sem roleta)');
            renderizarInterface();
        }
    } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
        mostrarErro('Erro de conexão. Verifique se o servidor está rodando.');
    }
}

// Buscar dados de um time por ID
async function buscarTimePorId(timeId) {
    if (!timeId) return null;
    
    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            id: timeId,
            nome: data.time?.nome || 'Time',
            logo: data.time?.avatar_time_url || 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png'
        };
    } catch (error) {
        console.error('Erro ao buscar time:', error);
        return null;
    }
}

// Atualizar header com informações dos times
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

    // Se não houver IDs dos times, esconder o header
    if (!timeAId || !timeBId) {
        vetosTimesHeader.style.display = 'none';
        return;
    }

    // Buscar dados dos times
    const [timeA, timeB] = await Promise.all([
        buscarTimePorId(timeAId),
        buscarTimePorId(timeBId)
    ]);

    if (timeA) {
        vetosTimeALogo.src = timeA.logo;
        vetosTimeANome.textContent = timeA.nome;
    } else {
        vetosTimeALogo.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        vetosTimeANome.textContent = 'Time A';
    }

    if (timeB) {
        vetosTimeBLogo.src = timeB.logo;
        vetosTimeBNome.textContent = timeB.nome;
    } else {
        vetosTimeBLogo.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        vetosTimeBNome.textContent = 'Time B';
    }

    // Mostrar o header
    vetosTimesHeader.style.display = 'flex';
}

// Renderizar interface
async function renderizarInterface() {
    if (!sessaoVetos) return;

    // Verificar se a sessão foi finalizada e redirecionar
    if (sessaoVetos.sessao && sessaoVetos.sessao.status === 'finalizado') {
        const partidaId = sessaoVetos.sessao.partida_id;
        if (partidaId) {
            console.log('🔄 Vetos finalizados! Redirecionando para página de resultado. Partida ID:', partidaId);
            // Aguardar 2 segundos para o usuário ver que finalizou antes de redirecionar
            setTimeout(() => {
                window.location.href = `resultado.html?id=${partidaId}`;
            }, 2000);
            return; // Sair da função para não continuar renderizando
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
    
    const timeAId = sessaoVetos.sessao.time_a_id;
    const timeBId = sessaoVetos.sessao.time_b_id;
    
    if (timeAId && !logosTimesCache.time_a) {
        const timeA = await buscarTimePorId(timeAId);
        if (timeA) {
            logosTimesCache.time_a = timeA.logo;
        }
    }
    
    if (timeBId && !logosTimesCache.time_b) {
        const timeB = await buscarTimePorId(timeBId);
        if (timeB) {
            logosTimesCache.time_b = timeB.logo;
        }
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
    console.log('🎯 realizarAcao chamada:', { mapa, acao, pode_jogar: sessaoVetos?.sessao?.pode_jogar });
    
    if (!sessaoVetos || !sessaoVetos.sessao || !sessaoVetos.sessao.pode_jogar) {
        console.log('❌ Não é o turno do jogador');
        alert('Não é o seu turno!');
        return;
    }

    // Verificar se a ação está correta para a ordem atual
    const acoes = sessaoVetos.acoes || [];
    const ordemAtual = acoes.length + 1;
    const acaoEsperada = determinarProximaAcao(sessaoVetos.sessao.formato, ordemAtual);
    
    console.log('📋 Verificação de ação:', { ordemAtual, acaoEsperada, acao });
    
    if (acao !== acaoEsperada) {
        alert(`Ação incorreta! Você deve fazer ${acaoEsperada === 'pick' ? 'PICK' : 'VETO'} agora.`);
        return;
    }

    const textoAcao = acao === 'pick' ? 'PICKAR' : 'VETAR';
    if (!confirm(`Tem certeza que deseja ${textoAcao} o mapa ${mapa.toUpperCase()}?`)) {
        return;
    }

    try {
        console.log('📤 Enviando ação para o backend:', { token, mapa, acao });
        
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

        console.log('📥 Resposta recebida:', { status: response.status, ok: response.ok });

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

        const data = await response.json();
        console.log('✅ Ação realizada com sucesso:', data);
        console.log('📊 Próximo turno:', data.proximo_turno);

        // Atualizar sessão imediatamente para pegar o novo turno
        await atualizarSessao();
        
        // Se foi um pick, verificar se o outro time precisa escolher CT/TR (exceto decider)
        if (acao === 'pick') {
            // Verificar se é decider antes de mostrar modal
            await atualizarSessao();
            const acoes = sessaoVetos?.acoes || [];
            const formato = sessaoVetos?.sessao?.formato;
            const status = sessaoVetos?.sessao?.status;
            
            // Buscar a ação de pick que acabou de ser feita
            const acaoPickAtual = acoes.find(a => a.mapa === mapa && a.acao === 'pick');
            if (acaoPickAtual) {
                // Verificar se é decider usando a função auxiliar
                const isDecider = isMapaDecider(mapa, acaoPickAtual, formato, acoes, status);
                
                // Só verificar CT/TR se NÃO for decider
                if (!isDecider) {
                    setTimeout(async () => {
                        await atualizarSessao();
                        verificarEscolhaCTTR(mapa);
                    }, 1000);
                }
            }
        }
        console.log('🔄 Sessão atualizada após ação');
        console.log('📊 Turno atual na sessão:', sessaoVetos?.sessao?.turno_atual);
        console.log('🎮 Pode jogar:', sessaoVetos?.sessao?.pode_jogar);
        
        // Renderizar interface novamente para atualizar visualmente
        await renderizarInterface();
        console.log('🎨 Interface renderizada após ação');
        
        // Garantir que o intervalo de atualização está rodando para o outro time ver
        if (!intervaloAtualizacao) {
            console.log('🔄 Reiniciando intervalo de atualização');
            intervaloAtualizacao = setInterval(async () => {
                // Não atualizar sessão se a roleta estiver girando
                const roleta = document.getElementById('roleta');
                const roletaEstaGirando = roletaGirando || 
                                         (roleta && roleta.classList.contains('girando')) ||
                                         (roleta && roleta.hasAttribute('data-roleta-protegida'));
                
                if (roletaEstaGirando) {
                    return;
                }
                
                await atualizarSessao();
                
                // SEMPRE renderizar se a sessão estiver em andamento
                // Isso garante que todas as mudanças sejam visíveis
                const status = sessaoVetos?.sessao?.status;
                const acoesCount = sessaoVetos?.acoes?.length || 0;
                
                if (status === 'em_andamento' || acoesCount > 0) {
                    console.log('🎨 Renderizando interface (intervalo após ação)');
                    renderizarInterface();
                }
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Erro ao realizar ação:', error);
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
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
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
        // VERIFICAÇÃO CRÍTICA: NÃO fazer NADA se a roleta estiver girando
        const roleta = document.getElementById('roleta');
        const roletaEstaGirando = roletaGirando || 
                                 (roleta && roleta.classList.contains('girando')) ||
                                 (roleta && roleta.hasAttribute('data-roleta-protegida'));
        
        if (roletaEstaGirando) {
            // Se a roleta estiver girando, SAIR IMEDIATAMENTE sem fazer nada
            console.log('⏸️ Intervalo ignorado - roleta está girando');
            return; // Sair da função imediatamente
        }
        
        // Atualizar sessão apenas se a roleta NÃO estiver girando
        await atualizarSessao();
        
        // Verificar novamente após atualizarSessao (pode ter mudado)
        const aindaNaoEstaGirando = !roletaGirando && 
                                   !(roleta && roleta.classList.contains('girando')) &&
                                   !(roleta && roleta.hasAttribute('data-roleta-protegida'));
        
        // Se o sorteio foi realizado e a roleta ainda não está girando, iniciar animação
        if (aindaNaoEstaGirando && sessaoVetos && sessaoVetos.sessao && sessaoVetos.sessao.sorteio_realizado) {
            const btnClicarRoleta = document.getElementById('btnClicarRoleta');
            
            if (aindaNaoEstaGirando) {
                // Esconder botão antes de iniciar animação
                if (btnClicarRoleta) {
                    btnClicarRoleta.style.display = 'none';
                }
                // Chamar diretamente - a função vai verificar novamente antes de iniciar
                console.log('🎰 Intervalo iniciando animação da roleta');
                girarRoleta(sessaoVetos.sessao.turno_atual);
            }
        }
        
        // Atualizar apenas o status visual (sem chamar girarRoleta novamente)
        atualizarStatusRoleta();
    }, 500); // Atualizar a cada 500ms para resposta mais rápida
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
    
    const roletaTimeALogo = document.getElementById('roletaTimeALogo');
    const roletaTimeBLogo = document.getElementById('roletaTimeBLogo');
    const vetosTimeALogo = document.getElementById('vetosTimeALogo');
    const vetosTimeBLogo = document.getElementById('vetosTimeBLogo');
    const vetosTimeANome = document.getElementById('vetosTimeANome');
    const vetosTimeBNome = document.getElementById('vetosTimeBNome');
    
    if (sessaoVetos.sessao.time_a_id) {
        const timeA = await buscarTimePorId(sessaoVetos.sessao.time_a_id);
        if (timeA && roletaTimeALogo) {
            roletaTimeALogo.src = timeA.logo;
        }
        // Também atualizar header principal, se existir
        if (timeA && vetosTimeALogo) {
            vetosTimeALogo.src = timeA.logo;
        }
        if (timeA && vetosTimeANome) {
            vetosTimeANome.textContent = timeA.nome || 'Time A';
        }
    }
    
    if (sessaoVetos.sessao.time_b_id) {
        const timeB = await buscarTimePorId(sessaoVetos.sessao.time_b_id);
        if (timeB && roletaTimeBLogo) {
            roletaTimeBLogo.src = timeB.logo;
        }
        // Também atualizar header principal, se existir
        if (timeB && vetosTimeBLogo) {
            vetosTimeBLogo.src = timeB.logo;
        }
        if (timeB && vetosTimeBNome) {
            vetosTimeBNome.textContent = timeB.nome || 'Time B';
        }
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
    // Verificar se já está girando ANTES de fazer qualquer coisa
    if (roletaGirando) {
        console.log('Roleta já está girando, ignorando chamada duplicada');
        return;
    }
    
    // Verificar se a roleta já tem a classe girando (animação CSS já iniciada)
    const roleta = document.getElementById('roleta');
    if (roleta && roleta.classList.contains('girando')) {
        console.log('Roleta já tem classe girando, ignorando chamada duplicada');
        roletaGirando = true; // Sincronizar flag com estado real
        return;
    }
    
    // Verificar se a roleta está protegida (animação em andamento)
    if (roleta && roleta.hasAttribute('data-roleta-protegida')) {
        console.log('Roleta está protegida contra alterações, ignorando chamada duplicada');
        roletaGirando = true;
        return;
    }
    
    // Verificar se há uma rotação final já definida (animação já iniciada)
    if (roleta && roleta.hasAttribute('data-rotacao-final')) {
        console.log('Roleta já tem rotação final definida, ignorando chamada duplicada');
        roletaGirando = true;
        return;
    }
    
    // Setar flag e timestamp imediatamente para evitar chamadas duplicadas
    roletaGirando = true;
    roletaIniciadaEm = Date.now(); // Registrar quando a animação começou
    
    console.log('🔒 BLOQUEANDO todos os intervalos - roleta iniciando animação');
    
    // Parar TODOS os intervalos de atualização para não interferir na animação
    if (intervaloRoleta) {
        clearInterval(intervaloRoleta);
        intervaloRoleta = null;
        console.log('✅ Intervalo roleta parado');
    }
    // Parar também o intervalo principal de atualização
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
        intervaloAtualizacao = null;
        console.log('✅ Intervalo principal parado');
    }
    
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
    
    console.log('Iniciando animação da roleta. Vencedor:', vencedor, 'Rotação final:', rotacaoFinal);
    
    // Armazenar a rotação final em um atributo data para não ser alterada
    roleta.setAttribute('data-rotacao-final', rotacaoFinal.toString());
    roleta.setAttribute('data-roleta-protegida', 'true');
    
    // CRÍTICO: Não fazer NADA se a classe já estiver presente
    if (roleta.classList.contains('girando')) {
        console.log('ERRO: Tentativa de reiniciar roleta que já está girando!');
        return; // Sair imediatamente sem fazer nada
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
            console.log('Animação da roleta terminou corretamente');
            roleta.removeEventListener('animationend', handleAnimationEnd);
        }
    };
    
    roleta.addEventListener('animationend', handleAnimationEnd);
    
    // Log para debug
    console.log('Animação iniciada. Classe girando:', roleta.classList.contains('girando'));
    console.log('Rotação final definida:', roleta.style.getPropertyValue('--rotacao-final'));
    
    // Após a animação (30 segundos), mostrar resultado
    setTimeout(async () => {
        // Buscar dados do time vencedor
        const timeVencedorId = vencedor === 'time_a' 
            ? sessaoVetos.sessao.time_a_id 
            : sessaoVetos.sessao.time_b_id;
        
        let timeVencedor = null;
        if (timeVencedorId) {
            timeVencedor = await buscarTimePorId(timeVencedorId);
        }
        
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
            
            console.log('🧹 Limpeza completa da roleta:', {
                roletaGirando,
                temClasseGirando: roleta?.classList.contains('girando'),
                temProtecao: roleta?.hasAttribute('data-roleta-protegida')
            });
            
            // Atualizar sessão para pegar o status atualizado (em_andamento)
            await atualizarSessao();
            renderizarInterface();
            
            // SEMPRE REINICIAR o intervalo de atualização após a roleta terminar
            // Limpar o intervalo anterior se existir
            if (intervaloAtualizacao) {
                clearInterval(intervaloAtualizacao);
                intervaloAtualizacao = null;
            }
            
            // Criar novo intervalo IMEDIATAMENTE
            console.log('🔄 Reiniciando intervalo de atualização após roleta');
                intervaloAtualizacao = setInterval(async () => {
                    console.log('⏰ Intervalo reiniciado rodando...');
                    // Verificar se o modal ainda está aberto (mais confiável que verificar atributos)
                    const modalRoleta = document.getElementById('modalRoleta');
                    const modalAberto = modalRoleta && modalRoleta.style.display !== 'none' && modalRoleta.style.display !== '';
                    
                    // Se o modal estiver aberto, não atualizar (roleta ainda em andamento)
                    if (modalAberto) {
                        console.log('⏸️ Intervalo reiniciado pausado - modal da roleta ainda aberto');
                        return;
                    }
                
                console.log('🔄 Intervalo reiniciado - atualizando sessão...');
                await atualizarSessao();
                
                // SEMPRE renderizar se a sessão estiver em andamento ou tiver ações
                const status = sessaoVetos?.sessao?.status;
                const acoesCount = sessaoVetos?.acoes?.length || 0;
                
                console.log('🔍 Verificando se deve renderizar:', { status, acoesCount });
                
                if (status === 'em_andamento' || acoesCount > 0) {
                    console.log('🎨 Renderizando interface (reiniciado após roleta):', { 
                        status, 
                        acoesCount,
                        turno_atual: sessaoVetos?.sessao?.turno_atual,
                        pode_jogar: sessaoVetos?.sessao?.pode_jogar
                    });
                    renderizarInterface();
                } else {
                    console.log('⏭️ Não renderizando - status:', status, 'acoes:', acoesCount);
                }
            }, 2000); // Atualiza a cada 2 segundos
            
            // Executar uma atualização IMEDIATA para não esperar os 2 segundos
            console.log('🚀 Executando atualização imediata após reiniciar intervalo');
            setTimeout(async () => {
                // Verificar se o modal ainda está aberto
                const modalRoleta = document.getElementById('modalRoleta');
                const modalAberto = modalRoleta && modalRoleta.style.display !== 'none';
                
                // Se o modal estiver fechado, pode atualizar
                if (!modalAberto) {
                    console.log('🔄 Atualização imediata - modal fechado, atualizando...');
                    await atualizarSessao();
                    const status = sessaoVetos?.sessao?.status;
                    const acoesCount = sessaoVetos?.acoes?.length || 0;
                    
                    if (status === 'em_andamento' || acoesCount > 0) {
                        console.log('🎨 Renderizando interface (atualização imediata)');
                        renderizarInterface();
                    }
                } else {
                    console.log('⏸️ Atualização imediata pausada - modal ainda aberto');
                }
            }, 500); // Executar após 500ms
        }, 5000);
    }, 30000); // 30 segundos de animação
}

// Clique no botão da roleta
async function clicarRoleta() {
    if (!token) return;
    
    // Bloquear espectadores
    if (sessaoVetos?.sessao?.is_spectator === true) {
        console.log('Espectadores não podem clicar na roleta');
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
        
        // Atualizar sessão e renderizar imediatamente
        await atualizarSessao();
        await renderizarInterface();
        
        // Forçar atualização rápida para garantir que o card mostre a escolha
        setTimeout(async () => {
            await atualizarSessao();
            await renderizarInterface();
        }, 500);
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

