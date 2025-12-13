const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true // <<< hides the default menu bar
    });

    win.loadFile('index.html');

    // win.webContents.openDevTools(); // <<< comment or remove this line
}

app.whenReady().then(() => {
    createWindow();

    // Remove default menu entirely (optional, extra safety)
    Menu.setApplicationMenu(null);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});



