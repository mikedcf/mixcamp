// =============================================================
// ====================== [ Variáveis e Credenciais ] ======================

// URL base da sua API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'mixcamp-production.up.railway.app';

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
            
            // Atualizar imagens das posições no HTML
            atualizarImagensPosicoes();
        }
    } catch (error) {
        console.error('Erro ao carregar cache de imagens:', error);
    }
}

// Função para atualizar imagens das posições no HTML
function atualizarImagensPosicoes() {
    const posicoes = ['coach', 'awp', 'rifle', 'entry', 'lurker', 'igl', 'support'];
    
    posicoes.forEach(posicao => {
        const imgElement = document.getElementById(`img-${posicao}`);
        if (imgElement) {
            imgElement.src = getPositionImageSync(posicao);
        }
    });
}

let banner_antigo = '';
let avatar_antigo = '';
let avatar = '';
let banner = '';
let corSombra_antigo = '';
let posicaoAntiga = '';
let linkSteamAntigo = '';
let linkFaceitAntigo = '';

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
        // Atualiza a UI para o usuário logado
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${auth_dados.usuario.time}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        const gerenciarCamp = document.getElementById("gerenciarCamp");
        if (perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
            gerenciarCamp.style.display = 'none';
        }
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


// =============================================================
// ====================== [ CARREGAMENTO DO PERFIL ] ======================

// ------ CARREGAR CONFIGURAÇÕES //
async function carregarConfiguracoes() {

    const auth_dados = await autenticacao();
    const userId = auth_dados.usuario.id;
    

    if (!userId) {
        console.error("ID do usuário não fornecido.");
        window.location.href = 'login.html';
        return;
    }

    
    
    try {
        const response = await fetch(`${API_URL}/perfil/${userId}`);
        const dadosPerfil = await response.json();

        const { usuario, redesSociais } = dadosPerfil;
        
        
        // Preenche os campos do formulário
        if (usuario) {
            document.getElementById('username').value = usuario.username || '';
            document.getElementById('sobre').value = usuario.sobre || '';
            avatar_antigo = usuario.avatar_url;
            banner_antigo = usuario.banner_url;
            corSombra_antigo = usuario.cores_perfil;
            posicaoAntiga = usuario.posicao;
            
        }

        if (redesSociais && redesSociais.length > 0) {
            document.getElementById('discordLink').value = redesSociais[0].discord_url || '';
            document.getElementById('youtubeLink').value = redesSociais[0].youtube_url || '';
            document.getElementById('instaLink').value = redesSociais[0].instagram_url || '';
            document.getElementById('twitterLink').value = redesSociais[0].twitter_url || '';
            document.getElementById('twitchLink').value = redesSociais[0].twitch_url || '';
            document.getElementById('steamLink').value = redesSociais[0].steam_url || '';
            document.getElementById('faceitLink').value = redesSociais[0].faceit_url || '';
            document.getElementById('gamesclubLink').value = redesSociais[0].gamesclub_url || '';
            document.getElementById('kickLink').value = redesSociais[0].kick_url || '';
            document.getElementById('allstarLink').value = redesSociais[0].allstar_url || '';
            linkSteamAntigo = redesSociais[0].steam_url || '';
            linkFaceitAntigo = redesSociais[0].faceit_url || '';
            
        } 
        else {
            // Se não tiver redes sociais cadastradas, zera os campos
            document.getElementById('discordLink').value = '';
            document.getElementById('youtubeLink').value = '';
            document.getElementById('instaLink').value = '';
            document.getElementById('twitterLink').value = '';
            document.getElementById('twitchLink').value = '';
            document.getElementById('steamLink').value = '';
            document.getElementById('faceitLink').value = '';
            document.getElementById('gamesclubLink').value = '';
            document.getElementById('kickLink').value = '';
            document.getElementById('allstarLink').value = '';
        }

        // Carregar medalhas
        await carregarMedalhasConfig();
        
        // Carregar posições de jogo
        carregarPosicoesJogo();
       
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showNotification('error', 'Não foi possível carregar as configurações do perfil.');
        
    }
}


// salvar Configuracoes
async function salvarConfiguracoes() {
    try {
        const auth_dados = await autenticacao();
        const userId = auth_dados.usuario.id;
        if (!userId) {
            showNotification('error', 'Usuário não autenticado');
            return;
        }

        // Inputs de arquivos e cor
        const inputAvatar = document.getElementById('inputAvatar');
        const inputBanner = document.getElementById('inputBanner');
        const inputCorSombra = document.getElementById('inputCorSombra').value;

        // Verifica se há arquivos selecionados antes de fazer upload
        let avatarUrl = null;
        let bannerUrl = null;
        let corSombra = inputCorSombra;
        

        const posicoesString = obterPosicoesJogoString();
        console.log(posicoesString);


        if (inputAvatar.files && inputAvatar.files[0]) {
            avatarUrl = avatar;
        }

        if (inputBanner.files && inputBanner.files[0]) {
            bannerUrl = banner;
        }




        // Pega os outros campos
        const username = document.getElementById("username")?.value || '';
        const sobre = document.getElementById("sobre")?.value || '';
        const redes = {
        discord: document.getElementById("discordLink")?.value || '',
        youtube: document.getElementById("youtubeLink")?.value || '',
        instagram: document.getElementById("instaLink")?.value || '',
        twitter: document.getElementById("twitterLink")?.value || '',
        twitch: document.getElementById("twitchLink")?.value || '',
        faceit: document.getElementById("faceitLink")?.value || '',
        gamesclub: document.getElementById("gamesclubLink")?.value || '',
        steam: document.getElementById("steamLink")?.value || '',
        tiktok: document.getElementById("tiktokLink")?.value || '',
        kick: document.getElementById("kickLink")?.value || '',
        allstar: document.getElementById("allstarLink")?.value || '',
    };

    // Coletar posições de jogo selecionadas
    const posicoesJogo = obterPosicoesJogoArray();
    let steamid = null;
    let faceitid = null;

    if(redes.steam != '' && redes.steam != linkSteamAntigo){
        steamid = await buscarSteamId(redes.steam);
        // Se buscarSteamId retornar string vazia ou null, define como null
        if (!steamid || steamid.trim() === '') {
            steamid = null;
        }
    }

    if(redes.faceit != '' && redes.faceit != linkFaceitAntigo){
        faceitid = await buscarDadosFaceit(redes.faceit);
        
        if (!faceitid || faceitid.trim() === '') {
            faceitid = null;
        }
    }

    

    
    // Monta payload incluindo avatar e banner
    const dados = {
        username,
        sobre,
        redes,
        destaques: [], // Array vazio - destaques removidos da interface
        posicoes_jogo: posicoesJogo, // Adicionar posições de jogo
        avatar: avatarUrl || avatar_antigo, // mantém avatar atual se não trocar
        banner: bannerUrl || banner_antigo,
        cores_perfil: corSombra || corSombra_antigo,
        posicoes: posicoesJogo || posicaoAntiga
    };

    // Só inclui steamid no payload se tiver valor válido
    if (steamid !== null && steamid !== undefined && steamid !== '') {
        dados.steamid = steamid;
    }

    if (faceitid !== null && faceitid !== undefined && faceitid !== '') {
        dados.faceitid = faceitid;
    }
    


    try {
        const response = await fetch(`${API_URL}/configuracoes/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
            credentials: 'include'
        });

        if (response.ok) {
            const resultado = await response.json();
            showNotification('success', resultado.message,2000);
            if (avatarUrl) document.getElementById('ftPerfil').src = avatarUrl;
            setTimeout(() => {
                window.location.href = `perfil.html?id=${userId}`;
            }, 2200);
        } else {
            showNotification('error', 'Erro ao salvar as configurações.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        showNotification('error', 'Erro na comunicação com o servidor.');
    }
    } catch (error) {
        console.error('Erro geral ao salvar configurações:', error);
        showNotification('error', 'Erro ao processar as configurações.');
    }
}


async function preReqUploudImg(){
    const inputAvatar = document.getElementById('inputAvatar');
    const inputBanner = document.getElementById('inputBanner');

    if (inputAvatar.files && inputAvatar.files[0]) {
        let linkAvatar = await uploadImagemCloudinary(inputAvatar.files[0]);
        avatar = linkAvatar;
    }

    if (inputBanner.files && inputBanner.files[0]) {
        let linkbannerUrl = await uploadImagemCloudinary(inputBanner.files[0]);
        banner = linkbannerUrl;
    }

}


async function buscarSteamId(steamLink){
    try{
        const response = await fetch(`${API_URL}/steam/id`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: steamLink }),
        });

        const data = await response.json();
        return data.steamid;
    } catch (error) {
        console.error('Erro ao buscar SteamID:', error);
        showNotification('error', 'Erro ao buscar SteamID.');
    }
}


async function buscarDadosFaceit(link) {
    try {
        const response = await fetch(`${API_URL}/faceit/player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({link})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const faceitid = data.data.player_id;
        return faceitid;
    } catch (error) {
        console.error('Erro ao buscar dados Faceit:', error);
        return null;
    }
}


// =============================================================
// ====================== [ POSIÇÕES DE JOGO ] ======================

function mapPosicaoEmoji(posicao) {
    const imageUrl = getPositionImageSync(posicao);
    return `<img src="${imageUrl}" alt="${posicao}" class="posicao-icon">`;
}

// Função para carregar posições de jogo salvas
function carregarPosicoesJogo() {
    try {
        // Se posicaoAntiga tem dados, usar ela
        if (posicaoAntiga && posicaoAntiga.trim() !== '') {
            // Se for uma string separada por vírgulas, converter para array
            let posicoes = [];
            if (typeof posicaoAntiga === 'string') {
                posicoes = posicaoAntiga.split(',').map(p => p.trim()).filter(p => p !== '');
            } else if (Array.isArray(posicaoAntiga)) {
                posicoes = posicaoAntiga;
            }
            
            // Marcar os checkboxes correspondentes
            posicoes.forEach(posicao => {
                const checkbox = document.getElementById(`posicao-${posicao}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        } else {
            // Fallback: buscar posições salvas no localStorage
            const posicoesSalvas = localStorage.getItem('posicoesJogo');
            
            if (posicoesSalvas) {
                const posicoes = JSON.parse(posicoesSalvas);
                posicoes.forEach(posicao => {
                    const checkbox = document.getElementById(`posicao-${posicao}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar posições de jogo:', error);
    }
}

// Função para coletar posições de jogo selecionadas
function coletarPosicoesJogo() {
    const posicoes = [];
    const checkboxes = document.querySelectorAll('.posicao-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            posicoes.push(checkbox.value);
        }
    });
    return posicoes;
}

// Função para salvar posições de jogo
function salvarPosicoesJogo(posicoes) {
    try {
        localStorage.setItem('posicoesJogo', JSON.stringify(posicoes));
    } catch (error) {
        console.error('Erro ao salvar posições de jogo:', error);
    }
}

// Função para obter posições de jogo como string (para envio ao backend)
function obterPosicoesJogoString() {
    const posicoes = coletarPosicoesJogo();
    return posicoes.join(',');
}

// Função para obter posições de jogo como array (para processamento)
function obterPosicoesJogoArray() {
    return coletarPosicoesJogo();
}

// Adicionar event listeners para as posições de jogo
function configurarEventListenersPosicoes() {
    const checkboxes = document.querySelectorAll('.posicao-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const posicoes = coletarPosicoesJogo();
            salvarPosicoesJogo(posicoes);
            
        });
    });
}

// =============================================================
// ====================== [ MEDALHAS CONFIG ] ======================

// Função para carregar medalhas na página de configurações
async function carregarMedalhasConfig() {
    try {
        const auth_dados = await autenticacao();
        const userId = auth_dados.usuario.id;
        
        if (!userId) {
            console.error('Usuário não autenticado');
            return;
        }

        const response = await fetch(`${API_URL}/medalhas/usuario/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const medalhasGrid = document.getElementById('medalhasConfigGrid');
        const medalhasEmpty = document.getElementById('medalhasEmpty');

        if (!response.ok) {
            if (response.status === 404) {
                // Usuário não tem medalhas
                medalhasGrid.style.display = 'none';
                medalhasEmpty.style.display = 'block';
                return;
            }
            throw new Error('Erro ao buscar medalhas');
        }

        const medalhas = await response.json();
        
        console.log('Medalhas recebidas:', medalhas); // Debug
        
        // Verificar se medalhas é um array válido
        if (!Array.isArray(medalhas) || medalhas.length === 0) {
            // Usuário não tem medalhas
            if (medalhasGrid) medalhasGrid.style.display = 'none';
            if (medalhasEmpty) medalhasEmpty.style.display = 'block';
            return;
        }
        
        // Exibir medalhas
        if (medalhasGrid) {
            medalhasGrid.style.display = 'grid';
            medalhasGrid.innerHTML = '';
            
            medalhas.forEach(medalha => {
                console.log('Criando elemento para medalha:', medalha); // Debug
                const medalhaElement = criarElementoMedalha(medalha);
                medalhasGrid.appendChild(medalhaElement);
            });
        }
        
        if (medalhasEmpty) {
            medalhasEmpty.style.display = 'none';
        }

        

    } catch (error) {
        console.error('Erro ao carregar medalhas:', error);
        // Em caso de erro, mostra o estado vazio
        document.getElementById('medalhasConfigGrid').style.display = 'none';
        document.getElementById('medalhasEmpty').style.display = 'block';
    }
}

// Função para criar elemento de medalha
function criarElementoMedalha(medalha) {
    const div = document.createElement('div');
    div.className = 'medalha-config-item';
    
    // Determinar qual imagem usar baseado na posição da medalha
    let imagemUrl = '';
    if (medalha.position_medalha === 'campeao' || medalha.position_medalha === '1') {
        imagemUrl = medalha.imagem_url_campeao || medalha.imagem_url || '';
    } else if (medalha.position_medalha === 'segundo' || medalha.position_medalha === '2') {
        imagemUrl = medalha.imagem_url_segundo || medalha.imagem_url || '';
    } else {
        // Fallback: tenta qualquer campo de imagem disponível
        imagemUrl = medalha.imagem_url_campeao || medalha.imagem_url_segundo || medalha.imagem_url || '';
    }
    
    div.innerHTML = `
        <div class="medalha-config-content">
            <img src="${imagemUrl}" 
                 alt="${medalha.nome || 'Medalha'}" 
                 class="medalha-config-img"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=Medalha';">
            <div class="medalha-config-info">
                <h4 class="medalha-config-nome">${medalha.nome || 'Medalha'}</h4>
                <p class="medalha-config-descricao">${medalha.descricao || 'Sem descrição'}</p>
                ${medalha.position_medalha ? `<span class="medalha-config-position">${medalha.position_medalha === 'campeao' || medalha.position_medalha === '1' ? 'Campeão' : medalha.position_medalha === 'segundo' || medalha.position_medalha === '2' ? 'Segundo Lugar' : medalha.position_medalha}</span>` : ''}
                ${medalha.edicao_campeonato ? `<span class="medalha-config-edicao">Edição: ${medalha.edicao_campeonato}</span>` : ''}
            </div>
        </div>
    `;
    
    // Adicionar evento de clique para mostrar detalhes
    div.addEventListener('click', () => {
        mostrarDetalhesMedalha(medalha);
    });
    
    return div;
}

// Função para mostrar detalhes da medalha
function mostrarDetalhesMedalha(medalha) {
    // Determinar qual imagem usar
    let imagemUrl = '';
    if (medalha.position_medalha === 'campeao' || medalha.position_medalha === '1') {
        imagemUrl = medalha.imagem_url_campeao || medalha.imagem_url || '';
    } else if (medalha.position_medalha === 'segundo' || medalha.position_medalha === '2') {
        imagemUrl = medalha.imagem_url_segundo || medalha.imagem_url || '';
    } else {
        imagemUrl = medalha.imagem_url_campeao || medalha.imagem_url_segundo || medalha.imagem_url || '';
    }
    
    // Criar modal ou tooltip com detalhes da medalha
    const modal = document.createElement('div');
    modal.className = 'medalha-modal';
    modal.innerHTML = `
        <div class="medalha-modal-content">
            <span class="medalha-modal-close">&times;</span>
            <div class="medalha-modal-header">
                <img src="${imagemUrl}" alt="${medalha.nome || 'Medalha'}" class="medalha-modal-img" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=Medalha';">
                <h3>${medalha.nome || 'Medalha'}</h3>
            </div>
            <div class="medalha-modal-body">
                <p><strong>Descrição:</strong> ${medalha.descricao || 'Sem descrição'}</p>
                ${medalha.position_medalha ? `<p><strong>Posição:</strong> ${medalha.position_medalha === 'campeao' || medalha.position_medalha === '1' ? 'Campeão' : medalha.position_medalha === 'segundo' || medalha.position_medalha === '2' ? 'Segundo Lugar' : medalha.position_medalha}</p>` : ''}
                ${medalha.edicao_campeonato ? `<p><strong>Edição:</strong> ${medalha.edicao_campeonato}</p>` : ''}
                ${medalha.data_conquista ? `<p><strong>Data de Conquista:</strong> ${new Date(medalha.data_conquista).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Eventos para fechar modal
    modal.querySelector('.medalha-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// =============================================================
// ====================== [ uploud imagem ] ======================

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
// ========= COR DA SOMBRA =========
// =================================

// Função para inicializar o seletor de cor
function inicializarSeletorCor() {
    const btnSelecionarCor = document.getElementById('btnSelecionarCor');
    const inputCorSombra = document.getElementById('inputCorSombra');
    const codigoCor = document.getElementById('codigoCor');
    const rgbValor = document.getElementById('rgbValor');
    const corCirculo = document.getElementById('corCirculo');
    
    // Event listener para o botão de selecionar cor
    if (btnSelecionarCor && inputCorSombra) {
        btnSelecionarCor.addEventListener('click', function() {
            inputCorSombra.click();
        });
    }
    
    // // Event listener para mudança de cor
    // if (inputCorSombra) {
    //     inputCorSombra.addEventListener('change', function() {
    //         const corSelecionada = this.value;
    //         atualizarPreviewCor(corSelecionada);
    //         salvarCorSombra(corSelecionada);
    //     });
    // }
}

// Função para atualizar o preview da cor
function atualizarPreviewCor(cor) {
    const corCirculo = document.getElementById('corCirculo');
    
    if (corCirculo) {
        corCirculo.style.background = cor;
        corCirculo.style.boxShadow = `0 0 20px ${cor}80`;
    }
}

// Função para carregar cor salva
function carregarCorSombra() {
    const corSalva = localStorage.getItem('corSombraPerfil');
    if (corSalva) {
        const inputCorSombra = document.getElementById('inputCorSombra');
        if (inputCorSombra) {
            inputCorSombra.value = corSalva;
            atualizarPreviewCor(corSalva);
        }
    }
}


// =================================
// CHAMADAS DAS FUNÇÕES
document.addEventListener('DOMContentLoaded', verificarTimeUsuario);
document.addEventListener('DOMContentLoaded', async function() {
    // Carregar cache primeiro
    await loadPositionImagesCache();
    
    // Depois executar outras funções
    verificar_auth();
    carregarConfiguracoes();
    inicializarSeletorCor();
    carregarCorSombra();
});

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
        
        // Configurar event listeners para posições de jogo
        // configurarEventListenersPosicoes();
    }
});

addScrollProgress();

