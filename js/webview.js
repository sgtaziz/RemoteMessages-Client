(function(){
	var oldWindowFocus = window.focus;
	const {ipcRenderer} = require('electron');

	window.focus = function () {
		ipcRenderer.sendToHost('focus');
		oldWindowFocus();
	}

	ipcRenderer.on('openSettings', () => {
		$('#settings').click();
	});

	var oldLoadSettings = loadSettings;

	function loadSettings() {
		oldLoadSettings();
		$settings.notifications = 1;
		$notificationGranted = 1;
	}

	setTimeout(function() {
		$settings.notifications = 1;
		$notificationGranted = 1;
	}, 3000);
})();
