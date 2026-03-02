// =================================
// ========= COMUNIDADE JS =========
// =================================
let avatar = '';
// Estado da aplicação
let currentMode = 'times';
let currentView = 'cards';
let currentPage = 1;
let itemsPerPage = 20;
let allData = [];
let filteredData = [];

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
        const perfil_data = await buscarDadosPerfil(userId);

        
        
        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        // Atualiza a UI para o usuário logado
        document.getElementById('userAuth').classList.add('hidden');
        document.getElementById('userPerfil').classList.remove('hidden');
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.usuario.time_id}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }
       

        const gerenciarCamp = document.getElementById("gerenciarCamp");
        if (perfil_data.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
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
// ========= BUSCAR DADOS =========

async function buscarDadosPerfil(userId) {
    
    try {
        if (!userId) {
            console.warn('buscarDadosPerfil: userId não fornecido');
            return null;
        }

        const perfilResponse = await fetch(`${API_URL}/perfil/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!perfilResponse.ok) {
            if (perfilResponse.status === 404) {
                console.warn(`Perfil ${userId} não encontrado (404)`);
                return null;
            }
            throw new Error(`Erro ao buscar dados do perfil: ${perfilResponse.status}`);
        }

        const perfilData = await perfilResponse.json();
        return perfilData;
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return null; // Retornar null em caso de erro
    }
}

// ------ LISTAR TIMES
async function DadosTimeLista(){
    
    try{
        const dados = await fetch(`${API_URL}/times/list`,{
            credentials: 'include'
        });

        if(dados.ok){
            const data = await dados.json();
            return data;
        }
        else{
            console.error(`Erro ao listar times: ${dados.status} ${dados.statusText}`);
            throw new Error(`Erro ao listar times: ${dados.status}`);
        }
    }
    catch(error){
        console.error('Erro ao listar times:', error);
        // Não mostrar notificação se for erro de conexão (servidor offline)
        if (error.message && !error.message.includes('Failed to fetch')) {
            showNotification('error', 'Erro ao listar times');
        }
        // Retornar estrutura vazia para evitar erros
        return { dados: [], dadosMembros: [] };
    }
}

// ------ LISTAR PLAYERS
async function DadosPlayersLista(){
    try{
        const dados = await fetch(`${API_URL}/users/perfils`,{
            credentials: 'include'
        });

        if(dados.ok){
            const data = await dados.json();
            return data || [];
        }
        else{
            console.error(`Erro ao listar players: ${dados.status} ${dados.statusText}`);
            throw new Error(`Erro ao listar players: ${dados.status}`);
        }
    }
    catch(error){
        console.error('Erro ao listar players:', error);
        // Não mostrar notificação se for erro de conexão (servidor offline)
        if (error.message && !error.message.includes('Failed to fetch')) {
            showNotification('error', 'Erro ao listar players');
        }
        // Retornar array vazio para evitar erros
        return [];
    }

}


// ------ TRANSFERÊNCIA DE DADOS
async function TransferenciaDeDados(){
    const dadosTimes = await DadosTimeLista();
    
    const todosOsTimes = []; // Array para armazenar todos os times
    
    // Verificar se há dados válidos
    if (!dadosTimes || !dadosTimes.dados || dadosTimes.dados.length === 0) {
        return todosOsTimes;
    }

    for(let i = 0; i < dadosTimes.dados.length; i++){
        const time = dadosTimes.dados[i];
        // Calcular quantidade de membros para este time
        const quantidadesMembros = dadosTimes.dadosMembros 
            ? dadosTimes.dadosMembros.filter(m => m.time_id === time.id).length 
            : 0;
        
        // Buscar dados do líder
        const lider_id = time.lider_id;
        let nickLider = 'Sem líder';
        
        try {
            const LiderPerfil = await buscarDadosPerfil(lider_id);
            if (LiderPerfil && LiderPerfil.usuario) {
                nickLider = LiderPerfil.usuario.username || LiderPerfil.usuario.nome || 'Sem líder';
            }
            
        } catch (error) {
            console.error(`Erro ao buscar perfil do líder ${lider_id}:`, error);
        }

        // Criar objeto com dados do time
        const dadosDoTime = {
            id: time.id,
            nome: time.nome,
            tag: time.tag,
            logo: time.avatar_time_url,
            membros: quantidadesMembros,
            posicao: time.posicoes,
            lider: nickLider,
            lider_id: lider_id
        };

        
        
        // Adicionar ao array de times
        todosOsTimes.push(dadosDoTime);
    }

    // console.log(todosOsTimes)
    return todosOsTimes;
}


// =================================
// ========= DATA LOADING =========  
function mapPosicaoEmoji(posicao) {
    switch (posicao) {
        case 'capitao': return '<img src="https://cdn-icons-png.flaticon.com/128/1253/1253686.png" alt="Capitão" class="posicao-icon">';
        case 'awp': return '<img src="https://img.icons8.com/offices/30/centre-of-gravity.png" alt="AWP" class="posicao-icon">';
        case 'entry': return '<img src="https://img.icons8.com/external-others-pike-picture/50/external-Centerfire-Rifle-Ammo-shooting-others-pike-picture.png" alt="Entry" class="posicao-icon">';
        case 'support': return '<img src="https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-smoke-grenade-battle-royale-flaticons-flat-flat-icons.png" alt="Support" class="posicao-icon">';
        case 'igl': return '<img src="https://cdn-icons-png.flaticon.com/128/6466/6466962.png" alt="IGL" class="posicao-icon">';
        case 'sub': return '<img src="https://cdn-icons-png.flaticon.com/128/10695/10695869.png" alt="Sub" class="posicao-icon">';
        case 'coach': return '<img src="https://img.icons8.com/doodle-line/60/headset.png" alt="Coach" class="posicao-icon">';
        case 'lurker': return '<img src="https://img.icons8.com/ios-filled/50/ninja-head.png" alt="Lurker" class="posicao-icon">';
        case 'rifle': return '<img src="https://img.icons8.com/external-ddara-lineal-ddara/64/external-gun-memorial-day-ddara-lineal-ddara.png" alt="Rifle" class="posicao-icon">';
        default: return '<img src="https://img.icons8.com/ios-filled/50/user.png" alt="Jogador" class="posicao-icon">';
    }
}

async function loadData() {
    const dadosDoPlayers = []
    const mockPlayers = []

    // Buscar todos os times (agora retorna um array)
    const dadosTimesArray = await TransferenciaDeDados();
    
    // Usar o array completo de times
    const mockTimes = Array.isArray(dadosTimesArray) ? dadosTimesArray : [];

    const dadosPlayers = await DadosPlayersLista();
    
    let position = []
    
    for(let i = 0; i < dadosPlayers.length; i++){
        const player = dadosPlayers[i];
       
        
        const perfil_data = await buscarDadosPerfil(player.id);
        
        // Verificar se perfil_data é válido
        if (!perfil_data || !perfil_data.usuario) {
           
            continue;
        }
    
        let position = perfil_data.usuario.posicoes
        
        
        if (position == null){
            
            position = ['player']; // Posição padrão para players sem posição definida
        }
        else{
            let posicoesArray = [];

            position = position.join(',')
            position = `"${position}"`
            
        }
        
        
        let time_nome = player.time_nome;
        
        // Normalizar nome do time e definir status (com time / sem time)
        if (!time_nome) {
            time_nome = 'Sem time';
        }
        const statusPlayer = time_nome === 'Sem time' ? 'without-team' : 'with-team';
        
        dadosDoPlayers.push({
            id: player.id,
            username: player.username,
            avatar: player.avatar_url,
            posicao: position,
            time: time_nome,
            status: statusPlayer
        })
        

        
        
        
    }
    
    

    for(let i = 0; i < dadosDoPlayers.length; i++){
        const player = dadosDoPlayers[i];
        
        

        

        mockPlayers.push({
            id: player.id,
            username: player.username,
            avatar: player.avatar,
            posicao: player.posicao,
            time: player.time,
            status: player.status
        })
    }

    



    
    if (currentMode === 'times') {
        allData = [...mockTimes];
        
    } else {
        allData = [...mockPlayers];
    }
    
    await filterData();
}

async function loadTransfersAndDepartures() {
    try {
        // Buscar dados completos das entradas e saídas (com player e team details)
        const entradasCompletas = await buscarDadosCompletosEntradas();
        const saidasCompletas = await buscarDadosCompletosSaidas();

        
        
        // Renderizar com dados completos
        renderTransfers(entradasCompletas);
        renderDepartures(saidasCompletas);
        setupCarousels();
    } catch (error) {
        console.error('Erro ao carregar transferências:', error);
        
        // Em caso de erro, mostrar mensagem de erro em vez de mocks
        renderTransfers([]);
        renderDepartures([]);
        setupCarousels();
    }
}



// =================================
// ========= FILTERING =========
// =================================

async function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const positionFilter = document.getElementById('positionFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredData = allData.filter(item => {
        // Busca por texto
        let matchesSearch = true;
        if (searchTerm) {
            if (currentMode === 'times') {
                matchesSearch = item.nome.toLowerCase().includes(searchTerm) || 
                              item.tag.toLowerCase().includes(searchTerm);
            } else {
                matchesSearch = item.username.toLowerCase().includes(searchTerm);
            }
        }

        // Filtros específicos
        let matchesFilters = true;
        
        if (currentMode === 'times') {
            const memberCount = document.getElementById('memberCountFilter').value;
            if (memberCount) {
                const [min, max] = memberCount.split('-').map(Number);
                matchesFilters = item.membros >= min && item.membros <= max;
            }
        } else {
            const positionFilter = document.getElementById('positionFilter');
            const position = positionFilter ? positionFilter.querySelector('.select-option.selected')?.getAttribute('data-value') || '' : '';
            const statusFilter = document.getElementById('statusFilter');
            const status = statusFilter ? statusFilter.querySelector('.select-option.selected')?.getAttribute('data-value') || '' : '';
            
            
            
            if (position) {
                // Verificar se a posição está no array de posições do player (case-insensitive)
                const positionLower = position.toLowerCase();
                const hasPosition = Array.isArray(item.posicao) ? 
                    item.posicao.some(pos => pos.toLowerCase() === positionLower) : 
                    item.posicao.toLowerCase() === positionLower;
                    
               
                matchesFilters = matchesFilters && hasPosition;
            }
            if (status) {
                const hasStatus = item.status === status;
                
                matchesFilters = matchesFilters && hasStatus;
            }
        }

        return matchesSearch && matchesFilters;
    });
    
    

    currentPage = 1;
    await renderResults();
}

// =================================
// ========= RENDERING =========
// =================================

async function renderResults() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    

    if (currentView === 'cards') {
        await renderCards(pageData);
    } else if (currentView === 'list') {
        renderList(pageData);
    } else if (currentView === 'block') {
        renderBlocks(pageData);
    }

    updateResultsInfo();
    renderPagination();
}

async function renderCards(data) {
    
    const container = document.getElementById('resultsCards');
    container.innerHTML = '';

    for (const item of data) {
        
        const card = await createCard(item);
        container.appendChild(card);
    }
}

function renderList(data) {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    data.forEach(item => {
        const listItem = createListItem(item);
        container.appendChild(listItem);
    });
}

function renderBlocks(data) {
    const container = document.getElementById('resultsBlocks');
    if (!container) return;
    container.innerHTML = '';

    data.forEach(item => {
        const block = createBlockItem(item);
        container.appendChild(block);
    });
}

function createBlockItem(item) {
    
    const block = document.createElement('div');
    block.className = 'result-block';
    block.onclick = () => handleItemClick(item);

    if (currentMode === 'times') {
        block.innerHTML = `
            <div class="result-block-main">
                <div class="result-block-avatar-wrapper">
                    <img src="${item.logo}" alt="${item.nome}" class="result-block-avatar">
                </div>
                <div class="result-block-info">
                    <div class="result-block-title-row">
                        <h3 class="result-block-name">${item.nome}</h3>
                        <span class="result-block-tag">${item.tag}</span>
                    </div>
                    <div class="result-block-meta">
                        <span class="meta-item">
                            <i class="fas fa-users"></i>
                            ${item.membros} membros
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-crown"></i>
                            ${item.lider}
                        </span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Players em modo bloco
        let posicaoHTML = '';
        if (item.posicao && item.posicao.length > 0 && item.posicao[0] !== 'player') {
            posicaoHTML = getPositionBadges(item.posicao);
        } else {
            
            posicaoHTML = '<span class="result-block-tag">Não selecionada</span>';
        }

        block.innerHTML = `
            <div class="result-block-main">
                <div class="result-block-avatar-wrapper">
                    <img src="${item.avatar}" alt="${item.username}" class="result-block-avatar">
                </div>
                <div class="result-block-info">
                    <div class="result-block-title-row">
                        <h3 class="result-block-name">${item.username}</h3>
                        ${posicaoHTML}
                    </div>
                    <div class="result-block-meta">
                        <span class="meta-item">
                            <i class="fas fa-users"></i>
                            ${item.time || 'Sem time'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    return block;
}

async function createCard(item) {
    
    
    const card = document.createElement('div');
    card.className = 'result-card';
    card.onclick = () => handleItemClick(item);

    if (currentMode === 'times') {

        card.innerHTML = `
            <div class="result-card-header">
                <img src="${item.logo}" alt="${item.nome}" class="result-card-avatar">
                <div class="result-card-info">
                    <h3>${item.nome}</h3>
                    <span class="tag">${item.tag}</span>
                </div>
            </div>
            <div class="result-card-details">
                <div class="detail">
                    <i class="fas fa-users"></i>
                    <span>${item.membros} membros</span>
                </div>
                <div class="detail">
                    <i class="fas fa-crown"></i>
                    <span>${item.lider}</span>
                </div>
            </div>
        `;
    } else {
        // Gerar badges de posição ou mostrar "não selecionada"
        let posicaoHTML = '';
        
        if (item.posicao && item.posicao.length > 0 && item.posicao[0] !== 'player') {
            
            posicaoHTML = getPositionBadges(item.posicao);

            
        } else {
            posicaoHTML = '<span class="tag">Não selecionada</span>';
        }
        
       
        card.innerHTML = `
            <div class="result-card-header">
                <img src="${item.avatar}" alt="${item.username}" class="result-card-avatar">
                <div class="result-card-info">
                    <h3>${item.username}</h3>
                    ${posicaoHTML}
                    
                </div>
            </div>
            <div class="result-card-details">
                <div class="detail">
                    <i class="fas fa-users"></i>
                    <span>${item.time || 'Sem time'}</span>
                </div>
            </div>
        `;
    }

    return card;
}

function createListItem(item) {
    const listItem = document.createElement('div');
    listItem.className = 'result-list-item';
    listItem.onclick = () => handleItemClick(item);

    if (currentMode === 'times') {
        listItem.innerHTML = `
            <img src="${item.logo}" alt="${item.nome}" class="result-list-avatar">
            <div class="result-list-info">
                <div class="result-list-name">${item.nome}</div>
                <div class="result-list-tag">${item.tag}</div>
                <div class="result-list-detail">
                    <i class="fas fa-users"></i>
                    <span>${item.membros} membros</span>
                </div>
                <div class="result-list-detail">
                    <i class="fas fa-crown"></i>
                    <span>${item.lider}</span>
                </div>
            </div>
        `;
    } else {
        // Gerar badges de posição ou mostrar "não selecionada"
        let posicaoHTML = '';
        if (item.posicao && item.posicao.length > 0 && item.posicao[0] !== 'player') {
            posicaoHTML = getPositionBadges(item.posicao);
        } else {
            
            
            posicaoHTML = '<div class="result-list-tag">Não selecionada</div>';
        }
        
        
        listItem.innerHTML = `
            <img src="${item.avatar}" alt="${item.username}" class="result-list-avatar">
            <div class="result-list-info">
                <div class="result-list-name">${item.username}</div>
                ${posicaoHTML}
                <div class="result-list-detail">
                    <i class="fas fa-users"></i>
                    <span>${item.time || 'Sem time'}</span>
                </div>
            </div>
        `;
    }

    return listItem;
}

function handleItemClick(item) {
    if (currentMode === 'times') {
        // Redirecionar para página do time
        window.location.href = `team.html?id=${item.id}`;
    } else {
        // Redirecionar para perfil do player
        window.location.href = `perfil.html?id=${item.id}`;
    }
}


// =================================
// ========= PAGINAÇÃO =========


function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Botão anterior
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Páginas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    // Botão próximo
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderResults();
    }
}

function updateResultsInfo() {
    const info = document.getElementById('resultsCount');
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);
    
    info.textContent = `${filteredData.length} resultados (${startIndex}-${endIndex})`;
}

// =================================
// ========= TRANSFERS & DEPARTURES ========= // TODO: inserir no html
// =================================

function renderTransfers(data = null) {

    const viewport = document.getElementById('transfersGrid');
    const track = document.getElementById('transfersTrack');
    if (!viewport || !track) return;
    track.innerHTML = '';

    // Usar dados reais se fornecidos, senão array vazio (mensagem "nenhum dado" já tratada abaixo)
    const items = data && data.length > 0 ? data : [];
    
    // Se não há dados, mostrar mensagem ou ocultar seção
    if (!items || items.length === 0) {
        track.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma transferência encontrada</p>
            </div>
        `;
        return;
    }
    
    items.forEach( async transfer =>  {
        
        // Para dados de entrada, a posição está diretamente em transfer.team.posicao
        let posicao = transfer.team.posicao;
        
        // Se posicao é um array (dados antigos), buscar a posição do usuário
        if (Array.isArray(posicao)) {
            posicao = null;
            for (let i = 0; i < transfer.team.posicao.length; i++){
                if (transfer.team.posicao[i].usuario_id == transfer.player.id){
                    posicao = transfer.team.posicao[i].position
                    break; // Sair do loop quando encontrar a posição
                }
            }
        }

       
        const card = document.createElement('div');
        card.className = 'transfer-card';
        // Verificar se é dados completos (com player/team objects) ou dados básicos do backend
        const isCompleteData = transfer.player && transfer.team;

        
        
        if (isCompleteData) {
            // Dados completos com player e team details
            card.innerHTML = `
                <div class="transfer-content">
                    <div class="player-info" onclick="handlePlayerClick(${transfer.player.id})">
                        <div class="player-avatar-container">
                            <img src="${transfer.player.avatar}" alt="${transfer.player.time_tag}" class="player-avatar">
                            ${getPositionBadges(transfer.player.posicao)}
                        </div>
                        <div class="player-details">
                            <h3 class="player-name">${transfer.player.nome}</h3>
                        </div>
                    </div>
                    <div class="transfer-icon">
                        <i class="fas fa-door-open transfer-door-icon" style="color: #4caf50; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    <div class="team-info" onclick="handleTeamClick(${transfer.team.id})">
                        <div class="team-logo-container">
                            <img src="${transfer.team.logo}" alt="${transfer.team.nome}" class="team-logo">
                            ${getPositionBadges(posicao)}
                        </div>
                        <div class="team-details">
                            <h3 class="team-name">${transfer.team.nome}</h3>
                        </div>
                    </div>
                </div>
                <div class="transfer-date">${transfer.data}</div>
            `;
        } else {
            // Dados básicos do backend (usuario_id, time_id) ou mocks
            const isRealData = transfer.usuario_id !== undefined;
            
            if (isRealData) {
                // Dados básicos do backend
                card.innerHTML = `
                    <div class="transfer-content">
                        <div class="player-info" onclick="handlePlayerClick(${transfer.usuario_id})">
                            <img src="../img/avatar.jpg" alt="User ${transfer.usuario_id}" class="player-avatar">
                            <div class="player-details">
                                <h3 class="player-name">User ${transfer.usuario_id}</h3>
                            </div>
                        </div>
                        <div class="transfer-icon">
                        <i class="fas fa-door-open transfer-door-icon" style="color: #4caf50; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                        <div class="team-info" onclick="handleTeamClick(${transfer.time_id})">
                            <img src="../img/cs2.png" alt="Team ${transfer.time_id}" class="team-logo">
                            <div class="team-details">
                                <h3 class="team-name">Team ${transfer.time_id}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="transfer-date">${transfer.data_criacao || 'Data não disponível'}</div>
                `;
            } else {
                // Dados mock
                card.innerHTML = `
                    <div class="transfer-content">
                        <div class="player-info" onclick="handlePlayerClick(${transfer.player.id})">
                            <img src="${transfer.player.avatar}" alt="${transfer.player.time_tag}" class="player-avatar">
                            <div class="player-details">
                                <h3 class="player-name">${transfer.player.time_tag}</h3>
                            </div>
                        </div>
                        <div class="transfer-icon">
                        <i class="fas fa-door-open transfer-door-icon" style="color: #4caf50; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                        <div class="team-info" onclick="handleTeamClick(${transfer.team.id})">
                            <img src="${transfer.team.logo}" alt="${transfer.team.nome}" class="team-logo">
                            <div class="team-details">
                                <h3 class="team-name">${transfer.team.nome}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="transfer-date">${transfer.data}</div>
                `;
            }
        }
        track.appendChild(card);
    });
}

function renderDepartures(data = null) {
    const viewport = document.getElementById('departuresGrid');
    const track = document.getElementById('departuresTrack');
    if (!viewport || !track) return;
    track.innerHTML = '';

    
    // Usar dados reais se fornecidos, senão array vazio (mensagem "nenhum dado" já tratada abaixo)
    const items = data && data.length > 0 ? data : [];
    
    // Se não há dados, mostrar mensagem ou ocultar seção
    if (!items || items.length === 0) {
        track.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma saída encontrada</p>
            </div>
        `;
        return;
    }
    
    items.forEach(departure => {
       
        const card = document.createElement('div');
        card.className = 'departure-card';
        // Verificar se é dados completos (com player/team objects) ou dados básicos do backend
        const isCompleteData = departure.player && departure.team;
        
        if (isCompleteData) {
            // Dados completos com player e team details
            card.innerHTML = `
                <div class="saida-content">
                    <div class="player-info" onclick="handlePlayerClick(${departure.player.id})">
                        <div class="player-avatar-container">
                            <img src="${departure.player.avatar}" alt="${departure.player.time_tag}" class="player-avatar">
                            ${getPositionBadges(departure.player.posicao)}
                        </div>
                        <div class="player-details">
                            <h3 class="player-name">${departure.player.nome}</h3>
                        </div>
                    </div>
                    <div class="transfer-icon">
                        <i class="fas fa-door-open departure-door-icon" style="color: #f44336; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-left"></i>
                    </div>
                    <div class="team-info" onclick="handleTeamClick(${departure.team.id})">
                        <div class="team-logo-container">
                            <img src="${departure.team.logo}" alt="${departure.team.nome}" class="team-logo">
                            ${getPositionBadges(departure.team.posicao)}
                        </div>
                        <div class="team-details">
                            <h3 class="team-name">${departure.team.nome}</h3>
                        </div>
                    </div>
                </div>
                <div class="transfer-date">${departure.data}</div>
            `;
        } else {
            // Dados básicos do backend (usuario_id, time_id) ou mocks
            const isRealData = departure.usuario_id !== undefined;
            
            if (isRealData) {
                // Dados básicos do backend
                card.innerHTML = `
                    <div class="saida-content">
                        <div class="player-info" onclick="handlePlayerClick(${departure.usuario_id})">
                            <img src="../img/avatar.jpg" alt="User ${departure.usuario_id}" class="player-avatar">
                            <div class="player-details">
                                <h3 class="player-name">User ${departure.usuario_id}</h3>
                            </div>
                        </div>
                        <div class="transfer-icon">
                        <i class="fas fa-door-open departure-door-icon" style="color: #f44336; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-left"></i>
                    </div>
                        <div class="team-info" onclick="handleTeamClick(${departure.time_id})">
                            <img src="../img/cs2.png" alt="Team ${departure.time_id}" class="team-logo">
                            <div class="team-details">
                                <h3 class="team-name">Team ${departure.time_id}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="transfer-date">${departure.data_criacao || 'Data não disponível'}</div>
                `;
            } else {
                // Dados mock
                card.innerHTML = `
                    <div class="saida-content">
                        <div class="player-info" onclick="handlePlayerClick(${departure.player.id})">
                            <img src="${departure.player.avatar}" alt="${departure.player.time_tag}" class="player-avatar">
                            <div class="player-details">
                                <h3 class="player-name">${departure.player.time_tag}</h3>
                            </div>
                        </div>
                        <div class="transfer-icon">
                        <i class="fas fa-door-open departure-door-icon" style="color: #f44336; margin-right: 8px;"></i>
                        <i class="fas fa-arrow-left"></i>
                    </div>
                        <div class="team-info" onclick="handleTeamClick(${departure.team.id})">
                            <img src="${departure.team.logo}" alt="${departure.team.nome}" class="team-logo">
                            <div class="team-details">
                                <h3 class="team-name">${departure.team.nome}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="transfer-date">${departure.data}</div>
                `;
            }
        }
        track.appendChild(card);
    });
}

// =================================
// ========= VERIFICAR TIME DO USUÁRIO OU CRIAR TIME =========
async function verificarTimeUsuario() {
    const auth_dados = await autenticacao();
    try {
        if(auth_dados.logado){
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


async function criarTime() {
    const form = document.getElementById('formCriarTime');
    const formData = new FormData(form);
    
    const data = {
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
            window.location.href = `team.html?id=${result.time.id}`;
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
// ========= MODE SWITCHING - FILTROS =========

function switchMode(mode) {
    currentMode = mode;
    currentPage = 1;
    
    // Atualizar botões
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Mostrar/ocultar filtros
    document.getElementById('timesFilters').style.display = mode === 'times' ? 'block' : 'none';
    document.getElementById('playersFilters').style.display = mode === 'players' ? 'block' : 'none';

    // Atualizar placeholder
    const searchInput = document.getElementById('searchInput');
    searchInput.placeholder = mode === 'times' ? 'Pesquisar times...' : 'Pesquisar players...';

    // Recarregar dados
    loadData();
}

function switchView(view) {
    currentView = view;
    
    // Atualizar botões
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Mostrar/ocultar views
    const cardsEl = document.getElementById('resultsCards');
    const listEl = document.getElementById('resultsList');
    const blocksEl = document.getElementById('resultsBlocks');

    if (cardsEl) cardsEl.style.display = view === 'cards' ? 'block' : 'none';
    if (listEl) listEl.style.display = view === 'list' ? 'block' : 'none';
    if (blocksEl) blocksEl.style.display = view === 'block' ? 'block' : 'none';

    // Re-renderizar
    renderResults();
}



// =================================
// ========= CLICK HANDLERS =========
// =================================

function handlePlayerClick(playerId) {
    // Redirecionar para perfil do player usando ID
    window.location.href = `perfil.html?id=${playerId}`;
}

function handleTeamClick(teamId) {
    // Redirecionar para página do time
    window.location.href = `team.html?id=${teamId}`;
}

// =================================
// ========= CARROSSEL DE TRANSFERENCIAS E SAIDAS =========

function initializeEventListeners() {
    // Toggle entre Times e Players
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchMode(mode);
        });
    });

    // Toggle entre Cards e Lista
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            switchView(view);
        });
    });

    // Busca em tempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', async function() {
            await filterData();
        });
    }

    // Filtros
    document.getElementById('memberCountFilter')?.addEventListener('change', async () => await filterData());
    
    // Custom Select para posições
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
        const trigger = positionFilter.querySelector('.select-trigger');
        const options = positionFilter.querySelectorAll('.select-option');
        
        trigger.addEventListener('click', function() {
            positionFilter.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.querySelector('span').textContent;
                
                // Atualizar o trigger
                trigger.querySelector('.select-value').textContent = text;
                
                // Remover seleção anterior
                options.forEach(opt => opt.classList.remove('selected'));
                // Adicionar seleção atual
                this.classList.add('selected');
                
                // Fechar dropdown
                positionFilter.classList.remove('active');
                
                // Disparar evento de mudança
                const event = new Event('change');
                positionFilter.dispatchEvent(event);
            });
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!positionFilter.contains(e.target)) {
                positionFilter.classList.remove('active');
            }
        });
        
        // Event listener para o filtro
        positionFilter.addEventListener('change', async () => await filterData());
    }
    
    // Custom Select para status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        const trigger = statusFilter.querySelector('.select-trigger');
        const options = statusFilter.querySelectorAll('.select-option');
        
        trigger.addEventListener('click', function() {
            statusFilter.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.querySelector('span').textContent;
                
                // Atualizar o trigger
                trigger.querySelector('.select-value').textContent = text;
                
                // Remover seleção anterior
                options.forEach(opt => opt.classList.remove('selected'));
                // Adicionar seleção atual
                this.classList.add('selected');
                
                // Fechar dropdown
                statusFilter.classList.remove('active');
                
                // Disparar evento de mudança
                const event = new Event('change');
                statusFilter.dispatchEvent(event);
            });
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!statusFilter.contains(e.target)) {
                statusFilter.classList.remove('active');
            }
        });
        
        // Event listener para o filtro
        statusFilter.addEventListener('change', async () => await filterData());
    }

    // Removido controles do carrossel (não mais necessário)
}


// Carrossel: navegação 3 por vez

function setupCarousels() {
    createCarousel({
        viewportId: 'transfersGrid',
        trackId: 'transfersTrack',
        prevBtnId: 'transfersPrev',
        nextBtnId: 'transfersNext'
    });

    createCarousel({
        viewportId: 'departuresGrid',
        trackId: 'departuresTrack',
        prevBtnId: 'departuresPrev',
        nextBtnId: 'departuresNext'
    });
}

function createCarousel({ viewportId, trackId, prevBtnId, nextBtnId }) {
    const viewport = document.getElementById(viewportId);
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const visibleCount = 3;
    const gapPx = 20; // deve bater com o CSS .carousel-track gap

    const getCardWidth = () => {
        // Como usamos flex-basis com calc((100% - 40px) / 3), podemos medir o primeiro filho
        const first = track.children[0];
        if (!first) return 0;
        const style = window.getComputedStyle(first);
        return first.getBoundingClientRect().width + gapPx; // largura + gap
    };

    function updateButtons() {
        const total = track.children.length;
        const maxIndex = Math.max(0, total - visibleCount);
        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= maxIndex;
    }

    function applyTransform() {
        const cardWidth = getCardWidth();
        const offset = -(currentIndex * cardWidth);
        track.style.transform = `translateX(${offset}px)`;
        updateButtons();
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        applyTransform();
    });

    nextBtn.addEventListener('click', () => {
        const total = track.children.length;
        const maxIndex = Math.max(0, total - visibleCount);
        currentIndex = Math.min(maxIndex, currentIndex + 1);
        applyTransform();
    });

    // Recalcular ao redimensionar
    window.addEventListener('resize', applyTransform);

    // Inicializar
    setTimeout(applyTransform, 0);
}




// =================================
// ========= SISTEMA DE DADOS DA TRANSFERENCIA E SAIDA =========


async function listarTransferencias() {
    try {
        const response = await fetch(`${API_URL}/transferencias`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Endpoint /transferencias não encontrado (404)');
                return [];
            }
            throw new Error(`Erro ao listar transferências: ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Erro ao listar transferências:', error);
        return []; // Retornar array vazio em caso de erro
    }
}

async function listarEntrada(){
    let data = await listarTransferencias();
    let entradas = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].tipo === 'entrada') {
            entradas.push(data[i]);
        }
    }
    return entradas;
}

async function listarSaida(){
    let data = await listarTransferencias();
    let saidas = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].tipo === 'saida') {
            saidas.push(data[i]);
        }
    }
    return saidas;
}

// Função para formatar data
function formatarData(dataISO) {
    if (!dataISO) return 'Data não disponível';
    
    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return 'Data inválida';
        
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
}

async function buscarDadosCompletosEntradas(){
    const entradas = await listarEntrada();
    
    const dadosCompletos = [];
    
    for (let i = 0; i < entradas.length; i++) {
        const entrada = entradas[i];
        const posicao = entrada.posicao;
        const usuarioId = entrada.usuario_id;
        const timeId = entrada.time_id;
        
        try {
            // Buscar dados do player
            const perfilResponse = await fetch(`${API_URL}/perfil/${usuarioId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            // Buscar dados do time
            const timeResponse = await fetch(`${API_URL}/times/${timeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            let playerData = { nome: `User ${usuarioId}`, avatar: '../img/avatar.jpg' };
            let teamData = { nome: `Team ${timeId}`, logo: '../img/cs2.png', posicao: posicao };
            
            if (perfilResponse.ok) {
                const perfilJson = await perfilResponse.json();
                
                
                // Tentar diferentes estruturas de dados
                const usuario = perfilJson.perfilData?.usuario || perfilJson.usuario || perfilJson;
                
                
                playerData = {
                    nome: usuario.nome || usuario.username || usuario.nome_completo || `User ${usuarioId}`,
                    avatar: usuario.avatar_url || usuario.avatar || '../img/avatar.jpg',
                    posicao: usuario.posicao || 'N/A'
                };
                
            }
            
            if (timeResponse.ok) {
                const timeJson = await timeResponse.json();
                
                const time = timeJson.time || {};
                const membros = timeJson.membros || [];
                
                
                // Buscar posição do primeiro membro (ou líder)
                let dad = [];
                let posicaoTime = {};
                if (membros.length > 0) {
                    posicaoTime = membros[0].posicao || 'N/A';
                    for(let j = 0; j < membros.length; j++){
                        

                        posicaoTime = {usuario_id: membros[j].usuario_id, position: membros[j].posicao}
                        dad.push(posicaoTime)
                        
                    }
                }
                teamData = {
                    nome: time.nome || `Team ${timeId}`,
                    logo: time.avatar_time_url || '../img/cs2.png',
                    posicao: posicao
                };
                
                
            }
            
            // Montar objeto completo para o card
            const dataOriginal = entrada.data_criacao || entrada.data || entrada.created_at || entrada.timestamp;
            const dadosCompletosItem = {
                id: entrada.id,
                player: {
                    id: usuarioId,
                    nome: playerData.nome,
                    avatar: playerData.avatar,
                    posicao: playerData.posicao || 'N/A'
                },
                team: {
                    id: timeId,
                    nome: teamData.nome,
                    logo: teamData.logo,
                    posicao: teamData.posicao
                },
                tipo: entrada.tipo,
                data: formatarData(dataOriginal),
                dataOriginal: dataOriginal // Salvar data original para ordenação
            };
            
            dadosCompletos.push(dadosCompletosItem);
           
            
        } catch (error) {
            
            // Adicionar dados básicos em caso de erro
            const dataOriginal = entrada.data_criacao || entrada.data || entrada.created_at || entrada.timestamp;
            dadosCompletos.push({
                id: entrada.id,
                player: { id: usuarioId, nome: `User ${usuarioId}`, avatar: '../img/avatar.jpg', posicao: 'N/A' },
                team: { id: timeId, nome: `Team ${timeId}`, logo: '../img/cs2.png' },
                tipo: entrada.tipo,
                data: formatarData(dataOriginal),
                dataOriginal: dataOriginal // Salvar data original para ordenação
            });
        }
    }
    
    // Ordenar por data decrescente (mais recentes primeiro)
    dadosCompletos.sort((a, b) => {
        const dataA = new Date(a.dataOriginal || 0);
        const dataB = new Date(b.dataOriginal || 0);
        return dataB - dataA; // Ordem decrescente
    });
    
    return dadosCompletos;
}

async function buscarDadosCompletosSaidas(){
    const saidas = await listarSaida();
    
    
    const dadosCompletos = [];
    
    for (let i = 0; i < saidas.length; i++) {
        const saida = saidas[i];
        const usuarioId = saida.usuario_id;
        const timeId = saida.time_id;
        const posicao = saida.posicao;
        
        
        try {
            // Buscar dados do player
            const perfilResponse = await fetch(`${API_URL}/perfil/${usuarioId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            // Buscar dados do time
            const timeResponse = await fetch(`${API_URL}/times/${timeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            let playerData = { nome: `User ${usuarioId}`, avatar: '../img/avatar.jpg' };
            let teamData = { nome: `Team ${timeId}`, logo: '../img/cs2.png', posicao: posicao };
            
            if (perfilResponse.ok) {
                const perfilJson = await perfilResponse.json();
                
                
                // Tentar diferentes estruturas de dados
                const usuario = perfilJson.perfilData?.usuario || perfilJson.usuario || perfilJson;
                
                
                playerData = {
                    nome: usuario.nome || usuario.username || usuario.nome_completo || `User ${usuarioId}`,
                    avatar: usuario.avatar_url || usuario.avatar || '../img/avatar.jpg',
                    posicao: usuario.posicao || 'N/A'
                };
                
            }
            
            if (timeResponse.ok) {
                const timeJson = await timeResponse.json();
                
                const time = timeJson.time || {};
                const membros = timeJson.membros || [];
                
                
                // Buscar posição do primeiro membro (ou líder)
                // let posicaoTime = 'N/A';
                // if (membros.length > 0) {
                //     for(let j = 0; j < membros.length; j++){
                //         posicaoTime = membros[j].posicao || 'N/A';
                //     }
                // }
                
                
                
                teamData = {
                    nome: time.nome || `Team ${timeId}`,
                    logo: time.avatar_time_url || '../img/cs2.png',
                    posicao: posicao
                };
                
            }
            
            // Montar objeto completo para o card
            const dataOriginal = saida.data_criacao || saida.data || saida.created_at || saida.timestamp;
            const dadosCompletosItem = {
                id: saida.id,
                player: {
                    id: usuarioId,
                    nome: playerData.nome,
                    avatar: playerData.avatar,
                    posicao: playerData.posicao || 'N/A'
                },
                team: {
                    id: timeId,
                    nome: teamData.nome,
                    logo: teamData.logo,
                    posicao: teamData.posicao
                },
                tipo: saida.tipo,
                data: formatarData(dataOriginal),
                dataOriginal: dataOriginal // Salvar data original para ordenação
            };
            
            dadosCompletos.push(dadosCompletosItem);
           
            
        } catch (error) {
            console.error(`Erro ao buscar dados para saída ${i+1}:`, error);
            // Adicionar dados básicos em caso de erro
            const dataOriginal = saida.data_criacao || saida.data || saida.created_at || saida.timestamp;
            dadosCompletos.push({
                id: saida.id,
                player: { id: usuarioId, nome: `User ${usuarioId}`, avatar: '../img/avatar.jpg', posicao: 'N/A' },
                team: { id: timeId, nome: `Team ${timeId}`, logo: '../img/cs2.png' },
                tipo: saida.tipo,
                data: formatarData(dataOriginal),
                dataOriginal: dataOriginal // Salvar data original para ordenação
            });
        }
    }
    
    // Ordenar por data decrescente (mais recentes primeiro)
    dadosCompletos.sort((a, b) => {
        const dataA = new Date(a.dataOriginal || 0);
        const dataB = new Date(b.dataOriginal || 0);
        return dataB - dataA; // Ordem decrescente
    });
    
    return dadosCompletos;
}


// =================================
// ========= FUNÇÃO PARA BADGES DE POSIÇÃO =========
// =================================

// Versão híbrida que tenta buscar do banco, mas funciona síncrona
function getPositionBadges(posicoes) {
    
    if (!posicoes || (Array.isArray(posicoes) && posicoes.length === 0)) {
        return '<div class="position-badge-container"></div>';
    }
    
    let posicoesArray = [];
    
    // Se é um array, usar diretamente
    if (Array.isArray(posicoes)) {
        posicoesArray = posicoes;
    }
    // Se é uma string com vírgulas, dividir
    else if (typeof posicoes === 'string' && posicoes.includes(',')) {
        posicoesArray = posicoes.split(',').map(p => p.trim());
    }
    // Se é uma string simples
    else {
        posicoesArray = [posicoes];
    }
    
    // Sistema inteligente baseado na quantidade de posições
    let badgesHTML = '';
    let indicadorExtra = '';
    
    if (posicoesArray.length === 1) {
        // 1 posição: badge único centralizado
        const imageUrl = getPositionImageSync(posicoesArray[0]);
        
        badgesHTML = `<img src="${imageUrl}" alt="${posicoesArray[0]}" class="position-badge position-badge-single">`;
    }
    else if (posicoesArray.length <= 3) {
        // 2-3 posições: badges empilhados
        badgesHTML = posicoesArray.map((posicao, index) => {
            const imageUrl = getPositionImageSync(posicao);
            return `<img src="${imageUrl}" alt="${posicao}" class="position-badge position-badge-stack">`;
        }).join('');
    }
    else {
        // 4+ posições: mostrar as 2 principais + indicador
        const posicoesPrincipais = posicoesArray.slice(0, 2);
        badgesHTML = posicoesPrincipais.map((posicao, index) => {
            
            const imageUrl = getPositionImageSync(posicao);
            console.log(posicao)
            return `<img src="${imageUrl}" alt="${posicao}" class="position-badge position-badge-stack">`;
        }).join('');
        
        indicadorExtra = `<div class="position-count">+${posicoesArray.length - 2}</div>`;
    }
    
    const result = `<div class="position-badge-container">${badgesHTML}${indicadorExtra}</div>`;
    return result;
}

// Versão síncrona que busca do banco de dados
function getPositionImageSync(posicao) {
    // Verificar se posicao é uma string válida
    if (!posicao || typeof posicao !== 'string') {
        return 'https://img.icons8.com/ios-filled/50/question-mark.png';
    }
    
    const posicaoLimpa = posicao.trim().toLowerCase();
    
    // Buscar do cache global se disponível
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

// =================================
// ========= FUNÇÃO PARA IMAGENS DE POSIÇÃO ========= // TODO: FUNCTION IMG
// =================================


async function buscarImgPosition() {
    const response = await fetch(`${API_URL}/positionimg`);
    const data = await response.json();
    return data;

}

async function getPositionImage(posicao) {
    // Verificar se posicao é uma string válida
    if (!posicao || typeof posicao !== 'string') {
        return 'https://img.icons8.com/ios-filled/50/question-mark.png';
    }
    
    const posicaoLimpa = posicao.trim().toLowerCase();
    
    try {
        const imgPosition = await buscarImgPosition();
        
        // Se temos dados do banco, usar eles
        if (imgPosition && imgPosition.length > 0) {
            const dados = imgPosition[0]; // Pegar o primeiro registro
            
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
    
    // Fallback para URLs padrão se não conseguir buscar do banco
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

// =================================
// ========= SISTEMA =========
//------ SCROLL DO HEADER
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

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

// Fechar menu quando clicar fora dele (mesmo comportamento da home)
document.addEventListener('click', function(event) {
    const menu = document.querySelector('#menuOpcoes');
    const perfilBtn = document.querySelector('.perfil-btn');

    if (!menu || !perfilBtn) return;
    
    if (!perfilBtn.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
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


// =================================
// CHAMADAS DAS FUNÇÕES
// Conectar input de busca
document.addEventListener('DOMContentLoaded', verificar_auth);
document.addEventListener('DOMContentLoaded', verificarTimeUsuario);
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
// Função para carregar cache das imagens de posições
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

document.addEventListener('DOMContentLoaded', function() {
    
    
    initializeEventListeners();
    loadTransfersAndDepartures();
    loadPositionImagesCache(); // Carregar cache das imagens
    loadData();
});
// Adicionar barra de progresso
addScrollProgress();