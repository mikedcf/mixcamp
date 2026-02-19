// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'mixcamp-production.up.railway.app';
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
// ===================== [ LÓGICA DE LOGIN ] =====================
// ------ AUTENTICAÇÃO DO USUARIO
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

        if (data.logado) {
            console.log(data.logado);
            // assim que o usuario logar, ele é redirecionado para a pagina home
            window.location.href = 'home.html';

        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showNotification('error', `${error}`);

    }
}


async function dados_e_Login(event) {
    event.preventDefault(); // 👈 evita reload da página

    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;

    const dados = { email, senha };

    try {
        const response = await fetch(`${API_URL}/login`, {

            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados),
        })

        const result = await response.json();

        if (response.ok) {
            // Primeiro, verifique se a sessão foi criada com sucesso no servidor
            const sessionCheck = await fetch(`${API_URL}/dashboard`, {
                method: 'GET',
                credentials: 'include'
            });

            const sessionData = await sessionCheck.json();

            if (sessionData.logado) {
                console.log(sessionData);

                showNotification("success", `Login bem-sucedido!`, duration=1900);
                showNotification("success", `Bem-vindo ao MixCamp ${sessionData.usuario.nome} <br> Redirecionando para a página inicial !`,duration=2000);

                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            }
        }
    }
    catch (error) {
    console.error('Erro na requisição:', error);
    showNotification("error", `${error}`);
}
}


// =============================================================
// ===================== [ RECUPERAÇÃO DE SENHA ] =====================

function mostrarModalRecuperacao(event) {
    event.preventDefault();
    
    const loginForm = document.getElementById('loginForm');
    const loginHeader = document.querySelector('.login-header');
    const registerLink = document.querySelector('.register-link');
    const recoveryForm = document.getElementById('recoveryForm');
    
    // Oculta o formulário de login
    if (loginForm) loginForm.style.display = 'none';
    if (loginHeader) loginHeader.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    
    // Mostra o formulário de recuperação
    if (recoveryForm) recoveryForm.style.display = 'block';
}

function voltarParaLogin(event) {
    event.preventDefault();
    
    const loginForm = document.getElementById('loginForm');
    const loginHeader = document.querySelector('.login-header');
    const registerLink = document.querySelector('.register-link');
    const recoveryForm = document.getElementById('recoveryForm');
    
    // Mostra o formulário de login
    if (loginForm) loginForm.style.display = 'block';
    if (loginHeader) loginHeader.style.display = 'block';
    if (registerLink) registerLink.style.display = 'block';
    
    // Oculta o formulário de recuperação
    if (recoveryForm) recoveryForm.style.display = 'none';
    
    // Limpa o campo de email de recuperação
    const recoveryEmail = document.getElementById('recoveryEmail');
    if (recoveryEmail) recoveryEmail.value = '';
}

async function enviarRecuperacaoSenha(event) {
    event.preventDefault();
    
    const email = document.getElementById('recoveryEmail').value;
    
    if (!email) {
        showNotification("error", "Por favor, insira seu email");
        return;
    }
    
    try {
        // Aqui você pode adicionar a chamada para a API de recuperação de senha
        // Por enquanto, apenas mostra uma mensagem
        showNotification("info", "Funcionalidade de recuperação de senha será implementada em breve");
        
        // Exemplo de como seria a chamada:
        /*
        const response = await fetch(`${API_URL}/password/recover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification("success", "Email de recuperação enviado! Verifique sua caixa de entrada.");
            setTimeout(() => {
                voltarParaLogin(event);
            }, 2000);
        } else {
            showNotification("error", data.message || "Erro ao enviar email de recuperação");
        }
        */
    } catch (error) {
        console.error('Erro ao enviar recuperação de senha:', error);
        showNotification("error", "Erro ao processar solicitação");
    }
}


// =============================================================
// ===================== [ SOCIAL LOGIN ] =====================

// Google login
function loginWithGoogle() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Login com Google - Implementar integração');
    }, 1500);
}

// Discord login
function loginWithDiscord() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Login com Discord - Implementar integração');
    }, 1500);
}


// =================================
// ========= ABIR MENU SUSPENSO =========

function abrirMenuSuspenso() {
    const menu = document.querySelector('#menuOpcoes');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

// Fechar menu quando clicar fora dele
document.addEventListener('click', function (event) {
    const menu = document.querySelector('#menuOpcoes');
    const perfilBtn = document.querySelector('.perfil-btn');

    if (!perfilBtn.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});



// =================================
// ========= SISTEMA DE PESQUISA =========


function abrirBarraPesquisa() {
    const header = document.querySelector('.header');
    const searchBarContainer = document.getElementById('searchBarContainer');

    // Alterna a classe 'search-active' no header
    header.classList.toggle('search-active');

    // Se a barra de busca estiver ativa, foca no input
    if (header.classList.contains('search-active')) {
        const searchInput = searchBarContainer.querySelector('.search-input');
        searchInput.focus();
    }
}


// =================================
// ========= ANIMAÇÕES =========
// Loading functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Input focus effects
document.querySelectorAll('.input-container input').forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function () {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Character animations
function animateCharacters() {
    const characters = document.querySelectorAll('.character');
    characters.forEach((char, index) => {
        char.style.animationDelay = `${index * 0.5}s`;
    });
}

window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // quando rolar 50px
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

// Initialize animations
document.addEventListener('DOMContentLoaded', function () {
    animateCharacters();
  
});


// =================================
// ========= STARTS =========
document.addEventListener('DOMContentLoaded', autenticacao);