-- ===============================================================================================
-- SCRIPT DE MIGRAÇÃO: Alterar coluna posicoes de ENUM para VARCHAR para suportar múltiplas posições
-- Execute este script no seu banco de dados para atualizar a estrutura sem perder dados
-- IMPORTANTE: Certifique-se de estar usando o banco de dados correto antes de executar
-- ===============================================================================================

-- Este script altera a coluna posicoes de ENUM para VARCHAR(255) para permitir múltiplas posições
-- Formato: "awp,entry,coach" (separadas por vírgula)

-- Verificar se a coluna posicoes existe
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios' 
    AND COLUMN_NAME = 'posicoes'
);

-- Se a coluna não existir, criar como VARCHAR
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `usuarios` ADD COLUMN `posicoes` VARCHAR(255) DEFAULT NULL;',
    -- Se existir, modificar de ENUM para VARCHAR
    'ALTER TABLE `usuarios` MODIFY COLUMN `posicoes` VARCHAR(255) DEFAULT NULL;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migração concluída! A coluna posicoes agora suporta múltiplas posições separadas por vírgula.' AS resultado;

