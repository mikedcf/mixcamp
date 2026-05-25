const { conectar, desconectar } = require('./db');

/**
 * Cria tabelas da Fase 3 (sessions + security_audit_log).
 * Roda no boot do servidor e via npm run db:security
 */
async function ensureSecurityTables() {
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) NOT NULL PRIMARY KEY,
                expires INT UNSIGNED NOT NULL,
                data MEDIUMTEXT,
                INDEX IDX_sessions_expires (expires)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conexao.execute(`
            CREATE TABLE IF NOT EXISTS security_audit_log (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                ip VARCHAR(45) NULL,
                method VARCHAR(10) NOT NULL,
                path VARCHAR(500) NOT NULL,
                status_code SMALLINT NOT NULL,
                user_agent VARCHAR(300) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX IDX_audit_created (created_at),
                INDEX IDX_audit_status (status_code),
                INDEX IDX_audit_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        return true;
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

module.exports = { ensureSecurityTables };
