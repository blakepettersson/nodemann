var rx = require('rx');
var serializer = require('riemann/riemann/serializer');
var EventEmitter = require('events').EventEmitter;
var onNext = rx.ReactiveTest.onNext;
var onCompleted = rx.ReactiveTest.onCompleted;
var subscribe = rx.ReactiveTest.subscribe;
var should = require('should');
var assert = require('assert');
var index = require('../src/index');
var NodeCache = require("node-cache");

describe('index', function() {

    it('should mark expired message as expired', function(done) {
        this.timeout(3000);

        var cache = new NodeCache({
            stdTTL: 1,
            checkperiod: 1
        });
        var events = index(cache)({
            host: "test",
            state: "ok",
            service: "test",
            ttl: 1
        }).subscribe(function(e) {
            e.state.should.eql("expired");
            done();
        });
    })
})
