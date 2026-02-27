const sistemas = [
    { nombre: "Esquelético", color: "#f8fafc", desc: "Soporte óseo y protección de órganos vitales.", img:"/static/sistemaesqueletico.png", },
    { nombre: "Muscular", color: "#f43f5e", desc: "Permite el movimiento voluntario e involuntario.", img: "/static/sistemamusculo.png" },
    { nombre: "Cardiovascular", color: "#ef4444", desc: "Transporte de nutrientes y oxígeno vía sanguínea.", img: "/static/sistemacardio.png" },
    { nombre: "Digestivo", color: "#fbbf24", desc: "Procesamiento de alimentos y absorción de energía.", img: "/static/sistemadigestivo.png", url: "digestivo.html" },
    { nombre: "Respiratorio", color: "#06b6d4", desc: "Intercambio de gases en los alvéolos pulmonares.", img: "/static/sistemarespi.png",url: "respiratorio.html"  },
    { nombre: "Endocrino", color: "#a855f7", desc: "Regulación química mediante hormonas.", img: "/static/sistemaendocri.png" },
    { nombre: "Urinario", color: "#10b981", desc: "Excreción de desechos y equilibrio electrolítico.", img: "/static/sistemaurin.png" },
    { nombre: "Linfático", color: "#22c55e", desc: "Sistema inmunitario y drenaje de líquidos.", img: "/static/sistemalinf.png" },
    { nombre: "Tegumentario", color: "#f97316", desc: "Protección externa a través de la piel y anexos.", img: "/static/sistemategu.png" },
    { nombre: "Reproductor", color: "#f472b6", desc: "Producción de gametos y continuidad de la especie.", img: "/static/sistemareprd.png" }
];


const container = document.getElementById('app-container');
let isScrolling = false;

sistemas.forEach(sys => {
    const card = document.createElement('div');
    card.className = 'card';
    // Aplicamos el color dinámico al borde y sombra suave
    card.style.borderColor = `${sys.color}44`;
    card.style.setProperty('--glow-color', sys.color);

    card.innerHTML = `
        <div class="img-container">
            <img src="${sys.img}" alt="${sys.nombre}" class="sys-icon">
        </div>
        <div class="text-group">
            <h2 style="color: ${sys.color}">${sys.nombre}</h2>
            <p>${sys.desc}</p>
        </div>
    `;

    card.addEventListener('pointerup', () => {
        window.location.href = sys.url
        if (!isScrolling) {
            card.classList.remove('rotate-anim');
            void card.offsetWidth; 
            card.classList.add('rotate-anim');
        }
    });

    container.appendChild(card);
});


let scrollTimeout;
container.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => isScrolling = false, 150);
});

// Navegación
document.getElementById('nextBtn').onclick = () => container.scrollBy({ left: 320, behavior: 'smooth' });
document.getElementById('prevBtn').onclick = () => container.scrollBy({ left: -320, behavior: 'smooth' });