let avatar = '';
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
// =============================================================
// ====================== [ Noticiais ] ======================
function carregarMaisNoticias() {
    const noticiasGrid = document.getElementById('noticiasGrid');
    const btn = document.querySelector('.btn-carregar-mais');
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    btn.disabled = true;
    
    // Simular carregamento
    setTimeout(() => {
        const noticias = [
            {
                titulo: 'Nova Edição do MIXCAMP Anunciada',
                resumo: 'A próxima edição do campeonato será realizada em agosto de 2025...',
                data: '15/06/2025',
                categoria: 'Anúncio'
            },
            {
                titulo: 'Resultados da Última Final',
                resumo: 'Confira os destaques da emocionante final da última edição...',
                data: '10/06/2025',
                categoria: 'Resultado'
            }
        ];
        
        noticias.forEach(noticia => {
            const noticiaCard = document.createElement('div');
            noticiaCard.className = 'noticia-card';
            noticiaCard.innerHTML = `
                <div class="noticia-categoria">${noticia.categoria}</div>
                <h3>${noticia.titulo}</h3>
                <p>${noticia.resumo}</p>
                <div class="noticia-data">${noticia.data}</div>
            `;
            noticiasGrid.appendChild(noticiaCard);
        });
        
        btn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais Notícias';
        btn.disabled = false;
    }, 2000);
}


// =============================================================
// ====================== [ JAVASCRIPT ] ======================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}


function toggleVideos() {
    const videosContainer = document.getElementById('videosContainer');
    const btn = document.querySelector('.btn-ver-videos');
    
    if (videosContainer.style.display === 'none' || videosContainer.style.display === '') {
        videosContainer.style.display = 'grid';
        btn.textContent = 'Ocultar Vídeos';
        videosContainer.style.animation = 'fadeInUp 0.6s ease-out';
    } else {
        videosContainer.style.display = 'none';
        btn.textContent = 'Ver Vídeos';
    }
}


function inscreverTorneio() {
    // Simular inscrição
    const btn = document.querySelector('.btn-inscrever');
    const originalText = btn.textContent;
    
    btn.textContent = 'Inscrição Enviada!';
    btn.style.background = '#28a745';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
    }, 3000);
}


function verResultado() {
    alert('Redirecionando para página de resultados...');
    // Aqui você pode adicionar o redirecionamento real
}


function registrarTime() {
    alert('Redirecionando para registro de time...');
    // Aqui você pode adicionar o redirecionamento real
}


function discord() {
    window.open('https://discord.gg/mixcamp', '_blank');
}


// Animação dos números das estatísticas
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000; // 2 segundos
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current).toLocaleString();
        }, 16);
    });
}


// Parallax para elementos flutuantes
function initParallax() {
    const floatingElements = document.querySelectorAll('.floating-icon');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        floatingElements.forEach(element => {
            const speed = element.getAttribute('data-speed');
            const yPos = -(scrolled * speed / 10);
            element.style.transform = `translateY(${yPos}px)`;
        });
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
document.addEventListener("DOMContentLoaded", () => {
    verificar_auth();
    verificarTimeUsuario();
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

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar animações
    initParallax();
    
    // Observador para animar números quando visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
                observer.unobserve(entry.target);
            }
        });
    });
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // Carregar notícias iniciais
    carregarMaisNoticias();
});

// ========== MODAL DE NOTIFICAÇÕES (apenas home.html) ==========

/** Retorna o array de notificações do usuário logado: [{ id, user_id, texto, lida (boolean), criada_em (formatada) }, ...] */
async function filtrarNotificacoesUssuario() {
    const dataDados = [];
    const auth_dados = await autenticacao();
    if (!auth_dados || !auth_dados.logado) return dataDados;
    const userId = Number(auth_dados.usuario.id);
    var notificacoes = [];
    try {
        notificacoes = await buscarNotificacoes();
    } catch (e) {
        console.error('Erro buscarNotificacoes:', e);
        return dataDados;
    }
    if (!Array.isArray(notificacoes)) notificacoes = [];
    for (const notificao of notificacoes) {
        if (Number(notificao.user_id) === userId) {
            var criadaEm = notificao.criada_em;
            try {
                criadaEm = typeof formatarDataBR === 'function' ? await formatarDataBR(notificao.criada_em) : (notificao.criada_em || '');
            } catch (err) {
                criadaEm = notificao.criada_em || '';
            }
            dataDados.push({
                id: notificao.id,
                user_id: notificao.user_id,
                texto: notificao.texto || '',
                lida: notificao.lida === 1 || notificao.lida === true,
                criada_em: criadaEm
            });
        }
    }
    return dataDados;
}


function normalizarNotificacoes(arr) {
    // console.log(arr);
    if (!Array.isArray(arr)) return [];
    return arr.map(async function (n) {
        // console.log(n);
        return {
            id: n.id,
            user_id: n.user_id,
            texto: n.texto || '',
            lida: n.lida === 1,
            criada_em: await formatarDataBR(n.criada_em)
        };
    });
}

/** Monta a lista do modal com o array de notificações [{ id, texto, lida, criada_em }, ...]. */
function renderizarListaNotificacoes(notificacoes) {
    const listView = document.getElementById('modalNotificacoesList');
    if (!listView) return;
    listView.style.display = 'block';
    const maxPreview = 55;
    if (!notificacoes || !Array.isArray(notificacoes) || notificacoes.length === 0) {
        listView.innerHTML = '<p class="notificacoes-vazio"><i class="fas fa-bell-slash"></i> Nenhuma notificação</p>';
        return;
    }
    var texto = notificacoes.map(function (n) {
        var txt = (n && n.texto) ? String(n.texto) : '';
        var preview = txt.length > maxPreview ? txt.slice(0, maxPreview) + '...' : txt;
        var lida = n.lida === true || n.lida === 1;
        var statusClass = lida ? 'notificacao-lida' : 'notificacao-nao-lida';
        var statusText = lida ? 'Lida' : 'Não lida';
        var msgEscaped = txt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var previewEscaped = preview.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var dataEscaped = (n.criada_em != null ? String(n.criada_em) : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return (
            '<div class="notificacao-item" data-id="' + (n.id != null ? n.id : '') + '" data-lida="' + lida + '" data-mensagem="' + msgEscaped + '">' +
                '<p class="notificacao-preview">' + previewEscaped + '</p>' +
                '<div class="notificacao-meta">' +
                    '<span class="notificacao-status ' + statusClass + '">' + statusText + '</span>' +
                    '<span class="notificacao-hora">' + dataEscaped + '</span>' +
                '</div>' +
            '</div>'
        );
    }).join('');
    listView.innerHTML = texto;
}

/** Abre o modal de notificações (fecha o menu do perfil, busca dados, monta a lista e aplica o filtro da aba). */
function abrirModalNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    if (!modal) return;
    const menuOpcoes = document.getElementById('menuOpcoes');
    if (menuOpcoes) menuOpcoes.style.display = 'none';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    var detailView = document.getElementById('modalNotificacoesDetail');
    if (detailView) {
        detailView.setAttribute('hidden', '');
        detailView.style.display = 'none';
    }

    var tabLidas = document.getElementById('tabNotifLidas');
    var tabNaoLidas = document.getElementById('tabNotifNaoLidas');
    if (tabLidas && tabNaoLidas) {
        tabLidas.classList.remove('tab-notif-active');
        tabNaoLidas.classList.add('tab-notif-active');
    }

    const listView = document.getElementById('modalNotificacoesList');
    if (listView) {
        listView.style.display = 'block';
        listView.innerHTML = '<p class="notificacoes-vazio"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    }

    filtrarNotificacoesUssuario().then(function(notificacoes) {
        renderizarListaNotificacoes(notificacoes || []);
        aplicarFiltroTabNotificacoes();
    }).catch(function(e) {
        console.error('Erro ao carregar notificações:', e);
        renderizarListaNotificacoes([]);
        aplicarFiltroTabNotificacoes();
    });
}

/** Fecha o modal de notificações (ao clicar no X ou fora do modal). Volta à vista da lista e restaura o scroll. */
function fecharModalNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    mostrarListaNotificacoes();
}

function mostrarListaNotificacoes() {
    const listView = document.getElementById('modalNotificacoesList');
    const detailView = document.getElementById('modalNotificacoesDetail');
    if (listView) listView.style.display = 'block';
    if (detailView) {
        detailView.setAttribute('hidden', '');
        detailView.style.display = 'none';
    }
}

function mostrarDetalheNotificacao(item) {
    const listView = document.getElementById('modalNotificacoesList');
    const detailView = document.getElementById('modalNotificacoesDetail');
    const detailTitle = document.getElementById('notificacaoDetailTitle');
    const detailStatus = document.getElementById('notificacaoDetailStatus');
    const detailHora = document.getElementById('notificacaoDetailHora');
    const detailMessage = document.getElementById('notificacaoDetailMessage');

    const mensagem = item.getAttribute('data-mensagem') || '';
    const hora = item.querySelector('.notificacao-hora');
    const lida = item.getAttribute('data-lida') === 'true';
    const notifId = item.getAttribute('data-id');

    if (listView) listView.style.display = 'none';
    if (detailView) {
        detailView.removeAttribute('hidden');
        detailView.style.display = 'flex';
    }
    if (detailTitle) detailTitle.textContent = 'Notificação';
    if (detailMessage) detailMessage.textContent = mensagem;
    if (detailHora) detailHora.textContent = hora ? hora.textContent : '';
    if (detailStatus) {
        detailStatus.textContent = lida ? 'Lida' : 'Não lida';
        detailStatus.className = 'notificacao-detail-status ' + (lida ? 'notificacao-lida' : 'notificacao-nao-lida');
    }

    if (!lida && notifId && typeof atualizarNotificacaoLida === 'function') {
        atualizarNotificacaoLida(notifId).then(function(ok) {
            if (ok) {
                item.setAttribute('data-lida', 'true');
                var statusSpan = item.querySelector('.notificacao-status');
                if (statusSpan) {
                    statusSpan.textContent = 'Lida';
                    statusSpan.className = 'notificacao-status notificacao-lida';
                }
                detailStatus.textContent = 'Lida';
                detailStatus.className = 'notificacao-detail-status notificacao-lida';
            }
        }).catch(function(e) { console.error('Erro ao marcar notificação como lida:', e); });
    }
}

function aplicarFiltroTabNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    if (!modal) return;
    const listView = document.getElementById('modalNotificacoesList');
    const activeTab = document.querySelector('.tab-notif.tab-notif-active');
    const tab = activeTab ? activeTab.getAttribute('data-tab') : 'lidas';
    const lidas = tab === 'lidas';
    const itens = modal.querySelectorAll('.notificacao-item');
    var visiveis = 0;
    itens.forEach(function(el) {
        const itemLida = el.getAttribute('data-lida') === 'true';
        const mostrar = itemLida === lidas;
        el.style.display = mostrar ? '' : 'none';
        if (mostrar) visiveis++;
    });
    var placeholder = listView ? listView.querySelector('.notificacoes-filtro-vazio') : null;
    if (itens.length > 0 && visiveis === 0) {
        if (!placeholder) {
            placeholder = document.createElement('p');
            placeholder.className = 'notificacoes-vazio notificacoes-filtro-vazio';
            if (listView) listView.appendChild(placeholder);
        }
        placeholder.textContent = lidas ? 'Nenhuma notificação lida' : 'Nenhuma notificação não lida';
        placeholder.style.display = '';
    } else if (placeholder) {
        placeholder.style.display = 'none';
    }
}

function initModalNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    const linkNotif = document.getElementById('menuNotificacoesLink');
    const btnClose = document.getElementById('modalNotificacoesClose');
    const listView = document.getElementById('modalNotificacoesList');
    const detailView = document.getElementById('modalNotificacoesDetail');
    const btnBack = document.getElementById('modalNotificacoesBack');
    const tabLidas = document.getElementById('tabNotifLidas');
    const tabNaoLidas = document.getElementById('tabNotifNaoLidas');

    if (!modal || !linkNotif) return;

    linkNotif.addEventListener('click', function(e) {
        e.preventDefault();
        abrirModalNotificacoes();
    });

    if (btnClose) btnClose.addEventListener('click', fecharModalNotificacoes);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) fecharModalNotificacoes();
    });

    if (btnBack) btnBack.addEventListener('click', mostrarListaNotificacoes);

    if (tabLidas) {
        tabLidas.addEventListener('click', function() {
            tabNaoLidas.classList.remove('tab-notif-active');
            tabLidas.classList.add('tab-notif-active');
            aplicarFiltroTabNotificacoes();
        });
    }
    if (tabNaoLidas) {
        tabNaoLidas.addEventListener('click', function() {
            tabLidas.classList.remove('tab-notif-active');
            tabNaoLidas.classList.add('tab-notif-active');
            aplicarFiltroTabNotificacoes();
        });
    }

    if (listView) {
        listView.addEventListener('click', function(e) {
            const item = e.target.closest('.notificacao-item');
            if (item) mostrarDetalheNotificacao(item);
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            if (detailView && !detailView.hidden) {
                mostrarListaNotificacoes();
            } else {
                fecharModalNotificacoes();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initModalNotificacoes();
});




