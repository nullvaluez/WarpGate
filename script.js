document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dnsToggle');
    const statusDiv = document.getElementById('status');
    const connectionStatusDiv = document.getElementById('connection-status');
  
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
  
    updateStatus();
  });
  