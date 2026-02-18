// ===============================================================================================
// ==================================== [PÁGINA ADMIN - EXEMPLO] ================================
// ===============================================================================================

// Este arquivo é apenas um exemplo de como as funcionalidades serão implementadas
// Não implemente ainda - apenas para referência

// ===============================================================================================
// ==================================== [NAVEGAÇÃO] ==============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(sec => sec.classList.remove('active'));
            
            // Add active class to clicked item and corresponding section
            item.classList.add('active');
            document.getElementById(section).classList.add('active');
        });
    });
}

// ===============================================================================================
// ==================================== [DASHBOARD] ==============================================

async function loadDashboardData() {
    try {
        // Carregar estatísticas do dashboard
        const stats = await fetch('/api/v1/dashboard/stats');
        const data = await stats.json();
        
        // Atualizar elementos do dashboard
        document.getElementById('totalUsuarios').textContent = data.usuarios || 0;
        document.getElementById('totalTimes').textContent = data.times || 0;
        document.getElementById('totalMedalhas').textContent = data.medalhas || 0;
        document.getElementById('totalTrofeus').textContent = data.trofeus || 0;
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

// ===============================================================================================
// ==================================== [USUÁRIOS] ===============================================

async function loadUsuarios() {
    try {
        const response = await fetch('/api/v1/usuarios');
        const usuarios = await response.json();
        
        const tbody = document.getElementById('usuariosTableBody');
        tbody.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${usuario.avatar_url || '../img/legalize.png'}" 
                         alt="Avatar" class="table-avatar">
                </td>
                <td>${usuario.username}</td>
                <td>${usuario.email}</td>
                <td>${usuario.time_nome || 'Sem time'}</td>
                <td>${usuario.posicoes || '-'}</td>
                <td>
                    <span class="status-badge status-${usuario.gerencia}">
                        ${usuario.gerencia}
                    </span>
                </td>
                <td>${new Date(usuario.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editarUsuario(${usuario.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletarUsuario(${usuario.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários', 'error');
    }
}

// ===============================================================================================
// ==================================== [TIMES] ==================================================

async function loadTimes() {
    try {
        const response = await fetch('/api/v1/times');
        const times = await response.json();
        
        const tbody = document.getElementById('timesTableBody');
        tbody.innerHTML = '';
        
        times.forEach(time => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${time.avatar_time_url || '../img/legalize.png'}" 
                         alt="Avatar" class="table-avatar">
                </td>
                <td>${time.nome}</td>
                <td>${time.tag}</td>
                <td>${time.lider_nome || '-'}</td>
                <td>${time.total_membros || 0}</td>
                <td>${new Date(time.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editarTime(${time.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletarTime(${time.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar times:', error);
        showNotification('Erro ao carregar times', 'error');
    }
}

// ===============================================================================================
// ==================================== [MEDALHAS] ===============================================

async function loadMedalhas() {
    try {
        const response = await fetch('/api/v1/medalhas');
        const medalhas = await response.json();
        
        const tbody = document.getElementById('medalhasTableBody');
        tbody.innerHTML = '';
        
        medalhas.forEach(medalha => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${medalha.imagem_url}" 
                         alt="Medalha" class="table-image">
                </td>
                <td>${medalha.nome}</td>
                <td>${medalha.descricao || '-'}</td>
                <td>${medalha.edicao_campeonato || '-'}</td>
                <td>${medalha.position_medalha || '-'}</td>
                <td>${new Date(medalha.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editarMedalha(${medalha.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletarMedalha(${medalha.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar medalhas:', error);
        showNotification('Erro ao carregar medalhas', 'error');
    }
}

// ===============================================================================================
// ==================================== [TROFÉUS] ================================================

async function loadTrofeus() {
    try {
        const response = await fetch('/api/v1/trofeus');
        const trofeus = await response.json();
        
        const tbody = document.getElementById('trofeusTableBody');
        tbody.innerHTML = '';
        
        trofeus.forEach(trofeu => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${trofeu.imagem_url}" 
                         alt="Troféu" class="table-image">
                </td>
                <td>${trofeu.nome}</td>
                <td>${trofeu.time_nome || '-'}</td>
                <td>${trofeu.descricao || '-'}</td>
                <td>${trofeu.categoria || '-'}</td>
                <td>${trofeu.edicao_campeonato || '-'}</td>
                <td>${new Date(trofeu.data_conquista).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editarTrofeu(${trofeu.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletarTrofeu(${trofeu.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar troféus:', error);
        showNotification('Erro ao carregar troféus', 'error');
    }
}

// ===============================================================================================
// ==================================== [NOTÍCIAS] ===============================================

async function loadNoticias(tipo = null) {
    try {
        const url = tipo ? `/api/v1/noticias?tipo=${tipo}` : '/api/v1/noticias';
        const response = await fetch(url);
        const noticias = await response.json();
        
        const tbody = document.getElementById('noticiasTableBody');
        tbody.innerHTML = '';
        
        noticias.forEach(noticia => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${noticia.imagem_url ? 
                        `<img src="${noticia.imagem_url}" alt="Notícia" class="table-image">` : 
                        '<div class="table-image" style="background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;"><i class="fas fa-image"></i></div>'
                    }
                </td>
                <td>${noticia.titulo}</td>
                <td>
                    <span class="status-badge status-${noticia.tipo}">
                        ${noticia.tipo}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${noticia.status}">
                        ${noticia.status}
                    </span>
                </td>
                <td>${new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editarNoticia(${noticia.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletarNoticia(${noticia.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        showNotification('Erro ao carregar notícias', 'error');
    }
}

// ===============================================================================================
// ==================================== [UTILITÁRIOS] ============================================

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Implementar logout
        window.location.href = 'home.html';
    }
}

// ===============================================================================================
// ==================================== [INICIALIZAÇÃO] ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar navegação
    initNavigation();
    
    // Carregar dados iniciais
    loadDashboardData();
    loadUsuarios();
    loadTimes();
    loadMedalhas();
    loadTrofeus();
    loadNoticias();
    
    // Configurar abas de notícias
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tipo = btn.getAttribute('data-tipo');
            loadNoticias(tipo);
        });
    });
    
    // Configurar busca
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Implementar busca em tempo real
            console.log('Busca:', e.target.value);
        });
    });
});

// ===============================================================================================
// ==================================== [FUNÇÕES DE MODAL] ========================================

// Estas funções serão implementadas quando necessário
function abrirModalUsuario() {
    console.log('Abrir modal de usuário');
}

function abrirModalTime() {
    console.log('Abrir modal de time');
}

function abrirModalMedalha() {
    console.log('Abrir modal de medalha');
}

function abrirModalTrofeu() {
    console.log('Abrir modal de troféu');
}

function abrirModalNoticia() {
    console.log('Abrir modal de notícia');
}

// Funções de edição/exclusão
function editarUsuario(id) {
    console.log('Editar usuário:', id);
}

function deletarUsuario(id) {
    console.log('Deletar usuário:', id);
}

function editarTime(id) {
    console.log('Editar time:', id);
}

function deletarTime(id) {
    console.log('Deletar time:', id);
}

function editarMedalha(id) {
    console.log('Editar medalha:', id);
}

function deletarMedalha(id) {
    console.log('Deletar medalha:', id);
}

function editarTrofeu(id) {
    console.log('Editar troféu:', id);
}

function deletarTrofeu(id) {
    console.log('Deletar troféu:', id);
}

function editarNoticia(id) {
    console.log('Editar notícia:', id);
}

function deletarNoticia(id) {
    console.log('Deletar notícia:', id);
}
