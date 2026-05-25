const path = require('path');
const express = require('express');
const helmet = require('helmet');

/**
 * Helmet com CSP para páginas estáticas (quando SERVE_FRONTEND=true).
 * Permite CDNs e API já usados no projeto.
 */
function createFrontendHelmet() {
    const connectSrc = ["'self'"];

    if (process.env.CORS_DOMAIN) connectSrc.push(process.env.CORS_DOMAIN);
    if (process.env.CSP_CONNECT_SRC) {
        connectSrc.push(...process.env.CSP_CONNECT_SRC.split(/[\s,]+/).filter(Boolean));
    }

    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc,
                fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'data:'],
                frameSrc: ["'self'", 'https://www.mercadopago.com', 'https://mercadopago.com'],
                objectSrc: ["'none'"],
                baseUri: ["'self'"]
            }
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    });
}

function mountFrontend(app) {
    if (process.env.SERVE_FRONTEND !== 'true') {
        return;
    }

    const frontendRoot = path.join(__dirname, '..', '..', 'frontend');
    const htmlRoot = path.join(frontendRoot, 'html');

    app.use(createFrontendHelmet());
    app.use('/css', express.static(path.join(frontendRoot, 'css')));
    app.use('/js', express.static(path.join(frontendRoot, 'js')));
    app.use('/img', express.static(path.join(frontendRoot, 'img')));
    app.use(express.static(htmlRoot));

    app.get('/', (req, res) => {
        res.sendFile(path.join(htmlRoot, 'home.html'));
    });

    console.log('📂 Frontend estático ativo (SERVE_FRONTEND=true) — CSP aplicado');
}

module.exports = { mountFrontend, createFrontendHelmet };
