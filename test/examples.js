var rx = require('rx');
var socket = require('../src/socket')
var helper = require('../src/helpers/test_helpers')
var expect = require('chai').expect;

describe('An example subscription', function() {
    it('should be able to filter based on host', function(done) {
        var host1 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "disk /Volumes/Flash",
                "host": "host1",
                "tags": ["a", "b", "c"],
                "ttl": 10
            }]
        };
        var host2 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "disk /Volumes/Flash",
                "host": "host2",
                "tags": ["a", "b", "c"],
                "ttl": 10
            }]
        };

        var xs = helper.scheduleMessages([host2, host1]);

        socket.stream(xs.observables, function(s, message) {}).filter(function(message) {
            return message.host === "host1";
        }).subscribe(function(message) {
            try {
                expect(message).to.deep.equal(host1.events[0]);
                done();
            } catch (err) {
                done(err);
            }
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
                "tags": ["a", "b", "c"],
                "ttl": 10
            }]
        };
        var service2 = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service2",
                "host": "host1",
                "tags": ["a", "b", "c"],
                "ttl": 10
            }]
        };

        var xs = helper.scheduleMessages([service2, service1]);

        socket.stream(xs.observables, function(s, message) {}).filter(function(message) {
            return message.service === "service1";
        }).subscribe(function(message) {
            try {
                expect(message).to.deep.equal(service1.events[0]);
                done();
            } catch (err) {
                done(err);
            }
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
                try {
                    if (index === 0)
                        expect(message.state).to.equal("ok");
                    if (index === 1)
                        expect(message.state).to.equal("critical");
                    if (index === 2) {
                        expect(message.state).to.equal("ok");
                        done();
                    }
                } catch (err) {
                    done(err);
                }


                index++;
            });

        xs.start();
    })

    it('should be able to react on state changes for multiple hosts', function(done) {
        var host1ok = {
            ok: true,
            events: [{
                "state": "ok",
                "service": "service1",
                "host": "host1",
                "ttl": 10
            }]
        };
        var host2ok = {
            ok: true,
            events: [{
                "state": "ok",
                "service": "service1",
                "host": "host2",
                "ttl": 10
            }]
        };

        var host1critical = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service1",
                "host": "host1",
                "ttl": 10
            }]
        };
        var host2critical = {
            ok: true,
            events: [{
                "state": "critical",
                "service": "service1",
                "host": "host2",
                "ttl": 10
            }]
        };

        var index = 0;
        var xs = helper.scheduleMessages([host1ok, host2ok, host2ok, host1critical, host1ok, host1ok, host1ok, host1ok, host2critical]);

        socket.stream(xs.observables, function(s, message) {})
            .groupBy(function(message) {
                return message.host;
            })
            .flatMap(function(message) {
                return message
                    .skipWhile(function(event) {
                        return event.state === "ok"
                    })
                    .distinctUntilChanged(function(event) {
                        return event.state;
                    });
            })
            .subscribe(function(message) {
                try {
                    if (index === 0) {
                        expect(message.host).to.equal("host1");
                        expect(message.state).to.equal("critical");
                    }
                    if (index === 1) {
                        expect(message.host).to.equal("host1");
                        expect(message.state).to.equal("ok");
                    }
                    if (index === 2) {
                        expect(message.host).to.equal("host2");
                        expect(message.state).to.equal("critical");
                        done();
                    }
                } catch (err) {
                    done(err);
                }


                index++;
            });

        xs.start();
    })

    it('should be able to measure metrics per host', function(done) {
        var host1 = {
            ok: true,
            events: [{
                "state": "ok",
                "service": "service1",
                "host": "host1",
                "ttl": 10,
                "metricF": 1
            }]
        };
        var host2 = {
            ok: true,
            events: [{
                "state": "ok",
                "service": "service1",
                "host": "host2",
                "ttl": 10,
                "metricF": 1
            }]
        };

        var index = 0;
        var xs = helper.scheduleMessages([host1, host2, host1, host1, host2, host2, host1, host2]);

        socket.stream(xs.observables, function(s, message) {})
            .groupBy(function(message) {
                return message.host;
            })
            .flatMap(function(host) {
                return host.windowWithCount(2).flatMap(function(event) {
                    return event.toArray();
                })
            })
            .subscribe(function(message) {
                //Output to Graphite or whatever here.
                index++;
                if (index == 3) {
                    done();
                }
            });

        xs.start();
    })

})
