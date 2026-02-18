// =============================================================
// ====================== [ Variáveis e Credenciais ] ======================

// URL base da sua API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'mikedcf.github.io';

// =================================
// ========= POSITION IMAGES =======
// =================================

// Função para buscar imagens de posições do banco de dados
async function buscarImgPosition() {
    const response = await fetch(`${API_URL}/positionimg`);
    const data = await response.json();
    return data;
}

// Função para obter imagem de posição (assíncrona)
async function getPositionImage(posicao) {
    if (!posicao || typeof posicao !== 'string') {
        return 'https://img.icons8.com/ios-filled/50/question-mark.png';
    }
    const posicaoLimpa = posicao.trim().toLowerCase();
    try {
        const imgPosition = await buscarImgPosition();
        if (imgPosition && imgPosition.length > 0) {
            const dados = imgPosition[0];
            switch (posicaoLimpa) {
                case 'capitao': return dados.capitao || 'https://cdn-icons-png.flaticon.com/128/1253/1253686.png';
                case 'awp': return dados.awp || 'https://img.icons8.com/offices/30/centre-of-gravity.png';
                case 'entry': return dados.entry || 'https://img.icons8.com/external-others-pike-picture/50/external-Centerfire-Rifle-Ammo-shooting-others-pike-picture.png';
                case 'support': return dados.support || 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-smoke-grenade-battle-royale-flaticons-flat-flat-icons.png';
                case 'igl': return dados.igl || 'https://cdn-icons-png.flaticon.com/128/6466/6466962.png';
                case 'sub': return dados.sub || 'https://cdn-icons-png.flaticon.com/128/10695/10695869.png';
                case 'coach': return dados.coach || 'https://img.icons8.com/doodle-line/60/headset.png';
                case 'lurker': return dados.lurker || 'https://img.icons8.com/ios-filled/50/ninja-head.png';
                case 'rifle': return dados.rifle || 'https://img.icons8.com/external-ddara-lineal-ddara/64/external-gun-memorial-day-ddara-lineal-ddara.png';
                default: return 'https://img.icons8.com/ios-filled/50/user.png';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar imagens do banco:', error);
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

let banner_antigo = '';
let avatar_antigo = '';
let video_antigo = '';
let noticia_antiga = {}
let corTimeSelecionada = '';
let games = []
let game_antiga = '';
let avatar = '';
let banner = '';
let transferencia = null


// Variáveis globais
let currentTeamId = null;
let currentUserId = null;
let teamData = null;

// Mapeamento de posições
const posicoesMap = {
    'capitao': 'Capitão',
    'awp': 'AWP',
    'entry': 'Entry',
    'support': 'Support',
    'igl': 'IGL',
    'sub': 'Sub',
    'coach': 'Coach',
    'lurker': 'Lurker',
    'rifle': 'Rifle'
};

// Função para obter imagens de posições dinamicamente
function getPosicoesEmojis() {
    return {
        'capitao': `<img src="${getPositionImageSync('capitao')}" alt="Capitão" class="posicao-icon">`,
        'awp': `<img src="${getPositionImageSync('awp')}" alt="AWP" class="posicao-icon">`,
        'entry': `<img src="${getPositionImageSync('entry')}" alt="Entry" class="posicao-icon">`,
        'support': `<img src="${getPositionImageSync('support')}" alt="Support" class="posicao-icon">`,
        'igl': `<img src="${getPositionImageSync('igl')}" alt="IGL" class="posicao-icon">`,
        'sub': `<img src="${getPositionImageSync('sub')}" alt="Sub" class="posicao-icon">`,
        'coach': `<img src="${getPositionImageSync('coach')}" alt="Coach" class="posicao-icon">`,
        'lurker': `<img src="${getPositionImageSync('lurker')}" alt="Lurker" class="posicao-icon">`,
        'rifle': `<img src="${getPositionImageSync('rifle')}" alt="Rifle" class="posicao-icon">`
    };
}


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


// =============== MODAL DE CONFIRMAÇÃO 

let confirmModalResolve = null;

/**
 * Mostra um modal de confirmação
 * @param {string} message - Mensagem a ser exibida
 * @param {string} title - Título do modal (opcional)
 * @returns {Promise<boolean>} - true se confirmou, false se cancelou
 */
function showConfirmModal(message, title = 'Confirmação') {
    return new Promise((resolve) => {
        confirmModalResolve = resolve;
        
        // Configurar elementos
        const modal = document.getElementById('confirmModal');
        const titleElement = document.getElementById('confirmModalTitle');
        const messageElement = document.getElementById('confirmModalMessage');
        
        if (!modal || !titleElement || !messageElement) {
            console.error('Elementos do modal de confirmação não encontrados!');
            resolve(false);
            return;
        }
        
        // Definir conteúdo
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Mostrar modal
        modal.style.display = 'block';
        
        // Focar no botão cancelar por padrão (mais seguro)
        setTimeout(() => {
            const cancelBtn = document.querySelector('.btn-confirm-cancel');
            if (cancelBtn) cancelBtn.focus();
        }, 100);
    });
}

/**
 * Fecha o modal de confirmação
 * @param {boolean} result - true se confirmou, false se cancelou
 */
function closeConfirmModal(result) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (confirmModalResolve) {
        confirmModalResolve(result);
        confirmModalResolve = null;
    }
}

// Fechar com Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('confirmModal');
        if (modal && modal.style.display === 'block') {
            closeConfirmModal(false);
        }
    }
});

// Fechar clicando fora do modal
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'confirmModal') {
        closeConfirmModal(false);
    }
});

// Navegação por teclado
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('confirmModal');
    if (modal && modal.style.display === 'block') {
        if (event.key === 'Enter') {
            event.preventDefault();
            closeConfirmModal(true);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            const cancelBtn = document.querySelector('.btn-confirm-cancel');
            const confirmBtn = document.querySelector('.btn-confirm-ok');
            
            if (document.activeElement === cancelBtn) {
                confirmBtn.focus();
            } else {
                cancelBtn.focus();
            }
        }
    }
});



// =============================================================
// ====================== [ autenticação e logout ] ======================
// Função principal de inicialização que cuida de tudo
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
        showNotification('error', 'Erro ao carregar os dados. Redirecionando...');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
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
        if (perfil_data.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
            gerenciarCamp.style.display = 'none';
        }
        // Atualiza a UI para o usuário logado
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        
        // Verificar se perfil_data e usuario existem antes de acessar avatar_url
        if (perfil_data && perfil_data.usuario && perfil_data.usuario.avatar_url) {
            document.getElementById("ftPerfil").src = perfil_data.usuario.avatar_url;
        } else {
            // Usar avatar padrão se não houver avatar do usuário
            document.getElementById("ftPerfil").src = "img/user.png";
        }
        menuTimeLink.href = `team.html?id=${auth_dados.usuario.time}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }
        buscarDadosTime()
        verificarTimeUsuario()
    }
    else{
        window.location.href = 'login.html';
    }
}


// ------ LOGOUT DO USUARIO
async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            showNotification('success', data.mensagem);
            setTimeout(() => {
                verificar_auth();
            }, 1500);
        } else {
            throw new Error(data.mensagem || 'Erro ao fazer logout.');
        }
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('error', 'Erro ao tentar sair da conta.');
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


        return perfilData;
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return perfilData = null;
    }
}


async function buscarDadosTime() {


    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');

    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;

    try {
        
        const response = await fetch(`${API_URL}/times/${timeId}`,
        {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        banner_antigo = data.time.banner_time_url
        avatar_antigo = data.time.avatar_time_url
        
        // Verificar se destaque existe e tem elementos antes de acessar
        if (data.destaques && data.destaques.length > 0) {
            video_antigo = data.destaques[0].video_url
            console.log(video_antigo)
        } else {
            video_antigo = null
        }
        
        // Verificar se notícias existem antes de acessar
        if (data.noticias && data.noticias.length > 0) {
            noticia_antiga = {titulo: data.noticias[0].titulo, conteudo: data.noticias[0].conteudo}
        } else {
            noticia_antiga = null
        }
        
        // Verificar se coresDoTime existe antes de acessar
        if (data.coresDoTime) {
            corTimeSelecionada = data.coresDoTime.cores_perfil
        } else {
            corTimeSelecionada = null
        }
        carregarCorTime(corTimeSelecionada)
        

    

        const liderId = data.time.lider_id
        
        if (liderId == userId){
            return
        }
        else{
            window.location.href = `team.html?id=${timeId}`;
        }

    }
    catch (error) {
        console.error('Erro ao carregar dados do time:', error);
        showNotification('error', 'Não foi possivel carregar o time.');
    }
}


// =============================================================
// ====================== [ VERIFICAR TIME DO USUÁRIO ] ======================

async function verificarTimeUsuario() {
    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;
    try {
        const response = await fetch(`${API_URL}/times/by-user/${userId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.time) {
                carregarDadosTime()
                carregarMembrosTime()
                return true;
            }
        }
        
        // Usuário não tem time
        showNotification('error', 'Você não possui um time para configurar');
        setTimeout(() => {
            window.location.href = 'times.html';
        }, 2000);
        return false;

    } catch (error) {
        console.error('Erro ao verificar time do usuário:', error);
        showNotification('error', 'Erro ao verificar time do usuário');
        return false;
    }
}


// =============================================================
// ====================== [ CARREGAR DADOS DO TIME ] ======================
async function formatarDataBR(dataISO) {
    try {
        if (!dataISO) {
            return 'N/A';
        }
        
        const data = new Date(dataISO);
        
        // Verificar se a data é válida
        if (isNaN(data.getTime())) {
            return 'Data inválida';
        }
        
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Erro na data';
    }
}

async function carregarDadosTime() {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    
    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            
            // Verificar se gamesTime e game_name existem antes de fazer split
            if (data.gamesTime && data.gamesTime.game_name) {
                const listaGames = data.gamesTime.game_name.split(',');
                for(let i = 0; i < listaGames.length; i++) {
                    games.push(listaGames[i]);
                }
            } else {
                console.warn('Dados de games do time não encontrados');
            }
            // console.log(games)

            // const radios = document.querySelectorAll('input[name="teamGame"]');
  
            // radios.forEach(radio => {
            //     // Marca o radio como selecionado se o valor estiver no array
            //     radio.checked = games.includes(radio.value);
            // });

            const checkboxes = document.querySelectorAll('input[name="teamGame"]');
  
            checkboxes.forEach(box => {
                box.checked = games.includes(box.value);
            });

           
            
            
            teamData = data.time;
            
            
            // Preencher campos do formulário
            document.getElementById('teamName').value = teamData.nome || '';
            document.getElementById('teamTag').value = teamData.tag || '';
            document.getElementById('teamDescription').value = teamData.sobre_time || '';
            
            // Carregar cor do time se existir
            if (teamData.cor_principal) {
                carregarCorTime(teamData.cor_principal);
            }
            
            
            // Preencher redes sociais se existirem
            // if (data.redesSociais) {
            //     document.getElementById('teamDiscordLink').value = data.redesSociais.discord_url || '';
            //     document.getElementById('teamYoutubeLink').value = data.redesSociais.youtube_url || '';
            //     document.getElementById('teamTwitchLink').value =  data.redesSociais.twitch_url || '';
            //     document.getElementById('teamTwitterLink').value = data.redesSociais.twitter_url || '';
            //     document.getElementById('teamInstagramLink').value = data.redesSociais.instagram_url || '';
            //     document.getElementById('teamTiktokLink').value = data.redesSociais.tiktok_url || '';
            //     document.getElementById('teamFaceitLink').value = data.redesSociais.faceit_url || '';
            //     document.getElementById('teamGamesclubLink').value = data.redesSociais.gamesclub_url || '';
            //     document.getElementById('teamSteamLink').value = data.redesSociais.steam_url || '';
            // }

            // if (data.noticias) {
            //     document.getElementById('teamNewsTitle').value = data.noticias[0].titulo || '';
            //     document.getElementById('teamNewsText').value = data.noticias[0].conteudo || '';
            // }
            // console.log(data)

            // if(data.destaques.length > 0) {
            //     document.getElementById('teamVideoUrl').value = data.destaques[0].video_url || '';
            // }

            if (data.conquistas.length > 0) {
                // Limpar todos os slots primeiro
                const trofeusContainer = document.querySelector('.trofeus-container');
                trofeusContainer.innerHTML = '';
                
                // Criar slots dinamicamente para cada conquista
                for (let i = 0; i < data.conquistas.length; i++) {
                    const formatDate = await formatarDataBR(data.conquistas[i].data_conquista);
                    
                    const trofeuSlot = document.createElement('div');
                    trofeuSlot.className = 'trofeu-slot';
                    trofeuSlot.setAttribute('data-slot', i + 1);
                    
                    trofeuSlot.innerHTML = `
                        <div class="trofeu-content">
                            <img src="${data.conquistas[i].imagem_url || '../img/trophy.png'}" alt="Troféu" class="trofeu-img">
                            <div class="trofeu-info">
                                <h4>${data.conquistas[i].nome || ''}</h4>
                                <p>${data.conquistas[i].descricao || ''}</p>
                                <span class="trofeu-position">${data.conquistas[i].categoria || ''}</span>
                                <span class="trofeu-data">${formatDate || ''}</span>
                            </div>
                        </div>
                    `;
                    
                    // Adicionar evento de clique para abrir o modal
                    trofeuSlot.onclick = () => abrirModalMedalhaTime(data.conquistas[i]);
                    
                    trofeusContainer.appendChild(trofeuSlot);
                }
                
                // Adicionar slots vazios se necessário (máximo 6 slots)
                const slotsVazios = 6 - data.conquistas.length;
                for (let i = 0; i < slotsVazios; i++) {
                    const slotVazio = document.createElement('div');
                    slotVazio.className = 'trofeu-slot empty';
                    slotVazio.setAttribute('data-slot', data.conquistas.length + i + 1);
                    slotVazio.innerHTML = '<div class="trofeu-content"></div>';
                    trofeusContainer.appendChild(slotVazio);
                }
            }

        } else {
            throw new Error('Erro ao carregar dados do time');
        }

    } catch (error) {
        console.error('Erro ao carregar dados do time:', error);
        showNotification('error', 'Erro ao carregar dados do time');
    }
}



// =============================================================
// ====================== [ CARREGAR MEMBROS DO TIME ] ======================

async function carregarMembrosTime() {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            timeMembros = [];
            const data = await response.json();
            const membros = data.time.membros || [];

            for (let i = 0; i < data.membros.length; i++) {
                timeMembros.push(data.membros[i])
            }
            
            renderizarMembros(timeMembros);

        } else {
            throw new Error('Erro ao carregar membros do time');
        }

    } catch (error) {
        console.error('Erro ao carregar membros do time:', error);
        showNotification('error', 'Erro ao carregar membros do time');
    }
}

// =============================================================
// ====================== [ RENDERIZAR MEMBROS ] ======================

function renderizarMembros(membros) {
    const membersList = document.getElementById('membersList');
    
    if (membros.length === 0) {
        membersList.innerHTML = `
            <div class="no-members">
                <i class="fas fa-users"></i>
                <h3>Nenhum membro encontrado</h3>
                <p>O time ainda não possui membros cadastrados.</p>
            </div>
        `;
        return;
    }

    membersList.innerHTML = '';

    membros.forEach(membro => {
        // Verificar se teamData existe e tem lider_id antes de comparar
        const isLeader = teamData && teamData.lider_id ? membro.usuario_id == teamData.lider_id : false;
        const memberCard = document.createElement('div');
        memberCard.className = `member-card ${isLeader ? 'leader' : ''}`;
        memberCard.innerHTML = `
            <div class="member-header">
                <img src="${membro.avatar_url}" alt="${membro.username}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">${membro.username}</div>
                    <div class="member-role">
                        ${getPosicoesEmojis()[membro.posicao] || '❓'} ${posicoesMap[membro.posicao] || membro.posicao}
                    </div>
                </div>
                <div class="member-actions">
                    ${isLeader ? '<div class="leader-badge"><i class="fas fa-crown"></i> Líder</div>' : ''}
                    <select class="position-select" onchange="atualizarPosicaoMembro(${membro.usuario_id}, this.value)">
                        <option value="capitao" ${membro.posicao === 'capitao' ? 'selected' : ''}>Capitão</option>
                        <option value="awp" ${membro.posicao === 'awp' ? 'selected' : ''}>AWP</option>
                        <option value="entry" ${membro.posicao === 'entry' ? 'selected' : ''}>Entry</option>
                        <option value="support" ${membro.posicao === 'support' ? 'selected' : ''}>Support</option>
                        <option value="igl" ${membro.posicao === 'igl' ? 'selected' : ''}>IGL</option>
                        <option value="sub" ${membro.posicao === 'sub' ? 'selected' : ''}>Sub</option>
                        <option value="coach" ${membro.posicao === 'coach' ? 'selected' : ''}>Coach</option>
                        <option value="lurker" ${membro.posicao === 'lurker' ? 'selected' : ''}>Lurker</option>
                        <option value="rifle" ${membro.posicao === 'rifle' ? 'selected' : ''}>Rifle</option>
                    </select>
                    ${!isLeader ? `
                        <button class="btn-action btn-remove" onclick="removerMembro(${membro.usuario_id}, '${membro.username}')">
                            <i class="fas fa-user-minus"></i> Remover
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        membersList.appendChild(memberCard);
    });
}

// =============================================================
// ====================== [ ATUALIZAR POSIÇÃO DO MEMBRO ] ======================

async function atualizarPosicaoMembro(usuarioId, novaPosicao) {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    try {
        const response = await fetch(`${API_URL}/times/${timeId}/membros/${usuarioId}/posicao`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ posicao: novaPosicao })
        });

        if (response.ok) {
            const data = await response.json();
            showNotification('success', data.message);
            
            // Recarregar membros para atualizar a interface
            await carregarMembrosTime();
            
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao atualizar posição');
            
            // Recarregar membros para reverter a mudança na interface
            await carregarMembrosTime();
        }

    } catch (error) {
        console.error('Erro ao atualizar posição do membro:', error);
        showNotification('error', 'Erro ao atualizar posição do membro');
        
        // Recarregar membros para reverter a mudança na interface
        await carregarMembrosTime();
    }
}




// =============================================================
// ====================== [ REMOVER MEMBRO DO TIME ] ======================

async function listarSolicitacoesTodasSolicitacoes() {

    try {
        const response = await fetch(`${API_URL}/solicitacoes`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error('Erro ao listar todas as solicitações:', error);
        return [];
    }
}

async function removerMembro(usuarioId, username) {

    const confirmacao = await showConfirmModal(`Tem certeza que deseja remover ${username} do time?`);
    if (!confirmacao) {
        return;
    }



    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');


    try {
        const dados = {
            timeId,
            usuarioId
        }

        const response = await fetch(`${API_URL}/times/delete/membro`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(dados)
        });
        

        if (response.ok) {
            const data = await response.json();
            let dados = await listarSolicitacoesTodasSolicitacoes();
            for (let i = 0; i < dados.length; i++) {
                if (dados[i].usuario_id == usuarioId && dados[i].time_id == timeId) {
                    solicitacaoId = dados[i].id; 
                    deletarSolicitacao(solicitacaoId);
                    registroTransferencia(usuarioId,'saida')
                }
            }
            
            showNotification('success', data.message);
            
            // Recarregar membros e opções de liderança
            await carregarMembrosTime();
            await carregarOpcoesLideranca();
            
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao remover membro');
        }

    } catch (error) {
        console.error('Erro ao remover membro:', error);
        showNotification('error', 'Erro ao remover membro do time');
    }
}

async function deletarSolicitacao(solicitacaoId){
    try{
        const response = await fetch(`${API_URL}/del/solicitacoes`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ solicitacaoId })
        });
    }
    catch(error){
        console.error('Erro ao deletar solicitação:', error);
        showNotification('error', 'Erro ao deletar solicitação');
    }
}


async function registroTransferencia(usuarioId,tipo) {

    try {
        
        
        const params = new URLSearchParams(window.location.search);
        const timeId = params.get('id');
        
        const dados = {
            usuario_id: usuarioId,
            time_id: timeId,
            tipo: tipo
        }

        const response_transferencia = await fetch(`${API_URL}/transferencias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        const data_transferencia = await response_transferencia.json();

        if (response_transferencia.ok) {
            showNotification('success', 'foi adicionado ao banco de transferencias');
        } else {
            showNotification('error', 'Erro ao adicionar transferência');
        }
            
        

        

    } catch (error) {
        console.error('Erro ao adicionar transferência:', error);
        showNotification('error', 'Erro ao adicionar transferência');
    }

}
// =============================================================
// ====================== [ CARREGAR OPÇÕES DE LIDERANÇA ] ======================

async function carregarOpcoesLideranca() {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    
    
    try {
        const response = await fetch(`${API_URL}/times/${timeId}/membros-lideranca`, {
            credentials: 'include'
        });

        
        if (response.ok) {
            
            const data = await response.json();
            const membros = data.membros || [];
            
            const select = document.getElementById('newLeaderSelect');
            select.innerHTML = '<option value="">Selecione um membro</option>';
            
            membros.forEach(membro => {
                const option = document.createElement('option');
                option.value = membro.id;
                option.textContent = `${membro.username} (${posicoesMap[membro.posicao] || membro.posicao})`;
                select.appendChild(option);
            });

        } else {
            throw new Error('Erro ao carregar opções de liderança');
        }

    } catch (error) {
        console.error('Erro ao carregar opções de liderança:', error);
        showNotification('error', 'Erro ao carregar opções de liderança');
    }
}


// =============================================================
// ====================== [ TRANSFERIR LIDERANÇA ] ======================

async function transferirLideranca() {
    const novoLiderId = document.getElementById('newLeaderSelect').value;
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');


    if (!novoLiderId) {
        showNotification('error', 'Selecione um membro para transferir a liderança',2000);
        return;
    }

    
    const confirmacao = await showConfirmModal(`Tem certeza que deseja transferir a liderança do time? Esta ação não pode ser desfeita.`);
    
    if (!confirmacao) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/times/${timeId}/transferir-lideranca`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ novoLiderId: parseInt(novoLiderId) })
        });

        if (response.ok) {
            const data = await response.json();
            showNotification('success', data.message);
            
            setTimeout(() => {
                window.location.href = `team.html?id=${timeId}`;
            }, 2000);
            
            
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao transferir liderança');
        }

    } catch (error) {
        console.error('Erro ao transferir liderança:', error);
        showNotification('error', 'Erro ao transferir liderança');
    }
}



// =============================================================
// ====================== [ EXCLUIR TIME ] ======================

async function excluirTime() {
    const confirmacao = document.getElementById('confirmDelete').value;

    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    
    
    if (confirmacao.toUpperCase() !== 'EXCLUIR') {
        showNotification('error', 'Digite "EXCLUIR" para confirmar a exclusão');
        return;
    }

    const confirme = await showConfirmModal(`ATENÇÃO: Esta ação é IRREVERSÍVEL! O time será excluído permanentemente e todos os dados serão perdidos. Tem certeza?`);
    
    if (!confirme) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            showNotification('success', data.message);
            
            setTimeout(() => {
                window.location.href = 'times.html';
            }, 2000);
            
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao excluir time');
        }

    } catch (error) {
        console.error('Erro ao excluir time:', error);
        showNotification('error', 'Erro ao excluir time');
    }
}

// =============================================================
// ====================== [ uploud imagem ] ======================

async function preReqUploudImg(){
    showNotification('info', 'Carregando imagens...');
    const inputAvatar = document.getElementById('inputTeamLogo');
    const inputBanner = document.getElementById('inputTeamBanner');

    if (inputAvatar.files && inputAvatar.files[0]) {
        let linkAvatar = await uploadImagemCloudinary(inputAvatar.files[0]);
        avatar = linkAvatar;
    }

    if (inputBanner.files && inputBanner.files[0]) {
        let linkbannerUrl = await uploadImagemCloudinary(inputBanner.files[0]);
        banner = linkbannerUrl;
    }

}

// Função para fazer upload de uma imagem para o Cloudinary
async function uploadImagemCloudinary(file) {
    
    
    if (!file) {
        showNotification('error', 'Nenhum arquivo selecionado.');
        return null;
    }

    // Validação do arquivo
    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Por favor, selecione apenas arquivos de imagem.');
        return null;
    }
    
    // Validação adicional de extensão
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        showNotification('error', 'Formato de arquivo não suportado. Use: JPG, PNG, GIF ou WebP.');
        return null;
    }

    // Limita o tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'A imagem deve ter menos de 5MB.');
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/cloudinary/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro no upload');
        }

        const data = await response.json();
        showNotification('success', 'Upload da imagem concluído!');
        return data.secure_url;
    }
    catch (error) {
        console.error('Erro no upload da imagem:', error);
        showNotification('error', `Erro ao fazer upload da imagem: ${error.message}`);
        return null;
        
    }
}


// =============================================================
// ====================== [ ESCOLHER JOGO ] ======================

async function escolherJogo() {
    // Pega todos os checkboxes marcados
    const jogosSelecionados = document.querySelectorAll('input[name="teamGame"]:checked');
    
    // Limpa o array de jogos
    games = [];
    
    // Adiciona os jogos selecionados
    jogosSelecionados.forEach(checkbox => {
        games.push(checkbox.value);
    });
    
    console.log('Jogos selecionados:', games);
}



// =============================================================
// ====================== [ SELEÇÃO DE COR ] ======================

// Função para atualizar a cor do time
async function atualizarCorTime() {
    const colorPicker = document.getElementById('teamColorPicker');
    const colorValue = document.getElementById('colorValue');
    const colorPreview = document.getElementById('colorPreview');
    
    if (colorPicker && colorValue) {
        corTimeSelecionada = colorPicker.value;
        colorValue.textContent = corTimeSelecionada.toUpperCase();
        console.log(corTimeSelecionada);
        
        // Atualizar preview com a cor selecionada
        if (colorPreview) {
            colorPreview.style.background = `linear-gradient(135deg, ${corTimeSelecionada}20, ${corTimeSelecionada}10)`;
            colorPreview.style.borderColor = `${corTimeSelecionada}40`;
        }

        showNotification('success', `Cor do time alterada para ${corTimeSelecionada.toUpperCase()}`, 2000);
        
    }
}

// Função para carregar cor salva do time
async function carregarCorTime(corSalva) {
    if (corSalva) {
        const colorPicker = document.getElementById('teamColorPicker');
        const colorValue = document.getElementById('colorValue');
        const colorPreview = document.getElementById('colorPreview');
        
        if (colorPicker && colorValue) {
            corTimeSelecionada = corSalva;
            colorPicker.value = corSalva;
            colorValue.textContent = corSalva.toUpperCase();
            
            // Atualizar preview
            if (colorPreview) {
                colorPreview.style.background = `linear-gradient(135deg, ${corSalva}20, ${corSalva}10)`;
                colorPreview.style.borderColor = `${corSalva}40`;
            }
        }
    }
}

// =============================================================
// ====================== [ SALVAR CONFIGURAÇÕES DO TIME ] ======================

async function salvarConfiguracoesTime() {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    try {
        // Coletar dados do formulário
        const nome = document.getElementById('teamName').value.trim();
        const tag = document.getElementById('teamTag').value.trim();
        const sobre = document.getElementById('teamDescription').value.trim();
        
        const redes = {
            discord: document.getElementById('teamDiscordLink').value.trim(),
            youtube: document.getElementById('teamYoutubeLink').value.trim(),
            twitch: document.getElementById('teamTwitchLink').value.trim(),
            twitter: document.getElementById('teamTwitterLink').value.trim(),
            instagram: document.getElementById('teamInstagramLink').value.trim(),
            tiktok: document.getElementById('teamTiktokLink').value.trim(),
            faceit: document.getElementById('teamFaceitLink').value.trim(),
            gamesclub: document.getElementById('teamGamesclubLink').value.trim(),
            steam: document.getElementById('teamSteamLink').value.trim(),
        };

        const destaques = document.getElementById('teamVideoUrl').value.trim()
        let video = '';

        if(destaques == ''){
            video = video_antigo;
        }
        else{
           video = destaques;
        }
            
        

        // Validações básicas
        if (!nome) {
            showNotification('error', 'Nome do time é obrigatório');
            return;
        }

        if (!tag) {
            showNotification('error', 'Tag do time é obrigatória');
            return;
        }

        // Upload de imagens se houver
        let logoUrl = null;
        let bannerUrl = null;

        const inputLogo = document.getElementById('inputTeamLogo');
        const inputBanner = document.getElementById('inputTeamBanner');

        if (inputLogo.files && inputLogo.files[0]) {
            logoUrl = avatar;
            if (!logoUrl) return; // Erro no upload
        }

        if (inputBanner.files && inputBanner.files[0]) {
            bannerUrl = banner;
            if (!bannerUrl) return; // Erro no upload
        }

        const tituloNoticia = document.getElementById('teamNewsTitle').value.trim();
        const conteudoNoticia = document.getElementById('teamNewsText').value.trim();
        

        // Montar payload
        const dados = {
            nome,
            tag,
            sobre_time: sobre,
            redes,
            logo_url: logoUrl || avatar_antigo,
            banner_url: bannerUrl || banner_antigo,
            video_url: video,
            noticia: [{titulo: tituloNoticia || noticia_antiga.titulo, conteudo: conteudoNoticia || noticia_antiga.conteudo}],
            games: games,
            cores_perfil: corTimeSelecionada
        };

        // Enviar para o backend
        const response = await fetch(`${API_URL}/update/times/${timeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const data = await response.json();
            showNotification('success', data.message,2000);
            setTimeout(() => {
                window.location.href = `team.html?id=${timeId}`;
            }, 2200);
            
            // Recarregar dados do time
            // await carregarDadosTime();
            
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Erro ao salvar configurações');
        }

    } catch (error) {
        console.error('Erro ao salvar configurações do time:', error);
        showNotification('error', 'Erro ao salvar configurações do time');
    }
}


// =================================
// =============================================================
// ====================== [ MODAL DE TROFÉUS ] ======================

async function abrirModalMedalhaTime(medalha) {
    const modal = document.getElementById('medalModal');
    const iframe = document.getElementById('modalIframe');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDescription');
    const edicaoEl = document.getElementById('modalEdicao');
    const tituloEventoEl = document.getElementById('modalEventoTitulo');
    const dataEl = document.getElementById('modalData');
    const categoryEl = document.getElementById('modalCategory');
    const loadingEl = document.getElementById('iframeLoading');
    
    const dataFormatada = await formatarDataBR(medalha.data_conquista);

    // Preencher informações básicas
    if (titleEl) titleEl.textContent = medalha.nome || 'Conquista';
    if (descEl) descEl.textContent = medalha.descricao || 'Sem descrição disponível';
    if (edicaoEl) edicaoEl.textContent = medalha.edicao_campeonato || 'N/A';
    if (tituloEventoEl) tituloEventoEl.textContent = medalha.titulo || 'N/A';

    
    
    
    // Formatar data
    if (dataEl) dataEl.textContent = dataFormatada || 'N/A';
    
    // Mostrar loading do iframe
    if (loadingEl) loadingEl.style.display = 'flex';
    
    // Carregar iframe
    if (iframe && medalha.iframe_url) {
        let carregado = false;
    
        iframe.onload = function () {
            carregado = true;
            if (loadingEl) loadingEl.style.display = 'none';
        };
    
        // Define o link principal
        iframe.src = medalha.iframe_url;
    
        // Define um tempo máximo de espera (por ex: 5 segundos)
        setTimeout(() => {
            if (!carregado) {
                console.warn("Iframe não carregou, mostrando imagem de fallback...");
                showNotification('error', 'Iframe não carregou, mostrando imagem de fallback...');
                if (loadingEl) loadingEl.style.display = 'none';
                // Troca o iframe por uma imagem
                iframe.outerHTML = `<img src="${medalha.imagem_url}" alt="Medalha 3D" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">`;
            }
        }, 5000);
    } else if (iframe) {
        if (loadingEl) loadingEl.style.display = 'none';
        iframe.src = '';
    }

    if (medalha.categoria) {
        aplicarCoresModalPorCategoria(medalha.categoria);
    }

    if (medalha.categoria == 'campeao') {
        categoryEl.textContent = 'Campeão' || 'Geral';
        
        
    }
    else if (medalha.categoria == 'segundo') {
        categoryEl.textContent = 'Segundo' || 'Geral';

        
    }
    else if (medalha.categoria == 'terceiro') {
        categoryEl.textContent = 'Terceiro' || 'Geral';
        
    }
    else {
        categoryEl.textContent = 'Geral';
        
    }

    modal.style.display = 'block';
    // trava o scroll do body enquanto o modal está aberto
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('medalModal');
    const iframe = document.getElementById('modalIframe');
    const loadingEl = document.getElementById('iframeLoading');
    
    if (iframe) iframe.src = '';
    if (loadingEl) loadingEl.style.display = 'flex';
    if (modal) modal.style.display = 'none';
    // restaura o scroll do body
    document.body.style.overflow = 'auto';
}

function aplicarCoresModalPorCategoria(categoria) {
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('modalTitle');
    const modalIframe = document.getElementById('modalIframe');

    if (modalContent) modalContent.style.border = '2px solid rgba(255, 215, 0, 0.4)';
    if (modalTitle) modalTitle.style.color = '#FFD700';
    if (modalIframe) modalIframe.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.55)';

    switch (categoria) {
        case 'campeao':
            if (modalContent) modalContent.style.border = '2px solid rgb(255, 215, 0)';
            if (modalTitle) modalTitle.style.color = 'rgb(255, 215, 0)';
            if (modalIframe) modalIframe.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
            break;
        case 'prata':
            if (modalContent) modalContent.style.border = '2px solid rgb(192, 192, 192)';
            if (modalTitle) modalTitle.style.color = 'rgb(192, 192, 192)';
            if (modalIframe) modalIframe.style.boxShadow = '0 0 30px rgba(192, 192, 192, 0.8)';
            break;
        case 'terceiro':
            if (modalContent) modalContent.style.border = '2px solid rgb(205, 127, 50)';
            if (modalTitle) modalTitle.style.color = 'rgb(205, 127, 50)';
            if (modalIframe) modalIframe.style.boxShadow = '0 0 30px rgba(205, 127, 50, 0.8)';
            break;
        case 'geral':
            if (modalContent) modalContent.style.border = '2px solid rgb(255, 215, 0)';
            if (modalTitle) modalTitle.style.color = 'rgb(255, 215, 0)';
            if (modalIframe) modalIframe.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
            break;
    }
}

// Fechar modal clicando fora dele
document.addEventListener('click', function(event) {
    const modal = document.getElementById('medalModal');
    if (event.target === modal) {
        closeModal();
    }
});

// =============================================================
// ====================== [ sistema ] ======================

// barra de pesquisa
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

// abrir menu suspenso
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
    
    if (menu && perfilBtn && !perfilBtn.contains(event.target) && !menu.contains(event.target)) {
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


// CHAMADAS DAS FUNÇÕES
document.addEventListener('DOMContentLoaded', async function() {
    // Carregar cache primeiro
    await loadPositionImagesCache();
    
    // Depois executar outras funções
    verificar_auth();
    carregarOpcoesLideranca();
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
        
        // Configurar event listeners para posições de jogo
        // configurarEventListenersPosicoes();
    }
});

