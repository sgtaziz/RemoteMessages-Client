const {app, Tray, Menu, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const GhReleases = require('electron-gh-releases')
const AutoLaunch = require('auto-launch');
const iconPath = path.join(__dirname, 'img/icon.png')
const fs = require('fs')
require('electron-context-menu')();

let options = {
	repo: 'sgtaziz/RemoteMessages-Client',
	currentVersion: app.getVersion()
}

var autoLauncher = new AutoLaunch({
    name: 'Remote Messages'
});

const updater = new GhReleases(options)

let appIcon

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

var forceQuit = false

updater.on('update-downloaded', (info) => {
	if (process.platform === 'win32') {
		var ws = require('windows-shortcuts-appid')
		var shortcutPath = process.env.APPDATA + "\\Microsoft\\Windows\\Start Menu\\Programs\\" + app.getName() + ".lnk"

		if (fs.existsSync(shortcutPath)) {
			fs.unlinkSync(shortcutPath)
		}
	}

	forceQuit = true
	updater.install()
	app.quit()
})

updater.check((err, status) => {
	if (!err && status) {
		updater.download()
	}
})

function createWindow () {
	//Perform update

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
		if (win.isMinimized()) win.maximize()
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
		if (msg == 1) {
			autoLauncher.enable();
		} else {
			autoLauncher.disable();
		}
	})

	win.loadURL(`file://${__dirname}/index.html`)

	app.on('before-quit', function() {
		if (process.platform !== 'win32') forceQuit = true
	})

	// Emitted when the window is closed.
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

	if (process.platform === 'win32') {
		var ws = require('windows-shortcuts-appid')
		var appId = "com.sgtaziz.RemoteMessages.RemoteMessages"
		var shortcutPath = process.env.APPDATA + "\\Microsoft\\Windows\\Start Menu\\Programs\\" + app.getName() + ".lnk"

		app.setAppUserModelId(appId)

		fs.exists(shortcutPath, function(exists) {
			if (exists || process.execPath.includes('electron.exe')) return

			ws.create(shortcutPath, process.execPath, function(err) {
				if (err) throw err

				ws.addAppId(shortcutPath, appId, function(err) {
					if(err) throw err
				})
			})
		})
	}
}

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
	event.preventDefault()
	callback(true)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	} else {
		win.show()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
