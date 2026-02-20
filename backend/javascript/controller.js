const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const bcrypt = require('bcrypt');
const FormData = require('form-data');
const crypto = require('crypto');
const axios = require("axios");
const {Resend} = require("resend")
// const fetch = require('node-fetch');
const { conectar, desconectar } = require('./db');
const { validarEmail, validarSenha, validarCaracteres } = require('./auth');

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: process.env.APIKEYMERCADOPAGO });

const saltRounds = 10;
const cloudName = process.env.APIKEYCLOUDINARY;
const uploadPreset = process.env.APIKEYUPLOAD;
const apiKey = process.env.APIKEYFACEIT
const steamApiKey = process.env.APIKEYSTEAM;
const resend = new Resend(process.env.RESEND_KEY);


async function setupDatabase() {
    const conexao = await conectar()

    console.log("🔄 Iniciando configuração do banco...")

    await conexao.execute(`SET FOREIGN_KEY_CHECKS = 0;`)

    /*
    =====================================================
    1️⃣ TABELAS BASE (SEM DEPENDÊNCIA)
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        steamid VARCHAR(255) DEFAULT NULL,
        faceitid VARCHAR(255) DEFAULT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        avatar_url VARCHAR(255) DEFAULT 'https://i.ibb.co/qMT9NVK5/user-2.webp',
        banner_url VARCHAR(255) DEFAULT 'https://i.ibb.co/GfpXkKWk/banner3-1.webp',
        sobre TEXT,
        time_id INT NULL,
        posicoes ENUM('','capitao','awp','entry','support','igl','sub','coach') NOT NULL,
        gerencia ENUM('admin','moderador','gerente','user') DEFAULT 'user',
        organizador ENUM('premium','simples') DEFAULT NULL,
        cores_perfil VARCHAR(50) DEFAULT '#ffffff80'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS times (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        tag VARCHAR(10) NOT NULL UNIQUE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lider_id INT NOT NULL,
        avatar_time_url VARCHAR(255) DEFAULT 'https://i.ibb.co/99tvNKGP/Chat-GPT-Image-24-de-nov-de-2025-12-19-41.png',
        banner_time_url VARCHAR(255) DEFAULT 'https://i.ibb.co/tPkZHy8R/banner-time.png',
        sobre_time TEXT,
        cores_perfil VARCHAR(50) DEFAULT '#ffffff80'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS trofeus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        imagem_url VARCHAR(255) NOT NULL,
        iframe_url VARCHAR(255),
        edicao_campeonato VARCHAR(50),
        categoria VARCHAR(100),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS medalhas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        imagem_url_campeao VARCHAR(255) NOT NULL,
        imagem_url_segundo VARCHAR(255) NOT NULL,
        iframe_url_campeao VARCHAR(255),
        iframe_url_segundo VARCHAR(255),
        edicao_campeonato VARCHAR(50),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS posicoes_img (
        id INT PRIMARY KEY AUTO_INCREMENT,
        capitao VARCHAR(255),
        awp VARCHAR(255),
        entry VARCHAR(255),
        support VARCHAR(255),
        igl VARCHAR(255),
        sub VARCHAR(255),
        coach VARCHAR(255),
        rifle VARCHAR(255),
        lurker VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    2️⃣ TABELAS RELACIONAIS - USUÁRIOS
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS redes_sociais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        discord_url VARCHAR(255),
        youtube_url VARCHAR(255),
        instagram_url VARCHAR(255),
        twitter_url VARCHAR(255),
        twitch_url VARCHAR(255),
        faceit_url VARCHAR(255),
        gamesclub_url VARCHAR(255),
        steam_url VARCHAR(255),
        tiktok_url VARCHAR(255),
        kick_url VARCHAR(255),
        allstar_url VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS destaques (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        ordem INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS usuario_medalhas (
        usuario_id INT NOT NULL,
        medalha_id INT NOT NULL,
        position_medalha ENUM('campeao','segundo','terceiro'),
        data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (usuario_id, medalha_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    3️⃣ TABELAS RELACIONAIS - TIMES
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS membros_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        time_id INT NOT NULL,
        funcao ENUM('titular','reserva','coach') NOT NULL,
        posicao ENUM('capitao','awp','entry','support','igl','sub','coach','lurker','rifle') NOT NULL,
        data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_usuario_time (usuario_id, time_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS redes_sociais_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_id INT NOT NULL,
        discord_url VARCHAR(255),
        youtube_url VARCHAR(255),
        instagram_url VARCHAR(255),
        twitter_url VARCHAR(255),
        twitch_url VARCHAR(255),
        faceit_url VARCHAR(255),
        gamesclub_url VARCHAR(255),
        steam_url VARCHAR(255),
        tiktok_url VARCHAR(255),
        UNIQUE KEY uk_redes_time (time_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS destaques_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_id INT NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        ordem INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS noticias_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_id INT NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        conteudo TEXT NOT NULL,
        data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS games_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_id INT NOT NULL,
        game_name TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS time_conquistas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_id INT NOT NULL,
        trofeu_id INT NOT NULL,
        data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    4️⃣ SOLICITAÇÕES E TRANSFERÊNCIAS
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS solicitacoes_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        time_id INT NOT NULL,
        posicao ENUM('awp','entry','support','igl','sub','coach','rifle','lurker') NOT NULL,
        status ENUM('pendente','aceita','recusada') DEFAULT 'pendente',
        data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS transferencias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        time_id INT NOT NULL,
        posicao ENUM('awp','entry','support','igl','sub','coach','rifle','lurker') NOT NULL,
        tipo ENUM('entrada','saida') NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    5️⃣ NOTÍCIAS
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS noticias_destaques (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL DEFAULT 'destaque',
        destaque ENUM('sim','nao') NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        subtitulo VARCHAR(255) NOT NULL,
        texto TEXT NOT NULL,
        autor VARCHAR(150) NOT NULL,
        imagem_url VARCHAR(1000) DEFAULT NULL,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS noticias_site (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL DEFAULT 'site',
        categoria ENUM('mobile','segurança','interface','sistema','regras','noticias','eventos','outros') NOT NULL DEFAULT 'outros',
        titulo VARCHAR(255) NOT NULL,
        subtitulo VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        autor VARCHAR(150) NOT NULL,
        versao VARCHAR(100) NOT NULL,
        imagem_url VARCHAR(1000) DEFAULT NULL,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS noticias_campeonato (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL DEFAULT 'campeonato',
        destaque ENUM('vencedor','destaque','estatisticas','proximo','novidade') NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        texto TEXT NOT NULL,
        autor VARCHAR(150) NOT NULL,
        imagem_url VARCHAR(1000) DEFAULT NULL,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    6️⃣ INSCRIÇÕES DE CAMPEONATOS
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS inscricoes_campeonato (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('oficial','comum') NOT NULL DEFAULT 'comum',
        mixcamp VARCHAR(100) NOT NULL DEFAULT 'desconhecido',
        titulo VARCHAR(100) NOT NULL,
        descricao TEXT NOT NULL,
        transmissao ENUM('sim','nao') NOT NULL DEFAULT 'nao',
        preco_inscricao DECIMAL(10, 2) NOT NULL,
        premiacao DECIMAL(10, 2) NOT NULL,
        imagem_url VARCHAR(1000) DEFAULT NULL,
        trofeu_id INT,
        medalha_id INT,
        chave VARCHAR(100) NOT NULL,
        edicao_campeonato VARCHAR(50),
        plataforma VARCHAR(100) DEFAULT 'FACEIT',
        game VARCHAR(100) DEFAULT 'CS2',
        nivel VARCHAR(100) DEFAULT '1-10',
        formato VARCHAR(100) DEFAULT '5v5',
        qnt_times ENUM('6','8','10','12','14','16','18','20','24','28','32') NOT NULL,
        regras TEXT NOT NULL,
        id_organizador INT UNSIGNED NOT NULL,
        link_hub VARCHAR(200) NOT NULL,
        link_convite VARCHAR(200) NOT NULL,
        status ENUM('em breve','disponivel','andamento','encerrado','cancelado') NOT NULL DEFAULT 'disponivel',
        previsao_data_inicio DATETIME NOT NULL,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS inscricoes_times (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        inscricao_id INT UNSIGNED NOT NULL,
        time_id INT UNSIGNED NOT NULL,
        payment_id VARCHAR(100) DEFAULT NULL,
        status_pagamento ENUM('approved','pending','rejected','cancelled','refunded') DEFAULT NULL,
        valor_pago DECIMAL(10, 2) DEFAULT NULL,
        data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_pagamento TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY unique_inscricao_time (inscricao_id, time_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS membros_campeonato (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campeonato_id INT NOT NULL,
        usuario_id INT NOT NULL,
        time_id INT NOT NULL,
        posicao ENUM('awp','entry','support','igl','sub','coach','rifle','lurker') NOT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    7️⃣ CUPONS
    =====================================================
    */

    await conexao.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS cupons_resgatados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        cupom_id INT NOT NULL,
        data_resgate DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_usuario_cupom (usuario_id, cupom_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    8️⃣ CHAVEAMENTO
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS chaveamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campeonato_id INT NOT NULL,
        formato_chave ENUM('single_b01','single_bo3_all','major_playoffs_bo3','double_elimination') NOT NULL,
        quantidade_times INT NOT NULL,
        status ENUM('nao_iniciado','em_andamento','finalizado') DEFAULT 'nao_iniciado',
        campeao_time_id INT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_campeonato (campeonato_id),
        INDEX idx_status (status),
        INDEX idx_campeonato (campeonato_id),
        INDEX idx_campeao (campeao_time_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS partidas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chaveamento_id INT NOT NULL,
        match_id VARCHAR(100) NOT NULL,
        round_num INT NOT NULL,
        bracket_type ENUM('upper','lower','grand_final') NOT NULL,
        formato_partida ENUM('B01','B03','B05') NOT NULL,
        time1_id INT NULL,
        time2_id INT NULL,
        time_vencedor_id INT NULL,
        score_time1 INT DEFAULT 0,
        score_time2 INT DEFAULT 0,
        status ENUM('agendada','em_andamento','finalizada','cancelada') DEFAULT 'agendada',
        data_partida DATETIME NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_chaveamento (chaveamento_id),
        INDEX idx_match_id (match_id),
        INDEX idx_status (status),
        INDEX idx_round (round_num, bracket_type),
        UNIQUE KEY unique_match (chaveamento_id, match_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS resultados_partidas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partida_id INT NOT NULL,
        mapa_num INT NOT NULL,
        score_time1 INT NOT NULL DEFAULT 0,
        score_time2 INT NOT NULL DEFAULT 0,
        time_vencedor_mapa INT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_partida (partida_id),
        INDEX idx_mapa (partida_id, mapa_num),
        UNIQUE KEY unique_partida_mapa (partida_id, mapa_num)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS posicoes_times (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chaveamento_id INT NOT NULL,
        time_id INT NOT NULL,
        bracket_type ENUM('upper','lower','eliminado','campeao') NOT NULL,
        round_atual INT NULL,
        match_id_atual VARCHAR(100) NULL,
        status ENUM('ativo','eliminado','campeao') DEFAULT 'ativo',
        data_eliminacao TIMESTAMP NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_chaveamento (chaveamento_id),
        INDEX idx_time (time_id),
        INDEX idx_status (status),
        INDEX idx_bracket (bracket_type, round_atual),
        UNIQUE KEY unique_time_chaveamento (chaveamento_id, time_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS historico_movimentacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chaveamento_id INT NOT NULL,
        time_id INT NOT NULL,
        tipo_movimentacao ENUM('avancou_upper','caiu_lower','avancou_lower','eliminado','campeao') NOT NULL,
        round_origem INT NULL,
        round_destino INT NULL,
        match_id_origem VARCHAR(100) NULL,
        match_id_destino VARCHAR(100) NULL,
        partida_id INT NULL,
        observacao TEXT NULL,
        data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chaveamento (chaveamento_id),
        INDEX idx_time (time_id),
        INDEX idx_tipo (tipo_movimentacao),
        INDEX idx_data (data_movimentacao)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    9️⃣ VETOS DE MAPAS
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS vetos_sessoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partida_id INT NULL,
        campeonato_id INT NULL,
        formato ENUM('bo1','bo3','bo5') NOT NULL,
        mapas_selecionados JSON NOT NULL,
        time_a_id INT NULL,
        time_b_id INT NULL,
        token_a VARCHAR(255) NOT NULL UNIQUE,
        token_b VARCHAR(255) NOT NULL UNIQUE,
        token_spectator VARCHAR(255) NULL,
        turno_atual ENUM('time_a','time_b') DEFAULT 'time_a',
        status ENUM('configurado','em_andamento','finalizado') DEFAULT 'configurado',
        time_a_pronto BOOLEAN DEFAULT FALSE,
        time_b_pronto BOOLEAN DEFAULT FALSE,
        sorteio_realizado BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_token_a (token_a),
        INDEX idx_token_b (token_b),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS vetos_acoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sessao_id INT NOT NULL,
        mapa VARCHAR(50) NOT NULL,
        acao ENUM('pick','ban') NOT NULL,
        time_id INT NULL,
        ordem INT NOT NULL,
        lado_inicial ENUM('CT','TR') NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sessao (sessao_id),
        INDEX idx_ordem (ordem)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    🔟 RANKING
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS ranking_times_atual (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS ranking_times_historico (
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
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    /*
    =====================================================
    1️⃣1️⃣ SISTEMA DE EMAIL
    =====================================================
    */

    await conexao.execute(`
    CREATE TABLE IF NOT EXISTS email_verificacao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        codigo VARCHAR(6) NOT NULL,
        expira_em DATETIME NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await conexao.execute(`
        CREATE INDEX idx_email ON email_verificacao(email);
    `).catch(()=>{})

    /*
    =====================================================
    1️⃣2️⃣ FOREIGN KEYS (APÓS TODAS AS TABELAS EXISTIREM)
    =====================================================
    */

    const foreignKeys = [
        `ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE SET NULL;`,

        `ALTER TABLE times ADD CONSTRAINT fk_time_lider
         FOREIGN KEY (lider_id) REFERENCES usuarios(id)
         ON DELETE SET NULL;`,

        `ALTER TABLE redes_sociais ADD CONSTRAINT fk_redes_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE destaques ADD CONSTRAINT fk_destaques_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE usuario_medalhas ADD CONSTRAINT fk_um_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE usuario_medalhas ADD CONSTRAINT fk_um_medalha
         FOREIGN KEY (medalha_id) REFERENCES medalhas(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE membros_time ADD CONSTRAINT fk_membros_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE membros_time ADD CONSTRAINT fk_membros_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE redes_sociais_time ADD CONSTRAINT fk_redes_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE destaques_time ADD CONSTRAINT fk_destaques_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE noticias_time ADD CONSTRAINT fk_noticias_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE games_time ADD CONSTRAINT fk_games_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE time_conquistas ADD CONSTRAINT fk_tc_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE time_conquistas ADD CONSTRAINT fk_tc_trofeu
         FOREIGN KEY (trofeu_id) REFERENCES trofeus(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE solicitacoes_time ADD CONSTRAINT fk_solicitacoes_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE solicitacoes_time ADD CONSTRAINT fk_solicitacoes_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE transferencias ADD CONSTRAINT fk_transferencias_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id);`,

        `ALTER TABLE transferencias ADD CONSTRAINT fk_transferencias_time
         FOREIGN KEY (time_id) REFERENCES times(id);`,

        `ALTER TABLE inscricoes_campeonato ADD CONSTRAINT fk_inscricoes_organizador
         FOREIGN KEY (id_organizador) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE inscricoes_campeonato ADD CONSTRAINT fk_inscricoes_trofeu
         FOREIGN KEY (trofeu_id) REFERENCES time_conquistas(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE inscricoes_campeonato ADD CONSTRAINT fk_inscricoes_medalha
         FOREIGN KEY (medalha_id) REFERENCES medalhas(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE inscricoes_times ADD CONSTRAINT fk_inscricoes_times_inscricao
         FOREIGN KEY (inscricao_id) REFERENCES inscricoes_campeonato(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE inscricoes_times ADD CONSTRAINT fk_inscricoes_times_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE membros_campeonato ADD CONSTRAINT fk_membros_campeonato_campeonato
         FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE membros_campeonato ADD CONSTRAINT fk_membros_campeonato_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE membros_campeonato ADD CONSTRAINT fk_membros_campeonato_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE cupons_resgatados ADD CONSTRAINT fk_cupons_resgatados_usuario
         FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE cupons_resgatados ADD CONSTRAINT fk_cupons_resgatados_cupom
         FOREIGN KEY (cupom_id) REFERENCES cupons(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE chaveamentos ADD CONSTRAINT fk_chave_campeonato
         FOREIGN KEY (campeonato_id) REFERENCES inscricoes_campeonato(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE chaveamentos ADD CONSTRAINT fk_chave_campeao
         FOREIGN KEY (campeao_time_id) REFERENCES times(id)
         ON DELETE SET NULL;`,

        `ALTER TABLE partidas ADD CONSTRAINT fk_partida_chave
         FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE resultados_partidas ADD CONSTRAINT fk_resultados_partida
         FOREIGN KEY (partida_id) REFERENCES partidas(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE posicoes_times ADD CONSTRAINT fk_posicoes_chaveamento
         FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE posicoes_times ADD CONSTRAINT fk_posicoes_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE historico_movimentacoes ADD CONSTRAINT fk_historico_chaveamento
         FOREIGN KEY (chaveamento_id) REFERENCES chaveamentos(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE historico_movimentacoes ADD CONSTRAINT fk_historico_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE vetos_acoes ADD CONSTRAINT fk_vetos_acoes_sessao
         FOREIGN KEY (sessao_id) REFERENCES vetos_sessoes(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE ranking_times_atual ADD CONSTRAINT fk_ranking_atual_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE ranking_times_historico ADD CONSTRAINT fk_ranking_historico_atual
         FOREIGN KEY (ranking_atual_id) REFERENCES ranking_times_atual(id)
         ON DELETE CASCADE;`,

        `ALTER TABLE ranking_times_historico ADD CONSTRAINT fk_ranking_historico_time
         FOREIGN KEY (time_id) REFERENCES times(id)
         ON DELETE CASCADE;`
    ]

    for (const fk of foreignKeys) {
        await conexao.execute(fk).catch(()=>{})
    }

    await conexao.execute(`SET FOREIGN_KEY_CHECKS = 1;`)

    console.log("✅ BANCO TOTALMENTE CONFIGURADO COM SUCESSO!")
}


async function enviar() {
    try {
      const response = await resend.emails.send({
        from: process.env.FROM_TEXT_EMAIL,
        to: [process.env.EMAIL_USER],
        subject: 'Código de verificação',
        html: '<p>Teste do <strong>MIXCAMP</strong>!</p>'
      });
  
      console.log("EMAIL ENVIADO:", response);
    } catch (erro) {
      console.error("ERRO AO ENVIAR:", erro);
    }
}
  
enviar();
// ===============================================================================================
// ==================================== [API MERCADOPAGO] ================================================
// --- POST
async function CreatePreference(req, res){
    const { title, quantity, unit_price, cardId, timeId } = req.body;
    
    // Validar e garantir que o título não esteja vazio
    const itemTitle = title && title.trim() ? title.trim() : 'Inscrição em Campeonato';
    const itemQuantity = parseInt(quantity) || 1;
    const itemPrice = parseFloat(unit_price) || 0;
    
    if (!itemTitle || itemPrice <= 0) {
        return res.status(400).json({
            error: "Título e preço são obrigatórios"
        });
    }
    
    // Validar cardId e timeId
    if (!cardId || !timeId) {
        return res.status(400).json({
            error: "cardId e timeId são obrigatórios"
        });
    }
    
    // Criar external_reference com cardId e timeId para rastrear o pagamento
    const externalReference = `CAMP_${cardId}_TIME_${timeId}_${Date.now()}`;
    
    // URL base - usar ngrok URL se disponível, senão usar localhost (notification_url será opcional)
    const baseUrl = process.env.BASE_URL || process.env.NGROK_URL || 'http://127.0.0.1:3000';
    const isPublicUrl = baseUrl.startsWith('https://') || baseUrl.includes('ngrok');
    
    // Construir body da preferência
    const preferenceBody = {
        items: [
            {
                title: itemTitle,
                quantity: itemQuantity,
                unit_price: itemPrice,
                currency_id: "BRL"
            }
        ],
        external_reference: externalReference,
        back_urls: {
            success: `${baseUrl}/api/v1/mercadopago/success`,
            failure: `${baseUrl}/api/v1/mercadopago/failure`,
            pending: `${baseUrl}/api/v1/mercadopago/pending`
        }
    };
    
    // Só adicionar notification_url se for uma URL pública válida
    if (isPublicUrl) {
        preferenceBody.notification_url = `${baseUrl}${process.env.ROUTE_MERCADOPAGO_WEBHOOK}`;
    }
    
    const preference = new Preference(client);

    preference.create({
        body: preferenceBody
    })
    .then(data => {
        res.status(200).json({
            preference_id: data.id,
            preference_url: data.init_point,
            external_reference: externalReference
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao criar preferência:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        res.status(500).json({
            error: "Erro ao criar preferência",
            details: error.message || 'Erro desconhecido'
        });
    });

}

// --- WEBHOOK - Recebe notificações do Mercado Pago
async function webhookMercadoPago(req, res) {
    try {
        console.log('📥 [WEBHOOK] Recebida notificação do Mercado Pago');
        console.log('📥 [WEBHOOK] Body recebido:', JSON.stringify(req.body, null, 2));
        
        // Verificar se req.body existe
        if (!req.body) {
            console.log('⚠️ [WEBHOOK] Body vazio, retornando OK');
            return res.status(200).send('OK');
        }
        

        const type = req.body.topic || req.body.type || req.body.action?.split('.')[0];
        const paymentId = req.body.resource || req.body.data?.id;
        
        console.log('📥 [WEBHOOK] Tipo extraído:', type);
        console.log('📥 [WEBHOOK] Payment ID extraído:', paymentId);

        res.status(200).send('OK');
        
        // Processar a notificação de forma assíncrona (após enviar resposta)
        if (type === 'payment' && paymentId) {
            console.log('✅ [WEBHOOK] Processando pagamento:', paymentId);
            // Processar de forma assíncrona sem bloquear a resposta
            processarPagamento(paymentId)
                .then(dados => {
                    console.log('✅ [WEBHOOK] Resultado do processamento:', JSON.stringify(dados, null, 2));
                })
                .catch(error => {
                    console.error('❌ [WEBHOOK] Erro ao processar pagamento:', error);
                });
        } else {
            console.log('⚠️ [WEBHOOK] Tipo ou paymentId inválido. Tipo:', type, 'PaymentId:', paymentId);
        }
    } catch (error) {
        console.error('❌ [WEBHOOK] Erro no webhook:', error);
        // Sempre retornar 200 para o Mercado Pago (importante!)
        if (!res.headersSent) {
            res.status(200).send('OK');
        }
    }
}

// --- Processar pagamento e verificar status
async function processarPagamento(paymentId) {
    try {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });
        
        // Extrair cardId e timeId do external_reference
        const externalRef = paymentData.external_reference || '';
        const match = externalRef.match(/CAMP_(\d+)_TIME_(\d+)_/);
        
        if (!match) {
            console.error('❌ External reference inválido:', externalRef);
            return { success: false, error: 'External reference inválido' };
        }
        
        const cardId = match[1];
        const timeId = match[2];
        
        // Verificar se o pagamento foi aprovado
        if (paymentData.status === 'approved') {
            // Registrar a inscrição do time no campeonato
            const result = await registrarInscricaoAposPagamento(cardId, timeId, paymentId);
            return { success: true, cardId, timeId, paymentId };
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            return { success: false, status: paymentData.status, cardId, timeId };
        } else if (paymentData.status === 'pending') {
            return { success: false, status: 'pending', cardId, timeId };
        }
        
        return { success: false, status: paymentData.status };
    } catch (error) {
        // Tratar erro específico de pagamento não encontrado
        if (error.status === 404 || error.error === 'not_found') {
            return { success: false, error: 'Payment not found', isTest: true };
        }
        
        console.error('❌ Erro ao processar pagamento:', error);
        return { success: false, error: error.message || 'Erro desconhecido' };
    }
}

// --- Registrar inscrição após pagamento aprovado
async function registrarInscricaoAposPagamento(cardId, timeId, paymentId) {
    let conexao;
    try {
        conexao = await conectar();
        
        // Verificar se o time já está inscrito neste campeonato
        const [existe] = await conexao.execute(
            'SELECT id FROM inscricoes_times WHERE inscricao_id = ? AND time_id = ?',
            [cardId, timeId]
        );
        
        if (existe.length > 0) {
            return;
        }
        
        // Buscar dados do pagamento para obter valor e status
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });
        
        // Verificar se o campeonato existe e se há vagas disponíveis
        const [campeonato] = await conexao.execute(
            'SELECT qnt_times, preco_inscricao FROM inscricoes_campeonato WHERE id = ?',
            [cardId]
        );
        
        if (campeonato.length === 0) {
            console.error('Campeonato não encontrado:', cardId);
            return;
        }
        
        // Contar quantos times já estão inscritos
        const [inscritos] = await conexao.execute(
            'SELECT COUNT(*) as total FROM inscricoes_times WHERE inscricao_id = ?',
            [cardId]
        );
        
        const totalInscritos = inscritos[0].total;
        const qntTimesMax = parseInt(campeonato[0].qnt_times);
        
        if (totalInscritos >= qntTimesMax) {
            console.error('Campeonato já atingiu o número máximo de times');
            return;
        }
        
        // Inserir a inscrição com dados do pagamento
        await conexao.execute(
            `INSERT INTO inscricoes_times 
             (inscricao_id, time_id, payment_id, status_pagamento, valor_pago, data_pagamento) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                cardId, 
                timeId, 
                paymentId, 
                paymentData.status, 
                paymentData.transaction_amount || campeonato[0].preco_inscricao
            ]
        );

        // Registrar histórico de membros deste time para este campeonato
        await registrarHistoricoMembrosCampeonato(conexao, cardId, timeId);
    } catch (error) {
        console.error('Erro ao registrar inscrição após pagamento:', error);
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// --- Verificar status do pagamento (usado nas rotas de retorno)
async function verificarStatusPagamento(req, res) {
    try {
        const { preference_id, payment_id } = req.query;
        
        if (payment_id) {
            // Se temos o payment_id, verificar diretamente
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: payment_id });
            
            return res.status(200).json({
                status: paymentData.status,
                payment_id: paymentData.id,
                external_reference: paymentData.external_reference
            });
        }
        
        if (preference_id) {
            // Buscar pagamentos relacionados à preferência
            const payment = new Payment(client);
            // Nota: A API do Mercado Pago não permite buscar por preference_id diretamente
            return res.status(200).json({
                message: 'Use payment_id para verificar o status',
                preference_id: preference_id
            });
        }
        
        return res.status(400).json({ error: 'payment_id ou preference_id é obrigatório' });
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
    }
}

// --- Rotas de retorno (success, failure, pending)
async function retornoPagamentoSuccess(req, res) {
    const { preference_id, payment_id, collection_id, collection_status } = req.query;
    
    // O Mercado Pago pode enviar collection_id como payment_id
    const finalPaymentId = payment_id || collection_id || '';
    
    // Tentar extrair cardId do external_reference se temos payment_id
    let cardId = '';
    if (finalPaymentId) {
        try {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: finalPaymentId });
            const externalRef = paymentData.external_reference || '';
            const match = externalRef.match(/CAMP_(\d+)_TIME_(\d+)_/);
            if (match) {
                cardId = match[1];
            }
        } catch (error) {
            console.error('Erro ao buscar payment:', error);
        }
    }
    
    const redirectUrl = `http://127.0.0.1:5501/frontend/html/inscricao.html${cardId ? `?id=${cardId}&` : '?'}payment_status=success&payment_id=${finalPaymentId}&preference_id=${preference_id || ''}`;
    res.redirect(redirectUrl);
}

async function retornoPagamentoFailure(req, res) {
    const { preference_id, payment_id, collection_id } = req.query;
    
    const finalPaymentId = payment_id || collection_id || '';
    
    // Tentar extrair cardId do external_reference
    let cardId = '';
    if (finalPaymentId) {
        try {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: finalPaymentId });
            const externalRef = paymentData.external_reference || '';
            const match = externalRef.match(/CAMP_(\d+)_TIME_(\d+)_/);
            if (match) {
                cardId = match[1];
            }
        } catch (error) {
            console.error('Erro ao buscar payment:', error);
        }
    }
    
    const redirectUrl = `http://127.0.0.1:5501/frontend/html/inscricao.html${cardId ? `?id=${cardId}&` : '?'}payment_status=failure&payment_id=${finalPaymentId}&preference_id=${preference_id || ''}`;
    res.redirect(redirectUrl);
}

async function retornoPagamentoPending(req, res) {
    const { preference_id, payment_id, collection_id } = req.query;
    
    const finalPaymentId = payment_id || collection_id || '';
    
    // Tentar extrair cardId do external_reference
    let cardId = '';
    if (finalPaymentId) {
        try {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: finalPaymentId });
            const externalRef = paymentData.external_reference || '';
            const match = externalRef.match(/CAMP_(\d+)_TIME_(\d+)_/);
            if (match) {
                cardId = match[1];
            }
        } catch (error) {
            console.error('Erro ao buscar payment:', error);
        }
    }
    
    const redirectUrl = `http://127.0.0.1:5501/frontend/html/inscricao.html${cardId ? `?id=${cardId}&` : '?'}payment_status=pending&payment_id=${finalPaymentId}&preference_id=${preference_id || ''}`;
    res.redirect(redirectUrl);
}

// ===============================================================================================
// ==================================== [API FACEIT] ================================================



async function buscarStatusplayer(req,res){
    const faceitid = req.body.faceitid;

    const url = `https://open.faceit.com/data/v4/players/${faceitid}/stats/cs2`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            console.error("Erro FACEIT:", error.response.status, error.response.data);
        } else {
            console.error("Erro de requisição:", error.message);
        }
        throw error;
    }

}

async function buscarDadosFaceitPlayer(req, res) {

    const level = {
        1: "https://cdn3.emoji.gg/emojis/50077-faceit-1lvl.png",
        2: "https://cdn3.emoji.gg/emojis/50077-faceit-2lvl.png",
        3: "https://cdn3.emoji.gg/emojis/35622-faceit-3lvl.png",
        4: "https://cdn3.emoji.gg/emojis/63614-faceit-4lvl.png",
        5: "https://cdn3.emoji.gg/emojis/95787-faceit-5lvl.png",
        6: "https://cdn3.emoji.gg/emojis/68460-faceit-6lvl.png",
        7: "https://cdn3.emoji.gg/emojis/67489-faceit-7lvl.png",
        8: "https://cdn3.emoji.gg/emojis/58585-faceit-8lvl.png",
        9: "https://cdn3.emoji.gg/emojis/60848-faceit-9level.png",
        10: "https://cdn3.emoji.gg/emojis/84242-faceit-10lvl.png"
    }

    const link = req.body.link;
    
    
    try {
        if(link == '' || link == null || link == undefined){
            return res.status(400).json({nivel: null});
        }
        const nickname = link.split('/')[5];

        if (!nickname) {
            return res.status(400).json({ message: 'Parâmetro "nickname" é obrigatório' });
        }


        if (!apiKey) {
            return res.status(500).json({ message: 'FACEIT_API_KEY não configurada no ambiente' });
        }

        const url = `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`;
        const headers = { Authorization: `Bearer ${apiKey}` };

        const response = await fetch(url, { headers });
        if (!response.ok) {
            const erro = await response.json().catch(() => ({}));
            return res.status(response.status).json({ message: erro.message || 'Erro ao consultar Faceit' });
        }

        const data = await response.json();
        const skillLevel = data && data.games && data.games.cs2 && data.games.cs2.skill_level;
        const nivel = level[skillLevel];


        return res.json({ nivel, data: data });
    
    
    } catch (error) {
        console.error('Erro na rota /api/v1/faceit/player:', error);
        return res.status(500).json({ message: 'Erro interno ao consultar Faceit' });
    }
    
}

// Buscar IDs de partidas de uma hub específica
async function locationMatchesIds(req, res) {
    const {queue_id} = req.body;

    if (!apiKey || !queue_id) {
        return res.status(400).json({ 
            message: 'queue_id é obrigatório' 
        });
    }

    const url = `https://open.faceit.com/data/v4/hubs/${queue_id}/matches`;
    const headers = {
        "Authorization": `Bearer ${apiKey}`
    };

    try {
        const response = await fetch(url, { headers });

        if (response.status === 200) {
            const data = await response.json();
            const items = data.items || [];

            // Array para armazenar todas as informações das partidas
            const matchesInfo = [];

            // Processar cada partida encontrada
            for (const item of items) {
                const match_id = item.match_id;
                if (match_id) {
                    const matchInfo = await infoMatchId(apiKey, match_id);
                    if (matchInfo) {
                        matchesInfo.push(matchInfo);
                    }
                }
            }

            return res.status(200).json({
                total: matchesInfo.length,
                matches: matchesInfo
            });
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            return res.status(response.status).json({
                message: errorData.message || 'Erro ao buscar partidas da hub'
            });
        }
    } catch (error) {
        console.error('Erro em locationMatchesIds:', error);
        return res.status(500).json({
            message: 'Erro interno ao buscar partidas da hub'
        });
    }
}

// Buscar informações sobre uma partida específica
async function infoMatchId(apiKeyParam, match_id) {
    if (!apiKeyParam || !match_id) {
        return null;
    }

    const url = `https://open.faceit.com/data/v4/matches/${match_id}`;
    const headers = {
        "Authorization": `Bearer ${apiKeyParam}`
    };

    try {
        const response = await fetch(url, { headers });

        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            console.error(`Erro ao buscar partida ${match_id}:`, errorData.message || 'Erro desconhecido');
            return null;
        }
    } catch (error) {
        console.error(`Erro em infoMatchId para match_id ${match_id}:`, error);
        return null;
    }
}

// Endpoint para buscar informações de uma partida específica
async function buscarInfoMatchId(req, res) {
    const { match_id } = req.body;

    if (!match_id) {
        return res.status(400).json({ 
            message: 'match_id é obrigatório' 
        });
    }

    if (!apiKey) {
        return res.status(500).json({ 
            message: 'API Key não configurada' 
        });
    }

    try {
        const matchInfo = await infoMatchId(apiKey, match_id);
        
        if (matchInfo) {
            return res.status(200).json(matchInfo);
        } else {
            return res.status(404).json({
                message: 'Partida não encontrada'
            });
        }
    } catch (error) {
        console.error('Erro em buscarInfoMatchId:', error);
        return res.status(500).json({
            message: 'Erro interno ao buscar informações da partida'
        });
    }
}


async function buscarInfoMatchIdStatus(req, res) {
    const { match_id } = req.body;
    if (!match_id) {
        return res.status(400).json({ 
            message: 'match_id é obrigatório' 
        });
    }

    if (!apiKey) {
        return res.status(500).json({ 
            message: 'API Key não configurada' 
        });
    }

    try {
        const matchInfo = await infoMatchIdStatus(apiKey, match_id);
        
        if (matchInfo) {
            return res.status(200).json(matchInfo);
        } else {
            return res.status(404).json({
                message: 'Partida não encontrada'
            });
        }
    } catch (error) {
        console.error('Erro em buscarInfoMatchId:', error);
        return res.status(500).json({
            message: 'Erro interno ao buscar informações da partida'
        });
    }
}


// Buscar informações detalhadas sobre uma partida específica
async function infoMatchIdStatus(apiKeyParam, match_id) {
    if (!apiKeyParam || !match_id) {
        return null;
    }
    console.log(match_id);

    const url = `https://open.faceit.com/data/v4/matches/${match_id}/status`;
    const headers = {
        "Authorization": `Bearer ${apiKeyParam}`
    };

    try {
        const response = await fetch(url, { headers });

        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            console.error(`Erro ao buscar partida ${match_id}:`, errorData.message || 'Erro desconhecido');
            return null;
        }
    } catch (error) {
        console.error(`Erro em infoMatchId para match_id ${match_id}:`, error);
        return null;
    }
}

// Buscar estatísticas detalhadas sobre uma partida específica
async function infoMatchIdStats(apiKeyParam, match_id) {
    if (!apiKeyParam || !match_id) {
        return null;
    }

    const url = `https://open.faceit.com/data/v4/matches/${match_id}/stats`;
    const headers = {
        "Authorization": `Bearer ${apiKeyParam}`
    };

    try {
        const response = await fetch(url, { headers });

        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            console.error(`Erro ao buscar estatísticas da partida ${match_id}:`, errorData.message || 'Erro desconhecido');
            return null;
        }
    } catch (error) {
        console.error(`Erro em infoMatchIdStats para match_id ${match_id}:`, error);
        return null;
    }
}

// Endpoint para buscar estatísticas de uma partida específica
async function buscarInfoMatchIdStats(req, res) {
    const { match_id } = req.body;
    
    if (!match_id) {
        return res.status(400).json({ 
            message: 'match_id é obrigatório' 
        });
    }

    if (!apiKey) {
        return res.status(500).json({ 
            message: 'API Key não configurada' 
        });
    }

    try {
        const matchStats = await infoMatchIdStats(apiKey, match_id);
        
        if (matchStats) {
            return res.status(200).json(matchStats);
        } else {
            return res.status(404).json({
                message: 'Estatísticas da partida não encontradas'
            });
        }
    } catch (error) {
        console.error('Erro em buscarInfoMatchIdStats:', error);
        return res.status(500).json({
            message: 'Erro interno ao buscar estatísticas da partida'
        });
    }
}

// ===============================================================================================
// ==================================== [API STEAM] ================================================

async function steamIdFromUrl(req,res) {
    const url = req.body.url;
    // Caso seja /profiles/ (já contém o SteamID64)
    if (url.includes("/profiles/")) {
        return url.split("/profiles/")[1].split("/")[0];
    }

    // Caso seja /id/ (precisa resolver usando a API)
    if (url.includes("/id/")) {
        const vanity = url.split("/id/")[1].split("/")[0];

        try {
            const response = await axios.get(
                "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/",
                {
                    params: {
                        key: steamApiKey,
                        vanityurl: vanity
                    }
                }
            );
            res.status(200).json({ steamid: response.data.response.steamid });

            

        } catch (err) {
            console.error("Erro ao buscar SteamID:", err);
            res.status(500).json({ message: 'Erro ao buscar SteamID' });
        }
    }

    return null;
}


async function buscarTimeGame(req, res){

    // const STEAM_ID = "76561198208042323"
    // 76561198042949697
    
    const STEAM_ID = req.body.STEAMID;
 
    try{
        const response = await axios.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
            {
                params: {
                    key: steamApiKey,
                    steamid: STEAM_ID,
                    include_appinfo: true
                }
            }
        );
        let dados = response.data.response.games;
        for(const game of dados){
            if (game.appid === 730){
                let minutos = game.playtime_forever / 60;
                const horasFormatadas = new Intl.NumberFormat('pt-BR', {
                    maximumFractionDigits: 0
                }).format(minutos);


                minutos = game["playtime_2weeks"] / 60;

                let timeSemana = `${minutos.toFixed(1)}`;

                dados = {
                    horastotal: horasFormatadas,
                    horassemana: timeSemana
                }
                res.status(200).json(dados);
            }
        }
    }
    catch(error){
        console.error("Erro ao buscar time game:", error);
        res.status(500).json({ message: 'Erro ao buscar horas do game' });
    }
}

async function statuscs(req,res){
    // const STEAM_ID = req.body.STEAMID;
    const STEAM_ID = "76561198208042323";
    const appid = 730;
    console.log(STEAM_ID);
    console.log('1')
    try{
        const response = await axios.get(
            `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${steamApiKey}&steamid=${STEAM_ID}&appid=${appid}`

        );
        // const data = response;
        console.log('2');
       
        res.status(200).json(response.data);
    }
    catch(error){
        console.error("Erro ao buscar status cs:", error);
        res.status(500).json({ message: 'Erro ao buscar status cs' });
    }

}

// ===============================================================================================
// ==================================== [API CLOUDINARY] ================================================
async function uploadImagemCloudinary(req, res) {

    const file = req.file;


    if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }

    // Validação do arquivo
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (!isImage && !isVideo) {
        return res.status(400).json({ message: 'Por favor, selecione apenas arquivos de imagem ou vídeo.' });
    }

    // Validação adicional de extensão
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.mp4', '.mov', '.avi', '.webm'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: 'Formato de arquivo não suportado. Use: JPG, PNG, GIF, WebP, MP4, MOV, AVI ou WebM.' });
    }

    // Limita o tamanho do arquivo (500MB para vídeos, 5MB para imagens)
    const maxSize = isVideo ? 500 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        const maxSizeMB = isVideo ? 500 : 5;
        return res.status(400).json({ message: `O arquivo deve ter menos de ${maxSizeMB}MB.` });
    }

    // Criar FormData usando o pacote form-data
    const formData = new FormData();
    formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
    });
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', isVideo ? 'mixcamp_uploads/videos' : 'mixcamp_uploads');

    try {
        // Usar endpoint de vídeo ou imagem dependendo do tipo
        const uploadEndpoint = isVideo 
            ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
            : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta de erro completa:', errorText);
            throw new Error(`Erro no upload para o Cloudinary: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        return res.status(200).json({ secure_url: data.secure_url });
    } catch (error) {
        console.error('Erro no upload da imagem:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }

}


// ===============================================================================================
// ==================================== [API IMG POSITION] ================================================

// ----- BUSCA GET
async function buscarImgPosition(req, res) {

    let conexao;
    try {
        conexao = await conectar();

        const query = 'SELECT * FROM posicoes_img';
        const [dados] = await conexao.execute(query);
        res.json(dados);
    }
    catch (error) {
        console.error('Erro ao buscar imagem de posição:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

async function buscarImgMap(req, res){
    let conexao;
    try {
        conexao = await conectar();
        const query = 'SELECT * FROM img_map';
        const [dados] = await conexao.execute(query);
        res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar imagem de mapa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- BUSCA POST
async function createImgPosition(req, res) {
    const { capitao, awp, entry, support, igl, sub, coach, rifle, lurker } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Garantir que todos os parâmetros tenham valores válidos (null se undefined)
        const params = [
            capitao || null,
            awp || null,
            entry || null,
            support || null,
            igl || null,
            sub || null,
            coach || null,
            rifle || null,
            lurker || null
        ];

        const query = 'INSERT INTO posicoes_img (capitao, awp, entry, support, igl, sub, coach, rifle, lurker) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conexao.execute(query, params);

        res.status(201).json({ message: 'Imagem de posição criada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao criar imagem de posição:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

async function createImgMap(req, res){
    const { mirage, train, vertigo, nuke, ancient, inferno, overpass, dust2, cache, anubis } = req.body;
    console.log(req.body);

    let conexao;
    try {
        conexao = await conectar();
        // Converter undefined para null (MySQL2 não aceita undefined)
        const valores = [
            mirage ?? null,
            train ?? null,
            vertigo ?? null,
            nuke ?? null,
            ancient ?? null,
            inferno ?? null,
            overpass ?? null,
            dust2 ?? null,
            cache ?? null,
            anubis ?? null
        ];
        const query = 'INSERT INTO img_map (mirage, train, vertigo, nuke, ancient, inferno, overpass, dust2, cache, anubis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conexao.execute(query, valores);
        res.status(200).json({ message: 'Imagem de mapa criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar imagem de mapa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- BUSCA UPDATE
async function updateImgPosition(req, res) {
    const { id, ...campos } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'ID é obrigatório' });
    }

    // Filtra apenas campos que NÃO são undefined, null ou string vazia
    const colunas = Object.entries(campos)
        .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '');

    if (colunas.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo válido para atualizar' });
    }

    const setClause = colunas.map(([coluna]) => `${coluna} = ?`).join(', ');
    const valores = colunas.map(([_, valor]) => valor);

    const query = `UPDATE posicoes_img SET ${setClause} WHERE id = ?`;

    let conexao;
    try {
        conexao = await conectar();
        await conexao.execute(query, [...valores, id]);
        res.status(200).json({ message: 'Imagem de posição atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar imagem de posição:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function updateImgMap(req, res){
    const { id, ...campos } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'ID é obrigatório' });
    }
    const setClause = colunas.map(([coluna]) => `${coluna} = ?`).join(', ');
    const valores = colunas.map(([_, valor]) => valor);
    const query = `UPDATE img_map SET ${setClause} WHERE id = ?`;

    let conexao;        
    try {
        conexao = await conectar();
        await conexao.execute(query, [...valores, id]);
        res.status(200).json({ message: 'Imagem de mapa atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar imagem de mapa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ===============================================================================================
// ==================================== [API EMAIL] =============================================

async function enviarCodigoEmail(req, res){
    const {email} = req.body;

    let conexao;

    try{
        conexao = await conectar();
        let query = "SELECT * FROM usuarios WHERE email = ?";
        const [dados] = await conexao.execute(query, [email]);
        if(dados.length == 0){

            const code = Math.floor(100000 + Math.random() * 900000);

            query = 'INSERT INTO email_verificacao (email, codigo, expira_em) VALUES (?, ?, ?)';
            await conexao.execute(query, [email, code, new Date(Date.now() + 10 * 60 * 1000)]);
            try {
                const response = await resend.emails.send({
                  from: process.env.FROM_TEXT_EMAIL,
                  to: [email],
                  subject: 'Código de verificação',
                  html: `
                  <h2>Seu código de verificação</h2>
                  <h1>${code}</h1>
                  <p>Este código expira em 10 minutos.</p>
                  `
                });
            
                console.log("EMAIL ENVIADO:", response);
                res.status(200).json({ message: 'Código enviado com sucesso, verifique sua caixa de entrada' });
              } catch (erro) {
                console.error("ERRO AO ENVIAR:", erro);
                res.status(500).json({ message: 'Erro ao enviar código de e-mail' });
            }
        }
        else{
            res.status(400).json({ message: `${email} já está cadastrado no sistema` });
        }
    }
    catch(error){
        console.error('Erro ao enviar código de e-mail:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }

}


async function verificarCodigoEmail(req,res){
    const { email, codigo } = req.body;

    // Validação dos parâmetros
    if (!email || !codigo) {
        return res.status(400).json({ message: 'Email e código são obrigatórios' });
    }

    let conexao;
    try {
        conexao = await conectar();
        let query = 'SELECT * FROM email_verificacao WHERE email = ? AND codigo = ? AND expira_em > NOW()';
        const [dados] = await conexao.execute(query, [email, codigo]);

        if (dados.length === 0) {
            return res.status(400).json({ message: 'Código de verificação inválido' });
        }

        query = 'DELETE FROM email_verificacao WHERE email = ?';
        await conexao.execute(query, [email]);
        res.status(200).json({ message: 'Código de verificação registrado com sucesso' });
    }
    catch(error){
        console.error('Erro ao registrar código de e-mail:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===================== [ AUTENTICAÇÃO ] =====================

// ------- API GET
async function autenticacao(req, res, next) {
    if (req.session.user) {
        res.json({
            logado: true,
            usuario: req.session.user
        });
    } else {
        res.json({
            logado: false
        });
    }
}

async function logout(req, res) {
    req.session.destroy(error => {
        if (error) return res.status(500).json({ message: 'Erro ao deslogar!' });
        res.json({ message: 'Deslogado com sucesso!' });
    });
}

// ===============================================================================================
// ==================================== [API BUSCA] ================================================

// ----- BUSCA GET
async function buscarTimes(req, res) {
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
        return res.status(400).json({
            message: 'Termo de busca deve ter pelo menos 2 caracteres',
            error: 'INVALID_SEARCH_TERM'
        });
    }

    let conexao;
    try {
        conexao = await conectar();

        const [times] = await conexao.execute(`
            SELECT 
                t.id,
                t.nome,
                t.tag,
                t.avatar_time_url,
                t.banner_time_url,
                t.sobre_time,
                t.lider_id,
                COUNT(mt.usuario_id) as membros_count
            FROM times t
            LEFT JOIN membros_time mt ON mt.time_id = t.id
            WHERE t.nome LIKE ? OR t.tag LIKE ?
            GROUP BY t.id
            ORDER BY t.nome ASC
            LIMIT 20
        `, [`%${search}%`, `%${search}%`]);

        res.json({
            times,
            total: times.length,
            search_term: search
        });

    } catch (error) {
        console.error('Erro ao buscar times:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function buscarUsuarios(req, res) {
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
        return res.status(400).json({
            message: 'Termo de busca deve ter pelo menos 2 caracteres',
            error: 'INVALID_SEARCH_TERM'
        });
    }

    let conexao;
    try {
        conexao = await conectar();

        const [usuarios] = await conexao.execute(`
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.time_id,
                t.nome as time_nome,
                t.tag as time_tag
            FROM usuarios u
            LEFT JOIN times t ON t.id = u.time_id
            WHERE u.username LIKE ?
            ORDER BY u.username ASC
            LIMIT 20
        `, [`%${search}%`]);

        res.json({
            usuarios,
            total: usuarios.length,
            search_term: search
        });

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}



// ----- BUSCA POST


// ----- BUSCA DELETE


// ----- BUSCA UPDATE



// ===============================================================================================
// ==================================== [API PERFIL] =============================================


async function getplayers(req, res) {
    let conexao;

    try {
        conexao = await conectar();
        let query = `SELECT 
            u.id,
            u.username,
            u.avatar_url,
            m.posicao,
            t.nome AS time_nome
        FROM usuarios u
        LEFT JOIN membros_time m ON m.usuario_id = u.id
        LEFT JOIN times t ON m.time_id = t.id;`;

        const [players] = await conexao.execute(query);

        res.json(players);
    }
    catch (error) {
        console.error('Erro ao buscar players:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


async function getPerfil(req, res) {
    const id = req.params.id;
    let conexao;
    try {
        conexao = await conectar();

        // Busca os dados do usuário
        const [usuariosRows] = await conexao.execute('SELECT * FROM usuarios WHERE id=?', [id]);
        const usuario = usuariosRows[0];

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Busca as redes sociais.
        const [redesSociais] = await conexao.execute('SELECT * FROM redes_sociais WHERE usuario_id=?', [id]);

        // Busca os destaques.
        const [destaques] = await conexao.execute('SELECT video_url FROM destaques WHERE usuario_id=? ORDER BY ordem', [id]);

        // Busca os dados do time se o usuário pertencer a um
        let time = null;
        if (usuario.time_id) {
            const [timeRows] = await conexao.execute('SELECT nome, tag FROM times WHERE id=?', [usuario.time_id]);
            time = timeRows[0] || null;
        }

        const dadosPerfil = {
            usuario,
            redesSociais,
            destaques,
            time
        };

        res.json(dadosPerfil);
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


async function login(req, res) {
    const { email, senha } = req.body;

    let conexao;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }


    try {

        conexao = await conectar();

        let query = 'SELECT * FROM usuarios WHERE email = ?'

        let dados = await conexao.execute(query, [email]);

        const usuario = dados[0][0];


        if (!usuario) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }


        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).send({ message: 'Senha incorreta' });
        }

        req.session.user = {
            id: usuario.id,
            nome: usuario.username,
            email: usuario.email,
            time: usuario.time_id
        };

        res.status(200).send({ message: 'Login com sucesso!' });

    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send({ message: 'Login Negado!' })
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}


async function autenticar(req, res, next) {

    if (req.session.user) {
        next();
    } else {
        res.status(403).send({ erro: "Acesso negado! Faça login primeiro." });
    }
}
// ----- PERFIL POST


async function register(req, res) {
    let conexao;

    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ message: 'Email inválido' });
        }
        if (!validarSenha(password)) {
            return res.status(400).json({ message: 'Senha inválida' });
        }
        if (validarCaracteres(username, email, password)) {
            return res.status(400).json({ message: 'Caracteres inválidos' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        conexao = await conectar();
        const query = 'INSERT INTO usuarios (username, email, senha) VALUES (?,?,?)';
        await conexao.execute(query, [username, email, hashedPassword]);

        res.status(201).json({ message: 'Usuário registrado com sucesso' });


    } catch (error) {
        console.error('Erro no registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email ou nome de usuário já cadastrado' });
        }
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


async function updateConfig(req, res) {
    const userID = req.params.id;
    const { username, sobre, redes, destaques, avatar, banner, cores_perfil, posicoes, steamid, faceitid} = req.body;
    
    // Verificar se posicoes existe e é um array antes de fazer join
    const posicao = (posicoes && Array.isArray(posicoes)) ? posicoes.join(',') : null;

    let conexao;

    try {
        conexao = await conectar();

        // Verifica se steamid e faceitid são válidos (não são null, undefined, string vazia ou string "null")
        // Se forem inválidos, não atualiza essas colunas (mantém os valores existentes no banco)
        let steamidValido = false;
        let faceitidValido = false;
        
        if (steamid !== null && 
            steamid !== undefined && 
            steamid !== 'null' &&  // Verifica se não é a string "null"
            typeof steamid === 'string' && 
            steamid.trim() !== '') {
            steamidValido = true;
        }
        
        if (faceitid !== null && 
            faceitid !== undefined && 
            faceitid !== 'null' &&  // Verifica se não é a string "null"
            typeof faceitid === 'string' && 
            faceitid.trim() !== '') {
            faceitidValido = true;
        }

        // Monta a query dinamicamente - só atualiza os campos que têm valores válidos
        let camposUpdate = [];
        let valoresUpdate = [];
        
        // Adicionar campos apenas se tiverem valores
        if (username !== undefined) {
            camposUpdate.push('username');
            valoresUpdate.push(username);
        }
        if (sobre !== undefined) {
            camposUpdate.push('sobre');
            valoresUpdate.push(sobre);
        }
        if (avatar !== undefined) {
            camposUpdate.push('avatar_url');
            valoresUpdate.push(avatar);
        }
        if (banner !== undefined) {
            camposUpdate.push('banner_url');
            valoresUpdate.push(banner);
        }
        if (cores_perfil !== undefined) {
            camposUpdate.push('cores_perfil');
            valoresUpdate.push(cores_perfil);
        }
        if (posicao !== null && posicao !== undefined) {
            camposUpdate.push('posicao');
            valoresUpdate.push(posicao);
        }
        
        if (steamidValido) {
            camposUpdate.push('steamid');
            valoresUpdate.push(steamid.trim());
        }
        
        if (faceitidValido) {
            camposUpdate.push('faceitid');
            valoresUpdate.push(faceitid.trim());
        }
        
        // Só atualiza a tabela usuarios se houver campos para atualizar
        if (camposUpdate.length > 0) {
            // Adiciona o userID no final para o WHERE
            valoresUpdate.push(userID);
            
            // Monta a query SQL dinamicamente
            const queryUpdate = `UPDATE usuarios SET ${camposUpdate.map(campo => `${campo}=?`).join(', ')} WHERE id=?`;
            
            await conexao.execute(queryUpdate, valoresUpdate);
        }

        // Atualiza ou insere redes sociais apenas se redes for fornecido
        if (redes) {
            const [redesExistentes] = await conexao.execute(
                'SELECT * FROM redes_sociais WHERE usuario_id = ?',
                [userID]
            );

            if (redesExistentes.length > 0) {
                await conexao.execute(
                    'UPDATE redes_sociais SET discord_url=?, youtube_url=?, instagram_url=?, twitter_url=?, twitch_url=?, faceit_url=?, gamesclub_url=?, steam_url=?, tiktok_url=?, kick_url=?, allstar_url=? WHERE usuario_id=?',
                    [redes.discord || '', redes.youtube || '', redes.instagram || '', redes.twitter || '', redes.twitch || '', redes.faceit || '', redes.gamesclub || '', redes.steam || '', redes.tiktok || '', redes.kick || '', redes.allstar || '', userID]
                );
            } else {
                await conexao.execute(
                    'INSERT INTO redes_sociais (usuario_id, discord_url, youtube_url, instagram_url, twitter_url, twitch_url, faceit_url, gamesclub_url, steam_url, tiktok_url, kick_url, allstar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userID, redes.discord || '', redes.youtube || '', redes.instagram || '', redes.twitter || '', redes.twitch || '', redes.faceit || '', redes.gamesclub || '', redes.steam || '', redes.tiktok || '', redes.kick || '', redes.allstar || '']
                );
            }
        }

        // Atualiza destaques
        await conexao.execute('DELETE FROM destaques WHERE usuario_id=?', [userID]);
        if (destaques && destaques.length > 0) {
            for (let i = 0; i < destaques.length; i++) {
                await conexao.execute(
                    'INSERT INTO destaques (usuario_id, video_url, ordem) VALUES (?, ?, ?)',
                    [userID, destaques[i], i + 1]
                );
            }
        }

        res.status(200).json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- PERFIL DELETE



// ----- PERFIL UPDATE

// ==============================================================================================
// ==================================== [API TEAMS] =============================================

// ----- TEAMS GET
async function listarTimes(req, res) {
    let conexao;

    try {
        conexao = await conectar();
        let query = 'SELECT * FROM times';

        let [dados] = await conexao.execute(query);

        query = 'SELECT * FROM membros_time';
        let [dadosMembros] = await conexao.execute(query);

        query = 'SELECT * FROM redes_sociais_time';
        let [dadosRedes] = await conexao.execute(query);

        query = 'SELECT * FROM games_time';
        let [dadosGames] = await conexao.execute(query);

        res.json({ dados, dadosMembros, dadosRedes, dadosGames });
    }
    catch (error) {
        console.error('Erro ao listar times:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getTimeById(req, res) {
    const { id } = req.params;
    let conexao;
    try {
        conexao = await conectar();

        // Time básico
        const [timeRows] = await conexao.execute(
            'SELECT id, nome, tag, avatar_time_url, banner_time_url, sobre_time, lider_id FROM times WHERE id = ?',
            [id]
        );
        const time = timeRows[0];
        if (!time) return res.status(404).json({ message: 'Time não encontrado' });


        // Redes sociais do time
        const [redesRows] = await conexao.execute(
            `SELECT discord_url, youtube_url, instagram_url, twitter_url, twitch_url,
                    faceit_url, gamesclub_url, steam_url, tiktok_url
             FROM redes_sociais_time WHERE time_id = ?`,
            [id]
        );
        const redesSociais = redesRows[0] || {};

        // Membros com função e posição
        const [membros] = await conexao.execute(`
            SELECT mt.usuario_id, u.username, u.avatar_url, mt.funcao, mt.posicao
            FROM membros_time mt
            JOIN usuarios u ON u.id = mt.usuario_id
            WHERE mt.time_id = ?
            ORDER BY
                CASE mt.funcao
                    WHEN 'titular' THEN 1
                    WHEN 'reserva' THEN 2
                    WHEN 'coach' THEN 3
                    ELSE 4
                END,
                u.username ASC
            `, [id]);


        // Destaques do time
        const [destaquesRows] = await conexao.execute(
            'SELECT video_url, ordem FROM destaques_time WHERE time_id = ? ORDER BY ordem',
            [id]
        );
        const destaques = destaquesRows || [];

        // Notícias do time
        const [noticias] = await conexao.execute(
            `SELECT id, titulo, conteudo, data_publicacao 
             FROM noticias_time WHERE time_id = ? ORDER BY data_publicacao DESC`,
            [id]
        );

        // Conquistas do time (fazendo JOIN com trofeus)
        const [conquistas] = await conexao.execute(
            `SELECT 
                tc.id,
                tc.trofeu_id,
                tc.data_conquista,
                t.nome,
                t.descricao,
                t.imagem_url,
                t.iframe_url,
                t.edicao_campeonato,
                t.categoria
             FROM time_conquistas tc
             LEFT JOIN trofeus t ON tc.trofeu_id = t.id
             WHERE tc.time_id = ? 
             ORDER BY tc.data_conquista DESC`,
            [id]
        );

        // Jogos do time
        const [games] = await conexao.execute(
            'SELECT game_name FROM games_time WHERE time_id = ?',
            [id]
        );
        const gamesTime = games[0] || {};

        // Cores do time
        const [coresTime] = await conexao.execute(
            'SELECT cores_perfil FROM times WHERE id = ?',
            [id]
        );
        const coresDoTime = coresTime[0] || {};


        res.json({
            time,
            redesSociais,
            membros,
            destaques,
            noticias,
            conquistas,
            gamesTime,
            coresDoTime

        });
    } catch (error) {
        console.error('Erro ao buscar time:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getTimeByUser(req, res) {
    const { userId } = req.params;
    let conexao;
    try {
        conexao = await conectar();

        // Primeiro via campo direto
        const [userRows] = await conexao.execute('SELECT time_id FROM usuarios WHERE id = ?', [userId]);
        const user = userRows[0];
        let time = null;

        if (user?.time_id) {
            const [timeRows] = await conexao.execute('SELECT id, nome, tag FROM times WHERE id = ?', [user.time_id]);
            time = timeRows[0] || null;
        } else {
            // Alternativo: via membros_time
            const [membroRows] = await conexao.execute(
                'SELECT t.id, t.nome, t.tag FROM membros_time mt JOIN times t ON t.id = mt.time_id WHERE mt.usuario_id = ? LIMIT 1',
                [userId]
            );
            time = membroRows[0] || null;
        }

        res.json({ time });
    } catch (error) {
        console.error('Erro ao buscar time do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function listarMembrosParaLideranca(req, res) {
    const { id } = req.params; // ID do time
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o usuário é o líder atual
        const [timeRows] = await conexao.execute(
            'SELECT lider_id FROM times WHERE id = ?',
            [id]
        );

        if (!timeRows[0] || parseInt(timeRows[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Apenas o líder pode ver os membros elegíveis' });
        }

        // Buscar todos os membros do time (exceto o líder atual)
        const [membros] = await conexao.execute(`
            SELECT u.id, u.username, u.avatar_url, mt.funcao, mt.posicao
            FROM membros_time mt
            JOIN usuarios u ON u.id = mt.usuario_id
            WHERE mt.time_id = ? AND mt.usuario_id != ?
            ORDER BY 
                CASE mt.funcao 
                    WHEN 'titular' THEN 1
                    WHEN 'reserva' THEN 2
                    WHEN 'coach' THEN 3
                    ELSE 4
                END,
                u.username ASC
        `, [id, userId]);

        res.json({ membros });

    } catch (error) {
        console.error('Erro ao listar membros para liderança:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Listar solicitações de entrada de um time (somente líder pode ver)
async function listarSolicitacoesPorTime(req, res) {
    const { id } = req.params; // id do time
    const { userId } = req.query; // id do usuário autenticado (líder)

    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
    }

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se requester é líder do time
        const [timeRows] = await conexao.execute(
            'SELECT lider_id FROM times WHERE id = ? LIMIT 1',
            [id]
        );

        if (!timeRows[0]) {
            return res.status(404).json({ message: 'Time não encontrado' });
        }

        if (parseInt(timeRows[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Apenas o líder pode ver as solicitações deste time' });
        }

        // Buscar solicitações do time, mais recentes primeiro
        const [solicitacoes] = await conexao.execute(
            `SELECT st.id,
                    st.usuario_id,
                    st.time_id,
                    st.status,
                    st.data_solicitacao,
                    u.username,
                    u.avatar_url
             FROM solicitacoes_time st
             JOIN usuarios u ON u.id = st.usuario_id
             WHERE st.time_id = ?
             ORDER BY st.data_solicitacao DESC`,
            [id]
        );

        return res.json({ solicitacoes });

    } catch (error) {
        console.error('Erro ao listar solicitações do time:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- TEAMS POST

async function criarTime(req, res) {
    const { userId, nome, tag, sobre_time } = req.body;
    console.log(userId, nome, tag, sobre_time)
    // const userId = req.session.userId;



    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!nome || !tag) {
        return res.status(400).json({ error: 'Nome e tag do time são obrigatórios' });
    }

    let conexao;
    try {

        conexao = await conectar();

        await conexao.beginTransaction();

        // Verificar se usuário já tem time ou está em outro time
        const [userTimeCheck] = await conexao.execute(
            'SELECT time_id FROM usuarios WHERE id = ?',
            [userId]
        );


        if (userTimeCheck[0]?.time_id) {
            await conexao.rollback();
            return res.status(400).json({ error: 'Usuário já está em um time', time_id: userTimeCheck[0].time_id });
        }

        // Verificar se nome ou tag já existem
        const [existingTeam] = await conexao.execute(
            'SELECT id FROM times WHERE nome = ? OR tag = ?',
            [nome, tag]
        );

        if (existingTeam.length > 0) {
            await conexao.rollback();
            return res.status(400).json({ error: 'Nome ou tag do time já existem', existing: existingTeam });
        }

        // Criar o time
        const [timeResult] = await conexao.execute(
            'INSERT INTO times (nome, tag, lider_id, sobre_time) VALUES (?, ?, ?, ?)',
            [nome, tag, userId, sobre_time || null]
        );

        const timeId = timeResult.insertId;

        // Adicionar usuário como membro titular e capitão
        await conexao.execute(
            'INSERT INTO membros_time (usuario_id, time_id, funcao, posicao) VALUES (?, ?, ?, ?)',
            [userId, timeId, 'titular', 'capitao']
        );

        // Atualizar time_id do usuário
        await conexao.execute(
            'UPDATE usuarios SET time_id = ? WHERE id = ?',
            [timeId, userId]
        );

        await conexao.commit();

        res.status(201).json({
            message: 'Time criado com sucesso',
            time: {
                id: timeId,
                nome,
                tag,
                lider_id: userId
            }
        });

    } catch (error) {
        if (conexao) await conexao.rollback();
        console.error('Erro ao criar time:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- TEAMS DELETE
async function deletarTime(req, res) {
    const { id } = req.params;
    const userId = req.session.user?.id; // ID do usuário logado

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o time existe e se o usuário é o líder
        const [timeRows] = await conexao.execute(
            'SELECT id, lider_id FROM times WHERE id = ?',
            [id]
        );

        if (!timeRows[0]) {
            return res.status(404).json({ message: 'Time não encontrado' });
        }

        if (parseInt(timeRows[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Apenas o líder pode excluir o time' });
        }

        // Iniciar transação para garantir consistência
        await conexao.beginTransaction();

        try {
            // 1. Limpar time_id dos usuários que estavam no time
            await conexao.execute(
                'UPDATE usuarios SET time_id = NULL WHERE time_id = ?',
                [id]
            );

            // 2. Remover membros do time
            await conexao.execute('DELETE FROM membros_time WHERE time_id = ?', [id]);

            // 3. Remover redes sociais do time
            await conexao.execute('DELETE FROM redes_sociais_time WHERE time_id = ?', [id]);

            // 4. Remover destaques do time
            await conexao.execute('DELETE FROM destaques_time WHERE time_id = ?', [id]);

            // 5. Remover notícias do time
            await conexao.execute('DELETE FROM noticias_time WHERE time_id = ?', [id]);

            // 6. Remover conquistas do time
            await conexao.execute('DELETE FROM time_conquistas WHERE time_id = ?', [id]);

            // 7. Remover solicitações pendentes
            await conexao.execute('DELETE FROM solicitacoes_time WHERE time_id = ?', [id]);

            // 8. Por fim, excluir o time
            await conexao.execute('DELETE FROM times WHERE id = ?', [id]);

            // Confirmar transação
            await conexao.commit();

            res.status(200).json({ message: 'Time excluído com sucesso' });

        } catch (error) {
            // Reverter transação em caso de erro
            await conexao.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erro ao excluir time:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- TEAMS UPDATE
async function transferirLideranca(req, res) {
    const { id } = req.params; // ID do time
    const { novoLiderId } = req.body; // ID do novo líder
    const userId = req.session.user?.id; // ID do usuário logado (líder atual)

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (!novoLiderId) {
        return res.status(400).json({ message: 'ID do novo líder é obrigatório' });
    }

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o time existe e se o usuário é o líder atual
        const [timeRows] = await conexao.execute(
            'SELECT id, lider_id, nome FROM times WHERE id = ?',
            [id]
        );

        if (!timeRows[0]) {
            return res.status(404).json({ message: 'Time não encontrado' });
        }

        const time = timeRows[0];
        if (parseInt(time.lider_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Apenas o líder atual pode transferir a liderança' });
        }

        // Verificar se o novo líder é membro do time
        const [membroRows] = await conexao.execute(
            'SELECT usuario_id, funcao FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [id, novoLiderId]
        );

        if (!membroRows[0]) {
            return res.status(400).json({ message: 'O novo líder deve ser membro do time' });
        }

        // Verificar se não está tentando transferir para si mesmo
        if (novoLiderId === userId) {
            return res.status(400).json({ message: 'Você já é o líder do time' });
        }

        // Iniciar transação
        await conexao.beginTransaction();

        try {
            // 1. Atualizar o líder do time
            await conexao.execute(
                'UPDATE times SET lider_id = ? WHERE id = ?',
                [novoLiderId, id]
            );

            // 2. Opcional: Se o novo líder for reserva, promover para titular
            const membro = membroRows[0];
            if (membro.funcao === 'reserva') {
                await conexao.execute(
                    'UPDATE membros_time SET funcao = "titular" WHERE time_id = ? AND usuario_id = ?',
                    [id, novoLiderId]
                );
            }

            // 3. Atualizar time_id do novo líder (se não estiver setado)
            await conexao.execute(
                'UPDATE usuarios SET time_id = ? WHERE id = ? AND (time_id IS NULL OR time_id != ?)',
                [id, novoLiderId, id]
            );

            // Confirmar transação
            await conexao.commit();

            // Buscar dados do novo líder para retornar
            const [novoLiderRows] = await conexao.execute(
                'SELECT username FROM usuarios WHERE id = ?',
                [novoLiderId]
            );

            res.status(200).json({
                message: `Liderança transferida com sucesso para ${novoLiderRows[0].username}`,
                novoLider: {
                    id: novoLiderId,
                    username: novoLiderRows[0].username
                }
            });

        } catch (error) {
            // Reverter transação em caso de erro
            await conexao.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erro ao transferir liderança:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}



// =============================================================
// ====================== [ ATUALIZAR TIME ] ======================

// ----- TIME GET
async function atualizarTime(req, res) {
    const { id } = req.params;
    const { nome, tag, sobre_time, redes, logo_url, banner_url, video_url, noticia, games, cores_perfil } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o usuário é líder do time
        const [teamCheck] = await conexao.execute(
            'SELECT lider_id FROM times WHERE id = ?',
            [id]
        );

        if (!teamCheck[0] || parseInt(teamCheck[0].lider_id) !== parseInt(req.session.user.id)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode atualizar as configurações',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Verificar se nome ou tag já existem (excluindo o próprio time)
        if (nome || tag) {
            const [existingTeam] = await conexao.execute(
                'SELECT id FROM times WHERE (nome = ? OR tag = ?) AND id != ?',
                [nome || '', tag || '', id]
            );

            if (existingTeam.length > 0) {
                return res.status(400).json({
                    message: 'Nome ou tag do time já existem',
                    error: 'TEAM_EXISTS'
                });
            }
        }

        // Atualizar dados do time
        const updateFields = [];
        const updateValues = [];

        if (nome) {
            updateFields.push('nome = ?');
            updateValues.push(nome);
        }
        if (tag) {
            updateFields.push('tag = ?');
            updateValues.push(tag);
        }
        if (sobre_time !== undefined) {
            updateFields.push('sobre_time = ?');
            updateValues.push(sobre_time);
        }
        if (logo_url) {
            updateFields.push('avatar_time_url = ?');
            updateValues.push(logo_url);
        }
        if (banner_url) {
            updateFields.push('banner_time_url = ?');
            updateValues.push(banner_url);
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await conexao.execute(
                `UPDATE times SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Atualizar redes sociais se fornecidas
        if (redes) {
            // Deletar redes sociais existentes
            await conexao.execute('DELETE FROM redes_sociais_time WHERE time_id = ?', [id]);

            // Inserir novas redes sociais
            if (redes.discord || redes.youtube || redes.twitch || redes.twitter) {
                await conexao.execute(
                    'INSERT INTO redes_sociais_time (time_id, discord_url, youtube_url, twitch_url, twitter_url, instagram_url, tiktok_url, faceit_url, gamesclub_url, steam_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, redes.discord || null, redes.youtube || null, redes.twitch || null, redes.twitter || null, redes.instagram || null, redes.tiktok || null, redes.faceit || null, redes.gamesclub || null, redes.steam || null]
                );
            }
        }

        if (video_url) {
            await conexao.execute('DELETE FROM destaques_time WHERE time_id = ?', [id]);
            await conexao.execute('INSERT INTO destaques_time (time_id, video_url) VALUES (?, ?)', [id, video_url]);
        }

        if (noticia) {
            await conexao.execute('DELETE FROM noticias_time WHERE time_id = ?', [id]);
            await conexao.execute('INSERT INTO noticias_time (time_id, titulo, conteudo) VALUES (?, ?, ?)', [id, noticia[0].titulo, noticia[0].conteudo]);
        }

        if (games) {
            await conexao.execute('DELETE FROM games_time WHERE time_id = ?', [id]);
            const game = games.join(',');
            await conexao.execute('INSERT INTO games_time (time_id, game_name) VALUES (?, ?)', [id, game]);

        }

        if (cores_perfil) {
            await conexao.execute('UPDATE times SET cores_perfil = ? WHERE id = ?', [cores_perfil, id]);
        }

        res.json({ message: 'Configurações do time atualizadas com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar time:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- TIME POST


// ----- TIME DELETE
async function removerMembro(req, res) {
    const { timeId, usuarioId } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o usuário é líder do time
        const [teamCheck] = await conexao.execute(
            'SELECT lider_id FROM times WHERE id = ?',
            [timeId]
        );

        if (!teamCheck[0] || parseInt(teamCheck[0].lider_id) !== parseInt(req.session.user.id)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode remover membros',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Verificar se o usuário é membro do time
        const [memberCheck] = await conexao.execute(
            'SELECT id FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [timeId, usuarioId]
        );

        if (memberCheck.length === 0) {
            return res.status(404).json({
                message: 'Usuário não é membro deste time',
                error: 'NOT_TEAM_MEMBER'
            });
        }

        // Remover membro do time
        await conexao.execute(
            'DELETE FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [timeId, usuarioId]
        );

        // Atualizar time_id do usuário para null
        await conexao.execute(
            'UPDATE usuarios SET time_id = NULL WHERE id = ?',
            [usuarioId]
        );

        res.json({ message: 'Membro removido do time com sucesso' });

    } catch (error) {
        console.error('Erro ao remover membro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function MembroSair(req, res) {
    const { timeId, usuarioId } = req.body;

    // Validar se os parâmetros necessários estão presentes
    if (!timeId || !usuarioId) {
        return res.status(400).json({
            message: 'timeId e usuarioId são obrigatórios',
            error: 'MISSING_PARAMETERS'
        });
    }

    let conexao;
    try {
        conexao = await conectar();


        // Verificar se o usuário é membro do time
        const [memberCheck] = await conexao.execute(
            'SELECT id FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [timeId, usuarioId]
        );

        if (memberCheck.length === 0) {
            return res.status(404).json({
                message: 'Usuário não é membro deste time',
                error: 'NOT_TEAM_MEMBER'
            });
        }

        // Remover membro do time
        await conexao.execute(
            'DELETE FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [timeId, usuarioId]
        );

        // Atualizar time_id do usuário para null
        await conexao.execute(
            'UPDATE usuarios SET time_id = NULL WHERE id = ?',
            [usuarioId]
        );

        res.json({ message: 'Membro removido do time com sucesso' });

    } catch (error) {
        console.error('Erro ao remover membro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- TIME UPDATE
async function atualizarPosicaoMembro(req, res) {
    const { timeId, usuarioId } = req.params;
    const { posicao } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o usuário é líder do time
        const [teamCheck] = await conexao.execute(
            'SELECT lider_id FROM times WHERE id = ?',
            [timeId]
        );

        if (!teamCheck[0] || parseInt(teamCheck[0].lider_id) !== parseInt(req.session.user.id)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode alterar posições',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Verificar se o usuário é membro do time
        const [memberCheck] = await conexao.execute(
            'SELECT id FROM membros_time WHERE time_id = ? AND usuario_id = ?',
            [timeId, usuarioId]
        );

        if (memberCheck.length === 0) {
            return res.status(404).json({
                message: 'Usuário não é membro deste time',
                error: 'NOT_TEAM_MEMBER'
            });
        }

        // Verificar se a posição já está ocupada (exceto sub e coach)
        if (posicao !== 'sub' && posicao !== 'coach') {
            const [positionCheck] = await conexao.execute(
                'SELECT id FROM membros_time WHERE time_id = ? AND posicao = ? AND usuario_id != ?',
                [timeId, posicao, usuarioId]
            );

            if (positionCheck.length > 0) {
                return res.status(400).json({
                    message: `A posição ${posicao} já está ocupada por outro membro`,
                    error: 'POSITION_OCCUPIED'
                });
            }
        }

        // Atualizar posição do membro
        await conexao.execute(
            'UPDATE membros_time SET posicao = ? WHERE time_id = ? AND usuario_id = ?',
            [posicao, timeId, usuarioId]
        );

        res.json({ message: 'Posição do membro atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar posição do membro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API SOLICITAÇÕES TIME] =============================================

// ----- SOLICITARÇÃO GET
async function getSolicitacaoById(req, res) { // BUSCAR UMA SOLICITAÇÃO POR ID
    const { solicitacaoId } = req.params;
    let conexao;
    try {
        conexao = await conectar();
        const [rows] = await conexao.execute(
            'SELECT id, usuario_id, time_id, status, data_solicitacao FROM solicitacoes_time WHERE id = ?',
            [solicitacaoId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }
        const solicitacao = rows[0];
        if (solicitacao.status !== 'aceita') {
            return res.status(400).json({ error: 'Solicitação ainda não foi aceita' });
        }

        return res.json({
            id: solicitacao.id,
            usuario_id: solicitacao.usuario_id,
            time_id: solicitacao.time_id,
            status: solicitacao.status,
            data_solicitacao: solicitacao.data_solicitacao
        });
    } catch (error) {
        console.error('Erro ao buscar solicitação por ID:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function listarTodasSolicitacoes(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        let query = 'SELECT * FROM solicitacoes_time';
        const [solicitacoes] = await conexao.execute(query);
        res.json(solicitacoes);
    } catch (error) {
        console.error('Erro ao listar todas as solicitações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


async function verificarStatusSolicitacao(req, res) {
    const { timeId, userId } = req.params;


    let conexao;
    try {
        conexao = await conectar();

        // Buscar solicitação do usuário para este time
        const [solicitacao] = await conexao.execute(
            'SELECT status, data_solicitacao FROM solicitacoes_time WHERE usuario_id = ? AND time_id = ? ORDER BY data_solicitacao DESC LIMIT 1',
            [userId, timeId]
        );

        if (solicitacao.length === 0) {
            return res.json({
                status: 'nenhuma',
                message: 'Nenhuma solicitação encontrada'
            });
        }

        res.json({
            status: solicitacao[0].status,
            data_solicitacao: solicitacao[0].data_solicitacao
        });

    } catch (error) {
        console.error('Erro ao verificar status da solicitação:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- SOLICITARÇÃO POST
async function solicitarEntradaTime(req, res) {
    const { timeId, userId } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Verificar se o usuário já está em um time
        const [userTimeCheck] = await conexao.execute(
            'SELECT time_id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (userTimeCheck[0] && userTimeCheck[0].time_id) {
            return res.status(400).json({
                message: 'Usuário já está em um time',
                error: 'USER_ALREADY_IN_TEAM'
            });
        }

        // Verificar se já existe uma solicitação pendente
        const [existingRequest] = await conexao.execute(
            'SELECT id FROM solicitacoes_time WHERE usuario_id = ? AND time_id = ? AND status = "pendente"',
            [userId, timeId]
        );

        if (existingRequest.length > 0) {
            return res.status(400).json({
                message: 'Já existe uma solicitação pendente para este time',
                error: 'PENDING_REQUEST_EXISTS'
            });
        }

        // Verificar se o time tem vagas disponíveis (máximo 7 membros)
        const [memberCount] = await conexao.execute(
            'SELECT COUNT(*) as count FROM membros_time WHERE time_id = ?',
            [timeId]
        );

        if (memberCount[0].count >= 7) {
            return res.status(400).json({
                message: 'Time não possui vagas disponíveis',
                error: 'TEAM_FULL'
            });
        }

        // Criar a solicitação
        await conexao.execute(
            'INSERT INTO solicitacoes_time (usuario_id, time_id, status) VALUES (?, ?, "pendente")',
            [userId, timeId]
        );

        res.status(201).json({
            message: 'Solicitação enviada com sucesso',
            success: true
        });

    } catch (error) {
        console.error('Erro ao solicitar entrada no time:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- SOLICITARÇÃO DELETE
async function deletarSolicitacao(req, res) {
    const { solicitacaoId } = req.body;

    // Validar se o solicitacaoId está presente
    if (!solicitacaoId) {
        return res.status(400).json({
            message: 'solicitacaoId é obrigatório',
            error: 'MISSING_PARAMETER'
        });
    }

    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'DELETE FROM solicitacoes_time WHERE id = ?',
            [solicitacaoId]
        );

        res.json({ message: 'Solicitação deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar solicitação:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- SOLICITARÇÃO UPDATE
async function aceitarSolicitacao(req, res) {
    const { solicitacaoId, userId } = req.body;


    let conexao;
    try {
        conexao = await conectar();

        // Buscar dados da solicitação
        const [solicitacao] = await conexao.execute(`
            SELECT st.*, t.lider_id, t.id as time_id
            FROM solicitacoes_time st
            JOIN times t ON t.id = st.time_id
            WHERE st.id = ? AND st.status = 'pendente'
        `, [solicitacaoId]);

        if (solicitacao.length === 0) {
            return res.status(404).json({
                message: 'Solicitação não encontrada ou já processada',
                error: 'REQUEST_NOT_FOUND'
            });
        }

        // Verificar se o usuário é líder do time
        if (parseInt(solicitacao[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode aceitar solicitações',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Verificar se ainda há vagas
        const [memberCount] = await conexao.execute(
            'SELECT COUNT(*) as count FROM membros_time WHERE time_id = ?',
            [solicitacao[0].time_id]
        );

        if (memberCount[0].count >= 7) {
            return res.status(400).json({
                message: 'Time não possui mais vagas disponíveis',
                error: 'TEAM_FULL'
            });
        }

        // Iniciar transação
        await conexao.beginTransaction();

        try {
            // Atualizar status da solicitação
            await conexao.execute(
                'UPDATE solicitacoes_time SET status = "aceita" WHERE id = ?',
                [solicitacaoId]
            );

            // Adicionar usuário ao time como reserva
            await conexao.execute(
                'INSERT INTO membros_time (usuario_id, time_id, funcao, posicao) VALUES (?, ?, "reserva", "sub")',
                [solicitacao[0].usuario_id, solicitacao[0].time_id]
            );

            // Atualizar time_id do usuário
            await conexao.execute(
                'UPDATE usuarios SET time_id = ? WHERE id = ?',
                [solicitacao[0].time_id, solicitacao[0].usuario_id]
            );

            await conexao.commit();

            res.json({
                message: 'Solicitação aceita com sucesso',
                success: true
            });

        } catch (error) {
            await conexao.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erro ao aceitar solicitação:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Aceitar solicitação via param e com posição
async function aceitarSolicitacaoPorId(req, res) {
    const { solicitacaoId } = req.params;
    const { userId, posicao } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Buscar dados da solicitação
        const [solicitacao] = await conexao.execute(`
            SELECT st.*, t.lider_id, t.id as time_id
            FROM solicitacoes_time st
            JOIN times t ON t.id = st.time_id
            WHERE st.id = ? AND st.status = 'pendente'
        `, [solicitacaoId]);

        if (solicitacao.length === 0) {
            return res.status(404).json({
                message: 'Solicitação não encontrada ou já processada',
                error: 'REQUEST_NOT_FOUND'
            });
        }

        // Verificar se o usuário é líder do time
        if (parseInt(solicitacao[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode aceitar solicitações',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Verificar se ainda há vagas
        const [memberCount] = await conexao.execute(
            'SELECT COUNT(*) as count FROM membros_time WHERE time_id = ?',
            [solicitacao[0].time_id]
        );

        if (memberCount[0].count >= 7) {
            return res.status(400).json({
                message: 'Time não possui mais vagas disponíveis',
                error: 'TEAM_FULL'
            });
        }

        // Posição default
        const posicaoFinal = posicao || 'sub';

        // Iniciar transação
        await conexao.beginTransaction();

        try {
            // Atualizar status da solicitação
            await conexao.execute(
                'UPDATE solicitacoes_time SET status = "aceita" WHERE id = ?',
                [solicitacaoId]
            );

            // Adicionar usuário ao time com função/posicao
            await conexao.execute(
                'INSERT INTO membros_time (usuario_id, time_id, funcao, posicao) VALUES (?, ?, "reserva", ?)',
                [solicitacao[0].usuario_id, solicitacao[0].time_id, posicaoFinal]
            );

            // Atualizar time_id do usuário
            await conexao.execute(
                'UPDATE usuarios SET time_id = ? WHERE id = ?', [solicitacao[0].time_id, solicitacao[0].usuario_id]
            );

            await conexao.commit();

            res.json({
                message: 'Solicitação aceita com sucesso',
                success: true
            });

        } catch (error) {
            await conexao.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erro ao aceitar solicitação (param):', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Rejeitar solicitação via param
async function rejeitarSolicitacaoPorId(req, res) {
    const { solicitacaoId } = req.params;
    const { userId } = req.body;

    let conexao;
    try {
        conexao = await conectar();

        // Buscar dados da solicitação
        const [solicitacao] = await conexao.execute(`
            SELECT st.*, t.lider_id
            FROM solicitacoes_time st
            JOIN times t ON t.id = st.time_id
            WHERE st.id = ? AND st.status = 'pendente'
        `, [solicitacaoId]);

        if (solicitacao.length === 0) {
            return res.status(404).json({
                message: 'Solicitação não encontrada ou já processada',
                error: 'REQUEST_NOT_FOUND'
            });
        }

        // Verificar se o usuário é líder do time
        if (parseInt(solicitacao[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode rejeitar solicitações',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Atualizar status da solicitação
        await conexao.execute(
            'UPDATE solicitacoes_time SET status = "recusada" WHERE id = ?',
            [solicitacaoId]
        );

        res.json({
            message: 'Solicitação rejeitada',
            success: true
        });

    } catch (error) {
        console.error('Erro ao rejeitar solicitação (param):', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function rejeitarSolicitacao(req, res) {
    const { solicitacaoId, userId } = req.body;


    let conexao;
    try {
        conexao = await conectar();

        // Buscar dados da solicitação
        const [solicitacao] = await conexao.execute(`
            SELECT st.*, t.lider_id
            FROM solicitacoes_time st
            JOIN times t ON t.id = st.time_id
            WHERE st.id = ? AND st.status = 'pendente'
        `, [solicitacaoId]);

        if (solicitacao.length === 0) {
            return res.status(404).json({
                message: 'Solicitação não encontrada ou já processada',
                error: 'REQUEST_NOT_FOUND'
            });
        }

        // Verificar se o usuário é líder do time
        if (parseInt(solicitacao[0].lider_id) !== parseInt(userId)) {
            return res.status(403).json({
                message: 'Apenas o líder do time pode rejeitar solicitações',
                error: 'NOT_TEAM_LEADER'
            });
        }

        // Atualizar status da solicitação
        await conexao.execute(
            'UPDATE solicitacoes_time SET status = "recusada" WHERE id = ?',
            [solicitacaoId]
        );

        res.json({
            message: 'Solicitação rejeitada',
            success: true
        });

    } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}



// ==============================================================================================
// ==================================== [API TRANSFERENCIAS] =============================================

// ----- TRANSFERENCIA GET
async function getTransferencias(req, res) {
    let conexao;
    try {
        conexao = await conectar();

        let query = 'SELECT * FROM transferencias'

        const [transferencias] = await conexao.execute(query)

        res.status(200).json(transferencias)

    } catch (error) {
        console.error('❌ Erro ao buscar transferências:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) {
            await desconectar(conexao);
        }
    }
}

// ----- TRANSFERENCIA POST
async function criarTransferencia(req, res) {
    let conexao;
    try {
        conexao = await conectar();

        const { usuario_id, time_id, tipo, posicao } = req.body;

        // Validar dados
        if (!usuario_id || !time_id || !tipo) {
            return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
        }

        // Verificar se player existe
        const [playerRows] = await conexao.execute(
            'SELECT id FROM usuarios WHERE id = ?',
            [usuario_id]
        );

        if (playerRows.length === 0) {
            return res.status(404).json({ error: 'Player não encontrado' });
        }

        // Verificar se team existe
        const [teamRows] = await conexao.execute(
            'SELECT id FROM times WHERE id = ?',
            [time_id]
        );

        if (teamRows.length === 0) {
            return res.status(404).json({ error: 'Team não encontrado' });
        }

        // Inserir transferência
        const [result] = await conexao.execute(
            'INSERT INTO transferencias (usuario_id, time_id, posicao, tipo) VALUES (?, ?, ?, ?)',
            [usuario_id, time_id, posicao, tipo]
        );

        res.status(200).json({ message: 'Transferência adicionada com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao adicionar transferência:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- TRANSFERENCIA DELETE
async function deletarTransferencia(req, res) {

}
// ----- TRANSFERENCIA UPDATE
async function atualizarTransferencia(req, res) {
    const { id, usuario_id, time_id, tipo } = req.body;

    // Validar se todos os parâmetros necessários estão presentes
    if (!id || !usuario_id || !time_id || !tipo) {
        return res.status(400).json({
            message: 'id, usuario_id, time_id e tipo são obrigatórios',
            error: 'MISSING_PARAMETERS'
        });
    }

    let conexao;
    try {
        conexao = await conectar();

        const [transferenciaRows] = await conexao.execute(
            'SELECT id FROM transferencias WHERE id = ?',
            [id]
        );

        if (transferenciaRows.length === 0) {
            return res.status(404).json({ error: 'Transferência não encontrada' });
        }

        await conexao.execute(
            'UPDATE transferencias SET usuario_id = ?, time_id = ?, tipo = ? WHERE id = ?',
            [usuario_id, time_id, tipo, id]
        );

        res.status(200).json({ message: 'Transferência atualizada com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao atualizar transferência:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API MEDALHAS] =============================================

// ----- MEDALHAS GET
async function getMedalhas(req, res) {
    const { id } = req.params;
    let conexao;

    try {
        conexao = await conectar();

        // Busca a medalha diretamente pelo ID
        const query = `
            SELECT
                id,
                nome,
                descricao,
                imagem_url_campeao,
                imagem_url_segundo,
                iframe_url_campeao,
                iframe_url_segundo,
                edicao_campeonato,
                data_criacao
            FROM medalhas
            WHERE id = ?;
        `;

        const [rows] = await conexao.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Medalha não encontrada." });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error("Erro ao buscar medalhas:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getMedalhasUsuario(req, res) {
    const { id } = req.params; // CORREÇÃO AQUI

    let conexao;
    try {
        conexao = await conectar();

        // A consulta SQL busca as medalhas do usuário usando o ID.
        const query = `
            SELECT
                m.id,
                m.nome,
                m.descricao,
                m.imagem_url_campeao,
                m.imagem_url_segundo,
                m.iframe_url_campeao,
                m.iframe_url_segundo,
                um.position_medalha,
                m.data_criacao,
                um.data_conquista,
                m.edicao_campeonato
            FROM usuario_medalhas um
            JOIN medalhas m ON um.medalha_id = m.id
            WHERE um.usuario_id = ?;
        `;

        const [rows] = await conexao.execute(query, [id]);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Erro ao buscar medalhas do usuário:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- MEDALHAS POST
async function criarMedalhas(req, res) {
    let conexao;

    try {
        const { nome, descricao, imagem_url_campeao, imagem_url_segundo, iframe_url_campeao, iframe_url_segundo, edicao_campeonato} = req.body;

        if (!nome || !descricao || !imagem_url_campeao || !imagem_url_segundo || !edicao_campeonato) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        conexao = await conectar();
        const query = 'INSERT INTO medalhas (nome, descricao, imagem_url_campeao, imagem_url_segundo, iframe_url_campeao, iframe_url_segundo, edicao_campeonato) VALUES (?,?,?,?,?,?,?)';
        await conexao.execute(query, [nome, descricao, imagem_url_campeao, imagem_url_segundo, iframe_url_campeao, iframe_url_segundo,edicao_campeonato]);
        res.status(201).json({ message: 'Medalhas adicionadas com sucesso!' })
    } catch (error) {
        console.error('Erro ao criar medalhas:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function addMedalhasuser(req, res) {
    let conexao;

    try {
        const { usuario_id, medalha_id, position_medalha } = req.body;

        if (!usuario_id || !medalha_id) {
            return res.status(400).json({ message: 'ID do usuário e ID da medalha são obrigatórios' });
        }

        conexao = await conectar();
        
        // Verifica se a medalha já foi atribuída ao usuário
        const checkQuery = 'SELECT * FROM usuario_medalhas WHERE usuario_id = ? AND medalha_id = ?';
        const [existing] = await conexao.execute(checkQuery, [usuario_id, medalha_id]);
        
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Este usuário já possui esta medalha.' });
        }
        
        // Insere a medalha apenas se não existir
        // Se position_medalha não for fornecido, usa NULL
        const query = 'INSERT INTO usuario_medalhas (usuario_id, medalha_id, position_medalha) VALUES (?, ?, ?)';
        await conexao.execute(query, [usuario_id, medalha_id, position_medalha || null]);
        res.status(201).json({ message: 'Medalha adicionada ao usuário com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar medalha ao usuário:', error);
        console.error('Detalhes do erro:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este usuário já possui esta medalha.' });
        }
        res.status(500).json({ message: 'Erro interno no servidor', error: error.message });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- MEDALHAS DELETE
async function deletarMedalhas(req, res) {
    const id = req.params.id;

    let conexao;

    try {
        conexao = await conectar();

        let query = 'DELETE FROM medalhas WHERE id = ?';


        await conexao.execute(query, [id]);

        res.status(200).send({ menssage: `Medalha deletada com sucesso!` })

        // res.status(200).send({menssage: `Medalha ${rows[0].nome} deletada com sucesso!`})
    }
    catch (error) {
        res.status(500).send({ menssage: `Erro ao deletar medalha: ${error}` })
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- MEDALHAS UPDATE
async function atualizarMedalhas(req, res) {
    const id = req.params.id;
    const { nome, descricao, imagem_url_campeao, imagem_url_segundo, iframe_url_campeao, iframe_url_segundo, edicao_campeonato } = req.body;

    let conexao;

    try {
        conexao = await conectar();

        let query = 'UPDATE medalhas SET nome = ?, descricao = ?, imagem_url_campeao = ?, imagem_url_segundo = ?, iframe_url_campeao = ?, iframe_url_segundo = ?, edicao_campeonato = ? WHERE id = ?';

        await conexao.execute(query, [nome, descricao, imagem_url_campeao, imagem_url_segundo, iframe_url_campeao, iframe_url_segundo, edicao_campeonato, id]);

        res.status(200).send({ menssage: `Medalha atualizada com sucesso!` })
    }
    catch (error) {
        res.status(500).send({ menssage: `Erro ao atualizar medalha: ${error}` })
    }
    finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API TROFEUS] ================================================

// ----- TROFEU GET
async function getTrofeus(req, res){
    let conexao;
    try{
        conexao = await conectar();
        const [trofeus] = await conexao.execute('SELECT * FROM trofeus');
        res.status(200).json({ trofeus });
    } catch (error) {
        console.error('Erro ao buscar trofeus:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// ----- TROFEU POST
async function criarTrofeus(req, res) {
    let conexao;

    try {
        conexao = await conectar();

        const { nome, descricao, imagem_url, iframe_url, edicao_campeonato, categoria } = req.body;
        

        if (!nome || !descricao || !imagem_url || !iframe_url || !edicao_campeonato || !categoria) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        await conexao.execute(
            'INSERT INTO trofeus (nome, descricao, imagem_url, iframe_url, edicao_campeonato, categoria) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, descricao, imagem_url, iframe_url, edicao_campeonato, categoria]
        );
        res.status(201).json({ message: 'Trofeu criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar trofeu:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }

}


async function getTrofeusTime(req, res) {
    let conexao;
    const { timeId } = req.params;

    try {
        conexao = await conectar();
        
        const [trofeus] = await conexao.execute(
            `SELECT t.*, tc.time_id 
             FROM trofeus t
             INNER JOIN time_conquistas tc ON t.id = tc.trofeu_id
             WHERE tc.time_id = ?`,
            [timeId]
        );
        
        res.status(200).json(trofeus);
    } catch (error) {
        console.error('Erro ao buscar troféus do time:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function addTrofeuTime(req, res){
    let conexao;

    try{
        conexao = await conectar();
        const { time_id, trofeu_id } = req.body;

        if (!time_id || !trofeu_id) {
            return res.status(400).json({ message: 'time_id e trofeu_id são obrigatórios' });
        }

        await conexao.execute(
            'INSERT INTO time_conquistas (time_id, trofeu_id) VALUES (?, ?)',
            [time_id, trofeu_id]
        );
        res.status(201).json({ message: 'Trofeu adicionado ao time com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar trofeu ao time:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este time já possui este troféu.' });
        }
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- TROFEU DELETE
async function deletarTrofeus(req, res){
    const { id } = req.params;
    let conexao;
    try{
        conexao = await conectar();
        
        // Verificar se o troféu existe
        const [trofeu] = await conexao.execute('SELECT id FROM trofeus WHERE id = ?', [id]);
        if (trofeu.length === 0) {
            return res.status(404).json({ message: 'Troféu não encontrado' });
        }
        
        await conexao.execute('DELETE FROM trofeus WHERE id = ?', [id]);
        res.status(200).json({ message: 'Trofeu deletado com sucesso!' });
    }
    catch (error) {
        console.error('Erro ao deletar trofeu:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- TROFEU UPDATE
async function atualizarTrofeus(req, res){
    const { id } = req.params;
    const { nome, descricao, imagem_url, iframe_url, edicao_campeonato, categoria } = req.body;
    let conexao;
    try{
        conexao = await conectar();
        
        if (!nome || !descricao || !imagem_url || !iframe_url || !edicao_campeonato || !categoria) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }
        
        // Verificar se o troféu existe
        const [trofeu] = await conexao.execute('SELECT id FROM trofeus WHERE id = ?', [id]);
        if (trofeu.length === 0) {
            return res.status(404).json({ message: 'Troféu não encontrado' });
        }
        
        await conexao.execute('UPDATE trofeus SET nome = ?, descricao = ?, imagem_url = ?, iframe_url = ?, edicao_campeonato = ?, categoria = ? WHERE id = ?', [nome, descricao, imagem_url, iframe_url, edicao_campeonato, categoria, id]);
        res.status(200).json({ message: 'Trofeu atualizado com sucesso!' });
    }
    catch (error) {
        console.error('Erro ao atualizar trofeu:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API Noticias] ================================================

// ----- NOTICIA GET

async function getNoticiasDestaques(req, res) {
    let conexao;
    try {
        conexao = await conectar();

        const [noticias] = await conexao.execute(
            'SELECT * FROM noticias_destaques'
        );
        res.status(200).json({ noticias });
    } catch (error) {
        console.error('Erro ao buscar notícias de destaque:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getNoticiasSite(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [noticias] = await conexao.execute(
            'SELECT * FROM noticias_site'
        );
        res.status(200).json({ noticias });
    } catch (error) {

        console.error('Erro ao buscar notícias de site:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getNoticiasCampeonato(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [noticias] = await conexao.execute(
            'SELECT * FROM noticias_campeonato'
        );
        res.status(200).json({ noticias });
    } catch (error) {
        console.error('Erro ao buscar notícias de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- NOTICIA POST
async function criarNoticiaDestaque(req, res) {
    const { tipo, titulo, subtitulo, texto, autor, imagem_url } = req.body;
    let conexao;

    try {
        conexao = await conectar();

        await conexao.execute(
            'INSERT INTO noticias_destaques ( tipo, titulo, subtitulo, texto, autor, imagem_url) VALUES (?, ?, ?, ?, ?, ?)',
            [tipo, titulo, subtitulo, texto, autor, imagem_url]
        );
        res.status(201).json({ message: 'Notícia de destaque criada com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar notícia de destaque:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function criarNoticiaSite(req, res) {
    const { tipo, categoria, titulo, subtitulo, conteudo, autor, versao, imagem_url } = req.body;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'INSERT INTO noticias_site (tipo, categoria, titulo, subtitulo, conteudo, autor, versao, imagem_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tipo, categoria, titulo, subtitulo, conteudo, autor, versao, imagem_url]
        );
        res.status(201).json({ message: 'Notícia adicionada ao site com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar notícia de site:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function criarNoticiaCampeonato(req, res) {
    const { tipo, destaque, titulo, texto, autor, imagem_url } = req.body;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'INSERT INTO noticias_campeonato (tipo, destaque, titulo, texto, autor, imagem_url) VALUES (?, ?, ?, ?, ?, ?)',
            [tipo, destaque, titulo, texto, autor, imagem_url]
        );
        res.status(201).json({ message: 'Notícia de campeonato criada com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar notícia de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- NOTICIA UPDATE
async function atualizarNoticiaDestaque(req, res) {
    const { id, titulo, subtitulo, texto, autor, imagem_url } = req.body;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'UPDATE noticias_destaques SET titulo = ?, subtitulo = ?, texto = ?, autor = ?, imagem_url = ? WHERE id = ?',
            [titulo, subtitulo, texto, autor, imagem_url, id]
        );
        res.status(200).json({ message: 'Notícia de destaque atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar notícia de destaque:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
    }
}


async function atualizarNoticiaSite(req, res) {
    const { id, categoria, titulo, subtitulo, conteudo, autor, versao, imagem_url } = req.body;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'UPDATE noticias_site SET categoria = ?, titulo = ?, subtitulo = ?, conteudo = ?, autor = ?, versao = ?, imagem_url = ? WHERE id = ?',
            [categoria, titulo, subtitulo, conteudo, autor, versao, imagem_url, id]
        );
        res.status(200).json({ message: 'Notícia de site atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar notícia de site:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function atualizarNoticiaCampeonato(req, res) {
    const { id, titulo, texto, autor, imagem_url } = req.body;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'UPDATE noticias_campeonato SET titulo = ?, texto = ?, autor = ?, imagem_url = ? WHERE id = ?',
            [titulo, texto, autor, imagem_url, id]
        );
        res.status(200).json({ message: 'Notícia de campeonato atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar notícia de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- NOTICIA DELETE
async function deletarNoticiaDestaque(req, res) {
    const { id } = req.params;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'DELETE FROM noticias_destaques WHERE id = ?',
            [id]
        );
        res.status(200).json({ message: 'Notícia de destaque deletada com sucesso!' });
    }
    catch (error) {
        console.error('Erro ao deletar notícia de destaque:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function deletarNoticiaSite(req, res) {
    const { id } = req.params;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'DELETE FROM noticias_site WHERE id = ?',
            [id]
        );
        res.status(200).json({ message: 'Notícia de site deletada com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar notícia de site:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function deletarNoticiaCampeonato(req, res) {
    const { id } = req.params;
    let conexao;
    try {
        conexao = await conectar();

        await conexao.execute(
            'DELETE FROM noticias_campeonato WHERE id = ?',
            [id]
        );
        res.status(200).json({ message: 'Notícia de campeonato deletada com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar notícia de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}




// ===============================================================================================
// ==================================== [API Inscricoes] ================================================

// ----- INSCRICAO GET
async function getInscricoesCampeonato(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [inscricoes] = await conexao.execute(`
            SELECT 
                ic.*,
                u.username as organizador_nome,
                u.avatar_url as organizador_avatar
            FROM inscricoes_campeonato ic
            LEFT JOIN usuarios u ON u.id = ic.id_organizador
        `);

        // DEBUG focado em premiação (medalha/troféu) para o frontend do chaveamento
        console.debug('[DEBUG PREMIAÇÃO BACKEND] getInscricoesCampeonato - total registros:', inscricoes.length);
        inscricoes.forEach((item) => {
            console.debug('[DEBUG PREMIAÇÃO BACKEND] inscrição', {
                id: item.id,
                tipo: item.tipo,
                chave: item.chave,
                qnt_times: item.qnt_times,
                medalha_id: item.medalha_id,
                trofeu_id: item.trofeu_id,
                status: item.status
            });
        });

        res.status(200).json({ inscricoes });
    }
    catch (error) {
        console.error('Erro ao buscar inscrições de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getInscricoesTimes(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [inscricoes] = await conexao.execute(
            'SELECT * FROM inscricoes_times'
        );
        res.status(200).json({ inscricoes });
    }
    catch (error) {
        console.error('Erro ao buscar inscrições de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function getHistoricoMembros(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        
        const { campeonato_id, time_id } = req.query;

        let sql = `SELECT mc.*, u.username, u.avatar_url 
                   FROM membros_campeonato mc
                   JOIN usuarios u ON u.id = mc.usuario_id`;
        const params = [];

        const filtros = [];
        if (campeonato_id) {
            filtros.push('mc.campeonato_id = ?');
            params.push(campeonato_id);
        }
        if (time_id) {
            filtros.push('mc.time_id = ?');
            params.push(time_id);
        }

        if (filtros.length > 0) {
            sql += ' WHERE ' + filtros.join(' AND ');
        }

        sql += ' ORDER BY mc.campeonato_id DESC, mc.time_id, mc.id';

        const [historico] = await conexao.execute(sql, params);

        res.status(200).json({ historico });
    }
    catch (error) {
        console.error('Erro ao buscar histórico de membros:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}
// ----- INSCRICAO POST
async function criarInscricaoCampeonato(req, res) {
    const { tipo, mixcamp, titulo, descricao, preco_inscricao, premiacao, imagem_url, trofeu_id, medalha_id, chave, edicao_campeonato, plataforma, game, nivel, formato, qnt_times, regras, id_organizador, status, previsao_data_inicio } = req.body;
    let conexao;
    try {
        conexao = await conectar();
        
        // Converter undefined para null nos campos opcionais
        const trofeuIdValue = trofeu_id !== undefined ? trofeu_id : null;
        const medalhaIdValue = medalha_id !== undefined ? medalha_id : null;
        const imagemUrlValue = imagem_url !== undefined ? imagem_url : null;
        const edicaoValue = edicao_campeonato !== undefined ? edicao_campeonato : null;

        // DEBUG focado em premiação na criação de campeonatos
        console.debug('[DEBUG PREMIAÇÃO BACKEND] criarInscricaoCampeonato', {
            tipo,
            titulo,
            chave,
            qnt_times,
            trofeu_id_original: trofeu_id,
            medalha_id_original: medalha_id,
            trofeuIdValue,
            medalhaIdValue,
            id_organizador,
            status
        });
        
        await conexao.execute(
            'INSERT INTO inscricoes_campeonato (tipo, mixcamp, titulo, descricao, preco_inscricao, premiacao, imagem_url, trofeu_id, medalha_id, chave, edicao_campeonato, plataforma, game, nivel, formato, qnt_times, regras, id_organizador, status, previsao_data_inicio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tipo, mixcamp, titulo, descricao, preco_inscricao, premiacao, imagemUrlValue, trofeuIdValue, medalhaIdValue, chave, edicaoValue, plataforma, game, nivel, formato, qnt_times, regras, id_organizador, status, previsao_data_inicio]
        );
        res.status(201).json({ message: 'Inscrição de campeonato criada com sucesso!' });
    }
    catch (error) {
        console.error('Erro ao criar inscrição de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// -----------------------------------------------------------------------------------
// Função auxiliar: registrar histórico de membros de um time em um campeonato
// -----------------------------------------------------------------------------------
async function registrarHistoricoMembrosCampeonato(conexao, campeonatoId, timeId) {
    try {
        if (!campeonatoId || !timeId) return;

        // Verificar se já existe histórico para este campeonato + time
        const [jaExiste] = await conexao.execute(
            'SELECT COUNT(*) AS total FROM membros_campeonato WHERE campeonato_id = ? AND time_id = ?',
            [campeonatoId, timeId]
        );

        if (jaExiste[0].total > 0) {
            // Já existe histórico salvo, não duplicar
            return;
        }

        // Buscar membros atuais do time com suas posições/funções
        const [membros] = await conexao.execute(
            'SELECT usuario_id, posicao FROM membros_time WHERE time_id = ?',
            [timeId]
        );

        if (!membros || membros.length === 0) {
            return;
        }

        // Montar valores para insert em lote
        const values = membros.map(m => [campeonatoId, m.usuario_id, timeId, m.posicao]);

        await conexao.query(
            'INSERT INTO membros_campeonato (campeonato_id, usuario_id, time_id, posicao) VALUES ?',
            [values]
        );
    } catch (error) {
        console.error('Erro ao registrar histórico de membros do campeonato:', error);
        // Não lançar erro para não quebrar o fluxo principal de inscrição/pagamento
    }
}

async function criarInscricaoTimes(req, res) {
    const { cardId, timeId } = req.body;
    
    if (!cardId || !timeId) {
        return res.status(400).json({ message: 'cardId e timeId são obrigatórios' });
    }
    
    let conexao;
    try {
        conexao = await conectar();
        
        // Verificar se o time já está inscrito neste campeonato
        const [existe] = await conexao.execute(
            'SELECT id FROM inscricoes_times WHERE inscricao_id = ? AND time_id = ?',
            [cardId, timeId]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({ message: 'Este time já está inscrito neste campeonato' });
        }
        
        // Verificar se o campeonato existe e se há vagas disponíveis
        const [campeonato] = await conexao.execute(
            'SELECT qnt_times FROM inscricoes_campeonato WHERE id = ?',
            [cardId]
        );
        
        if (campeonato.length === 0) {
            return res.status(404).json({ message: 'Campeonato não encontrado' });
        }
        
        // Contar quantos times já estão inscritos
        const [inscritos] = await conexao.execute(
            'SELECT COUNT(*) as total FROM inscricoes_times WHERE inscricao_id = ?',
            [cardId]
        );
        
        const totalInscritos = inscritos[0].total;
        const qntTimesMax = parseInt(campeonato[0].qnt_times);
        
        if (totalInscritos >= qntTimesMax) {
            return res.status(400).json({ message: 'Campeonato já atingiu o número máximo de times' });
        }
        
        // Inserir a inscrição
        await conexao.execute(
            'INSERT INTO inscricoes_times (inscricao_id, time_id) VALUES (?, ?)',
            [cardId, timeId]
        );

        // Registrar histórico de membros deste time para este campeonato
        await registrarHistoricoMembrosCampeonato(conexao, cardId, timeId);
        
        res.status(201).json({ 
            message: 'Inscrição realizada com sucesso!',
            vagasRestantes: qntTimesMax - totalInscritos - 1
        });
    } catch (error) {
        console.error('Erro ao criar inscrição de times:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Este time já está inscrito neste campeonato' });
        }
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// Mantém a rota manual para criar histórico de um único membro (se precisar no futuro)
async function criarHistoricoMembros(req, res) {
    const { campeonato_id, usuario_id, time_id, posicao } = req.body;
    let conexao;
    try {
        conexao = await conectar();
        await conexao.execute(
            'INSERT INTO membros_campeonato (campeonato_id, usuario_id, time_id, posicao) VALUES (?, ?, ?, ?)',
            [campeonato_id, usuario_id, time_id, posicao]
        );
        res.status(201).json({ message: 'Histórico de membros criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar histórico de membros:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- INSCRICAO UPDATE
async function atualizarInscricaoCampeonato(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const { id, ...dados } = req.body;

        // Monta o SQL dinamicamente
        const campos = Object.keys(dados);
        const valores = Object.values(dados);

        const setClause = campos.map(campo => `${campo} = ?`).join(', ');

        const sql = `UPDATE inscricoes_campeonato SET ${setClause} WHERE id = ?`;
        await conexao.execute(sql, [...valores, id]);

        res.json({ message: 'Inscrição atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar inscrição de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function atualizarInscricaoTimes(req, res) {
    const { id, inscricao_id, time_id, status_pagamento } = req.body;
    
    if (!id) {
        return res.status(400).json({ message: 'ID da inscrição é obrigatório' });
    }
    
    let conexao;
    try {
        conexao = await conectar();
        
        // Verificar se a inscrição existe
        const [existe] = await conexao.execute(
            'SELECT id FROM inscricoes_times WHERE id = ?',
            [id]
        );
        
        if (existe.length === 0) {
            return res.status(404).json({ message: 'Inscrição não encontrada' });
        }
        
        // Construir query dinamicamente baseado nos campos fornecidos
        const updates = [];
        const values = [];
        
        if (inscricao_id !== undefined) {
            updates.push('inscricao_id = ?');
            values.push(inscricao_id);
        }
        
        if (time_id !== undefined) {
            updates.push('time_id = ?');
            values.push(time_id);
        }
        
        if (status_pagamento !== undefined) {
            updates.push('status_pagamento = ?');
            values.push(status_pagamento);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'Nenhum campo para atualizar' });
        }
        
        values.push(id);
        
        await conexao.execute(
            `UPDATE inscricoes_times SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.status(200).json({ 
            message: 'Inscrição atualizada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao atualizar inscrição de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function atualizarHistoricoMembros(req, res) {
    const { id, campeonato_id, usuario_id, time_id, posicao } = req.body;
    let conexao;
    try {
        conexao = await conectar();
        await conexao.execute(
            'UPDATE membros_campeonato SET campeonato_id = ?, usuario_id = ?, time_id = ?, posicao = ? WHERE id = ?',
            [campeonato_id, usuario_id, time_id, posicao, id]
        );
        res.status(200).json({ message: 'Histórico de membros atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar histórico de membros:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ----- INSCRICAO DELETE
async function deletarInscricaoCampeonato(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [inscricao] = await conexao.execute(
            'DELETE FROM inscricoes_campeonato WHERE id = ?',
        );
    }
    catch (error) {
        console.error('Erro ao deletar inscrição de campeonato:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

async function deletarInscricaoTimes(req, res) {
    const { id } = req.body;
    
    if (!id) {
        return res.status(400).json({ message: 'ID da inscrição é obrigatório' });
    }
    
    let conexao;
    try {
        conexao = await conectar();
        
        // Verificar se a inscrição existe
        const [existe] = await conexao.execute(
            'SELECT id, payment_id, status_pagamento FROM inscricoes_times WHERE id = ?',
            [id]
        );
        
        if (existe.length === 0) {
            return res.status(404).json({ message: 'Inscrição não encontrada' });
        }
        
        // Aviso se houver pagamento associado
        if (existe[0].payment_id && existe[0].status_pagamento === 'approved') {
            console.warn(`⚠️ Tentativa de deletar inscrição com pagamento aprovado. ID: ${id}, Payment: ${existe[0].payment_id}`);
            // Você pode escolher bloquear a exclusão ou apenas avisar
            // return res.status(400).json({ message: 'Não é possível deletar inscrição com pagamento aprovado' });
        }
        
        await conexao.execute(
            'DELETE FROM inscricoes_times WHERE id = ?',
            [id]
        );
        
        res.status(200).json({ 
            message: 'Inscrição deletada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao deletar inscrição de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API USUÁRIOS ADMIN] =====================================

// ===============================================================================================
// Função para listar todos os usuários para o painel administrativo
// Retorna dados completos dos usuários (exceto senha) com informações do time
// ===============================================================================================
async function listarTodosUsuarios(req, res) {
    let conexao;

    try {
        conexao = await conectar();

        // Query para buscar todos os usuários com informações do time e quantidade de medalhas
        const query = `
            SELECT 
                u.id,
                u.username,
                u.email,
                u.data_criacao,
                u.avatar_url,
                u.banner_url,
                u.gerencia,
                u.cores_perfil,
                u.steamid,
                u.faceitid,
                t.id as time_id,
                t.nome as time_nome,
                t.avatar_time_url,
                t.tag as time_tag,
                COALESCE(medalhas_count.total_medalhas, 0) as total_medalhas
            FROM usuarios u
            LEFT JOIN times t ON t.id = u.time_id
            LEFT JOIN (
                SELECT 
                    usuario_id,
                    COUNT(*) as total_medalhas
                FROM usuario_medalhas
                GROUP BY usuario_id
            ) medalhas_count ON medalhas_count.usuario_id = u.id
            ORDER BY CAST(u.id AS UNSIGNED) ASC
        `;

        const [usuarios] = await conexao.execute(query);

        // Contar total de usuários
        const [countResult] = await conexao.execute('SELECT COUNT(*) as total FROM usuarios');
        const totalUsuarios = countResult[0].total;

        res.status(200).json({
            usuarios: usuarios,
            total: totalUsuarios,
            message: 'Usuários listados com sucesso'
        });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            message: 'Erro interno do servidor',
            error: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// Função para obter estatísticas gerais dos usuários
// Retorna contadores e informações resumidas
// ===============================================================================================
async function getEstatisticasUsuarios(req, res) {
    let conexao;

    try {
        conexao = await conectar();

        // Contar usuários por nível de gerência
        const [gerenciaStats] = await conexao.execute(`
            SELECT 
                gerencia,
                COUNT(*) as total
            FROM usuarios 
            GROUP BY gerencia
        `);

        // Contar usuários com e sem time
        const [timeStats] = await conexao.execute(`
            SELECT 
                CASE 
                    WHEN time_id IS NULL THEN 'sem_time'
                    ELSE 'com_time'
                END as status,
                COUNT(*) as total
            FROM usuarios 
            GROUP BY status
        `);

        // Contar usuários por posição (removido por enquanto - coluna não existe)
        const posicaoStats = [];

        // Total geral
        const [totalResult] = await conexao.execute('SELECT COUNT(*) as total FROM usuarios');

        res.status(200).json({
            totalUsuarios: totalResult[0].total,
            porGerencia: gerenciaStats,
            porTime: timeStats,
            porPosicao: posicaoStats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas dos usuários:', error);
        res.status(500).json({
            message: 'Erro interno do servidor',
            error: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

/**
 * Atualiza a gerência de um usuário
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function atualizarGerenciaUsuario(req, res) {
    let conexao;

    try {
        const { id } = req.params;
        const { gerencia } = req.body;

        // Validar dados
        if (!id || !gerencia) {
            return res.status(400).json({
                message: 'ID do usuário e gerência são obrigatórios'
            });
        }

        // Validar gerência
        const gerenciasValidas = ['admin', 'moderador', 'streammer', 'apoiador', 'user'];
        if (!gerenciasValidas.includes(gerencia)) {
            return res.status(400).json({
                message: 'Gerência inválida. Valores aceitos: admin, moderador, streammer, apoiador, user'
            });
        }

        conexao = await conectar();

        // Verificar se usuário existe
        const [usuarioExiste] = await conexao.execute(
            'SELECT id, username FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({
                message: 'Usuário não encontrado'
            });
        }

        // Atualizar gerência
        await conexao.execute(
            'UPDATE usuarios SET gerencia = ? WHERE id = ?',
            [gerencia, id]
        );

        res.status(200).json({
            message: 'Gerência atualizada com sucesso',
            usuario: {
                id: usuarioExiste[0].id,
                username: usuarioExiste[0].username,
                gerencia: gerencia
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar gerência do usuário:', error);
        res.status(500).json({
            message: 'Erro interno do servidor',
            error: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [CHAVEAMENTO] ============================================
// ===============================================================================================

// =====================================================
// Criar/Inicializar chaveamento para um campeonato
// =====================================================
async function criarChaveamento(req, res) {
    let conexao;
    try {
        const { campeonato_id, formato_chave, quantidade_times } = req.body;

        if (!campeonato_id || !formato_chave || !quantidade_times) {
            return res.status(400).json({
                error: 'campeonato_id, formato_chave e quantidade_times são obrigatórios'
            });
        }

        conexao = await conectar();

        // Verificar se já existe chaveamento para este campeonato
        const [existentes] = await conexao.execute(
            'SELECT id FROM chaveamentos WHERE campeonato_id = ?',
            [campeonato_id]
        );

        if (existentes.length > 0) {
            return res.status(400).json({
                error: 'Chaveamento já existe para este campeonato',
                chaveamento_id: existentes[0].id
            });
        }

        // Criar chaveamento
        const [result] = await conexao.execute(
            `INSERT INTO chaveamentos (campeonato_id, formato_chave, quantidade_times, status)
             VALUES (?, ?, ?, 'nao_iniciado')`,
            [campeonato_id, formato_chave, quantidade_times]
        );

        res.status(201).json({
            message: 'Chaveamento criado com sucesso',
            chaveamento_id: result.insertId
        });

    } catch (error) {
        console.error('Erro ao criar chaveamento:', error);
        res.status(500).json({
            error: 'Erro ao criar chaveamento',
            details: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// =====================================================
// Obter estado completo do chaveamento
// =====================================================
async function getChaveamento(req, res) {
    let conexao;
    try {
        const { campeonato_id } = req.params;

        if (!campeonato_id) {
            return res.status(400).json({ error: 'campeonato_id é obrigatório' });
        }

        conexao = await conectar();

        // Buscar chaveamento
        const [chaveamentos] = await conexao.execute(
            `SELECT * FROM chaveamentos WHERE campeonato_id = ?`,
            [campeonato_id]
        );

        if (chaveamentos.length === 0) {
            return res.status(404).json({ error: 'Chaveamento não encontrado' });
        }

        const chaveamento = chaveamentos[0];

        // Buscar todas as partidas
        let [partidas] = await conexao.execute(
            `SELECT p.*, 
                    t1.nome as time1_nome, t1.avatar_time_url as time1_logo,
                    t2.nome as time2_nome, t2.avatar_time_url as time2_logo,
                    tv.nome as vencedor_nome, tv.avatar_time_url as vencedor_logo
             FROM partidas p
             LEFT JOIN times t1 ON p.time1_id = t1.id
             LEFT JOIN times t2 ON p.time2_id = t2.id
             LEFT JOIN times tv ON p.time_vencedor_id = tv.id
             WHERE p.chaveamento_id = ?
             ORDER BY p.round_num, p.bracket_type, p.match_id`,
            [chaveamento.id]
        );
        
        // IMPORTANTE: Corrigir round_num de todas as partidas baseado no match_id
        // Isso corrige partidas que foram criadas com round_num incorreto
        for (const partida of partidas) {
            if (partida.match_id) {
                const matchIdParts = partida.match_id.split('_');
                if (matchIdParts.length >= 2) {
                    let roundNumCorreto = null;
                    
                    if (matchIdParts[0] === 'upper' || matchIdParts[0] === 'lower') {
                        roundNumCorreto = parseInt(matchIdParts[1]);
                    } else if (partida.match_id.startsWith('grand_final')) {
                        roundNumCorreto = 1; // Grand Final sempre é round 1
                    }
                    
                    if (roundNumCorreto && partida.round_num !== roundNumCorreto) {
                        await conexao.execute(
                            'UPDATE partidas SET round_num = ? WHERE id = ?',
                            [roundNumCorreto, partida.id]
                        );
                        // Atualizar o objeto local
                        partida.round_num = roundNumCorreto;
                    }
                }
            }
        }
        
        // Buscar novamente para ter os dados atualizados
        [partidas] = await conexao.execute(
            `SELECT p.*, 
                    t1.nome as time1_nome, t1.avatar_time_url as time1_logo,
                    t2.nome as time2_nome, t2.avatar_time_url as time2_logo,
                    tv.nome as vencedor_nome, tv.avatar_time_url as vencedor_logo
             FROM partidas p
             LEFT JOIN times t1 ON p.time1_id = t1.id
             LEFT JOIN times t2 ON p.time2_id = t2.id
             LEFT JOIN times tv ON p.time_vencedor_id = tv.id
             WHERE p.chaveamento_id = ?
             ORDER BY p.round_num, p.bracket_type, p.match_id`,
            [chaveamento.id]
        );

        // Buscar posições dos times
        const [posicoes] = await conexao.execute(
            `SELECT pt.*, t.nome as time_nome, t.avatar_time_url as time_logo
             FROM posicoes_times pt
             LEFT JOIN times t ON pt.time_id = t.id
             WHERE pt.chaveamento_id = ?`,
            [chaveamento.id]
        );

        // Buscar resultados detalhados
        const [resultados] = await conexao.execute(
            `SELECT rp.*, p.match_id, p.bracket_type
             FROM resultados_partidas rp
             JOIN partidas p ON rp.partida_id = p.id
             WHERE p.chaveamento_id = ?
             ORDER BY rp.partida_id, rp.mapa_num`,
            [chaveamento.id]
        );

        res.status(200).json({
            chaveamento,
            partidas,
            posicoes_times: posicoes,
            resultados: resultados
        });

    } catch (error) {
        console.error('Erro ao buscar chaveamento:', error);
        res.status(500).json({
            error: 'Erro ao buscar chaveamento',
            details: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// =====================================================
// Salvar resultado de uma partida e atualizar posições
// =====================================================
async function salvarResultadoPartida(req, res) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        let conexao;
        try {
            const { chaveamento_id, match_id, time_vencedor_id, score_time1, score_time2, resultados_mapas, time1_id, time2_id } = req.body;

            if (!chaveamento_id || !match_id || !time_vencedor_id) {
                return res.status(400).json({
                    error: 'chaveamento_id, match_id e time_vencedor_id são obrigatórios'
                });
            }

            conexao = await conectar();

            // Configurar timeout para evitar deadlocks (5 segundos)
            await conexao.execute('SET SESSION innodb_lock_wait_timeout = 5');
            
            // Iniciar transação
            await conexao.beginTransaction();

            // Buscar partida
            let [partidas] = await conexao.execute(
                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                [chaveamento_id, match_id]
            );

            let partida;
            
            // Se a partida não existir, criar automaticamente
            if (partidas.length === 0) {
                // Extrair informações do match_id (ex: "upper_1_1", "lower_2_3", "grand_final_1")
                const matchParts = match_id.split('_');
                let bracket_type = 'upper';
                let round_num = 1;
                let formato_partida = 'B01'; // Padrão BO1
                
                if (match_id.startsWith('lower_')) {
                    bracket_type = 'lower';
                    round_num = parseInt(matchParts[1]) || 1;
                } else if (match_id.startsWith('grand_final')) {
                    bracket_type = 'grand_final';
                    round_num = 1;
                    formato_partida = 'B03'; // Grand Final geralmente é BO3
                } else if (match_id.startsWith('upper_')) {
                    bracket_type = 'upper';
                    round_num = parseInt(matchParts[1]) || 1;
                }
                
                // Determinar formato baseado no round (se for final, geralmente é BO3)
                // Buscar informações do chaveamento para determinar formato
                const [chaveamentos] = await conexao.execute(
                    'SELECT * FROM chaveamentos WHERE id = ?',
                    [chaveamento_id]
                );
                
                if (chaveamentos.length > 0) {
                    const chaveamento = chaveamentos[0];
                    const formatoChave = chaveamento.formato_chave;
                    
                    // Se for final e formato não for single_b01, usar BO3
                    if (bracket_type === 'grand_final' || (bracket_type === 'upper' && round_num > 1 && formatoChave !== 'single_b01')) {
                        formato_partida = 'B03';
                    }
                }
                
                // Criar a partida usando INSERT IGNORE para evitar erro se já existir
                try {
                    const [result] = await conexao.execute(
                        `INSERT IGNORE INTO partidas (chaveamento_id, match_id, round_num, bracket_type, formato_partida, status)
                         VALUES (?, ?, ?, ?, ?, 'agendada')`,
                        [chaveamento_id, match_id, round_num, bracket_type, formato_partida]
                    );
                    
                    // Se foi inserido, buscar pelo insertId
                    if (result.insertId) {
                        [partidas] = await conexao.execute(
                            'SELECT * FROM partidas WHERE id = ?',
                            [result.insertId]
                        );
                    } else {
                        // Se não foi inserido (já existia), buscar novamente
                        [partidas] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, match_id]
                        );
                    }
                } catch (insertError) {
                    // Se der erro de duplicata, buscar a partida existente
                    if (insertError.code === 'ER_DUP_ENTRY' || insertError.errno === 1062) {
                        [partidas] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, match_id]
                        );
                    } else {
                        throw insertError;
                    }
                }
                
                if (partidas.length === 0) {
                    await conexao.rollback();
                    return res.status(500).json({ error: 'Erro ao criar ou buscar partida' });
                }
            }

            partida = partidas[0];

            // Se a partida não tem times definidos ainda, precisamos obter do frontend ou criar
            // Por enquanto, vamos assumir que o frontend envia o time vencedor e precisamos descobrir o perdedor
            // Mas como não temos os dois times, vamos precisar ajustar a lógica
            
            // Se a partida não tem time1_id ou time2_id, precisamos buscar do match_id ou do frontend
            // Por enquanto, vamos permitir salvar mesmo sem os dois times definidos
            // O frontend deve enviar ambos os IDs ou precisamos buscar de outra forma
            
            let time_perdedor_id = null;
            
            // Se a partida já tem os dois times definidos, validar
            if (partida.time1_id && partida.time2_id) {
                if (time_vencedor_id !== partida.time1_id && time_vencedor_id !== partida.time2_id) {
                    await conexao.rollback();
                    return res.status(400).json({ error: 'Time vencedor não é um dos participantes da partida' });
                }
                time_perdedor_id = time_vencedor_id === partida.time1_id ? partida.time2_id : partida.time1_id;
            } else {
                // Se não tem os dois times, precisamos buscar do frontend ou inferir
                // Por enquanto, vamos precisar que o frontend envie ambos os IDs
                // Mas para não quebrar, vamos tentar buscar do match_id ou deixar null
                // O frontend deve enviar time1_id e time2_id no body
                const { time1_id, time2_id } = req.body;
                
                if (time1_id && time2_id) {
                    // Atualizar a partida com os times
                    await conexao.execute(
                        'UPDATE partidas SET time1_id = ?, time2_id = ? WHERE id = ?',
                        [time1_id, time2_id, partida.id]
                    );
                    
                    // Determinar perdedor
                    time_perdedor_id = time_vencedor_id === time1_id ? time2_id : time1_id;
                    
                    // Atualizar partida local
                    partida.time1_id = time1_id;
                    partida.time2_id = time2_id;
                } else {
                    // Se não temos os dois times, não podemos determinar o perdedor
                    // Mas vamos permitir salvar o vencedor e deixar o perdedor como null por enquanto
                    console.warn('Partida sem time1_id e time2_id definidos. Salvando apenas vencedor.');
                }
            }

            // Calcular scores corretos baseado em qual time é time1 e qual é time2
            // Para BO1: vencedor = 1, perdedor = 0
            let finalScoreTime1, finalScoreTime2;
            
            // Se scores foram fornecidos explicitamente, usar eles (para BO3/BO5)
            if (score_time1 !== undefined && score_time2 !== undefined && score_time1 !== null && score_time2 !== null) {
                finalScoreTime1 = score_time1;
                finalScoreTime2 = score_time2;
            } else {
                // Calcular automaticamente para BO1
                // Usar time1_id da partida (que pode ter sido atualizado acima)
                const time1Id = partida.time1_id;
                const time2Id = partida.time2_id;
                
                if (time1Id && time2Id) {
                    if (time_vencedor_id === time1Id) {
                        // Time 1 venceu
                        finalScoreTime1 = 1;
                        finalScoreTime2 = 0;
                    } else if (time_vencedor_id === time2Id) {
                        // Time 2 venceu
                        finalScoreTime1 = 0;
                        finalScoreTime2 = 1;
                    } else {
                        // Fallback: assumir que time_vencedor_id é time1
                        finalScoreTime1 = 1;
                        finalScoreTime2 = 0;
                    }
                } else {
                    // Se não temos os dois times, usar scores padrão
                    finalScoreTime1 = 1;
                    finalScoreTime2 = 0;
                }
            }

            // Buscar informações do chaveamento (precisamos saber se é Double Elimination)
            const [chaveamentos] = await conexao.execute(
                'SELECT * FROM chaveamentos WHERE id = ?',
                [chaveamento_id]
            );
            const chaveamento = chaveamentos[0];
            const isDoubleElimination = chaveamento.formato_chave === 'double_elimination';

            // Verificar se já havia um resultado anterior (para limpar posições antigas)
            const time_vencedor_anterior = partida.time_vencedor_id;
            
            // Se havia um vencedor anterior, determinar o perdedor anterior
            if (time_vencedor_anterior && partida.time1_id && partida.time2_id) {
                const perdedor_anterior = time_vencedor_anterior === partida.time1_id ? partida.time2_id : partida.time1_id;
                // Se o novo vencedor é diferente do anterior, precisamos limpar posições antigas
                // IMPORTANTE: Só limpar se realmente houver um resultado anterior salvo
                if (time_vencedor_anterior && time_vencedor_anterior !== time_vencedor_id) {
                    console.log('Resultado alterado! Limpando posições antigas...', {
                        vencedor_anterior: time_vencedor_anterior,
                        vencedor_novo: time_vencedor_id,
                        perdedor_anterior: perdedor_anterior,
                        perdedor_novo: time_perdedor_id
                    });
                    
                    // Limpar posições antigas do vencedor anterior (remover da partida de destino)
                    const proximoRoundAntigo = partida.round_num + 1;
                    let proximoMatchIdAntigo = null;
                    
                    if (partida.bracket_type === 'upper') {
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        const proximoMatchIndex = Math.ceil(matchIndex / 2);
                        proximoMatchIdAntigo = `upper_${proximoRoundAntigo}_${proximoMatchIndex}`;
                    } else if (partida.bracket_type === 'lower') {
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        const proximoMatchIndex = Math.ceil(matchIndex / 2);
                        proximoMatchIdAntigo = `lower_${proximoRoundAntigo}_${proximoMatchIndex}`;
                    }
                    
                    // Remover vencedor anterior da partida de destino
                    if (proximoMatchIdAntigo) {
                        const [partidasDestinoAntigo] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchIdAntigo]
                        );
                        
                        if (partidasDestinoAntigo.length > 0) {
                            const partidaDestinoAntigo = partidasDestinoAntigo[0];
                            if (partidaDestinoAntigo.time1_id === time_vencedor_anterior) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = NULL WHERE id = ?',
                                    [partidaDestinoAntigo.id]
                                );
                            }
                            if (partidaDestinoAntigo.time2_id === time_vencedor_anterior) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = NULL WHERE id = ?',
                                    [partidaDestinoAntigo.id]
                                );
                            }
                        }
                    }
                    
                    // Limpar posições antigas do perdedor anterior (remover do Lower Bracket se aplicável)
                    if (partida.bracket_type === 'upper' && isDoubleElimination && perdedor_anterior) {
                        // Buscar todas as partidas do Lower Bracket onde o perdedor anterior pode estar
                        const [partidasLowerAntigo] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND bracket_type = ? AND (time1_id = ? OR time2_id = ?)',
                            [chaveamento_id, 'lower', perdedor_anterior, perdedor_anterior]
                        );
                        
                        for (const partidaLowerAntigo of partidasLowerAntigo) {
                            if (partidaLowerAntigo.time1_id === perdedor_anterior) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = NULL WHERE id = ?',
                                    [partidaLowerAntigo.id]
                                );
                            }
                            if (partidaLowerAntigo.time2_id === perdedor_anterior) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = NULL WHERE id = ?',
                                    [partidaLowerAntigo.id]
                                );
                            }
                        }
                    }
                }
            }

            // Atualizar partida
            await conexao.execute(
                `UPDATE partidas 
                 SET time_vencedor_id = ?, score_time1 = ?, score_time2 = ?, status = 'finalizada'
                 WHERE id = ?`,
                [time_vencedor_id, finalScoreTime1, finalScoreTime2, partida.id]
            );
            
            // Buscar a partida atualizada para garantir que temos os dados corretos
            const [partidasAtualizadas] = await conexao.execute(
                'SELECT * FROM partidas WHERE id = ?',
                [partida.id]
            );
            if (partidasAtualizadas.length > 0) {
                partida = partidasAtualizadas[0];
            }

            // Salvar resultados dos mapas (se fornecidos)
            if (resultados_mapas && Array.isArray(resultados_mapas)) {
                for (const resultado of resultados_mapas) {
                    await conexao.execute(
                        `INSERT INTO resultados_partidas (partida_id, mapa_num, score_time1, score_time2, time_vencedor_mapa)
                         VALUES (?, ?, ?, ?, ?)`,
                        [partida.id, resultado.mapa_num, resultado.score_time1, resultado.score_time2, resultado.time_vencedor_mapa]
                    );
                }
            } else {
                // Para BO1, criar um resultado padrão usando os scores calculados
                await conexao.execute(
                    `INSERT INTO resultados_partidas (partida_id, mapa_num, score_time1, score_time2, time_vencedor_mapa)
                     VALUES (?, 1, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE score_time1 = ?, score_time2 = ?, time_vencedor_mapa = ?`,
                    [partida.id, finalScoreTime1, finalScoreTime2, time_vencedor_id, finalScoreTime1, finalScoreTime2, time_vencedor_id]
                );
            }


            // ============================================
            // LÓGICA DE PROGRESSÃO AUTOMÁTICA
            // ============================================

            // 1. TIME VENCEDOR - Avançar para próximo round
            let proximoRound = partida.round_num + 1;
            let proximoMatchId = null;
            let forceDestinoSlot = null;
            
            // Calcular próximo match_id baseado no formato
            if (partida.bracket_type === 'upper') {
                // No Upper Bracket
                const quantidadeTimes = chaveamento.quantidade_times;
                
                if (quantidadeTimes === 20 && partida.round_num === 1 && isDoubleElimination) {
                    // 20 times Double Elimination: Round 1 são os 4 play-ins (T1..T8)
                    // Vencedores alimentam os quatro primeiros cards da Pré-Oitavas (Round 2)
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 2;
                    const mappingPlayInToRound2 = {
                        1: 1, // Winner do Play-in 1 -> Card 1 da Pré-Oitavas
                        2: 2, // Winner do Play-in 2 -> Card 2
                        3: 3, // Winner do Play-in 3 -> Card 3
                        4: 4  // Winner do Play-in 4 -> Card 4
                    };
                    const proximoMatchIndex = mappingPlayInToRound2[matchIndex] || 1;
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 20 && partida.round_num === 1 && !isDoubleElimination) {
                    // 20 times Single Elimination: Round 1 são os 4 play-ins (T1..T8)
                    // Vencedores alimentam os quatro primeiros cards da Pré-Oitavas (Round 2)
                    // Mesma lógica do Double Elimination para Round 1 → Round 2
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 2;
                    const mappingPlayInToRound2 = {
                        1: 1, // Winner do Play-in 1 -> Card 1 da Pré-Oitavas
                        2: 2, // Winner do Play-in 2 -> Card 2
                        3: 3, // Winner do Play-in 3 -> Card 3
                        4: 4  // Winner do Play-in 4 -> Card 4
                    };
                    const proximoMatchIndex = mappingPlayInToRound2[matchIndex] || 1;
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                    console.log('[DEBUG 20T ROUND1] Vencedor do play-in avançando', {
                        match_id_origem: match_id,
                        matchIndex,
                        proximoRound,
                        proximoMatchId
                    });
                } else if (quantidadeTimes === 20 && partida.round_num === 3 && !isDoubleElimination) {
                    // 20 times Single Elimination: Round 3 são as Oitavas (8 partidas)
                    // Card 1 e 2 → Quartas Card 1
                    // Card 3 e 4 → Quartas Card 2
                    // Card 5 e 6 → Quartas Card 3
                    // Card 7 e 8 → Quartas Card 4
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 4; // Quartas
                    let proximoMatchIndex;
                    if (matchIndex === 1 || matchIndex === 2) {
                        proximoMatchIndex = 1; // Matches 1 e 2 → Quartas Card 1
                    } else if (matchIndex === 3 || matchIndex === 4) {
                        proximoMatchIndex = 2; // Matches 3 e 4 → Quartas Card 2
                    } else if (matchIndex === 5 || matchIndex === 6) {
                        proximoMatchIndex = 3; // Matches 5 e 6 → Quartas Card 3
                    } else {
                        proximoMatchIndex = 4; // Matches 7 e 8 → Quartas Card 4
                    }
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 16 && partida.round_num === 2) {
                    // Round 2 são as Oitavas (4 partidas)
                    // Vencedores das Oitavas vão para Quartas (Round 3)
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 3; // Quartas - Round 3
                    
                    // Match 1 → Quartas Match 1
                    // Match 2 → Quartas Match 1 (junto com Match 1)
                    // Match 3 → Quartas Match 2
                    // Match 4 → Quartas Match 2 (junto com Match 3)
                    let proximoMatchIndex;
                    if (matchIndex === 1) {
                        proximoMatchIndex = 1; // Match 1 → Quartas Match 1
                    } else if (matchIndex === 2) {
                        proximoMatchIndex = 1; // Match 2 → Quartas Match 1 (junto com Match 1)
                    } else if (matchIndex === 3) {
                        proximoMatchIndex = 2; // Match 3 → Quartas Match 2
                    } else {
                        proximoMatchIndex = 2; // Match 4 → Quartas Match 2 (junto com Match 3)
                    }
                    
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 16 && partida.round_num === 3) {
                    // Round 3 são as Quartas (2 partidas)
                    // Vencedores das Quartas vão para Semifinais (Round 4)
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 4; // Semifinais - Round 4
                    proximoMatchIndex = 1; // Semifinais tem apenas 1 partida
                    
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 18 && partida.round_num === 1) {
                    // Para 18 times: Round 1 tem 4 partidas (play-in)
                    // Vencedores vão para os primeiros quatro cards das Pré-Oitavas (Round 2)
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 2;
                    const mapping = {
                        1: 1, // Card 1 → Pré-Oitavas Card 1
                        2: 2, // Card 2 → Pré-Oitavas Card 2
                        3: 3, // Card 3 → Pré-Oitavas Card 3
                        4: 4  // Card 4 → Pré-Oitavas Card 4
                    };
                    const proximoMatchIndex = mapping[matchIndex] || 1;
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 18 && partida.round_num === 2) {
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    if (matchIndex === 7) {
                        // Card 7 vai direto para Quartas (Round 4), segundo card
                        proximoRound = 4;
                        proximoMatchId = `upper_${proximoRound}_2`;
                    } else {
                        // Demais cards alimentam apenas 3 cards nas Oitavas (Round 3)
                        proximoRound = 3;
                        const mappingRound2To3 = {
                            1: 1, // Cards 1 e 2 → Oitavas Card 1
                            2: 1,
                            3: 2, // Cards 3 e 4 → Oitavas Card 2
                            4: 2,
                            5: 3, // Cards 5 e 6 → Oitavas Card 3
                            6: 3
                        };
                        const proximoMatchIndex = mappingRound2To3[matchIndex] || 1;
                        proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                    }
                } else if (quantidadeTimes === 18 && partida.round_num === 3) {
                    // Para 18 times: Round 3 são as Oitavas (3 partidas)
                    // Card 1 → Quartas Card 1; Card 2 → Quartas Card 1; Card 3 → Quartas Card 2
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 4;
                    if (matchIndex === 1 || matchIndex === 2) {
                        proximoMatchIndex = 1; // Match 1 e 2 → Quartas Card 1
                    } else {
                        proximoMatchIndex = 2; // Match 3 → Quartas Card 2
                    }
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 18 && partida.round_num === 4) {
                    // Para 18 times: Round 4 são as Quartas (1 partida)
                    // Vencedor vai para Round 5 (Semifinais - 1 partida)
                    proximoRound = 5;
                    proximoMatchIndex = 1; // Semifinais tem apenas 1 partida
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                } else if (quantidadeTimes === 20 && partida.round_num === 4 && isDoubleElimination) {
                    // Para 20 times Double Elimination: Round 4 são as Quartas (2 partidas)
                    // Vencedores das Quartas vão para Semifinais (Round 5 - 1 partida)
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    proximoRound = 5; // Semifinais - Round 5
                    proximoMatchIndex = 1; // Semifinais tem apenas 1 partida
                    proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                    console.log('[DEBUG 20T QUARTAS→SEMIFINAIS] Vencedor das Quartas avançando para Semifinais:', {
                        match_id_origem: match_id,
                        matchIndex,
                        proximoRound,
                        proximoMatchId
                    });
                } else {
                    // Se for Semifinais e for Double Elimination, vai para Grand Final
                    // Para 6 times: Semifinais é round 3
                    // Para 10 times: Semifinais é round 4
                    // Para 12 times: Semifinais é round 4
                    // Para 14 times: Semifinais é round 4
                    // Para 16 times: Semifinais é round 4
                    // Para 18 times: Semifinais é round 5
                    // Para 20 times: Semifinais é round 5
                    // Para 8+ times (exceto 6, 10, 12, 14, 16, 18, 20): Semifinais é round 3
                    const isSemifinais = (quantidadeTimes === 6 && partida.round_num === 3) || 
                                         (quantidadeTimes === 10 && partida.round_num === 4) ||
                                         (quantidadeTimes === 12 && partida.round_num === 4) ||
                                         (quantidadeTimes === 14 && partida.round_num === 4) ||
                                         (quantidadeTimes === 16 && partida.round_num === 4) ||
                                         (quantidadeTimes === 18 && partida.round_num === 5) ||
                                         (quantidadeTimes === 20 && partida.round_num === 5) ||
                                         (quantidadeTimes !== 6 && quantidadeTimes !== 10 && quantidadeTimes !== 12 && quantidadeTimes !== 14 && quantidadeTimes !== 16 && quantidadeTimes !== 18 && quantidadeTimes !== 20 && partida.round_num === 3);
                    
                    if (isSemifinais && isDoubleElimination) {
                        proximoMatchId = 'grand_final_1';
                    } else {
                        // Caso contrário, avança para próximo round normalmente
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        
                        // Para 6 times com BYEs: Round 1 tem 2 partidas, Round 2 também tem 2 partidas
                        // Match 1 do Round 1 → Match 1 do Round 2 (time2, pois time1 já é o Time 1 com BYE)
                        // Match 2 do Round 1 → Match 2 do Round 2 (time2, pois time1 já é o Time 2 com BYE)
                        // Para 10 times com BYEs: Round 1 tem 2 partidas, Round 2 tem 4 partidas (Oitavas)
                        // Match 1 do Round 1 → Match 1 do Round 2 (time2, pois time1 já é o Time 1 com BYE)
                        // Match 2 do Round 1 → Match 2 do Round 2 (time2, pois time1 já é o Time 2 com BYE)
                        let proximoMatchIndex;
                        if (quantidadeTimes === 6 && partida.round_num === 1) {
                            // Para 6 times, o matchIndex do Round 2 é igual ao do Round 1
                            proximoMatchIndex = matchIndex;
                        } else if (quantidadeTimes === 10 && partida.round_num === 1) {
                            // Para 10 times, o matchIndex do Round 2 é igual ao do Round 1 (Match 1 → Match 1, Match 2 → Match 2)
                            proximoMatchIndex = matchIndex;
                        } else if (quantidadeTimes === 12 && partida.round_num === 1) {
                            // Para 12 times: Round 1 tem 6 partidas, Round 2 tem 3 partidas
                            // Match 1-2 → Match 1, Match 3-4 → Match 2, Match 5-6 → Match 3
                            proximoMatchIndex = Math.ceil(matchIndex / 2);
                        } else if (quantidadeTimes === 12 && partida.round_num === 2) {
                            // Para 12 times: Round 2 tem 3 partidas, Round 3 tem 1 partida
                            // Match 1-2 → Round 3 Match 1, Match 3 → Round 4 (BYE)
                            if (matchIndex === 1 || matchIndex === 2) {
                                proximoMatchIndex = 1; // Match 1 e 2 → Round 3 Match 1
                            } else {
                                // Match 3 → Round 4 (BYE, será tratado separadamente)
                                proximoMatchId = `upper_4_1`; // Vai direto para Round 4
                                proximoRound = 4; // IMPORTANTE: Ajustar proximoRound para 4
                            }
                        } else if (quantidadeTimes === 14 && partida.round_num === 1) {
                            // Para 14 times: BYEs para as seeds 1 e 2
                            const round1Map = {
                                1: 'upper_2_1', // Vencedor enfrenta seed 1
                                2: 'upper_2_2', // Vencedores dos matchs 2 e 3 se enfrentam
                                3: 'upper_2_2',
                                4: 'upper_2_3',
                                5: 'upper_2_3',
                                6: 'upper_2_4'  // Vencedor enfrenta seed 2
                            };
                            if (round1Map[matchIndex]) {
                                proximoMatchId = round1Map[matchIndex];
                                proximoRound = 2;
                            } else {
                                proximoMatchIndex = Math.ceil(matchIndex / 2);
                            }
                        } else {
                            // Para outras quantidades, usar lógica padrão
                            proximoMatchIndex = Math.ceil(matchIndex / 2);
                        }
                        if (!proximoMatchId) {
                            proximoMatchId = `upper_${proximoRound}_${proximoMatchIndex}`;
                        }
                    }
                }
            } else if (partida.bracket_type === 'lower') {
                // No Lower Bracket
                // Se for a Final do Lower e for Double Elimination, vai para Grand Final
                // Para 6 times: Final do Lower é o round 4 (lower_4_1)
                // Para 10 times: Final do Lower é o round 5 (lower_5_1) - removido Round 5 intermediário
                // Para 12 times: Final do Lower é o round 5 (lower_5_1)
                // Para 14 times: Final do Lower é o round 6 (lower_6_1)
                // Para 16 times: Final do Lower é o round 6 (lower_6_1)
                // Para 18 times: Final do Lower é o round 6 (lower_6_1)
                // Para 8+ times (exceto 6, 10, 12, 14, 16 e 18): Final do Lower é o round 4 (lower_4_1)
                // IMPORTANTE: Definir quantidadeTimesLower no escopo correto para uso posterior
                const quantidadeTimesLower = chaveamento.quantidade_times;
                const isLowerFinal = (quantidadeTimesLower === 6 && partida.round_num === 4) ||
                                     (quantidadeTimesLower === 10 && partida.round_num === 5) ||
                                     (quantidadeTimesLower === 12 && partida.round_num === 5) ||
                                     (quantidadeTimesLower === 14 && partida.round_num === 6) ||
                                     (quantidadeTimesLower === 16 && partida.round_num === 6) ||
                                     (quantidadeTimesLower === 18 && partida.round_num === 6) ||
                                     (quantidadeTimesLower === 20 && partida.round_num === 7) ||
                                     (quantidadeTimesLower !== 6 && quantidadeTimesLower !== 10 && quantidadeTimesLower !== 12 && quantidadeTimesLower !== 14 && quantidadeTimesLower !== 16 && quantidadeTimesLower !== 18 && quantidadeTimesLower !== 20 && partida.round_num === 4);
                if (isLowerFinal && isDoubleElimination) {
                    proximoMatchId = 'grand_final_1';
                } else {
                    // Caso contrário, avança para próximo round normalmente
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    // Para 10 times: Lower Round 4 → Lower Round 5 (Final)
                    if (quantidadeTimesLower === 10 && partida.round_num === 4) {
                        proximoMatchId = `lower_5_1`; // Vencedores do Round 4 vão direto para a Final (Round 5)
                    } else if (quantidadeTimesLower === 14 && partida.round_num === 2) {
                        // Para 14 times: Lower Round 2, Match 2 → Lower Round 3, Match 2
                        if (matchIndex === 2) {
                            proximoMatchId = `lower_3_2`; // Segundo card vai para segundo card
                        } else {
                            // Outros cards seguem lógica padrão
                            const proximoMatchIndex = Math.ceil(matchIndex / 2);
                            proximoMatchId = `lower_${proximoRound}_${proximoMatchIndex}`;
                        }
                    } else if (quantidadeTimesLower === 14 && partida.round_num === 4) {
                        // Para 14 times: Lower Round 4 → Lower Round 5 (1 partida)
                        proximoMatchId = `lower_5_1`; // Vencedores do Round 4 vão para Round 5
                    } else if (quantidadeTimesLower === 14 && partida.round_num === 5) {
                        // Para 14 times: Lower Round 5 → Lower Round 6 (Final)
                        proximoMatchId = `lower_6_1`; // Vencedor do Round 5 vai para Final (Round 6)
                    } else if (quantidadeTimesLower === 16 && partida.round_num === 3) {
                        // Para 16 times: Lower Round 3
                        // Match 3 (terceiro card) → Lower Round 5 (pula Round 4)
                        // Outros matches → Lower Round 4
                        if (matchIndex === 3) {
                            proximoMatchId = `lower_5_1`; // Vencedor do Match 3 vai direto para Round 5
                        } else {
                            proximoMatchId = `lower_4_1`; // Outros vencedores do Round 3 vão para Round 4
                        }
                    } else if (quantidadeTimesLower === 16 && partida.round_num === 4) {
                        // Para 16 times: Lower Round 4 → Lower Round 5
                        proximoMatchId = `lower_5_1`; // Vencedor do Round 4 vai para Round 5
                    } else if (quantidadeTimesLower === 16 && partida.round_num === 5) {
                        // Para 16 times: Lower Round 5 → Lower Round 6 (Final)
                        proximoMatchId = `lower_6_1`; // Vencedor do Round 5 vai para Final (Round 6)
                    } else if (quantidadeTimesLower === 18 && partida.round_num === 1) {
                        // Para 18 times: Lower Round 1 → Lower Round 2
                        // Primeiro card → primeiro card da R2, primeiro slot (time1)
                        // Segundo card → primeiro card da R2, segundo slot (time2)
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        // Ambos os vencedores vão para o primeiro card do Lower Round 2
                        proximoMatchId = `lower_2_1`; // ambos os cards → primeiro card da R2
                    } else if (quantidadeTimesLower === 18 && partida.round_num === 2) {
                        // Para 18 times: Lower Round 2 → Lower Round 3
                        // Lower Round 2 tem 4 partidas, vencedores vão para Lower Round 3
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        let proximoMatchIndex = Math.ceil(matchIndex / 2);
                        if (proximoMatchIndex > 4) proximoMatchIndex = 4;
                        proximoMatchId = `lower_3_${proximoMatchIndex}`;
                    } else if (quantidadeTimesLower === 18 && partida.round_num === 3) {
                        // Para 18 times: Lower Round 3 → Lower Round 4
                        // Lower Round 3 tem 4 partidas, vencedores vão para Lower Round 4
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        let proximoMatchIndex = Math.ceil(matchIndex / 2);
                        if (proximoMatchIndex > 3) proximoMatchIndex = 3;
                        proximoMatchId = `lower_4_${proximoMatchIndex}`;
                    } else if (quantidadeTimesLower === 18 && partida.round_num === 4) {
                        // Para 18 times: Lower Round 4 → Lower Round 5
                        // Lower Round 4 tem 3 partidas, vencedores vão para Lower Round 5
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        let proximoMatchIndex = Math.ceil(matchIndex / 2);
                        if (proximoMatchIndex > 2) proximoMatchIndex = 2;
                        proximoMatchId = `lower_5_${proximoMatchIndex}`;
                    } else if (quantidadeTimesLower === 18 && partida.round_num === 5) {
                        // Para 18 times: Lower Round 5 → Lower Round 6 (Final)
                        // Lower Round 5 tem 2 partidas, vencedores vão para Lower Round 6 (Final)
                        proximoMatchId = `lower_6_1`; // Vencedores do Round 5 vão para Final (Round 6)
                    } else if (quantidadeTimesLower === 20 && partida.round_num === 1) {
                        const matchIndex20 = parseInt(partida.match_id.split('_')[2]) || 1;
                        proximoRound = 2;
                        proximoMatchId = `lower_${proximoRound}_1`;
                        if (matchIndex20 === 1) {
                            forceDestinoSlot = 'time2';
                        } else if (matchIndex20 === 2) {
                            forceDestinoSlot = 'time1';
                        }
                        console.log('[DEBUG 20T LOWER R1] Vencedor avançando para lower_2_1', {
                            match_id_origem: match_id,
                            matchIndex: matchIndex20,
                            forceDestinoSlot,
                            proximoMatchId
                        });
                    } else if (quantidadeTimesLower === 20 && partida.round_num === 4) {
                        // Para 20 times: Lower Round 4 → Lower Round 5
                        // Card 1 → Lower Round 5, Card 1 (time1_id)
                        // Card 2 → Lower Round 5, Card 1 (time2_id)
                        // Card 3 → Lower Round 5, Card 2 (time1_id)
                        const matchIndex20 = parseInt(partida.match_id.split('_')[2]) || 1;
                        proximoRound = 5;
                        if (matchIndex20 === 1) {
                            proximoMatchId = `lower_${proximoRound}_1`; // Card 1 → Lower Round 5, Card 1
                            forceDestinoSlot = 'time1'; // Card 1 ocupa o primeiro slot
                        } else if (matchIndex20 === 2) {
                            proximoMatchId = `lower_${proximoRound}_1`; // Card 2 → Lower Round 5, Card 1
                            forceDestinoSlot = 'time2'; // Card 2 ocupa o segundo slot
                        } else if (matchIndex20 === 3) {
                            proximoMatchId = `lower_${proximoRound}_2`; // Card 3 → Lower Round 5, Card 2
                            forceDestinoSlot = 'time1'; // Card 3 ocupa o primeiro slot
                        } else {
                            // Fallback para outros cards
                            proximoMatchId = `lower_${proximoRound}_1`;
                        }
                        console.log('[DEBUG 20T LOWER R4] Vencedor avançando para Lower Round 5', {
                            match_id_origem: match_id,
                            matchIndex: matchIndex20,
                            forceDestinoSlot,
                            proximoMatchId
                        });
                    } else if (quantidadeTimesLower === 20 && partida.round_num === 5) {
                        // Para 20 times: Lower Round 5 → Lower Round 6
                        // Ambos os cards (1 e 2) vão para o único card do Lower Round 6
                        const matchIndex20 = parseInt(partida.match_id.split('_')[2]) || 1;
                        proximoRound = 6;
                        proximoMatchId = `lower_${proximoRound}_1`; // Ambos vão para Lower Round 6, Card 1
                        if (matchIndex20 === 1) {
                            forceDestinoSlot = 'time1'; // Card 1 ocupa o primeiro slot
                        } else if (matchIndex20 === 2) {
                            forceDestinoSlot = 'time2'; // Card 2 ocupa o segundo slot
                        }
                        console.log('[DEBUG 20T LOWER R5] Vencedor avançando para Lower Round 6', {
                            match_id_origem: match_id,
                            matchIndex: matchIndex20,
                            forceDestinoSlot,
                            proximoMatchId
                        });
                    } else if (quantidadeTimesLower === 20 && partida.round_num === 6) {
                        // Para 20 times: Lower Round 6 → Final do Lower (Lower Round 7)
                        proximoRound = 7;
                        proximoMatchId = `lower_${proximoRound}_1`; // Vencedor vai para Final do Lower
                        console.log('[DEBUG 20T LOWER R6] Vencedor avançando para Final do Lower', {
                            match_id_origem: match_id,
                            proximoMatchId
                        });
                    } else {
                        const proximoMatchIndex = Math.ceil(matchIndex / 2);
                        proximoMatchId = `lower_${proximoRound}_${proximoMatchIndex}`;
                    }
                }
                
            } else if (partida.bracket_type === 'grand_final') {
                // Se venceu a Grand Final, é campeão
                await conexao.execute(
                    `UPDATE posicoes_times 
                     SET bracket_type = 'campeao', status = 'campeao', round_atual = NULL, match_id_atual = NULL
                     WHERE chaveamento_id = ? AND time_id = ?`,
                    [chaveamento_id, time_vencedor_id]
                );

                // Atualizar chaveamento
                await conexao.execute(
                    `UPDATE chaveamentos 
                     SET campeao_time_id = ?, status = 'finalizado'
                     WHERE id = ?`,
                    [time_vencedor_id, chaveamento_id]
                );

                // Registrar no histórico
                await conexao.execute(
                    `INSERT INTO historico_movimentacoes 
                     (chaveamento_id, time_id, tipo_movimentacao, round_origem, match_id_origem, partida_id)
                     VALUES (?, ?, 'campeao', ?, ?, ?)`,
                    [chaveamento_id, time_vencedor_id, partida.round_num, match_id, partida.id]
                );
            } else if (partida.bracket_type === 'upper' && !isDoubleElimination) {
                // Verificar se é a final do Single Elimination
                // Calcular o último round baseado no número de times
                const quantidadeTimes = chaveamento.quantidade_times;
                let bracketSize = 1;
                while (bracketSize < quantidadeTimes) bracketSize *= 2;
                const totalRounds = Math.log2(bracketSize);
                
                // Se é o último round do upper bracket E não há próximo match (ou próximo match não existe), é a final
                const isFinalRound = partida.round_num === totalRounds;
                const isFinalMatch = !proximoMatchId || (proximoMatchId && !proximoMatchId.startsWith('upper_') && !proximoMatchId.startsWith('grand_final'));
                
                if (isFinalRound && isFinalMatch) {
                    console.log('[DEBUG Single Elimination Final] Detectada final do Single Elimination:', {
                        match_id,
                        round_num: partida.round_num,
                        totalRounds,
                        proximoMatchId,
                        time_vencedor_id
                    });
                    
                    // Atualizar posição do time como campeão
                    await conexao.execute(
                        `UPDATE posicoes_times 
                         SET bracket_type = 'campeao', status = 'campeao', round_atual = NULL, match_id_atual = NULL
                         WHERE chaveamento_id = ? AND time_id = ?`,
                        [chaveamento_id, time_vencedor_id]
                    );

                    // Atualizar chaveamento
                    await conexao.execute(
                        `UPDATE chaveamentos 
                         SET campeao_time_id = ?, status = 'finalizado'
                         WHERE id = ?`,
                        [time_vencedor_id, chaveamento_id]
                    );

                    // Registrar no histórico
                    await conexao.execute(
                        `INSERT INTO historico_movimentacoes 
                         (chaveamento_id, time_id, tipo_movimentacao, round_origem, match_id_origem, partida_id)
                         VALUES (?, ?, 'campeao', ?, ?, ?)`,
                        [chaveamento_id, time_vencedor_id, partida.round_num, match_id, partida.id]
                    );
                    
                    console.log('[DEBUG Single Elimination Final] Campeão registrado no banco de dados');
                    
                    // Não atualizar posição do vencedor (já é campeão)
                    proximoMatchId = null;
                }
            }

            // Atualizar posição do vencedor (se não for campeão)
            if (proximoMatchId) {
                // Determinar bracket_type e round_num para a posição
                let bracketTypePosicao = partida.bracket_type;
                let roundNumPosicao = proximoRound;
                
                // IMPORTANTE: Extrair round_num do match_id para Lower Bracket
                // Exemplo: 'lower_5_1' → round_num = 5
                if (proximoMatchId.startsWith('lower_')) {
                    const matchIdParts = proximoMatchId.split('_');
                    if (matchIdParts.length >= 2 && matchIdParts[0] === 'lower') {
                        roundNumPosicao = parseInt(matchIdParts[1]) || proximoRound;
                    }
                }
                
                if (proximoMatchId.startsWith('grand_final')) {
                    bracketTypePosicao = 'grand_final';
                    roundNumPosicao = 1; // Grand Final sempre é round 1
                }
                
                // Verificar se já existe posição para este time
                const [posicoesExistentes] = await conexao.execute(
                    'SELECT id FROM posicoes_times WHERE chaveamento_id = ? AND time_id = ?',
                    [chaveamento_id, time_vencedor_id]
                );

                if (posicoesExistentes.length > 0) {
                    // Atualizar posição existente
                    await conexao.execute(
                        `UPDATE posicoes_times 
                         SET round_atual = ?, match_id_atual = ?, bracket_type = ?
                         WHERE chaveamento_id = ? AND time_id = ?`,
                        [roundNumPosicao, proximoMatchId, bracketTypePosicao, chaveamento_id, time_vencedor_id]
                    );
                } else {
                    // Criar nova posição (usar INSERT IGNORE para evitar duplicação)
                    await conexao.execute(
                        `INSERT IGNORE INTO posicoes_times 
                         (chaveamento_id, time_id, bracket_type, round_atual, match_id_atual, status)
                         VALUES (?, ?, ?, ?, ?, 'ativo')`,
                        [chaveamento_id, time_vencedor_id, bracketTypePosicao, roundNumPosicao, proximoMatchId]
                    );
                }

                // Registrar no histórico
                let tipoMovimentacao = 'avancou_upper';
                if (proximoMatchId.startsWith('grand_final')) {
                    tipoMovimentacao = 'avancou_grand_final';
                } else if (partida.bracket_type === 'lower') {
                    tipoMovimentacao = 'avancou_lower';
                }
                
                await conexao.execute(
                    `INSERT INTO historico_movimentacoes 
                     (chaveamento_id, time_id, tipo_movimentacao, round_origem, round_destino, match_id_origem, match_id_destino, partida_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [chaveamento_id, time_vencedor_id, tipoMovimentacao,
                     partida.round_num, roundNumPosicao, match_id, proximoMatchId, partida.id]
                );

                // Atualizar partida de destino com o time vencedor
                // Verificar se a partida de destino já existe
                let [partidasDestino] = await conexao.execute(
                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                    [chaveamento_id, proximoMatchId]
                );
                
                // IMPORTANTE: Corrigir round_num de partidas Upper Bracket baseado no match_id
                // Exemplo: 'upper_3_1' e 'upper_3_2' devem ter round_num = 3 (Semifinais para 16 times)
                if (partidasDestino.length > 0 && proximoMatchId.startsWith('upper_')) {
                    const partidaExistente = partidasDestino[0];
                    const matchIdParts = proximoMatchId.split('_');
                    if (matchIdParts.length >= 3 && matchIdParts[0] === 'upper') {
                        const roundNumCorreto = parseInt(matchIdParts[1]);
                        if (roundNumCorreto && partidaExistente.round_num !== roundNumCorreto) {
                            await conexao.execute(
                                'UPDATE partidas SET round_num = ? WHERE id = ?',
                                [roundNumCorreto, partidaExistente.id]
                            );
                            // Buscar novamente para ter os dados atualizados
                            [partidasDestino] = await conexao.execute(
                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                [chaveamento_id, proximoMatchId]
                            );
                        }
                    }
                }
                
                // IMPORTANTE: Se a partida upper_4_1 já existe mas tem round_num incorreto para 12 times, corrigir
                if (partidasDestino.length > 0 && proximoMatchId === 'upper_4_1' && chaveamento.quantidade_times === 12) {
                    const partidaExistente = partidasDestino[0];
                    if (partidaExistente.round_num !== 4) {
                        await conexao.execute(
                            'UPDATE partidas SET round_num = ? WHERE id = ?',
                            [4, partidaExistente.id]
                        );
                        // Buscar novamente para ter os dados atualizados
                        [partidasDestino] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchId]
                        );
                    }
                }
                
                // IMPORTANTE: Corrigir round_num de partidas Lower Bracket baseado no match_id
                // Exemplo: 'lower_5_1' deve ter round_num = 5, não 4
                if (partidasDestino.length > 0 && proximoMatchId.startsWith('lower_')) {
                    const partidaExistente = partidasDestino[0];
                    const matchIdParts = proximoMatchId.split('_');
                    if (matchIdParts.length >= 2 && matchIdParts[0] === 'lower') {
                        const roundNumCorreto = parseInt(matchIdParts[1]);
                        if (roundNumCorreto && partidaExistente.round_num !== roundNumCorreto) {
                            await conexao.execute(
                                'UPDATE partidas SET round_num = ? WHERE id = ?',
                                [roundNumCorreto, partidaExistente.id]
                            );
                            // Buscar novamente para ter os dados atualizados
                            [partidasDestino] = await conexao.execute(
                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                [chaveamento_id, proximoMatchId]
                            );
                        }
                    }
                }

                // Se não existir, criar automaticamente
                if (partidasDestino.length === 0) {
                    // Determinar formato da partida de destino
                    let formatoDestino = 'B01';
                    let bracketTypeDestino = partida.bracket_type;
                    let roundNumDestino = proximoRound;
                    
                    // IMPORTANTE: Extrair round_num do match_id para garantir que está correto
                    // Exemplo: 'upper_3_1' → round_num = 3 (Semifinais)
                    // Exemplo: 'lower_5_1' → round_num = 5
                    // CRÍTICO: Sempre usar o round_num do match_id, não o proximoRound calculado
                    if (proximoMatchId.startsWith('upper_')) {
                        const matchIdParts = proximoMatchId.split('_');
                        if (matchIdParts.length >= 2 && matchIdParts[0] === 'upper') {
                            const roundNumFromMatchId = parseInt(matchIdParts[1]);
                            if (!isNaN(roundNumFromMatchId)) {
                                roundNumDestino = roundNumFromMatchId;
                            }
                        }
                    } else if (proximoMatchId.startsWith('lower_')) {
                        const matchIdParts = proximoMatchId.split('_');
                        if (matchIdParts.length >= 2 && matchIdParts[0] === 'lower') {
                            const roundNumFromMatchId = parseInt(matchIdParts[1]);
                            if (!isNaN(roundNumFromMatchId)) {
                                roundNumDestino = roundNumFromMatchId;
                            }
                        }
                    }
                    
                    // IMPORTANTE: Se proximoMatchId for 'upper_4_1' para 12 times, garantir round_num = 4
                    if (proximoMatchId === 'upper_4_1' && chaveamento.quantidade_times === 12) {
                        roundNumDestino = 4; // Semifinais para 12 times
                    }
                    
                    // IMPORTANTE: Se proximoMatchId for 'grand_final_1', ajustar parâmetros
                    if (proximoMatchId === 'grand_final_1' || proximoMatchId.startsWith('grand_final')) {
                        formatoDestino = 'B03';
                        bracketTypeDestino = 'grand_final';
                        roundNumDestino = 1; // Grand Final sempre é round 1
                    } else if (proximoRound > 1 && chaveamento.formato_chave !== 'single_b01') {
                        formatoDestino = 'B03';
                    }

                    // Criar partida de destino
                    await conexao.execute(
                        `INSERT IGNORE INTO partidas (chaveamento_id, match_id, round_num, bracket_type, formato_partida, status)
                         VALUES (?, ?, ?, ?, ?, 'agendada')`,
                        [chaveamento_id, proximoMatchId, roundNumDestino, bracketTypeDestino, formatoDestino]
                    );

                    // Buscar a partida criada
                    [partidasDestino] = await conexao.execute(
                        'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                        [chaveamento_id, proximoMatchId]
                    );
                    
                    // IMPORTANTE: Verificar se a partida foi criada com round_num correto
                    if (partidasDestino.length > 0) {
                        const partidaCriada = partidasDestino[0];
                        const matchIdParts = proximoMatchId.split('_');
                        if (matchIdParts.length >= 2 && matchIdParts[0] === 'upper') {
                            const roundNumEsperado = parseInt(matchIdParts[1]);
                            if (roundNumEsperado && partidaCriada.round_num !== roundNumEsperado) {
                                await conexao.execute(
                                    'UPDATE partidas SET round_num = ? WHERE id = ?',
                                    [roundNumEsperado, partidaCriada.id]
                                );
                                // Buscar novamente
                                [partidasDestino] = await conexao.execute(
                                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                    [chaveamento_id, proximoMatchId]
                                );
                            }
                        }
                    }
                }

                if (partidasDestino.length > 0) {
                    let partidaDestino = partidasDestino[0];
                    
                    // IMPORTANTE: Garantir que o perdedor NÃO está na partida de destino
                    // Se o perdedor estiver lá, removê-lo primeiro
                    if (partidaDestino.time1_id === time_perdedor_id) {
                        await conexao.execute(
                            'UPDATE partidas SET time1_id = NULL WHERE id = ?',
                            [partidaDestino.id]
                        );
                        partidaDestino.time1_id = null;
                    }
                    if (partidaDestino.time2_id === time_perdedor_id) {
                        await conexao.execute(
                            'UPDATE partidas SET time2_id = NULL WHERE id = ?',
                            [partidaDestino.id]
                        );
                        partidaDestino.time2_id = null;
                    }
                    
                    // Buscar a partida novamente para garantir que temos os dados atualizados
                    const [partidasDestinoAtualizadas] = await conexao.execute(
                        'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                        [chaveamento_id, proximoMatchId]
                    );
                    if (partidasDestinoAtualizadas.length > 0) {
                        partidaDestino = partidasDestinoAtualizadas[0];
                    }
                    
                    // Para 6 e 10 times com BYEs no Round 2: time1 já está ocupado pelo time com BYE
                    // O vencedor do Round 1 deve ir para time2
                    const quantidadeTimes = chaveamento.quantidade_times;
                    const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                    const isRound2WithByes = (
                        ((quantidadeTimes === 6 || quantidadeTimes === 10) && proximoRound === 2 && partida.round_num === 1) ||
                        (quantidadeTimes === 14 && partida.round_num === 1 && proximoRound === 2 &&
                         (proximoMatchId === 'upper_2_1' || proximoMatchId === 'upper_2_4')) ||
                        (quantidadeTimes === 18 && partida.round_num === 1 && proximoRound === 2) ||
                        (quantidadeTimes === 20 && partida.round_num === 1 && proximoRound === 2 && isDoubleElimination) ||
                        (quantidadeTimes === 20 && partida.round_num === 1 && proximoRound === 2 && !isDoubleElimination)
                    );
                    // Para 12 times: vencedor do Round 2, Match 3 vai direto para Round 4 (BYE)
                    const isRound4WithBye = quantidadeTimes === 12 && (proximoMatchId === 'upper_4_1' || (proximoRound === 4 && partida.round_num === 2 && matchIndex === 3));
                    
                    // IMPORTANTE: Verificar se há duplicação na partida de destino
                    // Se time1_id === time2_id (e não são null), há duplicação - limpar
                    if (partidaDestino.time1_id && partidaDestino.time2_id && 
                        partidaDestino.time1_id === partidaDestino.time2_id) {
                        console.warn('Duplicação detectada na partida de destino! Limpando...', {
                            match_id: proximoMatchId,
                            time_duplicado: partidaDestino.time1_id,
                            time1_id: partidaDestino.time1_id,
                            time2_id: partidaDestino.time2_id
                        });
                        // Limpar o time2_id (manter apenas no time1_id)
                        await conexao.execute(
                            'UPDATE partidas SET time2_id = NULL WHERE id = ?',
                            [partidaDestino.id]
                        );
                        partidaDestino.time2_id = null;
                        // Buscar novamente para garantir dados atualizados
                        const [partidasDestinoAtualizadas2] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchId]
                        );
                        if (partidasDestinoAtualizadas2.length > 0) {
                            partidaDestino = partidasDestinoAtualizadas2[0];
                        }
                    }
                    
                    // IMPORTANTE: Verificar se o vencedor já está na partida de destino antes de adicionar
                    // Se já estiver, não fazer nada (evitar duplicação)
                    let vencedorJaEstaNaPartida = partidaDestino.time1_id === time_vencedor_id || 
                                                     partidaDestino.time2_id === time_vencedor_id;
                    
                    // IMPORTANTE: Definir quantidadeTimesLower no escopo correto para uso em logs
                    const quantidadeTimesLower = chaveamento.quantidade_times;
                    
                    // DEBUG: Log para 18 times, Round 1 → Round 2
                    if (quantidadeTimes === 18 && partida.round_num === 1 && partida.bracket_type === 'upper' && proximoRound === 2) {
                        console.log('[DEBUG 18 Times R1→R2] Estado ANTES de processar:', {
                            match_id_origem: partida.match_id,
                            match_id_destino: proximoMatchId,
                            time_vencedor_id,
                            partida_destino_id: partidaDestino.id,
                            time1_id_antes: partidaDestino.time1_id,
                            time2_id_antes: partidaDestino.time2_id,
                            vencedorJaEstaNaPartida,
                            isRound2WithByes
                        });
                    }
                    
                    // IMPORTANTE: Para 18 times, Upper Round 1 → Upper Round 2 (Pré-Oitavas)
                    // Se o vencedor está no time1 (slot errado), movê-lo para time2 ANTES de qualquer outra lógica
                    // CRÍTICO: Preservar o time1 original se existir
                    if (quantidadeTimes === 18 && partida.round_num === 1 && partida.bracket_type === 'upper' && 
                        proximoRound === 2 && vencedorJaEstaNaPartida && partidaDestino.time1_id === time_vencedor_id) {
                        console.log('[DEBUG 18 Times R1→R2] Vencedor está no time1 (errado), movendo para time2:', {
                            match_id_destino: proximoMatchId,
                            time_vencedor_id,
                            time1_id_antes: partidaDestino.time1_id,
                            time2_id_antes: partidaDestino.time2_id
                        });
                        // Vencedor está no time1 (slot errado), movê-lo para time2
                        // MAS se havia um time1 original diferente, ele já foi substituído - não podemos restaurá-lo aqui
                        // Apenas mover o vencedor para time2
                        await conexao.execute(
                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                            [time_vencedor_id, partidaDestino.id]
                        );
                        // Limpar time1 apenas se o vencedor estava lá (não havia outro time)
                        await conexao.execute(
                            'UPDATE partidas SET time1_id = NULL WHERE id = ?',
                            [partidaDestino.id]
                        );
                        // Atualizar partidaDestino para refletir a mudança
                        const [partidasDestinoAtualizadas] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchId]
                        );
                        if (partidasDestinoAtualizadas.length > 0) {
                            partidaDestino = partidasDestinoAtualizadas[0];
                            // Atualizar vencedorJaEstaNaPartida após mover
                            vencedorJaEstaNaPartida = partidaDestino.time1_id === time_vencedor_id || 
                                                       partidaDestino.time2_id === time_vencedor_id;
                            console.log('[DEBUG 18 Times R1→R2] Após mover vencedor:', {
                                match_id_destino: proximoMatchId,
                                time1_id_depois: partidaDestino.time1_id,
                                time2_id_depois: partidaDestino.time2_id
                            });
                        }
                    }
                    
                    // IMPORTANTE: Para 18 times, Lower Round 1 → Lower Round 2
                    // Se o vencedor já está na partida mas no slot errado, movê-lo para o slot correto
                    if (quantidadeTimesLower === 18 && partida.round_num === 1 && vencedorJaEstaNaPartida) {
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        if (matchIndex === 1) {
                            // Primeiro card → Lower Round 2, card 1, time1
                            // Se o vencedor está no time2, movê-lo para time1
                            if (partidaDestino.time2_id === time_vencedor_id && !partidaDestino.time1_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = ?, time2_id = NULL WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                // Atualizar partidaDestino para refletir a mudança
                                const [partidasDestinoAtualizadas] = await conexao.execute(
                                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                    [chaveamento_id, proximoMatchId]
                                );
                                if (partidasDestinoAtualizadas.length > 0) {
                                    partidaDestino = partidasDestinoAtualizadas[0];
                                }
                            }
                        } else if (matchIndex === 2) {
                            // Segundo card → Lower Round 2, card 1, time2
                            // Se o vencedor está no time1, movê-lo para time2
                            if (partidaDestino.time1_id === time_vencedor_id && !partidaDestino.time2_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ?, time1_id = NULL WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                // Atualizar partidaDestino para refletir a mudança
                                const [partidasDestinoAtualizadas] = await conexao.execute(
                                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                    [chaveamento_id, proximoMatchId]
                                );
                                if (partidasDestinoAtualizadas.length > 0) {
                                    partidaDestino = partidasDestinoAtualizadas[0];
                                }
                            }
                        }
                    }
                    
                    if (!vencedorJaEstaNaPartida) {
                        // Determinar qual slot preencher (time1 ou time2) - APENAS com o vencedor
                        // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                        // IMPORTANTE: Para 18 times, Lower Round 1 → Lower Round 2 tem lógica específica
                        // Deve ser verificada ANTES de isRound2WithByes (que é para Upper Bracket)
                        let preferenciaAplicada = false;
                        if (forceDestinoSlot === 'time1' || forceDestinoSlot === 'time2') {
                            console.log('[DEBUG Force Slot] Aplicando preferência de slot para destino:', {
                                match_id_destino: proximoMatchId,
                                forceDestinoSlot,
                                time1_id_atual: partidaDestino.time1_id,
                                time2_id_atual: partidaDestino.time2_id
                            });
                            if (forceDestinoSlot === 'time1' &&
                                !partidaDestino.time1_id && partidaDestino.time2_id !== time_vencedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                preferenciaAplicada = true;
                                console.log('[DEBUG Force Slot] Vencedor inserido no time1 conforme preferência:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id
                                });
                            } else if (forceDestinoSlot === 'time2' &&
                                !partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                preferenciaAplicada = true;
                                console.log('[DEBUG Force Slot] Vencedor inserido no time2 conforme preferência:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id
                                });
                            } else {
                                console.warn('[DEBUG Force Slot] Não foi possível aplicar preferência (slot ocupado):', {
                                    match_id_destino: proximoMatchId,
                                    forceDestinoSlot,
                                    time_vencedor_id
                                });
                            }
                            forceDestinoSlot = null;
                        }
                        
                        if (preferenciaAplicada) {
                            // Já inserimos conforme preferência, nada mais a fazer
                        } else if (quantidadeTimesLower === 18 && partida.round_num === 1 && partida.bracket_type === 'lower') {
                            const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                            if (matchIndex === 1) {
                                // Primeiro card → Lower Round 2, card 1, time1
                                if (!partidaDestino.time1_id && partidaDestino.time2_id !== time_vencedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                }
                            } else {
                                // Segundo card → Lower Round 2, card 1, time2
                                if (!partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                }
                            }
                        } else if (isRound2WithByes) {
                            // Para 6, 10, 14 e 18 times com BYEs no Round 2 (Upper Bracket): time1 já está ocupado (ou será ocupado por seed), vencedor vai para time2
                            // IMPORTANTE: Para 18 times, mesmo que time1 esteja vazio, o vencedor do Round 1 deve ir para time2
                            // porque time1 será preenchido pelo seed correspondente
                            // CRÍTICO: NUNCA substituir ou limpar o time1 que já está lá
                            
                            // DEBUG: Log para isRound2WithByes
                            if (quantidadeTimes === 18 && partida.round_num === 1) {
                                console.log('[DEBUG isRound2WithByes] Entrando no bloco isRound2WithByes:', {
                                    match_id_origem: partida.match_id,
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id,
                                    vencedorJaEstaNaPartida
                                });
                            }
                            
                            // Se o vencedor já está no time1 (foi inserido incorretamente), movê-lo para time2
                            if (partidaDestino.time1_id === time_vencedor_id) {
                                console.log('[DEBUG isRound2WithByes] Vencedor está no time1, movendo para time2:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id_antes: partidaDestino.time1_id,
                                    time2_id_antes: partidaDestino.time2_id
                                });
                                // Vencedor está no time1 (slot errado), movê-lo para time2
                                // IMPORTANTE: Se havia um time1 original diferente, ele já foi substituído
                                // Não podemos restaurá-lo aqui, apenas mover o vencedor para time2
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ?, time1_id = NULL WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                // Atualizar partidaDestino para refletir a mudança
                                const [partidasDestinoAtualizadas] = await conexao.execute(
                                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                    [chaveamento_id, proximoMatchId]
                                );
                                if (partidasDestinoAtualizadas.length > 0) {
                                    partidaDestino = partidasDestinoAtualizadas[0];
                                    console.log('[DEBUG isRound2WithByes] Após mover vencedor:', {
                                        match_id_destino: proximoMatchId,
                                        time1_id_depois: partidaDestino.time1_id,
                                        time2_id_depois: partidaDestino.time2_id
                                    });
                                }
                            } 
                            // Se o vencedor não está na partida ainda, inserir APENAS no time2
                            // CRÍTICO: NUNCA tocar no time1, mesmo que esteja vazio
                            else if (!vencedorJaEstaNaPartida && !partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                console.log('[DEBUG isRound2WithByes] Inserindo vencedor no time2:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id
                                });
                                // Vencedor vai para time2 (mesmo que time1 esteja vazio)
                                // IMPORTANTE: NÃO tocar no time1, apenas inserir no time2
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                                console.log('[DEBUG isRound2WithByes] Vencedor inserido no time2:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id
                                });
                            } else {
                                console.log('[DEBUG isRound2WithByes] Condição não atendida para inserir:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    vencedorJaEstaNaPartida,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id,
                                    time2_vazio: !partidaDestino.time2_id,
                                    time1_diferente: partidaDestino.time1_id !== time_vencedor_id
                                });
                            }
                        } else if (isRound4WithBye) {
                            if (!partidaDestino.time1_id && partidaDestino.time2_id !== time_vencedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                            } else if (!partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                    [time_vencedor_id, partidaDestino.id]
                                );
                            }
                        } else {
                            // Para outras situações, usar lógica padrão (incluindo Grand Final)
                            // Lógica padrão para outras situações
                            // IMPORTANTE: Se isRound2WithByes for verdadeiro, NUNCA inserir no time1
                            // (mesmo que esteja vazio), porque time1 será preenchido pelo seed
                            
                            // DEBUG: Log para lógica padrão
                            if (quantidadeTimes === 18 && partida.round_num === 1) {
                                console.log('[DEBUG Lógica Padrão] Entrando no else (lógica padrão):', {
                                    match_id_origem: partida.match_id,
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    isRound2WithByes,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id,
                                    vencedorJaEstaNaPartida
                                });
                            }
                            
                        let preferenciaAplicada = false;
                        if (forceDestinoSlot === 'time1' || forceDestinoSlot === 'time2') {
                            console.log('[DEBUG Force Slot] Preferência aplicada para destino:', {
                                match_id_destino: proximoMatchId,
                                forceDestinoSlot,
                                time1_id_atual: partidaDestino.time1_id,
                                time2_id_atual: partidaDestino.time2_id
                            });
                            if (forceDestinoSlot === 'time1') {
                                if (!partidaDestino.time1_id && partidaDestino.time2_id !== time_vencedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                    preferenciaAplicada = true;
                                    console.log('[DEBUG Force Slot] Vencedor inserido no time1 conforme preferência:', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id
                                    });
                                } else {
                                    console.warn('[DEBUG Force Slot] Não foi possível inserir no time1 (ocupado):', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id
                                    });
                                }
                            } else if (forceDestinoSlot === 'time2') {
                                if (!partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                    preferenciaAplicada = true;
                                    console.log('[DEBUG Force Slot] Vencedor inserido no time2 conforme preferência:', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id
                                    });
                                } else {
                                    console.warn('[DEBUG Force Slot] Não foi possível inserir no time2 (ocupado):', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id
                                    });
                                }
                            }
                            forceDestinoSlot = null;
                        }
                        
                        if (preferenciaAplicada) {
                            // Já inserimos conforme preferência
                        } else if (isRound2WithByes) {
                                console.log('[DEBUG Lógica Padrão] isRound2WithByes é verdadeiro, inserindo APENAS no time2:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id
                                });
                                // Se isRound2WithByes é verdadeiro mas chegou aqui, significa que o vencedor não está na partida
                                // e time2 está vazio - inserir APENAS no time2
                                if (!partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                    console.log('[DEBUG Lógica Padrão] Vencedor inserido no time2 (via lógica padrão):', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id
                                    });
                                } else {
                                    console.log('[DEBUG Lógica Padrão] Não foi possível inserir no time2:', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id,
                                        time2_vazio: !partidaDestino.time2_id,
                                        time1_diferente: partidaDestino.time1_id !== time_vencedor_id
                                    });
                                }
                            } else {
                                // Lógica padrão: preencher time1 primeiro, depois time2
                                if (!partidaDestino.time1_id && partidaDestino.time2_id !== time_vencedor_id) {
                                    console.log('[DEBUG Lógica Padrão] Inserindo vencedor no time1 (lógica padrão):', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id: partidaDestino.time1_id,
                                        time2_id: partidaDestino.time2_id
                                    });
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                } else if (!partidaDestino.time2_id && partidaDestino.time1_id !== time_vencedor_id) {
                                    console.log('[DEBUG Lógica Padrão] Inserindo vencedor no time2 (lógica padrão):', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id: partidaDestino.time1_id,
                                        time2_id: partidaDestino.time2_id
                                    });
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                } else {
                                    console.warn('[DEBUG Lógica Padrão] Slots ocupados ao inserir vencedor:', {
                                        match_id: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id: partidaDestino.time1_id,
                                        time2_id: partidaDestino.time2_id
                                    });
                                }
                            }
                        }
                        
                        // IMPORTANTE: Buscar a partida novamente após o UPDATE para ter os dados atualizados
                        const [partidasDestinoAtualizadas] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchId]
                        );
                        if (partidasDestinoAtualizadas.length > 0) {
                            partidaDestino = partidasDestinoAtualizadas[0];
                        }
                        
                        // Verificar se o vencedor foi realmente inserido na Grand Final
                        if (proximoMatchId === 'grand_final_1') {
                            const [partidaGrandFinalVerificada] = await conexao.execute(
                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                [chaveamento_id, 'grand_final_1']
                            );
                            if (partidaGrandFinalVerificada.length > 0) {
                                const partidaGF = partidaGrandFinalVerificada[0];
                                console.log('🔍 Verificação final da Grand Final:', {
                                    match_id: 'grand_final_1',
                                    time1_id: partidaGF.time1_id,
                                    time2_id: partidaGF.time2_id,
                                    time_vencedor_id,
                                    inserido: partidaGF.time1_id === time_vencedor_id || partidaGF.time2_id === time_vencedor_id
                                });
                            }
                        }
                        
                        // Verificar se o vencedor foi realmente adicionado (usando dados atualizados)
                        const [partidaDestinoFinal] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, proximoMatchId]
                        );
                        if (partidaDestinoFinal.length > 0) {
                            const partidaFinal = partidaDestinoFinal[0];
                            if (partidaFinal.time1_id === time_vencedor_id || partidaFinal.time2_id === time_vencedor_id) {
                                console.log('✅ Vencedor confirmado na partida de destino:', {
                                    match_id: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id: partidaFinal.time1_id,
                                    time2_id: partidaFinal.time2_id
                                });
                            } else {
                                // Se o vencedor não foi adicionado, verificar se um dos slots tem o perdedor e substituir
                                if (partidaFinal.time1_id === time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaFinal.id]
                                    );
                                    console.log('✅ Vencedor substituiu perdedor no time1 da partida de destino:', {
                                        match_id: proximoMatchId,
                                        time_vencedor_id,
                                        time_perdedor_id,
                                        partida_id: partidaFinal.id
                                    });
                                } else if (partidaFinal.time2_id === time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_vencedor_id, partidaFinal.id]
                                    );
                                    console.log('✅ Vencedor substituiu perdedor no time2 da partida de destino:', {
                                        match_id: proximoMatchId,
                                        time_vencedor_id,
                                        time_perdedor_id,
                                        partida_id: partidaFinal.id
                                    });
                                } else if (partidaFinal.time1_id && partidaFinal.time2_id) {
                                    console.warn('⚠️ Ambos os slots estão ocupados e nenhum é o perdedor. Não foi possível adicionar o vencedor:', {
                                        match_id: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id: partidaFinal.time1_id,
                                        time2_id: partidaFinal.time2_id,
                                        time_perdedor_id
                                    });
                                }
                            }
                        }
                    } else {
                        // Vencedor já está na partida, mas verificar se está no slot correto
                        // Para 18 times, Round 1 → Round 2: vencedor deve estar no time2, não no time1
                        if (quantidadeTimes === 18 && partida.round_num === 1 && partida.bracket_type === 'upper' && 
                            proximoRound === 2 && isRound2WithByes) {
                            if (partidaDestino.time1_id === time_vencedor_id) {
                                // Vencedor está no time1 (errado) - mover para time2
                                // Se time2 está vazio, apenas mover
                                // Se time2 já tem um time, não fazer nada (já está correto)
                                if (!partidaDestino.time2_id) {
                                    console.log('[DEBUG 18 Times R1→R2] Vencedor está no time1 (errado), movendo para time2:', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id_antes: partidaDestino.time1_id,
                                        time2_id_antes: partidaDestino.time2_id
                                    });
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ?, time1_id = NULL WHERE id = ?',
                                        [time_vencedor_id, partidaDestino.id]
                                    );
                                    // Atualizar partidaDestino
                                    const [partidasDestinoAtualizadas] = await conexao.execute(
                                        'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                        [chaveamento_id, proximoMatchId]
                                    );
                                    if (partidasDestinoAtualizadas.length > 0) {
                                        partidaDestino = partidasDestinoAtualizadas[0];
                                        console.log('[DEBUG 18 Times R1→R2] Após mover vencedor do time1 para time2:', {
                                            match_id_destino: proximoMatchId,
                                            time1_id_depois: partidaDestino.time1_id,
                                            time2_id_depois: partidaDestino.time2_id
                                        });
                                    }
                                } else {
                                    console.log('[DEBUG 18 Times R1→R2] Vencedor está no time1 mas time2 já está ocupado:', {
                                        match_id_destino: proximoMatchId,
                                        time_vencedor_id,
                                        time1_id: partidaDestino.time1_id,
                                        time2_id: partidaDestino.time2_id
                                    });
                                }
                            } else {
                                console.log('[DEBUG 18 Times R1→R2] Vencedor já está na partida no slot correto:', {
                                    match_id_destino: proximoMatchId,
                                    time_vencedor_id,
                                    time1_id: partidaDestino.time1_id,
                                    time2_id: partidaDestino.time2_id
                                });
                            }
                        } else {
                            console.log('Vencedor já está na partida de destino, evitando duplicação:', {
                                match_id: proximoMatchId,
                                time_vencedor_id,
                                time1_id: partidaDestino.time1_id,
                                time2_id: partidaDestino.time2_id
                            });
                        }
                    }
                }
            } else {
                console.warn('proximoMatchId é null! Não foi possível calcular a progressão do vencedor:', {
                    match_id_origem: match_id,
                    bracket_type: partida.bracket_type,
                    round_num: partida.round_num,
                    time_vencedor_id
                });
            }

            // 2. TIME PERDEDOR
            if (partida.bracket_type === 'upper' && isDoubleElimination) {
                // Perdeu no Upper → vai para Lower Bracket
                console.log('[DEBUG PERDEDOR] Processando perdedor do Upper Bracket:', {
                    match_id: partida.match_id,
                    round_num: partida.round_num,
                    bracket_type: partida.bracket_type,
                    time_perdedor_id,
                    quantidadeTimes: chaveamento.quantidade_times
                });
                // Calcular qual partida do Lower Bracket baseado no round do Upper
                let lowerRound;
                let lowerMatchIndex;
                let lowerMatchId;
                
                // Extrair o índice da partida atual (ex: upper_1_1 -> matchIndex = 1)
                const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                
                // Se perdeu nas Oitavas (Round 1) → vai para Lower Round 1 ou Round 2
                if (partida.round_num === 1) {
                    // Para 6 times: Round 1 tem 2 partidas, perdedores vão para Lower Round 1
                    // Para 10 times: Round 1 tem 2 partidas, perdedores vão para Lower Round 1 (1 partida)
                    // Para 12 times: Round 1 tem 6 partidas, perdedores vão para Lower Round 1 (3 partidas, metade dos perdedores)
                    // Para 16 times: Round 1 tem 8 partidas, perdedores vão para Lower Round 1
                    const quantidadeTimes = chaveamento.quantidade_times;
                    
                    if (quantidadeTimes === 6 || quantidadeTimes === 10) {
                        // Para 6 e 10 times, Lower Round 1 tem apenas 1 partida
                        lowerRound = 1;
                        lowerMatchIndex = 1;
                    } else if (quantidadeTimes === 12) {
                        // Para 12 times: 6 perdedores, metade (3) vão para Lower Round 1
                        lowerRound = 1;
                        // Match 1-2 → Lower Match 1, Match 3-4 → Lower Match 2, Match 5-6 → Lower Match 3
                        lowerMatchIndex = Math.ceil(matchIndex / 2);
                    } else if (quantidadeTimes === 16) {
                        // Para 16 times: perdedores das Oitavas vão todos para Lower Round 1
                        // Match 1-2 → Lower Round 1, Match 1
                        // Match 3-4 → Lower Round 1, Match 2
                        // Match 5-6 → Lower Round 1, Match 3
                        // Match 7-8 → Lower Round 1, Match 4
                        lowerRound = 1;
                        // Distribuir os 8 perdedores entre os 4 cards do Lower Round 1
                        if (matchIndex === 1 || matchIndex === 2) {
                            lowerMatchIndex = 1; // Match 1-2 → Lower Round 1, Match 1
                        } else if (matchIndex === 3 || matchIndex === 4) {
                            lowerMatchIndex = 2; // Match 3-4 → Lower Round 1, Match 2
                        } else if (matchIndex === 5 || matchIndex === 6) {
                            lowerMatchIndex = 3; // Match 5-6 → Lower Round 1, Match 3
                        } else if (matchIndex === 7 || matchIndex === 8) {
                            lowerMatchIndex = 4; // Match 7-8 → Lower Round 1, Match 4
                        } else {
                            // Fallback: distribuir baseado em matchIndex
                            lowerMatchIndex = Math.ceil(matchIndex / 2);
                        }
                    } else {
                        // Para 8+ times (exceto 12 e 16), distribuir baseado no matchIndex
                        lowerRound = 1;
                        // Match 1 e 2 do Upper vão para Lower Match 1
                        // Match 3 e 4 do Upper vão para Lower Match 2
                        lowerMatchIndex = Math.ceil(matchIndex / 2);
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                } 
                // Se perdeu nas Oitavas/Quartas (Round 2) → vai para Lower Round 2
                else if (partida.round_num === 2) {
                    const quantidadeTimes = chaveamento.quantidade_times;
                    if (quantidadeTimes === 6) {
                        // Para 6 times: distribuir perdedores das Quartas
                        // Match 1 das Quartas → Lower Round 2
                        // Match 2 das Quartas → Lower Round 3
                        if (matchIndex === 1) {
                            lowerRound = 2;
                            lowerMatchIndex = 1;
                        } else if (matchIndex === 2) {
                            lowerRound = 3;
                            lowerMatchIndex = 1;
                        } else {
                            // Fallback
                            lowerRound = 2;
                            lowerMatchIndex = 1;
                        }
                    } else if (quantidadeTimes === 10) {
                        // Para 10 times: Round 2 são as Oitavas (4 partidas)
                        // Match 1 → Lower Round 2, Match 1
                        // Match 2 → Lower Round 3, Match 2
                        // Match 3 e 4 → Lower Round 2, Match 2
                        if (matchIndex === 1) {
                            lowerRound = 2;
                            lowerMatchIndex = 1;
                        } else if (matchIndex === 2) {
                            lowerRound = 3;
                            lowerMatchIndex = 2;
                        } else {
                            // Match 3 e 4 → Lower Round 2, Match 2
                            lowerRound = 2;
                            lowerMatchIndex = 2;
                        }
                    } else if (quantidadeTimes === 12) {
                        // Para 12 times: Round 2 tem 3 partidas, perdedores vão para Lower Round 2
                        // Match 1 → Lower Round 2, Match 2 (segundo card)
                        // Match 2 → Lower Round 2, Match 3 (terceiro card)
                        // Match 3 → Lower Round 2, Match 3 (terceiro card)
                        if (matchIndex === 1) {
                            lowerRound = 2;
                            lowerMatchIndex = 2; // Match 1 → Lower Round 2, Match 2
                        } else {
                            // Match 2 e 3 → Lower Round 2, Match 3
                            lowerRound = 2;
                            lowerMatchIndex = 3;
                        }
                    } else if (quantidadeTimes === 14) {
                        // Para 14 times (Oitavas com 4 partidas)
                        // Match 1 → Lower Round 2, Match 2 (segundo card)
                        // Match 2 → Lower Round 2, Match 3 (terceiro card)
                        // Match 3 → Lower Round 2, Match 3 (terceiro card)
                        // Match 4 → Lower Round 3 (primeiro card)
                        if (matchIndex === 1) {
                            lowerRound = 2;
                            lowerMatchIndex = 2;
                        } else if (matchIndex === 2 || matchIndex === 3) {
                            // Match 2 e Match 3 → Lower Round 2, Match 3 (terceiro card)
                            lowerRound = 2;
                            lowerMatchIndex = 3;
                        } else if (matchIndex === 4) {
                            // Match 4 → Lower Round 3 (primeiro card)
                            lowerRound = 3;
                            lowerMatchIndex = 1;
                        } else {
                            // Fallback
                            lowerRound = 2;
                            lowerMatchIndex = 2;
                        }
                    } else if (quantidadeTimes === 16) {
                        // Para 16 times: Round 2 são as Oitavas (4 partidas)
                        // Perdedores das Oitavas vão para Lower Round 2 (não Round 3!)
                        // Match 1-2 → Lower Round 2, Match 3 (terceiro card)
                        // Match 3-4 → Lower Round 2, Match 4 (quarto card)
                        // Lower Round 2 tem 4 cards:
                        // Cards 1-2: vencedores do Lower Round 1
                        // Cards 3-4: perdedores das Oitavas
                        lowerRound = 2;
                        if (matchIndex <= 2) {
                            lowerMatchIndex = 3; // Match 1-2 → Lower Round 2, Match 3
                        } else {
                            lowerMatchIndex = 4; // Match 3-4 → Lower Round 2, Match 4
                        }
                        lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    } else if (quantidadeTimes === 18) {
                        // Para 18 times: Round 2 são as Pré-Oitavas (7 partidas)
                        // Perdedores das Pré-Oitavas vão para Lower Round 2 ou 3
                        // Lower Round 2 tem 4 partidas
                        // Match 1 → Lower Round 2, Match 2 (segundo card)
                        // Match 2 → Lower Round 2, Match 2 (segundo card)
                        // Match 3 → Lower Round 2, Match 3 (terceiro card)
                        // Match 4 → Lower Round 2, Match 3 (terceiro card)
                        // Match 5 → Lower Round 2, Match 4 (quarto card)
                        // Match 6 → Lower Round 2, Match 4 (quarto card)
                        // Match 7 → Lower Round 3, Match 4 (quarto card)
                        // Outros matches seguem a lógica padrão
                        if (matchIndex === 1 || matchIndex === 2) {
                            lowerRound = 2;
                            lowerMatchIndex = 2; // Match 1 e 2 → Lower Round 2, Match 2
                        } else if (matchIndex === 3 || matchIndex === 4) {
                            lowerRound = 2;
                            lowerMatchIndex = 3; // Match 3 e 4 → Lower Round 2, Match 3
                        } else if (matchIndex === 5 || matchIndex === 6) {
                            lowerRound = 2;
                            lowerMatchIndex = 4; // Match 5 e 6 → Lower Round 2, Match 4
                        } else if (matchIndex === 7) {
                            lowerRound = 3;
                            lowerMatchIndex = 4; // Match 7 → Lower Round 3, Match 4
                            console.log(`[DEBUG 18 Times R2→LR3] Match ${matchIndex} calculado para Lower Round 3, Match 4:`, {
                                matchIndex,
                                lowerRound,
                                lowerMatchIndex,
                                lowerMatchId: `lower_${lowerRound}_${lowerMatchIndex}`
                            });
                        } else {
                            // Para outros matches, usar a lógica padrão (será ajustada na inserção)
                            lowerRound = 2;
                            lowerMatchIndex = 2; // Por enquanto, todos vão para Match 2
                        }
                        lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    } else if (quantidadeTimes === 20) {
                        // Para 20 times: Pré-Oitavas com 8 cards
                        // Perdedores dos cards 1 e 2 → Lower Round 2, Match 2 (segundo card)
                        // Perdedores dos cards 3 e 4 → Lower Round 2, Match 3
                        // Perdedores dos cards 5 e 6 → Lower Round 2, Match 4
                        // Perdedores dos cards 7 e 8 → Lower Round 2, Match 5
                        if (matchIndex === 1 || matchIndex === 2) {
                            lowerRound = 2;
                            lowerMatchIndex = 2; // Primeiro e segundo card → Lower Round 2, Match 2
                        } else if (matchIndex === 3 || matchIndex === 4) {
                            lowerRound = 2;
                            lowerMatchIndex = 3; // Terceiro card do Lower Round 2
                        } else if (matchIndex === 5 || matchIndex === 6) {
                            lowerRound = 2;
                            lowerMatchIndex = 4; // Quarto card do Lower Round 2
                        } else if (matchIndex === 7 || matchIndex === 8) {
                            lowerRound = 2;
                            lowerMatchIndex = 5; // Quinto card do Lower Round 2
                        } else {
                            // Outros cards seguem lógica padrão (sem ajuste especial)
                            lowerRound = 2;
                            lowerMatchIndex = Math.ceil(matchIndex / 2);
                        }
                    } else {
                        // Para 8+ times: perdedores das Quartas vão para Lower Round 2, segundo card
                        lowerRound = 2;
                        lowerMatchIndex = 2;
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                }
                // Se perdeu nas Quartas (Round 3) → vai para Lower Round 3 ou 4
                else if (partida.round_num === 3) {
                    console.log('[DEBUG QUARTAS] Entrando no bloco Round 3 (Quartas):', {
                        match_id: partida.match_id,
                        round_num: partida.round_num,
                        matchIndex,
                        quantidadeTimes: chaveamento.quantidade_times,
                        time_perdedor_id
                    });
                    const quantidadeTimes = chaveamento.quantidade_times;
                    if (quantidadeTimes === 10) {
                        // Para 10 times: Round 3 são as Quartas (2 partidas)
                        // Match 1 das Quartas → Lower Round 3, Match 2 (segundo card)
                        // Match 2 das Quartas → Lower Round 4, Match 2 (segundo card)
                        if (matchIndex === 1) {
                            lowerRound = 3;
                            lowerMatchIndex = 2; // Match 1 → Lower Round 3, Match 2
                        } else {
                            lowerRound = 4;
                            lowerMatchIndex = 2; // Match 2 → Lower Round 4, Match 2
                        }
                    } else if (quantidadeTimes === 12) {
                        // Para 12 times: Round 3 tem 1 partida (Quartas), perdedor vai para Lower Round 3, Match 2 (segundo card)
                        lowerRound = 3;
                        lowerMatchIndex = 2;
                    } else if (quantidadeTimes === 14) {
                        // Para 14 times: Round 3 são as Quartas, perdedores vão para Lower Round 4, Match 2 (segundo card)
                        lowerRound = 4;
                        lowerMatchIndex = 2;
                    } else if (quantidadeTimes === 16) {
                        // Para 16 times: Round 3 são as Quartas (2 partidas)
                        // Perdedor do primeiro card (Match 1) → Lower Round 4, Match 3 (terceiro card)
                        // Perdedor do segundo card (Match 2) → Lower Round 3, Match 3 (terceiro card)
                        if (matchIndex === 1) {
                            lowerRound = 4;
                            lowerMatchIndex = 3; // Match 1 → Lower Round 4, Match 3
                            console.log('[DEBUG QUARTAS 16 TIMES] Perdedor Match 1 → Lower Round 4, Match 3:', {
                                match_id_origem: match_id,
                                matchIndex,
                                lowerRound,
                                lowerMatchIndex,
                                time_perdedor_id
                            });
                        } else {
                            lowerRound = 3;
                            lowerMatchIndex = 3; // Match 2 → Lower Round 3, Match 3
                            console.log('[DEBUG QUARTAS 16 TIMES] Perdedor Match 2 → Lower Round 3, Match 3:', {
                                match_id_origem: match_id,
                                matchIndex,
                                lowerRound,
                                lowerMatchIndex,
                                time_perdedor_id
                            });
                        }
                    } else if (quantidadeTimes === 18) {
                        // Para 18 times: Round 3 são as Oitavas (3 partidas)
                        // Perdedores das Oitavas vão para Lower Round 3
                        // Match 1 → Lower Round 3, Match 3 (terceiro card)
                        // Match 2 → Lower Round 3, Match 3 (terceiro card)
                        // Match 3 → Lower Round 3, Match 4 (quarto card)
                        lowerRound = 3;
                        if (matchIndex === 3) {
                            lowerMatchIndex = 4; // Match 3 → Lower Round 3, Match 4
                        } else {
                            lowerMatchIndex = 3; // Match 1 e 2 → Lower Round 3, Match 3
                        }
                    } else if (quantidadeTimes === 20) {
                        // Para 20 times: Round 3 corresponde às Oitavas
                        // Perdedor do primeiro card → Lower Round 3, Match 3
                        // Perdedores dos cards 2 e 3 → Lower Round 3, Match 4
                        // Perdedor do quarto card → Lower Round 4, Match 3
                        if (matchIndex === 1) {
                            lowerRound = 3;
                            lowerMatchIndex = 3;
                        } else if (matchIndex === 2 || matchIndex === 3) {
                            lowerRound = 3;
                            lowerMatchIndex = 4; // Quarto card do Lower Round 3
                        } else if (matchIndex === 4) {
                            lowerRound = 4;
                            lowerMatchIndex = 3; // Terceiro card do Lower Round 4
                        } else {
                            // Demais matches ainda seguirão distribuição padrão (ajustar conforme necessário)
                            lowerRound = 3;
                            lowerMatchIndex = Math.max(1, Math.ceil(matchIndex / 2));
                        }
                    } else {
                        // Para outras quantidades, perdedor das Quartas vai para Lower Round 3
                        lowerRound = 3;
                        lowerMatchIndex = 1;
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    console.log('[DEBUG QUARTAS] lowerMatchId calculado:', {
                        match_id_origem: match_id,
                        round_num: partida.round_num,
                        quantidadeTimes: chaveamento.quantidade_times,
                        lowerMatchId,
                        lowerRound,
                        lowerMatchIndex,
                        time_perdedor_id
                    });
                }
                // Se perdeu nas Semifinais (Round 4) → vai para Lower Round 4 ou Final do Lower Bracket
                // IMPORTANTE: Para 18 times, Round 4 são as Quartas, não as Semifinais!
                else if (partida.round_num === 4) {
                    const quantidadeTimes = chaveamento.quantidade_times;
                    if (quantidadeTimes === 20) {
                        // Para 20 times: Round 4 são as Quartas (2 partidas)
                        // Perdedor do primeiro card → Lower Round 4, Match 3
                        // Perdedor do segundo card → Lower Round 5, Match 2
                        const matchIndex = parseInt(partida.match_id.split('_')[2]) || 1;
                        if (matchIndex === 1) {
                            lowerRound = 4;
                            lowerMatchIndex = 3;
                        } else if (matchIndex === 2) {
                            lowerRound = 5;
                            lowerMatchIndex = 2; // Segundo card do Lower Round 5
                        } else {
                            // Demais matches seguirão ajustes específicos conforme necessidade
                            lowerRound = 4;
                            lowerMatchIndex = Math.max(1, Math.ceil(matchIndex / 2));
                        }
                    } else if (quantidadeTimes === 18) {
                        // Para 18 times: Round 4 são as Quartas (1 partida)
                        // Perdedor das Quartas (Match 1) → Lower Round 4, Match 3 (terceiro card)
                        console.log('[DEBUG QUARTAS 18 TIMES] Entrando no bloco Round 4 (Quartas para 18 times):', {
                            match_id: partida.match_id,
                            round_num: partida.round_num,
                            matchIndex,
                            quantidadeTimes,
                            time_perdedor_id
                        });
                        lowerRound = 4;
                        lowerMatchIndex = 3; // Match 1 → Lower Round 4, Match 3 (terceiro card)
                        console.log('[DEBUG QUARTAS 18 TIMES] Perdedor Match 1 → Lower Round 4, Match 3:', {
                            match_id_origem: match_id,
                            matchIndex,
                            lowerRound,
                            lowerMatchIndex,
                            time_perdedor_id
                        });
                    } else if (quantidadeTimes === 10) {
                        // Para 10 times: perdedor das Semifinais vai para Lower Round 4, Match 2 (segundo card)
                        lowerRound = 4;
                        lowerMatchIndex = 2;
                    } else if (quantidadeTimes === 12) {
                        // Para 12 times: perdedor das Semifinais vai para a Final do Lower Bracket
                        lowerRound = 5; // Final do Lower Bracket para 12 times
                        lowerMatchIndex = 1;
                    } else if (quantidadeTimes === 14) {
                        // Para 14 times: perdedor das Semifinais vai para a Final do Lower Bracket (Round 6)
                        lowerRound = 6; // Final do Lower Bracket para 14 times
                        lowerMatchIndex = 1;
                    } else if (quantidadeTimes === 16) {
                        // Para 16 times: perdedor das Semifinais vai para a Final do Lower Bracket (Lower Round 6)
                        lowerRound = 6; // Final do Lower Bracket para 16 times
                        lowerMatchIndex = 1;
                    } else {
                        // Para outras quantidades: perdedor das Semifinais vai para a Final do Lower Bracket
                        lowerRound = 4; // Final do Lower Bracket para outras quantidades
                        lowerMatchIndex = 1;
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    console.log('[DEBUG QUARTAS] lowerMatchId calculado (Round 4):', {
                        match_id_origem: match_id,
                        round_num: partida.round_num,
                        quantidadeTimes: chaveamento.quantidade_times,
                        lowerMatchId,
                        lowerRound,
                        lowerMatchIndex,
                        time_perdedor_id
                    });
                }
                // Se perdeu nas Semifinais (Round 5) → vai para Lower Round 4 ou Final do Lower Bracket
                else if (partida.round_num === 5) {
                    const quantidadeTimes = chaveamento.quantidade_times;
                    console.log('[DEBUG SEMIFINAIS] Entrando no bloco Round 5:', {
                        match_id_origem: match_id,
                        round_num: partida.round_num,
                        quantidadeTimes,
                        time_perdedor_id
                    });
                    if (quantidadeTimes === 20) {
                        // Para 20 times: Round 5 são as Semifinais
                        // Perdedor das Semifinais → Lower Round 7 (Final do Lower)
                        lowerRound = 7;
                        lowerMatchIndex = 1; // Vai para o único card da Final do Lower
                        console.log('[DEBUG SEMIFINAIS 20 TIMES] Definindo lowerRound para 20 times:', {
                            match_id_origem: match_id,
                            round_num: partida.round_num,
                            quantidadeTimes,
                            lowerRound,
                            lowerMatchIndex,
                            time_perdedor_id
                        });
                    } else if (quantidadeTimes === 18) {
                        // Para 18 times: perdedor das Semifinais vai para Lower Round 5, Match 2 (segundo card)
                        console.log('[DEBUG SEMIFINAIS 18 TIMES] Entrando no bloco Round 5 (Semifinais para 18 times):', {
                            match_id: partida.match_id,
                            round_num: partida.round_num,
                            matchIndex,
                            quantidadeTimes,
                            time_perdedor_id
                        });
                        lowerRound = 5;
                        lowerMatchIndex = 2; // Perdedor das Semifinais → Lower Round 5, Match 2 (segundo card)
                        console.log('[DEBUG SEMIFINAIS 18 TIMES] Perdedor Match ' + matchIndex + ' → Lower Round 5, Match 2:', {
                            match_id_origem: match_id,
                            matchIndex,
                            lowerRound,
                            lowerMatchIndex,
                            time_perdedor_id
                        });
                    } else {
                        // Para outras quantidades: perdedor das Semifinais vai para a Final do Lower Bracket
                        lowerRound = 4;
                        lowerMatchIndex = 1;
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    console.log('[DEBUG SEMIFINAIS] lowerMatchId calculado (Round 5):', {
                        match_id_origem: match_id,
                        round_num: partida.round_num,
                        quantidadeTimes: chaveamento.quantidade_times,
                        lowerMatchId,
                        lowerRound,
                        lowerMatchIndex,
                        time_perdedor_id
                    });
                }
                // Se perdeu na Winners Final (Round 6) → vai para Final do Lower Bracket
                else if (partida.round_num === 6) {
                    const quantidadeTimes = chaveamento.quantidade_times;
                    if (quantidadeTimes === 20) {
                        // Para 20 times: Round 6 é a Winners Final
                        // Perdedor da Winners Final → Lower Round 7 (Final do Lower)
                        lowerRound = 7;
                        lowerMatchIndex = 1; // Vai para o único card da Final do Lower
                    } else {
                        // Para outras quantidades: perdedor da Winners Final vai para a Final do Lower Bracket
                        lowerRound = 4;
                        lowerMatchIndex = 1;
                    }
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                    console.log('[DEBUG WINNERS FINAL] lowerMatchId calculado (Round 6):', {
                        match_id_origem: match_id,
                        round_num: partida.round_num,
                        quantidadeTimes: chaveamento.quantidade_times,
                        lowerMatchId,
                        lowerRound,
                        lowerMatchIndex,
                        time_perdedor_id
                    });
                }
                // Fallback: se não identificar o round, usar Round 1
                else {
                    lowerRound = 1;
                    lowerMatchIndex = Math.ceil(matchIndex / 2);
                    lowerMatchId = `lower_${lowerRound}_${lowerMatchIndex}`;
                }

                // Verificar se já existe posição
                const [posicoesExistentes] = await conexao.execute(
                    'SELECT id FROM posicoes_times WHERE chaveamento_id = ? AND time_id = ?',
                    [chaveamento_id, time_perdedor_id]
                );

                if (posicoesExistentes.length > 0) {
                    await conexao.execute(
                        `UPDATE posicoes_times 
                         SET bracket_type = 'lower', round_atual = ?, match_id_atual = ?, status = 'ativo'
                         WHERE chaveamento_id = ? AND time_id = ?`,
                        [lowerRound, lowerMatchId, chaveamento_id, time_perdedor_id]
                    );
                } else {
                    // Usar INSERT IGNORE para evitar duplicação
                    await conexao.execute(
                        `INSERT IGNORE INTO posicoes_times 
                         (chaveamento_id, time_id, bracket_type, round_atual, match_id_atual, status)
                         VALUES (?, ?, 'lower', ?, ?, 'ativo')`,
                        [chaveamento_id, time_perdedor_id, lowerRound, lowerMatchId]
                    );
                }

                // Registrar no histórico
                await conexao.execute(
                    `INSERT INTO historico_movimentacoes 
                     (chaveamento_id, time_id, tipo_movimentacao, round_origem, round_destino, match_id_origem, match_id_destino, partida_id)
                     VALUES (?, ?, 'caiu_lower', ?, ?, ?, ?, ?)`,
                    [chaveamento_id, time_perdedor_id, partida.round_num, lowerRound, match_id, lowerMatchId, partida.id]
                );

                // Atualizar partida do Lower Bracket
                console.log('[DEBUG QUARTAS] Buscando partida Lower:', {
                    chaveamento_id,
                    lowerMatchId,
                    time_perdedor_id
                });
                let [partidasLower] = await conexao.execute(
                    'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                    [chaveamento_id, lowerMatchId]
                );
                console.log('[DEBUG QUARTAS] Partida Lower encontrada:', {
                    lowerMatchId,
                    encontrada: partidasLower.length > 0,
                    partida: partidasLower.length > 0 ? {
                        id: partidasLower[0].id,
                        time1_id: partidasLower[0].time1_id,
                        time2_id: partidasLower[0].time2_id,
                        round_num: partidasLower[0].round_num
                    } : null
                });
                
                // IMPORTANTE: Corrigir round_num de partidas Lower existentes baseado no match_id
                if (partidasLower.length > 0) {
                    const partidaLowerExistente = partidasLower[0];
                    const matchIdParts = lowerMatchId.split('_');
                    if (matchIdParts.length >= 2 && matchIdParts[0] === 'lower') {
                        const roundNumCorreto = parseInt(matchIdParts[1]);
                        if (roundNumCorreto && partidaLowerExistente.round_num !== roundNumCorreto) {
                            await conexao.execute(
                                'UPDATE partidas SET round_num = ? WHERE id = ?',
                                [roundNumCorreto, partidaLowerExistente.id]
                            );
                            // Buscar novamente para ter os dados atualizados
                            [partidasLower] = await conexao.execute(
                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                [chaveamento_id, lowerMatchId]
                            );
                        }
                    }
                }

                // Se não existir, criar automaticamente
                if (partidasLower.length === 0) {
                    // DEBUG específico para lower_3_4
                    if (lowerMatchId === 'lower_3_4') {
                        console.log('[DEBUG 18 Times R2→LR3] Criando partida lower_3_4:', {
                            lowerMatchId,
                            lowerRound,
                            match_id_origem: match_id,
                            matchIndex: partida.match_id ? parseInt(partida.match_id.split('_')[2]) : null,
                            quantidadeTimes: chaveamento.quantidade_times
                        });
                    }
                    
                    // IMPORTANTE: Extrair round_num do match_id para garantir que está correto
                    // Exemplo: 'lower_5_1' → round_num = 5
                    const matchIdParts = lowerMatchId.split('_');
                    let roundNumFromMatchId = lowerRound; // Usar lowerRound como padrão
                    if (matchIdParts.length >= 2 && matchIdParts[0] === 'lower') {
                        roundNumFromMatchId = parseInt(matchIdParts[1]) || lowerRound;
                    }
                    
                    // DEBUG específico para lower_3_4 - verificar round_num
                    if (lowerMatchId === 'lower_3_4') {
                        console.log('[DEBUG 18 Times R2→LR3] round_num calculado para lower_3_4:', {
                            lowerMatchId,
                            roundNumFromMatchId,
                            lowerRound,
                            matchIdParts
                        });
                    }
                    
                    // Determinar formato da partida: Final do Lower é B03, outros rounds são B01
                    // Para 10 times: Final do Lower é round 5 (removido Round 5 intermediário)
                    // Para 12 times: Final do Lower é round 5
                    // Para 14 times: Final do Lower é round 6
                    // Para 16 times: Final do Lower é round 5
                    // Para outras quantidades: Final do Lower é round 4
                    const quantidadeTimes = chaveamento.quantidade_times;
                    const isLowerFinal = (quantidadeTimes === 10 && roundNumFromMatchId === 5) ||
                                         (quantidadeTimes === 12 && roundNumFromMatchId === 5) ||
                                         (quantidadeTimes === 14 && roundNumFromMatchId === 6) ||
                                         (quantidadeTimes === 16 && roundNumFromMatchId === 6) ||
                                         (quantidadeTimes === 18 && roundNumFromMatchId === 6) ||
                                         (quantidadeTimes !== 10 && quantidadeTimes !== 12 && quantidadeTimes !== 14 && quantidadeTimes !== 16 && quantidadeTimes !== 18 && roundNumFromMatchId === 4);
                    const formatoPartida = isLowerFinal ? 'B03' : 'B01';
                    
                    // DEBUG específico para lower_3_4 - antes de criar
                    if (lowerMatchId === 'lower_3_4') {
                        console.log('[DEBUG 18 Times R2→LR3] Tentando criar partida lower_3_4:', {
                            chaveamento_id,
                            lowerMatchId,
                            roundNumFromMatchId,
                            formatoPartida
                        });
                    }
                    
                    await conexao.execute(
                        `INSERT IGNORE INTO partidas (chaveamento_id, match_id, round_num, bracket_type, formato_partida, status)
                         VALUES (?, ?, ?, 'lower', ?, 'agendada')`,
                        [chaveamento_id, lowerMatchId, roundNumFromMatchId, formatoPartida]
                    );

                    // Buscar a partida criada
                    [partidasLower] = await conexao.execute(
                        'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                        [chaveamento_id, lowerMatchId]
                    );
                    
                    // DEBUG específico para lower_3_4 - após criar
                    if (lowerMatchId === 'lower_3_4') {
                        console.log('[DEBUG 18 Times R2→LR3] Partida lower_3_4 criada/buscada:', {
                            lowerMatchId,
                            encontrada: partidasLower.length > 0,
                            partida_id: partidasLower.length > 0 ? partidasLower[0].id : null,
                            round_num: partidasLower.length > 0 ? partidasLower[0].round_num : null
                        });
                    }
                    
                    // IMPORTANTE: Verificar e corrigir round_num se necessário
                    if (partidasLower.length > 0) {
                        const partidaLower = partidasLower[0];
                        if (partidaLower.round_num !== roundNumFromMatchId) {
                            await conexao.execute(
                                'UPDATE partidas SET round_num = ? WHERE id = ?',
                                [roundNumFromMatchId, partidaLower.id]
                            );
                            // Buscar novamente para ter os dados atualizados
                            [partidasLower] = await conexao.execute(
                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                [chaveamento_id, lowerMatchId]
                            );
                        }
                    }
                    
                    console.log('Partida do Lower Bracket criada/buscada:', {
                        lowerMatchId,
                        encontrada: partidasLower.length > 0,
                        partida_id: partidasLower.length > 0 ? partidasLower[0].id : null,
                        round_num: partidasLower.length > 0 ? partidasLower[0].round_num : null,
                        time1_id: partidasLower.length > 0 ? partidasLower[0].time1_id : null,
                        time2_id: partidasLower.length > 0 ? partidasLower[0].time2_id : null
                    });
                    
                    // DEBUG específico para lower_3_4
                    if (lowerMatchId === 'lower_3_4') {
                        console.log('[DEBUG 18 Times R2→LR3] Partida lower_3_4 criada/buscada:', {
                            lowerMatchId,
                            encontrada: partidasLower.length > 0,
                            partida_id: partidasLower.length > 0 ? partidasLower[0].id : null,
                            round_num: partidasLower.length > 0 ? partidasLower[0].round_num : null,
                            time1_id: partidasLower.length > 0 ? partidasLower[0].time1_id : null,
                            time2_id: partidasLower.length > 0 ? partidasLower[0].time2_id : null
                        });
                    }
                } else {
                    console.log('Partida do Lower Bracket já existe:', {
                        lowerMatchId,
                        partida_id: partidasLower[0].id,
                        time1_id: partidasLower[0].time1_id,
                        time2_id: partidasLower[0].time2_id
                    });
                }

                if (partidasLower.length > 0) {
                    let partidaLower = partidasLower[0];
                    
                    // Buscar a partida novamente para garantir que temos os dados atualizados
                    const [partidasLowerAtualizadas] = await conexao.execute(
                        'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                        [chaveamento_id, lowerMatchId]
                    );
                    if (partidasLowerAtualizadas.length > 0) {
                        partidaLower = partidasLowerAtualizadas[0];
                    }
                    
                    // IMPORTANTE: Verificar se há duplicação na partida do Lower
                    // Se time1_id === time2_id (e não são null), há duplicação - limpar
                    if (partidaLower.time1_id && partidaLower.time2_id && 
                        partidaLower.time1_id === partidaLower.time2_id) {
                        console.warn('Duplicação detectada na partida do Lower! Limpando...', {
                            match_id: lowerMatchId,
                            time_duplicado: partidaLower.time1_id,
                            time1_id: partidaLower.time1_id,
                            time2_id: partidaLower.time2_id
                        });
                        // Limpar o time2_id (manter apenas no time1_id)
                        await conexao.execute(
                            'UPDATE partidas SET time2_id = NULL WHERE id = ?',
                            [partidaLower.id]
                        );
                        partidaLower.time2_id = null;
                        // Buscar novamente para garantir dados atualizados
                        const [partidasLowerAtualizadas2] = await conexao.execute(
                            'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                            [chaveamento_id, lowerMatchId]
                        );
                        if (partidasLowerAtualizadas2.length > 0) {
                            partidaLower = partidasLowerAtualizadas2[0];
                        }
                    }
                    
                    // IMPORTANTE: Verificar se o perdedor já está na partida do Lower antes de adicionar
                    // Se já estiver, não fazer nada (evitar duplicação)
                    const perdedorJaEstaNaPartida = partidaLower.time1_id === time_perdedor_id || 
                                                    partidaLower.time2_id === time_perdedor_id;
                    
                    console.log('Verificando progressão do perdedor:', {
                        match_id_origem: match_id,
                        lowerMatchId,
                        time_perdedor_id,
                        partidaLower_time1_id: partidaLower.time1_id,
                        partidaLower_time2_id: partidaLower.time2_id,
                        perdedorJaEstaNaPartida,
                        round_num: partida.round_num,
                        matchIndex: parseInt(partida.match_id.split('_')[2]) || 1
                    });
                    
                    if (!perdedorJaEstaNaPartida) {
                        // Determinar qual slot preencher baseado no round do Upper
                        // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                        if (partida.round_num === 1) {
                            // Perdedores das Oitavas/Round 1
                            const quantidadeTimes = chaveamento.quantidade_times;
                            if (quantidadeTimes === 6 || quantidadeTimes === 10) {
                                // Para 6 e 10 times: Lower Round 1 tem apenas 1 partida
                                // Match 1 do Upper -> time1, Match 2 do Upper -> time2
                                if (matchIndex === 1 && !partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log(`Perdedor do Round 1 (Match 1) adicionado ao time1 do Lower Round 1 (${quantidadeTimes} times):`, {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                } else if (matchIndex === 2 && !partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log(`Perdedor do Round 1 (Match 2) adicionado ao time2 do Lower Round 1 (${quantidadeTimes} times):`, {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                }
                            } else if (quantidadeTimes === 16) {
                                // Para 16 times: perdedores das Oitavas vão todos para Lower Round 1
                                // Match 1-2 → Lower Round 1, Match 1
                                // Match 3-4 → Lower Round 1, Match 2
                                // Match 5-6 → Lower Round 1, Match 3
                                // Match 7-8 → Lower Round 1, Match 4
                                // Distribuir baseado em match ímpar/par dentro do mesmo card
                                const isMatchImpar = (matchIndex % 2 === 1);
                                if (isMatchImpar && !partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!isMatchImpar && !partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            } else {
                                // Para 8+ times (exceto 16): distribuir baseado em match ímpar/par
                                const isMatchImpar = (matchIndex % 2 === 1);
                                if (isMatchImpar && !partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Perdedor do Round 1 adicionado ao time1 do Lower:', {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                } else if (!isMatchImpar && !partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Perdedor do Round 1 adicionado ao time2 do Lower:', {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                } else if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Perdedor do Round 1 adicionado ao time1 do Lower (fallback):', {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Perdedor do Round 1 adicionado ao time2 do Lower (fallback):', {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id
                                    });
                                }
                            }
                        } else if (partida.round_num === 2) {
                            // Perdedores das Oitavas/Quartas (Round 2)
                            const quantidadeTimes = chaveamento.quantidade_times;
                            console.log('Processando perdedor do Round 2:', {
                                match_id_origem: match_id,
                                matchIndex,
                                quantidadeTimes,
                                lowerRound,
                                lowerMatchId,
                                lowerMatchIndex,
                                time_perdedor_id
                            });
                            
                            // DEBUG: Log específico para 18 times, Match 7
                            if (quantidadeTimes === 18 && matchIndex === 7) {
                                console.log(`[DEBUG 18 Times R2→LR3] Perdedor do Match ${matchIndex} sendo processado:`, {
                                    match_id_origem: match_id,
                                    lowerRound,
                                    lowerMatchIndex,
                                    lowerMatchId,
                                    time_perdedor_id,
                                    partidaLower_existe: partidaLower ? 'sim' : 'não',
                                    partidaLower_id: partidaLower ? partidaLower.id : null,
                                    partidaLower_time1: partidaLower ? partidaLower.time1_id : null,
                                    partidaLower_time2: partidaLower ? partidaLower.time2_id : null
                                });
                            }
                            
                            if (quantidadeTimes === 10) {
                                // Para 10 times: Round 2 são as Oitavas (4 partidas)
                                // Match 1 → Lower Round 2, Match 1
                                // Match 2 → Lower Round 3, Match 2
                                // Match 3 e 4 → Lower Round 2, Match 2
                                // O lowerMatchId já foi calculado corretamente
                                if (lowerRound === 2) {
                                    // Match 1, 3 ou 4 → Lower Round 2
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Oitavas adicionado ao time1 do Lower Round 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Oitavas adicionado ao time2 do Lower Round 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                } else if (lowerRound === 3) {
                                    // Match 2 → Lower Round 3, Match 2
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Oitavas (Match 2) adicionado ao time1 do Lower Round 3 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Oitavas (Match 2) adicionado ao time2 do Lower Round 3 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                }
                            } else if (quantidadeTimes === 6) {
                                // Para 6 times: distribuir perdedores das Quartas
                                // Match 1 das Quartas → Lower Round 2 (time2, pois time1 já tem o vencedor do Lower Round 1)
                                // Match 2 das Quartas → Lower Round 3 (time1 ou time2, dependendo do que estiver disponível)
                                console.log('Verificando lowerRound para 6 times:', {
                                    lowerRound,
                                    matchIndex,
                                    esperado_lowerRound_2: matchIndex === 1,
                                    esperado_lowerRound_3: matchIndex === 2
                                });
                                
                                if (lowerRound === 2) {
                                    // Perdedor do Match 1 das Quartas vai para Lower Round 2
                                    console.log('Tentando adicionar perdedor das Quartas (Match 1) ao Lower Round 2:', {
                                        match_id_origem: match_id,
                                        lowerMatchId,
                                        time_perdedor_id,
                                        partidaLower_id: partidaLower.id,
                                        time1_id_atual: partidaLower.time1_id,
                                        time2_id_atual: partidaLower.time2_id
                                    });
                                    
                                    // Verificar se o perdedor já está na partida
                                    const perdedorJaEstaNaPartida = partidaLower.time1_id === time_perdedor_id || 
                                                                    partidaLower.time2_id === time_perdedor_id;
                                    
                                    if (!perdedorJaEstaNaPartida) {
                                        // Adicionar ao primeiro slot disponível (preferir time2, mas pode ser time1 se time2 estiver ocupado)
                                        if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                            console.log('Perdedor das Quartas (Match 1) adicionado ao time2 do Lower Round 2 (6 times):', {
                                                match_id_origem: match_id,
                                                lowerMatchId,
                                                time_perdedor_id
                                            });
                                            
                                            // Buscar a partida atualizada para garantir que o frontend veja a mudança
                                            const [partidaAtualizada] = await conexao.execute(
                                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                                [chaveamento_id, lowerMatchId]
                                            );
                                            if (partidaAtualizada.length > 0) {
                                                console.log('Partida do Lower Round 2 atualizada:', {
                                                    lowerMatchId,
                                                    time1_id: partidaAtualizada[0].time1_id,
                                                    time2_id: partidaAtualizada[0].time2_id
                                                });
                                            }
                                        } else if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                            console.log('Perdedor das Quartas (Match 1) adicionado ao time1 do Lower Round 2 (6 times):', {
                                                match_id_origem: match_id,
                                                lowerMatchId,
                                                time_perdedor_id
                                            });
                                            
                                            // Buscar a partida atualizada
                                            const [partidaAtualizada] = await conexao.execute(
                                                'SELECT * FROM partidas WHERE chaveamento_id = ? AND match_id = ?',
                                                [chaveamento_id, lowerMatchId]
                                            );
                                            if (partidaAtualizada.length > 0) {
                                                console.log('Partida do Lower Round 2 atualizada:', {
                                                    lowerMatchId,
                                                    time1_id: partidaAtualizada[0].time1_id,
                                                    time2_id: partidaAtualizada[0].time2_id
                                                });
                                            }
                                        } else {
                                            console.warn('Lower Round 2 já tem ambos os times preenchidos ou o time já está lá!', {
                                                lowerMatchId,
                                                time_perdedor_id,
                                                time1_id: partidaLower.time1_id,
                                                time2_id: partidaLower.time2_id
                                            });
                                        }
                                    } else {
                                        console.log('Perdedor das Quartas (Match 1) já está no Lower Round 2:', {
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                    }
                                } else if (lowerRound === 3) {
                                    // Perdedor do Match 2 das Quartas vai para Lower Round 3
                                    // Vencedor do Lower Round 2 já está no time1, perdedor das Quartas vai para time2
                                    if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 2) adicionado ao time2 do Lower Round 3 (6 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                    } else if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 2) adicionado ao time1 do Lower Round 3 (6 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                    }
                                }
                            } else if (quantidadeTimes === 12) {
                                // Para 12 times: Round 2 tem 3 partidas, perdedores vão para Lower Round 2
                                // Match 1 → Lower Round 2, Match 2 (segundo card)
                                // Match 2 e 3 → Lower Round 2, Match 3 (terceiro card)
                                // O lowerMatchId já foi calculado corretamente
                                if (lowerMatchIndex === 2) {
                                    // Match 1 → Lower Round 2, Match 2
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor do Round 2 (Match 1) adicionado ao time1 do Lower Round 2, Match 2 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor do Round 2 (Match 1) adicionado ao time2 do Lower Round 2, Match 2 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                } else if (lowerMatchIndex === 3) {
                                    // Match 2 e 3 → Lower Round 2, Match 3
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor do Round 2 (Match 2 ou 3) adicionado ao time1 do Lower Round 2, Match 3 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor do Round 2 (Match 2 ou 3) adicionado ao time2 do Lower Round 2, Match 3 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                }
                            } else if (quantidadeTimes === 16) {
                                // Para 16 times: Round 2 são as Oitavas, perdedores vão para Lower Round 2
                                // Lower Round 2 tem 4 cards:
                                // Cards 1-2: vencedores do Lower Round 1
                                // Cards 3-4: perdedores das Oitavas (Round 2 do Upper)
                                // Preencher o primeiro slot disponível
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            } else if (quantidadeTimes === 18) {
                                // Para 18 times: Round 2 são as Pré-Oitavas (7 partidas)
                                // Perdedores das Pré-Oitavas vão para Lower Round 2
                                // Lower Round 2 tem 4 partidas:
                                // IMPORTANTE: Vencedor do Lower Round 1, card 1 → Lower Round 2, card 1 (time1) - PRIORIDADE
                                // Vencedor do Lower Round 1, card 2 → Lower Round 2, card 1 (time2)
                                // Perdedor do Round 2, Match 1 → Lower Round 2, Match 2 (segundo card)
                                // Perdedor do Round 2, Match 2 → Lower Round 2, Match 2 (segundo card)
                                // Perdedor do Round 2, Match 3 → Lower Round 2, Match 3 (terceiro card)
                                // Outros perdedores seguem a lógica padrão
                                if (lowerMatchIndex === 2 && (matchIndex === 1 || matchIndex === 2)) {
                                    // Perdedor do Match 1 ou 2 → Lower Round 2, Match 2 (segundo card)
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else if (lowerMatchIndex === 3 && (matchIndex === 3 || matchIndex === 4)) {
                                    // Perdedor do Match 3 ou 4 → Lower Round 2, Match 3 (terceiro card)
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else if (lowerRound === 2 && lowerMatchIndex === 4 && (matchIndex === 5 || matchIndex === 6)) {
                                    // Perdedor do Match 5 ou 6 → Lower Round 2, Match 4 (quarto card)
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else if (lowerRound === 3 && lowerMatchIndex === 4 && matchIndex === 7) {
                                    // Perdedor do Match 7 → Lower Round 3, Match 4 (quarto card)
                                    console.log(`[DEBUG 18 Times R2→LR3] Inserindo perdedor do Match ${matchIndex} no Lower Round 3, Match 4:`, {
                                        match_id_origem: match_id,
                                        matchIndex,
                                        lowerMatchId,
                                        time_perdedor_id,
                                        partidaLower_id: partidaLower.id,
                                        time1_id: partidaLower.time1_id,
                                        time2_id: partidaLower.time2_id
                                    });
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R2→LR3] Perdedor do Match ${matchIndex} inserido no time1 do Lower Round 3, Match 4`);
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R2→LR3] Perdedor do Match ${matchIndex} inserido no time2 do Lower Round 3, Match 4`);
                                    } else {
                                        console.warn(`[DEBUG 18 Times R2→LR3] Não foi possível inserir perdedor do Match ${matchIndex} no Lower Round 3, Match 4:`, {
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id
                                        });
                                    }
                                } else if (lowerRound === 2 && lowerMatchIndex === 4 && matchIndex === 5) {
                                    // Perdedor do Match 5 → Lower Round 2, Match 4 (quarto card)
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else if (lowerMatchIndex === 1) {
                                    // Perdedor do Match 1-2 → Lower Round 2, Match 1 (time2, pois time1 será usado pelo vencedor do Lower Round 1, card 1)
                                    if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        // Fallback: se time2 estiver ocupado, usar time1 (mas isso não deve acontecer se o vencedor ainda não foi inserido)
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else if (lowerMatchIndex === 2) {
                                    // Perdedor do Match 3-4 → Lower Round 2, Match 2 (time1, pois time2 será usado pelo vencedor do Lower Round 1, card 2)
                                    // Mas espera, o vencedor do card 2 vai para time2, então podemos usar time1 aqui
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                } else {
                                    // Fallback para outros casos não tratados especificamente
                                    // Verificar se é Match 7 indo para Lower Round 3
                                    if (matchIndex === 7 && lowerRound === 3 && lowerMatchIndex === 4) {
                                        console.log(`[DEBUG 18 Times R2→LR3] Fallback: Inserindo perdedor do Match ${matchIndex} no Lower Round 3, Match 4:`, {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            partidaLower_id: partidaLower.id,
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id
                                        });
                                        if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                            console.log(`[DEBUG 18 Times R2→LR3] Fallback: Perdedor do Match ${matchIndex} inserido no time1 do Lower Round 3, Match 4`);
                                        } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                            console.log(`[DEBUG 18 Times R2→LR3] Fallback: Perdedor do Match ${matchIndex} inserido no time2 do Lower Round 3, Match 4`);
                                        }
                                    } else {
                                        // Lógica padrão para outros casos
                                        if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                        } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                            await conexao.execute(
                                                'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                                [time_perdedor_id, partidaLower.id]
                                            );
                                        }
                                    }
                                }
                            } else {
                                // Para 8+ times (exceto 16): perdedores das Quartas vão para o segundo card (lower_2_2)
                                // Preencher o primeiro slot disponível (time1_id ou time2_id)
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            }
                        } else if (partida.round_num === 3) {
                            // Perdedor das Quartas (Round 3 para 10 times) ou Semifinais (Round 3 para outras quantidades)
                            const quantidadeTimes = chaveamento.quantidade_times;
                            if (quantidadeTimes === 10) {
                                // Para 10 times: Round 3 são as Quartas (2 partidas)
                                // Match 1 das Quartas → Lower Round 3, Match 2 (segundo card)
                                // Match 2 das Quartas → Lower Round 4, Match 2 (segundo card)
                                // O lowerMatchId já foi calculado corretamente
                                if (lowerRound === 3 && lowerMatchIndex === 2) {
                                    // Match 1 das Quartas → Lower Round 3, Match 2
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 1) adicionado ao time1 do Lower Round 3, Match 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 1) adicionado ao time2 do Lower Round 3, Match 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                } else if (lowerRound === 4 && lowerMatchIndex === 2) {
                                    // Match 2 das Quartas → Lower Round 4, Match 2
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 2) adicionado ao time1 do Lower Round 4, Match 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas (Match 2) adicionado ao time2 do Lower Round 4, Match 2 (10 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                }
                            } else if (quantidadeTimes === 12) {
                                // Para 12 times: Round 3 são as Quartas (1 partida)
                                // Perdedor das Quartas vai para Lower Round 3, Match 2 (segundo card)
                                // O lowerMatchId já foi calculado corretamente
                                if (lowerRound === 3 && lowerMatchIndex === 2) {
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas adicionado ao time1 do Lower Round 3, Match 2 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('Perdedor das Quartas adicionado ao time2 do Lower Round 3, Match 2 (12 times):', {
                                            match_id_origem: match_id,
                                            lowerMatchId,
                                            time_perdedor_id,
                                            matchIndex
                                        });
                                    }
                                }
                            } else if (quantidadeTimes === 16) {
                                // Para 16 times: Round 3 são as Quartas (2 partidas)
                                // Perdedor do primeiro card (Match 1) → Lower Round 4, Match 3 (terceiro card)
                                // Perdedor do segundo card (Match 2) → Lower Round 3, Match 3 (terceiro card)
                                // O lowerMatchId já foi calculado corretamente
                                console.log('[DEBUG QUARTAS 16 TIMES] Tentando inserir time na partida Lower:', {
                                    lowerRound,
                                    lowerMatchIndex,
                                    lowerMatchId,
                                    partidaLower_id: partidaLower.id,
                                    time1_id_atual: partidaLower.time1_id,
                                    time2_id_atual: partidaLower.time2_id,
                                    time_perdedor_id,
                                    condicao_atendida: (lowerRound === 4 && lowerMatchIndex === 3) || (lowerRound === 3 && lowerMatchIndex === 3)
                                });
                                if ((lowerRound === 4 && lowerMatchIndex === 3) || (lowerRound === 3 && lowerMatchIndex === 3)) {
                                    // Preencher o primeiro slot disponível
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 16 TIMES] ✅ Time inserido no time1_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 16 TIMES] Verificação após inserção time1:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time1_id === time_perdedor_id
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 16 TIMES] ✅ Time inserido no time2_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 16 TIMES] Verificação após inserção time2:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time2_id === time_perdedor_id
                                        });
                                    } else {
                                        console.log('[DEBUG QUARTAS 16 TIMES] ⚠️ Não foi possível inserir - slots ocupados:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id,
                                            time1_disponivel: !partidaLower.time1_id,
                                            time2_disponivel: !partidaLower.time2_id,
                                            time_ja_esta_na_partida: partidaLower.time1_id === time_perdedor_id || partidaLower.time2_id === time_perdedor_id
                                        });
                                    }
                                } else {
                                    console.log('[DEBUG QUARTAS 16 TIMES] ⚠️ Condição não atendida:', {
                                        lowerRound,
                                        lowerMatchIndex,
                                        esperado: 'lowerRound === 4 && lowerMatchIndex === 3 OU lowerRound === 3 && lowerMatchIndex === 3'
                                    });
                                }
                            } else if (quantidadeTimes === 18) {
                                // Para 18 times: Round 3 são as Oitavas (3 partidas)
                                // Perdedores das Oitavas vão para Lower Round 3
                                // Match 1 → Lower Round 3, Match 3 (terceiro card)
                                // Match 2 → Lower Round 3, Match 3 (terceiro card)
                                // Match 3 → Lower Round 3, Match 4 (quarto card)
                                if (lowerRound === 3 && lowerMatchIndex === 3) {
                                    // Perdedores do Match 1 e 2 → Lower Round 3, Match 3
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R3→LR3] Perdedor do Match ${matchIndex} das Oitavas inserido no time1 do Lower Round 3, Match 3`);
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R3→LR3] Perdedor do Match ${matchIndex} das Oitavas inserido no time2 do Lower Round 3, Match 3`);
                                    } else {
                                        console.warn(`[DEBUG 18 Times R3→LR3] Não foi possível inserir perdedor do Match ${matchIndex} no Lower Round 3, Match 3:`, {
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id
                                        });
                                    }
                                } else if (lowerRound === 3 && lowerMatchIndex === 4 && matchIndex === 3) {
                                    // Perdedor do Match 3 → Lower Round 3, Match 4
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R3→LR3] Perdedor do Match ${matchIndex} das Oitavas inserido no time1 do Lower Round 3, Match 4`);
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log(`[DEBUG 18 Times R3→LR3] Perdedor do Match ${matchIndex} das Oitavas inserido no time2 do Lower Round 3, Match 4`);
                                    } else {
                                        console.warn(`[DEBUG 18 Times R3→LR3] Não foi possível inserir perdedor do Match ${matchIndex} no Lower Round 3, Match 4:`, {
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id
                                        });
                                    }
                                } else {
                                    // Fallback: preencher o primeiro slot disponível
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                    }
                                }
                            } else {
                                // Para outras quantidades: perdedor das Semifinais vai para a Final do Lower Bracket
                                // Para 6 times: lower_4_1, para 8+ times: lower_4_1
                                console.log('Movendo perdedor das Semifinais para Final do Lower Bracket:', {
                                    time_perdedor_id,
                                    lowerMatchId,
                                    partidaLower_id: partidaLower.id,
                                    time1_id_atual: partidaLower.time1_id,
                                    time2_id_atual: partidaLower.time2_id
                                });
                                
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Time perdedor adicionado ao time1_id da Final do Lower Bracket');
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Time perdedor adicionado ao time2_id da Final do Lower Bracket');
                                } else {
                                    console.warn('Final do Lower Bracket já tem ambos os times preenchidos ou o time já está lá!');
                                }
                            }
                        } else if (partida.round_num === 4) {
                            // Perdedor das Semifinais (Round 4)
                            // IMPORTANTE: Para 18 times, Round 4 são as Quartas, não as Semifinais!
                            const quantidadeTimes = chaveamento.quantidade_times;
                            if (quantidadeTimes === 18) {
                                // Para 18 times: Round 4 são as Quartas (1 partida)
                                // Perdedor das Quartas (Match 1) → Lower Round 4, Match 3 (terceiro card)
                                console.log('[DEBUG QUARTAS 18 TIMES] Tentando inserir time na partida Lower Round 4, Match 3:', {
                                    lowerRound,
                                    lowerMatchIndex,
                                    lowerMatchId,
                                    partidaLower_id: partidaLower.id,
                                    time1_id_atual: partidaLower.time1_id,
                                    time2_id_atual: partidaLower.time2_id,
                                    time_perdedor_id,
                                    condicao_atendida: lowerRound === 4 && lowerMatchIndex === 3
                                });
                                if (lowerRound === 4 && lowerMatchIndex === 3) {
                                    // Preencher o primeiro slot disponível
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 18 TIMES] ✅ Time inserido no time1_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 18 TIMES] Verificação após inserção time1:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time1_id === time_perdedor_id
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 18 TIMES] ✅ Time inserido no time2_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG QUARTAS 18 TIMES] Verificação após inserção time2:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time2_id === time_perdedor_id
                                        });
                                    } else {
                                        console.log('[DEBUG QUARTAS 18 TIMES] ⚠️ Não foi possível inserir - slots ocupados:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id,
                                            time1_disponivel: !partidaLower.time1_id,
                                            time2_disponivel: !partidaLower.time2_id,
                                            time_ja_esta_na_partida: partidaLower.time1_id === time_perdedor_id || partidaLower.time2_id === time_perdedor_id
                                        });
                                    }
                                } else {
                                    console.log('[DEBUG QUARTAS 18 TIMES] ⚠️ Condição não atendida:', {
                                        lowerRound,
                                        lowerMatchIndex,
                                        esperado: 'lowerRound === 4 && lowerMatchIndex === 3'
                                    });
                                }
                            } else if (quantidadeTimes === 10) {
                                // Para 10 times: Round 4 são as Semifinais (1 partida)
                                // Perdedor das Semifinais vai para Lower Round 4, Match 2 (segundo card)
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            } else if (quantidadeTimes === 12) {
                                // Para 12 times: Round 4 são as Semifinais (1 partida)
                                // Perdedor das Semifinais vai para Lower Round 5 (Final do Lower)
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            } else {
                                // Para outras quantidades: perdedor das Semifinais vai para a Final do Lower Bracket
                                console.log('Movendo perdedor das Semifinais para Final do Lower Bracket:', {
                                    time_perdedor_id,
                                    lowerMatchId,
                                    partidaLower_id: partidaLower.id,
                                    time1_id_atual: partidaLower.time1_id,
                                    time2_id_atual: partidaLower.time2_id
                                });
                                
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Time perdedor adicionado ao time1_id da Final do Lower Bracket');
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                    console.log('Time perdedor adicionado ao time2_id da Final do Lower Bracket');
                                } else {
                                    console.warn('Final do Lower Bracket já tem ambos os times preenchidos ou o time já está lá!');
                                }
                            }
                        } else if (partida.round_num === 5) {
                            // Perdedor das Semifinais (Round 5)
                            const quantidadeTimes = chaveamento.quantidade_times;
                            if (quantidadeTimes === 18) {
                                // Para 18 times: Round 5 são as Semifinais (1 partida)
                                // Perdedor das Semifinais (Match 1) → Lower Round 5, Match 2 (segundo card)
                                console.log('[DEBUG SEMIFINAIS 18 TIMES] Tentando inserir time na partida Lower Round 5, Match 2:', {
                                    lowerRound,
                                    lowerMatchIndex,
                                    lowerMatchId,
                                    partidaLower_id: partidaLower.id,
                                    time1_id_atual: partidaLower.time1_id,
                                    time2_id_atual: partidaLower.time2_id,
                                    time_perdedor_id,
                                    condicao_atendida: lowerRound === 5 && lowerMatchIndex === 2
                                });
                                if (lowerRound === 5 && lowerMatchIndex === 2) {
                                    // Preencher o primeiro slot disponível
                                    if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG SEMIFINAIS 18 TIMES] ✅ Time inserido no time1_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG SEMIFINAIS 18 TIMES] Verificação após inserção time1:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time1_id === time_perdedor_id
                                        });
                                    } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                        await conexao.execute(
                                            'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                            [time_perdedor_id, partidaLower.id]
                                        );
                                        console.log('[DEBUG SEMIFINAIS 18 TIMES] ✅ Time inserido no time2_id:', {
                                            partidaLower_id: partidaLower.id,
                                            lowerMatchId,
                                            time_perdedor_id
                                        });
                                        // Verificar se foi realmente inserido
                                        const [verificacao] = await conexao.execute(
                                            'SELECT time1_id, time2_id FROM partidas WHERE id = ?',
                                            [partidaLower.id]
                                        );
                                        console.log('[DEBUG SEMIFINAIS 18 TIMES] Verificação após inserção time2:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: verificacao[0]?.time1_id,
                                            time2_id: verificacao[0]?.time2_id,
                                            time_perdedor_id,
                                            inserido_corretamente: verificacao[0]?.time2_id === time_perdedor_id
                                        });
                                    } else {
                                        console.log('[DEBUG SEMIFINAIS 18 TIMES] ⚠️ Não foi possível inserir - slots ocupados:', {
                                            partidaLower_id: partidaLower.id,
                                            time1_id: partidaLower.time1_id,
                                            time2_id: partidaLower.time2_id,
                                            time_perdedor_id,
                                            time1_disponivel: !partidaLower.time1_id,
                                            time2_disponivel: !partidaLower.time2_id,
                                            time_ja_esta_na_partida: partidaLower.time1_id === time_perdedor_id || partidaLower.time2_id === time_perdedor_id
                                        });
                                    }
                                } else {
                                    console.log('[DEBUG SEMIFINAIS 18 TIMES] ⚠️ Condição não atendida:', {
                                        lowerRound,
                                        lowerMatchIndex,
                                        esperado: 'lowerRound === 5 && lowerMatchIndex === 2'
                                    });
                                }
                            } else {
                                // Para outras quantidades: perdedor das Semifinais vai para a Final do Lower Bracket
                                // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                                if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                    await conexao.execute(
                                        'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                        [time_perdedor_id, partidaLower.id]
                                    );
                                }
                            }
                        } else {
                            // Outros rounds: usar primeiro slot disponível
                            // IMPORTANTE: Garantir que não adicionamos o mesmo time em ambos os slots
                            if (!partidaLower.time1_id && partidaLower.time2_id !== time_perdedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time1_id = ? WHERE id = ?',
                                    [time_perdedor_id, partidaLower.id]
                                );
                            } else if (!partidaLower.time2_id && partidaLower.time1_id !== time_perdedor_id) {
                                await conexao.execute(
                                    'UPDATE partidas SET time2_id = ? WHERE id = ?',
                                    [time_perdedor_id, partidaLower.id]
                                );
                            }
                        }
                    } else {
                        console.log('Perdedor já está na partida do Lower, evitando duplicação:', {
                            match_id: lowerMatchId,
                            time_perdedor_id,
                            time1_id: partidaLower.time1_id,
                            time2_id: partidaLower.time2_id
                        });
                    }
                }

            } else if (partida.bracket_type === 'lower') {
                // Perdeu no Lower → ELIMINADO
                await conexao.execute(
                    `UPDATE posicoes_times 
                     SET bracket_type = 'eliminado', status = 'eliminado', round_atual = NULL, 
                         match_id_atual = NULL, data_eliminacao = NOW()
                     WHERE chaveamento_id = ? AND time_id = ?`,
                    [chaveamento_id, time_perdedor_id]
                );

                // Registrar no histórico
                await conexao.execute(
                    `INSERT INTO historico_movimentacoes 
                     (chaveamento_id, time_id, tipo_movimentacao, round_origem, match_id_origem, partida_id)
                     VALUES (?, ?, 'eliminado', ?, ?, ?)`,
                    [chaveamento_id, time_perdedor_id, partida.round_num, match_id, partida.id]
                );
            }

            // Atualizar status do chaveamento
            await conexao.execute(
                `UPDATE chaveamentos SET status = 'em_andamento' WHERE id = ?`,
                [chaveamento_id]
            );

            // Commit da transação
            await conexao.commit();

            // Se chegou aqui, sucesso - retornar resposta e sair do loop
            res.status(200).json({
                message: 'Resultado salvo e posições atualizadas com sucesso',
                partida_id: partida.id
            });
            
            if (conexao) await desconectar(conexao);
            return; // Sucesso - sair da função

        } catch (error) {
            // Rollback em caso de erro
            if (conexao) {
                try {
                    await conexao.rollback();
                } catch (rollbackError) {
                    console.error('Erro ao fazer rollback:', rollbackError);
                }
            }
            
            // Verificar se é erro de duplicação
            if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
                console.warn('Tentativa de inserir registro duplicado. Atualizando posição existente:', error.message);
                // Se for erro de duplicação, tentar atualizar a posição existente
                try {
                    // Buscar qual time estava sendo inserido (precisamos do time_id do contexto)
                    // Como não temos acesso direto aqui, vamos apenas logar e continuar
                    // O INSERT IGNORE já deve ter evitado o erro, mas se chegou aqui, vamos tentar atualizar
                    if (conexao) {
                        await conexao.rollback();
                        await conexao.beginTransaction();
                        // A próxima tentativa vai fazer UPDATE em vez de INSERT (já que o registro existe)
                    }
                    attempt++;
                    if (attempt < maxRetries) {
                        const waitTime = Math.min(100 * Math.pow(2, attempt - 1), 400);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        if (conexao) await desconectar(conexao);
                        continue; // Tentar novamente
                    }
                } catch (updateError) {
                    console.error('Erro ao tentar atualizar após duplicação:', updateError);
                }
            }
            
            console.error('Erro ao salvar resultado (tentativa ' + (attempt + 1) + '):', error);
            
            // Se excedeu tentativas ou erro não é de deadlock, retornar erro
            if (error.code !== 'ER_LOCK_DEADLOCK' || attempt >= maxRetries - 1) {
                if (conexao) await desconectar(conexao);
                
                // SEMPRE retornar JSON, mesmo em caso de erro
                return res.status(500).json({
                    error: 'Erro ao salvar resultado',
                    details: error.message || 'Erro desconhecido',
                    code: error.code || 'UNKNOWN_ERROR'
                });
            }
            
            // Se for deadlock, esperar e tentar novamente
            attempt++;
            const waitTime = Math.min(100 * Math.pow(2, attempt - 1), 400);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            if (conexao) await desconectar(conexao);
            continue; // Tentar novamente
        } finally {
            // Garantir que a conexão seja fechada
            if (conexao) {
                try {
                    await desconectar(conexao);
                } catch (disconnectError) {
                    console.error('Erro ao desconectar:', disconnectError);
                }
            }
        }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    return res.status(500).json({
        error: 'Erro ao salvar resultado após múltiplas tentativas',
        details: 'Não foi possível salvar o resultado após ' + maxRetries + ' tentativas'
    });
}

// =====================================================
// Inicializar partidas do chaveamento (criar estrutura)
// =====================================================
async function inicializarPartidasChaveamento(req, res) {
    let conexao;
    try {
        const { chaveamento_id, times_ids } = req.body;

        if (!chaveamento_id || !times_ids || !Array.isArray(times_ids)) {
            return res.status(400).json({
                error: 'chaveamento_id e times_ids (array) são obrigatórios'
            });
        }

        conexao = await conectar();

        // Buscar informações do chaveamento
        const [chaveamentos] = await conexao.execute(
            'SELECT * FROM chaveamentos WHERE id = ?',
            [chaveamento_id]
        );

        if (chaveamentos.length === 0) {
            return res.status(404).json({ error: 'Chaveamento não encontrado' });
        }

        const chaveamento = chaveamentos[0];
        const numTeams = chaveamento.quantidade_times;
        const formato = chaveamento.formato_chave;

        // TODO: Implementar lógica para criar todas as partidas baseado no formato
        // Por enquanto, retornar sucesso
        // A lógica completa será implementada no frontend e depois sincronizada

        res.status(200).json({
            message: 'Partidas serão inicializadas pelo frontend',
            chaveamento_id
        });

    } catch (error) {
        console.error('Erro ao inicializar partidas:', error);
        res.status(500).json({
            error: 'Erro ao inicializar partidas',
            details: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// RESETAR CHAVEAMENTO
// ===============================================================================================

async function resetarChaveamento(req, res) {
    let conexao = null;
    try {
        const { chaveamento_id } = req.params;
        
        if (!chaveamento_id) {
            return res.status(400).json({ error: 'ID do chaveamento é obrigatório' });
        }

        conexao = await conectar();

        // Iniciar transação
        await conexao.beginTransaction();

        // 1. Deletar histórico de movimentações
        await conexao.execute(
            'DELETE FROM historico_movimentacoes WHERE chaveamento_id = ?',
            [chaveamento_id]
        );

        // 2. Deletar resultados das partidas
        await conexao.execute(
            `DELETE rp FROM resultados_partidas rp
             INNER JOIN partidas p ON rp.partida_id = p.id
             WHERE p.chaveamento_id = ?`,
            [chaveamento_id]
        );

        // 3. Deletar posições dos times
        await conexao.execute(
            'DELETE FROM posicoes_times WHERE chaveamento_id = ?',
            [chaveamento_id]
        );

        // 4. Deletar partidas
        await conexao.execute(
            'DELETE FROM partidas WHERE chaveamento_id = ?',
            [chaveamento_id]
        );

        // 5. Resetar chaveamento (manter o registro, mas resetar status e campeão)
        await conexao.execute(
            `UPDATE chaveamentos 
             SET status = 'nao_iniciado', 
                 campeao_time_id = NULL,
                 data_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [chaveamento_id]
        );

        // Confirmar transação
        await conexao.commit();

        console.log(`Chaveamento ${chaveamento_id} resetado com sucesso`);

        res.json({
            success: true,
            message: 'Chaveamento resetado com sucesso',
            chaveamento_id: chaveamento_id
        });

    } catch (error) {
        if (conexao) {
            await conexao.rollback();
        }
        console.error('Erro ao resetar chaveamento:', error);
        res.status(500).json({
            error: 'Erro ao resetar chaveamento',
            details: error.message
        });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// ===============================================================================================
// ==================================== [API VETOS] ================================================

// Função auxiliar para gerar token único
function gerarToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Criar sessão de vetos
async function criarSessaoVetos(req, res) {
    const { formato, mapas_selecionados, partida_id, campeonato_id, time_a_id, time_b_id } = req.body;

    if (!formato || !mapas_selecionados || !Array.isArray(mapas_selecionados) || mapas_selecionados.length === 0) {
        return res.status(400).json({ message: 'Formato e mapas selecionados são obrigatórios' });
    }

    if (!['bo1', 'bo3', 'bo5'].includes(formato)) {
        return res.status(400).json({ message: 'Formato inválido. Use: bo1, bo3 ou bo5' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        const token_a = gerarToken();
        const token_b = gerarToken();
        const token_spectator = gerarToken();
        
        const query = `INSERT INTO vetos_sessoes 
            (formato, mapas_selecionados, partida_id, campeonato_id, time_a_id, time_b_id, token_a, token_b, token_spectator, turno_atual, status, time_a_pronto, time_b_pronto, sorteio_realizado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'time_a', 'configurado', FALSE, FALSE, FALSE)`;
        
        const mapasJson = JSON.stringify(mapas_selecionados);
        const valores = [
            formato,
            mapasJson,
            partida_id || null,
            campeonato_id || null,
            time_a_id || null,
            time_b_id || null,
            token_a,
            token_b,
            token_spectator
        ];

        const [result] = await conexao.execute(query, valores);
        const sessaoId = result.insertId;

        res.status(200).json({
            message: 'Sessão de vetos criada com sucesso',
            sessao_id: sessaoId,
            token_a,
            token_b,
            token_spectator
        });
    } catch (error) {
        console.error('Erro ao criar sessão de vetos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Buscar sessão de vetos por token
async function buscarSessaoVetosPorToken(req, res) {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: 'Token é obrigatório' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        const query = `SELECT * FROM vetos_sessoes 
            WHERE token_a = ? OR token_b = ? OR token_spectator = ?`;
        
        const [rows] = await conexao.execute(query, [token, token, token]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const sessao = rows[0];
        
        // Parse do JSON com tratamento de erro
        let mapasSelecionados = [];
        try {
            if (typeof sessao.mapas_selecionados === 'string') {
                mapasSelecionados = JSON.parse(sessao.mapas_selecionados);
            } else if (Array.isArray(sessao.mapas_selecionados)) {
                mapasSelecionados = sessao.mapas_selecionados;
            } else {
                mapasSelecionados = [];
            }
        } catch (parseError) {
            console.error('Erro ao fazer parse de mapas_selecionados:', parseError);
            mapasSelecionados = [];
        }
        
        // Determinar qual time é baseado no token (ou se é espectador)
        const isSpectator = sessao.token_spectator === token;
        const timeAtual = isSpectator ? null : (sessao.token_a === token ? 'time_a' : 'time_b');
        const podeJogar = !isSpectator && sessao.turno_atual === timeAtual && sessao.status === 'em_andamento';

        // Buscar ações já realizadas
        let acoes = [];
        try {
            const queryAcoes = `SELECT * FROM vetos_acoes 
                WHERE sessao_id = ? 
                ORDER BY ordem ASC`;
            const [acoesResult] = await conexao.execute(queryAcoes, [sessao.id]);
            acoes = acoesResult || [];
        } catch (acoesError) {
            console.error('Erro ao buscar ações:', acoesError);
            acoes = [];
        }

        res.status(200).json({
            sessao: {
                id: sessao.id,
                formato: sessao.formato,
                mapas_selecionados: mapasSelecionados,
                turno_atual: sessao.turno_atual,
                status: sessao.status,
                time_atual: timeAtual,
                pode_jogar: podeJogar,
                is_spectator: isSpectator,
                time_a_id: sessao.time_a_id || null,
                time_b_id: sessao.time_b_id || null,
                time_a_pronto: sessao.time_a_pronto || false,
                time_b_pronto: sessao.time_b_pronto || false,
                sorteio_realizado: sessao.sorteio_realizado || false,
                partida_id: sessao.partida_id || null
            },
            acoes: acoes
        });
    } catch (error) {
        console.error('Erro ao buscar sessão de vetos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Salvar ação de pick/ban
async function salvarAcaoVeto(req, res) {
    const { token, mapa, acao } = req.body;

    if (!token || !mapa || !acao) {
        return res.status(400).json({ message: 'Token, mapa e ação são obrigatórios' });
    }

    if (!['pick', 'ban'].includes(acao)) {
        return res.status(400).json({ message: 'Ação inválida. Use: pick ou ban' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        // Buscar sessão
        const querySessao = `SELECT * FROM vetos_sessoes 
            WHERE token_a = ? OR token_b = ? OR token_spectator = ?`;
        const [sessoes] = await conexao.execute(querySessao, [token, token, token]);
        
        if (sessoes.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const sessao = sessoes[0];
        
        // Verificar se é espectador (não pode fazer ações)
        if (sessao.token_spectator === token) {
            return res.status(403).json({ message: 'Espectadores não podem realizar ações' });
        }
        
        // Verificar se é o turno do time
        const timeAtual = sessao.token_a === token ? 'time_a' : 'time_b';
        if (sessao.turno_atual !== timeAtual) {
            return res.status(403).json({ message: 'Não é o seu turno' });
        }

        if (sessao.status !== 'em_andamento') {
            return res.status(400).json({ message: 'Sessão não está em andamento' });
        }

        // Verificar se o mapa está na lista de selecionados
        let mapasSelecionados = [];
        try {
            if (typeof sessao.mapas_selecionados === 'string') {
                // Tentar parse JSON primeiro
                try {
                    mapasSelecionados = JSON.parse(sessao.mapas_selecionados);
                } catch (parseError) {
                    // Se falhar, tentar como string separada por vírgula
                    if (sessao.mapas_selecionados.includes(',')) {
                        mapasSelecionados = sessao.mapas_selecionados.split(',').map(m => m.trim());
                    } else {
                        mapasSelecionados = [sessao.mapas_selecionados];
                    }
                }
            } else if (Array.isArray(sessao.mapas_selecionados)) {
                mapasSelecionados = sessao.mapas_selecionados;
            }
        } catch (error) {
            console.error('Erro ao fazer parse de mapas_selecionados:', error);
            return res.status(500).json({ message: 'Erro ao processar mapas selecionados' });
        }
        
        if (!Array.isArray(mapasSelecionados) || mapasSelecionados.length === 0) {
            return res.status(400).json({ message: 'Lista de mapas selecionados inválida' });
        }
        
        if (!mapasSelecionados.includes(mapa)) {
            return res.status(400).json({ message: 'Mapa não está na lista de selecionados' });
        }

        // Verificar se o mapa já foi pickado/banido
        const queryAcoes = `SELECT * FROM vetos_acoes 
            WHERE sessao_id = ? AND mapa = ?`;
        const [acoesExistentes] = await conexao.execute(queryAcoes, [sessao.id, mapa]);
        
        if (acoesExistentes.length > 0) {
            return res.status(400).json({ message: 'Este mapa já foi selecionado' });
        }

        // Contar ações já realizadas para determinar a ordem
        const queryCount = `SELECT COUNT(*) as total FROM vetos_acoes WHERE sessao_id = ?`;
        const [count] = await conexao.execute(queryCount, [sessao.id]);
        const ordem = count[0].total + 1;

        // Salvar ação
        const timeId = timeAtual === 'time_a' ? sessao.time_a_id : sessao.time_b_id;
        const queryInsert = `INSERT INTO vetos_acoes 
            (sessao_id, mapa, acao, time_id, ordem) 
            VALUES (?, ?, ?, ?, ?)`;
        
        await conexao.execute(queryInsert, [sessao.id, mapa, acao, timeId, ordem]);

        // Lógica especial para BO1: após 6 vetos, o último mapa é automaticamente pickado
        if (sessao.formato === 'bo1' && ordem === 6 && acao === 'ban') {
            // Buscar todas as ações já realizadas (incluindo a que acabou de ser salva)
            const queryAcoesCompletas = `SELECT mapa, acao FROM vetos_acoes WHERE sessao_id = ? ORDER BY ordem`;
            const [todasAcoes] = await conexao.execute(queryAcoesCompletas, [sessao.id]);
            
            // Encontrar o último mapa restante
            const mapasVetados = todasAcoes
                .filter(a => a.acao === 'ban')
                .map(a => a.mapa);
            
            const ultimoMapa = mapasSelecionados.find(m => !mapasVetados.includes(m));
            
            if (ultimoMapa) {
                // Automaticamente fazer pick do último mapa
                const queryInsertPick = `INSERT INTO vetos_acoes 
                    (sessao_id, mapa, acao, time_id, ordem) 
                    VALUES (?, ?, ?, ?, ?)`;
                await conexao.execute(queryInsertPick, [sessao.id, ultimoMapa, 'pick', null, 7]);
                
                // Finalizar sessão
                const queryUpdateFinal = `UPDATE vetos_sessoes 
                    SET status = 'finalizado', turno_atual = NULL
                    WHERE id = ?`;
                await conexao.execute(queryUpdateFinal, [sessao.id]);
                
                res.status(200).json({
                    message: 'Ação salva com sucesso. Último mapa automaticamente selecionado!',
                    proximo_turno: null,
                    sessao_finalizada: true,
                    mapa_final: ultimoMapa
                });
                return;
            }
        }

        // Lógica especial para BO3: após 6 ações (2 ban, 2 pick, 2 ban), o último mapa é automaticamente pickado como decider
        if (sessao.formato === 'bo3' && ordem === 6 && acao === 'ban') {
            // Buscar todas as ações já realizadas (incluindo a que acabou de ser salva)
            const queryAcoesCompletas = `SELECT mapa, acao FROM vetos_acoes WHERE sessao_id = ? ORDER BY ordem`;
            const [todasAcoes] = await conexao.execute(queryAcoesCompletas, [sessao.id]);
            
            // Encontrar mapas já selecionados (vetados ou pickados)
            const mapasSelecionadosAcoes = todasAcoes.map(a => a.mapa);
            
            // Encontrar o último mapa restante (que não foi nem vetado nem pickado)
            const ultimoMapa = mapasSelecionados.find(m => !mapasSelecionadosAcoes.includes(m));
            
            if (ultimoMapa) {
                // Automaticamente fazer pick do último mapa como decider
                const queryInsertPick = `INSERT INTO vetos_acoes 
                    (sessao_id, mapa, acao, time_id, ordem) 
                    VALUES (?, ?, ?, ?, ?)`;
                await conexao.execute(queryInsertPick, [sessao.id, ultimoMapa, 'pick', null, 7]);
                
                // Finalizar sessão
                const queryUpdateFinal = `UPDATE vetos_sessoes 
                    SET status = 'finalizado', turno_atual = NULL
                    WHERE id = ?`;
                await conexao.execute(queryUpdateFinal, [sessao.id]);
                
                res.status(200).json({
                    message: 'Ação salva com sucesso. Mapa decider automaticamente selecionado!',
                    proximo_turno: null,
                    sessao_finalizada: true,
                    mapa_final: ultimoMapa,
                    mapa_decider: ultimoMapa
                });
                return;
            }
        }

        // Lógica especial para BO5: após 4 picks, o último mapa é automaticamente pickado como decider
        if (sessao.formato === 'bo5' && ordem === 6 && acao === 'pick') {
            // Buscar todas as ações já realizadas (incluindo a que acabou de ser salva)
            const queryAcoesCompletas = `SELECT mapa, acao FROM vetos_acoes WHERE sessao_id = ? ORDER BY ordem`;
            const [todasAcoes] = await conexao.execute(queryAcoesCompletas, [sessao.id]);
            
            // Encontrar mapas já selecionados (vetados ou pickados)
            const mapasSelecionadosAcoes = todasAcoes.map(a => a.mapa);
            
            // Encontrar o último mapa restante (que não foi nem vetado nem pickado)
            const ultimoMapa = mapasSelecionados.find(m => !mapasSelecionadosAcoes.includes(m));
            
            if (ultimoMapa) {
                // Automaticamente fazer pick do último mapa como decider
                const queryInsertPick = `INSERT INTO vetos_acoes 
                    (sessao_id, mapa, acao, time_id, ordem) 
                    VALUES (?, ?, ?, ?, ?)`;
                await conexao.execute(queryInsertPick, [sessao.id, ultimoMapa, 'pick', null, 7]);
                
                // Finalizar sessão
                const queryUpdateFinal = `UPDATE vetos_sessoes 
                    SET status = 'finalizado', turno_atual = NULL
                    WHERE id = ?`;
                await conexao.execute(queryUpdateFinal, [sessao.id]);
                
                res.status(200).json({
                    message: 'Ação salva com sucesso. Mapa decider automaticamente selecionado!',
                    proximo_turno: null,
                    sessao_finalizada: true,
                    mapa_final: ultimoMapa,
                    mapa_decider: ultimoMapa
                });
                return;
            }
        }

        // Lógica especial para BO5: após 4 picks, o último mapa é automaticamente pickado como decider
        if (sessao.formato === 'bo5' && ordem === 6 && acao === 'pick') {
            // Buscar todas as ações já realizadas (incluindo a que acabou de ser salva)
            const queryAcoesCompletas = `SELECT mapa, acao FROM vetos_acoes WHERE sessao_id = ? ORDER BY ordem`;
            const [todasAcoes] = await conexao.execute(queryAcoesCompletas, [sessao.id]);
            
            // Encontrar mapas já selecionados (vetados ou pickados)
            const mapasSelecionadosAcoes = todasAcoes.map(a => a.mapa);
            
            // Encontrar o último mapa restante (que não foi nem vetado nem pickado)
            const ultimoMapa = mapasSelecionados.find(m => !mapasSelecionadosAcoes.includes(m));
            
            if (ultimoMapa) {
                // Automaticamente fazer pick do último mapa como decider
                const queryInsertPick = `INSERT INTO vetos_acoes 
                    (sessao_id, mapa, acao, time_id, ordem) 
                    VALUES (?, ?, ?, ?, ?)`;
                await conexao.execute(queryInsertPick, [sessao.id, ultimoMapa, 'pick', null, 7]);
                
                // Finalizar sessão
                const queryUpdateFinal = `UPDATE vetos_sessoes 
                    SET status = 'finalizado', turno_atual = NULL
                    WHERE id = ?`;
                await conexao.execute(queryUpdateFinal, [sessao.id]);
                
                res.status(200).json({
                    message: 'Ação salva com sucesso. Mapa decider automaticamente selecionado!',
                    proximo_turno: null,
                    sessao_finalizada: true,
                    mapa_final: ultimoMapa,
                    mapa_decider: ultimoMapa
                });
                return;
            }
        }

        // Alternar turno
        const proximoTurno = sessao.turno_atual === 'time_a' ? 'time_b' : 'time_a';
        const queryUpdate = `UPDATE vetos_sessoes 
            SET turno_atual = ?, status = 'em_andamento' 
            WHERE id = ?`;
        
        await conexao.execute(queryUpdate, [proximoTurno, sessao.id]);

        res.status(200).json({
            message: 'Ação salva com sucesso',
            proximo_turno: proximoTurno
        });
    } catch (error) {
        console.error('Erro ao salvar ação de veto:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Salvar escolha de lado inicial (CT/TR) para um mapa pickado
async function salvarEscolhaLado(req, res) {
    const { token, mapa, lado } = req.body;

    if (!token || !mapa || !lado) {
        return res.status(400).json({ message: 'Token, mapa e lado são obrigatórios' });
    }

    if (!['CT', 'TR'].includes(lado.toUpperCase())) {
        return res.status(400).json({ message: 'Lado inválido. Use: CT ou TR' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        // Buscar sessão
        const querySessao = `SELECT * FROM vetos_sessoes 
            WHERE token_a = ? OR token_b = ? OR token_spectator = ?`;
        const [sessoes] = await conexao.execute(querySessao, [token, token, token]);
        
        if (sessoes.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const sessao = sessoes[0];
        
        // Verificar se é espectador (não pode fazer ações)
        if (sessao.token_spectator === token) {
            return res.status(403).json({ message: 'Espectadores não podem realizar ações' });
        }
        
        // Buscar a ação de pick para este mapa
        const queryAcao = `SELECT * FROM vetos_acoes 
            WHERE sessao_id = ? AND mapa = ? AND acao = 'pick'`;
        const [acoes] = await conexao.execute(queryAcao, [sessao.id, mapa]);
        
        if (acoes.length === 0) {
            return res.status(404).json({ message: 'Ação de pick não encontrada para este mapa' });
        }

        const acao = acoes[0];
        
        // Verificar se é o outro time (não o que fez o pick)
        const timeAtual = sessao.token_a === token ? sessao.time_a_id : sessao.time_b_id;
        if (acao.time_id === timeAtual) {
            return res.status(403).json({ message: 'Você não pode escolher o lado para o mapa que você pickou' });
        }
        
        // Verificar se já escolheu
        if (acao.lado_inicial) {
            return res.status(400).json({ message: 'Lado já foi escolhido para este mapa' });
        }
        
        // Atualizar ação com o lado escolhido
        const queryUpdate = `UPDATE vetos_acoes 
            SET lado_inicial = ? 
            WHERE id = ?`;
        
        await conexao.execute(queryUpdate, [lado.toUpperCase(), acao.id]);

        res.status(200).json({
            message: 'Lado escolhido com sucesso',
            lado: lado.toUpperCase()
        });
    } catch (error) {
        console.error('Erro ao salvar escolha de lado:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Iniciar sessão de vetos (mudar status para em_andamento)
async function iniciarSessaoVetos(req, res) {
    const { sessao_id } = req.body;

    if (!sessao_id) {
        return res.status(400).json({ message: 'ID da sessão é obrigatório' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        const query = `UPDATE vetos_sessoes 
            SET status = 'em_andamento' 
            WHERE id = ?`;
        
        await conexao.execute(query, [sessao_id]);

        res.status(200).json({ message: 'Sessão iniciada com sucesso' });
    } catch (error) {
        console.error('Erro ao iniciar sessão de vetos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

// Registrar que um time clicou no botão da roleta
async function registrarCliqueRoleta(req, res) {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token é obrigatório' });
    }

    let conexao;
    try {
        conexao = await conectar();
        
        // Buscar sessão
        const querySessao = `SELECT * FROM vetos_sessoes 
            WHERE token_a = ? OR token_b = ? OR token_spectator = ?`;
        const [sessoes] = await conexao.execute(querySessao, [token, token, token]);
        
        if (sessoes.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const sessao = sessoes[0];
        
        // Verificar se é espectador (não pode clicar na roleta)
        if (sessao.token_spectator === token) {
            return res.status(403).json({ message: 'Espectadores não podem participar do sorteio' });
        }
        
        const timeAtual = sessao.token_a === token ? 'time_a' : 'time_b';
        
        // Verificar se já clicou
        const campoPronto = timeAtual === 'time_a' ? 'time_a_pronto' : 'time_b_pronto';
        if (sessao[campoPronto]) {
            // Buscar estado atualizado
            const queryVerificar = `SELECT time_a_pronto, time_b_pronto, sorteio_realizado, turno_atual FROM vetos_sessoes WHERE id = ?`;
            const [resultado] = await conexao.execute(queryVerificar, [sessao.id]);
            const atualizado = resultado[0];
            
            return res.status(200).json({ 
                message: 'Você já clicou!',
                time_a_pronto: atualizado.time_a_pronto,
                time_b_pronto: atualizado.time_b_pronto,
                sorteio_realizado: atualizado.sorteio_realizado,
                vencedor: atualizado.sorteio_realizado ? atualizado.turno_atual : null
            });
        }

        // Marcar como pronto
        const queryUpdate = `UPDATE vetos_sessoes 
            SET ${campoPronto} = TRUE 
            WHERE id = ?`;
        await conexao.execute(queryUpdate, [sessao.id]);

        // Verificar se ambos estão prontos
        const queryVerificar = `SELECT time_a_pronto, time_b_pronto, sorteio_realizado FROM vetos_sessoes WHERE id = ?`;
        const [resultado] = await conexao.execute(queryVerificar, [sessao.id]);
        const atualizado = resultado[0];

        let vencedor = null;
        let turnoInicial = null;

        // Se ambos clicaram e o sorteio ainda não foi realizado, fazer o sorteio
        if (atualizado.time_a_pronto && atualizado.time_b_pronto && !atualizado.sorteio_realizado) {
            // Sortear aleatoriamente quem começa (50% chance para cada)
            const sorteio = Math.random() < 0.5 ? 'time_a' : 'time_b';
            turnoInicial = sorteio;
            vencedor = sorteio;

            // Atualizar turno_atual, marcar sorteio como realizado E iniciar a sessão
            const querySorteio = `UPDATE vetos_sessoes 
                SET turno_atual = ?, sorteio_realizado = TRUE, status = 'em_andamento' 
                WHERE id = ?`;
            await conexao.execute(querySorteio, [sorteio, sessao.id]);
        }

        res.status(200).json({
            message: 'Clique registrado com sucesso',
            time_a_pronto: timeAtual === 'time_a' ? true : atualizado.time_a_pronto,
            time_b_pronto: timeAtual === 'time_b' ? true : atualizado.time_b_pronto,
            sorteio_realizado: atualizado.sorteio_realizado || (vencedor !== null),
            vencedor: vencedor,
            turno_inicial: turnoInicial
        });
    } catch (error) {
        console.error('Erro ao registrar clique na roleta:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}



// ===============================================================================================
// ==================================== [API RANKING] ================================================


// --- GET RANKING
async function getRankingTimes(req, res) {
    let conexao;
    try {
        conexao = await conectar();
        const [ranking] = await conexao.execute(
            'SELECT * FROM ranking_times'
        );
        res.status(200).json({ ranking });
    }
    catch (error) {
        console.error('Erro ao buscar ranking de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }

}


async function getRankingTimesHistorico(req, res) {
    let conexao;
    try{
        conexao = await conectar();
        const [ranking] = await conexao.execute(
            'SELECT * FROM ranking_times_historico'
        );
        res.status(200).json({ ranking });
    }
    catch (error) {
        console.error('Erro ao buscar ranking de times historico:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// --- POST RANKING
async function criarRankingTimes(req, res) {
    const { time_id, pontos, ranking_atual, trofeus, total_partidas, vitorias, derrotas, wo, campeonatos_premier_cup, campeonatos_liga_prime, campeonatos_oficiais, campeonatos_comuns } = req.body;

    if (!time_id || !pontos || !ranking_atual || !trofeus || !total_partidas || !vitorias || !derrotas || !wo || !campeonatos_premier_cup || !campeonatos_liga_prime || !campeonatos_oficiais || !campeonatos_comuns) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    let conexao;
    try{
        
        const query = `INSERT INTO ranking_times (time_id,pontos,ranking_atual,trofeus,total_partidas,vitorias,derrotas,wo,campeonatos_premier_cup,campeonatos_liga_prime,campeonatos_oficiais,campeonatos_comuns) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        await conexao.execute(query, [time_id,pontos,ranking_atual,trofeus,total_partidas,vitorias,derrotas,wo,campeonatos_premier_cup,campeonatos_liga_prime,campeonatos_oficiais,campeonatos_comuns]);

        res.status(200).json({ message: 'Ranking criado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao criar ranking de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


async function criarRankingTimesHistorico(req, res) {
    const { time_id,pontos,ranking_atual,trofeus,total_partidas,vitorias,derrotas,wo,campeonatos_premier_cup,campeonatos_liga_prime,campeonatos_oficiais,campeonatos_comuns} = req.body;
    if (!time_id || !pontos || !ranking_atual || !trofeus || !total_partidas || !vitorias || !derrotas || !wo || !campeonatos_premier_cup || !campeonatos_liga_prime || !campeonatos_oficiais || !campeonatos_comuns) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    let conexao;
    try{
        conexao = await conectar();
        const query = `INSERT INTO ranking_times_historico (time_id,pontos,ranking_atual,trofeus,total_partidas,vitorias,derrotas,wo,campeonatos_premier_cup,campeonatos_liga_prime,campeonatos_oficiais,campeonatos_comuns) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        await conexao.execute(query, [time_id,pontos,ranking_atual,trofeus,total_partidas,vitorias,derrotas,wo,campeonatos_premier_cup,campeonatos_liga_prime,campeonatos_oficiais,campeonatos_comuns]);
        res.status(200).json({ message: 'Ranking criado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao criar ranking de times:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}


// --- PUT RANKING

async function atualizarRankingTimes(req, res) {
    const { time_id, pontos, ranking_atual, trofeus, total_partidas, vitorias, derrotas, wo, campeonatos_premier_cup, campeonatos_liga_prime, campeonatos_oficiais, campeonatos_comuns } = req.body;
    
    // Apenas time_id é obrigatório
    if (!time_id) {
        return res.status(400).json({ message: 'time_id é obrigatório' });
    }
    
    let conexao;
    try {
        conexao = await conectar();
        
        // Verificar se o registro existe
        const [registroExistente] = await conexao.execute(
            'SELECT * FROM ranking_times_atual WHERE time_id = ?',
            [time_id]
        );
        
        if (registroExistente.length === 0) {
            return res.status(404).json({ message: 'Registro de ranking não encontrado para este time' });
        }
        
        // Construir dinamicamente os campos a serem atualizados
        const updateFields = [];
        const updateValues = [];
        
        if (pontos !== undefined && pontos !== null) {
            updateFields.push('pontos = ?');
            updateValues.push(pontos);
        }
        if (ranking_atual !== undefined && ranking_atual !== null) {
            updateFields.push('ranking_atual = ?');
            updateValues.push(ranking_atual);
        }
        if (trofeus !== undefined && trofeus !== null) {
            updateFields.push('trofeus = ?');
            updateValues.push(trofeus);
        }
        if (total_partidas !== undefined && total_partidas !== null) {
            updateFields.push('total_partidas = ?');
            updateValues.push(total_partidas);
        }
        if (vitorias !== undefined && vitorias !== null) {
            updateFields.push('vitorias = ?');
            updateValues.push(vitorias);
        }
        if (derrotas !== undefined && derrotas !== null) {
            updateFields.push('derrotas = ?');
            updateValues.push(derrotas);
        }
        if (wo !== undefined && wo !== null) {
            updateFields.push('wo = ?');
            updateValues.push(wo);
        }
        if (campeonatos_premier_cup !== undefined && campeonatos_premier_cup !== null) {
            updateFields.push('campeonatos_premier_cup = ?');
            updateValues.push(campeonatos_premier_cup);
        }
        if (campeonatos_liga_prime !== undefined && campeonatos_liga_prime !== null) {
            updateFields.push('campeonatos_liga_prime = ?');
            updateValues.push(campeonatos_liga_prime);
        }
        if (campeonatos_oficiais !== undefined && campeonatos_oficiais !== null) {
            updateFields.push('campeonatos_oficiais = ?');
            updateValues.push(campeonatos_oficiais);
        }
        if (campeonatos_comuns !== undefined && campeonatos_comuns !== null) {
            updateFields.push('campeonatos_comuns = ?');
            updateValues.push(campeonatos_comuns);
        }
        
        // Se não houver campos para atualizar, retornar erro
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Nenhum campo fornecido para atualização' });
        }
        
        // Adicionar time_id no final para o WHERE
        updateValues.push(time_id);
        
        // Executar a atualização
        await conexao.execute(
            `UPDATE ranking_times_atual SET ${updateFields.join(', ')} WHERE time_id = ?`,
            updateValues
        );
        
        res.status(200).json({ message: 'Ranking atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar ranking:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
        if (conexao) await desconectar(conexao);
    }
}



// --- DELETE RANKING





// ===============================================================================================

module.exports = {
    getPerfil, updateConfig, register, login, getMedalhas, criarMedalhas, addMedalhasuser, getMedalhasUsuario, deletarMedalhas, atualizarMedalhas, autenticar,
    getTimeById, getTimeByUser, deletarTime, transferirLideranca, listarMembrosParaLideranca, criarTime, atualizarTime, atualizarPosicaoMembro, removerMembro,
    solicitarEntradaTime, aceitarSolicitacao, rejeitarSolicitacao, verificarStatusSolicitacao, getTransferencias, criarTransferencia, deletarTransferencia,
    getSolicitacaoById, listarTodasSolicitacoes, buscarTimes, buscarUsuarios, listarSolicitacoesPorTime, aceitarSolicitacaoPorId, rejeitarSolicitacaoPorId, MembroSair, deletarSolicitacao,
    atualizarTransferencia, listarTimes, getplayers, buscarDadosFaceitPlayer, locationMatchesIds, infoMatchId, buscarInfoMatchId, uploadImagemCloudinary, criarTrofeus, buscarImgPosition, createImgPosition, updateImgPosition,
    listarTodosUsuarios, getEstatisticasUsuarios, atualizarGerenciaUsuario, getNoticiasDestaques, criarNoticiaDestaque, atualizarNoticiaDestaque, deletarNoticiaDestaque, getNoticiasSite, criarNoticiaSite, atualizarNoticiaSite, deletarNoticiaSite, getNoticiasCampeonato, criarNoticiaCampeonato, atualizarNoticiaCampeonato, deletarNoticiaCampeonato, getInscricoesCampeonato, getInscricoesTimes, criarInscricaoCampeonato, criarInscricaoTimes, atualizarInscricaoCampeonato, atualizarInscricaoTimes, deletarInscricaoTimes, CreatePreference,
    webhookMercadoPago, verificarStatusPagamento, retornoPagamentoSuccess, retornoPagamentoFailure, retornoPagamentoPending, addTrofeuTime, getTrofeus,getTrofeusTime, deletarTrofeus, atualizarTrofeus,
    criarChaveamento, getChaveamento, salvarResultadoPartida, inicializarPartidasChaveamento, resetarChaveamento, buscarImgMap, createImgMap, updateImgMap,
    criarSessaoVetos, buscarSessaoVetosPorToken, salvarAcaoVeto, salvarEscolhaLado, iniciarSessaoVetos, registrarCliqueRoleta, getHistoricoMembros, criarHistoricoMembros, atualizarHistoricoMembros, atualizarRankingTimes, criarRankingTimes, criarRankingTimesHistorico, getRankingTimes, getRankingTimesHistorico,steamIdFromUrl,statuscs,buscarTimeGame,buscarInfoMatchIdStatus, buscarInfoMatchIdStats,buscarStatusplayer,enviarCodigoEmail,verificarCodigoEmail,setupDatabase, autenticacao, logout
};
