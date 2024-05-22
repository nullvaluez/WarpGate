const { app, BrowserWindow, ipcMain } = require('electron');
const sudo = require('sudo-prompt');
const path = require('path');

let defaultDNS = '';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
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
