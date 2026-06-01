/**
 * Logs padronizados de rotas da API (Railway / DEBUG_API=true).
 * Use DEBUG_API=true para respostas 4xx/5xx no access log e detalhe em erros não tratados.
 */

function isApiDebugEnabled() {
    const v = process.env.DEBUG_API;
    return v === 'true' || v === '1';
}

function buildRequestSnapshot(req) {
    return {
        method: req.method,
        path: (req.originalUrl || req.path || '').split('?')[0],
        userId: req.session?.user?.id ?? null,
        ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null
    };
}

function formatError(err) {
    if (!err) return { message: 'Erro desconhecido' };
    return {
        message: err.message || String(err),
        code: err.code || null,
        sqlState: err.sqlState || null,
        sqlMessage: err.sqlMessage || null,
        status: err.status || err.statusCode || null
    };
}

/** Erro inesperado — sempre vai para stderr (aparece no Railway). */
function logRouteError(routeName, req, err, extra = {}) {
    const payload = {
        ts: new Date().toISOString(),
        level: 'error',
        route: routeName,
        ...buildRequestSnapshot(req),
        error: formatError(err),
        ...extra
    };
    console.error('[api-error]', JSON.stringify(payload));
    if (isApiDebugEnabled() && err?.stack) {
        console.error(err.stack);
    }
}

/** Conflito de negócio (409) ou aviso — só loga com DEBUG_API. */
function logRouteWarn(routeName, req, message, extra = {}) {
    if (!isApiDebugEnabled()) return;
    console.warn('[api-warn]', JSON.stringify({
        ts: new Date().toISOString(),
        level: 'warn',
        route: routeName,
        message,
        ...buildRequestSnapshot(req),
        ...extra
    }));
}

function isRouteHandler(fn) {
    return typeof fn === 'function'
        && fn.constructor.name === 'AsyncFunction'
        && fn.length === 2;
}

/** Captura rejeições não tratadas em handlers async (req, res). */
function asyncHandler(fn, routeName) {
    const label = routeName || fn.name || 'anonymous';
    return async function routeHandlerWrapped(req, res) {
        try {
            await fn(req, res);
        } catch (err) {
            if (res.headersSent) {
                logRouteError(label, req, err, { note: 'resposta já enviada' });
                return;
            }
            logRouteError(label, req, err);
            res.status(err.status || err.statusCode || 500).json({
                message: err.publicMessage || 'Erro interno do servidor',
                ...(isApiDebugEnabled() ? { debug: err.message } : {})
            });
        }
    };
}

function wrapRouteHandlers(exportsObj) {
    const wrapped = {};
    for (const [name, fn] of Object.entries(exportsObj)) {
        wrapped[name] = isRouteHandler(fn) ? asyncHandler(fn, name) : fn;
    }
    return wrapped;
}

/** Access log: status >= 500 sempre; 4xx se DEBUG_API. */
function apiResponseLogMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const status = res.statusCode;
        const ms = Date.now() - start;
        const path = (req.originalUrl || req.path || '').split('?')[0];
        if (!path.includes('/api/')) return;

        if (status >= 500) {
            console.error('[api-res]', JSON.stringify({
                ts: new Date().toISOString(),
                method: req.method,
                path,
                status,
                ms,
                userId: req.session?.user?.id ?? null
            }));
        } else if (isApiDebugEnabled() && status >= 400) {
            console.warn('[api-res]', JSON.stringify({
                ts: new Date().toISOString(),
                method: req.method,
                path,
                status,
                ms,
                userId: req.session?.user?.id ?? null
            }));
        }
    });
    next();
}

function registerProcessErrorHandlers() {
    process.on('unhandledRejection', (reason) => {
        console.error('[process] unhandledRejection', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[process] uncaughtException', err);
    });
}

module.exports = {
    logRouteError,
    logRouteWarn,
    asyncHandler,
    wrapRouteHandlers,
    apiResponseLogMiddleware,
    registerProcessErrorHandlers,
    isApiDebugEnabled
};
