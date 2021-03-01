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
        resizable:false,
        webPreferences: { enableRemoteModule: true, backgroundThrottling:false }
    });
    // mainWindow.on('resize', function () {
    //     setTimeout(function () {
    //         var size = mainWindow.getSize();
    //         mainWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
    //     }, 0);
    // });
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
        backgroundColor: '#1A1C20',
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
    ipcMain.on('exportReport', (e,arg) => {
        createExportReportWindow(arg)
        // loginWindow.close()
    });
}

function createExportReportWindow(arg){
    console.log("createExportReportWindow!")
    let exportWindow = new Window({
        file: 'renderer/ExportReport.html',
        width:764,
        height:1080,
        // alwaysOnTop: true,
        resizable:false,
        backgroundColor: '#fff',
        frame: true,
        webPreferences: { enableRemoteModule: true }
    }   );
    exportWindow.setMenuBarVisibility(false)
    exportWindow.once('ready-to-show', () => {
        exportWindow.show()
        // console.log(arg)
        exportWindow.webContents.send('reportData', arg);

    });
    ipcMain.removeAllListeners('print');
    ipcMain.on('print',()=>{
        console.log("print")
        console.log(exportWindow)
        console.log("------------------------")
        console.log(exportWindow.webContents)
        console.log("^^^^^^^^^^^^^^^^^^^^^^^^")
        // const electron = require('electron');
        // const BrowserWindow = electron.remote.BrowserWindow;
        // var filepath = 'C:\\Users\\danielRocha\\Desktop\\print1.pdf';
        var options = {
            marginsType: 0,
            pageSize: 'A4',
            printBackground: true,
            printSelectionOnly: false,
            landscape: false
        }
        exportWindow.webContents.print();

    })

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