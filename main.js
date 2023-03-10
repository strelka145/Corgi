const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog
} = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
let mainWindow;
let dataPath=path.join(app.getPath('userData'), 'data.json');
let mergePath;
const isMac = (process.platform === 'darwin');

const template = Menu.buildFromTemplate([
  ...(isMac ? [{
      label: app.name,
      submenu: [
        {role:'about',      label:`About ${app.name}` },
        {type:'separator'},
        {role:'services',   label:'Services'},
        {type:'separator'},
        {role:'hide',       label:`Hide ${app.name}`},
        {role:'hideothers', label:'Hide others'},
        {role:'unhide',     label:'Show All'},
        {type:'separator'},
        {role:'quit',       label:`Quit ${app.name}`}
      ]
    }] : []),
    {
      label: 'Data',
      submenu:[
        {
          label: 'Export data',
          click() {
            exportData();
          }
        },
        {
          label: 'Load data',
          click() {
            loadData();
          }
        },
        {
          label: 'Combine data',
          click() {
            combineData();
          }
        }
      ]
    },
    {
      label: 'License',
      submenu: [
            {
                label: 'This app',
                click() {
                  creareLicenseWindow('thisapp');
                },
            },
            {
                label: 'node modules',
                click() {
                  creareLicenseWindow('nodelicenses');
                },
            }
        ]
    }
]);
Menu.setApplicationMenu(template);

function exportData(){
  dialog.showSaveDialog({
    defaultPath: app.getPath('documents') + '/export.json'
  }).then(result => {
    fs.copyFile(dataPath, result.filePath, (err) => {
      if (err) throw err
    });
  });
}

function loadData(){
  const filePaths = dialog.showOpenDialogSync({properties: ['openFile']});
  if (filePaths) {
    dataPath=filePaths[0];
    mainWindow.webContents.reloadIgnoringCache();
  }
}

function combineData(){
  const filePaths = dialog.showOpenDialogSync({properties: ['openFile']});
  if (filePaths) {
    mergePath=filePaths[0];
    mainWindow.webContents.send('sendDataF');
  }
}

//Window showing licences
function creareLicenseWindow(whichLicense){
  let dialogWindow = new BrowserWindow({
    width: 500,
    height: 300,
    title: 'License'
  })
  var licensePath;
  switch (whichLicense){
    case 'thisapp':
      licensePath='LICENSE';
      break;
    case 'nodelicenses':
      licensePath='Licenses/nodeLicenses';
      break;
  }
  dialogWindow.loadURL(`file://${path.join(__dirname,licensePath )}`);
}

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
  const filePath = dataPath;
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) throw err;
    console.log('Data saved to file');
  });
});
ipcMain.on('loadData', (event) => {
  const filePath = dataPath;
  if (filePath!=path.join(app.getPath('userData'), 'data.json')){
    mainWindow.setTitle('Corgi : '+filePath)
  }else{
    mainWindow.setTitle('Corgi');
  }

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.log('File read error:', err);
      event.reply('loadDataResponse', []);
    } else {
      const jsonData = JSON.parse(data);
      mainWindow.webContents.send('loadData', jsonData);
      event.reply('loadDataResponse', jsonData);
    }
  });
});
ipcMain.on('show-context-menu', (event, data) => {
  const menu = Menu.buildFromTemplate([{
    label: `Delete ${data.date} ${data.text}`,
    click: () => {
      mainWindow.webContents.send('deleteItem', data);
    }
  }]);
  menu.popup();
});

//For combineData
ipcMain.on('sendDataR', (event, dataA) => {
  const jsonDataA = dataA;
  fs.readFile(mergePath, 'utf-8', (err, dataB) => {
    const jsonDataB = JSON.parse(dataB);
    const combinedJsonData = [...jsonDataA, ...jsonDataB];
    const sortedCombinedJsonData = combinedJsonData.sort((a, b) => new Date(b.time) - new Date(a.time));
    fs.writeFile(dataPath, JSON.stringify(sortedCombinedJsonData, null, 2), (err) => {
      if (err) throw err;
      console.log('Data saved to file');
      mainWindow.webContents.reloadIgnoringCache();
    });
  });
});
