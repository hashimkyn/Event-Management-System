const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const backend = require('./backend-bridge');

let mainWindow;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
    
    return win;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ======================= ORGANISER IPC =======================
ipcMain.handle('organiser:signup', async (event, data) => backend.organiserSignup(data));
ipcMain.handle('organiser:login', async (event, username, password) => backend.organiserLogin(username, password));

// ======================= CUSTOMER IPC =======================
ipcMain.handle('customer:signup', async (event, data) => backend.customerSignup(data));
ipcMain.handle('customer:login', async (event, username, password) => backend.customerLogin(username, password));
ipcMain.handle('customer:register', async (event, data) => backend.customerRegister(data));
ipcMain.handle('customer:getRegistrations', async (event, custID) => backend.customerGetRegistrations(custID));

// ======================= EVENT IPC =======================
ipcMain.handle('event:add', async (event, data) => backend.addEvent(data));
ipcMain.handle('event:getAll', async (event) => backend.getAllEvents());
ipcMain.handle('event:modify', async (event, data) => backend.modifyEvent(data));
ipcMain.handle('event:delete', async (event, eventID) => backend.deleteEvent(eventID));

// ======================= STAFF IPC =======================
ipcMain.handle('staff:add', async (event, data) => backend.staffAdd(data));
ipcMain.handle('staff:getByEvent', async (event, eventID) => backend.staffGetByEvent(eventID));
ipcMain.handle('staff:delete', async (event, staffID) => backend.staffDelete(staffID));
ipcMain.handle('staff:update', async (event, data) => backend.staffUpdate(data));

// ======================= VENDOR IPC =======================
ipcMain.handle('vendor:add', async (event, data) => backend.vendorAdd(data));
ipcMain.handle('vendor:getByEvent', async (event, eventID) => backend.vendorGetByEvent(eventID));
ipcMain.handle('vendor:delete', async (event, vendorID) => backend.vendorDelete(vendorID));
ipcMain.handle('vendor:update', async (event, data) => backend.vendorUpdate(data));

// ======================= REGISTRATION IPC =======================
ipcMain.handle('registration:getByEvent', async (event, eventID) => backend.registrationGetByEvent(eventID));
ipcMain.handle('registration:updateFeeStatus', async (event, data) => backend.updateCustomerFeeStatus(data));

// ======================= COUNTING IPC (RECURSIVE) =======================
ipcMain.handle('event:getStaffCount', async (event, eventID) => backend.getStaffCountByEvent(eventID));
ipcMain.handle('event:getVendorCount', async (event, eventID) => backend.getVendorCountByEvent(eventID));


