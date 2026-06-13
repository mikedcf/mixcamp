-- =============================================================================================
-- MIX CAMP — Schema compatível (mesmos nomes do código atual)
-- =============================================================================================
-- Substitui o db.sql bagunçado mantendo 100% compatibilidade com backend/frontend atuais.
-- Espelhado manualmente em backend/javascript/controller.js → setupDatabase().
--
-- O que foi corrigido (sem renomear tabelas/colunas usadas pelo código):
--   • Ordem de CREATE correta + FKs no final
--   • chaveamentos → inscricoes_campeonato (não campeonatos)
--   • premiacoes_campeonato.campeonato_id UNSIGNED (igual ao pai)
--   • inscricoes_times.time_id INT (igual times.id)
--   • membros_campeonato.campeonato_id UNSIGNED
--   • FKs completas: chaveamento, partidas, vetos, ranking
--   • cupons: uma definição só (versão atual)
--   • ranking_times_historico incluída
--   • Sem ALTER/UPDATE/DROP quebrados do db.sql antigo
--
-- O que foi MANTIDO de propósito (redundância — código usa hoje):
--   • usuarios.time_id
--   • times.lider_id
--   • inscricoes_campeonato.premiacao (soma; premiacoes_campeonato é detalhe)
--   • promover_eventos com campos denormalizados
--   • posicoes_img / img_map (formato wide)
--
-- Uso — banco vazio (apaga mixcamp inteiro):
--   mysql -u root -p < backend/sql/db_compat.sql
--
-- Uso — só recriar tabelas (sem apagar o database):
--   Comente as linhas DROP DATABASE / CREATE DATABASE abaixo.
--
-- ÍNDICE COMPLETO (47 tabelas):
--   usuarios, times, trofeus, medalhas, posicoes_img, img_map,
--   redes_sociais, destaques, usuario_medalhas, membros_time,
--   redes_sociais_time, destaques_time, noticias_time, games_time,
--   time_conquistas, solicitacoes_time, transferencias,
--   noticias_destaques, noticias_site, noticias_campeonato,
--   inscricoes_campeonato, premiacoes_campeonato, inscricoes_times,
--   membros_campeonato, cupons, cupons_resgatados, promover_eventos,
--   promocao_pendente_pagamento, chaveamentos, partidas,
--   resultados_partidas, posicoes_times, historico_movimentacoes,
--   vetos_sessoes, vetos_acoes, ranking_players_atual,
--   ranking_times_atual, ranking_times_historico,
--   historico_matchs_players, historico_matchs_times,
--   email_verificacao, email_verificado, notificacoes,
--   divulgar_links_picksbans, marcacoes_jogos, sessions,
--   security_audit_log
-- =============================================================================================

DROP DATABASE IF EXISTS mixcamp;

CREATE DATABASE mixcamp
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mixcamp;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================================
-- 1. TABELAS BASE
-- =============================================================================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    steamid VARCHAR(255) DEFAULT NULL,
    faceitid VARCHAR(255) DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_url VARCHAR(255) DEFAULT 'https://i.ibb.co/qMT9NVK5/user-2.webp',
    banner_url VARCHAR(255) DEFAULT 'https://i.ibb.co/GfpXkKWk/banner3-1.webp',
    sobre TEXT,
    time_id INT DEFAULT NULL,
    posicoes VARCHAR(255) DEFAULT NULL,
    gerencia ENUM('admin', 'moderador', 'streamer', 'apoiador', 'user') DEFAULT 'user',
    organizador ENUM('premium', 'intermediario', 'basico') DEFAULT NULL,
    cores_perfil VARCHAR(50) DEFAULT '#ffffff80',
    cfg_cs VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY uk_usuarios_username (username),
    UNIQUE KEY uk_usuarios_email (email),
    INDEX idx_usuarios_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tag VARCHAR(10) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lider_id INT NOT NULL,
    avatar_time_url VARCHAR(255) DEFAULT 'https://i.ibb.co/99tvNKGP/Chat-GPT-Image-24-de-nov-de-2025-12-19-41.png',
    banner_time_url VARCHAR(255) DEFAULT 'https://i.ibb.co/tPkZHy8R/banner-time.png',
    sobre_time TEXT,
    cores_perfil VARCHAR(50) DEFAULT '#ffffff80',
    UNIQUE KEY uk_times_nome (nome),
    UNIQUE KEY uk_times_tag (tag),
    INDEX idx_times_lider (lider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trofeus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    imagem_url VARCHAR(255) NOT NULL,
    iframe_url VARCHAR(255) DEFAULT NULL,
    edicao_campeonato VARCHAR(50) DEFAULT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE medalhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    imagem_url_campeao VARCHAR(255) NOT NULL,
    imagem_url_segundo VARCHAR(255) NOT NULL,
    iframe_url_campeao VARCHAR(255) DEFAULT NULL,
    iframe_url_segundo VARCHAR(255) DEFAULT NULL,
    iframe_url_terceiro VARCHAR(255) DEFAULT NULL,
    imagem_url_terceiro VARCHAR(255) DEFAULT NULL,
    edicao_campeonato VARCHAR(50) DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_medalhas_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE posicoes_img (
    id INT AUTO_INCREMENT PRIMARY KEY,
    capitao VARCHAR(255) DEFAULT NULL,
    awp VARCHAR(255) DEFAULT NULL,
    entry VARCHAR(255) DEFAULT NULL,
    support VARCHAR(255) DEFAULT NULL,
    igl VARCHAR(255) DEFAULT NULL,
    sub VARCHAR(255) DEFAULT NULL,
    coach VARCHAR(255) DEFAULT NULL,
    rifle VARCHAR(255) DEFAULT NULL,
    lurker VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE img_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================================
-- 2. USUÁRIOS — RELACIONAMENTOS
-- =============================================================================================

CREATE TABLE redes_sociais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    discord_url VARCHAR(255) DEFAULT NULL,
    youtube_url VARCHAR(255) DEFAULT NULL,
    instagram_url VARCHAR(255) DEFAULT NULL,
    twitter_url VARCHAR(255) DEFAULT NULL,
    twitch_url VARCHAR(255) DEFAULT NULL,
    faceit_url VARCHAR(255) DEFAULT NULL,
    gamesclub_url VARCHAR(255) DEFAULT NULL,
    steam_url VARCHAR(255) DEFAULT NULL,
    tiktok_url VARCHAR(255) DEFAULT NULL,
    kick_url VARCHAR(255) DEFAULT NULL,
    allstar_url VARCHAR(255) DEFAULT NULL,
    INDEX idx_redes_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE destaques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    ordem INT DEFAULT NULL,
    INDEX idx_destaques_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario_medalhas (
    usuario_id INT NOT NULL,
    medalha_id INT NOT NULL,
    position_medalha ENUM('campeao', 'segundo', 'terceiro') DEFAULT NULL,
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, medalha_id),
    INDEX idx_um_medalha (medalha_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 3. TIMES — RELACIONAMENTOS
-- =============================================================================================

CREATE TABLE membros_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    funcao ENUM('lider', 'titular', 'reserva', 'coach') NOT NULL,
    posicao ENUM('awp', 'entry', 'support', 'igl', 'lurker', 'rifle') NOT NULL,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_usuario_time (usuario_id, time_id),
    INDEX idx_membros_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE redes_sociais_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    discord_url VARCHAR(255) DEFAULT NULL,
    youtube_url VARCHAR(255) DEFAULT NULL,
    instagram_url VARCHAR(255) DEFAULT NULL,
    twitter_url VARCHAR(255) DEFAULT NULL,
    twitch_url VARCHAR(255) DEFAULT NULL,
    faceit_url VARCHAR(255) DEFAULT NULL,
    gamesclub_url VARCHAR(255) DEFAULT NULL,
    steam_url VARCHAR(255) DEFAULT NULL,
    tiktok_url VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY uk_redes_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE destaques_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    ordem INT DEFAULT NULL,
    INDEX idx_destaques_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE noticias_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_noticias_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE games_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    game_name TEXT NOT NULL,
    INDEX idx_games_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE time_conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    trofeu_id INT NOT NULL,
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tc_time (time_id),
    INDEX idx_tc_trofeu (trofeu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 4. SOLICITAÇÕES E TRANSFERÊNCIAS
-- =============================================================================================

CREATE TABLE solicitacoes_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    posicao ENUM('awp', 'entry', 'support', 'igl', 'coach', 'rifle', 'lurker') NOT NULL DEFAULT 'rifle',
    status ENUM('pendente', 'aceita', 'recusada') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_solicitacoes_usuario (usuario_id),
    INDEX idx_solicitacoes_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transferencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    posicao ENUM('awp', 'entry', 'support', 'igl', 'coach', 'rifle', 'lurker') NOT NULL DEFAULT 'rifle',
    tipo ENUM('entrada', 'saida') NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transferencias_usuario (usuario_id),
    INDEX idx_transferencias_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 5. NOTÍCIAS
-- =============================================================================================

CREATE TABLE noticias_destaques (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'destaque',
    destaque ENUM('sim', 'nao') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE noticias_site (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'site',
    categoria ENUM('mobile', 'segurança', 'interface', 'sistema', 'regras', 'noticias', 'eventos', 'outros') NOT NULL DEFAULT 'outros',
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    versao VARCHAR(100) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE noticias_campeonato (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL DEFAULT 'campeonato',
    destaque ENUM('vencedor', 'destaque', 'estatisticas', 'proximo', 'novidade') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    autor VARCHAR(150) NOT NULL,
    imagem_url VARCHAR(1000) DEFAULT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 6. CAMPEONATOS E INSCRIÇÕES
-- =============================================================================================

CREATE TABLE inscricoes_campeonato (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('oficial', 'comum') NOT NULL DEFAULT 'comum',
    mixcamp VARCHAR(100) NOT NULL DEFAULT 'desconhecido',
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    transmissao ENUM('sim', 'nao') NOT NULL DEFAULT 'nao',
    preco_inscricao DECIMAL(10, 2) NOT NULL,
    premiacao DECIMAL(10, 2) NOT NULL COMMENT 'Total; detalhe em premiacoes_campeonato',
    imagem_url VARCHAR(1000) DEFAULT NULL,
    trofeu_id INT DEFAULT NULL,
    medalha_id INT DEFAULT NULL,
    chave VARCHAR(100) NOT NULL,
    edicao_campeonato VARCHAR(50) DEFAULT NULL,
    plataforma VARCHAR(100) DEFAULT 'FACEIT',
    game VARCHAR(100) DEFAULT 'CS2',
    nivel VARCHAR(100) DEFAULT '1-10',
    formato VARCHAR(100) DEFAULT '5v5',
    qnt_times ENUM('6', '8', '10', '12', '14', '16', '18', '20', '24', '28', '32') NOT NULL,
    regras TEXT NOT NULL,
    id_organizador INT NOT NULL,
    link_hub VARCHAR(200) NOT NULL,
    link_convite VARCHAR(200) NOT NULL,
    link_whatsapp VARCHAR(255) DEFAULT NULL,
    status ENUM('em breve', 'disponivel', 'andamento', 'encerrado', 'cancelado') NOT NULL DEFAULT 'disponivel',
    previsao_data_inicio DATETIME NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inscricoes_organizador (id_organizador),
    INDEX idx_inscricoes_trofeu (trofeu_id),
    INDEX idx_inscricoes_medalha (medalha_id),
    INDEX idx_inscricoes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- premiacoes_campeonato — prêmios por colocação (1º, 2º, 3º)
CREATE TABLE premiacoes_campeonato (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT UNSIGNED NOT NULL,
    posicao ENUM('primeiro', 'segundo', 'terceiro') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY uk_premiacao_campeonato_posicao (campeonato_id, posicao),
    INDEX idx_premiacoes_campeonato (campeonato_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inscricoes_times (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscricao_id INT UNSIGNED NOT NULL,
    time_id INT NOT NULL,
    payment_id VARCHAR(100) DEFAULT NULL,
    status_pagamento ENUM('approved', 'pending', 'rejected', 'cancelled', 'refunded') DEFAULT NULL,
    valor_pago DECIMAL(10, 2) DEFAULT NULL,
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_pagamento TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY unique_inscricao_time (inscricao_id, time_id),
    INDEX idx_inscricoes_times_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE membros_campeonato (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT UNSIGNED NOT NULL,
    usuario_id INT NOT NULL,
    time_id INT NOT NULL,
    posicao ENUM('awp', 'entry', 'support', 'igl', 'lurker', 'rifle') NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_membros_camp_campeonato (campeonato_id),
    INDEX idx_membros_camp_usuario (usuario_id),
    INDEX idx_membros_camp_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 7. CUPONS E PROMOÇÃO
-- =============================================================================================

CREATE TABLE cupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT DEFAULT NULL,
    desconto_percentual DECIMAL(5, 2) DEFAULT NULL,
    id_item INT DEFAULT NULL,
    id_trofeu INT DEFAULT NULL,
    id_medalha INT DEFAULT NULL,
    usos_maximos INT DEFAULT 1,
    usos_restantes INT DEFAULT 1,
    data_expiracao DATETIME DEFAULT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cupons_codigo (codigo),
    INDEX idx_cupons_trofeu (id_trofeu),
    INDEX idx_cupons_medalha (id_medalha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cupons_resgatados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cupom_id INT NOT NULL,
    data_resgate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cupons_resgatados_usuario (usuario_id),
    INDEX idx_cupons_resgatados_cupom (cupom_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promover_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    data_inicio DATETIME NOT NULL,
    premiacao DECIMAL(10, 2) NOT NULL,
    valor_inscricao DECIMAL(10, 2) NOT NULL,
    qnt_times INT NOT NULL,
    chave VARCHAR(100) NOT NULL,
    game VARCHAR(100) NOT NULL,
    plataforma VARCHAR(100) NOT NULL,
    banner_img VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_encerramento DATETIME NOT NULL,
    banner_local ENUM('home', 'campeonato', 'ambos') NOT NULL,
    plano_assinado ENUM('basico', 'premium', 'maximo') NOT NULL,
    status_promover_evento ENUM('disponivel', 'encerrado') NOT NULL DEFAULT 'disponivel',
    INDEX idx_promover_evento (evento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promocao_pendente_pagamento (
    external_reference VARCHAR(191) PRIMARY KEY,
    body_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 8. CHAVEAMENTO
-- =============================================================================================

CREATE TABLE chaveamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT UNSIGNED NOT NULL,
    formato_chave ENUM('single_b01', 'single_bo3_all', 'major_playoffs_bo3', 'double_elimination') NOT NULL,
    quantidade_times INT NOT NULL,
    status ENUM('nao_iniciado', 'em_andamento', 'finalizado') DEFAULT 'nao_iniciado',
    campeao_time_id INT DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_campeonato (campeonato_id),
    INDEX idx_chave_status (status),
    INDEX idx_chave_campeonato (campeonato_id),
    INDEX idx_chave_campeao (campeao_time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chaveamento_id INT NOT NULL,
    match_id VARCHAR(100) NOT NULL,
    round_num INT NOT NULL,
    bracket_type ENUM('upper', 'lower', 'grand_final') NOT NULL,
    formato_partida ENUM('B01', 'B03', 'B05') NOT NULL,
    time1_id INT DEFAULT NULL,
    time2_id INT DEFAULT NULL,
    time_vencedor_id INT DEFAULT NULL,
    score_time1 INT DEFAULT 0,
    score_time2 INT DEFAULT 0,
    status ENUM('agendada', 'em_andamento', 'finalizada', 'cancelada') DEFAULT 'agendada',
    data_partida DATETIME DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_match (chaveamento_id, match_id),
    INDEX idx_partidas_chaveamento (chaveamento_id),
    INDEX idx_partidas_match_id (match_id),
    INDEX idx_partidas_status (status),
    INDEX idx_partidas_round (round_num, bracket_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resultados_partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    mapa_num INT NOT NULL,
    score_time1 INT NOT NULL DEFAULT 0,
    score_time2 INT NOT NULL DEFAULT 0,
    time_vencedor_mapa INT DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_partida_mapa (partida_id, mapa_num),
    INDEX idx_resultados_partida (partida_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE posicoes_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chaveamento_id INT NOT NULL,
    time_id INT NOT NULL,
    bracket_type ENUM('upper', 'lower', 'eliminado', 'campeao') NOT NULL,
    round_atual INT DEFAULT NULL,
    match_id_atual VARCHAR(100) DEFAULT NULL,
    status ENUM('ativo', 'eliminado', 'campeao') DEFAULT 'ativo',
    data_eliminacao TIMESTAMP NULL DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_time_chaveamento (chaveamento_id, time_id),
    INDEX idx_posicoes_chaveamento (chaveamento_id),
    INDEX idx_posicoes_time (time_id),
    INDEX idx_posicoes_status (status),
    INDEX idx_posicoes_bracket (bracket_type, round_atual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historico_movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chaveamento_id INT NOT NULL,
    time_id INT NOT NULL,
    tipo_movimentacao ENUM('avancou_upper', 'caiu_lower', 'avancou_lower', 'eliminado', 'campeao') NOT NULL,
    round_origem INT DEFAULT NULL,
    round_destino INT DEFAULT NULL,
    match_id_origem VARCHAR(100) DEFAULT NULL,
    match_id_destino VARCHAR(100) DEFAULT NULL,
    partida_id INT DEFAULT NULL,
    observacao TEXT DEFAULT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_historico_chaveamento (chaveamento_id),
    INDEX idx_historico_time (time_id),
    INDEX idx_historico_tipo (tipo_movimentacao),
    INDEX idx_historico_partida (partida_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 9. VETOS
-- =============================================================================================

CREATE TABLE vetos_sessoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT DEFAULT NULL,
    campeonato_id INT UNSIGNED DEFAULT NULL,
    formato ENUM('bo1', 'bo3', 'bo5') NOT NULL,
    mapas_selecionados JSON NOT NULL,
    time_a_id INT DEFAULT NULL,
    time_b_id INT DEFAULT NULL,
    token_a VARCHAR(255) NOT NULL,
    token_b VARCHAR(255) NOT NULL,
    token_spectator VARCHAR(255) DEFAULT NULL,
    turno_atual ENUM('time_a', 'time_b') DEFAULT 'time_a',
    status ENUM('configurado', 'em_andamento', 'finalizado') DEFAULT 'configurado',
    time_a_pronto BOOLEAN DEFAULT FALSE,
    time_b_pronto BOOLEAN DEFAULT FALSE,
    sorteio_realizado BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_vetos_token_a (token_a),
    UNIQUE KEY uk_vetos_token_b (token_b),
    INDEX idx_vetos_partida (partida_id),
    INDEX idx_vetos_campeonato (campeonato_id),
    INDEX idx_vetos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vetos_acoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sessao_id INT NOT NULL,
    mapa VARCHAR(50) NOT NULL,
    acao ENUM('pick', 'ban') NOT NULL,
    time_id INT DEFAULT NULL,
    ordem INT NOT NULL,
    lado_inicial ENUM('CT', 'TR') DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vetos_acoes_sessao (sessao_id),
    INDEX idx_vetos_acoes_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 10. RANKING
-- =============================================================================================

CREATE TABLE ranking_players_atual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    ranking_atual INT NOT NULL DEFAULT 0,
    total_partidas INT NOT NULL DEFAULT 0,
    vitorias INT NOT NULL DEFAULT 0,
    derrotas INT NOT NULL DEFAULT 0,
    wo INT NOT NULL DEFAULT 0,
    campeonatos_mx_extreme INT NOT NULL DEFAULT 0,
    campeonatos_mx_league INT NOT NULL DEFAULT 0,
    campeonatos_oficiais INT NOT NULL DEFAULT 0,
    campeonatos_comuns INT NOT NULL DEFAULT 0,
    medalhas INT NOT NULL DEFAULT 0,
    pontos INT NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ranking_player_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ranking_times_atual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    ranking_atual INT NOT NULL DEFAULT 0,
    trofeus INT NOT NULL DEFAULT 0,
    total_partidas INT NOT NULL DEFAULT 0,
    vitorias INT NOT NULL DEFAULT 0,
    derrotas INT NOT NULL DEFAULT 0,
    wo INT NOT NULL DEFAULT 0,
    campeonatos_mx_extreme INT NOT NULL DEFAULT 0,
    campeonatos_mx_league INT NOT NULL DEFAULT 0,
    campeonatos_oficiais INT NOT NULL DEFAULT 0,
    campeonatos_comuns INT NOT NULL DEFAULT 0,
    pontos INT NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ranking_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ranking_times_historico — snapshot por temporada do ranking de times
CREATE TABLE ranking_times_historico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ranking_atual_id INT NOT NULL,
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
    INDEX idx_ranking_hist_atual (ranking_atual_id),
    INDEX idx_ranking_hist_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historico_matchs_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    resultado ENUM('win', 'lose', 'wo') NOT NULL DEFAULT 'wo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hmp_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historico_matchs_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    resultado ENUM('win', 'lose', 'wo') NOT NULL DEFAULT 'wo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hmt_time (time_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 11. EMAIL, NOTIFICAÇÕES, DIVULGAÇÃO, DISCORD
-- =============================================================================================

CREATE TABLE email_verificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_verificacao_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_verificado (
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    verificado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    texto TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notificacoes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE divulgar_links_picksbans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id_a INT NOT NULL,
    time_id_b INT NOT NULL,
    link_espectador VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_divulgar_a (time_id_a),
    INDEX idx_divulgar_b (time_id_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE marcacoes_jogos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    primeiro_time_nome VARCHAR(255) NOT NULL,
    segundo_time_nome VARCHAR(255) NOT NULL,
    horario_inicio TIME NOT NULL,
    data_do_jogo DATE NOT NULL,
    campeonatos ENUM('mx_extreme', 'mx_league') NOT NULL,
    season INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_marcacoes_usuario (usuario_id),
    INDEX idx_marcacoes_data (data_do_jogo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 12. SEGURANÇA E SESSÕES
-- =============================================================================================

CREATE TABLE sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    INDEX IDX_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE security_audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code SMALLINT NOT NULL,
    user_agent VARCHAR(300) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX IDX_audit_created (created_at),
    INDEX IDX_audit_status (status_code),
    INDEX IDX_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================================
-- 13. FOREIGN KEYS
-- =============================================================================================

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuario_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE times
    ADD CONSTRAINT fk_time_lider
    FOREIGN KEY (lider_id) REFERENCES usuarios (id) ON DELETE RESTRICT;

ALTER TABLE redes_sociais
    ADD CONSTRAINT fk_redes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;

ALTER TABLE destaques
    ADD CONSTRAINT fk_destaques_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;

ALTER TABLE usuario_medalhas
    ADD CONSTRAINT fk_um_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_um_medalha
    FOREIGN KEY (medalha_id) REFERENCES medalhas (id) ON DELETE CASCADE;

ALTER TABLE membros_time
    ADD CONSTRAINT fk_membros_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_membros_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE redes_sociais_time
    ADD CONSTRAINT fk_redes_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE destaques_time
    ADD CONSTRAINT fk_destaques_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE noticias_time
    ADD CONSTRAINT fk_noticias_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE games_time
    ADD CONSTRAINT fk_games_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE time_conquistas
    ADD CONSTRAINT fk_tc_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_tc_trofeu
    FOREIGN KEY (trofeu_id) REFERENCES trofeus (id) ON DELETE CASCADE;

ALTER TABLE solicitacoes_time
    ADD CONSTRAINT fk_solicitacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_solicitacoes_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE transferencias
    ADD CONSTRAINT fk_transferencias_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_transferencias_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE inscricoes_campeonato
    ADD CONSTRAINT fk_inscricoes_organizador
    FOREIGN KEY (id_organizador) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_inscricoes_trofeu
    FOREIGN KEY (trofeu_id) REFERENCES trofeus (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_inscricoes_medalha
    FOREIGN KEY (medalha_id) REFERENCES medalhas (id) ON DELETE SET NULL;

ALTER TABLE premiacoes_campeonato
    ADD CONSTRAINT fk_premiacoes_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE;

ALTER TABLE inscricoes_times
    ADD CONSTRAINT fk_inscricoes_times_inscricao
    FOREIGN KEY (inscricao_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_inscricoes_times_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE membros_campeonato
    ADD CONSTRAINT fk_membros_campeonato_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_membros_campeonato_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_membros_campeonato_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE cupons
    ADD CONSTRAINT fk_cupons_trofeu
    FOREIGN KEY (id_trofeu) REFERENCES trofeus (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_cupons_medalha
    FOREIGN KEY (id_medalha) REFERENCES medalhas (id) ON DELETE SET NULL;

ALTER TABLE cupons_resgatados
    ADD CONSTRAINT fk_cupons_resgatados_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_cupons_resgatados_cupom
    FOREIGN KEY (cupom_id) REFERENCES cupons (id) ON DELETE CASCADE;

ALTER TABLE promover_eventos
    ADD CONSTRAINT fk_promover_eventos_campeonato
    FOREIGN KEY (evento_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE;

ALTER TABLE chaveamentos
    ADD CONSTRAINT fk_chave_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_chave_campeao
    FOREIGN KEY (campeao_time_id) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE partidas
    ADD CONSTRAINT fk_partida_chave
    FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_partida_time1
    FOREIGN KEY (time1_id) REFERENCES times (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_partida_time2
    FOREIGN KEY (time2_id) REFERENCES times (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_partida_vencedor
    FOREIGN KEY (time_vencedor_id) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE resultados_partidas
    ADD CONSTRAINT fk_resultados_partida
    FOREIGN KEY (partida_id) REFERENCES partidas (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_resultados_vencedor_mapa
    FOREIGN KEY (time_vencedor_mapa) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE posicoes_times
    ADD CONSTRAINT fk_posicoes_chaveamento
    FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_posicoes_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE historico_movimentacoes
    ADD CONSTRAINT fk_historico_chaveamento
    FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_historico_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_historico_partida
    FOREIGN KEY (partida_id) REFERENCES partidas (id) ON DELETE SET NULL;

ALTER TABLE vetos_sessoes
    ADD CONSTRAINT fk_vetos_sessoes_partida
    FOREIGN KEY (partida_id) REFERENCES partidas (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_vetos_sessoes_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_vetos_sessoes_time_a
    FOREIGN KEY (time_a_id) REFERENCES times (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_vetos_sessoes_time_b
    FOREIGN KEY (time_b_id) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE vetos_acoes
    ADD CONSTRAINT fk_vetos_acoes_sessao
    FOREIGN KEY (sessao_id) REFERENCES vetos_sessoes (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_vetos_acoes_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE SET NULL;

ALTER TABLE ranking_players_atual
    ADD CONSTRAINT fk_ranking_players_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;

ALTER TABLE ranking_times_atual
    ADD CONSTRAINT fk_ranking_times_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE ranking_times_historico
    ADD CONSTRAINT fk_ranking_historico_atual
    FOREIGN KEY (ranking_atual_id) REFERENCES ranking_times_atual (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ranking_historico_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE historico_matchs_players
    ADD CONSTRAINT fk_hmp_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;

ALTER TABLE historico_matchs_times
    ADD CONSTRAINT fk_hmt_time
    FOREIGN KEY (time_id) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE notificacoes
    ADD CONSTRAINT fk_notificacoes_user
    FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE;

ALTER TABLE divulgar_links_picksbans
    ADD CONSTRAINT fk_divulgar_time_a
    FOREIGN KEY (time_id_a) REFERENCES times (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_divulgar_time_b
    FOREIGN KEY (time_id_b) REFERENCES times (id) ON DELETE CASCADE;

ALTER TABLE marcacoes_jogos
    ADD CONSTRAINT fk_marcacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================================
-- Fim — 47 tabelas | 2 seeds (posicoes_img, img_map) | compatível com controller.js + frontend atuais
-- =============================================================================================
