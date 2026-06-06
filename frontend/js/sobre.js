let avatar = '';
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
    
    
    
    if (auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil();
        
        
        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById("gerenciarCamp");
        gerenciarCamp.href = `gerenciar_campeonato.html`;
        // Atualiza a UI para o usuário logado
        
        document.getElementById('userAuth').classList.add('hidden');
        document.getElementById('userPerfil').classList.remove('hidden');
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.perfilData.usuario.time_id}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        if (isOrganizadorPlano(perfil_data.perfilData.usuario.organizador)) {
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

    // Timeline glow (após layout; altura correta da .timeline)
    inicializarEfeitoLuzTimeline();
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
// ========= TIMELINE GLOW (CSS + JS puro) =========
// =================================
// ultils.css: scroll no body — listeners no body, não na window

function inicializarEfeitoLuzTimeline() {
    const timeline = document.querySelector('.timeline');
    const glow = document.getElementById('timelineGlow');
    const lineFill = document.getElementById('timelineLineFill');

    if (!timeline || !glow || !lineFill) return;

    const items = Array.from(timeline.querySelectorAll('.timeline-item'));
    if (items.length === 0) return;

    const scroller = document.body;
    const SNAP_THRESHOLD = 48;
    const FADE_IN_RANGE = 140;

    let rafId = null;
    let lastY = -1;
    let lastOpacity = -1;

    function clamp(valor, min, max) {
        return Math.max(min, Math.min(max, valor));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function centroViewport(el) {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
    }

    function centroIconeRelativo(iconEl) {
        const tr = timeline.getBoundingClientRect();
        const ir = iconEl.getBoundingClientRect();
        return ir.top + ir.height / 2 - tr.top;
    }

    function linhaReferencia() {
        return window.innerHeight * 0.5;
    }

    function calcularEstado() {
        const align = linhaReferencia();
        const tr = timeline.getBoundingClientRect();
        const altura = timeline.offsetHeight;

        if (altura <= 0 || tr.bottom < 0 || tr.top > window.innerHeight) {
            return { y: 0, opacity: 0 };
        }

        const icones = items.map(item =>
            centroIconeRelativo(item.querySelector('.timeline-icon'))
        );
        const cards = items.map(item =>
            centroViewport(item.querySelector('.timeline-content'))
        );

        const playY = icones[0];
        const ultimoIdx = items.length - 1;
        const ultimoY = icones[ultimoIdx];

        // Antes de "O Início" centralizar — glow oculto no play
        if (cards[0] > align) {
            const opacity = cards[0] - align < FADE_IN_RANGE
                ? 1 - (cards[0] - align) / FADE_IN_RANGE
                : 0;
            return { y: playY, opacity: clamp(opacity, 0, 1) };
        }

        // Encaixe preciso quando card centraliza
        for (let i = 0; i < items.length; i++) {
            if (Math.abs(cards[i] - align) < SNAP_THRESHOLD) {
                return { y: icones[i], opacity: 1 };
            }
        }

        // Após CS2 sair do centro — continua até o fim da linha
        if (cards[ultimoIdx] < align) {
            if (tr.bottom <= align) {
                return { y: altura, opacity: 1 };
            }
            const t = clamp(
                (align - cards[ultimoIdx]) / (tr.bottom - cards[ultimoIdx]),
                0,
                1
            );
            return { y: lerp(ultimoY, altura, t), opacity: 1 };
        }

        // Entre dois cards: interpola entre ícones conforme scroll
        for (let i = 0; i < items.length - 1; i++) {
            const c0 = cards[i];
            const c1 = cards[i + 1];
            if (c0 <= align && c1 >= align) {
                const t = clamp((align - c0) / (c1 - c0), 0, 1);
                return { y: lerp(icones[i], icones[i + 1], t), opacity: 1 };
            }
        }

        return { y: playY, opacity: 1 };
    }

    function aplicarEstado({ y, opacity }) {
        if (Math.abs(y - lastY) > 0.25 || Math.abs(opacity - lastOpacity) > 0.01) {
            timeline.style.setProperty('--glow-y', `${y}px`);
            timeline.style.setProperty('--line-fill-h', `${y}px`);
            timeline.style.setProperty('--glow-opacity', String(opacity));
            lastY = y;
            lastOpacity = opacity;
        }
    }

    function atualizar() {
        rafId = null;
        aplicarEstado(calcularEstado());
    }

    function agendarAtualizacao() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(atualizar);
    }

    scroller.addEventListener('scroll', agendarAtualizacao, { passive: true });
    window.addEventListener('resize', agendarAtualizacao, { passive: true });
    window.addEventListener('load', agendarAtualizacao, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(agendarAtualizacao);
        ro.observe(timeline);
        items.forEach(item => ro.observe(item));
    }

    agendarAtualizacao();
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarPagina);