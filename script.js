document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dnsToggle');
    const statusDiv = document.getElementById('status');
    const connectionStatusDiv = document.getElementById('connection-status');
    const downloadSpeedDiv = document.getElementById('download-speed');
    const uploadSpeedDiv = document.getElementById('upload-speed');
    const versionDiv = document.getElementById('version');
  
    // Set the app version
    versionDiv.textContent = `v${window.electronAPI.getAppVersion()}`;
    console.log(`App version: ${window.electronAPI.getAppVersion()}`);
    
    // function to ensure the app is up to date
    async function compareVersions() {
        // compare the html with the package.json version
        const response = await fetch('https://raw.githubusercontent.com/nullvaluez/warpgate/main/package.json');
        const data = await response.json();
        const latestVersion = data.version; // get the latest version from the package.json
        if (window.electronAPI.getAppVersion() !== latestVersion) {
            alert('There is a new version of Warpgate available. Please download the latest version from the repository.');
            app.quit();
        } else {
            console.log('App is up to date'); // if the app is up to date, log it
        }
    }

    function updateStatus() {
      window.electronAPI.getCurrentDNS((dns) => {
        if (dns === '1.1.1.1') {
          statusDiv.textContent = 'CONNECTED';
          toggle.checked = true;
        } else {
          statusDiv.textContent = 'NOT CONNECTED';
          toggle.checked = false;
        }
        connectionStatusDiv.textContent = '';
      });
    }
  
    async function updateNetworkSpeeds() {
      const speeds = await window.electronAPI.getNetworkSpeed();
      downloadSpeedDiv.textContent = `Download Speed: ${speeds.download.mbps} Mbps`;
      uploadSpeedDiv.textContent = `Upload Speed: ${speeds.upload.mbps} Mbps`;
    }
  
    toggle.addEventListener('change', (event) => {
      if (event.target.checked) {
        connectionStatusDiv.textContent = 'Connecting...';
      } else {
        connectionStatusDiv.textContent = 'Disconnecting...';
      }
      window.electronAPI.toggleDNS(event.target.checked);
    });
  
    window.electronAPI.onDNSChangeResponse((event, response) => {
      if (response === 'success') {
        updateStatus();
      } else {
        alert('Failed to change DNS');
        updateStatus();
      }
    });
    
    setInterval(compareVersions, 90000);
    updateStatus();
    updateNetworkSpeeds();
    setInterval(updateNetworkSpeeds, 5000); // Update network speeds every 5 seconds
  });
  