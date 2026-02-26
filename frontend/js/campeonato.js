

let avatar = '';

// Lista de IDs dos times inscritos no campeonato
const times_inscritos = [];
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


// Função para formatar data
function formatarData(dataISO, { comHora = true } = {}) {
    if (!dataISO) return 'A definir';

    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return 'A definir';

        const opcoes = comHora
            ? {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              }
            : {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
              };

        return data.toLocaleString('pt-BR', opcoes);
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'A definir';
    }
}


// =================================
// ========= DADOS CARD CAMPEONATOS =========

async function getCardDados() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados de campeonatos:', error);
        return [];
    }
}
// =================================
// ========= BANNER CAROUSEL =======
// =================================

// Índice do slide atualmente visível no banner
let bannerIndex = 0;

// ID do intervalo usado no autoplay (setInterval)
let bannerInterval;

// Lista padrão de slides do banner (fallback)
// Cada item é um objeto representando um slide do carrossel
const defaultBannerSlides = [
    {
        image: '../img/banner.png',
        title: 'MIXCAMP Championship',
        subtitle: 'Os melhores times competindo pelo título',
        link: '#campeonatos'
    },
    {
        image: '../img/banner2.png',
        title: 'Competições Semanais',
        subtitle: 'Participe de torneios regulares',
        link: '#campeonatos'
    },
    {
        image: '../img/banner3.png',
        title: 'Grandes Prêmios',
        subtitle: 'Premiações incríveis esperando por você',
        link: '#campeonatos'
    },
    {
        image: '../img/banner5.png',
        title: 'Comunidade Ativa',
        subtitle: 'Junte-se aos melhores jogadores',
        link: '#campeonatos'
    }
];

// Lista de slides efetivamente usada pelo carrossel.
// Será preenchida a partir de uma "lista de arrays" (array de objetos)
// vinda de fora, ou com o default acima se nada for passado.
let bannerSlides = [...defaultBannerSlides];

/**
 * Define a lista de slides do banner a partir de um array externo.
 *
 * @param {Array} slidesArray - Array de objetos no formato:
 *   { image: string, title: string, subtitle: string, link?: string }
 *
 * Exemplo:
 *   setBannerSlides([
 *     { image: 'img1.png', title: 'Título 1', subtitle: 'Sub 1', link: '#secao1' },
 *     { image: 'img2.png', title: 'Título 2', subtitle: 'Sub 2', link: '#secao2' }
 *   ]);
 */
function setBannerSlides(slidesArray) {
    // Garante que veio um array válido com ao menos 1 elemento
    if (Array.isArray(slidesArray) && slidesArray.length > 0) {
        bannerSlides = slidesArray;
    } else {
        // Se não for válido, volta para o padrão
        bannerSlides = [...defaultBannerSlides];
    }

    // Sempre reinicia do primeiro slide ao trocar a lista
    bannerIndex = 0;

    // Recria toda a estrutura do banner com a nova lista
    criarBannerSlides();
}

/**
 * Reinicia a barra de progresso do banner (linha que "enche" em 5s).
 */
function resetBannerProgress() {
    const progress = document.getElementById('bannerProgress');
    if (!progress) return;

    progress.style.transition = 'none';
    progress.style.width = '0%';

    // Força reflow para reiniciar a animação
    void progress.offsetWidth;

    // Anima novamente de 0 a 100% em 5 segundos
    progress.style.transition = 'width 5s linear';
    progress.style.width = '100%';
}

/**
 * Cria/atualiza os elementos HTML do slider de banner
 * com base na lista atual de slides em `bannerSlides`.
 *
 * - Monta os slides dentro de #bannerTrack
 * - Cria os "dots" de navegação em #bannerDots
 * - Adiciona os eventos de clique (dots, botões prev/next, CTA)
 * - Inicia o autoplay
 */
function criarBannerSlides() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    
    if (!track || !dots) return;

    // Criar slides do banner dinamicamente a partir de `bannerSlides`
    track.innerHTML = bannerSlides.map((slide, index) => `
        <div class="banner-slide ${index === bannerIndex ? 'active' : ''}">
            <img src="${slide.image}" alt="${slide.title}">
            <div class="banner-overlay">
                <div class="banner-overlay-inner">
                    <h2 class="banner-title">${slide.title}</h2>
                    <p class="banner-subtitle">${slide.subtitle}</p>
                    <div class="banner-cta-wrapper">
                        <button class="banner-cta" data-link="${slide.link || '#campeonatos'}">
                            Ver Campeonato
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Ações de clique no botão de CTA (call to action)
    track.querySelectorAll('.banner-cta').forEach((btn) => {
        btn.addEventListener('click', () => {
            const link = btn.getAttribute('data-link') || '#campeonatos';
            if (link.startsWith('#')) {
                const alvo = document.querySelector(link);
                if (alvo) {
                    alvo.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.location.href = link;
            }
        });
    });

    // Criar dots (bolinhas) de navegação, um para cada slide
    dots.innerHTML = bannerSlides.map((_, index) => `
        <div class="banner-dot ${index === bannerIndex ? 'active' : ''}" data-index="${index}"></div>
    `).join('');

    // Event listeners para clique nos dots (navegação direta)
    dots.querySelectorAll('.banner-dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            bannerIndex = index;
            atualizarBanner();
        });
    });

    // Navegação apenas por touch (swipe) no mobile e dots; setas removidas
    // Navegação por touch (swipe) no banner
    const viewport = document.querySelector('.banner-viewport');
    if (viewport) {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipe = 50;

        viewport.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches ? e.changedTouches[0].screenX : e.screenX;
        }, { passive: true });

        viewport.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches ? e.changedTouches[0].screenX : e.screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) < minSwipe) return;
            if (diff > 0) {
                bannerIndex = (bannerIndex + 1) % bannerSlides.length;
            } else {
                bannerIndex = (bannerIndex - 1 + bannerSlides.length) % bannerSlides.length;
            }
            atualizarBanner();
        }, { passive: true });
    }

    // Inicia o autoplay sempre que os slides são recriados
    iniciarAutoPlayBanner();
}

/**
 * Atualiza visualmente o banner para o slide atual (`bannerIndex`):
 * - troca a classe .active nos slides (para animações CSS)
 * - move a "trilha" com translateX
 * - atualiza os dots
 * - reinicia a barra de progresso
 */
function atualizarBanner() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    
    if (!track || !dots) return;

    // Atualizar slides ativos (para animação de zoom/fade via CSS)
    const slides = track.querySelectorAll('.banner-slide');
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === bannerIndex);
    });

    // Mantém tradução para fallback responsivo (desloca a trilha)
    track.style.transform = `translateX(-${bannerIndex * 100}%)`;

    // Atualiza o estado visual dos dots (qual está selecionado)
    dots.querySelectorAll('.banner-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === bannerIndex);
    });

    // Reinicia a barra de progresso
    resetBannerProgress();
}


function iniciarAutoPlayBanner() {
    clearInterval(bannerInterval);
    resetBannerProgress();

    bannerInterval = setInterval(() => {
        bannerIndex = (bannerIndex + 1) % bannerSlides.length;
        atualizarBanner();
    }, 5000);
}

// =================================
// ========= CAMPEONATOS CARDS =========
// =================================

// Dados de exemplo - substituir pela API
const campeonatosExemplo = [
    {
        id: 1,
        imagem: '../img/cs2.png',
        titulo: 'MIXCAMP 1º Edição',
        descricao: 'O maior campeonato de CS2 da comunidade brasileira com prêmios incríveis e muita competição.',
        organizador: 'oficial',
        data: '15/03/2025',
        status: 'disponivel',
        preco: 'R$ 50,00',
        premiacao: 'R$ 10.000,00',
        previsaoInicio: '20/03/2025',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        qntTimes: '16'
    },
    {
        id: 2,
        imagem: '../img/cs2.png',
        titulo: 'Torneio Semanal #45',
        descricao: 'Competição semanal com premiação garantida para os melhores times.',
        organizador: 'oficial',
        status: 'embreve',
        data: '25/03/2025',
        preco: 'R$ 30,00',
        premiacao: 'R$ 2.500,00',
        previsaoInicio: '30/03/2025',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        qntTimes: '8'
    },
    {
        id: 3,
        imagem: '../img/cs2.png',
        titulo: 'Copa Comunidade',
        descricao: 'Torneio organizado pela comunidade para todos os níveis.',
        organizador: 'comum',
        status: 'disponivel',
        data: '10/04/2025',
        preco: 'Gratuito',
        premiacao: 'R$ 1.000,00',
        previsaoInicio: '15/04/2025',
        qntTimes: '4'
    },
    {
        id: 4,
        imagem: '../img/cs2.png',
        titulo: 'MIXCAMP 2º Edição',
        descricao: 'Segunda edição do campeonato principal com ainda mais prêmios.',
        organizador: 'oficial',
        status: 'encerrado',
        data: '01/02/2025',
        preco: 'R$ 50,00',
        premiacao: 'R$ 12.000,00',
        previsaoInicio: '05/02/2025',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        qntTimes: '32'
    }
];

function formatCurrencyBRL(valor) {
    if (valor === undefined || valor === null || valor === '') return 'A definir';
    const numero = typeof valor === 'number' ? valor : Number(valor);
    if (Number.isNaN(numero)) return String(valor);
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function aplicarFiltrosCampeonatos() {
    const termoInput = document.getElementById('filtroTitulo');
    const filtroStatus = document.getElementById('filtroStatus');

    if (!termoInput || !filtroStatus) {
        renderizarCampeonatos(listaCampeonatosCompleta);
        return;
    }

    const termo = termoInput.value.trim().toLowerCase();
    const activeTypeBtn = document.querySelector('.filter-type-btn.active');
    const tipo = activeTypeBtn ? activeTypeBtn.getAttribute('data-tipo') : 'todos';
    const status = filtroStatus.value;

    const filtrados = (listaCampeonatosCompleta || []).filter(camp => {
        // Filtro por título
        const matchTitulo = !termo || (camp.titulo || '').toLowerCase().includes(termo);

        // Filtro por tipo (oficial / comum / todos)
        const campOrganizador = (camp.organizador || '').toLowerCase();
        const matchTipo = tipo === 'todos' || campOrganizador === tipo.toLowerCase();

        // Filtro por status
        const campStatus = (camp.status || '').toLowerCase();
        let matchStatus = true;
        if (status !== 'todos') {
            // Tratar variações de "em breve"
            if (status === 'embreve') {
                matchStatus = campStatus === 'embreve' || campStatus === 'em breve';
            } else {
                matchStatus = campStatus === status;
            }
        }

        return matchTitulo && matchTipo && matchStatus;
    });

    renderizarCampeonatos(filtrados);
}

let listaCampeonatosCompleta = [];

function renderizarCampeonatos(lista) {
    const grid = document.getElementById('campeonatosGrid');
    if (!grid) return;

    if (!lista || lista.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-campeonatos">
                <div class="empty-state-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3 class="empty-state-title">Nenhum campeonato encontrado</h3>
                <p class="empty-state-message">Não encontramos campeonatos com os filtros selecionados.</p>
                <p class="empty-state-hint">Tente ajustar os filtros ou limpar a busca.</p>
            </div>`;
        return;
    }

    grid.innerHTML = lista.map(campeonato => {
        let colorBackground = '';
        

        if (campeonato.status === 'disponivel') {
            colorBackground = 'background: linear-gradient(180deg, #1f2937 0%, #065f46 100%);';
        }
        else if (campeonato.status === 'embreve' || campeonato.status === 'em breve') {
            colorBackground = 'background: linear-gradient(180deg, #1f2937 0%,rgb(10, 179, 221) 100%);';
        }
        else if (campeonato.status === 'andamento') {
            colorBackground = 'background: linear-gradient(180deg, #1f2937 0%,rgb(240, 92, 7) 100%);';
        }
        else if (campeonato.status === 'encerrado') {
            colorBackground = 'background: linear-gradient(180deg, #1f2937 0%,rgb(247, 0, 0) 100%);';
        }
        else if (campeonato.status === 'cancelado') {
            colorBackground = 'background: linear-gradient(180deg, #1f2937 0%,rgb(34, 34, 34) 100%);';
        }

        // Determinar texto do status
        let statusText = 'Disponivel';
        if (campeonato.status === 'embreve' || campeonato.status === 'em breve') statusText = 'Em Breve';
        else if (campeonato.status === 'andamento') statusText = 'Em Andamento';
        else if (campeonato.status === 'encerrado') statusText = 'Encerrado';
        else if (campeonato.status === 'cancelado') statusText = 'Cancelado';

        // Dividir título (assumindo formato "MIX EXTREME" ou similar)
        const tituloParts = campeonato.titulo.split(' ');
        const primeiraParte = tituloParts[0] || campeonato.titulo;
        const restoParte = tituloParts.slice(1).join(' ') || '';

        console.log(campeonato);

        

        return `
        <div class="campeonato-card" 
             data-id="${campeonato.id}"
             data-organizador="${campeonato.organizador}"
             data-status="${campeonato.status || ''}">
            <!-- Banner Superior -->
            <div class="card-banner">
                <div class="card-banner-bg"><img src="${campeonato.imagem}" alt="${campeonato.titulo}"></div>
                <div class="card-banner-content">
                    
                    <div class="card-badges">
                        <span class="card-badge badge-organizador ${campeonato.organizador}">
                            <i class="fa fa-circle-check"></i> ${campeonato.organizador === 'oficial' ? 'Oficial' : 'Comum'}
                        </span>
                        <span class="card-badge badge-status ${campeonato.status}">
                            ${statusText}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Conteúdo Principal -->
            <div class="card-content" style="${colorBackground}">
                <h3 class="card-title">
                    <span class="title-part title-green">${primeiraParte}</span>
                    ${restoParte ? `<span class="title-part title-purple">${restoParte}</span>` : ''}
                </h3>
                <p class="card-description">${campeonato.descricao || 'Sem descrição disponível.'}</p>
                
                <div class="card-info-grid">
                    <div class="card-info-column">
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <span>Date: ${formatarData(campeonato.data, { comHora: false })}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <span>Previsão de inicio: ${formatarData(campeonato.previsaoInicio, { comHora: false })}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <span>Organizador: ${campeonato.organizador === 'oficial' ? 'MIXCAMP Oficial' : 'Comunidade'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-key"></i>
                            <span>Chave: ${campeonato.chave || '......'}</span>
                        </div>
                    </div>
                    <div class="card-info-column">
                        <div class="info-item">
                            <i class="fas fa-globe"></i>
                            <span>Plataforma: ${campeonato.plataforma || 'A definir'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-trophy"></i>
                            <span>Edição: ${campeonato.edicao || '.....'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <span>Formato: ${campeonato.formato || '5V5'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <span>Total de Equipes: ${campeonato.qntTimes || '0'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions-row">
                    <button class="card-btn-inscricao">
                        INSCRIÇÃO: ${campeonato.preco}
                    </button>
                    <button class="card-btn-premiacao">
                        PREMIAÇÃO: ${campeonato.premiacao || 'R$ 0,00'}
                    </button>
                </div>
                
                <button class="card-btn-ver-sobre" onclick="verSobre(${campeonato.id})">
                    VER SOBRE
                </button>
            </div>
        </div>
    `;
    }).join('');
}

async function criarCardsCampeonatos() {
    const grid = document.getElementById('campeonatosGrid');
    if (!grid) return;

    // Loading simples
    grid.innerHTML = `
        <div class="campeonato-card" style="align-items:center;justify-content:center;min-height:160px;">
            <div class="card-content" style="align-items:center;justify-content:center;">
                Carregando campeonatos...
            </div>
        </div>`;

    let lista = [];
    try {
        const apiData = await getCardDados();
        const inscricoes = (apiData && apiData.inscricoes) ? apiData.inscricoes : [];

        // Mapear itens da API para o modelo de card usado anteriormente
        lista = inscricoes.map(item => ({
            id: item.id,
            imagem: item.imagem_url || '../img/cs2.png',
            titulo: item.titulo,
            descricao: item.descricao,
            organizador: (item.tipo || '').toLowerCase() === 'oficial' ? 'oficial' : 'comum',
            status: (item.status || '').toLowerCase(),
            data: item.data ? new Date(item.data) : null,
            preco: formatCurrencyBRL(item.preco_inscricao),
            premiacao: formatCurrencyBRL(item.premiacao),
            previsaoInicio: item.previsao_data_inicio ? new Date(item.previsao_data_inicio) : null,
            embedUrl: item.trofeu_iframe_url || item.medalha_iframe_url || '',
            chave: item.chave || '',
            formato: item.formato || '',
            plataforma: item.plataforma || '',
            edicao: item.edicao_campeonato || '',
            qntTimes: item.qnt_times || '0'
        }));

        
    } catch (e) {
        console.error('Falha ao carregar dados da API, usando dados de exemplo.', e);
    }

    // Fallback para mocks se vazio
    if (!lista || lista.length === 0) {
        lista = campeonatosExemplo;
    }

    // Guarda lista completa para filtro
    listaCampeonatosCompleta = lista;

    // Render inicial aplicando filtros
    aplicarFiltrosCampeonatos();

    // (modal removido)
}



function verSobre(id) {
    window.location.href = `inscricao.html?id=${id}`;
}

// (funções de modal removidas)


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
// ========= INITIALIZATION =========
// =================================

document.addEventListener('DOMContentLoaded', function () {
    // Autenticação / layout base
    verificar_auth();
    verificarTimeUsuario();
    addScrollProgress();

    // Banner
    criarBannerSlides();

    // Pausar autoplay do banner no hover
    const bannerCarousel = document.querySelector('.banner-carousel');
    if (bannerCarousel) {
        bannerCarousel.addEventListener('mouseenter', () => clearInterval(bannerInterval));
        bannerCarousel.addEventListener('mouseleave', iniciarAutoPlayBanner);
    }

    // Filtros de campeonatos
    const filtroTitulo = document.getElementById('filtroTitulo');
    const filtroStatus = document.getElementById('filtroStatus');

    if (filtroTitulo) {
        let timeoutId;
        filtroTitulo.addEventListener('input', function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(aplicarFiltrosCampeonatos, 200);
        });
    }

    if (filtroStatus) {
        filtroStatus.addEventListener('change', aplicarFiltrosCampeonatos);
    }

    // Botões de tipo (Oficial / Comum)
    const typeButtons = document.querySelectorAll('.filter-type-btn');
    if (typeButtons.length > 0) {
        typeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const alreadyActive = btn.classList.contains('active');

                // Se já estava ativo, desmarca (volta para "todos")
                if (alreadyActive) {
                    btn.classList.remove('active');
                } else {
                    // Ativa este e desativa os outros
                    typeButtons.forEach((b) => b.classList.remove('active'));
                    btn.classList.add('active');
                }

                aplicarFiltrosCampeonatos();
            });
        });
    }

    // Criar cards de campeonatos
    criarCardsCampeonatos();

    // Modal criar time
    setupImageUpload();

    const formCriarTime = document.getElementById('formCriarTime');
    if (formCriarTime) {
        formCriarTime.addEventListener('submit', function (e) {
            e.preventDefault();
            criarTime();
        });
    }

    const cancelarCriarTime = document.getElementById('cancelarCriarTime');
    if (cancelarCriarTime) {
        cancelarCriarTime.addEventListener('click', fecharModalCriarTime);
    }

    const closeModalCriarTime = document.getElementById('closeModalCriarTime');
    if (closeModalCriarTime) {
        closeModalCriarTime.addEventListener('click', fecharModalCriarTime);
    }

    const modalCriarTime = document.getElementById('modalCriarTime');
    if (modalCriarTime) {
        modalCriarTime.addEventListener('click', function (e) {
            if (e.target === modalCriarTime) {
                fecharModalCriarTime();
            }
        });
    }

    // Busca global (times / players)
    const searchInput = document.querySelector('.search-input');

    if (searchInput) {
        let timeoutId;

        searchInput.addEventListener('input', function () {
            clearTimeout(timeoutId);
            const termo = this.value.trim();

            timeoutId = setTimeout(() => {
                buscarTimesEPlayers(termo);
            }, 300);
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-bar-container')) {
                esconderResultados();
            }
        });
    }

    // Menu mobile (hamburguer)
    const navToggle = document.getElementById('navToggle');
    const navContainer = document.getElementById('navContainer');

    if (navToggle && navContainer) {
        navToggle.addEventListener('click', () => {
            const isOpen = navContainer.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
});





