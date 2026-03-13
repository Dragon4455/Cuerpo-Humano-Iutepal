const { app, BrowserWindow } = require('electron');
const server = require('./server'); // Importa tu servidor Express

let mainWindow;
let serverInstance;

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
  mainWindow.loadURL('http://localhost:3000/templates/sis.html');

  // Abre las herramientas de desarrollo (opcional)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverInstance) {
      serverInstance.close();
    }
  });
}

app.whenReady().then(createWindow);

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