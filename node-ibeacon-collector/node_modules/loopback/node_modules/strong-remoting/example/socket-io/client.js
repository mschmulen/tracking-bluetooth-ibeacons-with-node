var Remotes = require('../../client/js/client');
var SocketIOAdapter = require('../../client/js/socket-io-adapter');
var remotes = Remotes.connect('http://localhost:3000', SocketIOAdapter);

remotes.invoke('fs.readFile', {path: 'test.txt'}, function (err, data) {
  console.log(data.toString());
});

remotes.invoke('ee.on', {event: 'foo'}, function (err, data) {
  console.log('foo event ran!', data); // logged multiple times
});