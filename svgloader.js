async function cargarEInteractuar(url, contenedorId) {
    try {
        const respuesta = await fetch(url);
        const codigoSvg = await respuesta.text();
        const contenedor = document.getElementById(contenedorId);
        contenedor.innerHTML = codigoSvg;

        // Build a generated local data map from SVG (id -> readable name)
        const organos = contenedor.querySelectorAll('[id^="SD_"]');
        const generated = {};
        organos.forEach(el => {
            let name = el.getAttribute('data-name') || el.getAttribute('title') || el.getAttribute('aria-label') || '';
            if (!name) {
                const titleChild = el.querySelector && el.querySelector('title');
                if (titleChild) name = titleChild.textContent.trim();
            }
            if (!name) {
                // try element text content or nearby text element
                const txt = (el.textContent || '').trim();
                if (txt) name = txt.split('\n')[0].trim();
                else if (el.parentElement) {
                    const nearby = el.parentElement.querySelector('text');
                    if (nearby) name = (nearby.textContent||'').trim().split('\n')[0].trim();
                }
            }
            if (!name) name = el.id;
            generated[el.id] = { nombre: name, descripcion: 'Descripción no disponible localmente.' };
        });
        // expose generated map so other scripts can use it
        window.localOrganDataGenerated = Object.assign({}, window.localOrganDataGenerated || {}, generated);

        organos.forEach(elemento => {
            elemento.style.cursor = "pointer";
            
            elemento.addEventListener('click', async () => {
                const idActivo = elemento.id;
                // First try local fallback data if provided
                if (window.localOrganData && window.localOrganData[idActivo]) {
                    procesarInformacion(idActivo, window.localOrganData[idActivo]);
                    return;
                }
                // Next try generated labels from the SVG itself
                if (window.localOrganDataGenerated && window.localOrganDataGenerated[idActivo]) {
                    procesarInformacion(idActivo, window.localOrganDataGenerated[idActivo]);
                    return;
                }

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
                    console.warn("Error conectando con la API, intentando fallback local.", err);
                    // try again with local fallback or generated labels
                    if (window.localOrganData && window.localOrganData[idActivo]) {
                        procesarInformacion(idActivo, window.localOrganData[idActivo]);
                        return;
                    }
                    if (window.localOrganDataGenerated && window.localOrganDataGenerated[idActivo]) {
                        procesarInformacion(idActivo, window.localOrganDataGenerated[idActivo]);
                        return;
                    }
                    // final fallback: show generic message
                    procesarInformacion(idActivo, { nombre: idActivo, descripcion: 'Descripción no disponible (API desconectada y no hay descripción local).' });
                }
            });
        });

    } catch (error) {
        console.error("Error cargando el SVG:", error);
    }
}

function procesarInformacion(id, data) {
    // Si la página define `displayOrganData`, úsala (viene de `script.js`)
    if (typeof window.displayOrganData === 'function') {
        try { window.displayOrganData(data); return; } catch (e) { console.warn('displayOrganData error', e); }
    }

    // Fallback: actualizar el panel lateral directamente
    const viz = document.querySelector('.side-bar.right .viz-content');
    const name = data.nombre || data.name || 'Órgano';
    const desc = data.descripcion || data.info || '';
    if (viz) {
        viz.innerHTML = `<h4>${name}</h4><p>${desc}</p>`;
    } else {
        // último recurso: mostrar alerta
        alert(`Órgano: ${name}\nInfo: ${desc}`);
    }
}

// Note: do not auto-load the SVG here. Call `cargarEInteractuar(url, containerId)` from the page
// where you want the interactive SVG injected (e.g., `digestivo.html`).