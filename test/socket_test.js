var rx = require('rx');
var sinon = require('sinon');
var socket = require('../src/socket')
var serializer = require('riemann/riemann/serializer');
var EventEmitter = require('events').EventEmitter;
var onNext = rx.ReactiveTest.onNext;
var onCompleted = rx.ReactiveTest.onCompleted;
var subscribe = rx.ReactiveTest.subscribe;
var should = require('should');
var assert = require('assert');

describe('stream', function() {
    it('should write an ok message to socket if deserialization was successful', function(done) {
        var spy = sinon.spy();
        var emitter = new EventEmitter();
        emitter.on('data', spy);
        emitter.on('end', spy);

        var scheduler = new rx.TestScheduler();
        var xs = scheduler.createColdObservable(onNext(1, emitter));

        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            ack.should.eql({
                ok: true
            })
        };

        socket.stream(xs, writeCallback).subscribe(function(message) {
            done();
        });

        var res = scheduler.startWithCreate(function() {
            return xs.map(function(x) {
                emitter.emit('data', socket.setResponseLength(serializer.serializeMessage({
                    ok: true,
                    events: [{
                        "time": "1402237848",
                        "state": "critical",
                        "service": "disk /Volumes/Flash",
                        "host": "localhost",
                        "description": "yes",
                        "ttl": 10,
                        "metricF": 1
                    }]
                })));
                emitter.emit('end');
            });
        });
    })

    it('should write back an error message to socket if deserialization failed', function(done) {
        var spy = sinon.spy();
        var emitter = new EventEmitter();
        emitter.on('data', spy);
        emitter.on('end', spy);

        var scheduler = new rx.TestScheduler();
        var xs = scheduler.createColdObservable(onNext(1, emitter));

        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            ack.should.eql({
                ok: false,
                error: 'TypeError: Argument should be a buffer'
            });
            done();
        };

        socket.stream(xs, writeCallback).subscribe(function(message) {});

        var res = scheduler.startWithCreate(function() {
            return xs.map(function(x) {
                emitter.emit('data', 'some crappy data');
                emitter.emit('end');
            });
        });
    })

    it('should still recieve future messages if a message has failed somehow', function(done) {

        function emitter(index) {
            var spy = sinon.spy();
            var emitter = new EventEmitter();
            emitter.on('data', spy);
            emitter.on('end', spy);
            return emitter;
        }

        var scheduler = new rx.TestScheduler();
        var xs = scheduler.createColdObservable(
            onNext(1, emitter()),
            onNext(2, emitter())
        )

        var index = 0;

        var writeCallback = function(s, message) {};

        socket.stream(xs, writeCallback).subscribe(function(message) {
            done();
        });

        var res = scheduler.startWithCreate(function() {
            return xs.map(function(x, index) {
                if (index === 1) {
                    console.log('emitting crappy data ');
                    x.emit('data', 'some crappy data');
                    x.emit('end');
                } else {
                    console.log('emitting good data ');
                    var message = socket.setResponseLength(serializer.serializeMessage({
                        ok: true,
                        events: [{
                            "time": "1402237848",
                            "state": "critical",
                            "service": "disk /Volumes/Flash",
                            "host": "localhost",
                            "description": "yes",
                            "ttl": 10,
                            "metricF": 1
                        }]
                    }));
                    x.emit('data', message);
                    x.emit('end');
                }
                return x;
            })
        });
    })
})
