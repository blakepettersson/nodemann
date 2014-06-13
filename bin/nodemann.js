var net = require('net');
var index = require("../src/index");
var connection = require("../src/connection");
var settings = require('config').settings;
var NodeCache = require("node-cache");

var server = net.createServer();
server.listen(settings.port, function() {
    console.log('server listening on port ' + settings.port);
});

var _index = index(new NodeCache({
    stdTTL: settings.ttl,
    checkperiod: settings.checkPeriod
}));

var messages = connection.stream(_index, server, settings.keepAlive, function(socket, message) {
    socket.write(message);
});


exports.index = _index;
exports.messages = messages;
