const { app, BrowserWindow, Menu } = require('electron');
const server = require('./server'); // Importa tu servidor Express

let mainWindow;
let serverInstance;

function createMenu() {
  // Si quieres ocultar completamente la barra de menú (File/Edit/View/etc.)
  // simplemente descomenta la línea siguiente:
  // Menu.setApplicationMenu(null);

  // Ejemplo de menú personalizado (puedes editar/eliminar las entradas)
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggledevtools', label: 'Alternar DevTools' },
        { type: 'separator' },
        { role: 'resetzoom', label: 'Restablecer zoom' },
        { role: 'zoomin', label: 'Zoom +' },
        { role: 'zoomout', label: 'Zoom -' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Iniciar el servidor Express
  serverInstance = server.listen(3000, () => {
    console.log('Servidor iniciado en Electron');
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Carga la aplicación web desde el servidor local
  mainWindow.loadURL('http://localhost:3000/login.html');

  // Abre las herramientas de desarrollo (opcional)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverInstance) {
      serverInstance.close();
    }
  });
}

app.whenReady().then(() => {
  createMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});