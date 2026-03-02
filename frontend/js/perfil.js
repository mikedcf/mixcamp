
let avatar = '';
let dominio = 'http://127.0.0.1:5501';
// ===== VARIÁVEIS GLOBAIS =====
let weaponsChart = null;
let categoryChart = null;
let dashboardActive = false;
let isFlipped = false;
let isFollowing = false;
let currentProfileIndex = 0;
let weaponsData = {}; // Armazenar dados de armas





// =============================================================
// ====================== [ autenticação e logout ] ======================

// ------ AUTENTICAÇÃO DO USUARIO
async function autenticacao() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        return data;


    } catch (error) {
        showNotification('error', 'Erro ao carregar os dados. Redirecionando...');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
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
        params = new URLSearchParams(window.location.search);
        const userId_params = params.get('id');

        if(userId == userId_params){
            document.getElementById("addVideoBtn").style.display = "flex";
        }
        

        document.getElementById('userAuth').classList.add('hidden');
        document.getElementById('userPerfil').classList.remove('hidden');
        document.getElementById("followBtnBanner").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        if (perfil_data && perfil_data.perfilData && perfil_data.perfilData.usuario) {
            document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
            
        }
        // Validar se time existe antes de definir o href
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
        document.getElementById("buconfig").style.display = "none";
        document.getElementById('userAuth').classList.remove('hidden');
        document.getElementById("userPerfil").classList.add("hidden");
        document.getElementById("followBtnBanner").style.display = "none";

    }
}

// ------ LOGOUT DO USUARIO
async function logout() {

    try {
        const response = await fetch(`${API_URL}/logout`, {

            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`)

        }

        const data = await response.json();
        showNotification('success', 'Deslogado...', 1500)
        setTimeout(() => {
            document.getElementById("userPerfil").style.display = "none"
            document.getElementById("userAuth").style.display = "flex"
            // autenticacao();
            verificar_auth();
            // window.location.reload();
        }, 1500)

    }
    catch (error) {
        showNotification('error', 'Erro ao deslogar.', 1500)
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500)
    }
}


// =================================
// ========= ATUALIZAR MENU PERFIL =========
async function atualizarMenuPerfil() {
    try {
        const auth_dados = await autenticacao();
        if (auth_dados.logado) {
            const userId = auth_dados.usuario.id;
            const menuPerfilLink = document.getElementById('menuPerfilLink');
            if (menuPerfilLink) {
                menuPerfilLink.href = `perfil.html?id=${userId}`;
            }
        }
    } catch (error) {
        // Erro silencioso
    }
}

// Função para buscar imagens de posições do banco de dados
async function buscarImgPosition(posicao) {
    if (!posicao || typeof posicao !== 'string') {
        return null;
    }
    const posicaoLimpa = posicao.trim().toLowerCase();

    try {
        const response = await fetch(`${API_URL}/positionimg`);
        const data = await response.json();
        if (data && data.length > 0) {
            const dados = data[0];
            // Retorna a URL da imagem da posição específica da API
            const imgUrl = dados[posicaoLimpa] || dados[posicao];
            if (imgUrl) {
                return imgUrl;
            }
        }
    } catch (error) {
        // Se a API falhar, usa o fallback
    }

    // Fallback para positionImages se a API não retornar
    if (positionImages && positionImages[posicaoLimpa]) {
        return positionImages[posicaoLimpa];
    }

    return null;
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


        const medalhasResponse = await fetch(`${API_URL}/medalhas/usuario/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!perfilResponse.ok) {
            throw new Error('Erro ao buscar dados do perfil.');
        }


        let medalhasData = [];
        if (medalhasResponse.ok) {
            medalhasData = await medalhasResponse.json();

        }
        else if (medalhasResponse.status == 404) {
            medalhasData = [];

        } else {
            throw new Error('Erro ao buscar dados das medalhas.');
        }


        const perfilData = await perfilResponse.json();

        return { perfilData, medalhasData };
    } catch (error) {
        return { perfilData: null, medalhasData: [] };
    }
}


async function buscarTime(teamId) {
    const response = await fetch(`${API_URL}/times/${teamId}`, {
        credentials: 'include'
    });
    const data = await response.json();
    return data;
}

async function buscarHistoricoTimes() {
    const params = new URLSearchParams(window.location.search);
    const userId = Number(params.get('id'));

    const data = [];
    const dataentrada = [];
    const datasaida = [];



    const transferencias = await buscarTransferencias();


    for (const transferencia of transferencias) {
        if (transferencia.usuario_id == userId) {

            if (transferencia.tipo == 'saida') {
                datasaida.push(transferencia)
            }
            if (transferencia.tipo == 'entrada') {
                dataentrada.push(transferencia)
            }
        }
    }

    for (const entrada of dataentrada) {
        for (const saida of datasaida) {
            if (entrada.posicao == saida.posicao) {


                const teamId = entrada.time_id;
                const dadosTime = await buscarTime(teamId)
                const linkposition = await buscarImgPosition(saida.posicao)

                const entradaDate = await formatarDataBR(entrada.timestamp)
                const saidaDate = await formatarDataBR(saida.timestamp)


                const dados = {
                    teamid: teamId,
                    teamName: dadosTime.time.nome,
                    teamTag: dadosTime.time.tag,
                    avatar: dadosTime.time.avatar_time_url,
                    banner: dadosTime.time.banner_time_url,
                    teamcolor: dadosTime.coresDoTime.cores_perfil,
                    nameposicao: saida.posicao.toUpperCase(),
                    posicao: linkposition,
                    dataentrada: entradaDate,
                    datasaida: saidaDate,

                }
                data.push(dados)
            }


        }
    }


    inserirHistoricoTimes(data)
}


async function buscarTransferencias() {
    const response = await fetch(`${API_URL}/transferencias`, {
        credentials: 'include'
    });
    const data = await response.json();

    return data;
}


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

async function getCardDados() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de destaque:', error);
        return [];
    }

}


async function buscarTimesInscritos(cardId) {
    try {
        const response = await fetch(`${API_URL}/inscricoes/historicoMembros`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar times inscritos:', error);
        return { times: null };
    }
}

async function getCardDados() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de destaque:', error);
        return [];
    }

}

// Função para atualizar o level da Faceit no card
async function atualizarLevelFaceit(faceitLink) {
    const levelContainer = document.getElementById('faceitLevelContainer');
    const levelIcon = document.getElementById('faceitLevelIcon');
    const levelText = document.getElementById('faceitLevelText');
    if (!faceitLink || faceitLink === '') {
        if (levelContainer) {
            levelContainer.style.display = 'flex';
            levelIcon.src = '../img/loading2.gif';
            levelText.textContent = 'Não definido'
        }
        return;
    }

    try {
        const dadosFaceit = await buscarDadosFaceit(faceitLink);
        if (!dadosFaceit || !dadosFaceit.nivel) {
            if (levelContainer) {
                levelContainer.style.display = 'none';
            }
            return;
        }



        if (levelContainer && levelIcon && levelText) {
            levelIcon.src = dadosFaceit.nivel;
            levelIcon.alt = 'Faceit Level';
            levelText.textContent = 'Level Faceit';
            levelContainer.style.display = 'flex';


        }
    } catch (error) {
        const levelContainer = document.getElementById('faceitLevelContainer');
        if (levelContainer) {
            levelContainer.style.display = 'none';
        }
    }
}


async function steamTimeGame() {
    params = new URLSearchParams(window.location.search);
    const userId= params.get('id');

    const { perfilData } = await buscarDadosPerfil(userId);

    const STEAMID = perfilData.usuario.steamid;

    if (STEAMID == null || STEAMID == undefined || STEAMID == '') {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }

    try {
        const response = await fetch(`${API_URL}/steam/timegame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ STEAMID })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }
}


async function steamStatusCs() {
    params = new URLSearchParams(window.location.search);
    const userId= params.get('id');

    const { perfilData } = await buscarDadosPerfil(userId);

    const STEAMID = perfilData.usuario.steamid;

    if (STEAMID == null || STEAMID == undefined || STEAMID == '') {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }

    try {
        const response = await fetch(`${API_URL}/steam/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ STEAMID })
        });
        const data = await response.json();

        return data;
    } catch (error) {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }
}



async function faceitStatusCs() {
    params = new URLSearchParams(window.location.search);
    const userId= params.get('id');

    const { perfilData } = await buscarDadosPerfil(userId);

    const faceitid = perfilData.usuario.faceitid;


    if (faceitid == null || faceitid == undefined || faceitid == '') {
        return data = null;
    }

    try {
        const response = await fetch(`${API_URL}/faceit/player/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ faceitid })
        });
        const data = await response.json();
        
        return data;
    } catch (error) {
        return data = { horastotal: 'Não definido', horassemana: 'Não definido' };
    }
}


// =================================
// ========= ATUALIZAR DADOS DO PERFIL =========

async function atualizarDadosPerfil() {
    params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
   

    const {perfilData}  = await buscarDadosPerfil(userId);

    // atualizar o card e banner do perfil
    document.getElementById('cardAvatarImg').src = perfilData.usuario.avatar_url
    document.getElementById('heroBanner').style.backgroundImage = `url(${perfilData.usuario.banner_url})`
    document.getElementById('profileUsername').textContent = perfilData.usuario.username.toUpperCase()

    // atualizar tag team
    

    if (perfilData.time == null) {
        document.getElementById('teamTagContainer').style.display = 'block'
    }
    else {
        document.getElementById('teamTagName').textContent = perfilData.time.tag
        document.getElementById('teamTagContainer').style.display = 'flex'
    }




    // verificar organização
    let cargo = perfilData.usuario.gerencia
    const adm = document.getElementById('adminBadge')
    const planoMx = document.getElementById('mxBasicIcon')
    const apoiador = document.getElementById('supportIcon')
    const verify = document.getElementById('verifiedCheck')


    




    if (!perfilData.usuario.posicoes) {
        document.getElementById('profilePositions').style.display = 'none'
    }




    // verificar se tem link de faceit e steam (selo verificado ao lado do nome)
    const redesSociaisArray = perfilData.redesSociais && Array.isArray(perfilData.redesSociais) ? perfilData.redesSociais : [];
    const redeSocialData = redesSociaisArray.length > 0 ? redesSociaisArray[0] : null;
    const faceit_link = redeSocialData ? (redeSocialData.faceit_url || '') : '';
    const steam_link = redeSocialData ? (redeSocialData.steam_url || '') : '';

    if (verify) {
        const temFaceit = faceit_link && String(faceit_link).trim() !== '';
        const temSteam = steam_link && String(steam_link).trim() !== '';
        if (temFaceit && temSteam) {
            verify.style.display = 'flex';
            atualizarLevelFaceit(faceit_link);
        } else {
            // Só esconde o selo quando temos dados de redes e os dois links estão vazios.
            // Se redesSociais não veio ou veio vazio, não esconde (evita sumir após config/salvar).
            if (redeSocialData !== null && !temFaceit && !temSteam) {
                verify.style.display = 'none';
            }
            if (faceit_link) {
                atualizarLevelFaceit(faceit_link);
            }
        }
    }


    if (cargo == 'admin') {
        adm.style.display = 'flex'
    }
    else {
        adm.style.display = 'none'
    }

    if (perfilData.usuario.organizador == 'premium') {
        document.getElementById('mxBasicImg').src = '../img/mxplus.png'
    }
    else if (perfilData.usuario.organizador == 'simples') {
        document.getElementById('mxBasicImg').src = '../img/mx basic.png'
    }
    else {
        planoMx.style.display = 'none'
    }


    // ATUALIZAR SOBRE DO PERFIL
    document.getElementById('aboutDescription').textContent = perfilData.usuario.sobre || 'Nada informado sobre.'
    
    redesSociais(perfilData.redesSociais)
    posicoesPerfil()
    filtroMedalhas()
    estatisticasJogador()
    buscarHistoricoTimes()
    inserirReels(perfilData.destaques, perfilData.usuario.id);


}

async function redesSociais(redes) {

    if (redes.length <= 0) {
        return;
    }

    redesConfig = [
        {
            campo: redes[0].discord_url,
            nome: 'Discord',
            img: "../img/Discord.png"
        },
        {
            campo: redes[0].youtube_url,
            nome: 'YouTube',
            img: "../img/youtube.png"
        },
        {
            campo: redes[0].instagram_url,
            nome: 'Instagram',
            img: "../img/instag.png"
        },
        {
            campo: redes[0].twitter_url,
            nome: 'Twitter',
            img: "../img/x.png"
        },
        {
            campo: redes[0].twitch_url,
            nome: 'Twitch',
            img: "../img/twitch.png"
        },
        {
            campo: redes[0].faceit_url,
            nome: 'Faceit',
            img: "../img/faceit.png"
        },
        {
            campo: redes[0].gamesclub_url,
            nome: 'Gamesclub',
            img: "../img/gc.png"
        },
        {
            campo: redes[0].steam_url,
            nome: 'Steam',
            img: "../img/Steam.png"
        },
        {
            campo: redes[0].tiktok_url,
            nome: 'TikTok',
            img: "../img/tiktok.png"
        },
        // {
        //     campo: redes[0].kick_url,
        //     nome: 'Kick',
        //     img: "../img/kick.png"
        // },
        // {
        //     campo: redes[0].allstar_url,
        //     nome: 'Allstar',
        //     img: "../img/Allstar.jpg"
        // }
    ]

    const socialGrid = document.getElementById('socialGrid');
    socialGrid.innerHTML = '';

    redesConfig.forEach(rede => {

        if (!rede.campo || rede.campo.trim() === "") return;

        const link = document.createElement('a');
        link.href = rede.campo;
        link.target = '_blank';
        link.classList.add('social-item');


        link.innerHTML = `<img src="${rede.img}" alt="${rede.nome}" class="social-icon-img" loading="lazy">
        <span>${rede.nome}</span>`;

        socialGrid.appendChild(link);
    });

}


async function inserirHistoricoTimes(data) {


    if (data.lenght == 0) {
        
        return;
    }

    const teamhistory = document.getElementById('teamHistoryContainer');
    teamhistory.innerHTML = '';

    data.forEach(datas => {
        

        const card = document.createElement('div');
        card.className = 'team-history-card';

        card.innerHTML = `
            <div class="team-history-banner" style="background-image: url('${datas.banner}');"></div>
            <div class="team-history-content"  style="border: 1px solid ${datas.teamcolor} !important;" onclick="recPageteam(${datas.teamid})">
                <div class="team-history-logo-wrapper">
                    <img src="${datas.avatar}" alt="${datas.teamName}" class="team-history-logo"">
                </div>
                <div class="team-history-info">
                    <div class="team-history-header">
                        <h3 class="team-history-name">${datas.teamName}</h3>
                        <span class="team-history-tag">${datas.teamTag}</span>
                    </div>
                    <div class="team-history-details">
                        <div class="team-history-detail-item">
                            <i class="fas fa-sign-in-alt"></i>
                            <span class="detail-label">Entrada:</span>
                            <span class="detail-value">${datas.dataentrada}</span>
                        </div>
                        <div class="team-history-detail-item">
                            <i class="fas fa-sign-out-alt"></i>
                            <span class="detail-label">Saída:</span>
                            <span class="detail-value">${datas.datasaida}</span>
                        </div>
                        <div class="team-history-detail-item">
                            <i class="fas fa-user-tag"></i>
                            <span class="detail-label">Função:</span>
                            <img src="${datas.posicao}" alt="${datas.posicao}" class="team-historico-position" title="${datas.nameposicao}">
                        </div>
                    </div>
                </div>
            </div>
        `;


        teamhistory.appendChild(card);
    })

}


async function posicoesPerfil() {
    params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    try {
        const { perfilData } = await buscarDadosPerfil(userId);
        if (!perfilData || !perfilData.usuario || !perfilData.usuario.posicoes) {
            return;
        }
        const posicoesContainer = document.getElementById('profilePositions');
        
        if (!posicoesContainer) {
            return;
        }

        posicoesContainer.innerHTML = '';

        // Garantir que posicoes seja um array
        let posicoes = [];
        if (Array.isArray(perfilData.usuario.posicoes)) {
            posicoes = perfilData.usuario.posicoes;
        } else if (typeof perfilData.usuario.posicoes === 'string') {
            // Se for string, dividir por vírgula (compatibilidade com formato antigo)
            posicoes = perfilData.usuario.posicoes.split(',').map(p => p.trim()).filter(p => p !== '');
        }

        if (posicoes.length === 0) {
            return;
        }

        // Usar for...of com entries para ter acesso ao índice
        for (const [index, posicao] of posicoes.entries()) {
            const imgPosition = await buscarImgPosition(posicao);
            
            if (!imgPosition) {
                continue; // Pula se não encontrar a imagem
            }

            const posicaoImg = document.createElement('img');
            posicaoImg.src = imgPosition;
            posicaoImg.alt = posicao;
            posicaoImg.title = posicao.toUpperCase();
            posicaoImg.className = 'profile-position-img';

            // Adicionar classes baseado no índice para o efeito 3D
            // Primeiras 4 posições: visible (centro e laterais próximas)
            // Posições 5-8: background (mais ao fundo)
            if (index < 4) {
                posicaoImg.classList.add('visible');
            } else if (index < 8) {
                posicaoImg.classList.add('background');
            }

            // Adicionar tratamento de erro para imagens que falharem
            posicaoImg.onerror = function () {
                this.style.display = 'none';
            };

            posicoesContainer.appendChild(posicaoImg);

            // Adicionar animação de entrada com delay progressivo
            setTimeout(() => {
                posicaoImg.style.opacity = '0';
                posicaoImg.style.transition = 'opacity 0.3s ease-in-out';
                requestAnimationFrame(() => {
                    posicaoImg.style.opacity = '1';
                });
            }, index * 100);
        }
        
    } catch (error) {
        console.error('Erro ao carregar posições do perfil:', error);
    }
}

async function estatisticasJogador() {
    const data = await steamTimeGame();
    const faceitStatus = await faceitStatusCs();

    if (faceitStatus == null) {
        return;
    }

    // atualizar horas totais e horas semanais
    document.getElementById('totalHours').textContent = `${data.horastotal} horas`;
    document.getElementById('hoursLast2Weeks').textContent = `${data.horassemana} horas`;

    // atualizar estatisticas de desempenho

    const totalKills = Number(faceitStatus.lifetime?.["Total Kills with extended stats"]);
    const kd = Number(faceitStatus.lifetime?.["Average K/D Ratio"]);

    const totalDeaths = totalKills / kd.toFixed(3);


    estatisticasFaceit = {
        totalMatches: faceitStatus.lifetime.Matches || 0,
        totalWins: faceitStatus.lifetime.Wins,
        totalLosses: faceitStatus.lifetime.Matches - faceitStatus.lifetime.Wins,
        avgKD: faceitStatus.lifetime?.["Average K/D Ratio"],
        totalKills: faceitStatus.lifetime?.["Total Kills with extended stats"],
        totalDeaths: totalDeaths.toFixed(3)
    }



    document.getElementById('totalMatches').textContent = faceitStatus.lifetime.Matches;

    document.getElementById('totalWins').textContent = faceitStatus.lifetime.Wins

    document.getElementById('totalLosses').textContent = faceitStatus.lifetime.Matches - faceitStatus.lifetime.Wins

    document.getElementById('avgKD').textContent = faceitStatus.lifetime?.["Average K/D Ratio"]

    document.getElementById('totalKills').textContent = faceitStatus.lifetime?.["Total Kills with extended stats"]

    document.getElementById('totalDeaths').textContent = totalDeaths.toFixed(0)


    // document.getElementById('totalMVP').textContent = faceitStatus.lifetime?.["Total Kills with extended stats"]

    // Criar dashboard com gráficos
    criarDashboardDesempenho(estatisticasFaceit);

}


async function inserirReels(reels, idUsuarioDoPerfil){

    document.getElementById('reelsCount').textContent = (reels && reels.length) ? reels.length : 0;

    if(!reels || reels.length === 0){
        const c = document.getElementById('reelsContainer');
        if (c) c.innerHTML = '';
        return;
    }

    const reelsContainer = document.getElementById('reelsContainer');
    reelsContainer.innerHTML = '';

    reels.forEach((reel, index) => {

        const reelItem = document.createElement('div');
        reelItem.className = 'reel-item';
        const videoUrl = (reel && reel.video_url) ? reel.video_url : reel;
        reelItem.innerHTML = `
            <button type="button" class="reel-delete-btn" title="Deletar vídeo" aria-label="Deletar vídeo">
                <i class="fas fa-trash"></i>
            </button>
            <div class="reel-thumb">
                <video src="${videoUrl}" muted preload="metadata" class="reel-video"></video>
                <div class="reel-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;

        const deleteBtn = reelItem.querySelector('.reel-delete-btn');
        if (deleteBtn && idUsuarioDoPerfil != null) {
            deleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deletarReel(videoUrl, idUsuarioDoPerfil);
            });
        } else if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
        // Adicionar evento de clique para reproduzir o vídeo
        const video = reelItem.querySelector('.reel-video');
        const overlay = reelItem.querySelector('.reel-overlay');
        const reelThumb = reelItem.querySelector('.reel-thumb');
        
        // Configurar vídeo
        video.controls = false; // Controles customizados
        video.playsInline = true; // Importante para mobile
        
        // Clique no overlay ou no vídeo para tocar/pausar
        const togglePlay = (e) => {
            e.stopPropagation(); // Evitar propagação
            
            if (video.paused) {
                // Pausar todos os outros vídeos primeiro
                document.querySelectorAll('.reel-video').forEach(otherVideo => {
                    if (otherVideo !== video && !otherVideo.paused) {
                        otherVideo.pause();
                        otherVideo.muted = true;
                        const otherOverlay = otherVideo.closest('.reel-item')?.querySelector('.reel-overlay');
                        if (otherOverlay) {
                            otherOverlay.style.opacity = '1';
                        }
                    }
                });
                
                // Tocar este vídeo
                video.play().then(() => {
                    overlay.style.opacity = '0';
                    video.muted = false; // Desmutar ao tocar
                }).catch(error => {
                    console.error('Erro ao reproduzir vídeo:', error);
                    showNotification('error', 'Erro ao reproduzir o vídeo');
                });
            } else {
                video.pause();
                overlay.style.opacity = '1';
                video.muted = true; // Mutar ao pausar
            }
        };
        
        // Eventos de clique
        overlay.addEventListener('click', togglePlay);
        reelThumb.addEventListener('click', (e) => {
            if (e.target === video) {
                togglePlay(e);
            }
        });

        // Passar o mouse em cima: toca o vídeo (mudo). Tirar o mouse: pausa.
        function playOnHover() {
            document.querySelectorAll('.reel-video').forEach(otherVideo => {
                if (otherVideo !== video && !otherVideo.paused) {
                    otherVideo.pause();
                    otherVideo.muted = true;
                    const otherOverlay = otherVideo.closest('.reel-item')?.querySelector('.reel-overlay');
                    if (otherOverlay) otherOverlay.style.opacity = '1';
                }
            });
            video.muted = true;
            video.play().then(() => {
                overlay.style.opacity = '0';
            }).catch(() => {});
        }
        function pauseOnLeave() {
            video.pause();
            overlay.style.opacity = '1';
            video.muted = true;
        }
        reelItem.addEventListener('mouseenter', playOnHover);
        reelItem.addEventListener('mouseleave', pauseOnLeave);
        
        // Quando o vídeo terminar, mostrar overlay novamente
        video.addEventListener('ended', () => {
            overlay.style.opacity = '1';
            video.muted = true; // Mutar novamente
            video.currentTime = 0; // Voltar ao início
        });
        
        // Quando o vídeo começar a tocar, esconder overlay
        video.addEventListener('play', () => {
            overlay.style.opacity = '0';
        });
        
        // Quando o vídeo pausar, mostrar overlay
        video.addEventListener('pause', () => {
            if (!video.ended) {
                overlay.style.opacity = '1';
            }
        });
        
        reelsContainer.appendChild(reelItem);
    })
}

// ===== DELETAR REEL =====
async function deletarReel(videoUrl, profileUserId) {
    // if (!confirm('Tem certeza que deseja deletar este vídeo?')) {
    //     return;
    // }

    const confirmado = await showConfirmModal('Tem certeza que deseja deletar este vídeo?');
    if (!confirmado) {
        return;
    }


    try {
        const auth_dados = await autenticacao();
        if (!auth_dados.logado) {
            showNotification('error', 'Você precisa estar logado para deletar vídeos');
            return;
        }

        if (Number(auth_dados.usuario.id) !== Number(profileUserId)) {
            showNotification('error', 'Você só pode excluir vídeos do seu próprio perfil');
            return;
        }

        const userId = profileUserId;
        const resultado = await buscarDadosPerfil(userId);
        const perfilData = resultado && resultado.perfilData ? resultado.perfilData : null;

        if (!perfilData || !perfilData.destaques) {
            showNotification('error', 'Erro ao carregar dados do perfil');
            return;
        }

        // Remover o vídeo do array de destaques
        const updatedDestaques = perfilData.destaques.filter((reel, i) => {
            return reel.video_url !== videoUrl;
        });

        // Backend espera array de strings (URLs), não array de objetos
        const urlsDestaques = updatedDestaques.map(d => d.video_url);

        // Atualizar no backend
        const response = await fetch(`${API_URL}/configuracoes/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                destaques: urlsDestaques
            })
        });

        if (response.ok) {
            showNotification('success', 'Vídeo deletado com sucesso!');
            const newResult = await buscarDadosPerfil(userId);
            const newPerfilData = newResult && newResult.perfilData ? newResult.perfilData : null;
            inserirReels((newPerfilData && newPerfilData.destaques) ? newPerfilData.destaques : [], userId);
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao deletar vídeo');
        }
    } catch (error) {
        console.error('Erro ao deletar reel:', error);
        showNotification('error', 'Erro ao deletar vídeo. Tente novamente.');
    }
}





// ===== CRIAR DASHBOARD DE DESEMPENHO COM GRÁFICOS =====
let winsLossesChartInstance = null;
let killsDeathsChartInstance = null;

function criarDashboardDesempenho(dados) {
    if (!dados) {
        console.error('Dados não disponíveis para criar dashboard');
        return;
    }

    // Calcular taxa de vitória
    const totalMatches = Number(dados.totalMatches) || 0;
    const totalWins = Number(dados.totalWins) || 0;
    const totalLosses = Number(dados.totalLosses) || 0;
    const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : 0;

    // Calcular kills por partida
    const totalKills = Number(dados.totalKills) || 0;
    const killsPerMatch = totalMatches > 0 ? (totalKills / totalMatches).toFixed(1) : 0;

    // Atualizar cards de resumo
    const winRateEl = document.getElementById('winRate');
    const kdRatioEl = document.getElementById('kdRatio');
    const killsPerMatchEl = document.getElementById('killsPerMatch');
    const winRateCenterEl = document.getElementById('winRateCenter');
    const kdRatioCenterEl = document.getElementById('kdRatioCenter');

    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (kdRatioEl) kdRatioEl.textContent = dados.avgKD || '0.00';
    if (killsPerMatchEl) killsPerMatchEl.textContent = killsPerMatch;

    // Atualizar valores centrais dos gráficos com animação
    if (winRateCenterEl) {
        const numberEl = winRateCenterEl.querySelector('.chart-center-number');
        if (numberEl) {
            numberEl.style.opacity = '0';
            numberEl.style.transform = 'scale(0.8)';
            setTimeout(() => {
                numberEl.textContent = `${winRate}%`;
                numberEl.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                numberEl.style.opacity = '1';
                numberEl.style.transform = 'scale(1)';
            }, 100);
        }
    }
    if (kdRatioCenterEl) {
        const numberEl = kdRatioCenterEl.querySelector('.chart-center-number');
        if (numberEl) {
            numberEl.style.opacity = '0';
            numberEl.style.transform = 'scale(0.8)';
            setTimeout(() => {
                numberEl.textContent = dados.avgKD || '0.00';
                numberEl.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                numberEl.style.opacity = '1';
                numberEl.style.transform = 'scale(1)';
            }, 150);
        }
    }

    // Destruir gráficos anteriores se existirem
    if (winsLossesChartInstance) {
        winsLossesChartInstance.destroy();
    }
    if (killsDeathsChartInstance) {
        killsDeathsChartInstance.destroy();
    }

    // Gráfico de Vitórias vs Derrotas (Doughnut)
    const winsLossesCtx = document.getElementById('winsLossesChart');
    if (winsLossesCtx) {
        winsLossesChartInstance = new Chart(winsLossesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Vitórias', 'Derrotas'],
                datasets: [{
                    data: [totalWins, totalLosses],
                    backgroundColor: [
                        'rgba(76, 217, 100, 0.9)',  // Verde neon elegante
                        'rgba(255, 82, 82, 0.7)'   // Vermelho menos saturado
                    ],
                    borderWidth: 0,
                    cutout: '70%',
                    hoverOffset: 8,
                    hoverBorderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: 12,
                                weight: '500',
                                family: "'Oswald', sans-serif"
                            },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: 'rgba(255, 255, 255, 0.95)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderWidth: 1,
                        padding: 14,
                        cornerRadius: 12,
                        displayColors: true,
                        boxPadding: 6,
                        titleFont: {
                            size: 13,
                            weight: '600',
                            family: "'Oswald', sans-serif"
                        },
                        bodyFont: {
                            size: 12,
                            weight: '400',
                            family: "'Oswald', sans-serif"
                        },
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Kills vs Deaths (Doughnut)
    const killsDeathsCtx = document.getElementById('killsDeathsChart');
    if (killsDeathsCtx) {
        const totalKillsNum = Number(dados.totalKills) || 0;
        const totalDeathsNum = Number(dados.totalDeaths) || 0;

        killsDeathsChartInstance = new Chart(killsDeathsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Kills', 'Deaths'],
                datasets: [{
                    data: [totalKillsNum, totalDeathsNum],
                    backgroundColor: [
                        'rgba(33, 150, 243, 0.85)',  // Azul com gradiente
                        'rgba(255, 152, 0, 0.75)'    // Laranja com gradiente
                    ],
                    borderWidth: 0,
                    cutout: '70%',
                    hoverOffset: 8,
                    hoverBorderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: 12,
                                weight: '500',
                                family: "'Oswald', sans-serif"
                            },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: 'rgba(255, 255, 255, 0.95)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderWidth: 1,
                        padding: 14,
                        cornerRadius: 12,
                        displayColors: true,
                        boxPadding: 6,
                        titleFont: {
                            size: 13,
                            weight: '600',
                            family: "'Oswald', sans-serif"
                        },
                        bodyFont: {
                            size: 12,
                            weight: '400',
                            family: "'Oswald', sans-serif"
                        },
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}


// =================================
// ========= BOTÕES DA PAGINA =========

function pageConfig() {
    window.location.href = 'configuracao.html'
}


async function pageteam() {
    params = new URLSearchParams(window.location.search);
    const userId= params.get('id');
    const { perfilData } = await buscarDadosPerfil(userId);
    if (perfilData && perfilData.usuario && perfilData.usuario.time_id) {
        window.location.href = `team.html?id=${perfilData.usuario.time_id}`;
    } else {
        showNotification('error', 'Time não encontrado');
    }
}


function recPageteam(teamid) {
    if (teamid) {
        window.location.href = `team.html?id=${teamid}`;
    } else {
        showNotification('error', 'ID do time não encontrado');
    }
}


async function Copiarl_Link_Perfil() {

    let url = window.location.href

    navigator.clipboard.writeText(url)
        .then(() => {
            alert("Copiado para a área de transferência!");
            showNotification('success', 'Link copiado para a área de transferência!');
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
        });
}


function presentearPerfil() {
    // Implementar funcionalidade de presentear
    showNotification('alert', 'Funcionalidade de presentear em desenvolvimento!');
}


async function baixarCfg() {

    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    const { perfilData } = await buscarDadosPerfil(userId);
    const cfg = perfilData.usuario.cfg_cs;

    if(!cfg) {
        showNotification('error', 'Arquivo .cfg não encontrado');
        return;
    }


    const nomeArquivo = `Mixcamp-${perfilData.usuario.username}.cfg`;

    const link = document.createElement('a');
    link.href = `${cfg}?fl_attachment=${nomeArquivo}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', `Arquivo ${nomeArquivo} baixado com sucesso!`);
    return;
}



// =================================
// ========= SISTEMA DE TRANCIÇÃO DE DETALHES DO PERFIL =========
let faceit = true
async function rotateAvatar() {
    try {
        params = new URLSearchParams(window.location.search);
        const userId= params.get('id');
        const { perfilData } = await buscarDadosPerfil(userId);
        
        // Validar se perfilData e redesSociais existem
        if (!perfilData || !perfilData.redesSociais || !perfilData.redesSociais[0]) {
            console.warn('Dados do perfil ou redes sociais não encontrados');
            return;
        }
        
        const link = perfilData.redesSociais[0].faceit_url;
        if (!link || link === '' || link === null || link === undefined) {
            console.warn('Link do Faceit não encontrado');
            return;
        }
        
        const dadosFaceit = await buscarDadosFaceit(link);
        
        // Validar se dadosFaceit foi retornado corretamente
        if (!dadosFaceit || !dadosFaceit.data) {
            console.warn('Dados do Faceit não encontrados');
            return;
        }
        
        if (faceit) {
            const cardAvatarContainer = document.querySelector('.card-avatar-container');
            const cardAvatarInner = document.getElementById('cardAvatarInner');
            const cardAvatarImg = document.getElementById('cardAvatarImg');
            const cardAvatarBg = document.getElementById('cardAvatarBg');
            const cardAvatarBgBack = document.getElementById('cardAvatarBgBack');
            const heroBanner = document.getElementById('heroBanner');
            const profileUsername = document.getElementById('profileUsername');
            const teamTagName = document.getElementById('teamTagName');
            
            if (!cardAvatarInner || !cardAvatarImg || !cardAvatarContainer) {
                return;
            }
            
            // Se já está girando, não fazer nada
            if (isFlipped) {
                return;
            }
            
            isFlipped = true;
            
            // Verificar se dadosFaceit.data é um array para navegação entre perfis
            // Se não for array, usar os dados diretamente
            let currentProfile;
            if (Array.isArray(dadosFaceit.data) && dadosFaceit.data.length > 0) {
                currentProfileIndex = (currentProfileIndex + 1) % dadosFaceit.data.length;
                currentProfile = dadosFaceit.data[currentProfileIndex];
            } else {
                // Se não for array, usar os dados diretamente
                currentProfile = dadosFaceit.data;
            }
            
            if (!currentProfile) {
                console.warn('Perfil atual não encontrado');
                isFlipped = false;
                return;
            }

            // Trocar a imagem IMEDIATAMENTE antes da animação começar
            const avatarUrl = currentProfile.avatar || dadosFaceit.data.avatar || perfilData.usuario.avatar_url;
            if (avatarUrl) {
                cardAvatarImg.src = avatarUrl;
                const avatarBackImg = cardAvatarInner.querySelector('.card-avatar-back .card-avatar-img');
                if (avatarBackImg) {
                    avatarBackImg.src = avatarUrl;
                }
            }

            // Atualizar banner
            if (heroBanner) {
                const bannerUrl = currentProfile.cover_image || dadosFaceit.data.cover_image || perfilData.usuario.banner_url;
                if (bannerUrl) {
                    heroBanner.style.backgroundImage = `url('${bannerUrl}')`;
                }
            }

            // Atualizar nome
            if (profileUsername) {
                const nickname = currentProfile.nickname || dadosFaceit.data.nickname || perfilData.usuario.username;
                if (nickname) {
                    profileUsername.textContent = nickname;
                }
            }

            // Atualizar level da Faceit
            if (dadosFaceit && dadosFaceit.nivel) {
                const levelContainer = document.getElementById('faceitLevelContainer');
                const levelIcon = document.getElementById('faceitLevelIcon');
                const levelText = document.getElementById('faceitLevelText');

                if (levelContainer && levelIcon && levelText) {
                    levelIcon.src = dadosFaceit.nivel;
                    levelIcon.alt = 'Faceit Level';
                    levelText.textContent = 'Level Faceit';
                    levelContainer.style.display = 'flex';
                }
            }

            // Atualizar tag do time
            if (teamTagName) {
                const teamName = (currentProfile.team && currentProfile.team.name) 
                    || (dadosFaceit.data.team && dadosFaceit.data.team.name)
                    || (perfilData.time && perfilData.time.tag);
                if (teamName) {
                    teamTagName.textContent = teamName;
                }
            }


            // Atualizar backgrounds
            const bannerUrl = currentProfile.banner || dadosFaceit.data.banner || perfilData.usuario.banner_url;
            if (bannerUrl) {
                if (cardAvatarBg) {
                    cardAvatarBg.style.backgroundImage = `url('${bannerUrl}')`;
                }
                if (cardAvatarBgBack) {
                    cardAvatarBgBack.style.backgroundImage = `url('${bannerUrl}')`;
                }
            }

            // Adicionar classe de animação de giro APÓS trocar a imagem
            cardAvatarContainer.classList.add('spinning');
            faceit = false;
            
            // Após a animação completar, remover a classe
            setTimeout(() => {
                cardAvatarContainer.classList.remove('spinning');
                isFlipped = false;
            }, 800); // Tempo total da animação
        }
        else {
            const cardAvatarContainer = document.querySelector('.card-avatar-container');
            const cardAvatarInner = document.getElementById('cardAvatarInner');
            const cardAvatarImg = document.getElementById('cardAvatarImg');
            const cardAvatarBg = document.getElementById('cardAvatarBg');
            const cardAvatarBgBack = document.getElementById('cardAvatarBgBack');
            const heroBanner = document.getElementById('heroBanner');
            const profileUsername = document.getElementById('profileUsername');
            const teamTagName = document.getElementById('teamTagName');

            if (!cardAvatarInner || !cardAvatarImg || !cardAvatarContainer) {
                return;
            }

            // Se já está girando, não fazer nada
            if (isFlipped) {
                return;
            }

            isFlipped = true;

            // Verificar se dadosFaceit.data é um array para navegação entre perfis
            let currentProfile;
            if (Array.isArray(dadosFaceit.data) && dadosFaceit.data.length > 0) {
                currentProfileIndex = (currentProfileIndex + 1) % dadosFaceit.data.length;
                currentProfile = dadosFaceit.data[currentProfileIndex];
            } else {
                currentProfile = dadosFaceit.data;
            }
            
            if (!currentProfile) {
                console.warn('Perfil atual não encontrado');
                isFlipped = false;
                return;
            }

            // Trocar a imagem IMEDIATAMENTE antes da animação começar
            const avatarUrl = perfilData.usuario.avatar_url;
            if (avatarUrl) {
                cardAvatarImg.src = avatarUrl;
                const avatarBackImg = cardAvatarInner.querySelector('.card-avatar-back .card-avatar-img');
                if (avatarBackImg && currentProfile.avatar) {
                    avatarBackImg.src = currentProfile.avatar;
                }
            }

            // Atualizar banner
            if (heroBanner && perfilData.usuario.banner_url) {
                heroBanner.style.backgroundImage = `url('${perfilData.usuario.banner_url}')`;
            }

            // Atualizar nome
            if (profileUsername && perfilData.usuario.username) {
                profileUsername.textContent = perfilData.usuario.username;
            }

            // Atualizar level da Faceit
            const faceitLink = perfilData.redesSociais && perfilData.redesSociais[0] && perfilData.redesSociais[0].faceit_url;
            if (faceitLink) {
                atualizarLevelFaceit(faceitLink);
            } else {
                const levelContainer = document.getElementById('faceitLevelContainer');
                if (levelContainer) {
                    levelContainer.style.display = 'none';
                }
            }

            // Atualizar tag do time
            if (teamTagName) {
                const teamName = (currentProfile.team && currentProfile.team.name)
                    || (perfilData.time && perfilData.time.tag);
                if (teamName) {
                    teamTagName.textContent = teamName;
                }
            }


            // Atualizar backgrounds
            const bannerUrl = currentProfile.banner || perfilData.usuario.banner_url;
            if (bannerUrl) {
                if (cardAvatarBg) {
                    cardAvatarBg.style.backgroundImage = `url('${bannerUrl}')`;
                }
                if (cardAvatarBgBack) {
                    cardAvatarBgBack.style.backgroundImage = `url('${bannerUrl}')`;
                }
            }

            // Adicionar classe de animação de giro APÓS trocar a imagem
            cardAvatarContainer.classList.add('spinning');
            faceit = true;

            // Após a animação completar, remover a classe
            setTimeout(() => {
                cardAvatarContainer.classList.remove('spinning');
                isFlipped = false;
            }, 800); // Tempo total da animação
        }
    } catch (error) {
        console.error('Erro na função rotateAvatar:', error);
        isFlipped = false;
    }
}


// =================================
// ========= MEDALHAS  =========

async function filtroMedalhas() {
    params = new URLSearchParams(window.location.search);
    const userId= params.get('id');
    const { medalhasData } = await buscarDadosPerfil(userId);
    
    let data = []

    // ✅ CORREÇÃO: Verificar se medalhasData existe
    if (!medalhasData || !Array.isArray(medalhasData)) {
        
        insertMedalhas([]);
        return;
    }

    for (const medalha of medalhasData) {
        // ✅ CORREÇÃO: Usar const ou let
        let dados = null;

        if (medalha.position_medalha == 'campeao') {

            const dataConquista = await formatarDataBR(medalha.data_conquista)



            dados = {
                id: medalha.id,
                dataConquista: dataConquista,
                imagem_url: medalha.imagem_url_campeao,
                position: 'campeao',
                cor: 'yellow', // Cor para box-shadow
                nome: medalha.nome || 'Campeão',
                descicao: medalha.descricao || '',
                edicao: medalha.edicao_campeonato || '',
                iframeUrl: medalha.iframe_url_campeao || ''
            }
            data.push(dados);
        }
        else if (medalha.position_medalha == 'segundo') {
            const dataConquista = await formatarDataBR(medalha.data_conquista)
            dados = {
                id: medalha.id,
                dataConquista: dataConquista,
                imagem_url: medalha.imagem_url_segundo,
                position: 'segundo',
                cor: 'silver', // Cor para box-shadow (prata/cinza)
                nome: medalha.nome || 'Segundo Lugar',
                descicao: medalha.descricao || '',
                edicao: medalha.edicao_campeonato || '',
                iframeUrl: medalha.iframe_url_segundo || ''
            }
            data.push(dados);
        }
    }

    insertMedalhas(data);
}



async function insertMedalhas(dados) {
    // ✅ CORREÇÃO 1: ID correto
    const medalhasContainer = document.getElementById('medalsContainer');

    // ✅ CORREÇÃO 2: Verificar se existe
    if (!medalhasContainer) {
        return;
    }

    // ✅ CORREÇÃO 3: Pegar os slots EXISTENTES, não criar novos
    const slots = medalhasContainer.querySelectorAll('.medalha-slot');

    // Limpar todos os slots primeiro
    slots.forEach(slot => {
        const content = slot.querySelector('.medalha-content');
        if (content) {
            content.innerHTML = '';
        }
        slot.classList.add('empty');
        slot.style.display = ''; // Reset display
        slot.style.boxShadow = ''; // Reset box-shadow
    });

    // Se não tiver medalhas, mostrar os primeiros 7 slots vazios com "?"
    if (!dados || dados.length === 0) {
        // Adicionar classe ao container para ativar layout especial
        medalhasContainer.classList.add('all-empty');

        // Adicionar classe à seção principal para permitir overflow
        const medalsSection = medalhasContainer.closest('.medals-main-section');
        if (medalsSection) {
            medalsSection.classList.add('all-empty-section');
        }

        slots.forEach((slot, index) => {
            if (index < 7) {
                // Mostrar os primeiros 7 slots com "?" (o CSS já adiciona via ::after)
                slot.style.display = 'flex'; // Garantir que está visível
                slot.style.visibility = 'visible'; // Garantir visibilidade
                slot.style.opacity = '1'; // Garantir opacidade
                slot.classList.add('empty'); // Classe empty ativa o ::after com "?"
                slot.style.boxShadow = ''; // Sem box-shadow para slots vazios
            } else {
                // Esconder slots além dos 7 primeiros
                slot.style.display = 'none';
            }
        });
        return;
    }

    // Remover classe all-empty se houver medalhas
    medalhasContainer.classList.remove('all-empty');

    // Remover classe da seção principal
    const medalsSection = medalhasContainer.closest('.medals-main-section');
    if (medalsSection) {
        medalsSection.classList.remove('all-empty-section');
    }

    // Se tiver medalhas, esconder slots vazios e preencher os que têm medalhas
    for (let index = 0; index < slots.length; index++) {
        const slot = slots[index];

        if (index < dados.length) {
            // Preencher slot com medalha
            const dado = dados[index];
            const content = slot.querySelector('.medalha-content');

            if (!content) continue;

            // Aplicar box-shadow no slot baseado na cor
            const boxShadowColor = dado.cor === 'yellow' ? '#fffb00' : '#C0C0C0'; // Prata para segundo lugar
            slot.style.boxShadow = `0 0 20px ${boxShadowColor}`;

            // Inserir imagem na div .medalha-content
            content.innerHTML = `<img src="${dado.imagem_url}" alt="${dado.position}" onerror="this.style.display='none';" loading="lazy">`;

            // Remover classe empty e mostrar slot
            slot.classList.remove('empty');
            slot.style.display = '';

            // Adicionar evento de clique no slot
            slot.addEventListener('click', () => {
                openMedalModal(dado);
                
            });
        } else {
            // Esconder slots vazios que não têm medalhas
            slot.style.display = 'none';
        }
    }
}




// ===== CRIAR CONSTELAÇÃO NO MODAL =====
function criarConstelacaoModal() {
    const svg = document.getElementById('medalModalConstellation');
    if (!svg) return;

    // Limpar SVG anterior
    svg.innerHTML = '';

    // Obter dimensões do modal
    const modalContent = document.getElementById('medalModalContent');
    if (!modalContent) return;

    const width = modalContent.offsetWidth;
    const height = modalContent.offsetHeight;

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Centralizar as letras
    const centerX = width / 2;
    const centerY = height / 2;
    const letterSize = Math.min(width, height) * 0.25;
    const spacing = letterSize * 0.3;

    // Função auxiliar para criar pontos em uma linha
    function criarPontosLinha(x1, y1, x2, y2, numPontos) {
        const pontos = [];
        for (let i = 0; i <= numPontos; i++) {
            const t = i / numPontos;
            pontos.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t,
                size: 2
            });
        }
        return pontos;
    }

    const todosPontos = [];
    const todasConexoes = [];
    let pontoIndex = 0;

    // === LETRA M ===
    const mX = centerX - letterSize * 0.7;
    const mY = centerY;
    const mAltura = letterSize * 0.6;
    const mLargura = letterSize * 0.5;

    // M: Linha esquerda (vertical)
    const mEsqTopo = { x: mX, y: mY - mAltura / 2, size: 2.5 };
    const mEsqBase = { x: mX, y: mY + mAltura / 2, size: 2.5 };
    todosPontos.push(mEsqTopo, mEsqBase);
    const pontosMEsq = criarPontosLinha(mEsqTopo.x, mEsqTopo.y, mEsqBase.x, mEsqBase.y, 5);
    todosPontos.push(...pontosMEsq.slice(1, -1));
    const idxMEsq = pontoIndex;
    pontoIndex += pontosMEsq.length;

    // M: V do meio
    const mVTopo = { x: mX + mLargura / 2, y: mY - mAltura / 4, size: 2.5 };
    const mVBase = { x: mX + mLargura / 2, y: mY + mAltura / 4, size: 2.5 };
    todosPontos.push(mVTopo, mVBase);
    const pontosV1 = criarPontosLinha(mEsqTopo.x, mEsqTopo.y, mVTopo.x, mVTopo.y, 4);
    const pontosV2 = criarPontosLinha(mVTopo.x, mVTopo.y, mVBase.x, mVBase.y, 4);
    const pontosV3 = criarPontosLinha(mVBase.x, mVBase.y, mEsqBase.x, mEsqBase.y, 4);
    todosPontos.push(...pontosV1.slice(1, -1), ...pontosV2.slice(1, -1), ...pontosV3.slice(1, -1));
    const idxV = pontoIndex;
    pontoIndex += pontosV1.length + pontosV2.length + pontosV3.length - 3;

    // M: Linha direita (vertical)
    const mDirTopo = { x: mX + mLargura, y: mY - mAltura / 2, size: 2.5 };
    const mDirBase = { x: mX + mLargura, y: mY + mAltura / 2, size: 2.5 };
    todosPontos.push(mDirTopo, mDirBase);
    const pontosMDir = criarPontosLinha(mDirTopo.x, mDirTopo.y, mDirBase.x, mDirBase.y, 5);
    todosPontos.push(...pontosMDir.slice(1, -1));
    const pontosV4 = criarPontosLinha(mVTopo.x, mVTopo.y, mDirTopo.x, mDirTopo.y, 4);
    const pontosV5 = criarPontosLinha(mVBase.x, mVBase.y, mDirBase.x, mDirBase.y, 4);
    todosPontos.push(...pontosV4.slice(1, -1), ...pontosV5.slice(1, -1));

    // Conexões M
    for (let i = idxMEsq; i < idxMEsq + pontosMEsq.length - 1; i++) {
        todasConexoes.push([i, i + 1]);
    }
    for (let i = idxV; i < idxV + pontosV1.length + pontosV2.length + pontosV3.length - 4; i++) {
        if (i + 1 < todosPontos.length) {
            todasConexoes.push([i, i + 1]);
        }
    }

    // === LETRA X ===
    const xX = centerX + letterSize * 0.2;
    const xY = centerY;
    const xAltura = letterSize * 0.6;
    const xLargura = letterSize * 0.5;

    // X: Diagonal superior esquerda -> centro -> inferior direita
    const xSupEsq = { x: xX, y: xY - xAltura / 2, size: 2.5 };
    const xCentro = { x: xX + xLargura / 2, y: xY, size: 2.5 };
    const xInfDir = { x: xX + xLargura, y: xY + xAltura / 2, size: 2.5 };
    todosPontos.push(xSupEsq, xCentro, xInfDir);
    const pontosX1 = criarPontosLinha(xSupEsq.x, xSupEsq.y, xCentro.x, xCentro.y, 4);
    const pontosX2 = criarPontosLinha(xCentro.x, xCentro.y, xInfDir.x, xInfDir.y, 4);
    todosPontos.push(...pontosX1.slice(1, -1), ...pontosX2.slice(1, -1));
    const idxX1 = pontoIndex;
    pontoIndex += pontosX1.length + pontosX2.length - 2;

    // X: Diagonal superior direita -> centro -> inferior esquerda
    const xSupDir = { x: xX + xLargura, y: xY - xAltura / 2, size: 2.5 };
    const xInfEsq = { x: xX, y: xY + xAltura / 2, size: 2.5 };
    todosPontos.push(xSupDir, xInfEsq);
    const pontosX3 = criarPontosLinha(xSupDir.x, xSupDir.y, xCentro.x, xCentro.y, 4);
    const pontosX4 = criarPontosLinha(xCentro.x, xCentro.y, xInfEsq.x, xInfEsq.y, 4);
    todosPontos.push(...pontosX3.slice(1, -1), ...pontosX4.slice(1, -1));

    // Conexões X
    for (let i = idxX1; i < idxX1 + pontosX1.length + pontosX2.length - 2; i++) {
        if (i + 1 < todosPontos.length) {
            todasConexoes.push([i, i + 1]);
        }
    }

    // Criar linhas
    todasConexoes.forEach(([i, j]) => {
        if (i < todosPontos.length && j < todosPontos.length) {
            const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linha.setAttribute('x1', todosPontos[i].x);
            linha.setAttribute('y1', todosPontos[i].y);
            linha.setAttribute('x2', todosPontos[j].x);
            linha.setAttribute('y2', todosPontos[j].y);
            linha.setAttribute('stroke', '#fffb00');
            linha.setAttribute('stroke-width', '1.5');
            linha.setAttribute('opacity', '0.6');
            linha.setAttribute('class', 'constellation-line');
            linha.style.filter = 'drop-shadow(0 0 3px rgba(255, 251, 0, 0.8))';
            svg.appendChild(linha);
        }
    });

    // Criar pontos (estrelas)
    todosPontos.forEach((ponto, index) => {
        // Brilho externo
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', ponto.x);
        glow.setAttribute('cy', ponto.y);
        glow.setAttribute('r', ponto.size * 3);
        glow.setAttribute('fill', '#fffb00');
        glow.setAttribute('opacity', '0.2');
        glow.setAttribute('class', 'constellation-glow');
        glow.style.animationDelay = `${index * 0.1}s`;
        svg.appendChild(glow);

        // Estrela principal
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', ponto.x);
        circle.setAttribute('cy', ponto.y);
        circle.setAttribute('r', ponto.size);
        circle.setAttribute('fill', '#fffb00');
        circle.setAttribute('opacity', '1');
        circle.setAttribute('class', 'constellation-star');
        circle.style.animationDelay = `${index * 0.1}s`;
        circle.style.filter = 'drop-shadow(0 0 6px rgba(255, 251, 0, 1))';
        svg.appendChild(circle);
    });
}
// ===== FUNÇÃO PARA ABRIR MODAL DE MEDALHAS =====
function openMedalModal(medalData) {
    const modal = document.getElementById('medalModal');
    if (!modal) return;

    // Definir cores baseadas no campo 'cor' do array
    let colorScheme = {
        yellow: {
            primary: '#fffb00',
            secondary: '#ffd700',
            glow: 'rgba(255, 251, 0, 0.6)',
            gradient: 'linear-gradient(135deg, rgba(255, 251, 0, 0.2), rgba(255, 215, 0, 0.1))',
            border: 'rgba(255, 251, 0, 0.5)',
            text: '#fffb00',
            shadow: 'rgba(255, 251, 0, 0.4)'
        },
        silver: {
            primary: '#C0C0C0',
            secondary: '#E8E8E8',
            glow: 'rgba(192, 192, 192, 0.5)',
            gradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(232, 232, 232, 0.1))',
            border: 'rgba(192, 192, 192, 0.4)',
            text: '#C0C0C0',
            shadow: 'rgba(192, 192, 192, 0.3)'
        }
    };

    let colors = colorScheme[medalData.cor] || colorScheme.yellow;

    // Aplicar cores dinâmicas ao modal
    const modalContent = document.getElementById('medalModalContent');
    if (modalContent) {
        modalContent.style.setProperty('--medal-color-primary', colors.primary);
        modalContent.style.setProperty('--medal-color-secondary', colors.secondary);
        modalContent.style.setProperty('--medal-color-glow', colors.glow);
        modalContent.style.setProperty('--medal-color-border', colors.border);
        modalContent.style.setProperty('--medal-color-text', colors.text);
        modalContent.style.setProperty('--medal-color-shadow', colors.shadow);
        modalContent.style.setProperty('--medal-gradient', colors.gradient);
        modalContent.classList.add(`medal-color-${medalData.cor}`);
    }

    // Preencher dados do modal
    const championTitleEl = document.getElementById('medalModalChampionTitle');
    if (championTitleEl) {
        championTitleEl.textContent = medalData.position === 'campeao' ? 'Campeão!' : '2° Lugar';
    }

    const tournamentNameEl = document.getElementById('medalModalTournamentName');
    if (tournamentNameEl) {
        tournamentNameEl.textContent = medalData.nome || 'Campeonato';
    }

    const dateEl = document.getElementById('medalModalDate');
    if (dateEl) {
        dateEl.textContent = medalData.dataConquista || 'Data não disponível';
    }

    const descriptionEl = document.getElementById('medalModalDescription');
    if (descriptionEl) {
        descriptionEl.textContent = medalData.descicao || 'Descrição não disponível';
    }

    const tournamentDetailsEl = document.getElementById('medalModalTournament');
    if (tournamentDetailsEl) {
        tournamentDetailsEl.textContent = medalData.edicao || '';
    }

    const iframeEl = document.getElementById('medalModalIframe');
    const loadingEl = document.getElementById('medalIframeLoading');

    // Carregar iframe
    if (iframeEl && loadingEl) {
        loadingEl.style.display = 'flex';
        iframeEl.style.display = 'none';

        if (medalData.iframeUrl) {
            iframeEl.src = medalData.iframeUrl;
            iframeEl.onload = () => {
                loadingEl.style.display = 'none';
                iframeEl.style.display = 'block';
            };
            iframeEl.onerror = () => {
                loadingEl.style.display = 'none';
            };
        } else {
            loadingEl.style.display = 'none';
        }
    }

    // Adicionar blur ao body quando modal abre
    document.body.classList.add('modal-open');

    // Criar constelação no fundo
    setTimeout(() => {
        criarConstelacaoModal();
    }, 100);

    // Atualizar constelação quando o modal redimensionar
    window.addEventListener('resize', criarConstelacaoModal);

    // Mostrar modal com animação
    modal.classList.add('active');
    modal.style.display = 'flex';

    // Prevenir scroll da página (html + body)
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}

// ===== FUNÇÃO PARA FECHAR MODAL DE MEDALHAS =====
function closeMedalModal() {
    const modal = document.getElementById('medalModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';

        // Remover blur do body quando modal fecha
        document.body.classList.remove('modal-open');

        // Remover listener de resize
        window.removeEventListener('resize', criarConstelacaoModal);

        // Remover classes de cor do conteúdo
        const modalContent = document.getElementById('medalModalContent');
        if (modalContent) {
            modalContent.classList.remove('medal-color-yellow', 'medal-color-silver');
        }
    }

    // Restaurar scroll da página (html + body)
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Limpar iframe
    const iframeEl = document.getElementById('medalModalIframe');
    const loadingEl = document.getElementById('medalIframeLoading');
    if (iframeEl) {
        iframeEl.src = '';
        iframeEl.style.display = 'none';
    }
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
}


// ===== INICIALIZAR HANDLERS DE CLIQUE NAS MEDALHAS =====
// function initMedalClickHandlers() {
//     const medalSlots = document.querySelectorAll('.medalha-slot');

//     medalSlots.forEach((slot, index) => {
//         // Adicionar cursor pointer se não tiver
//         slot.style.cursor = 'pointer';

//         // Adicionar event listener
//         slot.addEventListener('click', (e) => {
//             // Não abrir modal se clicar em slot vazio
//             if (slot.classList.contains('empty')) return;

//             // Dados da medalha (exemplo - você pode personalizar com dados reais)
//             const medalData = {
//                 championTitle: 'Campeão!',
//                 tournamentName: `Campeonato Delta ${2024 + index}`,
//                 date: '21 Abril 2024',
//                 category: 'Campeão',
//                 firstPlace: '1° Lugar',
//                 secondPlace: '2° Lugar',
//                 viceChampion: 'Vice-Campeão - SkyGaming eSports',
//                 thirdPlace: '3° Lugar - Neox Team',
//                 description: `Você se consagrou Campeão do Campeonato Delta ${2024 + index}, demonstrando incrível habilidade e estratégia para vencer o torneio!`,
//                 iframeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // URL do iframe
//             };

//             openMedalModal(medalData);
//         });
//     });

//     // Fechar modal ao clicar fora
//     const modal = document.getElementById('medalModal');
//     if (modal) {
//         modal.addEventListener('click', (e) => {
//             if (e.target === modal) {
//                 closeMedalModal();
//             }
//         });
//     }

//     // Fechar modal com ESC
//     document.addEventListener('keydown', (e) => {
//         if (e.key === 'Escape') {
//             closeMedalModal();
//         }
//     });
// }


// ===== MAPEAMENTO DE IMAGENS DAS ARMAS =====
const weaponImages = {
    'AK-47': 'https://static.wikia.nocookie.net/cswikia/images/0/0c/CS2_AK-47_Inventory.png/revision/latest/scale-to-width-down/268?cb=20230928175330'
    // Mais armas serão adicionadas conforme você fornecer os links
};

// ===== TOGGLE FOLLOW =====
function toggleFollow() {
    const followBtn = document.getElementById('followBtn');
    const followBtnBanner = document.getElementById('followBtnBanner');
    const followersValue = document.getElementById('followersValue');

    isFollowing = !isFollowing;

    if (isFollowing) {
        if (followBtn) {
            followBtn.innerHTML = '<i class="fas fa-user-check"></i><span>Seguindo</span>';
            followBtn.classList.add('following');
        }
        if (followBtnBanner) {
            followBtnBanner.innerHTML = '<i class="fas fa-star"></i><span>SEGUINDO</span>';
        }
        if (followersValue) {
            followersValue.textContent = parseInt(followersValue.textContent) + 1;
        }
    } else {
        if (followBtn) {
            followBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Seguir</span>';
            followBtn.classList.remove('following');
        }
        if (followBtnBanner) {
            followBtnBanner.innerHTML = '<i class="fas fa-star"></i><span>SEGUIR</span>';
        }
        if (followersValue) {
            followersValue.textContent = parseInt(followersValue.textContent) - 1;
        }
    }
}

// ===== NAVEGAÇÃO DE CONTEÚDO =====
function showContent(contentType) {
    // Remove active de todas as tabs
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active de todos os painéis
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Adiciona active na tab e painel selecionados
    const tab = document.querySelector(`[data-content="${contentType}"]`);
    if (tab) {
        tab.classList.add('active');
    }

    // Mapeia contentType para o ID do painel
    const panelMap = {
        'stats': 'panelStats',
        'reels': 'panelReels',
        'followers': 'panelFollowers',
        'matches': 'panelMatches',
        'highlights': 'panelHighlights',
        'chat': 'panelChat'
    };

    const panelId = panelMap[contentType] || `panel${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('active');
    }
}

// ===== ALTERNAR ENTRE TABS DE ESTATÍSTICAS =====
function showStatsTab(tabType) {
    // Remove active de todas as tabs de estatísticas
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active de todos os painéis de estatísticas
    document.querySelectorAll('.stats-panel-content').forEach(panel => {
        panel.classList.remove('active');
    });

    // Adiciona active na tab selecionada
    const tab = document.querySelector(`[data-stats="${tabType}"]`);
    if (tab) {
        tab.classList.add('active');
    }

    // Adiciona active no painel correspondente
    const panelMap = {
        'desempenho': 'statsDesempenho',
        'armas': 'statsArmas'
    };

    const panelId = panelMap[tabType];
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
    }

    // Se for a aba de armas, ativar o dashboard automaticamente com filtro "Geral"
    if (tabType === 'armas') {
        // Garantir que o filtro seja "Geral" (all)
        window.currentWeaponsFilter = 'all';

        // Atualizar botão ativo para "Geral"
        document.querySelectorAll('.weapon-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const geralBtn = document.querySelector('[data-filter="all"]');
        if (geralBtn) {
            geralBtn.classList.add('active');
        }

        // Ativar o dashboard automaticamente (sempre visível)
        const dashboard = document.getElementById('weaponsDashboard');
        const container = document.getElementById('weaponsStatsContainer');

        if (dashboard && container) {
            dashboardActive = true;
            dashboard.style.display = 'block';
            container.style.display = 'none';

            // Renderizar gráficos com o filtro "Geral"
            setTimeout(() => {
                renderWeaponsChart();
                updateDashboardStats();
            }, 150);
        }
    }
}

// (código legado de carregamento mock de perfil removido - dados reais agora vêm da API em outras funções)

// ===== CRIAR ITEM DE EVENTO FUTURO =====
function createUpcomingEventItem(event) {
    const item = document.createElement('div');
    item.className = 'match-item upcoming-event';
    const eventName = event.name || event.eventName || 'Evento';
    const eventTime = event.time || '';
    const eventDate = event.date || '';
    const eventLocation = event.location || '';

    item.innerHTML = `
        <div class="match-header">
            <span class="match-date">${eventDate}${eventTime ? ' - ' + eventTime : ''}</span>
            <span class="match-status upcoming">Próximo</span>
        </div>
        <div class="match-teams">
            <div class="team-info">
                <img src="${event.team1.logo}" alt="${event.team1.name}" class="team-logo">
                <span class="team-name">${event.team1.name}</span>
            </div>
            <span class="vs-divider">VS</span>
            <div class="team-info">
                <span class="team-name">${event.team2.name}</span>
                <img src="${event.team2.logo}" alt="${event.team2.name}" class="team-logo">
            </div>
        </div>
        <div class="match-stats">
            <div class="stat-mini">
                <i class="fas fa-calendar-alt"></i>
                <span>${eventName}</span>
            </div>
            ${eventLocation ? `
            <div class="stat-mini">
                <i class="fas fa-map-marker-alt"></i>
                <span>${eventLocation}</span>
            </div>
            ` : ''}
        </div>
    `;
    return item;
}

// ===== ALTERNAR TIPO DE EVENTO =====
function showEventType(eventType) {
    // Remover active de todas as tabs
    document.querySelectorAll('.event-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Adicionar active na tab clicada
    const clickedTab = document.querySelector(`[data-event-type="${eventType}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }

    // Esconder todas as listas de eventos
    document.querySelectorAll('.events-list').forEach(list => {
        list.classList.remove('active');
    });

    // Mostrar a lista correspondente
    if (eventType === 'upcoming') {
        const upcomingList = document.getElementById('upcomingEventsList');
        if (upcomingList) {
            upcomingList.classList.add('active');
        }
    }
}

// ===== CRIAR CARDS DE EVENTOS =====

async function arrayCardEventos() {

    const timesInscritos = [];
    const arrayEventos = [];

    const auth_dados = await autenticacao();
    if (!auth_dados.logado) {
        return;
    }


    const dadosCard = await getCardDados();
    const userId = auth_dados.usuario.id;

    const dadosInscricoes = await buscarTimesInscritos(userId);
   
 
    for (const historico of dadosInscricoes.historico) {
        if (historico.usuario_id == userId) {
            
            for (const evento of dadosCard.inscricoes) {
                if (historico.campeonato_id == evento.id) {
                   
                    
                    const dataInscricao = await formatarDataBR(historico.data_criacao);
                    const dataInicio = await formatarDataBR(evento.previsao_data_inicio);
                    for(const hostorico of dadosInscricoes.historico){
                        if(hostorico.campeonato_id == evento.id){
                            timesInscritos.push(historico.time_id);
                        }
                    }
                    const uniqueList = [...new Set(timesInscritos)];
                    const TimesjaInscritos = uniqueList.length;
                   
    
                    const arrayEvento = {
                        id: evento.id,
                        nome: evento.titulo,
                        banner_url: evento.imagem_url,
                        // times_inscritos: evento.,
                        total_times: `${TimesjaInscritos}/${evento.qnt_times}`,
                        nivel: evento.nivel,
                        status: evento.status,
                        tipo: evento.tipo,
                        data_inicio: dataInicio,
                        data_inscricao: dataInscricao,
                        formato: evento.chave,
                        jogo: evento.game,
                        premiacao: evento.premiacao,
                    }
                    arrayEventos.push(arrayEvento);
                    
                    
                }
                
            }
        }
    }

    document.getElementById('matchesCount').textContent = arrayEventos.length;
    criarCardsEventos(arrayEventos)
        
    
}


async function criarCardsEventos(eventosArray) {
    const eventsList = document.getElementById('upcomingEventsList');
    if (!eventsList) return;

    // Limpar lista antes de adicionar novos cards
    eventsList.innerHTML = '';

    // Verificar se o array está vazio
    if (!eventosArray || eventosArray.length === 0) {
        eventsList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Nenhum evento disponível no momento.</p>
            </div>
        `;
        return;
    }

    // Criar cards usando forEach (com await para formatar datas)
    for (const evento of eventosArray) {
        
        const card = await criarCardEvento(evento);
        eventsList.appendChild(card);
    }
}

// ===== CRIAR CARD INDIVIDUAL DE EVENTO =====
let cont = 0;
async function criarCardEvento(evento) {
    cont+=1;

    
    const card = document.createElement('div');
    card.className = 'event-card';
    

    // Mapear status para classe CSS
    const statusClass = evento.status ? evento.status.toLowerCase().replace(/\s+/g, '') : 'disponivel';
    const tipoClass = evento.tipo ? evento.tipo.toLowerCase() : 'comum';

    // Formatar valores
    const timesFormatado = `${evento.total_times || 0}`;
    const nivelFormatado = evento.nivel ? `Nível ${evento.nivel}` : 'N/A';
    const statusTexto = evento.status || 'Disponível';
    const tipoTexto = evento.tipo === 'oficial' ? 'Oficial' : 'Comum';
    const formatoTexto = evento.formato || 'Chave';
    const jogoTexto = evento.jogo || 'CS2';
    const premiacaoTexto = evento.premiacao || 'R$ 0,00';

    // Formatar datas (await porque formatarDataBR é async)
    const dataInicio = evento.data_inicio || 'Não definida';
    const dataInscricao = evento.data_inscricao || 'Não definida';

    // URL do banner (usar imagem padrão se não houver)
    const bannerUrl = (evento.banner_url && evento.banner_url !== 'undefined') 
        ? evento.banner_url 
        : (evento.imagem && evento.imagem !== 'undefined') 
            ? evento.imagem 
            : '../img/banner.png';

    let color = '';
    


    if (statusTexto == 'disponivel'){
        color = 'background-color: rgba(40, 167, 69, 0.42);';

    }
    else if (statusTexto == 'em breve'){
        color = 'background-color: rgba(3, 115, 252, 0.42);';
        
 
    }
    else if (statusTexto == 'encerrado'){
        color = 'background-color: rgba(252, 3, 69, 0.42);';   

    }
    else if (statusTexto == 'finalizado'){
        color = 'background-color: rgba(252, 3, 3, 0.42);';
        
    }
    

    // Garantir que bannerUrl não seja undefined ou string 'undefined'
    const safeBannerUrl = (bannerUrl && bannerUrl !== 'undefined' && bannerUrl !== 'null') 
        ? bannerUrl 
        : '../img/banner.png';
    
    card.innerHTML = `
        <div class="event-card-banner" style="background-image: url('${safeBannerUrl}');">
            <div class="event-card-badges">
                <span style="${color}; color: #fff;  " class="event-badge status-${statusClass}">${statusTexto}</span>
                <span style="color: #fff;" class="event-badge tipo-${tipoClass}">${tipoTexto}</span>
                ${evento.nivel ? `<span style="color: #fff;" class="event-badge nivel">${nivelFormatado}</span>` : ''}
            </div>
        </div>
        
        <div class="event-card-content">
            <h3 class="event-card-title">${evento.nome || evento.titulo || 'Evento sem nome'}</h3>
            
            <div class="event-card-info">
                <div class="event-info-item">
                    <i class="fas fa-users"></i>
                    <span>
                        <span class="event-info-label">Times: </span>
                        <span class="event-info-value">${timesFormatado}</span>
                    </span>
                </div>
                
                <div class="event-info-item">
                    <i class="fas fa-signal"></i>
                    <span>
                        <span class="event-info-label">Nível: </span>
                        <span class="event-info-value">${nivelFormatado}</span>
                    </span>
                </div>
                
                <div class="event-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>
                        <span class="event-info-label">Início: </span>
                        <span class="event-info-value">${dataInicio}</span>
                    </span>
                </div>
                
                <div class="event-info-item">
                    <i class="fas fa-calendar-check"></i>
                    <span>
                        <span class="event-info-label">Inscrição: </span>
                        <span class="event-info-value">${dataInscricao}</span>
                    </span>
                </div>
                
                <div class="event-info-item">
                    <i class="fas fa-sitemap"></i>
                    <span>
                        <span class="event-info-label">Formato: </span>
                        <span class="event-info-value">${formatoTexto}</span>
                    </span>
                </div>
                
                <div class="event-info-item">
                    <i class="fas fa-gamepad"></i>
                    <span>
                        <span class="event-info-label">Jogo: </span>
                        <span class="event-info-value">${jogoTexto}</span>
                    </span>
                </div>
            </div>
            
            <div class="event-card-divider"></div>
            
            <div class="event-card-footer">
                <div class="event-premiacao">
                    <i class="fas fa-trophy"></i>
                    <span>R$ ${premiacaoTexto}</span>
                </div>
                <div class="event-jogo">
                    <i class="fas fa-gamepad"></i>
                    <span>${jogoTexto}</span>
                </div>
            </div>
            
            <div class="event-card-actions">
                ${evento.id ? `<a href="inscricao.html?id=${evento.id}" class="event-btn event-btn-ver">
                    <i class="fas fa-eye"></i>
                    <span>Ir para Evento</span>
                </a>
                <a href="chaveamento.html?id=${evento.id}" class="event-btn event-btn-chaveamento">
                    <i class="fas fa-sitemap"></i>
                    <span>Chaveamento</span>
                </a>` : '<span class="event-btn event-btn-disabled">ID do evento não disponível</span>'}
            </div>
        </div>
    `;
    const event = document.querySelector('.event-card');

    if (statusTexto == 'disponivel'){
        color = 'background-color: rgba(40, 167, 69, 0.42);';
        
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 15px 40px rgba(40, 167, 70, 0.93)';
        });
    
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
        });
    }
    else if (statusTexto == 'em breve'){
        color = 'background-color: rgba(3, 115, 252, 0.42);';
        
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 15px 40px rgba(3, 115, 252, 0.42)';
        });
    
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
        });
    }
    else if (statusTexto == 'encerrado'){
        color = 'background-color: rgba(252, 3, 69, 0.42);';
        
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 15px 40px rgba(252, 3, 69, 0.42)';
        });
    
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
        });
    }
    else if (statusTexto == 'finalizado'){
        color = 'background-color: rgba(252, 3, 3, 0.42);';
        
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 15px 40px rgba(252, 3, 3, 0.42)';
        });
    
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
        });
    }
    

    return card;
}

// ===== CRIAR ITEM DE PARTIDA =====
function createMatchItem(match) {
    const item = document.createElement('div');
    item.className = 'match-item';
    item.innerHTML = `
        <div class="match-header">
            <span class="match-date">${match.date}</span>
            <span class="match-status ${match.status}">${match.status === 'won' ? 'Vitória' : 'Derrota'}</span>
        </div>
        <div class="match-teams">
            <div class="team-info">
                <img src="${match.team1.logo}" alt="${match.team1.name}" class="team-logo">
                <span class="team-name">${match.team1.name}</span>
                <span class="team-score">${match.team1.score}</span>
            </div>
            <span class="vs-divider">VS</span>
            <div class="team-info">
                <span class="team-score">${match.team2.score}</span>
                <span class="team-name">${match.team2.name}</span>
                <img src="${match.team2.logo}" alt="${match.team2.name}" class="team-logo">
            </div>
        </div>
        <div class="match-stats">
            <div class="stat-mini">
                <i class="fas fa-crosshairs"></i>
                <span>${match.kd} K/D</span>
            </div>
            <div class="stat-mini">
                <i class="fas fa-skull"></i>
                <span>${match.kills} Kills</span>
            </div>
        </div>
    `;
    return item;
}

// ===== CRIAR ITEM DE REEL =====
function createReelItem(reel) {
    const item = document.createElement('div');
    item.className = 'reel-item';
    item.innerHTML = `
        <div class="reel-thumbnail">
            <img src="${reel.thumbnail}" alt="${reel.title}" class="reel-img">
            <div class="reel-overlay">
                <i class="fas fa-play"></i>
                <span class="reel-duration">${reel.duration}</span>
            </div>
        </div>
        <div class="reel-info">
            <h4 class="reel-title">${reel.title}</h4>
            <div class="reel-stats">
                <span><i class="fas fa-eye"></i> ${formatNumber(reel.views)}</span>
                <span><i class="fas fa-heart"></i> ${reel.likes}</span>
            </div>
        </div>
    `;
    return item;
}

// ===== ADICIONAR VÍDEO =====
async function adicionarVideo() {
    // Criar input file oculto
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'video/*'; // Aceitar apenas arquivos de vídeo
    inputFile.style.display = 'none';
    
    // Adicionar evento de mudança para quando o arquivo for selecionado
    inputFile.addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validar se é um arquivo de vídeo
            if (!file.type.startsWith('video/')) {
                showNotification('error', 'Por favor, selecione um arquivo de vídeo válido');
                document.body.removeChild(inputFile);
                return;
            }
            
            // Validar tamanho do arquivo (máximo 500MB)
            const maxSize = 500 * 1024 * 1024; // 500MB em bytes
            if (file.size > maxSize) {
                showNotification('error', 'O arquivo é muito grande. Tamanho máximo: 500MB');
                document.body.removeChild(inputFile);
                return;
            }
            
            // Mostrar notificação de upload em progresso
            showNotification('info', 'Fazendo upload do vídeo... Aguarde!', 1500);
            
            try {
                // Criar FormData para enviar o arquivo
                const formData = new FormData();
                formData.append('file', file);
                
                // Fazer upload para o servidor
                const response = await fetch(`${API_URL}/cloudinary/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao fazer upload do vídeo');
                }
                
                const data = await response.json();
                
                // Upload bem-sucedido
                showNotification('success', `Vídeo "${file.name}" enviado com sucesso!`);
                
                

                return adicionarVideoUser(data.secure_url);
                
                // TODO: Aqui você pode adicionar o vídeo à lista de reels
                // Por exemplo: adicionarReelToList(data.secure_url, file.name);
                
            } catch (error) {
                console.error('Erro ao fazer upload do vídeo:', error);
                showNotification('error', error.message || 'Erro ao fazer upload do vídeo. Tente novamente.');
            }
        }
        
        // Remover o input após o uso
        if (document.body.contains(inputFile)) {
            document.body.removeChild(inputFile);
        }
    });
    
    // Adicionar o input ao body e acionar o clique
    document.body.appendChild(inputFile);
    inputFile.click();
}

async function adicionarVideoUser(link_video){
    try {
        const auth_dados = await autenticacao();
        
        if (!auth_dados.logado) {
            showNotification('error', 'Você precisa estar logado para adicionar vídeos');
            return;
        }
        
        // const userID = auth_dados.usuario.id;
        params = new URLSearchParams(window.location.search);
        const userId= params.get('id');
        
        // Buscar destaques atuais do perfil
        const { perfilData } = await buscarDadosPerfil(userId);
        
        // Obter array de destaques existentes
        let destaquesAtuais = [];
        if (perfilData && perfilData.destaques && perfilData.destaques.length > 0) {
            destaquesAtuais = perfilData.destaques.map(d => d.video_url);
        }
        
        // Adicionar o novo vídeo ao array
        destaquesAtuais.push(link_video);

        const response = await fetch(`${API_URL}/configuracoes/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ destaques: destaquesAtuais }) // Enviar array completo
        });

        const data = await response.json();

        if(response.ok){
            showNotification('success', data.message || 'Vídeo adicionado com sucesso');
            // Recarregar a página após 1.5 segundos
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
        else{
            showNotification('error', data.error || data.message || 'Erro ao adicionar vídeo aos destaques');
        }

    }
    catch(error){
        console.error('Erro ao adicionar Video ao usuario:', error);
        showNotification('error', 'Erro ao adicionar vídeo aos destaques');
    }
}



// ===== CRIAR ITEM DE SEGUIDOR =====
function createFollowerItem(follower) {
    const item = document.createElement('div');
    item.className = 'follower-item';
    item.innerHTML = `
        <div class="follower-avatar-container">
            <img src="${follower.avatar}" alt="${follower.username}" class="follower-avatar">
            ${follower.verified ? '<i class="fas fa-check-circle follower-verified"></i>' : ''}
        </div>
        <div class="follower-info">
            <h4 class="follower-username">${follower.username}</h4>
            <p class="follower-team">${follower.team}</p>
        </div>
        <button class="follower-action-btn ${follower.isFollowing ? 'following' : ''}" onclick="toggleFollowFollower(this, '${follower.username}')">
            ${follower.isFollowing ? '<i class="fas fa-check"></i> Seguindo' : '<i class="fas fa-user-plus"></i> Seguir'}
        </button>
    `;
    return item;
}

// ===== TOGGLE FOLLOW SEGUIDOR =====
function toggleFollowFollower(button, username) {
    const isFollowing = button.classList.contains('following');
    if (isFollowing) {
        button.classList.remove('following');
        button.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
    } else {
        button.classList.add('following');
        button.innerHTML = '<i class="fas fa-check"></i> Seguindo';
    }
}

// Dashboard sempre ativo - função toggleDashboard removida

// ===== ATUALIZAR ESTATÍSTICAS DO DASHBOARD =====
function updateDashboardStats() {
    // Usar dados de armas da variável global
    const currentWeaponsData = weaponsData || {};

    // Se não houver dados, definir valores padrão
    if (!currentWeaponsData || Object.keys(currentWeaponsData).length === 0) {
        const totalKillsEl = document.getElementById('dashboardTotalKills');
        const topWeaponEl = document.getElementById('dashboardTopWeapon');
        const avgKillsEl = document.getElementById('dashboardAvgKills');
        const topCategoryEl = document.getElementById('dashboardTopCategory');
        
        if (totalKillsEl) totalKillsEl.textContent = '0';
        if (topWeaponEl) topWeaponEl.textContent = '-';
        if (avgKillsEl) avgKillsEl.textContent = '0';
        if (topCategoryEl) topCategoryEl.textContent = '-';
        return;
    }

    // Calcular total de kills
    let totalKills = 0;
    const allWeapons = [];
    const allKills = [];
    const activeFilter = window.currentWeaponsFilter || 'all';

    Object.entries(currentWeaponsData).forEach(([categoryKey, category]) => {
        if (activeFilter !== 'all' && categoryKey !== activeFilter) {
            return;
        }
        Object.entries(category).forEach(([weaponName, kills]) => {
            totalKills += kills;
            allWeapons.push(weaponName);
            allKills.push(kills);
        });
    });

    // Encontrar arma mais usada
    const sortedData = allWeapons.map((weapon, index) => ({
        weapon,
        kills: allKills[index]
    })).sort((a, b) => b.kills - a.kills);

    const topWeapon = sortedData.length > 0 ? sortedData[0].weapon : '-';
    const avgKills = allWeapons.length > 0 ? Math.round(totalKills / allWeapons.length) : 0;

    // Encontrar categoria favorita
    const categoryTotals = {};
    Object.entries(currentWeaponsData).forEach(([categoryKey, weapons]) => {
        let categoryTotal = 0;
        Object.values(weapons).forEach(kills => {
            categoryTotal += kills;
        });
        categoryTotals[categoryKey] = categoryTotal;
    });

    const categoryNames = {
        'rifles': 'Rifles',
        'snipers': 'Snipers',
        'pistolas': 'Pistolas',
        'smgs': 'SMGs',
        'escopetas': 'Escopetas',
        'metralhadoras': 'Metralhadoras',
        'utilitarios': 'Utilitários'
    };

    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];
    const topCategoryName = topCategory ? categoryNames[topCategory[0]] || '-' : '-';

    // Atualizar elementos
    const totalKillsEl = document.getElementById('dashboardTotalKills');
    if (totalKillsEl) totalKillsEl.textContent = totalKills.toLocaleString();

    const topWeaponEl = document.getElementById('dashboardTopWeapon');
    if (topWeaponEl) topWeaponEl.textContent = topWeapon;

    const avgKillsEl = document.getElementById('dashboardAvgKills');
    if (avgKillsEl) avgKillsEl.textContent = avgKills;

    const topCategoryEl = document.getElementById('dashboardTopCategory');
    if (topCategoryEl) topCategoryEl.textContent = topCategoryName;
}

// ===== RENDERIZAR LISTA TOP 10 ARMAS =====
function renderTopWeaponsList() {
    const topWeaponsList = document.getElementById('topWeaponsList');
    if (!topWeaponsList) return;

    // Usar dados de armas da variável global
    const currentWeaponsData = weaponsData || {};

    // Se não houver dados, mostrar mensagem
    if (!currentWeaponsData || Object.keys(currentWeaponsData).length === 0) {
        topWeaponsList.innerHTML = '<p class="no-data-message" style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 20px;">Nenhuma estatística de armas disponível.</p>';
        return;
    }

    // Preparar dados
    const allWeapons = [];
    const allKills = [];
    const activeFilter = window.currentWeaponsFilter || 'all';

    // Mapeamento de categorias para nomes
    const categoryNames = {
        'rifles': 'Rifle',
        'snipers': 'Sniper',
        'pistolas': 'Pistola',
        'smgs': 'SMG',
        'escopetas': 'Escopeta',
        'metralhadoras': 'Metralhadora',
        'utilitarios': 'Utilitário'
    };

    Object.entries(currentWeaponsData).forEach(([categoryKey, category]) => {
        // Se houver filtro, considerar apenas a categoria selecionada
        if (activeFilter !== 'all' && categoryKey !== activeFilter) {
            return;
        }
        Object.entries(category).forEach(([weaponName, kills]) => {
            allWeapons.push({
                name: weaponName,
                kills: kills,
                category: categoryKey
            });
            allKills.push(kills);
        });
    });

    // Ordenar por kills (maior para menor)
    const sortedData = allWeapons.sort((a, b) => b.kills - a.kills);

    // Se for "all", mostrar todas as armas, senão limitar a top 10
    const displayData = activeFilter === 'all' ? sortedData : sortedData.slice(0, 10);

    // Limpar lista anterior
    topWeaponsList.innerHTML = '';

    // Se for uma categoria específica (não "all"), mostrar cards
    if (activeFilter !== 'all') {
        // Verificar se há dados para exibir
        if (displayData.length === 0) {
            topWeaponsList.innerHTML = '<p class="no-data-message" style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 20px;">Nenhuma arma encontrada para esta categoria.</p>';
            return;
        }

        displayData.forEach((item, index) => {
            const weaponCard = document.createElement('div');
            weaponCard.className = 'weapon-card';
            const weaponImage = weaponImages[item.name] || '';
            const isBest = index === 0;

            weaponCard.innerHTML = `
                <div class="weapon-card-image">
                    ${weaponImage ? `<img src="${weaponImage}" alt="${item.name}" class="weapon-card-img" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'weapon-card-placeholder\\'></div>';" loading="lazy">` : '<div class="weapon-card-placeholder"></div>'}
                    ${isBest ? '<div class="weapon-card-badge">🏆</div>' : ''}
                </div>
                <div class="weapon-card-content">
                    <h4 class="weapon-card-name">${item.name}</h4>
                    <div class="weapon-card-kills">
                        <i class="fas fa-skull"></i>
                        <span>${item.kills.toLocaleString()} kills</span>
                    </div>
                </div>
            `;

            if (isBest) {
                weaponCard.classList.add('best-weapon-card');
            }

            topWeaponsList.appendChild(weaponCard);
        });
    } else {
        // Se for "all", mostrar lista simples
        displayData.forEach((item, index) => {
            const weaponItem = document.createElement('div');
            weaponItem.className = 'top-weapon-item';
            const weaponImage = weaponImages[item.name] || '';
            const isBest = index === 0;

            weaponItem.innerHTML = `
                <div class="top-weapon-rank">#${index + 1}</div>
                <div class="top-weapon-info">
                    ${weaponImage ? `<img src="${weaponImage}" alt="${item.name}" class="top-weapon-image" onerror="this.onerror=null; this.style.display='none';" loading="lazy">` : '<div class="top-weapon-placeholder"></div>'}
                    <span class="top-weapon-name">${item.name}</span>
                </div>
                <div class="top-weapon-kills">
                    <span class="kills-value">${item.kills.toLocaleString()}</span>
                    <span class="kills-label">kills</span>
                </div>
            `;

            if (isBest) {
                weaponItem.classList.add('best-weapon');
            }

            topWeaponsList.appendChild(weaponItem);
        });
    }
}

// ===== RENDERIZAR GRÁFICOS DO DASHBOARD =====
function renderWeaponsChart() {
    // Renderizar lista de top 10 armas
    renderTopWeaponsList();

    const categoryCanvas = document.getElementById('categoryChart');
    if (!categoryCanvas) return;

    // Destruir gráfico de pizza anterior se existir
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }

    // Usar dados de armas da variável global
    const currentWeaponsData = weaponsData || {};

    const activeFilter = window.currentWeaponsFilter || 'all';

    // Preparar dados para o gráfico de pizza - distribuição das armas dentro da categoria
    const categoryLabels = [];
    const categoryKills = [];
    const categoryColors = [
        'rgba(255, 107, 53, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 140, 90, 0.8)',
        'rgba(255, 180, 120, 0.8)',
        'rgba(200, 100, 200, 0.8)'
    ];

    // Se houver filtro específico, mostrar distribuição das armas daquela categoria
    if (activeFilter && activeFilter !== 'all' && currentWeaponsData[activeFilter]) {
        Object.entries(currentWeaponsData[activeFilter]).forEach(([weaponName, kills], index) => {
            categoryLabels.push(weaponName);
            categoryKills.push(kills);
        });
    } else {
        // Se for "all", mostrar distribuição por categoria
        const categoryNamesMap = {
            'rifles': 'Rifles',
            'snipers': 'Snipers',
            'pistolas': 'Pistolas',
            'smgs': 'SMGs',
            'escopetas': 'Escopetas',
            'metralhadoras': 'Metralhadoras',
            'utilitarios': 'Utilitários'
        };

        Object.entries(currentWeaponsData).forEach(([categoryKey, weapons], index) => {
            let categoryTotal = 0;
            Object.values(weapons).forEach(kills => {
                categoryTotal += kills;
            });
            if (categoryTotal > 0) {
                categoryLabels.push(categoryNamesMap[categoryKey] || categoryKey);
                categoryKills.push(categoryTotal);
            }
        });
    }

    // Obter nome da categoria para o título
    const categoryNames = {
        'all': 'Geral',
        'rifles': 'Rifles',
        'snipers': 'Snipers',
        'pistolas': 'Pistolas',
        'smgs': 'SMGs',
        'escopetas': 'Escopetas',
        'metralhadoras': 'Metralhadoras',
        'utilitarios': 'Utilitários'
    };
    const categoryTitle = categoryNames[activeFilter] || 'Armas';

    // Gráfico de Pizza - Distribuição das Armas
    const categoryCtx = categoryCanvas.getContext('2d');
    const chartTitle = activeFilter && activeFilter !== 'all'
        ? `Distribuição de ${categoryTitle}`
        : activeFilter === 'all'
            ? 'Distribuição Geral de Armas'
            : 'Distribuição por Categoria';

    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryKills,
                backgroundColor: categoryColors.slice(0, categoryLabels.length),
                borderColor: 'rgba(15, 15, 25, 0.8)',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    color: '#ff6b35',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ff6b35',
                    bodyColor: '#ffffff',
                    borderColor: '#ff6b35',
                    borderWidth: 2,
                    padding: 15,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== FILTRAR ARMAS POR CATEGORIA =====
function filterWeapons(category) {
    // Atualizar botões ativos
    document.querySelectorAll('.weapon-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-filter="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Atualizar gráficos do dashboard com base no filtro
    // Dashboard sempre ativo (sem botão)
    const dashboard = document.getElementById('weaponsDashboard');
    const container = document.getElementById('weaponsStatsContainer');

    if (dashboard && container) {
        dashboardActive = true;
        dashboard.style.display = 'block';
        container.style.display = 'none';
    }

    // Guardar filtro atual em uma variável global
    window.currentWeaponsFilter = category;

    // Re-renderizar lista e gráficos com o filtro aplicado
    setTimeout(() => {
        renderWeaponsChart();
        updateDashboardStats();
    }, 50);
}

// ===== CARREGAR ESTATÍSTICAS DE ARMAS =====
function loadWeaponsStats(weaponsData) {
    const container = document.getElementById('weaponsStatsContainer');
    if (!container) return;

    container.innerHTML = '';

    const categories = [
        { name: 'Rifles', icon: '🔫', key: 'rifles' },
        { name: 'Snipers', icon: '🎯', key: 'snipers' },
        { name: 'Pistolas', icon: '🔫', key: 'pistolas' },
        { name: 'Submetralhadoras (SMGs)', icon: '🔫', key: 'smgs' },
        { name: 'Escopetas', icon: '💥', key: 'escopetas' },
        { name: 'Metralhadoras Pesadas', icon: '🔫', key: 'metralhadoras' },
        { name: 'Utilitários / Especiais', icon: '🧨', key: 'utilitarios' }
    ];

    categories.forEach(category => {
        const categoryData = weaponsData[category.key] || {};
        if (Object.keys(categoryData).length === 0) return;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'weapon-category';
        categoryDiv.setAttribute('data-category', category.key);

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'weapon-category-header';
        categoryHeader.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <h3 class="category-title">${category.name}</h3>
        `;
        categoryDiv.appendChild(categoryHeader);

        const weaponsList = document.createElement('div');
        weaponsList.className = 'weapons-list';

        Object.entries(categoryData).forEach(([weaponName, kills]) => {
            const weaponItem = document.createElement('div');
            weaponItem.className = 'weapon-item';
            const weaponImage = weaponImages[weaponName] || '';
            weaponItem.innerHTML = `
                <div class="weapon-info">
                    ${weaponImage ? `<img src="${weaponImage}" alt="${weaponName}" class="weapon-image" onerror="this.style.display='none';" loading="lazy">` : ''}
                    <span class="weapon-name">${weaponName}</span>
                </div>
                <span class="weapon-kills">${kills}</span>
            `;
            weaponsList.appendChild(weaponItem);
        });

        categoryDiv.appendChild(weaponsList);
        container.appendChild(categoryDiv);
    });
}

// ===== FORMATAR NÚMEROS =====
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar filtro de armas como "Geral" (all)
    window.currentWeaponsFilter = 'all';

    // Inicializar animação de medalhas quando a página carregar
    // Tentar múltiplas vezes para garantir que os elementos estejam prontos
    setTimeout(() => {
        initMedalsAnimation();
        // Inicializar carrossel após animação
        setTimeout(() => {
            initMedalsCarousel();
            // Adicionar event listeners para abrir modal ao clicar nas medalhas
            // initMedalClickHandlers();
        }, 1500);
    }, 300);

    // Backup: tentar novamente após mais tempo
    setTimeout(() => {
        const medalSlots = document.querySelectorAll('.medalha-slot');
        if (medalSlots.length > 0 && !medalSlots[0].classList.contains('animate-in')) {
            initMedalsAnimation();
            setTimeout(() => {
                initMedalsCarousel();
            }, 1500);
        }
    }, 1000);

    // Aguardar um pouco para garantir que o DOM está totalmente renderizado
    setTimeout(function () {
        // ===== CONTROLE DO MENU COM AÇÕES EM CASCATA =====
        const cardMenuContainer = document.querySelector('.card-menu-container');
        const cardActionsCascade = document.getElementById('cardActionsCascade');
        const cardMenuBtn = document.getElementById('cardMenuBtn');

        if (cardMenuContainer && cardActionsCascade && cardMenuBtn) {
            let menuTimeout;
            let isHovering = false;

            // Função para abrir o menu
            function openMenu() {
                clearTimeout(menuTimeout);
                isHovering = true;
                cardActionsCascade.classList.add('menu-open');
                cardActionsCascade.style.display = 'flex';
                cardActionsCascade.style.opacity = '1';
                cardActionsCascade.style.visibility = 'visible';
                cardActionsCascade.style.transform = 'translateX(0)';
                cardActionsCascade.style.pointerEvents = 'auto';
            }

            // Função para fechar o menu
            function closeMenu() {
                isHovering = false;
                menuTimeout = setTimeout(function () {
                    if (!isHovering) {
                        cardActionsCascade.classList.remove('menu-open');
                        cardActionsCascade.style.opacity = '0';
                        cardActionsCascade.style.visibility = 'hidden';
                        cardActionsCascade.style.transform = 'translateX(20px)';
                        cardActionsCascade.style.pointerEvents = 'none';
                    }
                }, 300);
            }

            // Abrir menu quando mouse entra APENAS no botão do menu (não no container inteiro)
            cardMenuBtn.addEventListener('mouseenter', function (e) {
                openMenu();
            });

            // Manter menu aberto quando mouse entra nos botões de ação
            cardActionsCascade.addEventListener('mouseenter', function (e) {
                clearTimeout(menuTimeout);
                isHovering = true;
                openMenu();
            });

            // Manter menu aberto quando mouse está sobre os botões de ação individuais
            const actionButtons = cardActionsCascade.querySelectorAll('.card-action-btn');
            actionButtons.forEach(function (btn) {
                btn.addEventListener('mouseenter', function (e) {
                    clearTimeout(menuTimeout);
                    isHovering = true;
                    openMenu();
                });

                btn.addEventListener('mouseleave', function (e) {
                    // Não fechar imediatamente, dar tempo para mover o mouse
                    setTimeout(function () {
                        if (!cardActionsCascade.matches(':hover') && !cardMenuBtn.matches(':hover')) {
                            closeMenu();
                        }
                    }, 100);
                });
            });

            // Fechar menu quando mouse sai do botão do menu
            cardMenuBtn.addEventListener('mouseleave', function (e) {
                // Verificar se o mouse não está indo para os botões de ação
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && !cardActionsCascade.contains(relatedTarget)) {
                    closeMenu();
                }
            });

            // Fechar menu quando mouse sai dos botões de ação
            cardActionsCascade.addEventListener('mouseleave', function (e) {
                const relatedTarget = e.relatedTarget;
                // Verificar se o mouse não está indo para o botão do menu
                if (relatedTarget && !cardMenuBtn.contains(relatedTarget) && relatedTarget !== cardMenuBtn) {
                    closeMenu();
                }
            });
        }
    }, 100);

    // Animação de entrada dos elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    document.querySelectorAll('.match-item, .reel-item, .highlight-item, .sidebar-section').forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
});




// ===== VARIÁVEIS GLOBAIS DO CARROSSEL =====
let currentMedalIndex = 0; // Índice da primeira medalha visível
let visibleMedalsCount = 6; // Número de medalhas visíveis
let totalMedals = 0;

// ===== INICIALIZAR CARROSSEL DE MEDALHAS =====
function initMedalsCarousel() {
    const medalsContainer = document.getElementById('medalsContainer');
    const prevBtn = document.getElementById('medalCarouselPrev');
    const nextBtn = document.getElementById('medalCarouselNext');

    if (!medalsContainer || !prevBtn || !nextBtn) return;

    const medalSlots = medalsContainer.querySelectorAll('.medalha-slot');
    totalMedals = medalSlots.length;

    // Se houver mais de 6 medalhas, ativar carrossel
    if (totalMedals > 6) {
        medalsContainer.classList.add('carousel-active');
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';

        currentMedalIndex = 0;

        // Mostrar apenas as primeiras 7 medalhas
        updateVisibleMedals();

        // Event listeners para os botões
        prevBtn.addEventListener('click', () => {
            if (currentMedalIndex > 0) {
                currentMedalIndex--;
                updateVisibleMedals();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentMedalIndex < totalMedals - visibleMedalsCount) {
                currentMedalIndex++;
                updateVisibleMedals();
            }
        });

    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

// ===== ATUALIZAR MEDALHAS VISÍVEIS (DESLIZAMENTO CONTÍNUO) =====
function updateVisibleMedals() {
    const medalsContainer = document.getElementById('medalsContainer');
    if (!medalsContainer) return;

    const medalSlots = medalsContainer.querySelectorAll('.medalha-slot');
    const endIndex = currentMedalIndex + visibleMedalsCount;

    // Identificar qual medalha está entrando (nova da direita) - sempre a última posição (6)
    const enteringIndex = endIndex - 1;
    const isEntering = enteringIndex < totalMedals && medalSlots[enteringIndex] && medalSlots[enteringIndex].classList.contains('hidden');

    // Identificar qual medalha está saindo (primeira da esquerda) - sempre a posição 0
    const leavingIndex = currentMedalIndex;
    const isLeaving = leavingIndex >= 0 && medalSlots[leavingIndex] && !medalSlots[leavingIndex].classList.contains('hidden');

    medalSlots.forEach((slot, index) => {
        if (index >= currentMedalIndex && index < endIndex) {
            // Medalha deve estar visível
            const positionInView = index - currentMedalIndex;

            if (slot.classList.contains('hidden')) {
                // Esta é uma medalha nova que está entrando
                slot.classList.remove('hidden');
                slot.style.display = 'flex';

                // Animar entrada da nova medalha pela direita na posição correta do leque
                animateMedalEntry(slot, positionInView);
            } else {
                // Medalha já estava visível, apenas atualizar posição
                updateMedalPosition(slot, positionInView);
            }
        } else {
            // Medalha deve estar escondida
            if (!slot.classList.contains('hidden')) {
                // Esta é uma medalha que está saindo
                animateMedalExit(slot, () => {
                    slot.classList.add('hidden');
                    slot.style.display = 'none';
                });
            } else {
                slot.classList.add('hidden');
                slot.style.display = 'none';
            }
        }
    });

    // Atualizar estado dos botões
    const prevBtn = document.getElementById('medalCarouselPrev');
    const nextBtn = document.getElementById('medalCarouselNext');

    if (prevBtn) {
        prevBtn.style.opacity = currentMedalIndex === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = currentMedalIndex === 0 ? 'none' : 'auto';
    }

    if (nextBtn) {
        nextBtn.style.opacity = currentMedalIndex >= totalMedals - visibleMedalsCount ? '0.5' : '1';
        nextBtn.style.pointerEvents = currentMedalIndex >= totalMedals - visibleMedalsCount ? 'none' : 'auto';
    }
}

// ===== ANIMAR ENTRADA DE MEDALHA PELA DIREITA =====
function animateMedalEntry(slot, positionInView) {
    const finalX = getMedalFinalX(positionInView);
    const finalZ = getMedalFinalZ(positionInView);
    const finalRotation = getMedalFinalRotation(positionInView);
    const finalOpacity = getMedalFinalOpacity(positionInView);

    // Começar fora da tela à direita
    slot.style.setProperty('--start-x', '600px');
    slot.style.setProperty('--start-rotation', '720deg');
    slot.style.setProperty('--final-x', `${finalX}px`);
    slot.style.setProperty('--final-z', `${finalZ}px`);
    slot.style.setProperty('--final-rotation', `${finalRotation}deg`);
    slot.style.setProperty('--final-opacity', finalOpacity);

    slot.style.transform = `translateX(-50%) translateX(600px) translateY(0) translateZ(0) rotateZ(720deg) scale(0.5)`;
    slot.style.opacity = '0';
    slot.style.visibility = 'visible';

    // Animar entrada
    setTimeout(() => {
        slot.classList.add('animate-in');
        setTimeout(() => {
            slot.classList.add('animation-complete');
        }, 1000);
    }, positionInView * 50);
}

// ===== ANIMAR SAÍDA DE MEDALHA PELA ESQUERDA =====
function animateMedalExit(slot, callback) {
    slot.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    slot.style.transform = `translateX(-50%) translateX(-600px) translateY(0) translateZ(0) rotateZ(-720deg) scale(0.5)`;
    slot.style.opacity = '0';

    setTimeout(() => {
        if (callback) callback();
    }, 500);
}

// ===== ATUALIZAR POSIÇÃO DE MEDALHA EXISTENTE =====
function updateMedalPosition(slot, positionInView) {
    const finalX = getMedalFinalX(positionInView);
    const finalZ = getMedalFinalZ(positionInView);
    const finalRotation = getMedalFinalRotation(positionInView);
    const finalOpacity = getMedalFinalOpacity(positionInView);

    slot.style.setProperty('--final-x', `${finalX}px`);
    slot.style.setProperty('--final-z', `${finalZ}px`);
    slot.style.setProperty('--final-rotation', `${finalRotation}deg`);
    slot.style.setProperty('--final-opacity', finalOpacity);

    // Atualizar transform suavemente
    slot.style.transition = 'transform 0.5s ease';
    slot.style.transform = `translateX(-50%) translateX(${finalX}px) translateY(0) translateZ(${finalZ}px) rotateZ(${finalRotation}deg) scale(1)`;
    slot.style.opacity = finalOpacity;
}

// Funções auxiliares para obter posições finais
function getMedalFinalX(positionInPage) {
    if (positionInPage === 0) return 0;
    if (positionInPage === 1) return -155;
    if (positionInPage === 2) return -310;
    if (positionInPage === 3) return 155;
    if (positionInPage === 4) return 310;
    if (positionInPage === 5) return -465;
    if (positionInPage === 6) return 465;
    return 0;
}

function getMedalFinalZ(positionInPage) {
    if (positionInPage === 0) return 0;
    if (positionInPage === 1 || positionInPage === 3) return -12;
    if (positionInPage === 2 || positionInPage === 4) return -20;
    if (positionInPage === 5 || positionInPage === 6) return -28;
    return 0;
}

function getMedalFinalRotation(positionInPage) {
    if (positionInPage === 0) return 0;
    if (positionInPage === 1) return -8;
    if (positionInPage === 2) return -12;
    if (positionInPage === 3) return 8;
    if (positionInPage === 4) return 12;
    if (positionInPage === 5) return -16;
    if (positionInPage === 6) return 16;
    return 0;
}

function getMedalFinalOpacity(positionInPage) {
    if (positionInPage === 0) return 1;
    if (positionInPage === 1 || positionInPage === 3) return 0.75;
    if (positionInPage === 2 || positionInPage === 4) return 0.6;
    if (positionInPage === 5 || positionInPage === 6) return 0.5;
    return 1;
}

// ===== ANIMAÇÃO DE ENTRADA DAS MEDALHAS =====
function initMedalsAnimation() {
    const medalsSection = document.querySelector('.medals-main-section');
    if (!medalsSection) {
        return;
    }

    const medalsContainer = document.getElementById('medalsContainer');

    // Se o container tem classe all-empty, não animar (slots vazios ficam estáticos)
    if (medalsContainer && medalsContainer.classList.contains('all-empty')) {
        return;
    }

    // Pegar apenas os slots VISÍVEIS (que não estão escondidos)
    // Incluir slots vazios quando não há medalhas (eles têm classe 'empty' mas devem ser animados)
    const allSlots = document.querySelectorAll('.medalha-slot');
    const visibleSlots = Array.from(allSlots).filter(slot => {
        const isHidden = slot.style.display === 'none' ||
            slot.classList.contains('hidden');
        return !isHidden;
    });

    if (visibleSlots.length === 0) {
        return;
    }

    const totalVisible = visibleSlots.length;
    const maxVisible = Math.min(totalVisible, 7); // Limitar a 7 para primeira página

    // Configurar animação para cada medalha VISÍVEL
    // Usar índice relativo (0, 1, 2...) baseado nas medalhas visíveis
    visibleSlots.forEach((slot, relativeIndex) => {
        // Limitar a 7 medalhas visíveis na primeira página
        if (relativeIndex >= maxVisible) {
            return;
        }
        // Definir variáveis CSS para posição inicial e final
        let startX = -600;
        let startRotation = 720;
        let finalX = 0;
        let finalZ = 0;
        let finalRotation = 0;
        let finalOpacity = 1;

        // Posições finais baseadas no índice RELATIVO das medalhas visíveis
        // Padrão: centro, depois alterna esquerda/direita
        if (relativeIndex === 0) {
            // Primeira medalha: Centro (vem da esquerda)
            startX = -600;
            finalX = 0;
            finalZ = 0;
            finalRotation = 0;
            finalOpacity = 1;
        } else if (relativeIndex === 1) {
            // Segunda medalha: Esquerda (vem da esquerda)
            startX = -600;
            finalX = -155;
            finalZ = -12;
            finalRotation = -8;
            finalOpacity = 0.75;
        } else if (relativeIndex === 2) {
            // Terceira medalha: Direita (vem da direita)
            startX = 600;
            finalX = 155;
            finalZ = -12;
            finalRotation = 8;
            finalOpacity = 0.75;
        } else if (relativeIndex === 3) {
            // Quarta medalha: Esquerda 2 (vem da esquerda)
            startX = -600;
            finalX = -310;
            finalZ = -20;
            finalRotation = -12;
            finalOpacity = 0.6;
        } else if (relativeIndex === 4) {
            // Quinta medalha: Direita 2 (vem da direita)
            startX = 600;
            finalX = 310;
            finalZ = -20;
            finalRotation = 12;
            finalOpacity = 0.6;
        } else if (relativeIndex === 5) {
            // Sexta medalha: Esquerda 3 (vem da esquerda)
            startX = -600;
            finalX = -465;
            finalZ = -28;
            finalRotation = -16;
            finalOpacity = 0.5;
        } else {
            // Para carrossel (mais de 6 medalhas) - posição será calculada dinamicamente
            startX = relativeIndex % 2 === 0 ? -600 : 600;
            finalX = 0;
            finalZ = 0;
            finalRotation = 0;
            finalOpacity = 1;
        }

        // Aplicar variáveis CSS para a animação
        slot.style.setProperty('--start-x', `${startX}px`);
        slot.style.setProperty('--start-rotation', `${startRotation}deg`);
        slot.style.setProperty('--final-x', `${finalX}px`);
        slot.style.setProperty('--final-z', `${finalZ}px`);
        slot.style.setProperty('--final-rotation', `${finalRotation}deg`);
        slot.style.setProperty('--final-opacity', finalOpacity);

        // Aplicar estado inicial antes da animação (fora da tela)
        slot.style.transform = `translateX(-50%) translateX(${startX}px) translateY(0) translateZ(0) rotateZ(${startRotation}deg) scale(0.5)`;
        slot.style.opacity = '0';
        slot.style.visibility = 'hidden';

        // Aplicar animação com delay em cascata
        setTimeout(() => {
            slot.style.visibility = 'visible';
            slot.classList.add('animate-in');

            // Marcar como completa após a animação
            setTimeout(() => {
                slot.classList.add('animation-complete');
            }, 1000);
        }, relativeIndex * 100); // Delay de 100ms entre cada medalha (baseado no índice relativo)
    });

}

// =================================
// ========= MENU HAMBÚRGUER =========
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileNavMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const body = document.body;

    if (hamburger && mobileMenu && overlay) {
        const isOpen = !mobileMenu.classList.contains('active');
        hamburger.classList.toggle('active', isOpen);
        mobileMenu.classList.toggle('active', isOpen);
        overlay.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
        document.documentElement.style.overflow = isOpen ? 'hidden' : '';
        body.style.overflow = isOpen ? 'hidden' : '';
    }
}

// Fechar menu ao clicar fora
document.addEventListener('click', function(event) {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileNavMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        if (!mobileMenu.contains(event.target) && 
            !hamburger.contains(event.target) && 
            overlay.contains(event.target)) {
            toggleMobileMenu();
        }
    }
});

// =================================
// ========= SWIPE DE MEDALHAS (CARTAS) =========
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isDragging = false;
let currentDraggedSlot = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initMedalSwipe() {
    const medalsContainer = document.getElementById('medalsContainer');
    if (!medalsContainer) return;

    const slots = medalsContainer.querySelectorAll('.medalha-slot');
    
    slots.forEach(slot => {
        // Touch events
        slot.addEventListener('touchstart', handleTouchStart, { passive: true });
        slot.addEventListener('touchmove', handleTouchMove, { passive: false });
        slot.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Mouse events (para desktop com drag)
        slot.addEventListener('mousedown', handleMouseDown);
        slot.addEventListener('mousemove', handleMouseMove);
        slot.addEventListener('mouseup', handleMouseUp);
        slot.addEventListener('mouseleave', handleMouseUp);
    });
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    currentDraggedSlot = e.target.closest('.medalha-slot');
    if (currentDraggedSlot) {
        isDragging = true;
        currentDraggedSlot.style.transition = 'none';
        currentDraggedSlot.style.zIndex = '100';
    }
}

function handleTouchMove(e) {
    if (!isDragging || !currentDraggedSlot) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    dragOffsetX = touch.clientX - touchStartX;
    dragOffsetY = touch.clientY - touchStartY;
    
    // Aplicar rotação baseada no movimento horizontal
    const rotation = dragOffsetX * 0.1;
    
    // Atualizar posição da carta
    const currentTransform = getComputedStyle(currentDraggedSlot).transform;
    const matrix = new DOMMatrix(currentTransform);
    const currentX = matrix.m41;
    
    currentDraggedSlot.style.transform = `translateX(-50%) translateX(${currentX + dragOffsetX}px) translateY(${dragOffsetY}px) rotateZ(${rotation}deg)`;
    currentDraggedSlot.style.opacity = Math.max(0.5, 1 - Math.abs(dragOffsetX) / 300);
}

function handleTouchEnd(e) {
    if (!isDragging || !currentDraggedSlot) return;
    
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 100;
    
    currentDraggedSlot.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        // Swipe detectado - remover carta
        if (swipeDistance > 0) {
            // Swipe para direita
            currentDraggedSlot.style.transform = `translateX(-50%) translateX(600px) translateY(${dragOffsetY}px) rotateZ(45deg)`;
        } else {
            // Swipe para esquerda
            currentDraggedSlot.style.transform = `translateX(-50%) translateX(-600px) translateY(${dragOffsetY}px) rotateZ(-45deg)`;
        }
        currentDraggedSlot.style.opacity = '0';
        
        // Após animação, resetar posição ou remover
        setTimeout(() => {
            if (currentDraggedSlot) {
                currentDraggedSlot.style.zIndex = '';
                // Resetar para posição original ou próxima medalha
                const nextSlot = getNextMedalSlot(currentDraggedSlot);
                if (nextSlot) {
                    moveNextMedalToCenter(nextSlot);
                }
            }
        }, 300);
    } else {
        // Voltar para posição original
        currentDraggedSlot.style.transform = '';
        currentDraggedSlot.style.opacity = '';
    }
    
    isDragging = false;
    currentDraggedSlot = null;
    dragOffsetX = 0;
    dragOffsetY = 0;
}

function handleMouseDown(e) {
    if (e.button !== 0) return; // Apenas botão esquerdo
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    currentDraggedSlot = e.target.closest('.medalha-slot');
    if (currentDraggedSlot) {
        isDragging = true;
        currentDraggedSlot.style.transition = 'none';
        currentDraggedSlot.style.zIndex = '100';
        currentDraggedSlot.style.cursor = 'grabbing';
    }
}

function handleMouseMove(e) {
    if (!isDragging || !currentDraggedSlot) return;
    
    dragOffsetX = e.clientX - touchStartX;
    dragOffsetY = e.clientY - touchStartY;
    
    const rotation = dragOffsetX * 0.1;
    const currentTransform = getComputedStyle(currentDraggedSlot).transform;
    const matrix = new DOMMatrix(currentTransform);
    const currentX = matrix.m41;
    
    currentDraggedSlot.style.transform = `translateX(-50%) translateX(${currentX + dragOffsetX}px) translateY(${dragOffsetY}px) rotateZ(${rotation}deg)`;
    currentDraggedSlot.style.opacity = Math.max(0.5, 1 - Math.abs(dragOffsetX) / 300);
}

function handleMouseUp(e) {
    if (!isDragging || !currentDraggedSlot) return;
    
    touchEndX = e.clientX;
    touchEndY = e.clientY;
    
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 100;
    
    currentDraggedSlot.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    currentDraggedSlot.style.cursor = 'pointer';
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            currentDraggedSlot.style.transform = `translateX(-50%) translateX(600px) translateY(${dragOffsetY}px) rotateZ(45deg)`;
        } else {
            currentDraggedSlot.style.transform = `translateX(-50%) translateX(-600px) translateY(${dragOffsetY}px) rotateZ(-45deg)`;
        }
        currentDraggedSlot.style.opacity = '0';
        
        setTimeout(() => {
            if (currentDraggedSlot) {
                currentDraggedSlot.style.zIndex = '';
                const nextSlot = getNextMedalSlot(currentDraggedSlot);
                if (nextSlot) {
                    moveNextMedalToCenter(nextSlot);
                }
            }
        }, 300);
    } else {
        currentDraggedSlot.style.transform = '';
        currentDraggedSlot.style.opacity = '';
    }
    
    isDragging = false;
    currentDraggedSlot = null;
    dragOffsetX = 0;
    dragOffsetY = 0;
}

function getNextMedalSlot(currentSlot) {
    const allSlots = Array.from(document.querySelectorAll('.medalha-slot'));
    const currentIndex = allSlots.indexOf(currentSlot);
    if (currentIndex < allSlots.length - 1) {
        return allSlots[currentIndex + 1];
    }
    return null;
}

function moveNextMedalToCenter(slot) {
    if (!slot) return;
    slot.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    slot.style.transform = 'translateX(-50%) translateX(0) translateY(0) translateZ(0) rotateZ(0deg)';
    slot.style.opacity = '1';
    slot.style.zIndex = '100';
}

// =================================
// CHAMADAS DAS FUNÇÕES

document.addEventListener('DOMContentLoaded', async function () {
    // Carregar cache primeiro
    // await loadPositionImagesCache();

    // Depois executar outras funções
    atualizarDadosPerfil();
    verificar_auth();
    arrayCardEventos();
    
    // Inicializar swipe de medalhas após carregar
    setTimeout(() => {
        initMedalSwipe();
    }, 2000); // Aguardar animação inicial das medalhas

});
