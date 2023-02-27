const { app, BrowserWindow, Menu,ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('saveData', (event, data) => {
  const filePath = path.join(app.getPath('userData'), 'data.json');
  const jsonData = JSON.stringify(data, null, 2);

  fs.writeFile(filePath, jsonData, (err) => {
    if (err) throw err;
    console.log('Data saved to file');
  });
});

ipcMain.on('loadData', (event) => {
  const filePath = path.join(app.getPath('userData'), 'data.json');

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.log('File read error:', err);
      event.reply('loadDataResponse', []);
    } else {
      const jsonData = JSON.parse(data);
      event.reply('loadDataResponse', jsonData);
    }
  });
});



ipcMain.on('show-context-menu', (event, data) => {
  const menu = Menu.buildFromTemplate([
    {
      label: `Delete ${data.date} ${data.text}`,
      click: () => {
        mainWindow.webContents.send('deleteItem', data);
      }
    }
  ]);

  menu.popup();
});
