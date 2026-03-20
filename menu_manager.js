const { Menu, shell } = require('electron');

let mainWindowRef = null;
let menuTemplate = null;
let ajustesMenuIndex = null;

function buildMenu(isAdmin = false) {
  menuTemplate = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Salir ▾', enabled: false },
        { type: 'separator' },
        { label: 'Salir del sistema', click: () => { if (mainWindowRef) mainWindowRef.close(); } },
        { label: 'Cerrar sesión', click: () => { if (mainWindowRef) mainWindowRef.loadURL('http://localhost:3000/login.html'); } }
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
              message: 'Enciclopedia Anatómica\nCreadores: Equipo de Desarrollo IUTEPAL',
              buttons: ['OK']
            });
        } },
        { label: 'Abrir documentación', click: () => { shell.openExternal('https://github.com/Dragon4455/Cuerpo-Humano-Iutepal'); } }
      ]
    }
  ];

  // Ajustes (solo admin)
  const ajustes = {
    label: 'Ajustes',
    visible: !!isAdmin,
    submenu: [
      { label: 'Cambiar usuario/contraseña', click: () => { if (mainWindowRef) mainWindowRef.loadURL('http://localhost:3000/templates/admin_tools.html#credentials'); } },
      { label: 'Exportar BD (ZIP)', click: () => { if (mainWindowRef) mainWindowRef.loadURL('http://localhost:3000/templates/admin_tools.html#export'); } },
      { label: 'Importar BD (ZIP)', click: () => { if (mainWindowRef) mainWindowRef.loadURL('http://localhost:3000/templates/admin_tools.html#import'); } }
    ]
  };

  menuTemplate.push(ajustes);
  ajustesMenuIndex = menuTemplate.length - 1;

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function init(mainWindow) {
  mainWindowRef = mainWindow;
  buildMenu(false);
}

function setAdminMode(isAdmin) {
  try {
    if (!menuTemplate) buildMenu(isAdmin);
    else {
      // Rebuild menu visibility for ajustes
      menuTemplate[menuTemplate.length - 1].visible = !!isAdmin;
      const menu = Menu.buildFromTemplate(menuTemplate);
      Menu.setApplicationMenu(menu);
    }
  } catch (e) { console.error('menu_manager setAdminMode error', e); }
}

module.exports = { init, setAdminMode, buildMenu };
