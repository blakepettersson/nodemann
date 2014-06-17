var rx = require('rx');
var socket = require('../socket')
var sinon = require('sinon');
var onNext = rx.ReactiveTest.onNext;
var onCompleted = rx.ReactiveTest.onCompleted;
var subscribe = rx.ReactiveTest.subscribe;
var EventEmitter = require('events').EventEmitter;
var serializer = require('riemann/riemann/serializer');

var scheduleMessages = function(messages, messageFunc) {
    var scheduler = new rx.TestScheduler();

    messageFunc = messageFunc || function(message) {
        return socket.setResponseLength(serializer.serializeMessage(message));
    }

    function emitter() {
        var spy = sinon.spy();
        var emitter = new EventEmitter();
        emitter.on('data', spy);
        emitter.on('end', spy);
        return emitter;
    }

    var observables = messages.map(function(message, index) {
        return onNext(index + 1, emitter());
    });

    var xs = scheduler.createColdObservable(observables);

    return {
        observables: xs,
        start: function() {
            return scheduler.startWithCreate(function() {
                return xs.map(function(x, index) {
                    var message = messageFunc(messages[index]);
                    x.emit('data', message);
                    x.emit('end');
                    return x;
                });
            });
        }
    };
}

exports.scheduleMessages = scheduleMessages;
