// Simple horizontal drag for each reel
document.addEventListener('DOMContentLoaded', () => {
  const reels = document.querySelectorAll('.reel');

  // visualizer elements
  const vizContent = document.querySelector('.side-bar.right .viz-content');

  // bone data (short examples)
  const bones = {
    skeleton: { title: 'Skeletal System', text: 'The skeletal system provides structure, protects organs, and enables movement. Major bones include the skull, clavicle, scapula, humerus, femur and more.', img: 'assets/assets/digestivo.svg' },
    skull: { title: 'Skull', text: 'The skull protects the brain and supports the structures of the face.', img: 'https://via.placeholder.com/640x360.png?text=Skull' },
    clavicle: { title: 'Clavicle', text: 'The clavicle (collarbone) connects the arm to the body, providing structural support.', img: 'https://via.placeholder.com/640x360.png?text=Clavicle' },
    scapula: { title: 'Scapula', text: 'The scapula (shoulder blade) helps with arm movement and attachment of muscles.', img: 'https://via.placeholder.com/640x360.png?text=Scapula' },
    humerus: { title: 'Humerus', text: 'The humerus is the long bone in the upper arm between shoulder and elbow.', img: 'https://via.placeholder.com/640x360.png?text=Humerus' },
    femur: { title: 'Femur', text: 'The femur is the thigh bone and the longest bone in the human body.', img: 'https://via.placeholder.com/640x360.png?text=Femur' }
  };

  reels.forEach(reel => {
    const track = reel.querySelector('.reel-track');
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let currentTranslate = 0; // negative or zero

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const getMin = () => {
      return Math.min(0, -(track.scrollWidth - reel.clientWidth));
    };

    reel.addEventListener('pointerdown', (e) => {
      isDown = true;
      moved = false;
      reel.classList.add('grabbing');
      startX = e.clientX;
      startY = e.clientY;
      try { reel.setPointerCapture(e.pointerId); } catch (_) {}
    });

    reel.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      const min = getMin();
      const next = clamp(currentTranslate + dx, min - 40, 40); // small overscroll
      track.style.transform = `translateX(${next}px)`;
    });

    const finish = (e) => {
      if (!isDown) return;
      isDown = false;
      reel.classList.remove('grabbing');
      const dx = e.clientX - startX;
      const min = getMin();

      // If the pointer didn't move much, treat as a click on the element under the pointer
      if (!moved) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el && el.closest('.card');
        if (card) {
          card.click();
        }
      }

      currentTranslate = clamp(currentTranslate + dx, min, 0);
      track.style.transform = `translateX(${currentTranslate}px)`;
      try { reel.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    reel.addEventListener('pointerup', finish);
    reel.addEventListener('pointercancel', finish);

    // mouse wheel to move horizontally
    reel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      const min = getMin();
      currentTranslate = clamp(currentTranslate - delta, min, 0);
      track.style.transform = `translateX(${currentTranslate}px)`;
    }, { passive:false });

    // Resize handler to keep translate within bounds
    window.addEventListener('resize', () => {
      const min = getMin();
      currentTranslate = clamp(currentTranslate, min, 0);
      track.style.transform = `translateX(${currentTranslate}px)`;
    });
  });

  // simple toolbar actions (examples)
  document.querySelectorAll('.toolbar .tool').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.animate([{ transform:'scale(1)' },{ transform:'scale(0.94)' },{ transform:'scale(1)' }], { duration:180 });
    });
  });

  // Populate lower reel with given items (array of {key, label})
  const lowerReelTrack = document.querySelector('#reel2 .reel-track');
  function populateLowerReel(items) {
    lowerReelTrack.innerHTML = items.map(it => `<div class="card" data-key="${it.key}">${it.label}</div>`).join('');
    // attach explicit click handlers to new cards to avoid delegation issues
    const newCards = lowerReelTrack.querySelectorAll('.card');
    newCards.forEach(c => {
      c.style.cursor = 'pointer';
      c.onclick = (ev) => {
        const key = c.dataset.key;
        if (key) handleCardKey(key);
        ev.stopPropagation();
      };
    });
  }

  // Display organ data in the visualizer (name + description)
  function displayOrganData(data) {
    const name = data.nombre || data.name || data.title || 'Órgano';
    const desc = data.descripcion || data.descripcionCorta || data.info || data.text || '';
    vizContent.innerHTML = `<h4>${name}</h4><p>${desc}</p>`;
    // optional image if provided
    const imgSrc = data.img || data.imagen || data.image;
    if (imgSrc) {
      const img = new Image();
      img.src = imgSrc;
      img.alt = name;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.objectFit = 'contain';
      img.onload = () => vizContent.appendChild(img);
    }
  }

  // Handle clicks on cards: either show local bone or fetch from API
  async function handleCardKey(key) {
    if (bones[key]) return showInVisualizer(key);
    try {
      const res = await fetch(`http://localhost:3000/api/organo/${key}`);
      const data = await res.json();
      if (!data.error) {
        displayOrganData(data);
      } else {
        console.warn('No hay datos para', key);
      }
    } catch (err) {
      console.error('Error fetching organ data:', err);
    }
  }

  // Load organ list from the API and populate the lower reel
  async function loadOrganList() {
    const base = 'http://localhost:3000/api/organo';
    const tries = [base, base + 's', base + '/list'];
    let list = null;
    for (const url of tries) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) { list = data; break; }
        // some APIs return {items: [...]}
        if (data && Array.isArray(data.items)) { list = data.items; break; }
      } catch (_) {}
    }
    if (!list) {
      console.warn('No se pudo obtener la lista de órganos desde la API');
      return;
    }
    const items = list.map(it => ({ key: it.id || it._id || it.codigo || it.key || it.nombre, label: it.nombre || it.name || it.label || String(it.id || it._id || it.codigo) }));
    populateLowerReel(items);
  }

  // Wait until the injected SVG container has organ elements, then return their IDs
  function waitForSvgOrganIds(wrapperId, timeout = 2000) {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const container = document.getElementById(wrapperId);
        if (container) {
          const organos = Array.from(container.querySelectorAll('[id^="SD_"]'));
          if (organos.length) return resolve(organos.map(el => el.id));
        }
        if (Date.now() - start > timeout) return resolve([]);
        requestAnimationFrame(check);
      };
      check();
    });
  }

  // After the SVG is shown inside the visualizer, extract organ IDs and populate lower reel
  async function populateLowerFromVizSvg(imgSrc) {
    if (!imgSrc) return;
    const wrapperId = 'viz-svg-container';
    // wait for the svg to be injected
    const ids = await waitForSvgOrganIds(wrapperId, 3000);
    if (!ids || !ids.length) {
      // fallback: try to fetch the svg and parse IDs directly
      try {
        const res = await fetch(imgSrc);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const organos = Array.from(doc.querySelectorAll('[id^="SD_"]'));
        if (organos.length) {
          const ids2 = organos.map(el => el.id);
          return populateNamesForIds(ids2);
        }
      } catch (err) {
        console.warn('No se pudo parsear SVG remoto:', err);
      }
      return;
    }
    return populateNamesForIds(ids);
  }

  // For a list of organ IDs, ask the API for each name and populate the lower reel
  async function populateNamesForIds(ids) {
    const items = [];
    await Promise.all(ids.map(async (id) => {
      let label = id;
      try {
        const res = await fetch(`http://localhost:3000/api/organo/${id}`);
        const data = await res.json();
        if (data && (data.nombre || data.name)) label = data.nombre || data.name;
      } catch (_) {}
      items.push({ key: id, label });
    }));
    if (items.length) populateLowerReel(items);
  }

  // Show bone info in visualizer
  function showInVisualizer(key) {
    const svgContainer = document.getElementById("svg-container")
    
    const info = bones[key];
    if (!info) return;
    
    // If the resource is an inline SVG, embed it and wire interactivity like svgloader.js
    const placeholder = 'https://via.placeholder.com/640x360.png?text=No+Image';
    const imgSrc = info.img || placeholder;

    const isSvg = typeof imgSrc === 'string' && imgSrc.toLowerCase().endsWith('.svg');

    if (isSvg) {
      // prepare a wrapper where the SVG will be injected
      vizContent.innerHTML = `<h4>${info.title}</h4><p>${info.text}</p><div id="viz-svg-container"></div>`;
      const wrapperId = 'viz-svg-container';

      // If svgloader.js is loaded in the page, prefer its helper
      if (typeof window.cargarEInteractuar === 'function') {
        try {
          window.cargarEInteractuar(imgSrc, wrapperId);
        } catch (err) {
          console.error('Error usando cargarEInteractuar:', err);
        }
        return;
      }

      // Fallback: fetch and inject SVG, then attach click handlers (behaviour like svgloader.js)
      fetch(imgSrc).then(r => r.text()).then(svgText => {
        const container = document.getElementById(wrapperId);
        if (!container) return;
        container.innerHTML = svgText;

        const organos = container.querySelectorAll('[id^="SD_"]');
        organos.forEach(elemento => {
          elemento.style.cursor = 'pointer';
          elemento.addEventListener('click', async () => {
            const idActivo = elemento.id;
            try {
              const res = await fetch(`http://localhost:3000/api/organo/${idActivo}`);
              const data = await res.json();
              if (!data.error) {
                if (typeof window.procesarInformacion === 'function') {
                  window.procesarInformacion(idActivo, data);
                } else {
                  alert(`Órgano: ${data.nombre}\nInfo: ${data.descripcion}`);
                }
              } else {
                console.warn('Este elemento no tiene descripción en la BD.');
              }
            } catch (err) {
              console.error('Error conectando con la API:', err);
            }
          });
        });
      }).catch(err => {
        console.error('Error cargando SVG para visualizador:', err);
        vizContent.innerHTML = `\n        <h4>${info.title}</h4>\n        <p>${info.text}</p>\n        <img src="${placeholder}" alt="${info.title}">\n      `;
      });

      return;
    }

    // Non-SVG image fallback (existing behavior)
    const img = new Image();
    img.src = imgSrc;
    img.alt = info.title || '';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    img.onload = () => {
      vizContent.innerHTML = `\n        <h4>${info.title}</h4>\n        <p>${info.text}</p>\n      `;
      vizContent.appendChild(img);
    };
    img.onerror = () => {
      vizContent.innerHTML = `\n        <h4>${info.title}</h4>\n        <p>${info.text}</p>\n        <img src="${placeholder}" alt="${info.title}">\n      `;
    };
  }

  // when first card on upper reel is clicked, populate lower reel with bones
  const topFirst = document.querySelector('#reel1 .reel-track .card');
  if (topFirst) {
    topFirst.style.cursor = 'pointer';
    topFirst.addEventListener('click', () => {
      // populate the lower slider from the DB and show an overview
      loadOrganList();
      showInVisualizer('skeleton');
    });
  }

  // delegation: clicks inside lower reel -> show visualizer info
  if (lowerReelTrack) {
    lowerReelTrack.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const key = card.dataset.key;
      if (!key) return;
      handleCardKey(key);
    });
  }
});
