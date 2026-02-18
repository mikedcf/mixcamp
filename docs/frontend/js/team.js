// URL base da API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'mikedcf.github.io';
let avatar = '';
let menuTimeLink;

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
            console.log('Cache de imagens carregado:', window.positionImagesCache);
        }
    } catch (error) {
        console.error('Erro ao carregar cache de imagens:', error);
    }
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
        console.error('Erro na inicialização:', error);
        showNotification('error', 'Erro ao carregar os dados. Redirecionando...');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    }
}


async function verificar_auth() {
    const auth_dados = await autenticacao(); 
    
    if (auth_dados.logado) {
        const perfil_data = await buscarDadosPerfil();
        console.log(perfil_data.perfilData.usuario.time_id);

        if(perfil_data.perfilData.usuario.time_id == null || perfil_data.perfilData.usuario.time_id == '') {
            document.getElementById("joinTeamBtn").style.display = "flex";
        }
        else{
            document.getElementById("joinTeamBtn").style.display = "none";
        }

        const gerenciarCamp = document.getElementById("gerenciarCamp");

        // Atualiza a UI para o usuário logado
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;


        if(perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else{
            gerenciarCamp.style.display = 'none';
        }

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
    if (!auth_dados.logado) {
        return;
    }
    const userId = auth_dados.usuario.id;
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
        console.error('Erro ao buscar dados do perfil:', error);
        return { perfilData: null, medalhasData: [] };
    }
}



// =================================
// ========= MAPEAMENTO DE FUNÇÕES =========
function mapFuncaoEmoji(funcao) {
    switch (funcao) {
        case 'titular': return '⭐';
        case 'reserva': return '🔄';
        case 'coach': return '📋';
        default: return '👤';
    }
}


function mapPosicaoEmoji(posicao) {
    const imageUrl = getPositionImageSync(posicao);
    return `<img src="${imageUrl}" alt="${posicao}" class="posicao-icon">`;
}





function capitalize(s) { 
    return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); 
}

async function formatarDataBR(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}


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
    // if (iframe && medalha.iframe_url) {
    //     iframe.onload = function() {
    //         if (loadingEl) loadingEl.style.display = 'none';
    //     };
    //     iframe.src = medalha.iframe_url || medalha.imagem_url;
    // } else if (iframe) {
    //     if (loadingEl) loadingEl.style.display = 'none';
    //     iframe.src = '';
    // }


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


// =================================
// ========= BUSCAR DADOS DO TIME  =========

async function buscarDadosTime() {


    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');

    const auth_dados = await autenticacao();
    if (auth_dados.logado) {
        
        const userId = auth_dados.usuario.id;
        if (userId != timeId) {
            document.getElementById('configTeamBtn').style.display = 'none';
        }
    }



    try {
        
        
        if (!timeId) {
            showNotification('alert', 'Time não informado na URL.');
            return;
        }

        const response = await fetch(`${API_URL}/times/${timeId}`,
        {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        

        preencherTimeNaUI(data);

    }
    catch (error) {
        console.error('Erro ao carregar dados do time:', error);
        showNotification('error', 'Não foi possivel carregar o time.');
    }
}


//---PREENCHER TIME NA UI 
function preencherTimeNaUI(data) {
    const { time, redesSociais = {}, membros = [], destaque = {}, noticias = [], conquistas = [] } = data;
    const liderTime = data.time.lider_id;
    

    document.getElementById('box-content').style.boxShadow = `0 25px 50px ${data.coresDoTime.cores_perfil}`;

    // Banner e avatar
    const banner = document.getElementById('banner-time');
    const avatar = document.getElementById('avatar-time');

    if (banner && time?.banner_time_url) banner.style.backgroundImage = `url(${time.banner_time_url})`;
    

    if (avatar && time?.avatar_time_url) avatar.style.backgroundImage = `url(${time.avatar_time_url})`;



    // tag e nome

    const tagE1 = document.querySelector('.team-tag');
    const nomeE1 = document.querySelector('.box-perfil-nome');

    if (tagE1) tagE1.textContent = time?.tag || '';
    if (nomeE1) nomeE1.textContent = time?.nome || '';

    // redes sociais
    const redesE1 = document.getElementById('redesSociais');
    if (redesE1) {
        redesE1.innerHTML = '';
        const redesConfig = [
            { campo: 'discord_url', img: '../img/Discord.png', alt: 'Discord' },
            { campo: 'youtube_url', img: '../img/youtube.png', alt: 'YouTube' },
            { campo: 'instagram_url', img: '../img/instag.png', alt: 'Instagram' },
            { campo: 'twitter_url', img: '../img/x.png', alt: 'Twitter' },
            { campo: 'twitch_url', img: '../img/twitch.png', alt: 'Twitch' },
            { campo: 'faceit_url', img: '../img/faceit.png', alt: 'Faceit' },
            { campo: 'gamesclub_url', img: '../img/gc.png', alt: 'GamesClub' },
            { campo: 'steam_url', img: '../img/Steam.png', alt: 'Steam' },
            { campo: 'tiktok_url', img: '../img/tiktok.png', alt: 'TikTok' },
        ];

        redesConfig.forEach(rede => {
            const url = redesSociais[rede.campo];

            if (url && url.trim() !== '' && url !== 'null' && url !== 'undefined') {
                const a = document.createElement('a');
                a.href = url; a.target = '_blank';

                const img = document.createElement('img');
                img.src = rede.img; img.alt = rede.alt; img.classList.add('redes');
                a.appendChild(img);
                redesE1.appendChild(a);
            }
        })
        
    }

    // conquistas/medalhas

    const medalhasSlots = document.querySelectorAll('.medalha-slot');
    medalhasSlots.forEach(slot => {
        slot.classList.add('empty');
        const content = slot.querySelector('.medalha-content');
        if (content) content.innerHTML = '';
    });
    conquistas.slice(0, medalhasSlots.length).forEach((medalha, index) => {
        
        const slot = medalhasSlots[index];
        const content = slot.querySelector('.medalha-content');
        slot.classList.remove('empty');
        content.innerHTML = `
            <img src="${medalha.imagem_url}" alt="${medalha.nome}" 
                onerror="this.style.display='none'">
        `;
        slot.onclick = () => abrirModalMedalhaTime(medalha);
    });


    // jogos
    const linkJogos = {
        'Valorant': 'https://cdn3.emoji.gg/emojis/54052-valorant.png',
        'R6': 'https://cdn3.emoji.gg/emojis/60992-r6.png',
        'CS2': 'https://cdn3.emoji.gg/emojis/11160-cs2.png',
        'CFAL': 'https://cdn3.emoji.gg/emojis/84043-crossfire-logo.png',
    }

    const jogosContainer = document.querySelector('.jogos-container');

    
    // Limpa o container
    jogosContainer.innerHTML = '';
    
    // Verifica se gamesTime existe e tem game_name
    if (data.gamesTime && data.gamesTime.game_name) {
        const listaJogos = data.gamesTime.game_name.split(',').map(jogo => jogo.trim());
        
        if (listaJogos.length > 0 && listaJogos[0] !== '') {
            // Cria um item para cada jogo
            listaJogos.forEach(nomeJogo => {
                const jogoItem = document.createElement('div');
                jogoItem.className = 'jogo-item';
                
                const imgSrc = linkJogos[nomeJogo] || '../img/legalize.png';
                
                jogoItem.innerHTML = `
                    <img src="${imgSrc}" alt="${nomeJogo}" class="jogo-icon" 
                         onerror="this.src='../img/legalize.png'">
                    <span class="jogo-nome">${nomeJogo}</span>
                `;
                
                jogosContainer.appendChild(jogoItem);
            });
        } else {
            jogosContainer.innerHTML = '<p style="color: #888; text-align: center;">Nenhum jogo configurado</p>';
        }
    } else {
        // Se não há jogos, mostra mensagem
        jogosContainer.innerHTML = '<p style="color: #888; text-align: center;">Nenhum jogo configurado</p>';
    }

    // destaques
    const destaquesContainer = document.querySelector('.destaque-container');
    if (destaquesContainer) {
        destaquesContainer.innerHTML = '';
        if (data.destaques.length > 0) {
            destaquesContainer.innerHTML = `
                <div class="video-wrapper">
                    <iframe 
                        src="${data.destaques[0].video_url}" 
                        frameborder="0" 
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        loading="lazy"
                        class="video-iframe">
                    </iframe>
                </div>
            `;
        }
    }



    // noticias
    const tituloNoticia = document.getElementById('titulo-noticia');
    const conteudoNoticia = document.getElementById('conteudo-noticia');
    
    // Verificar se noticias existe e tem pelo menos um elemento
    if (data.noticias && data.noticias.length > 0) {
        if (tituloNoticia) tituloNoticia.textContent = data.noticias[0].titulo || 'Últimas Notícias do Time';
        if (conteudoNoticia) conteudoNoticia.textContent = data.noticias[0].conteudo || 'Aqui você pode adicionar as últimas notícias e atualizações sobre o time.';
    } else {
        // Se não há notícias, usar valores padrão
        if (tituloNoticia) tituloNoticia.textContent = 'Últimas Notícias do Time';
        if (conteudoNoticia) conteudoNoticia.textContent = 'Aqui você pode adicionar as últimas notícias e atualizações sobre o time.';
    }


    // jogadores
    const jogadoresContainer = document.querySelector('.jogadores-container');
    if (jogadoresContainer) {
        jogadoresContainer.innerHTML = '';
        membros.forEach(m => {
            
            const item = document.createElement('div');
            item.setAttribute('onclick', `abrirPerfilJogador('${m.usuario_id}')`);
            item.className = 'jogador-item';
            item.innerHTML = `
            
                <img src="${m.avatar_url}" alt="${m.username}" class="jogador-avatar" onclick="abrirPerfilJogador('${m.usuario_id}')">
                <div class="jogador-info" onclick="abrirPerfilJogador('${m.usuario_id}')">
                    <span class="jogador-nome" >${m.username}</span>
                    <span class="jogador-role">${mapPosicaoEmoji(m.posicao)} ${capitalize(m.posicao)}</span>
                    ${m.usuario_id == liderTime ? '<span id="liderbadge" class="lider-badge">👑 LÍDER</span>' : ''}
                    
                </div>`;
            jogadoresContainer.appendChild(item);
        })

        
        
    }

}

function abrirPerfilJogador(user_id) {
    window.location.href = `perfil.html?id=${user_id}`;
}

//---MAPEAMENTO DE FUNÇÃO PARA EMOJI
function mapFuncaoEmoji(funcao) {
    switch (funcao) {
        case 'titular': return '⭐';
        case 'reserva': return '🔄';
        case 'coach': return '📋';
        default: return '👤';
    }
}

//---CAPITALIZAR A PRIMEIRA LETRA
function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }


// =================================
// ========= MUDANÇA DE TEMA =========

let rotacao = 0;
function girarImagem(bnt) {
    const img = bnt.querySelector('img');
    rotacao += 180;
    img.style.transform = `rotate(${rotacao}deg)`;
}


function mudarTema() {
    document.body.classList.toggle('dark');
    trocarImagemLogo();
}


function trocarImagemLogo() {
    const img = document.querySelector('header .box-logo .logo');
    if (document.body.classList.contains('dark')) {
        img.src = '../img/MIXCAMP.svg';
    } else {
        img.src = '../img/mixcamp2.png';
    }
}


// =================================
// ========= ABIR MENU SUSPENSO =========


function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}


// Fechar menu quando clicar fora dele
document.addEventListener('click', function (event) {
    const menu = document.querySelector('#menuOpcoes');
    const perfilBtn = document.querySelector('.perfil-btn');

    if (!perfilBtn.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});


// =================================
// ========= SCROLL DO HEADER =========
window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


// =================================
// ========= ABIR BARRA DE PESQUISA =========
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


function Copiarl_Link_Perfil() {
    

    // aqui você coloca o que quer copiar
    let url = window.location.href;


    navigator.clipboard.writeText(url)
        .then(() => {
            // alert("Copiado para a área de transferência!");
            showNotification('success', 'Link copiado para a área de transferência!');
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
        });
}


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
        console.error('Erro ao atualizar menu perfil:', error);
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


// ===============================================================================================
// ==================================== [SISTEMA DE SOLICITAÇÕES] =============================================


// ========= VERIFICAÇÃO
// // ----- VERIFICAR STATUS DA SOLICITAÇÃO
async function verificarStatusSolicitacao() {

    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));


    const auth_dados = await autenticacao();
    if (!auth_dados.logado) {
        return;
    }
    const userId = auth_dados.usuario.id;


    
    const response = await fetch(`${API_URL}/solicitacoes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const data = await response.json();
    if (response.ok) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].usuario_id == userId && data[i].time_id == timeId) {
                let status = data[i].status;
                return status;
            }
        }


    }

}

// ----- VERIFICAR SE USUÁRIO É LÍDER DO TIME
async function verificarSeELider(timeId, userId) {

    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const liderTime = data.time.lider_id
            
            return data.time && data.time.lider_id == userId;
        }
        return false;
    } catch (error) {
        console.error('Erro ao verificar liderança:', error);
        return false;
    }
}

// ----- VERIFICAR SE USUÁRIO É MEMBRO DO TIME
async function verificarSeEMembro(timeId, userId) {

    try {
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            for (let i = 0; i < data.membros.length; i++) {
                let membroId = data.membros[i].usuario_id;

                if (membroId == userId) {
                    return true;
                }
            }
            return false;
        }

    } catch (error) {
        console.error('Erro ao verificar se é membro:', error);
        return false;
    }
}


// ========= SISTEMA DE SOLICITAÇÕES
// ----- LISTAR SOLICITAÇÕES TODAS SOLICITAÇÕES
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

// ----- LISTAR SOLICITAÇÕES (para líderes)
async function listarSolicitacoesTime() {
    try {
        const params = new URLSearchParams(window.location.search);
        const timeId = params.get('id');

        const auth_dados = await autenticacao();
        // const timeId = auth_dados.usuario.time;
        if (!auth_dados.logado) {
            return;
        }
        const userId = auth_dados.usuario.id;
        
        if (!timeId) return;

        // Primeiro verificar se o usuário é líder do time
        const isLeader = await verificarSeELider(timeId, userId);
        if (!isLeader) {
            // Usuário não é líder, não tentar buscar solicitações
            return;
        }

        const response = await fetch(`${API_URL}/times/${timeId}/solicitacoes?userId=${userId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            for (let i = 0; i < data.solicitacoes.length; i++) {
                if (data.solicitacoes[i].status == 'pendente') {
                    // mostrarSolicitacoes(data.solicitacoes);
                }
            }
        }

    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
    }
}

// ----- SOLICITAR ENTRADA NO TIME
async function solicitarEntradaTime() {
    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));

    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;

    const dados = {
        timeId,
        userId
    }

    const response = await fetch(`${API_URL}/times/solicitar-entrada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dados)
    });

        const data = await response.json();

    if (response.ok) {
        showNotification('success', 'Solicitação enviada com sucesso!');
        let status = 'pendente';
        atualizarBotaoSolicitacao(status);
    } else {
        showNotification('error', 'Erro ao enviar solicitação.');
    }
}

// ----- ACEITAR SOLICITAÇÃO COM POSIÇÃO
async function aceitarSolicitacaoComPosicao(solicitacaoId) {
    const posicao = getSelectedPosition(solicitacaoId);

    
    try {
        const auth_dados = await autenticacao();
        const userId = auth_dados.usuario.id;

        // Pegar a posição selecionada do dropdown customizado
        const posicao = getSelectedPosition(solicitacaoId);

        const response = await fetch(`${API_URL}/solicitacoes/${solicitacaoId}/aceitar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId, posicao })
        });

            const data = await response.json();



        if (response.ok) {
            showNotification('success', 'Solicitação aceita com sucesso');

            registroTransferencia(solicitacaoId, 'entrada', true, posicao)
            // fecharModalSolicitacoes();
            abrirModalSolicitacoesLider();
            atualizarBotaoSolicitacao();
            
            // Recarregar dados do time
            buscarDadosTime();
        } else {
            showNotification('error', data.message);
        }
        
    } catch (error) {
        console.error('Erro ao aceitar solicitação:', error);
        showNotification('error', 'Erro ao aceitar solicitação.');
    }
}

// ----- REJEITAR SOLICITAÇÃO
async function rejeitarSolicitacao(solicitacaoId) {
    try {

    const auth_dados = await autenticacao();
        const userId = auth_dados.usuario.id;


        const response = await fetch(`${API_URL}/solicitacoes/${solicitacaoId}/rejeitar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('success', data.message);
            fecharModalSolicitacoes();
        } else {
            showNotification('error', data.message);
        }

    } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        showNotification('error', 'Erro ao rejeitar solicitação.');
    }
}

// ----- MOSTRAR SOLICITAÇÕES EM MODAL
function mostrarSolicitacoes(solicitacoes) {

    // Criar modal de solicitações se não existir
    let modal = document.getElementById('modalSolicitacoes');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalSolicitacoes';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content-profissional">
                <div class="modal-header-profissional">
                    <div class="header-content">
                        <div class="header-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="header-text">
                            <h2>Solicitações Pendentes</h2>
                            <p>Gerenciar solicitações de entrada no time</p>
                        </div>
                    </div>
                    <button class="close-profissional" id="closeModalSolicitacoes">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body-profissional">
                    <div id="solicitacoesList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners para fechar modal
        document.getElementById('closeModalSolicitacoes').addEventListener('click', fecharModalSolicitacoes);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) fecharModalSolicitacoes();
        });
    }

    // Preencher lista de solicitações
    const solicitacoesList = document.getElementById('solicitacoesList');
    solicitacoesList.innerHTML = '';

    if (solicitacoes.length === 0) {
        // Mostrar mensagem quando não há solicitações
        solicitacoesList.innerHTML = `
            <div class="no-solicitacoes">
                <i class="fas fa-inbox"></i>
                <h3>Nenhuma solicitação pendente</h3>
                <p>Não há solicitações de entrada no time no momento.</p>
            </div>
        `;
    } else {
        solicitacoes.forEach(solicitacao => {
            
            
            const item = document.createElement('div');
            item.className = 'solicitacao-item';
            item.innerHTML = `
                <div class="solicitacao-info">
                    <img src="${solicitacao.avatar_url}" alt="${solicitacao.username}" class="solicitacao-avatar">
                    <div class="solicitacao-details">
                        <h4>${solicitacao.username}</h4>
                        <small>${new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</small>
                    </div>
                </div>
                <div class="solicitacao-posicao">
                    <label for="posicao-${solicitacao.id}">Posição:</label>
                    <div class="custom-dropdown" id="dropdown-${solicitacao.id}">
                        <div class="dropdown-selected" onclick="toggleDropdown('${solicitacao.id}')">
                            <img src="${getPositionImageSync('sub')}" alt="Sub" class="position-icon">
                            <span class="position-text">Sub</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="dropdown-options" id="options-${solicitacao.id}">
                            <div class="dropdown-option" data-value="sub" onclick="selectPosition('${solicitacao.id}', 'sub')">
                                <img src="${getPositionImageSync('sub')}" alt="Sub" class="position-icon">
                                <span>Sub</span>
                            </div>
                            <div class="dropdown-option" data-value="awp" onclick="selectPosition('${solicitacao.id}', 'awp')">
                                <img src="${getPositionImageSync('awp')}" alt="AWP" class="position-icon">
                                <span>AWP</span>
                            </div>
                            <div class="dropdown-option" data-value="entry" onclick="selectPosition('${solicitacao.id}', 'entry')">
                                <img src="${getPositionImageSync('entry')}" alt="Entry" class="position-icon">
                                <span>Entry</span>
                            </div>
                            <div class="dropdown-option" data-value="support" onclick="selectPosition('${solicitacao.id}', 'support')">
                                <img src="${getPositionImageSync('support')}" alt="Support" class="position-icon">
                                <span>Support</span>
                            </div>
                            <div class="dropdown-option" data-value="igl" onclick="selectPosition('${solicitacao.id}', 'igl')">
                                <img src="${getPositionImageSync('igl')}" alt="IGL" class="position-icon">
                                <span>IGL</span>
                            </div>
                            <div class="dropdown-option" data-value="lurker" onclick="selectPosition('${solicitacao.id}', 'lurker')">
                                <img src="${getPositionImageSync('lurker')}" alt="Lurker" class="position-icon">
                                <span>Lurker</span>
                            </div>
                            <div class="dropdown-option" data-value="rifle" onclick="selectPosition('${solicitacao.id}', 'rifle')">
                                <img src="${getPositionImageSync('rifle')}" alt="Rifle" class="position-icon">
                                <span>Rifle</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="solicitacao-actions">
                    <button class="btn-aceitar" onclick="aceitarSolicitacaoComPosicao(${solicitacao.id})">
                        <i class="fas fa-check"></i> Aceitar
                    </button>
                    <button class="btn-rejeitar" onclick="rejeitarSolicitacao(${solicitacao.id})">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            `;
        solicitacoesList.appendChild(item);
        
        // Inicializar dropdown com posição padrão (sub)
        setTimeout(() => {
            const dropdown = document.getElementById(`dropdown-${solicitacao.id}`);
            if (dropdown) {
                dropdown.setAttribute('data-selected', 'sub');
            }
        }, 100);
        });
    }

    modal.style.display = 'block';
    
    // Adicionar event listener para fechar dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.dropdown-options').forEach(opt => {
                opt.style.display = 'none';
            });
            document.querySelectorAll('.dropdown-arrow').forEach(arr => {
                arr.textContent = '▼';
            });
            document.querySelectorAll('.solicitacao-item').forEach(item => {
                item.classList.remove('dropdown-open');
            });
        }
    });
}

// ----- CONTROLE DO DROPDOWN CUSTOMIZADO
function toggleDropdown(solicitacaoId) {
    const options = document.getElementById(`options-${solicitacaoId}`);
    const arrow = document.querySelector(`#dropdown-${solicitacaoId} .dropdown-arrow`);
    const solicitacaoItem = options.closest('.solicitacao-item');
    
    if (options.style.display === 'block') {
        options.style.display = 'none';
        arrow.textContent = '▼';
        if (solicitacaoItem) {
            solicitacaoItem.classList.remove('dropdown-open');
        }
    } else {
        // Fechar outros dropdowns abertos
        document.querySelectorAll('.dropdown-options').forEach(opt => {
            opt.style.display = 'none';
        });
        document.querySelectorAll('.dropdown-arrow').forEach(arr => {
            arr.textContent = '▼';
        });
        document.querySelectorAll('.solicitacao-item').forEach(item => {
            item.classList.remove('dropdown-open');
        });
        
        options.style.display = 'block';
        arrow.textContent = '▲';
        if (solicitacaoItem) {
            solicitacaoItem.classList.add('dropdown-open');
        }
    }
}

function selectPosition(solicitacaoId, posicao) {
    const dropdown = document.getElementById(`dropdown-${solicitacaoId}`);
    const solicitacaoItem = dropdown.closest('.solicitacao-item');
    
    const selectedImg = dropdown.querySelector('.dropdown-selected img');
    const selectedText = dropdown.querySelector('.dropdown-selected .position-text');
    const options = document.getElementById(`options-${solicitacaoId}`);
    const arrow = dropdown.querySelector('.dropdown-arrow');
    
    // Mapeamento de imagens das posições (usando cache)
    const imagensPosicoes = {
        'capitao': getPositionImageSync('capitao'),
        'awp': getPositionImageSync('awp'),
        'entry': getPositionImageSync('entry'),
        'support': getPositionImageSync('support'),
        'igl': getPositionImageSync('igl'),
        'sub': getPositionImageSync('sub'),
        'coach': getPositionImageSync('coach'),
        'lurker': getPositionImageSync('lurker'),
        'rifle': getPositionImageSync('rifle')
    };
    
    const nomesPosicoes = {
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
    
    // Atualizar seleção
    selectedImg.src = imagensPosicoes[posicao] || imagensPosicoes['sub'];
    selectedText.textContent = nomesPosicoes[posicao] || 'Sub';
    
    // Fechar dropdown
    options.style.display = 'none';
    arrow.textContent = '▼';
    if (solicitacaoItem) {
        solicitacaoItem.classList.remove('dropdown-open');
    }
    
    // Armazenar valor selecionado
    dropdown.setAttribute('data-selected', posicao);
}

// ----- OBTER POSIÇÃO SELECIONADA
function getSelectedPosition(solicitacaoId) {
    const dropdown = document.getElementById(`dropdown-${solicitacaoId}`);
    return dropdown.getAttribute('data-selected') || 'sub';
}

// ----- SAIR DO TIME
async function sairDoTime(){
    const confirmado = await showConfirmModal('Tem certeza que deseja sair do time?');
    if (confirmado) {

        const params = new URLSearchParams(window.location.search);
        const timeId = Number(params.get('id'));

        const auth_dados = await autenticacao();
        const username = auth_dados.usuario.nome;
        const userId = auth_dados.usuario.id;
        
        const dados = {
            timeId: timeId,
            usuarioId: userId
        }


        try{
            const response = await fetch(`${API_URL}/times/del/membros/sair`,{
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });

            if (response.ok){
                showNotification('success', `${username} deixou o time`);
                let data = await listarSolicitacoesTodasSolicitacoes();
                for (let i = 0; i < data.length; i++) {
                    if (data[i].usuario_id == userId && data[i].time_id == timeId) {
                        solicitacaoId = data[i].id; 
                        deletarSolicitacao(solicitacaoId);
                    }
                }
                atualizarBotaoSolicitacao()
                buscarDadosTime()
                atualizarTransferencia()
            }
        }
        catch(error){
            console.error('Erro ao sair do time:', error);
            showNotification('error', 'Erro ao sair do time');
        }
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

// ----- ATUALIZAR TRANSFERENCIA

async function GetTransferencias(){

    try{
        const response = await fetch(`${API_URL}/transferencias`, {
            credentials: 'include'
        });
        if (response.ok){
            const data = await response.json();
            return data;
        }
    }
    catch(error){
        console.error('Erro ao listar transferencias:', error);
        showNotification('error', 'Erro ao listar transferencias');
        return [];
    }
}


async function listarTransferencias(){

    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));

    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;

    try{
        const response = await fetch(`${API_URL}/transferencias`, {
            credentials: 'include'
        });
        if (response.ok){
            const data = await response.json();
            for (let i = 0; i < data.length; i++) {
                if (data[i].time_id == timeId && data[i].usuario_id == userId) {
                    return data[i].id;
                }
            }
            
        }
    }
    catch(error){
        console.error('Erro ao listar transferencias:', error);
        showNotification('error', 'Erro ao listar transferencias');
        return [];
    }
}

async function atualizarTransferencia(){
    

    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));

    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;
   
    

    try{
        let posicao = [];
        const data = await GetTransferencias();
        // console.log(data)
        

        for (const transferencia of data){
            if (transferencia.time_id == timeId && transferencia.usuario_id == userId) {
                if (transferencia.tipo == 'entrada') {
                    console.log(transferencia.posicao)
                    posicao.push(transferencia.posicao)
                }
            }
        }
        console.log('lista de posições',posicao)

        const contlist = posicao.length;
        const position = posicao[0];
        console.log('ultima position', position)
        registroTransferencia(null,'saida',false,position)
















        // for (let i = 0; i < data.length; i++) {
        //     if (data[i].time_id == timeId && data[i].usuario_id == userId) {
        //         posicao = data[i].posicao
        //         console.log(posicao)
        //         break
        //     }
        // }
        
        
    }
    catch(error){
        console.error('Erro ao atualizar transferencia:', error);
        showNotification('error', 'Erro ao atualizar transferencia');
    }

}

// ========= ATUALIZAR BOTÃO DE SOLICITAÇÃO 

async function atualizarBotaoSolicitacao() {

    
    let status = await verificarStatusSolicitacao();
    const joinBtn = document.getElementById('joinTeamBtn');
    if (!joinBtn) return;

    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));

    const auth_dados = await autenticacao();
    if (!auth_dados.logado) {
        return;
    }
    const userId = auth_dados.usuario.id;
        
        
    // Verificar se o usuário é líder do time
    const isLeader = await verificarSeELider(timeId, userId);
    // let isLeader = true
    


    // Verificar se o usuário já é membro do time
    const isMember = await verificarSeEMembro(timeId, userId);


    // PRIORIDADE: Líder sempre vê o botão de gerenciar solicitações
    if (isLeader) {
        // Usuário é líder - mostrar botão de gerenciar solicitações (apenas ícone de bandeira)
        joinBtn.innerHTML = '<i class="fas fa-flag"></i>';
        joinBtn.disabled = false;
        joinBtn.style.opacity = '1';
        joinBtn.style.cursor = 'pointer';
        joinBtn.style.display = 'block';
        joinBtn.style.background = 'blue';
        document.getElementById('configTeamBtn').style.display = 'flex'
        

        // Remover event listeners anteriores e adicionar o novo
        joinBtn.replaceWith(joinBtn.cloneNode(true));
        const newJoinBtn = document.getElementById('joinTeamBtn');
        newJoinBtn.onclick = abrirModalSolicitacoesLider;
        return;
    }

    // Se não é líder mas é membro - ocultar botão
    if (isMember) {
        // Usuário já é membro do time - ocultar botão
        document.getElementById('configTeamBtn').style.display = 'none'
        joinBtn.style.display = 'block';
        joinBtn.style.background = 'red';
        joinBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        joinBtn.removeEventListener('click', solicitarEntradaTime);
        joinBtn.onclick = sairDoTime;
        return;

    }

    // Usuário comum - mostrar status da solicitação
    switch (status) {
        case 'pendente':
            joinBtn.innerHTML = '<i class="fas fa-clock"></i>';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.7';
            joinBtn.style.cursor = 'not-allowed';
            joinBtn.style.background = 'rgb(119, 139, 6)';
            break;
        case 'aceita':
            joinBtn.innerHTML = '<i class="fas fa-check"></i>';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.7';
            joinBtn.style.cursor = 'not-allowed';
            joinBtn.style.background = 'green';
            break;
        case 'recusada':
            joinBtn.innerHTML = '<i class="fas fa-plus"></i>';
            joinBtn.disabled = false;
            joinBtn.style.opacity = '1';
            joinBtn.style.cursor = 'pointer';
            joinBtn.style.background = 'red';
            // Remover event listeners anteriores e adicionar o novo
            joinBtn.replaceWith(joinBtn.cloneNode(true));
            const newJoinBtnRecusada = document.getElementById('joinTeamBtn');
            newJoinBtnRecusada.onclick = solicitarEntradaTime;
            break;
        default:
            joinBtn.innerHTML = '<i class="fas fa-plus"></i>';
            joinBtn.disabled = false;
            joinBtn.style.opacity = '1';
            joinBtn.style.cursor = 'pointer';
            joinBtn.style.background = 'orange';
            // Remover event listeners anteriores e adicionar o novo
            joinBtn.replaceWith(joinBtn.cloneNode(true));
            const newJoinBtnDefault = document.getElementById('joinTeamBtn');
            newJoinBtnDefault.onclick = solicitarEntradaTime;
    }
    
}



// ========= DADOS PARA COMUNIDADE
async function registroTransferencia(solicitacaoId,tipo,active,posicao) {
    
    

    try {
        if (active) {
            const response_solicitacao = await fetch(`${API_URL}/solicitacoes/${solicitacaoId}`, {
                credentials: 'include'
            });

            const data_solicitacao = await response_solicitacao.json();

            const dados = {
                usuario_id: data_solicitacao.usuario_id,
                time_id: data_solicitacao.time_id,
                tipo: tipo,
                posicao: posicao

            }

            const response_transferencia = await fetch(`${API_URL}/transferencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });
    
            const data_transferencia = await response_transferencia.json();
    
            if (!response_transferencia.ok) {
                showNotification('error', 'Erro ao adicionar transferência');
            }
        }
        else{
            
            const auth_dados = await autenticacao();
            const userId = auth_dados.usuario.id;

            const params = new URLSearchParams(window.location.search);
            const timeId = Number(params.get('id'));

            
            
            const dados = {
                usuario_id: userId,
                time_id: timeId,
                tipo: tipo,
                posicao: posicao
            }

            console.log(dados)

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
            
        }

        

    } catch (error) {
        console.error('Erro ao adicionar transferência:', error);
        showNotification('error', 'Erro ao adicionar transferência');
    }

}


// =================================
// ========= MODAL DE SOLICITAÇÕES =========

// ----- ABRIR MODAL DE SOLICITAÇÕES (para líderes)
async function abrirModalSolicitacoesLider() {
    const auth_dados = await autenticacao();
    const timeId = auth_dados.usuario.time;
    const userId = auth_dados.usuario.id;
    try {
        
        if (!timeId) return;

        // Verificar se o usuário é líder do time
        const isLeader = await verificarSeELider(timeId, userId);
        if (!isLeader) {
            showNotification('error', 'Apenas o líder do time pode gerenciar solicitações.');
            return;
        }

        const response = await fetch(`${API_URL}/times/${timeId}/solicitacoes?userId=${userId}`, {
            credentials: 'include'
        });

        const solicitacoes = [];

        if (response.ok) {
            const data = await response.json();

            for (let i = 0; i < data.solicitacoes.length; i++) {
                
                if (data.solicitacoes[i].status === 'pendente') {
                    solicitacoes.push(data.solicitacoes[i]);
                }
            }

            mostrarSolicitacoes(solicitacoes);
            
        } else {
            showNotification('error', 'Erro ao carregar solicitações.');
        }

    } catch (error) {
        console.error('Erro ao abrir modal de solicitações:', error);
        showNotification('error', 'Erro ao carregar solicitações.');
    }
}


async function verificarSolicitacoes() {

    const params = new URLSearchParams(window.location.search);
    const timeId = Number(params.get('id'));

    const auth_dados = await autenticacao();
    if (!auth_dados.logado) {
        return;
    }
    const userId = auth_dados.usuario.id;

    const isLeader = await verificarSeELider(timeId, userId);

    if (!isLeader) {
        return;
    }

    try{
       
        let quantidadeAntiga = 0;
        let quantidadeDeSolicitacoes = 0;
        let notifyoff = 0;

        
        while (true){
            const response = await fetch(`${API_URL}/times/${timeId}/solicitacoes?userId=${userId}`, {
                credentials: 'include'
            });


            if (response.ok) {
                const data = await response.json();
                for (let i = 0; i < data.solicitacoes.length; i++) {
                    if (data.solicitacoes[i].status === 'pendente') {
                        quantidadeDeSolicitacoes = data.solicitacoes.filter(solicitacao => solicitacao.status === 'pendente').length;
                        
                    }
                }

                if (quantidadeDeSolicitacoes > quantidadeAntiga) {
                    quantidadeAntiga = quantidadeDeSolicitacoes;
                    notifyoff = 0;
                }

                if (notifyoff == 0){
                    if (quantidadeDeSolicitacoes > 0){
                        if (quantidadeDeSolicitacoes == 1){
                            showNotification('alert', `Você tem ${quantidadeDeSolicitacoes} solicitação pendente`)
                        }
                        else{
                            showNotification('alert', `Você tem ${quantidadeDeSolicitacoes} solicitações pendentes`)
                        }
                    }
                    notifyoff = 1;
                }
            }
        }
    }
    catch(error){
        console.error('Erro ao verificar solicitações:', error);
    }
}


// ----- FECHAR MODAL DE SOLICITAÇÕES
function fecharModalSolicitacoes() {
    const modal = document.getElementById('modalSolicitacoes');
    if (modal) {
        modal.style.display = 'none';
    }
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

function irParaConfigTime() {
    const params = new URLSearchParams(window.location.search);
    const timeId = params.get('id');
    window.location.href = `config_time.html?id=${timeId}`;
}


// =================================
// CHAMADAS DAS FUNÇÕES
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
document.addEventListener('DOMContentLoaded', async function() {
    // Carregar cache primeiro
    await loadPositionImagesCache();
    
    // Depois executar outras funções
    verificar_auth();
    buscarDadosTime();
    verificarTimeUsuario();
    verificarStatusSolicitacao();
    listarSolicitacoesTime();
    atualizarBotaoSolicitacao();
    atualizarMenuPerfil();
    verificarSolicitacoes();
});

// Event listeners para modal de criar time
document.addEventListener('DOMContentLoaded', function () {
    // Setup upload de imagens
    setupImageUpload();
    
    // Formulário de criar time
    const formCriarTime = document.getElementById('formCriarTime');
    if (formCriarTime) {
        formCriarTime.addEventListener('submit', function (e) {
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
        modalCriarTime.addEventListener('click', function (e) {
            if (e.target === modalCriarTime) {
                fecharModalCriarTime();
            }
        });
    }
    
    // Event listener para botão de solicitar entrada no time
    const joinTeamBtn = document.getElementById('joinTeamBtn');
    if (joinTeamBtn) {
        joinTeamBtn.addEventListener('click', solicitarEntradaTime);
    }
});

// Adicionar barra de progresso
addScrollProgress();