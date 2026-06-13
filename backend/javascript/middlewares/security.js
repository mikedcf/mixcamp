const { conectar, desconectar } = require('../db');
const { registrarAuditoria } = require('./auditLog');
const { logAuthDebug } = require('./authDebug');

const GERENCIAS_STAFF = ['admin', 'moderador'];
const ORGANIZADOR_VALORES = ['premium', 'intermediario', 'basico'];

async function carregarUsuarioSessao(req) {
    if (!req.session?.user?.id) return null;

    let conexao;
    try {
        conexao = await conectar();
        const [rows] = await conexao.execute(
            'SELECT id, username, email, gerencia, organizador, time_id FROM usuarios WHERE id = ?',
            [req.session.user.id]
        );
        return rows[0] || null;
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

function requireAuth(req, res, next) {
    if (!req.session?.user?.id) {
        logAuthDebug('requireAuth_401', req, {
            status: 401,
            reason: req.session ? 'session_sem_user' : 'sem_session'
        });
        registrarAuditoria({ req, status: 401, userId: null }).catch(() => {});
        return res.status(401).json({ error: 'Não autorizado', message: 'Faça login para continuar' });
    }
    if (req.path.includes('notificacoes')) {
        logAuthDebug('requireAuth_ok', req, { status: 'next', userId: req.session.user.id });
    }
    next();
}

function requireGerencia(...gerenciasPermitidas) {
    return async (req, res, next) => {
        if (!req.session?.user?.id) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const usuario = await carregarUsuarioSessao(req);
        if (!usuario) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        req.authUser = usuario;

        if (!gerenciasPermitidas.includes(usuario.gerencia)) {
            registrarAuditoria({ req, status: 403, userId: usuario.id }).catch(() => {});
            return res.status(403).json({ error: 'Sem permissão para esta ação' });
        }

        next();
    };
}

/** Plano organizador (premium/intermediario/basico) — independente de gerencia staff */
function requireOrganizador(req, res, next) {
    (async () => {
        if (!req.session?.user?.id) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const usuario = await carregarUsuarioSessao(req);
        if (!usuario) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        req.authUser = usuario;

        if (!ORGANIZADOR_VALORES.includes(usuario.organizador)) {
            return res.status(403).json({
                error: 'Sem permissão',
                message: 'Apenas organizadores podem realizar esta ação'
            });
        }

        next();
    })().catch((err) => {
        console.error('requireOrganizador:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    });
}

/** Organizador (plano) ou staff admin/moderador — ex.: conceder medalhas/troféus no chaveamento */
function requireOrganizadorOuStaff(req, res, next) {
    (async () => {
        if (!req.session?.user?.id) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const usuario = await carregarUsuarioSessao(req);
        if (!usuario) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        req.authUser = usuario;

        const ehStaff = GERENCIAS_STAFF.includes(usuario.gerencia);
        const ehOrganizador = ORGANIZADOR_VALORES.includes(usuario.organizador);

        if (!ehStaff && !ehOrganizador) {
            return res.status(403).json({
                error: 'Sem permissão',
                message: 'Apenas organizadores ou staff podem realizar esta ação'
            });
        }

        next();
    })().catch((err) => {
        console.error('requireOrganizadorOuStaff:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    });
}

function validarApiKeyDiscord(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.DISCORD_BOT_API_KEY) {
        return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
}

/**
 * Verifica se o usuário da sessão tem plano organizador e é dono do campeonato.
 * @returns {Promise<boolean>} true se bloqueou (já enviou resposta)
 */
async function verificarPermissaoCampeonato(req, res, { campeonatoId, chaveamentoId } = {}) {
    if (!req.session?.user?.id) {
        res.status(401).json({ error: 'Não autorizado' });
        return true;
    }

    const usuario = req.authUser || await carregarUsuarioSessao(req);
    if (!usuario) {
        res.status(401).json({ error: 'Sessão inválida' });
        return true;
    }
    req.authUser = usuario;

    if (!ORGANIZADOR_VALORES.includes(usuario.organizador)) {
        res.status(403).json({ error: 'Sem permissão', message: 'Apenas organizadores podem gerenciar campeonatos' });
        return true;
    }

    let conexao;
    try {
        conexao = await conectar();
        let idCampeonato = campeonatoId;

        if (!idCampeonato && chaveamentoId) {
            const [chRows] = await conexao.execute(
                'SELECT campeonato_id FROM chaveamentos WHERE id = ?',
                [chaveamentoId]
            );
            if (!chRows[0]) {
                res.status(404).json({ error: 'Chaveamento não encontrado' });
                return true;
            }
            idCampeonato = chRows[0].campeonato_id;
        }

        if (!idCampeonato) {
            res.status(400).json({ error: 'campeonato_id é obrigatório' });
            return true;
        }

        const [campRows] = await conexao.execute(
            'SELECT id_organizador FROM inscricoes_campeonato WHERE id = ?',
            [idCampeonato]
        );

        if (!campRows[0]) {
            res.status(404).json({ error: 'Campeonato não encontrado' });
            return true;
        }

        if (parseInt(campRows[0].id_organizador, 10) !== parseInt(usuario.id, 10)) {
            res.status(403).json({ error: 'Sem permissão para este campeonato' });
            return true;
        }

        req.campeonatoIdAutorizado = idCampeonato;
        return false;
    } catch (err) {
        console.error('verificarPermissaoCampeonato:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
        return true;
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

function getSessionUserId(req) {
    return req.session?.user?.id;
}

/** Resolve inscricao_id (campeonato) a partir do id da linha em inscricoes_times */
async function obterCampeonatoIdPorInscricaoTime(inscricaoTimeId) {
    let conexao;
    try {
        conexao = await conectar();
        const [rows] = await conexao.execute(
            'SELECT inscricao_id FROM inscricoes_times WHERE id = ?',
            [inscricaoTimeId]
        );
        return rows[0]?.inscricao_id ?? null;
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

/**
 * Verifica permissão do organizador usando o id da inscrição de time.
 * @returns {Promise<boolean>} true se bloqueou (já enviou resposta)
 */
async function verificarPermissaoPorInscricaoTime(req, res, inscricaoTimeId) {
    if (!inscricaoTimeId) {
        res.status(400).json({ message: 'ID da inscrição é obrigatório' });
        return true;
    }
    const campeonatoId = await obterCampeonatoIdPorInscricaoTime(inscricaoTimeId);
    if (!campeonatoId) {
        res.status(404).json({ message: 'Inscrição não encontrada' });
        return true;
    }
    return verificarPermissaoCampeonato(req, res, { campeonatoId });
}

module.exports = {
    requireAuth,
    requireGerencia,
    requireOrganizador,
    requireOrganizadorOuStaff,
    validarApiKeyDiscord,
    verificarPermissaoCampeonato,
    verificarPermissaoPorInscricaoTime,
    getSessionUserId,
    GERENCIAS_STAFF,
    ORGANIZADOR_VALORES
};
