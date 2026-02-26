let avatar = '';
let imagensMapas = {};
// let fecharPesquisaHandler = null;
let scoreteam1 = 0;
let scoreteam2 = 0;
let scoreteam1box = 0;
let scoreteam2box = 0;

// Variáveis para controle de dados Faceit/Mixcamp
let isFaceitMode = true; // Começa com Faceit como padrão
let analisePlayersData = null; // Armazenar dados do analisePlayers()

// Níveis da Faceit com links das imagens
const faceitLevels = {
    1: "https://cdn3.emoji.gg/emojis/50077-faceit-1lvl.png",
    2: "https://cdn3.emoji.gg/emojis/50077-faceit-2lvl.png",
    3: "https://cdn3.emoji.gg/emojis/35622-faceit-3lvl.png",
    4: "https://cdn3.emoji.gg/emojis/63614-faceit-4lvl.png",
    5: "https://cdn3.emoji.gg/emojis/95787-faceit-5lvl.png",
    6: "https://cdn3.emoji.gg/emojis/68460-faceit-6lvl.png",
    7: "https://cdn3.emoji.gg/emojis/67489-faceit-7lvl.png",
    8: "https://cdn3.emoji.gg/emojis/58585-faceit-8lvl.png",
    9: "https://cdn3.emoji.gg/emojis/60848-faceit-9level.png",
    10: "https://cdn3.emoji.gg/emojis/84242-faceit-10lvl.png"
};

// Dados de exemplo (substituir pelo array real do usuário)
// Para usar dados reais, chame: atualizarDadosResultado(seuArrayDeDados)
// O array deve seguir a estrutura do objeto matchData abaixo
let matchData = null;       // Dados unificados (Mixcamp + Faceit stats) usados pelas tabelas
let matchInfoData = null;   // JSON bruto da Faceit (buscarMatch), usado para player-vs, logos, etc.
let currentStatsType = 'resumo'; // Tipo atual de estatísticas sendo exibido

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
        
        document.getElementById('userAuth').classList.add('hidden');
        document.getElementById('userPerfil').classList.remove('hidden');
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
        document.getElementById('userAuth').classList.remove('hidden');
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

async function buscarPlayers(){
    try{
        const perfilResponse = await fetch(`${API_URL}/admin/usuarios`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await perfilResponse.json();
        
        return data;
    }
    catch(error){
        console.error('Erro ao buscar players:', error);
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
// ========= SISTEMA DE PARTIDAS =========


async function buscarMatch(){
    const params = new URLSearchParams(window.location.search);
    const match_id = params.get('id');
    

    
    try {
        const response = await fetch(`${API_URL}/faceit/match/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                match_id: match_id
            })
        });

        if (!response.ok) {
            console.error('Erro ao atualizar scores:', response.status);
            return;
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar partidas:', error);
    }
}

async function filtrarDadosMatch() {
    const data = await buscarMatch();
    
   
    if (!data) return;

    const demos_urls = data.demo_url
    
    const match_bo = data.best_of || 1;

    downloadDemo(demos_urls, match_bo, data)

    const team_faction1 = data.teams?.faction1?.name || 'Time A';
    const team_faction2 = data.teams?.faction2?.name || 'Time B';

    const statusMatch = document.getElementById('matchStatus');
    const bntflutuante = document.getElementById('floatingStatsBtn');
    bntflutuante.style.display = 'none';

    const match_status = data.status;
    
    if(match_status == 'FINISHED'){
        statusMatch.textContent = 'FINALIZADA';
        statusMatch.style.color = 'white';
        bntflutuante.style.display = 'flex';
        statusMatch.style.background = 'red';

    }
    else if(match_status == 'ONGOING'){
        statusMatch.textContent = 'AO VIVO';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'green';
        
    }
    else if(match_status == 'CANCELLED'){
        statusMatch.textContent = 'CANCELADA';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'grey';
        bntflutuante.style.display = 'none';
    }
    else if(match_status == 'READY'){
        statusMatch.textContent = 'JÁ VAI COMEÇAR';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'blue';
        
    }

    document.getElementById('team1Name').textContent = team_faction1;
    document.getElementById('team2Name').textContent = team_faction2;
    
    // Adicionar logos dos times (suporta avatar, avatar_time_url ou logo)
    const team1Logo = document.getElementById('team1Logo');
    const team2Logo = document.getElementById('team2Logo');
    if (team1Logo) {
        const faction1 = data.teams?.faction1 || {};
        const logoUrl = faction1.avatar || faction1.avatar_time_url || faction1.logo || '../img/cs2.png';
        team1Logo.src = logoUrl;
    }
    if (team2Logo) {
        const faction2 = data.teams?.faction2 || {};
        const logoUrl = faction2.avatar || faction2.avatar_time_url || faction2.logo || '../img/cs2.png';
        team2Logo.src = logoUrl;
    }

   
    document.getElementById('flameTeam1').style.display = 'none'
    document.getElementById('flameTeam2').style.display = 'none'


    // analisePlayers(data.teams.faction1,data.teams.faction2)
    
    // Renderiza tudo usando a mesma fonte de dados (incluindo mapas)
    await renderizarResultado(data);
}

async function atualizarDadosMatch(){
    const data = await buscarMatch();

    const statusMatch = document.getElementById('matchStatus');
    const bntflutuante = document.getElementById('floatingStatsBtn');
    
    
    const match_status = data.status;
    
    
    if(match_status == 'FINISHED'){
        statusMatch.textContent = 'FINALIZADA';
        statusMatch.style.color = 'white';
        bntflutuante.style.display = 'flex';
        statusMatch.style.background = 'red';

    }
    else if(match_status == 'ONGOING'){
        statusMatch.textContent = 'AO VIVO';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'green';
        
    }
    else if(match_status == 'CANCELLED'){
        statusMatch.textContent = 'CANCELADA';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'red';
        bntflutuante.style.display = 'none';
    }
    else if(match_status == 'READY'){
        statusMatch.textContent = 'JÁ VAI COMEÇAR';
        statusMatch.style.color = 'white';
        statusMatch.style.background = 'blue';
        
    }
    // const match_team_winner = data.results.winner; pode ser usado em md3 
    const match_score_faction1 = data.results.score.faction1;
    
    
    const match_score_faction2 = data.results.score.faction2;

    document.getElementById('team2Score').textContent = match_score_faction2;
    document.getElementById('team1Score').textContent = match_score_faction1;


    if (match_score_faction1 > scoreteam1 ){
        scoreteam1box += 1;
        scoreteam2box = 0;
        scoreteam1 = match_score_faction1;
        
    }

    if (match_score_faction2 > scoreteam2 ){
        scoreteam2box += 1;
        scoreteam1box = 0;
        scoreteam2 = match_score_faction2;
        
    }


    if (scoreteam1box >= 3){
        
        document.getElementById('flameTeam1').style.display = 'block';
        document.getElementById('flameTeam2').style.display = 'none'
    }
    else if (scoreteam2box >= 3){
        
        document.getElementById('flameTeam2').style.display = 'block';
        document.getElementById('flameTeam1').style.display = 'none'
    }
    
    
    // const team_faction1 = data.teams.faction1.name;
    // const team_faction2 = data.teams.faction2.name;

    // document.getElementById('team1Name').textContent = team_faction1;
    // document.getElementById('team2Name').textContent = team_faction2;

}

async function analisePlayers(){
    let faction1data = []
    let faction2data = []
    let teamid = []
    let faction1playersconfirmed = []
    let faction1playersNotconfirmed = []
    let faction2playersconfirmed = []
    let faction2playersNotconfirmed = []
    let teams = []
   

    const playersMix = await buscarPlayers();
    const data = await buscarMatch();
    
    
    


    for (const playerFaceitSteamId of data.teams.faction1.roster){
        for (const player of playersMix.usuarios){
            if(player.steamid == playerFaceitSteamId.game_player_id){
                faction1data.push({
                    username: player.username,
                    avatar: player.avatar_url,
                    banner_url: player.banner_url,
                    // faceitid do usuário no Mixcamp (mesmo que player_id da Faceit)
                    faceitid: player.faceitid,
                    nickname: playerFaceitSteamId.nickname,
                    avatarFaceit: playerFaceitSteamId.avatar,
                    skill_level: playerFaceitSteamId.game_skill_level,
                    time_id: player.time_id,
                    time_nome: player.time_nome,
                    time_tag: player.time_tag,
                    time_avatar: player.avatar_time_url
                })
                teamid.push(player.time_id)  
            } 
        }
    }

    

    for (const user of faction1data){ 
        if (user.time_id == teamid[0]){
            faction1playersconfirmed.push(user)
        }
        else{
            faction1playersconfirmed.push(user)
            faction1playersNotconfirmed.push(user)
        }
    }

    faction1data = {
        playersconfirmados: faction1playersconfirmed,
        playersnotconfirmados: faction1playersNotconfirmed
    }
    teamid = []
      


    for (const playerFaceitSteamId of data.teams.faction2.roster){
        for (const player of playersMix.usuarios){
            if(player.steamid == playerFaceitSteamId.game_player_id){
                faction2data.push({
                    username: player.username,
                    avatar: player.avatar_url,
                    banner_url: player.banner_url,
                    // faceitid do usuário no Mixcamp (mesmo que player_id da Faceit)
                    faceitid: player.faceitid,
                    nickname: playerFaceitSteamId.nickname,
                    avatarFaceit: playerFaceitSteamId.avatar,
                    skill_level: playerFaceitSteamId.game_skill_level,
                    time_id: player.time_id,
                    time_nome: player.time_nome,
                    time_tag: player.time_tag,
                    time_avatar: player.avatar_time_url
                })
                teamid.push(player.time_id)
            }
        }
    }


    for (const user of faction2data){ 
        if (user.time_id == teamid[0]){
            faction2playersconfirmed.push(user)
        }
        else{
            faction2playersconfirmed.push(user)
            faction2playersNotconfirmed.push(user)
        }
    }

    faction2data = {
        playersconfirmados: faction2playersconfirmed,
        playersnotconfirmados: faction2playersNotconfirmed
    }

    // Montar objeto teams usando, de preferência, os dados do Mixcamp.
    // Se não houver jogadores confirmados, usar fallback com dados da Faceit (buscarMatch).
    try {
        const faction1Confirmados = faction1data.playersconfirmados || [];
        const faction2Confirmados = faction2data.playersconfirmados || [];

        const hasFaction1Mix = faction1Confirmados.length > 0;
        const hasFaction2Mix = faction2Confirmados.length > 0;

        // Dados da Faceit vindos de buscarMatch()
        const faction1Faceit = data.teams?.faction1 || {};
        const faction2Faceit = data.teams?.faction2 || {};

        const baseFaction1 = hasFaction1Mix ? faction1Confirmados[0] : {};
        const baseFaction2 = hasFaction2Mix ? faction2Confirmados[0] : {};
    
    teams = {
        faction1: {
                time_id: baseFaction1.time_id || faction1Faceit.faction_id || '',
                time_nome: baseFaction1.time_nome || faction1Faceit.name || 'Time 1',
                time_tag: baseFaction1.time_tag || '',
                time_avatar: baseFaction1.time_avatar || faction1Faceit.avatar || '../img/cs2.png'
        },
        faction2: {
                time_id: baseFaction2.time_id || faction2Faceit.faction_id || '',
                time_nome: baseFaction2.time_nome || faction2Faceit.name || 'Time 2',
                time_tag: baseFaction2.time_tag || '',
                time_avatar: baseFaction2.time_avatar || faction2Faceit.avatar || '../img/cs2.png'
            }
        };
    } catch (error) {
        console.error('Erro ao montar teams (Mixcamp/Faceit):', error);
        // Fallback final: times genéricos, só para não quebrar a tela
        teams = {
            faction1: {
                time_id: '',
                time_nome: 'Time 1',
                time_tag: '',
                time_avatar: '../img/cs2.png'
            },
            faction2: {
                time_id: '',
                time_nome: 'Time 2',
                time_tag: '',
                time_avatar: '../img/cs2.png'
        }
        };
    }

    



    document.getElementById('team1Name').textContent = teams.faction1.time_nome;
    document.getElementById('team2Name').textContent = teams.faction2.time_nome;

    document.getElementById('team1Logo').src = teams.faction1.time_avatar;
    document.getElementById('team2Logo').src = teams.faction2.time_avatar;
    
    // Retornar como array para poder desestruturar
    const dados = {
        faction1data: faction1data,
        faction2data: faction2data,
        teams: teams
    }
    await buscarInfoMatchIdStatus(dados)
    return [faction1data, faction2data, teams];
}


async function buscarInfoMatchIdStatus(dadosMixCamp){
    const params = new URLSearchParams(window.location.search);
    const match_id = params.get('id');


    const MixCampdados = dadosMixCamp;
    const matchInfoData = await buscarMatch();
    

    

    
    try {
        if(matchInfoData.status == 'FINISHED'){
            const response = await fetch(`${API_URL}/faceit/match/info/stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    match_id: match_id
                })
            });

            if (!response.ok) {
                console.error('Erro ao atualizar scores:', response.status);
                return;
            }

            const statsData = await response.json();

            // Unir dados do Mixcamp (analisePlayers) com os stats detalhados da Faceit
            integrarStatsFaceitComMixcamp(MixCampdados, statsData);

            return statsData;
        }
        else{
            return;
        }
        
    } catch (error) {
        console.error('Erro ao buscar partidas:', error);
    }
}

// Buscar stats e calcular MVP quando não há dados do Mixcamp
async function buscarInfoMatchIdStatusSomenteFaceit(){
    const params = new URLSearchParams(window.location.search);
    const match_id = params.get('id');
    
    try {
        const response = await fetch(`${API_URL}/faceit/match/info/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                match_id: match_id
            })
        });

        if (!response.ok) {
            console.error('Erro ao buscar stats da Faceit:', response.status);
            return;
        }

        const statsData = await response.json();

        // Criar um objeto vazio para dadosMixCamp (já que não há Mixcamp)
        // A função integrarStatsFaceitComMixcamp vai usar o fallback da Faceit
        const dadosMixCampVazio = {
            faction1data: { playersconfirmados: [] },
            faction2data: { playersconfirmados: [] },
            teams: {}
        };

        // Unir dados (vai usar fallback da Faceit)
        integrarStatsFaceitComMixcamp(dadosMixCampVazio, statsData);

        return statsData;
        
    } catch (error) {
        console.error('Erro ao buscar stats da Faceit:', error);
    }
}

/**
 * Calcula o MVP da partida MD1 baseado nos stats dos players
 * Considera apenas: ADR, K/R Ratio e MVPs (fatores mais importantes)
 * 
 * @param {Array} allPlayers - Array com todos os players de ambos os times (formato unificado)
 * @returns {Object|null} Objeto MVP no formato esperado por renderizarMVP() ou null
 */
function calcularMVP(allPlayers) {
    if (!allPlayers || allPlayers.length === 0) {
        return null;
    }

    // Calcular pontuação para cada player baseado em ADR, K/R Ratio e MVPs
    const playersComPontuacao = allPlayers.map(player => {
        const rawStats = player.rawStats || {};
        
        // Valores dos 3 fatores mais importantes
        const adr = parseFloat(rawStats['ADR'] || '0');
        const krRatio = parseFloat(rawStats['K/R Ratio'] || '0');
        const mvps = parseInt(rawStats['MVPs'] || '0', 10);
        
        // Sistema de pontuação (apenas os 3 fatores mais importantes)
        // ADR: peso 0.4 (muito importante - mostra consistência de dano)
        // K/R Ratio: peso 3.0 (muito importante - mostra eficiência de kills por round)
        // MVPs: peso 5.0 (MUITO importante - indica impacto em rounds decisivos)
        
        const pontuacao = 
            (adr * 0.4) +          // ADR mostra consistência de dano
            (krRatio * 3.0) +      // K/R Ratio mostra eficiência de kills
            (mvps * 5.0);          // MVPs mostram impacto em rounds decisivos
        
        return {
            ...player,
            mvpScore: pontuacao,
            rawStats: rawStats
        };
    });

    // Ordenar por pontuação (maior primeiro)
    playersComPontuacao.sort((a, b) => b.mvpScore - a.mvpScore);
    
    // O MVP é o player com maior pontuação
    const mvp = playersComPontuacao[0];
    
    if (!mvp) {
        return null;
    }

    // Calcular highlights (melhores em cada categoria)
    const highlights = {
        kills: { player: '', value: 0 },
        damage: { player: '', value: 0 },
        kast: { player: '', value: 0 },
        firstKills: { player: '', value: 0 }
    };

    allPlayers.forEach(player => {
        const playerRawStats = player.rawStats || {};
        const kills = parseInt(player.stats?.kills || '0', 10);
        const damage = parseInt(playerRawStats['Damage'] || '0', 10);
        const firstKills = parseInt(playerRawStats['First Kills'] || '0', 10);
        
        // Função auxiliar para obter o nome correto (preferir nicknameFaceit)
        const getPlayerName = (p) => p.nicknameFaceit || p.nickname || p.username || 'Player';
        
        // Mais kills
        if (kills > highlights.kills.value) {
            highlights.kills = {
                player: getPlayerName(player),
                value: kills
            };
        }
        
        // Mais damage
        if (damage > highlights.damage.value) {
            highlights.damage = {
                player: getPlayerName(player),
                value: damage
            };
        }
        
        // Mais first kills
        if (firstKills > highlights.firstKills.value) {
            highlights.firstKills = {
                player: getPlayerName(player),
                value: firstKills
            };
        }
    });

    // KAST (Kill, Assist, Survive, Trade) - calcular para cada player
    // Aproximação: (Kills + Assists) / (Kills + Deaths) * 100
    let melhorKast = { player: '', value: 0 };
    allPlayers.forEach(player => {
        const kills = parseInt(player.stats?.kills || '0', 10);
        const assists = parseInt(player.stats?.assists || '0', 10);
        const deaths = parseInt(player.stats?.deaths || '0', 10);
        
        const totalRounds = kills + deaths;
        if (totalRounds > 0) {
            const kastAprox = ((kills + assists) / totalRounds) * 100;
            if (kastAprox > melhorKast.value) {
                melhorKast = {
                    player: player.nicknameFaceit || player.nickname || player.username || 'Player',
                    value: parseFloat(kastAprox.toFixed(1))
                };
            }
        }
    });
    highlights.kast = melhorKast;

    // Usar nicknameFaceit (nickname da Faceit) como nome do MVP quando disponível
    const mvpNome = mvp.nicknameFaceit || mvp.nickname || mvp.username || 'Player';
    
    return {
        nome: mvpNome,
        avatar: mvp.avatar || '../img/avatar.jpg',
        rating: parseFloat(mvp.stats?.rating || '0'),
        highlights: highlights
    };
}

/**
 * Une os dados do Mixcamp (analisePlayers) com os stats da Faceit
 * e monta um objeto no formato esperado por renderizarTabelas().
 * Também atualiza matchData e exibe resultado-content.
 *
 * @param {Object} dadosMixCamp - Objeto com faction1data, faction2data e teams (retorno do analisePlayers)
 * @param {Object} statsData - Objeto retornado pela rota /faceit/match/info/stats
 */
function integrarStatsFaceitComMixcamp(dadosMixCamp, statsData) {
    if (!dadosMixCamp || !statsData || !Array.isArray(statsData.rounds) || !statsData.rounds[0]) {
        return;
    }

    const round = statsData.rounds[0];
    const statsTeams = Array.isArray(round.teams) ? round.teams : [];

    // ===== 1. Criar mapas auxiliares de jogadores do Mixcamp por faceitid =====
    const faction1Confirmados = dadosMixCamp.faction1data?.playersconfirmados || [];
    const faction2Confirmados = dadosMixCamp.faction2data?.playersconfirmados || [];

    /** @type {Record<string, any>} */
    const mapFaction1ByFaceitId = {};
    /** @type {Record<string, any>} */
    const mapFaction2ByFaceitId = {};

    faction1Confirmados.forEach((player) => {
        if (player.faceitid) {
            mapFaction1ByFaceitId[player.faceitid] = player;
        }
    });

    faction2Confirmados.forEach((player) => {
        if (player.faceitid) {
            mapFaction2ByFaceitId[player.faceitid] = player;
        }
    });

    // ===== 1.1. Mapear avatares da Faceit a partir do JSON bruto (matchInfoData) =====
    const faceitAvatarMap = {
        faction1: {},
        faction2: {}
    };

    if (matchInfoData?.teams?.faction1?.roster) {
        matchInfoData.teams.faction1.roster.forEach(p => {
            if (p.player_id) {
                faceitAvatarMap.faction1[p.player_id] = p.avatar || '';
            }
        });
    }
    if (matchInfoData?.teams?.faction2?.roster) {
        matchInfoData.teams.faction2.roster.forEach(p => {
            if (p.player_id) {
                faceitAvatarMap.faction2[p.player_id] = p.avatar || '';
            }
        });
    }

    // ===== 2. Descobrir qual time de stats é faction1 e qual é faction2 =====
    const unifiedTeams = {
        faction1: null,
        faction2: null
    };

    statsTeams.forEach((statsTeam, index) => {
        const players = statsTeam.players || [];

        // Verificar se algum player pertence à faction1:
        // 1. Por player_id (caso normal)
        // 2. Por team_id (caso do valen666- onde faceitid = team_id)
        const hasFaction1Player = players.some((p) => 
            mapFaction1ByFaceitId[p.player_id] || 
            (statsTeam.team_id && mapFaction1ByFaceitId[statsTeam.team_id])
        );

        const factionKey = hasFaction1Player ? 'faction1' : 'faction2';

        unifiedTeams[factionKey] = {
            statsTeam,
            players
        };
    });

    // Fallback: se não foi possível identificar claramente faction1/faction2 pelo Mixcamp,
    // garantir que cada lado receba um time da Faceit para não quebrar a lógica.
    if (!unifiedTeams.faction1 && statsTeams[0]) {
        unifiedTeams.faction1 = {
            statsTeam: statsTeams[0],
            players: statsTeams[0].players || []
        };
    }
    if (!unifiedTeams.faction2 && statsTeams[1]) {
        unifiedTeams.faction2 = {
            statsTeam: statsTeams[1],
            players: statsTeams[1].players || []
        };
    }

    // ===== 3. Função auxiliar para montar o objeto de um time no formato esperado por renderizarTabelas =====
    function montarFactionData(factionKey, mixMapById) {
        const entry = unifiedTeams[factionKey];
        if (!entry) return null;

        const { players, statsTeam } = entry;
        const mixTeamInfo = dadosMixCamp.teams?.[factionKey] || {};

        // Montar roster unificado
        const roster = players.map((p) => {
            let mixPlayer = null;
            
            // Caso especial: se o player_id é igual ao team_id, esse player é o criador do time
            // (caso do valen666- onde faceitid = team_id porque a Faceit cria o time com dados de um player)
            if (p.player_id === statsTeam.team_id) {
                // Fazer match pelo team_id (que é o faceitid do valen no Mixcamp)
                mixPlayer = mixMapById[statsTeam.team_id];
            } else {
                // Caso normal: fazer match pelo player_id
                mixPlayer = mixMapById[p.player_id];
            }
            
            const pStats = p.player_stats || {};

            // Converter campos principais que a tabela usa
            const kills = parseInt(pStats['Kills'] || '0', 10);
            const deaths = parseInt(pStats['Deaths'] || '0', 10);
            const assists = parseInt(pStats['Assists'] || '0', 10);
            const kd = parseFloat(pStats['K/D Ratio'] || '0').toFixed(2);
            const rating = parseFloat(pStats['K/D Ratio'] || '0').toFixed(3);

            // username = nome do Mixcamp (quando existe)
            const username = mixPlayer?.username || p.nickname || 'Player';
            // nicknameFaceit = nickname da Faceit (quando existe)
            const nicknameFaceit = p.nickname || mixPlayer?.nickname || '';
            
            // avatarFaceit: usar, na ordem:
            // 1. avatarFaceit vindo do Mixcamp
            // 2. avatar da Faceit vindo do JSON bruto (matchInfoData)
            // Se avatarFaceit estiver vazio, deixar vazio (não mostrar imagem extra)
            const avatarFaceitFromMix = (mixPlayer?.avatarFaceit && mixPlayer.avatarFaceit.trim() !== '')
                ? mixPlayer.avatarFaceit
                : '';
            const avatarFaceitFromMatch = faceitAvatarMap[factionKey]?.[p.player_id] || '';
            const avatarFaceit = avatarFaceitFromMix || avatarFaceitFromMatch || '';

            // avatar principal: preferir avatar Mixcamp, depois avatarFaceit (Mixcamp ou Faceit), depois padrão
            const avatar = mixPlayer?.avatar || avatarFaceit || '../img/avatar.jpg';
            
            return {
                // Guardar dados de identificação para usar na tabela
                nickname: username,          // nome principal (Mixcamp)
                username: username,
                nicknameFaceit: nicknameFaceit,
                avatarFaceit: avatarFaceit,
                avatar: avatar,
                faceitid: p.player_id,
                stats: {
                    rating: rating,
                    kills: kills,
                    deaths: deaths,
                    assists: assists,
                    kd: kd
                },
                // Guardar stats brutos da Faceit para cálculo de MVP
                rawStats: pStats
            };
            
        });

        // Calcular um "rating" de time simples: média do K/D dos jogadores
        let teamRating = '0.000';
        if (roster.length > 0) {
            const somaKd = roster.reduce((acc, player) => {
                const value = parseFloat(player.stats.kd || '0');
                return acc + (isNaN(value) ? 0 : value);
            }, 0);
            const mediaKd = somaKd / roster.length;
            teamRating = mediaKd.toFixed(3);
        }

        // Nome do time Mixcamp e Faceit
        const timeNomeMixcamp = mixTeamInfo.time_nome || '';
        const timeNomeFaceit = statsTeam.team_stats?.Team || '';
        const timeNome = timeNomeMixcamp || timeNomeFaceit || (factionKey === 'faction1' ? 'Time A' : 'Time B');
        
        return {
            name: timeNome,
            nameFaceit: timeNomeFaceit, // Nome do time da Faceit para exibir nos parênteses
            avatar: mixTeamInfo.time_avatar || '../img/cs2.png',
            stats: {
                rating: teamRating
            },
            roster: roster
        };
    }

    const faction1Unified = montarFactionData('faction1', mapFaction1ByFaceitId);
    const faction2Unified = montarFactionData('faction2', mapFaction2ByFaceitId);

    // Se ainda assim não conseguiu montar os dois times, tentar um fallback 100% Faceit
    if (!faction1Unified || !faction2Unified) {

        function montarFactionDataSomenteFaceit(factionKey, statsTeamIndexFallback) {
            const statsTeam = statsTeams[statsTeamIndexFallback];
            if (!statsTeam) return null;

            const players = statsTeam.players || [];
            const roster = players.map((p) => {
                const pStats = p.player_stats || {};
                const kills = parseInt(pStats['Kills'] || '0', 10);
                const deaths = parseInt(pStats['Deaths'] || '0', 10);
                const assists = parseInt(pStats['Assists'] || '0', 10);
                const kd = parseFloat(pStats['K/D Ratio'] || '0').toFixed(2);
                const rating = parseFloat(pStats['K/D Ratio'] || '0').toFixed(3);

                const username = p.nickname || 'Player';
                
                // Buscar avatar do matchInfoData se disponível
                let avatar = '../img/avatar.jpg';
                if (matchInfoData?.teams) {
                    const allRosters = [
                        ...(matchInfoData.teams.faction1?.roster || []),
                        ...(matchInfoData.teams.faction2?.roster || [])
                    ];
                    const faceitPlayer = allRosters.find(fp => fp.player_id === p.player_id);
                    if (faceitPlayer && faceitPlayer.avatar) {
                        avatar = faceitPlayer.avatar;
                    }
                }

                return {
                    nickname: username,
                    username: username,
                    nicknameFaceit: p.nickname || '',
                    avatarFaceit: avatar !== '../img/avatar.jpg' ? avatar : '',
                    avatar: avatar,
                    faceitid: p.player_id,
                    stats: {
                        rating,
                        kills,
                        deaths,
                        assists,
                        kd
                    },
                    rawStats: pStats  // IMPORTANTE: rawStats contém ADR, MVPs, etc. para cálculo do MVP
                };
            });

            const timeNomeFaceit = statsTeam.team_stats?.Team || (factionKey === 'faction1' ? 'Time A' : 'Time B');

            // Nome + info só da Faceit
            return {
                name: timeNomeFaceit,
                nameFaceit: timeNomeFaceit,
                avatar: '../img/cs2.png',
                stats: {
                    rating: roster.length
                        ? (roster.reduce((acc, p) => acc + parseFloat(p.stats.kd || '0'), 0) / roster.length).toFixed(3)
                        : '0.000'
                },
                roster
            };
        }

        const fallbackFaction1 = faction1Unified || montarFactionDataSomenteFaceit('faction1', 0);
        const fallbackFaction2 = faction2Unified || montarFactionDataSomenteFaceit('faction2', 1);

        if (!fallbackFaction1 || !fallbackFaction2) {
            return;
        }

        // Sobrescrever com fallback
        // prosseguir usando fallbackFaction1 / fallbackFaction2
        // (mantendo os nomes das variáveis utilizadas abaixo)
        var faction1UnifiedFinal = fallbackFaction1;
        var faction2UnifiedFinal = fallbackFaction2;

        // Continuar fluxo com esses valores
        return montarUnifiedMatchDataComFactions(round, faction1UnifiedFinal, faction2UnifiedFinal);
    }

    // Caminho normal: seguir com os unified montados acima
    return montarUnifiedMatchDataComFactions(round, faction1Unified, faction2Unified);
}

// Função auxiliar para montar unifiedMatchData a partir de duas factions já unificadas
function montarUnifiedMatchDataComFactions(round, faction1Unified, faction2Unified) {
    // ===== 4. Calcular MVP apenas para partidas MD1 (best_of === 1) =====
    // Tentar buscar best_of do matchInfoData primeiro (mais confiável), depois do round
    let bestOf = null;
    if (matchInfoData?.best_of !== undefined && matchInfoData?.best_of !== null) {
        bestOf = parseInt(matchInfoData.best_of, 10);
    } else if (round.best_of !== undefined && round.best_of !== null) {
        bestOf = parseInt(round.best_of, 10);
    } else {
        bestOf = 1; // Default para MD1
    }
    
    let mvp = null;
    
    if (bestOf === 1) {
        // Juntar todos os players de ambos os times para calcular o MVP
        const allPlayers = [
            ...(faction1Unified.roster || []),
            ...(faction2Unified.roster || [])
        ];
        
        // Calcular MVP baseado em ADR, K/R Ratio e MVPs
        mvp = calcularMVP(allPlayers);
    }

    // ===== 5. Montar objeto final compatível com renderizarTabelas / toggleVisualizacaoEstatisticas =====
    const unifiedMatchData = {
        best_of: bestOf,
        status: 'FINISHED', // stats só existe quando a partida acabou
        region: round.round_stats?.Region || 'N/A',
        teams: {
            faction1: faction1Unified,
            faction2: faction2Unified
        },
        // Adicionar MVP apenas se foi calculado (MD1)
        mvp: mvp || null
    };

    // Atualizar variável global para que toggleVisualizacaoEstatisticas use esses dados
    matchData = unifiedMatchData;

    // Preencher imediatamente as tabelas com os stats detalhados
    renderizarTabelas(unifiedMatchData);
    
    // Renderizar MVP se foi calculado (apenas para MD1)
    if (mvp) {
        renderizarMVP(unifiedMatchData);
    }

    // (Opcional) Atualizar painel de estatísticas flutuante com esses dados
    atualizarPainelEstatisticas();

    // ===== 5. Garantir que a área de estatísticas esteja visível =====
    const resultadoContent = document.querySelector('.resultado-content');
    const matchTeamsVs = document.getElementById('matchTeamsVs');
    
    if (matchTeamsVs) {
        matchTeamsVs.classList.add('hidden');
    }
    if (resultadoContent) {
        resultadoContent.classList.add('show');
    }
}

// buscarInfoMatchIdStatus();

// Variável global para armazenar dados de demo
let demoData = {
    urls: [],
    match_bo: 1,
    mapas: []
};

async function downloadDemo(dataurl, match_bo, matchDataParam = null) {
    // Armazenar dados globalmente
    demoData.urls = dataurl || [];
    demoData.match_bo = match_bo || 1;
    
    // Buscar dados dos mapas - usar parâmetro ou matchData global
    const dataSource = matchDataParam || matchData;
    if (dataSource) {
        const mapasData = dataSource.voting?.map?.pick || [];
        demoData.mapas = mapasData.slice(0, match_bo);
    }
    
    // Configurar evento do botão
    const floatingDemoBtn = document.getElementById('floatingDemoBtn');
    if (floatingDemoBtn) {
        // Remover event listeners anteriores para evitar duplicação
        const newBtn = floatingDemoBtn.cloneNode(true);
        floatingDemoBtn.parentNode.replaceChild(newBtn, floatingDemoBtn);
        
        newBtn.addEventListener('click', () => {
            criarDivsDownloadDemo();
        });
    }
}

// Função para criar as divs de download de demo
function criarDivsDownloadDemo() {
    const floatingContainer = document.querySelector('.floating-buttons-container');
    if (!floatingContainer) return;
    
    // Remover container anterior se existir
    const existingContainer = document.getElementById('demoDownloadsContainer');
    if (existingContainer) {
        existingContainer.remove();
        return; // Se já existe, apenas fecha (toggle)
    }
    
    // Verificar se há dados de demo
    if (!demoData.urls || demoData.urls.length === 0) {
        showNotification('alert', 'Nenhuma demo disponível para esta partida.');
        return;
    }
    
    // Buscar mapas do matchData se não estiverem em demoData
    let mapas = demoData.mapas || [];
    if (mapas.length === 0 && matchData) {
        const mapasData = matchData.voting?.map?.pick || [];
        mapas = mapasData.slice(0, demoData.match_bo);
    }
    
    // Criar container de downloads
    const downloadsContainer = document.createElement('div');
    downloadsContainer.id = 'demoDownloadsContainer';
    downloadsContainer.className = 'demo-downloads-container';
    
    const match_bo = demoData.match_bo;
    const demoUrls = demoData.urls;
    
    // Determinar quantos mapas criar baseado no match_bo
    const quantidadeMapas = match_bo === 1 ? 1 : match_bo === 3 ? 3 : 5;
    
    // Criar div para cada mapa
    for (let i = 0; i < quantidadeMapas && i < demoUrls.length; i++) {
        const demoUrl = demoUrls[i];
        const mapaNome = mapas[i] || `Mapa ${i + 1}`;
        
        // Normalizar nome do mapa para buscar imagem
        const mapaPuro = mapaNome.replace(/^de_/, '').toLowerCase();
        const nomeFormatado = mapaPuro.charAt(0).toUpperCase() + mapaPuro.slice(1);
        
        // Buscar imagem do mapa
        const imageUrl = imagensMapas[nomeFormatado] || 
                         imagensMapas[mapaPuro] || 
                         imagensMapas[mapaNome] ||
                         'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        
        // Criar div do item
        const downloadItem = document.createElement('div');
        downloadItem.className = 'demo-download-item';
        
        // Criar imagem do mapa
        const mapImage = document.createElement('img');
        mapImage.src = imageUrl;
        mapImage.alt = mapaNome;
        mapImage.className = 'demo-map-image';
        mapImage.onerror = function() {
            this.src = 'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        };
        
        // Criar container de informações
        const infoContainer = document.createElement('div');
        infoContainer.className = 'demo-download-info';
        
        // Nome do mapa
        const mapName = document.createElement('div');
        mapName.className = 'demo-map-name';
        mapName.textContent = mapaPuro.toUpperCase();
        
        // Botão de download
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'demo-download-btn';
        downloadBtn.textContent = 'Download Demo';
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (demoUrl) {

                const faceit_link = 'https://www.faceit.com/pt/cs2/room/'
                const params = new URLSearchParams(window.location.search);
                const match_id = params.get('id');
                window.open(`${faceit_link}${match_id}`, '_blank');
                // window.open(demoUrl, '_blank');
            } else {
                showNotification('alert', 'URL da demo não disponível.');
            }
        });
        
        // Montar estrutura
        infoContainer.appendChild(mapName);
        infoContainer.appendChild(downloadBtn);
        downloadItem.appendChild(mapImage);
        downloadItem.appendChild(infoContainer);
        downloadsContainer.appendChild(downloadItem);
    }
    
    // Inserir container acima do botão de demo
    const floatingDemoBtn = document.getElementById('floatingDemoBtn');
    if (floatingDemoBtn && floatingDemoBtn.parentNode) {
        floatingContainer.insertBefore(downloadsContainer, floatingDemoBtn);
    }
    
    // Adicionar evento para fechar ao clicar fora
    setTimeout(() => {
        document.addEventListener('click', function fecharDownloads(e) {
            if (!downloadsContainer.contains(e.target) && 
                !floatingDemoBtn.contains(e.target)) {
                downloadsContainer.remove();
                document.removeEventListener('click', fecharDownloads);
            }
        });
    }, 100);
}


// Carregar dados do resultado
async function carregarDadosResultado() {
    // Obter ID da partida da URL
    const urlParams = new URLSearchParams(window.location.search);
    const partidaId = urlParams.get('id');
    
    if (partidaId) {
        try {
            const response = await fetch(`${API_URL}/partidas/${partidaId}/resultado`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                matchData = data;
                await renderizarResultado(data);
            } else {
                // Se não houver dados da API, usar dados de exemplo
                await usarDadosExemplo();
            }
        } catch (error) {
            console.error('Erro ao carregar resultado:', error);
            await usarDadosExemplo();
        }
    } else {
        // Se não houver ID, usar dados de exemplo
        usarDadosExemplo();
    }
}

// Usar dados de exemplo (estrutura baseada na imagem)
async function usarDadosExemplo() {
    matchData = {
        team1: {
            nome: 'picafumo',
            logo: '../img/cs2.png',
            score: 0,
            rating: 2.053,
            players: [
                {
                    nome: 'EduBalaaa',
                    avatar: '../img/avatar.jpg',
                    rating: 2.424,
                    rws: 0,
                    kills: 32,
                    deaths: 31,
                    assists: 5,
                    adr: 92.6,
                    kd: 1.03,
                    kr: 0.84,
                    hs: 22,
                    hsPercent: 68.8,
                    kills5: 0,
                    kills4: 0,
                    kills3: 1,
                    kills2: 8,
                    mvps: 3
                },
                {
                    nome: 'casca--',
                    avatar: '../img/avatar.jpg',
                    rating: 2.163,
                    rws: 0,
                    kills: 23,
                    deaths: 28,
                    assists: 10,
                    adr: 80.8,
                    kd: 0.82,
                    kr: 0.61,
                    hs: 15,
                    hsPercent: 65.2,
                    kills5: 0,
                    kills4: 1,
                    kills3: 0,
                    kills2: 4,
                    mvps: 4
                },
                {
                    nome: 'Insanityl',
                    avatar: '../img/avatar.jpg',
                    rating: 2.023,
                    rws: 0,
                    kills: 22,
                    deaths: 29,
                    assists: 7,
                    adr: 68.0,
                    kd: 0.76,
                    kr: 0.58,
                    hs: 10,
                    hsPercent: 45.5,
                    kills5: 0,
                    kills4: 0,
                    kills3: 2,
                    kills2: 2,
                    mvps: 4
                },
                {
                    nome: 'LangBST',
                    avatar: '../img/avatar.jpg',
                    rating: 2.007,
                    rws: 0,
                    kills: 21,
                    deaths: 28,
                    assists: 6,
                    adr: 56.7,
                    kd: 0.75,
                    kr: 0.55,
                    hs: 8,
                    hsPercent: 38.1,
                    kills5: 0,
                    kills4: 0,
                    kills3: 1,
                    kills2: 4,
                    mvps: 1
                },
                {
                    nome: 'Tiger_dlll',
                    avatar: '../img/avatar.jpg',
                    rating: 1.548,
                    rws: 0,
                    kills: 16,
                    deaths: 29,
                    assists: 9,
                    adr: 45.5,
                    kd: 0.55,
                    kr: 0.42,
                    hs: 5,
                    hsPercent: 31.3,
                    kills5: 0,
                    kills4: 0,
                    kills3: 2,
                    kills2: 0,
                    mvps: 0
                }
            ]
        },
        team2: {
            nome: 'NOX-CLAN',
            logo: '../img/cs2.png',
            score: 2,
            rating: 2.516,
            players: [
                {
                    nome: 'rosseti',
                    avatar: '../img/avatar.jpg',
                    rating: 2.471,
                    rws: 0,
                    kills: 34,
                    deaths: 24,
                    assists: 7,
                    adr: 96.2,
                    kd: 1.42,
                    kr: 0.89,
                    hs: 9,
                    hsPercent: 26.5,
                    kills5: 0,
                    kills4: 1,
                    kills3: 7,
                    kills2: 7,
                    mvps: 7
                },
                {
                    nome: 'keppq',
                    avatar: '../img/avatar.jpg',
                    rating: 2.761,
                    rws: 0,
                    kills: 35,
                    deaths: 27,
                    assists: 11,
                    adr: 95.2,
                    kd: 1.30,
                    kr: 0.92,
                    hs: 15,
                    hsPercent: 42.9,
                    kills5: 0,
                    kills4: 0,
                    kills3: 9,
                    kills2: 8,
                    mvps: 8
                },
                {
                    nome: 'ronaldobalan',
                    avatar: '../img/avatar.jpg',
                    rating: 2.451,
                    rws: 0,
                    kills: 27,
                    deaths: 18,
                    assists: 5,
                    adr: 78.0,
                    kd: 1.50,
                    kr: 0.71,
                    hs: 16,
                    hsPercent: 59.3,
                    kills5: 1,
                    kills4: 0,
                    kills3: 1,
                    kills2: 5,
                    mvps: 5
                },
                {
                    nome: 'TH--',
                    avatar: '../img/avatar.jpg',
                    rating: 2.620,
                    rws: 0,
                    kills: 25,
                    deaths: 24,
                    assists: 8,
                    adr: 68.7,
                    kd: 1.04,
                    kr: 0.66,
                    hs: 15,
                    hsPercent: 60.0,
                    kills5: 0,
                    kills4: 0,
                    kills3: 1,
                    kills2: 5,
                    mvps: 3
                },
                {
                    nome: 'tg5-',
                    avatar: '../img/avatar.jpg',
                    rating: 2.279,
                    rws: 0,
                    kills: 23,
                    deaths: 25,
                    assists: 8,
                    adr: 58.7,
                    kd: 0.92,
                    kr: 0.61,
                    hs: 14,
                    hsPercent: 60.9,
                    kills5: 0,
                    kills4: 0,
                    kills3: 1,
                    kills2: 2,
                    mvps: 3
                }
            ]
        },
        status: 'Terminado',
        formato: 'Melhor de 3',
        mvp: {
            nome: 'keppq',
            avatar: '../img/avatar.jpg',
            rating: 2.781,
            highlights: {
                kills: { player: 'keppq', value: 35 },
                damage: { player: 'rosseti', value: 3655 },
                kast: { player: 'EduBalaaa', value: 81.6 },
                firstKills: { player: 'rosseti', value: 7 }
            }
        }
    };
    
    await renderizarResultado(matchData);
}


// Renderizar resultado completo
async function renderizarResultado(data) {
    // Salvar dados globais
    // matchInfoData: JSON bruto da Faceit (buscarMatch)
    // matchData: dados unificados (pode ser sobrescrito depois por integrarStatsFaceitComMixcamp)
    matchInfoData = data;
    matchData = data;
    
    renderizarHeader(data);
    
    // Renderizar mapas no centro
    renderizarMapasCentro(data);
    
    // Se estiver em modo Faceit, carregar dados do analisePlayers
    if (isFaceitMode) {
        try {
        analisePlayersData = await analisePlayers();
        if (analisePlayersData) {
            const [faction1data, faction2data, teams] = analisePlayersData;
            renderizarJogadoresFaceit(faction1data, faction2data, teams);
                // Buscar stats e calcular MVP quando há Mixcamp
                await buscarInfoMatchIdStatus({ faction1data, faction2data, teams });
        } else {
                // Fallback para dados normais se analisePlayers falhar (sem Mixcamp)
                // Garantir que o botão continue funcionando mesmo sem Mixcamp
            renderizarJogadoresVs(data);
                // Buscar stats e calcular MVP mesmo sem Mixcamp
                await buscarInfoMatchIdStatusSomenteFaceit();
            }
        } catch (error) {
            // Se der erro, usar apenas dados da Faceit
            analisePlayersData = null;
            renderizarJogadoresVs(data);
            // Buscar stats e calcular MVP mesmo sem Mixcamp
            await buscarInfoMatchIdStatusSomenteFaceit();
        }
    } else {
        // Renderizar jogadores na nova div Time A VS Time B (modo Mixcamp)
        renderizarJogadoresVs(data);
    }
    
    // Garantir que os botões de alternar sempre estejam visíveis
    const toggleLogoBtn = document.getElementById('toggleLogoBtn');
    const toggleLogoFaceit = document.getElementById('toggleLogoFaceit');
    const toggleLogoMixcamp = document.getElementById('toggleLogoMixcamp');
    
    if (toggleLogoBtn) {
        toggleLogoBtn.style.display = 'block';
        toggleLogoBtn.style.visibility = 'visible';
    }
    if (toggleLogoFaceit) {
        toggleLogoFaceit.style.display = 'block';
        toggleLogoFaceit.style.visibility = 'visible';
    }
    if (toggleLogoMixcamp) {
        toggleLogoMixcamp.style.display = 'block';
        toggleLogoMixcamp.style.visibility = 'visible';
    }
    
    // Garantir que matchTeamsVs apareça por padrão
    const resultadoContent = document.querySelector('.resultado-content');
    const matchTeamsVs = document.getElementById('matchTeamsVs');
    
    // Sempre mostrar matchTeamsVs por padrão e ocultar as divs de estatísticas
    if (matchTeamsVs) {
        matchTeamsVs.classList.remove('hidden');
    }
    if (resultadoContent) {
        resultadoContent.classList.remove('show');
    }
    
    // Preparar dados das tabelas e MVP (mas não mostrar ainda)
    // Elas só aparecerão quando o usuário clicar no botão de gráfico
    const isFinished = data.status === 'Terminado' || data.status === 'FINISHED' || data.status === 'Finalizada';
    if (isFinished) {
        // Preparar as tabelas e MVP, mas não mostrar ainda
        renderizarTabelas(data);
        renderizarMVP(data);
    }
}

// Renderizar mapas no centro
function renderizarMapasCentro(data) {
    const mapsContainer = document.getElementById('matchMapsCenter');
    const bgMapsOverlay = document.getElementById('bgMapsOverlay');
    if (!mapsContainer || !bgMapsOverlay) return;

    mapsContainer.innerHTML = '';
    bgMapsOverlay.innerHTML = ''; // Limpar background anterior
    
    // Pegar mapas do padrão Faceit (data.voting.map.pick)
    const mapasData = data.voting?.map?.pick || [];
    const bestOf = data.best_of || 1;

    // Se não houver mapas votados ainda (partida muito no início), usar padrao
    let mapasParaExibir = mapasData.slice(0, bestOf);
    
    if (mapasParaExibir.length === 0) {
        // Fallback apenas para visualização se a votação não estiver pronta
        mapasParaExibir = bestOf === 1 ? ['de_mirage'] : 
                         bestOf === 3 ? ['de_mirage', 'de_inferno', 'de_ancient'] :
                         ['de_mirage', 'de_inferno', 'de_ancient', 'de_dust2', 'de_vertigo'].slice(0, bestOf);
    }

    // Aplicar classe CSS baseada no formato da partida
    bgMapsOverlay.className = 'bg-maps-overlay';
    if (bestOf === 1) {
        bgMapsOverlay.classList.add('md1');
    } else if (bestOf === 3) {
        bgMapsOverlay.classList.add('md3');
    } else if (bestOf === 5) {
        bgMapsOverlay.classList.add('md5');
    }

    mapasParaExibir.forEach((mapName, index) => {
        // Normalizar o nome do mapa para buscar na lista de imagens
        const mapaPuro = mapName.replace(/^de_/, '').toLowerCase();
        const nomeFormatado = mapaPuro.charAt(0).toUpperCase() + mapaPuro.slice(1);
        
        // Buscar a imagem no objeto imagensMapas
        const imageUrl = imagensMapas[nomeFormatado] || 
                         imagensMapas[mapaPuro] || 
                         imagensMapas[mapName] ||
                         'https://cdn-icons-png.flaticon.com/128/5726/5726775.png';
        
        // Criar elemento de background
        const bgMapItem = document.createElement('div');
        bgMapItem.className = 'bg-map-item';
        bgMapItem.style.backgroundImage = `url('${imageUrl}')`;
        bgMapsOverlay.appendChild(bgMapItem);
        
        // Criar card central
        const mapThumb = document.createElement('div');
        mapThumb.className = 'map-thumb-center';
        mapThumb.style.backgroundImage = `url('${imageUrl}')`;
        
        // O mapa ativo (geralmente o primeiro)
        if (index === 0) {
            mapThumb.classList.add('active');
            const matchHeader = document.querySelector('.match-header');
            if (matchHeader) {
                matchHeader.style.backgroundImage = `url('${imageUrl}')`;
            }
        }
        
        mapThumb.innerHTML = `<div class="map-thumb-name">${mapaPuro.toUpperCase()}</div>`;
        mapsContainer.appendChild(mapThumb);
    });
}

// Renderizar header da partida
function renderizarHeader(data) {
    if (!data) return;

    // Ajuste para o padrão do JSON da Faceit
    const faction1 = data.teams?.faction1 || {};
    const faction2 = data.teams?.faction2 || {};
    const results = data.results || { score: { faction1: 0, faction2: 0 } };

    document.getElementById('team1Name').textContent = faction1.name || 'Time A';
    document.getElementById('team1Score').textContent = results.score?.faction1 || 0;
    document.getElementById('team2Name').textContent = faction2.name || 'Time B';
    document.getElementById('team2Score').textContent = results.score?.faction2 || 0;
    
    // Adicionar logos dos times (suporta avatar, avatar_time_url ou logo)
    const team1Logo = document.getElementById('team1Logo');
    const team2Logo = document.getElementById('team2Logo');
    if (team1Logo) {
        const logoUrl = faction1.avatar || faction1.avatar_time_url || faction1.logo || '../img/cs2.png';
        team1Logo.src = logoUrl;
    }
    if (team2Logo) {
        const logoUrl = faction2.avatar || faction2.avatar_time_url || faction2.logo || '../img/cs2.png';
        team2Logo.src = logoUrl;
    }
    
    document.getElementById('matchStatus').textContent = data.status || 'Status';
    document.getElementById('matchFormat').textContent = `MD${data.best_of || 1}`;
    document.getElementById('matchFormat').style.background = '#5e5103'
    
    // Identificar o time vencedor e aplicar cor verde ao score
    const team1ScoreEl = document.getElementById('team1Score');
    const team2ScoreEl = document.getElementById('team2Score');
    
    // Remover classe winner de ambos
    team1ScoreEl.classList.remove('winner');
    team2ScoreEl.classList.remove('winner');
    
    // Adicionar classe winner ao time com maior score
    if (results.score?.faction1 > results.score?.faction2) {
        team1ScoreEl.classList.add('winner');
    } else if (results.score?.faction2 > results.score?.faction1) {
        team2ScoreEl.classList.add('winner');
    }
}

// Renderizar jogadores na nova div Time A VS Time B
function renderizarJogadoresVs(data) {
    if (!data) return;

    // Atualizar nomes e logos dos times
    const teamAVsName = document.getElementById('teamAVsName');
    const teamBVsName = document.getElementById('teamBVsName');
    const teamAVsLogo = document.getElementById('teamAVsLogo');
    const teamBVsLogo = document.getElementById('teamBVsLogo');
    
    // Modo alternado (Mixcamp): mostrar logos e nomes da Faceit
    // Time A (Faction 1)
    if (matchInfoData?.teams?.faction1) {
        const faction1Faceit = matchInfoData.teams.faction1;
        
        if (teamAVsName && faction1Faceit.name) {
            teamAVsName.textContent = faction1Faceit.name;
        }
        
        if (teamAVsLogo) {
            const logoUrl = faction1Faceit.avatar || '../img/cs2.png';
            teamAVsLogo.src = logoUrl;
            teamAVsLogo.alt = faction1Faceit.name || 'Time A';
        }
    } else if (data.teams?.faction1) {
        // Fallback para dados do matchData
        const faction1 = data.teams.faction1;
        
        if (teamAVsName && faction1.name) {
            teamAVsName.textContent = faction1.name;
        }
        
        if (teamAVsLogo) {
            const logoUrl = faction1.avatar || faction1.avatar_time_url || faction1.logo || '../img/cs2.png';
            teamAVsLogo.src = logoUrl;
            teamAVsLogo.alt = faction1.name || 'Time A';
        }
    }
    
    // Time B (Faction 2)
    if (matchInfoData?.teams?.faction2) {
        const faction2Faceit = matchInfoData.teams.faction2;
        
        if (teamBVsName && faction2Faceit.name) {
            teamBVsName.textContent = faction2Faceit.name;
        }
        
        if (teamBVsLogo) {
            const logoUrl = faction2Faceit.avatar || '../img/cs2.png';
            teamBVsLogo.src = logoUrl;
            teamBVsLogo.alt = faction2Faceit.name || 'Time B';
        }
    } else if (data.teams?.faction2) {
        // Fallback para dados do matchData
        const faction2 = data.teams.faction2;
        
        if (teamBVsName && faction2.name) {
            teamBVsName.textContent = faction2.name;
        }
        
        if (teamBVsLogo) {
            const logoUrl = faction2.avatar || faction2.avatar_time_url || faction2.logo || '../img/cs2.png';
            teamBVsLogo.src = logoUrl;
            teamBVsLogo.alt = faction2.name || 'Time B';
        }
    }

    const renderSide = (faction, containerId, playersLevelsArray = null) => {
        const container = document.getElementById(containerId);
        if (!container || !faction?.roster) return;

        container.innerHTML = '';
        faction.roster.forEach((player, index) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-vs-item';
            
            // Buscar o level do player:
            // 1. Primeiro tenta do array de levels (quando disponível)
            // 2. Depois tenta das propriedades do player
            // 3. Por último, tenta buscar pelo game_player_id ou steam_id se o array tiver objetos
            let playerLevel = null;
            
            if (playersLevelsArray && Array.isArray(playersLevelsArray)) {
                // Se o array for de números simples, usa o índice
                if (typeof playersLevelsArray[index] === 'number') {
                    playerLevel = playersLevelsArray[index];
                }
                // Se o array for de objetos, busca pelo identificador do player
                else if (typeof playersLevelsArray[index] === 'object') {
                    const levelData = playersLevelsArray.find(levelItem => 
                        levelItem.game_player_id === player.game_player_id ||
                        levelItem.steam_id === player.game_player_id ||
                        levelItem.player_id === player.game_player_id
                    );
                    playerLevel = levelData?.level || levelData?.game_skill_level || null;
                }
            }
            
            // Se não encontrou no array, tenta nas propriedades do player
            if (!playerLevel) {
                playerLevel = player.level || player.game_skill_level || player.skill_level || null;
            }
            
            // Se ainda não encontrou, tentar buscar do matchInfoData usando faceitid ou player_id
            if (!playerLevel && matchInfoData?.teams) {
                const allRosters = [
                    ...(matchInfoData.teams.faction1?.roster || []),
                    ...(matchInfoData.teams.faction2?.roster || [])
                ];
                const faceitPlayer = allRosters.find(p => 
                    p.player_id === player.faceitid || 
                    p.game_player_id === player.game_player_id ||
                    (player.nicknameFaceit && p.nickname === player.nicknameFaceit)
                );
                if (faceitPlayer) {
                    playerLevel = faceitPlayer.game_skill_level || null;
                }
            }
            
            // Obter URL da imagem do nível (ou null se não houver level)
            const levelImageUrl = playerLevel && faceitLevels[playerLevel] ? faceitLevels[playerLevel] : null;

            // Modo alternado (Mixcamp): mostrar dados da Faceit
            // Avatar: da Faceit (avatarFaceit ou do matchInfoData)
            let playerAvatar = player.avatarFaceit || '';
            if (!playerAvatar && matchInfoData?.teams) {
                const allRosters = [
                    ...(matchInfoData.teams.faction1?.roster || []),
                    ...(matchInfoData.teams.faction2?.roster || [])
                ];
                const faceitPlayer = allRosters.find(p => 
                    p.player_id === player.faceitid || 
                    p.game_player_id === player.game_player_id ||
                    (player.nicknameFaceit && p.nickname === player.nicknameFaceit)
                );
                if (faceitPlayer) {
                    playerAvatar = faceitPlayer.avatar || '';
                }
            }
            playerAvatar = playerAvatar || '../img/avatar.jpg';
            
            // Nome: nicknameFaceit (usernameMixcamp) - nickname fora, username dentro
            const nicknameFaceit = player.nicknameFaceit || player.nickname || 'Player';
            const usernameMixcamp = player.username || '';
            
            // Formato: nicknameFaceit (usernameMixcamp)
            const displayName = usernameMixcamp && nicknameFaceit
                ? `${nicknameFaceit} (${usernameMixcamp})`
                : nicknameFaceit;
            
            // Avatar do time: buscar do matchInfoData (Faceit)
            let timeAvatar = '';
            let timeNome = faction.name || '';
            if (matchInfoData?.teams) {
                const allRosters = [
                    ...(matchInfoData.teams.faction1?.roster || []),
                    ...(matchInfoData.teams.faction2?.roster || [])
                ];
                const faceitPlayer = allRosters.find(p => 
                    p.player_id === player.faceitid || 
                    p.game_player_id === player.game_player_id ||
                    (player.nicknameFaceit && p.nickname === player.nicknameFaceit)
                );
                if (faceitPlayer) {
                    // Buscar o time do player no matchInfoData
                    const teamFaceit = matchInfoData.teams.faction1?.roster?.some(p => p.player_id === faceitPlayer.player_id)
                        ? matchInfoData.teams.faction1 
                        : matchInfoData.teams.faction2;
                    if (teamFaceit) {
                        timeAvatar = teamFaceit.avatar || '';
                        timeNome = teamFaceit.name || faction.name || '';
                    }
                }
            }

            playerItem.innerHTML = `
                <div class="player-vs-avatar-container">
                    <div class="player-vs-avatar-wrapper">
                        <img src="${playerAvatar}" alt="${nicknameFaceit}" class="player-vs-avatar" onerror="this.src='../img/avatar.jpg'">
                    </div>
                </div>
                <div class="player-vs-info">
                    <div class="player-vs-name-row">
                        <span class="player-vs-nickname">${displayName}</span>
                    </div>
                    <div class="player-vs-time-row">
                        ${timeAvatar ? `<img src="${timeAvatar}" alt="${timeNome}" class="player-vs-time-logo" onerror="this.style.display='none'">` : ''}
                        <span class="player-vs-subtitle">${timeNome}</span>
                    </div>
                </div>
                <div class="player-vs-stats">
                    ${levelImageUrl 
                        ? `<img src="${levelImageUrl}" alt="Level ${playerLevel}" class="player-faceit-level" onerror="this.style.display='none'">`
                        : `<span class="player-vs-rating-value">N/A</span>`
                    }
                    <div class="player-elo-variation">+25</div>
                </div>
            `;
            container.appendChild(playerItem);
        });
    };

    // Se houver array de levels nos dados, passar para a função
    const playersLevels = data.playersLevels || data.players_levels || null;
    
    renderSide(data.teams?.faction1, 'teamAPlayersVs', playersLevels);
    renderSide(data.teams?.faction2, 'teamBPlayersVs', playersLevels);
}

// Renderizar jogadores usando dados do analisePlayers (modo Faceit)
function renderizarJogadoresFaceit(faction1data, faction2data, teams) {
    if (!faction1data || !faction2data || !teams) return;

    // Atualizar nomes e logos dos times usando o array teams
    const teamAVsName = document.getElementById('teamAVsName');
    const teamBVsName = document.getElementById('teamBVsName');
    const teamAVsLogo = document.getElementById('teamAVsLogo');
    const teamBVsLogo = document.getElementById('teamBVsLogo');
    
    // Time A (Faction 1)
    if (teams.faction1) {
        if (teamAVsName && teams.faction1.time_nome) {
            teamAVsName.textContent = teams.faction1.time_nome;
        }
        
        if (teamAVsLogo && teams.faction1.time_avatar) {
            teamAVsLogo.src = teams.faction1.time_avatar;
            teamAVsLogo.alt = teams.faction1.time_nome || 'Time A';
        }
    }
    
    // Time B (Faction 2)
    if (teams.faction2) {
        if (teamBVsName && teams.faction2.time_nome) {
            teamBVsName.textContent = teams.faction2.time_nome;
        }
        
        if (teamBVsLogo && teams.faction2.time_avatar) {
            teamBVsLogo.src = teams.faction2.time_avatar;
            teamBVsLogo.alt = teams.faction2.time_nome || 'Time B';
        }
    }

    // Renderizar jogadores confirmados do Faction 1
    const renderSideFaceit = (playersArray, containerId) => {
        const container = document.getElementById(containerId);
        if (!container || !playersArray || !Array.isArray(playersArray)) {
            return;
        }

        container.innerHTML = '';
        playersArray.forEach((player, index) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-vs-item';
            
            // Buscar o level do player: primeiro do player, depois do matchInfoData
            let playerLevel = player.skill_level || null;
            if (!playerLevel && matchInfoData?.teams) {
                // Tentar buscar do matchInfoData usando player_id ou faceitid
                const allRosters = [
                    ...(matchInfoData.teams.faction1?.roster || []),
                    ...(matchInfoData.teams.faction2?.roster || [])
                ];
                const faceitPlayer = allRosters.find(p => 
                    p.player_id === player.faceitid || 
                    p.game_player_id === player.game_player_id
                );
                if (faceitPlayer) {
                    playerLevel = faceitPlayer.game_skill_level || null;
                }
            }
            const levelImageUrl = playerLevel && faceitLevels[playerLevel] ? faceitLevels[playerLevel] : null;
            
            // Modo padrão (Faceit): mostrar dados do Mixcamp
            // Avatar: do Mixcamp (player.avatar)
            const playerAvatar = player.avatar || '../img/avatar.jpg';
            
            // Nome: usernameMixcamp (nicknameFaceit) - username fora, nickname dentro
            // player.username = username do Mixcamp
            // player.nickname = nickname da Faceit
            const usernameMixcamp = player.username || '';
            const nicknameFaceit = player.nickname || 'Player';
            const timeNome = player.time_nome || 'Time';
            
            // Formato: usernameMixcamp (nicknameFaceit)
            const displayName = usernameMixcamp && nicknameFaceit
                ? `${usernameMixcamp} (${nicknameFaceit})`
                : usernameMixcamp || nicknameFaceit;

            playerItem.innerHTML = `
                <div class="player-vs-avatar-container">
                    <div class="player-vs-avatar-wrapper">
                        <img src="${playerAvatar}" alt="${nicknameFaceit}" class="player-vs-avatar" onerror="this.src='../img/avatar.jpg'">
                    </div>
                </div>
                <div class="player-vs-info">
                    <div class="player-vs-name-row">
                        <span class="player-vs-nickname">${displayName}</span>
                    </div>
                    <div class="player-vs-time-row">
                        ${player.time_avatar ? `<img src="${player.time_avatar}" alt="${timeNome}" class="player-vs-time-logo" onerror="this.style.display='none'">` : ''}
                        <span class="player-vs-subtitle">${timeNome}</span>
                    </div>
                </div>
                <div class="player-vs-stats">
                    ${levelImageUrl 
                        ? `<img src="${levelImageUrl}" alt="Level ${playerLevel}" class="player-faceit-level" onerror="this.style.display='none'">`
                        : `<span class="player-vs-rating-value">N/A</span>`
                    }
                    <div class="player-elo-variation">+25</div>
                </div>
            `;
            container.appendChild(playerItem);
        });
    };

    // Renderizar jogadores confirmados
    const players1 = faction1data?.playersconfirmados || [];
    const players2 = faction2data?.playersconfirmados || [];
    
    // Se por algum motivo não houver jogadores confirmados no Mixcamp,
    // fazer fallback para os dados da Faceit (matchInfoData),
    // para garantir que o player-vs seja preenchido com avatar/nickname corretos.
    if ((!players1.length || !players2.length) && (matchInfoData?.teams || matchData?.teams)) {
        // Preferir sempre o JSON bruto da Faceit (buscarMatch), que traz avatar e nickname completos
        const fallbackData = matchInfoData && matchInfoData.teams ? matchInfoData : matchData;
        renderizarJogadoresVs(fallbackData);
        return;
    }
    
    renderSideFaceit(players1, 'teamAPlayersVs');
    renderSideFaceit(players2, 'teamBPlayersVs');
}

// Função para alternar entre modo Faceit e Mixcamp
async function alternarModoVisualizacao() {
    isFaceitMode = !isFaceitMode;
    
    if (isFaceitMode) {
        // Modo Faceit - usar dados do analisePlayers (se disponível) ou fallback para Faceit
        if (!analisePlayersData) {
            // Buscar dados se ainda não foram carregados
            analisePlayersData = await analisePlayers();
        }
        
        if (analisePlayersData) {
            // Tem dados do Mixcamp - usar renderizarJogadoresFaceit
            const [faction1data, faction2data, teams] = analisePlayersData;
            renderizarJogadoresFaceit(faction1data, faction2data, teams);
        } else {
            // Não tem Mixcamp - usar dados da Faceit diretamente (modo padrão)
            // Neste caso, já estamos mostrando dados da Faceit, então não precisa fazer nada
            // ou podemos garantir que está usando renderizarJogadoresVs com dados da Faceit
            if (matchInfoData) {
                renderizarJogadoresVs(matchInfoData);
            } else if (matchData) {
                renderizarJogadoresVs(matchData);
            }
        }
    } else {
        // Modo Mixcamp - usar dados do matchData
        // Se não houver Mixcamp, ainda assim alterna para mostrar dados da Faceit de forma diferente
        if (matchData) {
            renderizarJogadoresVs(matchData);
        } else if (matchInfoData) {
            renderizarJogadoresVs(matchInfoData);
        }
    }
}

// Função auxiliar para atualizar levels quando o array chegar
// Pode ser chamada assim: atualizarPlayersLevels(arrayDeLevels)
function atualizarPlayersLevels(playersLevelsArray) {
    if (!matchData) return;
    
    // Atualizar os dados
    matchData.playersLevels = playersLevelsArray;
    
    // Re-renderizar os jogadores com os novos levels
    renderizarJogadoresVs(matchData);
}

// Renderizar tabelas de estatísticas
function renderizarTabelas(data, tipo = null) {
    // Se tipo não for especificado, usar o tipo atual
    if (tipo === null) {
        tipo = currentStatsType;
    } else {
        // Atualizar o tipo atual quando um novo tipo for especificado
        currentStatsType = tipo;
    }
    
    if (!data || !data.teams) {
        return;
    }
    
    const container = document.getElementById('statsTablesContainer');
    if (!container) {
        return;
    }
    container.innerHTML = '';
    
    // Adicionar botão de gráfico se for utility
    if (tipo === 'utility') {
        const graphBtn = document.createElement('button');
        graphBtn.className = 'utility-graph-btn';
        graphBtn.id = 'utilityGraphBtn';
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico';
        graphBtn.onclick = () => {
            toggleUtilityView(data);
        };
        container.appendChild(graphBtn);
        
        // Container para gráficos (inicialmente oculto)
        const graphContainer = document.createElement('div');
        graphContainer.id = 'utilityGraphContainer';
        graphContainer.className = 'utility-graph-container';
        graphContainer.style.display = 'none';
        container.appendChild(graphContainer);
    }
    
    // Adicionar botão de gráfico se for duels
    if (tipo === 'duels') {
        const graphBtn = document.createElement('button');
        graphBtn.className = 'utility-graph-btn';
        graphBtn.id = 'duelsGraphBtn';
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Gráfico de Desempenho';
        graphBtn.onclick = () => {
            toggleDuelsView(data);
        };
        container.appendChild(graphBtn);
        
        // Container para gráficos (inicialmente oculto)
        const graphContainer = document.createElement('div');
        graphContainer.id = 'duelsGraphContainer';
        graphContainer.className = 'utility-graph-container';
        graphContainer.style.display = 'none';
        container.appendChild(graphContainer);
    }
    
    // Adicionar botão de gráfico se for armas
    if (tipo === 'armas') {
        const graphBtn = document.createElement('button');
        graphBtn.className = 'utility-graph-btn';
        graphBtn.id = 'armasGraphBtn';
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico';
        graphBtn.onclick = () => {
            toggleArmasView(data);
        };
        container.appendChild(graphBtn);
        
        // Container para gráficos (inicialmente oculto)
        const graphContainer = document.createElement('div');
        graphContainer.id = 'armasGraphContainer';
        graphContainer.className = 'utility-graph-container';
        graphContainer.style.display = 'none';
        container.appendChild(graphContainer);
    }
    
    // Tabela Faction 1
    let table1;
    if (tipo === 'utility') {
        table1 = criarTabelaUtility(data.teams.faction1, 'team1');
    } else if (tipo === 'duels') {
        table1 = criarTabelaDuels(data.teams.faction1, 'team1');
    } else if (tipo === 'armas') {
        table1 = criarTabelaArmas(data.teams.faction1, 'team1');
    } else {
        table1 = criarTabelaTime(data.teams.faction1, 'team1');
    }
    if (table1) container.appendChild(table1);
    
    // Tabela Faction 2
    let table2;
    if (tipo === 'utility') {
        table2 = criarTabelaUtility(data.teams.faction2, 'team2');
    } else if (tipo === 'duels') {
        table2 = criarTabelaDuels(data.teams.faction2, 'team2');
    } else if (tipo === 'armas') {
        table2 = criarTabelaArmas(data.teams.faction2, 'team2');
    } else {
        table2 = criarTabelaTime(data.teams.faction2, 'team2');
    }
    if (table2) container.appendChild(table2);
}

// Criar tabela de um time
function criarTabelaTime(faction, teamClass) {
    if (!faction) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'stats-table-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const teamRating = faction.stats?.rating || '0.000';

    // Montar nome do time: nome Mixcamp (imagem Faceit + nome Faceit) se ambos existirem
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;

    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Rating: ${teamRating}</div>
            </div>
        </div>
    `;
    
    // Tabela
    const table = document.createElement('table');
    table.className = 'stats-table';
    
    // Cabeçalho
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Jogador</th>
            <th>Classificação</th>
            <th>K</th>
            <th>D</th>
            <th>A</th>
            <th>K/D</th>
            <th>MVPs</th>
            <th>ADR</th>
            <th>HS%</th>
            <th>Clutch</th>
        </tr>
    `;
    
    // Corpo
    const tbody = document.createElement('tbody');
    const roster = faction.roster || [];

    roster.forEach(player => {
        const row = document.createElement('tr');
        
        // No momento da partida em andamento, alguns stats podem não estar disponíveis
        const pStats = player.stats || {};
        const rawStats = player.rawStats || {};
        const pRating = pStats.rating || faction.stats?.rating || '0.000';
        const pKills = pStats.kills || '0';
        const pDeaths = pStats.deaths || '0';
        const pAssists = pStats.assists || '0';
        const pKD = pStats.kd || '0.00';
        // MVPs e ADR dos stats brutos da Faceit
        const pMVPs = rawStats['MVPs'] || '0';
        const pADR = rawStats['ADR'] || '0.0';
        // Headshots % e Clutch Kills dos stats brutos da Faceit
        const pHeadshots = rawStats['Headshots'] || '0';
        const pKillsNum = parseInt(pStats.kills || '0', 10);
        const pHSPercent = pKillsNum > 0 ? ((parseInt(pHeadshots, 10) / pKillsNum) * 100).toFixed(1) : '0.0';
        const pClutchKills = rawStats['Clutch Kills'] || rawStats['Clutch Kills (1vX)'] || '0';

        // Montar nome exibido: username ( avatarFaceit + nicknameFaceit )
        const displayName = player.nickname || player.username || 'Player';
        const nicknameFaceit = player.nicknameFaceit || '';
        // avatarFaceit: usar APENAS o avatarFaceit (não fazer fallback para avatar Mixcamp)
        // Se estiver vazio, deixar vazio (não mostrar imagem dentro dos parênteses)
        const avatarFaceit = (player.avatarFaceit && player.avatarFaceit.trim() !== '') 
            ? player.avatarFaceit 
            : '';

        // Montar HTML do avatarFaceit dentro dos parênteses
        // Usar APENAS avatarFaceit, sem fallback para avatar Mixcamp
        const avatarFaceitHtml = avatarFaceit 
            ? `<img src="${avatarFaceit}" alt="${nicknameFaceit}" class="player-name-faceit-avatar" onerror="this.style.display='none';" style="display: inline-block;">` 
            : '';

        row.innerHTML = `
            <td>
                <div class="player-cell">
                    <img src="${player.avatar || '../img/avatar.jpg'}" alt="${player.nickname}" class="player-avatar" onerror="this.src='../img/avatar.jpg'">
                    <span class="player-name">
                        ${displayName}
                        ${nicknameFaceit ? `
                            <span class="player-name-faceit">
                                (
                                ${avatarFaceitHtml}
                                ${nicknameFaceit}
                                )
                            </span>
                        ` : ''}
                    </span>
                </div>
            </td>
            <td><span class="stat-value">${pRating}</span></td>
            <td><span class="stat-value">${pKills}</span></td>
            <td><span class="stat-value">${pDeaths}</span></td>
            <td><span class="stat-value">${pAssists}</span></td>
            <td><span class="stat-value">${pKD}</span></td>
            <td><span class="stat-value">${pMVPs}</span></td>
            <td><span class="stat-value">${pADR}</span></td>
            <td><span class="stat-value">${pHSPercent}%</span></td>
            <td><span class="stat-value">${pClutchKills}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    wrapper.appendChild(header);
    wrapper.appendChild(table);
    
    return wrapper;
}

// Variável para armazenar os gráficos Chart.js
let utilityCharts = [];

// Alternar entre tabela e gráfico de utility
function toggleUtilityView(data) {
    const container = document.getElementById('statsTablesContainer');
    const graphContainer = document.getElementById('utilityGraphContainer');
    const graphBtn = document.getElementById('utilityGraphBtn');
    const tables = container.querySelectorAll('.stats-table-wrapper');
    
    if (!graphContainer || !graphBtn) return;
    
    // Verificar se está mostrando gráfico ou tabela
    const isShowingGraph = graphContainer.style.display !== 'none';
    
    if (isShowingGraph) {
        // Mostrar tabelas e ocultar gráficos
        graphContainer.style.display = 'none';
        tables.forEach(table => table.style.display = '');
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico';
        
        // Destruir gráficos existentes
        utilityCharts.forEach(chart => chart.destroy());
        utilityCharts = [];
    } else {
        // Ocultar tabelas e mostrar gráficos
        tables.forEach(table => table.style.display = 'none');
        graphContainer.style.display = 'block';
        graphBtn.innerHTML = '<i class="fas fa-table"></i> Ver Tabela';
        
        // Renderizar gráficos
        renderizarGraficosUtility(data, graphContainer);
    }
}

// Renderizar gráficos de utility comparando os players
function renderizarGraficosUtility(data, container) {
    if (!data || !data.teams) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Destruir gráficos anteriores
    utilityCharts.forEach(chart => chart.destroy());
    utilityCharts = [];
    
    const faction1 = data.teams.faction1;
    const faction2 = data.teams.faction2;
    
    // Criar gráficos para cada time
    if (faction1) {
        const graphWrapper1 = criarGraficoUtility(faction1, 'team1');
        if (graphWrapper1) container.appendChild(graphWrapper1);
    }
    
    if (faction2) {
        const graphWrapper2 = criarGraficoUtility(faction2, 'team2');
        if (graphWrapper2) container.appendChild(graphWrapper2);
    }
}

// Criar gráfico de utility para um time
function criarGraficoUtility(faction, teamClass) {
    if (!faction || !faction.roster) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'utility-graph-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Comparação de Utility</div>
            </div>
        </div>
    `;
    wrapper.appendChild(header);
    
    // Container para os gráficos
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'utility-charts-container';
    
    // Preparar dados dos players
    const players = faction.roster || [];
    const playerNames = players.map(p => p.nickname || p.username || 'Player');
    const playerColors = [
        'rgba(245, 110, 8, 0.8)',
        'rgba(255, 165, 0, 0.8)',
        'rgba(255, 200, 0, 0.8)',
        'rgba(255, 140, 0, 0.8)',
        'rgba(255, 215, 0, 0.8)'
    ];
    
    // Gráfico 1: Inimigos Cegados e Flash Count
    const chart1Canvas = document.createElement('canvas');
    chart1Canvas.id = `utilityChart1_${teamClass}`;
    chartsContainer.appendChild(chart1Canvas);
    
    const enemiesFlashed = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Enemies Flashed']) || '0'));
    const flashCount = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Flash Count']) || '0'));
    
    const chart1 = new Chart(chart1Canvas, {
        type: 'bar',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Inimigos Cegados',
                    data: enemiesFlashed,
                    backgroundColor: 'rgba(245, 110, 8, 0.6)',
                    borderColor: 'rgba(245, 110, 8, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Contagem de Flash',
                    data: flashCount,
                    backgroundColor: 'rgba(255, 165, 0, 0.6)',
                    borderColor: 'rgba(255, 165, 0, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Inimigos Cegados vs Contagem de Flash',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    utilityCharts.push(chart1);
    
    // Gráfico 2: Utility Damage e Utility Count
    const chart2Canvas = document.createElement('canvas');
    chart2Canvas.id = `utilityChart2_${teamClass}`;
    chartsContainer.appendChild(chart2Canvas);
    
    const utilityDamage = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Utility Damage']) || '0'));
    const utilityCount = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Utility Count']) || '0'));
    
    const chart2 = new Chart(chart2Canvas, {
        type: 'bar',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Dano de Utility',
                    data: utilityDamage,
                    backgroundColor: 'rgba(255, 140, 0, 0.6)',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Contagem de Utility',
                    data: utilityCount,
                    backgroundColor: 'rgba(255, 200, 0, 0.6)',
                    borderColor: 'rgba(255, 200, 0, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Dano de Utility vs Contagem de Utility',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    utilityCharts.push(chart2);
    
    // Gráfico 3: Taxa de Sucesso (Flash e Utility)
    const chart3Canvas = document.createElement('canvas');
    chart3Canvas.id = `utilityChart3_${teamClass}`;
    chartsContainer.appendChild(chart3Canvas);
    
    const flashSuccessRate = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Flash Success Rate per Match', 'Flash Success Rate']) || '0'));
    const utilitySuccessRate = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Utility Success Rate per Match', 'Utility Success Rate']) || '0'));
    
    const chart3 = new Chart(chart3Canvas, {
        type: 'line',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Taxa de Sucesso de Flash (%)',
                    data: flashSuccessRate,
                    borderColor: 'rgba(245, 110, 8, 1)',
                    backgroundColor: 'rgba(245, 110, 8, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Taxa de Sucesso de Utility (%)',
                    data: utilitySuccessRate,
                    borderColor: 'rgba(255, 165, 0, 1)',
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taxa de Sucesso de Flash e Utility',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    utilityCharts.push(chart3);
    
    wrapper.appendChild(chartsContainer);
    
    return wrapper;
}

// Variável para armazenar os gráficos de duels Chart.js
let duelsCharts = [];

// Alternar entre tabela e gráfico de duels
function toggleDuelsView(data) {
    const container = document.getElementById('statsTablesContainer');
    const graphContainer = document.getElementById('duelsGraphContainer');
    const graphBtn = document.getElementById('duelsGraphBtn');
    const tables = container.querySelectorAll('.stats-table-wrapper');
    
    if (!graphContainer || !graphBtn) return;
    
    // Verificar se está mostrando gráfico ou tabela
    const isShowingGraph = graphContainer.style.display !== 'none';
    
    if (isShowingGraph) {
        // Mostrar tabelas e ocultar gráficos
        graphContainer.style.display = 'none';
        tables.forEach(table => table.style.display = '');
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Gráfico de Desempenho';
        
        // Destruir gráficos existentes
        duelsCharts.forEach(chart => chart.destroy());
        duelsCharts = [];
    } else {
        // Ocultar tabelas e mostrar gráficos
        tables.forEach(table => table.style.display = 'none');
        graphContainer.style.display = 'block';
        graphBtn.innerHTML = '<i class="fas fa-table"></i> Ver Tabela';
        
        // Renderizar gráfico de desempenho
        renderizarGraficosDuels(data, graphContainer);
    }
}

// Renderizar gráficos de duels comparando os players
function renderizarGraficosDuels(data, container) {
    if (!data || !data.teams) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Destruir gráficos anteriores
    duelsCharts.forEach(chart => chart.destroy());
    duelsCharts = [];
    
    const faction1 = data.teams.faction1;
    const faction2 = data.teams.faction2;
    
    // Criar gráfico de desempenho para cada time
    if (faction1) {
        const graphWrapper1 = criarGraficoDesempenhoDuels(faction1, 'team1');
        if (graphWrapper1) container.appendChild(graphWrapper1);
    }
    
    if (faction2) {
        const graphWrapper2 = criarGraficoDesempenhoDuels(faction2, 'team2');
        if (graphWrapper2) container.appendChild(graphWrapper2);
    }
}

// Criar gráfico de desempenho de duels para um time
function criarGraficoDesempenhoDuels(faction, teamClass) {
    if (!faction || !faction.roster) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'utility-graph-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Gráfico de Desempenho em Duels</div>
            </div>
        </div>
    `;
    wrapper.appendChild(header);
    
    // Container para o gráfico
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'utility-charts-container';
    
    // Preparar dados dos players
    const players = faction.roster || [];
    const playerNames = players.map(p => p.nickname || p.username || 'Player');
    
    // Calcular score de desempenho para cada player
    const playerScores = players.map(player => {
        const rawStats = player.rawStats || {};
        const stats = player.stats || {};
        
        // Coletar todas as métricas
        const v1Count = parseFloat(getUtilityStat(rawStats, ['1v1Count']) || '0');
        const v1Wins = parseFloat(getUtilityStat(rawStats, ['1v1Wins']) || '0');
        const v1WinRate = parseFloat(getUtilityStat(rawStats, ['Match 1v1 Win Rate']) || '0');
        const v2Count = parseFloat(getUtilityStat(rawStats, ['1v2Count']) || '0');
        const v2Wins = parseFloat(getUtilityStat(rawStats, ['1v2Wins']) || '0');
        const v2WinRate = parseFloat(getUtilityStat(rawStats, ['Match 1v2 Win Rate']) || '0');
        const entryCount = parseFloat(getUtilityStat(rawStats, ['Entry Count']) || '0');
        const entryWins = parseFloat(getUtilityStat(rawStats, ['Entry Wins']) || '0');
        const entrySuccessRate = parseFloat(getUtilityStat(rawStats, ['Match Entry Success Rate']) || '0');
        const firstKills = parseFloat(getUtilityStat(rawStats, ['First Kills']) || '0');
        const clutchKills = parseFloat(getUtilityStat(rawStats, ['Clutch Kills', 'Clutch Kills (1vX)']) || '0');
        const damage = parseFloat(getUtilityStat(rawStats, ['Damage']) || '0');
        const headshots = parseFloat(getUtilityStat(rawStats, ['Headshots']) || '0');
        const kills = parseFloat(stats.kills || '0');
        const kdRatio = parseFloat(stats.kd || '0');
        const krRatio = parseFloat(getUtilityStat(rawStats, ['K/R Ratio']) || '0');
        const doubleKills = parseFloat(getUtilityStat(rawStats, ['Double Kills']) || '0');
        const tripleKills = parseFloat(getUtilityStat(rawStats, ['Triple Kills']) || '0');
        const quadroKills = parseFloat(getUtilityStat(rawStats, ['Quadro Kills']) || '0');
        const pentaKills = parseFloat(getUtilityStat(rawStats, ['Penta Kills']) || '0');
        
        // Calcular score geral (pesos para cada métrica)
        let score = 0;
        
        // 1v1 e 1v2 (clutches) - peso alto
        score += (v1Wins * 15) + (v1WinRate * 2);
        score += (v2Wins * 25) + (v2WinRate * 3);
        
        // Entry - peso médio-alto
        score += (entryWins * 10) + (entrySuccessRate * 1.5);
        
        // First Kills - peso médio
        score += firstKills * 8;
        
        // Clutch Kills - peso alto
        score += clutchKills * 20;
        
        // Damage - peso médio (normalizado por 100)
        score += (damage / 100) * 2;
        
        // Headshots - peso baixo-médio
        score += headshots * 3;
        
        // K/D e K/R Ratio - peso alto
        score += kdRatio * 30;
        score += krRatio * 25;
        
        // Multi-kills - peso médio
        score += (doubleKills * 2) + (tripleKills * 5) + (quadroKills * 10) + (pentaKills * 20);
        
        return {
            name: player.nickname || player.username || 'Player',
            score: Math.round(score * 100) / 100 // Arredondar para 2 casas decimais
        };
    });
    
    // Ordenar por score (maior para menor)
    playerScores.sort((a, b) => b.score - a.score);
    
    // Preparar dados para o gráfico
    const labels = playerScores.map(p => p.name);
    const scores = playerScores.map(p => p.score);
    
    // Cores baseadas na posição (melhor desempenho = cor mais forte)
    const colors = playerScores.map((p, index) => {
        const intensity = 1 - (index / playerScores.length) * 0.4; // Varia de 1.0 a 0.6
        return `rgba(245, ${Math.round(110 + (index * 20))}, 8, ${intensity})`;
    });
    
    // Gráfico único de desempenho
    const chartCanvas = document.createElement('canvas');
    chartCanvas.id = `duelsDesempenhoChart_${teamClass}`;
    chartsContainer.appendChild(chartCanvas);
    
    const chart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Score de Desempenho',
                    data: scores,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.6', '1').replace('0.8', '1')),
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Gráfico horizontal
            plugins: {
                title: {
                    display: true,
                    text: 'Ranking de Desempenho em Duels',
                    color: '#ffffff',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const player = playerScores[context.dataIndex];
                            return `Score: ${player.score.toFixed(2)} pontos`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#ffffff',
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    title: {
                        display: true,
                        text: 'Score de Desempenho',
                        color: '#ffffff',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    duelsCharts.push(chart);
    
    // Adicionar informações detalhadas abaixo do gráfico
    const infoDiv = document.createElement('div');
    infoDiv.className = 'duels-performance-info';
    infoDiv.style.marginTop = '20px';
    infoDiv.style.padding = '15px';
    infoDiv.style.background = 'rgba(20, 20, 30, 0.4)';
    infoDiv.style.borderRadius = '8px';
    infoDiv.style.color = '#ffffff';
    
    const topPlayer = playerScores[0];
    infoDiv.innerHTML = `
        <h3 style="color: #f56e08; margin-bottom: 10px;">
            <i class="fas fa-trophy"></i> Melhor Desempenho: ${topPlayer.name}
        </h3>
        <p style="margin: 5px 0;"><strong>Score:</strong> ${topPlayer.score.toFixed(2)} pontos</p>
        <p style="margin: 5px 0; font-size: 12px; color: rgba(255, 255, 255, 0.7);">
            O score é calculado combinando: 1v1/1v2 wins, Entry wins, First Kills, Clutch Kills, 
            Damage, Headshots, K/D Ratio, K/R Ratio e Multi-kills
        </p>
    `;
    chartsContainer.appendChild(infoDiv);
    
    wrapper.appendChild(chartsContainer);
    
    return wrapper;
}

// Variável para armazenar os gráficos de armas Chart.js
let armasCharts = [];

// Alternar entre tabela e gráfico de armas
function toggleArmasView(data) {
    const container = document.getElementById('statsTablesContainer');
    const graphContainer = document.getElementById('armasGraphContainer');
    const graphBtn = document.getElementById('armasGraphBtn');
    const tables = container.querySelectorAll('.stats-table-wrapper');
    
    if (!graphContainer || !graphBtn) return;
    
    // Verificar se está mostrando gráfico ou tabela
    const isShowingGraph = graphContainer.style.display !== 'none';
    
    if (isShowingGraph) {
        // Mostrar tabelas e ocultar gráficos
        graphContainer.style.display = 'none';
        tables.forEach(table => table.style.display = '');
        graphBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico';
        
        // Destruir gráficos existentes
        armasCharts.forEach(chart => chart.destroy());
        armasCharts = [];
    } else {
        // Ocultar tabelas e mostrar gráficos
        tables.forEach(table => table.style.display = 'none');
        graphContainer.style.display = 'block';
        graphBtn.innerHTML = '<i class="fas fa-table"></i> Ver Tabela';
        
        // Renderizar gráficos
        renderizarGraficosArmas(data, graphContainer);
    }
}

// Renderizar gráficos de armas comparando os players
function renderizarGraficosArmas(data, container) {
    if (!data || !data.teams) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Destruir gráficos anteriores
    armasCharts.forEach(chart => chart.destroy());
    armasCharts = [];
    
    const faction1 = data.teams.faction1;
    const faction2 = data.teams.faction2;
    
    // Criar gráficos para cada time
    if (faction1) {
        const graphWrapper1 = criarGraficoArmas(faction1, 'team1');
        if (graphWrapper1) container.appendChild(graphWrapper1);
    }
    
    if (faction2) {
        const graphWrapper2 = criarGraficoArmas(faction2, 'team2');
        if (graphWrapper2) container.appendChild(graphWrapper2);
    }
}

// Criar gráfico de armas para um time
function criarGraficoArmas(faction, teamClass) {
    if (!faction || !faction.roster) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'utility-graph-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Comparação de Armas</div>
            </div>
        </div>
    `;
    wrapper.appendChild(header);
    
    // Container para os gráficos
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'utility-charts-container';
    
    // Preparar dados dos players
    const players = faction.roster || [];
    const playerNames = players.map(p => p.nickname || p.username || 'Player');
    
    // Gráfico 1: Pistol Kills vs Knife Kills vs Zeus Kills
    const chart1Canvas = document.createElement('canvas');
    chart1Canvas.id = `armasChart1_${teamClass}`;
    chartsContainer.appendChild(chart1Canvas);
    
    const pistolKills = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Pistol Kills']) || '0'));
    const knifeKills = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Knife Kills']) || '0'));
    const zeusKills = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Zeus Kills']) || '0'));
    
    const chart1 = new Chart(chart1Canvas, {
        type: 'bar',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Pistol Kills',
                    data: pistolKills,
                    backgroundColor: 'rgba(245, 110, 8, 0.6)',
                    borderColor: 'rgba(245, 110, 8, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Knife Kills',
                    data: knifeKills,
                    backgroundColor: 'rgba(255, 165, 0, 0.6)',
                    borderColor: 'rgba(255, 165, 0, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Zeus Kills',
                    data: zeusKills,
                    backgroundColor: 'rgba(255, 200, 0, 0.6)',
                    borderColor: 'rgba(255, 200, 0, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Kills com Pistola, Faca e Zeus',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    armasCharts.push(chart1);
    
    // Gráfico 2: Sniper Kills e Taxas
    const chart2Canvas = document.createElement('canvas');
    chart2Canvas.id = `armasChart2_${teamClass}`;
    chartsContainer.appendChild(chart2Canvas);
    
    const sniperKills = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Sniper Kills']) || '0'));
    const sniperKillRateMatch = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Sniper Kill Rate per Match']) || '0'));
    const sniperKillRateRound = players.map(p => parseFloat(getUtilityStat(p.rawStats || {}, ['Sniper Kill Rate per Round']) || '0'));
    
    const chart2 = new Chart(chart2Canvas, {
        type: 'bar',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Sniper Kills',
                    data: sniperKills,
                    backgroundColor: 'rgba(255, 140, 0, 0.6)',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Sniper Kills',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    armasCharts.push(chart2);
    
    // Gráfico 3: Taxas de Sniper (Match e Round)
    const chart3Canvas = document.createElement('canvas');
    chart3Canvas.id = `armasChart3_${teamClass}`;
    chartsContainer.appendChild(chart3Canvas);
    
    const chart3 = new Chart(chart3Canvas, {
        type: 'line',
        data: {
            labels: playerNames,
            datasets: [
                {
                    label: 'Sniper Kill Rate/Match',
                    data: sniperKillRateMatch,
                    borderColor: 'rgba(245, 110, 8, 1)',
                    backgroundColor: 'rgba(245, 110, 8, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Sniper Kill Rate/Round',
                    data: sniperKillRateRound,
                    borderColor: 'rgba(255, 165, 0, 1)',
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taxa de Kills com Sniper',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    armasCharts.push(chart3);
    
    wrapper.appendChild(chartsContainer);
    
    return wrapper;
}

// Função auxiliar para buscar valor no rawStats com fallbacks
function getUtilityStat(rawStats, keys) {
    for (const key of keys) {
        if (rawStats[key] !== undefined && rawStats[key] !== null && rawStats[key] !== '') {
            return rawStats[key];
        }
    }
    return '0';
}

// Criar tabela de utility para um time
function criarTabelaUtility(faction, teamClass) {
    if (!faction) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'stats-table-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const teamRating = faction.stats?.rating || '0.000';

    // Montar nome do time: nome Mixcamp (imagem Faceit + nome Faceit) se ambos existirem
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Rating: ${teamRating}</div>
            </div>
        </div>
    `;
    
    // Tabela
    const table = document.createElement('table');
    table.className = 'stats-table';
    
    // Cabeçalho da tabela de utility
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Jogador</th>
            <th>Inimigos Cegados</th>
            <th>Inimigos Cegados/Round</th>
            <th>Contagem de Flash</th>
            <th>Taxa de Sucesso de Flash</th>
            <th>Sucessos de Flash</th>
            <th>Flashes/Round</th>
            <th>Contagem de Utility</th>
            <th>Dano de Utility</th>
            <th>Taxa de Sucesso de Dano</th>
            <th>Dano de Utility/Round</th>
            <th>Inimigos com Utility</th>
            <th>Taxa de Sucesso de Utility</th>
            <th>Sucessos de Utility</th>
            <th>Uso de Utility/Round</th>
        </tr>
    `;
    
    // Corpo
    const tbody = document.createElement('tbody');
    const roster = faction.roster || [];

    // Debug: verificar chaves disponíveis no rawStats do primeiro player
    if (roster.length > 0 && roster[0].rawStats) {
    }
    
    roster.forEach(player => {
        const row = document.createElement('tr');
        const rawStats = player.rawStats || {};
        
        // Dados de utility dos stats brutos da Faceit - usando função auxiliar com fallbacks
        const enemiesFlashed = getUtilityStat(rawStats, ['Enemies Flashed', 'Enemies Flashed per Round']);
        const enemiesFlashedPerRound = parseFloat(getUtilityStat(rawStats, ['Enemies Flashed per Round in a Match', 'Enemies Flashed per Round']) || '0').toFixed(2);
        const flashCount = getUtilityStat(rawStats, ['Flash Count']);
        const flashSuccessRate = parseFloat(getUtilityStat(rawStats, ['Flash Success Rate per Match', 'Flash Success Rate']) || '0').toFixed(1);
        const flashSuccesses = getUtilityStat(rawStats, ['Flash Successes']);
        const flashesPerRound = parseFloat(getUtilityStat(rawStats, ['Flashes per Round in a Match', 'Flashes per Round']) || '0').toFixed(2);
        const utilityCount = getUtilityStat(rawStats, ['Utility Count']);
        const utilityDamage = getUtilityStat(rawStats, ['Utility Damage']);
        const utilityDamageSuccessRate = parseFloat(getUtilityStat(rawStats, ['Utility Damage Success Rate per Match', 'Utility Damage Success Rate']) || '0').toFixed(1);
        const utilityDamagePerRound = parseFloat(getUtilityStat(rawStats, ['Utility Damage per Round in a Match', 'Utility Damage per Round']) || '0').toFixed(2);
        const utilityEnemies = getUtilityStat(rawStats, ['Utility Enemies']);
        const utilitySuccessRate = parseFloat(getUtilityStat(rawStats, ['Utility Success Rate per Match', 'Utility Success Rate']) || '0').toFixed(1);
        const utilitySuccesses = getUtilityStat(rawStats, ['Utility Successes']);
        const utilityUsagePerRound = parseFloat(getUtilityStat(rawStats, ['Utility Usage per Round']) || '0').toFixed(2);

        // Montar nome exibido: username ( avatarFaceit + nicknameFaceit )
        const displayName = player.nickname || player.username || 'Player';
        const nicknameFaceit = player.nicknameFaceit || '';
        const avatarFaceit = (player.avatarFaceit && player.avatarFaceit.trim() !== '') 
            ? player.avatarFaceit 
            : '';
        const avatarFaceitHtml = avatarFaceit 
            ? `<img src="${avatarFaceit}" alt="${nicknameFaceit}" class="player-name-faceit-avatar" onerror="this.style.display='none';" style="display: inline-block;">` 
            : '';
        
        row.innerHTML = `
            <td>
                <div class="player-cell">
                    <img src="${player.avatar || '../img/avatar.jpg'}" alt="${player.nickname}" class="player-avatar" onerror="this.src='../img/avatar.jpg'">
                    <span class="player-name">
                        ${displayName}
                        ${nicknameFaceit ? `
                            <span class="player-name-faceit">
                                (${avatarFaceitHtml} ${nicknameFaceit})
                            </span>
                        ` : ''}
                    </span>
                </div>
            </td>
            <td><span class="stat-value">${enemiesFlashed}</span></td>
            <td><span class="stat-value">${enemiesFlashedPerRound}</span></td>
            <td><span class="stat-value">${flashCount}</span></td>
            <td><span class="stat-value">${flashSuccessRate}%</span></td>
            <td><span class="stat-value">${flashSuccesses}</span></td>
            <td><span class="stat-value">${flashesPerRound}</span></td>
            <td><span class="stat-value">${utilityCount}</span></td>
            <td><span class="stat-value">${utilityDamage}</span></td>
            <td><span class="stat-value">${utilityDamageSuccessRate}%</span></td>
            <td><span class="stat-value">${utilityDamagePerRound}</span></td>
            <td><span class="stat-value">${utilityEnemies}</span></td>
            <td><span class="stat-value">${utilitySuccessRate}%</span></td>
            <td><span class="stat-value">${utilitySuccesses}</span></td>
            <td><span class="stat-value">${utilityUsagePerRound}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    wrapper.appendChild(header);
    wrapper.appendChild(table);
    
    return wrapper;
}

// Criar tabela de duels para um time
function criarTabelaDuels(faction, teamClass) {
    if (!faction) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'stats-table-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const teamRating = faction.stats?.rating || '0.000';

    // Montar nome do time: nome Mixcamp (imagem Faceit + nome Faceit) se ambos existirem
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Rating: ${teamRating}</div>
            </div>
        </div>
    `;
    
    // Tabela
    const table = document.createElement('table');
    table.className = 'stats-table';
    
    // Cabeçalho da tabela de duels
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Jogador</th>
            <th>1v1 Count</th>
            <th>1v1 Wins</th>
            <th>1v1 Win Rate</th>
            <th>1v2 Count</th>
            <th>1v2 Wins</th>
            <th>1v2 Win Rate</th>
            <th>Entry Count</th>
            <th>Entry Wins</th>
            <th>Entry Rate</th>
            <th>Entry Success Rate</th>
            <th>First Kills</th>
            <th>Clutch Kills</th>
            <th>Damage</th>
            <th>Headshots</th>
            <th>Double Kills</th>
            <th>Triple Kills</th>
            <th>Quadro Kills</th>
            <th>Penta Kills</th>
        </tr>
    `;
    
    // Corpo
    const tbody = document.createElement('tbody');
    const roster = faction.roster || [];

    roster.forEach(player => {
        const row = document.createElement('tr');
        const rawStats = player.rawStats || {};
        
        // Dados de duels dos stats brutos da Faceit
        const v1Count = getUtilityStat(rawStats, ['1v1Count']);
        const v1Wins = getUtilityStat(rawStats, ['1v1Wins']);
        const v1WinRate = parseFloat(getUtilityStat(rawStats, ['Match 1v1 Win Rate']) || '0').toFixed(1);
        const v2Count = getUtilityStat(rawStats, ['1v2Count']);
        const v2Wins = getUtilityStat(rawStats, ['1v2Wins']);
        const v2WinRate = parseFloat(getUtilityStat(rawStats, ['Match 1v2 Win Rate']) || '0').toFixed(1);
        const entryCount = getUtilityStat(rawStats, ['Entry Count']);
        const entryWins = getUtilityStat(rawStats, ['Entry Wins']);
        const entryRate = parseFloat(getUtilityStat(rawStats, ['Match Entry Rate']) || '0').toFixed(1);
        const entrySuccessRate = parseFloat(getUtilityStat(rawStats, ['Match Entry Success Rate']) || '0').toFixed(1);
        const firstKills = getUtilityStat(rawStats, ['First Kills']);
        const clutchKills = getUtilityStat(rawStats, ['Clutch Kills', 'Clutch Kills (1vX)']);
        const damage = getUtilityStat(rawStats, ['Damage']);
        const headshots = getUtilityStat(rawStats, ['Headshots']);
        const doubleKills = getUtilityStat(rawStats, ['Double Kills']);
        const tripleKills = getUtilityStat(rawStats, ['Triple Kills']);
        const quadroKills = getUtilityStat(rawStats, ['Quadro Kills']);
        const pentaKills = getUtilityStat(rawStats, ['Penta Kills']);

        // Montar nome exibido: username ( avatarFaceit + nicknameFaceit )
        const displayName = player.nickname || player.username || 'Player';
        const nicknameFaceit = player.nicknameFaceit || '';
        const avatarFaceit = (player.avatarFaceit && player.avatarFaceit.trim() !== '') 
            ? player.avatarFaceit 
            : '';
        const avatarFaceitHtml = avatarFaceit 
            ? `<img src="${avatarFaceit}" alt="${nicknameFaceit}" class="player-name-faceit-avatar" onerror="this.style.display='none';" style="display: inline-block;">` 
            : '';
        
        row.innerHTML = `
            <td>
                <div class="player-cell">
                    <img src="${player.avatar || '../img/avatar.jpg'}" alt="${player.nickname}" class="player-avatar" onerror="this.src='../img/avatar.jpg'">
                    <span class="player-name">
                        ${displayName}
                        ${nicknameFaceit ? `
                            <span class="player-name-faceit">
                                (${avatarFaceitHtml} ${nicknameFaceit})
                            </span>
                        ` : ''}
                    </span>
                </div>
            </td>
            <td><span class="stat-value">${v1Count}</span></td>
            <td><span class="stat-value">${v1Wins}</span></td>
            <td><span class="stat-value">${v1WinRate}%</span></td>
            <td><span class="stat-value">${v2Count}</span></td>
            <td><span class="stat-value">${v2Wins}</span></td>
            <td><span class="stat-value">${v2WinRate}%</span></td>
            <td><span class="stat-value">${entryCount}</span></td>
            <td><span class="stat-value">${entryWins}</span></td>
            <td><span class="stat-value">${entryRate}%</span></td>
            <td><span class="stat-value">${entrySuccessRate}%</span></td>
            <td><span class="stat-value">${firstKills}</span></td>
            <td><span class="stat-value">${clutchKills}</span></td>
            <td><span class="stat-value">${damage}</span></td>
            <td><span class="stat-value">${headshots}</span></td>
            <td><span class="stat-value">${doubleKills}</span></td>
            <td><span class="stat-value">${tripleKills}</span></td>
            <td><span class="stat-value">${quadroKills}</span></td>
            <td><span class="stat-value">${pentaKills}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    wrapper.appendChild(header);
    wrapper.appendChild(table);
    
    return wrapper;
}

// Criar tabela de armas para um time
function criarTabelaArmas(faction, teamClass) {
    if (!faction) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'stats-table-wrapper';
    
    // Header do time
    const header = document.createElement('div');
    header.className = `team-header ${teamClass}`;
    
    const teamRating = faction.stats?.rating || '0.000';

    // Montar nome do time: nome Mixcamp (imagem Faceit + nome Faceit) se ambos existirem
    const faceitLogoHtml = '<span class="team-faceit-logo-wrapper"><img src="../img/faceit.png" alt="Faceit" class="team-faceit-logo" onerror="this.style.display=\'none\'"></span>';
    const timeNomeDisplay = faction.nameFaceit && faction.name !== faction.nameFaceit
        ? `${faction.name} (${faceitLogoHtml} ${faction.nameFaceit})`
        : faction.name;
    
    header.innerHTML = `
        <div class="team-header-info">
            <img src="${faction.avatar || '../img/cs2.png'}" alt="${faction.name}" class="team-logo-small" onerror="this.src='../img/cs2.png'">
            <div>
                <div class="team-name-header">${timeNomeDisplay}</div>
                <div class="team-rating-header">Rating: ${teamRating}</div>
            </div>
        </div>
    `;
    
    // Tabela
    const table = document.createElement('table');
    table.className = 'stats-table';
    
    // Cabeçalho da tabela de armas
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Jogador</th>
            <th>Pistol Kills</th>
            <th>Knife Kills</th>
            <th>Sniper Kill Rate/Match</th>
            <th>Sniper Kill Rate/Round</th>
            <th>Sniper Kills</th>
            <th>Zeus Kills</th>
        </tr>
    `;
    
    // Corpo
    const tbody = document.createElement('tbody');
    const roster = faction.roster || [];

    roster.forEach(player => {
        const row = document.createElement('tr');
        const rawStats = player.rawStats || {};
        
        // Dados de armas dos stats brutos da Faceit
        const pistolKills = getUtilityStat(rawStats, ['Pistol Kills']);
        const knifeKills = getUtilityStat(rawStats, ['Knife Kills']);
        const sniperKillRateMatch = parseFloat(getUtilityStat(rawStats, ['Sniper Kill Rate per Match']) || '0').toFixed(2);
        const sniperKillRateRound = parseFloat(getUtilityStat(rawStats, ['Sniper Kill Rate per Round']) || '0').toFixed(2);
        const sniperKills = getUtilityStat(rawStats, ['Sniper Kills']);
        const zeusKills = getUtilityStat(rawStats, ['Zeus Kills']);

        // Montar nome exibido: username ( avatarFaceit + nicknameFaceit )
        const displayName = player.nickname || player.username || 'Player';
        const nicknameFaceit = player.nicknameFaceit || '';
        const avatarFaceit = (player.avatarFaceit && player.avatarFaceit.trim() !== '') 
            ? player.avatarFaceit 
            : '';
        const avatarFaceitHtml = avatarFaceit 
            ? `<img src="${avatarFaceit}" alt="${nicknameFaceit}" class="player-name-faceit-avatar" onerror="this.style.display='none';" style="display: inline-block;">` 
            : '';
        
        row.innerHTML = `
            <td>
                <div class="player-cell">
                    <img src="${player.avatar || '../img/avatar.jpg'}" alt="${player.nickname}" class="player-avatar" onerror="this.src='../img/avatar.jpg'">
                    <span class="player-name">
                        ${displayName}
                        ${nicknameFaceit ? `
                            <span class="player-name-faceit">
                                (${avatarFaceitHtml} ${nicknameFaceit})
                            </span>
                        ` : ''}
                    </span>
                </div>
            </td>
            <td><span class="stat-value">${pistolKills}</span></td>
            <td><span class="stat-value">${knifeKills}</span></td>
            <td><span class="stat-value">${sniperKillRateMatch}</span></td>
            <td><span class="stat-value">${sniperKillRateRound}</span></td>
            <td><span class="stat-value">${sniperKills}</span></td>
            <td><span class="stat-value">${zeusKills}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    wrapper.appendChild(header);
    wrapper.appendChild(table);
    
    return wrapper;
}

// Renderizar seção MVP
function renderizarMVP(data) {
    if (!data.mvp) {
        return;
    }
    
    const mvp = data.mvp;
    
    document.getElementById('mvpName').textContent = mvp.nome;
    document.getElementById('mvpAvatar').src = mvp.avatar || '../img/avatar.jpg';
    document.getElementById('mvpRating').textContent = `10 ${mvp.rating.toFixed(3)}`;
    
    if (mvp.highlights) {
        if (mvp.highlights.kills) {
            document.getElementById('highlightKillsPlayer').textContent = mvp.highlights.kills.player;
            document.getElementById('highlightKillsValue').textContent = mvp.highlights.kills.value;
        }
        
        if (mvp.highlights.damage) {
            document.getElementById('highlightDamagePlayer').textContent = mvp.highlights.damage.player;
            document.getElementById('highlightDamageValue').textContent = mvp.highlights.damage.value;
        }
        
        if (mvp.highlights.kast) {
            document.getElementById('highlightKastPlayer').textContent = mvp.highlights.kast.player;
            document.getElementById('highlightKastValue').textContent = `${mvp.highlights.kast.value}%`;
        }
        
        if (mvp.highlights.firstKills) {
            document.getElementById('highlightFirstKillsPlayer').textContent = mvp.highlights.firstKills.player;
            document.getElementById('highlightFirstKillsValue').textContent = mvp.highlights.firstKills.value;
        }
    }
}

// Inicializar eventos
function inicializarEventos() {
    // Botões flutuantes
    const floatingStatsBtn = document.getElementById('floatingStatsBtn');
    const floatingDemoBtn = document.getElementById('floatingDemoBtn');
    const floatingGraphBtn = document.getElementById('floatingGraphBtn');
    const floatingContainer = document.querySelector('.floating-buttons-container');
    const statsPanel = document.getElementById('statsPanel');
    const closeStatsPanel = document.getElementById('closeStatsPanel');
    const floatingStatsIcon = document.getElementById('floatingStatsIcon');

    // Toggle dos botões flutuantes
    if (floatingStatsBtn && floatingContainer) {
        floatingStatsBtn.addEventListener('click', () => {
            floatingContainer.classList.toggle('expanded');
            floatingStatsBtn.classList.toggle('active');
            
            // Trocar ícone
            if (floatingStatsIcon) {
                if (floatingContainer.classList.contains('expanded')) {
                    floatingStatsIcon.className = 'fas fa-times';
                } else {
                    floatingStatsIcon.className = 'fas fa-bars';
                }
            }
        });
    }

    // Botão de Demo - Event listener é configurado na função downloadDemo()
    // Não precisa adicionar aqui para evitar duplicação

    // Botão de alternar logo (Faceit/Mixcamp) - sempre visível e funcional
    const toggleLogoBtn = document.getElementById('toggleLogoBtn');
    const toggleLogoFaceit = document.getElementById('toggleLogoFaceit');
    const toggleLogoMixcamp = document.getElementById('toggleLogoMixcamp');
    
    // Garantir que os botões sempre estejam visíveis
    if (toggleLogoBtn) {
        toggleLogoBtn.style.display = 'flex';
        toggleLogoBtn.style.visibility = 'visible';
    }
    if (toggleLogoFaceit) {
        toggleLogoFaceit.style.display = 'block';
        toggleLogoFaceit.style.visibility = 'visible';
    }
    if (toggleLogoMixcamp) {
        toggleLogoMixcamp.style.display = 'block';
        toggleLogoMixcamp.style.visibility = 'visible';
    }
    
    if (toggleLogoBtn && toggleLogoFaceit && toggleLogoMixcamp) {
        toggleLogoBtn.addEventListener('click', async () => {
            // Alternar classe active entre as duas imagens
            toggleLogoFaceit.classList.toggle('active');
            toggleLogoMixcamp.classList.toggle('active');
            
            // Alternar modo de visualização
            await alternarModoVisualizacao();
        });
    }

    // Botão de Gráficos
    if (floatingGraphBtn) {
        floatingGraphBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevenir que o evento se propague e feche o menu
            e.preventDefault();
            toggleVisualizacaoEstatisticas();
        });
    }

    if (closeStatsPanel && statsPanel) {
        closeStatsPanel.addEventListener('click', () => {
            statsPanel.classList.remove('show');
        });
    }

    // Fechar painel ao clicar fora
    if (statsPanel) {
        statsPanel.addEventListener('click', (e) => {
            if (e.target === statsPanel) {
                statsPanel.classList.remove('show');
            }
        });
    }

    // Fechar botões flutuantes ao clicar fora
    document.addEventListener('click', (e) => {
        if (floatingContainer && !floatingContainer.contains(e.target)) {
            floatingContainer.classList.remove('expanded');
            floatingStatsBtn?.classList.remove('active');
            if (floatingStatsIcon) {
                floatingStatsIcon.className = 'fas fa-bars';
            }
        }
    });

    // Tabs de navegação
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Implementar lógica de mudança de aba aqui
        });
    });
    
    // Tabs de estatísticas - usando delegação de eventos no container
    function setupStatsTabs() {
        const statsTabsContainer = document.querySelector('.stats-tabs');
        const statsTabs = document.querySelectorAll('.stats-tab');
        if (statsTabsContainer) {
            // Usar uma flag para evitar múltiplos event listeners
            if (statsTabsContainer.dataset.listenerAttached === 'true') {
                return;
            }
            statsTabsContainer.dataset.listenerAttached = 'true';
            
            // Usar delegação de eventos no container para garantir que funcione mesmo com cliques nos ícones/texto
            statsTabsContainer.addEventListener('click', function(e) {
                // Tentar encontrar o tab de várias formas
                let tab = e.target.closest('.stats-tab');
                if (!tab && e.target.parentElement) {
                    tab = e.target.parentElement.closest('.stats-tab');
                }
                if (!tab && e.target.parentElement?.parentElement) {
                    tab = e.target.parentElement.parentElement.closest('.stats-tab');
                }
                
                if (tab) {
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    const tipo = tab.getAttribute('data-stats');
    
                    // Renderizar tabelas baseado no tipo selecionado
                    if (matchData) {
                        if (tipo === 'utility') {
                            currentStatsType = 'utility';
                            renderizarTabelas(matchData, 'utility');
                        } else if (tipo === 'duels') {
                            currentStatsType = 'duels';
                            renderizarTabelas(matchData, 'duels');
                        } else if (tipo === 'armas') {
                            currentStatsType = 'armas';
                            renderizarTabelas(matchData, 'armas');
                        } else if (tipo === 'resumo' || tipo === 'todos-os-mapas') {
                            currentStatsType = 'resumo';
                            renderizarTabelas(matchData, 'resumo');
                        }
                    }
                }
            });
        } else {
            // Tentar novamente após um delay caso os elementos ainda não estejam no DOM
            setTimeout(() => {
                setupStatsTabs();
            }, 500);
        }
    }
    
    setupStatsTabs();
    
}

// Toggle entre visualização de jogadores e estatísticas
function toggleVisualizacaoEstatisticas() {
    const matchTeamsVs = document.getElementById('matchTeamsVs');
    const resultadoContent = document.querySelector('.resultado-content');
    
    if (!matchTeamsVs || !resultadoContent) {
        return;
    }

    // Verificar se está mostrando estatísticas (usando classe 'show')
    const isShowingStats = resultadoContent.classList.contains('show');
    
    if (isShowingStats) {
        // Animação de saída das estatísticas (slide para esquerda)
        resultadoContent.style.animation = 'slideOutToLeft 0.4s ease forwards';
        
        // Após a animação de saída, ocultar e mostrar jogadores
        setTimeout(() => {
            resultadoContent.classList.remove('show');
            resultadoContent.style.animation = '';
            
            // Mostrar jogadores com animação especial (slide da direita com escala)
            matchTeamsVs.classList.remove('hidden');
            // Forçar reflow para garantir que a animação funcione
            void matchTeamsVs.offsetWidth;
            matchTeamsVs.classList.add('slide-in-from-right');
            
            // Remover classe de animação após completar
            setTimeout(() => {
                matchTeamsVs.classList.remove('slide-in-from-right');
            }, 600);
        }, 400);
    } else {
        // Animação de saída dos jogadores
        matchTeamsVs.classList.add('fade-out');
        
        // Após a animação de saída, ocultar jogadores e mostrar estatísticas
        setTimeout(() => {
            matchTeamsVs.classList.add('hidden');
            matchTeamsVs.classList.remove('fade-out', 'fade-in');
            
            // Garantir que as tabelas e MVP estejam renderizadas
            if (matchData) {
                renderizarTabelas(matchData);
                renderizarMVP(matchData);
            }
            
            // Mostrar estatísticas com animação
            resultadoContent.classList.add('show');
            // Forçar reflow para garantir que a animação funcione
            void resultadoContent.offsetWidth;
        }, 250);
    }
}

// Atualizar painel de estatísticas
function atualizarPainelEstatisticas() {
    const statsPanelContent = document.getElementById('statsPanelContent');
    if (!statsPanelContent || !matchData) return;

    const data = matchData;
    const faction1 = data.teams?.faction1 || {};
    const faction2 = data.teams?.faction2 || {};
    const results = data.results || { score: { faction1: 0, faction2: 0 } };

    statsPanelContent.innerHTML = `
        <div class="stats-panel-item">
            <span class="stats-panel-label">Formato</span>
            <span class="stats-panel-value">Melhor de ${data.best_of || 1}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">Status</span>
            <span class="stats-panel-value">${data.status || 'N/A'}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">Região</span>
            <span class="stats-panel-value">${data.region || 'N/A'}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">${faction1.name || 'Time A'}</span>
            <span class="stats-panel-value highlight">${results.score?.faction1 || 0}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">${faction2.name || 'Time B'}</span>
            <span class="stats-panel-value highlight">${results.score?.faction2 || 0}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">Rating Time A</span>
            <span class="stats-panel-value">${faction1.stats?.rating || 'N/A'}</span>
        </div>
        <div class="stats-panel-item">
            <span class="stats-panel-label">Rating Time B</span>
            <span class="stats-panel-value">${faction2.stats?.rating || 'N/A'}</span>
        </div>
    `;
}

// Função para atualizar dados (pode ser chamada externamente)
// Pode ser chamada diretamente: atualizarDadosResultado(seuArrayDeDados)
function atualizarDadosResultado(novosDados) {
    matchData = novosDados;
    renderizarResultado(matchData);
}

// Função auxiliar para converter array simples em formato esperado
// Use esta função se você tiver um array simples de dados
function processarArrayResultado(arrayDados) {
    // Esta função pode ser adaptada conforme a estrutura do seu array
    // Por enquanto, assume que os dados já estão no formato correto
    if (Array.isArray(arrayDados)) {
        // Se for um array, você pode processá-lo aqui
        // Exemplo: converter array em objeto matchData
        // Adapte esta função conforme a estrutura do seu array
    }
    atualizarDadosResultado(arrayDados);
}

// ========= FUNÇÕES UTILITÁRIAS ========= // 

async function carregarImagensMapas() {
    try {
        const response = await fetch(`${API_URL}/imgmap`);
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
            imagensMapas = data[0];
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            imagensMapas = data;
        }
    } catch (error) {
        console.error('Erro ao carregar imagens dos mapas:', error);
    }
}

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}


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

document.addEventListener('DOMContentLoaded', async function() {
    // Garantir que a div match-teams-vs esteja visível
    const matchTeamsVs = document.getElementById('matchTeamsVs');
    if (matchTeamsVs) {
        matchTeamsVs.style.display = 'flex';
    }
    
    await carregarImagensMapas();
    filtrarDadosMatch(); // Fluxo principal que já chama buscarMatch
    inicializarEventos();
});

document.addEventListener('DOMContentLoaded', function() {
    verificar_auth();
    verificarTimeUsuario();
    addScrollProgress();
    filtrarDadosMatch();
    analisePlayers();
    setInterval(atualizarDadosMatch, 10000);
});

// Exportar funções para uso externo
window.atualizarDadosResultado = atualizarDadosResultado;
window.atualizarPlayersLevels = atualizarPlayersLevels;