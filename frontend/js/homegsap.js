/**
 * Home (index): apenas GSAP — ScrollSmoother, ScrollTrigger, timeline do hero.
 * Interações gerais / carrosséis: ../js/script.js
 */
gsap.registerPlugin(ScrollTrigger,ScrollSmoother,SplitText);


// cria o smooth primeiro
const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.2,
    effects: true,
    normalizeScroll: true
});

/**
 * Com ScrollSmoother, o scroll “real” não é o window — `window.scrollY` fica ~0.
 * O efeito do header (largura 100% + .header.scrolled em header.css) depende dessa classe.
 * ScrollTrigger não expõe evento "scroll" global; o ticker lê smoother.scrollTop() a cada frame
 * e só atualiza o DOM quando o valor muda.
 */
let _lastHeaderScrollY = -1;
function syncHeaderScrolledForHome() {
    const header = document.querySelector("#mainHeader") || document.querySelector(".header");
    if (!header) return;
    const y = smoother.scrollTop();
    if (y === _lastHeaderScrollY) return;
    _lastHeaderScrollY = y;
    header.classList.toggle("scrolled", y > 50);
}
gsap.ticker.add(syncHeaderScrolledForHome);


const slides = gsap.utils.toArray(".slide");
const logo = document.querySelector(".content-fixed img");
const agentesPrincipais = document.querySelector(".fixed-image img");
const texto = document.querySelector(".content-texto");
const texto2 = document.querySelector(".content-texto p");
const texto3 = document.querySelector(".content-texto-text2");
const subtitulo = document.querySelector(".content-texto-subtitulo");


const buttonSobre = document.querySelector(".content-fixed-button:nth-child(1)");
const buttonCampeonatos = document.querySelector(".content-fixed-button:nth-child(2)");

/** Mobile/tablet: menos translateY no último texto para não colidir com os botões (layout em coluna no CSS). */
const mqHeroMobile = typeof window !== "undefined"
    ? window.matchMedia("(max-width: 640px)")
    : { matches: false };
const mqHeroTablet = typeof window !== "undefined"
    ? window.matchMedia("(max-width: 900px)")
    : { matches: false };
const texto3Y = mqHeroMobile.matches ? 0 : (mqHeroTablet.matches ? 48 : 150);



// ------------- PRE-SETS -------------
gsap.set(slides,{
    opacity: 0,

})

gsap.set(slides[0], {
    opacity: 1,
});

gsap.set(texto, {
    opacity: 0,
})

gsap.set(texto3, {
    opacity: 0,
})

gsap.set(buttonSobre, {
    opacity: 0,
})

gsap.set(buttonCampeonatos, {
    opacity: 0,
})


// ------------- TIMELINE -------------




const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-section",
        start: "top 0px",
        end: "+=3000",
        scrub: 1,
        pin: true,
        anticipatePin: 1
    }
});


// ------------- ANIMATION SLIDE 1 -------------


tl.to(slides[0], {
    opacity: 0,
    duration: 1
});

tl.to(logo, {
    opacity: 0,
    y: -40,
    duration: 0.5
}, 0.05);

tl.to(subtitulo, {
    opacity: 0,
    y: 40,
    duration: 0.5
}, 0.05);


// ------------- ANIMATION SLIDE 2 -------------

tl.to(agentesPrincipais, {
    opacity: 1,
    y: 50,
    
    ease: "power2.out",
    duration: 1
}, 0.5);

tl.to(slides[1], {
    opacity: 1,
    duration: 1
}, "<");

tl.to(agentesPrincipais, {
    opacity: 1,
    y: -50,
    scale: 1.1,
    
    ease: "power2.out",
    duration: 1
}, 0.5);

tl.to(slides[1], {
    opacity: 0,
    duration: 1
}, "+=0.5");



tl.to(slides[2], {
    opacity: 1,
    duration: 1
}, "<");

tl.to(agentesPrincipais, {
    opacity: 1,
    y: 50,
    
    ease: "power2.out",
    duration: 1
}, 0.5);


tl.to(texto, {
    opacity: 1,
    y: 50,
    
    ease: "power2.out",
    duration: 1
}, 0.5);

// ------------- ANIMATION SLIDE 3 -------------

tl.to(texto2, {
    opacity: 0,
    y: 50,
    
    ease: "power2.out",
    duration: 1
}, 1.8);


tl.to(texto3, {
    opacity: 1,
    y: texto3Y,
    
    ease: "power2.out",
    duration: 1
}, 2.5);

tl.to(logo, {
    opacity: 1,
    y: -40,
    duration: 0.5
}, 3.3);


tl.to(buttonSobre,{
    opacity: 1,
    x: 20,
    
    ease: "power2.out",
    duration: 1
}, 3.3);

tl.to(buttonCampeonatos,{
    opacity: 1,
    x: -20,
    
    ease: "power2.out",
    duration: 1
}, 3.3);






