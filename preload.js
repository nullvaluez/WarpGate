const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleDNS: (value) => ipcRenderer.send('toggle-dns', value),
  onDNSChangeResponse: (callback) => ipcRenderer.on('dns-change-response', callback),
  getCurrentDNS: (callback) => ipcRenderer.invoke('get-current-dns').then(callback)
});
