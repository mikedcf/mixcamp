// ===============================================================================================
// ==================================== [IMPORTS] =============================================

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { 
    getPerfil, updateConfig, register, login, getMedalhas, criarMedalhas, addMedalhasuser, getMedalhasUsuario, deletarMedalhas, atualizarMedalhas, autenticar, 
    getTimeById, getTimeByUser, deletarTime, transferirLideranca, listarMembrosParaLideranca, criarTime, atualizarTime, atualizarPosicaoMembro, removerMembro,
    solicitarEntradaTime, aceitarSolicitacao, rejeitarSolicitacao, verificarStatusSolicitacao,getTransferencias,criarTransferencia,deletarTransferencia,
    getSolicitacaoById, listarTodasSolicitacoes,buscarTimes,buscarUsuarios, listarSolicitacoesPorTime, aceitarSolicitacaoPorId, rejeitarSolicitacaoPorId,MembroSair,deletarSolicitacao,atualizarTransferencia, listarTimes, getplayers, buscarDadosFaceitPlayer, locationMatchesIds, infoMatchId, buscarInfoMatchId, uploadImagemCloudinary, criarTrofeus, createImgPosition, updateImgPosition, buscarImgPosition,
    listarTodosUsuarios, getEstatisticasUsuarios, atualizarGerenciaUsuario, getNoticiasDestaques, criarNoticiaDestaque, atualizarNoticiaDestaque, deletarNoticiaDestaque, getNoticiasSite, criarNoticiaSite, atualizarNoticiaSite, deletarNoticiaSite, getNoticiasCampeonato, criarNoticiaCampeonato, atualizarNoticiaCampeonato, deletarNoticiaCampeonato,     getInscricoesCampeonato, getInscricoesTimes, criarInscricaoCampeonato, criarInscricaoTimes, atualizarInscricaoCampeonato, atualizarInscricaoTimes, deletarInscricaoTimes, CreatePreference,
    webhookMercadoPago, verificarStatusPagamento, retornoPagamentoSuccess, retornoPagamentoFailure, retornoPagamentoPending, addTrofeuTime, getTrofeus, getTrofeusTime, deletarTrofeus, atualizarTrofeus,
    criarChaveamento, getChaveamento, salvarResultadoPartida, inicializarPartidasChaveamento, resetarChaveamento, buscarImgMap, createImgMap, updateImgMap,
    criarSessaoVetos, buscarSessaoVetosPorToken, salvarAcaoVeto, salvarEscolhaLado, iniciarSessaoVetos, registrarCliqueRoleta, getHistoricoMembros, criarHistoricoMembros, atualizarHistoricoMembros, getRankingTimes, criarRankingTimes, atualizarRankingTimes, getRankingTimesHistorico, criarRankingTimesHistorico,steamIdFromUrl,     buscarInfoMatchIdStatus, buscarInfoMatchIdStats,buscarTimeGame, statuscs,buscarStatusplayer,enviarCodigoEmail,verificarCodigoEmail,setupDatabase, autenticacao, logout
} = require('./controller');
require('dotenv').config();

 
const app = express();
app.use(express.json());

// Middleware para debug (mostrar todas as requisições)
app.use((req, res, next) => {
    if (req.path.includes('/api/pagamento')) {
        console.log(`📥 ${req.method} ${req.path}`);
    }
    next();
});


app.use(cors({
    origin: process.env.CORS_DOMAIN,
    credentials: true
}));




//  ative para produção

// app.set('trust proxy', 1);

// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     proxy: true,
//     cookie: {
//         maxAge: 1000 * 60 * 60 * 24,
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production", 
//         sameSite: 'none'
//     }
// }));


// LOCALHOST - descomente esta parte
app.use(session({
    secret: process.env.SESSION_SECRET, // troque por algo aleatório e seguro
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
        httpOnly: true, // impede acesso via JS do cliente
        secure: false, 
        sameSite: 'lax'
    }
}))


// Configuração do multer para upload de arquivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB para vídeos
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem ou vídeo são permitidos!'), false);
        }
    }
});




// ===============================================================================================
// ==================================== [API PERFIL] =============================================

setupDatabase();

// Rota de teste
app.get('/hello', (req, res) => {
    res.send('ola mundo');
})


// ===============================================================================================
// ==================================== [API MERCADOPAGO] =============================================
// --- POST
app.post(process.env.ROUTE_CREATE_PREFERENCE, CreatePreference)

// --- WEBHOOK - Recebe notificações do Mercado Pago
app.post(process.env.ROUTE_MERCADOPAGO_WEBHOOK, webhookMercadoPago)

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
app.post(process.env.ROUTE_CLOUDINARY_UPLOAD, upload.single('file'), uploadImagemCloudinary);


// ===============================================================================================
// ==================================== [API DA position] ================================================
app.get(process.env.ROUTE_POSITION_IMG, buscarImgPosition );
app.post(process.env.ROUTE_POSITION_IMG_CREATE, createImgPosition);
app.put(process.env.ROUTE_POSITION_IMG_UPDATE, updateImgPosition);

// ===============================================================================================
// ==================================== [API DA IMG MAP] ================================================
app.get(process.env.ROUTE_IMG_MAP, buscarImgMap );
app.post(process.env.ROUTE_IMG_MAP_CREATE, createImgMap);
app.put(process.env.ROUTE_IMG_MAP_UPDATE, updateImgMap);

// ===============================================================================================
// ==================================== [API VETOS] ================================================
app.post(process.env.ROUTE_VETOS_SESSAO, criarSessaoVetos);
app.get(process.env.ROUTE_VETOS_SESSAO_TOKEN, buscarSessaoVetosPorToken);
app.post(process.env.ROUTE_VETOS_ACAO, salvarAcaoVeto);
app.post(process.env.ROUTE_VETOS_ESCOLHER_LADO, salvarEscolhaLado);
app.post(process.env.ROUTE_VETOS_INICIAR, iniciarSessaoVetos);
app.post(process.env.ROUTE_VETOS_ROLETA_CLIQUE, registrarCliqueRoleta);


// ===============================================================================================
// ==================================== [API EMAIL] ================================================

app.post(process.env.ROUTE_EMAIL_CODIGO, enviarCodigoEmail);
app.post(process.env.ROUTE_EMAIL_VERYCODE, verificarCodigoEmail);

// ===============================================================================================
// ==================================== [API DE BUSCA] ================================================

// ----- BUSCA GET
app.get(process.env.ROUTE_TIMES_SEARCH, buscarTimes);
app.get(process.env.ROUTE_USUARIOS_SEARCH, buscarUsuarios);

// ==================================== [API USUÁRIOS ADMIN] ================================================
// ----- USUÁRIOS ADMIN GET
app.get(process.env.ROUTE_ADMIN_USUARIOS, listarTodosUsuarios);
app.get(process.env.ROUTE_ADMIN_USUARIOS_ESTATISTICAS, getEstatisticasUsuarios);


// ----- BUSCA POST


// ----- BUSCA DELETE


// ----- BUSCA UPDATE
app.put(process.env.ROUTE_ADMIN_USUARIOS_GERENCIA, atualizarGerenciaUsuario);

// ===============================================================================================
// ==================================== [API PERFIL] =============================================

// ----- PERFIL GET
app.get(process.env.ROUTE_PERFIL_ID, getPerfil);
app.get(process.env.ROUTE_USERS_PERFILS, getplayers);


app.get(process.env.ROUTE_DASHBOARD, autenticacao);


app.get(process.env.ROUTE_LOGOUT, logout);


// ----------- PERFIL POST
app.post(process.env.ROUTE_REGISTER, register);

app.post(process.env.ROUTE_LOGIN, login);

app.post(process.env.ROUTE_CONFIGURACOES_ID, updateConfig); // Atualizar configurações do perfil

// ----------- PERFIL DELETE

// ==============================================================================================
// ==================================== [API TEAMS] =============================================

// ----- TEAMS GET
app.get(process.env.ROUTE_TIMES_LIST, listarTimes);
app.get(process.env.ROUTE_TIMES_ID, getTimeById);
app.get(process.env.ROUTE_TIMES_BY_USER, getTimeByUser);
app.get(process.env.ROUTE_TIMES_MEMBROS_LIDERANCA, listarMembrosParaLideranca);
app.get(process.env.ROUTE_TIMES_SOLICITACOES, listarSolicitacoesPorTime);

// ----- TEAMS POST

app.post(process.env.ROUTE_TIMES_CRIAR, criarTime);

// ----- TEAMS DELETE
app.delete(process.env.ROUTE_TIMES_ID, deletarTime);


// ----- TEAMS UPDATE
app.put(process.env.ROUTE_TIMES_TRANSFERIR_LIDERANCA, transferirLideranca);
app.put(process.env.ROUTE_UPDATE_TIMES_ID, atualizarTime);
app.put(process.env.ROUTE_TIMES_MEMBROS_POSICAO, atualizarPosicaoMembro);

// ----- TEAMS DELETE
app.delete(process.env.ROUTE_TIMES_DELETE_MEMBRO, removerMembro);
app.delete(process.env.ROUTE_TIMES_DEL_MEMBROS_SAIR, MembroSair);

// ===============================================================================================
// ==================================== [API SOLICITAÇÕES TIME] =============================================

// ----- SOLICITAÇÕES GET
app.get(process.env.ROUTE_SOLICITACOES_ID, getSolicitacaoById);

app.get(process.env.ROUTE_SOLICITACOES, listarTodasSolicitacoes); 

app.get(process.env.ROUTE_TIMES_SOLICITACAO_STATUS, verificarStatusSolicitacao);

// ----- SOLICITAÇÕES POST
app.post(process.env.ROUTE_TIMES_SOLICITAR_ENTRADA, solicitarEntradaTime);

// ----- SOLICITAÇÕES PUT
app.put(process.env.ROUTE_SOLICITACOES_ACEITAR, aceitarSolicitacao);

app.put(process.env.ROUTE_SOLICITACOES_REJEITAR, rejeitarSolicitacao);

// Novas rotas por ID usadas no frontend
app.put(process.env.ROUTE_SOLICITACOES_ID_ACEITAR, aceitarSolicitacaoPorId);
app.put(process.env.ROUTE_SOLICITACOES_ID_REJEITAR, rejeitarSolicitacaoPorId);

// ----- SOLICITAÇÕES DELETE
app.delete(process.env.ROUTE_DEL_SOLICITACOES, deletarSolicitacao);

// ===============================================================================================
// ==================================== [API MEDALHAS] =============================================

// ----- MEDALHAS GET
app.get(process.env.ROUTE_MEDALHAS_ID, getMedalhas);

app.get(process.env.ROUTE_MEDALHAS_USUARIO_ID, getMedalhasUsuario)

// ----- MEDALHAS POST

app.post(process.env.ROUTE_MEDALHAS_CRIAR, criarMedalhas)

app.post(process.env.ROUTE_MEDALHAS_ADICIONAR, addMedalhasuser)

// ----- MEDALHAS DELETE
app.delete(process.env.ROUTE_MEDALHAS_DELETAR_ID, deletarMedalhas)

// ----- MEDALHAS UPDATE
app.put(process.env.ROUTE_MEDALHAS_ATUALIZAR_DADOS_ID, atualizarMedalhas)


// ===============================================================================================
// ==================================== [API TROFEUS] ================================================

// ----- TROFEUS GET
app.get(process.env.ROUTE_TROFEUS, getTrofeus)
app.get(process.env.ROUTE_TROFEUS_TIME_ID, getTrofeusTime)


// ----- TROFEUS POST
app.post(process.env.ROUTE_TROFEUS_CRIAR, criarTrofeus)

app.post(process.env.ROUTE_TROFEUS_TIME, addTrofeuTime)

// ----- TROFEUS DELETE
app.delete(process.env.ROUTE_TROFEUS_DELETAR_ID, deletarTrofeus)


// ----- TROFEUS UPDATE
app.put(process.env.ROUTE_TROFEUS_ATUALIZAR_ID, atualizarTrofeus)

// ===============================================================================================
// ==================================== [API TRANSFERENCIA DE TIMES] ================================================

// ----- TIMES GET
app.get(process.env.ROUTE_TRANSFERENCIAS, getTransferencias);


// ----- TIMES POST
app.post(process.env.ROUTE_TRANSFERENCIAS, criarTransferencia);


// ----- TIMES DELETE
app.delete(process.env.ROUTE_TRANSFERENCIAS_ID, deletarTransferencia);

// ----- TIMES UPDATE
app.put(process.env.ROUTE_TRANSFERENCIAS, atualizarTransferencia);


// ===============================================================================================
// ==================================== [API NOTICIAS] ================================================

// ----- NOTICIAS GET
app.get(process.env.ROUTE_NOTICIAS_DESTAQUES, getNoticiasDestaques);

app.get(process.env.ROUTE_NOTICIAS_SITE, getNoticiasSite);

app.get(process.env.ROUTE_NOTICIAS_CAMPEONATO, getNoticiasCampeonato);

// ----- NOTICIAS POST
app.post(process.env.ROUTE_NOTICIAS_DESTAQUES_CRIAR, criarNoticiaDestaque);

app.post(process.env.ROUTE_NOTICIAS_SITE_CRIAR, criarNoticiaSite);

app.post(process.env.ROUTE_NOTICIAS_CAMPEONATO_CRIAR, criarNoticiaCampeonato);
// ----- NOTICIAS UPDATE
app.put(process.env.ROUTE_NOTICIAS_DESTAQUES_ATUALIZAR, atualizarNoticiaDestaque);

app.put(process.env.ROUTE_NOTICIAS_SITE_ATUALIZAR, atualizarNoticiaSite);

app.put(process.env.ROUTE_NOTICIAS_CAMPEONATO_ATUALIZAR, atualizarNoticiaCampeonato);

// ----- NOTICIAS DELETE
app.delete(process.env.ROUTE_NOTICIAS_DESTAQUES_DELETAR, deletarNoticiaDestaque);

app.delete(process.env.ROUTE_NOTICIAS_SITE_DELETAR, deletarNoticiaSite);

app.delete(process.env.ROUTE_NOTICIAS_CAMPEONATO_DELETAR, deletarNoticiaCampeonato);



// ===============================================================================================
// ==================================== [API INSCRICOES] ================================================

// ----- INSCRICAO GET
app.get(process.env.ROUTE_INSCRICOES_CAMPEONATO, getInscricoesCampeonato);

app.get(process.env.ROUTE_INSCRICOES_TIMES, getInscricoesTimes);

app.get(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS, getHistoricoMembros);

// ----- INSCRICAO POST
app.post(process.env.ROUTE_INSCRICOES_CAMPEONATO, criarInscricaoCampeonato);

app.post(process.env.ROUTE_INSCRICOES_TIMES, criarInscricaoTimes);

app.post(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS, criarHistoricoMembros);

// ----- INSCRICAO UPDATE
app.put(process.env.ROUTE_INSCRICOES_CAMPEONATO_ATUALIZAR, atualizarInscricaoCampeonato);

app.put(process.env.ROUTE_INSCRICOES_TIMES_ATUALIZAR, atualizarInscricaoTimes);

app.put(process.env.ROUTE_INSCRICOES_HISTORICO_MEMBROS_ATUALIZAR, atualizarHistoricoMembros);

// ----- INSCRICAO DELETE
app.delete(process.env.ROUTE_INSCRICOES_TIMES, deletarInscricaoTimes);

// ===============================================================================================
// ==================================== [CHAVEAMENTO] ===========================================
// ===============================================================================================

// ----- CHAVEAMENTO POST
app.post(process.env.ROUTE_CHAVEAMENTOS, criarChaveamento);

// ----- CHAVEAMENTO GET
app.get(process.env.ROUTE_CHAVEAMENTOS_CAMPEONATO_ID, getChaveamento);

// ----- PARTIDA POST (Salvar resultado)
app.post(process.env.ROUTE_CHAVEAMENTOS_PARTIDAS_RESULTADO, salvarResultadoPartida);

// ----- PARTIDAS POST (Inicializar estrutura)
app.post(process.env.ROUTE_CHAVEAMENTOS_PARTIDAS_INICIALIZAR, inicializarPartidasChaveamento);

// ----- CHAVEAMENTO POST (Resetar chaveamento)
app.post(process.env.ROUTE_CHAVEAMENTOS_ID_RESETAR, resetarChaveamento);



// ===============================================================================================
// ==================================== [API RANKING] ================================================

// ----- RANKING GET
app.get(process.env.ROUTE_RANKING_TIMES, getRankingTimes);

app.get(process.env.ROUTE_RANKING_TIMES_HISTORICO, getRankingTimesHistorico);

// ----- RANKING POST
app.post(process.env.ROUTE_RANKING_TIMES, criarRankingTimes);

app.post(process.env.ROUTE_RANKING_TIMES_HISTORICO, criarRankingTimesHistorico);

// ----- RANKING UPDATE
app.put(process.env.ROUTE_RANKING_TIMES, atualizarRankingTimes);


// ----- RANKING DELETE

// ===============================================================================================
// ==================================== [PORTA DA API] ==========================================


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});