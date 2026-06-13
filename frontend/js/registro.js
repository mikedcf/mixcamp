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
        document.getElementById('userAuth').classList.remove('hidden');
        document.getElementById("registerBtn").style.display = "none";
        document.getElementById("loginBtn").style.background = "linear-gradient(135deg, #ff6b35 0%, #ff4500 100%)";


    }
}


// =================================
// ========= LÓGICA DE REGISTRO =========

let listdados = [];
const REGISTRO_PENDENTE_KEY = 'mixcamp_registro_pendente';
let configPublicaCache = null;

const SKIP_EMAIL_VERIFICACAO_DEV = false;

async function obterConfigPublica() {
    if (configPublicaCache) return configPublicaCache;
    try {
        const response = await fetch(`${API_URL}/config/public`);
        if (response.ok) {
            configPublicaCache = await response.json();
            return configPublicaCache;
        }
        console.warn('[registro] /config/public respondeu', response.status);
    } catch (error) {
        console.warn('Não foi possível carregar config pública:', error);
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(API_URL);
    configPublicaCache = {
        skip_email_verification: isLocal && SKIP_EMAIL_VERIFICACAO_DEV
    };
    return configPublicaCache;
}

function emailValidoParaRegistro(email, skipVerificacao) {
    if (skipVerificacao) {
        return email.includes('@') && email.includes('.');
    }
    const padroes = ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud'];
    for (const padrao of padroes) {
        if (email.includes('@') && email.includes('.com') && email.includes(padrao)) {
            return true;
        }
    }
    return false;
}

function salvarRegistroPendente(dados) {
    listdados = [dados];
    try {
        sessionStorage.setItem(REGISTRO_PENDENTE_KEY, JSON.stringify(dados));
    } catch (e) {
        console.warn('sessionStorage indisponível:', e);
    }
}

function obterRegistroPendente() {
    if (listdados.length > 0) return listdados[0];
    try {
        const raw = sessionStorage.getItem(REGISTRO_PENDENTE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Erro ao ler registro pendente:', e);
    }
    return null;
}

function limparRegistroPendente() {
    listdados = [];
    try {
        sessionStorage.removeItem(REGISTRO_PENDENTE_KEY);
    } catch (e) { /* ignore */ }
}

function termosAceitos() {
    return Boolean(document.getElementById('terms')?.checked);
}

function marcarErroTermos(mostrar) {
    const bloco = document.querySelector('.form-options');
    const erroHint = document.getElementById('termsErrorHint');
    const infoHint = document.getElementById('termsHint');
    if (bloco) bloco.classList.toggle('terms-error', mostrar);
    if (erroHint) erroHint.hidden = !mostrar;
    if (infoHint) infoHint.hidden = mostrar;
}

function avisarAceiteTermos() {
    marcarErroTermos(true);
    showNotification(
        'alert',
        'Para criar sua conta, marque a caixa aceitando os Termos de Uso e a Política de Privacidade.',
        6000
    );
    const bloco = document.querySelector('.form-options');
    bloco?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('terms')?.focus();
}

async function Registro(event) {
    event.preventDefault();

    if (!termosAceitos()) {
        avisarAceiteTermos();
        return;
    }

    marcarErroTermos(false);

    const form = document.getElementById('registerForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const username = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const dados = {
        username: username,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        aceite_termos: true
    };
    verificarDadosRegistro(dados);
}

async function verificarDadosRegistro(dados){
    if (!dados.aceite_termos) {
        avisarAceiteTermos();
        return;
    }

    const config = await obterConfigPublica();
    const skipEmail = config.skip_email_verification === true;

    const username = String(dados.username || '').trim();
    const email = String(dados.email || '').trim().toLowerCase();
    const password = dados.password;
    const confirmPassword = dados.confirmPassword;

    
    if (password !== confirmPassword) {
        validatePasswordMatch(true);
        return {'status': false, 'message': 'As senhas não coincidem verifique novamente'};
    }

    const verifyemail = emailValidoParaRegistro(email, skipEmail);
    
    
    const verifypassword = senhaAtendeTodosRequisitos(password);



    let verifyusername = false;
    if(username.length <= 16){
        verifyusername = true;
    }


    if (verifyemail){
        if(verifypassword){
            if(verifyusername){
                salvarRegistroPendente({ username, email, password, confirmPassword, aceite_termos: true });
                if (skipEmail) {
                    await RegistrarUsuario();
                    return;
                }
                enviarCodigoEmail(email);
                
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
        showNotification("error", 'Email inválido');
    }
}

const REENVIO_CODIGO_COOLDOWN_SEG = 60;
let emailResendIntervalId = null;

function pararContadorReenvioCodigo() {
    if (emailResendIntervalId) {
        clearInterval(emailResendIntervalId);
        emailResendIntervalId = null;
    }
}

function formatarTempoReenvio(segundosRestantes) {
    const min = Math.floor(segundosRestantes / 60);
    const sec = segundosRestantes % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function atualizarUiContadorReenvio(segundosRestantes) {
    const hint = document.getElementById('emailCodeResendHint');
    const btn = document.getElementById('btnReenviarCodigoEmail');
    if (!hint) return;

    if (segundosRestantes > 0) {
        hint.textContent = `Não recebeu o código? Aguarde ${formatarTempoReenvio(segundosRestantes)} para reenviar.`;
        if (btn) btn.disabled = true;
    } else {
        hint.textContent = 'Não recebeu o código? Você pode reenviar agora.';
        if (btn) btn.disabled = false;
    }
}

function iniciarContadorReenvioCodigo() {
    pararContadorReenvioCodigo();

    let segundosRestantes = REENVIO_CODIGO_COOLDOWN_SEG;
    atualizarUiContadorReenvio(segundosRestantes);

    emailResendIntervalId = setInterval(() => {
        segundosRestantes -= 1;
        if (segundosRestantes <= 0) {
            pararContadorReenvioCodigo();
            atualizarUiContadorReenvio(0);
            return;
        }
        atualizarUiContadorReenvio(segundosRestantes);
    }, 1000);
}

async function enviarCodigoEmail(email, opcoes = {}) {
    const { abrirModal = true, notificarSucesso = true } = opcoes;

    try {
        const response = await fetch(`${API_URL}/email/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            if (notificarSucesso) {
                showNotification('alert', data.message || 'Novo código enviado. Verifique sua caixa de entrada.');
            }
            if (abrirModal) {
                abrirModalCodigoEmail();
            } else {
                iniciarContadorReenvioCodigo();
            }
            return true;
        }
        if (response.status === 429) {
            showNotification('error', 'Muitas tentativas de envio. Aguarde cerca de 1 hora e tente novamente.');
        } else if (data.code === 'EMAIL_DOMAIN_NOT_VERIFIED') {
            showNotification('error', data.message || 'E-mail não pôde ser enviado. O domínio precisa estar verificado no Resend.');
        } else {
            showNotification('error', data.message || data.debug || 'Erro ao enviar código');
        }
        return false;
    } catch (error) {
        console.error('Erro de rede:', error);
        showNotification('error', 'Erro de conexão ao enviar o código.');
        return false;
    }
}

async function reenviarCodigoEmail() {
    const btn = document.getElementById('btnReenviarCodigoEmail');
    if (btn?.disabled) return;

    const pendente = obterRegistroPendente();
    if (!pendente?.email) {
        showNotification('error', 'Dados do cadastro não encontrados. Preencha o formulário novamente.');
        fecharModalCodigoEmail();
        return;
    }

    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const enviado = await enviarCodigoEmail(pendente.email, {
        abrirModal: false,
        notificarSucesso: true
    });

    btn.textContent = textoOriginal;

    if (enviado) {
        const input = document.getElementById('emailCodeInput');
        if (input) input.value = '';
    } else {
        atualizarUiContadorReenvio(0);
    }
}

async function verificarCodeEmail(){
    const code = String(document.getElementById('emailCodeInput')?.value || '').trim();
    const pendente = obterRegistroPendente();
    const email = pendente?.email || '';

    if (!email) {
        showNotification('error', 'Dados do cadastro não encontrados. Preencha o formulário novamente.');
        fecharModalCodigoEmail();
        return;
    }

    if (code === '') {
        showNotification('error', 'Insira o código de verificação');
        return;
    }

    if (!/^\d{6}$/.test(code)) {
        showNotification('error', 'O código deve ter 6 dígitos');
        return;
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
    modal.style.display = 'flex';
    iniciarContadorReenvioCodigo();
}

async function RegistrarUsuario(){
    const pendente = obterRegistroPendente();
    if (!pendente) {
        showNotification('error', 'Cadastro expirado. Preencha o formulário e verifique o e-mail novamente.');
        return;
    }

    const username = pendente.username;
    const email = pendente.email;
    const password = pendente.password;

    if (!pendente.aceite_termos) {
        showNotification('error', 'É necessário aceitar os Termos de Uso e a Política de Privacidade.');
        fecharModalCodigoEmail();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password, aceite_termos: true }),
        });

        const data = await response.json();

        if (response.ok) {
            limparRegistroPendente();
            showNotification('success', 'Registro bem-sucedido! Redirecionando...', 1500);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            if (data.error === 'EMAIL_NOT_VERIFIED') {
                showNotification('error', data.message || 'Verifique o e-mail antes de registrar.');
            } else {
                showNotification('error', data.message || 'Erro ao registrar');
            }
        }

    } catch (error) {
        console.error('Erro de rede:', error);
        showNotification("error", `${error}`);
    }

}



// Fecha a modal de código de e-mail
function fecharModalCodigoEmail() {
    pararContadorReenvioCodigo();
    const modal = document.getElementById('emailCodeModal');
    if (!modal) return;
    modal.style.display = 'none';
    const input = document.getElementById('emailCodeInput');
    if (input) input.value = '';
    const btn = document.getElementById('btnReenviarCodigoEmail');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Reenviar código';
    }
}



// =================================
// ========= SENHA — UX (requisitos, confirmação, olho) =========

const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,12}$/;
const passwordRevealTimers = {};

function avaliarRequisitosSenha(senha) {
    return {
        upper: /[A-Z]/.test(senha),
        lower: /[a-z]/.test(senha),
        digit: /\d/.test(senha),
        special: /[@$!%*?&]/.test(senha),
        length: senha.length >= 8 && senha.length <= 12
    };
}

function senhaAtendeTodosRequisitos(senha) {
    return SENHA_REGEX.test(senha);
}

function atualizarListaRequisitosSenha(senha) {
    const requisitos = avaliarRequisitosSenha(senha);
    document.querySelectorAll('#passwordRequirementsList li[data-req]').forEach((li) => {
        const key = li.getAttribute('data-req');
        const ok = Boolean(requisitos[key]);
        const icon = li.querySelector('i');
        li.classList.toggle('req-ok', ok);
        li.classList.toggle('req-pending', !ok);
        if (icon) {
            icon.className = ok ? 'fas fa-check' : 'fas fa-times';
        }
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const toggleBtn = input.parentElement.querySelector('.password-toggle i');
    if (!toggleBtn) return;

    if (passwordRevealTimers[inputId]) {
        clearTimeout(passwordRevealTimers[inputId]);
        passwordRevealTimers[inputId] = null;
    }

    input.type = 'text';
    toggleBtn.classList.remove('fa-eye');
    toggleBtn.classList.add('fa-eye-slash');

    passwordRevealTimers[inputId] = setTimeout(() => {
        input.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
        passwordRevealTimers[inputId] = null;
    }, 3000);
}

function validatePasswordMatch(showHint) {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmContainer = document.getElementById('confirmPasswordContainer')
        || confirmPassword?.closest('.input-container');
    const hint = document.getElementById('confirmPasswordHint');

    if (!password || !confirmPassword || !confirmContainer) {
        return true;
    }

    const valor = confirmPassword.value;

    if (valor.length === 0) {
        confirmContainer.classList.remove('input-valid', 'input-error');
        if (hint) {
            hint.textContent = '';
            hint.classList.remove('is-visible', 'match-ok', 'match-error');
        }
        return true;
    }

    const coincide = password.value === valor;

    confirmContainer.classList.toggle('input-valid', coincide);
    confirmContainer.classList.toggle('input-error', !coincide);

    if (showHint && hint) {
        hint.textContent = coincide
            ? 'Senhas coincidem'
            : 'As senhas não coincidem';
        hint.classList.add('is-visible');
        hint.classList.toggle('match-ok', coincide);
        hint.classList.toggle('match-error', !coincide);
    }

    return coincide;
}

let confirmPasswordDebounceTimer = null;

function initRegistroPasswordUx() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const passwordFormGroup = passwordInput?.closest('.form-group');

    if (passwordInput && passwordFormGroup) {
        const syncRequirements = () => {
            const valor = passwordInput.value;
            atualizarListaRequisitosSenha(valor);
            passwordFormGroup.classList.toggle('password-requirements-visible', valor.length > 0);
            if (confirmInput?.value.length > 0) {
                validatePasswordMatch(true);
            }
        };

        passwordInput.addEventListener('input', syncRequirements);
        passwordInput.addEventListener('focus', syncRequirements);
        syncRequirements();
    }

    if (confirmInput) {
        const onConfirmChange = () => {
            clearTimeout(confirmPasswordDebounceTimer);
            confirmPasswordDebounceTimer = setTimeout(() => {
                validatePasswordMatch(true);
            }, 400);
        };

        confirmInput.addEventListener('input', onConfirmChange);
        confirmInput.addEventListener('blur', () => validatePasswordMatch(true));
    }
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
    initRegistroPasswordUx();

    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', Registro);
    }

    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (termsCheckbox.checked) marcarErroTermos(false);
        });
    }

    const registerFormEl = document.querySelector('.register-form');
    if (registerFormEl) {
        registerFormEl.style.opacity = '0';
        registerFormEl.style.transform = 'translateY(20px)';

        setTimeout(() => {
            registerFormEl.style.transition = 'all 0.6s ease';
            registerFormEl.style.opacity = '1';
            registerFormEl.style.transform = 'translateY(0)';
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
document.addEventListener('DOMContentLoaded', async function () {
    addParticleEffects();
    addIconHoverEffects();
    const config = await obterConfigPublica();
    if (config.skip_email_verification) {
        console.info('[registro] Modo teste: verificação de e-mail desativada (SKIP_EMAIL_VERIFICATION)');
    }
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


