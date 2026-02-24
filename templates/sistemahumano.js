const sistemas = [
    { nombre: "Óseo", color: "#e2e8f0", icon: "M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" },
    { nombre: "Muscular", color: "#f43f5e", icon: "M13,8.5H11V6.5H13V8.5M13,13H11V11H13V13M13,17.5H11V15.5H13V17.5M22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12Z" },
    { nombre: "Circulatorio", color: "#ef4444", icon: "M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.41,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.59,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" },
    { nombre: "Digestivo", color: "#f59e0b", icon: "M12,2C13,2 14,3 14,3.5C14,4 13,4 12,4C11,4 10,4 10,3.5C10,3 11,2 12,2M7,7H17V9H7V7M7,11H17V13H7V11M7,15H17V17H7V15Z" },
    { nombre: "Nervioso", color: "#3b82f6", icon: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,17V12H7V10H12V7L17,12L12,17Z" },
    { nombre: "Respiratorio", color: "#0ea5e9", icon: "M12,2L9,5H11V10H13V5H15L12,2M8,13C8,15.21 9.79,17 12,17C14.21,17 16,15.21 16,13V11H8V13Z" },
    { nombre: "Excretor", color: "#10b981", icon: "M12,2L4,5V11C4,16.55 7.84,21.74 12,23C16.16,21.74 20,16.55 20,11V5L12,2Z" },
    { nombre: "Endocrino", color: "#8b5cf6", icon: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" },
    { nombre: "Linfático", color: "#22c55e", icon: "M12,2C11.31,2 10.64,2.13 10.03,2.37C10.21,3.41 10.42,4.45 10.66,5.5C11.09,5.18 11.53,5 12,5C13.1,5 14,5.9 14,7C14,8.1 13.1,9 12,9C10.9,9 10,8.1 10,7C10,6.75 10.05,6.5 10.13,6.28C8.94,5.8 7.76,5.29 6.58,4.78C6.2,5.7 6,6.68 6,7.7C6,11.14 8.24,14.05 11.32,15L12,22L12.68,15C15.76,14.05 18,11.14 18,7.7C18,4.55 15.31,2 12,2Z" },
    { nombre: "Inmune", color: "#f472b6", icon: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M11,7V13H13V7H11M11,15V17H13V15H11Z" }
];

const container = document.getElementById('app-container');

sistemas.forEach(sys => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderColor = sys.color;
    card.style.boxShadow = `0 10px 30px ${sys.color}15`;

    card.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path fill="${sys.color}" d="${sys.icon}" />
        </svg>
        <span style="color: ${sys.color}">${sys.nombre}</span>
    `;

    card.addEventListener('click', () => {
        // Reiniciar animación
        card.classList.remove('rotate-anim');
        void card.offsetWidth; // Truco de reflow
        card.classList.add('rotate-anim');
    });

    container.appendChild(card);
});