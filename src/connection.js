var rx = require('rx');
var index = require('./index');
var socket = require('./socket');
var serializer = require('riemann/riemann/serializer');

var stream = function(server, keepAlive, socketFunc) {
	var connection = rx.Observable.fromEvent(server, 'connection').map(function(socket) {
	  socket.setKeepAlive(keepAlive);
	  return socket;
	});

	return socket.stream(connection, socketFunc).merge(index.expiredEvents);
}

exports.stream = stream;