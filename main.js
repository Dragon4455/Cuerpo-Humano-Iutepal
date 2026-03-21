const { app, BrowserWindow } = require('electron');
const server = require('./server'); // Importa tu servidor Express
const menuManager = require('./menu_manager');

let mainWindow;
let serverInstance;

function createMenu() {
  // ahora delegamos al menu_manager para crear el menú nativo
  menuManager.buildMenu(false);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // inicializar menú nativo con referencia a la ventana
  menuManager.init(mainWindow);

  // Pasar la ruta de usuario de Electron al backend
  if (server.setUserDataPath) {
    server.setUserDataPath(app.getPath('userData'));
  }

  // Iniciar el servidor Express en un puerto libre y cargar la URL cuando esté listo
  serverInstance = server.listen(0, () => {
    const port = serverInstance.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log('Servidor iniciado en Electron en', baseUrl);
    try { menuManager.setBaseUrl(baseUrl); } catch (e) {}
    mainWindow.loadURL(`${baseUrl}/login.html`);
    mainWindow.webContents.openDevTools();
  });

  serverInstance.on('error', (err) => {
    console.error('Error iniciando servidor:', err);
  });

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