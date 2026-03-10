let previousSelected = null;

/**
 * EXPOSICIÓN GLOBAL PARA EL HTML
 */

window.eliminarImagen = async function(idImagen) {
    if (!idImagen || idImagen === 'undefined') return;
    if (!confirm("¿Estás seguro de que deseas eliminar este archivo multimedia?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/eliminar-recurso/${idImagen}`, {
            method: 'DELETE'
        });
        if (res.ok) location.reload(); 
    } catch (err) {
        console.error("Error en la petición DELETE:", err);
    }
};

window.abrirVisor = function(url, nombreOrgano) {
    const modal = document.getElementById('modal-visor');
    const contenedor = document.getElementById('contenedor-recurso-modal');
    const caption = document.getElementById('caption-modal');
    
    if (!modal || !contenedor) return;

    // OPTIMIZACIÓN FULL PARA EL MODAL
    const urlFullOptimizada = url.replace('/upload/', '/upload/f_auto,q_auto,vc_auto/');
    const esVideo = url.toLowerCase().match(/\.(mp4|webm|mov)$/) || url.includes('/video/upload/');

    contenedor.innerHTML = esVideo 
        ? `<video src="${urlFullOptimizada}" controls autoplay style="max-width:100%; max-height:80vh; border-radius:8px;"></video>`
        : `<img src="${urlFullOptimizada}" style="max-width:100%; max-height:80vh; border-radius:8px; box-shadow: 0 0 30px rgba(0,0,0,0.5);">`;
    
    caption.textContent = nombreOrgano || "Visualización de órgano";
    modal.style.display = "flex";
};

/**
 * FUNCIÓN PRINCIPAL: CARGA DEL SVG
 */
export async function cargarEInteractuar(url, sistema, contenedorId) {
    try {
        const respuesta = await fetch(url);
        const codigoSvg = await respuesta.text();
        const contenedor = document.getElementById(contenedorId);
        contenedor.innerHTML = codigoSvg;

        contenedor.querySelectorAll('[id^="S"]').forEach(elemento => {
            elemento.style.cursor = "pointer";
            elemento.addEventListener('click', async () => {
                const res = await fetch(`http://localhost:3000/api/${sistema}/${elemento.id}`);
                const data = res.ok ? await res.json() : { id_svg: elemento.id, nombre: elemento.id, imagenes: [] };
                aplicarSeleccion(elemento, elemento.id, data);
            });
        });

        configurarFormularioCRUD();
        configurarCierreModal();
    } catch (error) {
        console.error("Error general:", error);
    }
}

/**
 * ACTUALIZACIÓN DINÁMICA DE LA INTERFAZ
 */
function aplicarSeleccion(elemento, id, data) {
    if (previousSelected) previousSelected.classList.remove('selected-organ');
    elemento.classList.add('selected-organ');
    previousSelected = elemento;

    document.getElementById('org-name').textContent = data.nombre || id;
    document.getElementById('org-desc').textContent = data.descripcion || 'Sin descripción disponible.';

    const galeriaEl = document.getElementById('galeria-imagenes');
    const listaEditEl = document.getElementById('lista-archivos-edit');
    
    if (galeriaEl) galeriaEl.innerHTML = '';
    if (listaEditEl) listaEditEl.innerHTML = '';

    if (data.imagenes && data.imagenes.length > 0) {
        data.imagenes.forEach(img => {
            const urlBase = img.url_imagen;
            const esVideo = urlBase.toLowerCase().match(/\.(mp4|webm|mov)$/) || urlBase.includes('/video/upload/');

            // --- TRUCO DE CLOUDINARY PARA VIDEOS ---
            // Si es video, cambiamos la extensión a .jpg para que Cloudinary nos dé un frame (miniatura)
            // Además aplicamos recorte cuadrado 150x150
            let urlMiniatura = urlBase.replace('/upload/', '/upload/f_auto,q_auto,w_150,h_150,c_fill/');
            if (esVideo) {
                urlMiniatura = urlMiniatura.replace(/\.[^/.]+$/, ".jpg");
            }

            // 1. Crear elemento para la GALERÍA DE VISTA (Siempre será una IMG ahora)
            const imgMiniatura = document.createElement('img');
            imgMiniatura.src = urlMiniatura;
            imgMiniatura.className = "img-galeria";
            imgMiniatura.style.cursor = "zoom-in";
            
            // Si es video, le ponemos un icono visual encima o un borde diferente (opcional)
            if (esVideo) imgMiniatura.style.border = "2px solid #89c0bd";

            // Al hacer clic, SE ABRE EL VIDEO REAL EN EL MODAL
            imgMiniatura.onclick = () => window.abrirVisor(urlBase, data.nombre);
            if (galeriaEl) galeriaEl.appendChild(imgMiniatura);

            // 2. LISTA DE EDICIÓN
            if (listaEditEl) {
                const itemEdit = document.createElement('div');
                itemEdit.style.cssText = "position:relative; display:inline-block; margin:5px;";
                itemEdit.innerHTML = `
                    <div style="width:60px; height:60px; overflow:hidden; border-radius:4px; border:1px solid #89c0bd;">
                        <img src="${urlMiniatura}" style="width:100%; height:100%; object-fit:cover;">
                        ${esVideo ? '<div style="position:absolute; bottom:2px; right:2px; font-size:10px;">🎬</div>' : ''}
                    </div>
                    <button type="button" onclick="window.eliminarImagen(${img.id})" 
                            style="position:absolute; top:-8px; right:-8px; background:#ff4d4d; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">
                        ×
                    </button>
                `;
                listaEditEl.appendChild(itemEdit);
            }
        });
    }

    document.getElementById('edit-id-svg').value = id;
    document.getElementById('input-nombre').value = data.nombre || "";
    document.getElementById('input-desc').value = data.descripcion || "";
}

function configurarFormularioCRUD() {
    const btnToggle = document.getElementById('toggle-edit');
    const viewContainer = document.getElementById('view-container');
    const editContainer = document.getElementById('edit-container');
    const crudForm = document.getElementById('crud-form');

    if (btnToggle) {
        btnToggle.onclick = () => {
            if (!document.getElementById('edit-id-svg').value) return alert("Selecciona un órgano.");
            const isEditing = editContainer.style.display === "block";
            editContainer.style.display = isEditing ? "none" : "block";
            viewContainer.style.display = isEditing ? "block" : "none";
            btnToggle.innerText = isEditing ? "✏️ MODO EDICIÓN" : "❌ CANCELAR";
        };
    }

    if (crudForm) {
        crudForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = crudForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                const res = await fetch('http://localhost:3000/api/admin/organo', {
                    method: 'POST',
                    body: new FormData(crudForm)
                });
                if (res.ok) location.reload();
            } catch (err) { console.error(err); }
        };
    }
}

function configurarCierreModal() {
    const modal = document.getElementById('modal-visor');
    if (!modal) return;
    modal.onclick = (e) => {
        if (e.target.id === 'modal-visor' || e.target.id === 'cerrar-modal') {
            modal.style.display = "none";
            document.getElementById('contenedor-recurso-modal').innerHTML = ""; 
        }
    };
}