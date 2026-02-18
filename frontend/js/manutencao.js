// =============================================================
// ====================== [ ANIMAÇÕES GSAP ] ===================
// =============================================================

// Controle do vídeo de fundo (6 segundos)
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('maintenanceVideo');
    if (video) {
        // Configurar o vídeo para reiniciar após 6 segundos
        function resetVideo() {
            video.currentTime = 0;
        }
        
        // Adicionar event listener para reiniciar após 6 segundos
        video.addEventListener('timeupdate', function() {
            if (video.currentTime >= 6) {
                video.currentTime = 0;
            }
        });
        
        // Garantir que o vídeo está em loop
        video.loop = true;
    }
});

// Função para verificar se GSAP está carregado
function waitForGSAP(callback) {
    if (typeof gsap !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForGSAP(callback), 100);
    }
}

// Aguardar o carregamento completo da página e GSAP
window.addEventListener('load', function() {
    waitForGSAP(function() {
        // Pequeno delay para garantir que o DOM está totalmente renderizado
        setTimeout(function() {
            console.log('GSAP carregado, iniciando animações...');
            
            // Timeline principal
            const mainTimeline = gsap.timeline();

            // Configurar estados iniciais com force3D para melhor performance
            gsap.set('#maintenanceIcon', { 
                opacity: 0, 
                scale: 0, 
                rotation: -180,
                force3D: true
            });
            gsap.set('#maintenanceSubtitle', { 
                opacity: 0, 
                y: 30,
                force3D: true
            });
            gsap.set('#maintenanceMessage', { 
                opacity: 0, 
                y: 30,
                force3D: true
            });
            gsap.set('#progressContainer', { 
                opacity: 0, 
                scaleX: 0,
                transformOrigin: 'center',
                force3D: true
            });

        // Animação do Ícone
        mainTimeline.to('#maintenanceIcon', {
            duration: 1,
            scale: 1,
            rotation: 0,
            opacity: 1,
            ease: 'back.out(1.7)',
            force3D: true,
            immediateRender: false
        });

            // Animação do Título - Letra por letra
            const word1Element = document.getElementById('word1');
            if (word1Element) {
                const titleText = word1Element.textContent.trim();
                word1Element.textContent = '';
                
                titleText.split('').forEach((char, index) => {
                    const span = document.createElement('span');
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    span.style.display = 'inline-block';
                    span.style.color = '#ffffff';
                    span.style.textShadow = '0 0 40px rgba(255, 107, 53, 0.8), 0 0 80px rgba(255, 107, 53, 0.6), 0 0 120px rgba(255, 107, 53, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.5)';
                    word1Element.appendChild(span);
                    
                    gsap.set(span, { opacity: 0, y: 50, scale: 0.5 });
                    
                    mainTimeline.to(span, {
                        duration: 0.15,
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        ease: 'back.out(1.7)'
                    }, index * 0.08);
                });
            }

            // Animação do Subtítulo
            mainTimeline.to('#maintenanceSubtitle', {
                duration: 0.8,
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                force3D: true,
                immediateRender: false
            }, '-=0.5');

            // Animação da Mensagem
            mainTimeline.to('#maintenanceMessage', {
                duration: 0.8,
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                force3D: true,
                immediateRender: false
            }, '-=0.4');

            // Animação da Barra de Progresso Container
            mainTimeline.to('#progressContainer', {
                duration: 0.8,
                scaleX: 1,
                opacity: 1,
                ease: 'power2.out',
                force3D: true,
                immediateRender: false
            }, '-=0.3');

            // Configurar estado inicial da barra de progresso
            gsap.set('#progressBar', { width: '0%' });
            
            // Animação da barra de progresso - finaliza em 6 segundos e reinicia
            function animateProgressBar() {
                gsap.to('#progressBar', {
                    width: '100%',
                    duration: 6,
                    ease: 'power1.inOut',
                    force3D: true,
                    onComplete: function() {
                        // Reiniciar a barra
                        gsap.set('#progressBar', { width: '0%' });
                        animateProgressBar();
                    }
                });
            }
            
            mainTimeline.call(animateProgressBar, null, '-=0.2');

            // Animação das partículas
            const particles = document.querySelectorAll('.particle');
            particles.forEach((particle, index) => {
                gsap.set(particle, { opacity: 0.6 });
                gsap.to(particle, {
                    duration: 3 + Math.random() * 2,
                    x: '+=100',
                    y: '+=100',
                    rotation: 360,
                    opacity: 0.3,
                    scale: 1.5,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    delay: index * 0.2
                });
            });

            // Animação de pulso no ícone
            gsap.to('#maintenanceIcon', {
                scale: 1.1,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut'
            });

            // Animação de flutuação no título
            gsap.to('.title-word', {
                y: -10,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });

        }, 100); // Delay de 100ms
    });
});

// Fallback: Se GSAP não carregar, tornar elementos visíveis após 2 segundos
setTimeout(function() {
    const icon = document.getElementById('maintenanceIcon');
    const title = document.getElementById('maintenanceTitle');
    const word1 = document.getElementById('word1');
    const subtitle = document.getElementById('maintenanceSubtitle');
    const message = document.getElementById('maintenanceMessage');
    const progressContainer = document.getElementById('progressContainer');
    
    if (icon && (icon.style.opacity === '0' || window.getComputedStyle(icon).opacity === '0')) {
        icon.style.opacity = '1';
        icon.style.transform = 'scale(1) rotate(0deg)';
    }
    
    // Garantir que o título MIXCAMP seja visível
    if (title) {
        title.style.opacity = '1';
        title.style.visibility = 'visible';
    }
    
    if (word1) {
        word1.style.opacity = '1';
        word1.style.visibility = 'visible';
        word1.style.color = '#ffffff';
        // Se não tiver spans criados, garantir que o texto original seja visível
        if (word1.children.length === 0 && word1.textContent.trim() === '') {
            word1.textContent = 'MIXCAMP';
        }
        // Tornar todos os spans visíveis
        const spans = word1.querySelectorAll('span');
        spans.forEach(span => {
            span.style.opacity = '1';
            span.style.visibility = 'visible';
            span.style.color = '#ffffff';
        });
    }
    
    if (subtitle && (subtitle.style.opacity === '0' || window.getComputedStyle(subtitle).opacity === '0')) {
        subtitle.style.opacity = '1';
        subtitle.style.transform = 'translateY(0)';
    }
    if (message && (message.style.opacity === '0' || window.getComputedStyle(message).opacity === '0')) {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
    }
    if (progressContainer && (progressContainer.style.opacity === '0' || window.getComputedStyle(progressContainer).opacity === '0')) {
        progressContainer.style.opacity = '1';
        progressContainer.style.transform = 'scaleX(1)';
    }
}, 2000);
