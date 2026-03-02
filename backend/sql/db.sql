-- Active: 1768406150063@@127.0.0.1@3306@mixcamp

-- ============================ CRIAÇÃO DO BANCO E CONEXÃO  =============================
CREATE DATABASE IF NOT EXISTS mixcamp;

USE mixcamp;

-- ============================ BANCO DO USUARIO  =============================
-- Tabela para armazenar os dados dos usuários
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `senha` VARCHAR(255) NOT NULL, -- Armazenar a senha hash
    `steamid` VARCHAR(255) DEFAULT NULL,
    `faceitid` VARCHAR(255) DEFAULT NULL,
    `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `avatar_url` VARCHAR(255) DEFAULT 'https://i.ibb.co/qMT9NVK5/user-2.webp',
    `banner_url` VARCHAR(255) DEFAULT 'https://i.ibb.co/GfpXkKWk/banner3-1.webp',
    `sobre` TEXT,
    `time_id` INT, -- Chave estrangeira para a tabela de times
    `posicoes` VARCHAR(255) DEFAULT NULL, -- Armazena múltiplas posições separadas por vírgula: "awp,entry,coach"
    `gerencia` ENUM(
        'admin',
        'moderador',
        'gerente',
        'user'
    ) DEFAULT 'user',
    `organizador` ENUM(
        'premium',
        'simples'
    ) DEFAULT NULL,
    `cores_perfil` VARCHAR(50) DEFAULT '#ffffff80',
    `cfg_cs` VARCHAR(255),
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`)
);




-- Tabela para armazenar os links de redes sociais dos usuários
CREATE TABLE IF NOT EXISTS `redes_sociais` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `discord_url` VARCHAR(255),
    `youtube_url` VARCHAR(255),
    `instagram_url` VARCHAR(255),
    `twitter_url` VARCHAR(255),
    `twitch_url` VARCHAR(255),
    `faceit_url` VARCHAR(255),
    `gamesclub_url` VARCHAR(255),
    `steam_url` VARCHAR(255),
    `tiktok_url` VARCHAR(255),
    `kick_url` VARCHAR(255),
    `allstar_url` VARCHAR(255),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
);

-- Tabela para armazenar os destaques (vídeos) dos usuários
CREATE TABLE IF NOT EXISTS `destaques` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `video_url` VARCHAR(255) NOT NULL,
    `ordem` INT, -- Para definir a ordem de exibição, ex: 1 ou 2
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
);

-- ============================ BANCO DO TIME  =============================
-- Tabela para armazenar os dados dos times
CREATE TABLE IF NOT EXISTS `times` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(100) NOT NULL UNIQUE,
    `tag` VARCHAR(10) NOT NULL UNIQUE,
    `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `lider_id` INT NOT NULL,
    `avatar_time_url` VARCHAR(255) DEFAULT 'https://i.ibb.co/99tvNKGP/Chat-GPT-Image-24-de-nov-de-2025-12-19-41.png',
    `banner_time_url` VARCHAR(255) DEFAULT 'https://i.ibb.co/tPkZHy8R/banner-time.png',
    `sobre_time` TEXT,
    `cores_perfil` VARCHAR(50) DEFAULT '#ffffff80',
    FOREIGN KEY (`lider_id`) REFERENCES `usuarios` (`id`)
);

-- Tabela de relacionamento entre usuários e times (membros)
CREATE TABLE IF NOT EXISTS `membros_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `time_id` INT NOT NULL,
    `funcao` ENUM('titular', 'reserva', 'coach') NOT NULL,
    -- Posição/função em jogo (o que aparece abaixo do nome)
    `posicao` ENUM(
        'capitao',
        'awp',
        'entry',
        'support',
        'igl',
        'sub',
        'coach',
        'lurker',
        'rifle'
    ) NOT NULL,
    `data_entrada` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_usuario_time` (`usuario_id`, `time_id`) -- Garante que um usuário só pode estar em um time uma vez
);

-- Redes sociais do time
CREATE TABLE IF NOT EXISTS `redes_sociais_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `time_id` INT NOT NULL,
    `discord_url` VARCHAR(255),
    `youtube_url` VARCHAR(255),
    `instagram_url` VARCHAR(255),
    `twitter_url` VARCHAR(255),
    `twitch_url` VARCHAR(255),
    `faceit_url` VARCHAR(255),
    `gamesclub_url` VARCHAR(255),
    `steam_url` VARCHAR(255),
    `tiktok_url` VARCHAR(255),
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_redes_time` (`time_id`)
);

-- Destaques (vídeos) do time
CREATE TABLE IF NOT EXISTS `destaques_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `time_id` INT NOT NULL,
    `video_url` VARCHAR(255) NOT NULL,
    `ordem` INT,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE
);

-- Notícias do time
CREATE TABLE IF NOT EXISTS `noticias_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `time_id` INT NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `data_publicacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `games_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `time_id` INT NOT NULL,
    `game_name` TEXT NOT NULL,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE
);

-- ============================ BANCO DE CONQUISTAS/MEDALHAS/TROFEUS  =============================
-- Tabela de medalhas
CREATE TABLE IF NOT EXISTS `medalhas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(100) NOT NULL UNIQUE,
    `descricao` TEXT,
    `imagem_url_campeao` VARCHAR(255) NOT NULL,
    `imagem_url_segundo` VARCHAR(255) NOT NULL,
    `iframe_url_campeao` VARCHAR(255),
    `iframe_url_segundo` VARCHAR(255),
    `edicao_campeonato` VARCHAR(50), -- Ex: "Edição 2025"
    `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento entre usuários e medalhas
CREATE TABLE IF NOT EXISTS `usuario_medalhas` (
    `usuario_id` INT NOT NULL,
    `medalha_id` INT NOT NULL,
    `position_medalha`ENUM('campeao', 'segundo', 'terceiro'),
    `data_conquista` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`usuario_id`, `medalha_id`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`medalha_id`) REFERENCES `medalhas` (`id`) ON DELETE CASCADE
);

-- Conquistas/medalhas do time (separadas das medalhas por usuário)
CREATE TABLE IF NOT EXISTS `time_conquistas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `time_id` INT NOT NULL,
    `trofeu_id` INT NOT NULL,
    `data_conquista` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`trofeu_id`) REFERENCES `trofeus` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `trofeus` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT,
    `imagem_url` VARCHAR(255) NOT NULL,
    `iframe_url` VARCHAR(255),
    `edicao_campeonato` VARCHAR(50),
    `categoria` VARCHAR(100),
    `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================ BANCO DE SOLICITAÇÕES E TRANSFERÊNCIAS  =============================

-- Tabela para as solicitações de entrada em times
CREATE TABLE IF NOT EXISTS `solicitacoes_time` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `time_id` INT NOT NULL,
    `posicao` ENUM(
        'awp',
        'entry',
        'support',
        'igl',
        'sub',
        'coach',
        'rifle',
        'lurker'
    ) NOT NULL,
    `status` ENUM(
        'pendente',
        'aceita',
        'recusada'
    ) DEFAULT 'pendente',
    `data_solicitacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`time_id`) REFERENCES `times` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transferencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    posicao ENUM(
        'awp',
        'entry',
        'support',
        'igl',
        'sub',
        'coach',
        'rifle',
        'lurker'
    ) NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (time_id) REFERENCES times (id)
);

-- ============================ BANCO DE IMG DE POSIÇÕES  =============================

CREATE TABLE IF NOT EXISTS posicoes_img (
    id INT PRIMARY KEY AUTO_INCREMENT,
    `capitao` VARCHAR(255),
    `awp` VARCHAR(255),
    `entry` VARCHAR(255),
    `support` VARCHAR(255),
    `igl` VARCHAR(255),
    `sub` VARCHAR(255),
    `coach` VARCHAR(255),
    `rifle` VARCHAR(255),
    `lurker` VARCHAR(255)
)

-- ============================ BANCO DE NOTICIAIS  =============================

-- DESTAQUES
CREATE TABLE IF NOT EXISTS noticias_destaques (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'destaque',
    destaque ENUM('sim', 'nao') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS noticias_site (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'site',
    categoria ENUM(
        'mobile',
        'segurança',
        'interface',
        'sistema',
        'regras',
        'noticias',
        'eventos',
        'outros'
    ) NOT NULL DEFAULT 'outros',
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    versao VARCHAR(100) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS noticias_campeonato (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'campeonato',
    destaque ENUM(
        'vencedor',
        'destaque',
        'estatisticas',
        'proximo',
        'novidade'
    ) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

-- ============================ BANCO DE INSCRIÇÕES DE CAMPEONATOS  =============================


CREATE TABLE IF NOT EXISTS inscricoes_campeonato (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('oficial', 'comum') NOT NULL DEFAULT 'comum',
    mixcamp VARCHAR(100) NOT NULL DEFAULT 'desconhecido',
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    transmissao ENUM('sim', 'nao') NOT NULL DEFAULT 'nao',
    preco_inscricao DECIMAL(10, 2) NOT NULL,
    premiacao DECIMAL(10, 2) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    trofeu_id INT,
    medalha_id INT,
    chave VARCHAR(100) ENUM(
        'Single Elimination (B01 até final BO3)',
        'Single Elimination (todos BO3)',
        'Double Elimination',
        'CS2 Major (playoffs BO3)'
    ) NOT NULL,
    edicao_campeonato VARCHAR(50),
    plataforma VARCHAR(100) DEFAULT 'FACEIT',
    game VARCHAR(100) DEFAULT 'CS2',
    nivel VARCHAR(100) DEFAULT '1-10',
    formato VARCHAR(100) DEFAULT '5v5',
    qnt_times ENUM(
        '6',
        '8',
        '10',
        '12',
        '14',
        '16',
        '18',
        '20',
        '24',
        '28',
        '32'
    ) NOT NULL,
    regras TEXT NOT NULL,
    id_organizador INT UNSIGNED NOT NULL,
    link_hub VARCHAR(200) NOT NULL,
    link_convite VARCHAR(200) NOT NULL,
    link_whatsapp VARCHAR(255) DEFAULT NULL,
    status ENUM(
        'em breve',
        'disponivel',
        'andamento',
        'encerrado',
        'cancelado'
    ) NOT NULL DEFAULT 'disponivel',
    previsao_data_inicio DATETIME NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_organizador) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (trofeu_id) REFERENCES time_conquistas (id) ON DELETE CASCADE,
    FOREIGN KEY (medalha_id) REFERENCES medalhas (id) ON DELETE CASCADE
);

ALTER TABLE inscricoes_campeonato ADD COLUMN link_whatsapp VARCHAR(255) DEFAULT NULL;
ALTER TABLE inscricoes_campeonato ADD COLUMN link_whatsapp VARCHAR(255) DEFAULT NULL;

ALTER TABLE IF NOT EXISTS inscricoes_campeonato
MODIFY status ENUM(
    'em breve',
    'disponivel',
    'andamento',
    'encerrado',
    'cancelado'
) NOT NULL DEFAULT 'disponivel';

-- Se a tabela já existia sem link_whatsapp, execute uma vez: ALTER TABLE inscricoes_campeonato ADD COLUMN link_whatsapp VARCHAR(255) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS inscricoes_times (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscricao_id INT UNSIGNED NOT NULL,
    time_id INT UNSIGNED NOT NULL,
    payment_id VARCHAR(100) DEFAULT NULL COMMENT 'ID do pagamento do Mercado Pago',
    status_pagamento ENUM(
        'approved',
        'pending',
        'rejected',
        'cancelled',
        'refunded'
    ) DEFAULT NULL COMMENT 'Status do pagamento',
    valor_pago DECIMAL(10, 2) DEFAULT NULL COMMENT 'Valor pago na inscrição',
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da inscrição',
    data_pagamento TIMESTAMP NULL DEFAULT NULL COMMENT 'Data de confirmação do pagamento',
    FOREIGN KEY (inscricao_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscricao_time (inscricao_id, time_id) COMMENT 'Evita duplicatas de inscrição'
);


CREATE TABLE IF NOT EXISTS membros_campeonato(
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    posicao ENUM(
        'capitao',
        'awp',
        'entry',
        'support',
        'igl',
        'sub',
        'coach',
        'rifle',
        'lurker'
    ) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE
);
















-- ============================ BANCO DE CUPONS  =============================

CREATE TABLE IF NOT EXISTS cupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    desconto_percentual DECIMAL(5, 2) NOT NULL,
    usos_maximos INT DEFAULT 1,
    usos_restantes INT DEFAULT 1,
    data_expiracao DATETIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para registrar resgates de cupons
CREATE TABLE IF NOT EXISTS cupons_resgatados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cupom_id INT NOT NULL,
    data_resgate DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (cupom_id) REFERENCES cupons (id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_cupom (usuario_id, cupom_id)
);

-- Inserir alguns cupons de exemplo
-- INSERT INTO cupons (codigo, nome, descricao, desconto_percentual, usos_maximos, usos_restantes, data_expiracao) VALUES
-- ('WELCOME2024', 'Cupom de Boas-vindas 2024', 'Desconto especial para novos usuários', 15.00, 100, 100, '2024-12-31 23:59:59'),
-- ('GAMER10', 'Cupom Gamer', 'Desconto para a comunidade gaming', 10.00, 50, 50, '2024-12-31 23:59:59'),
-- ('VIP20', 'Cupom VIP', 'Desconto exclusivo para membros VIP', 20.00, 25, 25, '2024-12-31 23:59:59'),
-- ('TESTE5', 'Cupom de Teste', 'Cupom para testes do sistema', 5.00, 10, 10, '2024-12-31 23:59:59');

















CREATE TABLE IF NOT EXISTS img_map (
    id INT PRIMARY KEY AUTO_INCREMENT,
    Mirage VARCHAR(255) NOT NULL,
    Train VARCHAR(255) NOT NULL,
    Vertigo VARCHAR(255) NOT NULL,
    Nuke VARCHAR(255) NOT NULL,
    Ancient VARCHAR(255) NOT NULL,
    Inferno VARCHAR(255) NOT NULL,
    Overpass VARCHAR(255) NOT NULL,
    Dust2 VARCHAR(255) NOT NULL,
    Cache VARCHAR(255) NOT NULL,
    Anubis VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS chaveamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campeonato_id INT NOT NULL,
    formato_chave ENUM('single_b01', 'single_bo3_all', 'major_playoffs_bo3', 'double_elimination') NOT NULL,
    quantidade_times INT NOT NULL,
    status ENUM('nao_iniciado', 'em_andamento', 'finalizado') DEFAULT 'nao_iniciado',
    campeao_time_id INT NULL, -- ID do time campeão (preenchido quando finalizar)
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (campeao_time_id) REFERENCES times(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_campeonato (campeonato_id),
    INDEX idx_status (status),
    INDEX idx_campeonato (campeonato_id),
    INDEX idx_campeao (campeao_time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================ TABELAS DO SISTEMA DE CHAVEAMENTO =============================

-- Tabela de partidas do chaveamento
CREATE TABLE IF NOT EXISTS partidas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chaveamento_id INT NOT NULL,
    match_id VARCHAR(100) NOT NULL, -- Ex: "upper_1_1", "lower_2_3", "grand_final_1"
    round_num INT NOT NULL, -- Número do round (1, 2, 3, etc)
    bracket_type ENUM('upper', 'lower', 'grand_final') NOT NULL, -- Tipo de bracket
    formato_partida ENUM('B01', 'B03', 'B05') NOT NULL, -- Melhor de 1, 3 ou 5
    time1_id INT NULL, -- ID do primeiro time
    time2_id INT NULL, -- ID do segundo time
    time_vencedor_id INT NULL, -- ID do time vencedor (preenchido quando resultado é definido)
    score_time1 INT DEFAULT 0, -- Pontuação do time 1
    score_time2 INT DEFAULT 0, -- Pontuação do time 2
    status ENUM('agendada', 'em_andamento', 'finalizada', 'cancelada') DEFAULT 'agendada',
    data_partida DATETIME NULL, -- Data/hora agendada da partida
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_chaveamento (chaveamento_id),
    INDEX idx_match_id (match_id),
    INDEX idx_status (status),
    INDEX idx_round (round_num, bracket_type),
    UNIQUE KEY unique_match (chaveamento_id, match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resultados detalhados das partidas (por mapa)
CREATE TABLE IF NOT EXISTS resultados_partidas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partida_id INT NOT NULL,
    mapa_num INT NOT NULL, -- Número do mapa (1, 2, 3, etc) - Para BO1 sempre será 1
    score_time1 INT NOT NULL DEFAULT 0, -- Pontuação do time 1 neste mapa
    score_time2 INT NOT NULL DEFAULT 0, -- Pontuação do time 2 neste mapa
    time_vencedor_mapa INT NULL, -- ID do time que venceu este mapa
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_partida (partida_id),
    INDEX idx_mapa (partida_id, mapa_num),
    UNIQUE KEY unique_partida_mapa (partida_id, mapa_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posição atual dos times no chaveamento
CREATE TABLE IF NOT EXISTS posicoes_times (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chaveamento_id INT NOT NULL,
    time_id INT NOT NULL,
    bracket_type ENUM('upper', 'lower', 'eliminado', 'campeao') NOT NULL,
    round_atual INT NULL, -- Round atual do time (NULL se eliminado ou campeão)
    match_id_atual VARCHAR(100) NULL, -- Match ID atual do time
    status ENUM('ativo', 'eliminado', 'campeao') DEFAULT 'ativo',
    data_eliminacao TIMESTAMP NULL, -- Data em que foi eliminado (se aplicável)
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_chaveamento (chaveamento_id),
    INDEX idx_time (time_id),
    INDEX idx_status (status),
    INDEX idx_bracket (bracket_type, round_atual),
    UNIQUE KEY unique_time_chaveamento (chaveamento_id, time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico de movimentações dos times no chaveamento
CREATE TABLE IF NOT EXISTS historico_movimentacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chaveamento_id INT NOT NULL,
    time_id INT NOT NULL,
    tipo_movimentacao ENUM('avancou_upper', 'caiu_lower', 'avancou_lower', 'eliminado', 'campeao') NOT NULL,
    round_origem INT NULL, -- Round de origem
    round_destino INT NULL, -- Round de destino
    match_id_origem VARCHAR(100) NULL, -- Match ID de origem
    match_id_destino VARCHAR(100) NULL, -- Match ID de destino
    partida_id INT NULL, -- ID da partida que causou esta movimentação
    observacao TEXT NULL, -- Observações adicionais
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_chaveamento (chaveamento_id),
    INDEX idx_time (time_id),
    INDEX idx_tipo (tipo_movimentacao),
    INDEX idx_data (data_movimentacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ============================ BANCO DE VETOS DE MAPAS =============================

-- Tabela para armazenar sessões de vetos (criada sem foreign keys primeiro)
CREATE TABLE IF NOT EXISTS vetos_sessoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partida_id INT NULL, -- ID da partida (opcional)
    campeonato_id INT NULL, -- ID do campeonato (opcional)
    formato ENUM('bo1', 'bo3', 'bo5') NOT NULL,
    mapas_selecionados JSON NOT NULL, -- Array com nomes dos mapas selecionados
    time_a_id INT NULL, -- ID do time A (opcional)
    time_b_id INT NULL, -- ID do time B (opcional)
    token_a VARCHAR(255) NOT NULL UNIQUE, -- Token único para o time A
    token_b VARCHAR(255) NOT NULL UNIQUE, -- Token único para o time B
    token_spectator VARCHAR(255) NULL, -- Token para espectadores (somente visualização)
    turno_atual ENUM('time_a', 'time_b') DEFAULT 'time_a', -- Qual time está no turno atual
    status ENUM('configurado', 'em_andamento', 'finalizado') DEFAULT 'configurado',
    time_a_pronto BOOLEAN DEFAULT FALSE, -- Se o Time A clicou no botão da roleta
    time_b_pronto BOOLEAN DEFAULT FALSE, -- Se o Time B clicou no botão da roleta
    sorteio_realizado BOOLEAN DEFAULT FALSE, -- Se o sorteio já foi realizado
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_token_a (token_a),
    INDEX idx_token_b (token_b),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para armazenar picks/bans realizados (criada sem foreign keys primeiro)

DROP TABLE IF EXISTS vetos_acoes;
CREATE TABLE IF NOT EXISTS vetos_acoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sessao_id INT NOT NULL,
    mapa VARCHAR(50) NOT NULL, -- Nome do mapa (mirage, dust2, etc)
    acao ENUM('pick', 'ban') NOT NULL, -- Se foi pick ou ban
    time_id INT NULL, -- ID do time que fez a ação
    ordem INT NOT NULL, -- Ordem da ação (1, 2, 3, ...)
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    lado_inicial ENUM('CT', 'TR') NULL, -- Lado inicial escolhido pelo outro time (apenas para picks)
    INDEX idx_sessao (sessao_id),
    INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar foreign keys após criar as tabelas (se as tabelas referenciadas existirem)
-- Descomente estas linhas se as tabelas partidas, campeonatos e times já existirem:

-- ALTER TABLE vetos_sessoes 
--     ADD CONSTRAINT fk_vetos_sessoes_partida 
--     FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE SET NULL;

-- ALTER TABLE vetos_sessoes 
--     ADD CONSTRAINT fk_vetos_sessoes_campeonato 
--     FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE SET NULL;

-- ALTER TABLE vetos_sessoes 
--     ADD CONSTRAINT fk_vetos_sessoes_time_a 
--     FOREIGN KEY (time_a_id) REFERENCES times(id) ON DELETE SET NULL;

-- ALTER TABLE vetos_sessoes 
--     ADD CONSTRAINT fk_vetos_sessoes_time_b 
--     FOREIGN KEY (time_b_id) REFERENCES times(id) ON DELETE SET NULL;

-- ALTER TABLE vetos_acoes 
--     ADD CONSTRAINT fk_vetos_acoes_sessao 
--     FOREIGN KEY (sessao_id) REFERENCES vetos_sessoes(id) ON DELETE CASCADE;

-- ALTER TABLE vetos_acoes 
--     ADD CONSTRAINT fk_vetos_acoes_time 
--     FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE SET NULL;




-- ============================ SISTEMA DE RANKING  =============================


CREATE TABLE IF NOT EXISTS ranking_times_atual (
    id INT PRIMARY KEY AUTO_INCREMENT,
    time_id INT NOT NULL,

    pontos INT NOT NULL DEFAULT 0,
    ranking_atual INT NOT NULL DEFAULT 0,

    trofeus INT NOT NULL DEFAULT 0,
    total_partidas INT NOT NULL DEFAULT 0,
    vitorias INT NOT NULL DEFAULT 0,
    derrotas INT NOT NULL DEFAULT 0,
    wo INT NOT NULL DEFAULT 0,

    campeonatos_premier_cup INT NOT NULL DEFAULT 0,
    campeonatos_liga_prime INT NOT NULL DEFAULT 0,
    campeonatos_oficiais INT NOT NULL DEFAULT 0,
    campeonatos_comuns INT NOT NULL DEFAULT 0,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS ranking_times_historico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ranking_atual_id INT NOT NULL,  -- vínculo com o ranking antes do reset
    time_id INT NOT NULL,
    temporada INT NOT NULL,

    pontos INT NOT NULL DEFAULT 0,
    trofeus INT NOT NULL DEFAULT 0,
    total_partidas INT NOT NULL DEFAULT 0,
    vitorias INT NOT NULL DEFAULT 0,
    derrotas INT NOT NULL DEFAULT 0,
    wo INT NOT NULL DEFAULT 0,

    campeonatos_premier_cup INT NOT NULL DEFAULT 0,
    campeonatos_liga_prime INT NOT NULL DEFAULT 0,
    campeonatos_oficiais INT NOT NULL DEFAULT 0,
    campeonatos_comuns INT NOT NULL DEFAULT 0,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (ranking_atual_id) REFERENCES ranking_times_atual(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
);

-- Adicionar campo lado_inicial na tabela vetos_acoes (se a tabela já existir)
-- Execute este comando se a tabela vetos_acoes já existir sem o campo lado_inicial:
-- ALTER TABLE vetos_acoes ADD COLUMN lado_inicial ENUM('CT', 'TR') NULL AFTER ordem;













-- SISTEMA DE EMAIL DE CODIGO DE VERIFICAÇÃO


CREATE TABLE IF NOT EXISTS email_verificacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  expira_em DATETIME NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON email_verificacao(email);





CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    texto TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);