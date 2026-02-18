// ===============================================================================================
// ==================================== [PÁGINA ADMIN MIXCAMP] ===================================
// ===============================================================================================
// Sistema de administração completo para o MIXCAMP
// Gerencia usuários, times, medalhas, troféus e notícias
// ===============================================================================================

// ===============================================================================================
// ==================================== [CONFIGURAÇÕES GLOBAIS] ==================================
// ===============================================================================================

// URL base da API
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Estado global da aplicação
const appState = {
    currentSection: 'dashboard',
    usuarios: [],
    totalUsuarios: 0,
    isLoading: false
};

// ===============================================================================================
// ==================================== [INICIALIZAÇÃO] ==========================================
// ===============================================================================================

// ===============================================================================================
// Função principal de inicialização da página
// Configura event listeners e carrega dados iniciais
// ===============================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Painel Administrativo MIXCAMP...');
    
    // Inicializar navegação
    initNavigation();
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Configurar busca
    setupSearch();
    
    // Configurar filtros
    setupFilters();
    
    // Configurar abas de notícias
    setupNewsTabs();
    
    console.log('✅ Painel Administrativo inicializado com sucesso!');
});

// ===============================================================================================
// ==================================== [NAVEGAÇÃO] ==============================================
// ===============================================================================================

// ===============================================================================================
// Inicializa o sistema de navegação entre seções
// Gerencia a troca de seções ativas e carrega dados correspondentes
// ===============================================================================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const section = this.getAttribute('data-section');
            
            // Remover classe active de todos os itens
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(sec => sec.classList.remove('active'));
            
            // Adicionar classe active ao item clicado e seção correspondente
            this.classList.add('active');
            const targetSection = document.getElementById(section);
            if (targetSection) {
                targetSection.classList.add('active');
                appState.currentSection = section;
                
                // Carregar dados específicos da seção
                loadSectionData(section);
            }
        });
    });
}

// ===============================================================================================
// ==================================== [CARREGAMENTO DE DADOS] ==================================
// ===============================================================================================

// ===============================================================================================
// Carrega dados iniciais do dashboard
// Executa ao carregar a página pela primeira vez
// ===============================================================================================
async function loadInitialData() {
    try {
        showLoading();
        
        // Carregar dados do dashboard
        await loadDashboardData();
        
        // Carregar dados da seção atual
        await loadSectionData(appState.currentSection);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        showNotification('Erro ao carregar dados iniciais', 'error');
    } finally {
        hideLoading();
    }
}

// ===============================================================================================
// Carrega dados específicos de cada seção
// @param {string} section - Nome da seção a ser carregada
// ===============================================================================================
async function loadSectionData(section) {
    try {
        switch (section) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'usuarios':
                await loadUsuarios();
                break;
            case 'times':
                await loadTimes();
                break;
            case 'medalhas':
                await loadMedalhas();
                break;
            case 'trofeus':
                await loadTrofeus();
                break;
            case 'noticias':
                await loadNoticias();
                break;
            default:
                console.log(`Seção ${section} não implementada ainda`);
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar dados da seção ${section}:`, error);
        showNotification(`Erro ao carregar dados da seção ${section}`, 'error');
    }
}

// ===============================================================================================
// ==================================== [DASHBOARD] ==============================================
// ===============================================================================================

// ===============================================================================================
// Carrega dados do dashboard principal
// Exibe estatísticas gerais e informações resumidas
// ===============================================================================================
async function loadDashboardData() {
    try {
        console.log('📊 Carregando dados do dashboard...');
        
        // Carregar estatísticas dos usuários
        const statsResponse = await fetch(`${API_BASE_URL}/admin/usuarios/estatisticas`);
        if (!statsResponse.ok) {
            throw new Error(`Erro HTTP: ${statsResponse.status}`);
        }
        
        const stats = await statsResponse.json();
        
        // Atualizar elementos do dashboard
        updateDashboardStats(stats);
        
        console.log('✅ Dashboard carregado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

// ===============================================================================================
// Atualiza as estatísticas exibidas no dashboard
// @param {Object} stats - Objeto contendo as estatísticas
// ===============================================================================================
function updateDashboardStats(stats) {
    // Atualizar total de usuários
    const totalUsuariosElement = document.getElementById('totalUsuarios');
    if (totalUsuariosElement) {
        totalUsuariosElement.textContent = stats.totalUsuarios || 0;
    }
    
    // Atualizar outras estatísticas (quando implementadas)
    const totalTimesElement = document.getElementById('totalTimes');
    if (totalTimesElement) {
        totalTimesElement.textContent = '0'; // Implementar quando tiver endpoint
    }
    
    const totalMedalhasElement = document.getElementById('totalMedalhas');
    if (totalMedalhasElement) {
        totalMedalhasElement.textContent = '0'; // Implementar quando tiver endpoint
    }
    
    const totalTrofeusElement = document.getElementById('totalTrofeus');
    if (totalTrofeusElement) {
        totalTrofeusElement.textContent = '0'; // Implementar quando tiver endpoint
    }
    
    // Atualizar estatísticas por gerência
    updateGerenciaStats(stats.porGerencia);
    
    // Atualizar estatísticas por time
    updateTimeStats(stats.porTime);
}

// ===============================================================================================
// Atualiza as estatísticas por nível de gerência
// @param {Array} gerenciaStats - Array com estatísticas por gerência
// ===============================================================================================
function updateGerenciaStats(gerenciaStats) {
    console.log('📈 Estatísticas por gerência:', gerenciaStats);
    // Implementar exibição das estatísticas por gerência se necessário
}

// ===============================================================================================
// Atualiza as estatísticas por status de time
// @param {Array} timeStats - Array com estatísticas por time
// ===============================================================================================
function updateTimeStats(timeStats) {
    console.log('👥 Estatísticas por time:', timeStats);
    // Implementar exibição das estatísticas por time se necessário
}

// ===============================================================================================
// ==================================== [USUÁRIOS] ===============================================
// ===============================================================================================

// ===============================================================================================
// Carrega e exibe a lista de todos os usuários
// Busca dados completos dos usuários (exceto senha) com informações do time
// ===============================================================================================
async function loadUsuarios() {
    try {
        console.log('👥 Carregando lista de usuários...');
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/admin/usuarios`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ordenar usuários por ID (crescente)
        const usuariosOrdenados = data.usuarios.sort((a, b) => a.id - b.id);
        
        // Atualizar estado global
        appState.usuarios = usuariosOrdenados;
        appState.totalUsuarios = data.total;
        
        // Exibir usuários na tabela
        displayUsuarios(usuariosOrdenados);
        
        // Atualizar contador na interface
        updateUsuariosCounter(data.total);
        
        console.log(`✅ ${data.total} usuários carregados com sucesso`);
        showNotification(`${data.total} usuários carregados`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar lista de usuários', 'error');
    } finally {
        hideLoading();
    }
}

// ===============================================================================================
// Exibe os usuários na tabela da interface
// @param {Array} usuarios - Array de objetos contendo dados dos usuários
// ===============================================================================================
function displayUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) {
        console.error('❌ Elemento usuariosTableBody não encontrado');
        return;
    }
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    // Criar linhas da tabela para cada usuário
    usuarios.forEach(usuario => {
        const row = createUsuarioRow(usuario);
        tbody.appendChild(row);
    });
}

// ===============================================================================================
// Cria uma linha da tabela para um usuário específico
// @param {Object} usuario - Objeto contendo dados do usuário
// @returns {HTMLElement} - Elemento tr da tabela
// ===============================================================================================
function createUsuarioRow(usuario) {
    const row = document.createElement('tr');
    
    // Formatar data de criação
    const dataCriacao = new Date(usuario.data_criacao).toLocaleDateString('pt-BR');
    
    // Determinar cor do badge de gerência
    const gerenciaClass = getGerenciaClass(usuario.gerencia);
    
    // Determinar time ou exibir "Sem time"
    const timeInfo = usuario.time_nome ? `${usuario.time_nome} (${usuario.time_tag})` : 'Sem time';
    
    row.innerHTML = `
        <td>
            <img src="${usuario.avatar_url || '../img/legalize.png'}" 
                 alt="Avatar" class="table-avatar"
                 onerror="this.src='../img/legalize.png'">
        </td>
        <td>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <strong>${usuario.username}</strong>
                <small style="color: rgba(255,255,255,0.6);">ID: ${usuario.id}</small>
            </div>
        </td>
        <td>
            <span>${usuario.email}</span>
        </td>
        <td>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span>${timeInfo}</span>
                ${usuario.time_id ? `<small style="color: rgba(255,255,255,0.6);">ID: ${usuario.time_id}</small>` : ''}
            </div>
        </td>
        <td>
            <span class="status-badge ${gerenciaClass}">
                ${usuario.gerencia.toUpperCase()}
            </span>
        </td>
        <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-medal" style="color: #f56e08;"></i>
                <span style="font-weight: 600; color: #f56e08;">${usuario.total_medalhas || 0}</span>
            </div>
        </td>
        <td>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span>${dataCriacao}</span>
                <small style="color: rgba(255,255,255,0.6);">
                    ${formatRelativeTime(usuario.data_criacao)}
                </small>
            </div>
        </td>
        <td style="padding: 1rem; text-align: center;">
            <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: center;">
                <button onclick="openEditGerenciaModal(${usuario.id})" title="Editar gerência" style="background: #f56e08; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;">
                    <i class="fas fa-user-cog"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// ===============================================================================================
// Atualiza o contador de usuários na interface
// @param {number} total - Total de usuários
// ===============================================================================================
function updateUsuariosCounter(total) {
    const counterElement = document.getElementById('totalUsuarios');
    if (counterElement) {
        counterElement.textContent = total;
    }
}

// ===============================================================================================
// ==================================== [FUNÇÕES AUXILIARES] =====================================
// ===============================================================================================

// ===============================================================================================
// Determina a classe CSS para o badge de gerência
// @param {string} gerencia - Nível de gerência do usuário
// @returns {string} - Classe CSS correspondente
// ===============================================================================================
function getGerenciaClass(gerencia) {
    const classes = {
        'admin': 'status-admin',
        'moderador': 'status-moderador',
        'streammer': 'status-streammer',
        'apoiador': 'status-apoiador',
        'user': 'status-user'
    };
    return classes[gerencia] || 'status-user';
}

// ===============================================================================================
// Trunca texto para exibição em espaços limitados
// @param {string} text - Texto a ser truncado
// @param {number} maxLength - Comprimento máximo
// @returns {string} - Texto truncado
// ===============================================================================================
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ===============================================================================================
// Formata data para exibição relativa (ex: "há 2 dias")
// @param {string} dateString - String da data
// @returns {string} - Data formatada
// ===============================================================================================
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `Há ${diffInDays} dias`;
    if (diffInDays < 30) return `Há ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `Há ${Math.floor(diffInDays / 30)} meses`;
    return `Há ${Math.floor(diffInDays / 365)} anos`;
}

// ===============================================================================================
// ==================================== [SISTEMA DE NOTIFICAÇÕES] ===============================
// ===============================================================================================

// ===============================================================================================
// Exibe uma notificação na tela
// @param {string} message - Mensagem da notificação
// @param {string} type - Tipo da notificação (success, error, info)
// ===============================================================================================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        console.error('❌ Container de notificações não encontrado');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconClass = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle'
    }[type] || 'info-circle';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-${iconClass}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Remover notificação após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ===============================================================================================
// ==================================== [SISTEMA DE LOADING] =====================================
// ===============================================================================================

// ===============================================================================================
// Exibe o spinner de carregamento
// ===============================================================================================
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
        appState.isLoading = true;
    }
}

// ===============================================================================================
// Oculta o spinner de carregamento
// ===============================================================================================
function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
        appState.isLoading = false;
    }
}

// ===============================================================================================
// ==================================== [SISTEMA DE BUSCA] =======================================
// ===============================================================================================

// ===============================================================================================
// Configura o sistema de busca para todas as seções
// ===============================================================================================
function setupSearch() {
    const searchInputs = document.querySelectorAll('input[type="text"]');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const section = e.target.closest('.content-section')?.id;
            
            if (section === 'usuarios') {
                filterUsuarios(searchTerm);
            }
            // Implementar filtros para outras seções quando necessário
        });
    });
}

// ===============================================================================================
// Filtra usuários baseado no termo de busca
// @param {string} searchTerm - Termo de busca
// ===============================================================================================
function filterUsuarios(searchTerm) {
    if (!appState.usuarios || appState.usuarios.length === 0) return;
    
    const filteredUsuarios = appState.usuarios.filter(usuario => 
        usuario.username.toLowerCase().includes(searchTerm) ||
        usuario.email.toLowerCase().includes(searchTerm) ||
        usuario.id.toString().includes(searchTerm) ||
        (usuario.time_nome && usuario.time_nome.toLowerCase().includes(searchTerm))
    );
    
    displayUsuarios(filteredUsuarios);
}

// ===============================================================================================
// ==================================== [SISTEMA DE FILTROS] =====================================
// ===============================================================================================

// ===============================================================================================
// Configura o sistema de filtros para todas as seções
// ===============================================================================================
function setupFilters() {
    // Filtro de gerência para usuários
    const filterUsuarios = document.getElementById('filterUsuarios');
    if (filterUsuarios) {
        filterUsuarios.addEventListener('change', function() {
            const gerencia = this.value;
            filterUsuariosByGerencia(gerencia);
        });
    }
}

// ===============================================================================================
// Filtra usuários por nível de gerência
// @param {string} gerencia - Nível de gerência para filtrar
// ===============================================================================================
function filterUsuariosByGerencia(gerencia) {
    if (!appState.usuarios || appState.usuarios.length === 0) return;
    
    let filteredUsuarios;
    if (gerencia === '') {
        // Mostrar todos os usuários
        filteredUsuarios = appState.usuarios;
    } else {
        // Filtrar por gerência específica
        filteredUsuarios = appState.usuarios.filter(usuario => 
            usuario.gerencia === gerencia
        );
    }
    
    displayUsuarios(filteredUsuarios);
}

// ===============================================================================================
// ==================================== [SISTEMA DE ABAS] ========================================
// ===============================================================================================

// ===============================================================================================
// Configura o sistema de abas para notícias
// ===============================================================================================
function setupNewsTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover active de todas as abas
            tabButtons.forEach(b => b.classList.remove('active'));
            
            // Adicionar active à aba clicada
            this.classList.add('active');
            
            // Carregar notícias do tipo selecionado
            const tipo = this.getAttribute('data-tipo');
            loadNoticias(tipo);
        });
    });
}

// ===============================================================================================
// ==================================== [FUNÇÕES DE AÇÃO] ========================================
// ===============================================================================================

// ===============================================================================================
// Função para editar usuário (placeholder)
// @param {number} id - ID do usuário
// ===============================================================================================
// Função removida - apenas edição de gerência é permitida


// ===============================================================================================
// Função para logout (placeholder)
// ===============================================================================================
function logout() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        window.location.href = 'home.html';
    }
}

// ===============================================================================================
// ==================================== [FUNÇÕES PLACEHOLDER] ====================================
// ===============================================================================================

// Estas funções serão implementadas nas próximas etapas

async function loadTimes() {
    console.log('⏳ Carregando times... (não implementado ainda)');
    showNotification('Seção de times será implementada em breve', 'info');
}

async function loadMedalhas() {
    console.log('⏳ Carregando medalhas... (não implementado ainda)');
    showNotification('Seção de medalhas será implementada em breve', 'info');
}

async function loadTrofeus() {
    console.log('⏳ Carregando troféus... (não implementado ainda)');
    showNotification('Seção de troféus será implementada em breve', 'info');
}

async function loadNoticias(tipo = null) {
    console.log('⏳ Carregando notícias... (não implementado ainda)');
    showNotification('Seção de notícias será implementada em breve', 'info');
}

// ===============================================================================================
// =============================== [MODAL DE EDIÇÃO DE GERÊNCIA] ================================
// ===============================================================================================

/**
 * Abre o modal de edição de gerência para o usuário especificado
 * @param {number} userId - ID do usuário a ser editado
 */
function openEditGerenciaModal(userId) {
    console.log(`🔧 Abrindo modal de edição de gerência para usuário ID: ${userId}`);
    
    // Encontrar o usuário nos dados carregados
    const usuario = appState.usuarios.find(u => u.id === userId);
    if (!usuario) {
        showNotification('Usuário não encontrado', 'error');
        return;
    }
    
    // Preencher dados do modal
    document.getElementById('editUserAvatar').src = usuario.avatar_url || '../img/legalize.png';
    document.getElementById('editUserName').textContent = usuario.username;
    document.getElementById('editUserEmail').textContent = usuario.email;
    document.getElementById('editGerenciaSelect').value = usuario.gerencia;
    
    // Armazenar ID do usuário para uso posterior
    document.getElementById('editGerenciaModal').dataset.userId = userId;
    
    // Mostrar modal
    document.getElementById('editGerenciaModal').style.display = 'flex';
    
    // Adicionar listener para o formulário
    document.getElementById('editGerenciaForm').addEventListener('submit', handleEditGerenciaSubmit);
}

/**
 * Fecha o modal de edição de gerência
 */
function closeEditGerenciaModal() {
    console.log('❌ Fechando modal de edição de gerência');
    
    // Esconder modal
    document.getElementById('editGerenciaModal').style.display = 'none';
    
    // Remover listener do formulário
    document.getElementById('editGerenciaForm').removeEventListener('submit', handleEditGerenciaSubmit);
    
    // Limpar dados
    document.getElementById('editGerenciaModal').dataset.userId = '';
}

/**
 * Manipula o envio do formulário de edição de gerência
 * @param {Event} event - Evento de submit do formulário
 */
async function handleEditGerenciaSubmit(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editGerenciaModal').dataset.userId;
    const novaGerencia = document.getElementById('editGerenciaSelect').value;
    
    if (!userId) {
        showNotification('ID do usuário não encontrado', 'error');
        return;
    }
    
    console.log(`💾 Salvando nova gerência para usuário ${userId}: ${novaGerencia}`);
    
    try {
        // Mostrar loading
        showLoading();
        
        // Fazer requisição para atualizar gerência
        const response = await fetch(`${API_BASE_URL}/admin/usuarios/${userId}/gerencia`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gerencia: novaGerencia
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(`Gerência do usuário atualizada para ${novaGerencia.toUpperCase()}`, 'success');
            
            // Atualizar dados locais
            const usuario = appState.usuarios.find(u => u.id === parseInt(userId));
            if (usuario) {
                usuario.gerencia = novaGerencia;
            }
            
            // Fechar modal primeiro
            closeEditGerenciaModal();
            
            // Recarregar lista de usuários
            await loadUsuarios();
        } else {
            showNotification(result.message || 'Erro ao atualizar gerência', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar gerência:', error);
        showNotification('Erro de conexão ao atualizar gerência', 'error');
    } finally {
        hideLoading();
    }
}

// Adicionar listener para fechar modal clicando fora dele
document.addEventListener('click', function(event) {
    const modal = document.getElementById('editGerenciaModal');
    if (event.target === modal) {
        closeEditGerenciaModal();
    }
});

// ===============================================================================================
// ==================================== [FIM DO ARQUIVO] =========================================
// ===============================================================================================