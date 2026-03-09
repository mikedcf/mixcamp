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
// const API_URL = 'http://localhost:3000/api/v1';

const API_URL = 'http://127.0.0.1:3000/api/v1';
// const API_URL = 'https://mixcamp-production.up.railway.app/api/v1';

// Estado global da aplicação
const appState = {
    currentSection: 'dashboard',
    usuarios: [],
    times: [],
    medalhas: [],
    trofeus: [],
    noticias: {
        destaque: [],
        site: [],
        campeonato: []
    },
    campeonatos: [],
    cupons: [],
    totalUsuarios: 0,
    isLoading: false
};

// Instâncias de gráficos (usados na seção Campeonatos)
let chartCampTipos = null;
let chartCampLucro = null;

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
            case 'campeonatos':
                await loadCampeonatos();
                break;
            case 'notificacoes-enviar':
                await loadNotificacoesEnviar();
                break;
            case 'cupom':
                await loadCupons();
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
        showLoading();

        const [statsResponse, timesResponse, medalhasResponse, trofeusResponse] = await Promise.all([
            fetch(`${API_URL}/admin/usuarios/estatisticas`),
            fetch(`${API_URL}/times/list`),
            fetch(`${API_URL}/admin/medalhas`),
            fetch(`${API_URL}/trofeus`)
        ]);

        if (!statsResponse.ok) throw new Error(`Erro HTTP stats: ${statsResponse.status}`);

        const stats = await statsResponse.json();

        let totalTimes = 0;
        let totalMedalhas = 0;
        let totalTrofeus = 0;

        if (timesResponse.ok) {
            const timesData = await timesResponse.json();
            if (Array.isArray(timesData.dados)) {
                totalTimes = timesData.dados.length;
            }
        }

        if (medalhasResponse.ok) {
            const medalData = await medalhasResponse.json();
            if (Array.isArray(medalData.medalhas)) {
                totalMedalhas = medalData.medalhas.length;
            }
        }

        if (trofeusResponse.ok) {
            const trofeuData = await trofeusResponse.json();
            if (Array.isArray(trofeuData.trofeus)) {
                totalTrofeus = trofeuData.trofeus.length;
            }
        }

        // Atualizar elementos do dashboard
        updateDashboardStats({
            ...stats,
            totalTimes,
            totalMedalhas,
            totalTrofeus
        });

        console.log('✅ Dashboard carregado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    } finally {
        hideLoading();
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
    
    // Atualizar outras estatísticas
    const totalTimesElement = document.getElementById('totalTimes');
    if (totalTimesElement) {
        totalTimesElement.textContent = stats.totalTimes != null ? stats.totalTimes : 0;
    }
    
    const totalMedalhasElement = document.getElementById('totalMedalhas');
    if (totalMedalhasElement) {
        totalMedalhasElement.textContent = stats.totalMedalhas != null ? stats.totalMedalhas : 0;
    }
    
    const totalTrofeusElement = document.getElementById('totalTrofeus');
    if (totalTrofeusElement) {
        totalTrofeusElement.textContent = stats.totalTrofeus != null ? stats.totalTrofeus : 0;
    }
    
    // Helpers para quick stats e atividade recente
    const porGerencia = Array.isArray(stats.porGerencia) ? stats.porGerencia : [];
    const porTime = Array.isArray(stats.porTime) ? stats.porTime : [];

    const getGer = (gerencia) => {
        const row = porGerencia.find(g => g.gerencia === gerencia);
        return row ? row.total : 0;
    };

    const getTimeStat = (status) => {
        const row = porTime.find(t => t.status === status);
        return row ? row.total : 0;
    };

    const totalAdmins = getGer('admin');
    const totalModeradores = getGer('moderador');
    const comTime = getTimeStat('com_time');
    const semTime = getTimeStat('sem_time');
    const totalUsuarios = stats.totalUsuarios || 0;

    // Quick stats
    const bindQuick = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    bindQuick('qsAdmins', totalAdmins);
    bindQuick('qsModeradores', totalModeradores);
    bindQuick('qsComTime', comTime);
    bindQuick('qsSemTime', semTime);

    // Atividade recente
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-user-plus"></i>
                <span>Total de usuários cadastrados: <strong>${totalUsuarios}</strong></span>
                <small>Distribuídos entre todos os níveis de gerência</small>
            </div>
            <div class="activity-item">
                <i class="fas fa-user-shield"></i>
                <span>Admins: <strong>${totalAdmins}</strong> • Moderadores: <strong>${totalModeradores}</strong></span>
                <small>Baseado nas permissões atuais dos usuários</small>
            </div>
            <div class="activity-item">
                <i class="fas fa-users"></i>
                <span>Usuários com time: <strong>${comTime}</strong> • Sem time: <strong>${semTime}</strong></span>
                <small>Visão geral de engajamento em times</small>
            </div>
        `;
    }

    // Logs auxiliares
    updateGerenciaStats(stats.porGerencia);
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
        
        const response = await fetch(`${API_URL}/admin/usuarios`);
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
            } else if (section === 'times') {
                filterTimes(searchTerm);
            } else if (section === 'medalhas') {
                filterMedalhas(searchTerm);
            } else if (section === 'trofeus') {
                filterTrofeus(searchTerm);
            } else if (section === 'noticias') {
                filterNoticias(searchTerm);
            } else if (section === 'campeonatos') {
                filterCampeonatos(searchTerm);
            } else if (section === 'cupom') {
                filterCupons(searchTerm);
            }
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

function filterTimes(searchTerm) {
    if (!appState.times || appState.times.length === 0) return;
    const filtered = appState.times.filter(time =>
        (time.nome || '').toLowerCase().includes(searchTerm) ||
        (time.tag || '').toLowerCase().includes(searchTerm) ||
        (time.id && time.id.toString().includes(searchTerm))
    );
    displayTimes(filtered);
}

function filterMedalhas(searchTerm) {
    if (!appState.medalhas || appState.medalhas.length === 0) return;
    const filtered = appState.medalhas.filter(m =>
        (m.nome || '').toLowerCase().includes(searchTerm) ||
        (m.descricao || '').toLowerCase().includes(searchTerm) ||
        (m.edicao_campeonato || '').toLowerCase().includes(searchTerm)
    );
    displayMedalhas(filtered);
}

function filterTrofeus(searchTerm) {
    if (!appState.trofeus || appState.trofeus.length === 0) return;
    const filtered = appState.trofeus.filter(t =>
        (t.nome || '').toLowerCase().includes(searchTerm) ||
        (t.descricao || '').toLowerCase().includes(searchTerm) ||
        (t.categoria || '').toLowerCase().includes(searchTerm)
    );
    displayTrofeus(filtered);
}

function filterCupons(searchTerm) {
    if (!appState.cupons || appState.cupons.length === 0) return;
    var prefixEl = document.getElementById('filterCuponsPrefix');
    var prefix = prefixEl ? prefixEl.value : '';
    var list = appState.cupons;
    if (prefix) {
        list = list.filter(function(c) {
            return (c.codigo || '').indexOf(prefix) === 0;
        });
    }
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        list = list.filter(function(c) {
            return (c.codigo || '').toLowerCase().includes(searchTerm) ||
                (c.tipo || '').toLowerCase().includes(searchTerm) ||
                (c.descricao || '').toLowerCase().includes(searchTerm) ||
                (c.id && c.id.toString().includes(searchTerm));
        });
    }
    displayCupons(list);
}

function filterNoticias(searchTerm) {
    const tbody = document.getElementById('noticiasTableBody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
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
    // Filtro por prefixo de cupons (MOR, MCARG, etc.)
    var filterCuponsPrefix = document.getElementById('filterCuponsPrefix');
    if (filterCuponsPrefix) {
        filterCuponsPrefix.addEventListener('change', function() {
            var searchInput = document.getElementById('searchCupons');
            var term = searchInput ? searchInput.value.trim() : '';
            filterCupons(term);
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

// ----- Modal Nova Medalha (funcional)
function abrirModalMedalha() {
    const modal = document.getElementById('modalNovaMedalha');
    if (modal) { document.getElementById('formNovaMedalha').reset(); modal.classList.add('active'); modal.setAttribute('aria-hidden', 'false'); }
}
function fecharModalNovaMedalha() {
    const modal = document.getElementById('modalNovaMedalha');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
}
async function salvarNovaMedalha(e) {
    e.preventDefault();
    const form = document.getElementById('formNovaMedalha');
    const fd = new FormData(form);
    const editId = document.getElementById('modalNovaMedalha').dataset.editId;
    const dados = {
        nome: fd.get('nome'),
        descricao: fd.get('descricao'),
        imagem_url_campeao: fd.get('imagem_url_campeao') || '',
        imagem_url_segundo: fd.get('imagem_url_segundo') || '',
        iframe_url_campeao: fd.get('iframe_url_campeao') || '',
        iframe_url_segundo: fd.get('iframe_url_segundo') || '',
        edicao_campeonato: fd.get('edicao_campeonato')
    };
    if (!dados.nome || !dados.descricao || !dados.imagem_url_campeao || !dados.imagem_url_segundo || !dados.edicao_campeonato) {
        showNotification('Preencha todos os campos obrigatórios.', 'error'); return;
    }
    showLoading();
    try {
        let url = `${API_URL}/medalhas/criar`;
        let method = 'POST';
        if (editId) {
            url = `${API_URL}/medalhas/atualizar/dados/${editId}`;
            method = 'PUT';
        }
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dados) });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || (editId ? 'Medalha atualizada!' : 'Medalha criada!'), 'success');
            delete document.getElementById('modalNovaMedalha').dataset.editId;
            fecharModalNovaMedalha();
            loadMedalhas();
        } else {
            showNotification(json.message || 'Erro ao salvar medalha', 'error');
        }
    } catch (err) { console.error(err); showNotification('Erro ao criar medalha', 'error'); }
    finally { hideLoading(); }
}

// ----- Modal Novo Troféu (funcional)
function abrirModalTrofeu() {
    const modal = document.getElementById('modalNovoTrofeu');
    if (modal) { document.getElementById('formNovoTrofeu').reset(); modal.classList.add('active'); modal.setAttribute('aria-hidden', 'false'); }
}
function fecharModalNovoTrofeu() {
    const modal = document.getElementById('modalNovoTrofeu');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
}
async function salvarNovoTrofeu(e) {
    e.preventDefault();
    const form = document.getElementById('formNovoTrofeu');
    const fd = new FormData(form);
    const editId = document.getElementById('modalNovoTrofeu').dataset.editId;
    const dados = {
        nome: fd.get('nome'),
        descricao: fd.get('descricao'),
        imagem_url: fd.get('imagem_url'),
        iframe_url: fd.get('iframe_url'),
        edicao_campeonato: fd.get('edicao_campeonato'),
        categoria: fd.get('categoria')
    };
    if (!dados.nome || !dados.descricao || !dados.imagem_url || !dados.iframe_url || !dados.edicao_campeonato || !dados.categoria) {
        showNotification('Preencha todos os campos obrigatórios.', 'error'); return;
    }
    showLoading();
    try {
        let url = `${API_URL}/trofeus/criar`;
        let method = 'POST';
        if (editId) {
            url = `${API_URL}/trofeus/atualizar/${editId}`;
            method = 'PUT';
        }
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dados) });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || (editId ? 'Troféu atualizado!' : 'Troféu criado!'), 'success');
            delete document.getElementById('modalNovoTrofeu').dataset.editId;
            fecharModalNovoTrofeu();
            loadTrofeus();
        } else {
            showNotification(json.message || 'Erro ao salvar troféu', 'error');
        }
    } catch (err) { console.error(err); showNotification('Erro ao criar troféu', 'error'); }
    finally { hideLoading(); }
}

// ----- Modal Nova Notícia (funcional)
function abrirModalNoticia() {
    const modal = document.getElementById('modalNovaNoticia');
    if (modal) {
        document.getElementById('formNovaNoticia').reset();
        document.getElementById('noticiaGroupCategoria').style.display = 'none';
        document.getElementById('noticiaGroupVersao').style.display = 'none';
        document.getElementById('noticiaGroupDestaque').style.display = 'none';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}
function fecharModalNovaNoticia() {
    const modal = document.getElementById('modalNovaNoticia');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
}
function toggleNoticiaCampos() {
    const tipo = document.getElementById('noticiaTipo').value;
    document.getElementById('noticiaGroupCategoria').style.display = tipo === 'site' ? 'block' : 'none';
    document.getElementById('noticiaGroupVersao').style.display = tipo === 'site' ? 'block' : 'none';
    document.getElementById('noticiaGroupDestaque').style.display = tipo === 'campeonato' ? 'block' : 'none';
}
async function salvarNovaNoticia(e) {
    e.preventDefault();
    const tipo = document.getElementById('noticiaTipo').value;
    const titulo = document.getElementById('noticiaTitulo').value.trim();
    const texto = document.getElementById('noticiaTexto').value.trim();
    const autor = document.getElementById('noticiaAutor').value.trim();
    const imagem_url = document.getElementById('noticiaImagem').value.trim() || null;
    if (!titulo || !texto || !autor) { showNotification('Preencha título, texto e autor.', 'error'); return; }
    const editId = document.getElementById('modalNovaNoticia').dataset.editId;
    showLoading();
    try {
        let url, body;
        if (tipo === 'destaque') {
            url = editId ? `${API_URL}/noticias/destaques/atualizar` : `${API_URL}/noticias/destaques/criar`;
            body = JSON.stringify({
                id: editId || undefined,
                tipo: 'destaque',
                titulo,
                subtitulo: document.getElementById('noticiaSubtitulo').value.trim(),
                texto,
                autor,
                imagem_url
            });
        } else if (tipo === 'site') {
            url = editId ? `${API_URL}/noticias/site/atualizar` : `${API_URL}/noticias/site/criar`;
            body = JSON.stringify({
                id: editId || undefined,
                tipo: 'atualizacao',
                categoria: document.getElementById('noticiaCategoria').value.trim() || 'atualizacao',
                titulo,
                subtitulo: document.getElementById('noticiaSubtitulo').value.trim(),
                conteudo: texto,
                autor,
                versao: document.getElementById('noticiaVersao').value.trim() || '1.0',
                imagem_url
            });
        } else {
            url = editId ? `${API_URL}/noticias/campeonato/atualizar` : `${API_URL}/noticias/campeonato/criar`;
            body = JSON.stringify({
                id: editId || undefined,
                tipo: 'campeonato',
                destaque: document.getElementById('noticiaDestaque').value.trim() || 'nao',
                titulo,
                texto,
                autor,
                imagem_url
            });
        }
        const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || (editId ? 'Notícia atualizada!' : 'Notícia criada!'), 'success');
            delete document.getElementById('modalNovaNoticia').dataset.editId;
            fecharModalNovaNoticia();
            loadNoticias(tipo === 'destaque' ? 'destaque' : (tipo === 'campeonato' ? 'campeonato' : 'atualizacao'));
        } else {
            showNotification(json.message || 'Erro ao salvar notícia', 'error');
        }
    } catch (err) { console.error(err); showNotification('Erro ao criar notícia', 'error'); }
    finally { hideLoading(); }
}

// ===== Ações Notícias =====
async function editarNoticia(id, tipoLista) {
    if (!id) {
        showNotification('Notícia inválida para edição.', 'error');
        return;
    }
    // Buscar novamente a lista do tipo correto para garantir dados atualizados
    let tipo = tipoLista || 'destaque';
    let url;
    if (tipo === 'destaque') url = `${API_URL}/noticias/destaques`;
    else if (tipo === 'campeonato') url = `${API_URL}/noticias/campeonato`;
    else url = `${API_URL}/noticias/site`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const noticias = Array.isArray(data.noticias) ? data.noticias : [];
        const n = noticias.find(x => x.id === id || x.ID === id);
        if (!n) {
            showNotification('Notícia não encontrada.', 'error');
            return;
        }

        abrirModalNoticia();
        document.getElementById('modalNovaNoticia').dataset.editId = n.id || n.ID;

        if (tipo === 'destaque') {
            document.getElementById('noticiaTipo').value = 'destaque';
            toggleNoticiaCampos();
            document.getElementById('noticiaTitulo').value = n.titulo || '';
            document.getElementById('noticiaSubtitulo').value = n.subtitulo || '';
            document.getElementById('noticiaTexto').value = n.texto || '';
            document.getElementById('noticiaAutor').value = n.autor || '';
            document.getElementById('noticiaImagem').value = n.imagem_url || '';
        } else if (tipo === 'campeonato') {
            document.getElementById('noticiaTipo').value = 'campeonato';
            toggleNoticiaCampos();
            document.getElementById('noticiaTitulo').value = n.titulo || '';
            document.getElementById('noticiaTexto').value = n.texto || '';
            document.getElementById('noticiaAutor').value = n.autor || '';
            document.getElementById('noticiaImagem').value = n.imagem_url || '';
            document.getElementById('noticiaDestaque').value = n.destaque || '';
        } else {
            document.getElementById('noticiaTipo').value = 'site';
            toggleNoticiaCampos();
            document.getElementById('noticiaTitulo').value = n.titulo || '';
            document.getElementById('noticiaSubtitulo').value = n.subtitulo || '';
            document.getElementById('noticiaTexto').value = n.conteudo || '';
            document.getElementById('noticiaAutor').value = n.autor || '';
            document.getElementById('noticiaImagem').value = n.imagem_url || '';
            document.getElementById('noticiaCategoria').value = n.categoria || '';
            document.getElementById('noticiaVersao').value = n.versao || '';
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao carregar notícia para edição.', 'error');
    }
}

async function excluirNoticia(id, tipoLista) {
    if (!id) {
        showNotification('Notícia inválida para exclusão.', 'error');
        return;
    }
    const confirmou = await showConfirmModal('Tem certeza que deseja excluir esta notícia?', 'Confirmar exclusão');
    if (!confirmou) return;

    let tipo = tipoLista || 'destaque';
    let url;
    if (tipo === 'destaque') url = `${API_URL}/noticias/destaques/deletar`;
    else if (tipo === 'campeonato') url = `${API_URL}/noticias/campeonato/deletar`;
    else url = `${API_URL}/noticias/site/deletar`;

    showLoading();
    try {
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id })
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || 'Notícia excluída com sucesso.', 'success');
            loadNoticias(tipo);
        } else {
            showNotification(json.message || 'Erro ao excluir notícia.', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao excluir notícia.', 'error');
    } finally {
        hideLoading();
    }
}

// Bind dos formulários (executado ao carregar)
(function bindAdmModals() {
    const formMedalha = document.getElementById('formNovaMedalha');
    if (formMedalha) formMedalha.addEventListener('submit', salvarNovaMedalha);
    const formTrofeu = document.getElementById('formNovoTrofeu');
    if (formTrofeu) formTrofeu.addEventListener('submit', salvarNovoTrofeu);
    const formNoticia = document.getElementById('formNovaNoticia');
    if (formNoticia) { formNoticia.addEventListener('submit', salvarNovaNoticia); }
    const formCupom = document.getElementById('formCupom');
    if (formCupom) formCupom.addEventListener('submit', salvarCupom);
    var cupomPrefixo = document.getElementById('cupomPrefixoCodigo');
    if (cupomPrefixo) cupomPrefixo.addEventListener('change', function() {
        toggleCupomTipoCampo(this.value);
    });
    const noticiaTipo = document.getElementById('noticiaTipo');
    if (noticiaTipo) noticiaTipo.addEventListener('change', toggleNoticiaCampos);
})();

// ===============================================================================================
async function loadTimes() {
    try {
        console.log('🏆 Carregando times...');
        showLoading();

        const response = await fetch(`${API_URL}/times/list`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const { dados, dadosMembros } = data;

        const membrosPorTime = {};
        if (Array.isArray(dadosMembros)) {
            dadosMembros.forEach(m => {
                if (!membrosPorTime[m.time_id]) membrosPorTime[m.time_id] = 0;
                membrosPorTime[m.time_id]++;
            });
        }

        const timesView = (dados || []).map(t => ({
            id: t.id,
            nome: t.nome,
            tag: t.tag,
            avatar: t.avatar_time_url,
            lider_id: t.lider_id,
            lider_nome: t.lider_nome,
            data_criacao: t.data_criacao,
            membros: membrosPorTime[t.id] || 0
        }));

        appState.times = timesView;
        displayTimes(timesView);

        console.log(`✅ ${timesView.length} times carregados com sucesso`);
    } catch (error) {
        console.error('❌ Erro ao carregar times:', error);
        showNotification('Erro ao carregar lista de times', 'error');
    } finally {
        hideLoading();
    }
}

function displayTimes(times) {
    const tbody = document.getElementById('timesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!times || times.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhum time encontrado
                </td>
            </tr>
        `;
        return;
    }

    times.forEach(time => {
        const tr = document.createElement('tr');
        const dataCriacao = time.data_criacao ? new Date(time.data_criacao).toLocaleDateString('pt-BR') : '-';

        tr.innerHTML = `
            <td>
                <img src="${time.avatar || '../img/mixcamp.png'}"
                     alt="Avatar Time"
                     class="table-avatar"
                     onerror="this.src='../img/mixcamp.png'">
            </td>
            <td>
                <div style="display:flex;flex-direction:column;gap:0.25rem;">
                    <strong>${time.nome || '-'}</strong>
                    <small style="color:rgba(255,255,255,0.6);">ID: ${time.id}</small>
                </div>
            </td>
            <td>${time.tag || '-'}</td>
            <td>
                <div style="display:flex;flex-direction:column;gap:0.25rem;">
                    <span>${time.lider_nome || '-'}</span>
                    ${time.lider_id ? `<small style="color:rgba(255,255,255,0.6);">ID: ${time.lider_id}</small>` : ''}
                </div>
            </td>
            <td>
                <span>${time.membros || 0} membros</span>
            </td>
            <td>${dataCriacao}</td>
            <td style="text-align:center;">
                <button class="btn btn-small btn-edit" title="Ver detalhes" onclick="/* TODO: abrir modal detalhes do time */">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function loadMedalhas() {
    try {
        console.log('🏅 Carregando medalhas...');
        showLoading();

        const response = await fetch(`${API_URL}/admin/medalhas`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const medalhas = Array.isArray(data.medalhas) ? data.medalhas : [];

        appState.medalhas = medalhas;
        displayMedalhas(medalhas);

        console.log(`✅ ${medalhas.length} medalhas carregadas com sucesso`);
    } catch (error) {
        console.error('❌ Erro ao carregar medalhas:', error);
        showNotification('Erro ao carregar lista de medalhas', 'error');
    } finally {
        hideLoading();
    }
}

function displayMedalhas(medalhas) {
    const tbody = document.getElementById('medalhasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!medalhas || medalhas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-medal" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhuma medalha encontrada
                </td>
            </tr>
        `;
        return;
    }

    medalhas.forEach(m => {
        const tr = document.createElement('tr');
        const dataCriacao = m.data_criacao ? new Date(m.data_criacao).toLocaleDateString('pt-BR') : '-';

        tr.innerHTML = `
            <td>
                <img src="${m.imagem_url_campeao || '../img/mixcamp.png'}"
                     alt="Medalha"
                     class="table-avatar"
                     onerror="this.src='../img/mixcamp.png'">
            </td>
            <td>${m.nome || '-'}</td>
            <td>${truncateText(m.descricao || '', 60)}</td>
            <td>${m.edicao_campeonato || '-'}</td>
            <td>-</td>
            <td>${dataCriacao}</td>
            <td style="text-align:center;">
                <button class="btn btn-small btn-edit" title="Editar" onclick="editarMedalha(${m.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-delete" title="Excluir" onclick="excluirMedalha(${m.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ===== Ações Medalhas =====
async function editarMedalha(id) {
    const medalha = (appState.medalhas || []).find(m => m.id === id);
    if (!medalha) {
        showNotification('Medalha não encontrada.', 'error');
        return;
    }
    abrirModalMedalha();
    document.getElementById('medalhaNome').value = medalha.nome || '';
    document.getElementById('medalhaDescricao').value = medalha.descricao || '';
    document.getElementById('medalhaImgCampeao').value = medalha.imagem_url_campeao || '';
    document.getElementById('medalhaImgSegundo').value = medalha.imagem_url_segundo || '';
    document.getElementById('medalhaIframeCampeao').value = medalha.iframe_url_campeao || '';
    document.getElementById('medalhaIframeSegundo').value = medalha.iframe_url_segundo || '';
    document.getElementById('medalhaEdicao').value = medalha.edicao_campeonato || '';
    document.getElementById('modalNovaMedalha').dataset.editId = id;
}

async function excluirMedalha(id) {
    const confirmou = await showConfirmModal('Tem certeza que deseja excluir esta medalha?', 'Confirmar exclusão');
    if (!confirmou) return;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/medalhas/deletar/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || 'Medalha excluída com sucesso.', 'success');
            loadMedalhas();
        } else {
            showNotification(json.message || 'Erro ao excluir medalha.', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao excluir medalha.', 'error');
    } finally {
        hideLoading();
    }
}

// ===============================================================================================
// ==================================== [CAMPEONATOS / ORGANIZADORES] ===========================
// ===============================================================================================

async function loadTrofeus() {
    try {
        console.log('🏆 Carregando troféus...');
        showLoading();

        const response = await fetch(`${API_URL}/trofeus`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const trofeus = Array.isArray(data.trofeus) ? data.trofeus : [];

        appState.trofeus = trofeus;
        displayTrofeus(trofeus);

        console.log(`✅ ${trofeus.length} troféus carregados com sucesso`);
    } catch (error) {
        console.error('❌ Erro ao carregar troféus:', error);
        showNotification('Erro ao carregar lista de troféus', 'error');
    } finally {
        hideLoading();
    }
}

function displayTrofeus(trofeus) {
    const tbody = document.getElementById('trofeusTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!trofeus || trofeus.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-trophy" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhum troféu encontrado
                </td>
            </tr>
        `;
        return;
    }

    trofeus.forEach(t => {
        const tr = document.createElement('tr');
        const dataCriacao = t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : '-';

        tr.innerHTML = `
            <td>
                <img src="${t.imagem_url || '../img/mixcamp.png'}"
                     alt="Troféu"
                     class="table-avatar"
                     onerror="this.src='../img/mixcamp.png'">
            </td>
            <td>${t.nome || '-'}</td>
            <td>-</td>
            <td>${truncateText(t.descricao || '', 60)}</td>
            <td>${t.categoria || '-'}</td>
            <td>${t.edicao_campeonato || '-'}</td>
            <td>${dataCriacao}</td>
            <td style="text-align:center;">
                <button class="btn btn-small btn-edit" title="Editar" onclick="editarTrofeu(${t.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-delete" title="Excluir" onclick="excluirTrofeu(${t.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ===== Ações Troféus =====
async function editarTrofeu(id) {
    const trofeu = (appState.trofeus || []).find(t => t.id === id);
    if (!trofeu) {
        showNotification('Troféu não encontrado.', 'error');
        return;
    }
    abrirModalTrofeu();
    document.getElementById('trofeuNome').value = trofeu.nome || '';
    document.getElementById('trofeuDescricao').value = trofeu.descricao || '';
    document.getElementById('trofeuImagem').value = trofeu.imagem_url || '';
    document.getElementById('trofeuIframe').value = trofeu.iframe_url || '';
    document.getElementById('trofeuEdicao').value = trofeu.edicao_campeonato || '';
    document.getElementById('trofeuCategoria').value = trofeu.categoria || '';
    document.getElementById('modalNovoTrofeu').dataset.editId = id;
}

async function excluirTrofeu(id) {
    const confirmou = await showConfirmModal('Tem certeza que deseja excluir este troféu?', 'Confirmar exclusão');
    if (!confirmou) return;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/trofeus/deletar/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || 'Troféu excluído com sucesso.', 'success');
            loadTrofeus();
        } else {
            showNotification(json.message || 'Erro ao excluir troféu.', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao excluir troféu.', 'error');
    } finally {
        hideLoading();
    }
}

// ===============================================================================================
// ==================================== [CUPONS] =================================================
// ===============================================================================================

async function loadCupons() {
    try {
        console.log('🎫 Carregando cupons...');
        showLoading();

        const response = await fetch(`${API_URL}/cupom`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const data = await response.json();
        const cupons = Array.isArray(data.cupons) ? data.cupons : [];

        appState.cupons = cupons;
        displayCupons(cupons);

        // Reaplicar filtro de prefixo/busca se estiver ativo
        var searchInput = document.getElementById('searchCupons');
        var term = searchInput ? searchInput.value.trim() : '';
        if (term || (document.getElementById('filterCuponsPrefix') && document.getElementById('filterCuponsPrefix').value)) {
            filterCupons(term);
        }

        console.log(`✅ ${cupons.length} cupons carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar cupons:', error);
        showNotification('Erro ao carregar cupons', 'error');
    } finally {
        hideLoading();
    }
}

function displayCupons(cupons) {
    const tbody = document.getElementById('cuponsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!cupons || cupons.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-ticket-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhum cupom encontrado
                </td>
            </tr>
        `;
        return;
    }

    cupons.forEach(c => {
        const tr = document.createElement('tr');
        const ativo = c.ativo ? 'Sim' : 'Não';
        const restantes = c.usos_restantes != null ? c.usos_restantes : '-';
        const maximos = c.usos_maximos != null ? c.usos_maximos : '-';
        const usosHtml = `<span class="cupom-usos-restantes">${restantes}</span> / <span class="cupom-usos-max">${maximos}</span>`;

        tr.innerHTML = `
            <td>${c.id || '-'}</td>
            <td><strong><a href="#" class="link-cupom-codigo" onclick="event.preventDefault(); abrirModalDetalheCupom(${c.id})">${(c.codigo || '-')}</a></strong></td>
            <td>${c.tipo || '-'}</td>
            <td>${truncateText(c.descricao || '', 40)}</td>
            <td>${c.desconto_percentual != null ? c.desconto_percentual + '%' : '-'}</td>
            <td class="cupom-usos-cell">${usosHtml}</td>
            <td>${ativo}</td>
            <td style="text-align:center;">
                <button class="btn btn-small btn-view" title="Ver detalhes" onclick="abrirModalDetalheCupom(${c.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-small btn-edit" title="Editar" onclick="editarCupom(${c.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-delete" title="Excluir" onclick="excluirCupom(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Opções de tipo por prefixo de cupom
const CUPOM_OPCOES_MOR = ['premium', 'intermediario', 'basico', 'simples'];
const CUPOM_OPCOES_MCARG = ['ADMIN', 'STREAMMER', 'APOIADOR', 'MODERADOR'];

function getPrefixoCupom(codigo) {
    if (!codigo || typeof codigo !== 'string') return '';
    if (codigo.startsWith('MOR-')) return 'MOR-';
    if (codigo.startsWith('MCARG-')) return 'MCARG-';
    if (codigo.startsWith('MITEM-')) return 'MITEM-';
    if (codigo.startsWith('MCONQ-')) return 'MCONQ-';
    return '';
}

function toggleCupomTipoCampo(prefixo) {
    var selectEl = document.getElementById('cupomTipoSelect');
    var inputEl = document.getElementById('cupomTipo');
    if (!selectEl || !inputEl) return;

    selectEl.innerHTML = '';
    selectEl.removeAttribute('required');
    inputEl.removeAttribute('required');
    selectEl.style.display = 'none';
    inputEl.style.display = 'none';

    if (prefixo === 'MOR-') {
        CUPOM_OPCOES_MOR.forEach(function(op) {
            var opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            selectEl.appendChild(opt);
        });
        selectEl.setAttribute('required', 'required');
        selectEl.style.display = '';
    } else if (prefixo === 'MCARG-') {
        CUPOM_OPCOES_MCARG.forEach(function(op) {
            var opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            selectEl.appendChild(opt);
        });
        selectEl.setAttribute('required', 'required');
        selectEl.style.display = '';
    } else {
        inputEl.placeholder = 'Ex: nome do item, conquista';
        inputEl.setAttribute('required', 'required');
        inputEl.style.display = '';
    }
}

function abrirModalCupom() {
    const modal = document.getElementById('modalCupom');
    if (!modal) return;
    document.getElementById('formCupom').reset();
    document.getElementById('cupomUsosMaximos').value = 1;
    document.getElementById('modalCupomTitulo').textContent = 'Novo Cupom';
    document.getElementById('cupomCodigoGerarWrap').style.display = '';
    document.getElementById('cupomCodigoEditWrap').style.display = 'none';
    document.getElementById('cupomCodigoGerado').value = '';
    document.getElementById('cupomCodigo').value = '';
    delete modal.dataset.editId;
    var prefixoSelect = document.getElementById('cupomPrefixoCodigo');
    if (prefixoSelect) toggleCupomTipoCampo(prefixoSelect.value);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharModalCupom() {
    const modal = document.getElementById('modalCupom');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function abrirModalDetalheCupom(id) {
    const cupom = (appState.cupons || []).find(c => c.id === id);
    if (!cupom) {
        showNotification('Cupom não encontrado.', 'error');
        return;
    }
    const modal = document.getElementById('modalDetalheCupom');
    if (!modal) return;

    const codigo = cupom.codigo || '-';
    document.getElementById('detalheCupomCodigo').textContent = codigo;
    document.getElementById('detalheCupomBadge').textContent = cupom.ativo ? 'Ativo' : 'Inativo';
    document.getElementById('detalheCupomBadge').className = 'detalhe-badge ' + (cupom.ativo ? 'ativo' : 'inativo');
    document.getElementById('detalheCupomTipo').textContent = cupom.tipo || '-';
    document.getElementById('detalheCupomId').textContent = cupom.id != null ? cupom.id : '-';
    document.getElementById('detalheCupomCodigoVal').textContent = codigo;
    document.getElementById('detalheCupomTipoVal').textContent = cupom.tipo || '-';
    document.getElementById('detalheCupomDesconto').textContent = cupom.desconto_percentual != null ? cupom.desconto_percentual + '%' : '-';
    document.getElementById('detalheCupomUsos').innerHTML = '';
    var restSpan = document.createElement('span');
    restSpan.className = 'cupom-usos-restantes';
    restSpan.textContent = cupom.usos_restantes != null ? cupom.usos_restantes : '-';
    var maxSpan = document.createElement('span');
    maxSpan.className = 'cupom-usos-max';
    maxSpan.textContent = cupom.usos_maximos != null ? cupom.usos_maximos : '-';
    document.getElementById('detalheCupomUsos').appendChild(restSpan);
    document.getElementById('detalheCupomUsos').appendChild(document.createTextNode(' / '));
    document.getElementById('detalheCupomUsos').appendChild(maxSpan);
    document.getElementById('detalheCupomAtivo').textContent = cupom.ativo ? 'Sim' : 'Não';
    document.getElementById('detalheCupomIdItem').textContent = cupom.id_item != null ? cupom.id_item : '-';
    document.getElementById('detalheCupomIdTrofeu').textContent = cupom.id_trofeu != null ? cupom.id_trofeu : '-';
    document.getElementById('detalheCupomIdMedalha').textContent = cupom.id_medalha != null ? cupom.id_medalha : '-';
    const descEl = document.getElementById('detalheCupomDescricao');
    const descBlock = document.getElementById('detalheCupomDescricaoBlock');
    if (cupom.descricao) {
        descEl.textContent = cupom.descricao;
        descBlock.style.display = '';
    } else {
        descEl.textContent = '-';
        descBlock.style.display = 'none';
    }

    const btnEditar = document.getElementById('btnDetalheCupomEditar');
    const btnExcluir = document.getElementById('btnDetalheCupomExcluir');
    if (btnEditar) {
        btnEditar.onclick = function() {
            fecharModalDetalheCupom();
            editarCupom(id);
        };
    }
    if (btnExcluir) {
        btnExcluir.onclick = async function() {
            fecharModalDetalheCupom();
            await excluirCupom(id);
        };
    }

    modal.dataset.cupomId = id;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharModalDetalheCupom() {
    const modal = document.getElementById('modalDetalheCupom');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function abrirModalResgatesCupom() {
    var modal = document.getElementById('modalResgatesCupom');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    var tbody = document.getElementById('resgatesCupomTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando...</td></tr>';
    fetch(API_URL + '/cupom/resgatados', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var list = data.cupomresgatados || [];
            if (!tbody) return;
            tbody.innerHTML = '';
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Nenhum resgate encontrado.</td></tr>';
                return;
            }
            list.forEach(function(r) {
                var tr = document.createElement('tr');
                var dataStr = r.data_resgate ? new Date(r.data_resgate).toLocaleString('pt-BR') : '-';
                tr.innerHTML = '<td>' + (r.id || '-') + '</td><td>' + (r.usuario_username || '-') + '</td><td>' + (r.usuario_email || '-') + '</td><td><strong>' + (r.cupom_codigo || '-') + '</strong></td><td>' + dataStr + '</td>';
                tbody.appendChild(tr);
            });
        })
        .catch(function(err) {
            console.error(err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Erro ao carregar resgates.</td></tr>';
            showNotification('Erro ao carregar lista de resgates', 'error');
        });
}

function fecharModalResgatesCupom() {
    var modal = document.getElementById('modalResgatesCupom');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function gerarCodigoCupom() {
    const prefixo = document.getElementById('cupomPrefixoCodigo').value || 'MOR-';
    const numeros = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
    const codigo = prefixo + numeros;
    document.getElementById('cupomCodigoGerado').value = codigo;
    document.getElementById('cupomCodigo').value = codigo;
}

async function salvarCupom(e) {
    e.preventDefault();
    const modal = document.getElementById('modalCupom');
    const editId = modal ? modal.dataset.editId : null;
    let codigo = document.getElementById('cupomCodigo').value.trim();
    if (!codigo && !editId) {
        codigo = document.getElementById('cupomCodigoGerado').value.trim();
        if (!codigo) {
            showNotification('Selecione o prefixo e clique em "Gerar código" para gerar o código do cupom.', 'error');
            return;
        }
        document.getElementById('cupomCodigo').value = codigo;
    }
    if (!editId && !codigo) {
        showNotification('Gere o código do cupom antes de salvar.', 'error');
        return;
    }

    var tipoElSelect = document.getElementById('cupomTipoSelect');
    var tipoElInput = document.getElementById('cupomTipo');
    var tipo = (tipoElSelect && tipoElSelect.style.display !== 'none') ? (tipoElSelect.value || '').trim() : (tipoElInput ? (tipoElInput.value || '').trim() : '');
    if (!tipo) {
        showNotification('Preencha o campo Tipo.', 'error');
        return;
    }

    const usosMaximos = parseInt(document.getElementById('cupomUsosMaximos').value, 10) || 1;
    let usosRestantes = document.getElementById('cupomUsosRestantes').value.trim();
    if (usosRestantes === '') usosRestantes = usosMaximos;

    const dados = {
        codigo,
        tipo,
        descricao: document.getElementById('cupomDescricao').value.trim() || null,
        desconto_percentual: document.getElementById('cupomDesconto').value.trim() ? parseFloat(document.getElementById('cupomDesconto').value) : null,
        id_item: document.getElementById('cupomIdItem').value.trim() ? parseInt(document.getElementById('cupomIdItem').value, 10) : null,
        id_trofeu: document.getElementById('cupomIdTrofeu').value.trim() ? parseInt(document.getElementById('cupomIdTrofeu').value, 10) : null,
        id_medalha: document.getElementById('cupomIdMedalha').value.trim() ? parseInt(document.getElementById('cupomIdMedalha').value, 10) : null,
        usos_maximos: usosMaximos,
        usos_restantes: parseInt(usosRestantes, 10),
        ativo: document.getElementById('cupomAtivo').value === 'true'
    };

    showLoading();
    try {
        let url = `${API_URL}/cupom/criar`;
        let method = 'POST';
        if (editId) {
            url = `${API_URL}/cupom/atualizar/${editId}`;
            method = 'PUT';
        }
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || (editId ? 'Cupom atualizado!' : 'Cupom criado!'), 'success');
            delete modal.dataset.editId;
            fecharModalCupom();
            loadCupons();
        } else {
            showNotification(json.message || 'Erro ao salvar cupom', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao salvar cupom', 'error');
    } finally {
        hideLoading();
    }
}

function editarCupom(id) {
    const cupom = (appState.cupons || []).find(c => c.id === id);
    if (!cupom) {
        showNotification('Cupom não encontrado.', 'error');
        return;
    }
    const modal = document.getElementById('modalCupom');
    if (!modal) return;

    document.getElementById('modalCupomTitulo').textContent = 'Editar Cupom';
    document.getElementById('cupomCodigoGerarWrap').style.display = 'none';
    document.getElementById('cupomCodigoEditWrap').style.display = '';
    document.getElementById('cupomCodigoEdit').value = cupom.codigo || '';
    document.getElementById('cupomCodigo').value = cupom.codigo || '';

    var prefixo = getPrefixoCupom(cupom.codigo);
    toggleCupomTipoCampo(prefixo);
    if (prefixo === 'MOR-' || prefixo === 'MCARG-') {
        var sel = document.getElementById('cupomTipoSelect');
        if (sel && cupom.tipo) sel.value = cupom.tipo;
    } else {
        document.getElementById('cupomTipo').value = cupom.tipo || '';
    }

    document.getElementById('cupomDescricao').value = cupom.descricao || '';
    document.getElementById('cupomDesconto').value = cupom.desconto_percentual != null ? cupom.desconto_percentual : '';
    document.getElementById('cupomIdItem').value = cupom.id_item != null ? cupom.id_item : '';
    document.getElementById('cupomIdTrofeu').value = cupom.id_trofeu != null ? cupom.id_trofeu : '';
    document.getElementById('cupomIdMedalha').value = cupom.id_medalha != null ? cupom.id_medalha : '';
    document.getElementById('cupomUsosMaximos').value = cupom.usos_maximos != null ? cupom.usos_maximos : 1;
    document.getElementById('cupomUsosRestantes').value = cupom.usos_restantes != null ? cupom.usos_restantes : '';
    document.getElementById('cupomAtivo').value = cupom.ativo ? 'true' : 'false';

    modal.dataset.editId = id;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

async function excluirCupom(id) {
    const confirmou = await showConfirmModal('Tem certeza que deseja excluir este cupom?', 'Confirmar exclusão');
    if (!confirmou) return;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/cupom/deletar/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            showNotification(json.message || 'Cupom excluído com sucesso.', 'success');
            loadCupons();
        } else {
            showNotification(json.message || 'Erro ao excluir cupom.', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao excluir cupom.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadNoticias(tipo = null) {
    try {
        console.log('📰 Carregando notícias...', tipo || 'todas');
        showLoading();

        let url;
        if (tipo === 'destaque' || !tipo) {
            url = `${API_URL}/noticias/destaques`;
        } else if (tipo === 'campeonato') {
            url = `${API_URL}/noticias/campeonato`;
        } else {
            // 'atualizacao' e 'cs2' usam noticias_site (podemos filtrar depois se quiser)
            url = `${API_URL}/noticias/site`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const noticias = Array.isArray(data.noticias) ? data.noticias : [];

        if (tipo) {
            appState.noticias[tipo] = noticias;
        }

        displayNoticias(noticias, tipo);

        console.log(`✅ ${noticias.length} notícias carregadas (${tipo || 'geral'})`);
    } catch (error) {
        console.error('❌ Erro ao carregar notícias:', error);
        showNotification('Erro ao carregar notícias', 'error');
    } finally {
        hideLoading();
    }
}

function displayNoticias(noticias, tipo) {
    const tbody = document.getElementById('noticiasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!noticias || noticias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-newspaper" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Nenhuma notícia encontrada
                </td>
            </tr>
        `;
        return;
    }

    noticias.forEach(n => {
        const tr = document.createElement('tr');
        const dataPublicacao = n.data ? new Date(n.data).toLocaleDateString('pt-BR') : '-';

        // Definir tipo/label baseado na origem
        let tipoTexto = 'Site';
        let statusTexto = '-';
        if (tipo === 'destaque') {
            tipoTexto = 'Destaque';
            statusTexto = n.destaque || n.tipo || 'destaque';
        } else if (tipo === 'campeonato') {
            tipoTexto = 'Campeonato';
            statusTexto = n.destaque || '-';
        } else {
            tipoTexto = n.categoria || n.tipo || 'Site';
            statusTexto = n.tipo || '-';
        }

        tr.innerHTML = `
            <td>
                <img src="${n.imagem_url || '../img/mixcamp.png'}"
                     alt="Notícia"
                     class="table-avatar"
                     onerror="this.src='../img/mixcamp.png'">
            </td>
            <td>${n.titulo || '-'}</td>
            <td>${tipoTexto}</td>
            <td>${statusTexto}</td>
            <td>${dataPublicacao}</td>
            <td style="text-align:center;">
                <button class="btn btn-small btn-edit" title="Editar" onclick="editarNoticia(${n.id || n.ID || 'null'}, '${tipo || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-delete" title="Excluir" onclick="excluirNoticia(${n.id || n.ID || 'null'}, '${tipo || ''}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ===============================================================================================
// ==================================== [CAMPEONATOS / ORGANIZADORES] ===========================
// ===============================================================================================

async function loadCampeonatos() {
    try {
        console.log('🏆 Carregando campeonatos e organizadores...');
        showLoading();

        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const inscricoes = Array.isArray(data.inscricoes) ? data.inscricoes : [];

        // Calcular resumo para os gráficos (tipos e lucro dos comuns)
        atualizarResumoCampeonatos(inscricoes);

        const porOrganizador = {};
        inscricoes.forEach(ic => {
            const idOrg = ic.id_organizador || 0;
            const nomeOrg = ic.organizador_nome || 'Sem organizador';
            if (!porOrganizador[idOrg]) {
                porOrganizador[idOrg] = {
                    id: idOrg,
                    nome: nomeOrg,
                    avatar: ic.organizador_avatar || null,
                    campeonatos: []
                };
            }
            porOrganizador[idOrg].campeonatos.push(ic);
        });

        appState.campeonatosPorId = {};
        inscricoes.forEach(ic => { appState.campeonatosPorId[ic.id] = ic; });

        const organizadores = Object.values(porOrganizador);
        appState.campeonatos = organizadores;
        displayCampeonatos(organizadores);

        console.log(`✅ ${organizadores.length} organizadores e ${inscricoes.length} campeonatos carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar campeonatos:', error);
        showNotification('Erro ao carregar campeonatos e organizadores', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Calcula e atualiza o resumo de campeonatos por tipo
 * e o lucro do Mixcamp para campeonatos comuns (taxa 8%).
 */
function atualizarResumoCampeonatos(inscricoes) {
    const TAXA_MIXCAMP = 0.08;
    let totalOficial = 0;
    let totalComum = 0;
    let receitaComum = 0;

    (inscricoes || []).forEach(c => {
        const tipo = (c.tipo || 'comum').toLowerCase();
        const qnt = parseInt(c.qnt_times, 10) || 0;
        const preco = Number(c.preco_inscricao) || 0;
        const receita = qnt * preco;

        if (tipo === 'oficial') {
            totalOficial++;
        } else {
            totalComum++;
            receitaComum += receita;
        }
    });

    const lucroComum = receitaComum * TAXA_MIXCAMP;

    // Atualizar resumo textual
    const fmtMoney = (v) => {
        return 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',');
    };
    const bindText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    bindText('campResumoQtdComum', String(totalComum));
    bindText('campResumoReceitaComum', fmtMoney(receitaComum));
    bindText('campResumoLucroComum', fmtMoney(lucroComum));

    // Atualizar gráficos (pizza e coluna)
    atualizarGraficosCampeonatos({
        totalOficial,
        totalComum,
        receitaComum,
        lucroComum
    });
}

/**
 * Cria/atualiza os gráficos de pizza (distribuição por tipo)
 * e coluna (receita x lucro de campeonatos comuns).
 */
function atualizarGraficosCampeonatos(resumo) {
    const { totalOficial, totalComum, receitaComum, lucroComum } = resumo;

    // Gráfico de pizza - quantidade por tipo
    const ctxTipos = document.getElementById('chartCampTipos');
    if (ctxTipos && typeof Chart !== 'undefined') {
        if (chartCampTipos) chartCampTipos.destroy();
        chartCampTipos = new Chart(ctxTipos, {
            type: 'pie',
            data: {
                labels: ['Comum', 'Oficial'],
                datasets: [{
                    data: [totalComum, totalOficial],
                    backgroundColor: ['#f56e08', '#7c3aed'],
                    borderColor: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)'],
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de coluna - receita x lucro (somente comuns)
    const ctxLucro = document.getElementById('chartCampLucro');
    if (ctxLucro && typeof Chart !== 'undefined') {
        if (chartCampLucro) chartCampLucro.destroy();
        chartCampLucro = new Chart(ctxLucro, {
            type: 'bar',
            data: {
                labels: ['Receita total (comuns)', 'Lucro Mixcamp (8%)'],
                datasets: [{
                    label: 'R$',
                    data: [receitaComum, lucroComum],
                    backgroundColor: ['rgba(245, 110, 8, 0.7)', 'rgba(34, 197, 94, 0.7)'],
                    borderColor: ['#f56e08', '#22c55e'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
}

function displayCampeonatos(organizadores) {
    const container = document.getElementById('campeonatosOrganizadoresList');
    if (!container) return;

    if (!organizadores || organizadores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>Nenhum organizador ou campeonato encontrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = organizadores.map(org => {
        const campeonatosList = (org.campeonatos || []).map(c => {
            const tipoClass = (c.tipo || 'comum').toLowerCase().replace(/\s/g, '');
            return `<li class="campeonato-item tipo-${tipoClass}" data-campeonato-id="${c.id}" role="button" tabindex="0" title="Clique para ver detalhes">
                <span class="campeonato-titulo">${(c.titulo || 'Sem título')}</span>
                <span class="campeonato-meta">Status: ${(c.status || '-')} | Edição: ${(c.edicao_campeonato || '-')} | Vagas: ${c.qnt_times != null ? c.qnt_times : '-'}</span>
            </li>`;
        }).join('');

        return `
            <div class="organizador-card" data-organizador-id="${org.id}">
                <div class="organizador-header">
                    <img src="${org.avatar || '../img/legalize.png'}" alt="Avatar" class="organizador-avatar" onerror="this.src='../img/legalize.png'">
                    <div class="organizador-info">
                        <h4>${org.nome || 'Sem nome'}</h4>
                        <small>ID: ${org.id} • ${(org.campeonatos || []).length} campeonato(s)</small>
                    </div>
                </div>
                <ul class="campeonatos-list">${campeonatosList}</ul>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.campeonato-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-campeonato-id'), 10);
            if (!isNaN(id)) abrirModalDetalheCampeonato(id);
        });
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

function filterCampeonatos(searchTerm) {
    if (!appState.campeonatos || appState.campeonatos.length === 0) return;
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) {
        displayCampeonatos(appState.campeonatos);
        return;
    }
    const filtered = appState.campeonatos.filter(org => {
        const nomeMatch = (org.nome || '').toLowerCase().includes(term);
        const campeonatosMatch = (org.campeonatos || []).some(c =>
            (c.titulo || '').toLowerCase().includes(term) ||
            (c.edicao_campeonato || '').toLowerCase().includes(term) ||
            (c.status || '').toLowerCase().includes(term)
        );
        return nomeMatch || campeonatosMatch;
    });
    displayCampeonatos(filtered);
}

// ===============================================================================================
// Modal de detalhes do campeonato
// ===============================================================================================
function abrirModalDetalheCampeonato(id) {
    const c = appState.campeonatosPorId && appState.campeonatosPorId[id];
    if (!c) {
        showNotification('Campeonato não encontrado', 'error');
        return;
    }
    const modal = document.getElementById('modalDetalheCampeonato');
    if (!modal) return;

    const fmt = (v) => (v != null && v !== '') ? v : '-';
    const fmtData = (v) => {
        if (!v) return '-';
        try { return new Date(v).toLocaleString('pt-BR'); } catch (e) { return v; }
    };
    const fmtMoney = (v) => {
        if (v == null || v === '') return '-';
        return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    };

    const organizadorNome = c.organizador_nome || 'Sem organizador';
    const organizadorAvatar = c.organizador_avatar || '../img/legalize.png';

    document.getElementById('detalheCampeonatoImagem').src = c.imagem_url || '../img/mixcamp.png';
    document.getElementById('detalheCampeonatoImagem').onerror = function() { this.src = '../img/mixcamp.png'; };
    document.getElementById('detalheCampeonatoTitulo').textContent = c.titulo || 'Sem título';
    document.getElementById('detalheCampeonatoStatus').textContent = fmt(c.status);
    document.getElementById('detalheCampeonatoStatus').className = 'detalhe-badge status-' + (String(c.status || '').replace(/\s/g, '').toLowerCase() || 'disponivel');
    document.getElementById('detalheCampeonatoEdicao').textContent = fmt(c.edicao_campeonato);
    document.getElementById('detalheCampeonatoTipo').textContent = fmt(c.tipo);
    const tipoEl = document.getElementById('detalheCampeonatoTipo');
    if (tipoEl) {
        const tipoNorm = (c.tipo || 'comum').toLowerCase().replace(/\s/g, '');
        tipoEl.className = 'detalhe-tipo detalhe-tipo-' + tipoNorm;
    }
    document.getElementById('detalheCampeonatoMixcamp').textContent = fmt(c.mixcamp);
    document.getElementById('detalheCampeonatoPlataforma').textContent = fmt(c.plataforma);
    document.getElementById('detalheCampeonatoGame').textContent = fmt(c.game);
    document.getElementById('detalheCampeonatoNivel').textContent = fmt(c.nivel);
    document.getElementById('detalheCampeonatoFormato').textContent = fmt(c.formato);
    document.getElementById('detalheCampeonatoVagas').textContent = fmt(c.qnt_times);
    document.getElementById('detalheCampeonatoPreco').textContent = fmtMoney(c.preco_inscricao);
    document.getElementById('detalheCampeonatoPremiacao').textContent = fmtMoney(c.premiacao);
    document.getElementById('detalheCampeonatoDataInicio').textContent = fmtData(c.previsao_data_inicio);
    document.getElementById('detalheCampeonatoChave').textContent = fmt(c.chave);
    document.getElementById('detalheCampeonatoDescricao').textContent = fmt(c.descricao);
    document.getElementById('detalheCampeonatoRegras').textContent = fmt(c.regras);

    // Lucro Mixcamp: taxa de 8% sobre o valor total das inscrições (qnt_times * preco_inscricao)
    const TAXA_MIXCAMP = 0.08;
    const qntTimes = parseInt(c.qnt_times, 10) || 0;
    const precoInscricao = Number(c.preco_inscricao) || 0;
    const receitaTotalInscricoes = qntTimes * precoInscricao;
    const lucroMixcamp = receitaTotalInscricoes * TAXA_MIXCAMP;
    document.getElementById('detalheCampeonatoReceitaTotal').textContent = fmtMoney(receitaTotalInscricoes);
    document.getElementById('detalheCampeonatoLucroMixcamp').textContent = fmtMoney(lucroMixcamp);

    document.getElementById('detalheCampeonatoOrganizadorNome').textContent = organizadorNome;
    document.getElementById('detalheCampeonatoOrganizadorAvatar').src = organizadorAvatar;
    document.getElementById('detalheCampeonatoOrganizadorAvatar').onerror = function() { this.src = '../img/legalize.png'; };
    document.getElementById('detalheCampeonatoLinkHub').href = c.link_hub || '#';
    document.getElementById('detalheCampeonatoLinkHub').textContent = c.link_hub ? 'Abrir Hub' : '-';
    document.getElementById('detalheCampeonatoLinkConvite').href = c.link_convite || '#';
    document.getElementById('detalheCampeonatoLinkConvite').textContent = c.link_convite ? 'Link Convite' : '-';
    const linkWhats = document.getElementById('detalheCampeonatoLinkWhatsapp');
    if (c.link_whatsapp) {
        linkWhats.href = c.link_whatsapp.startsWith('http') ? c.link_whatsapp : 'https://wa.me/' + c.link_whatsapp.replace(/\D/g, '');
        linkWhats.textContent = 'WhatsApp';
        linkWhats.style.display = '';
    } else {
        linkWhats.href = '#';
        linkWhats.style.display = 'none';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharModalDetalheCampeonato() {
    const modal = document.getElementById('modalDetalheCampeonato');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// ===============================================================================================
// ==================================== [CRIAR CAMPEONATO ADM - OFICIAL] ========================
// ===============================================================================================

async function getAdminUser() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, { credentials: 'include' });
        if (!response.ok) return null;
        const data = await response.json();
        return data && data.logado ? data : null;
    } catch (e) {
        console.error('Erro ao obter usuário:', e);
        return null;
    }
}

function abrirModalCriarCampeonatoAdm() {
    getAdminUser().then(auth => {
        if (!auth || !auth.logado || !auth.usuario) {
            showNotification('Faça login para criar campeonato', 'error');
            return;
        }
        if (auth.usuario.gerencia !== 'admin') {
            showNotification('Apenas administradores podem criar campeonatos oficiais.', 'error');
            return;
        }
        const modal = document.getElementById('modalCriarCampeonatoAdm');
        if (!modal) return;
        document.getElementById('formCriarCampeonatoAdm').reset();
        const dataInicio = document.getElementById('admCampDataInicio');
        if (dataInicio) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            dataInicio.value = d.toISOString().slice(0, 16);
        }
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    });
}

function fecharModalCriarCampeonatoAdm() {
    const modal = document.getElementById('modalCriarCampeonatoAdm');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

async function salvarCampeonatoAdm(e) {
    e.preventDefault();
    const auth = await getAdminUser();
    if (!auth || !auth.logado || !auth.usuario) {
        showNotification('Sessão inválida. Faça login novamente.', 'error');
        return;
    }
    if (auth.usuario.gerencia !== 'admin') {
        showNotification('Apenas administradores podem criar campeonatos oficiais.', 'error');
        return;
    }
    const form = document.getElementById('formCriarCampeonatoAdm');
    const fd = new FormData(form);
    const previsao = fd.get('previsao_data_inicio');
    const dados = {
        tipo: 'oficial',
        mixcamp: 'mixcamp',
        titulo: fd.get('titulo'),
        descricao: fd.get('descricao'),
        preco_inscricao: parseFloat(fd.get('preco_inscricao')) || 0,
        premiacao: parseFloat(fd.get('premiacao')) || 0,
        imagem_url: fd.get('imagem_url') || null,
        trofeu_id: null,
        medalha_id: null,
        chave: fd.get('chave') || 'Single Elimination (todos BO3)',
        edicao_campeonato: fd.get('edicao_campeonato') || null,
        plataforma: 'FACEIT',
        game: 'CS2',
        nivel: '1-10',
        formato: '5v5',
        qnt_times: fd.get('qnt_times') || '16',
        regras: fd.get('regras'),
        id_organizador: auth.usuario.id,
        status: fd.get('status') || 'disponivel',
        previsao_data_inicio: previsao ? new Date(previsao).toISOString().slice(0, 19).replace('T', ' ') : null,
        link_hub: fd.get('link_hub'),
        link_convite: fd.get('link_convite'),
        link_whatsapp: fd.get('link_whatsapp') || null
    };
    if (!dados.titulo || !dados.descricao || !dados.regras || !dados.link_hub || !dados.link_convite) {
        showNotification('Preencha todos os campos obrigatórios.', 'error');
        return;
    }
    showLoading();
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok) {
            showNotification(result.message || 'Campeonato criado com sucesso!', 'success');
            fecharModalCriarCampeonatoAdm();
            loadCampeonatos();
        } else {
            showNotification(result.message || 'Erro ao criar campeonato', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao criar campeonato', 'error');
    } finally {
        hideLoading();
    }
}

// Configurar submit do form ao carregar a página
(function initFormCriarCampeonatoAdm() {
    const form = document.getElementById('formCriarCampeonatoAdm');
    if (form) form.addEventListener('submit', salvarCampeonatoAdm);
})();

// ===============================================================================================
// ==================================== [ENVIAR NOTIFICAÇÃO] =====================================
// ===============================================================================================

async function loadNotificacoesEnviar() {
    const selectUsuario = document.getElementById('notifUsuarioId');
    const groupUsuarioId = document.getElementById('groupUsuarioId');
    const selectDestinatario = document.getElementById('notifDestinatario');

    if (selectDestinatario) {
        selectDestinatario.addEventListener('change', function() {
            if (groupUsuarioId) {
                groupUsuarioId.style.display = this.value === 'usuario' ? 'block' : 'none';
            }
        });
    }

    try {
        const response = await fetch(`${API_URL}/admin/usuarios`);
        if (!response.ok) return;
        const data = await response.json();
        const usuarios = Array.isArray(data.usuarios) ? data.usuarios : [];

        if (selectUsuario) {
            selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>' +
                usuarios.map(u => `<option value="${u.id}">${u.username} (ID: ${u.id})</option>`).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar usuários para notificação:', e);
        if (selectUsuario) selectUsuario.innerHTML = '<option value="">Erro ao carregar usuários</option>';
    }

    const form = document.getElementById('formEnviarNotificacao');
    if (form) {
        form.onsubmit = null;
        form.addEventListener('submit', enviarNotificacaoSubmit);
    }
}

async function enviarNotificacaoSubmit(e) {
    e.preventDefault();
    const destinatario = document.getElementById('notifDestinatario')?.value;
    const usuarioId = document.getElementById('notifUsuarioId')?.value;
    const texto = document.getElementById('notifTexto')?.value?.trim();
    if (!texto) {
        showNotification('Digite a mensagem da notificação', 'error');
        return;
    }
    showLoading();
    try {
        if (destinatario === 'todos') {
            const response = await fetch(`${API_URL}/notificacoes/enviar-todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ texto })
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                showNotification(data.message || 'Notificação enviada para todos com sucesso', 'success');
                document.getElementById('notifTexto').value = '';
            } else {
                showNotification(data.message || 'Erro ao enviar notificação', 'error');
            }
        } else {
            if (!usuarioId) {
                showNotification('Selecione um usuário', 'error');
                hideLoading();
                return;
            }
            const response = await fetch(`${API_URL}/notificacoes/criar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usuario_id: parseInt(usuarioId, 10), texto })
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                showNotification(data.message || 'Notificação enviada com sucesso', 'success');
                document.getElementById('notifTexto').value = '';
            } else {
                showNotification(data.message || 'Erro ao enviar notificação', 'error');
            }
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao enviar notificação', 'error');
    } finally {
        hideLoading();
    }
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
        const response = await fetch(`${API_URL}/admin/usuarios/${userId}/gerencia`, {
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