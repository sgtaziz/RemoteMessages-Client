var Application = require('spectron').Application
var electron = require('electron-prebuilt')
var assert = require('assert')

var app = new Application({
  path: electron,
  args: ['/Users/aziz/Desktop/RemoteMessages/RemoteMessages-Client']
})

app.start().then(function () {
  // Check if the window is visible
  return app.browserWindow.isVisible()
}).then(function (isVisible) {
  // Verify the window is visible
  assert.equal(isVisible, true)
}).then(function () {
  // Stop the application
  return app.stop()
}).catch(function (error) {
  // Log any failures
  console.error('Test failed', error.message)
  app.stop();
  process.exit(1);
})
