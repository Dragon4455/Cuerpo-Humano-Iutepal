// Simple horizontal drag for each reel
document.addEventListener('DOMContentLoaded', () => {
  const reels = document.querySelectorAll('.reel');

  // visualizer elements
  const vizContent = document.querySelector('.side-bar.right .viz-content');

  // bone data (short examples)
  const bones = {
    skeleton: { title: 'Skeletal System', text: 'The skeletal system provides structure, protects organs, and enables movement. Major bones include the skull, clavicle, scapula, humerus, femur and more.', img: 'assets/assets/skeleton.png' },
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
        if (key && bones[key]) showInVisualizer(key);
        ev.stopPropagation();
      };
    });
  }

  // Show bone info in visualizer
  function showInVisualizer(key) {
    const info = bones[key];
    if (!info) return;
    // Try to load the image; if it fails, fall back to placeholder
    const placeholder = 'https://via.placeholder.com/640x360.png?text=No+Image';
    const imgSrc = info.img || placeholder;
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
      const boneItems = [
        { key: 'skull', label: 'Skull' },
        { key: 'clavicle', label: 'Clavicle' },
        { key: 'scapula', label: 'Scapula' },
        { key: 'humerus', label: 'Humerus' },
        { key: 'femur', label: 'Femur' }
      ];
      populateLowerReel(boneItems);
      // also show a general skeleton overview in the visualizer
      showInVisualizer('skeleton');
    });
  }

  // delegation: clicks inside lower reel -> show visualizer info
  if (lowerReelTrack) {
    lowerReelTrack.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const key = card.dataset.key;
      if (key && bones[key]) showInVisualizer(key);
    });
  }
});
