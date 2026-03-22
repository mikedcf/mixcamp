/**
 * Home (index): "Partidas em destaque" — mesma API e mesmo card que matchs.html
 * Depende de API_URL (utils.js) e dos estilos matchs.css + resultado.css na index.
 */
(function () {
    "use strict";

    const MAX_PARTIDAS_HOME = 6;

    let imagensMapas = {};

    function mapearStatus(faceitStatus) {
        const statusMap = {
            FINISHED: "finished",
            ONGOING: "live",
            CANCELLED: "canceled",
            CANCELED: "canceled"
        };
        return statusMap[faceitStatus] || "upcoming";
    }

    function normalizarNomeMapa(faceitMapa) {
        if (!faceitMapa) return "";
        return faceitMapa.replace(/^de_/, "").toLowerCase();
    }

    function formatarNomeMapa(mapa) {
        if (!mapa) return "";
        return mapa.charAt(0).toUpperCase() + mapa.slice(1);
    }

    async function carregarImagensMapas() {
        try {
            const response = await fetch(`${API_URL}/imgmap`);
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                imagensMapas = data[0];
            } else if (data && typeof data === "object" && !Array.isArray(data)) {
                imagensMapas = data;
            } else {
                imagensMapas = {};
            }
        } catch (e) {
            console.error("[home-matchs] imgmap:", e);
            imagensMapas = {};
        }
    }

    async function buscarEventos() {
        const dadosEventos = [];
        try {
            const response = await fetch(`${API_URL}/inscricoes/campeonato`);
            const data = await response.json();
            const statusPermitidos = ["andamento", "encerrado", "cancelado"];
            const inscricoes = data.inscricoes || [];
            for (const evento of inscricoes) {
                const status = (evento.status || "").toLowerCase();
                if (!statusPermitidos.includes(status)) continue;
                const link = evento.link_hub || "";
                const parts = link.split("/");
                const queue_id = parts[7];
                if (!queue_id) continue;
                dadosEventos.push({
                    id: evento.id,
                    titulo: evento.titulo,
                    queue_id: queue_id,
                    status: evento.status
                });
            }
            return dadosEventos;
        } catch (e) {
            console.error("[home-matchs] eventos:", e);
            return [];
        }
    }

    function criarCardPartida(match) {
        const teams = match.teams || {};
        const team1 = teams.faction1 || {};
        const team2 = teams.faction2 || {};
        const results = match.results || {};
        const score = results.score || {};
        const status = mapearStatus(match.status);
        const mapasPick = match.voting?.map?.pick || [];
        const mapasFormatados = mapasPick.map((m) => formatarNomeMapa(normalizarNomeMapa(m)));
        const mapasNormalizados = mapasPick.map((m) => normalizarNomeMapa(m));
        const bestOf = match.best_of || 1;
        const formato = `MD${bestOf}`;
        const score1 = score.faction1 || 0;
        const score2 = score.faction2 || 0;
        const temScore = status === "finished" || status === "live";
        const winner = results.winner;
        const team1Winner = winner === "faction1";
        const team2Winner = winner === "faction2";

        const card = document.createElement("article");
        card.className = "match-card";
        const matchId = match.match_id || "";
        card.setAttribute("data-match-id", matchId);
        card.setAttribute("data-status", status);

        let scoreHTML = "";
        if (temScore) {
            scoreHTML = `
            <div class="match-score-summary ${status === "live" ? "live-score" : "finished-score"}">
                <span class="score-number ${team1Winner ? "winner" : ""}">${score1}</span>
                <span class="vs-text">VS</span>
                <span class="score-number ${team2Winner ? "winner" : ""}">${score2}</span>
                <span class="match-status-badge ${status}">
                    <i class="fas ${status === "live" ? "fa-broadcast-tower" : status === "finished" ? "fa-flag-checkered" : status === "canceled" ? "fa-ban" : "fa-clock"}"></i>
                    ${status === "live" ? "Ao vivo" : status === "finished" ? "Finalizada" : status === "canceled" ? "Cancelada" : "Vai começar"}
                </span>
            </div>`;
        } else {
            scoreHTML = `
            <div class="match-score-summary">
                <span class="match-status-badge ${status}">
                    <i class="fas ${status === "canceled" ? "fa-ban" : "fa-clock"}"></i>
                    ${status === "canceled" ? "Cancelada" : "Vai começar"}
                </span>
            </div>`;
        }

        let mapasHTML = "";
        if (mapasNormalizados.length > 0) {
            if (mapasNormalizados.length === 1) {
                mapasHTML = `
                <div class="match-map">
                    <div class="match-map-thumb" data-mapa="${mapasNormalizados[0]}"></div>
                    <div class="match-map-info">
                        <span class="label">Mapa${status === "live" ? " atual" : ""}</span>
                        <span class="value">${mapasFormatados[0]}</span>
                    </div>
                </div>`;
            } else {
                const thumbsHTML = mapasNormalizados
                    .map((m) => `<div class="match-map-thumb" data-mapa="${m}"></div>`)
                    .join("");
                mapasHTML = `
                <div class="match-map">
                    <div class="match-map-multi">${thumbsHTML}</div>
                    <div class="match-map-info">
                        <span class="label">Mapas (${formato})</span>
                        <span class="value">${mapasFormatados.join(" • ")}</span>
                    </div>
                </div>`;
            }
        } else {
            mapasHTML = `
            <div class="match-map">
                <div class="match-map-info">
                    <span class="label">Mapa</span>
                    <span class="value">A definir</span>
                </div>
            </div>`;
        }

        const resultadoUrl = matchId ? `resultado.html?id=${matchId}` : "resultado.html";
        const team1Name = team1.name || team1.nickname || "Time 1";
        const team2Name = team2.name || team2.nickname || "Time 2";
        const team1Avatar = team1.avatar || team1.logo || "../img/legalize.png";
        const team2Avatar = team2.avatar || team2.logo || "../img/legalize.png";

        card.innerHTML = `
        <div class="match-card-bg-maps"></div>
        <div class="match-card-main" onclick="window.location.href='${resultadoUrl}'">
            <div class="match-teams">
                <div class="team">
                    <img src="${team1Avatar}" alt="${team1Name}" class="team-avatar" onerror="this.src='../img/legalize.png'">
                    <span class="team-name">${team1Name}</span>
                </div>
                ${scoreHTML}
                <div class="team">
                    <span class="team-name">${team2Name}</span>
                    <img src="${team2Avatar}" alt="${team2Name}" class="team-avatar" onerror="this.src='../img/legalize.png'">
                </div>
            </div>
            <div class="match-extra">
                ${mapasHTML}
                <div class="match-format">
                    <span class="label">Formato</span>
                    <span class="value">${formato}</span>
                </div>
            </div>
        </div>
        <button class="match-details-btn" onclick="event.stopPropagation(); window.location.href='${resultadoUrl}'">
            <i class="fas fa-eye"></i>
            Detalhes matchs
        </button>`;

        return card;
    }

    function configurarMapasBackground(card, mapas) {
        if (!mapas || mapas.length === 0) return;
        let bgMapsContainer = card.querySelector(".match-card-bg-maps");
        if (!bgMapsContainer) {
            bgMapsContainer = document.createElement("div");
            bgMapsContainer.className = "match-card-bg-maps";
            const cardMain = card.querySelector(".match-card-main");
            if (cardMain) card.insertBefore(bgMapsContainer, cardMain);
            else card.insertBefore(bgMapsContainer, card.firstChild);
        }
        const fallback = "https://cdn-icons-png.flaticon.com/128/5726/5726775.png";
        bgMapsContainer.innerHTML = "";
        card.setAttribute("data-maps-count", mapas.length);
        mapas.forEach((mapa) => {
            if (!mapa) return;
            const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
            const imagemUrl =
                imagensMapas[nomeCampo] ||
                imagensMapas[mapa] ||
                imagensMapas[mapa.toUpperCase()] ||
                fallback;
            const bgMap = document.createElement("div");
            bgMap.className = "match-card-bg-map";
            bgMap.style.backgroundImage = `url('${imagemUrl}')`;
            bgMapsContainer.appendChild(bgMap);
        });
    }

    function aplicarImagensMapasNoTrack(root) {
        const fallback = "https://cdn-icons-png.flaticon.com/128/5726/5726775.png";
        root.querySelectorAll(".match-map-thumb").forEach((thumb) => {
            const mapa = (thumb.getAttribute("data-mapa") || "").toLowerCase();
            if (!mapa) {
                thumb.style.backgroundImage = `url('${fallback}')`;
                return;
            }
            const nomeCampo = mapa.charAt(0).toUpperCase() + mapa.slice(1);
            const imagemUrl =
                imagensMapas[nomeCampo] ||
                imagensMapas[mapa] ||
                imagensMapas[mapa.toUpperCase()] ||
                fallback;
            thumb.style.backgroundImage = `url('${imagemUrl}')`;
        });
        root.querySelectorAll(".match-card").forEach((card) => {
            const thumbs = card.querySelectorAll(".match-map-thumb");
            if (thumbs.length > 0) {
                const mapas = Array.from(thumbs).map((t) => (t.getAttribute("data-mapa") || "").toLowerCase());
                configurarMapasBackground(card, mapas);
            }
        });
    }

    function setupHomeMatchsCarousel(viewport, track, prevBtn, nextBtn, dotsEl) {
        const slides = () => Array.from(track.querySelectorAll(".home-matchs-slide"));
        let index = 0;
        let resizeTimer = null;

        function slideWidth() {
            return viewport.offsetWidth || 1;
        }

        function layout() {
            const w = slideWidth();
            const list = slides();
            list.forEach((s) => {
                s.style.flex = `0 0 ${w}px`;
                s.style.width = `${w}px`;
                s.style.minWidth = `${w}px`;
            });
            track.style.transform = `translateX(-${index * w}px)`;
            const prev = prevBtn;
            const next = nextBtn;
            if (prev && next) {
                const n = list.length;
                prev.disabled = n <= 1 || index <= 0;
                next.disabled = n <= 1 || index >= n - 1;
                prev.style.visibility = n <= 1 ? "hidden" : "";
                next.style.visibility = n <= 1 ? "hidden" : "";
            }
            if (dotsEl) {
                dotsEl.style.display = list.length <= 1 ? "none" : "";
                dotsEl.querySelectorAll(".home-matchs-dot").forEach((dot, i) => {
                    dot.classList.toggle("active", i === index);
                    dot.setAttribute("aria-selected", i === index ? "true" : "false");
                });
            }
        }

        function goTo(i) {
            const list = slides();
            if (list.length === 0) return;
            index = Math.max(0, Math.min(i, list.length - 1));
            const w = slideWidth();
            track.style.transform = `translateX(-${index * w}px)`;
            layout();
        }

        function next() {
            goTo(index + 1);
        }
        function prev() {
            goTo(index - 1);
        }

        if (prevBtn) prevBtn.addEventListener("click", () => prev());
        if (nextBtn) nextBtn.addEventListener("click", () => next());

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => layout(), 120);
        });

        return { goTo, layout, next, prev };
    }

    async function carregarPartidasHome(queueId) {
        const response = await fetch(`${API_URL}/faceit/hub/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queue_id: queueId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /** Garante que o spinner some mesmo se o CSS tiver display:flex no bloco. */
    function hideHomeMatchsLoading(loading) {
        if (!loading) return;
        loading.hidden = true;
        loading.style.display = "none";
        loading.setAttribute("aria-hidden", "true");
    }

    function showEmptyMessage(html) {
        const loading = document.getElementById("homeMatchsLoading");
        const carousel = document.getElementById("homeMatchsCarousel");
        const emptyWrap = document.getElementById("homeMatchsEmpty");
        hideHomeMatchsLoading(loading);
        if (carousel) carousel.hidden = true;
        if (emptyWrap) {
            emptyWrap.hidden = false;
            emptyWrap.innerHTML = `<p class="home-matchs-empty">${html}</p>`;
        }
    }

    async function initHomeMatchs() {
        const track = document.getElementById("homeMatchsTrack");
        const viewport = document.getElementById("homeMatchsViewport");
        const carousel = document.getElementById("homeMatchsCarousel");
        const loading = document.getElementById("homeMatchsLoading");
        const emptyWrap = document.getElementById("homeMatchsEmpty");
        const prevBtn = document.getElementById("homeMatchsPrev");
        const nextBtn = document.getElementById("homeMatchsNext");
        const dotsEl = document.getElementById("homeMatchsDots");

        if (!track || !viewport) {
            hideHomeMatchsLoading(loading);
            return;
        }

        try {
            await carregarImagensMapas();
            const eventos = await buscarEventos();
            if (!eventos.length) {
                showEmptyMessage(
                    'Nenhum campeonato disponível no momento. <a href="campeonato.html">Ver campeonatos</a>'
                );
                return;
            }

            const queueId = eventos[0].queue_id;
            const data = await carregarPartidasHome(queueId);
            hideHomeMatchsLoading(loading);

            track.innerHTML = "";
            if (emptyWrap) {
                emptyWrap.hidden = true;
                emptyWrap.innerHTML = "";
            }

            const matches = (data.matches && Array.isArray(data.matches) ? data.matches : []).slice(
                0,
                MAX_PARTIDAS_HOME
            );

            if (matches.length === 0) {
                showEmptyMessage(
                    'Nenhuma partida encontrada para o campeonato em destaque. <a href="matchs.html">Ver Matchs</a>'
                );
                return;
            }

            if (carousel) carousel.hidden = false;

            matches.forEach((match) => {
                const slide = document.createElement("div");
                slide.className = "home-matchs-slide";
                slide.setAttribute("role", "group");
                const card = criarCardPartida(match);
                if (card) {
                    slide.appendChild(card);
                    track.appendChild(slide);
                }
            });

            const ctrl = setupHomeMatchsCarousel(viewport, track, prevBtn, nextBtn, dotsEl);

            if (dotsEl) {
                dotsEl.innerHTML = "";
                matches.forEach((_, i) => {
                    const dot = document.createElement("button");
                    dot.type = "button";
                    dot.className = "home-matchs-dot";
                    dot.setAttribute("role", "tab");
                    dot.setAttribute("aria-label", `Partida ${i + 1}`);
                    dot.addEventListener("click", () => ctrl.goTo(i));
                    dotsEl.appendChild(dot);
                });
            }

            ctrl.layout();

            setTimeout(() => {
                aplicarImagensMapasNoTrack(track);
                ctrl.layout();
            }, 50);
        } catch (e) {
            console.error("[home-matchs]", e);
            showEmptyMessage(
                'Não foi possível carregar as partidas. <a href="matchs.html">Abrir Matchs</a>'
            );
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomeMatchs);
    } else {
        initHomeMatchs();
    }
})();
