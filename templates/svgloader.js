let previousSelected = null;

/**
 * EXPOSICIÓN GLOBAL PARA EL HTML
 */

window.eliminarImagen = async function(idImagen) {
    if (!idImagen || idImagen === 'undefined') return;
    if (!confirm("¿Estás seguro de que deseas eliminar este archivo multimedia?")) return;

    try {
        const headers = {};
        if (localStorage.getItem('appRole') === 'admin') {
            headers['x-role'] = 'admin';
        }
        const res = await fetch(`http://localhost:3000/api/eliminar-recurso/${idImagen}`, {
            method: 'DELETE',
            headers
        });
        // Obtener el órgano actualmente seleccionado
        const id_svg = document.getElementById('edit-id-svg').value;
        const sistema = window.location.pathname.replace('.html', '').replace('/', '').replace('templates/', 'sistema_');
        // Volver a pedir los datos del órgano y actualizar la galería
        if (id_svg && sistema) {
            const resOrg = await fetch(`http://localhost:3000/api/${sistema}/${id_svg}`);
            if (resOrg.ok) {
                const data = await resOrg.json();
                // Buscar el elemento SVG seleccionado
                let svgEl = null;
                if (window.lastSelectedSvgElement) {
                    svgEl = window.lastSelectedSvgElement;
                } else {
                    // Buscar por id en el SVG
                    svgEl = document.querySelector(`[id='${id_svg}']`);
                }
                if (svgEl) aplicarSeleccion(svgEl, id_svg, data);
            }
        }
        // No mostrar alertas si es 404, solo si es otro error
        if (!res.ok && res.status !== 404) {
            const data = await res.json();
            alert(data.error || 'No se pudo eliminar');
        }
    } catch (err) {
        console.error("Error en la petición DELETE:", err);
    }
};

window.abrirVisor = function(url, nombreOrgano) {
    const modal = document.getElementById('modal-visor');
    const contenedor = document.getElementById('contenedor-recurso-modal');
    const caption = document.getElementById('caption-modal');
    
    if (!modal || !contenedor) return;

    const esLocal = url.startsWith('/local_images/') || url.startsWith('/upload_images/');
    let urlFullOptimizada = url;
    if (!esLocal) {
        urlFullOptimizada = url.replace('/upload/', '/upload/f_auto,q_auto,vc_auto/');
    }
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
    // Si no hay sesión, redirigir al login
    if (localStorage.getItem('appLoggedIn') !== 'true') {
        window.location.href = '/login.html';
        return;
    }

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
            const esLocal = urlBase.startsWith('/local_images/') || urlBase.startsWith('/upload_images/');

            // Solo mostrar imágenes locales
            if (!esLocal) return;

            let urlMiniatura = urlBase;

            // 1. Crear elemento para la GALERÍA DE VISTA (Siempre será una IMG ahora)
            const imgMiniatura = document.createElement('img');
            imgMiniatura.src = urlMiniatura;
            imgMiniatura.className = "img-galeria";
            imgMiniatura.style.cursor = "zoom-in";
            imgMiniatura.onerror = () => {
                console.error('Error cargando imagen:', urlMiniatura);
                imgMiniatura.src = '/static/placeholder.jpg'; // Placeholder si falla
            };
            if (esVideo) imgMiniatura.style.border = "2px solid #89c0bd";
            imgMiniatura.onclick = () => window.abrirVisor(urlBase, data.nombre);
            if (galeriaEl) galeriaEl.appendChild(imgMiniatura);

            // 2. LISTA DE EDICIÓN
            if (listaEditEl) {
                const itemEdit = document.createElement('div');
                itemEdit.style.cssText = "position:relative; display:inline-block; margin:5px;";
                itemEdit.innerHTML = `
                    <div style="width:60px; height:60px; overflow:hidden; border-radius:4px; border:1px solid #89c0bd;">
                        <img src="${urlMiniatura}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/static/placeholder.jpg'">
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

    // Si no es administrador, ocultamos el modo edición y no permitimos acciones de CRUD
    const isAdmin = localStorage.getItem('appRole') === 'admin';
    if (!isAdmin) {
        if (btnToggle) btnToggle.style.display = 'none';
        if (editContainer) editContainer.style.display = 'none';
    }

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
                const headers = {};
                if (isAdmin) headers['x-role'] = 'admin';
                const res = await fetch('/api/admin/organo', {
                    method: 'POST',
                    headers,
                    body: new FormData(crudForm)
                });
                if (res.ok) location.reload();
                else {
                    const data = await res.json();
                    console.error('Error:', data);
                    alert(data.error || 'No se pudo guardar');
                }
            } catch (err) { console.error(err); }
            finally { btn.disabled = false; }
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