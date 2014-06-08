var net = require('net');
var s = require('../src/socket')
var connection = require("../src/connection");
var settings = require('config').settings;

var server = net.createServer();
server.listen(settings.port, function() {
  console.log('server listening on port ' + settings.port);
});

var messages = connection.stream(server, settings.keepAlive, function(socket, message) {
	socket.write(s.setResponseLength(message));
});

exports.messages = messages;