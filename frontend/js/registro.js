// const API_URL = 'http://127.0.0.1:3000/api/v1';
const API_URL = 'https://mixcamp-production.up.railway.app/api/v1';

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




// =================================
// ========= LÓGICA DE REGISTRO =========

let listdados = [];

async function verificarDadosRegistro(dados){
    const username = dados.username;
    const email = dados.email;
    const password = dados.password;
    const confirmPassword = dados.confirmPassword;

    
    if (password !== confirmPassword) {
        return {'status': false, 'message': 'As senhas não coincidem verifique novamente'};
    }

    let verifyemail = false;
    const padroes = ['gmail','hotmail','outlook','yahoo','icloud']

    for(const padrao of padroes){

        if (email.includes("@") && email.includes(".com") && email.includes(padrao)) {
            verifyemail = true; 
        }
    }
    
    
    let verifypassword = false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,12}$/;
    let validacao = regex.test(password)

    if (validacao == true) {
        verifypassword = true;
    }



    let verifyusername = false;
    if(username.length <= 16){
        verifyusername = true;
    }


    if (verifyemail){
        if(verifypassword){
            if(verifyusername){
                showNotification("success", `Codigo de verificação enviado verifique seu e-mail`);
                listdados.push({username, email, password, confirmPassword});
                RegistrarUsuario();
                return;
            }
            else{
                showNotification("error", `Username inválido, o username deve ter no máximo 16 caracteres`);
            }
        }
        else{
            showNotification("error", `Senha inválida, a senha deve ter no mínimo 8 caracteres, no máximo 12 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial`);
        }
    }
    else{
        showNotification("error", `Email inválido`);
    }
}



async function Registro(event) {
    event.preventDefault();

    const username = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const dados = {
        username: username,
        email: email,
        password: password,
        confirmPassword: confirmPassword
    }
    verificarDadosRegistro(dados);
}


// async function enviarCodigoEmail(email){

//     try{
//         const response = await fetch(`${API_URL}/email/register`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ email }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//             showNotification("success", `${data.message}`);
//             abrirModalCodigoEmail();
//         }
//         else{
//             showNotification("error", `${data.message}`);
//         }
//     }
//     catch(error){
//         console.error('Erro de rede:', error);
//         showNotification("error", `${error}`);
//     }
// }

// async function verificarCodeEmail(){
//     const code = await abrirModalCodigoEmail();

//     console.log(code);
//     let email = '';

//     if(code == ''){
//         showNotification("error", `Insira o código de verificação`);
//         return;
//     }

//     for(const dados of listdados){
//         email = dados.email;
        
//     }

//     try{
//         const response = await fetch(`${API_URL}/email/verify-code`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ email, codigo: code }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//             showNotification("success", `${data.message}`);
//             RegistrarUsuario();
//         }
//         else{
//             showNotification("error", `${data.message}`);
//         }
//     }
//     catch(error){
//         console.error('Erro de rede:', error);
//         showNotification("error", `${error}`);
//     }
    
    

// }

async function RegistrarUsuario(){
    const dados = listdados[0];
    const username = dados.username;
    const email = dados.email;
    const password = dados.password;
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            if (response.ok) {

                showNotification("success", `Registro bem-sucedido! Redirecionando...`, 1500);

                // Espera a notificação sumir antes do redirect
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        } else {
            showNotification("error", `${data.message}`);
        }

    } catch (error) {
        console.error('Erro de rede:', error);
        showNotification("error", `${error}`);
    }

}



// Abre a modal onde o usuário vai digitar o código enviado por e-mail
async function abrirModalCodigoEmail() {
    
    
    const modal = document.getElementById('emailCodeModal');
    const codeInput = document.getElementById('emailCodeInput');
    if (!modal) {
        console.error('Elemento #emailCodeModal não encontrado.');
        return;
    }
    modal.style.display = 'flex'; // ou 'block', depende do seu CSS
    return codeInput.value;
}

// Fecha a modal de código de e-mail
function fecharModalCodigoEmail() {
    const modal = document.getElementById('emailCodeModal');
    if (!modal) return;
    modal.style.display = 'none';
}



// =================================
// ========= PASSWORD TOGGLE =========

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.parentElement.querySelector('.password-toggle i');

    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}


function validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmContainer = confirmPassword.closest('.input-container');

    if (confirmPassword.value.length > 0) {
        if (password.value === confirmPassword.value) {
            confirmContainer.classList.add('valid');
            confirmContainer.classList.remove('error');
            return true;
        } else {
            confirmContainer.classList.remove('valid');
            confirmContainer.classList.add('error');
            return false;
        }
    }
    return true;
}

// =================================
// ========= FORM SUBMISSION =========

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}


// =================================
// ========= ANIMATIONS =========

// Add entrance animation to form
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.register-form');
    if (form) {
        form.style.opacity = '0';
        form.style.transform = 'translateY(20px)';

        setTimeout(() => {
            form.style.transition = 'all 0.6s ease';
            form.style.opacity = '1';
            form.style.transform = 'translateY(0)';
        }, 300);
    }

    // Add entrance animation to logo
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.opacity = '0';
        logo.style.transform = 'scale(0.8)';

        setTimeout(() => {
            logo.style.transition = 'all 0.8s ease';
            logo.style.opacity = '1';
            logo.style.transform = 'scale(1)';
        }, 100);
    }
});

// =================================
// ========= PARTICLE EFFECTS =========

// Add random movement to particles
function addParticleEffects() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        // Add random delay and duration
        const randomDelay = Math.random() * 10;
        const randomDuration = 15 + Math.random() * 10;

        particle.style.animationDelay = `${randomDelay}s`;
        particle.style.animationDuration = `${randomDuration}s`;
    });
}

// Add hover effects to floating icons
function addIconHoverEffects() {
    const icons = document.querySelectorAll('.floating-icon');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.2) rotate(360deg)';
            this.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.6)';
        });

        icon.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

// Initialize effects
document.addEventListener('DOMContentLoaded', function () {
    addParticleEffects();
    addIconHoverEffects();
});

// =================================
// ========= BACKGROUND EFFECTS =========

// Remove parallax effect since there's no scroll
// window.addEventListener('scroll', function() {
//     const scrolled = window.pageYOffset;
//     const backgroundBanner = document.querySelector('.background-banner');

//     if (backgroundBanner) {
//         backgroundBanner.style.transform = `translateY(${scrolled * 0.5}px)`;
//     }
// });

// Add mouse movement effect to floating icons
document.addEventListener('mousemove', function (e) {
    const icons = document.querySelectorAll('.floating-icon');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    icons.forEach((icon, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - 0.5) * speed * 20;
        const y = (mouseY - 0.5) * speed * 20;

        icon.style.transform += ` translate(${x}px, ${y}px)`;
    });
});


// =================================
// ========= ABRIR BARRA DE PESQUISA (HEADER) =========
// Variável para armazenar o handler de fechamento, para poder removê-lo depois
let fecharPesquisaHandler = null;

function abrirBarraPesquisa() {
    const header = document.querySelector('.header');
    const searchBarContainer = document.getElementById('searchBarContainer');
    const searchToggle = document.getElementById('searchToggle');

    if (!header || !searchBarContainer || !searchToggle) return;

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
        if (searchInput) {
            searchInput.focus();
        }

        // Cria função para fechar ao clicar fora
        fecharPesquisaHandler = function (event) {
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
