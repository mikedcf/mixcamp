// URL base da API
const API_URL = 'http://127.0.0.1:3000/api/v1';

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
    if (!container) return;

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

// ================================= // TODO: CSS da pesquisa
// ========= SISTEMA =========

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
    
    if (perfilBtn && menu && !perfilBtn.contains(event.target) && !menu.contains(event.target)) {
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
// ========= BUSCAR CAMPEONATOS =========
async function buscarCampeonatosOrganizador() {
    const auth_dados = await autenticacao();
    if (!auth_dados || !auth_dados.logado) {
        showNotification('error', 'Você precisa estar logado para gerenciar campeonatos.');
        return [];
    }

    const organizadorId = auth_dados.usuario.id;
    
    try {
        // Buscar todos os campeonatos e filtrar no frontend
        // (ou criar endpoint específico no backend)
        const response = await fetch(`${API_URL}/inscricoes/campeonato`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar campeonatos');
        }

        const data = await response.json();
        const todosCampeonatos = data.inscricoes || [];
        
        // Filtrar apenas os campeonatos do organizador logado
        const meusCampeonatos = todosCampeonatos.filter(
            campeonato => campeonato.id_organizador == organizadorId
        );
        
        return meusCampeonatos;
    } catch (error) {
        console.error('Erro ao buscar campeonatos:', error);
        showNotification('error', 'Erro ao carregar campeonatos.');
        return [];
    }
}

// =================================
// ========= RENDERIZAR CAMPEONATOS =========
function formatCurrencyBRL(valor) {
    if (valor === undefined || valor === null || valor === '') return 'A definir';
    const numero = typeof valor === 'number' ? valor : Number(valor);
    if (Number.isNaN(numero)) return String(valor);
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

async function renderizarCampeonatos(filtroStatus = 'todos') {
    const grid = document.getElementById('campeonatosGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!grid) return;

    // Loading
    grid.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando seus campeonatos...</p>
        </div>
    `;
    emptyState.style.display = 'none';

    const campeonatos = await buscarCampeonatosOrganizador();
    
    // Aplicar filtro
    let campeonatosFiltrados = campeonatos;
    if (filtroStatus !== 'todos') {
        campeonatosFiltrados = campeonatos.filter(
            c => c.status.toLowerCase() === filtroStatus.toLowerCase()
        );
    }

    if (campeonatosFiltrados.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    grid.innerHTML = campeonatosFiltrados.map(campeonato => `
        <div class="campeonato-card">
            <div class="card-header">
                <h3 class="card-title">${campeonato.titulo || 'Sem título'}</h3>
                <div>
                    <span class="card-badge badge-status ${(campeonato.status || 'disponivel').toLowerCase()}">
                        ${(() => {
                            const status = (campeonato.status || '').toLowerCase().trim();
                            if (status === 'disponivel') return '✓ Disponível';
                            if (status === 'embreve') return '⏱ Em Breve';
                            if (status === 'andamento') return '▶ Em Andamento';
                            if (status === 'encerrado') return '✗ Encerrado';
                            if (status === 'cancelado') return '⚠ Cancelado';
                            return '✗ Encerrado';
                        })()}
                    </span>
                    <span class="card-badge badge-tipo ${campeonato.tipo?.toLowerCase() || 'comum'}">
                        ${campeonato.tipo === 'oficial' ? 'Oficial' : 'Comum'}
                    </span>
                </div>
            </div>
            
            <div class="card-info">
                <div class="card-info-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span>Inscrição: ${formatCurrencyBRL(campeonato.preco_inscricao)}</span>
                </div>
                <div class="card-info-item">
                    <i class="fas fa-trophy"></i>
                    <span>Premiação: ${formatCurrencyBRL(campeonato.premiacao)}</span>
                </div>
                <div class="card-info-item">
                    <i class="fas fa-users"></i>
                    <span>Times: ${campeonato.qnt_times || 'N/A'}</span>
                </div>
                <div class="card-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Início: ${formatarData(campeonato.previsao_data_inicio)}</span>
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn-action btn-ver" onclick="verDetalhes(${campeonato.id})">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
                <button class="btn-action btn-editar" onclick="editarCampeonato(${campeonato.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-action btn-chaveamento" onclick="window.location.href='chaveamento.html?id=${campeonato.id}'" style="background: rgba(138, 43, 226, 0.2); color: #8A2BE2; border: 1px solid rgba(138, 43, 226, 0.3);">
                    <i class="fas fa-sitemap"></i> Chaveamento
                </button>
                <button class="btn-action btn-excluir" onclick="excluirCampeonato(${campeonato.id}, '${campeonato.titulo}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// =================================
// ========= FILTRAR CAMPEONATOS =========
function filtrarCampeonatos() {
    const filtro = document.getElementById('filtroStatus').value;
    renderizarCampeonatos(filtro);
}

// =================================
// ========= ATUALIZAR OPÇÕES DE CHAVE =========
function atualizarOpcoesChave(selectElement, incluirCS2Major, valorPreservar = null) {
    const valorAtual = valorPreservar || selectElement.value;
    
    // Limpar todas as opções
    selectElement.innerHTML = '';
    
    // Adicionar opções base
    const opcoes = [
        { value: 'Single Elimination (B01 até final BO3)', text: 'Single Elimination (B01 até final BO3)' },
        { value: 'Single Elimination (todos BO3)', text: 'Single Elimination (todos BO3)' },
        { value: 'Double Elimination', text: 'Double Elimination' }
    ];
    
    // Adicionar CS2 Major apenas se for premium
    if (incluirCS2Major) {
        opcoes.splice(2, 0, { value: 'CS2 Major (playoffs BO3)', text: 'CS2 Major (playoffs BO3)' });
    }
    
    // Criar e adicionar opções
    opcoes.forEach(opcao => {
        const option = document.createElement('option');
        option.value = opcao.value;
        option.textContent = opcao.text;
        selectElement.appendChild(option);
    });
    
    // Restaurar valor anterior se ainda existir
    if (valorAtual && Array.from(selectElement.options).some(opt => opt.value === valorAtual)) {
        selectElement.value = valorAtual;
    } else {
        // Se o valor não existe mais (ex: CS2 Major para simples), usar padrão
        selectElement.value = 'Single Elimination (todos BO3)';
    }
}

// =================================
// ========= MODAL CRIAR/EDITAR =========
let campeonatoEditando = null;
let tipoOrganizador = null; // 'premium' ou 'simples'

async function abrirModalCriar() {
    campeonatoEditando = null;
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-trophy"></i> Criar Campeonato';
    document.getElementById('formCampeonato').reset();
    document.getElementById('campeonatoId').value = '';
    
    // Buscar dados do perfil para verificar tipo de organizador
    const perfilData = await buscarDadosPerfil();
    tipoOrganizador = perfilData?.perfilData?.usuario?.organizador || 'simples';
    
    const tipoSelect = document.getElementById('tipo');
    const tipoGroup = document.getElementById('tipoGroup');
    const trofeuMedalhaGroup = document.getElementById('trofeuMedalhaGroup');
    const trofeuInput = document.getElementById('trofeu_id');
    const medalhaInput = document.getElementById('medalha_id');
    const chaveSelect = document.getElementById('chave');
    
    if (tipoOrganizador === 'premium') {
        // Premium: tipo fixo como "oficial" e mostrar campos de troféu/medalha
        tipoSelect.value = 'oficial';
        tipoSelect.disabled = true;
        tipoSelect.style.opacity = '0.6';
        tipoSelect.style.cursor = 'not-allowed';
        trofeuMedalhaGroup.style.display = 'flex';
        trofeuInput.required = true;
        medalhaInput.required = true;
        
        // Premium: mostrar todas as opções de chave incluindo CS2 Major
        atualizarOpcoesChave(chaveSelect, true);
    } else {
        // Simples: tipo fixo como "comum" e esconder campos de troféu/medalha
        tipoSelect.value = 'comum';
        tipoSelect.disabled = true;
        tipoSelect.style.opacity = '0.6';
        tipoSelect.style.cursor = 'not-allowed';
        trofeuMedalhaGroup.style.display = 'none';
        trofeuInput.required = false;
        medalhaInput.required = false;
        trofeuInput.value = '';
        medalhaInput.value = '';
        
        // Simples: remover opção CS2 Major do select
        atualizarOpcoesChave(chaveSelect, false);
    }
    
    // Definir valores padrão
    document.getElementById('status').value = 'disponivel';
    document.getElementById('plataforma').value = 'FACEIT';
    document.getElementById('game').value = 'CS2';
    document.getElementById('nivel').value = '1-10';
    document.getElementById('formato').value = '5v5';
    document.getElementById('qnt_times').value = '16';
    document.getElementById('chave').value = 'Single Elimination (todos BO3)';
    
    const modal = document.getElementById('modalCampeonato');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function editarCampeonato(id) {
    const campeonatos = await buscarCampeonatosOrganizador();
    const campeonato = campeonatos.find(c => c.id == id);
    
    if (!campeonato) {
        showNotification('error', 'Campeonato não encontrado.');
        return;
    }
    
    // Buscar dados do perfil para verificar tipo de organizador
    const perfilData = await buscarDadosPerfil();
    tipoOrganizador = perfilData?.perfilData?.usuario?.organizador || 'simples';
    
    campeonatoEditando = campeonato;
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar Campeonato';
    
    const tipoSelect = document.getElementById('tipo');
    const trofeuMedalhaGroup = document.getElementById('trofeuMedalhaGroup');
    const trofeuInput = document.getElementById('trofeu_id');
    const medalhaInput = document.getElementById('medalha_id');
    const chaveSelect = document.getElementById('chave');
    
    // Preencher formulário
    document.getElementById('campeonatoId').value = campeonato.id;
    document.getElementById('titulo').value = campeonato.titulo || '';
    document.getElementById('tipo').value = campeonato.tipo || 'comum';
    document.getElementById('descricao').value = campeonato.descricao || '';
    document.getElementById('preco_inscricao').value = campeonato.preco_inscricao || '';
    document.getElementById('premiacao').value = campeonato.premiacao || '';
    document.getElementById('imagem_url').value = campeonato.imagem_url || '';
    document.getElementById('link_convite').value = campeonato.link_convite || '';
    document.getElementById('url_hub').value = campeonato.link_hub || ''; // Backend retorna link_hub
    document.getElementById('trofeu_id').value = campeonato.trofeu_id || '';
    document.getElementById('medalha_id').value = campeonato.medalha_id || '';
    document.getElementById('edicao_campeonato').value = campeonato.edicao_campeonato || '';
    document.getElementById('qnt_times').value = campeonato.qnt_times || '16';
    document.getElementById('plataforma').value = campeonato.plataforma || 'FACEIT';
    document.getElementById('game').value = campeonato.game || 'CS2';
    document.getElementById('nivel').value = campeonato.nivel || '1-10';
    document.getElementById('formato').value = campeonato.formato || '5v5';
    document.getElementById('status').value = campeonato.status || 'disponivel';
    document.getElementById('regras').value = campeonato.regras || '';
    
    // Ajustar campos baseado no tipo de organizador
    if (tipoOrganizador === 'premium') {
        // Premium: tipo pode ser editado mas mostrar campos de troféu/medalha
        tipoSelect.disabled = false;
        tipoSelect.style.opacity = '1';
        tipoSelect.style.cursor = 'pointer';
        trofeuMedalhaGroup.style.display = 'flex';
        trofeuInput.required = true;
        medalhaInput.required = true;
        
        // Premium: mostrar todas as opções de chave incluindo CS2 Major
        atualizarOpcoesChave(chaveSelect, true, campeonato.chave);
    } else {
        // Simples: tipo fixo como "comum" e esconder campos de troféu/medalha
        tipoSelect.value = 'comum';
        tipoSelect.disabled = true;
        tipoSelect.style.opacity = '0.6';
        tipoSelect.style.cursor = 'not-allowed';
        trofeuMedalhaGroup.style.display = 'none';
        trofeuInput.required = false;
        medalhaInput.required = false;
        
        // Simples: remover opção CS2 Major do select
        atualizarOpcoesChave(chaveSelect, false, campeonato.chave);
    }
    
    // Formatar data para datetime-local
    if (campeonato.previsao_data_inicio) {
        const data = new Date(campeonato.previsao_data_inicio);
        const dataFormatada = data.toISOString().slice(0, 16);
        document.getElementById('previsao_data_inicio').value = dataFormatada;
    }
    
    const modal = document.getElementById('modalCampeonato');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('modalCampeonato');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    campeonatoEditando = null;
}

// =================================
// ========= SALVAR CAMPEONATO =========
async function salvarCampeonato(event) {
    event.preventDefault();
    
    const auth_dados = await autenticacao();
    if (!auth_dados || !auth_dados.logado) {
        showNotification('error', 'Você precisa estar logado.');
        return;
    }
    
    const form = document.getElementById('formCampeonato');
    const formData = new FormData(form);
    
    const campeonatoId = formData.get('id');
    
    // Verificar tipo de organizador novamente
    const perfilData = await buscarDadosPerfil();
    const tipoOrg = perfilData?.perfilData?.usuario?.organizador || 'simples';
    
    const dados = {
        tipo: document.getElementById('tipo').value,
        titulo: formData.get('titulo'),
        descricao: formData.get('descricao'),
        preco_inscricao: parseFloat(formData.get('preco_inscricao')),
        premiacao: parseFloat(formData.get('premiacao')),
        imagem_url: formData.get('imagem_url') || null,
        link_convite: formData.get('link_convite'),
        link_hub: formData.get('url_hub'), // Corrigido: url_hub do form vira link_hub no backend
        chave: formData.get('chave'),
        edicao_campeonato: formData.get('edicao_campeonato') || null,
        plataforma: formData.get('plataforma'),
        game: formData.get('game'),
        nivel: formData.get('nivel'),
        formato: formData.get('formato'),
        qnt_times: formData.get('qnt_times'),
        regras: formData.get('regras'),
        status: formData.get('status'),
        previsao_data_inicio: formData.get('previsao_data_inicio'),
        id_organizador: auth_dados.usuario.id
    };
    console.log(dados.tipo);
    // Só adicionar troféu e medalha se for premium
    if (tipoOrg === 'premium') {
        dados.trofeu_id = parseInt(formData.get('trofeu_id')) || 1;
        dados.medalha_id = parseInt(formData.get('medalha_id')) || 1;
    } else {
        // Para simples, usar valores padrão (1) já que o backend requer
        dados.trofeu_id = 1;
        dados.medalha_id = 1;
    }
    
    // Validações básicas
    if (!dados.titulo || !dados.descricao || !dados.regras) {
        showNotification('alert', 'Preencha todos os campos obrigatórios.');
        return;
    }
    
    try {
        let response;
        
        if (campeonatoId) {
            // Atualizar
            dados.id = campeonatoId;
            response = await fetch(`${API_URL}/inscricoes/campeonato/atualizar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });
        } else {
            // Criar
            response = await fetch(`${API_URL}/inscricoes/campeonato`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('success', campeonatoId ? 'Campeonato atualizado com sucesso!' : 'Campeonato criado com sucesso!');
            fecharModal();
            renderizarCampeonatos(document.getElementById('filtroStatus').value);
        } else {
            showNotification('error', result.message || 'Erro ao salvar campeonato.');
        }
    } catch (error) {
        console.error('Erro ao salvar campeonato:', error);
        showNotification('error', 'Erro de conexão. Tente novamente.');
    }
}

// =================================
// ========= EXCLUIR CAMPEONATO =========
async function excluirCampeonato(id, titulo) {
    if (!confirm(`Tem certeza que deseja excluir o campeonato "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        // Nota: Precisa criar endpoint DELETE no backend
        // Por enquanto, vamos apenas atualizar o status para "encerrado"
        const response = await fetch(`${API_URL}/inscricoes/campeonato/atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id: id,
                status: 'encerrado'
            })
        });
        
        if (response.ok) {
            showNotification('success', 'Campeonato encerrado com sucesso!');
            renderizarCampeonatos(document.getElementById('filtroStatus').value);
        } else {
            showNotification('error', 'Erro ao excluir campeonato.');
        }
    } catch (error) {
        console.error('Erro ao excluir campeonato:', error);
        showNotification('error', 'Erro de conexão. Tente novamente.');
    }
}

// =================================
// ========= VER DETALHES =========
async function verDetalhes(id) {
    const campeonatos = await buscarCampeonatosOrganizador();
    const campeonato = campeonatos.find(c => c.id == id);
    
    if (!campeonato) {
        showNotification('error', 'Campeonato não encontrado.');
        return;
    }
    
    const modal = document.getElementById('modalDetalhes');
    const content = document.getElementById('detalhesContent');
    const titulo = document.getElementById('detalhesTitulo');
    
    titulo.innerHTML = `<i class="fas fa-info-circle"></i> ${campeonato.titulo}`;
    
    content.innerHTML = `
        <div class="detalhes-section">
            <h3><i class="fas fa-info-circle"></i> Informações Básicas</h3>
            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <label>Tipo</label>
                    <span>${campeonato.tipo === 'oficial' ? 'Oficial' : 'Comum'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Status</label>
                    <span>${campeonato.status === 'disponivel' ? 'Disponível' : 
                          campeonato.status === 'embreve' ? 'Em Breve' : 'Encerrado'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Edição</label>
                    <span>${campeonato.edicao_campeonato || 'N/A'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Quantidade de Times</label>
                    <span>${campeonato.qnt_times || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalhes-section">
            <h3><i class="fas fa-dollar-sign"></i> Valores</h3>
            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <label>Preço de Inscrição</label>
                    <span>${formatCurrencyBRL(campeonato.preco_inscricao)}</span>
                </div>
                <div class="detalhe-item">
                    <label>Premiação</label>
                    <span>${formatCurrencyBRL(campeonato.premiacao)}</span>
                </div>
            </div>
        </div>
        
        <div class="detalhes-section">
            <h3><i class="fas fa-gamepad"></i> Configurações do Jogo</h3>
            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <label>Plataforma</label>
                    <span>${campeonato.plataforma || 'N/A'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Jogo</label>
                    <span>${campeonato.game || 'N/A'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Nível</label>
                    <span>${campeonato.nivel || 'N/A'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Formato</label>
                    <span>${campeonato.formato || 'N/A'}</span>
                </div>
                <div class="detalhe-item">
                    <label>Formato da Chave</label>
                    <span>${campeonato.chave || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalhes-section">
            <h3><i class="fas fa-calendar"></i> Datas</h3>
            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <label>Data de Criação</label>
                    <span>${formatarData(campeonato.data)}</span>
                </div>
                <div class="detalhe-item">
                    <label>Previsão de Início</label>
                    <span>${formatarData(campeonato.previsao_data_inicio)}</span>
                </div>
            </div>
        </div>
        
        <div class="detalhes-section">
            <h3><i class="fas fa-align-left"></i> Descrição</h3>
            <p style="color: #b0b0b0; line-height: 1.6;">${campeonato.descricao || 'Sem descrição'}</p>
        </div>
        
        <div class="detalhes-section">
            <h3><i class="fas fa-book"></i> Regras</h3>
            <p style="color: #b0b0b0; line-height: 1.6; white-space: pre-wrap;">${campeonato.regras || 'Sem regras definidas'}</p>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('modalCampeonato');
    const modalDetalhes = document.getElementById('modalDetalhes');
    
    if (event.target === modal) {
        fecharModal();
    }
    
    if (event.target === modalDetalhes) {
        fecharModalDetalhes();
    }
});

// =================================
// ========= INITIALIZATION =========
document.addEventListener('DOMContentLoaded', async function() {
    await renderizarCampeonatos();
    
    // Form submit
    const form = document.getElementById('formCampeonato');
    if (form) {
        form.addEventListener('submit', salvarCampeonato);
    }
    
    // Scroll header
    window.addEventListener("scroll", function () {
        const header = document.querySelector(".header");
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
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

document.addEventListener('DOMContentLoaded', function() {
    verificar_auth();
    verificarTimeUsuario();
    addScrollProgress();
});