
const {app, BrowserWindow, screen } = require('electron/main')
const path = require('path')

const createWindow = () => {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    maxWidth: width,
    maxHeight: height,
    
    backgroundColor: '#15141b',
    resizable: true,
    
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: '#FFFFFF',
      symbolColor: '#7d778c'
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})