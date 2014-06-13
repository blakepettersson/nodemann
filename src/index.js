var rx = require('rx');

var index = function(c) {
    var expiredEvents = rx.Observable.fromEvent(c, 'expired', function(args) {
        return args[1];
    }).map(function(value) {
        value.state = "expired";
        return value;
    });

    return function(event) {
        c.set(event.host + event.service, event, event.ttl, function(err, success) {
            if (!err && success) {
                console.log("added event " + event);
            }
        });

        return expiredEvents;
    }
}

module.exports = exports = index;
