const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appVersion = packageJson.version;

contextBridge.exposeInMainWorld('electronAPI', {
  toggleDNS: (value) => ipcRenderer.send('toggle-dns', value),
  onDNSChangeResponse: (callback) => ipcRenderer.on('dns-change-response', callback),
  getCurrentDNS: (callback) => ipcRenderer.invoke('get-current-dns').then(callback),
  getNetworkSpeed: () => ipcRenderer.invoke('get-network-speed'),
  getAppVersion: () => appVersion,
});
