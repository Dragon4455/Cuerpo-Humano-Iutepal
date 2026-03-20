// Toolbar UI: basada en clic, dropdowns persistentes, no altera estilos globales
(function(){
  const role = localStorage.getItem('appRole') || 'guest';

  const css = `
  .ch-toolbar{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(7,16,41,0.95);color:#fff;border-radius:10px;padding:6px 10px;display:flex;gap:8px;align-items:center;font-family:Inter,Arial;max-width:1100px}
  .ch-toolbar .btn{background:transparent;border:0;color:#fff;padding:8px 12px;cursor:pointer;border-radius:6px;font-size:0.95rem}
  .ch-dropdown{position:absolute;top:44px;left:0;min-width:220px;background:#fff;color:#071029;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:none;flex-direction:column;padding:6px}
  .ch-dropdown.show{display:flex}
  .ch-dropdown button{background:transparent;border:0;padding:10px;text-align:left;cursor:pointer}

  /* Responsive: small screens */
  @media (max-width: 700px){
    .ch-toolbar{left:8px;right:8px;transform:none;justify-content:space-between;flex-wrap:wrap;padding:8px}
    .ch-toolbar .btn{font-size:0.9rem;padding:6px 8px}
    .ch-toolbar > div{flex:1}
    .ch-toolbar .brand{flex-basis:100%}
    .ch-dropdown{position:static;box-shadow:none;border-radius:8px;margin-top:6px;width:100%}
    .ch-dropdown button{padding:12px}
  }

  /* Very small: stack buttons */
  @media (max-width: 420px){
    .ch-toolbar{padding:6px;gap:6px}
    .ch-toolbar .btn{padding:6px 6px;font-size:0.85rem}
  }
  `;

  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const container = document.createElement('div'); container.className = 'ch-toolbar';
  container.innerHTML = `
    <div style="font-weight:700;margin-right:6px">Enciclopedia Anatómica</div>
    <div style="position:relative">
      <button class="btn" id="btn-file">Salir ▾</button>
      <div class="ch-dropdown" id="dd-file">
        <button id="action-exit">Salir del sistema</button>
        <button id="action-logout">Cerrar sesión</button>
      </div>
    </div>
    <div style="position:relative">
      <button class="btn" id="btn-help">Acerca de ▾</button>
      <div class="ch-dropdown" id="dd-help">
        <button id="action-help">Ayuda</button>
      </div>
    </div>
    <div id="admin-area" style="display:${role==='admin'?'flex':'none'};position:relative">
      <button class="btn" id="btn-ajustes">Ajustes ▾</button>
      <div class="ch-dropdown" id="dd-ajustes">
        <button id="action-credentials">Cambiar usuario/contraseña</button>
        <button id="action-export">Exportar BD (ZIP)</button>
        <button id="action-import">Importar BD (ZIP)</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // toggle helper
  function toggle(id){
    const el = document.getElementById(id);
    if(!el) return;
    document.querySelectorAll('.ch-dropdown').forEach(d=>{ if(d.id!==id) d.classList.remove('show'); });
    el.classList.toggle('show');
  }

  document.getElementById('btn-file').addEventListener('click', ()=> toggle('dd-file'));
  document.getElementById('btn-help').addEventListener('click', ()=> toggle('dd-help'));
  document.getElementById('btn-ajustes')?.addEventListener('click', ()=> toggle('dd-ajustes'));

  // click outside to close
  document.addEventListener('click', (e)=>{
    if(!container.contains(e.target)) document.querySelectorAll('.ch-dropdown').forEach(d=>d.classList.remove('show'));
  });

  // Actions
  document.getElementById('action-exit').addEventListener('click', ()=>{ try{ window.close(); }catch(e){ alert('No se pudo cerrar automáticamente'); } });
  document.getElementById('action-logout').addEventListener('click', ()=>{ localStorage.removeItem('appRole'); localStorage.removeItem('appLoggedIn'); window.location.href='/login.html'; });
  document.getElementById('action-help').addEventListener('click', ()=>{ alert('Enciclopedia Anatómica\nCreadores: Equipo de Desarrollo IUTEPAL\nSoporta: .jpg .png .gif .svg .mp4'); });

  document.getElementById('action-credentials')?.addEventListener('click', ()=>{ window.location.href = '/templates/admin_tools.html#credentials'; });
  document.getElementById('action-export')?.addEventListener('click', async ()=>{
    try{ const resp = await fetch('/api/export-db-zip', { headers:{ 'x-role':'admin' } }); if(!resp.ok) return alert('Error al exportar'); const blob = await resp.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'backup.zip'; document.body.appendChild(a); a.click(); a.remove(); }catch(e){ alert('Error al exportar'); }
  });
  document.getElementById('action-import')?.addEventListener('click', ()=>{
    const inp = document.createElement('input'); inp.type='file'; inp.accept='.zip'; inp.onchange = async (e)=>{
      const f = e.target.files[0]; if(!f) return; const fd = new FormData(); fd.append('backup', f);
      try{ const resp = await fetch('/api/import-db-zip', { method:'POST', body: fd, headers:{ 'x-role':'admin' } }); const data = await resp.json(); if(resp.ok) alert('Importación completada'); else alert(data.error || 'Error al importar'); }catch(e){ alert('Error al importar'); }
    }; inp.click();
  });

  // Notify main process via server to toggle native menu too
  try{ const roleNow = localStorage.getItem('appRole') || 'guest'; fetch('/api/menu/set-role', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role: roleNow }) }).catch(()=>{}); }catch(e){}

})();
