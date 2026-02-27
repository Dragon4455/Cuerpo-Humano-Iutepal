async function cargarEInteractuar(url, contenedorId) {
    try {
        const respuesta = await fetch(url);
        const codigoSvg = await respuesta.text();
        const contenedor = document.getElementById(contenedorId);
        contenedor.innerHTML = codigoSvg;

        // Buscamos todos los elementos dentro del SVG que tengan un ID que empiece con "SD_"
        const organos = contenedor.querySelectorAll('[id^="SD_"]');

        organos.forEach(elemento => {
            elemento.style.cursor = "pointer";
            
            elemento.addEventListener('click', async () => {
                const idActivo = elemento.id;
                
                // CONSULTA DINÁMICA A LA BD
                try {
                    const res = await fetch(`http://localhost:3000/api/organo/${idActivo}`);
                    const data = await res.json();

                    if (!data.error) {
                        procesarInformacion(idActivo, data);
                    } else {
                        console.warn("Este elemento no tiene descripción en la BD.");
                    }
                } catch (err) {
                    console.error("Error conectando con la API:", err);
                }
            });
        });

    } catch (error) {
        console.error("Error cargando el SVG:", error);
    }
}

function procesarInformacion(id, data) {
    // Aquí puedes abrir un modal, cambiar un texto lateral, etc.
    alert(`Órgano: ${data.nombre}\nInfo: ${data.descripcion}`);
}

cargarEInteractuar('assets/assets/digestivo.svg', 'svg-container');