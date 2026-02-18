// URL base da sua API
const API_URL = 'http://127.0.0.1:3000/api/v1';
let avatar = '';

// ========= RANKING JS =========
// Estado da aplicação
let currentTab = 'teams';
let teamsRanking = [];
let playersRanking = [];


// =================================
// ========= NOTIFICATIONS =========

const icons = {
    success: "✔️",
    alert: "⚠️",
    error: "❌",
    info: "ℹ️"
};


function showNotification(type, message, duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) {
        console.error("Elemento #notificationContainer não encontrado.");
        // Fallback: usar alert se o container não existir
        alert(message);
        return;
    }

    const notif = document.createElement("div");
    notif.classList.add("notification", type);
    notif.innerHTML = `
      <span class="icon">${icons[type] || ""}</span>
      <span>${message}</span>
      <div class="progress"></div>
    `;

    container.appendChild(notif);
    notif.querySelector(".progress").style.animationDuration = duration + "ms";

    setTimeout(() => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    }, duration);
}


function showUserNotification(type, message, userPhoto, duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) {
        console.error("Elemento #notificationContainer não encontrado.");
        // Fallback: usar alert se o container não existir
        alert(message);
        return;
    }
    
    const notif = document.createElement("div");
    notif.classList.add("notification", type, "with-user");
    notif.innerHTML = `
      <img src="${userPhoto}" alt="User">
      <span class="icon">${icons[type] || ""}</span>
      <span>${message}</span>
      <div class="progress"></div>
    `;

    container.appendChild(notif);
    notif.querySelector(".progress").style.animationDuration = duration + "ms";

    setTimeout(() => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    }, duration);
}


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
    
    if (auth_dados && auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil();
        
        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById("gerenciarCamp");
        
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${auth_dados.usuario.time}`;
        
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        if(perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else{
            gerenciarCamp.style.display = 'none';
        }
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
async function buscarDadosPerfil() {
    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;
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
// ========= VERIFICAR TIME DO USUÁRIO =========
async function verificarTimeUsuario() {
    const auth_dados = await autenticacao();
    try {
        if(auth_dados.logado) {
            const userId = auth_dados.usuario.id;
            const response = await fetch(`${API_URL}/times/by-user/${userId}`, { 
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.time) {
                    // Usuário tem time - mostrar "Meu Time"
                    atualizarMenuTime(true, data.time.id);
                } else {
                    // Usuário não tem time - mostrar "Criar Time"
                    atualizarMenuTime(false);
                }
            } else {
                // Erro ou usuário não tem time
                atualizarMenuTime(false);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar time do usuário:', error);
        atualizarMenuTime(false);
    }
}



function atualizarMenuTime(temTime, timeId = null) {
    const menuTimeLink = document.getElementById('menuTimeLink');
    const menuTimeText = document.getElementById('menuTimeText');

    if (temTime && timeId) {
        // Usuário tem time - link para página do time
        menuTimeLink.href = `team.html?id=${timeId}`;
        menuTimeText.textContent = 'Meu Time';
        menuTimeLink.onclick = null; // Remove onclick se existir
    } else {
        // Usuário não tem time - abrir modal de criação
        menuTimeLink.href = '#';
        menuTimeText.textContent = 'Criar Time';
        menuTimeLink.onclick = function (e) {
            e.preventDefault();
            abrirModalCriarTime();
        };
    }
}

// =================================
// ========= CRIAR TIME =========
async function criarTime() {
    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;
    const form = document.getElementById('formCriarTime');
    const formData = new FormData(form);
    
    const data = {
        userId: userId,
        nome: formData.get('nome'),
        tag: formData.get('tag'),
        sobre_time: formData.get('sobre_time')
    };

    // Validações básicas
    if (!data.nome || !data.tag) {
        showNotification('alert', 'Nome e tag do time são obrigatórios.');
        return;
    }

    if (data.nome.length < 3) {
        showNotification('alert', 'Nome do time deve ter pelo menos 3 caracteres.');
        return;
    }

    if (data.tag.length < 2) {
        showNotification('alert', 'Tag do time deve ter pelo menos 2 caracteres.');
        return;
    }


    // Por enquanto, apenas envia os dados básicos

    try {
        const response = await fetch(`${API_URL}/times/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Resposta da API ao criar time:', result);

        if (response.ok) {
            // Verificar diferentes estruturas de resposta da API
            let timeId = null;
            if (result.time && result.time.id) {
                timeId = result.time.id;
            } else if (result.id) {
                timeId = result.id;
            } else if (result.timeId) {
                timeId = result.timeId;
            } else if (result.time && result.time._id) {
                timeId = result.time._id;
            } else if (result.data && result.data.id) {
                timeId = result.data.id;
            } else if (result.data && result.data.timeId) {
                timeId = result.data.timeId;
            }

            console.log('ID do time extraído:', timeId);

            // Converter para número se for string
            if (timeId && typeof timeId === 'string') {
                timeId = parseInt(timeId, 10);
            }

            if (!timeId || timeId === null || timeId === undefined || isNaN(timeId) || timeId <= 0) {
                console.error('ID do time não encontrado ou inválido na resposta:', result);
                showNotification('error', 'Erro: ID do time não encontrado na resposta.');
                return;
            }

            showNotification('success', 'Time criado com sucesso!');
            fecharModalCriarTime();
            // Atualizar menu para mostrar "Meu Time"
            atualizarMenuTime(true, timeId);
            // Redirecionar para a página do time criado
            setTimeout(() => {
                window.location.href = `team.html?id=${timeId}`;
            }, 2000);
        } else {
            showNotification('error', result.error || 'Erro ao criar time.');
        }
    } catch (error) {
        console.error('Erro ao criar time:', error);
        showNotification('error', 'Erro de conexão. Tente novamente.');
    }
}


function abrirModalCriarTime() {
    const modal = document.getElementById('modalCriarTime');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}


function fecharModalCriarTime() {
    const modal = document.getElementById('modalCriarTime');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Limpar formulário
    document.getElementById('formCriarTime').reset();
    
    // Limpar previews de imagens
    const logoPreview = document.getElementById('logoPreview');
    const bannerPreview = document.getElementById('bannerPreview');
    const logoUploadArea = document.getElementById('logoUploadArea');
    const bannerUploadArea = document.getElementById('bannerUploadArea');
    
    if (logoPreview) {
        logoPreview.style.backgroundImage = '';
        logoPreview.classList.remove('show');
    }
    if (bannerPreview) {
        bannerPreview.style.backgroundImage = '';
        bannerPreview.classList.remove('show');
    }
    if (logoUploadArea) {
        logoUploadArea.classList.remove('has-image');
    }
    if (bannerUploadArea) {
        bannerUploadArea.classList.remove('has-image');
    }
}


// =================================
// ========= UPLOAD DE IMAGENS =========
function setupImageUpload() {
    // Logo upload
    const logoInput = document.getElementById('logoTime');
    const logoPreview = document.getElementById('logoPreview');
    const logoUploadArea = document.getElementById('logoUploadArea');

    if (logoInput && logoPreview && logoUploadArea) {
        logoInput.addEventListener('change', function(e) {
            handleImageUpload(e, logoPreview, logoUploadArea);
        });
    }

    // Banner upload
    const bannerInput = document.getElementById('bannerTime');
    const bannerPreview = document.getElementById('bannerPreview');
    const bannerUploadArea = document.getElementById('bannerUploadArea');

    if (bannerInput && bannerPreview && bannerUploadArea) {
        bannerInput.addEventListener('change', function(e) {
            handleImageUpload(e, bannerPreview, bannerUploadArea);
        });
    }
}


function handleImageUpload(event, previewElement, uploadArea) {
    const file = event.target.files[0];
    
    if (file) {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            showNotification('alert', 'Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('alert', 'A imagem deve ter no máximo 5MB.');
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.style.backgroundImage = `url(${e.target.result})`;
            previewElement.classList.add('show');
            uploadArea.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

// =================================
// ========= TABS =========
// =================================

function switchTab(tab) {
    currentTab = tab;

    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Atualizar seções
    document.querySelectorAll('.ranking-section').forEach(section => {
        section.classList.remove('active');
    });

    if (tab === 'teams') {
        document.getElementById('teamsRanking').classList.add('active');
        if (teamsRanking.length === 0) {
            carregarRankingTimes();
        }
    } else {
        document.getElementById('playersRanking').classList.add('active');
        if (playersRanking.length === 0) {
            carregarRankingPlayers();
        }
    }
}


// =================================
// ========= RANKING DE TIMES =========
// =================================

async function carregarRankingTimes() {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Carregando ranking...</p></div>';

    try {
        // Buscar todos os times
        const timesResponse = await fetch(`${API_URL}/times/list`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!timesResponse.ok) {
            throw new Error('Erro ao buscar times');
        }

        const timesData = await timesResponse.json();
        const times = Array.isArray(timesData.times) ? timesData.times :
            Array.isArray(timesData.dados) ? timesData.dados :
                Array.isArray(timesData) ? timesData : [];

        // Buscar troféus de cada time
        const timesComRanking = await Promise.all(
            times.map(async (time) => {
                try {
                    const trofeusResponse = await fetch(`${API_URL}/trofeus/time/${time.id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    let trofeusCount = 0;
                    if (trofeusResponse.ok) {
                        const trofeusData = await trofeusResponse.json();
                        trofeusCount = Array.isArray(trofeusData) ? trofeusData.length :
                            (trofeusData.trofeus ? trofeusData.trofeus.length : 0);
                    }

                    return {
                        ...time,
                        score: trofeusCount,
                        trofeus: trofeusCount
                    };
                } catch (error) {
                    console.error(`Erro ao buscar troféus do time ${time.id}:`, error);
                    return {
                        ...time,
                        score: 0,
                        trofeus: 0
                    };
                }
            })
        );

        // Ordenar por score (troféus)
        teamsRanking = timesComRanking.sort((a, b) => b.score - a.score);

        // Atualizar contador
        document.getElementById('teamsCount').textContent = `${teamsRanking.length} times`;

        // Renderizar
        renderizarRankingTimes();

    } catch (error) {
        console.error('Erro ao carregar ranking de times:', error);
        teamsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar ranking de times</p></div>';
    }
}

function renderizarRankingTimes() {
    const teamsList = document.getElementById('teamsList');

    if (teamsRanking.length === 0) {
        teamsList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum time encontrado</p></div>';
        return;
    }

    teamsList.innerHTML = teamsRanking.map((time, index) => {
        const position = index + 1;
        const hasPoints = time.score && time.score > 0;
        const positionDisplay = hasPoints ? `#${position}` : '#---';
        const positionClass = hasPoints ? '' : 'empty';
        const topClass = hasPoints && position === 1 ? 'top-1' : hasPoints && position === 2 ? 'top-2' : hasPoints && position === 3 ? 'top-3' : '';
        const logo = time.avatar_time_url || time.logo || '../img/legalize.png';

        return `
            <div class="ranking-card ${topClass}" onclick="window.location.href='team.html?id=${time.id}'">
                <div class="ranking-position ${positionClass}">${positionDisplay}</div>
                <img src="${logo}" alt="${time.nome}" class="ranking-avatar">
                <div class="ranking-info">
                    <div class="ranking-name">${time.nome || 'Time Sem Nome'}</div>
                    <div class="ranking-details">
                        <div class="ranking-detail">
                            <i class="fas fa-trophy"></i>
                            <span>${time.trofeus || 0} Troféus</span>
                        </div>
                        ${time.tag ? `
                        <div class="ranking-detail">
                            <i class="fas fa-tag"></i>
                            <span>${time.tag}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="ranking-score">
                    <div class="score-value">${time.score || 0}</div>
                    <div class="score-label">Pontos</div>
                </div>
            </div>
        `;
    }).join('');
}

// =================================
// ========= RANKING DE PLAYERS =========
// =================================

async function carregarRankingPlayers() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Carregando ranking...</p></div>';

    try {
        // Buscar todos os players
        const playersResponse = await fetch(`${API_URL}/users/perfils`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!playersResponse.ok) {
            throw new Error('Erro ao buscar players');
        }

        const players = await playersResponse.json();

        if (!Array.isArray(players)) {
            throw new Error('Resposta inválida da API');
        }

        // Buscar medalhas de cada player
        const playersComRanking = await Promise.all(
            players.map(async (player) => {
                try {
                    const medalhasResponse = await fetch(`${API_URL}/medalhas/usuario/${player.id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    let medalhasCount = 0;
                    let medalhasOuro = 0;
                    let medalhasPrata = 0;

                    if (medalhasResponse.ok) {
                        const medalhasData = await medalhasResponse.json();
                        const medalhas = Array.isArray(medalhasData) ? medalhasData : [];
                        medalhasCount = medalhas.length;

                        // Contar medalhas de ouro e prata
                        medalhas.forEach(medalha => {
                            const position = medalha.position_medalha?.toLowerCase() || '';
                            if (position === 'campeao') {
                                medalhasOuro++;
                            } else if (position === 'segundo_lugar' || position === 'segundo') {
                                medalhasPrata++;
                            }
                        });
                    }

                    // Calcular score: ouro vale 3 pontos, prata vale 1 ponto
                    const score = (medalhasOuro * 3) + medalhasPrata;

                    return {
                        ...player,
                        score: score,
                        medalhas: medalhasCount,
                        medalhasOuro: medalhasOuro,
                        medalhasPrata: medalhasPrata
                    };
                } catch (error) {
                    console.error(`Erro ao buscar medalhas do player ${player.id}:`, error);
                    return {
                        ...player,
                        score: 0,
                        medalhas: 0,
                        medalhasOuro: 0,
                        medalhasPrata: 0
                    };
                }
            })
        );

        // Ordenar por score
        playersRanking = playersComRanking.sort((a, b) => b.score - a.score);

        // Atualizar contador
        document.getElementById('playersCount').textContent = `${playersRanking.length} players`;

        // Renderizar
        renderizarRankingPlayers();

    } catch (error) {
        console.error('Erro ao carregar ranking de players:', error);
        playersList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar ranking de players</p></div>';
    }
}

function renderizarRankingPlayers() {
    const playersList = document.getElementById('playersList');

    if (playersRanking.length === 0) {
        playersList.innerHTML = '<div class="empty-state"><i class="fas fa-user"></i><p>Nenhum player encontrado</p></div>';
        return;
    }

    playersList.innerHTML = playersRanking.map((player, index) => {
        const position = index + 1;
        const hasPoints = player.score && player.score > 0;
        const positionDisplay = hasPoints ? `#${position}` : '#---';
        const positionClass = hasPoints ? '' : 'empty';
        const topClass = hasPoints && position === 1 ? 'top-1' : hasPoints && position === 2 ? 'top-2' : hasPoints && position === 3 ? 'top-3' : '';
        const avatar = player.avatar_url || '../img/legalize.png';
        const timeNome = player.time_nome || 'Sem time';

        return `
            <div class="ranking-card ${topClass}" onclick="window.location.href='perfil.html?id=${player.id}'">
                <div class="ranking-position ${positionClass}">${positionDisplay}</div>
                <img src="${avatar}" alt="${player.username}" class="ranking-avatar">
                <div class="ranking-info">
                    <div class="ranking-name">${player.username || 'Player Sem Nome'}</div>
                    <div class="ranking-details">
                        <div class="ranking-detail">
                            <i class="fas fa-medal"></i>
                            <span>${player.medalhas || 0} Medalhas</span>
                        </div>
                        ${player.medalhasOuro > 0 ? `
                        <div class="ranking-detail">
                            <i class="fas fa-crown" style="color: #ffd700;"></i>
                            <span>${player.medalhasOuro} Ouro</span>
                        </div>
                        ` : ''}
                        ${player.medalhasPrata > 0 ? `
                        <div class="ranking-detail">
                            <i class="fas fa-medal" style="color: #c0c0c0;"></i>
                            <span>${player.medalhasPrata} Prata</span>
                        </div>
                        ` : ''}
                        <div class="ranking-detail">
                            <i class="fas fa-users"></i>
                            <span>${timeNome}</span>
                        </div>
                    </div>
                </div>
                <div class="ranking-score">
                    <div class="score-value">${player.score || 0}</div>
                    <div class="score-label">Pontos</div>
                </div>
            </div>
        `;
    }).join('');
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

// Variável para armazenar a função de fechar, para poder removê-la depois
let fecharPesquisaHandler = null;

function abrirBarraPesquisa() {
    const header = document.querySelector('.header');
    const searchBarContainer = document.getElementById('searchBarContainer');
    const searchToggle = document.getElementById('searchToggle');

    // Se já existe um handler, remove antes de adicionar um novo
    if (fecharPesquisaHandler) {
        document.removeEventListener('click', fecharPesquisaHandler);
        fecharPesquisaHandler = null;
    }

    // Alterna a classe 'search-active' no header
    header.classList.toggle('search-active');

    // Se a barra de busca estiver ativa, foca no input
    if (header.classList.contains('search-active')) {
        const searchInput = searchBarContainer.querySelector('.search-input');
        searchInput.focus();
        
        // Cria função para fechar ao clicar fora
        fecharPesquisaHandler = function(event) {
            // Verifica se o clique foi fora do container de busca e do botão de busca
            if (!searchBarContainer.contains(event.target) && 
                !searchToggle.contains(event.target)) {
                // Fecha a barra de busca
                header.classList.remove('search-active');
                // Remove o listener após fechar
                document.removeEventListener('click', fecharPesquisaHandler);
                fecharPesquisaHandler = null;
            }
        };
        
        // Adiciona o listener após um pequeno delay para não fechar imediatamente ao abrir
        setTimeout(() => {
            document.addEventListener('click', fecharPesquisaHandler);
        }, 100);
    } else {
        // Se fechou, remove o listener se existir
        if (fecharPesquisaHandler) {
            document.removeEventListener('click', fecharPesquisaHandler);
            fecharPesquisaHandler = null;
        }
    }
}
// Fechar menu quando clicar fora dele
document.addEventListener('click', function(event) {
    const menu = document.querySelector('#menuOpcoes');
    const perfilBtn = document.querySelector('.perfil-btn');
    
    if (!perfilBtn.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});

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
document.addEventListener('DOMContentLoaded', verificarTimeUsuario);
document.addEventListener('DOMContentLoaded', function() {
    // Setup upload de imagens
    setupImageUpload();
    
    // Formulário de criar time
    const formCriarTime = document.getElementById('formCriarTime');
    if (formCriarTime) {
        formCriarTime.addEventListener('submit', function(e) {
            e.preventDefault();
            criarTime();
        });
    }

    // Botão cancelar
    const cancelarCriarTime = document.getElementById('cancelarCriarTime');
    if (cancelarCriarTime) {
        cancelarCriarTime.addEventListener('click', fecharModalCriarTime);
    }

    // Botão fechar (X)
    const closeModalCriarTime = document.getElementById('closeModalCriarTime');
    if (closeModalCriarTime) {
        closeModalCriarTime.addEventListener('click', fecharModalCriarTime);
    }

    // Fechar modal clicando fora
    const modalCriarTime = document.getElementById('modalCriarTime');
    if (modalCriarTime) {
        modalCriarTime.addEventListener('click', function(e) {
            if (e.target === modalCriarTime) {
                fecharModalCriarTime();
            }
        });
    }
});

// Conectar input de busca
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        let timeoutId;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            const termo = this.value.trim();
            
            // Debounce: aguarda 300ms após parar de digitar
            timeoutId = setTimeout(() => {
                buscarTimesEPlayers(termo);
            }, 300);
        });
        
        // Esconder resultados ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-bar-container')) {
                esconderResultados();
            }
        });
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    await carregarRankingTimes();
    await carregarRankingPlayers();
});

// =================================
// ========= INITIALIZATION =========
// =================================

document.addEventListener('DOMContentLoaded', function() {
    verificar_auth();
    verificarTimeUsuario();
    addScrollProgress();
});