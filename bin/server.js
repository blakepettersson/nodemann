var rx = require('rx');
var net = require('net');
var settings = require('config').settings;
var serializer = require('riemann/riemann/serializer');

var server = net.createServer();
server.listen(settings.port, function() {
  console.log('server listening on port ' + settings.port);
});

var connection = rx.Observable.fromEvent(server, 'connection').map(function(socket) {
  socket.setKeepAlive(settings.keepAlive);
  return socket;
});

var messages = connection.flatMap(function(socket) {
  var end = rx.Observable.fromEvent(socket, 'end');
  var data = rx.Observable.fromEvent(socket, 'data');
  
  var finished = data.concat(end);

  return finished.map(function(bytes) {
    var message = serializer.deserializeMessage(bytes.slice(4));
    var ack = serializer.serializeMessage({ok: true});
    socket.write(_setResponseLength(ack));
    return message;
  });
}).flatMap(function(message) {
  return rx.Observable.fromArray(message.events);
});

function _getResponseLength(chunk) {
  return (chunk[0] << 24) +
         (chunk[1] << 16) +
         (chunk[2] << 8)  +
         (chunk[3]);
}

function _setResponseLength(payload) {
  var len = payload.length;
  var packet = new Buffer(len + 4);
  packet[0] = len >>> 24 & 0xFF;
  packet[1] = len >>> 16 & 0xFF;
  packet[2] = len >>> 8  & 0xFF;
  packet[3] = len & 0xFF;
  payload.copy(packet, 4, 0);
  return packet;
}

exports.messages = messages;