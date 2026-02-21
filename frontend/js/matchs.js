let avatar = '';

let imagensMapas = {};

// Variáveis globais para filtros
let matchCards = [];
let statusFilters = [];
let searchInput = null;

// Variável para armazenar a função de fechar, para poder removê-la depois
// let fecharPesquisaHandler = null;

// =============================================================
// ====================== [ autenticação ] ======================

// ------ AUTENTICAÇÃO DO USUARIO
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
        const perfil_data = await buscarDadosPerfil();
        
        
        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById("gerenciarCamp");
        // Atualiza a UI para o usuário logado
        
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.perfilData.usuario.time_id}`;
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
    else{
        document.getElementById("userAuth").style.display = "flex";
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
        console.error('Erro na requisição:', error)
        showNotification('error', 'Erro ao deslogar.', 1500)
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500)
    }
}


// =================================
// ========= BUSCAR DADOS DO PERFIL =========
async function buscarDadosPerfil() {

    const auth_dados = await autenticacao();
    try {
        if(auth_dados.logado) {
            const userId = auth_dados.usuario.id;

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
            else if(medalhasResponse.status == 404) {
                medalhasData = [];

            } else {
                throw new Error('Erro ao buscar dados das medalhas.');
            }

            
            const perfilData = await perfilResponse.json();


            return {perfilData, medalhasData };
        }
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return { perfilData: null, medalhasData: [] };
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
        menuTimeLink.onclick = function(e) {
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

        if (response.ok) {
            showNotification('success', 'Time criado com sucesso!');
            fecharModalCriarTime();
            // Atualizar menu para mostrar "Meu Time"
            atualizarMenuTime(true, result.time.id);
            // Redirecionar para a página do time criado
            setTimeout(() => {
                window.location.href = `team.html?id=${result.time.id}`;
            }, 2000);
        } else {
            showNotification('error', result.error || (response.status === 409 ? 'Já existe um time com este nome ou tag. Escolha outro.' : 'Erro ao criar time.'));
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
// ========= ABIR BARRA DE PESQUISA =========


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

// =============================================================
// ====================== [ JAVASCRIPT ] ======================

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
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

window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

// =============================================================
// ====================== [ SISTEMA DE MATCHS ] ======================
// Função para gerenciar estado vazio
function handleEmptyState(isEmpty) {
    let emptyEl = document.querySelector('.matchs-empty');
    if (isEmpty) {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'matchs-empty';
            emptyEl.textContent = 'Nenhuma partida encontrada com os filtros atuais.';
            const list = document.getElementById('matchsList');
            if (list) list.appendChild(emptyEl);
        }
    } else if (emptyEl) {
        emptyEl.remove();
    }
}

// Função para aplicar filtros
function applyFilters() {
    const activeFilter = document.querySelector('#statusFilters .filter-chip.active');
    const status = activeFilter ? activeFilter.getAttribute('data-status') : 'all';
    const searchValue = (searchInput?.value || '').toLowerCase().trim();

    // Atualizar referência dos cards
    matchCards = Array.from(document.querySelectorAll('.match-card'));

    let visibleCount = 0;

    matchCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        const searchData = (card.getAttribute('data-search') || '').toLowerCase();

        let statusMatch = status === 'all' || cardStatus === status;
        let textMatch = !searchValue || searchData.includes(searchValue);

        if (statusMatch && textMatch) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    handleEmptyState(visibleCount === 0);
}

document.addEventListener('DOMContentLoaded', () => {
    statusFilters = Array.from(document.querySelectorAll('#statusFilters .filter-chip'));
    searchInput = document.getElementById('searchMatch');
    matchCards = Array.from(document.querySelectorAll('.match-card'));
    const mapThumbs = Array.from(document.querySelectorAll('.match-map-thumb'));

    // Eventos de clique nos filtros de status
    statusFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            statusFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    // Evento de digitação na busca
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }

    async function carregarImagensMapas() {
        try {
            const response = await fetch(`${API_URL}/imgmap`);
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                imagensMapas = data[0];
            } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                imagensMapas = data;
            } else {
                imagensMapas = {};
            }
        } catch (error) {
            console.error('Erro ao carregar imagens dos mapas:', error);
            imagensMapas = {};
        }
    }

    // Aplicar imagens nos mapas (versão local para cards iniciais)
    function aplicarImagensNosMapasLocal() {
        const fallback =
            'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';

        const mapThumbs = Array.from(document.querySelectorAll('.match-map-thumb'));
        mapThumbs.forEach((thumb) => {
            const mapa = (thumb.getAttribute('data-mapa') || '').toLowerCase();
            if (!mapa) {
                thumb.style.backgroundImage = `url('${fallback}')`;
                return;
            }

            const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
            const imagemUrl =
                imagensMapas[nomeCampo] ||
                imagensMapas[mapa] ||
                imagensMapas[mapa.toUpperCase()] ||
                fallback;

            thumb.style.backgroundImage = `url('${imagemUrl}')`;
        });
        
        // Aplicar backgrounds dos mapas nos cards existentes
        const cards = Array.from(document.querySelectorAll('.match-card'));
        cards.forEach(card => {
            const mapThumbs = card.querySelectorAll('.match-map-thumb');
            if (mapThumbs.length > 0) {
                const mapas = Array.from(mapThumbs).map(thumb => 
                    (thumb.getAttribute('data-mapa') || '').toLowerCase()
                );
                configurarMapasBackground(card, mapas);
            }
        });
    }
    
    // Chamar função local
    aplicarImagensNosMapasLocal();

    // Filtro inicial e carregamento de imagens
    applyFilters();
    carregarImagensMapas().then(() => {
        // Aplicar imagens após carregar
        aplicarImagensNosMapasLocal();
    });
    
    // Carregar e renderizar carrossel de eventos
    carregarCarrosselEventos();
    
    // Configurar slideshow de mapas no header
    carregarImagensMapas().then(() => {
        configurarMapasHeader();
    });
    
    // Carregar partidas da API imediatamente (sem delay)
    // buscarPartidas();
});

// Função para configurar o slideshow de mapas no header
function configurarMapasHeader() {
    const matchsHeader = document.querySelector('.matchs-header');
    if (!matchsHeader) return;

    // Lista de mapas para o slideshow
    const mapas = ['Mirage', 'Inferno', 'Ancient', 'Nuke', 'Overpass', 'Dust2', 'Vertigo', 'Train', 'Cache', 'Anubis'];
    const fallback = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
    
    // Obter URLs das imagens
    let imagensMapasArray = mapas.map(nomeMapa => {
        return imagensMapas[nomeMapa] || 
               imagensMapas[nomeMapa.toLowerCase()] || 
               imagensMapas[nomeMapa.toUpperCase()] || 
               null;
    }).filter(url => url !== null);

    // Se não tiver nenhuma imagem, usar fallback
    if (imagensMapasArray.length === 0) {
        imagensMapasArray = [fallback];
    }

    let currentIndex = 0;
    
    // Função para atualizar a imagem
    function atualizarImagemMapa() {
        if (imagensMapasArray.length === 0) return;
        
        const imageUrl = imagensMapasArray[currentIndex];
        matchsHeader.style.setProperty('--mapa-imagem', `url('${imageUrl}')`);
        
        currentIndex = (currentIndex + 1) % imagensMapasArray.length;
    }
    
    // Definir a primeira imagem
    atualizarImagemMapa();
    
    // Trocar imagem a cada 4 segundos
    setInterval(atualizarImagemMapa, 4000);
}

// Mapear status da FACEIT para nosso sistema
function mapearStatus(faceitStatus) {
    const statusMap = {
        'FINISHED': 'finished',
        'ONGOING': 'live',
        'CANCELLED': 'canceled',
        'CANCELED': 'canceled'
    };
    return statusMap[faceitStatus] || 'upcoming';
}

// Converter nome do mapa da FACEIT (de_ancient) para nosso formato (ancient)
function normalizarNomeMapa(faceitMapa) {
    if (!faceitMapa) return '';
    // Remove prefixo "de_" se existir
    return faceitMapa.replace(/^de_/, '').toLowerCase();
}

// Formatar nome do mapa para exibição (Ancient, Mirage, etc)
function formatarNomeMapa(mapa) {
    if (!mapa) return '';
    return mapa.charAt(0).toUpperCase() + mapa.slice(1);
}

// Criar card de partida dinamicamente
function criarCardPartida(match) {

    
    const teams = match.teams || {};
    const team1 = teams.faction1 || {};
    const team2 = teams.faction2 || {};
    const results = match.results || {};
    const score = results.score || {};
    const status = mapearStatus(match.status);
    
  
    
    // Obter mapas
    const mapasPick = match.voting?.map?.pick || [];
    const mapasFormatados = mapasPick.map(m => formatarNomeMapa(normalizarNomeMapa(m)));
    const mapasNormalizados = mapasPick.map(m => normalizarNomeMapa(m));
    const bestOf = match.best_of || 1;
    const formato = `MD${bestOf}`;
    
    // Determinar se tem score
    const score1 = score.faction1 || 0;
    const score2 = score.faction2 || 0;
    const temScore = status === 'finished' || status === 'live';
    const winner = results.winner;
    const team1Winner = winner === 'faction1';
    const team2Winner = winner === 'faction2';
    
    // Criar HTML do card
    const card = document.createElement('article');
    card.className = 'match-card';
    const matchId = match.match_id || '';
    card.setAttribute('data-match-id', matchId);
    card.setAttribute('data-status', status);
    card.setAttribute('data-search', `${team1.name || ''} ${team2.name || ''} ${mapasFormatados.join(' ')}`.toLowerCase());
    
    // HTML do score/status
    let scoreHTML = '';
    if (temScore) {
        scoreHTML = `
            <div class="match-score-summary ${status === 'live' ? 'live-score' : 'finished-score'}">
                <span class="score-number ${team1Winner ? 'winner' : ''}">${score1}</span>
                <span class="vs-text">VS</span>
                <span class="score-number ${team2Winner ? 'winner' : ''}">${score2}</span>
                <span class="match-status-badge ${status}">
                    <i class="fas ${status === 'live' ? 'fa-broadcast-tower' : status === 'finished' ? 'fa-flag-checkered' : status === 'canceled' ? 'fa-ban' : 'fa-clock'}"></i>
                    ${status === 'live' ? 'Ao vivo' : status === 'finished' ? 'Finalizada' : status === 'canceled' ? 'Cancelada' : 'Vai começar'}
                </span>
            </div>
        `;
    } else {
        scoreHTML = `
            <div class="match-score-summary">
                <span class="match-status-badge ${status}">
                    <i class="fas ${status === 'canceled' ? 'fa-ban' : 'fa-clock'}"></i>
                    ${status === 'canceled' ? 'Cancelada' : 'Vai começar'}
                </span>
            </div>
        `;
    }
    
    // HTML dos mapas
    let mapasHTML = '';
    if (mapasNormalizados.length > 0) {
        if (mapasNormalizados.length === 1) {
            mapasHTML = `
                <div class="match-map">
                    <div class="match-map-thumb" data-mapa="${mapasNormalizados[0]}"></div>
                    <div class="match-map-info">
                        <span class="label">Mapa${status === 'live' ? ' atual' : ''}</span>
                        <span class="value">${mapasFormatados[0]}</span>
                    </div>
                </div>
            `;
        } else {
            const thumbsHTML = mapasNormalizados.map(m => 
                `<div class="match-map-thumb" data-mapa="${m}"></div>`
            ).join('');
            mapasHTML = `
                <div class="match-map">
                    <div class="match-map-multi">
                        ${thumbsHTML}
                    </div>
                    <div class="match-map-info">
                        <span class="label">Mapas (${formato})</span>
                        <span class="value">${mapasFormatados.join(' • ')}</span>
                    </div>
                </div>
            `;
        }
    } else {
        mapasHTML = `
            <div class="match-map">
                <div class="match-map-info">
                    <span class="label">Mapa</span>
                    <span class="value">A definir</span>
                </div>
            </div>
        `;
    }
    
    const resultadoUrl = matchId ? `resultado.html?id=${matchId}` : 'resultado.html';
    
    // Garantir que os nomes dos times existam
    const team1Name = team1.name || team1.nickname || 'Time 1';
    const team2Name = team2.name || team2.nickname || 'Time 2';
    const team1Avatar = team1.avatar || team1.logo || '../img/legalize.png';
    const team2Avatar = team2.avatar || team2.logo || '../img/legalize.png';
    
  
    
    card.innerHTML = `
        <div class="match-card-bg-maps"></div>
        <div class="match-card-main" onclick="window.location.href='${resultadoUrl}'">
            <div class="match-teams">
                <div class="team">
                    <img src="${team1Avatar}" alt="${team1Name}" class="team-avatar" onerror="this.src='../img/legalize.png'">
                    <span class="team-name">${team1Name}</span>
                </div>
                ${scoreHTML}
                <div class="team">
                    <span class="team-name">${team2Name}</span>
                    <img src="${team2Avatar}" alt="${team2Name}" class="team-avatar" onerror="this.src='../img/legalize.png'">
                </div>
            </div>
            <div class="match-extra">
                ${mapasHTML}
                <div class="match-format">
                    <span class="label">Formato</span>
                    <span class="value">${formato}</span>
                </div>
            </div>
        </div>
        <button class="match-details-btn" onclick="event.stopPropagation(); window.location.href='${resultadoUrl}'">
            <i class="fas fa-eye"></i>
            Detalhes matchs
        </button>
    `;
    
    return card;
}

async function buscarEventos(){
    let dadosEventos = [];
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        
        // Status permitidos
        const statusPermitidos = ['andamento', 'encerrado', 'cancelado'];
        
        for(const evento of data.inscricoes){
            // Verificar se o status está na lista de permitidos
            const status = (evento.status || '').toLowerCase();
            if (!statusPermitidos.includes(status)) {
                continue; // Pula este evento se o status não for permitido
            }

            let link = evento.link_hub;
            let queue_id = link.split('/')
            
            dadosEventos.push({
                id: evento.id,
                titulo: evento.titulo,
                edicao: evento.edicao_campeonato,
                tipo: evento.tipo,
                organizador: evento.organizador_nome,
                id_organizador: evento.id_organizador,
                avatar_organizador: evento.organizador_avatar,
                imagem: evento.imagem_url,
                formato: evento.formato,
                game: evento.game,
                link_hub: evento.link_hub,
                queue_id: queue_id[7],
                status: evento.status

            });
        }

        return dadosEventos;

        // return data;
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        return [];
    }

}

// Função para renderizar o carrossel de eventos
function renderizarCarrosselEventos(eventos) {
    const carousel = document.getElementById('eventosCarousel');
    if (!carousel) return;

    // Limpar carrossel
    carousel.innerHTML = '';

    if (!eventos || eventos.length === 0) {
        carousel.innerHTML = '<div class="evento-item" style="min-width: 100%; text-align: center; color: rgba(255,255,255,0.5);">Nenhum evento encontrado</div>';
        return;
    }

    // Criar itens do carrossel
    eventos.forEach((evento, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'evento-item-wrapper';
        const statusEvento = (evento.status || 'andamento').toLowerCase();
        wrapper.setAttribute('data-status', statusEvento);
        
        const item = document.createElement('button');
        item.className = 'evento-item';
        item.setAttribute('data-event-id', evento.id);
        item.setAttribute('data-queue-id', evento.queue_id);
        item.setAttribute('data-status', statusEvento);
        
        // Adicionar imagem de fundo no pseudo-elemento ::after via CSS custom property
        if (evento.imagem) {
            item.style.setProperty('--evento-imagem', `url('${evento.imagem}')`);
        }
        
        // Criar card completo com todas as informações
        item.innerHTML = `
            <div class="evento-card-content">
                <h3 class="evento-titulo">${evento.titulo || 'Sem título'}</h3>
                <div class="evento-info">
                    <div class="evento-info-item">
                        <span class="evento-label">Formato:</span>
                        <span class="evento-value">${evento.formato || 'N/A'}</span>
                    </div>
                    <div class="evento-info-item">
                        <span class="evento-label">Game:</span>
                        <span class="evento-value">${evento.game || 'N/A'}</span>
                    </div>
                    <div class="evento-info-item">
                        <span class="evento-label">Tipo:</span>
                        <span class="evento-value">${evento.tipo || 'N/A'}</span>
                    </div>
                </div>
                <div class="evento-organizador">
                    ${evento.avatar_organizador ? `<img src="${evento.avatar_organizador}" alt="${evento.organizador || 'Organizador'}" class="evento-avatar-organizador" onerror="this.style.display='none'">` : ''}
                    <span class="evento-organizador-nome">${evento.organizador || 'N/A'}</span>
                </div>
            </div>
        `;

        // Adicionar event listener para clique
        item.addEventListener('click', () => {
            // Remover seleção de todos os cards
            const todosCards = document.querySelectorAll('.evento-item');
            const todosWrappers = document.querySelectorAll('.evento-item-wrapper');
            todosCards.forEach(card => card.classList.remove('active'));
            todosWrappers.forEach(wrapper => wrapper.classList.remove('active'));
            
            // Adicionar seleção ao card clicado
            item.classList.add('active');
            wrapper.classList.add('active');
            
            const queueId = item.getAttribute('data-queue-id');
            buscarPartidas(queueId)
            
        });

        wrapper.appendChild(item);
        carousel.appendChild(wrapper);
        
        // Selecionar automaticamente o primeiro evento
        if (index === 0) {
            item.classList.add('active');
            wrapper.classList.add('active');
            const queueId = item.getAttribute('data-queue-id');
            buscarPartidas(queueId);
        }
    });

    // Configurar navegação do carrossel
    configurarNavegacaoCarrossel();
}

// Função para configurar navegação do carrossel (botões prev/next)
function configurarNavegacaoCarrossel() {
    const carousel = document.getElementById('eventosCarousel');
    const btnPrev = document.getElementById('carouselPrev');
    const btnNext = document.getElementById('carouselNext');

    if (!carousel || !btnPrev || !btnNext) return;

    // Função para atualizar estado dos botões
    const atualizarBotoes = () => {
        const scrollLeft = carousel.scrollLeft;
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;

        btnPrev.disabled = scrollLeft <= 1;
        btnNext.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
    };

    // Define qual item está visível e marca como active (usado após scroll/touch)
    const sincronizarActiveComScroll = () => {
        const wrappers = carousel.querySelectorAll('.evento-item-wrapper');
        if (wrappers.length === 0) return;
        const scrollLeft = carousel.scrollLeft;
        const clientWidth = carousel.clientWidth;
        const center = scrollLeft + clientWidth / 2;
        let melhor = wrappers[0];
        let menorDist = Infinity;
        wrappers.forEach((w) => {
            const wLeft = w.offsetLeft;
            const wCenter = wLeft + w.offsetWidth / 2;
            const dist = Math.abs(center - wCenter);
            if (dist < menorDist) {
                menorDist = dist;
                melhor = w;
            }
        });
        const item = melhor.querySelector('.evento-item');
        if (!item) return;
        carousel.querySelectorAll('.evento-item-wrapper').forEach((w) => w.classList.remove('active'));
        carousel.querySelectorAll('.evento-item').forEach((el) => el.classList.remove('active'));
        melhor.classList.add('active');
        item.classList.add('active');
        const queueId = item.getAttribute('data-queue-id');
        if (queueId) buscarPartidas(queueId);
    };

    // Scroll encerrou (touch ou botão): sincroniza active com o item visível
    let scrollEndTimer = null;
    const aoFimDoScroll = () => {
        if (scrollEndTimer) clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => {
            sincronizarActiveComScroll();
            atualizarBotoes();
        }, 150);
    };

    if ('onscrollend' in carousel) {
        carousel.addEventListener('scrollend', () => {
            sincronizarActiveComScroll();
            atualizarBotoes();
        });
    } else {
        carousel.addEventListener('scroll', aoFimDoScroll);
    }

    // Passo de scroll: no mobile um item = 100% da largura, no desktop ~250px
    const getScrollStep = () => (carousel.clientWidth <= 768 ? carousel.clientWidth : 250);

    // Botão anterior
    btnPrev.addEventListener('click', () => {
        carousel.scrollBy({
            left: -getScrollStep(),
            behavior: 'smooth'
        });
        setTimeout(aoFimDoScroll, 400);
    });

    // Botão próximo
    btnNext.addEventListener('click', () => {
        carousel.scrollBy({
            left: getScrollStep(),
            behavior: 'smooth'
        });
        setTimeout(aoFimDoScroll, 400);
    });

    // Atualizar botões ao scrollar
    carousel.addEventListener('scroll', atualizarBotoes);

    // Atualizar botões inicialmente
    atualizarBotoes();

    // Atualizar botões ao redimensionar
    window.addEventListener('resize', () => {
        atualizarBotoes();
        sincronizarActiveComScroll();
    });
}

// Função para carregar e renderizar o carrossel
async function carregarCarrosselEventos() {
    try {
        const eventos = await buscarEventos();
        renderizarCarrosselEventos(eventos);
    } catch (error) {
        console.error('Erro ao carregar carrossel de eventos:', error);
    }
}

// Buscar e renderizar partidas
async function buscarPartidas(queue_id){
    

    const matchsList = document.getElementById('matchsList');
    const matchsLoading = document.getElementById('matchsLoading');
    
    if (!matchsList) {
        console.error('Elemento matchsList não encontrado');
        return;
    }
    
    // Mostrar loading e esconder lista
    if (matchsLoading) {
        matchsLoading.classList.remove('hidden');
    }
    matchsList.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/faceit/hub/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queue_id: queue_id
            })
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        
        // Esconder loading
        if (matchsLoading) {
            matchsLoading.classList.add('hidden');
        }
        
        // Limpar cards de exemplo
        matchsList.innerHTML = '';
        
        if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {

            // Criar cards para cada partida
            data.matches.forEach((match, index) => {

                const card = criarCardPartida(match);
                if (card) {
                    matchsList.appendChild(card);
                } else {
                    console.error(`Erro ao criar card para partida ${index + 1}`);
                }
            });
            
            // Recarregar imagens dos mapas após criar os cards
            setTimeout(() => {
                aplicarImagensNosMapas();
                // Aplicar backgrounds dos mapas em todos os cards
                const cards = Array.from(document.querySelectorAll('.match-card'));
                cards.forEach(card => {
                    const mapThumbs = card.querySelectorAll('.match-map-thumb');
                    if (mapThumbs.length > 0) {
                        const mapas = Array.from(mapThumbs).map(thumb => 
                            (thumb.getAttribute('data-mapa') || '').toLowerCase()
                        );
                        configurarMapasBackground(card, mapas);
                    }
                });
            }, 100);
            
            // Reaplicar filtros
            setTimeout(() => {
                matchCards = Array.from(document.querySelectorAll('.match-card'));
                applyFilters();
            }, 200);
            
            // Mostrar lista
            matchsList.style.display = '';
            
            // Iniciar atualização em tempo real
            iniciarAtualizacaoTempoReal();
        } else {
            matchsList.innerHTML = '<div class="matchs-empty">Nenhuma partida encontrada.</div>';
            matchsList.style.display = '';
        }

        return data;
    
    } catch (error) {
        console.error('Erro ao buscar partidas:', error);
        
        // Esconder loading
        if (matchsLoading) {
            matchsLoading.classList.add('hidden');
        }
        
        if (matchsList) {
            matchsList.innerHTML = '<div class="matchs-empty">Erro ao carregar partidas. Tente novamente mais tarde.</div>';
            matchsList.style.display = '';
        }
        throw error;
    }
    
}


// Função para atualizar score e status de um card existente
function atualizarScoreCard(match) {
    const matchId = match.match_id || '';
    if (!matchId) return;

    const card = document.querySelector(`[data-match-id="${matchId}"]`);
    if (!card) return;

    const results = match.results || {};
    const score = results.score || {};
    const status = mapearStatus(match.status);
    const score1 = score.faction1 || 0;
    const score2 = score.faction2 || 0;
    const temScore = status === 'finished' || status === 'live';
    const winner = results.winner;
    const team1Winner = winner === 'faction1';
    const team2Winner = winner === 'faction2';

    // Atualizar atributo de status
    card.setAttribute('data-status', status);

    // Buscar elementos do score dentro do card
    const scoreSummary = card.querySelector('.match-score-summary');
    if (!scoreSummary) return;

    // Atualizar HTML do score
    if (temScore) {
        scoreSummary.className = `match-score-summary ${status === 'live' ? 'live-score' : 'finished-score'}`;
        scoreSummary.innerHTML = `
            <span class="score-number ${team1Winner ? 'winner' : ''}">${score1}</span>
            <span class="vs-text">VS</span>
            <span class="score-number ${team2Winner ? 'winner' : ''}">${score2}</span>
            <span class="match-status-badge ${status}">
                <i class="fas ${status === 'live' ? 'fa-broadcast-tower' : status === 'finished' ? 'fa-flag-checkered' : status === 'canceled' ? 'fa-ban' : 'fa-clock'}"></i>
                ${status === 'live' ? 'Ao vivo' : status === 'finished' ? 'Finalizada' : status === 'canceled' ? 'Cancelada' : 'Vai começar'}
            </span>
        `;
    } else {
        scoreSummary.className = 'match-score-summary';
        scoreSummary.innerHTML = `
            <span class="match-status-badge ${status}">
                <i class="fas ${status === 'canceled' ? 'fa-ban' : 'fa-clock'}"></i>
                ${status === 'canceled' ? 'Cancelada' : 'Vai começar'}
            </span>
        `;
    }

    // Se mudou de status, reaplicar filtros
    applyFilters();
}

// Função para atualizar scores em tempo real
async function atualizarScoresTempoReal() {
    const queue_id = '70be580a-d027-4d92-9d18-8d21a328bd91';
    
    try {
        const response = await fetch(`${API_URL}/faceit/hub/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queue_id: queue_id
            })
        });

        if (!response.ok) {
            console.error('Erro ao atualizar scores:', response.status);
            return;
        }

        const data = await response.json();
        
        if (data.matches && Array.isArray(data.matches)) {
            // Atualizar apenas os scores dos cards existentes
            data.matches.forEach(match => {
                atualizarScoreCard(match);
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar scores em tempo real:', error);
    }
}

// Variável para armazenar o intervalo de atualização
let intervaloAtualizacao = null;

// Função auxiliar para aplicar imagens nos mapas (versão global)
function aplicarImagensNosMapas() {
    const fallback = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
    const thumbsArray = Array.from(document.querySelectorAll('.match-map-thumb'));

    thumbsArray.forEach((thumb) => {
        const mapa = (thumb.getAttribute('data-mapa') || '').toLowerCase();
        if (!mapa) {
            thumb.style.backgroundImage = `url('${fallback}')`;
            return;
        }

        const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
        const imagemUrl =
            imagensMapas[nomeCampo] ||
            imagensMapas[mapa] ||
            imagensMapas[mapa.toUpperCase()] ||
            fallback;

        thumb.style.backgroundImage = `url('${imagemUrl}')`;
    });
    
    // Aplicar mapas de fundo em todos os cards
    const cards = Array.from(document.querySelectorAll('.match-card'));
    cards.forEach(card => {
        const mapThumbs = card.querySelectorAll('.match-map-thumb');
        if (mapThumbs.length > 0) {
            const mapas = Array.from(mapThumbs).map(thumb => 
                (thumb.getAttribute('data-mapa') || '').toLowerCase()
            );
            configurarMapasBackground(card, mapas);
        }
    });
}

// Função para configurar mapas de fundo no card
function configurarMapasBackground(card, mapas) {
    if (!mapas || mapas.length === 0) return;
    
    let bgMapsContainer = card.querySelector('.match-card-bg-maps');
    
    // Se não existir, criar o container
    if (!bgMapsContainer) {
        bgMapsContainer = document.createElement('div');
        bgMapsContainer.className = 'match-card-bg-maps';
        const cardMain = card.querySelector('.match-card-main');
        if (cardMain) {
            card.insertBefore(bgMapsContainer, cardMain);
        } else {
            card.insertBefore(bgMapsContainer, card.firstChild);
        }
    }
    
    const fallback = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
    
    // Limpar mapas anteriores
    bgMapsContainer.innerHTML = '';
    
    // Definir atributo de contagem para CSS
    card.setAttribute('data-maps-count', mapas.length);
    
    // Criar elementos de background para cada mapa
    mapas.forEach(mapa => {
        if (!mapa) return;
        
        const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
        const imagemUrl =
            imagensMapas[nomeCampo] ||
            imagensMapas[mapa] ||
            imagensMapas[mapa.toUpperCase()] ||
            fallback;
        
        const bgMap = document.createElement('div');
        bgMap.className = 'match-card-bg-map';
        bgMap.style.backgroundImage = `url('${imagemUrl}')`;
        bgMapsContainer.appendChild(bgMap);
    });
}

// Iniciar atualização em tempo real dos scores
function iniciarAtualizacaoTempoReal() {
    // Limpar intervalo anterior se existir
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    // Atualizar a cada 5 segundos
    intervaloAtualizacao = setInterval(() => {
        atualizarScoresTempoReal();
    }, 5000);
    

}

// Parar atualização em tempo real
function pararAtualizacaoTempoReal() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
        intervaloAtualizacao = null;

    }
}

// Parar atualização quando a página for fechada
window.addEventListener('beforeunload', () => {
    pararAtualizacaoTempoReal();
});

// =================================
// ========= SISTEMA DE BUSCA =========
// =================================

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
document.addEventListener('DOMContentLoaded', verificar_auth);
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

addScrollProgress()