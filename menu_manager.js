const { Menu, shell } = require('electron');

let mainWindowRef = null;
let menuTemplate = null;
let ajustesMenuIndex = null;
let baseUrl = 'http://localhost:3000';
let isAdminMode = false;
let isSecretUnlocked = false;

function rebuildMenu() {
  const visibleAjustes = isAdminMode && isSecretUnlocked;
  menuTemplate = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Salir ▾', enabled: false },
        { type: 'separator' },
        { label: 'Salir del sistema', click: () => { if (mainWindowRef) mainWindowRef.close(); } },
        { label: 'Cerrar sesión', click: () => { if (mainWindowRef) mainWindowRef.loadURL(`${baseUrl}/login.html`); } }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Acerca de', click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'Acerca de',
              message: 'Enciclopedia Anatómica\nCreadores: \nELias Curiel\nNeomar Vasquez\nJaniel Piña\nJosniel Rodriguez',
              buttons: ['OK']
            });
        } },
        { label: 'Abrir documentación', click: () => { shell.openExternal('https://github.com/Dragon4455/Cuerpo-Humano-Iutepal'); } },
        { label: 'Abrir DevTools', click: () => { if (mainWindowRef) mainWindowRef.webContents.openDevTools(); } }
      ]
    }
  ];

  // Ajustes: siempre visible para admin, solo muestra export/import si secret
  const ajustes = {
    label: 'Ajustes',
    visible: isAdminMode,
    submenu: [
      { label: 'Cambiar usuario/contraseña', click: () => { if (mainWindowRef) mainWindowRef.loadURL(`${baseUrl}/templates/admin_tools.html#credentials`); } },
      { type: 'separator' },
      { label: 'Exportar BD (ZIP)', visible: visibleAjustes, click: () => { if (mainWindowRef) mainWindowRef.loadURL(`${baseUrl}/templates/admin_tools.html#export`); } },
      { label: 'Importar BD (ZIP)', visible: visibleAjustes, click: () => { if (mainWindowRef) mainWindowRef.loadURL(`${baseUrl}/templates/admin_tools.html#import`); } }
    ]
  };

  menuTemplate.push(ajustes);
  ajustesMenuIndex = menuTemplate.length - 1;

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function setAdminMode(isAdmin) {
  isAdminMode = !!isAdmin;
  rebuildMenu();
}

function setSecretMode(unlocked) {
  isSecretUnlocked = !!unlocked;
  rebuildMenu();
}

function buildMenu(isAdmin = false) {
  setAdminMode(isAdmin);
}

function init(mainWindow) {
  mainWindowRef = mainWindow;
  isAdminMode = false;
  isSecretUnlocked = false;
  rebuildMenu();
}

function setBaseUrl(url) {
  baseUrl = url || baseUrl;
}

module.exports = { init, buildMenu, setAdminMode, setSecretMode, setBaseUrl };
