// URL base da API
// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'mikedcf.github.io';
let avatar = '';

// =================================
// ========= NOTIFICATIONS =========

const icons = {
    success: "✔️",
    alert: "⚠️",
    error: "❌",
    info: "ℹ️"
};

function showNotification(type, message, duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) {
        console.error("Elemento #notificationContainer não encontrado.");
        // Fallback: usar alert se o container não existir
        alert(message);
        return;
    }

    const notif = document.createElement("div");
    notif.classList.add("notification", type);
    notif.innerHTML = `
      <span class="icon">${icons[type] || ""}</span>
      <span>${message}</span>
      <div class="progress"></div>
    `;

    container.appendChild(notif);
    notif.querySelector(".progress").style.animationDuration = duration + "ms";

    setTimeout(() => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    }, duration);
}


function showUserNotification(type, message, userPhoto, duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) {
        console.error("Elemento #notificationContainer não encontrado.");
        // Fallback: usar alert se o container não existir
        alert(message);
        return;
    }
    
    const notif = document.createElement("div");
    notif.classList.add("notification", type, "with-user");
    notif.innerHTML = `
      <img src="${userPhoto}" alt="User">
      <span class="icon">${icons[type] || ""}</span>
      <span>${message}</span>
      <div class="progress"></div>
    `;

    container.appendChild(notif);
    notif.querySelector(".progress").style.animationDuration = duration + "ms";

    setTimeout(() => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    }, duration);
}



// =============================================================
// ====================== [ autenticação ] ======================

async function autenticacao() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
}

async function verificar_auth() {
    const auth_dados = await autenticacao();
    document.getElementById('btnPagamento').style.display = 'none';

    if (auth_dados && auth_dados.logado) {
        const userId = auth_dados.usuario.id;
        const perfil_data = await buscarDadosPerfil(userId);

        const menuPerfilLink = document.getElementById('menuPerfilLink');
        const menuTimeLink = document.getElementById('menuTimeLink');
        document.getElementById('notaPagamento').style.display = "none";

        document.getElementById("userPerfil").style.display = "flex";
        document.getElementById("userAuth").style.display = "none";
        document.getElementById("perfilnome").textContent = auth_dados.usuario.nome;
        document.getElementById("ftPerfil").src = perfil_data.perfilData.usuario.avatar_url;
        menuTimeLink.href = `team.html?id=${auth_dados.usuario.time}`;

        if (menuPerfilLink) {
            menuPerfilLink.href = `perfil.html?id=${userId}`;
        }

        const gerenciarCamp = document.getElementById("gerenciarCamp");
        if (perfil_data.perfilData.usuario.organizador == 'premium') {
            gerenciarCamp.style.display = 'flex';
            gerenciarCamp.href = `gerenciar_campeonato.html`;
        }
        else {
            gerenciarCamp.style.display = 'none';
        }

        document.getElementById('btnPagamento').style.display = 'block';
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        showNotification('success', 'Deslogado...', 1500);
        setTimeout(() => {
            document.getElementById("userPerfil").style.display = "none";
            document.getElementById("userAuth").style.display = "flex";
            verificar_auth();
        }, 1500);
    } catch (error) {
        console.error('Erro na requisição:', error);
        showNotification('error', 'Erro ao deslogar.', 1500);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// =================================
// ========= BUSCAR DADOS DO PERFIL =========
async function buscarDadosPerfil(userId) {
    try {
            const perfilResponse = await fetch(`${API_URL}/perfil/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!perfilResponse.ok) {
                throw new Error('Erro ao buscar dados do perfil.');
            }

            const perfilData = await perfilResponse.json();
            return { perfilData };
        
    
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return { perfilData: null };
    }
}

async function buscarTimesInscritos(cardId){
    try{
        const response = await fetch(`${API_URL}/inscricoes/times`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
                const data = await response.json();
        return data;
    }
    catch(error){
        console.error('Erro ao buscar times inscritos:', error);
        return { times: null };
    }
}


async function getMedalhas() {
    const cardDados = await getCardDados();
    const medalId = cardDados.inscricoes[0].medalha_id
    
    try {
        const response = await fetch(`${API_URL}/medalhas/${medalId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar medalhas:', error);
        return false;
    }
}


async function getCardDados() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar notícias de destaque:', error);
        return [];
    }

}


// =============================================================
// ========= BOTAO DE PAGAMENTO =========


let idsMembros = []
async function btnPagamento(){

    params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    


    const logado = await autenticacao();
    const lider = await verificarSeELider();
    const cards = await getCardDados();
    await iniciarPagamentoMercadoPago()

    
    
    if(logado.logado){
        const dados = await buscarDadosPerfil(logado.usuario.id);
        if(lider){
            const timeId = dados.perfilData.usuario.time_id
            
            dadosMembros = await topullMembersTime(timeId)
            if(dadosMembros.length >= 0){
                for(const membro of dadosMembros){
                    idsMembros.push(membro.usuario_id)
                }
                const linksVerify = await verificarLinksAuth(idsMembros);
                if (linksVerify.res == true){
                    for(const card of cards.inscricoes){
                        if(card.id == cardId){
                            console.log(card.preco_inscricao);
                            if(card.preco_inscricao > 0){
                                PagementoFree()
                                return;
                            }
                            else{
                                await iniciarPagamentoMercadoPago()
                                return;
                            }
                
                        }
                    }
                }
                else{

                    let usuarios = [];

                    for(const user of linksVerify){
                        usuarios.push(user.username);
                    }
                    
                    showNotification('error', 'A membros faltando preencher os links das redes steam e faceit.!', 3000);
                    showNotification('alert', `Os membros que estão faltando são: ${usuarios.join(', ')}`);
                    return;
                }
            }
            else{
                showNotification('error', 'A line do Time não esta completa.');
                return;
            }
        } 
        else
        {
            showNotification('error', 'Você não é o líder do time, portanto não pode realizar o pagamento e a inscrição.');
            return;
        }
    }
    else{
        showNotification('error', 'Você precisa estar logado para realizar a inscrição.');
        return;
    }


    
    
}


async function verificarLinksAuth(dadosMembros){
    let verify = [];
    let notRegister = [];


    
    for(const id of dadosMembros){
        const dados = await buscarDadosPerfil(id);
        if(dados.perfilData.redesSociais.length == 0){
            notRegister.push(id);
        }
        else{

            if(!dados.perfilData.redesSociais.steam_url == null || !dados.perfilData.redesSociais.steam_url == undefined || !dados.perfilData.redesSociais.steam_url == ''){
                notRegister.push(id);
            }
    
            if(!dados.perfilData.redesSociais.faceit_url == null || !dados.perfilData.redesSociais.faceit_url == undefined || !dados.perfilData.redesSociais.faceit_url == ''){
                notRegister.push(id);
            }
        }

        
    }
    
    if(notRegister.length > 0){
        for (const id of notRegister){
            const dados = await buscarDadosPerfil(id);
            let data = {
                res:false,
                user_id: id,
                username: dados.perfilData.usuario.username,
                msg: 'Não registrado redes steam ou faceit'
            }
            verify.push(data);
        }

        return verify;
    }
    else{
        let data = {
            res:true
        }
        return data;
    }
}

// ----- VERIFICAR SE USUÁRIO É LÍDER DO TIME  // TODO: SISTEMA DE PAGAMENTO
async function verificarSeELider() {

    try {
        const auth_dados = await autenticacao();
        if (auth_dados.logado) {
            const userId = auth_dados.usuario.id;
            const perfilData = await buscarDadosPerfil(userId);
            const timeId = perfilData.perfilData.usuario.time_id;
            const response = await fetch(`${API_URL}/times/${timeId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const liderTime = data.time.lider_id;

                return data.time && data.time.lider_id == userId;
            }
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar liderança:', error);
        return false;
    }
}



async function salvarMembroHistorico(timeId){
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');

    const dadosMembros = await topullMembersTime(timeId);
    
    const MembrosRegistrados = await buscarMembrosjaRegistrados()
    if(!MembrosRegistrados.historico.length){
        for(const membro of dadosMembros){
            // await registerMembroHistorico(timeId,membro.usuario_id, membro.posicao) 
        }
        

    }


    for (const membros of MembrosRegistrados.historico){
        
        if(membros.campeonato_id == cardId){
            if(membros.time_id == timeId){

                for(const membro of dadosMembros){
                    if(membro.usuario_id == membros.usuario_id){
                        return 
                    }
                    else{
                        console.log('foi registrado os membros')
                        
                        registerMembroHistorico(timeId,membro.usuario_id, membro.posicao)
                            
                        
                    }
                }
            }
        }
    }
    

}


async function buscarMembrosjaRegistrados(){
    try{
        const response = await fetch(`${API_URL}/inscricoes/historicoMembros`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const result = await response.json();
        return result;
    }
    catch(error){
        console.error('Erro ao registrar membro no histórico:', error);
    }

}



async function registerMembroHistorico(timeId,userId,posicao){
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    try{
        const response = await fetch(`${API_URL}/inscricoes/historicoMembros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ campeonato_id: cardId, usuario_id: userId, time_id: timeId, posicao: posicao })
        });
        const result = await response.json();
        console.log(result);
    }
    catch(error){
        console.error('Erro ao registrar membro no histórico:', error);
    }
}
// =================================
// ========= VERIFICAR TIME DO USUÁRIO =========
async function verificarTimeUsuario() {
    const auth_dados = await autenticacao();
    try {
        if (auth_dados.logado) {
            const userId = auth_dados.usuario.id;
            const response = await fetch(`${API_URL}/times/by-user/${userId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.time) {
                    // Usuário tem time - mostrar "Meu Time"
                    atualizarMenuTime(true, data.time.id);
                } else {
                    // Usuário não tem time - mostrar "Criar Time"
                    atualizarMenuTime(false);
                }
            } else {
                // Erro ou usuário não tem time
                atualizarMenuTime(false);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar time do usuário:', error);
        atualizarMenuTime(false);
    }
}


function atualizarMenuTime(temTime, timeId = null) {
    const menuTimeLink = document.getElementById('menuTimeLink');
    const menuTimeText = document.getElementById('menuTimeText');

    if (temTime && timeId) {
        // Usuário tem time - link para página do time
        menuTimeLink.href = `team.html?id=${timeId}`;
        menuTimeText.textContent = 'Meu Time';
        menuTimeLink.onclick = null; // Remove onclick se existir
    } else {
        // Usuário não tem time - abrir modal de criação
        menuTimeLink.href = '#';
        menuTimeText.textContent = 'Criar Time';
        menuTimeLink.onclick = function (e) {
            e.preventDefault();
            abrirModalCriarTime();
        };
    }
}


async function topullMembersTime(timeId) {
    try {

        
        const response = await fetch(`${API_URL}/times/${timeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar status do pagamento');
        }

        const data = await response.json();
        return data.membros;

    }
    catch (error) {
        console.error('Erro ao buscar status do pagamento:', error);
        return false;
    }

}



// =================================
// ========= SISTEMA DE PAGAMENTO =========

async function PagementoFree(){
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');

    const logado = await autenticacao();
    const userId = logado.usuario.id;

    

    const dadosUsuario = await buscarDadosPerfil(userId);
    const timeId = dadosUsuario.perfilData.usuario.time_id;

    try{
        const dados = {
            cardId,
            timeId
        };

        const response = await fetch(`${API_URL}/inscricoes/times`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        const result = await response.json();
        showNotification('success', 'Pagamento realizado com sucesso!');
        
        return true;
    }
    catch(error){
        console.error('Erro ao realizar o pagamento:', error);
        return false;
    }
}


// Função principal para iniciar o pagamento
async function iniciarPagamentoMercadoPago() {
    
    try {
        const cardData = await getCardDados();
        if(cardData.inscricoes[0].tipo == 'comum'){

            const confirm = await showConfirmModal('Esse campeonato não e oficial, o Mixcamp não se responsabiliza por qualquer problema que possa ocorrer sobre campeonatos não oficiais.');
            if(!confirm){
                return;
            }
        }  
       
        
        showNotification('info', 'Redirecionando para o pagamento...');

        // Criar preferência e obter URL
        const preferenceData = await createPreference();

        if (!preferenceData || !preferenceData.preference_url) {
            throw new Error('Não foi possível criar a preferência de pagamento');
        }

        // Redirecionar para o link do Mercado Pago
        // window.location.href = preferenceData.preference_url;
        window.open(preferenceData.preference_url, '_blank');


    } catch (error) {
        console.error('Erro ao iniciar pagamento:', error);
        showNotification('error', error.message || 'Erro ao processar pagamento. Tente novamente.');
    }
}


async function dadoscardPagamento() {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');

    const dados = await getCardDados();

    if (!dados || !dados.inscricoes) {
        console.error('Erro: Dados de inscrições não encontrados');
        return null;
    }

    for (let i = 0; i < dados.inscricoes.length; i++) {
        if (dados.inscricoes[i].id == cardId) {
            const titulo = dados.inscricoes[i].titulo || 'Inscrição em Campeonato';
            const preco = parseFloat(dados.inscricoes[i].preco_inscricao) || 0;

            const data = {
                title: String(titulo).trim(),
                quantity: 1,
                unit_price: preco
            };
            

            return data;
        }
    }

    console.error('Erro: Campeonato não encontrado com ID:', cardId);
    return null;
}

async function createPreference() {
    
    try {
        const dados = await dadoscardPagamento();
        

        if (!dados || !dados.title || !dados.unit_price) {
            throw new Error('Não foi possível obter os dados do campeonato');
        }
        

        // Garantir que o título não esteja vazio
        const title = dados.title.trim() || 'Inscrição em Campeonato';
        const quantity = parseInt(dados.quantity) || 1;
        const unit_price = parseFloat(dados.unit_price) || 0;

        if (!title || unit_price <= 0) {
            throw new Error('Dados inválidos para criar preferência');
        }

        // Obter cardId e timeId
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('id');

        const logado = await autenticacao();
        const userId = logado.usuario.id;
        const dadosUsuario = await buscarDadosPerfil(userId);
        const timeId = dadosUsuario.perfilData.usuario.time_id;

        const items = {
            title: title,
            quantity: quantity,
            unit_price: unit_price,
            cardId: cardId,
            timeId: timeId
        };

       

        const apiBase = API_URL.replace('/api/v1', '');
        const response = await fetch(`${apiBase}/create_preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(items),
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar preferência');
        }

        const data = await response.json();

        return {
            preference_id: data.preference_id,
            preference_url: data.preference_url
        };
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        showNotification('error', 'Erro ao processar pagamento. Tente novamente.');
        throw error;
    }
}


async function statusAprovado() {
    try {
        const response = await fetch(`${API_URL}/inscricoes/times`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar status do pagamento');
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar status do pagamento:', error);
        return false;
    }
}

async function verificarStatusAprovado() {
    
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');

    const pagamento = await statusAprovado();
    
    const logado = await autenticacao();
    if (logado.logado){
        
        const userId = logado.usuario.id;
    
        const dados_user = await buscarDadosPerfil(userId);
        if (dados_user == undefined) {
            return
        }
        const timeId = dados_user.perfilData.usuario.time_id;
        
        if(!pagamento.inscricoes.length == 0){
           
            for (let i = 0; i < pagamento.inscricoes.length; i++) {
                if (pagamento.inscricoes[i].inscricao_id == cardId) {
                    if (pagamento.inscricoes[i].time_id == timeId) {
        
                        // Atualizar quantidade de times inscritos
                        showNotification('success', 'Inscrição confirmada com sucesso!');
                        await salvarMembroHistorico(timeId);
        
                        return true;
                    }
                }
            }
        
            return false;
        }
        else{
            await salvarMembroHistorico(timeId);
        }
    }
    else{
        return false;
    }

}


async function atualizarTimesInscritos(cardId, totalTimes) {
    const quantidade = await verificarQuantidadeEquipesInscritas(cardId);

    const resumoTimesInscritos = document.getElementById('resumoTimesInscritos');
    if (resumoTimesInscritos) {
        resumoTimesInscritos.textContent = `${quantidade}/${totalTimes}`;
    }

    if (quantidade == totalTimes) {
        document.getElementById('btnPagamento').style.display = "none";

        try {
            const response = await fetch(`${API_URL}/inscricoes/campeonato/atualizar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: cardId, status: "encerrado" })
            });

            console.log('Status da inscrição de campeonato atualizado');
            document.getElementById('inscricaoStatus').style.background = 'linear-gradient(135deg,rgb(255, 93, 53),rgb(255, 66, 66))';
            if (notifyOff == true) {
                showNotification('success', 'Inscrição já foi encerrada!');
                notifyOff = false;
            }
        }
        catch (error) {
            console.error('Erro ao adicionar troféu:', error);
        }
    }
    return quantidade;
}

// Verificar status do pagamento ao retornar do Mercado Pago
async function verificarRetornoPagamento() {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const paymentId = params.get('payment_id');
    const preferenceId = params.get('preference_id');
    const cardId = params.get('id'); // ID do campeonato

    if (paymentStatus) {
        // Preservar o ID do campeonato na URL
        const newUrl = window.location.pathname + (cardId ? `?id=${cardId}` : '');
        window.history.replaceState({}, '', newUrl);

        if (paymentStatus === 'success') {
            showNotification('success', 'Pagamento aprovado! Sua inscrição está sendo processada...', 5000);

            // Verificar status do pagamento no backend
            if (paymentId) {
                try {
                    const response = await fetch(`${API_URL}/mercadopago/status?payment_id=${paymentId}`);
                    const data = await response.json();

                    if (data.status === 'approved') {
                        showNotification('success', 'Inscrição confirmada com sucesso!', 5000);

                        // Atualizar quantidade de times inscritos
                        const totalTimes = parseInt(document.getElementById('inscricaoQntTimes')?.textContent) || 0;
                        if (cardId) {
                            atualizarTimesInscritos(cardId, totalTimes);
                        }

                        // Recarregar a página após alguns segundos para atualizar dados
                        setTimeout(() => {
                            if (cardId) {
                                window.location.href = `inscricao.html?id=${cardId}`;
                            } else {
                                window.location.reload();
                            }
                        }, 3000);
                    }
                } catch (error) {
                    console.error('Erro ao verificar status:', error);
                }
            } else {
                // Se não temos payment_id, aguardar webhook processar
                showNotification('info', 'Aguardando confirmação do pagamento...', 5000);
            }
        } else if (paymentStatus === 'failure') {
            showNotification('error', 'Pagamento não foi aprovado. Tente novamente.', 5000);
        } else if (paymentStatus === 'pending') {
            showNotification('info', 'Pagamento pendente. Aguardando confirmação...', 5000);
        }
    }
}


async function verificarQuantidadeEquipesInscritas(cardId) {
    let quantidade = 0;
    try {
        const dados = await statusAprovado();
        if (!dados || !dados.inscricoes) {
            return 0;
        }

        // Filtrar apenas as inscrições do campeonato atual
        for (let i = 0; i < dados.inscricoes.length; i++) {
            if (dados.inscricoes[i].inscricao_id == cardId) {
                quantidade += 1;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar quantidade de equipes inscritas:', error);
        return 0;
    }

    return quantidade;
}


const intervaloVerificacao = setInterval(async () => {
    const aprovado = await verificarStatusAprovado();
    if (aprovado) {
        clearInterval(intervaloVerificacao); // para o loop quando aprovado
    }
    

    // Atualizar quantidade de times inscritos periodicamente
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    if (cardId) {
        const totalTimes = parseInt(document.getElementById('inscricaoQntTimes')?.textContent) || 0;
        await atualizarTimesInscritos(cardId, totalTimes);
    }
}, 1000);

// ================================= // TODO: CSS da pesquisa
// ========= SISTEMA =========

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}


// Variável para armazenar a função de fechar, para poder removê-la depois
let fecharPesquisaHandler = null;

function abrirBarraPesquisa() {
    const header = document.querySelector('.header');
    const searchBarContainer = document.getElementById('searchBarContainer');
    const searchToggle = document.getElementById('searchToggle');

    // Se já existe um handler, remove antes de adicionar um novo
    if (fecharPesquisaHandler) {
        document.removeEventListener('click', fecharPesquisaHandler);
        fecharPesquisaHandler = null;
    }

    // Alterna a classe 'search-active' no header
    header.classList.toggle('search-active');

    // Se a barra de busca estiver ativa, foca no input
    if (header.classList.contains('search-active')) {
        const searchInput = searchBarContainer.querySelector('.search-input');
        searchInput.focus();
        
        // Cria função para fechar ao clicar fora
        fecharPesquisaHandler = function(event) {
            // Verifica se o clique foi fora do container de busca e do botão de busca
            if (!searchBarContainer.contains(event.target) && 
                !searchToggle.contains(event.target)) {
                // Fecha a barra de busca
                header.classList.remove('search-active');
                // Remove o listener após fechar
                document.removeEventListener('click', fecharPesquisaHandler);
                fecharPesquisaHandler = null;
            }
        };
        
        // Adiciona o listener após um pequeno delay para não fechar imediatamente ao abrir
        setTimeout(() => {
            document.addEventListener('click', fecharPesquisaHandler);
        }, 100);
    } else {
        // Se fechou, remove o listener se existir
        if (fecharPesquisaHandler) {
            document.removeEventListener('click', fecharPesquisaHandler);
            fecharPesquisaHandler = null;
        }
    }
}

// Fechar menu quando clicar fora dele
document.addEventListener('click', function (event) {
    const menu = document.querySelector('#menuOpcoes');
    const perfilBtn = document.querySelector('.perfil-btn');

    if (perfilBtn && menu && !perfilBtn.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});


window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


// Função para adicionar efeito de scroll progressivo
function addScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #ff6b35, #ff8c42);
        z-index: 10001;
        transition: width 0.1s ease;
    `;

    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });
}


// Função para formatar data
async function formatarData(dataISO) {
    if (!dataISO) return 'Data não disponível';

    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return 'Data inválida';

        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
}


// =================================
// ========= DADOS CARD CAMPEONATOS =========

let notify = true;

async function verificarInscricaoTime(){

    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    desabilitarbotao();
    
    
    const authDados = await autenticacao();
    if(authDados.logado){
        const userId = authDados.usuario.id;
        const dadosUsuario = await buscarDadosPerfil(userId);
        const timeId = dadosUsuario.perfilData.usuario.time_id;
        const dadosTimeInscritos = await buscarTimesInscritos(cardId);
        
        
        for(const inscricao of dadosTimeInscritos.inscricoes){
            if(inscricao.time_id == timeId){
                if(inscricao.inscricao_id == cardId){
                    if(notify){
                        showNotification('success', 'Seu time já está inscrito neste campeonato', 3000);
                        notify = false;
                        desabilitarbotao()
                        
                    }
                }
            }
        }
    }
}

function desabilitarbotao(){
    if(notify == false){
        document.getElementById('btnPagamento').style.display = 'none';

    }
}


async function atualizarPagina(){
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');

    const cardData = await getCardDados();

    for (const card of cardData.inscricoes){
        if(card.id == cardId){
            

            const dataCreate = await formatarData(card.data);
            const dataPrevisao = await formatarData(card.previsao_data_inicio);
            

            // header da pagina
            document.getElementById('inscricaoImagem').src = card.imagem_url;
            document.getElementById('inscricaoTitulo').textContent = card.titulo;
            document.getElementById('inscricaoDescricao').textContent = card.descricao;
            document.getElementById('inscricaoTipo').textContent = card.tipo.toUpperCase();
            


            // INFORMAÇÕES GERAIS


            document.getElementById('inscricaoAutor').textContent = card.organizador_nome;
            document.getElementById('inscricaoData').textContent = dataCreate;
            document.getElementById('inscricaoPrevisao').textContent = dataPrevisao;
            document.getElementById('inscricaoFormato').textContent = card.formato;
            document.getElementById('inscricaoGame').textContent = card.game;
            document.getElementById('inscricaoPremiacao').textContent = toBRL(card.premiacao);
            document.getElementById('inscricaoPreco').textContent = toBRL(card.preco_inscricao);
            document.getElementById('inscricaoEdicao').textContent = card.edicao_campeonato;
            document.getElementById('inscricaoNivel').textContent = card.nivel;
            document.getElementById('inscricaoPlataforma').textContent = card.plataforma;
            document.getElementById('inscricaoTransmissao').textContent = card.transmissao;
            document.getElementById('inscricaoQntTimes').textContent = card.qnt_times;
            document.getElementById('inscricaoRegras').textContent = card.regras;

            // TROFEU E MEDALHA

            if (card.trofeu_iframe_url){
                
                document.getElementById('inscricaoTrofeu').src = card.trofeu_iframe_url;
                document.getElementById('inscricaoNomeTrofeu').textContent = card.nome_trofeu
    
                document.getElementById('inscricaoMedalha').src = card.medalha_iframe_url;
                document.getElementById('inscricaoNomeMedalha').textContent = card.nome_medalha;
            }
            else{
                document.getElementById('midiasCard').style.display = 'none';
            }



            // RESUMO
            
            
            
            document.getElementById('resumoPreco').textContent = toBRL(card.preco_inscricao);
            document.getElementById('resumoPremiacao').textContent = toBRL(card.premiacao);
            document.getElementById('resumoPrevisao').textContent = dataPrevisao;


            // section organizador
            

            document.getElementById('organizadorLogo').src = card.organizador_avatar;
            document.getElementById('organizadorNome').textContent = card.organizador_nome;
            document.getElementById('organizadorTipo').textContent = card.tipo;

            // Iniciar loop de atualização a cada 10 segundos
            iniciarAtualizacaoCard();
            // document.getElementById('btnPagamento').style.display = 'none';
            
        }
        else{
            const valor = '---'
        }
    }
}



async function DadosUpdateCard(card){

    const authDados = await autenticacao();

    const quantidade = await verificarQuantidadeEquipesInscritas(card.id);

    const resumoTimesInscritos = document.getElementById('resumoTimesInscritos');
    if (resumoTimesInscritos) {
        resumoTimesInscritos.textContent = `${quantidade}/${card.qnt_times}`;
    }

    const status = document.getElementById('inscricaoStatus')
    const boxStatus = document.getElementById('resumoCard')
    const btnPgamento = document.getElementById('btnPagamento')
    const btnChaveamento = document.getElementById('btnChaveamento')
    

    if(quantidade == card.qnt_times){
        atualizarStatusCard(card.id, 'encerrado');
    }

    if(authDados.logado){
        console.log(card.status);
        if(card.status == 'em breve'){
            status.textContent = 'Em Breve';
            status.style.backgroundColor = '#0373fc';
            boxStatus.style.backgroundColor = 'rgba(3, 115, 252, 0.42)';
            btnPgamento.style.display = 'none';
            btnChaveamento.style.display = 'none';
        }
        else if(card.status == 'disponivel'){
            status.textContent = 'Disponível';
            status.style.backgroundColor = '#28a745';
            boxStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.42)';
            btnPgamento.style.display = 'block';
            btnChaveamento.style.display = 'none';
        }
        else if(card.status == 'andamento'){
            status.textContent = 'Em Andamento';
            status.style.backgroundColor = 'rgb(146, 64, 9)';
            boxStatus.style.backgroundColor = 'rgba(252, 103, 3, 0.42)';
            btnChaveamento.style.display = 'flex';
        }
        else if(card.status == 'encerrado'){
            status.textContent = 'Encerrado';
            status.style.backgroundColor = '#fc0345';
            boxStatus.style.backgroundColor = 'rgba(252, 3, 69, 0.42)';
            btnPgamento.style.display = 'none';
            btnChaveamento.style.display = 'flex';
        }
        else if(card.status == 'cancelado'){
            status.textContent = 'Encerrado';
            status.style.backgroundColor = '#fc0345';
            boxStatus.style.backgroundColor = 'rgba(252, 3, 69, 0.42)';
            btnPgamento.style.display = 'none';
            btnChaveamento.style.display = 'none';
        }
    }
    else{
        btnPgamento.style.display = 'none';
        if(card.status == 'em breve'){
            status.textContent = 'Em Breve';
            status.style.backgroundColor = '#0373fc';
            boxStatus.style.backgroundColor = 'rgba(3, 115, 252, 0.42)';
            btnChaveamento.style.display = 'none';
        }
        else if(card.status == 'disponivel'){
            status.textContent = 'Disponível';
            status.style.backgroundColor = '#28a745';
            boxStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.42)';
            btnChaveamento.style.display = 'none';
        }
        else if(card.status == 'andamento'){
            status.textContent = 'Em Andamento';
            status.style.backgroundColor = 'rgb(146, 64, 9)';
            boxStatus.style.backgroundColor = 'rgba(252, 103, 3, 0.42)';
            btnChaveamento.style.display = 'flex';
        }
        
        else if(card.status == 'encerrado'){
            status.textContent = 'Encerrado';
            status.style.backgroundColor = '#fc0345';
            boxStatus.style.backgroundColor = 'rgba(252, 3, 69, 0.42)';
            btnChaveamento.style.display = 'flex';
        }
        else if(card.status == 'cancelado'){
            status.textContent = 'Cancelado';
            status.style.backgroundColor = '#6b7280';
            boxStatus.style.backgroundColor = 'rgba(136, 136, 136, 0.42)';
            btnPgamento.style.display = 'none';
            btnChaveamento.style.display = 'none';
        }
    }

    document.getElementById('resumoStatus').textContent = card.status;
}


async function atualizarStatusCard(cardId, status){
    try {
        const response = await fetch(`${API_URL}/inscricoes/campeonato/atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: cardId, status: status })
        });
        console.log('Status do card atualizado');
    } catch (error) {
        console.error('Erro ao atualizar status do card:', error);
    }
}

// Loop para atualizar dados do card a cada 10 segundos
let intervaloUpdateCard = null;

async function iniciarAtualizacaoCard() {
    // Limpar intervalo anterior se existir
    if (intervaloUpdateCard) {
        clearInterval(intervaloUpdateCard);
    }

    // Executar imediatamente na primeira vez
    await atualizarDadosCard();

    // Configurar intervalo para executar a cada 10 segundos
    intervaloUpdateCard = setInterval(async () => {
        await atualizarDadosCard();
    }, 10000); // 10000 milissegundos = 10 segundos
}

async function atualizarDadosCard() {
    try {
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('id');
        
        if (!cardId) {
            return;
        }

        const cardData = await getCardDados();
        
        for (const card of cardData.inscricoes) {
            if (card.id == cardId) {
                await DadosUpdateCard(card);
                await verificarInscricaoTime();
                break;
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar dados do card:', error);
    }
}


// Função para criar slide automático de medalhas
function iniciarSlideMedalhas(medalhaData) {
    const iframeWrapper = document.querySelector('#inscricaoMedalha').parentElement;
    const iframeOriginal = document.getElementById('inscricaoMedalha');
    
    if (!medalhaData || !medalhaData[0]) {
        return;
    }
    
    const medalha = medalhaData[0];
    const iframeUrls = [];
    
    // Adiciona URLs disponíveis
    if (medalha.iframe_url_campeao) {
        iframeUrls.push({ url: medalha.iframe_url_campeao, tipo: 'Campeão' });
    }
    if (medalha.iframe_url_segundo) {
        iframeUrls.push({ url: medalha.iframe_url_segundo, tipo: 'Segundo' });
    }
    
    // Se não houver URLs, não faz nada
    if (iframeUrls.length === 0) {
        return;
    }
    
    // Se houver apenas uma URL, mostra ela diretamente
    if (iframeUrls.length === 1) {
        iframeOriginal.src = iframeUrls[0].url;
        return;
    }
    
    // Se houver duas ou mais URLs, cria o slide
    let currentIndex = 0;
    let slideInterval = null;
    
    // Função para alternar iframe
    function alternarIframe() {
        iframeOriginal.src = iframeUrls[currentIndex].url;
        currentIndex = (currentIndex + 1) % iframeUrls.length;
    }
    
    // Função para iniciar o slide
    function iniciarSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
        slideInterval = setInterval(alternarIframe, 5000);
    }
    
    // Função para pausar o slide
    function pausarSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    // Inicia com o primeiro iframe
    alternarIframe();
    
    // Inicia o slide automático
    iniciarSlide();
    
    // Pausa o slide quando o mouse está sobre o iframe
    iframeWrapper.addEventListener('mouseenter', pausarSlide);
    
    // Retoma o slide quando o mouse sai
    iframeWrapper.addEventListener('mouseleave', iniciarSlide);
}
// =================================
// ========= SISTEMA DE BUSCA =========
// =================================
// Função principal de busca
async function buscarTimesEPlayers(termo) {
    if (termo.length < 2) {
        esconderResultados();
        return;
    }

    try {
        // Buscar times e players em paralelo
        const [timesResponse, playersResponse] = await Promise.all([
            fetch(`${API_URL}/times/search?search=${encodeURIComponent(termo)}`),
            fetch(`${API_URL}/usuarios/search?search=${encodeURIComponent(termo)}`)
        ]);

        const timesData = await timesResponse.json();
        const playersData = await playersResponse.json();

        // Mostrar resultados
        mostrarResultados({
            times: timesData.times || [],
            players: playersData.usuarios || [],
            termo: termo
        });

    } catch (error) {
        console.error('Erro na busca:', error);
        showNotification('error', 'Erro ao buscar. Tente novamente.');
    }
}

// Mostrar resultados na tela
function mostrarResultados(dados) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    const { times, players, termo } = dados;
    const totalResultados = times.length + players.length;

    if (totalResultados === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>Nenhum resultado encontrado para "${termo}"</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="search-results-header">
            <h3>Resultados para "${termo}" (${totalResultados})</h3>
        </div>
        <div class="search-results-content">
    `;

    // Times
    if (times.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-users"></i> Times (${times.length})</h4>
                <div class="search-items">
        `;

        times.forEach(time => {
            html += `
                <div class="search-item" onclick="irParaTime(${time.id})">
                    <img src="${time.avatar_time_url || '../img/cs2.png'}" alt="${time.nome}" class="search-avatar">
                    <div class="search-info">
                        <h5>${time.nome}</h5>
                        <p>${time.tag} • ${time.membros_count} membros</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    // Players
    if (players.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-user"></i> Players (${players.length})</h4>
                <div class="search-items">
        `;

        players.forEach(player => {
            html += `
                <div class="search-item" onclick="irParaPlayer(${player.id})">
                    <img src="${player.avatar_url || '../img/cs2.png'}" alt="${player.username}" class="search-avatar">
                    <div class="search-info">
                        <h5>${player.username}</h5>
                        <p>${player.time_tag} ${player.time_nome ? '• ' + player.time_nome : '(Sem time)'}</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    container.style.display = 'block';
}

// Esconder resultados
function esconderResultados() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
    }
}

// Navegar para página do time
function irParaTime(timeId) {
    window.location.href = `team.html?id=${timeId}`;
}

// Navegar para perfil do player
function irParaPlayer(playerId) {
    window.location.href = `perfil.html?id=${playerId}`;
}


// BOTÃO DE CHAVEAMENTO
function irParaChaveamento() {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    window.location.href = `chaveamento.html?id=${cardId}`;
}
// =================================
// ========= INITIALIZATION =========
// =================================

document.addEventListener('DOMContentLoaded', function () {
    verificar_auth();
    verificarTimeUsuario();
    atualizarPagina();
    
    // verystatusCard();
});

// Conectar input de busca
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-input');

    if (searchInput) {
        let timeoutId;

        searchInput.addEventListener('input', function () {
            clearTimeout(timeoutId);
            const termo = this.value.trim();

            // Debounce: aguarda 300ms após parar de digitar
            timeoutId = setTimeout(() => {
                buscarTimesEPlayers(termo);
            }, 300);
        });

        // Esconder resultados ao clicar fora
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-bar-container')) {
                esconderResultados();
            }
        });
    }
});

// Adicionar barra de progresso
addScrollProgress();







// =================================================================
// SOMENTE PARA PAGAMENTO

// Configure sua chave pública do Mercado Pago
// const publicKey = "APP_USR-424d52fa-bca8-4793-b49e-6fcd521e9173";
// Configure o ID de preferência que você deve receber do seu backend
let preferenceId = "YOUR_PREFERENCE_ID";



// =================================================================



// Formata moeda BRL
function toBRL(v) {
    if (v === null || v === undefined || v === '') return '—';
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    if (isNaN(n)) return v;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata data/hora
function formatDateTime(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Função para redirecionar para a página de chaveamento
function irParaChaveamento() {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('id');
    
    if (cardId) {
        window.location.href = `chaveamento.html?id=${cardId}`;
    } else {
        showNotification('error', 'ID do campeonato não encontrado');
    }
}

// Adicionar efeito de brilho e hover ao botão de chaveamento
document.addEventListener('DOMContentLoaded', function() {
    // Criar animação CSS para o efeito de brilho
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shimmer {
            0% {
                background-position: -200% center;
            }
            100% {
                background-position: 200% center;
            }
        }
        
        .btn-chaveamento {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(138, 43, 226, 0.7)) !important;
            background-size: 200% auto !important;
        }
        
        .btn-chaveamento::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
            );
            background-size: 200% 100%;
            animation: shimmer 3s infinite;
            pointer-events: none;
            z-index: 1;
        }
        
        .btn-chaveamento > * {
            position: relative;
            z-index: 2;
        }
    `;
    document.head.appendChild(style);
    
    const btnChaveamento = document.getElementById('btnChaveamento');
    if (btnChaveamento) {
        // Adicionar classe para aplicar o efeito
        btnChaveamento.classList.add('btn-chaveamento');
        
        btnChaveamento.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(138, 43, 226, 0.5)';
            this.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 1), rgba(138, 43, 226, 0.8))';
        });
        
        btnChaveamento.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.3)';
            this.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(138, 43, 226, 0.7))';
        });
    }
});




