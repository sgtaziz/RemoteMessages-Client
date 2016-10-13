const {ipcRenderer} = require('electron');
const settings = require('electron-settings');
const http = require('http');

loadSettings();

var dialog = document.querySelector('dialog');
var showModalButton = document.querySelector('.show-modal');

if (!dialog.showModal) {
	dialogPolyfill.registerDialog(dialog);
}

showModalButton.addEventListener('click', function() {
	dialog.showModal();
});

dialog.querySelector('.close').addEventListener('click', function() {
	dialog.close();
});

var button = document.getElementById("connect");

button.onclick = function() {
	this.disabled = true;
	this.innerHTML = 'Connecting...';

	var ipAddress = document.getElementById("ipAddr").value;
	var portNum = document.getElementById("portNum").value;
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	var useSSL = document.getElementById("useSSL").checked;

	settings.set("urlRemoteMessages", {
		ip: ipAddress,
		port: portNum,
		username: username,
		password: password,
		SSL: useSSL
	});

	var protocol = "http";

	if (useSSL) {
		protocol = "https";
	}

	var url = protocol + "://" + username + ":" + password + "@" + ipAddress + ":" + portNum;

	insertHTML('<div id="loading"></div>');
	insertHTML('<webview id="webview" src="'+url+'/" disablewebsecurity nodeintegration preload="./js/webview.js"></webview><div id="loading"></div>');

	const webview = document.getElementById('webview');

	webview.addEventListener('did-stop-loading', function() {
		require('electron-context-menu')({window: webview});
		document.getElementById("overlay").style.display = 'block';
		document.getElementById("loading").remove();

		if (webview.getTitle().indexOf("Remote Messages") < 0) {
			alert('Given URL is not a Remote Messages server.');
			ipcRenderer.send('reload', '');
		}

		webview.openDevTools();
	});

	webview.addEventListener('did-start-loading', function() {
		document.getElementById("info").remove();
	});

	webview.addEventListener('did-get-response-details', function(status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType) {
		if (status.httpResponseCode == 401) {
			alert('Incorrect username/password.');
			ipcRenderer.send('reload', '');
		}
	});

	webview.addEventListener('ipc-message', (event) => {
		if (event.channel == 'focus') {
			ipcRenderer.send('window-focus', '');
		}
	});

	webview.addEventListener('did-fail-load', (errorCode, errorDescription, validatedURL, isMainFrame) => {
		alert('Unable to connect to the Remote Messages server. Make sure your IP and Port matches the ones in your Remote Messages settings on your iDevice.');
		ipcRenderer.send('reload', '');
	});
}

function insertHTML(html) {
	var tmpdiv = document.createElement('div');
	tmpdiv.innerHTML = html;
	document.getElementById("window").appendChild(tmpdiv.firstChild);
}

function loadSettings() {
	settings.get('urlRemoteMessages.ip').then(val => {
		if (!val) return;
		document.getElementById("ipAddr").value = val;
		document.getElementById("field1").className += " is-dirty";
	});

	settings.get('urlRemoteMessages.port').then(val => {
		if (!val) return;
		document.getElementById("portNum").value = val;
		document.getElementById("field2").className += " is-dirty";
	});

	settings.get('urlRemoteMessages.username').then(val => {
		if (!val) return;
		document.getElementById("username").value = val;
		document.getElementById("field3").className += " is-dirty";
	});

	settings.get('urlRemoteMessages.password').then(val => {
		if (!val) return;
		document.getElementById("password").value = val;
		document.getElementById("field4").className += " is-dirty";
	});

	settings.get('urlRemoteMessages.SSL').then(val => {
		if (!val) return;
		document.getElementById("useSSL").checked = val;
		document.getElementById("field5").className += " is-checked";
	});

	settings.get('RMStartup').then(val => {
		if (!val) return;
		document.getElementById("startup").checked = val;
		document.getElementById("startupfield").className += " is-checked";
	});

	settings.get('RMAutoconnect').then(val => {
		if (!val) return;
		document.getElementById("autoconnect").checked = val;
		document.getElementById("autoconnectfield").className += " is-checked";
	});

	settings.get('RMDisconnected').then(val => {
		if (!val) {
			if (document.getElementById("autoconnect").checked) {
				document.getElementById("connect").click();
			}
		} else {
			settings.set('RMDisconnected', false);
		}
	});
}

function quit() {
	ipcRenderer.send('quit', '');
}

function disconnect() {
	settings.set("RMDisconnected", true);
	ipcRenderer.send('reload', '');
}

function openRMSettings() {
	document.getElementById('webview').send('openSettings')
}

function checkStartup(checkbox) {
	settings.set("RMStartup", checkbox.checked);

	if (checkbox.checked) {
		ipcRenderer.send('startup', '1');
	} else {
		ipcRenderer.send('startup', '0');
	}
}

function checkAutoconnect(checkbox) {
	settings.set("RMAutoconnect", checkbox.checked);
}
