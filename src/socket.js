var rx = require('rx');
var serializer = require('riemann/riemann/serializer');

var stream = function(connection, socketFunc) {
	return connection.flatMap(function(socket) {

	  var end = rx.Observable.fromEvent(socket, 'end');
	  var data = rx.Observable.fromEvent(socket, 'data');
	  
	  var finished = data.concat(end);
	  
	  return finished.map(function(bytes) {
	    var message = serializer.deserializeMessage(bytes.slice(4));
	    var ack = serializer.serializeMessage({ok: true});

	    socketFunc(socket, _setResponseLength(ack));
	    return message;
	  }).catch(function(error) {
        var ack = serializer.serializeMessage({ok: false, error: error});
        socketFunc(socket, _setResponseLength(ack));
        return rx.Observable.empty();
      });
	}).flatMap(function(message) {
	  return rx.Observable.fromArray(message.events);
	});
}

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

exports.stream = stream;
exports.getResponseLength = _getResponseLength;
exports.setResponseLength = _setResponseLength;