const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const sudo = require('sudo-prompt');
const path = require('path');
const NetworkSpeed = require('network-speed'); 
const asarmor = require('asarmor');
const { join } = require('path');

let defaultDNS = '';
let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false // Disable devTools
    },
  });

  mainWindow.loadFile('index.html');

  // Remove the menu
  mainWindow.setMenu(null);

  // Disable context menu
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Minimize to tray
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
    createTray();
  });

  mainWindow.on('restore', () => {
    mainWindow.show();
    if (tray) tray.destroy();
  });
}

function createTray() {
  // Create a new Tray instance without specifying a custom icon
  tray = new Tray(app.getAppPath() + '/default-icon.png');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Restore',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Exit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('WarpGate');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

function logAndExecute(command, description, callback) {
  console.log(`Executing ${description}: ${command}`);
  sudo.exec(command, { name: 'DNS Toggle App' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${description}: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      callback(null);
      return;
    }
    console.log(`Output of ${description}: ${stdout}`);
    callback(stdout);
  });
}

function getCurrentDNS(callback) {
  if (process.platform === 'win32') {
    const command = 'netsh interface ip show dns';
    logAndExecute(command, 'Get Current DNS (Windows)', (stdout) => {
      if (!stdout) {
        callback(null);
        return;
      }
      const lines = stdout.split('\n');
      const dnsLine = lines.find(line => line.includes('DNS Servers'));
      if (dnsLine) {
        const dns = dnsLine.split(':').pop().trim();
        console.log(`Current DNS: ${dns}`);
        callback(dns);
      } else {
        callback(null);
      }
    });
  } else {
    const command = 'networksetup -getdnsservers Wi-Fi';
    logAndExecute(command, 'Get Current DNS (macOS)', (stdout) => {
      if (!stdout) {
        callback(null);
        return;
      }
      const dns = stdout.split('\n')[0].trim();
      console.log(`Current DNS: ${dns}`);
      callback(dns);
    });
  }
}

async function getNetworkDownloadSpeed() {
  try {
    const testNetworkSpeed = new NetworkSpeed();
    const baseUrl = 'http://eu.httpbin.org/stream-bytes/500000';
    const fileSizeInBytes = 500000;
    const speed = await testNetworkSpeed.checkDownloadSpeed(baseUrl, fileSizeInBytes);
    return speed;
  } catch (error) {
    console.error('Error measuring download speed:', error.message);
    return { mbps: 0 };
  }
}

async function getNetworkUploadSpeed() {
  try {
    const testNetworkSpeed = new NetworkSpeed();
    const options = {
      hostname: 'www.google.com',
      port: 80,
      path: '/catchers/544b09b4599c1d0200000289',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const fileSizeInBytes = 2000000;
    const speed = await testNetworkSpeed.checkUploadSpeed(options, fileSizeInBytes);
    return speed;
  } catch (error) {
    console.error('Error measuring upload speed:', error.message);
    return { mbps: 0 };
  }
}

ipcMain.on('toggle-dns', (event, arg) => {
  getCurrentDNS((currentDNS) => {
    if (!currentDNS) {
      console.error('Failed to retrieve current DNS settings.');
      event.reply('dns-change-response', 'error');
      return;
    }

    if (!defaultDNS) {
      defaultDNS = currentDNS;
    }

    const dnsAddress = arg ? '1.1.1.1' : defaultDNS;
    let commandToGetInterface;
    let commandToChangeDNS;

    if (process.platform === 'win32') {
      commandToGetInterface = 'netsh interface show interface';
      commandToChangeDNS = (interfaceName) => `netsh interface ip set dns name="${interfaceName}" static ${dnsAddress}`;
    } else {
      commandToGetInterface = 'networksetup -listallhardwareports';
      commandToChangeDNS = (interfaceName) => `sudo networksetup -setdnsservers ${interfaceName} ${dnsAddress}`;
    }

    logAndExecute(commandToGetInterface, 'Get Network Interface', (stdout) => {
      if (!stdout) {
        event.reply('dns-change-response', 'error');
        return;
      }

      let interfaceName;
      if (process.platform === 'win32') {
        // Parse the Windows interface list to find the connected interface
        const interfaces = stdout.split('\n').filter(line => line.includes('Connected'));
        if (interfaces.length > 0) {
          interfaceName = interfaces[0].trim().split(/\s+/).pop(); // Extract interface name correctly
        }
      } else {
        // Parse the macOS hardware ports list to find the active interface
        const interfaces = stdout.split('\n').filter(line => line.includes('Device: '));
        if (interfaces.length > 0) {
          interfaceName = interfaces[0].split(': ')[1];
        }
      }

      if (!interfaceName) {
        console.error('Failed to detect the active network interface.');
        event.reply('dns-change-response', 'error');
        return;
      }

      console.log(`Detected Interface: ${interfaceName}`);

      const changeDNSCommand = commandToChangeDNS(interfaceName);

      logAndExecute(changeDNSCommand, 'Change DNS', (stdout) => {
        if (!stdout) {
          event.reply('dns-change-response', 'error');
          return;
        }
        console.log('DNS change successful.');
        event.reply('dns-change-response', 'success');
      });
    });
  });
});

ipcMain.handle('get-current-dns', async () => {
  return new Promise((resolve) => {
    getCurrentDNS(resolve);
  });
});

ipcMain.handle('get-network-speed', async () => {
  const downloadSpeed = await getNetworkDownloadSpeed();
  const uploadSpeed = await getNetworkUploadSpeed();
  return { download: downloadSpeed, upload: uploadSpeed };
});

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`asarmor applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};