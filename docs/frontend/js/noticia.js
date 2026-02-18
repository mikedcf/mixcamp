// URL base da sua API
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

// =================================
// ========= UTILITIES =========

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

// Função para obter parâmetros da URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        tipo: urlParams.get('tipo'),
        id: urlParams.get('id')
    };
}

// Função para obter ícone por categoria
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

// Função para obter ícone por destaque
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
// ========= API CALLS =========

// Buscar notícia de destaque
async function buscarNoticiaDestaque(id) {
    try {
        const response = await fetch(`${API_URL}/noticias/destaques`);
        const data = await response.json();
        const noticia = data.noticias.find(n => n.id == id);
        return noticia || null;
    } catch (error) {
        console.error('Erro ao buscar notícia de destaque:', error);
        return null;
    }
}

// Buscar notícia de site
async function buscarNoticiaSite(id) {
    try {
        const response = await fetch(`${API_URL}/noticias/site`);
        const data = await response.json();
        const noticia = data.noticias.find(n => n.id == id);
        return noticia || null;
    } catch (error) {
        console.error('Erro ao buscar notícia de site:', error);
        return null;
    }
}

// Buscar notícia de campeonato
async function buscarNoticiaCampeonato(id) {
    try {
        const response = await fetch(`${API_URL}/noticias/campeonato`);
        const data = await response.json();
        const noticia = data.noticias.find(n => n.id == id);
        return noticia || null;
    } catch (error) {
        console.error('Erro ao buscar notícia de campeonato:', error);
        return null;
    }
}

// =================================
// ========= RENDER FUNCTIONS =========

// Renderizar notícia de destaque
async function renderizarNoticiaDestaque(noticia) {
    const dataFmt = await formatarData(noticia.data);
    
    document.getElementById('destaqueImage').src = noticia.imagem_url || '../img/cs2.png';
    document.getElementById('destaqueImage').alt = noticia.titulo;
    document.getElementById('destaqueDate').textContent = dataFmt;
    document.getElementById('destaqueAutor').textContent = noticia.autor || 'MixCamp';
    document.getElementById('destaqueViews').textContent = `${noticia.visualizacoes || 0} visualizações`;
    document.getElementById('destaqueTitle').textContent = noticia.titulo;
    document.getElementById('destaqueSubtitle').textContent = noticia.subtitulo;
    document.getElementById('destaqueText').innerHTML = noticia.texto || noticia.subtitulo;
    
    // Atualizar breadcrumb
    document.getElementById('breadcrumbCurrent').textContent = noticia.titulo;
    
    // Mostrar seção
    document.getElementById('noticiaDestaque').style.display = 'block';
}

// Renderizar notícia de site
async function renderizarNoticiaSite(noticia) {
    const dataFmt = await formatarData(noticia.data);
    const iconClass = getIconByCategoria(noticia.categoria);
    
    document.getElementById('siteIcon').className = iconClass;
    document.getElementById('siteCategory').textContent = noticia.categoria || 'outros';
    document.getElementById('siteDate').textContent = dataFmt;
    document.getElementById('siteTitle').textContent = noticia.titulo;
    document.getElementById('siteSubtitle').textContent = noticia.subtitulo;
    document.getElementById('siteText').innerHTML = noticia.texto || noticia.subtitulo;
    
    // Atualizar breadcrumb
    document.getElementById('breadcrumbCurrent').textContent = noticia.titulo;
    
    // Mostrar seção
    document.getElementById('noticiaSite').style.display = 'block';
}

// Renderizar notícia de campeonato
async function renderizarNoticiaCampeonato(noticia) {
    const dataFmt = await formatarData(noticia.data);
    const iconClass = getIconByDestaque(noticia.destaque);
    
    document.getElementById('campeonatoImage').src = noticia.imagem_url || '../img/cs2.png';
    document.getElementById('campeonatoImage').alt = noticia.titulo;
    document.getElementById('campeonatoDate').textContent = dataFmt;
    document.getElementById('campeonatoAutor').textContent = noticia.autor || 'MixCamp';
    document.getElementById('campeonatoDestaque').textContent = noticia.destaque || 'novidade';
    document.getElementById('campeonatoTitle').textContent = noticia.titulo;
    document.getElementById('campeonatoSubtitle').textContent = noticia.subtitulo;
    document.getElementById('campeonatoText').innerHTML = noticia.texto || noticia.subtitulo;
    
    // Atualizar badge
    const badgeTexts = {
        vencedor: '🏆 VENCEDOR',
        destaque: '⭐ DESTAQUE',
        estatisticas: '📊 ESTATÍSTICAS',
        proximo: '🚀 PRÓXIMO',
        novidade: '✨ NOVIDADE'
    };
    const badgeText = badgeTexts[noticia.destaque] || badgeTexts.novidade;
    document.getElementById('campeonatoBadge').innerHTML = `<i class="${iconClass}"></i><span>${badgeText}</span>`;
    
    // Atualizar breadcrumb
    document.getElementById('breadcrumbCurrent').textContent = noticia.titulo;
    
    // Mostrar seção
    document.getElementById('noticiaCampeonato').style.display = 'block';
}

// =================================
// ========= SOCIAL SHARE =========

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showNotification('success', 'Link copiado para a área de transferência!');
    }).catch(() => {
        showNotification('error', 'Erro ao copiar link.');
    });
}

// =================================
// ========= MAIN FUNCTION =========

async function carregarNoticia() {
    const { tipo, id } = getUrlParams();
    
    if (!tipo || !id) {
        mostrarErro();
        return;
    }
    
    let noticia = null;
    
    try {
        switch (tipo) {
            case 'destaque':
                noticia = await buscarNoticiaDestaque(id);
                break;
            case 'site':
                noticia = await buscarNoticiaSite(id);
                break;
            case 'campeonato':
                noticia = await buscarNoticiaCampeonato(id);
                break;
            default:
                mostrarErro();
                return;
        }
        
        if (!noticia) {
            mostrarErro();
            return;
        }
        
        // Renderizar baseado no tipo
        switch (tipo) {
            case 'destaque':
                await renderizarNoticiaDestaque(noticia);
                break;
            case 'site':
                await renderizarNoticiaSite(noticia);
                break;
            case 'campeonato':
                await renderizarNoticiaCampeonato(noticia);
                break;
        }
        
        // Atualizar título da página
        document.title = `${noticia.titulo} - Mixcamp`;
        
    } catch (error) {
        console.error('Erro ao carregar notícia:', error);
        mostrarErro();
    }
}

function mostrarErro() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

function esconderLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

// =================================
// ========= INITIALIZATION =========

document.addEventListener('DOMContentLoaded', async () => {
    await carregarNoticia();
    esconderLoading();
    
    // Conectar input de busca
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
// ========= SEARCH FUNCTIONS =========

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
// ========= HEADER FUNCTIONS =========

// Funções do header (reutilizadas de noticias.js)
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

// Scroll effect
window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});
