var rx = require('rx');
var socket = require('../src/socket')
var helper = require('../src/helpers/test_helpers')
var serializer = require('riemann/riemann/serializer');
var expect = require('chai').expect;

describe('stream', function() {
    it('should write an ok message to socket if deserialization was successful', function(done) {
        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            expect(ack).to.deep.equal({
                ok: true
            })
        };

        var xs = helper.scheduleMessages([{
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
        }]);

        socket.stream(xs.observables, writeCallback).subscribe(function(message) {
            done();
        });

        xs.start();
    })

    it('should write back an error message to socket if deserialization failed', function(done) {
        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            expect(ack).to.deep.equal({
                ok: false,
                error: 'TypeError: Argument should be a buffer'
            });
            done();
        };

        var xs = helper.scheduleMessages(['some crappy data'], function(message) {
            return message;
        });

        socket.stream(xs.observables, writeCallback).subscribe(function(message) {});

        xs.start();
    })

    it('should still recieve future messages if a message has failed somehow', function(done) {
        var writeCallback = function(s, message) {};

        var xs = helper.scheduleMessages(['some crappy data', socket.setResponseLength(serializer.serializeMessage({
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
        }))], function(message) {
            return message;
        })

        socket.stream(xs.observables, writeCallback).subscribe(function(message) {
            done();
        });

        xs.start();
    })

    it('should set an empty tags array if none already exists', function(done) {
        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            expect(ack).to.deep.equal({
                ok: true
            })
        };

        var xs = helper.scheduleMessages([{
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
        }]);

        socket.stream(xs.observables, writeCallback).subscribe(function(message) {
            expect(message.tags).to.deep.equal([])
            done();
        });

        xs.start();
    })

    it('should not set an empty tags array if a tag array already exists in the message', function(done) {
        var writeCallback = function(s, message) {
            var ack = serializer.deserializeMessage(message.slice(4));
            expect(ack).to.deep.equal({
                ok: true
            })
        };

        var xs = helper.scheduleMessages([{
            ok: true,
            events: [{
                "time": "1402237848",
                "state": "critical",
                "service": "disk /Volumes/Flash",
                "host": "localhost",
                "description": "yes",
                "ttl": 10,
                "metricF": 1,
                "tags": ["a", "b", "c"]
            }]
        }]);

        socket.stream(xs.observables, writeCallback).subscribe(function(message) {
            expect(message.tags).to.deep.equal(["a", "b", "c"])
            done();
        });

        xs.start();
    })

})
