const { contextBridge, ipcRenderer } = require('electron');

const api = {
    // Organiser
    organiserSignup: (data) => ipcRenderer.invoke('organiser:signup', data),
    organiserLogin: (username, password) => ipcRenderer.invoke('organiser:login', username, password),
    
    // Events
    eventAdd: (data) => ipcRenderer.invoke('event:add', data),
    eventGetAll: () => ipcRenderer.invoke('event:getAll'),
    eventModify: (data) => ipcRenderer.invoke('event:modify', data),
    eventDelete: (eventID) => ipcRenderer.invoke('event:delete', eventID),
    
    // Customer
    customerSignup: (data) => ipcRenderer.invoke('customer:signup', data),
    customerLogin: (username, password) => ipcRenderer.invoke('customer:login', username, password),
    customerRegister: (data) => ipcRenderer.invoke('customer:register', data),
    customerGetRegistrations: (custID) => ipcRenderer.invoke('customer:getRegistrations', custID),
    
    // Staff
    staffAdd: (data) => ipcRenderer.invoke('staff:add', data),
    staffGetByEvent: (eventID) => ipcRenderer.invoke('staff:getByEvent', eventID),
    staffDelete: (staffID) => ipcRenderer.invoke('staff:delete', staffID),
    staffUpdate: (data) => ipcRenderer.invoke('staff:update', data),
    
    // Vendor
    vendorAdd: (data) => ipcRenderer.invoke('vendor:add', data),
    vendorGetByEvent: (eventID) => ipcRenderer.invoke('vendor:getByEvent', eventID),
    vendorDelete: (vendorID) => ipcRenderer.invoke('vendor:delete', vendorID),
    vendorUpdate: (data) => ipcRenderer.invoke('vendor:update', data),
    
    // Registration
    registrationGetByEvent: (eventID) => ipcRenderer.invoke('registration:getByEvent', eventID),
    updateCustomerFeeStatus: (data) => ipcRenderer.invoke('registration:updateFeeStatus', data)
};

contextBridge.exposeInMainWorld('api', api);