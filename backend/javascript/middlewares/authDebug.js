/**
 * Logs de diagnóstico de sessão/cookie (produção: DEBUG_AUTH=true no Railway).
 * Não registra senhas, tokens CSRF completos nem corpo de login.
 */

function isAuthDebugEnabled() {
    const v = process.env.DEBUG_AUTH;
    return v === 'true' || v === '1';
}

function sessionCookieName() {
    return process.env.SESSION_COOKIE_NAME || 'mixcamp.sid';
}

function buildAuthSnapshot(req) {
    const cookieHeader = req.headers.cookie || '';
    const name = sessionCookieName();
    const hasNamedCookie = cookieHeader.includes(`${name}=`);

    return {
        method: req.method,
        path: req.path,
        origin: req.headers.origin || null,
        referer: req.headers.referer ? String(req.headers.referer).slice(0, 120) : null,
        hasCookieHeader: Boolean(cookieHeader),
        hasSessionCookie: hasNamedCookie,
        sessionCookieName: name,
        hasExpressSession: Boolean(req.session),
        sessionUserId: req.session?.user?.id ?? null,
        sessionIdPrefix: req.sessionID ? `${String(req.sessionID).slice(0, 8)}…` : null,
        env: {
            nodeEnv: process.env.NODE_ENV || null,
            cookieSecure: process.env.COOKIE_SECURE || null,
            cookieSameSite: process.env.COOKIE_SAMESITE || null,
            sessionStore: process.env.SESSION_STORE || null,
            corsDomain: process.env.CORS_DOMAIN || null
        }
    };
}

function logAuthDebug(label, req, extra = {}) {
    if (!isAuthDebugEnabled()) return;

    const payload = {
        ts: new Date().toISOString(),
        label,
        ...buildAuthSnapshot(req),
        ...extra
    };

    console.log('[AUTH_DEBUG]', JSON.stringify(payload));
}

function logAuthDebugStartup() {
    if (!isAuthDebugEnabled()) return;
    console.log('[AUTH_DEBUG] Ativo — logs de sessão/cookie em dashboard, login, notificacoes e requireAuth');
}

module.exports = {
    isAuthDebugEnabled,
    logAuthDebug,
    logAuthDebugStartup
};
