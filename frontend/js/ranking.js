

let avatar = '';

// ========= RANKING JS =========
// Estado da aplicação (padrão: players; times será implementado depois)
let currentTab = 'players';
let teamsRanking = [];
let playersRanking = [];

// Paginação: 15 itens visíveis por página, setas e dots para navegar
const RANKING_ITEMS_PER_PAGE = 15;
let currentPagePlayers = 1;
let currentPageTimes = 1;

// =============================================================
// ====================== [ autenticação ] ======================

async function autenticacao() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
}

async function verificar_auth() {
    const auth_dados = await autenticacao();


    if (auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil(userId);


        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById("gerenciarCamp");
        // Atualiza a UI para o usuário logado

        document.getElementById('userAuth').classList.add('hidden');
        document.getElementById('userPerfil').classList.remove('hidden');

        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.perfilData.usuario.time_id}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        if (perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
            gerenciarCamp.style.display = 'none';
        }
    }
    else {
        document.getElementById('userAuth').classList.remove('hidden');
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        showNotification('success', 'Deslogado...', 1500);
        setTimeout(() => {
            document.getElementById("userPerfil").style.display = "none";
            document.getElementById("userAuth").style.display = "flex";
            verificar_auth();
        }, 1500);
    } catch (error) {
        console.error('Erro na requisição:', error);
        showNotification('error', 'Erro ao deslogar.', 1500);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// =================================
// ========= BUSCAR DADOS DO PERFIL =========
async function buscarDadosPerfil(userId) {
    try {
        const perfilResponse = await fetch(`${API_URL}/perfil/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!perfilResponse.ok) {
            throw new Error('Erro ao buscar dados do perfil.');
        }

        const perfilData = await perfilResponse.json();
        return { perfilData };
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return { perfilData: null };
    }
}






// =================================
// ========= TABS (PLAYERS / TIMES) =========
// =================================

function switchTab(tab) {
    currentTab = tab;

    // Atualizar botões (hero: .tab e .tab--active)
    const tabs = document.querySelectorAll('.hero__controls .tab');
    tabs.forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('tab--active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Mostrar lista de players ou lista de times
    const playersWrap = document.getElementById('rankingPlayersWrap');
    const timesWrap = document.getElementById('rankingTimesWrap');
    if (playersWrap) playersWrap.hidden = tab !== 'players';
    if (timesWrap) timesWrap.hidden = tab !== 'times';

    // A aba de players agora usa o novo array vindo do backend.
    // A antiga função createArrayRankingPLayers não é mais utilizada.
    if (tab === 'times') {
        if (teamsRanking.length === 0) {
            const panel = document.querySelector('.ranking__panel');
            if (panel) panel.setAttribute('data-state', 'loading');
            createArrayRankingTimes();
        }
    }

    var searchInputTab = document.querySelector('.hero form.search .search__input');
    if (searchInputTab) filtrarRankingPorBusca(searchInputTab.value);
}

// =================================
// ========= FUNCTION PARA PUXAR DADOS PARA O RANKING =========
// =================================
async function buscarDadosFaceit(link) {
    if (link == null || link == undefined || link == '') {
        return null;
    }


    try {
        const response = await fetch(`${API_URL}/faceit/player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ link })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

async function BuscarTimes(timeId) {
    try {
        const response = await fetch(`${API_URL}/times/${timeId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar times.');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar times:', error);
    }

}

async function BuscarMedalhas(userId) {
    try {
        const response = await fetch(`${API_URL}/medalhas/${userId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar medalhas.');
        }

        const data = await response.json();

        return data;
    }
    catch (error) {
        console.error('Erro ao buscar medalhas:', error);
    }
}


async function BuscarRankingPlayers() {

    try {
        const response = await fetch(`${API_URL}/ranking/players`);
        if (!response.ok) {
            throw new Error('Erro ao buscar ranking players.');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar ranking players:', error);
    }

}


async function BuscarReultadosDeUltimosMatchsPlayers(userId) {
    try {
        const response = await fetch(`${API_URL}/historico/matchs/players`);
        if (!response.ok) {
            throw new Error('Erro ao buscar ultimos matchs.');
        }
        const data = await response.json();

        let qntdMatchs = 0;
        let qntdVitorias = 0;
        let qntdDerrotas = 0;
        let matchsUser = [];
        let ultimasMatchs = [];
        let ultimas8Matchs = [];

        for (const maths of data.historico_matchs_players) {
            if (maths.usuario_id == userId) {
                // resultado agora é ENUM('win','lose','wo')
                if (maths.resultado === 'win') {
                    qntdVitorias++;
                } else if (maths.resultado === 'lose') {
                    qntdDerrotas++;
                }

                qntdMatchs++;
                matchsUser.push(maths);
            }
        }

        ultimasMatchs = matchsUser.slice(-8);

        for (const status of ultimasMatchs) {
            if (status.resultado === 'win') {
                ultimas8Matchs.push('win');
            } else if (status.resultado === 'lose') {
                ultimas8Matchs.push('loss');
            } else {
                ultimas8Matchs.push('wo');
            }
        }

        
        



        let dadosMatchs = {
            qntdMatchs: qntdMatchs,
            qntdVitorias: qntdVitorias,
            qntdDerrotas: qntdDerrotas,
            ultimas8Matchs: ultimas8Matchs,
        };

        // console.log(dadosMatchs);

        return dadosMatchs;
    }
    catch (error) {
        console.error('Erro ao buscar ultimos matchs:', error);
    }

}


async function faceitStatusCs(faceitId) {

    if (faceitId == null || faceitId == undefined || faceitId == '') {
        return data = null;
    }

    try {
        const response = await fetch(`${API_URL}/faceit/player/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ faceitid: faceitId })
        });
        const data = await response.json();
        
        return data;
    } catch (error) {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }
}


async function rankingTimes() {
    try {

        const response = await fetch(`${API_URL}/ranking/times`);
        if (!response.ok) {
            throw new Error('Erro ao buscar status do time.');
        }
        const data = await response.json();
        // console.log(data);
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar historico de matchs do time:', error);
    }
}

async function historicoMatchsTimes() {
    try {

        const response = await fetch(`${API_URL}/historico/matchs/times`);
        if (!response.ok) {
            throw new Error('Erro ao buscar status do time.');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar historico de matchs do time:', error);
    }
}



async function buscarArrayRankingPlayers() {
    try {
        const response = await fetch(`${API_URL}/ranking/players/ordenar-array`);
        if (!response.ok) {
            throw new Error('Erro ao buscar array ranking players.');
        }
        const data = await response.json();
        
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar array ranking players:', error);
    }
}


async function buscarArrayRankingTimes() {
    try {
        const response = await fetch(`${API_URL}/ranking/times/ordenar-array`);
        if (!response.ok) {
            throw new Error('Erro ao buscar array ranking times.');
        }
        const data = await response.json();
        
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar array ranking times:', error);
    }
}




// =================================
// ========= ARRAYS PARA PREENCHER O RANKING =========
// =================================

// Novo carregamento de ranking de PLAYERS, usando o array já montado do backend
async function carregarRankingPlayersNovo() {
    let dadosOrdenados;
    try {
        // backend retorna algo como: { dadosPlayers: [...] }
        dadosOrdenados = await buscarArrayRankingPlayers();
    } catch (err) {
        console.error('Erro ao buscar array ranking players:', err);
        renderRankingPlayers([]);
        return [];
    }

    const lista = dadosOrdenados && Array.isArray(dadosOrdenados.dadosPlayers)
        ? dadosOrdenados.dadosPlayers
        : [];

    if (lista.length === 0) {
        renderRankingPlayers([]);
        return [];
    }

    const arrayDadosPlayers = lista.map((item) => {
        const userId = item.id;

        // "coach,awp,rifle,..." -> ['coach','awp','rifle',...]
        const listPosicoes = typeof item.posicoes === 'string' && item.posicoes.trim()
            ? item.posicoes.split(',').map(p => p.trim()).filter(Boolean)
            : [];

        // estrutura de ranking usada pelo card principal
        const dadosrankPlayer = {
            ranking_atual: item.player_ranking_atual ?? 0,
            total_partidas: item.player_total_partidas ?? 0,
            vitorias: item.player_vitorias ?? 0,
            derrotas: item.player_derrotas ?? 0,
            wo: item.wo ?? 0,
            campeonatos_mx_extreme: item.campeonatos_mx_extreme ?? 0,
            campeonatos_mx_league: item.campeonatos_mx_league ?? 0,
            campeonatos_oficiais: item.campeonatos_oficiais ?? 0,
            campeonatos_comuns: item.campeonatos_comuns ?? 0,
            medalhas: item.medalhas ?? 0,
            pontos: item.pontos ?? 0,
        };

        // estrutura usada pelo card de histórico (últimas partidas)
        const dadosMatchs = {
            qntdMatchs: item.player_total_partidas ?? 0,
            qntdVitorias: item.player_vitorias ?? 0,
            qntdDerrotas: item.player_derrotas ?? 0,
            ultimas8Matchs: Array.isArray(item.ultimos_resultados) ? item.ultimos_resultados : [],
        };

        return {
            // IDs
            userId: userId,
            timeId: item.time_id ?? null,

            // Dados básicos de usuário
            nickname: item.username || '—',
            avatar_url: item.avatar_url || '',
            banner_url: item.banner_url || '',
            listPosicoes: listPosicoes,
            corPerfil: item.coresUsuario || '',

            // Faceit
            faceitId: item.faceitid || '',
            linkFaceit: item.faceit_url || '',
            faceitElo: item.faceitElo ?? 0,
            faceitNivel: item.faceitNivel ?? 0,
            avgKd: item.avgKd ?? 'N/A',

            // Time
            nomeTime: item.time_nome || '',
            tagTime: item.time_tag || '',
            avatarTime: item.avatar_time_url || '',
            bannerTime: item.banner_time_url || '',
            corDoTime: item.coresTime || '',
            totalMatchsTime: item.time_total_partidas ?? 0,
            timeRankingAtual: item.time_ranking_atual ?? 0,

            // Conquistas e pontuação (também estão dentro de dadosrankPlayer, mas expostos aqui)
            qntTrofeus: item.trofeus ?? 0,
            medalhas: item.medalhas ?? 0,
            campeonatosMxExtreme: item.campeonatos_mx_extreme ?? 0,
            campeonatosMxLeague: item.campeonatos_mx_league ?? 0,
            campeonatosOficiais: item.campeonatos_oficiais ?? 0,
            campeonatosComuns: item.campeonatos_comuns ?? 0,
            wo: item.wo ?? 0,
            pontos: item.pontos ?? 0,

            // Estruturas usadas pelos cards/modais já existentes
            dadosrankPlayer: dadosrankPlayer,
            dadosMatchs: dadosMatchs,
        };
    });

    // backend já vem ordenado, mas garantimos por pontos desc
    const playersOrdenados = arrayDadosPlayers.sort((a, b) => {
        const pa = a.dadosrankPlayer?.pontos || 0;
        const pb = b.dadosrankPlayer?.pontos || 0;
        return pb - pa;
    });

    playersRanking = playersOrdenados;
    renderRankingPlayers(playersOrdenados);
    return playersOrdenados;
}

document.addEventListener('DOMContentLoaded', function () {
    carregarRankingPlayersNovo();
});

async function createArrayRankingTimes() {
    const arrayDadosTimes = [];

    // Novo endpoint: array já ordenado/montado no backend
    let dadosOrdenados;
    try {
        dadosOrdenados = await buscarArrayRankingTimes(); // { listaFinal: [...] }
    } catch (err) {
        console.error('Erro ao buscar array ranking times:', err);
        renderRankingTimes([]);
        return [];
    }

    const lista = dadosOrdenados && Array.isArray(dadosOrdenados.listaFinal)
        ? dadosOrdenados.listaFinal
        : [];

    if (lista.length === 0) {
        renderRankingTimes([]);
        return [];
    }

    for (const time of lista) {
        const timeId = time.id;
        const nomeTime = time.nome || '—';
        const tagTime = time.tag || '';
        const avatarTime_url = time.avatar_time_url || '';
        const bannerTime_url = time.banner_time_url || '';
        const coresDoTime = time.coresTime || '';
        const MembrosDoTime = Array.isArray(time.membros) ? time.membros : [];

        // Dados de ranking já calculados no backend
        const DadosrankingTime = {
            ranking_atual: time.ranking_atual ?? 0,
            total_partidas: time.total_partidas ?? 0,
            vitorias: time.vitorias ?? 0,
            derrotas: time.derrotas ?? 0,
            wo: time.wo ?? 0,
            campeonatos_mx_extreme: time.campeonatos_mx_extreme ?? 0,
            campeonatos_mx_league: time.campeonatos_mx_league ?? 0,
            campeonatos_oficiais: time.campeonatos_oficiais ?? 0,
            campeonatos_comuns: time.campeonatos_comuns ?? 0,
            medalhas: time.trofeus ?? 0,
            pontos: time.pontos ?? 0,
        };

        // Últimos resultados já vêm em `ultimos_resultados`: ['wo','lose','win',...]
        const ultimasMatchsTime = Array.isArray(time.ultimos_resultados)
            ? time.ultimos_resultados.map(r => {
                if (r === 'win') return 'win';
                if (r === 'lose') return 'loss';
                return 'wo';
            })
            : [];

        arrayDadosTimes.push({
            timeId,
            nomeTime,
            tagTime,
            avatarTime_url,
            bannerTime_url,
            coresDoTime,
            gamesDoTime: {}, // legado, mantido para compatibilidade
            MembrosDoTime,
            DadosrankingTime,
            ultimasMatchsTime,
        });
    }

    // Garante ordenação por pontos; se o backend já ordena, isso só reforça
    const timesOrdenados = arrayDadosTimes.sort((a, b) => {
        return (b.DadosrankingTime && b.DadosrankingTime.pontos || 0) - (a.DadosrankingTime && a.DadosrankingTime.pontos || 0);
    });

    teamsRanking = timesOrdenados;
    renderRankingTimes(timesOrdenados);
    return timesOrdenados;
}

// Carrega o ranking quando o DOM estiver pronto (aba PLAYERS já é a padrão)
// A função antiga createArrayRankingPLayers foi descontinuada; o novo fluxo
// de carregamento dos players será feito pela nova função do backend.
// =============================================================================================
// ---------------------  PREENCHIMENTO DAS DIVS DO RANKING ---------------------

/** Cache de URLs das imagens de posição (preenchido pela API ou fallback) */
let positionImagesCache = null;

/** URLs das imagens do nível Faceit (1–10), iguais ao backend */
const FACEIT_LEVEL_IMAGES = {
    1: 'https://cdn3.emoji.gg/emojis/50077-faceit-1lvl.png',
    2: 'https://cdn3.emoji.gg/emojis/50077-faceit-2lvl.png',
    3: 'https://cdn3.emoji.gg/emojis/35622-faceit-3lvl.png',
    4: 'https://cdn3.emoji.gg/emojis/63614-faceit-4lvl.png',
    5: 'https://cdn3.emoji.gg/emojis/95787-faceit-5lvl.png',
    6: 'https://cdn3.emoji.gg/emojis/68460-faceit-6lvl.png',
    7: 'https://cdn3.emoji.gg/emojis/67489-faceit-7lvl.png',
    8: 'https://cdn3.emoji.gg/emojis/58585-faceit-8lvl.png',
    9: 'https://cdn3.emoji.gg/emojis/60848-faceit-9level.png',
    10: 'https://cdn3.emoji.gg/emojis/84242-faceit-10lvl.png'
};

/** Fallback de ícones de posição quando a API não está disponível */
const POSITION_ICON_FALLBACK = {
    coach: 'https://img.icons8.com/doodle-line/60/headset.png',
    awp: 'https://img.icons8.com/offices/30/centre-of-gravity.png',
    rifle: 'https://img.icons8.com/external-ddara-lineal-ddara/64/external-gun-memorial-day-ddara-lineal-ddara.png',
    entry: 'https://img.icons8.com/external-others-pike-picture/50/external-Centerfire-Rifle-Ammo-shooting-others-pike-picture.png',
    lurker: 'https://img.icons8.com/ios-filled/50/ninja-head.png',
    igl: 'https://cdn-icons-png.flaticon.com/128/6466/6466962.png',
    support: 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-smoke-grenade-battle-royale-flaticons-flat-flat-icons.png'
};

/**
 * Busca/cache das imagens de posição e retorna a URL para uma posição.
 * Alinhado com a lógica usada na página de perfil (buscarImgPosition):
 * 1) Tenta carregar da API /positionimg e usar a chave normalizada (lowercase).
 * 2) Se não encontrar, tenta a chave original.
 * 3) Só então cai no fallback estático POSITION_ICON_FALLBACK.
 * @param {string} posicao - Nome da posição (ex: 'awp', 'rifle')
 * @returns {string|null} URL da imagem ou null
 */
async function getPositionImageUrl(posicao) {
    if (!posicao || typeof posicao !== 'string') return null;
    const key = posicao.trim().toLowerCase();

    // 1) Carregar cache da API uma única vez (como no perfil)
    if (!positionImagesCache) {
        try {
            const res = await fetch(`${API_URL}/positionimg`);
            const data = await res.json();
            if (data && data.length > 0) {
                positionImagesCache = data[0];
            } else {
                positionImagesCache = {};
            }
        } catch (_) {
            positionImagesCache = {};
        }
    }

    // 2) Tentar pegar da resposta da API com chave normalizada ou original
    if (positionImagesCache && typeof positionImagesCache === 'object') {
        const fromLower = positionImagesCache[key];
        const fromRaw = positionImagesCache[posicao];
        if (fromLower) return fromLower;
        if (fromRaw) return fromRaw;
    }

    // 3) Fallback estático (mesmo visual usado em outras páginas)
    if (POSITION_ICON_FALLBACK[key]) return POSITION_ICON_FALLBACK[key];
    return null;
}

/**
 * Retorna a classe visual do item conforme a posição (1=gold, 2=silver, 3=bronze, 4+=normal).
 */
function getRankItemVariantClass(position) {
    if (position === 1) return 'rankItem--gold';
    if (position === 2) return 'rankItem--silver';
    if (position === 3) return 'rankItem--bronze';
    return 'rankItem--normal';
}

/**
 * Normaliza ultimas8Matchs para array de strings 'win'|'loss'.
 * @param {Array} ultimas8 - Pode ser array de strings ou de objetos { vitorias }
 */
function normalizeUltimas8Matchs(ultimas8) {
    if (!Array.isArray(ultimas8)) return [];
    return ultimas8.map(function (item) {
        if (typeof item === 'string') return item.toLowerCase() === 'loss' ? 'loss' : 'win';
        return (item && item.vitorias === 1) ? 'win' : 'loss';
    }).slice(0, 8);
}

/**
 * Monta o card PERFIL do modal (Top 1–3): K/D, Faceit nível/elo, ícones de posições.
 */
function buildModalCardPerfil(player) {
    const avgKd = player.avgKd != null && player.avgKd !== '' ? String(player.avgKd) : '0.00';
    const faceitNivel = player.faceitNivel != null ? player.faceitNivel : 0;
    const faceitElo = player.faceitElo != null ? player.faceitElo : 0;
    const posicoes = Array.isArray(player.listPosicoes) ? player.listPosicoes : [];
    const faceitLevelSrc = FACEIT_LEVEL_IMAGES[faceitNivel] || FACEIT_LEVEL_IMAGES[1];

    const footerHtml = posicoes.length
        ? `<div class="statsPerfil3__positions" aria-label="Posições"></div>`
        : '';

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--perfil';
    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">PERFIL</h2>
        </header>
        <div class="statsPerfil3__body">
            <div class="statsPerfil3__donut">
                <div class="statsPerfil3__donutInner">
                    <span class="statsPerfil3__value">${avgKd}</span>
                    <span class="statsPerfil3__label">K/D</span>
                </div>
            </div>
            <div class="statsPerfil3__footer">
                <div class="faceit-level-container">
                    <img src="${faceitLevelSrc}" alt="Faceit Level" class="faceit-level-icon">
                    <span class="faceit-level-text">Level ${faceitNivel} · ${faceitElo} ELO</span>
                </div>
                ${footerHtml}
            </div>
        </div>
    `.trim();

    const positionsEl = section.querySelector('.statsPerfil3__positions');
    if (positionsEl && posicoes.length > 0) {
        posicoes.forEach(function (pos) {
            const img = document.createElement('img');
            img.className = 'statsPerfil3__positionIcon';
            img.alt = pos;
            img.title = pos;
            getPositionImageUrl(pos).then(function (url) {
                if (url) img.src = url;
            });
            positionsEl.appendChild(img);
        });
    }

    return section;
}

/**
 * Monta o card TEAM do modal: logo, nome+tag, ranking, troféus, total matchs.
 */
function buildModalCardTeam(player, position) {
    const r = player.dadosrankPlayer || {};
    const logoUrl = player.avatarTime || '';
    const nomeTime = player.nomeTime || '—';
    const tagTime = player.tagTime || '—';
    const rankingAtual = r.ranking_atual != null ? r.ranking_atual : position;
    const rankingtimeatual = player.timeRankingAtual;
    const trofeus = player.qntTrofeus != null ? player.qntTrofeus : 0;
    const totalMatchs = player.totalMatchsTime != null ? player.totalMatchsTime : 0;

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--team';
    const logoStyle = logoUrl ? `background-image:url(${logoUrl}); background-size:cover;` : '';
    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">TEAM</h2>
        </header>
        <div class="statsTeam3__body">
            <div class="statsTeam3__logoBox" style="${logoStyle}"></div>
            <div class="statsTeam3__line">
                <img class="statsTeam3__iconImg" src="${logoUrl || ''}" alt="" onerror="this.style.display='none'">
                <span class="statsTeam3__text statsTeam3__text--primary">${nomeTime} - ${tagTime}</span>
            </div>
            <div class="statsTeam3__line">
                <img class="statsTeam3__iconImg" src="" alt="">
                <span class="statsTeam3__text statsTeam3__text--ranking">RANKING #${rankingtimeatual}</span>
            </div>
            <div class="statsTeam3__block">
                <div class="statsTeam3__lineLabel">
                    <img class="statsTeam3__iconImg statsTeam3__iconImg--square" src="" alt="">
                    <span class="statsTeam3__label">TROFEUS</span>
                </div>
                <p class="statsTeam3__value">${trofeus} Troféus</p>
            </div>
            <div class="statsTeam3__block">
                <div class="statsTeam3__lineLabel">
                    <img class="statsTeam3__iconImg" src="" alt="">
                    <span class="statsTeam3__label">TOTAL DE MATCHS</span>
                </div>
                <p class="statsTeam3__value">${totalMatchs} Matchs</p>
            </div>
        </div>
    `.trim();

    return section;
}

/**
 * Monta o card HISTÓRICO: gráfico por vitórias/derrotas, total de partidas, 8 dots win/loss.
 */
function buildModalCardHistory(player) {
    const dm = player.dadosMatchs || {};
    const vitorias = dm.qntdVitorias != null ? dm.qntdVitorias : 0;
    const derrotas = dm.qntdDerrotas != null ? dm.qntdDerrotas : 0;
    const total = dm.qntdMatchs != null ? dm.qntdMatchs : vitorias + derrotas;
    const ultimas8 = normalizeUltimas8Matchs(dm.ultimas8Matchs || []);

    const totalPartidas = total || 0;
    let winPercent = 50;
    if (vitorias + derrotas > 0) winPercent = (vitorias / (vitorias + derrotas)) * 100;

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--history';
    const circleStyle = `background: conic-gradient(#22c55e 0 ${winPercent}%, #ef4444 ${winPercent}% 100%);`;
    const dotsHtml = ultimas8.map(function (r) {
        const isWin = r === 'win';
        return `<span class="statsHistory3__matchDot statsHistory3__matchDot--${isWin ? 'win' : 'loss'}" title="${isWin ? 'Vitória' : 'Derrota'}"></span>`;
    }).join('');

    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">HISTORICO DE PARTIDAS</h2>
        </header>
        <div class="statsHistory3__body">
            <div class="statsHistory3__legends">
                <span class="statsHistory3__legend statsHistory3__legend--win">WIN</span>
                <span class="statsHistory3__legend statsHistory3__legend--loss">LOSS</span>
            </div>
            <div class="statsHistory3__circle" style="${circleStyle}"></div>
            <p class="statsHistory3__subtitle">${totalPartidas} PARTIDAS</p>
            <div class="statsHistory3__matchesCapsule">${dotsHtml}</div>
        </div>
    `.trim();

    return section;
}

/**
 * Monta o modal completo (3 cards) para Top 1–3.
 */
function buildModalFull(player, position) {
    const modal = document.createElement('div');
    modal.className = 'rankItem__modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Resumo detalhado do Top ' + position);

    const statsModal = document.createElement('div');
    statsModal.className = 'statsModal3';
    const cards = document.createElement('div');
    cards.className = 'statsModal3__cards';

    cards.appendChild(buildModalCardPerfil(player));
    cards.appendChild(buildModalCardTeam(player, position));
    cards.appendChild(buildModalCardHistory(player));
    statsModal.appendChild(cards);
    modal.appendChild(statsModal);

    return modal;
}

/**
 * Monta o modal simples (trophies box + histórico com dots) para posições 4–8.
 */
function buildModalSimple(player, position) {
    const dm = player.dadosMatchs || {};
    const ultimas8 = normalizeUltimas8Matchs(dm.ultimas8Matchs || []);
    const avatarUrl = player.avatar_url || '';
    const avatarTime = player.avatarTime || '';
    const nickname = player.nickname || '—';
    const tagTime = player.tagTime || '—';
    const qntTrofeus = player.qntTrofeus != null ? player.qntTrofeus : 0;
    

    const dotsHtml = ultimas8.map(function (r) {
        const isWin = r === 'win';
        return `<span class="rankItem__modalDot rankItem__modalDot--${isWin ? 'win' : 'loss'}" title="${isWin ? 'Vitória' : 'Derrota'}"></span>`;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'rankItem__modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Detalhes posição ' + position);
    modal.innerHTML = `
        <div class="rankItem__modalTrophiesBox">
            <div class="rankItem__modalImg" aria-hidden="true"><img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"></div>
            <p class="rankItem__modalName">${nickname}</p>
            <p class="rankItem__modalTag">
                <img src="${avatarTime || '../img/cs2.png'}" alt="Logo do time" class="rankItem__modalTagLogo">
            </p>
            <div class="rankItem__modalTrophies" aria-label="Troféus">
                <span class="rankItem__trophyIcon rankItem__trophyIcon--modal" aria-hidden="true"></span>
                <span class="rankItem__trophyCount">${qntTrofeus}</span>
            </div>
        </div>
        <div class="rankItem__modalHistory">
            <span class="rankItem__modalHistoryLabel">
                Histórico
                <span class="rankItem__historyLegend">
                    <span class="rankItem__historyLegend--win">W</span>
                    <span class="rankItem__historyLegend--loss">L</span>
                </span>
            </span>
            <div class="rankItem__modalDots">${dotsHtml}</div>
        </div>
    `.trim();

    return modal;
}

/**
 * Cria um único <li class="rankItem"> com linha de stats e modal, preenchido com dados do player.
 * @param {Object} player - Objeto do array de ranking (avatar_url, nickname, dadosrankPlayer, etc.)
 * @param {number} position - Posição no ranking (1-based)
 * @returns {HTMLLIElement}
 */
function buildRankItem(player, position) {
    const r = player.dadosrankPlayer || {};
    const variant = getRankItemVariantClass(position);
    const isSoftPos = position >= 4;

    const totalPartidas = r.total_partidas != null ? r.total_partidas : 0;
    const vitorias = r.vitorias != null ? r.vitorias : 0;
    const derrotas = r.derrotas != null ? r.derrotas : 0;
    const extrame = r.campeonatos_mx_extreme != null ? r.campeonatos_mx_extreme : 0;
    const medalhas = r.medalhas != null ? r.medalhas : 0;
    const pontos = r.pontos != null ? r.pontos : 0;

    const avatarUrl = player.avatar_url || '';
    const nickname = player.nickname || '—';
    const qntTrofeus = player.qntTrofeus != null ? player.qntTrofeus : 0;

    const li = document.createElement('li');
    li.className = 'rankItem ' + variant;
    // Clicar em qualquer área do item leva para o perfil do usuário
    if (player.userId != null) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () {
            irParaPlayer(player.userId);
        });
    }
    if (position >= 4) li.classList.add('rankItem--normal');

    li.innerHTML = `
        <div class="rankItem__pos ${isSoftPos ? 'rankItem__pos--soft' : ''}">#${position}</div>
        <div class="rankItem__identity">
            <div class="rankItem__avatar" aria-hidden="true"><img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" onerror="this.style.display='none'"></div>
            <div class="rankItem__names">
                <div class="rankItem__name">${nickname}</div>
                <div class="rankItem__tag"></div>
                <div class="rankItem__trophies" aria-label="Troféus">
                    <span class="rankItem__trophyIcon" aria-hidden="true"></span>
                    <span class="rankItem__trophyCount">${qntTrofeus}</span>
                </div>
            </div>
        </div>
        <dl class="rankItem__stats">
            <div class="stat"><dt>${totalPartidas}</dt><dd>matches</dd></div>
            <div class="stat"><dt>${vitorias}</dt><dd>WIN</dd></div>
            <div class="stat"><dt>${derrotas}</dt><dd>LOSS</dd></div>
            <div class="stat"><dt>${extrame}</dt><dd>EXTRAME</dd></div>
            <div class="stat"><dt>${medalhas}</dt><dd>Medal</dd></div>
            <div class="stat"><dt>${pontos}</dt><dd>PTS</dd></div>
        </dl>
    `.trim();

    const modal = buildModalFull(player, position);
    li.appendChild(modal);

    return li;
}

/**
 * Renderiza a lista de ranking de players no DOM.
 * Limpa o conteúdo atual de #rankListPlayers e preenche com os itens do array.
 * @param {Array} list - Array já ordenado por pontos (index 0 = 1º colocado)
 */
function renderRankingPlayers(list) {
    const container = document.getElementById('rankListPlayers');
    if (!container) return;

    const panel = container.closest('.ranking__panel');
    if (panel) {
        panel.setAttribute('data-state', 'ready');
    }

    container.innerHTML = '';
    if (!list || list.length === 0) return;

    const fragment = document.createDocumentFragment();
    list.forEach(function (player, index) {
        const position = index + 1;
        const li = buildRankItem(player, position);
        var pageNum = Math.ceil(position / RANKING_ITEMS_PER_PAGE);
        li.setAttribute('data-page', String(pageNum));
        if (position === list.length) li.classList.add('rankItem--last');
        fragment.appendChild(li);
    });

    container.appendChild(fragment);

    // Modal flutuante do #8 não é usado quando a lista é gerada por JS (cada item tem seu próprio modal)
    const floatingModal = document.getElementById('modalLastRank');
    if (floatingModal) floatingModal.style.display = 'none';

    currentPagePlayers = 1;
    applyPagination('players');

    var searchInputPlayers = document.getElementById('rankingSearchInput');
    if (searchInputPlayers && searchInputPlayers.value.trim()) filtrarRankingPorBusca(searchInputPlayers.value);
}

// =============================================================================================
// ---------------------  RANKING DE TIMES (lista + modal com MEMBROS, TEAM, HISTÓRICO) -------
// =============================================================================================

/**
 * Monta o card MEMBROS do modal de time: lista de membros (avatar, username, função, posição).
 */
function buildModalCardMembros(time) {
    const membros = Array.isArray(time.MembrosDoTime) ? time.MembrosDoTime : [];

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--membros';
    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">MEMBROS</h2>
        </header>
        <div class="statsMembros3__body">
            <ul class="statsMembros3__list" aria-label="Membros do time"></ul>
        </div>
    `.trim();

    const listEl = section.querySelector('.statsMembros3__list');
    membros.forEach(function (m) {
        const li = document.createElement('li');
        li.className = 'statsMembros3__item';
        const posicao = m.posicao || '—';
        const funcao = m.funcao || '—';
        const avatarUrl = m.avatar_url || '../img/cs2.png';
        li.innerHTML = `
            <div class="statsMembros3__avatar"><img src="${avatarUrl}" alt="${(m.username || '').toString().replace(/"/g, '&quot;')}" onerror="this.src='../img/cs2.png'"></div>
            <div class="statsMembros3__info">
                <span class="statsMembros3__name">${m.username || '—'}</span>
                <span class="statsMembros3__meta">${funcao} · ${posicao}</span>
            </div>
            <div class="statsMembros3__posIcon"></div>
        `.trim();
        const posIconWrap = li.querySelector('.statsMembros3__posIcon');
        if (posIconWrap && posicao !== '—') {
            getPositionImageUrl(posicao).then(function (url) {
                if (url) {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = posicao;
                    img.className = 'statsMembros3__positionIcon';
                    posIconWrap.appendChild(img);
                }
            });
        }
        listEl.appendChild(li);
    });

    return section;
}

/**
 * Monta o card TEAM do modal de time: logo, nome+tag, ranking, troféus, total matchs.
 */
function buildModalCardTeamTime(time, position) {
    const r = time.DadosrankingTime || {};
    const logoUrl = time.avatarTime_url || '';
    const nomeTime = time.nomeTime || '—';
    const tagTime = time.tagTime || '—';
    const rankingAtual = r.ranking_atual != null ? r.ranking_atual : position;
    const trofeus = r.trofeus != null ? r.trofeus : 0;
    const totalMatchs = r.total_partidas != null ? r.total_partidas : 0;

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--team';
    const logoStyle = logoUrl ? `background-image:url(${logoUrl}); background-size:cover;` : '';
    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">TEAM</h2>
        </header>
        <div class="statsTeam3__body">
            <div class="statsTeam3__logoBox" style="${logoStyle}"></div>
            <div class="statsTeam3__line">
                <img class="statsTeam3__iconImg" src="${logoUrl}" alt="" onerror="this.style.display='none'">
                <span class="statsTeam3__text statsTeam3__text--primary">${nomeTime} - ${tagTime}</span>
            </div>
            <div class="statsTeam3__line">
                <span class="statsTeam3__text statsTeam3__text--ranking">RANKING #${rankingAtual}</span>
            </div>
            <div class="statsTeam3__block">
                <div class="statsTeam3__lineLabel">
                    <span class="statsTeam3__label">TROFEUS</span>
                </div>
                <p class="statsTeam3__value">${trofeus} Troféus</p>
            </div>
            <div class="statsTeam3__block">
                <div class="statsTeam3__lineLabel">
                    <span class="statsTeam3__label">TOTAL DE MATCHS</span>
                </div>
                <p class="statsTeam3__value">${totalMatchs} Matchs</p>
            </div>
        </div>
    `.trim();

    return section;
}

/**
 * Monta o card HISTÓRICO do modal de time: gráfico vitórias/derrotas, total, dots ultimasMatchsTime.
 */
function buildModalCardHistoryTime(time) {
    const r = time.DadosrankingTime || {};
    const vitorias = r.vitorias != null ? r.vitorias : 0;
    const derrotas = r.derrotas != null ? r.derrotas : 0;
    const totalPartidas = r.total_partidas != null ? r.total_partidas : vitorias + derrotas;
    const ultimas = Array.isArray(time.ultimasMatchsTime) ? time.ultimasMatchsTime.slice(0, 8) : [];

    let winPercent = 50;
    if (vitorias + derrotas > 0) winPercent = (vitorias / (vitorias + derrotas)) * 100;

    const circleStyle = `background: conic-gradient(#22c55e 0 ${winPercent}%, #ef4444 ${winPercent}% 100%);`;
    const dotsHtml = ultimas.map(function (result) {
        const isWin = result === 'win';
        return `<span class="statsHistory3__matchDot statsHistory3__matchDot--${isWin ? 'win' : 'loss'}" title="${isWin ? 'Vitória' : 'Derrota'}"></span>`;
    }).join('');

    const section = document.createElement('section');
    section.className = 'statsCard3 statsCard3--history';
    section.innerHTML = `
        <header class="statsCard3__header">
            <div class="statsCard3__decorDots"><span></span><span></span></div>
            <h2 class="statsCard3__title">HISTORICO DE PARTIDAS</h2>
        </header>
        <div class="statsHistory3__body">
            <div class="statsHistory3__legends">
                <span class="statsHistory3__legend statsHistory3__legend--win">WIN</span>
                <span class="statsHistory3__legend statsHistory3__legend--loss">LOSS</span>
            </div>
            <div class="statsHistory3__circle" style="${circleStyle}"></div>
            <p class="statsHistory3__subtitle">${totalPartidas} PARTIDAS</p>
            <div class="statsHistory3__matchesCapsule">${dotsHtml}</div>
        </div>
    `.trim();

    return section;
}

/**
 * Modal completo para item de time (3 cards: MEMBROS, TEAM, HISTÓRICO).
 */
function buildModalFullTime(time, position) {
    const modal = document.createElement('div');
    modal.className = 'rankItem__modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Resumo detalhado do time posição ' + position);

    const statsModal = document.createElement('div');
    statsModal.className = 'statsModal3';
    const cards = document.createElement('div');
    cards.className = 'statsModal3__cards';

    cards.appendChild(buildModalCardMembros(time));
    cards.appendChild(buildModalCardTeamTime(time, position));
    cards.appendChild(buildModalCardHistoryTime(time));
    statsModal.appendChild(cards);
    modal.appendChild(statsModal);

    return modal;
}

/**
 * Cria um <li> de ranking para um time (linha + modal).
 */
function buildRankItemTime(time, position) {
    const r = time.DadosrankingTime || {};
    const variant = getRankItemVariantClass(position);
    const isSoftPos = position >= 4;

    const totalPartidas = r.total_partidas != null ? r.total_partidas : 0;
    const vitorias = r.vitorias != null ? r.vitorias : 0;
    const derrotas = r.derrotas != null ? r.derrotas : 0;
    const extrame = r.campeonatos_mx_extreme != null ? r.campeonatos_mx_extreme : 0;
    const trofeus = r.trofeus != null ? r.trofeus : 0;
    const pontos = r.pontos != null ? r.pontos : 0;

    const avatarUrl = time.avatarTime_url || '';
    const nomeTime = time.nomeTime || '—';
    const tagTime = time.tagTime || '';

    const li = document.createElement('li');
    li.className = 'rankItem ' + variant;
    // Clicar em qualquer área do item leva para a página do time
    if (time.timeId != null) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () {
            irParaTime(time.timeId);
        });
    }
    if (position >= 4) li.classList.add('rankItem--normal');

    li.innerHTML = `
        <div class="rankItem__pos ${isSoftPos ? 'rankItem__pos--soft' : ''}">#${position}</div>
        <div class="rankItem__identity">
            <div class="rankItem__avatar" aria-hidden="true"><img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" onerror="this.style.display='none'"></div>
            <div class="rankItem__names">
                <div class="rankItem__name">${nomeTime}${tagTime ? ' - ' + tagTime : ''}</div>
                <div class="rankItem__tag"></div>
                <div class="rankItem__trophies" aria-label="Troféus">
                    <span class="rankItem__trophyIcon" aria-hidden="true"></span>
                    <span class="rankItem__trophyCount">${trofeus}</span>
                </div>
            </div>
        </div>
        <dl class="rankItem__stats">
            <div class="stat"><dt>${totalPartidas}</dt><dd>matches</dd></div>
            <div class="stat"><dt>${vitorias}</dt><dd>WIN</dd></div>
            <div class="stat"><dt>${derrotas}</dt><dd>LOSS</dd></div>
            <div class="stat"><dt>${extrame}</dt><dd>EXTRAME</dd></div>
            <div class="stat"><dt>${trofeus}</dt><dd>Medal</dd></div>
            <div class="stat"><dt>${pontos}</dt><dd>PTS</dd></div>
        </dl>
    `.trim();

    const modal = buildModalFullTime(time, position);
    li.appendChild(modal);

    return li;
}

/**
 * Renderiza a lista de ranking de times no DOM.
 */
function renderRankingTimes(list) {
    const container = document.getElementById('rankListTimes');
    if (!container) return;

    const panel = container.closest('.ranking__panel');
    if (panel) {
        panel.setAttribute('data-state', 'ready');
    }

    container.innerHTML = '';
    if (!list || list.length === 0) return;

    const fragment = document.createDocumentFragment();
    list.forEach(function (time, index) {
        const position = index + 1;
        const li = buildRankItemTime(time, position);
        var pageNum = Math.ceil(position / RANKING_ITEMS_PER_PAGE);
        li.setAttribute('data-page', String(pageNum));
        if (position === list.length) li.classList.add('rankItem--last');
        fragment.appendChild(li);
    });

    container.appendChild(fragment);

    currentPageTimes = 1;
    applyPagination('times');

    var searchInputAfter = document.getElementById('rankingSearchInput');
    if (searchInputAfter && searchInputAfter.value.trim()) filtrarRankingPorBusca(searchInputAfter.value);
}

// =================================
// ========= PAGINAÇÃO (15 visíveis, dots + setas) =========
// =================================

/**
 * Atualiza quais itens estão visíveis na página atual e atualiza a UI de dots/setas.
 * @param {'players'|'times'} tab
 */
function applyPagination(tab) {
    var listId = tab === 'players' ? 'rankListPlayers' : 'rankListTimes';
    var wrapId = tab === 'players' ? 'rankingPlayersWrap' : 'rankingTimesWrap';
    var list = document.getElementById(listId);
    var wrap = document.getElementById(wrapId);
    if (!list || !wrap) return;

    var items = list.querySelectorAll('li.rankItem');
    var visibleItems = [];
    items.forEach(function (li) {
        if (!li.classList.contains('rankItem--filtered-hidden') && !li.hasAttribute('hidden')) {
            visibleItems.push(li);
        }
    });

    var totalVisible = visibleItems.length;
    var totalPages = Math.max(1, Math.ceil(totalVisible / RANKING_ITEMS_PER_PAGE));
    var currentPage = tab === 'players' ? currentPagePlayers : currentPageTimes;
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    if (tab === 'players') currentPagePlayers = currentPage; else currentPageTimes = currentPage;

    items.forEach(function (li) {
        if (li.classList.contains('rankItem--filtered-hidden') || li.hasAttribute('hidden')) return;
        var page = parseInt(li.getAttribute('data-page'), 10) || 1;
        if (page === currentPage) {
            li.classList.remove('rankItem--pagination-hidden');
        } else {
            li.classList.add('rankItem--pagination-hidden');
        }
    });

    updatePaginationUI(wrap, tab, currentPage, totalPages);
}

/**
 * Faz scroll suave para o início da seção de ranking.
 */
function scrollToRankingTop() {
    var section = document.querySelector('section.ranking');
    if (!section) return;
    var rect = section.getBoundingClientRect();
    var offsetTop = rect.top + window.pageYOffset - 80; // leve margem para o header
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
}

/**
 * Cria ou atualiza o bloco de setas + dots abaixo da lista.
 */
function updatePaginationUI(wrap, tab, currentPage, totalPages) {
    var container = wrap.querySelector('.ranking__pagination');
    if (!container) {
        container = document.createElement('div');
        container.className = 'ranking__pagination';
        wrap.appendChild(container);
    }

    if (totalPages <= 1) {
        container.innerHTML = '';
        container.classList.add('ranking__pagination--hidden');
        return;
    }
    container.classList.remove('ranking__pagination--hidden');

    var prevPage = Math.max(1, currentPage - 1);
    var nextPage = Math.min(totalPages, currentPage + 1);

    var html = '';
    html += '<button type="button" class="ranking__pagination-arrow ranking__pagination-arrow--prev" aria-label="Página anterior" ' + (currentPage <= 1 ? 'disabled' : '') + '>';
    html += '<span aria-hidden="true">‹</span></button>';
    html += '<div class="ranking__pagination-dots" role="tablist" aria-label="Páginas">';
    for (var p = 1; p <= totalPages; p++) {
        var active = p === currentPage;
        html += '<button type="button" class="ranking__pagination-dot' + (active ? ' ranking__pagination-dot--active' : '') + '" data-page="' + p + '" aria-label="Página ' + p + '" aria-selected="' + active + '">';
        html += '<span class="ranking__pagination-dot-inner"></span></button>';
    }
    html += '</div>';
    html += '<button type="button" class="ranking__pagination-arrow ranking__pagination-arrow--next" aria-label="Próxima página" ' + (currentPage >= totalPages ? 'disabled' : '') + '>';
    html += '<span aria-hidden="true">›</span></button>';

    container.innerHTML = html;

    var prevBtn = container.querySelector('.ranking__pagination-arrow--prev');
    var nextBtn = container.querySelector('.ranking__pagination-arrow--next');
    if (prevBtn && currentPage > 1) {
        prevBtn.addEventListener('click', function () {
            if (tab === 'players') currentPagePlayers = prevPage; else currentPageTimes = prevPage;
            applyPagination(tab);
            scrollToRankingTop();
        });
    }
    if (nextBtn && currentPage < totalPages) {
        nextBtn.addEventListener('click', function () {
            if (tab === 'players') currentPagePlayers = nextPage; else currentPageTimes = nextPage;
            applyPagination(tab);
            scrollToRankingTop();
        });
    }
    container.querySelectorAll('.ranking__pagination-dot').forEach(function (btn) {
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (p === currentPage) return;
        btn.addEventListener('click', function () {
            if (tab === 'players') currentPagePlayers = p; else currentPageTimes = p;
            applyPagination(tab);
            scrollToRankingTop();
        });
    });
}

// =================================
// ========= BUSCA NO RANKING (campo abaixo de TIMES/PLAYERS) =========
// Filtra a lista visível por nome de player ou nome/tag do time. Enter não recarrega a página.
// =================================

function filtrarRankingPorBusca(term) {
    var listId = currentTab === 'players' ? 'rankListPlayers' : 'rankListTimes';
    var list = document.getElementById(listId);
    if (!list) return;

    var termNorm = (term || '').trim().toLowerCase();
    var items = list.querySelectorAll('li.rankItem');

    items.forEach(function (li) {
        var nameEl = li.querySelector('.rankItem__name');
        var name = (nameEl && nameEl.textContent) ? nameEl.textContent.trim().toLowerCase() : '';
        var match = termNorm === '' || name.indexOf(termNorm) !== -1;
        if (match) {
            li.removeAttribute('hidden');
            li.classList.remove('rankItem--filtered-hidden');
        } else {
            li.setAttribute('hidden', '');
            li.classList.add('rankItem--filtered-hidden');
        }
    });

    currentPagePlayers = 1;
    currentPageTimes = 1;
    applyPagination(currentTab);
}

/** Retorna o termo digitado no campo de busca que deve filtrar o ranking (hero ou header). */
function getTermoBuscaRanking() {
    var hero = document.getElementById('rankingSearchInput');
    if (hero && hero.value) return hero.value.trim();
    var header = document.querySelector('.search-bar-container .search-input');
    if (header && header.value) return header.value.trim();
    return '';
}

/** Aplica o filtro ao pressionar Enter (usa o termo do input que tiver foco ou do hero/header). */
function aplicarFiltroRankingNoEnter(termoDoInput) {
    var term = (termoDoInput !== undefined && termoDoInput !== null) ? String(termoDoInput).trim() : getTermoBuscaRanking();
    filtrarRankingPorBusca(term);
    esconderResultados();
}

// ========= FUNÇÕES UTILITÁRIAS ========= //

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}





window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


// Função para adicionar efeito de scroll progressivo
function addScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #ff6b35, #ff8c42);
        z-index: 10001;
        transition: width 0.1s ease;
    `;

    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// =================================
// ========= SISTEMA DE BUSCA =========
// =================================
// Função principal de busca
async function buscarTimesEPlayers(termo) {
    if (termo.length < 2) {
        esconderResultados();
        return;
    }

    try {
        // Buscar times e players em paralelo
        const [timesResponse, playersResponse] = await Promise.all([
            fetch(`${API_URL}/times/search?search=${encodeURIComponent(termo)}`),
            fetch(`${API_URL}/usuarios/search?search=${encodeURIComponent(termo)}`)
        ]);

        const timesData = await timesResponse.json();
        const playersData = await playersResponse.json();

        // Mostrar resultados
        mostrarResultados({
            times: timesData.times || [],
            players: playersData.usuarios || [],
            termo: termo
        });

    } catch (error) {
        console.error('Erro na busca:', error);
        showNotification('error', 'Erro ao buscar. Tente novamente.');
    }
}

// Mostrar resultados na tela
function mostrarResultados(dados) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    const { times, players, termo } = dados;
    const totalResultados = times.length + players.length;

    if (totalResultados === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>Nenhum resultado encontrado para "${termo}"</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="search-results-header">
            <h3>Resultados para "${termo}" (${totalResultados})</h3>
        </div>
        <div class="search-results-content">
    `;

    // Times
    if (times.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-users"></i> Times (${times.length})</h4>
                <div class="search-items">
        `;

        times.forEach(time => {
            html += `
                <div class="search-item" onclick="irParaTime(${time.id})">
                    <img src="${time.avatar_time_url || '../img/cs2.png'}" alt="${time.nome}" class="search-avatar">
                    <div class="search-info">
                        <h5>${time.nome}</h5>
                        <p>${time.tag} • ${time.membros_count} membros</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    // Players
    if (players.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-user"></i> Players (${players.length})</h4>
                <div class="search-items">
        `;

        players.forEach(player => {
            html += `
                <div class="search-item" onclick="irParaPlayer(${player.id})">
                    <img src="${player.avatar_url || '../img/cs2.png'}" alt="${player.username}" class="search-avatar">
                    <div class="search-info">
                        <h5>${player.username}</h5>
                        <p>${player.time_tag} ${player.time_nome ? '• ' + player.time_nome : '(Sem time)'}</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    container.style.display = 'block';
}

// Esconder resultados
function esconderResultados() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
    }
}

// Navegar para página do time
function irParaTime(timeId) {

    window.location.href = `team.html?id=${timeId}`;
}

// Navegar para perfil do player
function irParaPlayer(playerId) {
    window.location.href = `perfil.html?id=${playerId}`;
}

// =================================
// CHAMADAS DAS FUNÇÕES



// Conectar input de busca
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-input');

    if (searchInput) {
        let timeoutId;

        searchInput.addEventListener('input', function () {
            clearTimeout(timeoutId);
            const termo = this.value.trim();

            // Debounce: aguarda 300ms após parar de digitar
            timeoutId = setTimeout(() => {
                buscarTimesEPlayers(termo);
            }, 300);
        });

        // Esconder resultados ao clicar fora
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-bar-container')) {
                esconderResultados();
            }
        });
    }
});



// =================================
// ========= INITIALIZATION =========
// =================================

document.addEventListener('DOMContentLoaded', function () {
    verificar_auth();
    addScrollProgress();

    // Tabs TIMES / PLAYERS (padrão: players)
    document.querySelectorAll('.hero__controls .tab').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
    // Garante estado inicial: lista de players visível
    switchTab(currentTab);

    // Busca no ranking: só configura se existir o form/input e a lista (ranking.html)
    var rankList = document.getElementById('rankListPlayers');
    var rankingSearchForm = document.getElementById('rankingSearchForm');
    var rankingSearchInput = document.getElementById('rankingSearchInput');
    var headerSearchInput = document.querySelector('.search-bar-container .search-input');

    if (!rankList || !rankingSearchForm || !rankingSearchInput) return;

    function aoDigitarBuscaRanking(value) {
        filtrarRankingPorBusca(value || '');
    }

    // Form do hero: impedir submit e filtrar ao enviar (Enter ou botão)
    rankingSearchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        aplicarFiltroRankingNoEnter(rankingSearchInput.value);
        return false;
    });

    // Input do hero: filtrar ao digitar e ao pressionar Enter
    var heroSearchTimeout;
    rankingSearchInput.addEventListener('input', function () {
        clearTimeout(heroSearchTimeout);
        heroSearchTimeout = setTimeout(function () {
            aoDigitarBuscaRanking(rankingSearchInput.value);
        }, 250);
    });
    rankingSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            aplicarFiltroRankingNoEnter(rankingSearchInput.value);
            return false;
        }
    });

    // Campo do header: na página de ranking também filtra a lista ao digitar e ao Enter
    if (headerSearchInput) {
        var headerSearchTimeout;
        headerSearchInput.addEventListener('input', function () {
            clearTimeout(headerSearchTimeout);
            headerSearchTimeout = setTimeout(function () {
                aoDigitarBuscaRanking(headerSearchInput.value);
            }, 250);
        });
        headerSearchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                aplicarFiltroRankingNoEnter(headerSearchInput.value);
                return false;
            }
        });
    }

    // Fallback: Enter em qualquer um dos dois inputs aplica o filtro
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var el = document.activeElement;
        if (el === rankingSearchInput || el === headerSearchInput) {
            e.preventDefault();
            e.stopPropagation();
            aplicarFiltroRankingNoEnter(el.value);
        }
    }, true);
});