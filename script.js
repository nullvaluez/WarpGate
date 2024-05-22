document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dnsToggle');
  
    toggle.addEventListener('change', (event) => {
      window.electronAPI.toggleDNS(event.target.checked);
    });
  
    window.electronAPI.onDNSChangeResponse((event, response) => {
      if (response === 'success') {
        alert('DNS changed successfully');
      } else {
        alert('Failed to change DNS');
      }
    });
  });
  