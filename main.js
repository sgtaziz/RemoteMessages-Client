if (require('electron-squirrel-startup')) return
require('electron-context-menu')()

const {app, Tray, Menu, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const GhReleases = require('electron-gh-releases')
const AutoLaunch = require('auto-launch')
const iconPath = path.join(__dirname, 'img/icon.png')
const fs = require('fs')

let appIcon
let win
let options = {
	repo: 'sgtaziz/RemoteMessages-Client',
	currentVersion: app.getVersion()
}

var updater = new GhReleases(options)
var forceQuit = false
var autoLauncher = new AutoLaunch({
    name: 'Remote Messages'
})

updater.on('update-downloaded', (info) => {
	updater.install()
})

updater.check((err, status) => {
	if (!err && status) {
		updater.download()
	}
})

function createWindow () {
	win = new BrowserWindow({width: 1000, height: 600, icon:`${__dirname}/img/icon.png`})
	win.setMenu(null)

	if (process.platform !== 'darwin') {
		appIcon = new Tray(iconPath)

		var contextMenu = Menu.buildFromTemplate([
			{
				label: 'Quit',
				click: function() {
					forceQuit = true
					app.quit()
				}
			}
		])

		appIcon.setToolTip('Remote Messages')
		appIcon.setContextMenu(contextMenu)

		appIcon.on('click', function(alt, shift, ctrl, meta) {
			win.show()
		})
	}

	ipcMain.on('window-focus', (e, msg) => {
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
	})

	ipcMain.on('reload', (e, msg) => {
		win.reload()
	})

	ipcMain.on('quit', (e, msg) => {
		forceQuit = true
		app.quit()
	})

	ipcMain.on('startup', (e, msg) => {
		if (process.defaultApp) {
			autoLauncher.disable()
		} else {
			if (msg == 1) {
				autoLauncher.enable()
			} else {
				autoLauncher.disable()
			}
		}
	})

	win.loadURL(`file://${__dirname}/index.html`)

	if (process.defaultApp) {
		win.openDevTools({mode: 'detach'})
	}

	app.on('before-quit', function() {
		if (process.platform !== 'win32') forceQuit = true
	})

	win.on('close', (event) => {
		updater.check((err, status) => {
			if (!err && status) {
				updater.download()
			}
		})

		if(!forceQuit && (process.platform !== 'linux' || !win.isMinimized() )) {
			event.preventDefault()
			if (process.platform === 'linux') win.minimize()
			else win.hide()
			return false
		}
	})

	win.on('closed', () => {
		win = null
	})
}

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
	event.preventDefault()
	callback(true)
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	} else {
		win.show()
	}
})
