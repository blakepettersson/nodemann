var rx = require('rx');
var index = require('./index');
var socket = require('./socket');
var serializer = require('riemann/riemann/serializer');

var stream = function(index, server, keepAlive, socketFunc) {
    var connection = rx.Observable.fromEvent(server, 'connection').map(function(socket) {
        socket.setKeepAlive(keepAlive);
        return socket;
    });

    return socket.stream(connection, socketFunc).merge(index({
        host: "init",
        state: "init",
        service: "init",
        ttl: 1
    }));
}

exports.stream = stream;
