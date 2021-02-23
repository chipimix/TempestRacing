// In strict mode, any assignment to a non-writable property, a getter-only property, a non-existing property, a
// non-existing variable, or a non-existing object, will throw an error.
'use strict'

const {BrowserWindow} = require('electron')

// default window settings:
const defaultProps = {
    width:600,
    height: 800,
    show: false,
    frame: false,
}

class Window extends BrowserWindow{
    constructor ({file, ...windowSettings}){
        // calls new BrowserWindow with these props
        super({...defaultProps, ...windowSettings});

        // load the html and open devtools
        this.loadFile(file);
        // this.webContents.openDevTools();

        // gracefully show when ready to prevent app start flickering
        this.once('ready-to-show', () =>{
            this.show()
        })
    }
}

module.exports = Window
