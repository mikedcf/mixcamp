const session = require('express-session');

/**
 * Store de sessão em MySQL (Fase 3).
 * Ative com SESSION_STORE=mysql no .env
 */
function createSessionStore() {
    if (process.env.SESSION_STORE !== 'mysql') {
        return null;
    }

    const MySQLStore = require('express-mysql-session')(session);

    return new MySQLStore({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        clearExpired: true,
        checkExpirationInterval: 15 * 60 * 1000,
        expiration: parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 24 * 60 * 60 * 1000,
        createDatabaseTable: true,
        charset: 'utf8mb4_unicode_ci',
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    });
}

module.exports = { createSessionStore };
