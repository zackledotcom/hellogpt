const { app, BrowserWindow } = require('electron');
const pidusage = require('pidusage');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('app://./index.html'); // Adjust for production build URL

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Window loaded, starting production performance profiling...');
    profilePerformance();
  });
}

async function profilePerformance() {
  const pid = process.pid;

  const interval = setInterval(async () => {
    try {
      const stats = await pidusage(pid);
      console.log(`CPU: ${stats.cpu.toFixed(2)}% | Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      console.error('Error getting process stats:', err);
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    console.log('Production performance profiling finished.');
    app.quit();
  }, 60000); // Profile for 60 seconds
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
