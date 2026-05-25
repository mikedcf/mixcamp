const { conectar } = require('../db');

function obterUserAgent(req) {
    if (typeof req.get === 'function') {
        return req.get('user-agent') || '';
    }
    return req.headers?.['user-agent'] || '';
}

const STATUS_AUDITADOS = new Set([401, 403, 429]);

function obterIp(req) {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

function deveAuditar(req, status) {
    if (process.env.AUDIT_LOG_ENABLED === 'false') return false;
    if (!STATUS_AUDITADOS.has(status)) return false;
    const url = (req.originalUrl || req.path || '').split('?')[0];
    if (!url.includes('/api/')) return false;
    return true;
}

async function registrarAuditoria({ req, status, userId }) {
    let conexao;
    try {
        conexao = await conectar();
        await conexao.execute(
            `INSERT INTO security_audit_log (user_id, ip, method, path, status_code, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId || null,
                obterIp(req).slice(0, 45),
                (req.method || 'GET').slice(0, 10),
                (req.originalUrl || req.path || '').slice(0, 500),
                status,
                obterUserAgent(req).slice(0, 300)
            ]
        );
    } catch (err) {
        console.error('[audit]', err.message);
    } finally {
        if (conexao) await conexao.end();
    }
}

/** Registra 401/403/429 em rotas da API (assíncrono, não bloqueia resposta) */
function auditMiddleware(req, res, next) {
    res.on('finish', () => {
        if (!deveAuditar(req, res.statusCode)) return;

        const userId = req.session?.user?.id || null;
        registrarAuditoria({ req, status: res.statusCode, userId }).catch(() => {});
    });
    next();
}

module.exports = { auditMiddleware, registrarAuditoria };
