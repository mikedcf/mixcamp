// URL base da sua API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'https://mixcamp-production.up.railway.app/api/v1';
let avatar = '';

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
    // console.log(auth_dados);
    
    
    if (auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil();
        
        
        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById("gerenciarCamp");
        gerenciarCamp.href = `gerenciar_campeonato.html`;
        // Atualiza a UI para o usuário logado
        
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
            else if (medalhasResponse.status == 404) {
                medalhasData = [];

            } else {
                throw new Error('Erro ao buscar dados das medalhas.');
            }


            const perfilData = await perfilResponse.json();


            return { perfilData, medalhasData };
        }
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


// =================================
// ========= SISTEMA =========

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

// Funções do Header
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


window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


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

// Função para download das regras
function downloadRegras(event) {
    // Prevenir comportamento padrão do link
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        // Criar link para download do PDF real
        const link = document.createElement('a');
        link.href = '../download/Regras_MIXCAMP.pdf';
        link.download = 'Regras_MIXCAMP.pdf';
        link.style.display = 'none'; // Esconder o link
        document.body.appendChild(link);
        link.click();
        
        // Remover o link após um pequeno delay
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);

        // Mostrar notificação
        showNotification('success', 'Download das regras iniciado!');
    } catch (error) {
        console.error('Erro ao baixar PDF:', error);
        showNotification('error', 'Erro ao baixar o arquivo. Tente novamente.');
    }
    
    return false; // Prevenir comportamento padrão adicional
}



// Função para toggle do FAQ
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Fechar todos os outros itens
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Abrir o item clicado se não estava ativo
    if (!isActive) {
        faqItem.classList.add('active');
    }
}


// Função para animar contadores
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 segundos
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
}

// Função para animar elementos no scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    // Observar elementos para animação
    document.querySelectorAll('.timeline-item, .funcionamento-card, .recurso-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Função para adicionar efeitos de hover
function addHoverEffects() {
    // Efeito nos cards
    document.querySelectorAll('.funcionamento-card, .recurso-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Efeito nos botões
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });

        btn.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}


// Função para adicionar efeitos de partículas
function addParticleEffects() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;

    document.body.appendChild(particlesContainer);

    // Criar partículas
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 107, 53, 0.3);
            border-radius: 50%;
            animation: float-particle ${Math.random() * 10 + 10}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;

        particlesContainer.appendChild(particle);
    }

    // Adicionar CSS para animação das partículas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-particle {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}


// Função para adicionar efeitos de confete
function addConfettiEffect() {
    function createConfetti() {
        const colors = ['#ff6b35', '#ff8c42', '#ffa726', '#ffcc02'];
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}%;
            z-index: 1000;
            animation: confetti-fall 3s linear forwards;
        `;

        document.body.appendChild(confetti);

        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 3000);
    }

    // Adicionar CSS para animação do confete
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(720deg);
            }
        }
    `;
    document.head.appendChild(style);

    // Criar confete quando clicar nos botões principais
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => createConfetti(), i * 50);
            }
        });
    });
}

// Função para adicionar progresso de scroll
function addScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #ff6b35, #ff8c42);
        z-index: 1001;
        transition: width 0.1s ease;
    `;

    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}


// Função para inicializar todas as funcionalidades
function inicializarPagina() {
    // Carregar tema salvo
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'claro') {
        document.body.classList.add('tema-claro');
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        if (themeIcon && themeText) {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Modo Claro';
        }
    }


    // Inicializar animações
    animateOnScroll();
    addHoverEffects();
    addParticleEffects();
    addConfettiEffect();
    addScrollProgress();

    // Animar contadores quando a página carregar
    setTimeout(() => {
        animateCounters();
    }, 1000);

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('menuOpcoes');
        const perfilBtn = document.querySelector('.perfil-btn');

        if (menu && !perfilBtn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('active');
            document.querySelector('.seta').style.transform = 'rotate(0deg)';
        }
    });

    // Fechar menu com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('menuOpcoes');
            if (menu && menu.classList.contains('active')) {
                menu.classList.remove('active');
                document.querySelector('.seta').style.transform = 'rotate(0deg)';
            }
        }
    });
}


// Adicionar efeitos de loading
window.addEventListener('load', () => {
    // Simular carregamento de dados
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 500);
});

// Efeitos de parallax simples
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-card');

    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});


// Função para compartilhar página
function compartilharPagina() {
    if (navigator.share) {
        navigator.share({
            title: 'MIXCAMP - O Melhor Campeonato de CS2',
            text: 'Conheça o MIXCAMP, o campeonato que evoluiu de uma pelada para um evento profissional!',
            url: window.location.href
        });
    } else {
        // Fallback para copiar URL
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Link copiado para a área de transferência!', 'success');
        });
    }
}


// Adicionar botão de compartilhar se suportado
if (navigator.share) {
    const shareBtn = document.createElement('button');
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareBtn.className = 'share-btn';
    shareBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff6b35, #ff8c42);
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
        transition: all 0.3s ease;
        z-index: 1000;
    `;

    shareBtn.addEventListener('click', compartilharPagina);
    shareBtn.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.1)';
    });
    shareBtn.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
    });

    document.body.appendChild(shareBtn);
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

document.addEventListener('DOMContentLoaded', verificar_auth);
document.addEventListener('DOMContentLoaded', verificarTimeUsuario);
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

// =================================
// ========= EFEITO DE LUZ NA TIMELINE =========
// =================================
// Esta função cria um efeito de luz que acompanha o scroll na linha vertical da timeline
// A luz desce quando o usuário rola para baixo e sobe quando rola para cima

// =================================
// ========= EFEITO DE LUZ NA TIMELINE - VERSÃO SIMPLIFICADA =========
// =================================
// Vamos começar simples e ir ajustando passo a passo conforme você me guiar

function inicializarEfeitoLuzTimeline() {
    // Elemento da luz na timeline
    const timelineLight = document.getElementById('timelineLight');
    // Elemento da linha iluminada (que fica atrás da luz)
    const timelineLineGlow = document.getElementById('timelineLineGlow');
    // Header
    const header = document.querySelector('.header');
    // Título MIXCAMP
    const heroTitle = document.querySelector('.hero-title');
    // Seção de stats (jogadores, times, edições, premiação)
    const heroStats = document.querySelector('.hero-stats');
    // Título "Nossa História"
    const historiaTitle = document.querySelector('.historia .section-title');
    // Container da timeline
    const timeline = document.querySelector('.timeline');
    // Timeline items para identificar os ícones
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Verifica se os elementos existem
    if (!timelineLight || !timelineLineGlow || !header || !heroTitle || !heroStats || !historiaTitle || !timeline) {
        console.log('Elementos não encontrados');
        return;
    }
    
    // Remove qualquer elemento duplicado de luz
    const todasLuzes = document.querySelectorAll('.timeline-light');
    if (todasLuzes.length > 1) {
        for (let i = 1; i < todasLuzes.length; i++) {
            todasLuzes[i].remove();
        }
    }
    
    // Função que atualiza a posição da luz baseado na posição do header
    function atualizarPosicaoLuz() {
        const scrollAtual = window.pageYOffset || document.documentElement.scrollTop;
        const headerBottom = header.getBoundingClientRect().bottom + scrollAtual;
        const timelineHeight = timeline.offsetHeight;
        
        // Ponto 1: Header cobre metade do título MIXCAMP - luz no topo (0%)
        const heroTitleRect = heroTitle.getBoundingClientRect();
        const heroTitleTopAbsoluto = scrollAtual + heroTitleRect.top;
        const heroTitleHeight = heroTitleRect.height;
        const heroTitleMeio = heroTitleTopAbsoluto + (heroTitleHeight / 2);
        const ponto1 = heroTitleMeio;
        
        // Ponto 2: Header no final de hero-stats - luz chegando na fa-chart-line (2º item)
        const heroStatsRect = heroStats.getBoundingClientRect();
        const heroStatsBottomAbsoluto = scrollAtual + heroStatsRect.bottom;
        const ponto2 = heroStatsBottomAbsoluto;
        const iconChartLine = timelineItems[1]?.querySelector('.timeline-icon');
        const posicaoIconChartLine = iconChartLine ? 
            (scrollAtual + iconChartLine.getBoundingClientRect().top) - (scrollAtual + timeline.getBoundingClientRect().top) : 
            timelineHeight * 0.25;
        
        // Ponto 3: Header no topo de "Nossa História" - luz chegando na fa-trophy (3º item)
        const historiaTitleRect = historiaTitle.getBoundingClientRect();
        const historiaTitleTopAbsoluto = scrollAtual + historiaTitleRect.top;
        const ponto3 = historiaTitleTopAbsoluto;
        const iconTrophy = timelineItems[2]?.querySelector('.timeline-icon');
        const posicaoIconTrophy = iconTrophy ? 
            (scrollAtual + iconTrophy.getBoundingClientRect().top) - (scrollAtual + timeline.getBoundingClientRect().top) : 
            timelineHeight * 0.4;
        
        // Ponto 4: Header no início da div com fa-play - luz em cima do fa-discord (4º item)
        const iconPlay = timelineItems[0]?.querySelector('.timeline-icon');
        const iconPlayTopAbsoluto = iconPlay ? scrollAtual + iconPlay.getBoundingClientRect().top : 0;
        const ponto4 = iconPlayTopAbsoluto;
        const iconDiscord = timelineItems[3]?.querySelector('.timeline-icon');
        const posicaoIconDiscord = iconDiscord ? 
            (scrollAtual + iconDiscord.getBoundingClientRect().top) - (scrollAtual + timeline.getBoundingClientRect().top) : 
            timelineHeight * 0.6;
        
        // Ponto 5: Header na metade do título "O Crescimento" - luz chegando na fa-rocket (5º item)
        const itemCrescimento = timelineItems[1];
        const tituloCrescimento = itemCrescimento?.querySelector('h3');
        const tituloCrescimentoRect = tituloCrescimento?.getBoundingClientRect();
        const tituloCrescimentoMeio = tituloCrescimentoRect ? 
            scrollAtual + tituloCrescimentoRect.top + (tituloCrescimentoRect.height / 2) : 0;
        const ponto5 = tituloCrescimentoMeio;
        const iconRocket = timelineItems[4]?.querySelector('.timeline-icon');
        const posicaoIconRocket = iconRocket ? 
            (scrollAtual + iconRocket.getBoundingClientRect().top) - (scrollAtual + timeline.getBoundingClientRect().top) : 
            timelineHeight * 0.8;
        
        // Ponto 6: Header no meio da div com fa-discord - luz no final (100%)
        const itemDiscord = timelineItems[3];
        const itemDiscordRect = itemDiscord?.getBoundingClientRect();
        const itemDiscordMeio = itemDiscordRect ? 
            scrollAtual + itemDiscordRect.top + (itemDiscordRect.height / 2) : 0;
        const ponto6 = itemDiscordMeio;
        
        // Calcula progresso baseado na posição do header
        let progresso = 0;
        let posicaoY = 0;
        
        if (headerBottom < ponto1) {
            // Antes do ponto 1 - luz no topo
            progresso = 0;
            posicaoY = 0;
        } else if (headerBottom >= ponto1 && headerBottom < ponto2) {
            // Entre ponto 1 e 2 - luz vai do topo até fa-chart-line
            const range = ponto2 - ponto1;
            const progressoAtual = headerBottom - ponto1;
            const percentual = progressoAtual / range;
            posicaoY = percentual * posicaoIconChartLine;
            progresso = (posicaoY / timelineHeight) * 100;
        } else if (headerBottom >= ponto2 && headerBottom < ponto3) {
            // Entre ponto 2 e 3 - luz vai de fa-chart-line até fa-trophy
            const range = ponto3 - ponto2;
            const progressoAtual = headerBottom - ponto2;
            const percentual = progressoAtual / range;
            posicaoY = posicaoIconChartLine + (percentual * (posicaoIconTrophy - posicaoIconChartLine));
            progresso = (posicaoY / timelineHeight) * 100;
        } else if (headerBottom >= ponto3 && headerBottom < ponto4) {
            // Entre ponto 3 e 4 - luz vai de fa-trophy até fa-discord
            const range = ponto4 - ponto3;
            const progressoAtual = headerBottom - ponto3;
            const percentual = progressoAtual / range;
            posicaoY = posicaoIconTrophy + (percentual * (posicaoIconDiscord - posicaoIconTrophy));
            progresso = (posicaoY / timelineHeight) * 100;
        } else if (headerBottom >= ponto4 && headerBottom < ponto5) {
            // Entre ponto 4 e 5 - luz vai de fa-discord até fa-rocket
            const range = ponto5 - ponto4;
            const progressoAtual = headerBottom - ponto4;
            const percentual = progressoAtual / range;
            posicaoY = posicaoIconDiscord + (percentual * (posicaoIconRocket - posicaoIconDiscord));
            progresso = (posicaoY / timelineHeight) * 100;
        } else if (headerBottom >= ponto5 && headerBottom < ponto6) {
            // Entre ponto 5 e 6 - luz vai de fa-rocket até final
            const range = ponto6 - ponto5;
            const progressoAtual = headerBottom - ponto5;
            const percentual = progressoAtual / range;
            posicaoY = posicaoIconRocket + (percentual * (timelineHeight - posicaoIconRocket));
            progresso = (posicaoY / timelineHeight) * 100;
        } else {
            // Depois do ponto 6 - luz no final
            progresso = 100;
            posicaoY = timelineHeight;
        }
        
        // Limita entre 0% e 100%
        progresso = Math.max(0, Math.min(100, progresso));
        posicaoY = Math.max(0, Math.min(timelineHeight, posicaoY));
        
        // Atualiza posição da luz
        timelineLight.style.top = posicaoY + 'px';
        
        // Atualiza altura da linha iluminada
        timelineLineGlow.style.height = posicaoY + 'px';
        
        // Ajusta opacidade baseado no progresso
        const intensidade = progresso / 100;
        timelineLineGlow.style.opacity = 0.6 + (intensidade * 0.4);
    }
    
    // Adiciona listener de scroll
    window.addEventListener('scroll', atualizarPosicaoLuz, { passive: true });
    window.addEventListener('resize', atualizarPosicaoLuz, { passive: true });
    
    // Atualiza posição inicial
    setTimeout(() => atualizarPosicaoLuz(), 100);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarPagina);
document.addEventListener('DOMContentLoaded', inicializarEfeitoLuzTimeline);
// Adicionar barra de progresso
addScrollProgress();