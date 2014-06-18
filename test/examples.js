var rx = require('rx');
var socket = require('../src/socket')
var helper = require('../src/helpers/test_helpers')
var should = require('should');
var assert = require('assert');

describe('An example subscription', function() {
    it('should be able to filter based on host', function(done) {
        var host1 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "disk /Volumes/Flash",
                "host": "host1",
                "ttl": 10
            }]
        };
        var host2 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "disk /Volumes/Flash",
                "host": "host2",
                "ttl": 10
            }]
        };

        var xs = helper.scheduleMessages([host2, host1]);

        socket.stream(xs.observables, function(s, message) {}).filter(function(message) {
            return message.host === "host1";
        }).subscribe(function(message) {
            message.should.eql(host1.events[0]);
            done();
        });

        xs.start();
    })

    it('should be able to filter based on service', function(done) {
        var service1 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service1",
                "host": "host1",
                "ttl": 10
            }]
        };
        var service2 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service2",
                "host": "host1",
                "ttl": 10
            }]
        };

        var xs = helper.scheduleMessages([service2, service1]);

        socket.stream(xs.observables, function(s, message) {}).filter(function(message) {
            return message.service === "service1";
        }).subscribe(function(message) {
            message.should.eql(service1.events[0]);
            done();
        });

        xs.start();
    })

    it('should be able to react on state changes', function(done) {
        var ok = {
            ok: true,
            events: [{
                "state": "ok",
                "service": "service1",
                "host": "host1",
                "ttl": 10
            }]
        };
        var critical = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service1",
                "host": "host1",
                "ttl": 10
            }]
        };

        var index = 0;
        var xs = helper.scheduleMessages([ok, critical, ok, ok, ok, ok]);


        socket.stream(xs.observables, function(s, message) {})
            .groupBy(function(message) {
                return message.service;
            })
            .flatMap(function(message) {
                return message.distinctUntilChanged(function(event) {
                    return event.state;
                })
            })
            .subscribe(function(message) {
                if (index === 0)
                    message.state.should.eql("ok");
                if (index === 1)
                    message.state.should.eql("critical");
                if (index === 2) {
                    message.state.should.eql("ok");
                    done();
                }

                index++;
            });

        xs.start();
    })
})
