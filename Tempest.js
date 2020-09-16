'use strict';
const { app } = require('electron');
const ipcMain = require('electron').ipcMain;
const Window = require('./scripts/Window');
//const comms = require('./scripts/mastr-communication')
// app.disableHardwareAcceleration();
function createSplashWindow(){
    let splashWindow = new Window({
        file: 'renderer/Splash.html',
        width:296,
        height:307,
        alwaysOnTop: true,
        resizable:false,
        backgroundColor: '#1A1C20'
    });
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
        createLoginWindow();
  });

    ipcMain.on('login-init', event => {
        splashWindow.close();
    });
}

function createMenuWindow(tok) {
    let mainWindow = new Window({
        file: 'renderer/Recording.html',
        width: 1280,
        height: 720,
    });
    mainWindow.on('resize', function () {
        setTimeout(function () {
            var size = mainWindow.getSize();
            mainWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
        }, 0);
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
        console.log("sending usr-tok with:" + tok)
        mainWindow.webContents.send('usr-tok', tok);

    });
}

function createFAQWindow() {
    let mainWindow = new Window({
        file: 'renderer/MetricsFAQ.html',
        width: 1280,
        height: 720,
        frame: true,
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });
    mainWindow.setMenuBarVisibility(false)

}
function createLoginWindow(){
    let loginWindow = new Window({
        file: 'renderer/Login.html',
        width:576,
        height:648,
        // alwaysOnTop: true,
        resizable:false,
        backgroundColor: '#1A1C20'
    }   );
    loginWindow.once('ready-to-show', () => {
        loginWindow.show()

        // //compiled
        const {globalShortcut} = require('electron')
        globalShortcut.register("Control+Shift+I", () => {
            return false;
        })
        globalShortcut.register("Control+R", () => {
            return false;
        })
    });
    ipcMain.on('loginSuccessful', (e,arg) => {
        console.log(arg);
        createMenuWindow(arg)
        loginWindow.close()
    });
}

app.on('ready', createSplashWindow)

app.on('window-all-closed', function(){
    app.quit()
})

ipcMain.on('get-version', event => {
  event.sender.send('set-version', app.getVersion())
})
ipcMain.on('close-me', (evt, arg) => {
    app.quit()
})
ipcMain.on('signup',()=>{
    const {BrowserWindow} = require('electron')
    let win2 = new BrowserWindow({
        backgroundColor: '#2e2c29',
        width:691,
        height:778,
        show: true,
        frame: true,
    });
    win2.loadURL(' http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/signup/')
    win2.setMenuBarVisibility(false)
})
ipcMain.on('lostpw',()=>{
    const {BrowserWindow} = require('electron')
    let win2 = new BrowserWindow({
        backgroundColor: '#d3d3d3',
        width:576,
        height:648,
        show: true,
        frame: true,
    });
    win2.loadURL(' http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/accounts/password_reset/')

})
ipcMain.on('metricFAQ',()=>{
    createFAQWindow();
})