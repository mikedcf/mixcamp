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
        // Atualiza a UI para o usuário logado
        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.perfilData.usuario.time_id}`;
        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        const gerenciarCamp = document.getElementById("gerenciarCamp");
        if (perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
            gerenciarCamp.style.display = 'none';
        }
    }
    else{
        document.getElementById("userAuth").style.display = "flex";
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
    const userId = auth_dados.usuario.id;
    try {

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


// Função para formatar data
async function formatarData(dataISO) {
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


// Ícone por categoria de atualização do site
function getIconByCategoria(categoria) {
    const map = {
        mobile: 'fa fa-mobile-alt',
        'segurança': 'fa fa-shield-alt',
        interface: 'fa fa-desktop',
        sistema: 'fa fa-cogs',
        regras: 'fa fa-gavel',
        noticias: 'fa fa-newspaper',
        eventos: 'fa fa-calendar-alt',
        outros: 'fa fa-ellipsis-h'
    };
    return map[categoria] || map.outros;
}

// Ícone por destaque de notícias de campeonato
function getIconByDestaque(destaque) {
    const map = {
        vencedor: 'fa fa-trophy',
        destaque: 'fa fa-star',
        estatisticas: 'fa fa-chart-bar',
        proximo: 'fa fa-arrow-right',
        novidade: 'fa fa-sparkles'
    };
    return map[destaque] || map.novidade;
}


// =================================
// ========= NOTICIAS DESTAQUES =========

// ----- NOTICIAS DESTAQUES
async function buscarNoticiasDestaques() {
    try {
        const response = await fetch(`${API_URL}/noticias/destaques`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de destaque:', error);
        return [];
    }
}

// ----- NOTICIAS SITE
async function buscarNoticiasSite() {
    try {
        const response = await fetch(`${API_URL}/noticias/site`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de site:', error);
        return [];
    }
}

// ----- NOTICIAS CAMPEONATO
async function buscarNoticiasCampeonato() {
    try {
        const response = await fetch(`${API_URL}/noticias/campeonato`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de campeonato:', error);
        return [];
    }
}

// ----- MOSTRAR NOTICIAS CAMPEONATO
async function mostrarNoticiasCampeonato() {
    const dataResp = await buscarNoticiasCampeonato();
    const lista = (dataResp && Array.isArray(dataResp.noticias)) ? dataResp.noticias : [];

    const track = document.getElementById('campeonatoTrack');
    const btnPrev = document.getElementById('prevCampeonato');
    const btnNext = document.getElementById('nextCampeonato');
    if (!track) return;

    if (lista.length === 0) {
        track.innerHTML = `
            <div class="carrossel-slide">
                <div class="campeonato-news-card">
                    <div class="news-image">
                        <img src="../img/cs2.png" alt="Sem notícias">
                        <div class="news-badge novidade">📰 SEM NOTÍCIAS</div>
                    </div>
                    <div class="news-content">
                        <h3 class="news-title">Nenhuma notícia de campeonato no momento</h3>
                        <p class="news-excerpt">Volte mais tarde para novidades sobre campeonatos.</p>
                        <div class="news-meta">
                            <div class="meta-item">
                                <i class="fa fa-calendar"></i>
                                <span>—</span>
                            </div>
                            <div class="meta-item">
                                <i class="fa fa-user"></i>
                                <span>Por MixCamp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const slidesHtmlPromises = lista.map(async (item) => {
        const iconClass = getIconByDestaque(item.destaque);
        const dataFmt = await formatarData(item.data);
        const titulo = item.titulo || 'Notícia de Campeonato';
        const texto = item.texto || '';
        const destaqueTxt = item.destaque || 'novidade';
        const autor = item.autor || 'MixCamp';
        const imagemUrl = item.imagem_url || '../img/cs2.png';
        
        // Mapear destaque para texto do badge
        const badgeTexts = {
            vencedor: '🏆 VENCEDOR',
            destaque: '⭐ DESTAQUE',
            estatisticas: '📊 ESTATÍSTICAS',
            proximo: '🚀 PRÓXIMO',
            novidade: '✨ NOVIDADE'
        };
        const badgeText = badgeTexts[destaqueTxt] || badgeTexts.novidade;
        
        return `
            <div class="carrossel-slide">
                <div class="campeonato-news-card" onclick="abrirNoticia('campeonato', ${item.id})" style="cursor: pointer;">
                    <div class="news-image">
                        <img src="${imagemUrl}" alt="${titulo}">
                        <div class="news-badge ${destaqueTxt}">${badgeText}</div>
                    </div>
                    <div class="news-content">
                        <h3 class="news-title">${titulo}</h3>
                        <p class="news-excerpt">${texto}</p>
                        <div class="news-meta">
                            <div class="meta-item">
                                <i class="fa fa-calendar"></i>
                                <span>${dataFmt}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fa fa-user"></i>
                                <span>Por ${autor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    const slides = await Promise.all(slidesHtmlPromises);
    track.innerHTML = slides.join('');

    // Controle de navegação do carrossel
    let index = 0;
    const total = lista.length;
    const getSlideWidth = () => {
        const first = track.querySelector('.carrossel-slide');
        if (!first) return 0;
        const rect = first.getBoundingClientRect();
        return rect.width + 30; // soma o gap definido no CSS
    };

    function updateCarousel() {
        const offset = -(index * getSlideWidth());
        track.style.transform = `translateX(${offset}px)`;
    }

    if (btnPrev) {
        btnPrev.onclick = () => {
            index = Math.max(0, index - 1);
            updateCarousel();
        };
    }
    if (btnNext) {
        btnNext.onclick = () => {
            index = Math.min(total - 1, index + 1);
            updateCarousel();
        };
    }

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
}
//--------------------------------------------------

// ----- MOSTRAR NOTICIAS DESTAQUES
async function mostrarNoticiasDestaques() {
    const noticia = await buscarNoticiasDestaques();

    for(let i = 0; i < noticia.noticias.length; i++) {
        if (noticia.noticias[i].destaque == 'sim') {
            const data = await formatarData(noticia.noticias[i].data);
            document.getElementById('destaque-image').src = noticia.noticias[i].imagem_url;
            document.getElementById('destaque-title').textContent = noticia.noticias[i].titulo;
            document.getElementById('destaque-subtitulo').textContent = noticia.noticias[i].subtitulo;
            document.getElementById('destaque-date').textContent = data;
            document.getElementById('destaque-autor').textContent = noticia.noticias[i].autor;
            
            // Adicionar navegação ao card de destaque
            const destaqueCard = document.querySelector('.destaque-card');
            if (destaqueCard) {
                destaqueCard.style.cursor = 'pointer';
                destaqueCard.onclick = () => abrirNoticia('destaque', noticia.noticias[i].id);
            }
            break;
        }
    }
}

// ----- MOSTRAR NOTICIAS SITE
async function mostrarNoticiasSite() {
    const dataResp = await buscarNoticiasSite();
    const lista = (dataResp && Array.isArray(dataResp.noticias)) ? dataResp.noticias : [];

    const track = document.getElementById('atualizacoesTrack');
    const btnPrev = document.getElementById('prevAtualizacoes');
    const btnNext = document.getElementById('nextAtualizacoes');
    if (!track) return;

    if (lista.length === 0) {
        track.innerHTML = `
            <div class="carrossel-slide">
                <div class="atualizacao-card">
                    <div class="atualizacao-icon">
                        <i class="fa fa-info-circle"></i>
                    </div>
                    <div class="atualizacao-content">
                        <h3 class="atualizacao-title">Sem atualizações no momento</h3>
                        <p class="atualizacao-description">Volte mais tarde para novidades do site.</p>
                        <div class="atualizacao-meta">
                            <span class="atualizacao-date">—</span>
                            <span class="atualizacao-version">—</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const slidesHtmlPromises = lista.map(async (item) => {
        const iconClass = getIconByCategoria(item.categoria);
        const dataFmt = await formatarData(item.data);
        const titulo = item.titulo || 'Atualização';
        const subtitulo = item.subtitulo || '';
        const categoriaTxt = item.categoria || 'outros';
        return `
            <div class="carrossel-slide">
                <div class="atualizacao-card" onclick="abrirNoticia('site', ${item.id})" style="cursor: pointer;">
                    <div class="atualizacao-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="atualizacao-content">
                        <h3 class="atualizacao-title">${titulo}</h3>
                        <p class="atualizacao-description">${subtitulo}</p>
                        <div class="atualizacao-meta">
                            <span class="atualizacao-date">${dataFmt}</span>
                            <span class="atualizacao-version">${categoriaTxt}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    const slides = await Promise.all(slidesHtmlPromises);
    track.innerHTML = slides.join('');

    // Controle de navegação do carrossel
    let index = 0;
    const total = lista.length;
    const getSlideWidth = () => {
        const first = track.querySelector('.carrossel-slide');
        if (!first) return 0;
        const rect = first.getBoundingClientRect();
        return rect.width + 25; // soma o gap definido no CSS
    };

    function updateCarousel() {
        const offset = -(index * getSlideWidth());
        track.style.transform = `translateX(${offset}px)`;
    }

    if (btnPrev) {
        btnPrev.onclick = () => {
            index = Math.max(0, index - 1);
            updateCarousel();
        };
    }
    if (btnNext) {
        btnNext.onclick = () => {
            index = Math.min(total - 1, index + 1);
            updateCarousel();
        };
    }

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
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
document.addEventListener('DOMContentLoaded', mostrarNoticiasDestaques);
document.addEventListener('DOMContentLoaded', mostrarNoticiasCampeonato);
document.addEventListener('DOMContentLoaded', mostrarNoticiasSite);
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

// Adicionar barra de progresso
addScrollProgress();

// =================================
// ========= NAVEGAÇÃO =========

// Função para abrir notícia na página universal
function abrirNoticia(tipo, id) {
    window.location.href = `noticia.html?tipo=${tipo}&id=${id}`;
}