let previousSelected = null;

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
                    aplicarSeleccion(elemento, idActivo, data);

                } catch (err) {
                    console.error("Error de conexión o formato:", err);
                }
            });
        });

    } catch (error) {
        console.error("Error cargando el SVG:", error);
    }
}

function aplicarSeleccion(elemento, id, data) {
    // Quitar selección previa
    if (previousSelected && previousSelected !== elemento) {
        previousSelected.classList.remove('organ-active');
    }

    // Alternar selección
    const isActive = elemento.classList.toggle('organ-active');
    previousSelected = isActive ? elemento : null;

    // Actualizar panel lateral con la información recibida
    const nameEl = document.getElementById('org-name');
    const descEl = document.getElementById('org-desc');
    const infoCard = document.getElementById('info-card');

    if (nameEl) nameEl.textContent = data.nombre || id;
    if (descEl) descEl.textContent = data.descripcion || 'No hay descripción disponible.';

    // Pequeña animación en el panel para enfatizar el cambio
    if (infoCard) {
        infoCard.animate([
            { transform: 'translateY(6px)', opacity: 0.96 },
            { transform: 'translateY(0)', opacity: 1 }
        ], { duration: 220, easing: 'ease-out' });
    }
}



// function procesarInformacion(id, data) {
//     alert(`Órgano: ${data.nombre}\nInfo: ${data.descripcion}`);
// }




// async function cargarEInteractuar(url, contenedorId) {
//     try {
//         const respuesta = await fetch(url);
//         const codigoSvg = await respuesta.text();
//         const contenedor = document.getElementById(contenedorId);
//         contenedor.innerHTML = codigoSvg;

//         // Buscamos todos los elementos dentro del SVG que tengan un ID que empiece con "SD_"
//         const organos = contenedor.querySelectorAll('[id^="SD_"]');

//         organos.forEach(elemento => {
//             elemento.style.cursor = "pointer";

//             elemento.addEventListener('click', async (ev) => {
//                 const idActivo = elemento.id;

//                 // Consulta dinámica a la API para obtener información del órgano
//                 try {
//                     const res = await fetch(`http://localhost:3000/api/organo/${idActivo}`);
//                     const data = await res.json();

//                     if (!data.error) {
//                         aplicarSeleccion(elemento, idActivo, data);
//                     } else {
//                         console.warn("Este elemento no tiene descripción en la BD.");
//                     }
//                 } catch (err) {
//                     console.error("Error conectando con la API:", err);
//                 }
//             });
//         });

//     } catch (error) {
//         console.error("Error cargando el SVG:", error);
//     }
// }

