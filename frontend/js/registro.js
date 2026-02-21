// =============================================================
// ====================== [ autenticação e logout ] ======================
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

        return data;

    } catch (error) {
        console.error('Erro na inicialização:', error);
        showNotification('error', `${error}`);

    }
}


async function verificar_auth() {
    const auth_dados = await autenticacao();


    if (auth_dados.logado) {
        window.location.href = 'home.html';
    }
    else {
        document.getElementById("userAuth").style.display = "flex";
        document.getElementById("registerBtn").style.display = "none";
        document.getElementById("loginBtn").style.background = "linear-gradient(135deg, #ff6b35 0%, #ff4500 100%)";


    }
}


// =================================
// ========= LÓGICA DE REGISTRO =========

let listdados = [];

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
                listdados.push({username, email, password, confirmPassword});
                enviarCodigoEmail(email);
                
                // RegistrarUsuario();
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

async function enviarCodigoEmail(email){
    

    try{
        const response = await fetch(`${API_URL}/email/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("alert", `${data.message}`);
            abrirModalCodigoEmail();
            
            
        }
        else{
            showNotification("error", `${data.message}`);
        }
    }
    catch(error){
        console.error('Erro de rede:', error);
        showNotification("error", `${error}`);
    }
}

async function verificarCodeEmail(){
    const codeInput = document.getElementById('emailCodeInput').value;
    const code = codeInput;
    let email = '';

    if(code == ''){
        showNotification("error", `Insira o código de verificação`);
        return;
    }

    for(const dados of listdados){
        email = dados.email;
        
    }

    try{
        const response = await fetch(`${API_URL}/email/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, codigo: code }),
        });

        const data = await response.json();

        if (response.ok) {
            fecharModalCodigoEmail();
            RegistrarUsuario();
        }
        else{
            showNotification("error", `${data.message}`);
        }
    }
    catch(error){
        console.error('Erro de rede:', error);
        showNotification("error", `${error}`);
    }
    
    

}

// Abre a modal onde o usuário vai digitar o código enviado por e-mail
async function abrirModalCodigoEmail() {
    const modal = document.getElementById('emailCodeModal');
    if (!modal) {
        console.error('Elemento #emailCodeModal não encontrado.');
        return;
    }
    modal.style.display = 'flex'; // ou 'block', depende do seu CSS
    return 
}

async function RegistrarUsuario(){


    const username = listdados[0].username;
    const email = listdados[0].email;
    const password = listdados[0].password;
    
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


verificar_auth();


