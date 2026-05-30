// ===============================================================================================
// ==================================== [IMPORTS] =============================================

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { 
    getPerfil, updateConfig, register, login, getMedalhas, criarMedalhas, addMedalhasuser, getMedalhasUsuario, deletarMedalhas, atualizarMedalhas, listarTodasMedalhas, autenticar, 
    getTimeById, getTimeByUser, deletarTime, transferirLideranca, listarMembrosParaLideranca, criarTime, atualizarTime, atualizarPosicaoMembro, removerMembro,
    solicitarEntradaTime, aceitarSolicitacao, rejeitarSolicitacao, verificarStatusSolicitacao,getTransferencias,criarTransferencia,deletarTransferencia,
    getSolicitacaoById, listarTodasSolicitacoes,buscarTimes,buscarUsuarios, listarSolicitacoesPorTime, aceitarSolicitacaoPorId, rejeitarSolicitacaoPorId,MembroSair,deletarSolicitacao,atualizarTransferencia, listarTimes, getplayers, buscarDadosFaceitPlayer, locationMatchesIds, infoMatchId, buscarInfoMatchId, uploadImagemCloudinary, criarTrofeus, createImgPosition, updateImgPosition, buscarImgPosition,
    listarTodosUsuarios, getEstatisticasUsuarios, atualizarGerenciaUsuario, getNoticiasDestaques, criarNoticiaDestaque, atualizarNoticiaDestaque, deletarNoticiaDestaque, getNoticiasSite, criarNoticiaSite, atualizarNoticiaSite, deletarNoticiaSite, getNoticiasCampeonato, criarNoticiaCampeonato, atualizarNoticiaCampeonato, deletarNoticiaCampeonato,     getInscricoesCampeonato, getInscricoesTimes, criarInscricaoCampeonato, criarInscricaoTimes, atualizarInscricaoCampeonato, atualizarInscricaoTimes, deletarInscricaoCampeonato, deletarInscricaoTimes, CreatePreference,
    webhookMercadoPago, verificarStatusPagamento, retornoPagamentoSuccess, retornoPagamentoFailure, retornoPagamentoPending, addTrofeuTime, getTrofeus, getTrofeusTime, deletarTrofeus, atualizarTrofeus,
    criarChaveamento, getChaveamento, salvarResultadoPartida, inicializarPartidasChaveamento, resetarChaveamento, buscarImgMap, createImgMap, updateImgMap,
    criarSessaoVetos, buscarSessaoVetosPorToken, salvarAcaoVeto, salvarEscolhaLado, iniciarSessaoVetos, registrarCliqueRoleta, getHistoricoMembros, criarHistoricoMembros, atualizarHistoricoMembros,steamIdFromUrl,buscarInfoMatchIdStatus, buscarInfoMatchIdStats,buscarTimeGame, statuscs,buscarStatusplayer,enviarCodigoEmail,verificarCodigoEmail,setupDatabase, autenticacao, logout,getNotificacoes, criarMsgNotificacao, enviarNotificacaoTodos, atualizarNotificacao, deletarNotificacao,getpromoverbanner, criarPromoverBanner, atualizarPromoverBanner, deletarPromoverBanner,CreatePreferencePromocao, getcupom, criarcupom, atualizarcupom, deletarcupom, getcupomresgatado, criarcupomresgatado, atualizarcupomresgatado, deletarcupomresgatado, getDivulgarLinksPicksbans, criarDivulgarLinksPicksbans, atualizarDivulgarLinksPicksbans, deletarDivulgarLinksPicksbans,     getRankingPlayers, criarRankingPlayers, atualizarRankingPlayers, deletarRankingPlayers, getHistoricoMatchsPlayers, criarHistoricoMatchsPlayers, atualizarHistoricoMatchsPlayers, deletarHistoricoMatchsPlayers, getRankingTimes, criarRankingTimes, atualizarRankingTimes, deletarRankingTimes, getHistoricoMatchsTimes, criarHistoricoMatchsTimes, atualizarHistoricoMatchsTimes, deletarHistoricoMatchsTimes, OrdenarArrayRankingPlayers, OrdenarArrayRankingTimes,getDiscordUserId,getDiscordTimesAll,DadosGeraisUser,validarApiKey,criarMarcacaoJogo, atualizarMarcacaoJogo, deletarMarcacaoJogo, getMarcacoesJogos, getSeasonDoscampeonatos
} = require('./controller');
const {
    requireAuth,
    requireGerencia,
    requireOrganizador,
    validarApiKeyDiscord
} = require('./middlewares/security');
const {
    helmetMiddleware,
    generalRateLimiter,
    authRateLimiter,
    emailRateLimiter,
    validateCsrf,
    verifyMercadoPagoWebhook,
    getSessionConfig,
    getCsrfTokenHandler,
    isProduction,
    shouldTrustProxy
} = require('./middlewares/hardening');
const { auditMiddleware } = require('./middlewares/auditLog');
const { mountFrontend } = require('./middlewares/frontendSecurity');
const { createSessionStore } = require('./sessionStore');
const { ensureSecurityTables } = require('./setupSecurityTables');
const { logAuthDebug, logAuthDebugStartup } = require('./middlewares/authDebug');
require('dotenv').config();

const adminOnly = [requireAuth, requireGerencia('admin')];
const staffOnly = [requireAuth, requireGerencia('admin', 'moderador')];
const authRequired = [requireAuth];
const organizadorOnly = [requireAuth, requireOrganizador];

 
const app = express();

if (shouldTrustProxy()) {
    app.set('trust proxy', 1);
}

// CORS antes do rate limit: respostas 429/erro precisam dos headers ou o navegador mostra "CORS blocked"
app.use(cors({
    origin: process.env.CORS_DOMAIN,
    credentials: true
}));

app.use(helmetMiddleware);
app.use(express.json({ limit: '2mb' }));
app.use('/api', generalRateLimiter);

const sessionOptions = getSessionConfig();
const mysqlSessionStore = createSessionStore();
if (mysqlSessionStore) {
    sessionOptions.store = mysqlSessionStore;
    console.log('🔐 Sessões persistidas em MySQL (SESSION_STORE=mysql)');
}
app.use(session(sessionOptions));
app.use(auditMiddleware);
app.use(validateCsrf);

logAuthDebugStartup();

if (process.env.DEBUG_AUTH === 'true' || process.env.DEBUG_AUTH === '1') {
    const authDebugPaths = ['/api/v1/dashboard', '/api/v1/notificacoes', '/api/v1/login'];
    app.use((req, res, next) => {
        if (!authDebugPaths.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
            return next();
        }
        const started = Date.now();
        res.on('finish', () => {
            logAuthDebug('http_resposta', req, {
                httpStatus: res.statusCode,
                durationMs: Date.now() - started
            });
        });
        next();
    });
}


// Configuração do multer para upload de arquivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB para vídeos
    },
    fileFilter: (req, file, cb) => {
        const permitido =
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/octet-stream';
        if (permitido) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem, vídeo, PDF ou CFG são permitidos!'), false);
        }
    }
});




// ===============================================================================================
// ==================================== [API PERFIL] =============================================

ensureSecurityTables()
    .then(() => console.log('✅ Tabelas Fase 3 (sessions, security_audit_log) prontas'))
    .catch((err) => console.error('❌ Tabelas Fase 3:', err.message));

setupDatabase();

// ===============================================================================================
// ==================================== [API MERCADOPAGO] =============================================
// --- POST
app.post(process.env.ROUTE_CREATE_PREFERENCE, ...authRequired, CreatePreference)
// Pagamento para promoção de campeonatos (planos básico/premium/máximo)
app.post(process.env.ROUTE_PROMOVER_CREATE_PREFERENCE, ...authRequired, CreatePreferencePromocao)

// --- WEBHOOK - Recebe notificações do Mercado Pago
app.post(process.env.ROUTE_MERCADOPAGO_WEBHOOK, verifyMercadoPagoWebhook, webhookMercadoPago)

// --- GET - Verificar status do pagamento
app.get(process.env.ROUTE_MERCADOPAGO_STATUS, verificarStatusPagamento)

// --- GET - Rotas de retorno do pagamento
app.get(process.env.ROUTE_MERCADOPAGO_SUCCESS, retornoPagamentoSuccess)
app.get(process.env.ROUTE_MERCADOPAGO_FAILURE, retornoPagamentoFailure)
app.get(process.env.ROUTE_MERCADOPAGO_PENDING, retornoPagamentoPending) 


// ===============================================================================================
// ==================================== [API DA FACEIT] ================================================
app.post(process.env.ROUTE_FACEIT_PLAYER, buscarDadosFaceitPlayer);
app.post(process.env.ROUTE_FACEIT_HUB_MATCHES, locationMatchesIds);
app.post(process.env.ROUTE_FACEIT_MATCH_INFO, buscarInfoMatchId);
app.post(process.env.ROUTE_FACEIT_MATCH_INFO_STATUS, buscarInfoMatchIdStatus);
app.post(process.env.ROUTE_FACEIT_MATCH_INFO_STATS, buscarInfoMatchIdStats);

app.post(process.env.ROUTE_FACEIT_PLAYER_STATUS, buscarStatusplayer);

// ===============================================================================================
// ==================================== [API DA STEAM] ================================================
app.post(process.env.ROUTE_STEAM_TIMEGAME, buscarTimeGame);
app.post(process.env.ROUTE_STEAM_ID, steamIdFromUrl);
app.post(process.env.ROUTE_STEAM_STATUS , statuscs);



// ===============================================================================================
// ==================================== [API DA CLOUDINARY] ================================================
app.post(process.env.ROUTE_CLOUDINARY_UPLOAD, ...authRequired, upload.single('file'), uploadImagemCloudinary);


// ===============================================================================================
// ==================================== [API DA position] ================================================
app.get(process.env.ROUTE_POSITION_IMG, buscarImgPosition );
app.post(process.env.ROUTE_POSITION_IMG_CREATE, ...adminOnly, createImgPosition);
app.put(process.env.ROUTE_POSITION_IMG_UPDATE, ...adminOnly, updateImgPosition);

// ===============================================================================================
// ==================================== [API DA IMG MAP] ================================================
app.get(process.env.ROUTE_IMG_MAP, buscarImgMap );
app.post(process.env.ROUTE_IMG_MAP_CREATE, ...adminOnly, createImgMap);
app.put(process.env.ROUTE_IMG_MAP_UPDATE, ...adminOnly, updateImgMap);

// ===============================================================================================
// ==================================== [API VETOS] ================================================
app.post(process.env.ROUTE_VETOS_SESSAO, ...organizadorOnly, criarSessaoVetos);
app.get(process.env.ROUTE_VETOS_SESSAO_TOKEN, buscarSessaoVetosPorToken);
app.post(process.env.ROUTE_VETOS_ACAO, salvarAcaoVeto);
app.post(process.env.ROUTE_VETOS_ESCOLHER_LADO, salvarEscolhaLado);
app.post(process.env.ROUTE_VETOS_INICIAR, iniciarSessaoVetos);
app.post(process.env.ROUTE_VETOS_ROLETA_CLIQUE, registrarCliqueRoleta);


// ===============================================================================================
// ==================================== [API EMAIL] ================================================

app.post(process.env.ROUTE_EMAIL_CODIGO, emailRateLimiter, enviarCodigoEmail);
app.post(process.env.ROUTE_EMAIL_VERYCODE, emailRateLimiter, verificarCodigoEmail);



// ===============================================================================================
// ==================================== [API MERCADOPAGO] =============================================
app.get(process.env.ROUTE_NOTIFICACOES, ...authRequired, getNotificacoes);
app.post(process.env.ROUTE_NOTIFICACOES_CRIAR, ...authRequired, criarMsgNotificacao);
app.post(process.env.ROUTE_NOTIFICACOES_ENVIAR_TODOS, ...adminOnly, enviarNotificacaoTodos);
app.put(process.env.ROUTE_NOTIFICACOES_ATUALIZAR, ...authRequired, atualizarNotificacao);
app.delete(process.env.ROUTE_NOTIFICACOES_DELETAR, ...staffOnly, deletarNotificacao);

// ===============================================================================================
// ==================================== [API DE BUSCA] ================================================

// ----- BUSCA GET
app.get(process.env.ROUTE_TIMES_SEARCH, buscarTimes);
app.get(process.env.ROUTE_USUARIOS_SEARCH, buscarUsuarios);

// ==================================== [API USUÁRIOS ADMIN] ================================================
// ----- USUÁRIOS ADMIN GET
app.get(process.env.ROUTE_ADMIN_USUARIOS, ...staffOnly, listarTodosUsuarios);
app.get(process.env.ROUTE_ADMIN_USUARIOS_ESTATISTICAS, ...staffOnly, getEstatisticasUsuarios);


// ----- BUSCA POST


// ----- BUSCA DELETE


// ----- BUSCA UPDATE
app.put(process.env.ROUTE_ADMIN_USUARIOS_GERENCIA, ...adminOnly, atualizarGerenciaUsuario);

// ===============================================================================================
// ==================================== [API PERFIL] =============================================

// ----- PERFIL GET
app.get(process.env.ROUTE_PERFIL_ID, getPerfil);
app.get(process.env.ROUTE_USERS_PERFILS,getplayers);


app.get(process.env.ROUTE_DASHBOARD, autenticacao);

app.get(process.env.ROUTE_CSRF || '/api/v1/csrf', ...authRequired, getCsrfTokenHandler);

app.get(process.env.ROUTE_LOGOUT, ...authRequired, logout);


// ----------- PERFIL POST
app.post(process.env.ROUTE_REGISTER, authRateLimiter, register);

app.post(process.env.ROUTE_LOGIN, authRateLimiter, login);

app.post(process.env.ROUTE_CONFIGURACOES_ID, ...authRequired, updateConfig);

// ----------- PERFIL DELETE

// ==============================================================================================
// ==================================== [API TEAMS] =============================================

// ----- TEAMS GET
app.get(process.env.ROUTE_TIMES_LIST, listarTimes);
app.get(process.env.ROUTE_TIMES_ID, getTimeById);
app.get(process.env.ROUTE_TIMES_BY_USER, getTimeByUser);
app.get(process.env.ROUTE_TIMES_MEMBROS_LIDERANCA, ...authRequired, listarMembrosParaLideranca);
app.get(process.env.ROUTE_TIMES_SOLICITACOES, ...authRequired, listarSolicitacoesPorTime);

// ----- TEAMS POST

app.post(process.env.ROUTE_TIMES_CRIAR, ...authRequired, criarTime);

// ----- TEAMS DELETE
app.delete(process.env.ROUTE_TIMES_ID, ...authRequired, deletarTime);


// ----- TEAMS UPDATE
app.put(process.env.ROUTE_TIMES_TRANSFERIR_LIDERANCA, ...authRequired, transferirLideranca);
app.put(process.env.ROUTE_UPDATE_TIMES_ID, ...authRequired, atualizarTime);
app.put(process.env.ROUTE_TIMES_MEMBROS_POSICAO, ...authRequired, atualizarPosicaoMembro);

// ----- TEAMS DELETE
app.delete(process.env.ROUTE_TIMES_DELETE_MEMBRO, ...authRequired, removerMembro);
app.delete(process.env.ROUTE_TIMES_DEL_MEMBROS_SAIR, ...authRequired, MembroSair);

// ===============================================================================================
// ==================================== [API SOLICITAÇÕES TIME] =============================================

// ----- SOLICITAÇÕES GET
app.get(process.env.ROUTE_SOLICITACOES_ID, getSolicitacaoById);

app.get(process.env.ROUTE_SOLICITACOES, ...staffOnly, listarTodasSolicitacoes); 

app.get(process.env.ROUTE_TIMES_SOLICITACAO_STATUS, verificarStatusSolicitacao);

// ----- SOLICITAÇÕES POST
app.post(process.env.ROUTE_TIMES_SOLICITAR_ENTRADA, ...authRequired, solicitarEntradaTime);

// ----- SOLICITAÇÕES PUT
app.put(process.env.ROUTE_SOLICITACOES_ACEITAR, ...authRequired, aceitarSolicitacao);

app.put(process.env.ROUTE_SOLICITACOES_REJEITAR, ...authRequired, rejeitarSolicitacao);

// Novas rotas por ID usadas no frontend
app.put(process.env.ROUTE_SOLICITACOES_ID_ACEITAR, ...authRequired, aceitarSolicitacaoPorId);
app.put(process.env.ROUTE_SOLICITACOES_ID_REJEITAR, ...authRequired, rejeitarSolicitacaoPorId);

// ----- SOLICITAÇÕES DELETE
app.delete(process.env.ROUTE_DEL_SOLICITACOES, ...authRequired, deletarSolicitacao);

// ===============================================================================================
// ==================================== [API MEDALHAS] =============================================

// ----- MEDALHAS GET
if (process.env.ROUTE_MEDALHAS_ID) {
    app.get(process.env.ROUTE_MEDALHAS_ID, getMedalhas);
}
// Admin: listar todas as medalhas
if (process.env.ROUTE_MEDALHAS_LISTAR_TODAS) {
    app.get(process.env.ROUTE_MEDALHAS_LISTAR_TODAS, ...staffOnly, listarTodasMedalhas);
}

if (process.env.ROUTE_MEDALHAS_USUARIO_ID) {
    app.get(process.env.ROUTE_MEDALHAS_USUARIO_ID, getMedalhasUsuario);
}

// ----- MEDALHAS POST
if (process.env.ROUTE_MEDALHAS_CRIAR) {
    app.post(process.env.ROUTE_MEDALHAS_CRIAR, ...staffOnly, criarMedalhas);
}

if (process.env.ROUTE_MEDALHAS_ADICIONAR) {
    app.post(process.env.ROUTE_MEDALHAS_ADICIONAR, ...organizadorOnly, addMedalhasuser);
}

// ----- MEDALHAS DELETE
if (process.env.ROUTE_MEDALHAS_DELETAR_ID) {
    app.delete(process.env.ROUTE_MEDALHAS_DELETAR_ID, ...staffOnly, deletarMedalhas);
}

// ----- MEDALHAS UPDATE
if (process.env.ROUTE_MEDALHAS_ATUALIZAR_DADOS_ID) {
    app.put(process.env.ROUTE_MEDALHAS_ATUALIZAR_DADOS_ID, ...staffOnly, atualizarMedalhas);
}


// ===============================================================================================
// ==================================== [API TROFEUS] ================================================

// ----- TROFEUS GET
app.get(process.env.ROUTE_TROFEUS, getTrofeus)
app.get(process.env.ROUTE_TROFEUS_TIME_ID, getTrofeusTime)


// ----- TROFEUS POST
app.post(process.env.ROUTE_TROFEUS_CRIAR, ...staffOnly, criarTrofeus)

app.post(process.env.ROUTE_TROFEUS_TIME, ...organizadorOnly, addTrofeuTime)

// ----- TROFEUS DELETE
app.delete(process.env.ROUTE_TROFEUS_DELETAR_ID, ...staffOnly, deletarTrofeus)


// ----- TROFEUS UPDATE
app.put(process.env.ROUTE_TROFEUS_ATUALIZAR_ID, ...staffOnly, atualizarTrofeus)

// ===============================================================================================
// ==================================== [API TRANSFERENCIA DE TIMES] ================================================

// ----- TIMES GET
app.get(process.env.ROUTE_TRANSFERENCIAS, getTransferencias);


// ----- TIMES POST
app.post(process.env.ROUTE_TRANSFERENCIAS, ...authRequired, criarTransferencia);


// ----- TIMES DELETE
app.delete(process.env.ROUTE_TRANSFERENCIAS_ID, ...staffOnly, deletarTransferencia);

// ----- TIMES UPDATE
app.put(process.env.ROUTE_TRANSFERENCIAS, ...staffOnly, atualizarTransferencia);


// ===============================================================================================
// ==================================== [API NOTICIAS] ================================================

// ----- NOTICIAS GET
app.get(process.env.ROUTE_NOTICIAS_DESTAQUES, getNoticiasDestaques);

app.get(process.env.ROUTE_NOTICIAS_SITE, getNoticiasSite);

app.get(process.env.ROUTE_NOTICIAS_CAMPEONATO, getNoticiasCampeonato);

// ----- NOTICIAS POST
app.post(process.env.ROUTE_NOTICIAS_DESTAQUES_CRIAR, ...staffOnly, criarNoticiaDestaque);

app.post(process.env.ROUTE_NOTICIAS_SITE_CRIAR, ...staffOnly, criarNoticiaSite);

app.post(process.env.ROUTE_NOTICIAS_CAMPEONATO_CRIAR, ...staffOnly, criarNoticiaCampeonato);
// ----- NOTICIAS UPDATE
app.put(process.env.ROUTE_NOTICIAS_DESTAQUES_ATUALIZAR, ...staffOnly, atualizarNoticiaDestaque);

app.put(process.env.ROUTE_NOTICIAS_SITE_ATUALIZAR, ...staffOnly, atualizarNoticiaSite);

app.put(process.env.ROUTE_NOTICIAS_CAMPEONATO_ATUALIZAR, ...staffOnly, atualizarNoticiaCampeonato);

// ----- NOTICIAS DELETE
app.delete(process.env.ROUTE_NOTICIAS_DESTAQUES_DELETAR, ...staffOnly, deletarNoticiaDestaque);

app.delete(process.env.ROUTE_NOTICIAS_SITE_DELETAR, ...staffOnly, deletarNoticiaSite);

app.delete(process.env.ROUTE_NOTICIAS_CAMPEONATO_DELETAR, ...staffOnly, deletarNoticiaCampeonato);



// ===============================================================================================
// ==================================== [API INSCRICOES] ================================================

// ----- INSCRICAO GET
app.get(process.env.ROUTE_INSCRICOES_CAMPEONATO, getInscricoesCampeonato);

app.get(process.env.ROUTE_INSCRICOES_TIMES, getInscricoesTimes);

app.get(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS, getHistoricoMembros);

// ----- INSCRICAO POST
app.post(process.env.ROUTE_INSCRICOES_CAMPEONATO, ...organizadorOnly, criarInscricaoCampeonato);

app.post(process.env.ROUTE_INSCRICOES_TIMES, ...authRequired, criarInscricaoTimes);

app.post(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS, ...organizadorOnly, criarHistoricoMembros);

// ----- INSCRICAO UPDATE
app.put(process.env.ROUTE_INSCRICOES_CAMPEONATO_ATUALIZAR, ...organizadorOnly, atualizarInscricaoCampeonato);

app.put(process.env.ROUTE_INSCRICOES_TIMES_ATUALIZAR, ...organizadorOnly, atualizarInscricaoTimes);

app.put(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS_ATUALIZAR, ...organizadorOnly, atualizarHistoricoMembros);

// ----- INSCRICAO DELETE
app.delete(process.env.ROUTE_INSCRICOES_CAMPEONATO, ...organizadorOnly, deletarInscricaoCampeonato);

app.delete(process.env.ROUTE_INSCRICOES_TIMES, ...organizadorOnly, deletarInscricaoTimes);

// ===============================================================================================
// ==================================== [CHAVEAMENTO] ===========================================
// ===============================================================================================

// ----- CHAVEAMENTO POST
app.post(process.env.ROUTE_CHAVEAMENTOS, ...organizadorOnly, criarChaveamento);

// ----- CHAVEAMENTO GET
app.get(process.env.ROUTE_CHAVEAMENTOS_CAMPEONATO_ID, getChaveamento);

// ----- PARTIDA POST (Salvar resultado)
app.post(process.env.ROUTE_CHAVEAMENTOS_PARTIDAS_RESULTADO, ...organizadorOnly, salvarResultadoPartida);

// ----- PARTIDAS POST (Inicializar estrutura)
app.post(process.env.ROUTE_CHAVEAMENTOS_PARTIDAS_INICIALIZAR, ...organizadorOnly, inicializarPartidasChaveamento);

// ----- CHAVEAMENTO POST (Resetar chaveamento)
app.post(process.env.ROUTE_CHAVEAMENTOS_ID_RESETAR, ...organizadorOnly, resetarChaveamento);



// ===============================================================================================
// ==================================== [API RANKING PLAYERS] ================================================

// ----- ORDENAR ARRAY RANKING PLAYERS
app.get(process.env.ROUTE_ORDENAR_ARRAY_RANKING_PLAYERS, OrdenarArrayRankingPlayers);

// ----- RANKING PLAYERS GET
app.get(process.env.ROUTE_RANKING_PLAYERS, getRankingPlayers);

// ----- RANKING PLAYERS POST
app.post(process.env.ROUTE_RANKING_PLAYERS_CRIAR, ...organizadorOnly, criarRankingPlayers);
// ----- RANKING PLAYERS UPDATE
app.put(process.env.ROUTE_RANKING_PLAYERS_ATUALIZAR, ...organizadorOnly, atualizarRankingPlayers);
// ----- RANKING PLAYERS DELETE
app.delete(process.env.ROUTE_RANKING_PLAYERS_DELETAR, ...staffOnly, deletarRankingPlayers);


// ------- [API HISTORICO DE MATCHS PLAYERS] 

// ----- HISTORICO DE MATCHS PLAYERS GET
app.get(process.env.ROUTE_HISTORICO_MATCHS_PLAYERS, getHistoricoMatchsPlayers);
// ----- HISTORICO DE MATCHS PLAYERS POST
app.post(process.env.ROUTE_HISTORICO_MATCHS_PLAYERS_CRIAR, ...organizadorOnly, criarHistoricoMatchsPlayers);
// ----- HISTORICO DE MATCHS PLAYERS UPDATE
app.put(process.env.ROUTE_HISTORICO_MATCHS_PLAYERS_ATUALIZAR, ...organizadorOnly, atualizarHistoricoMatchsPlayers);
// ----- HISTORICO DE MATCHS PLAYERS DELETE
app.delete(process.env.ROUTE_HISTORICO_MATCHS_PLAYERS_DELETAR, ...staffOnly, deletarHistoricoMatchsPlayers);

// ===============================================================================================
// ==================================== [API RANKING TIMES] ================================================

// ----- ORDENAR ARRAY RANKING TIMES
app.get(process.env.ROUTE_ORDENAR_ARRAY_RANKING_TIMES, OrdenarArrayRankingTimes);
// ----- RANKING TIMES GET
app.get(process.env.ROUTE_RANKING_TIMES, getRankingTimes);
// ----- RANKING TIMES POST
app.post(process.env.ROUTE_RANKING_TIMES_CRIAR, ...organizadorOnly, criarRankingTimes);
// ----- RANKING TIMES UPDATE
app.put(process.env.ROUTE_RANKING_TIMES_ATUALIZAR, ...organizadorOnly, atualizarRankingTimes);
// ----- RANKING TIMES DELETE
app.delete(process.env.ROUTE_RANKING_TIMES_DELETAR, ...staffOnly, deletarRankingTimes);

// ------- [API HISTORICO DE MATCHS TIMES] 

// ----- HISTORICO DE MATCHS TIMES GET
app.get(process.env.ROUTE_HISTORICO_MATCHS_TIMES, getHistoricoMatchsTimes);
// ----- HISTORICO DE MATCHS TIMES POST
app.post(process.env.ROUTE_HISTORICO_MATCHS_TIMES_CRIAR, ...organizadorOnly, criarHistoricoMatchsTimes);
// ----- HISTORICO DE MATCHS TIMES UPDATE
app.put(process.env.ROUTE_HISTORICO_MATCHS_TIMES_ATUALIZAR, ...organizadorOnly, atualizarHistoricoMatchsTimes);
// ----- HISTORICO DE MATCHS TIMES DELETE
app.delete(process.env.ROUTE_HISTORICO_MATCHS_TIMES_DELETAR, ...staffOnly, deletarHistoricoMatchsTimes);

// ===============================================================================================
// ==================================== [API PROMOVER BANNER] ================================================

// ----- PROMOVER BANNER GET
app.get(process.env.ROUTE_PROMOVER_BANNER, getpromoverbanner);

// ----- PROMOVER BANNER POST
app.post(process.env.ROUTE_PROMOVER_BANNER_CRIAR, ...adminOnly, criarPromoverBanner);

// ----- PROMOVER BANNER PUT
app.put(process.env.ROUTE_PROMOVER_BANNER_ATUALIZAR, ...adminOnly, atualizarPromoverBanner);

// ----- PROMOVER BANNER DELETE
app.delete(process.env.ROUTE_PROMOVER_BANNER_DELETAR, ...adminOnly, deletarPromoverBanner);

// ===============================================================================================
// ==================================== [API CUPOM] ================================================

// ----- CUPOM GET
app.get(process.env.ROUTE_CUPOM, ...staffOnly, getcupom);
// ----- CUPOM POST
app.post(process.env.ROUTE_CUPOM_CRIAR, ...adminOnly, criarcupom);
// ----- CUPOM PUT
app.put(process.env.ROUTE_CUPOM_ATUALIZAR, ...adminOnly, atualizarcupom);
// // ----- CUPOM DELETE
app.delete(process.env.ROUTE_CUPOM_DELETAR, ...adminOnly, deletarcupom);

// ------------------------- API CUPOM RESGATADOS

// --- GET CUPOM RESGATADOS
app.get(process.env.ROUTE_CUPOM_RESGATADOS, ...staffOnly, getcupomresgatado);
// --- POST CUPOM RESGATADOS
app.post(process.env.ROUTE_CUPOM_RESGATADOS_CRIAR, ...authRequired, criarcupomresgatado);
// --- PUT CUPOM RESGATADOS
app.put(process.env.ROUTE_CUPOM_RESGATADOS_ATUALIZAR, ...adminOnly, atualizarcupomresgatado);
// --- DELETE CUPOM RESGATADOS
app.delete(process.env.ROUTE_CUPOM_RESGATADOS_DELETAR, ...adminOnly, deletarcupomresgatado);



// ===============================================================================================
// ==================================== [API DIVULGAR LINKS PICKSBANS] ================================================

// ----- DIVULGAR LINKS PICKSBANS GET
app.get(process.env.ROUTE_DIVULGAR_LINKS_PICKSBANS, getDivulgarLinksPicksbans);
// ----- DIVULGAR LINKS PICKSBANS POST
app.post(process.env.ROUTE_DIVULGAR_LINKS_PICKSBANS_CRIAR, ...staffOnly, criarDivulgarLinksPicksbans);
// ----- DIVULGAR LINKS PICKSBANS PUT
app.put(process.env.ROUTE_DIVULGAR_LINKS_PICKSBANS_ATUALIZAR, ...staffOnly, atualizarDivulgarLinksPicksbans);
// ----- DIVULGAR LINKS PICKSBANS DELETE
app.delete(process.env.ROUTE_DIVULGAR_LINKS_PICKSBANS_DELETAR, ...staffOnly, deletarDivulgarLinksPicksbans);


// ===============================================================================================
// ==================================== [API DISCORD] ================================================

// ----- DISCORD GET
app.get(process.env.ROUTE_DISCORD_USER_ID, validarApiKeyDiscord, getDiscordUserId);

// ----- DISCORD TIMES GET
app.get(process.env.ROUTE_DISCORD_TIMES_ALL, validarApiKeyDiscord, getDiscordTimesAll);

// ----- DISCORD DADOS GERAIS USER
app.get(process.env.ROUTE_DISCORD_DADOS_GERAIS_USER, validarApiKeyDiscord, DadosGeraisUser);

app.get(process.env.ROUTE_SEASONS_CAMPEONATOS, validarApiKeyDiscord, getSeasonDoscampeonatos);


app.post(process.env.ROUTE_NOTIFICACOES_CRIAR_DISCORD, validarApiKeyDiscord, criarMsgNotificacao);




// =====================================================
// ==================================== [MARCAÇÕES DE JOGOS] ================================================

// ----- MARCAÇÕES DE JOGOS GET
app.get(process.env.ROUTE_MARCACOES_JOGOS, validarApiKeyDiscord,  getMarcacoesJogos);

// ----- MARCAÇÕES DE JOGOS POST
app.post(process.env.ROUTE_MARCACOES_JOGOS_CRIAR,validarApiKeyDiscord, criarMarcacaoJogo);

// ----- MARCAÇÕES DE JOGOS PUT
app.put(process.env.ROUTE_MARCACOES_JOGOS_ATUALIZAR,validarApiKeyDiscord, atualizarMarcacaoJogo);

// ----- MARCAÇÕES DE JOGOS DELETE
app.delete(process.env.ROUTE_MARCACOES_JOGOS_DELETAR,validarApiKeyDiscord, deletarMarcacaoJogo);

// ===============================================================================================
// ==================================== [FRONTEND ESTÁTICO + CSP] =================================

mountFrontend(app);

// ===============================================================================================
// ==================================== [PORTA DA API] ==========================================


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});