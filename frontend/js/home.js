

// =============================================================================
// ====================== [ autenticação ] (ex-home.js) =========================
// =============================================================================

/**
 * Verifica sessão no servidor.
 * @returns {Promise<object|undefined>}
 */
async function autenticacao() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { logado: false };
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na inicialização:', error);
        return { logado: false };
    }
}

async function verificar_auth() {
    const auth_dados = await autenticacao();
    const userAuth = document.getElementById('userAuth');
    const userPerfil = document.getElementById('userPerfil');
    if (!userAuth || !userPerfil) return;

    if (auth_dados && auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil();
        if (!perfil_data || !perfil_data.perfilData) return;

        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        const gerenciarCamp = document.getElementById('gerenciarCamp');

        userAuth.classList.add('hidden');
        userPerfil.classList.remove('hidden');

        document.getElementById('perfilnome').textContent = auth_dados.usuario.nome;
        document.getElementById('ftPerfil').src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${perfil_data.perfilData.usuario.time_id}`;

        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        if (gerenciarCamp) {
            if (perfil_data.perfilData.usuario.organizador === 'premium') {
                gerenciarCamp.style.display = 'flex';
                gerenciarCamp.href = 'gerenciar_campeonato.html';
            } else {
                gerenciarCamp.style.display = 'none';
            }
        }
    } else {
        userAuth.classList.remove('hidden');
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
            const userPerfil = document.getElementById('userPerfil');
            const userAuth = document.getElementById('userAuth');
            if (userPerfil) userPerfil.style.display = 'none';
            if (userAuth) userAuth.style.display = 'flex';
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

async function buscarDadosPerfil() {
    const auth_dados = await autenticacao();
    try {
        if (!auth_dados || !auth_dados.logado) {
            return { perfilData: null, medalhasData: [] };
        }

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
        } else if (medalhasResponse.status === 404) {
            medalhasData = [];
        } else {
            throw new Error('Erro ao buscar dados das medalhas.');
        }

        const perfilData = await perfilResponse.json();
        return { perfilData, medalhasData };
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
    }
    return { perfilData: null, medalhasData: [] };
}

async function verificarTimeUsuario() {
    const auth_dados = await autenticacao();
    try {
        if (auth_dados && auth_dados.logado) {
            const userId = auth_dados.usuario.id;
            const response = await fetch(`${API_URL}/times/by-user/${userId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.time) {
                    atualizarMenuTime(true, data.time.id);
                } else {
                    atualizarMenuTime(false);
                }
            } else {
                atualizarMenuTime(false);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar time do usuário:', error);
        atualizarMenuTime(false);
    }
}

function atualizarMenuTime(temTime, timeId) {
    const menuTimeLink = document.getElementById('menuTimeLink');
    const menuTimeText = document.getElementById('menuTimeText');
    if (!menuTimeLink || !menuTimeText) return;

    if (temTime && timeId) {
        menuTimeLink.href = `team.html?id=${timeId}`;
        menuTimeText.textContent = 'Meu Time';
        menuTimeLink.onclick = null;
    } else {
        menuTimeLink.href = '#';
        menuTimeText.textContent = 'Criar Time';
        menuTimeLink.onclick = function (e) {
            e.preventDefault();
            if (typeof abrirModalCriarTime === 'function') abrirModalCriarTime();
        };
    }
}

// =============================================================================
// ====================== [ Index — destaque campeonato ] =====================
// (comportamento alinhado ao banner de campeonato.html: track, dots, progresso)
// =============================================================================

function formatarDataHomeDestaque(dataISO, comHora) {
    if (!dataISO) return 'A definir';
    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return 'A definir';
        const opcoes = comHora
            ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { day: '2-digit', month: '2-digit', year: 'numeric' };
        return data.toLocaleString('pt-BR', opcoes);
    } catch (e) {
        return 'A definir';
    }
}

function escHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function truncateHomeText(text, maxLen) {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '...';
}

/** Mapeia item da API promover/banner para slide da home */
function mapPromoverParaSlideHome(c) {
    const dataInicioFmt = c.data_inicio ? formatarDataHomeDestaque(c.data_inicio, true) : 'A definir';
    const premiacao = c.premiacao || '';
    const preco = c.valor_inscricao || '';
    const qnt = c.qnt_times ?? '0';
    const game = c.game || 'CS2';
    const plataforma = c.plataforma || 'FACEIT';
    const chave = c.chave || '';
    const id = c.evento_id ?? c.id;
    const titulo = c.titulo || 'Campeonato Mixcamp';
    const desc =
        c.descricao && String(c.descricao).length > 0
            ? truncateHomeText(String(c.descricao), 420)
            : `Início: ${dataInicioFmt} • Premiação: ${premiacao ? 'R$ ' + premiacao : '—'} • Inscrição: ${preco ? 'R$ ' + preco : '—'}`;

    const imgBanner =
        c.banner_img && String(c.banner_img).trim()
            ? c.banner_img
            : 'https://i.ibb.co/67vQ6J16/mx-extreme-1.webp';

    return {
        id,
        image: imgBanner,
        planoAssinado: c.plano_assinado || c.planoAssinado || null,
        title: titulo,
        subtitle: desc,
        dataInicio: dataInicioFmt,
        premiacao: premiacao ? `R$ ${premiacao}` : '',
        preco: preco ? `R$ ${preco}` : '',
        qntTimes: String(qnt),
        game,
        plataforma,
        chave
    };
}

let homeDestaqueIndex = 0;
let homeDestaqueSlides = [];
let homeDestaqueProgressTimeout = null;
let homeDestaqueProgressListenerAdded = false;

function buildHomeDestaqueEmptyHtml() {
    return (
        `<div class="home-destaque-empty" role="status" aria-live="polite">` +
        `<div class="home-destaque-empty-inner">` +
        `<span class="home-destaque-empty-icon" aria-hidden="true"><i class="fas fa-bullhorn"></i></span>` +
        `<p class="home-destaque-empty-title">Sem dados no momento</p>` +
        `<p class="home-destaque-empty-sub">Não há campeonatos em destaque. Volte em breve para ver promoções e eventos MIXCAMP.</p>` +
        `<a href="campeonato.html" class="home-destaque-empty-cta btn-shine-hover">Ver campeonatos</a>` +
        `</div></div>`
    );
}

/**
 * Faixa no topo: sempre dois blocos iguais no trilho para o marquee em loop (CSS translateX -50%).
 * Plano máximo: duas frases lado a lado; demais planos: repete “Campeonato em destaque”.
 */
function buildHomeDestaquePromoTickerHtml(isMax) {
    const itemFire =
        `<span class="home-destaque-ticker-item"><i class="fas fa-fire-alt" aria-hidden="true"></i><span>Campeonato em destaque</span></span>`;
    const itemCrown =
        `<span class="home-destaque-ticker-item"><i class="fas fa-crown" aria-hidden="true"></i><span>Máxima visibilidade</span></span>`;
    const sep = `<span class="home-destaque-ticker-sep" aria-hidden="true"></span>`;

    const innerGroup = isMax ? itemFire + sep + itemCrown : itemFire;
    const group = (content) => `<div class="home-destaque-ticker-group">${content}</div>`;

    return (
        `<div class="home-destaque-promo-ticker" aria-hidden="true">` +
        `<div class="home-destaque-ticker-marquee">` +
        `<div class="home-destaque-ticker-track">${group(innerGroup)}${group(innerGroup)}</div>` +
        `</div></div>`
    );
}

function buildHomeDestaqueSlideHtml(slide, index, totalSlides) {
    const isMax = slide.planoAssinado === 'maximo';
    const maxClass = isMax ? ' banner-slide-maximo' : '';
    const linkInsc = slide.id ? `inscricao.html?id=${slide.id}` : 'campeonato.html';
    const titulo = escHtml(slide.title);
    const subtitulo = escHtml(slide.subtitle);
    const dataIni = escHtml(slide.dataInicio);
    const part = escHtml(slide.qntTimes || '0');
    const plat = escHtml(slide.plataforma || '');
    const game = escHtml(slide.game || '');
    const premio = escHtml(slide.premiacao || '');
    const taxa = escHtml(slide.preco || '');
    const chaveEsc = escHtml(slide.chave || '');
    const imgUrl = escHtml(slide.image).replace(/'/g, '&#39;');

    return (
        `<div class="home-destaque-slide${maxClass}" data-slide-index="${index}" role="group" aria-roledescription="slide" aria-label="Slide ${index + 1} de ${totalSlides}">` +
        buildHomeDestaquePromoTickerHtml(isMax) +
        `<div class="banner-conteiner" style="background-image:url('${imgUrl}');"></div>` +
        `<div class="detalhes-conteiner">` +
        `<div class="card detalhes">` +
        `<div class="info-item"><i class="fas fa-calendar-alt"></i><p>Previsão de Início: ${dataIni}</p></div>` +
        `<div class="info-item"><i class="fas fa-users"></i><p>Participantes (times): ${part}</p></div>` +
        `<div class="info-item"><i class="fas fa-signal"></i><p>Nível: 1/10</p></div>` +
        `<div class="info-item"><i class="fas fa-puzzle-piece"></i><p>Formato: 5v5</p></div>` +
        `</div>` +
        `<div class="titulos">` +
        `<h2>${titulo}</h2>` +
        `<p>${subtitulo}</p>` +
        `<div class="titulos-actions">` +
        `<a href="${linkInsc}" class="bnt-detalhes bnt-detalhes--destaque btn-shine-hover"><i class="fas fa-arrow-right"></i> Ver detalhes e inscrever-se</a>` +
        `</div>` +
        `</div>` +
        `<div class="card detalhes">` +
        `<div class="info-item"><i class="fas fa-server"></i><p>Plataforma: ${plat}</p></div>` +
        `<div class="info-item"><i class="fas fa-shield-alt"></i><p>Tipo: OFICIAL</p></div>` +
        `<div class="info-item"><i class="fas fa-trophy"></i><p>Premiação: ${premio}</p></div>` +
        `<div class="info-item"><i class="fas fa-coins"></i><p>Taxa de Inscrição: ${taxa}</p></div>` +
        (chaveEsc ? `<div class="info-item"><i class="fas fa-sitemap"></i><p>Chave: ${chaveEsc}</p></div>` : '') +
        `<div class="info-item"><i class="fas fa-gamepad"></i><p>Game: ${game}</p></div>` +
        `</div>` +
        `</div>` +
        `</div>`
    );
}

function resetHomeDestaqueProgress() {
    const progress = document.getElementById('homeDestaqueProgress');
    if (!progress) return;

    if (homeDestaqueProgressTimeout) {
        clearTimeout(homeDestaqueProgressTimeout);
        homeDestaqueProgressTimeout = null;
    }

    if (homeDestaqueSlides.length === 0) {
        progress.style.transition = 'none';
        progress.style.width = '0%';
        return;
    }

    if (homeDestaqueSlides.length <= 1) {
        progress.style.transition = 'none';
        progress.style.width = '100%';
        return;
    }

    progress.classList.remove('banner-progress-paused');
    progress.style.transition = 'none';
    progress.style.width = '0%';
    void progress.offsetWidth;
    progress.style.transition = 'width 5s linear';
    progress.style.width = '100%';

    homeDestaqueProgressTimeout = setTimeout(() => {
        if (progress.classList.contains('banner-progress-paused')) return;
        if (homeDestaqueSlides.length === 0) return;
        homeDestaqueIndex = (homeDestaqueIndex + 1) % homeDestaqueSlides.length;
        atualizarHomeDestaqueCarousel();
    }, 5000);
}

function configurarHomeDestaqueProgressListener() {
    const progress = document.getElementById('homeDestaqueProgress');
    if (!progress || homeDestaqueProgressListenerAdded) return;

    progress.addEventListener('transitionend', function onProgressEnd(e) {
        if (e.propertyName !== 'width') return;
        if (progress.classList.contains('banner-progress-paused')) return;
        if (homeDestaqueSlides.length <= 1) return;

        if (homeDestaqueProgressTimeout) {
            clearTimeout(homeDestaqueProgressTimeout);
            homeDestaqueProgressTimeout = null;
        }
        homeDestaqueIndex = (homeDestaqueIndex + 1) % homeDestaqueSlides.length;
        atualizarHomeDestaqueCarousel();
    });
    homeDestaqueProgressListenerAdded = true;
}

function atualizarHomeDestaqueCarousel() {
    const track = document.getElementById('homeDestaqueTrack');
    const dotsWrap = document.getElementById('homeDestaqueDots');
    if (!track || !dotsWrap) return;

    if (track.querySelector('.home-destaque-empty')) return;

    const slides = track.querySelectorAll('.home-destaque-slide');
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === homeDestaqueIndex);
    });

    track.style.transform = `translateX(-${homeDestaqueIndex * 100}%)`;

    dotsWrap.querySelectorAll('.home-destaque-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === homeDestaqueIndex);
        dot.setAttribute('aria-current', index === homeDestaqueIndex ? 'true' : 'false');
    });

    resetHomeDestaqueProgress();
}

async function fetchPromoverBannerHome() {
    try {
        const response = await fetch(`${API_URL}/promover/banner`, { credentials: 'include' });
        if (!response.ok) return [];
        const data = await response.json();
        const lista = data.promover_banner || [];
        return lista.filter((c) => {
            const bannerLocal = c.banner_local || c.bannerLocal;
            const statusPromover = c.status_promover_evento || c.statusPromoverEvento;
            if (statusPromover !== 'disponivel') return false;
            if (!bannerLocal) return false;
            return bannerLocal === 'home' || bannerLocal === 'ambos';
        });
    } catch (e) {
        console.warn('Home destaque: API promover/banner indisponível.', e);
        return [];
    }
}

function initHomeDestaqueCarousel() {
    const carouselRoot = document.getElementById('homeDestaqueCarousel');
    const track = document.getElementById('homeDestaqueTrack');
    const dotsWrap = document.getElementById('homeDestaqueDots');
    const prevBtn = document.getElementById('homeDestaquePrev');
    const nextBtn = document.getElementById('homeDestaqueNext');
    const viewport = document.querySelector('.home-destaque-viewport');
    if (!track || !dotsWrap) return;

    const controlsBar = document.getElementById('homeDestaqueControls');

    fetchPromoverBannerHome().then((lista) => {
        const vazio = !lista || lista.length === 0;
        if (carouselRoot) {
            carouselRoot.classList.toggle('home-destaque-carousel--empty', vazio);
        }
        if (controlsBar) {
            controlsBar.hidden = vazio;
        }

        if (vazio) {
            homeDestaqueSlides = [];
            homeDestaqueIndex = 0;
            track.innerHTML = buildHomeDestaqueEmptyHtml();
            dotsWrap.innerHTML = '';
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            resetHomeDestaqueProgress();
            return;
        }

        homeDestaqueSlides = lista.map(mapPromoverParaSlideHome);

        homeDestaqueIndex = 0;
        const total = homeDestaqueSlides.length;
        track.innerHTML = homeDestaqueSlides.map((s, i) => buildHomeDestaqueSlideHtml(s, i, total)).join('');

        dotsWrap.innerHTML = homeDestaqueSlides
            .map(
                (_, i) =>
                    `<button type="button" class="dot home-destaque-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}" aria-current="${i === 0 ? 'true' : 'false'}"></button>`
            )
            .join('');

        dotsWrap.querySelectorAll('.home-destaque-dot').forEach((dot) => {
            dot.addEventListener('click', () => {
                const i = parseInt(dot.getAttribute('data-index'), 10);
                if (!isNaN(i)) {
                    homeDestaqueIndex = i;
                    atualizarHomeDestaqueCarousel();
                }
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const n = homeDestaqueSlides.length;
                homeDestaqueIndex = (homeDestaqueIndex - 1 + n) % n;
                atualizarHomeDestaqueCarousel();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const n = homeDestaqueSlides.length;
                homeDestaqueIndex = (homeDestaqueIndex + 1) % n;
                atualizarHomeDestaqueCarousel();
            });
        }

        configurarHomeDestaqueProgressListener();
        atualizarHomeDestaqueCarousel();

        const umSlide = homeDestaqueSlides.length <= 1;
        if (prevBtn) prevBtn.style.display = umSlide ? 'none' : '';
        if (nextBtn) nextBtn.style.display = umSlide ? 'none' : '';

        if (viewport && typeof window.MixCampTouch !== 'undefined' && window.MixCampTouch.attachHorizontalSwipe) {
            window.MixCampTouch.attachHorizontalSwipe(viewport, {
                threshold: 50,
                onSwipeNext: () => nextBtn && nextBtn.click(),
                onSwipePrev: () => prevBtn && prevBtn.click()
            });
        }
    });
}

// =============================================================================
// ====================== [ Index — organizador banner ] ========================
// =============================================================================

function initOrganizadorBannerSlider() {
    const banner = document.getElementById('organizadorBanner');
    const thumbs = document.querySelectorAll('.organizador-thumb');
    if (!banner || thumbs.length === 0) return;

    const urls = [];
    thumbs.forEach((t) => {
        const st = t.getAttribute('style') || '';
        const m = st.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (m && m[1]) urls.push(m[1]);
    });
    if (urls.length === 0) return;

    let idx = 0;
    let timer = null;
    const INTERVAL_MS = 5000;

    function apply(i) {
        idx = (i + urls.length) % urls.length;
        const u = urls[idx];
        banner.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.25)), url("${u}")`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
        banner.style.backgroundRepeat = 'no-repeat';
        thumbs.forEach((thumb, j) => thumb.classList.toggle('active', j === idx));
    }

    function schedule() {
        if (timer) clearInterval(timer);
        timer = setInterval(() => apply(idx + 1), INTERVAL_MS);
    }

    thumbs.forEach((thumb, i) => {
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('mouseenter', () => {
            apply(i);
            schedule();
        });
        thumb.addEventListener('click', () => {
            apply(i);
            schedule();
        });
    });

    apply(0);
    schedule();
}

// =============================================================================
// ====================== [ MixCamp Touch ] =====================================
// =============================================================================

(function (global) {
    'use strict';

    var SWIPE_ATTR = 'data-mixcamp-swipe';

    function attachHorizontalSwipe(target, options) {
        if (!target || !options) return;
        if (target.getAttribute(SWIPE_ATTR) === '1') return;
        target.setAttribute(SWIPE_ATTR, '1');

        var threshold = typeof options.threshold === 'number' ? options.threshold : 48;
        var onSwipePrev = options.onSwipePrev;
        var onSwipeNext = options.onSwipeNext;

        var startX = 0;
        var startY = 0;
        var tracking = false;

        function onStart(e) {
            if (!e.touches || e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            tracking = true;
        }

        function onMove(e) {
            if (!tracking || !e.touches || e.touches.length !== 1) return;
            var dx = Math.abs(e.touches[0].clientX - startX);
            var dy = Math.abs(e.touches[0].clientY - startY);
            if (dy > dx && dy > 24) tracking = false;
        }

        function onEnd(e) {
            if (!tracking) return;
            tracking = false;
            if (!e.changedTouches || e.changedTouches.length < 1) return;
            var endX = e.changedTouches[0].clientX;
            var dx = endX - startX;
            if (Math.abs(dx) < threshold) return;
            if (dx < 0) {
                if (onSwipeNext) onSwipeNext();
            } else {
                if (onSwipePrev) onSwipePrev();
            }
        }

        target.addEventListener('touchstart', onStart, { passive: true });
        target.addEventListener('touchmove', onMove, { passive: true });
        target.addEventListener('touchend', onEnd, { passive: true });
    }

    function enhanceScrollContainers() {
        var sel = ['.eventos-carousel', '.picksbans-carousel', '.banner-carousel', '.teams-carousel'].join(',');
        var nodes = document.querySelectorAll(sel);
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (el.getAttribute('data-mixcamp-scroll-touch') === '1') continue;
            el.setAttribute('data-mixcamp-scroll-touch', '1');
            el.style.webkitOverflowScrolling = 'touch';
            if (!el.style.touchAction) el.style.touchAction = 'pan-x';
        }
    }

    function bootTouch() {
        enhanceScrollContainers();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootTouch);
    } else {
        bootTouch();
    }

    global.MixCampTouch = {
        attachHorizontalSwipe: attachHorizontalSwipe,
        enhanceScrollContainers: enhanceScrollContainers
    };
})(typeof window !== 'undefined' ? window : this);

// =============================================================================
// ====================== [ Inicialização comum + index ] =======================
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
    verificar_auth();

    if (document.body.classList.contains('index-page')) {
        initHomeDestaqueCarousel();
        initOrganizadorBannerSlider();
    }
});
