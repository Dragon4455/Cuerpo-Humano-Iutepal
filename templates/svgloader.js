export async function cargarEInteractuar(url, sistema, contenedorId) {
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo cargar el archivo SVG");
        
        const codigoSvg = await respuesta.text();
        const contenedor = document.getElementById(contenedorId);
        contenedor.innerHTML = codigoSvg;

        // Seleccionamos elementos cuyo ID empiece por "S" (ej: SD_estomago, SO_femur)
        const organos = contenedor.querySelectorAll('[id^="S"]');

        organos.forEach(elemento => {
            elemento.style.cursor = "pointer";
            
            elemento.addEventListener('click', async () => {
                const idActivo = elemento.id;
                
                try {
                    // 1. Verificamos que 'sistema' tenga valor antes de disparar el fetch
                    if (!sistema) {
                        console.error("Error: El nombre del sistema no ha sido definido.");
                        return;
                    }
                    console.log(idActivo)
                    const res = await fetch(`http://localhost:3000/api/${sistema}/${idActivo}`);
                    
                    // 2. IMPORTANTE: Validar si la respuesta es OK antes del .json()
                    if (!res.ok) {
                        const errorTexto = await res.text(); // Leemos el error como texto
                        console.error(`Error del servidor (${res.status}):`, errorTexto);
                        return; // Salimos para no intentar el JSON.parse
                    }

                    const data = await res.json();
                    procesarInformacion(idActivo, data);

                } catch (err) {
                    console.error("Error de conexión o formato:", err);
                }
            });
        });

    } catch (error) {
        console.error("Error cargando el SVG:", error);
    }
}

function procesarInformacion(id, data) {
    alert(`Órgano: ${data.nombre}\nInfo: ${data.descripcion}`);
}