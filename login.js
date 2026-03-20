document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando login...');

    // Obtener elementos del DOM
    const tabLogin = document.getElementById('tab-login');
    const roleAdmin = document.getElementById('role-admin');
    const roleGuest = document.getElementById('role-guest');
    const btnText = document.getElementById('btn-text');
    const adminFields = document.getElementById('admin-login-fields');
    const guestInfo = document.getElementById('guest-info-msg');
    const formLogin = document.getElementById('form-login');
    const loginError = document.getElementById('login-error');

    console.log('Elementos del DOM obtenidos:', {
        tabLogin: !!tabLogin,
        roleAdmin: !!roleAdmin,
        roleGuest: !!roleGuest,
        btnText: !!btnText,
        adminFields: !!adminFields,
        guestInfo: !!guestInfo,
        formLogin: !!formLogin,
        loginError: !!loginError
    });

    let currentRole = 'admin';

    function updateUiForRole() {
        console.log('Actualizando UI para rol:', currentRole);
        if (currentRole === 'admin') {
            roleAdmin.classList.add('active');
            roleGuest.classList.remove('active');
            adminFields.style.display = 'block';
            guestInfo.style.display = 'none';
            btnText.textContent = 'Admin';
        } else {
            roleAdmin.classList.remove('active');
            roleGuest.classList.add('active');
            adminFields.style.display = 'none';
            guestInfo.style.display = 'block';
            btnText.textContent = 'Invitado';
        }
    }

    // Configurar event listeners
    roleAdmin.addEventListener('click', (e) => {
        console.log('Clic en botón Admin');
        e.preventDefault();
        currentRole = 'admin';
        updateUiForRole();
    });

    roleGuest.addEventListener('click', (e) => {
        console.log('Clic en botón Invitado');
        e.preventDefault();
        currentRole = 'guest';
        updateUiForRole();
    });

    async function checkOnline() {
        try {
            console.log('Verificando conectividad...');
            const res = await fetch('/api/is-online');
            const data = await res.json();
            console.log('Estado online:', data.online);
            return data.online;
        } catch (error) {
            console.log('Error al verificar conectividad:', error);
            return false;
        }
    }

    async function askModeAndSync(role) {
        console.log('Preguntando modo para rol:', role);
        const online = await checkOnline();
        const wantsOnline = online && confirm('¿Deseas iniciar con internet? (Aceptar = Sí, Cancelar = No)');

        if (!wantsOnline) {
            console.log('Modo offline seleccionado');
                localStorage.setItem('appMode', 'offline');
                localStorage.setItem('appRole', role);
                localStorage.setItem('appLoggedIn', 'true');
                try { await fetch('/api/menu/set-role', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role }) }); } catch(e) { console.warn('No se notificó menú admin', e); }

            // Si tenemos internet, ofrecer descargar imágenes para usar offline
            if (online) {
                const download = confirm('Detectamos internet. ¿Quieres descargar las imágenes desde la nube para que funcionen offline?');
                if (download) {
                    console.log('Descargando imágenes para modo offline...');
                    await fetch('/api/download-images-local', { method: 'POST' });
                }
            }

            console.log('Redirigiendo a sis.html (offline)');
            window.location.href = '/templates/sis.html';
            return;
        }

        console.log('Modo online seleccionado, sincronizando...');
        // Si está online, sincronizar con la base de datos remota
        await fetch('/api/sync-from-online', { method: 'POST' });

        // Verificar si hay cambios locales y preguntar si los quiere mandar
        const hasChangesRes = await fetch('/api/has-local-changes');
        const { hasChanges } = await hasChangesRes.json();
        if (hasChanges) {
            const shouldPush = confirm('Se detectaron cambios locales. ¿Deseas subirlos a internet ahora?');
            if (shouldPush) {
                await fetch('/api/sync-from-online', { method: 'POST' });
            }
        }

        localStorage.setItem('appMode', 'online');
        localStorage.setItem('appRole', role);
        localStorage.setItem('appLoggedIn', 'true');
        try { await fetch('/api/menu/set-role', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role }) }); } catch(e) { console.warn('No se notificó menú admin', e); }
        console.log('Redirigiendo a sis.html (online)');
        window.location.href = '/templates/sis.html';
    }

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Formulario enviado, rol actual:', currentRole);
        loginError.style.display = 'none';
        loginError.textContent = '';

        if (currentRole === 'guest') {
            console.log('Modo invitado seleccionado');
            await askModeAndSync('guest');
            return;
        }

        console.log('Modo admin seleccionado');
        const username = document.getElementById('admin-user').value.trim();
        const password = document.getElementById('admin-pass').value.trim();

        console.log('Credenciales:', { username, password: password ? '***' : '' });

        if (!username || !password) {
            console.log('Faltan credenciales');
            loginError.textContent = 'Completa usuario y contraseña.';
            loginError.style.display = 'block';
            return;
        }

        try {
            console.log('Enviando petición de login...');
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            console.log('Respuesta del servidor:', res.status);
            const data = await res.json();
            console.log('Datos de respuesta:', data);

            if (!res.ok) {
                loginError.textContent = data.error || 'Credenciales inválidas.';
                loginError.style.display = 'block';
                return;
            }

            console.log('Login exitoso, llamando askModeAndSync...');
            await askModeAndSync(data.role);
        } catch (err) {
            console.log('Error en login:', err);
            loginError.textContent = 'Error al conectar con el servidor.';
            loginError.style.display = 'block';
        }
    });

    // Forzar siempre nueva sesión al iniciar: limpiar cualquier estado previo
    localStorage.removeItem('appLoggedIn');
    localStorage.removeItem('appMode');
    localStorage.removeItem('appRole');

    // Inicializar UI
    updateUiForRole();
    console.log('Login inicializado completamente');
});
