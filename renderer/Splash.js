const { ipcRenderer } = require('electron')

ipcRenderer.on('set-version', (event, arg) => {

  const versionSpan = document.getElementById('versionSpan')
  versionSpan.innerHTML = "Tempest "+arg
})
ipcRenderer.send('get-version')
