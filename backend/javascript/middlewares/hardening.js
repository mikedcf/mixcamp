const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

function shouldTrustProxy() {
    return isProduction || process.env.TRUST_PROXY === 'true';
}

const rateLimitValidate = () => (shouldTrustProxy() ? { trustProxy: true } : {});

function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

function ensureCsrfToken(req) {
    if (!req.session) return null;
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCsrfToken();
    }
    return req.session.csrfToken;
}

function rotateCsrfToken(req) {
    if (!req.session) return null;
    req.session.csrfToken = generateCsrfToken();
    return req.session.csrfToken;
}

function getCsrfExemptPaths() {
    const fromEnv = (process.env.CSRF_EXEMPT_PATHS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

    const builtins = [
        process.env.ROUTE_LOGIN,
        process.env.ROUTE_REGISTER,
        process.env.ROUTE_MERCADOPAGO_WEBHOOK,
        process.env.ROUTE_MERCADOPAGO_SUCCESS,
        process.env.ROUTE_MERCADOPAGO_FAILURE,
        process.env.ROUTE_MERCADOPAGO_PENDING,
        process.env.ROUTE_EMAIL_CODIGO,
        process.env.ROUTE_EMAIL_VERYCODE,
        process.env.ROUTE_VETOS_SESSAO,
        process.env.ROUTE_VETOS_SESSAO_TOKEN,
        process.env.ROUTE_VETOS_ACAO,
        process.env.ROUTE_VETOS_ESCOLHER_LADO,
        process.env.ROUTE_VETOS_INICIAR,
        process.env.ROUTE_VETOS_ROLETA_CLIQUE,
        process.env.ROUTE_FACEIT_PLAYER,
        process.env.ROUTE_FACEIT_HUB_MATCHES,
        process.env.ROUTE_FACEIT_MATCH_INFO,
        process.env.ROUTE_FACEIT_MATCH_INFO_STATUS,
        process.env.ROUTE_FACEIT_MATCH_INFO_STATS,
        process.env.ROUTE_FACEIT_PLAYER_STATUS,
        process.env.ROUTE_STEAM_TIMEGAME,
        process.env.ROUTE_STEAM_ID,
        process.env.ROUTE_STEAM_STATUS,
        process.env.ROUTE_DISCORD_USER_ID,
        process.env.ROUTE_DISCORD_TIMES_ALL,
        process.env.ROUTE_DISCORD_DADOS_GERAIS_USER,
        process.env.ROUTE_CSRF
    ].filter(Boolean);

    return [...new Set([...builtins, ...fromEnv])];
}

function isCsrfExempt(req) {
    const path = req.path;
    return getCsrfExemptPaths().some((exempt) => path === exempt || path.startsWith(`${exempt}/`));
}

/** Valida token CSRF em mutações quando há sessão de usuário */
function validateCsrf(req, res, next) {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }
    if (isCsrfExempt(req)) {
        return next();
    }
    if (!req.session?.user?.id) {
        return next();
    }

    const token = req.get('X-CSRF-Token') || req.body?._csrf;
    if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({
            error: 'Token CSRF inválido',
            message: 'Recarregue a página e tente novamente'
        });
    }
    next();
}

function getCsrfTokenHandler(req, res) {
    if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    res.json({ csrfToken: ensureCsrfToken(req) });
}

const helmetMiddleware = helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
});

const generalRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 400,
    standardHeaders: true,
    legacyHeaders: false,
    validate: rateLimitValidate(),
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    skip: (req) => {
        if (!isProduction && process.env.RATE_LIMIT_SKIP_LOCALHOST !== 'false' && isLocalhost(req)) {
            return true;
        }
        return false;
    }
});

function isLocalhost(req) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

const authRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate: rateLimitValidate(),
    message: { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
    skip: (req) => {
        if (process.env.RATE_LIMIT_TEST === '1') return false;
        if (!isProduction && process.env.RATE_LIMIT_SKIP_LOCALHOST !== 'false' && isLocalhost(req)) {
            return true;
        }
        return false;
    }
});

const emailRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_EMAIL_MAX, 10) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    validate: rateLimitValidate(),
    message: { error: 'Limite de envio de e-mail atingido. Tente mais tarde.' }
});

function parseMercadoPagoSignature(header) {
    if (!header) return { ts: null, v1: null };
    const tsMatch = header.match(/(?:^|,)\s*ts=([^,]+)/);
    const v1Match = header.match(/(?:^|,)\s*v1=([^,]+)/);
    return {
        ts: tsMatch ? tsMatch[1].trim() : null,
        v1: v1Match ? v1Match[1].trim() : null
    };
}

function extrairDataIdWebhook(req) {
    return (
        req.query['data.id'] ||
        req.query.id ||
        req.body?.data?.id ||
        req.body?.id ||
        null
    );
}

function buildWebhookManifest(dataId, xRequestId, ts) {
    let manifest = `id:${dataId || ''};`;
    if (xRequestId) {
        manifest += `request-id:${xRequestId};`;
    }
    manifest += `ts:${ts};`;
    return manifest;
}

/**
 * Valida assinatura x-signature do Mercado Pago (documentação oficial).
 * Se MERCADOPAGO_WEBHOOK_SECRET não estiver definido, ignora em dev e bloqueia em produção.
 */
function verifyMercadoPagoWebhook(req, res, next) {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
        if (isProduction) {
            console.error('[WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET ausente em produção');
            return res.status(500).send('Webhook não configurado');
        }
        console.warn('[WEBHOOK] Assinatura não verificada (defina MERCADOPAGO_WEBHOOK_SECRET)');
        return next();
    }

    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'] || '';

    if (!xSignature) {
        console.warn('[WEBHOOK] 401: header x-signature ausente');
        return res.status(401).send('Assinatura ausente');
    }

    const { ts, v1 } = parseMercadoPagoSignature(xSignature);

    if (!ts || !v1) {
        console.warn('[WEBHOOK] 401: x-signature malformado:', xSignature);
        return res.status(401).send('Assinatura malformada');
    }

    // MP envia ts em segundos. Produção: 5 min. Dev/simulação do painel: janela maior (ts pode vir desatualizado).
    const tsMs = parseInt(ts, 10) * 1000;
    const maxSkew = isProduction
        ? 5 * 60 * 1000
        : (parseInt(process.env.WEBHOOK_TS_MAX_SKEW_MS, 10) || 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(tsMs) || Math.abs(Date.now() - tsMs) > maxSkew) {
        console.warn(
            '[WEBHOOK] 401: timestamp fora da janela. ts=',
            ts,
            'agora=',
            Math.floor(Date.now() / 1000),
            'maxSkewMs=',
            maxSkew
        );
        return res.status(401).send('Timestamp inválido');
    }

    const dataId = extrairDataIdWebhook(req);
    const manifest = buildWebhookManifest(dataId, xRequestId, ts);
    const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const v1Norm = v1.toLowerCase();
    const expectedNorm = expected.toLowerCase();

    if (v1Norm.length !== expectedNorm.length) {
        if (!isProduction) {
            console.warn('[WEBHOOK] 401: tamanho hash diferente');
            console.warn('[WEBHOOK] manifest:', manifest);
            console.warn('[WEBHOOK] data.id query=', req.query['data.id'], 'body=', req.body?.data?.id);
        }
        return res.status(401).send('Assinatura inválida');
    }

    try {
        const valid = crypto.timingSafeEqual(
            Buffer.from(v1Norm, 'utf8'),
            Buffer.from(expectedNorm, 'utf8')
        );
        if (!valid) {
            if (!isProduction) {
                console.warn('[WEBHOOK] 401: assinatura não confere');
                console.warn('[WEBHOOK] manifest:', manifest);
                console.warn('[WEBHOOK] esperado:', expectedNorm.slice(0, 12) + '...');
                console.warn('[WEBHOOK] recebido:', v1Norm.slice(0, 12) + '...');
                console.warn('[WEBHOOK] Dica: secret do modo TESTE no MP = MERCADOPAGO_WEBHOOK_SECRET no .env');
            }
            return res.status(401).send('Assinatura inválida');
        }
    } catch {
        return res.status(401).send('Assinatura inválida');
    }

    next();
}

function getSessionConfig() {
    const secure = process.env.COOKIE_SECURE === 'true';
    const sameSite = process.env.COOKIE_SAMESITE || (secure ? 'none' : 'lax');

    return {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        proxy: shouldTrustProxy(),
        name: process.env.SESSION_COOKIE_NAME || 'mixcamp.sid',
        cookie: {
            maxAge: parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure,
            sameSite
        }
    };
}

module.exports = {
    helmetMiddleware,
    generalRateLimiter,
    authRateLimiter,
    emailRateLimiter,
    validateCsrf,
    verifyMercadoPagoWebhook,
    getSessionConfig,
    ensureCsrfToken,
    rotateCsrfToken,
    getCsrfTokenHandler,
    isProduction,
    shouldTrustProxy
};
